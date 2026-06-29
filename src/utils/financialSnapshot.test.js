import { crearResumenFinanciero } from './financialSnapshot'

describe('crearResumenFinanciero', () => {
  it('trata cuentas como activo y tarjetas/deudas como pasivo', () => {
    const resumen = crearResumenFinanciero({
      cuentas: [{ balance: 1000 }],
      deudas: [{ saldo: 300, pago_minimo: 25, vence: '2026-06-20' }],
      referenceDate: new Date(2026, 5, 10),
    })

    expect(resumen.activos).toBe(1000)
    expect(resumen.pasivos).toBe(300)
    expect(resumen.patrimonioNeto).toBe(700)
  })

  it('calcula dinero libre despues de pagos pendientes del mes', () => {
    const resumen = crearResumenFinanciero({
      cuentas: [{ balance: 1500 }],
      gastosFijos: [{ nombre: 'Renta', monto: 900, dia_venc: 15, estado: 'Pendiente' }],
      suscripciones: [{ servicio: 'Musica', costo: 20, proximo_pago: '2026-06-18', estado: 'Activo' }],
      deudas: [{ cuenta: 'Visa', saldo: 300, pago_minimo: 50, vence: '2026-06-20' }],
      referenceDate: new Date(2026, 5, 10),
    })

    expect(resumen.compromisosPendientes).toBe(970)
    expect(resumen.cashAfterCommitments).toBe(530)
    expect(resumen.dailySafeSpend).toBeCloseTo(25.24, 2)
  })

  it('prioriza deuda cuando el DTI mensual es alto', () => {
    const resumen = crearResumenFinanciero({
      cuentas: [{ balance: 5000 }],
      deudas: [{ cuenta: 'Tarjeta', saldo: 3000, pago_minimo: 600, vence: '2026-06-25' }],
      totalIngresos: 1500,
      dti: 40,
      referenceDate: new Date(2026, 5, 10),
    })

    expect(resumen.action.title).toBe('Baja presión de deuda')
    expect(resumen.action.cta).toBe('Ver deudas')
  })
})
