import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const isNative = () => {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [supported] = useState(() => {
    if (isNative()) return true
    return !!(typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window)
  })

  useEffect(() => {
    if (!isNative()) {
      if ('Notification' in window) setPermission(Notification.permission)
      return
    }
    // Verificar permisos de notificaciones locales (no requiere FCM/Firebase)
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.checkPermissions().then(r => {
        setPermission(r.display === 'granted' ? 'granted' : 'default')
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  const requestPermission = async () => {
    if (isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        const result = await LocalNotifications.requestPermissions()
        const granted = result.display === 'granted'
        setPermission(granted ? 'granted' : 'denied')
        return granted ? 'granted' : 'denied'
      } catch (e) {
        // Fallback: asumir concedido si el plugin no está disponible en esta versión
        console.warn('LocalNotifications no disponible:', e)
        setPermission('granted')
        return 'granted'
      }
    } else {
      if (!('Notification' in window)) throw new Error('No soportado en este navegador')
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
  }

  const showLocalNotification = async (title, options = {}) => {
    if (isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body: options.body || '',
            id: Math.floor(Date.now() / 1000) % 2147483647,
            schedule: { at: new Date(Date.now() + 500) },
            extra: options.data || {}
          }]
        })
      } catch (e) {
        console.warn('LocalNotifications error:', e)
      }
      return
    }
    // Web
    if (Notification.permission !== 'granted') return
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
