(function(window, document){
  'use strict';

  var PROJECT_KEY = 'kad';
  var GATE_PAGE = 'login.html';
  var LOGIN_PAGE = 'login.html';
  var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var SECURITY_ATTR = 'data-kad-security-pending';
  var READY_ATTR = 'data-kad-security-ready';
  var DENIED_ATTR = 'data-kad-security-denied';
  var STORAGE_KEYS = ['rf_project_gate_access_session', 'rf_project_gate_access'];
  var OVERLAY_ID = 'kad-security-overlay';
  var VALIDATION_TIMEOUT_MS = 60000;
  var QUERY_TIMEOUT_MS = 12000;
  var state = {
    allowed: false,
    ready: false,
    internalDepth: 0,
    nativeFetch: window.fetch ? window.fetch.bind(window) : null,
    readyResolve: null
  };
  state.readyPromise = new Promise(function(resolve){ state.readyResolve = resolve; });

  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  function ensureStyle(){
    if(document.getElementById('kad-security-guard-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-security-guard-style';
    style.textContent = '' +
      'html[' + SECURITY_ATTR + '="1"] body{visibility:visible!important;}' +
      'html[' + SECURITY_ATTR + '="1"] body>*:not(#' + OVERLAY_ID + '){visibility:hidden!important;}' +
      'html[' + DENIED_ATTR + '="1"] body{visibility:visible!important;}' +
      'html.kad-readonly [contenteditable="true"]{user-select:text!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function showOverlay(message){
    onReady(function(){
      if(document.getElementById(OVERLAY_ID)) return;
      var outer = document.createElement('div');
      outer.id = OVERLAY_ID;
      outer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;visibility:visible!important;';
      outer.innerHTML = '<div style="width:min(560px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:26px;text-align:center;box-shadow:0 1px 0 rgba(0,0,0,.08);visibility:visible!important"><div style="font-size:28px;font-weight:800;margin-bottom:10px;visibility:visible!important">Se verifică accesul...</div><div style="font-size:15px;line-height:1.45;visibility:visible!important">'+escapeHtml(message || 'Validare utilizator și permisiuni ACL.')+'</div><div style="height:8px;border-radius:999px;background:linear-gradient(90deg,#d9e6f2,#123a63,#d9e6f2);background-size:220% 100%;animation:kadSecMove 1.1s linear infinite;margin-top:18px;visibility:visible!important"></div></div>';
      if(!document.getElementById('kad-security-guard-anim')){
        var st=document.createElement('style'); st.id='kad-security-guard-anim'; st.textContent='@keyframes kadSecMove{0%{background-position:0 0}100%{background-position:220% 0}}'; (document.head||document.documentElement).appendChild(st);
      }
      document.body.appendChild(outer);
    });
  }

  function removeOverlay(){
    try { var el = document.getElementById(OVERLAY_ID); if(el) el.remove(); } catch(_) {}
  }

  function markHidden(){
    try { document.documentElement.setAttribute(SECURITY_ATTR, '1'); } catch(_) {}
    ensureStyle();
    showOverlay();
  }

  function markAllowed(){
    state.allowed = true;
    state.ready = true;
    try { document.documentElement.removeAttribute(SECURITY_ATTR); } catch(_) {}
    try { document.documentElement.removeAttribute(DENIED_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(READY_ATTR, '1'); } catch(_) {}
    removeOverlay();
    if(state.readyResolve) state.readyResolve(true);
    // Rescue pentru paginile vechi care rămân cu body.booting dacă init-ul lor a fost întârziat.
    setTimeout(function(){
      try {
        if(document.body && document.body.classList && document.body.classList.contains('booting')) document.body.classList.remove('booting');
      } catch(_) {}
    }, 9000);
  }

  function markDenied(){
    state.allowed = false;
    state.ready = true;
    try { document.documentElement.removeAttribute(SECURITY_ATTR); } catch(_) {}
    try { document.documentElement.setAttribute(DENIED_ATTR, '1'); } catch(_) {}
    removeOverlay();
    if(state.readyResolve) state.readyResolve(false);
  }

  function escapeHtml(value){ return String(value == null ? '' : value).replace(/[&<>"']/g,function(s){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]; }); }

  function normalizePageKey(value){
    var raw = String(value || '').trim().toLowerCase();
    raw = raw.split('?')[0].split('#')[0];
    raw = raw.replace(/^\.\//, '').replace(/\.html$/i, '');
    return raw || 'index';
  }

  function currentFileName(){
    try {
      var name = String(window.location.pathname || '').split('/').pop() || 'index.html';
      if(!name || name === '/') return 'index.html';
      return name;
    } catch(_) { return 'index.html'; }
  }

  function currentPageKey(){ return normalizePageKey(currentFileName()); }
  function isAccessGate(){ return currentPageKey() === 'access-gate'; }
  function isLogin(){ return currentPageKey() === 'login'; }
  function safeRemove(store, key){ try { store.removeItem(key); } catch(_) {} }
  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }

  function readGateAccess(){ return { projectKey:PROJECT_KEY, expiresAt:Date.now() + 86400000 }; }

  function clearGateAccess(){
    [window.sessionStorage, window.localStorage].forEach(function(store){
      STORAGE_KEYS.forEach(function(key){ safeRemove(store, key); });
    });
  }

  function buildUrl(page, params){
    var url = new URL(page, window.location.href);
    Object.keys(params || {}).forEach(function(key){ if(params[key] !== undefined && params[key] !== null && params[key] !== '') url.searchParams.set(key, String(params[key])); });
    return url.toString();
  }

  function redirect(page, params){
    removeOverlay();
    var target = buildUrl(page, params || {});
    try { window.location.replace(target); } catch(_) { window.location.href = target; }
  }
  function redirectToGate(){ redirect(GATE_PAGE, { project:PROJECT_KEY, next: currentFileName() }); }
  function redirectToLogin(extra){ redirect(LOGIN_PAGE, Object.assign({ next: currentFileName() }, extra || {})); }

  function urlFromFetchArgs(args){
    try { var input = args && args[0]; if(typeof input === 'string') return input; if(input && input.url) return String(input.url); } catch(_) {}
    return '';
  }

  function getSupabaseUrl(){
    var cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
    return String(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').replace(/\/$/, '');
  }

  function isSupabaseRequest(url){
    var base = getSupabaseUrl(); if(!base || !url) return false;
    try { return String(url).indexOf(base) === 0; } catch(_) { return false; }
  }

  function installFetchGate(){
    // Dezactivat implicit ca să nu blocheze inițializarea paginilor existente.
    // Se poate activa punctual cu window.KAD_STRICT_FETCH_GUARD = true înainte de acest script.
    if(window.KAD_STRICT_FETCH_GUARD !== true) return;
    if(!state.nativeFetch || window.__KAD_SECURITY_FETCH_GATED__) return;
    window.__KAD_SECURITY_FETCH_GATED__ = true;
    window.fetch = function(){
      var args = arguments;
      var url = urlFromFetchArgs(args);
      if(state.internalDepth > 0 || state.allowed || !isSupabaseRequest(url)) return state.nativeFetch.apply(window, args);
      return state.readyPromise.then(function(ok){
        if(ok) return state.nativeFetch.apply(window, args);
        return Promise.reject(new Error('KAD security: cerere blocată înainte de validarea accesului.'));
      });
    };
  }

  async function runInternal(fn){ state.internalDepth += 1; try { return await fn(); } finally { state.internalDepth -= 1; } }

  function withTimeout(promise, ms, label){
    var timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function(_, reject){ timer = setTimeout(function(){ reject(new Error(label || 'Operația a expirat.')); }, ms || QUERY_TIMEOUT_MS); })
    ]).finally(function(){ if(timer) clearTimeout(timer); });
  }

  function loadScriptOnce(src, testFn){
    return new Promise(function(resolve, reject){
      try { if(testFn && testFn()) return resolve(); } catch(_) {}
      var existing = Array.prototype.slice.call(document.scripts || []).find(function(script){ return String(script.getAttribute('src') || '').indexOf(src) !== -1; });
      if(existing){
        existing.addEventListener('load', function(){ resolve(); }, { once:true });
        existing.addEventListener('error', function(){ reject(new Error('Nu s-a putut încărca ' + src)); }, { once:true });
        try { if(testFn && testFn()) return resolve(); } catch(_) {}
      }
      var script = document.createElement('script');
      script.src = src; script.async = false; script.setAttribute('data-kad-security-managed', '1');
      script.onload = function(){ resolve(); };
      script.onerror = function(){ reject(new Error('Nu s-a putut încărca ' + src)); };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  async function ensureRuntime(){
    if(!(window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_SUPABASE_URL)) await withTimeout(loadScriptOnce('./rf-config.js', function(){ return !!(window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_SUPABASE_URL); }), QUERY_TIMEOUT_MS, 'Nu s-a putut încărca rf-config.js.');
    if(!window.supabase || typeof window.supabase.createClient !== 'function') await withTimeout(loadScriptOnce(SUPABASE_CDN, function(){ return !!(window.supabase && typeof window.supabase.createClient === 'function'); }), QUERY_TIMEOUT_MS, 'Nu s-a putut încărca Supabase client.');
  }

  function createClient(){
    if(window.__KAD_SECURITY_SUPABASE__) return window.__KAD_SECURITY_SUPABASE__;
    var cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
    var url = String(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').trim();
    var key = String(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '').trim();
    if(!url || !key || !window.supabase || typeof window.supabase.createClient !== 'function') throw new Error('Configurația Supabase lipsește.');
    window.__KAD_SECURITY_SUPABASE__ = window.supabase.createClient(url, key, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    return window.__KAD_SECURITY_SUPABASE__;
  }

  async function getSession(sb){
    try { var res = await withTimeout(sb.auth.getSession(), QUERY_TIMEOUT_MS, 'Validarea sesiunii a expirat.'); if(res && res.data && res.data.session && res.data.session.user) return res.data.session; } catch(_) {}
    try { var userRes = await withTimeout(sb.auth.getUser(), QUERY_TIMEOUT_MS, 'Citirea utilizatorului a expirat.'); if(userRes && userRes.data && userRes.data.user) return { user:userRes.data.user }; } catch(_) {}
    return null;
  }

  async function maybeSelect(promise){
    try { var res = await withTimeout(promise, QUERY_TIMEOUT_MS, 'Interogarea ACL a expirat.'); if(res && res.error) return null; return res ? res.data : null; } catch(_) { return null; }
  }

  function buildPermissions(row){ return { can_view: row && row.can_view === true, can_add: row && row.can_add === true, can_edit: row && row.can_edit === true, can_delete: row && row.can_delete === true, can_export: row && row.can_export === true, can_import: row && row.can_import === true }; }

  async function readDoc(sb, docKey){
    var rows = await maybeSelect(sb.from('rf_documents').select('content,data,updated_at').eq('doc_key', docKey).order('updated_at', { ascending:false }).limit(20));
    if(!Array.isArray(rows)) return null;
    rows.sort(function(a,b){ return String((b && b.updated_at) || '').localeCompare(String((a && a.updated_at) || '')); });
    for(var i=0; i<rows.length; i+=1){ if(rows[i] && rows[i].content && typeof rows[i].content === 'object') return rows[i].content; if(rows[i] && rows[i].data && typeof rows[i].data === 'object') return rows[i].data; }
    return null;
  }

  async function resolveRole(sb, user){
    var email = normalizeEmail(user && user.email);
    try { var doc = await readDoc(sb, 'acl_roles_v1'); var roles = doc && doc.roles && typeof doc.roles === 'object' ? doc.roles : null; var mirrored = roles && (roles[email] || roles[email.toLowerCase()]); if(mirrored) return normalizePageKey(mirrored); } catch(_) {}
    var attempts = [];
    if(user && user.id){ attempts.push(sb.from('profiles').select('role').eq('user_id', user.id).maybeSingle()); attempts.push(sb.from('profiles').select('role').eq('id', user.id).maybeSingle()); }
    if(email){ attempts.push(sb.from('profiles').select('role').eq('email', email).maybeSingle()); attempts.push(sb.from('rf_acl').select('role').eq('email', email).maybeSingle()); }
    for(var i=0; i<attempts.length; i+=1){ var row = await maybeSelect(attempts[i]); var role = normalizePageKey(row && row.role); if(['admin','editor','operator','viewer'].indexOf(role) !== -1) return role; }
    return 'viewer';
  }

  async function getAccountStatus(sb, user){
    var email = normalizeEmail(user && user.email); var userId = String(user && user.id || '').trim(); var rows = [];
    if(userId){ var byUserId = await maybeSelect(sb.from('user_account_access').select('user_id,email,is_active,is_banned,note,ban_reason,updated_at').eq('user_id', userId).order('updated_at', { ascending:false }).limit(20)); if(Array.isArray(byUserId)) rows = rows.concat(byUserId); }
    if(email){ var byEmail = await maybeSelect(sb.from('user_account_access').select('user_id,email,is_active,is_banned,note,ban_reason,updated_at').ilike('email', email).order('updated_at', { ascending:false }).limit(20)); if(Array.isArray(byEmail)) rows = rows.concat(byEmail); }
    rows.sort(function(a,b){ return String((b && b.updated_at) || '').localeCompare(String((a && a.updated_at) || '')); });
    for(var i=0; i<rows.length; i+=1){ var row = rows[i] || {}; var rowEmail = normalizeEmail(row.email); var rowUserId = String(row.user_id || '').trim(); if((email && rowEmail === email) || (userId && rowUserId === userId)){ return { is_active: row.is_active !== false, is_banned: row.is_banned === true, note: String(row.note || row.ban_reason || '').trim() }; } }
    return { is_active:true, is_banned:false, note:'' };
  }

  function rowToMap(rows){ var map = Object.create(null); (Array.isArray(rows) ? rows : []).forEach(function(row){ var key = normalizePageKey(row && row.page_key); if(key) map[key] = buildPermissions(row); }); return map; }
  function mapHasEntries(map){ return !!(map && Object.keys(map).length); }

  async function loadUserAcl(sb, user){
    var all = []; var email = normalizeEmail(user && user.email); var userId = String(user && user.id || '').trim();
    if(userId){ var byUser = await maybeSelect(sb.from('user_page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').eq('user_id', userId).limit(5000)); if(Array.isArray(byUser)) all = all.concat(byUser); }
    if(email){ var byEmail = await maybeSelect(sb.from('user_page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').ilike('email', email).limit(5000)); if(Array.isArray(byEmail)) all = all.concat(byEmail); }
    var map = rowToMap(all);
    if(!mapHasEntries(map)){
      try { var mirror = await readDoc(sb, 'dashboard_acl_v1'); ['user_permissions','user_grants'].forEach(function(rootKey){ var root = mirror && mirror[rootKey] && typeof mirror[rootKey] === 'object' ? mirror[rootKey] : null; var userRoot = root && email && root[email] && typeof root[email] === 'object' ? root[email] : null; if(userRoot){ Object.keys(userRoot).forEach(function(pageKey){ map[normalizePageKey(pageKey)] = buildPermissions(userRoot[pageKey]); }); } }); } catch(_) {}
    }
    return map;
  }

  async function loadRoleAcl(sb, role){
    var rows = await maybeSelect(sb.from('page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').eq('role', role).limit(5000));
    var map = rowToMap(rows);
    try { var mirror = await readDoc(sb, 'dashboard_acl_v1'); var root = mirror && mirror.role_permissions && typeof mirror.role_permissions === 'object' ? mirror.role_permissions : null; var roleRoot = root && root[role] && typeof root[role] === 'object' ? root[role] : null; if(roleRoot){ Object.keys(roleRoot).forEach(function(pageKey){ map[normalizePageKey(pageKey)] = buildPermissions(roleRoot[pageKey]); }); } } catch(_) {}
    return map;
  }

  async function resolveAccess(sb, user, pageKey){
    var role = await resolveRole(sb, user); var status = await getAccountStatus(sb, user);
    if(status.is_banned === true || status.is_active === false) return { allowed:false, role:role, permissions:buildPermissions(null), message:status.note || 'Cont blocat.', accountStatus:status };
    if(pageKey === 'index') return { allowed:true, role:role, permissions:{ can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false }, accountStatus:status, source:'authenticated index' };
    if(role === 'admin') return { allowed:true, role:role, permissions:{ can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true }, accountStatus:status, source:'admin' };
    var userMap = await loadUserAcl(sb, user);
    if(mapHasEntries(userMap)){ var userPerm = userMap[pageKey] || buildPermissions(null); return { allowed:userPerm.can_view === true, role:role, permissions:userPerm, accountStatus:status, source:'user acl strict', message:userPerm.can_view === true ? '' : 'Nu ai acces în această pagină.' }; }
    var roleMap = await loadRoleAcl(sb, role); var rolePerm = roleMap[pageKey] || buildPermissions(null);
    return { allowed:rolePerm.can_view === true, role:role, permissions:rolePerm, accountStatus:status, source:'role acl strict', message:rolePerm.can_view === true ? '' : 'Nu ai acces în această pagină.' };
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
      var h = document.createElement('div'); h.style.cssText = 'font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;'; h.textContent = title || 'Acces restricționat';
      var p = document.createElement('div'); p.style.cssText = 'font-size:16px;line-height:1.5;margin:0 0 22px;'; p.textContent = message || 'Nu ai acces în această pagină.';
      var a = document.createElement('a'); a.href = LOGIN_PAGE; a.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;'; a.textContent = 'Înapoi la login';
      card.appendChild(h); card.appendChild(p); card.appendChild(a); outer.appendChild(card); document.body.appendChild(outer);
      return true;
    }
    if(!mount()) document.addEventListener('DOMContentLoaded', mount, { once:true });
  }

  function controlText(el){ var attrs = []; try { attrs = [el.id, el.name, el.className, el.getAttribute('aria-label'), el.title, el.placeholder, el.textContent, el.value, el.getAttribute('data-rf-control'), el.getAttribute('data-action'), el.getAttribute('data-act')]; } catch(_) { attrs = []; } return attrs.map(function(v){ return String(v || '').toLowerCase(); }).join(' '); }
  function isFilterControl(el){ if(!el || !el.matches) return false; if(el.matches('[data-acl-filter], .th-filter, .th-filter-select, #filterRow input, #filterRow select')) return true; if(el.closest('[data-acl-filter], .filters, .filtersBar, .filter-row, #filterRow, .toolbar-filters, .table-filters, .search-box, .searchbar')) return true; var text = controlText(el); if(/salv|save|adaug|add\b|edit|delete|sterg|șterg|remove|import|upload|submit|actualiz|update|sincron|sync|export|pdf|download|descarc/.test(text)) return false; return /filter|filtru|search|caut|căut|sort|luna|lună|an\b|year|month|operator|schimb|data|date|reper|utilaj|status/.test(text); }
  function requiredPermissionForControl(el){ if(!el || !el.matches || isFilterControl(el)) return ''; var text = controlText(el); if(el.matches('input[type="file"]') || /import|upload|incarc|încarc/.test(text)) return 'import'; if(/delete|sterg|șterg|remove|trash|cos|coș/.test(text)) return 'delete'; if(/export|download|descarc|pdf|excel|csv/.test(text)) return 'export'; if(/adaug|add\b|nou\b|new\b|plus/.test(text)) return 'add'; if(el.matches('input[type="submit"], button[type="submit"]')) return 'edit'; if(el.matches('[contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]')) return 'edit'; if(/salv|save|edit|actualiz|update|submit|sincron|sync|cloud.*save|salvează|trimite|run|ruleaz/.test(text)) return 'edit'; if(el.matches('input,textarea,select')) return 'edit'; return ''; }
  function permissionAllowed(required, permissions){ if(!required) return true; var canEdit = permissions && permissions.can_edit === true; var canAdd = permissions && permissions.can_add === true; var canDelete = permissions && permissions.can_delete === true; var canImport = permissions && (permissions.can_import === true || canEdit === true); var canExport = permissions && (permissions.can_export === true || canEdit === true); if(required === 'delete') return canDelete === true; if(required === 'import') return canImport === true; if(required === 'export') return canExport === true; if(required === 'add') return canAdd === true || canEdit === true; if(required === 'edit') return canEdit === true; return false; }
  function disableControl(el){ try { el.disabled = true; } catch(_) {} try { el.setAttribute('readonly','readonly'); } catch(_) {} try { el.setAttribute('aria-disabled','true'); } catch(_) {} try { el.setAttribute('data-kad-acl-disabled','1'); } catch(_) {} try { el.style.pointerEvents = 'none'; } catch(_) {} try { el.style.opacity = el.style.opacity || '.55'; } catch(_) {} }

  function applyReadonly(permissions){
    permissions = permissions || {};
    var canEdit = permissions.can_edit === true; var canAdd = permissions.can_add === true; var canDelete = permissions.can_delete === true; var canImport = permissions.can_import === true || canEdit === true; var canExport = permissions.can_export === true || canEdit === true;
    var effectivePermissions = Object.assign({}, permissions, { can_edit:canEdit, can_add:canAdd, can_delete:canDelete, can_import:canImport, can_export:canExport });
    window.__PAGE_ACCESS__ = effectivePermissions; window.__CAN_EDIT__ = canEdit === true;
    if(!canEdit) { try { document.documentElement.classList.add('kad-readonly', 'readonly'); } catch(_) {} }
    function lock(root){ var scope = root && root.querySelectorAll ? root : document; var nodes = scope.querySelectorAll('input, textarea, select, button, a, [role="button"], [contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]'); nodes.forEach(function(el){ if(isFilterControl(el)) return; var required = requiredPermissionForControl(el); if(required && !permissionAllowed(required, effectivePermissions)) disableControl(el); }); }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ lock(document); }, { once:true }); else lock(document);
    try { var obs = new MutationObserver(function(mutations){ mutations.forEach(function(m){ if(m.addedNodes) m.addedNodes.forEach(function(n){ if(n && n.nodeType === 1) lock(n); }); }); }); obs.observe(document.documentElement || document.body, { subtree:true, childList:true }); } catch(_) {}
    ['beforeinput','paste','drop','submit'].forEach(function(type){ document.addEventListener(type, function(event){ var target = event.target; if(target && isFilterControl(target)) return; var el = target && target.closest ? (target.closest('button, input, textarea, select, a, [role="button"], [contenteditable="true"], [data-rf-mutating], [data-mutating], [data-editable]') || target) : target; var required = requiredPermissionForControl(el); if(required && !permissionAllowed(required, effectivePermissions)){ event.preventDefault(); event.stopImmediatePropagation(); } }, true); });
    document.addEventListener('click', function(event){ var el = event.target && event.target.closest ? event.target.closest('button, input[type="button"], input[type="submit"], a, [role="button"], [data-rf-mutating], [data-mutating], [data-editable]') : null; if(!el || isFilterControl(el)) return; var required = requiredPermissionForControl(el); if(required && !permissionAllowed(required, effectivePermissions)){ event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  }

  async function main(){
    if(isAccessGate()) { markAllowed(); return; }
    markHidden(); installFetchGate();
    if(!readGateAccess()){ redirectToGate(); return; }
    if(isLogin()){ markAllowed(); return; }
    await ensureRuntime();
    var sb = createClient();
    var session = await runInternal(function(){ return getSession(sb); });
    if(!session || !session.user){ redirectToLogin(); return; }
    var pageKey = currentPageKey();
    var access = await runInternal(function(){ return resolveAccess(sb, session.user, pageKey); });
    window.__KAD_SECURITY_ACCESS__ = access;
    try { localStorage.setItem('rf_user_role', access.role || 'viewer'); sessionStorage.setItem('rf_user_role', access.role || 'viewer'); } catch(_) {}
    if(!access || access.allowed !== true){
      try { if(access && access.accountStatus && (access.accountStatus.is_banned || access.accountStatus.is_active === false)) await sb.auth.signOut(); } catch(_) {}
      renderDenied('Acces restricționat', access && access.message ? access.message : 'Nu ai acces în această pagină.');
      return;
    }
    applyReadonly(access.permissions || {});
    markAllowed();
  }

  window.KADSecurityGuard = { ready: state.readyPromise, getState: function(){ return { allowed:state.allowed, ready:state.ready, pageKey:currentPageKey() }; }, clearGateAccess: clearGateAccess };

  main().catch(function(err){
    try { console.error('KAD security guard', err); } catch(_) {}
    renderDenied('Acces blocat', (err && err.message) ? err.message : 'Nu am putut valida securitatea paginii.');
  });
})(window, document);
