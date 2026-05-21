/* K.A.D global notifications - live, creat doar la salvare/modificare. */
(function(window, document){
  'use strict';
  if (window.__KAD_NOTIFICATIONS_READY__) return;
  window.__KAD_NOTIFICATIONS_READY__ = true;

  var NOTIF_TABLE = 'kad_notifications';
  var READS_TABLE = 'kad_notification_reads';
  var ACTOR_MAP_TABLE = 'kad_actor_name_map';
  var REFRESH_MIN_MS = 15000;
  var LIST_LIMIT = 80;
  var realtimeChannel = null;
  var client = null;
  var currentUser = null;
  var currentEmail = '';
  var currentDisplayName = '';
  var currentActorNameOverride = '';
  var currentActorPin = '';
  var displayNameCache = {};
  var initialized = false;
  var uiReady = false;
  var PATCH_FLAG = '__kad_notifications_mutation_patch_v2__';
  var PATCHED_CLIENTS = (typeof WeakSet !== 'undefined') ? new WeakSet() : null;
  var lastFetchAt = 0;
  var unreadIds = new Set();
  var allNotifications = [];
  var recentAutoNotifications = new Map();
  var pendingPageNotifications = new Map();
  var recentPageAutoNotificationAt = new Map();
  var AUTO_PAGE_DEBOUNCE_MS = 3500;
  var AUTO_PAGE_MAX_WAIT_MS = 20000;
  var AUTO_PAGE_COOLDOWN_MS = 60000;
  var isOpen = false;
  var els = {};

  function normText(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function normKey(v){
    return normText(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\.html$/,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
  }
  function escapeHtml(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(s){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]; });
  }
  function nowIso(){ return new Date().toISOString(); }
  function pageFromLocation(){
    var raw = String((window.location && window.location.pathname) || '').split('/').pop() || 'index.html';
    return normKey(raw.replace(/\.html$/i,'')) || 'index';
  }
  function isExcludedPage(){
    var p = pageFromLocation();
    return p === 'login' || p === 'mfa-verify' || p === 'mfa-setup' || p === 'access-gate';
  }
  function getConfig(){ return window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {}; }
  function pageList(){
    var cfg = getConfig();
    var list = [];
    if (Array.isArray(cfg.pages)) list = list.concat(cfg.pages);
    if (Array.isArray(window.RF_PAGES)) list = list.concat(window.RF_PAGES);
    return list;
  }
  function pageNameFor(key){
    key = normKey(key);
    var list = pageList();
    for (var i=0;i<list.length;i++){
      var item = list[i] || {};
      var itemKey = normKey(item.page_key || item.key || item.id || item.href || item.url || '');
      if (itemKey === key) return normText(item.page_name || item.label || item.title || item.name) || key;
    }
    var labels = {
      'index':'Dashboard',
      'forjate':'Forjate',
      'intrari-otel':'Intrări oțel',
      'debitate':'Debitate',
      'rebut-pm':'Rebut PM',
      'rebut':'Rebut',
      'planificare-forja':'Planificare forjă',
      'registru-mentenanta':'Registru de mentenanță',
      'helper-acl':'Helper ACL',
      'helper-data':'Helper Data',
      'inventar-otel':'Inventar oțel',
      'inventar-prelucrari':'Inventar Prelucrări',
      'magnaflux':'Magnaflux',
      'raport-forja':'Raport Forja'
    };
    return labels[key] || key.replace(/-/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function inferPageFromDocKey(docKey){
    var key = normText(docKey);
    if (!key) return '';
    var clean = key.split(':')[0].split('|')[0];
    clean = clean.replace(/_index$/i,'').replace(/-index$/i,'');
    var nk = normKey(clean);
    if (nk === 'lista-vanzari' || nk === 'lista_vanzari') return 'lista-vanzari';
    if (nk === 'inventar-prelucrari' || nk === 'inventar_prelucrari') return 'inventar-prelucrari';
    if (nk === 'rebut-pm' || nk === 'rebut_pm') return 'rebut-pm';
    if (nk === 'registru-mentenanta' || nk === 'registru_mentenanta') return 'registru-mentenanta';
    if (nk && nk !== 'rf-documents' && nk !== 'rf-auto-pages-v1') return nk;
    return '';
  }
  function extractDocKey(payload){
    if (!payload) return '';
    if (Array.isArray(payload)){
      for (var i=0;i<payload.length;i++){
        var k = extractDocKey(payload[i]);
        if (k) return k;
      }
      return '';
    }
    if (typeof payload === 'object') return normText(payload.doc_key || payload.key || payload.id || '');
    return '';
  }
  function extractShortDetails(ctx){
    var table = normText(ctx && ctx.table);
    var method = normText(ctx && ctx.method).toLowerCase();
    var docKey = normText(ctx && ctx.doc_key);
    var details = [];
    if (table) details.push('tabel: ' + table);
    if (method) details.push('acțiune: ' + method);
    if (docKey) details.push('doc_key: ' + docKey);
    return details.join(' • ');
  }
  function inferNotificationFromMutation(ctx){
    ctx = ctx || {};
    var table = normText(ctx.table);
    var method = normText(ctx.method).toLowerCase();
    var payload = ctx.payload;
    var docKey = normText(ctx.doc_key || extractDocKey(payload));
    var pageKey = normKey(ctx.page_key || inferPageFromDocKey(docKey) || pageFromLocation());
    var pageName = pageNameFor(pageKey);
    var actionWord = 'salvat date';
    if (method === 'insert') actionWord = 'adăugat date noi';
    else if (method === 'update') actionWord = 'modificat date';
    else if (method === 'upsert') actionWord = 'adăugat/modificat date';
    else if (method === 'delete') actionWord = 'șters date';

    var actor = normText(ctx.actor_name) || currentUserName();
    var title = 'Modificare în ' + pageName;
    if (method === 'insert') title = 'Date noi în ' + pageName;
    if (method === 'delete') title = 'Ștergere în ' + pageName;
    var message = actor + ' a ' + actionWord + ' în ' + pageName + '.';
    var more = extractShortDetails({ table:table, method:method, doc_key:docKey });
    return {
      page_key: pageKey,
      page_name: pageName,
      category: 'auto-save',
      type: method || 'save',
      title: title,
      message: message,
      details: {
        source_table: table,
        source_doc_key: docKey,
        source_page: pageFromLocation(),
        method: method,
        info: more,
        captured_at: nowIso()
      },
      entity_key: docKey || (table + ':' + pageKey),
      source_table: table,
      source_doc_key: docKey
    };
  }
  function looksLikeEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normText(v));
  }
  function localPartToName(email){
    var local = normText(email).split('@')[0] || '';
    local = local.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!local) return 'Utilizator';
    return local.replace(/\b\S/g, function(c){ return c.toUpperCase(); });
  }
  function sanitizeDisplayName(name, email){
    name = normText(name);
    email = normText(email);
    if (name && !looksLikeEmail(name)) return name;
    if (email) return localPartToName(email);
    return 'Utilizator';
  }
  function currentUserMetadataName(){
    var meta = currentUser && (currentUser.user_metadata || currentUser.raw_user_meta_data || {});
    return normText(meta && (meta.full_name || meta.name || meta.display_name));
  }
  function readStorageValue(keys){
    keys = keys || [];
    for (var i=0;i<keys.length;i++){
      var key = keys[i];
      try{
        var v = window.sessionStorage && window.sessionStorage.getItem(key);
        if (normText(v)) return normText(v);
      }catch(_e){}
      try{
        var v2 = window.localStorage && window.localStorage.getItem(key);
        if (normText(v2)) return normText(v2);
      }catch(_e){}
    }
    return '';
  }
  function storedActorName(){
    return readStorageValue([
      'kad_actor_name','kad_current_actor_name','kad_operator_name','kad_current_operator_name',
      'rf_operator_name','operator_name','operatorName','currentOperatorName','nume_operator','numeOperator'
    ]);
  }
  function storedActorPin(){
    return readStorageValue([
      'kad_actor_pin','kad_current_actor_pin','kad_operator_pin','kad_current_operator_pin',
      'rf_operator_pin','operator_pin','operatorPin','currentOperatorPin','pin_operator','pinOperator'
    ]);
  }
  function currentUserName(){
    if (currentActorNameOverride) return currentActorNameOverride;
    var storedName = storedActorName();
    if (storedName && !looksLikeEmail(storedName)) return storedName;
    if (currentDisplayName) return currentDisplayName;
    var metaName = currentUserMetadataName();
    if (metaName && !looksLikeEmail(metaName)) return metaName;
    return sanitizeDisplayName('', currentEmail);
  }
  async function resolveActorNameFromMap(email, pin){
    var sb = getClient();
    email = normText(email || currentEmail).toLowerCase();
    pin = normText(pin || '');
    if (!sb) return '';
    try{
      if (typeof sb.rpc === 'function'){
        var rpc = await sb.rpc('kad_resolve_actor_name', { p_email: email || null, p_pin: pin || null });
        if (!rpc.error && normText(rpc.data)) return sanitizeDisplayName(rpc.data, email);
      }
    }catch(_e){}
    try{
      if (pin){
        // Fallback doar dacă tabela permite SELECT. Recomandat este RPC-ul security definer de mai sus.
        var pinRes = await sb.from(ACTOR_MAP_TABLE).select('display_name').eq('actor_type','pin').eq('is_active', true).eq('pin_code', pin).limit(1).maybeSingle();
        if (!pinRes.error && pinRes.data && normText(pinRes.data.display_name)) return sanitizeDisplayName(pinRes.data.display_name, email);
      }
    }catch(_e){}
    try{
      if (email){
        var mailRes = await sb.from(ACTOR_MAP_TABLE).select('display_name').eq('actor_type','account').eq('is_active', true).ilike('email', email).limit(1).maybeSingle();
        if (!mailRes.error && mailRes.data && normText(mailRes.data.display_name)) return sanitizeDisplayName(mailRes.data.display_name, email);
      }
    }catch(_e){}
    return '';
  }
  async function resolveCurrentDisplayName(force){
    if (!currentEmail) await getUser();
    var explicitName = currentActorNameOverride || storedActorName();
    if (explicitName && !looksLikeEmail(explicitName)){
      currentDisplayName = explicitName;
      return currentDisplayName;
    }
    var pin = currentActorPin || storedActorPin();
    var cacheKey = (currentEmail || '') + '|' + (pin ? 'pin:' + pin : 'account');
    if (!force && displayNameCache[cacheKey]){
      currentDisplayName = displayNameCache[cacheKey];
      return currentDisplayName;
    }
    var mapped = await resolveActorNameFromMap(currentEmail, pin);
    if (mapped){
      currentDisplayName = mapped;
      displayNameCache[cacheKey] = mapped;
      return mapped;
    }
    var metaName = currentUserMetadataName();
    var name = sanitizeDisplayName(metaName, currentEmail);
    var sb = getClient();
    if (sb){
      try{
        var q = sb.from('profiles').select('display_name,email,user_id').limit(1);
        if (currentUser && currentUser.id) q = q.eq('user_id', currentUser.id);
        else if (currentEmail) q = q.ilike('email', currentEmail);
        var res = await q.maybeSingle();
        if (!res.error && res.data) name = sanitizeDisplayName(res.data.display_name, currentEmail);
      }catch(_e){}
    }
    currentDisplayName = name;
    displayNameCache[cacheKey] = name;
    return name;
  }
  function actorNameForNotification(n){
    n = n || {};
    var email = normText(n.created_by_email || '');
    var name = normText(n.created_by_name || '');
    if (email && currentEmail && email.toLowerCase() === currentEmail.toLowerCase() && currentDisplayName) return currentDisplayName;
    return sanitizeDisplayName(name, email);
  }
  function messageForNotification(n){
    n = n || {};
    var msg = normText(n.message || '');
    var email = normText(n.created_by_email || '');
    var name = actorNameForNotification(n);
    if (msg && email && name && msg.indexOf(email) >= 0) msg = msg.split(email).join(name);
    return msg;
  }
  function findValueInPayload(payload, keyMatchers){
    keyMatchers = keyMatchers || [];
    if (!payload) return '';
    if (Array.isArray(payload)){
      for (var i=0;i<payload.length;i++){
        var hit = findValueInPayload(payload[i], keyMatchers);
        if (hit) return hit;
      }
      return '';
    }
    if (typeof payload !== 'object') return '';
    var keys = Object.keys(payload);
    for (var k=0;k<keys.length;k++){
      var key = normKey(keys[k]);
      var val = payload[keys[k]];
      for (var m=0;m<keyMatchers.length;m++){
        if (keyMatchers[m](key, val)) return normText(val);
      }
    }
    for (var j=0;j<keys.length;j++){
      var nested = payload[keys[j]];
      if (nested && typeof nested === 'object'){
        var nestedHit = findValueInPayload(nested, keyMatchers);
        if (nestedHit) return nestedHit;
      }
    }
    return '';
  }
  function extractActorNameFromPayload(payload){
    return findValueInPayload(payload, [
      function(key,val){ return /^(operator|operator-name|nume-operator|nume-operatori|autor|created-by-name|modified-by-name|responsabil|utilizator)$/.test(key) && normText(val) && !looksLikeEmail(val); }
    ]);
  }
  function extractActorPinFromPayload(payload){
    return findValueInPayload(payload, [
      function(key,val){ return /^(pin|operator-pin|pin-operator|cod-pin|operator-code|cod-operator)$/.test(key) && normText(val); }
    ]);
  }
  async function resolveActorNameFromContext(ctx){
    ctx = ctx || {};
    var explicit = normText(ctx.actor_name || ctx.created_by_name || ctx.modified_by_name || '');
    if (explicit && !looksLikeEmail(explicit)) return explicit;
    var payloadName = extractActorNameFromPayload(ctx.payload);
    if (payloadName && !looksLikeEmail(payloadName)) return payloadName;
    var pin = normText(ctx.actor_pin || extractActorPinFromPayload(ctx.payload) || currentActorPin || storedActorPin());
    if (pin){
      var mappedPin = await resolveActorNameFromMap(currentEmail, pin);
      if (mappedPin) return mappedPin;
    }
    return currentUserName();
  }
  function shouldSkipMutation(ctx){
    ctx = ctx || {};
    var table = normText(ctx.table).toLowerCase();
    if (!table) return true;
    if (table === NOTIF_TABLE || table === READS_TABLE) return true;
    if (table === 'kad_user_activity') return true;
    if (table === 'profiles') return true;
    if (table === 'auth.users') return true;
    var method = normText(ctx.method).toLowerCase();
    if (!/^(insert|upsert|update|delete)$/.test(method)) return true;
    return false;
  }
  function mutationDedupKey(n){
    return [n.page_key || '', n.type || '', n.source_table || '', n.source_doc_key || '', n.entity_key || ''].join('|');
  }
  function isDuplicateAuto(n){
    var key = mutationDedupKey(n);
    var t = Date.now();
    recentAutoNotifications.forEach(function(value, mapKey){ if (t - value > 8000) recentAutoNotifications.delete(mapKey); });
    var last = recentAutoNotifications.get(key) || 0;
    if (t - last < 5000) return true;
    recentAutoNotifications.set(key, t);
    return false;
  }
  function addSetValue(obj, value){
    value = normText(value);
    if (!value) return;
    obj[value] = true;
  }
  function objectKeys(obj){
    return Object.keys(obj || {}).filter(Boolean);
  }
  function truncateList(list, limit){
    list = list || [];
    limit = limit || 20;
    return list.slice(0, limit);
  }
  function groupedAutoKey(n, actor){
    return [normKey(n && n.page_key), normKey(actor || currentUserName())].join('|');
  }
  function pageCooldownKey(pending){
    return [normKey(pending && pending.page_key), normKey(pending && pending.actor_name)].join('|');
  }
  function buildGroupedAutoNotification(pending){
    var methods = objectKeys(pending.methods);
    var sourceTables = objectKeys(pending.source_tables);
    var sourceDocKeys = objectKeys(pending.source_doc_keys);
    var actor = normText(pending.actor_name) || currentUserName();
    var pageName = normText(pending.page_name) || pageNameFor(pending.page_key);
    return {
      page_key: normKey(pending.page_key),
      page_name: pageName,
      category: 'auto-page-save',
      type: 'page_change',
      title: 'Modificare în ' + pageName,
      message: actor + ' a făcut modificări în ' + pageName + '.',
      details: {
        grouped: true,
        mutation_count: pending.count || 1,
        methods: methods,
        source_tables: truncateList(sourceTables, 20),
        source_doc_keys: truncateList(sourceDocKeys, 20),
        source_page: pending.source_page || pageFromLocation(),
        first_captured_at: pending.first_iso,
        last_captured_at: pending.last_iso
      },
      entity_key: 'auto-page:' + normKey(pending.page_key),
      source_table: sourceTables[0] || null,
      source_doc_key: sourceDocKeys[0] || null,
      actor_name: actor
    };
  }
  async function flushPendingPageNotification(key){
    var pending = pendingPageNotifications.get(key);
    if (!pending) return;
    pendingPageNotifications.delete(key);
    if (pending.timer) window.clearTimeout(pending.timer);

    var t = Date.now();
    recentPageAutoNotificationAt.forEach(function(value, mapKey){
      if (t - value > AUTO_PAGE_COOLDOWN_MS * 4) recentPageAutoNotificationAt.delete(mapKey);
    });
    var cooldownKey = pageCooldownKey(pending);
    var last = recentPageAutoNotificationAt.get(cooldownKey) || 0;
    if (t - last < AUTO_PAGE_COOLDOWN_MS) return;
    recentPageAutoNotificationAt.set(cooldownKey, t);

    await createNotification(buildGroupedAutoNotification(pending), { local:false });
  }
  function schedulePageAutoNotification(n, ctx){
    n = n || {}; ctx = ctx || {};
    var actor = normText(ctx.actor_name) || currentUserName();
    var key = groupedAutoKey(n, actor);
    var t = Date.now();
    var pending = pendingPageNotifications.get(key);
    if (!pending){
      pending = {
        page_key: normKey(n.page_key),
        page_name: normText(n.page_name) || pageNameFor(n.page_key),
        actor_name: actor,
        source_page: pageFromLocation(),
        methods: {},
        source_tables: {},
        source_doc_keys: {},
        count: 0,
        first_ms: t,
        first_iso: nowIso(),
        last_iso: nowIso(),
        timer: null
      };
      pendingPageNotifications.set(key, pending);
    }
    pending.count += 1;
    pending.last_iso = nowIso();
    addSetValue(pending.methods, n.type || ctx.method || 'save');
    addSetValue(pending.source_tables, n.source_table || ctx.table || '');
    addSetValue(pending.source_doc_keys, n.source_doc_key || ctx.doc_key || '');

    if (pending.timer) window.clearTimeout(pending.timer);
    var delay = (t - pending.first_ms >= AUTO_PAGE_MAX_WAIT_MS) ? 250 : AUTO_PAGE_DEBOUNCE_MS;
    pending.timer = window.setTimeout(function(){ flushPendingPageNotification(key); }, delay);
  }

  function safeGetDocKeyFromMutation(ctx){
    ctx = ctx || {};
    return normText(ctx.doc_key || extractDocKey(ctx.payload) || extractDocKey(ctx.result) || '');
  }
  function shouldSkipNotificationPatchContext(ctx){
    ctx = ctx || {};
    var table = normText(ctx.table).toLowerCase();
    var docKey = safeGetDocKeyFromMutation(ctx).toLowerCase();
    if (table === 'kad_audit_log' || table === 'kad_document_versions' || table === 'kad_backup_log') return true;
    if (table === 'kad_notifications' || table === 'kad_notification_reads') return true;
    if (docKey.indexOf('kad_audit') === 0 || docKey.indexOf('kad-document-version') === 0 || docKey.indexOf('kad_document_version') === 0) return true;
    if (docKey.indexOf('backup-date-kad') === 0 || docKey.indexOf('kad_backup') === 0) return true;
    return false;
  }
  function notifyMutationAfterSuccess(ctx, response){
    ctx = ctx || {};
    if (response && response.error) return;
    if (shouldSkipNotificationPatchContext(ctx)) return;
    ctx.result = response && response.data;
    ctx.doc_key = safeGetDocKeyFromMutation(ctx);
    window.setTimeout(function(){
      try{
        if (window.KAD_NOTIFICATIONS && typeof window.KAD_NOTIFICATIONS.captureMutation === 'function') {
          window.KAD_NOTIFICATIONS.captureMutation(ctx);
        } else {
          window.__KAD_NOTIFICATION_QUEUE__ = window.__KAD_NOTIFICATION_QUEUE__ || [];
          window.__KAD_NOTIFICATION_QUEUE__.push(ctx);
        }
      }catch(_e){}
    }, 0);
  }
  function patchMutationThenable(builder, ctx){
    if (!builder || typeof builder !== 'object') return builder;
    try{
      if (!builder.__kad_notif_ctx__) Object.defineProperty(builder, '__kad_notif_ctx__', { value:ctx, configurable:true });
    }catch(_e){ builder.__kad_notif_ctx__ = ctx; }
    if (!builder.__kad_notif_then_patched__ && typeof builder.then === 'function'){
      var originalThen = builder.then;
      try{
        Object.defineProperty(builder, '__kad_notif_then_patched__', { value:true, configurable:true });
        builder.then = function(onFulfilled, onRejected){
          var self = this;
          return originalThen.call(self, function(response){
            try{
              if (!self.__kad_notif_sent__){
                self.__kad_notif_sent__ = true;
                notifyMutationAfterSuccess(self.__kad_notif_ctx__ || ctx, response);
              }
            }catch(_e){}
            return typeof onFulfilled === 'function' ? onFulfilled(response) : response;
          }, onRejected);
        };
      }catch(_e){}
    }
    ['select','eq','neq','gt','gte','lt','lte','match','is','in','contains','containedBy','range','order','limit','single','maybeSingle','returns','throwOnError','csv','geojson','explain','rollback','abortSignal'].forEach(function(method){
      if (typeof builder[method] !== 'function' || builder[method].__kad_notif_chain_patched__) return;
      var original = builder[method];
      var wrapped = function(){
        var result = original.apply(this, arguments);
        return patchMutationThenable(result || this, this.__kad_notif_ctx__ || ctx);
      };
      wrapped.__kad_notif_chain_patched__ = true;
      try{ builder[method] = wrapped; }catch(_e){}
    });
    return builder;
  }
  function patchTableBuilder(builder, table){
    if (!builder || typeof builder !== 'object') return builder;
    if (builder.__kad_notif_table_patched__) return builder;
    try{ Object.defineProperty(builder, '__kad_notif_table_patched__', { value:true, configurable:true }); }catch(_e){ builder.__kad_notif_table_patched__ = true; }
    ['insert','upsert','update','delete'].forEach(function(method){
      if (typeof builder[method] !== 'function' || builder[method].__kad_notif_mutation_patched__) return;
      var original = builder[method];
      var wrapped = function(){
        var args = Array.prototype.slice.call(arguments);
        var payload = args.length ? args[0] : null;
        var ctx = {
          table: table,
          method: method,
          payload: payload,
          doc_key: extractDocKey(payload),
          page_key: pageFromLocation(),
          actor_name: currentUserName(),
          captured_by: 'kad-notifications-patch-v2'
        };
        var result = original.apply(this, arguments);
        return patchMutationThenable(result, ctx);
      };
      wrapped.__kad_notif_mutation_patched__ = true;
      try{ builder[method] = wrapped; }catch(_e){}
    });
    return builder;
  }
  function installSupabaseMutationPatch(sb){
    if (!sb || typeof sb.from !== 'function') return sb;
    try{ if (PATCHED_CLIENTS && PATCHED_CLIENTS.has(sb)) return sb; }catch(_e){}
    if (sb[PATCH_FLAG]) return sb;
    var originalFrom = sb.from;
    var wrappedFrom = function(table){
      var builder = originalFrom.apply(this, arguments);
      return patchTableBuilder(builder, table);
    };
    try{ wrappedFrom.__kad_original_from__ = originalFrom; }catch(_e){}
    try{ sb.from = wrappedFrom; }catch(_e){ return sb; }
    try{ Object.defineProperty(sb, PATCH_FLAG, { value:true, configurable:true }); }catch(_e){ sb[PATCH_FLAG] = true; }
    try{ if (PATCHED_CLIENTS) PATCHED_CLIENTS.add(sb); }catch(_e){}
    return sb;
  }
  var previousPatchHook = window.__KAD_PATCH_SUPABASE_CLIENT__;
  window.__KAD_PATCH_SUPABASE_CLIENT__ = function(sb){
    try{ if (typeof previousPatchHook === 'function') previousPatchHook(sb); }catch(_e){}
    return installSupabaseMutationPatch(sb);
  };

  function getClient(){
    if (client) return client;
    try{
      if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') client = window.ERPAuth.getSupabaseClient();
    }catch(_e){}
    if (!client && window.__RF_SHARED_SUPABASE__) client = window.__RF_SHARED_SUPABASE__;
    if (!client && window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function'){
      try{ client = window.createRfSupabaseClient(); }catch(_e){}
    }
    if (!client && window.supabase && typeof window.supabase.createClient === 'function'){
      var cfg = getConfig();
      var url = normText(cfg.SUPABASE_URL || cfg.supabaseUrl || window.RF_SUPABASE_URL || '');
      var key = normText(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || '');
      if (url && key){
        try{ client = window.supabase.createClient(url, key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }); }catch(_e){}
      }
    }
    try{ if (client && window.__KAD_PATCH_SUPABASE_CLIENT__) window.__KAD_PATCH_SUPABASE_CLIENT__(client); }catch(_e){}
    installSupabaseMutationPatch(client);
    return client;
  }
  async function getUser(){
    var sb = getClient();
    if (!sb || !sb.auth) return null;
    try{
      var userRes = await sb.auth.getUser();
      currentUser = userRes && userRes.data && userRes.data.user ? userRes.data.user : null;
    }catch(_e){}
    if (!currentUser){
      try{
        var sess = await sb.auth.getSession();
        currentUser = sess && sess.data && sess.data.session && sess.data.session.user ? sess.data.session.user : null;
      }catch(_e){}
    }
    currentEmail = normText(currentUser && currentUser.email).toLowerCase();
    return currentUser;
  }
  async function canViewPage(pageKey){
    pageKey = normKey(pageKey);
    if (!pageKey || pageKey === 'index') return true;
    try{
      if (window.RF_ACL && typeof window.RF_ACL.canViewPage === 'function'){
        var res = await window.RF_ACL.canViewPage(pageKey, { client:getClient(), user:currentUser });
        return !!(res && res.allowed === true);
      }
    }catch(_e){}
    try{
      if (window.ERPAuth && typeof window.ERPAuth.getPageAccess === 'function'){
        var access = await window.ERPAuth.getPageAccess(pageKey, { user:currentUser });
        return !!(access && access.permissions && access.permissions.can_view === true);
      }
    }catch(_e){}
    return true;
  }
  async function filterVisibleNotifications(items){
    var out = [];
    var cache = {};
    for (var i=0;i<(items || []).length;i++){
      var n = items[i] || {};
      var key = normKey(n.page_key || '');
      if (!key){ out.push(n); continue; }
      if (cache[key] == null) cache[key] = await canViewPage(key);
      if (cache[key]) out.push(n);
    }
    return out;
  }

  function injectStyles(){
    if (document.getElementById('kadNotificationsStyle')) return;
    var style = document.createElement('style');
    style.id = 'kadNotificationsStyle';
    style.textContent = '\n'
      + '.kad-notif-bell{position:fixed;right:12px;top:10px;bottom:auto;z-index:2147482500;display:flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:38px;padding:0 10px;border-radius:999px;border:1px solid #b7c8d7;background:#ffffff;color:#10213d;box-shadow:0 8px 22px rgba(31,72,105,.18);font:900 12px Calibri,Arial,sans-serif;cursor:pointer;box-sizing:border-box;white-space:nowrap}\n'
      + '.kad-notif-bell.kad-notif-inline{position:fixed!important;right:12px!important;top:10px!important;bottom:auto!important;z-index:2147482500!important;flex:0 0 auto;box-shadow:0 8px 22px rgba(31,72,105,.18)}\n'
      + '.kad-notif-bell:hover{background:#eef7ff}.kad-notif-bell.has-new{background:#fff0f0;border-color:#f2b8b8;color:#8f1a1a}.kad-notif-bell-icon{font-size:15px;line-height:1}.kad-notif-bell-count{display:none;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#dc2626;color:#fff;font-size:10px;line-height:18px;text-align:center}.kad-notif-bell.has-new .kad-notif-bell-count{display:inline-block}\n'
      + '.kad-notif-panel{position:fixed;right:12px;top:50px;bottom:auto;width:min(420px,calc(100vw - 28px));max-height:min(620px,calc(100vh - 72px));z-index:2147482501;display:none;flex-direction:column;overflow:hidden;border:1px solid #b7c8d7;border-radius:16px;background:#fff;box-shadow:0 22px 54px rgba(31,72,105,.28);font-family:Calibri,Arial,sans-serif;color:#10213d}.kad-notif-panel.open{display:flex}\n'
      + '.kad-notif-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#eef7ff,#e4f0fb);border-bottom:1px solid #c8d8e6}.kad-notif-title{font-size:13px;font-weight:950;text-transform:uppercase}.kad-notif-actions{display:flex;align-items:center;gap:6px}.kad-notif-action{height:24px;border:1px solid #b7c8d7;border-radius:8px;background:#fff;color:#244967;font-size:10px;font-weight:900;cursor:pointer}.kad-notif-action.primary{background:#2f6fa9;color:#fff;border-color:#285f91}.kad-notif-action.danger{background:#fff0f0;color:#8f1a1a;border-color:#f2b8b8}.kad-notif-action.danger:hover{background:#fee2e2}.kad-notif-action:hover{filter:brightness(.98)}\n'
      + '.kad-notif-list{overflow:auto;max-height:540px;background:#f7fbff;padding:8px}.kad-notif-item{border:1px solid #d6e3ef;border-radius:12px;background:#fff;margin:0 0 8px 0;padding:9px 10px;box-shadow:0 3px 10px rgba(31,72,105,.07)}.kad-notif-item.unread{border-color:#f2b8b8;background:#fffafa;box-shadow:inset 3px 0 0 #dc2626,0 3px 10px rgba(31,72,105,.07)}.kad-notif-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}.kad-notif-item-title{font-size:12px;font-weight:950;color:#071b2f;margin:0;line-height:1.15;min-width:0}.kad-notif-delete{height:21px;min-width:54px;border:1px solid #f2b8b8;border-radius:8px;background:#fff0f0;color:#8f1a1a;font-size:9px;font-weight:950;cursor:pointer;flex:0 0 auto;padding:0 7px}.kad-notif-delete:hover{background:#fee2e2}.kad-notif-item-msg{font-size:11px;font-weight:800;color:#40586f;line-height:1.25;white-space:normal}.kad-notif-meta{margin-top:6px;font-size:9.5px;font-weight:850;color:#7b8fa3}.kad-notif-empty{padding:22px;text-align:center;color:#60778e;font-weight:900;font-size:12px;border:1px dashed #cbd9e6;border-radius:12px;background:#fff}\n'
      + '.kad-notif-toast{position:fixed;right:12px;top:50px;bottom:auto;z-index:2147482600;max-width:min(380px,calc(100vw - 28px));border:1px solid #f2b8b8;border-radius:14px;background:#fffafa;color:#10213d;box-shadow:0 18px 42px rgba(31,72,105,.24);padding:10px 12px;font:900 12px Calibri,Arial,sans-serif;display:none}.kad-notif-toast.show{display:block;animation:kadNotifIn .18s ease-out}.kad-notif-toast-title{color:#8f1a1a;font-weight:950;margin-bottom:3px}.kad-notif-toast-msg{font-size:11px;color:#40586f;line-height:1.25}\n'
      + '.kad-notif-inline-host{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:nowrap!important}\n'
      + '@keyframes kadNotifIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}\n'
      + '@media(max-width:700px){.kad-notif-bell{right:8px;top:8px;height:30px}.kad-notif-panel{right:8px;top:46px;width:calc(100vw - 16px);max-height:calc(100vh - 62px)}.kad-notif-toast{right:8px;top:46px}}\n';
    document.head.appendChild(style);
  }
  function isVisibleBox(el){
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 18) return false;
    var st = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (st && (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity || 1) === 0)) return false;
    return true;
  }
  function findNotificationInlineHost(){
    var selectors = [
      '.top-actions', '.header-actions', '.page-actions', '.toolbar-actions', '.action-buttons',
      '.controls .actions', '.controls', '.topbar', '.toolbar', '.page-toolbar', '.header', 'header',
      '.kad-shell-header', '.kad-shell-topbar', '.kad-shell-toolbar', '.kad-nav-header'
    ];
    for (var i=0;i<selectors.length;i++){
      var list = Array.prototype.slice.call(document.querySelectorAll(selectors[i]));
      for (var j=0;j<list.length;j++){
        var host = list[j];
        if (!host || host.closest('.kad-notif-panel') || host.closest('.kad-notif-toast')) continue;
        if (!isVisibleBox(host)) continue;
        var r = host.getBoundingClientRect();
        if (r.top < -4 || r.top > 130 || r.width < 160) continue;
        return host;
      }
    }
    return null;
  }
  function rectsOverlap(a,b){
    return !!(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
  }
  function getTopInteractiveRects(){
    var selectors = 'button,a,input,select,textarea,[role="button"],.ghost-btn,.back-btn,.btn,.button,.top-actions,.controls,.toolbar,.topbar,.page-actions,.header-actions';
    var out = [];
    var candidates = Array.prototype.slice.call(document.querySelectorAll(selectors));
    for (var i=0;i<candidates.length;i++){
      var el = candidates[i];
      if (!el || el === els.bell || (els.bell && els.bell.contains(el)) || (els.panel && els.panel.contains(el)) || (els.toast && els.toast.contains(el))) continue;
      if (el.closest && (el.closest('.kad-notif-panel') || el.closest('.kad-notif-toast'))) continue;
      if (!isVisibleBox(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.top > 150 || r.bottom < 0) continue;
      out.push(r);
    }
    return out;
  }
  function virtualBellRect(top, right, w, h){
    var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    return { left: vw - right - w, right: vw - right, top: top, bottom: top + h, width: w, height: h };
  }
  function placeFloatingBellSafely(){
    if (!els.bell) return;
    var bell = els.bell;
    bell.classList.remove('kad-notif-inline');
    var right = 12;
    var top = 10;
    var w = Math.max(38, bell.offsetWidth || 38);
    var h = Math.max(30, bell.offsetHeight || 32);
    var rects = getTopInteractiveRects();
    function overlapsAny(y){
      var b = virtualBellRect(y, right, w, h);
      for (var i=0;i<rects.length;i++) if (rectsOverlap(b, rects[i])) return rects[i];
      return null;
    }
    var hit = overlapsAny(top);
    if (hit){
      top = Math.min(150, Math.max(46, hit.bottom + 8));
      for (var pass=0; pass<24; pass++){
        hit = overlapsAny(top);
        if (!hit) break;
        top = Math.min(150, Math.max(top + 6, hit.bottom + 8));
      }
      if (overlapsAny(top)){
        for (var y=8; y<=160; y+=4){
          if (!overlapsAny(y)){ top = y; break; }
        }
      }
    }
    bell.style.position = 'fixed';
    bell.style.right = right + 'px';
    bell.style.top = top + 'px';
    bell.style.bottom = 'auto';
    if (els.panel){
      els.panel.style.right = right + 'px';
      els.panel.style.top = Math.min(top + 40, Math.max(46, (window.innerHeight || 700) - 90)) + 'px';
      els.panel.style.bottom = 'auto';
    }
    if (els.toast){
      els.toast.style.right = right + 'px';
      els.toast.style.top = Math.min(top + 40, Math.max(46, (window.innerHeight || 700) - 90)) + 'px';
      els.toast.style.bottom = 'auto';
    }
  }
  function dockNotificationBell(){
    if (!els.bell) return;
    placeFloatingBellSafely();
  }
  function buildUi(){
    if (uiReady || isExcludedPage()) return;
    injectStyles();
    var bell = document.createElement('button');
    bell.type = 'button';
    bell.className = 'kad-notif-bell';
    bell.setAttribute('aria-label', 'Notificări K.A.D');
    bell.innerHTML = '<span class="kad-notif-bell-icon">🔔</span><span class="kad-notif-bell-count">0</span>';

    var panel = document.createElement('div');
    panel.className = 'kad-notif-panel';
    panel.innerHTML = '<div class="kad-notif-head"><div><div class="kad-notif-title">Notificări</div></div><div class="kad-notif-actions"><button type="button" class="kad-notif-action" data-kad-notif-refresh>Refresh</button><button type="button" class="kad-notif-action primary" data-kad-notif-read>Marchează văzut</button><button type="button" class="kad-notif-action danger" data-kad-notif-delete-all>Șterge toate</button></div></div><div class="kad-notif-list"><div class="kad-notif-empty">Se încarcă notificările...</div></div>';

    var toast = document.createElement('div');
    toast.className = 'kad-notif-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.innerHTML = '<div class="kad-notif-toast-title"></div><div class="kad-notif-toast-msg"></div>';

    document.body.appendChild(bell);
    document.body.appendChild(panel);
    document.body.appendChild(toast);
    els.bell = bell;
    els.count = bell.querySelector('.kad-notif-bell-count');
    els.panel = panel;
    els.list = panel.querySelector('.kad-notif-list');
    els.toast = toast;
    els.toastTitle = toast.querySelector('.kad-notif-toast-title');
    els.toastMsg = toast.querySelector('.kad-notif-toast-msg');
    uiReady = true;
    dockNotificationBell();
    window.setTimeout(dockNotificationBell, 250);
    window.setTimeout(dockNotificationBell, 1000);
    window.addEventListener('resize', function(){ window.setTimeout(dockNotificationBell, 50); });

    bell.addEventListener('click', function(){ togglePanel(); });
    panel.querySelector('[data-kad-notif-refresh]').addEventListener('click', function(){ fetchNotifications(true); });
    panel.querySelector('[data-kad-notif-read]').addEventListener('click', function(){ markAllVisibleRead(); });
    panel.querySelector('[data-kad-notif-delete-all]').addEventListener('click', function(){ deleteAllVisibleForMe(); });
    els.list.addEventListener('click', function(ev){
      var del = ev.target && ev.target.closest ? ev.target.closest('[data-kad-notif-delete]') : null;
      if (del){
        ev.preventDefault();
        ev.stopPropagation();
        deleteNotificationForMe(del.getAttribute('data-kad-notif-delete'));
        return;
      }
      var item = ev.target && ev.target.closest ? ev.target.closest('[data-kad-notif-id]') : null;
      if (item) markOneRead(item.getAttribute('data-kad-notif-id'));
    });
    document.addEventListener('click', function(ev){
      if (!isOpen) return;
      if (panel.contains(ev.target) || bell.contains(ev.target)) return;
      closePanel();
    });
  }
  function togglePanel(){
    if (!uiReady) return;
    isOpen = !isOpen;
    els.panel.classList.toggle('open', isOpen);
    if (isOpen) fetchNotifications(true);
  }
  function closePanel(){
    isOpen = false;
    if (els.panel) els.panel.classList.remove('open');
  }
  function updateBell(){
    if (!uiReady) return;
    var count = unreadIds.size;
    els.bell.classList.toggle('has-new', count > 0);
    els.count.textContent = String(count > 99 ? '99+' : count);
  }
  function formatDate(iso){
    if (!iso) return '';
    try{
      var d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('ro-RO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    }catch(_e){ return ''; }
  }
  function renderList(){
    if (!uiReady) return;
    var items = allNotifications || [];
    if (!items.length){
      els.list.innerHTML = '<div class="kad-notif-empty">Nu există notificări noi.</div>';
      updateBell();
      return;
    }
    els.list.innerHTML = items.map(function(n){
      var id = normText(n.id);
      var unread = unreadIds.has(id);
      var meta = [pageNameFor(n.page_key || ''), formatDate(n.created_at || n.createdAt), actorNameForNotification(n)].filter(Boolean).join(' • ');
      var url = n.page_key ? (normKey(n.page_key) + '.html') : '';
      return '<div class="kad-notif-item ' + (unread ? 'unread' : '') + '" data-kad-notif-id="' + escapeHtml(id) + '">'
        + '<div class="kad-notif-item-top"><div class="kad-notif-item-title">' + escapeHtml(n.title || 'Notificare K.A.D') + '</div></div>'
        + '<div class="kad-notif-item-msg">' + escapeHtml(messageForNotification(n)) + '</div>'
        + '<div class="kad-notif-meta">' + escapeHtml(meta) + (url ? ' • ' + escapeHtml(url) : '') + '</div>'
        + '</div>';
    }).join('');
    updateBell();
  }
  function showToast(n){
    if (!uiReady || !n) return;
    els.toastTitle.textContent = n.title || 'Notificare K.A.D';
    els.toastMsg.textContent = messageForNotification(n);
    els.toast.classList.add('show');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function(){ if(els.toast) els.toast.classList.remove('show'); }, 6500);
  }
  async function fetchReadStates(ids){
    var empty = { read:new Set(), deleted:new Set() };
    if (!ids.length || !currentEmail) return empty;
    var sb = getClient();
    if (!sb) return empty;
    try{
      var res = await sb.from(READS_TABLE).select('notification_id,read_at,deleted_at').eq('user_email', currentEmail).in('notification_id', ids);
      if (res.error) throw res.error;
      var read = new Set();
      var deleted = new Set();
      (res.data || []).forEach(function(row){
        var id = normText(row.notification_id);
        if (!id) return;
        if (row.deleted_at) deleted.add(id);
        else if (row.read_at != null) read.add(id);
      });
      return { read:read, deleted:deleted };
    }catch(_e){
      try{
        var fallback = await sb.from(READS_TABLE).select('notification_id,read_at').eq('user_email', currentEmail).in('notification_id', ids);
        if (fallback.error) return empty;
        return {
          read:new Set((fallback.data || []).map(function(row){ return normText(row.notification_id); }).filter(Boolean)),
          deleted:new Set()
        };
      }catch(_e2){ return empty; }
    }
  }
  async function fetchNotifications(force){
    if (!currentEmail) await getUser();
    var sb = getClient();
    if (!sb || !currentEmail) return;
    var t = Date.now();
    if (!force && t - lastFetchAt < REFRESH_MIN_MS) return;
    lastFetchAt = t;
    try{
      var res = await sb.from(NOTIF_TABLE).select('id,page_key,page_name,category,type,title,message,details,entity_key,created_by_email,created_by_name,created_at').order('created_at', { ascending:false }).limit(LIST_LIMIT);
      if (res.error) throw res.error;
      var visible = await filterVisibleNotifications(res.data || []);
      var ids = visible.map(function(n){ return normText(n.id); }).filter(Boolean);
      var states = await fetchReadStates(ids);
      visible = visible.filter(function(n){ return !states.deleted.has(normText(n.id)); });
      allNotifications = visible;
      var keptIds = visible.map(function(n){ return normText(n.id); }).filter(Boolean);
      unreadIds = new Set(keptIds.filter(function(id){ return !states.read.has(id); }));
      renderList();
    }catch(e){
      if (uiReady) els.list.innerHTML = '<div class="kad-notif-empty">Notificările nu sunt active încă. Verifică dacă tabelele Supabase au fost create.</div>';
      updateBell();
    }
  }
  async function markAllVisibleRead(){
    if (!currentEmail) await getUser();
    var sb = getClient();
    if (!sb || !currentEmail || !unreadIds.size) return;
    var rows = Array.from(unreadIds).map(function(id){ return { notification_id:id, user_email:currentEmail, read_at:nowIso() }; });
    try{ await sb.from(READS_TABLE).upsert(rows, { onConflict:'notification_id,user_email' }); }catch(_e){}
    unreadIds.clear();
    renderList();
  }
  async function markOneRead(id){
    id = normText(id);
    if (!id || !currentEmail) return;
    var sb = getClient();
    if (!sb) return;
    try{ await sb.from(READS_TABLE).upsert({ notification_id:id, user_email:currentEmail, read_at:nowIso() }, { onConflict:'notification_id,user_email' }); }catch(_e){}
    unreadIds.delete(id);
    renderList();
  }
  async function deleteNotificationForMe(id){
    id = normText(id);
    if (!id) return;
    if (!currentEmail) await getUser();
    var sb = getClient();
    if (!sb || !currentEmail) return;
    var ts = nowIso();
    try{
      var res = await sb.from(READS_TABLE).upsert({ notification_id:id, user_email:currentEmail, read_at:ts, deleted_at:ts }, { onConflict:'notification_id,user_email' });
      if (res && res.error) throw res.error;
      unreadIds.delete(id);
      allNotifications = (allNotifications || []).filter(function(n){ return normText(n.id) !== id; });
      renderList();
    }catch(e){
      try{ window.alert('Nu am putut șterge notificarea. Verifică dacă SQL-ul pentru deleted_at a fost rulat.'); }catch(_e){}
    }
  }

  async function deleteAllVisibleForMe(){
    if (!currentEmail) await getUser();
    var sb = getClient();
    if (!sb || !currentEmail) return;
    var ids = (allNotifications || []).map(function(n){ return normText(n && n.id); }).filter(Boolean);
    if (!ids.length) return;
    var ok = true;
    try{
      ok = window.confirm('Ștergi toate notificările afișate pentru contul tău? Ele rămân în istoric pentru audit.');
    }catch(_e){ ok = true; }
    if (!ok) return;
    var ts = nowIso();
    var rows = ids.map(function(id){ return { notification_id:id, user_email:currentEmail, read_at:ts, deleted_at:ts }; });
    try{
      var res = await sb.from(READS_TABLE).upsert(rows, { onConflict:'notification_id,user_email' });
      if (res && res.error) throw res.error;
      unreadIds.clear();
      allNotifications = [];
      renderList();
    }catch(e){
      try{ window.alert('Nu am putut șterge toate notificările. Verifică dacă SQL-ul pentru deleted_at a fost rulat.'); }catch(_e){}
    }
  }
  async function createNotification(input, options){
    options = options || {};
    var sb = getClient();
    if (!sb) return null;
    if (!currentEmail) await getUser();
    await resolveCurrentDisplayName(false);
    var n = Object.assign({}, input || {});
    var explicitActor = normText(n.actor_name || n.created_by_name || '');
    if (!explicitActor && n.actor_pin) explicitActor = await resolveActorNameFromMap(currentEmail, n.actor_pin);
    n.page_key = normKey(n.page_key || pageFromLocation());
    n.page_name = normText(n.page_name) || pageNameFor(n.page_key);
    n.category = normText(n.category) || 'general';
    n.type = normText(n.type) || 'save';
    n.title = normText(n.title) || ('Modificare în ' + n.page_name);
    n.message = normText(n.message) || ((explicitActor || currentUserName()) + ' a salvat date în ' + n.page_name + '.');
    n.details = n.details && typeof n.details === 'object' ? n.details : (n.details ? { text:String(n.details) } : {});
    n.entity_key = normText(n.entity_key || n.source_doc_key || '');
    n.created_by_email = currentEmail || null;
    n.created_by_name = sanitizeDisplayName(explicitActor || currentUserName(), currentEmail);
    n.created_at = nowIso();
    if (!n.source_table) n.source_table = normText(n.details && n.details.source_table) || null;
    if (!n.source_doc_key) n.source_doc_key = normText(n.details && n.details.source_doc_key) || null;
    try{
      var res = await sb.from(NOTIF_TABLE).insert(n).select('id,page_key,page_name,category,type,title,message,details,entity_key,created_by_email,created_by_name,created_at').single();
      if (res.error) throw res.error;
      if (options.local === true && res.data) handleIncoming(res.data, false);
      return res.data || null;
    }catch(e){
      try{ console.warn('[KAD Notifications] Inserarea notificării a eșuat:', e && e.message ? e.message : e); }catch(_e){}
      return null;
    }
  }
  async function captureMutation(ctx){
    if (shouldSkipMutation(ctx)) return;
    await getUser();
    if (!currentEmail) return;
    await resolveCurrentDisplayName(false);
    ctx = ctx || {};
    ctx.actor_name = await resolveActorNameFromContext(ctx);
    var n = inferNotificationFromMutation(ctx || {});
    if (!n.page_key) return;
    var allowed = await canViewPage(n.page_key);
    if (!allowed) return;
    schedulePageAutoNotification(n, ctx);
  }
  async function handleIncoming(n, fromRealtime){
    if (!n || !normText(n.id)) return;
    await getUser();
    if (n.created_by_email && currentEmail && normText(n.created_by_email).toLowerCase() === currentEmail.toLowerCase() && fromRealtime) return;
    var visible = await filterVisibleNotifications([n]);
    if (!visible.length) return;
    var exists = allNotifications.some(function(item){ return normText(item.id) === normText(n.id); });
    if (!exists){
      allNotifications.unshift(n);
      allNotifications = allNotifications.slice(0, LIST_LIMIT);
    }
    unreadIds.add(normText(n.id));
    renderList();
    if (fromRealtime) showToast(n);
  }
  function startRealtime(){
    var sb = getClient();
    if (!sb || typeof sb.channel !== 'function' || realtimeChannel) return;
    try{
      realtimeChannel = sb.channel('kad-global-notifications-' + (currentUser && currentUser.id || currentEmail || 'user'))
        .on('postgres_changes', { event:'INSERT', schema:'public', table:NOTIF_TABLE }, function(payload){
          handleIncoming(payload && payload.new, true);
        })
        .subscribe();
    }catch(e){
      realtimeChannel = null;
    }
  }
  async function flushQueuedMutations(){
    var queue = window.__KAD_NOTIFICATION_QUEUE__ || [];
    window.__KAD_NOTIFICATION_QUEUE__ = [];
    for (var i=0;i<queue.length;i++){
      try{ await captureMutation(queue[i]); }catch(_e){}
    }
  }
  async function init(){
    if (initialized || isExcludedPage()) return;
    initialized = true;
    buildUi();
    await getUser();
    if (!currentEmail) return;
    await resolveCurrentDisplayName(false);
    await fetchNotifications(true);
    startRealtime();
    await flushQueuedMutations();
    window.addEventListener('focus', function(){ fetchNotifications(false); });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) fetchNotifications(false); });
  }

  window.KAD_NOTIFICATIONS = {
    init:init,
    refresh:function(){ return fetchNotifications(true); },
    markAllRead:markAllVisibleRead,
    markRead:markOneRead,
    deleteForMe:deleteNotificationForMe,
    deleteAllForMe:deleteAllVisibleForMe,
    notify:createNotification,
    captureMutation:captureMutation,
    flushGroupedNotifications:function(){ pendingPageNotifications.forEach(function(_value, key){ flushPendingPageNotification(key); }); },
    refreshDisplayName:function(){ return resolveCurrentDisplayName(true); },
    setActorName:function(name, persist){
      currentActorNameOverride = sanitizeDisplayName(name, currentEmail);
      currentDisplayName = currentActorNameOverride;
      try{ (persist === true ? window.localStorage : window.sessionStorage).setItem('kad_actor_name', currentActorNameOverride); }catch(_e){}
      return currentActorNameOverride;
    },
    setActorPin:function(pin, persist){
      currentActorPin = normText(pin);
      try{ (persist === true ? window.localStorage : window.sessionStorage).setItem('kad_actor_pin', currentActorPin); }catch(_e){}
      return resolveCurrentDisplayName(true);
    },
    clearActor:function(){
      currentActorNameOverride = ''; currentActorPin = ''; currentDisplayName = '';
      try{ window.sessionStorage.removeItem('kad_actor_name'); window.sessionStorage.removeItem('kad_actor_pin'); }catch(_e){}
      try{ window.localStorage.removeItem('kad_actor_name'); window.localStorage.removeItem('kad_actor_pin'); }catch(_e){}
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})(window, document);
