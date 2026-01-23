import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, CreditCard, CheckCircle2, Zap, Snowflake,
  AlertTriangle, ChevronDown, ArrowRight, Clock, Lock,
  Shield, AlertCircle, Calendar, Target, TrendingUp
} from 'lucide-react';
import { usePlanesGuardados } from '../hooks/usePlanesGuardados';

// ==========================================
// SISTEMA DE APRENDIZAJE HISTÓRICO
// ==========================================

const BEHAVIOR_STORAGE_KEY = 'finguide_debt_behavior_profile';

function getStoredBehaviorProfile() {
  try {
    const stored = localStorage.getItem(BEHAVIOR_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Error loading behavior profile:', e);
  }
  
  return {
    disciplineScore: 0.5,
    paymentReliability: 'unknown',
    prefersFlexibility: null,
    resistsAggressivePlans: null,
    overrideCount: 0,
    acceptedRecommendations: 0,
    totalInteractions: 0,
    history: {
      plansCreated: 0,
      plansCompleted: 0,
      plansAbandoned: 0,
      paymentOverrides: 0,
      strategyOverrides: 0,
      emergencyModeTriggered: 0,
      warningsIgnored: 0,
      warningsHeeded: 0
    },
    lastUpdated: null
  };
}

function saveBehaviorProfile(profile) {
  try {
    profile.lastUpdated = new Date().toISOString();
    localStorage.setItem(BEHAVIOR_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving behavior profile:', e);
  }
}

function updateBehaviorProfile(action) {
  const profile = getStoredBehaviorProfile();
  
  switch (action) {
    case 'PLAN_CREATED':
      profile.history.plansCreated++;
      profile.totalInteractions++;
      break;
      
    case 'STRATEGY_OVERRIDE':
      profile.history.strategyOverrides++;
      profile.overrideCount++;
      profile.disciplineScore = Math.max(0, profile.disciplineScore - 0.05);
      break;
      
    case 'ACCEPTED_RECOMMENDATION':
      profile.acceptedRecommendations++;
      profile.disciplineScore = Math.min(1, profile.disciplineScore + 0.03);
      break;
      
    case 'PAYMENT_REDUCED':
      profile.history.paymentOverrides++;
      profile.prefersFlexibility = true;
      profile.disciplineScore = Math.max(0, profile.disciplineScore - 0.03);
      break;
      
    case 'PAYMENT_INCREASED':
      profile.prefersFlexibility = false;
      profile.resistsAggressivePlans = false;
      profile.disciplineScore = Math.min(1, profile.disciplineScore + 0.05);
      break;
      
    case 'WARNING_IGNORED':
      profile.history.warningsIgnored++;
      profile.disciplineScore = Math.max(0, profile.disciplineScore - 0.02);
      break;
      
    case 'WARNING_HEEDED':
      profile.history.warningsHeeded++;
      profile.disciplineScore = Math.min(1, profile.disciplineScore + 0.02);
      break;
      
    case 'EMERGENCY_MODE':
      profile.history.emergencyModeTriggered++;
      break;
      
    case 'PLAN_COMPLETED':
      profile.history.plansCompleted++;
      profile.disciplineScore = Math.min(1, profile.disciplineScore + 0.1);
      profile.paymentReliability = profile.disciplineScore > 0.7 ? 'high' : 
                                    profile.disciplineScore > 0.4 ? 'medium' : 'low';
      break;
      
    default:
      break;
  }
  
  if (profile.history.plansCreated > 0) {
    const completionRate = profile.history.plansCompleted / profile.history.plansCreated;
    if (completionRate > 0.7) profile.paymentReliability = 'high';
    else if (completionRate > 0.3) profile.paymentReliability = 'medium';
    else profile.paymentReliability = 'low';
  }
  
  saveBehaviorProfile(profile);
  return profile;
}

function getPersonalizedRecommendations(profile, analysis) {
  const recommendations = {
    aggressivenessMultiplier: 1.0,
    showExtraWarnings: false,
    allowStrategyChange: true,
    minPaymentFloor: 0,
    suggestedCopy: null
  };
  
  if (profile.disciplineScore < 0.4) {
    recommendations.aggressivenessMultiplier = 0.8;
    recommendations.showExtraWarnings = true;
    recommendations.suggestedCopy = 'Esta vez vamos por consistencia, no velocidad.';
  }
  
  if (profile.disciplineScore > 0.7) {
    recommendations.aggressivenessMultiplier = 1.2;
    recommendations.suggestedCopy = 'Tus números muestran que puedes ir más rápido.';
  }
  
  if (profile.history.paymentOverrides > 2 && profile.prefersFlexibility) {
    recommendations.minPaymentFloor = analysis?.capacidadPago * 0.7 || 0;
    recommendations.showExtraWarnings = true;
  }
  
  if (analysis?.crisisLevel === 'critical') {
    recommendations.allowStrategyChange = false;
    recommendations.aggressivenessMultiplier = 1.0;
  }
  
  return recommendations;
}

// ==========================================
// FUNCIONES DE CÁLCULO FINANCIERO
// ==========================================

function analyzeDebtSituation(deudas, kpis = {}) {
  const cleanDebts = deudas.map(d => normalizeDebt(d)).filter(d => d.balance > 0);
  
  if (cleanDebts.length === 0) return null;
  
  const totalDebt = cleanDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayments = cleanDebts.reduce((sum, d) => sum + d.pagoMinimo, 0);
  const avgInterest = cleanDebts.reduce((sum, d) => sum + d.interes, 0) / cleanDebts.length;
  const maxInterest = Math.max(...cleanDebts.map(d => d.interes));
  const minBalance = Math.min(...cleanDebts.map(d => d.balance));
  
  const monthlyInterestCost = cleanDebts.reduce((sum, d) => {
    return sum + (d.balance * (d.interes / 100) / 12);
  }, 0);
  
  const highInterestDebts = cleanDebts.filter(d => d.interes > 20);
  const interestConcentration = highInterestDebts.length > 0 
    ? (highInterestDebts.reduce((sum, d) => sum + (d.balance * d.interes / 100 / 12), 0) / monthlyInterestCost) * 100
    : 0;
  
  const disponible = Math.max(0, (kpis.saldo || 0) + ((kpis.totalIngresos || 0) - (kpis.totalGastos || 0)));
  const capacidadPago = disponible * 0.5;
  
  let crisisLevel = 'stable';
  let crisisMessage = '';
  let isEmergencyMode = false;
  
  if (totalMinPayments > disponible) {
    crisisLevel = 'critical';
    crisisMessage = 'Tus pagos mínimos superan tu disponible. MODO EMERGENCIA activado.';
    isEmergencyMode = true;
  } else if (totalDebt > (kpis.totalIngresos || 1) * 12) {
    crisisLevel = 'high';
    crisisMessage = 'Tu deuda supera un año de ingresos. Requiere acción inmediata.';
  } else if (avgInterest > 25) {
    crisisLevel = 'warning';
    crisisMessage = 'Tus tasas de interés son muy altas. Estás perdiendo dinero cada mes.';
  } else if (totalDebt < (kpis.totalIngresos || 1) * 3 && avgInterest < 20) {
    crisisLevel = 'manageable';
    crisisMessage = 'Tu situación es manejable con disciplina.';
  } else {
    crisisLevel = 'stable';
    crisisMessage = 'Situación estable. Optimicemos tu camino a la libertad.';
  }
  
  return {
    cleanDebts,
    totalDebt,
    totalMinPayments,
    avgInterest,
    maxInterest,
    minBalance,
    monthlyInterestCost,
    highInterestDebts,
    interestConcentration,
    disponible,
    capacidadPago,
    crisisLevel,
    crisisMessage,
    isEmergencyMode,
    debtCount: cleanDebts.length
  };
}

function determineOptimalStrategy(analysis, behaviorProfile = null) {
  if (!analysis) return { strategy: 'avalancha', confidence: 0, reason: '' };
  
  const { highInterestDebts, cleanDebts, avgInterest, minBalance, totalDebt, isEmergencyMode } = analysis;
  
  if (isEmergencyMode) {
    return {
      strategy: 'avalancha',
      confidence: 100,
      reason: 'En modo emergencia, la matemática manda. Cada peso cuenta.',
      alternativeReason: 'Las alternativas están bloqueadas en modo emergencia.',
      locked: true,
      lockReason: 'Modo Emergencia: El sistema ha determinado la única estrategia viable.'
    };
  }
  
  let strategy = 'avalancha';
  let confidence = 85;
  let reason = '';
  let alternativeReason = '';
  
  if (highInterestDebts.length > 0 && avgInterest > 20) {
    strategy = 'avalancha';
    confidence = 95;
    reason = `Tienes ${highInterestDebts.length} deuda(s) con interés superior al 20%. Matemáticamente, atacar el interés primero te ahorra más dinero.`;
    alternativeReason = 'Bola de Nieve te daría victorias rápidas pero pagarías más intereses a largo plazo.';
  }
  else if (minBalance < totalDebt * 0.10 && cleanDebts.length >= 3) {
    strategy = 'bola_nieve';
    confidence = 80;
    reason = `Tu deuda más pequeña ($${minBalance.toLocaleString()}) se puede eliminar rápido. Las victorias tempranas mantienen la motivación.`;
    alternativeReason = 'Avalancha ahorraría algo de interés pero tardarías más en ver progreso tangible.';
  }
  else if (Math.max(...cleanDebts.map(d => d.interes)) - Math.min(...cleanDebts.map(d => d.interes)) < 5) {
    strategy = 'bola_nieve';
    confidence = 75;
    reason = 'Tus tasas de interés son similares. En este caso, la motivación psicológica de victorias rápidas es más valiosa.';
    alternativeReason = 'Avalancha tendría un impacto marginal en este escenario.';
  }
  else {
    strategy = 'avalancha';
    confidence = 85;
    reason = 'Atacar las tasas más altas primero minimiza el dinero que regalas al banco en intereses.';
    alternativeReason = 'Bola de Nieve es válida si necesitas motivación extra, pero pagarás más a largo plazo.';
  }
  
  if (behaviorProfile && behaviorProfile.disciplineScore < 0.4 && strategy === 'avalancha') {
    if (minBalance < totalDebt * 0.15) {
      strategy = 'bola_nieve';
      confidence = 70;
      reason = 'Basado en tu historial, las victorias rápidas te ayudarán a mantener el impulso.';
    }
  }
  
  return { strategy, confidence, reason, alternativeReason, locked: false };
}

function orderDebtsByStrategy(cleanDebts, strategy) {
  const debtsCopy = [...cleanDebts];
  
  if (strategy === 'avalancha') {
    return debtsCopy.sort((a, b) => b.interes - a.interes);
  } else if (strategy === 'bola_nieve') {
    return debtsCopy.sort((a, b) => a.balance - b.balance);
  } else {
    const avgInterest = debtsCopy.reduce((sum, d) => sum + d.interes, 0) / debtsCopy.length;
    const avgBalance = debtsCopy.reduce((sum, d) => sum + d.balance, 0) / debtsCopy.length;
    
    return debtsCopy.sort((a, b) => {
      const scoreA = (a.interes / avgInterest) + (1 - a.balance / avgBalance);
      const scoreB = (b.interes / avgInterest) + (1 - b.balance / avgBalance);
      return scoreB - scoreA;
    });
  }
}

function calculatePaymentOptions(analysis, behaviorProfile = null) {
  if (!analysis) return null;
  
  const { totalMinPayments, capacidadPago, disponible, isEmergencyMode } = analysis;
  const personalizedRecs = behaviorProfile ? 
    getPersonalizedRecommendations(behaviorProfile, analysis) : 
    { aggressivenessMultiplier: 1.0, minPaymentFloor: 0 };
  
  const minRequired = totalMinPayments;
  const baseRecommended = Math.max(minRequired * 1.5, capacidadPago);
  const recommended = Math.round(baseRecommended * personalizedRecs.aggressivenessMultiplier);
  const aggressive = Math.round(Math.max(minRequired, disponible * 0.7));
  const conservative = Math.round(Math.max(minRequired * 1.1, capacidadPago * 0.7));
  
  const minAllowed = isEmergencyMode ? recommended : 
    Math.max(minRequired, personalizedRecs.minPaymentFloor);
  
  return {
    minRequired: Math.round(minRequired),
    conservative,
    recommended,
    aggressive,
    minAllowed,
    isEmergencyMode
  };
}

function simulateFullPlan(orderedDebts, monthlyPayment) {
  const schedule = [];
  let month = 0;
  let totalInterest = 0;
  let remainingDebts = orderedDebts.map(d => ({ ...d, originalBalance: d.balance }));
  
  while (remainingDebts.length > 0 && month < 360) {
    month++;
    let availableThisMonth = monthlyPayment;
    
    for (const debt of remainingDebts) {
      const monthlyInterest = (debt.balance * (debt.interes / 100)) / 12;
      debt.balance += monthlyInterest;
      totalInterest += monthlyInterest;
    }
    
    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const payment = i === 0 
        ? Math.min(debt.balance, availableThisMonth)
        : Math.min(debt.pagoMinimo, availableThisMonth, debt.balance);
      
      debt.balance -= payment;
      availableThisMonth -= payment;
      
      if (debt.balance <= 0.01) {
        schedule.push({
          month,
          debtId: debt.id,
          debtName: debt.nombre,
          originalBalance: debt.originalBalance,
          paidOff: true
        });
      }
      
      if (availableThisMonth <= 0) break;
    }
    
    remainingDebts = remainingDebts.filter(d => d.balance > 0.01);
  }
  
  return {
    months: month,
    totalInterest: Math.round(totalInterest),
    schedule,
    freedomDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
  };
}

function buildActionSteps(orderedDebts, analysis, monthlyPayment) {
  const steps = [];
  
  const contentionActions = [
    {
      id: 'freeze_cards',
      text: 'Congela el uso de tarjetas con deuda',
      detail: 'No uses tarjetas que tengan saldo. Cada compra nueva aumenta tu deuda.',
      critical: analysis.isEmergencyMode,
      immediate: true
    },
    {
      id: 'min_payments',
      text: 'Asegura todos los pagos mínimos',
      detail: `Total de mínimos: $${analysis.totalMinPayments.toLocaleString()}/mes`,
      critical: true,
      immediate: true
    }
  ];
  
  if (!analysis.isEmergencyMode) {
    contentionActions.push({
      id: 'emergency_fund',
      text: 'Mantén $500-1000 de emergencia',
      detail: 'Sin colchón, cualquier imprevisto te regresa a la deuda.',
      critical: false,
      immediate: false
    });
  } else {
    contentionActions.unshift({
      id: 'emergency_mode',
      text: '⚠️ MODO EMERGENCIA: Cortar todo gasto no esencial',
      detail: 'Ahora no optimizamos. Evitamos colapso financiero.',
      critical: true,
      immediate: true
    });
  }
  
  steps.push({
    phase: 'contention',
    title: '🔒 Contención',
    subtitle: analysis.isEmergencyMode ? 'MODO EMERGENCIA' : 'Detener el sangrado',
    description: analysis.isEmergencyMode 
      ? 'Situación crítica. Estas acciones son OBLIGATORIAS esta semana.'
      : 'Antes de atacar, hay que dejar de empeorar la situación.',
    actions: contentionActions,
    status: 'pending',
    isEmergency: analysis.isEmergencyMode
  });
  
  const targetDebt = orderedDebts[0];
  const extraPayment = Math.max(0, monthlyPayment - analysis.totalMinPayments);
  const totalToTarget = extraPayment + targetDebt.pagoMinimo;
  const estimatedMonths = totalToTarget > 0 ? Math.ceil(targetDebt.balance / totalToTarget) : 999;
  
  steps.push({
    phase: 'attack',
    title: '🎯 Ataque Principal',
    subtitle: `Objetivo: ${targetDebt.nombre}`,
    description: 'Esta es la deuda que debes eliminar primero. Todo el dinero extra va aquí.',
    targetDebt: {
      ...targetDebt,
      extraPayment,
      totalPayment: totalToTarget,
      estimatedMonths
    },
    actions: [
      {
        id: 'extra_payment',
        text: `Paga $${totalToTarget.toLocaleString()} a ${targetDebt.nombre}`,
        detail: `Mínimo ($${targetDebt.pagoMinimo.toLocaleString()}) + Extra ($${extraPayment.toLocaleString()})`,
        critical: true,
        immediate: false
      }
    ],
    status: 'pending'
  });
  
  const otherDebts = orderedDebts.slice(1);
  if (otherDebts.length > 0) {
    steps.push({
      phase: 'defense',
      title: '🛡️ Defensa',
      subtitle: 'Mantener las otras deudas estables',
      description: 'Mientras atacas la primera, las demás solo reciben el pago mínimo.',
      actions: otherDebts.map(debt => ({
        id: `min_${debt.id}`,
        text: `${debt.nombre}: Solo pago mínimo $${debt.pagoMinimo.toLocaleString()}`,
        detail: `Saldo: $${debt.balance.toLocaleString()} | Interés: ${debt.interes}%`,
        critical: false,
        immediate: false
      })),
      status: 'pending'
    });
  }
  
  steps.push({
    phase: 'liberation',
    title: '🚀 Liberación',
    subtitle: 'El efecto cascada',
    description: 'Cuando elimines la primera deuda, ese dinero ($' + totalToTarget.toLocaleString() + ') se redirige automáticamente a la siguiente.',
    cascade: orderedDebts.map((debt, idx) => ({
      order: idx + 1,
      name: debt.nombre,
      balance: debt.balance,
      interes: debt.interes
    })),
    status: 'future'
  });
  
  return steps;
}

function generateImmediateActions(plan, analysis) {
  const actions = {
    thisWeek: [],
    thisMonth: [],
    habits: []
  };
  
  if (analysis.isEmergencyMode) {
    actions.thisWeek.push({
      id: 'cut_expenses',
      text: 'Identificar y cortar 3 gastos no esenciales',
      priority: 'critical'
    });
  }
  
  actions.thisWeek.push({
    id: 'freeze_first',
    text: `Congelar/guardar tarjeta: ${plan.orderedDebts[0]?.nombre || 'principal'}`,
    priority: 'high'
  });
  
  if (plan.orderedDebts[0]) {
    actions.thisWeek.push({
      id: 'setup_payment',
      text: `Programar pago de $${plan.monthlyPayment.toLocaleString()} para el día 1`,
      priority: 'high'
    });
  }
  
  actions.thisMonth.push({
    id: 'first_extra_payment',
    text: `Hacer primer pago extra a ${plan.orderedDebts[0]?.nombre || 'deuda principal'}`,
    priority: 'high'
  });
  
  actions.thisMonth.push({
    id: 'review_subscriptions',
    text: 'Revisar y cancelar suscripciones innecesarias',
    priority: 'medium'
  });
  
  if (!analysis.isEmergencyMode) {
    actions.thisMonth.push({
      id: 'emergency_fund',
      text: 'Apartar $200-500 para fondo de emergencia',
      priority: 'medium'
    });
  }
  
  actions.habits.push({
    id: 'no_new_debt',
    text: 'NO usar tarjetas de crédito para compras nuevas',
    frequency: 'diario'
  });
  
  actions.habits.push({
    id: 'check_balance',
    text: 'Revisar saldos cada domingo',
    frequency: 'semanal'
  });
  
  actions.habits.push({
    id: 'track_progress',
    text: 'Registrar pagos realizados en la app',
    frequency: 'mensual'
  });
  
  return actions;
}

function calculatePaymentImpact(analysis, recommendedPayment, newPayment, paymentOptions) {
  if (!analysis) return null;
  
  const { isEmergencyMode } = analysis;
  const orderedDebts = orderDebtsByStrategy([...analysis.cleanDebts], 'avalancha');
  
  const recommendedPlan = simulateFullPlan(orderedDebts, recommendedPayment);
  const newPlan = simulateFullPlan(orderedDebts, newPayment);
  
  const monthsDiff = newPlan.months - recommendedPlan.months;
  const interestDiff = newPlan.totalInterest - recommendedPlan.totalInterest;
  
  let warningLevel = 'safe';
  let warningMessage = '';
  let blocked = false;
  
  if (newPayment < paymentOptions.minRequired) {
    warningLevel = 'danger';
    warningMessage = '⛔ Este monto no cubre los pagos mínimos. Acumularás más deuda.';
    blocked = true;
  } else if (isEmergencyMode && newPayment < paymentOptions.recommended) {
    warningLevel = 'blocked';
    warningMessage = '🔒 En Modo Emergencia no puedes reducir el pago recomendado.';
    blocked = true;
  } else if (newPayment < paymentOptions.minRequired * 1.1) {
    warningLevel = 'critical';
    warningMessage = '🚨 Solo pagas mínimos. La deuda tardará décadas en desaparecer.';
  } else if (newPayment < recommendedPayment * 0.8) {
    warningLevel = 'warning';
    warningMessage = `⚠️ Esto alarga el plan ${monthsDiff} meses y cuesta $${interestDiff.toLocaleString()} extra en intereses.`;
  } else if (newPayment > recommendedPayment) {
    warningLevel = 'excellent';
    warningMessage = `🚀 ¡Excelente! Ahorras ${Math.abs(monthsDiff)} meses y $${Math.abs(interestDiff).toLocaleString()} en intereses.`;
  } else {
    warningLevel = 'safe';
    warningMessage = '✅ Pago dentro del rango saludable.';
  }
  
  return {
    recommendedMonths: recommendedPlan.months,
    newMonths: newPlan.months,
    monthsDiff,
    recommendedInterest: recommendedPlan.totalInterest,
    newInterest: newPlan.totalInterest,
    interestDiff,
    warningLevel,
    warningMessage,
    blocked
  };
}

function normalizeDebt(deuda) {
  const balance = Number(deuda.balance || deuda.monto || deuda.amount || deuda.saldo || 0);
  const interes = Number(deuda.interes || deuda.interest || deuda.tasa || deuda.rate || (deuda.apr ? deuda.apr * 100 : 0) || 0);
  const pagoMinimo = Number(deuda.pagoMinimo || deuda.pago_minimo || deuda.pago_min || deuda.minPayment || Math.max(25, balance * 0.03));
  const nombre = deuda.nombre || deuda.cuenta || deuda.name || deuda.descripcion || 'Deuda sin nombre';
  
  return { ...deuda, balance, interes, pagoMinimo, nombre, originalBalance: balance };
}

function getStrategyInfo(strategy) {
  const strategies = {
    avalancha: {
      name: 'Avalancha',
      description: 'Ataca primero las deudas con mayor tasa de interés.',
      benefit: 'Minimiza el dinero total que pagas en intereses.',
      icon: Zap,
      emoji: '🏔️',
      color: 'from-orange-500 to-red-600'
    },
    bola_nieve: {
      name: 'Bola de Nieve',
      description: 'Elimina primero las deudas más pequeñas.',
      benefit: 'Genera victorias rápidas que mantienen tu motivación.',
      icon: Snowflake,
      emoji: '⛄',
      color: 'from-blue-500 to-cyan-600'
    }
  };
  
  return strategies[strategy] || strategies.avalancha;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function DebtPlannerModal({ deudas = [], kpis = {}, onClose, onPlanGuardado }) {
  const [phase, setPhase] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [optimalStrategy, setOptimalStrategy] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [customPayment, setCustomPayment] = useState(null);
  const [plan, setPlan] = useState(null);
  const [immediateActions, setImmediateActions] = useState(null);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [hasOverridden, setHasOverridden] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulatedPayment, setSimulatedPayment] = useState(null);
  const [behaviorProfile, setBehaviorProfile] = useState(null);
  
  const { addPlan } = usePlanesGuardados();

  useEffect(() => {
    const profile = getStoredBehaviorProfile();
    setBehaviorProfile(profile);
  }, []);

  useEffect(() => {
    if (deudas && deudas.length > 0) {
      const situationAnalysis = analyzeDebtSituation(deudas, kpis);
      setAnalysis(situationAnalysis);
      
      if (situationAnalysis) {
        const profile = getStoredBehaviorProfile();
        const optimal = determineOptimalStrategy(situationAnalysis, profile);
        setOptimalStrategy(optimal);
        setSelectedStrategy(optimal.strategy);
        
        const options = calculatePaymentOptions(situationAnalysis, profile);
        setPaymentOptions(options);
        setCustomPayment(options.recommended);
        setSimulatedPayment(options.recommended);
        
        if (situationAnalysis.isEmergencyMode) {
          updateBehaviorProfile('EMERGENCY_MODE');
        }
      }
    }
  }, [deudas, kpis]);

  useEffect(() => {
    if (analysis && selectedStrategy && customPayment && !isSimulationMode) {
      const orderedDebts = orderDebtsByStrategy([...analysis.cleanDebts], selectedStrategy);
      const simulation = simulateFullPlan(orderedDebts, customPayment);
      const steps = buildActionSteps(orderedDebts, analysis, customPayment);
      
      const newPlan = {
        orderedDebts,
        monthlyPayment: customPayment,
        simulation,
        steps,
        timeline: simulation.schedule,
        sealedAt: null,
        reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      setPlan(newPlan);
      setImmediateActions(generateImmediateActions(newPlan, analysis));
    }
  }, [analysis, selectedStrategy, customPayment, isSimulationMode]);

  const simulationImpact = useMemo(() => {
    if (!analysis || !paymentOptions || !simulatedPayment) return null;
    return calculatePaymentImpact(analysis, paymentOptions.recommended, simulatedPayment, paymentOptions);
  }, [analysis, paymentOptions, simulatedPayment]);

  const handleStrategyChange = useCallback((newStrategy) => {
    if (optimalStrategy?.locked) return;
    
    if (newStrategy !== optimalStrategy?.strategy) {
      setHasOverridden(true);
      updateBehaviorProfile('STRATEGY_OVERRIDE');
    }
    setSelectedStrategy(newStrategy);
  }, [optimalStrategy]);

  const handleAdoptSimulatedPayment = useCallback(() => {
    if (simulationImpact?.blocked) return;
    
    if (simulatedPayment < paymentOptions?.recommended) {
      updateBehaviorProfile('PAYMENT_REDUCED');
      updateBehaviorProfile('WARNING_IGNORED');
    } else if (simulatedPayment > paymentOptions?.recommended) {
      updateBehaviorProfile('PAYMENT_INCREASED');
    } else {
      updateBehaviorProfile('ACCEPTED_RECOMMENDATION');
    }
    
    setCustomPayment(simulatedPayment);
    setIsSimulationMode(false);
  }, [simulatedPayment, paymentOptions, simulationImpact]);

  const handleSavePlan = async (nombre) => {
    try {
      updateBehaviorProfile('PLAN_CREATED');
      
      if (!hasOverridden && customPayment === paymentOptions?.recommended) {
        updateBehaviorProfile('ACCEPTED_RECOMMENDATION');
      }
      
      await addPlan({
        tipo: 'deudas',
        nombre: nombre,
        descripcion: `Plan ${getStrategyInfo(selectedStrategy).name}: Libertad en ${plan.simulation.months} meses`,
        configuracion: {
          strategy: selectedStrategy,
          monthlyPayment: customPayment,
          plan: plan,
          analysis: analysis,
          immediateActions: immediateActions,
          sealedAt: new Date().toISOString(),
          reviewDate: plan.reviewDate.toISOString()
        },
        meta_principal: `Eliminar $${analysis.totalDebt.toLocaleString()} en deudas`,
        monto_objetivo: analysis.totalDebt,
        monto_actual: 0,
        progreso: 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_objetivo: plan.simulation.freedomDate.toISOString().split('T')[0],
        meses_duracion: plan.simulation.months,
        activo: true,
        completado: false
      });

      setShowConfirmacion(false);
      if (onPlanGuardado) onPlanGuardado();
      onClose();
    } catch (error) {
      console.error('Error guardando plan:', error);
      alert('Error al guardar el plan: ' + error.message);
    }
  };

  if (!deudas || deudas.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">¡Sin deudas!</h3>
            <p className="text-gray-400 mb-4">No tienes deudas registradas. ¡Excelente!</p>
            <button onClick={onClose} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-4xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        <Header 
          phase={phase} 
          analysis={analysis} 
          onClose={onClose} 
          isEmergencyMode={analysis?.isEmergencyMode}
        />
        
        <ProgressBar phase={phase} />
        
        <div className="flex-1 overflow-y-auto">
          {phase === 1 && analysis && (
            <Phase1Confrontation 
              analysis={analysis}
              behaviorProfile={behaviorProfile}
              onNext={() => setPhase(2)} 
            />
          )}
          
          {phase === 2 && (
            <Phase2Education 
              onNext={() => setPhase(3)} 
              onBack={() => setPhase(1)}
            />
          )}
          
          {phase === 3 && optimalStrategy && (
            <Phase3Strategy 
              optimalStrategy={optimalStrategy}
              selectedStrategy={selectedStrategy}
              onSelectStrategy={handleStrategyChange}
              hasOverridden={hasOverridden}
              onNext={() => setPhase(4)}
              onBack={() => setPhase(2)}
            />
          )}
          
          {phase === 4 && plan && (
            <Phase4Plan 
              plan={plan}
              analysis={analysis}
              onNext={() => setPhase(5)}
              onBack={() => setPhase(3)}
            />
          )}
          
          {phase === 5 && plan && paymentOptions && (
            <Phase5Adjustment
              plan={plan}
              analysis={analysis}
              paymentOptions={paymentOptions}
              customPayment={customPayment}
              isSimulationMode={isSimulationMode}
              setIsSimulationMode={setIsSimulationMode}
              simulatedPayment={simulatedPayment}
              setSimulatedPayment={setSimulatedPayment}
              simulationImpact={simulationImpact}
              onAdoptSimulation={handleAdoptSimulatedPayment}
              onNext={() => setPhase(6)}
              onBack={() => setPhase(4)}
            />
          )}
          
          {phase === 6 && plan && immediateActions && (
            <Phase6Commitment
              plan={plan}
              analysis={analysis}
              strategy={selectedStrategy}
              immediateActions={immediateActions}
              onSave={() => setShowConfirmacion(true)}
              onBack={() => setPhase(5)}
            />
          )}
        </div>
      </div>

      {showConfirmacion && (
        <ConfirmModal
          plan={plan}
          strategy={selectedStrategy}
          onConfirmar={handleSavePlan}
          onCancelar={() => setShowConfirmacion(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES DE UI
// ==========================================

function Header({ phase, onClose, isEmergencyMode }) {
  const titles = {
    1: { title: 'La Verdad', subtitle: 'Tu situación actual' },
    2: { title: 'Educación', subtitle: 'Cómo funcionan las deudas' },
    3: { title: 'Tu Estrategia', subtitle: 'El sistema ha decidido' },
    4: { title: 'Tu Plan', subtitle: 'Paso a paso hacia la libertad' },
    5: { title: 'Ajustes', subtitle: 'Personaliza tu compromiso' },
    6: { title: 'Compromiso', subtitle: 'Sella tu plan' }
  };
  
  const { title, subtitle } = titles[phase] || titles[1];
  
  const bgColors = {
    1: isEmergencyMode ? 'from-red-800 to-red-900' : 'from-red-900/80 to-rose-900/80',
    2: 'from-blue-900/80 to-indigo-900/80',
    3: 'from-purple-900/80 to-violet-900/80',
    4: 'from-emerald-900/80 to-teal-900/80',
    5: 'from-amber-900/80 to-orange-900/80',
    6: 'from-green-900/80 to-emerald-900/80'
  };

  return (
    <div className={`bg-gradient-to-r ${bgColors[phase]} backdrop-blur-md p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${isEmergencyMode ? 'bg-red-500/30 border-red-400' : 'bg-white/10 border-white/20'}`}>
          {isEmergencyMode ? (
            <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-300" />
          ) : (
            <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
            {isEmergencyMode && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                EMERGENCIA
              </span>
            )}
          </div>
          <p className="text-white/70 text-xs md:text-sm">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

function ProgressBar({ phase }) {
  const phases = [
    { num: 1, label: 'Verdad' },
    { num: 2, label: 'Educación' },
    { num: 3, label: 'Estrategia' },
    { num: 4, label: 'Plan' },
    { num: 5, label: 'Ajuste' },
    { num: 6, label: 'Compromiso' }
  ];
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-white/5 overflow-x-auto">
      {phases.map((p, idx) => (
        <div key={p.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              phase === p.num 
                ? 'bg-white text-gray-900 scale-110' 
                : phase > p.num 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
            }`}>
              {phase > p.num ? '✓' : p.num}
            </div>
            <span className={`text-[10px] mt-1 hidden md:block ${phase === p.num ? 'text-white font-bold' : 'text-gray-500'}`}>
              {p.label}
            </span>
          </div>
          {idx < phases.length - 1 && (
            <div className={`w-6 md:w-12 h-0.5 mx-1 ${phase > p.num ? 'bg-green-500' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Phase1Confrontation({ analysis, behaviorProfile, onNext }) {
  const { 
    totalDebt, monthlyInterestCost, interestConcentration, 
    highInterestDebts, crisisLevel, crisisMessage, debtCount, isEmergencyMode 
  } = analysis;

  const crisisColors = {
    critical: 'from-red-600 to-red-700',
    high: 'from-orange-500 to-red-500',
    warning: 'from-yellow-500 to-orange-500',
    manageable: 'from-blue-500 to-indigo-500',
    stable: 'from-green-500 to-emerald-500'
  };

  const getPersonalizedMessage = () => {
    if (!behaviorProfile || behaviorProfile.totalInteractions === 0) return null;
    
    if (behaviorProfile.history.plansAbandoned > behaviorProfile.history.plansCompleted) {
      return {
        text: 'Has creado planes antes sin completarlos. Esta vez, vamos paso a paso.',
        type: 'warning'
      };
    }
    
    if (behaviorProfile.disciplineScore > 0.7) {
      return {
        text: 'Tu historial muestra disciplina. Puedes con un plan agresivo.',
        type: 'success'
      };
    }
    
    return null;
  };
  
  const personalizedMessage = getPersonalizedMessage();

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      {isEmergencyMode && (
        <div className="bg-red-600 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-8 h-8 text-white shrink-0" />
          <div>
            <div className="text-white font-bold">MODO EMERGENCIA ACTIVADO</div>
            <div className="text-red-100 text-sm">El sistema tomará decisiones más estrictas para proteger tu estabilidad.</div>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-r ${crisisColors[crisisLevel]} rounded-2xl p-6 text-center`}>
        <div className="text-5xl mb-4">
          {crisisLevel === 'critical' ? '🚨' : crisisLevel === 'high' ? '⚠️' : crisisLevel === 'warning' ? '📊' : '💪'}
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
          {crisisLevel === 'critical' || crisisLevel === 'high' 
            ? 'Necesitas actuar ahora.' 
            : 'Tu situación es manejable.'}
        </h3>
        <p className="text-white/90 text-sm md:text-base">
          {crisisMessage}
        </p>
      </div>

      {personalizedMessage && (
        <div className={`rounded-xl p-4 border ${
          personalizedMessage.type === 'warning' 
            ? 'bg-yellow-500/10 border-yellow-500/30' 
            : 'bg-green-500/10 border-green-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${personalizedMessage.type === 'warning' ? 'text-yellow-400' : 'text-green-400'}`} />
            <span className={personalizedMessage.type === 'warning' ? 'text-yellow-300' : 'text-green-300'}>
              {personalizedMessage.text}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl md:text-4xl font-black text-red-400">
            ${totalDebt.toLocaleString()}
          </div>
          <div className="text-xs text-red-300 mt-1">Deuda Total</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
          <div className="text-3xl md:text-4xl font-black text-orange-400">
            ${Math.round(monthlyInterestCost).toLocaleString()}
          </div>
          <div className="text-xs text-orange-300 mt-1">Pierdes al mes en intereses</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-white font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Lo que tus números revelan:
        </h4>
        
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💳</div>
            <div>
              <div className="text-white font-semibold">Tienes {debtCount} deudas activas</div>
              <div className="text-gray-400 text-sm">
                {debtCount > 3 
                  ? 'Múltiples deudas = múltiples frentes de batalla. Hay que priorizar.' 
                  : 'Pocas deudas = más fácil de manejar con la estrategia correcta.'}
              </div>
            </div>
          </div>
        </div>

        {highInterestDebts.length > 0 && (
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="text-white font-semibold">
                  {highInterestDebts.length} deuda(s) con interés tóxico (+20%)
                </div>
                <div className="text-red-300 text-sm">
                  Generan el {interestConcentration.toFixed(0)}% de tus intereses mensuales.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <div className="text-white font-semibold">
                En 1 año sin cambios: ~${Math.round(monthlyInterestCost * 12).toLocaleString()} perdidos en intereses
              </div>
              <div className="text-purple-300 text-sm">
                Ese dinero podría ser tuyo. Vamos a recuperarlo.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Shield className="w-4 h-4" />
          <span>Este plan se basa en matemáticas financieras, no motivación.</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-gradient-to-r from-white to-gray-200 text-gray-900 py-4 rounded-xl font-bold text-lg hover:from-gray-100 hover:to-white transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        Entiendo. Muéstrame cómo salir.
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function Phase2Education({ onNext, onBack }) {
  const [activeCard, setActiveCard] = useState(null);

  const concepts = [
    {
      id: 'interest',
      emoji: '💸',
      title: 'Por qué el interés manda',
      content: 'No todas las deudas son iguales. Una deuda de $1,000 al 30% te cuesta $300/año. La misma deuda al 15% te cuesta $150. El interés decide cuál te roba más.',
      takeaway: 'Atacar el interés alto primero = menos dinero regalado al banco.'
    },
    {
      id: 'methods',
      emoji: '⚔️',
      title: 'Dos estrategias probadas',
      content: `🏔️ Avalancha: Pagas primero la deuda con mayor interés. Matemáticamente óptimo, ahorras más dinero.\n\n⛄ Bola de Nieve: Pagas primero la deuda más pequeña. Psicológicamente poderoso, victorias rápidas.`,
      takeaway: 'Ambas funcionan. El sistema elegirá la mejor para TU situación.'
    },
    {
      id: 'mistake',
      emoji: '❌',
      title: 'El error que todos cometen',
      content: 'Pagar todas las deudas "un poquito extra" se siente bien pero es ineficiente. El dinero extra debe concentrarse en UNA sola deuda mientras las demás reciben solo el mínimo.',
      takeaway: 'Enfoque láser > dispersión. Una deuda a la vez.'
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          90 segundos que cambiarán tu perspectiva
        </h3>
        <p className="text-gray-400 text-sm">
          Toca cada tarjeta para entender la mecánica
        </p>
      </div>

      <div className="space-y-3">
        {concepts.map((concept) => (
          <div 
            key={concept.id}
            className={`bg-white/5 border rounded-xl overflow-hidden transition-all cursor-pointer ${
              activeCard === concept.id ? 'border-purple-500' : 'border-white/10 hover:border-white/30'
            }`}
            onClick={() => setActiveCard(activeCard === concept.id ? null : concept.id)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{concept.emoji}</span>
                <span className="text-white font-semibold">{concept.title}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeCard === concept.id ? 'rotate-180' : ''}`} />
            </div>
            
            {activeCard === concept.id && (
              <div className="px-4 pb-4 pt-0 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-gray-300 text-sm whitespace-pre-line mb-3">
                  {concept.content}
                </p>
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                  <div className="text-purple-300 text-xs font-bold uppercase mb-1">Conclusión:</div>
                  <div className="text-white text-sm font-medium">{concept.takeaway}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-purple-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
        >
          Ver mi estrategia
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Phase3Strategy({ optimalStrategy, selectedStrategy, onSelectStrategy, hasOverridden, onNext, onBack }) {
  const [showAlternative, setShowAlternative] = useState(false);
  
  const optimal = getStrategyInfo(optimalStrategy.strategy);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      {optimalStrategy.locked && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-red-300 font-semibold">Estrategia bloqueada</div>
            <div className="text-red-200/70 text-sm">{optimalStrategy.lockReason}</div>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-br ${optimal.color} rounded-2xl p-6 text-center relative overflow-hidden`}>
        <div className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs font-bold text-white">
          {optimalStrategy.confidence}% confianza
        </div>
        
        <div className="text-5xl mb-4">{optimal.emoji}</div>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
          Tu estrategia: {optimal.name}
        </h3>
        <p className="text-white/90 text-sm md:text-base mb-4">
          {optimalStrategy.reason}
        </p>
        
        <div className="bg-white/20 rounded-xl p-3 text-left">
          <div className="text-white/80 text-xs uppercase font-bold mb-1">Beneficio Principal:</div>
          <div className="text-white font-semibold">{optimal.benefit}</div>
        </div>
      </div>

      {hasOverridden && selectedStrategy !== optimalStrategy.strategy && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-yellow-300 font-semibold">Has cambiado la recomendación</div>
            <div className="text-yellow-200/70 text-sm">{optimalStrategy.alternativeReason}</div>
          </div>
        </div>
      )}

      {!optimalStrategy.locked && (
        <>
          <button
            onClick={() => setShowAlternative(!showAlternative)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition"
          >
            {showAlternative ? 'Ocultar' : 'Ver'} alternativa (no recomendado)
            <ChevronDown className={`w-4 h-4 transition-transform ${showAlternative ? 'rotate-180' : ''}`} />
          </button>

          {showAlternative && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
              {['avalancha', 'bola_nieve'].map(strat => {
                const info = getStrategyInfo(strat);
                const isSelected = selectedStrategy === strat;
                const isOptimal = optimalStrategy.strategy === strat;
                
                return (
                  <button
                    key={strat}
                    onClick={() => onSelectStrategy(strat)}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      isSelected 
                        ? 'bg-white/10 border-white/50 ring-2 ring-white/20' 
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{info.emoji}</span>
                      {isOptimal && (
                        <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                          ✓ Recomendada
                        </span>
                      )}
                    </div>
                    <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{info.name}</div>
                    <div className="text-gray-500 text-xs mt-1">{info.description}</div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center gap-2"
        >
          Ver mi plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Phase4Plan({ plan, analysis, onNext, onBack }) {
  const [expandedStep, setExpandedStep] = useState('attack');
  
  if (!plan) return null;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-white">{plan.simulation.months}</div>
          <div className="text-[10px] text-gray-400">meses</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-green-400">${plan.monthlyPayment.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">pago/mes</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-xl md:text-2xl font-bold text-orange-400">${plan.simulation.totalInterest.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">intereses</div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.steps.map((step) => {
          const isExpanded = expandedStep === step.phase;
          const phaseColors = {
            contention: step.isEmergency ? 'border-red-500/50 bg-red-500/10' : 'border-red-500/30 bg-red-500/5',
            attack: 'border-orange-500/30 bg-orange-500/5',
            defense: 'border-blue-500/30 bg-blue-500/5',
            liberation: 'border-green-500/30 bg-green-500/5'
          };
          
          return (
            <div 
              key={step.phase}
              className={`rounded-xl border overflow-hidden transition-all ${phaseColors[step.phase]}`}
            >
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.phase)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <div className="text-white font-bold text-sm md:text-base flex items-center gap-2">
                    {step.title}
                    {step.isEmergency && <span className="text-red-400 text-xs">(URGENTE)</span>}
                  </div>
                  <div className="text-gray-400 text-xs">{step.subtitle}</div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-gray-300 text-sm">{step.description}</p>
                  
                  {step.actions && (
                    <div className="space-y-2">
                      {step.actions.map((action, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            action.critical 
                              ? 'bg-red-500/10 border-red-500/30' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {action.critical && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                            {action.immediate && !action.critical && <Clock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                            <div>
                              <div className="text-white text-sm font-medium">{action.text}</div>
                              {action.detail && (
                                <div className="text-gray-400 text-xs mt-1">{action.detail}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {step.targetDebt && (
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{step.targetDebt.nombre}</span>
                        <span className="text-orange-300 font-bold">${step.targetDebt.balance.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-300 text-xs">
                        Interés: {step.targetDebt.interes}% • Pago: ${step.targetDebt.totalPayment.toLocaleString()}/mes
                      </div>
                      <div className="text-green-400 text-xs mt-1">
                        ✓ Estimado: eliminada en ~{step.targetDebt.estimatedMonths} meses
                      </div>
                    </div>
                  )}
                  
                  {step.cascade && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 uppercase font-bold">Orden de eliminación:</div>
                      {step.cascade.map((debt, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {debt.order}
                          </div>
                          <span className="text-white flex-1">{debt.name}</span>
                          <span className="text-gray-500">${debt.balance.toLocaleString()}</span>
                          <span className="text-orange-400 text-xs">{debt.interes}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {plan.timeline && plan.timeline.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeline de Libertad
          </h4>
          <div className="space-y-2">
            {plan.timeline.map((milestone, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="w-16 text-gray-500">Mes {milestone.month}</div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="text-green-400">✓ {milestone.debtName} liquidada</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition flex items-center justify-center gap-2"
        >
          Ajustar pago
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Phase5Adjustment({ 
  plan, analysis, paymentOptions, customPayment,
  isSimulationMode, setIsSimulationMode,
  simulatedPayment, setSimulatedPayment, simulationImpact,
  onAdoptSimulation, onNext, onBack 
}) {
  if (!plan || !analysis || !paymentOptions) return null;

  const warningColors = {
    safe: 'bg-green-500/10 border-green-500/30 text-green-300',
    excellent: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    critical: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    danger: 'bg-red-500/10 border-red-500/30 text-red-300',
    blocked: 'bg-red-500/20 border-red-500/50 text-red-300'
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          {analysis.isEmergencyMode ? '🔒 Pago Fijado (Modo Emergencia)' : '¿Cuánto puedes pagar al mes?'}
        </h3>
        <p className="text-gray-400 text-sm">
          {analysis.isEmergencyMode 
            ? 'En modo emergencia, el pago recomendado es obligatorio.'
            : <>Recomendado: <span className="text-green-400 font-bold">${paymentOptions.recommended.toLocaleString()}</span></>
          }
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-xs uppercase font-bold">Plan Activo</span>
          </div>
          <span className="text-gray-400 text-xs">Sellado al guardar</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-white">${customPayment.toLocaleString()}</div>
            <div className="text-green-300 text-sm">por mes</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Libre en</div>
            <div className="text-white font-bold text-xl">{plan.simulation.months} meses</div>
          </div>
        </div>
      </div>

      {!isSimulationMode && !analysis.isEmergencyMode && (
        <button
          onClick={() => setIsSimulationMode(true)}
          className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-gray-300 text-sm hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Simular otro monto (sin cambiar el plan)
        </button>
      )}

      {isSimulationMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-xs uppercase font-bold">Modo Simulación</span>
            </div>
            <button 
              onClick={() => {
                setIsSimulationMode(false);
                setSimulatedPayment(customPayment);
              }}
              className="text-gray-400 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Monto simulado:</span>
            <span className="text-2xl font-bold text-amber-300">${simulatedPayment?.toLocaleString()}</span>
          </div>
          
          <input
            type="range"
            min={paymentOptions.minRequired}
            max={paymentOptions.aggressive * 1.3}
            step={10}
            value={simulatedPayment}
            onChange={(e) => setSimulatedPayment(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mínimo: ${paymentOptions.minRequired.toLocaleString()}</span>
            <span>Agresivo: ${paymentOptions.aggressive.toLocaleString()}</span>
          </div>

          {simulationImpact && (
            <div className={`rounded-xl p-4 border ${warningColors[simulationImpact.warningLevel]}`}>
              <div className="font-semibold mb-2">{simulationImpact.warningMessage}</div>
              
              {simulationImpact.warningLevel !== 'safe' && simulationImpact.warningLevel !== 'excellent' && (
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">vs Recomendado</div>
                    <div className="text-white font-bold">
                      {simulationImpact.monthsDiff > 0 ? '+' : ''}{simulationImpact.monthsDiff} meses
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-gray-400 text-xs">Intereses extra</div>
                    <div className="text-white font-bold">
                      {simulationImpact.interestDiff > 0 ? '+' : ''}${Math.abs(simulationImpact.interestDiff).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setSimulatedPayment(paymentOptions.recommended)}
              className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm hover:bg-white/20 transition"
            >
              Volver a recomendado
            </button>
            <button
              onClick={onAdoptSimulation}
              disabled={simulationImpact?.blocked}
              className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adoptar este monto
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-semibold text-sm">Plan sellado por 30 días</div>
            <div className="text-gray-400 text-xs mt-1">
              Una vez guardado, el plan no cambiará hasta la fecha de revisión. 
              Esto te protege de la tentación de modificarlo por ansiedad.
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={isSimulationMode}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Confirmar plan
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Phase6Commitment({ plan, analysis, strategy, immediateActions, onSave, onBack }) {
  const [accepted, setAccepted] = useState(false);
  const [expandedSection, setExpandedSection] = useState('week');
  const strategyInfo = getStrategyInfo(strategy);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in">
      <div className={`bg-gradient-to-br ${strategyInfo.color} rounded-2xl p-6 text-center`}>
        <div className="text-5xl mb-4">{strategyInfo.emoji}</div>
        <h3 className="text-2xl font-black text-white mb-2">Tu Plan de Libertad</h3>
        <p className="text-white/80 text-sm">Estrategia: {strategyInfo.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{plan.simulation.months}</div>
          <div className="text-xs text-gray-400">meses hasta ser libre</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-green-400">${plan.monthlyPayment.toLocaleString()}</div>
          <div className="text-xs text-gray-400">pago mensual</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
        <div className="text-green-300 text-xs uppercase font-bold mb-1">Fecha de libertad</div>
        <div className="text-2xl font-black text-white">
          {plan.simulation.freedomDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h4 className="text-white font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Tus Próximas Acciones
          </h4>
          <p className="text-gray-400 text-xs mt-1">El plan funciona si ejecutas estas acciones</p>
        </div>
        
        <div className="border-b border-white/10">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'week' ? null : 'week')}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
          >
            <span className="text-white font-semibold flex items-center gap-2">
              <span className="text-red-400">🔥</span> Esta Semana
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'week' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'week' && (
            <div className="px-4 pb-4 space-y-2">
              {immediateActions?.thisWeek.map((action, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  action.priority === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border border-gray-500 flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-white text-sm">{action.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-b border-white/10">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'month' ? null : 'month')}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
          >
            <span className="text-white font-semibold flex items-center gap-2">
              <span className="text-yellow-400">📅</span> Este Mes
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'month' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'month' && (
            <div className="px-4 pb-4 space-y-2">
              {immediateActions?.thisMonth.map((action, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border border-gray-500 flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-white text-sm">{action.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button 
            onClick={() => setExpandedSection(expandedSection === 'habits' ? null : 'habits')}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
          >
            <span className="text-white font-semibold flex items-center gap-2">
              <span className="text-green-400">🔁</span> Hábitos Clave
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'habits' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'habits' && (
            <div className="px-4 pb-4 space-y-2">
              {immediateActions?.habits.map((habit, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{habit.text}</span>
                    <span className="text-green-400 text-xs uppercase">{habit.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div 
        onClick={() => setAccepted(!accepted)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          accepted 
            ? 'bg-green-500/20 border-green-500' 
            : 'bg-white/5 border-white/20 hover:border-white/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
            accepted ? 'bg-green-500 border-green-400' : 'border-gray-500'
          }`}>
            {accepted && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <div>
            <div className="text-white font-semibold">Me comprometo con este plan</div>
            <div className="text-gray-400 text-sm mt-1">
              Pagaré ${plan.monthlyPayment.toLocaleString()} cada mes, ejecutaré las acciones listadas, 
              y no usaré las tarjetas con deuda. Revisión: {plan.reviewDate?.toLocaleDateString('es-ES')}.
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
        >
          Atrás
        </button>
        <button
          onClick={onSave}
          disabled={!accepted}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30"
        >
          <CheckCircle2 className="w-6 h-6" />
          Guardar Plan
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ plan, strategy, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const strategyInfo = getStrategyInfo(strategy);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre para tu plan');
      return;
    }
    setGuardando(true);
    await onConfirmar(nombre);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className={`bg-gradient-to-br ${strategyInfo.color} rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/20`}>
        <button 
          onClick={onCancelar}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full border border-white/30 mb-4">
            <span className="text-4xl">{strategyInfo.emoji}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">¡Último paso!</h3>
          <p className="text-white/80 text-sm mb-6">Dale un nombre a tu plan de libertad</p>

          <div className="mb-6 text-left">
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Operación Libertad 2025"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 md:px-5 py-4 text-white placeholder-white/50 focus:outline-none focus:border-white/40 backdrop-blur text-base md:text-lg font-medium"
              autoFocus
            />
          </div>

          <div className="bg-white/10 rounded-xl p-3 mb-6 text-left">
            <div className="text-white/70 text-xs">
              🔒 Este plan quedará sellado hasta: <span className="text-white font-bold">{plan.reviewDate?.toLocaleDateString('es-ES')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={guardando}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white py-3.5 rounded-xl font-bold transition backdrop-blur disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || !nombre.trim()}
              className="flex-1 bg-white text-gray-900 py-3.5 rounded-xl font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 shadow-lg"
            >
              {guardando ? <span className="animate-spin text-2xl">⏳</span> : <CheckCircle2 className="w-6 h-6" />}
              {guardando ? 'Guardando...' : 'Sellar Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}