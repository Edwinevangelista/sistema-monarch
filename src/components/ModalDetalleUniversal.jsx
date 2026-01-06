import { ITEM_TYPES } from '../constants/itemTypes'
import { X, Edit2, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react'
import { DEUDA_STATUS } from '../lib/finance/deudaStatus'
import { BANK_DEUDA_MESSAGES } from '../constants/bankMessages'

export default function ModalDetalleUniversal({
  item,
  type,
  status,
  onClose,
  onEditar,
  onPagar
}) {
  // =========================
  // Helpers seguros
  // =========================
  const getMonto = () => {
    if (type === ITEM_TYPES.DEUDA) return Number(item.saldo || 0)
    if (type === ITEM_TYPES.SUSCRIPCION) return Number(item.costo || 0)
    return Number(item.monto || 0)
  }

  const deudaUI =
    type === ITEM_TYPES.DEUDA && status
      ? BANK_DEUDA_MESSAGES[status]
      : null

  const isPagado =
    (type === ITEM_TYPES.FIJO && item.estado === 'Pagado') ||
    (type === ITEM_TYPES.DEUDA &&
      (status === DEUDA_STATUS.SIN_SALDO ||
       status === DEUDA_STATUS.PAGADA_MES))

  // =========================
  // Acción primaria
  // =========================
  const renderPrimaryAction = () => {
    // Gasto variable → asignar cuenta
    if (type === ITEM_TYPES.VARIABLE) {
      return (
        <button
          onClick={() => onEditar(item, type)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Asignar cuenta
        </button>
      )
    }

    // Pagado (no acción)
    if (isPagado) {
      return (
        <div className="flex-1 bg-green-500/15 text-green-400 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold">
          <CheckCircle className="w-5 h-5" />
          Pagado
        </div>
      )
    }

    // Deuda que permite pagar
    if (type === ITEM_TYPES.DEUDA && deudaUI?.canPay) {
      return (
        <button
          onClick={() => onPagar(item, type)}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-white
            ${deudaUI.tone === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          <CheckCircle className="w-5 h-5" />
          Registrar pago
        </button>
      )
    }

    return null
  }

  // =========================
  // Reminder visual de deuda
  // =========================
  const renderDeudaMessage = () => {
    if (!deudaUI) return null

    const toneMap = {
      success: 'bg-green-500/10 text-green-300 border-green-500/30',
      info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
      danger: 'bg-red-500/10 text-red-300 border-red-500/30',
    }

    return (
      <div
        className={`border rounded-xl p-3 mb-4 text-sm ${toneMap[deudaUI.tone]}`}
      >
        <div className="flex items-center gap-2 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" />
          {deudaUI.title}
        </div>
        <p className="text-xs opacity-90">{deudaUI.message}</p>
      </div>
    )
  }

  // =========================
  // Render
  // =========================
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-700">
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-gray-800 p-2 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* TÍTULO */}
          <h2 className="text-xl font-bold text-white mb-1">
            {item.nombre || item.descripcion || item.servicio || item.cuenta}
          </h2>

          {/* MENSAJE BANCA PARA DEUDA */}
          {type === ITEM_TYPES.DEUDA && renderDeudaMessage()}

          {/* MONTO */}
          <p className="text-3xl font-bold text-white mb-6">
            ${getMonto().toFixed(2)}
          </p>

          {/* ACCIONES */}
          <div className="flex gap-3">
            <button
              onClick={() => onEditar(item, type)}
              className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800"
            >
              <Edit2 className="w-5 h-5" />
              Editar
            </button>

            {renderPrimaryAction()}
          </div>
        </div>
      </div>
    </div>
  )
}
