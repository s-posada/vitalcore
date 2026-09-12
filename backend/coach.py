"""
coach.py — Coach conversacional de VitalCore con function calling nativo.
===============================================================================
Implementa el chat que usa la aplicación web: habla con la API REST de Gemini y
deja que el modelo invoque herramientas reales sobre la base de datos (leer
biometría, actualizar perfil, registrar el día, generar plan, buscar catálogo).

Por qué no LangChain aquí:
El agente LangChain (`agent.py`) sigue disponible para la SPEC-02, pero importar
ese stack dentro del proceso web agota la memoria del plan gratuito de Render y
el servicio se reinicia (el chat devolvía 503). Esta implementación usa httpx y
el protocolo REST, con las mismas herramientas y sin dependencias pesadas.

Regla arquitectónica: no importa main.py; sólo database, mcp_server, agent
(carga diferida) y gemini_client.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

import gemini_client
from mcp_server import (
    tool_get_user_biometrics,
    tool_record_daily_log,
    tool_search_semantic,
    tool_update_user_profile,
)

MAX_TOOL_ROUNDS = 4
# El plan gratuito de Render arranca en frío y algunos modelos razonan antes de
# responder: un margen corto hacía caer el chat al respaldo de reglas.
REQUEST_TIMEOUT = 55.0

# Herramientas que modifican datos: la UI refresca el dashboard cuando se usan.
MUTATING_TOOLS = {"update_user_profile", "record_daily_log", "generate_nutrition_plan"}

GOAL_VALUES = ["gain_muscle", "lose_fat", "maintain", "improve_endurance", "improve_flexibility"]
ACTIVITY_VALUES = ["sedentary", "light", "moderate", "active", "very_active"]

TOOL_DECLARATIONS: List[Dict[str, Any]] = [
    {
        "name": "get_user_biometrics",
        "description": (
            "Lee el perfil real del usuario en VitalCore: peso, peso objetivo, altura, edad, IMC, "
            "TDEE, objetivo, plan nutricional vigente y últimos registros diarios. "
            "Úsala antes de responder cualquier pregunta sobre sus datos o su progreso."
        ),
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "update_user_profile",
        "description": (
            "Guarda cambios en el perfil del usuario y recalcula IMC y TDEE. "
            "Úsala siempre que el usuario informe su peso actual, su peso objetivo, su altura, "
            "su objetivo o su nivel de actividad."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "weight_kg": {"type": "NUMBER", "description": "Peso actual en kilogramos"},
                "target_weight_kg": {"type": "NUMBER", "description": "Peso objetivo en kilogramos"},
                "height_cm": {"type": "NUMBER", "description": "Estatura en centímetros"},
                "goal": {"type": "STRING", "enum": GOAL_VALUES, "description": "Objetivo del programa"},
                "activity_level": {"type": "STRING", "enum": ACTIVITY_VALUES, "description": "Nivel de actividad física"},
            },
        },
    },
    {
        "name": "record_daily_log",
        "description": (
            "Registra el día de hoy en el dashboard: calorías consumidas, agua, si entrenó y, "
            "opcionalmente, el peso de la jornada. Úsala cuando el usuario cuente lo que comió, "
            "bebió o entrenó hoy."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "calories": {"type": "INTEGER", "description": "Calorías consumidas hoy"},
                "workout_done": {"type": "BOOLEAN", "description": "Si completó su entrenamiento hoy"},
                "water_ml": {"type": "INTEGER", "description": "Mililitros de agua consumidos"},
                "weight_kg": {"type": "NUMBER", "description": "Peso registrado hoy, si lo menciona"},
                "notes": {"type": "STRING", "description": "Nota breve del día"},
            },
            "required": ["calories"],
        },
    },
    {
        "name": "generate_nutrition_plan",
        "description": (
            "Calcula y guarda un plan nutricional nuevo (calorías y macros) a partir del perfil "
            "actual del usuario. Úsala cuando pida un plan, un menú o recalcular sus macros."
        ),
        "parameters": {"type": "OBJECT", "properties": {}},
    },
    {
        "name": "search_catalog",
        "description": (
            "Busca por significado en el catálogo de VitalCore (50 fichas de nutrición y "
            "entrenamiento) para recomendar alimentos, recetas o rutinas concretas."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "Consulta en lenguaje natural"},
                "category": {
                    "type": "STRING",
                    "enum": ["todas", "nutricion", "entrenamiento"],
                    "description": "Filtro de categoría",
                },
            },
            "required": ["query"],
        },
    },
]

SYSTEM_PROMPT = (
    "Eres el Coach VitalCore, asistente de salud y nutrición de precisión de la plataforma VitalCore. "
    "Hablas español de Chile, en tono cercano, profesional y basado en evidencia.\n\n"
    "CÓMO TRABAJAS:\n"
    "- Tienes herramientas conectadas a la base de datos real del usuario. Úsalas, no supongas.\n"
    "- Antes de hablar de su peso, macros, calorías o progreso, llama a get_user_biometrics.\n"
    "- Si el usuario informa un dato nuevo sobre sí mismo (peso, meta, altura, actividad), llama a "
    "update_user_profile en el mismo turno. Si cuenta lo que comió, bebió o entrenó hoy, llama a "
    "record_daily_log.\n"
    "- Nunca digas que guardaste algo sin haber llamado a la herramienta. Cuando la herramienta "
    "responda con éxito, confirma el valor exacto que quedó guardado.\n"
    "- Si un dato es fisiológicamente imposible o parece error de tipeo, pide confirmación antes de guardar.\n\n"
    "ESTILO:\n"
    "- Responde en 2 a 4 frases, sin listas largas ni markdown pesado.\n"
    "- Cifras concretas del usuario antes que consejos genéricos.\n"
    "- Ámbito: salud, nutrición, hábitos, entrenamiento y la membresía de VitalCore. "
    "Si preguntan otra cosa, reconduce con amabilidad.\n"
    "- No diagnosticas ni prescribes tratamientos: VitalCore es un apoyo educativo, no un dispositivo médico."
)


def _tool_payload(db: Session, user_id: int, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Ejecuta una herramienta de dominio. Bloqueante: se llama vía asyncio.to_thread."""
    if name == "get_user_biometrics":
        return tool_get_user_biometrics(db, user_id=user_id)

    if name == "update_user_profile":
        return tool_update_user_profile(
            db, user_id,
            weight_kg=args.get("weight_kg"),
            target_weight_kg=args.get("target_weight_kg"),
            height_cm=args.get("height_cm"),
            goal=args.get("goal"),
            activity_level=args.get("activity_level"),
        )

    if name == "record_daily_log":
        return tool_record_daily_log(
            db, user_id,
            calories_consumed=int(args.get("calories") or 0),
            workout_done=bool(args.get("workout_done", False)),
            water_ml=int(args.get("water_ml") or 2000),
            notes=str(args.get("notes") or ""),
            weight_kg=args.get("weight_kg"),
        )

    if name == "generate_nutrition_plan":
        from agent import generate_nutrition_plan_for_user
        return generate_nutrition_plan_for_user(db, user_id)

    if name == "search_catalog":
        return tool_search_semantic(
            query=str(args.get("query") or ""),
            category=args.get("category") or "todas",
            limit=4,
        )

    return {"error": f"Herramienta '{name}' no disponible."}


def _history_contents(history: Optional[List[Dict[str, Any]]], limit: int = 8) -> List[Dict[str, Any]]:
    contents: List[Dict[str, Any]] = []
    for turn in (history or [])[-limit:]:
        text = str(turn.get("text") or "").strip()[:1000]
        if not text:
            continue
        role = "user" if turn.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": text}]})
    return contents


def _generation_config(model: str) -> Dict[str, Any]:
    config: Dict[str, Any] = {"temperature": 0.35, "maxOutputTokens": 900}
    # En los modelos 2.5 el razonamiento interno consume el presupuesto de salida
    # y puede devolver una respuesta vacía. Se desactiva para respuestas cortas.
    if "2.5" in model:
        config["thinkingConfig"] = {"thinkingBudget": 0}
    return config


def _extract(candidate: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
    parts = (candidate.get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
    calls = [p["functionCall"] for p in parts if isinstance(p, dict) and p.get("functionCall")]
    return text, calls


async def _post(client: httpx.AsyncClient, model: str, payload: Dict[str, Any]) -> httpx.Response:
    return await client.post(
        f"{gemini_client.API_BASE}/models/{model}:generateContent",
        params={"key": gemini_client.get_api_key()},
        json=payload,
    )


# Saturación puntual del modelo o corte de red: reintentar sirve, fallar no.
RETRY_STATUSES = {429, 500, 502, 503, 504}


async def _post_resilient(
    client: httpx.AsyncClient, model: str, payload: Dict[str, Any]
) -> Tuple[Optional[httpx.Response], str]:
    """Envía con reintentos y, si el modelo sigue saturado, prueba el siguiente."""
    delay = 1.2
    res: Optional[httpx.Response] = None
    for attempt in range(3):
        try:
            res = await _post(client, model, payload)
        except httpx.HTTPError as exc:
            gemini_client.note_error(f"red: {type(exc).__name__}: {exc}")
            res = None
        if res is not None and res.status_code not in RETRY_STATUSES:
            return res, model
        if attempt < 2:
            await asyncio.sleep(delay)
            delay *= 2

    alternative = gemini_client.next_candidate(model)
    if alternative:
        try:
            alt_res = await _post(client, alternative, payload)
            if alt_res.status_code == 200:
                return alt_res, alternative
            res = alt_res
        except httpx.HTTPError as exc:
            gemini_client.note_error(f"red (alternativo): {type(exc).__name__}: {exc}")
    return res, model


async def run_coach(
    db: Session,
    user_id: int,
    message: str,
    history: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Conversa con Gemini ejecutando herramientas reales sobre la base de datos.

    Devuelve None si Gemini no está disponible, para que el endpoint pueda
    responder con las reglas deterministas sin romper la experiencia.
    """
    if not gemini_client.has_api_key():
        gemini_client.note_error("GEMINI_API_KEY no está configurada en el entorno.")
        return None

    tools_used: List[str] = []
    contents = _history_contents(history)
    if not contents or contents[-1].get("role") != "user":
        contents.append({"role": "user", "parts": [{"text": message}]})
    elif contents[-1]["parts"][0].get("text") != message:
        contents.append({"role": "user", "parts": [{"text": message}]})

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        model = await gemini_client.resolve_model(client)
        if not model:
            return None

        payload_base = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "tools": [{"functionDeclarations": TOOL_DECLARATIONS}],
            "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}},
            "generationConfig": _generation_config(model),
        }

        for _ in range(MAX_TOOL_ROUNDS):
            res, model = await _post_resilient(client, model, {**payload_base, "contents": contents})
            if res is None:
                return None

            if res.status_code == 404:
                # El modelo cacheado dejó de existir: se vuelve a descubrir una vez.
                gemini_client.invalidate_model()
                model = await gemini_client.resolve_model(client, force=True)
                if not model:
                    return None
                payload_base["generationConfig"] = _generation_config(model)
                res = await _post(client, model, {**payload_base, "contents": contents})

            if res.status_code != 200:
                gemini_client.note_error(f"generateContent {res.status_code}: {res.text[:200]}")
                return None

            data = res.json()
            candidates = data.get("candidates") or []
            if not candidates:
                reason = (data.get("promptFeedback") or {}).get("blockReason", "sin candidatos")
                gemini_client.note_error(f"Respuesta sin candidatos ({reason}).")
                return None

            text, calls = _extract(candidates[0])

            if not calls:
                if not text:
                    gemini_client.note_error(
                        f"Respuesta vacía (finishReason={candidates[0].get('finishReason')})."
                    )
                    return None
                return {
                    "reply": text,
                    "source": "gemini",
                    "model": model,
                    "tools_used": tools_used,
                    "data_changed": any(t in MUTATING_TOOLS for t in tools_used),
                }

            contents.append(candidates[0]["content"])
            response_parts = []
            for call in calls:
                name = call.get("name", "")
                args = call.get("args") or {}
                try:
                    result = await asyncio.to_thread(_tool_payload, db, user_id, name, args)
                except Exception as exc:
                    result = {"error": f"{type(exc).__name__}: {exc}"}
                if name not in tools_used:
                    tools_used.append(name)
                response_parts.append({
                    "functionResponse": {"name": name, "response": {"result": result}}
                })
            contents.append({"role": "user", "parts": response_parts})

    gemini_client.note_error("Se alcanzó el máximo de rondas de herramientas sin respuesta final.")
    return None


def tool_labels(tools_used: List[str]) -> List[str]:
    """Etiquetas legibles de las herramientas ejecutadas, para mostrar en la UI."""
    labels = {
        "get_user_biometrics": "Leyó tu perfil",
        "update_user_profile": "Actualizó tu perfil",
        "record_daily_log": "Registró tu día",
        "generate_nutrition_plan": "Generó tu plan",
        "search_catalog": "Buscó en el catálogo",
    }
    return [labels.get(t, t) for t in tools_used]


def json_preview(value: Any, limit: int = 400) -> str:
    """Serialización corta y segura para logs."""
    try:
        return json.dumps(value, ensure_ascii=False)[:limit]
    except Exception:
        return str(value)[:limit]
