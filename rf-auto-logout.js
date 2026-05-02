(function(){
  'use strict';

  if (window.__KAD_AUTO_LOGOUT_LOADED__) return;
  window.__KAD_AUTO_LOGOUT_LOADED__ = true;

  var PAGE = String((location.pathname.split('/').pop() || '').toLowerCase());
  var EXCLUDED = {
    'access-gate.html': true,
    'login.html': true,
    'mfa-setup.html': true,
    'mfa-verify.html': true,
    'kad_system_presentation.html': true
  };
  if (EXCLUDED[PAGE]) return;

  var IDLE_LIMIT_MS = 15 * 60 * 1000;
  var WARNING_MS = 60 * 1000;
  var CHECK_EVERY_MS = 1000;
  var ACTIVITY_WRITE_THROTTLE_MS = 5000;

  var LAST_ACTIVITY_KEY = 'kad_auto_logout_last_activity';
  var LOGOUT_SIGNAL_KEY = 'kad_auto_logout_signal';
  var DISABLED_KEY = 'kad_auto_logout_disabled';
  var GATE_KEYS = [
    'rf_project_gate_access',
    'rf_project_gate_access_session',
    'rf_project_gate_token',
    'rf_project_gate_token_session'
  ];

  var warningVisible = false;
  var loggedOut = false;
  var overlay = null;
  var countdownNode = null;
  var lastWrite = 0;

  function now(){ return Date.now(); }

  function safeGet(key){
    try { return localStorage.getItem(key); } catch(_) { return null; }
  }

  function safeSet(key, value){
    try { localStorage.setItem(key, value); } catch(_) {}
  }

  function safeRemove(key){
    try { localStorage.removeItem(key); } catch(_) {}
    try { sessionStorage.removeItem(key); } catch(_) {}
  }

  function autoLogoutDisabled(){
    return safeGet(DISABLED_KEY) === '1';
  }

  function getLang(){
    try {
      var v = localStorage.getItem('kad_language') || localStorage.getItem('rf_language') || document.documentElement.getAttribute('lang') || 'ro';
      v = String(v || 'ro').toLowerCase();
      if (v.indexOf('en') === 0) return 'en';
      if (v.indexOf('fr') === 0) return 'fr';
      if (v.indexOf('it') === 0) return 'it';
      if (v.indexOf('de') === 0) return 'de';
      if (v.indexOf('hu') === 0) return 'hu';
    } catch(_) {}
    return 'ro';
  }

  function text(){
    var l = getLang();
    var map = {
      ro: {
        title: 'Sesiune inactivă',
        body: 'Ai fost inactiv. Vei fi delogat automat.',
        remain: 'Timp rămas:',
        stay: 'Rămân logat',
        logout: 'Delogare acum'
      },
      en: {
        title: 'Inactive session',
        body: 'You have been inactive. You will be logged out automatically.',
        remain: 'Time remaining:',
        stay: 'Stay logged in',
        logout: 'Logout now'
      },
      fr: {
        title: 'Session inactive',
        body: 'Vous êtes inactif. Vous serez déconnecté automatiquement.',
        remain: 'Temps restant :',
        stay: 'Rester connecté',
        logout: 'Déconnexion maintenant'
      },
      it: {
        title: 'Sessione inattiva',
        body: 'Sei inattivo. Verrai disconnesso automaticamente.',
        remain: 'Tempo restante:',
        stay: 'Rimani connesso',
        logout: 'Disconnetti ora'
      },
      de: {
        title: 'Inaktive Sitzung',
        body: 'Sie waren inaktiv. Sie werden automatisch abgemeldet.',
        remain: 'Verbleibende Zeit:',
        stay: 'Angemeldet bleiben',
        logout: 'Jetzt abmelden'
      },
      hu: {
        title: 'Inaktív munkamenet',
        body: 'Inaktív voltál. Automatikusan kijelentkeztetünk.',
        remain: 'Hátralévő idő:',
        stay: 'Bejelentkezve maradok',
        logout: 'Kijelentkezés most'
      }
    };
    return map[l] || map.ro;
  }

  function readLastActivity(){
    var n = Number(safeGet(LAST_ACTIVITY_KEY));
    if (!Number.isFinite(n) || n <= 0) {
      n = now();
      safeSet(LAST_ACTIVITY_KEY, String(n));
    }
    return n;
  }

  function markActivity(force){
    if (loggedOut || autoLogoutDisabled()) return;
    var t = now();
    if (!force && t - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
    lastWrite = t;
    safeSet(LAST_ACTIVITY_KEY, String(t));
    hideWarning();
  }

  function ensureOverlay(){
    if (overlay) return overlay;
    var css = document.createElement('style');
    css.id = 'kad-auto-logout-style';
    css.textContent = [
      '#kad-auto-logout-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(4,15,28,.58);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Segoe UI",Arial,sans-serif}',
      '#kad-auto-logout-box{width:min(520px,96vw);border:1px solid rgba(255,255,255,.45);border-radius:22px;background:linear-gradient(135deg,#eef7ff,#cfe6fb);box-shadow:0 26px 70px rgba(0,0,0,.35);color:#0d2440;padding:26px;text-align:center}',
      '#kad-auto-logout-box h2{margin:0 0 10px;font-size:26px;line-height:1.15}',
      '#kad-auto-logout-box p{margin:8px 0;font-size:16px;font-weight:700}',
      '#kad-auto-logout-count{display:inline-flex;align-items:center;justify-content:center;min-width:70px;margin-top:8px;padding:8px 12px;border-radius:999px;background:#fff;color:#b91c1c;font-weight:900}',
      '#kad-auto-logout-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px}',
      '#kad-auto-logout-actions button{border:1px solid rgba(15,35,65,.35);border-radius:14px;padding:12px 18px;font-weight:900;cursor:pointer;background:#fff;color:#0d2440}',
      '#kad-auto-logout-actions button.danger{background:#b91c1c;color:#fff;border-color:#b91c1c}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(css);

    overlay = document.createElement('div');
    overlay.id = 'kad-auto-logout-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.display = 'none';
    overlay.innerHTML = '<div id="kad-auto-logout-box">'
      + '<h2></h2>'
      + '<p class="body"></p>'
      + '<p><span class="remain"></span> <span id="kad-auto-logout-count">60s</span></p>'
      + '<div id="kad-auto-logout-actions">'
      + '<button type="button" class="stay"></button>'
      + '<button type="button" class="danger logout"></button>'
      + '</div>'
      + '</div>';
    (document.body || document.documentElement).appendChild(overlay);
    countdownNode = overlay.querySelector('#kad-auto-logout-count');
    overlay.querySelector('button.stay').addEventListener('click', function(){ markActivity(true); });
    overlay.querySelector('button.logout').addEventListener('click', function(){ doLogout(); });
    return overlay;
  }

  function showWarning(remainingMs){
    if (loggedOut) return;
    var t = text();
    ensureOverlay();
    overlay.querySelector('h2').textContent = t.title;
    overlay.querySelector('p.body').textContent = t.body;
    overlay.querySelector('.remain').textContent = t.remain;
    overlay.querySelector('button.stay').textContent = t.stay;
    overlay.querySelector('button.logout').textContent = t.logout;
    if (countdownNode) countdownNode.textContent = Math.max(0, Math.ceil(remainingMs / 1000)) + 's';
    overlay.style.display = 'flex';
    warningVisible = true;
  }

  function hideWarning(){
    if (!warningVisible) return;
    warningVisible = false;
    if (overlay) overlay.style.display = 'none';
  }

  function clearSupabaseAuthStorage(){
    [localStorage, sessionStorage].forEach(function(store){
      try {
        for (var i = store.length - 1; i >= 0; i -= 1) {
          var k = store.key(i);
          if (!k) continue;
          if ((k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) || k.indexOf('supabase.auth.token') !== -1) {
            store.removeItem(k);
          }
        }
      } catch(_) {}
    });
  }

  function clearGateAndLocalAuthState(){
    GATE_KEYS.forEach(safeRemove);
    ['rf_user_id','rf_user_email','rf_user_role','rf_login_at','rf_uid','rf_email','rf_role','rf_login_ts','kad_admin_mfa_verified','kad_admin_mfa_verified_at','kad_helper_acl_mfa_ok','kad_helper_acl_mfa_at'].forEach(safeRemove);
    clearSupabaseAuthStorage();
    try { sessionStorage.setItem('rf_force_stay_on_login', '1'); } catch(_) {}
    try { localStorage.setItem('rf_force_stay_on_login', '1'); } catch(_) {}
  }

  function getSupabaseConfig(){
    var cfg = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_CONFIG || {};
    var url = cfg.SUPABASE_URL || cfg.supabaseUrl || cfg.supabase_url || cfg.url || '';
    var key = cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || cfg.supabase_anon_key || cfg.anonKey || '';
    return { url: String(url || '').trim(), key: String(key || '').trim() };
  }

  async function signOutWithCreatedClient(){
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
      var cfg = getSupabaseConfig();
      if (!cfg.url || !cfg.key) return false;
      var client = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession:true, autoRefreshToken:false, detectSessionInUrl:false }
      });
      await client.auth.signOut();
      return true;
    } catch(_) {
      return false;
    }
  }

  async function doLogout(){
    if (loggedOut) return;
    loggedOut = true;
    clearGateAndLocalAuthState();
    safeSet(LOGOUT_SIGNAL_KEY, String(now()));

    try {
      if (window.ERPAuth && typeof window.ERPAuth.signOut === 'function') {
        await window.ERPAuth.signOut({ redirectTo: 'access-gate.html?logout=idle' });
        return;
      }
    } catch(_) {}

    try {
      if (window.__SUPA__ && window.__SUPA__.auth && typeof window.__SUPA__.auth.signOut === 'function') {
        await window.__SUPA__.auth.signOut();
      }
    } catch(_) {}

    await signOutWithCreatedClient();
    clearGateAndLocalAuthState();

    try { window.location.replace('access-gate.html?logout=idle'); }
    catch(_) { window.location.href = 'access-gate.html?logout=idle'; }
  }

  function checkIdle(){
    if (loggedOut || autoLogoutDisabled()) return;
    var last = readLastActivity();
    var elapsed = now() - last;
    if (elapsed >= IDLE_LIMIT_MS + WARNING_MS) {
      doLogout();
      return;
    }
    if (elapsed >= IDLE_LIMIT_MS) {
      showWarning(IDLE_LIMIT_MS + WARNING_MS - elapsed);
    } else {
      hideWarning();
    }
  }

  function onStorage(ev){
    if (!ev) return;
    if (ev.key === LOGOUT_SIGNAL_KEY && ev.newValue) {
      clearGateAndLocalAuthState();
      try { window.location.replace('access-gate.html?logout=idle'); }
      catch(_) { window.location.href = 'access-gate.html?logout=idle'; }
    }
    if (ev.key === LAST_ACTIVITY_KEY) {
      checkIdle();
    }
  }

  function bindActivityEvents(){
    ['pointerdown','mousedown','keydown','wheel','touchstart','scroll'].forEach(function(evt){
      window.addEventListener(evt, function(){ markActivity(false); }, { passive:true, capture:true });
    });
    window.addEventListener('mousemove', function(){ markActivity(false); }, { passive:true, capture:true });
    window.addEventListener('focus', function(){ checkIdle(); }, true);
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) checkIdle(); }, true);
    window.addEventListener('storage', onStorage, false);
  }

  function start(){
    if (autoLogoutDisabled()) return;
    if (!document.body) {
      window.setTimeout(start, 50);
      return;
    }
    if (!safeGet(LAST_ACTIVITY_KEY)) markActivity(true);
    bindActivityEvents();
    window.setInterval(checkIdle, CHECK_EVERY_MS);
    checkIdle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
