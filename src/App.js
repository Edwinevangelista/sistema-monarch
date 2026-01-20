import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

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
// Este componente detecta si hay tokens de recuperación en la URL
// y redirige automáticamente a /reset
function RecoveryTokenHandler({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkForRecoveryToken = async () => {
      // 1. Buscar tokens en el hash de la URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      console.log('🔍 RecoveryTokenHandler - Verificando URL...')
      console.log('📍 Pathname:', location.pathname)
      console.log('🔗 Hash:', window.location.hash)
      console.log('🔑 Type:', type)

      // 2. Si es un token de recovery y NO estamos en /reset, redirigir
      if (type === 'recovery' && accessToken && location.pathname !== '/reset') {
        console.log('🔄 Token de recovery detectado, redirigiendo a /reset...')
        // Mantener el hash con los tokens al redirigir
        navigate('/reset' + window.location.hash, { replace: true })
        return
      }

      // 3. También escuchar eventos de auth por si el token se procesa automáticamente
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

  // Mostrar loading muy breve mientras verifica
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
        {/* 🔐 RESET DE CONTRASEÑA */}
        <Route path="/reset" element={<ResetPassword />} />

        {/* 🔁 COMPATIBILIDAD */}
        <Route path="/auth/reset" element={<Navigate to="/reset" replace />} />

        {/* ✅ PANTALLA DE CARGA POST LOGIN */}
        <Route
          path="/loading"
          element={
            <AuthGuard>
              <CargandoApp />
            </AuthGuard>
          }
        />

        {/* AUTENTICACIÓN */}
        <Route path="/auth" element={<Auth />} />

        {/* ALIAS DE COMPATIBILIDAD */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />

        {/* DASHBOARD (PROTEGIDO) */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardCompleto />
            </AuthGuard>
          }
        />

        {/* DEFAULT - Importante: NO redirigir ciegamente a /auth */}
        {/* El RecoveryTokenHandler ya maneja los tokens */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </RecoveryTokenHandler>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App