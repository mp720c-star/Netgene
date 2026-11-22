// Bump whenever Home Screen first-paint / Connect Scanner changes.
const CACHE = "atdd-cdi-unified-v6-connect-no-crash";

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

// Network-only so iPhone Home Screen PWA picks up Connect Scanner updates.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
