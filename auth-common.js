(function(){
  'use strict';

  const ADMIN_EMAIL = 'forja.editor@gmail.com';
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

  function getSupabaseClient(){
    if(supabaseClient){
      return supabaseClient;
    }

    ensureSupabaseLibrary();
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
        detectSessionInUrl: true
      }
    });

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
          .limit(50)
      );
      if(Array.isArray(data) && data.length){
        return pickLatestObject(data, 'content') || pickLatestObject(data, 'data') || null;
      }
    }catch(_e){}
    return null;
  }

  async function loadUserPermissionMap(sb, user){
    const map = new Map();
    const email = normalizeEmail(user && user.email);
    const userId = String(user && user.id || '').trim();
    if(!sb || (!email && !userId)) return map;

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
          .ilike('email', email)
          .limit(5000)
      ));
    }

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

    return map;
  }

  function renderAccessDeniedPage(pageKey, message){
    const safePage = String(pageKey || '').trim() || 'această pagină';
    const safeMessage = String(message || 'Nu ai acces în această pagină.');
    const mount = () => {
      if(!document.body) return false;
      try { document.documentElement.setAttribute('data-rf-denied', '1'); } catch (_) {}
      showProtectedPage();
      document.body.innerHTML = '' +
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;">' +
          '<div style="width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;">' +
            '<div style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;">Acces restricționat</div>' +
            '<div style="font-size:18px;font-weight:700;margin:0 0 10px;">' + safePage + '</div>' +
            '<div style="font-size:16px;line-height:1.5;margin:0 0 22px;">' + safeMessage + '</div>' +
            '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
              '<a href="index.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;">Înapoi la dashboard</a>' +
            '</div>' +
          '</div>' +
        '</div>';
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
      return safeGetItem(STORAGE.userRole) || 'viewer';
    }

    if(email === ADMIN_EMAIL){
      return 'admin';
    }

    const sb = getSupabaseClient();
    const attempts = [
      () => tryRoleFromMirror(sb, email),
      () => tryRoleFromProfilesByUserId(sb, user.id),
      () => tryRoleFromProfilesByLegacyId(sb, user.id),
      () => tryRoleFromProfilesByEmail(sb, email),
      () => tryRoleFromAcl(sb, email)
    ];

    for(const attempt of attempts){
      try {
        const role = await attempt();
        if(role){
          return role;
        }
      } catch (_) {
        // fallback compat
      }
    }

    return safeGetItem(STORAGE.userRole) || 'viewer';
  }


  async function getAccountStatus(user){
    const email = normalizeEmail(user && user.email);
    const userId = String(user && user.id || '').trim();
    if(!user || (!email && !userId)){
      return { is_active:true, is_banned:false, note:'', ban_reason:'' };
    }

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
        user_id: String(row.user_id || userId || '').trim()
      };
    }

    try {
      const sb = getSupabaseClient();
      if(userId){
        const byUserId = await maybeSelect(
          sb.from('user_account_access')
            .select('user_id,email,is_active,is_banned,note')
            .eq('user_id', userId)
            .maybeSingle()
        );
        const normalizedByUserId = normalizeStatusRow(byUserId);
        if(normalizedByUserId){
          return normalizedByUserId;
        }
      }
      if(email){
        const byEmail = await maybeSelect(
          sb.from('user_account_access')
            .select('user_id,email,is_active,is_banned,note')
            .ilike('email', email)
            .maybeSingle()
        );
        const normalizedByEmail = normalizeStatusRow(byEmail);
        if(normalizedByEmail){
          return normalizedByEmail;
        }
      }

      const mirror = await readLatestRfDocument(sb, 'user_account_access_v1');
      if(mirror && mirror.users && typeof mirror.users === 'object'){
        const direct = normalizeStatusRow(mirror.users[email] || mirror.users[userId] || null);
        if(direct){
          return direct;
        }
        const entries = Object.keys(mirror.users);
        for(let i = 0; i < entries.length; i += 1){
          const key = entries[i];
          const row = mirror.users[key];
          const rowEmail = normalizeEmail(row && row.email);
          const rowUserId = String(row && row.user_id || '').trim();
          if((email && rowEmail === email) || (userId && rowUserId === userId)){
            const normalizedMirror = normalizeStatusRow(row);
            if(normalizedMirror){
              return normalizedMirror;
            }
          }
        }
      }
    } catch (_) {
      // fallback safe open when status source is unavailable
    }

    return { is_active:true, is_banned:false, note:'', ban_reason:'' };
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
    const sb = getSupabaseClient();

    if(user && normalizeEmail(user.email) !== ADMIN_EMAIL){
      const strictMap = await loadUserPermissionMap(sb, user);
      if(strictMap && strictMap.size){
        const matched = strictMap.get(settings.pageKey) || { can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false };
        return {
          allowed: matched.can_view === true,
          user,
          role: cleanRole,
          permissions: matched,
          source: 'user_page_permissions strict',
          strictUserAcl: true,
          message: matched.can_view === true ? '' : 'Nu ai acces în această foaie. Cere acces de la admin.'
        };
      }
    }

    if(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function'){
      const access = await window.RF_ACL.resolvePageAccess(settings.pageKey, {
        client: sb,
        user,
        role
      });
      return Object.assign({ user, role: access && access.role ? access.role : cleanRole }, access || {});
    }

    return { allowed:true, user, role:cleanRole, permissions:fallbackPermissions, source:'role fallback' };
  }

  window.ERPAuth = {
    ADMIN_EMAIL,
    normalizeEmail,
    readConfig,
    getSupabaseClient,
    getSession,
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
    buildLoginUrl,
    renderAccessDeniedPage
  };
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
    if (!force && now - lastRun < 1200) return;
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
    window.addEventListener('focus', () => { refreshHiddenIndexButtons(true); });
    window.addEventListener('pageshow', () => { refreshHiddenIndexButtons(true); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshHiddenIndexButtons(true); });
    timer = window.setInterval(() => { if (!document.hidden) refreshHiddenIndexButtons(false); }, 2500);
    try {
      const sb = window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function' ? window.ERPAuth.getSupabaseClient() : null;
      if (sb) {
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
  const HEARTBEAT_MS = 25000;
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

  async function start(){
    if(started) return;
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
    window.ERPAuth.signOut = async function(options){
      stop();
      return originalSignOut.call(this, options);
    };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
