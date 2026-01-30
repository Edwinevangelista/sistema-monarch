// CalendarioPagos.jsx - VERSIÓN LIMPIA CORREGIDA
// Fix para error de build: 'esDiaSeleccionado' is not defined

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar as CalIcon, CreditCard, ShoppingCart, Repeat, Wallet } from 'lucide-react'

const CalendarioPagos = ({ gastosFijos, suscripciones, deudas, ingresos, gastos }) => {
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  
  const hoy = useMemo(() => new Date(), [])

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  
  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear()
    const mes = fecha.getMonth()
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    const diaSemanaInicio = primerDia.getDay()
    
    const dias = []
    // Rellenar días vacíos antes del día 1
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null)
    }
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia)
    }
    return dias
  }
  
  const obtenerEventosDelDia = (dia) => {
    if (!dia) return { ingresos: 0, gastos: 0, eventos: [] }
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia)
    const fechaStr = fecha.toISOString().split('T')[0]
    
    let totalIngresos = 0
    let totalGastos = 0
    const eventos = []
    
    // 🔄 INGRESOS CON SOPORTE PARA RECURRENCIA
    ingresos?.forEach(ing => {
      if (ing.fecha === fechaStr) {
        totalIngresos += Number(ing.monto || 0)
        
        // Determinar si es recurrente y generar nombre apropiado
        let nombreIngreso = ing.fuente || 'Ingreso';
        let esRecurrente = false;
        
        if (ing.frecuencia && ing.frecuencia !== 'Único') {
          const sufijos = {
            'Semanal': '(Semanal)',
            'Quincenal': '(Quincenal)', 
            'Mensual': '(Mensual)'
          };
          nombreIngreso += ' ' + (sufijos[ing.frecuencia] || '');
          esRecurrente = true;
        }
        
        eventos.push({ 
          id: ing.id,
          tipo: 'ingreso', 
          nombre: nombreIngreso, 
          monto: ing.monto,
          icono: <Wallet className="w-4 h-4" />,
          color: esRecurrente 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed' // Proyectado
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', // Real
          esRecurrente
        })
      }
      
      // 🔄 GENERAR EVENTOS RECURRENTES ADICIONALES
      if (ing.frecuencia && ing.frecuencia !== 'Único') {
        const fechaBase = new Date(ing.fecha);
        const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
        const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
        
        if (ing.frecuencia === 'Semanal') {
          // Generar eventos semanales adicionales
          let fechaEvento = new Date(fechaBase);
          while (fechaEvento <= ultimoDiaMes) {
            fechaEvento.setDate(fechaEvento.getDate() + 7);
            if (fechaEvento >= primerDiaMes && fechaEvento <= ultimoDiaMes) {
              if (fechaEvento.getDate() === dia && fechaEvento.getMonth() === mesActual.getMonth()) {
                totalIngresos += Number(ing.monto || 0);
                eventos.push({
                  id: `semanal-${ing.id}-${dia}`,
                  tipo: 'ingreso',
                  nombre: `${ing.fuente || 'Ingreso'} (Semanal)`,
                  monto: ing.monto,
                  icono: <Wallet className="w-4 h-4" />,
                  color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
                  esRecurrente: true
                });
              }
            }
          }
        }
        
        else if (ing.frecuencia === 'Mensual') {
          // Evento mensual en el mismo día
          const diaOriginal = fechaBase.getDate();
          if (dia === Math.min(diaOriginal, ultimoDiaMes.getDate()) && ing.fecha !== fechaStr) {
            totalIngresos += Number(ing.monto || 0);
            eventos.push({
              id: `mensual-${ing.id}`,
              tipo: 'ingreso',
              nombre: `${ing.fuente || 'Ingreso'} (Mensual)`,
              monto: ing.monto,
              icono: <Wallet className="w-4 h-4" />,
              color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
              esRecurrente: true
            });
          }
        }
        
        else if (ing.frecuencia === 'Quincenal') {
          const diaOriginal = fechaBase.getDate();
          // Generar dos pagos por mes: original y +15 días
          if (diaOriginal <= 15) {
            if (dia === diaOriginal + 15 && dia <= ultimoDiaMes.getDate()) {
              totalIngresos += Number(ing.monto || 0);
              eventos.push({
                id: `quincenal-${ing.id}-2`,
                tipo: 'ingreso',
                nombre: `${ing.fuente || 'Ingreso'} (Quincenal)`,
                monto: ing.monto,
                icono: <Wallet className="w-4 h-4" />,
                color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 border-dashed',
                esRecurrente: true
              });
            }
          }
        }
      }
    })
    
    // Gastos Variables (sin cambios)
    gastos?.forEach(g => {
      if (g.fecha === fechaStr) {
        totalGastos += Number(g.monto || 0)
        const iconoCat = g.categoria ? g.categoria.charAt(0) : '📝'
        eventos.push({ 
          id: g.id,
          tipo: 'gasto', 
          nombre: g.descripcion || g.categoria || 'Gasto', 
          monto: g.monto,
          icono: <span className="text-lg">{iconoCat}</span>,
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        })
      }
    })
    
    // Gastos Fijos (sin cambios)
    gastosFijos?.forEach(gf => {
      if (gf.dia_venc === dia && gf.estado !== 'Pagado') {
        totalGastos += Number(gf.monto || 0)
        eventos.push({ 
          id: gf.id,
          tipo: 'gasto_fijo', 
          nombre: gf.nombre, 
          monto: gf.monto,
          icono: <CalIcon className="w-4 h-4" />,
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        })
      }
    })
    
    // Suscripciones (sin cambios)
    suscripciones?.forEach(sub => {
      if (sub.estado === 'Activo' && sub.proximo_pago) {
        const proxPago = new Date(sub.proximo_pago + 'T00:00:00')
        if (proxPago.getDate() === dia && 
            proxPago.getMonth() === mesActual.getMonth() &&
            proxPago.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(sub.costo || 0)
          eventos.push({ 
            id: sub.id,
            tipo: 'suscripcion', 
            nombre: sub.servicio, 
            monto: sub.costo,
            icono: <Repeat className="w-4 h-4" />,
            color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          })
        }
      }
    })
    
    // Deudas (sin cambios)
    deudas?.forEach(d => {
      if (d.vence) {
        const vence = new Date(d.vence + 'T00:00:00')
        if (vence.getDate() === dia && 
            vence.getMonth() === mesActual.getMonth() &&
            vence.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(d.pago_minimo || 0)
          eventos.push({ 
            id: d.id,
            tipo: 'deuda', 
            nombre: d.cuenta, 
            monto: d.pago_minimo,
            icono: <CreditCard className="w-4 h-4" />,
            color: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          })
        }
      }
    })
    
    return { ingresos: totalIngresos, gastos: totalGastos, eventos }
  }
  
  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(mesActual)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion)
    setMesActual(nuevaFecha)
    setDiaSeleccionado(null)
  }
  
  const handleDiaClick = (dia) => {
    if (!dia) return
    setDiaSeleccionado(dia)
  }
  
  const dias = obtenerDiasDelMes(mesActual)
  
  const esHoy = (dia) => {
    return dia === hoy.getDate() && 
           mesActual.getMonth() === hoy.getMonth() && 
           mesActual.getFullYear() === hoy.getFullYear()
  }
  
  // Solo calculamos eventos si el modal está abierto
  const eventosDelDia = useMemo(() => {
    if (!diaSeleccionado) return null;
    return obtenerEventosDelDia(diaSeleccionado);
  }, [diaSeleccionado, mesActual, gastosFijos, suscripciones, deudas, ingresos, gastos])
  
  const netoDia = eventosDelDia ? eventosDelDia.ingresos - eventosDelDia.gastos : 0
  
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 md:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => cambiarMes(-1)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
          {meses[mesActual.getMonth()].toUpperCase()} {mesActual.getFullYear()}
        </h3>
        
        <button 
          onClick={() => cambiarMes(1)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-3">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-xs md:text-sm font-bold text-gray-500 uppercase py-2">
            {dia}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {dias.map((dia, index) => {
          if (!dia) return <div key={`empty-${index}`} className="aspect-square" />
          
          // Cálculo rápido para UI (evitando render pesado si no es necesario)
          const { eventos } = obtenerEventosDelDia(dia)
          const tieneEventos = eventos.length > 0
          const esDiaSeleccionado = dia === diaSeleccionado
          
          return (
            <div
              key={dia}
              onClick={() => handleDiaClick(dia)}
              className={`
                aspect-square rounded-2xl p-1 md:p-2 
                flex flex-col items-center justify-center relative cursor-pointer
                transition-all duration-200 ease-out
                ${esDiaSeleccionado 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' 
                  : tieneEventos
                    ? 'bg-white/10 hover:bg-white/20 text-gray-200'
                    : 'text-gray-500 hover:bg-white/5'
                }
                ${esHoy(dia) ? 'font-extrabold' : 'font-semibold'}
                active:scale-95
              `}
            >
              <span className="text-sm md:text-base z-10">{dia}</span>
              
              {/* Indicador de Hoy */}
              {esHoy(dia) && !tieneEventos && (
                <span className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
              )}

              {/* Puntitos de Eventos */}
              {tieneEventos && (
                <div className="flex gap-0.5 mt-1 z-10">
                  {eventos.slice(0, 3).map((ev, i) => {
                    let color = '#34d399'; // Verde por defecto (ingresos)
                    let style = { color };
                    
                    if (ev.tipo === 'ingreso' && ev.esRecurrente) {
                      // Ingresos proyectados: puntito con borde punteado
                      color = '#a7f3d0';
                      style = { 
                        color, 
                        border: '0.5px dashed #34d399',
                        backgroundColor: 'transparent'
                      };
                    } else if (ev.tipo === 'deuda') {
                      color = '#fb7185';
                    } else if (ev.tipo !== 'ingreso') {
                      color = '#facc15';
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-1 h-1 rounded-full ${ev.esRecurrente ? 'border' : 'bg-current'} opacity-70`}
                        style={style}
                      />
                    );
                  })}
                  {eventos.length > 3 && <span className="text-[8px] leading-none text-white/50">+</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* DETALLE DEL DÍA: MODAL RESPONSIVE (BOTTOM SHEET) */}
      {diaSeleccionado && eventosDelDia && (
        <>
          {/* Overlay oscuro */}
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 md:bg-black/80"
            onClick={() => setDiaSeleccionado(null)}
          />
          
          {/* ✅ CORREGIDO: Contenedor del Modal sin referencias problemáticas */}
          <div 
            className="fixed z-50 bg-gray-900 border-t border-white/10 md:border md:border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 md:inset-0 md:flex md:items-center md:justify-center"
            style={{ 
              top: 'auto',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: 'auto',
              maxHeight: '75vh',
              borderRadius: '24px 24px 0 0'
            }}
          >
            <style>{`
              @media (min-width: 768px) {
                .sheet-content {
                  border-radius: 24px;
                  max-width: 400px;
                  width: 100%;
                  margin: 0 auto;
                  max-height: 80vh;
                }
              }
              @media (max-width: 767px) {
                .sheet-content {
                  border-radius: 24px 24px 0 0;
                  height: auto;
                  max-height: 75vh;
                }
              }
            `}</style>

            <div className="sheet-content flex flex-col bg-gray-900 w-full h-full">
              {/* Cabecera móvil (Handle) */}
              <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="p-5 pb-2 flex justify-between items-center border-b border-white/5">
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {diaSeleccionado} de {meses[mesActual.getMonth()]}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {diasSemana[new Date(mesActual.getFullYear(), mesActual.getMonth(), diaSeleccionado).getDay()]}
                  </p>
                </div>
                <div className={`text-right ${netoDia >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <div className="text-xs font-medium uppercase tracking-wider">Neto</div>
                  <div className="text-xl font-bold">
                    ${netoDia >= 0 ? '+' : ''}{netoDia.toLocaleString(undefined, {maximumFractionDigits:0})}
                  </div>
                </div>
              </div>
              
              {/* Lista de Eventos Scrollable */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {eventosDelDia.eventos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Sin movimientos
                  </div>
                ) : (
                  eventosDelDia.eventos.map((evento) => (
                    <div 
                      key={evento.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${evento.color}`}
                    >
                      <div className={`p-2 bg-black/20 rounded-lg text-white/90`}>
                        {evento.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-white truncate">{evento.nombre}</div>
                          {/* Indicador de proyección */}
                          {evento.esRecurrente && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                              📊 Proyectado
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-300 capitalize opacity-80">{evento.tipo.replace('_', ' ')}</div>
                      </div>
                      <div className="text-sm font-bold text-white whitespace-nowrap">
                        ${evento.monto.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Botón Cerrar (Visible solo en desktop o flotante) */}
              <button 
                onClick={() => setDiaSeleccionado(null)}
                className="md:hidden absolute top-3 right-3 p-2 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CalendarioPagos