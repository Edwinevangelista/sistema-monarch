import React, { useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import { METODOS_PAGO } from '../constants/categorias'

const ModalPagoTarjeta = ({ onClose, onSave, deudas }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tarjeta: deudas[0]?.cuenta || '',
    monto: '',
    principal: '',
    interes: '',
    metodo: METODOS_PAGO[0],
    notas: ''
  })

  const handleSubmit = async () => {
    try {
      const deudaSeleccionada = deudas.find(
        d => d.cuenta === formData.tarjeta
      )

      if (!deudaSeleccionada) {
        alert('Debes seleccionar una tarjeta válida')
        return
      }

      await onSave({
        deuda_id: deudaSeleccionada.id,
        monto_total: Number(formData.monto),
        a_principal: Number(formData.principal),
        intereses: Number(formData.interes),
        metodo: formData.metodo,
        fecha: formData.fecha,
        notas: formData.notas
      })

      onClose()
    } catch (e) {
      console.error('Error registrando pago:', e)
      alert('Error al registrar el pago')
    }
  }

  const principalNumber = Number(formData.principal || 0)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-purple-400" />
            Pago de Tarjeta
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* TARJETA */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tarjeta *
            </label>
            <select
              value={formData.tarjeta}
              onChange={(e) =>
                setFormData({ ...formData, tarjeta: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              {deudas.map((d) => (
                <option key={d.id} value={d.cuenta}>
                  {d.cuenta} – Saldo: ${d.saldo}
                </option>
              ))}
            </select>
          </div>

          {/* MONTO + FECHA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Monto Total *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) =>
                  setFormData({ ...formData, monto: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) =>
                  setFormData({ ...formData, fecha: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PRINCIPAL + INTERESES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                A Principal
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.principal}
                onChange={(e) =>
                  setFormData({ ...formData, principal: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="0.00"
              />

              {principalNumber === 0 && (
                <p className="text-yellow-400 text-xs mt-2">
                  ⚠️ Este pago no reducirá el balance de la tarjeta.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Intereses
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interes}
                onChange={(e) =>
                  setFormData({ ...formData, interes: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* MÉTODO */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.metodo}
              onChange={(e) =>
                setFormData({ ...formData, metodo: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>

          {/* NOTAS */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notas
            </label>
            <input
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Detalles del pago"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Registrar Pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalPagoTarjeta
