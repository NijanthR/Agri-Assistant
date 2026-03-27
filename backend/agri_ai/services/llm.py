import json
import urllib.error
import urllib.parse
import urllib.request
from .config import GEMINI_CHAT_MODEL, GOOGLE_GENERATIVE_AI_API_KEY


def _gemini_completion(prompt: str, system_prompt: str) -> str:
    if not GOOGLE_GENERATIVE_AI_API_KEY:
        return ""

    full_prompt = f"System instruction:\n{system_prompt}\n\nUser request:\n{prompt}"
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{urllib.parse.quote(GEMINI_CHAT_MODEL)}:generateContent"
        f"?key={urllib.parse.quote(GOOGLE_GENERATIVE_AI_API_KEY)}"
    )
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }

    try:
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
        raw = json.loads(body)
    except urllib.error.HTTPError as exc:
        try:
            error_text = exc.read().decode("utf-8")
        except Exception:
            error_text = ""
        if exc.code == 429 or "RESOURCE_EXHAUSTED" in error_text:
            return "Gemini API quota exceeded. Please retry later or increase Gemini API quota."
        return ""
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return ""

    candidates = raw.get("candidates") or []
    for candidate in candidates:
        content = candidate.get("content") or {}
        parts = content.get("parts") or []
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        joined = "\n".join([t for t in texts if t]).strip()
        if joined:
            return joined
    return ""


def chat_completion(prompt: str, system_prompt: str) -> str:
    return _gemini_completion(prompt=prompt, system_prompt=system_prompt)
