'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Sparkles, RotateCcw, AlertCircle, Minus, Wrench } from 'lucide-react'
import { avatarUrl } from '@/lib/avatar'
import { API_BASE_URL as API } from '@/lib/api'
import type { ChatReply, UserSession } from '@/lib/types'

type ChatMsg = {
  role: 'user' | 'model'
  text: string
  at: number
  tools?: string[]
  failed?: boolean
}

const STORAGE_KEY = 'vc_chat_history'
const MAX_STORED = 24

const QUICK_PROMPTS = [
  { label: '¿Cómo voy con mis macros?', text: '¿Cómo voy con mis macros y calorías hoy?' },
  { label: 'Guardar mi peso', text: 'Hoy peso 80 kg, guárdalo en mi perfil.' },
  { label: 'Recalcular mi plan', text: 'Recalcula mi plan nutricional con mis datos actuales.' },
  { label: 'Comida alta en proteína', text: 'Recomiéndame comidas altas en proteína para mi objetivo.' },
]

/** Negritas, saltos de línea y viñetas: lo justo para que el texto del modelo se lea bien. */
function renderRich(text: string) {
  return text.split('\n').map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line)
    const clean = bullet ? line.replace(/^\s*[-*•]\s+/, '') : line
    const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
    const content = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>
    )
    if (!clean.trim()) return <span key={i} className="block h-2" />
    return bullet
      ? <span key={i} className="flex gap-1.5"><span className="text-primary-500 shrink-0">•</span><span>{content}</span></span>
      : <span key={i} className="block">{content}</span>
  })
}

const timeOf = (ts: number) =>
  new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

export default function ChatCoach() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserSession | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLive, setAiLive] = useState<boolean | null>(null)
  const [lastFailed, setLastFailed] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vc_user')
      if (stored) setUser(JSON.parse(stored))
      const history = localStorage.getItem(STORAGE_KEY)
      if (history) setMessages(JSON.parse(history))
    } catch {}
  }, [])

  useEffect(() => {
    if (!messages.length) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
    } catch {}
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  // Escape cierra el panel
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const history = [...messages, { role: 'user' as const, text: trimmed, at: Date.now() }]
    setMessages(history)
    setInput('')
    setLastFailed(null)
    setSending(true)

    try {
      const res = await fetch(`${API}/api/chat/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 1,
          message: trimmed,
          history: history.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as ChatReply

      setAiLive(data.source === 'gemini')
      setMessages((prev) => [...prev, {
        role: 'model',
        text: data.reply || 'No pude responder, intenta de nuevo.',
        at: Date.now(),
        tools: data.tool_labels || [],
      }])

      // El coach escribió en la base: avisa a Dashboard y Nutrición para que se refresquen.
      if (data.data_changed) {
        window.dispatchEvent(new CustomEvent('vitalcore:data-updated'))
      }
    } catch {
      setLastFailed(trimmed)
      setMessages((prev) => [...prev, {
        role: 'model',
        at: Date.now(),
        failed: true,
        text: 'No logré conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.',
      }])
    } finally {
      setSending(false)
    }
  }, [messages, sending, user])

  const reset = () => {
    setMessages([])
    setLastFailed(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <>
      {/* Velo en móvil para que el chat se lea como una hoja a pantalla completa */}
      {open && <div className="fixed inset-0 z-[55] bg-slate-900/30 backdrop-blur-[2px] sm:hidden" onClick={() => setOpen(false)} />}

      <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
        {open && (
          <div
            role="dialog"
            aria-label="Coach VitalCore"
            className="pointer-events-auto w-full sm:w-[400px] h-[85vh] sm:h-[560px] sm:max-h-[75vh] bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/10 flex flex-col overflow-hidden animate-slide-up"
          >
            {/* Cabecera */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white shrink-0">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
              <div className="relative w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="text-sm font-bold leading-tight">Coach VitalCore</div>
                <div className="text-[11px] text-white/80 leading-tight flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiLive === false ? 'bg-amber-300' : 'bg-emerald-300'} ${aiLive === null ? 'animate-pulse' : ''}`} />
                  {aiLive === false ? 'Modo básico sin IA' : 'IA con acceso a tus datos'}
                </div>
              </div>
              <button
                onClick={reset}
                className="relative p-2 rounded-xl hover:bg-white/15 transition-colors"
                aria-label="Reiniciar conversación"
                title="Reiniciar conversación"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="relative p-2 rounded-xl hover:bg-white/15 transition-colors"
                aria-label="Cerrar chat"
              >
                <Minus className="w-4 h-4 sm:hidden" />
                <X className="w-4 h-4 hidden sm:block" />
              </button>
            </div>

            {/* Conversación */}
            <div
              ref={scrollRef}
              aria-live="polite"
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/80"
            >
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md p-3.5 text-sm text-slate-600 leading-relaxed shadow-sm">
                    Hola{firstName ? `, ${firstName}` : ''}. Soy tu coach de salud y nutrición.
                    Puedo <strong className="font-semibold text-slate-900">leer y actualizar tus datos</strong>:
                    dime tu peso, cuéntame qué comiste o pídeme recalcular tu plan.
                  </div>
                  <div className="grid gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => send(q.text)}
                        className="text-left text-xs font-semibold px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 hover:shadow-sm transition-all"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'model' && (
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${m.failed ? 'bg-amber-100 text-amber-600' : 'bg-primary-600 text-white'}`}>
                      {m.failed ? <AlertCircle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-1.5">
                    <div
                      className={`text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : m.failed
                            ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-md'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                      }`}
                    >
                      {renderRich(m.text)}
                    </div>

                    {!!m.tools?.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.tools.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 border border-primary-200">
                            <Wrench className="w-2.5 h-2.5" /> {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {m.failed && lastFailed && (
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.filter((x) => !x.failed))
                          send(lastFailed)
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2"
                      >
                        Reintentar
                      </button>
                    )}

                    <div className={`text-[10px] text-slate-400 ${m.role === 'user' ? 'text-right' : ''}`}>
                      {timeOf(m.at)}
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <img
                      src={user?.avatar_url || avatarUrl(user?.name || 'user')}
                      alt=""
                      className="w-7 h-7 rounded-xl object-cover shrink-0"
                    />
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Entrada */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input) }}
              className="flex items-end gap-2 p-3 border-t border-slate-200 bg-white shrink-0"
            >
              <textarea
                id="chat-coach-input"
                data-testid="chat-coach-input"
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(96, e.target.scrollHeight)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
                }}
                placeholder="Escribe tu pregunta..."
                aria-label="Mensaje para el coach"
                className="input-dark text-sm py-2.5 flex-1 resize-none max-h-24 leading-relaxed"
                disabled={sending}
                maxLength={400}
              />
              <button
                id="chat-coach-submit-btn"
                data-testid="chat-coach-submit-btn"
                type="submit"
                disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Lanzador */}
        <button
          id="chat-coach-launcher"
          data-testid="chat-coach-launcher"
          onClick={() => setOpen((v) => !v)}
          className={`pointer-events-auto mr-4 mb-4 sm:mr-0 sm:mb-0 self-end w-14 h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${open ? 'hidden sm:flex' : 'flex'}`}
          aria-label={open ? 'Cerrar coach virtual' : 'Abrir coach virtual'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
