const CACHE_NAME = 'la-barkuh-static-v3';
const AUDIO_CACHE = 'quran-audio-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// التثبيت وتخزين الأصول الرئيسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// تفعيل وتحديث النسخ القديمة
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== AUDIO_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات وتوفير التلاوات من Cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ملفات الصوت MP3
  if (url.hostname.includes('mp3quran.net') || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const response = await fetch(event.request);
          if (response && response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          return new Response('Offline - Surah not cached', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // أصول التطبيق الثابتة
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
