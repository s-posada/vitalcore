# 05. Guion Estructurado para Presentación en Video (Trabajo 02)

Asignatura: Prototipos y Creatividad  
Profesor: Martín Mellado Guerrero  
Universidad de Concepción  
Equipo: VitalCore (Sebastián Posada, Andy Burboa, Yenny Sánchez, Fabián Alvarado, Catalina, Mariam)  

---

## 1. Distribución Modular de Roles (Propuesta para 6 Integrantes)

El video tiene una duración planificada de 15 a 20 minutos. Cada bloque cuenta con el contenido que se debe exponer y el apoyo visual correspondiente. Si el equipo decide que presenten solo 2 o 3 integrantes y que el resto apoye en edición y diapositivas, los bloques pueden fusionarse de forma natural.

| Bloque | Minutero Aprox. | Expositor Sugerido | Tema Central | Apoyo Visual |
| :---: | :---: | :--- | :--- | :--- |
| Bloque 1 | 00:00 - 03:00 | Sebastián Posada | Apertura, propuesta de valor de VitalCore y aspecto 1 de testeo (Onboarding y motor calórico). | Diapositivas 1 y 2 + diagrama de arquitectura. |
| Bloque 2 | 03:00 - 06:00 | Andy Burboa | Aspectos 2 y 3 de testeo (latencia del asistente inteligente y métricas de telemetría diaria). | Diapositivas con pruebas funcionales y no funcionales. |
| Bloque 3 | 06:00 - 09:00 | Yenny Sánchez | Evaluación interna de UX (nota 74/100), análisis según heurísticas de Nielsen y backlog de fricciones iniciales. | Recorrido por el prototipo V1 señalando puntos de fricción. |
| Bloque 4 | 09:00 - 12:30 | Catalina | Resultados del testeo con usuarios reales (Valentina, Carlos y Marta), tiempos por tarea y puntaje SUS. | Gráficos de resultados y citas textuales de usuarios. |
| Bloque 5 | 12:30 - 16:30 | Fabián Alvarado | Demostración en vivo de los ajustes técnicos en V2: Búsqueda Semántica Vectorial (Similitud Coseno) y Servidor MCP. | Navegación compartida por la aplicación web en /trabajo02. |
| Bloque 6 | 16:30 - 20:00 | Mariam (+ Cierre grupal) | Ajustes en telemetría (Quick Log), matriz de trazabilidad feedback-código y conclusiones metodológicas. | Matriz de trazabilidad y cámara activa del equipo para cierre. |

---

## 2. Libreto Detallado por Bloque

### Bloque 1: Introducción y Aspectos Clave de Testeo (Sebastián Posada)
* **Objetivo:** Plantear el problema, justificar el prototipo y abrir el primer criterio de evaluación.
* **Pauta verbal sugerida:**  
  "Buenos días profesor Martín y compañeros. Presentamos la evolución de VitalCore para el Trabajo 02. VitalCore es una plataforma diseñada para resolver la baja adherencia en programas de longevidad y bienestar mediante personalización adaptativa y asistencia agéntica.  
  Para esta segunda entrega, la pauta nos solicitó definir aspectos clave a testear con nuestra primera versión para verificar su calidad. Definimos tres frentes complementarios: pruebas funcionales, pruebas no funcionales y métricas de producto. El primer aspecto testeado fue el flujo de onboarding y el motor de scoring metabólico, donde evaluamos la exactitud en el cálculo del TDEE y el reparto de macronutrientes bajo la ecuación Mifflin-St Jeor, garantizando persistencia reactiva sin pérdida de datos ante caídas de conexión."

---

### Bloque 2: Pruebas No Funcionales y Métricas (Andy Burboa)
* **Objetivo:** Completar el punto 1 de la pauta con métricas técnicas y de usabilidad.
* **Pauta verbal sugerida:**  
  "Continuando con el plan de pruebas, nuestro segundo aspecto clave fue la latencia y coherencia del asistente inteligente. Al integrar modelos de lenguaje, el desafío no es solo que respondan, sino que mantengan tiempos de respuesta inferiores a 850 milisegundos y ejecuten herramientas seguras sobre la base de datos viva.  
  El tercer aspecto evaluado fue la fricción en la captura de telemetría diaria. Definimos métricas de Lean Analytics: tasa de abandono en el formulario y tiempo total requerido para registrar un día completo de nutrición y ejercicio. Establecimos como umbral de éxito un tiempo de registro inferior a 10 segundos, frente a los 45 segundos promedio que demandaba la versión inicial."

---

### Bloque 3: Evaluación Interna de UX (Yenny Sánchez)
* **Objetivo:** Defender la nota interna de 0 a 100 y sustentar la autocrítica de usabilidad.
* **Pauta verbal sugerida:**  
  "El segundo punto de la pauta exigía establecer una nota interna de UX de 0 a 100 para la versión inicial y detallar los aspectos pendientes por mejorar. Nuestro equipo asignó una calificación objetiva de 74 sobre 100, utilizando como marco las diez heurísticas de usabilidad de Jakob Nielsen.  
  Identificamos cuatro problemas principales: primero, una sobrecarga cognitiva severa al exigir siete campos obligatorios para registrar la comida nocturna; segundo, una transgresión a la heurística de visibilidad del estado del sistema, ya que el usuario no recibía confirmación visual inmediata tras guardar sus datos; tercero, un buscador rígido que fallaba ante sinónimos o lenguaje coloquial; y cuarto, deficiencias de contraste en gráficos oscuros en dispositivos móviles. Todo esto quedó categorizado en un backlog de mejoras priorizado para la versión dos."

---

### Bloque 4: Resultados de Testeo con 3 Usuarios (Catalina)
* **Objetivo:** Exponer la evidencia de las pruebas con usuarios reales (punto 3 de la pauta).
* **Pauta verbal sugerida:**  
  "Para validar estas hipótesis, condujimos pruebas observadas con tres usuarios reales que representaban perfiles contrastantes.  
  La primera usuaria fue Valentina, de 26 años, orientada al rendimiento deportivo y con intolerancia a la lactosa. Al buscar recetas con términos como 'avena sin leche', el sistema no arrojaba resultados por buscar coincidencia exacta de texto.  
  El segundo usuario fue Carlos, de 42 años, ejecutivo con jornadas laborales extensas. Carlos abandonó el registro nocturno en el tercer intento debido al tiempo que requería detallar carbohidratos y grasas por separado.  
  La tercera usuaria fue Marta, de 58 años, con condromalacia rotuliana en una rodilla. Marta manifestó temor a iniciar rutinas de ejercicio cuyos títulos en inglés no le garantizaban protección articular. El puntaje promedio SUS obtenido fue de 68 puntos, confirmando la necesidad de los ajustes implementados."

---

### Bloque 5: Demostración en Vivo de Ajustes V2 (Fabián Alvarado)
* **Objetivo:** Mostrar los cambios en código y funcionamiento real (punto 4 de la pauta, 50 puntos).
* **Pauta verbal sugerida:**  
  "Pasando al núcleo de la entrega, que corresponde a los ajustes implementados para cubrir el feedback, procedo a compartir pantalla con la plataforma en ejecución.  
  En primer lugar, reemplazamos la búsqueda textual por un motor semántico vectorial desarrollado en el backend con normalización de vectores y similitud coseno. Como pueden observar en la ruta /trabajo02, al consultar 'desayuno rápido sin lactosa rico en proteína', el sistema arroja un 94% de afinidad semántica hacia nuestro Bowl de Avena Proteica. Igualmente, ante la consulta 'dolor de rodilla', el motor prioriza ejercicios con etiqueta joint_friendly.  
  En segundo lugar, implementamos un servidor bajo el estándar Model Context Protocol (MCP v1.0). El asistente virtual ya no genera texto genérico: invoca de forma autónoma herramientas para leer la biometría viva del usuario y registrar datos directamente en la base de datos."

---

### Bloque 6: Trazabilidad, Métricas de Impacto y Cierre (Mariam + Cierre Grupal)
* **Objetivo:** Consolidar la matriz de trazabilidad y concluir la presentación.
* **Pauta verbal sugerida:**  
  "Como complemento a la arquitectura, rediseñamos el flujo de telemetría implementando un registro rápido en un solo clic. El usuario únicamente ingresa sus calorías totales y el backend distribuye automáticamente los macronutrientes estimados, reduciendo el tiempo de registro de 47.6 a 7.8 segundos.  
  En la matriz de trazabilidad, cada dolor levantado por Valentina, Carlos y Marta cuenta con una solución técnica validada y certificada mediante una suite de pruebas automatizadas en FastAPI y Next.js.  
  Agradecemos la atención del profesor Martín y quedamos atentos a sus preguntas y comentarios."
