import csv
import json
import re
from pathlib import Path
from typing import Iterable

from .config import DEFAULT_DATASET_PATH, DEFAULT_STRUCTURED_DATASET_PATH
from .db import get_conn, init_db
from .embeddings import embed_texts, embedding_to_json


NUMERIC_COLUMNS = {
    "farm_id": int,
    "soil_ph": float,
    "soil_moisture": float,
    "temperature_c": float,
    "rainfall_mm": float,
    "fertilizer_usage_kg": float,
    "pesticide_usage_kg": float,
    "crop_yield_ton": float,
    "sustainability_score": float,
}


def _normalize_key(key: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", key.strip().lower()).strip("_")


def _to_row(raw_row: dict) -> dict:
    row = {_normalize_key(k): v for k, v in raw_row.items()}
    out = {}
    for col, caster in NUMERIC_COLUMNS.items():
        value = row.get(col)
        if value in (None, ""):
            out[col] = None
        else:
            try:
                out[col] = caster(value)
            except Exception:
                out[col] = None
    out["crop_type"] = (row.get("crop_type") or "").strip() or None
    out["source"] = "dataset"
    return out


def _row_to_text(row: dict) -> str:
    return (
        f"Farm {row.get('farm_id')} has soil pH {row.get('soil_ph')}, "
        f"soil moisture {row.get('soil_moisture')}%, temperature {row.get('temperature_c')}C, "
        f"rainfall {row.get('rainfall_mm')} mm, crop {row.get('crop_type')}, "
        f"fertilizer {row.get('fertilizer_usage_kg')} kg, pesticide {row.get('pesticide_usage_kg')} kg, "
        f"yield {row.get('crop_yield_ton')} tons and sustainability score {row.get('sustainability_score')}."
    )


def _clean_text(text: str) -> str:
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[\t ]+", " ", text)
    return text.strip()


def _chunk_text(text: str, chunk_size: int = 650, overlap: int = 120) -> list[str]:
    text = _clean_text(text)
    if len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(0, end - overlap)
    return chunks


def _insert_records(records: Iterable[dict]) -> int:
    records = list(records)
    if not records:
        return 0

    with get_conn() as conn:
        conn.execute("DELETE FROM agriculture_records")
        conn.executemany(
            """
            INSERT INTO agriculture_records (
                farm_id, soil_ph, soil_moisture, temperature_c, rainfall_mm,
                crop_type, fertilizer_usage_kg, pesticide_usage_kg, crop_yield_ton,
                sustainability_score, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    r.get("farm_id"),
                    r.get("soil_ph"),
                    r.get("soil_moisture"),
                    r.get("temperature_c"),
                    r.get("rainfall_mm"),
                    r.get("crop_type"),
                    r.get("fertilizer_usage_kg"),
                    r.get("pesticide_usage_kg"),
                    r.get("crop_yield_ton"),
                    r.get("sustainability_score"),
                    r.get("source", "dataset"),
                )
                for r in records
            ],
        )
    return len(records)


def _insert_chunks(chunks: list[tuple[str, str, str]]) -> int:
    if not chunks:
        return 0

    contents = [item[2] for item in chunks]
    embeddings = embed_texts(contents)

    with get_conn() as conn:
        conn.execute("DELETE FROM rag_chunks")
        conn.executemany(
            "INSERT INTO rag_chunks (source_type, source_name, content, embedding) VALUES (?, ?, ?, ?)",
            [
                (source_type, source_name, content, embedding_to_json(vector))
                for (source_type, source_name, content), vector in zip(chunks, embeddings)
            ],
        )
    return len(chunks)


def _load_csv_dataset(path: Path) -> tuple[list[dict], list[tuple[str, str, str]]]:
    records = []
    chunks = []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for raw_row in reader:
            row = _to_row(raw_row)
            records.append(row)
            chunks.append(("dataset_row", path.name, _row_to_text(row)))
    return records, chunks


def _load_json_dataset(path: Path) -> tuple[list[dict], list[tuple[str, str, str]]]:
    payload = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    if isinstance(payload, dict):
        payload = [payload]
    if not isinstance(payload, list):
        return [], []

    records = []
    chunks = []
    for item in payload:
        if not isinstance(item, dict):
            continue

        normalized = {_normalize_key(str(k)): v for k, v in item.items()}
        has_structured = any(k in normalized for k in ["crop_type", "soil_ph", "crop_yield_ton", "farm_id"])
        if has_structured:
            records.append(_to_row(item))

        instruction = str(item.get("instruction", "")).strip()
        question = str(item.get("input", item.get("question", ""))).strip()
        answer = str(item.get("response", item.get("answer", ""))).strip()

        if question or answer:
            qa_text = "\n".join(
                [
                    f"Instruction: {instruction}" if instruction else "",
                    f"Question: {question}" if question else "",
                    f"Answer: {answer}" if answer else "",
                ]
            ).strip()
            for chunk in _chunk_text(qa_text):
                chunks.append(("dataset_qa", path.name, chunk))
        else:
            free_text = _clean_text(json.dumps(item, ensure_ascii=False))
            for chunk in _chunk_text(free_text):
                chunks.append(("dataset_json", path.name, chunk))

    return records, chunks


def ingest_dataset(csv_path: str | None = None) -> dict:
    init_db()
    resolved_path = Path(csv_path or DEFAULT_DATASET_PATH).expanduser()
    if not resolved_path.exists():
        return {"ok": False, "error": f"Dataset not found: {resolved_path}"}

    extension = resolved_path.suffix.lower()
    if extension == ".json":
        records, chunks = _load_json_dataset(resolved_path)
        if not records and DEFAULT_STRUCTURED_DATASET_PATH:
            structured_path = Path(DEFAULT_STRUCTURED_DATASET_PATH).expanduser()
            if structured_path.exists() and structured_path.suffix.lower() == ".csv":
                records, _ = _load_csv_dataset(structured_path)
    else:
        records, chunks = _load_csv_dataset(resolved_path)

    record_count = _insert_records(records)
    chunk_count = _insert_chunks(chunks)
    return {
        "ok": True,
        "dataset_path": str(resolved_path),
        "records_inserted": record_count,
        "chunks_inserted": chunk_count,
    }


def ingest_documents(doc_paths: list[str]) -> dict:
    init_db()
    rows = []
    for raw_path in doc_paths:
        p = Path(raw_path).expanduser()
        if not p.exists() or not p.is_file():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for chunk in _chunk_text(text):
            rows.append(("document", p.name, chunk))

    count = _insert_chunks(rows)
    return {"ok": True, "chunks_inserted": count}


def ensure_ingested(default_dataset_path: str | None = None) -> dict:
    init_db()
    with get_conn() as conn:
        record_count = conn.execute("SELECT COUNT(*) AS c FROM agriculture_records").fetchone()["c"]
        chunk_count = conn.execute("SELECT COUNT(*) AS c FROM rag_chunks").fetchone()["c"]

    if chunk_count > 0:
        return {
            "ok": True,
            "already_present": True,
            "records": record_count,
            "chunks": chunk_count,
        }

    result = ingest_dataset(default_dataset_path)
    result["already_present"] = False
    return result
