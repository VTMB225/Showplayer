// Offline-Unterstützung: App-Dateien werden auf dem Gerät zwischengespeichert.
// Die Lieder selbst liegen im Speicher der App (nicht hier) und kommen beim Abgleich aus OneDrive.
const CACHE = "showplayer-v7";
const ASSETS = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Erst Netzwerk (für Updates), bei Funkloch aus dem Speicher
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.mode === "navigate" ? "./index.html" : req, copy)); return res; })
      .catch(() => caches.match(req.mode === "navigate" ? "./index.html" : req, { ignoreSearch: true })));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
  // Microsoft-Anmeldung und OneDrive laufen immer direkt übers Netz.
});
