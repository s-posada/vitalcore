'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { avatarUrl } from '@/lib/avatar'
import { Dumbbell, Flame, Scale, PersonStanding, Flower2, Check, Bot, Loader2, Rocket } from 'lucide-react'
import { API_BASE_URL as API } from '@/lib/api'

const GOALS = [
  { id: 'gain_muscle', icon: Dumbbell, label: 'Ganar masa muscular', desc: 'Aumentar volumen y fuerza' },
  { id: 'lose_fat', icon: Flame, label: 'Reducir grasa corporal', desc: 'Perder peso de forma saludable' },
  { id: 'maintain', icon: Scale, label: 'Mantenerme', desc: 'Conservar mi composición actual' },
  { id: 'improve_endurance', icon: PersonStanding, label: 'Mejorar resistencia', desc: 'Cardio y capacidad pulmonar' },
  { id: 'improve_flexibility', icon: Flower2, label: 'Mejorar flexibilidad', desc: 'Movilidad y bienestar general' },
]

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentario', desc: 'Trabajo de escritorio, poca actividad' },
  { id: 'light', label: 'Ligero', desc: '1-2 días/semana de ejercicio' },
  { id: 'moderate', label: 'Moderado', desc: '3-4 días/semana de ejercicio' },
  { id: 'active', label: 'Activo', desc: '5-6 días/semana de ejercicio' },
  { id: 'very_active', label: 'Muy activo', desc: 'Atleta o trabajo físico intenso' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', email: '', age: '', weight_kg: '', height_cm: '',
    gender: 'male', activity_level: 'moderate', target_weight_kg: '',
  })

  const totalSteps = 5

  const update = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }))

  // Selección múltiple de objetivos: el primero elegido es el principal
  const toggleGoal = (id: string) => {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create/get user
      const userRes = await fetch(`${API}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email || 'demo@vitalcore.app', name: form.name || 'Usuario Demo', avatar_url: avatarUrl(form.name || 'usuario') }),
      })
      const user = await userRes.json()
      localStorage.setItem('vc_user', JSON.stringify(user))

      // Complete onboarding (el backend recibe el objetivo principal;
      // la lista completa de objetivos queda en el perfil local)
      await fetch(`${API}/api/onboarding/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(form.age), weight_kg: parseFloat(form.weight_kg),
          height_cm: parseFloat(form.height_cm), goal: goals[0] || 'maintain',
          activity_level: form.activity_level, gender: form.gender,
          target_weight_kg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        }),
      })

      saveLocalProfile()

      // Generate plans
      await fetch(`${API}/api/nutrition/generate/${user.id}`, { method: 'POST' })
      await fetch(`${API}/api/workout/generate/${user.id}`, { method: 'POST' })

      router.push('/dashboard')
    } catch (e) {
      // Demo fallback — navigate anyway
      localStorage.setItem('vc_user', JSON.stringify({ id: 1, name: form.name || 'Demo', email: form.email || 'demo@vitalcore.app', tier: 'free', is_admin: false, onboarding_done: true }))
      saveLocalProfile()
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Datos de origen disponibles para todas las páginas (dashboard, nutrición, entrenamiento)
  const saveLocalProfile = () => {
    try {
      localStorage.setItem('vc_profile', JSON.stringify({
        gender: form.gender,
        age: form.age ? parseInt(form.age) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        target_weight_kg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : null,
        activity_level: form.activity_level,
        goals,
        primary_goal: goals[0] || 'maintain',
        imc: imc ? parseFloat(imc) : null,
        tdee,
      }))
    } catch {}
  }

  const imc = form.weight_kg && form.height_cm
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }

  const tdee = form.weight_kg && form.height_cm && form.age
    ? Math.round((form.gender === 'male'
        ? 10 * parseFloat(form.weight_kg) + 6.25 * parseFloat(form.height_cm) - 5 * parseInt(form.age) + 5
        : 10 * parseFloat(form.weight_kg) + 6.25 * parseFloat(form.height_cm) - 5 * parseInt(form.age) - 161)
      * (activityMultipliers[form.activity_level] || 1.55))
    : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-100/70 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xl animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex flex-col items-center gap-1 group">
            <img
              src="/logo.png"
              alt="VitalCore Logo"
              className="w-16 h-16 object-contain rounded-2xl bg-slate-900 border border-slate-800 p-1 group-hover:scale-105 transition-all shadow-lg shadow-primary-500/20"
            />
            <div className="text-2xl font-black gradient-text">VitalCore</div>
          </Link>
          <p className="text-slate-400 text-xs mt-1">Tu plan personalizado en 2 minutos • 4321005-0 PROTOTIPOS Y CREATIVIDAD • Equipo 2</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Paso {step} de {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% completado</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="glass p-8">

          {/* Step 1 — Name & Email */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">¡Hola! ¿Cómo te llamas?</h2>
              <p className="text-slate-500 mb-6 text-sm">Empecemos por conocernos un poco</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Tu nombre</label>
                  <input className="input-dark" placeholder="Ej: Carlos" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Tu email</label>
                  <input className="input-dark" type="email" placeholder="tu@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Datos de origen */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">Datos de origen</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Género, edad, peso y estatura son la base para calcular tu IMC, tu gasto energético (TDEE)
                y personalizar cada plan. Puedes actualizarlos cuando quieras.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Edad</label>
                  <input className="input-dark" type="number" placeholder="25" value={form.age} onChange={e => update('age', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Género</label>
                  <select className="input-dark" value={form.gender} onChange={e => update('gender', e.target.value)}>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Peso actual (kg)</label>
                  <input className="input-dark" type="number" placeholder="70" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">Altura (cm)</label>
                  <input className="input-dark" type="number" placeholder="175" value={form.height_cm} onChange={e => update('height_cm', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-slate-600 mb-2 block">Peso objetivo (kg) <span className="text-slate-400 font-normal">— opcional</span></label>
                  <input className="input-dark" type="number" placeholder="Ej: 74" value={form.target_weight_kg} onChange={e => update('target_weight_kg', e.target.value)} />
                </div>
              </div>
              {(imc || tdee) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {imc && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl">
                      <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">IMC calculado</div>
                      <div className="font-bold text-primary-700 text-lg">{imc}</div>
                      <div className="text-xs text-slate-600">
                        {parseFloat(imc) < 18.5 ? 'Bajo peso' : parseFloat(imc) < 25 ? 'Peso normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidad'}
                      </div>
                    </div>
                  )}
                  {tdee && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl">
                      <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">TDEE estimado</div>
                      <div className="font-bold text-primary-700 text-lg">{tdee} kcal</div>
                      <div className="text-xs text-slate-600">Gasto energético diario</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Goals (multi-select) */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">¿Cuáles son tus objetivos?</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Elige <span className="font-semibold text-slate-700">uno o varios</span> — el primero que marques será tu objetivo principal
                y tu plan de entrenamiento y alimentación se adaptará a esta combinación.
              </p>
              <div className="space-y-3">
                {GOALS.map(g => {
                  const selected = goals.includes(g.id)
                  const isPrimary = goals[0] === g.id
                  return (
                    <button key={g.id} onClick={() => toggleGoal(g.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${selected ? 'border-primary-400 bg-primary-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                      <g.icon className="w-6 h-6 text-primary-600" />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {g.label}
                          {isPrimary && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary-600 text-white tracking-wider">Principal</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{g.desc}</div>
                      </div>
                      {selected && <Check className="w-4 h-4 text-primary-700 ml-auto" />}
                    </button>
                  )
                })}
              </div>
              {goals.length > 1 && (
                <p className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  Objetivos secundarios seleccionados: el algoritmo ajusta calorías y volumen según el principal
                  y complementa la rutina con bloques para los demás.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Activity */}
          {step === 4 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">¿Qué tan activo eres?</h2>
              <p className="text-slate-500 mb-6 text-sm">Para calcular tus calorías de mantenimiento</p>
              <div className="space-y-3">
                {ACTIVITY_LEVELS.map(a => (
                  <button key={a.id} onClick={() => update('activity_level', a.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${form.activity_level === a.id ? 'border-primary-400 bg-primary-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                    <div>
                      <div className="font-semibold">{a.label}</div>
                      <div className="text-xs text-slate-400">{a.desc}</div>
                    </div>
                    {form.activity_level === a.id && <Check className="w-5 h-5 text-primary-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Summary */}
          {step === 5 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2">Tu perfil está listo</h2>
              <p className="text-slate-500 mb-6 text-sm">Vamos a generar tu plan personalizado</p>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Nombre', value: form.name || '—' },
                  { label: 'Género / Edad', value: `${form.gender === 'male' ? 'Masculino' : form.gender === 'female' ? 'Femenino' : 'Otro'} · ${form.age || '—'} años` },
                  { label: 'Peso / Estatura', value: `${form.weight_kg || '—'} kg · ${form.height_cm || '—'} cm` },
                  { label: 'Objetivo principal', value: GOALS.find(g => g.id === goals[0])?.label || '—' },
                  { label: 'Objetivos secundarios', value: goals.slice(1).map(id => GOALS.find(g => g.id === id)?.label).filter(Boolean).join(', ') || 'Ninguno' },
                  { label: 'Peso objetivo', value: form.target_weight_kg ? `${form.target_weight_kg} kg` : 'No definido' },
                  { label: 'IMC', value: imc || '—' },
                  { label: 'TDEE (calorías base)', value: tdee ? `${tdee} kcal/día` : '—' },
                  { label: 'Nivel de actividad', value: ACTIVITY_LEVELS.find(a => a.id === form.activity_level)?.label || '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 text-sm">{item.label}</span>
                    <span className="font-semibold text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700">
                <span className="inline-flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  La IA generará tu plan nutricional de 30 días y rutina de entrenamiento de 4 semanas de inmediato.
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1">
                ← Anterior
              </button>
            )}
            {step < totalSteps ? (
              <button onClick={() => setStep(s => s + 1)}
                disabled={(step === 1 && !form.name) || (step === 3 && goals.length === 0)}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando tu plan...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Crear mi plan
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Ya tienes cuenta? <a href="/login" className="text-primary-700 hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}
