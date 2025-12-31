import { createDecision } from "./brain.types";

export function generateDecisions(profile, kpis) {
  const decisions = [];

  // 1️⃣ Déficit
  if (kpis.saldo < 0) {
    decisions.push(
      createDecision({
        id: "stop_deficit_now",
        goal: "control",
        priority: "urgente",
        title: "Detener déficit inmediato",
        reason: "Saldo mensual negativo",
        evidence: {
          saldo: kpis.saldo,
          gastos: kpis.totalGastos,
          ingresos: kpis.totalIngresos,
        },
        expectedImpact: Math.abs(kpis.saldo),
        confidence: 0.9,
      })
    );
  }

  // 2️⃣ Ahorro bajo
  if (kpis.totalIngresos > 0 && kpis.tasaAhorro < 0.1) {
    decisions.push(
      createDecision({
        id: "increase_savings_10pct",
        goal: "ahorro",
        priority: "alta",
        title: "Subir ahorro al 10%",
        reason: "Tasa de ahorro inferior al mínimo recomendado",
        evidence: {
          tasaAhorro: kpis.tasaAhorro,
        },
        expectedImpact: kpis.totalIngresos * 0.1,
        confidence: 0.7,
      })
    );
  }

  // 3️⃣ Suscripciones altas
  if (
    kpis.totalIngresos > 0 &&
    kpis.totalSuscripciones / kpis.totalIngresos > 0.12
  ) {
    decisions.push(
      createDecision({
        id: "cut_subscriptions",
        goal: "suscripciones",
        priority: "media",
        title: "Recortar suscripciones",
        reason: "Costo alto en gastos invisibles",
        evidence: {
          totalSuscripciones: kpis.totalSuscripciones,
        },
        expectedImpact: kpis.totalSuscripciones * 0.3,
        confidence: 0.6,
      })
    );
  }

  // 4️⃣ Deudas
  if (kpis.deudasCount > 0) {
    decisions.push(
      createDecision({
        id: "activate_debt_plan",
        goal: "deuda",
        priority: "alta",
        title: "Activar plan anti-intereses",
        reason: "Deudas activas detectadas",
        evidence: {
          deudas: kpis.deudasCount,
        },
        expectedImpact: null, // depende del plan
        confidence: 0.8,
      })
    );
  }

  return decisions;
}
