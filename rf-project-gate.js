(function (window, document) {
  'use strict';

  var CONFIG = window.RF_PROJECT_GATE_CONFIG || {};
  var ERP = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
  var form = document.getElementById('gateForm');
  var pinInput = document.getElementById('pinInput');
  var continueBtn = document.getElementById('continueBtn');
  var statusBox = document.getElementById('statusBox');

  function setStatus(message, kind) {
    if (!statusBox) return;
    statusBox.textContent = String(message || '\u00a0');
    statusBox.className = 'status' + (kind ? ' ' + kind : '');
  }

  function normalizePin(value) {
    var raw = String(value || '').trim();
    if (CONFIG.pinMaskDigitsOnly) raw = raw.replace(/\D+/g, '');
    return raw;
  }

  function getFunctionUrl() {
    var url = String(ERP.SUPABASE_URL || '').trim().replace(/\/$/, '');
    var fn = String(CONFIG.functionName || '').trim();
    if (!url || !fn) throw new Error('Configurația pentru gateway lipsește.');
    return url + '/functions/v1/' + fn;
  }

  function getAnonKey() {
    var key = String(ERP.SUPABASE_ANON_KEY || '').trim();
    if (!key) throw new Error('Lipsește cheia anon pentru Supabase.');
    return key;
  }

  function getNextPath(serverPath) {
    var params = new URLSearchParams(window.location.search || '');
    var next = String(params.get('next') || '').trim();
    if (next && !/^https?:/i.test(next) && next.indexOf('//') !== 0) return next;
    return String(serverPath || CONFIG.defaultNext || 'login.html');
  }

  function storeToken(token, meta) {
    var payload = {
      token: String(token || ''),
      project_key: String(meta && meta.project_key || ''),
      redirect_path: String(meta && meta.redirect_path || ''),
      expires_at: Number(meta && meta.expires_at || 0)
    };
    try {
      var serialized = JSON.stringify(payload);
      sessionStorage.setItem(CONFIG.storageKey, serialized);
      if (CONFIG.keepTokenInLocalStorage) localStorage.setItem(CONFIG.storageKey, serialized);
    } catch (_) {}
  }

  function setLoading(flag) {
    if (!continueBtn || !pinInput) return;
    continueBtn.disabled = !!flag;
    pinInput.disabled = !!flag;
    continueBtn.textContent = flag ? 'Se verifică...' : 'Continuă';
  }

  async function verifyPin(pin) {
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
        body: JSON.stringify({ op: 'verify', pin: pin }),
        signal: controller.signal
      });

      var json = null;
      try { json = await response.json(); } catch (_) { json = null; }
      if (!response.ok || !json || json.ok !== true) {
        throw new Error(json && json.error || 'PIN invalid.');
      }
      return json;
    } finally {
      window.clearTimeout(timer);
    }
  }

  if (!form || !pinInput) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var pin = normalizePin(pinInput.value);
    if (!pin) {
      setStatus('Introdu PIN-ul.', 'error');
      pinInput.focus();
      return;
    }

    try {
      setLoading(true);
      setStatus('Se verifică accesul...', '');
      var data = await verifyPin(pin);
      storeToken(data.token, data);
      setStatus('PIN valid. Redirecționare...', 'ok');
      window.location.replace(getNextPath(data.redirect_path));
    } catch (error) {
      setStatus(error && error.message ? error.message : 'PIN invalid.', 'error');
      pinInput.select();
    } finally {
      setLoading(false);
    }
  });

  pinInput.addEventListener('input', function () {
    setStatus('\u00a0', '');
    if (CONFIG.pinMaskDigitsOnly) {
      var clean = normalizePin(pinInput.value);
      if (clean !== pinInput.value) pinInput.value = clean;
    }
  });

  window.setTimeout(function () {
    try { pinInput.focus(); } catch (_) {}
  }, 50);
})(window, document);
