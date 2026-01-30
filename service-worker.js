/* Daily Flow PWA service worker */
const CACHE_NAME = "daily-flow-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for navigations (so updates come through)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
