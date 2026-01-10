import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CalendarioPagos = ({ gastosFijos, suscripciones, deudas, ingresos, gastos }) => {
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  
  const hoy = useMemo(() => new Date(), []) // ✅ FIX: Memoizar fecha

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  
  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear()
    const mes = fecha.getMonth()
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    const diaSemanaInicio = primerDia.getDay()
    
    const dias = []
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null)
    }
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
    
    ingresos?.forEach(ing => {
      if (ing.fecha === fechaStr) {
        totalIngresos += Number(ing.monto || 0)
        eventos.push({ 
          tipo: 'ingreso', 
          nombre: ing.fuente || 'Ingreso', 
          monto: ing.monto,
          icono: '💵'
        })
      }
    })
    
    gastos?.forEach(g => {
      if (g.fecha === fechaStr) {
        totalGastos += Number(g.monto || 0)
        eventos.push({ 
          tipo: 'gasto', 
          nombre: g.descripcion || g.categoria || 'Gasto', 
          monto: g.monto,
          icono: '💸'
        })
      }
    })
    
    gastosFijos?.forEach(gf => {
      if (gf.dia_venc === dia && gf.estado !== 'Pagado') {
        totalGastos += Number(gf.monto || 0)
        eventos.push({ 
          tipo: 'gasto_fijo', 
          nombre: gf.nombre, 
          monto: gf.monto,
          icono: '📌'
        })
      }
    })
    
    suscripciones?.forEach(sub => {
      if (sub.estado === 'Activo' && sub.proximo_pago) {
        const proxPago = new Date(sub.proximo_pago + 'T00:00:00')
        if (proxPago.getDate() === dia && 
            proxPago.getMonth() === mesActual.getMonth() &&
            proxPago.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(sub.costo || 0)
          eventos.push({ 
            tipo: 'suscripcion', 
            nombre: sub.servicio, 
            monto: sub.costo,
            icono: '🔄'
          })
        }
      }
    })
    
    deudas?.forEach(d => {
      if (d.vence) {
        const vence = new Date(d.vence + 'T00:00:00')
        if (vence.getDate() === dia && 
            vence.getMonth() === mesActual.getMonth() &&
            vence.getFullYear() === mesActual.getFullYear()) {
          totalGastos += Number(d.pago_minimo || 0)
          eventos.push({ 
            tipo: 'deuda', 
            nombre: d.cuenta, 
            monto: d.pago_minimo,
            icono: '💳'
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
  
  const eventosDelDia = diaSeleccionado ? obtenerEventosDelDia(diaSeleccionado) : null
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-3 md:p-6 border border-gray-700 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <button 
          onClick={() => cambiarMes(-1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        </button>
        
        <h3 className="text-base md:text-xl font-bold text-white">
          {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
        </h3>
        
        <button 
          onClick={() => cambiarMes(1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-[10px] md:text-xs text-gray-400 font-semibold py-1">
            {dia}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {dias.map((dia, index) => {
          if (!dia) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }
          
          const { ingresos, gastos, eventos } = obtenerEventosDelDia(dia)
          const balance = ingresos - gastos
          const tieneEventos = eventos.length > 0
          
          return (
            <div
              key={dia}
              onClick={() => handleDiaClick(dia)}
              className={`
                aspect-square rounded-md md:rounded-lg p-1 md:p-2 
                flex flex-col items-center justify-center
                transition-all cursor-pointer relative
                ${esHoy(dia) 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' 
                  : tieneEventos
                    ? balance > 0 
                      ? 'bg-green-500/20 hover:bg-green-500/40 text-white'
                      : 'bg-red-500/20 hover:bg-red-500/40 text-white'
                    : 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-400'
                }
                ${diaSeleccionado === dia ? 'ring-2 ring-purple-500' : ''}
                active:scale-95
              `}
            >
              <span className="text-xs md:text-sm font-bold">{dia}</span>
              
              {tieneEventos && (
                <div className="text-[8px] md:text-[10px] font-bold mt-0.5">
                  {balance > 0 ? `+$${Math.round(balance)}` : `-$${Math.round(gastos)}`}
                </div>
              )}
              
              {tieneEventos && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {eventos.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-white/60"></div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Modal flotante con eventos del día - CENTRADO */}
      {diaSeleccionado && eventosDelDia && eventosDelDia.eventos.length > 0 && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setDiaSeleccionado(null)}
          />
          
          {/* Modal */}
          <div 
            className="fixed z-50 bg-gray-900 rounded-xl shadow-2xl border-2 border-purple-500 p-4 max-w-xs w-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
              <h4 className="text-sm font-bold text-white">
                {diasSemana[new Date(mesActual.getFullYear(), mesActual.getMonth(), diaSeleccionado).getDay()].slice(0, 3)} {diaSeleccionado} de {meses[mesActual.getMonth()]}
              </h4>
              <button 
                onClick={() => setDiaSeleccionado(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Lista de eventos */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {eventosDelDia.eventos.map((evento, i) => (
                <div 
                  key={i} 
                  className={`
                    p-2 rounded-lg flex items-center gap-2
                    ${evento.tipo === 'ingreso' ? 'bg-green-600/30 border border-green-500/50' : 
                      evento.tipo === 'suscripcion' ? 'bg-purple-600/30 border border-purple-500/50' :
                      evento.tipo === 'deuda' ? 'bg-red-600/30 border border-red-500/50' :
                      evento.tipo === 'gasto_fijo' ? 'bg-orange-600/30 border border-orange-500/50' :
                      'bg-yellow-600/30 border border-yellow-500/50'}
                  `}
                >
                  <span className="text-lg">{evento.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{evento.nombre}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{evento.tipo.replace('_', ' ')}</div>
                  </div>
                  <div className="text-sm font-bold text-white whitespace-nowrap">
                    ${Number(evento.monto).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm font-bold">
              <span className="text-gray-400">Total del día:</span>
              <span className={eventosDelDia.ingresos - eventosDelDia.gastos >= 0 ? 'text-green-400' : 'text-red-400'}>
                {eventosDelDia.ingresos > 0 && `+$${eventosDelDia.ingresos.toFixed(2)} `}
                {eventosDelDia.gastos > 0 && `-$${eventosDelDia.gastos.toFixed(2)}`}
              </span>
            </div>
          </div>
        </>
      )}
      
      {/* Leyenda */}
      <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-3 justify-center text-[9px] md:text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-blue-600"></div>
          <span className="text-gray-400">Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-green-500/30"></div>
          <span className="text-gray-400">Balance +</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-red-500/30"></div>
          <span className="text-gray-400">Gastos</span>
        </div>
      </div>
    </div>
  )
}

export default CalendarioPagos