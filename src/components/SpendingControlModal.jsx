import React, { useState, useMemo } from 'react';
import { X, TrendingDown, AlertTriangle, Zap, Save, PieChart, Activity, Target } from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

export default function SpendingControlModal({ gastosFijos = [], gastosVariables = [], suscripciones = [], kpis = {}, onClose, onPlanGuardado }) {
  const { addPlan } = usePlanesGuardados();
  
  // Estado
  const [view, setView] = useState('analysis'); // 'analysis' | 'recommendations'
  const [customGoal, setCustomGoal] = useState('');
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [planParaGuardar, setPlanParaGuardar] = useState(null);

  // --- CÁLCULOS INTELIGENTES ---
  
  const safeKpis = kpis || {};
  const totalIngresos = Number(safeKpis.totalIngresos) || 1000; // Fallback para evitar división por 0

  // Calcular totales
  const totalGastosFijos = useMemo(() => gastosFijos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0), [gastosFijos]);
  const totalGastosVariables = useMemo(() => gastosVariables.reduce((sum, g) => sum + (Number(g.monto) || 0), 0), [gastosVariables]);
  
  const totalSuscripciones = useMemo(() => {
    return suscripciones
      .filter(s => s.estado === 'Activo')
      .reduce((sum, s) => {
        const costo = Number(s.costo) || 0;
        if (s.ciclo === 'Anual') return sum + (costo / 12);
        if (s.ciclo === 'Semanal') return sum + (costo * 4.33);
        return sum + costo;
      }, 0);
  }, [suscripciones]);

  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;
  const porcentajeGastos = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

  // Agrupar por categoría
  const gastosPorCategoria = useMemo(() => {
    const agrupados = {};
    [...gastosFijos, ...gastosVariables].forEach(gasto => {
      const categoria = gasto.categoria || 'Otros';
      const monto = Number(gasto.monto) || 0;
      if (!agrupados[categoria]) {
        agrupados[categoria] = { total: 0, items: [], tipo: gastosFijos.includes(gasto) ? 'fijo' : 'variable' };
      }
      agrupados[categoria].total += monto;
      agrupados[categoria].items.push(gasto);
    });
    return Object.values(agrupados).sort((a, b) => b.total - a.total);
  }, [gastosFijos, gastosVariables]);

  // Análisis de Factibilidad y Salud
  const saludFinanciera = useMemo(() => {
    if (porcentajeGastos > 100) return { color: 'text-rose-500', label: 'Crítico', value: 10 }; // Riesgo 10
    if (porcentajeGastos > 90) return { color: 'text-orange-500', label: 'Alto', value: 7 };
    if (porcentajeGastos > 70) return { color: 'text-yellow-500', label: 'Cuidado', value: 5 };
    if (porcentajeGastos > 50) return { color: 'text-blue-400', label: 'Saludable', value: 3 };
    return { color: 'text-emerald-400', label: 'Excelente', value: 1 };
  }, [porcentajeGastos]);

  const metaRecomendada = totalIngresos * 0.6; // Regla del 60%
  const reduccionNecesaria = Math.max(0, totalGastos - metaRecomendada);
  const metaPersonalizada = customGoal ? Number(customGoal) : metaRecomendada;
  const progresoMeta = metaPersonalizada > 0 ? (totalGastos / metaPersonalizada) * 100 : 0;

  // Generador de Recomendaciones (IA Simulada)
  const recomendaciones = useMemo(() => {
    const recs = [];

    if (porcentajeGastos > 100) {
      recs.push({ icon: '🚨', title: 'Déficit Financiero', message: `Gastas el ${porcentajeGastos.toFixed(0)}% de tus ingresos`, accion: `Reduce $${Math.round(reduccionNecesaria)} inmediatamente`, priority: 'critical' });
    } else if (porcentajeGastos > 70) {
      recs.push({ icon: '⚠️', title: 'Gastos Elevados', message: 'Gastas más del 70% de tus ingresos', accion: 'Establece un presupuesto tope', priority: 'high' });
    }

    // Detectar categorías "Hueco Negro" (>15% del gasto total)
    const categoriasCriticas = gastosPorCategoria.filter(cat => (cat.total / totalGastos) > 0.15);
    if (categoriasCriticas.length > 0) {
      recs.push({ icon: '📊', title: 'Fugas de Dinero', message: `${categoriasCriticas.length} categorías concentran el ${Math.round((categoriasCriticas.reduce((s,c)=>s+c.total,0)/totalGastos)*100)}%`, accion: 'Audita estas categorías', priority: 'medium' });
    }

    if (totalGastosVariables > totalGastosFijos * 1.5) {
      recs.push({ icon: '🎛️', title: 'Gastos Hormiga', message: 'Tus gastos variables superan a tus fijos', accion: 'Registra gastos mayores en fijos', priority: 'medium' });
    }

    if (totalSuscripciones > totalIngresos * 0.1) {
      recs.push({ icon: '📱', title: 'Suscripciones Altas', message: `$${Math.round(totalSuscripciones)}/mes en suscripciones`, accion: 'Cancela las que no uses', priority: 'medium' });
    }

    if (recs.length === 0) {
      recs.push({ icon: '✅', title: 'Control Sólido', message: 'Tus gastos están en equilibrio', accion: 'Sigue así', priority: 'success' });
    }

    return recs;
  }, [totalGastosVariables, totalGastosFijos, gastosPorCategoria, totalSuscripciones, porcentajeGastos, totalIngresos]);

  // --- MANEJADORES DE EVENTOS ---
  const handleGuardar = async (nombre) => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para tu plan');
      return;
    }
    try {
      const planData = {
        tipo: 'gastos',
        nombre: nombre,
        descripcion: `Plan de control para límite de $${Math.round(metaPersonalizada)}`,
        configuracion: {
          tipo: 'control_gastos',
          meta_actual: totalGastos,
          meta_objetivo: metaPersonalizada,
          recomendaciones: recomendaciones.map(r => r.accion).join(', ')
        },
        meta_principal: 'Control de Gastos',
        monto_objetivo: metaPersonalizada,
        monto_actual: totalGastos,
        progreso: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        meses_duracion: 1, // Control mensual
        activo: true,
        completado: false
      };

      await addPlan(planData);
      if (onPlanGuardado) await onPlanGuardado();
      setShowConfirmacion(false);
      onClose();
    } catch (error) {
      console.error('Error guardando plan:', error);
      alert('Error al guardar el plan');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-600 to-rose-600 p-6 rounded-t-3xl border-b border-white/10 shrink-0 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-white">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Control de Gastos</h2>
                <p className="text-orange-100 text-sm">Analiza patrones y optimiza flujo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* RESUMEN EJECUTIVO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Total Gastos</p>
              <p className="text-white text-2xl font-bold">${Math.round(totalGastos)}</p>
            </div>
            <div className={`bg-white/5 p-5 rounded-2xl border border-white/10 text-center`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">% Ingresos</p>
              <p className={`text-2xl font-bold ${saludFinanciera.color}`}>
                {porcentajeGastos.toFixed(0)}%
              </p>
              <p className={`text-[10px] mt-1 font-semibold ${saludFinanciera.color}`}>
                {saludFinanciera.label}
              </p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Meta Sugerida</p>
              <p className="text-white text-2xl font-bold">${Math.round(metaRecomendada)}</p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Reducir</p>
              <p className="text-rose-400 text-2xl font-bold">${Math.round(reduccionNecesaria)}</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            <button
              onClick={() => setView('analysis')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                view === 'analysis' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <PieChart className="w-5 h-5" />
              Por Categoría
            </button>
            <button
              onClick={() => setView('recommendations')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                view === 'recommendations' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Zap className="w-5 h-5" />
              Recomendaciones
            </button>
          </div>

          {/* VISTA ANÁLISIS */}
          {view === 'analysis' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-white font-bold text-lg mb-4">Distribución por Categoría</h4>
                {gastosPorCategoria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Sin gastos registrados</div>
                ) : (
                  <div className="space-y-4">
                    {gastosPorCategoria.map((cat, idx) => {
                      const porcentaje = (cat.total / totalGastos) * 100;
                      const esCritico = porcentaje > 15;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${esCritico ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {cat.tipo === 'fijo' ? <TrendingDown className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                              </div>
                              <span className="text-white font-semibold">{cat.categoria}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold text-lg">${Math.round(cat.total)}</div>
                              <div className="text-xs text-gray-400">{porcentaje.toFixed(0)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className={`h-full rounded-full transition-all duration-500 ${esCritico ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, porcentaje)}%` }} />
                          </div>
                          {esCritico && (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg flex items-center gap-2 text-xs text-rose-200 mt-2">
                              <AlertTriangle className="w-4 h-4" />
                              Esta categoría representa una gran fuga de dinero.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA RECOMENDACIONES */}
          {view === 'recommendations' && (
            <div className="space-y-4 animate-in fade-in">
              {recomendaciones.map((rec, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-5 border ${
                    rec.priority === 'critical' ? 'bg-rose-600/10 border-rose-500/30' :
                    rec.priority === 'high' ? 'bg-orange-600/10 border-orange-500/30' :
                    rec.priority === 'medium' ? 'bg-yellow-600/10 border-yellow-500/30' :
                    'bg-green-600/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{rec.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`text-lg font-bold ${rec.priority === 'success' ? 'text-emerald-300' : 'text-white'}`}>{rec.title}</h4>
                          <p className="text-gray-300 text-sm">{rec.message}</p>
                        </div>
                        {rec.priority !== 'success' && (
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                             rec.priority === 'critical' ? 'bg-rose-500/30 text-rose-300 border-rose-500/50' :
                             rec.priority === 'high' ? 'bg-orange-500/30 text-orange-300 border-orange-500/50' :
                             'bg-yellow-500/30 text-yellow-300 border-yellow-500/50'
                          }`}>
                             {rec.priority}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Array.isArray(rec.accion) ? rec.accion : rec.accion}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* META PERSONALIZADA */}
              <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/30 rounded-2xl p-6 mt-6">
                <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" /> Meta Personalizada
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Define tu límite mensual objetivo</label>
                    <input
                      type="number"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder={`Sugerido: $${Math.round(metaRecomendada)}`}
                      className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-green-500 text-lg"
                    />
                  </div>
                  {metaPersonalizada > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progreso hacia meta</span>
                        <span className="text-white font-bold">{progresoMeta.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-3">
                        <div className={`h-full rounded-full transition-all ${progresoMeta > 100 ? 'bg-rose-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, progresoMeta)}%` }} />
                      </div>
                      {totalGastos > metaPersonalizada && (
                        <div className="text-rose-300 text-xs mt-2">Estás gastando ${Math.round(totalGastos - metaPersonalizada)} por encima de tu meta</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER GUARDAR */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-white/5 shrink-0 z-10">
           <button
             onClick={() => { setPlanParaGuardar({ totalGastos, metaPersonalizada, recomendaciones }); setShowConfirmacion(true); }}
             className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-3"
           >
             <Save className="w-6 h-6" />
             Guardar Plan de Control
           </button>
        </div>

        {/* MODAL CONFIRMACIÓN */}
        {showConfirmacion && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl">
               <h3 className="text-white font-bold text-xl mb-4">Guardar Plan de Gastos</h3>
               <p className="text-gray-300 mb-4 text-sm">Este plan guardará tu meta de gastos y las alertas generadas por la IA.</p>
               <input 
                 type="text" 
                 placeholder="Nombre del plan (Ej: Control 2026)"
                 className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-white/30 mb-4"
                 autoFocus
               />
               <div className="flex gap-3">
                 <button onClick={() => setShowConfirmacion(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors">Cancelar</button>
                 <button onClick={() => handleGuardar('Mi Plan de Gastos')} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors">Guardar</button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}