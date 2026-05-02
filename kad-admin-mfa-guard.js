(function(window, document){
  'use strict';

  var HIDE_ATTR = 'data-kad-admin-mfa-pending';
  var LOGIN_PAGE = 'login.html';
  var MFA_SETUP_PAGE = 'mfa-setup.html';
  var MFA_VERIFY_PAGE = 'mfa-verify.html';
  var EXCLUDED = {
    'login.html': true,
    'access-gate.html': true,
    'mfa-setup.html': true,
    'mfa-verify.html': true
  };

  function currentFile(){
    var file = String(window.location.pathname || '').split('/').pop() || 'index.html';
    return file || 'index.html';
  }

  if(EXCLUDED[currentFile()]) return;

  function ensureStyle(){
    if(document.getElementById('kad-admin-mfa-guard-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-admin-mfa-guard-style';
    style.textContent = 'html[' + HIDE_ATTR + '="1"] body{visibility:hidden!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function hidePage(){
    ensureStyle();
    try { document.documentElement.setAttribute(HIDE_ATTR, '1'); } catch(_) {}
  }

  function showPage(){
    try { document.documentElement.removeAttribute(HIDE_ATTR); } catch(_) {}
  }

  function redirect(page, params){
    var url = new URL(page, window.location.href);
    Object.keys(params || {}).forEach(function(key){
      if(params[key] !== undefined && params[key] !== null && params[key] !== ''){
        url.searchParams.set(key, String(params[key]));
      }
    });
    try { window.location.replace(url.toString()); }
    catch(_) { window.location.href = url.toString(); }
  }

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function getCfg(){
    return {
      url: window.RF_CONFIG && (window.RF_CONFIG.SUPABASE_URL || window.RF_CONFIG.supabaseUrl) || window.RF_SUPABASE_URL || 'https://addlybnigrywqowpbhvd.supabase.co',
      key: window.RF_CONFIG && (window.RF_CONFIG.SUPABASE_ANON_KEY || window.RF_CONFIG.supabaseAnonKey) || window.RF_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4'
    };
  }

  function createClient(){
    if(!window.supabase || typeof window.supabase.createClient !== 'function'){
      throw new Error('Biblioteca Supabase nu este încărcată.');
    }
    var cfg = getCfg();
    return window.supabase.createClient(cfg.url, cfg.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  async function resolveRole(sb, user){
    if(!user || !user.id) return 'viewer';
    var email = normalizeEmail(user.email);
    var attempts = [
      function(){ return sb.from('profiles').select('role,email,user_id').eq('user_id', user.id).maybeSingle(); },
      function(){ return sb.from('profiles').select('role,email,id').eq('id', user.id).maybeSingle(); },
      function(){ return sb.from('profiles').select('role,email').eq('email', email).maybeSingle(); },
      function(){ return sb.from('rf_acl').select('role,email').eq('email', email).maybeSingle(); }
    ];

    for(var i=0; i<attempts.length; i+=1){
      try {
        var res = await attempts[i]();
        var role = String(res && res.data && res.data.role || '').trim().toLowerCase();
        if(role) return role;
      } catch(_) {}
    }
    return 'viewer';
  }

  async function getVerifiedTotpFactors(sb){
    if(!sb || !sb.auth || !sb.auth.mfa) return [];
    var factors = await sb.auth.mfa.listFactors();
    if(factors.error) throw factors.error;
    var list = factors.data && Array.isArray(factors.data.totp) ? factors.data.totp : [];
    return list.filter(function(factor){
      return String(factor && factor.status || '').toLowerCase() === 'verified';
    });
  }

  async function getCurrentAal(sb){
    if(!sb || !sb.auth || !sb.auth.mfa || typeof sb.auth.mfa.getAuthenticatorAssuranceLevel !== 'function') return '';
    var aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aal.error) throw aal.error;
    return String(aal.data && aal.data.currentLevel || '').toLowerCase();
  }

  async function run(){
    hidePage();
    var next = currentFile();
    var sb = createClient();
    var sessionResult = await sb.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;

    if(!session || !session.user){
      redirect(LOGIN_PAGE, { next: next });
      return;
    }

    var role = await resolveRole(sb, session.user);
    if(role !== 'admin'){
      showPage();
      return;
    }

    var verifiedFactors = await getVerifiedTotpFactors(sb);
    if(!verifiedFactors.length){
      redirect(MFA_SETUP_PAGE, { next: next });
      return;
    }

    var currentAal = await getCurrentAal(sb);
    if(currentAal !== 'aal2'){
      redirect(MFA_VERIFY_PAGE, { next: next });
      return;
    }

    showPage();
  }

  run().catch(function(error){
    console.error('Admin MFA guard error:', error);
    redirect(LOGIN_PAGE, { next: currentFile(), mfa_error: '1' });
  });
})(window, document);
