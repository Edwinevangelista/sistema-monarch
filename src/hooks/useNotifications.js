import { useState, useEffect } from 'react'

// Detecta si estamos corriendo en Capacitor (Android/iOS nativo)
const isNative = () => {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform())
  } catch {
    return false
  }
}

export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (isNative()) {
      // En Capacitor siempre están soportadas — usamos el plugin nativo
      setSupported(true)
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then(result => {
          setPermission(result.receive === 'granted' ? 'granted' : 'default')
        }).catch(() => setPermission('default'))
      }).catch(() => setPermission('default'))
    } else if ('serviceWorker' in navigator && 'Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!supported) throw new Error('Las notificaciones no están soportadas')

    if (isNative()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        const result = await PushNotifications.requestPermissions()
        if (result.receive === 'granted') {
          await PushNotifications.register()
          setPermission('granted')
          return 'granted'
        } else {
          setPermission('denied')
          return 'denied'
        }
      } catch (e) {
        console.error('Error solicitando permisos nativos:', e)
        throw e
      }
    } else {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
  }

  const showLocalNotification = async (title, options = {}) => {
    if (isNative()) {
      try {
        const mod = await import('@capacitor/local-notifications').catch(() => null)
        if (mod && mod.LocalNotifications) {
          await mod.LocalNotifications.schedule({
            notifications: [{
              title,
              body: options.body || '',
              id: Math.floor(Date.now() / 1000),
              schedule: { at: new Date(Date.now() + 500) },
              extra: options.data || {}
            }]
          })
        }
      } catch (e) {
        console.warn('LocalNotifications no disponible:', e)
      }
      return
    }

    // Web / PWA
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          body: options.body || '',
          icon: '/icons/FinGuide_AppIcon_192.png',
          badge: '/icons/FinGuide_AppIcon_192.png',
          vibrate: [200, 100, 200],
          tag: options.tag || 'finguide-' + Date.now(),
          data: options.data || {}
        })
        return
      }
    } catch (swErr) {
      console.warn('SW notification failed:', swErr)
    }

    try {
      new Notification(title, { body: options.body || '', icon: '/icons/FinGuide_AppIcon_192.png' })
    } catch (e) {
      console.error('Notification fallback failed:', e)
    }
  }

  return { supported, permission, requestPermission, showLocalNotification }
}
