import { FILTRO_TIPOS, obtenerDatosFiltrados } from './filtrosInteligentes'

describe('obtenerDatosFiltrados', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 5, 28))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('filtra fechas con o sin hora dentro del mes actual', () => {
    const datos = obtenerDatosFiltrados({
      ingresos: [
        { monto: 1000, fecha: '2026-06-01' },
        { monto: 500, fecha: '2026-06-15T18:45:00' },
        { monto: 700, fecha: '2026-05-31T23:59:00' },
      ],
      gastosVariables: [
        { monto: 20, fecha: '2026-06-05' },
        { monto: 30, fecha: '2026-06-28T09:00:00' },
        { monto: 40, fecha: '2026-07-01' },
      ],
    }, FILTRO_TIPOS.MES_ACTUAL)

    expect(datos.ingresos).toHaveLength(2)
    expect(datos.gastosVariables).toHaveLength(2)
  })

  test('excluye archivados, autopagos e importaciones bancarias de gastos variables', () => {
    const datos = obtenerDatosFiltrados({
      gastosVariables: [
        { monto: 20, fecha: '2026-06-05', categoria: '🍔 Comida' },
        { monto: 30, fecha: '2026-06-06', archivado: true },
        { monto: 40, fecha: '2026-06-07', metodo: 'Estado de Cuenta' },
        { monto: 50, fecha: '2026-06-08', descripcion: 'Autopago: Netflix' },
        { monto: 60, fecha: '2026-06-09', categoria: '📅 Suscripciones' },
      ],
    }, FILTRO_TIPOS.MES_ACTUAL)

    expect(datos.gastosVariables).toEqual([
      { monto: 20, fecha: '2026-06-05', categoria: '🍔 Comida' },
    ])
  })
})
