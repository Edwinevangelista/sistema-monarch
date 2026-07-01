// src/components/ComparativoMensual.jsx
// Compara este mes vs el mes anterior — ingresos, gastos totales, y ahorro
// Recibe datos ya cargados en el dashboard — sin queries adicionales

import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, BarChart2
} from 'lucide-react'

export default function ComparativoMensual({
  ingresos    = [],
  gastos      = [],       // variables
  gastosFijos = [],
  suscripciones = [],
}) {
  const [expandido, setExpandido] = useState(false)

  const datos = useMemo(() => {
    const hoy = new Date()

    const currStart = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const currEnd   = hoy
    const prevStart = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const prevEnd   = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

    const enRango = (fecha, ini, fin) => {
      if (!fecha) return false
      const d = new Date(fecha.includes('T') ? fecha : `${fecha}T12:00:00`)
      return d >= ini && d <= fin
    }

    const suma = arr => arr.reduce((s, r) => s + Number(r.monto || 0), 0)

    // ── Variables ──────────────────────────────────────────────────
    const varCurr = gastos.filter(g => enRango(g.fecha, currStart, currEnd))
    const varPrev = gastos.filter(g => enRango(g.fecha, prevStart, prevEnd))

    // ── Ingresos ───────────────────────────────────────────────────
    const ingCurr = ingresos.filter(i => enRango(i.fecha, currStart, currEnd))
    const ingPrev = ingresos.filter(i => enRango(i.fecha, prevStart, prevEnd))

    // ── Fijos (mes completo ambos meses) ───────────────────────────
    const fijosCurr = gastosFijos.reduce((s, gf) => {
      // Solo contar fijos del mes actual (cualquier fijo = comprometido)
      return s + Number(gf.monto || 0)
    }, 0)
    const fijosPrev = fijosCurr // Los fijos son iguales mes a mes (misma base)

    // ── Suscripciones activas ──────────────────────────────────────
    const subsMensual = suscripciones
      .filter(s => s.estado !== 'Cancelado')
      .reduce((s, sub) => {
        const c = Number(sub.costo || 0)
        if (sub.ciclo === 'Anual')   return s + c / 12
        if (sub.ciclo === 'Semanal') return s + c * 4.33
        return s + c
      }, 0)

    // ── Totales ────────────────────────────────────────────────────
    const ingCurrTotal  = suma(ingCurr)
    const ingPrevTotal  = suma(ingPrev)
    const varCurrTotal  = suma(varCurr)
    const varPrevTotal  = suma(varPrev)
    const totalGastoCurr = varCurrTotal + fijosCurr + subsMensual
    const totalGastoPrev = varPrevTotal + fijosPrev + subsMensual
    const ahorroCurr     = ingCurrTotal - totalGastoCurr
    const ahorroPrev     = ingPrevTotal - totalGastoPrev

    // ── Categorías variables (top 5 por delta) ─────────────────────
    const catCurr = {}
    const catPrev = {}
    varCurr.forEach(g => {
      const c = g.categoria || '📦 Otros'
      catCurr[c] = (catCurr[c] || 0) + Number(g.monto || 0)
    })
    varPrev.forEach(g => {
      const c = g.categoria || '📦 Otros'
      catPrev[c] = (catPrev[c] || 0) + Number(g.monto || 0)
    })
    const categorias = [...new Set([...Object.keys(catCurr), ...Object.keys(catPrev)])]
      .map(c => ({ cat: c, curr: catCurr[c] || 0, prev: catPrev[c] || 0, delta: (catCurr[c] || 0) - (catPrev[c] || 0) }))
      .filter(c => c.curr > 0 || c.prev > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5)

    const hayDatos = ingPrevTotal > 0 || varPrevTotal > 0

    return {
      mesNombre:  hoy.toLocaleString('es', { month: 'long' }),
      prevNombre: prevStart.toLocaleString('es', { month: 'long' }),
      ing:  { curr: ingCurrTotal,   prev: ingPrevTotal },
      vars: { curr: varCurrTotal,   prev: varPrevTotal },
      fijos: { curr: fijosCurr,    prev: fijosPrev },
      subs: { curr: subsMensual,   prev: subsMensual },
      gastoTotal: { curr: totalGastoCurr, prev: totalGastoPrev },
      ahorro: { curr: ahorroCurr,  prev: ahorroPrev },
      categorias,
      hayDatos,
    }
  }, [ingresos, gastos, gastosFijos, suscripciones])

  if (!datos.hayDatos) {
    return (
      <div className="rounded-2xl border border-dashed border-canvas-border bg-canvas-elevated px-4 py-8 text-center">
        <p className="text-sm font-bold text-ink-muted">Sin datos suficientes para comparar</p>
        <p className="mt-1 text-xs text-ink-faint">Cuando tengas movimientos de al menos un mes, verás aquí el comparativo.</p>
      </div>
    )
  }

  // ── Helpers ──────────────────────────────────────────────────────
  const pct = (curr, prev) => prev !== 0 ? Math.round(((curr - prev) / Math.abs(prev)) * 100) : null
  const fmt = n => Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const fmtS = n => (n >= 0 ? '+' : '-') + '$' + fmt(n)

  // ── Headline: la historia del mes en una frase ───────────────────
  const deltaAhorro  = datos.ahorro.curr - datos.ahorro.prev
  const deltaGasto   = datos.gastoTotal.curr - datos.gastoTotal.prev

  const headline = (() => {
    if (deltaAhorro > 50)  return { texto: `Ahorraste ${fmtS(deltaAhorro)} más que en ${datos.prevNombre}`, color: '#34d399', icono: '🎉' }
    if (deltaAhorro < -50) return { texto: `Ahorraste ${fmtS(Math.abs(deltaAhorro))} menos que en ${datos.prevNombre}`, color: '#f87171', icono: '⚠️' }
    if (deltaGasto > 100)  return { texto: `Gastaste ${fmtS(deltaGasto)} más que en ${datos.prevNombre}`, color: '#fbbf24', icono: '📈' }
    if (deltaGasto < -100) return { texto: `Gastaste ${fmtS(Math.abs(deltaGasto))} menos — buen trabajo`, color: '#34d399', icono: '✅' }
    return { texto: `Mes muy similar a ${datos.prevNombre}`, color: '#9ca3af', icono: '〰️' }
  })()

  // ── Delta badge ──────────────────────────────────────────────────
  const DeltaBadge = ({ curr, prev, menorEsMejor = false }) => {
    const p = pct(curr, prev)
    if (p === null || p === 0) return <Minus className="w-3 h-3 text-ink-faint" />
    const isUp   = p > 0
    const isGood = menorEsMejor ? !isUp : isUp
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}{p}%
      </span>
    )
  }

  // ── Tarjeta métrica ──────────────────────────────────────────────
  const MetricCard = ({ label, curr, prev, menorEsMejor = false, isAhorro = false }) => {
    const isNeg   = curr < 0
    const color   = isAhorro ? (curr >= 0 ? '#34d399' : '#f87171') : undefined
    return (
      <div className="flex flex-col gap-1 px-3 py-2.5 rounded-2xl bg-canvas-elevated border border-canvas-border">
        <span className="text-[9px] font-bold uppercase tracking-widest text-ink-faint">{label}</span>
        <span className="text-base font-black tabular-nums leading-none"
          style={{ color: color || (isNeg ? '#f87171' : '#F0F2F5') }}>
          {isAhorro && curr >= 0 ? '+' : ''}{isAhorro && curr < 0 ? '-' : ''}${fmt(curr)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-ink-faint tabular-nums">${fmt(prev)}</span>
          <DeltaBadge curr={curr} prev={prev} menorEsMejor={menorEsMejor} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-canvas-border"
        style={{
          background: 'linear-gradient(135deg, rgba(15,18,25,1) 0%, rgba(8,11,17,1) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-ink-faint shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink capitalize">{datos.mesNombre}</p>
                <p className="text-[10px] text-ink-faint">vs {datos.prevNombre}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-faint bg-canvas-elevated px-2 py-0.5 rounded-full border border-canvas-border">
              Comparativo
            </span>
          </div>

          {/* ── Headline ── */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-3"
            style={{ background: `${headline.color}10`, border: `1px solid ${headline.color}25` }}
          >
            <span className="text-base shrink-0">{headline.icono}</span>
            <p className="text-xs font-semibold leading-snug capitalize" style={{ color: headline.color }}>
              {headline.texto}
            </p>
          </div>

          {/* ── 4 métricas en grid ── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MetricCard label="Ingresos"      curr={datos.ing.curr}        prev={datos.ing.prev}        />
            <MetricCard label="Total gastado" curr={datos.gastoTotal.curr} prev={datos.gastoTotal.prev} menorEsMejor />
            <MetricCard label="Gastos día a día" curr={datos.vars.curr}    prev={datos.vars.prev}       menorEsMejor />
            <MetricCard label="Lo ahorrado"   curr={datos.ahorro.curr}     prev={datos.ahorro.prev}     isAhorro />
          </div>

          {/* ── Desglose fijos + subs (siempre visible) ── */}
          <div className="grid grid-cols-2 gap-2 mb-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-canvas-elevated border border-canvas-border">
              <span className="text-[10px] text-ink-faint">🏠 Gastos fijos</span>
              <span className="text-[11px] font-bold text-accent-warning tabular-nums">${fmt(datos.fijos.curr)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-canvas-elevated border border-canvas-border">
              <span className="text-[10px] text-ink-faint">🔄 Suscripciones</span>
              <span className="text-[11px] font-bold text-indigo-400 tabular-nums">${fmt(datos.subs.curr)}</span>
            </div>
          </div>

          {/* ── Toggle categorías variables ── */}
          {datos.categorias.length > 0 && (
            <>
              <button
                onClick={() => setExpandido(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 mt-3 py-1.5 text-[11px] font-medium text-ink-faint hover:text-ink-muted transition-colors touch-manipulation"
              >
                {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expandido ? 'Ocultar detalle' : 'Ver gastos día a día por categoría'}
              </button>

              {expandido && (
                <div className="mt-3 pt-3 border-t border-canvas-border space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {datos.categorias.map(({ cat, curr, prev, delta }) => {
                    const emoji  = cat.split(' ')[0]
                    const label  = cat.split(' ').slice(1).join(' ') || cat
                    const isUp   = delta > 0
                    const maxVal = Math.max(curr, prev, 1)
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0 w-5">{emoji}</span>
                          <span className="text-[11px] text-ink-muted flex-1 truncate">{label}</span>
                          <span className="text-[10px] text-ink-faint tabular-nums">${fmt(prev)}</span>
                          <span className="text-ink-faint text-xs">→</span>
                          <span className={`text-[11px] font-bold tabular-nums ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
                            ${fmt(curr)}
                          </span>
                          <span className={`text-[10px] font-bold w-12 text-right tabular-nums ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isUp ? '+' : '-'}${fmt(Math.abs(delta))}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center ml-7">
                          <div className="flex-1 h-1 bg-canvas-elevated rounded-full overflow-hidden">
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
