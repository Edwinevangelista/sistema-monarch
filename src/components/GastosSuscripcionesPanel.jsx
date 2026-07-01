import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, ReceiptText, Repeat, Trash2, WalletCards } from 'lucide-react'
import PillBadge from './ui/PillBadge'

const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateLabel = (value) => {
  if (!value) return '—'
  const date = new Date(`${String(value).split('T')[0]}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-US', { day: 'numeric', month: 'short' })
}

const tabs = [
  { id: 'gastos',       label: 'Gastos',       color: 'text-accent-negative', activeColor: 'text-accent-negative' },
  { id: 'fijos',        label: 'Fijos',         color: 'text-accent-warning',  activeColor: 'text-accent-warning' },
  { id: 'suscripciones',label: 'Suscripciones', color: 'text-accent-info',     activeColor: 'text-accent-info' },
]

function EmptyState({ type }) {
  const copy = {
    gastos:        ['Sin gastos variables', 'Registra gastos para verlos aquí.'],
    suscripciones: ['Sin suscripciones',    'Agrega servicios recurrentes.'],
    fijos:         ['Sin gastos fijos',     'Agrega renta, servicios u otros pagos fijos.'],
  }[type]
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-canvas-border bg-canvas-elevated/50 py-10 text-center">
      <p className="text-sm font-bold text-ink-muted">{copy[0]}</p>
      <p className="mt-1 text-xs text-ink-faint">{copy[1]}</p>
    </div>
  )
}

function Row({ item, type, onEditar, onEliminar, index }) {
  const isSub  = type === 'suscripciones'
  const isFijo = type === 'fijos'

  const title = isSub
    ? item.servicio
    : isFijo
    ? (item.nombre || item.descripcion || 'Gasto fijo')
    : (item.descripcion || item.categoria || 'Gasto')

  const subtitle = isSub
    ? `${item.categoria || 'Servicio'} · ${item.ciclo || 'Mensual'} · ${dateLabel(item.proximo_pago)}`
    : isFijo
    ? `Vence día ${item.dia_venc ?? '—'}`
    : `${item.categoria || 'Variable'} · ${dateLabel(item.fecha)}`

  const amount = isSub ? item.costo : item.monto

  const badgeVariant = isFijo
    ? (item.estado === 'Pagado' ? 'paid' : 'pending')
    : isSub
    ? 'active'
    : 'muted'

  const badgeLabel = isFijo
    ? (item.estado || 'Pendiente')
    : isSub
    ? (item.estado || 'Activo')
    : null

  const iconBg = isSub
    ? 'bg-accent-info/10 border-accent-info/15 text-accent-info'
    : isFijo
    ? 'bg-accent-warning/10 border-accent-warning/15 text-accent-warning'
    : 'bg-accent-negative/10 border-accent-negative/15 text-accent-negative'

  const amountColor = isSub
    ? 'text-accent-info'
    : isFijo
    ? 'text-accent-warning'
    : 'text-accent-negative'

  const Icon = isSub ? Repeat : isFijo ? WalletCards : ReceiptText

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-3 rounded-2xl border border-canvas-border bg-canvas-elevated/60 px-3 py-3 shadow-card backdrop-blur-sm"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-black text-ink">{title}</p>
        <p className="truncate text-[11px] text-ink-faint">{subtitle}</p>
        {badgeLabel && (
          <div className="mt-1">
            <PillBadge label={badgeLabel} variant={badgeVariant} dot />
          </div>
        )}
      </div>

      <div className="text-right">
        <p className={`text-[13px] font-black ${amountColor}`}>{money(amount)}</p>
        <div className="mt-1.5 flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEditar?.(item)}
            className="rounded-lg p-1.5 text-ink-faint transition-colors active:bg-accent-info/10 active:text-accent-info touch-manipulation"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEliminar?.(item)}
            className="rounded-lg p-1.5 text-ink-faint transition-colors active:bg-accent-negative/10 active:text-accent-negative touch-manipulation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function GastosSuscripcionesPanel({
  gastos = [],
  suscripciones = [],
  gastosFijos = [],
  onEditarGasto,
  onEliminarGasto,
  onEditarSuscripcion,
  onEliminarSuscripcion,
  onEditarFijo,
  onEliminarFijo,
}) {
  const [tab, setTab] = useState('gastos')

  const gastosOrdenados = useMemo(
    () => [...gastos].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))),
    [gastos]
  )
  const subsActivas = useMemo(
    () => suscripciones
      .filter(s => s.estado !== 'Cancelado')
      .sort((a, b) => String(a.proximo_pago || '').localeCompare(String(b.proximo_pago || ''))),
    [suscripciones]
  )
  const fijosOrdenados = useMemo(
    () => [...gastosFijos].sort((a, b) => (a.dia_venc ?? 99) - (b.dia_venc ?? 99)),
    [gastosFijos]
  )

  const items = tab === 'gastos' ? gastosOrdenados : tab === 'suscripciones' ? subsActivas : fijosOrdenados
  const total = items.reduce((sum, item) => sum + Number(tab === 'suscripciones' ? item.costo || 0 : item.monto || 0), 0)
  const handlers = {
    gastos:        { onEditar: onEditarGasto,      onEliminar: onEliminarGasto },
    suscripciones: { onEditar: onEditarSuscripcion, onEliminar: onEliminarSuscripcion },
    fijos:         { onEditar: onEditarFijo,        onEliminar: onEliminarFijo },
  }[tab]

  return (
    <div className="overflow-hidden rounded-[24px] border border-canvas-border bg-canvas-surface shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-canvas-border px-4 pt-4 pb-3">
        <div>
          <p className="text-[13px] font-black text-ink">Lista del mes</p>
          <p className="text-[11px] text-ink-faint">
            {items.length} registro{items.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-bold text-ink-muted">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex overflow-hidden rounded-2xl border border-canvas-border bg-canvas-elevated p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-200 touch-manipulation ${
                tab === t.id
                  ? `bg-canvas-surface ${t.activeColor} shadow-card`
                  : 'text-ink-faint'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-3 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-2"
          >
            {items.length === 0 ? (
              <EmptyState type={tab} />
            ) : (
              items.slice(0, 12).map((item, i) => (
                <Row
                  key={`${tab}-${item.id}`}
                  item={item}
                  type={tab}
                  index={i}
                  onEditar={handlers.onEditar}
                  onEliminar={handlers.onEliminar}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
