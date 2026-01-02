// src/components/AutoGoalDisplay.jsx
// Componente para mostrar metas auto-inteligentes

import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, Target } from "lucide-react";

const money = (v) => `$${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function AutoGoalDisplay({ autoGoal }) {
  if (!autoGoal) return null;

  const { title, auto, progress, status, insights } = autoGoal;

  // Icono de tendencia
  const TrendIcon = 
    progress.trend === "improving" ? TrendingUp :
    progress.trend === "worsening" ? TrendingDown :
    Minus;

  const trendColor = 
    progress.trend === "improving" ? "text-green-400" :
    progress.trend === "worsening" ? "text-red-400" :
    "text-yellow-400";

  const statusColor = 
    status === "achieved" ? "bg-green-500/20 border-green-500/40" :
    status === "on_track" ? "bg-blue-500/20 border-blue-500/40" :
    status === "alert" ? "bg-red-500/20 border-red-500/40" :
    "bg-purple-500/20 border-purple-500/40";

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-300" />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColor} border`}>
          {status === "achieved" ? "✅ Logrado" :
           status === "on_track" ? "📈 En camino" :
           status === "alert" ? "⚠️ Alerta" :
           "🎯 Activo"}
        </div>
      </div>

      {/* Progress Message */}
      <div className={`flex items-center gap-2 mb-4 ${trendColor}`}>
        <TrendIcon className="w-5 h-5" />
        <p className="text-sm font-medium">{progress.message}</p>
      </div>

      {/* Métricas específicas por tipo de meta */}
      {autoGoal.type === "controlar_gastos" && (
        <ControlGastosMetrics auto={auto} />
      )}

      {autoGoal.type === "ahorrar_mas" && (
        <AhorrarMasMetrics auto={auto} />
      )}

      {autoGoal.type === "fondo_emergencia" && (
        <FondoEmergenciaMetrics auto={auto} />
      )}

      {autoGoal.type === "recortar_subs" && (
        <RecortarSubsMetrics auto={auto} />
      )}

      {/* Insights / Recomendaciones */}
      {insights && insights.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-white font-semibold text-sm mb-2">💡 Recomendaciones</div>
          {insights.map((insight, i) => (
            <div 
              key={i}
              className={`flex items-start gap-2 p-3 rounded-lg ${
                insight.priority === "urgent" ? "bg-red-500/20 border border-red-500/40" :
                insight.priority === "high" ? "bg-yellow-500/20 border border-yellow-500/40" :
                insight.priority === "success" ? "bg-green-500/20 border border-green-500/40" :
                "bg-white/10 border border-white/20"
              }`}
            >
              <span className="text-xl">{insight.icon}</span>
              <p className="text-white text-sm flex-1">{insight.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== MÉTRICAS POR TIPO DE META ==========

function ControlGastosMetrics({ auto }) {
  const { currentGastos, targetGastos, reductionNeeded, reductionPercent, monthsToAchieve } = auto;

  const progressPercent = Math.min(100, ((currentGastos - targetGastos) / currentGastos) * 100);

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Meta de gastos</span>
          <span className="text-white font-bold">{money(targetGastos)}/mes</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, (targetGastos / currentGastos) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-purple-200">
          <span>Actual: {money(currentGastos)}</span>
          <span>Reducción: {money(reductionNeeded)} ({reductionPercent}%)</span>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Reducción necesaria"
          value={money(reductionNeeded)}
          sublabel={`${reductionPercent}% menos`}
        />
        <MetricCard 
          label="Plazo objetivo"
          value={`${monthsToAchieve} ${monthsToAchieve === 1 ? 'mes' : 'meses'}`}
          sublabel={monthsToAchieve === 1 ? "¡Urgente!" : "Gradual"}
        />
      </div>
    </div>
  );
}

function AhorrarMasMetrics({ auto }) {
  const { currentRate, targetRate, currentAmount, targetAmount, monthlyGap, recommendedMonthly } = auto;

  const progressPercent = (currentRate / targetRate) * 100;

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Tasa de ahorro</span>
          <span className="text-white font-bold">{currentRate}% → {targetRate}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Ahorro actual"
          value={money(currentAmount)}
          sublabel={`${currentRate}% de ingresos`}
        />
        <MetricCard 
          label="Meta mensual"
          value={money(recommendedMonthly)}
          sublabel={`${targetRate}% de ingresos`}
        />
      </div>

      {monthlyGap > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3">
          <p className="text-yellow-200 text-sm">
            Necesitas liberar <span className="font-bold">{money(monthlyGap)}</span> adicionales este mes
          </p>
        </div>
      )}
    </div>
  );
}

function FondoEmergenciaMetrics({ auto }) {
  const { targetAmount, currentAmount, remaining, progressPercent, recommendedMonthly, monthsToComplete, monthsOfCoverage } = auto;

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-purple-200">Fondo de emergencia</span>
          <span className="text-white font-bold">{money(currentAmount)} / {money(targetAmount)}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-purple-200">
          <span>{progressPercent}% completado</span>
          <span>{monthsOfCoverage} meses de cobertura</span>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard 
          label="Faltante"
          value={money(remaining)}
          compact
        />
        <MetricCard 
          label="Mensual"
          value={money(recommendedMonthly)}
          compact
        />
        <MetricCard 
          label="Tiempo"
          value={`${monthsToComplete}m`}
          compact
        />
      </div>
    </div>
  );
}

function RecortarSubsMetrics({ auto }) {
  const { currentTotal, targetTotal, reductionNeeded, percentOfIncome, targetPercent } = auto;

  const progressPercent = reductionNeeded > 0 
    ? ((currentTotal - reductionNeeded) / currentTotal) * 100 
    : 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Suscripciones actuales"
          value={money(currentTotal)}
          sublabel={`${percentOfIncome}% de ingresos`}
        />
        <MetricCard 
          label="Meta optimizada"
          value={money(targetTotal)}
          sublabel={`${targetPercent}% de ingresos`}
        />
      </div>

      {reductionNeeded > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/40 rounded-lg p-3">
          <p className="text-orange-200 text-sm">
            Reduce <span className="font-bold">{money(reductionNeeded)}</span> para optimizar
          </p>
        </div>
      )}
    </div>
  );
}

// ========== COMPONENTE DE MÉTRICA ==========
function MetricCard({ label, value, sublabel, compact = false }) {
  return (
    <div className={`bg-white/5 rounded-lg ${compact ? 'p-2' : 'p-3'} border border-white/10`}>
      <div className={`text-purple-200 ${compact ? 'text-xs' : 'text-sm'} mb-1`}>{label}</div>
      <div className={`text-white font-bold ${compact ? 'text-base' : 'text-lg'}`}>{value}</div>
      {sublabel && <div className="text-purple-300 text-xs mt-1">{sublabel}</div>}
    </div>
  );
}