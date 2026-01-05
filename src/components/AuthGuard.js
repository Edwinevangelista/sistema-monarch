// src/components/AuthGuard.js
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Wallet } from 'lucide-react'

function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error al verificar sesión:', error)
          navigate('/auth')
          return
        }

        setSession(session)
        setLoading(false)
        
        if (!session) {
          navigate('/auth')
        }
      } catch (error) {
        console.error('Error inesperado:', error)
        navigate('/auth')
      }
    }

    checkSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        
        if (event === 'SIGNED_OUT') {
          navigate('/auth')
        }
        
        if (event === 'SIGNED_IN') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Sistema Monarch</p>
          <p className="text-gray-400 text-sm mt-2">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión, no renderizar nada (se redirige automáticamente)
  if (!session) {
    return null
  }

  // Si hay sesión, renderizar el contenido protegido
  return children
}

export default AuthGuard