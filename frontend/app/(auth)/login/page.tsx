'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, Gem, Crown, PartyPopper } from 'lucide-react'
import { avatarUrl } from '@/lib/avatar'
import { API_BASE_URL as API } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [showDemoAccess, setShowDemoAccess] = useState(false)

  const TEAM_FOUNDERS = [
    { name: 'Sebastian Posada Posada', email: 'sposada2026@udec.cl', role: 'CEO & Co-Fundador', gender: 'male' as const },
    { name: 'Andres Gonzalo Burboa Lizama', email: 'andresburboa@udec.cl', role: 'CTO & Co-Fundador', gender: 'male' as const },
    { name: 'Catalina Antonia Vergara Donoso', email: 'cavergara2019@udec.cl', role: 'Chief Health Officer & Co-Fundadora', gender: 'female' as const },
    { name: 'Fabian Alonso Alvarado Arriagada', email: 'falvarado2016@udec.cl', role: 'Head of AI & Co-Fundador', gender: 'male' as const },
    { name: 'Marian Garcia Cruz', email: 'margarcia2026@udec.cl', role: 'Head of Product & Co-Fundadora', gender: 'female' as const },
    { name: 'Yenny Sanchez Aguilar', email: 'yesanchez2026@udec.cl', role: 'COO & Co-Fundador', gender: 'male' as const },
  ]

  const INVESTOR = {
    name: 'Prof. Martín Mellado',
    email: 'martin.mellado@udec.cl',
    role: 'Inversionista Ángel & Financiador',
    gender: 'male' as const,
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleLogin = async (userEmail: string, userName: string, tier = 'pro') => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          avatar_url: avatarUrl(userName),
          tier: tier
        })
      })
      if (!res.ok) throw new Error('El servicio de acceso no está disponible')
      const user = await res.json()
      localStorage.setItem('vc_user', JSON.stringify(user))
      showToast(`¡Bienvenido ${user.name}! Redirigiendo...`)
      setTimeout(() => router.push('/dashboard'), 600)
    } catch {
      showToast('No pudimos iniciar la sesión. Verifica que la API esté disponible.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuidedDemo = () => {
    handleLogin('sposada2026@udec.cl', 'Sebastian Posada Posada', 'pro')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-100/70 rounded-full blur-[120px] pointer-events-none" />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          <PartyPopper className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative w-full max-w-lg space-y-6">
        {/* Brand with UdeC logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <img
              src="/logo.png"
              alt="VitalCore Logo"
              className="w-20 h-20 object-contain rounded-2xl bg-slate-900 border border-slate-800 p-1 group-hover:scale-105 transition-all shadow-xl shadow-primary-500/20"
            />
            <span className="text-2xl font-black gradient-text">VitalCore</span>
          </Link>
          <p className="text-slate-500 text-xs">Inicia sesión y continúa tu plan de bienestar</p>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl space-y-5 border border-slate-200 shadow-2xl">
          {/* Guided demo access */}
          <button
            onClick={handleGuidedDemo}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white text-black border border-slate-300 shadow-sm font-bold text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all hover:scale-[1.01] disabled:opacity-60"
          >
            <PartyPopper className="w-4 h-4 text-primary-600" />
            <span>Entrar a la demo guiada</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>o con tu correo</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Custom form */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Daniel Gómez"
                className="input-dark text-xs py-2.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="input-dark text-xs py-2.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={() => handleLogin(email, name, 'inicial')}
              disabled={loading || !email.trim() || !name.trim()}
              className="w-full btn-primary py-2.5 text-xs font-bold text-center disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar con este correo'}
            </button>
          </div>

          {/* Demo access — tucked away, not the primary flow */}
          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={() => setShowDemoAccess((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              <span>Acceso de demostración (equipo & financiador)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoAccess ? 'rotate-180' : ''}`} />
            </button>

            {showDemoAccess && (
              <div className="space-y-3 pt-1 animate-slide-up">
                <button
                  onClick={() => handleLogin(INVESTOR.email, INVESTOR.name, 'pro')}
                  className="w-full text-left p-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2.5 text-xs"
                >
                  <img src={avatarUrl(INVESTOR.name, INVESTOR.gender)} alt={INVESTOR.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                      <Gem className="w-3 h-3 text-amber-500 shrink-0" /> {INVESTOR.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{INVESTOR.role}</div>
                  </div>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEAM_FOUNDERS.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleLogin(f.email, f.name, 'pro')}
                      className="text-left p-2 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-xs flex items-center gap-2"
                    >
                      <img src={avatarUrl(f.name, f.gender)} alt={f.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" /> {f.name.split(' ')[0]} {f.name.split(' ')[1]}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{f.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          ¿Nuevo en VitalCore? <Link href="/onboarding" className="text-primary-700 hover:underline">Configura tu plan inicial →</Link>
        </p>
      </div>
    </div>
  )
}
