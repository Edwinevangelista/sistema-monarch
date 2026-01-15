import React, { useState, useEffect } from 'react';
import { DollarSign, X, Building2, Calendar, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

export default function ModalIngreso({ onClose, onSave, ingresoInicial = null }) {
  const { cuentas } = useCuentasBancarias();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    fuente: '',
    descripcion: '',
    monto: '',
    cuenta_id: ''
  });

  useEffect(() => {
    if (ingresoInicial) {
      setFormData({
        fecha: ingresoInicial.fecha || new Date().toISOString().split('T')[0],
        fuente: ingresoInicial.fuente || '',
        descripcion: ingresoInicial.descripcion || '',
        monto: ingresoInicial.monto?.toString() || '',
        cuenta_id: ingresoInicial.cuenta_id || ''
      });
    }
  }, [ingresoInicial]);

  const handleSubmit = async () => {
    if (!formData.fuente || !formData.monto) {
      setError('Por favor completa los campos requeridos (Fuente y Monto)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const dataToSave = {
        fecha: formData.fecha,
        fuente: formData.fuente,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        cuenta_id: formData.cuenta_id || null
      };

      if (ingresoInicial?.id) {
        dataToSave.id = ingresoInicial.id;
      }

      await onSave(dataToSave);
      alert(`✅ Ingreso guardado correctamente`);
      onClose();
    } catch (error) {
      console.error("Error guardando ingreso:", error);
      setError('Error al guardar el ingreso. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-emerald-500/20 shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600/80 p-4 md:p-6 rounded-t-3xl border-b border-emerald-500/30 sticky top-0 z-10 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/30">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {ingresoInicial ? 'Editar Ingreso' : 'Nuevo Ingreso'}
                </h2>
                {ingresoInicial && (
                  <p className="text-emerald-200 text-xs">Editando: {ingresoInicial.fuente}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MENSAJE ERROR */}
        {error && (
          <div className="mx-4 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* FECHA */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <Calendar className="w-4 h-4 text-emerald-400" /> Fecha
            </label>
            <input 
              type="date" 
              value={formData.fecha} 
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
              disabled={isLoading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* FUENTE */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Fuente del Ingreso *
            </label>
            <input 
              type="text" 
              placeholder="Ej: Salario, Freelance" 
              value={formData.fuente} 
              onChange={(e) => setFormData({ ...formData, fuente: e.target.value })} 
              disabled={isLoading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* MONTO */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-semibold">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base md:text-lg font-bold">$</span>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.monto} 
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })} 
                disabled={isLoading}
                className="w-full bg-gray-800 text-white pl-7 md:pl-8 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 text-sm md:text-base font-bold border border-gray-700"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* CUENTA BANCARIA */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <Building2 className="w-4 h-4 text-blue-400" /> Cuenta Bancaria
            </label>
            <select 
              value={formData.cuenta_id} 
              onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} 
              disabled={isLoading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            >
              <option value="">Sin asignar</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>
              ))}
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <FileText className="w-4 h-4 text-gray-400" /> Descripción
            </label>
            <textarea
              placeholder="Detalles adicionales..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
              disabled={isLoading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 resize-none text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* FOOTER BOTONES */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-white/5 z-20 shrink-0">
          <div className="flex gap-3 md:gap-4">
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isLoading ? 'Guardando...' : (ingresoInicial ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}