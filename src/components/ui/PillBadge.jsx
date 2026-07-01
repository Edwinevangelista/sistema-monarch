const variants = {
  paid:    'bg-accent-positive/12 text-accent-positive border-accent-positive/20',
  pending: 'bg-accent-warning/12 text-accent-warning border-accent-warning/20',
  active:  'bg-accent-info/12 text-accent-info border-accent-info/20',
  danger:  'bg-accent-negative/12 text-accent-negative border-accent-negative/20',
  muted:   'bg-canvas-elevated text-ink-muted border-canvas-border',
}

const dots = {
  paid:    'bg-accent-positive',
  pending: 'bg-accent-warning',
  active:  'bg-accent-info',
  danger:  'bg-accent-negative',
  muted:   'bg-ink-faint',
}

export default function PillBadge({ label, variant = 'muted', dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${variants[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}
      {label}
    </span>
  )
}
