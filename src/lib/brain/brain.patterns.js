// src/lib/brain/brain.patterns.js
// 🧠 Detección de Patrones de Comportamiento
// Analiza histórico y detecta tendencias, hábitos y señales de alerta

import { addInsight } from './brain.memory';

/**
 * Analiza el perfil completo y detecta patrones de comportamiento
 */
export function detectBehaviorPatterns(profile) {
  if (!profile.monthly || Object.keys(profile.monthly).length < 2) {
    return {
      patterns: [],
      message: "Necesitamos más datos (2+ meses) para detectar patrones"
    };
  }

  const patterns = [];
  
  // Analizar cada tipo de patrón
  patterns.push(...detectSpendingPatterns(profile));
  patterns.push(...detectIncomePatterns(profile));
  patterns.push(...detectDebtPatterns(profile));
  patterns.push(...detectSavingsPatterns(profile));
  patterns.push(...detectDisciplinePatterns(profile));

  // Guardar insights importantes
  patterns
    .filter(p => p.severity === 'high' || p.severity === 'critical')
    .forEach(p => addInsight(p.id, p.severity, p.message));

  return {
    patterns,
    summary: generatePatternSummary(patterns)
  };
}

// ========== PATRONES DE GASTOS ==========

function detectSpendingPatterns(profile) {
  const patterns = [];
  const months = getSortedMonths(profile.monthly);
  
  if (months.length < 2) return patterns;

  // Patrón 1: Gastos creciendo consistentemente
  const spendingTrend = calculateTrend(months.map(m => profile.monthly[m].gastos));
  if (spendingTrend > 0.05) { // Crecimiento >5% mensual
    patterns.push({
      id: 'spending_increasing',
      type: 'spending',
      severity: 'high',
      message: `Tus gastos han aumentado ${Math.round(spendingTrend * 100)}% cada mes. Esto es insostenible.`,
      recommendation: 'Identifica las 3 categorías que más crecieron y establece límites.',
      impact: 'negative'
    });
  }

  // Patrón 2: Gastos variables muy inestables
  const variableStability = calculateVolatility(months.map(m => profile.monthly[m].gastosVariables || 0));
  if (variableStability > 30) { // Volatilidad >30%
    patterns.push({
      id: 'variable_spending_unstable',
      type: 'spending',
      severity: 'medium',
      message: 'Tus gastos variables son muy impredecibles (varían hasta 30%).',
      recommendation: 'Establece un presupuesto semanal fijo para gastos variables.',
      impact: 'negative'
    });
  }

  // Patrón 3: Déficit recurrente
  const deficitMonths = months.filter(m => {
    const data = profile.monthly[m];
    return (data.ingresos - data.gastos) < 0;
  });

  if (deficitMonths.length >= 2) {
    patterns.push({
      id: 'recurring_deficit',
      type: 'spending',
      severity: 'critical',
      message: `Has tenido déficit en ${deficitMonths.length} de los últimos ${months.length} meses.`,
      recommendation: 'URGENTE: Reduce gastos fijos y elimina gastos no esenciales.',
      impact: 'critical'
    });
  }

  // Patrón 4: Suscripciones creciendo
  const subsTrend = calculateTrend(months.map(m => profile.monthly[m].suscripciones || 0));
  if (subsTrend > 0.1) {
    patterns.push({
      id: 'subscriptions_growing',
      type: 'spending',
      severity: 'medium',
      message: 'Tus suscripciones están creciendo. Revisa las que no usas.',
      recommendation: 'Cancela al menos 2 suscripciones que uses menos de 2 veces al mes.',
      impact: 'negative'
    });
  }

  return patterns;
}

// ========== PATRONES DE INGRESOS ==========

function detectIncomePatterns(profile) {
  const patterns = [];
  const months = getSortedMonths(profile.monthly);
  
  if (months.length < 2) return patterns;

  // Patrón 1: Ingresos decreciendo
  const incomeTrend = calculateTrend(months.map(m => profile.monthly[m].ingresos));
  if (incomeTrend < -0.05) {
    patterns.push({
      id: 'income_decreasing',
      type: 'income',
      severity: 'high',
      message: `Tus ingresos han bajado ${Math.abs(Math.round(incomeTrend * 100))}% mensual.`,
      recommendation: 'Busca fuentes de ingreso adicionales o negocia un aumento.',
      impact: 'negative'
    });
  }

  // Patrón 2: Ingresos muy volátiles
  const incomeStability = calculateVolatility(months.map(m => profile.monthly[m].ingresos));
  if (incomeStability > 25) {
    patterns.push({
      id: 'income_unstable',
      type: 'income',
      severity: 'medium',
      message: 'Tus ingresos varían mucho mes a mes (freelance o comisiones).',
      recommendation: 'Construye un fondo de emergencia de 6 meses para estabilidad.',
      impact: 'neutral'
    });
  }

  // Patrón 3: Ingresos creciendo consistentemente
  if (incomeTrend > 0.05) {
    patterns.push({
      id: 'income_growing',
      type: 'income',
      severity: 'low',
      message: `¡Excelente! Tus ingresos crecen ${Math.round(incomeTrend * 100)}% mensual.`,
      recommendation: 'Aprovecha para aumentar tu tasa de ahorro al 20%.',
      impact: 'positive'
    });
  }

  return patterns;
}

// ========== PATRONES DE DEUDAS ==========

function detectDebtPatterns(profile) {
  const patterns = [];
  const months = getSortedMonths(profile.monthly);
  
  if (months.length < 2) return patterns;

  // Patrón 1: Deudas creciendo
  const debtData = months.map(m => profile.monthly[m].totalDeudas || 0);
  const debtTrend = calculateTrend(debtData);
  
  if (debtTrend > 0.03) {
    patterns.push({
      id: 'debt_increasing',
      type: 'debt',
      severity: 'high',
      message: 'Tus deudas están creciendo. Necesitas un plan de pago urgente.',
      recommendation: 'Método bola de nieve: paga primero la deuda más pequeña.',
      impact: 'negative'
    });
  }

  // Patrón 2: Pagando solo mínimos
  const avgDebtPayment = average(months.map(m => profile.monthly[m].pagoDeudas || 0));
  const avgDebtBalance = average(debtData);
  
  if (avgDebtPayment > 0 && avgDebtBalance > 0) {
    const paymentRatio = avgDebtPayment / avgDebtBalance;
    if (paymentRatio < 0.05) { // Menos del 5% mensual
      patterns.push({
        id: 'minimum_payments_only',
        type: 'debt',
        severity: 'high',
        message: 'Solo pagas mínimos. A este ritmo tardarás años en salir de deudas.',
        recommendation: 'Aumenta pagos al menos al 10% del balance o usa método avalancha.',
        impact: 'negative'
      });
    }
  }

  // Patrón 3: Reduciendo deudas exitosamente
  if (debtTrend < -0.05) {
    patterns.push({
      id: 'debt_decreasing',
      type: 'debt',
      severity: 'low',
      message: `¡Bien hecho! Has reducido deudas ${Math.abs(Math.round(debtTrend * 100))}% mensual.`,
      recommendation: 'Mantén el impulso. Considera aumentar pagos si hay margen.',
      impact: 'positive'
    });
  }

  return patterns;
}

// ========== PATRONES DE AHORRO ==========

function detectSavingsPatterns(profile) {
  const patterns = [];
  const months = getSortedMonths(profile.monthly);
  
  if (months.length < 2) return patterns;

  // Patrón 1: Tasa de ahorro consistentemente baja
  const savingsRates = months.map(m => profile.monthly[m].tasaAhorro || 0);
  const avgSavings = average(savingsRates);
  
  if (avgSavings < 0.05) {
    patterns.push({
      id: 'low_savings_rate',
      type: 'savings',
      severity: 'high',
      message: `Tu tasa de ahorro promedio es ${Math.round(avgSavings * 100)}%. Muy bajo.`,
      recommendation: 'Meta: Llegar al 10% reduciendo gastos no esenciales.',
      impact: 'negative'
    });
  }

  // Patrón 2: No hay ahorro consistente
  const monthsWithSavings = months.filter(m => {
    const data = profile.monthly[m];
    return (data.ingresos - data.gastos) > 0;
  });

  if (monthsWithSavings.length === 0) {
    patterns.push({
      id: 'no_consistent_savings',
      type: 'savings',
      severity: 'critical',
      message: 'No has logrado ahorrar ningún mes. Situación crítica.',
      recommendation: 'Automatiza ahorro del 5% apenas recibas ingresos.',
      impact: 'critical'
    });
  }

  // Patrón 3: Mejorando tasa de ahorro
  const savingsTrend = calculateTrend(savingsRates);
  if (savingsTrend > 0.02) {
    patterns.push({
      id: 'savings_improving',
      type: 'savings',
      severity: 'low',
      message: '¡Excelente! Tu capacidad de ahorro está mejorando.',
      recommendation: 'Considera invertir el ahorro en fondos indexados.',
      impact: 'positive'
    });
  }

  return patterns;
}

// ========== PATRONES DE DISCIPLINA ==========

function detectDisciplinePatterns(profile) {
  const patterns = [];
  
  // Esto requiere datos de brain.memory.js
  // Por ahora, análisis básico del profile
  
  if (profile.discipline !== undefined) {
    if (profile.discipline < 40) {
      patterns.push({
        id: 'low_discipline',
        type: 'discipline',
        severity: 'high',
        message: 'Tu nivel de disciplina es bajo. Sigues pocos consejos.',
        recommendation: 'Empieza con 1 meta pequeña y cúmplela 30 días seguidos.',
        impact: 'negative'
      });
    } else if (profile.discipline > 70) {
      patterns.push({
        id: 'high_discipline',
        type: 'discipline',
        severity: 'low',
        message: '¡Eres muy disciplinado! Sigues la mayoría de consejos.',
        recommendation: 'Puedes establecer metas más ambiciosas.',
        impact: 'positive'
      });
    }
  }

  return patterns;
}

// ========== ANÁLISIS PREDICTIVO ==========

/**
 * Predice la situación del próximo mes basado en patrones
 */
export function predictNextMonth(profile) {
  const months = getSortedMonths(profile.monthly);
  if (months.length < 3) {
    return {
      canPredict: false,
      message: "Necesitamos al menos 3 meses de datos para predicciones"
    };
  }

  const lastMonths = months.slice(0, 3).map(m => profile.monthly[m]);

  const prediction = {
    expectedIncome: average(lastMonths.map(m => m.ingresos)),
    expectedExpenses: average(lastMonths.map(m => m.gastos)),
    riskLevel: 'medium',
    warnings: [],
    opportunities: []
  };

  // Calcular tendencias
  const incomeTrend = calculateTrend(lastMonths.map(m => m.ingresos));
  const expenseTrend = calculateTrend(lastMonths.map(m => m.gastos));

  // Ajustar predicción por tendencia
  prediction.expectedIncome *= (1 + incomeTrend);
  prediction.expectedExpenses *= (1 + expenseTrend);

  prediction.expectedBalance = prediction.expectedIncome - prediction.expectedExpenses;

  // Generar warnings
  if (prediction.expectedBalance < 0) {
    prediction.riskLevel = 'high';
    prediction.warnings.push('Déficit esperado el próximo mes');
  }

  if (expenseTrend > 0.05) {
    prediction.warnings.push('Gastos en aumento, controla ahora');
  }

  if (incomeTrend < -0.05) {
    prediction.warnings.push('Ingresos bajando, busca estabilidad');
  }

  // Generar oportunidades
  if (prediction.expectedBalance > 200) {
    prediction.opportunities.push(`Puedes ahorrar ${Math.round(prediction.expectedBalance)} extra`);
  }

  if (incomeTrend > 0.05) {
    prediction.opportunities.push('Ingresos creciendo, buen momento para invertir');
  }

  return prediction;
}

// ========== UTILIDADES ==========

function getSortedMonths(monthly) {
  return Object.keys(monthly).sort().reverse(); // Más reciente primero
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  
  // Regresión lineal simple
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  
  return avgValue > 0 ? slope / avgValue : 0; // Retorna tasa de cambio
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  
  const avg = average(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return avg > 0 ? (stdDev / avg) * 100 : 0; // Coeficiente de variación en %
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generatePatternSummary(patterns) {
  const critical = patterns.filter(p => p.severity === 'critical').length;
  const high = patterns.filter(p => p.severity === 'high').length;
  const positive = patterns.filter(p => p.impact === 'positive').length;
  
  return {
    totalPatterns: patterns.length,
    criticalIssues: critical,
    highPriorityIssues: high,
    positivePatterns: positive,
    overallHealth: critical > 0 ? 'critical' : high > 1 ? 'needs_attention' : 'good'
  };
}

/**
 * Recomendar siguiente acción basada en patrones
 */
export function recommendNextAction(patterns) {
  // Priorizar por severidad
  const critical = patterns.find(p => p.severity === 'critical');
  if (critical) return critical.recommendation;
  
  const high = patterns.find(p => p.severity === 'high');
  if (high) return high.recommendation;
  
  const medium = patterns.find(p => p.severity === 'medium');
  if (medium) return medium.recommendation;
  
  return "Mantén tus buenos hábitos financieros. Considera aumentar tu tasa de ahorro.";
}