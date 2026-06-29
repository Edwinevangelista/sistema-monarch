// src/components/AsistenteFinancieroV2.jsx
// 💎 FinGuide AI - Tu Asesor Financiero Personal Inteligente (V5 - Visual para Usuarios Promedio)
// Visual Impactante | Gráficas | Sin Números Abrumadores | Mobile-First

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { calcularFinancialHealthScore } from "../utils/financialCalculations";
import {
  Brain, CheckCircle2, Zap, X,
  Calendar, AlertTriangle,
  Shield, PiggyBank, CreditCard,
  Trash2, TrendingDown,
  ChevronRight, ChevronDown, ChevronUp, Play,
  Sparkles, HeartPulse, Eye, EyeOff, Activity,
  Flame, Droplets, Leaf
} from "lucide-react";

// --- CONSTANTES ---
const formatMoney = (v) => `$${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const formatPct = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;

const PROMEDIOS_NACIONALES = {
  tasaAhorro: 0.15,
  ratioGastosFijos: 0.50,
  ratioGastosVariables: 0.30,
  numeroSuscripciones: 4,
  costoPromedioSuscripcion: 120
};

const normalizarTasaAhorro = (value) => {
  const n = Number(value) || 0
  return Math.abs(n) > 1 ? n / 100 : n
}

// 🎭 ARQUETIPOS FINANCIEROS
const ARQUETIPOS = {
  VISIONARIO: { 
    nombre: "El Visionario", 
    emoji: "🚀",
    color: "from-emerald-500 to-teal-600", 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    tono: "assertive",
    mensaje: "Tu estructura financiera es sólida. El dinero debe trabajar para ti, no al revés. Optimicemos inversiones.",
    min: 85
  },
  CONSTRUCTOR: { 
    nombre: "El Constructor", 
    emoji: "🏗️",
    color: "from-blue-500 to-indigo-600", 
    bg: "bg-blue-500/10", 
    text: "text-blue-400",
    border: "border-blue-500/30",
    tono: "encouraging",
    mensaje: "Vas por buen camino. Tienes el potencial de acelerar tu patrimonio. Enfoquémonos en reducir pasivos.",
    min: 60
  },
  DEFENSOR: { 
    nombre: "El Defensor", 
    emoji: "🛡️",
    color: "from-amber-500 to-orange-600", 
    bg: "bg-amber-500/10", 
    text: "text-amber-400",
    border: "border-amber-500/30",
    tono: "cautious",
    mensaje: "Estás en zona de estabilidad frágil. Un imprevisto podría romper tu balance. Necesitamos blindarte.",
    min: 40
  },
  CRISIS: { 
    nombre: "Modo Crisis", 
    emoji: "🚨",
    color: "from-rose-500 to-red-600", 
    bg: "bg-rose-500/10", 
    text: "text-rose-400",
    border: "border-rose-500/30",
    tono: "urgent",
    mensaje: "Tu flujo de caja es negativo. Recortar 'gastos hormiga' no es suficiente. Necesitamos un plan de choque inmediato.",
    min: 0
  }
};

// 🎯 OBJETIVOS FINANCIEROS
const OBJETIVOS = [
  { 
    key: "diagnostico", 
    label: "Visión Completa", 
    emoji: "📊",
    color: "from-violet-500/20 to-indigo-500/20 border-violet-500/30",
    activeColor: "bg-gradient-to-r from-violet-600 to-indigo-600",
    descripcion: "Diagnóstico profundo de tu salud financiera",
    icono: Activity
  },
  { 
    key: "controlar_gastos", 
    label: "Control de Gastos", 
    emoji: "💸",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    activeColor: "bg-gradient-to-r from-orange-600 to-red-600",
    descripcion: "Detener la fuga de dinero con números reales",
    icono: TrendingDown
  },
  { 
    key: "ahorrar_mas", 
    label: "Aumentar Ahorro", 
    emoji: "💰",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    activeColor: "bg-gradient-to-r from-emerald-600 to-teal-600",
    descripcion: "Estrategias probadas para acumular capital",
    icono: PiggyBank
  },
  { 
    key: "pagar_deudas", 
    label: "Eliminar Deudas", 
    emoji: "💳",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
    activeColor: "bg-gradient-to-r from-red-600 to-rose-600",
    descripcion: "Plan matemático para salir de deudas",
    icono: AlertTriangle
  },
  { 
    key: "optimizar_subs", 
    label: "Optimizar Gastos", 
    emoji: "✂️",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    activeColor: "bg-gradient-to-r from-amber-600 to-yellow-600",
    descripcion: "Elimina suscripciones ocultas y gastos innecesarios",
    icono: Zap
  },
];

// Patrones de fugas (Palabras clave en español)
const PATRONES_FUGAS = [
  { keywords: ['café', 'coffee', 'starbucks', 'cafetería', 'cappuccino'], emoji: '☕', nombre: 'Cafés', solucion: 'Compra en presentación grande o haz café en casa', ahorroEstimado: 0.70 },
  { keywords: ['uber', 'didi', 'cabify', 'taxi'], emoji: '🚗', nombre: 'Apps de Transporte', solucion: 'Usa transporte público o camina < 15 min', ahorroEstimado: 0.60 },
  { keywords: ['restaurante', 'comida', 'rappi', 'uber eats', 'delivery', 'pedidos'], emoji: '🍔', nombre: 'Delivery/Comida Fuera', solucion: 'Prepara tu comida (Meal Prep)', ahorroEstimado: 0.60 },
  { keywords: ['netflix', 'spotify', 'amazon prime', 'hbo', 'disney', 'youtube'], emoji: '📺', nombre: 'Streaming', solucion: 'Comparte cuenta o cancela la que menos uses', ahorroEstimado: 0.50 },
  { keywords: ['gym', 'gimnasio', 'fitness', 'crossfit'], emoji: '💪', nombre: 'Gimnasio', solucion: 'Rutinas en casa o correr al aire libre', ahorroEstimado: 0.100 },
  { keywords: ['tienda', 'oxxo', 'seven', 'abarrotes', 'snack', 'dulce'], emoji: '🍫', nombre: 'Antojitos/Snacks', solucion: 'Compra al mayoreo una vez al mes', ahorroEstimado: 0.40 }
];

// --- COMPONENTE PRINCIPAL ---
export default function AsistenteFinancieroV2({
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
  dashboardKpis = null,
  calculosReales = null,
  calculosProyectados = null,
  onOpenDebtPlanner,
  onOpenSavingsPlanner,
  onOpenSpendingControl,
  showLocalNotification,
}) {
  const [loading, setLoading] = useState(false);
  const [showSelectorObjetivos, setShowSelectorObjetivos] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [objetivoActual, setObjetivoActual] = useState(() => {
    const saved = localStorage.getItem('finGuideObjetivo');
    return saved || 'diagnostico';
  });
  const [pilotoAutomatico] = useState(() => {
    const saved = localStorage.getItem('finGuidePiloto');
    return saved ? JSON.parse(saved) : false;
  });
  const [ultimoAnalisis, setUltimoAnalisis] = useState(null);
  const [showAnalysisAnimation, setShowAnalysisAnimation] = useState(false);
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);
  const [vistaIA, setVistaIA] = useState('real'); 

  const analysisTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('finGuideObjetivo', objetivoActual);
  }, [objetivoActual]);

  useEffect(() => {
    localStorage.setItem('finGuidePiloto', JSON.stringify(pilotoAutomatico));
  }, [pilotoAutomatico]);

  // --- ✅ MOTOR DE INTELIGENCIA V4 ---
  const analisis = useMemo(() => {
    let totalIngresos, totalGastosFijos, totalGastosVariables, totalSuscripciones;
    let totalDeudas, gastosTotales, disponible, tasaAhorro;
    
    const datosCalculo = vistaIA === 'real' ? calculosReales : calculosProyectados;
    
    if (dashboardKpis && datosCalculo) {
      totalIngresos = datosCalculo.totalIngresos || 0;
      totalGastosFijos = datosCalculo.gastosFijos || 0;
      totalGastosVariables = datosCalculo.gastosVariables || 0;
      totalSuscripciones = datosCalculo.suscripciones || 0;
      totalDeudas = dashboardKpis.totalDeudas || 0;
      gastosTotales = datosCalculo.totalGastos || 0;
      disponible = datosCalculo.saldo || 0;
      tasaAhorro = normalizarTasaAhorro(datosCalculo.tasaAhorro);
    } else {
      totalIngresos = ingresos.reduce((sum, i) => sum + Number(i.monto || 0), 0);
      totalGastosFijos = gastosFijos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
      totalGastosVariables = gastosVariables.reduce((sum, g) => sum + Number(g.monto || 0), 0);
      totalSuscripciones = suscripciones
        .filter(s => s.estado === 'Activo')
        .reduce((sum, s) => sum + Number(s.costo || 0), 0);
      totalDeudas = deudas.reduce((sum, d) => sum + Number(d.saldo || 0), 0);
      gastosTotales = totalGastosFijos + totalGastosVariables + totalSuscripciones;
      disponible = totalIngresos - gastosTotales;
      tasaAhorro = totalIngresos > 0 ? (disponible / totalIngresos) : 0;
    }

    // SCORE DE SALUD — misma fórmula centralizada que usa el dashboard,
    // para que ambos muestren siempre el mismo número.
    let scoreHealth = calcularFinancialHealthScore({
      totalIngresos,
      totalGastosReales: gastosTotales,
      totalGastosFijos,
      totalSuscripciones,
      deudas,
    });

    // Ajuste de inicio de mes: evita mostrar un score castigado cuando aún
    // no han llegado los ingresos recurrentes del mes (vista "real" temprana).
    if (vistaIA === 'real' && datosCalculo) {
      const hoy = new Date();
      const diaDelMes = hoy.getDate();
      const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      if ((diaDelMes / diasEnMes) < 0.15 && totalIngresos < 100 && calculosProyectados) {
        const ingresosProyectados = calculosProyectados.totalIngresos || 0;
        if (ingresosProyectados > totalIngresos * 3) scoreHealth = Math.max(scoreHealth, 45);
      }
    }

    scoreHealth = Math.max(0, Math.min(100, scoreHealth));
    const ratioGastos = totalIngresos > 0 ? (gastosTotales / totalIngresos) : 1;

    let arquetipo;
    if (scoreHealth >= ARQUETIPOS.VISIONARIO.min) arquetipo = ARQUETIPOS.VISIONARIO;
    else if (scoreHealth >= ARQUETIPOS.CONSTRUCTOR.min) arquetipo = ARQUETIPOS.CONSTRUCTOR;
    else if (scoreHealth >= ARQUETIPOS.DEFENSOR.min) arquetipo = ARQUETIPOS.DEFENSOR;
    else arquetipo = ARQUETIPOS.CRISIS;

    let mensajeContextual = arquetipo.mensaje;
    if (vistaIA === 'real' && calculosProyectados && disponible < 0) {
      const saldoProyectado = calculosProyectados.saldo || 0;
      if (saldoProyectado > 0) {
        mensajeContextual = `Hoy estás en números rojos (${formatMoney(disponible)}), pero con tus ingresos esperados cerrarás positivo. Mantén la calma.`;
      }
    }

    // COMPARACIÓN
    const vsPromedio = {
      ahorro: totalIngresos > 0 ? ((tasaAhorro - PROMEDIOS_NACIONALES.tasaAhorro) / PROMEDIOS_NACIONALES.tasaAhorro) * 100 : 0,
      gastosFijos: totalIngresos > 0 ? ((totalGastosFijos / totalIngresos) - PROMEDIOS_NACIONALES.ratioGastosFijos) / PROMEDIOS_NACIONALES.ratioGastosFijos * 100 : 0,
      suscripciones: ((suscripciones.filter(s => s.estado === 'Activo').length - PROMEDIOS_NACIONALES.numeroSuscripciones) / PROMEDIOS_NACIONALES.numeroSuscripciones) * 100
    };

    const baseProyeccion = calculosProyectados || { totalIngresos, totalGastos: gastosTotales, saldo: disponible };
    const prediccion3Meses = {
      ingresos: (baseProyeccion.totalIngresos || totalIngresos) * 3,
      gastos: (baseProyeccion.totalGastos || gastosTotales) * 3,
      ahorro: (baseProyeccion.saldo || disponible) * 3,
      deudaRestante: Math.max(0, totalDeudas - ((baseProyeccion.saldo || disponible) * 0.3 * 3))
    };

    let mesesLibertad = 0;
    let fechaLibertad = null;
    const capacidadPago = Math.max(0, disponible * 0.5);
    if (totalDeudas > 0) {
      if (capacidadPago > 0) {
        mesesLibertad = Math.ceil(totalDeudas / capacidadPago);
        const hoy = new Date();
        fechaLibertad = new Date(hoy.setMonth(hoy.getMonth() + mesesLibertad));
      } else mesesLibertad = 999;
    } else {
      mesesLibertad = 0;
      fechaLibertad = new Date();
    }

    // DETECTOR DE FUGAS (Lógica Realista)
    const fugasDetectadas = [];
    PATRONES_FUGAS.forEach(patron => {
      const gastosRelacionados = gastosVariables.filter(gasto => {
        const descripcion = (gasto.descripcion || gasto.categoria || '').toLowerCase();
        return patron.keywords.some(keyword => descripcion.includes(keyword));
      });

      if (gastosRelacionados.length > 0) {
        const totalGastado = gastosRelacionados.reduce((sum, g) => sum + Number(g.monto || 0), 0);
        const frecuencia = gastosRelacionados.length;
        const ahorroEstimado = totalGastado * patron.ahorroEstimado;
        
        if (totalGastado > 200 || frecuencia > 4) {
          fugasDetectadas.push({
            tipo: patron.nombre,
            emoji: patron.emoji,
            gastoActual: totalGastado,
            frecuencia,
            solucion: patron.solucion,
            ahorroEstimado,
            ahorroAnual: ahorroEstimado * 12,
            prioridad: totalGastado > 1000 ? 'alta' : totalGastado > 500 ? 'media' : 'baja'
          });
        }
      }
    });

    const totalFugasAhorro = fugasDetectadas.reduce((sum, f) => sum + f.ahorroEstimado, 0);

    // CALENDARIO
    const hoy = new Date();
    const eventosFinancieros = [];
    gastosFijos.forEach(gasto => {
      const diaVencimiento = gasto.dia_venc || gasto.diaVencimiento || 1;
      const proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaVencimiento);
      if (proximaFecha < hoy) proximaFecha.setMonth(proximaFecha.getMonth() + 1);
      
      eventosFinancieros.push({
        fecha: proximaFecha,
        tipo: 'gasto_fijo',
        descripcion: gasto.nombre || gasto.categoria || 'Gasto fijo',
        monto: Number(gasto.monto || 0),
        estado: gasto.estado === 'Pagado' ? 'pagado' : disponible >= Number(gasto.monto || 0) ? 'ok' : 'alerta',
        icono: '💳'
      });
    });

    suscripciones.filter(s => s.estado === 'Activo').forEach(sub => {
      if (!sub.proximo_pago) return;
      const proximaFecha = new Date(sub.proximo_pago + 'T00:00:00');
      eventosFinancieros.push({
        fecha: proximaFecha,
        tipo: 'suscripcion',
        descripcion: sub.servicio || 'Suscripción',
        monto: Number(sub.costo || 0),
        estado: 'info',
        icono: '🔄'
      });
    });
    eventosFinancieros.sort((a, b) => a.fecha - b.fecha);

    const mesesSinIngreso = gastosTotales > 0 ? (disponible / gastosTotales) : 0;
    const requisitoLibertad = {
      fondoEmergencia: mesesSinIngreso >= 6,
      sinDeudas: totalDeudas === 0,
      tasaAhorroSana: tasaAhorro >= 0.20,
      ingresoPasivo: false
    };
    const indiceFinal = (Object.values(requisitoLibertad).filter(Boolean).length / 4) * 100;

    const suscripcionesOptimizables = suscripciones
      .filter(s => s.estado === 'Activo')
      .map(s => {
        const costo = Number(s.costo || 0);
        let razonOptimizar = null;
        let prioridad = 0;
        
        if (costo > 200) { razonOptimizar = `Costo alto (>${formatMoney(200)})`; prioridad = 3; }
        else if (s.servicio?.toLowerCase().includes('premium') && costo > 100) { razonOptimizar = 'Downgrade posible'; prioridad = 2; }
        else if (costo < 50 && totalSuscripciones > 300) { razonOptimizar = 'Micro-gasto acumulativo'; prioridad = 1; }
        
        return razonOptimizar ? { ...s, razonOptimizar, prioridad, ahorroAnual: costo * 12 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.prioridad - a.prioridad);

    const ahorroTotalOptimizable = suscripcionesOptimizables.reduce((sum, s) => sum + Number(s.costo || 0), 0);

    // GENERACIÓN DE RECOMENDACIONES CON LÓGICA REAL
    const recomendaciones = generarRecomendacionesPorObjetivo({
      objetivoActual,
      kpis: {
        totalIngresos,
        totalGastosFijos,
        totalGastosVariables,
        totalSuscripciones,
        totalDeudas,
        gastosTotales,
        disponible,
        tasaAhorro,
        scoreHealth,
        ratioGastos // Pasado para lógica interna
      },
      fugasDetectadas,
      totalFugasAhorro,
      suscripcionesOptimizables,
      ahorroTotalOptimizable,
      deudas,
      arquetipo,
      vistaIA,
      calculosProyectados
    });

    const estrategia = generarEstrategiaMaestra({
      arquetipo,
      kpis: { totalIngresos, totalDeudas, disponible, tasaAhorro },
      mesesLibertad,
      totalFugasAhorro
    });

    return {
      kpis: {
        totalIngresos,
        totalGastosFijos,
        totalGastosVariables,
        totalSuscripciones,
        totalDeudas,
        gastosTotales,
        disponible,
        tasaAhorro,
        scoreHealth
      },
      arquetipo,
      mensajeContextual,
      vsPromedio,
      prediccion3Meses,
      prediccionLibertad: { mesesLibertad, fechaLibertad, capacidadPago },
      fugasDetectadas,
      totalFugasAhorro,
      eventosFinancieros: eventosFinancieros.slice(0, 10),
      indiceLibertas: indiceFinal,
      requisitoLibertad,
      suscripcionesOptimizables,
      ahorroTotalOptimizable,
      recomendaciones,
      estrategia
    };
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas, objetivoActual, dashboardKpis, calculosReales, calculosProyectados, vistaIA]);

  const { 
    kpis, arquetipo, mensajeContextual, prediccion3Meses, prediccionLibertad,
    fugasDetectadas, totalFugasAhorro, eventosFinancieros, 
    requisitoLibertad, suscripcionesOptimizables, 
    ahorroTotalOptimizable, recomendaciones, estrategia 
  } = analisis;

  const analizar = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    setLoading(true);
    setShowAnalysisAnimation(true);
    
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    
    analysisTimeoutRef.current = setTimeout(() => {
      setUltimoAnalisis(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      if (showLocalNotification) showLocalNotification(`✨ Análisis actualizado`, 'success');
      setLoading(false);
      setTimeout(() => setShowAnalysisAnimation(false), 500);
    }, 800); // Un poco más lento para apreciar la animación
  }, [showLocalNotification]); 

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && (ingresos.length || gastosFijos.length || gastosVariables.length)) {
      hasInitialized.current = true;
      const timer = setTimeout(() => setUltimoAnalisis(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })), 500);
      return () => clearTimeout(timer);
    }
  }, [ingresos.length, gastosFijos.length, gastosVariables.length]);

  const objetivoConfig = OBJETIVOS.find(o => o.key === objetivoActual) || OBJETIVOS[0];
  const usandoDashboard = !!dashboardKpis;

  if (ingresos.length === 0 && gastosFijos.length === 0 && gastosVariables.length === 0 && !dashboardKpis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <Brain className="w-full h-full text-purple-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">FinGuide AI</h2>
          <p className="text-purple-300/70">Tu asesor financiero está listo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white relative pb-6">

      {/* FONDO DINÁMICO */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        
        {/* 1. HEADER INTELIGENTE */}
        <div className={`relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 shadow-2xl`}>
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${arquetipo.color} opacity-10 rounded-full blur-3xl`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                  FinGuide AI
                </span>
                <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                {usandoDashboard && (
                  <button
                    onClick={() => setVistaIA(prev => prev === 'real' ? 'proyectado' : 'real')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border ${
                      vistaIA === 'real' 
                        ? 'bg-white/20 text-white border-white/20' 
                        : 'bg-transparent text-white/40 border-transparent hover:bg-white/5'
                    }`}
                  >
                    {vistaIA === 'real' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {vistaIA === 'real' ? 'Real' : 'Proy.'}
                  </button>
                )}
                {pilotoAutomatico && (
                  <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/20 text-green-400 flex items-center gap-1 border border-green-500/20">
                    <Zap className="w-3 h-3" />
                    Piloto
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-5xl mb-3 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{arquetipo.emoji}</div>
                <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                  {arquetipo.nombre}
                </h2>
                <p className="text-gray-300 text-sm font-medium leading-relaxed max-w-md">
                  {mensajeContextual}
                </p>
              </div>
              
              <div className="text-right hidden sm:block">
                <div className="text-6xl font-black text-white/5 relative select-none">
                  {kpis.scoreHealth}
                  <div className="absolute -bottom-2 right-0 text-xs text-white/20 font-normal">/ 100</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSelectorObjetivos(true)}
              className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-xl border border-white/10">
                  {objetivoConfig.emoji}
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Objetivo Activo</div>
                  <div className="text-white font-semibold text-sm">{objetivoConfig.label}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* 2. TARJETA VISUAL DINERO — ingresos / gastos / disponible */}
        <TarjetaFlujoDinero kpis={kpis} />

        {/* 3. LIBERTAD FINANCIERA VISUAL */}
        {prediccionLibertad.mesesLibertad > 0 && kpis.totalDeudas > 0 && (
          <TarjetaLibertad prediccionLibertad={prediccionLibertad} kpis={kpis} />
        )}

        {/* 4. CONTENIDO DINÁMICO */}
        <ContenidoPorObjetivo 
          objetivo={objetivoActual}
          kpis={kpis}
          recomendaciones={recomendaciones}
          deudas={deudas}
          fugasDetectadas={fugasDetectadas}
          totalFugasAhorro={totalFugasAhorro}
          eventosFinancieros={eventosFinancieros}
          indiceLibertas={analisis.indiceLibertas}
          requisitoLibertad={requisitoLibertad}
          prediccion3Meses={prediccion3Meses}
          suscripcionesOptimizables={suscripcionesOptimizables}
          onOpenDebtPlanner={onOpenDebtPlanner}
          onOpenSavingsPlanner={onOpenSavingsPlanner}
          onOpenSpendingControl={onOpenSpendingControl}
          onOpenOptimizer={() => setShowOptimizer(true)}
        />

        {/* 5. PLAN MAESTRO */}
        {estrategia.length > 0 && (
          <div className={`rounded-2xl border ${arquetipo.bg} ${arquetipo.border} overflow-hidden bg-slate-900/40 backdrop-blur-sm`}>
            <button
              onClick={() => setExpandedAdvanced(!expandedAdvanced)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${arquetipo.text}`} />
                <h4 className="font-bold text-white text-sm">Plan Maestro</h4>
              </div>
              {expandedAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
            </button>
            
            {expandedAdvanced && (
              <div className="p-4 pt-0 space-y-3">
                {estrategia.map((step, idx) => (
                  <div key={idx} className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className={`text-sm font-bold ${arquetipo.text}`}>{step.titulo}</h5>
                      {step.tipo === 'critico' && <AlertTriangle className="w-4 h-4 text-red-400"/>}
                    </div>
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">{step.descripcion}</p>
                    {step.accion && (
                      <button 
                        onClick={step.accion}
                        className={`w-full py-2 rounded-lg ${arquetipo.bg} hover:bg-white/10 border ${arquetipo.border} text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95`}
                      >
                        <Play className="w-3 h-3" fill="currentColor" />
                        {step.botonTexto}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón re-analizar — compacto e integrado */}
      <button
        onClick={analizar}
        disabled={loading}
        className={`
          relative flex items-center justify-center gap-2 mx-auto mt-3 px-5 py-2.5 rounded-2xl
          bg-white/8 hover:bg-white/12 border border-white/15
          text-white/80 hover:text-white
          transition-all duration-200 disabled:opacity-40
          ${loading ? 'scale-[1.01]' : 'active:scale-[0.97]'}
          font-semibold text-sm touch-manipulation
        `}
      >
        <Brain className={`w-4 h-4 ${loading ? 'animate-bounce text-purple-400' : 'text-gray-400'}`} />
        <span>{loading ? 'Analizando...' : ultimoAnalisis ? 'Re-analizar' : 'Analizar finanzas'}</span>
        {ultimoAnalisis && !loading && (
          <span className="text-[10px] text-green-400 font-bold">✓ {ultimoAnalisis}</span>
        )}
      </button>

      {/* ✨ NUEVA ANIMACIÓN DE ANÁLISIS (VISUAL IMPACTANTE) */}
      {showAnalysisAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
          {/* Fondo con partículas */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-purple-500/50 rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
          </div>

          <div className="relative z-10 text-center space-y-6">
            {/* Contenedor fijo 200px para centrar perfectamente cerebro + círculos */}
            <div className="relative mx-auto flex items-center justify-center" style={{ width: '200px', height: '200px' }}>
              {/* Aura glow central */}
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl opacity-30 animate-ping" />
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />

              {/* Círculo orbital exterior — centrado con translate */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/15 rounded-full animate-[spin_15s_linear_infinite_reverse]"
                style={{ width: '196px', height: '196px' }} />
              {/* Círculo orbital interior — centrado con translate */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/30 rounded-full animate-[spin_10s_linear_infinite]"
                style={{ width: '152px', height: '152px' }} />

              {/* Cerebro — centrado naturalmente por flex */}
              <Brain className="w-20 h-20 text-white relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.9)] animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white tracking-wide">ANALIZANDO REALIDAD</p>
              <div className="h-1 w-64 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 w-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
              </div>
              <p className="text-sm text-purple-300/80 font-mono mt-2">
                {loading ? "Calculando proyecciones matemáticas..." : "Procesando completado"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      {showSelectorObjetivos && (
        <SelectorObjetivosModal
          objetivos={OBJETIVOS}
          objetivoActual={objetivoActual}
          kpis={kpis}
          onSelect={(key) => {
            setObjetivoActual(key);
            setShowSelectorObjetivos(false);
            if (key === 'pagar_deudas' && onOpenDebtPlanner) setTimeout(onOpenDebtPlanner, 100);
            else if (key === 'ahorrar_mas' && onOpenSavingsPlanner) setTimeout(onOpenSavingsPlanner, 100);
            else if (key === 'optimizar_subs') setTimeout(() => setShowOptimizer(true), 100);
            else if (key === 'controlar_gastos' && onOpenSpendingControl) setTimeout(onOpenSpendingControl, 100);
            if (showLocalNotification) {
              const obj = OBJETIVOS.find(o => o.key === key);
              showLocalNotification(`🎯 Objetivo: ${obj.label}`, 'success');
            }
          }}
          onClose={() => setShowSelectorObjetivos(false)}
        />
      )}

      {showOptimizer && (
        <OptimizadorSuscripcionesReal
          suscripciones={suscripciones}
          suscripcionesOptimizables={suscripcionesOptimizables}
          ahorroTotalOptimizable={ahorroTotalOptimizable}
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </div>
  );
}

// --- LÓGICA REALISTA ---
function generarRecomendacionesPorObjetivo(params) {
  const { objetivoActual, kpis, fugasDetectadas, suscripcionesOptimizables, ahorroTotalOptimizable, deudas, vistaIA, calculosProyectados } = params;
  const recomendaciones = [];

  // Contexto inteligente temporal
  if (vistaIA === 'real' && kpis.disponible < 0 && calculosProyectados && calculosProyectados.saldo > 0) {
    recomendaciones.push({
      titulo: '📅 Déficit Temporal (Inicio de Mes)',
      descripcion: `Tu balance actual es negativo (${formatMoney(kpis.disponible)}), pero con los ingresos esperados cerrarás el mes con ${formatMoney(calculosProyectados.saldo)}`,
      accion: 'Esperar a que lleguen tus ingresos principales',
      pasos: ['Revisa fechas de nómina', 'Evita gastos grandes hasta entonces']
    });
  }

  switch (objetivoActual) {
    case 'controlar_gastos':
      // ✅ Lógica Real: Si gastas más de lo que ganas
      if (kpis.disponible < 0) {
        const excesoMensual = Math.abs(kpis.disponible);
        const diasRestantes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
        const corteDiario = diasRestantes > 0 ? excesoMensual / diasRestantes : excesoMensual;
        
        recomendaciones.push({
          titulo: '🚨 Déficit Detectado: Acción Inmediata',
          descripcion: `Gastas ${formatMoney(excesoMensual)} más de lo que ingresas al mes.`,
          accion: `Debes cortar ${formatMoney(corteDiario)} diarios de gastos variables YA.`,
          pasos: [
            'Suspende compras no esenciales inmediatamente',
            `Si esDelivery, cancela pedidos por 1 semana`,
            'Evita salir los fines de semana'
          ]
        });
      }

      // ✅ Lógica Real: Fugas específicas
      if (fugasDetectadas.length > 0) {
        const fugaMayor = fugasDetectadas[0];
        recomendaciones.push({
          titulo: `💸 Fuga Principal: ${fugaMayor.tipo}`,
          descripcion: `Gastas ${formatMoney(fugaMayor.gastoActual)} al mes en esto.`,
          accion: `Si sigues el consejo: "${fugaMayor.solucion}", ahorras ${formatMoney(fugaMayor.ahorroEstimado)} al mes.`,
          pasos: [
            `Identifica tus gastos de ${fugaMayor.tipo} en el historial`,
            `Aplica la solución sugerida por 1 semana`,
            `Revisa el impacto el próximo lunes`
          ]
        });
      }
      break;

    case 'ahorrar_mas':
      if (kpis.tasaAhorro < 0.20 && kpis.totalIngresos > 0) {
        const metaAhorro = kpis.totalIngresos * 0.20;
        const diferencia = metaAhorro - kpis.disponible;
        recomendaciones.push({
          titulo: '💰 Meta Real de Ahorro',
          descripcion: `Tu ahorro actual es el ${formatPct(kpis.tasaAhorro)}. La meta sana es 20%.`,
          accion: diferencia > 0 
            ? `Necesitas ahorrar ${formatMoney(diferencia)} más mensualmente.` 
            : '¡Vas por buen camino! Superaste la meta.',
          pasos: [
            'Automatiza una transferencia a cuenta de ahorro el día de pago',
            'Trata el ahorro como un gasto fijo no negociable',
            'Busca reducir una suscripción activa'
          ]
        });
      }
      break;

    case 'pagar_deudas':
      if (kpis.totalDeudas > 0) {
        const pagoSugerido = Math.max(0, kpis.disponible * 0.5);
        const meses = pagoSugerido > 0 ? Math.ceil(kpis.totalDeudas / pagoSugerido) : 999;
        recomendaciones.push({
          titulo: '💳 Plan de Liquidación',
          descripcion: `Deuda total: ${formatMoney(kpis.totalDeudas)}.`,
          accion: pagoSugerido > 0 
            ? `Destina ${formatMoney(pagoSugerido)} extra al mes para pagarla en ${meses} meses.` 
            : 'No tienes margen libre para pagar deudas extra.',
          pasos: [
            'Método Bola de Nieve: Paga la más pequeña primero.',
            'O Método Avalancha: Paga la de mayor interés primero.',
            'No generes nueva deuda mientras pagas.'
          ]
        });
      }
      break;

    case 'optimizar_subs':
      if (ahorroTotalOptimizable > 0) {
        recomendaciones.push({
          titulo: '✂️ Optimización Rentable',
          descripcion: `${suscripcionesOptimizables.length} servicios pueden reducirse o cancelarse.`,
          accion: `Podrías recuperar ${formatMoney(ahorroTotalOptimizable)} mensuales.`,
          pasos: ['Revisa facturación de las últimas 4 semanas', 'Cancela lo que no hayas usado', 'Haz downgrade de planes Premium a Estándar']
        });
      }
      break;

    default:
      if (kpis.disponible < 0) {
        recomendaciones.push({
          titulo: '⚠️ Alerta de Flujo de Caja',
          descripcion: `Gastas más de lo que ingresas.`,
          accion: 'Abre "Control de Gastos" para ver dónde se va el dinero.',
          pasos: ['Revisa gastos fijos elevados', 'Elimina suscripciones ocultas', 'Ajusta estilo de vida']
        });
      }
      break;
  }
  
  void deudas;
  return recomendaciones;
}

function generarEstrategiaMaestra(params) {
  const { arquetipo, kpis, mesesLibertad, totalFugasAhorro } = params;
  const estrategia = [];

  if (arquetipo.nombre === 'Modo Crisis' && kpis.totalDeudas > 0) {
    estrategia.push({
      tipo: 'critico',
      titulo: 'Plan Choque',
      descripcion: 'Prioridad 1: Sobrevivir sin generar más deuda.',
      botonTexto: 'Congelar Gastos Variables',
      accion: null
    });
  } else if (arquetipo.nombre === 'El Constructor') {
    estrategia.push({
      tipo: 'acelerar',
      titulo: 'Acelerador de Deuda',
      descripcion: `Pagando el excedente puedes ser libre de deudas en ${mesesLibertad} meses.`,
      botonTexto: 'Simular Pagos',
      accion: null
    });
  } else if (arquetipo.nombre === 'El Visionario') {
    estrategia.push({
      tipo: 'crecimiento',
      titulo: 'Maximizar Rendimiento',
      descripcion: 'Tienes excedente de caja. El dinero quieto pierde valor.',
      botonTexto: 'Explorar Opciones',
      accion: null
    });
  }

  if (totalFugasAhorro > 500) {
    estrategia.push({
      tipo: 'optimizar',
      titulo: 'Tapar Fugas',
      descripcion: `Recuperar ${formatMoney(totalFugasAhorro)}/mes es como recibir un aumento de sueldo.`,
      botonTexto: 'Ver Oportunidades',
      accion: null
    });
  }

  return estrategia;
}

// --- COMPONENTES UI (Sin cambios funcionales, solo estilos) ---
function ContenidoPorObjetivo(props) {
  const { objetivo } = props;
  if (objetivo === 'diagnostico') return <DiagnosticoCompleto {...props} />;
  if (objetivo === 'controlar_gastos') return <ControlGastosView {...props} />;
  if (objetivo === 'ahorrar_mas') return <AhorroView {...props} />;
  if (objetivo === 'pagar_deudas') return <DeudasView {...props} />;
  if (objetivo === 'optimizar_subs') return <OptimizacionView {...props} />;
  return null;
}

function DiagnosticoCompleto({ kpis, recomendaciones, indiceLibertas, requisitoLibertad, prediccion3Meses, onOpenDebtPlanner, onOpenSavingsPlanner }) {
  const requisitosLabels = {
    fondoEmergencia: { label: 'Fondo de emergencia (6 meses)', emoji: '🛡️' },
    sinDeudas:       { label: 'Sin deudas', emoji: '✅' },
    tasaAhorroSana:  { label: 'Ahorro sano (≥20%)', emoji: '🐷' },
    ingresoPasivo:   { label: 'Ingreso pasivo', emoji: '💸' },
  }

  return (
    <div className="space-y-4">
      {/* Checklist de libertad — visual */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-white font-bold text-sm">Tu Salud Financiera</h4>
          </div>
          {/* Score visual */}
          <div className="flex items-center gap-1">
            <span className="text-lg font-black text-white">{indiceLibertas.toFixed(0)}</span>
            <span className="text-gray-500 text-xs">/100</span>
          </div>
        </div>

        {/* Barra de progreso segmentada */}
        <div className="h-3 bg-white/8 rounded-full overflow-hidden mb-3 flex">
          {[0, 25, 50, 75].map((seg, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-700 ${i > 0 ? 'border-l border-black/30' : ''} ${
                indiceLibertas >= (seg + 25) ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                indiceLibertas >= seg ? 'bg-gradient-to-r from-emerald-500/60 to-transparent' :
                ''
              }`}
            />
          ))}
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {Object.entries(requisitoLibertad).map(([key, cumplido]) => (
            <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${cumplido ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/3 border border-white/5'}`}>
              <span className="text-lg leading-none">{requisitosLabels[key]?.emoji}</span>
              <span className={`text-xs flex-1 ${cumplido ? 'text-emerald-300 font-semibold' : 'text-gray-500'}`}>
                {requisitosLabels[key]?.label}
              </span>
              {cumplido
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex-shrink-0" />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Proyección 3 meses — tarjeta visual */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" /> ¿Cómo estarás en 3 meses?
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <span className="text-xl">💰</span>
            <div className="text-[10px] text-gray-400 mt-1">Habrás ahorrado</div>
            <div className="text-sm font-bold text-blue-300 mt-0.5">{formatMoney(Math.max(0, prediccion3Meses.ahorro))}</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
            <span className="text-xl">💳</span>
            <div className="text-[10px] text-gray-400 mt-1">Deuda restante</div>
            <div className="text-sm font-bold text-orange-300 mt-0.5">{formatMoney(prediccion3Meses.deudaRestante)}</div>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">* Estimado si mantienes tu ritmo actual</p>
      </div>

      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}

      <div className="grid gap-2">
        {kpis.totalDeudas > 0 && <ActionButton emoji="💳" text="Plan de Deudas" onClick={onOpenDebtPlanner} />}
        {kpis.tasaAhorro < 0.2 && <ActionButton emoji="💰" text="Plan de Ahorro" onClick={onOpenSavingsPlanner} />}
      </div>
    </div>
  );
}

function ControlGastosView({ fugasDetectadas, totalFugasAhorro, recomendaciones, kpis, onOpenSpendingControl }) {
  const total = kpis.gastosTotales || 1
  const cats = [
    { label: 'Fijos', value: kpis.totalGastosFijos, color: '#6366f1', emoji: '🏠' },
    { label: 'Variables', value: kpis.totalGastosVariables, color: '#f97316', emoji: '🛍️' },
    { label: 'Suscripciones', value: kpis.totalSuscripciones, color: '#a855f7', emoji: '📱' },
  ]

  return (
    <div className="space-y-4">
      {/* Fugas — visual con impacto */}
      {fugasDetectadas.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-white font-bold">¡Sin fugas detectadas!</p>
          <p className="text-xs text-gray-400 mt-1">Tus gastos están bajo control</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-red-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-white">Dinero que se escapa</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-red-400">{formatMoney(totalFugasAhorro)}/mes</p>
              <p className="text-[10px] text-gray-500">podrías recuperar</p>
            </div>
          </div>
          {/* Fugas list */}
          <div className="p-3 space-y-2">
            {fugasDetectadas.slice(0, 3).map((fuga, idx) => {
              const pct = fuga.ahorroEstimado > 0 ? Math.round((fuga.ahorroEstimado / fuga.gastoActual) * 100) : 0
              return (
                <div key={idx} className="bg-black/20 rounded-xl p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl leading-none">{fuga.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{fuga.tipo}</p>
                      <p className="text-[10px] text-gray-500">{fuga.frecuencia} veces este mes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-300">{formatMoney(fuga.gastoActual)}</p>
                    </div>
                  </div>
                  {/* Barra de ahorro potencial */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-gray-600 italic truncate">{fuga.solucion}</p>
                    <p className="text-[10px] text-emerald-400 font-bold flex-shrink-0 ml-2">-{formatMoney(fuga.ahorroEstimado)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Distribución de gastos — torta visual */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3">¿En qué se va el dinero?</h4>
        {/* Stacked bar */}
        <div className="h-5 w-full rounded-full overflow-hidden flex mb-3">
          {cats.map((c, i) => {
            const w = total > 0 ? (c.value / total) * 100 : 0
            return w > 0 ? (
              <div key={i} className="h-full transition-all duration-700" style={{ width: `${w}%`, backgroundColor: c.color }} />
            ) : null
          })}
        </div>
        {/* Leyenda */}
        <div className="space-y-2">
          {cats.map((c, i) => {
            const pct = total > 0 ? (c.value / total) * 100 : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base leading-none">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[11px] text-gray-400">{c.label}</span>
                    <span className="text-[11px] font-bold text-white">{formatMoney(c.value)}</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 w-8 text-right">{pct.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="📊" text="Ajustar Presupuesto" onClick={onOpenSpendingControl} />
    </div>
  );
}

function AhorroView({ kpis, recomendaciones, onOpenSavingsPlanner }) {
  const pctAhorro = Math.max(0, Math.min(100, kpis.tasaAhorro * 100))
  const metaAhorro = kpis.totalIngresos * 0.20
  const superaMeta = kpis.disponible >= metaAhorro

  // Gauge circular grande
  const R = 52, CIRC = 2 * Math.PI * R
  const dash = (pctAhorro / 100) * CIRC
  const color = pctAhorro >= 20 ? '#34d399' : pctAhorro >= 10 ? '#fbbf24' : '#f87171'
  const colorText = pctAhorro >= 20 ? 'text-emerald-400' : pctAhorro >= 10 ? 'text-yellow-400' : 'text-red-400'

  // Mensaje motivacional
  const mensaje = pctAhorro >= 30 ? '¡Vas muy bien! Eres un ahorrador estrella 🌟'
    : pctAhorro >= 20 ? '¡Alcanzaste la meta! Mantén el ritmo 💪'
    : pctAhorro >= 10 ? 'Casi llegás. Solo un poco más 🎯'
    : pctAhorro > 0 ? 'Pequeños pasos también cuentan. ¡Sigue adelante!'
    : 'Este mes no sobra nada. Revisemos los gastos.'

  return (
    <div className="space-y-4">
      {/* Gauge grande de ahorro */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col items-center">
          {/* Gauge SVG */}
          <div className="relative" style={{ width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              {/* Track */}
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
              {/* Progreso */}
              <circle cx="70" cy="70" r={R} fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC}`}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease' }}
              />
              {/* Marca de meta 20% */}
              <line
                x1="70" y1="18"
                x2="70" y2="28"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${(20 / 100) * 360 - 90} 70 70)`}
              />
            </svg>
            {/* Centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <PiggyBank className={`w-6 h-6 ${colorText} mb-0.5`} />
              <span className={`text-2xl font-black ${colorText}`}>{pctAhorro.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500">ahorro</span>
            </div>
          </div>

          {/* Mensaje */}
          <p className="text-center text-sm text-gray-300 mt-2 leading-relaxed max-w-xs">{mensaje}</p>

          {/* Comparación vs meta */}
          <div className={`mt-3 px-4 py-2 rounded-xl text-center w-full ${superaMeta ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/10'}`}>
            {superaMeta ? (
              <p className="text-sm text-emerald-400 font-bold">🎉 Superaste la meta en {formatMoney(kpis.disponible - metaAhorro)}</p>
            ) : (
              <p className="text-sm text-gray-300">Faltan <span className="font-bold text-white">{formatMoney(metaAhorro - kpis.disponible)}</span> para llegar al 20%</p>
            )}
          </div>

          {/* Barra visual de niveles */}
          <div className="w-full mt-4">
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>0%</span><span>10%</span><span className="text-indigo-500">20% meta</span><span>30%+</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden flex">
              <div className="h-full rounded-l-full bg-red-500/60 flex-1" />
              <div className="h-full bg-yellow-500/60 flex-1 border-l border-black/20" />
              <div className="h-full bg-emerald-500/60 flex-1 border-l border-black/20" />
              <div className="h-full rounded-r-full bg-emerald-500 flex-1 border-l border-black/20" />
            </div>
            {/* Indicador de posición */}
            <div className="relative h-3 mt-0.5">
              <div
                className="absolute top-0 w-2 h-2 bg-white rounded-full border-2 border-slate-900 transition-all duration-700"
                style={{ left: `calc(${Math.min(100, pctAhorro)}% - 4px)` }}
              />
            </div>
          </div>
        </div>
      </div>

      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="🎯" text="Crear Plan de Ahorro" onClick={onOpenSavingsPlanner} />
    </div>
  );
}

function DeudasView({ deudas, kpis, recomendaciones, onOpenDebtPlanner }) {
  if (kpis.totalDeudas === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-bold text-lg">¡Libre de deudas! 🎉</p>
          <p className="text-gray-400 text-sm mt-1">Eso es un logro enorme. Ahora es momento de invertir.</p>
        </div>
      </div>
    )
  }

  const deudaMax = Math.max(...deudas.map(d => Number(d.saldo || 0)), 1)

  return (
    <div className="space-y-4">
      {/* Header visual */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-white">Tus Deudas</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-red-400">{formatMoney(kpis.totalDeudas)}</p>
            <p className="text-[10px] text-gray-500">total</p>
          </div>
        </div>

        {/* Deudas como barras proporcionales */}
        <div className="space-y-3">
          {deudas.slice(0, 4).map((deuda, idx) => {
            const saldo = Number(deuda.saldo || 0)
            const pct = Math.round((saldo / deudaMax) * 100)
            const apr = Number(deuda.apr || 0)
            const aprDisplay = apr > 1 ? apr.toFixed(0) : (apr * 100).toFixed(0)
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-semibold text-white truncate">{deuda.nombre || deuda.cuenta || 'Deuda'}</span>
                    {apr > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 flex-shrink-0">
                        {aprDisplay}% APR
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 flex-shrink-0 ml-2">{formatMoney(saldo)}</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {deudas.length > 4 && (
            <p className="text-[10px] text-gray-600 text-center">+{deudas.length - 4} deudas más</p>
          )}
        </div>
      </div>

      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="🎯" text="Simular Pagos" onClick={onOpenDebtPlanner} />
    </div>
  );
}

function OptimizacionView({ suscripcionesOptimizables, fugasDetectadas, recomendaciones, onOpenOptimizer }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Oportunidades</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{suscripcionesOptimizables.length}</div>
            <div className="text-[10px] text-amber-300">Suscripciones</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{fugasDetectadas.length}</div>
            <div className="text-[10px] text-amber-300">Fugas</div>
          </div>
        </div>
      </div>
      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="✂️" text="Optimizar Ahora" onClick={onOpenOptimizer} />
    </div>
  );
}

// ─── TARJETA VISUAL FLUJO DE DINERO ───────────────────────────────────────────
function TarjetaFlujoDinero({ kpis }) {
  const { totalIngresos, gastosTotales, disponible, tasaAhorro } = kpis
  const pctGastos = totalIngresos > 0 ? Math.min(100, (gastosTotales / totalIngresos) * 100) : 0
  const pctDisponible = totalIngresos > 0 ? Math.max(0, (disponible / totalIngresos) * 100) : 0
  const pctAhorro = Math.max(0, Math.min(100, tasaAhorro * 100))

  // Gauge SVG params
  const R = 38, CIRC = 2 * Math.PI * R
  const gapDeg = disponible >= 0 ? pctGastos : 100

  // Estado del mes
  const estadoMes = disponible < 0
    ? { label: 'En números rojos', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    : pctDisponible < 15
    ? { label: 'Muy justo', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    : pctDisponible < 30
    ? { label: 'Ajustado', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    : { label: 'Bien manejado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md overflow-hidden">
      {/* Estado visual top */}
      <div className={`px-4 py-2 flex items-center justify-between ${estadoMes.bg} border-b ${estadoMes.border}`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${estadoMes.color}`}>{estadoMes.label}</span>
        <span className="text-[11px] text-gray-500">Este mes</span>
      </div>

      {/* Fila principal: gauge + números */}
      <div className="flex items-center px-4 py-4 gap-4">
        {/* Gauge de gastos */}
        <div className="relative flex-shrink-0">
          <svg width="90" height="90" viewBox="0 0 90 90">
            {/* Track */}
            <circle cx="45" cy="45" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
            {/* Gastos arc */}
            <circle cx="45" cy="45" r={R} fill="none"
              stroke={pctGastos >= 90 ? '#f87171' : pctGastos >= 70 ? '#fbbf24' : '#34d399'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(gapDeg / 100) * CIRC} ${CIRC}`}
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            {/* Disponible arc (debajo del gastos) */}
            {disponible > 0 && (
              <circle cx="45" cy="45" r={R} fill="none"
                stroke="#6366f1"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(pctDisponible / 100) * CIRC} ${CIRC}`}
                transform={`rotate(${-90 + (gapDeg * 360 / 100)} 45 45)`}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            )}
          </svg>
          {/* Label centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-500">Gasté</span>
            <span className={`text-sm font-black ${pctGastos >= 90 ? 'text-red-400' : pctGastos >= 70 ? 'text-amber-400' : 'text-white'}`}>
              {pctGastos.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Números clave */}
        <div className="flex-1 space-y-3">
          {/* Ingresos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-400">Ingresos</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{formatMoney(totalIngresos)}</span>
          </div>
          {/* Gastos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pctGastos >= 90 ? 'bg-red-400' : pctGastos >= 70 ? 'bg-amber-400' : 'bg-yellow-400'}`} />
              <span className="text-[11px] text-gray-400">Gastos</span>
            </div>
            <span className={`text-sm font-bold ${pctGastos >= 90 ? 'text-red-400' : 'text-gray-300'}`}>{formatMoney(gastosTotales)}</span>
          </div>
          {/* Disponible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${disponible < 0 ? 'bg-red-400' : 'bg-indigo-400'}`} />
              <span className="text-[11px] text-gray-400">Disponible</span>
            </div>
            <span className={`text-sm font-bold ${disponible < 0 ? 'text-red-400' : 'text-indigo-300'}`}>{formatMoney(disponible)}</span>
          </div>
        </div>
      </div>

      {/* Barra de ahorro */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-gray-400">Tasa de ahorro</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold ${pctAhorro >= 20 ? 'text-emerald-400' : pctAhorro >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {pctAhorro.toFixed(0)}%
            </span>
            <span className="text-[10px] text-gray-600">/ meta 20%</span>
          </div>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${pctAhorro >= 20 ? 'bg-emerald-400' : pctAhorro >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${Math.min(100, pctAhorro)}%` }}
          />
        </div>
        {/* Milestones */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-700">0%</span>
          <span className="text-[9px] text-gray-700">10%</span>
          <span className="text-[9px] text-emerald-800 font-bold">20% ✓</span>
          <span className="text-[9px] text-gray-700">30%</span>
        </div>
      </div>
    </div>
  )
}

// ─── TARJETA LIBERTAD FINANCIERA ───────────────────────────────────────────────
function TarjetaLibertad({ prediccionLibertad, kpis }) {
  const { mesesLibertad, fechaLibertad, capacidadPago } = prediccionLibertad
  const sinCapacidad = mesesLibertad === 999 || capacidadPago <= 0

  // Sin capacidad → tarjeta motivacional de primer paso
  if (sinCapacidad) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-900/10 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 flex-shrink-0 text-xl leading-none">🎯</div>
          <div className="flex-1">
            <p className="text-sm font-black text-white mb-1">Primer paso: liberar margen</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Tus gastos consumen todo tu ingreso. Para avanzar en tus deudas, intenta liberar aunque sea{' '}
              <span className="text-amber-300 font-semibold">$500/mes</span> reduciendo algún gasto.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { emoji: '🍔', tip: 'Cocina en casa más seguido' },
                { emoji: '📱', tip: 'Cancela 1 suscripción' },
                { emoji: '🚗', tip: 'Reduce transporte' },
              ].map((s, i) => (
                <div key={i} className="bg-black/20 rounded-xl p-2 text-center">
                  <span className="text-base leading-none">{s.emoji}</span>
                  <p className="text-[9px] text-gray-500 mt-1 leading-tight">{s.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const anios = Math.floor(mesesLibertad / 12)
  const mesesResto = mesesLibertad % 12

  const nivel = mesesLibertad > 48
    ? { color: 'text-amber-400', bg: 'from-amber-500/15 to-orange-900/15', border: 'border-amber-500/20', label: 'Largo camino — ¡pero llegarás!', icon: Droplets }
    : mesesLibertad > 18
    ? { color: 'text-blue-400', bg: 'from-blue-500/15 to-indigo-900/15', border: 'border-blue-500/20', label: 'Buen ritmo, sigue así', icon: Leaf }
    : { color: 'text-emerald-400', bg: 'from-emerald-500/15 to-teal-900/15', border: 'border-emerald-500/20', label: '¡Casi libre!', icon: Flame }

  const IconNivel = nivel.icon
  const maxMeses = 60
  const progreso = Math.max(5, 100 - (mesesLibertad / maxMeses) * 100)

  return (
    <div className={`rounded-2xl border ${nivel.border} bg-gradient-to-br ${nivel.bg} overflow-hidden p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-black/20">
          <IconNivel className={`w-4 h-4 ${nivel.color}`} />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">¿Cuándo estarás libre de deudas?</p>
          <p className={`text-[11px] ${nivel.color} font-bold`}>{nivel.label}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-end gap-1">
            {anios > 0 && (
              <><span className="text-3xl font-black text-white">{anios}</span><span className="text-sm text-gray-400 mb-1 ml-0.5">año{anios > 1 ? 's' : ''}</span></>
            )}
            {mesesResto > 0 && (
              <><span className="text-3xl font-black text-white ml-1">{mesesResto}</span><span className="text-sm text-gray-400 mb-1 ml-0.5">mes{mesesResto > 1 ? 'es' : ''}</span></>
            )}
            {anios === 0 && mesesResto === 0 && (
              <span className="text-3xl font-black text-emerald-400">¡Libre ya!</span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">pagando tu plan actual</p>
        </div>
        <div className="text-right">
          {fechaLibertad && (
            <div className="flex items-center justify-end gap-1 mb-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-[11px] text-gray-400">
                {fechaLibertad.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
          <span className="text-[10px] text-gray-600">Deuda: </span>
          <span className="text-[11px] font-bold text-white">{formatMoney(kpis.totalDeudas)}</span>
        </div>
      </div>

      <div>
        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              mesesLibertad > 48 ? 'bg-amber-500' : mesesLibertad > 18 ? 'bg-blue-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-600">Hoy</span>
          <span className="text-[9px] text-gray-600">Sin deudas 🎯</span>
        </div>
      </div>
    </div>
  )
}

function RecomendacionCard({ recomendacion }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h5 className="text-white font-bold text-sm mb-1">{recomendacion.titulo}</h5>
      <p className="text-gray-300 text-xs mb-2">{recomendacion.descripcion}</p>
      <div className="bg-white/10 rounded-lg p-2 mb-2">
        <div className="text-white text-xs font-semibold">{recomendacion.accion}</div>
      </div>
      {recomendacion.pasos && (
        <>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-purple-300 flex items-center gap-1">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver'} pasos
          </button>
          {expanded && (
            <div className="mt-2 space-y-1 pl-4">
              {recomendacion.pasos.map((paso, idx) => (
                <div key={idx} className="text-xs text-gray-300 flex items-start gap-2"><span className="text-purple-400">•</span><span>{paso}</span></div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


function ActionButton({ emoji, text, onClick }) {
  return (
    <button onClick={onClick} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-white font-semibold text-sm transition-all active:scale-95">
      <span className="text-xl">{emoji}</span>{text}
    </button>
  );
}

function SelectorObjetivosModal({ objetivos, objetivoActual, kpis, onSelect, onClose }) {
  const recomendado = useMemo(() => {
    if (kpis.disponible < 0) return 'controlar_gastos';
    if (kpis.totalDeudas > kpis.totalIngresos * 2) return 'pagar_deudas';
    if (kpis.tasaAhorro < 0.15) return 'ahorrar_mas';
    return 'diagnostico';
  }, [kpis]);

  // 🔒 Bloqueo de scroll al abrir
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        style={{ zIndex: 99998 }}
        onClick={onClose}
      />
      {/* MODAL */}
      <div
        className="fixed inset-0 flex items-end md:items-center md:justify-center"
        style={{ zIndex: 99999 }}
      >
        <div
          className="w-full md:w-[95%] md:max-w-md
                     bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl
                     border-t md:border border-white/10
                     flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 12px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
            {/* Pill indicator mobile */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold text-white">Objetivo Financiero</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400">Selecciona tu enfoque principal para este mes.</p>
          </div>

          {/* LISTA SCROLLEABLE */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)'
            }}
          >
            {objetivos.map((obj) => {
              const esRecomendado = obj.key === recomendado;
              const esActual = obj.key === objetivoActual;
              return (
                <button
                  key={obj.key}
                  onClick={() => onSelect(obj.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left active:scale-[0.98] touch-manipulation ${
                    esActual
                      ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${obj.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {obj.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-bold text-sm ${esActual ? 'text-white' : 'text-white/90'}`}>
                        {obj.label}
                      </span>
                      {esRecomendado && !esActual && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold whitespace-nowrap">
                          ⭐ Recomendado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${esActual ? 'text-purple-200' : 'text-white/50'}`}>
                      {obj.descripcion}
                    </p>
                  </div>
                  {esActual && <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function OptimizadorSuscripcionesReal({ suscripciones, suscripcionesOptimizables, ahorroTotalOptimizable, onClose }) {
  const [seleccionadas, setSeleccionadas] = useState([]);
  const toggleSuscripcion = (e, id) => {
    e.stopPropagation();
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };
  const ahorroSeleccionado = suscripcionesOptimizables.filter(s => seleccionadas.includes(s.id)).reduce((sum, s) => sum + Number(s.costo), 0);
  void suscripciones;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 w-full sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" /> Optimizador</h2>
              <p className="text-sm text-gray-400 mt-1">{suscripcionesOptimizables.length} oportunidades detectadas</p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-green-300 mb-1">Ahorro Potencial</div><div className="text-2xl font-bold text-white">{formatMoney(ahorroTotalOptimizable)}<span className="text-sm text-green-300">/mes</span></div></div>
              {seleccionadas.length > 0 && <div className="text-right"><div className="text-sm text-white/70">Seleccionado</div><div className="text-xl font-bold text-yellow-400">{formatMoney(ahorroSeleccionado)}</div></div>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {suscripcionesOptimizables.length === 0 ? <div className="text-center py-10"><CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" /><p className="font-semibold text-white">¡Todo optimizado!</p></div> : (
            <div className="space-y-3">
              {suscripcionesOptimizables.map(sub => (
                <div key={sub.id} onClick={(e) => toggleSuscripcion(e, sub.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${seleccionadas.includes(sub.id) ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${seleccionadas.includes(sub.id) ? 'bg-red-500 border-red-400' : 'border-gray-500'}`}>{seleccionadas.includes(sub.id) && <Trash2 className="w-3 h-3 text-white" />}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2"><h4 className="text-white font-bold text-sm">{sub.servicio}</h4><div className="text-white font-bold text-sm">{formatMoney(sub.costo)}<span className="text-xs text-gray-400">/mes</span></div></div>
                      <div className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{sub.razonOptimizar}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {seleccionadas.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-slate-800/50">
            <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Shield className="w-5 h-5" /> Ahorrarás {formatMoney(ahorroSeleccionado)}/mes</button>
            <p className="text-[10px] text-gray-500 text-center mt-2">* Simulación. Gestiona desde Suscripciones.</p>
          </div>
        )}
      </div>
    </div>
  );
}
