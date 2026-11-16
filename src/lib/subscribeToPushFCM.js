// subscribeToPushFCM.js — Web Push real con VAPID
// ✅ Funciona con app CERRADA en Android PWA e iOS 16.4+ PWA
// Usa pushManager.subscribe() → endpoint real del navegador
// El servidor envía push via Edge Function → SW lo recibe → muestra notificación

import { supabase } from './supabaseClient'
import { buildAlertas } from '../utils/buildAlertas'

// VAPID public key — la public key es segura para incluir en el código
// La private key NUNCA va aquí — solo en Supabase Edge Secrets
const VAPID_PUBLIC_KEY =
  (typeof process !== 'undefined' && process.env?.REACT_APP_VAPID_PUBLIC_KEY) ||
  'BPNpjiRIjO5GUm8kplBVt1J-NLZhkrl1BN3GZ3g-NuXo9ns4euIMFJyqGR1yDvyuJ76vbhLbd1qFEHf8aRKo0QM'

// ============================================================
// HELPER: convertir VAPID key base64url → Uint8Array
// ============================================================
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ============================================================
// MOSTRAR NOTIFICACIÓN VÍA SERVICE WORKER (foreground/background)
// ============================================================
export async function showNotificationViaSW(title, body, options = {}) {
  if (Notification.permission !== 'granted') return false
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        body,
        icon: '/icons/FinGuide_AppIcon_192.png',
        badge: '/icons/FinGuide_AppIcon_192.png',
        vibrate: [200, 100, 200],
        requireInteraction: options.requireInteraction || false,
        tag: options.tag || 'finguide-' + Date.now(),
        silent: options.silent || false,
        data: options.data || {}
      })
      return true
    }
  } catch (err) {
    console.warn('SW notification failed, fallback:', err)
  }
  // Fallback desktop sin SW
  try {
    new Notification(title, { body, icon: '/icons/FinGuide_AppIcon_192.png', ...options })
    return true
  } catch (e) {
    return false
  }
}

// ============================================================
// SUSCRIBIR CON WEB PUSH REAL (pushManager)
// ============================================================
export async function subscribeToPushFCM() {
  try {
    // 1. Verificar soporte
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones')
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Este navegador no soporta Web Push')
    }

    // 2. Pedir permiso
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission === 'denied') {
      throw new Error('Permisos denegados. Actívalos en Configuración del navegador.')
    }
    if (permission !== 'granted') {
      throw new Error('No se concedieron los permisos')
    }

    // 3. Registrar / obtener Service Worker
    let registration
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      await navigator.serviceWorker.ready
      console.log('✅ Service Worker listo')
    } catch (swErr) {
      console.warn('SW registration warning:', swErr)
      registration = await navigator.serviceWorker.ready
    }

    // 4. Suscribir al Push Manager con VAPID real
    let pushSubscription = null
    if (VAPID_PUBLIC_KEY && 'PushManager' in window) {
      try {
        // Cancelar suscripción previa si existe
        const existingSub = await registration.pushManager.getSubscription()
        if (existingSub) {
          await existingSub.unsubscribe()
        }
        // Timeout de 15 segundos para iOS que puede tardar más
        const subscribePromise = registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('pushManager timeout')), 15000)
        )
        pushSubscription = await Promise.race([subscribePromise, timeoutPromise])
        console.log('✅ Push subscription creada:', pushSubscription.endpoint)
      } catch (pushErr) {
        console.warn('⚠️ pushManager.subscribe falló:', pushErr.message)
        // Continuar sin push real — solo notificaciones foreground
        pushSubscription = null
      }
    } else {
      console.warn('⚠️ PushManager no disponible o sin VAPID key — modo foreground')
    }

    // 5. Detectar dispositivo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true
    let strategy = 'web'
    if (isIOS && isStandalone) strategy = 'ios_pwa'
    else if (isIOS) strategy = 'ios_web'
    else if (isAndroid && isStandalone) strategy = 'android_pwa'
    else if (isAndroid) strategy = 'android_web'

    // 6. Obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Usuario no autenticado')

    // 7. Preparar datos de suscripción para guardar en BD
    let subscriptionData
    if (pushSubscription) {
      // ✅ Web Push real — el servidor puede enviar push aunque la app esté cerrada
      const subJSON = pushSubscription.toJSON()
      subscriptionData = {
        type: 'web_push',
        strategy,
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: subJSON.keys?.p256dh,
          auth: subJSON.keys?.auth
        },
        device: { isIOS, isAndroid, isStandalone, ua: navigator.userAgent.substring(0, 100) },
        timestamp: new Date().toISOString()
      }
    } else {
      // Fallback — solo foreground (sin VAPID key o plataforma no soportada)
      const token = 'sw_' + strategy + '_' + Date.now()
      subscriptionData = {
        type: 'service_worker_foreground',
        strategy,
        token,
        permissions: permission,
        sw_scope: registration?.scope || '/',
        device: { isIOS, isAndroid, isStandalone, ua: navigator.userAgent.substring(0, 100) },
        timestamp: new Date().toISOString()
      }
    }

    // 8. Guardar en BD (upsert por user_id)
    const endpoint = pushSubscription
      ? pushSubscription.endpoint
      : 'sw://' + subscriptionData.token

    // Extract p256dh + auth as flat columns so the cron job can read them directly
    const subJSON = pushSubscription ? pushSubscription.toJSON() : null
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscriptionData,
        endpoint,
        p256dh: subJSON?.keys?.p256dh || null,
        auth: subJSON?.keys?.auth || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (dbError) throw dbError

    // 9. Activar sistema en-app
    _setupGlobalNotifier()
    _setupPeriodicChecks()

    // 10. Notificación de confirmación
    const isPushReal = !!pushSubscription
    setTimeout(() => {
      showNotificationViaSW(
        '🎉 FinGuide Activado',
        isPushReal
          ? 'Notificaciones activas. Recibirás alertas aunque la app esté cerrada.'
          : 'Notificaciones activas mientras uses la app.',
        { requireInteraction: true, tag: 'activation' }
      )
    }, 800)

    return { success: true, strategy, type: isPushReal ? 'web_push' : 'foreground_only' }

  } catch (error) {
    console.error('Error activando notificaciones:', error)
    throw error
  }
}

// ============================================================
// REACTIVAR AL CARGAR (sin pedir permisos de nuevo)
// ============================================================
export async function initializeNotificationsOnLoad() {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
    if (Notification.permission !== 'granted') return false

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Verificar suscripción en BD
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', user.id)
      .single()

    if (!sub) return false

    // Si tiene Web Push real, verificar que la suscripción del navegador siga activa
    if (sub.subscription?.type === 'web_push' && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        if (!existing && VAPID_PUBLIC_KEY) {
          // Renovar suscripción automáticamente
          console.log('🔄 Renovando suscripción push expirada...')
          await subscribeToPushFCM()
          return true
        }
      } catch (e) {
        console.warn('No se pudo verificar suscripción push:', e)
      }
    }

    _setupGlobalNotifier()
    _setupPeriodicChecks()
    console.log('🔔 Notificaciones reactivadas')
    return true
  } catch (err) {
    console.warn('No se pudieron reactivar notificaciones:', err)
    return false
  }
}

// ============================================================
// HELPERS INTERNOS
// ============================================================
function _setupGlobalNotifier() {
  window.showFinGuideNotification = async (title, body, options = {}) => {
    await showNotificationViaSW(title, body, options)
  }
}

function _setupPeriodicChecks() {
  if (window._finGuideCheckInterval) clearInterval(window._finGuideCheckInterval)
  // Check inmediato al activar
  setTimeout(() => _checkFinancialAlerts(), 3000)
  // Check cada 30 minutos (mientras app abierta)
  window._finGuideCheckInterval = setInterval(() => {
    _checkFinancialAlerts().catch(console.warn)
  }, 30 * 60 * 1000)
}

async function _checkFinancialAlerts() {
  try {
    if (Notification.permission !== 'granted') return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fase 1: un solo constructor de alertas (buildAlertas) — la misma
    // lógica que el dashboard, con pago_minimo para deudas (antes el
    // cuerpo mostraba el saldo total) y fechas en America/New_York.
    // Solo corre con la app abierta; el cron de Vercel es el sistema
    // servidor de avisos. En primer plano solo se notifican las que
    // vencen en ≤3 días; el resto se ve en la bandeja de alertas.
    const [deudasRes, fijosRes, subsRes] = await Promise.all([
      supabase.from('deudas')
        .select('id, cuenta, saldo, pago_minimo, vence, aviso_dias')
        .eq('user_id', user.id).eq('estado', 'Activa'),
      supabase.from('gastos_fijos')
        .select('id, nombre, monto, dia_venc, estado, aviso_dias')
        .eq('user_id', user.id),
      supabase.from('suscripciones')
        .select('id, servicio, costo, proximo_pago, estado, aviso_dias')
        .eq('user_id', user.id),
    ])

    const alertas = buildAlertas({
      gastosFijos: fijosRes.data || [],
      suscripciones: subsRes.data || [],
      deudas: deudasRes.data || [],
      hoy: new Date(),
    })

    const proximas = alertas.filter(a => a.dias <= 3).slice(0, 2)
    for (const alerta of proximas) {
      const cuando = alerta.dias < 0
        ? `vencido hace ${Math.abs(alerta.dias)} día${Math.abs(alerta.dias) !== 1 ? 's' : ''}`
        : alerta.dias === 0 ? 'vence hoy' : `vence en ${alerta.dias} día${alerta.dias !== 1 ? 's' : ''}`
      await showNotificationViaSW(
        alerta.dias < 0 ? '⚠️ Pago vencido' : '⏰ Pago próximo',
        `${alerta.mensajeCorto}: $${Number(alerta.monto || 0).toFixed(2)} — ${cuando}`,
        { tag: alerta.id, requireInteraction: alerta.dias <= 0 }
      )
    }
  } catch (err) {
    console.warn('Error en alertas financieras:', err)
  }
}

// ============================================================
// DESUSCRIBIR
// ============================================================
export async function unsubscribeFromPushFCM() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Cancelar suscripción push del navegador (con timeout para no colgarse)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, r) => setTimeout(() => r(new Error('sw timeout')), 4000))
        ])
        const sub = await registration.pushManager?.getSubscription()
        if (sub) await sub.unsubscribe()
      } catch (e) {
        console.warn('No se pudo cancelar pushManager (ignorado):', e.message)
      }
    }

    // Eliminar de BD
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    if (window._finGuideCheckInterval) {
      clearInterval(window._finGuideCheckInterval)
      window._finGuideCheckInterval = null
    }
    window.showFinGuideNotification = null
    return true
  } catch (err) {
    console.error('Error desactivando notificaciones:', err)
    throw err
  }
}

// ============================================================
// TEST
// ============================================================
export function sendTestNotification(title, body) {
  if (Notification.permission === 'granted') {
    showNotificationViaSW(
      title || '🔔 FinGuide Test',
      body || 'Las notificaciones funcionan correctamente',
      { tag: 'test-' + Date.now(), requireInteraction: true }
    )
    return true
  }
  return false
}

export function showNotification(title, body, options = {}) {
  return showNotificationViaSW(title, body, options)
}
