// src/components/PanelSaludFinanciera.jsx
// Panel de salud financiera — Score ring · Patrimonio · DTI · 50/30/20 · Fondo de Emergencia

import React, { useState, useMemo } from 'react'
import { Shield, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'

export default function PanelSaludFinanciera({ kpis, cuentas = [] }) {
  const [expandido, setExpandido] = useState(false)

  const {
    financialHealth = 0,
    netWorth = 0,
    dti = 0,
    regla503020 = { necesidades: 0, deseos: 0, ahorro: 0 },
    totalGastosFijos = 0,
    totalSuscripciones = 0,
  } = kpis

  // ── Fondo de Emergencia ─────────────────────────────────────────
  // Estándar profesional: 3 meses de gastos esenciales (fijos + subs)
  const { totalActivos, metaFondo, mesesCubiertos, progresoFondo } = useMemo(() => {
    const gastosEsenciales = totalGastosFijos + totalSuscripciones
    const activos = cuentas.reduce((s, c) => s + Number(c.balance || 0), 0)
    const meta = gastosEsenciales * 3
    const meses = meta > 0
      ? Math.min(3, activos / gastosEsenciales)
      : activos > 0 ? 3 : 0
    const progreso = meta > 0 ? Math.min(100, (activos / meta) * 100) : (activos > 0 ? 100 : 0)
    return { totalActivos: activos, metaFondo: meta, mesesCubiertos: meses, progresoFondo: progreso }
  }, [cuentas, totalGastosFijos, totalSuscripciones])

  // ── Score ring ──────────────────────────────────────────────────
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const strokeDash = Math.max(0, (financialHealth / 100) * circumference)

  const scoreConfig =
    financialHealth >= 75
      ? { color: '#34d399', label: 'Saludable', bg: 'rgba(52,211,153,0.08)' }
      : financialHealth >= 50
      ? { color: '#fbbf24', label: 'Regular',   bg: 'rgba(251,191,36,0.08)'  }
      : { color: '#f87171', label: 'En riesgo', bg: 'rgba(248,113,113,0.08)' }

  // ── DTI config ──────────────────────────────────────────────────
  const dtiConfig =
    dti === 0   ? { color: '#6b7280', label: 'Sin deudas' }
    : dti <= 20 ? { color: '#34d399', label: 'Excelente'  }
    : dti <= 36 ? { color: '#fbbf24', label: 'Aceptable'  }
    :             { color: '#f87171', label: 'Alto ⚠️'    }

  // ── Ahorro config ───────────────────────────────────────────────
  const ahorroPct = regla503020.ahorro || 0
  const ahorroConfig =
    ahorroPct >= 20 ? { color: '#34d399' }
    : ahorroPct >= 10 ? { color: '#fbbf24' }
    :                   { color: '#f87171' }

  // ── Net Worth format ────────────────────────────────────────────
  const nwAbs = Math.abs(netWorth)
  const nwStr = nwAbs >= 1_000_000
    ? `${netWorth < 0 ? '-' : '+'}$${(nwAbs / 1_000_000).toFixed(1)}M`
    : nwAbs >= 10_000
    ? `${netWorth < 0 ? '-' : '+'}$${(nwAbs / 1_000).toFixed(1)}K`
    : `${netWorth >= 0 ? '+' : '-'}$${nwAbs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  // ── Fondo color ─────────────────────────────────────────────────
  const fondoColor =
    progresoFondo >= 100 ? '#34d399' : progresoFondo >= 67 ? '#fbbf24' : '#f87171'

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

        <div className="p-4">

          {/* ── ROW PRINCIPAL: Score ring · Patrimonio · Chips ── */}
          <div className="flex items-center gap-4">

            {/* Score ring SVG */}
            <div className="flex flex-col items-center shrink-0 select-none">
              <div
                className="relative rounded-full p-1"
                style={{ background: scoreConfig.bg }}
              >
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                  {/* Track */}
                  <circle cx="36" cy="36" r={radius}
                    fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6.5" />
                  {/* Progress arc */}
                  <circle cx="36" cy="36" r={radius}
                    fill="none"
                    stroke={scoreConfig.color}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{
                      filter: `drop-shadow(0 0 5px ${scoreConfig.color}88)`,
                      transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)',
                    }}
                  />
                </svg>
                {/* Score overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[22px] font-black text-white leading-none">{financialHealth}</span>
                  <span className="text-[9px] text-gray-500 font-medium">/100</span>
                </div>
              </div>
              <span className="text-[10px] font-bold mt-1.5 tracking-wide"
                style={{ color: scoreConfig.color }}>{scoreConfig.label}</span>
            </div>

            {/* Lado derecho: Net Worth + chips DTI/Ahorro */}
            <div className="flex-1 min-w-0 space-y-2.5">

              {/* Net Worth */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-0.5">
                  Patrimonio Neto
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-black tabular-nums leading-none ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {nwStr}
                  </span>
                  {netWorth >= 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-500/50 shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-red-500/50 shrink-0" />}
                </div>
                <p className="text-[9px] text-gray-600 mt-0.5">cuentas bancarias − deudas</p>
              </div>

              {/* Chips: DTI + Ahorro */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  style={{
                    color: dtiConfig.color,
                    borderColor: `${dtiConfig.color}35`,
                    background: `${dtiConfig.color}10`,
                  }}
                >
                  DTI {dti}% · {dtiConfig.label}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  style={{
                    color: ahorroConfig.color,
                    borderColor: `${ahorroConfig.color}35`,
                    background: `${ahorroConfig.color}10`,
                  }}
                >
                  Ahorro {ahorroPct}% {ahorroPct >= 20 ? '✓' : '· meta 20%'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Fondo de Emergencia — siempre visible ── */}
          <div className="mt-4 pt-3 border-t border-white/6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: fondoColor }} />
                <span className="text-xs font-bold text-gray-300">Fondo de Emergencia</span>
              </div>
              <span className="text-[10px] text-gray-500">
                {mesesCubiertos < 3
                  ? `${mesesCubiertos.toFixed(1)} / 3 meses`
                  : '✅ 3 meses cubiertos'}
              </span>
            </div>

            {/* Barra progreso */}
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progresoFondo}%`,
                  background: `linear-gradient(90deg, ${fondoColor}cc, ${fondoColor})`,
                  boxShadow: progresoFondo >= 100 ? `0 0 8px ${fondoColor}66` : 'none',
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-600">
                {metaFondo > 0
                  ? `Meta: $${metaFondo.toLocaleString('en-US', { maximumFractionDigits: 0 })} (3 meses de gastos fijos)`
                  : 'Agrega gastos fijos para calcular la meta'}
              </span>
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: fondoColor }}>
                ${totalActivos.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* ── Toggle para 50/30/20 ── */}
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full flex items-center justify-center gap-1.5 mt-3 pt-2 text-[11px] font-medium text-gray-600 hover:text-gray-400 active:opacity-70 transition-colors touch-manipulation"
          >
            {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expandido ? 'Ocultar análisis' : 'Ver distribución 50/30/20'}
          </button>

          {/* ── EXPANDIDO: Regla 50/30/20 ── */}
          {expandido && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-300">Regla 50 / 30 / 20</p>
                <p className="text-[10px] text-gray-500">Necesidades · Deseos · Ahorro</p>
              </div>

              {/* Barra apilada */}
              <div
                className="h-5 rounded-xl overflow-hidden flex"
                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
              >
                {/* Necesidades */}
                <div
                  className="h-full transition-all duration-700 flex items-center justify-center"
                  style={{
                    width: `${Math.min(100, regla503020.necesidades || 0)}%`,
                    background: (regla503020.necesidades || 0) > 50
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                    minWidth: (regla503020.necesidades || 0) > 3 ? undefined : 0,
                  }}
                >
                  {(regla503020.necesidades || 0) > 8 && (
                    <span className="text-[9px] font-black text-white/90">{regla503020.necesidades}%</span>
                  )}
                </div>

                {/* Deseos */}
                <div
                  className="h-full transition-all duration-700 flex items-center justify-center"
                  style={{
                    width: `${Math.min(100 - (regla503020.necesidades || 0), regla503020.deseos || 0)}%`,
                    background: (regla503020.deseos || 0) > 30
                      ? 'linear-gradient(90deg, #d946ef, #c026d3)'
                      : 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                    minWidth: (regla503020.deseos || 0) > 3 ? undefined : 0,
                  }}
                >
                  {(regla503020.deseos || 0) > 8 && (
                    <span className="text-[9px] font-black text-white/90">{regla503020.deseos}%</span>
                  )}
                </div>

                {/* Ahorro */}
                <div
                  className="h-full transition-all duration-700 flex items-center justify-center"
                  style={{
                    width: `${regla503020.ahorro || 0}%`,
                    background: (regla503020.ahorro || 0) >= 20
                      ? 'linear-gradient(90deg, #10b981, #059669)'
                      : 'linear-gradient(90deg, #6b7280, #4b5563)',
                    minWidth: (regla503020.ahorro || 0) > 3 ? undefined : 0,
                  }}
                >
                  {(regla503020.ahorro || 0) > 6 && (
                    <span className="text-[9px] font-black text-white/90">{regla503020.ahorro}%</span>
                  )}
                </div>

                {/* Resto no asignado */}
                <div className="flex-1 h-full bg-white/4" />
              </div>

              {/* Leyenda */}
              <div className="grid grid-cols-3 gap-1 mt-2.5">
                {[
                  {
                    label: 'Necesidades',
                    pct: regla503020.necesidades || 0,
                    meta: 50,
                    color: (regla503020.necesidades || 0) > 50 ? '#ef4444' : '#3b82f6',
                    dot: (regla503020.necesidades || 0) > 50 ? '#ef4444' : '#3b82f6',
                  },
                  {
                    label: 'Deseos',
                    pct: regla503020.deseos || 0,
                    meta: 30,
                    color: (regla503020.deseos || 0) > 30 ? '#d946ef' : '#8b5cf6',
                    dot: (regla503020.deseos || 0) > 30 ? '#d946ef' : '#8b5cf6',
                  },
                  {
                    label: 'Ahorro',
                    pct: regla503020.ahorro || 0,
                    meta: 20,
                    color: (regla503020.ahorro || 0) >= 20 ? '#10b981' : '#f87171',
                    dot: (regla503020.ahorro || 0) >= 20 ? '#10b981' : '#6b7280',
                  },
                ].map(({ label, pct, meta, color, dot }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: dot }} />
                    <span className="text-[9px] text-gray-500">{label}</span>
                    <span className="text-[11px] font-black" style={{ color }}>{pct}%</span>
                    <span className="text-[9px] text-gray-600">meta {meta}%</span>
                  </div>
                ))}
              </div>

              {/* Consejo contextual */}
              {regla503020.ahorro < 20 && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <p className="text-[11px] text-amber-300">
                    💡 Necesitas ahorrar <strong>{Math.max(0, 20 - ahorroPct)}%</strong> más.
                    {regla503020.deseos > 30 && ' Reducir gastos variables te ayudaría.'}
                    {regla503020.necesidades > 50 && ' Tus compromisos fijos son muy altos — revisa suscripciones o deudas.'}
                  </p>
                </div>
              )}
              {regla503020.ahorro >= 20 && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <p className="text-[11px] text-emerald-300">
                    ✅ ¡Excelente! Estás ahorrando {ahorroPct}% — por encima del 20% recomendado.
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
