import { createPlan, createAction } from "./brain.types";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function buildPlanFromDecisions(decisions, monthKey) {
  const actions = [];

  decisions.forEach((d) => {
    switch (d.id) {
      case "stop_deficit_now":
        actions.push(
          createAction({
            id: "pause_non_essential_7d",
            decisionId: d.id,
            type: "SPENDING_FREEZE",
            payload: { days: 7 },
            dueDate: todayISO(),
          })
        );
        break;

      case "increase_savings_10pct":
        actions.push(
          createAction({
            id: "auto_save_10pct",
            decisionId: d.id,
            type: "AUTOMATE_SAVINGS",
            payload: { rate: 0.1 },
            dueDate: todayISO(),
            frequency: "monthly",
          })
        );
        break;

      case "cut_subscriptions":
        actions.push(
          createAction({
            id: "cancel_one_subscription",
            decisionId: d.id,
            type: "CANCEL_SUBSCRIPTION",
            payload: { target: "lowest_usage" },
            dueDate: todayISO(),
          })
        );
        break;

      case "activate_debt_plan":
        actions.push(
          createAction({
            id: "set_extra_debt_payment",
            decisionId: d.id,
            type: "EXTRA_DEBT_PAYMENT",
            payload: { strategy: "avalanche" },
            dueDate: todayISO(),
            frequency: "monthly",
          })
        );
        break;

      default:
        break;
    }
  });

  return createPlan({
    id: `plan_${monthKey}`,
    monthKey,
    decisions: decisions.map((d) => d.id),
    actions,
  });
}
