import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Check
  X
} from "lucide-react";
import { markActionDone, markActionFailed, markActionSkipped } from "../lib/intelligenceEngine";

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
    // Llama a la función de la IA
    markActionDone(plan.id, action.id, value);
    if (onUpdated) onUpdated();
  };

  const handleFailed = (action) => {
    markActionFailed(plan.id, action.id, "No se pudo ejecutar");
    if (onUpdated) onUpdated();
  };

  const handleSkipped = (action) => {
    markActionSkipped(plan.id, action.id, "Decisión consciente");
    if (onUpdated) onUpdated();
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-inner">
      <h3 className="text-white font-bold text-lg md:text-xl mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        Acciones sugeridas por la IA
      </h3>

      <div className="space-y-4">
        {plan.actions.map((action) => {
          const isPending = action.status === "pending";
          const isDone = action.status === "done";
          const isFailed = action.status === "failed";
          const isSkipped = action.status === "skipped";

          // Colores según estado
          let borderColor = "border-white/10";
          let bgClass = "bg-white/5";
          let opacityClass = "opacity-100";

          if (isDone) {
            borderColor = "border-emerald-500/30";
            bgClass = "bg-emerald-500/10";
            opacityClass = "opacity-80 grayscale";
          } else if (isFailed) {
            borderColor = "border-rose-500/30";
            bgClass = "bg-rose-500/10";
          } else if (isSkipped) {
            borderColor = "border-gray-500/30";
            bgClass = "bg-gray-500/10";
          }

          return (
            <div
              key={action.id}
              className={`rounded-2xl p-4 md:p-5 border transition-all ${borderColor} ${bgClass} ${opacityClass}`}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-base md:text-lg mb-1 flex items-center gap-2">
                    {ACTION_LABELS[action.type] || action.type}
                    {isDone && <Check className="w-4 h-4 text-emerald-400 ml-2" />}
                    {isFailed && <X className="w-4 h-4 text-rose-400 ml-2" />}
                    {isSkipped && <Clock className="w-4 h-4 text-gray-400 ml-2" />}
                  </div>
                  <div className="text-indigo-200 text-sm md:text-base">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border ${
                      action.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                      action.status === 'done' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      action.status === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}>
                      {action.status === 'pending' ? 'Pendiente' : action.status === 'done' ? 'Hecho' : action.status}
                    </span>
                    {action.dueDate && ` · Vence: ${action.dueDate}`}
                  </div>
                </div>

                {/* Botones de acción (Solo si está pendiente) */}
                {isPending && (
                  <div className="flex flex-wrap gap-2 shrink-0 mt-2 md:mt-0">
                    {/* Input de Impacto (Monto Ahorrado) */}
                    <div className="relative group">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <input
                        type="number"
                        placeholder="$ Impacto"
                        className="w-24 md:w-28 pl-8 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        onChange={(e) => setImpact({ ...impact, [action.id]: e.target.value })}
                      />
                    </div>

                    {/* Botón Hecho */}
                    <button
                      onClick={() => handleDone(action)}
                      className="px-3 py-2 md:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm md:text-base font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Hecho
                    </button>

                    {/* Botón Falló */}
                    <button
                      onClick={() => handleFailed(action)}
                      className="px-3 py-2 md:px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm md:text-base font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-900/20 active:scale-95"
                    >
                      <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Falló
                    </button>

                    {/* Botón Saltar */}
                    <button
                      onClick={() => handleSkipped(action)}
                      className="px-3 py-2 md:px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm md:text-base font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-gray-900/20 active:scale-95"
                    >
                      <Clock className="w-4 h-4 md:w-5 md:h-5" />
                      Saltar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}