// src/components/AsistenteFinancieroV2.jsx
// 🎨 Versión Mobile-First Mejorada con Modales de Planificación

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Brain, Loader, TrendingDown, TrendingUp, AlertCircle, 
  CheckCircle2, Target, ChevronRight, Sparkles 
} from "lucide-react";

import { runIntelligence, setGoal, loadProfile } from "../lib/intelligenceEngine";
import MetaModal from "./MetaModal";
import SubscriptionOptimizerModal from "./SubscriptionOptimizerModal";

const METAS = [
  { 
    key: "general", 
    label: "Reporte General", 
    icon: "📊",
    emoji: "📊",
    color: "from-purple-500 to-indigo-500",
    descripcion: "Diagnóstico completo de tu situación"
  },
  { 
    key: "controlar_gastos", 
    label: "Controlar Gastos", 
    icon: "💸",
    emoji: "💸",
    color: "from-orange-500 to-red-500",
    descripcion: "Reduce gastos y elimina el déficit"
  },
  { 
    key: "ahorrar_mas", 
    label: "Ahorrar Más", 
    icon: "💰",
    emoji: "💰",
    color: "from-green-500 to-emerald-500",
    descripcion: "Aumenta tu tasa de ahorro"
  },
 
  { 
    key: "pagar_deudas", 
    label: "Pagar Deudas", 
    icon: "💳",
    emoji: "💳",
    color: "from-red-500 to-pink-500",
    descripcion: "Elimina deudas estratégicamente"
  },
  { 
    key: "recortar_subs", 
    label: "Optimizar Suscripciones", 
    icon: "✂️",
    emoji: "✂️",
    color: "from-yellow-500 to-orange-500",
    descripcion: "Cancela lo que no usas"
  },
];

const money = (v) => `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pct = (v) => `${(Number(v || 0) * 100).toFixed(0)}%`;

export default function AsistenteFinancieroV2({
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
  onOpenDebtPlanner,
  onOpenSavingsPlanner,
}) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
const [showSubsOptimizer, setShowSubsOptimizer] = useState(false);

  const profile = useMemo(() => {
    try {
      return loadProfile();
    } catch (e) {
      console.error("Error loading profile:", e);
      return { goal: "general" };
    }
  }, []);
  
  const [goal, setGoalState] = useState(profile?.goal || "general");

  const hasData =
    ingresos.length ||
    gastosFijos.length ||
    gastosVariables.length ||
    suscripciones.length ||
    deudas.length;

  const analizar = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        const result = runIntelligence({
          ingresos,
          gastosFijos,
          gastosVariables,
          suscripciones,
          deudas,
        });
        setOutput(result);
      } catch (error) {
        console.error("Error corriendo inteligencia:", error);
        setOutput({
          kpis: { totalIngresos: 0, totalGastos: 0, saldo: 0, tasaAhorro: 0 },
          profile: { tone: "amigable", discipline: 50 },
          report: { headline: "Error al cargar los datos.", problems: [], solutions: [], priorities: [] }
        });
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas]);

  useEffect(() => {
    if (hasData) analizar();
  }, [hasData, analizar]);

  const onChangeGoal = (g) => {
    setGoalState(g);
    if (setGoal) setGoal(g);
    setShowMetaModal(false);
    analizar();
    
    // Lógica corregida: Abrir modales al seleccionar metas específicas
    if (g === 'pagar_deudas' && onOpenDebtPlanner) {
      setTimeout(() => onOpenDebtPlanner(), 300);
    }
    if (g === 'ahorrar_mas' && onOpenSavingsPlanner) {
      setTimeout(() => onOpenSavingsPlanner(), 300);
    }
  };

  const currentMeta = METAS.find(m => m.key === goal) || METAS[0];

  const getToneMessage = () => {
    if (!output?.profile) return "Hola, soy tu asesor financiero. ¿Listo para organizar tus finanzas? 🌟";
    
    const { tone, discipline } = output.profile;
    const { saldo } = output.kpis || { saldo: 0 };
    
    if (saldo < 0) {
      if (tone === "estricto" || tone === "muy_directo") {
        return "Tenemos que hablar en serio. Estás gastando más de lo que ganas. 🚨";
      } else if (tone === "directo") {
        return "Ojo, hay un déficit este mes. Vamos a solucionarlo juntos. 💪";
      } else {
        return "Veo que este mes fue complicado, pero con pequeños ajustes lo arreglamos. 🌟";
      }
    } else if (saldo > 0) {
      return discipline > 70 
        ? "¡Vas excelente! Tu disciplina está dando resultados increíbles. 🔥"
        : "¡Bien! Vas por buen camino. Mantengamos el impulso. ✨";
    }
    return "Estamos equilibrados. Es un buen momento para optimizar. 👍";
  };

  if (!hasData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-20 h-20 text-purple-300 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Asistente Financiero</h2>
          <p className="text-purple-200">Agrega tus datos para comenzar</p>
        </div>
      </div>
    );
  }
// 🔍 DEBUG COMPONENTES
  console.log("DEBUG COMPONENTES:", {
    ReporteGeneralMobile,
    MetaAutomaticaMobile,
    ExpandableCard,
    ControlGastosMobile,
    AhorrarMasMobile,
    FondoEmergenciaMobile,
    RecortarSubsMobile,
    InsightCard,
  });
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-300 mx-auto mb-4 animate-spin" />
          <p className="text-purple-200 text-lg">Analizando tu situación...</p>
          <p className="text-purple-300 text-sm mt-2">Calculando recomendaciones personalizadas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 pb-24">
      
      {/* SECCIÓN 1: EL ASESOR (Hero Section) */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/10">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Tu Asesor Financiero</h1>
          <p className="text-lg text-purple-100 leading-relaxed font-light">
            {getToneMessage()}
          </p>
        </div>
      </div>

      {/* SECCIÓN 2: META ACTUAL */}
      <div className="mb-6">
        <button
          onClick={() => setShowMetaModal(true)}
          className="w-full bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {currentMeta.emoji}
              </div>
              <div className="text-left">
                <div className="text-purple-300 text-xs font-medium uppercase tracking-wider mb-0.5">Enfoque actual</div>
                <div className="text-white font-bold text-lg">{currentMeta.label}</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-purple-300" />
            </div>
          </div>
        </button>
      </div>

      {/* SECCIÓN 3: KPIs */}
      {output?.kpis && (
        <div className="mb-6">
          <h3 className="text-white/60 text-sm font-bold uppercase mb-3 px-1">Resumen Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Ingresos"
              value={money(output.kpis.totalIngresos)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="from-emerald-500/20 to-green-500/20 border-emerald-500/30"
              textColor="text-emerald-300"
            />
            <KPICard
              label="Gastos"
              value={money(output.kpis.totalGastos)}
              icon={<TrendingDown className="w-5 h-5" />}
              color="from-orange-500/20 to-red-500/20 border-orange-500/30"
              textColor="text-orange-300"
            />
            <KPICard
              label="Saldo"
              value={money(output.kpis.saldo)}
              icon={output.kpis.saldo >= 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              color={output.kpis.saldo >= 0 ? "from-blue-500/20 to-cyan-500/20 border-blue-500/30" : "from-red-500/20 to-pink-500/20 border-red-500/30"}
              textColor={output.kpis.saldo >= 0 ? "text-blue-300" : "text-red-300"}
            />
            <KPICard
              label="Ahorro"
              value={pct(output.kpis.tasaAhorro)}
              icon={<Target className="w-5 h-5" />}
              color="from-purple-500/20 to-indigo-500/20 border-purple-500/30"
              textColor="text-purple-300"
            />
          </div>
        </div>
      )}

      {/* SECCIÓN 4: CONTENIDO DETALLADO */}
      <div>
        {goal === "general" ? (
          output?.report && output?.kpis && output?.profile ? (
            <ReporteGeneralMobile 
              report={output.report} 
              kpis={output.kpis} 
              profile={output.profile}
              onOpenDebtPlanner={onOpenDebtPlanner}
              onOpenSavingsPlanner={onOpenSavingsPlanner}
              deudas={deudas}
            />
          ) : null
        ) : (
          output?.autoGoal && (
            <MetaAutomaticaMobile 
              autoGoal={output.autoGoal} 
              onChangeMeta={() => setShowMetaModal(true)}
              onOpenDebtPlanner={onOpenDebtPlanner}
              onOpenSavingsPlanner={onOpenSavingsPlanner}
            />
          )
        )}
      </div>

      {/* Botón flotante para re-analizar */}
      <button
        onClick={analizar}
        disabled={loading}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-indigo-900 shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50 disabled:opacity-50"
      >
        <Brain className={`w-6 h-6 ${loading ? 'animate-pulse' : ''}`} />
      </button>
      {/* Modal de selección de meta */}
      {showMetaModal && (
        <MetaModal
          metas={METAS}
          currentGoal={goal}
          onSelect={onChangeGoal}
          onClose={() => setShowMetaModal(false)}
        />
      )}

      {/* Modal de optimización de suscripciones */}
      {showSubsOptimizer && (
        <SubscriptionOptimizerModal
          suscripciones={suscripciones}
          kpis={output?.kpis}
             onClose={() => setShowSubsOptimizer(false)}
        />
      )}

    </div>
  );
}

// ========== COMPONENTES UI ==========

function KPICard({ label, value, icon, color, textColor = "text-white" }) {
  return (
    <div className={`bg-gradient-to-br ${color} backdrop-blur rounded-2xl p-4 border shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium opacity-80 ${textColor.replace('300', '400')}`}>{label}</span>
        <div className={`opacity-80 ${textColor}`}>{icon}</div>
      </div>
      <div className={`text-xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

function ReporteGeneralMobile({ report, kpis, profile, onOpenDebtPlanner, onOpenSavingsPlanner, deudas }) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!report) return null;

  // Detectar si hay problemas de deudas o necesidad de ahorro
  const hasDebtProblems = deudas && deudas.length > 0;
  const needsSavings = kpis.tasaAhorro < 0.10 || kpis.saldo < 0;

  return (
    <div className="space-y-4">
      
      {/* Diagnóstico Principal */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-lg">Diagnóstico</h3>
          </div>
          <p className="text-purple-100 text-sm leading-relaxed">{report.headline}</p>
        </div>
      </div>

      {/* Tarjetas de Acción Inteligentes */}
      {(hasDebtProblems || needsSavings) && (
        <div className="space-y-3">
          {hasDebtProblems && onOpenDebtPlanner && (
            <button
              onClick={onOpenDebtPlanner}
              className="w-full bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-[0.99] text-left"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-pink-600/30 rounded-lg">
                  <span className="text-2xl">💳</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Plan de Pago de Deudas</h3>
                  <p className="text-pink-200 text-sm">Tienes {deudas.length} {deudas.length === 1 ? 'deuda' : 'deudas'} • Elimínalas estratégicamente</p>
                </div>
                <ChevronRight className="w-6 h-6 text-pink-300" />
              </div>
              <div className="space-y-1 text-sm text-pink-100 pl-12">
                <p>✓ Selecciona qué deudas pagar primero</p>
                <p>✓ 3 estrategias comprobadas</p>
                <p>✓ Timeline con milestones</p>
              </div>
            </button>
          )}

          {needsSavings && onOpenSavingsPlanner && (
            <button
              onClick={onOpenSavingsPlanner}
              className="w-full bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-[0.99] text-left"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-emerald-600/30 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Crear Plan de Ahorro</h3>
                  <p className="text-emerald-200 text-sm">Ahorro actual: {pct(kpis.tasaAhorro)} • Define metas personalizadas</p>
                </div>
                <ChevronRight className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="space-y-1 text-sm text-emerald-100 pl-12">
                <p>✓ Vacaciones, compras o emergencias</p>
                <p>✓ Calcula ahorro mensual/semanal</p>
                <p>✓ Estrategias personalizadas</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Problemas */}
      {report.problems && report.problems.length > 0 && (
        <ExpandableCard
          title="Problemas Detectados"
          count={report.problems.length}
          emoji="⚠️"
          expanded={expandedSection === "problems"}
          onToggle={() => setExpandedSection(expandedSection === "problems" ? null : "problems")}
          type="danger"
        >
          <div className="space-y-2">
            {report.problems.map((p, idx) => (
              <div key={p.id || idx} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-white font-semibold text-sm mb-1">{p.title}</div>
                <div className="text-red-200 text-xs leading-relaxed">{p.detail}</div>
              </div>
            ))}
          </div>
        </ExpandableCard>
      )}

      {/* Soluciones */}
      {report.solutions && report.solutions.length > 0 && (
        <ExpandableCard
          title="Cómo Solucionarlo"
          count={report.solutions.length}
          emoji="💡"
          expanded={expandedSection === "solutions"}
          onToggle={() => setExpandedSection(expandedSection === "solutions" ? null : "solutions")}
          type="info"
        >
          <div className="space-y-2">
            {report.solutions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-300 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-purple-100 text-sm leading-relaxed flex-1">{s}</p>
              </div>
            ))}
          </div>
        </ExpandableCard>
      )}

      {/* Prioridades */}
      {report.priorities && report.priorities.length > 0 && (
        <ExpandableCard
          title="Tus Prioridades"
          count={report.priorities.length}
          emoji="🎯"
          expanded={expandedSection === "priorities"}
          onToggle={() => setExpandedSection(expandedSection === "priorities" ? null : "priorities")}
          type="success"
        >
          <div className="space-y-2">
            {report.priorities.map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-purple-100 text-sm leading-relaxed flex-1">{p}</p>
              </div>
            ))}
          </div>
        </ExpandableCard>
      )}
    </div>
  );
}

function ExpandableCard({ title, count, emoji, expanded, onToggle, children, type = "neutral" }) {
  const typeStyles = {
    danger: "hover:bg-red-500/5",
    info: "hover:bg-blue-500/5",
    success: "hover:bg-green-500/5",
    neutral: "hover:bg-white/5"
  };

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between transition-all active:scale-[0.99] ${typeStyles[type]}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div className="text-left">
            <div className="text-white font-semibold">{title}</div>
            <div className="text-purple-300 text-xs">{count} {count === 1 ? 'elemento' : 'elementos'}</div>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-purple-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
}

function MetaAutomaticaMobile({ autoGoal, onChangeMeta, onOpenDebtPlanner, onOpenSavingsPlanner }) {
  if (!autoGoal) return null;

  const { title, auto, progress, status, insights } = autoGoal;

  const statusConfig = {
    achieved: { bg: "from-green-500/20 to-emerald-500/20 border-green-500/30", text: "¡Logrado!", icon: CheckCircle2, textCol: "text-green-300" },
    on_track: { bg: "from-blue-500/20 to-cyan-500/20 border-blue-500/30", text: "En camino", icon: TrendingUp, textCol: "text-blue-300" },
    alert: { bg: "from-red-500/20 to-pink-500/20 border-red-500/30", text: "Atención", icon: AlertCircle, textCol: "text-red-300" },
    needs_work: { bg: "from-orange-500/20 to-yellow-500/20 border-orange-500/30", text: "Requiere acción", icon: Target, textCol: "text-orange-300" },
    neutral: { bg: "from-purple-500/20 to-indigo-500/20 border-purple-500/30", text: "Activo", icon: Brain, textCol: "text-purple-300" },
  };

  const config = statusConfig[status] || statusConfig.neutral;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header de meta */}
      <div className={`bg-gradient-to-br ${config.bg} backdrop-blur border rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${config.textCol}`}>{title}</h2>
          <div className={`p-2 rounded-full bg-white/5 ${config.textCol}`}>
            <StatusIcon className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <div className="flex-1">
            <div className="font-medium">{progress?.message || "Progreso activo"}</div>
          </div>
        </div>
      </div>

      {/* Métricas específicas según tipo */}
      {autoGoal.type === "controlar_gastos" && <ControlGastosMobile auto={auto} />}
      
      {autoGoal.type === "ahorrar_mas" && (
        <>
          <AhorrarMasMobile auto={auto} />
          {onOpenSavingsPlanner && (
            <button
              onClick={onOpenSavingsPlanner}
              className="w-full bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-[0.99] text-left"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-emerald-600/30 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Crear Plan de Ahorro</h3>
                  <p className="text-emerald-200 text-sm">Define metas personalizadas y alcánzalas</p>
                </div>
                <ChevronRight className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="space-y-1 text-sm text-emerald-100 pl-12">
                <p>✓ Vacaciones, compras o fondo de emergencia</p>
                <p>✓ Calcula ahorro mensual/semanal</p>
                <p>✓ Estrategias personalizadas</p>
              </div>
            </button>
          )}
        </>
      )}
      
      {autoGoal.type === "fondo_emergencia" && (
        <>
          <FondoEmergenciaMobile auto={auto} />
          {onOpenSavingsPlanner && (
            <button
              onClick={onOpenSavingsPlanner}
              className="w-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-[0.99] text-left"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-600/30 rounded-lg">
                  <span className="text-2xl">🛡️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Plan de Fondo de Emergencia</h3>
                  <p className="text-blue-200 text-sm">Construye tu colchón financiero</p>
                </div>
                <ChevronRight className="w-6 h-6 text-blue-300" />
              </div>
              <div className="space-y-1 text-sm text-blue-100 pl-12">
                <p>✓ Cálculo automático de 3-6 meses de gastos</p>
                <p>✓ Plan mensual personalizado</p>
                <p>✓ Tracking de progreso</p>
              </div>
            </button>
          )}
        </>
      )}
      
      {autoGoal.type === "pagar_deudas" && onOpenDebtPlanner && (
        <button
          onClick={onOpenDebtPlanner}
          className="w-full bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-[0.99] text-left"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-pink-600/30 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">Plan de Pago de Deudas</h3>
              <p className="text-pink-200 text-sm">Elimina deudas estratégicamente</p>
            </div>
            <ChevronRight className="w-6 h-6 text-pink-300" />
          </div>
          <div className="space-y-1 text-sm text-pink-100 pl-12">
            <p>✓ Selecciona qué deudas pagar primero</p>
            <p>✓ 3 estrategias comprobadas (Avalancha, Bola de Nieve)</p>
            <p>✓ Timeline mes a mes con milestones</p>
          </div>
        </button>
      )}
      
      {autoGoal.type === "recortar_subs" && <RecortarSubsMobile auto={auto} />}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/60 text-xs font-bold uppercase px-1">Consejos Rápidos</h4>
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}

      {/* CTA para cambiar meta */}
      <button
        onClick={onChangeMeta}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold p-4 rounded-xl transition-all active:scale-[0.99]"
      >
        Cambiar Meta
      </button>
    </div>
  );
}

function ControlGastosMobile({ auto }) {
  if (!auto) return null;
  const { currentGastos = 0, targetGastos = 0, reductionNeeded = 0, reductionPercent = 0 } = auto;
  const progress = targetGastos > 0 ? Math.min(100, (targetGastos / currentGastos) * 100) : 0;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Meta de gastos</span>
          <span className="text-white font-bold">{money(targetGastos)}/mes</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-400 h-full transition-all duration-700 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 text-purple-300">
          <span>Actual: {money(currentGastos)}</span>
          <span>Reduce: {money(reductionNeeded)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricMiniCard label="Reducir" value={money(reductionNeeded)} sublabel={`${reductionPercent}%`} />
        <MetricMiniCard label="Objetivo" value={money(targetGastos)} sublabel="mensual" />
      </div>
    </div>
  );
}

function AhorrarMasMobile({ auto }) {
  if (!auto) return null;
  const { currentRate = 0, targetRate = 0, recommendedMonthly = 0, monthlyGap = 0 } = auto;
  const progress = targetRate > 0 ? (currentRate / targetRate) * 100 : 0;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Tasa de ahorro</span>
          <span className="text-white font-bold">{currentRate}% → {targetRate}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-400 h-full transition-all duration-700 rounded-full"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricMiniCard label="Ahorra mensual" value={money(recommendedMonthly)} sublabel={`${targetRate}%`} />
        <MetricMiniCard label="Gap actual" value={money(monthlyGap)} sublabel="faltante" />
      </div>
    </div>
  );
}

function FondoEmergenciaMobile({ auto }) {
  if (!auto) return null;
  const { currentAmount = 0, targetAmount = 0, recommendedMonthly = 0, progressPercent = 0, monthsToComplete = 0 } = auto;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Fondo de emergencia</span>
          <span className="text-white font-bold">{money(currentAmount)} / {money(targetAmount)}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full transition-all duration-700 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-center text-purple-300 text-xs mt-2">
          {progressPercent}% completado
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricMiniCard label="Mensual" value={money(recommendedMonthly)} compact />
        <MetricMiniCard label="Tiempo" value={`${monthsToComplete}m`} compact />
        <MetricMiniCard label="Faltan" value={money(targetAmount - currentAmount)} compact />
      </div>
    </div>
  );
}

function RecortarSubsMobile({ auto }) {
  if (!auto) return null;
  const { currentTotal = 0, targetTotal = 0, reductionNeeded = 0, percentOfIncome = 0 } = auto;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
      <div className="grid grid-cols-2 gap-3">
        <MetricMiniCard 
          label="Actual" 
          value={money(currentTotal)} 
          sublabel={`${percentOfIncome}% ingresos`} 
        />
        <MetricMiniCard 
          label="Meta" 
          value={money(targetTotal)} 
          sublabel="5% ingresos" 
        />
      </div>
      
      {reductionNeeded > 0 && (
        <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <div className="text-orange-200 text-sm font-medium">
            💡 Recorta {money(reductionNeeded)} en suscripciones
          </div>
        </div>
      )}
    </div>
  );
}

function MetricMiniCard({ label, value, sublabel, compact = false }) {
  return (
    <div className={`bg-white/5 rounded-xl border border-white/5 ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`text-purple-300 ${compact ? 'text-[10px]' : 'text-xs'} mb-1 uppercase tracking-wide font-semibold`}>{label}</div>
      <div className={`text-white font-bold ${compact ? 'text-sm' : 'text-lg'}`}>{value}</div>
      {sublabel && <div className="text-purple-400 text-xs mt-1">{sublabel}</div>}
    </div>
  );
}

function InsightCard({ insight }) {
  const { priority = "medium", icon, text } = insight || {};

  const priorityConfig = {
    urgent: "bg-red-500/10 border-red-500/20 text-red-200",
    high: "bg-orange-500/10 border-orange-500/20 text-orange-200",
    medium: "bg-blue-500/10 border-blue-500/20 text-blue-200",
    success: "bg-green-500/10 border-green-500/20 text-green-200",
  };

  const styleClass = priorityConfig[priority] || "bg-white/10 border-white/20 text-white";

  return (
    <div className={`${styleClass} border rounded-xl p-4 flex items-start gap-3`}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <p className="text-sm leading-relaxed flex-1 font-medium">{text}</p>
    </div>
  );
}