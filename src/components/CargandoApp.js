import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Wallet, Coffee, Sparkles, Loader2, CheckCircle } from 'lucide-react'

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
  "💡 Tu salud mental es más importante que tu dinero, pero el dinero ayuda a tu salud.",
]

export default function CargandoApp() {
  const navigate = useNavigate()
  
  const [progreso, setProgreso] = useState(0)
  const [usuario, setUsuario] = useState(null) 
  const [consejo, setConsejo] = useState(CONSEJOS_FINANCIEROS[0])
  const [listoParaNavegar, setListoParaNavegar] = useState(false)

  useEffect(() => {
    let montado = true

    // 1. Seleccionar consejo aleatorio
    const randomTip = CONSEJOS_FINANCIEROS[Math.floor(Math.random() * CONSEJOS_FINANCIEROS.length)]
    setConsejo(randomTip)

    // 2. Lógica de Carga Inteligente
    const inicializarSesion = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!session || sessionError) {
          if (montado) navigate('/auth')
          return
        }

        // Obtener datos del usuario
        let datosUsuario = {
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || '',
          apellido: session.user.user_metadata?.apellido || '',
          moneda: session.user.user_metadata?.moneda || 'USD',
          avatar_url: session.user.user_metadata?.avatar_url
        }

        try {
          const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single()
          if (perfil) datosUsuario = { ...datosUsuario, ...perfil }
        } catch (err) { /* No fatal */ }

        // ✅ PRE-CARGA DE DATOS (Mantener lógica inteligente)
        try {
          const user_id = session.user.id
          const tables = [
            { name: 'ingresos', table: 'ingresos' },
            { name: 'gastos', table: 'gastos' },
            { name: 'gastos_fijos', table: 'gastos_fijos' },
            { name: 'suscripciones', table: 'suscripciones' },
            { name: 'deudas', table: 'deudas' },
            { name: 'cuentas', table: 'cuentas_bancarias' }
          ];

          for (const t of tables) {
            const { data } = await supabase.from(t.table).select('*').eq('user_id', user_id)
            localStorage.setItem(`${t.name}_cache_v2`, JSON.stringify(data || []))
          }
        } catch (err) {
          console.error("❌ Error pre-cargando datos:", err)
        }

        localStorage.setItem('usuario_finguide', JSON.stringify(datosUsuario))
        setUsuario(datosUsuario)

        // E. SIMULAR CARGA VISUAL
        const delayDeCarga = 2000
        const pasosTotales = 20
        const delayPorPaso = delayDeCarga / pasosTotales 

        for (let i = 1; i <= pasosTotales; i++) {
          if (!montado) break
          await new Promise(resolve => setTimeout(resolve, delayPorPaso))
          if (montado) setProgreso(Math.floor((i / pasosTotales) * 100))
        }

        if (montado) {
          setListoParaNavegar(true)
          setTimeout(() => {
            navigate('/dashboard')
          }, 800) 
        }

      } catch (err) {
        console.error("Error en carga inicial:", err)
        if (montado) navigate('/auth')
      }
    }

    // Optimización: Login reciente
    const tiempoLogin = sessionStorage.getItem('ultimo_login_timestamp')
    if (tiempoLogin) {
      const segundosPasados = (Date.now() - parseInt(tiempoLogin)) / 1000
      if (segundosPasados < 10) {
        sessionStorage.setItem('ultimo_login_timestamp', '')
        navigate('/dashboard')
        return
      }
    }

    inicializarSesion()

    return () => {
      montado = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      
      {/* Fondo Atmosférico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* CARD PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Linea de progreso superior */}
          <div className="absolute top-0 left-0 h-1 w-full bg-white/5">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progreso}%` }}
            />
          </div>

          {/* AVATAR / ICONO */}
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 animate-pulse rounded-full" />
            {usuario?.avatar_url ? (
              <img 
                src={usuario.avatar_url} 
                alt="Avatar" 
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 object-cover shadow-2xl"
              />
            ) : (
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/10">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-md" />
              </div>
            )}
            
            {/* Estado de Carga (Icono) */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 border-gray-900 transition-all duration-500 transform scale-0">
              {!listoParaNavegar ? (
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-400 animate-spin" />
              ) : (
                <div className="bg-green-500 rounded-full w-full h-full flex items-center justify-center animate-bounce-in">
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* TEXTO DINÁMICO */}
        <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-200 mb-2 tracking-tight">
  {listoParaNavegar ? '¡Todo listo!' : (() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return '☀️ Buenos días';
    if (hora >= 12 && hora < 19) return '☕ Buenas tardes';
    return '🌙 Buenas noches';
  })()}
</h1>
<p className="text-white font-medium text-lg mb-8">
  {listoParaNavegar 
    ? 'Iniciando experiencia...' 
    : `${usuario?.nombre ? usuario.nombre.split(' ')[0] : usuario?.email?.split('@')[0] || 'Usuario'} 👋`
  }
</p>

          {/* BARRA DE PROGRESO */}
          {!listoParaNavegar && (
            <div className="mb-10">
              <div className="flex justify-between text-xs md:text-sm font-semibold text-blue-300 mb-3">
                <span>Cargando activos financieros...</span>
                <span>{progreso}%</span>
              </div>
              <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}

          {/* TARJETA DE CONSEJO */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 rounded-2xl p-6 text-left relative overflow-hidden group hover:border-purple-400/30 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/30 transition-colors" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-400 shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-yellow-300/80 uppercase tracking-wider mb-2">Consejo del Día</p>
                <p className="text-sm md:text-base text-gray-200 font-medium leading-relaxed">
                  {consejo}
                </p>
              </div>
            </div>
          </div>

          {/* INDICADOR FINAL */}
          <div className="mt-8 h-12 flex items-center justify-center">
            {!listoParaNavegar ? (
              <div className="flex items-center gap-2 text-blue-400/70 text-sm font-medium animate-pulse">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <div className="w-2 h-2 bg-blue-400 rounded-full" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full" style={{ animationDelay: '0.4s' }} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 font-semibold animate-in fade-in slide-in-from-bottom-4">
                <Coffee className="w-5 h-5" /> Disfruta tu experiencia
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}