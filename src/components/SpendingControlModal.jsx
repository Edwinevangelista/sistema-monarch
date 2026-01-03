// src/components/SpendingControlModal.jsx
import { useState } from 'react';
import { X, TrendingDown, Target, DollarSign, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export default function SpendingControlModal({ gastosFijos = [], gastosVariables = [], suscripciones = [], kpis = {}, onClose }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [view, setView] = useState('analysis');

  // Calcular totales
  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const totalGastosVariables = gastosVariables.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      const costo = Number(s.costo) || 0;
      if (s.ciclo === 'Anual') return sum + (costo / 12);
      if (s.ciclo === 'Semanal') return sum + (costo * 4.33);
      return sum + costo;
    }, 0);

  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;
  const totalIngresos = Number(kpis.totalIngresos) || 1000;
  const porcentajeGastos = (totalGastos / totalIngresos) * 100;

  // Agrupar gastos por categoría
  const gastosPorCategoria = {};
  
  [...gastosFijos, ...gastosVariables].forEach(gasto => {
    const categoria = gasto.categoria || '📦 Otros';
    const monto = Number(gasto.monto) || 0;
    
    if (!gastosPorCategoria[categoria]) {
      gastosPorCategoria[categoria] = {
        categoria,
        total: 0,
        items: [],
        tipo: gastosFijos.includes(gasto) ? 'fijo' : 'variable'
      };
    }
    
    gastosPorCategoria[categoria].total += monto;
    gastosPorCategoria[categoria].items.push(gasto);
  });

  // Convertir a array y ordenar
  const categoriasOrdenadas = Object.values(gastosPorCategoria)
    .sort((a, b) => b.total - a.total);

  // Análisis de reducción
  const metaRecomendada = totalIngresos * 0.6; // 60% de ingresos
  const reduccionNecesaria = Math.max(0, totalGastos - metaRecomendada);
  const porcentajeReduccion = totalGastos > 0 ? (reduccionNecesaria / totalGastos) * 100 : 0;

  // Identificar categorías problemáticas
  const categoriasCriticas = categoriasOrdenadas
    .filter(cat => (cat.total / totalGastos) > 0.15) // Más del 15% del total
    .slice(0, 3);

  // Generar recomendaciones
  const generarRecomendaciones = () => {
    const recomendaciones = [];

    // Déficit
    if (porcentajeGastos > 100) {
      recomendaciones.push({
        icon: '🚨',
        title: 'Estás en déficit',
        message: `Gastas ${porcentajeGastos.toFixed(0)}% de tus ingresos`,
        ahorro: Math.round(totalGastos - totalIngresos),
        priority: 'critical',
        actions: [
          `Reduce ${Math.round(reduccionNecesaria)} inmediatamente`,
          'Prioriza gastos esenciales',
          'Cancela suscripciones no esenciales'
        ]
      });
    }

    // Gastos altos
    if (porcentajeGastos > 70 && porcentajeGastos <= 100) {
      recomendaciones.push({
        icon: '⚠️',
        title: 'Gastos muy altos',
        message: 'Estás gastando más del 70% de tus ingresos',
        ahorro: Math.round(reduccionNecesaria),
        priority: 'high',
        actions: [
          'Establece un presupuesto de 60% de ingresos',
          'Identifica gastos innecesarios',
          'Crea un fondo de emergencia'
        ]
      });
    }

    // Categorías críticas
    if (categoriasCriticas.length > 0) {
      recomendaciones.push({
        icon: '📊',
        title: 'Categorías de alto gasto',
        message: `${categoriasCriticas.length} categorías concentran el ${Math.round((categoriasCriticas.reduce((sum, c) => sum + c.total, 0) / totalGastos) * 100)}%`,
        ahorro: Math.round(categoriasCriticas.reduce((sum, c) => sum + c.total, 0) * 0.2),
        priority: 'medium',
        actions: categoriasCriticas.map(c => 
          `${c.categoria}: Reduce $${Math.round(c.total * 0.2)} (20%)`
        )
      });
    }

    // Gastos variables altos
    if (totalGastosVariables > totalGastosFijos) {
      recomendaciones.push({
        icon: '💸',
        title: 'Gastos variables muy altos',
        message: `$${Math.round(totalGastosVariables)} vs $${Math.round(totalGastosFijos)} fijos`,
        ahorro: Math.round(totalGastosVariables * 0.3),
        priority: 'medium',
        actions: [
          'Reduce gastos hormiga',
          'Planifica compras semanalmente',
          'Usa efectivo para gastos variables'
        ]
      });
    }

    // Suscripciones altas
    if (totalSuscripciones > totalIngresos * 0.1) {
      recomendaciones.push({
        icon: '📱',
        title: 'Muchas suscripciones',
        message: `$${Math.round(totalSuscripciones)}/mes (${((totalSuscripciones / totalIngresos) * 100).toFixed(0)}% ingresos)`,
        ahorro: Math.round(totalSuscripciones * 0.4),
        priority: 'medium',
        actions: [
          'Cancela las que no uses',
          'Usa la función "Optimizar Suscripciones"',
          'Comparte cuentas familiares'
        ]
      });
    }

    // Todo bien
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        icon: '✅',
        title: 'Gastos controlados',
        message: 'Tus gastos están en un rango saludable',
        ahorro: 0,
        priority: 'success',
        actions: [
          'Mantén el control mensual',
          'Considera aumentar tus ahorros',
          'Revisa gastos trimestralmente'
        ]
      });
    }

    return recomendaciones;
  };

  const recomendaciones = generarRecomendaciones();
  const metaPersonalizada = customGoal ? Number(customGoal) : metaRecomendada;
  const progresoMeta = totalGastos > 0 ? (metaPersonalizada / totalGastos) * 100 : 100;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600/30 to-red-600/30 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-orange-300" />
            <div>
              <h2 className="text-2xl font-bold text-white">Control de Gastos</h2>
              <p className="text-orange-200 text-sm">Reduce gastos y elimina el déficit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Total Gastos</div>
              <div className="text-white text-2xl font-bold">${Math.round(totalGastos)}</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">% Ingresos</div>
              <div className={`text-2xl font-bold ${
                porcentajeGastos > 100 ? 'text-red-400' : 
                porcentajeGastos > 70 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {porcentajeGastos.toFixed(0)}%
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Meta</div>
              <div className="text-white text-2xl font-bold">${Math.round(metaRecomendada)}</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Reducir</div>
              <div className="text-orange-400 text-2xl font-bold">${Math.round(reduccionNecesaria)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setView('analysis')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                view === 'analysis' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              📊 Por Categoría
            </button>
            <button
              onClick={() => setView('recommendations')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                view === 'recommendations' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              💡 Recomendaciones
            </button>
          </div>

          {/* Vista por Categoría */}
          {view === 'analysis' && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="text-white font-semibold mb-3">Distribución de Gastos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Gastos Fijos</span>
                    <span className="text-white font-bold">${Math.round(totalGastosFijos)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Gastos Variables</span>
                    <span className="text-white font-bold">${Math.round(totalGastosVariables)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Suscripciones</span>
                    <span className="text-white font-bold">${Math.round(totalSuscripciones)}</span>
                  </div>
                </div>
              </div>

              <h4 className="text-white font-semibold mb-3">Gastos por Categoría</h4>
              
              {categoriasOrdenadas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No hay gastos registrados
                </div>
              ) : (
                categoriasOrdenadas.map((cat, idx) => {
                  const porcentaje = (cat.total / totalGastos) * 100;
                  const esCritica = porcentaje > 15;
                  
                  return (
                    <div
                      key={idx}
                      className={`bg-white/5 rounded-xl p-4 border-l-4 ${
                        esCritica ? 'border-red-500' : 'border-orange-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-white font-semibold">{cat.categoria}</h5>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              cat.tipo === 'fijo' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {cat.tipo}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm">{cat.items.length} gasto{cat.items.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-lg">${Math.round(cat.total)}</div>
                          <div className="text-gray-400 text-sm">{porcentaje.toFixed(0)}%</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all ${
                            esCritica ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, porcentaje)}%` }}
                        />
                      </div>

                      {esCritica && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mt-2">
                          <p className="text-red-300 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Representa más del 15% de tus gastos
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Vista de Recomendaciones */}
          {view === 'recommendations' && (
            <div className="space-y-4">
              {recomendaciones.map((rec, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-5 border ${
                    rec.priority === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    rec.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                    rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{rec.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold text-lg">{rec.title}</h4>
                          <p className="text-gray-300 text-sm">{rec.message}</p>
                        </div>
                        {rec.ahorro > 0 && (
                          <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                            ${rec.ahorro}/mes
                          </div>
                        )}
                      </div>
                      
                      {rec.actions && rec.actions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {rec.actions.map((action, i) => (
                            <div key={i} className="text-orange-300 text-sm flex items-start gap-2">
                              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Meta personalizada */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-5 border border-green-400/30">
                <h4 className="text-white font-bold text-lg mb-3">Meta de Gastos</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-green-300 text-sm mb-2 block">Define tu meta mensual (opcional)</label>
                    <input
                      type="number"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder={`Recomendado: $${Math.round(metaRecomendada)}`}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-300">Progreso hacia meta</span>
                      <span className="text-white font-bold">
                        ${Math.round(totalGastos)} / ${Math.round(metaPersonalizada)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          progresoMeta <= 100 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, progresoMeta)}%` }}
                      />
                    </div>
                  </div>

                  {totalGastos > metaPersonalizada && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-300 text-sm">
                        Estás ${Math.round(totalGastos - metaPersonalizada)} por encima de tu meta
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}