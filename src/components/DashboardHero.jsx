import { useState } from 'react'
import { TrendingUp, TrendingDown, Eye, EyeOff, Building2, Landmark } from 'lucide-react'

const fmt = (n) => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `$${(abs / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  return `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

const fmtFull = (n) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function MonthProgressBar() {
  const hoy = new Date()
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diaActual = hoy.getDate()
  const pct = Math.round((diaActual / diasEnMes) * 100)
  const diasRestantes = diasEnMes - diaActual
  const mesNombre = hoy.toLocaleDateString('es', { month: 'long' })
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider capitalize">{mesNombre}</span>
        <span className="text-[10px] text-white/60">{diaActual}/{diasEnMes} · {diasRestantes}d restantes</span>
      </div>
      <div className="h-1 bg-white/15 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardHero({
  saldo,
  totalIngresos,
  totalGastos,
  tasaAhorro,
  dailyBudget,
  textoHora,
  nombreUsuario,
  totalCuentas = 0,
  netWorth = 0,
  cuentas = [],
}) {
  const [hidden, setHidden] = useState(false)
  const flujoPositivo = saldo >= 0
  const ahorroPct = Math.round((Number(tasaAhorro) || 0) * 100)

  // Cuenta principal — Salem Five o la que tenga más fondos
  const cuentaPrincipal = cuentas.length > 0
    ? [...cuentas].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))[0]
    : null

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 pt-2 pb-1">

      {/* SALUDO */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-accent-positive font-semibold">{textoHora}</p>
          <h1 className="text-xl font-black text-ink leading-tight truncate max-w-[240px]">{nombreUsuario}</h1>
        </div>
        <button
          onClick={() => setHidden(v => !v)}
          className="p-2 bg-canvas-surface rounded-xl border border-canvas-border text-ink-muted active:bg-canvas-elevated shadow-sm transition-colors touch-manipulation"
          aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* HERO CARD — Total en cuentas (número principal) */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 mb-3 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%)',
          border: '1px solid rgba(59,130,246,0.30)',
        }}
      >
        {/* Glow sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)' }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest mb-1.5">
              Total en cuentas
            </p>
            {hidden ? (
              <span className="text-4xl font-black text-white/40 tracking-tight">••••••</span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white/60">$</span>
                <span className="text-5xl font-black tracking-tight leading-none text-white">
                  {Math.abs(totalCuentas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <p className="text-[10px] text-white/40 mt-1">Lo que tienes ahora en todas tus cuentas</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/25">
            <Landmark className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Fila secundaria: Patrimonio + Flujo del mes */}
        {!hidden && (
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div className="bg-white/5 border border-white/8 rounded-2xl px-3 py-2">
              <p className="text-[9px] text-white/45 uppercase tracking-wider font-bold">Patrimonio neto</p>
              <p className={`text-base font-black mt-0.5 ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netWorth < 0 ? '-' : ''}{fmt(netWorth)}
              </p>
              <p className="text-[8px] text-white/30 mt-0.5">Cuentas − deudas</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl px-3 py-2">
              <p className="text-[9px] text-white/45 uppercase tracking-wider font-bold">Flujo {new Date().toLocaleDateString('es', { month: 'short' })}</p>
              <p className={`text-base font-black mt-0.5 ${flujoPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                {saldo < 0 ? '-' : '+'}{fmt(saldo)}
              </p>
              <p className="text-[8px] text-white/30 mt-0.5">{ahorroPct}% ahorro</p>
            </div>
          </div>
        )}

        <MonthProgressBar />
      </div>

      {/* STATS ROW — Ingresos / Gastos del mes */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-canvas-border bg-canvas-surface shadow-card">
          <div className="p-1.5 bg-accent-positive/20 rounded-xl shrink-0">
            <TrendingUp className="w-4 h-4 text-accent-positive" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-ink-muted uppercase font-black tracking-wide">Ingresos</p>
            <p className="text-sm font-bold text-ink">{hidden ? '••••' : fmt(totalIngresos)}</p>
            <p className="text-[9px] text-ink-faint">registrados este mes</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-canvas-border bg-canvas-surface shadow-card">
          <div className="p-1.5 bg-accent-negative/20 rounded-xl shrink-0">
            <TrendingDown className="w-4 h-4 text-accent-negative" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-ink-muted uppercase font-black tracking-wide">Gastos</p>
            <p className="text-sm font-bold text-ink">{hidden ? '••••' : fmt(totalGastos)}</p>
            <p className="text-[9px] text-ink-faint">confirmados pagados</p>
          </div>
        </div>
      </div>

      {/* CUENTAS RÁPIDAS — máximo 3 */}
      {!hidden && cuentas.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cuentas.length, 3)}, 1fr)` }}>
          {[...cuentas]
            .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
            .slice(0, 3)
            .map(c => (
              <div key={c.id} className="bg-canvas-surface border border-canvas-border rounded-2xl px-3 py-2 shadow-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3 h-3 text-ink-faint" />
                  <p className="text-[9px] text-ink-faint truncate font-bold uppercase tracking-wide">{c.nombre || c.tipo}</p>
                </div>
                <p className="text-sm font-black text-ink">{fmtFull(Number(c.balance || 0))}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
