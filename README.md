# VitalCore

Prototipo académico full-stack de bienestar integral. Combina planes de nutrición y entrenamiento, seguimiento biométrico, búsqueda semántica y un coach asistido por IA.

> VitalCore es una demostración educativa, no un dispositivo médico ni un sustituto de asesoría profesional. No debe usarse para diagnóstico o tratamiento.

## Arquitectura

- `frontend/`: Next.js 16, React 19, TypeScript y Tailwind CSS.
- `backend/`: FastAPI, SQLAlchemy y SQLite.
- `backend/semantic_engine.py`: búsqueda semántica con embeddings y respaldo local determinista.
- `backend/agent.py`: agente LangChain con herramientas de dominio.
- `backend/mcp_server.py`: exposición de herramientas mediante MCP/SSE.

## Inicio local

Requisitos: Node.js 22+, Python 3.12+ y PowerShell en Windows.

```powershell
python -m venv backend/venv
backend/venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
./start_all.ps1
```

Frontend: `http://localhost:3000`. API y documentación: `http://localhost:8000` y `http://localhost:8000/docs`.

El modo demo funciona sin credenciales; para respuestas Gemini reales, defina `GEMINI_API_KEY` en el entorno antes de ejecutar el script.

Con Docker, copie primero `.env.example` a `.env`, complete los valores deseados y ejecute `docker compose up --build`.

## Calidad

```powershell
backend/venv/Scripts/python.exe -m pytest -q
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend audit
```

La integración continua ejecuta estos controles en cada push y pull request.

## Configuración

Las variables están documentadas en `.env.example`. En producción, `SECRET_KEY` es obligatoria y debe ser aleatoria. `DEMO_MODE=true` habilita el acceso académico por perfiles predefinidos; no equivale a autenticación real.

Antes de operar con usuarios reales se debe configurar `DEMO_MODE=false` e integrar OAuth/OIDC, autorización por recurso, consentimiento para datos de salud, una base de datos administrada y una pasarela de pagos. El estado detallado se mantiene en `AUDIT.md`.
