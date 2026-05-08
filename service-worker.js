/* K.A.D PWA service worker - pasiv, fără cache agresiv, ca să nu țină date vechi. */
self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
  event.respondWith(fetch(event.request));
});
