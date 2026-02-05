import React from 'react';
import { X, AlertTriangle, TrendingDown, CheckCircle2, Zap, Trash2, Layers } from 'lucide-react';

export default function SubscriptionOptimizerModal({ suscripciones, kpis, onClose }) {
  // Protección de datos
  const safeSuscripciones = Array.isArray(suscripciones) ? suscripciones : [];
  const safeKpis = typeof kpis === 'object' && kpis !== null ? kpis : {};

  // Calcular totales
  const activeSubs = safeSuscripciones.filter(s => s && s.estado === 'Activo');

  const totalMensual = React.useMemo(() => {
    return activeSubs.reduce((sum, sub) => {
      const costo = Number(sub.costo) || 0;
      if (sub.ciclo === 'Anual') return sum + (costo / 12);
      if (sub.ciclo === 'Semanal') return sum + (costo * 4.33);
      return sum + costo;
    }, 0);
  }, [activeSubs]);

  const totalIngresos = Number(safeKpis.totalIngresos) || 0;
  const porcentajeIngresos = totalIngresos > 0 ? (totalMensual / totalIngresos) * 100 : 0;

  // Duplicados
  const duplicados = React.useMemo(() => {
    const cats = {};
    activeSubs.forEach(sub => {
      const tipo = sub.categoria || 'Otros';
      if (!cats[tipo]) cats[tipo] = [];
      cats[tipo].push(sub);
    });
    return Object.entries(cats)
      .filter(([_, subs]) => subs.length > 1)
      .map(([categoria, subs]) => ({
        categoria,
        cantidad: subs.length,
        ahorroPotencial: subs.slice(1).reduce((sum, s) => {
          const c = Number(s.costo) || 0;
          if (s.ciclo === 'Anual') return sum + (c / 12);
          if (s.ciclo === 'Semanal') return sum + (c * 4.33);
          return sum + c;
        }, 0)
      }));
  }, [activeSubs]);

  const ahorroPotencialTotal = duplicados.reduce((sum, d) => sum + d.ahorroPotencial, 0);
  const metaRecomendada = totalIngresos * 0.05;

  // Suscripciones caras (> 10% de ingreso si hay ingresos, o > 5% del total)
  const caras = React.useMemo(() => {
    if (totalIngresos === 0) return [];
    return activeSubs.filter(sub => {
      const costoMensual = sub.ciclo === 'Anual' ? (Number(sub.costo) || 0) / 12 : sub.ciclo === 'Semanal' ? (Number(sub.costo) || 0) * 4.33 : Number(sub.costo) || 0;
      return (costoMensual / totalIngresos) > 0.05; // 5%
    });
  }, [activeSubs, totalIngresos]);

  const money = (v) => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-200">
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-3xl border-b border-white/5 shrink-0">
          <div className="flex items-start justify-between">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <Zap className="w-8 h-8 text-yellow-300" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Optimizador de Suscripciones</h2>
               </div>
               <p className="text-indigo-200 text-sm">Analiza y cancela servicios innecesarios</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 text-center">
              <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Activas</div>
              <div className="text-white text-3xl font-bold">{activeSubs.length}</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 text-center">
              <div className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-1">Costo Mensual</div>
              <div className="text-white text-3xl font-bold">{money(totalMensual)}</div>
              <div className="text-orange-200 text-xs mt-1">
                {totalIngresos > 0 ? `${porcentajeIngresos.toFixed(1)}% ingresos` : 'Sin datos de ingresos'}
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
              <div className="text-green-300 text-xs font-bold uppercase tracking-wider mb-1">Ahorro Potencial</div>
              <div className="text-white text-3xl font-bold text-green-400">{money(ahorroPotencialTotal)}</div>
              <div className="text-green-200 text-xs mt-1">{duplicados.length} duplicados</div>
            </div>
          </div>

          {/* ALERTA DE GASTO ALTO */}
          {porcentajeIngresos > 10 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-4">
               <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
               <div>
                  <div className="text-red-200 font-bold text-lg mb-1">⚠️ Gasto Alto en Suscripciones</div>
                  <div className="text-red-100 text-sm">
                    Estás gastando {porcentajeIngresos.toFixed(1)}% de tus ingresos. 
                    Se recomienda mantenerlo bajo 5-10% ({money(metaRecomendada)}/mes).
                  </div>
               </div>
            </div>
          )}

          {/* DUPLICADOS */}
          {duplicados.length > 0 && (
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <Layers className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Duplicados Detectados</h3>
               </div>
               <div className="space-y-4">
                  {duplicados.map((dup, idx) => (
                    <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                               <h4 className="text-white font-bold text-lg">{dup.categoria}</h4>
                               <div className="text-yellow-200 text-sm">{dup.cantidad} servicios similares</div>
                           </div>
                           <div className="text-right">
                               <div className="text-yellow-200 text-sm">Ahorro potencial:</div>
                               <div className="text-white font-bold text-2xl">{money(dup.ahorroPotencial)}/mes</div>
                           </div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4">
                           <div className="space-y-2">
                              {dup.suscripciones.map((sub, i) => (
                                  <div key={i} className="flex justify-between text-sm text-yellow-100 border-b border-yellow-500/20 last:border-0 pb-1">
                                     <span>• {sub.servicio}</span>
                                     <span>{money(sub.costo)}/{sub.ciclo === 'Mensual' ? 'mes' : sub.ciclo === 'Anual' ? 'año' : 'sem'}</span>
                                  </div>
                              ))}
                           </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg text-center border border-yellow-500/30">
                            <span className="text-yellow-200 text-sm flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                💡 Considera cancelar las que no uses
                            </span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* SUSCRIPCIONES CARAS */}
          {caras.length > 0 && (
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="w-6 h-6 text-orange-400" />
                  <h3 className="text-xl font-bold text-white">Suscripciones Costosas</h3>
               </div>
               <div className="space-y-3">
                  {caras.map((sub, idx) => {
                    const costoMensual = sub.ciclo === 'Anual' ? (Number(sub.costo) || 0) / 12 : sub.ciclo === 'Semanal' ? (Number(sub.costo) || 0) * 4.33 : Number(sub.costo) || 0;
                    const porcentaje = ((costoMensual / totalIngresos) * 100).toFixed(1);
                    return (
                      <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Trash2 className="w-6 h-6 text-orange-400 opacity-50" />
                             <div>
                                <h4 className="text-white font-bold">{sub.servicio}</h4>
                                <div className="text-orange-200 text-sm">{sub.categoria}</div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-white font-bold text-xl">{money(costoMensual)}/mes</div>
                             <div className="text-orange-200 text-xs">{porcentaje}% de ingresos</div>
                          </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* ESTADO SALUDABLE */}
          {duplicados.length === 0 && caras.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-10 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-200 mb-2">¡Excelente gestión!</h3>
                <p className="text-green-100 text-lg">
                  No detectamos duplicados ni suscripciones excesivamente costosas.
                  {totalIngresos > 0 && <p className="text-green-200 mt-2 text-base">Tus suscripciones representan el {porcentajeIngresos.toFixed(1)}% de tus ingresos.</p>}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}