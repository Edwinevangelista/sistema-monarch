// src/lib/brain/brain.adaptive.js
// 🧠 Personalidad Evolutiva y Tono Adaptativo
// El cerebro ajusta su personalidad según comportamiento del usuario

import { 
  getIgnoredAdvice, 
  calculateAdviceFollowRate, 
  getPendingPromises,
  getOverduePromises 
} from './brain.memory';

/**
 * Ajusta dinámicamente el tono y personalidad del asistente
 * basado en el comportamiento histórico del usuario
 */
export function adaptPersonality(profile, kpis, patterns) {
  const personality = {
    tone: profile.tone || 'amigable', // Base actual
    intensity: 5, // 1-10 escala
    style: 'balanced', // balanced, strict, motivational, casual
    messages: {},
    shouldEscalate: false
  };

  // Factores que determinan la personalidad
  const factors = analyzeBehaviorFactors(profile, kpis, patterns);

  // Ajustar tono basado en factores
  personality.tone = determineTone(factors);
  personality.intensity = determineIntensity(factors);
  personality.style = determineStyle(factors);
  personality.messages = generateAdaptiveMessages(factors, personality);
  personality.shouldEscalate = factors.situation === 'critical';

  return personality;
}

// ========== ANÁLISIS DE FACTORES ==========

function analyzeBehaviorFactors(profile, kpis, patterns) {
  const factors = {
    // Situación financiera actual
    situation: 'neutral',
    urgency: 0, // 0-100
    
    // Comportamiento histórico
    discipline: calculateDisciplineScore(),
    consistency: calculateConsistencyScore(profile),
    improvement: calculateImprovementTrend(profile),
    
    // Engagement
    responseRate: calculateResponseRate(),
    promiseKeeping: calculatePromiseKeepingRate(),
    
    // Riesgo
    riskLevel: assessRiskLevel(kpis, patterns),
    timeInCrisis: calculateTimeInCrisis(profile),
    
    // Contexto emocional
    needsEncouragement: false,
    needsWakeUpCall: false,
    deservesRecognition: false
  };

  // Evaluar situación actual
  if (kpis.saldo < -500) {
    factors.situation = 'critical';
    factors.urgency = 90;
  } else if (kpis.saldo < 0) {
    factors.situation = 'concerning';
    factors.urgency = 60;
  } else if (kpis.tasaAhorro < 0.05) {
    factors.situation = 'needs_work';
    factors.urgency = 40;
  } else if (kpis.tasaAhorro > 0.15) {
    factors.situation = 'excellent';
    factors.deservesRecognition = true;
  }

  // Evaluar necesidad de intervención
  if (factors.discipline < 30 && factors.situation === 'critical') {
    factors.needsWakeUpCall = true;
  }

  if (factors.discipline > 50 && factors.improvement < 0) {
    factors.needsEncouragement = true;
  }

  return factors;
}

// ========== CÁLCULO DE SCORES ==========

function calculateDisciplineScore() {
  const followRate = calculateAdviceFollowRate();
  if (followRate === null) return 50; // Neutro si no hay datos
  return followRate;
}

function calculateConsistencyScore(profile) {
  // Mide si el usuario registra datos consistentemente
  const months = Object.keys(profile.monthly || {});
  if (months.length < 2) return 50;
  
  // Score basado en completitud de datos
  const recentMonths = months.slice(0, 3);
  let completeness = 0;
  
  recentMonths.forEach(month => {
    const data = profile.monthly[month];
    let monthScore = 0;
    
    if (data.ingresos > 0) monthScore += 25;
    if (data.gastos > 0) monthScore += 25;
    if (data.gastosVariables > 0) monthScore += 25;
    if (data.gastosFijos > 0) monthScore += 25;
    
    completeness += monthScore;
  });
  
  return completeness / recentMonths.length;
}

function calculateImprovementTrend(profile) {
  const months = Object.keys(profile.monthly || {}).sort().reverse();
  if (months.length < 3) return 0;
  
  // Comparar últimos 2 meses con meses anteriores
  const recent = months.slice(0, 2).map(m => profile.monthly[m].tasaAhorro || 0);
  const older = months.slice(2, 4).map(m => profile.monthly[m].tasaAhorro || 0);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  return recentAvg - olderAvg; // Positivo = mejorando
}

function calculateResponseRate() {
  // En una implementación completa, esto mediría cuántas veces
  // el usuario interactúa con el asistente vs lo ignora
  // Por ahora, placeholder
  return 70;
}

function calculatePromiseKeepingRate() {
  const pending = getPendingPromises();
  const overdue = getOverduePromises();
  
  if (pending.length === 0) return 100;
  
  const keptRate = ((pending.length - overdue.length) / pending.length) * 100;
  return Math.max(0, keptRate);
}

function assessRiskLevel(kpis, patterns) {
  let riskScore = 0;
  
  // Factores de riesgo
  if (kpis.saldo < -500) riskScore += 40;
  else if (kpis.saldo < 0) riskScore += 20;
  
  if (kpis.tasaAhorro < 0) riskScore += 30;
  else if (kpis.tasaAhorro < 0.05) riskScore += 15;
  
  const criticalPatterns = patterns.filter(p => p.severity === 'critical').length;
  const highPatterns = patterns.filter(p => p.severity === 'high').length;
  
  riskScore += criticalPatterns * 15;
  riskScore += highPatterns * 10;
  
  if (riskScore >= 70) return 'critical';
  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
}

function calculateTimeInCrisis(profile) {
  const months = Object.keys(profile.monthly || {}).sort().reverse();
  let consecutiveDeficit = 0;
  
  for (const month of months) {
    const data = profile.monthly[month];
    if (data.saldo < 0) {
      consecutiveDeficit++;
    } else {
      break;
    }
  }
  
  return consecutiveDeficit;
}

// ========== DETERMINACIÓN DE PERSONALIDAD ==========

function determineTone(factors) {
  // Escalada de tono según situación y disciplina
  
  if (factors.needsWakeUpCall) {
    return 'muy_directo'; // Tono más fuerte
  }
  
  if (factors.situation === 'critical') {
    if (factors.discipline < 40) {
      return 'estricto'; // Firme pero constructivo
    }
    return 'directo'; // Serio pero no agresivo
  }
  
  if (factors.situation === 'concerning') {
    if (factors.discipline < 50) {
      return 'directo';
    }
    return 'motivador'; // Apoyo con urgencia
  }
  
  if (factors.deservesRecognition) {
    return 'celebratorio'; // Reconocer logros
  }
  
  if (factors.needsEncouragement) {
    return 'motivador';
  }
  
  return 'amigable'; // Default
}

function determineIntensity(factors) {
  let intensity = 5; // Base neutra
  
  // Aumentar intensidad por urgencia
  intensity += Math.floor(factors.urgency / 20);
  
  // Reducir si disciplina es alta (no necesita tanto empuje)
  if (factors.discipline > 70) {
    intensity -= 2;
  }
  
  // Aumentar si lleva mucho tiempo en crisis
  if (factors.timeInCrisis >= 3) {
    intensity += 2;
  }
  
  return Math.max(1, Math.min(10, intensity));
}

function determineStyle(factors) {
  if (factors.needsWakeUpCall) return 'wake_up_call';
  if (factors.deservesRecognition) return 'celebratory';
  if (factors.situation === 'critical') return 'strict';
  if (factors.needsEncouragement) return 'motivational';
  
  return 'balanced';
}

// ========== MENSAJES ADAPTATIVOS ==========

function generateAdaptiveMessages(factors, personality) {
  const messages = {
    greeting: generateGreeting(factors, personality),
    situation: generateSituationMessage(factors, personality),
    motivation: generateMotivation(factors, personality),
    callToAction: generateCallToAction(factors, personality)
  };
  
  return messages;
}

function generateGreeting(factors, personality) {
  const greetings = {
    celebratorio: [
      "¡Increíble! Estás haciendo un trabajo fantástico 🎉",
      "¡Wow! Tus números se ven espectaculares 🔥",
      "¡Sigue así campeón! Vas por excelente camino ⭐"
    ],
    motivador: [
      "Hey, vamos a seguir mejorando juntos 💪",
      "¡Tú puedes! Vamos paso a paso 🚀",
      "Cada día cuenta, sigamos adelante ✨"
    ],
    amigable: [
      "Hola, vamos a revisar tu situación 👋",
      "Hey, ¿cómo va todo? Analicemos juntos 📊",
      "Buen día, veamos cómo vas 🌟"
    ],
    directo: [
      "Tenemos que hablar sobre tu situación 💬",
      "Necesito tu atención en esto ⚠️",
      "Vamos directo al punto 🎯"
    ],
    estricto: [
      "Situación seria. Escúchame bien 🚨",
      "Momento de decisiones importantes ⚡",
      "No podemos seguir así 🛑"
    ],
    muy_directo: [
      "Compa, ALTO. Esto es urgente 🚨",
      "PARA. Tenemos que arreglar esto YA ⛔",
      "Suficiente. Hablemos claro 💥"
    ]
  };
  
  const options = greetings[personality.tone] || greetings.amigable;
  return options[Math.floor(Math.random() * options.length)];
}

function generateSituationMessage(factors, personality) {
  if (factors.situation === 'critical') {
    if (factors.timeInCrisis >= 3) {
      return `Llevas ${factors.timeInCrisis} meses en déficit. Esto no es sostenible.`;
    }
    return "Tu situación financiera necesita atención inmediata.";
  }
  
  if (factors.situation === 'concerning') {
    return "Hay señales de alerta que debemos atender pronto.";
  }
  
  if (factors.situation === 'excellent') {
    return "¡Excelente! Estás en el camino correcto 🎯";
  }
  
  return "Tu situación es estable, pero podemos optimizar.";
}

function generateMotivation(factors, personality) {
  if (factors.needsWakeUpCall) {
    return "Sé que puedes hacerlo mejor. Te necesito comprometido al 100%.";
  }
  
  if (factors.needsEncouragement) {
    return "Has estado haciendo bien las cosas. No te desanimes ahora.";
  }
  
  if (factors.deservesRecognition) {
    return "Deberías estar orgulloso de tu progreso. Esto no es fácil.";
  }
  
  if (factors.discipline < 30) {
    return "Necesito que confíes en el proceso y sigas los consejos.";
  }
  
  return "Cada paso cuenta. Vamos juntos en esto.";
}

function generateCallToAction(factors, personality) {
  if (factors.situation === 'critical' && factors.discipline < 40) {
    return "Elige UNA acción HOY y cúmplela. Sin excusas.";
  }
  
  if (factors.situation === 'critical') {
    return "Prioridad #1: Eliminar el déficit este mes.";
  }
  
  if (factors.needsEncouragement) {
    return "Mantén el impulso. Ajusta una cosa más esta semana.";
  }
  
  return "Elige la acción más importante y actúa hoy.";
}

// ========== ESCALAMIENTO AUTOMÁTICO ==========

/**
 * Determina si el asistente debe escalar su tono automáticamente
 */
export function shouldEscalateTone(profile, currentTone) {
  const ignoredAdvice = getIgnoredAdvice(5);
  const overduePromises = getOverduePromises();
  const discipline = calculateDisciplineScore();
  
  // Escalar si:
  // 1. Múltiples consejos ignorados + situación crítica
  if (ignoredAdvice.length >= 3 && profile.situation === 'critical') {
    return {
      shouldEscalate: true,
      newTone: 'estricto',
      reason: 'Múltiples consejos ignorados en situación crítica'
    };
  }
  
  // 2. Promesas vencidas + baja disciplina
  if (overduePromises.length >= 2 && discipline < 40) {
    return {
      shouldEscalate: true,
      newTone: 'directo',
      reason: 'Promesas incumplidas y baja disciplina'
    };
  }
  
  // 3. 3+ meses en déficit sin mejoría
  const timeInCrisis = calculateTimeInCrisis(profile);
  if (timeInCrisis >= 3) {
    return {
      shouldEscalate: true,
      newTone: 'muy_directo',
      reason: `${timeInCrisis} meses consecutivos en déficit`
    };
  }
  
  return {
    shouldEscalate: false,
    newTone: currentTone,
    reason: 'No se requiere escalamiento'
  };
}

/**
 * Determina si el asistente debe suavizar su tono (des-escalar)
 */
export function shouldDeescalateTone(profile, currentTone) {
  const discipline = calculateDisciplineScore();
  const improvement = calculateImprovementTrend(profile);
  const promiseKeeping = calculatePromiseKeepingRate();
  
  // Des-escalar si:
  // 1. Alta disciplina + mejorando
  if (discipline > 70 && improvement > 0) {
    return {
      shouldDeescalate: true,
      newTone: 'amigable',
      reason: 'Alta disciplina y mejora consistente'
    };
  }
  
  // 2. Cumpliendo promesas + situación mejorando
  if (promiseKeeping > 80 && profile.situation === 'excellent') {
    return {
      shouldDeescalate: true,
      newTone: 'motivador',
      reason: 'Cumpliendo compromisos y situación excelente'
    };
  }
  
  return {
    shouldDeescalate: false,
    newTone: currentTone,
    reason: 'Mantener tono actual'
  };
}

// ========== EXPORTAR PERSONALIDAD ACTUALIZADA ==========

/**
 * Actualiza el perfil con la nueva personalidad adaptada
 */
export function updateProfilePersonality(profile, newPersonality) {
  return {
    ...profile,
    tone: newPersonality.tone,
    intensity: newPersonality.intensity,
    style: newPersonality.style,
    lastPersonalityUpdate: new Date().toISOString(),
    personalityHistory: [
      ...(profile.personalityHistory || []),
      {
        date: new Date().toISOString(),
        tone: newPersonality.tone,
        reason: newPersonality.shouldEscalate ? 'Escalated' : 'Normal adaptation'
      }
    ].slice(-10) // Mantener últimos 10 cambios
  };
}