// src/lib/brain/brain.diagnostico.js
// 🧠 Módulo de Diagnóstico Financiero
// Wrapper que conecta brain.report.js con el intelligenceEngine

import { buildFinancialReport } from './brain.report';

/**
 * Genera un diagnóstico financiero completo
 * Esta es la función principal que usa intelligenceEngine.js
 * 
 * @param {Object} kpis - KPIs calculados del mes actual
 * @param {Object} profile - Perfil del usuario con tone, discipline, histórico
 * @returns {Object} Reporte de diagnóstico formateado
 */
export function generateDiagnosticReport(kpis, profile) {
  // Usar la función existente de brain.report.js
  const report = buildFinancialReport(profile, kpis);
  
  // El reporte ya viene con el formato correcto:
  // - headline: resumen ejecutivo
  // - problems: array de problemas detectados
  // - solutions: array de soluciones accionables
  // - priorities: array de prioridades
  
  return report;
}

/**
 * Genera un reporte simplificado para uso rápido
 */
export function generateQuickReport(kpis) {
  const { saldo, tasaAhorro, totalGastos, totalIngresos } = kpis;
  
  let status = 'neutral';
  let message = '';
  
  if (saldo < -100) {
    status = 'critical';
    message = `Déficit crítico de ${money(Math.abs(saldo))}`;
  } else if (saldo < 0) {
    status = 'warning';
    message = `Déficit de ${money(Math.abs(saldo))}`;
  } else if (tasaAhorro >= 0.15) {
    status = 'excellent';
    message = `¡Excelente! Ahorrando ${pct(tasaAhorro)}`;
  } else if (tasaAhorro >= 0.10) {
    status = 'good';
    message = `Bien, ahorrando ${pct(tasaAhorro)}`;
  } else {
    status = 'needs_work';
    message = `Tasa de ahorro baja: ${pct(tasaAhorro)}`;
  }
  
  return {
    status,
    message,
    headline: message,
    kpis: {
      ingresos: totalIngresos,
      gastos: totalGastos,
      saldo,
      tasaAhorro
    }
  };
}

// ========== HELPERS ==========
function money(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(v) {
  return `${(Number(v || 0) * 100).toFixed(0)}%`;
}