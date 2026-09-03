"""
VitalCore — Suite de Verificación Automatizada para Trabajo 02
==============================================================
Prueba los nuevos componentes implementados:
1. Motor de Búsqueda Semántica Vectorial (Embeddings + Coseno)
2. Servidor MCP y Manifiesto de Herramientas
3. Endpoint de Ejecución de Herramientas MCP
4. Agente Asistente IA con Inyección Contextual y Tool Calling
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_trabajo_02_suite():
    print("===============================================================")
    print("  🚀 AUDITORÍA DE AJUSTES TÉCNICOS: TRABAJO 02 (VECTORES & MCP)")
    print("===============================================================")

    # 1. Manifiesto MCP Tools
    r = client.get("/api/mcp/tools")
    assert r.status_code == 200, f"Error en /api/mcp/tools: {r.text}"
    tools_data = r.json()
    assert len(tools_data["tools"]) >= 3, "Debe exponer al menos 3 herramientas MCP"
    print(f"✅ 1. Manifiesto MCP v1.0 disponible ({len(tools_data['tools'])} herramientas registradas): OK")

    # 2. Invocación de Herramienta MCP: Datos Biométricos
    mcp_call_bio = {
        "tool": "get_user_biometrics_and_progress",
        "arguments": {"user_id": 1}
    }
    r = client.post("/api/mcp/call", json=mcp_call_bio)
    assert r.status_code == 200
    bio_res = r.json()["result"]
    assert "profile" in bio_res and "active_plan" in bio_res
    print(f"✅ 2. Invocación MCP 'get_user_biometrics_and_progress' (Usuario: {bio_res['name']}, TDEE: {bio_res['profile']['tdee']}): OK")

    # 3. Búsqueda Semántica Vectorial: Consulta de Lenguaje Natural Complejo
    queries_to_test = [
        ("desayuno rapido sin lactosa rico en proteina", "nutricion"),
        ("tengo dolor de rodilla y busco ejercicio seguro", "entrenamiento"),
        ("estres laboral e insomnio para calmar la mente", "meditacion"),
    ]

    for q, cat in queries_to_test:
        r = client.get(f"/api/search/semantic?q={q}&category={cat}&top_k=2")
        assert r.status_code == 200
        res = r.json()
        assert res["total"] > 0, f"Búsqueda semántica para '{q}' falló"
        top_match = res["results"][0]
        print(f"✅ 3. Vector Match para '{q}': -> [{top_match['relevance_pct']}% match] '{top_match['item']['title']}' (Razón: {top_match['matched_reason']})")

    # 4. Invocación MCP: Búsqueda Semántica vía Protocolo
    mcp_call_search = {
        "tool": "search_catalog_semantic",
        "arguments": {"query": "receta antiinflamatoria para articulaciones", "category": "nutricion", "limit": 1}
    }
    r = client.post("/api/mcp/call", json=mcp_call_search)
    assert r.status_code == 200
    search_res = r.json()["result"]
    assert search_res["total_matches"] > 0
    print(f"✅ 4. Invocación MCP 'search_catalog_semantic' -> Encontró: '{search_res['matches'][0]['title']}': OK")

    # 5. Invocación MCP: Quick Log Telemetría
    mcp_call_log = {
        "tool": "record_daily_log_quick",
        "arguments": {
            "user_id": 1,
            "calories_consumed": 2250,
            "workout_done": True,
            "water_ml": 2500,
            "notes": "Entrenamiento de fuerza y comida equilibrada"
        }
    }
    r = client.post("/api/mcp/call", json=mcp_call_log)
    assert r.status_code == 200
    log_res = r.json()["result"]
    assert log_res["success"] is True
    print(f"✅ 5. Invocación MCP 'record_daily_log_quick' (2250 kcal registradas): OK")

    # 6. Endpoint de Asistente Agéntico con Tool Calling
    chat_agent_payload = {
        "user_id": 1,
        "message": "Me duele la rodilla, ¿qué ejercicio me recomiendas hacer hoy?"
    }
    r = client.post("/api/ai/agent-chat", json=chat_agent_payload)
    assert r.status_code == 200
    chat_agent_res = r.json()
    assert "reply" in chat_agent_res and len(chat_agent_res["reply"]) > 10
    print(f"✅ 6. Asistente Agéntico con Inyección MCP & Vector Context: '{chat_agent_res['reply'][:70]}...': OK")

    print("===============================================================")
    print("  🏆 TODAS LAS PRUEBAS DE TRABAJO 02 COMPLETADAS AL 100%")
    print("===============================================================")

if __name__ == "__main__":
    test_trabajo_02_suite()
