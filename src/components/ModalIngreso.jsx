import React, { useState, useEffect } from 'react'
import { DollarSign, X, Building2 } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalIngreso = ({ onClose, onSave, ingresoInicial = null }) => {
  const { cuentas, loading: loadingCuentas } = useCuentasBancarias()
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    fuente: '',
    descripcion: '',
    monto: '',
    cuenta_id: ''
  })

  // Pre-cargar datos si estamos editando
  useEffect(() => {
    if (ingresoInicial) {
      setFormData({
        fecha: ingresoInicial.fecha || new Date().toISOString().split('T')[0],
        fuente: ingresoInicial.fuente || '',
        descripcion: ingresoInicial.descripcion || '',
        monto: ingresoInicial.monto?.toString() || '',
        cuenta_id: ingresoInicial.cuenta_id || ''
      })
    }
  }, [ingresoInicial])

  const handleSubmit = async () => {
    if (!formData.fuente || !formData.monto) {
      alert('Por favor completa los campos requeridos')
      return
    }

    try {
      const dataToSave = {
        fecha: formData.fecha,
        fuente: formData.fuente,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        cuenta_id: formData.cuenta_id || null
      }

      // ✅ Si hay ingresoInicial, incluir el ID para edición
      if (ingresoInicial?.id) {
        dataToSave.id = ingresoInicial.id
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error("Error guardando:", error)
      alert('Error al guardar el ingreso. Intenta nuevamente.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {ingresoInicial ? 'Editar Ingreso' : 'Nuevo Ingreso'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Fecha</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">
              Fuente <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Salario, Freelance, Venta"
              value={formData.fuente}
              onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Cuenta Bancaria (Opcional)
            </label>
            <select
              value={formData.cuenta_id}
              onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loadingCuentas}
            >
              <option value="">Sin asignar</option>
              {cuentas?.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.banco} - {cuenta.tipo_cuenta} (${Number(cuenta.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              💡 Si seleccionas una cuenta, el saldo se actualizará automáticamente
            </p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Descripción</label>
            <textarea
              placeholder="Detalles adicionales (opcional)"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">
              Monto <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-gray-700 text-white pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.fuente || !formData.monto}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ingresoInicial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalIngreso