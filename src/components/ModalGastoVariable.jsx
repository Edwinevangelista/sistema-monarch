import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, CreditCard, Loader2, CheckCircle, Calendar, Tag, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { CATEGORIAS, METODOS_PAGO } from '../constants/categorias';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

export default function ModalGastoVariable({ onClose, onSave, gastoInicial = null }) {
  const { cuentas } = useCuentasBancarias();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: CATEGORIAS[0],
    descripcion: '',
    monto: '',
    metodo: METODOS_PAGO[0],
    cuenta_id: ''
  });

  useEffect(() => {
    if (gastoInicial) {
      setFormData({
        fecha: gastoInicial.fecha || new Date().toISOString().split('T')[0],
        categoria: gastoInicial.categoria || CATEGORIAS[0],
        descripcion: gastoInicial.descripcion || '',
        monto: gastoInicial.monto?.toString() || '',
        metodo: gastoInicial.metodo || METODOS_PAGO[0],
        cuenta_id: gastoInicial.cuenta_id || ''
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        categoria: CATEGORIAS[0],
        descripcion: '',
        monto: '',
        metodo: METODOS_PAGO[0],
        cuenta_id: ''
      });
    }
  }, [gastoInicial]);

  const handleSubmit = async () => {
    if (!formData.categoria || !formData.monto) {
      setError('Por favor completa categoría y monto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        fecha: formData.fecha,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        metodo: formData.metodo,
        cuenta_id: formData.cuenta_id || null
      };

      if (gastoInicial?.id) {
        payload.id = gastoInicial.id;
      }

      await onSave(payload);
      alert('✅ Gasto variable registrado correctamente');
      onClose();
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      setError(err?.message || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-red-500/20 shadow-2xl relative flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600/80 p-4 md:p-6 rounded-t-3xl border-b border-red-500/30 sticky top-0 z-10 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-xl border border-red-400/30">
                <ShoppingCart className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {gastoInicial ? 'Editar Gasto Variable' : 'Nuevo Gasto'}
                </h2>
                {gastoInicial && (
                  <p className="text-red-200 text-xs">Editando: {gastoInicial.descripcion}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="p-2 bg-black/30 hover:bg-black/50 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MENSAJE ERROR */}
        {error && (
          <div className="mx-4 mt-4 bg-red-500/10 border border-red-500 text-red-200 px-4 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* FECHA */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <Calendar className="w-4 h-4 text-red-400" /> Fecha
            </label>
            <input 
              type="date" 
              value={formData.fecha} 
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
              disabled={loading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }} // ✅ Fix iOS
            />
          </div>

          {/* CATEGORÍA */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <Tag className="w-4 h-4 text-purple-400" /> Categoría *
            </label>
            <select 
              value={formData.categoria} 
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} 
              disabled={loading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            >
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
              <FileText className="w-4 h-4 text-gray-400" /> Descripción
            </label>
            <input 
              type="text" 
              placeholder="Ej: Supermercado" 
              value={formData.descripcion} 
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
              disabled={loading}
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* MONTO */}
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
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
              className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700 font-bold text-lg"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          {/* CUENTA Y MÉTODO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
              <label className="block text-gray-300 mb-2 flex items-center gap-2 text-sm md:text-base font-medium">
                <CreditCard className="w-4 h-4 text-blue-400" /> Cuenta de Pago
              </label>
              <select 
                value={formData.cuenta_id || ''} 
                onChange={(e) => setFormData({ ...formData, cuenta_id: e.target.value })} 
                disabled={loading}
                className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                style={{ fontSize: '16px' }}
              >
                <option value="">Seleccionar cuenta</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (${Number(c.balance).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
              <label className="block text-gray-300 mb-2 text-sm md:text-base font-medium">
                Método
              </label>
              <select 
                value={formData.metodo} 
                onChange={(e) => setFormData({ ...formData, metodo: e.target.value })} 
                disabled={loading}
                className="w-full bg-gray-800 text-white px-3 md:px-4 py-2.5 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 text-sm md:text-base border border-gray-700"
                style={{ fontSize: '16px' }}
              >
                {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER BOTONES */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-white/5 z-20 shrink-0">
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 text-sm md:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {loading ? 'Guardando...' : (gastoInicial ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}