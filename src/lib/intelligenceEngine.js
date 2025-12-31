// src/lib/intelligenceEngine.js
// 🧠 Motor local inteligente con memoria por usuario
// ✅ Mantiene compatibilidad con UI actual
// ✅ Expone DECISIONES reales (nuevo)
// ✅ Listo para siguiente fase: Plan + Actions

import { generateDecisions } from "./brain/brain.decisions";

const VERSION = 1;

// ---------- helpers ----------
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const safeJSON = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

const nowISO = () => new Date().toISOString();

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const money = (v) =>
  `$${n(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const pct = (v) => `${(n(v) * 100).toFixed(0)}%`;

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

    goal: "control",
    tone: "neutral",

    discipline: 50,
    streaks: {
      positiveMonths: 0,
      negativeMonths: 0,
      improvedMonths: 0,
    },

    monthly: {},

    patterns: {
      topCategories: {},
      overspendCategories: {},
      subscriptionsCount: { count: 0, lastAt: null },
      debtSeen: { count: 0, lastAt: null },
    },

    recommendations: {},

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
  if (!p.version || p.version !== VERSION) {
    const fresh = { ...defaultProfile(userId), ...p, version: VERSION, userId };
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }
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
  const totalSubs = (suscripciones || [])
    .filter((s) => s.estado === "Activo")
    .reduce((s, x) => s + n(x.monto || x.costo), 0);

  const totalGastos = totalGF + totalGV + totalSubs;
  const saldo = totalIngresos - totalGastos;
  const tasaAhorro = totalIngresos > 0 ? saldo / totalIngresos : 0;

  const catMap = {};
  const pushCat = (cat, amount) => {
    const k = cat || "📦 Otros";
    catMap[k] = (catMap[k] || 0) + n(amount);
  };

  gastosFijos.forEach((g) => pushCat(g.categoria, g.monto));
  gastosVariables.forEach((g) => pushCat(g.categoria, g.monto));
  (suscripciones || [])
    .filter((s) => s.estado === "Activo")
    .forEach((s) =>
      pushCat(s.categoria || "🔁 Suscripciones", s.monto || s.costo)
    );

  const topCats = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    totalIngresos,
    totalGastos,
    saldo,
    tasaAhorro,
    totalGastosFijos: totalGF,
    totalGastosVariables: totalGV,
    totalSuscripciones: totalSubs,
    topCats,
    deudasCount: deudas.length,
    subsCount: suscripciones.filter((s) => s.estado === "Activo").length,
  };
}

// ---------- aprendizaje ----------
function updateMonthly(profile, kpis) {
  const mk = monthKey();
  profile.monthly[mk] = {
    ingresos: kpis.totalIngresos,
    gastos: kpis.totalGastos,
    saldo: kpis.saldo,
    tasaAhorro: kpis.tasaAhorro,
    topCats: kpis.topCats,
    updatedAt: nowISO(),
  };
  profile.lastSignals.lastMonthKey = mk;
}

function detectImprovement(profile, kpis) {
  const { lastSaldo, lastTasaAhorro } = profile.lastSignals;
  let improved = false;

  if (lastSaldo !== null && kpis.saldo > lastSaldo) improved = true;
  if (lastTasaAhorro !== null && kpis.tasaAhorro > lastTasaAhorro)
    improved = true;

  if (kpis.saldo >= 0) {
    profile.streaks.positiveMonths += 1;
    profile.streaks.negativeMonths = 0;
  } else {
    profile.streaks.negativeMonths += 1;
    profile.streaks.positiveMonths = 0;
  }

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

// ---------- motor principal ----------
export function runIntelligence(input) {
  const profile = loadProfile();
  const kpis = computeKpis(input);

  updateMonthly(profile, kpis);
  detectImprovement(profile, kpis);

  // 🔥 NUEVO: decisiones reales
  const decisions = generateDecisions(profile, kpis);

  const output = {
    profile: saveProfile(profile),
    kpis,
    decisions, // 👈 esto es el nuevo cerebro real
    updatedAt: nowISO(),
  };

  return output;
}

export function setGoal(goalKey) {
  const profile = loadProfile();
  profile.goal = goalKey;
  return saveProfile(profile);
}
