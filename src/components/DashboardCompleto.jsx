import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Bell, Sun, Moon, Coffee, ScanLine, X, ChevronRight, HelpCircle, Activity, Target, Download, Calendar, ShieldAlert } from 'lucide-react';

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

// --- NUEVOS HOOKS Y UTILIDADES ---
import { calcularBalanceInteligente } from '../utils/financialCalculations'
import { useMonthlyTransition } from '../hooks/useMonthlyTransition'
import { usePlanesGuardados } from '../hooks/usePlanesGuardados'


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

// --- MODALES Y WIDGETS (Default Imports corregidos) ---
import WidgetBalanceDual from './WidgetBalanceDual'
import PlanExecutionWidget from './PlanExecutionWidget'

// --- MODALES NUEVOS (Default Imports corregidos) ---
import DebtPlannerModal from './DebtPlannerModal'
import SavingsPlannerModal from './SavingsPlannerModal'
import SpendingControlModal from './SpendingControlModal'
import SavedPlansList from './SavedPlansList'

import ListaGastosCompleta from './ListaGastosCompleta'
import { ITEM_TYPES } from '../constants/itemTypes'
import ModuloCuentasBancarias from './ModuloCuentasBancarias'
import ModalAlertas from './ModalAlertas'
import ModalCoberturaCuentas from './ModalCoberturaCuentas'
import ModalProyeccion3Dias from './ModalProyeccion3Dias'

import VisualizacionDatos from './VisualizacionDatos'

// --- LIBRERÍA DE BD ---
import { supabase } from '../lib/supabaseClient'

// --- NUEVOS IMPORTS PARA TRANSICIÓN MENSUAL ---

import { 
  obtenerDatosFiltrados
} from '../utils/filtrosInteligentes'

const FILTRO_TIPOS = {
  MES_ACTUAL: 'MES_ACTUAL',
  MES_ANTERIOR: 'MES_ANTERIOR',
  TODO: 'TODO'
}
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

  const [isPagandoSuscripcion, setIsPagandoSuscripcion] = useState(false)

  const [showModal, setShowModal] = useState(null)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)
  const [planUpdateCounter, setPlanUpdateCounter] = useState(0);
  
  // NUEVO: Estado de exportación
  const [showExportacion, setShowExportacion] = useState(false)

  // Proyección 3 días: se muestra una vez por día al entrar
  const [showProyeccion3d, setShowProyeccion3d] = useState(false)

  // NUEVO: Estado para ocultar/mostrar menú móvil por inactividad
  
  const inactivityTimerRef = useRef(null)

  // NUEVO: Estado para el Tutorial
  const [tutorialActivo, setTutorialActivo] = useState(false)
  const [pasoTutorial, setPasoTutorial] = useState(0)

  // ESTADO DUAL DE VISTA (Definido aquí para evitar duplicados)
  const [vistaActiva, setVistaActiva] = useState('real') // 'real' o 'proyectado'


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
          inicioMes:1,
          objetivo: "Reducir deudas",
          riesgo: "Conservador",
          iaActiva: true,
        };
  });

  // Usamos estado para 'hoy' para que no cambie en cada render (evita warnings de ESLint)
  // Se actualiza automáticamente cada minuto para mantener el tiempo actual
  const [hoy, setHoy] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setHoy(new Date()), 60000) // Actualiza cada 60 segundos
    return () => clearInterval(interval)
  }, [])
  const hoyStr = hoy.toISOString().split('T')[0]

  useInactivityTimeout(15)
  
  // Hook de transición mensual automática
const { 
  forzarTransicion 
} = useMonthlyTransition()

  const { ingresos, addIngreso, updateIngreso, deleteIngreso } = useIngresos()
  const { gastos, addGasto, updateGasto, deleteGasto } = useGastosVariables()
  const { gastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } = useGastosFijos()
  const { suscripciones, addSuscripcion, updateSuscripcion, deleteSuscripcion } = useSuscripciones()
  const { deudas, updateDeuda: updateDebt, refresh: refreshDeudas, deleteDeuda: deleteDebt } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()
const { planesActivos, refresh: refreshPlanes } = usePlanesGuardados();

// ✅ DEBE estar DESPUÉS de planesActivos
const planDeudaActivo = useMemo(() => {
  return planesActivos.find(p => p.tipo === 'deudas' && p.activo) || null;
}, [planesActivos]);


// ✅ EXPONER refreshPlanes globalmente para el botón de actualizar
useEffect(() => {
  window.refreshPlanesGlobally = async () => {
    await refreshPlanes()
    setPlanUpdateCounter(prev => prev + 1)
  }
  return () => {
    delete window.refreshPlanesGlobally
  }
}, [refreshPlanes])



  const { permission, showLocalNotification } = useNotifications()

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



  // 📅 FILTROS INTELIGENTES: Respetan transición mensual
  const datosFiltradosInteligentes = useMemo(() => {
    return obtenerDatosFiltrados({
      ingresos: ingresosInstant,
      gastosVariables: gastosInstant,
      gastosFijos: gastosFijosInstant, 
      suscripciones: suscripcionesInstant,
      deudas: deudasInstant
    }, FILTRO_TIPOS.MES_ACTUAL)

}, [
  ingresosInstant,
  gastosInstant,
  gastosFijosInstant,
  suscripcionesInstant,
  deudasInstant
])


// --- EFECTOS DE SINCRONIZACIÓN ---
// ✅ CORREGIDO: Se eliminó "if (x.length > 0)" para no bloquear sync cuando
// el hook devuelve un array vacío o cuando el primer registro viene del servidor.
useEffect(() => {
  if (ingresos.length > 0) {
    setIngresosInstant(ingresos);
    localStorage.setItem('ingresos_cache_v2', JSON.stringify(ingresos));
  }
}, [ingresos]);

useEffect(() => {
  // Sincronizar siempre que el hook tenga datos (incluso 1 solo registro nuevo)
  if (Array.isArray(gastos)) {
    if (gastos.length > 0) {
      setGastosInstant(gastos);
      localStorage.setItem('gastos_cache_v2', JSON.stringify(gastos));
    }
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

 // FUNCIÓN: Auto-ocultar menú inferior (inactividad)
// Si quieres ocultarlo de verdad, agrega un estado showMenu y úsalo en el render del MenuInferior.
// Por ahora esto solo reinicia timer de inactividad y evita errores de parseo.

useEffect(() => {
  const resetTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)

    inactivityTimerRef.current = setTimeout(() => {
      // Aquí pones lo que quieres hacer por inactividad:
      // ejemplo: setShowMenuInferior(false)
      // (si no tienes estado aún, déjalo vacío)
    }, 15000) // 15s ejemplo (ajusta)
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
// ===========================================
// 🚫 BLOQUEAR SCROLL DEL FONDO CON MODALES ABIERTOS
// ===========================================
useEffect(() => {
  const tieneModalAbierto = showModal || itemSeleccionado || showDetallesCategorias || 
                            showDebtPlanner || showSavingsPlanner || showSpendingControl || 
                            showExportacion;
  
  if (tieneModalAbierto) {
    // Guardar posición actual del scroll
    const scrollY = window.scrollY;
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      // Restaurar scroll cuando se cierra el modal
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }
}, [showModal, itemSeleccionado, showDetallesCategorias, showDebtPlanner, showSavingsPlanner, showSpendingControl, showExportacion]);
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
  const actualizarHistorial = useCallback((nuevoMovimiento) => {
    setMovimientosBancarios(prev => {
      const nuevo = [nuevoMovimiento, ...prev];
      localStorage.setItem('historial_bancarios_v2', JSON.stringify(nuevo));
      return nuevo;
    });
  }, []);

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
  // 🎯 SISTEMA DUAL DE CÁLCULO: REAL vs PROYECTADO
  // ============================================

  // ✅ NUEVO CÁLCULO INTEGRADO
  const calculosFinancieros = useMemo(() => {
    console.log('💰 Iniciando cálculos financieros inteligentes...')
    
    return calcularBalanceInteligente(
      ingresosInstant,
      gastosInstant,
      gastosFijosInstant,
      suscripcionesInstant,
      hoy
    )
  }, [ingresosInstant, gastosInstant, gastosFijosInstant, suscripcionesInstant, hoy])

  // ✅ EXTRAER datos para compatibilidad con código existente
  const calculosReales = calculosFinancieros.real
  const calculosProyectados = calculosFinancieros.proyectado

  // Datos activos según la vista seleccionada
  const datosActivos = vistaActiva === 'real' ? calculosReales : calculosProyectados

  // ✅ MANTENER variables para compatibilidad (reemplazar definiciones existentes)
  const totalIngresos = datosActivos.totalIngresos
  const totalGastosReales = datosActivos.totalGastos
  const totalGastosFijosReales = datosActivos.gastosFijos
  const totalGastosVariablesReales = datosActivos.gastosVariables
  const totalSuscripcionesReales = datosActivos.suscripciones
  const saldoReal = datosActivos.saldo
  const tasaAhorroReal = datosActivos.tasaAhorro

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
        // ✅ Actualización optimista del estado instantáneo al editar
        setGastosInstant(prev => {
          const updated = prev.map(g => g.id === data.id ? { ...g, ...data } : g)
          localStorage.setItem('gastos_cache_v2', JSON.stringify(updated))
          return updated
        })
        console.log('✅ Gasto actualizado')
      } else {
        const result = await addGasto(data)
        console.log('✅ Gasto creado')
        // ✅ Actualización optimista: agregar inmediatamente al estado visible
        const nuevoGasto = result?.data?.[0] || { ...data, id: Date.now() }
        setGastosInstant(prev => {
          const updated = [nuevoGasto, ...prev]
          localStorage.setItem('gastos_cache_v2', JSON.stringify(updated))
          return updated
        })

        const monto = Number(data.monto)

        // 🏦 Cuenta bancaria → RESTAR del balance
        if (data.cuenta_id && monto > 0) {
          const cuenta = cuentas.find(c => c.id === data.cuenta_id)
          if (cuenta) {
            const nuevoBalance = Number(cuenta.balance) - monto
            await updateCuenta(cuenta.id, { balance: nuevoBalance })
            console.log('🏦 Cuenta debitada:', cuenta.nombre, '→', nuevoBalance)
            await registrarMovimientoEnHistorial({
              tipo: 'gasto',
              monto,
              ref: `Gasto: ${data.descripcion || data.categoria || 'Variable'}`,
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre
            })
          }
        }

        // 💳 Tarjeta de crédito → SUMAR al saldo (deuda)
        if (data.deuda_id && monto > 0) {
          const deuda = deudasInstant.find(d => d.id === data.deuda_id)
          if (deuda) {
            const nuevoSaldo = Number(deuda.saldo || 0) + monto
            await updateDebt(deuda.id, { saldo: nuevoSaldo })
            console.log('💳 Tarjeta cargada:', deuda.cuenta, '→ saldo:', nuevoSaldo)
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
      
      if (mostrarEnHistorial) {
        const monto = Number(data.monto)

        // 🏦 Cuenta bancaria → RESTAR del balance
        if (data.cuenta_id && monto > 0) {
          const cuenta = cuentas.find(c => c.id === data.cuenta_id)
          if (cuenta) {
            const nuevoBalance = Number(cuenta.balance) - monto
            await updateCuenta(cuenta.id, { balance: nuevoBalance })
            console.log('🏦 Cuenta debitada (fijo):', cuenta.nombre, '→', nuevoBalance)
            await registrarMovimientoEnHistorial({
              tipo: 'gasto',
              monto,
              ref: `Gasto Fijo: ${data.nombre}`,
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre
            })
          }
        }

        // 💳 Tarjeta de crédito → SUMAR al saldo (deuda)
        if (data.deuda_id && monto > 0) {
          const deuda = deudasInstant.find(d => d.id === data.deuda_id)
          if (deuda) {
            const nuevoSaldo = Number(deuda.saldo || 0) + monto
            await updateDebt(deuda.id, { saldo: nuevoSaldo })
            console.log('💳 Tarjeta cargada (fijo):', deuda.cuenta, '→ saldo:', nuevoSaldo)
          }
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
// ===========================================
// 📅 CALCULAR FECHA ANTERIOR (para deshacer)
// ===========================================
const calcularFechaAnterior = (fechaActual, ciclo) => {
  const fecha = new Date(fechaActual + 'T00:00:00');
  
  switch (ciclo) {
    case 'Semanal':
      fecha.setDate(fecha.getDate() - 7);
      break;
    case 'Quincenal':
      fecha.setDate(fecha.getDate() - 15);
      break;
    case 'Mensual':
      fecha.setMonth(fecha.getMonth() - 1);
      break;
    case 'Trimestral':
      fecha.setMonth(fecha.getMonth() - 3);
      break;
    case 'Semestral':
      fecha.setMonth(fecha.getMonth() - 6);
      break;
    case 'Anual':
      fecha.setFullYear(fecha.getFullYear() - 1);
      break;
    default:
      fecha.setMonth(fecha.getMonth() - 1); // Default: Mensual
  }
  
  return fecha.toISOString().split('T')[0];
};
// MODIFICADO: Agrega feedback de carga y cierra modal al terminar
const handlePagoManual = async (sub) => {
  if (!sub.cuenta_id) {
    alert('⚠️ Esta suscripción no tiene una cuenta de pago asignada. Asígna una en editar.')
    setSuscripcionEditando(sub)
    setShowModal('suscripcion')
    return
  }
  
  try {
    setIsPagandoSuscripcion(true)

    const cuenta = cuentas.find(c => c.id === sub.cuenta_id)
    if (!cuenta) return
    
    const montoPagar = Number(sub.costo)
    
    // 1. RESTAR SALDO DE LA CUENTA
    const nuevoBalance = Number(cuenta.balance) - montoPagar
    await updateCuenta(cuenta.id, { balance: nuevoBalance })
    
    // ❌ ELIMINADO: Ya NO creamos un gasto variable en la lista general
    // await addGasto({ ... }) 

    // 2. REGISTRAR EN HISTORIAL (Solo para el registro bancario)
    actualizarHistorial({
      id: Date.now(),
      tipo: 'gasto',
      monto: montoPagar,
      ref: `Suscripción: ${sub.servicio}`,
      fecha: hoyStr,
      cuentaId: cuenta.id,
      cuentaNombre: cuenta.nombre
    })

    // 3. CALCULAR Y ACTUALIZAR PRÓXIMA FECHA
    const nuevoProximoPago = calcularProximoPago(hoyStr, sub.ciclo)
    
    await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago })
    
    alert(`✅ Pago registrado correctamente.\n\n💳 Descontado de: ${cuenta.nombre}\n💰 Monto: $${montoPagar.toLocaleString()}\n📅 Próximo cobro: ${new Date(nuevoProximoPago).toLocaleDateString('es-MX')}`)
    
    // Cerrar modal
    setItemSeleccionado(null)
    setSuscripcionEditando(null)
    
  } catch (error) {
    console.error('❌ Error en pago manual:', error)
    alert('❌ Error al registrar el pago')
  } finally {
    setIsPagandoSuscripcion(false)
  }
}

// ===========================================
// 🔄 DESHACER PAGO DE SUSCRIPCIÓN
// ===========================================
const handleDeshacerPago = useCallback(async (item, type) => {
  console.log('🔄 Iniciando deshacer pago...', item);
  
  // Solo aplica para suscripciones pagadas
  if (type !== ITEM_TYPES.SUSCRIPCION) {
    showLocalNotification('⚠️ Operación no permitida', {
      body: 'Solo se puede deshacer el pago de suscripciones',
      icon: '/favicon.ico'
    });
    return;
  }

  // Verificar que la suscripción esté pagada (proximo_pago en mes siguiente)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const proximoPago = new Date(item.proximo_pago + 'T00:00:00');
  proximoPago.setHours(0, 0, 0, 0);
  
  const esMesSiguiente = (
    proximoPago.getFullYear() > hoy.getFullYear() ||
    (proximoPago.getFullYear() === hoy.getFullYear() && proximoPago.getMonth() > hoy.getMonth())
  );
  
  console.log('📅 Verificando estado:', {
    hoy: hoy.toISOString().split('T')[0],
    proximoPago: item.proximo_pago,
    esMesSiguiente
  });
  
  if (!esMesSiguiente) {
    showLocalNotification('⚠️ No se puede deshacer', {
      body: 'Esta suscripción no ha sido pagada este mes',
      icon: '/favicon.ico'
    });
    return;
  }

  // Confirmar con el usuario
  const confirmar = window.confirm(
    `¿Deshacer el pago de "${item.servicio}"?\n\n` +
    `• Se devolverá $${Number(item.costo).toFixed(2)} a la cuenta\n` +
    `• La fecha de próximo pago retrocederá\n` +
    `• Se eliminará el registro del historial\n\n` +
    `⚠️ Esta acción no se puede deshacer automáticamente.`
  );

  if (!confirmar) {
    console.log('❌ Usuario canceló la operación');
    return;
  }

  try {
    console.log('🚀 Ejecutando deshacer pago...');
    
    // 1. Obtener la cuenta asociada
    if (!item.cuenta_id) {
      throw new Error('La suscripción no tiene cuenta asociada');
    }

    const cuenta = cuentas.find(c => c.id === item.cuenta_id);
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    console.log('💳 Cuenta encontrada:', cuenta.nombre);

    // 2. DEVOLVER EL DINERO A LA CUENTA
    const nuevoBalance = Number(cuenta.balance) + Number(item.costo);
    await updateCuenta(cuenta.id, { balance: nuevoBalance });
    console.log(`💰 Devuelto $${item.costo} a ${cuenta.nombre}. Nuevo balance: $${nuevoBalance}`);

    // 3. RETROCEDER LA FECHA DE PRÓXIMO PAGO
    const fechaAnterior = calcularFechaAnterior(item.proximo_pago, item.ciclo);
    console.log(`📅 Calculando fecha anterior: ${item.proximo_pago} (${item.ciclo}) → ${fechaAnterior}`);
    
    const resultadoUpdate = await updateSuscripcion(item.id, { proximo_pago: fechaAnterior });
    console.log(`✅ Resultado de updateSuscripcion:`, resultadoUpdate);
    
    // FORZAR ACTUALIZACIÓN DEL ESTADO LOCAL
    setSuscripcionesInstant(prev => 
      prev.map(s => 
        s.id === item.id 
          ? { ...s, proximo_pago: fechaAnterior }
          : s
      )
    );
    console.log(`🔄 Estado local actualizado`);

    // 4. ELIMINAR DEL HISTORIAL BANCARIO
    const historialActualizado = movimientosBancarios.filter(h => {
      const esEstaSuscripcion = (
        h.tipo === 'gasto' &&
        h.cuentaId === cuenta.id &&
        h.ref?.includes(item.servicio) &&
        Math.abs(h.monto - Number(item.costo)) < 0.01
      );
      return !esEstaSuscripcion;
    });

    setMovimientosBancarios(historialActualizado);
    localStorage.setItem('historial_bancarios_v2', JSON.stringify(historialActualizado));
    console.log(`🗑️ Eliminado del historial (antes: ${movimientosBancarios.length}, después: ${historialActualizado.length})`);

    // 5. NOTIFICAR ÉXITO
    showLocalNotification('✅ Pago Deshecho', {
      body: `${item.servicio}: $${Number(item.costo).toFixed(2)} devuelto a ${cuenta.nombre}`,
      icon: '/favicon.ico',
      tag: 'deshacer-pago'
    });

    // 6. CERRAR MODAL
    setShowModal(null);
    setItemSeleccionado(null);

    console.log(`✅ Pago deshecho exitosamente: ${item.servicio}`);

  } catch (error) {
    console.error('❌ Error al deshacer pago:', error);
    showLocalNotification('❌ Error', {
      body: `No se pudo deshacer el pago: ${error.message}`,
      icon: '/favicon.ico'
    });
}
}, [cuentas, movimientosBancarios, updateCuenta, updateSuscripcion, showLocalNotification, setMovimientosBancarios, setSuscripcionesInstant, setShowModal, setItemSeleccionado]);

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

    // Validaciones
    if (principal < 0 || intereses < 0 || total <= 0) {
      throw new Error('Montos inválidos')
    }

    // Detectar pago completo
    const esPagoCompleto = total >= deuda.saldo

    // Calcular nuevo saldo
    const nuevoSaldo = esPagoCompleto 
      ? 0 
      : Math.max(0, Number(deuda.saldo) - principal)

    // Función para calcular pago mínimo
    const calcularPagoMinimo = (saldo, apr = 0) => {
      if (saldo <= 0) return 0
      const porcentaje = saldo * 0.02
      return Math.max(porcentaje, 25)
    }

    const nuevoPagoMinimo = calcularPagoMinimo(nuevoSaldo, deuda.apr)

    console.log('📊 Actualizando tarjeta:', {
      nuevoSaldo,
      nuevoPagoMinimo,
      esPagoCompleto
    })

    // Registrar el pago
    await addPago(pago)

    // Actualizar la deuda
    await updateDebt(deuda.id, {
      saldo: nuevoSaldo,
      pago_minimo: nuevoPagoMinimo,
      ultimo_pago: pago.fecha,
    })

    // Refrescar datos
    await refreshPagos()
    await refreshDeudas()
    if (pago.cuenta_id) await refreshCuentas()

// ✅ ACTUALIZAR PLAN ACTIVO CON NUEVOS SALDOS
if (planDeudaActivo) {
  console.log('🔄 Recalculando plan de deudas con nuevo saldo...')
  
  try {
    const planConfig = planDeudaActivo.configuracion
    
    if (planConfig?.plan?.orderedDebts) {
      // 1. ESPERAR A QUE LAS DEUDAS SE ACTUALICEN EN BD
      await refreshDeudas()
      
      // 2. OBTENER DEUDAS ACTUALIZADAS DIRECTAMENTE DE SUPABASE
      const { data: { user } } = await supabase.auth.getUser()
      const { data: deudasActualizadas, error: deudasError } = await supabase
        .from('deudas')
        .select('*')
        .eq('user_id', user.id)
      
      if (deudasError) {
        console.error('❌ Error obteniendo deudas:', deudasError)
        throw deudasError
      }
      
      console.log('📋 Deudas actualizadas de BD:', deudasActualizadas)
      
      // 3. RECALCULAR META TOTAL CON SALDOS REALES
      let nuevaMetaTotal = 0
      let montoPagadoTotal = 0
      
      const metaOriginal = planConfig.plan.orderedDebts.reduce((sum, d) => 
        sum + Number(d.balance || d.saldo || 0), 0
      )
      
      const orderedDebtsActualizado = planConfig.plan.orderedDebts.map(deudaPlan => {
        // Buscar deuda real actualizada
        const deudaReal = deudasActualizadas.find(d => 
          d.id === deudaPlan.id || d.cuenta === deudaPlan.nombre
        )
        
        const saldoActual = deudaReal ? Number(deudaReal.saldo || 0) : 0
        const saldoOriginal = Number(deudaPlan.balance || deudaPlan.saldo || 0)
        
        nuevaMetaTotal += saldoActual
        montoPagadoTotal += Math.max(0, saldoOriginal - saldoActual)
        
        console.log(`💳 ${deudaPlan.nombre}: $${saldoOriginal} → $${saldoActual}`)
        
        return {
          ...deudaPlan,
          balance: saldoActual,
          saldo: saldoActual
        }
      })
      
      // 4. CALCULAR NUEVO PROGRESO
      const nuevoProgreso = metaOriginal > 0 
        ? ((montoPagadoTotal / metaOriginal) * 100)
        : 0
      
      console.log('📊 Recalculando plan:', {
        metaOriginal: `$${metaOriginal.toFixed(2)}`,
        nuevaMetaTotal: `$${nuevaMetaTotal.toFixed(2)}`,
        montoPagado: `$${montoPagadoTotal.toFixed(2)}`,
        progreso: `${nuevoProgreso.toFixed(2)}%`
      })
      
      // 5. ACTUALIZAR PLAN EN SUPABASE
      const { error: updateError } = await supabase
        .from('planes_guardados')
        .update({
          configuracion: {
            ...planConfig,
            plan: {
              ...planConfig.plan,
              orderedDebts: orderedDebtsActualizado,
              totalDebt: nuevaMetaTotal
            }
          },
          progreso: nuevoProgreso
        })
        .eq('id', planDeudaActivo.id)
      
      if (updateError) {
        console.error('❌ Error actualizando plan en BD:', updateError)
        throw updateError
      }
      
      console.log('✅ Plan actualizado en BD exitosamente')
      
      // 6. REFRESCAR PLANES EN UI
      await refreshPlanes()
      setPlanUpdateCounter(prev => prev + 1)
      
      console.log('✅ UI actualizada')
    }
  } catch (error) {
    console.error('❌ Error completo en recálculo del plan:', error)
  }
}

    // Mensaje personalizado
    if (esPagoCompleto) {
      alert(`🎉 ¡Felicidades!\n\n💳 ${deuda.cuenta} está SALDADA\n💰 Saldo final: $0.00\n\n${planDeudaActivo ? '📊 Tu plan de deudas se ha actualizado.' : ''}`)
    } else {
      alert(`✅ Pago registrado\n\n💳 ${deuda.cuenta}\n💰 Nuevo saldo: $${nuevoSaldo.toFixed(2)}\n💵 Pago mínimo: $${nuevoPagoMinimo.toFixed(2)}`)
    }

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

  // 📋 PASO 5: FUNCIONES DE DEBUGGING Y EXPORTACIÓN
const handleForzarTransicionMensual = async () => {
  if (window.confirm('⚠️ ¿Forzar transición mensual?\n\nEsto:\n- Archivará gastos variables del mes anterior\n- Reseteará gastos fijos\n- Generará ingresos recurrentes\n- Actualizará suscripciones\n\n¿Continuar?')) {
    try {
      setShowExportacion(true)
      await forzarTransicion()
      
      alert('✅ Transición mensual ejecutada correctamente')
      
      // Refrescar datos
      refreshDeudas()
      refreshPlanes()
    } catch (error) {
      alert('❌ Error en transición: ' + error.message)
    } finally {
      setShowExportacion(false)
    }
  }
}

  const mostrarEstadisticasDetalladas = () => {
    const stats = {
      calculosReales,
      calculosProyectados,
      diferencias: {
        ingresos: calculosProyectados.totalIngresos - calculosReales.totalIngresos,
        gastos: calculosProyectados.totalGastos - calculosReales.totalGastos,
        saldo: calculosProyectados.saldo - calculosReales.saldo
      },
      diasDelMes: {
        transcurridos: hoy.getDate(),
        restantes: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate()
      }
    }
    
    console.log('📊 Estadísticas Detalladas:', stats)
    alert('Ver estadísticas en la consola del navegador (F12)')
  }

  const validarMonto = (valor) => {
    const num = Number(valor)
    return isNaN(num) || num < 0 ? 0 : num
  }

  

  const handleExportacionCompletada = (resultado) => {
    if (resultado.success && showLocalNotification) {
      showLocalNotification('📊 Exportación completada', {
        body: `Archivo ${resultado.nombreArchivo} descargado exitosamente`,
        icon: '/favicon.ico'
      })
    }
    setShowExportacion(false)
  }

  useEffect(() => {
    const handleOpenExportEvent = (e) => {
      setShowExportacion(true)
      // Opcional: Pre-seleccionar tipo basado en el evento si se disparó desde el widget
      if (e.detail?.tipo) {
        console.log('Solicitando exportación tipo:', e.detail.tipo)
      }
    }

    window.addEventListener('openExport', handleOpenExportEvent)
    return () => window.removeEventListener('openExport', handleOpenExportEvent)
  }, [])

  // 📅 FILTRO VISUAL: MOSTRAR SOLO DATOS DEL MES ACTUAL
// DATOS FILTRADOS CON LÓGICA DE TRANSICIÓN
const ingresosDelMes = datosFiltradosInteligentes.ingresos
const gastosDelMes = datosFiltradosInteligentes.gastosVariables
const gastosFijosActivos = datosFiltradosInteligentes.gastosFijos
const suscripcionesActivas = datosFiltradosInteligentes.suscripciones


  // 📊 FILTRAR DATOS SEGÚN EL MODO DE VISTA SELECCIONADO
const overviewData = useMemo(() => {
    const base = {
      deudas: [],
      gastosFijos: [],
      gastosVariables: [],
      suscripciones: []
    }
    
    if (overviewMode === 'ALL') {
      return {
        deudas: deudasInstant,
        gastosFijos: gastosFijosActivos, // ✅ Cambiado
        gastosVariables: gastosDelMes,   // ✅ Cambiado  
        suscripciones: suscripcionesActivas // ✅ Cambiado
      }
    }
    
    if (overviewMode === 'DEUDAS') return { ...base, deudas: deudasInstant }
    if (overviewMode === 'FIJOS') return { ...base, gastosFijos: gastosFijosActivos } // ✅ Cambiado
    if (overviewMode === 'VARIABLES') return { ...base, gastosVariables: gastosDelMes } // ✅ Cambiado
    if (overviewMode === 'SUSCRIPCIONES') return { ...base, suscripciones: suscripcionesActivas } // ✅ Cambiado
    
    return base
  }, [overviewMode, deudasInstant, gastosFijosActivos, gastosDelMes, suscripcionesActivas]) // ✅ Dependencias actualizadas

  // 💳 CALCULAR TOTAL PAGADO A TARJETAS DE CRÉDITO ESTE MES
  const deudasPagadasEsteMesSet = useMemo(() => {
    const pagosDelMes = pagos.filter(p => {
      const fechaPago = new Date(p.fecha)
      return fechaPago.getMonth() === hoy.getMonth() && 
             fechaPago.getFullYear() === hoy.getFullYear()
    })
    return new Set(pagosDelMes.map(p => p.deuda_id))
  }, [pagos, hoy])

  const deudaPagadaEsteMes = useMemo(() => {
    return (deudaId) => deudasPagadasEsteMesSet.has(deudaId)
  }, [deudasPagadasEsteMesSet])
  



  // Exponer función de deshacer pago globalmente para el modal
useEffect(() => {
  window.deshacerPagoSuscripcion = handleDeshacerPago;
  return () => {
    delete window.deshacerPagoSuscripcion;
  };
}, [handleDeshacerPago]);

// ===========================================
// 🤖 SISTEMA DE AUTOPAGO AUTOMÁTICO MEJORADO
// ===========================================
useEffect(() => {
  let mounted = true;
  let intervalId = null;
  let timeoutId = null;

  // ✅ LEER REGISTRO DE AUTOPAGOS EJECUTADOS HOY
  const getAutopagosHoy = () => {
    const hoyLocal = new Date().toISOString().split('T')[0];
    const registroStr = localStorage.getItem('autopagos_ejecutados');
    
    if (!registroStr) return { fecha: hoyLocal, items: [] };
    
    const registro = JSON.parse(registroStr);
    
    // Si la fecha cambió, limpiar registro
    if (registro.fecha !== hoyLocal) {
      return { fecha: hoyLocal, items: [] };
    }
    
    return registro;
  };

  // ✅ GUARDAR ITEM COMO PAGADO HOY
  const marcarAutopagado = (itemId, tipo) => {
    const registro = getAutopagosHoy();
    const key = `${tipo}-${itemId}`;
    
    if (!registro.items.includes(key)) {
      registro.items.push(key);
      localStorage.setItem('autopagos_ejecutados', JSON.stringify(registro));
      console.log(`✅ Marcado como pagado hoy: ${key}`);
    }
  };

  const processAutopago = async () => {
    if (!mounted) return;

    const ahora = new Date();
    const hoyLocal = ahora.toISOString().split('T')[0];
    
    console.log(`🔄 Ejecutando verificación de autopagos: ${ahora.toLocaleTimeString('es-MX')}`);
    
    // ✅ OBTENER REGISTRO DE PAGOS YA EJECUTADOS HOY
    const registroHoy = getAutopagosHoy();
    console.log(`📋 Autopagos ya ejecutados hoy:`, registroHoy.items);
    
    let autopagosEjecutados = [];

    // ---1. PROCESAR AUTOPAGO DE SUSCRIPCIONES ---
    if (suscripcionesInstant.length > 0) {
      for (const sub of suscripcionesInstant) {
        // ✅ VERIFICAR SI YA FUE PAGADA HOY
        const keyItem = `suscripcion-${sub.id}`;
        if (registroHoy.items.includes(keyItem)) {
          console.log(`⏭️ Ya pagada hoy: ${sub.servicio} (${keyItem})`);
          continue;
        }

        // Solo si coincide la fecha exacta, está activo, tiene cuenta asignada y autopago activado
        if (
          sub.estado !== 'Activo' || 
          !sub.autopago || 
          !sub.cuenta_id || 
          sub.proximo_pago !== hoyLocal
        ) continue;

        const cuenta = cuentas.find(c => c.id === sub.cuenta_id);
        if (!cuenta) {
          console.warn(`⚠️ Cuenta no encontrada para ${sub.servicio}`);
          continue;
        }

        try {
          console.log(`🤖 Ejecutando autopago: ${sub.servicio} ($${sub.costo})`);

          // 1. Restar saldo de la cuenta
          const nuevoBalance = Number(cuenta.balance) - Number(sub.costo);
          await updateCuenta(cuenta.id, { balance: nuevoBalance });

          // 2. Actualizar historial bancario local
          actualizarHistorial({
            id: Date.now(),
            tipo: 'gasto',
            monto: Number(sub.costo),
            ref: `Suscripción: ${sub.servicio}`,
            fecha: hoyLocal,
            cuentaId: cuenta.id,
            cuentaNombre: cuenta.nombre
          });

          // 3. Calcular próxima fecha
          const nuevoProximoPago = calcularProximoPago(sub.proximo_pago, sub.ciclo);
          
          // 4. Actualizar la suscripción en BD
          await updateSuscripcion(sub.id, { proximo_pago: nuevoProximoPago });
          
          // ✅ 5. MARCAR COMO PAGADA HOY (EVITAR DUPLICADOS)
          marcarAutopagado(sub.id, 'suscripcion');
          
          // 6. Agregar a lista de autopagos ejecutados
          autopagosEjecutados.push({
            tipo: 'suscripcion',
            nombre: sub.servicio,
            monto: Number(sub.costo),
            cuenta: cuenta.nombre
          });
          
          console.log(`✅ Autopago exitoso: ${sub.servicio} → Próximo: ${nuevoProximoPago}`);
          
        } catch (error) {
          console.error(`❌ Error en autopago ${sub.servicio}:`, error);
        }
      }
    }

    // ---2. PROCESAR AUTOPAGO DE GASTOS FIJOS ---
    if (gastosFijosInstant.length > 0) {
      const diaDeHoy = ahora.getDate();
      
      for (const gf of gastosFijosInstant) {
        // ✅ VERIFICAR SI YA FUE PAGADO HOY
        const keyItem = `gasto_fijo-${gf.id}`;
        if (registroHoy.items.includes(keyItem)) {
          console.log(`⏭️ Ya pagado hoy: ${gf.nombre} (${keyItem})`);
          continue;
        }

        // Verificar: Día de vencimiento coincide HOY, tiene autopago, cuenta asignada y está Pendiente
        if (
          gf.dia_venc !== diaDeHoy || 
          !gf.autopago || 
          !gf.cuenta_id || 
          gf.estado !== 'Pendiente'
        ) continue;

        const cuenta = cuentas.find(c => c.id === gf.cuenta_id);
        if (!cuenta) {
          console.warn(`⚠️ Cuenta no encontrada para ${gf.nombre}`);
          continue;
        }

        try {
          console.log(`🤖 Ejecutando autopago gasto fijo: ${gf.nombre} ($${gf.monto})`);

          // 1. Restar saldo de la cuenta
          const nuevoBalance = Number(cuenta.balance) - Number(gf.monto);
          await updateCuenta(cuenta.id, { balance: nuevoBalance });

          // 2. Actualizar historial bancario local
          actualizarHistorial({
            id: Date.now(),
            tipo: 'gasto',
            monto: Number(gf.monto),
            ref: `Gasto Fijo: ${gf.nombre}`,
            fecha: hoyLocal,
            cuentaId: cuenta.id,
            cuentaNombre: cuenta.nombre
          });

          // 3. Marcar como PAGADO
          await updateGastoFijo(gf.id, { estado: 'Pagado' });

          // ✅ 4. MARCAR COMO PAGADO HOY (EVITAR DUPLICADOS)
          marcarAutopagado(gf.id, 'gasto_fijo');

          // 5. Agregar a lista de autopagos ejecutados
          autopagosEjecutados.push({
            tipo: 'gasto_fijo',
            nombre: gf.nombre,
            monto: Number(gf.monto),
            cuenta: cuenta.nombre
          });
          
          console.log(`✅ Autopago exitoso: ${gf.nombre}`);

        } catch (error) {
          console.error(`❌ Error en autopago ${gf.nombre}:`, error);
        }
      }
    }

    // ✅ ENVIAR NOTIFICACIÓN SI HUBO AUTOPAGOS
    if (autopagosEjecutados.length > 0 && showLocalNotification) {
      const totalAutopagos = autopagosEjecutados.reduce((sum, ap) => sum + ap.monto, 0);
      
      if (autopagosEjecutados.length === 1) {
        // Notificación individual
        const ap = autopagosEjecutados[0];
        showLocalNotification('🤖 Autopago Ejecutado', {
          body: `${ap.nombre}: $${ap.monto.toLocaleString()} descontado de ${ap.cuenta}`,
          icon: '/favicon.ico',
          tag: 'autopago',
          requireInteraction: false
        });
      } else {
        // Notificación múltiple
        showLocalNotification('🤖 Autopagos Ejecutados', {
          body: `${autopagosEjecutados.length} pagos automáticos por $${totalAutopagos.toLocaleString()}`,
          icon: '/favicon.ico',
          tag: 'autopago',
          requireInteraction: false
        });
      }
      
      console.log(`📢 Notificación enviada: ${autopagosEjecutados.length} autopago(s)`);
    }
  };

  // ✅ Ejecutar inmediatamente al cargar (después de 2 segundos)
  timeoutId = setTimeout(processAutopago, 2000);
  
  // ✅ Ejecutar cada 5 minutos
  intervalId = setInterval(processAutopago, 5 * 60 * 1000);
  
  return () => {
    mounted = false;
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
  };
}, [
  suscripcionesInstant, 
  gastosFijosInstant,
  cuentas, 
  hoyStr,
  hoy,
  updateCuenta, 
  updateSuscripcion,
  updateGastoFijo,
  actualizarHistorial,
  showLocalNotification
]);

// 📅 ACTUALIZAR FECHAS VENCIDAS DE SUSCRIPCIONES (AL CARGAR)
  useEffect(() => {
    if (!suscripcionesInstant || suscripcionesInstant.length === 0) return
    
    let ejecutado = false
    
    const actualizarFechasVencidas = async () => {
      if (ejecutado) return
      ejecutado = true
      
      const hoyLocal = new Date()
      hoyLocal.setHours(0, 0, 0, 0)
      
      let actualizadas = 0
      
      console.log('🔍 Verificando fechas de suscripciones...')
      
      for (const sub of suscripcionesInstant) {
        if (sub.estado !== 'Activo' || !sub.proximo_pago) continue
        
        const fechaProxima = new Date(sub.proximo_pago + 'T00:00:00')
        
        if (fechaProxima < hoyLocal) {
          console.log(`⚠️ Fecha vencida detectada: ${sub.servicio} (${sub.proximo_pago})`)
          
          let nuevaFecha = new Date(sub.proximo_pago + 'T00:00:00')
          
          while (nuevaFecha < hoyLocal) {
            if (sub.ciclo === 'Mensual') {
              nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
            } else if (sub.ciclo === 'Anual') {
              nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
            } else if (sub.ciclo === 'Semanal') {
              nuevaFecha.setDate(nuevaFecha.getDate() + 7)
            } else {
              break
            }
          }
          
          const fechaActualizada = nuevaFecha.toISOString().split('T')[0]
          
          try {
            await updateSuscripcion(sub.id, { proximo_pago: fechaActualizada })
            console.log(`✅ ${sub.servicio}: ${sub.proximo_pago} → ${fechaActualizada}`)
            actualizadas++
            
            // Actualizar estado local
            setSuscripcionesInstant(prev => 
              prev.map(s => 
                s.id === sub.id 
                  ? { ...s, proximo_pago: fechaActualizada }
                  : s
              )
            )
          } catch (error) {
            console.error(`❌ Error actualizando ${sub.servicio}:`, error)
          }
        }
      }
      
      if (actualizadas > 0) {
        console.log(`📅 ${actualizadas} suscripciones actualizadas`)
      } else {
        console.log('✅ Todas las fechas están al día')
      }
    }
    
    const timeout = setTimeout(actualizarFechasVencidas, 3000)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← Ejecutar solo al montar

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
// 3. Deudas (Excluir saldadas)
deudasInstant.forEach(d => {
  // ✅ NO generar alertas para tarjetas saldadas
  if (!d.vence || Number(d.saldo || 0) <= 0) return
  
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
    
    return listaAlertas.sort((a, b) => a.dias - b.dias)
    
  }, [gastosFijosInstant, suscripcionesInstant, deudasInstant, hoy])

  // ============================================
  // 🏦 ANÁLISIS DE COBERTURA DE CUENTAS BANCARIAS
  // ============================================
  const coberturaCuentas = useMemo(() => {
    const hoy30 = new Date(hoy)
    hoy30.setDate(hoy30.getDate() + 30)

    return cuentas
      .filter(c => Number(c.balance || 0) >= 0)
      .map(cuenta => {
        const cargosProximos = []

        gastosFijosInstant.forEach(gf => {
          if (gf.cuenta_id !== cuenta.id || !gf.auto_pago || gf.estado === 'Pagado' || !gf.dia_venc) return
          const fechaEstesMes = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
          const fechaSigMes   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, gf.dia_venc)
          const fechaCargo    = fechaEstesMes >= hoy ? fechaEstesMes : fechaSigMes
          if (fechaCargo <= hoy30) {
            cargosProximos.push({
              nombre: gf.nombre,
              monto: Number(gf.monto || 0),
              fecha: fechaCargo,
              dias: Math.ceil((fechaCargo - hoy) / 86400000),
              tipo: 'fijo'
            })
          }
        })

        suscripcionesInstant.forEach(sub => {
          if (sub.cuenta_id !== cuenta.id || !sub.autopago || sub.estado === 'Cancelado' || !sub.proximo_pago) return
          const fechaCargo = new Date(sub.proximo_pago + 'T00:00:00')
          if (fechaCargo >= hoy && fechaCargo <= hoy30) {
            cargosProximos.push({
              nombre: sub.servicio,
              monto: Number(sub.costo || 0),
              fecha: fechaCargo,
              dias: Math.ceil((fechaCargo - hoy) / 86400000),
              tipo: 'suscripcion'
            })
          }
        })

        const totalCargos = cargosProximos.reduce((s, c) => s + c.monto, 0)
        const balance     = Number(cuenta.balance || 0)
        const deficit     = totalCargos - balance
        return {
          cuenta,
          cargosProximos: cargosProximos.sort((a, b) => a.dias - b.dias),
          totalCargos,
          balance,
          deficit,
          tieneProblem: deficit > 0
        }
      })
      .filter(r => r.cargosProximos.length > 0)
  }, [cuentas, gastosFijosInstant, suscripcionesInstant, hoy])

  const cuentasEnRiesgo = useMemo(() =>
    coberturaCuentas.filter(r => r.tieneProblem),
  [coberturaCuentas])

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

  // Mostrar modal de proyección 3 días solo si hay cargos con riesgo, una vez al día
  useEffect(() => {
    if (cuentas.length === 0) return
    // Calcular si hay cuentas en riesgo en los próximos 3 días
    const hoy3 = new Date()
    hoy3.setDate(hoy3.getDate() + 3)
    const hayRiesgo3d = cuentas.some(cuenta => {
      const cargos3d = [
        ...gastosFijosInstant.filter(gf =>
          gf.cuenta_id === cuenta.id && gf.auto_pago && gf.estado !== 'Pagado' && gf.dia_venc &&
          (() => { const f = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc); const fn = new Date(hoy.getFullYear(), hoy.getMonth()+1, gf.dia_venc); const fc = f >= hoy ? f : fn; return fc <= hoy3 })()
        ).map(gf => Number(gf.monto || 0)),
        ...suscripcionesInstant.filter(sub =>
          sub.cuenta_id === cuenta.id && sub.autopago && sub.estado !== 'Cancelado' && sub.proximo_pago &&
          (() => { const f = new Date(sub.proximo_pago + 'T00:00:00'); return f >= hoy && f <= hoy3 })()
        ).map(sub => Number(sub.costo || 0))
      ]
      const total = cargos3d.reduce((s, m) => s + m, 0)
      return total > 0 && total > Number(cuenta.balance || 0)
    })
    if (!hayRiesgo3d) return  // Sin riesgo → no molestar al usuario
    const key = 'proyeccion3d_ultima_fecha'
    const hoyStr = new Date().toDateString()
    if (localStorage.getItem(key) !== hoyStr) {
      setShowProyeccion3d(true)
      localStorage.setItem(key, hoyStr)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentas, gastosFijosInstant, suscripcionesInstant])

const gastosPorCategoria = useMemo(() => {
  const categorias = {}
  
  // Mostrar todos los gastos activos
  const gastosAMostrar = [
    ...gastosFijosInstant,
    ...gastosInstant,
    ...suscripcionesInstant.filter(s => s.estado === 'Activo')
  ]
  
  gastosAMostrar.forEach(item => {
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

  // --- LÓGICA DE INTELIGENCIA FINANCIERA ---
  const financialHealth = useMemo(() => {
    let score = 60;
    const tasaAhorroNum = (totalIngresos - totalGastosReales) / (totalIngresos ||1);
    const deudaTotal = deudasInstant.reduce((sum, d) => sum + (d.saldo || 0), 0);
    
    if (tasaAhorroNum > 0.2) score += 20;
    else if (tasaAhorroNum > 0.1) score += 10;
    else score -= 10;
    
    if (deudaTotal > totalIngresos * 3) score -= 20;
    
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
    
    let iconoRender = null
    if (hora >= 5 && hora < 12) { iconoRender = <Sun className="w-6 h-6 text-yellow-400" /> }
    else if (hora >= 12 && hora < 19) { iconoRender = <Coffee className="w-6 h-6 text-orange-400" /> }
    else { iconoRender = <Moon className="w-6 h-6 text-indigo-400" /> }

    const frases = saldoReal > 0 
      ? ["¡Excelente gestión!", "¡Vas muy bien!", "Tu esfuerzo funciona"]
      : saldoReal === 0
      ? ["Estás en equilibrio.", "¡Bien hecho!", "Controlando finanzas"]
      : ["No te desanimes.", "Pequeños cambios.", "Tomando control"]

    const frase = frases[Math.floor(Math.random() * frases.length)]
    return { textoHora: texto, icono: iconoRender, frase }
  }, [saldoReal])

  const kpis = {
    totalIngresos,
    totalGastos: totalGastosReales,
    totalGastosFijos: totalGastosFijosReales,
    totalGastosVariables: totalGastosVariablesReales,
    totalSuscripciones: totalSuscripcionesReales,
    saldo: saldoReal,
    tasaAhorro: parseFloat(tasaAhorroReal || 0) / 100,
    totalDeudas: deudasInstant.reduce((sum, d) => sum + validarMonto(d.saldo), 0),
    financialHealth,
    dailyBudget
  }

  // ============================================
  // RENDERIZADO UI MODERNA
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black pb-32 md:pb-4 relative text-gray-100 selection:bg-purple-500/30">
      
      {/* FONDO AMBIENTAL */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

{/* HEADER INTELIGENTE MEJORADO */}
<div className="max-w-7xl mx-auto mb-4 md:mb-6 px-3 md:px-4 pt-4 md:pt-6 animate-in fade-in slide-in-from-top-4">
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
    
    <div className="flex flex-col gap-4 relative z-10">
      {/* Fila Superior: Saludo y Nombre */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {textoHora}, {usuario.nombre}
            </h1>
            {/* NUEVA SECCIÓN: Smart Bar Mobile-First */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 md:hidden">
              
              {/* 1. Fecha Formateada */}
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-gray-300">
                  {hoy.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* 2. Presupuesto Diario (El dato más valioso) */}
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Wallet className={`w-3.5 h-3.5 ${dailyBudget > 0 ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-xs font-medium text-gray-300">
                  ${dailyBudget.toLocaleString()} <span className="text-gray-500 font-normal">/día</span>
                </span>
              </div>

              {/* 3. Día del mes */}
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-gray-300">
                  {hoy.getDate()}/{new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()}
                </span>
              </div>
            </div>

            {/* Texto de ánimo y Score (Solo Desktop) */}
            <div className="hidden md:flex items-center gap-2 text-sm md:text-base text-gray-400 mt-1">
              {icono}
              <span className="italic text-gray-300">{frase}</span>
              <span className="mx-2 text-white/20">|</span>
              <span className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full border border-white/5">
                <Activity className="w-3 h-3 text-green-400" />
                Score: {kpis.financialHealth}/100
              </span>
            </div>
          </div>
          
          {/* Controles del Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowExportacion(true)}
              className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-full border border-green-500/30 text-emerald-300 hover:text-emerald-200 transition-all group relative"
              title="Exportar Datos Financieros"
            >
              <Download className="w-5 h-5" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Exportar datos
              </div>
            </button>
            
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


      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-4">
        {planDeudaActivo ? (
          <PlanExecutionWidget
            activePlan={planDeudaActivo}
            realFinancialData={{
              ingresos: ingresosInstant,
              gastos: gastosInstant,
              gastosFijos: gastosFijosInstant,
              deudas: deudasInstant
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
                  Tienes {deudasInstant.length} deuda{deudasInstant.length > 1 ? 's' : ''} registrada{deudasInstant.length > 1 ? 's' : ''}
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

        {/* BOTONES DE ACCIÓN (Solo Desktop) + PASO 6: Debug Buttons + Exportación */}
        <div className="hidden md:flex flex-wrap gap-3 justify-center bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 animate-in fade-in delay-300">
          <button onClick={() => setShowModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-green-500/50 shadow-lg shadow-green-900/20"><Plus className="w-4 h-4" /> Ingreso</button>
          <button onClick={() => setShowModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-red-500/50 shadow-lg shadow-red-900/20"><Plus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => setShowModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-indigo-500/50 shadow-lg shadow-indigo-900/20"><Repeat className="w-4 h-4" /> Suscripción</button>
          <button onClick={() => setShowModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border border-purple-500/50 shadow-lg shadow-purple-900/20"><CreditCard className="w-4 h-4" /> Tarjetas</button>
          {/* NUEVO: Botón Exportar */}
          <button 
            onClick={() => setShowExportacion(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border-green-500/50 shadow-lg shadow-green-900/20"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          
          <button onClick={() => setShowModal('lectorEstado')} className="flex items-center gap-2 px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border-gray-500/50 shadow-lg shadow-gray-900/20"><ScanLine className="w-4 h-4" /> Escanear PDF</button>
          
          {/* Debug Buttons */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <button 
                onClick={handleForzarTransicionMensual} 
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border-purple-500/50 shadow-lg shadow-purple-900/20"
              >
                🔄 Forzar Transición
              </button>
              <button 
                onClick={mostrarEstadisticasDetalladas} 
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border-cyan-500/50 shadow-lg shadow-cyan-900/20"
              >
                📊 Stats
              </button>
<button 
                onClick={async () => {
                  try {
                    const hoyLocal = new Date()
                    hoyLocal.setHours(0, 0, 0, 0)
                    let actualizadas = 0
                    
                    console.log('🔄 Forzando actualización manual...')
                    
                    for (const sub of suscripcionesInstant) {
                      if (sub.estado !== 'Activo' || !sub.proximo_pago) continue
                      
                      const fechaProxima = new Date(sub.proximo_pago + 'T00:00:00')
                      if (fechaProxima >= hoyLocal) {
                        console.log(`✓ ${sub.servicio} está al día (${sub.proximo_pago})`)
                        continue
                      }
                      
                      let nuevaFecha = new Date(sub.proximo_pago + 'T00:00:00')
                      while (nuevaFecha < hoyLocal) {
                        if (sub.ciclo === 'Mensual') nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
                        else if (sub.ciclo === 'Anual') nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1)
                        else if (sub.ciclo === 'Semanal') nuevaFecha.setDate(nuevaFecha.getDate() + 7)
                        else break
                      }
                      
                      const fechaActualizada = nuevaFecha.toISOString().split('T')[0]
                      
                      console.log(`📅 Actualizando ${sub.servicio}: ${sub.proximo_pago} → ${fechaActualizada}`)
                      
                      await updateSuscripcion(sub.id, { proximo_pago: fechaActualizada })
                      
                      // Actualizar estado local
                      setSuscripcionesInstant(prev => 
                        prev.map(s => 
                          s.id === sub.id 
                            ? { ...s, proximo_pago: fechaActualizada }
                            : s
                        )
                      )
                      
                      actualizadas++
                    }
                    
                    if (actualizadas > 0) {
                      alert(`✅ ${actualizadas} suscripciones actualizadas correctamente`)
                    } else {
                      alert('✅ Todas las fechas ya están al día')
                    }
                  } catch (error) {
                    console.error('❌ Error:', error)
                    alert('❌ Error al actualizar fechas: ' + error.message)
                  }
                }} 
                className="flex items-center gap-2 px-4 py-2 bg-orange-600/80 hover:bg-orange-600 text-white rounded-xl transition-all active:scale-95 text-sm touch-manipulation border-orange-500/50 shadow-lg shadow-orange-900/20"
              >
                📅 Actualizar Fechas
              </button>
            </>
          )}
        </div>

        {/* NOTIFICACIONES (HORIZONTAL SCROLL MOBILE) */}
        <div id="dashboard-alertas" className="animate-in fade-in slide-in-from-top-4 delay-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" /> Alertas
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${alertas.length > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {alertas.length}
              </span>
              {cuentasEnRiesgo.length > 0 && (
                <button
                  onClick={() => setShowModal('cobertura')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 border border-orange-500/30 rounded-full text-orange-400 text-xs font-semibold hover:bg-orange-500/25 active:scale-95 transition-all touch-manipulation"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {cuentasEnRiesgo.length} en riesgo
                </button>
              )}
            </div>
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
            ingresos={ingresosDelMes}
            gastos={gastosDelMes}
            gastosFijos={gastosFijosInstant}
            suscripciones={suscripcionesInstant}
            deudas={deudasInstant}
            showLocalNotification={showLocalNotification}
            onOpenDebtPlanner={() => setShowDebtPlanner(true)}
            onOpenSavingsPlanner={() => setShowSavingsPlanner(true)}
            onOpenSpendingControl={() => setShowSpendingControl(true)}
              dashboardKpis={kpis}                     // ← NUEVO
  calculosReales={calculosReales}           // ← NUEVO  
  calculosProyectados={calculosProyectados} // ← NUEVO
          />
        </div>

        {/* PLANES */}
        <div className="animate-in fade-in delay-400">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Mis Planes</h2>
            <button onClick={() => setShowSavingsPlanner(true)} className="text-xs md:text-sm bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-2 touch-manipulation border border-purple-500/20">
              <Plus className="w-3 h-3 md:w-4 md:h-4" /> Nuevo Plan
            </button>
          </div>
          <SavedPlansList 
  refreshSignal={planUpdateCounter} 
  realFinancialData={{
    ingresos: ingresosInstant,
    gastos: gastosInstant,
    gastosFijos: gastosFijosInstant,
    deudas: deudasInstant
  }}
/>
        </div>

       {/* GRÁFICAS */}
<div id="graficas-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in delay-500">
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
    <GraficaDona data={dataGraficaDona} onCategoryClick={() => setShowDetallesCategorias(true)} />
  </div>
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
    <GraficaBarras 
      ingresos={ingresosDelMes}
      gastos={gastosDelMes}
      gastosFijos={gastosFijosInstant}
      suscripciones={suscripcionesInstant}
    />
  </div>
</div>

        {/* INGRESOS */}
        <div className="animate-in fade-in delay-500">
          <ListaIngresos 
            ingresos={ingresosDelMes}
            onEditar={(ingreso) => { setIngresoEditando(ingreso); setShowModal('ingreso'); }}
            onEliminar={handleEliminarIngreso}
          />
        </div>

        {/* FINANZAS (QUICK ACCESS) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border-white/10 animate-in fade-in delay-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Finanzas</h3>
              <p className="text-xs md:text-sm text-gray-400">Gestiona tus gastos y deudas</p>
            </div>
            <button onClick={() => { setOverviewMode('ALL'); setShowModal('gastosOverview') }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-lg shadow-blue-900/20 border-blue-400/20 touch-manipulation">Ver Todo</button>
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
  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{gastosDelMes.length}</div>
  <div className="text-[10px] md:text-xs text-red-300 font-medium uppercase tracking-wide">Variables</div>
</div>
          </div>
        </div>

      </div>

      <Footer className="hidden md:block" />

      {/* --- MODALES (RESPONSIVE BOTTOM SHEET) --- */}
      
      {/* DETALLE UNIVERSAL */}
      {itemSeleccionado && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in"
          onClick={(e) => {
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
              isPagando={isPagandoSuscripcion} 
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

      {/* MODALES SIMPLES */}
      <ModalWrapper show={showModal === 'ingreso'} onClose={() => { setShowModal(null); setIngresoEditando(null) }}>
        <ModalIngreso onClose={() => { setShowModal(null); setIngresoEditando(null) }} onSave={handleGuardarIngreso} ingresoInicial={ingresoEditando} />
      </ModalWrapper>

      {/* MODAL DE CUENTAS BANCARIAS */}
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

      {showModal === 'cobertura' && (
        <ModalCoberturaCuentas
          coberturaCuentas={coberturaCuentas}
          onClose={() => setShowModal(null)}
        />
      )}

      <ModalWrapper show={showModal === 'gastos'} onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null); }}>        
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

      {/* CORRECCIÓN APLICADA AQUÍ: Cierre de función añadido */}
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
      
      <ModalWrapper show={showModal === 'agregarDeuda'} onClose={() => { setShowModal(null); setDeudaEditando(null); }}>

        {/* CORRECCIÓN APLICADA AQUÍ: Llave de apertura añadida */}
        <ModalAgregarDeuda onClose={() => { setShowModal(null); setDeudaEditando(null) }} onSave={handleGuardarDeuda} deudaInicial={deudaEditando} />
      </ModalWrapper>

      <ModalWrapper show={showModal === 'lectorEstado'} onClose={() => setShowModal(null)}>
        <LectorEstadoCuenta onClose={() => setShowModal(null)} />
      </ModalWrapper>

      <ModalWrapper show={showDetallesCategorias} onClose={() => setShowDetallesCategorias(false)}>
        <ModalDetallesCategorias gastosPorCategoria={gastosPorCategoria} gastosFijos={gastosFijosInstant} gastosVariables={gastosDelMes} suscripciones={suscripcionesInstant} onClose={() => setShowDetallesCategorias(false)} />
      </ModalWrapper>

      <ModalWrapper show={showDebtPlanner} onClose={() => setShowDebtPlanner(false)}>
        <DebtPlannerModal deudas={deudasInstant} kpis={kpis} onClose={() => setShowDebtPlanner(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      </ModalWrapper>

      {/* ✅ FIX: REMOVED WRAPPER FOR SAVINGS PLANNER TO PREVENT BOTTOM SHEET BEHAVIOR ON MOBILE */}
      {showSavingsPlanner && (
        <SavingsPlannerModal 
          kpis={kpis} 
          onClose={() => setShowSavingsPlanner(false)} 
          onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} 
        />
      )}

      <ModalWrapper show={showSpendingControl} onClose={() => setShowSpendingControl(false)}>
        <SpendingControlModal gastosFijos={gastosFijosInstant} gastosVariables={gastosDelMes} suscripciones={suscripcionesInstant} kpis={kpis} onClose={() => setShowSpendingControl(false)} onPlanGuardado={() => { refreshPlanes(); setPlanUpdateCounter(prev => prev + 1); }} />
      </ModalWrapper>

      {/* MODAL DE EXPORTACIÓN */}
      {showExportacion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-gray-900 w-full md:max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden animate-slide-in-from-bottom-10">
            <VisualizacionDatos
              onClose={() => setShowExportacion(false)}
              onExportComplete={handleExportacionCompletada}
              // Datos financieros
              ingresos={ingresosInstant}
              gastos={gastosInstant}
              gastosFijos={gastosFijosInstant}
              suscripciones={suscripcionesInstant}
              deudas={deudasInstant}
              cuentas={cuentas}
              // Cálculos
              calculosReales={calculosReales}
              calculosProyectados={calculosProyectados}
            />
          </div>
        </div>
      )}

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

      {/* MODAL PROYECCIÓN 3 DÍAS - aparece al entrar, una vez por día */}
      {showProyeccion3d && (
        <ModalProyeccion3Dias
          cuentas={cuentas}
          gastosFijos={gastosFijosInstant}
          suscripciones={suscripcionesInstant}
          onClose={() => setShowProyeccion3d(false)}
        />
      )}

      {/* --- MENÚ INFERIOR MÓVIL (AUTO-OCULTABLE) --- */}
      {/* NOTA PARA MENU INFERIOR: Asegúrate de que `MenuInferior.jsx` tenga acceso a la prop `onOpenExport` */}
      <MenuInferior
        onOpenModal={setShowModal}
        alertasCount={alertas.length}
        coberturaBadge={cuentasEnRiesgo.length}
        nombreUsuario={usuario.nombre}
        onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }}
        onOpenExport={() => setShowExportacion(true)}
      />

      {/* ESTILOS ADICIONALES */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes slide-in-from-bottom-10 {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity:1; }
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full md:max-w-lg max-h-[calc(100dvh-3.5rem)] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col border-t md:border border-white/10 animate-slide-in-from-bottom-10">
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