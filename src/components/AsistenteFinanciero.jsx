import { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

export default function AsistenteFinanciero({ 
  ingresos = [], 
  gastosFijos = [], 
  gastosVariables = [], 
  suscripciones = [], 
  deudas = [] 
}) {
  const [analisis, setAnalisis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analizarFinanzas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const datosFinancieros = {
        ingresos,
        gastosFijos,
        gastosVariables,
        suscripciones: suscripciones.filter(s => s.estado === 'Activo'),
        deudas,
        fecha: new Date().toISOString()
      };

      const response = await fetch('https://ocr-backend-i9qy.onrender.com/analizar-finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosFinancieros)
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setAnalisis(data);
    } catch (error) {
      console.error('Error analizando finanzas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas]);

  useEffect(() => {
    if (ingresos.length > 0 || gastosFijos.length > 0 || gastosVariables.length > 0) {
      analizarFinanzas();
    }
  }, [ingresos.length, gastosFijos.length, gastosVariables.length, analizarFinanzas]);

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baja': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getPrioridadIcon = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return <AlertTriangle className="w-5 h-5" />;
      case 'alta': return <TrendingUp className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">
              🤖 Asistente Financiero IA
            </h2>
            <p className="text-purple-200 text-sm">
              Análisis inteligente de tus finanzas
            </p>
          </div>
        </div>
        <button
          onClick={analizarFinanzas}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Actualizar
            </>
          )}
        </button>
      </div>

      {loading && !analisis && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 animate-spin text-purple-300 mx-auto mb-4" />
          <p className="text-purple-200">Analizando tus finanzas con IA...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {analisis && !loading && (
        <div className="space-y-4">
          {analisis.resumen && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Resumen del Mes
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed">
                {analisis.resumen}
              </p>
            </div>
          )}

          {analisis.recomendaciones && analisis.recomendaciones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                💡 Recomendaciones Personalizadas
              </h3>
              {analisis.recomendaciones.map((rec, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur rounded-xl p-4 border-l-4"
                  style={{ borderColor: getPrioridadColor(rec.prioridad).replace('bg-', '#') }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${getPrioridadColor(rec.prioridad)} p-2 rounded-lg`}>
                      {getPrioridadIcon(rec.prioridad)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">
                        {rec.titulo}
                      </h4>
                      <p className="text-purple-100 text-sm mb-2">
                        {rec.descripcion}
                      </p>
                      {rec.monto && (
                        <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          ${rec.monto.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analisis.alertas && analisis.alertas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                ⚠️ Alertas Importantes
              </h3>
              {analisis.alertas.map((alerta, index) => (
                <div
                  key={index}
                  className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg flex items-start gap-2"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{alerta}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-purple-300 text-xs text-right">
            Última actualización: {new Date().toLocaleString('es-ES')}
          </p>
        </div>
      )}

      {!analisis && !loading && !error && (
        <div className="text-center py-8">
          <Brain className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
          <p className="text-purple-200">
            Agrega algunos ingresos o gastos para que pueda analizar tus finanzas
          </p>
        </div>
      )}
    </div>
  );
}
