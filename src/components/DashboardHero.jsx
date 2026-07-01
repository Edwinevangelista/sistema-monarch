import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Eye, EyeOff, Landmark, Building2 } from 'lucide-react'

const fmt = (n) => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `$${(abs / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  return `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

const fmtFull = (n) =>
  `$${Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function MonthBar() {
  const hoy = new Date()
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diaActual = hoy.getDate()
  const pct = Math.round((diaActual / diasEnMes) * 100)
  const diasRestantes = diasEnMes - diaActual
  const mes = hoy.toLocaleDateString('es', { month: 'long' })
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 capitalize">{mes}</span>
        <span className="text-[10px] text-white/40">{diaActual}/{diasEnMes} · {diasRestantes}d restantes</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-white/40"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

export default function DashboardHero({
  saldo = 0,
  totalIngresos = 0,
  totalGastos = 0,
  tasaAhorro = 0,
  textoHora,
  nombreUsuario,
  totalCuentas = 0,
  netWorth = 0,
  cuentas = [],
}) {
  const [hidden, setHidden] = useState(false)
  const flujoPositivo = saldo >= 0
  const ahorroPct = Math.round((Number(tasaAhorro) || 0) * 100)
  const mesCorto = new Date().toLocaleDateString('es', { month: 'short' })

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 pt-2 pb-1 space-y-3">

      {/* ── SALUDO ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-accent-positive">{textoHora}</p>
          <h1 className="text-[22px] font-black leading-tight tracking-tight text-ink truncate max-w-[220px]">
            {nombreUsuario}
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setHidden(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-canvas-border bg-canvas-surface text-ink-muted shadow-card transition-colors active:bg-canvas-elevated touch-manipulation"
          aria-label={hidden ? 'Mostrar montos' : 'Ocultar montos'}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* ── HERO CARD — Total en cuentas ── */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 shadow-glass"
        style={{
          background: 'linear-gradient(145deg, #0d1929 0%, #0a1220 40%, #071020 100%)',
          border: '1px solid rgba(96,165,250,0.18)',
        }}
      >
        {/* Ambient glow top-left */}
        <div
          className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        {/* Top sheen */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
        />

        {/* Header row */}
        <div className="relative flex items-start justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/70">
              Total en cuentas
            </p>
            <AnimatePresence mode="wait">
              {hidden ? (
                <motion.span
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-4xl font-black tracking-tight text-white/30"
                >
                  ••••••
                </motion.span>
              ) : (
                <motion.div
                  key="amount"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-2xl font-bold text-white/50">$</span>
                  <span className="text-5xl font-black leading-none tracking-tight text-white">
                    {Math.abs(totalCuentas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-1 text-[10px] text-white/30">Suma real de todas tus cuentas</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <Landmark className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        {/* Secondary tiles */}
        {!hidden && (
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div
              className="rounded-2xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Patrimonio neto</p>
              <p className={`mt-0.5 text-[17px] font-black ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netWorth < 0 ? '-' : ''}{fmt(netWorth)}
              </p>
              <p className="mt-0.5 text-[8px] text-white/25">Cuentas − deudas</p>
            </div>
            <div
              className="rounded-2xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Flujo {mesCorto}</p>
              <p className={`mt-0.5 text-[17px] font-black ${flujoPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                {saldo < 0 ? '-' : '+'}{fmt(saldo)}
              </p>
              <p className="mt-0.5 text-[8px] text-white/25">{ahorroPct}% ahorro</p>
            </div>
          </div>
        )}

        <MonthBar />
      </div>

      {/* ── STATS ROW — Ingresos / Gastos ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 rounded-2xl border border-canvas-border bg-canvas-surface p-3 shadow-card">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-positive/12 border border-accent-positive/20">
            <TrendingUp className="h-4 w-4 text-accent-positive" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-ink-faint">Ingresos</p>
            <p className="text-sm font-black text-ink">{hidden ? '••••' : fmt(totalIngresos)}</p>
            <p className="text-[9px] text-ink-faint">este mes</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-canvas-border bg-canvas-surface p-3 shadow-card">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-negative/12 border border-accent-negative/20">
            <TrendingDown className="h-4 w-4 text-accent-negative" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-ink-faint">Gastos</p>
            <p className="text-sm font-black text-ink">{hidden ? '••••' : fmt(totalGastos)}</p>
            <p className="text-[9px] text-ink-faint">confirmados</p>
          </div>
        </div>
      </div>

      {/* ── CUENTAS — máximo 3 ── */}
      {!hidden && cuentas.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(cuentas.length, 3)}, 1fr)` }}
        >
          {[...cuentas]
            .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
            .slice(0, 3)
            .map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-canvas-border bg-canvas-surface px-3 py-2.5 shadow-card"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-ink-faint" />
                  <p className="truncate text-[9px] font-bold uppercase tracking-wide text-ink-faint">
                    {c.nombre || c.tipo}
                  </p>
                </div>
                <p className="text-[13px] font-black text-ink">{fmtFull(c.balance)}</p>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  )
}
