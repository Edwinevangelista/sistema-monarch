import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Color map — Tailwind classes per severity/type
// ---------------------------------------------------------------------------
const COLOR_MAP = {
  red: {
    card: 'bg-red-500/10 border-red-500/20',
    icon: 'bg-red-500/15',
    title: 'text-red-300',
    msg: 'text-red-200/70',
    badge: 'bg-red-500/20 text-red-300',
  },
  amber: {
    card: 'bg-amber-500/10 border-amber-500/20',
    icon: 'bg-amber-500/15',
    title: 'text-amber-300',
    msg: 'text-amber-200/70',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  emerald: {
    card: 'bg-emerald-500/10 border-emerald-500/20',
    icon: 'bg-emerald-500/15',
    title: 'text-emerald-300',
    msg: 'text-emerald-200/70',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  blue: {
    card: 'bg-blue-500/10 border-blue-500/20',
    icon: 'bg-blue-500/15',
    title: 'text-blue-300',
    msg: 'text-blue-200/70',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  purple: {
    card: 'bg-purple-500/10 border-purple-500/20',
    icon: 'bg-purple-500/15',
    title: 'text-purple-300',
    msg: 'text-purple-200/70',
    badge: 'bg-purple-500/20 text-purple-300',
  },
}

// ---------------------------------------------------------------------------
// Core recommendation engine — pure function, no side effects
// ---------------------------------------------------------------------------
function generarTips({
  totalIngresos,
  totalGastos,
  tasaAhorro,
  topCategoria,
  suscripciones,
  deudas,
}) {
  const tips = []

  // --- Tip 1: Savings rate (always included) ---
  if (tasaAhorro < 0.1) {
    tips.push({
      icon: '🚨',
      color: 'red',
      titulo: 'Ahorro crítico',
      msg: `Estás ahorrando solo ${(tasaAhorro * 100).toFixed(0)}% de tus ingresos. La meta mínima es 10%.`,
    })
  } else if (tasaAhorro < 0.2) {
    tips.push({
      icon: '💡',
      color: 'amber',
      titulo: 'Mejora tu ahorro',
      msg: `Ahorras ${(tasaAhorro * 100).toFixed(0)}%. Con pequeños ajustes puedes llegar al 20%.`,
    })
  } else {
    tips.push({
      icon: '🎯',
      color: 'emerald',
      titulo: '¡Excelente ahorro!',
      msg: `Ahorras ${(tasaAhorro * 100).toFixed(0)}% de tus ingresos. Estás por encima de la meta del 20%.`,
    })
  }

  // --- Tip 2: Top spending category ---
  if (topCategoria && totalGastos > 0) {
    tips.push({
      icon: '📊',
      color: 'blue',
      titulo: `Tu mayor gasto: ${topCategoria.cat}`,
      msg: `Gastas $${topCategoria.val.toLocaleString('es', { maximumFractionDigits: 0 })} en ${topCategoria.cat} este mes (${((topCategoria.val / totalGastos) * 100).toFixed(0)}% de tus gastos).`,
    })
  }

  // --- Tip 3: Subscriptions ---
  const subsActivas = Array.isArray(suscripciones)
    ? suscripciones.filter((s) => s.estado === 'Activo')
    : []
  const totalSubs = subsActivas.reduce((sum, x) => sum + Number(x.costo || 0), 0)
  if (totalSubs > totalIngresos * 0.05) {
    tips.push({
      icon: '📱',
      color: 'purple',
      titulo: 'Suscripciones altas',
      msg: `Pagas $${totalSubs.toLocaleString('es', { maximumFractionDigits: 0 })}/mes en suscripciones (${((totalSubs / totalIngresos) * 100).toFixed(0)}% de ingresos). Revisa cuáles usas realmente.`,
    })
  }

  // --- Tip 4: High debt ---
  const debtList = Array.isArray(deudas) ? deudas : []
  const totalDeudas = debtList.reduce((sum, d) => sum + Number(d.saldo || 0), 0)
  if (totalDeudas > totalIngresos * 3) {
    tips.push({
      icon: '⚠️',
      color: 'red',
      titulo: 'Deuda elevada',
      msg: `Tu deuda total ($${(totalDeudas / 1000).toFixed(1)}k) supera 3 meses de ingresos. Prioriza pagarla.`,
    })
  }

  // --- Tip 5: All-green bonus ---
  const hasRedTip = tips.some((t) => t.color === 'red')
  if (!hasRedTip && tasaAhorro >= 0.2) {
    tips.push({
      icon: '🏆',
      color: 'emerald',
      titulo: 'Finanzas saludables',
      msg: 'Tus métricas están en verde. Considera invertir el excedente en fondos indexados.',
    })
  }

  return tips.slice(0, 3)
}

// ---------------------------------------------------------------------------
// Derive top-spending category from gastosMes array
// gastosMes expected shape: [{ categoria: string, monto: number }, ...]
// ---------------------------------------------------------------------------
function calcTopCategoria(gastosMes) {
  if (!Array.isArray(gastosMes) || gastosMes.length === 0) return null

  // Aggregate by category
  const bycat = {}
  for (const g of gastosMes) {
    const cat = g.categoria || g.category || 'Sin categoría'
    bycat[cat] = (bycat[cat] || 0) + Number(g.monto || g.amount || 0)
  }

  const entries = Object.entries(bycat)
  if (entries.length === 0) return null

  const [cat, val] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))
  return val > 0 ? { cat, val } : null
}

// ---------------------------------------------------------------------------
// TipCard — single recommendation card
// ---------------------------------------------------------------------------
function TipCard({ tip, index }) {
  const c = COLOR_MAP[tip.color] || COLOR_MAP.blue

  return (
    <div
      // Fade-in staggered via inline style + CSS transition
      style={{
        animationDelay: `${index * 80}ms`,
        // Ensure cards are visible even without JS animation support
      }}
      className={[
        // Layout
        'flex-shrink-0 flex flex-col gap-2 p-3 rounded-xl border',
        // Width: fixed on mobile scroll, full on desktop stack
        'w-[200px] sm:w-full',
        // Colors
        c.card,
        // Animation: fade-in via Tailwind animate-none + custom CSS class below
        'smarttip-card',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${c.icon}`}>
        {tip.icon}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-bold leading-tight ${c.title}`}>
          {tip.titulo}
        </span>
        <span className={`text-[11px] leading-snug ${c.msg}`}>
          {tip.msg}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SmartTips — main export
// ---------------------------------------------------------------------------
export default function SmartTips({
  totalIngresos = 0,
  totalGastos = 0,
  tasaAhorro = 0,
  gastosMes = [],
  gastosAnterior = [],   // available for future tips (month-over-month delta)
  gastosFijos = [],      // available for future tips
  suscripciones = [],
  deudas = [],
}) {
  // Guard: no income data yet
  if (!totalIngresos || totalIngresos === 0) return null

  // Derive top category from raw expense rows
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const topCategoria = useMemo(() => calcTopCategoria(gastosMes), [gastosMes])

  // Generate personalized tips — re-runs whenever any dependency changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tips = useMemo(
    () =>
      generarTips({
        totalIngresos,
        totalGastos,
        tasaAhorro,
        topCategoria,
        gastosFijos,
        suscripciones,
        deudas,
        gastosMes,
        gastosAnterior,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalIngresos, totalGastos, tasaAhorro, topCategoria, suscripciones, deudas]
  )

  if (tips.length === 0) return null

  return (
    <>
      {/*
        Inline <style> for the fade-in animation.
        Avoids framer-motion dependency while keeping smooth entrance.
      */}
      <style>{`
        .smarttip-card {
          opacity: 0;
          transform: translateY(6px);
          animation: smarttip-fadein 0.35s ease forwards;
        }
        @keyframes smarttip-fadein {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/50 tracking-wide uppercase">
            💡 Recomendaciones para ti
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
            {tips.length}
          </span>
        </div>

        {/*
          Mobile: horizontal scroll strip (overflow-x-auto, no-wrap)
          Desktop (sm+): vertical stack (flex-col)
        */}
        <div className="flex sm:flex-col gap-2 overflow-x-auto pb-1 sm:overflow-x-visible sm:pb-0 scrollbar-hide">
          {tips.map((tip, i) => (
            <TipCard key={`${tip.titulo}-${i}`} tip={tip} index={i} />
          ))}
        </div>
      </section>
    </>
  )
}
