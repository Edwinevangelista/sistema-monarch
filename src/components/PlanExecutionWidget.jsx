// src/components/PlanExecutionWidget.jsx
// ============================================
// WIDGET DE EJECUCIÓN DE PLAN DE DEUDAS
// Muestra tareas, progreso y racha en el dashboard
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Target, CheckCircle2, Circle, Flame, Trophy, 
  ChevronRight, Clock, AlertTriangle, Zap, Gift,
  Calendar, TrendingUp, Lock, Sparkles, X
} from 'lucide-react';
import { usePlanExecution } from '../hooks/usePlanExecution';
import PlanCheckInModal from './PlanCheckInModal';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PlanExecutionWidget({ 
  activePlan, 
  showLocalNotification,
  onOpenPlanDetails,
  onRegisterPayment 
}) {
  const {
    dailyTasks,
    progress,
    stats,
    streakData,
    needsCheckIn,
    showCheckInModal,
    setShowCheckInModal,
    performCheckIn,
    completeTask,
    isTaskCompleted
  } = usePlanExecution(activePlan, showLocalNotification);
  
  const [expandedTasks, setExpandedTasks] = useState(true);
  const [celebratingTask, setCelebratingTask] = useState(null);
  
  // No mostrar si no hay plan activo
  if (!activePlan || !activePlan.configuracion) {
    return <NoPlanWidget onCreatePlan={onOpenPlanDetails} />;
  }
  
  const config = activePlan.configuracion;
  const targetDebt = config.plan?.orderedDebts?.[0];
  const strategyEmoji = config.strategy === 'avalancha' ? '🏔️' : '⛄';
  
  // ==========================================
  // HANDLERS
  // ==========================================
  
  const handleCompleteTask = (task) => {
    setCelebratingTask(task.id);
    completeTask(task.id, task.points);
    
    setTimeout(() => setCelebratingTask(null), 1500);
    
    // Si la tarea abre un modal
    if (task.opensModal === 'checkIn') {
      setShowCheckInModal(true);
    } else if (task.opensModal === 'registerPayment' && onRegisterPayment) {
      onRegisterPayment();
    }
  };
  
  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <div className="space-y-4">
      {/* HEADER CON PROGRESO */}
      <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
        {/* Barra superior */}
        <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-white">Plan Activo</span>
            <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
              {strategyEmoji} {config.strategy === 'avalancha' ? 'Avalancha' : 'Bola de Nieve'}
            </span>
          </div>
          
          {/* Racha */}
          <div className="flex items-center gap-1.5 bg-orange-500/20 px-2.5 py-1 rounded-full border border-orange-500/30">
            <Flame className={`w-4 h-4 ${stats.streak > 0 ? 'text-orange-400 animate-pulse' : 'text-gray-500'}`} />
            <span className={`text-sm font-bold ${stats.streak > 0 ? 'text-orange-300' : 'text-gray-400'}`}>
              {stats.streak}
            </span>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="p-4">
          {/* Meta actual */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Atacando</div>
              <div className="text-lg font-bold text-white">{targetDebt?.nombre || 'Deuda Principal'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pago mensual</div>
              <div className="text-lg font-bold text-green-400">${config.monthlyPayment?.toLocaleString()}</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-400">Progreso total</span>
              <span className="text-white font-semibold">{progress.percentage}%</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.max(2, progress.percentage)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
              <span>$0</span>
              <span>${activePlan.monto_objetivo?.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-white">{progress.monthsCompleted}</div>
              <div className="text-[10px] text-gray-400">meses completados</div>
            </div>
            <div className="bg-black/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-green-400">${progress.amountPaid?.toLocaleString() || 0}</div>
              <div className="text-[10px] text-gray-400">pagado</div>
            </div>
            <div className="bg-black/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-purple-400">{activePlan.meses_duracion - progress.monthsCompleted}</div>
              <div className="text-[10px] text-gray-400">meses restantes</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ALERTA DE CHECK-IN */}
      {needsCheckIn && (
        <button
          onClick={() => setShowCheckInModal(true)}
          className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all animate-pulse"
        >
          <div className="p-2 bg-yellow-500/30 rounded-full">
            <Clock className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-yellow-200 font-semibold text-sm">Check-in semanal pendiente</div>
            <div className="text-yellow-300/60 text-xs">Registra tu progreso para mantener el plan</div>
          </div>
          <ChevronRight className="w-5 h-5 text-yellow-400" />
        </button>
      )}
      
      {/* TAREAS DEL DÍA */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpandedTasks(!expandedTasks)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Tareas de Hoy</span>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              {stats.tasksCompletedToday}/{stats.totalTasksToday}
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedTasks ? 'rotate-90' : ''}`} />
        </button>
        
        {expandedTasks && (
          <div className="px-4 pb-4 space-y-2">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-green-300 font-semibold">¡Todo completado!</div>
                <div className="text-gray-500 text-xs mt-1">Vuelve mañana para más tareas</div>
              </div>
            ) : (
              dailyTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={isTaskCompleted(task.id)}
                  isCelebrating={celebratingTask === task.id}
                  onComplete={() => handleCompleteTask(task)}
                />
              ))
            )}
          </div>
        )}
      </div>
      
      {/* PRÓXIMOS HITOS */}
      <NextMilestones plan={activePlan} progress={progress} />
      
      {/* MODAL DE CHECK-IN */}
      {showCheckInModal && (
        <PlanCheckInModal
          plan={activePlan}
          onClose={() => setShowCheckInModal(false)}
          onSubmit={performCheckIn}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

function TaskItem({ task, isCompleted, isCelebrating, onComplete }) {
  const priorityColors = {
    critical: 'border-red-500/30 bg-red-500/10',
    high: 'border-orange-500/30 bg-orange-500/10',
    medium: 'border-blue-500/30 bg-blue-500/10',
    low: 'border-gray-500/30 bg-gray-500/10'
  };
  
  const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4 text-red-400" />,
    high: <Zap className="w-4 h-4 text-orange-400" />,
    medium: <Target className="w-4 h-4 text-blue-400" />,
    low: <Circle className="w-4 h-4 text-gray-400" />
  };
  
  if (isCompleted) {
    return (
      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 opacity-60">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-green-300 text-sm line-through">{task.title}</span>
          <span className="ml-auto text-xs text-green-400">+{task.points} pts</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`p-3 rounded-xl border transition-all ${priorityColors[task.priority]} ${
        isCelebrating ? 'scale-105 ring-2 ring-green-400 bg-green-500/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          className="mt-0.5 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          {isCelebrating ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 animate-bounce" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-white" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {priorityIcons[task.priority]}
            <span className="text-white text-sm font-medium">{task.title}</span>
          </div>
          <p className="text-gray-400 text-xs">{task.description}</p>
          
          {task.actionText && (
            <button
              onClick={onComplete}
              className="mt-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {task.actionText}
            </button>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <div className="text-xs text-yellow-400 font-semibold">+{task.points}</div>
          <div className="text-[10px] text-gray-500">puntos</div>
        </div>
      </div>
    </div>
  );
}

function NextMilestones({ plan, progress }) {
  const milestones = plan.configuracion?.plan?.timeline || [];
  const nextMilestones = milestones.slice(0, 3);
  
  if (nextMilestones.length === 0) return null;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-semibold text-white">Próximos Hitos</span>
      </div>
      
      <div className="space-y-2">
        {nextMilestones.map((milestone, idx) => (
          <div 
            key={idx}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              idx === 0 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/20' : 'bg-black/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {idx === 0 ? <Sparkles className="w-4 h-4" /> : milestone.month}
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{milestone.debtName}</div>
              <div className="text-gray-500 text-xs">Mes {milestone.month}</div>
            </div>
            {idx === 0 && (
              <span className="text-xs text-green-400 font-semibold animate-pulse">Próximo</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NoPlanWidget({ onCreatePlan }) {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
        <Target className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Sin plan activo</h3>
      <p className="text-gray-400 text-sm mb-4">
        Crea un plan de eliminación de deudas para empezar a recibir tareas y seguimiento.
      </p>
      <button
        onClick={onCreatePlan}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all inline-flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Crear Plan
      </button>
    </div>
  );
}