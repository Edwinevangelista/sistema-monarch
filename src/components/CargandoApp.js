import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Wallet, Coffee, Sparkles, Loader2 } from 'lucide-react'

const CONSEJOS_FINANCIEROS = [
  "💡 Una regla de oro: Ahorra al menos el 10% de tus ingresos.",
  "💡 Antes de gastar, pregunta: ¿Lo necesito o solo lo quiero?",
  "💡 Usa la regla de las 72 horas para gastos grandes: espera 3 días.",
  "💡 Cancela una suscripción que no uses hoy y ahorra mañana.",
  "💡 Prioriza pagar tus deudas más caras (Método Bola de Nieve).",
  "💡 Lleva un registro de tus gastos diarios durante una semana.",
  "💡 Crea un fondo de emergencia equivalente a 3 meses de gastos.",
  "💡 Automatiza tus transferencias a ahorros apenas recibes tu sueldo.",
  "💡 Revisa tus suscripciones anuales, a veces las olvidamos y cobran igual.",
  "💡 Compara precios antes de compras grandes. Un 10% de descuento suma mucho.",
  "💡 Compra productos genéricos para productos de uso diario.",
  "💡 La comida fuera es el enemigo silencioso de tu presupuesto.",
  "💡 Paga tus tarjetas de crédito en su fecha de corte, no solo el vencimiento.",
  "💡 Divide tu sueldo en cuentas diferentes: Gastos, Ahorros y Cuentas Personales.",
  "💡 Si te sobra dinero al final del mes, abona a deuda o inviértelo.",
  "💡 La inflación aumenta, ajusta tu presupuesto mensual si puedes.",
  "💡 No gastes el dinero que aún no has recibido (bonos futuros).",
  "💡 Tu salud mental es más importante que tu dinero, pero el dinero ayuda a tu salud."
]

export default function CargandoApp() {
  const navigate = useNavigate()  
  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [progreso, setProgreso] = useState(0)
  const [usuario, setUsuario] = useState(null) // { nombre, email, avatar, ... }
  const [consejo, setConsejo] = useState(CONSEJOS_FINANCIEROS[0])

  useEffect(() => {
    let montado = true

    // 1. Seleccionar un consejo aleatorio
    const randomTip = CONSEJOS_FINANCIEROS[Math.floor(Math.random() * CONSEJOS_FINANCIEROS.length)]
    setConsejo(randomTip)

    // 2. Iniciar el proceso de carga
    const inicializarSesion = async () => {
      try {
        // A. Obtener sesión de Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!session || sessionError) {
          // Si no hay sesión, ir a Login
          if (montado) navigate('/auth')
          return
        }

        // B. Obtener datos adicionales del perfil
        // Si falla, usamos los datos básicos del auth
        let datosUsuario = {
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split('@')[0],
          apellido: session.user.user_metadata?.apellido || '',
          moneda: session.user.user_metadata?.moneda || 'USD',
          avatar_url: session.user.user_metadata?.avatar_url || null
        }

        try {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (perfil) {
            datosUsuario = { ...datosUsuario, ...perfil }
          }
        } catch (err) {
          console.warn("No se pudo obtener el perfil (quizás no existe la tabla), usando datos de auth:", err)
        }

        // C. Guardar en localStorage para que el Dashboard lo use inmediatamente
        localStorage.setItem('usuario_fintrack', JSON.stringify(datosUsuario))

        setUsuario(datosUsuario)
        // D. Simular carga visual (Animación de barra de progreso más lenta)
        // Ajustamos el tiempo a 3 segundos (3000ms) divididos en 20 pasos = 150ms por paso
        const pasos = 20
        const delayPorPaso = 150 
        
        for (let i = 1; i <= pasos; i++) {
          await new Promise(resolve => setTimeout(resolve, delayPorPaso))
          if (montado) setProgreso(Math.floor((i / pasos) * 100))
        }

        if (montado) {
          setLoading(false)
          navigate('/dashboard')
        }

      } catch (err) {
        console.error("Error en carga inicial:", err)
        if (montado) navigate('/auth')
      }
    }

    inicializarSesion()

    return () => {
      montado = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col items-center justify-center p-6 text-center">
      
      {/* CARD CENTRAL */}
      <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* AVATAR / ICONO */}
        <div className="mb-6 relative inline-block">
          {usuario?.avatar_url ? (
            <img 
              src={usuario.avatar_url} 
              alt="Avatar" 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-blue-500/30 object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500/30 shadow-lg text-white">
              <Wallet className="w-10 h-10" />
            </div>
          )}
          {/* Indicador de carga animado */}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-800 animate-pulse">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>

        {/* SALUDO DINÁMICO */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {loading ? 'Hola...' : `Hola, ${usuario.nombre.split(' ')[0]} 👋`}
        </h1>
        <p className="text-blue-200 text-sm md:text-base mb-6 opacity-90">
          {loading ? 'Preparando tu espacio financiero...' : 'Bienvenido de nuevo a FinTrack'}
        </p>

        {/* BARRA DE PROGRESO */}
        {loading && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Cargando datos</span>
              <span>{progreso}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-out"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}

        {/* RECOMENDACIÓN FINANCIERA */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                Consejo Financiero del Día
              </p>
              <p className="text-gray-200 text-sm font-medium leading-snug">
                {consejo}
              </p>
            </div>
          </div>
        </div>

        {/* ESTADO FINAL DE CARGA */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold animate-pulse">
            <Coffee className="w-4 h-4" /> Listo para iniciar
          </div>
        )}
      </div>
    </div>
  )
}