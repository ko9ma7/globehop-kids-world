const VERSION = 'globehop-v2';
const CORE = [
  './', './index.html', './src/styles.css', './src/app.js',
  './src/modules/config.js', './src/modules/i18n.js', './src/modules/storage.js',
  './src/modules/geo.js', './src/modules/dataService.js', './src/modules/globe.js',
  './src/data/countries/index.json', './src/data/world-geometries.json',
  './src/data/places/index.json', './src/data/origins/index.json',
  './favicon.svg', './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isApi = url.hostname.includes('open-meteo.com') || url.hostname.includes('worldbank.org') || url.hostname.includes('project-osrm.org');

  if (isApi) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(VERSION).then((cache) => cache.put(event.request, copy));
    return response;
  })));
});
