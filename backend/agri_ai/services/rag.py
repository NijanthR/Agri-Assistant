import re

from typing import Any

from .config import DEFAULT_RAG_TOP_K
from .db import get_conn, init_db
from .embeddings import cosine_similarity, embed_texts, embedding_from_json
from .ingest import ensure_ingested
from .llm import chat_completion


INSUFFICIENT_MARKERS = [
    "insufficient",
    "not enough context",
    "context is missing",
    "information is missing",
    "does not contain information",
    "does not contain",
    "cannot answer",
    "can't answer",
    "unable to answer",
    "do not have enough information",
    "provided context",
]

STOPWORDS = {
    "the",
    "a",
    "an",
    "is",
    "are",
    "to",
    "for",
    "in",
    "on",
    "of",
    "how",
    "what",
    "which",
    "can",
    "i",
    "do",
    "my",
    "and",
    "with",
    "from",
    "by",
    "it",
    "this",
    "that",
    "tree",
}


def _looks_insufficient(answer: str) -> bool:
    normalized = (answer or "").strip().lower()
    if not normalized:
        return True
    return any(marker in normalized for marker in INSUFFICIENT_MARKERS)


def _has_weak_context(contexts: list[dict[str, Any]], threshold: float = 0.2) -> bool:
    if not contexts:
        return True
    best = max((float(item.get("score") or 0.0) for item in contexts), default=0.0)
    return best < threshold


def _important_terms(text: str) -> set[str]:
    tokens = re.findall(r"[a-zA-Z]+", (text or "").lower())
    return {t for t in tokens if len(t) > 2 and t not in STOPWORDS}


def _is_relevant_to_query(query: str, answer: str) -> bool:
    q_terms = _important_terms(query)
    a_terms = _important_terms(answer)
    if not q_terms:
        return True
    overlap = q_terms & a_terms
    return len(overlap) >= 1


def retrieve_context(query: str, top_k: int = DEFAULT_RAG_TOP_K) -> list[dict[str, Any]]:
    ensure_ingested()
    init_db()
    query_embedding = embed_texts([query])[0]

    with get_conn() as conn:
        rows = conn.execute(
            "SELECT chunk_id, source_type, source_name, content, embedding FROM rag_chunks"
        ).fetchall()

    query_terms = _important_terms(query)
    scored = []
    for row in rows:
        raw_embedding = row["embedding"]
        if not raw_embedding:
            continue
        similarity = cosine_similarity(query_embedding, embedding_from_json(raw_embedding))
        content = row["content"]
        content_terms = _important_terms(content)
        overlap = len(query_terms & content_terms) / max(1, len(query_terms))
        combined_score = 0.75 * similarity + 0.25 * overlap
        scored.append(
            {
                "chunk_id": row["chunk_id"],
                "source_type": row["source_type"],
                "source_name": row["source_name"],
                "content": content,
                "score": combined_score,
                "embedding_score": similarity,
                "keyword_overlap": overlap,
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:max(1, top_k)]


def answer_with_rag(query: str, top_k: int = DEFAULT_RAG_TOP_K) -> dict:
    contexts = retrieve_context(query=query, top_k=top_k)
    context_text = "\n\n".join(
        [
            f"[{idx + 1}] ({item['source_type']}::{item['source_name']}) {item['content']}"
            for idx, item in enumerate(contexts)
        ]
    )

    prompt = (
        "Answer the agriculture question using only the provided context. "
        "If the context is insufficient, say what is missing.\n\n"
        f"Question: {query}\n\n"
        f"Context:\n{context_text}\n\n"
        "Return a concise, practical farming response in English only."
    )
    system_prompt = (
        "You are an agriculture assistant. Prioritize factual, context-grounded answers "
        "for farmers and agri-analysts. Always respond in English."
    )
    answer = chat_completion(prompt=prompt, system_prompt=system_prompt)
    used_fallback_llm = False

    # If retrieval is weak or the first answer reports insufficient context,
    # switch to an LLM knowledge fallback while still passing retrieved context.
    if _has_weak_context(contexts) or _looks_insufficient(answer):
        fallback_prompt = (
            "Answer the agriculture question in clear English for farmers. "
            "Use the retrieved context if relevant, but do not refuse the answer when context is incomplete. "
            "If uncertain, give practical best-practice guidance and state assumptions briefly.\n\n"
            f"Question: {query}\n\n"
            f"Retrieved context (may be partial):\n{context_text}\n\n"
            "Return a direct, helpful answer."
        )
        fallback_system_prompt = (
            "You are an expert agriculture advisor. Always respond in English. "
            "Provide practical, safe, and actionable recommendations."
        )
        fallback_answer = chat_completion(prompt=fallback_prompt, system_prompt=fallback_system_prompt)
        if fallback_answer:
            answer = fallback_answer
            used_fallback_llm = True

    # If answer is still off-topic for the user query, use deterministic agri guidance.
    if not answer:
        answer = (
            "I could not generate a response from Gemini right now. "
            "Please retry this agriculture query."
        )

    return {
        "query": query,
        "answer": answer,
        "retrieved_context": contexts,
        "used_fallback_llm": used_fallback_llm,
    }
