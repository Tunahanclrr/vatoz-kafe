// Vatoz Kafe - Service Worker temizleme
// Eski service worker'ı devre dışı bırakır ve tüm cache'leri temizler
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tüm cache'leri temizle
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      // Service worker'ı devre dışı bırak
      await self.registration.unregister();
      // Tüm istemcileri kontrol et
      const clients = await self.clients.matchAll();
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

// Tüm fetch isteklerini normal şekilde geçir
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});