// src/lib/alerts/evaluateAlerts.js
// ============================================
// MOTOR CENTRAL DE ALERTAS FINANCIERAS
// Función PURA — sin React, sin efectos
// ============================================

import { ITEM_TYPES } from '../../constants/itemTypes'

const MS_DIA = 1000 * 60 * 60 * 24

const diffDias = (fecha, hoy) =>
  Math.ceil((new Date(fecha) - hoy) / MS_DIA)

export function evaluateAlerts({
  hoy,
  gastosFijos = [],
  suscripciones = [],
  deudas = [],
  financialHealth = null,
  dailyBudget = null
}) {
  const alertas = []

  // ============================================
  // 1️⃣ GASTOS FIJOS
  // ============================================
  gastosFijos.forEach(gf => {
    if (gf.estado === 'Pagado' || !gf.dia_venc) return

    const fechaVenc = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      gf.dia_venc
    )

    const dias = diffDias(fechaVenc, hoy)
    if (dias > 5) return

    const vencido = dias < 0

    alertas.push({
      type: 'FIXED_EXPENSE_DUE',
      severity: vencido ? 'critical' : 'warning',
      title: vencido ? '⚠️ Gasto fijo vencido' : '⏰ Gasto fijo próximo',
      body: vencido
        ? `${gf.nombre} venció hace ${Math.abs(dias)} día(s)`
        : dias === 0
        ? `${gf.nombre} vence hoy`
        : `${gf.nombre} vence en ${dias} día(s)`,
      entityType: ITEM_TYPES.FIJO,
      entityId: gf.id,
      monto: gf.monto,
      dias,
      channel: ['local', 'push'],
      dedupeKey: `fijo_${gf.id}_${fechaVenc.toDateString()}`
    })
  })

  // ============================================
  // 2️⃣ SUSCRIPCIONES
  // ============================================
  suscripciones.forEach(sub => {
    if (sub.estado === 'Cancelado' || !sub.proximo_pago) return

    const dias = diffDias(sub.proximo_pago, hoy)
    if (dias > 5) return

    const vencido = dias < 0

    alertas.push({
      type: 'SUBSCRIPTION_RENEWAL',
      severity: vencido ? 'critical' : 'info',
      title: vencido ? '🔄 Suscripción vencida' : '🔄 Renovación próxima',
      body: vencido
        ? `${sub.servicio} venció hace ${Math.abs(dias)} día(s)`
        : dias === 0
        ? `${sub.servicio} se renueva hoy`
        : `${sub.servicio} se renueva en ${dias} día(s)`,
      entityType: ITEM_TYPES.SUSCRIPCION,
      entityId: sub.id,
      monto: sub.costo,
      dias,
      channel: ['local', 'push'],
      dedupeKey: `sub_${sub.id}_${sub.proximo_pago}`
    })
  })

  // ============================================
  // 3️⃣ DEUDAS / TARJETAS
  // ============================================
  deudas.forEach(d => {
    if (!d.vence) return

    const dias = diffDias(d.vence, hoy)
    if (dias > 5) return

    const vencido = dias < 0

    alertas.push({
      type: 'DEBT_PAYMENT_DUE',
      severity: vencido ? 'critical' : 'warning',
      title: vencido ? '💳 Pago vencido' : '💳 Pago próximo',
      body: vencido
        ? `Pago de ${d.cuenta} venció hace ${Math.abs(dias)} día(s)`
        : dias === 0
        ? `Pago de ${d.cuenta} vence hoy`
        : `Pago de ${d.cuenta} vence en ${dias} día(s)`,
      entityType: ITEM_TYPES.DEUDA,
      entityId: d.id,
      monto: d.pago_minimo,
      dias,
      channel: ['local', 'push'],
      dedupeKey: `deuda_${d.id}_${d.vence}`
    })
  })

  // ============================================
  // 4️⃣ SALDO DIARIO CRÍTICO
  // ============================================
  if (dailyBudget !== null && dailyBudget <= 0) {
    alertas.push({
      type: 'DAILY_BUDGET_ZERO',
      severity: 'critical',
      title: '🚨 Presupuesto agotado',
      body: 'Tu presupuesto diario es $0 o negativo',
      entityType: 'SYSTEM',
      entityId: 'daily-budget',
      channel: ['local', 'push'],
      dedupeKey: `daily_budget_${hoy.toDateString()}`
    })
  }

  // ============================================
  // 5️⃣ SCORE FINANCIERO BAJO
  // ============================================
  if (financialHealth !== null && financialHealth < 40) {
    alertas.push({
      type: 'FINANCIAL_HEALTH_LOW',
      severity: 'warning',
      title: '📉 Salud financiera baja',
      body: `Tu score financiero es ${financialHealth}/100`,
      entityType: 'SYSTEM',
      entityId: 'health-score',
      channel: ['local'],
      dedupeKey: `health_${hoy.toDateString()}`
    })
  }

  // ============================================
  // 🔢 ORDEN FINAL
  // ============================================
  return alertas.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1
    if (a.severity !== 'critical' && b.severity === 'critical') return 1
    return a.dias - b.dias
  })
}
