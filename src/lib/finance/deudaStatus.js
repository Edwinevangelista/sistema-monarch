// src/lib/finance/deudaStatus.js

export const DEUDA_STATUS = {
  SIN_SALDO: 'SIN_SALDO',
  PAGADA_MES: 'PAGADA_MES',
  VENCIDA: 'VENCIDA',
  PENDIENTE: 'PENDIENTE',
}

export function getDeudaStatus(deuda, pagos = []) {
  if (!deuda) return null

  const saldo = Number(deuda.saldo ?? deuda.balance ?? 0)

  // 1️⃣ SIN SALDO (regla absoluta)
  if (saldo <= 0) {
    return DEUDA_STATUS.SIN_SALDO
  }

  const hoy = new Date()

  // 2️⃣ ¿Pagada este mes?
  const pagadaEsteMes = pagos.some(p => {
    if (p.deuda_id !== deuda.id) return false
    const f = new Date(p.fecha)
    return (
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    )
  })

  // 3️⃣ Deuda SIN fecha de vencimiento (revolving)
  if (!deuda.vence) {
    return pagadaEsteMes
      ? DEUDA_STATUS.PAGADA_MES
      : DEUDA_STATUS.PENDIENTE
  }

  // 4️⃣ Deuda CON fecha vencida
  const vence = new Date(deuda.vence)
  if (vence < hoy) {
    return pagadaEsteMes
      ? DEUDA_STATUS.PAGADA_MES
      : DEUDA_STATUS.VENCIDA
  }

  // 5️⃣ Deuda normal pendiente
  return DEUDA_STATUS.PENDIENTE
}
