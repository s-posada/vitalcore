# Auditoría técnica y de producto

Fecha: 2026-09-11

## Dictamen

VitalCore es una demo académica funcional y visualmente consistente. Tras esta revisión cuenta con controles automáticos, tipos explícitos, sesiones firmadas para administración, validación de entrada, configuración reproducible y documentación de operación. Aún no debe tratarse como un producto de salud listo para usuarios reales.

## Corregido en esta revisión

- Se eliminó el fallback que fabricaba una sesión administrativa cuando fallaba el login.
- El panel administrativo dejó de confiar en un correo enviado por query string y exige un token firmado.
- El login ya no permite que un usuario nuevo se asigne un plan pagado.
- Se añadió validación de rangos biométricos, registros diarios, planes y texto libre.
- Se consolidaron dos eventos de inicio duplicados en un único `lifespan` de FastAPI.
- Se actualizaron APIs deprecadas de SQLAlchemy, Pydantic y fecha/hora.
- Se sustituyeron tipos `any` por contratos TypeScript compartidos.
- Se modernizó ESLint, se añadió `typecheck` y se activó CI.
- Se retiró `next-auth` sin uso y se actualizó Next.js para resolver las vulnerabilidades conocidas por `npm audit`.
- Se agregaron endpoint de salud, secretos generados en Render y healthchecks de Docker.

## Riesgos pendientes antes de producción

| Prioridad | Riesgo | Cierre recomendado |
|---|---|---|
| P0 | El acceso sigue siendo una demo basada en identidad declarada | OAuth/OIDC real, cookies HttpOnly y rotación/revocación de sesiones |
| P0 | Varias rutas aceptan `user_id` sin autorización por propietario | Política central de autorización y pruebas de acceso cruzado |
| P0 | Se procesan datos biométricos y notas de salud | Consentimiento, minimización, cifrado, retención y revisión legal local |
| P1 | El cambio de plan simula pago | Integrar proveedor de pagos con webhooks idempotentes |
| P1 | SQLite y rate limiting en memoria no escalan horizontalmente | PostgreSQL administrado y Redis |
| P1 | Herramientas MCP con escritura carecen de autorización delegada | OAuth para MCP, scopes y auditoría por herramienta |
| P2 | Métricas y contenido de ejemplo pueden confundirse con datos reales | Etiquetar fixtures/demo y separar analítica real |

## Criterio de salida a producción

No habilitar `DEMO_MODE=false` hasta completar los P0. Después, ejecutar pruebas de seguridad, accesibilidad, respaldo/restauración, observabilidad y carga, y documentar responsable y evidencia para cada control.
