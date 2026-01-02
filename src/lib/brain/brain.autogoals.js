// src/lib/brain/brain.autogoals.js
// 🧠 Motor de Metas Auto-Inteligentes
// Calcula metas, detecta progreso automáticamente, ajusta dinámicamente

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const pct = (x) => Math.round(x * 100);

/**
 * Genera una meta inteligente con cálculos automáticos y detección de progreso
 * @param {string} goalType - Tipo de meta (controlar_gastos, ahorrar_mas, etc.)
 * @param {Object} kpis - KPIs actuales del mes
 * @param {Object} profile - Perfil con histórico mensual
 * @returns {Object} Meta con cálculos automáticos, progreso real y recomendaciones
 */
export function generateAutoGoal(goalType, kpis, profile) {
  const {
    totalIngresos,
    totalGastos,
    saldo,
    tasaAhorro,
    totalSuscripciones,
    totalGastosFijos,
    totalGastosVariables,
    deudasCount,
  } = kpis;

  // Obtener mes anterior para comparar
  const previousMonth = getPreviousMonthData(profile);
  
  switch (goalType) {
    case "controlar_gastos":
      return generateControlGastosGoal(kpis, previousMonth, profile);
    
    case "ahorrar_mas":
      return generateAhorrarMasGoal(kpis, previousMonth, profile);
    
    case "pagar_deudas":
      return generatePagarDeudasGoal(kpis, previousMonth, profile);
    
    case "fondo_emergencia":
      return generateFondoEmergenciaGoal(kpis, previousMonth, profile);
    
    case "recortar_subs":
      return generateRecortarSubsGoal(kpis, previousMonth, profile);
    
    default:
      return null;
  }
}

// ========== CONTROLAR GASTOS ==========
function generateControlGastosGoal(kpis, previousMonth, profile) {
  const { totalGastos, totalIngresos, saldo, totalGastosVariables } = kpis;
  
  // Meta: Reducir gastos para equilibrar o mejorar saldo
  const targetReduction = saldo < 0 
    ? Math.abs(saldo) * 1.1  // 10% más para tener colchón
    : totalGastos * 0.05;     // 5% de reducción preventiva
  
  const targetGastos = totalGastos - targetReduction;
  const monthsToAchieve = saldo < 0 ? 1 : 3; // Urgente si hay déficit
  
  // Detectar progreso automático
  const progress = detectGastosProgress(kpis, previousMonth);
  
  // Estrategia automática
  const strategy = calculateGastosStrategy(kpis, targetReduction);
  
  return {
    type: "controlar_gastos",
    title: "Control de Gastos Inteligente",
    
    // Cálculos automáticos
    auto: {
      currentGastos: totalGastos,
      targetGastos: Math.round(targetGastos),
      reductionNeeded: Math.round(targetReduction),
      reductionPercent: pct(targetReduction / totalGastos),
      monthsToAchieve,
    },
    
    // Progreso detectado automáticamente
    progress,
    
    // Estrategia recomendada
    strategy,
    
    // Status visual
    status: progress.trend === "improving" ? "on_track" : 
            progress.trend === "worsening" ? "alert" : "neutral",
    
    // Insights accionables
    insights: generateGastosInsights(kpis, targetReduction, strategy),
  };
}

function detectGastosProgress(current, previous) {
  if (!previous) {
    return {
      trend: "neutral",
      message: "Primer mes de seguimiento. Estableciendo baseline.",
      change: 0,
    };
  }
  
  const change = current.totalGastos - previous.gastos;
  const changePercent = pct(change / previous.gastos);
  
  if (change < -50) {
    return {
      trend: "improving",
      message: `¡Excelente! Reduciste gastos en $${Math.abs(Math.round(change))} (${Math.abs(changePercent)}%)`,
      change: Math.round(change),
    };
  } else if (change > 50) {
    return {
      trend: "worsening",
      message: `⚠️ Gastos aumentaron $${Math.round(change)} (${changePercent}%)`,
      change: Math.round(change),
    };
  } else {
    return {
      trend: "stable",
      message: "Gastos estables respecto al mes anterior",
      change: Math.round(change),
    };
  }
}

function calculateGastosStrategy(kpis, targetReduction) {
  const { totalGastosVariables, totalSuscripciones } = kpis;
  
  const strategies = [];
  
  // Priorizar variables (más fácil de ajustar)
  const variablesReduction = Math.min(targetReduction, totalGastosVariables * 0.2);
  if (variablesReduction > 0) {
    strategies.push({
      area: "Gastos Variables",
      current: Math.round(totalGastosVariables),
      target: Math.round(totalGastosVariables - variablesReduction),
      savings: Math.round(variablesReduction),
      difficulty: "fácil",
    });
  }
  
  // Luego suscripciones
  const remaining = targetReduction - variablesReduction;
  if (remaining > 0 && totalSuscripciones > 0) {
    const subsReduction = Math.min(remaining, totalSuscripciones * 0.3);
    strategies.push({
      area: "Suscripciones",
      current: Math.round(totalSuscripciones),
      target: Math.round(totalSuscripciones - subsReduction),
      savings: Math.round(subsReduction),
      difficulty: "medio",
    });
  }
  
  return strategies;
}

function generateGastosInsights(kpis, targetReduction, strategy) {
  const insights = [];
  
  if (kpis.saldo < 0) {
    insights.push({
      priority: "urgent",
      icon: "🚨",
      text: `Necesitas reducir $${Math.round(targetReduction)} este mes para eliminar el déficit`,
    });
  }
  
  strategy.forEach(s => {
    insights.push({
      priority: "high",
      icon: "💡",
      text: `${s.area}: reduce de $${s.current} a $${s.target} (ahorro: $${s.savings})`,
    });
  });
  
  return insights;
}

// ========== AHORRAR MÁS ==========
function generateAhorrarMasGoal(kpis, previousMonth, profile) {
  const { totalIngresos, saldo, tasaAhorro } = kpis;
  
  // Meta: Llegar al 10-20% de ahorro
  const currentSavingsRate = tasaAhorro;
  const targetSavingsRate = currentSavingsRate < 0.05 ? 0.10 : 
                           currentSavingsRate < 0.10 ? 0.15 : 0.20;
  
  const targetSavingsAmount = totalIngresos * targetSavingsRate;
  const currentSavingsAmount = Math.max(0, saldo);
  const gapToFill = targetSavingsAmount - currentSavingsAmount;
  
  // Detectar progreso
  const progress = detectAhorroProgress(kpis, previousMonth);
  
  return {
    type: "ahorrar_mas",
    title: "Plan de Ahorro Automático",
    
    auto: {
      currentRate: pct(currentSavingsRate),
      targetRate: pct(targetSavingsRate),
      currentAmount: Math.round(currentSavingsAmount),
      targetAmount: Math.round(targetSavingsAmount),
      monthlyGap: Math.round(gapToFill),
      recommendedMonthly: Math.round(totalIngresos * targetSavingsRate),
    },
    
    progress,
    
    status: progress.trend === "improving" ? "on_track" :
            currentSavingsRate >= targetSavingsRate ? "achieved" : "needs_work",
    
    insights: generateAhorroInsights(kpis, targetSavingsRate, gapToFill),
  };
}

function detectAhorroProgress(current, previous) {
  if (!previous) {
    return {
      trend: "neutral",
      message: "Iniciando seguimiento de ahorro",
      change: 0,
    };
  }
  
  const currentRate = current.tasaAhorro;
  const previousRate = previous.tasaAhorro;
  const change = currentRate - previousRate;
  
  if (change > 0.02) {
    return {
      trend: "improving",
      message: `¡Progreso! Tasa de ahorro subió ${pct(change)} puntos`,
      change: pct(change),
    };
  } else if (change < -0.02) {
    return {
      trend: "worsening",
      message: `Tasa de ahorro bajó ${pct(Math.abs(change))} puntos`,
      change: pct(change),
    };
  } else {
    return {
      trend: "stable",
      message: "Tasa de ahorro estable",
      change: pct(change),
    };
  }
}

function generateAhorroInsights(kpis, targetRate, gap) {
  const insights = [];
  
  if (kpis.saldo < 0) {
    insights.push({
      priority: "urgent",
      icon: "⚠️",
      text: "Primero elimina el déficit antes de aumentar ahorro",
    });
  } else if (gap > 0) {
    insights.push({
      priority: "high",
      icon: "💰",
      text: `Para llegar al ${pct(targetRate)}%, necesitas liberar $${Math.round(gap)} adicionales`,
    });
  } else {
    insights.push({
      priority: "success",
      icon: "✅",
      text: `¡Meta alcanzada! Estás ahorrando ${pct(kpis.tasaAhorro)}%`,
    });
  }
  
  return insights;
}

// ========== FONDO EMERGENCIA ==========
function generateFondoEmergenciaGoal(kpis, previousMonth, profile) {
  const { totalGastosFijos, totalGastosVariables, totalIngresos, saldo } = kpis;
  
  // Meta: 3-6 meses de gastos esenciales
  const monthlyEssentials = totalGastosFijos + (totalGastosVariables * 0.5); // 50% de variables
  const targetFund = monthlyEssentials * 3; // Empezar con 3 meses
  
  // Detectar fondo actual (necesitamos un campo en profile para esto)
  const currentFund = profile.emergencyFund || 0;
  const remaining = targetFund - currentFund;
  
  // Calcular aporte mensual recomendado
  const recommendedMonthly = Math.min(
    totalIngresos * 0.10, // 10% de ingresos
    remaining / 12        // O lo que falta dividido en 12 meses
  );
  
  const monthsToComplete = recommendedMonthly > 0 
    ? Math.ceil(remaining / recommendedMonthly) 
    : 0;
  
  // Progreso
  const progressPercent = currentFund > 0 ? (currentFund / targetFund) * 100 : 0;
  
  return {
    type: "fondo_emergencia",
    title: "Fondo de Emergencia",
    
    auto: {
      targetAmount: Math.round(targetFund),
      currentAmount: Math.round(currentFund),
      remaining: Math.round(remaining),
      progressPercent: Math.round(progressPercent),
      recommendedMonthly: Math.round(recommendedMonthly),
      monthsToComplete,
      monthsOfCoverage: Math.round((currentFund / monthlyEssentials) * 10) / 10,
    },
    
    progress: {
      trend: currentFund > 0 ? "improving" : "not_started",
      message: currentFund > 0 
        ? `Tienes ${(currentFund / monthlyEssentials).toFixed(1)} meses de cobertura`
        : "Aún no has iniciado tu fondo de emergencia",
    },
    
    status: progressPercent >= 100 ? "achieved" :
            progressPercent >= 33 ? "on_track" : "needs_work",
    
    insights: generateFondoInsights(kpis, targetFund, currentFund, recommendedMonthly),
  };
}

function generateFondoInsights(kpis, target, current, monthly) {
  const insights = [];
  
  if (kpis.saldo < 0) {
    insights.push({
      priority: "urgent",
      icon: "⚠️",
      text: "Primero estabiliza tu flujo mensual antes de construir el fondo",
    });
  } else if (current === 0) {
    insights.push({
      priority: "high",
      icon: "🎯",
      text: `Comienza ahorrando $${Math.round(monthly)}/mes para alcanzar $${Math.round(target)} en ${Math.ceil(target/monthly)} meses`,
    });
  } else if (current < target) {
    const remaining = target - current;
    insights.push({
      priority: "medium",
      icon: "📈",
      text: `Te faltan $${Math.round(remaining)} para completar tu fondo. Continúa con $${Math.round(monthly)}/mes`,
    });
  } else {
    insights.push({
      priority: "success",
      icon: "🎉",
      text: "¡Fondo de emergencia completo! Considera aumentar a 6 meses",
    });
  }
  
  return insights;
}

// ========== PAGAR DEUDAS ==========
function generatePagarDeudasGoal(kpis, previousMonth, profile) {
  // Por ahora retornamos estructura básica
  // Necesitaremos más datos de las deudas específicas
  return {
    type: "pagar_deudas",
    title: "Plan de Pago de Deudas",
    auto: {
      totalDeudas: 0, // Calcular del input
      monthlyPayment: 0,
    },
    progress: {
      trend: "neutral",
      message: "Configura tus deudas para generar plan automático",
    },
    status: "needs_config",
    insights: [],
  };
}

// ========== RECORTAR SUBS ==========
function generateRecortarSubsGoal(kpis, previousMonth, profile) {
  const { totalSuscripciones, totalIngresos } = kpis;
  
  const targetSubs = totalIngresos * 0.05; // 5% máximo en suscripciones
  const reductionNeeded = Math.max(0, totalSuscripciones - targetSubs);
  
  const progress = previousMonth 
    ? {
        trend: totalSuscripciones < previousMonth.suscripciones ? "improving" : "stable",
        message: totalSuscripciones < previousMonth.suscripciones 
          ? `Redujiste $${Math.round(previousMonth.suscripciones - totalSuscripciones)} en suscripciones`
          : "Suscripciones sin cambios",
      }
    : { trend: "neutral", message: "Iniciando auditoría de suscripciones" };
  
  return {
    type: "recortar_subs",
    title: "Optimización de Suscripciones",
    
    auto: {
      currentTotal: Math.round(totalSuscripciones),
      targetTotal: Math.round(targetSubs),
      reductionNeeded: Math.round(reductionNeeded),
      percentOfIncome: pct(totalSuscripciones / totalIngresos),
      targetPercent: 5,
    },
    
    progress,
    
    status: reductionNeeded === 0 ? "achieved" : "needs_work",
    
    insights: [{
      priority: reductionNeeded > 0 ? "high" : "success",
      icon: reductionNeeded > 0 ? "✂️" : "✅",
      text: reductionNeeded > 0 
        ? `Recorta $${Math.round(reductionNeeded)} en suscripciones para llegar al 5% de ingresos`
        : "Tus suscripciones están optimizadas",
    }],
  };
}

// ========== HELPERS ==========
function getPreviousMonthData(profile) {
  if (!profile.monthly) return null;
  
  const months = Object.keys(profile.monthly).sort().reverse();
  if (months.length < 2) return null;
  
  const prevMonth = months[1]; // El mes anterior al actual
  return profile.monthly[prevMonth];
}