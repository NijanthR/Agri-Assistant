# Agriculture Intelligence Backend (Django)

This backend implements a complete RAG-based agriculture intelligence system with:

- RAG knowledge retrieval over agriculture dataset/documents
- Text-to-SQL analytics over structured agriculture records (SQLite)
- RAG evaluation endpoint (RAGAS when available, heuristic fallback otherwise)
- Intent-based AI agent that selects RAG/SQL/Hybrid tools per query

## 1) Setup

1. Create and activate a Python environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Ensure [backend/.env](backend/.env) contains:

```env
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://apidev.navigatelabsai.com
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
AGRI_DATASET_PATH=C:/Users/srini/Downloads/farmer_advisor_dataset.csv
AGRI_DATASET_PATH=C:/Users/srini/Desktop/AgriAssistant/backend/agricult_data.json
AGRI_STRUCTURED_DATASET_PATH=C:/Users/srini/Downloads/farmer_advisor_dataset.csv
```

4. Run Django:

```bash
python manage.py runserver
```

## 2) Ingest Knowledge Base

Endpoint: `POST /api/ingest/`

```json
{
  "dataset_path": "C:/Users/srini/Downloads/farmer_advisor_dataset.csv",
  "doc_paths": [
    "C:/path/to/agri_guide.txt",
    "C:/path/to/farming_blog.md"
  ]
}
```

This performs:
- text preprocessing
- chunking
- embedding generation
- vector storage (`rag_chunks` table)
- structured table load (`agriculture_records`)

## 3) RAG Query API

Endpoint: `POST /api/rag/`

```json
{ "query": "Which crops are suitable for sandy soil conditions?", "top_k": 5 }
```

## 4) Text-to-SQL API

Endpoint: `POST /api/sql/`

```json
{ "query": "Show crops with the highest average yield" }
```

Returns generated SQL + query rows.

## 5) Agent Chat API

Endpoint: `POST /api/chat/`

```json
{ "message": "Compare fertilizer usage across different crops and explain implications" }
```

Agent workflow:
- Intent understanding (`rag`, `sql`, `hybrid`)
- Tool selection
- Execution
- Final response

## 6) Evaluation API (Explainable AI)

Endpoint: `POST /api/evaluate/`

```json
{
  "samples": [
    {
      "question": "What is best season for tomato?",
      "retrieved_context": ["Tomato grows well in ..."],
      "generated_answer": "Tomato is best in ...",
      "ground_truth": "Tomato is typically cultivated in ..."
    }
  ]
}
```

Metrics:
- Faithfulness
- Answer Relevance
- Context Precision

If `ragas` is installed and configured, RAGAS is used. Otherwise heuristic fallback metrics are returned.
