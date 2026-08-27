from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = "sqlite:////app/data/vitalcore.db" if os.path.exists("/app/data") else f"sqlite:///{os.path.join(BASE_DIR, 'vitalcore.db')}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    tier = Column(String, default="inicial") # inicial ($25), premium ($35), pro ($50)
    subscription_started_at = Column(DateTime, default=datetime.utcnow)
    subscription_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=30))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    posts = relationship("Post", back_populates="author")
    logs = relationship("DailyLog", back_populates="user")
    event_rsvps = relationship("EventRSVP", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    goal = Column(String, nullable=True) # gain_muscle, lose_fat, maintain, improve_endurance, improve_flexibility
    activity_level = Column(String, default="moderate")
    gender = Column(String, default="other")
    target_weight_kg = Column(Float, nullable=True)
    imc = Column(Float, nullable=True)
    tdee = Column(Integer, nullable=True)
    health_notes = Column(Text, nullable=True)
    onboarding_done = Column(Boolean, default=False)
    user = relationship("User", back_populates="profile")

class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    goal = Column(String)
    daily_calories = Column(Integer)
    protein_g = Column(Integer)
    carbs_g = Column(Integer)
    fat_g = Column(Integer)
    plan_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    goal = Column(String)
    weeks = Column(Integer, default=4)
    plan_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String)  # YYYY-MM-DD
    calories_consumed = Column(Integer, default=0)
    protein_consumed = Column(Float, default=0)
    carbs_consumed = Column(Float, default=0)
    fat_consumed = Column(Float, default=0)
    weight_kg = Column(Float, nullable=True)
    workout_done = Column(Boolean, default=False)
    meditation_done = Column(Boolean, default=False)
    water_ml = Column(Integer, default=2000)
    mood = Column(Integer, default=4)
    user = relationship("User", back_populates="logs")

class CommunityGroup(Base):
    __tablename__ = "community_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    min_tier = Column(String, default="inicial") # inicial, premium, pro
    members_count = Column(Integer, default=0)
    image_url = Column(String, nullable=True)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    speaker = Column(String)
    speaker_role = Column(String)
    event_date = Column(DateTime)
    duration_min = Column(Integer, default=60)
    min_tier = Column(String, default="inicial") # inicial, premium, pro
    meet_url = Column(String, default="https://meet.google.com/vitalcore-live")
    category = Column(String) # fitness, nutrition, mindset, mastermind
    rsvps_count = Column(Integer, default=0)

class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="event_rsvps")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("community_groups.id"), nullable=True)
    content = Column(Text)
    image_url = Column(String, nullable=True)
    tag = Column(String, default="General") # Progreso, Nutrición, Rutina, Motivación
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    post = relationship("Post", back_populates="comments")

class MeditationSession(Base):
    __tablename__ = "meditation_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    meditation_id = Column(String)
    duration_min = Column(Integer)
    completed_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
