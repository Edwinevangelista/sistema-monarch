// src/components/SubscriptionOptimizerModal.jsx

// CORRECCIÓN: Eliminada la importación de 'useState' ya que no se usa ningún estado en este componente.
import { X, AlertTriangle, TrendingDown, CheckCircle2, Zap } from 'lucide-react';

export default function SubscriptionOptimizerModal({ suscripciones = [], kpis = {}, onClose }) {
  
  // Filtrar suscripciones activas
  const activeSubs = suscripciones.filter(s => s.estado === 'Activo');

  // Calcular total mensual
  const totalMensual = activeSubs.reduce((sum, sub) => {
    const costo = Number(sub.costo) || 0;
    if (sub.ciclo === 'Anual') return sum + (costo / 12);
    if (sub.ciclo === 'Semanal') return sum + (costo * 4.33);
    return sum + costo;
  }, 0);

  const totalIngresos = Number(kpis.totalIngresos) || 0;
  
  // Evitar división por cero
  const porcentajeIngresos = totalIngresos > 0 ? (totalMensual / totalIngresos) * 100 : 0;

  // Detectar duplicados (mismo tipo de servicio)
  const categorias = {};
  activeSubs.forEach(sub => {
    const tipo = sub.categoria || 'Otros';
    if (!categorias[tipo]) categorias[tipo] = [];
    categorias[tipo].push(sub);
  });

  const duplicados = Object.entries(categorias)
    .filter(([_, subs]) => subs.length > 1)
    .map(([categoria, subs]) => ({
      categoria,
      cantidad: subs.length,
      suscripciones: subs,
      ahorroPotencial: subs.slice(1).reduce((sum, s) => {
        const costo = Number(s.costo) || 0;
        if (s.ciclo === 'Anual') return sum + (costo / 12);
        if (s.ciclo === 'Semanal') return sum + (costo * 4.33);
        return sum + costo;
      }, 0)
    }));

  // Identificar suscripciones caras (>5% de ingresos)
  const caras = activeSubs.filter(sub => {
    const costoMensual = sub.ciclo === 'Anual' 
      ? (Number(sub.costo) || 0) / 12 
      : sub.ciclo === 'Semanal'
      ? (Number(sub.costo) || 0) * 4.33
      : Number(sub.costo) || 0;
      
    // Solo chequear si hay ingresos
    return totalIngresos > 0 && (costoMensual / totalIngresos) > 0.05;
  });

  const ahorroPotencialTotal = duplicados.reduce((sum, d) => sum + d.ahorroPotencial, 0);
  const metaRecomendada = totalIngresos * 0.05; // 5% de ingresos

  const money = (v) => `$${Number(v || 0).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">✂️ Optimizador de Suscripciones</h2>
            <p className="text-indigo-100 text-sm">Identifica duplicados y ahorra dinero</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-300 text-xs font-medium mb-1">SUSCRIPCIONES ACTIVAS</div>
              <div className="text-white text-2xl font-bold">{activeSubs.length}</div>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
              <div className="text-orange-300 text-xs font-medium mb-1">GASTO MENSUAL</div>
              <div className="text-white text-2xl font-bold">{money(totalMensual)}</div>
              <div className="text-orange-200 text-xs mt-1">
                {totalIngresos > 0 ? `${porcentajeIngresos.toFixed(1)}% de tus ingresos` : 'Sin datos de ingresos'}
              </div>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <div className="text-green-300 text-xs font-medium mb-1">AHORRO POTENCIAL</div>
              <div className="text-white text-2xl font-bold">{money(ahorroPotencialTotal)}</div>
              <div className="text-green-200 text-xs mt-1">{duplicados.length} duplicados detectados</div>
            </div>
          </div>

          {/* Análisis */}
          {porcentajeIngresos > 10 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-red-200 font-semibold mb-1">⚠️ Gasto Alto en Suscripciones</div>
                <div className="text-red-100 text-sm">
                  Estás gastando {porcentajeIngresos.toFixed(1)}% de tus ingresos en suscripciones. 
                  Se recomienda mantenerlo bajo 5% ({money(metaRecomendada)}/mes).
                </div>
              </div>
            </div>
          )}

          {/* Duplicados */}
          {duplicados.length > 0 && (
            <div>
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Duplicados Detectados
              </h3>
              <div className="space-y-3">
                {duplicados.map((dup, idx) => (
                  <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-yellow-200 font-semibold">{dup.categoria}</div>
                        <div className="text-yellow-100 text-sm">{dup.cantidad} suscripciones similares</div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-200 text-sm">Ahorro potencial:</div>
                        <div className="text-white font-bold text-lg">{money(dup.ahorroPotencial)}/mes</div>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3">
                      {dup.suscripciones.map((sub, i) => (
                        <div key={i} className="text-yellow-100 text-sm flex justify-between">
                          <span>• {sub.servicio}</span>
                          <span>{money(sub.costo)}/{sub.ciclo === 'Mensual' ? 'mes' : sub.ciclo === 'Anual' ? 'año' : 'sem'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-yellow-200 text-xs">
                      💡 Considera cancelar las que uses menos
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suscripciones Caras */}
          {caras.length > 0 && (
            <div>
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-400" />
                Suscripciones Costosas
              </h3>
              <div className="space-y-2">
                {caras.map((sub, idx) => {
                  const costoMensual = sub.ciclo === 'Anual' 
                    ? (Number(sub.costo) || 0) / 12 
                    : sub.ciclo === 'Semanal'
                    ? (Number(sub.costo) || 0) * 4.33
                    : Number(sub.costo) || 0;
                  const porcentaje = ((costoMensual / totalIngresos) * 100).toFixed(1);
                  
                  return (
                    <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">{sub.servicio}</div>
                          <div className="text-orange-200 text-sm">{sub.categoria}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{money(costoMensual)}/mes</div>
                          <div className="text-orange-200 text-xs">{porcentaje}% de ingresos</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {duplicados.length === 0 && caras.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <div className="text-green-200 font-semibold text-lg mb-2">¡Excelente gestión!</div>
              <div className="text-green-100 text-sm">
                No detectamos duplicados ni suscripciones excesivamente costosas.
                Tus suscripciones representan {porcentajeIngresos.toFixed(1)}% de tus ingresos.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}