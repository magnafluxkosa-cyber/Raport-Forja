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
    const tryContent = async () => {
      const data = await maybeSelect(
        sb.from('rf_documents')
          .select('content')
          .eq('doc_key', 'acl_roles_v1')
          .maybeSingle()
      );
      return data && data.content && typeof data.content === 'object' ? data.content : null;
    };

    const tryData = async () => {
      const data = await maybeSelect(
        sb.from('rf_documents')
          .select('data')
          .eq('doc_key', 'acl_roles_v1')
          .maybeSingle()
      );
      return data && data.data && typeof data.data === 'object' ? data.data : null;
    };

    return (await tryContent()) || (await tryData()) || null;
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
    const settings = Object.assign({ pageKey: pageKey || getCurrentPageName().replace(/\.html$/i, '') }, options || {});
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

    if(window.RF_ACL && typeof window.RF_ACL.resolvePageAccess === 'function'){
      const access = await window.RF_ACL.resolvePageAccess(settings.pageKey, {
        client: getSupabaseClient(),
        user,
        role
      });
      return Object.assign({ user, role: access && access.role ? access.role : (role || 'viewer') }, access || {});
    }

    const cleanRole = String(role || 'viewer').toLowerCase();
    const canWrite = ['admin','editor','operator'].includes(cleanRole);
    const permissions = {
      can_view: true,
      can_add: canWrite,
      can_edit: canWrite,
      can_delete: cleanRole === 'admin' || cleanRole === 'editor',
      can_export: true,
      can_import: canWrite
    };
    return { allowed:true, user, role:cleanRole, permissions, source:'role fallback' };
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
    buildLoginUrl
  };
})();


/* OPEN ACCESS RESET OVERRIDE */
(function(){
  'use strict';
  var A = window.ERPAuth || {};
  function stripUi(root){
    var scope = root && root.querySelectorAll ? root : document;
    try { scope.querySelectorAll('a[href="helper.html"],a[href="helper-acl.html"],[data-page-key="helper-acl"],[data-rf-control="nav.helper-acl"]').forEach(function(el){ el.remove(); }); } catch(_) {}
    try { scope.querySelectorAll('#chipRole,#roleChip,#roleText,#roleStatus,#roleSub,[id*="roleLabel" i],[class*="roleLabel" i],[id*="chipRole" i]').forEach(function(el){ el.style.display='none'; }); } catch(_) {}
    try {
      var walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue) continue;
        if (node.nodeValue.indexOf('Cont:') >= 0) node.nodeValue = node.nodeValue.replace(/\bCont:\s*/g, '');
        if (node.nodeValue.indexOf('Rol:') >= 0) node.nodeValue = node.nodeValue.replace(/\bRol:\s*/g, '');
      }
    } catch(_) {}
  }
  async function openUser(){
    try {
      var session = await (A.getSession ? A.getSession() : null);
      var user = session && session.user ? session.user : null;
      if (!user && A.getSupabaseClient) {
        var res = await A.getSupabaseClient().auth.getSession();
        user = res && res.data && res.data.session ? res.data.session.user : null;
      }
      if (!user) return null;
      return { user:user, role:'admin' };
    } catch(_) { return null; }
  }
  A.resolveUserRole = async function(){ return 'admin'; };
  A.getCurrentUserWithRole = openUser;
  A.getAccountStatus = async function(){ return { is_active:true, is_banned:false, ban_reason:null, note:null }; };
  A.roleLabel = function(){ return ''; };
  A.roleClass = function(){ return ''; };
  A.canAccess = function(){ return true; };
  A.getPageAccess = async function(pageKey, options){
    var auth = options && options.user ? { user: options.user, role:'admin' } : await openUser();
    return {
      allowed: !!(auth && auth.user),
      user: auth ? auth.user : null,
      role: 'admin',
      permissions: { can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true, can_filter:true },
      source: 'open access'
    };
  };
  window.ERPAuth = A;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ stripUi(document); }, { once:true });
  } else { stripUi(document); }
  try {
    var obs = new MutationObserver(function(){ stripUi(document); });
    obs.observe(document.documentElement, { childList:true, subtree:true });
  } catch(_) {}
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

  function start(){
    if (started) return;
    started = true;
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
