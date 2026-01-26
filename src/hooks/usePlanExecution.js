// src/hooks/usePlanExecution.js
// ============================================
// VERSIÓN HÍBRIDA FINAL
// Combina: IA Financiera en Tiempo Real + Estructura de Plan de Deuda
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';

// ==========================================
// CONSTANTES Y STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
  TASKS_COMPLETED: 'finguide_plan_tasks_completed',
  LAST_CHECKIN: 'finguide_plan_last_checkin',
  STREAK_DATA: 'finguide_plan_streak',
  PAYMENTS_LOGGED: 'finguide_plan_payments_logged'
};

// ==========================================
// FUNCIONES DE ALMACENAMIENTO
// ==========================================

function getStoredData(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStoredData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage error (${key}):`, e);
  }
}

// ==========================================
// MÓDULO DE INTELIGENCIA FINANCIERA (IA)
// ==========================================

function calculateRealFinancialHealth(realData, today) {
  if (!realData) return null;

  // ✅ Valores por defecto seguros
  const { 
    ingresos = [], 
    gastos = [], 
    gastosFijos = [], 
    deudas = [] 
  } = realData;

  // 1. Ingresos del mes actual
  const ingresosMes = ingresos
    .filter(i => i && i.fecha && new Date(i.fecha).getMonth() === today.getMonth())
    .reduce((sum, i) => sum + (i.monto || 0), 0);

  // 2. Gastos Variables del mes actual
  const gastosVariablesMes = gastos
    .filter(g => g && g.fecha && new Date(g.fecha).getMonth() === today.getMonth())
    .reduce((sum, g) => sum + (g.monto || 0), 0);

  // 3. Gastos Fijos Totales (Compromisos)
  const compromisosFijos = gastosFijos.reduce((sum, gf) => sum + (gf.monto || 0), 0);
  
  // 4. Pagos Mínimos de Deuda (Obligaciones)
  const pagosDeuda = deudas.reduce((sum, d) => sum + (d.pago_minimo || 0), 0);

  // 5. Gasto de HOY (Usamos 'today' recibido por parámetro)
  const hoyStr = today.toISOString().split('T')[0];
  const gastoHoy = gastos
    .filter(g => g && g.fecha === hoyStr)
    .reduce((sum, g) => sum + (g.monto || 0), 0);

  // 6. Cálculo del Margen Disponible
  const diasRestantes = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const margenTotal = ingresosMes - compromisosFijos - pagosDeuda - gastosVariablesMes;
  const presupuestoDiario = diasRestantes > 0 ? margenTotal / diasRestantes : 0;

  return {
    presupuestoDiario,
    margenTotal,
    gastoHoy,
    diasRestantes,
    esCrisis: margenTotal < 0,
    esEmergencia: presupuestoDiario < 5
  };
}

// ==========================================
// GENERADOR DE TAREAS HÍBRIDO
// ==========================================

function generateHybridTasks(activePlan, realData, completedTaskIds) {
  if (!activePlan) return [];
  
  // ✅ CORRECCIÓN: Definimos 'today' localmente aquí para evitar referencias a 'hoy'
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  
  const config = activePlan.configuracion || {};
  const health = calculateRealFinancialHealth(realData, today); // ✅ Pasamos 'today' explícito
  const tasks = [];

  // ==========================================
  // TAREA 0: INTELIGENCIA DIARIA
  // ==========================================
  if (health) {
    const budgetTaskId = `budget_health_${todayStr}`;
    if (!completedTaskIds.includes(budgetTaskId)) {
      let title = `Límite de gasto hoy: $${health.presupuestoDiario.toFixed(0)}`;
      let description = "Mantente dentro del rango para fin de mes.";
      let priority = 'medium';
      let points = 10;

      if (health.esCrisis) {
        title = "🚨 SITUACIÓN CRÍTICA";
        description = "Has gastado más de lo que tienes este mes. Debes gastar $0 hoy.";
        priority = 'critical';
        points = 100;
      } else if (health.esEmergencia) {
        title = "⚠️ Presupuesto de Emergencia";
        description = "Te quedan muy pocos fondos. Solo compra lo esencial.";
        priority = 'high';
        points = 30;
      }

      tasks.push({
        id: budgetTaskId,
        type: 'daily',
        priority,
        category: 'finance',
        title,
        description,
        actionText: 'Ver detalle',
        points,
        data: health
      });
    }
  }

  // ==========================================
  // TAREAS DE PAGO (Basadas en Plan Estático)
  // ==========================================
  const paymentDay = config.analysis?.cleanDebts?.[0]?.vence 
    ? new Date(config.analysis.cleanDebts[0].vence).getDate() 
    : 15;
  const targetDebt = config.plan?.orderedDebts?.[0];

  if (dayOfMonth === paymentDay - 3) {
    tasks.push({
      id: `payment_reminder_${todayStr}`,
      type: 'monthly',
      priority: 'critical',
      category: 'payment',
      title: `⚠️ Pago en 3 días (${targetDebt?.nombre || 'Deuda'})`,
      description: `Meta: $${config.monthlyPayment?.toLocaleString() || '0'}`,
      actionText: 'Verificar fondos',
      points: 20
    });
  }

  if (dayOfMonth === paymentDay) {
    tasks.push({
      id: `payment_day_${todayStr}`,
      type: 'monthly',
      priority: 'critical',
      category: 'payment',
      title: `💳 HOY PAGAR: ${targetDebt?.nombre || 'Deuda Principal'}`,
      description: `Realiza el pago de $${config.monthlyPayment?.toLocaleString() || '0'}`,
      actionText: 'Registrar pago',
      points: 100,
      opensModal: 'registerPayment'
    });
  }

  // ==========================================
  // TAREAS SEMANALES (Hábitos)
  // ==========================================
  
  if (dayOfWeek === 5) {
    tasks.push({
      id: `weekly_checkin_${todayStr}`,
      type: 'weekly',
      priority: 'critical',
      category: 'checkin',
      title: '✅ Check-in Semanal',
      description: 'Reporta tu progreso y ajusta tu rumbo si es necesario.',
      actionText: 'Hacer Check-in',
      points: 50,
      opensModal: 'checkIn'
    });
  }

  if (dayOfWeek === 1) {
    tasks.push({
      id: `weekly_review_${todayStr}`,
      type: 'weekly',
      priority: 'high',
      category: 'review',
      title: '📊 Revisión de Semana',
      description: 'Analiza tus gastos de la semana pasada.',
      actionText: 'Ver reporte',
      points: 25
    });
  }

  // ==========================================
  // TAREA DE HÁBITO: No usar tarjetas (Si no es modo crisis)
  // ==========================================
  if (!health?.esCrisis) {
    tasks.push({
      id: `habit_no_cards_${todayStr}`,
      type: 'daily',
      priority: 'high',
      category: 'habit',
      title: '🚫 No usar tarjetas de crédito',
      description: 'Evita incrementar el saldo pendiente.',
      actionText: 'Confirmar',
      points: 10
    });
  }

  // Filtrar completadas
  return tasks.filter(task => !completedTaskIds.includes(task.id));
}

// ==========================================
// HOOK PRINCIPAL HÍBRIDO
// ==========================================

export function usePlanExecution(activePlan, realFinancialData = {}, showLocalNotification) {
  // Estados
  const [completedTaskIds, setCompletedTaskIds] = useState(() => 
    getStoredData(STORAGE_KEYS.TASKS_COMPLETED, [])
  );
  const [lastCheckIn, setLastCheckIn] = useState(() => 
    getStoredData(STORAGE_KEYS.LAST_CHECKIN, null)
  );
  const [streakData, setStreakData] = useState(() => 
    getStoredData(STORAGE_KEYS.STREAK_DATA, { current: 0, longest: 0, lastActiveDate: null })
  );
  const [paymentsLogged, setPaymentsLogged] = useState(() => 
    getStoredData(STORAGE_KEYS.PAYMENTS_LOGGED, [])
  );
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // ==========================================
  // CÁLCULOS REACTIVOS
  // ==========================================

  // Salud Financiera en Tiempo Real
  const financialHealth = useMemo(() => {
    if (!realFinancialData) return null;
    return calculateRealFinancialHealth(realFinancialData, new Date());
  }, [realFinancialData]);

  // Tareas Híbridas
  const dailyTasks = useMemo(() => {
    if (!activePlan) return [];
    return generateHybridTasks(activePlan, realFinancialData, completedTaskIds);
  }, [activePlan, realFinancialData, completedTaskIds]);

  // Progreso del Plan (Basado en pagos logueados)
  const progress = useMemo(() => {
    if (!activePlan?.configuracion) return { percentage: 0, monthsCompleted: 0, amountPaid: 0 };
    
    const totalDebt = activePlan.monto_objetivo || 0;
    const amountPaid = paymentsLogged
      .filter(p => p.planId === activePlan.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    const percentage = totalDebt > 0 ? Math.min(100, (amountPaid / totalDebt) * 100) : 0;
    
    return {
      percentage: Math.round(percentage * 10) / 10,
      amountPaid,
      monthsCompleted: Math.floor(amountPaid / (activePlan.configuracion.monthlyPayment || 1))
    };
  }, [activePlan, paymentsLogged]);

  // Estadísticas
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCompletedCount = completedTaskIds.filter(id => id.includes(todayStr)).length;
    const totalTasksToday = dailyTasks.length + todayCompletedCount;
    
    return {
      tasksCompletedToday: todayCompletedCount,
      totalTasksToday,
      streak: streakData.current || 0,
      financialHealth: financialHealth // Exportar salud al widget
    };
  }, [completedTaskIds, dailyTasks, streakData, financialHealth]);

  // ==========================================
  // ACCIONES
  // ==========================================

  const completeTask = useCallback((taskId, points = 10) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setCompletedTaskIds(prev => {
      const updated = [...prev, taskId];
      setStoredData(STORAGE_KEYS.TASKS_COMPLETED, updated);
      return updated;
    });
    
    // Actualizar racha
    const hasCompletedToday = completedTaskIds.some(id => id.includes(todayStr));
    if (!hasCompletedToday) {
      setStreakData(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isContinuation = prev.lastActiveDate === yesterday;
        const newCurrent = isContinuation ? (prev.current || 0) + 1 : 1;
        
        const updated = {
          current: newCurrent,
          longest: Math.max(newCurrent, prev.longest || 0),
          lastActiveDate: todayStr
        };
        setStoredData(STORAGE_KEYS.STREAK_DATA, updated);
        return updated;
      });
    }
    
    if (showLocalNotification && points >= 50) {
      showLocalNotification('🎉 ¡Excelente!', { body: `Ganaste ${points} puntos.` });
    }
  }, [completedTaskIds, showLocalNotification]);
  
  const logPayment = useCallback((amount, debtName) => {
    if (!activePlan) return;
    const payment = {
      id: `payment_${Date.now()}`,
      planId: activePlan.id,
      amount,
      debtName,
      date: new Date().toISOString()
    };
    setPaymentsLogged(prev => {
      const updated = [...prev, payment];
      setStoredData(STORAGE_KEYS.PAYMENTS_LOGGED, updated);
      return updated;
    });
    if (showLocalNotification) {
      showLocalNotification('💳 Pago Registrado', { body: `$${amount} a ${debtName}` });
    }
    return payment;
  }, [activePlan, showLocalNotification]);

  const performCheckIn = useCallback((data) => {
    setLastCheckIn({ date: new Date().toISOString(), ...data });
    setStoredData(STORAGE_KEYS.LAST_CHECKIN, lastCheckIn);
    setShowCheckInModal(false);
    // Marcar tarea check-in completada
    const todayStr = new Date().toISOString().split('T')[0];
    completeTask(`weekly_checkin_${todayStr}`, 50);
  }, [completeTask, lastCheckIn]);

  const needsCheckIn = useMemo(() => {
    if (!lastCheckIn) return true;
    const diffDays = Math.floor((Date.now() - new Date(lastCheckIn.date).getTime()) / 86400000);
    return diffDays >= 7;
  }, [lastCheckIn]);

  return {
    // IA y Datos Reales
    financialHealth, // { presupuestoDiario, margenTotal, esCrisis }
    
    // Tareas
    dailyTasks,
    
    // Progreso del Plan
    progress,
    stats,
    streakData,
    
    // Check-in
    needsCheckIn,
    lastCheckIn,
    showCheckInModal,
    setShowCheckInModal,
    performCheckIn,
    
    // Acciones
    completeTask,
    logPayment,
    paymentsLogged,
    
    // Helpers
    isTaskCompleted: (taskId) => completedTaskIds.includes(taskId)
  };
}

export default usePlanExecution;