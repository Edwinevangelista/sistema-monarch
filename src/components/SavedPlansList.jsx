// src/components/SavedPlansList.jsx
// ✅ VERSIÓN FINAL - SIN configuración técnica

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Target, Trash2, MoreVertical, Calendar, DollarSign, TrendingUp, TrendingDown, Zap, Percent, Calculator } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavedPlansList({ refreshSignal }) {
  const { planes, loading, error, deletePlan, marcarComoCompletado, refresh } = usePlanesGuardados();
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    console.log('🔄 SavedPlansList recibió señal de actualización:', refreshSignal);
    if (refreshSignal > 0) {
      refresh();
    }
  }, [refreshSignal]);

  useEffect(() => {
    console.log('📊 SavedPlansList montado, cargando planes...');
    refresh();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Cargando tus planes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30 text-center">
        <p className="text-red-300">Error al cargar los planes: {error.message}</p>
      </div>
    );
  }

  if (!planes || planes.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
        <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No hay planes activos</h3>
        <p className="text-gray-400">Crea un nuevo plan de ahorro, deudas o gastos para empezar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {planes.map((plan) => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onClick={() => setSelectedPlan(plan)}
          onDelete={deletePlan} 
          onComplete={marcarComoCompletado} 
        />
      ))}
      
      {selectedPlan && (
        <PlanDetallesModal 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
        />
      )}
    </div>
  );
}

// ========== COMPONENTE DE TARJETA ==========
function PlanCard({ plan, onClick, onDelete, onComplete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getPlanInfo = (tipo) => {
    switch(tipo) {
      case 'ahorro':
        return { 
          bg: 'from-green-600/20 to-emerald-600/20', 
          border: 'border-green-500/30', 
          icon: <Target className="text-green-400" /> 
        };
      case 'deudas':
        return { 
          bg: 'from-red-600/20 to-pink-600/20', 
          border: 'border-red-500/30', 
          icon: <DollarSign className="text-red-400" /> 
        };
      case 'gastos':
        return { 
          bg: 'from-orange-600/20 to-yellow-600/20', 
          border: 'border-orange-500/30', 
          icon: <TrendingDown className="text-orange-400" /> 
        };
      default:
        return { 
          bg: 'from-blue-600/20 to-purple-600/20', 
          border: 'border-blue-500/30', 
          icon: <CheckCircle2 className="text-blue-400" /> 
        };
    }
  };

  const info = getPlanInfo(plan.tipo);
  const meta = Number(plan.monto_objetivo) || 0;
  const actual = Number(plan.monto_actual) || 0;
  const progreso = Number(plan.progreso) || 0;
  const meses = Number(plan.meses_duracion) || 0;

  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br ${info.bg} rounded-xl border ${info.border} p-5 relative transition hover:scale-[1.02] cursor-pointer shadow-lg`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg shadow-sm">
            {info.icon}
          </div>
          <div>
            <h4 className="text-white font-bold text-lg leading-tight">{plan.nombre}</h4>
            <span className="text-xs uppercase font-semibold text-gray-300 tracking-wider">
              {plan.tipo}
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
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-white/10 z-20 overflow-hidden">
              {plan.activo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('¿Marcar este plan como completado?')) {
                      onComplete(plan.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-green-300 hover:bg-white/10 flex items-center gap-2 border-b border-gray-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completar
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Estás seguro de eliminar este plan?')) {
                    onDelete(plan.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">Progreso</span>
          <span className="text-white font-bold">{progreso.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-500 ${
              progreso >= 100 ? 'bg-green-500' : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min(100, progreso)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-400">
          <span>Actual: ${actual.toLocaleString()}</span>
          <span>Meta: ${meta.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{meses > 0 ? `${meses} meses` : 'Sin plazo'}</span>
        </div>
        <div className="text-right">
          <span>Inicio: {plan.fecha_inicio?.split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}

// ========== MODAL DE DETALLES (SIN CONFIG TÉCNICA) ==========
function PlanDetallesModal({ plan, onClose }) {
  if (!plan) return null;

  const meta = Number(plan.monto_objetivo) || 0;
  const actual = Number(plan.monto_actual) || 0;
  const progreso = Number(plan.progreso) || 0;
  const meses = Number(plan.meses_duracion) || 0;
  const restante = Math.max(0, meta - actual);

  // Extraer info útil del plan
  const config = plan.configuracion || {};
  const planDetails = config.plan || {};
  const capacity = config.capacity || {};
  const feasibility = config.feasibility || {};

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800 pb-3 border-b border-gray-700 z-10">
          <h3 className="text-lg md:text-2xl font-bold text-white pr-2 line-clamp-2">{plan.nombre}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 md:space-y-5">
          
          {/* Progreso Principal */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm md:text-base text-gray-400">Progreso General</span>
              <span className="text-xl md:text-2xl font-bold text-white">{progreso.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 md:h-6 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all ${progreso >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                style={{ width: `${Math.min(100, progreso)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs md:text-sm font-semibold">
              <div className="text-emerald-300">
                Ahorrado: <span className="text-white">${actual.toLocaleString()}</span>
              </div>
              <div className="text-orange-300">
                Falta: <span className="text-white">${restante.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 md:p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-300 text-xs md:text-sm mb-1">
                <Target className="w-4 h-4" /> Meta Total
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">
                ${meta.toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 md:p-4 rounded-xl border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-300 text-xs md:text-sm mb-1">
                <Clock className="w-4 h-4" /> Duración
              </div>
              <div className="text-xl md:text-3xl font-bold text-white">
                {meses > 0 ? `${meses}` : '--'}<span className="text-base ml-1">meses</span>
              </div>
            </div>
          </div>

          {/* Plan de Ahorro Sugerido */}
          {(planDetails.monthlyRequired || planDetails.weeklyRequired) && (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 p-4">
              <h4 className="text-green-300 font-bold text-sm mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Plan de Ahorro Sugerido
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {planDetails.monthlyRequired && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Ahorro Mensual</div>
                    <div className="text-white text-xl font-bold">
                      ${Number(planDetails.monthlyRequired).toLocaleString()}
                    </div>
                  </div>
                )}
                {planDetails.weeklyRequired && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Ahorro Semanal</div>
                    <div className="text-white text-xl font-bold">
                      ${Number(planDetails.weeklyRequired).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capacidad de Ahorro */}
          {(capacity.conservativeMonthly || capacity.recommendedMonthly) && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30 p-4">
              <h4 className="text-yellow-300 font-bold text-sm mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Tu Capacidad de Ahorro
              </h4>
              <div className="space-y-2">
                {capacity.conservativeMonthly && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300 text-sm">🟢 Conservador</span>
                    <span className="text-white font-bold">${Number(capacity.conservativeMonthly).toLocaleString()}</span>
                  </div>
                )}
                {capacity.recommendedMonthly && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300 text-sm">🟡 Recomendado</span>
                    <span className="text-white font-bold">${Number(capacity.recommendedMonthly).toLocaleString()}</span>
                  </div>
                )}
                {capacity.aggressiveMonthly && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300 text-sm">🔴 Agresivo</span>
                    <span className="text-white font-bold">${Number(capacity.aggressiveMonthly).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Factibilidad */}
          {feasibility.percentage && (
            <div className={`rounded-xl border p-4 ${
              feasibility.percentage >= 80 ? 'bg-green-500/10 border-green-500/30' :
              feasibility.percentage >= 60 ? 'bg-blue-500/10 border-blue-500/30' :
              feasibility.percentage >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Percent className={`w-5 h-5 ${
                  feasibility.percentage >= 80 ? 'text-green-400' :
                  feasibility.percentage >= 60 ? 'text-blue-400' :
                  feasibility.percentage >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`} />
                <div>
                  <div className="text-white font-bold">
                    Factibilidad: {feasibility.percentage}%
                  </div>
                  {feasibility.message && (
                    <div className="text-gray-300 text-sm mt-1">{feasibility.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300 bg-gray-700/30 p-2 md:p-3 rounded-lg">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Fecha de Inicio</div>
                <div className="font-mono text-white text-xs md:text-sm">
                  {plan.fecha_inicio?.split('T')[0]}
                </div>
              </div>
            </div>
            
            {plan.fecha_objetivo && (
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300 bg-gray-700/30 p-2 md:p-3 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Fecha Objetivo</div>
                  <div className="font-mono text-white text-xs md:text-sm">
                    {plan.fecha_objetivo.split('T')[0]}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          {plan.descripcion && (
            <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/10">
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Descripción</div>
              <p className="text-gray-200 text-sm leading-relaxed">
                {plan.descripcion}
              </p>
            </div>
          )}

        </div>

        {/* Botón Cerrar */}
        <div className="mt-6 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 md:py-3 rounded-xl transition text-sm md:text-base shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}