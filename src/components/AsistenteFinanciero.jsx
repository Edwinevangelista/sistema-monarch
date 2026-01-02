import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Loader, Target, Wallet, PiggyBank, CreditCard, Scissors, FileText } from "lucide-react";

import { runIntelligence, setGoal, loadProfile } from "../lib/intelligenceEngine";
import AutoGoalDisplay from "./AutoGoalDisplay";

const GOALS = [
  { key: "general", label: "📊 Reporte general", icon: <FileText className="w-4 h-4" /> },
  { key: "controlar_gastos", label: "Controlar gastos", icon: <Wallet className="w-4 h-4" /> },
  { key: "ahorrar_mas", label: "Ahorrar más", icon: <PiggyBank className="w-4 h-4" /> },
  { key: "pagar_deudas", label: "Pagar deudas", icon: <CreditCard className="w-4 h-4" /> },
  { key: "fondo_emergencia", label: "Fondo emergencia", icon: <Target className="w-4 h-4" /> },
  { key: "recortar_subs", label: "Recortar subs", icon: <Scissors className="w-4 h-4" /> },
];

const money = (v) => `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const pct = (v) => `${(Number(v || 0) * 100).toFixed(0)}%`;

export default function AsistenteFinanciero({
  ingresos = [],
  gastosFijos = [],
  gastosVariables = [],
  suscripciones = [],
  deudas = [],
}) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  const profile = useMemo(() => loadProfile(), []);
  const [goal, setGoalState] = useState(profile.goal || "general");

  const hasData =
    ingresos.length ||
    gastosFijos.length ||
    gastosVariables.length ||
    suscripciones.length ||
    deudas.length;

  const analizar = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const result = runIntelligence({
        ingresos,
        gastosFijos,
        gastosVariables,
        suscripciones,
        deudas,
      });
      setOutput(result);
      setLoading(false);
    }, 250);
  }, [ingresos, gastosFijos, gastosVariables, suscripciones, deudas]);

  useEffect(() => {
    if (hasData) analizar();
  }, [hasData, analizar]);

  const onChangeGoal = (g) => {
    setGoalState(g);
    setGoal(g);
    analizar();
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-300" />
          <div>
            <h2 className="text-2xl font-bold text-white">🤖 Asistente Financiero</h2>
            <p className="text-purple-200 text-sm">Reporte + Plan de acciones (local)</p>
          </div>
        </div>

        <button
          onClick={analizar}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? "Analizando..." : "Actualizar"}
        </button>
      </div>

      {/* Meta selector */}
      <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-5 border border-white/10">
        <div className="flex items-center gap-2 mb-2 text-white font-semibold">
          <Target className="w-5 h-5" />
          Modo / Meta
        </div>

        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const active = goal === g.key;
            return (
              <button
                key={g.key}
                onClick={() => onChangeGoal(g.key)}
                className={[
                  "px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border transition",
                  active
                    ? "bg-purple-600 text-white border-purple-300/40"
                    : "bg-white/10 text-purple-100 border-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                {g.icon}
                {g.label}
              </button>
            );
          })}
        </div>

        <p className="text-purple-200 text-xs mt-3">
          Reporte general = diagnóstico. Metas = plan de acciones.
        </p>
      </div>

      {/* Empty */}
      {!hasData && !loading && (
        <div className="text-center py-10 text-purple-200">
          Agrega ingresos, gastos o deudas para iniciar el análisis.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <Loader className="w-10 h-10 animate-spin text-purple-300 mx-auto mb-3" />
          <p className="text-purple-200">Pensando decisiones reales...</p>
        </div>
      )}

      {/* Output */}
      {output && !loading && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-purple-200 text-xs">Ingresos</div>
              <div className="text-white text-lg font-bold">{money(output.kpis.totalIngresos)}</div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-purple-200 text-xs">Gastos</div>
              <div className="text-white text-lg font-bold">{money(output.kpis.totalGastos)}</div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-purple-200 text-xs">Saldo</div>
              <div className="text-white text-lg font-bold">{money(output.kpis.saldo)}</div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-purple-200 text-xs">Ahorro</div>
              <div className="text-white text-lg font-bold">{pct(output.kpis.tasaAhorro)}</div>
            </div>
          </div>

          {/* ✅ REPORTE GENERAL */}
          {output.report && !output.plan && (
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="text-white font-semibold mb-2">📊 Diagnóstico financiero</div>
              <div className="text-purple-100 text-sm mb-2">{output.report.headline}</div>
              <div className="text-purple-200 text-xs mb-3">{output.report.toneHint}</div>

              {output.report.problems?.length > 0 && (
                <div className="mt-3">
                  <div className="text-white font-semibold text-sm mb-2">Problemas detectados</div>
                  <div className="space-y-2">
                    {output.report.problems.map((p) => (
                      <div key={p.id} className="bg-white/10 rounded-lg p-3 border border-white/10">
                        <div className="text-white font-semibold text-sm">{p.title}</div>
                        <div className="text-purple-100 text-sm">{p.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.report.solutions?.length > 0 && (
                <div className="mt-4">
                  <div className="text-white font-semibold text-sm mb-2">Cómo solucionarlo</div>
                  {output.report.solutions.map((s, i) => (
                    <div key={i} className="text-purple-100 text-sm">• {s}</div>
                  ))}
                </div>
              )}

              {output.report.priorities?.length > 0 && (
                <div className="mt-4">
                  <div className="text-white font-semibold text-sm mb-2">Prioridades</div>
                  {output.report.priorities.map((x, i) => (
                    <div key={i} className="text-purple-100 text-sm">• {x}</div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* 🎯 META AUTO-INTELIGENTE */}
{output.autoGoal && (
  <AutoGoalDisplay autoGoal={output.autoGoal} />
)}

          {/* Meta info */}
          <div className="text-purple-200 text-xs flex items-center justify-between">
            <span>
              Disciplina: <b>{output.profile.discipline}</b> / 100 — Tono: <b>{output.profile.tone}</b>
            </span>
            <span>Actualizado: {new Date(output.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
