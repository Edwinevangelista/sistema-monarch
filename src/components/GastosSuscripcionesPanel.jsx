import { useMemo, useState } from 'react'
import { Edit2, ReceiptText, Repeat, Trash2 } from 'lucide-react'

const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const dateLabel = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(`${String(value).split('T')[0]}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-US', { day: 'numeric', month: 'short' })
}

function EmptyState({ type }) {
  const copy = {
    gastos: ['Sin gastos variables este mes', 'Cuando registres gastos aparecerán aquí.'],
    suscripciones: ['Sin suscripciones activas', 'Agrega servicios recurrentes para verlos en esta lista.'],
    fijos: ['Sin gastos fijos registrados', 'Agrega renta, servicios u otros pagos fijos para verlos aquí.'],
  }[type]
  return (
    <div className="rounded-xl border border-dashed border-canvas-border bg-canvas-elevated px-4 py-8 text-center">
      <p className="text-sm font-bold text-ink-muted">{copy[0]}</p>
      <p className="mt-1 text-xs text-ink-faint">{copy[1]}</p>
    </div>
  )
}

function Row({ item, type, onEditar, onEliminar }) {
  const isSub = type === 'suscripciones'
  const isFijo = type === 'fijos'
  const title = isSub ? item.servicio : isFijo ? (item.nombre || item.descripcion || 'Gasto fijo') : item.descripcion || item.categoria || 'Gasto'
  const subtitle = isSub
    ? `${item.categoria || 'Servicio'} · ${item.ciclo || 'Mensual'} · ${dateLabel(item.proximo_pago)}`
    : isFijo
    ? `${item.estado || 'Pendiente'} · Vence día ${item.dia_venc ?? '—'}`
    : `${item.categoria || 'Variable'} · ${dateLabel(item.fecha)}`
  const amount = isSub ? item.costo : item.monto
  const Icon = isSub ? Repeat : ReceiptText

  return (
    <div className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-elevated px-3 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
        isSub ? 'border-accent-info/25 bg-accent-info/10 text-accent-info' : isFijo ? 'border-accent-warning/25 bg-accent-warning/10 text-accent-warning' : 'border-accent-negative/25 bg-accent-negative/10 text-accent-negative'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ink">{title}</p>
        <p className="truncate text-xs text-ink-muted">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black ${isSub ? 'text-accent-info' : isFijo ? 'text-accent-warning' : 'text-accent-negative'}`}>{money(amount)}</p>
        <div className="mt-1 flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEditar?.(item)}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-accent-info/10 hover:text-accent-info"
            aria-label="Editar"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEliminar?.(item)}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-accent-negative/10 hover:text-accent-negative"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
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
  const gastosOrdenados = useMemo(() => [...gastos].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))), [gastos])
  const subsActivas = useMemo(() => suscripciones.filter((s) => s.estado !== 'Cancelado'), [suscripciones])
  const fijosOrdenados = useMemo(() => [...gastosFijos].sort((a, b) => (a.dia_venc ?? 99) - (b.dia_venc ?? 99)), [gastosFijos])
  const items = tab === 'gastos' ? gastosOrdenados : tab === 'suscripciones' ? subsActivas : fijosOrdenados
  const total = items.reduce((sum, item) => sum + Number(tab === 'suscripciones' ? item.costo || 0 : item.monto || 0), 0)
  const handlers = {
    gastos: { onEditar: onEditarGasto, onEliminar: onEliminarGasto },
    suscripciones: { onEditar: onEditarSuscripcion, onEliminar: onEliminarSuscripcion },
    fijos: { onEditar: onEditarFijo, onEliminar: onEliminarFijo },
  }[tab]

  return (
    <div className="rounded-2xl border border-canvas-border bg-canvas-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-ink">Lista del mes</p>
          <p className="text-xs text-ink-muted">{items.length} registro{items.length !== 1 ? 's' : ''} · {money(total)}</p>
        </div>
        <div className="flex rounded-xl border border-canvas-border bg-canvas-elevated p-1">
          <button
            type="button"
            onClick={() => setTab('gastos')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === 'gastos' ? 'bg-canvas-surface text-accent-negative shadow-sm' : 'text-ink-muted'}`}
          >
            Gastos
          </button>
          <button
            type="button"
            onClick={() => setTab('fijos')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === 'fijos' ? 'bg-canvas-surface text-accent-warning shadow-sm' : 'text-ink-muted'}`}
          >
            Fijos
          </button>
          <button
            type="button"
            onClick={() => setTab('suscripciones')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === 'suscripciones' ? 'bg-canvas-surface text-accent-info shadow-sm' : 'text-ink-muted'}`}
          >
            Suscripciones
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyState type={tab} />
        ) : (
          items.slice(0, 12).map((item) => (
            <Row
              key={`${tab}-${item.id}`}
              item={item}
              type={tab}
              onEditar={handlers.onEditar}
              onEliminar={handlers.onEliminar}
            />
          ))
        )}
      </div>
    </div>
  )
}
