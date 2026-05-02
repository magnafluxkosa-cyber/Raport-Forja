(function () {
  'use strict';

  var CONFIG = Object.assign({
    inactivityMinutes: 15,
    warningSeconds: 60,
    redirectTo: 'access-gate.html',
    loginRedirectTo: 'access-gate.html',
    storageKey: 'rf_auto_logout_last_activity',
    disabledPages: ['access-gate.html', 'login.html', 'mfa-setup.html', 'mfa-verify.html'],
    version: '20260502-auto-logout-1'
  }, window.RF_AUTO_LOGOUT_CONFIG || {});

  var pageName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (CONFIG.disabledPages.indexOf(pageName) !== -1) return;

  var inactivityMs = Math.max(1, Number(CONFIG.inactivityMinutes || 15)) * 60 * 1000;
  var warningMs = Math.max(10, Number(CONFIG.warningSeconds || 60)) * 1000;
  var warningTimer = null;
  var countdownTimer = null;
  var overlay = null;
  var countdownNode = null;
  var loggingOut = false;
  var isWarningVisible = false;
  var lastMove = 0;

  function now() { return Date.now(); }

  function safeStoreSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function safeStoreGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeRemove(storage, key) {
    try { storage.removeItem(key); } catch (_) {}
  }

  function getLastActivity() {
    var value = Number(safeStoreGet(CONFIG.storageKey) || 0);
    if (!value || !isFinite(value)) {
      value = now();
      safeStoreSet(CONFIG.storageKey, String(value));
    }
    return value;
  }

  function markActivity() {
    safeStoreSet(CONFIG.storageKey, String(now()));
  }

  function clearTimer(timer) {
    if (timer) window.clearTimeout(timer);
  }

  function clearIntervalSafe(timer) {
    if (timer) window.clearInterval(timer);
  }

  function ensureOverlay() {
    if (overlay) return overlay;

    var style = document.createElement('style');
    style.id = 'rf-auto-logout-style';
    style.textContent = '' +
      '.rf-auto-logout-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(4,10,24,.58);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,Arial,sans-serif;}' +
      '.rf-auto-logout-card{width:min(440px,calc(100vw - 36px));background:#ffffff;color:#0f172a;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.34);border:1px solid rgba(148,163,184,.55);padding:22px;text-align:left;}' +
      '.rf-auto-logout-title{font-size:20px;font-weight:800;margin:0 0 8px;}' +
      '.rf-auto-logout-text{font-size:14px;line-height:1.45;color:#475569;margin:0 0 16px;}' +
      '.rf-auto-logout-count{font-weight:900;color:#b91c1c;}' +
      '.rf-auto-logout-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}' +
      '.rf-auto-logout-btn{border:0;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:800;cursor:pointer;}' +
      '.rf-auto-logout-keep{background:#0f172a;color:white;}' +
      '.rf-auto-logout-out{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;}' +
      '@media(max-width:520px){.rf-auto-logout-actions{justify-content:stretch}.rf-auto-logout-btn{flex:1}}';
    (document.head || document.documentElement).appendChild(style);

    overlay = document.createElement('div');
    overlay.className = 'rf-auto-logout-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '' +
      '<div class="rf-auto-logout-card">' +
        '<h2 class="rf-auto-logout-title">Sesiune inactivă</h2>' +
        '<p class="rf-auto-logout-text">Nu ai mai fost activ pe pagină. Vei fi delogat automat în <span class="rf-auto-logout-count">60</span> secunde.</p>' +
        '<div class="rf-auto-logout-actions">' +
          '<button type="button" class="rf-auto-logout-btn rf-auto-logout-out">Delogare acum</button>' +
          '<button type="button" class="rf-auto-logout-btn rf-auto-logout-keep">Rămân logat</button>' +
        '</div>' +
      '</div>';

    countdownNode = overlay.querySelector('.rf-auto-logout-count');
    overlay.querySelector('.rf-auto-logout-keep').addEventListener('click', function () {
      registerActivity(true);
    });
    overlay.querySelector('.rf-auto-logout-out').addEventListener('click', function () {
      performLogout();
    });

    return overlay;
  }

  function hideWarning() {
    isWarningVisible = false;
    clearIntervalSafe(countdownTimer);
    countdownTimer = null;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function scheduleWarning() {
    if (loggingOut) return;
    clearTimer(warningTimer);
    var remaining = getLastActivity() + inactivityMs - now();
    if (remaining <= 0) {
      showWarning();
      return;
    }
    warningTimer = window.setTimeout(showWarning, Math.min(remaining, 2147483647));
  }

  function showWarning() {
    if (loggingOut || isWarningVisible) return;
    isWarningVisible = true;
    ensureOverlay();
    if (!overlay.parentNode) document.body.appendChild(overlay);

    var endAt = now() + warningMs;
    function tick() {
      var secondsLeft = Math.max(0, Math.ceil((endAt - now()) / 1000));
      if (countdownNode) countdownNode.textContent = String(secondsLeft);
      if (secondsLeft <= 0) {
        performLogout();
      }
    }
    tick();
    countdownTimer = window.setInterval(tick, 1000);
  }

  function registerActivity(force) {
    var t = now();
    if (!force && t - lastMove < 750) return;
    lastMove = t;
    markActivity();
    if (isWarningVisible) hideWarning();
    scheduleWarning();
  }

  function clearLocalSessionMarkers() {
    var keys = [
      'rf_user_id',
      'rf_user_email',
      'rf_user_role',
      'rf_login_at',
      'rf_helper_acl_mfa_entry_ok',
      'rf_project_gate_access',
      'rf_project_gate_access_session',
      'rf_project_gate_token'
    ];
    keys.forEach(function (key) {
      safeRemove(window.localStorage, key);
      safeRemove(window.sessionStorage, key);
    });
  }

  function getSupabaseClient() {
    try {
      if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
        return window.ERPAuth.getSupabaseClient();
      }
    } catch (_) {}

    try {
      if (window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function') {
        return window.createRfSupabaseClient();
      }
    } catch (_) {}

    try {
      if (window.__RF_SUPABASE_SINGLETON__ && window.__RF_SUPABASE_SINGLETON__.client) {
        return window.__RF_SUPABASE_SINGLETON__.client;
      }
    } catch (_) {}

    try {
      var cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
      var url = cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '';
      var key = cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '';
      if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
        return window.supabase.createClient(url, key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      }
    } catch (_) {}

    return null;
  }

  async function performLogout() {
    if (loggingOut) return;
    loggingOut = true;
    hideWarning();
    clearTimer(warningTimer);

    try {
      if (window.ERPAuth && typeof window.ERPAuth.signOut === 'function') {
        await window.ERPAuth.signOut({ redirectTo: CONFIG.redirectTo || CONFIG.loginRedirectTo || 'access-gate.html' });
        return;
      }
    } catch (_) {}

    try {
      var sb = getSupabaseClient();
      if (sb && sb.auth && typeof sb.auth.signOut === 'function') {
        await sb.auth.signOut();
      }
    } catch (_) {}

    clearLocalSessionMarkers();
    var target = CONFIG.redirectTo || CONFIG.loginRedirectTo || 'access-gate.html';
    try { window.location.replace(target); } catch (_) { window.location.href = target; }
  }

  function bindActivityEvents() {
    ['mousedown','mousemove','keydown','scroll','touchstart','touchmove','pointerdown','wheel'].forEach(function (eventName) {
      window.addEventListener(eventName, function () { registerActivity(false); }, { passive: true, capture: true });
    });

    window.addEventListener('storage', function (event) {
      if (event && event.key === CONFIG.storageKey) {
        if (isWarningVisible) hideWarning();
        scheduleWarning();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) scheduleWarning();
    });
  }

  function init() {
    markActivity();
    bindActivityEvents();
    scheduleWarning();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
