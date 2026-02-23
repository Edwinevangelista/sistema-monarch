import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { Toaster } from 'sonner'

// 🔔 NOTIFICACIONES - NUEVA INTEGRACIÓN
import { initializeNotificationsOnLoad } from './lib/subscribeToPushFCM'

// AUTENTICACIÓN
import Auth from './pages/Auth'
import AuthGuard from './components/AuthGuard'

// APP PRINCIPAL
import DashboardCompleto from './components/DashboardCompleto'
import CargandoApp from './components/CargandoApp'

// 🔐 RESET DE CONTRASEÑA
import ResetPassword from './pages/auth/ResetPassword'

// ============================================
// 🔐 COMPONENTE PARA DETECTAR TOKENS DE RECOVERY
// ============================================
function RecoveryTokenHandler({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkForRecoveryToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      console.log('🔍 RecoveryTokenHandler - Verificando URL...')
      console.log('📍 Pathname:', location.pathname)
      console.log('🔗 Hash:', window.location.hash)
      console.log('🔑 Type:', type)

      if (type === 'recovery' && accessToken && location.pathname !== '/reset') {
        console.log('🔄 Token de recovery detectado, redirigiendo a /reset...')
        navigate('/reset' + window.location.hash, { replace: true })
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 Auth Event en Handler:', event)
        if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/reset') {
          console.log('🔄 Evento PASSWORD_RECOVERY detectado, redirigiendo...')
          navigate('/reset', { replace: true })
        }
      })

      setChecking(false)

      return () => {
        subscription.unsubscribe()
      }
    }

    checkForRecoveryToken()
  }, [navigate, location.pathname])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return children
}

// ============================================
// APP PRINCIPAL
// ============================================
function AppRoutes() {
  return (
    <RecoveryTokenHandler>
      <Routes>
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/auth/reset" element={<Navigate to="/reset" replace />} />
        <Route
          path="/loading"
          element={
            <AuthGuard>
              <CargandoApp />
            </AuthGuard>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardCompleto />
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </RecoveryTokenHandler>
  )
}

// ============================================
// 🔔 COMPONENTE DE INICIALIZACIÓN DE NOTIFICACIONES
// ============================================
function NotificationInitializer() {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setTimeout(async () => {
          try {
            const notificationsReactivated = await initializeNotificationsOnLoad()
            if (notificationsReactivated) {
              console.log('🔔 Sistema de notificaciones reactivado automáticamente')
            }
          } catch (error) {
            console.warn('Info: No se pudieron reactivar notificaciones automáticamente')
          }
        }, 2000)
      } catch (error) {
        console.warn('Info: Inicialización de notificaciones omitida')
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      initializeNotifications()
    }
  }, [])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <NotificationInitializer />

      {/* 🍞 TOAST NOTIFICATIONS GLOBALES */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />

      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
