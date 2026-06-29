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
  return (
    <div className="rounded-xl border border-dashed border-canvas-border bg-canvas-elevated px-4 py-8 text-center">
      <p className="text-sm font-bold text-ink-muted">
        {type === 'gastos' ? 'Sin gastos variables este mes' : 'Sin suscripciones activas'}
      </p>
      <p className="mt-1 text-xs text-ink-faint">
        {type === 'gastos' ? 'Cuando registres gastos aparecerán aquí.' : 'Agrega servicios recurrentes para verlos en esta lista.'}
      </p>
    </div>
  )
}

function Row({ item, type, onEditar, onEliminar }) {
  const isSub = type === 'suscripciones'
  const title = isSub ? item.servicio : item.descripcion || item.categoria || 'Gasto'
  const subtitle = isSub
    ? `${item.categoria || 'Servicio'} · ${item.ciclo || 'Mensual'} · ${dateLabel(item.proximo_pago)}`
    : `${item.categoria || 'Variable'} · ${dateLabel(item.fecha)}`
  const amount = isSub ? item.costo : item.monto
  const Icon = isSub ? Repeat : ReceiptText

  return (
    <div className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-elevated px-3 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
        isSub ? 'border-accent-info/25 bg-accent-info/10 text-accent-info' : 'border-accent-negative/25 bg-accent-negative/10 text-accent-negative'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-ink">{title}</p>
        <p className="truncate text-xs text-ink-muted">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black ${isSub ? 'text-accent-info' : 'text-accent-negative'}`}>{money(amount)}</p>
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
  onEditarGasto,
  onEliminarGasto,
  onEditarSuscripcion,
  onEliminarSuscripcion,
}) {
  const [tab, setTab] = useState('gastos')
  const gastosOrdenados = useMemo(() => [...gastos].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))), [gastos])
  const subsActivas = useMemo(() => suscripciones.filter((s) => s.estado !== 'Cancelado'), [suscripciones])
  const items = tab === 'gastos' ? gastosOrdenados : subsActivas
  const total = items.reduce((sum, item) => sum + Number(tab === 'gastos' ? item.monto || 0 : item.costo || 0), 0)

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
              onEditar={tab === 'gastos' ? onEditarGasto : onEditarSuscripcion}
              onEliminar={tab === 'gastos' ? onEliminarGasto : onEliminarSuscripcion}
            />
          ))
        )}
      </div>
    </div>
  )
}
