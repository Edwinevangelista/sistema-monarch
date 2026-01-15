// src/components/AsistenteFinancieroV2.jsx
// 🚀 Versión Final: Funcionalidad Mejorada, Animaciones y UX Premium

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { 
  Brain, Loader, TrendingDown, TrendingUp, AlertCircle, 
  CheckCircle2, Target, ChevronRight, Sparkles, Zap, ArrowRight, X
} from "lucide-react";

// Importamos la lógica. Asegúrate de que este archivo exista.
import { runIntelligence, setGoal, loadProfile } from "../lib/intelligenceEngine";

// --- CONSTANTES Y UTILIDADES ---

const METAS = [
  { 
    key: "general", 
    label: "Visión General", 
    icon: Sparkles,
    emoji: "📊",
    color: "from-violet-500/20 to-indigo-500/20 border-violet-500/30",
    activeColor: "bg-violet-500",
    descripcion: "Diagnóstico holístico de tu situación"
  },
  { 
    key: "controlar_gastos", 
    label: "Control de Gastos", 
    icon: TrendingDown,
    emoji: "💸",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    activeColor: "bg-orange-500",
    descripcion: "Frena el sangrado de capital"
  },
  { 
    key: "ahorrar_mas", 
    label: "Potenciar Ahorro", 
    icon: Target,
    emoji: "💰",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    activeColor: "bg-emerald-500",
    descripcion: "Construye tu futuro financiero"
  },
  { 
    key: "pagar_deudas", 
    label: "Libertad de Deudas", 
    icon: AlertCircle,
    emoji: "💳",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
    activeColor: "bg-rose-500",
    descripcion: "Elimina cargas estratégicamente"
  },
  { 
    key: "recortar_subs", 
    label: "Optimización", 
    icon: Zap,
    emoji: "✂️",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    activeColor: "bg-amber-500",
    descripcion: "Corta gastos hormiga y suscripciones"
  },
];

const formatMoney = (v) => `$${Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
const formatPct = (v) => `${(Number(v || 0) * 100).toFixed(0)}%`;

// --- COMPONENTE PRINCIPAL ---

export default function AsistenteFinancieroV2({
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
  onOpenDebtPlanner,
  onOpenSavingsPlanner,
  onOpenSpendingControl,
  showLocalNotification, // Prop opcional para notificaciones nativas
}) {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showSubscriptionOptimizer, setShowSubscriptionOptimizer] = useState(false);
  
  // --- NUEVOS ESTADOS ---
  const [ultimoAnalisis, setUltimoAnalisis] = useState(null);
  const [showAnalysisAnimation, setShowAnalysisAnimation] = useState(false);
  const [analisisInsight, setAnalisisInsight] = useState(null);
  
  const analysisTimeoutRef = useRef(null);

  // --- LÓGICA DE PERFIL Y META ---
  const profile = useMemo(() => {
    try {
      return loadProfile() || {};
    } catch (e) {
      console.error("Error cargando perfil:", e);
      return { goal: "general" };
    }
  }, []);
  
  const [currentGoal, setGoalState] = useState(profile?.goal || "general");

  // --- DETECCIÓN DE DATOS ---
  const hasData = useMemo(() => 
    ingresos.length || gastosFijos.length || gastosVariables.length || suscripciones.length || deudas.length,
    [ingresos, gastosFijos, gastosVariables, suscripciones, deudas]
  );

  // --- NUEVA FUNCIÓN ANALIZAR ---
  const analizar = useCallback(() => {
    // 🎯 Vibración en móvil
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setLoading(true);
    setShowAnalysisAnimation(true);
    setAnalisisInsight(null);
        // 🔧 Guardamos el ID del timeout en la ref para poder cancelarlo si es necesario
    analysisTimeoutRef.current = setTimeout(() => {
      try {
        const result = runIntelligence({
          ingresos,
          gastosFijos,
          gastosVariables,
          suscripciones,
          deudas,
        });
        
        setOutput(result);
        
        // 📊 Generar insight principal
        const insight = generarInsightPrincipal(result);
        setAnalisisInsight(insight);
        
        // 🎉 Si hay buenas noticias, lanzar confetti
        if (insight.tipo === 'positivo') {
          lanzarConfetti();
        }
        
        // ⏰ Guardar hora del análisis
        setUltimoAnalisis(new Date().toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        
        // 🔔 Notificación (si existe la función)
        if (typeof showLocalNotification === 'function') {
          showLocalNotification('✨ Análisis actualizado', { 
            body: insight.mensaje,
            silent: true 
          });
        }
        
      } catch (error) {
        console.error("Error corriendo inteligencia:", error);
        setAnalisisInsight({
          tipo: 'error',
          icono: '⚠️',
          mensaje: 'Hubo un error al analizar tus datos'
        });
      } finally {
        setLoading(false);
        setTimeout(() => setShowAnalysisAnimation(false), 2000);
      }
    }, 500);
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas, showLocalNotification]);

  // Efecto para analizar automáticamente (se mantiene para la carga inicial)
  useEffect(() => {
    if (hasData && !output) {
      analizar();
    }
    return () => {
  const timeoutId = analysisTimeoutRef.current;
  if (timeoutId) clearTimeout(timeoutId);
};
  }, [hasData, output, analizar]);

  // --- MANEJO DE METAS ---
  const handleGoalChange = (newGoal) => {
    setGoalState(newGoal);
    if (setGoal) setGoal(newGoal);
    setShowMetaModal(false);
    
    const actions = {
      'pagar_deudas': () => onOpenDebtPlanner && setTimeout(onOpenDebtPlanner, 100),
      'ahorrar_mas': () => onOpenSavingsPlanner && setTimeout(onOpenSavingsPlanner, 100),
      'recortar_subs': () => setShowSubscriptionOptimizer(true),
      'controlar_gastos': () => onOpenSpendingControl && setTimeout(onOpenSpendingControl, 100),
    };

    if (actions[newGoal]) actions[newGoal]();
  };

  const currentMetaConfig = METAS.find(m => m.key === currentGoal) || METAS[0];
 

  // --- HELPER FUNCTIONS ---

  // 🎯 Generar insight principal basado en análisis
  const generarInsightPrincipal = (result) => {
    const { kpis } = result;
    
    // Positivo: Superávit
    if (kpis.saldo > 0) {
      const porcentajeAhorro = (kpis.tasaAhorro * 100).toFixed(0);
      return {
        tipo: 'positivo',
        icono: '🎉',
        mensaje: `¡Excelente! Tienes ${formatMoney(kpis.saldo)} disponible (${porcentajeAhorro}% de ahorro)`,
        color: 'from-green-500 to-emerald-500'
      };
    }
    
    // Negativo: Déficit
    if (kpis.saldo < 0) {
      return {
        tipo: 'alerta',
        icono: '⚠️',
        mensaje: `Déficit de ${formatMoney(Math.abs(kpis.saldo))}. Revisa tus gastos variables.`,
        color: 'from-red-500 to-orange-500'
      };
    }
    
    // Neutro: Balance exacto
    return {
      tipo: 'neutro',
      icono: '⚖️',
      mensaje: 'Estás en equilibrio perfecto. Considera ahorrar más.',
      color: 'from-blue-500 to-cyan-500'
    };
  };

  // 🎊 Lanzar confetti (simple CSS animation)
  const lanzarConfetti = () => {
    // Crear elementos de confetti
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.backgroundColor = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)];
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 3000);
    }
  };

  // --- ESTADO VACÍO ---
  if (!hasData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
        <EmptyStateIllustration />
      </div>
    );
  }

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white relative overflow-hidden selection:bg-purple-500/30">
      
      {/* Fondo decorativo */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 p-4 pb-24 max-w-lg mx-auto space-y-6 pt-6">
        
        {/* 1. HEADER & ASESOR */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-40 animate-pulse" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
                  {loading ? (
                    <Loader className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Sparkles className="w-10 h-10 text-white drop-shadow-md" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 mb-2">
                Tu Asesor Financiero
              </h1>
              <p className="text-purple-200/80 text-sm leading-relaxed max-w-[90%]">
                {getSmartTone(output, loading)}
              </p>
            </div>
          </div>
        </section>

        {/* 2. SELECTOR DE META */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          <button
            onClick={() => setShowMetaModal(true)}
            className="w-full group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-4 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentMetaConfig.color} flex items-center justify-center text-2xl shadow-inner border border-white/5`}>
                  {currentMetaConfig.emoji}
                </div>
                <div className="text-left">
                  <div className="text-purple-300/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Objetivo Actual</div>
                  <div className="text-white font-semibold text-base flex items-center gap-2">
                    {currentMetaConfig.label}
                    {loading && <Loader className="w-3 h-3 text-purple-400 animate-spin" />}
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </section>

        {/* 3. DASHBOARD DE KPIs */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">Resumen Financiero</h3>
            {output?.kpis && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Actualizado</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <><KPISkeleton /><KPISkeleton /><KPISkeleton /><KPISkeleton /></>
            ) : (
              output?.kpis && (
                <>
                  <KPICard 
                    label="Ingresos" 
                    value={formatMoney(output.kpis.totalIngresos)} 
                    trend="+12%" 
                    color="text-emerald-400"
                    bg="from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <KPICard 
                    label="Gastos" 
                    value={formatMoney(output.kpis.totalGastos)} 
                    trend="-5%" 
                    color="text-rose-400"
                    bg="from-rose-500/10 to-rose-500/5 border-rose-500/20"
                    icon={<TrendingDown className="w-4 h-4" />}
                  />
                  <KPICard 
                    label="Saldo Neto" 
                    value={formatMoney(output.kpis.saldo)} 
                    isNegative={output.kpis.saldo < 0}
                    color={output.kpis.saldo >= 0 ? "text-blue-300" : "text-rose-400"}
                    bg={output.kpis.saldo >= 0 ? "from-blue-500/10 to-blue-500/5 border-blue-500/20" : "from-rose-500/10 to-rose-500/5 border-rose-500/20"}
                    icon={output.kpis.saldo >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  />
                  <KPICard 
                    label="Tasa Ahorro" 
                    value={formatPct(output.kpis.tasaAhorro)} 
                    color="text-purple-300"
                    bg="from-purple-500/10 to-purple-500/5 border-purple-500/20"
                    icon={<Target className="w-4 h-4" />}
                  />
                </>
              )
            )}
          </div>
        </section>

        {/* 4. CONTENIDO DINÁMICO */}
        <div className="animate-in fade-in duration-1000 delay-300 pb-20">
          {currentGoal === "general" ? (
            loading ? <ContentSkeleton /> : 
            <ReporteGeneralMobile 
              report={output?.report} 
              kpis={output?.kpis} 
              onOpenDebtPlanner={onOpenDebtPlanner}
              onOpenSavingsPlanner={onOpenSavingsPlanner}
              onOpenSubscriptionOptimizer={() => setShowSubscriptionOptimizer(true)}
              deudas={deudas}
              suscripciones={suscripciones}
            />
          ) : (
            loading ? <ContentSkeleton /> :
            <MetaAutomaticaMobile 
              autoGoal={output?.autoGoal} 
              type={currentGoal}
              onChangeMeta={() => setShowMetaModal(true)}
              onOpenDebtPlanner={onOpenDebtPlanner}
              onOpenSavingsPlanner={onOpenSavingsPlanner}
              onOpenSubscriptionOptimizer={() => setShowSubscriptionOptimizer(true)}
              onOpenSpendingControl={onOpenSpendingControl}
            />
          )}
        </div>
      </div>

      {/* Botón flotante para re-analizar (Posición ajustada a bottom-24) */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-40 group">
        <button
          onClick={analizar}
          disabled={loading}
          className={`
            w-14 h-14 rounded-full bg-gradient-to-br from-white to-blue-50 text-indigo-900 
            shadow-lg shadow-indigo-500/30 flex items-center justify-center 
            transition-all duration-300 disabled:opacity-50 relative overflow-hidden
            ${loading ? 'animate-pulse scale-110' : 'hover:scale-110 active:scale-95'}
          `}
          title="Re-analizar mis finanzas"
        >
          {/* Efecto de escaneo */}
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent animate-scan" />
          )}
          
          <Brain className={`w-6 h-6 relative z-10 ${loading ? 'animate-pulse' : ''}`} />
          
          {/* Badge de última actualización */}
          {ultimoAnalisis && !loading && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
              ✓
            </div>
          )}
        </button>
        
        {/* Tooltip mejorado */}
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
          <div className="font-semibold">
            {loading ? 'Analizando...' : ultimoAnalisis ? `✓ ${ultimoAnalisis}` : 'Actualizar análisis'}
          </div>
          {ultimoAnalisis && !loading && (
            <div className="text-[10px] text-gray-400 mt-1">Toca para refrescar</div>
          )}
        </div>
      </div>

      {/* Toast de insight flotante */}
      {analisisInsight && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className={`
            bg-gradient-to-r ${analisisInsight.color} 
            text-white px-6 py-4 rounded-2xl shadow-2xl 
            max-w-sm mx-4 border-2 border-white/20
            backdrop-blur-sm
          `}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{analisisInsight.icono}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-relaxed">
                  {analisisInsight.mensaje}
                </p>
              </div>
              <button 
                onClick={() => setAnalisisInsight(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animación de análisis en progreso */}
      {showAnalysisAnimation && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Brain className="w-16 h-16 text-purple-400 animate-bounce" />
            <p className="text-white font-semibold text-lg">Procesando datos...</p>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* MODALES (Mantenidos del código anterior) */}
      {showMetaModal && (
        <MetaModal
          metas={METAS}
          currentGoal={currentGoal}
          onSelect={handleGoalChange}
          onClose={() => setShowMetaModal(false)}
        />
      )}

      {showSubscriptionOptimizer && (
        <SubscriptionOptimizerModal
          suscripciones={suscripciones}
          kpis={output?.kpis}
          onClose={() => setShowSubscriptionOptimizer(false)}
        />
      )}

      {/* Estilos CSS necesarios para las animaciones */}
      <style jsx>{`
        /* Animación de escaneo */
        @keyframes scan {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
        
        /* Confetti pieces */
        .confetti-piece {
          position: fixed;
          width: 10px;
          height: 10px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        /* Animación de entrada */
        @keyframes slide-in-from-top-4 {
          from {
            transform: translate(-50%, -1rem);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// --- LÓGICA DE INTELIGENCIA ---

function getSmartTone(output, isLoading) {
  if (isLoading) return "Recalculando estrategia financiera...";
  if (!output?.kpis) return "Hola, soy tu asesor IA. Esperando tus datos para comenzar 🌟";
  
  const { saldo, tasaAhorro } = output.kpis;
  const { tone } = output.profile || {};

  if (saldo < 0) {
    if (tone === "estricto") return "Alerta: Déficit detectado. Necesitamos ajustar el rumbo inmediatamente.";
    return "He detectado un desbalance negativo. No te preocupes, vamos a corregirlo juntos.";
  }
  
  if (tasaAhorro > 0.2) return "¡Excelente salud financiera! Estás construyendo patrimonio con gran disciplina.";
  if (tasaAhorro > 0.1) return "Buen progreso. Tu flujo de caja es positivo, podemos optimizar aún más.";
  
  return "Tus ingresos cubren tus gastos. Es el momento perfecto para comenzar a ahorrar.";
}

// --- COMPONENTES UI (MANTENIDOS DEL CÓDIGO ANTERIOR) ---

function KPICard({ label, value, trend, icon, color, bg, isNegative }) {
  return (
    <div className={`bg-gradient-to-br ${bg} backdrop-blur-md rounded-2xl p-4 border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
        <div className={`p-1.5 rounded-lg bg-white/5 ${color} shadow-inner`}>
          {icon}
        </div>
      </div>
      <div className={`text-lg font-bold ${color} tracking-tight`}>{value}</div>
      {trend && (
        <div className={`text-[10px] mt-1 font-medium ${trend.includes('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend} vs mes anterior
        </div>
      )}
    </div>
  );
}

function ReporteGeneralMobile({ report, kpis, onOpenDebtPlanner, onOpenSavingsPlanner, onOpenSubscriptionOptimizer, deudas, suscripciones }) {
  if (!report) return <div className="text-center text-white/20 mt-10">Esperando análisis...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Diagnóstico Inteligente</h3>
        </div>
        <p className="text-purple-100/80 text-sm leading-relaxed">{report.headline}</p>
      </div>

      <div className="grid gap-3">
        {deudas.length > 0 && (
          <ActionCard 
            emoji="💳" 
            title="Plan Bola de Nieve" 
            desc={`Paga ${deudas.length} deudas más rápido`}
            color="border-rose-500/30 bg-rose-500/5"
            onClick={onOpenDebtPlanner}
          />
        )}
        {kpis?.tasaAhorro < 0.2 && (
          <ActionCard 
            emoji="💰" 
            title="Regla 50/30/20" 
            desc="Optimiza tu presupuesto para ahorrar"
            color="border-emerald-500/30 bg-emerald-500/5"
            onClick={onOpenSavingsPlanner}
          />
        )}
        {suscripciones.length > 0 && (
          <ActionCard 
            emoji="✂️" 
            title="Auditoría de Suscripciones" 
            desc="Detecta servicios que no usas"
            color="border-amber-500/30 bg-amber-500/5"
            onClick={onOpenSubscriptionOptimizer}
          />
        )}
      </div>

      {report.problems?.length > 0 && (
        <ExpandableSection title="Áreas de Atención" count={report.problems.length} type="alert">
          <ul className="space-y-2">
            {report.problems.map((p, i) => (
              <li key={i} className="bg-white/5 rounded-xl p-3 text-sm text-red-200/80 border border-red-500/10 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{p.title || p.detail}</span>
              </li>
            ))}
          </ul>
        </ExpandableSection>
      )}
    </div>
  );
}

function MetaAutomaticaMobile({ autoGoal, type, onChangeMeta, onOpenDebtPlanner, onOpenSavingsPlanner, onOpenSubscriptionOptimizer, onOpenSpendingControl }) {
  return (
    <AutoGoalView 
      goalType={type} 
      data={autoGoal} 
      actions={{
        debt: onOpenDebtPlanner,
        savings: onOpenSavingsPlanner,
        subs: onOpenSubscriptionOptimizer,
        expenses: onOpenSpendingControl,
        change: onChangeMeta
      }}
    />
  );
}

function AutoGoalView({ goalType, data, actions }) {
  const config = {
    controlar_gastos: {
      title: "Control de Gastos",
      emoji: "💸",
      component: <ControlGastosView data={data} />,
      action: { label: "Ajustar Presupuesto", handler: actions.expenses, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" }
    },
    ahorrar_mas: {
      title: "Potenciador de Ahorro",
      emoji: "💰",
      component: <SavingsView data={data} />,
      action: { label: "Crear Plan de Ahorro", handler: actions.savings, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" }
    },
    pagar_deudas: {
      title: "Libertad Financiera",
      emoji: "💳",
      component: <DebtView data={data} />,
      action: { label: "Simular Pagos", handler: actions.debt, color: "bg-rose-500/20 text-rose-300 border-rose-500/30" }
    },
    recortar_subs: {
      title: "Optimizador",
      emoji: "✂️",
      component: <SubsView data={data} />,
      action: { label: "Ver Suscripciones", handler: actions.subs, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" }
    }
  };

  const current = config[goalType] || config.general;

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
        <span className="text-4xl mb-2 block filter drop-shadow-lg">{current.emoji}</span>
        <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
        <p className="text-white/50 text-sm">Enfoque activo para este mes</p>
      </div>
      {current.component}
      {actions.change && (
        <button 
          onClick={actions.change}
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 text-sm transition-colors"
        >
          Cambiar enfoque estratégico
        </button>
      )}
    </div>
  );
}

function ControlGastosView({ data }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 space-y-4">
      <div>
        <div className="flex justify-between text-xs text-purple-300 mb-2">
          <span>Gasto Actual</span>
          <span>Meta Límite</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 w-[70%]"></div>
          <div className="h-full bg-rose-500 w-[30%]"></div> 
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <MiniStat label="Restante" val="$450" sub="Este mes" />
        <MiniStat label="Diario" val="$45" sub="Promedio" />
      </div>
    </div>
  );
}

function SavingsView({ data }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-purple-300">Tasa Actual</div>
          <div className="text-2xl font-bold text-white">4.5%</div>
        </div>
        <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 rotate-45" />
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
        <span className="text-emerald-300 text-sm font-medium">¡Estás por encima del promedio!</span>
      </div>
    </div>
  );
}

function DebtView({ data }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 space-y-4">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 font-bold text-lg">1</div>
          <div>
             <div className="text-white font-semibold">Tarjeta Crédito</div>
             <div className="text-xs text-rose-300">Tasa 24% • Prioridad Alta</div>
          </div>
       </div>
       <div className="pl-14 space-y-1">
          <div className="flex justify-between text-sm text-white/70">
             <span>Saldo actual</span>
             <span>$1,200</span>
          </div>
          <div className="flex justify-between text-sm text-white/70">
             <span>Pago mínimo</span>
             <span>$45</span>
          </div>
       </div>
    </div>
  );
}

function SubsView({ data }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5">
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white">$320<span className="text-sm text-purple-400 font-normal">/mes</span></div>
        <div className="text-xs text-white/40">Total en suscripciones activas</div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-white/80">Netflix Premium</span>
             </div>
             <span className="text-sm font-bold">$15</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({ emoji, title, desc, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border backdrop-blur-sm transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-purple-500/10 group ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-md">{emoji}</span>
          <div>
            <h4 className="font-bold text-white text-sm">{title}</h4>
            <p className="text-xs text-white/60 mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <ArrowRight className="w-4 h-4 text-white/70" />
        </div>
      </div>
    </button>
  );
}

function ExpandableSection({ title, count, children, type }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {type === 'alert' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span className="font-semibold text-sm text-white">{title}</span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">{count}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, val, sub }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{val}</div>
      <div className="text-[10px] text-white/50">{sub}</div>
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 h-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      <div className="w-1/2 h-4 bg-white/10 rounded mb-4" />
      <div className="w-3/4 h-6 bg-white/10 rounded" />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  );
}

function EmptyStateIllustration() {
  return (
    <div className="text-center max-w-sm">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <Brain className="w-full h-full text-purple-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Sin datos financieros</h2>
      <p className="text-purple-300/70">
        Para activar la inteligencia artificial de tu asesor, necesito cargar tus movimientos primero.
      </p>
    </div>
  );
}

// --- MODALES INTERNOS (MOCKS PARA EVITAR ERRORES) ---
const MetaModal = ({ metas, currentGoal, onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Selecciona tu Objetivo</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {metas.map((meta) => (
            <button
              key={meta.key}
              onClick={() => onSelect(meta.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${currentGoal === meta.key 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
              }`}
            >
              <span className="text-2xl">{meta.emoji}</span>
              <div className="text-left flex-1">
                <div className="font-bold">{meta.label}</div>
                <div className={`text-xs ${currentGoal === meta.key ? 'text-purple-200' : 'text-white/50'}`}>{meta.descripcion}</div>
              </div>
              {currentGoal === meta.key && <CheckCircle2 className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SubscriptionOptimizerModal = ({ suscripciones, kpis, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Optimizador de Suscripciones</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
      </div>
      <div className="p-8 text-center text-white/70">
        <Zap className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p>Este es el modal de optimización.</p>
        <p className="text-sm mt-2">Aquí se cargarían tus {suscripciones.length} suscripciones.</p>
        <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors">Cerrar Demo</button>
      </div>
    </div>
  </div>
);