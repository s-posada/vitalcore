# 05. Guion Estructurado para Presentación en Video (20 Minutos)

**Entrega:** Video de 20 minutos con cámara y pantalla compartida.  
**Equipo:** VitalCore (Consorcio de Producto & Desarrollo — UdeC).  

---

## ⏱️ Minutero y Distribución de Roles

```mermaid
gantt
    title Cronograma de los 20 Minutos de Presentación
    dateFormat  m:s
    axisFormat  %M:%S
    section 1. Estrategia & Pruebas
    Aspectos Clave & Métricas (20 pts) :00:00, 4m
    section 2. Nota UX V1
    Auditoría Heurística 74/100 (10 pts) :04:00, 3m
    section 3. Testeo Usuarios
    Resultados 3 Usuarios Reales (20 pts) :07:00, 5m
    section 4. Ajustes en Vivo
    Bases Vectoriales + Servidor MCP (50 pts) :12:00, 6m
    section 5. Cierre
    Conclusiones & Nueva Nota UX 92/100 :18:00, 2m
```

---

## 🎬 Guion Paso a Paso con Acciones en Pantalla

### Bloque 1 (00:00 – 04:00) | Introducción y Definición de Aspectos Clave [20 Puntos]
* **En Pantalla:** Diapositiva de portada de VitalCore + Diagrama de los 3 Aspectos Clave de Prueba.
* **Locución (Expositor 1):**
  > *"Hola profesor y compañeros. Hoy presentamos la evolución de VitalCore para el Trabajo 02. En nuestra primera versión construimos un prototipo funcional robusto para longevidad y bienestar. Sin embargo, para validar si la solución realmente respondía a la calidad esperada, definimos tres aspectos clave de testeo:*
  > 
  > 1. *El primer aspecto fue la **precisión biométrica del algoritmo** (Mifflin-St Jeor) y la coherencia calórica en los planes de 30 días, verificando latencias menores a 150 ms.*
  > 2. *El segundo aspecto fue la **adherencia y resiliencia en el registro diario**, evaluando el tiempo de llenado (Time-to-Log) y la tolerancia a micro-cortes de red.*
  > 3. *El tercer aspecto fue la **capacidad del asistente virtual y la búsqueda de contenidos**, midiendo la pertinencia de las respuestas y la velocidad para encontrar sustituciones de comidas o rutinas.*
  > 
  > *Combinamos pruebas automatizadas de backend con pruebas de usabilidad estandarizadas como la escala SUS y mediciones de tiempo de tarea crítica."*

---

### Bloque 2 (04:00 – 07:00) | Calificación Interna de UX V1 (74/100) [10 Puntos]
* **En Pantalla:** Pantalla `/trabajo02` (Pestaña "Evaluación Heurística UX") y gráfico de las 10 heurísticas de Nielsen.
* **Locución (Expositor 2):**
  > *"Antes de salir a testear con usuarios externos, como equipo nos sometimos a una rigurosa auditoría heurística basada en los 10 principios de Jakob Nielsen. Le otorgamos a nuestra V1 una **nota interna de 74 sobre 100**.*
  > 
  > *Aunque el diseño visual y la estética obtuvieron un 9/10 gracias al modo oscuro y la coherencia visual, identificamos tres debilidades críticas:*
  > * *Primero, **Flexibilidad y Eficiencia de Uso (5/10)**: La búsqueda dependía de coincidencias léxicas exactas. Si el usuario buscaba sinónimos, el sistema fallaba.*
  > * *Segundo, **Control y Libertad (6/10)**: Modificar una comida requería regenerar el mes completo.*
  > * *Tercero, **Asistencia Inteligente desconectada**: Nuestro chatbot conversaba amablemente pero no podía ver los datos reales del usuario en la base de datos viva."*

---

### Bloque 3 (07:00 – 12:00) | Conclusiones del Testeo con 3 Usuarios Reales [20 Puntos]
* **En Pantalla:** Pestaña "Testeo con 3 Usuarios" con las fichas de Valentina, Carlos y Marta.
* **Locución (Expositor 3):**
  > *"Sometimos el prototipo al método de pensamiento en voz alta con tres usuarios representativos:*
  > 
  > *1. **Valentina (26 años)**, atleta de alto rendimiento: Completó el onboarding fluidamente, pero al buscar 'desayuno rápido sin lactosa alto en proteína', la búsqueda tradicional devolvió 0 resultados. Nos dijo textualmente: 'Si la app no me entiende en lenguaje natural, da pereza buscar día por día'.*
  > 
  > *2. **Carlos (42 años)**, ejecutivo con poco tiempo: Tuvo que llenar 7 campos numéricos de macros en el registro nocturno y nos comentó: 'No peso el arroz en la oficina; necesito un botón rápido o decirle al bot lo que comí'.*
  > 
  > *3. **Marta (58 años)**, en readaptación física: Tenía miedo de lastimarse las rodillas al ver nombres técnicos en inglés. Quería buscar 'ejercicios seguros para dolor de rodilla' y la versión 1 no entendía la intención semántica.*
  > 
  > *El promedio de satisfacción SUS obtenido en esta primera ronda fue de **72.6/100**, con un tiempo de registro promedio de 47.6 segundos."*

---

### Bloque 4 (12:00 – 18:00) | Demostración en Vivo de los Ajustes Implementados [50 Puntos]
* **En Pantalla:** Navegador en vivo en `http://localhost:3000/trabajo02` probando el motor vectorial y el servidor MCP.
* **Locución (Expositor 4 / Demostrador Técnico):**
  > *"Para resolver el 100% de este feedback, transformamos la arquitectura de VitalCore implementando dos innovaciones de vanguardia:*
  > 
  > * **1. Motor de Búsqueda Semántica Vectorial:**
  >   *Veamos en pantalla: escribo 'tengo dolor de rodilla y busco ejercicio seguro'. Instantáneamente, gracias al cálculo de similitud coseno en un espacio vectorial denso, el sistema devuelve 'Puente de Glúteos en Suelo' con 59% de match y etiqueta `joint_friendly`, explicando por qué es seguro.*
  >   *Probemos ahora 'desayuno rápido sin lactosa rico en proteína': obtenemos 94% de match con el 'Bowl de Avena Proteica'. Esto resuelve completamente el dolor de Valentina y Marta.*
  > 
  > * **2. Servidor MCP (Model Context Protocol) & Agentic Tool Calling:**
  >   *Como el profesor mencionó la importancia de conectar herramientas a los modelos, implementamos un servidor MCP con el estándar abierto. Veamos en la pestaña MCP: tenemos 3 herramientas registradas.*
  >   *Si ejecuto `get_user_biometrics_and_progress`, el sistema extrae en vivo el TDEE de 3040 kcal y las metas del usuario. Si ejecuto `record_daily_log_quick`, el usuario o el asistente pueden registrar 2250 kcal con un solo clic o mediante una frase en el chat, reduciendo el Time-to-Log de 47 a menos de 8 segundos.*
  > 
  > *Todo esto está respaldado por nuestra suite automatizada `test_trabajo_02.py`, que pasa al 100%."*

---

### Bloque 5 (18:00 – 20:00) | Conclusiones, Nueva Calificación UX (92/100) y Cierre
* **En Pantalla:** Pestaña "Evaluación Heurística" mostrando la comparativa 74 ➔ 92/100 y resumen de logros.
* **Locución (Expositor 1 / Cierre del Equipo):**
  > *"Al aplicar estos ajustes, volvimos a evaluar las heurísticas de Nielsen:*
  > * *La Flexibilidad de uso subió de 5/10 a 9/10.*
  > * *La Asistencia inteligente alcanzó 10/10 gracias a la integración MCP.*
  > * *Nuestra **nueva calificación interna de UX asciende a 92 sobre 100**.*
  > 
  > *VitalCore demuestra cómo la combinación de rigor metodológico en prototipaje, testeo centrado en el usuario y tecnologías modernas como bases vectoriales y protocolos agénticos permiten evolucionar una idea hacia un producto de nivel profesional.*
  > 
  > *Muchas gracias por su atención."*
