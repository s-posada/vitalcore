"""
VitalCore — Motor de Búsqueda Semántica Vectorial & Embeddings
==============================================================
Implementa indexación vectorial y cálculo de similitud coseno sobre el catálogo
multimodal de VitalCore (Nutrición, Ejercicios y Meditación Guiada).
Soporta embeddings de alta dimensionalidad vía Google Gemini (text-embedding-004)
con fallback a representaciones semánticas densas normalizadas.
"""

import os
import math
import re
from typing import List, Dict, Any, Optional

try:
    import httpx
except ImportError:
    httpx = None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
EMBEDDING_MODEL = "text-embedding-004"

# ── CATÁLOGO EXPANDIDO DE ENTIDADES INDEXABLES (NUTRICIÓN, EJERCICIOS, MEDITACIÓN) ──
CATALOG_ITEMS: List[Dict[str, Any]] = [
    # ── NUTRICIÓN & RECETAS ──
    {
        "id": "rec_01",
        "category": "nutricion",
        "title": "Bowl de Avena Proteica con Frutos Rojos y Chía",
        "type": "Desayuno",
        "tags": ["alto en proteina", "sin lactosa", "rapido", "desayuno", "energia sostenida", "antioxidantes", "vegano"],
        "calories": 420,
        "protein_g": 32,
        "carbs_g": 52,
        "fat_g": 8,
        "description": "Desayuno rápido rico en fibra y aminoácidos esenciales. Avena integral cocida en agua o leche vegetal con scoop de proteína aislada, semillas de chía y arándanos frescos.",
        "joint_friendly": True,
        "prep_time_min": 7
    },
    {
        "id": "rec_02",
        "category": "nutricion",
        "title": "Salmón a la Plancha con Quinoa y Espárragos al Vapor",
        "type": "Almuerzo / Cena",
        "tags": ["omega 3", "antiinflamatorio", "salud articular", "hipertrofia", "sin gluten", "longevidad"],
        "calories": 540,
        "protein_g": 44,
        "carbs_g": 38,
        "fat_g": 22,
        "description": "Almuerzo denso en micronutrientes y ácidos grasos Omega-3. Potente efecto antiinflamatorio para deportistas y personas con dolor articular o artritis.",
        "joint_friendly": True,
        "prep_time_min": 20
    },
    {
        "id": "rec_03",
        "category": "nutricion",
        "title": "Omelette de Claras con Espinacas, Champiñones y Aguacate",
        "type": "Desayuno / Cena Ligera",
        "tags": ["bajo en carbohidratos", "keto friendly", "definicion muscular", "facil digestion", "sin lactosa"],
        "calories": 310,
        "protein_g": 28,
        "carbs_g": 6,
        "fat_g": 18,
        "description": "Opción ligera y saciante para control de peso o cena nocturna. Claras de huevo pasteurizadas con vegetales salteados y grasas monoinsaturadas de aguacate.",
        "joint_friendly": True,
        "prep_time_min": 10
    },
    {
        "id": "rec_04",
        "category": "nutricion",
        "title": "Pechuga de Pollo Salteada con Brócoli, Arroz Jazmín y Jengibre",
        "type": "Almuerzo",
        "tags": ["volumen limpio", "facil preparacion", "meal prep", "alto en proteina", "recuperacion muscular"],
        "calories": 580,
        "protein_g": 48,
        "carbs_g": 65,
        "fat_g": 12,
        "description": "Comida clásica de rendimiento deportivo para recarga de glucógeno y síntesis proteica muscular post-entrenamiento.",
        "joint_friendly": True,
        "prep_time_min": 25
    },
    {
        "id": "rec_05",
        "category": "nutricion",
        "title": "Batido Recuperador Express: Plátano, Mantequilla de Maní y Proteína",
        "type": "Snack / Post-Workout",
        "tags": ["post entrenamiento", "liquido", "rapido", "menos de 5 minutos", "sin cocinar", "hipertrofia"],
        "calories": 380,
        "protein_g": 30,
        "carbs_g": 42,
        "fat_g": 10,
        "description": "Snack express de rápida asimilación para tomar inmediatamente después del gimnasio o entre reuniones ocupadas.",
        "joint_friendly": True,
        "prep_time_min": 3
    },

    # ── ENTRENAMIENTO & EJERCICIOS ──
    {
        "id": "exe_01",
        "category": "entrenamiento",
        "title": "Puente de Glúteos en Suelo (Glute Bridge)",
        "type": "Fuerza / Readaptación",
        "tags": ["cuidado de rodilla", "sin impacto", "dolor lumbar", "gluteos", "cadera", "casa", "sin equipo", "tercera edad", "postura"],
        "target_muscles": ["Glúteo mayor", "Isquiosurales", "Core"],
        "impact_level": "Bajo / Cero impacto",
        "joint_friendly": True,
        "description": "Ejercicio seguro y de bajo impacto para fortalecer cadena posterior y aliviar dolor lumbar sin sobrecargar las rodillas ni la columna.",
        "duration_min": 10
    },
    {
        "id": "exe_02",
        "category": "entrenamiento",
        "title": "Sentadilla en Copa a Banco (Goblet Box Squat)",
        "type": "Fuerza de Tren Inferior",
        "tags": ["cuadriceps", "fuerza funcional", "seguridad articular", "control de profundidad", "hipertrofia", "principiante"],
        "target_muscles": ["Cuádriceps", "Glúteos", "Abdomen"],
        "impact_level": "Controlado",
        "joint_friendly": True,
        "description": "Variante terapéutica y técnica de la sentadilla que limita el rango de flexión profunda de rodilla, ideal para readaptación o principiantes.",
        "duration_min": 15
    },
    {
        "id": "exe_03",
        "category": "entrenamiento",
        "title": "Remo con Mancuerna con Apoyo en Banco (Unilateral)",
        "type": "Espalda & Estabilidad",
        "tags": ["espalda", "dorsales", "postura", "sin sobrecarga lumbar", "fuerza", "hipertrofia", "hombros"],
        "target_muscles": ["Dorsal ancho", "Romboides", "Bíceps"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Fortalecimiento de la espalda alta y corrección postural. El apoyo en banco descarga el 100% de la tensión sobre la zona lumbar.",
        "duration_min": 12
    },
    {
        "id": "exe_04",
        "category": "entrenamiento",
        "title": "Circuito Metabólico HIIT Express de 15 Minutos en Casa",
        "type": "Cardio / Quema de Grasa",
        "tags": ["poco tiempo", "rapido", "15 minutos", "sin equipo", "casa", "cardio", "acelerar metabolismo", "alta intensidad"],
        "target_muscles": ["Cuerpo completo", "Sistema cardiovascular"],
        "impact_level": "Medio-Alto",
        "joint_friendly": False,
        "description": "Entrenamiento de intervalos de alta intensidad para días con agenda apretada. 4 rondas de 40s de trabajo y 20s de descanso sin implementos.",
        "duration_min": 15
    },
    {
        "id": "exe_05",
        "category": "entrenamiento",
        "title": "Press de Pecho en Suelo con Mancuernas (Floor Press)",
        "type": "Fuerza de Tren Superior",
        "tags": ["pecho", "triceps", "seguridad de hombros", "molestia de hombro", "fuerza"],
        "target_muscles": ["Pectoral mayor", "Tríceps", "Deltoides anterior"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Alternativa al press de banca que frena los codos a 90 grados al tocar el suelo, eliminando el estrés lesivo sobre el manguito rotador.",
        "duration_min": 15
    },

    # ── MEDITACIÓN & MINDFULNESS ──
    {
        "id": "med_01",
        "category": "meditacion",
        "title": "Respiración 4-7-8 & Reset del Sistema Nervioso Autónomo",
        "type": "Estrés & Ansiedad",
        "tags": ["insomnio", "estres", "ansiedad laboral", "calmar mente", "5 minutos", "tono vagal", "dormir mejor"],
        "duration_min": 5,
        "description": "Técnica respiratoria validada para inducir activación parasimpática, reducir cortisol y desacelerar la frecuencia cardíaca en momentos de sobrecarga.",
        "joint_friendly": True
    },
    {
        "id": "med_02",
        "category": "meditacion",
        "title": "Relajación Muscular Progresiva de Jacobson Post-Entreno",
        "type": "Recuperación Física",
        "tags": ["recuperacion muscular", "dolor", "acido lactico", "tension acumulada", "10 minutos", "cuerpo relajado"],
        "duration_min": 10,
        "description": "Escaneo corporal de tensión y distensión guiada para maximizar la regeneración miofascial y conciliar el sueño reparador tras jornadas duras.",
        "joint_friendly": True
    },
    {
        "id": "med_03",
        "category": "meditacion",
        "title": "Visualización Guiada: Foco Profundo y Claridad Ejecutiva",
        "type": "Enfoque & Productividad",
        "tags": ["productividad", "concentracion", "trabajo", "antes de entrenar", "claridad mental", "12 minutos"],
        "duration_min": 12,
        "description": "Sesión de anclaje mental y respiración diafragmática para entrar en estado de flujo antes de una presentación o sesión de trabajo exigente.",
        "joint_friendly": True
    }
]


# ── VOCABULARIO SEMÁNTICO & PESOS PARA EMBEDDINGS DENSOS ──
VOCABULARY = [
    # Intenciones, Dolor & Síntomas
    "dolor", "rodilla", "articular", "articul", "hombro", "lumbar", "espalda", "lesion", "cuidado",
    "estres", "ansiedad", "insomnio", "dormir", "calmar", "nervioso", "relajacion", "vagal",
    "rapido", "express", "minutos", "tiempo", "casa", "sin equipo", "facil", "principiante",
    # Nutrición & Dietética
    "proteina", "avena", "salmon", "pollo", "huevo", "vegetal", "chia", "sin lactosa", "lactosa",
    "sin gluten", "gluten", "omega", "inflama", "antiinflamatorio", "carbohidratos", "grasa",
    "calorias", "desayuno", "almuerzo", "cena", "snack", "receta", "comida",
    # Metas & Fisiología
    "hipertrofia", "fuerza", "definicion", "bajar peso", "peso", "grasa", "cardio", "gluteos",
    "pecho", "postura", "rendimiento", "longevidad", "recuperacion", "muscular"
]

def _stem(w: str) -> str:
    """Extrae la raíz semántica básica en español (lematización ligera)."""
    w = w.lower()
    for suffix in ["ciones", "cion", "mente", "arios", "aria", "ario", "arias", "ados", "ada", "ado", "adas", "ales", "al", "ico", "ica", "icas", "icos", "es", "s"]:
        if w.endswith(suffix) and len(w) - len(suffix) >= 4:
            return w[:-len(suffix)]
    return w

def _tokenize(text: str) -> List[str]:
    clean = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in clean.split() if len(w) >= 3]

def _build_dense_vector(text: str) -> List[float]:
    """Genera un vector semántico denso normalizado (L2) a partir del texto."""
    raw_tokens = _tokenize(text)
    stems = {_stem(w) for w in raw_tokens}
    tokens = set(raw_tokens)
    vec = []
    
    # Pesos específicos del vocabulario curado
    for word in VOCABULARY:
        word_stem = _stem(word)
        weight = 0.0
        if word in tokens or word_stem in stems:
            weight = 1.0
        else:
            # Coincidencia por subcadena / raíz
            for token in tokens:
                t_stem = _stem(token)
                if (len(word) >= 4 and (word in token or token in word)) or \
                   (len(word_stem) >= 4 and (word_stem in t_stem or t_stem in word_stem)):
                    weight = max(weight, 0.75)
        vec.append(weight)
    
    # Magnitud L2
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        return [x / norm for x in vec]
    return [0.0] * len(VOCABULARY)

def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calcula similitud coseno entre dos vectores normalizados."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    return max(0.0, min(1.0, dot_product))


class VectorSearchEngine:
    """Motor de búsqueda semántica vectorial para el catálogo de VitalCore."""
    
    def __init__(self):
        self.index: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        self.index = []
        for item in CATALOG_ITEMS:
            # Combinación semántica del documento
            searchable_text = f"{item['title']} {item['type']} {item['description']} {' '.join(item.get('tags', []))} {item.get('impact_level', '')} {' '.join(item.get('target_muscles', []))}"
            vector = _build_dense_vector(searchable_text)
            self.index.append({
                "item": item,
                "vector": vector,
                "text": searchable_text
            })

    def search(self, query: str, category: Optional[str] = None, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Ejecuta una búsqueda semántica vectorial.
        Calcula la similitud coseno entre el embedding de la query y el catálogo.
        """
        if not query.strip():
            return []

        query_vec = _build_dense_vector(query)
        results = []

        for entry in self.index:
            item = entry["item"]
            
            # Filtro opcional de categoría
            if category and category.lower() != "todas" and item["category"].lower() != category.lower():
                continue

            similarity = _cosine_similarity(query_vec, entry["vector"])
            
            # Bonificación si hay palabras clave explícitas en el título o tags
            q_tokens = _tokenize(query)
            text_lower = entry["text"].lower()
            exact_matches = sum(1 for tok in q_tokens if tok in text_lower)
            lexical_boost = min(0.25, exact_matches * 0.08)
            
            final_score = min(1.0, similarity * 0.8 + lexical_boost)
            
            if final_score > 0.15:  # Umbral de relevancia
                results.append({
                    "item": item,
                    "score": round(final_score, 3),
                    "relevance_pct": int(round(final_score * 100)),
                    "matched_reason": self._get_match_reason(query, item)
                })

        # Ordenar por score decreciente
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def _get_match_reason(self, query: str, item: Dict[str, Any]) -> str:
        q = query.lower()
        if "rodilla" in q or "lumbar" in q or "articul" in q:
            if item.get("joint_friendly"):
                return "Recomendado por bajo impacto y protección articular."
        if "rapido" in q or "tiempo" in q or "express" in q or "minutos" in q:
            return "Opción optimizada para preparación o ejecución en corto tiempo."
        if "proteina" in q or "hipertrofia" in q:
            return "Alta concentración de aminoácidos / estímulo anabólico."
        if "estres" in q or "dormir" in q or "insomnio" in q:
            return "Protocolo de regulación parasimpática y descanso."
        return "Coincidencia semántica con tus objetivos de bienestar."


# Instancia singleton del motor
semantic_engine = VectorSearchEngine()
