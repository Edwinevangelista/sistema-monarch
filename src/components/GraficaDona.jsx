// GraficaDona.jsx — 2026: Gastos por categoría, informativo e interactivo
import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const PALETTE = [
  { fill: '#10b981', glow: 'rgba(16,185,129,0.3)', light: 'bg-emerald-500' },
  { fill: '#6366f1', glow: 'rgba(99,102,241,0.3)', light: 'bg-indigo-500' },
  { fill: '#f59e0b', glow: 'rgba(245,158,11,0.3)', light: 'bg-amber-500' },
  { fill: '#ef4444', glow: 'rgba(239,68,68,0.3)', light: 'bg-red-500' },
  { fill: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', light: 'bg-violet-500' },
  { fill: '#ec4899', glow: 'rgba(236,72,153,0.3)', light: 'bg-pink-500' },
  { fill: '#14b8a6', glow: 'rgba(20,184,166,0.3)', light: 'bg-teal-500' },
  { fill: '#f97316', glow: 'rgba(249,115,22,0.3)', light: 'bg-orange-500' },
]

const GraficaDona = ({ data, onCategoryClick }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [activeIdx, setActiveIdx] = useState(null)

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm font-semibold text-gray-400">Sin gastos registrados</p>
        <p className="text-xs text-gray-600 mt-1">Agrega gastos para ver el desglose por categoría</p>
      </div>
    )
  }

  const total = data.reduce((s, i) => s + i.value, 0)
  // Top 5 categorías ordenadas por monto
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const top5 = sorted.slice(0, 5)
  const maxVal = top5[0]?.value || 1

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    const idx = data.findIndex(d => d.name === item.name)
    const pal = PALETTE[idx % PALETTE.length]
    const pct = ((item.value / total) * 100).toFixed(1)
    return (
      <div
        className="rounded-2xl p-3 min-w-[140px]"
        style={{
          background: 'rgba(10,15,30,0.97)',
          border: `1px solid ${pal.fill}40`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px ${pal.fill}20`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pal.fill }} />
          <span className="text-xs font-bold text-white">{item.name}</span>
        </div>
        <p className="text-lg font-black" style={{ color: pal.fill }}>${item.value.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{pct}% del total</p>
      </div>
    )
  }

  // Categoría activa para el centro de la dona
  const centroData = activeIdx != null ? data[activeIdx] : hoveredIdx != null ? data[hoveredIdx] : null
  const centroPct = centroData ? ((centroData.value / total) * 100).toFixed(0) : null

  return (
    <div className="w-full">
      {/* ── LAYOUT: dona + top categorías ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* Dona */}
        <div className="w-full md:w-48 shrink-0 relative">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={82}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={(_, idx) => {
                  setActiveIdx(activeIdx === idx ? null : idx)
                  if (onCategoryClick) onCategoryClick(data[idx])
                }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {data.map((entry, index) => {
                  const pal = PALETTE[index % PALETTE.length]
                  const isActive = activeIdx === index || hoveredIdx === index
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={pal.fill}
                      opacity={activeIdx != null && activeIdx !== index ? 0.3 : 1}
                      stroke={isActive ? pal.fill : 'transparent'}
                      strokeWidth={isActive ? 2 : 0}
                    />
                  )
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centro de la dona — texto dinámico */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centroData ? (
              <>
                <span className="text-xs font-black text-white leading-tight max-w-[60px] text-center truncate">
                  {centroData.name}
                </span>
                <span className="text-lg font-black text-white">{centroPct}%</span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-white">${total.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Top 5 categorías con barras */}
        <div className="flex-1 w-full space-y-2.5">
          {top5.map((item, i) => {
            const origIdx = data.findIndex(d => d.name === item.name)
            const pal = PALETTE[origIdx % PALETTE.length]
            const pct = ((item.value / total) * 100).toFixed(1)
            const barWidth = ((item.value / maxVal) * 100).toFixed(0)
            const isActive = activeIdx === origIdx

            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveIdx(isActive ? null : origIdx)
                  if (onCategoryClick) onCategoryClick(item)
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] touch-manipulation border ${
                  isActive
                    ? 'bg-white/8 border-white/15'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Rank */}
                    <span className="text-[10px] font-black text-gray-600 w-3 shrink-0">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pal.fill }} />
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-white">${item.value.toLocaleString()}</span>
                    <span className="text-[9px] text-gray-500 font-medium">{pct}%</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background: pal.fill,
                      boxShadow: isActive ? `0 0 6px ${pal.glow}` : 'none',
                    }}
                  />
                </div>
              </button>
            )
          })}

          {/* Ver más si hay más de 5 categorías */}
          {data.length > 5 && (
            <button
              onClick={onCategoryClick}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all border border-dashed border-white/8 touch-manipulation"
            >
              <TrendingUp className="w-3 h-3" />
              +{data.length - 5} categorías más · Ver todo
            </button>
          )}
        </div>
      </div>

      {/* ── RESUMEN RÁPIDO ── */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/6">
        <div className="text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-1">Categorías</p>
          <p className="text-sm font-black text-white">{data.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-1">Mayor gasto</p>
          <p className="text-xs font-bold text-red-400 truncate">{sorted[0]?.name}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-1">Promedio</p>
          <p className="text-sm font-black text-white">${Math.round(total / data.length).toLocaleString()}</p>
        </div>
      </div>

      {/* Nota toca para ver detalle */}
      <p className="text-center text-[10px] text-gray-700 mt-2 flex items-center justify-center gap-1">
        <TrendingDown className="w-3 h-3" />
        Toca una categoría para ver el detalle
      </p>
    </div>
  )
}

export default GraficaDona
