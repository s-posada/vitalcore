import os, json
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import (
    get_db, create_tables, User, UserProfile, NutritionPlan,
    WorkoutPlan, DailyLog, Post, Comment, MeditationSession,
    CommunityGroup, Event, EventRSVP
)
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="VitalCore API — Bienestar Integral & Longevidad",
    version="2.0.0",
    description="Backend de alto rendimiento para Nutrición, Entrenamiento, Meditación y Comunidad"
)

# CORS restringido: solo los orígenes del frontend (configurable por entorno)
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100,http://127.0.0.1:3100"
    ).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Vercel asigna una URL nueva en cada despliegue: se aceptan todos sus subdominios
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Cabeceras de seguridad defensivas en todas las respuestas
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

ADMIN_EMAILS = [
    "sposada2026@udec.cl",
    "andresburboa@udec.cl",
    "cavergara2019@udec.cl",
    "falvarado2016@udec.cl",
    "margarcia2026@udec.cl",
    "yesanchez2026@udec.cl",
    "martin.mellado@udec.cl"
]

def is_admin_email(email: str) -> bool:
    return email.strip().lower() in [e.lower() for e in ADMIN_EMAILS]

@app.on_event("startup")
def startup():
    create_tables()
    from seed import seed
    seed()

# ── Schemas ────────────────────────────────────────────────────────────────────
class UserSessionRequest(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    tier: Optional[str] = "inicial"

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    activity_level: Optional[str] = "moderate"
    gender: Optional[str] = "other"
    target_weight_kg: Optional[float] = None
    health_notes: Optional[str] = None

class LogCreate(BaseModel):
    date: str
    calories_consumed: int = 0
    protein_consumed: float = 0
    carbs_consumed: float = 0
    fat_consumed: float = 0
    weight_kg: Optional[float] = None
    workout_done: bool = False
    meditation_done: bool = False
    water_ml: int = 2000
    mood: int = 4

class PostCreate(BaseModel):
    content: str
    group_id: Optional[int] = None
    tag: Optional[str] = "General"
    image_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class TierChangeRequest(BaseModel):
    tier: str # inicial, premium, pro
    days_to_add: Optional[int] = 30

class EventCreateRequest(BaseModel):
    title: str
    description: str
    speaker: str
    speaker_role: str
    event_date: str
    duration_min: int = 60
    min_tier: str = "inicial"
    category: str = "fitness"

# ── Helpers ────────────────────────────────────────────────────────────────────
def calc_days_left(expires_at: Optional[datetime]) -> int:
    if not expires_at:
        return 30
    now = datetime.utcnow()
    diff = (expires_at - now).total_seconds()
    if diff <= 0:
        return 0
    return int(diff // 86400) + 1

def calc_imc(weight, height_cm):
    if not weight or not height_cm:
        return 22.0
    h = height_cm / 100.0
    return round(weight / (h * h), 1)

def calc_tdee(weight, height_cm, age, gender, activity):
    if not weight or not height_cm or not age:
        return 2200
    if gender == "male":
        bmr = 10 * weight + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height_cm - 5 * age - 161
    multipliers = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725, "very_active": 1.9}
    return int(bmr * multipliers.get(activity, 1.55))

TIER_ORDER = {"inicial": 1, "premium": 2, "pro": 3}
TIER_PRICES = {"inicial": 25, "premium": 35, "pro": 50}

def can_access_tier(user_tier: str, required_tier: str) -> bool:
    return TIER_ORDER.get(user_tier.lower(), 1) >= TIER_ORDER.get(required_tier.lower(), 1)

# ── Catalog Data ───────────────────────────────────────────────────────────────
MEDITATIONS_CATALOG = [
    {
        "id": "med_1",
        "title": "Respiración Consciente & Reset del Sistema Nervioso",
        "duration_min": 5,
        "category": "stress",
        "min_tier": "inicial",
        "description": "Una práctica sencilla y poderosa para calmar la mente y reequilibrar el tono vagal.",
        "script": "Siéntate cómodamente con la espalda recta y cierra suavemente los ojos. Inhala profundamente por la nariz durante 4 segundos... llena tus pulmones. Retén el aire durante 4 segundos. Ahora exhala lentamente por la boca en 6 segundos, soltando toda la tensión de los hombros. Repite este ciclo. Estás a salvo, estás presente. Deja ir cualquier urgencia."
    },
    {
        "id": "med_2",
        "title": "Relajación Muscular Progresiva & Recuperación Física",
        "duration_min": 10,
        "category": "recovery",
        "min_tier": "inicial",
        "description": "Libera el ácido láctico y la tensión acumulada en articulaciones y grupos musculares.",
        "script": "Comenzamos por los pies. Aprieta suavemente los dedos durante cinco segundos... y suelta. Siente cómo se relajan. Sube a las pantorrillas y cuádriceps: tensa... y relaja. Lleva tu respiración al pecho, hombros y cuello. Con cada exhalación profunda, tu cuerpo absorbe los beneficios del entrenamiento y entra en estado de recuperación anabólica."
    },
    {
        "id": "med_3",
        "title": "Visualización Guiada: Alto Rendimiento & Enfoque Deportivo",
        "duration_min": 12,
        "category": "focus",
        "min_tier": "premium",
        "description": "Programación neurolingüística para visualizar metas, disciplina y ejecución perfecta.",
        "script": "Imagina tu próxima sesión de entrenamiento o tu día de trabajo. Mírate a ti mismo superando la fatiga, manteniendo la técnica perfecta y actuando con certeza inquebrantable. Siente la fuerza en tu núcleo. Eres capaz de sostener hábitos difíciles porque tu visión es más grande que cualquier excusa."
    },
    {
        "id": "med_4",
        "title": "Inducción al Sueño REM Profundo & Disminución de Ondas Cerebrales",
        "duration_min": 20,
        "category": "sleep",
        "min_tier": "premium",
        "description": "Frecuencias mentales guiadas para facilitar la producción natural de melatonina.",
        "script": "Recuéstate en una posición cómoda. Suelta el peso de tu cabeza sobre la almohada. Todo lo que tenías que hacer hoy ya está hecho. El día terminó. Observa el aire entrando fresco y saliendo tibio. Si aparece un pensamiento, no lo juzgues: déjalo pasar como una nube que flota en la noche. Tu mente se sumerge en descanso regenerador."
    },
    {
        "id": "med_5",
        "title": "Protocolo Wim Hof: Respiración Energizante & Capacidad Pulmonar",
        "duration_min": 15,
        "category": "energy",
        "min_tier": "pro",
        "description": "Técnica avanzada de hiperoxigenación controlada y retención para resistencia celular.",
        "script": "Comenzamos la ronda 1. 30 respiraciones profundas al abdomen y al pecho. Inhala profundo... suelta. Inhala... suelta. Siente la energía recorrer tus extremidades. Al terminar la respiración 30, exhala suavemente y retén el aire con los pulmones vacíos. Conecta con la quietud absoluta. Cuando sientas la necesidad de respirar, inhala al 100% y retén 15 segundos."
    },
    {
        "id": "med_6",
        "title": "Gratitud & Salud Cardiovascular Neurobiológica",
        "duration_min": 10,
        "category": "mood",
        "min_tier": "inicial",
        "description": "Alineación de coherencia cardíaca para reducir la presión arterial y mejorar el estado de ánimo.",
        "script": "Coloca una mano sobre el centro de tu pecho. Recuerda un momento donde sentiste profunda gratitud o conexión. Permite que esa emoción se expanda como una ola de calor en tu pecho. La gratitud cambia químicamente los neurotransmisores, elevando la serotonina y dopamina de forma sostenible."
    }
]

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "VitalCore API 2.0 Operativa 🚀",
        "pricing": {
            "inicial": "$25 USD / mes",
            "premium": "$35 USD / mes",
            "pro": "$50 USD / mes"
        },
        "admin_contact": ADMIN_EMAILS[0]
    }

# ── AUTH & USER ────────────────────────────────────────────────────────────────
@app.post("/api/auth/session")
def auth_session(data: UserSessionRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if not user:
        is_adm = is_admin_email(data.email)
        now = datetime.utcnow()
        user = User(
            email=data.email.strip().lower(),
            name=data.name,
            avatar_url=data.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.name}",
            is_admin=is_adm,
            tier=data.tier or ("pro" if is_adm else "inicial"),
            subscription_started_at=now,
            subscription_expires_at=now + timedelta(days=30),
            created_at=now
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = UserProfile(
            user_id=user.id,
            onboarding_done=False,
            age=25,
            weight_kg=70.0,
            height_cm=175.0,
            goal="gain_muscle",
            activity_level="moderate",
            gender="male"
        )
        db.add(profile)
        db.commit()
    else:
        if data.tier:
            user.tier = data.tier
            db.commit()

    days_left = calc_days_left(user.subscription_expires_at)
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "is_admin": user.is_admin,
        "tier": user.tier,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "days_left": days_left,
        "onboarding_done": profile.onboarding_done if profile else False
    }

@app.get("/api/users/me")
def get_user_me(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    days_left = calc_days_left(user.subscription_expires_at)
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "is_admin": user.is_admin,
        "tier": user.tier,
        "tier_price_usd": TIER_PRICES.get(user.tier, 25),
        "days_left": days_left,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "profile": {
            "age": profile.age if profile else None,
            "weight_kg": profile.weight_kg if profile else None,
            "height_cm": profile.height_cm if profile else None,
            "goal": profile.goal if profile else None,
            "activity_level": profile.activity_level if profile else None,
            "gender": profile.gender if profile else None,
            "target_weight_kg": profile.target_weight_kg if profile else None,
            "imc": profile.imc if profile else None,
            "tdee": profile.tdee if profile else None,
            "health_notes": profile.health_notes if profile else None,
            "onboarding_done": profile.onboarding_done if profile else False
        } if profile else None
    }

@app.post("/api/users/{user_id}/upgrade")
def upgrade_user_tier(user_id: int, req: TierChangeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    user.tier = req.tier.lower()
    now = datetime.utcnow()
    user.subscription_started_at = now
    user.subscription_expires_at = now + timedelta(days=req.days_to_add or 30)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "new_tier": user.tier,
        "tier_price_usd": TIER_PRICES.get(user.tier, 25),
        "days_left": calc_days_left(user.subscription_expires_at)
    }

# ── ONBOARDING ─────────────────────────────────────────────────────────────────
@app.post("/api/onboarding/{user_id}")
def update_onboarding(user_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    
    for k, v in data.dict(exclude_none=True).items():
        setattr(profile, k, v)
        
    profile.imc = calc_imc(profile.weight_kg, profile.height_cm)
    profile.tdee = calc_tdee(profile.weight_kg, profile.height_cm, profile.age, profile.gender or "other", profile.activity_level or "moderate")
    profile.onboarding_done = True
    
    db.commit()
    db.refresh(profile)
    
    return {
        "success": True,
        "imc": profile.imc,
        "tdee": profile.tdee,
        "profile": {
            "age": profile.age,
            "weight_kg": profile.weight_kg,
            "height_cm": profile.height_cm,
            "goal": profile.goal,
            "target_weight_kg": profile.target_weight_kg
        }
    }

# ── NUTRITION ──────────────────────────────────────────────────────────────────
@app.get("/api/nutrition/{user_id}")
def get_nutrition(user_id: int, db: Session = Depends(get_db)):
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == user_id).order_by(NutritionPlan.created_at.desc()).first()
    if not plan:
        # Fallback create
        user = db.query(User).filter(User.id == user_id).first()
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        goal = profile.goal if profile and profile.goal else "gain_muscle"
        tdee = profile.tdee if profile and profile.tdee else 2400
        weight = profile.weight_kg if profile and profile.weight_kg else 75.0
        from seed import NUTRITION_PLAN_TEMPLATE
        kcal = tdee + (450 if goal == "gain_muscle" else -400 if goal == "lose_fat" else 0)
        protein = int(weight * 2.0)
        fat = int(kcal * 0.25 / 9)
        carbs = int((kcal - protein * 4 - fat * 9) / 4)
        plan = NutritionPlan(
            user_id=user_id,
            title=f"Plan Nutricional — {goal.replace('_',' ').title()}",
            goal=goal,
            daily_calories=kcal,
            protein_g=protein,
            carbs_g=carbs,
            fat_g=fat,
            plan_json=json.dumps(NUTRITION_PLAN_TEMPLATE)
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "daily_calories": plan.daily_calories,
        "protein_g": plan.protein_g,
        "carbs_g": plan.carbs_g,
        "fat_g": plan.fat_g,
        "days": json.loads(plan.plan_json).get("days", []),
        "created_at": plan.created_at.isoformat()
    }

@app.post("/api/nutrition/generate/{user_id}")
def generate_nutrition(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    goal = profile.goal if profile and profile.goal else "gain_muscle"
    tdee = profile.tdee if profile and profile.tdee else 2400
    weight = profile.weight_kg if profile and profile.weight_kg else 75.0
    from seed import NUTRITION_PLAN_TEMPLATE
    
    calorie_adjustment = {"gain_muscle": 450, "lose_fat": -450, "maintain": 0, "improve_endurance": 250, "improve_flexibility": 0}
    kcal = tdee + calorie_adjustment.get(goal, 0)
    protein = int(weight * (2.2 if goal == "gain_muscle" else 1.9))
    fat = int(kcal * 0.25 / 9)
    carbs = int((kcal - protein * 4 - fat * 9) / 4)

    plan = NutritionPlan(
        user_id=user_id,
        title=f"Plan Personalizado por IA — {goal.replace('_',' ').title()} (30 Días)",
        goal=goal,
        daily_calories=kcal,
        protein_g=protein,
        carbs_g=carbs,
        fat_g=fat,
        plan_json=json.dumps(NUTRITION_PLAN_TEMPLATE)
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "success": True,
        "plan_id": plan.id,
        "daily_calories": plan.daily_calories,
        "macros": {"protein": plan.protein_g, "carbs": plan.carbs_g, "fat": plan.fat_g}
    }

# ── WORKOUT ────────────────────────────────────────────────────────────────────
@app.get("/api/workout/{user_id}")
def get_workout(user_id: int, db: Session = Depends(get_db)):
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).order_by(WorkoutPlan.created_at.desc()).first()
    if not plan:
        from seed import WORKOUT_PLAN_TEMPLATE
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        goal = profile.goal if profile and profile.goal else "gain_muscle"
        plan = WorkoutPlan(
            user_id=user_id,
            title=f"Plan de Entrenamiento — {goal.replace('_',' ').title()}",
            goal=goal,
            weeks=4,
            plan_json=json.dumps(WORKOUT_PLAN_TEMPLATE)
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "weeks": json.loads(plan.plan_json).get("weeks", []),
        "created_at": plan.created_at.isoformat()
    }

@app.post("/api/workout/generate/{user_id}")
def generate_workout(user_id: int, db: Session = Depends(get_db)):
    from seed import WORKOUT_PLAN_TEMPLATE
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    goal = profile.goal if profile and profile.goal else "gain_muscle"
    
    plan = WorkoutPlan(
        user_id=user_id,
        title=f"Plan de Entrenamiento Inteligente — {goal.replace('_',' ').title()}",
        goal=goal,
        weeks=4,
        plan_json=json.dumps(WORKOUT_PLAN_TEMPLATE)
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"success": True, "plan_id": plan.id}

# ── DAILY LOGS & DASHBOARD STATS ───────────────────────────────────────────────
@app.post("/api/logs/{user_id}")
def log_daily(user_id: int, data: LogCreate, db: Session = Depends(get_db)):
    log = db.query(DailyLog).filter(DailyLog.user_id == user_id, DailyLog.date == data.date).first()
    if log:
        for k, v in data.dict(exclude_none=True).items():
            setattr(log, k, v)
    else:
        log = DailyLog(user_id=user_id, **data.dict())
        db.add(log)
    db.commit()
    return {"success": True, "date": data.date}

@app.get("/api/logs/{user_id}")
def get_user_logs(user_id: int, days: int = 14, db: Session = Depends(get_db)):
    logs = db.query(DailyLog).filter(DailyLog.user_id == user_id).order_by(DailyLog.date.desc()).limit(days).all()
    return [
        {
            "date": l.date,
            "calories_consumed": l.calories_consumed,
            "protein_consumed": l.protein_consumed,
            "carbs_consumed": l.carbs_consumed,
            "fat_consumed": l.fat_consumed,
            "weight_kg": l.weight_kg,
            "workout_done": l.workout_done,
            "meditation_done": l.meditation_done,
            "water_ml": l.water_ml,
            "mood": l.mood
        }
        for l in logs
    ]

@app.get("/api/stats/{user_id}")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    logs = db.query(DailyLog).filter(DailyLog.user_id == user_id).order_by(DailyLog.date.desc()).all()
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == user_id).order_by(NutritionPlan.created_at.desc()).first()
    
    streak = 0
    for l in logs:
        if l.workout_done or l.meditation_done:
            streak += 1
        else:
            break

    target_cal = plan.daily_calories if plan else 2400
    avg_cal = sum(l.calories_consumed for l in logs[:7]) // max(len(logs[:7]), 1) if logs else 0
    days_left = calc_days_left(user.subscription_expires_at)

    weight_history = [
        {"date": l.date[5:], "weight": l.weight_kg}
        for l in reversed(logs[:14])
        if l.weight_kg
    ]

    macro_history = [
        {
            "date": l.date[5:],
            "protein": l.protein_consumed,
            "carbs": l.carbs_consumed,
            "fat": l.fat_consumed,
            "calories": l.calories_consumed
        }
        for l in reversed(logs[:7])
    ]

    return {
        "streak_days": streak,
        "days_left": days_left,
        "subscription_tier": user.tier,
        "subscription_price_usd": TIER_PRICES.get(user.tier, 25),
        "target_calories": target_cal,
        "avg_weekly_calories": avg_cal,
        "target_protein": plan.protein_g if plan else 160,
        "target_carbs": plan.carbs_g if plan else 250,
        "target_fat": plan.fat_g if plan else 65,
        "workouts_this_week": sum(1 for l in logs[:7] if l.workout_done),
        "meditations_this_week": sum(1 for l in logs[:7] if l.meditation_done),
        "current_weight": logs[0].weight_kg if logs and logs[0].weight_kg else (user.profile.weight_kg if user.profile else 75.0),
        "weight_progress": weight_history,
        "macro_history": macro_history
    }

# ── MEDITATIONS ────────────────────────────────────────────────────────────────
@app.get("/api/meditations")
def list_meditations():
    return MEDITATIONS_CATALOG

@app.get("/api/meditations/{med_id}")
def get_meditation(med_id: str):
    med = next((m for m in MEDITATIONS_CATALOG if m["id"] == med_id), None)
    if not med:
        raise HTTPException(404, "Meditación no encontrada")
    return med

@app.post("/api/meditations/{med_id}/complete/{user_id}")
def complete_med(med_id: str, user_id: int, db: Session = Depends(get_db)):
    med = next((m for m in MEDITATIONS_CATALOG if m["id"] == med_id), None)
    dur = med["duration_min"] if med else 10
    sess = MeditationSession(user_id=user_id, meditation_id=med_id, duration_min=dur)
    db.add(sess)
    
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    log = db.query(DailyLog).filter(DailyLog.user_id == user_id, DailyLog.date == today_str).first()
    if log:
        log.meditation_done = True
    else:
        log = DailyLog(user_id=user_id, date=today_str, meditation_done=True)
        db.add(log)
    db.commit()
    return {"success": True}

# ── COMMUNITY GROUPS, EVENTS & MASTERMINDS ─────────────────────────────────────
@app.get("/api/community/groups")
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(CommunityGroup).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "category": g.category,
            "min_tier": g.min_tier,
            "members_count": g.members_count,
            "price_req": f"${TIER_PRICES.get(g.min_tier, 25)} USD"
        }
        for g in groups
    ]

@app.get("/api/community/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.event_date.asc()).all()
    return [
        {
            "id": ev.id,
            "title": ev.title,
            "description": ev.description,
            "speaker": ev.speaker,
            "speaker_role": ev.speaker_role,
            "event_date": ev.event_date.isoformat(),
            "duration_min": ev.duration_min,
            "min_tier": ev.min_tier,
            "meet_url": ev.meet_url,
            "category": ev.category,
            "rsvps_count": ev.rsvps_count
        }
        for ev in events
    ]

@app.post("/api/community/events/{event_id}/rsvp/{user_id}")
def rsvp_event(event_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not user or not ev:
        raise HTTPException(404, "No encontrado")
    
    if not can_access_tier(user.tier, ev.min_tier):
        raise HTTPException(403, f"Este evento requiere nivel {ev.min_tier.upper()} (${TIER_PRICES.get(ev.min_tier)} USD). Tu nivel actual es {user.tier.upper()}.")

    existing = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == user_id).first()
    if existing:
        return {"success": True, "already_rsvpd": True, "meet_url": ev.meet_url}
    
    rsvp = EventRSVP(event_id=event_id, user_id=user_id)
    db.add(rsvp)
    ev.rsvps_count += 1
    db.commit()

    return {"success": True, "rsvps_count": ev.rsvps_count, "meet_url": ev.meet_url}

@app.get("/api/community/posts")
def get_posts(group_id: Optional[int] = None, tag: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Post)
    if group_id:
        q = q.filter(Post.group_id == group_id)
    if tag:
        q = q.filter(Post.tag == tag)
    posts = q.order_by(Post.created_at.desc()).limit(30).all()
    
    res = []
    for p in posts:
        author = db.query(User).filter(User.id == p.author_id).first()
        comments_cnt = db.query(Comment).filter(Comment.post_id == p.id).count()
        group = db.query(CommunityGroup).filter(CommunityGroup.id == p.group_id).first() if p.group_id else None
        res.append({
            "id": p.id,
            "content": p.content,
            "tag": p.tag,
            "image_url": p.image_url,
            "likes_count": p.likes_count,
            "created_at": p.created_at.isoformat(),
            "group_name": group.name if group else "Comunidad General",
            "author": {
                "id": author.id if author else 0,
                "name": author.name if author else "Miembro VitalCore",
                "avatar_url": author.avatar_url if author else None,
                "tier": author.tier if author else "inicial",
                "is_admin": author.is_admin if author else False
            },
            "comments_count": comments_cnt
        })
    return res

@app.post("/api/community/posts")
def create_post(user_id: int, data: PostCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
        
    post = Post(
        author_id=user_id,
        group_id=data.group_id,
        tag=data.tag or "General",
        content=data.content,
        image_url=data.image_url
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"success": True, "post_id": post.id}

@app.post("/api/community/posts/{post_id}/like")
def like_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post no encontrado")
    post.likes_count += 1
    db.commit()
    return {"likes_count": post.likes_count}

@app.get("/api/community/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    res = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        res.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
            "author": {
                "name": author.name if author else "Miembro",
                "avatar_url": author.avatar_url if author else None,
                "tier": author.tier if author else "inicial"
            }
        })
    return res

@app.post("/api/community/posts/{post_id}/comments")
def add_comment(post_id: int, user_id: int, data: CommentCreate, db: Session = Depends(get_db)):
    c = Comment(post_id=post_id, author_id=user_id, content=data.content)
    db.add(c)
    db.commit()
    return {"success": True}

# ── ADMIN PANEL ────────────────────────────────────────────────────────────────
@app.get("/api/admin/users")
def admin_get_users(admin_email: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.email == admin_email.strip().lower()).first()
    if not admin or not admin.is_admin:
        raise HTTPException(403, "Acceso no autorizado: Solo Administrador")
        
    users = db.query(User).all()
    res = []
    for u in users:
        p = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
        res.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "avatar_url": u.avatar_url,
            "is_admin": u.is_admin,
            "tier": u.tier,
            "tier_price_usd": TIER_PRICES.get(u.tier, 25),
            "days_left": calc_days_left(u.subscription_expires_at),
            "goal": p.goal if p else None,
            "weight_kg": p.weight_kg if p else None,
            "created_at": u.created_at.isoformat()
        })
    return res

@app.patch("/api/admin/users/{user_id}/tier")
def admin_change_tier(user_id: int, data: TierChangeRequest, admin_email: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.email == admin_email.strip().lower()).first()
    if not admin or not admin.is_admin:
        raise HTTPException(403, "Acceso no autorizado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    user.tier = data.tier.lower()
    if data.days_to_add:
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=data.days_to_add)
    db.commit()
    return {"success": True, "new_tier": user.tier, "days_left": calc_days_left(user.subscription_expires_at)}

@app.patch("/api/admin/users/{user_id}/toggle-admin")
def admin_toggle_role(user_id: int, admin_email: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.email == admin_email.strip().lower()).first()
    if not admin or not admin.is_admin:
        raise HTTPException(403, "Acceso no autorizado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    user.is_admin = not user.is_admin
    db.commit()
    return {"success": True, "is_admin": user.is_admin}

@app.get("/api/admin/metrics")
def admin_get_metrics(admin_email: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.email == admin_email.strip().lower()).first()
    if not admin or not admin.is_admin:
        raise HTTPException(403, "Acceso no autorizado")
        
    total_users = db.query(User).count()
    inicial_users = db.query(User).filter(User.tier == "inicial").count()
    premium_users = db.query(User).filter(User.tier == "premium").count()
    pro_users = db.query(User).filter(User.tier == "pro").count()
    total_posts = db.query(Post).count()
    total_logs = db.query(DailyLog).count()
    total_rsvps = db.query(EventRSVP).count()

    mrr = (inicial_users * 25) + (premium_users * 35) + (pro_users * 50)
    arr = mrr * 12

    return {
        "total_users": total_users,
        "tier_counts": {
            "inicial": inicial_users,
            "premium": premium_users,
            "pro": pro_users
        },
        "mrr_usd": mrr,
        "arr_usd": arr,
        "total_posts": total_posts,
        "total_daily_logs": total_logs,
        "total_rsvps": total_rsvps,
        "active_rate_pct": 92.5
    }
