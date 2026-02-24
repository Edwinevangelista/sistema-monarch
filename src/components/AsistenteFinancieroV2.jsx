// src/components/AsistenteFinancieroV2.jsx
// 💎 FinGuide AI - Tu Asesor Financiero Personal Inteligente (V4 - Visual Upgrade & Real Logic)
// Visual Impactante | Planes Numéricos Reales | Sin Simulaciones Vacías

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { 
  Brain, CheckCircle2, Zap, X, 
  Calendar, AlertTriangle,
  Shield, PiggyBank, CreditCard,
  Trash2, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, ChevronUp, Play,
  Sparkles, HeartPulse, Eye, EyeOff, Activity
} from "lucide-react";

// --- CONSTANTES ---
const formatMoney = (v) => `$${Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
const formatPct = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;

const PROMEDIOS_NACIONALES = {
  tasaAhorro: 0.15,
  ratioGastosFijos: 0.50,
  ratioGastosVariables: 0.30,
  numeroSuscripciones: 4,
  costoPromedioSuscripcion: 120
};

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
      tasaAhorro = (datosCalculo.tasaAhorro || 0) / 100;
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

    // SCORE DE SALUD
    let scoreHealth = 50;
    
    if (tasaAhorro > 0.30) scoreHealth += 35;
    else if (tasaAhorro > 0.20) scoreHealth += 30;
    else if (tasaAhorro > 0.15) scoreHealth += 25;
    else if (tasaAhorro > 0.10) scoreHealth += 20;
    else if (tasaAhorro > 0.05) scoreHealth += 10;
    else if (tasaAhorro > 0) scoreHealth += 5;
    else if (tasaAhorro < 0) scoreHealth -= 30;
    
    if (totalDeudas === 0) scoreHealth += 25;
    else if (totalDeudas < totalIngresos * 0.5) scoreHealth += 15;
    else if (totalDeudas < totalIngresos * 2) scoreHealth += 5;
    else if (totalDeudas > totalIngresos * 5) scoreHealth -= 25;
    
    // ⚠️ CORRECCIÓN: Eliminamos variable ratioGasto no usada
    const ratioGastos = totalIngresos > 0 ? (gastosTotales / totalIngresos) : 1;
    if (ratioGastos < 0.60) scoreHealth += 15;
    else if (ratioGastos < 0.70) scoreHealth += 10;
    else if (ratioGastos < 0.80) scoreHealth += 5;
    else if (ratioGastos > 1.0) scoreHealth -= 20;
    
    if (disponible > totalIngresos * 0.20) scoreHealth += 10;
    else if (disponible > 0) scoreHealth += 5;
    
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
      setUltimoAnalisis(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
      if (showLocalNotification) showLocalNotification(`✨ Análisis actualizado`, 'success');
      setLoading(false);
      setTimeout(() => setShowAnalysisAnimation(false), 500);
    }, 800); // Un poco más lento para apreciar la animación
  }, [showLocalNotification]); 

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && (ingresos.length || gastosFijos.length || gastosVariables.length)) {
      hasInitialized.current = true;
      const timer = setTimeout(() => setUltimoAnalisis(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })), 500);
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

        {/* 2. KPIs GRID */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard label="Ingresos" value={formatMoney(kpis.totalIngresos)} color="text-emerald-400" icon={<TrendingUp className="w-4 h-4" />} />
          <KPICard label="Gastos" value={formatMoney(kpis.gastosTotales)} color="text-rose-400" icon={<TrendingDown className="w-4 h-4" />} />
          <KPICard label="Disponible" value={formatMoney(kpis.disponible)} color={kpis.disponible >= 0 ? "text-blue-300" : "text-rose-400"} icon={kpis.disponible >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} />
          <KPICard label="Ahorro" value={formatPct(kpis.tasaAhorro)} color="text-purple-300" icon={<PiggyBank className="w-4 h-4" />} />
        </div>

        {/* 3. PREDICCIÓN LIBERTAD */}
        {prediccionLibertad.mesesLibertad > 0 && kpis.totalDeudas > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h4 className="text-white font-bold text-sm">Libertad Financiera</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-[10px] text-gray-400 uppercase">Libre en</div>
                <div className={`text-xl font-bold ${prediccionLibertad.mesesLibertad === 999 ? 'text-red-400' : 'text-green-400'}`}>
                  {prediccionLibertad.mesesLibertad === 999 ? '>99a' : `${prediccionLibertad.mesesLibertad}m`}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase">Capacidad Pago</div>
                <div className="text-xl font-bold text-white">{formatMoney(prediccionLibertad.capacidadPago)}</div>
              </div>
            </div>
          </div>
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
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h4 className="text-white font-bold text-sm">Índice de Libertad</h4>
        </div>
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${indiceLibertas}%` }} />
        </div>
        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-white">{indiceLibertas.toFixed(0)}/100</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(requisitoLibertad).slice(0, 2).map(([key, cumplido], idx) => {
            const labels = { fondoEmergencia: 'Fondo 6m', sinDeudas: '0 Deudas' };
            return (
              <div key={idx} className="flex items-center gap-2">
                {cumplido ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <div className="w-3 h-3 rounded-full border border-gray-600" />}
                <span className={cumplido ? 'text-emerald-300' : 'text-gray-500'}>{labels[key]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Proyección 3 Meses</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-400 uppercase">Ahorro Total</div>
            <div className="text-sm font-bold text-blue-400">{formatMoney(prediccion3Meses.ahorro)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-400 uppercase">Deuda Final</div>
            <div className="text-sm font-bold text-orange-400">{formatMoney(prediccion3Meses.deudaRestante)}</div>
          </div>
        </div>
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
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-400" /> Fugas Detectadas</h4>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white">{formatMoney(totalFugasAhorro)}</div>
          <div className="text-xs text-red-300">potencial de ahorro mensual real</div>
        </div>
        {fugasDetectadas.length === 0 ? (
          <div className="text-center py-4"><CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" /><p className="text-sm text-white">¡Sin fugas detectadas!</p></div>
        ) : (
          <div className="space-y-2">{fugasDetectadas.slice(0, 3).map((fuga, idx) => <FugaCardCompact key={idx} fuga={fuga} />)}</div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3">Distribución Actual</h4>
        <div className="space-y-2">
          <GastoBar label="Fijos" value={kpis.totalGastosFijos} total={kpis.gastosTotales} color="bg-blue-500" />
          <GastoBar label="Variables" value={kpis.totalGastosVariables} total={kpis.gastosTotales} color="bg-orange-500" />
          <GastoBar label="Suscripciones" value={kpis.totalSuscripciones} total={kpis.gastosTotales} color="bg-purple-500" />
        </div>
      </div>

      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="📊" text="Ajustar Presupuesto" onClick={onOpenSpendingControl} />
    </div>
  );
}

function AhorroView({ kpis, recomendaciones, onOpenSavingsPlanner }) {
  const metaAhorro = kpis.totalIngresos * 0.20;
  const progreso = metaAhorro > 0 ? (kpis.disponible / metaAhorro) * 100 : 0;
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2"><PiggyBank className="w-5 h-5 text-emerald-400" /> Tu Tasa de Ahorro</h4>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white">{formatPct(kpis.tasaAhorro)}</div>
          <div className="text-xs text-emerald-300">Meta: 20%</div>
        </div>
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${Math.min(Math.max(progreso, 0), 100)}%` }} />
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm text-white">{kpis.disponible < metaAhorro ? <>Faltan {formatMoney(metaAhorro - kpis.disponible)}</> : <>¡Superaste meta en {formatMoney(kpis.disponible - metaAhorro)}!</>}</span>
        </div>
      </div>
      {recomendaciones.map((rec, idx) => <RecomendacionCard key={idx} recomendacion={rec} />)}
      <ActionButton emoji="🎯" text="Crear Plan de Ahorro" onClick={onOpenSavingsPlanner} />
    </div>
  );
}

function DeudasView({ deudas, kpis, recomendaciones, onOpenDebtPlanner }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-red-400" /> Panorama de Deudas</h4>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white">{formatMoney(kpis.totalDeudas)}</div>
          <div className="text-xs text-red-300">deuda total acumulada</div>
        </div>
        {deudas.length === 0 ? (
          <div className="text-center py-4"><CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" /><p className="text-sm text-white">¡Libre de deudas!</p></div>
        ) : (
          <div className="space-y-2">{deudas.slice(0, 3).map((deuda, idx) => <DeudaCardCompact key={idx} deuda={deuda} />)}</div>
        )}
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

function KPICard({ label, value, icon, color }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold uppercase text-gray-500">{label}</span>
        <div className={color}>{icon}</div>
      </div>
      <div className={`text-base font-bold ${color}`}>{value}</div>
    </div>
  );
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

function FugaCardCompact({ fuga }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">{fuga.emoji}</span>
        <div><div className="text-white text-xs font-semibold">{fuga.tipo}</div><div className="text-gray-400 text-[10px]">{fuga.frecuencia}x • {formatMoney(fuga.gastoActual)}</div></div>
      </div>
      <div className="text-green-400 text-xs font-bold">{formatMoney(fuga.ahorroEstimado)}</div>
    </div>
  );
}

function DeudaCardCompact({ deuda }) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="flex justify-between items-center">
        <span className="text-white text-xs font-semibold">{deuda.nombre || deuda.cuenta || 'Deuda'}</span>
        <span className="text-red-400 text-xs font-bold">{formatMoney(deuda.saldo)}</span>
      </div>
    </div>
  );
}

function GastoBar({ label, value, total, color }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span><span>{formatMoney(value)} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${percent}%` }} /></div>
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