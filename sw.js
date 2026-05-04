const CACHE = 'ielts1000-v1';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/app.js',
  'js/srs.js',
  'js/utils.js',
  'js/modules/dashboard.js',
  'js/modules/card-mode.js',
  'js/modules/fillblank-mode.js',
  'js/modules/dictation-mode.js',
  'js/modules/review.js',
  'js/modules/vocabulary.js',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('chart.js') || e.request.url.includes('tailwind')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  return hit || fetch(req);
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  } catch {
    return caches.match(req);
  }
}
