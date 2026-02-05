import React, { useState, useEffect } from 'react'
import { CreditCard, X } from 'lucide-react'

const ModalAgregarDeuda = ({ onClose, onSave, deudaInicial = null }) => {
  const esEdicion = Boolean(deudaInicial)

  // --- ESTADOS ---
  // ✅ FIX: Aseguramos que 'loading' esté definido
  const [loading, setLoading] = useState(false)

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

  // --- EFECTOS ---
  useEffect(() => {
    if (deudaInicial) {
      console.log("Editando deuda:", deudaInicial)
      setFormData({
        id: deudaInicial.id,
        cuenta: deudaInicial.cuenta || '',
        tipo: deudaInicial.tipo || 'Tarjeta',
        saldo: deudaInicial.saldo ?? '',
        apr: deudaInicial.apr ? (deudaInicial.apr * 100).toString() : '',
        pago_minimo: deudaInicial.pago_minimo ?? '',
        pago_real: deudaInicial.pago_real ?? '',
        vence: deudaInicial.vence || '',
        estado: deudaInicial.estado || 'Activa'
      })
    } else {
      console.log("Modo Creación")
      setFormData({
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
    }
  }, [deudaInicial])

  const handleSubmit = async () => {
    if (!formData.cuenta || formData.saldo === '') {
      alert('Por favor completa el nombre y el saldo.')
      return
    }

    setLoading(true)
    console.log("Enviando payload:", formData)

    try {
      const payload = {
        cuenta: formData.cuenta,
        tipo: formData.tipo,
        saldo: parseFloat(formData.saldo),
        apr: formData.apr ? parseFloat(formData.apr) / 100 : 0,
        pago_minimo: parseFloat(formData.pago_minimo) || 0,
        pago_real: parseFloat(formData.pago_real) || 0,
        vence: formData.vence,
        estado: formData.estado
      }

      // ✅ FIX: Solo adjuntamos el ID si estamos editando
      if (esEdicion && deudaInicial) {
        payload.id = deudaInicial.id
      } else {
        // Si es nueva, nos aseguramos de no enviar ID
        delete payload.id
      }

      await onSave(payload)
      onClose()
    } catch (e) {
      console.error("Error al guardar deuda:", e)
      alert('Ocurrió un error al guardar la deuda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-red-500/50 max-h-[90vh] overflow-y-auto">
        
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
          {/* Nombre */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium">
              <CreditCard className="w-4 h-4" /> Nombre de la Tarjeta/Cuenta *
            </label>
            <input
              type="text"
              placeholder="Ej: Visa, Banco Azul"
              value={formData.cuenta}
              onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Tarjeta">Tarjeta de Crédito</option>
              <option value="Préstamo">Préstamo Personal</option>
              <option value="Crédito Personal">Crédito Personal</option>
              <option value="Hipoteca">Hipoteca</option>
              <option value="Auto">Auto</option>
            </select>
          </div>

          {/* Saldo y APR */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium">
                💵 Saldo Actual *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.saldo}
                onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium">
                % APR
              </label>
              <input
                type="number"
                placeholder="Ej: 15.5"
                value={formData.apr}
                onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Pago Mínimo y Vencimiento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium">
                ⬇️ Pago Mínimo
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.pago_minimo}
                onChange={(e) => setFormData({ ...formData, pago_minimo: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium">
                📅 Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={formData.vence}
                onChange={(e) => setFormData({ ...formData, vence: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="Activa">Activa</option>
              <option value="Pagada">Pagada</option>
              <option value="Cerrada">Cerrada</option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Guardar Deuda')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregarDeuda