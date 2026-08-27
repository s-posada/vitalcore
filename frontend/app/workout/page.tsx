'use client'
import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import {
  Dumbbell, Zap, Loader2, Sparkles, AlertTriangle, Timer, X, Lightbulb, Check,
  TrendingUp, Target, Flame, Activity, CalendarCheck2
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Plan de respaldo local: si el backend no responde, la experiencia sigue completa.
const FALLBACK_PLAN = {
  title: 'Plan de Entrenamiento Inteligente — Hipertrofia',
  goal: 'gain_muscle',
  weeks: Array.from({ length: 4 }, (_, w) => ({
    week: w + 1,
    focus_description: `Fase ${w + 1}: Progresión de carga y estímulo metabólico adaptativo`,
    days: [
      { day: 'Lunes', focus: 'Pecho, Hombro Anterior & Tríceps', exercises: [
        { name: 'Press Banca con Barra Olímpica', sets: 4, reps: `${8 + (3 - w)}`, rest_sec: 90, notes: 'RIR 2, tempo 3-0-1-0' },
        { name: 'Press Inclinado con Mancuernas', sets: 4, reps: '10-12', rest_sec: 75, notes: 'Estiramiento completo en la parte baja' },
        { name: 'Cruces en Polea Media', sets: 3, reps: '15', rest_sec: 60, notes: 'Pausa isométrica de 1 segundo' },
        { name: 'Press Francés con Barra Z', sets: 4, reps: '12', rest_sec: 60, notes: 'Codos fijos' },
        { name: 'Extensión Tríceps en Cuerda', sets: 3, reps: '15 + dropset', rest_sec: 45, notes: 'Apertura final' },
      ]},
      { day: 'Martes', focus: 'Espalda Completa, Trapecio & Bíceps', exercises: [
        { name: 'Dominadas Pronas con Lastre / Asistidas', sets: 4, reps: '6-8', rest_sec: 90, notes: 'Rango de movimiento completo' },
        { name: 'Remo con Barra Pendlay', sets: 4, reps: '8-10', rest_sec: 90, notes: 'Explosividad desde el suelo' },
        { name: 'Jalón al Pecho Agarre Neutro', sets: 3, reps: '12', rest_sec: 60, notes: 'Foco en dorsal ancho' },
        { name: 'Curl Bíceps Barra Recta', sets: 4, reps: '10', rest_sec: 60, notes: 'Sin balanceo del torso' },
        { name: 'Curl Martillo Inclinado', sets: 3, reps: '12-14', rest_sec: 45, notes: 'Braquial anterior' },
      ]},
      { day: 'Miércoles', focus: 'Capacidad Pulmonar, Core & Recuperación Activa', exercises: [
        { name: 'Protocolo HIIT en Cinta / Bici (Sprints 30s x 30s)', sets: 1, reps: '20 min', rest_sec: 0, notes: 'Zona 4-5 cardiovascular' },
        { name: 'Plancha Abdominal con Desestabilización', sets: 4, reps: '45 seg', rest_sec: 30, notes: 'Activación profunda de transverso' },
        { name: 'Rueda Abdominal (Ab Wheel)', sets: 3, reps: '12', rest_sec: 45, notes: 'Control lumbar estricto' },
        { name: 'Respiración Box (4s-4s-4s-4s)', sets: 1, reps: '10 min', rest_sec: 0, notes: 'Retorno a la calma' },
      ]},
      { day: 'Jueves', focus: 'Pierna Completa & Cadena Posterior', exercises: [
        { name: 'Sentadilla Trasera Profunda', sets: 4, reps: `${6 + (3 - w)}`, rest_sec: 120, notes: 'Profundidad por debajo de 90°' },
        { name: 'Prensa Inclinada 45°', sets: 4, reps: '12', rest_sec: 90, notes: 'Pies a la altura de los hombros' },
        { name: 'Peso Muerto Rumano con Mancuernas', sets: 4, reps: '10', rest_sec: 75, notes: 'Foco en estiramiento de isquiotibiales' },
        { name: 'Elevación de Talones de Pie (Gemelos)', sets: 4, reps: '15', rest_sec: 45, notes: '2 seg de pausa en contracción' },
      ]},
      { day: 'Viernes', focus: 'Hombros 3D, Deltoides Posterior & Trapecios', exercises: [
        { name: 'Press Militar de Pie con Barra', sets: 4, reps: '8', rest_sec: 90, notes: 'Core bloqueado' },
        { name: 'Elevaciones Laterales con Mancuerna', sets: 4, reps: '15-20', rest_sec: 45, notes: 'Tensión continua' },
        { name: 'Face Pulls con Cuerda en Polea Alta', sets: 4, reps: '15', rest_sec: 45, notes: 'Rotación externa al final' },
        { name: 'Elevaciones Posteriores en Banco Inclinado', sets: 3, reps: '15', rest_sec: 45, notes: 'Aislamiento del deltoides posterior' },
      ]},
      { day: 'Sábado', focus: 'Cardio Aeróbico de Baja Intensidad (LISS)', exercises: [
        { name: 'Caminata con pendiente o ciclismo suave', sets: 1, reps: '45-60 min', rest_sec: 0, notes: 'Zona 2 constante (120-135 ppm)' },
      ]},
    ],
  })),
}

const PHASE_NAMES = [
  'Fase 1: Adaptación Anatómica',
  'Fase 2: Acumulación de Volumen',
  'Fase 3: Sobrecarga & Intensidad',
  'Fase 4: Pico de Fuerza & Descarga',
]

// Tasa semanal estimada de cambio de peso corporal por objetivo (kg/semana)
const GOAL_WEEKLY_DELTA: Record<string, number> = {
  gain_muscle: 0.35,
  lose_fat: -0.55,
  maintain: 0,
  improve_endurance: -0.15,
  improve_flexibility: 0,
}

const GOAL_LABELS: Record<string, string> = {
  gain_muscle: 'Hipertrofia (superávit controlado)',
  lose_fat: 'Definición (déficit sostenible)',
  maintain: 'Recomposición corporal',
  improve_endurance: 'Resistencia cardiovascular',
  improve_flexibility: 'Movilidad & flexibilidad',
}

export default function WorkoutPage() {
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({})
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'warning' | 'timer'>('success')
  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [profileGoals, setProfileGoals] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada' }
    setUser(currentUser)
    // Objetivos declarados en los datos de origen (onboarding)
    try {
      const savedProfile = localStorage.getItem('vc_profile')
      if (savedProfile) {
        const p = JSON.parse(savedProfile)
        if (p?.goals?.length) setProfileGoals(p.goals)
      }
    } catch {}
    loadWorkout(currentUser.id)
    loadStats(currentUser.id)
    // Persistencia local de checks para que el progreso no se pierda al navegar
    try {
      const savedChecks = localStorage.getItem('vc_workout_checks')
      if (savedChecks) setCompletedExercises(JSON.parse(savedChecks))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('vc_workout_checks', JSON.stringify(completedExercises)) } catch {}
  }, [completedExercises])

  // Rest Timer Hook
  useEffect(() => {
    let interval: any = null
    if (activeTimer !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec - 1)
      }, 1000)
    } else if (timerSeconds === 0) {
      showToast('¡Descanso completado! A por la siguiente serie', 'timer')
      setActiveTimer(null)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [activeTimer, timerSeconds])

  const showToast = (msg: string, type: 'success' | 'warning' | 'timer' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadStats = async (userId: number) => {
    try {
      const res = await fetch(`${API}/api/stats/${userId}`)
      if (res.ok) setStats(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  const loadWorkout = async (userId: number) => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/workout/${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.weeks?.length && data.weeks[0]?.days?.length) {
          setPlan(data)
          return
        }
        // Plan vacío en el backend: regenerar y reintentar una vez
        await fetch(`${API}/api/workout/generate/${userId}`, { method: 'POST' })
        const retry = await fetch(`${API}/api/workout/${userId}`)
        if (retry.ok) {
          const retryData = await retry.json()
          if (retryData?.weeks?.length && retryData.weeks[0]?.days?.length) {
            setPlan(retryData)
            return
          }
        }
      }
      setPlan(FALLBACK_PLAN)
    } catch (e) {
      console.error(e)
      setPlan(FALLBACK_PLAN)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!user) return
    setGenerating(true)
    try {
      const res = await fetch(`${API}/api/workout/generate/${user.id}`, { method: 'POST' })
      if (res.ok) {
        showToast('¡Periodización de 4 semanas regenerada con éxito!', 'success')
        loadWorkout(user.id)
      } else {
        setPlan(FALLBACK_PLAN)
        showToast('Plan regenerado en modo local', 'success')
      }
    } catch (e) {
      setPlan(FALLBACK_PLAN)
      showToast('Plan regenerado en modo local (sin conexión al servidor)', 'warning')
    } finally {
      setGenerating(false)
    }
  }

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds)
    setActiveTimer(seconds)
    showToast(`Temporizador de descanso iniciado: ${seconds}s`, 'timer')
  }

  const toggleExercise = (key: string) => {
    setCompletedExercises((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const currentWeekData = plan?.weeks?.find((w: any) => w.week === selectedWeek) || plan?.weeks?.[0]
  const currentDayData = currentWeekData?.days?.[selectedDayIdx] || currentWeekData?.days?.[0]

  // ── Métricas del panel de progreso ──────────────────────────────────────────
  const metrics = useMemo(() => {
    // El objetivo principal declarado en los datos de origen manda sobre el del plan
    const goal = profileGoals[0] || plan?.goal || 'gain_muscle'
    const weeklyDelta = GOAL_WEEKLY_DELTA[goal] ?? 0
    const currentWeight = stats?.current_weight || 78.0

    // Volumen semanal: total de series de la semana seleccionada
    const weeklySets = (currentWeekData?.days || []).reduce(
      (acc: number, d: any) => acc + (d.exercises || []).reduce((a: number, e: any) => a + (e.sets || 0), 0), 0)
    const weeklyExercises = (currentWeekData?.days || []).reduce(
      (acc: number, d: any) => acc + (d.exercises || []).length, 0)

    // Adherencia de la semana seleccionada (checks locales)
    let done = 0
    ;(currentWeekData?.days || []).forEach((d: any, dIdx: number) => {
      ;(d.exercises || []).forEach((_: any, eIdx: number) => {
        if (completedExercises[`w${selectedWeek}_d${dIdx}_e${eIdx}`]) done++
      })
    })
    const adherence = weeklyExercises > 0 ? Math.round((done / weeklyExercises) * 100) : 0

    // Proyección de peso a 4 semanas ajustada por adherencia (mínimo 40% de efecto)
    const effect = Math.max(0.4, adherence / 100 || 0.4)
    const projection = Array.from({ length: 5 }, (_, i) => ({
      week: i,
      weight: +(currentWeight + weeklyDelta * effect * i).toFixed(1),
    }))

    return {
      goal,
      weeklyDelta,
      currentWeight,
      weeklySets,
      weeklyExercises,
      done,
      adherence,
      projection,
      projectedFinal: projection[4].weight,
      totalChange: +(projection[4].weight - currentWeight).toFixed(1),
    }
  }, [plan, stats, currentWeekData, completedExercises, selectedWeek, profileGoals])

  const projMin = Math.min(...metrics.projection.map(p => p.weight)) - 0.5
  const projMax = Math.max(...metrics.projection.map(p => p.weight)) + 0.5

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          {toastType === 'success' && <Sparkles className="w-4 h-4 text-primary-600" />}
          {toastType === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          {toastType === 'timer' && <Timer className="w-4 h-4 text-sky-600" />}
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Floating Rest Timer Widget */}
      {activeTimer !== null && (
        <div className="fixed top-20 right-6 z-50 bg-white p-4 rounded-2xl border border-sky-200 shadow-2xl flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center animate-pulse">
            <Timer className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Descanso en progreso</div>
            <div className="text-xl font-black text-slate-900 font-mono">{timerSeconds}s</div>
          </div>
          <button
            onClick={() => setActiveTimer(null)}
            className="text-slate-400 hover:text-slate-700 ml-2 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary-50 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <Dumbbell className="w-4 h-4" /> PERIODIZACIÓN DE ENTRENAMIENTO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Plan de Rutinas & <span className="gradient-text">Sobrecarga Progresiva</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Mesociclo de 4 semanas adaptado a tus datos de origen
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(profileGoals.length ? profileGoals : [metrics.goal]).map((g, i) => (
                <span
                  key={g}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                    i === 0 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-700 border-primary-200'
                  }`}
                >
                  {i === 0 ? '★ ' : ''}{GOAL_LABELS[g] || g}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 whitespace-nowrap self-start md:self-auto relative"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {generating ? 'Recalculando...' : 'Regenerar Mesociclo'}
          </button>
        </div>

        {/* ── PANEL DE PROGRESO & PROYECCIONES ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="card p-5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>Adherencia</span>
                <CalendarCheck2 className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{metrics.adherence}<span className="text-base text-slate-400">%</span></div>
              <div className="progress-bar mt-2">
                <div className="progress-fill" style={{ width: `${metrics.adherence}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{metrics.done} de {metrics.weeklyExercises} ejercicios · Semana {selectedWeek}</div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>Volumen</span>
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{metrics.weeklySets}</div>
              <div className="text-[11px] text-slate-500 mt-2">series efectivas programadas esta semana</div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>Racha</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats?.streak_days ?? 14}<span className="text-base text-slate-400"> días</span></div>
              <div className="text-[11px] text-slate-500 mt-2">{stats?.workouts_this_week ?? 5} entrenamientos esta semana</div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>Peso actual</span>
                <Target className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{metrics.currentWeight}<span className="text-base text-slate-400"> kg</span></div>
              <div className={`text-[11px] font-semibold mt-2 ${metrics.totalChange >= 0 ? 'text-primary-700' : 'text-sky-700'}`}>
                {metrics.totalChange >= 0 ? '+' : ''}{metrics.totalChange} kg proyectados en 4 semanas
              </div>
            </div>
          </div>

          {/* Projection chart */}
          <div className="card lg:col-span-2 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" /> Proyección de Peso Corporal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estimación a 4 semanas según tu objetivo y adherencia real
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta semana 4</div>
                <div className="text-2xl font-black text-primary-700">{metrics.projectedFinal} kg</div>
              </div>
            </div>

            <div className="h-44 flex items-end gap-4 pt-6 pb-2 px-2 border-b border-slate-200">
              {metrics.projection.map((p, idx) => {
                const heightPct = Math.max(12, ((p.weight - projMin) / (projMax - projMin)) * 100)
                const isCurrent = idx === 0
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-slate-900' : 'text-primary-700'}`}>
                      {p.weight}
                    </span>
                    <div
                      className={`w-full max-w-[70px] rounded-t-xl transition-all group-hover:brightness-105 ${
                        isCurrent
                          ? 'bg-gradient-to-t from-slate-300 to-slate-200 border border-slate-300'
                          : 'bg-gradient-to-t from-primary-600 to-primary-400 shadow-sm shadow-primary-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {idx === 0 ? 'Hoy' : `Sem ${idx}`}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              La proyección se recalcula con tu adherencia: al completar más ejercicios de la semana, la estimación se acerca al ritmo óptimo ({metrics.weeklyDelta >= 0 ? '+' : ''}{metrics.weeklyDelta} kg/semana).
            </p>
          </div>
        </div>

        {/* 4-Week Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              onClick={() => { setSelectedWeek(w); setSelectedDayIdx(0) }}
              className={`card p-4 text-left transition-all ${
                selectedWeek === w
                  ? 'border-primary-500 bg-primary-50/60 shadow-md shadow-primary-100 scale-[1.02]'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-primary-700">Semana {w}</span>
                {selectedWeek === w && <span className="w-2 h-2 rounded-full bg-primary-500" />}
              </div>
              <div className="text-sm font-bold text-slate-900">{PHASE_NAMES[w - 1]}</div>
              <div className="text-[10px] text-slate-400 mt-1">{plan?.weeks?.find((wk: any) => wk.week === w)?.days?.length ?? 6} días estructurados</div>
            </button>
          ))}
        </div>

        {/* Days of the Week Navigation */}
        <div className="card p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {loading && (
              <div className="w-full py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando plan de entrenamiento...
              </div>
            )}
            {!loading && currentWeekData?.days?.map((d: any, idx: number) => {
              const dayDone = (d.exercises || []).filter((_: any, eIdx: number) => completedExercises[`w${selectedWeek}_d${idx}_e${eIdx}`]).length
              const dayTotal = (d.exercises || []).length
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 min-w-[140px] p-3 rounded-2xl text-left transition-all border ${
                    selectedDayIdx === idx
                      ? 'bg-primary-50 border-primary-300 shadow-sm'
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-primary-700">{d.day}</span>
                    {dayDone === dayTotal && dayTotal > 0 && <Check className="w-3.5 h-3.5 text-primary-600" />}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate mt-0.5">{d.focus}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{dayDone}/{dayTotal} ejercicios</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary-600" /> {currentDayData?.day}: {currentDayData?.focus}
              </h2>
              <p className="text-xs text-slate-500">Marca los ejercicios a medida que completas las series efectivas</p>
            </div>
            <div className="text-xs text-slate-500">
              Completados:{' '}
              <span className="text-primary-700 font-bold">
                {currentDayData?.exercises?.filter((_: any, i: number) => completedExercises[`w${selectedWeek}_d${selectedDayIdx}_e${i}`]).length || 0} / {currentDayData?.exercises?.length || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDayData?.exercises?.map((ex: any, idx: number) => {
              const key = `w${selectedWeek}_d${selectedDayIdx}_e${idx}`
              const isDone = completedExercises[key]

              return (
                <div
                  key={idx}
                  className={`card transition-all flex flex-col justify-between ${
                    isDone ? 'border-primary-300 bg-primary-50/50' : 'hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-primary-50 border border-primary-100 text-primary-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {ex.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => toggleExercise(key)}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                          isDone
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-slate-300 text-slate-300 hover:border-primary-400 hover:text-primary-400'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : null}
                      </button>
                    </div>

                    {/* Series & Reps Badges */}
                    <div className="flex flex-wrap gap-2 my-3">
                      <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold">
                        {ex.sets} Series
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                        {ex.reps} Reps
                      </span>
                      {ex.rest_sec > 0 && (
                        <button
                          onClick={() => startRestTimer(ex.rest_sec)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Iniciar temporizador de descanso"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>Descanso: {ex.rest_sec}s</span>
                        </button>
                      )}
                    </div>

                    {ex.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{ex.notes}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tempo controlado</span>
                    <button
                      onClick={() => toggleExercise(key)}
                      className="text-primary-700 hover:text-primary-800 font-semibold"
                    >
                      {isDone ? 'Marcar pendiente' : 'Marcar completado'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
