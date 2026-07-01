import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingDown, CheckCircle2 } from 'lucide-react'

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatHora12(fecha) {
  if (!fecha) return ''
  const date = new Date(fecha.includes('T') ? fecha : fecha.replace(' ', 'T'))
  if (isNaN(date.getTime())) return ''
  let h = date.getHours()
  const min = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return `${h}:${min}${ampm}`
}

function ringColor(pct) {
  if (pct < 60) return '#34D399'
  if (pct < 85) return '#FBBF24'
  return '#F87171'
}

function BudgetRing({ pct }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const filled = Math.min(pct, 100)
  const dashOffset = circumference - (filled / 100) * circumference
  const color = ringColor(pct)

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="#1E2535" strokeWidth="7" />
      <motion.circle
        cx="36" cy="36" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px' }}
      />
      <text x="36" y="40" textAnchor="middle" fill="#F0F2F5" fontSize="12" fontWeight="800" fontFamily="inherit">
        {Math.round(filled)}%
      </text>
    </svg>
  )
}

export default function DailySnapshot({ gastos = [], dailyBudget = 0 }) {
  const today = getTodayString()

  const gastosHoy = useMemo(() => {
    return gastos
      .filter(g => g.fecha?.slice(0, 10) === today)
      .sort((a, b) => {
        const da = new Date(a.fecha.includes('T') ? a.fecha : a.fecha.replace(' ', 'T'))
        const db = new Date(b.fecha.includes('T') ? b.fecha : b.fecha.replace(' ', 'T'))
        return db - da
      })
  }, [gastos, today])

  const totalHoy = useMemo(
    () => gastosHoy.reduce((s, g) => s + Math.abs(Number(g.monto) || 0), 0),
    [gastosHoy]
  )

  const pct = dailyBudget > 0 ? Math.round((totalHoy / dailyBudget) * 100) : 0
  const showRing = dailyBudget > 0
  const top3 = gastosHoy.slice(0, 3)

  const headerDate = (() => {
    const now = new Date()
    const dia = now.toLocaleDateString('es-ES', { weekday: 'long' })
    return `${dia} ${now.getDate()} de ${now.toLocaleDateString('es-ES', { month: 'long' })}`
  })()

  return (
    <div className="overflow-hidden rounded-[24px] border border-canvas-border bg-canvas-surface shadow-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-canvas-border px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-info/10 border border-accent-info/15">
          <Calendar className="h-3.5 w-3.5 text-accent-info" />
        </div>
        <span className="text-[13px] font-black text-ink capitalize">{headerDate}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Budget ring */}
        {showRing && (
          <div className="flex items-center gap-4">
            <BudgetRing pct={pct} />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Gastado hoy</p>
              <p className="text-ink font-black text-lg leading-none">
                ${totalHoy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="ml-1.5 text-[12px] font-semibold text-ink-faint">
                  / ${dailyBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/día
                </span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-canvas-elevated">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: ringColor(pct) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-ink-faint">{pct}% del presupuesto diario</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-canvas-border" />

        {/* Movements */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-ink-faint" />
            <p className="text-[10px] font-black uppercase tracking-wide text-ink-faint">Movimientos de hoy</p>
          </div>

          {gastosHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-positive/10 border border-accent-positive/15">
                <CheckCircle2 className="h-6 w-6 text-accent-positive" />
              </div>
              <p className="text-[13px] font-black text-accent-positive">¡Sin gastos hoy!</p>
              <p className="text-[11px] text-ink-faint">Sigue así 🎯</p>
            </div>
          ) : (
            <div className="space-y-1">
              {top3.map((g, i) => {
                const partes = (g.categoria || 'Sin categoría').split(' ')
                const emoji = /\p{Emoji}/u.test(partes[0]) ? partes[0] : '💸'
                const nombre = /\p{Emoji}/u.test(partes[0]) ? partes.slice(1).join(' ') : g.categoria
                const hora = formatHora12(g.fecha)
                const monto = Math.abs(Number(g.monto) || 0)

                return (
                  <motion.div
                    key={g.id ?? i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors active:bg-canvas-elevated"
                  >
                    <span className="w-6 text-center text-base leading-none">{emoji}</span>
                    <span className="flex-1 truncate text-[12px] text-ink-muted">{nombre}</span>
                    <span className="shrink-0 text-[12px] font-black text-accent-negative">
                      -${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {hora && <span className="w-12 shrink-0 text-right text-[10px] text-ink-faint">{hora}</span>}
                  </motion.div>
                )
              })}

              {gastosHoy.length > 3 && (
                <p className="pt-1 text-center text-[11px] text-ink-faint">
                  +{gastosHoy.length - 3} más hoy
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
