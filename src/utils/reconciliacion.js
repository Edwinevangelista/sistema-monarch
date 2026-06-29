const EPSILON = 0.01

const money = (value) => Number(Number(value || 0).toFixed(2))

export const CAMPO_CUENTA = 'balance'

export const CAMPO_TARJETA = 'saldo'

const valorCuenta = (cuenta) => Number(cuenta?.[CAMPO_CUENTA])

const valorTarjeta = (tarjeta) => Number(tarjeta?.[CAMPO_TARJETA])

export function reconciliar({ cuentas = [], tarjetas = [], transacciones = [], patrimonioNeto = 0 }) {
  const problemas = []

  // 1. Activos - Pasivos = Patrimonio Neto
  const activos = money(cuentas.reduce((s, c) => s + Number(valorCuenta(c) || 0), 0))
  const pasivos = money(tarjetas.reduce((s, t) => s + Number(valorTarjeta(t) || 0), 0))
  const netoCalculado = money(activos - pasivos)
  const netoMostrado = money(patrimonioNeto)

  if (Math.abs(netoCalculado - netoMostrado) > EPSILON) {
    problemas.push({
      tipo: 'patrimonio',
      mensaje: `Patrimonio neto descuadra: mostrado ${netoMostrado}, real ${netoCalculado}`,
      esperado: netoCalculado,
      actual: netoMostrado,
    })
  }

  // 2. Suma de transacciones por categoria = total de gastos del mes
  const totalPorCategoria = {}
  let totalGeneral = 0

  for (const t of transacciones.filter((x) => x.tipo === 'gasto')) {
    const categoria = t.categoria || 'Sin categoria'
    const monto = money(t.monto)
    totalPorCategoria[categoria] = money((totalPorCategoria[categoria] || 0) + monto)
    totalGeneral = money(totalGeneral + monto)
  }

  const sumaCategorias = money(Object.values(totalPorCategoria).reduce((s, v) => s + v, 0))
  if (Math.abs(sumaCategorias - totalGeneral) > EPSILON) {
    problemas.push({
      tipo: 'categorias',
      mensaje: `Suma de categorias (${sumaCategorias}) != total general (${totalGeneral})`,
      esperado: totalGeneral,
      actual: sumaCategorias,
    })
  }

  // 3. Ningun saldo ni deuda debe ser NaN o undefined
  for (const c of cuentas) {
    if (!Number.isFinite(valorCuenta(c))) {
      problemas.push({ tipo: 'nan', mensaje: `Cuenta ${c?.nombre || c?.id || 'sin nombre'} tiene saldo invalido` })
    }
  }

  for (const t of tarjetas) {
    if (!Number.isFinite(valorTarjeta(t))) {
      problemas.push({ tipo: 'nan', mensaje: `Tarjeta ${t?.nombre || t?.cuenta || t?.id || 'sin nombre'} tiene deuda invalida` })
    }
  }

  return {
    ok: problemas.length === 0,
    problemas,
    resumen: {
      campoCuenta: CAMPO_CUENTA,
      campoTarjeta: CAMPO_TARJETA,
      activos,
      pasivos,
      netoCalculado,
    },
  }
}
