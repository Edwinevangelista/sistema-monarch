const SIZE_CLASS = {
  lg: 'text-amount-lg',
  md: 'text-amount-md',
  sm: 'text-amount-sm',
}

const TONE_CLASS = {
  positive: 'text-accent-positive',
  negative: 'text-accent-negative',
  warning: 'text-accent-warning',
  neutral: 'text-ink',
}

export default function AmountText({ value, size = 'md', tone, className = '' }) {
  const resolvedTone = tone || (value < 0 ? 'negative' : 'neutral')
  const formatted = Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

  return (
    <span className={`${SIZE_CLASS[size]} ${TONE_CLASS[resolvedTone]} ${className}`}>
      {formatted}
    </span>
  )
}
