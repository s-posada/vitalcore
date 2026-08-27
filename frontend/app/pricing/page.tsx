'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import {
  Gem, Star, Crown, Check, PartyPopper, AlertTriangle, Salad, Dumbbell,
  BarChart3, Users, Ticket, Droplet, Sparkles, Bot, Mic, Leaf, Timer,
  Rocket, Dna, Zap, Award, TrendingUp
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada', tier: 'pro' }
    setUser(currentUser)
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleSelectPlan = async (tierName: string) => {
    if (!user) return
    setLoadingTier(tierName)
    try {
      const res = await fetch(`${API}/api/users/${user.id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierName, days_to_add: 30 })
      })
      if (res.ok) {
        const data = await res.json()
        const updatedUser = {
          ...user,
          tier: data.new_tier,
          days_left: data.days_left,
          tier_price_usd: data.tier_price_usd
        }
        localStorage.setItem('vc_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        showToast(`¡Plan ${tierName.toUpperCase()} ($${data.tier_price_usd} USD) activado con 30 días de vigencia!`)
      }
    } catch (e) {
      showToast('Error al procesar suscripción')
    } finally {
      setLoadingTier(null)
    }
  }

  const plans = [
    {
      id: 'inicial',
      name: 'Plan Inicial',
      price: '25',
      period: 'USD / mes',
      badge: 'Básico Esencial',
      desc: 'Ideal para quienes inician su transformación física y desean ordenar sus hábitos alimenticios.',
      color: 'emerald',
      features: [
        { icon: Salad, text: 'Plan Nutricional personalizado de 30 días' },
        { icon: Dumbbell, text: 'Rutina de entrenamiento básica estructurada' },
        { icon: BarChart3, text: 'Dashboard de seguimiento calórico y racha' },
        { icon: Users, text: 'Acceso a grupos comunitarios generales' },
        { icon: Ticket, text: 'Acceso a 1 Masterclass mensual en vivo' },
        { icon: Droplet, text: 'Registro diario de hidratación y peso' }
      ],
      cta: 'Elegir Plan Inicial'
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      price: '35',
      period: 'USD / mes',
      badge: 'MÁS POPULAR',
      desc: 'Para quienes buscan recomposición corporal acelerada, rutinas por mesociclos y salud mental.',
      color: 'sky',
      highlighted: true,
      features: [
        { icon: Sparkles, text: 'Todo lo incluido en el Plan Inicial' },
        { icon: Bot, text: 'Algoritmo de IA Adaptativo con recalculador de macros' },
        { icon: Dumbbell, text: 'Mesociclo de 4 semanas de Hipertrofia & Fuerza' },
        { icon: Leaf, text: 'Catálogo completo de Meditaciones Guiadas por Voz' },
        { icon: Mic, text: 'Acceso semanal a Talleres y Sesiones de Respiración en Vivo' },
        { icon: Leaf, text: 'Grupos de Nutrición Avanzada & Meal Prep' },
        { icon: Timer, text: 'Temporizador interactivo de descanso entre series' }
      ],
      cta: 'Mejorar a Premium'
    },
    {
      id: 'pro',
      name: 'Plan Pro Mastermind',
      price: '50',
      period: 'USD / mes',
      badge: 'MÁXIMO RENDIMIENTO',
      desc: 'La experiencia definitiva: Biohacking, telemetría de longevidad y acceso VIP directo a especialistas.',
      color: 'amber',
      features: [
        { icon: Crown, text: 'Todo lo incluido en el Plan Premium' },
        { icon: Rocket, text: 'Mastermind VIP exclusivo con Dr. Alarcón y directores' },
        { icon: Dna, text: 'Protocolos avanzados de Longevidad celular y Wim Hof' },
        { icon: Mic, text: 'Acceso total e ilimitado a todas las salas y Q&A en vivo' },
        { icon: Zap, text: 'Soporte prioritario 24/7 y comunidad cerrada de alto rendimiento' },
        { icon: Award, text: 'Insignia Dorada VIP en Feed y perfil de usuario' },
        { icon: TrendingUp, text: 'Análisis predictivo de composición corporal con IA' }
      ],
      cta: 'Desbloquear Acceso Pro VIP'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          {toastMsg.startsWith('Error') ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <PartyPopper className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
            <Gem className="w-4 h-4" /> MEMBRESÍAS MENSUALES RECURRENTES
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
            Invierte en tu <span className="gradient-text">Salud, Cuerpo & Mente</span>
          </h1>
          <p className="text-base text-slate-600">
            Elige el plan que mejor se adapte a tus metas. Cancela o cambia de nivel en cualquier momento con 1 solo clic.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => {
            const isCurrent = user?.tier === p.id

            return (
              <div
                key={p.id}
                className={`card p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  p.highlighted
                    ? 'border-sky-300 ring-2 ring-sky-500/20 shadow-xl shadow-sky-100 lg:scale-105 z-10'
                    : p.id === 'pro'
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50/60 to-white'
                    : 'hover:border-primary-300'
                }`}
              >
                {/* Badge top */}
                {p.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1 ${
                      p.highlighted
                        ? 'bg-sky-600'
                        : p.id === 'pro'
                        ? 'bg-amber-500'
                        : 'bg-primary-600'
                    }`}
                  >
                    {p.badge}
                    {p.highlighted && <Star className="w-3 h-3" />}
                    {p.id === 'pro' && <Crown className="w-3 h-3" />}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                        TU PLAN ACTUAL
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">{p.desc}</p>

                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-200">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900">${p.price}</span>
                    <span className="text-xs text-slate-400">{p.period}</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-snug">
                        <f.icon
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            p.highlighted
                              ? 'text-sky-600'
                              : p.id === 'pro'
                              ? 'text-amber-500'
                              : 'text-primary-600'
                          }`}
                        />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => handleSelectPlan(p.id)}
                    disabled={loadingTier === p.id}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : p.highlighted
                        ? 'btn-primary shadow-lg shadow-primary-500/30'
                        : p.id === 'pro'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg shadow-amber-200'
                        : 'btn-ghost'
                    }`}
                  >
                    {loadingTier === p.id ? (
                      'Procesando...'
                    ) : isCurrent ? (
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> Plan Activo ({user?.days_left || 28} días restantes)
                      </span>
                    ) : (
                      `${p.cta} ($${p.price} USD)`
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="glass p-8 rounded-3xl space-y-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 text-center">Preguntas Frecuentes sobre las Membresías</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">¿Cómo se contabilizan los días de suscripción?</h3>
              <p>Cada pago renueva automáticamente 30 días de acceso. Puedes ver tu contador en tiempo real en la barra superior y en tu Dashboard.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p>Sí, al hacer upgrade tus beneficios se activan instantáneamente y se extienden tus días de vigencia de forma inmediata.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">¿Qué incluye el acceso a los eventos en vivo?</h3>
              <p>Transmisiones directas en Google Meet con médicos, nutricionistas y entrenadores, donde puedes interactuar y resolver dudas.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">¿Los planes nutricionales se adaptan a mis alergias o dietas?</h3>
              <p>Totalmente. El algoritmo de VitalCore ajusta las fuentes proteicas y los macros según tus objetivos corporales.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
