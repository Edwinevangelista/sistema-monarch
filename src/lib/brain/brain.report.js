// src/lib/brain/brain.report.js

/**
 * Genera un reporte financiero completo basado en el perfil y KPIs
 * 
 * @param {Object} profile - Perfil del usuario con tone, discipline, etc.
 * @param {Object} kpis - KPIs calculados del mes
 * @returns {Object} Reporte con headline, problems, solutions, priorities
 */
export function buildFinancialReport(profile, kpis) {
  const {
    totalIngresos,
    totalGastos,
    saldo,
    tasaAhorro,
    totalSuscripciones,
    totalGastosFijos,
    
  } = kpis;

  const tone = profile?.tone || "neutral";

  // ========== SITUACIÓN ACTUAL ==========
  let status = "neutral";
  if (saldo <= 0) status = "negativo";
  else if (tasaAhorro >= 0.1) status = "positivo";

  // ========== HEADLINE (resumen ejecutivo) ==========
  let headline = "";
  if (status === "negativo") {
    headline = tone === "estricto" 
      ? "⚠️ Alerta crítica: estás gastando más de lo que ganas."
      : "Tu situación requiere atención: hay un déficit este mes.";
  } else if (status === "positivo") {
    headline = tone === "estricto"
      ? "✅ Situación estable. Ahora enfócate en optimizar y crecer."
      : "¡Bien hecho! Tu flujo de caja es positivo.";
  } else {
    headline = "Situación equilibrada, pero hay espacio para mejorar.";
  }

  // ========== TONE HINT ==========
  const toneHint = tone === "estricto"
    ? "Análisis directo y sin rodeos."
    : tone === "motivador"
    ? "Enfoque constructivo y orientado a soluciones."
    : "Análisis objetivo.";

  // ========== PROBLEMAS DETECTADOS ==========
  const problems = [];
  let problemId = 1;

  if (saldo < 0) {
    problems.push({
      id: `p${problemId++}`,
      severity: 5,
      title: "Déficit mensual",
      detail: `Estás gastando ${money(Math.abs(saldo))} más de lo que ingresas. Esto puede llevar a endeudamiento si se sostiene.`,
      evidence: { saldo, totalIngresos, totalGastos },
    });
  }

  if (tasaAhorro < 0.05 && saldo >= 0) {
    problems.push({
      id: `p${problemId++}`,
      severity: 3,
      title: "Tasa de ahorro muy baja",
      detail: `Solo ahorras ${pct(tasaAhorro)} de tus ingresos. Lo recomendable es al menos 10-20%.`,
      evidence: { tasaAhorro },
    });
  }

  if (totalSuscripciones > totalIngresos * 0.08) {
    const porcentajeSubs = (totalSuscripciones / totalIngresos) * 100;
    problems.push({
      id: `p${problemId++}`,
      severity: 3,
      title: "Suscripciones elevadas",
      detail: `Las suscripciones representan ${porcentajeSubs.toFixed(1)}% de tus ingresos (${money(totalSuscripciones)}). Considera auditar cuáles realmente usas.`,
      evidence: { totalSuscripciones, totalIngresos },
    });
  }

  if (totalGastosFijos > totalIngresos * 0.6) {
    const porcentajeFijos = (totalGastosFijos / totalIngresos) * 100;
    problems.push({
      id: `p${problemId++}`,
      severity: 4,
      title: "Gastos fijos muy rígidos",
      detail: `Tus gastos fijos consumen ${porcentajeFijos.toFixed(1)}% de tus ingresos (${money(totalGastosFijos)}). Esto deja poco margen para imprevistos o ahorro.`,
      evidence: { totalGastosFijos, totalIngresos },
    });
  }

  // Si no hay problemas, mencionar que todo está bien
  if (problems.length === 0 && saldo > 0) {
    problems.push({
      id: `p${problemId++}`,
      severity: 1,
      title: "Sin problemas críticos detectados",
      detail: "Tu flujo de caja está equilibrado. El siguiente paso es optimizar y establecer metas específicas.",
      evidence: {},
    });
  }

  // ========== SOLUCIONES ==========
  const solutions = [];

  if (saldo < 0) {
    solutions.push("Reduce gastos variables entre 5-10% para eliminar el déficit.");
    solutions.push("Identifica tus 3 categorías de gasto más altas y establece límites mensuales.");
  }

  if (tasaAhorro < 0.1) {
    solutions.push("Automatiza un ahorro del 10% apenas recibas tus ingresos (págate primero).");
  }

  if (totalSuscripciones > totalIngresos * 0.08) {
    solutions.push("Audita tus suscripciones y cancela al menos una que no uses regularmente.");
  }

  if (totalGastosFijos > totalIngresos * 0.6) {
    solutions.push("Revisa si puedes negociar algún gasto fijo (telefonía, seguros, etc.).");
  }

  if (saldo > 0 && tasaAhorro >= 0.1) {
    solutions.push("Considera aumentar tu tasa de ahorro al 15-20% para metas de mediano plazo.");
    solutions.push("Si aún no tienes un fondo de emergencia, comienza con 1 mes de gastos fijos.");
  }

  // ========== PRIORIDADES ==========
  const priorities = [];

  // Ordenar problemas por severidad
  const sortedProblems = [...problems].sort((a, b) => b.severity - a.severity);

  if (sortedProblems[0]?.severity >= 4) {
    priorities.push(`🔥 Urgente: ${sortedProblems[0].title}`);
  }

  if (saldo < 0) {
    priorities.push("1. Eliminar el déficit mensual");
    priorities.push("2. Construir un colchón de al menos $500");
    priorities.push("3. Establecer límites por categoría de gasto");
  } else if (tasaAhorro < 0.1) {
    priorities.push("1. Aumentar tasa de ahorro al 10% mínimo");
    priorities.push("2. Reducir gastos variables no esenciales");
    priorities.push("3. Revisar y optimizar suscripciones");
  } else {
    priorities.push("1. Mantener la disciplina actual");
    priorities.push("2. Establecer una meta financiera específica");
    priorities.push("3. Considerar estrategias de inversión o crecimiento");
  }

  // ========== RETORNO COMPLETO ==========
  return {
    // Resumen ejecutivo
    headline,
    toneHint,
    status,

    // Análisis detallado
    situation: {
      ingresos: totalIngresos,
      gastos: totalGastos,
      saldo,
      tasaAhorro,
      status,
    },

    // Problemas con formato esperado por el componente
    problems,

    // Soluciones accionables
    solutions,

    // Prioridades ordenadas
    priorities,

    // Datos raw para referencia
    _raw: {
      kpis,
      profile: {
        tone,
        discipline: profile?.discipline || 0,
      },
    },
  };
}

// ========== HELPERS ==========
function money(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function pct(v) {
  return `${(Number(v || 0) * 100).toFixed(1)}%`;
}