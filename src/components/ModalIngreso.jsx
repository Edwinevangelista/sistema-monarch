// src/components/ModalIngreso.jsx
// 💰 VERSIÓN FINAL - Fusión de ambas versiones
// Mantiene: Loading states, error handling, UX de tu versión
// Agrega: Campo de frecuencia para proyecciones automáticas

import React, { useState, useEffect } from 'react';
import { DollarSign, X, Building2, Calendar, FileText, Loader2, CheckCircle, AlertCircle, Repeat, Info } from 'lucide-react';
import { useCuentasBancarias } from '../hooks/useCuentasBancarias';

const FRECUENCIAS = [
  { value: 'Único', label: 'Único', icon: '📅', descripcion: 'Ingreso que ocurre una sola vez' },
  { value: 'Semanal', label: 'Semanal', icon: '📆', descripcion: 'Se repite cada semana' },
  { value: 'Quincenal', label: 'Quincenal', icon: '🗓️', descripcion: 'Se repite cada 15 días' },
  { value: 'Mensual', label: 'Mensual', icon: '📊', descripcion: 'Se repite cada mes' }
];

export default function ModalIngreso({ onClose, onSave, ingresoInicial = null }) {
  const { cuentas } = useCuentasBancarias();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarInfoFrecuencia, setMostrarInfoFrecuencia] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    fuente: '',
    descripcion: '',
    monto: '',
    cuenta_id: '',
    frecuencia: 'Único' // NUEVO CAMPO
  });

  useEffect(() => {
    if (ingresoInicial) {
      setFormData({
        fecha: ingresoInicial.fecha || new Date().toISOString().split('T')[0],
        fuente: ingresoInicial.fuente || '',
        descripcion: ingresoInicial.descripcion || '',
        monto: ingresoInicial.monto?.toString() || '',
        cuenta_id: ingresoInicial.cuenta_id || '',
        frecuencia: ingresoInicial.frecuencia || 'Único' // NUEVO
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
        cuenta_id: formData.cuenta_id || null,
        frecuencia: formData.frecuencia // NUEVO
      };

      if (ingresoInicial?.id) {
        dataToSave.id = ingresoInicial.id;
      }

      await onSave(dataToSave);
      
      // Mensaje personalizado según frecuencia
      if (formData.frecuencia !== 'Único') {
        alert(`✅ Ingreso guardado como ${formData.frecuencia}.\n📊 Se proyectará automáticamente en el balance.`);
      } else {
        alert(`✅ Ingreso guardado correctamente`);
      }
      
      onClose();
    } catch (error) {
      console.error("Error guardando ingreso:", error);
      setError('Error al guardar el ingreso. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular proyección para mostrar preview
  const calcularProyeccionMensual = () => {
    const monto = parseFloat(formData.monto);
    if (!monto || formData.frecuencia === 'Único') return null;
    
    if (formData.frecuencia === 'Semanal') return monto * 4;
    if (formData.frecuencia === 'Quincenal') return monto * 2;
    if (formData.frecuencia === 'Mensual') return monto;
    return null;
  };

  const proyeccionMensual = calcularProyeccionMensual();

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
              placeholder="Ej: Salario, Freelance, Nómina..." 
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

          {/* FRECUENCIA (NUEVO) */}
          <div className="bg-indigo-500/5 p-3 md:p-4 rounded-2xl border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-300 flex items-center gap-2 text-sm md:text-base font-semibold">
                <Repeat className="w-4 h-4 text-indigo-400" /> Frecuencia
              </label>
              <button
                type="button"
                onClick={() => setMostrarInfoFrecuencia(!mostrarInfoFrecuencia)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                disabled={isLoading}
              >
                <Info className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Tooltip informativo */}
            {mostrarInfoFrecuencia && (
              <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <p className="text-xs text-indigo-200 leading-relaxed">
                  💡 <strong>¿Para qué sirve esto?</strong><br/>
                  Si marcas este ingreso como "Semanal" o "Mensual", FinGuide lo proyectará automáticamente en tu balance para darte una vista más realista del mes completo.
                </p>
              </div>
            )}

            {/* Grid de opciones */}
            <div className="grid grid-cols-2 gap-2">
              {FRECUENCIAS.map((frec) => (
                <button
                  key={frec.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, frecuencia: frec.value })}
                  disabled={isLoading}
                  className={`p-2.5 md:p-3 rounded-xl border transition-all text-left disabled:opacity-50 ${
                    formData.frecuencia === frec.value
                      ? 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base md:text-lg">{frec.icon}</span>
                    <span className={`text-xs md:text-sm font-semibold ${
                      formData.frecuencia === frec.value ? 'text-indigo-200' : 'text-white'
                    }`}>
                      {frec.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {frec.descripcion}
                  </p>
                </button>
              ))}
            </div>

            {/* PREVIEW DE PROYECCIÓN */}
            {proyeccionMensual && (
              <div className="mt-3 p-2.5 md:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span className="font-bold">📊 Proyección mensual:</span>
                  <span className="font-mono font-bold text-sm">
                    ~${proyeccionMensual.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
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
              <FileText className="w-4 h-4 text-gray-400" /> Descripción (Opcional)
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