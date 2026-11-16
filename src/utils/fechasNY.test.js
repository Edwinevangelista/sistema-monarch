// Tests Fase 1: fechas en America/New_York (ver src/utils/fechasNY.js)
import { hoyNY, parseFechaLocal, formatoFechaLocal, diffDiasNY, proximaFechaDiaMes } from './fechasNY'

describe('hoyNY', () => {
  test('medianoche de NY sigue siendo el mismo día NY (no el día UTC)', () => {
    // 2026-11-16 00:30 EST = 05:30 UTC: en UTC ya es 16, en NY también 16
    expect(hoyNY(new Date('2026-11-16T05:30:00Z'))).toBe('2026-11-16')
    // 2026-11-16 00:30 EST es 05:30 UTC; 04:30 UTC es 23:30 del 15 en NY
    expect(hoyNY(new Date('2026-11-16T04:30:00Z'))).toBe('2026-11-15')
  })

  test('cambio a horario de verano (15 mar 2026, 2am → 3am)', () => {
    // 03:30 UTC = 23:30 EST del 14 (antes del salto)
    expect(hoyNY(new Date('2026-03-15T03:30:00Z'))).toBe('2026-03-14')
    // 04:30 UTC = 00:30 EDT del 15 (después del salto)
    expect(hoyNY(new Date('2026-03-15T04:30:00Z'))).toBe('2026-03-15')
  })

  test('cambio a horario estándar (1 nov 2026, 2am → 1am)', () => {
    // 03:30 UTC = 23:30 EDT del 31 oct
    expect(hoyNY(new Date('2026-11-01T03:30:00Z'))).toBe('2026-10-31')
    // 04:30 UTC = 00:30 EDT del 1 nov (antes de atrasar el reloj)
    expect(hoyNY(new Date('2026-11-01T04:30:00Z'))).toBe('2026-11-01')
  })
})

describe('parseFechaLocal / formatoFechaLocal', () => {
  test('parsea YYYY-MM-DD al mediodía local (no medianoche UTC)', () => {
    const d = parseFechaLocal('2026-11-16')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(16)
    expect(d.getHours()).toBe(12)
    expect(formatoFechaLocal(d)).toBe('2026-11-16')
  })

  test('acepta ISO con hora y devuelve solo la fecha', () => {
    expect(formatoFechaLocal(parseFechaLocal('2026-11-16T23:59:59Z'))).toBe('2026-11-16')
  })
})

describe('diffDiasNY', () => {
  const hoyTarde = new Date('2026-11-16T12:00:00') // mediodía local, 16 nov NY

  test('vence hoy → 0 aunque sean las 8pm', () => {
    const hoyNoche = new Date(2026, 10, 16, 20, 0, 0)
    expect(diffDiasNY('2026-11-16', hoyNoche)).toBe(0)
  })

  test('mañana → 1, ayer → -1', () => {
    expect(diffDiasNY('2026-11-17', hoyTarde)).toBe(1)
    expect(diffDiasNY('2026-11-15', hoyTarde)).toBe(-1)
  })
})

describe('proximaFechaDiaMes', () => {
  test('día que no pasó → este mes; día que pasó → mes siguiente', () => {
    const hoy = new Date('2026-11-16T12:00:00')
    expect(proximaFechaDiaMes(20, hoy)).toBe('2026-11-20')
    expect(proximaFechaDiaMes(10, hoy)).toBe('2026-12-10')
    expect(proximaFechaDiaMes(16, hoy)).toBe('2026-11-16')
  })

  test('día 31 en febrero → último día del mes', () => {
    expect(proximaFechaDiaMes(31, new Date('2026-02-10T12:00:00'))).toBe('2026-02-28')
    expect(proximaFechaDiaMes(31, new Date('2026-01-15T12:00:00'))).toBe('2026-01-31')
  })
})
