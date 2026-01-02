// src/lib/brain/brain.types.js

export function createDecision({
  id,
  goal,
  priority,
  title,
  reason,
  evidence = {},
  expectedImpact = null,
  confidence = 0.5,
}) {
  return {
    id,
    goal,
    priority,
    title,
    reason,
    evidence,
    expectedImpact,
    confidence,
    createdAt: new Date().toISOString(),
  };
}

export function createPlan({
  id,
  monthKey,
  decisions = [],
  actions = [],
  status = "active",
}) {
  return {
    id,
    monthKey,
    decisions,
    actions,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createAction({
  id,
  decisionId,
  type,
  payload = {},
  dueDate = null,
  frequency = "once",
}) {
  return {
    id,
    decisionId,
    type,
    payload,
    dueDate,
    frequency,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
    result: null,
  };
}
