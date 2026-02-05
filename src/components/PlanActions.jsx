import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

import {
  markActionDone,
  markActionFailed,
  markActionSkipped,
} from "../lib/intelligenceEngine";

const ACTION_LABELS = {
  SPENDING_FREEZE: "Pausar gastos no esenciales",
  AUTOMATE_SAVINGS: "Automatizar ahorro",
  CANCEL_SUBSCRIPTION: "Cancelar una suscripción",
  EXTRA_DEBT_PAYMENT: "Pago extra a deuda",
};

export default function PlanActions({ plan, onUpdated }) {
  const [impact, setImpact] = useState({});

  if (!plan || !plan.actions?.length) return null;

  const handleDone = (action) => {
    const value = Number(impact[action.id] || 0);
    markActionDone(plan.id, action.id, value);
    onUpdated?.();
  };

  const handleFailed = (action) => {
    markActionFailed(plan.id, action.id, "No se pudo ejecutar");
    onUpdated?.();
  };

  const handleSkipped = (action) => {
    markActionSkipped(plan.id, action.id, "Decisión consciente");
    onUpdated?.();
  };

  return (
    <div className="bg-white/10 rounded-xl p-5 border border-white/10">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Acciones del plan actual
      </h3>

      <div className="space-y-4">
        {plan.actions.map((a) => (
          <div
            key={a.id}
            className="bg-white/10 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-semibold">
                  {ACTION_LABELS[a.type] || a.type}
                </div>
                <div className="text-purple-200 text-xs">
                  Estado: <b>{a.status}</b>
                  {a.dueDate && ` · Vence: ${a.dueDate}`}
                </div>
              </div>

              {a.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    placeholder="Impacto $"
                    className="w-28 px-2 py-1 rounded bg-black/30 text-white text-sm"
                    onChange={(e) =>
                      setImpact({ ...impact, [a.id]: e.target.value })
                    }
                  />

                  <button
                    onClick={() => handleDone(a)}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Hecho
                  </button>

                  <button
                    onClick={() => handleFailed(a)}
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Falló
                  </button>

                  <button
                    onClick={() => handleSkipped(a)}
                    className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm flex items-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    Saltar
                  </button>
                </div>
              )}

              {a.status !== "pending" && (
                <div className="text-purple-200 text-sm">
                  {a.status === "done" && "✅ Ejecutada"}
                  {a.status === "failed" && "❌ Falló"}
                  {a.status === "skipped" && "⏭ Omitida"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
