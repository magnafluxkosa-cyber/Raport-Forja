(function(window, document){
  'use strict';

  var LOGIN_PAGE = 'login.html';
  var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var PENDING_ATTR = 'data-kad-security-pending';
  var READY_ATTR = 'data-kad-security-ready';
  var DENIED_ATTR = 'data-kad-security-denied';
  var PUBLIC_PAGES = {
    'login': true,
    'access-gate': true,
    'mfa-setup': true,
    'mfa-verify': true,
    'forja-ctc-pin': true
  };

  function normalizePageKey(value){
    var raw = String(value || '').trim().toLowerCase();
    raw = raw.split('?')[0].split('#')[0];
    raw = raw.replace(/^\.\//, '').replace(/\.html$/i, '');
    return raw || 'index';
  }

  function currentFileName(){
    try {
      var name = String(window.location.pathname || '').split('/').pop() || 'index.html';
      return name && name !== '/' ? name : 'index.html';
    } catch(_) { return 'index.html'; }
  }

  function currentPageKey(){ return normalizePageKey(currentFileName()); }


  function safeParseJson(raw){
    try { return raw ? JSON.parse(raw) : null; } catch(_) { return null; }
  }

  function extractSessionCandidate(value){
    if(!value) return null;
    if(Array.isArray(value)){
      for(var i=0; i<value.length; i+=1){
        var fromArray = extractSessionCandidate(value[i]);
        if(fromArray) return fromArray;
      }
      return null;
    }
    if(typeof value !== 'object') return null;
    var candidates = [value, value.currentSession, value.session, value.data && value.data.session].filter(Boolean);
    for(var j=0; j<candidates.length; j+=1){
      var c = candidates[j];
      if(c && typeof c === 'object' && (c.access_token || c.refresh_token || c.user)) return c;
    }
    return null;
  }

  function readStoredSupabaseSession(){
    try {
      var stores = [window.localStorage, window.sessionStorage];
      for(var s=0; s<stores.length; s+=1){
        var store = stores[s];
        if(!store) continue;
        for(var i=0; i<store.length; i+=1){
          var key = store.key(i) || '';
          if(!key) continue;
          var looksAuth = (key.indexOf('sb-') === 0 && key.indexOf('-auth-token') !== -1) || key.indexOf('supabase.auth.token') !== -1 || key.indexOf('auth-token') !== -1;
          if(!looksAuth) continue;
          var parsed = safeParseJson(store.getItem(key));
          var candidate = extractSessionCandidate(parsed);
          if(candidate && (candidate.access_token || candidate.refresh_token || candidate.user)) return candidate;
        }
      }
    } catch(_) {}
    return null;
  }

  function hasStoredAuthEvidence(){
    var stored = readStoredSupabaseSession();
    if(stored && (stored.access_token || stored.refresh_token || stored.user)) return true;
    try {
      if(String(localStorage.getItem('rf_user_id') || sessionStorage.getItem('rf_user_id') || '').trim()) return true;
      if(String(localStorage.getItem('rf_user_email') || sessionStorage.getItem('rf_user_email') || '').trim()) return true;
      if(String(localStorage.getItem('rf_display_id') || sessionStorage.getItem('rf_display_id') || '').trim()) return true;
    } catch(_) {}
    return false;
  }

  function injectSecurityStyle(){
    if(document.getElementById('kad-security-guard-v3-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-security-guard-v3-style';
    style.textContent = [
      'html[' + PENDING_ATTR + '="1"] body{visibility:visible!important;}',
      'html[' + PENDING_ATTR + '="1"] body>*:not(#kad-security-overlay){visibility:hidden!important;}',
      'html[' + PENDING_ATTR + '="1"] #kad-security-overlay{visibility:visible!important;}',
      '#kad-security-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#c8def0!important;color:#0d2240!important;font-family:Arial,Helvetica,sans-serif!important;}',
      '#kad-security-overlay .kad-security-card{background:#d7e6f4!important;border:2px solid #1b1b1b!important;border-radius:18px!important;padding:24px 28px!important;box-shadow:0 1px 0 rgba(0,0,0,.06)!important;text-align:center!important;max-width:520px!important;margin:20px!important;}',
      '#kad-security-overlay .kad-security-title{font-size:24px!important;font-weight:800!important;margin-bottom:8px!important;}',
      '#kad-security-overlay .kad-security-text{font-size:15px!important;line-height:1.45!important;}',
      'html[' + DENIED_ATTR + '="1"] body{visibility:visible!important;}',
      'html.kad-readonly [contenteditable="true"]{user-select:text!important;}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureOverlay(){
    if(document.getElementById('kad-security-overlay')) return;
    function mount(){
      if(!document.body || document.getElementById('kad-security-overlay')) return;
      var overlay = document.createElement('div');
      overlay.id = 'kad-security-overlay';
      overlay.innerHTML = '<div class="kad-security-card"><div class="kad-security-title">Se verifică accesul...</div><div class="kad-security-text">Pagina va fi afișată doar după validarea autentificării și a permisiunilor.</div></div>';
      document.body.appendChild(overlay);
    }
    if(document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function markHidden(){
    try { document.documentElement.setAttribute(PENDING_ATTR, '1'); } catch(_) {}
    injectSecurityStyle();
    window.setTimeout(ensureOverlay, 350);
  }

  function removeOverlay(){
    try {
      var overlay = document.getElementById('kad-security-overlay');
      if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch(_) {}
  }

  function markAllowed(){
    removeOverlay();
    try { document.documentElement.removeAttribute(PENDING_ATTR); } catch(_) {}
    try { document.documentElement.removeAttribute(DENIED_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(READY_ATTR, '1'); } catch(_) {}
  }

  function markDenied(){
    removeOverlay();
    try { document.documentElement.removeAttribute(PENDING_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(DENIED_ATTR, '1'); } catch(_) {}
  }

  function redirectToLogin(){
    var target;
    try {
      target = new URL(LOGIN_PAGE, window.location.href);
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

  function loadScriptOnce(src, testFn){
    return new Promise(function(resolve, reject){
      try { if(testFn && testFn()) return resolve(); } catch(_) {}
      var scripts = Array.prototype.slice.call(document.scripts || []);
      var existing = scripts.find(function(script){
        return String(script.getAttribute('src') || '').split('?')[0].indexOf(src) !== -1;
      });
      if(existing){
        existing.addEventListener('load', function(){ resolve(); }, { once:true });
        existing.addEventListener('error', function(){ reject(new Error('Nu s-a putut încărca ' + src)); }, { once:true });
        window.setTimeout(function(){ try { if(!testFn || testFn()) resolve(); } catch(_) {} }, 0);
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ reject(new Error('Nu s-a putut încărca ' + src)); };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  async function ensureRuntime(){
    if(!(window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_SUPABASE_URL)){
      await loadScriptOnce('./rf-config.js', function(){ return !!(window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_SUPABASE_URL); });
    }
    if(!window.supabase || typeof window.supabase.createClient !== 'function'){
      await loadScriptOnce(SUPABASE_CDN, function(){ return !!(window.supabase && typeof window.supabase.createClient === 'function'); });
    }
  }

  function createClient(){
    if(window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function') {
      try { return window.createRfSupabaseClient(); } catch(_) {}
    }
    if(window.__RF_SUPABASE_SINGLETON__ && window.__RF_SUPABASE_SINGLETON__.client) return window.__RF_SUPABASE_SINGLETON__.client;
    if(window.__KAD_SECURITY_SUPABASE__) return window.__KAD_SECURITY_SUPABASE__;
    var cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
    var url = String(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').trim();
    var key = String(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '').trim();
    if(!url || !key || !window.supabase || typeof window.supabase.createClient !== 'function') throw new Error('Configurația Supabase lipsește.');
    window.__KAD_SECURITY_SUPABASE__ = window.supabase.createClient(url, key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    return window.__KAD_SECURITY_SUPABASE__;
  }

  async function withTimeout(promise, ms, fallback){
    var timer;
    try {
      return await Promise.race([
        promise,
        new Promise(function(resolve){ timer = window.setTimeout(function(){ resolve(fallback); }, ms); })
      ]);
    } finally { if(timer) window.clearTimeout(timer); }
  }

  async function getSession(sb){
    for(var i=0; i<7; i+=1){
      try {
        var res = await sb.auth.getSession();
        if(res && res.data && res.data.session && res.data.session.user) return res.data.session;
      } catch(_) {}
      await new Promise(function(resolve){ window.setTimeout(resolve, 140); });
    }

    var stored = readStoredSupabaseSession();
    if(stored && stored.access_token && stored.refresh_token && sb && sb.auth && typeof sb.auth.setSession === 'function'){
      try {
        await sb.auth.setSession({ access_token: stored.access_token, refresh_token: stored.refresh_token });
        var afterSet = await sb.auth.getSession();
        if(afterSet && afterSet.data && afterSet.data.session && afterSet.data.session.user) return afterSet.data.session;
      } catch(_) {}
    }

    try {
      var userRes = await sb.auth.getUser();
      if(userRes && userRes.data && userRes.data.user) return { user:userRes.data.user };
    } catch(_) {}

    if(stored && stored.user && (stored.access_token || stored.refresh_token)){
      return { user: stored.user, access_token: stored.access_token || '', refresh_token: stored.refresh_token || '', __stored:true };
    }

    return null;
  }

  async function maybeSelect(promise){
    try {
      var res = await promise;
      if(res && res.error) return null;
      return res ? res.data : null;
    } catch(_) { return null; }
  }

  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }

  function buildPermissions(row){
    return {
      can_view: row && row.can_view === true,
      can_add: row && row.can_add === true,
      can_edit: row && row.can_edit === true,
      can_delete: row && row.can_delete === true,
      can_export: row && row.can_export === true,
      can_import: row && row.can_import === true
    };
  }

  async function readDoc(sb, docKey){
    var rows = await maybeSelect(sb.from('rf_documents').select('content,data,updated_at').eq('doc_key', docKey).order('updated_at', { ascending:false }).limit(20));
    if(!Array.isArray(rows)) return null;
    rows.sort(function(a,b){ return String((b && b.updated_at) || '').localeCompare(String((a && a.updated_at) || '')); });
    for(var i=0; i<rows.length; i+=1){
      if(rows[i] && rows[i].content && typeof rows[i].content === 'object') return rows[i].content;
      if(rows[i] && rows[i].data && typeof rows[i].data === 'object') return rows[i].data;
    }
    return null;
  }

  async function resolveRole(sb, user){
    var email = normalizeEmail(user && user.email);
    try {
      var doc = await readDoc(sb, 'acl_roles_v1');
      var roles = doc && doc.roles && typeof doc.roles === 'object' ? doc.roles : null;
      var mirrored = roles && (roles[email] || roles[email.toLowerCase()]);
      if(mirrored) return normalizePageKey(mirrored);
    } catch(_) {}
    if(window.RF_ACL && typeof window.RF_ACL.resolveRole === 'function'){
      try {
        var rr = await window.RF_ACL.resolveRole(sb, user);
        var roleFromRf = normalizePageKey((rr && rr.role) || rr);
        if(roleFromRf) return roleFromRf;
      } catch(_) {}
    }
    var attempts = [];
    if(user && user.id){
      attempts.push(sb.from('profiles').select('role').eq('user_id', user.id).maybeSingle());
      attempts.push(sb.from('profiles').select('role').eq('id', user.id).maybeSingle());
    }
    if(email){
      attempts.push(sb.from('profiles').select('role').eq('email', email).maybeSingle());
      attempts.push(sb.from('rf_acl').select('role').eq('email', email).maybeSingle());
    }
    for(var i=0; i<attempts.length; i+=1){
      var row = await maybeSelect(attempts[i]);
      var role = normalizePageKey(row && row.role);
      if(['admin','editor','operator','viewer'].indexOf(role) !== -1) return role;
    }
    return 'viewer';
  }

  async function getAccountStatus(sb, user){
    var email = normalizeEmail(user && user.email);
    var userId = String(user && user.id || '').trim();
    var rows = [];
    if(userId){
      var byUserId = await maybeSelect(sb.from('user_account_access').select('user_id,email,is_active,is_banned,note,ban_reason,updated_at').eq('user_id', userId).order('updated_at', { ascending:false }).limit(20));
      if(Array.isArray(byUserId)) rows = rows.concat(byUserId);
    }
    if(email){
      var byEmail = await maybeSelect(sb.from('user_account_access').select('user_id,email,is_active,is_banned,note,ban_reason,updated_at').ilike('email', email).order('updated_at', { ascending:false }).limit(20));
      if(Array.isArray(byEmail)) rows = rows.concat(byEmail);
    }
    rows.sort(function(a,b){ return String((b && b.updated_at) || '').localeCompare(String((a && a.updated_at) || '')); });
    for(var i=0; i<rows.length; i+=1){
      var row = rows[i] || {};
      var rowEmail = normalizeEmail(row.email);
      var rowUserId = String(row.user_id || '').trim();
      if((email && rowEmail === email) || (userId && rowUserId === userId)){
        return { is_active: row.is_active !== false, is_banned: row.is_banned === true, note: String(row.note || row.ban_reason || '').trim() };
      }
    }
    return { is_active:true, is_banned:false, note:'' };
  }

  function rowToMap(rows){
    var map = Object.create(null);
    (Array.isArray(rows) ? rows : []).forEach(function(row){
      var key = normalizePageKey(row && row.page_key);
      if(key) map[key] = buildPermissions(row);
    });
    return map;
  }

  function mapHasEntries(map){ return !!(map && Object.keys(map).length); }

  async function loadUserAcl(sb, user){
    var all = [];
    var email = normalizeEmail(user && user.email);
    var userId = String(user && user.id || '').trim();
    if(userId){
      var byUser = await maybeSelect(sb.from('user_page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').eq('user_id', userId).limit(5000));
      if(Array.isArray(byUser)) all = all.concat(byUser);
    }
    if(email){
      var byEmail = await maybeSelect(sb.from('user_page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').ilike('email', email).limit(5000));
      if(Array.isArray(byEmail)) all = all.concat(byEmail);
    }
    var map = rowToMap(all);
    if(!mapHasEntries(map)){
      try {
        var mirror = await readDoc(sb, 'dashboard_acl_v1');
        ['user_permissions','user_grants'].forEach(function(rootKey){
          var root = mirror && mirror[rootKey] && typeof mirror[rootKey] === 'object' ? mirror[rootKey] : null;
          var userRoot = root && email && root[email] && typeof root[email] === 'object' ? root[email] : null;
          if(userRoot){ Object.keys(userRoot).forEach(function(pageKey){ map[normalizePageKey(pageKey)] = buildPermissions(userRoot[pageKey]); }); }
        });
      } catch(_) {}
    }
    return map;
  }

  async function loadRoleAcl(sb, role){
    var rows = await maybeSelect(sb.from('page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').eq('role', role).limit(5000));
    var map = rowToMap(rows);
    try {
      var mirror = await readDoc(sb, 'dashboard_acl_v1');
      var root = mirror && mirror.role_permissions && typeof mirror.role_permissions === 'object' ? mirror.role_permissions : null;
      var roleRoot = root && root[role] && typeof root[role] === 'object' ? root[role] : null;
      if(roleRoot){ Object.keys(roleRoot).forEach(function(pageKey){ map[normalizePageKey(pageKey)] = buildPermissions(roleRoot[pageKey]); }); }
    } catch(_) {}
    return map;
  }

  async function resolveAccess(sb, user, pageKey){
    var role = await resolveRole(sb, user);
    var status = await getAccountStatus(sb, user);
    if(status.is_banned === true || status.is_active === false){
      return { allowed:false, role:role, permissions:buildPermissions(null), message:status.note || 'Cont blocat.', accountStatus:status };
    }
    if(pageKey === 'index'){
      return { allowed:true, role:role, permissions:{ can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true }, accountStatus:status, source:'authenticated index' };
    }
    if(role === 'admin'){
      return { allowed:true, role:role, permissions:{ can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true }, accountStatus:status, source:'admin' };
    }
    var userMap = await loadUserAcl(sb, user);
    if(mapHasEntries(userMap)){
      var userPerm = userMap[pageKey] || buildPermissions(null);
      return { allowed:userPerm.can_view === true, role:role, permissions:userPerm, accountStatus:status, source:'user acl strict', message:userPerm.can_view === true ? '' : 'Nu ai acces în această pagină.' };
    }
    var roleMap = await loadRoleAcl(sb, role);
    var rolePerm = roleMap[pageKey] || buildPermissions(null);
    return { allowed:rolePerm.can_view === true, role:role, permissions:rolePerm, accountStatus:status, source:'role acl strict', message:rolePerm.can_view === true ? '' : 'Nu ai acces în această pagină.' };
  }

  function isFilterControl(el){
    if(!el || !el.matches) return false;
    if(el.matches('[data-acl-filter], .th-filter, .th-filter-select, #filterRow input, #filterRow select')) return true;
    if(el.closest('[data-acl-filter], .filters, .filtersBar, .filter-row, #filterRow, .toolbar-filters, .table-filters, .search-box, .searchbar')) return true;
    var text = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.placeholder, el.textContent].map(function(v){ return String(v || '').toLowerCase(); }).join(' ');
    if(/salv|save|adaug|add\b|edit|delete|sterg|șterg|import|upload|submit|actualiz|update/.test(text)) return false;
    return /filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status/.test(text);
  }

  function isMutatingControl(el){
    if(!el || !el.matches) return false;
    if(el.matches('input[type="file"], input[type="submit"], button[type="submit"]')) return true;
    if(el.matches('[contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]')) return true;
    var text = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.title, el.textContent, el.value].map(function(v){ return String(v || '').toLowerCase(); }).join(' ');
    return /salv|save|adaug|add\b|nou\b|new\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|cloud.*save|salvează/.test(text);
  }

  function applyReadonly(permissions){
    var canEdit = permissions && permissions.can_edit === true;
    window.__PAGE_ACCESS__ = Object.assign({}, permissions || {});
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
        mutations.forEach(function(m){ if(m.addedNodes) m.addedNodes.forEach(function(n){ if(n && n.nodeType === 1) lock(n); }); });
      });
      obs.observe(document.documentElement || document.body, { subtree:true, childList:true });
    } catch(_) {}
    ['beforeinput','paste','drop','submit'].forEach(function(type){
      document.addEventListener(type, function(event){
        var target = event.target;
        if(target && isFilterControl(target)) return;
        if(target && target.matches && (target.matches('input,textarea,select,[contenteditable="true"]') || isMutatingControl(target.closest ? (target.closest('button,[data-rf-mutating],[data-mutating],[data-editable]') || target) : target))){
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }, true);
    });
    document.addEventListener('click', function(event){
      var el = event.target && event.target.closest ? event.target.closest('button, input[type="button"], input[type="submit"], [role="button"], [data-rf-mutating], [data-mutating], [data-editable]') : null;
      if(!el || isFilterControl(el)) return;
      if(isMutatingControl(el)){ event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  }

  async function main(){
    markHidden();
    var pageKey = currentPageKey();
    if(PUBLIC_PAGES[pageKey]) { markAllowed(); return; }

    if(pageKey === 'index'){
      if(!hasStoredAuthEvidence()){ redirectToLogin(); return; }
      window.__KAD_SECURITY_ACCESS__ = {
        allowed:true,
        role:'',
        permissions:{ can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true },
        accountStatus:{ is_active:true, is_banned:false, note:'' },
        source:'index local-session fast-path'
      };
      markAllowed();
      return;
    }

    await ensureRuntime();
    var sb = createClient();
    var session = await withTimeout(getSession(sb), 10000, null);
    if(!session || !session.user){ redirectToLogin(); return; }

    var access = await withTimeout(resolveAccess(sb, session.user, pageKey), 12000, null);
    if(!access){ renderDenied('Acces blocat', 'Nu am putut valida permisiunile paginii.'); return; }

    window.__KAD_SECURITY_ACCESS__ = access;
    try { localStorage.setItem('rf_user_role', access.role || 'viewer'); sessionStorage.setItem('rf_user_role', access.role || 'viewer'); } catch(_) {}

    if(access.allowed !== true){
      try { if(access.accountStatus && (access.accountStatus.is_banned || access.accountStatus.is_active === false)) await sb.auth.signOut(); } catch(_) {}
      renderDenied('Acces restricționat', access.message || 'Nu ai acces în această pagină.');
      return;
    }

    applyReadonly(access.permissions || {});
    markAllowed();
  }

  window.KADSecurityGuard = window.KADSecurityGuard || {};
  window.KADSecurityGuard.version = 'v3';
  window.KADSecurityGuard.getState = function(){
    return {
      pending: document.documentElement.getAttribute(PENDING_ATTR) === '1',
      ready: document.documentElement.getAttribute(READY_ATTR) === '1',
      denied: document.documentElement.getAttribute(DENIED_ATTR) === '1',
      pageKey: currentPageKey()
    };
  };

  main().catch(function(err){
    try { console.error('KAD security guard v3', err); } catch(_) {}
    renderDenied('Acces blocat', 'Nu am putut valida securitatea paginii.');
  });
})(window, document);
