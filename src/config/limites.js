export const LIMITES = {
  free: {
    maxCuentas: 2,
    maxTarjetas: 2,
    mesesHistorial: 1,
    proyeccionFlujoCaja: false,
    estrategiaPagoDeuda: false,
    exportarDatos: false,
  },
  premium: {
    maxCuentas: Infinity,
    maxTarjetas: Infinity,
    mesesHistorial: Infinity,
    proyeccionFlujoCaja: true,
    estrategiaPagoDeuda: true,
    exportarDatos: true,
  },
}

export const getLimitesPlan = (plan) => LIMITES[plan] || LIMITES.free
