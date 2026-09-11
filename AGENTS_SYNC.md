# PROTOCOLO DE SINCRONIZACIÓN Y CONTEXTO VIVO DEL EQUIPO
> **Archivo de referencia obligatoria para:** Usuario, Antigravity, Claude, Gemini y Codex.  
> **Ubicación:** `vitalcore/AGENTS_SYNC.md`  
> **Última sincronización:** 2026-09-10 23:45 UTC-3  
> **Rama activa principal:** `feat/specs-01-02-03` | **Base remota:** `origin/fix/borrar-headers`

---

## 1. Reglas de Convivencia para Agentes e Ingenieros

Cada vez que un agente (Claude, Gemini, Codex, Antigravity) o desarrollador comience o finalice una tarea, debe respetar este protocolo:

1. **Lectura obligatoria:** Al iniciar cualquier sesión o tarea, leer este archivo para conocer el estado actual y no sobreescribir ni duplicar esfuerzos.
2. **Entorno de ejecución:** Trabajar exclusivamente en el entorno virtual local de Python:
   - Activación: `backend\venv\Scripts\activate`
   - Intérprete: `backend/venv/Scripts/python.exe`
3. **No rutas absolutas locales:** Nunca subir rutas dependientes de la máquina local (ej. `C:\Users\...`). Todo path de configuración o código debe ser relativo o provisto por variables de entorno.
4. **Prevención de dependencias circulares:** No importar componentes de FastAPI (`main.py`) dentro de módulos de utilidades, agentes o servidores (`agent.py`, `semantic_engine.py`, `mcp_server.py`, `engine_registry.py`).
5. **Registro al terminar:** Antes de concluir el turno o entregar cambios, actualizar la sección **"Bitácora de Últimas Acciones"** y el estado de **"Tareas Pendientes"** en este documento.

---

## 2. Mapa Arquitectónico y Enlaces Clave

| Componente | Archivo | Responsabilidad / Detalle |
| :--- | :--- | :--- |
| **API Principal** | [backend/main.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/main.py) | Endpoints FastAPI, ciclo de vida startup, CORS regex, `/mcp/sse`, `/api/ai/agent-chat`. |
| **Modelo BD** | [backend/database.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/database.py) | Modelos SQLAlchemy: `CatalogItem`, `User`, `NutritionPlan`, `DailyLog`, etc. |
| **Poblado de Datos** | [backend/seed.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/seed.py) | Datos de fundadores, 50 ítems de catálogo (`CATALOG_SEED`) con embeddings idempotentes. |
| **Registro de Motor** | [backend/engine_registry.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/engine_registry.py) | Singleton desacoplado (`get_engine`, `set_engine`) para evitar imports circulares. |
| **Búsqueda Semántica**| [backend/semantic_engine.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/semantic_engine.py) | Embeddings Gemini `text-embedding-004` (768d) y vector denso normalizado sin diacríticos. |
| **Agente Autónomo** | [backend/agent.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/agent.py) | Agente LangChain desacoplado con 4 herramientas (`get_user_biometrics`, `search_catalog`, etc.). |
| **Servidor MCP** | [backend/mcp_server.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/mcp_server.py) | Herramientas MCP estándar expuestas tanto en API como en stdio y SSE. |
| **Config MCP** | [backend/mcp_config.json](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/mcp_config.json) | Manifiesto de conectores MCP locales y remotos (`vitalcore-remote` en Render). |
| **Suite de Pruebas** | [backend/test_specs_suite.py](file:///c:/Users/User/Documents/Academico/UdeConcepcion/Cursos/2%20Semestre/Prototipos/vitalcore/backend/test_specs_suite.py) | 14 pruebas automatizadas que validan SPEC-01, SPEC-02 y SPEC-03 al 100%. |

---

## 3. Estado Actual del Sistema

- **SPEC-01 (Persistencia del Catálogo):** Completada. 50 ítems en SQLite (`catalog_items`), embeddings preservados, motor desacoplado vía registro.
- **SPEC-02 (Agente LangChain):** Completada. Agente con 4 herramientas operativas, rate limiting en memoria (8 req/60s), generación real de planes con persistencia.
- **SPEC-03 (WebMCP sobre SSE):** Completada. Endpoint `GET /mcp/sse` implementado con protocolo `2024-11-05`, ping de 15s para Render, CORS consolidado y configuración portátil.
- **Validación automatizada:** `pytest` ejecutado con éxito (15/15 tests pasando entre la suite de especificaciones y auditoría técnica).
- **Git:** Rama `feat/specs-01-02-03` publicada en remoto (`origin`).

---

## 4. Bitácora de Últimas Acciones

| Fecha / Hora | Autor / Agente | Rama | Resumen de la Acción Realizada |
| :--- | :--- | :--- | :--- |
| **2026-09-10 23:40** | Antigravity | `feat/specs-01-02-03` | Implementación completa y validación de SPEC-01, SPEC-02 y SPEC-03. Commit `ad2b949` subido al remoto. |
| **2026-09-10 22:50** | Andy (AndresBurboa) | `fix/borrar-headers` | Commit `260c9c3` con ajustes de cabeceras de frontend/backend. |
| **2026-09-10 23:45** | Antigravity | `feat/specs-01-02-03` | Creación de `AGENTS_SYNC.md` como fuente única de verdad para el equipo (Usuario, Claude, Gemini, Codex). |

---

## 5. Tareas Pendientes / Próximos Pasos (Backlog Inmediato)

1. [ ] **Revisión y Merge:** Revisar el Pull Request de `feat/specs-01-02-03` hacia `main` o integrar con la rama de Andy según definan con el equipo.
2. [ ] **Pruebas en Frontend:** Probar la integración de la llamada al agente (`/api/ai/agent-chat`) y el catálogo semántico desde la UI de Next.js.
3. [ ] **Despliegue Render:** Validar el streaming del endpoint `GET /mcp/sse` en el entorno productivo de Render con el ping de 15 segundos.
