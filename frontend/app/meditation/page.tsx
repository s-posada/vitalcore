'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Flower2, Mic, Headphones, Pause, Play, Check, Wind, Sprout, Moon, Dumbbell, Target, Zap, Heart, Timer } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MeditationPage() {
  const [user, setUser] = useState<any>(null)
  const [meditations, setMeditations] = useState<any[]>([])
  const [activeMed, setActiveMed] = useState<any>(null)
  const [category, setCategory] = useState<string>('all')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(true)
  const [toastMsg, setToastMsg] = useState('')
  const [breathingPhase, setBreathingPhase] = useState('Inhala...')

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada' }
    setUser(currentUser)
    loadMeditations()

    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setIsSpeechAvailable(false)
    }

    // Breathing rhythm interval
    const bInterval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev.startsWith('Inhala')) return 'Retén el aire...'
        if (prev.startsWith('Retén')) return 'Exhala suavemente...'
        return 'Inhala profundo...'
      })
    }, 4000)

    return () => {
      clearInterval(bInterval)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadMeditations = async () => {
    try {
      const res = await fetch(`${API}/api/meditations`)
      if (res.ok) {
        const data = await res.json()
        setMeditations(data)
        if (data.length > 0) setActiveMed(data[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePlay = (med: any) => {
    setActiveMed(med)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(med.script)
      utterance.lang = 'es-ES'
      utterance.rate = 0.85
      utterance.pitch = 0.95

      utterance.onend = () => {
        setIsPlaying(false)
        handleCompleteMeditation(med.id)
      }

      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      showToast(`Reproduciendo meditación guiada con voz`)
    } else {
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  const handleCompleteMeditation = async (medId: string) => {
    if (!user) return
    try {
      await fetch(`${API}/api/meditations/${medId}/complete/${user.id}`, { method: 'POST' })
      showToast('¡Sesión completada y registrada en tu racha!')
    } catch (e) {
      console.error(e)
    }
  }

  const filteredMeditations = category === 'all'
    ? meditations
    : meditations.filter((m) => m.category === category)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          {toastMsg.includes('Reproduciendo') ? <Headphones className="w-4 h-4" /> : <Flower2 className="w-4 h-4" />}
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="glass p-6 rounded-3xl glow-green flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <Flower2 className="w-4 h-4" /> SALUD MENTAL, MINDFULNESS & CORTISOL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Meditaciones Guiadas & <span className="gradient-text">Respiración Viva</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Prácticas de coherencia cardíaca, inducción al sueño y visualización con narración de voz interactiva en el navegador.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 inline-flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voz TTS Nativa Sincronizada
            </span>
          </div>
        </div>

        {/* Interactive Audio Player & Breathing Circle Card */}
        {activeMed && (
          <div className="glass p-8 rounded-3xl border border-primary-200 relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/70 rounded-full blur-3xl pointer-events-none" />

            {/* Left 2 Cols: Details & Audio Script */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700">
                <span className="uppercase">{activeMed.category}</span>
                <span>•</span>
                <span>{activeMed.duration_min} minutos</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase text-[9px]">
                  Membresía {activeMed.min_tier}
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900">{activeMed.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{activeMed.description}</p>

              {/* Guiding Script Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-serif italic max-h-36 overflow-y-auto">
                "{activeMed.script}"
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {isPlaying ? (
                  <button
                    onClick={handlePause}
                    className="btn-ghost py-3 px-6 text-sm font-bold flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar Narración</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlay(activeMed)}
                    className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-200"
                  >
                    <Play className="w-4 h-4" />
                    <span>Iniciar Sesión de Voz ({activeMed.duration_min} min)</span>
                  </button>
                )}

                <button
                  onClick={() => handleCompleteMeditation(activeMed.id)}
                  className="text-xs text-slate-600 hover:text-slate-900 py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Marcar como Completada
                </button>
              </div>
            </div>

            {/* Right Col: Breathing Visualizer Animation */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-primary-50/50 border border-primary-100 relative">
              <div
                className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-2 border-primary-300 bg-gradient-to-tr from-primary-100 to-white transition-all duration-1000 ${
                  isPlaying ? 'animate-pulse-slow scale-110 shadow-2xl shadow-primary-200' : ''
                }`}
              >
                <Wind className="w-9 h-9 mb-1 text-primary-600" />
                <span className="text-xs font-bold text-primary-700 text-center px-2">{breathingPhase}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-4 tracking-wider uppercase font-semibold">
                Guía de Respiración Rítmica
              </span>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: 'all', label: 'Todas las Sesiones', icon: null },
            { id: 'stress', label: 'Reducción de Estrés', icon: Sprout },
            { id: 'sleep', label: 'Inducción al Sueño', icon: Moon },
            { id: 'recovery', label: 'Recuperación Muscular', icon: Dumbbell },
            { id: 'focus', label: 'Enfoque & Rendimiento', icon: Target },
            { id: 'energy', label: 'Wim Hof & Energía', icon: Zap },
            { id: 'mood', label: 'Coherencia Cardíaca', icon: Heart },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                category === cat.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Meditations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeditations.map((m) => {
            const isCurrent = activeMed?.id === m.id
            return (
              <div
                key={m.id}
                onClick={() => setActiveMed(m)}
                className={`card p-5 cursor-pointer transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-primary-400 bg-primary-50/60 shadow-md shadow-primary-100'
                    : 'hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[10px] uppercase font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      {m.category}
                    </span>
                    <span className="text-slate-500 text-xs font-mono inline-flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {m.duration_min} min
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{m.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{m.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlay(m)
                    }}
                    className="text-xs text-primary-700 hover:text-primary-600 font-bold flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    <span>Reproducir</span>
                  </button>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Tier {m.min_tier}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
