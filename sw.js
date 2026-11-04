/* Offline support: cache the app shell; network-first for HTML so updates arrive, cache-first for the rest. Bump VERSION on every release. */
const VERSION = "tetbody-1.1.0";
const SHELL = ["./", "index.html", "manifest.webmanifest", "css/app.css", "css/app2.css", "css/food.css", "js/fx.js", "js/data.js", "js/store.js", "js/ex.js", "js/ex-extra.js", "js/app.js",
  "js/ai.js", "js/v-today.js", "js/v-gym.js", "js/v-plan.js", "js/v-food-lib.js", "js/v-food.js", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (r.mode === "navigate") { e.respondWith(fetch(r).then(res => { caches.open(VERSION).then(c => c.put("index.html", res.clone())); return res; }).catch(() => caches.match("index.html"))); return; }
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com"))
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; })));
});
