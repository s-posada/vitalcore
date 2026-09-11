"""Seed database with realistic users, founders (Equipo 2), investor, events, groups, and logs."""
import json, sys, os
from datetime import datetime, timedelta, UTC
import random

from database import (
    SessionLocal, create_tables, User, UserProfile, NutritionPlan,
    WorkoutPlan, DailyLog, Post, Comment, MeditationSession,
    CommunityGroup, Event, EventRSVP, CatalogItem
)


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)

FOUNDERS_EQUIPO_2 = [
    {
        "email": "sposada2026@udec.cl",
        "name": "Sebastian Posada Posada",
        "role": "CEO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/men/12.jpg"
    },
    {
        "email": "andresburboa@udec.cl",
        "name": "Andres Gonzalo Burboa Lizama",
        "role": "CTO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        "email": "cavergara2019@udec.cl",
        "name": "Catalina Antonia Vergara Donoso",
        "role": "Chief Health Officer & Co-Fundadora",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
        "email": "falvarado2016@udec.cl",
        "name": "Fabian Alonso Alvarado Arriagada",
        "role": "Head of AI & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
        "email": "margarcia2026@udec.cl",
        "name": "Marian Garcia Cruz",
        "role": "Head of Product & Co-Fundadora",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/women/65.jpg"
    },
    {
        "email": "yesanchez2026@udec.cl",
        "name": "Yenny Sanchez Aguilar",
        "role": "COO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://randomuser.me/api/portraits/men/67.jpg"
    }
]

INVESTOR = {
    "email": "martin.mellado@udec.cl",
    "name": "Prof. Martín Mellado",
    "role": "Inversionista Ángel & Mentor Estratégico",
    "tier": "pro",
    "is_admin": True,
    "days_left": 365,
    "avatar_url": "https://randomuser.me/api/portraits/men/22.jpg"
}

OTHER_USERS = [
    {
        "email": "ana.morales@gmail.com",
        "name": "Dra. Ana Morales",
        "tier": "premium",
        "is_admin": False,
        "days_left": 22,
        "avatar_url": "https://randomuser.me/api/portraits/women/33.jpg"
    },
    {
        "email": "carlos.vega@gmail.com",
        "name": "Carlos Vega",
        "tier": "inicial",
        "is_admin": False,
        "days_left": 18,
        "avatar_url": "https://randomuser.me/api/portraits/men/91.jpg"
    },
    {
        "email": "paula.diaz@gmail.com",
        "name": "Paula Díaz",
        "tier": "pro",
        "is_admin": False,
        "days_left": 29,
        "avatar_url": "https://randomuser.me/api/portraits/women/50.jpg"
    }
]

COMMUNITY_GROUPS = [
    {
        "name": "🏋️‍♂️ Club Hipertrofia & Fuerza Pesada",
        "description": "Comunidad activa dedicada a técnicas de sobrecarga progresiva, rutinas de fuerza y ganancia muscular magra.",
        "category": "Fuerza",
        "min_tier": "inicial",
        "members_count": 342
    },
    {
        "name": "🔥 Pérdida de Grasa & Hábitos Sostenibles",
        "description": "Espacio de apoyo mutuo para acelerar el metabolismo, déficit calórico sin pasar hambre y cambios de mentalidad.",
        "category": "Pérdida de Grasa",
        "min_tier": "inicial",
        "members_count": 518
    },
    {
        "name": "🥗 Nutrición Inteligente & Meal Prep",
        "description": "Recetas optimizadas, distribución de macros, suplementación basada en evidencia científica y recetas rápidas.",
        "category": "Nutrición",
        "min_tier": "premium",
        "members_count": 289
    },
    {
        "name": "🧘 Mindfulness, Recuperación & Salud Mental",
        "description": "Técnicas de respiración, reducción de cortisol, optimización de descanso nocturno y meditaciones en vivo.",
        "category": "Bienestar Mental",
        "min_tier": "premium",
        "members_count": 210
    },
    {
        "name": "🚀 Mastermind VIP: Biohacking & Alto Rendimiento",
        "description": "Comunidad exclusiva Pro con sesiones privadas de longevidad, telemetría fisiológica y contacto directo con especialistas.",
        "category": "Exclusivo Pro",
        "min_tier": "pro",
        "members_count": 96
    }
]

EVENTS_DATA = [
    {
        "title": "Masterclass: Estrategias de Nutrición Antiinflamatoria",
        "description": "Aprende cómo regular picos de glucosa y optimizar la energía digestiva durante todo el día con alimentos reales.",
        "speaker": "Dra. Catalina Vergara & Dra. Ana Morales",
        "speaker_role": "Equipo Médico & Nutrición Funcional VitalCore",
        "event_date": utc_now() + timedelta(days=2, hours=4),
        "duration_min": 60,
        "min_tier": "inicial",
        "category": "nutrition",
        "rsvps_count": 48
    },
    {
        "title": "Taller en Vivo: Optimización de Capacidad Pulmonar & Resistencia",
        "description": "Sesión práctica de respiración guiada, protocolos de entrenamiento interválico y adaptación cardiovascular.",
        "speaker": "Andres Burboa & Fabian Alvarado",
        "speaker_role": "Coaches de Rendimiento VitalCore",
        "event_date": utc_now() + timedelta(days=5, hours=2),
        "duration_min": 75,
        "min_tier": "premium",
        "category": "fitness",
        "rsvps_count": 34
    },
    {
        "title": "Sesión Nocturna: Meditación Profunda para Reset de Cortisol",
        "description": "Experiencia inmersiva en vivo con frecuencias binaurales y escáner corporal guiado para preparar el sueño REM profundo.",
        "speaker": "Marian Garcia & Yenny Sanchez",
        "speaker_role": "Líderes de Bienestar Mental VitalCore",
        "event_date": utc_now() + timedelta(days=7, hours=6),
        "duration_min": 45,
        "min_tier": "premium",
        "category": "mindset",
        "rsvps_count": 62
    },
    {
        "title": "Mesa Redonda VIP: Biohacking, Longevidad & Financiamiento de Prototipos de Salud",
        "description": "Encuentro cerrado exclusivo para miembros Pro. Debate estratégico con el Prof. Martín Mellado y los fundadores sobre escalamiento de salud digital.",
        "speaker": "Prof. Martín Mellado & Sebastian Posada",
        "speaker_role": "Lead Angel Investor & CEO VitalCore",
        "event_date": utc_now() + timedelta(days=9, hours=3),
        "duration_min": 90,
        "min_tier": "pro",
        "category": "mastermind",
        "rsvps_count": 29
    }
]

NUTRITION_PLAN_TEMPLATE = {
    "days": [
        {
            "day": i + 1,
            "breakfast": random.choice([
                "Avena integral con proteína isolate, arándanos y semillas de chía (440 kcal | 38g P / 52g C / 9g G)",
                "Omelette de 3 huevos de campo + espinaca baby + tostadas de masa madre (410 kcal | 32g P / 35g C / 14g G)",
                "Yogur griego natural 0% + mantequilla de almendras y frutos secos (390 kcal | 35g P / 22g C / 16g G)",
                "Smoothie anabólico de plátano, espirulina, leche de almendras y proteína (460 kcal | 42g P / 55g C / 8g G)"
            ]),
            "lunch": random.choice([
                "Pechuga de pollo a la plancha con quinoa real, palta y ensalada arcoíris (580 kcal | 50g P / 55g C / 16g G)",
                "Salmón salvaje al horno con batatas asadas y espárragos al vapor (610 kcal | 46g P / 48g C / 22g G)",
                "Lomo liso magro con arroz basmati y mix de verduras salteadas (590 kcal | 52g P / 50g C / 15g G)",
                "Bowl de atún fresco con couscous, garbanzos y aderezo de tahini (550 kcal | 48g P / 52g C / 14g G)"
            ]),
            "dinner": random.choice([
                "Merluza austral al vapor con puré de zapallo camote y aceite de oliva (420 kcal | 42g P / 38g C / 10g G)",
                "Pechuga de pavo con ensalada de hojas verdes, tomates cherry y nueces (400 kcal | 45g P / 15g C / 16g G)",
                "Wok de tofu orgánico o pollo con verduras crujientes y semillas de sésamo (430 kcal | 40g P / 32g C / 12g G)",
                "Tartar de salmón con palta y ensalada de rúcula y pepino (450 kcal | 38g P / 12g C / 24g G)"
            ]),
            "snack": random.choice([
                "Mix de nueces y almendras 30g + 1 manzana verde (210 kcal)",
                "Batido recovery de proteína whey + 1 scoop de creatina Creapure (180 kcal)",
                "Yogur de proteína con trozos de frutilla fresca (160 kcal)",
                "Galletas de arroz integral con mantequilla de maní natural (220 kcal)"
            ])
        }
        for i in range(30)
    ]
}

WORKOUT_PLAN_TEMPLATE = {
    "weeks": [
        {
            "week": w + 1,
            "focus_description": f"Fase {w + 1}: Progresión de carga y estímulo metabólico adaptativo",
            "days": [
                {"day": "Lunes", "focus": "Pecho, Hombro Anterior & Tríceps", "exercises": [
                    {"name": "Press Banca con Barra Olímpica", "sets": 4, "reps": f"{8 + (3 - w)}", "rest_sec": 90, "notes": "RIR 2, tempo 3-0-1-0"},
                    {"name": "Press Inclinado con Mancuernas", "sets": 4, "reps": "10-12", "rest_sec": 75, "notes": "Estiramiento completo en la parte baja"},
                    {"name": "Cruces en Polea Media", "sets": 3, "reps": "15", "rest_sec": 60, "notes": "Pausa isométrica de 1 segundo"},
                    {"name": "Press Francés con Barra Z", "sets": 4, "reps": "12", "rest_sec": 60, "notes": "Codos fijos"},
                    {"name": "Extensión Tríceps en Cuerda", "sets": 3, "reps": "15 + dropset", "rest_sec": 45, "notes": "Apertura final"}
                ]},
                {"day": "Martes", "focus": "Espalda Completa, Trapecio & Bíceps", "exercises": [
                    {"name": "Dominadas Pronas con Lastre / Asistidas", "sets": 4, "reps": "6-8", "rest_sec": 90, "notes": "Rango de movimiento completo"},
                    {"name": "Remo con Barra Pendlay", "sets": 4, "reps": "8-10", "rest_sec": 90, "notes": "Explosividad desde el suelo"},
                    {"name": "Jalón al Pecho Agarre Neutro", "sets": 3, "reps": "12", "rest_sec": 60, "notes": "Foco en dorsal ancho"},
                    {"name": "Curl Bíceps Barra Recta", "sets": 4, "reps": "10", "rest_sec": 60, "notes": "Sin balanceo del torso"},
                    {"name": "Curl Martillo Inclinado", "sets": 3, "reps": "12-14", "rest_sec": 45, "notes": "Braquial anterior"}
                ]},
                {"day": "Miércoles", "focus": "Capacidad Pulmonar, Core & Recuperación Activa", "exercises": [
                    {"name": "Protocolo HIIT en Cinta / Bici (Sprints 30s x 30s descanso)", "sets": 1, "reps": "20 min", "rest_sec": 0, "notes": "Zona 4-5 cardiovascular"},
                    {"name": "Plancha Abdominal con Desestabilización", "sets": 4, "reps": "45 seg", "rest_sec": 30, "notes": "Activación profunda de transverso"},
                    {"name": "Rueda Abdominal (Ab Wheel)", "sets": 3, "reps": "12", "rest_sec": 45, "notes": "Control lumbar estricto"},
                    {"name": "Respiración Box (Inhala 4s, Retén 4s, Exhala 4s, Retén 4s)", "sets": 1, "reps": "10 min", "rest_sec": 0, "notes": "Retorno a la calma"}
                ]},
                {"day": "Jueves", "focus": "Pierna Completa & Cadena Posterior", "exercises": [
                    {"name": "Sentadilla Trasera Profunda", "sets": 4, "reps": f"{6 + (3 - w)}", "rest_sec": 120, "notes": "Profundidad por debajo de 90°"},
                    {"name": "Prensa Inclinada 45°", "sets": 4, "reps": "12", "rest_sec": 90, "notes": "Pies a la altura de los hombros"},
                    {"name": "Peso Muerto Rumano con Mancuernas", "sets": 4, "reps": "10", "rest_sec": 75, "notes": "Foco en estiramiento de isquiotibiales"},
                    {"name": "Elevación de Talones de Pie (Gemelos)", "sets": 4, "reps": "15", "rest_sec": 45, "notes": "2 seg de pausa en contracción"}
                ]},
                {"day": "Viernes", "focus": "Hombros 3D, Deltoides Posterior & Trapecios", "exercises": [
                    {"name": "Press Militar de Pie con Barra", "sets": 4, "reps": "8", "rest_sec": 90, "notes": "Core bloqueado"},
                    {"name": "Elevaciones Laterales con Mancuerna", "sets": 4, "reps": "15-20", "rest_sec": 45, "notes": "Tensión continua"},
                    {"name": "Face Pulls con Cuerda en Polea Alta", "sets": 4, "reps": "15", "rest_sec": 45, "notes": "Rotación externa al final"},
                    {"name": "Elevaciones Posteriores en Banco Inclinado", "sets": 3, "reps": "15", "rest_sec": 45, "notes": "Aislamiento del deltoides posterior"}
                ]},
                {"day": "Sábado", "focus": "Cardio Aeróbico de Baja Intensidad (LISS)", "exercises": [
                    {"name": "Caminata al aire libre con pendiente o ciclismo suave", "sets": 1, "reps": "45-60 min", "rest_sec": 0, "notes": "Zona 2 constante (120-135 ppm)"}
                ]}
            ]
        }
        for w in range(4)
    ]
}

POSTS_SEED = [
    {
        "content": "🚀 VitalCore cumple hoy su primer hito con el respaldo del Prof. Martín Mellado y todo el Equipo Fundador UdeC (Sebastian, Andres, Catalina, Fabian, Marian y Yenny). ¡La visión de transformar la salud y el bienestar integral es una realidad!",
        "tag": "Comunidad",
        "likes_count": 142
    },
    {
        "content": "Excelente la Masterclass de hoy sobre nutrición antiinflamatoria con la Dra. Catalina Vergara y la Dra. Ana Morales. Ya organicé mi meal prep para toda la semana. ¡Comunidad con energía de otro nivel! 🥗🔥",
        "tag": "Nutrición",
        "likes_count": 89
    },
    {
        "content": "Mi racha de 21 días activos en el Dashboard es sagrada. Ningún día se negocia. El plan de entrenamiento adaptativo que me generó la IA me tiene en mi mejor momento físico.",
        "tag": "Motivación",
        "likes_count": 67
    },
    {
        "content": "Para los que están en el tier Premium o Pro: no se pierdan la sesión de respiración y recuperación de los miércoles. Duermo como bebé y el cortisol post-trabajo baja inmediatamente.",
        "tag": "Bienestar",
        "likes_count": 55
    }
]

def seed():
    create_tables()
    db = SessionLocal()
    try:
        # Reset and seed clean with founders
        db.query(Comment).delete()
        db.query(Post).delete()
        db.query(EventRSVP).delete()
        db.query(Event).delete()
        db.query(CommunityGroup).delete()
        db.query(DailyLog).delete()
        db.query(NutritionPlan).delete()
        db.query(WorkoutPlan).delete()
        db.query(MeditationSession).delete()
        db.query(UserProfile).delete()
        db.query(User).delete()
        db.commit()

        print("Seeding VitalCore with Founders (Equipo 2), Investor (Prof. Martín Mellado) & Platform Data...")

        # 1. Groups
        groups = []
        for cg_data in COMMUNITY_GROUPS:
            cg = CommunityGroup(**cg_data)
            db.add(cg)
            groups.append(cg)
        db.flush()

        # 2. Events
        events = []
        for ev_data in EVENTS_DATA:
            ev = Event(**ev_data)
            db.add(ev)
            events.append(ev)
        db.flush()

        # 3. All Users (Founders + Investor + Others)
        all_user_defs = FOUNDERS_EQUIPO_2 + [INVESTOR] + OTHER_USERS
        users = []
        for ud in all_user_defs:
            now = utc_now()
            days_left = ud.get("days_left", 30)
            expires_at = now + timedelta(days=days_left)
            started_at = now - timedelta(days=5)

            u = User(
                email=ud["email"].strip().lower(),
                name=ud["name"],
                avatar_url=ud["avatar_url"],
                is_admin=ud.get("is_admin", False),
                tier=ud["tier"],
                subscription_started_at=started_at,
                subscription_expires_at=expires_at,
                created_at=started_at
            )
            db.add(u)
            db.flush()

            profile = UserProfile(
                user_id=u.id,
                onboarding_done=True,
                age=28,
                weight_kg=78.0,
                height_cm=178.0,
                goal="gain_muscle",
                activity_level="active",
                gender="male",
                target_weight_kg=84.0,
                imc=24.6,
                tdee=2480,
                health_notes=f"Rol: {ud.get('role', 'Atleta VitalCore')}"
            )
            db.add(profile)
            users.append(u)

        db.flush()

        # 4. Nutrition & Workout Plans
        for u in users:
            np = NutritionPlan(
                user_id=u.id,
                title=f"Plan Nutricional Inteligente (30 Días)",
                goal="gain_muscle",
                daily_calories=2480,
                protein_g=175,
                carbs_g=265,
                fat_g=65,
                plan_json=json.dumps(NUTRITION_PLAN_TEMPLATE),
            )
            db.add(np)

            wp = WorkoutPlan(
                user_id=u.id,
                title=f"Periodización de Hipertrofia — Mesociclo 4 Semanas",
                goal="gain_muscle",
                weeks=4,
                plan_json=json.dumps(WORKOUT_PLAN_TEMPLATE),
            )
            db.add(wp)

        db.flush()

        # 5. Historical Daily Logs for Admins
        for u in users[:6]:
            for d in range(14):
                date_str = (utc_now() - timedelta(days=13 - d)).strftime("%Y-%m-%d")
                log = DailyLog(
                    user_id=u.id,
                    date=date_str,
                    calories_consumed=random.randint(2350, 2600),
                    protein_consumed=round(random.uniform(165, 180), 1),
                    carbs_consumed=round(random.uniform(250, 280), 1),
                    fat_consumed=round(random.uniform(60, 72), 1),
                    weight_kg=round(78.0 - d * 0.04 + random.uniform(-0.1, 0.1), 1),
                    workout_done=(d % 7 != 6),
                    meditation_done=(d % 2 == 0),
                    water_ml=3000,
                    mood=5
                )
                db.add(log)

        # 6. Event RSVPs
        for ev in events:
            for u in users[:5]:
                rsvp = EventRSVP(event_id=ev.id, user_id=u.id)
                db.add(rsvp)

        # 7. Community Posts & Comments
        for i, pd in enumerate(POSTS_SEED):
            post = Post(
                author_id=users[i % len(users)].id,
                group_id=groups[i % len(groups)].id,
                content=pd["content"],
                tag=pd["tag"],
                likes_count=pd["likes_count"]
            )
            db.add(post)
            db.flush()

            c1 = Comment(
                post_id=post.id,
                author_id=users[(i + 1) % len(users)].id,
                content=random.choice([
                    "¡Excelente trabajo de todo el equipo de fundadores y respaldo del profesor Martín! 🔥",
                    "Orgullo total de la comunidad UdeC.",
                    "¡Vamos por más resultados extraordinarios!",
                ])
            )
            db.add(c1)

        db.commit()
        print("✅ Base de datos actualizada con los 6 fundadores (Equipo 2) y el Prof. Martín Mellado (Financiador)!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al poblar: {e}")
        raise
    finally:
        db.close()


# ── SPEC-01: CATÁLOGO EXPANDIDO DE 50 ÍTEMS (13 CANÓNICOS + 37 SIMULADOS) ──────
CATALOG_SEED = [
    # ── NUTRICIÓN (20 ÍTEMS: 5 canónicos + 15 simulados) ──
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
    {
        "id": "rec_06",
        "category": "nutricion",
        "title": "Tazón de Yogur Griego con Nueces, Canela y Arándanos",
        "type": "Desayuno / Snack",
        "tags": ["probioticos", "calcio", "alto en proteina", "rapido", "sin cocinar"],
        "calories": 350,
        "protein_g": 25,
        "carbs_g": 26,
        "fat_g": 14,
        "description": "Yogur griego auténtico sin azúcares añadidos, alto en caseína de absorción sostenida con polifenoles de arándanos.",
        "joint_friendly": True,
        "prep_time_min": 4
    },
    {
        "id": "rec_07",
        "category": "nutricion",
        "title": "Tostadas de Centeno con Huevo Poché, Palta y Semillas de Cáñamo",
        "type": "Desayuno",
        "tags": ["fibra", "grasas saludables", "omega 3", "energia limpia"],
        "calories": 390,
        "protein_g": 19,
        "carbs_g": 34,
        "fat_g": 21,
        "description": "Pan integral 100% centeno fermentado naturalmente con huevos de pastoreo y aguacate maduro.",
        "joint_friendly": True,
        "prep_time_min": 12
    },
    {
        "id": "rec_08",
        "category": "nutricion",
        "title": "Ensalada Tibia de Lentejas Castellanas con Espinaca Baby y Queso Feta",
        "type": "Almuerzo",
        "tags": ["hierro", "legumbres", "vegetariano", "facil digestion", "fibra"],
        "calories": 450,
        "protein_g": 26,
        "carbs_g": 56,
        "fat_g": 12,
        "description": "Lentejas ricas en minerales y folatos, combinadas con brotes de espinaca cruda y vinagreta de limón.",
        "joint_friendly": True,
        "prep_time_min": 15
    },
    {
        "id": "rec_09",
        "category": "nutricion",
        "title": "Filete de Atún Rojo Sellado con Costra de Sésamo y Puré de Coliflor",
        "type": "Almuerzo / Cena",
        "tags": ["alta proteina", "keto", "bajo carbohidratos", "omega 3", "antiinflamatorio"],
        "calories": 470,
        "protein_g": 47,
        "carbs_g": 14,
        "fat_g": 20,
        "description": "Lomo de atún fresco cocinado a la plancha a fuego vivo, acompañado de falso puré cremoso de coliflor y aceite de oliva virgen.",
        "joint_friendly": True,
        "prep_time_min": 18
    },
    {
        "id": "rec_10",
        "category": "nutricion",
        "title": "Wok de Tofu Marinado en Soja, Jengibre y Verduras Crujientes",
        "type": "Almuerzo / Cena",
        "tags": ["vegano", "100% vegetal", "sin lactosa", "antioxidantes"],
        "calories": 380,
        "protein_g": 26,
        "carbs_g": 32,
        "fat_g": 16,
        "description": "Tofu firme prensado y salteado al wok con pimientos, zanahorias y tirabeques al dente con salsa de soja reducida en sodio.",
        "joint_friendly": True,
        "prep_time_min": 15
    },
    {
        "id": "rec_11",
        "category": "nutricion",
        "title": "Crema Terapéutica de Calabaza Asada, Cúrcuma y Leche de Coco",
        "type": "Cena Ligera",
        "tags": ["antiinflamatorio", "curcumina", "alivio articular", "digestivo", "vegano"],
        "calories": 240,
        "protein_g": 6,
        "carbs_g": 28,
        "fat_g": 11,
        "description": "Fórmula calmante para la mucosa intestinal y articulaciones inflamadas gracias a la sinergia de cúrcuma y pimienta negra.",
        "joint_friendly": True,
        "prep_time_min": 25
    },
    {
        "id": "rec_12",
        "category": "nutricion",
        "title": "Pechuga de Pavo a las Finas Hierbas con Batata Asada y Romero",
        "type": "Almuerzo",
        "tags": ["volumen magro", "alto en proteina", "meal prep", "sin gluten"],
        "calories": 510,
        "protein_g": 44,
        "carbs_g": 58,
        "fat_g": 9,
        "description": "Carbohidratos de bajo índice glucémico y proteína magra de alta digestibilidad para deportistas.",
        "joint_friendly": True,
        "prep_time_min": 30
    },
    {
        "id": "rec_13",
        "category": "nutricion",
        "title": "Wrap de Harina Integral con Pollo Desmenuzado, Hummus y Rúcula",
        "type": "Almuerzo Rápido / Oficina",
        "tags": ["rapido", "facil llevar", "oficina", "balanceado"],
        "calories": 430,
        "protein_g": 35,
        "carbs_g": 42,
        "fat_g": 13,
        "description": "Comida portátil para profesionales activos: wrap relleno de pechuga cocida, hummus de garbanzos casero y hojas amargas.",
        "joint_friendly": True,
        "prep_time_min": 8
    },
    {
        "id": "rec_14",
        "category": "nutricion",
        "title": "Shakshuka de Huevos Pochados en Salsa de Tomate y Pimientos Asados",
        "type": "Desayuno / Almuerzo",
        "tags": ["mediterraneo", "licopeno", "vegetariano", "sin gluten"],
        "calories": 360,
        "protein_g": 21,
        "carbs_g": 22,
        "fat_g": 20,
        "description": "Plato reconfortante de origen mediterráneo, alto en colina, luteína y antioxidantes del tomate maduro.",
        "joint_friendly": True,
        "prep_time_min": 20
    },
    {
        "id": "rec_15",
        "category": "nutricion",
        "title": "Pudding de Chía con Bebida de Almendra, Vainilla y Frambuesas",
        "type": "Snack Express",
        "tags": ["omega 3 vegetal", "sin lactosa", "preparacion anticipada", "sin azucar"],
        "calories": 250,
        "protein_g": 8,
        "carbs_g": 20,
        "fat_g": 14,
        "description": "Postre o colación con mucílago soluble que sacia el apetito y favorece el microbioma intestinal.",
        "joint_friendly": True,
        "prep_time_min": 5
    },
    {
        "id": "rec_16",
        "category": "nutricion",
        "title": "Merluza al Vapor con Papas Rústicas y Aceite de Ajo Confitado",
        "type": "Cena",
        "tags": ["pescado blanco", "facil digestion", "hipocalorico", "cena reparadora"],
        "calories": 390,
        "protein_g": 36,
        "carbs_g": 34,
        "fat_g": 10,
        "description": "Pescado blanco magro cocido suavemente para facilitar la inducción del sueño sin pesadez estomacal.",
        "joint_friendly": True,
        "prep_time_min": 22
    },
    {
        "id": "rec_17",
        "category": "nutricion",
        "title": "Carpaccio de Calabacín con Lascas de Parmesano, Nueces y Aceite de Oliva",
        "type": "Cena Ligera / Entrada",
        "tags": ["keto", "bajo en carbohidratos", "rapido", "crudo"],
        "calories": 230,
        "protein_g": 9,
        "carbs_g": 7,
        "fat_g": 18,
        "description": "Láminas finas de calabacín fresco marinadas con limón, aceite virgen extra y toques de frutos secos.",
        "joint_friendly": True,
        "prep_time_min": 6
    },
    {
        "id": "rec_18",
        "category": "nutricion",
        "title": "Trufas Energéticas de Dátiles Medjool, Almendras y Cacao Puro",
        "type": "Snack Pre-Workout",
        "tags": ["energia rapida", "pre entreno", "natural", "vegano"],
        "calories": 190,
        "protein_g": 5,
        "carbs_g": 28,
        "fat_g": 7,
        "description": "Bocados energéticos de asimilación progresiva ideales 30 minutos antes de entrenar o durante fatiga mental.",
        "joint_friendly": True,
        "prep_time_min": 5
    },
    {
        "id": "rec_19",
        "category": "nutricion",
        "title": "Guiso de Frijoles Negros con Seitán Salteado y Arroz Parbolizado",
        "type": "Almuerzo",
        "tags": ["vegano", "alto en proteina", "energia de larga duracion", "volumen"],
        "calories": 510,
        "protein_g": 40,
        "carbs_g": 64,
        "fat_g": 7,
        "description": "Combinación clásica de legumbre y cereal para completar el aminograma proteico en dietas plant-based.",
        "joint_friendly": True,
        "prep_time_min": 25
    },
    {
        "id": "rec_20",
        "category": "nutricion",
        "title": "Ceviche Costero de Reineta con Cebolla Morada, Cilantro y Palta",
        "type": "Almuerzo Fresco",
        "tags": ["fresco", "chileno", "alto en proteina", "sin grasa saturada"],
        "calories": 330,
        "protein_g": 34,
        "carbs_g": 18,
        "fat_g": 11,
        "description": "Pescado fresco curado en zumo de limón de pica con camote cocido, choclo y toques de ají verde.",
        "joint_friendly": True,
        "prep_time_min": 15
    },

    # ── ENTRENAMIENTO (17 ÍTEMS: 5 canónicos + 12 simulados) ──
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
    {
        "id": "exe_06",
        "category": "entrenamiento",
        "title": "Secuencia de Movilidad Articular Gato-Vaca y Bird-Dog",
        "type": "Movilidad & Readaptación",
        "tags": ["espalda", "columna", "dolor lumbar", "movilidad", "sin impacto", "casa"],
        "target_muscles": ["Erectores espinales", "Core", "Glúteos"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Descompresión suave de la columna vertebral y activación de la musculatura estabilizadora profunda.",
        "duration_min": 8
    },
    {
        "id": "exe_07",
        "category": "entrenamiento",
        "title": "Plancha Frontal Isométrica en Antebrazos (Plank Clásico)",
        "type": "Core & Estabilidad",
        "tags": ["core", "abdomen", "sin impacto", "isometria", "postura"],
        "target_muscles": ["Transverso abdominal", "Recto del abdomen", "Hombros"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Trabajo isométrico del cilindro abdominal sin flexión repetitiva de columna vertebral.",
        "duration_min": 10
    },
    {
        "id": "exe_08",
        "category": "entrenamiento",
        "title": "Zancada Estática Asistida con Soporte de Pared (Split Squat)",
        "type": "Fuerza Unilateral",
        "tags": ["rodilla segura", "equilibrio", "piernas", "gluteos", "sin impacto"],
        "target_muscles": ["Cuádriceps", "Glúteo mayor", "Aductores"],
        "impact_level": "Bajo",
        "joint_friendly": True,
        "description": "Construcción de fuerza unilateral con apoyo manual para eliminar oscilaciones lesivas en la rodilla.",
        "duration_min": 12
    },
    {
        "id": "exe_09",
        "category": "entrenamiento",
        "title": "Jalón al Pecho con Banda Elástica o Polea Alta",
        "type": "Fuerza Tren Superior",
        "tags": ["espalda", "dorsales", "postura de oficina", "sin peso libre"],
        "target_muscles": ["Dorsal ancho", "Bíceps", "Romboides"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Tracción vertical biomecánicamente limpia para compensar la postura encorvada del trabajo de oficina.",
        "duration_min": 14
    },
    {
        "id": "exe_10",
        "category": "entrenamiento",
        "title": "Pedaleo Suave en Bicicleta Estática Zona 2 Aeróbica",
        "type": "Cardio Sin Impacto",
        "tags": ["cardio", "cero impacto", "rodilla amigable", "quema grasa", "longevidad"],
        "target_muscles": ["Sistema cardiovascular", "Piernas"],
        "impact_level": "Cero impacto",
        "joint_friendly": True,
        "description": "Entrenamiento cardiovascular en zona 2 sin impacto articular para salud mitocondrial y quema de ácidos grasos.",
        "duration_min": 25
    },
    {
        "id": "exe_11",
        "category": "entrenamiento",
        "title": "Elevaciones Laterales Escapulares con Mancuernas Livianas",
        "type": "Hombros & Deltoides",
        "tags": ["hombros", "manguito rotador", "hipertrofia", "seguridad"],
        "target_muscles": ["Deltoides lateral", "Trapecio"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Aislamiento de la porción media del deltoides en el plano escapular para proteger el espacio subacromial.",
        "duration_min": 10
    },
    {
        "id": "exe_12",
        "category": "entrenamiento",
        "title": "Peso Muerto Rumano con Mancuernas y Enfoque en Isquiotibiales",
        "type": "Cadena Posterior",
        "tags": ["isquios", "gluteos", "fuerza funcional", "cadera"],
        "target_muscles": ["Isquiosurales", "Glúteos", "Erectores espinales"],
        "impact_level": "Controlado",
        "joint_friendly": True,
        "description": "Bisagra de cadera controlada para fortalecimiento de isquiotibiales y glúteos sin flexión lumbar.",
        "duration_min": 14
    },
    {
        "id": "exe_13",
        "category": "entrenamiento",
        "title": "Flexión Femoral Acostado con Banda Elástica (Hamstring Curl)",
        "type": "Readaptación de Rodilla",
        "tags": ["cuidado de rodilla", "ligamentos", "sin impacto", "terapeutico"],
        "target_muscles": ["Isquiosurales", "Poplíteo"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Fortalecimiento de la musculatura posterior del muslo protegiendo la estabilidad del ligamento cruzado anterior.",
        "duration_min": 10
    },
    {
        "id": "exe_14",
        "category": "entrenamiento",
        "title": "Paseo del Granjero con Carga Unilateral (Suitcase Carry)",
        "type": "Fuerza Funcional & Core",
        "tags": ["core", "antilateral", "agarre", "postura"],
        "target_muscles": ["Oblicuos", "Antebrazos", "Trapecios"],
        "impact_level": "Bajo",
        "joint_friendly": True,
        "description": "Transporte de carga asimétrica para activar transverso, oblicuos y estabilidad escapular dinámica.",
        "duration_min": 12
    },
    {
        "id": "exe_15",
        "category": "entrenamiento",
        "title": "Transiciones Activas de Cadera 90-90 en Suelo",
        "type": "Movilidad Articular",
        "tags": ["cadera", "flexibilidad", "sin impacto", "alivio dolor"],
        "target_muscles": ["Rotadores internos de cadera", "Psoas", "Glúteo medio"],
        "impact_level": "Nulo",
        "joint_friendly": True,
        "description": "Mejora de la rotación interna y externa de cadera para aliviar tensión en la zona lumbar y rodillas.",
        "duration_min": 8
    },
    {
        "id": "exe_16",
        "category": "entrenamiento",
        "title": "Fondos de Tríceps Asistidos con Pies en Suelo en Banco",
        "type": "Brazos & Fuerza",
        "tags": ["triceps", "brazos", "casa", "principiante"],
        "target_muscles": ["Tríceps braquial", "Deltoides anterior"],
        "impact_level": "Bajo",
        "joint_friendly": True,
        "description": "Extensión controlada de codos para fortalecimiento de tríceps con pies apoyados para reducir sobrecarga.",
        "duration_min": 10
    },
    {
        "id": "exe_17",
        "category": "entrenamiento",
        "title": "Saltos Pliométricos a Cajón y Aterrizaje Suave (Box Jumps)",
        "type": "Potencia & Explosividad",
        "tags": ["pliometria", "potencia", "alto impacto", "atletas"],
        "target_muscles": ["Gemelos", "Cuádriceps", "Glúteos"],
        "impact_level": "Medio-Alto",
        "joint_friendly": False,
        "description": "Desarrollo de potencia vertical y velocidad de reclutamiento neuromuscular con aterrizaje suave.",
        "duration_min": 15
    },

    # ── MEDITACIÓN (13 ÍTEMS: 3 canónicos + 10 simulados) ──
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
    },
    {
        "id": "med_04",
        "category": "meditacion",
        "title": "Respiración Cuadrada (Box Breathing 4-4-4-4) para Foco Táctico",
        "type": "Foco & Calma",
        "tags": ["concentracion", "navy seals", "calmar mente", "rapido", "respiracion"],
        "duration_min": 6,
        "description": "Patrón de inhalación, retención, exhalación y retención en 4 tiempos para serenar la corteza prefrontal en crisis.",
        "joint_friendly": True
    },
    {
        "id": "med_05",
        "category": "meditacion",
        "title": "Mindfulness Abierto: Atención Consciente a Sonidos del Entorno",
        "type": "Presencia Plena",
        "tags": ["mindfulness", "presencia", "ansiedad", "aqui y ahora"],
        "duration_min": 10,
        "description": "Entrenamiento de atención no reactiva a estímulos auditivos para desarticular la rumiación cognitiva.",
        "joint_friendly": True
    },
    {
        "id": "med_06",
        "category": "meditacion",
        "title": "Inducción al Sueño Profundo: Ondas Delta Guiadas y Yoga Nidra",
        "type": "Sueño & Insomnio",
        "tags": ["dormir", "insomnio", "descanso", "recuperacion", "noche"],
        "duration_min": 20,
        "description": "Inmersión profunda en relajación neuromuscular para activar ondas lentas y conciliar sueño reparador.",
        "joint_friendly": True
    },
    {
        "id": "med_07",
        "category": "meditacion",
        "title": "Práctica Matutina de Gratitud, Intención y Despertar Fisiológico",
        "type": "Energía & Arranque",
        "tags": ["manana", "energia", "gratitud", "motivacion", "optimismo"],
        "duration_min": 8,
        "description": "Estimulación de neurotransmisores dopaminérgicos matutinos para encarar el día con propósito y vitalidad.",
        "joint_friendly": True
    },
    {
        "id": "med_08",
        "category": "meditacion",
        "title": "Respiración Coherente Diafragmática para la Digestión y Calma",
        "type": "Regulación Vagal",
        "tags": ["digestion", "nervio vago", "post comida", "calma"],
        "duration_min": 7,
        "description": "Ritmo de 5.5 respiraciones por minuto que optimiza la variabilidad de la frecuencia cardíaca (VFC) y la asimilación de nutrientes.",
        "joint_friendly": True
    },
    {
        "id": "med_09",
        "category": "meditacion",
        "title": "Liberación Rápida de Sobrecarga Mental y Estrés Tecnológico",
        "type": "Desconexión Laboral",
        "tags": ["estres laboral", "pantallas", "fatiga", "pausa activa"],
        "duration_min": 11,
        "description": "Cierre mental de ventanas de atención para evitar el burnout digital al finalizar la jornada de trabajo.",
        "joint_friendly": True
    },
    {
        "id": "med_10",
        "category": "meditacion",
        "title": "Autocompasión Guiada y Aceptación Corporal",
        "type": "Resiliencia Emocional",
        "tags": ["autoestima", "resiliencia", "bienestar", "paz mental"],
        "duration_min": 15,
        "description": "Práctica centrada en disminuir la autocrítica destructiva y fomentar una relación armónica con el cuerpo.",
        "joint_friendly": True
    },
    {
        "id": "med_11",
        "category": "meditacion",
        "title": "Visualización Deportiva de Rendimiento y Confianza Competitiva",
        "type": "Rendimiento Atlético",
        "tags": ["deporte", "rendimiento", "confianza", "psicologia deportiva"],
        "duration_min": 10,
        "description": "Ensayo motor imaginado para consolidar patrones técnicos antes de sesiones exigentes de entrenamiento.",
        "joint_friendly": True
    },
    {
        "id": "med_12",
        "category": "meditacion",
        "title": "Micro-Pausa Antiestrés de 3 Minutos en el Puesto de Trabajo",
        "type": "Reset Express",
        "tags": ["express", "3 minutos", "oficina", "urgente", "respiro"],
        "duration_min": 3,
        "description": "Intervención mínima viable para descomprimir la tensión cervical y clarificar el pensamiento en medio del trabajo.",
        "joint_friendly": True
    },
    {
        "id": "med_13",
        "category": "meditacion",
        "title": "Rastreo Somático y Modulación de Dolor Físico Crónico",
        "type": "Alivio & Terapia",
        "tags": ["dolor cronico", "somatico", "alivio", "sensaciones corporales"],
        "duration_min": 14,
        "description": "Reevaluación cognitiva de las señales de dolor físico para reducir la señal de alarma en el sistema nervioso central.",
        "joint_friendly": True
    }
]


def _generate_catalog_embedding(text: str) -> list:
    """Genera embedding real de 768 dims con Gemini o fallback a vocabulario denso."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        from semantic_engine import EMBEDDING_MODEL, EMBEDDING_DIMS
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            res = genai.embed_content(
                model=f"models/{EMBEDDING_MODEL}",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=EMBEDDING_DIMS
            )
            emb = res.get("embedding")
            if emb and len(emb) == EMBEDDING_DIMS:
                return emb
        except Exception as e:
            print(f"⚠️ Aviso: Error al invocar Gemini {EMBEDDING_MODEL} ({e}). Usando vector denso.")

    from semantic_engine import _build_dense_vector
    return _build_dense_vector(text)


def seed_catalog(db) -> None:
    """
    SPEC-01: Inicializa la tabla catalog_items con los 50 ítems si está vacía.
    Se ejecuta fuera del bloque DELETE de seed() para no regenerar embeddings en cada reinicio.
    """
    count = db.query(CatalogItem).count()
    if count > 0:
        return

    print(f"🌱 [SPEC-01] Poblano catálogo persistente en SQLite con {len(CATALOG_SEED)} ítems...")
    for item in CATALOG_SEED:
        tags_list = item.get("tags", [])
        muscles_list = item.get("target_muscles", []) or []
        searchable_text = f"{item['title']} {item['type']} {item['description']} {' '.join(tags_list)} {item.get('impact_level', '')} {' '.join(muscles_list)}"

        vector = _generate_catalog_embedding(searchable_text)
        embedding_json = json.dumps(vector) if vector else None

        cat_item = CatalogItem(
            id=item["id"],
            category=item["category"],
            title=item["title"],
            type=item["type"],
            tags=tags_list,
            description=item["description"],
            joint_friendly=bool(item.get("joint_friendly", False)),
            calories=item.get("calories"),
            protein_g=item.get("protein_g"),
            carbs_g=item.get("carbs_g"),
            fat_g=item.get("fat_g"),
            target_muscles=muscles_list,
            impact_level=item.get("impact_level"),
            duration_min=item.get("duration_min"),
            prep_time_min=item.get("prep_time_min"),
            difficulty=item.get("difficulty"),
            embedding_json=embedding_json
        )
        db.add(cat_item)

    db.commit()
    print(f"✅ [SPEC-01] Catálogo persistente inicializado con {len(CATALOG_SEED)} ítems.")


if __name__ == "__main__":
    seed()
