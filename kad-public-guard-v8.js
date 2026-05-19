(function(window, document){
  'use strict';

  var VERSION = '20260519-8';
  var WAIT_ATTR = 'data-kad-guard-wait';
  var LOGIN_PAGE = './login.html';
  var PUBLIC = {
    'login': true,
    'access-gate': true,
    'mfa-setup': true,
    'mfa-verify': true,
    'forja-ctc-pin': true
  };

  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function wait(ms){ return new Promise(function(resolve){ window.setTimeout(resolve, ms); }); }
  function fileName(){
    try { return String((window.location.pathname || '').split('/').pop() || 'index.html').split('?')[0].split('#')[0] || 'index.html'; }
    catch(_) { return 'index.html'; }
  }
  function cleanPageKey(value){
    var key = String(value || '').trim().toLowerCase().split('?')[0].split('#')[0];
    key = key.replace(/^\.\//, '').replace(/\.html$/i, '');
    return key || 'index';
  }
  function currentPageKey(){
    try {
      if(window.RF_ACL && typeof window.RF_ACL.inferPageKey === 'function'){
        return cleanPageKey(window.RF_ACL.inferPageKey(window.location.pathname || '') || fileName());
      }
    } catch(_) {}
    return cleanPageKey(fileName());
  }
  function isPublic(){ return !!PUBLIC[currentPageKey()]; }
  function isIndex(){ return currentPageKey() === 'index'; }

  function ensureOverlay(){
    if(isPublic()) return;
    function mount(){
      if(!document.body || document.getElementById('kadGuardOverlay')) return;
      var el = document.createElement('div');
      el.id = 'kadGuardOverlay';
      el.innerHTML = '<div class="kadGuardCard"><div class="kadGuardTitle">Se verifică accesul...</div><div class="kadGuardText">Pagina va fi afișată după validarea autentificării.</div></div>';
      document.body.appendChild(el);
    }
    if(document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function clearOverlay(){
    try {
      var el = document.getElementById('kadGuardOverlay');
      if(el && el.parentNode) el.parentNode.removeChild(el);
    } catch(_) {}
  }

  function reveal(access){
    window.__KAD_PUBLIC_GUARD__ = { version:VERSION, ready:true, pageKey:currentPageKey(), access:access || null };
    if(access){
      window.__KAD_SECURITY_ACCESS__ = access;
      window.__PAGE_ACCESS__ = access.permissions || access;
      window.__CAN_VIEW__ = access.allowed === true || (access.permissions && access.permissions.can_view === true);
      window.__CAN_EDIT__ = !!(access.permissions && access.permissions.can_edit === true);
    }
    clearOverlay();
    try { document.documentElement.removeAttribute(WAIT_ATTR); } catch(_) {}
    try { document.documentElement.classList.remove('rf-acl-pending'); } catch(_) {}
    try { document.dispatchEvent(new CustomEvent('kad-public-guard-ready', { detail: window.__KAD_PUBLIC_GUARD__ })); } catch(_) {}
  }

  function loginUrl(){
    try {
      var url = new URL(LOGIN_PAGE, window.location.href);
      url.searchParams.set('next', fileName());
      return url.toString();
    } catch(_) { return LOGIN_PAGE; }
  }

  function goLogin(){
    try { window.location.replace(loginUrl()); }
    catch(_) { window.location.href = loginUrl(); }
  }

  function renderBlocked(title, message){
    function mount(){
      clearOverlay();
      try { document.documentElement.removeAttribute(WAIT_ATTR); } catch(_) {}
      try { document.documentElement.classList.remove('rf-acl-pending'); } catch(_) {}
      try { document.documentElement.classList.add('rf-acl-denied'); } catch(_) {}
      if(!document.body) return false;
      document.body.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;';
      var card = document.createElement('div');
      card.style.cssText = 'width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;text-align:center;';
      var h = document.createElement('div');
      h.style.cssText = 'font-size:30px;font-weight:800;line-height:1.15;margin:0 0 12px;';
      h.textContent = title || 'Acces restricționat';
      var p = document.createElement('div');
      p.style.cssText = 'font-size:16px;line-height:1.5;margin:0 0 22px;';
      p.textContent = message || 'Nu ai acces în această pagină.';
      var actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;';
      var a = document.createElement('a');
      a.href = LOGIN_PAGE;
      a.textContent = 'Înapoi la login';
      a.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;';
      actions.appendChild(a);
      card.appendChild(h); card.appendChild(p); card.appendChild(actions); wrap.appendChild(card); document.body.appendChild(wrap);
      return true;
    }
    if(!mount()) document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function getConfig(){
    var cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
    return {
      url: String(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').trim(),
      key: String(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '').trim()
    };
  }

  function getClient(){
    try { if(window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') return window.ERPAuth.getSupabaseClient(); } catch(_) {}
    try { if(typeof window.createRfSupabaseClient === 'function') return window.createRfSupabaseClient(); } catch(_) {}
    try {
      var cfg = getConfig();
      if(window.supabase && typeof window.supabase.createClient === 'function' && cfg.url && cfg.key){
        if(!window.__KAD_PUBLIC_GUARD_SB__) {
          window.__KAD_PUBLIC_GUARD_SB__ = window.supabase.createClient(cfg.url, cfg.key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
        }
        return window.__KAD_PUBLIC_GUARD_SB__;
      }
    } catch(_) {}
    return null;
  }

  async function waitClient(timeoutMs){
    var start = now();
    var client = null;
    while(now() - start < timeoutMs){
      client = getClient();
      if(client && client.auth && typeof client.auth.getSession === 'function') return client;
      await wait(100);
    }
    return getClient();
  }

  async function getSession(client, timeoutMs){
    var start = now();
    while(now() - start < timeoutMs){
      try {
        var res = await client.auth.getSession();
        if(res && res.data && res.data.session && res.data.session.user) return res.data.session;
      } catch(_) {}
      try {
        var userRes = await client.auth.getUser();
        if(userRes && userRes.data && userRes.data.user) return { user:userRes.data.user };
      } catch(_) {}
      await wait(200);
    }
    return null;
  }

  function withTimeout(promise, ms){
    return Promise.race([
      promise,
      new Promise(function(resolve){ window.setTimeout(function(){ resolve({ __timeout:true }); }, ms); })
    ]);
  }

  function normalizeAccess(access){
    if(!access || access.__timeout) return null;
    var perms = access.permissions || {};
    if(access.allowed === true || perms.can_view === true) {
      access.allowed = true;
      access.permissions = perms;
      return access;
    }
    if(access.allowed === false || perms.can_view === false) {
      access.allowed = false;
      access.permissions = perms;
      return access;
    }
    return null;
  }

  async function resolveAccess(client, user){
    var key = currentPageKey();
    if(isIndex()) return { allowed:true, role:'index', source:'authenticated index', permissions:{ can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false } };
    try {
      if(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function'){
        var result = await withTimeout(window.RF_ACL.resolvePageAccess(key, { client:client, user:user }), 7000);
        return normalizeAccess(result);
      }
    } catch(error) {
      try { console.warn('KAD public guard ACL fallback:', error); } catch(_) {}
    }
    try {
      if(window.ERPAuth && typeof window.ERPAuth.getPageAccess === 'function'){
        var fallback = await withTimeout(window.ERPAuth.getPageAccess(key, { user:user }), 7000);
        return normalizeAccess(fallback);
      }
    } catch(error2) {
      try { console.warn('KAD ERPAuth ACL fallback:', error2); } catch(_) {}
    }
    return null;
  }

  function installReadonlySafety(access){
    var perms = access && access.permissions ? access.permissions : {};
    if(perms.can_edit === true) return;
    try { document.documentElement.classList.add('kad-readonly', 'readonly'); } catch(_) {}
    var mutating = /salv|save|adaug|add\b|nou\b|new\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|cloud/i;
    var filter = /filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status/i;
    function textOf(el){ return [el.id, el.name, el.className, el.getAttribute && el.getAttribute('aria-label'), el.title, el.textContent, el.value].map(function(v){return String(v||'');}).join(' '); }
    function lock(root){
      var scope = root && root.querySelectorAll ? root : document;
      var nodes = scope.querySelectorAll('button,input[type="button"],input[type="submit"],input[type="file"],textarea,[contenteditable="true"],[data-rf-mutating],[data-mutating],[data-editable]');
      nodes.forEach(function(el){
        var t = textOf(el);
        if(filter.test(t) && !mutating.test(t)) return;
        if(mutating.test(t) || el.matches('input[type="file"],input[type="submit"],[contenteditable="true"],[data-rf-mutating],[data-mutating],[data-editable]')){
          try { el.disabled = true; } catch(_) {}
          try { el.setAttribute('readonly','readonly'); } catch(_) {}
          try { el.setAttribute('aria-disabled','true'); } catch(_) {}
        }
      });
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ lock(document); }, { once:true });
    else lock(document);
    try { new MutationObserver(function(ms){ ms.forEach(function(m){ (m.addedNodes || []).forEach(function(n){ if(n && n.nodeType === 1) lock(n); }); }); }).observe(document.documentElement, { childList:true, subtree:true }); } catch(_) {}
  }

  async function applyDomPermissions(access, client, user){
    try {
      if(window.RF_ACL && typeof window.RF_ACL.applyDomPermissions === 'function'){
        await withTimeout(window.RF_ACL.applyDomPermissions(currentPageKey(), document, { client:client, user:user, pageAccess:access }), 5000);
      }
    } catch(_) {}
    installReadonlySafety(access);
  }

  async function main(){
    if(isPublic()) { reveal(null); return; }
    ensureOverlay();

    var client = await waitClient(12000);
    if(!client || !client.auth){
      renderBlocked('Acces blocat', 'Nu s-a putut porni autentificarea. Reîncarcă pagina sau intră din nou în cont.');
      return;
    }

    var session = await getSession(client, 10000);
    if(!session || !session.user){
      goLogin();
      return;
    }

    var access = await resolveAccess(client, session.user);
    if(access && access.allowed === false){
      renderBlocked('Acces restricționat', access.message || 'Nu ai acces în această pagină.');
      return;
    }

    if(access && access.allowed === true){
      await applyDomPermissions(access, client, session.user);
      reveal(access);
      return;
    }

    // Fallback stabil: dacă utilizatorul este autentificat, nu îl blocăm pe ecran din cauza unei erori de citire ACL.
    // Paginile își păstrează propriile verificări ACL existente, iar publicul rămâne blocat deoarece fără sesiune se face redirect la login.
    var fallbackAccess = { allowed:true, role:'authenticated', source:'session fallback after ACL read failure', permissions:{ can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false }, acl_warning:true };
    installReadonlySafety(fallbackAccess);
    reveal(fallbackAccess);
  }

  window.KADPublicGuard = {
    version: VERSION,
    reveal: reveal,
    renderBlocked: renderBlocked,
    currentPageKey: currentPageKey
  };

  main().catch(function(error){
    try { console.error('KAD public guard failed:', error); } catch(_) {}
    renderBlocked('Acces blocat', 'Verificarea autentificării a eșuat. Reîncarcă pagina sau intră din nou în cont.');
  });
})(window, document);
