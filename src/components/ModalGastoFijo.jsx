import React, { useState, useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import { CATEGORIAS } from '../constants/categorias'

const ModalGastoFijo = ({ onClose, onSave, gastoInicial = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: CATEGORIAS[0],
    dia_venc: '',
    monto: '',
    auto_pago: 'No',
    estado: 'Pendiente',
    recurrente: true,
    notas: ''
  })

  useEffect(() => {
    if (gastoInicial) {
      setFormData({
        nombre: gastoInicial.nombre || '',
        categoria: gastoInicial.categoria || CATEGORIAS[0],
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        monto: gastoInicial.monto?.toString() || '',
        auto_pago: gastoInicial.auto_pago || 'No',
        estado: gastoInicial.estado || 'Pendiente',
        recurrente: gastoInicial.recurrente !== undefined ? gastoInicial.recurrente : true,
        notas: gastoInicial.notas || ''
      })
    }
  }, [gastoInicial])

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md border-2 border-yellow-500 my-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
            <span className="truncate">{gastoInicial ? 'Editar' : 'Nuevo'}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Nombre *</label>
            <input
              type="text"
              placeholder="Ej: Renta, Internet"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">Categoría</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Día (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={formData.dia_venc}
                onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Monto *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.recurrente}
                onChange={(e) => setFormData({ ...formData, recurrente: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded border-yellow-500 text-yellow-500 focus:ring-yellow-500"
              />
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">🔄 Recurrente Mensual</div>
                <div className="text-xs text-gray-400">Se crea automáticamente cada mes</div>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Auto-pago</label>
              <select
                value={formData.auto_pago}
                onChange={(e) => setFormData({ ...formData, auto_pago: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              >
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">Notas</label>
            <textarea
              placeholder="Información adicional"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="2"
              className="w-full bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base"
          >
            {gastoInicial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastoFijo
