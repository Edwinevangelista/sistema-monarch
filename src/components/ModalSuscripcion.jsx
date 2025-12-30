import React, { useState, useEffect } from 'react'
import { Repeat, X } from 'lucide-react'
import { CATEGORIAS, CICLOS_SUSCRIPCION } from '../constants/categorias'

const ModalSuscripcion = ({ onClose, onSave, suscripcionInicial = null }) => {
  const [formData, setFormData] = useState({
    servicio: '',
    categoria: CATEGORIAS[0],
    costo: '',
    ciclo: 'Mensual',
    proximo_pago: '',
    estado: 'Activo',
    notas: ''
  })

  useEffect(() => {
    if (suscripcionInicial) {
      setFormData({
        servicio: suscripcionInicial.servicio || '',
        categoria: suscripcionInicial.categoria || CATEGORIAS[0],
        costo: suscripcionInicial.costo?.toString() || '',
        ciclo: suscripcionInicial.ciclo || 'Mensual',
        proximo_pago: suscripcionInicial.proximo_pago || '',
        estado: suscripcionInicial.estado || 'Activo',
        notas: suscripcionInicial.notas || ''
      })
    }
  }, [suscripcionInicial])

  const handleSubmit = async () => {
    if (!formData.servicio || !formData.costo) {
      alert('Por favor completa los campos requeridos')
      return
    }

    const resultado = await onSave({
      ...formData,
      costo: parseFloat(formData.costo),
      proximo_pago: formData.proximo_pago || null
    })

    if (resultado.success) {
      onClose()
    } else {
      alert('Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-indigo-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Repeat className="w-7 h-7 text-indigo-400" />
            {suscripcionInicial ? 'Editar Suscripción' : 'Nueva Suscripción'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Servicio *</label>
            <input
              type="text"
              placeholder="Ej: Netflix, Spotify, Amazon Prime"
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Categoría</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Costo *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Ciclo</label>
            <select
              value={formData.ciclo}
              onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CICLOS_SUSCRIPCION.map(ciclo => (
                <option key={ciclo} value={ciclo}>{ciclo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Próximo Pago</label>
            <input
              type="date"
              value={formData.proximo_pago}
              onChange={(e) => setFormData({ ...formData, proximo_pago: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Activo">Activo</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Notas</label>
            <textarea
              placeholder="Información adicional"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="2"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            {suscripcionInicial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalSuscripcion
