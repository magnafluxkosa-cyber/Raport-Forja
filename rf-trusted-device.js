(function(){
  'use strict';

  var DEVICE_ID_KEY = 'rf_trusted_device_id_v1';
  var TOKEN_PREFIX = 'rf_trusted_device_token_v1:';
  var TABLE_NAME = 'rf_trusted_devices';
  var DEFAULT_DAYS = 14;
  var ADMIN_DAYS = 7;
  var EDITOR_DAYS = 14;
  var OPERATOR_DAYS = 30;

  function normalizeEmail(value){
    return String(value || '').trim().toLowerCase();
  }

  function safeGet(key){
    try { return localStorage.getItem(key); } catch(_e) { return null; }
  }

  function safeSet(key, value){
    try { localStorage.setItem(key, value); return true; } catch(_e) { return false; }
  }

  function safeRemove(key){
    try { localStorage.removeItem(key); } catch(_e) {}
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

  function getOrCreateDeviceId(){
    var value = String(safeGet(DEVICE_ID_KEY) || '').trim();
    if(!value){
      value = randomHex(24);
      safeSet(DEVICE_ID_KEY, value);
    }
    return value;
  }

  function tokenKey(user){
    return TOKEN_PREFIX + String(user && user.id || 'unknown');
  }

  function getStoredToken(user){
    return String(safeGet(tokenKey(user)) || '').trim();
  }

  function setStoredToken(user, token){
    return safeSet(tokenKey(user), token);
  }

  function removeStoredToken(user){
    safeRemove(tokenKey(user));
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

  function getUserAgentFingerprintSource(){
    var nav = window.navigator || {};
    var screenInfo = window.screen || {};
    var parts = [
      nav.userAgent || '',
      nav.platform || '',
      nav.language || '',
      String(screenInfo.width || ''),
      String(screenInfo.height || ''),
      String(screenInfo.colorDepth || ''),
      (Intl && Intl.DateTimeFormat ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '')
    ];
    return parts.join('|');
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
      userAgentHash: await sha256('kad-ua:' + getUserAgentFingerprintSource()),
      deviceLabel: getDeviceLabel()
    };
  }

  function isFreshDate(value, maxAgeMs){
    var time = Date.parse(String(value || ''));
    if(!Number.isFinite(time)) return false;
    return (Date.now() - time) <= maxAgeMs;
  }

  async function isTrustedDevice(sb, user, options){
    options = options || {};
    if(!sb || !user || !user.id) return false;
    var ctx;
    try { ctx = await buildContext(user); } catch(_e) { return false; }
    if(!ctx.token || !ctx.tokenHash) return false;

    try{
      var nowIso = new Date().toISOString();
      var query = sb
        .from(TABLE_NAME)
        .select('id,token_hash,user_agent_hash,trusted_until,last_mfa_at,revoked_at')
        .eq('user_id', user.id)
        .eq('device_id_hash', ctx.deviceIdHash)
        .eq('token_hash', ctx.tokenHash)
        .is('revoked_at', null)
        .gt('trusted_until', nowIso)
        .limit(1)
        .maybeSingle();

      var res = await query;
      if(res.error){
        console.warn('RF trusted device check unavailable:', res.error);
        return false;
      }
      var row = res.data;
      if(!row) return false;
      if(row.user_agent_hash && row.user_agent_hash !== ctx.userAgentHash) return false;
      if(options.requireRecentMfaHours){
        var maxAgeMs = Number(options.requireRecentMfaHours) * 60 * 60 * 1000;
        if(!isFreshDate(row.last_mfa_at, maxAgeMs)) return false;
      }
      try{
        await sb.from(TABLE_NAME).update({ last_seen_at: nowIso, updated_at: nowIso }).eq('id', row.id).eq('user_id', user.id);
      }catch(_e){}
      return true;
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
    var token = randomHex(32);
    if(!setStoredToken(user, token)) return { ok:false, reason:'local-storage-unavailable' };

    try{
      var ctx = await buildContext(user, token);
      var now = new Date();
      var trustedUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      var row = {
        user_id: user.id,
        email: normalizeEmail(user.email),
        device_id_hash: ctx.deviceIdHash,
        token_hash: ctx.tokenHash,
        user_agent_hash: ctx.userAgentHash,
        device_label: ctx.deviceLabel,
        trusted_until: trustedUntil.toISOString(),
        last_mfa_at: now.toISOString(),
        last_seen_at: now.toISOString(),
        revoked_at: null,
        updated_at: now.toISOString()
      };
      var res = await sb.from(TABLE_NAME).upsert(row, { onConflict:'user_id,device_id_hash' }).select('id,trusted_until').maybeSingle();
      if(res.error) throw res.error;
      return { ok:true, days:days, trusted_until: row.trusted_until, row: res.data || null };
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
      await sb.from(TABLE_NAME).update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('device_id_hash', ctx.deviceIdHash);
      return true;
    }catch(_e){
      return false;
    }
  }

  window.RFTrustedDevice = Object.freeze({
    isTrustedDevice: isTrustedDevice,
    rememberDevice: rememberDevice,
    revokeThisDevice: revokeThisDevice,
    getTrustDaysForRole: getTrustDaysForRole
  });
})();
