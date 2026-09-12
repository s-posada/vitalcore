'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import {
  Flame, Salad, Scale, TrendingUp, Dumbbell, Target, ClipboardList, Save,
  CheckCircle2, AlertTriangle, Gem, Lock, Check, UserRound, Pencil, LineChart, Droplets,
} from 'lucide-react'
import { API_BASE_URL as API } from '@/lib/api'
import type { DailyLog, DashboardStats, UserProfile, UserSession } from '@/lib/types'

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

const DEFAULT_LOG = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 2000,
  weight: 0,
  workout: false,
  meditation: false,
  mood: 4,
}

/** Valor con guion cuando el dato aún no existe: la demo nunca inventa cifras. */
const show = (v: number | null | undefined, suffix = '') =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${v}${suffix}`

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

function MetricCard({
  label, icon: Icon, value, unit, foot, loading,
}: {
  label: string
  icon: React.ElementType
  value: React.ReactNode
  unit?: string
  foot: React.ReactNode
  loading: boolean
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
        <span className="tracking-wide">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      {loading ? (
        <><Skeleton className="h-8 w-24 mb-2" /><Skeleton className="h-3 w-32" /></>
      ) : (
        <>
          <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
            {value} {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
          <div className="text-xs text-slate-500 mt-2">{foot}</div>
        </>
      )}
    </div>
  )
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = target > 0 ? Math.round((consumed / target) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className={color}>{label} ({consumed}g / {target || '—'}g)</span>
        <span className="text-slate-600">{target > 0 ? `${pct}%` : '—'}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct > 110 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingLog, setSavingLog] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'warning' | 'lock'>('success')
  const [logForm, setLogForm] = useState(DEFAULT_LOG)

  const todayStr = new Date().toISOString().split('T')[0]

  const showToast = (msg: string, type: 'success' | 'warning' | 'lock' = 'success') => {
    setToastMsg(msg)
    setToastType(type)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadData = useCallback(async (userId: number, email: string) => {
    try {
      const [sRes, uRes, lRes] = await Promise.all([
        fetch(`${API}/api/stats/${userId}`),
        fetch(`${API}/api/users/me?email=${encodeURIComponent(email)}`),
        fetch(`${API}/api/logs/${userId}?days=14`),
      ])

      if (sRes.ok) setStats(await sRes.json() as DashboardStats)

      if (uRes.ok) {
        const uData = await uRes.json() as UserSession
        setUser((prev) => prev ? { ...prev, ...uData } : uData)
        if (uData.profile) setProfile((p) => ({ ...p, ...uData.profile }))
      }

      // El registro de hoy precarga el formulario: editar, no volver a escribir todo.
      if (lRes.ok) {
        const logs = await lRes.json() as DailyLog[]
        const today = logs.find((l) => l.date === todayStr)
        setLogForm((prev) => ({
          ...prev,
          calories: today?.calories_consumed ?? prev.calories,
          protein: today?.protein_consumed ?? prev.protein,
          carbs: today?.carbs_consumed ?? prev.carbs,
          fat: today?.fat_consumed ?? prev.fat,
          water: today?.water_ml ?? prev.water,
          weight: today?.weight_kg ?? prev.weight,
          workout: today?.workout_done ?? prev.workout,
          meditation: today?.meditation_done ?? prev.meditation,
          mood: today?.mood ?? prev.mood,
        }))
      }
    } catch (error) {
      console.error('Error al cargar el dashboard:', error)
      showToast('No pudimos cargar tus datos. Revisa tu conexión.', 'warning')
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    if (!stored) {
      router.replace('/login')
      return
    }
    const currentUser = JSON.parse(stored) as UserSession
    setUser(currentUser)
    try {
      const savedProfile = localStorage.getItem('vc_profile')
      if (savedProfile) setProfile(JSON.parse(savedProfile))
    } catch {}
    loadData(currentUser.id, currentUser.email)
  }, [router, loadData])

  // Cuando el coach guarda algo desde el chat, el dashboard se actualiza solo.
  useEffect(() => {
    const refresh = () => {
      const stored = localStorage.getItem('vc_user')
      if (!stored) return
      const u = JSON.parse(stored) as UserSession
      loadData(u.id, u.email)
      showToast('Tus datos se actualizaron desde el coach', 'success')
    }
    window.addEventListener('vitalcore:data-updated', refresh)
    return () => window.removeEventListener('vitalcore:data-updated', refresh)
  }, [loadData])

  const weightSeries = useMemo(() => {
    const raw = stats?.weight_progress ?? []
    return raw.filter((w) => typeof w.weight === 'number')
  }, [stats])

  const weightDomain = useMemo<[number, number]>(() => {
    const values = weightSeries.map((w) => w.weight)
    const target = profile?.target_weight_kg ?? user?.profile?.target_weight_kg
    if (typeof target === 'number') values.push(target)
    if (!values.length) return [60, 90]
    return [Math.floor(Math.min(...values) - 2), Math.ceil(Math.max(...values) + 2)]
  }, [weightSeries, profile, user])

  const handleSaveLog = async () => {
    if (!user) return
    if (logForm.calories <= 0) {
      showToast('Ingresa las calorías consumidas antes de guardar', 'warning')
      return
    }
    setSavingLog(true)
    try {
      const res = await fetch(`${API}/api/logs/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          calories_consumed: Math.round(logForm.calories),
          protein_consumed: Number(logForm.protein),
          carbs_consumed: Number(logForm.carbs),
          fat_consumed: Number(logForm.fat),
          weight_kg: logForm.weight > 0 ? Number(logForm.weight) : null,
          water_ml: Math.round(logForm.water),
          workout_done: logForm.workout,
          meditation_done: logForm.meditation,
          mood: logForm.mood,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('Registro diario guardado con éxito', 'success')
      loadData(user.id, user.email)
    } catch {
      showToast('No se pudo guardar el registro. Intenta otra vez.', 'warning')
    } finally {
      setSavingLog(false)
    }
  }

  const currentWeight = stats?.current_weight ?? profile?.weight_kg ?? null
  const targetWeight = profile?.target_weight_kg ?? user?.profile?.target_weight_kg ?? null
  const goalKey = profile?.primary_goal || profile?.goal || user?.profile?.goal || ''

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up max-w-[calc(100vw-3rem)]">
          {toastType === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toastType === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />}
          {toastType === 'lock' && <Lock className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Encabezado y membresía */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-5 sm:p-6 rounded-3xl glow-green relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              SISTEMA INTEGRAL ACTIVO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
              Bienvenido de vuelta, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Atleta'}</span>
              <Flame className="w-5 h-5 text-primary-700" />
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Registra tu día para que el plan de nutrición se ajuste a tu metabolismo real.
              También puedes dictárselo al coach del chat.
            </p>
          </div>

          <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[260px]">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs text-slate-500 font-medium">Estado de membresía</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                user?.tier === 'pro' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : user?.tier === 'premium' ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {user?.tier || 'inicial'} · ${user?.tier_price_usd ?? 25} USD
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{show(user?.days_left)}</span>
              <span className="text-xs text-slate-400">días restantes de suscripción</span>
            </div>
            <Link href="/pricing" className="mt-3 text-xs w-full text-center py-2 px-3 rounded-xl bg-primary-100 text-primary-800 hover:bg-primary-200 border border-primary-200 font-semibold transition-all inline-flex items-center justify-center gap-1.5">
              <Gem className="w-3.5 h-3.5" /> Mejorar plan
            </Link>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="RACHA ACTIVA" icon={Flame} loading={loading}
            value={show(stats?.streak_days)} unit="días"
            foot={stats?.streak_days
              ? <span className="text-primary-700 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Adherencia constante</span>
              : 'Guarda tu primer registro para iniciar la racha'}
          />
          <MetricCard
            label="CALORÍAS OBJETIVO" icon={Salad} loading={loading}
            value={show(stats?.target_calories)} unit="kcal/día"
            foot={<>Promedio semanal: <span className="text-slate-900 font-semibold">{show(stats?.avg_weekly_calories)} kcal</span></>}
          />
          <MetricCard
            label="PESO CORPORAL" icon={Scale} loading={loading}
            value={show(currentWeight)} unit="kg"
            foot={targetWeight
              ? <span className="text-emerald-700 inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Meta: {targetWeight} kg · {GOAL_LABELS[goalKey] || 'Sin objetivo'}</span>
              : 'Define tu peso objetivo en Datos de Origen'}
          />
          <MetricCard
            label="ENTRENAMIENTOS" icon={Dumbbell} loading={loading}
            value={show(stats?.workouts_this_week)} unit="esta semana"
            foot={<>{show(stats?.meditations_this_week)} días de pauta nutricional cumplida</>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Macros */}
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Macronutrientes de hoy
                  </h3>
                  <p className="text-xs text-slate-500">Lo registrado hoy frente a tu objetivo diario</p>
                </div>
                <Link href="/nutrition" className="text-xs font-semibold text-primary-700 hover:text-primary-800 whitespace-nowrap">
                  Ver plan completo →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4 pt-2">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <MacroBar label="Proteína" consumed={logForm.protein} target={stats?.target_protein ?? 0} color="text-sky-700" />
                  <MacroBar label="Carbohidratos" consumed={logForm.carbs} target={stats?.target_carbs ?? 0} color="text-amber-600" />
                  <MacroBar label="Grasas saludables" consumed={logForm.fat} target={stats?.target_fat ?? 0} color="text-red-600" />
                </div>
              )}
            </div>

            {/* Evolución de peso */}
            <div className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <LineChart className="w-4 h-4" /> Evolución de peso
                  </h3>
                  <p className="text-xs text-slate-500">Registro biométrico de los últimos 14 días</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
                    IMC: {show(profile?.imc ?? user?.profile?.imc)}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-primary-50 text-primary-700 font-mono">
                    TDEE: {show(profile?.tdee ?? user?.profile?.tdee)} kcal
                  </span>
                </div>
              </div>

              {loading ? (
                <Skeleton className="h-52 w-full" />
              ) : weightSeries.length >= 2 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightSeries} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis domain={weightDomain} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(v: number) => [`${v} kg`, 'Peso']}
                      />
                      {typeof targetWeight === 'number' && (
                        <ReferenceLine y={targetWeight} stroke="#0ea5e9" strokeDasharray="4 4"
                          label={{ value: `Meta ${targetWeight}kg`, position: 'insideTopRight', fontSize: 10, fill: '#0284c7' }} />
                      )}
                      <Area type="monotone" dataKey="weight" stroke="#059669" strokeWidth={2.5} fill="url(#weightFill)" dot={{ r: 2.5, fill: '#059669' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                  <Scale className="w-6 h-6 text-slate-300" />
                  <p className="text-sm text-slate-500 max-w-xs">
                    Necesitas al menos dos registros de peso para ver tu curva de evolución.
                  </p>
                  <span className="text-xs text-slate-400">Guarda tu peso de hoy en el panel lateral.</span>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-primary-600" /> Datos de origen
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
                  { label: 'Peso', value: show(profile?.weight_kg ?? currentWeight, ' kg') },
                  { label: 'Estatura', value: show(profile?.height_cm, ' cm') },
                  { label: 'IMC', value: show(profile?.imc ?? user?.profile?.imc) },
                  { label: 'TDEE', value: show(profile?.tdee ?? user?.profile?.tdee, ' kcal') },
                  { label: 'Actividad', value: profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level] || '—' : '—' },
                  { label: 'Peso objetivo', value: show(targetWeight, ' kg') },
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
                  {(profile?.goals?.length ? profile.goals : [goalKey].filter(Boolean)).map((g: string, i: number) => (
                    <span
                      key={g}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        i === 0 ? 'bg-primary-600 text-white border-primary-600' : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}
                    >
                      {i === 0 ? '★ ' : ''}{GOAL_LABELS[g] || g}
                    </span>
                  ))}
                  {!profile?.goals?.length && !goalKey && (
                    <span className="text-xs text-slate-400">Sin objetivo definido todavía</span>
                  )}
                </div>
              </div>
            </div>

            {/* Registro del día */}
            <div className="card space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Registro de hoy
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="kcal" className="text-xs text-slate-600 block mb-1">Calorías consumidas (kcal)</label>
                  <input
                    id="kcal" type="number" min={0} max={10000}
                    className="input-dark text-sm py-2"
                    value={logForm.calories || ''}
                    placeholder="0"
                    onChange={(e) => setLogForm({ ...logForm, calories: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['Proteína (g)', 'protein'],
                    ['Carbos (g)', 'carbs'],
                    ['Grasas (g)', 'fat'],
                  ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="text-[10px] text-slate-600 block mb-1">{label}</label>
                      <input
                        type="number" min={0}
                        className="input-dark text-xs py-1.5 px-2"
                        value={logForm[key] || ''}
                        placeholder="0"
                        onChange={(e) => setLogForm({ ...logForm, [key]: Number(e.target.value) })}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Peso hoy (kg)</label>
                    <input
                      type="number" step="0.1" min={20} max={400}
                      className="input-dark text-sm py-2"
                      value={logForm.weight || ''}
                      placeholder="—"
                      onChange={(e) => setLogForm({ ...logForm, weight: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1 inline-flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Agua (ml)
                    </label>
                    <input
                      type="number" step="250" min={0} max={10000}
                      className="input-dark text-sm py-2"
                      value={logForm.water || ''}
                      onChange={(e) => setLogForm({ ...logForm, water: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={logForm.workout}
                      onChange={(e) => setLogForm({ ...logForm, workout: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 focus:ring-offset-0 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4" /> Entrenamiento completado
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={logForm.meditation}
                      onChange={(e) => setLogForm({ ...logForm, meditation: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 focus:ring-offset-0 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pauta nutricional cumplida
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleSaveLog}
                  disabled={savingLog}
                  className="w-full btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {savingLog
                    ? <><Save className="w-4 h-4 animate-pulse" /> Guardando...</>
                    : <><Flame className="w-4 h-4" /> Guardar registro del día</>}
                </button>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Módulos principales</div>
              {[
                { href: '/nutrition', icon: Salad, title: 'Menú y recetas de hoy', sub: 'Desayuno, almuerzo, cena y snacks' },
                { href: '/workout', icon: Dumbbell, title: 'Rutina del día', sub: 'Series, repeticiones y descansos' },
              ].map((m) => (
                <Link key={m.href} href={m.href} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <m.icon className="w-5 h-5 text-primary-700" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{m.title}</div>
                      <div className="text-[10px] text-slate-500">{m.sub}</div>
                    </div>
                  </div>
                  <span className="text-xs text-primary-700 group-hover:translate-x-0.5 transition-transform">Ver →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
