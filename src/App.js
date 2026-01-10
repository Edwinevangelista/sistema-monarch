import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// NUEVO SISTEMA DE AUTENTICACIÓN
import Auth from './pages/Auth'
import AuthGuard from './components/AuthGuard'

// COMPONENTES EXISTENTES Y NUEVO
import DashboardCompleto from './components/DashboardCompleto'
import CargandoApp from './components/CargandoApp' // ✅ IMPORTAR LA NUEVA PANTALLA DE BIENVENIDA

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ NUEVA RUTA: PANTALLA DE CARGA / BIENVENIDA */}
        {/* Se ejecuta después de un login exitoso */}
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

        {/* RUTA DEL DASHBOARD */}
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