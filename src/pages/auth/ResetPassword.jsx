import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(true) // Empezar en loading mientras verificamos
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const initializeRecovery = async () => {
      console.log("🔐 ResetPassword: Iniciando verificación...")
      console.log("📍 URL completa:", window.location.href)
      console.log("🔗 Hash:", window.location.hash)
      console.log("❓ Search:", window.location.search)

      // 1. Verificar si ya hay una sesión activa (puede ser de recovery)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("❌ Error obteniendo sesión:", sessionError)
      }

      if (session) {
        console.log("✅ Sesión existente encontrada:", session.user?.email)
        setSessionReady(true)
        setLoading(false)
        return
      }

      // 2. Buscar tokens en el hash de la URL
      // Supabase envía: /reset#access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      console.log("🔑 Tokens encontrados:")
      console.log("  - type:", type)
      console.log("  - access_token:", accessToken ? "✅ presente" : "❌ ausente")
      console.log("  - refresh_token:", refreshToken ? "✅ presente" : "❌ ausente")

      if (type === 'recovery' && accessToken && refreshToken) {
        console.log("🔄 Estableciendo sesión de recuperación...")
        
        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (setSessionError) {
          console.error("❌ Error estableciendo sesión:", setSessionError)
          setError("El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.")
          setLoading(false)
          return
        }

        console.log("✅ Sesión establecida correctamente para:", data?.user?.email)
        setSessionReady(true)
        setLoading(false)
        
        // Limpiar el hash de la URL para seguridad
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      // 3. También verificar query params (algunos flujos de Supabase los usan)
      const urlParams = new URLSearchParams(window.location.search)
      const tokenFromQuery = urlParams.get('token')
      const typeFromQuery = urlParams.get('type')

      if (typeFromQuery === 'recovery' && tokenFromQuery) {
        console.log("🔄 Token encontrado en query params, verificando...")
        // Este caso es menos común pero puede ocurrir
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenFromQuery,
          type: 'recovery'
        })

        if (verifyError) {
          console.error("❌ Error verificando OTP:", verifyError)
          setError("El enlace de recuperación es inválido o ha expirado.")
          setLoading(false)
          return
        }

        setSessionReady(true)
        setLoading(false)
        return
      }

      // 4. Escuchar eventos de autenticación (por si el token se procesa después)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔔 Auth event:", event)
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("✅ Evento PASSWORD_RECOVERY detectado")
          setSessionReady(true)
          setLoading(false)
        } else if (event === 'SIGNED_IN' && session) {
          console.log("✅ Usuario autenticado:", session.user?.email)
          setSessionReady(true)
          setLoading(false)
        }
      })

      // 5. Si después de todo no hay sesión ni tokens, mostrar error
      setTimeout(() => {
        if (!sessionReady) {
          console.log("⏰ Timeout: No se detectó sesión de recuperación")
          setError("No se detectó una solicitud de recuperación válida. Asegúrate de usar el enlace del email.")
          setLoading(false)
        }
      }, 3000)

      return () => {
        subscription.unsubscribe()
      }
    }

    initializeRecovery()
  }, [sessionReady])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      console.log("🔄 Actualizando contraseña...")
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      console.log("✅ Contraseña actualizada exitosamente")
      setSuccess(true)
      
      // Cerrar sesión para que el usuario inicie con la nueva contraseña
      await supabase.auth.signOut()
      
      setTimeout(() => {
        navigate('/auth')
      }, 2000)

    } catch (error) {
      console.error('❌ Error actualizando contraseña:', error)
      setError(error.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Estado de carga inicial
  if (loading && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verificando enlace de recuperación...</p>
          <p className="text-gray-400 text-sm mt-2">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">

        {/* HEADER */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
          <h1 className="text-2xl font-bold text-white text-center">
            Crear nueva contraseña
          </h1>
          <p className="text-gray-400 text-sm text-center mt-2">
            Ingresa tu nueva contraseña para continuar
          </p>
        </div>

        {/* FORM */}
        {!success ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-800 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!sessionReady}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirma la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!sessionReady}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-200 text-sm">{error}</p>
                  {error.includes('inválido') || error.includes('expirado') ? (
                    <button
                      type="button"
                      onClick={() => navigate('/auth')}
                      className="text-red-300 hover:text-white text-xs underline mt-2"
                    >
                      Solicitar nuevo enlace →
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Cambiar contraseña'
              )}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h3>
            <p className="text-gray-400 text-sm">
              Redirigiendo al inicio de sesión…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}