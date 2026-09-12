import os, json, random, time, asyncio
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import (
    get_db, SessionLocal, create_tables, User, UserProfile, NutritionPlan,
    WorkoutPlan, DailyLog, Post, EventRSVP, CatalogItem
)
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta, UTC

from semantic_engine import VectorSearchEngine
from engine_registry import set_engine, get_engine
from sse_starlette.sse import EventSourceResponse
from mcp_server import MCP_TOOLS_MANIFEST, execute_mcp_tool, tool_get_user_biometrics, tool_search_semantic, tool_record_daily_log
import gemini_client
from coach import run_coach, tool_labels

GEMINI_API_KEY = gemini_client.get_api_key()
# El agente LangChain de la SPEC-02 queda tras una bandera: su importación agota
# la memoria del plan gratuito de Render y tumba el servicio web.
ENABLE_LANGCHAIN_AGENT = os.getenv("ENABLE_LANGCHAIN_AGENT", "false").strip().lower() in {"1", "true", "yes", "on"}
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
DEMO_MODE = os.getenv("DEMO_MODE", "true" if APP_ENV != "production" else "false").strip().lower() in {"1", "true", "yes", "on"}
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
JWT_ALGORITHM = "HS256"
SESSION_TTL_MINUTES = 12 * 60

# ── Chat: límites anti-abuso (en memoria, suficiente para un solo proceso) ──────
CHAT_RATE_WINDOW_SEC = 60
CHAT_RATE_MAX_MSGS = 8
CHAT_MAX_CHARS = 400
_chat_hits: dict = {}

def _chat_rate_limited(user_id: int) -> bool:
    now = time.time()
    hits = [t for t in _chat_hits.get(user_id, []) if now - t < CHAT_RATE_WINDOW_SEC]
    hits.append(now)
    _chat_hits[user_id] = hits
    return len(hits) > CHAT_RATE_MAX_MSGS

# ── App setup ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_: FastAPI):
    """Inicializa persistencia y búsqueda semántica una sola vez por proceso."""
    if not SECRET_KEY and not DEMO_MODE:
        raise RuntimeError("SECRET_KEY es obligatoria cuando DEMO_MODE=false")
    create_tables()
    db = SessionLocal()
    try:
        from seed import seed, seed_catalog
        seed()
        seed_catalog(db)
        engine = VectorSearchEngine()
        engine.reload(db)
        set_engine(engine)
    finally:
        db.close()
    yield


app = FastAPI(
    title="VitalCore API — Bienestar Integral & Longevidad",
    version="2.1.0",
    description="API del prototipo VitalCore para nutrición, entrenamiento y bienestar.",
    lifespan=lifespan,
)

# CORS restringido: orígenes locales + regex combinado para Vercel, Anthropic y Claude.ai (SPEC-03)
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100,http://127.0.0.1:3100"
    ).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://([a-z0-9-]+\.vercel\.app|[a-z0-9-]+\.anthropic\.com|claude\.ai)$",
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
    return email.strip().lower() in {e.lower() for e in ADMIN_EMAILS}

# ── Schemas ────────────────────────────────────────────────────────────────────
class UserSessionRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    name: str = Field(min_length=2, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=2048)
    tier: Optional[Literal["inicial", "premium", "pro"]] = "inicial"

class ProfileUpdate(BaseModel):
    age: Optional[int] = Field(default=None, ge=13, le=120)
    weight_kg: Optional[float] = Field(default=None, gt=20, le=400)
    height_cm: Optional[float] = Field(default=None, ge=100, le=250)
    goal: Optional[Literal["gain_muscle", "lose_fat", "maintain", "improve_endurance", "improve_flexibility"]] = None
    activity_level: Optional[Literal["sedentary", "light", "moderate", "active", "very_active"]] = "moderate"
    gender: Optional[Literal["male", "female", "other"]] = "other"
    target_weight_kg: Optional[float] = Field(default=None, gt=20, le=400)
    health_notes: Optional[str] = Field(default=None, max_length=1000)

class LogCreate(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    calories_consumed: int = Field(default=0, ge=0, le=15000)
    protein_consumed: float = Field(default=0, ge=0, le=1000)
    carbs_consumed: float = Field(default=0, ge=0, le=2000)
    fat_consumed: float = Field(default=0, ge=0, le=1000)
    weight_kg: Optional[float] = Field(default=None, gt=20, le=400)
    workout_done: bool = False
    meditation_done: bool = False
    water_ml: int = Field(default=2000, ge=0, le=15000)
    mood: int = Field(default=4, ge=1, le=5)

class TierChangeRequest(BaseModel):
    tier: Literal["inicial", "premium", "pro"]
    days_to_add: Optional[int] = Field(default=30, ge=0, le=365)

class ChatMessage(BaseModel):
    user_id: int
    message: str = Field(min_length=1, max_length=CHAT_MAX_CHARS)
    history: Optional[List[dict]] = None

# ── Helpers ────────────────────────────────────────────────────────────────────
def calc_days_left(expires_at: Optional[datetime]) -> int:
    if not expires_at:
        return 30
    now = datetime.now(UTC).replace(tzinfo=None)
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


bearer_scheme = HTTPBearer(auto_error=False)


def _signing_key() -> str:
    """Usa una clave efímera conocida solo para desarrollo local en modo demo."""
    return SECRET_KEY or "vitalcore-local-demo-key-do-not-use-in-production"


def create_session_token(user: User) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=SESSION_TTL_MINUTES)
    return jwt.encode(
        {"sub": str(user.id), "email": user.email, "is_admin": bool(user.is_admin), "exp": expires_at},
        _signing_key(),
        algorithm=JWT_ALGORITHM,
    )


def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Valida una sesión firmada y resuelve el rol desde la base de datos."""
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Se requiere una sesión válida")
    try:
        payload = jwt.decode(credentials.credentials, _signing_key(), algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o expirada") from exc
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso reservado a administradores")
    return user

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "VitalCore API",
        "version": app.version,
        "status": "ok",
        "environment": APP_ENV,
        "demo_mode": DEMO_MODE,
    }


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "healthy", "version": app.version}

# ── AUTH & USER ────────────────────────────────────────────────────────────────
@app.post("/api/auth/session")
def auth_session(data: UserSessionRequest, db: Session = Depends(get_db)):
    if not DEMO_MODE:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "El acceso demo está desactivado; configure un proveedor de identidad para producción",
        )
    normalized_email = data.email.strip().lower()
    normalized_name = " ".join(data.name.strip().split())
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        is_adm = is_admin_email(data.email)
        now = datetime.now(UTC).replace(tzinfo=None)
        user = User(
            email=normalized_email,
            name=normalized_name,
            avatar_url=data.avatar_url or f"https://randomuser.me/api/portraits/{'men' if hash(data.name) % 2 == 0 else 'women'}/{abs(hash(data.name)) % 90 + 1}.jpg",
            is_admin=is_adm,
            tier="pro" if is_adm else "inicial",
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
        "onboarding_done": profile.onboarding_done if profile else False,
        "access_token": create_session_token(user),
        "token_type": "bearer",
        "demo_mode": True,
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
    now = datetime.now(UTC).replace(tzinfo=None)
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
    
    for k, v in data.model_dump(exclude_none=True).items():
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

    plan_data = json.loads(plan.plan_json or "{}")
    if not plan_data.get("days"):
        from seed import NUTRITION_PLAN_TEMPLATE
        plan_data = NUTRITION_PLAN_TEMPLATE
        plan.plan_json = json.dumps(plan_data)
        db.commit()

    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "daily_calories": plan.daily_calories,
        "protein_g": plan.protein_g,
        "carbs_g": plan.carbs_g,
        "fat_g": plan.fat_g,
        "days": plan_data.get("days", []),
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

    plan_data = json.loads(plan.plan_json or "{}")
    if not plan_data.get("weeks"):
        from seed import WORKOUT_PLAN_TEMPLATE
        plan_data = WORKOUT_PLAN_TEMPLATE
        plan.plan_json = json.dumps(plan_data)
        db.commit()

    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "weeks": plan_data.get("weeks", []),
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
        for k, v in data.model_dump(exclude_none=True).items():
            setattr(log, k, v)
    else:
        log = DailyLog(user_id=user_id, **data.model_dump())
        db.add(log)

    # El peso del día actualiza el perfil y recalcula IMC y TDEE, para que el
    # dashboard, los datos de origen y el coach muestren siempre lo mismo.
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if data.weight_kg and profile:
        profile.weight_kg = data.weight_kg
        profile.imc = calc_imc(profile.weight_kg, profile.height_cm)
        profile.tdee = calc_tdee(
            profile.weight_kg, profile.height_cm, profile.age,
            profile.gender or "other", profile.activity_level or "moderate",
        )

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
        elif not l.calories_consumed:
            # Registro sin nada declarado (por ejemplo, sólo el peso del día):
            # no cuenta para la racha, pero tampoco la interrumpe.
            continue
        else:
            break

    target_cal = plan.daily_calories if plan else 2400
    week = [l for l in logs[:7] if l.calories_consumed]
    avg_cal = sum(l.calories_consumed for l in week) // len(week) if week else 0
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
        # El perfil es la fuente de verdad: lo actualizan el onboarding, el chat y
        # cada registro diario con peso. Antes se leía sólo del último registro y
        # la tarjeta del dashboard quedaba desfasada del perfil.
        "current_weight": (user.profile.weight_kg if user.profile and user.profile.weight_kg
                           else (logs[0].weight_kg if logs and logs[0].weight_kg else None)),
        "weight_progress": weight_history,
        "macro_history": macro_history
    }

# ── ADMIN PANEL ────────────────────────────────────────────────────────────────
@app.get("/api/admin/users")
def admin_get_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
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
def admin_change_tier(user_id: int, data: TierChangeRequest, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    user.tier = data.tier.lower()
    if data.days_to_add:
        user.subscription_expires_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=data.days_to_add)
    db.commit()
    return {"success": True, "new_tier": user.tier, "days_left": calc_days_left(user.subscription_expires_at)}

@app.patch("/api/admin/users/{user_id}/toggle-admin")
def admin_toggle_role(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.id == admin.id:
        raise HTTPException(400, "No puedes revocar tu propio rol administrativo")
    user.is_admin = not user.is_admin
    db.commit()
    return {"success": True, "is_admin": user.is_admin}

@app.get("/api/admin/metrics")
def admin_get_metrics(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    inicial_users = db.query(User).filter(User.tier == "inicial").count()
    premium_users = db.query(User).filter(User.tier == "premium").count()
    pro_users = db.query(User).filter(User.tier == "pro").count()
    total_posts = db.query(Post).count()
    total_logs = db.query(DailyLog).count()
    total_rsvps = db.query(EventRSVP).count()

    mrr = (inicial_users * 25) + (premium_users * 35) + (pro_users * 50)
    arr = mrr * 12

    # Tasa de actividad real: usuarios con al menos un registro en los últimos 7 días.
    since = (datetime.now(UTC) - timedelta(days=7)).strftime("%Y-%m-%d")
    active_users = (
        db.query(DailyLog.user_id)
        .filter(DailyLog.date >= since)
        .distinct()
        .count()
    )
    active_rate = round((active_users / total_users) * 100, 1) if total_users else 0.0

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
        "active_users_7d": active_users,
        "active_rate_pct": active_rate,
    }

# ── CHAT / COACH VIRTUAL ─────────────────────────────────────────────────────
GOAL_NAMES = {
    "gain_muscle": "ganar masa muscular",
    "lose_fat": "reducir grasa corporal",
    "maintain": "mantener tu composición actual",
    "improve_endurance": "mejorar tu resistencia",
    "improve_flexibility": "mejorar tu flexibilidad",
}

def _build_user_context(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == user_id).order_by(NutritionPlan.created_at.desc()).first()
    logs = db.query(DailyLog).filter(DailyLog.user_id == user_id).order_by(DailyLog.date.desc()).limit(7).all()
    return {
        "name": user.name if user else "Atleta",
        "tier": user.tier if user else "inicial",
        "goal": GOAL_NAMES.get(profile.goal, "tu objetivo") if profile else "tu objetivo",
        "weight_kg": profile.weight_kg if profile else None,
        "target_weight_kg": profile.target_weight_kg if profile else None,
        "tdee": profile.tdee if profile else None,
        "daily_calories": plan.daily_calories if plan else None,
        "protein_g": plan.protein_g if plan else None,
        "recent_logs": len(logs),
        "last_mood": logs[0].mood if logs else None,
    }

def _fallback_reply(message: str, ctx: dict) -> str:
    """Respuestas basadas en reglas usando los datos reales del usuario — funciona sin clave de IA."""
    m = message.lower().strip()
    name = ctx["name"].split(" ")[0]

    if any(k in m for k in ["hola", "buenas", "buenos días", "buenas tardes", "hey"]):
        return f"¡Hola {name}! Soy tu coach de VitalCore. Puedo ayudarte con tu salud, nutrición de precisión, balance de macros y hábitos para optimizar tu bienestar. ¿En qué te ayudo hoy?"

    if any(k in m for k in ["peso", "adelgaz", "bajar", "subir de peso", "kilos"]):
        extra = f" Tu meta es llegar a {ctx['target_weight_kg']} kg." if ctx.get("target_weight_kg") else ""
        return f"Tu objetivo de salud actual es {ctx['goal']}.{extra} Lo más importante es la constancia: registra tu peso y tus comidas cada día en el Dashboard para que el plan nutricional se adapte a tu metabolismo."

    if any(k in m for k in ["calor", "macro", "proteína", "proteina", "comida", "nutri", "dieta", "comer", "alimento"]):
        if ctx.get("daily_calories"):
            return f"Tu plan actual apunta a {ctx['daily_calories']} kcal/día, con {ctx.get('protein_g', '—')}g de proteína. Puedes revisar el desglose en la sección Nutrición, ajustado a tu biometría y requerimientos energéticos."
        return "Aún no tienes un plan de nutrición generado. Ve a la sección Nutrición y toca 'Regenerar con IA' para calcular tus requerimientos óptimos."

    if any(k in m for k in ["entren", "ejercicio", "rutina", "movimiento", "actividad"]):
        return f"Mantenerte activo apoya tu metabolismo y tu salud celular. Enfócate en complementar tu plan de nutrición con actividad física regular adecuada a tu nivel."

    if any(k in m for k in ["estrés", "estres", "ansiedad", "dormir", "sueño", "relaj", "descanso"]):
        return "Para optimizar tu descanso y controlar el cortisol, una nutrición rica en magnesio, hidratación adecuada y evitar comidas pesadas 3 horas antes de dormir son claves. Nos enfocamos 100% en salud y nutrición de precisión."

    if any(k in m for k in ["motiv", "cansad", "no puedo", "difícil", "dificil", "rendirme", "flojera"]):
        lines = [
            f"Cuidar tu salud es la inversión más valiosa de tu vida, {name}. Cada elección nutritiva cuenta para tu longevidad y bienestar.",
            f"No necesitas perfección extrema, {name}, sino consistencia en tu nutrición y hábitos diarios. Revisa tu racha en el Dashboard para ver tu progreso.",
            f"La tecnología de VitalCore está aquí para acompañarte paso a paso, {name}. Sigue registrando tus indicadores para optimizar tu salud día a día.",
        ]
        return random.choice(lines)

    if any(k in m for k in ["plan", "premium", "pro", "membres", "precio", "pagar"]):
        return f"Estás en el plan {ctx['tier']}. En la sección Planes puedes revisar las características y coberturas de salud y nutrición de cada nivel."

    return (
        f"Solo puedo ayudarte con temas de salud y nutrición en VitalCore: metabolismo, nutrición personalizada, hábitos saludables o tu membresía, {name}. "
        f"Te recomiendo explorar el Dashboard y la sección de Nutrición."
    )

async def _coach_reply(
    db: Session, user_id: int, message: str, history: Optional[List[dict]]
) -> Optional[dict]:
    """Delegación al coach con herramientas reales (coach.py). None si Gemini no está disponible."""
    try:
        return await run_coach(db, user_id, message[:CHAT_MAX_CHARS], history)
    except Exception as exc:
        gemini_client.note_error(f"Coach: {type(exc).__name__}: {exc}")
        print(f"Aviso en el coach conversacional: {exc}")
        return None


# Explicación breve y honesta cuando la IA no está disponible, en vez de dejar
# una respuesta enlatada que parece un chat roto.
FALLBACK_NOTES = {
    "quota": "Recibí varias consultas muy seguidas y la IA necesita unos segundos. Te respondo con tus datos guardados y puedes reintentar enseguida. ",
    "saturado": "El modelo de IA está saturado en este momento, te respondo con tus datos guardados. ",
    "timeout": "La IA está tardando más de lo normal, te respondo con tus datos guardados. ",
    "sin_clave": "",
}


def _fallback_payload(db: Session, data: "ChatMessage") -> dict:
    kind = gemini_client.last_error_kind()
    ctx = _build_user_context(db, data.user_id)
    return {
        "reply": FALLBACK_NOTES.get(kind, "") + _fallback_reply(data.message, ctx),
        "source": "fallback",
        "reason": kind,
        "tools_used": [],
        "tool_labels": [],
        "data_changed": False,
    }


@app.post("/api/chat/coach")
async def chat_coach(data: ChatMessage, db: Session = Depends(get_db)):
    """
    Chat del producto. Gemini con herramientas conectadas a la base de datos
    (lee y escribe perfil, registros y planes) y respaldo determinista si la IA
    no está disponible, para que la demo nunca quede muda.
    """
    if _chat_rate_limited(data.user_id):
        return {
            "reply": "Vamos con calma — has enviado varios mensajes seguidos. Espera un minuto y seguimos, o mientras tanto revisa tu Dashboard.",
            "source": "ratelimit",
            "tools_used": [],
            "tool_labels": [],
            "data_changed": False,
        }

    result = await _coach_reply(db, data.user_id, data.message, data.history)
    if result:
        tools = result.get("tools_used", [])
        return {
            "reply": result["reply"],
            "source": result.get("source", "gemini"),
            "model": result.get("model"),
            "tools_used": tools,
            "tool_labels": tool_labels(tools),
            "data_changed": result.get("data_changed", False),
        }

    return _fallback_payload(db, data)

# ── TRABAJO 02: BÚSQUEDA SEMÁNTICA VECTORIAL & MOTOR MCP ───────────────────────

class SemanticSearchBody(BaseModel):
    query: str
    category: Optional[str] = "todas"
    top_k: Optional[int] = 4

class MCPToolCallRequest(BaseModel):
    tool: str
    arguments: Optional[Dict[str, Any]] = None

@app.get("/api/search/semantic")
def search_semantic_get(q: str, category: Optional[str] = "todas", top_k: Optional[int] = 4):
    """Búsqueda semántica vectorial sobre nutrición, ejercicios y meditaciones."""
    engine = get_engine()
    if not engine:
        db_init = SessionLocal()
        try:
            engine = VectorSearchEngine()
            engine.reload(db_init)
            set_engine(engine)
        finally:
            db_init.close()

    results = engine.search(query=q, category=category, top_k=top_k) if engine else []
    return {
        "query": q,
        "category": category,
        "total": len(results),
        "results": results
    }

@app.post("/api/search/semantic")
def search_semantic_post(body: SemanticSearchBody):
    """Búsqueda semántica vectorial vía POST para clientes frontend."""
    engine = get_engine()
    results = engine.search(query=body.query, category=body.category, top_k=body.top_k or 4) if engine else []
    return {
        "query": body.query,
        "category": body.category,
        "total": len(results),
        "results": results
    }

@app.get("/api/mcp/tools")
def get_mcp_tools():
    """Retorna el manifiesto estándar de herramientas MCP expuestas por VitalCore."""
    return {
        "protocol": "Model Context Protocol (MCP) v1.0",
        "server": "vitalcore-agent-mcp",
        "tools": MCP_TOOLS_MANIFEST
    }

@app.post("/api/mcp/call")
def call_mcp_tool_endpoint(req: MCPToolCallRequest, db: Session = Depends(get_db)):
    """Ejecuta una herramienta bajo el estándar MCP y retorna el resultado estructurado."""
    result = execute_mcp_tool(db, tool_name=req.tool, arguments=req.arguments or {})
    return {
        "status": "success" if "error" not in result else "error",
        "tool": req.tool,
        "result": result
    }

@app.get("/mcp/sse")
async def mcp_sse_endpoint():
    """
    SPEC-03: WebMCP sobre Server-Sent Events (SSE) para agentes remotos (Claude.ai).
    Protocolo MCP versión 2024-11-05 con ping cada 15s para evitar timeout de 30s en Render.
    """
    async def event_generator():
        # Evento 1: Handshake de protocolo e inicialización
        init_data = {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": False}
            },
            "serverInfo": {
                "name": "vitalcore-agent-mcp",
                "version": "2.0.0",
                "description": "Servidor MCP remoto de VitalCore para entrenamiento, nutrición y catálogo semántico"
            }
        }
        yield {
            "event": "endpoint",
            "data": json.dumps(init_data)
        }

        # Evento 2: Manifiesto expandido de herramientas (SPEC-02 tools + MCP tools)
        agent_tools = [
            {
                "name": "get_user_biometrics",
                "description": "Obtiene los datos biométricos actuales del usuario (peso, altura, IMC, TDEE, objetivo) y registros recientes.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer", "description": "ID del usuario en VitalCore"}
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "search_catalog_semantic",
                "description": "Búsqueda semántica vectorial en el catálogo de VitalCore (50 ítems de nutrición, ejercicio y meditación) con embeddings reales.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Consulta en lenguaje natural"},
                        "category": {
                            "type": "string",
                            "enum": ["todas", "nutricion", "entrenamiento", "meditacion"],
                            "description": "Filtro opcional de categoría"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "generate_nutrition_plan",
                "description": "Genera un plan nutricional personalizado con Gemini usando el perfil guardado del usuario y lo persiste en la BD.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer", "description": "ID del usuario"}
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "record_daily_log",
                "description": "Registra el consumo calórico y actividad física del día de hoy en la base de datos.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer", "description": "ID del usuario"},
                        "calories": {"type": "integer", "description": "Calorías consumidas"},
                        "workout_done": {"type": "boolean", "description": "Si completó entrenamiento hoy"},
                        "water_ml": {"type": "integer", "description": "Mililitros de agua"},
                        "notes": {"type": "string", "description": "Notas opcionales"}
                    },
                    "required": ["user_id", "calories"]
                }
            }
        ]
        yield {
            "event": "tools",
            "data": json.dumps({"tools": agent_tools}, ensure_ascii=False)
        }

        # Evento recurrente: Ping cada 15 segundos para mantener viva la conexión en Render
        while True:
            await asyncio.sleep(15)
            yield {
                "event": "ping",
                "data": json.dumps({"timestamp": datetime.now(UTC).isoformat()})
            }

    return EventSourceResponse(event_generator())

@app.post("/api/ai/agent-chat")
async def ai_agent_chat(data: ChatMessage, db: Session = Depends(get_db)):
    """
    SPEC-02: Endpoint del agente autónomo con herramientas.
    Rate limiting estricto (8 msgs/60s), agente LangChain cuando está habilitado
    por variable de entorno y, por defecto, el coach REST con las mismas cinco
    herramientas (más liviano, sin riesgo de agotar la memoria del servidor).
    """
    if _chat_rate_limited(data.user_id):
        return {
            "reply": "Has alcanzado el límite de 8 mensajes por minuto. Por favor, espera unos momentos.",
            "source": "ratelimit",
            "tools_used": [],
        }

    if ENABLE_LANGCHAIN_AGENT and GEMINI_API_KEY:
        try:
            from agent import run_agent
            return run_agent(db, data.user_id, data.message[:CHAT_MAX_CHARS])
        except Exception as exc:
            print(f"Aviso en ejecución del agente LangChain: {exc}")

    result = await _coach_reply(db, data.user_id, data.message, data.history)
    if result:
        tools = result.get("tools_used", [])
        return {
            "reply": result["reply"],
            "source": result.get("source", "gemini"),
            "model": result.get("model"),
            "tools_used": tools,
            "tool_labels": tool_labels(tools),
            "data_changed": result.get("data_changed", False),
        }

    return _fallback_payload(db, data)


@app.get("/api/ai/diagnostics")
def ai_diagnostics():
    """
    Diagnóstico del canal de IA sin exponer secretos. Sirve para verificar en
    producción por qué el coach responde con reglas en vez de con el modelo.
    """
    info = gemini_client.status()
    return {
        "environment": APP_ENV,
        "demo_mode": DEMO_MODE,
        "langchain_agent_enabled": ENABLE_LANGCHAIN_AGENT,
        **info,
        "hint": (
            "Configura GEMINI_API_KEY en el servicio para activar el coach con IA."
            if not info["gemini_key_present"] else
            "Todo listo: el coach responde con IA y herramientas."
            if info["model_in_use"] and not info["last_error"] else
            "Revisa last_error para el detalle del fallo."
        ),
    }


@app.post("/api/ai/diagnostics/probe")
async def ai_diagnostics_probe(model: Optional[str] = None, timeout_s: float = 60.0):
    """
    Prueba en vivo contra la API de Gemini y mide la latencia real del modelo.
    `?model=` permite comparar candidatos antes de fijar GEMINI_MODEL.
    """
    if not gemini_client.has_api_key():
        return {"ok": False, "reason": "GEMINI_API_KEY no configurada"}

    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            target = (model or "").strip() or await gemini_client.resolve_model(client, force=True)
            if not target:
                return {"ok": False, "reason": gemini_client.status()["last_error"]}
            res = await client.post(
                f"{gemini_client.API_BASE}/models/{target}:generateContent",
                params={"key": gemini_client.get_api_key()},
                json={
                    "contents": [{"role": "user", "parts": [{"text": "Responde solo: ok"}]}],
                    "generationConfig": {"maxOutputTokens": 24, "temperature": 0},
                },
            )
            elapsed = round((time.perf_counter() - started) * 1000)
            ok = res.status_code == 200
            if not ok:
                gemini_client.note_error(f"probe {res.status_code}: {res.text[:200]}")
            return {
                "ok": ok,
                "model": target,
                "status_code": res.status_code,
                "elapsed_ms": elapsed,
                "detail": None if ok else res.text[:200],
            }
    except Exception as exc:
        elapsed = round((time.perf_counter() - started) * 1000)
        gemini_client.note_error(f"probe: {type(exc).__name__}: {exc}")
        return {
            "ok": False,
            "model": model,
            "elapsed_ms": elapsed,
            "reason": f"{type(exc).__name__}: {exc}",
        }
