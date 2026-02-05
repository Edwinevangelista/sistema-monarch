import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (!supported) {
      throw new Error('Las notificaciones no están soportadas');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribeToPush = async () => {
    try {
      const registration = await registerServiceWorker();
      
      if (permission !== 'granted') {
        const perm = await requestPermission();
        if (perm !== 'granted') {
          throw new Error('Permiso denegado');
        }
      }

      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        setSubscription(sub);
        return sub;
      }

      console.log('✅ Service Worker listo para notificaciones');
      return { success: true };
    } catch (error) {
      console.error('❌ Error suscribiendo:', error);
      throw error;
    }
  };

  const showLocalNotification = async (title, options = {}) => {
    console.log('🔔 Intentando mostrar notificación:', title);
    
    // Verificar permiso
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ No hay permiso para notificaciones');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Por favor permite las notificaciones para usar esta función');
        return;
      }
    }

    try {
      // Esperar a que el service worker esté listo
      const registration = await navigator.serviceWorker.ready;
      
      // Mostrar notificación a través del service worker
      await registration.showNotification(title, {
        body: options.body || 'Notificación de finguide App',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        tag: 'finguide App-' + Date.now(),
        requireInteraction: false,
        data: options.data || {},
        ...options
      });
      
      console.log('✅ Notificación mostrada exitosamente');
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
      
      // Fallback - notificación directa del navegador
      try {
        new Notification(title, {
          body: options.body || 'Notificación de finguide App',
          icon: '/logo192.png',
          ...options
        });
        console.log('✅ Notificación mostrada (fallback)');
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        alert('Error mostrando notificación: ' + fallbackError.message);
      }
    }
  };

  return {
    supported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    showLocalNotification
  };
};
