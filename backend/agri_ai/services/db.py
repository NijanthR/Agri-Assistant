import sqlite3
from contextlib import contextmanager

from .config import DB_PATH


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS agriculture_records (
    row_id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER,
    soil_ph REAL,
    soil_moisture REAL,
    temperature_c REAL,
    rainfall_mm REAL,
    crop_type TEXT,
    fertilizer_usage_kg REAL,
    pesticide_usage_kg REAL,
    crop_yield_ton REAL,
    sustainability_score REAL,
    source TEXT DEFAULT 'dataset'
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_name TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_crop_type ON agriculture_records(crop_type);
CREATE INDEX IF NOT EXISTS idx_chunks_source_name ON rag_chunks(source_name);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA_SQL)
