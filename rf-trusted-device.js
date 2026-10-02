// K.A.D. - Trusted device helper for MFA
// v2: RPC-backed persistence, AAL2-only enrollment, AAL1 login verification.
(function(){
  'use strict';

  var DEVICE_ID_KEY = 'rf_trusted_device_id_v1';
  var TOKEN_PREFIX = 'rf_trusted_device_token_v1:';
  var TABLE_NAME = 'rf_trusted_devices';
  var DEFAULT_DAYS = 14;
  var ADMIN_DAYS = 7;
  var EDITOR_DAYS = 14;
  var OPERATOR_DAYS = 30;
  var COOKIE_DEVICE = 'rf_td_device_v2';
  var VERSION = '2.0.0-20261002';

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function safeGet(key){
    try { return localStorage.getItem(key); } catch(_e) { return null; }
  }

  function safeSet(key, value){
    try { localStorage.setItem(key, value); return localStorage.getItem(key) === String(value); } catch(_e) { return false; }
  }

  function safeRemove(key){
    try { localStorage.removeItem(key); } catch(_e) {}
  }

  function cookieGet(name){
    try{
      var needle = encodeURIComponent(name) + '=';
      var parts = String(document.cookie || '').split(';');
      for(var i=0;i<parts.length;i++){
        var p = parts[i].trim();
        if(p.indexOf(needle) === 0) return decodeURIComponent(p.slice(needle.length));
      }
    }catch(_e){}
    return '';
  }

  function cookieSet(name, value, days){
    try{
      var maxAge = Math.max(1, Math.floor(Number(days || 31) * 86400));
      var secure = location && location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(String(value || '')) + '; Path=/; Max-Age=' + maxAge + '; SameSite=Lax' + secure;
      return cookieGet(name) === String(value || '');
    }catch(_e){ return false; }
  }

  function cookieRemove(name){
    try{
      var secure = location && location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = encodeURIComponent(name) + '=; Path=/; Max-Age=0; SameSite=Lax' + secure;
    }catch(_e){}
  }

  function bytesToHex(bytes){
    return Array.prototype.map.call(bytes, function(b){ return ('00' + b.toString(16)).slice(-2); }).join('');
  }

  function randomHex(bytesLength){
    var bytes = new Uint8Array(bytesLength || 32);
    if(window.crypto && typeof window.crypto.getRandomValues === 'function'){
      window.crypto.getRandomValues(bytes);
      return bytesToHex(bytes);
    }
    var out = '';
    for(var i = 0; i < (bytesLength || 32); i++) out += ('00' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
    return out;
  }

  function userCookieTokenName(user){
    return 'rf_td_token_v2_' + String(user && user.id || 'unknown').replace(/[^a-zA-Z0-9]/g,'').slice(0,32);
  }

  function getOrCreateDeviceId(){
    var value = String(safeGet(DEVICE_ID_KEY) || cookieGet(COOKIE_DEVICE) || '').trim();
    if(!value){
      value = randomHex(24);
    }
    safeSet(DEVICE_ID_KEY, value);
    cookieSet(COOKIE_DEVICE, value, 365);
    return value;
  }

  function tokenKey(user){
    return TOKEN_PREFIX + String(user && user.id || 'unknown');
  }

  function getStoredToken(user){
    var value = String(safeGet(tokenKey(user)) || cookieGet(userCookieTokenName(user)) || '').trim();
    if(value){
      safeSet(tokenKey(user), value);
      cookieSet(userCookieTokenName(user), value, 31);
    }
    return value;
  }

  function setStoredToken(user, token, days){
    var okLocal = safeSet(tokenKey(user), token);
    var okCookie = cookieSet(userCookieTokenName(user), token, Math.min(31, Math.max(1, Number(days || 31))));
    return okLocal || okCookie;
  }

  function removeStoredToken(user){
    safeRemove(tokenKey(user));
    cookieRemove(userCookieTokenName(user));
  }

  async function sha256(value){
    var text = String(value || '');
    if(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function'){
      var encoded = new TextEncoder().encode(text);
      var digest = await window.crypto.subtle.digest('SHA-256', encoded);
      return bytesToHex(new Uint8Array(digest));
    }
    var h = 0x811c9dc5;
    for(var i = 0; i < text.length; i++){
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function getDeviceLabel(){
    var nav = window.navigator || {};
    var platform = String(nav.platform || '').trim();
    var ua = String(nav.userAgent || '').trim();
    var browser = 'Browser';
    if(/edg\//i.test(ua)) browser = 'Microsoft Edge';
    else if(/chrome\//i.test(ua)) browser = 'Chrome';
    else if(/firefox\//i.test(ua)) browser = 'Firefox';
    else if(/safari\//i.test(ua)) browser = 'Safari';
    return [browser, platform].filter(Boolean).join(' / ') || 'Dispozitiv K.A.D';
  }

  function getTrustDaysForRole(role){
    var value = String(role || '').trim().toLowerCase();
    if(value === 'admin' || value === 'administrator') return ADMIN_DAYS;
    if(value === 'editor' || value === 'sef' || value === 'șef' || value === 'supervisor' || value === 'sef_echipa' || value === 'șef_echipa') return EDITOR_DAYS;
    if(value === 'operator' || value === 'viewer' || value === 'vizualizare') return OPERATOR_DAYS;
    return DEFAULT_DAYS;
  }

  async function buildContext(user, tokenOverride){
    if(!user || !user.id) throw new Error('Lipsește utilizatorul pentru dispozitivul de încredere.');
    var deviceId = getOrCreateDeviceId();
    var token = String(tokenOverride || getStoredToken(user) || '').trim();
    return {
      deviceId: deviceId,
      token: token,
      deviceIdHash: await sha256('kad-device:' + deviceId),
      tokenHash: token ? await sha256('kad-token:' + token) : '',
      deviceLabel: getDeviceLabel()
    };
  }

  async function rpcTrustedCheck(sb, ctx){
    if(!sb || typeof sb.rpc !== 'function') return { available:false, trusted:false };
    var res = await sb.rpc('rf_is_trusted_device', {
      p_device_id_hash: ctx.deviceIdHash,
      p_token_hash: ctx.tokenHash
    });
    if(res.error){
      var msg = String(res.error.message || res.error.details || '');
      if(/function .* does not exist|could not find the function|schema cache/i.test(msg)) return { available:false, trusted:false, error:res.error };
      throw res.error;
    }
    return { available:true, trusted: res.data === true };
  }

  async function isTrustedDevice(sb, user){
    if(!sb || !user || !user.id) return false;
    var ctx;
    try { ctx = await buildContext(user); } catch(_e) { return false; }
    if(!ctx.token || !ctx.tokenHash) return false;

    try{
      var rpc = await rpcTrustedCheck(sb, ctx);
      if(rpc.available) return rpc.trusted === true;

      // Fallback pentru instalări care încă nu au funcțiile RPC v2.
      var nowIso = new Date().toISOString();
      var res = await sb
        .from(TABLE_NAME)
        .select('id,trusted_until,revoked_at')
        .eq('user_id', user.id)
        .eq('device_id_hash', ctx.deviceIdHash)
        .eq('token_hash', ctx.tokenHash)
        .is('revoked_at', null)
        .gt('trusted_until', nowIso)
        .limit(1)
        .maybeSingle();
      if(res.error){
        console.warn('RF trusted device check unavailable:', res.error);
        return false;
      }
      return !!res.data;
    }catch(error){
      console.warn('RF trusted device check failed:', error);
      return false;
    }
  }

  async function rememberDevice(sb, user, options){
    options = options || {};
    if(!sb || !user || !user.id) return { ok:false, reason:'missing-client-or-user' };
    var role = options.role || '';
    var days = Number(options.days || getTrustDaysForRole(role));
    if(!Number.isFinite(days) || days <= 0) days = DEFAULT_DAYS;
    days = Math.min(31, Math.max(1, days));
    var token = randomHex(32);

    try{
      var ctx = await buildContext(user, token);
      var trustedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      var saved = false;
      var savedData = null;

      if(typeof sb.rpc === 'function'){
        var rpcRes = await sb.rpc('rf_remember_trusted_device', {
          p_device_id_hash: ctx.deviceIdHash,
          p_token_hash: ctx.tokenHash,
          p_device_label: ctx.deviceLabel,
          p_trusted_until: trustedUntil
        });
        if(!rpcRes.error){
          saved = true;
          savedData = rpcRes.data || null;
        }else{
          var rpcMsg = String(rpcRes.error.message || rpcRes.error.details || '');
          if(!/function .* does not exist|could not find the function|schema cache/i.test(rpcMsg)) throw rpcRes.error;
        }
      }

      if(!saved){
        // Fallback direct, permis numai la AAL2 de politicile SQL v2.
        var nowIso = new Date().toISOString();
        var row = {
          user_id: user.id,
          email: normalizeEmail(user.email),
          device_id_hash: ctx.deviceIdHash,
          token_hash: ctx.tokenHash,
          device_label: ctx.deviceLabel,
          trusted_until: trustedUntil,
          last_mfa_at: nowIso,
          last_seen_at: nowIso,
          revoked_at: null,
          updated_at: nowIso
        };
        var res = await sb.from(TABLE_NAME).upsert(row, { onConflict:'user_id,device_id_hash' }).select('id,trusted_until').maybeSingle();
        if(res.error) throw res.error;
        saved = true;
        savedData = res.data || null;
      }

      if(!setStoredToken(user, token, days)){
        return { ok:false, reason:'browser-storage-unavailable' };
      }

      var verified = await isTrustedDevice(sb, user, {});
      if(!verified){
        removeStoredToken(user);
        return { ok:false, reason:'saved-but-login-check-failed' };
      }

      return { ok:true, days:days, trusted_until:trustedUntil, row:savedData };
    }catch(error){
      removeStoredToken(user);
      console.warn('RF trusted device save failed:', error);
      return { ok:false, reason:error && error.message ? error.message : 'save-failed' };
    }
  }

  async function revokeThisDevice(sb, user){
    if(!sb || !user || !user.id) return false;
    try{
      var ctx = await buildContext(user);
      removeStoredToken(user);
      if(typeof sb.rpc === 'function'){
        var rpcRes = await sb.rpc('rf_revoke_trusted_device', { p_device_id_hash: ctx.deviceIdHash });
        if(!rpcRes.error) return true;
      }
      await sb.from(TABLE_NAME)
        .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('device_id_hash', ctx.deviceIdHash);
      return true;
    }catch(_e){ return false; }
  }

  window.RFTrustedDevice = Object.freeze({
    version: VERSION,
    isTrustedDevice: isTrustedDevice,
    rememberDevice: rememberDevice,
    revokeThisDevice: revokeThisDevice,
    getTrustDaysForRole: getTrustDaysForRole
  });
})();
