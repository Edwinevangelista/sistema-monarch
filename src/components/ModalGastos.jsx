import React, { useState, useEffect } from 'react'
import { ShoppingCart, X, Calendar, DollarSign, FileText, Tag, CreditCard } from 'lucide-react'

const ModalGastos = ({ onClose, onSaveVariable, onSaveFijo, gastoInicial = null }) => {
  const [tipoGasto, setTipoGasto] = useState('variable') // 'variable' o 'fijo'
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: '',
    metodo: 'Efectivo',
    // Campos específicos para gastos fijos
    nombre: '',
    dia_venc: '',
    estado: 'Pendiente'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Categorías por tipo
  const categoriasVariable = [
    '🍔 Comida',
    '🚗 Transporte',
    '🎬 Entretenimiento',
    '👕 Ropa',
    '💊 Salud',
    '🏠 Hogar',
    '🎓 Educación',
    '🎁 Regalos',
    '📱 Teléfono',
    '⚡ Servicios',
    '📦 Otros'
  ]

  const categoriasFijo = [
    '🏠 Renta/Hipoteca',
    '⚡ Luz',
    '💧 Agua',
    '📡 Internet',
    '📱 Teléfono',
    '🚗 Seguro Auto',
    '🏥 Seguro Médico',
    '🎓 Colegiatura',
    '💳 Préstamo',
    '📦 Otros'
  ]

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque']

  // Pre-cargar datos si estamos editando
  useEffect(() => {
    if (gastoInicial) {
      // Detectar si es gasto fijo o variable
      const esFijo = gastoInicial.nombre !== undefined
      setTipoGasto(esFijo ? 'fijo' : 'variable')
      
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || '',
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || 'Efectivo',
        nombre: gastoInicial.nombre || '',
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        estado: gastoInicial.estado || 'Pendiente'
      })
    }
  }, [gastoInicial])

  const handleSubmit = async () => {
    // Validación
    if (!formData.categoria || !formData.monto) {
      setError('Por favor completa categoría y monto')
      return
    }

    if (tipoGasto === 'fijo' && !formData.nombre) {
      setError('Por favor completa el nombre del gasto fijo')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (tipoGasto === 'variable') {
        // Guardar gasto variable
        const gastoData = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          metodo: formData.metodo
        }
        await onSaveVariable(gastoData)
      } else {
        // Guardar gasto fijo
        const gastoFijoData = {
          nombre: formData.nombre,
          categoria: formData.categoria,
          monto: parseFloat(formData.monto),
          dia_venc: parseInt(formData.dia_venc),
          estado: formData.estado
        }
        await onSaveFijo(gastoFijoData)
      }
      
      onClose()
    } catch (err) {
      console.error('Error al guardar gasto:', err)
      setError(err?.message || 'Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {gastoInicial ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Selector de Tipo de Gasto */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-3 font-medium">Tipo de Gasto</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoGasto('variable')}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all ${
                tipoGasto === 'variable'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">🛒</div>
              <div className="font-semibold">Variable</div>
              <div className="text-xs opacity-80">Gasto único</div>
            </button>
            <button
              type="button"
              onClick={() => setTipoGasto('fijo')}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all ${
                tipoGasto === 'fijo'
                  ? 'bg-yellow-600 border-yellow-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="font-semibold">Fijo</div>
              <div className="text-xs opacity-80">Recurrente</div>
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="space-y-4">
          {/* GASTO VARIABLE */}
          {tipoGasto === 'variable' && (
            <>
              {/* Fecha */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasVariable.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej: Supermercado, Gasolina"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Método de Pago
                </label>
                <select
                  value={formData.metodo}
                  onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                >
                  {metodosPago.map(metodo => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* GASTO FIJO */}
          {tipoGasto === 'fijo' && (
            <>
              {/* Nombre */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nombre del Gasto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Renta, Netflix, Luz"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={loading}
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={loading}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasFijo.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto Mensual *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={loading}
                />
              </div>

              {/* Día de Vencimiento */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Día de Vencimiento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Día del mes (1-31)"
                  value={formData.dia_venc}
                  onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={loading}
                />
                <p className="text-gray-400 text-xs mt-1">Día del mes en que vence este gasto</p>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-gray-300 mb-2">Estado</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado: 'Pendiente' })}
                    disabled={loading}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.estado === 'Pendiente'
                        ? 'bg-yellow-600 border-yellow-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                  >
                    ⏳ Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado: 'Pagado' })}
                    disabled={loading}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.estado === 'Pagado'
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                  >
                    ✅ Pagado
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
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
            className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              tipoGasto === 'variable' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              gastoInicial ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastos