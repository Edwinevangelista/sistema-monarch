// src/hooks/usePlanExecution.js
// ============================================
// VERSIÓN HÍBRIDA FINAL CON INTEGRACIÓN IA
// + SYNC EN TIEMPO REAL DE DEUDAS
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';

// ==========================================
// CONSTANTES Y STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
  TASKS_COMPLETED: 'finguide_plan_tasks_completed',
  LAST_CHECKIN: 'finguide_plan_last_checkin',
  STREAK_DATA: 'finguide_plan_streak',
  PAYMENTS_LOGGED: 'finguide_plan_payments_logged',
  NOTIFICATIONS_SENT: 'finguide_smart_notifications_sent'
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

  //1. Ingresos del mes actual
  const ingresosMes = ingresos
    .filter(i => i && i.fecha && new Date(i.fecha).getMonth() === today.getMonth())
    .reduce((sum, i) => sum + (i.monto || 0), 0);

  //2. Gastos Variables del mes actual
  const gastosVariablesMes = gastos
    .filter(g => g && g.fecha && new Date(g.fecha).getMonth() === today.getMonth())
    .reduce((sum, g) => sum + (g.monto || 0), 0);

  //3. Gastos Fijos Totales (Compromisos)
  const compromisosFijos = gastosFijos.reduce((sum, gf) => sum + (gf.monto || 0), 0);
  
  //4. Pagos Mínimos de Deuda (Obligaciones)
  const pagosDeuda = deudas.reduce((sum, d) => sum + (d.pago_minimo || 0), 0);

  //5. Gasto de HOY (Usamos 'today' recibido por parámetro)
  const hoyStr = today.toISOString().split('T')[0];
  const gastoHoy = gastos
    .filter(g => g && g.fecha === hoyStr)
    .reduce((sum, g) => sum + (g.monto || 0), 0);

  //6. Cálculo del Margen Disponible
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
  
  // ✅ Definimos 'today' localmente aquí
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  
  const config = activePlan.configuracion || {};
  const health = calculateRealFinancialHealth(realData, today); // Pasamos 'today' explícito
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
// GENERADOR DE NOTIFICACIONES INTELIGENTES (IA)
// ==========================================

function getSmartNotifications(plan, financialHealth, showLocalNotification, getStoredData, setStoredData) {
  if (!plan || !showLocalNotification) return [];
  
  const notifications = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const hour = today.getHours();
  const isMorning = hour >= 8 && hour < 11;
  const isEvening = hour >= 18 && hour < 21;
  
  // Verificar si ya enviamos notificaciones hoy (Spam Guard)
  const notifId = `${todayStr}_${hour < 12 ? 'AM' : 'PM'}`;
  const alreadySentNotifs = getStoredData(STORAGE_KEYS.NOTIFICATIONS_SENT, []);
  
  if (alreadySentNotifs.includes(notifId)) return []; // Ya notificamos este periodo

  // ==========================================
  // 1. NOTIFICACIÓN MAÑANA: Presupuesto del Día
  // ==========================================
  if (isMorning && financialHealth) {
    let title = "☀️ Buenos días, FinGuider";
    let body = "Tu presupuesto diario está listo.";
    let urgent = false;

    // Lógica IA Basada en Salud Financiera Real
    if (financialHealth.esCrisis) {
      title = "🚨 ¡ALERTA FINANCIERA!";
      body = "Estás en números rojos hoy. Gasto objetivo: $0. Prioriza emergencias.";
      urgent = true;
    } else if (financialHealth.presupuestoDiario < 10) {
      title = "⚠️ Presupuesto Crítico";
      body = `Solo te quedan $${financialHealth.presupuestoDiario.toFixed(0)} hoy. Evita gastos hormiga.`;
    } else {
      body = `Tu límite hoy es $${financialHealth.presupuestoDiario.toFixed(0)}. ¡Vamos por más!`;
    }

    notifications.push({
      title,
      body,
      urgent,
      type: 'daily_budget'
    });
  }

  // ==========================================
  // 2. NOTIFICACIÓN TARDE: Recordatorio de Disciplina
  // ==========================================
  if (isEvening) {
    notifications.push({
      title: "🌙 Buenas noches",
      body: "¿Usaste tus tarjetas hoy? Revisa tu progreso antes de dormir.",
      type: 'daily_review'
    });
  }

  // ==========================================
  // 3. NOTIFICACIÓN SEMANAL: Check-in (Viernes Mañana)
  // ==========================================
  if (today.getDay() === 5 && isMorning) {
    notifications.push({
      title: "Viernes de revision",
      body: "Cumpliste tus metas esta semana? Abre la app para ver tu progreso.",
      type: 'checkin'
    });
  }

  // ==========================================
  // 4. TIP DEL DIA: Primera apertura del dia
  // Se dispara la primera vez del dia, a cualquier hora.
  // Rota entre 7 tips motivacionales con dato concreto del plan.
  // ==========================================
  const tipDiaId = `tip_dia_${todayStr}`;
  const tipYaEnviado = alreadySentNotifs.includes(tipDiaId);

  if (!tipYaEnviado && plan) {
    const config = plan.configuracion || {};
    const orderedDebts = config?.plan?.orderedDebts || [];
    const targetDebt = orderedDebts[0];
    const totalOriginal = orderedDebts.reduce((s, d) => s + Number(d.balance || d.saldo || 0), 0);
    const montoPago = config?.monthlyPayment || 0;
    const estrategia = config?.strategy === 'avalancha' ? 'Avalancha' : 'Bola de Nieve';

    // Dia de la semana para rotar tip (0=Dom … 6=Sab)
    const diaSemana = today.getDay();

    const tips = [
      // 0 Domingo: motivacion
      {
        title: "Tip del dia: Mantente enfocado",
        body: `Estrategia ${estrategia}: pagar las deudas correctas primero te ahorra mas dinero a largo plazo.`
      },
      // 1 Lunes: accion concreta
      {
        title: "Inicio de semana: revisa tu plan",
        body: targetDebt
          ? `Esta semana: enfoca en ${targetDebt.nombre || 'tu deuda principal'}. Cada pago cuenta.`
          : `Revisa tus deudas hoy y programa un pago si puedes.`
      },
      // 2 Martes: dato del progreso
      {
        title: "Tu progreso importa",
        body: montoPago > 0
          ? `Si pagaste ${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(montoPago)} este mes, vas por buen camino. No pares.`
          : `Cada peso extra que pagues reduce los intereses que debes.`
      },
      // 3 Miercoles: consejo de ahorro
      {
        title: "Reduce un gasto esta semana",
        body: "Identifica un gasto no esencial esta semana y destina ese dinero a tus deudas."
      },
      // 4 Jueves: recordatorio de pago
      {
        title: "Jueves: revisa tus fechas de corte",
        body: "Verifica que no tengas tarjetas con corte proximo. Un pago a tiempo evita intereses."
      },
      // 5 Viernes: balance semanal
      {
        title: "Fin de semana: evalua tu semana",
        body: totalOriginal > 0
          ? `Tu meta total del plan: ${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(totalOriginal)}. Cada pago te acerca mas.`
          : `Revisa tu progreso en el plan y celebra cada avance.`
      },
      // 6 Sabado: habito de revision
      {
        title: "Sabado financiero",
        body: "Es buen momento para revisar tus gastos de la semana y planificar la siguiente."
      },
    ];

    const tipHoy = tips[diaSemana] || tips[0];

    notifications.push({
      ...tipHoy,
      type: 'tip_dia'
    });

    // Marcar el tip del dia como enviado (separado del guard AM/PM)
    setStoredData(STORAGE_KEYS.NOTIFICATIONS_SENT, [...alreadySentNotifs, tipDiaId]);
  }

  // Ejecutar inmediatamente si hay notificaciones
  if (notifications.length > 0) {
    notifications.forEach(notif => {
      showLocalNotification(notif.title, { body: notif.body, tag: notif.type });
    });

    // Marcar periodo AM/PM como enviado
    if (!alreadySentNotifs.includes(notifId)) {
      setStoredData(STORAGE_KEYS.NOTIFICATIONS_SENT, [...alreadySentNotifs, notifId]);
    }
  }

  return notifications;
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

  // ✅ NUEVO: Lista de Deudas en Tiempo Real (Sync con Supabase)
  const realTimeDebts = useMemo(() => {
    if (!activePlan?.configuracion?.plan?.orderedDebts) return [];
    
    const orderedDebts = activePlan.configuracion.plan.orderedDebts;
    
    return orderedDebts.map(debtPlan => {
      // Buscar la deuda real actualizada en realFinancialData
      const deudaReal = realFinancialData?.deudas?.find(d => 
        d.id === debtPlan.id || d.cuenta === debtPlan.nombre
      );
      
      // Obtener el saldo ACTUAL (si existe) o usar el plan (fallback)
      const saldoActual = deudaReal ? Number(deudaReal.saldo || 0) : Number(debtPlan.balance || debtPlan.saldo || 0);
      
      // Obtener el saldo ORIGINAL (cuando se creó el plan)
      const saldoOriginal = Number(debtPlan.balance || debtPlan.saldo || 0);
      
      // Calcular progreso individual
      const pagadoIndividual = Math.max(0, saldoOriginal - saldoActual);
      const progresoIndividual = saldoOriginal > 0 ? (pagadoIndividual / saldoOriginal) * 100 : 0;
      
      return {
        id: debtPlan.id,
        nombre: debtPlan.nombre,
        cuenta: debtPlan.nombre, // Alias para compatibilidad
        saldoOriginal,
        saldoActual,
        pagadoIndividual,
        progresoIndividual,
        estaPagado: saldoActual <= 0,
        diferencia: saldoOriginal - saldoActual
      };
    });
  }, [activePlan, realFinancialData]);

  // Tareas Híbridas
  const dailyTasks = useMemo(() => {
    if (!activePlan) return [];
    return generateHybridTasks(activePlan, realFinancialData, completedTaskIds);
  }, [activePlan, realFinancialData, completedTaskIds]);

  // ✅ MEJORADO: Progreso del Plan (Usando realTimeDebts para mayor precisión)
  const progress = useMemo(() => {
    if (realTimeDebts.length === 0) {
      return { 
        percentage: 0, 
        amountPaid: 0, 
        remaining: 0,
        monthsCompleted: 0 
      };
    }
    
    // Calculamos totales basados en las deudas sincronizadas
    const totalDebtOriginal = realTimeDebts.reduce((sum, d) => sum + d.saldoOriginal, 0);
    const totalDebtCurrent = realTimeDebts.reduce((sum, d) => sum + d.saldoActual, 0);
    
    // Cálculo robusto de pago
    const amountPaid = Math.max(0, totalDebtOriginal - totalDebtCurrent);
    
    // Calcular porcentaje
    const percentage = totalDebtOriginal > 0 
      ? Math.min(100, (amountPaid / totalDebtOriginal) * 100) 
      : 0;
    
    // Calcular meses completados
    const monthlyPayment = activePlan.configuracion.monthlyPayment || 1;
    const monthsCompleted = Math.floor(amountPaid / monthlyPayment);
    
    console.log(`📊 Plan Progress Update: Paid $${amountPaid.toFixed(2)} / $${totalDebtOriginal.toFixed(2)} (${percentage.toFixed(1)}%)`);
    
    return {
      percentage: Math.round(percentage * 10) / 10,
      amountPaid,
      remaining: Math.max(0, totalDebtCurrent),
      monthsCompleted
    };
  }, [activePlan, realTimeDebts]);

  // Estadísticas
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCompletedCount = completedTaskIds.filter(id => id.includes(todayStr)).length;
    const totalTasksToday = dailyTasks.length + todayCompletedCount;
    
    return {
      tasksCompletedToday: todayCompletedCount,
      totalTasksToday,
      streak: streakData.current || 0,
      financialHealth: financialHealth, // Exportar salud al widget
      realTimeDebts // ✅ NUEVO: Exportar lista sincronizada
    };
  }, [completedTaskIds, dailyTasks, streakData, financialHealth, realTimeDebts]);

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

  // ==========================================
  // EFECTO: PROGRAMADOR INTELIGENTE
  // ==========================================
  useEffect(() => {
    if (!activePlan || !showLocalNotification) return;
    
    // Ejecutar el cerebro de notificaciones
    getSmartNotifications(
      activePlan, 
      financialHealth, 
      showLocalNotification, 
      getStoredData, 
      setStoredData
    );
  }, [activePlan, financialHealth, showLocalNotification]);

  // ==========================================
  // RETURN
  // ==========================================
  
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