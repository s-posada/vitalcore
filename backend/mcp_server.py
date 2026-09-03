"""
VitalCore — Servidor MCP (Model Context Protocol) & Agentic Tool Engine
========================================================================
Expone el protocolo estándar de herramientas y contexto para modelos de lenguaje (Gemini/Claude).
Permite al asistente virtual consultar la base de datos viva del usuario, ejecutar búsquedas
semánticas vectoriales y registrar telemetría de forma autónoma con Function Calling.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from database import User, UserProfile, NutritionPlan, WorkoutPlan, DailyLog
from semantic_engine import semantic_engine
from datetime import datetime

# ── DEFINICIÓN DE HERRAMIENTAS MCP (MANIFEST) ──────────────────────────────────
MCP_TOOLS_MANIFEST = [
    {
        "name": "get_user_biometrics_and_progress",
        "description": "Obtiene los datos biométricos actuales del usuario, su objetivo, estado de suscripción y últimos registros de actividad diaria (calorías, racha, peso).",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "ID numérico del usuario en VitalCore"
                }
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "search_catalog_semantic",
        "description": "Ejecuta una búsqueda semántica vectorial en el catálogo de VitalCore (nutrición, ejercicios y meditaciones) utilizando lenguaje natural (ej: 'almuerzo rico en proteina sin lactosa', 'dolor de rodilla', 'estres laboral').",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Consulta en lenguaje natural expresada por el usuario"
                },
                "category": {
                    "type": "string",
                    "enum": ["todas", "nutricion", "entrenamiento", "meditacion"],
                    "description": "Categoría específica a filtrar o 'todas'"
                },
                "limit": {
                    "type": "integer",
                    "description": "Cantidad máxima de resultados (por defecto 3)"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "record_daily_log_quick",
        "description": "Registra una entrada de telemetría diaria para el usuario cuando este informa en el chat lo que comió o entrenó.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "ID del usuario"
                },
                "calories_consumed": {
                    "type": "integer",
                    "description": "Calorías totales consumidas en el día"
                },
                "workout_done": {
                    "type": "boolean",
                    "description": "Si realizó o no su sesión de entrenamiento"
                },
                "water_ml": {
                    "type": "integer",
                    "description": "Mililitros de agua ingeridos (ej: 2000)"
                },
                "notes": {
                    "type": "string",
                    "description": "Notas o resumen de la comida y sensación del usuario"
                }
            },
            "required": ["user_id", "calories_consumed"]
        }
    }
]


# ── IMPLEMENTACIÓN DE LAS FUNCIONES DE HERRAMIENTA ─────────────────────────────
def tool_get_user_biometrics(db: Session, user_id: int) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": f"Usuario {user_id} no encontrado en la base de datos."}

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == user_id).order_by(NutritionPlan.created_at.desc()).first()
    logs = db.query(DailyLog).filter(DailyLog.user_id == user_id).order_by(DailyLog.date.desc()).limit(5).all()

    recent_summary = []
    for l in logs:
        recent_summary.append({
            "date": l.date,
            "calories": l.calories_consumed,
            "weight_kg": l.weight_kg,
            "workout_done": l.workout_done,
            "water_ml": l.water_ml
        })

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "tier": user.tier,
        "profile": {
            "age": profile.age if profile else 28,
            "weight_kg": profile.weight_kg if profile else 75.0,
            "target_weight_kg": profile.target_weight_kg if profile else 70.0,
            "goal": profile.goal if profile else "general_health",
            "tdee": profile.tdee if profile else 2200,
            "imc": profile.imc if profile else 23.5,
            "activity_level": profile.activity_level if profile else "moderate"
        },
        "active_plan": {
            "daily_calories": plan.daily_calories if plan else 2200,
            "protein_g": plan.protein_g if plan else 150,
            "carbs_g": plan.carbs_g if plan else 220,
            "fat_g": plan.fat_g if plan else 60
        },
        "recent_logs_count": len(logs),
        "recent_logs": recent_summary
    }


def tool_search_semantic(query: str, category: Optional[str] = "todas", limit: int = 3) -> Dict[str, Any]:
    results = semantic_engine.search(query, category=category, top_k=limit)
    return {
        "query": query,
        "category_filter": category,
        "total_matches": len(results),
        "matches": [
            {
                "title": r["item"]["title"],
                "category": r["item"]["category"],
                "type": r["item"]["type"],
                "score_pct": r["relevance_pct"],
                "description": r["item"]["description"],
                "reason": r["matched_reason"],
                "tags": r["item"].get("tags", []),
                "details": {
                    "calories": r["item"].get("calories"),
                    "protein_g": r["item"].get("protein_g"),
                    "target_muscles": r["item"].get("target_muscles"),
                    "duration_min": r["item"].get("duration_min")
                }
            }
            for r in results
        ]
    }


def tool_record_daily_log(db: Session, user_id: int, calories_consumed: int, workout_done: bool = False, water_ml: int = 2000, notes: str = "") -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": f"Usuario {user_id} no existe."}

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    existing_log = db.query(DailyLog).filter(DailyLog.user_id == user_id, DailyLog.date == today_str).first()

    # Cálculo estimado de macros equilibrados si no se especifican
    est_protein = round((calories_consumed * 0.25) / 4.0, 1)
    est_carbs = round((calories_consumed * 0.50) / 4.0, 1)
    est_fat = round((calories_consumed * 0.25) / 9.0, 1)

    if existing_log:
        existing_log.calories_consumed = calories_consumed
        existing_log.protein_consumed = est_protein
        existing_log.carbs_consumed = est_carbs
        existing_log.fat_consumed = est_fat
        existing_log.workout_done = workout_done
        existing_log.water_ml = water_ml
        db.commit()
        return {"success": True, "action": "updated", "date": today_str, "calories": calories_consumed, "note": "Log actualizado correctamente."}
    else:
        new_log = DailyLog(
            user_id=user_id,
            date=today_str,
            calories_consumed=calories_consumed,
            protein_consumed=est_protein,
            carbs_consumed=est_carbs,
            fat_consumed=est_fat,
            workout_done=workout_done,
            meditation_done=False,
            water_ml=water_ml,
            mood=4
        )
        db.add(new_log)
        db.commit()
        return {"success": True, "action": "created", "date": today_str, "calories": calories_consumed, "note": "Log registrado exitosamente en el Dashboard."}


# ── DESPACHADOR CENTRAL DE HERRAMIENTAS MCP ───────────────────────────────────
def execute_mcp_tool(db: Session, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if tool_name == "get_user_biometrics_and_progress":
        return tool_get_user_biometrics(db, user_id=arguments.get("user_id", 1))
    elif tool_name == "search_catalog_semantic":
        return tool_search_semantic(
            query=arguments.get("query", ""),
            category=arguments.get("category", "todas"),
            limit=arguments.get("limit", 3)
        )
    elif tool_name == "record_daily_log_quick":
        return tool_record_daily_log(
            db,
            user_id=arguments.get("user_id", 1),
            calories_consumed=arguments.get("calories_consumed", 2000),
            workout_done=arguments.get("workout_done", False),
            water_ml=arguments.get("water_ml", 2000),
            notes=arguments.get("notes", "")
        )
    else:
        return {"error": f"Herramienta MCP '{tool_name}' no reconocida."}
