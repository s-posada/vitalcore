"""
VitalCore — Test de Validación del Servidor MCP STDIO
=====================================================
Verifica que el servidor STDIO responda correctamente a:
1. initialize
2. tools/list
3. tools/call (búsqueda semántica)
4. resources/list
5. resources/read
"""

import subprocess
import json
import sys
import os

python_exe = sys.executable
server_script = os.path.join(os.path.dirname(__file__), "mcp_server_stdio.py")

def run_test():
    print("===============================================================")
    print("  🔌 AUDITORÍA STDIO DEL SERVIDOR MCP DE VITALCORE")
    print("===============================================================")

    proc = subprocess.Popen(
        [python_exe, server_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8"
    )

    def send_and_receive(req):
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        return json.loads(line)

    try:
        # 1. Initialize
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {"protocolVersion": "2024-11-05"}
        }
        res1 = send_and_receive(init_req)
        assert res1["result"]["serverInfo"]["name"] == "vitalcore-mcp-server"
        print(f"✅ 1. MCP 'initialize' correcto -> Servidor: {res1['result']['serverInfo']['name']} v{res1['result']['serverInfo']['version']}")

        # 2. Tools List
        tools_req = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        res2 = send_and_receive(tools_req)
        tools = res2["result"]["tools"]
        assert len(tools) >= 3
        print(f"✅ 2. MCP 'tools/list' -> {len(tools)} herramientas expuestas con JSON Schema")

        # 3. Tool Call: search_catalog_semantic
        call_req = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "search_catalog_semantic",
                "arguments": {"query": "receta con avena sin lactosa", "category": "nutricion", "limit": 1}
            }
        }
        res3 = send_and_receive(call_req)
        content_text = res3["result"]["content"][0]["text"]
        parsed_res = json.loads(content_text)
        assert parsed_res["total_matches"] > 0
        print(f"✅ 3. MCP 'tools/call' exitoso -> Encontró: '{parsed_res['matches'][0]['title']}'")

        # 4. Resources List
        res_list_req = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "resources/list",
            "params": {}
        }
        res4 = send_and_receive(res_list_req)
        resources = res4["result"]["resources"]
        assert len(resources) >= 2
        print(f"✅ 4. MCP 'resources/list' -> {len(resources)} recursos disponibles")

        # 5. Resources Read
        read_req = {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "resources/read",
            "params": {"uri": "vitalcore://system/status"}
        }
        res5 = send_and_receive(read_req)
        assert "healthy" in res5["result"]["contents"][0]["text"]
        print(f"✅ 5. MCP 'resources/read' -> Recurso 'vitalcore://system/status' leído correctamente")

        print("===============================================================")
        print("  🏆 SERVIDOR MCP STDIO VALIDADO AL 100% PARA CLIENTES EXTERNOS")
        print("===============================================================")

    finally:
        proc.stdin.close()
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_test()
