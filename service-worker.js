/*
  K.A.D PWA service worker
  - păstrează aplicația instalabilă pe telefon și desktop;
  - nu face cache agresiv pentru HTML / Supabase / date operaționale;
  - curăță eventualele cache-uri K.A.D vechi, ca să nu rămână pagini sau date depășite.
*/
(function(){
  'use strict';

  var KAD_CACHE_PREFIX = 'kad-';

  self.addEventListener('install', function(event){
    self.skipWaiting();
  });

  self.addEventListener('activate', function(event){
    event.waitUntil((async function(){
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(key){
          if (String(key || '').toLowerCase().indexOf(KAD_CACHE_PREFIX) === 0) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }));
      } catch (_) {}

      try { await self.clients.claim(); } catch (_) {}
    })());
  });

  self.addEventListener('fetch', function(event){
    var request = event.request;
    if (!request || request.method !== 'GET') return;

    event.respondWith(fetch(request));
  });
})();
