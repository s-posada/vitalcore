'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { avatarUrl } from '@/lib/avatar'
import { Zap, Users, Crown, CheckCircle2, CalendarDays, AlertTriangle } from 'lucide-react'
import { API_BASE_URL as API } from '@/lib/api'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [usersList, setUsersList] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toastMsg, setToastMsg] = useState<React.ReactNode>('')

  useEffect(() => {
    const stored = localStorage.getItem('vc_user')
    const currentUser = stored ? JSON.parse(stored) : { id: 1, email: 'sposada2026@udec.cl', name: 'Sebastián Posada', is_admin: true }
    setUser(currentUser)
    loadAdminData(currentUser.email)
  }, [])

  const showToast = (msg: React.ReactNode) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const loadAdminData = async (adminEmail: string) => {
    try {
      setLoading(true)
      const uRes = await fetch(`${API}/api/admin/users?admin_email=${encodeURIComponent(adminEmail)}`)
      if (uRes.ok) {
        setUsersList(await uRes.json())
      }

      const mRes = await fetch(`${API}/api/admin/metrics?admin_email=${encodeURIComponent(adminEmail)}`)
      if (mRes.ok) {
        setMetrics(await mRes.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeTier = async (targetUserId: number, newTier: string) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/admin/users/${targetUserId}/tier?admin_email=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier, days_to_add: 30 })
      })
      if (res.ok) {
        showToast(<><CheckCircle2 className="w-4 h-4" /> Nivel de usuario actualizado a: {newTier.toUpperCase()}</>)
        loadAdminData(user.email)
      }
    } catch (e) {
      showToast(<><AlertTriangle className="w-4 h-4" /> Error al actualizar nivel</>)
    }
  }

  const handleAddDays = async (targetUserId: number, currentTier: string) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/admin/users/${targetUserId}/tier?admin_email=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: currentTier, days_to_add: 30 })
      })
      if (res.ok) {
        showToast(<><CalendarDays className="w-4 h-4" /> +30 días de suscripción otorgados con éxito</>)
        loadAdminData(user.email)
      }
    } catch (e) {
      showToast(<><AlertTriangle className="w-4 h-4" /> Error al extender días</>)
    }
  }

  const handleToggleAdmin = async (targetUserId: number) => {
    if (!user) return
    try {
      const res = await fetch(`${API}/api/admin/users/${targetUserId}/toggle-admin?admin_email=${encodeURIComponent(user.email)}`, {
        method: 'PATCH'
      })
      if (res.ok) {
        const data = await res.json()
        showToast(<><Zap className="w-4 h-4" /> Rol de administrador {data.is_admin ? 'otorgado' : 'revocado'}</>)
        loadAdminData(user.email)
      }
    } catch (e) {
      showToast(<><AlertTriangle className="w-4 h-4" /> Error al cambiar permisos</>)
    }
  }

  const filteredUsers = usersList.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.tier?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white px-5 py-3 rounded-2xl border border-primary-200 text-primary-800 shadow-2xl flex items-center gap-2 animate-slide-up">
          {toastMsg}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header */}
        <div className="glass p-6 rounded-3xl glow-green flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-200">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <Zap className="w-4 h-4" /> ADMINISTRACIÓN DE PLATAFORMA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Gestión de Plataforma, <span className="gradient-text">Membresías & Métricas</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Control centralizado de usuarios, cambio de tiers en tiempo real, auditoría de ingresos MRR y administración de permisos.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Super Admin Conectado:</div>
            <div className="text-sm font-bold text-amber-700">{user?.email}</div>
          </div>
        </div>

        {/* Business Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card border-primary-200">
            <div className="text-xs text-primary-700 font-semibold mb-1">MRR ESTIMADO (MENSUAL)</div>
            <div className="text-3xl font-black text-slate-900">
              ${metrics?.mrr_usd?.toLocaleString('en-US') || '285'} <span className="text-xs text-slate-400 font-normal">USD/mes</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              ARR Anualizado: <span className="text-slate-900 font-bold">${metrics?.arr_usd?.toLocaleString('en-US') || '3,420'} USD</span>
            </div>
          </div>

          <div className="card">
            <div className="text-xs text-sky-700 font-semibold mb-1">TOTAL USUARIOS REGISTRADOS</div>
            <div className="text-3xl font-black text-slate-900">
              {metrics?.total_users || usersList.length} <span className="text-xs text-slate-400 font-normal">atletas</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Tasa de actividad: <span className="text-emerald-700 font-bold">{metrics?.active_rate_pct || 92.5}%</span>
            </div>
          </div>

          <div className="card">
            <div className="text-xs text-amber-700 font-semibold mb-1">DISTRIBUCIÓN DE PLANES</div>
            <div className="flex items-center gap-2 mt-2 text-xs font-bold">
              <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                {metrics?.tier_counts?.inicial || 2} Inicial ($25)
              </span>
              <span className="px-2 py-1 rounded bg-sky-50 border border-sky-200 text-sky-700">
                {metrics?.tier_counts?.premium || 3} Prem ($35)
              </span>
              <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
                {metrics?.tier_counts?.pro || 3} Pro ($50)
              </span>
            </div>
          </div>

          <div className="card">
            <div className="text-xs text-sky-700 font-semibold mb-1">INTERACCIONES & LOGS</div>
            <div className="text-3xl font-black text-slate-900">
              {metrics?.total_daily_logs || 56} <span className="text-xs text-slate-400 font-normal">logs</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              {metrics?.total_posts || 12} posts • {metrics?.total_rsvps || 18} reservas en eventos
            </div>
          </div>
        </div>

        {/* Users Management Table */}
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4" /> Directorio & Permisos de Usuarios
              </h2>
              <p className="text-xs text-slate-500">Modifica tiers, añade días de suscripción y gestiona privilegios de administración</p>
            </div>

            <input
              type="text"
              placeholder="Buscar por nombre, email o plan..."
              className="input-dark text-xs py-2 px-3 sm:w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Plan Actual</th>
                  <th className="py-3 px-3">Días Restantes</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Cambiar Membresía</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar_url || avatarUrl(u.name || 'user')}
                          alt={u.name}
                          className="w-8 h-8 rounded-full bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        u.tier === 'pro' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        u.tier === 'premium' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Plan {u.tier} (${u.tier_price_usd} USD)
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-primary-700 font-mono">{u.days_left}</span>
                      <span className="text-slate-400 text-[10px] ml-1">días</span>
                    </td>

                    <td className="py-3.5 px-3">
                      {u.is_admin ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Miembro</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <select
                        value={u.tier}
                        onChange={(e) => handleChangeTier(u.id, e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-primary-500"
                      >
                        <option value="inicial">Inicial ($25 USD)</option>
                        <option value="premium">Premium ($35 USD)</option>
                        <option value="pro">Pro ($50 USD)</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleAddDays(u.id, u.tier)}
                        className="py-1 px-2.5 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-800 text-[11px] font-semibold transition-colors"
                        title="Extender suscripción +30 días"
                      >
                        +30 Días
                      </button>

                      <button
                        onClick={() => handleToggleAdmin(u.id)}
                        className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors"
                      >
                        {u.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
