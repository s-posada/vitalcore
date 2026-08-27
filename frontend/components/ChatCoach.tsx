'use client'
import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { avatarUrl } from '@/lib/avatar'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type ChatMsg = { role: 'user' | 'model'; text: string }

const QUICK_PROMPTS = [
  '¿Cómo voy con mi peso?',
  'Dame un consejo de nutrición',
  'Necesito motivación',
  '¿Qué meditación me recomiendas?',
]

export default function ChatCoach() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vc_user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const nextHistory = [...messages, { role: 'user' as const, text: trimmed }]
    setMessages(nextHistory)
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${API}/api/chat/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 1,
          message: trimmed,
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'model', text: data.reply || 'No pude responder, intenta de nuevo.' }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', text: 'No logré conectar con el servidor. Intenta de nuevo en unos segundos.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] sm:w-[380px] h-[520px] max-h-[70vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-primary-700 to-primary-600 text-white shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">Coach VitalCore</div>
              <div className="text-[11px] text-white/80 leading-tight">Nutrición · Entrenamiento · Ánimo</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 leading-relaxed">
                  Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Puedo ayudarte con tu plan de nutrición, tu rutina, meditación o solo darte un empujón de ánimo.
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-xs font-medium px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <img
                    src={user?.avatar_url || avatarUrl(user?.name || 'user')}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="flex items-center gap-2 p-3 border-t border-slate-200 bg-white shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="input-dark text-sm py-2.5 flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center transition-all hover:scale-105"
        aria-label={open ? 'Cerrar chat' : 'Abrir coach virtual'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
