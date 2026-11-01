// Service worker: aplikácia sa vždy načíta zo siete (vždy najnovšia verzia),
// pri výpadku siete sa otvorí posledná uložená kópia. Knižnice a ikony sa berú z vyrovnávacej pamäte.
// Volania servera (Apps Script) sa nikdy neukladajú.
const C = 'dochadzka-v2';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  if (u.pathname.includes('/lib/') || /\.(png|svg|ico)$/.test(u.pathname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; })));
    return;
  }
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && !u.search) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
