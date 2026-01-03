import { useMemo, useState } from "react";
import { X, Scissors, CheckCircle2, AlertCircle, Zap } from "lucide-react";

const money = (v) =>
  `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function SubscriptionOptimizerModal({
  suscripciones = [],
  kpis = {},
  marked = [],
  onApply,
  onClose,
}) {


  const [view, setView] = useState("diagnostic"); // diagnostic | select | plan
  const [selected, setSelected] = useState(marked || []);
  console.log("SUBS MODAL DATA:", suscripciones);

  const totalSubs = useMemo(
    () => suscripciones.reduce((s, sub) => s + Number(sub.monto || 0), 0),
    [suscripciones]
  );

  const ingreso = Number(kpis.totalIngresos || 0);
  const percent = ingreso > 0 ? totalSubs / ingreso : 0;

  const selectedSavings = useMemo(
    () =>
      suscripciones
        .filter((s) => selected.includes(s.id))
        .reduce((sum, sub) => sum + Number(sub.monto || 0), 0),
    [selected, suscripciones]
  );

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyPlan = () => {
    if (typeof onApply === "function") onApply(selected);
    onClose?.();
  };

  if (!suscripciones || suscripciones.length === 0) {
    return (
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-md w-full border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <AlertCircle className="w-14 h-14 text-purple-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              No hay suscripciones
            </h3>
            <p className="text-purple-200 text-sm mb-4">
              Agrega suscripciones para poder optimizarlas.
            </p>
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl max-w-3xl w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/20">
              <Scissors className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Optimizar Suscripciones
              </h2>
              <p className="text-purple-200 text-sm">
                Marca qué cancelar (solo visual por ahora)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {view === "diagnostic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Kpi label="Total subs" value={money(totalSubs)} />
                <Kpi label="% ingresos" value={`${Math.round(percent * 100)}%`} />
              </div>

              {percent > 0.1 ? (
                <AlertBox message="Tus suscripciones están altas vs tu ingreso. Recortar aquí suele ser el ajuste más rápido." />
              ) : (
                <InfoBox message="Tus suscripciones no se ven exageradas, pero siempre hay duplicadas o servicios que ya no usas." />
              )}

              <button
                onClick={() => setView("select")}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-700 hover:to-red-700 transition"
              >
                <Zap className="w-5 h-5" />
                Optimizar ahora
              </button>
            </div>
          )}

          {view === "select" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView("diagnostic")}
                  className="text-purple-300 hover:text-purple-200 text-sm"
                >
                  ← Volver
                </button>
                <div className="text-purple-200 text-sm">
                  Marcadas:{" "}
                  <span className="text-white font-bold">{selected.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                {suscripciones.map((sub) => {
const subId = sub.id || sub.uuid || sub._id;
const nombre = sub.nombre || sub.name || sub.titulo;
const monto = sub.monto ?? sub.amount ?? sub.precio ?? 0;

const isSelected = selected.includes(subId);
                  return (
                    <label
                     key={subId}

                      className={`flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? "bg-orange-600/25 border-orange-400/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="min-w-0">
                     <div className="text-white font-semibold truncate">
  {nombre}
</div>
<div className="text-purple-300 text-sm">
  {money(monto)}/mes
</div>

                      </div>

                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded-lg border border-orange-500/20">
                            Marcada
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(subId)}
                          className="w-5 h-5"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={() => setView("plan")}
                disabled={selected.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition"
              >
                Crear Plan
              </button>
            </div>
          )}

          {view === "plan" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView("select")}
                  className="text-purple-300 hover:text-purple-200 text-sm"
                >
                  ← Volver
                </button>
                <div className="text-purple-200 text-sm">
                  Ahorro estimado:{" "}
                  <span className="text-white font-bold">
                    {money(selectedSavings)}/mes
                  </span>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                <div className="text-purple-200 text-sm mb-1">
                  Suscripciones marcadas para cancelar
                </div>
                <div className="text-white text-3xl font-bold">
                  {money(selectedSavings)}
                  <span className="text-purple-200 text-base font-medium">
                    {" "}
                    / mes
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {selected.map((id) => {
                  const sub = suscripciones.find((s) => s.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                      <div className="flex-1">
                        <div className="text-white font-semibold">
                          {sub?.nombre || sub?.name || "Suscripción"}
                        </div>
                        <div className="text-purple-300 text-sm">
                          {money(sub?.monto)}/mes
                        </div>
                      </div>
                      <span className="text-xs bg-orange-500/20 text-orange-200 px-2 py-1 rounded-lg border border-orange-500/20">
                        Marcada
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={applyPlan}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Aplicar (solo visual)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
      <div className="text-purple-200 text-sm">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );
}

function AlertBox({ message }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-200 text-sm">
      ⚠️ {message}
    </div>
  );
}

function InfoBox({ message }) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-blue-200 text-sm">
      💡 {message}
    </div>
  );
}
