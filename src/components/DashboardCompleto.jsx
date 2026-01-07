// src/components/DashboardCompleto.jsx

import { useCuentasBancarias } from '../hooks/useCuentasBancarias'
import ModuloCuentasBancarias from './ModuloCuentasBancarias'

import React, { useState, useEffect } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Upload, Bell, Sun, Moon, Coffee, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

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


// --- COMPONENTE DE CALENDARIO ---
const CalendarioPagos = ({ gastosFijos, suscripciones, deudas, ingresos, gastos }) => {
  const [mesActual, setMesActual] = useState(new Date())
  
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
    
    // Fecha del calendario (Medianoche local del día seleccionado)
    const fechaCalendario = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia)
    
    let totalIngresos = 0
    let totalGastos = 0
    const eventos = []
    
    // --- INGRESOS ---
    ingresos?.forEach(ing => {
      if (!ing.fecha) return
      // Normalizamos la fecha del ingreso a medianoche local para comparación justa
      const fechaIngreso = new Date(ing.fecha + 'T00:00:00')
      
      // Comparamos año, mes y día (ignorando horas y minutos)
      if (fechaIngreso.getFullYear() === fechaCalendario.getFullYear() &&
          fechaIngreso.getMonth() === fechaCalendario.getMonth() &&
          fechaIngreso.getDate() === fechaCalendario.getDate()) {
        totalIngresos += Number(ing.monto || 0)
      }
    })
    
    // --- GASTOS VARIABLES (Planet Fitness, etc.) ---
    gastos?.forEach(g => {
      if (!g.fecha) return
      
      // FIX AQUÍ: Convertimos string de fecha a objeto Date
      const fechaGasto = new Date(g.fecha + 'T00:00:00')
      
      // Comparamos objetos Date en lugar de textos
      if (fechaGasto.getFullYear() === fechaCalendario.getFullYear() &&
          fechaGasto.getMonth() === fechaCalendario.getMonth() &&
          fechaGasto.getDate() === fechaCalendario.getDate()) {
        totalGastos += Number(g.monto || 0)
        // Opcional: Puedes descomentar esto si quieres ver el nombre en el tooltip
        // eventos.push({ tipo: 'gasto', nombre: g.descripcion, monto: g.monto })
      }
    })
    
    // --- GASTOS FIJOS ---
    gastosFijos?.forEach(gf => {
      // Si el día de vencimiento coincide con el día del calendario
      if (gf.dia_venc === dia && gf.estado !== 'Pagado') {
        totalGastos += Number(gf.monto || 0)
        eventos.push({ tipo: 'gasto_fijo', nombre: gf.nombre, monto: gf.monto })
      }
    })
    
    // --- SUSCRIPCIONES ---
    suscripciones?.forEach(sub => {
      if (sub.estado !== 'Activo' || !sub.proximo_pago) return
      
      // Normalizamos fecha de proximo pago
      const proxPago = new Date(sub.proximo_pago + 'T00:00:00')
      
      if (proxPago.getDate() === dia && 
          proxPago.getMonth() === mesActual.getMonth() &&
          proxPago.getFullYear() === mesActual.getFullYear()) {
        totalGastos += Number(sub.costo || 0)
        eventos.push({ tipo: 'suscripcion', nombre: sub.servicio, monto: sub.costo })
      }
    })
    
    // --- DEUDAS ---
    deudas?.forEach(d => {
      if (!d.vence) return
      
      // Normalizamos fecha de vencimiento
      const vence = new Date(d.vence + 'T00:00:00')
      
      if (vence.getDate() === dia && 
          vence.getMonth() === mesActual.getMonth() &&
          vence.getFullYear() === mesActual.getFullYear()) {
        totalGastos += Number(d.pago_minimo || 0)
        eventos.push({ tipo: 'deuda', nombre: d.cuenta, monto: d.pago_minimo })
      }
    })
    
    return { ingresos: totalIngresos, gastos: totalGastos, eventos }
  }
  
  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(mesActual)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion)
    setMesActual(nuevaFecha)
  }
  
  const dias = obtenerDiasDelMes(mesActual)
  const hoy = new Date()
  const esHoy = (dia) => {
    return dia === hoy.getDate() && 
           mesActual.getMonth() === hoy.getMonth() && 
           mesActual.getFullYear() === hoy.getFullYear()
  }
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => cambiarMes(-1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <h3 className="text-lg md:text-xl font-bold text-white">
          {meses[mesActual.getMonth()]} {mesActual.getFullYear()}
        </h3>
        
        <button 
          onClick={() => cambiarMes(1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-xs text-gray-400 font-semibold py-2">
            {dia}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {dias.map((dia, index) => {
          if (!dia) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }
          
          const { ingresos, gastos, eventos } = obtenerEventosDelDia(dia)
          const balance = ingresos - gastos
          const tieneEventos = eventos.length > 0 || ingresos > 0 || gastos > 0
          
          return (
            <div
              key={dia}
              className={`
                aspect-square rounded-lg p-1 md:p-2 flex flex-col items-center justify-center
                transition-all cursor-pointer group relative
                ${esHoy(dia) 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                  : tieneEventos
                    ? balance > 0 
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-white'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-400'
                }
              `}
            >
              <span className="text-xs md:text-sm font-semibold">{dia}</span>
              
              {tieneEventos && (
                <div className="text-[10px] md:text-xs mt-0.5 md:mt-1 font-bold">
                  {balance >= 0 ? '+' : ''}{balance > 0 ? `$${Math.round(balance)}` : gastos > 0 ? `-$${Math.round(gastos)}` : ''}
                </div>
              )}
              
              {eventos.length > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                              opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none
                              bg-gray-900 text-white p-2 rounded-lg shadow-xl text-xs whitespace-nowrap
                              max-w-[200px] md:max-w-none">
                  <div className="space-y-1">
                    {eventos.map((evento, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span className="truncate">{evento.nombre}</span>
                        <span className="font-bold">${evento.monto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-600"></div>
          <span className="text-gray-400">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/30"></div>
          <span className="text-gray-400">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/30"></div>
          <span className="text-gray-400">Gastos</span>
        </div>
      </div>
    </div>
  )
}

const DashboardContent = () => {
  const [usuario, setUsuario] = useState({ 
    email: 'usuario@ejemplo.com', 
    nombre: 'FinTrack User'
  })

const [overviewMode, setOverviewMode] = useState('ALL')
// ALL | DEUDAS | SUSCRIPCIONES | FIJOS | VARIABLES

  const {
    cuentas,
    addCuenta,
    updateCuenta,
    deleteCuenta,
  } = useCuentasBancarias()

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
const [itemSeleccionado, setItemSeleccionado] = useState(null)

  const [showModal, setShowModal] = useState(null)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)
  const [planUpdateCounter, setPlanUpdateCounter] = useState(0);

  const [ingresoEditando, setIngresoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastoFijoEditando, setGastoFijoEditando] = useState(null)
  const [suscripcionEditando, setSuscripcionEditando] = useState(null)
  const [deudaEditando, setDeudaEditando] = useState(null)
// ==============================
// ORQUESTADOR UNIVERSAL DE ACCIONES
// ==============================

const handleOpenDetail = (item, type) => {
  let status = null

  if (type === ITEM_TYPES.DEUDA) {
    status = getDeudaStatus(item, pagos)
  }

  setItemSeleccionado({ item, type, status })
}

  // ==============================
  // ORQUESTADOR UNIVERSAL DE ACCIONES
  // ==============================

const handleEditarUniversal = (item, type) => {
  // ✅ MAGIA AQUÍ: Cerramos cualquier modal de detalles que esté abierto
  // Esto hace que si estabas viendo los detalles y pulsas "Editar", los detalles se cierren.
  setItemSeleccionado(null)

  // 2. Limpieza defensiva (evita estados cruzados)
  setIngresoEditando(null)
  setGastoEditando(null)
  setGastoFijoEditando(null)
  setSuscripcionEditando(null)
  setDeudaEditando(null)

  // 3. Redirección y llenado del estado de edición según el tipo
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
  
  // Si llega aquí, el tipo no fue reconocido (no debería pasar)
  console.warn('⚠️ Tipo no reconocido en handleEditarUniversal:', type)
}

// ==============================
// ORQUESTADOR UNIVERSAL DE PAGOS
// ==============================

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

  // VARIABLES: no tienen acción de pagar
}


  useInactivityTimeout(15)

  const { ingresos, addIngreso, updateIngreso, deleteIngreso } = useIngresos()


 const { gastos, addGasto, deleteGasto } = useGastosVariables(); 
  const { gastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } = useGastosFijos();
  const { suscripciones, addSuscripcion, updateSuscripcion, deleteSuscripcion } = useSuscripciones();
  const { deudas, addDebt, updateDebt, refresh: refreshDeudas, deleteDebt } = useDeudas();
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta();
  const { refresh: refreshPlanes } = usePlanesGuardados();
  const { permission, showLocalNotification } = useNotifications();

  // ==============================
// LISTAS DERIVADAS PARA OVERVIEW
// ==============================
const overviewData = {
  deudas:
    overviewMode === 'DEUDAS' || overviewMode === 'ALL'
      ? deudas
      : [],

  suscripciones:
    overviewMode === 'SUSCRIPCIONES' || overviewMode === 'ALL'
      ? suscripciones
      : [],

  gastosFijos:
    overviewMode === 'FIJOS' || overviewMode === 'ALL'
      ? gastosFijos
      : [],

  gastosVariables:
    overviewMode === 'VARIABLES' || overviewMode === 'ALL'
      ? gastos
      : [],
}


  const deudaPagadaEsteMes = (deudaId) => {
    const hoy = new Date()
    return pagos?.some(p => {
      const f = new Date(p.fecha)
      return (
        p.deuda_id === deudaId &&
        f.getMonth() === hoy.getMonth() &&
        f.getFullYear() === hoy.getFullYear()
      )
    })
  }

  useEffect(() => {
    console.log('📊 DASHBOARD DATA:', {
      suscripciones: {
        total: suscripciones?.length || 0,
        activas: suscripciones?.filter(s => s.estado === 'Activo').length || 0,
        ejemplo: suscripciones?.[0]
      },
      gastosFijos: {
        total: gastosFijos?.length || 0,
        ejemplo: gastosFijos?.[0]
      },
      deudas: {
        total: deudas?.length || 0,
        ejemplo: deudas?.[0]
      }
    });
  }, [suscripciones, gastosFijos, deudas]);

  useEffect(() => {
    if (usuario.email) {
      const nombre = usuario.email.split('@')[0]
      setUsuario(prev => ({ ...prev, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1) }))
    }
  }, [usuario.email])

  useEffect(() => {
    localStorage.setItem(
      "preferenciasUsuario",
      JSON.stringify(preferenciasUsuario)
    );
  }, [preferenciasUsuario]);

  const calcularProximoPago = (fechaActualStr, ciclo) => {
    const fecha = new Date(fechaActualStr + 'T00:00:00');
    let nuevaFecha = new Date(fecha);
    if (ciclo === 'Mensual') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    } else if (ciclo === 'Anual') {
      nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
    } else if (ciclo === 'Semanal') {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    return nuevaFecha.toISOString().split('T')[0];
  };

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]

    suscripciones.forEach(async (sub) => {
      if (sub.estado !== 'Activo') return
      if (!sub.autopago || !sub.cuenta_id) return
      if (sub.proximo_pago !== hoy) return

      const cuenta = cuentas.find(c => c.id === sub.cuenta_id)
      if (!cuenta) return

      try {
        await updateCuenta(cuenta.id, {
          balance: Number(cuenta.balance) - Number(sub.costo)
        })

        await addGasto({
          fecha: hoy,
          monto: sub.costo,
          categoria: '📅 Suscripciones',
          descripcion: `Autopago: ${sub.servicio}`,
          cuenta_id: cuenta.id,
          metodo: 'Autopago'
        })

        const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
        
        if (updateSuscripcion) {
          await updateSuscripcion(sub.id, {
            proximo_pago: nuevoProximoPago
          })
        }
      } catch (error) {
        console.error("Error en autopago:", error)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suscripciones, cuentas])

  // ============================================
  // CÁLCULOS FINANCIEROS
  // ============================================
  
  const validarMonto = (valor) => {
    const num = Number(valor)
    return isNaN(num) || num < 0 ? 0 : num
  }

  const calcularTasaAhorro = (ingresos, gastos) => {
    const ingresosValidos = validarMonto(ingresos)
    const gastosValidos = validarMonto(gastos)
    
    if (ingresosValidos === 0) return 0
    
    const saldo = ingresosValidos - gastosValidos
    const tasa = (saldo / ingresosValidos) * 100
    
    if (tasa > 100) return 100
    if (tasa < -100) return -100
    
    return Number(tasa.toFixed(1))
  }

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  const totalIngresos = ingresos.reduce((sum, i) => sum + validarMonto(i.monto), 0)

  const totalGastosFijosReales = gastosFijos.reduce((sum, gf) => {
    if (!gf.dia_venc) return sum
    
    const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
    
    if (diaVenc <= hoy) {
      return sum + validarMonto(gf.monto)
    }
    return sum
  }, 0)

  const totalGastosVariablesReales = gastos
    .filter(g => g.fecha <= hoyStr)
    .reduce((sum, g) => sum + validarMonto(g.monto), 0)

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
  const tasaAhorroReal = calcularTasaAhorro(totalIngresos, totalGastosReales)

  const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diaActual = hoy.getDate()

  const ingresosPromedioSemanal = totalIngresos / Math.ceil(diaActual / 7)
  const semanasRestantes = Math.ceil((diasDelMes - diaActual) / 7)
  const ingresosProyectados = totalIngresos + (ingresosPromedioSemanal * semanasRestantes)

  const gastosFijosPendientes = gastosFijos.reduce((sum, gf) => {
    if (!gf.dia_venc) return sum
    
    const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
    
    if (diaVenc > hoy) {
      return sum + validarMonto(gf.monto)
    }
    return sum
  }, 0)

  const suscripcionesPendientes = suscripciones
    .filter(s => s.estado === 'Activo' && s.proximo_pago)
    .reduce((sum, s) => {
      const proxPago = new Date(s.proximo_pago)
      const costo = validarMonto(s.costo)
      
      if (proxPago > hoy && proxPago.getMonth() === hoy.getMonth()) {
        if (s.ciclo === 'Anual') return sum + (costo / 12)
        if (s.ciclo === 'Semanal') return sum + costo
        return sum + costo
      }
      return sum
    }, 0)

  const gastosVariablesDiarios = diaActual > 0 ? totalGastosVariablesReales / diaActual : 0
  const diasRestantes = diasDelMes - diaActual

  const totalGastosProyectados = totalGastosReales + gastosFijosPendientes + suscripcionesPendientes + (gastosVariablesDiarios * diasRestantes)
  const saldoProyectado = ingresosProyectados - totalGastosProyectados

  const totalGastos = totalGastosReales
  const saldoMes = saldoReal
  const tasaAhorro = tasaAhorroReal

  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + validarMonto(g.monto), 0)
  const totalGastosVariables = gastos.reduce((sum, g) => sum + validarMonto(g.monto), 0)
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      const costo = validarMonto(s.costo)
      if (s.ciclo === 'Anual') return sum + (costo / 12)
      if (s.ciclo === 'Semanal') return sum + (costo * 4.33)
      return sum + costo
    }, 0)

  // ============================================
  // ALERTAS Y SALUDO
  // ============================================

  const obtenerAlertas = () => {
    const alertas = []

    gastosFijos.forEach(gf => {
      if (gf.estado === 'Pagado' || !gf.dia_venc) return
      const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
      const diff = Math.round((diaVenc - hoy) / (1000 * 60 * 60 * 24))
      
      if (diff <= 0) alertas.push({ 
        tipo: 'critical', 
        mensaje: `⚠️ ${gf.nombre} está vencido. ¡Págalo ahora para evitar cargos!`, 
        mensajeCorto: `${gf.nombre} - VENCIDO`,
        monto: gf.monto,
        tipoItem: 'gasto_fijo',
        item: gf 
      })
      else if (diff <= 5) alertas.push({ 
        tipo: 'warning', 
        mensaje: `📅 ${gf.nombre} vence ${diff === 1 ? 'mañana' : `en ${diff} días`}. Prepara el pago.`, 
        mensajeCorto: `${gf.nombre} - ${diff} días`,
        monto: gf.monto,
        tipoItem: 'gasto_fijo',
        item: gf
      })
    })

    suscripciones.forEach(sub => {
      if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
      const proxPago = new Date(sub.proximo_pago)
      const diff = Math.round((proxPago - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 3 && diff >= 0) alertas.push({ 
        tipo: 'info', 
        mensaje: `🔄 ${sub.servicio} se renovará ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}`, 
        mensajeCorto: `${sub.servicio} - Renueva ${diff === 0 ? 'hoy' : `en ${diff}d`}`,
        monto: sub.costo,
        tipoItem: 'suscripcion',
        item: sub
      })
    })

    deudas.forEach(d => {
      if (!d.vence) return
      const vence = new Date(d.vence)
      const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 5 && diff >= 0) alertas.push({ 
        tipo: 'warning', 
        mensaje: `💳 Pago de ${d.cuenta} vence ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}`, 
        mensajeCorto: `${d.cuenta} - ${diff}d`,
        monto: d.pago_minimo,
        tipoItem: 'deuda',
        item: d
      })
    })

    return alertas
  }

  const alertas = obtenerAlertas()

  const obtenerSaludo = () => {
    const hora = new Date().getHours()
    const dia = new Date().getDay()
    let textoHora = ''
    let icono = null
    
    if (hora >= 5 && hora < 12) {
      textoHora = 'Buenos días'
      icono = <Sun className="w-6 h-6 text-yellow-400" />
    } else if (hora >= 12 && hora < 19) {
      textoHora = 'Buenas tardes'
      icono = <Coffee className="w-6 h-6 text-orange-400" />
    } else {
      textoHora = 'Buenas noches'
      icono = <Moon className="w-6 h-6 text-indigo-400" />
    }

    const esFindeSemana = dia === 0 || dia === 6
    const esLunes = dia === 1
    const esViernes = dia === 5
    
    let frasesDisponibles = []

    if (saldoMes > 0) {
      frasesDisponibles = [
        "¡Excelente gestión! Tu disciplina financiera está dando frutos 🌟",
        "¡Vas muy bien! Sigue así y alcanzarás tus metas 💪",
        "Tu esfuerzo está funcionando, ¡sigue adelante! 🚀",
        "¡Increíble progreso! Tu futuro financiero se ve brillante ✨"
      ]
    } else if (saldoMes === 0) {
      frasesDisponibles = [
        "Estás en equilibrio. Cada pequeño ahorro cuenta 💡",
        "¡Bien hecho! Mantener el balance es un gran logro 🎯",
        "Estás controlando tus finanzas, ¡excelente! 📊",
        "El equilibrio es el primer paso hacia el crecimiento 🌱"
      ]
    } else {
      frasesDisponibles = [
        "No te desanimes, cada nuevo día es una oportunidad para mejorar 🌅",
        "Pequeños cambios hoy, grandes resultados mañana 💪",
        "Estás tomando el control, eso es lo importante 🎯",
        "Cada decisión financiera te acerca a tu meta 🚀"
      ]
    }

    if (esLunes) {
      frasesDisponibles.push("¡Nuevo inicio de semana! Comienza con el pie derecho 🌟")
    } else if (esViernes) {
      frasesDisponibles.push("¡Llegó el viernes! Revisa tu progreso semanal 📈")
    } else if (esFindeSemana) {
      frasesDisponibles.push("Buen momento para planificar la semana que viene 📅")
    }

    if (alertas.filter(a => a.tipo === 'critical').length > 0) {
      frasesDisponibles = [
        "Tienes pagos pendientes que requieren atención ⚠️",
        "Revisa tus alertas críticas para evitar cargos adicionales 🔔",
        "Algunos pagos necesitan tu atención inmediata 💳"
      ]
    }

    const fraseMotivacional = frasesDisponibles[Math.floor(Math.random() * frasesDisponibles.length)]

    return { textoHora, icono, fraseMotivacional }
  }

  const { textoHora, icono, fraseMotivacional } = obtenerSaludo()

  const gastosPorCategoria = {}
  ;[...gastosFijos, ...gastos, ...suscripciones.filter(s => s.estado === 'Activo')].forEach(item => {
    const cat = item.categoria || '📦 Otros'
    const monto = validarMonto(item.monto || item.costo)
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + monto
  })

  const dataGraficaDona = Object.entries(gastosPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const dataGraficaBarras = [
    { name: 'Sem 1', ingresos: totalIngresos * 0.2, gastos: totalGastos * 0.22 },
    { name: 'Sem 2', ingresos: totalIngresos * 0.25, gastos: totalGastos * 0.28 },
    { name: 'Sem 3', ingresos: totalIngresos * 0.3, gastos: totalGastos * 0.25 },
    { name: 'Sem 4', ingresos: totalIngresos * 0.25, gastos: totalGastos * 0.25 },
  ]

  useEffect(() => {
    if (permission === 'granted' && alertas.length > 0) {
      const hoy = new Date().toDateString()
      const ultimaAlertaEnviada = localStorage.getItem('ultima_alerta_notificacion_fecha')

      if (ultimaAlertaEnviada !== hoy) {
        const alertaCritica = alertas.find(a => a.tipo === 'critical') || alertas[0]
        
        showLocalNotification('⚠️ Tienes alertas financieras', {
          body: `${alertaCritica.mensaje} - $${alertaCritica.monto || 0}`,
          data: { url: '/' }
        })

        localStorage.setItem('ultima_alerta_notificacion_fecha', hoy)
      }
    }
  }, [alertas, permission, showLocalNotification])

  const kpis = {
    totalIngresos,
    totalGastos,
    totalGastosFijos,
    totalGastosVariables,
    totalSuscripciones,
    saldo: saldoMes,
    tasaAhorro: parseFloat(tasaAhorro) / 100,
    totalDeudas: deudas.reduce((sum, d) => sum + validarMonto(d.balance), 0)
  }

  // ============================================
  // HANDLERS
  // ============================================

const handleGuardarIngreso = async (data) => {
    try {
      // ✅ Si hay ID, es edición
      if (data.id) {
        await updateIngreso(data.id, data)
      } else {
        await addIngreso(data)
      }

      if (data.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === data.cuenta_id)
        if (cuenta) {
          await updateCuenta(cuenta.id, {
            balance: Number(cuenta.balance) + Number(data.monto)
          })
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
      // 🛑 FIX: Si la fecha viene vacía del modal, usamos la de HOY
      // Esto asegura que el calendario siempre muestre el gasto nuevo en el día actual.
      if (!data.fecha) {
        data.fecha = new Date().toISOString().split('T')[0];
      }

      await addGasto(data)

      if (data.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === data.cuenta_id)
        if (cuenta) {
          await updateCuenta(
            cuenta.id,
            { balance: Number(cuenta.balance) - Number(data.monto) }
          )
        }
      }

      setShowModal(null)
      setGastoEditando(null)
    } catch (e) {
      console.error('Error al guardar gasto:', e)
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

 const handleAlertClick = (alerta) => {
  const { tipoItem, item } = alerta

  if (tipoItem === 'deuda') {
    setOverviewMode('DEUDAS')
    setShowModal('gastosOverview')
    handleOpenDetail(item, ITEM_TYPES.DEUDA)
    return
  }

  if (tipoItem === 'suscripcion') {
    setOverviewMode('SUSCRIPCIONES')
    setShowModal('gastosOverview')
    handleOpenDetail(item, ITEM_TYPES.SUSCRIPCION)
    return
  }

  if (tipoItem === 'gasto_fijo') {
    setOverviewMode('FIJOS')
    setShowModal('gastosOverview')
    handleOpenDetail(item, ITEM_TYPES.FIJO)
  }
}


   const handleGuardarSuscripcion = async (data) => {
    try {
      // ✅ FIX: Verificamos si tiene ID para saber si es EDICIÓN o CREACIÓN
      if (data.id) {
        // Si tiene ID, actualizamos el existente
        await updateSuscripcion(data.id, data)
      } else {
        // Si NO tiene ID, creamos uno nuevo
        await addSuscripcion(data)
      }

      setShowModal(null)
      setSuscripcionEditando(null)
    } catch (e) {
      console.error('Error al guardar suscripción:', e)
    }
  }

  const handlePagoManual = async (sub) => {
    if (!sub.cuenta_id) {
      alert('⚠️ Esta suscripción no tiene una cuenta de pago asignada. Por favor edítala y selecciona una cuenta.')
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

      await updateCuenta(cuenta.id, {
        balance: Number(cuenta.balance) - Number(sub.costo)
      })

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
        await updateSuscripcion(sub.id, {
          proximo_pago: nuevoProximoPago
        })
      }
      
      alert('✅ Pago registrado correctamente y fecha actualizada.')

    } catch (error) {
      console.error('Error en pago manual:', error)
      alert('Hubo un error al procesar el pago.')
    }
  }

  const handleGuardarDeuda = async (data) => {
    try {
      if (data.id) {
        await updateDebt(data.id, data)
      } else {
        await addDebt(data)
      }
      setShowModal(null)
      setDeudaEditando(null)
    } catch (e) {
      console.error("Error guardando deuda:", e)
    }
  }
// ============================================
// NUEVOS HANDLERS PARA GASTOS Y PAGOS UNIFICADOS
// ============================================


// 2. Eliminar (Maneja la eliminación para cualquier tipo)
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

// 3. Pagar (Ejecuta la acción de pago según el tipo)

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

      const principal = validarMonto(pago.a_principal)
      const intereses = validarMonto(pago.intereses)
      const total = validarMonto(pago.monto_total)

      // ❌ Pago a capital mayor que saldo
if (principal > deuda.saldo) {
  alert(
    `El pago a capital ($${principal}) no puede ser mayor al saldo pendiente ($${deuda.saldo}).`
  )
  return
}
// ❌ Pago duplicado el mismo día
const pagoHoy = pagos.some(p => {
  const f = new Date(p.fecha)
  const h = new Date()
  return (
    p.deuda_id === deuda.id &&
    f.toDateString() === h.toDateString()
  )
})

if (pagoHoy) {
  alert('Ya se registró un pago hoy para esta deuda.')
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

  const handlePlanGuardado = () => {
    refreshPlanes();
    setPlanUpdateCounter(prev => prev + 1);
  };

const handleEliminarIngreso = async (id) => {
    try {
      await deleteIngreso(id);
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      alert('Error al eliminar el ingreso');
    }
  };
  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pb-20 md:pb-4">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 px-4 pt-4">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-blue-400/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {textoHora}, {usuario.nombre}
                </h1>
                <div className="flex items-center gap-2 text-blue-100 mt-1 text-sm md:text-base">
                  {icono}
                  <span className="italic">{fraseMotivacional}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Widget de Resumen Inteligente CON Balance Real y Proyección */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-blue-500/30">
          
          {/* Balance REAL (Hasta Hoy) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                💰 Balance Real (Hasta Hoy - {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
              </h3>
              <div className="text-xs text-gray-400">
                Día {new Date().getDate()} de {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                <div className="text-xs text-green-300 mb-1">Ingresos</div>
                <div className="text-lg font-bold text-white">${totalIngresos.toLocaleString()}</div>
              </div>
              
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <div className="text-xs text-red-300 mb-1">Gastos</div>
                <div className="text-lg font-bold text-white">${totalGastosReales.toLocaleString()}</div>
              </div>
              
              <div className={`${saldoReal >= 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-orange-500/10 border-orange-500/30'} rounded-lg p-3 border`}>
                <div className={`text-xs ${saldoReal >= 0 ? 'text-cyan-300' : 'text-orange-300'} mb-1`}>Saldo Actual</div>
                <div className={`text-lg font-bold ${saldoReal >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                  ${saldoReal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Estado Financiero Actual */}
            <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
              {saldoReal > 0 ? (
                <>
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">😊</span>
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">¡Vas muy bien!</p>
                    <p className="text-xs text-gray-400">Tienes un superávit de ${Math.abs(saldoReal).toFixed(2)}</p>
                  </div>
                </>
              ) : saldoReal === 0 ? (
                <>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">😐</span>
                  </div>
                  <div>
                    <p className="text-yellow-400 font-semibold">En equilibrio</p>
                    <p className="text-xs text-gray-400">Ingresos = Gastos</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">😟</span>
                  </div>
                  <div>
                    <p className="text-orange-400 font-semibold">Atención</p>
                    <p className="text-xs text-gray-400">Déficit de ${Math.abs(saldoReal).toFixed(2)} hasta hoy</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-600 my-4"></div>

          {/* PROYECCIÓN (Fin de Mes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                📊 Proyección (Fin de Mes)
              </h3>
              <div className="text-xs text-gray-400">
                Faltan {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} días
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                <div className="text-xs text-green-300 mb-1">Esperados</div>
                <div className="text-sm font-bold text-gray-300">${ingresosProyectados.toFixed(0)}</div>
              </div>
              
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                <div className="text-xs text-red-300 mb-1">Pendientes</div>
                <div className="text-sm font-bold text-gray-300">${totalGastosProyectados.toFixed(0)}</div>
              </div>
              
              <div className={`${saldoProyectado >= 0 ? 'bg-purple-500/5 border-purple-500/20' : 'bg-red-500/5 border-red-500/20'} rounded-lg p-3 border`}>
                <div className={`text-xs ${saldoProyectado >= 0 ? 'text-purple-300' : 'text-red-300'} mb-1`}>Proyectado</div>
                <div className={`text-sm font-bold ${saldoProyectado >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                  ${saldoProyectado.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Mensaje de proyección */}
            {saldoProyectado < 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                <span className="text-yellow-400 text-xl">⚠️</span>
                <div className="text-xs text-yellow-300">
                  <p className="font-semibold mb-1">Alerta de Proyección</p>
                  <p className="text-gray-400">
                    Se espera un déficit de ${Math.abs(saldoProyectado).toFixed(2)} al finalizar el mes. 
                    Considera reducir gastos variables o aumentar ingresos.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Barra de progreso del mes */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso del mes</span>
              <span>{new Date().getDate()} de {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} días</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ 
                  width: `${(new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <CalendarioPagos 
          gastosFijos={gastosFijos}
          suscripciones={suscripciones}
          deudas={deudas}
          ingresos={ingresos}
          gastos={gastos}
        />

        {/* KPIs Reorganizados - VALORES REALES */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Resumen Financiero (Hasta Hoy)</h3>
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Real</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 border border-green-700/30">
              <div className="text-green-400 text-sm font-semibold mb-2">💵 INGRESOS</div>
              <div className="text-3xl font-bold text-white">
                ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl p-4 border border-red-700/30">
              <div className="text-red-400 text-sm font-semibold mb-2">💸 GASTOS</div>
              <div className="text-3xl font-bold text-white">
                ${totalGastosReales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Fijos pagados:</span>
                  <span>${totalGastosFijosReales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Variables:</span>
                  <span>${totalGastosVariablesReales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Suscripciones:</span>
                  <span>${totalSuscripcionesReales.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 rounded-xl p-4 border border-cyan-700/30">
              <div className="text-cyan-400 text-sm font-semibold mb-2">💰 DISPONIBLE</div>
              <div className={`text-3xl font-bold ${saldoReal >= 0 ? 'text-white' : 'text-red-400'}`}>
                ${saldoReal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-orange-400 text-xs font-semibold">📊 Tasa de Ahorro</span>
                  <span className={`text-lg font-bold ${tasaAhorroReal >= 20 ? 'text-green-400' : tasaAhorroReal >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {tasaAhorroReal}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${tasaAhorroReal >= 20 ? 'bg-green-500' : tasaAhorroReal >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.max(tasaAhorroReal, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-wrap gap-3 justify-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <button onClick={() => setShowModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Ingreso
          </button>
          <button onClick={() => setShowModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Gasto
          </button>
          <button onClick={() => setShowModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
            <Repeat className="w-4 h-4" /> Suscripción
          </button>
          <button onClick={() => setShowModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
            <CreditCard className="w-4 h-4" /> Tarjetas
          </button>
          <button onClick={() => setShowModal('lectorEstado')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm">
            <Upload className="w-4 h-4" /> Escanear
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" /> Alertas y Notificaciones
            </h3>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30">
              {alertas.length} Activas
            </span>
          </div>
          <Notificaciones alertas={alertas} onAlertClick={handleAlertClick} />
        </div>

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

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Mis Planes Activos</h2>
            <button 
              onClick={() => setShowSavingsPlanner(true)}
              className="text-sm bg-purple-600/20 text-purple-300 px-3 py-1 rounded hover:bg-purple-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4"/> Nuevo Plan
            </button>
          </div>
          <SavedPlansList refreshSignal={planUpdateCounter} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficaDona 
            data={dataGraficaDona} 
            onCategoryClick={() => setShowDetallesCategorias(true)}
          />
          <GraficaBarras data={dataGraficaBarras} title="📈 Tendencia Semanal" />
        </div>
 <ListaIngresos 
          ingresos={ingresos}
          onEditar={(ingreso) => {
            setIngresoEditando(ingreso);
            setShowModal('ingreso');
          }}
          onEliminar={handleEliminarIngreso}
        />
        
        {/* 🔹 MEJORA VISUAL: BOTONES ANIMADOS */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Gastos & Deudas</h3>
              <p className="text-xs text-gray-400">
                Accesos rápidos a tus categorías
              </p>
            </div>

            <button
             onClick={() => {
              setOverviewMode('ALL')
              setShowModal('gastosOverview')
            }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors border border-gray-600"
            >
              Ver todo
            </button>
          </div>

          {/* Grid de Botones Animados */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            
            {/* Deudas */}
            <div
                onClick={() => {
                    setOverviewMode('DEUDAS')
                    setShowModal('gastosOverview')
                }}
                className="group relative overflow-hidden
                bg-gray-700/30 border border-purple-500/30 hover:bg-purple-900/60 hover:border-purple-400
                rounded-2xl p-4
                cursor-pointer
                transform transition-all duration-300 ease-out
                hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20
                active:scale-95 active:translate-y-0
                "
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <ArrowRight className="absolute top-2 right-2 w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10%] group-hover:translate-x-0" />
                <div className="text-xs text-purple-300 font-medium mb-1 group-hover:text-purple-100 transition-colors">Deudas</div>
                <div className="text-2xl font-bold text-white">{deudas.length}</div>
              </div>
            </div>

            {/* Fijos */}
            <div
                onClick={() => {
                    setOverviewMode('FIJOS')
                    setShowModal('gastosOverview')
                }}
                className="group relative overflow-hidden
                bg-gray-700/30 border border-yellow-500/30 hover:bg-yellow-900/60 hover:border-yellow-400
                rounded-2xl p-4
                cursor-pointer
                transform transition-all duration-300 ease-out
                hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20
                active:scale-95 active:translate-y-0
                "
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <ArrowRight className="absolute top-2 right-2 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10%] group-hover:translate-x-0" />
                <div className="text-xs text-yellow-300 font-medium mb-1 group-hover:text-yellow-100 transition-colors">Fijos</div>
                <div className="text-2xl font-bold text-white">{gastosFijos.length}</div>
              </div>
            </div>

            {/* Variables */}
            <div
                onClick={() => {
                    setOverviewMode('VARIABLES')
                    setShowModal('gastosOverview')
                }}
                className="group relative overflow-hidden
                bg-gray-700/30 border border-red-500/30 hover:bg-red-900/60 hover:border-red-400
                rounded-2xl p-4
                cursor-pointer
                transform transition-all duration-300 ease-out
                hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20
                active:scale-95 active:translate-y-0
                "
            >
              <div className="relative z-10 flex flex-col items-center justify-center">
                <ArrowRight className="absolute top-2 right-2 w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-10%] group-hover:translate-x-0" />
                <div className="text-xs text-red-300 font-medium mb-1 group-hover:text-red-100 transition-colors">Variables</div>
                <div className="text-2xl font-bold text-white">{gastos.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block space-y-6">
          <ConfiguracionNotificaciones />
        </div>
      </div> 

    <Footer className="hidden md:block" />
       
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

           {/* ==============================
          MODAL OVERVIEW DE GASTOS & DEUDAS
          ============================== */}
{showModal === 'gastosOverview' && (
  <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center">
    <div className="
      bg-gray-900 w-full md:max-w-3xl
      h-[92vh] md:h-auto
      rounded-t-2xl md:rounded-2xl
      p-4 md:p-6
      overflow-y-auto
    ">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-white">
          💳 Gastos & Deudas
        </h2>
        <button
          onClick={() => setShowModal(null)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* --- TABS DE FILTRO --- */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-700">
        <button
          onClick={() => setOverviewMode('ALL')}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            overviewMode === 'ALL' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setOverviewMode('DEUDAS')}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            overviewMode === 'DEUDAS' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Deudas
        </button>
        <button
          onClick={() => setOverviewMode('FIJOS')}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            overviewMode === 'FIJOS' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Fijos
        </button>
        <button
          onClick={() => setOverviewMode('VARIABLES')}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            overviewMode === 'VARIABLES' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Variables
        </button>
        <button
          onClick={() => setOverviewMode('SUSCRIPCIONES')}
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            overviewMode === 'SUSCRIPCIONES' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Repeat className="w-4 h-4" /> Suscripciones
        </button>
      </div>

      {/* CONTENIDO REUTILIZADO */}
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ModuloCuentasBancarias
              cuentas={cuentas}
              onAgregar={addCuenta}
              onEditar={(cuenta) => {
                updateCuenta(cuenta.id, cuenta)
              }}
              onEliminar={deleteCuenta}
            />

            <div className="p-4">
              <button onClick={() => setShowModal(null)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'gastos' && (
        <ModalGastos
          onClose={() => {
            setShowModal(null)
            setGastoEditando(null)
            setGastoFijoEditando(null)
          }}
          onSaveVariable={handleGuardarGasto}
          onSaveFijo={handleGuardarGastoFijo}
          gastoInicial={gastoEditando || gastoFijoEditando}
        />
      )}

      {showModal === 'usuario' && (
        <ModalUsuario
          usuario={usuario}
          preferencias={preferenciasUsuario}
          onChangePreferencias={setPreferenciasUsuario}
          onClose={() => setShowModal(null)}
          onLogout={() => {
            localStorage.clear();
            window.location.href = "/auth";
          }}
        />
      )}

    {/* MODAL DE SUSCRIPCION */}
       {showModal === 'suscripcion' && (
        <ModalSuscripcion 
          key={suscripcionEditando?.id}
          onClose={() => { setShowModal(null); setSuscripcionEditando(null) }} 
          onSave={handleGuardarSuscripcion}
          suscripcionInicial={suscripcionEditando}
        />
      )}
      
      {showModal === 'tarjetas' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Gestión de Tarjetas</h2>
            <div className="space-y-3">
              <button onClick={() => setShowModal('agregarDeuda')} className="w-full p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors">📝 Registrar Tarjeta/Deuda</button>
              <button onClick={() => setShowModal('pagoTarjeta')} className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">💳 Pagar Tarjeta</button>
              <button onClick={() => setShowModal(null)} className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'pagoTarjeta' && (
        <ModalPagoTarjeta 
          onClose={() => setShowModal(null)} 
          onSave={handleRegistrarPagoTarjeta}
          deudas={deudas}
        />
      )}
      
      {showModal === 'agregarDeuda' && (
        <ModalAgregarDeuda 
          onClose={() => { setShowModal(null); setDeudaEditando(null) }} 
          onSave={handleGuardarDeuda}
          deudaInicial={deudaEditando}
        />
      )}
      
      {showModal === 'lectorEstado' && (
        <LectorEstadoCuenta
          onClose={() => setShowModal(null)}
          onTransaccionesExtraidas={(transacciones) => {
            transacciones.forEach(trans => {
              if (trans.tipo === 'ingreso') {
                addIngreso({
                  fecha: trans.fecha,
                  fuente: trans.descripcion,
                  descripcion: 'Extraído de estado de cuenta',
                  monto: trans.monto
                })
              } else {
                addGasto({
                  fecha: trans.fecha,
                  categoria: trans.categoria,
                  descripcion: trans.descripcion,
                  monto: trans.monto,
                  metodo: 'Tarjeta'
                })
              }
            })
            alert(`✅ ${transacciones.length} transacciones agregadas exitosamente!`)
          }}
        />
      )}

      {showModal === 'configuracion' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Configuración</h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <ConfiguracionNotificaciones />
          </div>
        </div>
      )}
      
      {showModal === 'notificaciones' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Todas las Alertas</h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <Notificaciones alertas={alertas} onAlertClick={handleAlertClick} />
          </div>
        </div>
      )}

      {showDetallesCategorias && (
        <ModalDetallesCategorias
          gastosPorCategoria={gastosPorCategoria}
          gastosFijos={gastosFijos}
          gastosVariables={gastos}
          suscripciones={suscripciones}
          onClose={() => setShowDetallesCategorias(false)}
        />
      )}

      {showDebtPlanner && (
        <DebtPlannerModal
          deudas={deudas}
          kpis={kpis}
          onClose={() => setShowDebtPlanner(false)}
          onPlanGuardado={handlePlanGuardado}
        />
      )}

      {showSavingsPlanner && (
        <SavingsPlannerModal
          kpis={kpis}
          onClose={() => setShowSavingsPlanner(false)}
          onPlanGuardado={handlePlanGuardado}
        />
      )}

      {showSpendingControl && (
        <SpendingControlModal
          gastosFijos={gastosFijos}
          gastosVariables={gastos}
          suscripciones={suscripciones}
          kpis={kpis}
          onClose={() => setShowSpendingControl(false)}
          onPlanGuardado={handlePlanGuardado}
        />
      )}

      <div className="hidden md:block">
        <MenuFlotante onIngresoCreado={addIngreso} onGastoCreado={addGasto} />
      </div>

      <MenuInferior 
        onOpenModal={setShowModal} 
        alertasCount={alertas.length} 
        nombreUsuario={usuario.nombre}
        onLogout={() => {
          localStorage.clear()
          window.location.href = '/auth'
        }}
      />
    </div>
  )
}

export default DashboardContent