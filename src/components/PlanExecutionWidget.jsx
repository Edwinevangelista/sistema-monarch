// src/components/PlanExecutionWidget.jsx
// ============================================
// WIDGET DE EJECUCIÓN DE PLAN - VERSIÓN LIMPIA
// Visual simple pero poderosa basada en datos reales
// ============================================

import React, { useState } from 'react';
import { 
  Target, CheckCircle2, Circle,
  Zap, TrendingUp, ChevronRight,
  ChevronDown, Trophy, Sparkles, Calendar,
  Flame
} from 'lucide-react';


import { usePlanExecution } from '../hooks/usePlanExecution';
import PlanCheckInModal from './PlanCheckInModal';

export default function PlanExecutionWidget({ 
  activePlan, 
  realFinancialData,
  showLocalNotification,
  onOpenPlanDetails,
  onRegisterPayment
}) {
 const {
  financialHealth,
  dailyTasks,
  progress,
  stats,
  needsCheckIn,
  showCheckInModal,
  setShowCheckInModal,
  performCheckIn,
  completeTask,
  isTaskCompleted,
  logPayment
} = usePlanExecution(activePlan, realFinancialData, showLocalNotification);

  const [showAllTasks, setShowAllTasks] = useState(false);
  const [celebratingTask, setCelebratingTask] = useState(null);

  // Sin plan activo
  if (!activePlan?.configuracion) {
    return <NoPlanWidget onCreatePlan={onOpenPlanDetails} />;
  }

  const config = activePlan.configuracion;
  const targetDebt = config.plan?.orderedDebts?.[0];
  const isAvalancha = config.strategy === 'avalancha';

  // Handler para completar tarea
  const handleCompleteTask = (task) => {
    setCelebratingTask(task.id);
    completeTask(task.id, task.points);
    
    setTimeout(() => setCelebratingTask(null), 1200);
    
    if (task.opensModal === 'checkIn') {
      setTimeout(() => setShowCheckInModal(true), 300);
    } else if (task.opensModal === 'registerPayment' && onRegisterPayment) {
      setTimeout(() => onRegisterPayment(), 300);
    }
  };

  // Tareas visibles (máximo 3 si no está expandido)
  const visibleTasks = showAllTasks ? dailyTasks : dailyTasks.slice(0, 3);
  const hasMoreTasks = dailyTasks.length > 3;

  return (
    <div className="space-y-3">
      
      {/* ========================================
          TARJETA PRINCIPAL: PRESUPUESTO DEL DÍA
          ======================================== */}
      {financialHealth && (
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          financialHealth.esCrisis 
            ? 'bg-gradient-to-br from-red-900/50 to-red-950/50 border-red-500/40' 
            : financialHealth.esEmergencia
            ? 'bg-gradient-to-br from-orange-900/40 to-orange-950/40 border-orange-500/30'
            : 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/10'
        }`}>
          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  {financialHealth.esCrisis ? '🚨 Modo Crisis' : financialHealth.esEmergencia ? '⚠️ Presupuesto Bajo' : '💰 Tu Límite Hoy'}
                </div>
                <div className="text-3xl font-black text-white">
                  ${(financialHealth.presupuestoDiario ?? 0).toFixed(0)}

                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Racha */}
                {stats.streak > 0 && (
                  <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-full border border-orange-500/30">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300">{stats.streak}</span>
                  </div>
                )}
                
                {/* Score */}
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  financialHealth.healthScore >= 70 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : financialHealth.healthScore >= 40
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {financialHealth.healthScore}/100
                </div>
              </div>
            </div>
            
            {/* Barra de gasto del día */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Gastado hoy: ${(financialHealth.gastosHoy ?? 0).toFixed(0)}</span>

                <span>{financialHealth.diasRestantes} días restantes</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    financialHealth.esCrisis ? 'bg-red-500' :
                    financialHealth.esEmergencia ? 'bg-orange-500' :
                    financialHealth.gastosHoy > financialHealth.presupuestoDiario ? 'bg-yellow-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (financialHealth.gastosHoy / Math.max(1, financialHealth.presupuestoDiario)) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            {/* Insight de tendencia */}
            {financialHealth.tendenciaAlza && !financialHealth.esCrisis && (
              <div className="flex items-center gap-2 text-[11px] p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200">
                <TrendingUp className="w-3 h-3 flex-shrink-0" />
                <span>Vas gastando más rápido de lo ideal este mes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          PROGRESO DEL PLAN (Compacto)
          ======================================== */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{targetDebt?.nombre || 'Plan Activo'}</div>
              <div className="text-[10px] text-gray-400">
                {isAvalancha ? '🏔️ Avalancha' : '⛄ Bola de Nieve'} • ${(config.monthlyPayment ?? 0).toLocaleString()}/mes

              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{progress.percentage.toFixed(0)}%</div>
            <div className="text-[10px] text-gray-500">completado</div>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(2, progress.percentage)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>${(progress.amountPaid ?? 0).toLocaleString()} pagado</span>

          <span>${(progress.remaining ?? 0).toLocaleString()} restante</span>

        </div>
      </div>

      {/* ========================================
          ALERTA DE CHECK-IN (Si es necesario)
          ======================================== */}
      {needsCheckIn && (
        <button
          onClick={() => setShowCheckInModal(true)}
          className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all"
        >
          <div className="p-2 bg-yellow-500/30 rounded-full animate-pulse">
            <Calendar className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-yellow-200 font-semibold text-sm">Check-in semanal pendiente</div>
            <div className="text-yellow-300/60 text-[10px]">Reporta tu progreso</div>
          </div>
          <ChevronRight className="w-4 h-4 text-yellow-400" />
        </button>
      )}

      {/* ========================================
          LISTA DE TAREAS
          ======================================== */}
      {dailyTasks.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-semibold text-white">Tareas de Hoy</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              {stats.tasksCompletedToday}/{stats.totalTasksToday}
            </span>
          </div>
          
          {/* Lista */}
          <div className="p-2 space-y-1">
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompleted={isTaskCompleted(task.id)}
                isCelebrating={celebratingTask === task.id}
                onComplete={() => handleCompleteTask(task)}
              />
            ))}
          </div>
          
          {/* Botón "Ver más" */}
          {hasMoreTasks && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="w-full py-2 text-xs text-gray-400 hover:text-white border-t border-white/5 flex items-center justify-center gap-1 transition-colors"
            >
              {showAllTasks ? 'Ver menos' : `Ver ${dailyTasks.length - 3} más`}
              <ChevronDown className={`w-3 h-3 transition-transform ${showAllTasks ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Mensaje si todo está completado */}
      {dailyTasks.length === 0 && stats.tasksCompletedToday > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-green-300 font-semibold text-sm">¡Todo completado!</div>
          <div className="text-green-400/60 text-[10px]">Vuelve mañana para más tareas</div>
        </div>
      )}

      {/* ========================================
          MODAL DE CHECK-IN
          ======================================== */}
      {showCheckInModal && (
        <PlanCheckInModal
          plan={activePlan}
          onClose={() => setShowCheckInModal(false)}
          onSubmit={(data) => {
            performCheckIn(data);
            if (data.amountPaid > 0) {
              logPayment(data.amountPaid, targetDebt?.nombre || 'Deuda Principal');
            }
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: ITEM DE TAREA
// ==========================================

function TaskItem({ task, isCompleted, isCelebrating, onComplete }) {
  const priorityStyles = {
    critical: 'border-red-500/30 bg-red-500/5',
    high: 'border-orange-500/30 bg-orange-500/5',
    medium: 'border-blue-500/30 bg-blue-500/5',
    low: 'border-gray-500/30 bg-gray-500/5'
  };

  if (isCompleted) {
    return (
      <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20 opacity-60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-green-300/80 text-xs line-through flex-1">{task.title}</span>
          <span className="text-[10px] text-green-400/60">+{task.points}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-2 rounded-lg border transition-all ${priorityStyles[task.priority]} ${
        isCelebrating ? 'scale-[1.02] ring-2 ring-green-400 bg-green-500/10' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onComplete}
          className="mt-0.5 flex-shrink-0"
        >
          {isCelebrating ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 animate-bounce" />
          ) : (
            <Circle className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium leading-tight">{task.title}</div>
          {task.description && (
            <div className="text-gray-400 text-[10px] mt-0.5 leading-snug">{task.description}</div>
          )}
        </div>
        
        <div className="text-[10px] text-yellow-400/80 font-semibold flex-shrink-0">
          +{task.points}
        </div>
      </div>
      
      {task.actionText && (
        <button
          onClick={onComplete}
          className="mt-2 ml-6 text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
        >
          {task.actionText}
        </button>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: SIN PLAN ACTIVO
// ==========================================

function NoPlanWidget({ onCreatePlan }) {
  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-white/10 rounded-2xl p-6 text-center">
      <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target className="w-7 h-7 text-purple-400" />
      </div>
      <h3 className="text-white font-bold mb-2">Sin plan de deudas activo</h3>
      <p className="text-gray-400 text-sm mb-4">
        Crea un plan para empezar a recibir tareas y seguimiento personalizado.
      </p>
      <button
        onClick={onCreatePlan}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all inline-flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Crear Plan
      </button>
    </div>
  );
}