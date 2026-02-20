// subscribeToPushFCM.js — Sistema de notificaciones PWA via Service Worker
// Funciona en: Desktop Chrome, Android Chrome PWA, iOS Safari PWA (iOS 16.4+)
import { supabase } from './supabaseClient'

// ============================================================
// FUNCIÓN CENTRAL: Mostrar notificación via Service Worker
// ✅ Funciona en Android PWA, iOS PWA y Desktop
// ❌ new Notification() directo NO funciona en móvil PWA
// ============================================================
async function showNotificationViaSW(title, body, options = {}) {
  if (Notification.permission !== 'granted') return false

  try {
    // Siempre usar SW para garantizar compatibilidad móvil
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
    console.warn('SW notification failed, fallback to Notification API:', err)
  }

  // Fallback para desktop sin SW
  try {
    new Notification(title, { body, icon: '/icons/FinGuide_AppIcon_192.png', ...options })
    return true
  } catch (e) {
    console.error('Notification API fallback failed:', e)
    return false
  }
}

// ============================================================
// ACTIVAR SISTEMA AL CARGAR (sin pedir permisos de nuevo)
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!sub) return false

    // Activar función global (usa SW internamente)
    _setupGlobalNotifier()
    _setupPeriodicChecks()

    console.log('🔔 Notificaciones reactivadas automáticamente')
    return true
  } catch (err) {
    console.warn('No se pudieron reactivar notificaciones:', err)
    return false
  }
}

// ============================================================
// SUSCRIBIR — Solicitar permisos y guardar en BD
// ============================================================
export async function subscribeToPushFCM() {
  try {
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones')
    }

    // 1. Pedir permiso
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission === 'denied') {
      throw new Error('Permisos de notificaciones denegados. Actívalos en Configuración del navegador.')
    }
    if (permission !== 'granted') {
      throw new Error('No se concedieron los permisos')
    }

    // 2. Registrar Service Worker si no está registrado
    let registration = null
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js')
        await navigator.serviceWorker.ready
        console.log('✅ Service Worker listo')
      } catch (swErr) {
        console.warn('SW registration warning:', swErr)
      }
    }

    // 3. Detectar tipo de dispositivo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true

    let strategy = 'web'
    if (isIOS && isStandalone) strategy = 'ios_pwa'
    else if (isIOS) strategy = 'ios_web'
    else if (isAndroid && isStandalone) strategy = 'android_pwa'
    else if (isAndroid) strategy = 'android_web'

    // 4. Obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Usuario no autenticado')

    // 5. Guardar en BD
    const token = 'sw_' + strategy + '_' + Date.now()
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: {
          type: 'service_worker',
          strategy,
          token,
          permissions: permission,
          sw_scope: registration?.scope || '/',
          device: { isIOS, isAndroid, isStandalone, ua: navigator.userAgent.substring(0, 100) },
          timestamp: new Date().toISOString()
        },
        endpoint: 'sw://' + token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (dbError) throw dbError

    // 6. Activar el sistema
    _setupGlobalNotifier()
    _setupPeriodicChecks()

    // 7. Notificación de confirmación
    setTimeout(() => {
      showNotificationViaSW(
        '🎉 FinGuide Activado',
        'Las notificaciones financieras están activas. Te avisaremos de cobros próximos y alertas.',
        { requireInteraction: true, tag: 'activation' }
      )
    }, 800)

    return { success: true, strategy, type: 'service_worker' }

  } catch (error) {
    console.error('Error activando notificaciones:', error)
    throw error
  }
}

// ============================================================
// HELPERS INTERNOS
// ============================================================
function _setupGlobalNotifier() {
  // Exponer función global que usa SW (compatible con móvil)
  window.showFinGuideNotification = async function(title, body, options = {}) {
    await showNotificationViaSW(title, body, options)
  }
}

function _setupPeriodicChecks() {
  // Limpiar intervalo previo si existe
  if (window._finGuideCheckInterval) {
    clearInterval(window._finGuideCheckInterval)
  }

  // Check inmediato al activar
  setTimeout(() => _checkFinancialAlerts(), 3000)

  // Check cada 30 minutos
  window._finGuideCheckInterval = setInterval(() => {
    _checkFinancialAlerts().catch(console.warn)
  }, 30 * 60 * 1000)
}

async function _checkFinancialAlerts() {
  try {
    if (Notification.permission !== 'granted') return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const hoy = new Date().toISOString().split('T')[0]
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Alertas de deudas próximas a vencer
    const { data: deudas } = await supabase
      .from('deudas')
      .select('cuenta, saldo, vence')
      .eq('user_id', user.id)
      .eq('estado', 'Activa')
      .gte('vence', hoy)
      .lte('vence', en7Dias)

    if (deudas && deudas.length > 0) {
      for (const deuda of deudas.slice(0, 2)) {
        const diasRestantes = Math.ceil(
          (new Date(deuda.vence) - new Date()) / (1000 * 60 * 60 * 24)
        )
        if (diasRestantes <= 3) {
          await showNotificationViaSW(
            '💳 Fecha de Corte Próxima',
            `${deuda.cuenta}: $${Number(deuda.saldo || 0).toFixed(2)} — vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
            { tag: 'debt-' + (deuda.cuenta || '').replace(/\s/g, ''), requireInteraction: true }
          )
        }
      }
    }

    // Alertas de gastos fijos autopago próximos (3 días)
    const { data: gastosFijos } = await supabase
      .from('gastos_fijos')
      .select('nombre, monto, dia_venc')   // ✅ campo correcto: dia_venc
      .eq('user_id', user.id)
      .eq('autopago', true)                // ✅ campo correcto: autopago

    if (gastosFijos && gastosFijos.length > 0) {
      const diaHoy = new Date().getDate()
      for (const gf of gastosFijos) {
        const diasHastaVenc = (gf.dia_venc - diaHoy + 31) % 31  // ✅ dia_venc
        if (diasHastaVenc >= 0 && diasHastaVenc <= 2) {
          await showNotificationViaSW(
            '⚡ Cobro Automático Próximo',
            `${gf.nombre}: $${Number(gf.monto || 0).toFixed(2)} se cobra en ${diasHastaVenc === 0 ? 'hoy' : diasHastaVenc + ' día(s)'}`,
            { tag: 'autopago-' + (gf.nombre || '').replace(/\s/g, ''), requireInteraction: false }
          )
        }
      }
    }

  } catch (err) {
    console.warn('Error en check de alertas financieras:', err)
  }
}

// ============================================================
// DESUSCRIBIR
// ============================================================
export async function unsubscribeFromPushFCM() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

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
// ENVIAR NOTIFICACIÓN DE PRUEBA
// ============================================================
export function sendTestNotification(title, body) {
  if (Notification.permission === 'granted') {
    showNotificationViaSW(
      title || '🔔 FinGuide Test',
      body || 'Las notificaciones funcionan correctamente en tu dispositivo',
      { tag: 'test-' + Date.now(), requireInteraction: true }
    )
    return true
  }
  return false
}

export function showNotification(title, body, options = {}) {
  return showNotificationViaSW(title, body, options)
}
