import React, { useState, useEffect } from 'react'
import { ShoppingCart, X, Calendar, DollarSign, FileText, Tag, CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
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
        const payload = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          metodo: formData.metodo,
          cuenta_id: formData.cuenta_id || null
        }
        
        if (gastoInicial?.id) {
          payload.id = gastoInicial.id
        }
        
        await onSaveVariable(payload)
        alert('✅ Gasto variable registrado correctamente')
      } else {
        await onSaveFijo({
          id: gastoInicial?.id, 
          nombre: formData.nombre,
          categoria: formData.categoria,
          monto: parseFloat(formData.monto),
          dia_venc: parseInt(formData.dia_venc),
          estado: formData.estado,
          cuenta_id: formData.cuenta_id || null
        })
        alert('✅ Gasto fijo registrado correctamente')
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
    // ✅ RESPONSIVO: Padding y centrado mejorados
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      <div className="bg-gray-900 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 to-red-800/80 p-4 md:p-6 rounded-t-2xl border-b border-red-500/30 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-red-500/20 p-2 rounded-xl border border-red-400/30">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {gastoInicial ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                {gastoInicial && (
                  <p className="text-xs text-red-300 mt-0.5">
                    Editando: {gastoInicial.nombre || gastoInicial.descripcion}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={loading} 
              className="p-2 bg-black/20 hover:bg-black/40 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* SELECTOR TIPO */}
        <div className="p-4 md:p-6 border-b border-gray-700">
          <label className="block text-gray-300 mb-3 font-medium text-sm">Tipo de Gasto</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setTipoGasto('variable')} 
              disabled={loading} 
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                tipoGasto === 'variable' 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
              }`}
            >
              <div className="text-xl md:text-2xl mb-1">🛒</div>
              <div className="font-semibold text-sm md:text-base">Variable</div>
              <div className="text-[10px] md:text-xs opacity-80">Gasto único</div>
            </button>
            <button 
              type="button" 
              onClick={() => setTipoGasto('fijo')} 
              disabled={loading} 
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                tipoGasto === 'fijo' 
                  ? 'bg-yellow-600 border-yellow-600 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
              }`}
            >
              <div className="text-xl md:text-2xl mb-1">📅</div>
              <div className="font-semibold text-sm md:text-base">Fijo</div>
              <div className="text-[10px] md:text-xs opacity-80">Recurrente</div>
            </button>
          </div>
        </div>

        {/* MENSAJE ERROR */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="p-4 md:p-6 space-y-4">
          {tipoGasto === 'variable' ? (
            <>
              {/* FECHA */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" /> Fecha
                </label>
                <input 
                  type="date" 
                  value={formData.fecha} 
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                  style={{ fontSize: '16px' }} // ✅ iOS fix
                />
              </div>

              {/* CATEGORÍA */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4" /> Categoría *
                </label>
                <select 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasVariable.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" /> Descripción
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Supermercado" 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* MONTO */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" /> Monto *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={formData.monto} 
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              {/* CUENTA */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 text-sm font-semibold">Cuenta de pago</label>
                <select 
                  value={formData.cuenta_id || ''} 
                  onChange={(e) => {
                    const cuentaId = e.target.value
                    // ✅ LÓGICA AUTOMÁTICA DE DETECCIÓN DE MÉTODO
                    const cuentaSeleccionada = cuentas.find(c => c.id === cuentaId)
                    let metodoCalculado = 'Efectivo' // Default

                    if (cuentaSeleccionada) {
                      const nombre = cuentaSeleccionada.nombre.toLowerCase()
                      const tipo = (cuentaSeleccionada.tipo || '').toLowerCase()
                      
                      // Detectar Tarjetas (Crédito/Débito) o Bancos
                      if (
                        nombre.includes('visa') || 
                        nombre.includes('master') || 
                        nombre.includes('amex') ||
                        nombre.includes('tarjeta') ||
                        tipo.includes('credito') || 
                        tipo.includes('debito') ||
                        nombre.includes('banc') 
                      ) {
                        metodoCalculado = 'Tarjeta'
                      } 
                      // Detectar Efectivo
                      else if (
                        nombre.includes('efectivo') || 
                        tipo.includes('efectivo') ||
                        nombre.includes('cash') ||
                        nombre.includes('wallet') ||
                        nombre.includes('billetera')
                      ) {
                        metodoCalculado = 'Efectivo'
                      }
                    }
                    
                    setFormData({ 
                      ...formData, 
                      cuenta_id: cuentaId, 
                      metodo: metodoCalculado 
                    })
                  }} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg disabled:opacity-50 text-sm md:text-base border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (${Number(c.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* MÉTODO */}
              <div>
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" /> Método de Pago
                </label>
                <select 
                  value={formData.metodo} 
                  onChange={(e) => setFormData({ ...formData, metodo: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                  style={{ fontSize: '16px' }}
                >
                  {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* NOMBRE */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" /> Nombre del Gasto *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Renta, Luz" 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* CATEGORÍA */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4" /> Categoría *
                </label>
                <select 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasFijo.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* MONTO Y DÍA */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                  <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4" /> Monto *
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.monto} 
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })} 
                    disabled={loading}
                    className="w-full bg-gray-700 text-white px-2 py-2 md:px-3 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                  <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" /> Día
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31" 
                    placeholder="15" 
                    value={formData.dia_venc} 
                    onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })} 
                    disabled={loading}
                    className="w-full bg-gray-700 text-white px-2 py-2 md:px-3 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 text-sm md:text-base border border-gray-600"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
              
              {/* CUENTA */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 mb-2 text-sm font-semibold">Cuenta de pago</label>
                <select 
                  value={formData.cuenta_id || ''} 
                  onChange={(e) => {
                    const cuentaId = e.target.value
                    // ✅ LÓGICA AUTOMÁTICA DE DETECCIÓN DE MÉTODO (Versión Fijo)
                    const cuentaSeleccionada = cuentas.find(c => c.id === cuentaId)
                    let metodoCalculado = 'Efectivo'

                    if (cuentaSeleccionada) {
                      const nombre = cuentaSeleccionada.nombre.toLowerCase()
                      const tipo = (cuentaSeleccionada.tipo || '').toLowerCase()
                      
                      if (
                        nombre.includes('visa') || 
                        nombre.includes('master') || 
                        nombre.includes('amex') ||
                        nombre.includes('tarjeta') ||
                        tipo.includes('credito') || 
                        tipo.includes('debito') ||
                        nombre.includes('banc') 
                      ) {
                        metodoCalculado = 'Tarjeta'
                      } 
                      else if (
                        nombre.includes('efectivo') || 
                        tipo.includes('efectivo') ||
                        nombre.includes('cash') ||
                        nombre.includes('wallet') ||
                        nombre.includes('billetera')
                      ) {
                        metodoCalculado = 'Efectivo'
                      }
                    }
                    
                    setFormData({ 
                      ...formData, 
                      cuenta_id: cuentaId, 
                      metodo: metodoCalculado 
                    })
                  }} 
                  disabled={loading}
                  className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg disabled:opacity-50 text-sm md:text-base border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Seleccionar cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (${Number(c.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Estado</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, estado: 'Pendiente' })} 
                    disabled={loading} 
                    className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base ${
                      formData.estado === 'Pendiente' 
                        ? 'bg-yellow-600 border-yellow-600 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 disabled:opacity-50'
                    }`}
                  >
                    ⏳ Pendiente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, estado: 'Pagado' })} 
                    disabled={loading} 
                    className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base ${
                      formData.estado === 'Pagado' 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 disabled:opacity-50'
                    }`}
                  >
                    ✅ Pagado
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTONES */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-700 z-20">
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={loading} 
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base ${
                tipoGasto === 'variable' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {gastoInicial ? 'Actualizar' : 'Guardar'}
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalGastos