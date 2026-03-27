import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "agri_ai.sqlite3"

load_dotenv(BASE_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
GOOGLE_GENERATIVE_AI_API_KEY = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", "").strip().strip('"').strip("'")
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")

DEFAULT_DATASET_PATH = os.getenv("AGRI_DATASET_PATH", str(DATA_DIR / "farmer_advisor_dataset.csv"))
DEFAULT_STRUCTURED_DATASET_PATH = os.getenv("AGRI_STRUCTURED_DATASET_PATH", "")
DEFAULT_RAG_TOP_K = int(os.getenv("AGRI_RAG_TOP_K", "5"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
