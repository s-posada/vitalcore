'use client'
import React from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  BookOpen, Check, CheckCircle2, Star, ClipboardList, Target, Users, Dumbbell,
  Salad, Flower2, Gem, ShieldCheck, BarChart3, ArrowRight
} from 'lucide-react'

// ── Historias del usuario (rúbrica T01: enunciado en 1ª persona + condiciones
//    de logro claras asociadas a componentes específicos) ─────────────────────
const STORIES = [
  {
    id: 'H1',
    priority: 1,
    title: 'Datos de origen y plan personalizado',
    statement: 'Como usuario nuevo, quiero ingresar mis datos de origen (género, edad, peso, estatura, nivel de actividad y peso objetivo) y elegir uno o varios objetivos, para que la plataforma genere un plan de nutrición y entrenamiento hecho a mi medida.',
    conditions: [
      'El asistente de 5 pasos captura nombre, email, género, edad, peso, estatura, peso objetivo, nivel de actividad y objetivos (selección múltiple, con objetivo principal).',
      'El IMC y el TDEE se calculan y muestran en pantalla en tiempo real (fórmula Mifflin-St Jeor).',
      'Al finalizar se generan automáticamente un plan nutricional de 30 días y una rutina de 4 semanas vía API.',
    ],
    components: ['Onboarding (5 pasos)', 'POST /api/onboarding', 'POST /api/nutrition/generate', 'POST /api/workout/generate'],
    icon: Target,
    reason: 'Importancia: es la puerta de entrada de todo usuario y alimenta al resto de los módulos. Sin datos de origen no hay personalización.',
  },
  {
    id: 'H2',
    priority: 2,
    title: 'Rutina semanal con seguimiento',
    statement: 'Como usuario, quiero ver mi rutina de entrenamiento organizada por semanas y días, con series, repeticiones y descansos, y poder marcar cada ejercicio completado, para seguir mi progresión sin planillas externas.',
    conditions: [
      'Mesociclo de 4 semanas con 6 días estructurados y ejercicios con series/reps/descanso/notas técnicas.',
      'Cada ejercicio se puede marcar como completado y el avance persiste al navegar (localStorage).',
      'Temporizador de descanso funcional por ejercicio con widget flotante.',
      'Panel de progreso: adherencia semanal, volumen de series, racha y proyección de peso a 4 semanas según objetivo.',
    ],
    components: ['/workout', 'GET /api/workout/{id}', 'GET /api/stats/{id}', 'Temporizador + persistencia local'],
    icon: Dumbbell,
    reason: 'Velocidad + importancia: es el módulo de uso diario con mayor frecuencia de interacción; demuestra funcionalidad completa end-to-end.',
  },
  {
    id: 'H3',
    priority: 3,
    title: 'Registro diario y telemetría',
    statement: 'Como usuario, quiero registrar cada día mis calorías, macronutrientes, peso, agua y hábitos, para visualizar mi evolución y que el plan se recalibre con datos reales.',
    conditions: [
      'Formulario de registro rápido en el Dashboard con calorías, proteína, carbohidratos, grasas, peso, agua, entrenamiento y meditación.',
      'El registro se guarda vía API y las métricas (racha, promedio semanal, evolución de peso 14 días) se actualizan al instante.',
      'Barras de macros muestran el % de avance contra los targets del plan activo.',
    ],
    components: ['/dashboard', 'POST /api/logs/{id}', 'GET /api/stats/{id}', 'Gráfico de evolución de peso'],
    icon: BarChart3,
    reason: 'Complejidad controlada: cierra el ciclo dato → análisis → ajuste, que es la propuesta de valor central de VitalCore.',
  },
  {
    id: 'H4',
    title: 'Plan de alimentación de 30 días',
    statement: 'Como usuario, quiero un menú diario (desayuno, almuerzo, cena y snack) adaptado a mi objetivo y poder regenerarlo si cambio de meta, para no tener que diseñar mi dieta manualmente.',
    conditions: [
      'Selector de 30 días con menú completo por día y checklist de comidas.',
      'Targets de calorías y macros visibles; al cambiar el objetivo se recalculan (superávit/déficit de ±450 kcal).',
    ],
    components: ['/nutrition', 'GET /api/nutrition/{id}', 'POST /api/nutrition/generate/{id}'],
    icon: Salad,
  },
  {
    id: 'H5',
    title: 'Meditación guiada por voz',
    statement: 'Como usuario, quiero reproducir meditaciones guiadas con narración por voz en español y una guía visual de respiración, para reducir mi estrés sin salir de la plataforma.',
    conditions: [
      'Catálogo filtrable por categoría; narración TTS nativa del navegador en español.',
      'Visualizador de respiración rítmica y registro de sesión completada en la racha.',
    ],
    components: ['/meditation', 'Web Speech API', 'POST /api/meditations/{id}/complete'],
    icon: Flower2,
  },
  {
    id: 'H6',
    title: 'Comunidad, eventos y feed',
    statement: 'Como usuario, quiero reservar cupo en eventos en vivo, unirme a grupos según mi membresía y publicar en el feed, para mantenerme motivado con el apoyo de la comunidad.',
    conditions: [
      'RSVP funcional con control de acceso por nivel de membresía (Inicial/Premium/Pro).',
      'Feed con publicaciones, likes y comentarios persistidos en el backend.',
    ],
    components: ['/community', 'API de eventos/grupos/posts', 'Gating por tier'],
    icon: Users,
  },
  {
    id: 'H7',
    title: 'Membresías y upgrade',
    statement: 'Como usuario, quiero comparar los 3 planes de membresía y hacer upgrade con un clic, para acceder a más beneficios cuando lo necesite.',
    conditions: [
      'Tabla comparativa de planes Inicial ($25), Premium ($35) y Pro ($50 USD).',
      'El upgrade actualiza el tier y extiende 30 días de vigencia, reflejado en toda la app.',
    ],
    components: ['/pricing', 'POST /api/users/{id}/upgrade'],
    icon: Gem,
  },
  {
    id: 'H8',
    title: 'Administración de la plataforma',
    statement: 'Como administrador, quiero ver métricas de negocio (MRR, usuarios, distribución de planes) y gestionar tiers y permisos, para operar la plataforma con datos reales.',
    conditions: [
      'Panel con MRR/ARR, usuarios totales, distribución de planes y actividad.',
      'Cambio de tier, extensión de días y gestión de rol admin por usuario, en vivo.',
    ],
    components: ['/admin', 'API /api/admin/*'],
    icon: ShieldCheck,
  },
]

const COVERAGE = [
  { fn: 'Onboarding 5 pasos con datos de origen y objetivos múltiples', story: 'H1' },
  { fn: 'Cálculo en vivo de IMC y TDEE', story: 'H1' },
  { fn: 'Generación automática de plan nutricional (30 días) y rutina (4 semanas)', story: 'H1' },
  { fn: 'Rutina por semana/día con series, reps, descansos y notas', story: 'H2' },
  { fn: 'Check de ejercicios con persistencia + temporizador de descanso', story: 'H2' },
  { fn: 'Panel de progreso: adherencia, volumen, racha y proyección de peso', story: 'H2' },
  { fn: 'Registro diario de calorías, macros, peso, agua y hábitos', story: 'H3' },
  { fn: 'Dashboard con racha, promedios y evolución de peso (14 días)', story: 'H3' },
]

export default function StoriesPage() {
  const prioritized = STORIES.filter(s => s.priority)
  const backlog = STORIES.filter(s => !s.priority)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Header — rúbrica */}
        <div className="glass p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary-50 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              <BookOpen className="w-4 h-4" /> TRABAJO 01 — PROTOTIPO FUNCIONAL · 4321005-0 PROTOTIPOS Y CREATIVIDAD
            </div>
            <h1 className="text-3xl font-black text-slate-900">
              Historias de Usuario & <span className="gradient-text">Cobertura del Prototipo</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-3xl">
              Esta página documenta, dentro del propio prototipo, los puntos solicitados en la pauta:
              la solución propuesta, las historias del usuario en primera persona con condiciones de logro,
              la priorización justificada y la cobertura funcional demostrable.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                '1 · Solución a desarrollar (10 pts)',
                '2 · Historias del usuario (80 pts)',
                '3 · Priorización 1-3 historias (10 pts)',
                '4 · Prototipo con 100% de cobertura (200 pts)',
              ].map((p) => (
                <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 1 — Solución */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-sm font-black flex items-center justify-center">1</span>
            Solución a desarrollar
          </h2>
          <div className="card p-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-900">VitalCore</strong> es una plataforma SaaS de bienestar integral con membresías recurrentes
              ($25/$35/$50 USD/mes) que unifica cuatro pilares: <strong className="text-slate-900">nutrición personalizada</strong> (plan de 30 días
              calculado desde los datos de origen del usuario), <strong className="text-slate-900">entrenamiento periodizado</strong> (mesociclos de
              4 semanas con seguimiento y proyecciones), <strong className="text-slate-900">salud mental</strong> (meditaciones guiadas por voz) y
              <strong className="text-slate-900"> comunidad</strong> (eventos en vivo y grupos por membresía). El diferencial: el plan se adapta a los
              objetivos que el usuario declara y a los datos que registra a diario.
            </p>
          </div>
        </section>

        {/* 2 & 3 — Historias priorizadas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-sm font-black flex items-center justify-center">2·3</span>
              Historias priorizadas para el prototipo
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> 3 de 8 historias seleccionadas
            </span>
          </div>

          <div className="space-y-4">
            {prioritized.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.id} className="card p-6 border-primary-200 bg-gradient-to-r from-primary-50/40 to-white">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-primary-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-primary-700 font-mono">{s.id}</span>
                        <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary-600 text-white tracking-wider">
                          Prioridad {s.priority}
                        </span>
                      </div>

                      <blockquote className="text-sm text-slate-700 italic border-l-4 border-primary-300 pl-4 py-1 bg-white rounded-r-xl">
                        &ldquo;{s.statement}&rdquo;
                      </blockquote>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">Condiciones de logro</div>
                          <ul className="space-y-1.5">
                            {s.conditions.map((c, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">Componentes específicos</div>
                            <div className="flex flex-wrap gap-1.5">
                              {s.components.map((c) => (
                                <span key={c} className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">{c}</span>
                              ))}
                            </div>
                          </div>
                          {s.reason && (
                            <div>
                              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">Por qué se priorizó</div>
                              <p className="text-xs text-slate-600">{s.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Historias restantes (también implementadas) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-400" />
            Historias adicionales del backlog <span className="text-xs font-semibold text-slate-400">(también cubiertas por el prototipo)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backlog.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.id} className="card p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-slate-400 font-mono">{s.id}</span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{s.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">&ldquo;{s.statement}&rdquo;</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.components.map((c) => (
                      <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">{c}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 4 — Cobertura */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary-600 text-white text-sm font-black flex items-center justify-center">4</span>
            Cobertura funcional de las historias priorizadas
          </h2>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-xs text-slate-500">Cada función definida para H1–H3 está implementada y es demostrable en vivo.</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-600 text-white inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% de funciones cubiertas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Función definida</th>
                    <th className="py-2.5 px-3">Historia</th>
                    <th className="py-2.5 px-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COVERAGE.map((row) => (
                    <tr key={row.fn} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{row.fn}</td>
                      <td className="py-2.5 px-3 font-mono text-primary-700 font-bold">{row.story}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-primary-700 font-bold">
                          <Check className="w-3.5 h-3.5" /> Implementada
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5 bg-primary-50/50 border-primary-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              <strong>Demostración en vivo:</strong> recorre el flujo completo comenzando por el onboarding con tus datos de origen.
            </p>
            <Link href="/onboarding" className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap">
              Iniciar demo del flujo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
