// SpendingInsights.jsx — Análisis inteligente de gastos + anomalías automáticas
import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

const EMOJI_CAT = {
  'Comida': '🍔', 'Restaurante': '🍽️', 'Supermercado': '🛒', 'Transporte': '🚗',
  'Entretenimiento': '🎬', 'Salud': '💊', 'Ropa': '👗', 'Educación': '📚',
  'Servicios': '💡', 'Tecnología': '💻', 'Hogar': '🏠', 'Mascotas': '🐾',
}
const catEmoji = (cat) => EMOJI_CAT[cat] || '📦'

function getWeeklyBuckets(gastos) {
  const hoy = new Date()
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - (6 - i))
    return {
      dia: d.toLocaleDateString('es', { weekday: 'short' }),
      fecha: d.toISOString().split('T')[0],
      total: 0,
    }
  })
  gastos.forEach(g => {
    const f = g.fecha?.split('T')[0]
    const b = buckets.find(b => b.fecha === f)
    if (b) b.total += Number(g.monto || 0)
  })
  return buckets
}

function getCategoryAnomaly(gastosMes, gastosAnterior) {
  const sumCat = (arr) => {
    const m = {}
    arr.forEach(g => {
      const c = g.categoria || 'Otros'
      m[c] = (m[c] || 0) + Number(g.monto || 0)
    })
    return m
  }
  const curr = sumCat(gastosMes)
  const prev = sumCat(gastosAnterior)

  return Object.entries(curr)
    .filter(([cat, val]) => {
      const p = prev[cat]
      return p && p > 0 && val > p * 1.3 && val > 50
    })
    .map(([cat, val]) => ({
      cat,
      curr: val,
      prev: prev[cat],
      pct: Math.round(((val - prev[cat]) / prev[cat]) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
}

function getTopCategories(gastos) {
  const m = {}
  gastos.forEach(g => {
    const c = g.categoria || 'Otros'
    m[c] = (m[c] || 0) + Number(g.monto || 0)
  })
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, val]) => ({ cat, val }))
}

const CustomDayTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-2.5 py-1.5 rounded-xl text-xs font-bold"
      style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-gray-400 capitalize">{label}</p>
      <p className="text-white">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  )
}

export default function SpendingInsights({ gastosMes = [], gastosAnterior = [], totalIngresos = 0 }) {
  const weekly = useMemo(() => getWeeklyBuckets(gastosMes), [gastosMes])
  const anomalies = useMemo(() => getCategoryAnomaly(gastosMes, gastosAnterior), [gastosMes, gastosAnterior])
  const topCats = useMemo(() => getTopCategories(gastosMes), [gastosMes])
  const totalMes = useMemo(() => gastosMes.reduce((s, g) => s + Number(g.monto || 0), 0), [gastosMes])
  const totalAnt = useMemo(() => gastosAnterior.reduce((s, g) => s + Number(g.monto || 0), 0), [gastosAnterior])

  const weeklyTotal = weekly.reduce((s, b) => s + b.total, 0)
  const avgDaily = weeklyTotal / 7

  const deltaMes = totalAnt > 0 ? Math.round(((totalMes - totalAnt) / totalAnt) * 100) : null
  const mesOk = deltaMes === null || deltaMes <= 0

  if (gastosMes.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-4 space-y-3">

      {/* ── ENCABEZADO ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/15 rounded-lg">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Insights de gastos</h3>
        </div>
        {deltaMes !== null && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${mesOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {mesOk ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {deltaMes > 0 ? '+' : ''}{deltaMes}% vs mes ant.
          </span>
        )}
      </div>

      {/* ── GRID: Gráfica semanal + top categorías ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Gráfica semanal (área) */}
        <div className="rounded-2xl p-4 border border-white/8"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-gray-300">Gasto últimos 7 días</p>
              <p className="text-xl font-black text-white mt-0.5">${weeklyTotal.toLocaleString('es', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Promedio/día</p>
              <p className="text-sm font-bold text-indigo-300">${avgDaily.toLocaleString('es', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={weekly} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomDayTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2}
                fill="url(#weekGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Mini eje días */}
          <div className="flex justify-between mt-1">
            {weekly.map((b, i) => (
              <span key={i} className="text-[9px] text-gray-600 capitalize">{b.dia}</span>
            ))}
          </div>
        </div>

        {/* Top categorías */}
        <div className="rounded-2xl p-4 border border-white/8"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(245,158,11,0.03) 100%)' }}>
          <p className="text-xs font-bold text-gray-300 mb-3">Top categorías este mes</p>
          <div className="space-y-2.5">
            {topCats.map(({ cat, val }, i) => {
              const pct = totalMes > 0 ? (val / totalMes) * 100 : 0
              const colors = ['#f97316', '#f59e0b', '#ef4444', '#8b5cf6']
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{catEmoji(cat)}</span>
                      <span className="text-xs font-semibold text-gray-200 truncate max-w-[110px]">{cat}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">${val.toLocaleString('es', { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] text-gray-500">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: colors[i] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── ANOMALÍAS ── */}
      {anomalies.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 overflow-hidden"
          style={{ background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-300">Alertas de gasto detectadas</span>
          </div>
          <div className="divide-y divide-white/5">
            {anomalies.map(({ cat, curr, prev, pct }) => (
              <div key={cat} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{catEmoji(cat)}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{cat}</p>
                    <p className="text-[10px] text-gray-500">Este mes ${curr.toLocaleString('es',{maximumFractionDigits:0})} · Ant. ${prev.toLocaleString('es',{maximumFractionDigits:0})}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400">+{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sin anomalías — positivo ── */}
      {anomalies.length === 0 && mesOk && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/6 border border-emerald-500/15">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-300">Gastos bajo control</p>
            <p className="text-[10px] text-gray-500">No hay anomalías respecto al mes anterior</p>
          </div>
        </div>
      )}
    </div>
  )
}
