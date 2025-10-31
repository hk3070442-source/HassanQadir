// اسم الـ Cache (الذاكرة المؤقتة) مع رقم إصدار
const CACHE_NAME = 'lecture-table-cache-v3'; // <-- تم تغيير الإصدار إلى v3

// الملفات الأساسية التي نريد تخزينها
const URLS_TO_CACHE = [
  '/', 
  'bbb.html',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap'
];

// 1. حدث التثبيت (Install)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v3...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell v3...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. حدث التفعيل (Activate)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v3...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. حدث جلب البيانات (Fetch) - الكود المُعدل والمهم
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // --- (1) موجود في الكاش ---
        if (response) {
          return response;
        }
        // --- (2) غير موجود في الكاش ---
        return fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(() => {
            // --- (3) فشل الإنترنت (أوفلاين) ---
            console.warn('Fetch failed from network and not in cache:', event.request.url);
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
