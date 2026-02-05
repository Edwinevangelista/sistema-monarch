// src/components/AutoGoalDisplay.jsx
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, Target, Zap, Clock, Wallet } from "lucide-react";

const formatMoney = (v) => `$${Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;

export default function AutoGoalDisplay({ autoGoal }) {
  if (!autoGoal) return null;

  const { title, auto, progress, status, insights } = autoGoal;

  // Configuración de Iconos y Colores según estado
  const TrendIcon = 
    progress.trend === "improving" ? TrendingUp :
    progress.trend === "worsening" ? TrendingDown :
    Minus;

  const trendColor = 
    progress.trend === "improving" ? "text-emerald-400" :
    progress.trend === "worsening" ? "text-rose-400" :
    "text-yellow-400";

  const statusConfig = {
    achieved: { 
      label: "Logrado", 
      icon: CheckCircle, 
      classes: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
    },
    on_track: { 
      label: "En camino", 
      icon: TrendingUp, 
      classes: "bg-blue-500/20 border-blue-500/40 text-blue-300" 
    },
    alert: { 
      label: "Alerta", 
      icon: AlertTriangle, 
      classes: "bg-rose-500/20 border-rose-500/40 text-rose-300" 
    },
    neutral: { 
      label: "Activo", 
      icon: Target, 
      classes: "bg-purple-500/20 border-purple-500/40 text-purple-300" 
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.neutral;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${currentStatus.classes.replace('border-', 'border-opacity-20 ')} bg-opacity-10`}>
            <Target className={`w-5 h-5 ${currentStatus.classes.split(' ')[2]}`} />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{title}</h3>
            <p className="text-xs text-gray-400 mt-1">Meta inteligente activa</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${currentStatus.classes}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {currentStatus.label}
        </div>
      </div>

      {/* Mensaje de Tendencia */}
      <div className={`flex items-start gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/5 ${trendColor}`}>
        <div className="mt-0.5">
          <TrendIcon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-gray-200">{progress.message}</p>
      </div>

      {/* Métricas Específicas */}
      <div className="mb-6">
        {autoGoal.type === "controlar_gastos" && <ControlGastosMetrics auto={auto} />}
        {autoGoal.type === "ahorrar_mas" && <AhorrarMasMetrics auto={auto} />}
        {autoGoal.type === "fondo_emergencia" && <FondoEmergenciaMetrics auto={auto} />}
        {autoGoal.type === "recortar_subs" && <RecortarSubsMetrics auto={auto} />}
      </div>

      {/* Insights / Recomendaciones */}
      {insights && insights.length > 0 && (
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recomendaciones Inteligentes</h4>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTES DE MÉTRICAS
// ==========================================

function ControlGastosMetrics({ auto }) {
  const { currentGastos, targetGastos, reductionNeeded, reductionPercent, monthsToAchieve } = auto;
  
  // Cálculo de progreso visual (invertido: menos es mejor)
  const progressPercent = Math.min(100, (targetGastos / currentGastos) * 100);
  const isDanger = currentGastos > targetGastos * 1.1; // Si gastas un 10% más de tu meta

  return (
    <div className="space-y-5">
      {/* Barra de Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-2 font-medium">
          <span className="text-gray-400">Límite Mensual</span>
          <span className={`font-bold ${isDanger ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatMoney(targetGastos)}
          </span>
        </div>
        <div className="h-3 w-full bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isDanger ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-2">
          <span>Actual: {formatMoney(currentGastos)}</span>
          <span>Meta: {formatMoney(targetGastos)}</span>
        </div>
      </div>

      {/* Tarjetas de Datos */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Reducción Requerida"
          value={formatMoney(reductionNeeded)}
          sublabel={`${reductionPercent}% menos`}
          icon={<TrendingDown className="w-3 h-3" />}
          color="text-rose-400"
        />
        <MetricCard 
          label="Tiempo Estimado"
          value={`${monthsToAchieve} meses`}
          sublabel="Alcanzar meta"
          icon={<Clock className="w-3 h-3" />}
          color="text-blue-400"
        />
      </div>
    </div>
  );
}

function AhorrarMasMetrics({ auto }) {
  const { currentRate, targetRate, recommendedMonthly, monthlyGap } = auto;
  const progressPercent = Math.min(100, (currentRate / targetRate) * 100);

  return (
    <div className="space-y-5">
      {/* Barra de Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-2 font-medium">
          <span className="text-gray-400">Tasa de Ahorro</span>
          <span className="text-white font-bold">
            {currentRate}% <span className="text-gray-500">/</span> {targetRate}%
          </span>
        </div>
        <div className="h-3 w-full bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tarjetas de Datos */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard 
          label="Meta Mensual"
          value={formatMoney(recommendedMonthly)}
          sublabel="Ideal para ahorrar"
          icon={<Wallet className="w-3 h-3" />}
          color="text-emerald-400"
        />
        <MetricCard 
          label="Déficit Actual"
          value={formatMoney(monthlyGap)}
          sublabel="Falta para meta"
          icon={<AlertTriangle className="w-3 h-3" />}
          color={monthlyGap > 0 ? "text-rose-400" : "text-emerald-400"}
        />
      </div>
    </div>
  );
}

function FondoEmergenciaMetrics({ auto }) {
  const { targetAmount, currentAmount, remaining, progressPercent, recommendedMonthly, monthsOfCoverage } = auto;

  return (
    <div className="space-y-5">
      {/* Barra de Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-2 font-medium">
          <span className="text-gray-400">Fondo de Emergencia</span>
          <span className="text-white font-bold">{formatMoney(currentAmount)}</span>
        </div>
        <div className="h-3 w-full bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-2">
          <span>{progressPercent}% completado</span>
          <span>{monthsOfCoverage} meses de cobertura</span>
        </div>
      </div>

      {/* Tarjetas Compactas (3 columnas en móvil) */}
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric 
          label="Faltante" 
          value={formatMoney(remaining)} 
          color="text-white" 
        />
        <MiniMetric 
          label="Aportación" 
          value={formatMoney(recommendedMonthly)} 
          color="text-white" 
        />
        <MiniMetric 
          label="Tiempo" 
          value={`${Math.ceil(auto.monthsToComplete)}m`} 
          color="text-white" 
        />
      </div>
    </div>
  );
}

function RecortarSubsMetrics({ auto }) {
  const { currentTotal, targetTotal, reductionNeeded, percentOfIncome } = auto;
  const hasReduction = reductionNeeded > 0;
  const progressPercent = hasReduction 
    ? ((currentTotal - reductionNeeded) / currentTotal) * 100 
    : 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end p-3 bg-white/5 rounded-xl border border-white/5">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Actual</div>
          <div className="text-lg font-bold text-white">{formatMoney(currentTotal)}</div>
          <div className="text-[10px] text-orange-300">{percentOfIncome}% de ingresos</div>
        </div>
        <div className="h-8 w-[1px] bg-white/10"></div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Meta</div>
          <div className="text-lg font-bold text-emerald-400">{formatMoney(targetTotal)}</div>
          <div className="text-[10px] text-emerald-300">Optimizado</div>
        </div>
      </div>

      {hasReduction && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-full text-orange-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-sm text-orange-100">
            Podrías ahorrar <span className="font-bold text-orange-400">{formatMoney(reductionNeeded)}</span> al mes optimizando.
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES UI REUTILIZABLES
// ==========================================

function MetricCard({ label, value, sublabel, icon, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:bg-white/10 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={color}>{icon}</span>}
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
      </div>
      <div className={`text-lg font-bold text-white group-hover:scale-105 transition-transform origin-left ${color}`}>
        {value}
      </div>
      {sublabel && <div className="text-[10px] text-gray-500 mt-1">{sublabel}</div>}
    </div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
      <div className="text-[9px] text-gray-400 uppercase mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function InsightCard({ insight }) {
  const colorConfig = {
    urgent: "bg-rose-500/10 border-rose-500/20 text-rose-300",
    high: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    medium: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
  };

  const styleClass = colorConfig[insight.priority] || "bg-white/5 border-white/10 text-white";

  return (
    <div className={`${styleClass} border rounded-xl p-3 flex items-start gap-3 transition-all hover:bg-white/10`}>
      <span className="text-lg mt-0.5">{insight.icon}</span>
      <p className="text-xs md:text-sm leading-relaxed font-medium flex-1">{insight.text}</p>
    </div>
  );
}