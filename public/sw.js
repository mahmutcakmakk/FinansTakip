self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('FinansTakip PWA Service Worker Aktif Edildi. 🚀');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Uygulamanın offline veya önbellekli cache mekanizması (şuanlık dinlemede kalıyor)
});
