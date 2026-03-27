from __future__ import annotations

import math
import re
from statistics import mean
from typing import Any


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]+", (text or "").lower()))


def _jaccard(a: str, b: str) -> float:
    ta = _tokenize(a)
    tb = _tokenize(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(1, len(ta | tb))


def _context_coverage(answer: str, contexts: list[str]) -> float:
    answer_tokens = _tokenize(answer)
    context_tokens = set()
    for c in contexts:
        context_tokens |= _tokenize(c)
    if not answer_tokens:
        return 0.0
    return len(answer_tokens & context_tokens) / len(answer_tokens)


def evaluate_with_ragas_if_available(samples: list[dict[str, Any]]) -> dict[str, Any] | None:
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy, context_precision
    except Exception:
        return None

    try:
        payload = {
            "question": [item.get("question", "") for item in samples],
            "answer": [item.get("generated_answer", "") for item in samples],
            "contexts": [item.get("retrieved_context", []) for item in samples],
            "ground_truth": [item.get("ground_truth", "") for item in samples],
        }
        dataset = Dataset.from_dict(payload)
        result = evaluate(dataset=dataset, metrics=[faithfulness, answer_relevancy, context_precision])
        return {
            "framework": "ragas",
            "metrics": result.to_pydict() if hasattr(result, "to_pydict") else dict(result),
        }
    except Exception:
        return None


def evaluate_samples(samples: list[dict[str, Any]]) -> dict[str, Any]:
    ragas_result = evaluate_with_ragas_if_available(samples)
    if ragas_result is not None:
        return ragas_result

    rows = []
    for item in samples:
        question = item.get("question", "")
        answer = item.get("generated_answer", "")
        contexts = item.get("retrieved_context", [])
        if contexts and isinstance(contexts[0], dict):
            contexts = [c.get("content", "") for c in contexts]
        ground_truth = item.get("ground_truth", "")

        answer_relevance = _jaccard(question, answer)
        context_precision = _context_coverage(answer, contexts)
        faithfulness = _jaccard(answer, " ".join(contexts))
        gt_alignment = _jaccard(answer, ground_truth) if ground_truth else math.nan

        rows.append(
            {
                "question": question,
                "faithfulness": round(faithfulness, 4),
                "answer_relevance": round(answer_relevance, 4),
                "context_precision": round(context_precision, 4),
                "ground_truth_alignment": round(gt_alignment, 4) if not math.isnan(gt_alignment) else None,
            }
        )

    return {
        "framework": "heuristic-fallback",
        "aggregate": {
            "faithfulness": round(mean([r["faithfulness"] for r in rows]), 4) if rows else 0.0,
            "answer_relevance": round(mean([r["answer_relevance"] for r in rows]), 4) if rows else 0.0,
            "context_precision": round(mean([r["context_precision"] for r in rows]), 4) if rows else 0.0,
        },
        "rows": rows,
    }
