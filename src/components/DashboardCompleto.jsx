import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Bell, ScanLine, X, ChevronRight, ChevronDown, ChevronUp, Activity, Target, Download, ShieldAlert } from 'lucide-react';

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
import { calcularProximoCorte, calcularPagoMinimo as calcPagoMin } from '../utils/tarjetasCalculos'
import { useMonthlyTransition } from '../hooks/useMonthlyTransition'
import { usePlanesGuardados } from '../hooks/usePlanesGuardados'


// --- COMPONENTES ---
import ModalIngreso from './ModalIngreso'
import ModalGastos from './ModalGastos'
import ModalSuscripcion from './ModalSuscripcion'
import ModalPagoTarjeta from './ModalPagoTarjeta'
import ModalAgregarDeuda from './ModalAgregarDeuda'
import CardDeuda from './CardDeuda'
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
import PlanTipsWidget from './PlanTipsWidget'

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
import PanelSaludFinanciera from './PanelSaludFinanciera'
import ComparativoMensual from './ComparativoMensual'
import PresupuestoCategorias from './PresupuestoCategorias'
import MetasFinancieras from './MetasFinancieras'
import ModalProyeccion3Dias from './ModalProyeccion3Dias'

import VisualizacionDatos from './VisualizacionDatos'
import OnboardingModal from './OnboardingModal'
import TourNuevoUsuario, { useTourNuevoUsuario } from './TourNuevoUsuario'
import GuiaPrimerPaso from './GuiaPrimerPaso'
import ModalUpgrade from './ModalUpgrade'

// --- LIBRERÍA DE BD ---
import { supabase } from '../lib/supabaseClient'

// --- NUEVOS IMPORTS PARA TRANSICIÓN MENSUAL ---

import { toast } from 'sonner'
import {
  obtenerDatosFiltrados
} from '../utils/filtrosInteligentes'
import { showConfirm } from '../utils/confirm'

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
  const [historialMesFiltro, setHistorialMesFiltro] = useState(() => {
    const hoy = new Date()
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  })
  const [itemSeleccionado, setItemSeleccionado] = useState(null)

  const [isPagandoSuscripcion, setIsPagandoSuscripcion] = useState(false)

  const [showModal, setShowModal] = useState(null)

  // Onboarding: se muestra solo si nunca se completó.
  // El logout solo elimina claves específicas (no onboarding_completado),
  // por lo que usuarios existentes que vuelven a iniciar sesión no verán el onboarding.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Never show if already completed
    if (localStorage.getItem('onboarding_completado')) return false
    return true
  })

  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)
  const [planUpdateCounter, setPlanUpdateCounter] = useState(0)
  const [calendarioExpandido, setCalendarioExpandido] = useState(false)
  
  // NUEVO: Estado de exportación
  const [showExportacion, setShowExportacion] = useState(false)

  // Proyección 3 días: se muestra una vez por día al entrar
  const [showProyeccion3d, setShowProyeccion3d] = useState(false)
  const [tarjetaExpandidaId, setTarjetaExpandidaId] = useState(null) // historial expandido por tarjeta
  const [tarjetaHistTab, setTarjetaHistTab] = useState({})   // { [deudaId]: 'pagos' | 'compras' }
  const [tarjetaMesFiltro, setTarjetaMesFiltro] = useState({}) // { [deudaId]: 'YYYY-MM' }

  // ── Función central: cierra TODOS los paneles/modales antes de abrir uno nuevo ──
  const cerrarTodo = () => {
    setShowDebtPlanner(false)
    setShowSavingsPlanner(false)
    setShowSpendingControl(false)
    setShowExportacion(false)
    setShowProyeccion3d(false)
    setShowDetallesCategorias(false)
    setShowModal(null)
  }

  // Wrapper que garantiza cerrar todo antes de abrir el nuevo modal
  const abrirModal = (nombre) => {
    cerrarTodo()
    if (nombre) setShowModal(nombre)
  }

  // Maneja las acciones de la GuiaPrimerPaso — abre el modal correcto con el tipo correcto
  const handleAccionGuia = (accion) => {
    if (accion === 'cuenta')    { abrirModal('cuentas') }
    else if (accion === 'ingreso')   { abrirModal('ingreso') }
    else if (accion === 'gastoFijo') { setGastoTipoInicial('fijo');     abrirModal('gastos') }
    else if (accion === 'gasto')     { setGastoTipoInicial('variable'); abrirModal('gastos') }
  }

  // NUEVO: Estado para ocultar/mostrar menú móvil por inactividad
  
  const inactivityTimerRef = useRef(null)

  // ESTADO DUAL DE VISTA (Definido aquí para evitar duplicados)
  const [vistaActiva, setVistaActiva] = useState('real') // 'real' o 'proyectado'

  const [movimientosBancarios, setMovimientosBancarios] = useState(() => {
    const guardado = localStorage.getItem('historial_bancarios_v2');
    return guardado ? JSON.parse(guardado) : [];
  });

  const [ingresoEditando, setIngresoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastoFijoEditando, setGastoFijoEditando] = useState(null)
  const [gastoTipoInicial, setGastoTipoInicial] = useState('variable')
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
  
  // Hook de transición mensual automática (ejecuta en background)
  useMonthlyTransition()

  const { ingresos, loading: ingresosLoading, addIngreso, updateIngreso, deleteIngreso } = useIngresos()
  const { gastos, loading: gastosLoading, addGasto, updateGasto, deleteGasto, refresh: refreshGastos } = useGastosVariables()
  const { gastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } = useGastosFijos()
  const { suscripciones, addSuscripcion, updateSuscripcion, deleteSuscripcion } = useSuscripciones()
  const { deudas, loading: deudasLoading, updateDeuda: updateDebt, refresh: refreshDeudas, deleteDeuda: deleteDebt } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()
const { planesActivos, refresh: refreshPlanes } = usePlanesGuardados();

  // ── Tour para nuevos usuarios (solo si todo está en cero Y los datos ya cargaron) ──
  // dataReady = true cuando todos los hooks de datos terminaron su fetch inicial
  const dataReady = !ingresosLoading && !gastosLoading && !deudasLoading
  const { mostrar: mostrarTour, cerrarTour } = useTourNuevoUsuario({
    ingresos,
    gastos,
    deudas,
    cuentas,
    dataReady,
  })

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

// 📱 LISTENER: Navegación desde notificaciones push (service worker → app)
useEffect(() => {
  const handleSWMessage = (event) => {
    if (event.data?.type === 'NAVIGATE_TO_SECTION') {
      const { seccion } = event.data
      // Mapear sección a acción del dashboard
      const SECCIONES_MAPA = {
        'cuentas':      () => abrirModal('cuentas'),
        'gastos':       () => abrirModal('gastos'),
        'ingresos':     () => abrirModal('ingreso'),
        'deudas':       () => abrirModal('agregarDeuda'),
        'suscripciones':() => abrirModal('suscripcion'),
        'alertas':      () => {}, // scroll al top (ya visible)
        'exportar':     () => { cerrarTodo(); setShowExportacion(true) },
      }
      const accion = SECCIONES_MAPA[seccion]
      if (accion) {
        // Pequeño delay para asegurar que la app esté lista
        setTimeout(accion, 300)
        toast.info(`Abriendo ${seccion}...`, { duration: 2000 })
      }
    }
  }

  // También manejar navegación desde URL params (cuando app se abre desde notificación)
  const params = new URLSearchParams(window.location.search)
  const seccionParam = params.get('seccion')
  if (seccionParam) {
    const accionesParam = {
      'cuentas':      () => abrirModal('cuentas'),
      'gastos':       () => abrirModal('gastos'),
      'ingresos':     () => abrirModal('ingreso'),
      'deudas':       () => abrirModal('agregarDeuda'),
      'suscripciones':() => abrirModal('suscripcion'),
    }
    const accion = accionesParam[seccionParam]
    if (accion) setTimeout(accion, 800)
    // Limpiar URL
    window.history.replaceState({}, '', window.location.pathname)
  }

  navigator.serviceWorker?.addEventListener('message', handleSWMessage)
  return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
}, []) // eslint-disable-line react-hooks/exhaustive-deps



  const { permission, showLocalNotification } = useNotifications()

  // PUENTE DE ESTADO INSTANTÁNEO
  const [ingresosInstant, setIngresosInstant] = useState(() => {
    const cached = localStorage.getItem('ingresos_cache_v2');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [gastosInstant, setGastosInstant] = useState(() => {
    try {
      const cached = localStorage.getItem('gastos_cache_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Solo usar cache si tiene datos reales (no array vacío corrupto)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) { /* cache corrupto, ignorar */ }
    return [];
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

const [pagosInstant, setPagosInstant] = useState(() => {
  try {
    const cached = localStorage.getItem('pagos_tarjeta_cache_v2');
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
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


// --- CARGA DIRECTA DE GASTOS AL MONTAR (independiente del hook) ---
useEffect(() => {
  // Si ya tenemos datos en cache local, no sobreescribir todavía
  // Pero siempre verificar con Supabase en background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return
    supabase.from('gastos_variables').select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .limit(500)
      .then(({ data: gastosDB, error }) => {
        if (error) {
          console.error('❌ Carga directa gastos al montar:', error)
          return
        }
        const d = gastosDB || []
        console.log('🚀 Carga directa al montar → gastos_variables:', d.length, 'registros')
        if (d.length > 0) {
          setGastosInstant(d)
          localStorage.setItem('gastos_cache_v2', JSON.stringify(d))
          localStorage.setItem('gastos_variables_cache', JSON.stringify({ data: d, timestamp: Date.now() }))
        } else if (gastosInstant.length === 0) {
          // La tabla realmente está vacía
          console.warn('⚠️ gastos_variables tabla está vacía en Supabase para este user_id:', user.id)
        }
      })
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Solo al montar

// --- EFECTOS DE SINCRONIZACIÓN ---
// Once the initial fetch completes (loading=false), always sync — even empty arrays.
// This ensures UI clears when the user deletes their last record.
useEffect(() => {
  if (ingresosLoading) return // skip during initial fetch
  setIngresosInstant(ingresos)
  localStorage.setItem('ingresos_cache_v2', JSON.stringify(ingresos))
}, [ingresos, ingresosLoading])

useEffect(() => {
  if (!Array.isArray(gastos) || gastosLoading) return
  setGastosInstant(gastos)
  localStorage.setItem('gastos_cache_v2', JSON.stringify(gastos))
}, [gastos, gastosLoading])

useEffect(() => {
  // gastosFijos hook has no loading flag; skip only if undefined (pre-mount)
  if (!Array.isArray(gastosFijos)) return
  setGastosFijosInstant(gastosFijos)
  localStorage.setItem('gastos_fijos_cache_v2', JSON.stringify(gastosFijos))
}, [gastosFijos])

useEffect(() => {
  if (!Array.isArray(suscripciones)) return
  setSuscripcionesInstant(suscripciones)
  localStorage.setItem('suscripciones_cache_v2', JSON.stringify(suscripciones))
}, [suscripciones])

useEffect(() => {
  if (deudasLoading || !Array.isArray(deudas)) return
  setDeudasInstant(deudas)
  localStorage.setItem('deudas_cache_v2', JSON.stringify(deudas))
}, [deudas, deudasLoading])

useEffect(() => {
  if (Array.isArray(pagos) && pagos.length > 0) {
    setPagosInstant(pagos);
    localStorage.setItem('pagos_tarjeta_cache_v2', JSON.stringify(pagos));
  }
}, [pagos]);

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


  // Tutorial legacy eliminado — reemplazado por OnboardingModal
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
      abrirModal('agregarDeuda')
      return
    }
    if (type === ITEM_TYPES.FIJO) {
      setGastoFijoEditando(item)
      abrirModal('gastos')
      return
    }
    if (type === ITEM_TYPES.VARIABLE) {
      setGastoEditando(item)
      abrirModal('gastos')
      return
    }
    if (type === ITEM_TYPES.SUSCRIPCION) {
      setSuscripcionEditando(item)
      abrirModal('suscripcion')
      return
    }
    console.warn('⚠️ Tipo no reconocido en handleEditarUniversal:', type)
  }

  const handlePagarUniversal = async (item, type) => {
    if (type === ITEM_TYPES.DEUDA) {
      setItemSeleccionado(null)
      setDeudaEditando(item)
      abrirModal('pagoTarjeta')
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

  const handleEliminarUnificado = async (item, type) => {
    const typeLabel = type === 'deuda' ? 'debt record' : type === 'fijo' ? 'fixed expense' : type === 'suscripcion' ? 'subscription' : 'expense';
    const ok = await showConfirm({
      titulo: `Delete ${typeLabel}?`,
      mensaje: 'This record will be permanently removed from your financial history.',
      textoConfirmar: 'Delete',
    });
    if (!ok) return

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
        const resultado = await addIngreso(data)

        // Verificar que el ingreso se guardó correctamente
        if (resultado && resultado.success === false) {
          console.error('❌ addIngreso falló:', resultado.error)
          toast.error('Error al guardar el ingreso: ' + (resultado.error?.message || 'Error desconocido'))
          return
        }
        console.log('✅ Ingreso creado:', resultado)

        // Actualizar saldo de la cuenta asignada
        if (data.cuenta_id && Number(data.monto) > 0) {
          // Primero buscar en el array en memoria
          let cuenta = cuentas.find(c => c.id === data.cuenta_id)

          // Fallback: consultar Supabase directamente si no se encontró en memoria
          if (!cuenta) {
            console.warn('⚠️ Cuenta no encontrada en memoria, consultando Supabase...')
            const { data: cuentaDB } = await supabase
              .from('cuentas_bancarias')
              .select('*')
              .eq('id', data.cuenta_id)
              .single()
            cuenta = cuentaDB
          }

          if (cuenta) {
            const nuevoBalance = Number(cuenta.balance || 0) + Number(data.monto)
            await updateCuenta(cuenta.id, { balance: nuevoBalance })
            console.log('✅ Saldo actualizado:', cuenta.nombre, '→', nuevoBalance)

            await registrarMovimientoEnHistorial({
              tipo: 'ingreso',
              monto: Number(data.monto),
              ref: `Ingreso: ${data.fuente || 'General'}`,
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre
            })
            console.log('✅ Movimiento registrado en historial')
          } else {
            console.error('❌ No se encontró la cuenta:', data.cuenta_id)
          }
        }
      }

      setShowModal(null)
      setIngresoEditando(null)

    } catch (e) {
      console.error('❌ Error al guardar ingreso:', e)
      toast.error('Error al guardar el ingreso: ' + e.message)
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
          fecha: new Date(data.created_at).toLocaleString('en-US'),
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
        fecha: movimiento.fecha || new Date().toLocaleString('en-US', { 
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

      // Guardar deuda_id por separado antes de limpiar campos opcionales
      const deuda_id = data.deuda_id || null

      // Limpiar campos vacíos que podrían causar error en Supabase
      if (!data.cuenta_id) delete data.cuenta_id

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
        console.log('📤 Enviando gasto a BD:', JSON.stringify(data, null, 2))
        let result = await addGasto(data)
        console.log('📥 Resultado addGasto:', JSON.stringify(result, null, 2))

        // Si falló por columna deuda_id inexistente, reintentar sin ella
        if (!result?.success && deuda_id && result?.error?.message?.includes('deuda_id')) {
          console.warn('⚠️ columna deuda_id no existe en BD, reintentando sin ella...')
          const { deuda_id: _ignored, ...dataFallback } = data
          result = await addGasto(dataFallback)
        }

        // Si falló el insert, abortar — no hacer optimistic update falso
        if (!result?.success || !result?.data?.[0]) {
          console.error('❌ addGasto falló:', result?.error)
          const errMsg = result?.error?.message || result?.error?.details || result?.error?.hint || JSON.stringify(result?.error) || 'Error al guardar en base de datos'
          throw new Error(errMsg)
        }

        const nuevoGasto = result.data[0]

        // ✅ Actualización optimista INMEDIATA con el registro real del servidor
        setGastosInstant(prev => {
          const sinDuplicados = prev.filter(g => g.id !== nuevoGasto.id)
          const updated = [nuevoGasto, ...sinDuplicados]
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
        if (deuda_id && monto > 0) {
          const deuda = deudasInstant.find(d => d.id === deuda_id)
          if (deuda) {
            const nuevoSaldo = Number(deuda.saldo || 0) + monto
            await updateDebt(deuda.id, { saldo: nuevoSaldo })
            // Actualizar estado local de deudas para reflejar nuevo saldo
            setDeudasInstant(prev => {
              const updated = prev.map(d => d.id === deuda.id ? { ...d, saldo: nuevoSaldo } : d)
              localStorage.setItem('deudas_cache_v2', JSON.stringify(updated))
              return updated
            })
            console.log('💳 Tarjeta cargada:', deuda.cuenta, '→ saldo:', nuevoSaldo)
          }
        }
      }
      setShowModal(null)
      setGastoEditando(null)

      // ✅ Forzar refresh: limpiar TODAS las cachés de gastos y traer datos frescos del servidor
      localStorage.removeItem('gastos_variables_cache') // caché interna del hook (useSupabaseData)
      localStorage.removeItem('gastos_cache_v2')        // caché del dashboard
      setTimeout(() => {
        refreshGastos(true)  // force=true para saltarse caché
      }, 300)
    } catch (e) {
      console.error('❌ Error al guardar gasto completo:', e)
      const msg = e?.message || e?.error?.message || JSON.stringify(e) || 'Error desconocido'
      toast.info('Error al guardar: ' + msg)
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
      toast.info('Error al guardar: ' + e.message)
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
    const fecha = new Date(fechaActualStr.split('T')[0] + 'T00:00:00');
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
  const fecha = new Date(fechaActual.split('T')[0] + 'T00:00:00');
  
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
    toast.warning('Esta suscripción no tiene una cuenta de pago asignada. Asígna una en editar.')
    setSuscripcionEditando(sub)
    abrirModal('suscripcion')
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
    
    toast.success(`Pago registrado. Descontado de: ${cuenta.nombre} — $${montoPagar.toLocaleString()}`)
    
    // Cerrar modal
    setItemSeleccionado(null)
    setSuscripcionEditando(null)
    
  } catch (error) {
    console.error('❌ Error en pago manual:', error)
    toast.error('Error al registrar el pago')
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
  
  const proximoPago = new Date(item.proximo_pago.split('T')[0] + 'T00:00:00');
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
  const confirmar = await showConfirm({
    titulo: `Undo payment for "${item.servicio}"?`,
    mensaje: `$${Number(item.costo).toFixed(2)} will be returned to your account and the payment record will be removed. This cannot be automatically reversed.`,
    textoConfirmar: 'Undo Payment',
    textoCancel: 'Keep It',
  });

  if (!confirmar) return;

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
        toast.error('Error: No se pudo identificar al usuario.')
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
      toast.success('Tarjeta guardada exitosamente')
      
    } catch (e) {
      console.error("❌ Error guardando deuda:", e)
      toast.error(`Error al guardar: ${e.message || 'Error desconocido'}`)
    }
  }

  const handleEliminarSuscripcion = async (id) => {
    const ok = await showConfirm({
      titulo: 'Delete subscription?',
      mensaje: 'This subscription will be removed. You can always add it back later.',
      textoConfirmar: 'Delete',
    });
    if (ok) {
      try {
        await deleteSuscripcion(id);
      } catch (error) {
        toast.error('Error deleting subscription');
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

    // Calcular nuevo pago mínimo con APR real (usa función centralizada)
    const nuevoPagoMinimo = calcPagoMin(nuevoSaldo, deuda.apr)

    // Calcular próxima fecha de corte (avanza al mes siguiente si ya pasó)
    const nuevoVence = esPagoCompleto ? deuda.vence : calcularProximoCorte(deuda.vence)

    console.log('Actualizando tarjeta:', {
      nuevoSaldo,
      nuevoPagoMinimo,
      nuevoVence,
      esPagoCompleto
    })

    // Registrar el pago
    await addPago(pago)

    // Actualizar la deuda en BD
    const updatePayload = {
      saldo: nuevoSaldo,
      pago_minimo: nuevoPagoMinimo,
      ultimo_pago: pago.fecha,
    }
    if (nuevoVence) updatePayload.vence = nuevoVence

    await updateDebt(deuda.id, updatePayload)

    // Actualización optimista: actualiza UI al instante
    const deudasActualizadas = deudasInstant.map(d =>
      d.id === deuda.id
        ? { ...d, saldo: nuevoSaldo, pago_minimo: nuevoPagoMinimo, ultimo_pago: pago.fecha, vence: nuevoVence || d.vence }
        : d
    )
    setDeudasInstant(deudasActualizadas)
    // Limpiar caché para que el próximo refresh traiga datos frescos del servidor
    localStorage.removeItem('deudas_cache')
    localStorage.setItem('deudas_cache_v2', JSON.stringify(deudasActualizadas))

    // ✅ Actualización optimista de pagos: agregar pago al historial al instante
    const pagoOptimista = {
      ...pago,
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString(),
      monto_total: Number(pago.monto_total)
    }
    const pagosActualizados = [pagoOptimista, ...pagosInstant]
    setPagosInstant(pagosActualizados)
    localStorage.setItem('pagos_tarjeta_cache_v2', JSON.stringify(pagosActualizados))

    // Refrescar datos (el useEffect[deudas] recibirá los datos actualizados del servidor)
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
      toast.success(`🎉 ¡${deuda.cuenta} está SALDADA! Saldo: $0.00`)
    } else {
      toast.success(`Pago registrado — ${deuda.cuenta}: $${nuevoSaldo.toFixed(2)}`)
    }

    setShowModal(null)
    setDeudaEditando(null)

  } catch (err) {
    console.error('❌ Error registrando pago:', err)
    toast.info('Error registrando el pago: ' + (err.message || 'Error desconocido'))
  }
}

  const handleEliminarIngreso = async (id) => {
    try {
      await deleteIngreso(id);
      // Force immediate UI update — remove from local instant state
      setIngresosInstant(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      toast.error('Error al eliminar el ingreso');
    }
  };

  // 📋 Funciones de debug eliminadas (solo usadas en botones de desarrollo)

  const validarMonto = (valor) => {
    const num = Number(valor)
    return isNaN(num) || num < 0 ? 0 : num
  }

  

  // handleExportacionCompletada: eliminado — VisualizacionDatos maneja su propio cierre

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

  // Listen for PremiumGate upgrade events
  useEffect(() => {
    const handler = () => setShowUpgrade(true)
    window.addEventListener('open-upgrade-modal', handler)
    return () => window.removeEventListener('open-upgrade-modal', handler)
  }, [])

  // 📅 FILTRO VISUAL: MOSTRAR SOLO DATOS DEL MES ACTUAL
// DATOS FILTRADOS CON LÓGICA DE TRANSICIÓN
const ingresosDelMes = datosFiltradosInteligentes.ingresos
const gastosFijosActivos = datosFiltradosInteligentes.gastosFijos
const suscripcionesActivas = datosFiltradosInteligentes.suscripciones

// ✅ GASTOS VARIABLES DEL MES ACTUAL
// Reglas: no archivados + mes actual + no bancarios/autopagos
// Los gastos de meses anteriores se archivan automáticamente → historial/reportes
const gastosDelMes = useMemo(() => {
  const EXCLUIR_METODO = ['Estado de Cuenta', 'Autopago']
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59)

  return gastosInstant.filter(g => {
    if (g.archivado === true) return false
    if (g.metodo && EXCLUIR_METODO.includes(g.metodo)) return false
    if (g.categoria === '📅 Suscripciones') return false
    if (g.descripcion?.includes('Autopago:')) return false
    if (!g.fecha) return false
    const fecha = new Date(g.fecha + 'T00:00:00')
    return fecha >= inicioMes && fecha <= finMes
  })
}, [gastosInstant])


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
    
    console.log(`🔄 Ejecutando verificación de autopagos: ${ahora.toLocaleTimeString('en-US')}`);
    
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
        
        const fechaProxima = new Date(sub.proximo_pago.split('T')[0] + 'T00:00:00')

        if (fechaProxima < hoyLocal) {
          console.log(`⚠️ Fecha vencida detectada: ${sub.servicio} (${sub.proximo_pago})`)

          let nuevaFecha = new Date(sub.proximo_pago.split('T')[0] + 'T00:00:00')
          
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
          const fechaCargo = new Date(sub.proximo_pago.split('T')[0] + 'T00:00:00')
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
          (() => { const f = new Date(sub.proximo_pago.split('T')[0] + 'T00:00:00'); return f >= hoy && f <= hoy3 })()
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

  // ── PATRIMONIO NETO = activos bancarios - deudas totales ─────────
  const netWorth = useMemo(() => {
    const totalActivos = cuentas.reduce((sum, c) => sum + Number(c.balance || 0), 0)
    const totalPasivos = deudasInstant.reduce((sum, d) => sum + Number(d.saldo || 0), 0)
    return totalActivos - totalPasivos
  }, [cuentas, deudasInstant])

  // ── DTI mensual = pagos mínimos / ingreso mensual ───────────────
  // Regla: <20% excelente, 20-36% aceptable, >43% peligro
  const dti = useMemo(() => {
    if (!totalIngresos) return 0
    const pagosMensuales = deudasInstant.reduce((sum, d) => sum + Number(d.pago_minimo || 0), 0)
    return Math.round((pagosMensuales / totalIngresos) * 100)
  }, [deudasInstant, totalIngresos])

  // ── REGLA 50/30/20 ───────────────────────────────────────────────
  // Necesidades: gastos fijos + pagos mínimos de deuda
  // Deseos: gastos variables + suscripciones
  // Ahorro: lo que sobra (meta ≥ 20%)
  const regla503020 = useMemo(() => {
    if (!totalIngresos) return { necesidades: 0, deseos: 0, ahorro: 0 }
    const pagosMensualesDeuda = deudasInstant.reduce((s, d) => s + Number(d.pago_minimo || 0), 0)
    const necesidades = totalGastosFijosReales + pagosMensualesDeuda
    const deseos = totalGastosVariablesReales + totalSuscripcionesReales
    const ahorro = Math.max(0, totalIngresos - necesidades - deseos)
    // Cap each segment so total never exceeds 100% (spending > income scenario)
    const totalGastoPct = Math.round(((necesidades + deseos) / totalIngresos) * 100)
    const overflow = totalGastoPct > 100
    const necPct = Math.round((necesidades / totalIngresos) * 100)
    const desPct = overflow
      ? Math.max(0, 100 - necPct)   // squeeze deseos to fit
      : Math.round((deseos / totalIngresos) * 100)
    return {
      necesidades: necPct,
      deseos: desPct,
      ahorro: Math.round((ahorro / totalIngresos) * 100),
    }
  }, [totalIngresos, totalGastosFijosReales, totalGastosVariablesReales, totalSuscripcionesReales, deudasInstant])

  // ── FINANCIAL HEALTH SCORE — 5 factores profesionales ───────────
  // Antes: arrancaba en 60 (falso positivo) y solo medía 2 cosas.
  // Ahora: arranca en 50 (neutral) con 5 factores estándar de finanzas.
  const financialHealth = useMemo(() => {
    let score = 50 // Punto neutral — hay que ganarse cada punto

    // Factor 1: Tasa de ahorro (0-25 pts)
    const tasaAhorro = totalIngresos > 0 ? (totalIngresos - totalGastosReales) / totalIngresos : 0
    if (tasaAhorro >= 0.20) score += 25       // Excelente: ahorra ≥20%
    else if (tasaAhorro >= 0.10) score += 15  // Bueno: ahorra 10-19%
    else if (tasaAhorro >= 0.05) score += 5   // Mínimo: ahorra 5-9%
    else if (tasaAhorro < 0) score -= 15      // Gasta más de lo que gana

    // Factor 2: DTI mensual (0-15 pts)
    const dtiLocal = totalIngresos > 0
      ? deudasInstant.reduce((s, d) => s + Number(d.pago_minimo || 0), 0) / totalIngresos
      : 0
    if (dtiLocal <= 0.20) score += 15        // Excelente: ≤20%
    else if (dtiLocal <= 0.36) score += 8    // Aceptable: 20-36%
    else if (dtiLocal > 0.43) score -= 15    // Peligro: >43% (bancos rechazan préstamos)

    // Factor 3: Deuda total vs ingreso ANUAL (0-15 pts)
    // Error anterior: comparaba deuda contra ingreso mensual × 3 (muy permisivo)
    const ingresoAnual = totalIngresos * 12
    const deudaTotal = deudasInstant.reduce((s, d) => s + Number(d.saldo || 0), 0)
    if (deudaTotal === 0) score += 15
    else if (deudaTotal < ingresoAnual * 0.36) score += 10 // Deuda manejable
    else if (deudaTotal < ingresoAnual) score += 5         // Deuda elevada
    else score -= 10                                        // Deuda > ingreso anual

    // Factor 4: Gastos fijos como % del ingreso (0-10 pts)
    const pctFijos = totalIngresos > 0
      ? (totalGastosFijosReales + totalSuscripcionesReales) / totalIngresos
      : 1
    if (pctFijos <= 0.50) score += 10       // Saludable: compromisos ≤50% ingresos
    else if (pctFijos <= 0.70) score += 5   // Ajustado
    else score -= 10                         // Peligro: compromisos >70%

    // Factor 5: Suscripciones no excesivas (0-5 pts)
    const pctSubs = totalIngresos > 0 ? totalSuscripcionesReales / totalIngresos : 0
    if (pctSubs <= 0.05) score += 5         // Controlado: subs ≤5% ingresos
    else if (pctSubs > 0.10) score -= 5     // Excesivo: subs >10% ingresos

    return Math.max(0, Math.min(100, Math.round(score)))
  }, [totalIngresos, totalGastosReales, totalGastosFijosReales, totalSuscripcionesReales, deudasInstant])

  // ── DAILY BUDGET corregido — descuenta gastos fijos pendientes ───
  // Antes: dividía todo el saldo sin considerar qué falta por pagar.
  // Ahora: descuenta gastos fijos aún sin pagar que vencen este mes.
  const dailyBudget = useMemo(() => {
    const diasRestantes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate() + 1
    if (diasRestantes <= 0) return 0
    const fijosPendientes = gastosFijosInstant
      .filter(gf => gf.estado !== 'Pagado' && Number(gf.dia_venc || 0) >= hoy.getDate())
      .reduce((sum, gf) => sum + Number(gf.monto || 0), 0)
    const saldoDisponible = (saldoReal || 0) - fijosPendientes
    if (saldoDisponible <= 0) return 0
    return Math.floor(saldoDisponible / diasRestantes)
  }, [saldoReal, hoy, gastosFijosInstant])

  const { textoHora, frase } = useMemo(() => {
    const hora = new Date().getHours()
    const texto = hora >= 5 && hora < 12 ? 'Buenos días'
                : hora >= 12 && hora < 19 ? 'Buenas tardes'
                : 'Buenas noches';

    const frases = saldoReal > 0
      ? ["¡Excelente gestión!", "¡Vas muy bien!", "Tu esfuerzo funciona"]
      : saldoReal === 0
      ? ["Estás en equilibrio.", "¡Bien hecho!", "Controlando finanzas"]
      : ["No te desanimes.", "Pequeños cambios.", "Tomando control"]

    const frase = frases[Math.floor(Math.random() * frases.length)]
    return { textoHora: texto, frase }
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
    dailyBudget,
    netWorth,
    dti,
    regla503020,
  }

  // ============================================
  // RENDERIZADO UI MODERNA
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black pb-32 md:pb-4 relative text-gray-100 selection:bg-purple-500/30 safe-area-top" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom, 0px))' }}>
      
      {/* FONDO AMBIENTAL */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

{/* ── HEADER COMPACTO ── */}
<div className="max-w-7xl mx-auto mb-3 px-3 md:px-4 pt-4 md:pt-6 animate-in fade-in slide-in-from-top-4">
  <div className="flex items-center justify-between gap-3">

    {/* Saludo + Nombre */}
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 shrink-0">
        <Wallet className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="text-base md:text-xl font-bold text-white truncate leading-tight">
          {textoHora}, {usuario.nombre || usuario.email?.split('@')[0]} 👋
        </h1>
        {/* Score + presupuesto diario — visible en móvil */}
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-semibold ${dailyBudget > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${Math.abs(dailyBudget).toLocaleString()}/día
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-400" />
            Score {kpis.financialHealth}/100
          </span>
          <span className="hidden md:inline text-gray-600">·</span>
          <span className="hidden md:inline text-xs text-gray-400 italic">{frase}</span>
        </div>
      </div>
    </div>

    {/* Controles */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => { cerrarTodo(); setShowExportacion(true) }}
        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-emerald-400 transition-colors"
        title="Exportar datos"
      >
        <Download className="w-4 h-4" />
      </button>
      <div className="hidden md:block"><LogoutButton /></div>
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


      {/* ── GUÍA DE PRIMEROS PASOS — solo aparece hasta que el usuario tenga datos ── */}
      <GuiaPrimerPaso
        cuentas={cuentas}
        ingresos={ingresosInstant}
        gastosFijos={gastosFijosInstant}
        gastos={gastosInstant}
        onAccion={handleAccionGuia}
      />

      {/* ── ALERTAS COMPACTAS — lo más urgente primero ─────────────── */}
      {alertas.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 md:px-4 mt-3">
          <div
            className="relative overflow-hidden rounded-3xl border border-yellow-500/20"
            style={{ background: 'rgba(234,179,8,0.05)', boxShadow: 'inset 0 1px 0 rgba(234,179,8,0.08)' }}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="text-xs font-bold text-yellow-300">
                  {alertas.length} pago{alertas.length > 1 ? 's' : ''} próximo{alertas.length > 1 ? 's' : ''}
                </span>
                {cuentasEnRiesgo.length > 0 && (
                  <button
                    onClick={() => abrirModal('cobertura')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 rounded-full text-orange-400 text-[10px] font-semibold touch-manipulation"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    {cuentasEnRiesgo.length} en riesgo
                  </button>
                )}
              </div>
              <button
                onClick={() => abrirModal('alertas')}
                className="text-[11px] text-yellow-500 font-semibold hover:text-yellow-300 transition-colors touch-manipulation"
              >
                Ver todo →
              </button>
            </div>
            {/* Primeras 3 alertas compactas */}
            <div className="px-3 pb-3 space-y-1.5">
              <Notificaciones
                alertas={alertas.slice(0, 3)}
                onAlertClick={(alerta) => handleOpenDetail(alerta.item, alerta.tipoItem)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL SALUD FINANCIERA ─────────────────────────────────── */}
      {/* Score · Patrimonio · DTI · Ahorro · Fondo de Emergencia · 50/30/20 */}
      <PanelSaludFinanciera kpis={kpis} cuentas={cuentas} />

      {/* ── COMPARATIVO MENSUAL — este mes vs mes anterior ─────────── */}
      <ComparativoMensual
        ingresos={ingresosInstant}
        gastos={gastosInstant}
        gastosFijos={gastosFijosInstant}
        suscripciones={suscripcionesInstant}
      />

      {/* ── PRESUPUESTO POR CATEGORÍA ──────────────────────────────── */}
      <PresupuestoCategorias gastos={gastosInstant} />

      {/* ── METAS FINANCIERAS ─────────────────────────────────────── */}
      <MetasFinancieras />

      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-4">
        {planDeudaActivo ? (
          <>
            {/* Widget de tips y recomendaciones del plan */}
            <PlanTipsWidget
              activePlan={planDeudaActivo}
              deudas={deudasInstant}
              gastos={gastosInstant}
              gastosFijos={gastosFijosInstant}
              ingresos={ingresosInstant}
              alertas={alertas}
              onOpenPlan={() => { cerrarTodo(); setShowDebtPlanner(true) }}
              onRegisterPayment={() => {
                const targetDebt = planDeudaActivo.configuracion?.plan?.orderedDebts?.[0];
                if (targetDebt) {
                  const deudaReal = deudasInstant.find(d =>
                    d.cuenta === targetDebt.nombre || d.id === targetDebt.id
                  );
                  setDeudaEditando(deudaReal || null);
                  abrirModal('pagoTarjeta');
                }
              }}
            />
            <PlanExecutionWidget
              activePlan={planDeudaActivo}
              realFinancialData={{
                ingresos: ingresosInstant,
                gastos: gastosInstant,
                gastosFijos: gastosFijosInstant,
                deudas: deudasInstant
              }}
              showLocalNotification={showLocalNotification}
              onOpenPlanDetails={() => { cerrarTodo(); setShowDebtPlanner(true) }}
              onRegisterPayment={() => {
                const targetDebt = planDeudaActivo.configuracion?.plan?.orderedDebts?.[0];
                if (targetDebt) {
                  const deudaReal = deudasInstant.find(d =>
                    d.cuenta === targetDebt.nombre || d.id === targetDebt.id
                  );
                  setDeudaEditando(deudaReal || null);
                  abrirModal('pagoTarjeta');
                }
              }}
            />
          </>
        ) : deudasInstant.length > 0 && (
          <button
            onClick={() => { cerrarTodo(); setShowDebtPlanner(true) }}
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
        
        {/* BOTONES DE ACCIÓN (Solo Desktop) */}
        <div className="hidden md:flex flex-wrap gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 animate-in fade-in delay-300">
          <button onClick={() => abrirModal('ingreso')} className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-all active:scale-95 text-sm border border-green-500/50"><Plus className="w-4 h-4" /> Ingreso</button>
          <button onClick={() => abrirModal('gastos')} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 text-sm border border-red-500/50"><Plus className="w-4 h-4" /> Gasto</button>
          <button onClick={() => abrirModal('suscripcion')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-95 text-sm border border-indigo-500/50"><Repeat className="w-4 h-4" /> Suscripción</button>
          <button onClick={() => abrirModal('tarjetas')} className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl transition-all active:scale-95 text-sm border border-purple-500/50"><CreditCard className="w-4 h-4" /> Tarjetas</button>
          <button onClick={() => abrirModal('lectorEstado')} className="flex items-center gap-2 px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl transition-all active:scale-95 text-sm border border-gray-500/50"><ScanLine className="w-4 h-4" /> Escanear PDF</button>
        </div>

        {/* ── ALERTAS (todo al día — solo si no hay alertas) ── */}
        {alertas.length === 0 && (
          <div className="animate-in fade-in delay-300">
            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/15 rounded-2xl">
              <div className="text-xl">✅</div>
              <div>
                <p className="text-sm font-semibold text-green-400">Todo al día</p>
                <p className="text-xs text-gray-500">No tienes pagos urgentes esta semana</p>
              </div>
            </div>
          </div>
        )}
        {/* ASISTENTE FINANCIERO */}
        <div className="animate-in fade-in delay-300">
          <AsistenteFinancieroV2
            ingresos={ingresosDelMes}
            gastos={gastosDelMes}
            gastosFijos={gastosFijosInstant}
            suscripciones={suscripcionesInstant}
            deudas={deudasInstant}
            showLocalNotification={showLocalNotification}
            onOpenDebtPlanner={() => { cerrarTodo(); setShowDebtPlanner(true) }}
            onOpenSavingsPlanner={() => { cerrarTodo(); setShowSavingsPlanner(true) }}
            onOpenSpendingControl={() => { cerrarTodo(); setShowSpendingControl(true) }}
              dashboardKpis={kpis}                     // ← NUEVO
  calculosReales={calculosReales}           // ← NUEVO  
  calculosProyectados={calculosProyectados} // ← NUEVO
          />
        </div>

        {/* ── MIS PLANES ── */}
        <div className="animate-in fade-in delay-400">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Mis Planes</h3>
            <button onClick={() => { cerrarTodo(); setShowSavingsPlanner(true) }} className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors touch-manipulation flex items-center gap-1">
              <Plus className="w-3 h-3" /> Nuevo
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

       {/* ── GRÁFICAS ── */}
        <div id="graficas-section" className="animate-in fade-in delay-500">
          <h3 className="text-base font-bold text-white mb-3">¿En qué va tu dinero?</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <GraficaDona data={dataGraficaDona} onCategoryClick={() => { cerrarTodo(); setShowDetallesCategorias(true) }} />
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
        </div>

        {/* ── INGRESOS DEL MES ── */}
        <div className="animate-in fade-in delay-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Ingresos este mes</h3>
            <button
              onClick={() => abrirModal('ingreso')}
              className="text-xs text-green-400 hover:text-green-300 font-semibold transition-colors touch-manipulation flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          <ListaIngresos
            ingresos={ingresosDelMes}
            onEditar={(ingreso) => { setIngresoEditando(ingreso); abrirModal('ingreso'); }}
            onEliminar={handleEliminarIngreso}
          />
        </div>

        {/* ── RESUMEN FINANCIERO: acceso rápido con montos reales ── */}
        <div className="animate-in fade-in delay-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Mis Finanzas</h3>
            <button
              onClick={() => { setOverviewMode('ALL'); abrirModal('gastosOverview') }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors touch-manipulation"
            >
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Deudas */}
            <button
              onClick={() => { setOverviewMode('DEUDAS'); abrirModal('gastosOverview') }}
              className="group flex flex-col gap-1.5 p-3.5 bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 border border-purple-500/20 rounded-2xl text-left touch-manipulation transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">💳 Deudas</span>
              <span className="text-lg font-bold text-white leading-none">
                ${deudasInstant.reduce((s, d) => s + Number(d.saldo || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-gray-500">{deudasInstant.length} tarjeta{deudasInstant.length !== 1 ? 's' : ''}</span>
            </button>

            {/* Gastos Fijos */}
            <button
              onClick={() => { setOverviewMode('FIJOS'); abrirModal('gastosOverview') }}
              className="group flex flex-col gap-1.5 p-3.5 bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95 border border-yellow-500/20 rounded-2xl text-left touch-manipulation transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">📌 Fijos</span>
              <span className="text-lg font-bold text-white leading-none">
                ${gastosFijosInstant.reduce((s, g) => s + Number(g.monto || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-gray-500">{gastosFijosInstant.length} gasto{gastosFijosInstant.length !== 1 ? 's' : ''}</span>
            </button>

            {/* Suscripciones */}
            {(() => {
              const subsActivas  = suscripcionesInstant.filter(s => s.estado !== 'Cancelado')
              const totalSubs    = subsActivas.reduce((s, sub) => s + Number(sub.costo || 0), 0)
              const pctSubsCard  = totalIngresos > 0 ? Math.round((totalSubs / totalIngresos) * 100) : 0
              const subsAlerta   = pctSubsCard > 5 && totalIngresos > 0
              return (
                <button
                  onClick={() => { setOverviewMode('SUSCRIPCIONES'); abrirModal('gastosOverview') }}
                  className={`group flex flex-col gap-1.5 p-3.5 active:scale-95 rounded-2xl text-left touch-manipulation transition-all relative ${
                    subsAlerta
                      ? 'bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
                  }`}
                >
                  {subsAlerta && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${subsAlerta ? 'text-amber-400' : 'text-indigo-400'}`}>
                    🔄 Suscripc.
                  </span>
                  <span className="text-lg font-bold text-white leading-none">
                    ${totalSubs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`text-[10px] ${subsAlerta ? 'text-amber-500 font-semibold' : 'text-gray-500'}`}>
                    {subsAlerta ? `${pctSubsCard}% ingresos ⚠️` : `${subsActivas.length} activa${subsActivas.length !== 1 ? 's' : ''}`}
                  </span>
                </button>
              )
            })()}
          </div>
        </div>

        {/* ── CALENDARIO DE PAGOS (colapsable) ── */}
        <div className="animate-in fade-in delay-500">
          <button
            onClick={() => setCalendarioExpandido(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/4 hover:bg-white/7 border border-white/10 rounded-2xl transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📅</span>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-200">Calendario de pagos</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Ver fechas de vencimiento del mes</p>
              </div>
            </div>
            {calendarioExpandido
              ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            }
          </button>
          {calendarioExpandido && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <CalendarioPagos
                key={JSON.stringify(suscripcionesInstant.map(s => s.proximo_pago))}
                gastosFijos={gastosFijosInstant}
                suscripciones={suscripcionesInstant}
                deudas={deudasInstant}
                ingresos={ingresosInstant}
                gastos={gastosInstant}
              />
            </div>
          )}
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
              pagos={pagosInstant}
              gastos={gastosInstant}
              onClose={() => {
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
              {['ALL', 'DEUDAS', 'FIJOS', 'VARIABLES', 'SUSCRIPCIONES', 'HISTORIAL'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setOverviewMode(mode)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap touch-manipulation transition-all ${
                    overviewMode === mode
                      ? mode === 'HISTORIAL' ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mode === 'HISTORIAL' ? '📂 Historial' : mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {overviewMode === 'HISTORIAL' ? (
                // ── HISTORIAL: gastos con filtro por mes ──
                (() => {
                  const mesesDisponibles = []
                  const ahoraH = new Date()
                  for (let i = 0; i < 12; i++) {
                    const d = new Date(ahoraH.getFullYear(), ahoraH.getMonth() - i, 1)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    mesesDisponibles.push({ key, label })
                  }

                  const [filtroAño, filtroMes] = historialMesFiltro.split('-').map(Number)
                  const inicioPeriodo = new Date(filtroAño, filtroMes - 1, 1)
                  const finPeriodo = new Date(filtroAño, filtroMes, 0, 23, 59, 59)
                  const esMesActual = filtroAño === ahoraH.getFullYear() && filtroMes === (ahoraH.getMonth() + 1)

                  const gastosDelPeriodo = gastosInstant.filter(g => {
                    if (!g.fecha) return false
                    if (['Estado de Cuenta','Autopago'].includes(g.metodo)) return false
                    if (g.descripcion?.includes('Autopago:')) return false
                    if (g.categoria === '📅 Suscripciones') return false
                    const fecha = new Date(g.fecha + 'T00:00:00')
                    return fecha >= inicioPeriodo && fecha <= finPeriodo
                  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

                  const gastosFijosDelPeriodo = gastosFijosInstant.map(gf => ({
                    ...gf,
                    estadoPeriodo: esMesActual ? gf.estado : 'Recurrente'
                  }))

                  const pagosDelPeriodo = pagos.filter(p => {
                    if (!p.fecha) return false
                    const fecha = new Date(p.fecha + 'T00:00:00')
                    return fecha >= inicioPeriodo && fecha <= finPeriodo
                  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

                  const totalVariables = gastosDelPeriodo.reduce((s, g) => s + Number(g.monto || 0), 0)
                  const totalFijos = gastosFijosDelPeriodo.reduce((s, g) => s + Number(g.monto || 0), 0)
                  const totalPagos = pagosDelPeriodo.reduce((s, p) => s + Number(p.monto || 0), 0)

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 shrink-0">Mes:</span>
                        <select
                          value={historialMesFiltro}
                          onChange={e => setHistorialMesFiltro(e.target.value)}
                          className="flex-1 bg-gray-800 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                          {mesesDisponibles.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-rose-400 font-bold uppercase mb-0.5">Variables</p>
                          <p className="text-sm font-black text-rose-300">${totalVariables.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] text-gray-600">{gastosDelPeriodo.length} gastos</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-orange-400 font-bold uppercase mb-0.5">Fijos</p>
                          <p className="text-sm font-black text-orange-300">${totalFijos.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] text-gray-600">{gastosFijosDelPeriodo.length} fijos</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] text-blue-400 font-bold uppercase mb-0.5">Pagos</p>
                          <p className="text-sm font-black text-blue-300">${totalPagos.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] text-gray-600">{pagosDelPeriodo.length} pagos</p>
                        </div>
                      </div>

                      {gastosFijosDelPeriodo.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-orange-400 uppercase mb-2">Gastos Fijos</p>
                          <div className="space-y-1.5">
                            {gastosFijosDelPeriodo.map(gf => (
                              <div key={gf.id} className="flex items-center justify-between bg-gray-800/40 border border-white/5 rounded-xl px-3.5 py-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${gf.estadoPeriodo === 'Pagado' ? 'bg-green-400' : 'bg-orange-400'}`} />
                                  <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{gf.nombre}</p>
                                    <p className="text-[10px] text-gray-500">Día {gf.dia_venc} · {gf.estadoPeriodo}</p>
                                  </div>
                                </div>
                                <span className={`text-sm font-bold shrink-0 ${gf.estadoPeriodo === 'Pagado' ? 'text-green-400' : 'text-orange-300'}`}>${Number(gf.monto||0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gastosDelPeriodo.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-rose-400 uppercase mb-2">Gastos Variables</p>
                          <div className="space-y-1.5">
                            {gastosDelPeriodo.map(g => (
                              <div key={g.id} className="flex items-center justify-between bg-gray-800/40 border border-white/5 rounded-xl px-3.5 py-2.5">
                                <div className="min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{g.descripcion || g.categoria}</p>
                                  <p className="text-[10px] text-gray-500">{g.fecha} · {g.metodo || g.categoria}</p>
                                </div>
                                <span className="text-sm font-bold text-rose-300 shrink-0">${Number(g.monto||0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pagosDelPeriodo.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-blue-400 uppercase mb-2">Pagos de Tarjetas</p>
                          <div className="space-y-1.5">
                            {pagosDelPeriodo.map(p => {
                              const deuda = deudasInstant.find(d => d.id === p.deuda_id)
                              return (
                                <div key={p.id} className="flex items-center justify-between bg-gray-800/40 border border-white/5 rounded-xl px-3.5 py-2.5">
                                  <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{deuda?.cuenta || 'Tarjeta'}</p>
                                    <p className="text-[10px] text-gray-500">{p.fecha} · {p.tipo === 'minimo' ? 'Pago mínimo' : p.tipo === 'total' ? 'Pago total' : 'Abono'}</p>
                                  </div>
                                  <span className="text-sm font-bold text-blue-300 shrink-0">${Number(p.monto||0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {gastosDelPeriodo.length === 0 && gastosFijosDelPeriodo.length === 0 && pagosDelPeriodo.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No hay registros para este mes</p>
                      )}
                    </div>
                  )
                })()
              ) : (
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
              )}
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

      <ModalWrapper show={showModal === 'gastos'} onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null); setGastoTipoInicial('variable') }}>
        <ModalGastos
          onClose={() => { setShowModal(null); setGastoEditando(null); setGastoFijoEditando(null); setGastoTipoInicial('variable') }}
          onSaveVariable={handleGuardarGasto}
          onSaveFijo={handleGuardarGastoFijo}
          gastoInicial={gastoEditando || gastoFijoEditando}
          tipoInicial={gastoTipoInicial}
        />
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

      {showModal === 'tarjetas' && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" style={{ zIndex: 99998 }} onClick={() => setShowModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }} onClick={() => setShowModal(null)}>
        {/* ── MODAL GESTIÓN DE TARJETAS ── */}
        <div
          className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: 'calc(100dvh - 32px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-purple-950/50 to-gray-900 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/30">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Tarjetas de Crédito</h2>
                  <p className="text-xs text-gray-400">{deudasInstant.length} {deudasInstant.length === 1 ? 'tarjeta' : 'tarjetas'} registradas</p>
                </div>
              </div>
              <button onClick={() => setShowModal(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* BOTONES ACCIÓN */}
          <div className="flex-shrink-0 flex gap-3 px-5 pt-4 pb-3">
            <button
              onClick={() => { setDeudaEditando(null); abrirModal('agregarDeuda') }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-2xl font-semibold transition-all touch-manipulation text-sm shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-4 h-4" /> Nueva Tarjeta
            </button>
            <button
              onClick={() => { setDeudaEditando(null); abrirModal('pagoTarjeta') }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-semibold transition-all touch-manipulation text-sm shadow-lg shadow-emerald-900/30"
            >
              <CreditCard className="w-4 h-4" /> Pagar
            </button>
          </div>

          {/* RESUMEN TOTAL */}
          {deudasInstant.length > 0 && (
            <div className="flex-shrink-0 mx-5 mb-3 bg-red-950/30 border border-red-500/20 rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Total adeudado</span>
              <span className="text-xl font-bold text-red-400">
                ${deudasInstant.reduce((s, d) => s + Number(d.saldo || 0), 0).toFixed(2)}
              </span>
            </div>
          )}

          {/* LISTA DE TARJETAS + HISTORIAL */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-5 space-y-4"
            style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '20px' }}
          >
            {deudasInstant.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-8 h-8 text-purple-400/50" />
                </div>
                <p className="text-gray-400 font-medium">No hay tarjetas registradas</p>
                <p className="text-gray-500 text-sm mt-1">Agrega tu primera tarjeta de crédito</p>
              </div>
            ) : (
              deudasInstant.map((deuda) => {
                // Compras cargadas a esta tarjeta
                const compras = gastosInstant
                  .filter(g => g.deuda_id === deuda.id)
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                // Pagos a esta tarjeta
                const pagosTarjeta = pagosInstant
                  .filter(p => p.deuda_id === deuda.id)
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

                const totalMovimientos = compras.length + pagosTarjeta.length
                const expandido = tarjetaExpandidaId === deuda.id

                // Estado de historial por tarjeta
                const histTab = tarjetaHistTab?.[deuda.id] || 'pagos'
                const hoy2 = new Date()
                const mesFiltro = tarjetaMesFiltro?.[deuda.id] ||
                  `${hoy2.getFullYear()}-${String(hoy2.getMonth() + 1).padStart(2, '0')}`

                const [anoF, mesF] = mesFiltro.split('-').map(Number)

                const pagosDelMes = pagosTarjeta.filter(p => {
                  const f = new Date(p.fecha)
                  return f.getFullYear() === anoF && f.getMonth() + 1 === mesF
                })
                const comprasDelMes = compras.filter(g => {
                  const f = new Date(g.fecha)
                  return f.getFullYear() === anoF && f.getMonth() + 1 === mesF
                })
                const totalPagadoMes = pagosDelMes.reduce((s, p) => s + Number(p.monto_total || 0), 0)
                const totalGastadoMes = comprasDelMes.reduce((s, g) => s + Number(g.monto || 0), 0)

                // Meses disponibles para esta tarjeta
                const todosLosMeses = [
                  ...pagosTarjeta.map(p => p.fecha?.slice(0, 7)),
                  ...compras.map(g => g.fecha?.slice(0, 7)),
                ].filter(Boolean)
                const mesesUnicos = [...new Set(todosLosMeses)].sort().reverse().slice(0, 12)
                if (!mesesUnicos.includes(mesFiltro)) mesesUnicos.unshift(mesFiltro)

                const fmtMes = (mes) => {
                  const [a, m] = mes.split('-')
                  return new Date(Number(a), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }
                const fmtFechaCorta = (f) => f
                  ? new Date(f).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                  : ''
                const fmtMonto2 = (n) =>
                  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

                return (
                  <div key={deuda.id}>
                    <CardDeuda
                      deuda={deuda}
                      onEditar={() => { setDeudaEditando(deuda); abrirModal('agregarDeuda') }}
                      onEliminar={async () => {
                        const ok = await showConfirm({
                          titulo: `Delete "${deuda.cuenta}"?`,
                          mensaje: 'This debt record will be permanently removed.',
                          textoConfirmar: 'Delete',
                        });
                        if (ok) {
                          await deleteDebt(deuda.id)
                          setDeudasInstant(prev => {
                            const updated = prev.filter(d => d.id !== deuda.id)
                            localStorage.setItem('deudas_cache_v2', JSON.stringify(updated))
                            return updated
                          })
                        }
                      }}
                    />

                    {/* BOTÓN VER MOVIMIENTOS — oculto si no hay */}
                    {totalMovimientos > 0 && (
                      <button
                        onClick={() => setTarjetaExpandidaId(expandido ? null : deuda.id)}
                        className="w-full mt-1.5 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 rounded-xl transition-all touch-manipulation"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expandido ? 'rotate-90' : ''}`} />
                        {expandido ? 'Ocultar historial' : `Ver historial · ${totalMovimientos} movimiento${totalMovimientos !== 1 ? 's' : ''}`}
                      </button>
                    )}

                    {/* HISTORIAL CON TABS — solo visible al expandir */}
                    {expandido && (
                      <div className="mt-2 rounded-2xl border border-white/6 overflow-hidden"
                        style={{ background: 'rgba(17,24,39,0.7)' }}>

                        {/* TABS Pagos / Compras */}
                        <div className="flex gap-1 p-2 bg-gray-800/40">
                          {[
                            { key: 'pagos', label: 'Pagos', count: pagosTarjeta.length, color: 'text-emerald-400' },
                            { key: 'compras', label: 'Compras', count: compras.length, color: 'text-orange-400' },
                          ].map(tab => (
                            <button key={tab.key}
                              onClick={() => setTarjetaHistTab(prev => ({ ...prev, [deuda.id]: tab.key }))}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all touch-manipulation ${
                                histTab === tab.key ? 'bg-gray-700 text-white' : 'text-gray-500'
                              }`}
                            >
                              {tab.label}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 ${histTab === tab.key ? tab.color : 'text-gray-600'}`}>
                                {tab.count}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* FILTRO POR MES */}
                        {mesesUnicos.length > 0 && (
                          <div className="flex gap-1.5 px-2 pb-2 pt-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                            {mesesUnicos.map(mes => (
                              <button key={mes}
                                onClick={() => setTarjetaMesFiltro(prev => ({ ...prev, [deuda.id]: mes }))}
                                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all touch-manipulation ${
                                  mesFiltro === mes ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                                }`}
                              >
                                {fmtMes(mes)}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="px-2 pb-2 space-y-1.5">
                          {/* RESUMEN DEL MES */}
                          {histTab === 'pagos' && pagosDelMes.length > 0 && (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                              <span className="text-[10px] text-gray-400">{pagosDelMes.length} {pagosDelMes.length === 1 ? 'pago' : 'pagos'}</span>
                              <span className="text-[11px] font-black text-emerald-400">{fmtMonto2(totalPagadoMes)}</span>
                            </div>
                          )}
                          {histTab === 'compras' && comprasDelMes.length > 0 && (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-orange-500/8 border border-orange-500/15">
                              <span className="text-[10px] text-gray-400">{comprasDelMes.length} {comprasDelMes.length === 1 ? 'compra' : 'compras'}</span>
                              <span className="text-[11px] font-black text-orange-400">{fmtMonto2(totalGastadoMes)}</span>
                            </div>
                          )}

                          {/* LISTA PAGOS */}
                          {histTab === 'pagos' && (
                            pagosDelMes.length === 0
                              ? <p className="text-center py-4 text-gray-600 text-[10px]">Sin pagos este mes</p>
                              : pagosDelMes.map((pago, i) => (
                                <div key={`p-${pago.id || i}`} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-[10px]">💳</span>
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-semibold text-emerald-300">Pago realizado</p>
                                      <p className="text-[9px] text-gray-500">{fmtFechaCorta(pago.fecha)}{pago.metodo ? ` · ${pago.metodo}` : ''}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[12px] font-bold text-emerald-400">-{fmtMonto2(pago.monto_total || pago.monto)}</p>
                                    {pago.a_principal > 0 && <p className="text-[9px] text-emerald-600">Capital: {fmtMonto2(pago.a_principal)}</p>}
                                    {pago.intereses > 0 && <p className="text-[9px] text-red-400/60">Interés: {fmtMonto2(pago.intereses)}</p>}
                                  </div>
                                </div>
                              ))
                          )}

                          {/* LISTA COMPRAS */}
                          {histTab === 'compras' && (
                            comprasDelMes.length === 0
                              ? <p className="text-center py-4 text-gray-600 text-[10px]">Sin compras este mes</p>
                              : comprasDelMes.map((gasto, i) => {
                                const cat = (gasto.categoria || 'Compra').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim()
                                return (
                                  <div key={`g-${gasto.id || i}`} className="flex items-center justify-between bg-orange-500/5 border border-orange-500/10 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-orange-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px]">🛍️</span>
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-semibold text-white/80 truncate max-w-[130px]">
                                          {gasto.descripcion || cat}
                                        </p>
                                        <p className="text-[9px] text-gray-500">{cat} · {fmtFechaCorta(gasto.fecha)}</p>
                                      </div>
                                    </div>
                                    <span className="text-[12px] font-bold text-orange-300">+{fmtMonto2(gasto.monto)}</span>
                                  </div>
                                )
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
          </div>
        </>
      )}

      {showModal === 'pagoTarjeta' && (
        <ModalPagoTarjeta
          onClose={() => { setShowModal(null); setDeudaEditando(null) }}
          onSave={handleRegistrarPagoTarjeta}
          deudas={deudasInstant}
          deudaPreseleccionada={deudaEditando}
        />
      )}
      
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

      {/* MIS REPORTES — usa createPortal internamente */}
      {showExportacion && (
        <VisualizacionDatos
          onClose={() => setShowExportacion(false)}
          ingresos={ingresosInstant}
          gastos={gastosInstant}
          gastosFijos={gastosFijosInstant}
          suscripciones={suscripcionesInstant}
          deudas={deudasInstant}
          cuentas={cuentas}
        />
      )}

      {/* Tutorial legacy eliminado — reemplazado por OnboardingModal */}

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
        onOpenModal={abrirModal}
        alertasCount={alertas.length}
        coberturaBadge={cuentasEnRiesgo.length}
        nombreUsuario={usuario.nombre}
        onLogout={() => { localStorage.clear(); window.location.href = '/auth'; }}
        onOpenExport={() => { cerrarTodo(); setShowExportacion(true) }}
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

      {/* ── UPGRADE MODAL ── */}
      <ModalUpgrade
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />

      {/* ── ONBOARDING (solo nuevos usuarios) ── */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onAccionRapida={(key) => {
            setShowOnboarding(false)
            if (key === 'ingreso') abrirModal('ingreso')
            else if (key === 'gasto') abrirModal('gasto')
            else if (key === 'cuenta') abrirModal('cuentas')
          }}
        />
      )}

      {/* ── TOUR NUEVO USUARIO (cuando todo está en cero, después del onboarding) ── */}
      {mostrarTour && !showOnboarding && (
        <TourNuevoUsuario
          onCerrar={cerrarTour}
          onAccion={(key) => {
            // El tour pasa la acción clave y el dashboard abre el modal correspondiente
            if (key === 'ingreso') abrirModal('ingreso')
            else if (key === 'gasto') abrirModal('gasto')
            else if (key === 'cuenta') abrirModal('cuentas')
            else if (key === 'deuda') abrirModal('agregarDeuda')
          }}
        />
      )}
    </div>
  )
}

// COMPONENTE AUXILIAR PARA MODALES
function ModalWrapper({ show, onClose, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div
        className="relative w-full md:max-w-lg md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border-t md:border border-white/12 animate-in slide-in-from-bottom-10 duration-300"
        style={{
          maxHeight: 'calc(100dvh - 3.5rem - env(safe-area-inset-top, 0px))',
          background: 'linear-gradient(160deg, rgba(17,24,39,0.97) 0%, rgba(9,9,11,0.97) 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Shimmer top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        {/* Close button desktop */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 bg-white/6 hover:bg-white/12 rounded-full text-gray-400 hover:text-white transition-colors z-20 touch-manipulation hidden md:flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-y-auto p-0 md:p-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}