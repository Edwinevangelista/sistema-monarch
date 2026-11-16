/* eslint-disable no-restricted-globals */
// FinGuide Service Worker v5
// ✅ Web Push real: recibe eventos push del servidor aunque la app esté cerrada
// v5 (Fase 2): la acción "Marcar pagado" llama a POST /api/marcar-pagado
// con el token firmado y marca el pago con la app cerrada.

const CACHE_NAME = 'finguide-app-v5';

// ==============================
// INSTALL
// ==============================
self.addEventListener('install', (event) => {
  console.log('SW v5: Instalando...');
  event.waitUntil(self.skipWaiting());
});

// ==============================
// ACTIVATE
// ==============================
self.addEventListener('activate', (event) => {
  console.log('SW v5: Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ==============================
// FETCH — Network-first para JS/CSS, cache para imágenes
// ==============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  const isScript = url.includes('/static/js/') || url.includes('/static/css/') || url.includes('/assets/');
  if (isScript) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  const isStaticAsset = url.includes('/branding/') || url.includes('/icons/') || event.request.destination === 'image';
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ==============================
// PUSH — recibe notificaciones del servidor (app cerrada ✅)
// ==============================
self.addEventListener('push', (event) => {
  console.log('SW v5: Push recibido');

  let payload = {
    title: 'FinGuide',
    body: 'Tienes una nueva notificación',
    tag: 'finguide-' + Date.now(),
    requireInteraction: false,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/FinGuide_AppIcon_192.png',
    badge: '/icons/FinGuide_AppIcon_192.png',
    vibrate: [200, 100, 200],
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false,
    silent: false,
    // Fase 1: acciones del payload (p. ej. "Marcar pagado" del cron)
    actions: payload.actions || [],
    data: payload.data || { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ==============================
// NOTIFICATION CLICK — Navegación inteligente por sección
// ==============================

// Marca el pago en el servidor con el token firmado, sin abrir la app.
// Muestra una notificación de confirmación, o una de error que al
// tocarla abre la app con ?accion=marcar-pagado para marcarlo ahí.
const marcarPagadoDesdeSW = async (data) => {
  const nombre = data.nombre || 'Pago';
  const montoTxt = data.monto != null ? ` — $${Number(data.monto).toLocaleString('es')}` : '';
  const mostrarFallo = () => self.registration.showNotification('No se pudo marcar pagado', {
    body: `${nombre}${montoTxt} — toca para abrir la app y marcarlo ahí`,
    icon: '/icons/FinGuide_AppIcon_192.png',
    badge: '/icons/FinGuide_AppIcon_192.png',
    tag: `finguide-pagado-error-${data.itemId}`,
    data: { accion: 'marcar-pagado', tipoItem: data.tipoItem, itemId: data.itemId },
  });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let resp;
    try {
      resp = await fetch(`${self.location.origin}/api/marcar-pagado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!resp || !resp.ok) return mostrarFallo();
    const resultado = await resp.json().catch(() => ({}));
    if (!resultado || resultado.ok !== true) return mostrarFallo();
    const titulo = resultado.yaProcesado
      ? `Ya estaba pagado: ${resultado.nombre || nombre}`
      : `✅ Pagado: ${resultado.nombre || nombre}`;
    return self.registration.showNotification(titulo, {
      body: resultado.yaProcesado
        ? 'Este pago ya estaba marcado, no se duplicó.'
        : `$${Number(resultado.monto ?? data.monto ?? 0).toLocaleString('es')} marcado como pagado`,
      icon: '/icons/FinGuide_AppIcon_192.png',
      badge: '/icons/FinGuide_AppIcon_192.png',
      tag: `finguide-pagado-${data.itemId}`,
      data: { url: '/' },
    });
  } catch {
    return mostrarFallo();
  }
};

// Abre la app con ?accion=marcar-pagado (fallback cuando no hay token,
// o cuando la notificación de error se toca).
const abrirAppConAccionMarcarPagado = (data) => {
  const baseUrl = self.location.origin;
  const urlToOpen = `${baseUrl}/?accion=marcar-pagado&tipo=${encodeURIComponent(data.tipoItem)}&id=${encodeURIComponent(data.itemId)}`;
  return clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(baseUrl) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO_SECTION',
            seccion: 'alertas',
            accion: 'marcar-pagado',
            tipoItem: data.tipoItem,
            itemId: data.itemId,
          });
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    });
};

self.addEventListener('notificationclick', (event) => {
  console.log('SW v5: Notificación clickeada', event.notification.data);
  event.notification.close();

  const data = event.notification.data || {};
  const baseUrl = self.location.origin;

  // Fase 2: acción "Marcar pagado" con token — marca en el servidor
  // con la app cerrada. Sin token (avisos viejos o sin secreto en el
  // servidor), abre la app con ?accion=marcar-pagado como en Fase 1.
  if (event.action === 'marcar-pagado' && data.tipoItem && data.itemId) {
    if (data.token) {
      event.waitUntil(marcarPagadoDesdeSW(data));
    } else {
      event.waitUntil(abrirAppConAccionMarcarPagado(data));
    }
    return;
  }

  // La notificación de error de Fase 2 trae accion=marcar-pagado:
  // tocarla abre la app para marcar el pago ahí.
  if (data.accion === 'marcar-pagado' && data.tipoItem && data.itemId) {
    event.waitUntil(abrirAppConAccionMarcarPagado(data));
    return;
  }

  // Extraer sección de destino del payload
  // El servidor puede enviar: data.seccion = 'cuentas' | 'gastos' | 'deudas' | 'suscripciones' | 'alertas'
  const seccion = data.seccion || null;
  const url = data.url || baseUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar ventana ya abierta con la app
        for (const client of clientList) {
          if (client.url.startsWith(baseUrl) && 'focus' in client) {
            client.focus();
            // Enviar mensaje al cliente para navegar a la sección correcta
            if (seccion) {
              client.postMessage({
                type: 'NAVIGATE_TO_SECTION',
                seccion: seccion,
                data: event.notification.data || {}
              });
            }
            return;
          }
        }
        // No hay ventana abierta → abrir la app
        const urlToOpen = seccion ? `${baseUrl}/?seccion=${seccion}` : url;
        return clients.openWindow(urlToOpen);
      })
  );
});

// ==============================
// PUSH SUBSCRIPTION CHANGE — renovar suscripción automáticamente
// ==============================
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('SW v5: Suscripción push cambió, renovando...');
  // El cliente JS manejará la renovación cuando vuelva a abrir la app
  // via initializeNotificationsOnLoad()
  event.waitUntil(Promise.resolve());
});

console.log('SW v5: Cargado ✅');
