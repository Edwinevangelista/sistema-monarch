// src/lib/brain/brain.plans.js
import { createPlan, createAction } from "./brainTypes";

const nowISO = () => new Date().toISOString();

export function buildPlanFromDecisions(decisions = [], monthKey, goal) {
  if (!decisions?.length) return null;

  const plan = createPlan({
    id: `tmp_${monthKey}_${goal}`, // el engine lo pisa con planId final
    monthKey,
    decisions,
    actions: [],
    status: "active",
  });

  const actions = [];

  for (const d of decisions) {
    if (!d?.id) continue;

    if (goal === "controlar_gastos") {
      actions.push(
        createAction({
          id: `a_${d.id}_1`,
          decisionId: d.id,
          type: "track_spending_week",
          payload: { note: "Revisar gastos variables y top 5 categorías." },
          dueDate: null,
          frequency: "weekly",
        })
      );
    }

    if (goal === "recortar_subs") {
      actions.push(
        createAction({
          id: `a_${d.id}_1`,
          decisionId: d.id,
          type: "audit_subscriptions",
          payload: { note: "Listar suscripciones activas y uso real." },
          dueDate: null,
          frequency: "once",
        })
      );
      actions.push(
        createAction({
          id: `a_${d.id}_2`,
          decisionId: d.id,
          type: "cancel_one_subscription",
          payload: { note: "Cancelar/pausar 1 suscripción esta semana." },
          dueDate: null,
          frequency: "once",
        })
      );
    }

    if (goal === "ahorrar_mas") {
      actions.push(
        createAction({
          id: `a_${d.id}_1`,
          decisionId: d.id,
          type: "set_auto_save",
          payload: { note: "Definir monto fijo semanal/mensual a ahorrar." },
          dueDate: null,
          frequency: "once",
        })
      );
      actions.push(
        createAction({
          id: `a_${d.id}_2`,
          decisionId: d.id,
          type: "reduce_variable_spend",
          payload: { note: "Bajar variables 5–10% este mes." },
          dueDate: null,
          frequency: "once",
        })
      );
    }

    if (goal === "pagar_deudas") {
      actions.push(
        createAction({
          id: `a_${d.id}_1`,
          decisionId: d.id,
          type: "pick_debt_strategy",
          payload: { note: "Elegir avalancha (interés) o nieve (balance)." },
          dueDate: null,
          frequency: "once",
        })
      );
      actions.push(
        createAction({
          id: `a_${d.id}_2`,
          decisionId: d.id,
          type: "make_extra_payment",
          payload: { note: "Hacer 1 pago extra dirigido a la deuda prioritaria." },
          dueDate: null,
          frequency: "monthly",
        })
      );
    }

    if (goal === "fondo_emergencia") {
      actions.push(
        createAction({
          id: `a_${d.id}_1`,
          decisionId: d.id,
          type: "define_emergency_target",
          payload: { note: "Meta: 1 mes de gastos fijos primero." },
          dueDate: null,
          frequency: "once",
        })
      );
      actions.push(
        createAction({
          id: `a_${d.id}_2`,
          decisionId: d.id,
          type: "save_emergency_weekly",
          payload: { note: "Aportar algo cada semana (aunque sea pequeño)." },
          dueDate: null,
          frequency: "weekly",
        })
      );
    }
  }

  const seen = new Set();
  plan.actions = actions.filter((a) => {
    if (!a?.id) return false;
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  plan.updatedAt = nowISO();
  return plan;
}
