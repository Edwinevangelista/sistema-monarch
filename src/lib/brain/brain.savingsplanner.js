// src/lib/brain/brain.savingsplanner.js
// 💰 Sistema Inteligente de Planificación de Ahorro
// Genera planes personalizados basados en metas específicas del usuario

/**
 * Genera un plan de ahorro personalizado
 * @param {Object} goalData - Datos de la meta del usuario
 * @param {Object} kpis - KPIs financieros actuales
 * @returns {Object} Plan completo de ahorro
 */
export function generateSavingsPlan(goalData = {}, kpis = {}) {
  // Validar y limpiar entradas
  const safeKpis = {
    saldo: Number(kpis.saldo) || 0,
    totalIngresos: Number(kpis.totalIngresos) || 1000,
    totalGastos: Number(kpis.totalGastos) || 0,
    tasaAhorro: Number(kpis.tasaAhorro) || 0.10
  };

  const safeGoalData = {
    type: goalData.type || 'custom',
    amount: Number(goalData.amount) || 1000,
    timeframe: Number(goalData.timeframe) || 12,
    details: goalData.details || {}
  };

  const { type, amount, timeframe, details } = safeGoalData;
  
  // Calcular capacidad de ahorro
  const capacity = calculateSavingsCapacity(safeKpis);
  
  // Generar plan específico según tipo de meta
  let plan;
  try {
    switch (type) {
      case 'vacation':
        plan = generateVacationPlan(amount, timeframe, details, capacity, safeKpis);
        break;
      case 'purchase':
        plan = generatePurchasePlan(amount, timeframe, details, capacity, safeKpis);
        break;
      case 'emergency_fund':
        plan = generateEmergencyFundPlan(amount, timeframe, capacity, safeKpis);
        break;
      case 'custom':
        plan = generateCustomPlan(amount, timeframe, details, capacity, safeKpis);
        break;
      default:
        plan = generateGenericPlan(amount, timeframe, capacity, safeKpis);
    }
  } catch (error) {
    console.error('Error generando plan de ahorro:', error);
    plan = generateGenericPlan(amount, timeframe, capacity, safeKpis);
  }
  
  // Generar estrategias de ahorro
  const strategies = generateSavingsStrategies(plan, safeKpis);
  
  // Generar recomendaciones
  const recommendations = generateSavingsRecommendations(plan, capacity, safeKpis);
  
  return {
    ...plan,
    capacity,
    strategies,
    recommendations,
    feasibility: assessFeasibility(plan, capacity)
  };
}

// ========== CAPACIDAD DE AHORRO ==========

function calculateSavingsCapacity(kpis) {
  const saldo = Number(kpis.saldo) || 0;
  const totalIngresos = Number(kpis.totalIngresos) || 1000;
  const tasaAhorro = Number(kpis.tasaAhorro) || 0.10;
  
  const currentSavings = Math.max(0, saldo);
  const currentRate = Math.max(0, Math.min(1, tasaAhorro));
  
  // Calcular capacidad realista
  let monthlyCapacity;
  if (saldo < 0) {
    monthlyCapacity = totalIngresos * 0.05; // 5% mínimo
  } else if (currentRate < 0.10) {
    monthlyCapacity = totalIngresos * 0.10; // 10% objetivo inicial
  } else {
    monthlyCapacity = totalIngresos * Math.min(currentRate + 0.05, 0.30); // Hasta 30%
  }
  
  return {
    currentMonthlySavings: Math.round(currentSavings),
    currentRate: Math.round(currentRate * 100) / 100,
    recommendedMonthly: Math.round(monthlyCapacity),
    conservativeMonthly: Math.round(monthlyCapacity * 0.7),
    aggressiveMonthly: Math.round(monthlyCapacity * 1.3),
    maxRealistic: Math.round(totalIngresos * 0.30)
  };
}

// ========== PLAN DE VACACIONES ==========

function generateVacationPlan(amount, months, details, capacity, kpis) {
  const destination = details.destination || 'Destino deseado';
  const people = Number(details.people) || 1;
  const days = Number(details.days) || 7;
  
  // Estimar costos si no se proporcionó monto
  let estimatedAmount = Number(amount) || estimateVacationCost(destination, people, days);
  const safeMonths = Math.max(1, Number(months) || 12);
  const monthlyNeeded = Math.ceil(estimatedAmount / safeMonths);
  const isAchievable = monthlyNeeded <= capacity.aggressiveMonthly;
  
  // Desglose de costos
  const breakdown = {
    flights: Math.round(estimatedAmount * 0.35),
    accommodation: Math.round(estimatedAmount * 0.30),
    food: Math.round(estimatedAmount * 0.20),
    activities: Math.round(estimatedAmount * 0.10),
    misc: Math.round(estimatedAmount * 0.05)
  };
  
  return {
    type: 'vacation',
    goal: {
      destination,
      people,
      days,
      estimatedCost: Math.round(estimatedAmount)
    },
    
    plan: {
      targetAmount: Math.round(estimatedAmount),
      timeframe: safeMonths,
      monthlyRequired: monthlyNeeded,
      weeklyRequired: Math.ceil(monthlyNeeded / 4.33),
      totalSaved: 0
    },
    
    breakdown,
    
    timeline: generateSavingsTimeline(estimatedAmount, monthlyNeeded, safeMonths),
    
    isAchievable,
    adjustmentNeeded: isAchievable ? 0 : monthlyNeeded - capacity.aggressiveMonthly
  };
}

function estimateVacationCost(destination, people, days) {
  const costPerPersonPerDay = 150; // Estimación base
  return Math.round(people * days * costPerPersonPerDay);
}

// ========== PLAN DE COMPRA ==========

function generatePurchasePlan(amount, months, details, capacity, kpis) {
  const item = details.item || 'Artículo deseado';
  const category = details.category || 'general';
  
  const targetAmount = Number(amount) || 1000;
  const safeMonths = Math.max(1, Number(months) || 12);
  const monthlyNeeded = Math.ceil(targetAmount / safeMonths);
  const isAchievable = monthlyNeeded <= capacity.aggressiveMonthly;
  
  return {
    type: 'purchase',
    goal: {
      item,
      category,
      targetCost: Math.round(targetAmount)
    },
    
    plan: {
      targetAmount: Math.round(targetAmount),
      timeframe: safeMonths,
      monthlyRequired: monthlyNeeded,
      weeklyRequired: Math.ceil(monthlyNeeded / 4.33),
      totalSaved: 0
    },
    
    timeline: generateSavingsTimeline(targetAmount, monthlyNeeded, safeMonths),
    
    isAchievable,
    adjustmentNeeded: isAchievable ? 0 : monthlyNeeded - capacity.aggressiveMonthly,
    
    tips: [
      `Busca ofertas y descuentos para ${item}`,
      'Considera comprar de segunda mano si aplica',
      'Espera eventos de ventas especiales'
    ]
  };
}

// ========== FONDO DE EMERGENCIA ==========

function generateEmergencyFundPlan(amount, months, capacity, kpis) {
  const totalIngresos = Number(kpis.totalIngresos) || 1000;
  
  // Fondo de emergencia = 3-6 meses de gastos
  let targetAmount = Number(amount);
  if (!targetAmount) {
    const monthlyExpenses = totalIngresos * 0.7; // Estimación
    targetAmount = monthlyExpenses * 6; // 6 meses
  }
  
  const safeMonths = Math.max(1, Number(months) || 12);
  const monthlyNeeded = Math.ceil(targetAmount / safeMonths);
  const isAchievable = monthlyNeeded <= capacity.aggressiveMonthly;
  
  return {
    type: 'emergency_fund',
    goal: {
      targetMonths: 6,
      monthlyExpenses: Math.round(totalIngresos * 0.7),
      recommendedAmount: Math.round(targetAmount)
    },
    
    plan: {
      targetAmount: Math.round(targetAmount),
      timeframe: safeMonths,
      monthlyRequired: monthlyNeeded,
      weeklyRequired: Math.ceil(monthlyNeeded / 4.33),
      totalSaved: 0
    },
    
    timeline: generateSavingsTimeline(targetAmount, monthlyNeeded, safeMonths),
    
    milestones: [
      { amount: targetAmount * 0.25, label: '1.5 meses cubiertos' },
      { amount: targetAmount * 0.50, label: '3 meses cubiertos' },
      { amount: targetAmount * 0.75, label: '4.5 meses cubiertos' },
      { amount: targetAmount, label: '6 meses completos' }
    ],
    
    isAchievable,
    adjustmentNeeded: isAchievable ? 0 : monthlyNeeded - capacity.aggressiveMonthly
  };
}

// ========== PLAN PERSONALIZADO ==========

function generateCustomPlan(amount, months, details, capacity, kpis) {
  const goalName = details.name || 'Meta personalizada';
  const description = details.description || 'Tu meta de ahorro';
  
  const targetAmount = Number(amount) || 1000;
  const safeMonths = Math.max(1, Number(months) || 12);
  const monthlyNeeded = Math.ceil(targetAmount / safeMonths);
  const isAchievable = monthlyNeeded <= capacity.aggressiveMonthly;
  
  return {
    type: 'custom',
    goal: {
      name: goalName,
      description: description,
      targetAmount: Math.round(targetAmount)
    },
    
    plan: {
      targetAmount: Math.round(targetAmount),
      timeframe: safeMonths,
      monthlyRequired: monthlyNeeded,
      weeklyRequired: Math.ceil(monthlyNeeded / 4.33),
      totalSaved: 0
    },
    
    timeline: generateSavingsTimeline(targetAmount, monthlyNeeded, safeMonths),
    
    isAchievable,
    adjustmentNeeded: isAchievable ? 0 : monthlyNeeded - capacity.aggressiveMonthly
  };
}

// ========== PLAN GENÉRICO ==========

function generateGenericPlan(amount, months, capacity, kpis) {
  const targetAmount = Number(amount) || 1000;
  const safeMonths = Math.max(1, Number(months) || 12);
  const monthlyNeeded = Math.ceil(targetAmount / safeMonths);
  const isAchievable = monthlyNeeded <= capacity.aggressiveMonthly;
  
  return {
    type: 'generic',
    goal: {
      targetAmount: Math.round(targetAmount)
    },
    
    plan: {
      targetAmount: Math.round(targetAmount),
      timeframe: safeMonths,
      monthlyRequired: monthlyNeeded,
      weeklyRequired: Math.ceil(monthlyNeeded / 4.33),
      totalSaved: 0
    },
    
    timeline: generateSavingsTimeline(targetAmount, monthlyNeeded, safeMonths),
    
    isAchievable,
    adjustmentNeeded: isAchievable ? 0 : monthlyNeeded - capacity.aggressiveMonthly
  };
}

// ========== TIMELINE ==========

function generateSavingsTimeline(targetAmount, monthlyAmount, totalMonths) {
  const timeline = [];
  let accumulated = 0;
  
  for (let month = 1; month <= Math.min(totalMonths, 120); month++) {
    accumulated += monthlyAmount;
    
    if (accumulated >= targetAmount) {
      timeline.push({
        month,
        amount: Math.round(targetAmount),
        percentage: 100,
        milestone: 'Meta alcanzada'
      });
      break;
    }
    
    const percentage = Math.round((accumulated / targetAmount) * 100);
    let milestone = null;
    
    if (percentage === 25) milestone = '25% alcanzado';
    if (percentage === 50) milestone = '50% alcanzado';
    if (percentage === 75) milestone = '75% alcanzado';
    
    timeline.push({
      month,
      amount: Math.round(accumulated),
      percentage,
      milestone
    });
  }
  
  return timeline;
}

// ========== ESTRATEGIAS DE AHORRO ==========

function generateSavingsStrategies(plan, kpis) {
  const monthlyNeeded = plan.plan?.monthlyRequired || 0;
  const totalIngresos = Number(kpis.totalIngresos) || 1000;
  
  return {
    conservative: {
      name: 'Conservadora',
      monthlyAmount: Math.round(monthlyNeeded * 0.7),
      description: 'Ahorro gradual y sostenible',
      timeAdjustment: '+43%',
      pros: ['Menor presión financiera', 'Más flexible'],
      cons: ['Toma más tiempo']
    },
    
    balanced: {
      name: 'Balanceada',
      monthlyAmount: Math.round(monthlyNeeded),
      description: 'Balance entre velocidad y comodidad',
      timeAdjustment: 'Original',
      pros: ['Tiempo razonable', 'Manejable'],
      cons: ['Requiere disciplina']
    },
    
    aggressive: {
      name: 'Agresiva',
      monthlyAmount: Math.round(monthlyNeeded * 1.3),
      description: 'Ahorro acelerado',
      timeAdjustment: '-23%',
      pros: ['Meta más rápida', 'Mayor satisfacción'],
      cons: ['Requiere sacrificios']
    }
  };
}

// ========== RECOMENDACIONES ==========

function generateSavingsRecommendations(plan, capacity, kpis) {
  const recommendations = [];
  const monthlyNeeded = plan.plan?.monthlyRequired || 0;
  
  // Recomendación de factibilidad
  if (monthlyNeeded > capacity.aggressiveMonthly) {
    recommendations.push({
      priority: 'high',
      category: 'feasibility',
      icon: '⚠️',
      title: 'Meta ambiciosa',
      message: `Necesitas $${monthlyNeeded}/mes pero tu capacidad máxima es $${capacity.aggressiveMonthly}`,
      actions: [
        'Aumenta tu plazo de ahorro',
        'Reduce el monto objetivo',
        'Busca formas de aumentar ingresos'
      ]
    });
  } else if (monthlyNeeded > capacity.recommendedMonthly) {
    recommendations.push({
      priority: 'medium',
      category: 'feasibility',
      icon: '💪',
      title: 'Meta desafiante',
      message: 'Requerirá esfuerzo extra pero es alcanzable',
      actions: [
        'Mantén disciplina en gastos',
        'Busca ahorros adicionales cuando sea posible'
      ]
    });
  } else {
    recommendations.push({
      priority: 'success',
      category: 'feasibility',
      icon: '✅',
      title: 'Meta alcanzable',
      message: 'Esta meta está dentro de tu capacidad de ahorro',
      actions: [
        'Automatiza tus ahorros',
        'Mantén la constancia'
      ]
    });
  }
  
  // Recomendación de automatización
  recommendations.push({
    priority: 'info',
    category: 'automation',
    icon: '🤖',
    title: 'Automatiza tu ahorro',
    message: 'Configura transferencias automáticas el día que recibes tu ingreso',
    actions: [
      'Crea una cuenta separada para ahorros',
      'Programa transferencias automáticas'
    ]
  });
  
  return recommendations;
}

// ========== EVALUACIÓN DE FACTIBILIDAD ==========

function assessFeasibility(plan, capacity) {
  const monthlyNeeded = plan.plan?.monthlyRequired || 0;
  
  let level, message, color;
  
  if (monthlyNeeded <= capacity.conservativeMonthly) {
    level = 'easy';
    message = 'Meta fácilmente alcanzable con tu capacidad actual';
    color = 'green';
  } else if (monthlyNeeded <= capacity.recommendedMonthly) {
    level = 'moderate';
    message = 'Meta alcanzable con ahorro consistente';
    color = 'blue';
  } else if (monthlyNeeded <= capacity.aggressiveMonthly) {
    level = 'challenging';
    message = 'Meta desafiante que requerirá esfuerzo extra';
    color = 'yellow';
  } else {
    level = 'difficult';
    message = 'Meta muy ambiciosa - considera ajustar monto o plazo';
    color = 'red';
  }
  
  return {
    level,
    message,
    color,
    percentage: Math.min(100, Math.round((capacity.aggressiveMonthly / monthlyNeeded) * 100))
  };
}