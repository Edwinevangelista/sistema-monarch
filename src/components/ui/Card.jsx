export default function Card({ children, className = '', elevated = false, padding = 'p-4' }) {
  return (
    <div
      className={`${elevated ? 'bg-base-elevated' : 'bg-base-surface'} border border-base-border rounded-card shadow-card ${padding} ${className}`}
    >
      {children}
    </div>
  )
}
