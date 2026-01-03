// src/lib/intelligenceEngine.js
// VERSIÓN CORREGIDA - Sin variables sin usar

import { calculateKPIs } from './brain/brain.kpis.js';
import { analyzeProfile } from './brain/brain.adaptive.js';
import { generateReport } from './brain/brain.report.js';
import { generateAutoGoal } from './brain/brain.autogoals.js';
import { loadProfile as loadStoredProfile, saveProfile } from './brain/brain.memory.js';
import { getRelevantContext, generateMemorySummary } from './brain/brain.memory.js';

// ========== CONFIGURACIÓN ==========

const PROFILE_STORAGE_KEY = 'userFinancialProfile';

// ========== GESTIÓN DE PERFIL ==========

export function loadProfile() {
  try {
    const stored = loadStoredProfile();
    if (stored) return stored;

    // Perfil por defecto
    return {
      goal: 'general',
      tone: 'amigable',
      discipline: 50,
      riskTolerance: 'moderate',
      preferences: {
        notifications: true,
        autoAnalysis: true
      }
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
      }
    };
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

// ========== MOTOR PRINCIPAL ==========

export function runIntelligence(data) {
  console.log('🧠 Intelligence Engine: Starting analysis...');
  
  // CORRECCIÓN: Removido destructuring de variables no usadas (línea 74)
  // Las variables se usan a través del objeto 'data' completo
  
  // 1. CALCULAR KPIs
  const kpis = calculateKPIs(data);
  console.log('📊 KPIs calculated:', kpis);
  
  // 2. CARGAR PERFIL Y MEMORIA
  let profile = loadProfile();
  const memoryContext = getRelevantContext(profile.goal, kpis);
  const memorySummary = generateMemorySummary();
  console.log('🧠 Memory loaded:', memorySummary);
  
  // 3. ANALIZAR PERFIL (Adaptar tono y disciplina)
  profile = analyzeProfile(kpis, profile);
  console.log('👤 Profile analyzed:', profile);
  
  // 4. GENERAR CONTENIDO SEGÚN META
  let output = {
    kpis,
    profile,
    memoryContext,
    memorySummary
  };

  if (profile.goal === 'general') {
    // MODO REPORTE GENERAL
    output.report = generateReport(kpis, profile, data, memoryContext);
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