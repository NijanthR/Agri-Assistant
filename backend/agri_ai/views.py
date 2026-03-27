import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .services.agent import run_agent
from .services.evaluator import evaluate_samples
from .services.ingest import ingest_dataset, ingest_documents
from .services.rag import answer_with_rag
from .services.sql_agent import ask_sql


def _read_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


@csrf_exempt
@require_http_methods(["POST"])
def ingest_view(request):
    payload = _read_json(request)
    dataset_path = payload.get("dataset_path")
    doc_paths = payload.get("doc_paths") or []

    dataset_result = ingest_dataset(dataset_path)
    documents_result = ingest_documents(doc_paths) if doc_paths else {"ok": True, "chunks_inserted": 0}

    ok = dataset_result.get("ok") and documents_result.get("ok")
    return JsonResponse(
        {
            "ok": bool(ok),
            "dataset": dataset_result,
            "documents": documents_result,
        },
        status=200 if ok else 400,
    )


@csrf_exempt
@require_http_methods(["POST"])
def rag_query_view(request):
    payload = _read_json(request)
    query = (payload.get("query") or payload.get("message") or "").strip()
    top_k = int(payload.get("top_k") or 5)
    if not query:
        return JsonResponse({"ok": False, "error": "'query' is required."}, status=400)

    result = answer_with_rag(query=query, top_k=top_k)
    return JsonResponse({"ok": True, **result})


@csrf_exempt
@require_http_methods(["POST"])
def sql_query_view(request):
    payload = _read_json(request)
    query = (payload.get("query") or payload.get("message") or "").strip()
    if not query:
        return JsonResponse({"ok": False, "error": "'query' is required."}, status=400)

    try:
        result = ask_sql(query)
        return JsonResponse({"ok": True, **result})
    except Exception as exc:
        return JsonResponse({"ok": False, "error": str(exc)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def evaluate_view(request):
    payload = _read_json(request)
    samples = payload.get("samples") or []
    if not isinstance(samples, list) or not samples:
        return JsonResponse(
            {
                "ok": False,
                "error": "'samples' must be a non-empty list of {question, retrieved_context, generated_answer, ground_truth}.",
            },
            status=400,
        )

    result = evaluate_samples(samples)
    return JsonResponse({"ok": True, **result})


@csrf_exempt
@require_http_methods(["POST"])
def chat_view(request):
    payload = _read_json(request)
    message = (payload.get("message") or "").strip()
    if not message:
        return JsonResponse({"ok": False, "error": "'message' is required."}, status=400)

    result = run_agent(message)
    return JsonResponse({"ok": True, **result})
