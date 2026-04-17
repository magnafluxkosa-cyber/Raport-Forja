(function (window, document) {
  'use strict';

  var CONFIG = window.RF_PROJECT_GATE_CONFIG || {};
  var ERP = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
  var storageKey = String(CONFIG.storageKey || 'rf_project_gate_token');
  var gatePage = 'access-gate.html';

  function ensureStyle() {
    if (document.getElementById('rf-gate-guard-style')) return;
    var style = document.createElement('style');
    style.id = 'rf-gate-guard-style';
    style.textContent = 'html[data-rf-gate-pending="1"] body{visibility:hidden !important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function hidePage() {
    ensureStyle();
    document.documentElement.setAttribute('data-rf-gate-pending', '1');
  }

  function showPage() {
    document.documentElement.removeAttribute('data-rf-gate-pending');
  }

  function readStoredToken() {
    var raw = null;
    try { raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey) || ''; } catch (_) { raw = ''; }
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.token) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function clearStoredToken() {
    try { sessionStorage.removeItem(storageKey); } catch (_) {}
    try { localStorage.removeItem(storageKey); } catch (_) {}
  }

  function getFunctionUrl() {
    var url = String(ERP.SUPABASE_URL || '').trim().replace(/\/$/, '');
    var fn = String(CONFIG.functionName || '').trim();
    if (!url || !fn) throw new Error('Lipsește configurația de gate.');
    return url + '/functions/v1/' + fn;
  }

  function getAnonKey() {
    var key = String(ERP.SUPABASE_ANON_KEY || '').trim();
    if (!key) throw new Error('Lipsește cheia anon pentru gate.');
    return key;
  }

  function redirectToGate() {
    var next = window.location.pathname.split('/').pop() || 'login.html';
    var qs = '?next=' + encodeURIComponent(next);
    try { window.location.replace(gatePage + qs); }
    catch (_) { window.location.href = gatePage + qs; }
  }

  async function validateToken(tokenObj) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, Number(CONFIG.requestTimeoutMs || 12000));
    try {
      var response = await fetch(getFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': getAnonKey(),
          'Authorization': 'Bearer ' + getAnonKey()
        },
        body: JSON.stringify({
          op: 'validate',
          token: String(tokenObj && tokenObj.token || ''),
          expected_project_key: String(CONFIG.expectedProjectKeyOnLogin || CONFIG.projectKey || '')
        }),
        signal: controller.signal
      });
      var json = null;
      try { json = await response.json(); } catch (_) { json = null; }
      return Boolean(response.ok && json && json.ok === true);
    } catch (_) {
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  }

  hidePage();

  var stored = readStoredToken();
  if (!stored || !stored.token) {
    redirectToGate();
    return;
  }

  validateToken(stored).then(function (ok) {
    if (!ok) {
      clearStoredToken();
      redirectToGate();
      return;
    }
    showPage();
  }).catch(function () {
    clearStoredToken();
    redirectToGate();
  });
})(window, document);
