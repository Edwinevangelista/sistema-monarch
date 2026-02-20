import { useState, useEffect } from 'react'

export const useNotifications = () => {
  const [permission, setPermission] = useState('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!supported) throw new Error('Las notificaciones no están soportadas')
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  // ✅ CORREGIDO: Siempre usar Service Worker para compatibilidad Android/iOS PWA
  // new Notification() directo no funciona en móvil en background
  const showLocalNotification = async (title, options = {}) => {
    // Verificar/solicitar permiso
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
          requireInteraction: options.requireInteraction || false,
          data: options.data || {}
        })
        return
      }
    } catch (swErr) {
      console.warn('SW notification failed:', swErr)
    }

    // Fallback desktop sin SW
    try {
      new Notification(title, {
        body: options.body || '',
        icon: '/icons/FinGuide_AppIcon_192.png',
        ...options
      })
    } catch (e) {
      console.error('Notification fallback failed:', e)
    }
  }

  return {
    supported,
    permission,
    requestPermission,
    showLocalNotification
  }
}
