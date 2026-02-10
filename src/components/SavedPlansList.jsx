import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, Trash2, Calendar, AlertCircle, CheckCircle, X, TrendingUp, DollarSign, Clock, CheckSquare } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SavedPlansList({ refreshSignal = 0, realFinancialData = {} }) {
  const { planes, loading, deletePlan, updatePlan, refresh } = usePlanesGuardados();
  const [planSeleccionado, setPlanSeleccionado] = useState(null);

  useEffect(() => {
    console.log('🔄 Actualizando planes...');
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // LÓGICA DE SYNC EN TIEMPO REAL
  const getPlanRealStats = useCallback((plan) => {
    let meta = Number(plan.monto_objetivo) || 0;
    let actual = Number(plan.monto_actual) || 0;
    let progreso = meta > 0 ? ((actual / meta) * 100).toFixed(1) : 0;
    let esDeuda = false;
    let deudaPendiente = 0;

    if (plan.tipo?.toLowerCase().includes('deuda')) {
      esDeuda = true;
      const orderedDebts = plan.configuracion?.plan?.orderedDebts || [];
      const deudasReales = realFinancialData.deudas || [];

      if (orderedDebts.length > 0) {
        let saldoOriginalTotal = 0;
        let saldoActualTotal = 0;

        orderedDebts.forEach(d => {
          const deudaReal = deudasReales.find(dr => 
            dr.id === d.id || dr.cuenta === d.nombre
          );

          const original = Number(d.balance || d.saldo || 0);
          const actualDeuda = deudaReal ? Number(deudaReal.saldo || 0) : original;

          saldoOriginalTotal += original;
          saldoActualTotal += actualDeuda;
        });

        const pagado = Math.max(0, saldoOriginalTotal - saldoActualTotal);
        const nuevoProgreso = saldoOriginalTotal > 0 ? ((pagado / saldoOriginalTotal) * 100).toFixed(1) : 0;

        meta = saldoOriginalTotal;
        actual = pagado;
        deudaPendiente = saldoActualTotal;
        progreso = nuevoProgreso;
      }
    }

    return { meta, actual, progreso, esDeuda, deudaPendiente };
  }, [realFinancialData]);

  const plansConStats = useMemo(() => {
    // Ensure 'planes' is used here, not 'plans'
    if (!planes || planes.length === 0) return [];
    return planes.map(p => ({
      ...p,
      stats: getPlanRealStats(p)
    }));
  }, [planes, getPlanRealStats]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-purple-500 text-center">
        <div className="text-purple-300 font-semibold">Cargando planes...</div>
      </div>
    );
  }

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plansConStats.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            stats={plan.stats} 
            onDelete={async (id) => {
              await deletePlan(id);
              await refresh();
            }}
            onClick={() => setPlanSeleccionado(plan)}
          />
        ))}
      </div>

      {planSeleccionado && (
        <ModalDetallesPlan
          plan={planSeleccionado}
          stats={planSeleccionado.stats}
          onClose={() => setPlanSeleccionado(null)}
          onDelete={async (id) => {
            await deletePlan(id);
            await refresh();
            setPlanSeleccionado(null);
          }}
          onComplete={async (id) => {
            await updatePlan(id, { completado: true, fecha_completado: new Date().toISOString() });
            await refresh();
            setPlanSeleccionado(null);
          }}
        />
      )}
    </>
  );
}

// --- COMPONENTE DE TARJETA ---
function PlanCard({ plan, stats, onDelete, onClick }) {
  const [showMenu, setShowMenu] = useState(false);

  const getInfo = (tipo) => {
    if (!tipo) return { bg: 'bg-blue-900/40', border: 'border-blue-500/30', icon: <CheckCircle className="w-6 h-6 text-blue-400" />, color: 'blue' };
    if (tipo.toLowerCase().includes('ahorro')) return { bg: 'from-green-900/40 to-green-800/20', border: 'border-green-500/30', icon: <Target className="w-6 h-6 text-green-400" />, color: 'green' };
    if (tipo.toLowerCase().includes('deuda')) return { bg: 'from-red-900/40 to-red-800/20', border: 'border-red-500/30', icon: <AlertCircle className="w-6 h-6 text-red-400" />, color: 'red' };
    return { bg: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-500/30', icon: <CheckCircle className="w-6 h-6 text-purple-400" />, color: 'purple' };
  };

  const { bg, border, icon, color } = getInfo(plan.tipo);
  const { meta, actual, progreso, esDeuda } = stats;

  return (
    <div 
      className={`bg-gradient-to-br ${bg} rounded-xl border ${border} p-4 shadow-lg relative cursor-pointer hover:scale-105 transition-transform`}
      onClick={onClick}
    >
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
                className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2"
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
              Number(progreso) >= 100 ? 'bg-green-500' : `bg-${color}-500`
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
        <span>
          {esDeuda 
            ? `$${actual.toLocaleString()} / Meta: $${meta.toLocaleString()}`
            : `$${actual.toLocaleString()} / $${meta.toLocaleString()}`
          }
        </span>
      </div>

      <div className="absolute top-2 right-2 opacity-50">
        <div className="text-xs text-gray-400">👆 Toca para ver detalles</div>
      </div>
    </div>
  );
}

// --- MODAL DE DETALLES ---
function ModalDetallesPlan({ plan, stats, onClose, onDelete, onComplete }) {
  const getInfo = (tipo) => {
    if (!tipo) return { bg: 'from-blue-900/40 to-blue-800/20', icon: <CheckCircle className="w-8 h-8 text-blue-400" />, color: 'blue' };
    if (tipo.toLowerCase().includes('ahorro')) return { bg: 'from-green-900/40 to-green-800/20', icon: <Target className="w-8 h-8 text-green-400" />, color: 'green' };
    if (tipo.toLowerCase().includes('deuda')) return { bg: 'from-red-900/40 to-red-800/20', icon: <AlertCircle className="w-8 h-8 text-red-400" />, color: 'red' };
    return { bg: 'from-purple-900/40 to-purple-800/20', icon: <CheckCircle className="w-8 h-8 text-purple-400" />, color: 'purple' };
  };

  const { bg, icon, color } = getInfo(plan.tipo);
  const { meta, actual, progreso, esDeuda, deudaPendiente } = stats;
  
  const fechaInicio = plan.fecha_inicio ? new Date(plan.fecha_inicio) : new Date();
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));
  
  const plazoMeses = plan.plazo_meses || 12;
  const diasTotales = plazoMeses * 30;
  const diasRestantes = Math.max(0, diasTotales - diasTranscurridos);
  const progresoTiempo = ((diasTranscurridos / diasTotales) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        
        <div className={`bg-gradient-to-r ${bg} p-6 rounded-t-2xl relative`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              {icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{plan.nombre}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-${color}-500/20 text-${color}-300 border border-${color}-500/30`}>
                {plan.tipo}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progreso del Plan</span>
              <span className="text-2xl font-bold text-white">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all bg-gradient-to-r ${
                  Number(progreso) >= 100 
                    ? 'from-green-500 to-emerald-500' 
                    : `from-${color}-500 to-${color}-600`
                }`}
                style={{ width: `${Math.min(100, progreso)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">{esDeuda ? 'Pagado' : 'Monto Actual'}</span>
              </div>
              <p className="text-2xl font-bold text-white">${actual.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Meta</span>
              </div>
              <p className="text-2xl font-bold text-white">${meta.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-gray-400">{esDeuda ? 'Pendiente' : 'Faltante'}</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {esDeuda ? deudaPendiente.toLocaleString() : Math.max(0, meta - actual).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Plazo</span>
              </div>
              <p className="text-2xl font-bold text-white">{plazoMeses} meses</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Línea de Tiempo
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Inicio:</span>
                <span className="text-white font-semibold">
                  {fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Días transcurridos:</span>
                <span className="text-white font-semibold">{diasTranscurridos} días</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Días restantes:</span>
                <span className="text-cyan-400 font-semibold">{diasRestantes} días</span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progreso del tiempo</span>
                  <span>{progresoTiempo}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.min(100, progresoTiempo)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {plan.tipo?.toLowerCase().includes('ahorro') && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <h3 className="text-green-400 font-bold mb-2">📈 Plan de Ahorro</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ahorro mensual sugerido:</span>
                  <span className="text-white font-semibold">${(meta / plazoMeses).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ahorro semanal:</span>
                  <span className="text-white font-semibold">{(meta / plazoMeses / 4).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {plan.tipo?.toLowerCase().includes('deuda') && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-red-400 font-bold mb-2">💳 Plan de Deuda (Actualizado)</h3>
              <p className="text-xs text-gray-400 mb-2">
                Este estado se calcula en tiempo real con los saldos actuales de tus tarjetas.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estrategia:</span>
                  <span className="text-white font-semibold">{plan.estrategia || 'Avalancha'}</span>
                </div>
                {plan.pago_mensual > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pago mensual:</span>
                    <span className="text-white font-semibold">${plan.pago_mensual.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {plan.notas && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2">📝 Notas</h3>
              <p className="text-white text-sm">{plan.notas}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (window.confirm('¿Marcar este plan como completado?')) {
                  onComplete(plan.id);
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-5 h-5" />
              Marcar como Completado
            </button>

            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar este plan?')) {
                  onDelete(plan.id);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}