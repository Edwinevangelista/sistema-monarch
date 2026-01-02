// src/lib/brain/brain.decisions.js
import { createDecision } from "./brainTypes";

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const pct = (x) => Math.round(x * 100);

export function generateDecisions(profile, kpis) {
  const goal = kpis.goal || profile.goal || "general";

  const {
    totalIngresos,
    totalGastos,
    saldo,
    tasaAhorro,
    totalSuscripciones,
    deudasCount,
    totalGastosFijos,
    totalGastosVariables,
  } = kpis;

  const decisions = [];

  // Señales base (sirven para cualquier meta)
  const overspend = totalIngresos > 0 && totalGastos > totalIngresos;
  const lowSavings = totalIngresos > 0 && tasaAhorro < 0.05;
  const heavySubs = totalIngresos > 0 && totalSuscripciones / totalIngresos > 0.08;

  // Confianza base según disciplina (evita "opinología" cuando disciplina es baja)
  const baseConf = clamp((profile.discipline ?? 50) / 100, 0.25, 0.85);

  // --- decisiones por meta ---
  if (goal === "controlar_gastos") {
    if (overspend || lowSavings) {
      decisions.push(
        createDecision({
          id: `d_control_1`,
          goal,
          priority: 1,
          title: "Recortar variables esta semana",
          reason: overspend
            ? "Tus gastos superan tus ingresos este mes."
            : "Tu tasa de ahorro está muy baja.",
          evidence: { saldo, tasaAhorro, totalGastosVariables, totalIngresos },
          expectedImpact: "Bajar gastos variables 10–20%.",
          confidence: clamp(baseConf + 0.05, 0, 1),
        })
      );
    }

    if (heavySubs) {
      decisions.push(
        createDecision({
          id: `d_control_2`,
          goal,
          priority: 2,
          title: "Pausar o cancelar 1–2 suscripciones",
          reason: "Tus suscripciones pesan demasiado vs tus ingresos.",
          evidence: { totalSuscripciones, totalIngresos },
          expectedImpact: "Reducir gastos fijos recurrentes.",
          confidence: clamp(baseConf + 0.05, 0, 1),
        })
      );
    }
  }

  if (goal === "recortar_subs") {
    decisions.push(
      createDecision({
        id: `d_subs_1`,
        goal,
        priority: 1,
        title: "Auditar suscripciones activas (hoy)",
        reason: "Meta elegida: bajar el gasto recurrente.",
        evidence: { totalSuscripciones, totalIngresos },
        expectedImpact: "Identificar 1–3 recortes inmediatos.",
        confidence: clamp(baseConf + 0.1, 0, 1),
      })
    );

    if (heavySubs) {
      decisions.push(
        createDecision({
          id: `d_subs_2`,
          goal,
          priority: 2,
          title: "Cancelar al menos 1 suscripción esta semana",
          reason: `Tus suscripciones son ~${pct(totalSuscripciones / Math.max(totalIngresos, 1))}% de tus ingresos.`,
          evidence: { totalSuscripciones, totalIngresos },
          expectedImpact: "Liberar efectivo mensual.",
          confidence: clamp(baseConf + 0.1, 0, 1),
        })
      );
    }
  }

  if (goal === "ahorrar_mas") {
    decisions.push(
      createDecision({
        id: `d_save_1`,
        goal,
        priority: 1,
        title: "Definir objetivo de ahorro automático",
        reason: "Meta elegida: aumentar ahorro mensual.",
        evidence: { tasaAhorro, saldo, totalIngresos, totalGastos },
        expectedImpact: "Subir tasa de ahorro gradualmente.",
        confidence: clamp(baseConf + 0.05, 0, 1),
      })
    );

    if (lowSavings || overspend) {
      decisions.push(
        createDecision({
          id: `d_save_2`,
          goal,
          priority: 2,
          title: "Crear recorte mínimo de gastos (5–10%)",
          reason: overspend
            ? "No hay ahorro posible si el gasto está por encima del ingreso."
            : "Ahorro actual bajo; necesitas liberar efectivo.",
          evidence: { tasaAhorro, saldo, totalGastos },
          expectedImpact: "Liberar cash para ahorrar.",
          confidence: clamp(baseConf + 0.05, 0, 1),
        })
      );
    }
  }

  if (goal === "pagar_deudas") {
    if (deudasCount > 0) {
      decisions.push(
        createDecision({
          id: `d_debt_1`,
          goal,
          priority: 1,
          title: "Elegir estrategia: avalancha o bola de nieve",
          reason: "Meta elegida: pagar deudas con un plan claro.",
          evidence: { deudasCount, saldo, totalIngresos, totalGastosFijos },
          expectedImpact: "Reducir intereses y acelerar salida.",
          confidence: clamp(baseConf + 0.08, 0, 1),
        })
      );

      if (saldo <= 0) {
        decisions.push(
          createDecision({
            id: `d_debt_2`,
            goal,
            priority: 2,
            title: "Liberar efectivo antes de acelerar pagos",
            reason: "Con saldo negativo, pagar extra deuda te rompe el flujo.",
            evidence: { saldo, totalGastos, totalIngresos },
            expectedImpact: "Volver a saldo positivo.",
            confidence: clamp(baseConf + 0.08, 0, 1),
          })
        );
      }
    } else {
      decisions.push(
        createDecision({
          id: `d_debt_0`,
          goal,
          priority: 1,
          title: "No hay deudas registradas: cambia meta o registra deudas",
          reason: "Elegiste pagar deudas pero no hay deudas en el sistema.",
          evidence: { deudasCount },
          expectedImpact: "Evitar planes vacíos.",
          confidence: 0.9,
        })
      );
    }
  }

  if (goal === "fondo_emergencia") {
    decisions.push(
      createDecision({
        id: `d_emg_1`,
        goal,
        priority: 1,
        title: "Definir meta de emergencia (1–3 meses primero)",
        reason: "Meta elegida: fondo de emergencia.",
        evidence: { totalGastosFijos, totalGastosVariables, totalIngresos },
        expectedImpact: "Construir colchón de seguridad.",
        confidence: clamp(baseConf + 0.08, 0, 1),
      })
    );

    if (saldo <= 0) {
      decisions.push(
        createDecision({
          id: `d_emg_2`,
          goal,
          priority: 2,
          title: "Arreglar saldo negativo antes de ahorrar emergencia",
          reason: "Si el mes cierra negativo, el fondo no se sostiene.",
          evidence: { saldo, totalGastos, totalIngresos },
          expectedImpact: "Volver a flujo positivo.",
          confidence: clamp(baseConf + 0.08, 0, 1),
        })
      );
    }
  }

  // Fallback si por alguna razón queda vacío
  if (!decisions.length) {
    decisions.push(
      createDecision({
        id: `d_base_1`,
        goal,
        priority: 1,
        title: "Mantener seguimiento semanal",
        reason: "No hay señales fuertes aún; toca observar y ajustar.",
        evidence: { saldo, tasaAhorro },
        expectedImpact: "Mejor diagnóstico el próximo mes.",
        confidence: baseConf,
      })
    );
  }

  // Orden final por prioridad
  decisions.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  return decisions;
}