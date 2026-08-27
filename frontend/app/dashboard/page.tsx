'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { avatarUrl } from '@/lib/avatar'
import {
  Flame,
  Salad,
  Scale,
  TrendingUp,
  Dumbbell,
  Target,
  Mic,
  Ticket,
  ClipboardList,
  Save,
  CheckCircle2,
  AlertTriangle,
  Gem,
  Flower2,
  Lock,
  Check,
  UserRound,
  Pencil
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const GOAL_LABELS: Record<string, string> = {
  gain_muscle: 'Ganar masa muscular',
  lose_fat: 'Reducir grasa corporal',
  maintain: 'Mantenimiento',
  improve_endurance: 'Mejorar resistencia',
  improve_flexibility: 'Mejorar flexibilidad',
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingLog, setSavingLog] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'warning' | 'lock' | 'ticket'>('success')
  const [profile, setProfile] = useState<any>(null)

  // Quick log state
  const todayStr = new Date().toISOString().split('T')[0]
  const [logForm, setLogForm] = useState({
    calories: 2450,
    protein: 165,
    carbs: 260,
    fat: 65,
    water: 2500,
    weight: 78.0,
    workout: true,
    meditation: false,
    mood: 5
  })

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    let currentUser: any = null
    if (stored) {
      currentUser = JSON.parse(stored)
    } else {
      currentUser = {
        id: 1,
        name: 'Sebastián Posada',
        email: 'sposada2026@udec.cl',
        avatar_url: avatarUrl('sebastian', 'male'),
        tier: 'pro',
        is_admin: true,
        days_left: 28
      }
      localStorage.setItem('vc_user', JSON.stringify(currentUser))
    }
    setUser(currentUser)
    // Datos de origen guardados por el onboarding (incluye objetivos múltiples)
    try {
      const savedProfile = localStorage.getItem('vc_profile')
      if (savedProfile) setProfile(JSON.parse(savedProfile))
    } catch {}
    loadData(currentUser.id, currentUser.email)
  }, [])

  const loadData = async (userId: number, email: string) => {
    try {
      setLoading(true)
      // Stats
      const sRes = await fetch(`${API}/api/stats/${userId}`)
      if (sRes.ok) {
        const sData = await sRes.json()
        setStats(sData)
      }

      // User details
      const uRes = await fetch(`${API}/api/users/me?email=${encodeURIComponent(email)}`)
      if (uRes.ok) {
        const uData = await uRes.json()
        setUser((prev: any) => ({ ...prev, ...uData }))
        if (uData.profile?.weight_kg) {
          setLogForm((p) => ({ ...p, weight: uData.profile.weight_kg }))
        }
        // El perfil del backend complementa los datos de origen locales
        if (uData.profile) {
          setProfile((p: any) => ({ ...uData.profile, ...(p || {}) }))
        }
      }

      // Events
      const evRes = await fetch(`${API}/api/community/events`)
      if (evRes.ok) {
        const evData = await evRes.json()
        setEvents(evData.slice(0, 3))
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string, type: 'success' | 'warning' | 'lock' | 'ticket' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleSaveLog = async () => {
    if (!user) return
    setSavingLog(true)
    try {
      const res = await fetch(`${API}/api/logs/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          calories_consumed: parseInt(String(logForm.calories)),
          protein_consumed: parseFloat(String(logForm.protein)),
          carbs_consumed: parseFloat(String(logForm.carbs)),
          fat_consumed: parseFloat(String(logForm.fat)),
          weight_kg: parseFloat(String(logForm.weight)),
          water_ml: parseInt(String(logForm.water)),
          workout_done: logForm.workout,
          meditation_done: logForm.meditation,
          mood: logForm.mood
        })
      })
      if (res.ok) {
        showToast('¡Registro diario guardado con éxito!', 'success')
        loadData(user.id, user.email)
      }
    } catch (e) {
      showToast('Error al conectar con el servidor', 'warning')
    } finally {
      setSavingLog(false)
    }
  }

  const handleQuickRSVP = async (eventId: number) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/community/events/${eventId}/rsvp/${user.id}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        showToast('¡Lugar reservado! Enlace de Meet activado.', 'ticket')
        loadData(user.id, user.email)
      } else {
        showToast(data.detail || 'Requiere upgrade de plan', 'lock')
      }
    } catch (e) {
      showToast('Error de red', 'warning')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          <span className="inline-flex items-center gap-1.5">
            {toastType === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toastType === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {toastType === 'lock' && <Lock className="w-4 h-4" />}
            {toastType === 'ticket' && <Ticket className="w-4 h-4" />}
            {toastMsg}
          </span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header section with subscription indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl glow-green relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              SISTEMA INTEGRAL ACTIVO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              Bienvenido de vuelta, <span className="gradient-text">{user?.name || 'Atleta'}</span>
              <Flame className="w-5 h-5 text-primary-700" />
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Tu programa personalizado está sincronizado. Mantén tu racha activa y completa tus objetivos nutricionales y físicos hoy.
            </p>
          </div>

          {/* Subscription Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Estado de Membresía</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                user?.tier === 'pro' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                user?.tier === 'premium' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Plan {user?.tier || 'Inicial'} (${user?.tier_price_usd || 25} USD/m)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{user?.days_left || 28}</span>
              <span className="text-xs text-slate-400">días restantes de suscripción</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href="/pricing" className="text-xs flex-1 text-center py-2 px-3 rounded-xl bg-primary-100 text-primary-800 hover:bg-primary-200 border border-primary-200 font-semibold transition-all inline-flex items-center justify-center gap-1.5">
                <Gem className="w-3.5 h-3.5" /> Mejorar Plan
              </Link>
              <Link href="/community" className="text-xs flex-1 text-center py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-all">
                Eventos
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>RACHA ACTIVA</span>
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {stats?.streak_days || 14} <span className="text-sm font-medium text-slate-400">días invicto</span>
            </div>
            <div className="text-xs text-primary-700 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Entrenamientos & meditaciones constantes
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>CALORÍAS OBJETIVO</span>
              <Salad className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {stats?.target_calories || 2450} <span className="text-sm font-medium text-slate-400">kcal/día</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Promedio semanal: <span className="text-slate-900 font-semibold">{stats?.avg_weekly_calories || 2420} kcal</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>PESO CORPORAL</span>
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {stats?.current_weight || 78.0} <span className="text-sm font-medium text-slate-400">kg</span>
            </div>
            <div className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Meta: {user?.profile?.target_weight_kg || 84.0} kg ({user?.profile?.goal === 'gain_muscle' ? 'Hipertrofia' : 'Definición'})
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>SESIONES COMPLETADAS</span>
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {stats?.workouts_this_week || 5} <span className="text-sm font-medium text-slate-400">esta semana</span>
            </div>
            <div className="text-xs text-sky-700 mt-2">
              + {stats?.meditations_this_week || 4} meditaciones guiadas
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Macros & Weight Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Macros Card */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Distribución de Macronutrientes Diarios
                  </h3>
                  <p className="text-xs text-slate-500">Calculado para optimizar recomposición corporal y rendimiento</p>
                </div>
                <Link href="/nutrition" className="text-xs font-semibold text-primary-700 hover:text-primary-800">
                  Ver Plan Completo →
                </Link>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-sky-700">Proteína ({logForm.protein}g / {stats?.target_protein || 170}g)</span>
                    <span className="text-slate-600">{Math.round((logForm.protein / (stats?.target_protein || 170)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" style={{ width: `${Math.min(100, (logForm.protein / (stats?.target_protein || 170)) * 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-600">Carbohidratos ({logForm.carbs}g / {stats?.target_carbs || 260}g)</span>
                    <span className="text-slate-600">{Math.round((logForm.carbs / (stats?.target_carbs || 260)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${Math.min(100, (logForm.carbs / (stats?.target_carbs || 260)) * 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-red-600">Grasas Saludables ({logForm.fat}g / {stats?.target_fat || 65}g)</span>
                    <span className="text-slate-600">{Math.round((logForm.fat / (stats?.target_fat || 65)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${Math.min(100, (logForm.fat / (stats?.target_fat || 65)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Weight Progression Chart Visualization */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Evolución de Peso & Telemetría
                  </h3>
                  <p className="text-xs text-slate-500">Registro biométrico de los últimos 14 días</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">IMC: {user?.profile?.imc || 24.6}</span>
                  <span className="px-2 py-1 rounded-md bg-primary-50 text-primary-700 font-mono">TDEE: {user?.profile?.tdee || 2450} kcal</span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200">
                {stats?.weight_progress?.length > 0 ? (
                  stats.weight_progress.map((w: any, idx: number) => {
                    const minW = 75
                    const maxW = 82
                    const heightPct = Math.max(15, Math.min(100, ((w.weight - minW) / (maxW - minW)) * 100))
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                          {w.weight}kg
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-sm"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] text-slate-400 font-mono truncate">{w.date}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    Cargando historial de peso...
                  </div>
                )}
              </div>
            </div>

            {/* Live Events Highlight */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Próximos Eventos & Masterminds de la Comunidad
                  </h3>
                  <p className="text-xs text-slate-500">Aprende y conecta con expertos en vivo</p>
                </div>
                <Link href="/community" className="text-xs font-semibold text-primary-700 hover:text-primary-800">
                  Explorar Todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                          {ev.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.event_date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{ev.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Por {ev.speaker}</p>
                    </div>

                    <button
                      onClick={() => handleQuickRSVP(ev.id)}
                      className="mt-3 w-full py-1.5 px-3 rounded-xl bg-primary-100 hover:bg-primary-200 text-primary-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Reservar Cupo ({ev.rsvps_count})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Datos de Origen + Quick Daily Log Form */}
          <div className="space-y-6">
            {/* Datos de Origen — la base del programa personalizado */}
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-primary-600" /> Datos de Origen
                  </h3>
                  <p className="text-xs text-slate-500">La base con la que se calculan tus planes</p>
                </div>
                <Link
                  href="/onboarding"
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1 bg-primary-50 border border-primary-200 rounded-lg px-2.5 py-1.5"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Género', value: profile?.gender === 'male' ? 'Masculino' : profile?.gender === 'female' ? 'Femenino' : profile?.gender ? 'Otro' : '—' },
                  { label: 'Edad', value: profile?.age ? `${profile.age} años` : '—' },
                  { label: 'Peso', value: profile?.weight_kg ? `${profile.weight_kg} kg` : `${stats?.current_weight || '—'} kg` },
                  { label: 'Estatura', value: profile?.height_cm ? `${profile.height_cm} cm` : '—' },
                  { label: 'IMC', value: profile?.imc || user?.profile?.imc || '—' },
                  { label: 'TDEE', value: (profile?.tdee || user?.profile?.tdee) ? `${profile?.tdee || user?.profile?.tdee} kcal` : '—' },
                  { label: 'Actividad', value: ACTIVITY_LABELS[profile?.activity_level] || '—' },
                  { label: 'Peso objetivo', value: (profile?.target_weight_kg || user?.profile?.target_weight_kg) ? `${profile?.target_weight_kg || user?.profile?.target_weight_kg} kg` : '—' },
                ].map((d) => (
                  <div key={d.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{d.label}</div>
                    <div className="font-bold text-slate-900 mt-0.5">{d.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Objetivos del programa</div>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.goals?.length ? profile.goals : [profile?.primary_goal || user?.profile?.goal || 'gain_muscle']).map((g: string, i: number) => (
                    <span
                      key={g}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        i === 0
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}
                    >
                      {i === 0 ? '★ ' : ''}{GOAL_LABELS[g] || g}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">★ objetivo principal — el plan de nutrición y entrenamiento se adapta a esta combinación.</p>
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Registro Rápido de Hoy
                </h3>
                <p className="text-xs text-slate-500">Guarda tus datos diarios y alimenta el algoritmo de IA</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Calorías consumidas (kcal)</label>
                  <input
                    type="number"
                    className="input-dark text-sm py-2"
                    value={logForm.calories}
                    onChange={(e) => setLogForm({ ...logForm, calories: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Proteína (g)</label>
                    <input
                      type="number"
                      className="input-dark text-xs py-1.5 px-2"
                      value={logForm.protein}
                      onChange={(e) => setLogForm({ ...logForm, protein: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Carbos (g)</label>
                    <input
                      type="number"
                      className="input-dark text-xs py-1.5 px-2"
                      value={logForm.carbs}
                      onChange={(e) => setLogForm({ ...logForm, carbs: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Grasas (g)</label>
                    <input
                      type="number"
                      className="input-dark text-xs py-1.5 px-2"
                      value={logForm.fat}
                      onChange={(e) => setLogForm({ ...logForm, fat: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Peso Hoy (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-dark text-sm py-2"
                      value={logForm.weight}
                      onChange={(e) => setLogForm({ ...logForm, weight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Agua (ml)</label>
                    <input
                      type="number"
                      step="250"
                      className="input-dark text-sm py-2"
                      value={logForm.water}
                      onChange={(e) => setLogForm({ ...logForm, water: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={logForm.workout}
                      onChange={(e) => setLogForm({ ...logForm, workout: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 focus:ring-offset-0 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5"><Dumbbell className="w-4 h-4" /> Entrenamiento Completado</span>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={logForm.meditation}
                      onChange={(e) => setLogForm({ ...logForm, meditation: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 focus:ring-offset-0 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5"><Flower2 className="w-4 h-4" /> Meditación / Respiración Hecha</span>
                  </label>
                </div>

                <button
                  onClick={handleSaveLog}
                  disabled={savingLog}
                  className="w-full btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-4"
                >
                  {savingLog ? (
                    <><Save className="w-4 h-4" /> Guardando...</>
                  ) : (
                    <><Flame className="w-4 h-4" /> Guardar Registro del Día</>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Módulos Principales</div>
              
              <Link href="/nutrition" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Salad className="w-5 h-5 text-primary-700" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Menú & Recetas de Hoy</div>
                    <div className="text-[10px] text-slate-500">Desayuno, almuerzo, cena y snacks</div>
                  </div>
                </div>
                <span className="text-xs text-primary-700">Ver →</span>
              </Link>

              <Link href="/workout" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-primary-700" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Rutina del Día</div>
                    <div className="text-[10px] text-slate-500">Series, repeticiones y descansos</div>
                  </div>
                </div>
                <span className="text-xs text-primary-700">Ver →</span>
              </Link>

              <Link href="/meditation" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Flower2 className="w-5 h-5 text-primary-700" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Meditación Guiada</div>
                    <div className="text-[10px] text-slate-500">Voz interactiva en el navegador</div>
                  </div>
                </div>
                <span className="text-xs text-primary-700">Ver →</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
