// src/App.js - VERSIÓN CORREGIDA
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// NUEVO SISTEMA DE AUTENTICACIÓN
import Auth from './pages/Auth'
import AuthGuard from './components/AuthGuard'

// COMPONENTES EXISTENTES
import DashboardCompleto from './components/DashboardCompleto'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA DE AUTENTICACIÓN ÚNICA */}
        <Route path="/auth" element={<Auth />} />
        
        {/* ALIAS PARA COMPATIBILIDAD */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth" replace />} />
        <Route path="/reset-password" element={<Navigate to="/auth" replace />} />

        {/* RUTA PROTEGIDA - DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardCompleto />
            </AuthGuard>
          }
        />

        {/* REDIRECCIONES */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App