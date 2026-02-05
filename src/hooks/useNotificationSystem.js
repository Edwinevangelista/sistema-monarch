import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// ============================================
// HOOK: useNotificationSystem
// ============================================
// Integra alertas locales con push notifications automático
export function useNotificationSystem(alertas = [], showLocalNotification) {
  const [notificationState, setNotificationState] = useState({
    pushEnabled: false,
    isSubscribed: false,
    lastCheck: null,
    processing: false
  });

  // ✅ Verificar estado push al inicializar
  useEffect(() => {
    checkPushSubscription();
  }, []);

  const checkPushSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications no soportadas');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setNotificationState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        pushEnabled: !!subscription
      }));

      return !!subscription;
    } catch (error) {
      console.error('Error verificando push:', error);
      return false;
    }
  }, []);

  // ✅ Procesar alertas automáticamente
  useEffect(() => {
    if (!alertas || alertas.length === 0) return;

    processAlertasAutomaticamente();
  }, [alertas, notificationState.isSubscribed]);

  const processAlertasAutomaticamente = useCallback(async () => {
    try {
      setNotificationState(prev => ({ ...prev, processing: true }));

      const ahora = Date.now();
      const ultimaEjecucion = localStorage.getItem('finguide_last_notification_check');
      
      // ⏰ Solo ejecutar cada 30 minutos para evitar spam
      if (ultimaEjecucion && (ahora - parseInt(ultimaEjecucion)) < 30 * 60 * 1000) {
        console.log('⏳ Notificaciones: Esperando cooldown...');
        return;
      }

      console.log('🔔 Procesando alertas automáticamente...');
      console.log(`📊 Alertas detectadas: ${alertas.length}`);

      // 🔥 EJECUTAR automated-notifications Edge Function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('❌ No hay usuario autenticado');
        return;
      }

      // Llamar al Edge Function que ya funciona
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/automated-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          type: 'payment_check',
          user_context: {
            alertas_frontend: alertas.length,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Edge Function ejecutado:', result);

      // 📱 Si hay push habilitado Y alertas críticas, mostrar notificación local también
      if (notificationState.isSubscribed && alertas.some(a => a.tipo === 'critical')) {
        const alertaCritica = alertas.find(a => a.tipo === 'critical');
        
        if (showLocalNotification) {
          showLocalNotification('🚨 FinGuide - Alerta Crítica', {
            body: alertaCritica.mensaje,
            tag: 'critical-alert',
            requireInteraction: true,
            data: {
              url: '/dashboard',
              tipo: 'critical',
              timestamp: Date.now()
            }
          });
        }
      }

      // 💾 Actualizar timestamp
      localStorage.setItem('finguide_last_notification_check', ahora.toString());
      
      setNotificationState(prev => ({ 
        ...prev, 
        lastCheck: ahora,
        processing: false 
      }));

      console.log('✅ Sistema de notificaciones ejecutado correctamente');

    } catch (error) {
      console.error('❌ Error en sistema de notificaciones:', error);
      setNotificationState(prev => ({ ...prev, processing: false }));
    }
  }, [alertas, notificationState.isSubscribed, showLocalNotification]);

  // ✅ Función para forzar envío manual
  const triggerNotificationCheck = useCallback(async () => {
    // Resetear el cooldown para permitir ejecución inmediata
    localStorage.removeItem('finguide_last_notification_check');
    await processAlertasAutomaticamente();
  }, [processAlertasAutomaticamente]);

  // ✅ Función para activar push notifications
  const enablePushNotifications = useCallback(async () => {
    try {
      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        throw new Error('VAPID key no configurada');
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications no soportadas en este navegador');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permisos de notificación denegados');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      // Guardar suscripción en Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription,
            endpoint: subscription.endpoint,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          console.warn('No se pudo guardar suscripción en BD:', error);
        }
      }

      setNotificationState(prev => ({
        ...prev,
        isSubscribed: true,
        pushEnabled: true
      }));

      console.log('✅ Push notifications activadas');
      return true;

    } catch (error) {
      console.error('❌ Error activando push:', error);
      throw error;
    }
  }, []);

  // ✅ Función para desactivar push
  const disablePushNotifications = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remover de base de datos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }

      setNotificationState(prev => ({
        ...prev,
        isSubscribed: false,
        pushEnabled: false
      }));

      console.log('✅ Push notifications desactivadas');
      return true;

    } catch (error) {
      console.error('❌ Error desactivando push:', error);
      throw error;
    }
  }, []);

  return {
    ...notificationState,
    triggerNotificationCheck,
    enablePushNotifications,
    disablePushNotifications,
    checkPushSubscription,
    isReady: !notificationState.processing
  };
}

// ============================================
// HOOK: useAutomaticNotifications  
// ============================================
// Hook simplificado para usar en el dashboard
export function useAutomaticNotifications() {
  const [stats, setStats] = useState({
    lastRun: null,
    totalSent: 0,
    errors: []
  });

  const runAutomatedCheck = useCallback(async () => {
    try {
      console.log('🤖 Ejecutando chequeo automático de notificaciones...');
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/automated-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'all' })
      });

      const result = await response.json();
      console.log('📊 Resultado automated-notifications:', result);

      setStats(prev => ({
        ...prev,
        lastRun: new Date().toISOString(),
        totalSent: prev.totalSent + (result.results?.payment_notifications || 0),
        errors: result.results?.errors || []
      }));

      return result;

    } catch (error) {
      console.error('❌ Error en chequeo automático:', error);
      setStats(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
      throw error;
    }
  }, []);

  return {
    stats,
    runAutomatedCheck
  };
}