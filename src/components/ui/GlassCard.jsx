import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', glow = false, onClick, as = 'div' }) {
  const base =
    'relative overflow-hidden rounded-[20px] border border-canvas-border bg-canvas-surface/80 backdrop-blur-glass shadow-glass'
  const glowClass = glow ? 'shadow-glow' : ''
  const clickable = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : ''

  const Tag = onClick ? motion.div : as === 'section' ? 'section' : 'div'
  const motionProps = onClick
    ? { whileTap: { scale: 0.98 }, onClick }
    : {}

  return (
    <Tag className={`${base} ${glowClass} ${clickable} ${className}`} {...motionProps}>
      {/* top sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }}
      />
      {children}
    </Tag>
  )
}
