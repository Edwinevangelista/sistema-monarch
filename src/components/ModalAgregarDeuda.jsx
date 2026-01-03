import React, { useEffect, useState } from 'react'
import { CreditCard, X } from 'lucide-react'

const ModalAgregarDeuda = ({ onClose, onSave, deudaInicial = null }) => {
  const esEdicion = Boolean(deudaInicial)

  const [formData, setFormData] = useState({
    id: null,
    cuenta: '',
    tipo: 'Tarjeta',
    saldo: '',
    apr: '',
    pago_minimo: '',
    pago_real: '',
    vence: '',
    estado: 'Activa'
  })

  // 🔁 Precargar datos cuando es edición
  useEffect(() => {
    if (deudaInicial) {
      setFormData({
        id: deudaInicial.id,
        cuenta: deudaInicial.cuenta || '',
        tipo: deudaInicial.tipo || 'Tarjeta',
        saldo: deudaInicial.saldo ?? '',
        apr: deudaInicial.apr ? deudaInicial.apr * 100 : '',
        pago_minimo: deudaInicial.pago_minimo ?? '',
        pago_real: deudaInicial.pago_real ?? '',
        vence: deudaInicial.vence || '',
        estado: deudaInicial.estado || 'Activa'
      })
    }
  }, [deudaInicial])

  const handleSubmit = async () => {
    if (!formData.cuenta || formData.saldo === '') {
      alert('Por favor completa los campos requeridos')
      return
    }

    const payload = {
      ...formData,
      saldo: parseFloat(formData.saldo),
      apr: formData.apr ? parseFloat(formData.apr) / 100 : 0,
      pago_minimo: parseFloat(formData.pago_minimo) || 0,
      pago_real: parseFloat(formData.pago_real) || 0
    }

    try {
      await onSave(payload)
      onClose()
    } catch (e) {
      console.error(e)
      alert('Error al guardar la deuda')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-red-400" />
            {esEdicion ? 'Editar Deuda' : 'Agregar Tarjeta / Deuda'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nombre de la Tarjeta/Cuenta *
            </label>
            <input
              value={formData.cuenta}
              onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option>Tarjeta</option>
              <option>Préstamo</option>
              <option>Crédito Personal</option>
              <option>Hipoteca</option>
              <option>Auto</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Saldo Actual *
              </label>
              <input
                type="number"
                value={formData.saldo}
                onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                APR (%)
              </label>
              <input
                type="number"
                value={formData.apr}
                onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Pago Mínimo
              </label>
              <input
                type="number"
                value={formData.pago_minimo}
                onChange={(e) => setFormData({ ...formData, pago_minimo: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={formData.vence}
                onChange={(e) => setFormData({ ...formData, vence: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option>Activa</option>
              <option>Pagada</option>
              <option>Cerrada</option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            {esEdicion ? 'Guardar Cambios' : 'Guardar Deuda'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregarDeuda
