// GraficaBarras.jsx — evolución mensual con modal de detalle completo
import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { TrendingUp, TrendingDown, X, ArrowRight } from 'lucide-react'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const SERIES = [
  { key: 'ingresos',        label: 'Ingresos',      color: '#10b981', dimColor: 'rgba(16,185,129,0.30)'  },
  { key: 'gastosVariables', label: '🛍️ Día a día',  color: '#f97316', dimColor: 'rgba(249,115,22,0.30)'  },
  { key: 'gastosFijos',     label: '🏠 Fijos',      color: '#f59e0b', dimColor: 'rgba(245,158,11,0.30)'  },
  { key: 'suscripciones',   label: '🔄 Suscripc.',  color: '#8b5cf6', dimColor: 'rgba(139,92,246,0.30)'  },
]

const fmt = n => Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

// ── Delta badge inline ────────────────────────────────────────────────────────
function Delta({ curr, prev, menorEsMejor = false }) {
  if (!prev || prev === 0) return null
  const pct = Math.round(((curr - prev) / Math.abs(prev)) * 100)
  if (pct === 0) return <span className="text-[10px] text-gray-600">sin cambio</span>
  const isUp   = pct > 0
  const isGood = menorEsMejor ? !isUp : isUp
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isUp ? '+' : ''}{pct}%
    </span>
  )
}

// ── Modal detalle del mes (completo) ─────────────────────────────────────────
function ModalDetalleMes({ data, prevData, gastosRaw = [], onClose }) {
  const [visible, setVisible]       = useState(true)
  const [tabActiva, setTabActiva]   = useState('resumen') // 'resumen' | 'categorias'

  const cerrar = () => { setVisible(false); setTimeout(onClose, 280) }

  // ── Categorías del mes — hook ANTES del early return ─────────────────────
  const categorias = useMemo(() => {
    if (!data) return []
    const [y, m] = data.mes.split('-').map(Number)
    const totales = {}
    gastosRaw.forEach(g => {
      if (!g.fecha) return
      const d = new Date(g.fecha.includes('T') ? g.fecha : `${g.fecha}T12:00:00`)
      if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return
      const cat = g.categoria || '📦 Otros'
      totales[cat] = (totales[cat] || 0) + Number(g.monto || 0)
    })
    return Object.entries(totales)
      .map(([cat, val]) => ({ cat, val }))
      .sort((a, b) => b.val - a.val)
  }, [data, gastosRaw])

  if (!data) return null

  const mesNombre  = MESES_LARGOS[parseInt(data.mes.split('-')[1]) - 1]
  const año        = data.mes.split('-')[0]
  const balance    = data.ingresos - data.totalGastos
  const tasaAhorro = data.ingresos > 0 ? Math.round((balance / data.ingresos) * 100) : 0
  const ahorroColor = tasaAhorro >= 20 ? '#34d399' : tasaAhorro >= 10 ? '#fbbf24' : '#f87171'

  // ── Donut data ─────────────────────────────────────────────────────────────
  const donutData = [
    { name: '🛍️ Día a día', value: data.gastosVariables, color: '#f97316' },
    { name: '🏠 Fijos',     value: data.gastosFijos,     color: '#f59e0b' },
    { name: '🔄 Suscripc.', value: data.suscripciones,   color: '#8b5cf6' },
    { name: '💰 Ahorro',    value: Math.max(0, balance),  color: '#34d399' },
  ].filter(d => d.value > 0)

  const maxCat = categorias[0]?.val || 1

  // ── Métricas comparativas ──────────────────────────────────────────────────
  const metrics = [
    { label: 'Ingresos',       curr: data.ingresos,        prev: prevData?.ingresos,        color: '#10b981' },
    { label: '🛍️ Día a día',  curr: data.gastosVariables,  prev: prevData?.gastosVariables,  color: '#f97316', menorEsMejor: true },
    { label: '💰 Lo ahorrado', curr: balance,               prev: prevData ? (prevData.ingresos - prevData.totalGastos) : null, color: ahorroColor },
    { label: '📊 Total gastos',curr: data.totalGastos,      prev: prevData?.totalGastos,     color: '#f87171', menorEsMejor: true },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(13,18,38,0.99) 0%, rgba(5,8,18,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 -24px 60px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
          maxHeight: '92dvh',
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Shimmer top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Detalle del mes</p>
            <h2 className="text-xl font-black text-white capitalize">{mesNombre} {año}</h2>
          </div>
          <button onClick={cerrar} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 hover:bg-white/15 transition-all touch-manipulation">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Balance hero */}
        <div className="mx-5 mb-3 p-4 rounded-2xl shrink-0"
          style={{
            background: balance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${balance >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                {balance >= 0 ? 'Lo ahorrado' : 'Déficit del mes'}
              </p>
              <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {balance >= 0 ? '+' : '-'}${fmt(balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-600 mb-0.5">Tasa de ahorro</p>
              <p className="text-lg font-black" style={{ color: ahorroColor }}>{tasaAhorro}%</p>
              <p className="text-[9px] text-gray-600">meta: 20%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mb-3 bg-white/5 rounded-xl p-0.5 gap-0.5 shrink-0">
          {[
            { key: 'resumen',    label: 'Resumen' },
            { key: 'categorias', label: 'Por categoría' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTabActiva(t.key)}
              className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-all touch-manipulation ${
                tabActiva === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6">

          {/* ── TAB: RESUMEN ── */}
          {tabActiva === 'resumen' && (
            <div className="space-y-4">

              {/* Donut chart: distribución del dinero */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">¿A dónde fue el dinero?</p>
                <div className="flex items-center gap-2">
                  {/* Donut */}
                  <div className="shrink-0" style={{ width: 120, height: 120 }}>
                    <PieChart width={120} height={120}>
                      <Pie
                        data={donutData}
                        cx={55} cy={55}
                        innerRadius={32} outerRadius={52}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={2}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                  {/* Leyenda manual */}
                  <div className="flex-1 space-y-2">
                    {donutData.map(d => {
                      const pct = data.ingresos > 0 ? Math.round((d.value / data.ingresos) * 100) : 0
                      return (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-[11px] text-gray-400 flex-1 truncate">{d.name}</span>
                          <span className="text-[11px] font-black text-white tabular-nums">{pct}%</span>
                          <span className="text-[10px] text-gray-600 tabular-nums w-14 text-right">${fmt(d.value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Comparativo vs mes anterior */}
              {prevData && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                    vs {MESES_LARGOS[parseInt(prevData.mes.split('-')[1]) - 1]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.map(m => (
                      <div key={m.label} className="px-3 py-2.5 rounded-2xl bg-white/4 border border-white/7">
                        <p className="text-[10px] text-gray-600 mb-1">{m.label}</p>
                        <p className="text-base font-black tabular-nums" style={{ color: m.color }}>
                          ${fmt(m.curr)}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-700">${fmt(m.prev ?? 0)}</span>
                          <Delta curr={m.curr} prev={m.prev} menorEsMejor={m.menorEsMejor} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barra de ingresos vs total */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                  <span>Ingresos: ${fmt(data.ingresos)}</span>
                  <span>Total gastado: ${fmt(data.totalGastos)}</span>
                </div>
                <div className="h-3 bg-white/8 rounded-full overflow-hidden flex gap-px">
                  {[
                    { key: 'gastosVariables', color: '#f97316' },
                    { key: 'gastosFijos',     color: '#f59e0b' },
                    { key: 'suscripciones',   color: '#8b5cf6' },
                  ].map(({ key, color }) => {
                    const w = data.ingresos > 0 ? (data[key] / data.ingresos) * 100 : 0
                    return w > 0.5 ? (
                      <div key={key} className="h-full" style={{ width: `${w}%`, backgroundColor: color, opacity: 0.9 }} />
                    ) : null
                  })}
                  {balance > 0 && (
                    <div className="h-full bg-emerald-500/50 flex-1" />
                  )}
                </div>
                <div className="flex justify-between text-[9px] text-gray-700 mt-1">
                  <span>🛍️ Día a día · 🏠 Fijos · 🔄 Suscripc.</span>
                  <span className="text-emerald-600">💰 Ahorro</span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CATEGORÍAS ── */}
          {tabActiva === 'categorias' && (
            <div className="space-y-3">
              {categorias.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Sin gastos variables registrados este mes</p>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Gastos día a día · {categorias.length} categorías
                  </p>
                  {categorias.map(({ cat, val }) => {
                    const emoji = cat.split(' ')[0]
                    const label = cat.split(' ').slice(1).join(' ') || cat
                    const pct   = Math.round((val / maxCat) * 100)
                    const pctIng = data.ingresos > 0 ? Math.round((val / data.ingresos) * 100) : 0
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-5 shrink-0">{emoji}</span>
                          <span className="text-xs text-gray-300 flex-1 truncate">{label || cat}</span>
                          <span className="text-[10px] text-gray-600">{pctIng}%</span>
                          <span className="text-xs font-black text-white tabular-nums">${fmt(val)}</span>
                        </div>
                        <div className="ml-7 h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #f97316, #ef4444)',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {/* Resumen total variables */}
                  <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total día a día</span>
                    <span className="text-sm font-black text-orange-400">${fmt(data.gastosVariables)}</span>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Close */}
        <div className="px-5 pb-5 pt-2 shrink-0 border-t border-white/6">
          <button onClick={cerrar} className="w-full py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all touch-manipulation active:scale-[0.98]">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Tooltip del chart ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  const balance = (data.ingresos || 0) - (data.totalGastos || 0)
  return (
    <div className="rounded-2xl p-3 min-w-[150px]" style={{ background: 'rgba(10,14,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
      <p className="text-white font-black text-xs mb-2">{data.mesNombre} {data.año}</p>
      <div className="space-y-1.5">
        {SERIES.map(s => data[s.key] > 0 && (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[10px] font-medium" style={{ color: s.color }}>{s.label}</span>
            </div>
            <span className="text-[10px] font-bold text-white">${data[s.key].toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-1.5 mt-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Ahorro</span>
          <span className={`text-[10px] font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : '-'}${fmt(balance)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GraficaBarras({
  ingresos      = [],
  gastos        = [],
  gastosFijos   = [],
  suscripciones = [],
  height        = 190,
}) {
  const [mesSel, setMesSel] = useState(null)

  const chartData = useMemo(() => {
    const map = {}

    ingresos.forEach(ing => {
      const d = new Date(ing.fecha)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[k]) map[k] = { mes: k, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[k].ingresos += Number(ing.monto) || 0
    })

    gastos.forEach(g => {
      const d = new Date(g.fecha)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[k]) map[k] = { mes: k, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[k].gastosVariables += Number(g.monto) || 0
    })

    const hoy    = new Date()
    const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    gastosFijos.forEach(gf => {
      if (!map[mesHoy]) map[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[mesHoy].gastosFijos += Number(gf.monto) || 0
    })
    suscripciones.forEach(sub => {
      if (sub.estado !== 'Activo') return
      if (!map[mesHoy]) map[mesHoy] = { mes: mesHoy, ingresos: 0, gastosFijos: 0, gastosVariables: 0, suscripciones: 0 }
      map[mesHoy].suscripciones += Number(sub.costo) || 0
    })

    return Object.values(map)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-7)
      .map(item => {
        const [año, numMes] = item.mes.split('-')
        return {
          ...item,
          mesNombre:  MESES_CORTOS[parseInt(numMes) - 1],
          año,
          totalGastos: item.gastosFijos + item.gastosVariables + item.suscripciones,
        }
      })
  }, [ingresos, gastos, gastosFijos, suscripciones])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
          <TrendingUp className="w-7 h-7 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Sin datos suficientes</p>
        <p className="text-xs text-gray-600 mt-1">Agrega ingresos y gastos para ver tu evolución</p>
      </div>
    )
  }

  const ultimo        = chartData[chartData.length - 1]
  const mesDato       = mesSel ? chartData.find(d => d.mes === mesSel) : null
  const mesIdx        = mesSel ? chartData.findIndex(d => d.mes === mesSel) : -1
  const prevMesDato   = mesIdx > 0 ? chartData[mesIdx - 1] : null
  const balanceActual = ultimo ? ultimo.ingresos - ultimo.totalGastos : 0
  const balancePct    = ultimo?.ingresos > 0 ? Math.min(100, Math.max(0, (balanceActual / ultimo.ingresos) * 100)) : 0

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-black text-white">Mes a mes</h3>
          </div>
          <p className="text-[11px] text-gray-600">Toca un mes para ver el detalle completo</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold shrink-0 ${
          balanceActual >= 0
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
        }`}>
          {balanceActual >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {balanceActual >= 0 ? '+' : '-'}${fmt(balanceActual)} este mes
        </div>
      </div>

      {/* Resumen visual mes actual */}
      {ultimo && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-white/4 border border-white/8">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">Gastos vs Ingresos</span>
              <span className={`font-bold ${balancePct > 20 ? 'text-emerald-400' : balancePct > 0 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {(100 - balancePct).toFixed(0)}% usado
              </span>
            </div>
            <div className="h-3 bg-white/8 rounded-full overflow-hidden flex">
              {[
                { key: 'gastosVariables', color: '#f97316' },
                { key: 'gastosFijos',     color: '#f59e0b' },
                { key: 'suscripciones',   color: '#8b5cf6' },
              ].map(({ key, color }) => {
                const val = ultimo[key] || 0
                const w   = ultimo.ingresos > 0 ? (val / ultimo.ingresos) * 100 : 0
                return w > 1 ? (
                  <div key={key} className="h-full" style={{ width: `${w}%`, backgroundColor: color, opacity: 0.85 }} />
                ) : null
              })}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] text-gray-600">Disponible</p>
            <p className={`text-sm font-black ${balanceActual >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              ${fmt(Math.abs(balanceActual))}
            </p>
          </div>
        </div>
      )}

      {/* Gráfica */}
      <div className="w-full rounded-2xl overflow-hidden" style={{ touchAction: 'pan-y', cursor: 'pointer' }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 6, right: 4, left: -28, bottom: 0 }}
            barGap={2}
            barCategoryGap="22%"
            onClick={payload => {
              if (payload?.activePayload?.[0]?.payload?.mes) {
                setMesSel(payload.activePayload[0].payload.mes)
              }
            }}
          >
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="mesNombre" stroke="transparent" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} height={28} />
            <YAxis stroke="transparent" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 10 }} />
            {SERIES.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.label} radius={[5, 5, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`${s.key}-${idx}`}
                    fill={entry.mes === mesSel ? s.color : idx === chartData.length - 1 ? s.color : s.dimColor}
                    opacity={mesSel && entry.mes !== mesSel && idx !== chartData.length - 1 ? 0.4 : 1}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 justify-center">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-gray-500 font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chips de mes */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {chartData.map((d, idx) => (
          <button
            key={d.mes}
            onClick={() => setMesSel(d.mes)}
            className="shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl transition-all touch-manipulation active:scale-95"
            style={{
              background: mesSel === d.mes ? 'rgba(99,102,241,0.2)' : idx === chartData.length - 1 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
              border: mesSel === d.mes ? '1px solid rgba(99,102,241,0.4)' : idx === chartData.length - 1 ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span className="text-[11px] font-black" style={{ color: mesSel === d.mes ? '#a5b4fc' : idx === chartData.length - 1 ? '#e5e7eb' : '#6b7280' }}>
              {d.mesNombre}
            </span>
            {idx === chartData.length - 1 && (
              <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider">Este mes</span>
            )}
          </button>
        ))}
      </div>

      {/* Botón ver detalle */}
      <button
        onClick={() => setMesSel(chartData[chartData.length - 1]?.mes)}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[12px] font-bold text-gray-400 hover:text-white hover:bg-white/6 transition-all border border-white/7 touch-manipulation active:scale-[0.98]"
      >
        Ver detalle del mes actual
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Modal */}
      {mesDato && (
        <ModalDetalleMes
          data={mesDato}
          prevData={prevMesDato}
          gastosRaw={gastos}
          onClose={() => setMesSel(null)}
        />
      )}
    </div>
  )
}
