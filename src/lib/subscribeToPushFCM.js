// subscribeToPushFCM.js - Versión ULTRA SIMPLE (sin errores de sintaxis)
import { supabase } from './supabaseClient';

export async function subscribeToPushFCM() {
  console.log('📱 INICIANDO Notificaciones Ultra Simples');
  alert('📱 Activando notificaciones...');

  try {
    // PASO 1: Verificar soporte
    if (!('Notification' in window)) {
      throw new Error('Navegador no soporta notificaciones');
    }
    
    alert('✅ Navegador compatible');

    // PASO 2: Solicitar permisos
    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    alert(`📱 Permisos: ${permission}`);
    
    if (permission === 'denied') {
      alert('❌ PERMISOS DENEGADOS\n\nPara activar:\n1. Clic ícono de candado en barra de direcciones\n2. Cambiar "Notificaciones" a "Permitir"\n3. Recargar página');
      throw new Error('Permisos denegados');
    }
    
    if (permission !== 'granted') {
      throw new Error('Permisos no concedidos');
    }
    
    alert('✅ Permisos concedidos');

    // PASO 3: Detectar dispositivo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let strategy = 'web';
    let message = '💻 Notificaciones web estándar';
    
    if (isIOS) {
      strategy = 'ios';
      message = '📱 iOS: Para mejores notificaciones, instala como PWA (Compartir → Añadir a inicio)';
    } else if (isAndroid) {
      strategy = 'android';
      message = '🤖 Android: Notificaciones web funcionales';
    }
    
    alert(message);

    // PASO 4: Generar token simple
    const token = 'simple_' + strategy + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    alert('✅ Token generado');

    // PASO 5: Verificar usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }
    
    alert('✅ Usuario verificado');

    // PASO 6: Guardar en BD (estructura simple)
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'simple',
          strategy: strategy,
          token: token,
          permissions: permission,
          isIOS: isIOS,
          isAndroid: isAndroid,
          timestamp: new Date().toISOString()
        },
        endpoint: 'simple://' + token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      alert('❌ Error BD: ' + dbError.message);
      throw dbError;
    }
    
    alert('✅ Guardado en BD');

    // PASO 7: Configurar sistema local
    window.showFinGuideNotification = function(title, body) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico'
        });
      }
    };

    alert('✅ Sistema configurado');

    // PASO 8: Notificación de prueba
    setTimeout(() => {
      new Notification('🎉 FinGuide Activado', {
        body: 'Notificaciones activadas. Estrategia: ' + strategy,
        icon: '/favicon.ico'
      });
    }, 1000);

    alert('🎉 ¡ÉXITO! Notificaciones activas');
    
    return {
      success: true,
      type: 'simple',
      strategy: strategy,
      token: token
    };

  } catch (error) {
    alert('❌ ERROR: ' + error.message);
    throw error;
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

    if (window.showFinGuideNotification) {
      window.showFinGuideNotification = null;
    }

    alert('🔕 Notificaciones desactivadas');
    return true;
    
  } catch (error) {
    alert('❌ Error: ' + error.message);
    throw error;
  }
}

export function sendTestNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title || 'FinGuide Test', {
      body: body || 'Prueba de notificación',
      icon: '/favicon.ico'
    });
    return true;
  } else {
    alert('❌ Sin permisos');
    return false;
  }
}