// CargandoApp.js — 2026 Design: moderno, finanzas para jóvenes
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TIPS = [
  { emoji: '💡', text: 'Ahorra el 10% de cada ingreso antes de gastar.' },
  { emoji: '📉', text: 'Cancela una suscripción que no uses. El tiempo vale más.' },
  { emoji: '🎯', text: 'Define un objetivo claro: sin meta, no hay dirección.' },
  { emoji: '⚡', text: 'Paga tus deudas más caras primero. La deuda es el enemigo.' },
  { emoji: '🏦', text: 'Tu fondo de emergencia = 3 meses de gastos. Es tu red de seguridad.' },
  { emoji: '📊', text: 'Lo que no se mide, no se puede mejorar. Registra todo.' },
  { emoji: '🚀', text: 'Automatiza tus ahorros. El mejor ahorro es el que no ves.' },
  { emoji: '💳', text: 'Paga tu tarjeta completa cada mes. Los intereses te roban.' },
]

const PASOS = [
  'Verificando tu sesión...',
  'Cargando tus datos financieros...',
  'Sincronizando ingresos y gastos...',
  'Preparando tu dashboard...',
  '¡Todo listo!',
]

export default function CargandoApp() {
  const navigate = useNavigate()
  const [progreso, setProgreso] = useState(0)
  const [usuario, setUsuario] = useState(null)
  const [pasoActual, setPasoActual] = useState(0)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  const [listo, setListo] = useState(false)

  useEffect(() => {
    let montado = true

    const inicializar = async () => {
      try {
        // Verificar sesión
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!session || error) {
          if (montado) navigate('/auth')
          return
        }

        let datos = {
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || '',
          moneda: session.user.user_metadata?.moneda || 'USD',
          avatar_url: session.user.user_metadata?.avatar_url
        }

        if (montado) { setPasoActual(0); setProgreso(15) }

        // Perfil
        try {
          const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single()
          if (perfil) datos = { ...datos, ...perfil }
        } catch { /* no fatal */ }

        if (montado) { setPasoActual(1); setProgreso(35) }

        // Pre-cargar datos financieros
        const tablas = [
          { name: 'ingresos', table: 'ingresos' },
          { name: 'gastos', table: 'gastos_variables' },
          { name: 'gastos_fijos', table: 'gastos_fijos' },
          { name: 'suscripciones', table: 'suscripciones' },
          { name: 'deudas', table: 'deudas' },
          { name: 'cuentas', table: 'cuentas_bancarias' },
        ]

        for (let i = 0; i < tablas.length; i++) {
          if (!montado) return
          const t = tablas[i]
          try {
            const { data } = await supabase.from(t.table).select('*').eq('user_id', session.user.id)
            localStorage.setItem(`${t.name}_cache_v2`, JSON.stringify(data || []))
          } catch { /* no fatal */ }
          if (montado) {
            setPasoActual(i < 3 ? 2 : 3)
            setProgreso(35 + Math.round(((i + 1) / tablas.length) * 55))
          }
        }

        localStorage.setItem('usuario_finguide', JSON.stringify(datos))
        if (montado) {
          setUsuario(datos)
          setPasoActual(4)
          setProgreso(100)
          setListo(true)
          setTimeout(() => { if (montado) navigate('/dashboard') }, 700)
        }

      } catch (err) {
        console.error('Error en carga:', err)
        if (montado) navigate('/auth')
      }
    }

    // Login reciente → skip animación
    const tiempoLogin = sessionStorage.getItem('ultimo_login_timestamp')
    if (tiempoLogin) {
      const seg = (Date.now() - parseInt(tiempoLogin)) / 1000
      if (seg < 10) {
        sessionStorage.setItem('ultimo_login_timestamp', '')
        navigate('/dashboard')
        return
      }
    }

    inicializar()
    return () => { montado = false }
  }, [navigate])

  const nombreDisplay = usuario?.nombre?.split(' ')[0] || usuario?.email?.split('@')[0] || ''
  const hora = new Date().getHours()
  const saludo = hora >= 5 && hora < 12 ? 'Buenos días' : hora >= 12 && hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 60%, #000000 100%)',
      }}
    >
      {/* Glows de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[10%] w-[45vw] h-[45vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      {/* CARD CENTRAL */}
      <div
        className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Barra de progreso top */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progreso}%`,
              background: 'linear-gradient(90deg, #6366f1, #10b981)',
              boxShadow: '0 0 8px rgba(99,102,241,0.6)',
            }}
          />
        </div>

        <div className="p-7 text-center">
          {/* Logo / Icono */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Anillo exterior animado */}
            <div
              className="absolute w-20 h-20 rounded-full"
              style={{
                border: `1.5px solid rgba(99,102,241,${listo ? '0.6' : '0.2'})`,
                animation: !listo ? 'spin 3s linear infinite' : 'none',
              }}
            />
            <div
              className="absolute w-16 h-16 rounded-full"
              style={{
                border: `1px dashed rgba(16,185,129,${listo ? '0.5' : '0.15'})`,
                animation: !listo ? 'spin 5s linear infinite reverse' : 'none',
              }}
            />
            {/* Icono central */}
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: listo
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                boxShadow: listo
                  ? '0 0 30px rgba(16,185,129,0.4)'
                  : '0 0 20px rgba(99,102,241,0.3)',
                transition: 'all 0.5s ease',
              }}
            >
              {listo
                ? <span className="text-2xl">✓</span>
                : <span className="text-2xl font-black text-white" style={{ fontFamily: 'monospace' }}>$</span>
              }
            </div>
          </div>

          {/* Texto de saludo */}
          <div className="mb-6">
            {nombreDisplay ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">{saludo}</p>
                <h1 className="text-2xl font-black text-white">{nombreDisplay} 👋</h1>
              </>
            ) : (
              <h1 className="text-2xl font-black text-white">FinGuide</h1>
            )}
            <p className={`text-sm mt-1 transition-all duration-300 ${listo ? 'text-emerald-400 font-semibold' : 'text-gray-500'}`}>
              {listo ? '¡Entrando al dashboard!' : PASOS[pasoActual]}
            </p>
          </div>

          {/* Barra de progreso principal */}
          {!listo && (
            <div className="mb-6">
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-400 ease-out"
                  style={{
                    width: `${progreso}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)',
                    boxShadow: '0 0 6px rgba(99,102,241,0.5)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-gray-600">Cargando...</span>
                <span className="text-[10px] text-gray-500 font-bold">{progreso}%</span>
              </div>
            </div>
          )}

          {/* Tip del día */}
          <div
            className="rounded-2xl p-4 text-left"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">💬 Tip financiero</p>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{tip.emoji}</span>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">{tip.text}</p>
            </div>
          </div>

          {/* Puntos animados loading */}
          {!listo && (
            <div className="flex justify-center gap-1.5 mt-5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                  style={{
                    animation: 'bounce 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Tag version */}
      <p className="relative z-10 mt-8 text-[10px] text-gray-700 font-medium tracking-widest uppercase">
        FinGuide · 2026
      </p>

      {/* Keyframes inline */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
