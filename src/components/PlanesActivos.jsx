// src/components/PlanesActivos.jsx
// Componente para visualizar y gestionar planes financieros guardados

import React, { useState } from 'react';
import { Target, TrendingDown, DollarSign, Scissors, CheckCircle2, Trash2, Edit2, Calendar, AlertCircle } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

const iconosPorTipo = {
  ahorro: { icon: DollarSign, color: 'from-green-600 to-emerald-600', emoji: '💰' },
  deudas: { icon: TrendingDown, color: 'from-red-600 to-pink-600', emoji: '💳' },
  gastos: { icon: Scissors, color: 'from-orange-600 to-yellow-600', emoji: '💸' },
  suscripciones: { icon: Scissors, color: 'from-purple-600 to-indigo-600', emoji: '✂️' }
};

export default function PlanesActivos({ onEditarPlan, onEliminarPlan }) {
  const { planesActivos, loading, marcarComoCompletado, deletePlan } = usePlanesGuardados();
  const [expandido, setExpandido] = useState(null);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
        <div className="animate-pulse text-center py-8">
          <div className="text-gray-400">Cargando planes...</div>
        </div>
      </div>
    );
  }

  if (!planesActivos || planesActivos.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          📋 Mis Planes Activos
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4 opacity-50">📝</div>
          <p className="text-gray-400">No tienes planes activos</p>
          <p className="text-gray-500 text-sm mt-2">Crea un plan de ahorro, deudas o gastos para comenzar</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          📋 Mis Planes Activos
        </h2>
        <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
          {planesActivos.length} {planesActivos.length === 1 ? 'Plan' : 'Planes'}
        </span>
      </div>

      <div className="space-y-3">
        {planesActivos.map((plan) => {
          const { icon: Icon, color, emoji } = iconosPorTipo[plan.tipo] || iconosPorTipo.ahorro;
          const estaExpandido = expandido === plan.id;
          const progreso = plan.progreso || 0;

          return (
            <div
              key={plan.id}
              className={`bg-gray-900 rounded-xl border-2 transition-all ${
                estaExpandido ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Header del plan */}
              <button
                onClick={() => setExpandido(estaExpandido ? null : plan.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{plan.nombre}</h3>
                      <p className="text-gray-400 text-sm">{plan.descripcion}</p>
                    </div>
                  </div>
                  <span className="text-2xl ml-2">{emoji}</span>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-white font-semibold">{progreso}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {plan.monto_objetivo && (
                    <div className="bg-gray-800 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Meta</p>
                      <p className="text-white font-bold text-sm">
                        ${Number(plan.monto_objetivo).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {plan.monto_actual !== undefined && (
                    <div className="bg-gray-800 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Actual</p>
                      <p className="text-green-400 font-bold text-sm">
                        ${Number(plan.monto_actual).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {plan.meses_duracion && (
                    <div className="bg-gray-800 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Duración</p>
                      <p className="text-blue-400 font-bold text-sm">
                        {plan.meses_duracion} meses
                      </p>
                    </div>
                  )}
                </div>
              </button>

              {/* Detalles expandidos */}
              {estaExpandido && (
                <div className="border-t border-gray-700 p-4 space-y-3 animate-in slide-in-from-top-2">
                  {/* Fechas */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Inicio: {new Date(plan.fecha_inicio).toLocaleDateString()}</span>
                    </div>
                    {plan.fecha_objetivo && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Meta: {new Date(plan.fecha_objetivo).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Configuración del plan */}
                  {plan.configuracion && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Detalles del Plan</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(plan.configuracion).map(([key, value]) => {
                          if (typeof value === 'object') return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-white font-medium">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    {progreso >= 100 ? (
                      <button
                        onClick={() => handleMarcarCompletado(plan.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar Completado
                      </button>
                    ) : (
                      <button
                        onClick={() => onEditarPlan && onEditarPlan(plan)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Actualizar Progreso
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(plan.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
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