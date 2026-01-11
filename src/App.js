import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// NUEVO SISTEMA DE AUTENTICACIÓN
import Auth from './pages/Auth'
import AuthGuard from './components/AuthGuard'

// COMPONENTES PRINCIPALES
import DashboardCompleto from './components/DashboardCompleto'
import CargandoApp from './components/CargandoApp'

// PWA INSTALL BANNER (GLOBAL)


function App() {
  return (
    <BrowserRouter>


      <Routes>
        {/* ✅ PANTALLA DE CARGA / BIENVENIDA (POST LOGIN) */}
        <Route
          path="/loading"
          element={
            <AuthGuard>
              <CargandoApp />
            </AuthGuard>
          }
        />

        {/* RUTA DE AUTENTICACIÓN */}
        <Route path="/auth" element={<Auth />} />

        {/* ALIAS PARA COMPATIBILIDAD */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />
        <Route path="/reset-password" element={<Navigate to="/auth" replace />} />

        {/* DASHBOARD PRINCIPAL */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardCompleto />
            </AuthGuard>
          }
        />

        {/* REDIRECCIONES POR DEFECTO */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
