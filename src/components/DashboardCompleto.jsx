import React, { useState, useEffect } from 'react'
import { Wallet, Plus, CreditCard, Repeat, Upload, Bell, Sun, Moon, Coffee } from 'lucide-react'

// --- HOOKS ---
import { useInactivityTimeout } from '../hooks/useInactivityTimeout'
import { useIngresos } from '../hooks/useIngresos'
import { useGastosVariables } from '../hooks/useGastosVariables'
import { useGastosFijos } from '../hooks/useGastosFijos'
import { useSuscripciones } from '../hooks/useSuscripciones'
import { useDeudas } from '../hooks/useDeudas'
import { usePagosTarjeta } from '../hooks/usePagosTarjeta'

// --- COMPONENTES UI ---
import KPICard from './KPICard'
import ModalIngreso from './ModalIngreso'
import ModalGastos from './ModalGastos'
import ModalSuscripcion from './ModalSuscripcion'
import ModalPagoTarjeta from './ModalPagoTarjeta'
import ModalAgregarDeuda from './ModalAgregarDeuda'
import LectorEstadoCuenta from './LectorEstadoCuenta'
import Notificaciones from './Notificaciones'
import GraficaDona from './GraficaDona'
import GraficaBarras from './GraficaBarras'
import ListaDeudas from './ListaDeudas'
import ListaSuscripciones from './ListaSuscripciones'
import AsistenteFinancieroV2 from '../components/AsistenteFinancieroV2'
import ConfiguracionNotificaciones from './ConfiguracionNotificaciones'
import InfoMes from './InfoMes'
import LogoutButton from './LogoutButton'
import MenuFlotante from './MenuFlotante'
import ModalDetallesCategorias from './ModalDetallesCategorias'
import MenuInferior from './MenuInferior'
import ModalUsuario from "./ModalUsuario"

// --- NUEVOS COMPONENTES ---
import DebtPlannerModal from './DebtPlannerModal'
import SavingsPlannerModal from './SavingsPlannerModal'
import SpendingControlModal from './SpendingControlModal'

const DashboardCompleto = () => {
  // Estado del Usuario (Simulado)
  const [usuario, setUsuario] = useState({ 
    email: 'usuario@ejemplo.com', 
    nombre: '' 
  })
  
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

  // Estados de Modales
  const [showModal, setShowModal] = useState(null)
  const [showDetallesCategorias, setShowDetallesCategorias] = useState(false)
  const [showDebtPlanner, setShowDebtPlanner] = useState(false)
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false)
  const [showSpendingControl, setShowSpendingControl] = useState(false)

  // Estados para Edición
  const [ingresoEditando, setIngresoEditando] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastoFijoEditando, setGastoFijoEditando] = useState(null)
  const [suscripcionEditando, setSuscripcionEditando] = useState(null)
  const [deudaEditando, setDeudaEditando] = useState(null)

  useInactivityTimeout(15)

  // Hooks de datos
  const { ingresos, addIngreso } = useIngresos()
  const { gastos, addGasto } = useGastosVariables()
  const { gastosFijos, addGastoFijo } = useGastosFijos()
  const { suscripciones, addSuscripcion } = useSuscripciones()
  const { deudas, addDeuda, updateDeuda, refresh: refreshDeudas } = useDeudas()
  const { pagos, addPago, refresh: refreshPagos } = usePagosTarjeta()

  // 🔹 UTIL: ¿Pagada este mes?
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

  // Extraer nombre del email
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

  // Saludo y Motivación
  const obtenerSaludo = () => {
    const hora = new Date().getHours()
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

    const frases = [
      "¡Cada centavo cuenta para tu libertad financiera!",
      "Estás construyendo un futuro sólido, ¡sigue así!",
      "El control de hoy es la tranquilidad del mañana.",
      "¡Tu esfuerzo tiene recompensa, no te detengas ahora!"
    ]
    const fraseMotivacional = frases[Math.floor(Math.random() * frases.length)]

    return { textoHora, icono, fraseMotivacional }
  }

  const { textoHora, icono, fraseMotivacional } = obtenerSaludo()

  // Cálculos
  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto || 0), 0)
  const totalGastosFijos = gastosFijos.reduce((sum, g) => sum + (g.monto || 0), 0)
  const totalGastosVariables = gastos.reduce((sum, g) => sum + (g.monto || 0), 0)
  const totalSuscripciones = suscripciones
    .filter(s => s.estado === 'Activo')
    .reduce((sum, s) => {
      if (s.ciclo === 'Anual') return sum + (s.costo / 12)
      if (s.ciclo === 'Semanal') return sum + (s.costo * 4.33)
      return sum + s.costo
    }, 0)
  
  const totalGastos = totalGastosFijos + totalGastosVariables + totalSuscripciones
  const saldoMes = totalIngresos - totalGastos
  const tasaAhorro = totalIngresos > 0 ? ((saldoMes / totalIngresos) * 100).toFixed(1) : 0

  const gastosPorCategoria = {}
  ;[...gastosFijos, ...gastos, ...suscripciones.filter(s => s.estado === 'Activo')].forEach(item => {
    const cat = item.categoria || '📦 Otros'
    const monto = item.monto || item.costo || 0
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

  const obtenerAlertas = () => {
    const hoy = new Date()
    const alertas = []

    gastosFijos.forEach(gf => {
      if (gf.estado === 'Pagado' || !gf.dia_venc) return
      const diaVenc = new Date(hoy.getFullYear(), hoy.getMonth(), gf.dia_venc)
      const diff = Math.round((diaVenc - hoy) / (1000 * 60 * 60 * 24))
      
      if (diff <= 0) alertas.push({ tipo: 'critical', mensaje: `VENCIDO: ${gf.nombre}`, monto: gf.monto })
      else if (diff <= 5) alertas.push({ tipo: 'warning', mensaje: `${gf.nombre} vence en ${diff} días`, monto: gf.monto })
    })

    suscripciones.forEach(sub => {
      if (sub.estado === 'Cancelado' || !sub.proximo_pago) return
      const proxPago = new Date(sub.proximo_pago)
      const diff = Math.round((proxPago - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 3 && diff >= 0) alertas.push({ tipo: 'info', mensaje: `${sub.servicio} renueva en ${diff} días`, monto: sub.costo })
    })

    deudas.forEach(d => {
      if (!d.vence) return
      const vence = new Date(d.vence)
      const diff = Math.round((vence - hoy) / (1000 * 60 * 60 * 24))
      if (diff <= 5 && diff >= 0) alertas.push({ tipo: 'warning', mensaje: `${d.cuenta} vence en ${diff} días`, monto: d.pago_minimo })
    })

    return alertas
  }

  const alertas = obtenerAlertas()

  // KPIs para los planificadores
  const kpis = {
    totalIngresos,
    totalGastos,
    totalGastosFijos,
    totalGastosVariables,
    totalSuscripciones,
    saldo: saldoMes,
    tasaAhorro: parseFloat(tasaAhorro) / 100,
    totalDeudas: deudas.reduce((sum, d) => sum + (d.balance || 0), 0)
  }

  // Handlers
  const handleGuardarIngreso = async (data) => {
    try {
      await addIngreso(data)
      setShowModal(null)
      setIngresoEditando(null)
    } catch (e) {
      console.error('Error al guardar ingreso:', e)
    }
  }

  const handleGuardarGasto = async (data) => {
    try {
      await addGasto(data)
      setShowModal(null)
      setGastoEditando(null)
    } catch (e) {
      console.error('Error al guardar gasto:', e)
    }
  }

  const handleGuardarGastoFijo = async (data) => {
    try {
      await addGastoFijo(data)
      setShowModal(null)
      setGastoFijoEditando(null)
    } catch (e) {
      console.error('Error al guardar gasto fijo:', e)
    }
  }
  
  const handleGuardarSuscripcion = async (data) => {
    try {
      await addSuscripcion(data)
      setShowModal(null)
      setSuscripcionEditando(null)
    } catch (e) {
      console.error('Error al guardar suscripción:', e)
    }
  }

  const handleGuardarDeuda = async (data) => {
    try {
      if (data.id) {
        await updateDeuda(data.id, data)
      } else {
        await addDeuda(data)
      }
      setShowModal(null)
      setDeudaEditando(null)
    } catch (e) {
      console.error("Error guardando deuda:", e)
    }
  }

  const handleRegistrarPagoTarjeta = async (pago) => {
    try {
      const deuda = deudas.find(d => d.id === pago.deuda_id)
      if (!deuda) throw new Error('Deuda no encontrada')

      const principal = Number(pago.a_principal || 0)
      const intereses = Number(pago.intereses || 0)
      const total = Number(pago.monto_total || 0)

      if (principal + intereses !== total) {
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
        await updateDeuda(deuda.id, {
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

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="hidden md:block">
          <InfoMes />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard icon="💵" label="INGRESOS" value={totalIngresos} color="#10B981" />
          <KPICard icon="💸" label="GASTOS" value={totalGastos} color="#EF4444" />
          <KPICard icon="💰" label="SALDO" value={saldoMes} color="#06B6D4" />
          <KPICard icon="📊" label="AHORRO" value={tasaAhorro} color="#F59E0B" formatAsCurrency={false} suffix="%" />
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
          <Notificaciones alertas={alertas} />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficaDona 
            data={dataGraficaDona} 
            onCategoryClick={() => setShowDetallesCategorias(true)}
          />
          <GraficaBarras data={dataGraficaBarras} title="📈 Tendencia Semanal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListaDeudas
            deudas={deudas}
            deudaPagadaEsteMes={deudaPagadaEsteMes}
            onEditar={(deuda) => {
              setDeudaEditando(deuda)
              setShowModal('agregarDeuda')
            }}
          />

          <ListaSuscripciones 
            suscripciones={suscripciones} 
            onEditar={(sub) => {
              setSuscripcionEditando(sub)
              setShowModal('suscripcion')
            }}
          />
        </div>

        <div className="hidden md:block space-y-6">
          <ConfiguracionNotificaciones />
        </div>

        <div className="text-center text-gray-500 text-xs py-4 pb-20 md:pb-4">
          💡 Sistema Monarch v2.0 - Con IA Adaptativa
        </div>
      </div>

      {/* Modales */}
      {showModal === 'ingreso' && (
        <ModalIngreso
          onClose={() => { setShowModal(null); setIngresoEditando(null) }}
          onSave={handleGuardarIngreso}
          ingresoInicial={ingresoEditando}
        />
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
            window.location.href = "/login";
          }}
        />
      )}

      {showModal === 'suscripcion' && (
        <ModalSuscripcion 
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
              <button
                onClick={() => setShowModal('agregarDeuda')}
                className="w-full p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
              >
                📝 Registrar Tarjeta/Deuda
              </button>
              <button
                onClick={() => setShowModal('pagoTarjeta')}
                className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
              >
                💳 Pagar Tarjeta
              </button>
              <button
                onClick={() => setShowModal(null)}
                className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
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
            <Notificaciones alertas={alertas} />
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

      {/* NUEVOS MODALES */}
      {showDebtPlanner && (
        <DebtPlannerModal
          deudas={deudas}
          kpis={kpis}
          onClose={() => setShowDebtPlanner(false)}
        />
      )}

      {showSavingsPlanner && (
        <SavingsPlannerModal
          kpis={kpis}
          onClose={() => setShowSavingsPlanner(false)}
        />
      )}

      {showSpendingControl && (
        <SpendingControlModal
          gastosFijos={gastosFijos}
          gastosVariables={gastos}
          suscripciones={suscripciones}
          kpis={kpis}
          onClose={() => setShowSpendingControl(false)}
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
          window.location.href = '/login'
        }}
      />
    </div>
  )
}

export default DashboardCompleto