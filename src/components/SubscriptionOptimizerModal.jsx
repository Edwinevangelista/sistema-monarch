// src/components/SubscriptionOptimizerModal.jsx
import { useState } from 'react';
import { X, Repeat, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Calendar, Zap } from 'lucide-react';

export default function SubscriptionOptimizerModal({ suscripciones = [], kpis = {}, onClose }) {
  const [view, setView] = useState('analysis');
  const [selectedActions, setSelectedActions] = useState([]);

  // Normalizar suscripciones
  const normalizeSuscripcion = (sub) => {
    let costoMensual = Number(sub.costo) || 0;
    
    if (sub.ciclo === 'Anual') {
      costoMensual = costoMensual / 12;
    } else if (sub.ciclo === 'Semanal') {
      costoMensual = costoMensual * 4.33;
    }
    
    return {
      ...sub,
      costoMensual: Math.round(costoMensual * 100) / 100,
      costoOriginal: Number(sub.costo) || 0
    };
  };

  const suscripcionesActivas = suscripciones
    .filter(s => s.estado === 'Activo')
    .map(normalizeSuscripcion);

  // Análisis de uso y valor
  const analyzeSuscripcion = (sub) => {
    const costoMensual = sub.costoMensual;
    const totalIngresos = Number(kpis.totalIngresos) || 1000;
    const porcentajeIngresos = (costoMensual / totalIngresos) * 100;
    
    let prioridad = 'low';
    let razon = '';
    let ahorroPotencial = 0;
    let recomendacion = '';
    
    // Criterios de evaluación
    if (porcentajeIngresos > 5) {
      prioridad = 'high';
      razon = `Representa el ${porcentajeIngresos.toFixed(1)}% de tus ingresos`;
      recomendacion = 'Evaluar si el costo justifica el beneficio';
    } else if (costoMensual > 50) {
      prioridad = 'medium';
      razon = 'Costo mensual elevado';
      recomendacion = 'Buscar alternativas más económicas';
    }
    
    // Detectar suscripciones duplicadas o similares
    const duplicadas = suscripcionesActivas.filter(s => 
      s.id !== sub.id && 
      (s.servicio.toLowerCase().includes(sub.servicio.toLowerCase().split(' ')[0]) ||
       s.categoria === sub.categoria)
    );
    
    if (duplicadas.length > 0) {
      prioridad = 'high';
      razon = `Posible duplicado con ${duplicadas[0].servicio}`;
      ahorroPotencial = Math.min(costoMensual, duplicadas[0].costoMensual);
      recomendacion = 'Consolidar servicios similares';
    }
    
    // Suscripciones que no se han usado recientemente
    if (sub.ultimo_uso) {
      const diasSinUso = Math.floor((new Date() - new Date(sub.ultimo_uso)) / (1000 * 60 * 60 * 24));
      if (diasSinUso > 30) {
        prioridad = 'high';
        razon = `Sin uso por ${diasSinUso} días`;
        ahorroPotencial = costoMensual;
        recomendacion = 'Considerar cancelación';
      }
    }
    
    // Suscripciones por ciclo
    if (sub.ciclo === 'Mensual' && costoMensual > 10) {
      const ahorroAnual = costoMensual * 12 * 0.15; // Típicamente 15% descuento
      if (ahorroAnual > costoMensual) {
        recomendacion = `Cambiar a plan anual (ahorrarías ~$${Math.round(ahorroAnual)}/año)`;
      }
    }
    
    return {
      ...sub,
      prioridad,
      razon,
      ahorroPotencial,
      recomendacion,
      duplicadas: duplicadas.length
    };
  };

  const suscripcionesAnalizadas = suscripcionesActivas.map(analyzeSuscripcion);
  
  // Estadísticas generales
  const totalMensual = suscripcionesActivas.reduce((sum, s) => sum + s.costoMensual, 0);
  const totalAnual = totalMensual * 12;
  const porcentajeIngresos = ((totalMensual / (Number(kpis.totalIngresos) || 1000)) * 100);
  
  const suscripcionesAltas = suscripcionesAnalizadas.filter(s => s.prioridad === 'high');
  const suscripcionesMedias = suscripcionesAnalizadas.filter(s => s.prioridad === 'medium');
  
  const ahorroPotencialTotal = suscripcionesAnalizadas.reduce((sum, s) => sum + s.ahorroPotencial, 0);
  
  // Recomendaciones de optimización
  const generarRecomendaciones = () => {
    const recomendaciones = [];
    
    if (porcentajeIngresos > 15) {
      recomendaciones.push({
        icon: '🚨',
        title: 'Gasto excesivo en suscripciones',
        message: `Gastas ${porcentajeIngresos.toFixed(1)}% de tus ingresos en suscripciones`,
        ahorro: Math.round(totalMensual * 0.3),
        actions: ['Cancela al menos 3 suscripciones de baja prioridad', 'Reduce el gasto mensual en $' + Math.round(totalMensual * 0.3)]
      });
    }
    
    if (suscripcionesAltas.length > 0) {
      recomendaciones.push({
        icon: '⚠️',
        title: `${suscripcionesAltas.length} suscripciones necesitan atención`,
        message: 'Duplicados, sin uso o muy costosas',
        ahorro: Math.round(suscripcionesAltas.reduce((sum, s) => sum + s.ahorroPotencial, 0)),
        actions: suscripcionesAltas.map(s => `Revisar: ${s.servicio}`)
      });
    }
    
    const mensualesToAnuales = suscripcionesActivas.filter(s => 
      s.ciclo === 'Mensual' && s.costoMensual > 10
    );
    
    if (mensualesToAnuales.length > 0) {
      const ahorroAnual = mensualesToAnuales.reduce((sum, s) => sum + (s.costoMensual * 12 * 0.15), 0);
      recomendaciones.push({
        icon: '💰',
        title: 'Cambia a planes anuales',
        message: `${mensualesToAnuales.length} suscripciones podrían ser anuales`,
        ahorro: Math.round(ahorroAnual),
        actions: mensualesToAnuales.map(s => `${s.servicio}: ~$${Math.round(s.costoMensual * 12 * 0.15)}/año`)
      });
    }
    
    if (ahorroPotencialTotal > totalMensual * 0.2) {
      recomendaciones.push({
        icon: '✨',
        title: 'Gran potencial de ahorro',
        message: `Podrías ahorrar hasta $${Math.round(ahorroPotencialTotal)}/mes`,
        ahorro: Math.round(ahorroPotencialTotal),
        actions: ['Implementa las recomendaciones prioritarias', 'Revisa mensualmente tus suscripciones']
      });
    }
    
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        icon: '✅',
        title: 'Suscripciones optimizadas',
        message: 'Tus suscripciones están bien gestionadas',
        ahorro: 0,
        actions: ['Mantén el control mensual', 'Evalúa nuevas suscripciones cuidadosamente']
      });
    }
    
    return recomendaciones;
  };

  const recomendaciones = generarRecomendaciones();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Repeat className="w-8 h-8 text-indigo-300" />
            <div>
              <h2 className="text-2xl font-bold text-white">Optimización de Suscripciones</h2>
              <p className="text-indigo-200 text-sm">Ahorra dinero en tus servicios recurrentes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Resumen General */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Total Mensual</div>
              <div className="text-white text-2xl font-bold">${Math.round(totalMensual)}</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Total Anual</div>
              <div className="text-white text-2xl font-bold">${Math.round(totalAnual)}</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">% Ingresos</div>
              <div className={`text-2xl font-bold ${
                porcentajeIngresos > 15 ? 'text-red-400' : 
                porcentajeIngresos > 10 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {porcentajeIngresos.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm mb-1">Ahorro Potencial</div>
              <div className="text-green-400 text-2xl font-bold">${Math.round(ahorroPotencialTotal)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setView('analysis')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                view === 'analysis' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              📊 Análisis
            </button>
            <button
              onClick={() => setView('recommendations')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                view === 'recommendations' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              💡 Recomendaciones
            </button>
          </div>

          {/* Vista de Análisis */}
          {view === 'analysis' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Tus Suscripciones ({suscripcionesActivas.length})</h3>
              
              {suscripcionesAnalizadas.length === 0 ? (
                <div className="text-center py-8">
                  <Repeat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No tienes suscripciones activas</p>
                </div>
              ) : (
                <>
                  {/* Alta Prioridad */}
                  {suscripcionesAltas.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h4 className="text-white font-semibold">Alta Prioridad</h4>
                        <span className="text-red-400 text-sm">({suscripcionesAltas.length})</span>
                      </div>
                      {suscripcionesAltas.map(sub => (
                        <SuscripcionCard key={sub.id} suscripcion={sub} />
                      ))}
                    </div>
                  )}

                  {/* Media Prioridad */}
                  {suscripcionesMedias.length > 0 && (
                    <div className="space-y-2 mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-yellow-400" />
                        <h4 className="text-white font-semibold">Media Prioridad</h4>
                        <span className="text-yellow-400 text-sm">({suscripcionesMedias.length})</span>
                      </div>
                      {suscripcionesMedias.map(sub => (
                        <SuscripcionCard key={sub.id} suscripcion={sub} />
                      ))}
                    </div>
                  )}

                  {/* Baja Prioridad */}
                  {suscripcionesAnalizadas.filter(s => s.prioridad === 'low').length > 0 && (
                    <div className="space-y-2 mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <h4 className="text-white font-semibold">Baja Prioridad</h4>
                        <span className="text-green-400 text-sm">
                          ({suscripcionesAnalizadas.filter(s => s.prioridad === 'low').length})
                        </span>
                      </div>
                      {suscripcionesAnalizadas
                        .filter(s => s.prioridad === 'low')
                        .map(sub => (
                          <SuscripcionCard key={sub.id} suscripcion={sub} />
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Vista de Recomendaciones */}
          {view === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Plan de Optimización</h3>
              
              {recomendaciones.map((rec, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-5 border ${
                    rec.icon === '🚨' ? 'bg-red-500/10 border-red-500/30' :
                    rec.icon === '⚠️' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    rec.icon === '💰' ? 'bg-green-500/10 border-green-500/30' :
                    rec.icon === '✨' ? 'bg-purple-500/10 border-purple-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
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
                          {rec.actions.slice(0, 3).map((action, i) => (
                            <div key={i} className="text-indigo-300 text-sm flex items-start gap-2">
                              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </div>
                          ))}
                          {rec.actions.length > 3 && (
                            <div className="text-gray-400 text-sm ml-6">
                              +{rec.actions.length - 3} más...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Resumen de Ahorro Total */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-400/30 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-xl mb-1">Ahorro Potencial Total</h4>
                    <p className="text-green-300">Si implementas todas las recomendaciones</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-3xl font-bold">${Math.round(ahorroPotencialTotal)}/mes</div>
                    <div className="text-green-300 text-lg">${Math.round(ahorroPotencialTotal * 12)}/año</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de suscripción
function SuscripcionCard({ suscripcion }) {
  return (
    <div className={`bg-white/5 rounded-xl p-4 border-l-4 ${
      suscripcion.prioridad === 'high' ? 'border-red-500' :
      suscripcion.prioridad === 'medium' ? 'border-yellow-500' :
      'border-green-500'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-white font-semibold">{suscripcion.servicio}</h5>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-sm">{suscripcion.categoria}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm">{suscripcion.ciclo}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">${suscripcion.costoMensual}/mes</div>
          {suscripcion.ciclo !== 'Mensual' && (
            <div className="text-gray-400 text-xs">(${suscripcion.costoOriginal}/{suscripcion.ciclo})</div>
          )}
        </div>
      </div>

      {suscripcion.razon && (
        <div className={`text-sm p-2 rounded mt-2 ${
          suscripcion.prioridad === 'high' ? 'bg-red-500/10 text-red-300' :
          suscripcion.prioridad === 'medium' ? 'bg-yellow-500/10 text-yellow-300' :
          'bg-blue-500/10 text-blue-300'
        }`}>
          {suscripcion.razon}
        </div>
      )}

      {suscripcion.recomendacion && (
        <div className="flex items-start gap-2 mt-2 text-sm text-indigo-300">
          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{suscripcion.recomendacion}</span>
        </div>
      )}

      {suscripcion.ahorroPotencial > 0 && (
        <div className="mt-2 bg-green-500/10 text-green-300 text-sm px-3 py-1 rounded-full inline-block">
          Ahorro potencial: ${Math.round(suscripcion.ahorroPotencial)}/mes
        </div>
      )}
    </div>
  );
}