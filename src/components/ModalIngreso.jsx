import React, { useState, useEffect } from 'react'
import { DollarSign, X } from 'lucide-react'

const ModalIngreso = ({ onClose, onSave, ingresoInicial = null }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    fuente: '',
    descripcion: '',
    monto: ''
  })

  // Pre-cargar datos si estamos editando
  useEffect(() => {
    if (ingresoInicial) {
      setFormData({
        fecha: ingresoInicial.fecha || new Date().toISOString().split('T')[0],
        fuente: ingresoInicial.fuente || '',
        descripcion: ingresoInicial.descripcion || '',
        monto: ingresoInicial.monto?.toString() || ''
      })
    }
  }, [ingresoInicial])

  const handleSubmit = async () => {
    if (!formData.fuente || !formData.monto) {
      alert('Por favor completa los campos requeridos')
      return
    }

    try {
      // Ejecutamos la función de guardar que viene del padre (addIngreso)
      await onSave({
        ...formData,
        monto: parseFloat(formData.monto)
      })

      // CORRECCIÓN: Ya no intentamos leer 'resultado.success'.
      // Asumimos que si no hubo error en el try/catch, fue exitoso.
      onClose()
    } catch (error) {
      console.error("Error guardando:", error)
      alert('Error al guardar el ingreso. Intenta nuevamente.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
            <label className="block text-gray-300 mb-2">Fecha</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Fuente *</label>
            <input
              type="text"
              placeholder="Ej: Salario, Freelance, Venta"
              value={formData.fuente}
              onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Descripción</label>
            <input
              type="text"
              placeholder="Detalles adicionales (opcional)"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Monto *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
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
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
          >
            {ingresoInicial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalIngreso