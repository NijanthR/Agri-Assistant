from .rag import answer_with_rag
from .sql_agent import ask_sql


INTENT_SYSTEM_PROMPT = """
Classify the user agriculture query intent into one of: rag, sql, hybrid.
Return JSON with keys: intent, reason.
- rag: recommendation/knowledge lookup/explanatory query.
- sql: analytical query over structured dataset (totals, averages, compare, top-k, ranking).
- hybrid: requires both analysis and explanation.
""".strip()

NON_AGRI_REPLY = "I am an agriculture assistant. I do not have knowledge outside agriculture topics."

AGRI_KEYWORDS = {
    "agri",
    "agriculture",
    "farm",
    "farming",
    "farmer",
    "crop",
    "soil",
    "irrigation",
    "fertilizer",
    "pesticide",
    "yield",
    "harvest",
    "seed",
    "weed",
    "pest",
    "disease",
    "orchard",
    "horticulture",
    "livestock",
    "dairy",
    "rainfall",
    "monsoon",
    "kharif",
    "rabi",
    "sugarcane",
    "wheat",
    "rice",
    "maize",
    "tomato",
    "cotton",
    "tree",
    "orchard",
    "coconut",
    "cocunut",
    "cocoanut",
    "beetle",
    "beetles",
    "bettle",
    "insect",
    "attack",
    "leaf",
    "stem",
    "root",
}


def is_agriculture_query(message: str) -> bool:
    lower = message.lower()
    return any(keyword in lower for keyword in AGRI_KEYWORDS)


def detect_intent(message: str) -> str:
    lower = message.lower()
    sql_keywords = ["average", "avg", "total", "sum", "compare", "highest", "lowest", "top", "rank"]
    if any(k in lower for k in sql_keywords):
        return "sql"
    hybrid_keywords = ["compare", "analysis", "and explain", "insight"]
    if any(k in lower for k in hybrid_keywords):
        return "hybrid"
    return "rag"


def run_agent(message: str) -> dict:
    if not is_agriculture_query(message):
        return {
            "intent": "out_of_scope",
            "reply": NON_AGRI_REPLY,
            "sql": None,
            "rag": None,
        }

    intent = detect_intent(message)

    if intent == "sql":
        sql_result = ask_sql(message)
        return {
            "intent": "sql",
            "reply": f"I used SQL analysis.\\nSQL: {sql_result['sql']}\\nResults: {sql_result['rows'][:10]}",
            "sql": sql_result,
            "rag": None,
        }

    if intent == "hybrid":
        sql_result = ask_sql(message)
        rag_result = answer_with_rag(message)
        reply = (
            "I used both structured analysis and retrieved context.\n\n"
            f"SQL Summary: {sql_result['rows'][:5]}\n\n"
            f"Knowledge Summary: {rag_result['answer']}"
        )
        return {
            "intent": "hybrid",
            "reply": reply,
            "sql": sql_result,
            "rag": rag_result,
        }

    rag_result = answer_with_rag(message)
    return {
        "intent": "rag",
        "reply": rag_result["answer"],
        "sql": None,
        "rag": rag_result,
    }
