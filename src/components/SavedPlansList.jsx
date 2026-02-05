import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Trash2, Eye, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavedPlansList({ refreshSignal = 0 }) {
  const { planes, deletePlan, updatePlan, refresh } = usePlanesGuardados();
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    refresh();
  }, [refreshSignal, refresh]);

  if (!planes || planes.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-gray-500 mb-3">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tienes planes guardados todavía</p>
        </div>
        <p className="text-xs text-gray-600">
          Crea tu primer plan de ahorro o deudas usando los botones superiores
        </p>
      </div>
    );
  }

  const handleToggleExpand = (e, planId) => {
    // CRÍTICO: Detener propagación del evento
    e.stopPropagation();
    setExpandedPlan(prev => prev === planId ? null : planId);
  };

  const handleDelete = async (e, planId) => {
    // CRÍTICO: Detener propagación del evento
    e.stopPropagation();
    
    if (window.confirm('¿Estás seguro de eliminar este plan?')) {
      try {
        await deletePlan(planId);
        alert('✅ Plan eliminado correctamente');
      } catch (error) {
        console.error('Error eliminando plan:', error);
        alert('Error al eliminar el plan');
      }
    }
  };

  const handleToggleActive = async (e, plan) => {
    // CRÍTICO: Detener propagación del evento
    e.stopPropagation();
    
    try {
      await updatePlan(plan.id, { activo: !plan.activo });
    } catch (error) {
      console.error('Error actualizando plan:', error);
    }
  };

  return (
    <div className="space-y-3">
      {planes.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isExpanded={expandedPlan === plan.id}
          onToggleExpand={handleToggleExpand}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      ))}
    </div>
  );
}

function PlanCard({ plan, isExpanded, onToggleExpand, onDelete, onToggleActive }) {
  const getTipoInfo = () => {
    switch(plan.tipo) {
      case 'ahorro':
        return { 
          emoji: '💰', 
          color: 'from-green-600/20 to-emerald-600/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          bgButton: 'bg-green-500/10 hover:bg-green-500/20'
        };
      case 'deudas':
        return { 
          emoji: '💳', 
          color: 'from-red-600/20 to-pink-600/20',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          bgButton: 'bg-red-500/10 hover:bg-red-500/20'
        };
      case 'gastos':
        return { 
          emoji: '💸', 
          color: 'from-orange-600/20 to-yellow-600/20',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400',
          bgButton: 'bg-orange-500/10 hover:bg-orange-500/20'
        };
      default:
        return { 
          emoji: '📋', 
          color: 'from-blue-600/20 to-purple-600/20',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
          bgButton: 'bg-blue-500/10 hover:bg-blue-500/20'
        };
    }
  };

  const { emoji, color, borderColor, textColor, bgButton } = getTipoInfo();
  
  const progreso = plan.monto_objetivo > 0 
    ? Math.min(100, (plan.monto_actual / plan.monto_objetivo) * 100)
    : 0;

  return (
    <div 
      className={`bg-gradient-to-br ${color} backdrop-blur-sm border ${borderColor} rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-black/20`}
      // CRÍTICO: NO agregar onClick aquí que abra modales
    >
      {/* Header del Plan */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-3xl shrink-0">{emoji}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-base md:text-lg truncate">
              {plan.nombre}
            </h4>
            {plan.descripcion && (
              <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">
                {plan.descripcion}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                plan.activo ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {plan.activo ? '✓ Activo' : '⏸ Pausado'}
              </span>
              {plan.completado && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                  🎉 Completado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón Ver Detalles */}
          <button
            onClick={(e) => onToggleExpand(e, plan.id)}
            className={`p-2 ${bgButton} rounded-lg transition-colors border ${borderColor}`}
            title="Ver detalles"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
          
          {/* Botón Pausar/Activar */}
          <button
            onClick={(e) => onToggleActive(e, plan)}
            className={`p-2 ${bgButton} rounded-lg transition-colors border ${borderColor}`}
            title={plan.activo ? 'Pausar plan' : 'Activar plan'}
          >
            {plan.activo ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          {/* Botón Eliminar */}
          <button
            onClick={(e) => onDelete(e, plan.id)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30"
            title="Eliminar plan"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Barra de Progreso */}
      {plan.monto_objetivo > 0 && (
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progreso</span>
            <span className={textColor}>
              ${plan.monto_actual?.toLocaleString() || 0} / ${plan.monto_objetivo?.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                progreso >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                progreso >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                'bg-gradient-to-r from-orange-500 to-yellow-400'
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <div className="text-right text-[10px] text-gray-500 mt-1">
            {progreso.toFixed(1)}% completado
          </div>
        </div>
      )}

      {/* Panel Expandido - CORRECCIÓN: Detener propagación también aquí */}
      {isExpanded && (
        <div 
          className="border-t border-white/10 bg-black/20 p-4 space-y-3 animate-in fade-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Detalles del Plan */}
          <div className="grid grid-cols-2 gap-3">
            {plan.fecha_inicio && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Calendar className="w-3 h-3" />
                  Inicio
                </div>
                <div className="text-white font-bold text-sm">
                  {new Date(plan.fecha_inicio).toLocaleDateString('es-MX', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
            
            {plan.fecha_objetivo && (
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Target className="w-3 h-3" />
                  Meta
                </div>
                <div className="text-white font-bold text-sm">
                  {new Date(plan.fecha_objetivo).toLocaleDateString('es-MX', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Información de Configuración */}
          {plan.configuracion && (
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <Zap className="w-3 h-3" />
                Detalles del Plan
              </div>
              <div className="space-y-2 text-sm">
                {plan.configuracion.ahorroMensual && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ahorro mensual:</span>
                    <span className={`font-bold ${textColor}`}>
                      ${plan.configuracion.ahorroMensual.toLocaleString()}
                    </span>
                  </div>
                )}
                {plan.configuracion.plazoMeses && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plazo:</span>
                    <span className="text-white font-bold">
                      {plan.configuracion.plazoMeses} meses
                    </span>
                  </div>
                )}
                {plan.configuracion.strategy?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estrategia:</span>
                    <span className="text-white font-bold">
                      {plan.configuracion.strategy.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}