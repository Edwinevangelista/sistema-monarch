import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Flame } from 'lucide-react'

const fmt = (n) => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`
  return `$${abs.toLocaleString('es', { maximumFractionDigits: 0 })}`
}

function MonthProgressBar() {
  const hoy = new Date()
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diaActual = hoy.getDate()
  const pct = Math.round((diaActual / diasEnMes) * 100)
  const diasRestantes = diasEnMes - diaActual
  const mesNombre = hoy.toLocaleDateString('es', { month: 'long' })

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider capitalize">{mesNombre}</span>
        <span className="text-[10px] text-white/70">{diaActual}/{diasEnMes} · {diasRestantes}d restantes</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
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
}) {
  const [hidden, setHidden] = useState(false)
  const saldoPositivo = saldo >= 0
  const ahorroPct = Math.round((Number(tasaAhorro) || 0) * 100)

  // "Seguro gastar hoy" — presupuesto diario sin sobrepasar lo ahorrado
  const safeToSpend = dailyBudget > 0 ? dailyBudget : 0

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 pt-2 pb-1">

      {/* ── SALUDO ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-accent-positive font-semibold">{textoHora}</p>
          <h1 className="text-xl font-black text-ink leading-tight truncate max-w-[240px]">
            {nombreUsuario}
          </h1>
        </div>
        <button
          onClick={() => setHidden(v => !v)}
          className="p-2 bg-base-surface rounded-xl border border-base-border text-ink-muted active:bg-base-elevated shadow-sm transition-colors touch-manipulation"
          aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* ── BALANCE CARD ── */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 mb-3 shadow-xl shadow-emerald-900/10"
        style={{
          background: saldoPositivo
            ? 'linear-gradient(135deg, #047857 0%, #0f9f8f 48%, #2563eb 100%)'
            : 'linear-gradient(135deg, #be123c 0%, #dc2626 48%, #f97316 100%)',
          border: saldoPositivo ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(248,113,113,0.45)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, transparent 34%, rgba(255,255,255,0.12) 100%)',
          }}
        />
        {/* Fila superior */}
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[10px] text-white/75 font-bold uppercase tracking-widest mb-1.5">Saldo del mes</p>
            <div className="flex items-baseline gap-1">
              {hidden
                ? <span className="text-4xl font-black text-white/70 tracking-tight">••••</span>
                : <>
                    <span className="text-xl font-bold text-white/70">
                      {saldo < 0 ? '-' : ''}$
                    </span>
                    <span className="text-5xl font-black tracking-tight leading-none text-white">
                      {Math.abs(saldo).toLocaleString('es', { maximumFractionDigits: 0 })}
                    </span>
                  </>
              }
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/18 border border-white/20 backdrop-blur-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Seguro gastar hoy */}
        {!hidden && (
          <div className="relative flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ borderColor: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.16)' }}>
              <Flame className="w-3 h-3 text-white" />
              <span className="text-[11px] font-bold text-white">
                {safeToSpend > 0 ? `${fmt(safeToSpend)}/día libre` : 'Presupuesto ajustado'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-white/90">
              {ahorroPct}% ahorro
            </span>
          </div>
        )}

        {/* Barra tasa ahorro */}
        {!hidden && (
          <div className="relative mt-4">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, ahorroPct))}%`,
                  background: '#ffffff',
                }}
              />
            </div>
            <p className="text-[9px] text-white/65 mt-1">Meta de ahorro: 20%</p>
          </div>
        )}

        {/* Progreso del mes */}
        <MonthProgressBar />
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-base-border bg-base-surface shadow-card">
          <div className="p-1.5 bg-accent-positive/20 rounded-xl shrink-0">
            <TrendingUp className="w-4 h-4 text-accent-positive" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-ink-muted uppercase font-black tracking-wide">Ingresos</p>
            <p className="text-sm font-bold text-ink">{hidden ? '••••' : fmt(totalIngresos)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-base-border bg-base-surface shadow-card">
          <div className="p-1.5 bg-accent-negative/20 rounded-xl shrink-0">
            <TrendingDown className="w-4 h-4 text-accent-negative" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-ink-muted uppercase font-black tracking-wide">Gastos</p>
            <p className="text-sm font-bold text-ink">{hidden ? '••••' : fmt(totalGastos)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
