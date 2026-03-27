import re
from typing import Any

from .db import get_conn, init_db
from .ingest import ensure_ingested
from .llm import chat_completion

ALLOWED_TABLE = "agriculture_records"

SQL_SYSTEM_PROMPT = """
You translate natural language agriculture analytics requests into SQL for SQLite.
Rules:
1) Return only one SQL query.
2) Use only SELECT statements.
3) Use table agriculture_records with columns:
   farm_id, soil_ph, soil_moisture, temperature_c, rainfall_mm, crop_type,
   fertilizer_usage_kg, pesticide_usage_kg, crop_yield_ton, sustainability_score, source.
4) Prefer aggregated answers for comparison/ranking questions.
5) Never use INSERT/UPDATE/DELETE/DROP/ALTER/PRAGMA/ATTACH.
""".strip()


def _clean_sql(sql: str) -> str:
    sql = sql.strip().strip("`")
    sql = re.sub(r"^sql", "", sql, flags=re.IGNORECASE).strip()
    return sql.rstrip(";") + ";"


def _is_safe_sql(sql: str) -> bool:
    normalized = sql.strip().lower()
    if not normalized.startswith("select"):
        return False

    banned = ["insert", "update", "delete", "drop", "alter", "pragma", "attach", "detach"]
    if any(word in normalized for word in banned):
        return False

    return ALLOWED_TABLE in normalized


def _fallback_sql(question: str) -> str:
    q = question.lower()
    if "highest" in q and ("yield" in q or "crop_yield_ton" in q):
        return (
            "SELECT crop_type, AVG(crop_yield_ton) AS avg_yield "
            "FROM agriculture_records "
            "GROUP BY crop_type "
            "ORDER BY avg_yield DESC "
            "LIMIT 10;"
        )
    if "fertilizer" in q and ("compare" in q or "across" in q):
        return (
            "SELECT crop_type, AVG(fertilizer_usage_kg) AS avg_fertilizer_kg "
            "FROM agriculture_records "
            "GROUP BY crop_type "
            "ORDER BY avg_fertilizer_kg DESC;"
        )
    if "water" in q or "rainfall" in q:
        return "SELECT SUM(rainfall_mm) AS total_rainfall_mm FROM agriculture_records;"
    return (
        "SELECT crop_type, AVG(crop_yield_ton) AS avg_yield, AVG(sustainability_score) AS avg_sustainability "
        "FROM agriculture_records GROUP BY crop_type ORDER BY avg_yield DESC;"
    )


def generate_sql(question: str) -> str:
    prompt = f"Question: {question}\nReturn SQL only."
    llm_sql = chat_completion(prompt=prompt, system_prompt=SQL_SYSTEM_PROMPT)
    sql = _clean_sql(llm_sql) if llm_sql else _fallback_sql(question)
    if not _is_safe_sql(sql):
        sql = _fallback_sql(question)
    return sql


def run_sql_query(sql: str) -> list[dict[str, Any]]:
    init_db()
    if not _is_safe_sql(sql):
        raise ValueError("Unsafe SQL rejected.")

    with get_conn() as conn:
        rows = conn.execute(sql).fetchall()
    return [dict(row) for row in rows]


def ask_sql(question: str) -> dict[str, Any]:
    ensure_ingested()
    sql = generate_sql(question)
    rows = run_sql_query(sql)
    return {
        "question": question,
        "sql": sql,
        "rows": rows,
    }
