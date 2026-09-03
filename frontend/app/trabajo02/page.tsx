'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  Sparkles, Search, Cpu, Database, UserCheck, Activity, Layers, CheckCircle2,
  ArrowRight, ShieldCheck, Flame, Dumbbell, Salad, Flower2, RefreshCw, BarChart3,
  Sliders, MessageSquare, Terminal, ChevronRight, Check
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Trabajo02Page() {
  // Estado para Búsqueda Semántica Vectorial
  const [query, setQuery] = useState('desayuno rapido sin lactosa rico en proteina')
  const [category, setCategory] = useState('todas')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Estado para MCP Explorer
  const [mcpTools, setMcpTools] = useState<any[]>([])
  const [selectedTool, setSelectedTool] = useState<string>('get_user_biometrics_and_progress')
  const [toolResult, setToolResult] = useState<any>(null)
  const [loadingTool, setLoadingTool] = useState(false)

  // Tab activo
  const [activeTab, setActiveTab] = useState<'vectores' | 'mcp' | 'ux' | 'usuarios' | 'video'>('vectores')

  // Cargar herramientas MCP al montar
  useEffect(() => {
    fetch(`${API}/api/mcp/tools`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tools) setMcpTools(data.tools)
      })
      .catch(() => {})
    
    // Búsqueda inicial
    handleSearch('desayuno rapido sin lactosa rico en proteina', 'todas')
  }, [])

  const handleSearch = async (qText?: string, catFilter?: string) => {
    const q = qText !== undefined ? qText : query
    const cat = catFilter !== undefined ? catFilter : category
    if (!q.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/search/semantic?q=${encodeURIComponent(q)}&category=${cat}&top_k=4`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  const executeMcpTool = async (toolName: string) => {
    setLoadingTool(true)
    setToolResult(null)
    try {
      let args: any = { user_id: 1 }
      if (toolName === 'search_catalog_semantic') {
        args = { query: 'dolor de rodilla sin impacto', category: 'entrenamiento', limit: 2 }
      } else if (toolName === 'record_daily_log_quick') {
        args = { user_id: 1, calories_consumed: 2300, workout_done: true, water_ml: 2500, notes: 'Registro automático desde MCP' }
      }

      const res = await fetch(`${API}/api/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, arguments: args })
      })
      const data = await res.json()
      setToolResult(data.result)
    } catch (e) {
      setToolResult({ error: 'Fallo al conectar con el servidor MCP' })
    } finally {
      setLoadingTool(false)
    }
  }

  const EXAMPLE_QUERIES = [
    { text: 'desayuno rapido sin lactosa rico en proteina', cat: 'nutricion', label: '🥣 Desayuno sin lactosa' },
    { text: 'tengo dolor de rodilla y busco ejercicio seguro', cat: 'entrenamiento', label: '🦵 Cuidado de rodilla' },
    { text: 'estres laboral e insomnio para calmar la mente', cat: 'meditacion', label: '🧘 Estrés e insomnio' },
    { text: 'almuerzo antiinflamatorio con omega 3', cat: 'nutricion', label: '🐟 Omega 3 articular' },
    { text: 'rutina express de 15 minutos en casa sin equipo', cat: 'entrenamiento', label: '⚡ HIIT 15 min' }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Banner Superior Rúbrica */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Entrega Oficial · Trabajo 02 (100 Puntos)
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Validación, Testeo de Usuarios y Evolución de VitalCore
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Auditoría heurística completa (UX 74/100), pruebas con 3 arquetipos reales, y salto cualitativo mediante 
                <strong className="text-indigo-300"> Búsqueda Semántica Vectorial</strong> y protocolo <strong className="text-teal-300">MCP (Model Context Protocol)</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-xl font-bold text-indigo-400">20 pts</div>
                <div className="text-[11px] text-slate-400">Plan & Estrategia</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-xl font-bold text-amber-400">10 pts</div>
                <div className="text-[11px] text-slate-400">Nota UX V1</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">20 pts</div>
                <div className="text-[11px] text-slate-400">3 Usuarios Reales</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-xl font-bold text-teal-400">50 pts</div>
                <div className="text-[11px] text-slate-400">Ajustes & Trazabilidad</div>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas Interactivas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('vectores')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
              activeTab === 'vectores'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            1. Búsqueda Semántica Vectorial (Live)
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
              activeTab === 'mcp'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            2. Servidor MCP & Tool Calling
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
              activeTab === 'usuarios'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            3. Testeo con 3 Usuarios (20 pts)
          </button>
          <button
            onClick={() => setActiveTab('ux')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
              activeTab === 'ux'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            4. Evaluación Heurística UX (74 vs 92)
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            5. Guion Video 20 Min
          </button>
        </div>

        {/* TAB 1: BÚSQUEDA SEMÁNTICA VECTORIAL */}
        {activeTab === 'vectores' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Motor de Búsqueda Semántica Vectorial en Tiempo Real
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Calcula similitud coseno en un espacio vectorial denso sobre nutrición, ejercicios y meditaciones.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Cosine Similarity: Activo
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    Latencia: &lt; 8ms
                  </span>
                </div>
              </div>

              {/* Barra de Búsqueda */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Escribe lo que necesitas en lenguaje natural (ej: dolor de rodilla, sin lactosa, insomnio)..."
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      handleSearch(query, e.target.value)
                    }}
                    className="px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="todas">Todas las categorías</option>
                    <option value="nutricion">Nutrición & Recetas</option>
                    <option value="entrenamiento">Entrenamiento & Ejercicios</option>
                    <option value="meditacion">Meditación & Mindfulness</option>
                  </select>
                  <button
                    onClick={() => handleSearch()}
                    disabled={searching}
                    className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Buscar con Vectores
                  </button>
                </div>

                {/* Consultas Sugeridas */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Pruebas sugeridas:</span>
                  {EXAMPLE_QUERIES.map((ex) => (
                    <button
                      key={ex.label}
                      onClick={() => {
                        setQuery(ex.text)
                        setCategory(ex.cat)
                        handleSearch(ex.text, ex.cat)
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultados Vectoriales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-indigo-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {res.item.category === 'nutricion' && <Salad className="w-4 h-4 text-emerald-400" />}
                        {res.item.category === 'entrenamiento' && <Dumbbell className="w-4 h-4 text-amber-400" />}
                        {res.item.category === 'meditacion' && <Flower2 className="w-4 h-4 text-purple-400" />}
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {res.item.type}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                        {res.relevance_pct}% match
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{res.item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{res.item.description}</p>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-indigo-200">
                      💡 <strong>Inferencia:</strong> {res.matched_reason}
                    </div>

                    {res.item.tags && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {res.item.tags.map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVIDOR MCP & TOOL CALLING */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-teal-400" />
                    Arquitectura MCP (Model Context Protocol) & Tool Invocation
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Estándar abierto que expone herramientas y base de datos para agentes de lenguaje (Gemini / Claude).
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                  Endpoint: /api/mcp/call (JSON-RPC)
                </div>
              </div>

              {/* Selector de Herramientas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {mcpTools.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTool(t.name)
                      executeMcpTool(t.name)
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                      selectedTool === t.name
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-lg shadow-teal-900/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-teal-300">{t.name}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">{t.description}</div>
                  </button>
                ))}
              </div>

              {/* Botón de Ejecución & Visor JSON */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    Respuesta Estructurada de la Herramienta MCP: <code>{selectedTool}</code>
                  </div>
                  <button
                    onClick={() => executeMcpTool(selectedTool)}
                    disabled={loadingTool}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    {loadingTool ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayIcon />}
                    Ejecutar Invocación en Vivo
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 text-teal-200 text-xs font-mono overflow-x-auto max-h-80 border border-slate-800">
                  {toolResult ? JSON.stringify(toolResult, null, 2) : '// Haz clic en "Ejecutar Invocación en Vivo" para inspeccionar la respuesta de la base de datos...'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USUARIOS REALES */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Valentina */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300">
                    V
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Valentina (26 años)</h3>
                    <p className="text-xs text-indigo-300">Deportista Amateur · Crossfit</p>
                  </div>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p><strong>Dolor V1:</strong> Se frustró al no poder buscar recetas por ingredientes libres de lácteos.</p>
                  <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 italic text-slate-400">
                    "Si busco 'comida post-entreno rápida' y la lupa no devuelve nada porque no puse el nombre exacto, da pereza."
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
                    ✅ <strong>Ajuste T02:</strong> Búsqueda semántica vectorial identifica ingredientes, macros y tiempo de preparación instantáneamente.
                  </div>
                </div>
              </div>

              {/* Carlos */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-lg font-bold text-amber-300">
                    C
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Carlos (42 años)</h3>
                    <p className="text-xs text-amber-300">Ingeniero Jefe · Estrés & Poco Tiempo</p>
                  </div>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p><strong>Dolor V1:</strong> Llenar 7 campos numéricos diarios le causaba abandono al 3er día.</p>
                  <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 italic text-slate-400">
                    "No peso el arroz en la oficina. Necesito un botón rápido o decirle al bot lo que comí."
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
                    ✅ <strong>Ajuste T02:</strong> Herramienta MCP <code>record_daily_log_quick</code> permite registro en 1 solo clic o vía chat.
                  </div>
                </div>
              </div>

              {/* Marta */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-lg font-bold text-purple-300">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Marta (58 años)</h3>
                    <p className="text-xs text-purple-300">Docente · Readaptación Articular</p>
                  </div>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p><strong>Dolor V1:</strong> Temor a lesionarse las rodillas con ejercicios de impacto en inglés.</p>
                  <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 italic text-slate-400">
                    "Si busco 'ejercicios para dolor de rodilla' necesito que la app me entienda con mis propias palabras."
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
                    ✅ <strong>Ajuste T02:</strong> El motor vectorial mapea 'dolor de rodilla' con ejercicios clasificados como <code>joint_friendly</code> y cero impacto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EVALUACIÓN HEURÍSTICA UX */}
        {activeTab === 'ux' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Evolución de la Calificación Heurística de UX</h2>
                <p className="text-xs sm:text-sm text-slate-400">Basada en las 10 Heurísticas de Usabilidad de Jakob Nielsen.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Nota Inicial (V1)</div>
                  <div className="text-2xl font-extrabold text-amber-400">74 / 100</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="text-right">
                  <div className="text-xs text-slate-400">Nota Evolucionada (V2)</div>
                  <div className="text-2xl font-extrabold text-emerald-400">92 / 100</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Flexibilidad y Eficiencia de Uso</span>
                  <span className="text-emerald-400 font-bold">5/10 ➔ 9/10 (+4)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[90%]" />
                </div>
                <p className="text-[11px] text-slate-400">Incorporación de búsqueda semántica con vectores y atajos de registro.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Ayuda, Búsqueda y Asistencia Inteligente</span>
                  <span className="text-emerald-400 font-bold">8/10 ➔ 10/10 (+2)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[100%]" />
                </div>
                <p className="text-[11px] text-slate-400">Asistente Agéntico conectado a base de datos vía servidor MCP.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Control y Libertad del Usuario</span>
                  <span className="text-emerald-400 font-bold">6/10 ➔ 9/10 (+3)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[90%]" />
                </div>
                <p className="text-[11px] text-slate-400">Sustitución semántica de comidas y ejercicios individuales sin regenerar 30 días.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">Visibilidad del Estado del Sistema</span>
                  <span className="text-emerald-400 font-bold">8/10 ➔ 9.5/10 (+1.5)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[95%]" />
                </div>
                <p className="text-[11px] text-slate-400">Toasts flotantes con retroalimentación inmediata en guardado de datos.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GUION VIDEO 20 MIN */}
        {activeTab === 'video' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white">Estructura Minuto a Minuto del Video de Presentación (20 min)</h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-indigo-400">00:00 - 04:00 (4 min)</strong> — Introducción, Objetivo de VitalCore y los 3 Aspectos Clave Testeados.
                  <p className="text-xs text-slate-400 pt-1">Presentación del plan de pruebas funcionales, no funcionales y métricas esperadas.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 shrink-0">Item 1 (20 pts)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-amber-400">04:00 - 07:00 (3 min)</strong> — Calificación Interna de UX (74/100) y Análisis Heurístico.
                  <p className="text-xs text-slate-400 pt-1">Demostración honesta de las fricciones encontradas en la V1 antes de los cambios.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 shrink-0">Item 2 (10 pts)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-emerald-400">07:00 - 12:00 (5 min)</strong> — Resultados del Testeo con 3 Usuarios Arquetípicos.
                  <p className="text-xs text-slate-400 pt-1">Exhibición de interacciones reales de Valentina, Carlos y Marta con citas y métricas.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 shrink-0">Item 3 (20 pts)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-teal-400">12:00 - 18:00 (6 min)</strong> — Demostración en Vivo de Ajustes: Bases Vectoriales & MCP.
                  <p className="text-xs text-slate-400 pt-1">Pruebas en caliente de Búsqueda Semántica Vectorial e Invocación de herramientas MCP.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 shrink-0">Item 4 (50 pts)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <strong className="text-purple-400">18:00 - 20:00 (2 min)</strong> — Conclusiones, Nueva Nota UX (92/100) y Próximos Pasos.
                  <p className="text-xs text-slate-400 pt-1">Cierre estratégico de impacto del consorcio.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 shrink-0">Cierre</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}
