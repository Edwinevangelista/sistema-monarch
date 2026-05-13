// src/components/PresupuestoCategorias.jsx
// Presupuesto por categoría — gasto real vs límite definido por el usuario
// Sincronizado con Supabase (perfiles.presupuesto_categorias)

import { useState, useMemo } from 'react'
import { Target, Edit3, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { usePresupuestoCategorias } from '../hooks/usePresupuestoCategorias'

// ── ProgressBar inline ──────────────────────────────────────────────────
function ProgBar({ pct, color }) {
  const w = Math.min(100, pct)
  return (
    <div className="h-2 rounded-full overflow-hidden mt-1.5"
      style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${w}%`,
          background: color,
          boxShadow: pct >= 90 ? `0 0 6px ${color.split(',')[0].replace('linear-gradient(90deg,', '')}55` : 'none',
        }}
      />
    </div>
  )
}

// ── Fila de categoría ────────────────────────────────────────────────────
function FilaCategoria({ cat, gastado, budget, onSetBudget }) {
  const [editando, setEditando] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const hasBudget  = budget > 0
  const pct        = hasBudget ? Math.round((gastado / budget) * 100) : null
  const excedido   = hasBudget && gastado > budget
  const restante   = hasBudget ? budget - gastado : null

  const color = !hasBudget
    ? 'linear-gradient(90deg, #6b7280, #4b5563)'
    : pct <= 70
    ? 'linear-gradient(90deg, #34d399, #10b981)'
    : pct <= 90
    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(90deg, #f87171, #ef4444)'

  const emoji = cat.split(' ')[0]
  const label = cat.split(' ').slice(1).join(' ') || cat

  const confirmar = () => {
    const v = parseFloat(inputVal)
    if (!isNaN(v) && v >= 0) onSetBudget(cat, v)
    setEditando(false)
  }

  const cancelar = () => setEditando(false)

  return (
    <div className="px-3 py-3 rounded-2xl border transition-colors"
      style={{
        background: excedido ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
        borderColor: excedido ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
      }}>

      <div className="flex items-center gap-2">
        {/* Emoji */}
        <span className="text-base shrink-0 w-6 text-center">{emoji}</span>

        {/* Nombre + monto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-300 truncate">{label || cat}</span>

            {/* Progreso o edición */}
            {editando ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  placeholder="límite"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') cancelar() }}
                  className="w-20 text-xs bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-400 tabular-nums"
                />
                <button onClick={confirmar} className="p-1 text-emerald-400 hover:text-emerald-300 touch-manipulation">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelar} className="p-1 text-gray-500 hover:text-gray-400 touch-manipulation">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                {hasBudget ? (
                  <span className={`text-xs font-bold tabular-nums ${excedido ? 'text-red-400' : 'text-gray-300'}`}>
                    ${gastado.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="text-gray-600 font-normal">/{budget.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 tabular-nums">
                    ${gastado.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                )}
                <button
                  onClick={() => { setInputVal(budget > 0 ? String(budget) : ''); setEditando(true) }}
                  className="p-1 text-gray-600 hover:text-indigo-400 touch-manipulation transition-colors"
                  title="Fijar límite"
                >
                  {hasBudget ? <Edit3 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Barra de progreso */}
          {hasBudget && <ProgBar pct={pct} color={color} />}

          {/* Mensaje de estado */}
          {hasBudget && !editando && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-600">
                {excedido
                  ? `⚠️ ${pct}% — excediste $${Math.abs(restante).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : `${pct}% usado`
                }
              </span>
              {!excedido && restante !== null && (
                <span className="text-[10px] text-gray-600">
                  te quedan <strong className="text-gray-400">${restante.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────
export default function PresupuestoCategorias({ gastos = [] }) {
  const { budgets, setBudget, loading } = usePresupuestoCategorias()
  const [expandido, setExpandido] = useState(false)

  // Gasto real del mes actual por categoría
  const categorias = useMemo(() => {
    const hoy   = new Date()
    const start = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const totales = {}
    gastos.forEach(g => {
      if (!g.fecha) return
      const d = new Date(g.fecha.includes('T') ? g.fecha : `${g.fecha}T12:00:00`)
      if (d < start || d > hoy) return
      const c = g.categoria || '📦 Otros'
      totales[c] = (totales[c] || 0) + Number(g.monto || 0)
    })

    return Object.entries(totales)
      .map(([cat, gastado]) => ({ cat, gastado }))
      .sort((a, b) => b.gastado - a.gastado)
  }, [gastos])

  const handleSetBudget = (cat, val) => setBudget(cat, val)

  // Resumen: cuántas categorías están en riesgo
  const catConBudget   = categorias.filter(c => (budgets[c.cat] || 0) > 0)
  const catExcedidas   = catConBudget.filter(c => c.gastado > budgets[c.cat])
  const catEnRiesgo    = catConBudget.filter(c => {
    const pct = c.gastado / budgets[c.cat]
    return pct >= 0.7 && c.gastado <= budgets[c.cat]
  })

  // Número de alerts para el header badge
  const alertCount = catExcedidas.length

  if (categorias.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Header — siempre visible */}
        <button
          onClick={() => setExpandido(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 touch-manipulation"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-gray-200">Presupuesto por categoría</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {catConBudget.length === 0
                  ? `${categorias.length} categorías este mes — toca ➕ para fijar límites`
                  : alertCount > 0
                  ? `${alertCount} categoría${alertCount > 1 ? 's' : ''} excedida${alertCount > 1 ? 's' : ''} ⚠️`
                  : catEnRiesgo.length > 0
                  ? `${catEnRiesgo.length} categoría${catEnRiesgo.length > 1 ? 's' : ''} cerca del límite`
                  : `${catConBudget.length} de ${categorias.length} categorías con límite ✓`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {alertCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {alertCount}
              </span>
            )}
            {expandido
              ? <ChevronUp className="w-4 h-4 text-gray-500" />
              : <ChevronDown className="w-4 h-4 text-gray-500" />
            }
          </div>
        </button>

        {/* Lista de categorías */}
        {expandido && (
          <div className="px-3 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-white/6 pt-3">

            {/* Summary row si hay budgets */}
            {catConBudget.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'OK', count: catConBudget.length - catExcedidas.length - catEnRiesgo.length, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
                  { label: 'Cerca', count: catEnRiesgo.length, color: 'text-amber-400', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)' },
                  { label: 'Excedida', count: catExcedidas.length, color: 'text-red-400', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)' },
                ].map(({ label, count, color, bg, border }) => (
                  <div key={label} className="flex flex-col items-center py-2 rounded-xl"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <span className={`text-base font-black tabular-nums ${color}`}>{count}</span>
                    <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {categorias.map(({ cat, gastado }) => (
              <FilaCategoria
                key={cat}
                cat={cat}
                gastado={gastado}
                budget={budgets[cat] || 0}
                onSetBudget={handleSetBudget}
              />
            ))}

            <p className="text-center text-[10px] text-gray-700 mt-2 pt-2 border-t border-white/5">
              {loading ? 'Sincronizando…' : '✓ Límites sincronizados en la nube'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
