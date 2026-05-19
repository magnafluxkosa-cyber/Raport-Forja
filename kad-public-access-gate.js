(function(window, document){
  'use strict';

  var LOGIN_PAGE = 'login.html';
  var PUBLIC_PAGES = {
    'login.html': true,
    'access-gate.html': true,
    'mfa-setup.html': true,
    'mfa-verify.html': true,
    'forja-ctc-pin.html': true
  };
  var SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  function fileName(){
    try {
      var n = String(window.location.pathname || '').split('/').pop() || 'index.html';
      return n || 'index.html';
    } catch(_) { return 'index.html'; }
  }
  function pageKey(){
    return String(fileName()).toLowerCase().split('?')[0].split('#')[0].replace(/\.html$/,'') || 'index';
  }
  function isPublicPage(){ return PUBLIC_PAGES[String(fileName()).toLowerCase()] === true; }
  function getStoreValue(store, key){ try { return store.getItem(key); } catch(_) { return null; } }
  function parseJson(raw){ try { return raw ? JSON.parse(raw) : null; } catch(_) { return null; } }
  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function normalizeEmail(v){ return String(v || '').trim().toLowerCase(); }

  function removePrehide(){
    try { document.documentElement.removeAttribute('data-kad-public-gate'); } catch(_) {}
    try { window.__KAD_PUBLIC_GATE_GRANTED__ = true; } catch(_) {}
  }

  function loginUrl(){
    var url = new URL(LOGIN_PAGE, window.location.href);
    try { url.searchParams.set('next', fileName()); } catch(_) {}
    return url.toString();
  }

  function redirectToLogin(){
    try { window.location.replace(loginUrl()); }
    catch(_) { window.location.href = loginUrl(); }
  }

  function validSupabaseTokenPayload(payload){
    if(!payload || typeof payload !== 'object') return false;
    var session = payload.currentSession || payload.session || payload;
    if(!session || typeof session !== 'object') return false;
    var token = session.access_token || session.refresh_token || '';
    if(!token) return false;
    var exp = Number(session.expires_at || 0);
    if(exp && exp * 1000 < now() - 60000) return false;
    return true;
  }

  function hasSupabaseSession(){
    var stores = [window.localStorage, window.sessionStorage];
    for(var s=0; s<stores.length; s+=1){
      var store = stores[s];
      if(!store) continue;
      try {
        for(var i=0; i<store.length; i+=1){
          var key = String(store.key(i) || '');
          if(!key) continue;
          var lk = key.toLowerCase();
          if((lk.indexOf('supabase') !== -1 || (lk.indexOf('sb-') === 0 && lk.indexOf('auth-token') !== -1))){
            var obj = parseJson(getStoreValue(store, key));
            if(validSupabaseTokenPayload(obj)) return true;
          }
        }
      } catch(_) {}
    }
    return false;
  }

  function hasFreshErpLoginMarker(){
    var keys = ['rf_login_ts','rf_login_at'];
    var idKeys = ['rf_uid','rf_user_id','rf_email','rf_user_email'];
    var stores = [window.localStorage, window.sessionStorage];
    var hasId = false;
    var loginStamp = 0;
    for(var s=0; s<stores.length; s+=1){
      var store = stores[s];
      if(!store) continue;
      for(var i=0; i<idKeys.length; i+=1){ if(getStoreValue(store, idKeys[i])) hasId = true; }
      for(var j=0; j<keys.length; j+=1){
        var raw = getStoreValue(store, keys[j]);
        if(!raw) continue;
        var n = Number(raw);
        if(!n) {
          var d = Date.parse(raw);
          if(!isNaN(d)) n = d;
        }
        if(n && n > loginStamp) loginStamp = n;
      }
    }
    if(!hasId) return false;
    if(!loginStamp) return false;
    return (now() - loginStamp) < SESSION_MAX_AGE_MS;
  }

  function isLikelyAuthenticated(){
    if(hasSupabaseSession()) return true;
    if(hasFreshErpLoginMarker()) return true;
    return false;
  }

  function renderDenied(message){
    function mount(){
      if(!document.body) return false;
      removePrehide();
      document.body.innerHTML = '';
      var outer = document.createElement('div');
      outer.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;';
      var card = document.createElement('div');
      card.style.cssText = 'width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;text-align:center;';
      var h = document.createElement('div');
      h.style.cssText = 'font-size:32px;font-weight:800;margin:0 0 12px;';
      h.textContent = 'Acces restricționat';
      var p = document.createElement('div');
      p.style.cssText = 'font-size:16px;line-height:1.5;margin:0 0 22px;';
      p.textContent = message || 'Nu ai acces în această pagină.';
      var a = document.createElement('a');
      a.href = loginUrl();
      a.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;';
      a.textContent = 'Înapoi la login';
      card.appendChild(h); card.appendChild(p); card.appendChild(a); outer.appendChild(card); document.body.appendChild(outer);
      return true;
    }
    if(!mount()) document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function permissionsFromAccess(access){
    var p = (access && access.permissions) || access || {};
    return {
      can_view: p.can_view === true,
      can_add: p.can_add === true,
      can_edit: p.can_edit === true,
      can_delete: p.can_delete === true,
      can_export: p.can_export === true,
      can_import: p.can_import === true
    };
  }

  function applyReadonly(perms){
    if(!perms || perms.can_edit === true) return;
    try { window.__PAGE_ACCESS__ = Object.assign({}, window.__PAGE_ACCESS__ || {}, perms); } catch(_) {}
    try { window.__CAN_EDIT__ = false; } catch(_) {}
    function isFilter(el){
      if(!el || !el.matches) return false;
      if(el.matches('[data-acl-filter], .th-filter, .th-filter-select, #filterRow input, #filterRow select')) return true;
      if(el.closest && el.closest('[data-acl-filter], .filters, .filtersBar, .filter-row, #filterRow, .toolbar-filters, .table-filters, .search-box, .searchbar')) return true;
      var txt = [el.id, el.name, el.className, el.placeholder, el.getAttribute('aria-label')].map(function(v){return String(v||'').toLowerCase();}).join(' ');
      return /(filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status)/.test(txt);
    }
    function isMutating(el){
      if(!el || !el.matches) return false;
      if(el.matches('input[type="file"], input[type="submit"], button[type="submit"], [contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]')) return true;
      var txt = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.title, el.textContent, el.value].map(function(v){return String(v||'').toLowerCase();}).join(' ');
      return /(salv|save|adaug|add\b|nou\b|new\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|cloud.*save|salvează)/.test(txt);
    }
    function lock(root){
      var scope = root && root.querySelectorAll ? root : document;
      var nodes = scope.querySelectorAll('input, textarea, select, button, [contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]');
      nodes.forEach(function(el){
        if(isFilter(el)) return;
        if(isMutating(el)){
          try { el.disabled = true; } catch(_) {}
          try { el.setAttribute('readonly','readonly'); } catch(_) {}
          try { el.setAttribute('aria-disabled','true'); } catch(_) {}
          try { el.style.pointerEvents = 'none'; } catch(_) {}
        }
      });
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ lock(document); }, { once:true });
    else lock(document);
    try {
      new MutationObserver(function(mutations){ mutations.forEach(function(m){ if(m.addedNodes) m.addedNodes.forEach(function(n){ if(n && n.nodeType === 1) lock(n); }); }); }).observe(document.documentElement || document.body, { childList:true, subtree:true });
    } catch(_) {}
  }

  function waitForRuntime(ms){
    var start = now();
    return new Promise(function(resolve){
      (function tick(){
        if(window.ERPAuth || (window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function')) return resolve(true);
        if(now() - start > ms) return resolve(false);
        setTimeout(tick, 120);
      })();
    });
  }

  async function lateAclCheck(){
    if(isPublicPage()) return;
    var key = pageKey();
    try {
      var ok = await waitForRuntime(8000);
      if(!ok) return;
      var access = null;
      if(window.ERPAuth && typeof window.ERPAuth.getPageAccess === 'function') {
        access = await window.ERPAuth.getPageAccess(key);
      } else if(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function') {
        access = await window.RF_ACL.resolvePageAccess(key);
      }
      if(!access) return;
      window.__KAD_LATE_ACL_ACCESS__ = access;
      if(access.allowed !== true){
        renderDenied(access.message || 'Nu ai acces în această pagină.');
        return;
      }
      var perms = permissionsFromAccess(access);
      window.__PAGE_ACCESS__ = Object.assign({}, access, perms, { permissions: perms });
      applyReadonly(perms);
    } catch(err) {
      try { console.warn('KAD late ACL check skipped:', err); } catch(_) {}
    }
  }

  function main(){
    if(isPublicPage()) { removePrehide(); return; }
    if(!isLikelyAuthenticated()) { redirectToLogin(); return; }
    removePrehide();
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ lateAclCheck(); }, { once:true });
    else lateAclCheck();
  }

  main();
})(window, document);
