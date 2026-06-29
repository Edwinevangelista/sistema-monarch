import {
  calcularFechaLimitePago,
  calcularPagoMinimo,
  calcularProximoCorte,
  calcularUsoCredito,
} from './tarjetasCalculos'

describe('tarjetasCalculos', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 5, 28))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('calcula pago minimo con APR en porcentaje o decimal', () => {
    expect(calcularPagoMinimo(1000, 24)).toBeCloseTo(40)
    expect(calcularPagoMinimo(1000, 0.24)).toBeCloseTo(40)
    expect(calcularPagoMinimo(100, 0)).toBe(25)
  })

  test('calcula proximo corte sin mover fecha por zona horaria', () => {
    expect(calcularProximoCorte('2026-06-15')).toBe('2026-07-15')
    expect(calcularProximoCorte('2026-06-30T18:00:00')).toBe('2026-06-30')
  })

  test('calcula fecha limite de pago local', () => {
    expect(calcularFechaLimitePago('2026-06-15', 21)).toBe('2026-07-06')
  })

  test('limita uso de credito a 100%', () => {
    expect(calcularUsoCredito(300, 1000)).toBe(30)
    expect(calcularUsoCredito(1500, 1000)).toBe(100)
    expect(calcularUsoCredito(100, 0)).toBeNull()
  })
})
