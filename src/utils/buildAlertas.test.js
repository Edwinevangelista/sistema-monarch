// Tests Fase 1: constructor único de alertas (ver src/utils/buildAlertas.js)
import { buildAlertas } from './buildAlertas'

// 16 nov 2026, mediodía local → hoy NY = 2026-11-16
const HOY = new Date('2026-11-16T12:00:00')

describe('buildAlertas — deudas', () => {
  test('deuda que vence hoy genera alerta con el pago mínimo, no el saldo', () => {
    const alertas = buildAlertas({
      deudas: [{ id: 'd1', cuenta: 'Chase', saldo: 9000, pago_minimo: 43, vence: '2026-11-16', estado: 'Activa' }],
      hoy: HOY,
    })
    expect(alertas).toHaveLength(1)
    expect(alertas[0].monto).toBe(43)
    expect(alertas[0].dias).toBe(0)
    expect(alertas[0].tipoItem).toBe('deuda')
    expect(alertas[0].tipo).toBe('critical')
  })

  test('deuda saldada (saldo 0) no genera alerta', () => {
    const alertas = buildAlertas({
      deudas: [{ id: 'd1', cuenta: 'Chase', saldo: 0, pago_minimo: 43, vence: '2026-11-16', estado: 'Activa' }],
      hoy: HOY,
    })
    expect(alertas).toHaveLength(0)
  })

  test('deuda sin vence no genera alerta', () => {
    const alertas = buildAlertas({
      deudas: [{ id: 'd1', cuenta: 'Chase', saldo: 9000, pago_minimo: 43, vence: null, estado: 'Activa' }],
      hoy: HOY,
    })
    expect(alertas).toHaveLength(0)
  })

  test('lead-time por ítem: aviso_dias 1 no avisa a 5 días, aviso_dias 5 sí', () => {
    const deuda = { id: 'd1', cuenta: 'Chase', saldo: 9000, pago_minimo: 43, vence: '2026-11-21', estado: 'Activa' }
    expect(buildAlertas({ deudas: [{ ...deuda, aviso_dias: 1 }], hoy: HOY })).toHaveLength(0)
    expect(buildAlertas({ deudas: [{ ...deuda, aviso_dias: 5 }], hoy: HOY })).toHaveLength(1)
    // Sin aviso_dias, el default en app es 5
    expect(buildAlertas({ deudas: [deuda], hoy: HOY })).toHaveLength(1)
  })
})

describe('buildAlertas — gastos fijos y suscripciones', () => {
  test('gasto fijo Pagado no genera alerta; pendiente sí, por dia_venc', () => {
    const fijo = { id: 'f1', nombre: 'Internet', monto: 60, dia_venc: 17, estado: 'Pendiente' }
    const alertas = buildAlertas({ gastosFijos: [fijo], hoy: HOY })
    expect(alertas).toHaveLength(1)
    expect(alertas[0].dias).toBe(1)
    expect(alertas[0].venceFecha).toBe('2026-11-17')
    expect(buildAlertas({ gastosFijos: [{ ...fijo, estado: 'Pagado' }], hoy: HOY })).toHaveLength(0)
  })

  test('gasto fijo con dia_venc ya pasado avisa para el mes siguiente', () => {
    const alertas = buildAlertas({
      gastosFijos: [{ id: 'f1', nombre: 'Luz', monto: 80, dia_venc: 5, estado: 'Pendiente' }],
      hoy: HOY,
    })
    expect(alertas).toHaveLength(0) // vence 5 dic, fuera de la ventana de 5 días
  })

  test('suscripción Cancelada no genera alerta; Activa sí', () => {
    const sub = { id: 's1', servicio: 'Netflix', costo: 15.49, proximo_pago: '2026-11-18', estado: 'Activo' }
    const alertas = buildAlertas({ suscripciones: [sub], hoy: HOY })
    expect(alertas).toHaveLength(1)
    expect(alertas[0].dias).toBe(2)
    expect(buildAlertas({ suscripciones: [{ ...sub, estado: 'Cancelado' }], hoy: HOY })).toHaveLength(0)
  })

  test('las alertas salen ordenadas por días (vencidas primero)', () => {
    const alertas = buildAlertas({
      gastosFijos: [{ id: 'f1', nombre: 'A', monto: 10, dia_venc: 20, estado: 'Pendiente' }],
      suscripciones: [{ id: 's1', servicio: 'B', costo: 10, proximo_pago: '2026-11-15', estado: 'Activo' }],
      deudas: [{ id: 'd1', cuenta: 'C', saldo: 100, pago_minimo: 25, vence: '2026-11-16', estado: 'Activa' }],
      hoy: HOY,
    })
    expect(alertas.map(a => a.dias)).toEqual([-1, 0, 4])
  })
})
