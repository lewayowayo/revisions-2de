// L'appli s'ouvre même sans réseau ; la progression est stockée sur le téléphone (localStorage).
const CACHE = "rv2de-v2";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./core.js?v=9", "./app.js?v=9", "./ch-svt-a3.js?v=9", "./ch-pc-c2.js?v=9"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    e.respondWith(caches.open(CACHE).then(async c => { try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (err) { return (await c.match(e.request)) || Response.error(); } }));
    return;
  }
  // réseau d'abord (pour avoir les nouveaux chapitres), cache si hors ligne
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
