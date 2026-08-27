"""Seed database with realistic users, founders (Equipo 2), investor, events, groups, and logs."""
import json, sys, os
from datetime import datetime, timedelta
import random

from database import (
    SessionLocal, create_tables, User, UserProfile, NutritionPlan,
    WorkoutPlan, DailyLog, Post, Comment, MeditationSession,
    CommunityGroup, Event, EventRSVP
)

FOUNDERS_EQUIPO_2 = [
    {
        "email": "sposada2026@udec.cl",
        "name": "Sebastian Posada Posada",
        "role": "CEO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=sebastian"
    },
    {
        "email": "andresburboa@udec.cl",
        "name": "Andres Gonzalo Burboa Lizama",
        "role": "CTO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=andres"
    },
    {
        "email": "cavergara2019@udec.cl",
        "name": "Catalina Antonia Vergara Donoso",
        "role": "Chief Health Officer & Co-Fundadora",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=catalina"
    },
    {
        "email": "falvarado2016@udec.cl",
        "name": "Fabian Alonso Alvarado Arriagada",
        "role": "Head of AI & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=fabian"
    },
    {
        "email": "margarcia2026@udec.cl",
        "name": "Marian Garcia Cruz",
        "role": "Head of Product & Co-Fundadora",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=marian"
    },
    {
        "email": "yesanchez2026@udec.cl",
        "name": "Yenny Sanchez Aguilar",
        "role": "COO & Co-Fundador",
        "tier": "pro",
        "is_admin": True,
        "days_left": 30,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=yenny"
    }
]

INVESTOR = {
    "email": "martin.mellado@udec.cl",
    "name": "Prof. Martín Mellado",
    "role": "Inversionista Ángel & Mentor Estratégico",
    "tier": "pro",
    "is_admin": True,
    "days_left": 365,
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=martin_mellado"
}

OTHER_USERS = [
    {
        "email": "ana.morales@gmail.com",
        "name": "Dra. Ana Morales",
        "tier": "premium",
        "is_admin": False,
        "days_left": 22,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=ana"
    },
    {
        "email": "carlos.vega@gmail.com",
        "name": "Carlos Vega",
        "tier": "inicial",
        "is_admin": False,
        "days_left": 18,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos"
    },
    {
        "email": "paula.diaz@gmail.com",
        "name": "Paula Díaz",
        "tier": "pro",
        "is_admin": False,
        "days_left": 29,
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=paula"
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
        "event_date": datetime.utcnow() + timedelta(days=2, hours=4),
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
        "event_date": datetime.utcnow() + timedelta(days=5, hours=2),
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
        "event_date": datetime.utcnow() + timedelta(days=7, hours=6),
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
        "event_date": datetime.utcnow() + timedelta(days=9, hours=3),
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
            now = datetime.utcnow()
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
                date_str = (datetime.utcnow() - timedelta(days=13 - d)).strftime("%Y-%m-%d")
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

if __name__ == "__main__":
    seed()
