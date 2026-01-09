import React, { useState, useEffect } from 'react'
import { ShoppingCart, X, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { CATEGORIAS, METODOS_PAGO } from '../constants/categorias'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalGastoVariable = ({ onClose, onSave, gastoInicial = null }) => {
  const { cuentas } = useCuentasBancarias() // ✅ Agregado para seleccionar cuenta
  const [loading, setLoading] = useState(false) // ✅ Estado de carga

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: CATEGORIAS[0],
    descripcion: '',
    monto: '',
    metodo: METODOS_PAGO[0],
    cuenta_id: '' // ✅ Campo para cuenta bancaria
  })

  useEffect(() => {
    if (gastoInicial) {
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || CATEGORIAS[0],
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || METODOS_PAGO[0],
        cuenta_id: gastoInicial.cuenta_id || '' // ✅ Cargar cuenta inicial
      })
    }
  }, [gastoInicial])

  const handleSubmit = async () => {
    if (!formData.monto) {
      alert('Por favor ingresa el monto')
      return
    }

    setLoading(true) // ✅ Iniciar carga

    try {
      // ✅ FIX: Sintaxis corregida (faltaban los dos puntos)
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto)
      }
      
      // Incluir ID si estamos editando
      if (gastoInicial?.id) {
        payload.id = gastoInicial.id
      }
      
      await onSave(payload)
      
      // ✅ Mensaje de éxito
      alert(`✅ ${gastoInicial ? 'Gasto actualizado' : 'Gasto registrado'} correctamente`)
      onClose()
    } catch (error) {
      console.error(error)
      alert('Error al guardar')
    } finally {
      setLoading(false) // ✅ Finalizar carga
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border-2 border-red-500 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-red-400" />
            {gastoInicial ? 'Editar Gasto' : 'Nuevo Gasto Variable'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white disabled:opacity-50" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Fecha</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Categoría</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Supermercado, Gasolina"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Monto *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* ✅ NUEVO: Selector de Cuenta Bancaria */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cuenta Bancaria (Opcional)
            </label>
            <select
              value={formData.cuenta_id}
              onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              <option value="">Sin asignar</option>
              {cuentas?.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.banco} - {cuenta.tipo_cuenta} (${Number(cuenta.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              💡 Selecciona una cuenta para descontar el monto automáticamente.
            </p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Método de Pago</label>
            <select
              value={formData.metodo}
              onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
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
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                {gastoInicial ? 'Actualizar' : 'Guardar'}
                {!loading && <CheckCircle className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastoVariable