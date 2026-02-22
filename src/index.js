import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ Limpiar caches corruptos (arrays vacíos) al arrancar
const CACHE_KEYS_GASTOS = ['gastos_cache_v2', 'gastos_variables_cache'];
CACHE_KEYS_GASTOS.forEach(key => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Si el cache tiene data:[] o es [] directo → corrupto, eliminar
      const data = parsed?.data ?? parsed;
      if (Array.isArray(data) && data.length === 0) {
        localStorage.removeItem(key);
        console.log('🧹 Cache corrupto eliminado:', key);
      }
    }
  } catch(e) {
    localStorage.removeItem(key);
  }
});

// ✅ Desregistrar SWs viejos que bloqueen actualizaciones
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      // Si el SW en espera existe, forzar que tome control inmediatamente
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA y notificaciones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
        // Si hay un SW esperando, activarlo inmediatamente
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nuevo SW listo — recargar para usar código nuevo
                console.log('🔄 Nuevo SW disponible, recargando...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('❌ Error registrando Service Worker:', error);
      });
  });
}

reportWebVitals();
