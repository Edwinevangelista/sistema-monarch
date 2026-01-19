// src/components/AsistenteFinancieroV2.jsx
// 💎 FinGuide AI - Tu Asesor Financiero Personal Inteligente
// Arquetipos Dinámicos | Objetivos Personalizados | Análisis en Tiempo Real

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { 
  Brain, CheckCircle2, Zap, X, 
  Calendar, AlertTriangle,
  Shield, PiggyBank, CreditCard,
  Trash2, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, ChevronUp, Play,
  Sparkles, HeartPulse
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

// 🎭 ARQUETIPOS FINANCIEROS (PERSONAS DINÁMICAS)
const ARQUETIPOS = {
  VISIONARIO: { 
    nombre: "El Visionario", 
    emoji: "🚀",
    color: "from-emerald-500 to-teal-600", 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    tono: "assertive",
    mensaje: "Tus números son excelentes. El foco ahora es maximizar el crecimiento e invertir sabiamente.",
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
    mensaje: "Buen trabajo. Estás construyendo patrimonio sólido. Es hora de acelerar y consolidar.",
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
    mensaje: "Estás en zona estable pero vulnerable. Fortalezcamos tu blindaje financiero.",
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
    mensaje: "Tu salud financiera requiere atención inmediata. Vamos a estabilizar el barco juntos.",
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
    descripcion: "Análisis holístico de tu situación financiera",
    icono: Sparkles
  },
  { 
    key: "controlar_gastos", 
    label: "Control de Gastos", 
    emoji: "💸",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    activeColor: "bg-gradient-to-r from-orange-600 to-red-600",
    descripcion: "Identifica y reduce gastos excesivos",
    icono: TrendingDown
  },
  { 
    key: "ahorrar_mas", 
    label: "Aumentar Ahorro", 
    emoji: "💰",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    activeColor: "bg-gradient-to-r from-emerald-600 to-teal-600",
    descripcion: "Estrategias para ahorrar más cada mes",
    icono: PiggyBank
  },
  { 
    key: "pagar_deudas", 
    label: "Eliminar Deudas", 
    emoji: "💳",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
    activeColor: "bg-gradient-to-r from-red-600 to-rose-600",
    descripcion: "Plan acelerado para liberarte de deudas",
    icono: AlertTriangle
  },
  { 
    key: "optimizar_subs", 
    label: "Optimizar Gastos", 
    emoji: "✂️",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    activeColor: "bg-gradient-to-r from-amber-600 to-yellow-600",
    descripcion: "Elimina suscripciones y gastos hormiga",
    icono: Zap
  },
];

// Patrones de fugas
const PATRONES_FUGAS = [
  { keywords: ['café', 'coffee', 'starbucks', 'cafetería'], emoji: '☕', nombre: 'Cafés', solucion: 'Compra cafetera', ahorroEstimado: 0.70 },
  { keywords: ['uber', 'didi', 'taxi', 'transporte'], emoji: '🚗', nombre: 'Viajes cortos', solucion: 'Bici eléctrica o transporte público', ahorroEstimado: 0.60 },
  { keywords: ['restaurante', 'comida', 'rappi', 'uber eats', 'delivery'], emoji: '🍔', nombre: 'Delivery/Restaurantes', solucion: 'Meal prep semanal', ahorroEstimado: 0.50 },
  { keywords: ['netflix', 'spotify', 'amazon prime', 'youtube'], emoji: '📺', nombre: 'Streaming múltiple', solucion: 'Consolida a 2 servicios', ahorroEstimado: 0.40 },
  { keywords: ['gym', 'gimnasio', 'fitness'], emoji: '💪', nombre: 'Gym sin usar', solucion: 'Rutinas en casa', ahorroEstimado: 0.80 },
  { keywords: ['snack', 'dulces', 'tienda', 'oxxo', '7-eleven'], emoji: '🍫', nombre: 'Snacks/Antojitos', solucion: 'Compra al mayoreo', ahorroEstimado: 0.65 }
];

// --- COMPONENTE PRINCIPAL ---
export default function AsistenteFinancieroV2({ // Cambiado nombre de export por el archivo
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
  onOpenDebtPlanner,
  onOpenSavingsPlanner,
  onOpenSpendingControl,
  showLocalNotification,
}) {
  // Estados
  const [loading, setLoading] = useState(false);
  const [showSelectorObjetivos, setShowSelectorObjetivos] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [objetivoActual, setObjetivoActual] = useState(() => {
    const saved = localStorage.getItem('finGuideObjetivo');
    return saved || 'diagnostico';
  });
  // Corrección: Removido el setter no usado para evitar warning
  const [pilotoAutomatico] = useState(() => {
    const saved = localStorage.getItem('finGuidePiloto');
    return saved ? JSON.parse(saved) : false;
  });
  const [ultimoAnalisis, setUltimoAnalisis] = useState(null);
  const [showAnalysisAnimation, setShowAnalysisAnimation] = useState(false);
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  const analysisTimeoutRef = useRef(null);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('finGuideObjetivo', objetivoActual);
  }, [objetivoActual]);

  useEffect(() => {
    localStorage.setItem('finGuidePiloto', JSON.stringify(pilotoAutomatico));
  }, [pilotoAutomatico]);

  // --- MOTOR DE INTELIGENCIA COMPLETO ---
  const analisis = useMemo(() => {
    const totalIngresos = ingresos.reduce((sum, i) => sum + Number(i.monto || 0), 0);
    const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
    const totalGastosVariables = gastosVariables.reduce((sum, g) => sum + Number(g.monto || 0), 0);
    const totalSuscripciones = suscripciones
      .filter(s => s.estado === 'Activo')
      .reduce((sum, s) => sum + Number(s.costo || 0), 0);
    const totalDeudas = deudas.reduce((sum, d) => sum + Number(d.saldo || 0), 0);
    
    const gastosTotales = totalGastosFijos + totalGastosVariables + totalSuscripciones;
    const disponible = totalIngresos - gastosTotales;
    const tasaAhorro = totalIngresos > 0 ? (disponible / totalIngresos) : 0;

    // 🎭 DETERMINAR ARQUETIPO (SCORE MEJORADO)
    let scoreHealth = 50; // Base neutral
    
    // FACTOR 1: Tasa de Ahorro (peso: 35 puntos)
    if (tasaAhorro > 0.30) scoreHealth += 35;
    else if (tasaAhorro > 0.20) scoreHealth += 30;
    else if (tasaAhorro > 0.15) scoreHealth += 25;
    else if (tasaAhorro > 0.10) scoreHealth += 20;
    else if (tasaAhorro > 0.05) scoreHealth += 10;
    else if (tasaAhorro > 0) scoreHealth += 5;
    else if (tasaAhorro < 0) scoreHealth -= 30; // Déficit es grave
    
    // FACTOR 2: Nivel de Deudas (peso: 25 puntos)
    if (totalDeudas === 0) {
      scoreHealth += 25; // Sin deudas es excelente
    } else if (totalDeudas < totalIngresos * 0.5) {
      scoreHealth += 15; // Deuda manejable
    } else if (totalDeudas < totalIngresos * 2) {
      scoreHealth += 5; // Deuda moderada
    } else if (totalDeudas > totalIngresos * 5) {
      scoreHealth -= 25; // Deuda crítica
    } else if (totalDeudas > totalIngresos * 3) {
      scoreHealth -= 15; // Deuda alta
    }
    
    // FACTOR 3: Control de Gastos (peso: 15 puntos)
    const ratioGastos = totalIngresos > 0 ? (gastosTotales / totalIngresos) : 1;
    if (ratioGastos < 0.60) scoreHealth += 15; // Gastos muy controlados
    else if (ratioGastos < 0.70) scoreHealth += 10; // Gastos controlados
    else if (ratioGastos < 0.80) scoreHealth += 5; // Gastos aceptables
    else if (ratioGastos > 1.0) scoreHealth -= 20; // Gastando más de lo que ganas
    
    // FACTOR 4: Bonus por Balance Positivo
    if (disponible > totalIngresos * 0.20) scoreHealth += 10; // Excelente margen
    else if (disponible > 0) scoreHealth += 5; // Margen positivo
    
    scoreHealth = Math.max(0, Math.min(100, scoreHealth));

    // 🔍 DEBUG: Ver cálculos en consola
    console.log('📊 FinGuide Debug:', {
      totalIngresos,
      gastosTotales,
      disponible,
      tasaAhorro: `${(tasaAhorro * 100).toFixed(1)}%`,
      totalDeudas,
      scoreHealth,
      ratioGastos: `${(ratioGastos * 100).toFixed(1)}%`
    });

    let arquetipo;
    if (scoreHealth >= ARQUETIPOS.VISIONARIO.min) arquetipo = ARQUETIPOS.VISIONARIO;
    else if (scoreHealth >= ARQUETIPOS.CONSTRUCTOR.min) arquetipo = ARQUETIPOS.CONSTRUCTOR;
    else if (scoreHealth >= ARQUETIPOS.DEFENSOR.min) arquetipo = ARQUETIPOS.DEFENSOR;
    else arquetipo = ARQUETIPOS.CRISIS;

    // COMPARACIÓN CON PROMEDIOS
    const vsPromedio = {
      ahorro: totalIngresos > 0 ? ((tasaAhorro - PROMEDIOS_NACIONALES.tasaAhorro) / PROMEDIOS_NACIONALES.tasaAhorro) * 100 : 0,
      gastosFijos: totalIngresos > 0 ? ((totalGastosFijos / totalIngresos) - PROMEDIOS_NACIONALES.ratioGastosFijos) / PROMEDIOS_NACIONALES.ratioGastosFijos * 100 : 0,
      suscripciones: ((suscripciones.filter(s => s.estado === 'Activo').length - PROMEDIOS_NACIONALES.numeroSuscripciones) / PROMEDIOS_NACIONALES.numeroSuscripciones) * 100
    };

    // PREDICCIÓN 3 MESES
    const prediccion3Meses = {
      ingresos: totalIngresos * 3,
      gastos: gastosTotales * 3,
      ahorro: disponible * 3,
      deudaRestante: Math.max(0, totalDeudas - (disponible * 0.3 * 3))
    };

    // PREDICCIÓN LIBERTAD FINANCIERA
    let mesesLibertad = 0;
    let fechaLibertad = null;
    const capacidadPago = disponible * 0.5;

    if (totalDeudas > 0) {
      if (capacidadPago > 0) {
        mesesLibertad = Math.ceil(totalDeudas / capacidadPago);
        const hoy = new Date();
        fechaLibertad = new Date(hoy.setMonth(hoy.getMonth() + mesesLibertad));
      } else {
        mesesLibertad = 999;
      }
    } else {
      mesesLibertad = 0;
      fechaLibertad = new Date();
    }

    // DETECTOR DE FUGAS
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
        
        if (totalGastado > 200 || frecuencia > 5) {
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

    // CALENDARIO FINANCIERO
    const hoy = new Date();
    const eventosFinancieros = [];

    gastosFijos.forEach(gasto => {
      const diaVencimiento = gasto.diaVencimiento || 1;
      const proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaVencimiento);
      if (proximaFecha < hoy) {
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
      }
      
      eventosFinancieros.push({
        fecha: proximaFecha,
        tipo: 'gasto_fijo',
        descripcion: gasto.categoria || gasto.descripcion || 'Gasto fijo',
        monto: Number(gasto.monto || 0),
        estado: disponible >= Number(gasto.monto || 0) ? 'ok' : 'alerta',
        icono: '💳'
      });
    });

    suscripciones.filter(s => s.estado === 'Activo').forEach(sub => {
      const diaRenovacion = sub.diaRenovacion || 1;
      const proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaRenovacion);
      if (proximaFecha < hoy) {
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
      }

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

    // ÍNDICE DE LIBERTAD FINANCIERA
    const mesesSinIngreso = gastosTotales > 0 ? (disponible / gastosTotales) : 0;
    
    const requisitoLibertad = {
      fondoEmergencia: mesesSinIngreso >= 6,
      sinDeudas: totalDeudas === 0,
      tasaAhorroSana: tasaAhorro >= 0.20,
      ingresoPasivo: false
    };

    const cumplidos = Object.values(requisitoLibertad).filter(Boolean).length;
    const indiceFinal = (cumplidos / 4) * 100;

    // SUSCRIPCIONES OPTIMIZABLES
    const suscripcionesOptimizables = suscripciones
      .filter(s => s.estado === 'Activo')
      .map(s => {
        const costo = Number(s.costo || 0);
        let razonOptimizar = null;
        let prioridad = 0;
        
        if (costo > 200) {
          razonOptimizar = `Costo muy alto (>${formatMoney(200)})`;
          prioridad = 3;
        } else if (s.servicio?.toLowerCase().includes('premium') && costo > 100) {
          razonOptimizar = 'Plan Premium - considera downgrade';
          prioridad = 2;
        } else if (costo < 50 && totalSuscripciones > 300) {
          razonOptimizar = 'Micro-gasto acumulativo';
          prioridad = 1;
        }
        
        return razonOptimizar ? { ...s, razonOptimizar, prioridad, ahorroAnual: costo * 12 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.prioridad - a.prioridad);

    const ahorroTotalOptimizable = suscripcionesOptimizables.reduce((sum, s) => sum + Number(s.costo || 0), 0);

    // RECOMENDACIONES SEGÚN OBJETIVO
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
        scoreHealth
      },
      fugasDetectadas,
      totalFugasAhorro,
      suscripcionesOptimizables,
      ahorroTotalOptimizable,
      deudas,
      arquetipo
    });

    // ESTRATEGIA MAESTRA (según arquetipo)
    const estrategia = generarEstrategiaMaestra({
      arquetipo,
      kpis: {
        totalIngresos,
        totalDeudas,
        disponible,
        tasaAhorro
      },
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
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas, objetivoActual]);

  const { 
    kpis, arquetipo, prediccion3Meses, prediccionLibertad,
    fugasDetectadas, totalFugasAhorro, eventosFinancieros, 
    requisitoLibertad, suscripcionesOptimizables, 
    ahorroTotalOptimizable, recomendaciones, estrategia 
  } = analisis;

  // Función analizar - solo se ejecuta cuando el usuario presiona el botón
  const analizar = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    
    setLoading(true);
    setShowAnalysisAnimation(true);
    
    // Limpiar timeout anterior si existe
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      setUltimoAnalisis(new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      if (showLocalNotification) {
        showLocalNotification(`✨ Análisis actualizado`, 'success');
      }
      
      setLoading(false);
      setTimeout(() => setShowAnalysisAnimation(false), 500);
    }, 600);
  }, [showLocalNotification]); 

  // Auto-analizar SOLO en el montaje inicial (una vez)
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (!hasInitialized.current && (ingresos.length || gastosFijos.length || gastosVariables.length)) {
      hasInitialized.current = true;
      // Pequeño delay para evitar flash inicial
      const timer = setTimeout(() => {
        setUltimoAnalisis(new Date().toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ingresos.length, gastosFijos.length, gastosVariables.length]);

  const objetivoConfig = OBJETIVOS.find(o => o.key === objetivoActual) || OBJETIVOS[0];

  // Estado vacío
  if (ingresos.length === 0 && gastosFijos.length === 0 && gastosVariables.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <Brain className="w-full h-full text-purple-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">FinGuide AI</h2>
          <p className="text-purple-300/70">
            Tu asesor financiero personal está listo. Agrega tus movimientos para comenzar.
          </p>
        </div>
      </div>
    );
  }

  // RENDERIZADO PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white relative overflow-hidden pb-24">
      
      {/* Decoración */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 p-4 max-w-lg mx-auto space-y-4 pt-6">
        
        {/* 1. CABECERA DINÁMICA CON ARQUETIPO */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${arquetipo.color} p-6 shadow-2xl`}>
          {/* Pattern de fondo */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                  FinGuide AI
                </span>
                <HeartPulse className="w-4 h-4 text-white/80 animate-pulse" />
              </div>
              {pilotoAutomatico && (
                <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/30 text-white flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Piloto
                </div>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-5xl mb-2">{arquetipo.emoji}</div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {arquetipo.nombre}
                </h2>
                <p className="text-white/90 text-sm max-w-sm font-medium leading-relaxed">
                  {arquetipo.mensaje}
                </p>
              </div>
              
              <div className="text-right hidden sm:block">
                <div className="text-6xl font-black text-white/20 relative">
                  {kpis.scoreHealth}
                  <div className="absolute -bottom-2 right-0 text-xs text-white/60 font-normal">/ 100</div>
                </div>
              </div>
            </div>

            {/* Selector de Objetivo */}
            <button
              onClick={() => setShowSelectorObjetivos(true)}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl`}>
                  {objetivoConfig.emoji}
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 uppercase font-bold">Objetivo Activo</div>
                  <div className="text-white font-semibold text-sm">{objetivoConfig.label}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* 2. KPIs RÁPIDOS */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard 
            label="Ingresos" 
            value={formatMoney(kpis.totalIngresos)} 
            color="text-emerald-400"
            bg="from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KPICard 
            label="Gastos" 
            value={formatMoney(kpis.gastosTotales)} 
            color="text-rose-400"
            bg="from-rose-500/10 to-rose-500/5 border-rose-500/20"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <KPICard 
            label="Disponible" 
            value={formatMoney(kpis.disponible)} 
            color={kpis.disponible >= 0 ? "text-blue-300" : "text-rose-400"}
            bg={kpis.disponible >= 0 ? "from-blue-500/10 to-blue-500/5 border-blue-500/20" : "from-rose-500/10 to-rose-500/5 border-rose-500/20"}
            icon={kpis.disponible >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          />
          <KPICard 
            label="Ahorro" 
            value={formatPct(kpis.tasaAhorro)} 
            color="text-purple-300"
            bg="from-purple-500/10 to-purple-500/5 border-purple-500/20"
            icon={<PiggyBank className="w-4 h-4" />}
          />
        </div>

        {/* 3. PREDICCIÓN LIBERTAD FINANCIERA */}
        {prediccionLibertad.mesesLibertad > 0 && kpis.totalDeudas > 0 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h4 className="text-white font-bold text-sm">Proyección Libertad Financiera</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-[10px] text-gray-400 uppercase mb-1">Libre en</div>
                <div className={`text-xl font-bold ${prediccionLibertad.mesesLibertad === 999 ? 'text-red-400' : 'text-green-400'}`}>
                  {prediccionLibertad.mesesLibertad === 999 ? '∞' : `${prediccionLibertad.mesesLibertad}m`}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-[10px] text-gray-400 uppercase mb-1">Capacidad</div>
                <div className="text-xl font-bold text-white">{formatMoney(prediccionLibertad.capacidadPago)}</div>
              </div>
            </div>

            {prediccionLibertad.fechaLibertad && prediccionLibertad.mesesLibertad < 999 && (
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (12 / prediccionLibertad.mesesLibertad) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* 4. CONTENIDO SEGÚN OBJETIVO */}
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

        {/* 5. ESTRATEGIA MAESTRA (PLAN INTELIGENTE) */}
        {estrategia.length > 0 && (
          <div className={`rounded-2xl border ${arquetipo.bg} ${arquetipo.border} overflow-hidden`}>
            <button
              onClick={() => setExpandedAdvanced(!expandedAdvanced)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${arquetipo.text}`} />
                <h4 className="font-bold text-white text-sm">Plan Maestro Sugerido</h4>
              </div>
              {expandedAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
            </button>
            
            {expandedAdvanced && (
              <div className="p-4 pt-0 space-y-3">
                {estrategia.map((step, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
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

      {/* Botón flotante */}
      <button
        onClick={analizar}
        disabled={loading}
        className={`
          fixed bottom-24 right-6 w-14 h-14 rounded-full 
          bg-gradient-to-br ${arquetipo.color} 
          text-white shadow-lg shadow-purple-500/30 
          flex items-center justify-center z-40
          transition-all duration-300 disabled:opacity-50
          ${loading ? 'animate-pulse scale-110' : 'hover:scale-110 active:scale-95'}
        `}
      >
        <Brain className={`w-6 h-6 ${loading ? 'animate-pulse' : ''}`} />
        {ultimoAnalisis && !loading && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            ✓
          </div>
        )}
      </button>

      {/* Animación análisis */}
      {showAnalysisAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Brain className="w-16 h-16 text-purple-400 animate-bounce" />
            <p className="text-white font-semibold text-lg">Analizando tu situación...</p>
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
            
            if (key === 'pagar_deudas' && onOpenDebtPlanner) {
              setTimeout(onOpenDebtPlanner, 100);
            } else if (key === 'ahorrar_mas' && onOpenSavingsPlanner) {
              setTimeout(onOpenSavingsPlanner, 100);
            } else if (key === 'optimizar_subs') {
              setTimeout(() => setShowOptimizer(true), 100);
            } else if (key === 'controlar_gastos' && onOpenSpendingControl) {
              setTimeout(onOpenSpendingControl, 100);
            }
            
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

// --- FUNCIONES AUXILIARES ---
function generarRecomendacionesPorObjetivo(params) {
  const { objetivoActual, kpis, fugasDetectadas, totalFugasAhorro, suscripcionesOptimizables, ahorroTotalOptimizable, deudas } = params;
  const recomendaciones = [];

  switch (objetivoActual) {
    case 'controlar_gastos':
      if (totalFugasAhorro > 500) {
        recomendaciones.push({
          titulo: '🔍 Fugas Detectadas',
          descripcion: `Tienes ${fugasDetectadas.length} fugas de dinero activas`,
          accion: `Ahorra ${formatMoney(totalFugasAhorro)}/mes optimizando hábitos`,
          pasos: fugasDetectadas.slice(0, 3).map(f => `${f.emoji} ${f.tipo}: ${f.solucion}`)
        });
      }
      if (kpis.totalGastosVariables > kpis.totalIngresos * 0.3) {
        recomendaciones.push({
          titulo: '📊 Gastos Variables Altos',
          descripcion: `Tus gastos variables son ${formatPct(kpis.totalGastosVariables / kpis.totalIngresos)} (ideal: 30%)`,
          accion: `Reduce ${formatMoney(kpis.totalGastosVariables - (kpis.totalIngresos * 0.3))}`,
          pasos: ['Identifica gastos hormiga', 'Presupuesto semanal', 'Lista fija mensual']
        });
      }
      break;

    case 'ahorrar_mas':
      if (kpis.tasaAhorro < 0.20) {
        const metaAhorro = kpis.totalIngresos * 0.20;
        const diferencia = metaAhorro - kpis.disponible;
        recomendaciones.push({
          titulo: '💰 Aumenta tu Ahorro',
          descripcion: `Ahorro actual: ${formatPct(kpis.tasaAhorro)} | Meta: 20%`,
          accion: `Necesitas ahorrar ${formatMoney(diferencia)} más`,
          pasos: ['Automatiza 20% a ahorro', 'Regla 50/30/20', 'Busca ingreso adicional']
        });
      }
      break;

    case 'pagar_deudas':
      if (kpis.totalDeudas > 0) {
        const pagoSugerido = kpis.disponible * 0.5;
        const meses = pagoSugerido > 0 ? Math.ceil(kpis.totalDeudas / pagoSugerido) : 999;
        recomendaciones.push({
          titulo: '💳 Elimina Deudas',
          descripcion: `Debes ${formatMoney(kpis.totalDeudas)} total`,
          accion: `Paga ${formatMoney(pagoSugerido)}/mes → Libre en ~${meses}m`,
          pasos: ['Método bola de nieve', 'Prioriza tasa alta', 'Congela nuevas']
        });
      }
      break;

    case 'optimizar_subs':
      if (ahorroTotalOptimizable > 100) {
        recomendaciones.push({
          titulo: '✂️ Optimiza Suscripciones',
          descripcion: `${suscripcionesOptimizables.length} suscripciones optimizables`,
          accion: `Ahorra ${formatMoney(ahorroTotalOptimizable)}/mes`,
          pasos: ['Cancela sin uso 30d', 'Downgrade Premium', 'Elimina duplicados']
        });
      }
      break;

    default:
      if (kpis.disponible < 0) {
        recomendaciones.push({
          titulo: '⚠️ Déficit Detectado',
          descripcion: `Gastas ${formatMoney(Math.abs(kpis.disponible))} más de lo que ingresas`,
          accion: 'Ajusta presupuesto urgentemente',
          pasos: ['Corta no esenciales', 'Busca ingresos extra', 'Revisa suscripciones']
        });
      }
      break;
  }

  // Silenciar warning de deudas no usado directamente (se usa via kpis.totalDeudas)
  void deudas;

  return recomendaciones;
}

function generarEstrategiaMaestra(params) {
  const { arquetipo, kpis, mesesLibertad, totalFugasAhorro } = params;
  const estrategia = [];

  if (arquetipo.nombre === 'Modo Crisis' && kpis.totalDeudas > 0) {
    estrategia.push({
      tipo: 'critico',
      titulo: 'Plan Choque: Detener Hemorragia',
      descripcion: 'Tus gastos exceden tus ingresos. Acción inmediata necesaria.',
      botonTexto: 'Congelar Gastos Variables',
      accion: null
    });
  } else if (arquetipo.nombre === 'El Constructor' && kpis.totalDeudas > 0) {
    estrategia.push({
      tipo: 'acelerar',
      titulo: 'Acelerador de Deuda (Bola de Nieve)',
      descripcion: `Puedes estar libre de deudas en ${mesesLibertad < 12 ? 'menos de un año' : `${mesesLibertad} meses`} manteniendo disciplina.`,
      botonTexto: 'Ver Plan de Pagos',
      accion: null
    });
  } else if (arquetipo.nombre === 'El Visionario') {
    estrategia.push({
      tipo: 'crecimiento',
      titulo: 'Maximizar Crecimiento',
      descripcion: 'Tu flujo de caja es excelente. El dinero dormido pierde valor por inflación.',
      botonTexto: 'Explorar Inversiones',
      accion: null
    });
  }

  if (totalFugasAhorro > 500 && arquetipo.nombre !== 'Modo Crisis') {
    estrategia.push({
      tipo: 'optimizar',
      titulo: 'Optimización Avanzada',
      descripcion: `Detecté ${formatMoney(totalFugasAhorro)}/mes en gastos optimizables. Son $${(totalFugasAhorro * 12).toLocaleString()} anuales.`,
      botonTexto: 'Ver Oportunidades',
      accion: null
    });
  }

  return estrategia;
}

// --- COMPONENTES UI ---
// FIX: Removido 'deudas' y 'arquetipo' del destructuring ya que no se usan directamente aquí
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
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h4 className="text-white font-bold text-sm">Índice de Libertad</h4>
        </div>
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
            style={{ width: `${indiceLibertas}%` }}
          />
        </div>
        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-white">{indiceLibertas.toFixed(0)}/100</span>
        </div>
        <div className="space-y-2">
          {Object.entries(requisitoLibertad).slice(0, 3).map(([key, cumplido], idx) => {
            const labels = {
              fondoEmergencia: 'Fondo 6 meses',
              sinDeudas: 'Sin deudas',
              tasaAhorroSana: 'Ahorro 20%+'
            };
            return (
              <div key={idx} className="flex items-center gap-2">
                {cumplido ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                )}
                <span className={`text-xs ${cumplido ? 'text-emerald-300' : 'text-gray-400'}`}>
                  {labels[key]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Proyección 3 Meses
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-[10px] text-gray-400 uppercase">Ahorrarás</div>
            <div className="text-sm font-bold text-blue-400">{formatMoney(prediccion3Meses.ahorro)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-[10px] text-gray-400 uppercase">Deuda Rest.</div>
            <div className="text-sm font-bold text-orange-400">{formatMoney(prediccion3Meses.deudaRestante)}</div>
          </div>
        </div>
      </div>

      {recomendaciones.map((rec, idx) => (
        <RecomendacionCard key={idx} recomendacion={rec} />
      ))}

      <div className="grid gap-2">
        {kpis.totalDeudas > 0 && (
          <ActionButton emoji="💳" text="Plan de Deudas" onClick={onOpenDebtPlanner} />
        )}
        {kpis.tasaAhorro < 0.2 && (
          <ActionButton emoji="💰" text="Plan de Ahorro" onClick={onOpenSavingsPlanner} />
        )}
      </div>
    </div>
  );
}

function ControlGastosView({ fugasDetectadas, totalFugasAhorro, recomendaciones, kpis, onOpenSpendingControl }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/20 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          Fugas Detectadas
        </h4>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white">{formatMoney(totalFugasAhorro)}</div>
          <div className="text-xs text-red-300">potencial de ahorro mensual</div>
        </div>
        
        {fugasDetectadas.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white">¡Sin fugas!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fugasDetectadas.slice(0, 3).map((fuga, idx) => (
              <FugaCardCompact key={idx} fuga={fuga} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h4 className="text-white font-bold text-sm mb-3">Distribución</h4>
        <div className="space-y-2">
          <GastoBar label="Fijos" value={kpis.totalGastosFijos} total={kpis.gastosTotales} color="bg-blue-500" />
          <GastoBar label="Variables" value={kpis.totalGastosVariables} total={kpis.gastosTotales} color="bg-orange-500" />
          <GastoBar label="Suscripciones" value={kpis.totalSuscripciones} total={kpis.gastosTotales} color="bg-purple-500" />
        </div>
      </div>

      {recomendaciones.map((rec, idx) => (
        <RecomendacionCard key={idx} recomendacion={rec} />
      ))}

      <ActionButton emoji="📊" text="Ajustar Presupuesto" onClick={onOpenSpendingControl} />
    </div>
  );
}

function AhorroView({ kpis, recomendaciones, onOpenSavingsPlanner }) {
  const metaAhorro = kpis.totalIngresos * 0.20;
  const progreso = (kpis.disponible / metaAhorro) * 100;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-emerald-400" />
          Tu Tasa de Ahorro
        </h4>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white">{formatPct(kpis.tasaAhorro)}</div>
          <div className="text-xs text-emerald-300">Meta: 20%</div>
        </div>
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${Math.min(progreso, 100)}%` }}
          />
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm text-white">
            {kpis.disponible < metaAhorro ? (
              <>Faltan {formatMoney(metaAhorro - kpis.disponible)}</>
            ) : (
              <>¡Meta superada! +{formatMoney(kpis.disponible - metaAhorro)}</>
            )}
          </span>
        </div>
      </div>

      {recomendaciones.map((rec, idx) => (
        <RecomendacionCard key={idx} recomendacion={rec} />
      ))}

      <ActionButton emoji="🎯" text="Crear Plan de Ahorro" onClick={onOpenSavingsPlanner} />
    </div>
  );
}

function DeudasView({ deudas, kpis, recomendaciones, onOpenDebtPlanner }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border border-red-500/20 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-red-400" />
          Panorama de Deudas
        </h4>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white">{formatMoney(kpis.totalDeudas)}</div>
          <div className="text-xs text-red-300">deuda total</div>
        </div>

        {deudas.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white">¡Sin deudas!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deudas.slice(0, 3).map((deuda, idx) => (
              <DeudaCardCompact key={idx} deuda={deuda} />
            ))}
          </div>
        )}
      </div>

      {recomendaciones.map((rec, idx) => (
        <RecomendacionCard key={idx} recomendacion={rec} />
      ))}

      <ActionButton emoji="🎯" text="Simular Pagos" onClick={onOpenDebtPlanner} />
    </div>
  );
}

function OptimizacionView({ suscripcionesOptimizables, fugasDetectadas, recomendaciones, onOpenOptimizer }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-500/20 rounded-2xl p-5">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Oportunidades
        </h4>
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

      {recomendaciones.map((rec, idx) => (
        <RecomendacionCard key={idx} recomendacion={rec} />
      ))}

      <ActionButton emoji="✂️" text="Optimizar Ahora" onClick={onOpenOptimizer} />
    </div>
  );
}

function KPICard({ label, value, icon, color, bg }) {
  return (
    <div className={`bg-gradient-to-br ${bg} backdrop-blur-md rounded-xl p-3 border`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold uppercase text-white/40">{label}</span>
        <div className={`${color}`}>{icon}</div>
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
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-300 flex items-center gap-1"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver'} pasos
          </button>
          {expanded && (
            <div className="mt-2 space-y-1 pl-4">
              {recomendacion.pasos.map((paso, idx) => (
                <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>{paso}</span>
                </div>
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
        <div>
          <div className="text-white text-xs font-semibold">{fuga.tipo}</div>
          <div className="text-gray-400 text-[10px]">{fuga.frecuencia}x • {formatMoney(fuga.gastoActual)}</div>
        </div>
      </div>
      <div className="text-green-400 text-xs font-bold">
        {formatMoney(fuga.ahorroEstimado)}
      </div>
    </div>
  );
}

function DeudaCardCompact({ deuda }) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="flex justify-between items-center">
        <span className="text-white text-xs font-semibold">{deuda.nombre || 'Deuda'}</span>
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
        <span>{label}</span>
        <span>{formatMoney(value)} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActionButton({ emoji, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 text-white font-semibold text-sm transition-all active:scale-95"
    >
      <span className="text-xl">{emoji}</span>
      {text}
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white">Selecciona tu Objetivo</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-400">
            FinGuide ajustará sus recomendaciones
          </p>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {objetivos.map((obj) => {
            const esRecomendado = obj.key === recomendado;
            const esActual = obj.key === objetivoActual;

            return (
              <button
                key={obj.key}
                onClick={() => onSelect(obj.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 text-left ${
                  esActual
                    ? 'bg-purple-600 border-purple-500 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${obj.color} flex items-center justify-center text-2xl`}>
                  {obj.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${esActual ? 'text-white' : 'text-white/90'}`}>
                      {obj.label}
                    </span>
                    {esRecomendado && !esActual && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">
                        ⭐ Recomendado
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${esActual ? 'text-purple-200' : 'text-white/50'}`}>
                    {obj.descripcion}
                  </p>
                </div>
                {esActual && <CheckCircle2 className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OptimizadorSuscripcionesReal({ suscripciones, suscripcionesOptimizables, ahorroTotalOptimizable, onClose }) {
  const [seleccionadas, setSeleccionadas] = useState([]);

  const toggleSuscripcion = (e, id) => {
    e.stopPropagation();
    setSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const ahorroSeleccionado = suscripcionesOptimizables
    .filter(s => seleccionadas.includes(s.id))
    .reduce((sum, s) => sum + Number(s.costo), 0);

  // Silenciar warning de suscripciones no usado directamente
  void suscripciones;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 w-full sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Optimizador
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {suscripcionesOptimizables.length} oportunidades
              </p>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300 mb-1">💰 Ahorro Potencial</div>
                <div className="text-2xl font-bold text-white">
                  {formatMoney(ahorroTotalOptimizable)}<span className="text-sm text-green-300">/mes</span>
                </div>
              </div>
              {seleccionadas.length > 0 && (
                <div className="text-right">
                  <div className="text-sm text-white/70">Seleccionadas</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {formatMoney(ahorroSeleccionado)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {suscripcionesOptimizables.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-white">¡Todo optimizado!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suscripcionesOptimizables.map(sub => (
                <div
                  key={sub.id}
                  onClick={(e) => toggleSuscripcion(e, sub.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    seleccionadas.includes(sub.id)
                      ? 'bg-red-500/10 border-red-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      seleccionadas.includes(sub.id)
                        ? 'bg-red-500 border-red-400'
                        : 'border-gray-500'
                    }`}>
                      {seleccionadas.includes(sub.id) && <Trash2 className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-bold text-sm">{sub.servicio}</h4>
                        <div className="text-white font-bold text-sm">{formatMoney(sub.costo)}<span className="text-xs text-gray-400">/mes</span></div>
                      </div>
                      
                      <div className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {sub.razonOptimizar}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {seleccionadas.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-slate-800/50">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Ahorrarás {formatMoney(ahorroSeleccionado)}/mes
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              * Simulación. Gestiona desde Suscripciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}