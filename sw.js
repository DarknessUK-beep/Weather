const CACHE = "ba14wx-v2";
const APP_SHELL = ["./","./index.html","./manifest.webmanifest","./alerts.js","./alerts-config.js",
                   "./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (APP_SHELL.some(p => url.pathname.endsWith(p.replace('./','/')))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  if (url.hostname.includes("open-meteo.com") || url.hostname.includes("rainviewer.com")) {
    e.respondWith((async () => {
      try {
        const networkResp = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, networkResp.clone());
        return networkResp;
      } catch (err) {
        const cached = await caches.match(e.request);
        return cached || new Response(JSON.stringify({ offline: true }), { headers: { "Content-Type": "application/json" }, status: 200 });
      }
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
