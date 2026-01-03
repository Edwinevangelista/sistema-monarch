// src/lib/intelligenceEngine.js
// 🧠 Motor de Inteligencia Principal - Integra todos los módulos del cerebro
// CORRECCIÓN: Removido destructuring de variables no usadas en línea 74

import { generateDiagnosticReport } from './brain/brain.diagnostico';
import { generateAutoGoal } from './brain/brain.autogoals';
import { 
  recordInteraction, 
  getRelevantContext, 
  generateMemorySummary,
  recordPromise,
  getPendingPromises,
  getOverduePromises
} from './brain/brain.memory';
import { 
  detectBehaviorPatterns, 
  predictNextMonth,
  recommendNextAction 
} from './brain/brain.patterns';
import { 
  adaptPersonality,
  shouldEscalateTone,
  shouldDeescalateTone,
  updateProfilePersonality
} from './brain/brain.adaptive';

// ========== CONFIGURACIÓN ==========

const PROFILE_STORAGE_KEY = 'userFinancialProfile';

// ========== CÁLCULO DE KPIs ==========

export function calculateKPIs(data) {
  const { ingresos = [], gastosFijos = [], gastosVariables = [], suscripciones = [], deudas = [] } = data;

  const totalIngresos = ingresos.reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const totalGastosVariables = gastosVariables.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      const costo = Number(s.costo) || 0;
      if (s.ciclo === 'Anual') return sum + (costo / 12);
      if (s.ciclo === 'Semanal') return sum + (costo * 4.33);
      return sum + costo;
    }, 0);

  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;
  const saldo = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? saldo / totalIngresos : 0;

  const totalDeudas = deudas.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
  const pagosMinimosMensuales = deudas.reduce((sum, d) => sum + (Number(d.pago_minimo) || 0), 0);

  return {
    totalIngresos,
    totalGastosFijos,
    totalGastosVariables,
    totalSuscripciones,
    totalGastos,
    saldo,
    tasaAhorro,
    totalDeudas,
    pagosMinimosMensuales
  };
}

// ========== GESTIÓN DE PERFIL ==========

export function loadProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    // Perfil por defecto
    return {
      goal: 'general',
      tone: 'amigable',
      discipline: 50,
      riskTolerance: 'moderate',
      preferences: {
        notifications: true,
        autoAnalysis: true
      },
      monthlyHistory: []
    };
  } catch (e) {
    console.error('Error loading profile:', e);
    return {
      goal: 'general',
      tone: 'amigable',
      discipline: 50,
      riskTolerance: 'moderate',
      preferences: {
        notifications: true,
        autoAnalysis: true
      },
      monthlyHistory: []
    };
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error('Error saving profile:', e);
    return false;
  }
}

export function setGoal(newGoal) {
  try {
    const currentProfile = loadProfile();
    const updatedProfile = { ...currentProfile, goal: newGoal };
    saveProfile(updatedProfile);
    console.log(`🎯 Goal updated to: ${newGoal}`);
    return updatedProfile;
  } catch (e) {
    console.error('Error setting goal:', e);
    return null;
  }
}

export function updateProfile(updates) {
  try {
    const currentProfile = loadProfile();
    const updatedProfile = { ...currentProfile, ...updates };
    saveProfile(updatedProfile);
    console.log('✅ Profile updated:', updatedProfile);
    return updatedProfile;
  } catch (e) {
    console.error('Error updating profile:', e);
    return null;
  }
}

// Helper para actualizar histórico mensual
function updateMonthlyHistory(profile, kpis) {
  const history = profile.monthlyHistory || [];
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  // Agregar o actualizar mes actual
  const existingIndex = history.findIndex(h => h.month === currentMonth);
  const monthData = {
    month: currentMonth,
    ...kpis,
    timestamp: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    history[existingIndex] = monthData;
  } else {
    history.push(monthData);
  }
  
  // Mantener solo últimos 12 meses
  const recentHistory = history.slice(-12);
  
  return {
    ...profile,
    monthlyHistory: recentHistory
  };
}

// ========== MOTOR PRINCIPAL ==========

export function runIntelligence(data) {
  console.log('🧠 Intelligence Engine: Starting analysis...');
  
  // CORRECCIÓN: Removido destructuring innecesario (línea 74)
  // const { ingresos, gastosFijos, gastosVariables, suscripciones, deudas } = data;
  // Estas variables no se usan directamente, se pasan en el objeto 'data'
  
  // 1. CALCULAR KPIs
  const kpis = calculateKPIs(data);
  console.log('📊 KPIs calculated:', kpis);
  
  // 2. CARGAR PERFIL Y MEMORIA
  let profile = loadProfile();
  const memoryContext = getRelevantContext(profile.goal, kpis);
  const memorySummary = generateMemorySummary();
  console.log('🧠 Memory loaded:', memorySummary);
  
  // 3. ACTUALIZAR HISTÓRICO MENSUAL
  profile = updateMonthlyHistory(profile, kpis);
  
  // 4. DETECTAR PATRONES DE COMPORTAMIENTO
  const patternsAnalysis = detectBehaviorPatterns(profile);
  console.log('🔍 Patterns detected:', patternsAnalysis.summary);
  
  // 5. PREDECIR PRÓXIMO MES
  const prediction = predictNextMonth(profile);
  console.log('🔮 Next month prediction:', prediction);
  
  // 6. ADAPTAR PERSONALIDAD
  const personality = adaptPersonality(profile, kpis, patternsAnalysis.patterns);
  console.log('🎭 Personality adapted:', personality.tone, 'intensity:', personality.intensity);
  
  // 7. VERIFICAR SI NECESITA ESCALAR O DES-ESCALAR TONO
  const escalation = shouldEscalateTone(profile, personality.tone);
  const deescalation = shouldDeescalateTone(profile, personality.tone);
  
  if (escalation.shouldEscalate) {
    console.log('⚠️ Escalating tone:', escalation.reason);
    personality.tone = escalation.newTone;
    personality.intensity = Math.min(10, personality.intensity + 2);
  } else if (deescalation.shouldDeescalate) {
    console.log('✅ De-escalating tone:', deescalation.reason);
    personality.tone = deescalation.newTone;
    personality.intensity = Math.max(1, personality.intensity - 2);
  }
  
  // 8. ACTUALIZAR PERFIL CON NUEVA PERSONALIDAD
  profile = updateProfilePersonality(profile, personality);
  saveProfile(profile);
  
  // 9. GENERAR CONTENIDO SEGÚN META
  let output = {
    kpis,
    profile,
    memoryContext,
    memorySummary,
    patterns: patternsAnalysis,
    prediction,
    personality
  };

  if (profile.goal === 'general') {
    // MODO REPORTE GENERAL
    output.report = generateDiagnosticReport(kpis, profile, data, memoryContext);
    console.log('📄 General report generated');
  } else {
    // MODO META ESPECÍFICA
    output.autoGoal = generateAutoGoal(profile.goal, kpis, data, profile, memoryContext);
    console.log(`🎯 Auto-goal generated for: ${profile.goal}`);
  }

  console.log('✅ Intelligence Engine: Analysis complete');
  return output;
}

// ========== UTILIDADES ==========

export function resetIntelligence() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('userFinancialMemory');
    console.log('🔄 Intelligence reset complete');
    return true;
  } catch (e) {
    console.error('Error resetting intelligence:', e);
    return false;
  }
}

export function getIntelligenceStatus() {
  const profile = loadProfile();
  const memoryStats = {
    hasMemory: localStorage.getItem('userFinancialMemory') !== null,
    itemCount: 0
  };

  try {
    const memory = JSON.parse(localStorage.getItem('userFinancialMemory') || '[]');
    memoryStats.itemCount = memory.length;
  } catch (e) {
    console.error('Error reading memory:', e);
  }

  return {
    profile,
    memory: memoryStats,
    engineVersion: '2.0.0'
  };
}

// ========== FUNCIONES DE INTERACCIÓN ==========

export function recordUserInteraction(type, details = {}) {
  return recordInteraction(type, details);
}

export function recordUserPromise(promise) {
  return recordPromise(promise);
}

export function getUserPendingPromises() {
  return getPendingPromises();
}

export function getUserOverduePromises() {
  return getOverduePromises();
}

export function getUserBehaviorPatterns(profile) {
  return detectBehaviorPatterns(profile);
}

export function predictUserNextMonth(profile) {
  return predictNextMonth(profile);
}

export function getRecommendedAction(kpis, profile) {
  return recommendNextAction(kpis, profile);
}