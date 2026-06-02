/*
  K.A.D PWA service worker – safe online mode
  - nu salvează HTML, Supabase, PDF-uri sau date operaționale în cache;
  - curăță cache-urile vechi la fiecare update;
  - previne încărcarea unei versiuni K.A.D depășite dintr-un service worker vechi.
*/
(function(){
  'use strict';

  var SW_VERSION = 'kad-sw-20260602-storage-guard-v1';

  self.addEventListener('install', function(event){
    event.waitUntil((async function(){
      try { await self.skipWaiting(); } catch (_) {}
    })());
  });

  self.addEventListener('activate', function(event){
    event.waitUntil((async function(){
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(key){
          return caches.delete(key).catch(function(){ return false; });
        }));
      } catch (_) {}

      try { await self.clients.claim(); } catch (_) {}
    })());
  });

  self.addEventListener('message', function(event){
    var data = event && event.data ? event.data : {};
    if(!data || data.type !== 'KAD_CLEAR_SW_CACHES') return;
    event.waitUntil((async function(){
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(key){ return caches.delete(key); }));
      } catch (_) {}
    })());
  });

  self.addEventListener('fetch', function(event){
    var request = event.request;
    if(!request || request.method !== 'GET') return;

    event.respondWith((async function(){
      try {
        return await fetch(request, { cache: 'no-store' });
      } catch (error) {
        return fetch(request);
      }
    })());
  });

  self.__KAD_SW_VERSION__ = SW_VERSION;
})();
