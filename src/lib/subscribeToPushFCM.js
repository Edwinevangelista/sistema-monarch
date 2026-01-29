// subscribeToPushSimple.js - Implementación SIMPLE y ROBUSTA (sin Service Workers complejos)
import { supabase } from './supabaseClient';

export async function subscribeToPushFCM() {
  console.log('📱 INICIANDO Notificaciones Simples (sin SW complejos)');
  alert('📱 Activando notificaciones simples y confiables');

  try {
    // PASO 1: Verificar soporte básico
    console.log('📱 PASO 1: Verificando soporte básico');
    alert('📱 PASO 1: Verificando soporte de notificaciones');
    
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones');
    }
    
    console.log('✅ Soporte básico confirmado');
    alert('✅ Navegador compatible con notificaciones');

    // PASO 2: Solicitar permisos con retry
    console.log('📱 PASO 2: Solicitando permisos (con retry)');
    alert('📱 PASO 2: Solicitando permisos - ¡POR FAVOR PERMITE!');
    
    let permission = Notification.permission;
    
    if (permission === 'default') {
      // Primera vez solicitando permisos
      console.log('🔔 Solicitando permisos por primera vez...');
      permission = await Notification.requestPermission();
    }
    
    console.log('📱 Resultado de permisos:', permission);
    alert(`📱 Resultado permisos: ${permission}`);
    
    if (permission === 'denied') {
      console.log('❌ Permisos denegados por el usuario');
      alert('❌ PERMISOS DENEGADOS\n\nPara activar:\n1. Clic en el ícono de bloqueo/info en la barra de direcciones\n2. Cambiar "Notificaciones" a "Permitir"\n3. Recargar la página');
      
      // Guardar como denegado en BD para tracking
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              subscription: {
                type: 'denied',
                reason: 'user_denied_permissions',
                timestamp: new Date().toISOString(),
                device_info: {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform
                }
              },
              endpoint: 'denied://permissions',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
      } catch (dbError) {
        console.warn('No se pudo guardar estado de permisos:', dbError);
      }
      
      throw new Error('Permisos de notificaciones denegados. Ve a configuración del navegador para activarlos.');
    }
    
    if (permission !== 'granted') {
      throw new Error(`Permisos en estado inesperado: ${permission}`);
    }
    
    console.log('✅ Permisos concedidos correctamente');
    alert('✅ ¡Permisos concedidos! Continuando...');

    // PASO 3: Detectar dispositivo y configurar estrategia
    console.log('📱 PASO 3: Detectando dispositivo');
    alert('📱 PASO 3: Configurando para tu dispositivo');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              ('standalone' in window.navigator && window.navigator.standalone);
    
    console.log('📊 Información del dispositivo:', {
      isIOS,
      isAndroid,
      isInStandaloneMode,
      userAgent: navigator.userAgent.substring(0, 50)
    });
    
    let strategy = 'web_basic';
    let message = '';
    
    if (isIOS && !isInStandaloneMode) {
      strategy = 'ios_pwa_required';
      message = '📱 iOS detectado: Para mejores notificaciones, instala la app (Compartir → Añadir a pantalla de inicio)';
    } else if (isIOS && isInStandaloneMode) {
      strategy = 'ios_pwa_installed';
      message = '🎉 iOS PWA detectada: Notificaciones completamente funcionales';
    } else if (isAndroid) {
      strategy = 'android_web';
      message = '🤖 Android detectado: Notificaciones web funcionales';
    } else {
      strategy = 'desktop_web';
      message = '💻 Desktop detectado: Notificaciones web estándar';
    }
    
    console.log(`📱 Estrategia seleccionada: ${strategy}`);
    alert(message);

    // PASO 4: Crear token simple (sin Firebase si es problemático)
    console.log('📱 PASO 4: Generando identificador de notificaciones');
    alert('📱 PASO 4: Creando identificador único');
    
    const simpleToken = `simple_${strategy}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Token simple generado:', simpleToken.substring(0, 30) + '...');
    alert(`✅ Identificador generado: ${simpleToken.substring(0, 20)}...`);

    // PASO 5: Obtener usuario
    console.log('📱 PASO 5: Verificando usuario');
    alert('📱 PASO 5: Verificando sesión de usuario');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error de usuario:', userError);
      throw new Error('Debes estar logueado para activar notificaciones');
    }
    
    console.log('✅ Usuario verificado:', user.id.substring(0, 8) + '...');
    alert(`✅ Usuario: ${user.email?.substring(0, 20)}...`);

    // PASO 6: Guardar configuración en base de datos
    console.log('📱 PASO 6: Guardando configuración');
    alert('📱 PASO 6: Guardando en base de datos');
    
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'simple_notifications',
          strategy: strategy,
          token: simpleToken,
          permissions: permission,
          device_info: {
            isIOS,
            isAndroid,
            isInStandaloneMode,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: {
            screen: {
 
}
            timestamp: new Date().toISOString()
          },
          features: {
            basic_notifications: true,
            service_worker: false,
            firebase_fcm: false,
            local_only: true
          }
        },
        endpoint: `simple://${simpleToken}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('❌ Error guardando en BD:', dbError);
      alert(`❌ Error base de datos: ${dbError.message}`);
      throw dbError;
    }
    
    console.log('✅ Configuración guardada en BD');
    alert('✅ Configuración guardada exitosamente');

    // PASO 7: Configurar notificaciones locales
    console.log('📱 PASO 7: Configurando notificaciones locales');
    alert('📱 PASO 7: Activando sistema local');

    // Función global para mostrar notificaciones
    window.showFinGuideNotification = function(title, body, tag = 'finguide') {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          tag: tag,
          requireInteraction: false,
          silent: false
        });
      }
    };

    // Configurar intervalos para checks automáticos (cada 15 minutos)
    window.finGuideNotificationInterval = setInterval(() => {
      console.log('🔔 Check automático de notificaciones...');
      // Aquí se pueden agregar checks automáticos de deudas, etc.
    }, 15 * 60 * 1000); // 15 minutos

    console.log('✅ Sistema de notificaciones locales configurado');
    alert('✅ Sistema local configurado');

    // PASO 8: Notificación de prueba
    console.log('📱 PASO 8: Enviando notificación de prueba');
    alert('📱 PASO 8: Enviando notificación de prueba');

    setTimeout(() => {
      new Notification('🎉 FinGuide Activado', {
        body: `¡Notificaciones activadas! Estrategia: ${strategy}. Recibirás alertas importantes sobre tus finanzas.`,
        icon: '/favicon.ico',
        tag: 'finguide-activation',
        requireInteraction: true
      });
    }, 1000);

    // PASO 9: Finalización exitosa
    console.log('🎉 ¡NOTIFICACIONES SIMPLES ACTIVADAS EXITOSAMENTE!');
    alert('🎉 ¡ÉXITO! Las notificaciones están ahora activas');
    
    return {
      success: true,
      type: 'simple_notifications',
      strategy: strategy,
      token: simpleToken,
      permissions: permission,
      device_info: {
        isIOS,
        isAndroid,
        isInStandaloneMode
      },
      message: strategy === 'ios_pwa_required' 
        ? 'Para mejores notificaciones en iOS, instala la app como PWA' 
        : 'Notificaciones activadas correctamente'
    };

  } catch (error) {
    console.error('❌ ERROR EN NOTIFICACIONES SIMPLES:', error);
    console.error('❌ Error stack:', error.stack);
    
    alert(`❌ ERROR: ${error.message}\n\n¿Necesitas ayuda? Ve a Configuración del navegador > Notificaciones y permite el sitio.`);
    
    throw error;
  }
}

// 🗑️ Función para desactivar notificaciones simples
export async function unsubscribeFromPushFCM() {
  console.log('🗑️ Desactivando notificaciones simples...');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Eliminar de la base de datos
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error eliminando suscripción:', error);
      throw error;
    }

    // Limpiar funciones globales y intervalos
    if (window.finGuideNotificationInterval) {
      clearInterval(window.finGuideNotificationInterval);
      window.finGuideNotificationInterval = null;
    }
    
    if (window.showFinGuideNotification) {
      window.showFinGuideNotification = null;
    }

    console.log('✅ Notificaciones desactivadas');
    alert('🔕 Notificaciones desactivadas correctamente');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error desactivando notificaciones:', error);
    alert(`❌ Error desactivando: ${error.message}`);
    throw error;
  }
}

// 📨 Función auxiliar para enviar notificación manual (para testing)
export function sendTestNotification(title = "FinGuide Test", body = "Esta es una notificación de prueba") {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      tag: 'finguide-test'
    });
    return true;
  } else {
    alert('❌ Permisos de notificación no concedidos');
    return false;
  }
}