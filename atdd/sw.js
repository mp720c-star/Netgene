/* ATDD service worker — cache shell for offline */
const CACHE = 'atdd-1.2.1-bt';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./diagnosticsEngine.js','./obd-ble.js','./manifest.webmanifest','./icon.png','./data/dtc-db.js','./data/common-jobs.js'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
