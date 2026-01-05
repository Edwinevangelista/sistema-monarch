import React, { useState, useEffect } from 'react'
import { Repeat, X, CreditCard, Wallet } from 'lucide-react'
import { CATEGORIAS, CICLOS_SUSCRIPCION } from '../constants/categorias'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

const ModalSuscripcion = ({ onClose, onSave, suscripcionInicial = null }) => {
  const { cuentas } = useCuentasBancarias()

  const [formData, setFormData] = useState({
    servicio: '',
    categoria: CATEGORIAS[0],
    costo: '',
    ciclo: 'Mensual',
    proximo_pago: '',
    estado: 'Activo',
    autopago: false,
    cuenta_id: '',
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
        autopago: suscripcionInicial.autopago || false,
        cuenta_id: suscripcionInicial.cuenta_id || '',
        notas: suscripcionInicial.notas || ''
      })
    }
  }, [suscripcionInicial])

  const handleSubmit = async () => {
    if (!formData.servicio || !formData.costo) {
      alert('Por favor completa los campos requeridos')
      return
    }
    if (formData.autopago && !formData.cuenta_id) {
      alert('Debes seleccionar una cuenta para el cobro automático')
      return
    }

    try {
      await onSave({
        ...formData,
        costo: parseFloat(formData.costo),
        proximo_pago: formData.proximo_pago || null
      })
      onClose()
    } catch (error) {
      console.error(error)
      alert('Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-indigo-500 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-indigo-500/30 p-4 md:p-6 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Repeat className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
              {suscripcionInicial ? 'Editar Suscripción' : 'Nueva Suscripción'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full transition">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-4 md:p-6 space-y-4">
          
          {/* Servicio */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Servicio *</label>
            <input type="text" placeholder="Ej: Netflix, Spotify" value={formData.servicio} onChange={(e) => setFormData({ ...formData, servicio: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base" />
          </div>

          {/* Grid Categoría + Ciclo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Categoría</label>
              <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base">
                {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Ciclo</label>
              <select value={formData.ciclo} onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base">
                {CICLOS_SUSCRIPCION.map(ciclo => <option key={ciclo} value={ciclo}>{ciclo}</option>)}
              </select>
            </div>
          </div>

          {/* Grid Costo + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Costo *</label>
              <input type="number" step="0.01" placeholder="0.00" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base" />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base">
                <option value="Activo">✅ Activo</option>
                <option value="Cancelado">❌ Cancelado</option>
              </select>
            </div>
          </div>

          {/* Sección Cuenta y Autopago */}
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-indigo-400" /> Cuenta de cobro</label>
              <select value={formData.cuenta_id || ''} onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Seleccionar cuenta</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>)}
              </select>
            </div>

            <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={formData.autopago || false} onChange={(e) => setFormData({ ...formData, autopago: e.target.checked })} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500" />
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Cobrar automáticamente</span>
              </label>
              {formData.autopago && <p className="text-xs text-gray-400 mt-2 ml-6">El cobro se registrará automáticamente en la cuenta seleccionada.</p>}
            </div>
          </div>

          {/* Próximo Pago */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Próximo Pago</label>
            <input type="date" value={formData.proximo_pago} onChange={(e) => setFormData({ ...formData, proximo_pago: e.target.value })} className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base" />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm md:text-base font-semibold">Notas</label>
            <textarea placeholder="Información adicional (opcional)" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows="2" className="w-full bg-gray-700 text-white px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base resize-none" />
          </div>
        </div>

        {/* Botones */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-indigo-500/30 p-4 md:p-6">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 md:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm md:text-base">Cancelar</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors text-sm md:text-base">{suscripcionInicial ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalSuscripcion