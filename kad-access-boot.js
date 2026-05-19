(function(window, document){
  'use strict';

  var VERSION = '20260519-5';
  var LOGIN_PAGE = 'login.html';
  var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var PENDING_ATTR = 'data-kad-boot-pending';
  var READY_ATTR = 'data-kad-boot-ready';
  var DENIED_ATTR = 'data-kad-boot-denied';
  var PUBLIC_PAGES = {
    'login': true,
    'access-gate': true,
    'mfa-setup': true,
    'mfa-verify': true,
    'forja-ctc-pin': true
  };

  var state = {
    allowed: false,
    ready: false,
    internalDepth: 0,
    nativeFetch: window.fetch ? window.fetch.bind(window) : null,
    resolveReady: null
  };
  state.readyPromise = new Promise(function(resolve){ state.resolveReady = resolve; });

  function normalizePageKey(value){
    var raw = String(value || '').trim().toLowerCase();
    raw = raw.split('?')[0].split('#')[0];
    raw = raw.replace(/^\.\//, '').replace(/\.html$/i, '');
    return raw || 'index';
  }

  function currentFileName(){
    try {
      var name = String(window.location.pathname || '').split('/').pop() || 'index.html';
      return (!name || name === '/') ? 'index.html' : name;
    } catch(_) { return 'index.html'; }
  }

  function currentPageKey(){ return normalizePageKey(currentFileName()); }

  function injectStyle(){
    if(document.getElementById('kad-access-boot-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-access-boot-style';
    style.textContent = [
      'html[' + PENDING_ATTR + '="1"] body{visibility:visible!important;}',
      'html[' + PENDING_ATTR + '="1"] body>*:not(#kad-access-boot-overlay){visibility:hidden!important;}',
      'html[' + PENDING_ATTR + '="1"] #kad-access-boot-overlay{visibility:visible!important;}',
      '#kad-access-boot-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#c8def0!important;color:#0d2240!important;font-family:Arial,Helvetica,sans-serif!important;}',
      '#kad-access-boot-overlay .kad-access-boot-card{width:min(640px,calc(100% - 48px))!important;background:#d7e6f4!important;border:2px solid #1b1b1b!important;border-radius:18px!important;padding:28px!important;box-shadow:0 1px 0 rgba(0,0,0,.06)!important;text-align:center!important;}',
      '#kad-access-boot-overlay .kad-access-boot-title{font-size:28px!important;font-weight:800!important;line-height:1.15!important;margin:0 0 10px!important;}',
      '#kad-access-boot-overlay .kad-access-boot-text{font-size:16px!important;line-height:1.5!important;margin:0!important;}',
      'html[' + DENIED_ATTR + '="1"] body{visibility:visible!important;}',
      'html.kad-readonly [contenteditable="true"]{user-select:text!important;}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function mountOverlay(){
    if(PUBLIC_PAGES[currentPageKey()]) return;
    if(document.getElementById('kad-access-boot-overlay')) return;
    if(!document.body) return;
    var overlay = document.createElement('div');
    overlay.id = 'kad-access-boot-overlay';
    overlay.innerHTML = '<div class="kad-access-boot-card"><div class="kad-access-boot-title">Se verifică accesul...</div><div class="kad-access-boot-text">Pagina va fi afișată doar după validarea autentificării și a permisiunilor.</div></div>';
    document.body.appendChild(overlay);
  }

  function scheduleOverlay(){
    window.setTimeout(function(){
      if(document.body) mountOverlay();
      else document.addEventListener('DOMContentLoaded', mountOverlay, { once:true });
    }, 250);
  }

  function removeOverlay(){
    try {
      var el = document.getElementById('kad-access-boot-overlay');
      if(el && el.parentNode) el.parentNode.removeChild(el);
    } catch(_) {}
  }

  function markPending(){
    if(PUBLIC_PAGES[currentPageKey()]) return;
    try { document.documentElement.setAttribute(PENDING_ATTR, '1'); } catch(_) {}
    injectStyle();
    scheduleOverlay();
  }

  function markAllowed(){
    state.allowed = true;
    state.ready = true;
    removeOverlay();
    try { document.documentElement.removeAttribute(PENDING_ATTR); } catch(_) {}
    try { document.documentElement.removeAttribute(DENIED_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(READY_ATTR, '1'); } catch(_) {}
    try { if(state.resolveReady) state.resolveReady(true); } catch(_) {}
  }

  function markDenied(){
    state.allowed = false;
    state.ready = true;
    removeOverlay();
    try { document.documentElement.removeAttribute(PENDING_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(DENIED_ATTR, '1'); } catch(_) {}
    try { if(state.resolveReady) state.resolveReady(false); } catch(_) {}
  }

  function redirectToLogin(){
    markDenied();
    try {
      var target = new URL(LOGIN_PAGE, window.location.href);
      target.searchParams.set('next', currentFileName());
      window.location.replace(target.toString());
    } catch(_) {
      window.location.href = LOGIN_PAGE;
    }
  }

  function renderDenied(title, message){
    function mount(){
      if(!document.body) return false;
      markDenied();
      document.body.innerHTML = '';
      var outer = document.createElement('div');
      outer.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;';
      var card = document.createElement('div');
      card.style.cssText = 'width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;';
      var h = document.createElement('div');
      h.style.cssText = 'font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;';
      h.textContent = title || 'Acces restricționat';
      var p = document.createElement('div');
      p.style.cssText = 'font-size:16px;line-height:1.5;margin:0 0 22px;';
      p.textContent = message || 'Nu ai acces în această pagină.';
      var a = document.createElement('a');
      a.href = LOGIN_PAGE;
      a.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;';
      a.textContent = 'Înapoi la login';
      card.appendChild(h); card.appendChild(p); card.appendChild(a); outer.appendChild(card); document.body.appendChild(outer);
      return true;
    }
    if(!mount()) document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function withTimeout(promise, ms, fallback){
    var timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function(resolve){ timer = window.setTimeout(function(){ resolve(fallback); }, ms); })
    ]).then(function(value){ if(timer) window.clearTimeout(timer); return value; }, function(err){ if(timer) window.clearTimeout(timer); throw err; });
  }

  function loadScriptOnce(src, testFn){
    return new Promise(function(resolve, reject){
      try { if(testFn && testFn()) return resolve(); } catch(_) {}
      var cleanSrc = String(src || '').split('?')[0];
      var scripts = Array.prototype.slice.call(document.scripts || []);
      var existing = scripts.find(function(script){
        var s = String(script.getAttribute('src') || '').split('?')[0];
        return s === cleanSrc || s.slice(-cleanSrc.length) === cleanSrc;
      });
      if(existing){
        var done = false;
        var finish = function(){ if(done) return; done = true; resolve(); };
        existing.addEventListener('load', finish, { once:true });
        existing.addEventListener('error', function(){ if(done) return; done = true; reject(new Error('Nu s-a putut încărca ' + src)); }, { once:true });
        window.setTimeout(function(){ try { if(!testFn || testFn()) finish(); } catch(_) {} }, 0);
        window.setTimeout(function(){ try { if(!testFn || testFn()) finish(); } catch(_) {} }, 500);
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-kad-access-boot-managed', '1');
      script.onload = function(){ resolve(); };
      script.onerror = function(){ reject(new Error('Nu s-a putut încărca ' + src)); };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function runInternal(fn){
    state.internalDepth += 1;
    try { return Promise.resolve(fn()); }
    finally { state.internalDepth -= 1; }
  }

  function installFetchGate(){
    if(!state.nativeFetch || window.__KAD_ACCESS_BOOT_FETCH_GATE__) return;
    window.__KAD_ACCESS_BOOT_FETCH_GATE__ = true;
    window.fetch = function(input, init){
      if(state.internalDepth > 0 || state.allowed || PUBLIC_PAGES[currentPageKey()]){
        return state.nativeFetch(input, init);
      }
      return state.readyPromise.then(function(ok){
        if(ok || state.allowed) return state.nativeFetch(input, init);
        return Promise.reject(new Error('Cererea a fost blocată până la validarea accesului.'));
      });
    };
  }

  function safeSessionStorage(key, value){
    try { sessionStorage.setItem(key, value); } catch(_) {}
    try { localStorage.setItem(key, value); } catch(_) {}
  }

  function normalizePermissionValue(value){ return value === true; }

  function isFilterControl(el){
    if(!el || !el.matches) return false;
    if(el.matches('[data-acl-filter], .th-filter, .th-filter-select, #filterRow input, #filterRow select')) return true;
    if(el.closest('[data-acl-filter], .filters, .filtersBar, .filter-row, #filterRow, .toolbar-filters, .table-filters, .search-box, .searchbar')) return true;
    var text = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.placeholder, el.textContent]
      .map(function(v){ return String(v || '').toLowerCase(); }).join(' ');
    if(/salv|save|adaug|add\b|edit|delete|sterg|șterg|import|upload|submit|actualiz|update|cloud/.test(text)) return false;
    return /filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status/.test(text);
  }

  function isMutatingControl(el){
    if(!el || !el.matches) return false;
    if(el.matches('input[type="file"], input[type="submit"], button[type="submit"]')) return true;
    if(el.matches('[contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]')) return true;
    var text = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.title, el.textContent, el.value]
      .map(function(v){ return String(v || '').toLowerCase(); }).join(' ');
    return /salv|save|adaug|add\b|nou\b|new\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|cloud.*save|salvează/.test(text);
  }

  function applyReadonly(permissions){
    var canEdit = normalizePermissionValue(permissions && permissions.can_edit);
    var canAdd = normalizePermissionValue(permissions && permissions.can_add);
    var canDelete = normalizePermissionValue(permissions && permissions.can_delete);
    var canImport = normalizePermissionValue(permissions && permissions.can_import);
    var effective = Object.assign({}, permissions || {}, {
      can_edit: canEdit,
      can_add: canAdd,
      can_delete: canDelete,
      can_import: canImport
    });
    window.__PAGE_ACCESS__ = effective;
    window.__CAN_EDIT__ = canEdit === true;
    if(canEdit) return;

    try { document.documentElement.classList.add('kad-readonly', 'readonly'); } catch(_) {}

    function lock(root){
      var scope = root && root.querySelectorAll ? root : document;
      var nodes = scope.querySelectorAll('input, textarea, select, button, [contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]');
      nodes.forEach(function(el){
        if(isFilterControl(el)) return;
        if(isMutatingControl(el) || el.matches('[contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]')){
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
      var obs = new MutationObserver(function(mutations){
        mutations.forEach(function(m){
          if(m.addedNodes) m.addedNodes.forEach(function(n){ if(n && n.nodeType === 1) lock(n); });
        });
      });
      obs.observe(document.documentElement || document.body, { subtree:true, childList:true });
    } catch(_) {}

    ['beforeinput','paste','drop','submit'].forEach(function(type){
      document.addEventListener(type, function(event){
        var target = event.target;
        if(target && isFilterControl(target)) return;
        if(target && target.matches && (target.matches('input,textarea,select,[contenteditable="true"]') || isMutatingControl(target.closest ? (target.closest('button,[data-rf-mutating],[data-mutating],[data-editable]') || target) : target))){
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    });

    document.addEventListener('click', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button, input[type="button"], input[type="submit"], [role="button"], [data-rf-mutating], [data-mutating], [data-editable]') : null;
      if(!el || isFilterControl(el)) return;
      if(isMutatingControl(el)){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function createClient(){
    if(window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function'){
      return window.createRfSupabaseClient();
    }
    var cfg = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_CONFIG || {};
    var url = String(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').trim();
    var key = String(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '').trim();
    if(!url || !key || !window.supabase || typeof window.supabase.createClient !== 'function') throw new Error('Configurația Supabase lipsește.');
    if(!window.__KAD_ACCESS_BOOT_SUPABASE__){
      window.__KAD_ACCESS_BOOT_SUPABASE__ = window.supabase.createClient(url, key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    }
    return window.__KAD_ACCESS_BOOT_SUPABASE__;
  }

  async function ensureRuntime(){
    await loadScriptOnce('./supabase-config.js', function(){ return !!(window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_SUPABASE_URL); });
    if(!window.supabase || typeof window.supabase.createClient !== 'function'){
      await loadScriptOnce(SUPABASE_CDN, function(){ return !!(window.supabase && typeof window.supabase.createClient === 'function'); });
    }
    await loadScriptOnce('./rf-config.js', function(){ return !!(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function' && window.createRfSupabaseClient); });
  }

  async function getSession(client){
    var lastSession = null;
    for(var i=0; i<4; i+=1){
      try {
        var res = await runInternal(function(){ return client.auth.getSession(); });
        lastSession = res && res.data ? (res.data.session || null) : null;
        if(lastSession && lastSession.user) return lastSession;
      } catch(_) {}
      await new Promise(function(resolve){ window.setTimeout(resolve, 150); });
    }
    try {
      var userRes = await runInternal(function(){ return client.auth.getUser(); });
      if(userRes && userRes.data && userRes.data.user) return { user:userRes.data.user };
    } catch(_) {}
    return null;
  }

  async function resolveAccess(client, user, pageKey){
    if(!window.RF_ACL || typeof window.RF_ACL.resolvePageAccess !== 'function'){
      return {
        allowed:false,
        role:'viewer',
        source:'acl unavailable',
        message:'ACL indisponibil. Acces blocat preventiv.',
        permissions:{ can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false }
      };
    }
    return await runInternal(function(){ return window.RF_ACL.resolvePageAccess(pageKey, { client:client, user:user }); });
  }

  async function main(){
    var pageKey = currentPageKey();
    if(PUBLIC_PAGES[pageKey]){
      markAllowed();
      return;
    }

    markPending();
    installFetchGate();

    await withTimeout(ensureRuntime(), 12000, Promise.reject(new Error('Runtime timeout')));
    var client = createClient();
    var session = await withTimeout(getSession(client), 12000, null);
    if(!session || !session.user){
      redirectToLogin();
      return;
    }

    var access = await withTimeout(resolveAccess(client, session.user, pageKey), 14000, null);
    if(!access){
      renderDenied('Acces blocat', 'Nu am putut valida permisiunile paginii.');
      return;
    }

    window.__KAD_ACCESS_BOOT__ = {
      version: VERSION,
      pageKey: pageKey,
      access: access,
      ready: true
    };
    window.__KAD_SECURITY_ACCESS__ = access;
    window.__PAGE_ACCESS__ = access.permissions || {};
    try { safeSessionStorage('rf_user_role', access.role || 'viewer'); } catch(_) {}

    if(access.allowed !== true){
      try {
        if(access.accountStatus && (access.accountStatus.is_banned || access.accountStatus.is_active === false)){
          await runInternal(function(){ return client.auth.signOut(); });
        }
      } catch(_) {}
      renderDenied('Acces restricționat', access.message || 'Nu ai acces în această pagină.');
      return;
    }

    applyReadonly(access.permissions || {});
    markAllowed();
  }

  window.KADAccessBoot = window.KADAccessBoot || {};
  window.KADAccessBoot.version = VERSION;
  window.KADAccessBoot.ready = state.readyPromise;
  window.KADAccessBoot.getState = function(){
    return {
      version: VERSION,
      pageKey: currentPageKey(),
      pending: document.documentElement.getAttribute(PENDING_ATTR) === '1',
      ready: document.documentElement.getAttribute(READY_ATTR) === '1',
      denied: document.documentElement.getAttribute(DENIED_ATTR) === '1',
      allowed: state.allowed
    };
  };

  main().catch(function(error){
    try { console.error('KAD access boot', error); } catch(_) {}
    renderDenied('Acces blocat', 'Nu am putut valida securitatea paginii.');
  });
})(window, document);
