// src/components/ComparativoMensual.jsx
// Compara este mes vs el mes anterior en ingresos y gastos variables
// Usa los datos ya cargados en el dashboard — sin queries adicionales

import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'

export default function ComparativoMensual({ ingresos = [], gastos = [] }) {
  const [expandido, setExpandido] = useState(false)

  const { mesActual, mesAnterior, categorias, hayDatosPrevios } = useMemo(() => {
    const hoy = new Date()

    // Rango mes actual: día 1 hasta hoy
    const currStart = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const currEnd   = hoy

    // Rango mes anterior: día 1 hasta último día del mes pasado
    const prevStart = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const prevEnd   = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    const enRango = (fecha, ini, fin) => {
      if (!fecha) return false
      // Evitar problema de timezone agregando mediodía
      const d = new Date(fecha.includes('T') ? fecha : `${fecha}T12:00:00`)
      return d >= ini && d <= fin
    }

    const gastosCurrArr = gastos.filter(g => enRango(g.fecha, currStart, currEnd))
    const gastosPrevArr = gastos.filter(g => enRango(g.fecha, prevStart, prevEnd))
    const ingresosCurrArr = ingresos.filter(i => enRango(i.fecha, currStart, currEnd))
    const ingresosPrevArr = ingresos.filter(i => enRango(i.fecha, prevStart, prevEnd))

    const suma = arr => arr.reduce((s, r) => s + Number(r.monto || 0), 0)

    // Agrupación por categoría
    const catCurr = {}
    const catPrev = {}
    gastosCurrArr.forEach(g => {
      const c = g.categoria || '📦 Otros'
      catCurr[c] = (catCurr[c] || 0) + Number(g.monto || 0)
    })
    gastosPrevArr.forEach(g => {
      const c = g.categoria || '📦 Otros'
      catPrev[c] = (catPrev[c] || 0) + Number(g.monto || 0)
    })

    const cats = [...new Set([...Object.keys(catCurr), ...Object.keys(catPrev)])]
      .map(c => ({
        cat: c,
        curr: catCurr[c] || 0,
        prev: catPrev[c] || 0,
        delta: (catCurr[c] || 0) - (catPrev[c] || 0),
      }))
      .filter(c => c.curr > 0 || c.prev > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5)

    const prevGastos   = suma(gastosPrevArr)
    const prevIngresos = suma(ingresosPrevArr)

    return {
      mesActual: {
        nombre: hoy.toLocaleString('es', { month: 'long' }),
        gastos: suma(gastosCurrArr),
        ingresos: suma(ingresosCurrArr),
      },
      mesAnterior: {
        nombre: prevStart.toLocaleString('es', { month: 'long' }),
        gastos: prevGastos,
        ingresos: prevIngresos,
      },
      categorias: cats,
      hayDatosPrevios: prevGastos > 0 || prevIngresos > 0,
    }
  }, [ingresos, gastos])

  // No mostrar si no hay datos del mes anterior
  if (!hayDatosPrevios) return null

  // ── Delta helpers ────────────────────────────────────────────────
  const pct = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null

  const DeltaBadge = ({ curr, prev, menorEsMejor = false }) => {
    const p = pct(curr, prev)
    if (p === null) return null
    if (p === 0) return <Minus className="w-3 h-3 text-gray-600" />
    const isUp = p > 0
    const isGood = menorEsMejor ? !isUp : isUp
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}{p}%
      </span>
    )
  }

  const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

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

        <div className="p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs font-bold text-gray-300 capitalize">{mesActual.nombre}</p>
                <p className="text-[10px] text-gray-600">vs {mesAnterior.nombre}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
              Comparativo
            </span>
          </div>

          {/* Grid: Ingresos · Gastos */}
          <div className="grid grid-cols-2 gap-2.5">

            {/* Ingresos */}
            <div
              className="rounded-2xl p-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600/80 mb-1.5">
                Ingresos
              </p>
              <p className="text-lg font-black tabular-nums leading-none text-emerald-400">
                ${fmt(mesActual.ingresos)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-gray-600">${fmt(mesAnterior.ingresos)}</span>
                <DeltaBadge curr={mesActual.ingresos} prev={mesAnterior.ingresos} />
              </div>
            </div>

            {/* Gastos Variables */}
            <div
              className="rounded-2xl p-3"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-600/80 mb-1.5">
                Gastos Var.
              </p>
              <p className="text-lg font-black tabular-nums leading-none text-red-400">
                ${fmt(mesActual.gastos)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-gray-600">${fmt(mesAnterior.gastos)}</span>
                <DeltaBadge curr={mesActual.gastos} prev={mesAnterior.gastos} menorEsMejor />
              </div>
            </div>
          </div>

          {/* Toggle por categoría */}
          {categorias.length > 0 && (
            <>
              <button
                onClick={() => setExpandido(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 mt-3 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-400 transition-colors touch-manipulation"
              >
                {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expandido ? 'Ocultar' : 'Ver por categoría'}
              </button>

              {expandido && (
                <div className="mt-3 pt-3 border-t border-white/6 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {categorias.map(({ cat, curr, prev, delta }) => {
                    const emoji = cat.split(' ')[0]
                    const label = cat.split(' ').slice(1).join(' ') || cat
                    const isUp  = delta > 0
                    const maxVal = Math.max(curr, prev, 1)

                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0 w-5">{emoji}</span>
                          <span className="text-[11px] text-gray-400 flex-1 truncate">{label}</span>
                          <span className="text-[10px] text-gray-600 tabular-nums">${fmt(prev)}</span>
                          <span className="text-gray-700 text-xs">→</span>
                          <span className={`text-[11px] font-bold tabular-nums ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                            ${fmt(curr)}
                          </span>
                          <span className={`text-[10px] font-bold w-12 text-right tabular-nums ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isUp ? '+' : ''}{fmt(delta)}
                          </span>
                        </div>
                        {/* Mini barra comparativa */}
                        <div className="flex gap-1 items-center ml-7">
                          <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.round((curr / maxVal) * 100)}%`,
                                background: isUp
                                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                                  : 'linear-gradient(90deg, #34d399, #10b981)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
