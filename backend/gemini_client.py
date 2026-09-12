"""
gemini_client.py — Configuración y resolución de modelo para la API de Gemini.
===============================================================================
Punto único de verdad para hablar con Google Generative Language desde VitalCore.

Por qué existe:
Los nombres de modelo de Gemini se retiran con el tiempo. Cuando el backend tenía
el modelo escrito a mano, la API respondía 404, el error se descartaba en silencio
y el coach caía siempre en respuestas enlatadas. Aquí el modelo se descubre en
caliente contra `GET /models`, se cachea por proceso y el último error queda
disponible para diagnóstico en `/api/ai/diagnostics`.

Regla arquitectónica: este módulo no importa main.py ni ningún router.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Orden de preferencia. El primero disponible en la cuenta es el que se usa.
# `gemini-flash-latest` es un alias que Google mantiene apuntando al flash
# vigente: no caduca y responde en ~1 s, mientras que los modelos de
# razonamiento extendido tardan más de un minuto y no sirven para un chat.
DEFAULT_CANDIDATES: List[str] = [
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
]

# Modelos que nunca sirven para conversar aunque expongan generateContent.
_EXCLUDED_HINTS = ("embedding", "aqa", "image", "vision", "tts", "audio", "live")

_state: Dict[str, Any] = {
    "model": None,          # modelo resuelto y verificado
    "available": [],        # modelos con generateContent en la cuenta
    "last_error": None,     # último error legible (sin credenciales)
    "resolved": False,      # ya se intentó resolver en este proceso
}


def get_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def has_api_key() -> bool:
    return bool(get_api_key())


def candidates() -> List[str]:
    """Candidatos en orden: el de la variable de entorno primero, sin duplicados."""
    forced = os.getenv("GEMINI_MODEL", "").strip()
    ordered = ([forced] if forced else []) + DEFAULT_CANDIDATES
    seen, unique = set(), []
    for name in ordered:
        clean = name.replace("models/", "").strip()
        if clean and clean not in seen:
            seen.add(clean)
            unique.append(clean)
    return unique


def _pick(available: List[str]) -> Optional[str]:
    """Elige el mejor modelo disponible siguiendo la lista de candidatos."""
    if not available:
        return None
    for wanted in candidates():
        if wanted in available:
            return wanted
    usable = [
        m for m in available
        if not any(hint in m for hint in _EXCLUDED_HINTS) and "gemini" in m
    ]
    flash = [m for m in usable if "flash" in m and "exp" not in m]
    if flash:
        return sorted(flash, key=len)[0]
    return sorted(usable, key=len)[0] if usable else None


def _parse_models(payload: Dict[str, Any]) -> List[str]:
    names = []
    for model in payload.get("models", []):
        if "generateContent" in model.get("supportedGenerationMethods", []):
            names.append(str(model.get("name", "")).replace("models/", ""))
    return [n for n in names if n]


def _fail(message: str) -> None:
    """Guarda un error legible, nunca la URL (lleva la API key como query param)."""
    _state["last_error"] = message[:300]


async def resolve_model(client: httpx.AsyncClient, force: bool = False) -> Optional[str]:
    """Descubre y cachea un modelo conversacional válido para la API key actual."""
    if _state["model"] and not force:
        return _state["model"]
    key = get_api_key()
    if not key:
        _fail("GEMINI_API_KEY no está configurada en el entorno.")
        _state["resolved"] = True
        return None
    try:
        res = await client.get(f"{API_BASE}/models", params={"key": key, "pageSize": 200})
        if res.status_code != 200:
            _fail(f"ListModels respondió {res.status_code}: {res.text[:160]}")
            _state["resolved"] = True
            # Sin listado usable, se intenta igualmente con el primer candidato.
            return candidates()[0]
        available = _parse_models(res.json())
        _state["available"] = available
        chosen = _pick(available)
        _state["model"] = chosen
        _state["resolved"] = True
        if chosen:
            _state["last_error"] = None
        else:
            _fail("La API key no expone ningún modelo con generateContent.")
        return chosen
    except Exception as exc:  # red caída, DNS, timeout
        _fail(f"No se pudo listar modelos: {type(exc).__name__}: {exc}")
        _state["resolved"] = True
        return candidates()[0]


def resolve_model_sync(force: bool = False) -> Optional[str]:
    """Versión bloqueante para contextos sin event loop (agente LangChain, scripts)."""
    if _state["model"] and not force:
        return _state["model"]
    key = get_api_key()
    if not key:
        _fail("GEMINI_API_KEY no está configurada en el entorno.")
        return None
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(f"{API_BASE}/models", params={"key": key, "pageSize": 200})
            if res.status_code != 200:
                _fail(f"ListModels respondió {res.status_code}: {res.text[:160]}")
                return candidates()[0]
            available = _parse_models(res.json())
            _state["available"] = available
            chosen = _pick(available)
            _state["model"] = chosen
            if chosen:
                _state["last_error"] = None
            return chosen or candidates()[0]
    except Exception as exc:
        _fail(f"No se pudo listar modelos: {type(exc).__name__}: {exc}")
        return candidates()[0]


def next_candidate(current: Optional[str]) -> Optional[str]:
    """Siguiente modelo disponible distinto al actual, para sobrevivir a un 503."""
    available = _state["available"]
    for wanted in candidates():
        if wanted != current and (not available or wanted in available):
            return wanted
    return None


def active_model() -> Optional[str]:
    """Modelo ya resuelto, sin llamadas de red."""
    return _state["model"]


def note_error(message: str) -> None:
    _fail(message)


def invalidate_model() -> None:
    """Fuerza una nueva resolución (p. ej. tras un 404 del modelo cacheado)."""
    _state["model"] = None
    _state["resolved"] = False


def status() -> Dict[str, Any]:
    """Diagnóstico sin secretos, apto para exponer en un endpoint."""
    return {
        "gemini_key_present": has_api_key(),
        "model_in_use": _state["model"],
        "model_candidates": candidates(),
        "models_available_count": len(_state["available"]),
        "models_available_sample": _state["available"][:12],
        "last_error": _state["last_error"],
        "resolved": _state["resolved"],
    }
