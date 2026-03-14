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
      () => tryRoleFromProfilesByUserId(sb, user.id),
      () => tryRoleFromProfilesByLegacyId(sb, user.id),
      () => tryRoleFromProfilesByEmail(sb, email),
      () => tryRoleFromAcl(sb, email),
      () => tryRoleFromMirror(sb, email)
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

    const role = await resolveUserRole(session.user);
    persistUserState(session.user, role);

    return {
      session,
      user: session.user,
      role
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

  window.ERPAuth = {
    ADMIN_EMAIL,
    normalizeEmail,
    readConfig,
    getSupabaseClient,
    getSession,
    getCurrentUserWithRole,
    resolveUserRole,
    persistUserState,
    clearUserState,
    requireAuth,
    signOut,
    onAuthStateChange,
    roleLabel,
    roleClass,
    canAccess,
    buildLoginUrl
  };
})();
