// src/lib/intelligenceEngine.js
// 🧠 Motor de Inteligencia Principal - Integra todos los módulos del cerebro

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

const PROFILE_KEY = 'monarch_profile';

// ========== PERFIL DEL USUARIO ==========

export function loadProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return initializeProfile();
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading profile:', error);
    return initializeProfile();
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

function initializeProfile() {
  return {
    goal: 'general',
    tone: 'amigable',
    intensity: 5,
    style: 'balanced',
    discipline: 50,
    monthly: {},
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

export function setGoal(goal) {
  const profile = loadProfile();
  profile.goal = goal;
  profile.lastUpdated = new Date().toISOString();
  saveProfile(profile);
}

// ========== MOTOR PRINCIPAL ==========

export function runIntelligence(data) {
  console.log('🧠 Intelligence Engine: Starting analysis...');
  
  const { ingresos, gastosFijos, gastosVariables, suscripciones, deudas } = data;
  
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
  profile.discipline = memorySummary.discipline === 'high' ? 80 : 
                       memorySummary.discipline === 'medium' ? 50 : 30;
  
  // 9. GENERAR REPORTE DIAGNÓSTICO
  const report = generateDiagnosticReport(kpis, profile);
  console.log('📋 Diagnostic report generated');
  
  // 10. GENERAR META AUTOMÁTICA
  const autoGoal = generateAutoGoal(profile.goal, kpis, profile);
  console.log('🎯 Auto-goal generated:', autoGoal?.type);
  
  // 11. GENERAR RECOMENDACIÓN PRIORIZADA
  const nextAction = recommendNextAction(patternsAnalysis.patterns);
  
  // 12. CONSTRUIR OUTPUT COMPLETO
  const output = {
    kpis,
    profile,
    report: enhanceReportWithPersonality(report, personality, memoryContext),
    autoGoal,
    patterns: patternsAnalysis,
    prediction,
    personality,
    memory: {
      summary: memorySummary,
      pendingPromises: getPendingPromises().length,
      overduePromises: getOverduePromises().length,
      context: memoryContext
    },
    nextAction,
    timestamp: new Date().toISOString()
  };
  
  // 13. GUARDAR PERFIL ACTUALIZADO
  saveProfile(profile);
  
  // 14. REGISTRAR INTERACCIÓN EN MEMORIA
  recordInteraction(
    'report',
    'Solicitar análisis financiero',
    `Generado reporte: ${report.headline}`,
    {
      goal: profile.goal,
      saldo: kpis.saldo,
      tone: personality.tone
    }
  );
  
  console.log('✅ Intelligence Engine: Analysis complete');
  return output;
}

// ========== CÁLCULO DE KPIs ==========

function calculateKPIs(data) {
  const { ingresos, gastosFijos, gastosVariables, suscripciones, deudas } = data;

  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto || 0), 0);
  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + (g.monto || 0), 0);
  const totalGastosVariables = gastosVariables.reduce((sum, g) => sum + (g.monto || 0), 0);
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      if (s.ciclo === 'Anual') return sum + (s.costo / 12);
      if (s.ciclo === 'Semanal') return sum + (s.costo * 4.33);
      return sum + (s.costo || 0);
    }, 0);

  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones;
  const saldo = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? saldo / totalIngresos : 0;

  const totalDeudas = deudas.reduce((sum, d) => sum + (d.balance || 0), 0);
  const deudasCount = deudas.length;

  return {
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    totalGastos: Math.round(totalGastos * 100) / 100,
    totalGastosFijos: Math.round(totalGastosFijos * 100) / 100,
    totalGastosVariables: Math.round(totalGastosVariables * 100) / 100,
    totalSuscripciones: Math.round(totalSuscripciones * 100) / 100,
    saldo: Math.round(saldo * 100) / 100,
    tasaAhorro: Math.round(tasaAhorro * 10000) / 10000,
    totalDeudas: Math.round(totalDeudas * 100) / 100,
    deudasCount,
    gastosFijosRatio: totalIngresos > 0 ? totalGastosFijos / totalIngresos : 0,
    gastosVariablesRatio: totalIngresos > 0 ? totalGastosVariables / totalIngresos : 0
  };
}

// ========== HISTÓRICO MENSUAL ==========

function updateMonthlyHistory(profile, kpis) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  if (!profile.monthly) {
    profile.monthly = {};
  }

  profile.monthly[currentMonth] = {
    ingresos: kpis.totalIngresos,
    gastos: kpis.totalGastos,
    gastosFijos: kpis.totalGastosFijos,
    gastosVariables: kpis.totalGastosVariables,
    suscripciones: kpis.totalSuscripciones,
    saldo: kpis.saldo,
    tasaAhorro: kpis.tasaAhorro,
    totalDeudas: kpis.totalDeudas,
    timestamp: new Date().toISOString()
  };

  const months = Object.keys(profile.monthly).sort().reverse();
  if (months.length > 12) {
    months.slice(12).forEach(month => delete profile.monthly[month]);
  }

  return profile;
}

// ========== MEJORAR REPORTE CON PERSONALIDAD ==========

function enhanceReportWithPersonality(report, personality, memoryContext) {
  report.greeting = personality.messages.greeting;
  report.situationMessage = personality.messages.situation;
  report.motivation = personality.messages.motivation;
  report.callToAction = personality.messages.callToAction;
  
  if (memoryContext.pendingPromises.length > 0) {
    report.pendingPromises = memoryContext.pendingPromises.map(p => ({
      promise: p.promise,
      dueDate: p.dueDate,
      overdue: new Date(p.dueDate) < new Date()
    }));
  }
  
  if (memoryContext.overduePromises.length > 0) {
    report.overduePromises = memoryContext.overduePromises.map(p => ({
      promise: p.promise,
      dueDate: p.dueDate
    }));
  }
  
  if (memoryContext.insights.length > 0) {
    report.newInsights = memoryContext.insights.slice(0, 3);
  }
  
  return report;
}

// ========== UTILIDADES PÚBLICAS ==========

export function userMakesPromise(promiseText, dueDate) {
  const promise = recordPromise(promiseText, dueDate);
  console.log('📝 Promise recorded:', promise);
  return promise;
}

export function getExecutiveSummary() {
  const profile = loadProfile();
  const memorySummary = generateMemorySummary();
  
  return {
    currentGoal: profile.goal,
    tone: profile.tone,
    discipline: profile.discipline,
    totalInteractions: memorySummary.totalInteractions,
    pendingPromises: memorySummary.pendingPromises,
    overduePromises: memorySummary.overduePromises,
    lastUpdated: profile.lastUpdated
  };
}

export function recalibratePersonality() {
  const profile = loadProfile();
  const kpis = { saldo: 0, tasaAhorro: 0 };
  const patterns = [];
  
  const personality = adaptPersonality(profile, kpis, patterns);
  const updated = updateProfilePersonality(profile, personality);
  saveProfile(updated);
  
  console.log('🔄 Personality recalibrated:', personality);
  return personality;
}

export function getBrainState() {
  return {
    profile: loadProfile(),
    memory: generateMemorySummary(),
    timestamp: new Date().toISOString()
  };
}