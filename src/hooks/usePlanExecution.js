// src/hooks/usePlanExecution.js
// ============================================
// SISTEMA INTELIGENTE DE EJECUCIÓN DE PLANES
// Genera tareas dinámicas basadas en datos REALES del usuario
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';

// ==========================================
// STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
  TASKS_COMPLETED: 'finguide_tasks_completed_v2',
  LAST_CHECKIN: 'finguide_last_checkin_v2',
  STREAK_DATA: 'finguide_streak_v2',
  PAYMENTS_LOGGED: 'finguide_payments_v2',
  NOTIFICATIONS_SENT: 'finguide_notifs_sent_v2'
};

// ==========================================
// HELPERS DE ALMACENAMIENTO
// ==========================================

const getStored = (key, fallback = null) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
};

// ==========================================
// MOTOR DE INTELIGENCIA FINANCIERA
// ==========================================

function analyzeFinancialHealth(data, today) {
  if (!data) return null;
  
  const { ingresos = [], gastos = [], gastosFijos = [], deudas = [] } = data;
  const mesActual = today.getMonth();
  const añoActual = today.getFullYear();
  
  // 1. Ingresos del mes
  const ingresosMes = ingresos
    .filter(i => {
      if (!i?.fecha) return false;
      const f = new Date(i.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === añoActual;
    })
    .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
  
  // 2. Gastos variables del mes
  const gastosVariablesMes = gastos
    .filter(g => {
      if (!g?.fecha) return false;
      const f = new Date(g.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === añoActual;
    })
    .reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  
  // 3. Gastos de HOY
  const hoyStr = today.toISOString().split('T')[0];
  const gastosHoy = gastos
    .filter(g => g?.fecha === hoyStr)
    .reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  
  // 4. Compromisos fijos mensuales
  const compromisosFijos = gastosFijos.reduce((sum, gf) => sum + (Number(gf.monto) || 0), 0);
  
  // 5. Pagos mínimos de deuda
  const pagosMinimosDeuda = deudas.reduce((sum, d) => sum + (Number(d.pago_minimo) || 0), 0);
  
  // 6. Deuda total
  const deudaTotal = deudas.reduce((sum, d) => sum + (Number(d.saldo) || 0), 0);
  
  // 7. Cálculos de presupuesto
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const diaActual = today.getDate();
  const diasRestantes = Math.max(1, ultimoDiaMes - diaActual + 1);
  
  const gastosTotalesMes = compromisosFijos + gastosVariablesMes + pagosMinimosDeuda;
  const margenDisponible = ingresosMes - gastosTotalesMes;
  const presupuestoDiario = diasRestantes > 0 ? Math.max(0, margenDisponible / diasRestantes) : 0;
  
  // 8. Promedio diario de gasto (tendencia)
  const promedioDiarioGasto = diaActual > 0 ? gastosVariablesMes / diaActual : 0;
  const proyeccionFinMes = promedioDiarioGasto * ultimoDiaMes;
  
  // 9. Estados de alerta
  const esCrisis = margenDisponible < 0;
  const esEmergencia = presupuestoDiario < 10;
  const tendenciaAlza = proyeccionFinMes > (ingresosMes * 0.7); // Gastando más del 70%
  
  // 10. Score de salud (0-100)
  let healthScore = 50;
  if (margenDisponible > ingresosMes * 0.2) healthScore += 30;
  else if (margenDisponible > 0) healthScore += 15;
  else healthScore -= 20;
  
  if (deudaTotal < ingresosMes) healthScore += 10;
  else if (deudaTotal > ingresosMes * 3) healthScore -= 15;
  
  if (!esCrisis && !esEmergencia) healthScore += 10;
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  return {
    // Métricas principales
    presupuestoDiario: Math.round(presupuestoDiario * 100) / 100,
    gastosHoy,
    margenDisponible,
    diasRestantes,
    
    // Totales del mes
    ingresosMes,
    gastosTotalesMes,
    gastosVariablesMes,
    compromisosFijos,
    pagosMinimosDeuda,
    deudaTotal,
    
    // Tendencias
    promedioDiarioGasto,
    proyeccionFinMes,
    tendenciaAlza,
    
    // Estados
    esCrisis,
    esEmergencia,
    healthScore,
    
    // Mensaje contextual
    mensaje: esCrisis 
      ? '🚨 Estás en números rojos. Evita gastos no esenciales.'
      : esEmergencia 
      ? '⚠️ Presupuesto muy ajustado. Solo compra lo necesario.'
      : tendenciaAlza
      ? '📊 Estás gastando más rápido de lo ideal.'
      : '✅ Vas bien. Mantén el ritmo.'
  };
}

// ==========================================
// GENERADOR DE TAREAS INTELIGENTES
// ==========================================

function generateSmartTasks(plan, financialData, completedIds, today) {
  const tasks = [];
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay(); // 0=Dom, 1=Lun...
  const dayOfMonth = today.getDate();
  
  const config = plan?.configuracion || {};
  const health = financialData;
  const targetDebt = config.plan?.orderedDebts?.[0];
  const monthlyPayment = config.monthlyPayment || 0;
  
  // ==========================================
  // 1. TAREA PRINCIPAL: Estado financiero del día
  // ==========================================
  
  if (health) {
    const budgetId = `budget_${todayStr}`;
    if (!completedIds.includes(budgetId)) {
      let title, description, priority, points;
      
      if (health.esCrisis) {
        title = '🚨 ALERTA: Estás en rojo';
        description = `Tu margen es -$${Math.abs(health.margenDisponible).toFixed(0)}. Hoy no gastes nada que no sea esencial.`;
        priority = 'critical';
        points = 100;
      } else if (health.esEmergencia) {
        title = '⚠️ Presupuesto crítico';
        description = `Solo tienes $${health.presupuestoDiario.toFixed(0)}/día. Evalúa cada gasto.`;
        priority = 'high';
        points = 50;
      } else {
        title = `💰 Tu límite hoy: $${health.presupuestoDiario.toFixed(0)}`;
        description = health.gastosHoy > 0 
          ? `Ya gastaste $${health.gastosHoy}. Te quedan $${Math.max(0, health.presupuestoDiario - health.gastosHoy).toFixed(0)}.`
          : `Quedan ${health.diasRestantes} días del mes. Mantén el control.`;
        priority = health.tendenciaAlza ? 'medium' : 'low';
        points = 15;
      }
      
      tasks.push({
        id: budgetId,
        type: 'daily',
        priority,
        category: 'budget',
        title,
        description,
        actionText: 'Entendido',
        points,
        data: health
      });
    }
  }
  
  // ==========================================
  // 2. TAREA: No usar tarjetas de crédito
  // ==========================================
  
  const noCardsId = `no_cards_${todayStr}`;
  if (!completedIds.includes(noCardsId) && config.plan?.orderedDebts?.length > 0) {
    tasks.push({
      id: noCardsId,
      type: 'daily',
      priority: 'high',
      category: 'habit',
      title: '🚫 No usar tarjetas de crédito',
      description: 'Cada compra nueva aleja tu meta. Usa solo efectivo o débito.',
      actionText: 'No usé tarjetas hoy',
      points: 20
    });
  }
  
  // ==========================================
  // 3. TAREAS BASADAS EN DÍA DE LA SEMANA
  // ==========================================
  
  // Lunes: Planificación
  if (dayOfWeek === 1) {
    const mondayId = `monday_plan_${todayStr}`;
    if (!completedIds.includes(mondayId)) {
      tasks.push({
        id: mondayId,
        type: 'weekly',
        priority: 'medium',
        category: 'planning',
        title: '📅 Planifica tu semana',
        description: `Meta semanal: mantener gastos bajo $${(health?.presupuestoDiario * 7).toFixed(0) || '---'}`,
        actionText: 'Ya lo planeé',
        points: 25
      });
    }
  }
  
  // Viernes: Check-in obligatorio
  if (dayOfWeek === 5) {
    const fridayId = `checkin_${todayStr}`;
    if (!completedIds.includes(fridayId)) {
      tasks.push({
        id: fridayId,
        type: 'weekly',
        priority: 'critical',
        category: 'checkin',
        title: '✅ Check-in semanal',
        description: '¿Cómo te fue esta semana? Reporta tu progreso.',
        actionText: 'Hacer check-in',
        points: 50,
        opensModal: 'checkIn'
      });
    }
  }
  
  // Domingo: Preparación
  if (dayOfWeek === 0) {
    const sundayId = `prep_${todayStr}`;
    if (!completedIds.includes(sundayId)) {
      tasks.push({
        id: sundayId,
        type: 'weekly',
        priority: 'low',
        category: 'planning',
        title: '📆 Prepara la nueva semana',
        description: 'Revisa tus cuentas y confirma los pagos que vienen.',
        actionText: 'Listo',
        points: 15
      });
    }
  }
  
  // ==========================================
  // 4. TAREAS DE PAGO (Basadas en fecha de vencimiento)
  // ==========================================
  
  if (targetDebt && monthlyPayment > 0) {
    // Obtener día de vencimiento de la primera deuda
    const paymentDay = targetDebt.vence 
      ? new Date(targetDebt.vence).getDate() 
      : 15;
    
    // 3 días antes del pago
    if (dayOfMonth === paymentDay - 3 || dayOfMonth === paymentDay - 2 || dayOfMonth === paymentDay - 1) {
      const reminderId = `payment_soon_${todayStr}`;
      if (!completedIds.includes(reminderId)) {
        const diasParaPago = paymentDay - dayOfMonth;
        tasks.push({
          id: reminderId,
          type: 'monthly',
          priority: 'critical',
          category: 'payment',
          title: `⚠️ Pago en ${diasParaPago} día${diasParaPago > 1 ? 's' : ''}`,
          description: `Prepara $${monthlyPayment.toLocaleString()} para ${targetDebt.nombre || 'tu deuda'}`,
          actionText: 'Fondos listos',
          points: 30
        });
      }
    }
    
    // Día del pago
    if (dayOfMonth === paymentDay) {
      const payDayId = `payment_day_${todayStr}`;
      if (!completedIds.includes(payDayId)) {
        tasks.push({
          id: payDayId,
          type: 'monthly',
          priority: 'critical',
          category: 'payment',
          title: `💳 ¡HOY TOCA PAGAR!`,
          description: `Paga $${monthlyPayment.toLocaleString()} a ${targetDebt.nombre || 'tu deuda principal'}`,
          actionText: 'Registrar pago',
          points: 100,
          opensModal: 'registerPayment'
        });
      }
    }
  }
  
  // ==========================================
  // 5. TAREAS DE TENDENCIA (Si está gastando mucho)
  // ==========================================
  
  if (health?.tendenciaAlza && !health.esCrisis) {
    const trendId = `trend_alert_${todayStr}`;
    if (!completedIds.includes(trendId)) {
      tasks.push({
        id: trendId,
        type: 'daily',
        priority: 'medium',
        category: 'alert',
        title: '📈 Gastos acelerados detectados',
        description: `Proyección: gastarás $${health.proyeccionFinMes.toFixed(0)} este mes (${((health.proyeccionFinMes / health.ingresosMes) * 100).toFixed(0)}% de ingresos)`,
        actionText: 'Revisaré mis gastos',
        points: 20
      });
    }
  }
  
  // Ordenar por prioridad
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ==========================================
// SISTEMA DE NOTIFICACIONES INTELIGENTES
// ==========================================

function triggerSmartNotifications(plan, health, showNotification) {
  if (!plan || !showNotification || !health) return;
  
  const today = new Date();
  const hour = today.getHours();
  const todayStr = today.toISOString().split('T')[0];
  const notifKey = `${todayStr}_${hour < 12 ? 'AM' : 'PM'}`;
  
  // Verificar si ya notificamos
  const sentNotifs = getStored(STORAGE_KEYS.NOTIFICATIONS_SENT, []);
  if (sentNotifs.includes(notifKey)) return;
  
  // Mañana (8-10am): Presupuesto del día
  if (hour >= 8 && hour < 10) {
    let title = '☀️ Buenos días';
    let body = `Tu presupuesto hoy: $${health.presupuestoDiario.toFixed(0)}`;
    
    if (health.esCrisis) {
      title = '🚨 ¡Alerta financiera!';
      body = 'Estás en números rojos. Evita gastos hoy.';
    } else if (health.esEmergencia) {
      title = '⚠️ Presupuesto muy bajo';
      body = `Solo tienes $${health.presupuestoDiario.toFixed(0)} disponibles hoy.`;
    }
    
    showNotification(title, { body });
    setStored(STORAGE_KEYS.NOTIFICATIONS_SENT, [...sentNotifs, notifKey]);
  }
  
  // Noche (7-9pm): Recordatorio
  if (hour >= 19 && hour < 21) {
    const body = health.gastosHoy > 0
      ? `Gastaste $${health.gastosHoy} hoy. ¿Fue necesario todo?`
      : '¡Excelente! No registraste gastos hoy.';
    
    showNotification('🌙 Resumen del día', { body });
    setStored(STORAGE_KEYS.NOTIFICATIONS_SENT, [...sentNotifs, notifKey]);
  }
  
  // Viernes tarde: Recordatorio de check-in
  if (today.getDay() === 5 && hour >= 17 && hour < 19) {
    showNotification('📋 Check-in semanal', { 
      body: '¿Cumpliste tus metas esta semana? Abre la app para reportar.' 
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS_SENT, [...sentNotifs, notifKey]);
  }
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

export function usePlanExecution(activePlan, realFinancialData, showLocalNotification) {
  // Estados persistentes
  const [completedTaskIds, setCompletedTaskIds] = useState(() => 
    getStored(STORAGE_KEYS.TASKS_COMPLETED, [])
  );
  const [lastCheckIn, setLastCheckIn] = useState(() => 
    getStored(STORAGE_KEYS.LAST_CHECKIN, null)
  );
  const [streakData, setStreakData] = useState(() => 
    getStored(STORAGE_KEYS.STREAK_DATA, { current: 0, longest: 0, lastActiveDate: null })
  );
  const [paymentsLogged, setPaymentsLogged] = useState(() => 
    getStored(STORAGE_KEYS.PAYMENTS_LOGGED, [])
  );
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split('T')[0];
  
  // ==========================================
  // ANÁLISIS FINANCIERO EN TIEMPO REAL
  // ==========================================
  
  const financialHealth = useMemo(() => {
    if (!realFinancialData || Object.keys(realFinancialData).length === 0) return null;
    return analyzeFinancialHealth(realFinancialData, today);
  }, [realFinancialData, today]);
  
  // ==========================================
  // TAREAS GENERADAS DINÁMICAMENTE
  // ==========================================
  
  const dailyTasks = useMemo(() => {
    if (!activePlan) return [];
    return generateSmartTasks(activePlan, financialHealth, completedTaskIds, today);
  }, [activePlan, financialHealth, completedTaskIds, today]);
  
  // ==========================================
  // PROGRESO DEL PLAN
  // ==========================================
  
  const progress = useMemo(() => {
    if (!activePlan?.configuracion) {
      return { percentage: 0, monthsCompleted: 0, amountPaid: 0, remaining: 0 };
    }
    
    const totalDebt = activePlan.monto_objetivo || 0;
    const monthlyPayment = activePlan.configuracion.monthlyPayment || 1;
    
    const amountPaid = paymentsLogged
      .filter(p => p.planId === activePlan.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const percentage = totalDebt > 0 ? Math.min(100, (amountPaid / totalDebt) * 100) : 0;
    const monthsCompleted = Math.floor(amountPaid / monthlyPayment);
    
    return {
      percentage: Math.round(percentage * 10) / 10,
      amountPaid,
      remaining: Math.max(0, totalDebt - amountPaid),
      monthsCompleted,
      totalMonths: activePlan.meses_duracion || 0
    };
  }, [activePlan, paymentsLogged]);
  
  // ==========================================
  // ESTADÍSTICAS
  // ==========================================
  
  const stats = useMemo(() => {
    const todayCompleted = completedTaskIds.filter(id => id.includes(todayStr)).length;
    const pendingTasks = dailyTasks.length;
    const totalToday = todayCompleted + pendingTasks;
    
    return {
      tasksCompletedToday: todayCompleted,
      tasksPending: pendingTasks,
      totalTasksToday: totalToday,
      completionRate: totalToday > 0 ? Math.round((todayCompleted / totalToday) * 100) : 0,
      streak: streakData.current || 0,
      longestStreak: streakData.longest || 0
    };
  }, [completedTaskIds, dailyTasks, streakData, todayStr]);
  
  // ==========================================
  // ACCIONES
  // ==========================================
  
  const completeTask = useCallback((taskId, points = 10) => {
    // Agregar a completados
    setCompletedTaskIds(prev => {
      const updated = [...prev, taskId];
      setStored(STORAGE_KEYS.TASKS_COMPLETED, updated);
      return updated;
    });
    
    // Actualizar racha
    const hadCompletedToday = completedTaskIds.some(id => id.includes(todayStr));
    if (!hadCompletedToday) {
      setStreakData(prev => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isContinuation = prev.lastActiveDate === yesterday;
        const newCurrent = isContinuation ? (prev.current || 0) + 1 : 1;
        
        const updated = {
          current: newCurrent,
          longest: Math.max(newCurrent, prev.longest || 0),
          lastActiveDate: todayStr
        };
        setStored(STORAGE_KEYS.STREAK_DATA, updated);
        return updated;
      });
    }
    
    // Notificación de celebración
    if (showLocalNotification && points >= 50) {
      showLocalNotification('🎉 ¡Excelente!', { 
        body: `+${points} puntos. Racha: ${streakData.current + 1} días` 
      });
    }
    
    return { success: true, points };
  }, [completedTaskIds, todayStr, streakData, showLocalNotification]);
  
  const logPayment = useCallback((amount, debtName) => {
    if (!activePlan) return null;
    
    const payment = {
      id: `pay_${Date.now()}`,
      planId: activePlan.id,
      amount: Number(amount),
      debtName,
      date: new Date().toISOString()
    };
    
    setPaymentsLogged(prev => {
      const updated = [...prev, payment];
      setStored(STORAGE_KEYS.PAYMENTS_LOGGED, updated);
      return updated;
    });
    
    if (showLocalNotification) {
      showLocalNotification('💳 Pago registrado', { 
        body: `$${amount.toLocaleString()} a ${debtName}. ¡Sigue así!` 
      });
    }
    
    return payment;
  }, [activePlan, showLocalNotification]);
  
  const performCheckIn = useCallback((data) => {
    const checkIn = {
      date: new Date().toISOString(),
      weekNumber: Math.ceil((today.getDate()) / 7),
      ...data
    };
    
    setLastCheckIn(checkIn);
    setStored(STORAGE_KEYS.LAST_CHECKIN, checkIn);
    setShowCheckInModal(false);
    
    // Completar tarea de check-in
    completeTask(`checkin_${todayStr}`, 50);
    
    return checkIn;
  }, [completeTask, todayStr, today]);
  
  // ==========================================
  // ¿NECESITA CHECK-IN?
  // ==========================================
  
  const needsCheckIn = useMemo(() => {
    if (!lastCheckIn) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastCheckIn.date).getTime()) / 86400000);
    return daysSince >= 7;
  }, [lastCheckIn]);
  
  // ==========================================
  // EFECTO: NOTIFICACIONES AUTOMÁTICAS
  // ==========================================
  
  useEffect(() => {
    if (!activePlan || !showLocalNotification || !financialHealth) return;
    triggerSmartNotifications(activePlan, financialHealth, showLocalNotification);
  }, [activePlan, financialHealth, showLocalNotification]);
  
  // ==========================================
  // EFECTO: LIMPIAR TAREAS ANTIGUAS (30 días)
  // ==========================================
  
  useEffect(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    
    setCompletedTaskIds(prev => {
      const filtered = prev.filter(id => {
        const match = id.match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] >= thirtyDaysAgo : true;
      });
      
      if (filtered.length !== prev.length) {
        setStored(STORAGE_KEYS.TASKS_COMPLETED, filtered);
      }
      return filtered;
    });
  }, []);
  
  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    // Análisis en tiempo real
    financialHealth,
    
    // Tareas
    dailyTasks,
    
    // Progreso
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