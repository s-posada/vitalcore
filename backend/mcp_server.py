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
from engine_registry import get_engine
from datetime import datetime, UTC

# Rangos fisiológicos plausibles para validar entradas del usuario/agente
MIN_WEIGHT_KG = 20.0
MAX_WEIGHT_KG = 400.0
MIN_HEIGHT_CM = 100.0
MAX_HEIGHT_CM = 250.0

# ── DEFINICIÓN DE HERRAMIENTAS MCP (MANIFEST) ──────────────────────────────────
MCP_TOOLS_MANIFEST = [
    {
        "name": "get_user_biometrics_and_progress",
        "description": "Obtiene los datos biométricos de salud y nutrición del usuario, su objetivo metabólico, TDEE, IMC, plan nutricional activo y últimos registros de telemetría (peso, calorías, agua). Puedes consultar pasando el user_id (ej: 1) o el correo/nombre del usuario (ej: 'sposada2026@udec.cl', 'andresburboa@udec.cl', 'Sebastian', 'Catalina').",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "ID numérico del usuario en VitalCore (opcional si se provee email o nombre)"
                },
                "email_or_name": {
                    "type": "string",
                    "description": "Correo electrónico institucional o nombre del usuario (ej: 'sposada2026@udec.cl', 'Sebastian')"
                }
            }
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
        "name": "update_user_profile",
        "description": "Actualiza el perfil biométrico del usuario (peso, meta, altura, nivel de actividad) cuando lo informa en el chat. Recalcula IMC y TDEE automáticamente. Usar SIEMPRE que el usuario diga su peso actual, cambie de meta o de nivel de actividad.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "ID del usuario"
                },
                "weight_kg": {
                    "type": "number",
                    "description": "Peso actual en kilogramos (rango válido 20-400 kg)"
                },
                "target_weight_kg": {
                    "type": "number",
                    "description": "Peso objetivo en kilogramos"
                },
                "goal": {
                    "type": "string",
                    "enum": ["gain_muscle", "lose_fat", "maintain", "improve_endurance", "improve_flexibility"],
                    "description": "Meta principal del usuario"
                },
                "activity_level": {
                    "type": "string",
                    "description": "Nivel de actividad física (sedentary, light, moderate, active, very_active)"
                },
                "height_cm": {
                    "type": "number",
                    "description": "Altura en centímetros (rango válido 100-250 cm)"
                }
            },
            "required": ["user_id"]
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
                },
                "weight_kg": {
                    "type": "number",
                    "description": "Peso registrado hoy en kilogramos, si el usuario lo menciona (rango válido 20-400 kg)"
                }
            },
            "required": ["user_id", "calories_consumed"]
        }
    }
]


# ── IMPLEMENTACIÓN DE LAS FUNCIONES DE HERRAMIENTA ─────────────────────────────
def tool_get_user_biometrics(db: Session, user_id: Optional[int] = None, email_or_name: Optional[str] = None) -> Dict[str, Any]:
    user = None
    if email_or_name:
        clean = str(email_or_name).strip()
        user = db.query(User).filter(
            (User.email.ilike(f"%{clean}%")) | (User.name.ilike(f"%{clean}%"))
        ).first()
    if not user and user_id is not None:
        try:
            uid = int(user_id)
            user = db.query(User).filter(User.id == uid).first()
        except (ValueError, TypeError):
            pass
    if not user:
        # Default al usuario principal si no se especificó nada
        user = db.query(User).filter(User.id == 1).first()

    if not user:
        return {"error": "Usuario no encontrado en la base de datos de VitalCore."}

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == user.id).order_by(NutritionPlan.created_at.desc()).first()
    logs = db.query(DailyLog).filter(DailyLog.user_id == user.id).order_by(DailyLog.date.desc()).limit(5).all()

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
    engine = get_engine()
    results = engine.search(query, category=category, top_k=limit) if engine else []
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


def tool_update_user_profile(
    db: Session,
    user_id: int,
    weight_kg: Optional[float] = None,
    target_weight_kg: Optional[float] = None,
    goal: Optional[str] = None,
    activity_level: Optional[str] = None,
    height_cm: Optional[float] = None,
) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": f"Usuario {user_id} no existe."}

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    if weight_kg is not None:
        if not (MIN_WEIGHT_KG <= weight_kg <= MAX_WEIGHT_KG):
            return {"error": f"Peso {weight_kg} kg fuera de rango válido ({MIN_WEIGHT_KG}-{MAX_WEIGHT_KG} kg). Confirma el dato con el usuario antes de guardar."}
        profile.weight_kg = weight_kg

    if target_weight_kg is not None:
        if not (MIN_WEIGHT_KG <= target_weight_kg <= MAX_WEIGHT_KG):
            return {"error": f"Peso objetivo {target_weight_kg} kg fuera de rango válido ({MIN_WEIGHT_KG}-{MAX_WEIGHT_KG} kg)."}
        profile.target_weight_kg = target_weight_kg

    if height_cm is not None:
        if not (MIN_HEIGHT_CM <= height_cm <= MAX_HEIGHT_CM):
            return {"error": f"Altura {height_cm} cm fuera de rango válido ({MIN_HEIGHT_CM}-{MAX_HEIGHT_CM} cm)."}
        profile.height_cm = height_cm

    if goal is not None:
        profile.goal = goal

    if activity_level is not None:
        profile.activity_level = activity_level

    # Recalcular IMC si hay peso y altura disponibles
    if profile.weight_kg and profile.height_cm:
        height_m = profile.height_cm / 100.0
        profile.imc = round(profile.weight_kg / (height_m ** 2), 1)

    # Recalcular TDEE (Mifflin-St Jeor simplificado) si hay peso, altura y edad
    activity_factors = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
        "active": 1.725, "very_active": 1.9
    }
    if profile.weight_kg and profile.height_cm and profile.age:
        bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
        factor = activity_factors.get(profile.activity_level, 1.55)
        profile.tdee = int(bmr * factor)

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "message": "Perfil actualizado correctamente.",
        "profile": {
            "weight_kg": profile.weight_kg,
            "target_weight_kg": profile.target_weight_kg,
            "goal": profile.goal,
            "activity_level": profile.activity_level,
            "height_cm": profile.height_cm,
            "imc": profile.imc,
            "tdee": profile.tdee
        }
    }


def tool_record_daily_log(db: Session, user_id: int, calories_consumed: int, workout_done: bool = False, water_ml: int = 2000, notes: str = "", weight_kg: Optional[float] = None) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": f"Usuario {user_id} no existe."}

    if weight_kg is not None and not (MIN_WEIGHT_KG <= weight_kg <= MAX_WEIGHT_KG):
        return {"error": f"Peso {weight_kg} kg fuera de rango válido ({MIN_WEIGHT_KG}-{MAX_WEIGHT_KG} kg). Confirma el dato con el usuario antes de guardar."}

    today_str = datetime.now(UTC).strftime("%Y-%m-%d")
    existing_log = db.query(DailyLog).filter(DailyLog.user_id == user_id, DailyLog.date == today_str).first()

    # Cálculo estimado de macros equilibrados si no se especifican
    est_protein = round((calories_consumed * 0.25) / 4.0, 1)
    est_carbs = round((calories_consumed * 0.50) / 4.0, 1)
    est_fat = round((calories_consumed * 0.25) / 9.0, 1)

    # Si el usuario menciona su peso, se actualiza también el perfil (fuente de verdad para IMC/TDEE)
    if weight_kg is not None:
        tool_update_user_profile(db, user_id, weight_kg=weight_kg)

    if existing_log:
        existing_log.calories_consumed = calories_consumed
        existing_log.protein_consumed = est_protein
        existing_log.carbs_consumed = est_carbs
        existing_log.fat_consumed = est_fat
        existing_log.workout_done = workout_done
        existing_log.water_ml = water_ml
        if weight_kg is not None:
            existing_log.weight_kg = weight_kg
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
            weight_kg=weight_kg,
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
            notes=arguments.get("notes", ""),
            weight_kg=arguments.get("weight_kg")
        )
    elif tool_name == "update_user_profile":
        return tool_update_user_profile(
            db,
            user_id=arguments.get("user_id", 1),
            weight_kg=arguments.get("weight_kg"),
            target_weight_kg=arguments.get("target_weight_kg"),
            goal=arguments.get("goal"),
            activity_level=arguments.get("activity_level"),
            height_cm=arguments.get("height_cm")
        )
    else:
        return {"error": f"Herramienta MCP '{tool_name}' no reconocida."}
