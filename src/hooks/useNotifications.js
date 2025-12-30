import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (!supported) {
      throw new Error('Las notificaciones no están soportadas en este navegador');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribeToPush = async () => {
    try {
      const registration = await registerServiceWorker();
      
      // Solicitar permiso si no lo tiene
      if (permission !== 'granted') {
        const perm = await requestPermission();
        if (perm !== 'granted') {
          throw new Error('Permiso de notificaciones denegado');
        }
      }

      // Por ahora, solo registrar sin VAPID keys
      // En producción necesitarás generar VAPID keys en el backend
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        setSubscription(sub);
        return sub;
      }

      console.log('Service Worker listo para notificaciones');
      return { success: true };
    } catch (error) {
      console.error('Error suscribiendo a notificaciones:', error);
      throw error;
    }
  };

  const showLocalNotification = (title, options = {}) => {
    if (permission !== 'granted') {
      console.warn('No hay permiso para mostrar notificaciones');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body: options.body || '',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          data: options.data || {},
          ...options
        });
      });
    } else {
      // Fallback a notificación del navegador
      new Notification(title, {
        body: options.body || '',
        icon: '/logo192.png',
        ...options
      });
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
