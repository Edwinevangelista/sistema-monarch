// subscribeToPushFCM.js - VERSIÓN PRODUCCIÓN (Sin debug)
import { supabase } from './supabaseClient';

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
    
    let strategy = 'web';
    
    if (isIOS) {
      strategy = 'ios';
    } else if (isAndroid) {
      strategy = 'android';
    }

    // Generar token
    const token = 'simple_' + strategy + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Verificar usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Guardar en base de datos
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'browser_local',
          strategy: strategy,
          token: token,
          permissions: permission,
          isIOS: isIOS,
          isAndroid: isAndroid,
          timestamp: new Date().toISOString()
        },
        endpoint: 'local://' + token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      throw dbError;
    }

    // Configurar sistema de notificaciones locales
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

    // Configurar checks automáticos para deudas y gastos (cada 30 minutos)
    if (window.finGuideNotificationInterval) {
      clearInterval(window.finGuideNotificationInterval);
    }
    
    window.finGuideNotificationInterval = setInterval(async () => {
      try {
        // Aquí se pueden agregar checks automáticos
        await checkFinancialAlerts();
      } catch (error) {
        console.warn('Error en check automático:', error);
      }
    }, 30 * 60 * 1000); // 30 minutos

    // Notificación de confirmación
    setTimeout(() => {
      if (window.showFinGuideNotification) {
        window.showFinGuideNotification(
          '🎉 FinGuide Activado',
          'Las notificaciones están ahora activas. Recibirás alertas sobre tus finanzas.',
          { requireInteraction: true }
        );
      }
    }, 1000);
    
    return {
      success: true,
      type: 'browser_local',
      strategy: strategy,
      token: token,
      message: isIOS && !window.matchMedia('(display-mode: standalone)').matches 
        ? 'Para mejores notificaciones en iOS, instala la app como PWA' 
        : 'Notificaciones activadas correctamente'
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

    // Check deudas próximas a vencer (próximos 3 días)
    const { data: deudas } = await supabase
      .from('deudas')
      .select('*')
      .eq('user_id', user.id)
      .eq('estado', 'Activa')
      .gte('fecha_corte', new Date().toISOString().split('T')[0])
      .lte('fecha_corte', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (deudas && deudas.length > 0) {
      const deuda = deudas[0];
      const diasRestantes = Math.ceil((new Date(deuda.fecha_corte) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (window.showFinGuideNotification) {
        window.showFinGuideNotification(
          '💳 Recordatorio de Pago',
          `${deuda.nombre}: $${deuda.saldo_actual} vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`,
          { tag: 'debt-reminder', requireInteraction: true }
        );
      }
    }

    // Check gastos excesivos del mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: gastos } = await supabase
      .from('gastos')
      .select('monto')
      .eq('user_id', user.id)
      .gte('fecha', inicioMes);

    if (gastos && gastos.length > 0) {
      const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
      
      // Si gastos superan $2000 USD (o equivalente)
      if (totalGastos > 2000) {
        if (window.showFinGuideNotification) {
          window.showFinGuideNotification(
            '📊 Alerta de Gastos',
            `Has gastado $${totalGastos.toFixed(2)} este mes. Considera revisar tu presupuesto.`,
            { tag: 'expense-alert', requireInteraction: true }
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
      { tag: 'test' }
    );
    return true;
  }
  return false;
}

// Función para mostrar notificación manual desde cualquier parte de la app
export function showNotification(title, body, options = {}) {
  if (window.showFinGuideNotification) {
    window.showFinGuideNotification(title, body, options);
    return true;
  }
  return false;
}