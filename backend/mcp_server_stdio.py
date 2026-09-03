"""
VitalCore — Servidor Oficial de Model Context Protocol (MCP) vía STDIO
======================================================================
Permite conectar cualquier cliente de IA compatible con MCP (Claude Desktop,
Antigravity IDE, Cursor, Cline, Gemini CLI) con la base de datos viva de VitalCore.

Implementa la especificación MCP v1.0 sobre JSON-RPC 2.0 en Standard I/O.
"""

import sys
import json
import os

# Asegurar path para importar módulos de VitalCore
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, UserProfile, NutritionPlan, DailyLog
from mcp_server import (
    MCP_TOOLS_MANIFEST,
    tool_get_user_biometrics,
    tool_search_semantic,
    tool_record_daily_log
)

SERVER_INFO = {
    "name": "vitalcore-mcp-server",
    "version": "2.0.0"
}

CAPABILITIES = {
    "tools": {
        "listChanged": False
    },
    "resources": {
        "subscribe": False,
        "listChanged": False
    }
}

RESOURCES_MANIFEST = [
    {
        "uri": "vitalcore://system/status",
        "name": "Estado del Sistema VitalCore",
        "description": "Información general y métricas del servidor de VitalCore",
        "mimeType": "application/json"
    },
    {
        "uri": "vitalcore://users/active",
        "name": "Directorio de Usuarios Activos",
        "description": "Lista de usuarios y niveles de membresía",
        "mimeType": "application/json"
    }
]

def format_tools_for_mcp():
    """Adapta el formato de herramientas al estándar formal inputSchema de MCP."""
    tools = []
    for t in MCP_TOOLS_MANIFEST:
        tools.append({
            "name": t["name"],
            "description": t["description"],
            "inputSchema": t["parameters"]
        })
    return tools

def handle_request(req: dict) -> dict:
    method = req.get("method")
    req_id = req.get("id")
    params = req.get("params", {})

    # 1. Inicialización del Protocolo
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "serverInfo": SERVER_INFO,
                "capabilities": CAPABILITIES
            }
        }

    # 2. Notificación de Inicializado (No requiere respuesta si no tiene ID)
    if method == "notifications/initialized":
        return None

    # 3. Ping / Liveness
    if method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }

    # 4. Listado de Herramientas
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": format_tools_for_mcp()
            }
        }

    # 5. Ejecución de Herramienta
    if method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        db = SessionLocal()
        try:
            if tool_name == "get_user_biometrics_and_progress":
                res = tool_get_user_biometrics(db, user_id=arguments.get("user_id", 1))
            elif tool_name == "search_catalog_semantic":
                res = tool_search_semantic(
                    query=arguments.get("query", ""),
                    category=arguments.get("category", "todas"),
                    limit=arguments.get("limit", 3)
                )
            elif tool_name == "record_daily_log_quick":
                res = tool_record_daily_log(
                    db,
                    user_id=arguments.get("user_id", 1),
                    calories_consumed=arguments.get("calories_consumed", 2000),
                    workout_done=arguments.get("workout_done", False),
                    water_ml=arguments.get("water_ml", 2000),
                    notes=arguments.get("notes", "")
                )
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Herramienta '{tool_name}' no encontrada."
                    }
                }

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, ensure_ascii=False, indent=2)
                        }
                    ]
                }
            }
        finally:
            db.close()

    # 6. Listado de Recursos
    if method == "resources/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "resources": RESOURCES_MANIFEST
            }
        }

    # 7. Lectura de Recurso
    if method == "resources/read":
        uri = params.get("uri", "")
        db = SessionLocal()
        try:
            if uri == "vitalcore://system/status":
                content_text = json.dumps({"status": "healthy", "version": "2.0.0", "engine": "FastAPI + Vector Engine"}, indent=2)
            elif uri == "vitalcore://users/active":
                users = db.query(User).limit(10).all()
                users_list = [{"id": u.id, "name": u.name, "email": u.email, "tier": u.tier} for u in users]
                content_text = json.dumps({"total": len(users_list), "users": users_list}, indent=2)
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32002,
                        "message": f"Recurso no encontrado: {uri}"
                    }
                }

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": content_text
                        }
                    ]
                }
            }
        finally:
            db.close()

    # Método no soportado
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": -32601,
            "message": f"Método '{method}' no soportado por el servidor MCP de VitalCore."
        }
    }

def main():
    """Bucle principal de comunicación STDIO para MCP."""
    # Redirigir stdout con codificación UTF-8
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdin.reconfigure(encoding='utf-8')

    for line in sys.stdin:
        line_clean = line.strip()
        if not line_clean:
            continue
        try:
            req = json.loads(line_clean)
            resp = handle_request(req)
            if resp is not None:
                sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                sys.stdout.flush()
        except json.JSONDecodeError:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "JSON inválido"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": f"Error interno: {str(e)}"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
