// src/lib/intelligenceEngine.js
// 🧠 Motor local inteligente V2 - AUTO-INTELIGENTE
// ✅ Metas calculadas automáticamente
// ✅ Progreso detectado por datos reales
// ✅ Sin checkboxes manuales
// ✅ Insights accionables

import { generateAutoGoal } from "./brain/brain.autogoals";
import { buildFinancialReport } from "./brain/brain.report";

const VERSION = 2; // Incrementamos versión

// ---------- helpers ----------
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const safeJSON = (s, fallback) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

const nowISO = () => new Date().toISOString();

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- user / profile ----------
function getUserId() {
  const u = safeJSON(localStorage.getItem("supabase_user"), null);
  return u?.id || "guest";
}

function profileKey(userId) {
  return `monarch_profile_v${VERSION}_${userId}`;
}

function defaultProfile(userId) {
  return {
    version: VERSION,
    userId,
    createdAt: nowISO(),
    updatedAt: nowISO(),

    // preferencias
    goal: "general",
    tone: "neutral",

    // disciplina
    discipline: 50,
    streaks: {
      positiveMonths: 0,
      negativeMonths: 0,
    },

    // histórico mensual
    monthly: {},

    // datos persistidos para metas
    emergencyFund: 0, // Fondo de emergencia actual
    debtPayments: {}, // Pagos realizados a deudas

    // señales
    lastSignals: {
      lastMonthKey: null,
      lastSaldo: null,
      lastTasaAhorro: null,
    },
  };
}

export function loadProfile() {
  const userId = getUserId();
  const key = profileKey(userId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    const p = defaultProfile(userId);
    localStorage.setItem(key, JSON.stringify(p));
    return p;
  }

  const p = safeJSON(stored, defaultProfile(userId));

  // Migración de versión antigua
  if (!p.version || p.version < VERSION) {
    const fresh = { ...defaultProfile(userId), ...p, version: VERSION };
    // Asegurar que existan los nuevos campos
    if (!fresh.emergencyFund) fresh.emergencyFund = 0;
    if (!fresh.debtPayments) fresh.debtPayments = {};
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }

  if (!p.goal) p.goal = "general";
  return p;
}

export function saveProfile(profile) {
  const userId = getUserId();
  const key = profileKey(userId);
  const p = { ...profile, updatedAt: nowISO(), userId };
  localStorage.setItem(key, JSON.stringify(p));
  return p;
}

// ---------- KPIs ----------
export function computeKpis({
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
}) {
  const totalIngresos = ingresos.reduce((s, i) => s + n(i.monto), 0);
  const totalGF = gastosFijos.reduce((s, g) => s + n(g.monto), 0);
  const totalGV = gastosVariables.reduce((s, g) => s + n(g.monto), 0);
  const totalSubs = suscripciones
    .filter((s) => s.estado === "Activo")
    .reduce((s, x) => s + n(x.monto || x.costo), 0);

  const totalGastos = totalGF + totalGV + totalSubs;
  const saldo = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? saldo / totalIngresos : 0;

  return {
    totalIngresos,
    totalGastos,
    saldo,
    tasaAhorro,
    totalGastosFijos: totalGF,
    totalGastosVariables: totalGV,
    totalSuscripciones: totalSubs,
    deudasCount: deudas.length,
  };
}

// ---------- aprendizaje mensual ----------
function updateMonthly(profile, kpis) {
  const mk = monthKey();
  profile.monthly[mk] = {
    ingresos: kpis.totalIngresos,
    gastos: kpis.totalGastos,
    saldo: kpis.saldo,
    tasaAhorro: kpis.tasaAhorro,
    suscripciones: kpis.totalSuscripciones,
    updatedAt: nowISO(),
  };

  profile.lastSignals.lastMonthKey = mk;
}

function detectImprovement(profile, kpis) {
  const { lastSaldo, lastTasaAhorro } = profile.lastSignals;

  let improved = false;
  if (lastSaldo !== null && kpis.saldo > lastSaldo) improved = true;
  if (lastTasaAhorro !== null && kpis.tasaAhorro > lastTasaAhorro) improved = true;

  profile.discipline = clamp(
    profile.discipline + (improved ? 4 : -2),
    0,
    100
  );

  profile.lastSignals.lastSaldo = kpis.saldo;
  profile.lastSignals.lastTasaAhorro = kpis.tasaAhorro;

  if (profile.discipline >= 75) profile.tone = "suave";
  else if (profile.discipline >= 50) profile.tone = "neutral";
  else if (profile.discipline >= 30) profile.tone = "directo";
  else profile.tone = "estricto";
}

// ---------- MOTOR PRINCIPAL V2 (AUTO-INTELIGENTE) ----------
export function runIntelligence(input) {
  const profile = loadProfile();
  const kpis = computeKpis(input);

  updateMonthly(profile, kpis);
  detectImprovement(profile, kpis);

  // 📊 REPORTE GENERAL (SIEMPRE)
  const report = buildFinancialReport(profile, kpis);

  const goal = profile.goal || "general";
  let autoGoal = null;

  // 🎯 META AUTO-INTELIGENTE (si no es general)
  if (goal !== "general") {
    autoGoal = generateAutoGoal(goal, kpis, profile);
  }

  const output = {
    profile: saveProfile(profile),
    kpis,
    report,      // ✅ diagnóstico siempre
    autoGoal,    // ✅ meta calculada automáticamente (null si es general)
    updatedAt: nowISO(),
  };

  return output;
}

// ---------- API pública para actualizar datos persistidos ----------
export function updateEmergencyFund(amount) {
  const profile = loadProfile();
  profile.emergencyFund = Math.max(0, n(amount));
  return saveProfile(profile);
}

export function recordDebtPayment(debtId, amount) {
  const profile = loadProfile();
  if (!profile.debtPayments) profile.debtPayments = {};
  
  if (!profile.debtPayments[debtId]) {
    profile.debtPayments[debtId] = [];
  }
  
  profile.debtPayments[debtId].push({
    amount: n(amount),
    date: nowISO(),
  });
  
  return saveProfile(profile);
}

export function setGoal(goalKey) {
  const profile = loadProfile();
  profile.goal = goalKey;
  return saveProfile(profile);
}