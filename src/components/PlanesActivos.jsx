import React, { useState } from 'react';
import { Target, TrendingDown, DollarSign, Scissors, CheckCircle2, Trash2, Edit2, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

const ICONOS_POR_TIPO = {
  ahorro: { icon: DollarSign, gradient: 'from-emerald-600 to-teal-600', emoji: '💰' },
  deudas: { icon: TrendingDown, gradient: 'from-rose-600 to-pink-600', emoji: '💳' },
  gastos: { icon: Scissors, gradient: 'from-orange-600 to-yellow-600', emoji: '✂️' },
  suscripciones: { icon: Scissors, gradient: 'from-purple-600 to-indigo-600', emoji: '📅' },
};

export default function PlanesActivos({ onEditarPlan, onEliminarPlan }) {
  const { planesActivos, loading, marcarComoCompletado, deletePlan } = usePlanesGuardados();
  const [expandido, setExpandido] = useState(null);

  const handleMarcarCompletado = async (planId) => {
    if (window.confirm('¿Marcar este plan como completado?')) {
      try {
        await marcarComoCompletado(planId);
        alert('✅ ¡Felicitaciones! Plan completado');
      } catch (error) {
        console.error('Error marcando plan como completado:', error);
        alert('Error al completar el plan');
      }
    }
  };

  const handleEliminar = async (planId) => {
    if (window.confirm('¿Estás seguro de eliminar este plan? Esta acción no se puede deshacer.')) {
      try {
        await deletePlan(planId);
        alert('Plan eliminado');
      } catch (error) {
        console.error('Error eliminando plan:', error);
        alert('Error al eliminar el plan');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-3xl p-8 border border-gray-700">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (!planesActivos || planesActivos.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-blue-400">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Mis Planes Activos</h2>
        </div>
        <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-gray-700">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-400 text-lg">No tienes planes activos</p>
          <p className="text-gray-500 text-sm mt-2">Crea un plan de ahorro, deudas o gastos para empezar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 lg:p-8 border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-900/20">
            <Target className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Planes Activos</h2>
            <p className="text-gray-400 text-sm">Sigue tu progreso hacia tus metas</p>
          </div>
        </div>
        <span className="bg-blue-500/20 text-blue-300 text-xs md:text-sm px-3 py-1.5 rounded-full border border-blue-500/30 font-bold shadow-sm">
          {planesActivos.length} {planesActivos.length === 1 ? 'Plan' : 'Planes'}
        </span>
      </div>

      {/* Lista de Planes */}
      <div className="space-y-4 md:space-y-6">
        {planesActivos.map((plan) => {
          const { icon: Icon, gradient, emoji } = ICONOS_POR_TIPO[plan.tipo] || ICONOS_POR_TIPO.ahorro;
          const estaExpandido = expandido === plan.id;
          const progreso = plan.progreso || 0;
          const estaCompletado = progreso >= 100;

          return (
            <div
              key={plan.id}
              className={`bg-gray-800/50 backdrop-blur-sm border-2 rounded-3xl overflow-hidden transition-all duration-300 ${
                estaCompletado 
                  ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/80'
              }`}
            >
              {/* Cabecera Expandible */}
              <button
                onClick={() => setExpandido(estaExpandido ? null : plan.id)}
                className="w-full p-4 md:p-6 text-left flex items-start justify-between group focus:outline-none"
              >
                <div className="flex items-start gap-4 md:gap-6 flex-1">
                  {/* Icono e Info Principal */}
                  <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg relative`}>
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white relative z-10" />
                    {estaCompletado && (
                      <div className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-gray-900 z-20">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-lg md:text-2xl font-bold mb-1">{plan.nombre}</h3>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="bg-gray-700/50 text-gray-300 text-xs md:text-sm px-2 py-1 rounded-full border border-gray-600">
                        {plan.tipo}
                      </span>
                      <span className={`text-sm md:text-base font-semibold ${estaCompletado ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {progreso}% Completado
                      </span>
                      {plan.meses_duracion && (
                        <span className="text-gray-500 text-xs md:text-sm">
                          • {plan.meses_duracion} meses
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón Expandir / Contrair + Acción Rápida */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <span className="text-4xl md:hidden ml-2">{emoji}</span>
                  <div className={`p-2 md:p-3 rounded-xl transition-transform duration-300 ${
                    estaExpandido ? 'rotate-180 bg-white/10' : 'rotate-0 bg-white/5'
                  }`}>
                    <ChevronDown className="w-5 h-5 text-white" />
                  </div>
                  
                  {!estaCompletado && !estaExpandido && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditarPlan) onEditarPlan(plan);
                      }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors"
                      title="Editar Progreso"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </button>

              {/* Barra de Progreso Visible (Collapsable) */}
              {!estaExpandido && (
                <div className="px-4 md:px-6 pb-4">
                  <div className="w-full bg-gray-700/50 rounded-full h-3 md:h-4 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min(progreso, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-500">
                     <span>Inicio: {new Date(plan.fecha_inicio).toLocaleDateString()}</span>
                     {plan.fecha_objetivo && <span>Meta: {new Date(plan.fecha_objetivo).toLocaleDateString()}</span>}
                  </div>
                </div>
              )}

              {/* Contenido Expandido */}
              {estaExpandido && (
                <div className="px-4 md:px-6 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    
                    {/* Grid de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {plan.monto_objetivo && (
                        <div className="bg-gray-900/50 p-3 md:p-4 rounded-2xl border border-white/5">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Meta Objetivo</p>
                          <p className="text-white font-bold text-lg md:text-2xl">
                            ${Number(plan.monto_objetivo).toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {plan.monto_actual !== undefined && (
                        <div className="bg-gray-900/50 p-3 md:p-4 rounded-2xl border border-white/5">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Actual Ahorrado</p>
                          <p className={`text-lg md:text-2xl font-bold ${Number(plan.monto_actual) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${Number(plan.monto_actual).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {plan.fecha_objetivo && (
                        <div className="bg-gray-900/50 p-3 md:p-4 rounded-2xl border border-white/5">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Fecha Meta</p>
                          <p className="text-white font-medium text-sm md:text-base">
                            {new Date(plan.fecha_objetivo).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Configuración Detallada */}
                    {plan.configuracion && (
                      <div className="bg-gray-800/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                           <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                           <h4 className="text-white font-semibold text-sm">Detalles de Configuración</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {Object.entries(plan.configuracion).map(([key, value]) => {
                            if (typeof value === 'object') return null;
                            return (
                              <div key={key} className="bg-gray-900/50 p-2 md:p-3 rounded-lg border border-white/5">
                                <p className="text-gray-400 text-[10px] uppercase">{key.replace(/_/g, ' ')}</p>
                                <p className="text-white font-medium text-xs md:text-sm truncate">{value}</p>
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-white/10">
                    {/* Marcar Completado */}
                    {!estaCompletado && (
                      <button
                        onClick={() => handleMarcarCompletado(plan.id)}
                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 hover:text-emerald-100 py-3 md:py-4 rounded-2xl font-semibold border border-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Marcar como Completado
                      </button>
                    )}

                    {estaCompletado && (
                       <div className="flex-1 bg-emerald-500/10 text-emerald-400 py-3 md:py-4 rounded-2xl font-semibold border border-emerald-500/30 text-center items-center justify-center">
                         <CheckCircle2 className="w-5 h-5 mr-2" /> ¡Objetivo Alcanzado!
                       </div>
                    )}

                    {/* Editar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditarPlan) onEditarPlan(plan);
                      }}
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 hover:text-blue-100 py-3 md:py-4 rounded-2xl font-semibold border border-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-5 h-5" />
                      Actualizar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleEliminar(plan.id)}
                      className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 hover:text-rose-100 py-3 md:py-4 rounded-2xl font-semibold border border-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}