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

  // ===============================
  // 🔢 CÁLCULOS BASE
  // ===============================
  const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalGastosFijos = gastosFijos.reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalGastosVariables = gastosVariables.reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((s, g) => s + Number(g.monto || 0), 0);

  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;
  const saldo = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? saldo / totalIngresos : 0;

  // ===============================
  // 🧠 ANÁLISIS LOCAL (SIN IA)
  // ===============================
  const generarAnalisisLocal = useCallback(() => {
    const recomendaciones = [];
    const alertas = [];
    let resumen = '';

    if (totalIngresos === 0) {
      resumen = 'No se han registrado ingresos en este período.';
    } else if (saldo < 0) {
      resumen = 'Estás gastando más de lo que ingresas este mes.';
      alertas.push('Tu saldo es negativo. Revisa tus gastos urgentemente.');
    } else {
      resumen = 'Tus finanzas están bajo control este mes.';
    }

    if (tasaAhorro < 0.1 && totalIngresos > 0) {
      recomendaciones.push({
        prioridad: 'alta',
        titulo: 'Aumentar tasa de ahorro',
        descripcion: 'Tu ahorro es menor al 10% de tus ingresos. Considera reducir gastos variables.',
      });
    }

    if (totalGastosFijos > totalIngresos * 0.6) {
      recomendaciones.push({
        prioridad: 'media',
        titulo: 'Gastos fijos elevados',
        descripcion: 'Tus gastos fijos superan el 60% de tus ingresos.',
      });
    }

    if (suscripciones.filter(s => s.estado === 'Activo').length > 5) {
      recomendaciones.push({
        prioridad: 'baja',
        titulo: 'Muchas suscripciones activas',
        descripcion: 'Evalúa cancelar las que no uses.',
      });
    }

    if (deudas.length > 0) {
      recomendaciones.push({
        prioridad: 'urgente',
        titulo: 'Deudas activas',
        descripcion: 'Prioriza el pago de deudas para reducir intereses.',
      });
    }

    return { resumen, recomendaciones, alertas };
  }, [
    totalIngresos,
    totalGastosFijos,
    saldo,
    tasaAhorro,
    suscripciones,
    deudas
  ]);

  // ===============================
  // 🚀 EJECUTAR ANÁLISIS
  // ===============================
  const analizarFinanzas = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setAnalisis(generarAnalisisLocal());
      setLoading(false);
    }, 500);
  }, [generarAnalisisLocal]);

  useEffect(() => {
    if (ingresos.length || gastosFijos.length || gastosVariables.length) {
      analizarFinanzas();
    }
  }, [ingresos.length, gastosFijos.length, gastosVariables.length, analizarFinanzas]);

  // ===============================
  // 🎨 UI HELPERS
  // ===============================
  const getPrioridadColor = (p) =>
    p === 'urgente' ? 'bg-red-500'
    : p === 'alta' ? 'bg-orange-500'
    : p === 'media' ? 'bg-yellow-500'
    : 'bg-green-500';

  const getPrioridadIcon = (p) =>
    p === 'urgente' ? <AlertTriangle className="w-5 h-5" />
    : p === 'alta' ? <TrendingUp className="w-5 h-5" />
    : <CheckCircle className="w-5 h-5" />;

  // ===============================
  // 🖥️ RENDER
  // ===============================
  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">🤖 Asistente Financiero</h2>
            <p className="text-purple-200 text-sm">Análisis local (sin IA)</p>
          </div>
        </div>

        <button
          onClick={analizarFinanzas}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? 'Analizando...' : 'Actualizar'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-purple-200">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-2" />
          Analizando tus finanzas...
        </div>
      )}

      {analisis && !loading && (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-1">Resumen del Mes</h3>
            <p className="text-purple-100 text-sm">{analisis.resumen}</p>
          </div>

          {analisis.recomendaciones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">💡 Recomendaciones</h3>
              {analisis.recomendaciones.map((r, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 flex gap-3">
                  <div className={`${getPrioridadColor(r.prioridad)} p-2 rounded-lg`}>
                    {getPrioridadIcon(r.prioridad)}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{r.titulo}</h4>
                    <p className="text-purple-100 text-sm">{r.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analisis.alertas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold">⚠️ Alertas</h3>
              {analisis.alertas.map((a, i) => (
                <div key={i} className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg">
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!analisis && !loading && (
        <div className="text-center py-8 text-purple-200">
          Agrega ingresos o gastos para iniciar el análisis.
        </div>
      )}
    </div>
  );
}
