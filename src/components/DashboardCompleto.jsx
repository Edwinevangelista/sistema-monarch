import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Bell, Sun, Moon, Coffee, ScanLine, X, ChevronRight, HelpCircle, Activity, Clock, Target } from 'lucide-react'
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

import LogoutButton from './LogoutButton'
import ModalDetallesCategorias from './ModalDetallesCategorias'
import MenuInferior from './MenuInferior'
import ModalUsuario from './ModalUsuario'
import Footer from './Footer'
import ListaIngresos from './ListaIngresos'
import ModalDetalleUniversal from './ModalDetalleUniversal'
import CalendarioPagos from './CalendarioPagos'
import WidgetBalanceDual from './WidgetBalanceDual'
// --- MODALES NUEVOS ---
import DebtPlannerModal from './DebtPlannerModal'
import SavingsPlannerModal from './SavingsPlannerModal'
import SpendingControlModal from './SpendingControlModal'
import { usePlanesGuardados } from '../hooks/usePlanesGuardados'
import SavedPlansList from './SavedPlansList'

import ListaGastosCompleta from './ListaGastosCompleta'
import { ITEM_TYPES } from '../constants/itemTypes'
import ModuloCuentasBancarias from './ModuloCuentasBancarias'
import ModalAlertas from './ModalAlertas'
import { usePlanExecution } from '../hooks/usePlanExecution';
import PlanExecutionWidget from './PlanExecutionWidget';
import PlanCheckInModal from './PlanCheckInModal';

// --- LIBRERÍA DE BD ---
import { supabase } from '../lib/supabaseClient'

// ============================================
// COMPONENTE PRINCIPAL DEL DASHBOARD (OPTIMIZADO)
// ============================================

export default function DashboardCompleto()  {
  
  // --- ESTADOS PRINCIPALES ---
  const { cuentas, addCuenta, updateCuenta, deleteCuenta, refresh: refreshCuentas } = useCuentasBancarias()

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

  // NUEVO: Estado para ocultar/mostrar menú móvil por inactividad
  const [mostrarMenuInferior, setMostrarMenuInferior] = useState(true)
  const inactivityTimerRef = useRef(null)

  // NUEVO: Estado para el Tutorial
  const [tutorialActivo, setTutorialActivo] = useState(false)
  const [pasoTutorial, setPasoTutorial] = useState(0)

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
 const { deudas, updateDeuda: updateDebt, refresh: refreshDeudas, deleteDeuda: deleteDebt } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()
  const { refresh: refreshPlanes } = usePlanesGuardados()
  const { planes, planesActivos } = usePlanesGuardados();

// Y obtén el plan de deudas activo:
const planDeudaActivo = useMemo(() => {
  if (!planesActivos || planesActivos.length === 0) return null;
  
  // Buscar un plan de tipo 'deudas' que esté activo
  const planDeuda = planesActivos.find(p => 
    p.tipo === 'deudas' && 
    p.activo && 
    !p.completado
  );
  
  return planDeuda || null;
}, [planesActivos]);
  const { permission, showLocalNotification } = useNotifications()
  // Hook de ejecución de plan de deudas


  // PUENTE DE ESTADO INSTANTÁNEO
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

  // FUNCIÓN: Auto-ocultar menú inferior
  useEffect(() => {
    const resetTimer = () => {
      setMostrarMenuInferior(true)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        setMostrarMenuInferior(false)
      }, 4000) 
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)

    resetTimer()

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
    }
  }, [])

  // FUNCIÓN: Inicializar Tutorial
  useEffect(() => {
    const tutorialVisto = localStorage.getItem('finguide_tutorial_visto_v2')
    if (!tutorialVisto) {
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

  // FUNCIÓN OPTIMIZADA: Actualizar historial
  const actualizarHistorial = (nuevoMovimiento) => {
    setMovimientosBancarios(prev => {
      const nuevo = [nuevoMovimiento, ...prev];
      localStorage.setItem('historial_bancarios_v2', JSON.stringify(nuevo));
      return nuevo;
    });
  };

  // SINCRONIZACIÓN INTELIGENTE: Solo limpia borrados
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
  // MANEJADORES DE DATOS (SIN CAMBIOS FUNCIONALES)
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

// ============================================
// 🎯 SISTEMA DUAL DE CÁLCULO: REAL vs PROYECTADO
// ============================================

// 📊 CÁLCULO REAL (Solo lo que ya pasó hasta hoy)
const calculosReales = useMemo(() => {
  console.log('💰 Calculando REAL (hasta hoy)...')
  
  // Ingresos que ya ocurrieron
  const ingresos = ingresosInstant
    .filter(i => new Date(i.fecha) <= hoy)
    .reduce((sum, i) => sum + validarMonto(i.monto), 0)
  
  // Gastos variables que ya ocurrieron
  const gastosVariables = gastosInstant
    .filter(g => new Date(g.fecha) <= hoy)
    .reduce((sum, g) => sum + validarMonto(g.monto), 0)
  
  // Gastos fijos cuya fecha de vencimiento ya pasó
  const gastosFijos = gastosFijosInstant.reduce((sum, gf) => {
    if (!gf.dia_venc) return sum
    const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
    if (diaVenc <= hoy) return sum + validarMonto(gf.monto)
    return sum
  }, 0)
  
  // Suscripciones que ya se cobraron este mes
  const suscripciones = suscripcionesInstant
    .filter(s => s.estado === 'Activo' && s.proximo_pago)
    .reduce((sum, s) => {
      const proxPago = new Date(s.proximo_pago)
      const costo = validarMonto(s.costo)
      if (proxPago <= hoy && proxPago.getMonth() === hoy.getMonth()) {
        if (s.ciclo === 'Anual') return sum + (costo / 12)
        return sum + costo
      }
      return sum
    }, 0)
  
  const totalGastos = gastosFijos + gastosVariables + suscripciones
  const saldo = ingresos - totalGastos
  const tasaAhorro = ingresos > 0 ? ((ingresos - totalGastos) / ingresos) * 100 : 0
  
  console.log('✅ REAL:', { ingresos, totalGastos, saldo, tasaAhorro: `${tasaAhorro.toFixed(1)}%` })
  
 return {
  totalIngresos: ingresos,  // ✅ NOMBRE CORRECTO
  gastosFijos,
  gastosVariables,
  suscripciones,
  totalGastos,
  saldo,
  tasaAhorro
}
}, [ingresosInstant, gastosInstant, gastosFijosInstant, suscripcionesInstant, hoy])

// 📈 CÁLCULO PROYECTADO (Cómo terminará el mes completo)
const calculosProyectados = useMemo(() => {
  console.log('🔮 Calculando PROYECCIÓN del mes...')
  
  // INGRESOS PROYECTADOS
  // 1. Sumar todos los ingresos ya registrados del mes
  const ingresosRegistrados = ingresosInstant
    .filter(i => {
      const fecha = new Date(i.fecha)
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    })
    .reduce((sum, i) => sum + validarMonto(i.monto), 0)
  
  // 2. Proyectar ingresos futuros basados en recurrencia
  let ingresosProyectados = ingresosRegistrados
  
  // Si hay ingresos con frecuencia definida, proyectar
  ingresosInstant.forEach(ing => {
    if (ing.frecuencia && ing.frecuencia !== 'Único') {
      const fechaIngreso = new Date(ing.fecha)
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
      const diasRestantes = ultimoDiaMes - hoy.getDate()
      
      if (ing.frecuencia === 'Semanal') {
        // Calcular cuántos cobros semanales faltan
        const cobrosRestantes = Math.floor(diasRestantes / 7)
        ingresosProyectados += validarMonto(ing.monto) * cobrosRestantes
      } else if (ing.frecuencia === 'Quincenal') {
        const diaQuincena = 15
        if (hoy.getDate() < diaQuincena && fechaIngreso.getDate() === diaQuincena) {
          ingresosProyectados += validarMonto(ing.monto)
        }
      }
      // Mensual ya está incluido en ingresosRegistrados
    }
  })
  
  // GASTOS PROYECTADOS
  // Todos los gastos fijos del mes
  const gastosFijos = gastosFijosInstant
    .reduce((sum, gf) => sum + validarMonto(gf.monto), 0)
  
  // Gastos variables: actuales + estimación basada en promedio diario
  const gastosVariablesActuales = gastosInstant
    .filter(g => {
      const fecha = new Date(g.fecha)
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    })
    .reduce((sum, g) => sum + validarMonto(g.monto), 0)
  
  const diasTranscurridos = hoy.getDate()
  const promedioDiario = diasTranscurridos > 0 ? gastosVariablesActuales / diasTranscurridos : 0
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasRestantes = ultimoDiaMes - hoy.getDate()
  
  const gastosVariablesProyectados = gastosVariablesActuales + (promedioDiario * diasRestantes)
  
  // Todas las suscripciones activas del mes
  const suscripciones = suscripcionesInstant
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      const costo = validarMonto(s.costo)
      if (s.ciclo === 'Anual') return sum + (costo / 12)
      if (s.ciclo === 'Semanal') return sum + (costo * 4) // Aproximación mensual
      return sum + costo
    }, 0)
  
  const totalGastos = gastosFijos + gastosVariablesProyectados + suscripciones
  const saldo = ingresosProyectados - totalGastos
  const tasaAhorro = ingresosProyectados > 0 ? ((ingresosProyectados - totalGastos) / ingresosProyectados) * 100 : 0
  
console.log('✅ PROYECTADO:', { 
  ingresos: ingresosProyectados, 
  totalGastos, 
  saldo, 
  tasaAhorro: `${tasaAhorro.toFixed(1)}%`,
  desglose: {
    ingresosRegistrados,
    ingresosProyectados,
    gastosFijos,
    gastosVariablesActuales,
    gastosVariablesProyectados,
    promedioDiario,
    diasRestantes
  }
})  // ← CIERRA EL console.log AQUÍ

return {
  totalIngresos: ingresosProyectados,  // ✅ NOMBRE CORRECTO
  gastosFijos,
  gastosVariables: gastosVariablesProyectados,
  suscripciones,
  totalGastos,
  saldo,
  tasaAhorro,
  desglose: {
    ingresosRegistrados,
    promedioDiarioGastos: promedioDiario,
    diasRestantes
  }
}
}, [ingresosInstant, gastosInstant, gastosFijosInstant, suscripcionesInstant, hoy])
// 📊 FILTRAR DATOS SEGÚN EL MODO DE VISTA SELECCIONADO
const overviewData = useMemo(() => {
  // Estructura base vacía
  const base = {
    deudas: [],
    gastosFijos: [],
    gastosVariables: [],
    suscripciones: []
  }
  
  // Si está en modo "VER TODO", mostrar todas las categorías
  if (overviewMode === 'ALL') {
    return {
      deudas: deudasInstant,
      gastosFijos: gastosFijosInstant,
      gastosVariables: gastosInstant,
      suscripciones: suscripcionesInstant
    }
  }
  
  // Si está en modo "DEUDAS", solo mostrar deudas
  if (overviewMode === 'DEUDAS') {
    return { ...base, deudas: deudasInstant }
  }
  
  // Si está en modo "FIJOS", solo mostrar gastos fijos
  if (overviewMode === 'FIJOS') {
    return { ...base, gastosFijos: gastosFijosInstant }
  }
  
  // Si está en modo "VARIABLES", solo mostrar gastos variables
  if (overviewMode === 'VARIABLES') {
    return { ...base, gastosVariables: gastosInstant }
  }
  
  // Si está en modo "SUSCRIPCIONES", solo mostrar suscripciones
  if (overviewMode === 'SUSCRIPCIONES') {
    return { ...base, suscripciones: suscripcionesInstant }
  }
  
  // Por defecto, retornar estructura vacía
  return base
}, [overviewMode, deudasInstant, gastosFijosInstant, gastosInstant, suscripcionesInstant])

// 💳 CALCULAR TOTAL PAGADO A TARJETAS DE CRÉDITO ESTE MES
// SET de deudas con pagos este mes
const deudasPagadasEsteMesSet = useMemo(() => {
  const pagosDelMes = pagos.filter(p => {
    const fechaPago = new Date(p.fecha)
    return fechaPago.getMonth() === hoy.getMonth() && 
           fechaPago.getFullYear() === hoy.getFullYear()
  })
  return new Set(pagosDelMes.map(p => p.deuda_id))
}, [pagos, hoy])

// FUNCIÓN para verificar si una deuda específica tiene pago este mes
const deudaPagadaEsteMes = useMemo(() => {
  return (deudaId) => deudasPagadasEsteMesSet.has(deudaId)
}, [deudasPagadasEsteMesSet])
// Estado para toggle entre vista REAL y PROYECTADA
const [vistaActiva, setVistaActiva] = useState('real') // 'real' o 'proyectado'

// Datos activos según la vista seleccionada
const datosActivos = vistaActiva === 'real' ? calculosReales : calculosProyectados

// COMPATIBILIDAD: Mantener variables antiguas pero con nuevo sistema
const totalIngresos = datosActivos.ingresos
const totalGastosReales = datosActivos.totalGastos
const totalGastosFijosReales = datosActivos.gastosFijos
const totalGastosVariablesReales = datosActivos.gastosVariables
const totalSuscripcionesReales = datosActivos.suscripciones
const saldoReal = datosActivos.saldo
const tasaAhorroReal = datosActivos.tasaAhorro
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
  
  // 1. Gastos Fijos
  gastosFijosInstant.forEach(gf => {
    if (gf.estado === 'Pagado' || !gf.dia_venc) return
    const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
    const diff = Math.ceil((diaVenc - hoy) / (1000 * 60 * 60 * 24))
    
    if (diff <= 5) {
      const mensaje = diff < 0 
        ? `⚠️ ${gf.nombre} venció hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}.`
        : diff === 0 
        ? `⚠️ ${gf.nombre} vence hoy.`
        : `⚠️ ${gf.nombre} vence en ${diff} día${diff !== 1 ? 's' : ''}.`
      
      listaAlertas.push({ 
        tipo: diff <= 0 ? 'critical' : 'warning', 
        mensaje, 
        mensajeCorto: `${gf.nombre}`, 
        monto: gf.monto, 
        tipoItem: ITEM_TYPES.FIJO, 
        item: gf,
        dias: diff
      })
    }
  })
  
  // 2. Suscripciones
  suscripcionesInstant.forEach(sub => {
    if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
    const proxPago = new Date(sub.proximo_pago)
    const diff = Math.ceil((proxPago - hoy) / (1000 * 60 * 60 * 24))
    
    if (diff <= 5) {
      const mensaje = diff < 0 
        ? `🔄 ${sub.servicio} venció hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}.`
        : diff === 0 
        ? `🔄 ${sub.servicio} se renueva hoy.`
        : `🔄 ${sub.servicio} se renovará en ${diff} día${diff !== 1 ? 's' : ''}.`
      
      listaAlertas.push({ 
        tipo: diff <= 0 ? 'critical' : 'info', 
        mensaje, 
        mensajeCorto: `${sub.servicio}`, 
        monto: sub.costo, 
        tipoItem: ITEM_TYPES.SUSCRIPCION, 
        item: sub,
        dias: diff
      })
    }
  })
  
  // 3. Deudas
  deudasInstant.forEach(d => {
    if (!d.vence) return
    const vence = new Date(d.vence)
    const diff = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
    
    if (diff <= 5) {
      const mensaje = diff < 0 
        ? `💳 Pago de ${d.cuenta} venció hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}.`
        : diff === 0 
        ? `💳 Pago de ${d.cuenta} vence hoy.`
        : `💳 Pago de ${d.cuenta} vence en ${diff} día${diff !== 1 ? 's' : ''}.`
      
      listaAlertas.push({ 
        tipo: diff <= 0 ? 'critical' : 'warning', 
        mensaje, 
        mensajeCorto: `${d.cuenta}`, 
        monto: d.pago_minimo, 
        tipoItem: ITEM_TYPES.DEUDA, 
        item: d,
        dias: diff
      })
    }
  })
  
  // ✅ ORDENAMIENTO: Vencidos primero (más negativos), luego por vencer
  return listaAlertas.sort((a, b) => a.dias - b.dias)
  
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

  // --- LÓGICA DE INTELIGENCIA FINANCIERA (NUEVO) ---
  const financialHealth = useMemo(() => {
    let score = 60;
    const tasaAhorroNum = (totalIngresos - totalGastosReales) / (totalIngresos || 1);
    const deudaTotal = deudasInstant.reduce((sum, d) => sum + (d.saldo || 0), 0);
    
    // Ahorro positivo sube score
    if (tasaAhorroNum > 0.2) score += 20;
    else if (tasaAhorroNum > 0.1) score += 10;
    else score -= 10;
    
    // Deudas altas bajan score
    if (deudaTotal > totalIngresos * 3) score -= 20;
    
    // Score entre 0 y 100
    return Math.max(0, Math.min(100, score));
  }, [totalIngresos, totalGastosReales, deudasInstant]);

  const dailyBudget = useMemo(() => {
    const diasRestantes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate() + 1;
    if (saldoReal <= 0 || diasRestantes <= 0) return 0;
    return Math.floor(saldoReal / diasRestantes);
  }, [saldoReal, hoy]);

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
    totalDeudas: deudasInstant.reduce((sum, d) => sum + validarMonto(d.balance), 0),
    financialHealth,
    dailyBudget
  }

  // ============================================
  // RENDERIZADO UI MODERNA
  // ============================================
  return (
     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black pb-24 md:pb-4 relative text-gray-100 selection:bg-purple-500/30">
      
      {/* FONDO AMBIENTAL */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* HEADER INTELIGENTE */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 px-3 md:px-4 pt-4 md:pt-6 animate-in fade-in slide-in-from-top-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {textoHora}, {usuario.nombre}
                </h1>
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-400 mt-1">
                  {icono}
                  <span className="italic text-gray-300">{frase}</span>
                  <span className="hidden md:inline mx-2 text-white/20">|</span>
                  <span className="hidden md:inline-flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full border border-white/5">
                    <Activity className="w-3 h-3 text-green-400" />
                    Score: {kpis.financialHealth}/100
                  </span>
                </div>
              </div>
            </div>
            
       <div className="flex items-center gap-3">

  <button 
    onClick={() => { setTutorialActivo(true); setPasoTutorial(0) }}
    className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 transition-colors"
    title="Repetir Tutorial"
  >
    <HelpCircle className="w-5 h-5" />
  </button>
  <div className="hidden md:block"><LogoutButton /></div>
</div>
          </div>
        </div>
      </div>

{/* WIDGET DE PRESUPUESTO INTELIGENTE CON VISTA DUAL */}
<WidgetBalanceDual
  calculosReales={calculosReales}
  calculosProyectados={calculosProyectados}
  vistaActiva={vistaActiva}
  setVistaActiva={setVistaActiva}
  hoy={hoy}
/>
{/* WIDGET DE EJECUCIÓN DE PLAN DE DEUDAS */}
<div className="max-w-7xl mx-auto px-3 md:px-4 mt-4">
  {planDeudaActivo ? (
    <div className="animate-in fade-in slide-in-from-top-4">
      <PlanExecutionWidget
        activePlan={planDeudaActivo}
        // ✅ NUEVO: Pasar datos financieros reales para la IA
        realFinancialData={{
          gastos: gastosInstant,
          gastosFijos: gastosFijosInstant,
          deudas: deudasInstant,
          ingresos: ingresosInstant
        }}
        showLocalNotification={showLocalNotification}
        onOpenPlanDetails={() => setShowDebtPlanner(true)}
        onRegisterPayment={() => {
          const targetDebt = planDeudaActivo.configuracion?.plan?.orderedDebts?.[0];
          if (targetDebt) {
            const deudaReal = deudasInstant.find(d => 
              d.cuenta === targetDebt.nombre || d.id === targetDebt.id
            );
            setDeudaEditando(deudaReal || null);
            setShowModal('pagoTarjeta');
          }
        }}
      />
    </div>
  ) : deudasInstant.length > 0 && (
    <button
      onClick={() => setShowDebtPlanner(true)}
      className="w-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between hover:from-purple-600/30 hover:to-indigo-600/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/30 rounded-xl">
          <Target className="w-6 h-6 text-purple-400" />
        </div>
        <div className="text-left">
          <div className="text-white font-semibold">Crea tu plan de eliminación de deudas</div>
          <div className="text-gray-400 text-sm">
            Tienes {deudasInstant.length} deuda{deudasInstant.length > 1 ? 's' : ''} - El sistema te guiará paso a paso
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-purple-400" />
    </button>
  )}
</div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 space-y-6">
        
        {/* CALENDARIO */}
        <div className="animate-in fade-in slide-in-from-top-4 delay-200">
          <CalendarioPagos 
            key={JSON.stringify(suscripcionesInstant.map(s => s.proximo_pago))}
            gastosFijos={gastosFijosInstant}
            suscripciones={suscripcionesInstant}
            deudas={deudasInstant}
            ingresos={ingresosInstant}
            gastos={gastosInstant}
          />
        </div>

        {/* BOTONES DE ACCIÓN (Solo Desktop) */}
        <div className="hidden md:flex flex-wrap gap-3 justify-center bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 animate-in fade-in delay-300">
          <button onClick={() => setShowModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-green-500/50 shadow-lg shadow-green-900/20"><Plus className="w-4 h-4" /> Ingreso</button>
          <button onClick={() => setShowModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-red-500/50 shadow-lg shadow-red-900/20"><Plus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => setShowModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-indigo-500/50 shadow-lg shadow-indigo-900/20"><Repeat className="w-4 h-4" /> Suscripción</button>
          <button onClick={() => setShowModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-purple-500/50 shadow-lg shadow-purple-900/20"><CreditCard className="w-4 h-4" /> Tarjetas</button>
          <button onClick={() => setShowModal('lectorEstado')} className="flex items-center gap-2 px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-gray-500/50 shadow-lg shadow-gray-900/20"><ScanLine className="w-4 h-4" /> Escanear PDF</button>
        </div>

        {/* NOTIFICACIONES (HORIZONTAL SCROLL MOBILE) */}
        <div id="dashboard-alertas" className="animate-in fade-in slide-in-from-top-4 delay-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" /> Alertas
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${alertas.length > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
              {alertas.length}
            </span>
          </div>
          <div className="md:hidden overflow-x-auto pb-2 -mx-3 px-3 no-scrollbar">
            <div className="flex gap-3 min-w-max">
              {alertas.length === 0 ? (
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center w-full min-w-[200px]">
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-xs text-gray-400">Sin alertas pendientes</div>
                </div>
              ) : (
                alertas.map((alerta, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleOpenDetail(alerta.item, alerta.tipoItem)}
                    className={`p-3 rounded-2xl border text-left min-w-[200px] flex flex-col justify-between transition-transform active:scale-95 ${
                      alerta.tipo === 'critical' ? 'bg-red-500/10 border-red-500/20' : 
                      alerta.tipo === 'warning' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-300 mb-1">{alerta.mensajeCorto}</div>
                    <div className="text-lg font-bold text-white">$${alerta.monto}</div>
                  </button>
                ))
              )}
            </div>
          </div>
          {/* Vista escritorio normal */}
          <div className="hidden md:block">
            <Notificaciones alertas={alertas} onAlertClick={(alerta) => handleOpenDetail(alerta.item, alerta.tipoItem)} />
          </div>
        </div>

        {/* ASISTENTE FINANCIERO */}
        <div className="animate-in fade-in delay-300">
          <AsistenteFinancieroV2
            ingresos={ingresosInstant}
            gastosFijos={gastosFijosInstant}
            gastosVariables={gastosInstant}
            suscripciones={suscripcionesInstant}
            deudas={deudasInstant}
            showLocalNotification={showLocalNotification}
            onOpenDebtPlanner={() => setShowDebtPlanner(true)}
            onOpenSavingsPlanner={() => setShowSavingsPlanner(true)}
            onOpenSpendingControl={() => setShowSpendingControl(true)}
          />
        </div>

        {/* PLANES */}
        <div className="animate-in fade-in delay-400">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Mis Planes</h2>
            <button onClick={() => setShowSavingsPlanner(true)} className="text-xs md:text-sm bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-2 touch-manipulation border border-purple-500/20"><Plus className="w-3 h-3 md:w-4 md:h-4"/> Nuevo Plan</button>
          </div>
          <SavedPlansList refreshSignal={planUpdateCounter} />
        </div>

        {/* GRÁFICAS */}
        <div id="graficas-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in delay-500">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <GraficaDona data={dataGraficaDona} onCategoryClick={() => setShowDetallesCategorias(true)} />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <GraficaBarras 
              ingresos={ingresosInstant}
              gastos={gastosInstant}
              gastosFijos={gastosFijosInstant}
              suscripciones={suscripcionesInstant}
            />
          </div>
        </div>

        {/* INGRESOS */}
        <div className="animate-in fade-in delay-500">
          <ListaIngresos 
            ingresos={ingresosInstant}
            onEditar={(ingreso) => { setIngresoEditando(ingreso); setShowModal('ingreso'); }}
            onEliminar={handleEliminarIngreso}
          />
        </div>

        {/* FINANZAS (QUICK ACCESS) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 animate-in fade-in delay-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Finanzas</h3>
              <p className="text-xs md:text-sm text-gray-400">Gestiona tus gastos y deudas</p>
            </div>
            <button onClick={() => { setOverviewMode('ALL'); setShowModal('gastosOverview') }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-lg shadow-blue-900/20 border border-blue-400/20 touch-manipulation">Ver Todo</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div onClick={() => { setOverviewMode('DEUDAS'); setShowModal('gastosOverview') }} className="group bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 border border-purple-500/20 rounded-2xl p-4 cursor-pointer touch-manipulation transition-all">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{deudasInstant.length}</div>
              <div className="text-[10px] md:text-xs text-purple-300 font-medium uppercase tracking-wide">Deudas</div>
            </div>
            <div onClick={() => { setOverviewMode('FIJOS'); setShowModal('gastosOverview') }} className="group bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95 border border-yellow-500/20 rounded-2xl p-4 cursor-pointer touch-manipulation transition-all">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{gastosFijosInstant.length}</div>
              <div className="text-[10px] md:text-xs text-yellow-300 font-medium uppercase tracking-wide">Fijos</div>
            </div>
            <div onClick={() => { setOverviewMode('VARIABLES'); setShowModal('gastosOverview') }} className="group bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 rounded-2xl p-4 cursor-pointer touch-manipulation transition-all">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{gastosInstant.length}</div>
              <div className="text-[10px] md:text-xs text-red-300 font-medium uppercase tracking-wide">Variables</div>
            </div>
          </div>
        </div>

      </div>

      <Footer className="hidden md:block" />

      {/* --- MODALES (RESPONSIVE BOTTOM SHEET) --- */}
      
{/* DETALLE UNIVERSAL - MAYOR Z-INDEX PARA ESTAR SOBRE OTROS MODALES */}
{itemSeleccionado && (
  <div 
    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in"
    onClick={(e) => {
      // Cerrar si se hace clic en el fondo oscuro
      if (e.target === e.currentTarget) {
        setItemSeleccionado(null);
      }
    }}
  >
    <div 
      className="bg-gray-900 w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-y-auto border-t border-white/10 md:border border-white/10 transform transition-transform duration-300 translate-y-0"
      onClick={(e) => e.stopPropagation()}
    >
      <ModalDetalleUniversal
        item={itemSeleccionado.item}
        type={itemSeleccionado.type}
        status={itemSeleccionado.status}
        onClose={() => {
          console.log('✅ Cerrando modal de detalles');
          setItemSeleccionado(null);
        }}
        onEditar={handleEditarUniversal}
        onPagar={handlePagarUniversal}
      />
    </div>
  </div>
)}

      {/* OVERVIEW DE GASTOS */}
      {showModal === 'gastosOverview' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in slide-in-from-bottom-10">
          <div className="bg-gray-900 w-full md:max-w-3xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col border-t border-white/10 md:border-white/10">
            <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
              <h2 className="text-lg md:text-xl font-bold text-white">💳 Gastos & Deudas</h2>
              <button onClick={() => setShowModal(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            {/* Tabs */}
            <div className="flex overflow-x-auto p-4 border-b border-white/10 bg-gray-900/50 gap-2">
              {['ALL', 'DEUDAS', 'FIJOS', 'VARIABLES', 'SUSCRIPCIONES'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setOverviewMode(mode)} 
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation transition-all ${overviewMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto flex-1">
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
        </div>
      )}

      {/* MODALES SIMPLES (INGRESO, GASTO, ETC) */}
      <ModalWrapper show={showModal === 'ingreso'} onClose={() => { setShowModal(null); setIngresoEditando(null) }}>
        <ModalIngreso onClose={() => { setShowModal(null); setIngresoEditando(null) }} onSave={handleGuardarIngreso} ingresoInicial={ingresoEditando} />
      </ModalWrapper>

 {/* MODAL DE CUENTAS BANCARIAS - Fullscreen en mobile */}
{showModal === 'cuentas' && (
  <ModuloCuentasBancarias 
    onClose={() => setShowModal(null)}
    onAgregar={addCuenta} 
    onEditar={(cuenta) => { updateCuenta(cuenta.id, cuenta) }} 
    onEliminar={deleteCuenta} 
    onTransferenciaExitosa={refreshCuentas}
  />
)}
{showModal === 'alertas' && (
  <ModalAlertas
    alertas={alertas}
    onClose={() => setShowModal(null)}
    onAlertClick={(alerta) => {
      setShowModal(null)
      handleOpenDetail(alerta.item, alerta.tipoItem)
    }}
  />
)}

      <ModalWrapper show={showModal === 'gastos'} onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null) }}>
        <ModalGastos onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null) }} onSaveVariable={handleGuardarGasto} onSaveFijo={handleGuardarGastoFijo} gastoInicial={gastoEditando || gastoFijoEditando} />
      </ModalWrapper>

      <ModalWrapper show={showModal === 'usuario'} onClose={() => setShowModal(null)}>
        <ModalUsuario 
          usuario={usuario} 
          preferencias={preferenciasUsuario} 
          onChangePreferencias={setPreferenciasUsuario} 
          onClose={() => setShowModal(null)} 
          onLogout={() => { localStorage.clear(); window.location.href = "/auth"; }}
          permission={permission}
          showLocalNotification={showLocalNotification}
        />
      </ModalWrapper>

      <ModalWrapper show={showModal === 'suscripcion'} onClose={() => { setShowModal(null); setSuscripcionEditando(null) }}>
        <ModalSuscripcion key={suscripcionEditando?.id} onClose={() => { setShowModal(null); setSuscripcionEditando(null) }} onSave={handleGuardarSuscripcion} suscripcionInicial={suscripcionEditando} />
      </ModalWrapper>

      <ModalWrapper show={showModal === 'tarjetas'} onClose={() => setShowModal(null)}>
        <div className="bg-gray-900 rounded-t-3xl md:rounded-2xl p-4 md:p-6 max-w-md w-full m-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">Gestión de Tarjetas</h2>
            <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-3">
            <button onClick={() => setShowModal('agregarDeuda')} className="w-full p-4 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-white rounded-2xl font-semibold transition-all touch-manipulation">📝 Registrar Tarjeta</button>
            <button onClick={() => setShowModal('pagoTarjeta')} className="w-full p-4 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-white rounded-2xl font-semibold transition-all touch-manipulation">💳 Pagar Tarjeta</button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper show={showModal === 'pagoTarjeta'} onClose={() => { setShowModal(null); setDeudaEditando(null) }}>
        <ModalPagoTarjeta 
          onClose={() => {
            setShowModal(null)
            setDeudaEditando(null)
          }} 
          onSave={handleRegistrarPagoTarjeta} 
          deudas={deudasInstant}
          deudaPreseleccionada={deudaEditando}
        />
      </ModalWrapper>
      
      <ModalWrapper show={showModal === 'agregarDeuda'} onClose={() => { setShowModal(null); setDeudaEditando(null) }}>
        <ModalAgregarDeuda onClose={() => { setShowModal(null); setDeudaEditando(null) }} onSave={handleGuardarDeuda} deudaInicial={deudaEditando} />
      </ModalWrapper>

      <ModalWrapper show={showModal === 'lectorEstado'} onClose={() => setShowModal(null)}>
        <LectorEstadoCuenta onClose={() => setShowModal(null)} />
      </ModalWrapper>

      <ModalWrapper show={showDetallesCategorias} onClose={() => setShowDetallesCategorias(false)}>
        <ModalDetallesCategorias gastosPorCategoria={gastosPorCategoria} gastosFijos={gastosFijosInstant} gastosVariables={gastosInstant} suscripciones={suscripcionesInstant} onClose={() => setShowDetallesCategorias(false)} />
      </ModalWrapper>

      <ModalWrapper show={showDebtPlanner} onClose={() => setShowDebtPlanner(false)}>
        <DebtPlannerModal deudas={deudasInstant} kpis={kpis} onClose={() => setShowDebtPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      </ModalWrapper>

      <ModalWrapper show={showSavingsPlanner} onClose={() => setShowSavingsPlanner(false)}>
        <SavingsPlannerModal kpis={kpis} onClose={() => setShowSavingsPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      </ModalWrapper>

      <ModalWrapper show={showSpendingControl} onClose={() => setShowSpendingControl(false)}>
        <SpendingControlModal gastosFijos={gastosFijosInstant} gastosVariables={gastosInstant} suscripciones={suscripcionesInstant} kpis={kpis} onClose={() => setShowSpendingControl(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      </ModalWrapper>



      {/* --- TUTORIAL OVERLAY --- */}
      {tutorialActivo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-blue-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl shadow-blue-900/50 relative animate-bounce-in">
            <button 
              onClick={cerrarTutorial}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6 mt-2">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-500/30">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {pasosTutorialConfig[pasoTutorial].titulo}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {pasosTutorialConfig[pasoTutorial].texto}
              </p>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button 
                onClick={cerrarTutorial}
                className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
              >
                Saltar tutorial
              </button>
              <button 
                onClick={siguientePasoTutorial}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {pasoTutorial === pasosTutorialConfig.length - 1 ? 'Entendido' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-center gap-2 mt-6">
              {pasosTutorialConfig.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === pasoTutorial ? 'w-8 bg-gradient-to-r from-blue-500 to-indigo-500' : 'w-1.5 bg-gray-700'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MENÚ INFERIOR MÓVIL (AUTO-OCULTABLE) --- */}
      <div 
        id="boton-agregar"
        className={`fixed bottom-0 left-0 right-0 md:hidden transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-40 ${
          mostrarMenuInferior || tutorialActivo ? 'translate-y-0' : 'translate-y-[85%]'
        }`}
      >
        <MenuInferior 
          onOpenModal={setShowModal} 
          alertasCount={alertas.length} 
          nombreUsuario={usuario.nombre} 
          onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }} 
        />
      </div>

      {/* ESTILOS ADICIONALES */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes slide-in-from-bottom-10 {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); }
        }
        
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .slide-in-from-bottom-10 { animation: slide-in-from-bottom-10 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}

// COMPONENTE AUXILIAR PARA MODALES
function ModalWrapper({ show, onClose, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col border-t md:border border-white/10 animate-slide-in-from-bottom-10">
        <div className="flex justify-end p-4 border-b border-white/5 md:hidden">
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-0 md:p-0">
          {children}
        </div>
      </div>
    </div>
  )
}