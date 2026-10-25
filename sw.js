// Offline-Unterstützung: App-Dateien werden auf dem Gerät zwischengespeichert.
// Die Lieder selbst liegen im Speicher der App (nicht hier) und kommen beim Abgleich aus OneDrive.
// Mit Internet wird immer die neueste Version geladen (Browser-Zwischenspeicher wird umgangen),
// ohne Internet die zuletzt gespeicherte.
const CACHE = "showplayer-v9";
const ASSETS = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    const nav = req.mode === "navigate";
    // Erst Netzwerk – „no-cache“ fragt immer beim Server nach (kostet kaum etwas, kommt als 304 zurück, wenn unverändert)
    e.respondWith(fetch(nav ? new Request(req.url, {cache: "no-cache", credentials: "same-origin"}) : new Request(req, {cache: "no-cache"}))
      .then(res => { if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(nav ? "./index.html" : req, copy)); } return res; })
      .catch(() => caches.match(nav ? "./index.html" : req, { ignoreSearch: true })));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
  // Microsoft-Anmeldung und OneDrive laufen immer direkt übers Netz.
});
