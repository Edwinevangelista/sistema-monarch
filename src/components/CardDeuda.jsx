import { CreditCard, Edit2, Trash2, TrendingDown, Percent, RefreshCw } from 'lucide-react';

export default function CardDeuda({ deuda, onEditar, onEliminar }) {
  const saldo = Number(deuda.saldo || 0)
  const limite = Number(deuda.balance || 0)  // balance = límite de crédito de la tarjeta
  const pagoMinimo = Number(deuda.pago_minimo || 0)
  const apr = Number(deuda.apr || 0)

  const tieneBalance = limite > 0
  const porcentajeUso = tieneBalance ? Math.min((saldo / limite) * 100, 100) : 0
  const colorUso =
    porcentajeUso > 80 ? 'bg-red-500' :
    porcentajeUso > 50 ? 'bg-yellow-500' :
    'bg-emerald-500'

  // ── CICLO DE TARJETA REAL ──────────────────────────────────────────────────
  // El campo `vence` guarda la fecha de corte registrada.
  // Las tarjetas de crédito reales NUNCA "vencen" — siempre tienen un próximo ciclo.
  // Si hoy >= día de corte → el próximo corte es el MES SIGUIENTE.
  // Si hoy < día de corte  → el próximo corte es este mes.
  // Resultado: siempre muestra "en N días · día X", nunca "VENCIDO".
  const calcularProximoCorte = (venceDateStr) => {
    if (!venceDateStr) return null
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Parsear la fecha evitando timezone shift
    const fechaBase = new Date(venceDateStr + 'T00:00:00')
    const diaCorte = fechaBase.getDate()

    // Construir fecha de corte este mes
    let proxCorte = new Date(hoy.getFullYear(), hoy.getMonth(), diaCorte)

    // Si hoy ya alcanzó o pasó ese día → ir al mes siguiente
    if (hoy >= proxCorte) {
      proxCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaCorte)
    }

    const dias = Math.ceil((proxCorte - hoy) / (1000 * 60 * 60 * 24))
    return { dias, diaCorte, fecha: proxCorte }
  }

  const ciclo = calcularProximoCorte(deuda.vence)

  return (
    <div className={`rounded-2xl p-4 border-2 transition-all ${
      saldo <= 0
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : ciclo && ciclo.dias <= 3
        ? 'border-orange-500/40 bg-orange-500/5'
        : 'border-purple-500/30 bg-purple-500/5'
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-white font-bold text-base truncate">{deuda.cuenta}</h3>
            {saldo <= 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold whitespace-nowrap">
                ✅ SALDADA
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{deuda.tipo || 'Tarjeta de Crédito'}</p>
        </div>
        <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl ml-2 flex-shrink-0">
          <CreditCard className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      {/* Saldo */}
      <div className="mb-3">
        <p className={`text-2xl font-bold ${saldo <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          ${saldo.toFixed(2)}
        </p>
        {tieneBalance && (
          <p className="text-xs text-gray-500">de ${limite.toFixed(2)} límite</p>
        )}
      </div>

      {/* Barra de uso del crédito */}
      {tieneBalance && saldo > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Uso del crédito</span>
            <span className={porcentajeUso > 80 ? 'text-red-400 font-bold' : ''}>
              {porcentajeUso.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${colorUso}`}
              style={{ width: `${porcentajeUso}%` }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="space-y-1.5 mb-3 text-sm">
        {/* Pago mínimo: solo si es > 0 */}
        {pagoMinimo > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Pago mínimo
            </span>
            <span className="text-yellow-400 font-semibold">${pagoMinimo.toFixed(2)}</span>
          </div>
        )}

        {/* APR */}
        {apr > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              APR anual
            </span>
            <span className="text-orange-400 font-semibold">{(apr * 100).toFixed(1)}%</span>
          </div>
        )}

        {/* Próximo corte — NUNCA muestra "vencido" */}
        {ciclo && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Próximo corte
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              ciclo.dias === 0
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : ciclo.dias <= 3
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : ciclo.dias <= 7
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-700/60 text-gray-300'
            }`}>
              {ciclo.dias === 0 ? 'Hoy' : ciclo.dias === 1 ? 'Mañana' : `en ${ciclo.dias} días`}
              {' · día '}{ciclo.diaCorte}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <button
          onClick={onEditar}
          className="py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 active:scale-95 rounded-xl text-blue-300 text-xs font-semibold transition-all touch-manipulation flex items-center justify-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/40 active:scale-95 rounded-xl text-red-400 text-xs font-semibold transition-all touch-manipulation flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  )
}
