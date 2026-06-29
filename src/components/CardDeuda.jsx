import { CreditCard, Edit2, Trash2, AlertCircle, DollarSign } from 'lucide-react';

export default function CardDeuda({ deuda, onEditar, onEliminar, onPagar }) {
  const saldo      = Number(deuda.saldo       || 0)
  const limite     = Number(deuda.balance     || 0)   // balance = límite de crédito
  const pagoMinimo = Number(deuda.pago_minimo || 0)
  const aprRaw     = Number(deuda.apr         || 0)

  // Normalize APR → always a percentage number (e.g. 25, not 0.25)
  const aprPct = aprRaw > 1 ? aprRaw : aprRaw * 100

  const tieneBalance  = limite > 0
  const saldada       = saldo <= 0
  const porcentajeUso = tieneBalance ? Math.min((saldo / limite) * 100, 100) : 0

  // Donut arc config
  const RADIUS        = 28
  const STROKE        = 6
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS   // ≈ 175.93
  const strokeDash    = (porcentajeUso / 100) * CIRCUMFERENCE
  const strokeGap     = CIRCUMFERENCE - strokeDash

  const arcColor =
    porcentajeUso > 80 ? '#ef4444' :   // red-500
    porcentajeUso > 50 ? '#eab308' :   // yellow-500
                         '#10b981'     // emerald-500

  // Monthly interest estimate
  const interesMensual =
    aprPct > 0 && saldo > 0
      ? Math.round(saldo * (aprPct / 100) / 12)
      : 0

  // ── CICLO DE TARJETA ──────────────────────────────────────────────────────
  // Las tarjetas siempre tienen un próximo corte — nunca "VENCIDO".
  // Si hoy >= día de corte → próximo corte es el MES SIGUIENTE.
  const calcularProximoCorte = (venceDateStr) => {
    if (!venceDateStr) return null
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Parse avoiding timezone shift
    const fechaBase = new Date(venceDateStr + 'T00:00:00')
    const diaCorte  = fechaBase.getDate()

    let proxCorte = new Date(hoy.getFullYear(), hoy.getMonth(), diaCorte)
    if (hoy >= proxCorte) {
      proxCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaCorte)
    }

    const dias = Math.ceil((proxCorte - hoy) / (1000 * 60 * 60 * 24))
    return { dias, diaCorte, fecha: proxCorte }
  }

  const ciclo   = calcularProximoCorte(deuda.vence)
  const urgente = ciclo && ciclo.dias <= 3 && !saldada

  // Label for "próximo corte" badge
  const labelCorte =
    !ciclo         ? null :
    ciclo.dias === 0 ? `Hoy · día ${ciclo.diaCorte}` :
    ciclo.dias === 1 ? `Mañana · día ${ciclo.diaCorte}` :
                       `en ${ciclo.dias} días · día ${ciclo.diaCorte}`

  const colorCorte =
    !ciclo           ? '' :
    ciclo.dias === 0 ? 'bg-accent-info/10 text-accent-info border-accent-info/25' :
    ciclo.dias <= 3  ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/25' :
    ciclo.dias <= 7  ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/25' :
                       'bg-base-elevated text-ink-muted border-base-border'

  // Pay button color
  const colorBotonPagar =
    urgente
      ? 'bg-accent-warning hover:bg-accent-warning/90 active:bg-accent-warning/80 text-base'
      : 'bg-accent-positive hover:bg-accent-positive/90 active:bg-accent-positive/80 text-base'

  return (
    <div
      className="rounded-2xl p-4 border transition-all bg-base-surface"
      style={{
        borderColor: urgente ? 'rgba(251,191,36,0.35)' : '#262B36',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">

        {/* Left: name + type */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-ink font-bold text-base leading-tight truncate">
            {deuda.cuenta}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">{deuda.tipo || 'Tarjeta de Crédito'}</p>
        </div>

        {/* Right: icon + edit/delete buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onEditar}
            className="p-1.5 rounded-lg hover:bg-accent-info/10 active:scale-90 transition-all touch-manipulation text-ink-faint hover:text-accent-info"
            aria-label="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onEliminar}
            className="p-1.5 rounded-lg hover:bg-accent-negative/10 active:scale-90 transition-all touch-manipulation text-ink-faint hover:text-accent-negative"
            aria-label="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* CreditCard icon with urgency badge */}
          <div className="relative ml-1">
            <div className="p-2 bg-base-elevated border border-base-border rounded-xl">
              <CreditCard className="w-4 h-4 text-ink-muted" />
            </div>
            {urgente && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-warning border border-base flex items-center justify-center">
                <AlertCircle className="w-2 h-2 text-base" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY: Donut + Saldo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4">

        {/* SVG Donut — only when there's a limit and debt */}
        {tieneBalance && !saldada ? (
          <div className="flex-shrink-0 relative" style={{ width: 70, height: 70 }}>
            <svg viewBox="0 0 70 70" width="70" height="70">
              {/* Track */}
              <circle
                cx="35" cy="35"
                r={RADIUS}
                fill="none"
                stroke="#262B36"
                strokeWidth={STROKE}
              />
              {/* Arc — starts at top (−90°) */}
              <circle
                cx="35" cy="35"
                r={RADIUS}
                fill="none"
                stroke={arcColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${strokeGap}`}
                strokeDashoffset={CIRCUMFERENCE * 0.25}   // rotate to 12 o'clock
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-bold leading-none" style={{ color: arcColor }}>
                {porcentajeUso.toFixed(0)}%
              </span>
              <span className="text-[8px] text-ink-faint leading-none mt-0.5">uso</span>
            </div>
          </div>
        ) : (
          // Placeholder when saldada or no limit — keeps layout stable
          <div className="w-[70px] flex-shrink-0" />
        )}

        {/* Saldo principal */}
        <div className="flex-1 min-w-0">
          {saldada ? (
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent-positive">$0.00</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-accent-positive/10 text-accent-positive border border-accent-positive/25 whitespace-nowrap">
                ✅ SALDADA
              </span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-accent-negative leading-none">
              ${saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          {tieneBalance && (
            <p className="text-xs text-ink-muted mt-1">
              de ${limite.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} límite
            </p>
          )}
        </div>
      </div>

      {/* ── CHIPS ROW ──────────────────────────────────────────────────────── */}
      {(pagoMinimo > 0 || aprPct > 0 || interesMensual > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pagoMinimo > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent-warning/10 border border-accent-warning/25 text-accent-warning font-medium">
              Mín. ${pagoMinimo.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
          {aprPct > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent-warning/10 border border-accent-warning/25 text-accent-warning font-medium">
              {aprPct.toFixed(1)}% APR
            </span>
          )}
          {interesMensual > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent-negative/10 border border-accent-negative/25 text-accent-negative font-medium">
              ~${interesMensual}/mes
            </span>
          )}
        </div>
      )}

      {/* ── PRÓXIMO CORTE ──────────────────────────────────────────────────── */}
      {labelCorte && (
        <div className="mb-3">
          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${colorCorte}`}>
            Corte: {labelCorte}
          </span>
        </div>
      )}

      {/* ── BOTÓN PAGAR ────────────────────────────────────────────────────── */}
      {!saldada && (
        <button
          onClick={onPagar}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 mt-1 ${colorBotonPagar}`}
        >
          <DollarSign className="w-4 h-4" />
          Registrar Pago
        </button>
      )}
    </div>
  )
}
