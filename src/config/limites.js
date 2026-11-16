// FinTrack — Fase 1: todo gratis.
// Todos los límites del plan free son iguales a premium: las funciones
// (proyección, estrategia de deuda, exportar, historial, cuentas y
// deudas ilimitadas) ya existen completas; el candado solo las tapaba.
// El objeto `premium` se deja por compatibilidad con usePlan/getLimitesPlan.
export const LIMITES = {
  free: {
    maxCuentas: Infinity,
    maxTarjetas: Infinity,
    mesesHistorial: Infinity,
    proyeccionFlujoCaja: true,
    estrategiaPagoDeuda: true,
    exportarDatos: true,
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
