import React, { useState, useEffect } from 'react';
import { FileText, X, CreditCard, Calendar, CheckCircle, Loader2, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { CATEGORIAS } from '../constants/categorias';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

export default function ModalGastoFijo({ onClose, onSave, gastoInicial = null }) {
  const { cuentas } = useCuentasBancarias();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: CATEGORIAS[0],
    dia_venc: '',
    monto: '',
    cuenta_id: '',
    auto_pago: 'No',
    estado: 'Pendiente',
    notas: ''
  });

  useEffect(() => {
    if (gastoInicial) {
      setFormData({
        nombre: gastoInicial.nombre || '',
        categoria: gastoInicial.categoria || CATEGORIAS[0],
        dia_venc: gastoInicial.dia_venc?.toString() || '',
        monto: gastoInicial.monto?.toString() || '',
        cuenta_id: gastoInicial.cuenta_id || '',
        auto_pago: gastoInicial.auto_pago ? 'Sí' : 'No',
        estado: gastoInicial.estado || 'Pendiente',
        notas: gastoInicial.notas || ''
      });
    }
  }, [gastoInicial]);

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.monto) {
      setError('Por favor completa el nombre y el monto');
      return;
    }
    if (formData.dia_venc && (formData.dia_venc < 1 || formData.dia_venc > 31)) {
      setError('El día debe estar entre 1 y 31');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        monto: parseFloat(formData.monto),
        dia_venc: formData.dia_venc ? parseInt(formData.dia_venc) : null,
        cuenta_id: formData.cuenta_id || null,
        auto_pago: formData.auto_pago === 'Sí'
      };

      if (gastoInicial?.id) {
        dataToSave.id = gastoInicial.id;
      }

      await onSave(dataToSave);
      
      alert(`✅ ${gastoInicial ? 'Gasto fijo actualizado' : 'Gasto fijo creado'} correctamente`);
      onClose();
    } catch (error) {
      console.error("Error al guardar gasto fijo:", error);
      setError(error?.message || 'Error al guardar el gasto fijo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-lg md:max-h-[85vh] overflow-y-auto rounded-3xl md:rounded-2xl shadow-2xl border border-yellow-500/20 relative flex flex-col">
        
        {/* Header con Gradiente */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800/80 p-4 md:p-6 rounded-t-3xl md:rounded-t-2xl border-b border-yellow-500/30 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-white/20 p-2 rounded-xl border border-white/30">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {gastoInicial ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
                </h2>
                {gastoInicial && (
                  <p className="text-yellow-100 text-xs md:text-sm mt-0.5">
                    Editando: {gastoInicial.nombre}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-yellow-100 hover:text-white transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-3 md:px-4 py-2 md:py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          
          {/* Nombre */}
          <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
              <FileText className="w-4 h-4 text-yellow-400" /> Nombre del Servicio *
            </label>
            <input
              type="text"
              placeholder="Ej: Renta, Internet"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 placeholder-gray-500 text-sm md:text-base"
              style={{ fontSize: '16px' }} // Fix iOS
            />
          </div>

          {/* Categoría y Día */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                <Tag className="w-4 h-4 text-purple-400" /> Categoría
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                disabled={loading}
                className="w-full bg-gray-800 text-white px-2 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm md:text-base"
                style={{ fontSize: '16px' }}
              >
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                <Calendar className="w-4 h-4 text-blue-400" /> Día
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={formData.dia_venc}
                onChange={(e) => setFormData({ ...formData, dia_venc: e.target.value })}
                disabled={loading}
                className="w-full bg-gray-800 text-white px-2 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Monto y Auto-pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Monto *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                disabled={loading}
                className="w-full bg-gray-800 text-white px-2 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm md:text-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
              <label className="block text-gray-300 mb-2 text-sm md:text-base">Auto-pago</label>
              <select
                value={formData.auto_pago}
                onChange={(e) => setFormData({ ...formData, auto_pago: e.target.value })}
                disabled={loading}
                className="w-full bg-gray-800 text-white px-2 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm md:text-base"
                style={{ fontSize: '16px' }}
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </div>

          {/* Cuenta Bancaria */}
          <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
              <CreditCard className="w-4 h-4 text-blue-400" /> Cuenta de cobro
            </label>
            <select
              value={formData.cuenta_id}
              onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })}
              disabled={loading}
              className="w-full bg-gray-800 text-white px-2 py-2 md:px-3 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm md:text-base"
              style={{ fontSize: '16px' }}
            >
              <option value="">Sin asignar</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - {c.tipo_cuenta} (${Number(c.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">💡</span>
              <span>Si seleccionas una cuenta, el saldo se descontará automáticamente</span>
            </p>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-gray-300 mb-3 text-sm md:text-base font-medium">Estado</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, estado: 'Pendiente' })} 
                disabled={loading} 
                className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                  formData.estado === 'Pendiente' 
                    ? 'bg-yellow-600 border-yellow-600 text-white shadow-lg' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
                }`}
              >
                ⏳ Pendiente
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, estado: 'Pagado' })} 
                disabled={loading} 
                className={`p-2.5 md:p-3 rounded-xl border-2 transition-all text-sm md:text-base font-semibold ${
                  formData.estado === 'Pagado' 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 disabled:opacity-50'
                }`}
              >
                ✅ Pagado
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base">
              <FileText className="w-4 h-4 text-gray-400" /> Notas
            </label>
            <textarea
              placeholder="Detalles adicionales..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              disabled={loading}
              className="w-full bg-gray-800 text-white px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 resize-none text-sm md:text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Footer con Botones */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-gray-800/50 backdrop-blur-sm z-20">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 md:px-4 py-3 md:py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 md:px-4 py-3 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20 disabled:opacity-50 text-sm md:text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />}
              {loading ? "Guardando..." : (gastoInicial ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}