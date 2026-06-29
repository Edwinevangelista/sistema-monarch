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

const statusCopy = {
  saludable: {
    label: 'Flujo saludable',
    text: 'Puedes seguir gastando con control y alimentar tus metas.',
    color: 'text-accent-positive',
    bg: 'bg-accent-positive/10',
    border: 'border-accent-positive/25',
    icon: ShieldCheck,
  },
  estable: {
    label: 'Flujo estable',
    text: 'Tus números están manejables. Mantén el registro al día.',
    color: 'text-accent-info',
    bg: 'bg-accent-info/10',
    border: 'border-accent-info/25',
    icon: Gauge,
  },
  deuda_alta: {
    label: 'Deuda alta',
    text: 'Conviene bajar pagos mínimos antes de ampliar gastos.',
    color: 'text-accent-warning',
    bg: 'bg-accent-warning/10',
    border: 'border-accent-warning/25',
    icon: AlertTriangle,
  },
  riesgo: {
    label: 'Flujo apretado',
    text: 'Los compromisos consumen tu efectivo disponible.',
    color: 'text-accent-negative',
    bg: 'bg-accent-negative/10',
    border: 'border-accent-negative/25',
    icon: AlertTriangle,
  },
}

function Metric({ icon: Icon, label, value, helper, tone = 'slate' }) {
  const toneClasses = {
    emerald: 'bg-accent-positive/10 text-accent-positive border-accent-positive/25',
    blue: 'bg-accent-info/10 text-accent-info border-accent-info/25',
    amber: 'bg-accent-warning/10 text-accent-warning border-accent-warning/25',
    rose: 'bg-accent-negative/10 text-accent-negative border-accent-negative/25',
    slate: 'bg-canvas-elevated text-ink-muted border-canvas-border',
  }

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-surface p-3 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="truncate text-lg font-black text-ink">{value}</p>
        </div>
      </div>
      {helper && <p className="mt-2 text-xs leading-snug text-ink-muted">{helper}</p>}
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

  const status = statusCopy[resumen.status] || statusCopy.estable
  const StatusIcon = status.icon
  const action = resumen.action
  const actionHandler =
    action?.cta === 'Ver pagos' ? onOpenPayments :
    action?.cta === 'Ver deudas' ? onOpenDebtPlanner :
    action?.cta === 'Ver metas' ? onOpenGoals :
    action?.cta === 'Analizar gastos' ? onOpenInsights :
    onAddGasto

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-5 mt-4">
      <div className="rounded-2xl border border-canvas-border bg-canvas-surface p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${status.bg} ${status.border} ${status.color}`}>
              <StatusIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-ink">{status.label}</p>
              <p className="mt-0.5 text-sm leading-snug text-ink-muted">{status.text}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={actionHandler}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-positive px-4 py-2.5 text-sm font-bold text-canvas shadow-sm transition-colors hover:bg-accent-positive/90"
          >
            {action?.cta || 'Registrar gasto'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric
            icon={Landmark}
            tone={resumen.cashAfterCommitments >= 0 ? 'emerald' : 'rose'}
            label="Libre real"
            value={money(resumen.cashAfterCommitments)}
            helper="Cuentas menos pagos pendientes."
          />
          <Metric
            icon={CalendarClock}
            tone={resumen.dailySafeSpend > 0 ? 'blue' : 'rose'}
            label="Seguro hoy"
            value={money(resumen.dailySafeSpend)}
            helper="Monto diario para no romper el mes."
          />
          <Metric
            icon={WalletCards}
            tone={resumen.pasivos > 0 ? 'amber' : 'emerald'}
            label="Deuda"
            value={money(resumen.pasivos, { compact: true })}
            helper={`DTI ${Math.round(resumen.dti)}% de ingresos.`}
          />
          <Metric
            icon={PiggyBank}
            tone={resumen.patrimonioNeto >= 0 ? 'slate' : 'rose'}
            label="Patrimonio"
            value={money(resumen.patrimonioNeto, { compact: true })}
            helper={`Ahorro ${percent(resumen.savingsRate)} este mes.`}
          />
        </div>

        {action && (
          <div className="mt-4 rounded-xl border border-canvas-border bg-canvas-elevated p-3">
            <div className="flex items-start gap-2">
              <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-accent-positive" />
              <div>
                <p className="text-sm font-black text-ink">{action.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{action.detail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
