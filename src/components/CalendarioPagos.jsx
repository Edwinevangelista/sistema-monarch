// CalendarioPagos.jsx — 2026 Design: distingue gastos vs ingresos, resalta hoy
import React, { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, CreditCard, Repeat, Wallet } from 'lucide-react'

const CalendarioPagos = ({ gastosFijos, suscripciones, deudas, ingresos, gastos }) => {
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const hoy = useMemo(() => new Date(), [])

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const diasSemana = ['D','L','M','X','J','V','S']

  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear()
    const mes = fecha.getMonth()
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    const diaSemanaInicio = primerDia.getDay()
    const dias = []
    for (let i = 0; i < diaSemanaInicio; i++) dias.push(null)
    for (let dia = 1; dia <= diasEnMes; dia++) dias.push(dia)
    return dias
  }

  const obtenerEventosDelDia = useCallback((dia) => {
    if (!dia) return { ingresos: 0, gastos: 0, eventos: [], tieneIngreso: false, tieneGasto: false }

    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia)
    const fechaStr = fecha.toISOString().split('T')[0]

    let totalIngresos = 0
    let totalGastos = 0
    const eventos = []

    // ── INGRESOS ──
    ingresos?.forEach(ing => {
      if (ing.fecha === fechaStr) {
        totalIngresos += Number(ing.monto || 0)
        let nombreIngreso = ing.fuente || 'Ingreso'
        let esRecurrente = false
        if (ing.frecuencia && ing.frecuencia !== 'Único') {
          const sufijos = { 'Semanal': '(Semanal)', 'Quincenal': '(Quincenal)', 'Mensual': '(Mensual)' }
          nombreIngreso += ' ' + (sufijos[ing.frecuencia] || '')
          esRecurrente = true
        }
        eventos.push({
          id: ing.id, tipo: 'ingreso', nombre: nombreIngreso, monto: ing.monto,
          icono: <Wallet className="w-4 h-4" />, esRecurrente,
          color: esRecurrente
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        })
      }

      // Ingresos recurrentes adicionales
      if (ing.frecuencia && ing.frecuencia !== 'Único') {
        const fechaBase = new Date(ing.fecha)
        const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0)
        const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)

        if (ing.frecuencia === 'Semanal') {
          let fechaEvento = new Date(fechaBase)
          while (fechaEvento <= ultimoDiaMes) {
            fechaEvento.setDate(fechaEvento.getDate() + 7)
            if (fechaEvento >= primerDiaMes && fechaEvento <= ultimoDiaMes && fechaEvento.getDate() === dia) {
              totalIngresos += Number(ing.monto || 0)
              eventos.push({
                id: `semanal-${ing.id}-${dia}`, tipo: 'ingreso',
                nombre: `${ing.fuente || 'Ingreso'} (Semanal)`, monto: ing.monto,
                icono: <Wallet className="w-4 h-4" />,
                color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
                esRecurrente: true,
              })
            }
          }
        } else if (ing.frecuencia === 'Mensual') {
          const diaOriginal = fechaBase.getDate()
          if (dia === Math.min(diaOriginal, ultimoDiaMes.getDate()) && ing.fecha !== fechaStr) {
            totalIngresos += Number(ing.monto || 0)
            eventos.push({
              id: `mensual-${ing.id}`, tipo: 'ingreso',
              nombre: `${ing.fuente || 'Ingreso'} (Mensual)`, monto: ing.monto,
              icono: <Wallet className="w-4 h-4" />,
              color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
              esRecurrente: true,
            })
          }
        } else if (ing.frecuencia === 'Quincenal') {
          const diaOriginal = fechaBase.getDate()
          if (diaOriginal <= 15 && dia === diaOriginal + 15 && dia <= ultimoDiaMes.getDate()) {
            totalIngresos += Number(ing.monto || 0)
            eventos.push({
              id: `quincenal-${ing.id}-2`, tipo: 'ingreso',
              nombre: `${ing.fuente || 'Ingreso'} (Quincenal)`, monto: ing.monto,
              icono: <Wallet className="w-4 h-4" />,
              color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
              esRecurrente: true,
            })
          }
        }
      }
    })

    // ── GASTOS VARIABLES ──
    gastos?.forEach(g => {
      if (g.fecha === fechaStr) {
        totalGastos += Number(g.monto || 0)
        eventos.push({
          id: g.id, tipo: 'gasto',
          nombre: g.descripcion || g.categoria || 'Gasto', monto: g.monto,
          icono: <span className="text-sm">💸</span>,
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        })
      }
    })

    // ── GASTOS FIJOS ──
    // Son recurrentes → aparecen en TODOS los meses en su día de vencimiento
    gastosFijos?.forEach(gf => {
      if (gf.dia_venc !== dia) return

      const esMesActual =
        mesActual.getMonth() === hoy.getMonth() &&
        mesActual.getFullYear() === hoy.getFullYear()

      // Solo el mes actual tiene estado real (Pagado/Pendiente)
      // Meses pasados/futuros → se muestran como proyección
      const esPagado = esMesActual && gf.estado === 'Pagado'
      const esFuturo =
        mesActual.getFullYear() > hoy.getFullYear() ||
        (mesActual.getFullYear() === hoy.getFullYear() && mesActual.getMonth() > hoy.getMonth())

      if (!esPagado) {
        totalGastos += Number(gf.monto || 0)
      }

      eventos.push({
        id: gf.id,
        tipo: 'gasto_fijo',
        nombre: gf.nombre,
        monto: gf.monto,
        icono: <CreditCard className="w-4 h-4" />,
        esPagado,
        esProyeccion: !esMesActual,
        color: esPagado
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : esFuturo
          ? 'bg-orange-500/10 text-orange-300 border-orange-500/20 border-dashed'
          : 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      })
    })

    // ── SUSCRIPCIONES ──
    suscripciones?.forEach(sub => {
      if (sub.estado === 'Activo' && sub.proximo_pago) {
        const proxPago = new Date(sub.proximo_pago + 'T00:00:00')
        if (proxPago.getDate() === dia && proxPago.getMonth() === mesActual.getMonth() && proxPago.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(sub.costo || 0)
          eventos.push({
            id: sub.id, tipo: 'suscripcion', nombre: sub.servicio, monto: sub.costo,
            icono: <Repeat className="w-4 h-4" />,
            color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
          })
        }
      }
    })

    // ── DEUDAS ──
    deudas?.forEach(d => {
      if (d.vence) {
        const vence = new Date(d.vence + 'T00:00:00')
        if (vence.getDate() === dia && vence.getMonth() === mesActual.getMonth() && vence.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(d.pago_minimo || 0)
          eventos.push({
            id: d.id, tipo: 'deuda', nombre: d.cuenta, monto: d.pago_minimo,
            icono: <CreditCard className="w-4 h-4" />,
            color: 'bg-red-500/20 text-red-400 border-red-500/30',
          })
        }
      }
    })

    const tieneIngreso = eventos.some(e => e.tipo === 'ingreso')
    const tieneGasto = eventos.some(e => e.tipo !== 'ingreso')

    return { ingresos: totalIngresos, gastos: totalGastos, eventos, tieneIngreso, tieneGasto }
  }, [mesActual, hoy, gastosFijos, suscripciones, deudas, ingresos, gastos])

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(mesActual)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion)
    setMesActual(nuevaFecha)
    setDiaSeleccionado(null)
  }

  const handleDiaClick = (dia) => { if (dia) setDiaSeleccionado(dia) }

  const dias = obtenerDiasDelMes(mesActual)

  const esHoy = (dia) =>
    dia === hoy.getDate() && mesActual.getMonth() === hoy.getMonth() && mesActual.getFullYear() === hoy.getFullYear()

  const eventosDelDia = useMemo(() => {
    if (!diaSeleccionado) return null
    return obtenerEventosDelDia(diaSeleccionado)
  }, [diaSeleccionado, obtenerEventosDelDia])

  const netoDia = eventosDelDia ? eventosDelDia.ingresos - eventosDelDia.gastos : 0

  // Leyenda de colores para el calendario
  const leyenda = [
    { color: 'bg-emerald-400', label: 'Ingreso' },
    { color: 'bg-red-400', label: 'Gasto' },
    { color: 'bg-blue-400', label: 'Hoy' },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>

      {/* Shimmer top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="p-4 md:p-5">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => cambiarMes(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h3 className="text-base font-black text-white tracking-wider">
              {meses[mesActual.getMonth()].toUpperCase()}
            </h3>
            <span className="text-xs text-gray-500 font-medium">{mesActual.getFullYear()}</span>
          </div>

          <button onClick={() => cambiarMes(1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90 text-gray-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── LEYENDA ── */}
        <div className="flex items-center justify-center gap-4 mb-3">
          {leyenda.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* ── DÍAS DE LA SEMANA ── */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-center text-[10px] font-bold text-gray-600 uppercase py-1.5">
              {dia}
            </div>
          ))}
        </div>

        {/* ── GRID DE DÍAS ── */}
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, index) => {
            if (!dia) return <div key={`empty-${index}`} className="aspect-square" />

            const { tieneIngreso, tieneGasto } = obtenerEventosDelDia(dia)
            const tieneEventos = tieneIngreso || tieneGasto
            const esDiaSeleccionado = dia === diaSeleccionado
            const esHoyDia = esHoy(dia)
            const ambos = tieneIngreso && tieneGasto

            // Colores del día según tipo de eventos
            let dayBg = ''
            let dayText = 'text-gray-500'
            let dayRing = ''

            if (esDiaSeleccionado) {
              dayBg = 'bg-blue-600'
              dayText = 'text-white'
              dayRing = 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
            } else if (esHoyDia) {
              dayBg = 'bg-blue-500/20'
              dayText = 'text-blue-300'
              dayRing = 'ring-1 ring-blue-500/50'
            } else if (ambos) {
              dayBg = 'bg-gradient-to-br from-emerald-500/15 to-red-500/15'
              dayText = 'text-gray-200'
            } else if (tieneIngreso) {
              dayBg = 'bg-emerald-500/12'
              dayText = 'text-emerald-200'
            } else if (tieneGasto) {
              dayBg = 'bg-red-500/12'
              dayText = 'text-red-200'
            } else {
              dayText = 'text-gray-600'
            }

            return (
              <div
                key={dia}
                onClick={() => handleDiaClick(dia)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer
                  transition-all duration-150 active:scale-90 touch-manipulation
                  hover:bg-white/8 ${dayBg} ${dayText} ${dayRing}
                  ${esHoyDia ? 'font-black' : tieneEventos ? 'font-bold' : 'font-medium'}
                `}
              >
                <span className="text-xs md:text-sm z-10">{dia}</span>

                {/* Indicadores de puntos */}
                {tieneEventos && !esDiaSeleccionado && (
                  <div className="flex gap-0.5 mt-0.5 z-10">
                    {tieneIngreso && (
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    )}
                    {tieneGasto && (
                      <div className="w-1 h-1 rounded-full bg-red-400" />
                    )}
                  </div>
                )}

                {/* Hoy sin eventos — solo punto azul */}
                {esHoyDia && !tieneEventos && (
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MODAL DETALLE DÍA ── */}
      {diaSeleccionado && eventosDelDia && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setDiaSeleccionado(null)}
          />
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <div
              className="w-full md:max-w-md max-h-[80vh] pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 rounded-t-3xl md:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(160deg, rgba(17,24,39,0.98) 0%, rgba(17,24,39,0.95) 100%)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Pill mobile */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-0 md:hidden" />

              {/* Header */}
              <div className="relative p-5 pb-4 border-b border-white/8">
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                  {/* Día grande */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 ${
                    esHoy(diaSeleccionado)
                      ? 'bg-blue-600 text-white'
                      : netoDia >= 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {diaSeleccionado}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      {diasSemana[new Date(mesActual.getFullYear(), mesActual.getMonth(), diaSeleccionado).getDay()]} · {meses[mesActual.getMonth()]}
                    </p>
                    <div className={`text-xl font-black ${netoDia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {netoDia >= 0 ? '+' : ''}{netoDia.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                      Balance del día · {eventosDelDia.eventos.length} evento{eventosDelDia.eventos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Resumen rápido */}
                {eventosDelDia.eventos.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {eventosDelDia.ingresos > 0 && (
                      <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Ingresos</p>
                        <p className="text-sm font-black text-emerald-400">${eventosDelDia.ingresos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    )}
                    {eventosDelDia.gastos > 0 && (
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-red-600 font-bold uppercase">Gastos</p>
                        <p className="text-sm font-black text-red-400">${eventosDelDia.gastos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lista eventos scrolleable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5" style={{ WebkitOverflowScrolling: 'touch' }}>
                {eventosDelDia.eventos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400 font-semibold text-sm">Sin movimientos</p>
                    <p className="text-gray-600 text-xs mt-1">Este día no tiene registros</p>
                  </div>
                ) : (
                  eventosDelDia.eventos.map((evento, idx) => (
                    <div
                      key={evento.id}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border ${evento.color} animate-in fade-in slide-in-from-bottom-2`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="p-2 bg-black/20 rounded-xl shrink-0 text-current">
                        {evento.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{evento.nombre}</p>
                          {evento.esPagado && (
                            <span className="text-[8px] bg-green-500/25 text-green-300 px-1.5 py-0.5 rounded-full border border-green-500/30 font-black uppercase shrink-0">
                              Pagado
                            </span>
                          )}
                          {evento.esRecurrente && (
                            <span className="text-[8px] bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-black uppercase shrink-0">
                              Proy.
                            </span>
                          )}
                          {evento.esProyeccion && !evento.esPagado && evento.tipo === 'gasto_fijo' && (
                            <span className="text-[8px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full border border-orange-500/30 font-black uppercase shrink-0">
                              Proy.
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-current opacity-60 capitalize">{evento.tipo.replace('_', ' ')}</p>
                      </div>
                      <p className="text-sm font-black text-white shrink-0">${Number(evento.monto).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default CalendarioPagos
