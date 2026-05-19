(function(window, document){
  'use strict';

  var VERSION = '20260519-7';
  var LOGIN_PAGE = './login.html';
  var WAIT_ATTR = 'data-kad-acl-wait';
  var PUBLIC = {
    'login': true,
    'access-gate': true,
    'mfa-setup': true,
    'mfa-verify': true,
    'forja-ctc-pin': true
  };

  function fileName(){
    var f = 'index.html';
    try { f = String(window.location.pathname || '').split('/').pop() || 'index.html'; } catch(_) {}
    return f || 'index.html';
  }

  function pageFromFile(){
    return String(fileName()).toLowerCase().split('?')[0].split('#')[0].replace(/\.html$/,'') || 'index';
  }

  function pageKey(){
    try {
      if (window.RF_ACL && typeof window.RF_ACL.inferPageKey === 'function') {
        return window.RF_ACL.inferPageKey(window.location.pathname || '') || pageFromFile();
      }
    } catch(_) {}
    return pageFromFile();
  }

  function isPublic(){ return !!PUBLIC[pageFromFile()]; }

  function ensureOverlay(){
    if (isPublic()) return;
    function mount(){
      if (!document.body || document.getElementById('kadAclGateOverlay')) return;
      var el = document.createElement('div');
      el.id = 'kadAclGateOverlay';
      el.innerHTML = '<div class="kadAclGateCard"><div class="kadAclGateTitle">Se verifică accesul...</div><div class="kadAclGateText">Pagina va fi afișată doar după validarea autentificării și a permisiunilor.</div></div>';
      document.body.appendChild(el);
    }
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function clearOverlay(){
    try {
      var el = document.getElementById('kadAclGateOverlay');
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch(_) {}
  }

  function reveal(access){
    window.__KAD_VISIBILITY_GATE__ = { version:VERSION, ready:true, pageKey:pageKey(), access:access || null };
    if (access) {
      window.__KAD_SECURITY_ACCESS__ = access;
      window.__PAGE_ACCESS__ = access.permissions || {};
      window.__CAN_EDIT__ = !!(access.permissions && access.permissions.can_edit === true);
    }
    clearOverlay();
    try { document.documentElement.removeAttribute(WAIT_ATTR); } catch(_) {}
    try { document.dispatchEvent(new CustomEvent('kad-acl-visibility-ready', { detail: window.__KAD_VISIBILITY_GATE__ })); } catch(_) {}
  }

  function loginUrl(){
    try {
      var u = new URL(LOGIN_PAGE, window.location.href);
      u.searchParams.set('next', fileName());
      return u.toString();
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
      if (!document.body) return false;
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
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;';
      var a = document.createElement('a');
      a.href = LOGIN_PAGE;
      a.textContent = 'Login';
      a.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;';
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Reîncarcă';
      b.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;cursor:pointer;';
      b.onclick = function(){ window.location.reload(); };
      row.appendChild(a); row.appendChild(b);
      card.appendChild(h); card.appendChild(p); card.appendChild(row); wrap.appendChild(card); document.body.appendChild(wrap);
      return true;
    }
    if (!mount()) document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function wait(ms){ return new Promise(function(resolve){ window.setTimeout(resolve, ms); }); }

  async function waitRuntime(timeoutMs){
    var start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.supabase && typeof window.supabase.createClient === 'function' &&
          window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function' &&
          window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function') {
        return true;
      }
      await wait(100);
    }
    return false;
  }

  function hasStoredSbToken(){
    try {
      var stores = [localStorage, sessionStorage];
      for (var s=0; s<stores.length; s++) {
        var store = stores[s];
        for (var i=0; i<store.length; i++) {
          var k = store.key(i) || '';
          if ((k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) || k.indexOf('supabase.auth.token') !== -1) {
            var raw = store.getItem(k);
            if (raw && raw !== 'null' && raw !== 'undefined') return true;
          }
        }
      }
    } catch(_) {}
    return false;
  }

  async function getSession(client, timeoutMs){
    var start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        var res = await client.auth.getSession();
        if (res && res.data && res.data.session && res.data.session.user) return res.data.session;
      } catch(_) {}
      try {
        var userRes = await client.auth.getUser();
        if (userRes && userRes.data && userRes.data.user) return { user:userRes.data.user };
      } catch(_) {}
      await wait(250);
    }
    return null;
  }

  function installReadonlySafety(access){
    var perms = access && access.permissions ? access.permissions : {};
    if (perms.can_edit === true) return;
    try { document.documentElement.classList.add('kad-readonly'); } catch(_) {}
    var mutating = /salv|save|adaug|add\b|nou\b|new\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|cloud/i;
    var filter = /filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status/i;
    function txt(el){ return [el.id, el.name, el.className, el.getAttribute && el.getAttribute('aria-label'), el.title, el.textContent, el.value].map(function(v){return String(v||'');}).join(' '); }
    function lock(root){
      var scope = root && root.querySelectorAll ? root : document;
      var nodes = scope.querySelectorAll('button,input[type="button"],input[type="submit"],input[type="file"],textarea,[contenteditable="true"],[data-rf-mutating],[data-mutating],[data-editable]');
      nodes.forEach(function(el){
        var t = txt(el);
        if (filter.test(t) && !mutating.test(t)) return;
        if (mutating.test(t) || el.matches('input[type="file"],input[type="submit"],[contenteditable="true"],[data-rf-mutating],[data-mutating],[data-editable]')) {
          try { el.disabled = true; } catch(_) {}
          try { el.setAttribute('readonly','readonly'); } catch(_) {}
          try { el.setAttribute('aria-disabled','true'); } catch(_) {}
        }
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ lock(document); }, { once:true });
    else lock(document);
    try {
      new MutationObserver(function(muts){ muts.forEach(function(m){ (m.addedNodes || []).forEach(function(n){ if(n && n.nodeType === 1) lock(n); }); }); }).observe(document.documentElement, { childList:true, subtree:true });
    } catch(_) {}
  }

  async function main(){
    if (isPublic()) return reveal(null);
    ensureOverlay();

    var ok = await waitRuntime(18000);
    if (!ok) {
      renderBlocked('Acces blocat', 'Nu s-a putut încărca verificarea de securitate. Reîncarcă pagina sau intră din nou în cont.');
      return;
    }

    var client;
    try { client = window.createRfSupabaseClient(); }
    catch(_) { client = null; }
    if (!client || !client.auth) {
      renderBlocked('Acces blocat', 'Clientul Supabase nu este disponibil.');
      return;
    }

    var session = await getSession(client, hasStoredSbToken() ? 12000 : 4000);

    if (pageFromFile() === 'index') {
      if (session && session.user) reveal({ allowed:true, role:'index', permissions:{ can_view:true } });
      else goLogin();
      return;
    }

    if (!session || !session.user) {
      goLogin();
      return;
    }

    var access = null;
    try {
      access = await window.RF_ACL.resolvePageAccess(pageKey(), { client:client, user:session.user });
    } catch(error) {
      try { console.error('KAD ACL resolve failed:', error); } catch(_) {}
      access = null;
    }

    if (!access) {
      renderBlocked('Acces blocat', 'Nu am putut valida permisiunile paginii.');
      return;
    }

    if (access.allowed !== true) {
      renderBlocked('Acces restricționat', access.message || 'Nu ai acces în această pagină.');
      return;
    }

    try {
      if (window.RF_ACL && typeof window.RF_ACL.applyDomPermissions === 'function') {
        await window.RF_ACL.applyDomPermissions(pageKey(), document, { client:client, user:session.user, pageAccess:access });
      }
    } catch(_) {}
    installReadonlySafety(access);
    reveal(access);
  }

  main().catch(function(error){
    try { console.error('KAD visibility gate failed:', error); } catch(_) {}
    renderBlocked('Acces blocat', 'Verificarea de securitate a eșuat. Reîncarcă pagina sau intră din nou în cont.');
  });
})(window, document);
