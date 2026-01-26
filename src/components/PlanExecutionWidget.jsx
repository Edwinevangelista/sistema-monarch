// src/components/PlanExecutionWidget.jsx
import React, { useState } from 'react';
import { 
  Target, CheckCircle2, Flame, AlertTriangle, Zap, 
  TrendingUp, TrendingDown, Wallet, Clock, ChevronRight,
  X
} from 'lucide-react';
import { usePlanExecution } from '../hooks/usePlanExecution';
import PlanCheckInModal from './PlanCheckInModal';

export default function PlanExecutionWidget({ 
  activePlan, 
  realFinancialData, // Nuevo prop: Debe incluir { gastos, ingresos, gastosFijos, deudas }
  showLocalNotification,
  onOpenPlanDetails
}) {
  const {
    dailyTasks,
    dailyMetrics,
    trendData,
    needsEmergencyMode,
    completeTask,
    isTaskCompleted
  } = usePlanExecution(activePlan, realFinancialData, showLocalNotification);

  const [expandedTasks, setExpandedTasks] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  if (!activePlan) {
    return <NoPlanWidget onCreatePlan={onOpenPlanDetails} />;
  }

  return (
    <div className="space-y-4">
      
      {/* 1. TARJETA DE PRESUPUESTO DIARIO INTELIGENTE */}
      <div className={`rounded-2xl border overflow-hidden backdrop-blur-sm transition-all ${
        needsEmergencyMode 
          ? 'bg-gradient-to-br from-red-900/60 to-red-950/60 border-red-500/50 animate-pulse' 
          : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10'
      }`}>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">
                {needsEmergencyMode ? '🚨 Alerta Crítica' : '💰 Presupuesto de Hoy'}
              </div>
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                ${dailyMetrics?.presupuestoDiario?.toFixed(0) || 0}
                <span className="text-sm font-normal text-gray-400">disponibles</span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${
              needsEmergencyMode ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {needsEmergencyMode ? <AlertTriangle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
            </div>
          </div>

          {/* Barra de Gasto Diario */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Gastado hoy: ${dailyMetrics?.gastadoHoy?.toFixed(0) || 0}</span>
              <span>Margen total mes: ${dailyMetrics?.margenTotal?.toFixed(0) || 0}</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  needsEmergencyMode ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, ((dailyMetrics?.gastadoHoy || 0) / ((dailyMetrics?.presupuestoDiario || 1) + 10)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Insight de Tendencia */}
          {trendData && (
            <div className={`mt-4 flex items-center gap-2 text-xs p-2 rounded-lg ${
              trendData.trend === 'increasing' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 'bg-green-500/10 text-green-300 border border-green-500/20'
            }`}>
              {trendData.trend === 'increasing' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {trendData.trend === 'increasing' 
                  ? `Gastando ${trendData.percentage.toFixed(0)}% más rápido que el mes pasado.` 
                  : 'Vas por buen camino comparado con el mes anterior.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. PLANES Y RACHA (Condensado) */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-lg">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{activePlan.nombre}</div>
            <div className="text-xs text-gray-400">{activePlan.tipo.toUpperCase()}</div>
          </div>
        </div>
        <button 
          onClick={() => setExpandedTasks(!expandedTasks)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className={`w-5 h-5 transition-transform ${expandedTasks ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* 3. LISTA DE TAREAS INTELIGENTES */}
      {expandedTasks && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Acciones Requeridas
            </span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
              {dailyTasks.filter(t => !isTaskCompleted(t.id)).length} pendientes
            </span>
          </div>
          
          <div className="p-2 space-y-1">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">¡Al día por ahora!</div>
            ) : (
              dailyTasks.map((task) => (
                <SmartTaskItem 
                  key={task.id} 
                  task={task} 
                  isCompleted={isTaskCompleted(task.id)}
                  onComplete={() => {
                    completeTask(task.id, task.points);
                    if (task.opensModal === 'checkIn') setShowCheckInModal(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN */}
      {showCheckInModal && (
        <PlanCheckInModal
          plan={activePlan}
          onClose={() => setShowCheckInModal(false)}
          onSubmit={(data) => {
            // Aquí podrías conectar con Supabase para guardar el check-in real
            console.log('Check-in data:', data);
            setShowCheckInModal(false);
            completeTask(`weekly_checkin_${new Date().toISOString().split('T')[0]}`, 50);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE DE TAREA INTELIGENTE
// ==========================================

function SmartTaskItem({ task, isCompleted, onComplete }) {
  const priorityConfig = {
    critical: { color: 'border-red-500/30 bg-red-500/5', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    high: { color: 'border-orange-500/30 bg-orange-500/5', icon: <Zap className="w-4 h-4 text-orange-400" /> },
    medium: { color: 'border-blue-500/30 bg-blue-500/5', icon: <Target className="w-4 h-4 text-blue-400" /> },
    low: { color: 'border-gray-500/30 bg-gray-500/5', icon: <Clock className="w-4 h-4 text-gray-400" /> }
  };

  const config = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div className={`p-3 rounded-lg border flex items-center justify-between group transition-all hover:bg-white/5 ${config.color}`}>
      <div className="flex items-center gap-3">
        <button 
          onClick={onComplete}
          disabled={isCompleted}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-600 text-transparent hover:border-green-500'
          }`}
        >
          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
        </button>
        
        <div>
          <div className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
            {task.title}
          </div>
          {task.description && (
            <div className={`text-xs ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
              {task.description}
            </div>
          )}
        </div>
      </div>

      <div className="text-right">
        {task.points && !isCompleted && (
          <span className="text-xs font-bold text-yellow-500">+{task.points}</span>
        )}
      </div>
    </div>
  );
}

function NoPlanWidget({ onCreatePlan }) {
  return (
    <div className="text-center p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl">
      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
        <Target className="w-6 h-6 text-gray-500" />
      </div>
      <h3 className="text-white font-medium mb-1">Sin Plan Activo</h3>
      <p className="text-gray-400 text-sm mb-4">Activa un plan para empezar a recibir predicciones financieras.</p>
      <button onClick={onCreatePlan} className="text-sm text-purple-400 hover:text-purple-300 font-medium">
        Ver Planes Guardados
      </button>
    </div>
  );
}