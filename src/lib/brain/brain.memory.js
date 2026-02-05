// src/lib/brain/brain.memory.js
// 🧠 Sistema de Memoria Conversacional
// Recuerda interacciones, promesas, consejos ignorados y contexto histórico

const MEMORY_KEY = 'monarch_brain_memory';
const MAX_CONVERSATIONS = 100; // Últimas 100 interacciones

/**
 * Estructura de memoria:
 * {
 *   conversations: [
 *     {
 *       id: "uuid",
 *       timestamp: "2026-01-01T10:00:00",
 *       type: "advice" | "promise" | "question" | "report",
 *       user: "Voy a reducir gastos este mes",
 *       ai: "Perfecto, tu meta es reducir $95",
 *       context: { goal: "controlar_gastos", deficit: -86 },
 *       followed: null | true | false // Si siguió el consejo
 *     }
 *   ],
 *   promises: [
 *     {
 *       id: "uuid",
 *       date: "2026-01-01",
 *       promise: "Cancelar Netflix",
 *       dueDate: "2026-01-15",
 *       completed: false,
 *       reminded: 0
 *     }
 *   ],
 *   insights: [
 *     {
 *       pattern: "always_late_credit",
 *       detected: "2026-01-01",
 *       severity: "high",
 *       message: "Siempre pagas tarde la tarjeta"
 *     }
 *   ]
 * }
 */

// ========== CARGAR/GUARDAR MEMORIA ==========
export function loadMemory() {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (!stored) {
      return initializeMemory();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading memory:', error);
    return initializeMemory();
  }
}

export function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (error) {
    console.error('Error saving memory:', error);
  }
}

function initializeMemory() {
  return {
    conversations: [],
    promises: [],
    insights: [],
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalInteractions: 0
    }
  };
}

// ========== AGREGAR INTERACCIONES ==========

/**
 * Registra una nueva interacción
 */
export function recordInteraction(type, userMessage, aiResponse, context = {}) {
  const memory = loadMemory();
  
  const interaction = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type,
    user: userMessage,
    ai: aiResponse,
    context,
    followed: null
  };

  memory.conversations.unshift(interaction);
  
  // Mantener solo las últimas MAX_CONVERSATIONS
  if (memory.conversations.length > MAX_CONVERSATIONS) {
    memory.conversations = memory.conversations.slice(0, MAX_CONVERSATIONS);
  }

  memory.metadata.totalInteractions++;
  memory.metadata.lastUpdated = new Date().toISOString();
  
  saveMemory(memory);
  return interaction;
}

/**
 * Registra una promesa del usuario
 */
export function recordPromise(promiseText, dueDate = null) {
  const memory = loadMemory();
  
  const promise = {
    id: generateId(),
    date: new Date().toISOString(),
    promise: promiseText,
    dueDate: dueDate || addDays(new Date(), 7).toISOString(), // Default: 7 días
    completed: false,
    reminded: 0,
    relatedGoal: null
  };

  memory.promises.push(promise);
  memory.metadata.lastUpdated = new Date().toISOString();
  
  saveMemory(memory);
  return promise;
}

/**
 * Marcar promesa como completada
 */
export function completePromise(promiseId) {
  const memory = loadMemory();
  const promise = memory.promises.find(p => p.id === promiseId);
  
  if (promise) {
    promise.completed = true;
    promise.completedDate = new Date().toISOString();
    saveMemory(memory);
  }
  
  return promise;
}

/**
 * Registrar que un consejo fue seguido o ignorado
 */
export function markAdviceFollowed(interactionId, followed) {
  const memory = loadMemory();
  const interaction = memory.conversations.find(c => c.id === interactionId);
  
  if (interaction) {
    interaction.followed = followed;
    saveMemory(memory);
  }
}

// ========== CONSULTAS DE MEMORIA ==========

/**
 * Obtener conversaciones recientes
 */
export function getRecentConversations(limit = 10) {
  const memory = loadMemory();
  return memory.conversations.slice(0, limit);
}

/**
 * Buscar conversaciones por contexto
 */
export function findConversationsByContext(contextKey, contextValue) {
  const memory = loadMemory();
  return memory.conversations.filter(c => 
    c.context && c.context[contextKey] === contextValue
  );
}

/**
 * Obtener promesas pendientes
 */
export function getPendingPromises() {
  const memory = loadMemory();
  return memory.promises.filter(p => !p.completed);
}

/**
 * Obtener promesas vencidas
 */
export function getOverduePromises() {
  const now = new Date();
  const memory = loadMemory();
  
  return memory.promises.filter(p => 
    !p.completed && new Date(p.dueDate) < now
  );
}

/**
 * Obtener consejos ignorados
 */
export function getIgnoredAdvice(limit = 5) {
  const memory = loadMemory();
  return memory.conversations
    .filter(c => c.type === 'advice' && c.followed === false)
    .slice(0, limit);
}

/**
 * Calcular tasa de seguimiento de consejos
 */
export function calculateAdviceFollowRate() {
  const memory = loadMemory();
  const adviceWithFeedback = memory.conversations.filter(c => 
    c.type === 'advice' && c.followed !== null
  );
  
  if (adviceWithFeedback.length === 0) return null;
  
  const followed = adviceWithFeedback.filter(c => c.followed === true).length;
  return (followed / adviceWithFeedback.length) * 100;
}

// ========== INSIGHTS ==========

/**
 * Agregar insight detectado
 */
export function addInsight(pattern, severity, message) {
  const memory = loadMemory();
  
  // Evitar duplicados
  const exists = memory.insights.some(i => i.pattern === pattern);
  if (exists) return;
  
  const insight = {
    pattern,
    detected: new Date().toISOString(),
    severity,
    message,
    acknowledged: false
  };

  memory.insights.push(insight);
  saveMemory(memory);
  return insight;
}

/**
 * Obtener insights no reconocidos
 */
export function getUnacknowledgedInsights() {
  const memory = loadMemory();
  return memory.insights.filter(i => !i.acknowledged);
}

/**
 * Marcar insight como reconocido
 */
export function acknowledgeInsight(pattern) {
  const memory = loadMemory();
  const insight = memory.insights.find(i => i.pattern === pattern);
  
  if (insight) {
    insight.acknowledged = true;
    insight.acknowledgedDate = new Date().toISOString();
    saveMemory(memory);
  }
}

// ========== ANÁLISIS DE MEMORIA ==========

/**
 * Obtener contexto relevante para la conversación actual
 */
export function getRelevantContext(currentGoal, currentSituation) {
  const memory = loadMemory();
  
  const context = {
    recentConversations: memory.conversations.slice(0, 5),
    relatedPastGoals: findConversationsByContext('goal', currentGoal).slice(0, 3),
    pendingPromises: getPendingPromises(),
    overduePromises: getOverduePromises(),
    ignoredAdvice: getIgnoredAdvice(3),
    adviceFollowRate: calculateAdviceFollowRate(),
    insights: getUnacknowledgedInsights()
  };

  return context;
}

/**
 * Generar resumen de memoria para el AI
 */
export function generateMemorySummary() {
  const memory = loadMemory();
  const context = getRelevantContext();
  
  const summary = {
    hasHistory: memory.conversations.length > 0,
    totalInteractions: memory.metadata.totalInteractions,
    recentActivity: memory.conversations.length > 0 
      ? `Última interacción: ${getTimeSince(memory.conversations[0].timestamp)}`
      : 'Primera vez',
    
    pendingPromises: context.pendingPromises.length,
    overduePromises: context.overduePromises.length,
    
    discipline: context.adviceFollowRate !== null
      ? context.adviceFollowRate > 70 ? 'high' : context.adviceFollowRate > 40 ? 'medium' : 'low'
      : 'unknown',
    
    keyInsights: context.insights.slice(0, 3).map(i => i.message)
  };

  return summary;
}

// ========== UTILIDADES ==========

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getTimeSince(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = now - past;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'hace un momento';
}

// ========== LIMPIAR MEMORIA ==========

/**
 * Limpiar conversaciones antiguas (mantener últimas 100)
 */
export function cleanOldConversations() {
  const memory = loadMemory();
  if (memory.conversations.length > MAX_CONVERSATIONS) {
    memory.conversations = memory.conversations.slice(0, MAX_CONVERSATIONS);
    saveMemory(memory);
  }
}

/**
 * Resetear toda la memoria (usar con precaución)
 */
export function resetMemory() {
  const fresh = initializeMemory();
  saveMemory(fresh);
  return fresh;
}

/**
 * Exportar memoria (para backup)
 */
export function exportMemory() {
  return loadMemory();
}

/**
 * Importar memoria (desde backup)
 */
export function importMemory(memoryData) {
  saveMemory(memoryData);
}