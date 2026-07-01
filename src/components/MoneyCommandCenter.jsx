import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Banknote, CalendarClock, Gauge, Landmark, PiggyBank, ShieldCheck, WalletCards } from 'lucide-react'

const money = (value, options = {}) => {
  const abs = Math.abs(Number(value) || 0)
  const sign = Number(value) < 0 ? '-' : ''
  const digits = options.compact || abs >= 1000 ? 0 : 2
  return `${sign}$${abs.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits && !options.compact ? 2 : 0,
  })}`
}

const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`

const statusConfig = {
  saludable: {
    label: 'Flujo saludable',
    text: 'Tus números están bien. Sigue alimentando tus metas.',
    gradientFrom: 'rgba(52,211,153,0.12)',
    gradientTo: 'rgba(52,211,153,0.04)',
    border: 'rgba(52,211,153,0.20)',
    iconBg: 'rgba(52,211,153,0.15)',
    iconBorder: 'rgba(52,211,153,0.25)',
    iconColor: '#34D399',
    btnColor: 'bg-accent-positive text-canvas shadow-glow-positive',
    icon: ShieldCheck,
  },
  estable: {
    label: 'Flujo estable',
    text: 'Manejable. Mantén el registro al día.',
    gradientFrom: 'rgba(96,165,250,0.10)',
    gradientTo: 'rgba(96,165,250,0.03)',
    border: 'rgba(96,165,250,0.18)',
    iconBg: 'rgba(96,165,250,0.12)',
    iconBorder: 'rgba(96,165,250,0.22)',
    iconColor: '#60A5FA',
    btnColor: 'bg-accent-info text-canvas',
    icon: Gauge,
  },
  deuda_alta: {
    label: 'Deuda alta',
    text: 'Baja pagos mínimos antes de ampliar gastos.',
    gradientFrom: 'rgba(251,191,36,0.10)',
    gradientTo: 'rgba(251,191,36,0.03)',
    border: 'rgba(251,191,36,0.18)',
    iconBg: 'rgba(251,191,36,0.12)',
    iconBorder: 'rgba(251,191,36,0.22)',
    iconColor: '#FBBF24',
    btnColor: 'bg-accent-warning text-canvas',
    icon: AlertTriangle,
  },
  riesgo: {
    label: 'Flujo apretado',
    text: 'Los compromisos consumen tu efectivo.',
    gradientFrom: 'rgba(248,113,113,0.10)',
    gradientTo: 'rgba(248,113,113,0.03)',
    border: 'rgba(248,113,113,0.18)',
    iconBg: 'rgba(248,113,113,0.12)',
    iconBorder: 'rgba(248,113,113,0.22)',
    iconColor: '#F87171',
    btnColor: 'bg-accent-negative text-canvas',
    icon: AlertTriangle,
  },
}

function MetricCard({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    emerald: { bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.18)', color: '#34D399' },
    blue:    { bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.18)', color: '#60A5FA' },
    amber:   { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.18)', color: '#FBBF24' },
    rose:    { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.18)', color: '#F87171' },
    slate:   { bg: 'rgba(30,37,53,0.8)',    border: 'rgba(30,37,53,1)',       color: '#8B93A4' },
  }
  const t = tones[tone] || tones.slate

  return (
    <div className="rounded-2xl border bg-canvas-elevated/60 p-3" style={{ borderColor: t.border }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
          style={{ background: t.bg, border: `1px solid ${t.border}` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: t.color }} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      </div>
      <p className="text-[17px] font-black text-ink leading-none">{value}</p>
      {helper && <p className="mt-1 text-[10px] leading-snug text-ink-faint">{helper}</p>}
    </div>
  )
}

export default function MoneyCommandCenter({
  resumen,
  onAddGasto,
  onOpenDebtPlanner,
  onOpenPayments,
  onOpenGoals,
  onOpenInsights,
}) {
  if (!resumen) return null

  const cfg = statusConfig[resumen.status] || statusConfig.estable
  const StatusIcon = cfg.icon
  const action = resumen.action
  const actionHandler =
    action?.cta === 'Ver pagos'      ? onOpenPayments :
    action?.cta === 'Ver deudas'     ? onOpenDebtPlanner :
    action?.cta === 'Ver metas'      ? onOpenGoals :
    action?.cta === 'Analizar gastos'? onOpenInsights :
    onAddGasto

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-5 mt-4">
      <div
        className="overflow-hidden rounded-[24px] p-4 shadow-card"
        style={{
          background: `linear-gradient(145deg, ${cfg.gradientFrom} 0%, ${cfg.gradientTo} 100%), #0F1219`,
          border: `1px solid ${cfg.border}`,
        }}
      >
        {/* Status row */}
        <div className="flex items-start gap-3 mb-4">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: cfg.iconBg, border: `1px solid ${cfg.iconBorder}` }}
          >
            <StatusIcon className="h-5 w-5" style={{ color: cfg.iconColor }} />
          </motion.span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-ink">{cfg.label}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{cfg.text}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.12 }}
            type="button"
            onClick={actionHandler}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-black transition-opacity active:opacity-80 touch-manipulation ${cfg.btnColor}`}
          >
            {action?.cta || 'Registrar'}
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard
            icon={Landmark}
            tone={resumen.cashAfterCommitments >= 0 ? 'emerald' : 'rose'}
            label="Libre real"
            value={money(resumen.cashAfterCommitments)}
            helper="Cuentas − pagos pendientes"
          />
          <MetricCard
            icon={CalendarClock}
            tone={resumen.dailySafeSpend > 0 ? 'blue' : 'rose'}
            label="Seguro hoy"
            value={money(resumen.dailySafeSpend)}
            helper="Monto diario sin romper el mes"
          />
          <MetricCard
            icon={WalletCards}
            tone={resumen.pasivos > 0 ? 'amber' : 'emerald'}
            label="Deuda"
            value={money(resumen.pasivos, { compact: true })}
            helper={`DTI ${Math.round(resumen.dti)}% del ingreso`}
          />
          <MetricCard
            icon={PiggyBank}
            tone={resumen.patrimonioNeto >= 0 ? 'slate' : 'rose'}
            label="Patrimonio"
            value={money(resumen.patrimonioNeto, { compact: true })}
            helper={`Ahorro ${percent(resumen.savingsRate)} este mes`}
          />
        </div>

        {/* Action insight */}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-3 flex items-start gap-2.5 rounded-2xl border border-canvas-border bg-canvas-surface/60 p-3"
          >
            <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-accent-positive" />
            <div>
              <p className="text-[12px] font-black text-ink">{action.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{action.detail}</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
