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
  Flame, Info, X
} from 'lucide-react';


import { usePlanExecution } from '../hooks/usePlanExecution';
import PlanCheckInModal from './PlanCheckInModal';
import { toast } from 'sonner'
import { showConfirm } from '../utils/confirm'

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
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);

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
          WIDGET SALUD FINANCIERA DEL DÍA
          ======================================== */}
      {financialHealth && (() => {
        const score = financialHealth.healthScore ?? 0
        const pct = Math.min(100, (financialHealth.gastosHoy / Math.max(1, financialHealth.presupuestoDiario)) * 100)
        const accentColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
        const accentGlow  = score >= 70 ? 'rgba(16,185,129,0.35)' : score >= 40 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'
        const label       = score >= 70 ? 'Excelente' : score >= 40 ? 'Regular' : 'Atención'
        // SVG ring params
        const R = 26, C = 2 * Math.PI * R
        const dash = (score / 100) * C

        return (
          <div
            className="rounded-2xl p-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              border: `1px solid ${accentColor}22`,
              boxShadow: `0 0 40px -10px ${accentGlow}`,
            }}
          >
            {/* Fila principal: ring + cifra + stats */}
            <div className="flex items-center gap-4">
              {/* Ring SVG */}
              <div className="relative shrink-0 w-[68px] h-[68px] flex items-center justify-center">
                <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
                  <circle cx="34" cy="34" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
                  <circle
                    cx="34" cy="34" r={R} fill="none"
                    stroke={accentColor} strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C}`}
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${accentGlow})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[15px] font-black text-white leading-none">{score}</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">/100</span>
                </div>
              </div>

              {/* Centro: cifra y label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                  >
                    {label}
                  </span>
                  {(stats.streak ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-400">
                      <Flame className="w-3 h-3" />{stats.streak}d
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-medium mb-1.5">Límite diario disponible</p>
                <p className="text-2xl font-black text-white leading-none">
                  ${(financialHealth.presupuestoDiario ?? 0).toFixed(0)}
                </p>
              </div>

              {/* Derecha: días restantes */}
              <div
                className="text-center shrink-0 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-xl font-black text-white leading-none">{financialHealth.diasRestantes ?? '–'}</p>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">días</p>
              </div>
            </div>

            {/* Barra de uso diario */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                <span>Gastado hoy <span className="text-gray-400 font-semibold">${(financialHealth.gastosHoy ?? 0).toFixed(0)}</span></span>
                <span style={{ color: accentColor }}>{pct.toFixed(0)}% usado</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                    boxShadow: `0 0 8px ${accentGlow}`,
                  }}
                />
              </div>
            </div>

            {/* Insight */}
            {financialHealth.tendenciaAlza && score >= 40 && (
              <div
                className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-[11px] font-medium"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <TrendingUp className="w-3 h-3 shrink-0" />
                Ritmo de gasto más alto de lo habitual
              </div>
            )}
          </div>
        )
      })()}

    {/* ========================================
    PROGRESO DEL PLAN (Compacto)
    ======================================== */}
<div className="bg-white/5 border border-white/10 rounded-xl p-3">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-purple-500/20 rounded-lg">
        <Target className="w-4 h-4 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{targetDebt?.nombre || 'Plan Activo'}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-gray-400">
            Pagando <span className="text-white font-semibold">${(config.monthlyPayment ?? 0).toLocaleString()}/mes</span>
          </span>
          <button
            onClick={() => setShowStrategyInfo(true)}
            className="flex items-center gap-0.5 text-[9px] text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Info className="w-2.5 h-2.5" />
            {isAvalancha ? 'Ahorrando intereses' : 'Método rápido'}
          </button>
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-lg font-bold text-white">{(progress.percentage ?? 0).toFixed(0)}%</div>
      <div className="text-[10px] text-gray-500">completado</div>
    </div>
  </div>
  
  {/* Barra de progreso */}
  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
      style={{ width: `${Math.max(2, progress.percentage ?? 0)}%` }}
    />
  </div>
  
  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
    <span>${(progress.amountPaid ?? 0).toLocaleString()} pagado</span>
    <span>${(progress.remaining ?? 0).toLocaleString()} restante</span>
  </div>

  {/* 👉 AGREGAR BOTÓN AQUÍ */}
  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
    <button
      onClick={onOpenPlanDetails}
      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-white/5"
    >
      📊 Ver Detalles
    </button>
    
<button
  onClick={async () => {
    const ok = await showConfirm({
      titulo: 'Recalculate plan?',
      mensaje: 'This will update the payment schedule based on your current balances.',
      textoConfirmar: 'Recalculate',
      textoCancel: 'Cancel',
    });
    if (!ok) return;
    try {
      if (window.refreshPlanesGlobally) {
        await window.refreshPlanesGlobally()
        toast.success('Plan updated with current balances')
      } else {
        toast.warning('Reload the page to update the plan')
      }
    } catch (error) {
      console.error('Error actualizando plan:', error)
      toast.error('❌ Error updating: ' + error.message)
    }
  }}
  className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-semibold transition-all border border-blue-500/30"
>
  🔄 Actualizar
</button>
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

      {/* ========================================
          MODAL INFO DE ESTRATEGIA (lenguaje simple)
          ======================================== */}
      {showStrategyInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-0" onClick={() => setShowStrategyInfo(false)}>
          <div
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-base">¿Cómo funciona tu plan?</h3>
              <button onClick={() => setShowStrategyInfo(false)} className="p-1.5 rounded-xl bg-white/8 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAvalancha ? (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-purple-300 font-bold text-sm mb-1">🧠 Estrategia Inteligente</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Tu plan ataca primero la deuda que <span className="text-white font-semibold">cobra más intereses</span>. Así pagas menos dinero en total al final.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">¿Cómo funciona?</p>
                  {[
                    { n: '1', t: 'Pagas el mínimo en todas tus deudas', d: 'Para no atrasarte ni pagar multas.' },
                    { n: '2', t: 'El extra va a la que cobra más', d: `Todo el dinero extra a "${targetDebt?.nombre || 'tu deuda principal'}" porque tiene el interés más alto.` },
                    { n: '3', t: 'Cuando terminas una, sigues con la siguiente', d: 'Y así hasta quedar libre de deudas.' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3 bg-white/4 rounded-xl p-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 text-xs font-black flex items-center justify-center flex-shrink-0">{s.n}</div>
                      <div>
                        <p className="text-white text-xs font-semibold">{s.t}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="text-emerald-300 text-xs font-bold">✅ Resultado: ahorras más dinero en intereses a largo plazo</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-blue-300 font-bold text-sm mb-1">⚡ Estrategia de Motivación</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Tu plan empieza por la <span className="text-white font-semibold">deuda más pequeña</span>. Te da victorias rápidas y te mantiene motivado para continuar.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">¿Cómo funciona?</p>
                  {[
                    { n: '1', t: 'Pagas el mínimo en todas las deudas', d: 'Para no atrasarte ni generar multas.' },
                    { n: '2', t: 'El extra va a la más pequeña primero', d: `"${targetDebt?.nombre || 'tu deuda principal'}" es la primera en eliminarse.` },
                    { n: '3', t: 'Cada deuda que pagues = más dinero libre', d: 'Ese dinero lo diriges a la siguiente deuda.' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3 bg-white/4 rounded-xl p-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-xs font-black flex items-center justify-center flex-shrink-0">{s.n}</div>
                      <div>
                        <p className="text-white text-xs font-semibold">{s.t}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="text-emerald-300 text-xs font-bold">✅ Resultado: te sientes bien más rápido y mantienes el ritmo</p>
                </div>
              </div>
            )}
          </div>
        </div>
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