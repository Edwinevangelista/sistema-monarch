import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit2, ReceiptText, Repeat, Trash2, WalletCards,
  ChevronRight, CheckCircle2, Clock, X, Calendar, Tag, CreditCard, Banknote,
} from 'lucide-react'
import PillBadge from './ui/PillBadge'

const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateLabel = (value) => {
  if (!value) return '—'
  const date = new Date(`${String(value).split('T')[0]}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const tabs = [
  { id: 'gastos',        label: 'Gastos',        activeColor: 'text-accent-negative' },
  { id: 'fijos',         label: 'Fijos',          activeColor: 'text-accent-warning' },
  { id: 'suscripciones', label: 'Suscripciones',  activeColor: 'text-accent-info' },
]

function EmptyState({ type }) {
  const copy = {
    gastos:        ['Sin gastos variables', 'Registra gastos para verlos aquí.'],
    suscripciones: ['Sin suscripciones',    'Agrega servicios recurrentes.'],
    fijos:         ['Sin gastos fijos',     'Agrega renta, servicios u otros pagos fijos.'],
  }[type]
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-canvas-border bg-canvas-elevated/40 py-10 text-center">
      <p className="text-sm font-bold text-ink-muted">{copy[0]}</p>
      <p className="mt-1 text-xs text-ink-faint">{copy[1]}</p>
    </div>
  )
}

// ── Drawer de detalle ───────────────────────────────────────────────────────
function DetailDrawer({ item, type, onClose, onEditar, onEliminar, onMarcarPagado }) {
  if (!item) return null
  const isSub  = type === 'suscripciones'
  const isFijo = type === 'fijos'

  const title = isSub
    ? item.servicio
    : isFijo
    ? (item.nombre || item.descripcion || 'Gasto fijo')
    : (item.descripcion || item.categoria || 'Gasto')

  const amount = isSub ? item.costo : item.monto
  const isPagado = item.estado === 'Pagado'

  const details = isSub
    ? [
        { icon: Tag,        label: 'Categoría',       value: item.categoria || '—' },
        { icon: Repeat,     label: 'Ciclo',            value: item.ciclo || 'Mensual' },
        { icon: Calendar,   label: 'Próximo cobro',    value: dateLabel(item.proximo_pago) },
        { icon: Banknote,   label: 'Estado',           value: item.estado || 'Activo' },
      ]
    : isFijo
    ? [
        { icon: Tag,        label: 'Categoría',        value: item.categoria || '—' },
        { icon: Calendar,   label: 'Día de vencimiento', value: item.dia_venc ? `Día ${item.dia_venc}` : '—' },
        { icon: CheckCircle2,label: 'Estado',           value: item.estado || 'Pendiente' },
        { icon: CreditCard, label: 'Auto pago',         value: item.auto_pago === 'Si' ? 'Sí' : 'No' },
      ]
    : [
        { icon: Tag,        label: 'Categoría',        value: item.categoria || '—' },
        { icon: Calendar,   label: 'Fecha',             value: dateLabel(item.fecha) },
        { icon: Banknote,   label: 'Nota',              value: item.descripcion || '—' },
      ]

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed left-0 right-0 z-50 rounded-t-[28px] border-t border-canvas-border shadow-glass"
          style={{
            bottom: '60px',
            background: 'rgba(15,18,25,0.98)',
            backdropFilter: 'blur(20px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'scroll',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-canvas-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-canvas-border">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">
                {isSub ? 'Suscripción' : isFijo ? 'Gasto fijo' : 'Gasto variable'}
              </p>
              <p className="text-[18px] font-black text-ink leading-tight">{title}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-canvas-elevated text-ink-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Amount hero */}
          <div className="px-5 py-4 border-b border-canvas-border">
            <p className="text-[11px] text-ink-faint mb-1">Monto</p>
            <p className={`text-[36px] font-black leading-none ${
              isSub ? 'text-accent-info' : isFijo ? 'text-accent-warning' : 'text-accent-negative'
            }`}>
              {money(amount)}
            </p>
            {isFijo && (
              <div className="mt-2">
                <PillBadge
                  label={item.estado || 'Pendiente'}
                  variant={isPagado ? 'paid' : 'pending'}
                  dot
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-3 border-b border-canvas-border">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-ink-faint" />
                  <span className="text-[13px] text-ink-muted">{label}</span>
                </div>
                <span className="text-[13px] font-bold text-ink">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 space-y-2.5">
            {/* Marcar pagado — solo para gastos fijos pendientes */}
            {isFijo && !isPagado && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onMarcarPagado?.(item); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-positive/15 border border-accent-positive/25 px-4 py-3.5 text-[14px] font-black text-accent-positive touch-manipulation"
              >
                <CheckCircle2 className="h-5 w-5" />
                Marcar como Pagado
              </motion.button>
            )}

            {/* Marcar pendiente — si ya está pagado */}
            {isFijo && isPagado && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onMarcarPagado?.(item, 'Pendiente'); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-warning/15 border border-accent-warning/25 px-4 py-3.5 text-[14px] font-black text-accent-warning touch-manipulation"
              >
                <Clock className="h-5 w-5" />
                Marcar como Pendiente
              </motion.button>
            )}

            {/* Editar + Eliminar en fila */}
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onEditar?.(item); onClose() }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-canvas-elevated border border-canvas-border px-4 py-3.5 text-[14px] font-bold text-ink touch-manipulation"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onEliminar?.(item); onClose() }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-accent-negative/10 border border-accent-negative/20 px-4 py-3.5 text-[14px] font-bold text-accent-negative touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </motion.button>
            </div>
          </div>

          {/* Bottom padding inside sheet */}
          <div style={{ height: '16px' }} />
        </motion.div>
      </>
    </AnimatePresence>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────
function Row({ item, type, onTap, index }) {
  const isSub  = type === 'suscripciones'
  const isFijo = type === 'fijos'

  const title = isSub
    ? item.servicio
    : isFijo
    ? (item.nombre || item.descripcion || 'Gasto fijo')
    : (item.descripcion || item.categoria || 'Gasto')

  const subtitle = isSub
    ? `${item.ciclo || 'Mensual'} · ${dateLabel(item.proximo_pago)}`
    : isFijo
    ? `Vence día ${item.dia_venc ?? '—'}`
    : `${item.categoria || 'Variable'} · ${dateLabel(item.fecha)}`

  const amount   = isSub ? item.costo : item.monto
  const isPagado = item.estado === 'Pagado'

  const iconBg = isSub
    ? 'bg-accent-info/10 border-accent-info/15 text-accent-info'
    : isFijo
    ? 'bg-accent-warning/10 border-accent-warning/15 text-accent-warning'
    : 'bg-accent-negative/10 border-accent-negative/15 text-accent-negative'

  const amountColor = isSub ? 'text-accent-info' : isFijo ? 'text-accent-warning' : 'text-accent-negative'
  const Icon = isSub ? Repeat : isFijo ? WalletCards : ReceiptText

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.035 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onTap(item)}
      className="w-full flex items-center gap-3 rounded-2xl border border-canvas-border bg-canvas-elevated/60 px-3 py-3 shadow-card text-left touch-manipulation"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-black text-ink">{title}</p>
          {isFijo && (
            <PillBadge
              label={isPagado ? '✓' : '·'}
              variant={isPagado ? 'paid' : 'pending'}
              className="shrink-0"
            />
          )}
        </div>
        <p className="truncate text-[11px] text-ink-faint mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <p className={`text-[13px] font-black ${amountColor}`}>{money(amount)}</p>
        <ChevronRight className="h-4 w-4 text-ink-faint" />
      </div>
    </motion.button>
  )
}

// ── Panel principal ──────────────────────────────────────────────────────────
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
  onMarcarPagadoFijo,
}) {
  const [tab, setTab] = useState('gastos')
  const [selected, setSelected] = useState(null)

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
  const total = items.reduce((s, i) => s + Number(tab === 'suscripciones' ? i.costo || 0 : i.monto || 0), 0)

  const handlers = {
    gastos:        { onEditar: onEditarGasto,       onEliminar: onEliminarGasto },
    suscripciones: { onEditar: onEditarSuscripcion,  onEliminar: onEliminarSuscripcion },
    fijos:         { onEditar: onEditarFijo,         onEliminar: onEliminarFijo },
  }[tab]

  return (
    <>
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

          <div className="flex overflow-hidden rounded-2xl border border-canvas-border bg-canvas-elevated p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-200 touch-manipulation ${
                  tab === t.id ? `bg-canvas-surface ${t.activeColor} shadow-card` : 'text-ink-faint'
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
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {items.length === 0 ? (
                <EmptyState type={tab} />
              ) : (
                items.slice(0, 15).map((item, i) => (
                  <Row
                    key={`${tab}-${item.id}`}
                    item={item}
                    type={tab}
                    index={i}
                    onTap={setSelected}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          item={selected}
          type={tab}
          onClose={() => setSelected(null)}
          onEditar={handlers.onEditar}
          onEliminar={(item) => { handlers.onEliminar?.(item); setSelected(null) }}
          onMarcarPagado={onMarcarPagadoFijo}
        />
      )}
    </>
  )
}
