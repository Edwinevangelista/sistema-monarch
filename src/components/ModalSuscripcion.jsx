import React, { useState, useEffect } from 'react'
import { Repeat, X, Calendar, DollarSign, FileText, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalSuscripcion = ({ onClose, onSave, suscripcionInicial = null }) => {
  const { cuentas } = useCuentasBancarias()

  // ✅ FIX: Sintaxis corregida en defaultData
  const defaultData = {
    servicio: '',
    categoria: '📦 Suscripciones',
    costo: '',
    ciclo: 'Mensual',
    proximo_pago: new Date().toISOString().split('T')[0],
    descripcion: '',
    cuenta_id: '',
    autopago: false,
    estado: 'Activo'
  }

  const [formData, setFormData] = useState(defaultData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (suscripcionInicial) {
      setFormData({
        servicio: suscripcionInicial.servicio || '',
        categoria: suscripcionInicial.categoria || '📦 Suscripciones',
        costo: String(suscripcionInicial.costo || ''),
        ciclo: suscripcionInicial.ciclo || 'Mensual',
        proximo_pago: suscripcionInicial.proximo_pago || '',
        descripcion: suscripcionInicial.descripcion || '',
        cuenta_id: suscripcionInicial.cuenta_id || '',
        autopago: !!suscripcionInicial.autopago,
        estado: suscripcionInicial.estado || 'Activo',
        id: suscripcionInicial.id
      })
    } else {
      // FIX: Corrección de corchetes
      setFormData(prev => ({ ...prev, proximo_pago: new Date().toISOString().split('T')[0] }))
    }
  }, [suscripcionInicial])

  const handleSubmit = async () => {
    if (!formData.servicio || !formData.costo || !formData.ciclo) {
      setError('Por favor completa servicio, costo y ciclo.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const dataAGuardar = {
        servicio: formData.servicio,
        categoria: formData.categoria,
        costo: parseFloat(formData.costo),
        ciclo: formData.ciclo,
        proximo_pago: formData.proximo_pago,
        descripcion: formData.descripcion,
        cuenta_id: formData.cuenta_id || null,
        autopago: formData.autopago,
        estado: formData.estado
      }

      if (suscripcionInicial) {
        dataAGuardar.id = suscripcionInicial.id
      }

      await onSave(dataAGuardar)
      
      // ✅ FIX: Mensaje de éxito
      alert(`✅ ${suscripcionInicial ? 'Suscripción actualizada' : 'Suscripción creada'} correctamente`)
      
      onClose()
    } catch (err) {
      console.error('Error al guardar suscripción:', err)
      setError('Ocurrió un error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // FIX MOBILE: Centrado y padding mejorado
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      
      <div className="bg-gray-900 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 shadow-2xl relative">
        
        {/* --- HEADER ESTILIZADO --- */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800/80 p-6 rounded-t-2xl border-b border-indigo-500/30 sticky top-0 z-10 bg-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/30">
                <Repeat className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {suscripcionInicial ? 'Editar Suscripción' : 'Nueva Suscripción'}
                </h2>
                {suscripcionInicial && (
                  <p className="text-xs text-indigo-300 mt-0.5">Editando: {suscripcionInicial.servicio}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} disabled={loading} className="p-2 bg-black/20 hover:bg-black/40 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* --- FORMULARIO --- */}
        <div className="p-4 md:p-6 space-y-5">
          
          {/* 1. Nombre */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm md:text-base">
              <Repeat className="w-4 h-4 text-indigo-400" /> Servicio *
            </label>
            <input 
              type="text" 
              placeholder="Ej: Netflix, Spotify" 
              value={formData.servicio} 
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })} 
              className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-600 disabled:bg-gray-900 disabled:opacity-50 text-base" 
              disabled={loading} 
            />
          </div>

          {/* 2. Categoría */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Categoría</label>
            <select 
              value={formData.categoria} 
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
              className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 text-base"
              disabled={loading}
            >
              <option value="📦 Suscripciones">📦 Suscripciones</option>
              <option value="🎬 Entretenimiento">🎬 Entretenimiento</option>
              <option value="💊 Salud / Fitness">💊 Salud / Fitness</option>
              <option value="📚 Educación">📚 Educación</option>
              <option value="💻 Tecnología">💻 Tecnología / Software</option>
              <option value="🏠 Servicios">🏠 Servicios Hogar</option>
            </select>
          </div>

          {/* 3. Costo y Ciclo */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
                <DollarSign className="w-4 h-4 text-green-400" /> Monto *
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.costo} 
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })} 
                className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-700 text-base" 
                disabled={loading} 
              />
            </div>
            <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
                <FileText className="w-4 h-4 text-blue-400" /> Ciclo *
              </label>
              <select 
                value={formData.ciclo} 
                onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })} 
                className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 text-base" 
                disabled={loading}
              >
                <option value="Mensual">Mensual</option>
                <option value="Anual">Anual</option>
                <option value="Semanal">Semanal</option>
              </select>
            </div>
          </div>

          {/* 4. Fecha */}
          <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 font-medium text-sm">
              <Calendar className="w-4 h-4 text-purple-400" /> Próximo Pago *
            </label>
            <input 
              type="date" 
              value={formData.proximo_pago} 
              onChange={(e) => setFormData({ ...formData, proximo_pago: e.target.value })} 
              className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700 text-base" 
              disabled={loading} 
            />
          </div>

          {/* 5. Descripción */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" /> Notas
            </label>
            <textarea 
              placeholder="Opcional" 
              value={formData.descripcion} 
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
              className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm border border-gray-700" 
              rows="2"
              disabled={loading} 
            />
          </div>

          {/* 6. Cuenta y Autopago */}
          <div className="space-y-3 md:space-y-4">
            <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
              <label className="block text-gray-300 mb-2 text-sm font-semibold">Cuenta de cobro</label>
              <select 
                value={formData.cuenta_id || ''} 
                onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} 
                className="w-full bg-gray-700 text-white px-4 py-2 md:py-3 rounded-lg border border-gray-700 text-base"
                disabled={loading}
              >
                <option value="">Seleccionar cuenta</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <div>
                    <span className="text-white font-medium text-sm md:text-base">Autopago</span>
                    <p className="text-xs text-gray-400">
                      {formData.autopago ? 'Se cobrará automáticamente' : 'Pago manual'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autopago: !formData.autopago })}
                  disabled={loading}
                  className={`
                    relative inline-flex h-6 w-11 md:w-11 items-center rounded-full transition-colors focus:outline-none
                    ${formData.autopago ? 'bg-green-600' : 'bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData.autopago ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
              {formData.autopago && !formData.cuenta_id && (
                <div className="mt-2 text-orange-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Selecciona una cuenta para activar el cobro automático.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- BOTONES PEGADOS ABAJO (Sticky) --- */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-700 z-20">
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={loading} 
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {suscripcionInicial ? 'Guardar' : 'Crear'}
                  {!loading && <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalSuscripcion