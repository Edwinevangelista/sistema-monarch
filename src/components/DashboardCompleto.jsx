import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Bell, Sun, Moon, Coffee, ScanLine, X, ChevronRight, HelpCircle } from 'lucide-react'

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
import AsistenteFinancieroV2 from './AsistenteFinancieroV2' // ✅ REACTIVADO

import LogoutButton from './LogoutButton'
import ModalDetallesCategorias from './ModalDetallesCategorias'
import MenuInferior from './MenuInferior'
import ModalUsuario from './ModalUsuario'
import Footer from './Footer'
import ListaIngresos from './ListaIngresos'
import ModalDetalleUniversal from './ModalDetalleUniversal'
import CalendarioPagos from './CalendarioPagos'

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
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ============================================

export default function DashboardContent() {
  
  // --- ESTADOS PRINCIPALES ---
  const { cuentas, addCuenta, updateCuenta, deleteCuenta, refresh: refreshCuentas } = useCuentasBancarias()

  // ✅ OPTIMIZACIÓN: Cargar usuario instantáneamente desde localStorage
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario_finguide');
    return guardado ? JSON.parse(guardado) : {
      email: 'usuario@ejemplo.com',
      nombre: 'finguide User'
    };
  });

  const [overviewMode, setOverviewMode] = useState('ALL')
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(null)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)
  const [planUpdateCounter, setPlanUpdateCounter] = useState(0);

  // ✅ NUEVO: Estado para ocultar/mostrar menú móvil por inactividad
  const [mostrarMenuInferior, setMostrarMenuInferior] = useState(true)
  const inactivityTimerRef = useRef(null)

  // ✅ NUEVO: Estado para el Tutorial
  const [tutorialActivo, setTutorialActivo] = useState(false)
  const [pasoTutorial, setPasoTutorial] = useState(0)

  // Pasos del tutorial
  const pasosTutorialConfig = [
    {
      titulo: "¡Bienvenido a FinGuide! 👋",
      texto: "Aquí es donde controlas tus finanzas. Empecemos revisando tu estado actual.",
      target: "balance-widget"
    },
    {
      titulo: "Tu Balance en Tiempo Real ⚖️",
      texto: "Este widget te muestra cuánto has ingresado, gastado y cuánto te queda disponible hoy. ¡Míralo seguido!",
      target: "balance-widget"
    },
    {
      titulo: "Tus Gastos en Detalle 📊",
      texto: "Las gráficas te ayudan a ver en qué se va tu dinero. Toca la gráfica circular para ver detalles por categoría.",
      target: "graficas-section"
    },
    {
      titulo: "Agrega tus Movimientos ➕",
      texto: "Para registrar un ingreso o gasto, usa el botón '+' en el menú inferior. ¡Es muy rápido!",
      target: "boton-agregar"
    },
    {
      titulo: "¡Listo para empezar! 🚀",
      texto: "Ahora tienes el control. Si necesitas ayuda, toca el ícono de 'Perfil' en el menú.",
      target: null
    }
  ]

  // ✅ OPTIMIZACIÓN: Cargar historial instantáneamente desde localStorage
  const [movimientosBancarios, setMovimientosBancarios] = useState(() => {
    const guardado = localStorage.getItem('historial_bancarios_v2');
    return guardado ? JSON.parse(guardado) : [];
  });

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

  const hoy = useMemo(() => new Date(), [])
  const hoyStr = hoy.toISOString().split('T')[0]

  useInactivityTimeout(15)

  const { ingresos, addIngreso, updateIngreso, deleteIngreso } = useIngresos()
  const { gastos, addGasto, updateGasto, deleteGasto } = useGastosVariables()
  const { gastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } = useGastosFijos()
  const { suscripciones, addSuscripcion, updateSuscripcion, deleteSuscripcion } = useSuscripciones()
  const { deudas, updateDebt, refresh: refreshDeudas, deleteDebt } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()
  const { refresh: refreshPlanes } = usePlanesGuardados()
  const { permission, showLocalNotification } = useNotifications()

  // ✅ PUENTE DE ESTADO INSTANTÁNEO (Para evitar pantalla vacía al inicio)
  const [ingresosInstant, setIngresosInstant] = useState(() => {
    const cached = localStorage.getItem('ingresos_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [gastosInstant, setGastosInstant] = useState(() => {
    const cached = localStorage.getItem('gastos_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });

  const [gastosFijosInstant, setGastosFijosInstant] = useState(() => {
    const cached = localStorage.getItem('gastos_fijos_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });

  const [suscripcionesInstant, setSuscripcionesInstant] = useState(() => {
    const cached = localStorage.getItem('suscripciones_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });

  const [deudasInstant, setDeudasInstant] = useState(() => {
    const cached = localStorage.getItem('deudas_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });

  // --- EFECTOS DE SINCRONIZACIÓN ---
  // Cuando los hooks llegan de BD, actualizan los estados instantáneos y el caché
  useEffect(() => {
    if (ingresos.length > 0) {
      setIngresosInstant(ingresos);
      localStorage.setItem('ingresos_cache_v2', JSON.stringify(ingresos));
    }
  }, [ingresos]);

  useEffect(() => {
    if (gastos.length > 0) {
      setGastosInstant(gastos);
      localStorage.setItem('gastos_cache_v2', JSON.stringify(gastos));
    }
  }, [gastos]);

  useEffect(() => {
    if (gastosFijos.length > 0) {
      setGastosFijosInstant(gastosFijos);
      localStorage.setItem('gastos_fijos_cache_v2', JSON.stringify(gastosFijos));
    }
  }, [gastosFijos]);

  useEffect(() => {
    if (suscripciones.length > 0) {
      setSuscripcionesInstant(suscripciones);
      localStorage.setItem('suscripciones_cache_v2', JSON.stringify(suscripciones));
    }
  }, [suscripciones]);

  useEffect(() => {
    if (deudas.length > 0) {
      setDeudasInstant(deudas);
      localStorage.setItem('deudas_cache_v2', JSON.stringify(deudas));
    }
  }, [deudas]);

  // ✅ FUNCIÓN: Auto-ocultar menú inferior (Solo móvil)
  useEffect(() => {
    const resetTimer = () => {
      setMostrarMenuInferior(true)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        setMostrarMenuInferior(false)
      }, 4000) // Se oculta después de 4 segundos de inactividad
    }

    // Detectar eventos de usuario
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)

    resetTimer() // Iniciar timer al montar

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
    }
  }, [])

  // ✅ FUNCIÓN: Inicializar Tutorial
  useEffect(() => {
    const tutorialVisto = localStorage.getItem('finguide_tutorial_visto_v2')
    if (!tutorialVisto) {
      // Pequeño delay para que la app cargue
      setTimeout(() => {
        setTutorialActivo(true)
      }, 1500)
    }
  }, [])

  const cerrarTutorial = () => {
    setTutorialActivo(false)
    localStorage.setItem('finguide_tutorial_visto_v2', 'true')
  }

  const siguientePasoTutorial = () => {
    if (pasoTutorial < pasosTutorialConfig.length - 1) {
      setPasoTutorial(prev => prev + 1)
    } else {
      cerrarTutorial()
    }
  }

  // ✅ FUNCIÓN OPTIMIZADA: Actualizar historial
  const actualizarHistorial = (nuevoMovimiento) => {
    setMovimientosBancarios(prev => {
      const nuevo = [nuevoMovimiento, ...prev];
      localStorage.setItem('historial_bancarios_v2', JSON.stringify(nuevo));
      return nuevo;
    });
  };

  // ✅ SINCRONIZACIÓN INTELIGENTE: Solo limpia borrados
  useEffect(() => {
    if (movimientosBancarios.length === 0) return
    
    const idsActivos = new Set()
    
    ingresos?.forEach(ing => ing.cuenta_id && idsActivos.add(`ing-${ing.id}`))
    gastos?.forEach(g => g.cuenta_id && idsActivos.add(`gasto-var-${g.id}`))
    gastosFijos?.forEach(gf => gf.cuenta_id && idsActivos.add(`gasto-fijo-${gf.id}`))
    suscripciones?.forEach(sub => sub.cuenta_id && idsActivos.add(`sub-${sub.id}`))
    
    setMovimientosBancarios(prev => {
      const filtrado = prev.filter(m => idsActivos.has(m.id) || m.tipo === 'transferencia' || m.tipo === 'ajuste')
      
      if (filtrado.length !== prev.length) {
        localStorage.setItem('historial_bancarios_v2', JSON.stringify(filtrado))
        return filtrado
      }
      
      return prev
    })
  }, [ingresos, gastos, gastosFijos, suscripciones, movimientosBancarios.length])

  // ============================================
  // MANEJADORES DE DATOS
  // ============================================

  const handleOpenDetail = (item, type) => {
    let status = null
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

  const handlePagarUniversal = async (item, type) => {
    if (type === ITEM_TYPES.DEUDA) {
      setItemSeleccionado(null)
      setDeudaEditando(item)
      setShowModal('pagoTarjeta')
      return
    }
    if (type === ITEM_TYPES.FIJO) {
      await handleGuardarGastoFijo({ ...item, estado: 'Pagado' })
      setItemSeleccionado(null)
      return
    }
    if (type === ITEM_TYPES.SUSCRIPCION) {
      await handlePagoManual(item)
      setItemSeleccionado(null)
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
      console.log('💾 Guardando ingreso:', data)
      
      if (data.id) {
        await updateIngreso(data.id, data)
        console.log('✅ Ingreso actualizado')
      } else {
        const nuevoIngreso = await addIngreso(data)
        console.log('✅ Ingreso creado:', nuevoIngreso)
        
        if (data.cuenta_id && data.monto > 0) {
          const cuenta = cuentas.find(c => c.id === data.cuenta_id)
          if (cuenta) {
            const nuevoBalance = Number(cuenta.balance) + Number(data.monto)
            await updateCuenta(cuenta.id, { balance: nuevoBalance })
            console.log('✅ Saldo actualizado:', nuevoBalance)
            
            await registrarMovimientoEnHistorial({
              tipo: 'ingreso',
              monto: Number(data.monto),
              ref: `Ingreso: ${data.fuente || 'General'}`,
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre
            })
            console.log('✅ Movimiento registrado en historial')
          }
        }
      }
      
      setShowModal(null)
      setIngresoEditando(null)
      
    } catch (e) {
      console.error('❌ Error al guardar ingreso:', e)
      alert('Error al guardar el ingreso: ' + e.message)
    }
  }

  const registrarMovimientoEnHistorial = async (movimiento) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('⚠️ No hay usuario autenticado')
        return
      }

      const movimientoData = {
        user_id: user.id,
        tipo: movimiento.tipo,
        monto: Number(movimiento.monto),
        descripcion: movimiento.ref,
        cuenta_id: movimiento.cuentaId || null,
        cuenta_nombre: movimiento.cuentaNombre || null,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('movimientos_bancarios')
        .insert([movimientoData])
        .select()
        .single()

      if (error) {
        console.error('❌ Error en BD:', error.message)
        guardarEnLocalStorage(movimiento)
      } else {
        console.log('✅ Movimiento guardado en BD:', data.id)
        guardarEnLocalStorage({
          ...data,
          fecha: new Date(data.created_at).toLocaleString('es-MX'),
          ref: data.descripcion
        })
      }
    } catch (err) {
      console.error('❌ Error en registrarMovimientoEnHistorial:', err)
      guardarEnLocalStorage(movimiento)
    }
  }

  const guardarEnLocalStorage = (movimiento) => {
    try {
      const historialActual = JSON.parse(localStorage.getItem('historial_bancarios_v2') || '[]')
      const movimientoConFecha = {
        ...movimiento,
        id: movimiento.id || Date.now(),
        fecha: movimiento.fecha || new Date().toLocaleString('es-MX', { 
          day: '2-digit', 
          month: 'short', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      localStorage.setItem('historial_bancarios_v2', JSON.stringify([movimientoConFecha, ...historialActual]))
      console.log('💾 Guardado en localStorage')
    } catch (err) {
      console.error('Error en localStorage:', err)
    }
  }

  const handleGuardarGasto = async (data) => {
    try {
      if (!data.fecha) data.fecha = hoyStr
      
      if (data.id) {
        await updateGasto(data.id, data)
        console.log('✅ Gasto actualizado')
      } else {
        await addGasto(data)
        console.log('✅ Gasto creado')
        
        if (data.cuenta_id && data.monto > 0) {
          const cuenta = cuentas.find(c => c.id === data.cuenta_id)
          if (cuenta) {
            const nuevoBalance = Number(cuenta.balance) - Number(data.monto)
            await updateCuenta(cuenta.id, { balance: nuevoBalance })
            console.log('💳 Saldo actualizado:', cuenta.nombre, '→', nuevoBalance)
            
            await registrarMovimientoEnHistorial({
              tipo: 'gasto',
              monto: Number(data.monto),
              ref: `Gasto: ${data.descripcion || data.categoria || 'Variable'}`,
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre
            })
          }
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
      let mostrarEnHistorial = false
      
      if (data.id) {
        const { id, ...payload } = data
        await updateGastoFijo(id, payload)
        if (payload.estado === 'Pagado') mostrarEnHistorial = true
      } else {
        await addGastoFijo(data)
        if (data.estado === 'Pagado') mostrarEnHistorial = true
      }
      
      if (mostrarEnHistorial && data.cuenta_id && data.monto > 0) {
        const cuenta = cuentas.find(c => c.id === data.cuenta_id)
        if (cuenta) {
          const nuevoBalance = Number(cuenta.balance) - Number(data.monto)
          await updateCuenta(cuenta.id, { balance: nuevoBalance })
          console.log('💳 Saldo actualizado:', cuenta.nombre, '→', nuevoBalance)
          
          await registrarMovimientoEnHistorial({
            tipo: 'gasto',
            monto: Number(data.monto),
            ref: `Gasto Fijo: ${data.nombre}`,
            cuentaId: cuenta.id,
            cuentaNombre: cuenta.nombre
          })
        }
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
      if (!cuenta) return
      
      const nuevoBalance = Number(cuenta.balance) - Number(sub.costo)
      await updateCuenta(cuenta.id, { balance: nuevoBalance })
      
      await addGasto({
        fecha: hoyStr,
        monto: sub.costo,
        categoria: '📅 Suscripciones',
        descripcion: `Pago Manual: ${sub.servicio}`,
        cuenta_id: cuenta.id,
        metodo: 'Manual'
      })
      
      await registrarMovimientoEnHistorial({
        tipo: 'gasto',
        monto: Number(sub.costo),
        ref: `Suscripción (Manual): ${sub.servicio}`,
        cuentaId: cuenta.id,
        cuentaNombre: cuenta.nombre
      })

      const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
      if (updateSuscripcion) {
        await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago })
      }
      
      alert('✅ Pago registrado correctamente.')
    } catch (error) {
      console.error('❌ Error en pago manual:', error)
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
  }

  const handleRegistrarPagoTarjeta = async (pago) => {
    try {
      const deuda = deudasInstant.find(d => d.id === pago.deuda_id)
      if (!deuda) throw new Error('Deuda no encontrada')

      const principal = Number(pago.a_principal || 0)
      const intereses = Number(pago.intereses || 0)
      const total = Number(pago.monto_total || 0)

      if (principal > deuda.saldo) {
        alert(`El pago a capital ($${principal.toFixed(2)}) no puede ser mayor al saldo pendiente ($${deuda.saldo.toFixed(2)}).`)
        return
      }

      if (pago.metodo === 'Débito' && pago.cuenta_id) {
        const cuenta = cuentas.find(c => c.id === pago.cuenta_id)
        if (!cuenta) {
          alert('❌ Cuenta bancaria no encontrada')
          return
        }

        if (Number(cuenta.balance) < total) {
          alert(`❌ Fondos insuficientes\n\nSaldo: $${Number(cuenta.balance).toFixed(2)}\nRequerido: $${total.toFixed(2)}`)
          return
        }

        const nuevoBalance = Number(cuenta.balance) - total
        await updateCuenta(cuenta.id, { balance: nuevoBalance })
        
        await registrarMovimientoEnHistorial({
          tipo: 'pago',
          monto: total,
          ref: `Pago Tarjeta: ${deuda.cuenta}`,
          cuentaId: cuenta.id,
          cuentaNombre: cuenta.nombre
        })
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

      const nuevoSaldo = Math.max(0, Number(deuda.saldo) - principal)
      
      await updateDebt(deuda.id, {
        saldo: nuevoSaldo,
        ultimo_pago: pago.fecha,
      })

      await refreshPagos()
      await refreshDeudas()
      if (pago.cuenta_id) await refreshCuentas()

      alert('✅ Pago registrado correctamente')
      
      setShowModal(null)
      setDeudaEditando(null)

    } catch (err) {
      console.error('❌ Error registrando pago:', err)
      alert('Error registrando el pago: ' + (err.message || 'Error desconocido'))
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

  const totalIngresos = useMemo(() => ingresosInstant.reduce((sum, i) => sum + validarMonto(i.monto), 0), [ingresosInstant])
  
  const overviewData = useMemo(() => ({
    deudas: overviewMode === 'DEUDAS' || overviewMode === 'ALL' ? deudasInstant : [],
    suscripciones: overviewMode === 'SUSCRIPCIONES' || overviewMode === 'ALL' ? suscripcionesInstant : [],
    gastosFijos: overviewMode === 'FIJOS' || overviewMode === 'ALL' ? gastosFijosInstant : [],
    gastosVariables: overviewMode === 'VARIABLES' || overviewMode === 'ALL' ? gastosInstant : [],
  }), [overviewMode, deudasInstant, suscripcionesInstant, gastosFijosInstant, gastosInstant])

  const deudaPagadaEsteMes = (deudaId) => {
    return pagos?.some(p => {
      const f = new Date(p.fecha)
      return p.deuda_id === deudaId && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    })
  }

  const totalGastosFijosReales = useMemo(() => 
    gastosFijosInstant.reduce((sum, gf) => {
      if (!gf.dia_venc) return sum
      const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
      if (diaVenc <= hoy) return sum + validarMonto(gf.monto)
      return sum
    }, 0), 
    [gastosFijosInstant, hoy]
  )

  const totalGastosVariablesReales = useMemo(() => 
    gastosInstant.filter(g => g.fecha <= hoyStr).reduce((sum, g) => sum + validarMonto(g.monto), 0), 
    [gastosInstant, hoyStr]
  )

  const totalSuscripcionesReales = useMemo(() => 
    suscripcionesInstant
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
      }, 0), 
    [suscripcionesInstant, hoy]
  )

  const totalGastosReales = totalGastosFijosReales + totalGastosVariablesReales + totalSuscripcionesReales
  const saldoReal = totalIngresos - totalGastosReales
  const tasaAhorroReal = (totalIngresos > 0 ? ((totalIngresos - totalGastosReales) / totalIngresos) * 100 : 0)

  useEffect(() => {
    let mounted = true
    const processAutopago = async () => {
      if (!mounted || suscripcionesInstant.length === 0) return

      for (const sub of suscripcionesInstant) {
        if (sub.estado !== 'Activo' || !sub.autopago || !sub.cuenta_id || sub.proximo_pago !== hoyStr) continue

        const cuenta = cuentas.find(c => c.id === sub.cuenta_id)
        if (!cuenta) continue

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
          
          actualizarHistorial({
            id: Date.now(),
            tipo: 'gasto',
            monto: Number(sub.costo),
            ref: `Suscripción: ${sub.servicio}`,
            fecha: hoyStr,
            cuentaId: cuenta.id,
            cuentaNombre: cuenta.nombre
          })

          const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo)
          if (updateSuscripcion) {
            await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago })
          }
        } catch (error) {
          console.error("Error en autopago:", error)
        }
      }
    }

    const timeoutId = setTimeout(processAutopago, 1000)
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
   }, [suscripcionesInstant, cuentas, hoyStr, addGasto, updateCuenta, updateSuscripcion])

  useEffect(() => {
    if (usuario.email) {
      const nombre = usuario.email.split('@')[0]
      setUsuario(prev => ({ ...prev, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1) }))
    }
  }, [usuario.email])

  useEffect(() => {
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferenciasUsuario));
  }, [preferenciasUsuario]);

  const alertas = useMemo(() => {
    const listaAlertas = []
    
    gastosFijosInstant.forEach(gf => {
      if (gf.estado === 'Pagado' || !gf.dia_venc) return
      const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
      const diff = Math.round((diaVenc - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 0) listaAlertas.push({ tipo: 'critical', mensaje: `⚠️ ${gf.nombre} está vencido.`, mensajeCorto: `${gf.nombre} - VENCIDO`, monto: gf.monto, tipoItem: ITEM_TYPES.FIJO, item: gf })
      else if (diff <= 5) listaAlertas.push({ tipo: 'warning', mensaje: `📅 ${gf.nombre} vence ${diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${gf.nombre} - ${diff} días`, monto: gf.monto, tipoItem: ITEM_TYPES.FIJO, item: gf })
    })
    
    suscripcionesInstant.forEach(sub => {
      if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
      const proxPago = new Date(sub.proximo_pago)
      const diff = Math.round((proxPago - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 3 && diff >= 0) listaAlertas.push({ tipo: 'info', mensaje: `🔄 ${sub.servicio} se renovará ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${sub.servicio} - Renueva`, monto: sub.costo, tipoItem: ITEM_TYPES.SUSCRIPCION, item: sub })
    })
    
    deudasInstant.forEach(d => {
      if (!d.vence) return
      const vence = new Date(d.vence)
      const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 5 && diff >= 0) listaAlertas.push({ tipo: 'warning', mensaje: `💳 Pago de ${d.cuenta} vence ${diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`}.`, mensajeCorto: `${d.cuenta} - ${diff}d`, monto: d.pago_minimo, tipoItem: ITEM_TYPES.DEUDA, item: d })
    })
    
    return listaAlertas
  }, [gastosFijosInstant, suscripcionesInstant, deudasInstant, hoy])

  useEffect(() => {
    if (permission === 'granted' && alertas.length > 0) {
      const hoyDateStr = hoy.toDateString()
      const ultimaAlertaEnviada = localStorage.getItem('ultima_alerta_notificacion_fecha')
      if (ultimaAlertaEnviada !== hoyDateStr) {
        const alertaCritica = alertas.find(a => a.tipo === 'critical') || alertas[0]
        showLocalNotification('⚠️ Alertas financieras', { body: `${alertaCritica.mensaje}`, data: { url: '/' } })
        localStorage.setItem('ultima_alerta_notificacion_fecha', hoyDateStr)
      }
    }
    }, [alertas, permission, hoy, showLocalNotification])

  const gastosPorCategoria = useMemo(() => {
    const categorias = {}
    ;[...gastosFijosInstant, ...gastosInstant, ...suscripcionesInstant.filter(s => s.estado === 'Activo')].forEach(item => {
      const cat = item.categoria || '📦 Otros'
      const monto = validarMonto(item.monto || item.costo)
      categorias[cat] = (categorias[cat] || 0) + monto
    })
    return categorias
  }, [gastosFijosInstant, gastosInstant, suscripcionesInstant])

  const dataGraficaDona = useMemo(() => 
    Object.entries(gastosPorCategoria).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    [gastosPorCategoria]
  )

   const { textoHora, icono, frase } = useMemo(() => {
    const hora = new Date().getHours()
    const texto = hora >= 5 && hora < 12 ? 'Buenos días' 
                : hora >= 12 && hora < 19 ? 'Buenas tardes' 
                : 'Buenas noches';
    
    let icono = null
    if (hora >= 5 && hora < 12) { icono = <Sun className="w-6 h-6 text-yellow-400" /> }
    else if (hora >= 12 && hora < 19) { icono = <Coffee className="w-6 h-6 text-orange-400" /> }
    else { icono = <Moon className="w-6 h-6 text-indigo-400" /> }

    const frases = saldoReal > 0 
      ? ["¡Excelente gestión!", "¡Vas muy bien!", "Tu esfuerzo funciona"]
      : saldoReal === 0
      ? ["Estás en equilibrio.", "¡Bien hecho!", "Controlando finanzas"]
      : ["No te desanimes.", "Pequeños cambios.", "Tomando control"]

    const frase = frases[Math.floor(Math.random() * frases.length)]
    return { textoHora: texto, icono, frase }
  }, [saldoReal])

  const kpis = {
    totalIngresos,
    totalGastos: totalGastosReales,
    totalGastosFijos: totalGastosFijosReales,
    totalGastosVariables: totalGastosVariablesReales,
    totalSuscripciones: totalSuscripcionesReales,
    saldo: saldoReal,
    tasaAhorro: parseFloat(tasaAhorroReal || 0) / 100,
    totalDeudas: deudasInstant.reduce((sum, d) => sum + validarMonto(d.balance), 0)
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pb-20 md:pb-4 relative">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 px-3 md:px-4 pt-3 md:pt-4">
        <div className="bg-blue-600/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl border border-blue-400/20 flex justify-between items-center">
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
          <div className="flex items-center gap-2">
             <button 
               onClick={() => {
                 setTutorialActivo(true)
                 setPasoTutorial(0)
               }}
               className="p-2 bg-blue-500/30 rounded-full hover:bg-blue-500/50 text-white transition"
               title="Repetir Tutorial"
             >
               <HelpCircle className="w-5 h-5" />
             </button>
             <div className="hidden md:block"><LogoutButton /></div>
          </div>
        </div>
      </div>

      {/* WIDGET DE RESUMEN */}
      <div id="balance-widget" className="max-w-7xl mx-auto px-3 md:px-4 mb-4 md:mb-6">
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
          key={JSON.stringify(suscripcionesInstant.map(s => s.proximo_pago))}
          gastosFijos={gastosFijosInstant}
          suscripciones={suscripcionesInstant}
          deudas={deudasInstant}
          ingresos={ingresosInstant}
          gastos={gastosInstant}
        />

        {/* BOTONES DE ACCIÓN (Desktop) */}
        <div className="hidden md:flex flex-wrap gap-3 justify-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <button onClick={() => setShowModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm touch-manipulation"><Plus className="w-4 h-4" /> Ingreso</button>
          <button onClick={() => setShowModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm touch-manipulation"><Plus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => setShowModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm touch-manipulation"><Repeat className="w-4 h-4" /> Suscripción</button>
          <button onClick={() => setShowModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm touch-manipulation"><CreditCard className="w-4 h-4" /> Tarjetas</button>
          <button onClick={() => setShowModal('lectorEstado')} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm touch-manipulation border border-gray-500"><ScanLine className="w-4 h-4" /> Escanear PDF</button>
        </div>

        {/* NOTIFICACIONES */}
        <div id="dashboard-alertas">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> Alertas
            </h3>
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] md:text-xs px-2 py-1 rounded-full border border-yellow-500/30">
              {alertas.length}
            </span>
          </div>
          <Notificaciones
            alertas={alertas}
            onAlertClick={(alerta) => {
              handleOpenDetail(alerta.item, alerta.tipoItem)
            }}
          />
        </div>

        {/* ✅ ASISTENTE FINANCIERO REACTIVADO */}
        <AsistenteFinancieroV2
          ingresos={ingresosInstant}
          gastosFijos={gastosFijosInstant}
          gastosVariables={gastosInstant}
          suscripciones={suscripcionesInstant}
          deudas={deudasInstant}
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
        <div id="graficas-section" className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <GraficaDona 
            data={dataGraficaDona} 
            onCategoryClick={() => setShowDetallesCategorias(true)} 
          />
          <GraficaBarras 
            ingresos={ingresosInstant}
            gastos={gastosInstant}
            gastosFijos={gastosFijosInstant}
            suscripciones={suscripcionesInstant}
          />
        </div>

        {/* INGRESOS */}
        <ListaIngresos 
          ingresos={ingresosInstant}
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
              <div className="text-xl md:text-2xl font-bold text-white">{deudasInstant.length}</div>
              <div className="text-[10px] md:text-xs text-purple-300">Deudas</div>
            </div>
            <div onClick={() => { setOverviewMode('FIJOS'); setShowModal('gastosOverview') }} className="group relative overflow-hidden bg-gray-700/30 border border-yellow-500/30 hover:bg-yellow-900/60 active:scale-95 rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer touch-manipulation">
              <div className="text-xl md:text-2xl font-bold text-white">{gastosFijosInstant.length}</div>
              <div className="text-[10px] md:text-xs text-yellow-300">Fijos</div>
            </div>
            <div onClick={() => { setOverviewMode('VARIABLES'); setShowModal('gastosOverview') }} className="group relative overflow-hidden bg-gray-700/30 border border-red-500/30 hover:bg-red-900/60 active:scale-95 rounded-xl md:rounded-2xl p-3 md:p-4 cursor-pointer touch-manipulation">
              <div className="text-xl md:text-2xl font-bold text-white">{gastosInstant.length}</div>
              <div className="text-[10px] md:text-xs text-red-300">Variables</div>
            </div>
          </div>
        </div>
      </div>

      <Footer className="hidden md:block" />

      {/* --- MODALES --- */}
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
            <ModuloCuentasBancarias 
              cuentas={cuentas} 
              onAgregar={addCuenta} 
              onEditar={(cuenta) => { updateCuenta(cuenta.id, cuenta) }} 
              onEliminar={deleteCuenta} 
              balanceTotal={kpis.saldo}
              listaMovimientosExternos={movimientosBancarios}
              onTransferenciaExitosa={refreshCuentas}
            />
            <div className="p-4"><button onClick={() => setShowModal(null)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl touch-manipulation">Cerrar</button></div>
          </div>
        </div>
      )}

      {showModal === 'gastos' && (
        <ModalGastos onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null) }} onSaveVariable={handleGuardarGasto} onSaveFijo={handleGuardarGastoFijo} gastoInicial={gastoEditando || gastoFijoEditando} />
      )}

      {showModal === 'usuario' && (
        <ModalUsuario 
          usuario={usuario} 
          preferencias={preferenciasUsuario} 
          onChangePreferencias={setPreferenciasUsuario} 
          onClose={() => setShowModal(null)} 
          onLogout={() => { localStorage.clear(); window.location.href = "/auth"; }}
          permission={permission}
          showLocalNotification={showLocalNotification}
        />
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
        <ModalPagoTarjeta 
          onClose={() => {
            setShowModal(null)
            setDeudaEditando(null)
          }} 
          onSave={handleRegistrarPagoTarjeta} 
          deudas={deudasInstant}
          deudaPreseleccionada={deudaEditando}
        />
      )}
      
      {showModal === 'agregarDeuda' && (
        <ModalAgregarDeuda onClose={() => { setShowModal(null); setDeudaEditando(null) }} onSave={handleGuardarDeuda} deudaInicial={deudaEditando} />
      )}

      {showModal === 'lectorEstado' && (
        <LectorEstadoCuenta onClose={() => setShowModal(null)} />
      )}

      {showDetallesCategorias && (
        <ModalDetallesCategorias gastosPorCategoria={gastosPorCategoria} gastosFijos={gastosFijosInstant} gastosVariables={gastosInstant} suscripciones={suscripcionesInstant} onClose={() => setShowDetallesCategorias(false)} />
      )}

      {showDebtPlanner && (
        <DebtPlannerModal deudas={deudasInstant} kpis={kpis} onClose={() => setShowDebtPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {showSavingsPlanner && (
        <SavingsPlannerModal kpis={kpis} onClose={() => setShowSavingsPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {showSpendingControl && (
        <SpendingControlModal gastosFijos={gastosFijosInstant} gastosVariables={gastosInstant} suscripciones={suscripcionesInstant} kpis={kpis} onClose={() => setShowSpendingControl(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      )}

      {/* --- TUTORIAL OVERLAY --- */}
      {tutorialActivo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-blue-500 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-bounce-in">
            <button 
              onClick={cerrarTutorial}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-blue-500/20 p-3 rounded-full mb-3">
                <HelpCircle className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {pasosTutorialConfig[pasoTutorial].titulo}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {pasosTutorialConfig[pasoTutorial].texto}
              </p>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={cerrarTutorial}
                className="text-xs text-gray-400 hover:text-gray-200 underline"
              >
                Saltar tutorial
              </button>
              <button 
                onClick={siguientePasoTutorial}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                {pasoTutorial === pasosTutorialConfig.length - 1 ? 'Entendido' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Indicador de pasos */}
            <div className="flex justify-center gap-2 mt-4">
              {pasosTutorialConfig.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === pasoTutorial ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MENÚ INFERIOR MÓVIL (AUTO-OCULTABLE) --- */}
      <div 
        id="boton-agregar"
        className={`fixed bottom-0 left-0 right-0 md:hidden transition-transform duration-300 z-40 ease-in-out ${
          mostrarMenuInferior || tutorialActivo ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <MenuInferior 
          onOpenModal={setShowModal} 
          alertasCount={alertas.length} 
          nombreUsuario={usuario.nombre} 
          onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }} 
        />
      </div>
    </div>
  )
}