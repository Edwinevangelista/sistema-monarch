import React, { useState, useEffect } from 'react'
import { DollarSign, X, Building2, Calendar, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react' 
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalIngreso = ({ onClose, onSave, ingresoInicial = null }) => {
  const { cuentas, loading: loadingCuentas } = useCuentasBancarias()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
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
      setError('Por favor completa los campos requeridos (Fuente y Monto)')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const dataToSave = {
        fecha: formData.fecha,
        fuente: formData.fuente,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        cuenta_id: formData.cuenta_id || null
      }

      // Si hay ingresoInicial, incluir el ID para edición
      if (ingresoInicial?.id) {
        dataToSave.id = ingresoInicial.id
      }

      await onSave(dataToSave)
      
      alert(`✅ ${ingresoInicial ? 'Ingreso actualizado' : 'Ingreso guardado'} correctamente`)
      onClose()
    } catch (error) {
      console.error("Error guardando:", error)
      setError('Error al guardar el ingreso. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // ✅ RESPONSIVO: Padding y centrado mejorados para móvil
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      
      <div className="bg-gray-900 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 shadow-2xl relative">
        
        {/* --- HEADER ESTILIZADO --- */}
        <div className="bg-gradient-to-r from-green-600 to-green-800/80 p-4 md:p-6 rounded-t-2xl border-b border-green-500/30 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-green-500/20 p-2 rounded-xl border border-green-400/30">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {ingresoInicial ? 'Editar Ingreso' : 'Nuevo Ingreso'}
                </h2>
                {ingresoInicial && (
                  <p className="text-xs text-green-300 mt-0.5">Editando: {ingresoInicial.fuente}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={isLoading} 
              className="p-2 bg-black/20 hover:bg-black/40 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-3 md:px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* --- FORMULARIO --- */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-5">
          
          {/* 1. FECHA - ✅ RESPONSIVO OPTIMIZADO */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
              <Calendar className="w-4 h-4 text-blue-400" /> Fecha
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              disabled={isLoading}
              className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 disabled:bg-gray-900 disabled:opacity-50 text-sm md:text-base"
              style={{
                // ✅ FIX CRÍTICO: Estilos específicos para date input en iOS
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                fontSize: '16px', // Evita zoom automático en iOS
              }}
            />
          </div>

          {/* 2. FUENTE */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
              <DollarSign className="w-4 h-4 text-green-400" /> Fuente <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Salario, Freelance, Venta"
              value={formData.fuente}
              onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
              disabled={isLoading}
              className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 border border-gray-600 disabled:bg-gray-900 disabled:opacity-50 text-sm md:text-base"
              style={{ fontSize: '16px' }} // ✅ Evita zoom en iOS
            />
          </div>

          {/* 3. MONTO */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
              <DollarSign className="w-4 h-4 text-green-400" /> Monto <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                disabled={isLoading}
                className="w-full bg-gray-700 text-white pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 border border-gray-600 disabled:bg-gray-900 disabled:opacity-50 text-sm md:text-base"
                style={{ fontSize: '16px' }} // ✅ Evita zoom en iOS
              />
            </div>
          </div>

          {/* 4. CUENTA BANCARIA */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
              <Building2 className="w-4 h-4 text-purple-400" />
              Cuenta Bancaria
            </label>
            <select
              value={formData.cuenta_id}
              onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
              disabled={loadingCuentas || isLoading}
              className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 disabled:bg-gray-900 disabled:opacity-50 text-sm md:text-base"
              style={{ fontSize: '16px' }} // ✅ Evita zoom en iOS
            >
              <option value="">Sin asignar</option>
              {cuentas?.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre || cuenta.banco} - {cuenta.tipo_cuenta} (${Number(cuenta.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-[10px] md:text-xs text-gray-400 mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">💡</span>
              <span>Si seleccionas una cuenta, el saldo se actualizará automáticamente</span>
            </p>
          </div>

          {/* 5. DESCRIPCIÓN */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" /> Descripción (Opcional)
            </label>
            <textarea
              placeholder="Detalles adicionales..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={isLoading}
              rows={2}
              className="w-full bg-gray-700 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 placeholder-gray-500 resize-none border border-gray-700 disabled:bg-gray-900 disabled:opacity-50 text-sm md:text-base"
              style={{ fontSize: '16px' }} // ✅ Evita zoom en iOS
            />
          </div>
        </div>

        {/* --- BOTONES PEGADOS ABAJO (Sticky) --- */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-700 z-20">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.fuente || !formData.monto}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {ingresoInicial ? 'Actualizar' : 'Guardar'}
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

export default ModalIngreso