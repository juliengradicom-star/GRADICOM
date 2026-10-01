// GRADICOM AMR — service worker : l'appli charge toujours la DERNIÈRE version en ligne
// (réseau d'abord), et garde une copie de secours si la connexion coupe.
const CACHE = 'gradicom-amr-v2';
const CORE = ['/', '/gradicom.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // Google Sheets / messagerie : jamais en cache
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && !url.search) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/gradicom.html')))
  );
});

// ----- Notifications (nouvelle actu) -----
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'GRADICOM AMR', {
    body: d.body || 'Une nouvelle actu est disponible.',
    icon: '/icon-192.png', badge: '/icon-192.png',
    data: { url: d.url || '/?actus=1' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/?actus=1';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if ('focus' in c) { c.postMessage({ type: 'open-actus' }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
