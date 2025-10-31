// اسم الـ Cache (الذاكرة المؤقتة) مع رقم إصدار
const CACHE_NAME = 'lecture-table-cache-v4'; // <-- تم تغيير الإصدار إلى v4

// الملفات الأساسية التي نريد تخزينها
// سنخزن الملفات المحلية فقط لضمان نجاح التثبيت
const URLS_TO_CACHE = [
  '/', 
  'index.html'
];

// 1. حدث التثبيت (Install)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v4...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell v4...');
        // هذا سيخزن index.html و / فقط
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. حدث التفعيل (Activate)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v4...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // سيحذف v3 وكل ما هو قديم
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. حدث جلب البيانات (Fetch) - هذا هو الكود المُعدل
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // استراتيجية "Cache first" للملفات الأساسية
  // استراتيجية "Network first" للملفات الخارجية
  const isCoreFile = url.pathname.endsWith('bbb.html') || url.pathname.endsWith('/');
  const isExternalAsset = url.hostname.includes('firebase') || url.hostname.includes('fonts');

  if (isCoreFile) {
    // 1. للملفات الأساسية (bbb.html): ابحث في الكاش أولاً
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // إذا وجدناه، أرجعه (هذا ما سيحدث عندما تكون أوفلاين)
          // إذا لم نجده (أول زيارة بعد مسح الكاش)، اذهب للشبكة
          return response || fetch(event.request);
        })
    );
  } else if (isExternalAsset) {
    // 2. للملفات الخارجية (Firebase, Fonts): اذهب للشبكة أولاً
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // إذا نجح الاتصال، قم بتخزين نسخة في الكاش للمستقبل
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        })
        .catch(() => {
          // إذا فشل الاتصال (أوفلاين)، ابحث في الكاش
          // (هذا سيعمل في الزيارات اللاحقة عندما تكون أوفلاين)
          return caches.match(event.request);
        })
    );
  } else {
    // 3. لأي شيء آخر، اتبع السلوك الافتراضي
    return;
  }
});
