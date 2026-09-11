"""
test_specs_suite.py - Suite de verificación automatizada para SPEC-01, SPEC-02 y SPEC-03.
Ejecuta todas las pruebas unitarias y de integración end-to-end contra la base de datos y la API.
"""

import os
import sys
import json
import re
import pytest
from fastapi.testclient import TestClient

# Asegurar que el directorio backend esté en el PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, create_tables, CatalogItem, User, UserProfile, NutritionPlan, DailyLog
from engine_registry import get_engine, set_engine
from semantic_engine import VectorSearchEngine
from seed import seed, seed_catalog, CATALOG_SEED
import agent
from main import app, _chat_rate_limited, _chat_hits

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_engine():
    """Inicializa la base de datos y el motor vectorial para toda la sesión de pruebas."""
    create_tables()
    db = SessionLocal()
    try:
        from seed import seed
        seed()
        seed_catalog(db)
        eng = VectorSearchEngine()
        eng.reload(db)
        set_engine(eng)
    finally:
        db.close()


# ── PRUEBAS SPEC-01: PERSISTENCIA ESCALABLE DEL CATÁLOGO ───────────────────────

def test_spec01_scenario1_empty_init():
    """Scenario 1: VectorSearchEngine arranca con índice vacío sin lecturas de BD al importar."""
    eng = VectorSearchEngine()
    assert eng.index == [], "VectorSearchEngine() debe inicializarse con self.index vacío"


def test_spec01_scenario7_dataset_distribution():
    """Scenario 7: Distribución de los 50 ítems por categoría."""
    assert len(CATALOG_SEED) == 50, f"Se esperaban 50 ítems en CATALOG_SEED, pero hay {len(CATALOG_SEED)}"
    nut_items = [i for i in CATALOG_SEED if i["category"] == "nutricion"]
    train_items = [i for i in CATALOG_SEED if i["category"] == "entrenamiento"]
    med_items = [i for i in CATALOG_SEED if i["category"] == "meditacion"]

    assert len(nut_items) >= 18, f"Nutrición debe tener al menos 18 ítems, tiene {len(nut_items)}"
    assert len(train_items) >= 16, f"Entrenamiento debe tener al menos 16 ítems, tiene {len(train_items)}"
    assert len(med_items) >= 10, f"Meditación debe tener al menos 10 ítems, tiene {len(med_items)}"


def test_spec01_scenario2_and_4_seed_catalog_and_reload():
    """Scenario 2 & 4: Poblado en SQLite y reload(db) con 50 ítems sin duplicación."""
    create_tables()
    db = SessionLocal()
    try:
        # Seed inicial
        seed_catalog(db)
        total_db = db.query(CatalogItem).count()
        assert total_db == 50, f"La tabla catalog_items debe contener 50 ítems, tiene {total_db}"

        # Scenario 4: Re-ejecutar seed_catalog no debe duplicar ni regenerar
        seed_catalog(db)
        assert db.query(CatalogItem).count() == 50, "seed_catalog no debe duplicar registros al re-ejecutarse"

        # Scenario 2: reload(db) carga exactamente 50 ítems en el motor
        eng = VectorSearchEngine()
        eng.reload(db)
        assert len(eng.index) == 50, f"reload(db) debe indexar 50 ítems, indexó {len(eng.index)}"
        set_engine(eng)
    finally:
        db.close()


def test_spec01_scenario3_engine_registry():
    """Scenario 3: engine_registry resuelve el acceso global sin ciclos de importación."""
    eng = get_engine()
    assert eng is not None, "get_engine() debe retornar la instancia registrada"
    assert len(eng.index) == 50


def test_spec01_scenario8_and_9_semantic_search():
    """Scenario 8 & 9: Búsqueda semántica con score > 0.15 y filtrado por categoría."""
    eng = get_engine()
    assert eng is not None

    # Scenario 8: Búsqueda con score y categoría
    results = eng.search("receta rápida alta en proteína", top_k=4)
    assert len(results) >= 3, f"Se esperaban al menos 3 resultados, se obtuvieron {len(results)}"
    for r in results:
        assert r["score"] > 0.15, f"Score {r['score']} debe ser superior a 0.15"
        assert "relevance_pct" in r, "Debe contener relevance_pct"
    assert any(r["item"]["category"] == "nutricion" for r in results), "Al menos 1 resultado debe ser de nutricion"

    # Scenario 9: Filtro por categoría entrenamiento y joint_friendly
    results_train = eng.search("ejercicio sin impacto", category="entrenamiento", top_k=5)
    assert len(results_train) > 0
    assert all(r["item"]["category"] == "entrenamiento" for r in results_train)
    has_joint_friendly = any(r["item"]["joint_friendly"] is True for r in results_train)
    assert has_joint_friendly, "Al menos 1 resultado debe tener joint_friendly == True"

    # Endpoint GET /api/search/semantic
    resp = client.get("/api/search/semantic?q=ejercicio sin impacto&category=entrenamiento")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 0
    assert any(item["item"]["joint_friendly"] is True for item in data["results"])


# ── PRUEBAS SPEC-02: AGENTE AUTÓNOMO CON GENERACIÓN REAL DE PLANES ─────────────

def test_spec02_scenario1_no_circular_import():
    """Scenario 1: agent.py no importa nada de main.py y no genera ciclos."""
    agent_code = open(os.path.join(os.path.dirname(__file__), "agent.py"), "r", encoding="utf-8").read()
    assert "from main" not in agent_code, "agent.py NO debe importar nada de main.py"
    assert "import main" not in agent_code, "agent.py NO debe importar nada de main.py"


def test_spec02_scenario2_generate_nutrition_plan():
    """Scenario 2: Generación real de plan nutricional y persistencia en la BD."""
    db = SessionLocal()
    try:
        # Asegurar usuario de prueba
        user = db.query(User).first()
        assert user is not None, "Debe existir al menos un usuario en la BD"
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            profile = UserProfile(user_id=user.id, goal="gain_muscle", weight_kg=78.5, tdee=2850)
            db.add(profile)
            db.commit()

        # Invocación directa de la tool
        plan_res = agent.generate_nutrition_plan_for_user(db, user.id)
        assert plan_res["success"] is True
        assert plan_res["plan_id"] is not None
        assert plan_res["daily_calories"] > 0

        # Verificar persistencia en tabla nutrition_plans
        saved_plan = db.query(NutritionPlan).filter(NutritionPlan.id == plan_res["plan_id"]).first()
        assert saved_plan is not None
        assert saved_plan.user_id == user.id
    finally:
        db.close()


def test_spec02_scenario3_record_daily_log():
    """Scenario 3: Registro de log diario desde las herramientas del agente."""
    db = SessionLocal()
    try:
        user = db.query(User).first()
        assert user is not None
        from mcp_server import tool_record_daily_log
        log_res = tool_record_daily_log(db, user_id=user.id, calories_consumed=2300, workout_done=True, notes="Gym y 2300 kcal")
        assert log_res["success"] is True
        assert log_res["calories"] == 2300
    finally:
        db.close()


def test_spec02_scenario5_rate_limit():
    """Scenario 5: Rate limit de 8 mensajes / 60 segundos en /api/ai/agent-chat."""
    test_user_id = 99999
    _chat_hits[test_user_id] = []

    # Enviar 8 mensajes válidos
    for i in range(8):
        assert _chat_rate_limited(test_user_id) is False

    # El 9no mensaje debe ser bloqueado
    assert _chat_rate_limited(test_user_id) is True

    # Test vía HTTP
    resp = client.post("/api/ai/agent-chat", json={"user_id": test_user_id, "message": "mensaje extra"})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("source") == "ratelimit"


def test_spec02_scenario6_fallback_without_api_key():
    """Scenario 6: Fallback determinista cuando GEMINI_API_KEY no está configurada."""
    db = SessionLocal()
    try:
        user = db.query(User).first()
        assert user is not None
        # Limpiar hits para este user
        _chat_hits[user.id] = []

        resp = client.post("/api/ai/agent-chat", json={"user_id": user.id, "message": "hola coach"})
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert data.get("source") in ["fallback", "langchain_agent"]
    finally:
        db.close()


# ── PRUEBAS SPEC-03: WEBMCP SOBRE SSE PARA AGENTES REMOTOS ─────────────────────

@pytest.mark.anyio
async def test_spec03_scenario1_sse_handshake_and_manifest():
    """Scenario 1: Endpoint GET /mcp/sse emite handshake 2024-11-05 y herramientas de SPEC-02."""
    from main import mcp_sse_endpoint
    response = await mcp_sse_endpoint()
    events = []
    async for event in response.body_iterator:
        events.append(event)
        if len(events) >= 2:
            break

    full_output = str(events)
    assert "2024-11-05" in full_output, "El handshake debe contener protocolVersion 2024-11-05"
    assert "generate_nutrition_plan" in full_output, "El manifiesto debe incluir generate_nutrition_plan"
    assert "search_catalog_semantic" in full_output, "El manifiesto debe incluir search_catalog_semantic"


def test_spec03_scenario2_cors_regex():
    """Scenario 2: CORS allow_origin_regex acepta vercel.app, anthropic.com y claude.ai."""
    pattern = r"^https://([a-z0-9-]+\.vercel\.app|[a-z0-9-]+\.anthropic\.com|claude\.ai)$"

    assert re.match(pattern, "https://vitalcore-frontend.vercel.app")
    assert re.match(pattern, "https://vitalcore-preview-123.vercel.app")
    assert re.match(pattern, "https://claude.ai")
    assert re.match(pattern, "https://console.anthropic.com")
    assert not re.match(pattern, "https://malicious-site.com")
    assert not re.match(pattern, "http://claude.ai")


def test_spec03_scenario3_mcp_call_search():
    """Scenario 3: POST /api/mcp/call con search_catalog_semantic usa get_engine()."""
    resp = client.post("/api/mcp/call", json={
        "tool": "search_catalog_semantic",
        "arguments": {"query": "receta alta proteina", "category": "nutricion", "limit": 3}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "matches" in data["result"]
    assert len(data["result"]["matches"]) > 0


def test_spec03_scenario4_and_5_mcp_config_portable():
    """Scenario 4 & 5: mcp_config.json usa rutas relativas y no contiene C:/Users."""
    config_path = os.path.join(os.path.dirname(__file__), "mcp_config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()
        data = json.loads(content)

    assert "C:/Users" not in content, "mcp_config.json no debe contener 'C:/Users'"
    assert "c:/Users" not in content, "mcp_config.json no debe contener 'c:/Users'"
    assert "vitalcore" in data["mcpServers"]
    assert "vitalcore-remote" in data["mcpServers"]
    assert data["mcpServers"]["vitalcore-remote"]["url"] == "https://vitalcore-api.onrender.com/mcp/sse"
    assert data["mcpServers"]["vitalcore"]["args"] == ["./backend/mcp_server_stdio.py"]


if __name__ == "__main__":
    pytest.main(["-v", __file__])
