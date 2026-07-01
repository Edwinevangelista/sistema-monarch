import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-accent-positive text-canvas font-bold shadow-glow-positive hover:bg-accent-positive/90',
  secondary: 'bg-canvas-elevated border border-canvas-border text-ink font-bold hover:bg-canvas-border',
  danger: 'bg-accent-negative/15 border border-accent-negative/25 text-accent-negative font-bold hover:bg-accent-negative/20',
  ghost: 'text-ink-muted hover:text-ink hover:bg-canvas-elevated font-semibold',
}

export default function ActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
}) {
  const sizes = {
    sm: 'px-3 py-2 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-3 text-sm rounded-xl gap-2',
    lg: 'px-5 py-4 text-base rounded-2xl gap-2.5',
  }

  return (
    <motion.button
      type={type}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center transition-colors duration-150
        ${sizes[size]} ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:opacity-90'}
        ${className}
      `}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </motion.button>
  )
}
