"""
agent.py - Agente autónomo con LangChain y Google Gemini (SPEC-02)
===================================================================
Implementa un agente conversacional basado en LangChain que decide de forma
autónoma qué herramientas invocar (biometría, búsqueda semántica en catálogo,
generación real de planes nutricionales y registro de logs diarios) sin lógica
if/elif manual.

Regla arquitectónica:
Este módulo define sus propias variables de configuración de Gemini y se importa
SOLO desde engine_registry, database, mcp_server y librerías estándar.
NUNCA importa desde main.py para evitar ciclos de importación.
"""

import os
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database import User, UserProfile, NutritionPlan, DailyLog
from engine_registry import get_engine
from mcp_server import tool_get_user_biometrics, tool_record_daily_log

# Configuración autónoma desde el entorno
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


def generate_nutrition_plan_for_user(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Genera un plan nutricional personalizado con Gemini o cálculos metabólicos directos
    usando los datos reales del UserProfile (goal, tdee, weight_kg, health_notes)
    y lo almacena en la tabla nutrition_plans.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        return {"error": f"Perfil de usuario con ID {user_id} no encontrado en la base de datos."}

    goal = profile.goal or "maintain"
    tdee = profile.tdee or 2200
    weight = profile.weight_kg or 70.0
    health_notes = profile.health_notes or "Sin restricciones conocidas"

    # Cálculo fisiológico según meta
    if goal == "lose_fat":
        target_calories = max(1400, tdee - 400)
        protein_ratio = 2.2
    elif goal == "gain_muscle":
        target_calories = tdee + 300
        protein_ratio = 2.0
    else:
        target_calories = tdee
        protein_ratio = 1.6

    protein_g = int(weight * protein_ratio)
    fat_g = int((target_calories * 0.25) / 9)
    carbs_g = max(50, int((target_calories - (protein_g * 4 + fat_g * 9)) / 4))

    plan_title = f"Plan Nutricional VitalCore: {goal.replace('_', ' ').capitalize()} ({target_calories} kcal)"
    menu_breakdown = None

    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(GEMINI_MODEL)
            prompt = (
                f"Eres el nutricionista jefe de VitalCore. Diseña un menú diario adaptado a un usuario con:\n"
                f"- Peso: {weight} kg\n"
                f"- Meta: {goal}\n"
                f"- TDEE: {tdee} kcal\n"
                f"- Calorías objetivo: {target_calories} kcal ({protein_g}g proteína, {carbs_g}g carbohidratos, {fat_g}g grasas)\n"
                f"- Notas de salud: {health_notes}\n"
                f"Devuelve un JSON estrictamente estructurado con las claves: 'desayuno', 'almuerzo', 'snack', 'cena' y 'consejos_clave'."
            )
            res = model.generate_content(prompt)
            menu_breakdown = res.text
        except Exception as e:
            print(f"Aviso al generar menú con Gemini en agent.py: {e}")

    if not menu_breakdown:
        menu_breakdown = json.dumps({
            "desayuno": f"Bowl proteico con avena integral, frutas rojas y semillas ({int(protein_g * 0.25)}g proteína).",
            "almuerzo": f"Pechuga de pollo o tofu a la plancha con arroz integral y espárragos ({int(protein_g * 0.35)}g proteína).",
            "snack": f"Yogur griego con almendras y canela ({int(protein_g * 0.15)}g proteína).",
            "cena": f"Salmón o huevos poché con ensalada de hojas verdes y aceite de oliva ({int(protein_g * 0.25)}g proteína).",
            "consejos_clave": f"Mantén hidratación constante de 2.5L de agua al día y respeta las porciones fijadas."
        }, ensure_ascii=False)

    # Persistir en la tabla nutrition_plans
    plan = NutritionPlan(
        user_id=user_id,
        title=plan_title,
        goal=goal,
        daily_calories=target_calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        plan_json=menu_breakdown
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "success": True,
        "plan_id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "daily_calories": plan.daily_calories,
        "protein_g": plan.protein_g,
        "carbs_g": plan.carbs_g,
        "fat_g": plan.fat_g,
        "menu": menu_breakdown,
        "message": f"Plan nutricional de {target_calories} kcal generado y guardado en tu perfil."
    }


def run_agent(db: Session, user_id: int, message: str) -> Dict[str, Any]:
    """
    Punto de entrada principal para /api/ai/agent-chat.
    Orquesta la ejecución con LangChain y herramientas especializadas.
    """
    tools_used = []

    # Importaciones seguras de LangChain
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
        from langchain_core.tools import tool
    except ImportError as e:
        return {
            "reply": f"LangChain o dependencias no disponibles: {e}",
            "source": "error",
            "tools_used": []
        }

    # Definición de las 4 herramientas dentro del contexto de la sesión db
    @tool
    def get_user_biometrics() -> str:
        """Obtiene datos biométricos, progreso, objetivo y registros recientes del usuario."""
        tools_used.append("get_user_biometrics")
        res = tool_get_user_biometrics(db, user_id)
        return json.dumps(res, ensure_ascii=False)

    @tool
    def search_catalog(query: str, category: Optional[str] = None) -> str:
        """Busca en el catálogo de VitalCore (nutrición, entrenamiento, meditación) usando similitud semántica."""
        tools_used.append("search_catalog")
        engine = get_engine()
        if not engine:
            return json.dumps({"error": "Motor semántico no inicializado"})
        results = engine.search(query, category=category, top_k=4)
        return json.dumps(results, ensure_ascii=False)

    @tool
    def generate_nutrition_plan() -> str:
        """Genera y guarda un plan nutricional personalizado en la base de datos a partir del perfil real del usuario."""
        tools_used.append("generate_nutrition_plan")
        res = generate_nutrition_plan_for_user(db, user_id)
        return json.dumps(res, ensure_ascii=False)

    @tool
    def record_daily_log(calories: int, workout_done: bool = False, water_ml: int = 2000, notes: str = "") -> str:
        """Registra la ingesta calórica y actividad física del día de hoy en la base de datos."""
        tools_used.append("record_daily_log")
        res = tool_record_daily_log(db, user_id, calories_consumed=calories, workout_done=workout_done, water_ml=water_ml, notes=notes)
        return json.dumps(res, ensure_ascii=False)

    tools = [get_user_biometrics, search_catalog, generate_nutrition_plan, record_daily_log]
    tools_map = {t.name: t for t in tools}

    system_prompt = (
        "Eres el Asistente Inteligente de VitalCore, un coach de salud y bienestar de élite. "
        "Tienes acceso a 4 herramientas para ayudar al usuario de forma proactiva:\n"
        "1. get_user_biometrics: consulta peso, TDEE, IMC y progreso.\n"
        "2. search_catalog: busca recetas, ejercicios o meditaciones adecuadas para sus síntomas o metas.\n"
        "3. generate_nutrition_plan: crea y guarda un plan nutricional adaptado a su perfil si lo solicita.\n"
        "4. record_daily_log: registra calorías y entrenamientos en la base de datos.\n"
        "Sé conciso, empático, profesional y científico. Basa siempre tus respuestas en los datos del usuario."
    )

    try:
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.2
        )
        llm_with_tools = llm.bind_tools(tools)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]

        # Primera invocación
        ai_msg = llm_with_tools.invoke(messages)
        messages.append(ai_msg)

        # Si el modelo decidió llamar herramientas, ejecutarlas
        if getattr(ai_msg, "tool_calls", None):
            for tc in ai_msg.tool_calls:
                fn_name = tc.get("name")
                fn_args = tc.get("args", {})
                tool_fn = tools_map.get(fn_name)
                if tool_fn:
                    try:
                        tool_output = tool_fn.invoke(fn_args)
                    except Exception as err:
                        tool_output = json.dumps({"error": str(err)})
                else:
                    tool_output = json.dumps({"error": f"Herramienta {fn_name} desconocida"})

                messages.append(ToolMessage(content=str(tool_output), tool_call_id=tc.get("id", fn_name)))

            # Invocación final con los resultados de las herramientas
            final_ai_msg = llm.invoke(messages)
            reply_text = final_ai_msg.content
        else:
            reply_text = ai_msg.content

        return {
            "reply": reply_text if isinstance(reply_text, str) else str(reply_text),
            "source": "langchain_agent",
            "tools_used": list(set(tools_used))
        }
    except Exception as e:
        print(f"Error en ejecución del agente LangChain: {e}")
        # Fallback si falla la invocación de LangChain
        return {
            "reply": f"Lo siento, ocurrió un problema al procesar tu solicitud con el agente autónomo: {e}",
            "source": "langchain_agent_error",
            "tools_used": tools_used
        }
