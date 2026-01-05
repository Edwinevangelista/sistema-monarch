import React, { useState, useEffect } from 'react';
import { Target, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavedPlansList({ refreshSignal = 0 }) {
  // ✅ CORRECCIÓN: Cambiar 'plans' por 'planes'
  const { planes, loading, deletePlan, refresh } = usePlanesGuardados();

  useEffect(() => {
    console.log('🔄 SavedPlansList recibió señal de actualización:', refreshSignal);
    if (refreshSignal > 0) {
      refresh();
    }
  }, [refreshSignal, refresh]);

  useEffect(() => {
    console.log('📊 SavedPlansList montado, cargando planes...');
    refresh();
  }, [refresh]); // ✅ CORRECCIÓN: Quitar refreshSignal de aquí para evitar loop

  // ✅ CORRECCIÓN: Agregar log para debug
  useEffect(() => {
    console.log('📋 Planes cargados:', planes);
  }, [planes]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-purple-500 text-center">
        <div className="text-purple-300 font-semibold">Cargando planes...</div>
      </div>
    );
  }

  // ✅ CORRECCIÓN: Cambiar 'plans' por 'planes'
  if (!planes || planes.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
        <div className="text-5xl mb-3">📝</div>
        <h3 className="text-xl font-bold text-white mb-2">No tienes planes activos</h3>
        <p className="text-gray-400">Usa los planificadores del asistente para crear planes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {planes.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onDelete={async (id) => {
            await deletePlan(id);
            await refresh();
          }} 
        />
      ))}
    </div>
  );
}

// --- COMPONENTE INTERNO ---
function PlanCard({ plan, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getInfo = (tipo) => {
    if (!tipo) return { bg: 'bg-blue-900/40', border: 'border-blue-500/30', icon: <CheckCircle className="w-6 h-6 text-blue-400" /> };
    if (tipo.toLowerCase().includes('ahorro')) return { bg: 'from-green-900/40 to-green-800/20', border: 'border-green-500/30', icon: <Target className="w-6 h-6 text-green-400" /> };
    if (tipo.toLowerCase().includes('deuda')) return { bg: 'from-red-900/40 to-red-800/20', border: 'border-red-500/30', icon: <AlertCircle className="w-6 h-6 text-red-400" /> };
    return { bg: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-500/30', icon: <CheckCircle className="w-6 h-6 text-purple-400" /> };
  };

  const { bg, border, icon } = getInfo(plan.tipo);
  
  const meta = Number(plan.monto_objetivo) || 0;
  const actual = Number(plan.monto_actual) || 0;
  const progreso = meta > 0 ? ((actual / meta) * 100).toFixed(0) : 0;

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-xl border ${border} p-4 shadow-lg relative`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <h4 className="text-white font-bold truncate">{plan.nombre || 'Sin Nombre'}</h4>
            <span className="text-xs text-gray-300 uppercase font-bold tracking-wider">
              {plan.tipo || 'General'}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <div className="text-2xl">⋮</div>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 w-40 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Estás seguro de eliminar este plan?')) {
                    onDelete(plan.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 border-b border-gray-600"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1 text-gray-300">
          <span>Progreso</span>
          <span className="font-bold text-white">{progreso}%</span>
        </div>
        <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all ${
              Number(progreso) >= 100 ? 'bg-green-500' : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min(100, progreso)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400 border-t border-gray-700/50 pt-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {plan.fecha_inicio ? plan.fecha_inicio.split('T')[0] : '-'}
        </span>
        <span>${actual.toLocaleString()} / ${meta.toLocaleString()}</span>
      </div>
    </div>
  );
}