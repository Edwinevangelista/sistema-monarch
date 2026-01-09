import React, { useState, useEffect } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Bell, Sun, Moon, Coffee, ChevronLeft, ChevronRight, ScanLine } from 'lucide-react'

// --- HOOKS ---
import { useInactivityTimeout } from '../hooks/useInactivityTimeout'
import { useIngresos } from '../hooks/useIngresos'
import { useGastosVariables } from '../hooks/useGastosVariables'
import { useGastosFijos } from '../hooks/useGastosFijos'
import { useSuscripciones } from '../hooks/useSuscripciones'
import { useDeudas } from '../hooks/useDeudas'
import { usePagosTarjeta } from '../hooks/usePagosTarjeta'
import { useNotifications } from '../hooks/useNotifications'
import { getDeudaStatus } from '../lib/finance/deudaStatus'
import { useCuentasBancarias } from '../hooks/useCuentasBancarias'

// --- COMPONENTES ---
import ModalIngreso from './ModalIngreso'
import ModalGastos from './ModalGastos'
import ModalSuscripcion from './ModalSuscripcion'
import ModalPagoTarjeta from './ModalPagoTarjeta'
import ModalAgregarDeuda from './ModalAgregarDeuda'
import LectorEstadoCuenta from './LectorEstadoCuenta'
import Notificaciones from './Notificaciones'
import GraficaDona from './GraficaDona'
import GraficaBarras from './GraficaBarras'
import AsistenteFinancieroV2 from './AsistenteFinancieroV2'
import ConfiguracionNotificaciones from './ConfiguracionNotificaciones'
import LogoutButton from './LogoutButton'
import MenuFlotante from './MenuFlotante'
import ModalDetallesCategorias from './ModalDetallesCategorias'
import MenuInferior from './MenuInferior'
import ModalUsuario from './ModalUsuario'
import Footer from './Footer'
import ListaIngresos from './ListaIngresos'
import ModalDetalleUniversal from './ModalDetalleUniversal'

// --- MODALES NUEVOS ---
import DebtPlannerModal from './DebtPlannerModal'
import SavingsPlannerModal from './SavingsPlannerModal'
import SpendingControlModal from './SpendingControlModal'
import { usePlanesGuardados } from '../hooks/usePlanesGuardados'
import SavedPlansList from './SavedPlansList'

import ListaGastosCompleta from './ListaGastosCompleta'
import { ITEM_TYPES } from '../constants/itemTypes'
import ModuloCuentasBancarias from './ModuloCuentasBancarias'

// --- LIBRERÍA DE BD ---
import { supabase } from '../lib/supabaseClient'

// ============================================
// COMPONENTE CALENDARIO DE PAGOS
// ============================================
const CalendarioPagos = ({ gastosFijos, suscripciones, deudas, ingresos, gastos }) => {
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  
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
    
    // Ingresos
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
    
    // Gastos variables
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
    
    // Gastos fijos
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
    
    // Suscripciones
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
    
    // Deudas
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
  const hoy = new Date()
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

// ============================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ============================================

export default function DashboardContent() {
  
  const { cuentas, addCuenta, updateCuenta, deleteCuenta } = useCuentasBancarias()

  const [usuario, setUsuario] = useState({ 
    email: 'usuario@ejemplo.com', 
    nombre: 'FinTrack User'
  })

  const [overviewMode, setOverviewMode] = useState('ALL')
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(null)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)
  const [planUpdateCounter, setPlanUpdateCounter] = useState(0);
  const [showLector, setShowLector] = useState(false)

  const [ingresoEditando, setIngresoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastoFijoEditando, setGastoFijoEditando] = useState(null)
  const [suscripcionEditando, setSuscripcionEditando] = useState(null)
  const [deudaEditando, setDeudaEditando] = useState(null)
  
  const [preferenciasUsuario, setPreferenciasUsuario] = useState(() => {
    const guardadas = localStorage.getItem("preferenciasUsuario");
    return guardadas
      ? JSON.parse(guardadas)
      : {
          moneda: "USD",
          inicioMes: 1,
          objetivo: "Reducir deudas",
          riesgo: "Conservador",
          iaActiva: true,
        };
  });

  useInactivityTimeout(15)

  const { ingresos, addIngreso, updateIngreso, deleteIngreso } = useIngresos()
  const { gastos, addGasto, updateGasto, deleteGasto } = useGastosVariables()
  const { gastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } = useGastosFijos()
  const { suscripciones, addSuscripcion, updateSuscripcion, deleteSuscripcion } = useSuscripciones()
  const { deudas, updateDebt, refresh: refreshDeudas, deleteDebt } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()
  const { refresh: refreshPlanes } = usePlanesGuardados()
  const { permission, showLocalNotification } = useNotifications()

  // FIX: Normalizar el item para asegurar que el campo 'monto' exista para todos los tipos
  const handleOpenDetail = (item, type) => {
    let status = null
    
    // Creamos una copia del item y nos aseguramos de tener un campo 'monto' estandarizado
    const normalizedItem = { 
      ...item, 
      monto: item.monto || item.costo || item.pago_minimo || item.saldo || 0 
    }

    if (type === ITEM_TYPES.DEUDA) {
      status = getDeudaStatus(item, pagos)
    }
    setItemSeleccionado({ item: normalizedItem, type, status })
  }

   const handleEditarUniversal = (item, type) => {
    setItemSeleccionado(null)
    setIngresoEditando(null)
    setGastoEditando(null)
    setGastoFijoEditando(null)
    setSuscripcionEditando(null)
    setDeudaEditando(null)

    if (type === ITEM_TYPES.DEUDA) {
      setDeudaEditando(item)
      setShowModal('agregarDeuda')
      return
    }
    if (type === ITEM_TYPES.FIJO) {
      setGastoFijoEditando(item)
      setShowModal('gastos')
      return
    }
    if (type === ITEM_TYPES.VARIABLE) {
      setGastoEditando(item)
      setShowModal('gastos')
      return
    }
    if (type === ITEM_TYPES.SUSCRIPCION) {
      setSuscripcionEditando(item)
      setShowModal('suscripcion')
      return
    }
    console.warn('⚠️ Tipo no reconocido en handleEditarUniversal:', type)
  }

  const handlePagarUniversal = (item, type) => {
    if (type === ITEM_TYPES.DEUDA) {
      setDeudaEditando(item)
      setShowModal('pagoTarjeta')
      return
    }
    if (type === ITEM_TYPES.FIJO) {
      handleGuardarGastoFijo({ ...item, estado: 'Pagado' })
      return
    }
    if (type === ITEM_TYPES.SUSCRIPCION) {
      handlePagoManual(item)
      return
    }
  }

  const handleEliminarUnificado = (item, type) => {
    const confirmMsg = `¿Estás seguro de eliminar este ${type === 'deuda' ? 'registro de deuda' : type === 'fijo' ? 'gasto fijo' : type === 'suscripcion' ? 'servicio' : 'gasto'}?`
    if (!window.confirm(confirmMsg)) return

    if (type === ITEM_TYPES.SUSCRIPCION) {
      handleEliminarSuscripcion(item.id)
    } else if (type === ITEM_TYPES.DEUDA) {
      deleteDebt && deleteDebt(item.id) 
    } else if (type === ITEM_TYPES.FIJO) {
      deleteGastoFijo && deleteGastoFijo(item.id)
    } else if (type === ITEM_TYPES.VARIABLE) {
      deleteGasto && deleteGasto(item.id)
    }
  }

  const handleGuardarIngreso = async (data) => {
    try {
      if (data.id) {
        await updateIngreso(data.id, data)
      } else {
        await addIngreso(data)
      }
      if (data.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === data.cuenta_id)
        if (cuenta) {
          await updateCuenta(cuenta.id, { balance: Number(cuenta.balance) + Number(data.monto) })
        }
      }
      setShowModal(null)
      setIngresoEditando(null)
    } catch (e) {
      console.error('Error al guardar ingreso:', e)
      alert('Error al guardar el ingreso')
    }
  }

const handleGuardarGasto = async (data) => {
  try {
    if (!data.fecha) {
      data.fecha = new Date().toISOString().split('T')[0];
    }
    
    console.log('📦 Guardando gasto:', data)
    
    if (data.id) {
      console.log('✏️ EDITANDO gasto ID:', data.id)
      await updateGasto(data.id, data)
    } else {
      console.log('➕ CREANDO nuevo gasto')
      await addGasto(data)
    }
    
    if (data.cuenta_id) {
      const cuenta = cuentas.find(c => c.id === data.cuenta_id)
      if (cuenta) {
        await updateCuenta(cuenta.id, { 
          balance: Number(cuenta.balance) - Number(data.monto) 
        })
      }
    }
    
    setShowModal(null)
    setGastoEditando(null)
  } catch (e) {
    console.error('❌ Error al guardar gasto:', e)
    alert('Error al guardar el gasto')
  }
}

  const handleGuardarGastoFijo = async (data) => {
    try {
      if (data.id) {
        const { id, ...payload } = data;
        await updateGastoFijo(id, payload);
      } else {
        await addGastoFijo(data);
      }
      setShowModal(null)
      setGastoFijoEditando(null)
    } catch (e) {
      console.error('Error al guardar gasto fijo:', e)
      alert('Error al guardar: ' + e.message)
    }
  }

  const handleGuardarSuscripcion = async (data) => {
    try {
      if (data.id) {
        await updateSuscripcion(data.id, data)
      } else {
        await addSuscripcion(data)
      }
      setShowModal(null)
      setSuscripcionEditando(null)
    } catch (e) {
      console.error('Error al guardar suscripción:', e)
    }
  }

  const calcularProximoPago = (fechaActualStr, ciclo) => {
    const fecha = new Date(fechaActualStr + 'T00:00:00');
    let nuevaFecha = new Date(fecha);
    if (ciclo === 'Mensual') nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    else if (ciclo === 'Anual') nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
    else if (ciclo === 'Semanal') nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    return nuevaFecha.toISOString().split('T')[0];
  };

  const handlePagoManual = async (sub) => {
    if (!sub.cuenta_id) {
      alert('⚠️ Esta suscripción no tiene una cuenta de pago asignada.')
      setSuscripcionEditando(sub)
      setShowModal('suscripcion')
      return
    }
    try {
      const cuenta = cuentas.find(c => c.id === sub.cuenta_id)
      if (!cuenta) {
        alert('Error: Cuenta no encontrada.')
        return
      }
      await updateCuenta(cuenta.id, { balance: Number(cuenta.balance) - Number(sub.costo) })
      await addGasto({
        fecha: new Date().toISOString().split('T')[0],
        monto: sub.costo,
        categoria: '📅 Suscripciones',
        descripcion: `Pago Manual: ${sub.servicio}`,
        cuenta_id: cuenta.id,
        metodo: 'Manual'
      })
      const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
      if (updateSuscripcion) {
        await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago })
      }
      alert('✅ Pago registrado correctamente.')
    } catch (error) {
      console.error('Error en pago manual:', error)
      alert('Hubo un error al procesar el pago.')
    }
  }

  const handleGuardarDeuda = async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('❌ Error: No se pudo identificar al usuario.')
        return
      }

      const dataConUser = { ...data, user_id: user.id }

      if (data.id) {
        const { error } = await supabase.from('deudas').update(dataConUser).eq('id', data.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('deudas').insert([dataConUser])
        if (error) throw error
      }
      
      await refreshDeudas()
      setShowModal(null)
      setDeudaEditando(null)
      alert('✅ Tarjeta guardada exitosamente')
      
    } catch (e) {
      console.error("❌ Error guardando deuda:", e)
      alert(`Error al guardar: ${e.message || 'Error desconocido'}`)
    }
  }

  const handleEliminarSuscripcion = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta suscripción?')) {
      try {
        await deleteSuscripcion(id);
      } catch (error) {
        console.error('Error al eliminar suscripción:', error);
        alert('Error al eliminar la suscripción');
      }
    }
  };

  const handleRegistrarPagoTarjeta = async (pago) => {
    try {
      const deuda = deudas.find(d => d.id === pago.deuda_id)
      if (!deuda) throw new Error('Deuda no encontrada')

      const principal = Number(pago.a_principal || 0)
      const intereses = Number(pago.intereses || 0)
      const total = Number(pago.monto_total || 0)

      if (principal > deuda.saldo) {
        alert(`El pago a capital ($${principal}) no puede ser mayor al saldo pendiente ($${deuda.saldo}).`)
        return
      }

      if (Math.abs((principal + intereses) - total) > 0.01) {
        alert('El monto total debe ser igual a Principal + Intereses')
        return
      }

      await addPago({
        user_id: deuda.user_id,
        deuda_id: deuda.id,
        fecha: pago.fecha,
        tarjeta: deuda.cuenta,
        monto: total,
        principal,
        interes: intereses,
        metodo: pago.metodo || null,
        notas: pago.notas || null,
      })

      if (principal > 0) {
        await updateDebt(deuda.id, {
          saldo: Math.max(0, deuda.saldo - principal),
          ultimo_pago: pago.fecha,
        })
      }

      await refreshPagos()
      await refreshDeudas()
      setShowModal(null)

    } catch (err) {
      console.error(err)
      alert('Error registrando el pago')
    }
  }

  const handleEliminarIngreso = async (id) => {
    try {
      await deleteIngreso(id);
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      alert('Error al eliminar el ingreso');
    }
  };

  const validarMonto = (valor) => {
    const num = Number(valor)
    return isNaN(num) || num < 0 ? 0 : num
  }

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  
  const totalIngresos = ingresos.reduce((sum, i) => sum + validarMonto(i.monto), 0)
  
  const overviewData = {
    deudas: overviewMode === 'DEUDAS' || overviewMode === 'ALL' ? deudas : [],
    suscripciones: overviewMode === 'SUSCRIPCIONES' || overviewMode === 'ALL' ? suscripciones : [],
    gastosFijos: overviewMode === 'FIJOS' || overviewMode === 'ALL' ? gastosFijos : [],
    gastosVariables: overviewMode === 'VARIABLES' || overviewMode === 'ALL' ? gastos : [],
  }

  const deudaPagadaEsteMes = (deudaId) => {
    return pagos?.some(p => {
      const f = new Date(p.fecha)
      return p.deuda_id === deudaId && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    })
  }

  const totalGastosFijosReales = gastosFijos.reduce((sum, gf) => {
    if (!gf.dia_venc) return sum
    const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
    if (diaVenc <= hoy) return sum + validarMonto(gf.monto)
    return sum
  }, 0)

  const totalGastosVariablesReales = gastos.filter(g => g.fecha <= hoyStr).reduce((sum, g) => sum + validarMonto(g.monto), 0)

  const totalSuscripcionesReales = suscripciones
    .filter(s => s.estado === 'Activo' && s.proximo_pago)
    .reduce((sum, s) => {
      const proxPago = new Date(s.proximo_pago)
      const costo = validarMonto(s.costo)
      if (proxPago <= hoy && proxPago.getMonth() === hoy.getMonth()) {
        if (s.ciclo === 'Anual') return sum + (costo / 12)
        if (s.ciclo === 'Semanal') return sum + costo
        return sum + costo
      }
      return sum
    }, 0)

  const totalGastosReales = totalGastosFijosReales + totalGastosVariablesReales + totalSuscripcionesReales
  const saldoReal = totalIngresos - totalGastosReales
  const tasaAhorroReal = (totalIngresos > 0 ? ((totalIngresos - totalGastosReales) / totalIngresos) * 100 : 0)

  useEffect(() => {
    const hoyStr = hoy.toISOString().split('T')[0]
    suscripciones.forEach(async (sub) => {
      if (sub.estado !== 'Activo') return
      if (!sub.autopago || !sub.cuenta_id) return
      if (sub.proximo_pago !== hoyStr) return

      const cuenta = cuentas.find(c => c.id === sub.cuenta_id)
      if (!cuenta) return

      try {
        await updateCuenta(cuenta.id, { balance: Number(cuenta.balance) - Number(sub.costo) })
        await addGasto({
          fecha: hoyStr,
          monto: sub.costo,
          categoria: '📅 Suscripciones',
          descripcion: `Autopago: ${sub.servicio}`,
          cuenta_id: cuenta.id,
          metodo: 'Autopago'
        })
        const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
        if (updateSuscripcion) {
          await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago })
        }
      } catch (error) {
        console.error("Error en autopago:", error)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suscripciones, cuentas])

  useEffect(() => {
    if (usuario.email) {
      const nombre = usuario.email.split('@')[0]
      setUsuario(prev => ({ ...prev, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1) }))
    }
  }, [usuario.email])

  useEffect(() => {
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferenciasUsuario));
  }, [preferenciasUsuario]);

  const obtenerAlertas = () => {
    const alertas = []
    gastosFijos.forEach(gf => {
      if (gf.estado === 'Pagado' || !gf.dia_venc) return
      const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
      const diff = Math.round((diaVenc - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 0) alertas.push({ tipo: 'critical', mensaje: `⚠️ ${gf.nombre} está vencido.`, mensajeCorto: `${gf.nombre} - VENCIDO`, monto: gf.monto, tipoItem: ITEM_TYPES.FIJO, item: gf })
      else if (diff <= 5) alertas.push({ tipo: 'warning', mensaje: `📅 ${gf.nombre} vence ${diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${gf.nombre} - ${diff} días`, monto: gf.monto, tipoItem: ITEM_TYPES.FIJO, item: gf })
    })
    suscripciones.forEach(sub => {
      if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
      const proxPago = new Date(sub.proximo_pago)
      const diff = Math.round((proxPago - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 3 && diff >= 0) alertas.push({ tipo: 'info', mensaje: `🔄 ${sub.servicio} se renovará ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${sub.servicio} - Renueva`, monto: sub.costo, tipoItem: ITEM_TYPES.SUSCRIPCION, item: sub })
    })
    deudas.forEach(d => {
      if (!d.vence) return
      const vence = new Date(d.vence)
      const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 5 && diff >= 0) alertas.push({ tipo: 'warning', mensaje: `💳 Pago de ${d.cuenta} vence ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${d.cuenta} - ${diff}d`, monto: d.pago_minimo, tipoItem: ITEM_TYPES.DEUDA, item: d })
    })
    return alertas
  }

  const alertas = obtenerAlertas()

  const obtenerSaludo = () => {
    const hora = new Date().getHours()
    let textoHora = ''
    let icono = null
    if (hora >= 5 && hora < 12) { textoHora = 'Buenos días'; icono = <Sun className="w-6 h-6 text-yellow-400" /> }
    else if (hora >= 12 && hora < 19) { textoHora = 'Buenas tardes'; icono = <Coffee className="w-6 h-6 text-orange-400" /> }
    else { textoHora = 'Buenas noches'; icono = <Moon className="w-6 h-6 text-indigo-400" /> }

    const frases = saldoReal > 0 
      ? ["¡Excelente gestión!", "¡Vas muy bien!", "Tu esfuerzo funciona"]
      : saldoReal === 0
      ? ["Estás en equilibrio.", "¡Bien hecho!", "Controlando finanzas"]
      : ["No te desanimes.", "Pequeños cambios.", "Tomando control"]

    const frase = frases[Math.floor(Math.random() * frases.length)]
    return { textoHora, icono, frase }
  }

  const { textoHora, icono, frase } = obtenerSaludo()

  const gastosPorCategoria = {}
  ;[...gastosFijos, ...gastos, ...suscripciones.filter(s => s.estado === 'Activo')].forEach(item => {
    const cat = item.categoria || '📦 Otros'
    const monto = validarMonto(item.monto || item.costo)
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + monto
  })

  const dataGraficaDona = Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  useEffect(() => {
    if (permission === 'granted' && alertas.length > 0) {
      const hoyStr = hoy.toDateString()
      const ultimaAlertaEnviada = localStorage.getItem('ultima_alerta_notificacion_fecha')
      if (ultimaAlertaEnviada !== hoyStr) {
        const alertaCritica = alertas.find(a => a.tipo === 'critical') || alertas[0]
        showLocalNotification('⚠️ Alertas financieras', { body: `${alertaCritica.mensaje}`, data: { url: '/' } })
        localStorage.setItem('ultima_alerta_notificacion_fecha', hoyStr)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertas, permission])

  const kpis = {
    totalIngresos,
    totalGastos: totalGastosReales,
    totalGastosFijos: totalGastosFijosReales,
    totalGastosVariables: totalGastosVariablesReales,
    totalSuscripciones: totalSuscripcionesReales,
    saldo: saldoReal,
    tasaAhorro: parseFloat(tasaAhorroReal || 0) / 100,
    totalDeudas: deudas.reduce((sum, d) => sum + validarMonto(d.balance), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pb-20 md:pb-4">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 px-3 md:px-4 pt-3 md:pt-4">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl border border-blue-400/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">{textoHora}, {usuario.nombre}</h1>
                <div className="flex items-center gap-2 text-blue-100 mt-1 text-xs md:text-base">
                  {icono}
                  <span className="italic">{frase}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block"><LogoutButton /></div>
          </div>
        </div>
      </div>

      {/* WIDGET DE RESUMEN */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 mb-4 md:mb-6">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h3 className="text-xs md:text-sm font-semibold text-blue-300">💰 Balance Real</h3>
            <span className="text-[10px] md:text-xs text-gray-400">{hoy.toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="bg-green-500/10 p-2 md:p-3 rounded-lg border border-green-500/30">
              <div className="text-[10px] md:text-xs text-green-300">Ingresos</div>
              <div className="text-sm md:text-lg font-bold text-white">${totalIngresos.toLocaleString()}</div>
            </div>
            <div className="bg-red-500/10 p-2 md:p-3 rounded-lg border border-red-500/30">
              <div className="text-[10px] md:text-xs text-red-300">Gastos</div>
              <div className="text-sm md:text-lg font-bold text-white">${totalGastosReales.toLocaleString()}</div>
            </div>
            <div className={`${saldoReal >= 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-red-500/10 border-red-500/30'} p-2 md:p-3 rounded-lg border`}>
              <div className={`text-[10px] md:text-xs ${saldoReal >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>Disponible</div>
              <div className={`text-sm md:text-lg font-bold ${saldoReal >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>${saldoReal.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 space-y-4 md:space-y-6">
        
    {/* CALENDARIO */}
<CalendarioPagos 
  key={JSON.stringify(suscripciones.map(s => s.proximo_pago))}
  gastosFijos={gastosFijos}
  suscripciones={suscripciones}
  deudas={deudas}
  ingresos={ingresos}
  gastos={gastos}
/>

        {/* BOTONES DE ACCIÓN */}
        <div className="hidden md:flex flex-wrap gap-3 justify-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <button onClick={() => setShowModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm touch-manipulation"><Plus className="w-4 h-4" /> Ingreso</button>
          <button onClick={() => setShowModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm touch-manipulation"><Plus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => setShowModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm touch-manipulation"><Repeat className="w-4 h-4" /> Suscripción</button>
          <button onClick={() => setShowModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm touch-manipulation"><CreditCard className="w-4 h-4" /> Tarjetas</button>
          <button onClick={() => setShowLector(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm touch-manipulation border border-gray-500"><ScanLine className="w-4 h-4" /> Escanear PDF</button>
        </div>

        {/* NOTIFICACIONES */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> Alertas</h3>
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] md:text-xs px-2 py-1 rounded-full border border-yellow-500/30">{alertas.length}</span>
          </div>
          <Notificaciones alertas={alertas} onAlertClick={(alerta) => {
            handleOpenDetail(alerta.item, alerta.tipoItem)
          }} />
        </div>

        {/* ASISTENTE */}
        <AsistenteFinancieroV2
          ingresos={ingresos}
          gastosFijos={gastosFijos}
          gastosVariables={gastos}
          suscripciones={suscripciones}
          deudas={deudas}
          onOpenDebtPlanner={() => setShowDebtPlanner(true)}
          onOpenSavingsPlanner={() => setShowSavingsPlanner(true)}
          onOpenSpendingControl={() => setShowSpendingControl(true)}
        />

        {/* PLANES */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Mis Planes</h2>
            <button onClick={() => setShowSavingsPlanner(true)} className="text-xs md:text-sm bg-purple-600/20 text-purple-300 px-3 py-1 rounded hover:bg-purple-600/30 transition flex items-center gap-2 touch-manipulation"><Plus className="w-3 h-3 md:w-4 md:h-4"/> Nuevo</button>
          </div>
          <SavedPlansList refreshSignal={planUpdateCounter} />
        </div>

        {/* GRÁFICAS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
  <GraficaDona 
    data={dataGraficaDona} 
    onCategoryClick={() => setShowDetallesCategorias(true)} 
  />
  <GraficaBarras 
    ingresos={ingresos}
    gastos={gastos}
    gastosFijos={gastosFijos}
    suscripciones={suscripciones}
  />
</div>

        {/* INGRESOS */}
        <ListaIngresos 
          ingresos={ingresos}
          onEditar={(ingreso) => { setIngresoEditando(ingreso); setShowModal('ingreso'); }}
          onEliminar={handleEliminarIngreso}
        />

        {/* FINANZAS */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Finanzas</h3>
              <p className="text-[10px] md:text-xs text-gray-400">Gastos & Deudas</p>
            </div>
            <button onClick={() => { setOverviewMode('ALL'); setShowModal('gastosOverview') }} className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors border border-gray-600 touch-manipulation">Ver</button>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div onClick={() => { setOverviewMode('DEUDAS'); setShowModal('gastosOverview') }} className="group relative overflow-hidden bg-gray-700/30 border border-purple-500/30 hover:bg-purple-900/60 active:scale-95 rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer touch-manipulation">
              <div className="text-xl md:text-2xl font-bold text-white">{deudas.length}</div>
              <div className="text-[10px] md:text-xs text-purple-300">Deudas</div>
            </div>
            <div onClick={() => { setOverviewMode('FIJOS'); setShowModal('gastosOverview') }} className="group relative overflow-hidden bg-gray-700/30 border border-yellow-500/30 hover:bg-yellow-900/60 active:scale-95 rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer touch-manipulation">
              <div className="text-xl md:text-2xl font-bold text-white">{gastosFijos.length}</div>
              <div className="text-[10px] md:text-xs text-yellow-300">Fijos</div>
            </div>
            <div onClick={() => { setOverviewMode('VARIABLES'); setShowModal('gastosOverview') }} className="group relative overflow-hidden bg-gray-700/30 border border-red-500/30 hover:bg-red-900/60 active:scale-95 rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer touch-manipulation">
              <div className="text-xl md:text-2xl font-bold text-white">{gastos.length}</div>
              <div className="text-[10px] md:text-xs text-red-300">Variables</div>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <ConfiguracionNotificaciones />
        </div>
      </div>

      <Footer className="hidden md:block" />

      {/* MODALES */}
      {itemSeleccionado && (
        <ModalDetalleUniversal
          item={itemSeleccionado.item}
          type={itemSeleccionado.type}
          status={itemSeleccionado.status}
          onClose={() => setItemSeleccionado(null)}
          onEditar={handleEditarUniversal}
          onPagar={handlePagarUniversal}
        />
      )}

      {showModal === 'gastosOverview' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center">
          <div className="bg-gray-900 w-full md:max-w-3xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl p-4 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white">💳 Gastos & Deudas</h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white text-2xl touch-manipulation">✕</button>
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-gray-700">
              <button onClick={() => setOverviewMode('ALL')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation ${overviewMode === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>Todos</button>
              <button onClick={() => setOverviewMode('DEUDAS')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation ${overviewMode === 'DEUDAS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>Deudas</button>
              <button onClick={() => setOverviewMode('FIJOS')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation ${overviewMode === 'FIJOS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>Fijos</button>
              <button onClick={() => setOverviewMode('VARIABLES')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation ${overviewMode === 'VARIABLES' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>Variables</button>
              <button onClick={() => setOverviewMode('SUSCRIPCIONES')} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation ${overviewMode === 'SUSCRIPCIONES' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>Suscripciones</button>
            </div>
            <ListaGastosCompleta
              deudas={overviewData.deudas}
              gastosFijos={overviewData.gastosFijos}
              gastosVariables={overviewData.gastosVariables}
              suscripciones={overviewData.suscripciones}
              deudaPagadaEsteMes={deudaPagadaEsteMes}
              onVerDetalle={handleOpenDetail}
              onEliminar={handleEliminarUnificado}
              onPagar={handlePagarUniversal}
              onEditar={handleEditarUniversal}
            />
          </div>
        </div>
      )}

      {showModal === 'ingreso' && (
        <ModalIngreso
          onClose={() => { setShowModal(null); setIngresoEditando(null) }}
          onSave={handleGuardarIngreso}
          ingresoInicial={ingresoEditando}
        />
      )}

      {showModal === 'cuentas' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ModuloCuentasBancarias cuentas={cuentas} onAgregar={addCuenta} onEditar={(cuenta) => { updateCuenta(cuenta.id, cuenta) }} onEliminar={deleteCuenta} />
            <div className="p-4"><button onClick={() => setShowModal(null)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl touch-manipulation">Cerrar</button></div>
          </div>
        </div>
      )}

      {showModal === 'gastos' && (
        <ModalGastos onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null) }} onSaveVariable={handleGuardarGasto} onSaveFijo={handleGuardarGastoFijo} gastoInicial={gastoEditando || gastoFijoEditando} />
      )}

      {showModal === 'usuario' && (
        <ModalUsuario usuario={usuario} preferencias={preferenciasUsuario} onChangePreferencias={setPreferenciasUsuario} onClose={() => setShowModal(null)} onLogout={() => { localStorage.clear(); window.location.href = "/auth"; }} />
      )}

      {showModal === 'suscripcion' && (
        <ModalSuscripcion key={suscripcionEditando?.id} onClose={() => { setShowModal(null); setSuscripcionEditando(null) }} onSave={handleGuardarSuscripcion} suscripcionInicial={suscripcionEditando} />
      )}

      {showModal === 'tarjetas' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Gestión de Tarjetas</h2>
            <div className="space-y-3">
              <button onClick={() => setShowModal('agregarDeuda')} className="w-full p-3 md:p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors touch-manipulation">📝 Registrar Tarjeta</button>
              <button onClick={() => setShowModal('pagoTarjeta')} className="w-full p-3 md:p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors touch-manipulation">💳 Pagar Tarjeta</button>
              <button onClick={() => setShowModal(null)} className="w-full p-3 md:p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors touch-manipulation">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'pagoTarjeta' && (
        <ModalPagoTarjeta onClose={() => setShowModal(null)} onSave={handleRegistrarPagoTarjeta} deudas={deudas} />
      )}
      
      {showModal === 'agregarDeuda' && (
        <ModalAgregarDeuda onClose={() => { setShowModal(null); setDeudaEditando(null) }} onSave={handleGuardarDeuda} deudaInicial={deudaEditando} />
      )}

      {showDetallesCategorias && (
        <ModalDetallesCategorias gastosPorCategoria={gastosPorCategoria} gastosFijos={gastosFijos} gastosVariables={gastos} suscripciones={suscripciones} onClose={() => setShowDetallesCategorias(false)} />
      )}

      {showDebtPlanner && (
        <DebtPlannerModal deudas={deudas} kpis={kpis} onClose={() => setShowDebtPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {showSavingsPlanner && (
        <SavingsPlannerModal kpis={kpis} onClose={() => setShowSavingsPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {showSpendingControl && (
        <SpendingControlModal gastosFijos={gastosFijos} gastosVariables={gastos} suscripciones={suscripciones} kpis={kpis} onClose={() => setShowSpendingControl(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {showLector && (
        <LectorEstadoCuenta onClose={() => setShowLector(false)} />
      )}

      <div className="hidden md:block">
        <MenuFlotante onIngresoCreado={addIngreso} onGastoCreado={addGasto} />
      </div>

      <MenuInferior onOpenModal={setShowModal} alertasCount={alertas.length} nombreUsuario={usuario.nombre} onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }} />
    </div>
  )
}