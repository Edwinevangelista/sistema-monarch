// src/components/SavedPlansList.jsx
import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Calendar, AlertCircle, CheckCircle, MoreVertical } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavedPlansList({ refreshSignal = 0 }) {
  const { plans, loading, savePlan, deletePlan, refresh } = usePlanesGuardados();

  // ✅ CORREGIDO: useEffect con dependencias completas
  useEffect(() => {
    console.log('🔄 SavedPlansList recibió señal de actualización:', refreshSignal);
    refresh();
  }, [refreshSignal, refresh]);

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10 shadow-sm animate-pulse">
        <div className="text-purple-300 font-semibold">Cargando tus planes...</div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="bg-gray-800/40 rounded-xl p-8 text-center border-2 border-dashed border-gray-700">
        <div className="text-5xl mb-4 opacity-50">📝</div>
        <h3 className="text-xl font-bold text-white mb-2">No tienes planes activos</h3>
        <p className="text-gray-400">Crea un plan de ahorro o deuda para empezar a ver tus objetivos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onDelete={deletePlan} 
        />
      ))}
    </div>
  );
}

// --- COMPONENTE DE TARJETA DEL PLAN ---
function PlanCard({ plan, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  // Colores según tipo
  const getStyles = (tipo) => {
    if (tipo.toLowerCase().includes('ahorro')) {
      return { bg: 'from-emerald-900/40 to-emerald-800/20', border: 'border-emerald-500/30', icon: <Target className="w-6 h-6 text-emerald-400" /> };
    }
    return { bg: 'from-rose-900/40 to-rose-800/20', border: 'border-rose-500/30', icon: <AlertCircle className="w-6 h-6 text-rose-400" /> };
  };

  const { bg, border, icon } = getStyles(plan.tipo || 'general');

  // Calcular fechas o metas (asumiendo estructura simple, ajusta según tu BD real)
  const montoObjetivo = plan.monto_objetivo || 0;
  const montoActual = plan.monto_actual || 0;
  const progreso = montoObjetivo > 0 ? ((montoActual / montoObjetivo) * 100).toFixed(0) : 0;

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-xl border ${border} p-5 shadow-lg relative hover:scale-[1.02] transition-transform duration-200`}>
      
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg shadow-inner">
            {icon}
          </div>
          <div>
            <h4 className="text-white font-bold text-lg leading-tight">{plan.nombre || 'Sin Nombre'}</h4>
            <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
              {plan.tipo || 'General'}
            </span>
          </div>
        </div>

        {/* Menú desplegable */}
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Eliminar este plan?')) {
                    onDelete(plan.id);
                    setShowMenu(false);
                  }
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>Progreso</span>
          <span className="font-bold text-white">{progreso}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progreso)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Actual: ${montoActual.toLocaleString()}</span>
          <span>Meta: ${montoObjetivo.toLocaleString()}</span>
        </div>
      </div>

      {/* Fechas */}
      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700/50 pt-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>Inicio: {plan.fecha_inicio ? plan.fecha_inicio.split('T')[0] : '-'}</span>
        </div>
        {plan.fecha_objetivo && (
          <span>Objetivo: {plan.fecha_objetivo.split('T')[0]}</span>
        )}
      </div>

    </div>
  );
}