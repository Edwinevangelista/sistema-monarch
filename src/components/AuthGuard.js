import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Loader2 } from 'lucide-react'

function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // 🔐 DETECTAR RECOVERY FLOW DE SUPABASE
        const isRecoveryFlow =
          location.pathname === '/reset' &&
          window.location.hash.includes('type=recovery')

        if (error) {
          console.error('Error al verificar sesión:', error)
          if (!isRecoveryFlow) navigate('/auth')
          return
        }

        setSession(session)
        setLoading(false)

        // ❌ SOLO REDIRIGIR SI:
        // - NO hay sesión
        // - NO estamos en recovery
        if (!session && !isRecoveryFlow) {
          navigate('/auth')
        }

      } catch (error) {
        console.error('Error inesperado:', error)
        navigate('/auth')
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        setSession(session)

        if (event === 'SIGNED_OUT') {
          setLoading(false)
          navigate('/auth')
        }

        if (event === 'SIGNED_IN') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate, location.pathname])

  // Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return children
}

export default AuthGuard