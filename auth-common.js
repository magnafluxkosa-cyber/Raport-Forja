(function(){
  'use strict';

  const ADMIN_EMAIL = normalizeEmail(((window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {}).ADMIN_EMAIL) || '');
  const FORJA_CTC_OPERATOR_EMAIL = 'forja-ctc@forja.local';
  const DEBITARE_OPERATOR_EMAIL = 'debitare@pre.local';
  const STORAGE = {
    userId: 'rf_user_id',
    userEmail: 'rf_user_email',
    userRole: 'rf_user_role',
    loginAt: 'rf_login_at'
  };

  let supabaseClient = null;

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function isForjaCtcOperatorAccount(value){
    return normalizeEmail(value) === FORJA_CTC_OPERATOR_EMAIL;
  }

  function isDebitareOperatorAccount(value){
    return normalizeEmail(value) === DEBITARE_OPERATOR_EMAIL;
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeGetItem(key){
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSetItem(key, value){
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function safeRemoveItem(key){
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function readStoredConfig(){
    try {
      const raw = localStorage.getItem('erp_forja_config');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function readConfig(){
    const globalCfg = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
    const storedCfg = readStoredConfig() || {};

    const url = String(
      globalCfg.SUPABASE_URL ||
      globalCfg.supabaseUrl ||
      storedCfg.SUPABASE_URL ||
      storedCfg.supabaseUrl ||
      safeGetItem('ERP_SUPABASE_URL') ||
      ''
    ).trim();

    const anonKey = String(
      globalCfg.SUPABASE_ANON_KEY ||
      globalCfg.supabaseAnonKey ||
      storedCfg.SUPABASE_ANON_KEY ||
      storedCfg.supabaseAnonKey ||
      safeGetItem('ERP_SUPABASE_ANON_KEY') ||
      ''
    ).trim();

    return {
      url,
      anonKey,
      isConfigured: Boolean(url && anonKey && !/^PASTE_|^REPLACE_|^YOUR_/i.test(anonKey))
    };
  }

  function ensureSupabaseLibrary(){
    if(!window.supabase || typeof window.supabase.createClient !== 'function'){
      throw new Error('Biblioteca Supabase nu s-a încărcat.');
    }
  }

  const SESSION_REFRESH_AHEAD_MS = 5 * 60 * 1000;
  const SESSION_REFRESH_MIN_INTERVAL_MS = 20 * 1000;
  const registeredSessionClients = [];
  let lastSessionRefreshAt = 0;
  let sessionRefreshPromise = null;
  let globalCreateClientPatched = false;
  let sessionMaintenanceStarted = false;

  /* Egress guard: cache identical Supabase REST GET reads briefly in memory.
     ACL/security reads are cached only for a very short time, per user, and the cache is cleared after any write. */
  const REST_EGRESS_CACHE_MAX_ENTRIES = 160;
  const REST_EGRESS_CACHE_MAX_CHARS = 8 * 1024 * 1024;
  const restEgressCache = new Map();
  const restEgressInflight = new Map();
  const ROLE_CACHE_TTL_MS = 60 * 1000;
  const PERMISSION_MAP_CACHE_TTL_MS = 30 * 1000;
  const ACCOUNT_STATUS_CACHE_TTL_MS = 30 * 1000;
  const roleCache = new Map();
  const permissionMapCache = new Map();
  const accountStatusCache = new Map();

  function cacheGet(map, key){
    try{
      const item = map && map.get ? map.get(key) : null;
      if(!item) return null;
      if(item.expiresAt && item.expiresAt < Date.now()){ map.delete(key); return null; }
      return item.value;
    }catch(_e){ return null; }
  }

  function cacheSet(map, key, value, ttl){
    try{ if(map && map.set) map.set(key, { value:value, expiresAt:Date.now() + Number(ttl || 0) }); }catch(_e){}
    return value;
  }

  function clearRuntimeSecurityCaches(){
    try{ roleCache.clear(); permissionMapCache.clear(); accountStatusCache.clear(); }catch(_e){}
    try{ if(window.RF_ACL && typeof window.RF_ACL.clearCaches === 'function') window.RF_ACL.clearCaches(); }catch(_e){}
  }

  function getRequestMethod(input, init){
    return String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
  }

  function requestUrlString(input){
    return String((typeof input === 'string' ? input : (input && input.url)) || '');
  }

  function getHeaderValue(headers, name){
    const wanted = String(name || '').toLowerCase();
    if(!headers) return '';
    try{
      if(typeof headers.get === 'function') return String(headers.get(name) || headers.get(wanted) || '');
      if(Array.isArray(headers)){
        const found = headers.find(pair => Array.isArray(pair) && String(pair[0] || '').toLowerCase() === wanted);
        return found ? String(found[1] || '') : '';
      }
      const direct = headers[name] || headers[wanted] || headers[name.toLowerCase()] || '';
      return String(direct || '');
    }catch(_e){ return ''; }
  }

  function isSensitiveRestUrl(rawUrl){
    return /\/(profiles|rf_acl|page_permissions|user_page_permissions|field_permissions|user_account_access|user_index_visibility)(\?|$)/i.test(rawUrl);
  }

  function isShortLivedSecurityCacheUrl(rawUrl){
    return /\/(profiles|rf_acl|page_permissions|user_page_permissions|field_permissions|user_account_access|user_control_permissions|user_index_visibility)(\?|$)/i.test(rawUrl);
  }

  function shouldUseRestEgressCache(input, init){
    if(getRequestMethod(input, init) !== 'GET') return false;
    const rawUrl = requestUrlString(input);
    if(!/\/rest\/v1\//i.test(rawUrl)) return false;
    if(isShortLivedSecurityCacheUrl(rawUrl)) return true;
    if(isSensitiveRestUrl(rawUrl)) return false;
    return /\/(rf_documents|rf_helper_|helper_)/i.test(rawUrl);
  }

  function restEgressCacheTtl(rawUrl){
    if(/\/user_account_access/i.test(rawUrl)) return 60 * 1000;
    if(/\/(rf_acl|page_permissions|user_page_permissions|field_permissions|user_control_permissions|user_index_visibility)/i.test(rawUrl)) return 5 * 60 * 1000;
    if(/\/profiles/i.test(rawUrl)) return 5 * 60 * 1000;
    if(/\/rf_helper_|\/helper_/i.test(rawUrl)) return 5 * 60 * 1000;
    if(/\/rf_documents/i.test(rawUrl)) return 60 * 1000;
    return 30 * 1000;
  }

  function restEgressKey(input, init){
    const rawUrl = requestUrlString(input);
    const initHeaders = init && init.headers ? init.headers : null;
    const inputHeaders = input && input.headers ? input.headers : null;
    const range = getHeaderValue(initHeaders, 'range') || getHeaderValue(inputHeaders, 'range');
    const prefer = getHeaderValue(initHeaders, 'prefer') || getHeaderValue(inputHeaders, 'prefer');
    const userHint = [safeGetItem(STORAGE.userId), safeGetItem(STORAGE.userEmail)].filter(Boolean).join('|');
    return [userHint, rawUrl, range, prefer].join('::');
  }

  function trimRestEgressCache(){
    while(restEgressCache.size > REST_EGRESS_CACHE_MAX_ENTRIES){
      const first = restEgressCache.keys().next().value;
      if(first == null) break;
      restEgressCache.delete(first);
    }
  }

  function isSecurityPermissionMutationUrl(rawUrl){
    return /\/(profiles|rf_acl|page_permissions|user_page_permissions|field_permissions|user_account_access|user_control_permissions|user_index_visibility)(\?|$)/i.test(String(rawUrl || ''));
  }

  function clearRestEgressCache(rawUrl){
    try{ restEgressCache.clear(); restEgressInflight.clear(); }catch(_e){}
    if(!rawUrl || isSecurityPermissionMutationUrl(rawUrl)){
      clearRuntimeSecurityCaches();
    }
  }

  function responseFromRestInfo(info){
    return new Response(info.text || '', {
      status: info.status || 200,
      statusText: info.statusText || 'OK',
      headers: info.headers || []
    });
  }

  function getCachedRestResponse(key){
    const item = restEgressCache.get(key);
    if(!item) return null;
    if(item.expiresAt && item.expiresAt < Date.now()){
      restEgressCache.delete(key);
      return null;
    }
    return responseFromRestInfo(item);
  }

  async function cacheableRestInfo(response, rawUrl){
    try{
      if(!response || !response.ok || typeof response.clone !== 'function') return null;
      const contentType = getHeaderValue(response.headers, 'content-type');
      if(contentType && !/json/i.test(contentType)) return null;
      const text = await response.clone().text();
      if(text.length > REST_EGRESS_CACHE_MAX_CHARS) return null;
      return {
        text,
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers.entries ? response.headers.entries() : []),
        expiresAt: Date.now() + restEgressCacheTtl(rawUrl)
      };
    }catch(_e){ return null; }
  }

  function isMutatingRequest(input, init){
    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    return !['GET','HEAD','OPTIONS'].includes(method);
  }

  function shouldRefreshBeforeFetch(input, init){
    if(!isMutatingRequest(input, init)) return false;
    const rawUrl = String((typeof input === 'string' ? input : (input && input.url)) || '');
    return /\/rest\/v1\//i.test(rawUrl) || /\/functions\/v1\//i.test(rawUrl) || /\/storage\/v1\//i.test(rawUrl);
  }

  function shouldRetryAfterAuthFailure(input, init, response){
    if(!response || ![401,403].includes(Number(response.status))) return false;
    return shouldRefreshBeforeFetch(input, init);
  }

  async function ensureFreshSession(client, options){
    const settings = Object.assign({ force:false, redirect:false, next:getCurrentPageName() }, options || {});
    const sb = client || supabaseClient || null;
    if(!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return null;

    const now = Date.now();
    if(!settings.force && sessionRefreshPromise) return sessionRefreshPromise;
    if(!settings.force && now - lastSessionRefreshAt < SESSION_REFRESH_MIN_INTERVAL_MS){
      try{
        const current = await sb.auth.getSession();
        return current && current.data ? (current.data.session || null) : null;
      }catch(_e){ return null; }
    }

    sessionRefreshPromise = (async function(){
      try{
        const result = await sb.auth.getSession();
        let session = result && result.data ? (result.data.session || null) : null;
        if(!session || !session.user){
          clearUserState();
          if(settings.redirect) window.location.href = buildLoginUrl(settings.next || getCurrentPageName());
          return null;
        }

        const expiresAtMs = Number(session.expires_at || 0) ? Number(session.expires_at) * 1000 : 0;
        const needsRefresh = settings.force || !expiresAtMs || (expiresAtMs - Date.now() <= SESSION_REFRESH_AHEAD_MS);
        if(needsRefresh && typeof sb.auth.refreshSession === 'function'){
          const refreshed = await sb.auth.refreshSession();
          if(refreshed && refreshed.error) throw refreshed.error;
          session = refreshed && refreshed.data && refreshed.data.session ? refreshed.data.session : session;
        }

        if(session && session.user){
          const storedRole = safeGetItem(STORAGE.userRole) || 'viewer';
          persistUserState(session.user, storedRole);
        }
        lastSessionRefreshAt = Date.now();
        return session || null;
      }catch(err){
        try{ console.warn('ERPAuth session refresh failed', err); }catch(_e){}
        if(settings.redirect) window.location.href = buildLoginUrl(settings.next || getCurrentPageName());
        return null;
      }finally{
        sessionRefreshPromise = null;
      }
    })();

    return sessionRefreshPromise;
  }

  async function ensureFreshSessionOrRedirect(next){
    return ensureFreshSession(getSupabaseClient(), { force:true, redirect:true, next: next || getCurrentPageName() });
  }

  function makeSessionAwareFetch(client, originalFetch){
    const nativeFetch = originalFetch || (typeof fetch === 'function' ? fetch.bind(window) : null);
    if(!nativeFetch) return originalFetch;

    async function doFetch(input, init){
      if(shouldRefreshBeforeFetch(input, init)){
        await ensureFreshSession(client, { force:false, redirect:false });
      }
      let response = await nativeFetch(input, init);
      if(shouldRetryAfterAuthFailure(input, init, response)){
        const refreshed = await ensureFreshSession(client, { force:true, redirect:false });
        if(refreshed){
          try{ response = await nativeFetch(input, init); }catch(_e){}
        }
      }
      return response;
    }

    return async function(input, init){
      if(isMutatingRequest(input, init)) clearRestEgressCache(requestUrlString(input));
      if(!shouldUseRestEgressCache(input, init)) return doFetch(input, init);

      const key = restEgressKey(input, init);
      const cached = getCachedRestResponse(key);
      if(cached) return cached;

      if(restEgressInflight.has(key)){
        try{
          const existing = await restEgressInflight.get(key);
          if(existing && existing.info) return responseFromRestInfo(existing.info);
        }catch(_e){}
      }

      const rawUrl = requestUrlString(input);
      const pending = (async function(){
        const response = await doFetch(input, init);
        const info = await cacheableRestInfo(response, rawUrl);
        if(info){
          restEgressCache.set(key, info);
          trimRestEgressCache();
        }
        return { response, info };
      })();
      restEgressInflight.set(key, pending);
      try{
        const result = await pending;
        return result.response;
      }finally{
        restEgressInflight.delete(key);
      }
    };
  }

  function registerSessionClient(client){
    if(!client || registeredSessionClients.includes(client)) return client;
    registeredSessionClients.push(client);
    startSessionMaintenance();
    return client;
  }

  function startSessionMaintenance(){
    if(sessionMaintenanceStarted) return;
    sessionMaintenanceStarted = true;
    const refreshAll = function(force){
      registeredSessionClients.slice().forEach(function(client){
        try{ ensureFreshSession(client, { force: !!force, redirect:false }); }catch(_e){}
      });
    };
    window.addEventListener('focus', function(){ refreshAll(true); });
    window.addEventListener('pageshow', function(){ refreshAll(true); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) refreshAll(true); });
    window.setInterval(function(){ refreshAll(false); }, 2 * 60 * 1000);
  }

  function patchSupabaseCreateClient(){
    if(globalCreateClientPatched) return;
    if(!window.supabase || typeof window.supabase.createClient !== 'function') return;
    if(window.supabase.__erpSessionPatchApplied) return;
    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = function(url, key, options){
      const opts = Object.assign({}, options || {});
      opts.auth = Object.assign({ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }, opts.auth || {});
      if(!opts.auth.storage && window.KADStorageGuard && window.KADStorageGuard.authStorage){
        opts.auth.storage = window.KADStorageGuard.authStorage;
      }
      let clientRef = null;
      const originalGlobal = opts.global || {};
      const originalFetch = originalGlobal.fetch || (typeof fetch === 'function' ? fetch.bind(window) : null);
      opts.global = Object.assign({}, originalGlobal, {
        fetch: function(input, init){
          const activeClient = clientRef || supabaseClient;
          return makeSessionAwareFetch(activeClient, originalFetch)(input, init);
        }
      });
      clientRef = originalCreateClient(url, key, opts);
      registerSessionClient(clientRef);
      return clientRef;
    };
    window.supabase.__erpSessionPatchApplied = true;
    globalCreateClientPatched = true;
  }

  function getSupabaseClient(){
    if(supabaseClient){
      return supabaseClient;
    }

    ensureSupabaseLibrary();
    patchSupabaseCreateClient();
    const cfg = readConfig();

    if(!cfg.url){
      throw new Error('Lipsește SUPABASE_URL din supabase-config.js.');
    }

    if(!cfg.anonKey){
      throw new Error('Lipsește SUPABASE_ANON_KEY din supabase-config.js.');
    }

    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: (window.KADStorageGuard && window.KADStorageGuard.authStorage) ? window.KADStorageGuard.authStorage : undefined
      }
    });

    registerSessionClient(supabaseClient);
    return supabaseClient;
  }

  function persistUserState(user, role){
    if(!user){ return; }
    safeSetItem(STORAGE.userId, user.id || '');
    safeSetItem(STORAGE.userEmail, normalizeEmail(user.email || ''));
    safeSetItem(STORAGE.userRole, role || 'viewer');
    safeSetItem(STORAGE.loginAt, new Date().toISOString());
  }

  function clearUserState(){
    safeRemoveItem(STORAGE.userId);
    safeRemoveItem(STORAGE.userEmail);
    safeRemoveItem(STORAGE.userRole);
    safeRemoveItem(STORAGE.loginAt);
  }

  function readStoredRoleForUser(_user){
    return '';
  }

  async function maybeSelect(builder){
    try {
      const result = await builder;
      if(result && result.error){
        throw result.error;
      }
      return result ? result.data : null;
    } catch (_) {
      return null;
    }
  }


  function normalizePageKey(value){
    return String(value || '').trim().toLowerCase().replace(/\.html$/i, '');
  }

  function getCurrentPageKey(){
    try {
      const path = window.location.pathname || '';
      const name = path.split('/').pop() || '';
      return normalizePageKey(name || 'index.html');
    } catch (_) {
      return 'index';
    }
  }

  function shouldPrehideCurrentPage(){
    const pageKey = getCurrentPageKey();
    return Boolean(pageKey && !['login','index'].includes(pageKey));
  }

  function ensurePrehideStyle(){
    if(document.getElementById('rf-auth-prehide-style')) return;
    const style = document.createElement('style');
    style.id = 'rf-auth-prehide-style';
    style.textContent = '' +
      'html[data-rf-prehide="1"] body{visibility:hidden !important;}' +
      'html[data-rf-prehide="1"] body > *{visibility:hidden !important;}' +
      'html[data-rf-denied="1"] body{visibility:visible !important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function prehideProtectedPage(){
    if(!shouldPrehideCurrentPage()) return;
    ensurePrehideStyle();
    try { document.documentElement.setAttribute('data-rf-prehide', '1'); } catch (_) {}
  }

  function showProtectedPage(){
    try {
      document.documentElement.removeAttribute('data-rf-prehide');
      document.documentElement.removeAttribute('data-rf-denied');
    } catch (_) {}
  }


  function defaultPermissionsForRole(role){
    const cleanRole = String(role || 'viewer').toLowerCase();
    const canWrite = ['admin','editor','operator'].includes(cleanRole);
    return {
      can_view: true,
      can_add: canWrite,
      can_edit: canWrite,
      can_delete: cleanRole === 'admin' || cleanRole === 'editor',
      can_export: true,
      can_import: canWrite
    };
  }

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

  function pickLatestObject(rows, field){
    const list = Array.isArray(rows) ? rows.slice() : [];
    list.sort((a,b) => String((b && b.updated_at) || '').localeCompare(String((a && a.updated_at) || '')));
    for(const row of list){
      const value = row && row[field];
      if(value && typeof value === 'object') return value;
    }
    return null;
  }

  async function readLatestRfDocument(sb, docKey){
    try{
      const data = await maybeSelect(
        sb.from('rf_documents')
          .select('content,data,updated_at')
          .eq('doc_key', docKey)
          .order('updated_at', { ascending:false })
          .limit(1)
      );
      if(Array.isArray(data) && data.length){
        return pickLatestObject(data, 'content') || pickLatestObject(data, 'data') || null;
      }
    }catch(_e){}
    return null;
  }

  function autoPageLabelFromKey(key){
    const k = normalizePageKey(key);
    if(k === 'pontaj-sef-echipa') return 'Pontaj Șef Echipă';
    return String(k || '').replace(/-/g, ' ').replace(/\b\w/g, function(m){ return m.toUpperCase(); });
  }

  async function registerAutoPage(sb, pageKey){
    const key = normalizePageKey(pageKey);
    if(!sb || !key || ['login','index'].includes(key)) return;
    const stamp = new Date().toISOString();
    const sessionKey = 'rf_auto_page_registered:' + key;
    try { if(sessionStorage.getItem(sessionKey) === '1') return; } catch(_e) {}
    try{
      const existingRows = await maybeSelect(
        sb.from('rf_documents')
          .select('content,data,updated_at')
          .eq('doc_key', 'rf_auto_pages_v1')
          .order('updated_at', { ascending:false })
          .limit(1)
      );
      const current = Array.isArray(existingRows) && existingRows.length ? ((existingRows[0] && (existingRows[0].content || existingRows[0].data)) || {}) : {};
      const pages = Array.isArray(current.pages) ? current.pages.slice() : [];
      if(pages.some(function(p){ return normalizePageKey(p && (p.page_key || p.key)) === key; })){
        try { sessionStorage.setItem(sessionKey, '1'); } catch(_e) {}
        return;
      }
      pages.push({ page_key:key, label:autoPageLabelFromKey(key), href:key + '.html', group:'Pagini noi / automate', updated_at:stamp });
      const payload = { app:'RF_AUTO_PAGES', version:1, updated_at:stamp, pages:pages };
      const body = { doc_key:'rf_auto_pages_v1', content:payload, updated_at:stamp };
      try{ await sb.from('rf_documents').upsert(body, { onConflict:'doc_key' }); try { sessionStorage.setItem(sessionKey, '1'); } catch(_e) {} }catch(_e){}
    }catch(_e){}
  }

  async function loadUserPermissionMap(sb, user){
    const map = new Map();
    const email = normalizeEmail(user && user.email);
    const userId = String(user && user.id || '').trim();
    if(!sb || (!email && !userId)) return map;
    const cacheKey = 'permission-map:' + userId + ':' + email;
    const cachedMapEntries = cacheGet(permissionMapCache, cacheKey);
    if(Array.isArray(cachedMapEntries)) return new Map(cachedMapEntries);

    const pushRows = (rows) => {
      (Array.isArray(rows) ? rows : []).forEach(row => {
        const key = normalizePageKey(row && row.page_key);
        if(!key) return;
        map.set(key, buildPermissions(row));
      });
    };

    if(userId){
      pushRows(await maybeSelect(
        sb.from('user_page_permissions')
          .select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import')
          .eq('user_id', userId)
          .limit(5000)
      ));
    }

    if(email){
      pushRows(await maybeSelect(
        sb.from('user_page_permissions')
          .select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import')
          .eq('email', email)
          .limit(5000)
      ));
    }

    if(!map.size){
      const mirror = await readLatestRfDocument(sb, 'dashboard_acl_v1');
      const roots = [mirror && mirror.user_permissions, mirror && mirror.user_grants];
      roots.forEach(root => {
        if(!root || typeof root !== 'object' || !email || !root[email] || typeof root[email] !== 'object') return;
        Object.keys(root[email]).forEach(key => {
          const normalized = normalizePageKey(key);
          if(!normalized) return;
          map.set(normalized, buildPermissions(root[email][key]));
        });
      });
    }

    cacheSet(permissionMapCache, cacheKey, Array.from(map.entries()), PERMISSION_MAP_CACHE_TTL_MS);
    return map;
  }


  function publishPageAccess(access){
    try{
      if(access && typeof access === 'object'){
        const perms = access.permissions || access || {};
        access.can_view = perms.can_view === true || perms.canView === true || access.can_view === true || access.canView === true;
        access.can_edit = perms.can_edit === true || perms.canEdit === true || access.can_edit === true || access.canEdit === true;
        window.__PAGE_ACCESS__ = access;
        window.__CAN_VIEW__ = access.can_view === true;
        window.__CAN_EDIT__ = access.can_edit === true;
        const applyReadonly = function(){
          try{
            if(!document.body) return;
            const readonly = access.can_view === true && access.can_edit !== true;
            document.body.classList.toggle('readonly', readonly);
            document.documentElement.classList.toggle('readonly', readonly);
            document.body.setAttribute('data-can-view', access.can_view === true ? '1' : '0');
            document.body.setAttribute('data-can-edit', access.can_edit === true ? '1' : '0');
          }catch(_e){}
        };
        if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyReadonly, { once:true });
        else applyReadonly();
      }
    }catch(_e){}
    return access;
  }

  function renderAccessDeniedPage(pageKey, message){
    const safePage = String(pageKey || '').trim() || 'această pagină';
    const safeMessage = String(message || 'Nu ai acces în această pagină.');
    const mount = () => {
      if(!document.body) return false;
      try { document.documentElement.setAttribute('data-rf-denied', '1'); } catch (_) {}
      showProtectedPage();
      const outer = document.createElement('div');
      outer.setAttribute('style', 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;');
      const card = document.createElement('div');
      card.setAttribute('style', 'width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;');
      const h1 = document.createElement('div');
      h1.setAttribute('style', 'font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;');
      h1.textContent = 'Acces restricționat';
      const page = document.createElement('div');
      page.setAttribute('style', 'font-size:18px;font-weight:700;margin:0 0 10px;');
      page.textContent = safePage;
      const msg = document.createElement('div');
      msg.setAttribute('style', 'font-size:16px;line-height:1.5;margin:0 0 22px;');
      msg.textContent = safeMessage;
      const actions = document.createElement('div');
      actions.setAttribute('style', 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;');
      const back = document.createElement('a');
      back.href = 'index.html';
      back.setAttribute('style', 'text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;');
      back.textContent = 'Înapoi la dashboard';
      actions.appendChild(back);
      card.appendChild(h1);
      card.appendChild(page);
      card.appendChild(msg);
      card.appendChild(actions);
      outer.appendChild(card);
      document.body.replaceChildren(outer);
      return true;
    };
    if(!mount()){
      document.addEventListener('DOMContentLoaded', function once(){
        document.removeEventListener('DOMContentLoaded', once);
        mount();
      });
    }
  }

  async function tryRoleFromProfilesByUserId(sb, userId){
    const data = await maybeSelect(
      sb.from('profiles')
        .select('role,user_id,email')
        .eq('user_id', userId)
        .maybeSingle()
    );
    return data && data.role ? String(data.role).trim() : '';
  }

  async function tryRoleFromProfilesByLegacyId(sb, userId){
    const data = await maybeSelect(
      sb.from('profiles')
        .select('role,id,email')
        .eq('id', userId)
        .maybeSingle()
    );
    return data && data.role ? String(data.role).trim() : '';
  }

  async function tryRoleFromProfilesByEmail(sb, email){
    const data = await maybeSelect(
      sb.from('profiles')
        .select('role,user_id,email')
        .eq('email', email)
        .maybeSingle()
    );
    return data && data.role ? String(data.role).trim() : '';
  }

  async function tryRoleFromAcl(sb, email){
    const data = await maybeSelect(
      sb.from('rf_acl')
        .select('role,email')
        .eq('email', email)
        .maybeSingle()
    );
    return data && data.role ? String(data.role).trim() : '';
  }

  async function readRoleMirror(sb){
    const doc = await readLatestRfDocument(sb, 'acl_roles_v1');
    return doc && typeof doc === 'object' ? doc : null;
  }

  async function tryRoleFromMirror(sb, email){
    const doc = await readRoleMirror(sb);
    const roles = doc && doc.roles && typeof doc.roles === 'object' ? doc.roles : null;
    if(!roles){
      return '';
    }
    const byNormalized = roles[normalizeEmail(email)];
    return byNormalized ? String(byNormalized).trim() : '';
  }

  async function resolveUserRole(user){
    const email = normalizeEmail(user && user.email);
    if(!user){
      return 'viewer';
    }

    const sb = getSupabaseClient();
    const cacheKey = 'role:' + String(user.id || '').trim() + ':' + email;
    const cachedRole = cacheGet(roleCache, cacheKey);
    if(cachedRole) return cachedRole;

    if(window.RF_ACL && typeof window.RF_ACL.resolveRole === 'function'){
      try {
        const resolved = await window.RF_ACL.resolveRole(sb, user);
        const aclRole = String(resolved && resolved.role || '').trim().toLowerCase();
        if(['viewer','operator','editor','admin'].includes(aclRole)){
          cacheSet(roleCache, cacheKey, aclRole, ROLE_CACHE_TTL_MS);
          return aclRole;
        }
      } catch (_) {
        // continue with compatibility lookups
      }
    }

    const attempts = [
      () => tryRoleFromMirror(sb, email),
      () => tryRoleFromProfilesByUserId(sb, user.id),
      () => tryRoleFromProfilesByLegacyId(sb, user.id),
      () => tryRoleFromProfilesByEmail(sb, email),
      () => tryRoleFromAcl(sb, email)
    ];

    for(const attempt of attempts){
      try {
        const role = String(await attempt() || '').trim().toLowerCase();
        if(['viewer','operator','editor','admin'].includes(role)){
          cacheSet(roleCache, cacheKey, role, ROLE_CACHE_TTL_MS);
          return role;
        }
      } catch (_) {
        // fallback compat
      }
    }

    cacheSet(roleCache, cacheKey, 'viewer', ROLE_CACHE_TTL_MS);
    return 'viewer';
  }


  async function getAccountStatus(user){
    const email = normalizeEmail(user && user.email);
    const userId = String(user && user.id || '').trim();
    if(!user || (!email && !userId)){
      return { is_active:true, is_banned:false, note:'', ban_reason:'', updated_at:'' };
    }
    const cacheKey = 'account-status:' + userId + ':' + email;
    const cachedStatus = cacheGet(accountStatusCache, cacheKey);
    if(cachedStatus) return Object.assign({}, cachedStatus);

    function normalizeStatusRow(row){
      if(!row || typeof row !== 'object'){
        return null;
      }
      const note = String(row.note || row.ban_reason || '').trim();
      return {
        is_active: row.is_active !== false,
        is_banned: row.is_banned === true,
        note: note,
        ban_reason: note,
        email: normalizeEmail(row.email || email),
        user_id: String(row.user_id || userId || '').trim(),
        updated_at: String(row.updated_at || '').trim()
      };
    }

    function rowMatchesUser(row){
      if(!row) return false;
      const rowEmail = normalizeEmail(row.email);
      const rowUserId = String(row.user_id || '').trim();
      return (!!email && rowEmail === email) || (!!userId && rowUserId === userId);
    }

    function pickLatest(rows){
      let best = null;
      (Array.isArray(rows) ? rows : []).forEach(function(row){
        const normalized = normalizeStatusRow(row);
        if(!normalized || !rowMatchesUser(normalized)) return;
        const currentStamp = String(best && best.updated_at || '');
        const nextStamp = String(normalized.updated_at || '');
        if(!best || (nextStamp && nextStamp >= currentStamp)){
          best = normalized;
        }
      });
      return best;
    }

    try {
      const sb = getSupabaseClient();
      const candidates = [];
      if(userId){
        const byUserId = await maybeSelect(
          sb.from('user_account_access')
            .select('user_id,email,is_active,is_banned,note,updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending:false })
            .limit(50)
        );
        if(Array.isArray(byUserId)) candidates.push.apply(candidates, byUserId);
      }
      if(email){
        const byEmail = await maybeSelect(
          sb.from('user_account_access')
            .select('user_id,email,is_active,is_banned,note,updated_at')
            .eq('email', email)
            .order('updated_at', { ascending:false })
            .limit(50)
        );
        if(Array.isArray(byEmail)) candidates.push.apply(candidates, byEmail);
      }

      const mirror = await readLatestRfDocument(sb, 'user_account_access_v1');
      if(mirror && mirror.users && typeof mirror.users === 'object'){
        Object.keys(mirror.users).forEach(function(key){
          const row = mirror.users[key];
          const normalized = normalizeStatusRow(row || {});
          if(!normalized){
            return;
          }
          if(!normalized.email){
            normalized.email = normalizeEmail(key);
          }
          if(rowMatchesUser(normalized)){
            candidates.push(normalized);
          }
        });
      }

      const best = pickLatest(candidates);
      if(best){
        cacheSet(accountStatusCache, cacheKey, best, ACCOUNT_STATUS_CACHE_TTL_MS);
        return best;
      }
    } catch (_) {
      // fallback safe open when status source is unavailable
    }

    const defaultStatus = { is_active:true, is_banned:false, note:'', ban_reason:'', updated_at:'' };
    cacheSet(accountStatusCache, cacheKey, defaultStatus, ACCOUNT_STATUS_CACHE_TTL_MS);
    return defaultStatus;
  }

  async function getSession(){
    const sb = getSupabaseClient();
    const { data, error } = await sb.auth.getSession();
    if(error){
      throw error;
    }
    return data && data.session ? data.session : null;
  }

  async function getCurrentUserWithRole(){
    const session = await getSession();
    if(!session || !session.user){
      clearUserState();
      return null;
    }
    const currentEmail = normalizeEmail(session.user.email);
    const currentUserId = String(session.user.id || '').trim();
    const storedEmail = normalizeEmail(safeGetItem(STORAGE.userEmail));
    const storedUserId = String(safeGetItem(STORAGE.userId) || '').trim();
    if((storedEmail && currentEmail && storedEmail !== currentEmail) || (storedUserId && currentUserId && storedUserId !== currentUserId)){
      clearUserState();
    }
    const status = await getAccountStatus(session.user);
    const role = await resolveUserRole(session.user);
    persistUserState(session.user, role);

    return {
      session,
      user: session.user,
      role,
      accountStatus: status
    };
  }

  function getCurrentPageName(){
    try {
      const path = window.location.pathname || '';
      const name = path.split('/').pop();
      return name || 'index.html';
    } catch (_) {
      return 'index.html';
    }
  }

  function buildLoginUrl(next){
    const loginUrl = new URL('login.html', window.location.href);
    if(next){
      loginUrl.searchParams.set('next', next);
    }
    return loginUrl.toString();
  }

  async function requireAuth(options){
    const settings = Object.assign({
      redirectToLogin: true,
      next: getCurrentPageName()
    }, options || {});

    try {
      const authState = await getCurrentUserWithRole();
      if(authState){
        const currentPageKey = normalizePageKey(getCurrentPageName());
        if(isForjaCtcOperatorAccount(authState.user && authState.user.email)){
          const allowedForCtc = ['forja-ctc-pin','fisa-control-ctc-forja','rebut-pm-operatori'];
          const pinPageKey = 'forja-ctc-pin';
          const currentFileName = getCurrentPageName();
          if(allowedForCtc.indexOf(currentPageKey) === -1){
            window.location.href = 'forja-ctc-pin.html';
            return null;
          }
          if(currentPageKey !== pinPageKey){
            let unlockedPage = '';
            let unlockedUntil = 0;
            try {
              unlockedPage = normalizePageKey(sessionStorage.getItem('kad:forja-ctc:unlocked-page') || '');
              unlockedUntil = Number(sessionStorage.getItem('kad:forja-ctc:unlocked-until') || 0);
            } catch (_) {}
            if(unlockedPage !== currentPageKey || !unlockedUntil || unlockedUntil < Date.now()){
              const pinUrl = new URL('forja-ctc-pin.html', window.location.href);
              pinUrl.searchParams.set('next', currentFileName);
              window.location.href = pinUrl.toString();
              return null;
            }
          }
        }
        if(isDebitareOperatorAccount(authState.user && authState.user.email)){
          const allowedForDebitare = ['operator-debitare-pin','operator-debitare'];
          const pinPageKey = 'operator-debitare-pin';
          const currentFileName = getCurrentPageName();
          if(allowedForDebitare.indexOf(currentPageKey) === -1){
            window.location.href = 'operator-debitare-pin.html';
            return null;
          }
          if(currentPageKey !== pinPageKey){
            let unlockedOperator = '';
            let unlockedUntil = 0;
            try {
              const payload = JSON.parse(sessionStorage.getItem('kad:operator-debitare:unlock') || '{}');
              unlockedOperator = String(payload && payload.operator || '').trim();
              unlockedUntil = Number(payload && payload.until || 0);
            } catch (_) {}
            if(!unlockedOperator || !unlockedUntil || unlockedUntil < Date.now()){
              const pinUrl = new URL('operator-debitare-pin.html', window.location.href);
              pinUrl.searchParams.set('next', currentFileName);
              window.location.href = pinUrl.toString();
              return null;
            }
          }
        }
        const status = authState.accountStatus || {};
        const isBlocked = status.is_active === false || status.is_banned === true;
        if(isBlocked){
          const note = String(status.note || status.ban_reason || '').trim();
          const message = status.is_banned === true
            ? ('Contul tău este banat.' + (note ? ' Motiv: ' + note : ''))
            : ('Contul tău este blocat.' + (note ? ' Motiv: ' + note : ''));
          try {
            const sb = getSupabaseClient();
            await sb.auth.signOut();
          } catch (_) {}
          clearUserState();
          if(settings.redirectToLogin){
            const loginUrl = new URL(buildLoginUrl(settings.next));
            loginUrl.searchParams.set('account', status.is_banned === true ? 'banned' : 'blocked');
            if(note){
              loginUrl.searchParams.set('reason', note.slice(0, 300));
            }
            window.location.href = loginUrl.toString();
            return null;
          }
          renderAccessDeniedPage('Cont restricționat', message);
          return null;
        }
        return authState;
      }
    } catch (_) {
      clearUserState();
    }

    if(settings.redirectToLogin){
      window.location.href = buildLoginUrl(settings.next);
    }

    return null;
  }

  async function signOut(options){
    const settings = Object.assign({ redirectTo: 'login.html' }, options || {});

    try {
      const sb = getSupabaseClient();
      await sb.auth.signOut();
    } catch (_) {
      // ignore signout transport issues
    }

    clearUserState();
    window.location.href = settings.redirectTo;
  }

  function onAuthStateChange(callback){
    const sb = getSupabaseClient();
    return sb.auth.onAuthStateChange(callback);
  }

  function roleLabel(role){
    const map = {
      admin: 'Admin',
      editor: 'Editor',
      operator: 'Operator',
      viewer: 'Viewer'
    };
    return map[String(role || '').toLowerCase()] || (role || 'Viewer');
  }

  function roleClass(role){
    const clean = String(role || 'viewer').toLowerCase();
    return ['admin', 'editor', 'operator', 'viewer'].includes(clean) ? clean : 'viewer';
  }

  function canAccess(role, allowedRoles){
    if(!Array.isArray(allowedRoles) || !allowedRoles.length){
      return true;
    }
    return allowedRoles.includes(String(role || '').toLowerCase());
  }

  async function getPageAccess(pageKey, options){
    const settings = Object.assign({ pageKey: normalizePageKey(pageKey || getCurrentPageName()) }, options || {});
    let user = settings.user || null;
    let role = settings.role || '';

    if(!user){
      const authState = await getCurrentUserWithRole();
      user = authState && authState.user ? authState.user : null;
      role = role || (authState && authState.role ? authState.role : 'viewer');
    }

    if(user && !role){
      role = await resolveUserRole(user);
    }

    const cleanRole = String(role || 'viewer').toLowerCase();
    const fallbackPermissions = defaultPermissionsForRole(cleanRole);
    const ctcOperatorPermissions = { can_view:true, can_add:true, can_edit:true, can_delete:false, can_export:false, can_import:false };
    const deniedPermissions = { can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false };
    const sb = getSupabaseClient();
    await registerAutoPage(sb, settings.pageKey);

    let strictMap = null;
    if(user){
      strictMap = await loadUserPermissionMap(sb, user);
      if(strictMap && strictMap.size){
        const matched = strictMap.get(settings.pageKey);
        if(matched){
          return publishPageAccess({
            allowed: matched.can_view === true,
            user,
            role: cleanRole,
            permissions: matched,
            source: 'user_page_permissions strict',
            strictUserAcl: true,
            message: matched.can_view === true ? '' : 'Nu ai acces în această foaie. Cere acces de la admin.'
          });
        }
      }
    }

    if(user && isDebitareOperatorAccount(user.email)){
      const allowedForDebitare = ['operator-debitare-pin','operator-debitare'];
      const allowed = allowedForDebitare.indexOf(settings.pageKey) !== -1;
      const debitareOperatorPermissions = { can_view:true, can_add:true, can_edit:true, can_delete:false, can_export:true, can_import:false };
      return publishPageAccess({
        allowed: allowed,
        user,
        role: 'operator',
        permissions: allowed ? debitareOperatorPermissions : deniedPermissions,
        source: 'operator debitare locked account fallback',
        strictUserAcl: true,
        message: allowed ? '' : 'Contul Debitare are acces doar la foaia operator debitare sau la paginile acordate explicit în ACL.'
      });
    }
    if(user && isForjaCtcOperatorAccount(user.email)){
      const allowedForCtc = ['forja-ctc-pin','fisa-control-ctc-forja','rebut-pm-operatori'];
      const allowed = allowedForCtc.indexOf(settings.pageKey) !== -1;
      return publishPageAccess({
        allowed: allowed,
        user,
        role: 'operator',
        permissions: allowed ? ctcOperatorPermissions : deniedPermissions,
        source: 'forja-ctc locked account fallback',
        strictUserAcl: true,
        message: allowed ? '' : 'Contul Forja-CTC are acces doar la fișele operator dedicate sau la paginile acordate explicit în ACL.'
      });
    }

    if(user && strictMap && strictMap.size){
      return publishPageAccess({
        allowed: false,
        user,
        role: cleanRole,
        permissions: deniedPermissions,
        source: 'user_page_permissions strict missing',
        strictUserAcl: true,
        message: 'Nu ai acces în această foaie. Cere acces de la admin.'
      });
    }

    if(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function'){
      const access = await window.RF_ACL.resolvePageAccess(settings.pageKey, {
        client: sb,
        user,
        role
      });
      return publishPageAccess(Object.assign({ user, role: access && access.role ? access.role : cleanRole }, access || {}));
    }

    const openPage = ['login','index'].includes(settings.pageKey);
    return publishPageAccess({
      allowed: openPage ? fallbackPermissions.can_view === true : false,
      user,
      role: cleanRole,
      permissions: openPage ? fallbackPermissions : deniedPermissions,
      source: openPage ? 'open page fallback' : 'deny by default fallback',
      message: openPage ? '' : 'ACL indisponibil. Acces blocat preventiv.'
    });
  }

  try{ patchSupabaseCreateClient(); }catch(_e){}

  window.ERPAuth = {
    ADMIN_EMAIL,
    normalizeEmail,
    readConfig,
    getSupabaseClient,
    getSession,
    ensureFreshSession,
    ensureFreshSessionOrRedirect,
    getCurrentUserWithRole,
    resolveUserRole,
    getAccountStatus,
    persistUserState,
    clearUserState,
    requireAuth,
    signOut,
    onAuthStateChange,
    roleLabel,
    roleClass,
    canAccess,
    getPageAccess,

    getCurrentPagePermissions: function(){
      const access = window.__PAGE_ACCESS__ || {};
      const perms = access.permissions || access || {};
      return {
        can_view: perms.can_view === true || perms.canView === true,
        can_add: perms.can_add === true || perms.canAdd === true,
        can_edit: perms.can_edit === true || perms.canEdit === true,
        can_delete: perms.can_delete === true || perms.canDelete === true,
        can_export: perms.can_export === true || perms.canExport === true,
        can_import: perms.can_import === true || perms.canImport === true
      };
    },
    canAdd: function(){ return this.getCurrentPagePermissions().can_add === true; },
    canEdit: function(){ return this.getCurrentPagePermissions().can_edit === true; },
    canDelete: function(){ return this.getCurrentPagePermissions().can_delete === true; },
    canExport: function(){ return this.getCurrentPagePermissions().can_export === true; },
    canImport: function(){ return this.getCurrentPagePermissions().can_import === true; },
    guardAction: function(action){
      const p = this.getCurrentPagePermissions();
      const a = String(action || '').toLowerCase();
      if(a === 'add' || a === 'create' || a === 'new') return p.can_add === true;
      if(a === 'edit' || a === 'save' || a === 'update') return p.can_edit === true;
      if(a === 'delete' || a === 'remove' || a === 'sterge') return p.can_delete === true;
      if(a === 'export') return p.can_export === true;
      if(a === 'import' || a === 'upload') return p.can_import === true;
      return p.can_view === true;
    },
    buildLoginUrl,
    renderAccessDeniedPage,
    prehideProtectedPage,
    showProtectedPage,
    escapeHtml
  };
})();



(function(){
  'use strict';

  function pageIsReadonly(){
    try{
      if(window.__CAN_EDIT__ === false) return true;
      if(window.__PAGE_ACCESS__){
        const access = window.__PAGE_ACCESS__ || {};
        const perms = access.permissions || access || {};
        if(access.can_view === true && access.can_edit === false) return true;
        if(perms.can_view === true && perms.can_edit === false) return true;
        if(perms.canView === true && perms.canEdit === false) return true;
      }
      if(window.ERPAuth && typeof window.ERPAuth.getCurrentPagePermissions === 'function'){
        const p = window.ERPAuth.getCurrentPagePermissions();
        if(p.can_view === true && p.can_edit !== true) return true;
      }
      if(document.body && document.body.classList.contains('readonly')) return true;
      if(document.documentElement && document.documentElement.classList.contains('readonly')) return true;
    }catch(_e){}
    return false;
  }

  function hasMutatingHints(el){
    const s = [el.id, el.name, el.className, el.getAttribute('data-role'), el.getAttribute('data-acl'), el.getAttribute('aria-label'), el.textContent, el.value, el.placeholder]
      .map(v => String(v || '').toLowerCase()).join(' ');
    return /(save|salv|delete|sterg|remove|adaug|add|new|nou|edit|import|upload|sync|submit|actualize|update|pick|pdf|fisier|file|drop)/.test(s);
  }

  function isLikelyFilterControl(el){
    if(!el || !el.matches) return false;
    if(el.matches('[data-acl-filter], .th-filter, .th-filter-select, #filterRow input, #filterRow select')) return true;
    if(el.closest('[data-acl-filter], .filters, .filtersBar, .filter-row, #filterRow, .toolbar-filters, .table-filters, .search-box, .searchbar')) return true;
    const s = [el.id, el.name, el.className, el.getAttribute('data-role'), el.getAttribute('data-acl'), el.getAttribute('aria-label'), el.placeholder]
      .map(v => String(v || '').toLowerCase()).join(' ');
    if(hasMutatingHints(el)) return false;
    return /(filter|filtru|search|căut|caut|find|sort|reper|utilaj|luna|lună|an|year|month|operator|schimb|shift|data|date|transport|lada|ladă|matrita|matriță|cod|status|depart|prioritate|responsabil|stadiu|openonly|deschis)/.test(s);
  }

  function unlockReadonlyFilters(root){
    if(!pageIsReadonly()) return;
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = scope.querySelectorAll('input, select, textarea, button');
    nodes.forEach(function(el){
      if(!isLikelyFilterControl(el)) return;
      if(el.type === 'file' || el.type === 'hidden') return;
      try{ el.disabled = false; }catch(_e){}
      if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'){
        try{ if(!el.hasAttribute('readonly')) el.readOnly = false; }catch(_e){}
      }
      try{ el.style.pointerEvents = ''; }catch(_e){}
      try{ if(el.style.opacity === '0.45') el.style.opacity = ''; }catch(_e){}
      el.setAttribute('data-viewer-filter-enabled', '1');
    });
  }

  function installReadonlyFilterUnlock(){
    const run = function(root){ try{ unlockReadonlyFilters(root); }catch(_e){} };
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ run(document); }, { once:true });
    } else {
      run(document);
    }
    let obs = null;
    try{
      obs = new MutationObserver(function(mutations){
        for(const m of mutations){
          if(m.type === 'attributes' && m.target){ run(m.target.parentNode || document); }
          if(m.addedNodes && m.addedNodes.length){ m.addedNodes.forEach(function(n){ if(n && n.nodeType === 1) run(n); }); }
        }
      });
      obs.observe(document.documentElement || document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['disabled','class','style'] });
    }catch(_e){}
    window.setInterval(function(){ run(document); }, 800);
  }


  function isReadonlySafeAction(el){
    try{
      if(!el) return false;
      const s = [el.id, el.name, el.className, el.getAttribute('data-role'), el.getAttribute('data-acl'), el.getAttribute('aria-label'), el.textContent, el.value, el.placeholder]
        .map(v => String(v || '').toLowerCase()).join(' ');
      if(/(save|salv|delete|șterg|sterg|remove|adaug|add\b|new\b|nou\b|edit|import|upload|submit)/.test(s)) return false;
      return /(view|vizualiz|deschide|open|close|închide|inchide|dashboard|înapoi|inapoi|meniu|menu|refresh|reîncarc|reincarc|actualizeaz|actualizează|filter|filtru|search|căut|caut|export|pdf|listare|print|raport|fiș|fis)/.test(s);
    }catch(_e){}
    return false;
  }

  function installReadonlyEditBlocker(){
    function blockEvent(event){
      try{
        if(!pageIsReadonly()) return;
        const target = event.target;
        const el = target && target.closest ? target.closest('button,a,input,textarea,select,[contenteditable="true"],[role="button"],.btn,.primary-btn,.ghost-btn') : target;
        if(!el || isLikelyFilterControl(el) || isReadonlySafeAction(el)) return;
        const tag = String(el.tagName || '').toUpperCase();
        const type = String(el.type || '').toLowerCase();
        const acl = String(el.getAttribute && el.getAttribute('data-acl') || '').toLowerCase();
        const explicitMutatingAcl = /^(edit|save|delete|import|add)$/.test(acl);
        const explicitMutatingInput = el.matches && el.matches('[contenteditable="true"],input[type="file"],input[type="submit"],input[type="button"],[data-acl="edit"],[data-acl="save"],[data-acl="delete"],[data-acl="import"],[data-acl="add"]');
        const buttonOrLink = tag === 'BUTTON' || tag === 'A' || (el.matches && el.matches('[role="button"],.btn,.primary-btn,.ghost-btn'));
        const formEditControl = tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && !['search','button','submit','reset','checkbox','radio','hidden'].includes(type));
        const mutating = explicitMutatingAcl || explicitMutatingInput || hasMutatingHints(el) || (!buttonOrLink && formEditControl);
        if(!mutating) return;
        event.preventDefault();
        event.stopPropagation();
        if(event.stopImmediatePropagation) event.stopImmediatePropagation();
        return false;
      }catch(_e){}
    }
    ['click','submit','beforeinput','paste','drop','change'].forEach(function(name){
      try{ document.addEventListener(name, blockEvent, true); }catch(_e){}
    });
  }

  window.ERPAuth = window.ERPAuth || {};
  window.ERPAuth.unlockReadonlyFilters = unlockReadonlyFilters;
  installReadonlyFilterUnlock();
  installReadonlyEditBlocker();
})();

/* INDEX VISIBILITY SHARED SYNC */
(function(){
  'use strict';

  const STORAGE_KEY = 'rf_hidden_index_buttons';
  let started = false;
  let timer = null;
  let channel = null;
  let bc = null;
  let lastRun = 0;

  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }
  function nowMs(){ return Date.now ? Date.now() : new Date().getTime(); }
  function safeJsonParse(raw){ try { return raw ? JSON.parse(raw) : null; } catch(_) { return null; } }
  function safeSet(key, value){ try { localStorage.setItem(key, value); } catch(_) {} try { sessionStorage.setItem(key, value); } catch(_) {} }

  function safeIdFromEmail(email){
    const raw = String(email || '').trim();
    const at = raw.indexOf('@');
    return at > 0 ? raw.slice(0, at).toUpperCase() : raw.toUpperCase();
  }

  async function getUser(){
    try {
      if (!window.ERPAuth || typeof window.ERPAuth.getSession !== 'function') return null;
      const session = await window.ERPAuth.getSession();
      return session && session.user ? session.user : null;
    } catch(_) { return null; }
  }

  function rowMatchesUser(row, user){
    if (!row || !user) return false;
    const rowEmail = normalizeEmail(row.email);
    const rowUserId = String(row.user_id || '').trim();
    const email = normalizeEmail(user.email);
    const userId = String(user.id || '').trim();
    const localPart = email.includes('@') ? email.split('@')[0] : email;
    const displayId = safeIdFromEmail(email);
    const candidates = new Set([email, userId, localPart, displayId].map(v => String(v || '').trim().toLowerCase()).filter(Boolean));
    return (!!rowEmail && candidates.has(rowEmail)) || (!!rowUserId && candidates.has(rowUserId.toLowerCase()));
  }

  async function fetchHiddenButtonsForUser(user){
    if (!user || !window.ERPAuth || typeof window.ERPAuth.getSupabaseClient !== 'function') return [];
    const sb = window.ERPAuth.getSupabaseClient();
    const email = normalizeEmail(user.email);
    const userId = String(user.id || '').trim();
    const queries = [];
    if (email) queries.push(sb.from('user_index_visibility').select('email,user_id,hidden_buttons,updated_at').eq('email', email).order('updated_at', { ascending:false }).limit(20));
    if (userId) queries.push(sb.from('user_index_visibility').select('email,user_id,hidden_buttons,updated_at').eq('user_id', userId).order('updated_at', { ascending:false }).limit(20));
    let best = null;
    for (const query of queries){
      try {
        const res = await query;
        if (res && !res.error && Array.isArray(res.data) && res.data.length) {
          for (const row of res.data) {
            if (!rowMatchesUser(row, user)) continue;
            const stamp = String(row.updated_at || '');
            if (!best || stamp > String(best.updated_at || '')) best = row;
          }
        }
      } catch(_) {}
    }
    return best && Array.isArray(best.hidden_buttons) ? best.hidden_buttons.map(v => String(v || '').trim()).filter(Boolean) : [];
  }

  async function refreshHiddenIndexButtons(force){
    const now = nowMs();
    if (!force && now - lastRun < 300000) return;
    lastRun = now;
    const user = await getUser();
    if (!user) return;
    const hidden = await fetchHiddenButtonsForUser(user);
    const payload = {
      email: normalizeEmail(user.email || ''),
      user_id: String(user.id || '').trim(),
      hidden: Array.from(new Set((Array.isArray(hidden) ? hidden : []).map(v => String(v || '').trim()).filter(Boolean))),
      source: 'auth-common-sync',
      updated_at: new Date().toISOString()
    };
    safeSet(STORAGE_KEY, JSON.stringify(payload));
    try { window.dispatchEvent(new CustomEvent('rf-hidden-buttons-updated', { detail: payload })); } catch(_) {}
    try { if (bc) bc.postMessage({ type:'rf-index-visibility-updated', payload: payload }); } catch(_) {}
    return payload;
  }



  function isDashboardHref(rawHref){
    const href = String(rawHref || '').trim();
    if (!href) return false;
    if (href === '#' || href.toLowerCase().startsWith('javascript:')) return false;
    try {
      const url = new URL(href, window.location.href);
      const path = String(url.pathname || '').toLowerCase();
      if (path.endsWith('/index.html')) return true;
      if (path === '/' || path.endsWith('/raport-forja/') || path.endsWith('/raport-forja')) return true;
      return false;
    } catch(_) {
      const clean = href.split('#')[0].split('?')[0].toLowerCase();
      return clean === 'index.html' || clean === './index.html' || clean === '/index.html';
    }
  }

  async function syncBeforeDashboardNavigation(){
    try {
      await Promise.race([
        refreshHiddenIndexButtons(true),
        new Promise(resolve => setTimeout(resolve, 900))
      ]);
    } catch(_) {}
  }

  function installDashboardNavigationSync(){
    document.addEventListener('click', function(event){
      const link = event && event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!link) return;
      if (link.target && String(link.target).toLowerCase() === '_blank') return;
      if (event.defaultPrevented) return;
      if (event.button && event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const hrefAttr = link.getAttribute('href') || '';
      if (!isDashboardHref(hrefAttr)) return;
      event.preventDefault();
      const finalHref = link.href || hrefAttr;
      syncBeforeDashboardNavigation().finally(function(){
        try { window.location.href = finalHref; } catch(_) { window.location.assign(finalHref); }
      });
    }, true);
  }
  function start(){
    if (started) return;
    started = true;
    installDashboardNavigationSync();
    try { if ('BroadcastChannel' in window) { bc = new BroadcastChannel('rf-index-visibility'); } } catch(_) {}
    refreshHiddenIndexButtons(true);
    window.addEventListener('focus', () => { refreshHiddenIndexButtons(false); });
    window.addEventListener('pageshow', () => { refreshHiddenIndexButtons(false); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshHiddenIndexButtons(false); });
    timer = window.setInterval(() => { if (!document.hidden) refreshHiddenIndexButtons(false); }, 300000);
    try {
      const sb = window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function' ? window.ERPAuth.getSupabaseClient() : null;
      let realtimeEnabled = window.KAD_ENABLE_INDEX_VISIBILITY_REALTIME === true;
      try { realtimeEnabled = realtimeEnabled || localStorage.getItem('KAD_ENABLE_INDEX_VISIBILITY_REALTIME') === '1'; } catch(_) {}
      if (sb && realtimeEnabled) {
        channel = sb.channel('rf-shared-index-visibility')
          .on('postgres_changes', { event:'*', schema:'public', table:'user_index_visibility' }, async (payload) => {
            const user = await getUser();
            const row = payload && (payload.new || payload.old) ? (payload.new || payload.old) : null;
            if (!rowMatchesUser(row, user)) return;
            refreshHiddenIndexButtons(true);
          })
          .subscribe();
      }
    } catch(_) {}
  }

  if (window.ERPAuth) {
    const originalSignOut = window.ERPAuth.signOut;
    window.ERPAuth.refreshHiddenIndexButtons = refreshHiddenIndexButtons;
    window.ERPAuth.signOut = async function(options){
      try { if (timer) clearInterval(timer); } catch(_) {}
      try { if (channel && window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') window.ERPAuth.getSupabaseClient().removeChannel(channel); } catch(_) {}
      try { if (bc) bc.close(); } catch(_) {}
      try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
      try { sessionStorage.removeItem(STORAGE_KEY); } catch(_) {}
      return originalSignOut.call(this, options);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();


/* LIVE USER PRESENCE */
(function(){
  'use strict';

  const CHANNEL_NAME = 'rf-online-users';
  const HEARTBEAT_MS = 120000;
  let started = false;
  let channel = null;
  let timer = null;
  let lastSignature = '';
  let tabId = null;

  function getTabId(){
    if(tabId) return tabId;
    tabId = 'tab-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
    return tabId;
  }

  function normalizeEmail(value){ return String(value || '').trim().toLowerCase(); }

  function pageKey(){
    try {
      const path = window.location.pathname || '';
      const name = path.split('/').pop() || 'index.html';
      return String(name).replace(/\.html$/i, '').toLowerCase() || 'index';
    } catch (_) {
      return 'index';
    }
  }

  function pageHref(){
    try {
      const path = window.location.pathname || '';
      return path.split('/').pop() || 'index.html';
    } catch (_) {
      return 'index.html';
    }
  }

  async function getUser(){
    try {
      if(!window.ERPAuth || typeof window.ERPAuth.getSession !== 'function') return null;
      const session = await window.ERPAuth.getSession();
      return session && session.user ? session.user : null;
    } catch (_) {
      return null;
    }
  }

  function buildMeta(user){
    const email = normalizeEmail(user && user.email);
    const userId = String(user && user.id || '').trim();
    const key = pageKey();
    const href = pageHref();
    const title = String(document.title || key || href || '').trim();
    return {
      email: email,
      user_id: userId,
      page_key: key,
      page_href: href,
      page_title: title,
      tab_id: getTabId(),
      is_hidden: document.hidden === true,
      last_seen: new Date().toISOString()
    };
  }

  function signatureFor(meta){
    return [meta.email, meta.user_id, meta.page_key, meta.page_href, meta.tab_id, meta.is_hidden ? '1' : '0'].join('|');
  }

  async function trackNow(force){
    try {
      const user = await getUser();
      if(!user || !channel) return;
      const meta = buildMeta(user);
      const signature = signatureFor(meta);
      if(!force && signature === lastSignature && document.hidden === true) return;
      lastSignature = signature;
      await channel.track(meta);
    } catch (_) {}
  }

  async function untrackNow(){
    try {
      if(channel && typeof channel.untrack === 'function') {
        await channel.untrack();
      }
    } catch (_) {}
  }

  function isLivePresenceEnabled(){
    try {
      if(window.KAD_ENABLE_LIVE_PRESENCE === true) return true;
      if(window.localStorage && window.localStorage.getItem('KAD_ENABLE_LIVE_PRESENCE') === '1') return true;
    } catch (_) {}
    return false;
  }

  async function start(){
    if(started) return;
    // Monitorizarea live a utilizatorilor este oprită implicit.
    // Se reactivează doar explicit cu window.KAD_ENABLE_LIVE_PRESENCE=true
    // sau localStorage.KAD_ENABLE_LIVE_PRESENCE='1'.
    if(!isLivePresenceEnabled()) return;
    started = true;
    try {
      if(!window.ERPAuth || typeof window.ERPAuth.getSupabaseClient !== 'function') return;
      const user = await getUser();
      if(!user) return;
      const sb = window.ERPAuth.getSupabaseClient();
      const presenceKey = normalizeEmail(user.email) || String(user.id || '') || getTabId();
      channel = sb.channel(CHANNEL_NAME, { config: { presence: { key: presenceKey } } });
      channel.subscribe(async function(status){
        if(status === 'SUBSCRIBED'){
          await trackNow(true);
          try { if(timer) clearInterval(timer); } catch (_) {}
          timer = window.setInterval(function(){ trackNow(false); }, HEARTBEAT_MS);
        }
      });

      window.addEventListener('focus', function(){ trackNow(true); });
      window.addEventListener('pageshow', function(){ trackNow(true); });
      document.addEventListener('visibilitychange', function(){ trackNow(true); });
      window.addEventListener('pagehide', function(){ untrackNow(); });
      window.addEventListener('beforeunload', function(){ untrackNow(); });
    } catch (_) {}
  }

  function stop(){
    try { if(timer) clearInterval(timer); } catch (_) {}
    timer = null;
    untrackNow();
    try {
      if(channel && window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
        window.ERPAuth.getSupabaseClient().removeChannel(channel);
      }
    } catch (_) {}
    channel = null;
    started = false;
  }

  if(window.ERPAuth){
    const originalSignOut = window.ERPAuth.signOut;
    window.ERPAuth.stopLivePresence = stop;
    window.ERPAuth.startLivePresence = start;
    window.ERPAuth.signOut = async function(options){
      stop();
      return originalSignOut.call(this, options);
    };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();

/* ACCOUNT STATUS LIVE ENFORCER */
(function(){
  'use strict';

  let timer = null;
  let running = false;
  let lastCheckAt = 0;
  const ACCOUNT_STATUS_CHECK_MIN_MS = 300000;

  async function checkNow(force){
    const now = Date.now();
    if(!force && now - lastCheckAt < ACCOUNT_STATUS_CHECK_MIN_MS) return;
    lastCheckAt = now;
    try {
      if(!window.ERPAuth || typeof window.ERPAuth.getCurrentUserWithRole !== 'function') return;
      const authState = await window.ERPAuth.getCurrentUserWithRole();
      if(!authState || !authState.user) return;
      const status = authState.accountStatus || {};
      if(status.is_banned === true || status.is_active === false){
        const note = String(status.note || status.ban_reason || '').trim();
        const loginUrl = new URL(window.ERPAuth.buildLoginUrl(window.location.pathname.split('/').pop() || 'index.html'), window.location.href);
        loginUrl.searchParams.set('account', status.is_banned === true ? 'banned' : 'blocked');
        if(note) loginUrl.searchParams.set('reason', note.slice(0, 300));
        try { await window.ERPAuth.signOut({ redirectTo: loginUrl.toString() }); } catch (_) { window.location.href = loginUrl.toString(); }
      }
    } catch (_) {}
  }

  function start(){
    if(running) return;
    running = true;
    checkNow(true);
    timer = window.setInterval(function(){ checkNow(false); }, ACCOUNT_STATUS_CHECK_MIN_MS);
    window.addEventListener('focus', function(){ checkNow(false); });
    document.addEventListener('visibilitychange', function(){ if(document.hidden !== true) checkNow(false); });
  }

  function stop(){
    try { if(timer) clearInterval(timer); } catch (_) {}
    timer = null;
    running = false;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
