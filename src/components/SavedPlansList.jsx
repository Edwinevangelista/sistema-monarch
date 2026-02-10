import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, Trash2, Calendar, AlertCircle, CheckCircle, X, TrendingUp, DollarSign, Clock, CheckSquare, RefreshCw } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';
import { supabase } from '../lib/supabaseClient';

export default function SavedPlansList({ refreshSignal = 0, realFinancialData = {} }) {
  const { planes, loading, deletePlan, updatePlan, refresh } = usePlanesGuardados();
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [deudasDirectas, setDeudasDirectas] = useState([]);

  useEffect(() => {
    console.log('🔄 Actualizando planes...');
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // ✅ NUEVO: Obtener deudas directamente de Supabase como fallback
  useEffect(() => {
    const fetchDeudas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          setDeudasDirectas(data);
          console.log('📋 SavedPlansList: Deudas cargadas directamente:', data.length);
        }
      } catch (err) {
        console.error('Error fetching deudas:', err);
      }
    };

    fetchDeudas();
  }, [refreshSignal]);

  // ✅ FUENTE DE DEUDAS: Usa props si existen, sino usa las directas de Supabase
  const deudasReales = useMemo(() => {
    const fromProps = realFinancialData?.deudas || [];
    if (fromProps.length > 0) return fromProps;
    return deudasDirectas;
  }, [realFinancialData, deudasDirectas]);

  // ✅ LÓGICA DE SYNC MEJORADA - Busca por múltiples campos
  const getPlanRealStats = useCallback((plan) => {
    let meta = Number(plan.monto_objetivo) || 0;
    let actual = Number(plan.monto_actual) || 0;
    let progreso = meta > 0 ? ((actual / meta) * 100).toFixed(1) : 0;
    let esDeuda = false;
    let deudaPendiente = 0;

    if (plan.tipo?.toLowerCase().includes('deuda')) {
      esDeuda = true;
      
      // ✅ Buscar orderedDebts en múltiples paths posibles de configuracion
      const config = plan.configuracion || {};
      const orderedDebts = 
        config?.plan?.orderedDebts || 
        config?.orderedDebts || 
        config?.analysis?.cleanDebts || 
        [];

      console.log(`📊 Plan "${plan.nombre}": orderedDebts encontradas:`, orderedDebts.length, '| Deudas reales:', deudasReales.length);

      if (orderedDebts.length > 0 && deudasReales.length > 0) {
        let saldoOriginalTotal = 0;
        let saldoActualTotal = 0;

        orderedDebts.forEach(d => {
          // ✅ MATCHING MEJORADO: Busca por id, cuenta, nombre
          const deudaReal = deudasReales.find(dr => 
            dr.id === d.id || 
            dr.cuenta === d.nombre || 
            dr.cuenta === d.cuenta ||
            dr.nombre === d.nombre ||
            (dr.cuenta && d.nombre && dr.cuenta.toLowerCase().includes(d.nombre.toLowerCase())) ||
            (dr.cuenta && d.cuenta && dr.cuenta.toLowerCase() === d.cuenta.toLowerCase())
          );

          const original = Number(d.balance || d.saldo || d.saldoOriginal || 0);
          const actualDeuda = deudaReal ? Number(deudaReal.saldo || 0) : original;

          console.log(`  💳 ${d.nombre || d.cuenta}: Original $${original} → Actual $${actualDeuda} ${deudaReal ? '(MATCHED ✅)' : '(NO MATCH ❌)'}`);

          saldoOriginalTotal += original;
          saldoActualTotal += actualDeuda;
        });

        const pagado = Math.max(0, saldoOriginalTotal - saldoActualTotal);
        const nuevoProgreso = saldoOriginalTotal > 0 ? ((pagado / saldoOriginalTotal) * 100).toFixed(1) : 0;

        meta = saldoOriginalTotal;
        actual = pagado;
        deudaPendiente = saldoActualTotal;
        progreso = nuevoProgreso;

        console.log(`  📈 Resultado: Pagado $${pagado.toFixed(2)} / $${saldoOriginalTotal.toFixed(2)} = ${nuevoProgreso}%`);
      } else if (orderedDebts.length === 0) {
        // ✅ Fallback: Usar progreso guardado en BD si no hay orderedDebts
        const progresoGuardado = Number(plan.progreso || 0);
        if (progresoGuardado > 0) {
          progreso = progresoGuardado.toFixed(1);
          console.log(`  📈 Usando progreso guardado en BD: ${progreso}%`);
        }
      }
    }

    return { meta, actual, progreso, esDeuda, deudaPendiente };
  }, [deudasReales]);

  const plansConStats = useMemo(() => {
    if (!planes || planes.length === 0) return [];
    return planes.map(p => ({
      ...p,
      stats: getPlanRealStats(p)
    }));
  }, [planes, getPlanRealStats]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-500/30 text-center">
        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
        <div className="text-purple-300 font-semibold text-sm">Cargando planes...</div>
      </div>
    );
  }

  if (!planes || planes.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10">
        <div className="text-5xl mb-3">📝</div>
        <h3 className="text-xl font-bold text-white mb-2">No tienes planes activos</h3>
        <p className="text-gray-400 text-sm">Usa los planificadores del asistente para crear planes.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
    if (!tipo) return { bg: 'from-blue-900/40 to-blue-800/20', border: 'border-blue-500/30', icon: <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />, color: 'blue', barColor: 'bg-blue-500' };
    if (tipo.toLowerCase().includes('ahorro')) return { bg: 'from-green-900/40 to-green-800/20', border: 'border-green-500/30', icon: <Target className="w-5 h-5 md:w-6 md:h-6 text-green-400" />, color: 'green', barColor: 'bg-green-500' };
    if (tipo.toLowerCase().includes('deuda')) return { bg: 'from-red-900/40 to-red-800/20', border: 'border-red-500/30', icon: <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />, color: 'red', barColor: 'bg-red-500' };
    return { bg: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-500/30', icon: <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />, color: 'purple', barColor: 'bg-purple-500' };
  };

  const { bg, border, icon, barColor } = getInfo(plan.tipo);
  const { meta, actual, progreso, esDeuda } = stats;
  const progresoNum = Number(progreso);

  return (
    <div 
      className={`bg-gradient-to-br ${bg} rounded-2xl border ${border} p-4 shadow-lg relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-white/10 rounded-xl shadow-sm shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-sm md:text-base truncate">{plan.nombre || 'Sin Nombre'}</h4>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">
              {plan.tipo || 'General'}
            </span>
          </div>
        </div>
        
        <div className="relative shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 hover:text-white transition p-1 -mr-1"
          >
            <div className="text-xl md:text-2xl leading-none">⋮</div>
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute right-0 top-8 w-40 bg-gray-700 rounded-xl shadow-xl border border-gray-600 z-20 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('¿Estás seguro de eliminar este plan?')) {
                      onDelete(plan.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 active:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5 text-gray-300">
          <span>Progreso</span>
          <span className={`font-bold ${progresoNum >= 100 ? 'text-green-400' : 'text-white'}`}>{progreso}%</span>
        </div>
        <div className="w-full bg-gray-900/60 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progresoNum >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : barColor
            }`}
            style={{ width: `${Math.min(100, progresoNum)}%` }}
          />
        </div>
      </div>

      {/* Montos */}
      <div className="flex justify-between items-center text-xs text-gray-400 border-t border-white/5 pt-2.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {plan.fecha_inicio ? plan.fecha_inicio.split('T')[0] : '-'}
        </span>
        <span className="font-semibold text-white/80">
          {esDeuda 
            ? `$${actual.toLocaleString()} pagado`
            : `$${actual.toLocaleString()} / $${meta.toLocaleString()}`
          }
        </span>
      </div>

      {/* Indicador de deuda pendiente */}
      {esDeuda && stats.deudaPendiente > 0 && (
        <div className="mt-2 text-[10px] text-red-300/70 text-right">
          Pendiente: ${stats.deudaPendiente.toLocaleString()}
        </div>
      )}
    </div>
  );
}

// --- MODAL DE DETALLES (Mobile-first) ---
function ModalDetallesPlan({ plan, stats, onClose, onDelete, onComplete }) {
  const getInfo = (tipo) => {
    if (!tipo) return { bg: 'from-blue-900/60 to-blue-800/30', icon: <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-blue-400" />, color: 'blue', barColor: 'bg-blue-500' };
    if (tipo.toLowerCase().includes('ahorro')) return { bg: 'from-green-900/60 to-green-800/30', icon: <Target className="w-7 h-7 md:w-8 md:h-8 text-green-400" />, color: 'green', barColor: 'bg-green-500' };
    if (tipo.toLowerCase().includes('deuda')) return { bg: 'from-red-900/60 to-red-800/30', icon: <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-red-400" />, color: 'red', barColor: 'bg-red-500' };
    return { bg: 'from-purple-900/60 to-purple-800/30', icon: <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-purple-400" />, color: 'purple', barColor: 'bg-purple-500' };
  };

  const { bg, icon, barColor } = getInfo(plan.tipo);
  const { meta, actual, progreso, esDeuda, deudaPendiente } = stats;
  const progresoNum = Number(progreso);
  
  const fechaInicio = plan.fecha_inicio ? new Date(plan.fecha_inicio) : new Date();
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));
  
  const plazoMeses = plan.plazo_meses || plan.meses_duracion || 12;
  const diasTotales = plazoMeses * 30;
  const diasRestantes = Math.max(0, diasTotales - diasTranscurridos);
  const progresoTiempo = Math.min(100, ((diasTranscurridos / diasTotales) * 100)).toFixed(1);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-gray-900 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${bg} p-5 md:p-6 relative shrink-0`}>
          {/* Drag handle mobile */}
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4 md:hidden" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-white/10 rounded-xl shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">{plan.nombre}</h2>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase bg-white/10 text-white/80 border border-white/20">
                {plan.tipo}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto flex-1">
          
          {/* Barra de progreso principal */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progreso del Plan</span>
              <span className={`text-2xl font-bold ${progresoNum >= 100 ? 'text-green-400' : 'text-white'}`}>
                {progreso}%
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  progresoNum >= 100 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                    : barColor
                }`}
                style={{ width: `${Math.min(100, progresoNum)}%` }}
              />
            </div>
            {progresoNum >= 100 && (
              <div className="mt-2 text-center text-green-400 text-xs font-bold">
                🎉 ¡Meta alcanzada!
              </div>
            )}
          </div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard 
              icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-400" />}
              label={esDeuda ? 'Pagado' : 'Monto Actual'}
              value={`$${actual.toLocaleString()}`}
              color="text-green-400"
            />
            <MetricCard 
              icon={<Target className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />}
              label="Meta Total"
              value={`$${meta.toLocaleString()}`}
            />
            <MetricCard 
              icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />}
              label={esDeuda ? 'Pendiente' : 'Faltante'}
              value={`$${esDeuda ? deudaPendiente.toLocaleString() : Math.max(0, meta - actual).toLocaleString()}`}
              color="text-orange-400"
            />
            <MetricCard 
              icon={<Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
              label="Plazo"
              value={`${plazoMeses} meses`}
            />
          </div>

          {/* Línea de Tiempo */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm md:text-base font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              Línea de Tiempo
            </h3>
            
            <div className="space-y-2.5">
              <TimelineRow 
                label="Inicio" 
                value={fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} 
              />
              <TimelineRow label="Días transcurridos" value={`${diasTranscurridos} días`} />
              <TimelineRow label="Días restantes" value={`${diasRestantes} días`} color="text-cyan-400" />

              <div className="mt-3 pt-2 border-t border-white/5">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                  <span>Progreso del tiempo</span>
                  <span>{progresoTiempo}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, progresoTiempo)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección específica por tipo */}
          {plan.tipo?.toLowerCase().includes('ahorro') && (
            <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
              <h3 className="text-green-400 font-bold text-sm mb-3">📈 Plan de Ahorro</h3>
              <div className="space-y-2 text-sm">
                <DetailRow label="Ahorro mensual sugerido" value={`$${(meta / plazoMeses).toFixed(2)}`} />
                <DetailRow label="Ahorro semanal" value={`$${(meta / plazoMeses / 4).toFixed(2)}`} />
              </div>
            </div>
          )}

          {plan.tipo?.toLowerCase().includes('deuda') && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-red-400 font-bold text-sm mb-2">💳 Plan de Deuda</h3>
              <p className="text-[11px] text-gray-400 mb-3">
                Sincronizado en tiempo real con tus saldos actuales.
              </p>
              <div className="space-y-2 text-sm">
                <DetailRow label="Estrategia" value={plan.estrategia || plan.configuracion?.strategy || 'Avalancha'} />
                {(plan.pago_mensual > 0 || plan.configuracion?.monthlyPayment > 0) && (
                  <DetailRow 
                    label="Pago mensual" 
                    value={`$${(plan.pago_mensual || plan.configuracion?.monthlyPayment || 0).toLocaleString()}`} 
                  />
                )}
              </div>
            </div>
          )}

          {plan.notas && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-xs font-bold text-gray-400 mb-2">📝 Notas</h3>
              <p className="text-white text-sm">{plan.notas}</p>
            </div>
          )}
        </div>

        {/* Botones de acción (sticky bottom) */}
        <div className="p-4 border-t border-white/10 bg-gray-900/90 backdrop-blur shrink-0 flex gap-3 safe-area-bottom">
          <button
            onClick={() => {
              if (window.confirm('¿Marcar este plan como completado?')) {
                onComplete(plan.id);
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
            Completar
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de eliminar este plan?')) {
                onDelete(plan.id);
              }
            }}
            className="flex-1 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function MetricCard({ icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[11px] md:text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-lg md:text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TimelineRow({ label, value, color = 'text-white' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}:</span>
      <span className={`${color} font-semibold`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}