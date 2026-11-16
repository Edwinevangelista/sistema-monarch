// src/utils/buildAlertas.js — Fase 1
// Único constructor de alertas de pagos. Lo consumen el dashboard
// (alertas en la app), ModalAlertas / Notificaciones y el chequeo en
// primer plano de subscribeToPushFCM. Reglas unificadas (las que ya
// existían en cada sitio, no inventadas):
// - gasto fijo: excluye Pagado o sin dia_venc; monto = monto
// - suscripción: excluye Cancelado o sin proximo_pago; monto = costo
// - deuda/tarjeta: excluye sin vence o con saldo <= 0; monto = pago_minimo
//   (nunca el saldo total)
// - ventana: dias <= leadDias (aviso_dias del ítem, o 5 días por defecto
//   en la app); los vencidos (dias < 0) siempre aparecen
// - fechas en America/New_York (ver fechasNY.js)
// tipoItem usa los mismos valores que ITEM_TYPES ('fijo', 'suscripciones',
// 'deuda') para que handlePagarUniversal los entienda sin traducir.

import { diffDiasNY, proximaFechaDiaMes } from './fechasNY'

const LEAD_DEFAULT_APP = 5

function mensajeVence(icono, nombre, dias, verboHoy, verboFuturo) {
  const abs = Math.abs(dias)
  const plural = abs !== 1 ? 's' : ''
  if (dias < 0) return `${icono} ${nombre} venció hace ${abs} día${plural}.`
  if (dias === 0) return `${icono} ${nombre} ${verboHoy}.`
  return `${icono} ${nombre} ${verboFuturo} en ${dias} día${plural}.`
}

export function buildAlertas({ gastosFijos = [], suscripciones = [], deudas = [], hoy = new Date(), leadDefault = LEAD_DEFAULT_APP } = {}) {
  const lista = []

  // 1. Gastos fijos — vencen cada mes en su dia_venc
  ;(gastosFijos || []).forEach((gf) => {
    if (gf.estado === 'Pagado' || !gf.dia_venc) return
    const venceFecha = proximaFechaDiaMes(gf.dia_venc, hoy)
    const dias = diffDiasNY(venceFecha, hoy)
    if (dias == null) return
    const leadDias = Number(gf.aviso_dias ?? leadDefault)
    if (dias > leadDias) return
    lista.push({
      id: `fijo:${gf.id}`,
      tipo: dias <= 0 ? 'critical' : 'warning',
      mensaje: mensajeVence('⚠️', gf.nombre, dias, 'vence hoy', 'vence'),
      mensajeCorto: `${gf.nombre}`,
      monto: gf.monto,
      tipoItem: 'fijo',
      item: gf,
      dias,
      venceFecha,
      leadDias,
      vencido: dias < 0,
    })
  })

  // 2. Suscripciones
  ;(suscripciones || []).forEach((sub) => {
    if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
    const dias = diffDiasNY(sub.proximo_pago, hoy)
    if (dias == null) return
    const leadDias = Number(sub.aviso_dias ?? leadDefault)
    if (dias > leadDias) return
    lista.push({
      id: `suscripcion:${sub.id}`,
      tipo: dias <= 0 ? 'critical' : 'info',
      mensaje: mensajeVence('🔄', sub.servicio, dias, 'se renueva hoy', 'se renovará'),
      mensajeCorto: `${sub.servicio}`,
      monto: sub.costo,
      tipoItem: 'suscripciones',
      item: sub,
      dias,
      venceFecha: String(sub.proximo_pago).slice(0, 10),
      leadDias,
      vencido: dias < 0,
    })
  })

  // 3. Deudas / tarjetas — monto = pago_minimo, nunca el saldo
  ;(deudas || []).forEach((d) => {
    if (!d.vence || Number(d.saldo || 0) <= 0) return
    const dias = diffDiasNY(d.vence, hoy)
    if (dias == null) return
    const leadDias = Number(d.aviso_dias ?? leadDefault)
    if (dias > leadDias) return
    lista.push({
      id: `deuda:${d.id}`,
      tipo: dias <= 0 ? 'critical' : 'warning',
      mensaje: mensajeVence('💳', `Pago de ${d.cuenta}`, dias, 'vence hoy', 'vence'),
      mensajeCorto: `${d.cuenta}`,
      monto: d.pago_minimo,
      tipoItem: 'deuda',
      item: d,
      dias,
      venceFecha: String(d.vence).slice(0, 10),
      leadDias,
      vencido: dias < 0,
    })
  })

  return lista.sort((a, b) => a.dias - b.dias)
}

export default buildAlertas
