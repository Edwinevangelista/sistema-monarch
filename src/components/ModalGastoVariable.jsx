import React, { useState, useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { CATEGORIAS, METODOS_PAGO } from '../constants/categorias'

const ModalGastoVariable = ({ onClose, onSave, gastoInicial = null }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: CATEGORIAS[0],
    descripcion: '',
    monto: '',
    metodo: METODOS_PAGO[0]
  })

  useEffect(() => {
    if (gastoInicial) {
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || CATEGORIAS[0],
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || METODOS_PAGO[0]
      })
    }
  }, [gastoInicial])

  const handleSubmit = async () => {
    if (!formData.monto) {
      alert('Por favor ingresa el monto')
      return
    }

    try {
      // ✅ Construir payload con ID si estamos editando
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto)
      }
      
      // ✅ Incluir ID si estamos editando
      if (gastoInicial?.id) {
        payload.id = gastoInicial.id
      }
      
      await onSave(payload)
      onClose()
    } catch (error) {
      console.error(error)
      alert('Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-red-400" />
            {gastoInicial ? 'Editar Gasto' : 'Nuevo Gasto Variable'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Fecha</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Categoría</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Supermercado, Gasolina"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Método de Pago</label>
            <select
              value={formData.metodo}
              onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {METODOS_PAGO.map(metodo => (
                <option key={metodo} value={metodo}>{metodo}</option>
              ))}
            </select>
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
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            {gastoInicial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastoVariable