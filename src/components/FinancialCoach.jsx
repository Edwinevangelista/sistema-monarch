import { useState, useMemo } from 'react'
import { Target, CheckCircle2, Circle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the ISO week string "YYYY-W##" for localStorage key scoping */
function getWeekKey() {
  const now = new Date()
  // Use the Thursday of the current week to determine year (ISO 8601)
  const thursday = new Date(now)
  thursday.setDate(now.getDate() + 4 - (now.getDay() || 7))
  const year = thursday.getFullYear()
  // Week number: days since Jan 4 (always in week 1) / 7
  const jan4 = new Date(year, 0, 4)
  const week = Math.ceil(((thursday - jan4) / 86400000 + jan4.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const STORAGE_PREFIX = 'coach_acciones_'

/** Load checked IDs for the current week from localStorage */
function loadChecked(weekKey) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${weekKey}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Persist checked IDs for the current week */
function saveChecked(weekKey, ids) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${weekKey}`, JSON.stringify(ids))
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

// ---------------------------------------------------------------------------
// Action-generation engine — pure function, no side effects
// ---------------------------------------------------------------------------
function generarAcciones({
  totalIngresos,
  totalGastos,
  tasaAhorro,
  gastosFijos,
  suscripciones,
  deudas,
  gastosMes,
  // dailyBudget intentionally unused in logic but accepted to keep props stable
}) {
  const acciones = []
  const hoy = new Date()

  // ------------------------------------------------------------------
  // 1. Pagos urgentes esta semana (gastos fijos + suscripciones)
  // ------------------------------------------------------------------
  const pagosUrgentes = [
    ...(Array.isArray(gastosFijos) ? gastosFijos : []).filter((g) => {
      if (g.estado === 'Pagado' || !g.fecha_vencimiento) return false
      const diff = Math.ceil((new Date(g.fecha_vencimiento) - hoy) / 86400000)
      return diff >= 0 && diff <= 7
    }),
    ...(Array.isArray(suscripciones) ? suscripciones : []).filter((s) => {
      if (s.estado !== 'Activo' || !s.proximo_pago) return false
      const diff = Math.ceil((new Date(s.proximo_pago) - hoy) / 86400000)
      return diff >= 0 && diff <= 7
    }),
  ]

  if (pagosUrgentes.length > 0) {
    const nombres = pagosUrgentes
      .slice(0, 2)
      .map((p) => p.nombre || p.servicio || 'pago')
      .join(' y ')
    acciones.push({
      id: 'pagos',
      emoji: '💳',
      titulo: `Paga ${nombres}${pagosUrgentes.length > 2 ? ` y ${pagosUrgentes.length - 2} más` : ''}`,
      descripcion: `Tienes ${pagosUrgentes.length} compromiso${pagosUrgentes.length > 1 ? 's' : ''} venciendo esta semana. Págalos antes para evitar cargos extra.`,
      urgente: true,
    })
  }

  // ------------------------------------------------------------------
  // 2. Meta de ahorro semanal (5% de ingresos)
  // ------------------------------------------------------------------
  const ahorroSemanal = Math.round(totalIngresos * 0.05)
  if (tasaAhorro < 0.2 && ahorroSemanal > 0) {
    acciones.push({
      id: 'ahorro',
      emoji: '🐷',
      titulo: `Aparta $${ahorroSemanal.toLocaleString('es')} esta semana`,
      descripcion:
        'Solo es el 5% de tus ingresos. Transfiérelo a una cuenta separada hoy — así no lo gastas sin querer.',
      urgente: false,
    })
  }

  // ------------------------------------------------------------------
  // 3. Reducir categoría de mayor gasto (si supera 20% de ingresos)
  // ------------------------------------------------------------------
  const gastosList = Array.isArray(gastosMes) ? gastosMes : []
  const bycat = gastosList.reduce((m, g) => {
    const cat = g.categoria || g.category || 'Otro'
    m[cat] = (m[cat] || 0) + Number(g.monto || g.amount || 0)
    return m
  }, {})

  const topCat =
    Object.keys(bycat).length > 0
      ? Object.entries(bycat).reduce((best, cur) => (cur[1] > best[1] ? cur : best))
      : null

  if (topCat && topCat[1] > totalIngresos * 0.2) {
    const reduccion = Math.round(topCat[1] * 0.1)
    acciones.push({
      id: 'reducir',
      emoji: '✂️',
      titulo: `Reduce ${topCat[0]} en $${reduccion.toLocaleString('es')}`,
      descripcion: `Gastas $${topCat[1].toLocaleString('es', { maximumFractionDigits: 0 })} en ${topCat[0]} este mes. Reducir 10% libera dinero para tus metas.`,
      urgente: false,
    })
  }

  // ------------------------------------------------------------------
  // 4. Pago extra a deuda con mayor interés (APR > 15%)
  // ------------------------------------------------------------------
  const debtList = Array.isArray(deudas) ? deudas : []
  const deudaAlta = [...debtList].sort((a, b) => Number(b.apr || 0) - Number(a.apr || 0))[0]

  if (deudaAlta && Number(deudaAlta.apr || 0) > 15 && Number(deudaAlta.saldo || 0) > 0) {
    const pagoExtra = Math.round(Number(deudaAlta.saldo) * 0.02)
    acciones.push({
      id: 'deuda',
      emoji: '⚔️',
      titulo: `Paga $${pagoExtra.toLocaleString('es')} extra a ${deudaAlta.nombre || 'tu deuda'}`,
      descripcion: `Con ${deudaAlta.apr}% de interés anual, cada pago extra te ahorra dinero en intereses. Solo $${pagoExtra.toLocaleString('es')} esta semana marca la diferencia.`,
      urgente: false,
    })
  }

  // ------------------------------------------------------------------
  // 5. Revisar suscripciones (≥3 activas y > 8% de ingresos)
  // ------------------------------------------------------------------
  const subsActivas = (Array.isArray(suscripciones) ? suscripciones : []).filter(
    (s) => s.estado === 'Activo'
  )
  const costoSubs = subsActivas.reduce((s, x) => s + Number(x.costo || 0), 0)

  if (subsActivas.length >= 3 && costoSubs > totalIngresos * 0.08) {
    acciones.push({
      id: 'subs',
      emoji: '📱',
      titulo: `Revisa tus ${subsActivas.length} suscripciones`,
      descripcion: `Pagas $${costoSubs.toLocaleString('es', { maximumFractionDigits: 0 })}/mes en servicios. ¿Usas todos? Cancela uno que no necesites.`,
      urgente: false,
    })
  }

  // ------------------------------------------------------------------
  // Fallback motivacional si no hay ninguna acción generada
  // ------------------------------------------------------------------
  if (acciones.length === 0) {
    acciones.push({
      id: 'registro',
      emoji: '📝',
      titulo: 'Registra tus gastos de hoy',
      descripcion:
        'El primer paso para controlar el dinero es saber en qué lo gastas. Registra cada gasto, por pequeño que sea.',
      urgente: false,
    })
  }

  return acciones.slice(0, 3)
}

// ---------------------------------------------------------------------------
// ActionRow — single task with custom checkbox
// ---------------------------------------------------------------------------
function ActionRow({ accion, checked, onToggle }) {
  const borderClass = accion.urgente ? 'border-l-2 border-accent-negative' : 'border-l-2 border-accent-info'
  const bgClass = accion.urgente
    ? 'bg-accent-negative/10 hover:bg-accent-negative/15'
    : 'bg-canvas-elevated hover:bg-canvas-border'

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors duration-150',
        borderClass,
        bgClass,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
      ].join(' ')}
      aria-pressed={checked}
    >
      {/* Custom checkbox icon */}
      <span
        className={[
          'flex-shrink-0 mt-0.5 transition-colors duration-150',
          checked ? 'text-accent-positive' : accion.urgente ? 'text-accent-negative/70' : 'text-accent-info/70',
        ].join(' ')}
      >
        {checked ? (
          <CheckCircle2 size={20} strokeWidth={2} />
        ) : (
          <Circle size={20} strokeWidth={1.5} />
        )}
      </span>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        {/* Emoji + title */}
        <span
          className={[
            'text-sm font-semibold leading-snug transition-colors duration-150',
            checked ? 'text-ink-faint line-through' : 'text-ink',
          ].join(' ')}
        >
          {accion.emoji} {accion.titulo}
        </span>

        {/* Description */}
        <span
          className={[
            'text-xs leading-relaxed transition-colors duration-150',
            checked ? 'text-ink-faint line-through' : 'text-ink-muted',
          ].join(' ')}
        >
          {accion.descripcion}
        </span>

        {/* Urgente badge */}
        {accion.urgente && !checked && (
          <span className="mt-1 self-start text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-negative/15 text-accent-negative uppercase tracking-wide">
            Esta semana
          </span>
        )}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------
function ProgressBar({ completadas, total }) {
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0
  // 8 blocks for visual fill
  const BLOCKS = 8
  const filled = Math.round((completadas / total) * BLOCKS) || 0

  return (
    <div className="flex flex-col gap-1.5">
      {/* Block bar + label */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: BLOCKS }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-colors duration-300',
                i < filled ? 'bg-accent-positive w-3' : 'bg-canvas-border w-3',
              ].join(' ')}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-ink-muted">
          {pct}%
        </span>
      </div>

      {/* Text label */}
      <span className="text-[11px] text-ink-muted">
        Completadas: {completadas}/{total}
        {completadas === total && total > 0 && (
          <span className="ml-2 text-accent-positive font-semibold">¡Semana completada! 🎉</span>
        )}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FinancialCoach — main export
// ---------------------------------------------------------------------------
export default function FinancialCoach({
  totalIngresos = 0,
  totalGastos = 0,
  tasaAhorro = 0,
  gastosMes = [],
  gastosFijos = [],
  suscripciones = [],
  deudas = [],
  dailyBudget = 0,
}) {
  const weekKey = useMemo(() => getWeekKey(), [])

  const acciones = useMemo(
    () =>
      generarAcciones({
        totalIngresos,
        totalGastos,
        tasaAhorro,
        gastosFijos,
        suscripciones,
        deudas,
        gastosMes,
        dailyBudget,
      }),
    [totalIngresos, totalGastos, tasaAhorro, gastosFijos, suscripciones, deudas, gastosMes, dailyBudget]
  )

  const [checkedIds, setCheckedIds] = useState(() => loadChecked(weekKey))

  // Guard: no income data yet — nothing useful to show
  if (!totalIngresos || totalIngresos === 0) return null

  function toggleAccion(id) {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveChecked(weekKey, next)
      return next
    })
  }

  const completadas = acciones.filter((a) => checkedIds.includes(a.id)).length

  return (
    <section className="flex flex-col gap-0 rounded-2xl border border-canvas-border overflow-hidden bg-canvas-surface shadow-card">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-canvas-elevated px-4 py-3 flex items-start gap-3 border-b border-canvas-border">
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-accent-info flex items-center justify-center">
          <Target size={17} className="text-canvas" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-black text-ink leading-tight">
            Tu plan de esta semana
          </span>
          <span className="text-[11px] text-ink-muted leading-snug font-semibold">
            {acciones.length} acción{acciones.length !== 1 ? 'es' : ''} para mejorar tus finanzas
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Action list                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-2 p-3">
        {acciones.map((accion) => (
          <ActionRow
            key={accion.id}
            accion={accion}
            checked={checkedIds.includes(accion.id)}
            onToggle={() => toggleAccion(accion.id)}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Progress bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 pb-4 pt-1 border-t border-canvas-border">
        <ProgressBar completadas={completadas} total={acciones.length} />
      </div>
    </section>
  )
}
