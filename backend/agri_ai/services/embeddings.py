import hashlib
import json
import math
from typing import Iterable, List

from openai import OpenAI

from .config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_EMBEDDING_MODEL


def _fallback_embedding(text: str, dim: int = 128) -> List[float]:
    vector = [0.0] * dim
    for token in text.lower().split():
        idx = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % dim
        vector[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def _get_openai_client() -> OpenAI | None:
    if not OPENAI_API_KEY:
        return None
    kwargs = {"api_key": OPENAI_API_KEY}
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return OpenAI(**kwargs)


def embed_texts(texts: Iterable[str]) -> List[List[float]]:
    text_list = list(texts)
    if not text_list:
        return []

    client = _get_openai_client()
    if client is None:
        return [_fallback_embedding(text) for text in text_list]

    try:
        response = client.embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=text_list)
        return [item.embedding for item in response.data]
    except Exception:
        return [_fallback_embedding(text) for text in text_list]


def embedding_to_json(embedding: List[float]) -> str:
    return json.dumps(embedding)


def embedding_from_json(raw: str) -> List[float]:
    return json.loads(raw)


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    denom = norm_a * norm_b
    return (dot / denom) if denom else 0.0
