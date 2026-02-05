import React, { useEffect, useState } from 'react';
import { Bell, Wifi, WifiOff, Play, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNotificationSystem } from '../hooks/useNotificationSystem';

// ============================================
// COMPONENTE: NotificationStatusWidget
// ============================================
// Widget compacto que muestra el estado de las notificaciones
// y ejecuta el sistema automático
export default function NotificationStatusWidget({ 
  alertas = [], 
  showLocalNotification,
  className = "" 
}) {
  const {
    pushEnabled,
    isSubscribed,
    processing,
    lastCheck,
    triggerNotificationCheck,
    enablePushNotifications,
    checkPushSubscription
  } = useNotificationSystem(alertas, showLocalNotification);

  const [manualTrigger, setManualTrigger] = useState(false);

  // ✅ Verificar estado push al montar
  useEffect(() => {
    checkPushSubscription();
  }, [checkPushSubscription]);

  // ✅ Trigger manual para testing
  const handleManualTrigger = async () => {
    try {
      setManualTrigger(true);
      await triggerNotificationCheck();
      console.log('✅ Trigger manual completado');
    } catch (error) {
      console.error('❌ Error en trigger manual:', error);
    } finally {
      setManualTrigger(false);
    }
  };

  // ✅ Activar push si no está habilitado
  const handleEnablePush = async () => {
    try {
      await enablePushNotifications();
      alert('✅ Notificaciones push activadas');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const getStatusColor = () => {
    if (processing || manualTrigger) return 'text-yellow-400';
    if (pushEnabled && alertas.length > 0) return 'text-red-400 animate-pulse';
    if (pushEnabled) return 'text-green-400';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (processing || manualTrigger) return 'Procesando...';
    if (!pushEnabled) return 'Push desactivado';
    if (alertas.length > 0) return `${alertas.length} alerta${alertas.length > 1 ? 's' : ''}`;
    return 'Sin alertas';
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${pushEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
            {pushEnabled ? (
              <Wifi className={`w-4 h-4 ${getStatusColor()}`} />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Sistema Push</h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Botón de acción */}
        {!pushEnabled ? (
          <button
            onClick={handleEnablePush}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/30"
          >
            Activar
          </button>
        ) : (
          <button
            onClick={handleManualTrigger}
            disabled={processing || manualTrigger}
            className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors border border-purple-500/30 disabled:opacity-50"
            title="Ejecutar chequeo manual"
          >
            {processing || manualTrigger ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Estados */}
      <div className="space-y-2">
        
        {/* Estado de suscripción */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Push habilitado:</span>
          <span className={`flex items-center gap-1 ${pushEnabled ? 'text-green-400' : 'text-red-400'}`}>
            {pushEnabled ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {pushEnabled ? 'Sí' : 'No'}
          </span>
        </div>

        {/* Último chequeo */}
        {lastCheck && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Último chequeo:</span>
            <span className="text-gray-300">
              {new Date(lastCheck).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}

        {/* Alertas detectadas */}
        {alertas.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-red-400 text-xs font-medium">
                {alertas.length} alerta{alertas.length > 1 ? 's' : ''} activa{alertas.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Estado de procesamiento */}
      {processing && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-xs">
              Ejecutando sistema automático...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: NotificationTester  
// ============================================
// Componente para testing manual del sistema
export function NotificationTester({ className = "" }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runFullTest = async () => {
    try {
      setTesting(true);
      setResults(null);

      console.log('🧪 Iniciando test completo del sistema...');

      // 1. Verificar Service Worker
      const swRegistration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker:', swRegistration ? 'Activo' : 'No encontrado');

      // 2. Verificar suscripción push  
      const pushSubscription = await swRegistration.pushManager.getSubscription();
      console.log('✅ Push Subscription:', pushSubscription ? 'Activa' : 'No encontrada');

      // 3. Ejecutar Edge Function
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/automated-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          type: 'payment_check',
          test: true 
        })
      });

      const edgeResult = await response.json();
      console.log('✅ Edge Function Result:', edgeResult);

      // 4. Mostrar notificación local de prueba
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🧪 FinGuide Test', {
          body: 'Sistema de notificaciones funcionando correctamente',
          icon: '/branding/app/FinGuide_AppIcon_192.png',
          tag: 'test-notification'
        });
      }

      setResults({
        success: true,
        serviceWorker: !!swRegistration,
        pushSubscription: !!pushSubscription,
        edgeFunction: edgeResult.success || false,
        edgeData: edgeResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en test:', error);
      setResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          Test Sistema
        </h3>
        <button
          onClick={runFullTest}
          disabled={testing}
          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {testing ? 'Ejecutando...' : 'Ejecutar Test'}
        </button>
      </div>

      {results && (
        <div className={`p-3 rounded-xl border text-xs ${
          results.success 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className={`font-medium mb-2 ${results.success ? 'text-green-400' : 'text-red-400'}`}>
            {results.success ? '✅ Test Exitoso' : '❌ Test Falló'}
          </div>
          
          {results.success ? (
            <div className="space-y-1 text-gray-300">
              <div>Service Worker: {results.serviceWorker ? '✅' : '❌'}</div>
              <div>Push Subscription: {results.pushSubscription ? '✅' : '❌'}</div>
              <div>Edge Function: {results.edgeFunction ? '✅' : '❌'}</div>
              {results.edgeData?.results && (
                <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                  <pre>{JSON.stringify(results.edgeData.results, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-300">
              Error: {results.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}