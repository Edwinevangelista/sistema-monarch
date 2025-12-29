import React, { useState } from 'react'
import { FileText, X } from 'lucide-react'
import { CATEGORIAS } from '../constants/categorias'

const ModalGastoFijo = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: CATEGORIAS[0],
    dia_venc: '',
    monto: '',
    auto_pago: 'No',
    estado: 'Pendiente',
    notas: ''
  })

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.monto) {
      alert('Por favor completa los campos requeridos')
      return
    }

    const resultado = await onSave({
      ...formData,
      monto: parseFloat(formData.monto),
      dia_venc: formData.dia_venc ? parseInt(formData.dia_venc) : null
    })

    if (resultado.success) {
      onClose()
    } else {
      alert('Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-yellow-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-yellow-400" />
            Nuevo Gasto Fijo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre del Gasto *</label>
            <input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder="Ej: Renta, Seguro, Internet"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Categoría</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Día de Vencimiento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dia_venc}
                onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                placeholder="1-31"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Auto-Pago</label>
              <select
                value={formData.auto_pago}
                onChange={(e) => setFormData({ ...formData, auto_pago: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              >
                <option>Sí</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              >
                <option>Pendiente</option>
                <option>Pagado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Notas</label>
            <input
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder="Información adicional"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastoFijo
