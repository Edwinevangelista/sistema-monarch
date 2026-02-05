import React, { useState, useEffect } from 'react';
import { CreditCard, X, Save, Percent, Calendar, Wallet, Loader2 } from 'lucide-react';

export default function ModalAgregarDeuda({ onClose, onSave, deudaInicial = null }) {
  const esEdicion = Boolean(deudaInicial);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    cuenta: '',
    tipo: 'Tarjeta',
    saldo: '',
    apr: '',
    pago_minimo: '',
    pago_real: '',
    vence: '',
    estado: 'Activa'
  });

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (deudaInicial) {
      setFormData({
        id: deudaInicial.id,
        cuenta: deudaInicial.cuenta || '',
        tipo: deudaInicial.tipo || 'Tarjeta',
        saldo: deudaInicial.saldo ?? '',
        apr: deudaInicial.apr ? (deudaInicial.apr * 100).toString() : '',
        pago_minimo: deudaInicial.pago_minimo ?? '',
        pago_real: deudaInicial.pago_real ?? '',
        vence: deudaInicial.vence || '',
        estado: deudaInicial.estado || 'Activa'
      });
    }
  }, [deudaInicial]);

  const handleSubmit = async () => {
    // Validación Básica
    if (!formData.cuenta || formData.saldo === '') {
      alert('Por favor completa el nombre de la tarjeta y el saldo.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cuenta: formData.cuenta,
        tipo: formData.tipo,
        saldo: parseFloat(formData.saldo),
        // Convertir APR input (ej 15.5) a decimal (0.155)
        apr: formData.apr ? parseFloat(formData.apr) / 100 : 0, 
        pago_minimo: parseFloat(formData.pago_minimo) || 0,
        pago_real: parseFloat(formData.pago_real) || 0,
        vence: formData.vence,
        estado: formData.estado
      };

      if (esEdicion) {
        await onSave({ ...payload, id: deudaInicial.id });
      } else {
        await onSave(payload);
      }
      
      onClose();
    } catch (e) {
      console.error("Error al guardar deuda:", e);
      alert('Ocurrió un error al guardar la deuda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-red-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header con Gradiente */}
        <div className="bg-gradient-to-r from-red-900/40 to-pink-900/20 p-6 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <CreditCard className="w-6 h-6 text-red-400" />
              </div>
              {esEdicion ? 'Editar Deuda' : 'Nueva Deuda'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulario Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            
            {/* Nombre */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Nombre de la Tarjeta / Cuenta
              </label>
              <input
                type="text"
                placeholder="Ej: Visa Gold, Banamex..."
                value={formData.cuenta}
                onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                disabled={loading}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all disabled:opacity-50 placeholder-gray-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">Tipo de Financiamiento</label>
              <div className="grid grid-cols-2 gap-3">
                {['Tarjeta', 'Préstamo', 'Hipoteca', 'Auto'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFormData({ ...formData, tipo })}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.tipo === tipo
                        ? 'bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-900/20'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Saldo y APR */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Saldo Actual
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.saldo}
                  onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all disabled:opacity-50 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Tasa de Interés (APR %)
                </label>
                <input
                  type="number"
                  placeholder="15.5"
                  value={formData.apr}
                  onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all disabled:opacity-50 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Pago Mínimo y Vence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Pago Mínimo Mensual
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.pago_minimo}
                  onChange={(e) => setFormData({ ...formData, pago_minimo: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Fecha de Corte/Vence
                </label>
                <input
                  type="date"
                  value={formData.vence}
                  onChange={(e) => setFormData({ ...formData, vence: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all disabled:opacity-500 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-semibold">Estado</label>
              <div className="flex gap-3">
                {['Activa', 'Pagada', 'Cerrada'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFormData({ ...formData, estado })}
                    className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      formData.estado === estado
                        ? 'bg-white/10 border-white/40 text-white shadow-lg'
                        : 'bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-gray-900/50 backdrop-blur-md shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Agregar Deuda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}