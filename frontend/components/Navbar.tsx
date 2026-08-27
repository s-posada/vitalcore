'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Salad, Dumbbell, Flower2, Users, Gem, ShieldCheck, Settings, Crown, BookOpen } from 'lucide-react'
import { avatarUrl } from '@/lib/avatar'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const TEAM_FOUNDERS = [
    {
      id: 1,
      name: 'Sebastian Posada Posada',
      email: 'sposada2026@udec.cl',
      role: 'CEO & Co-Fundador',
      avatar_url: avatarUrl('Sebastian Posada Posada', 'male'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 2,
      name: 'Andres Gonzalo Burboa Lizama',
      email: 'andresburboa@udec.cl',
      role: 'CTO & Co-Fundador',
      avatar_url: avatarUrl('Andres Gonzalo Burboa Lizama', 'male'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 3,
      name: 'Catalina Antonia Vergara Donoso',
      email: 'cavergara2019@udec.cl',
      role: 'Chief Health Officer & Co-Fundadora',
      avatar_url: avatarUrl('Catalina Antonia Vergara Donoso', 'female'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 4,
      name: 'Fabian Alonso Alvarado Arriagada',
      email: 'falvarado2016@udec.cl',
      role: 'Head of AI & Co-Fundador',
      avatar_url: avatarUrl('Fabian Alonso Alvarado Arriagada', 'male'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 5,
      name: 'Marian Garcia Cruz',
      email: 'margarcia2026@udec.cl',
      role: 'Head of Product & Co-Fundadora',
      avatar_url: avatarUrl('Marian Garcia Cruz', 'female'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 6,
      name: 'Yenny Sanchez Aguilar',
      email: 'yesanchez2026@udec.cl',
      role: 'COO & Co-Fundador',
      avatar_url: avatarUrl('Yenny Sanchez Aguilar', 'male'),
      tier: 'pro',
      is_admin: true,
      days_left: 30
    },
    {
      id: 7,
      name: 'Prof. Martín Mellado',
      email: 'martin.mellado@udec.cl',
      role: 'Inversionista Ángel & Financiador',
      avatar_url: avatarUrl('Martin Mellado', 'male'),
      tier: 'pro',
      is_admin: true,
      days_left: 365
    }
  ]

  useEffect(() => {
    const saved = localStorage.getItem('vc_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (e) {
        setUser(null)
      }
    } else {
      const defaultUser = TEAM_FOUNDERS[0]
      localStorage.setItem('vc_user', JSON.stringify(defaultUser))
      setUser(defaultUser)
    }
  }, [])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/nutrition', label: 'Nutrición', icon: Salad },
    { href: '/workout', label: 'Entrenamiento', icon: Dumbbell },
    { href: '/meditation', label: 'Meditación', icon: Flower2 },
    { href: '/community', label: 'Comunidad', icon: Users },
    { href: '/pricing', label: 'Planes', icon: Gem },
    { href: '/historias', label: 'Historias', icon: BookOpen },
  ]

  const handleSwitchUser = (demoUser: any) => {
    localStorage.setItem('vc_user', JSON.stringify(demoUser))
    setUser(demoUser)
    setMenuOpen(false)
    window.location.reload()
  }

  const firstName = (user?.name || '').split(' ').slice(0, 2).join(' ')

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.png"
            alt="VitalCore Logo"
            className="w-9 h-9 rounded-xl object-contain bg-slate-900 group-hover:scale-105 transition-all"
          />
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-none block">VitalCore</span>
            <span className="text-[10px] text-slate-400 font-medium leading-none flex items-center gap-1">
              <img src="/logo_udec.png" alt="UdeC" className="h-3 object-contain" />
              UdeC · Equipo 2
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {navLinks.map((l) => {
            const active = pathname === l.href
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{l.label}</span>
              </Link>
            )
          })}
          {user?.is_admin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                pathname === '/admin'
                  ? 'bg-white text-amber-600 shadow-sm border border-slate-200'
                  : 'text-amber-600/80 hover:text-amber-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}
        </nav>

        {/* User profile & Subscription Status */}
        <div className="flex items-center shrink-0">
          {user && (
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl p-1.5 pr-2 shadow-sm">
              <img
                src={user.avatar_url || avatarUrl(user.name || 'user')}
                alt={user.name}
                className="w-8 h-8 rounded-xl bg-slate-100 object-cover"
              />
              <div className="hidden xl:block text-left max-w-[170px]">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate">{firstName}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 whitespace-nowrap">
                  <span className={`uppercase font-bold ${
                    user.tier === 'pro' ? 'text-amber-600' : user.tier === 'premium' ? 'text-sky-600' : 'text-primary-600'
                  }`}>
                    {user.tier}
                  </span>
                  <span>·</span>
                  <span className="text-primary-700 font-semibold">{user.days_left || 30}d</span>
                </div>
              </div>

              {/* Quick Switch Demo Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Modo demostración: cambiar de cuenta"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass p-3 shadow-2xl z-50 animate-slide-up max-h-[80vh] overflow-y-auto">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modo demostración — Equipo & Financiador</div>
                    <div className="space-y-1.5">
                      {TEAM_FOUNDERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleSwitchUser(f)}
                          className="w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 bg-slate-50 text-slate-700 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 transition-all"
                        >
                          <img src={f.avatar_url} alt={f.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold truncate flex items-center gap-1 text-slate-900">
                              {f.email === 'martin.mellado@udec.cl' ? <Gem className="w-3 h-3 text-amber-500 shrink-0" /> : <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                              <span className="truncate">{f.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{f.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 mt-3 pt-2">
                      <Link
                        href="/login"
                        className="block text-center text-xs text-slate-500 hover:text-slate-900 p-1 hover:bg-slate-50 rounded-lg"
                      >
                        Ir a pantalla de Login →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
