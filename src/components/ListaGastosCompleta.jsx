import React from 'react'
import {
  CreditCard,
  DollarSign,
  TrendingDown,
  Repeat,
  CheckCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import { ITEM_TYPES } from '../constants/itemTypes'

export default function ListaGastosCompleta({
  deudas = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudaPagadaEsteMes,
  onVerDetalle,
  onEliminar,
  onPagar,
  onEditar,
}) {
  const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`

  const iconByType = (type) => {
    switch (type) {
      case ITEM_TYPES.DEUDA:
        return <CreditCard className="w-5 h-5 text-purple-400" />
      case ITEM_TYPES.FIJO:
        return <DollarSign className="w-5 h-5 text-yellow-400" />
      case ITEM_TYPES.SUSCRIPCION:
        return <Repeat className="w-5 h-5 text-blue-400" />
      default:
        return <TrendingDown className="w-5 h-5 text-red-400" />
    }
  }

  const renderCard = (item, type) => {
    const isPaid =
      type === ITEM_TYPES.DEUDA
        ? deudaPagadaEsteMes?.(item.id)
        : type === ITEM_TYPES.FIJO
        ? item.estado === 'Pagado'
        : false

    // ✅ CORRECCIÓN: Orden correcto según el tipo de item
    const title =
      type === ITEM_TYPES.SUSCRIPCION
        ? item.servicio || item.nombre || 'Sin título' // Para suscripciones: primero servicio
        : type === ITEM_TYPES.DEUDA
        ? item.cuenta || item.nombre || 'Sin título' // Para deudas: cuenta
        : item.nombre || item.descripcion || 'Sin título' // Para otros: nombre primero

    const subtitle = item.categoria || item.tipo || ''

    const amount =
      item.saldo ??
      item.monto ??
      item.costo ??
      0

    return (
      <div
        key={`${type}-${item.id}`}
        className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-all"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-3 flex-1">
            <div className="p-2 bg-gray-800 rounded-lg">
              {iconByType(type)}
            </div>

            <div>
              <h3 className="text-white font-bold text-sm">
                {title}
              </h3>
              <p className="text-xs text-gray-400">
                {subtitle}
              </p>

              {isPaid && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
                  <CheckCircle className="w-3 h-3" /> Pagado
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-white font-bold text-lg">
              {formatMoney(amount)}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
          <button
            onClick={() => onVerDetalle(item, type)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-3 h-3" /> Ver
          </button>

          {!isPaid && type !== ITEM_TYPES.VARIABLE && (
            <button
              onClick={() => onPagar(item, type)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              {type === ITEM_TYPES.DEUDA ? 'Pagar' : 'Marcar'}
            </button>
          )}

          <button
            onClick={() => onEditar(item, type)}
            className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs py-1.5 rounded"
          >
            Editar
          </button>

          <button
            onClick={() => onEliminar(item, type)}
            className="px-3 bg-gray-700 hover:bg-red-600 text-white rounded"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {deudas.length > 0 && (
        <section>
          <h3 className="text-sm text-purple-400 font-semibold mb-2">
            💳 Deudas ({deudas.length})
          </h3>
          <div className="space-y-3">
            {deudas.map(d => renderCard(d, ITEM_TYPES.DEUDA))}
          </div>
        </section>
      )}

      {gastosFijos.length > 0 && (
        <section>
          <h3 className="text-sm text-yellow-400 font-semibold mb-2">
            📅 Gastos Fijos ({gastosFijos.length})
          </h3>
          <div className="space-y-3">
            {gastosFijos.map(g => renderCard(g, ITEM_TYPES.FIJO))}
          </div>
        </section>
      )}

      {suscripciones.length > 0 && (
        <section>
          <h3 className="text-sm text-blue-400 font-semibold mb-2">
            🔄 Suscripciones ({suscripciones.length})
          </h3>
          <div className="space-y-3">
            {suscripciones.map(s => renderCard(s, ITEM_TYPES.SUSCRIPCION))}
          </div>
        </section>
      )}

      {gastosVariables.length > 0 && (
        <section>
          <h3 className="text-sm text-red-400 font-semibold mb-2">
            📝 Gastos Variables ({gastosVariables.length})
          </h3>
          <div className="space-y-3">
            {gastosVariables.map(v => renderCard(v, ITEM_TYPES.VARIABLE))}
          </div>
        </section>
      )}
    </div>
  )
}