'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Salad, Dumbbell, Flower2, Users, BarChart3, Gem, ArrowRight, Star, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { avatarUrl } from '@/lib/avatar'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=80'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const features = [
    { icon: Salad, title: 'Nutrición de precisión con IA', desc: 'Plan mensual personalizado con macros exactos y recalculador adaptativo' },
    { icon: Dumbbell, title: 'Entrenamiento periodizado', desc: 'Rutinas estructuradas en 4 semanas con progresión y temporizador de descanso' },
    { icon: Flower2, title: 'Meditación guiada por voz', desc: 'Narración nativa en español y visualizador de ritmo respiratorio anti-cortisol' },
    { icon: Users, title: 'Comunidad & masterminds', desc: 'Eventos en vivo, canales temáticos y networking con especialistas en salud' },
    { icon: BarChart3, title: 'Dashboard & seguimiento', desc: 'Registro biométrico en tiempo real de calorías, peso y racha diaria' },
    { icon: Gem, title: 'Membresías flexibles', desc: 'Acceso escalonado en 3 planes: Inicial ($25), Premium ($35) y Pro ($50 USD)' },
  ]

  const testimonials = [
    { name: 'Camila Rojas', role: 'Miembro Premium · 4 meses', gender: 'female' as const, quote: 'Bajé 6 kilos sin pasar hambre. El plan de comidas se ajusta solo cuando registro mi progreso.' },
    { name: 'Diego Fuentes', role: 'Miembro Pro · 7 meses', gender: 'male' as const, quote: 'Las rutinas por mesociclos me sacaron de un estancamiento de meses. La comunidad ayuda a no bajar los brazos.' },
    { name: 'Valentina Soto', role: 'Miembro Inicial · 2 meses', gender: 'female' as const, quote: 'Las meditaciones guiadas se volvieron parte de mi rutina de sueño. Simple, directo y en español.' },
  ]

  const founders = [
    { name: 'Sebastian Posada Posada', role: 'CEO & Co-Fundador', email: 'sposada2026@udec.cl', gender: 'male' as const },
    { name: 'Andres Gonzalo Burboa Lizama', role: 'CTO & Co-Fundador', email: 'andresburboa@udec.cl', gender: 'male' as const },
    { name: 'Catalina Antonia Vergara Donoso', role: 'Chief Health Officer & Co-Fundadora', email: 'cavergara2019@udec.cl', gender: 'female' as const },
    { name: 'Fabian Alonso Alvarado Arriagada', role: 'Head of AI & Co-Fundador', email: 'falvarado2016@udec.cl', gender: 'male' as const },
    { name: 'Marian Garcia Cruz', role: 'Head of Product & Co-Fundadora', email: 'margarcia2026@udec.cl', gender: 'female' as const },
    { name: 'Yenny Sanchez Aguilar', role: 'COO & Co-Fundador', email: 'yesanchez2026@udec.cl', gender: 'male' as const },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="VitalCore" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-bold gradient-text">VitalCore</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
            <img src="/logo_udec.png" alt="UdeC" className="h-6 object-contain opacity-90" />
            <span className="text-[10px] text-slate-500 font-medium">4321005-0 PROTOTIPOS Y CREATIVIDAD • Equipo 2</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <Link href="/pricing" className="hover:text-slate-900 transition-colors">Precios</Link>
          <Link href="/community" className="hover:text-slate-900 transition-colors">Comunidad</Link>
          <Link href="#equipo" className="hover:text-slate-900 transition-colors">Equipo</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-xs py-2 px-4">Iniciar sesión</Link>
          <Link href="/onboarding" className="btn-primary text-xs py-2 px-4">Comenzar gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-primary-100/70 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center animate-fade-in">
          {/* Left: copy */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Institutional Tag */}
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-700 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-700" />
              <span>Incubado en la Universidad de Concepción</span>
            </div>

            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-tight tracking-tight">
              Salud, nutrición y <br />
              <span className="gradient-text">longevidad con IA</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Un plan de nutrición y entrenamiento que se adapta a ti cada semana, meditaciones guiadas por voz
              y una comunidad activa. Todo en una sola plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/onboarding" className="btn-primary text-base py-4 px-8 inline-flex items-center justify-center gap-2 shadow-xl shadow-primary-500/25">
                Crear mi plan en 2 minutos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-ghost text-base py-4 px-8 inline-flex items-center justify-center gap-2">
                Ver la plataforma en vivo
              </Link>
            </div>

            {/* Pricing quick pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>Membresías desde</span>
              <span className="text-slate-900 font-bold">$25 USD/mes</span>
              <span>·</span>
              <span className="text-sky-700 font-bold">$35 USD/mes Premium</span>
              <span>·</span>
              <span className="text-amber-600 font-bold">$50 USD/mes Pro</span>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={HERO_IMAGE}
                alt="Persona entrenando con seguimiento de VitalCore"
                className="w-full h-[420px] lg:h-[520px] object-cover"
                loading="eager"
              />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-4 sm:left-6 lg:-left-8 bg-white border border-slate-200 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-700" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">+12.500 planes generados</div>
                <div className="text-[11px] text-slate-500">Nutrición, entrenamiento y meditación</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black">
              Todo lo que necesitas para <span className="gradient-text">cambiar de hábitos</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">Una arquitectura pensada para transformar tu composición corporal y sostener tu bienestar mental día a día.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card p-6 hover:border-primary-300 transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social proof / testimonials */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black">
              Resultados que la comunidad <span className="gradient-text">ya está viviendo</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">Historias reales de miembros que llevan su plan al día dentro de VitalCore.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6 space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <img src={avatarUrl(t.name, t.gender)} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPO FUNDADOR (EQUIPO 2) & INVESTOR ──────────────────────────────── */}
      <section id="equipo" className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              <Users className="w-3.5 h-3.5" /> EQUIPO 2 — 4321005-0 PROTOTIPOS Y CREATIVIDAD
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Equipo fundador & <span className="gradient-text">respaldo institucional</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Proyecto y prototipo funcional desarrollado por el Equipo 2 para el curso <strong>4321005-0 Prototipos y Creatividad</strong> de la Universidad de Concepción.
            </p>
          </div>

          {/* Financiador / Investor Highlight Banner */}
          <div className="p-8 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <img
              src={avatarUrl('Martin Mellado', 'male')}
              alt="Prof. Martín Mellado"
              className="w-20 h-20 rounded-2xl object-cover border border-amber-200"
            />
            <div className="space-y-1 text-center md:text-left flex-1">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600">Financiador principal & mentor estratégico</div>
              <h3 className="text-2xl font-black text-slate-900">Prof. Martín Mellado</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Cátedra 4321005-0 Prototipos y Creatividad, Universidad de Concepción. Inversionista ángel y sponsor estratégico de la arquitectura tecnológica y el modelo de negocio de VitalCore.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <img src="/logo_udec.png" alt="UdeC" className="h-8 object-contain" />
              <span className="text-xs font-bold text-slate-700">Patrocinio UdeC</span>
            </div>
          </div>

          {/* 6 Founders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {founders.map((founder, idx) => (
              <div key={idx} className="card p-5 flex items-center gap-4 hover:border-primary-300 transition-all">
                <img
                  src={avatarUrl(founder.name, founder.gender)}
                  alt={founder.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{founder.name}</h4>
                  <div className="text-xs font-semibold text-primary-700 mt-0.5">{founder.role}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">{founder.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <div className="card p-12 rounded-3xl space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
            <Sparkles className="w-3.5 h-3.5" /> Empieza hoy
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">¿Listo para transformar tu salud?</h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto">
            Únete a la comunidad de VitalCore. Tu plan mensual adaptativo de nutrición, entrenamiento y meditación te espera.
          </p>
          <Link href="/onboarding" className="btn-primary text-base py-4 px-10 inline-flex items-center gap-2 shadow-xl shadow-primary-500/30">
            Crear mi plan de salud integral
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 text-center text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="VitalCore" className="h-5 w-5 object-contain" />
          <span className="font-bold text-slate-900 text-sm">VitalCore</span>
          <span>•</span>
          <img src="/logo_udec.png" alt="UdeC" className="h-5 object-contain opacity-80" />
          <span>4321005-0 PROTOTIPOS Y CREATIVIDAD — Universidad de Concepción</span>
        </div>
        <p>© 2026 VitalCore — Creado por Equipo 2 (Sebastian Posada, Andres Burboa, Catalina Vergara, Fabian Alvarado, Marian Garcia, Yenny Sanchez). Financiado por Prof. Martín Mellado.</p>
      </footer>
    </div>
  )
}
