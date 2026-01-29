// subscribeToPushFCM.js - VERSIÓN PRODUCCIÓN CON PERSISTENCIA
import { supabase } from './supabaseClient';

// 🔄 AUTOACTIVAR al cargar la página
export async function initializeNotificationsOnLoad() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Verificar si ya están activadas en BD
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subscription && Notification.permission === 'granted') {
      console.log('🔄 Reactivando notificaciones automáticamente...');
      await reactivateNotificationSystem();
      return true;
    }

    return false;
  } catch (error) {
    console.warn('No se pudieron reactivar notificaciones automáticamente:', error);
    return false;
  }
}

// 🔧 Reactivar sistema sin solicitar permisos nuevamente
async function reactivateNotificationSystem() {
  // Configurar función global
  window.showFinGuideNotification = function(title, body, options = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'finguide',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });
    }
  };

  // Configurar checks automáticos
  if (window.finGuideNotificationInterval) {
    clearInterval(window.finGuideNotificationInterval);
  }
  
  window.finGuideNotificationInterval = setInterval(async () => {
    try {
      await checkFinancialAlerts();
    } catch (error) {
      console.warn('Error en check automático:', error);
    }
  }, 30 * 60 * 1000); // 30 minutos

  console.log('🔄 Sistema de notificaciones reactivado');
}

export async function subscribeToPushFCM() {
  try {
    // Verificar soporte
    if (!('Notification' in window)) {
      throw new Error('Navegador no soporta notificaciones');
    }

    // Solicitar permisos
    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission === 'denied') {
      throw new Error('Permisos de notificaciones denegados. Ve a configuración del navegador para activarlos.');
    }
    
    if (permission !== 'granted') {
      throw new Error('Permisos de notificaciones no concedidos');
    }

    // Detectar dispositivo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    let strategy = 'web';
    
    if (isIOS) {
      strategy = isStandalone ? 'ios_pwa' : 'ios_web';
    } else if (isAndroid) {
      strategy = 'android_web';
    }

    // Generar token
    const token = 'local_' + strategy + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Verificar usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Guardar configuración en BD
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'browser_local_persistent',
          strategy: strategy,
          token: token,
          permissions: permission,
          device_info: {
            isIOS: isIOS,
            isAndroid: isAndroid,
            isStandalone: isStandalone,
            userAgent: navigator.userAgent,
            platform: navigator.platform
          },
          features: {
            auto_reactivate: true,
            local_notifications: true,
            financial_alerts: true,
            persistence: true
          },
          timestamp: new Date().toISOString()
        },
        endpoint: 'local://' + token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      throw dbError;
    }

    // Activar sistema
    await reactivateNotificationSystem();

    // Notificación de confirmación
    setTimeout(() => {
      if (window.showFinGuideNotification) {
        window.showFinGuideNotification(
          '🎉 FinGuide Activado',
          'Notificaciones activadas. Se reactivarán automáticamente al cargar la app.',
          { requireInteraction: true, tag: 'activation' }
        );
      }
    }, 1000);
    
    return {
      success: true,
      type: 'browser_local_persistent',
      strategy: strategy,
      token: token,
      auto_reactivate: true
    };

  } catch (error) {
    console.error('Error activando notificaciones:', error);
    throw error;
  }
}

// Función para checks automáticos de alertas financieras
async function checkFinancialAlerts() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check deudas próximas a vencer (próximos 7 días)
    const fechaLimite = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: deudas } = await supabase
      .from('deudas')
      .select('nombre, saldo_actual, fecha_corte')
      .eq('user_id', user.id)
      .eq('estado', 'Activa')
      .gte('fecha_corte', new Date().toISOString().split('T')[0])
      .lte('fecha_corte', fechaLimite);

    if (deudas && deudas.length > 0) {
      for (const deuda of deudas.slice(0, 2)) { // Máximo 2 alertas
        const diasRestantes = Math.ceil((new Date(deuda.fecha_corte) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 3 && window.showFinGuideNotification) {
          window.showFinGuideNotification(
            '💳 Recordatorio de Pago',
            `${deuda.nombre}: $${deuda.saldo_actual} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
            { tag: 'debt-reminder-' + deuda.nombre.replace(/\s/g, ''), requireInteraction: true }
          );
        }
      }
    }

    // Check suscripciones próximas a renovar
    const { data: suscripciones } = await supabase
      .from('suscripciones')
      .select('nombre, precio, proxima_fecha')
      .eq('user_id', user.id)
      .eq('activa', true)
      .lte('proxima_fecha', fechaLimite);

    if (suscripciones && suscripciones.length > 0) {
      for (const sub of suscripciones.slice(0, 1)) { // Máximo 1 alerta
        const dias = Math.ceil((new Date(sub.proxima_fecha) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (dias <= 2 && window.showFinGuideNotification) {
          window.showFinGuideNotification(
            '🔄 Renovación Próxima',
            `${sub.nombre}: $${sub.precio} se renovará en ${dias} día${dias !== 1 ? 's' : ''}`,
            { tag: 'subscription-renewal', requireInteraction: true }
          );
        }
      }
    }

  } catch (error) {
    console.warn('Error en check de alertas financieras:', error);
  }
}

export async function unsubscribeFromPushFCM() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Eliminar de BD
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // Limpiar sistema local
    if (window.finGuideNotificationInterval) {
      clearInterval(window.finGuideNotificationInterval);
      window.finGuideNotificationInterval = null;
    }
    
    if (window.showFinGuideNotification) {
      window.showFinGuideNotification = null;
    }

    return true;
    
  } catch (error) {
    console.error('Error desactivando notificaciones:', error);
    throw error;
  }
}

export function sendTestNotification(title, body) {
  if (Notification.permission === 'granted' && window.showFinGuideNotification) {
    window.showFinGuideNotification(
      title || 'FinGuide Test',
      body || 'Esta es una notificación de prueba',
      { tag: 'test', requireInteraction: true }
    );
    return true;
  }
  return false;
}

export function showNotification(title, body, options = {}) {
  if (window.showFinGuideNotification) {
    window.showFinGuideNotification(title, body, options);
    return true;
  }
  return false;
}