import {
  calcularBalanceInteligente,
  calcularNetWorth,
  calcularDTI,
  calcularRegla503020,
  calcularFinancialHealthScore,
  calcularDailyBudget,
} from './financialCalculations'

describe('calcularBalanceInteligente', () => {
  test('calcula totales auditables y tasa de ahorro decimal', () => {
    const resultado = calcularBalanceInteligente(
      [{ monto: 3000, fecha: '2026-06-01', frecuencia: 'Único' }],
      [{ monto: 300, fecha: '2026-06-10' }],
      [
        { monto: 1000, dia_venc: 1, estado: 'Pagado' },
        { monto: 500, dia_venc: 20, estado: 'Pendiente' },
      ],
      [{ costo: 120, ciclo: 'Mensual', estado: 'Activo', proximo_pago: '2026-06-15' }],
      new Date(2026, 5, 15)
    )

    expect(resultado.real.totalIngresos).toBe(3000)
    expect(resultado.real.gastosVariables).toBe(300)
    expect(resultado.real.gastosFijos).toBe(1000)
    expect(resultado.real.suscripciones).toBe(120)
    expect(resultado.real.totalGastos).toBe(1420)
    expect(resultado.real.saldo).toBe(1580)
    expect(resultado.real.tasaAhorro).toBeCloseTo(0.5267, 4)
  })

  test('incluye el dia actual al proyectar promedio diario', () => {
    const resultado = calcularBalanceInteligente(
      [{ monto: 3000, fecha: '2026-06-01' }],
      [{ monto: 150, fecha: '2026-06-15' }],
      [],
      [],
      new Date(2026, 5, 15)
    )

    expect(resultado.proyectado.desglose.promedioDiario).toBe(10)
    expect(resultado.proyectado.gastosVariables).toBe(300)
  })

  test('no adelanta gastos fijos futuros en el balance real', () => {
    const resultado = calcularBalanceInteligente(
      [{ monto: 2000, fecha: '2026-06-01' }],
      [],
      [{ monto: 700, dia_venc: 28, estado: 'Pendiente' }],
      [],
      new Date(2026, 5, 15)
    )

    expect(resultado.real.gastosFijos).toBe(0)
    expect(resultado.real.totalGastos).toBe(0)
    expect(resultado.real.saldo).toBe(2000)
    expect(resultado.proyectado.gastosFijos).toBe(700)
  })

  test('ajusta vencimientos imposibles al ultimo dia real del mes', () => {
    const resultado = calcularBalanceInteligente(
      [{ monto: 2000, fecha: '2026-02-01' }],
      [],
      [{ monto: 300, dia_venc: 31, estado: 'Pagado' }],
      [],
      new Date(2026, 1, 28)
    )

    expect(resultado.real.gastosFijos).toBe(300)
    expect(resultado.real.totalGastos).toBe(300)
  })

  test('mantiene continuidad cuando una suscripcion ya paso al mes siguiente', () => {
    const resultado = calcularBalanceInteligente(
      [{ monto: 1000, fecha: '2026-06-01' }],
      [],
      [],
      [{ costo: 50, ciclo: 'Mensual', estado: 'Activo', proximo_pago: '2026-07-05' }],
      new Date(2026, 5, 20)
    )

    expect(resultado.real.suscripciones).toBe(50)
    expect(resultado.real.totalGastos).toBe(50)
    expect(resultado.real.gastosPagados).toBe(50)
  })
})

describe('calcularNetWorth', () => {
  test('resta deudas a activos en cuentas', () => {
    const cuentas = [{ balance: 1000 }, { balance: 500 }]
    const deudas = [{ saldo: 300 }, { saldo: 200 }]
    expect(calcularNetWorth(cuentas, deudas)).toBe(1000)
  })

  test('maneja arrays vacios', () => {
    expect(calcularNetWorth([], [])).toBe(0)
  })
})

describe('calcularDTI', () => {
  test('calcula porcentaje de pagos minimos sobre ingreso', () => {
    const deudas = [{ pago_minimo: 200 }, { pago_minimo: 100 }]
    expect(calcularDTI(deudas, 1000)).toBe(30)
  })

  test('retorna 0 sin ingresos', () => {
    expect(calcularDTI([{ pago_minimo: 200 }], 0)).toBe(0)
  })
})

describe('calcularRegla503020', () => {
  test('reparte necesidades, deseos y ahorro segun ingreso', () => {
    const resultado = calcularRegla503020({
      totalIngresos: 1000,
      totalGastosFijos: 300,
      totalGastosVariables: 200,
      totalSuscripciones: 50,
      deudas: [{ pago_minimo: 100 }],
    })
    expect(resultado.necesidades).toBe(40) // (300+100)/1000
    expect(resultado.deseos).toBe(25) // (200+50)/1000
    expect(resultado.ahorro).toBe(35)
  })

  test('reduce deseos cuando el gasto supera el 100% del ingreso', () => {
    const resultado = calcularRegla503020({
      totalIngresos: 1000,
      totalGastosFijos: 800,
      totalGastosVariables: 400,
      totalSuscripciones: 0,
      deudas: [],
    })
    expect(resultado.necesidades).toBe(80)
    expect(resultado.deseos).toBe(20)
  })

  test('topa necesidades en 100% cuando solas ya superan el ingreso', () => {
    // Usuario en crisis: gastos fijos + deuda mínima ya exceden el ingreso total.
    // Antes de este fix, necesidades podía reportar >100% (ej. 141%) y romper la barra visual.
    const resultado = calcularRegla503020({
      totalIngresos: 800,
      totalGastosFijos: 600,
      totalGastosVariables: 950,
      totalSuscripciones: 0,
      deudas: [{ pago_minimo: 350 }, { pago_minimo: 180 }],
    })
    expect(resultado.necesidades).toBe(100)
    expect(resultado.deseos).toBe(0)
    expect(resultado.necesidades + resultado.deseos).toBeLessThanOrEqual(100)
  })

  test('retorna ceros sin ingresos', () => {
    expect(calcularRegla503020({ totalIngresos: 0 })).toEqual({ necesidades: 0, deseos: 0, ahorro: 0 })
  })
})

describe('calcularFinancialHealthScore', () => {
  test('puntua alto con buena tasa de ahorro y sin deuda', () => {
    const score = calcularFinancialHealthScore({
      totalIngresos: 1000,
      totalGastosReales: 700,
      totalGastosFijos: 300,
      totalSuscripciones: 0,
      deudas: [],
    })
    expect(score).toBeGreaterThanOrEqual(90)
  })

  test('penaliza gastar mas de lo que se gana', () => {
    const score = calcularFinancialHealthScore({
      totalIngresos: 1000,
      totalGastosReales: 1500,
      totalGastosFijos: 900,
      totalSuscripciones: 200,
      deudas: [{ pago_minimo: 500, saldo: 20000 }],
    })
    expect(score).toBeLessThan(50)
  })

  test('se mantiene entre 0 y 100', () => {
    const score = calcularFinancialHealthScore({ totalIngresos: 0, totalGastosReales: 0, deudas: [] })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('calcularDailyBudget', () => {
  test('reparte el saldo disponible entre los dias restantes del mes', () => {
    const hoy = new Date(2026, 5, 21) // 21 jun, quedan 10 dias (21-30)
    const presupuesto = calcularDailyBudget(1000, [], hoy)
    expect(presupuesto).toBe(100)
  })

  test('descuenta gastos fijos pendientes antes de repartir', () => {
    const hoy = new Date(2026, 5, 21)
    const gastosFijos = [{ estado: 'Pendiente', dia_venc: 25, monto: 500 }]
    const presupuesto = calcularDailyBudget(1000, gastosFijos, hoy)
    expect(presupuesto).toBe(50) // (1000-500)/10
  })

  test('retorna 0 si el saldo disponible es negativo', () => {
    const hoy = new Date(2026, 5, 21)
    const gastosFijos = [{ estado: 'Pendiente', dia_venc: 25, monto: 1500 }]
    expect(calcularDailyBudget(1000, gastosFijos, hoy)).toBe(0)
  })
})
