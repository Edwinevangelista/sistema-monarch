// src/components/PanelSaludFinanciera.jsx
// Panel de salud financiera — diseñado para usuarios normales, sin jerga
// Score ring · Patrimonio · Carga de Deudas · Ahorro · Fondo · 50/30/20

import React, { useState, useMemo } from 'react'
import { Shield, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Info } from 'lucide-react'

// Explicaciones en lenguaje simple para cada métrica
const TIPS = {
  score:    'Calcula tu salud financiera basándose en tus ahorros, deudas y gastos fijos.',
  netWorth: 'Es lo que tendrías si pagaras todas tus deudas hoy. Cuentas bancarias menos lo que debes.',
  dti:      'De cada $100 que ganas, ¿cuántos van a pagar deudas? Menos del 20% es ideal.',
  ahorro:   'De cada $100 que ganas, ¿cuántos estás ahorrando? La meta profesional es el 20% o más.',
  fondo:    'Meta: tener ahorrado el equivalente a 3 meses de gastos fijos por si algo sale mal.',
}

export default function PanelSaludFinanciera({ kpis, cuentas = [] }) {
  const [expandido, setExpandido] = useState(false)
  const [tipActivo, setTipActivo] = useState(null)

  const {
    financialHealth = 0,
    netWorth = 0,
    dti = 0,
    regla503020 = { necesidades: 0, deseos: 0, ahorro: 0 },
    totalGastosFijos = 0,
    totalSuscripciones = 0,
  } = kpis

  // ── Fondo de Emergencia ─────────────────────────────────────────
  const { totalActivos, metaFondo, mesesCubiertos, progresoFondo } = useMemo(() => {
    const esenciales = totalGastosFijos + totalSuscripciones
    const activos    = cuentas.reduce((s, c) => s + Number(c.balance || 0), 0)
    const meta       = esenciales * 3
    const meses      = meta > 0 ? Math.min(3, activos / esenciales) : (activos > 0 ? 3 : 0)
    const prog       = meta > 0 ? Math.min(100, (activos / meta) * 100) : (activos > 0 ? 100 : 0)
    return { totalActivos: activos, metaFondo: meta, mesesCubiertos: meses, progresoFondo: prog }
  }, [cuentas, totalGastosFijos, totalSuscripciones])

  // ── Colores por umbral ──────────────────────────────────────────
  const scoreColor = financialHealth >= 75 ? '#34d399' : financialHealth >= 50 ? '#fbbf24' : '#f87171'
  const dtiColor  = dti === 0 ? '#6b7280' : dti <= 20 ? '#34d399' : dti <= 36 ? '#fbbf24' : '#f87171'
  const dtiLabel  = dti === 0 ? 'Sin deudas 🎉'
    : dti <= 20 ? 'Carga baja ✓'
    : dti <= 36 ? 'Carga media — OK'
    : 'Carga alta — revisar ⚠️'

  const ahorroPct    = regla503020.ahorro || 0
  const ahorroColor  = ahorroPct >= 20 ? '#34d399' : ahorroPct >= 10 ? '#fbbf24' : '#f87171'
  const fondoColor   = progresoFondo >= 100 ? '#34d399' : progresoFondo >= 67 ? '#fbbf24' : '#f87171'

  // ── Score ring ──────────────────────────────────────────────────
  const radius      = 30
  const circunf     = 2 * Math.PI * radius
  const arcLen      = Math.max(0, (financialHealth / 100) * circunf)

  // ── Formato números ─────────────────────────────────────────────
  const fmtNW = (v) => {
    const abs = Math.abs(v)
    const sign = v >= 0 ? '+' : '-'
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 10_000)    return `${sign}$${(abs / 1_000).toFixed(1)}K`
    return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

  // ── Chip con tooltip ────────────────────────────────────────────
  const Chip = ({ label, valor, color, tipKey }) => (
    <button
      onClick={() => setTipActivo(tipActivo === tipKey ? null : tipKey)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold touch-manipulation active:opacity-70 transition-opacity"
      style={{ color, borderColor: `${color}35`, background: `${color}10` }}
    >
      {label}: {valor}
      <Info className="w-3 h-3 opacity-50" />
    </button>
  )

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

        <div className="p-4">

          {/* ── FILA PRINCIPAL: Score ring · Métricas ── */}
          <div className="flex items-center gap-4">

            {/* Score ring con contexto */}
            <div className="flex flex-col items-center shrink-0 select-none">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Tu salud</p>
              <button
                onClick={() => setTipActivo(tipActivo === 'score' ? null : 'score')}
                className="relative rounded-full p-1 touch-manipulation"
                style={{ background: `${scoreColor}10` }}
              >
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                  <circle cx="36" cy="36" r={radius}
                    fill="none" stroke={scoreColor} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${arcLen} ${circunf}`}
                    style={{ filter: `drop-shadow(0 0 5px ${scoreColor}88)`, transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[22px] font-black text-white leading-none">{financialHealth}</span>
                  <span className="text-[9px] text-gray-500">/100</span>
                </div>
              </button>
              <p className="text-[10px] font-bold mt-1.5 text-center leading-tight max-w-[72px]"
                style={{ color: scoreColor }}>
                {financialHealth >= 75 ? 'Saludable ✓'
                  : financialHealth >= 50 ? 'Regular'
                  : 'En riesgo'}
              </p>
            </div>

            {/* Métricas derechas */}
            <div className="flex-1 min-w-0 space-y-3">

              {/* Lo que tendrías (Net Worth) */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 mb-0.5">
                  Lo que tendrías si pagaras todo
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[22px] font-black tabular-nums leading-none ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtNW(netWorth)}
                  </span>
                  {netWorth >= 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-500/60 shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-red-500/60 shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">cuentas bancarias menos deudas</p>
              </div>

              {/* Chips Deudas · Ahorro */}
              <div className="flex items-center gap-2 flex-wrap">
                <Chip
                  label="Deudas"
                  valor={`${dti}% · ${dtiLabel}`}
                  color={dtiColor}
                  tipKey="dti"
                />
                <Chip
                  label="Ahorro"
                  valor={`${ahorroPct}%${ahorroPct >= 20 ? ' ✓' : ' (meta 20%)'}`}
                  color={ahorroColor}
                  tipKey="ahorro"
                />
              </div>
            </div>
          </div>

          {/* ── Tooltip activo ── */}
          {tipActivo && TIPS[tipActivo] && (
            <div className="mt-3 px-3 py-2.5 rounded-2xl bg-white/6 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
              <p className="text-xs text-gray-300 leading-relaxed">{TIPS[tipActivo]}</p>
            </div>
          )}

          {/* ── Fondo de Emergencia ── */}
          <div className="mt-4 pt-3.5 border-t border-white/6">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setTipActivo(tipActivo === 'fondo' ? null : 'fondo')}
                className="flex items-center gap-1.5 touch-manipulation"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: fondoColor }} />
                <span className="text-xs font-bold text-gray-300">Fondo de Emergencia</span>
                <Info className="w-3 h-3 text-gray-600" />
              </button>
              <span className="text-[11px] font-semibold" style={{ color: fondoColor }}>
                {mesesCubiertos < 3
                  ? `${mesesCubiertos.toFixed(1)} de 3 meses`
                  : '✅ Completo'}
              </span>
            </div>

            {/* Barra */}
            <div className="h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progresoFondo}%`,
                  background: `linear-gradient(90deg, ${fondoColor}bb, ${fondoColor})`,
                  boxShadow: progresoFondo >= 100 ? `0 0 8px ${fondoColor}55` : 'none',
                }} />
            </div>

            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-gray-500">
                Tienes: <strong className="text-gray-300">${fmt(totalActivos)}</strong>
              </span>
              <span className="text-[11px] text-gray-500">
                Meta: <strong className="text-gray-300">${fmt(metaFondo)}</strong>
                {metaFondo === 0 && <span className="text-gray-600"> (agrega gastos fijos)</span>}
              </span>
            </div>
          </div>

          {/* ── Toggle 50/30/20 ── */}
          <button
            onClick={() => setExpandido(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 mt-3 pt-2.5 border-t border-white/6 text-xs font-medium text-gray-500 hover:text-gray-300 active:opacity-70 transition-colors touch-manipulation"
          >
            {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expandido ? 'Ocultar distribución' : '¿Cómo distribuyo mis ingresos?'}
          </button>

          {/* ── EXPANDIDO: Regla 50/30/20 en lenguaje simple ── */}
          {expandido && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">

              <div>
                <p className="text-sm font-bold text-white mb-0.5">Distribución de tus ingresos</p>
                <p className="text-[11px] text-gray-500">La regla ideal: 50% necesidades · 30% personal · 20% ahorro</p>
              </div>

              {/* Barra apilada */}
              <div className="h-6 rounded-xl overflow-hidden flex"
                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
                {[
                  { pct: regla503020.necesidades || 0, maxOk: 50, colOk: 'linear-gradient(90deg,#3b82f6,#2563eb)', colOver: 'linear-gradient(90deg,#ef4444,#dc2626)' },
                  { pct: Math.min(100 - (regla503020.necesidades||0), regla503020.deseos||0), maxOk: 30, colOk: 'linear-gradient(90deg,#8b5cf6,#7c3aed)', colOver: 'linear-gradient(90deg,#d946ef,#c026d3)' },
                  { pct: regla503020.ahorro || 0, maxOk: 0, colOk: 'linear-gradient(90deg,#10b981,#059669)', colOver: 'linear-gradient(90deg,#10b981,#059669)' },
                ].map((seg, i) => (
                  <div key={i}
                    className="h-full transition-all duration-700 flex items-center justify-center"
                    style={{
                      width: `${seg.pct}%`,
                      background: seg.pct > seg.maxOk && seg.maxOk > 0 ? seg.colOver : seg.colOk,
                      minWidth: seg.pct > 3 ? undefined : 0,
                    }}
                  >
                    {seg.pct > 8 && (
                      <span className="text-[10px] font-black text-white/90">{seg.pct}%</span>
                    )}
                  </div>
                ))}
                <div className="flex-1 h-full bg-white/4" />
              </div>

              {/* Leyenda con contexto */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: '🏠', label: 'Gastos fijos', sublabel: 'renta, deudas, servicios', pct: regla503020.necesidades||0, meta: 50, colOk: '#3b82f6', colOver: '#ef4444' },
                  { emoji: '🛍️', label: 'Día a día', sublabel: 'comida, salidas, gustos', pct: regla503020.deseos||0, meta: 30, colOk: '#8b5cf6', colOver: '#d946ef' },
                  { emoji: '💰', label: 'Ahorro', sublabel: 'meta mínima 20%', pct: ahorroPct, meta: 20, colOk: '#10b981', colOver: '#10b981', metaAbajo: true },
                ].map(({ emoji, label, sublabel, pct, meta, colOk, colOver, metaAbajo }) => {
                  const overLimit = metaAbajo ? pct < meta : pct > meta
                  const color = overLimit ? colOver : colOk
                  return (
                    <div key={label} className="flex flex-col items-center gap-1 rounded-2xl p-2.5 bg-white/4 border border-white/6">
                      <span className="text-lg">{emoji}</span>
                      <span className="text-[11px] font-bold text-gray-300 text-center leading-tight">{label}</span>
                      <span className="text-base font-black tabular-nums" style={{ color }}>{pct}%</span>
                      <span className="text-[9px] text-gray-600 text-center leading-tight">{sublabel}</span>
                      <span className="text-[9px] text-gray-600">meta: {meta}%{metaAbajo ? '+' : ''}</span>
                    </div>
                  )
                })}
              </div>

              {/* Consejo personalizado en lenguaje simple */}
              {ahorroPct < 20 && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-amber-500/8 border border-amber-500/18">
                  <p className="text-xs text-amber-300 leading-relaxed">
                    <strong>💡 Consejo:</strong>{' '}
                    {regla503020.necesidades > 50
                      ? `Tus gastos fijos están muy altos (${regla503020.necesidades}%). Revisa suscripciones y pagos de deudas — ahí está el margen.`
                      : regla503020.deseos > 30
                      ? `Estás gastando demasiado en el día a día (${regla503020.deseos}%). Pequeñas reducciones ahí liberan mucho ahorro.`
                      : `Para llegar al 20% de ahorro, necesitas guardar $${(((20 - ahorroPct) / 100) * (kpis.totalIngresos || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })} más por mes.`
                    }
                  </p>
                </div>
              )}
              {ahorroPct >= 20 && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/18">
                  <p className="text-xs text-emerald-300">
                    ✅ Estás ahorrando {ahorroPct}% de tus ingresos — ¡por encima del 20% recomendado!
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
