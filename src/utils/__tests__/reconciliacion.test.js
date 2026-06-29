import { CAMPO_CUENTA, CAMPO_TARJETA, reconciliar } from '../reconciliacion'

describe('reconciliar', () => {
  test('detecta patrimonio neto descuadrado y valores invalidos', () => {
    const resultado = reconciliar({
      cuentas: [
        { nombre: 'Checking', balance: 1000 },
        { nombre: 'Cuenta rota', balance: undefined },
      ],
      tarjetas: [
        { nombre: 'Visa', saldo: 300 },
        { nombre: 'Tarjeta rota', saldo: 'abc' },
      ],
      transacciones: [
        { tipo: 'gasto', categoria: 'Comida', monto: 10 },
        { tipo: 'gasto', categoria: 'Transporte', monto: 5 },
      ],
      patrimonioNeto: 999,
    })

    expect(resultado.ok).toBe(false)
    expect(resultado.problemas.some((p) => p.tipo === 'patrimonio')).toBe(true)
    expect(resultado.problemas.filter((p) => p.tipo === 'nan')).toHaveLength(2)
  })

  test('aprueba cifras cuadradas con campos reales del proyecto', () => {
    const resultado = reconciliar({
      cuentas: [{ nombre: 'Banco', balance: 1200 }],
      tarjetas: [{ cuenta: 'Visa', saldo: 200 }],
      transacciones: [
        { tipo: 'gasto', categoria: 'Comida', monto: 10.1 },
        { tipo: 'gasto', categoria: 'Comida', monto: 4.9 },
      ],
      patrimonioNeto: 1000,
    })

    expect(resultado.ok).toBe(true)
    expect(resultado.problemas).toEqual([])
    expect(resultado.resumen).toMatchObject({
      campoCuenta: 'balance',
      campoTarjeta: 'saldo',
      activos: 1200,
      pasivos: 200,
      netoCalculado: 1000,
    })
  })

  test('tarjeta resta del patrimonio usando balance para cuenta y saldo para tarjeta', () => {
    const resultado = reconciliar({
      cuentas: [{ nombre: 'Cuenta bancaria', balance: 1000 }],
      tarjetas: [{ cuenta: 'Tarjeta credito', saldo: 300 }],
      transacciones: [],
      patrimonioNeto: 700,
    })

    expect(CAMPO_CUENTA).toBe('balance')
    expect(CAMPO_TARJETA).toBe('saldo')
    expect(resultado.ok).toBe(true)
    expect(resultado.resumen.activos).toBe(1000)
    expect(resultado.resumen.pasivos).toBe(300)
    expect(resultado.resumen.netoCalculado).toBe(700)
    expect(resultado.resumen.netoCalculado).not.toBe(1300)
  })
})
