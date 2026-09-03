'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { avatarUrl } from '@/lib/avatar'
import { Users, Mic, Building2, MessageCircle, Ticket, Lock, Rocket, AlertTriangle, Heart, Trophy, Flame } from 'lucide-react'
import { API_BASE_URL as API } from '@/lib/api'

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'groups' | 'feed'>('events')
  const [events, setEvents] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [selectedTag, setSelectedTag] = useState('all')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostTag, setNewPostTag] = useState('Progreso')
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<number, any[]>>({})
  const [commentInput, setCommentInput] = useState<Record<number, string>>({})
  const [toastMsg, setToastMsg] = useState<React.ReactNode>('')
  const [joinedGroups, setJoinedGroups] = useState<Record<number, boolean>>({ 1: true, 2: true })

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada', tier: 'pro' }
    setUser(currentUser)
    loadAllData(currentUser.id)
  }, [])

  const showToast = (msg: React.ReactNode) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadAllData = async (userId: number) => {
    try {
      // Events
      const evRes = await fetch(`${API}/api/community/events`)
      if (evRes.ok) setEvents(await evRes.json())

      // Groups
      const grRes = await fetch(`${API}/api/community/groups`)
      if (grRes.ok) setGroups(await grRes.json())

      // Posts
      const pRes = await fetch(`${API}/api/community/posts`)
      if (pRes.ok) setPosts(await pRes.json())
    } catch (e) {
      console.error(e)
    }
  }

  const handleRSVP = async (eventId: number) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/community/events/${eventId}/rsvp/${user.id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast(<><Ticket className="w-4 h-4" /> ¡Tu plaza está confirmada! Enlace a la sala en vivo habilitado.</>)
        loadAllData(user.id)
      } else {
        showToast(<><Lock className="w-4 h-4" /> {data.detail || 'Nivel de suscripción insuficiente'}</>)
      }
    } catch (e) {
      showToast(<><AlertTriangle className="w-4 h-4" /> Error al reservar</>)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() || !user) return
    try {
      const res = await fetch(`${API}/api/community/posts?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          tag: newPostTag
        })
      })
      if (res.ok) {
        showToast(<><Rocket className="w-4 h-4" /> ¡Publicación compartida con la comunidad!</>)
        setNewPostContent('')
        loadAllData(user.id)
      }
    } catch (e) {
      showToast(<><AlertTriangle className="w-4 h-4" /> Error al publicar</>)
    }
  }

  const handleLike = async (postId: number) => {
    try {
      const res = await fetch(`${API}/api/community/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes_count } : p))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadComments = async (postId: number) => {
    try {
      const res = await fetch(`${API}/api/community/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setCommentsMap(prev => ({ ...prev, [postId]: data }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toggleComments = (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
    } else {
      setExpandedPostId(postId)
      loadComments(postId)
    }
  }

  const handleAddComment = async (postId: number) => {
    const text = commentInput[postId]
    if (!text?.trim() || !user) return
    try {
      const res = await fetch(`${API}/api/community/posts/${postId}/comments?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      if (res.ok) {
        setCommentInput(prev => ({ ...prev, [postId]: '' }))
        loadComments(postId)
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const TIER_ORDER: Record<string, number> = { inicial: 1, premium: 2, pro: 3 }
  const canAccessTier = (userTier: string, minTier: string) => {
    return (TIER_ORDER[userTier?.toLowerCase()] || 1) >= (TIER_ORDER[minTier?.toLowerCase()] || 1)
  }

  const toggleJoinGroup = (groupId: number, groupName: string, minTier: string) => {
    if (!canAccessTier(user?.tier, minTier)) {
      showToast(<><Lock className="w-4 h-4" /> Este grupo exclusivo requiere nivel {minTier.toUpperCase()} (${minTier === 'pro' ? 50 : 35} USD). Tu nivel actual es {(user?.tier || 'inicial').toUpperCase()}.</>)
      return
    }
    setJoinedGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] }
      showToast(next[groupId] ? <><Trophy className="w-4 h-4" /> Te has unido a: {groupName}</> : `Saliste del grupo: ${groupName}`)
      return next
    })
  }

  const filteredPosts = selectedTag === 'all'
    ? posts
    : posts.filter(p => p.tag === selectedTag)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="glass p-6 rounded-3xl glow-green flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 mb-2">
              <Users className="w-4 h-4" /> ECOSISTEMA VITALCORE & NETWORKING GLOBAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Comunidad, <span className="gradient-text">Eventos & Masterminds</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Conecta con miles de personas, únete a grupos especializados y asiste a sesiones en vivo con expertos según tu plan de membresía.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'events' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><Mic className="w-4 h-4" /> Eventos en Vivo</span>
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'groups' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Grupos Especializados</span>
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'feed' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Feed Global</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: LIVE EVENTS & MASTERMINDS ─────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Calendario de Eventos & Masterclasses</h2>
                <p className="text-xs text-slate-500">Reserva tu cupo para las transmisiones en vivo y salas VIP</p>
              </div>
              <span className="text-xs text-primary-700 font-semibold">{events.length} eventos programados</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => {
                const dateObj = new Date(ev.event_date)
                const isProReq = ev.min_tier === 'pro'
                const isPremiumReq = ev.min_tier === 'premium'

                return (
                  <div key={ev.id} className="card p-6 flex flex-col justify-between space-y-4 hover:border-primary-300">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                          isProReq ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          isPremiumReq ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Plan {ev.min_tier} (${ev.min_tier === 'pro' ? '50' : ev.min_tier === 'premium' ? '35' : '25'} USD)
                        </span>
                        <span className="text-xs text-primary-700 font-mono font-bold">
                          {dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-snug">{ev.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ev.description}</p>

                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <img
                          src={avatarUrl(ev.speaker)}
                          alt={ev.speaker}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{ev.speaker}</div>
                          <div className="text-[11px] text-slate-500">{ev.speaker_role}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> <span className="text-slate-900 font-bold">{ev.rsvps_count}</span> participantes confirmados
                      </div>

                      <button
                        onClick={() => handleRSVP(ev.id)}
                        className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Reservar Plaza</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: SPECIALIZED COMMUNITY GROUPS ─────────────────────────────── */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Canales & Grupos Especializados</h2>
                <p className="text-xs text-slate-500">Únete a los grupos según tu objetivo para compartir rutinas y comidas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((g) => {
                const isJoined = joinedGroups[g.id]

                return (
                  <div key={g.id} className="card p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[10px] uppercase font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
                          {g.category}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Req: {g.min_tier} (${g.min_tier === 'pro' ? '50' : g.min_tier === 'premium' ? '35' : '25'} USD)
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 leading-snug">{g.name}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{g.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {g.members_count} miembros</span>
                      <button
                        onClick={() => toggleJoinGroup(g.id, g.name, g.min_tier)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                          isJoined
                            ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                            : 'btn-primary'
                        }`}
                      >
                        {isJoined ? '✓ Unido (Miembro)' : 'Unirse al Grupo'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: GLOBAL COMMUNITY FEED ────────────────────────────────────── */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Create Post & Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post Form */}
              <form onSubmit={handleCreatePost} className="card space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <img
                    src={user?.avatar_url || avatarUrl(user?.name || 'user')}
                    alt="Me"
                    className="w-10 h-10 rounded-full bg-slate-100"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[10px] text-primary-700">Comparte tu victoria o consulta con la comunidad</div>
                  </div>
                </div>

                <textarea
                  className="input-dark text-xs p-3.5 min-h-[90px] resize-none"
                  placeholder="¿Qué lograste hoy? Cuéntale a la comunidad tus pesos, comidas o reflexiones..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Etiqueta:</span>
                    <select
                      value={newPostTag}
                      onChange={(e) => setNewPostTag(e.target.value)}
                      className="bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none"
                    >
                      <option value="Progreso">Progreso</option>
                      <option value="Nutrición">Nutrición</option>
                      <option value="Rutina">Rutina</option>
                      <option value="Motivación">Motivación</option>
                      <option value="Bienestar">Bienestar</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary py-2 px-5 text-xs font-bold inline-flex items-center gap-1.5">
                    <Rocket className="w-4 h-4" /> Publicar
                  </button>
                </div>
              </form>

              {/* Tag filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {['all', 'Progreso', 'Nutrición', 'Motivación', 'Bienestar', 'Comunidad'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedTag === t ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'all' ? 'Todos los Temas' : `#${t}`}
                  </button>
                ))}
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {filteredPosts.map((p) => (
                  <div key={p.id} className="card space-y-4">
                    {/* Author bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.author.avatar_url || avatarUrl(p.author.name)}
                          alt={p.author.name}
                          className="w-10 h-10 rounded-full bg-slate-100"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            {p.author.name}
                            <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                              p.author.tier === 'pro' ? 'bg-amber-50 text-amber-700' :
                              p.author.tier === 'premium' ? 'bg-sky-50 text-sky-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {p.author.tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {p.group_name}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        #{p.tag}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {p.content}
                    </p>

                    {/* Actions: Like & Comments */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(p.id)}
                          className="flex items-center gap-1.5 hover:text-red-600 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span className="font-semibold text-slate-900">{p.likes_count}</span>
                        </button>

                        <button
                          onClick={() => toggleComments(p.id)}
                          className="flex items-center gap-1.5 hover:text-primary-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{p.comments_count || 0} comentarios</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-300">Comunidad VitalCore Verificada</span>
                    </div>

                    {/* Expanded Comments section */}
                    {expandedPostId === p.id && (
                      <div className="pt-3 border-t border-slate-200 space-y-3 animate-slide-up">
                        <div className="space-y-2">
                          {(commentsMap[p.id] || []).map((c) => (
                            <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                              <div className="font-bold text-primary-700 mb-0.5">{c.author.name}</div>
                              <div className="text-slate-700">{c.content}</div>
                            </div>
                          ))}
                        </div>

                        {/* Add comment */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Escribe un comentario positivo..."
                            className="input-dark text-xs py-2 flex-1"
                            value={commentInput[p.id] || ''}
                            onChange={(e) => setCommentInput({ ...commentInput, [p.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(p.id)}
                          />
                          <button
                            onClick={() => handleAddComment(p.id)}
                            className="btn-primary py-2 px-4 text-xs font-bold"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Top Community Highlights */}
            <div className="space-y-6">
              <div className="card space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Miembros Destacados de la Semana
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sebastián Posada', streak: '28 días', tag: 'Super Admin • Pro' },
                    { name: 'Dra. Ana Morales', streak: '22 días', tag: 'Docente • Premium' },
                    { name: 'Paula Díaz', streak: '19 días', tag: 'Coach Mindfulness • Pro' },
                    { name: 'Carlos Vega', streak: '14 días', tag: 'Atleta • Inicial' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center font-mono">
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.tag}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary-700 inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {m.streak}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
