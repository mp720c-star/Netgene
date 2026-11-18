const CACHE = "atdd-cdi-unified-v3-scanner";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/ddtEngine.js",
  "./js/resistance.js",
  "./js/scanner-ui.js",
  "./js/scanner-session.js",
  "./js/web-bluetooth-transport.js",
  "./js/fixd-protocol-probe.js",
  "./js/obd-protocol-v3-frame-aware.js",
  "./data/cdi-models.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Network-first for JS/HTML so Connect Scanner updates are not stuck behind SW cache.
  if (req.mode === "navigate" || req.url.includes("/js/") || req.url.endsWith(".html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
