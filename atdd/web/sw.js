// Bump cache name whenever Connect Scanner assets change.
const CACHE = "atdd-cdi-unified-v4-connect-always";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.delete(CACHE).catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network-only for app shell/JS so previews never stick on a fake/stale scanner build.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
