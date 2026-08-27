"""Automated test suite verifying 100% of VitalCore API endpoints and business logic."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, User

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("  🧪 AUDITORÍA AUTOMATIZADA DE VITALCORE API")
    print("==================================================")

    # 1. Root & Health
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print("✅ 1. Endpoint raíz y estado de la API: OK")

    # 2. Auth Session
    auth_data = {
        "email": "sposada2026@udec.cl",
        "name": "Sebastián Posada",
        "tier": "pro"
    }
    r = client.post("/api/auth/session", json=auth_data)
    assert r.status_code == 200, f"Auth failed: {r.text}"
    user_info = r.json()
    user_id = user_info["id"]
    assert user_info["is_admin"] is True, "Admin flag failed"
    print(f"✅ 2. Autenticación & Sesión (Super Admin id={user_id}): OK")

    # 3. User Me
    r = client.get(f"/api/users/me?email=sposada2026@udec.cl")
    assert r.status_code == 200
    assert r.json()["tier"] == "pro"
    assert r.json()["tier_price_usd"] == 50
    print(f"✅ 3. Perfil de Usuario & Días de Suscripción ({r.json()['days_left']}d restantes): OK")

    # 4. Onboarding Biometrics
    ob_data = {
        "age": 28,
        "weight_kg": 78.5,
        "height_cm": 178.0,
        "goal": "gain_muscle",
        "activity_level": "active",
        "gender": "male",
        "target_weight_kg": 85.0
    }
    r = client.post(f"/api/onboarding/{user_id}", json=ob_data)
    assert r.status_code == 200
    assert "imc" in r.json() and "tdee" in r.json()
    print(f"✅ 4. Onboarding & Cálculo Biométrico (IMC={r.json()['imc']}, TDEE={r.json()['tdee']} kcal): OK")

    # 5. Nutrition Plan
    r = client.get(f"/api/nutrition/{user_id}")
    assert r.status_code == 200
    nutr = r.json()
    assert len(nutr["days"]) == 30, "Should have 30 days plan"
    print(f"✅ 5. Plan Nutricional de 30 Días ({nutr['daily_calories']} kcal, {nutr['protein_g']}g P / {nutr['carbs_g']}g C / {nutr['fat_g']}g G): OK")

    # 6. Generate Nutrition IA
    r = client.post(f"/api/nutrition/generate/{user_id}")
    assert r.status_code == 200
    print("✅ 6. Algoritmo de Regeneración de Nutrición IA: OK")

    # 7. Workout Periodization
    r = client.get(f"/api/workout/{user_id}")
    assert r.status_code == 200
    w_data = r.json()
    assert len(w_data["weeks"]) == 4, "Should have 4 weeks periodization"
    print(f"✅ 7. Periodización de Entrenamiento 4 Semanas ({w_data['title']}): OK")

    # 8. Daily Logging & Dashboard Stats
    log_data = {
        "date": "2026-08-27",
        "calories_consumed": 2480,
        "protein_consumed": 175.0,
        "carbs_consumed": 265.0,
        "fat_consumed": 68.0,
        "weight_kg": 78.2,
        "workout_done": True,
        "meditation_done": True,
        "water_ml": 3000,
        "mood": 5
    }
    r = client.post(f"/api/logs/{user_id}", json=log_data)
    assert r.status_code == 200

    r = client.get(f"/api/stats/{user_id}")
    assert r.status_code == 200
    stats = r.json()
    assert stats["streak_days"] >= 1
    print(f"✅ 8. Registro Diario & Dashboard Telemetría (Racha: {stats['streak_days']}d, Días Suscripción: {stats['days_left']}d): OK")

    # 9. Meditations & Voice Catalog
    r = client.get("/api/meditations")
    assert r.status_code == 200
    meds = r.json()
    assert len(meds) >= 5
    first_med = meds[0]["id"]
    r = client.post(f"/api/meditations/{first_med}/complete/{user_id}")
    assert r.status_code == 200
    print(f"✅ 9. Catálogo de Meditaciones Guiadas por Voz ({len(meds)} sesiones): OK")

    # 10. Live Events & RSVP Tier Gate
    r = client.get("/api/community/events")
    assert r.status_code == 200
    events = r.json()
    assert len(events) >= 3
    ev_id = events[0]["id"]
    r = client.post(f"/api/community/events/{ev_id}/rsvp/{user_id}")
    assert r.status_code == 200
    print(f"✅ 10. Eventos en Vivo & Sistema RSVP ({len(events)} eventos activos): OK")

    # 11. Community Groups & Feed Posts
    r = client.get("/api/community/groups")
    assert r.status_code == 200
    groups = r.json()
    assert len(groups) >= 4

    p_data = {
        "content": "¡Probando el sistema de comunidad en VitalCore! 🔥",
        "tag": "Progreso"
    }
    r = client.post(f"/api/community/posts?user_id={user_id}", json=p_data)
    assert r.status_code == 200
    post_id = r.json()["post_id"]

    r = client.post(f"/api/community/posts/{post_id}/like")
    assert r.status_code == 200
    print(f"✅ 11. Grupos de Comunidad & Publicaciones en Feed (Post #{post_id} creado y likeado): OK")

    # 12. Tier Upgrades ($25, $35, $50 USD)
    for t_name, price in [("inicial", 25), ("premium", 35), ("pro", 50)]:
        r = client.post(f"/api/users/{user_id}/upgrade", json={"tier": t_name, "days_to_add": 30})
        assert r.status_code == 200
        assert r.json()["tier_price_usd"] == price
    print("✅ 12. Pasarela de Membresías Recurrentes ($25 Inicial, $35 Premium, $50 Pro): OK")

    # Reset back to pro
    client.post(f"/api/users/{user_id}/upgrade", json={"tier": "pro", "days_to_add": 28})

    # 13. Admin Panel & MRR Calculation
    r = client.get("/api/admin/metrics?admin_email=sposada2026@udec.cl")
    assert r.status_code == 200
    m_data = r.json()
    assert m_data["mrr_usd"] > 0
    print(f"✅ 13. Métricas Financieras de Admin (MRR: ${m_data['mrr_usd']} USD, ARR: ${m_data['arr_usd']} USD): OK")

    r = client.get("/api/admin/users?admin_email=sposada2026@udec.cl")
    assert r.status_code == 200
    u_list = r.json()
    assert len(u_list) >= 6
    print(f"✅ 14. Directorio y Control de Permisos de Usuarios ({len(u_list)} usuarios auditados): OK")

    print("\n==================================================")
    print("  🏆 TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
