import { useState, useEffect } from 'react'

// Detección síncrona — Capacitor inyecta window.Capacitor antes de que React monte
const isNative = () => {
  try {
    return !!(window.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

// Inicialización síncrona: en nativo siempre soportado, en web verificar API
const getInitialSupported = () => {
  if (isNative()) return true
  return !!(typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window)
}

export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [supported] = useState(getInitialSupported) // síncrono, no cambia

  useEffect(() => {
    if (isNative()) {
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then(result => {
          setPermission(result.receive === 'granted' ? 'granted' : 'default')
        }).catch(() => {})
      }).catch(() => {})
    } else if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
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
        console.error('Error permisos nativos:', e)
        throw e
      }
    } else {
      if (!('Notification' in window)) throw new Error('No soportado')
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
  }

  const showLocalNotification = async (title, options = {}) => {
    if (isNative()) {
      try {
        const mod = await import('@capacitor/local-notifications').catch(() => null)
        if (mod?.LocalNotifications) {
          await mod.LocalNotifications.schedule({
            notifications: [{
              title,
              body: options.body || '',
              id: Math.floor(Date.now() / 1000) % 2147483647,
              schedule: { at: new Date(Date.now() + 500) },
              extra: options.data || {}
            }]
          })
        }
      } catch (e) {
        console.warn('LocalNotifications error:', e)
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
      const reg = await navigator.serviceWorker?.ready
      if (reg) {
        await reg.showNotification(title, {
          body: options.body || '',
          icon: '/icons/FinGuide_AppIcon_192.png',
          vibrate: [200, 100, 200],
          tag: 'finguide-' + Date.now(),
          data: options.data || {}
        })
        return
      }
    } catch {}
    try { new Notification(title, { body: options.body || '' }) } catch {}
  }

  return { supported, permission, requestPermission, showLocalNotification }
}
