import React, { useState, useEffect } from 'react'
import { ShoppingCart, X, Calendar, DollarSign, FileText, Tag, CreditCard } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalGastos = ({ onClose, onSaveVariable, onSaveFijo, gastoInicial = null }) => {
  const { cuentas } = useCuentasBancarias()
  const [tipoGasto, setTipoGasto] = useState('variable')
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: '',
    metodo: 'Efectivo',
    cuenta_id: '', 
    nombre: '',
    dia_venc: '',
    estado: 'Pendiente'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const categoriasVariable = [
    '🍔 Comida', '🚗 Transporte', '🎬 Entretenimiento', '👕 Ropa',
    '💊 Salud', '🏠 Hogar', '🎓 Educación', '🎁 Regalos', '📱 Teléfono',
    '⚡ Servicios', '📦 Otros'
  ]

  const categoriasFijo = [
    '🏠 Renta/Hipoteca', '⚡ Luz', '💧 Agua', '📡 Internet', '📱 Teléfono',
    '🚗 Seguro Auto', '🏥 Seguro Médico', '🎓 Colegiatura', '💳 Préstamo', '📦 Otros'
  ]

  const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque']

  useEffect(() => {
    if (gastoInicial) {
      // ✅ MEJORA: Detectamos si es fijo buscando 'dia_venc' (es más seguro que buscar 'nombre')
      const esFijo = gastoInicial.dia_venc !== undefined
      setTipoGasto(esFijo ? 'fijo' : 'variable')
      
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || '',
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || 'Efectivo',
        cuenta_id: gastoInicial.cuenta_id || '',
        nombre: gastoInicial.nombre || '',
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        estado: gastoInicial.estado || 'Pendiente'
      })
    } else {
      // Reseteamos el estado si abrimos el modal para crear uno nuevo
      setTipoGasto('variable')
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: '',
        descripcion: '',
        monto: '',
        metodo: 'Efectivo',
        cuenta_id: '', 
        nombre: '',
        dia_venc: '',
        estado: 'Pendiente'
      })
    }
  }, [gastoInicial])

const handleSubmit = async () => {
  if (!formData.categoria || !formData.monto) {
    setError('Por favor completa categoría y monto')
    return
  }
  if (tipoGasto === 'fijo' && !formData.nombre) {
    setError('Por favor completa el nombre del gasto fijo')
    return
  }

  if (tipoGasto === 'fijo' && !formData.dia_venc) {
    setError('Por favor ingresa el día de vencimiento (1-31)')
    return
  }

  setLoading(true)
  setError('')

  try {
    if (tipoGasto === 'variable') {
      // ✅ CORREGIDO: Ahora incluye el ID
      const payload = {
        fecha: formData.fecha,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        metodo: formData.metodo,
        cuenta_id: formData.cuenta_id || null
      }
      
      // ✅ Agregar ID si estamos editando
      if (gastoInicial?.id) {
        payload.id = gastoInicial.id
      }
      
      await onSaveVariable(payload)
    } else {
      // Gastos fijos - Ya está correcto
      await onSaveFijo({
        id: gastoInicial?.id, 
        nombre: formData.nombre,
        categoria: formData.categoria,
        monto: parseFloat(formData.monto),
        dia_venc: parseInt(formData.dia_venc),
        estado: formData.estado,
        cuenta_id: formData.cuenta_id || null
      })
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
          <button onClick={onClose} disabled={loading} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Selector Tipo */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-3 font-medium">Tipo de Gasto</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTipoGasto('variable')} disabled={loading} className={`p-4 rounded-xl border-2 transition-all ${tipoGasto === 'variable' ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'}`}>
              <div className="text-2xl mb-1">🛒</div>
              <div className="font-semibold">Variable</div>
              <div className="text-xs opacity-80">Gasto único</div>
            </button>
            <button type="button" onClick={() => setTipoGasto('fijo')} disabled={loading} className={`p-4 rounded-xl border-2 transition-all ${tipoGasto === 'fijo' ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'}`}>
              <div className="text-2xl mb-1">📅</div>
              <div className="font-semibold">Fijo</div>
              <div className="text-xs opacity-80">Recurrente</div>
            </button>
          </div>
        </div>

        {error && <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl">{error}</div>}

        <div className="space-y-4">
          {tipoGasto === 'variable' ? (
            <>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Fecha</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" disabled={loading} />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Categoría *</label>
                <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" disabled={loading}>
                  <option value="">Selecciona una categoría</option>
                  {categoriasVariable.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Descripción</label>
                <input type="text" placeholder="Ej: Supermercado" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" disabled={loading} />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Monto *</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" disabled={loading} />
              </div>
              
              {/* Selector Cuenta */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold">Cuenta de pago</label>
                <select value={formData.cuenta_id || ''} onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl">
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Método de Pago</label>
                <select value={formData.metodo} onChange={(e) => setFormData({ ...formData, metodo: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" disabled={loading}>
                  {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Nombre del Gasto *</label>
                <input type="text" placeholder="Ej: Renta, Luz" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500" disabled={loading} />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Categoría *</label>
                <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500" disabled={loading}>
                  <option value="">Selecciona una categoría</option>
                  {categoriasFijo.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Monto Mensual *</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500" disabled={loading} />
              </div>
              
              {/* Selector Cuenta */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold">Cuenta de pago</label>
                <select value={formData.cuenta_id || ''} onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl">
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Día de Vencimiento</label>
                <input type="number" min="1" max="31" placeholder="Día del mes (1-31)" value={formData.dia_venc} onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500" disabled={loading} />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Estado</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, estado: 'Pendiente' })} disabled={loading} className={`p-3 rounded-xl border-2 transition-all ${formData.estado === 'Pendiente' ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>⏳ Pendiente</button>
                  <button type="button" onClick={() => setFormData({ ...formData, estado: 'Pagado' })} disabled={loading} className={`p-3 rounded-xl border-2 transition-all ${formData.estado === 'Pagado' ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>✅ Pagado</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${tipoGasto === 'variable' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
            {loading ? 'Guardando...' : (gastoInicial ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalGastos