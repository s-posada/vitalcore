'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Salad, Zap, Loader2, Sparkles, AlertTriangle, Sunrise, Drumstick, Fish, Apple, Coffee, Leaf, Moon, Droplet, Microscope, Check } from 'lucide-react'
import { API_BASE_URL as API } from '@/lib/api'

export default function NutritionPage() {
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [selectedDay, setSelectedDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({})
  const [toastMsg, setToastMsg] = useState('')
  const [activeGoal, setActiveGoal] = useState('gain_muscle')

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada' }
    setUser(currentUser)
    // El objetivo principal declarado en los datos de origen preselecciona el plan
    try {
      const savedProfile = localStorage.getItem('vc_profile')
      if (savedProfile) {
        const p = JSON.parse(savedProfile)
        if (p?.primary_goal) setActiveGoal(p.primary_goal)
      }
    } catch {}
    loadNutrition(currentUser.id)
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadNutrition = async (userId: number) => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/nutrition/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        // El objetivo local (datos de origen) tiene prioridad sobre el del plan guardado
        let hasLocalGoal = false
        try { hasLocalGoal = !!JSON.parse(localStorage.getItem('vc_profile') || 'null')?.primary_goal } catch {}
        if (!hasLocalGoal) setActiveGoal(data.goal || 'gain_muscle')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!user) return
    setGenerating(true)
    try {
      // First update profile goal if modified
      await fetch(`${API}/api/onboarding/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: activeGoal })
      })

      const res = await fetch(`${API}/api/nutrition/generate/${user.id}`, {
        method: 'POST'
      })
      if (res.ok) {
        showToast('¡Plan Nutricional Inteligente de 30 días recalculado con éxito!')
        loadNutrition(user.id)
      }
    } catch (e) {
      showToast('Error al generar nuevo plan')
    } finally {
      setGenerating(false)
    }
  }

  const toggleMeal = (mealKey: string) => {
    setCheckedMeals(prev => ({ ...prev, [mealKey]: !prev[mealKey] }))
  }

  const currentDayData = plan?.days?.find((d: any) => d.day === selectedDay) || plan?.days?.[0]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          {toastMsg.toLowerCase().includes('error') ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl glow-green">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <Salad className="w-4 h-4" /> PROTOCOLO NUTRICIONAL ADAPTATIVO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Plan de Alimentación & <span className="gradient-text">Macronutrientes</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Calculado en base a tu gasto energético total, objetivo fisiológico y tasa metabólica basal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeGoal}
              onChange={(e) => setActiveGoal(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-500"
            >
              <option value="gain_muscle">Aumento Masa Muscular (+450 kcal)</option>
              <option value="lose_fat">Déficit & Pérdida de Grasa (-450 kcal)</option>
              <option value="maintain">Mantenimiento Recomposición</option>
              <option value="improve_endurance">Rendimiento & Resistencia</option>
            </select>

            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 whitespace-nowrap"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recalculando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> <span className="font-semibold">Regenerar con IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Macro Targets Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-xs text-slate-500 font-semibold mb-1">CALORÍAS DIARIAS</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {plan?.daily_calories || 2450} <span className="text-xs text-slate-400 font-normal">kcal</span>
            </div>
            <div className="text-[10px] text-primary-700 mt-1">Superávit controlado</div>
          </div>

          <div className="card text-center">
            <div className="text-xs text-sky-700 font-semibold mb-1">PROTEÍNA</div>
            <div className="text-2xl sm:text-3xl font-black text-sky-700">
              {plan?.protein_g || 170} <span className="text-xs text-slate-400 font-normal">g / día</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">~2.2g por kg de peso</div>
          </div>

          <div className="card text-center">
            <div className="text-xs text-amber-600 font-semibold mb-1">CARBOHIDRATOS</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {plan?.carbs_g || 260} <span className="text-xs text-slate-400 font-normal">g / día</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Energía glucolítica</div>
          </div>

          <div className="card text-center">
            <div className="text-xs text-red-600 font-semibold mb-1">GRASAS SALUDABLES</div>
            <div className="text-2xl sm:text-3xl font-black text-red-600">
              {plan?.fat_g || 65} <span className="text-xs text-slate-400 font-normal">g / día</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Salud hormonal & celular</div>
          </div>
        </div>

        {/* 30-Day Selector Strip */}
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>SELECCIONA EL DÍA DEL MES (1 AL 30)</span>
            <span className="text-primary-700">Día {selectedDay} seleccionado</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`min-w-[42px] h-11 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  selectedDay === d
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-200'
                }`}
              >
                <span className="text-[9px] opacity-70">DÍA</span>
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Breakfast */}
          <div className={`card transition-all ${checkedMeals[`d${selectedDay}_b`] ? 'border-primary-300 bg-primary-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Sunrise className="w-7 h-7 text-amber-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Comida 1 • Mañana</span>
                  <h3 className="text-base font-bold text-slate-900">Desayuno Anabólico</h3>
                </div>
              </div>
              <button
                onClick={() => toggleMeal(`d${selectedDay}_b`)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${
                  checkedMeals[`d${selectedDay}_b`]
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 text-slate-300 hover:border-primary-400'
                }`}
              >
                {checkedMeals[`d${selectedDay}_b`] ? <Check className="w-4 h-4" /> : ''}
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {currentDayData?.breakfast || 'Avena integral con proteína isolate, arándanos y semillas de chía (440 kcal)'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" /> Absorción sostenida</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3" /> Acompañar con café negro o infusión sin azúcar</span>
            </div>
          </div>

          {/* Lunch */}
          <div className={`card transition-all ${checkedMeals[`d${selectedDay}_l`] ? 'border-primary-300 bg-primary-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Drumstick className="w-7 h-7 text-sky-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-700 tracking-wider">Comida 2 • Mediodía</span>
                  <h3 className="text-base font-bold text-slate-900">Almuerzo Principal</h3>
                </div>
              </div>
              <button
                onClick={() => toggleMeal(`d${selectedDay}_l`)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${
                  checkedMeals[`d${selectedDay}_l`]
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 text-slate-300 hover:border-primary-400'
                }`}
              >
                {checkedMeals[`d${selectedDay}_l`] ? <Check className="w-4 h-4" /> : ''}
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {currentDayData?.lunch || 'Pechuga de pollo a la plancha con quinoa real, palta y ensalada arcoíris (580 kcal)'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Leaf className="w-3 h-3" /> Grasas monoinsaturadas</span>
              <span>•</span>
              <span>Sal marina y limón natural</span>
            </div>
          </div>

          {/* Dinner */}
          <div className={`card transition-all ${checkedMeals[`d${selectedDay}_d`] ? 'border-primary-300 bg-primary-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Fish className="w-7 h-7 text-emerald-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Comida 3 • Noche</span>
                  <h3 className="text-base font-bold text-slate-900">Cena de Recuperación</h3>
                </div>
              </div>
              <button
                onClick={() => toggleMeal(`d${selectedDay}_d`)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${
                  checkedMeals[`d${selectedDay}_d`]
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 text-slate-300 hover:border-primary-400'
                }`}
              >
                {checkedMeals[`d${selectedDay}_d`] ? <Check className="w-4 h-4" /> : ''}
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {currentDayData?.dinner || 'Merluza austral al vapor con puré de zapallo camote y aceite de oliva (420 kcal)'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Moon className="w-3 h-3" /> Fácil digestión</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Moon className="w-3 h-3" /> No interrumpe el ciclo circadiano de sueño</span>
            </div>
          </div>

          {/* Snack / Pre-workout */}
          <div className={`card transition-all ${checkedMeals[`d${selectedDay}_s`] ? 'border-primary-300 bg-primary-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Apple className="w-7 h-7 text-primary-600" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Comida 4 • Snack / Post-Entreno</span>
                  <h3 className="text-base font-bold text-slate-900">Snack Nutricional</h3>
                </div>
              </div>
              <button
                onClick={() => toggleMeal(`d${selectedDay}_s`)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${
                  checkedMeals[`d${selectedDay}_s`]
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-slate-300 text-slate-300 hover:border-primary-400'
                }`}
              >
                {checkedMeals[`d${selectedDay}_s`] ? <Check className="w-4 h-4" /> : ''}
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {currentDayData?.snack || 'Mix de nueces y almendras 30g + 1 manzana verde (210 kcal)'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Droplet className="w-3 h-3" /> Tomar con 500ml de agua</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" /> Reposición rápida de glucógeno</span>
            </div>
          </div>
        </div>

        {/* Nutritional Guidance Card */}
        <div className="glass p-6 rounded-3xl space-y-3 border border-primary-200">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Microscope className="w-4 h-4" /> Principios de Longevidad & Salud Digestiva en VitalCore
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="font-bold text-primary-700 mb-1">1. Ventana de Ayuno de 12-14h</div>
              <p>Permite la autofagia celular nocturna y descanso completo de la mucosa gástrica.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="font-bold text-primary-700 mb-1">2. Hidratación Mineralizada</div>
              <p>Consume al menos 35ml de agua por kg de peso, idealmente con una pizca de sal marina.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="font-bold text-primary-700 mb-1">3. Proteína Distribuida</div>
              <p>Mínimo 30g de proteína por comida principal para maximizar la síntesis proteica muscular.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
