const nowISO = () => new Date().toISOString();

/**
 * Marca una acción como ejecutada y guarda impacto real
 */
export function completeAction(profile, planId, actionId, result) {
  const plan = Object.values(profile.plans).find((p) => p.id === planId);
  if (!plan) return profile;

  const action = plan.actions.find((a) => a.id === actionId);
  if (!action) return profile;

  action.status = "done";
  action.completedAt = nowISO();
  action.result = result;

  plan.updatedAt = nowISO();
  return profile;
}

/**
 * Marca una acción como fallida
 */
export function failAction(profile, planId, actionId, reason) {
  const plan = Object.values(profile.plans).find((p) => p.id === planId);
  if (!plan) return profile;

  const action = plan.actions.find((a) => a.id === actionId);
  if (!action) return profile;

  action.status = "failed";
  action.completedAt = nowISO();
  action.result = { reason };

  plan.updatedAt = nowISO();
  return profile;
}

/**
 * Salta una acción conscientemente
 */
export function skipAction(profile, planId, actionId, reason) {
  const plan = Object.values(profile.plans).find((p) => p.id === planId);
  if (!plan) return profile;

  const action = plan.actions.find((a) => a.id === actionId);
  if (!action) return profile;

  action.status = "skipped";
  action.completedAt = nowISO();
  action.result = { reason };

  plan.updatedAt = nowISO();
  return profile;
}
