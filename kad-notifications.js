/* K.A.D global notifications - live, creat doar la salvare/modificare. */
(function(window, document){
  'use strict';
  if (window.__KAD_NOTIFICATIONS_READY__) return;
  window.__KAD_NOTIFICATIONS_READY__ = true;

  var NOTIF_TABLE = 'kad_notifications';
  var READS_TABLE = 'kad_notification_reads';
  var REFRESH_MIN_MS = 15000;
  var LIST_LIMIT = 80;
  var realtimeChannel = null;
  var client = null;
  var currentUser = null;
  var currentEmail = '';
  var initialized = false;
  var uiReady = false;
  var lastFetchAt = 0;
  var unreadIds = new Set();
  var allNotifications = [];
  var recentAutoNotifications = new Map();
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
    else if (method === 'upsert') actionWord = 'salvat/modificat date';
    else if (method === 'delete') actionWord = 'șters date';

    var actor = currentUserName();
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
  function currentUserName(){
    var meta = currentUser && (currentUser.user_metadata || currentUser.raw_user_meta_data || {});
    var name = normText(meta && (meta.full_name || meta.name || meta.display_name));
    if (name) return name;
    return currentEmail || 'Utilizator';
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
      + '.kad-notif-bell{position:fixed;right:14px;top:12px;z-index:2147482500;display:flex;align-items:center;gap:6px;height:32px;min-width:38px;padding:0 10px;border-radius:999px;border:1px solid #b7c8d7;background:#ffffff;color:#10213d;box-shadow:0 8px 22px rgba(31,72,105,.18);font:900 12px Calibri,Arial,sans-serif;cursor:pointer}\n'
      + '.kad-notif-bell:hover{background:#eef7ff}.kad-notif-bell.has-new{background:#fff0f0;border-color:#f2b8b8;color:#8f1a1a}.kad-notif-bell-icon{font-size:15px;line-height:1}.kad-notif-bell-count{display:none;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#dc2626;color:#fff;font-size:10px;line-height:18px;text-align:center}.kad-notif-bell.has-new .kad-notif-bell-count{display:inline-block}\n'
      + '.kad-notif-panel{position:fixed;right:14px;top:50px;width:min(420px,calc(100vw - 28px));max-height:min(620px,calc(100vh - 70px));z-index:2147482501;display:none;flex-direction:column;overflow:hidden;border:1px solid #b7c8d7;border-radius:16px;background:#fff;box-shadow:0 22px 54px rgba(31,72,105,.28);font-family:Calibri,Arial,sans-serif;color:#10213d}.kad-notif-panel.open{display:flex}\n'
      + '.kad-notif-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#eef7ff,#e4f0fb);border-bottom:1px solid #c8d8e6}.kad-notif-title{font-size:13px;font-weight:950;text-transform:uppercase}.kad-notif-actions{display:flex;align-items:center;gap:6px}.kad-notif-action{height:24px;border:1px solid #b7c8d7;border-radius:8px;background:#fff;color:#244967;font-size:10px;font-weight:900;cursor:pointer}.kad-notif-action.primary{background:#2f6fa9;color:#fff;border-color:#285f91}.kad-notif-action:hover{filter:brightness(.98)}\n'
      + '.kad-notif-list{overflow:auto;max-height:540px;background:#f7fbff;padding:8px}.kad-notif-item{border:1px solid #d6e3ef;border-radius:12px;background:#fff;margin:0 0 8px 0;padding:9px 10px;box-shadow:0 3px 10px rgba(31,72,105,.07)}.kad-notif-item.unread{border-color:#f2b8b8;background:#fffafa;box-shadow:inset 3px 0 0 #dc2626,0 3px 10px rgba(31,72,105,.07)}.kad-notif-item-title{font-size:12px;font-weight:950;color:#071b2f;margin-bottom:3px}.kad-notif-item-msg{font-size:11px;font-weight:800;color:#40586f;line-height:1.25;white-space:normal}.kad-notif-meta{margin-top:6px;font-size:9.5px;font-weight:850;color:#7b8fa3}.kad-notif-empty{padding:22px;text-align:center;color:#60778e;font-weight:900;font-size:12px;border:1px dashed #cbd9e6;border-radius:12px;background:#fff}\n'
      + '.kad-notif-toast{position:fixed;right:14px;top:52px;z-index:2147482600;max-width:min(380px,calc(100vw - 28px));border:1px solid #f2b8b8;border-radius:14px;background:#fffafa;color:#10213d;box-shadow:0 18px 42px rgba(31,72,105,.24);padding:10px 12px;font:900 12px Calibri,Arial,sans-serif;display:none}.kad-notif-toast.show{display:block;animation:kadNotifIn .18s ease-out}.kad-notif-toast-title{color:#8f1a1a;font-weight:950;margin-bottom:3px}.kad-notif-toast-msg{font-size:11px;color:#40586f;line-height:1.25}\n'
      + '@keyframes kadNotifIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}\n'
      + '@media(max-width:700px){.kad-notif-bell{right:8px;top:8px;height:30px}.kad-notif-panel{right:8px;top:44px;width:calc(100vw - 16px)}}\n';
    document.head.appendChild(style);
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
    panel.innerHTML = '<div class="kad-notif-head"><div><div class="kad-notif-title">Notificări</div></div><div class="kad-notif-actions"><button type="button" class="kad-notif-action" data-kad-notif-refresh>Refresh</button><button type="button" class="kad-notif-action primary" data-kad-notif-read>Marchează văzut</button></div></div><div class="kad-notif-list"><div class="kad-notif-empty">Se încarcă notificările...</div></div>';

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

    bell.addEventListener('click', function(){ togglePanel(); });
    panel.querySelector('[data-kad-notif-refresh]').addEventListener('click', function(){ fetchNotifications(true); });
    panel.querySelector('[data-kad-notif-read]').addEventListener('click', function(){ markAllVisibleRead(); });
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
      var meta = [pageNameFor(n.page_key || ''), formatDate(n.created_at || n.createdAt), normText(n.created_by_name || n.created_by_email || '')].filter(Boolean).join(' • ');
      var url = n.page_key ? (normKey(n.page_key) + '.html') : '';
      return '<div class="kad-notif-item ' + (unread ? 'unread' : '') + '" data-kad-notif-id="' + escapeHtml(id) + '">'
        + '<div class="kad-notif-item-title">' + escapeHtml(n.title || 'Notificare K.A.D') + '</div>'
        + '<div class="kad-notif-item-msg">' + escapeHtml(n.message || '') + '</div>'
        + '<div class="kad-notif-meta">' + escapeHtml(meta) + (url ? ' • ' + escapeHtml(url) : '') + '</div>'
        + '</div>';
    }).join('');
    updateBell();
  }
  function showToast(n){
    if (!uiReady || !n) return;
    els.toastTitle.textContent = n.title || 'Notificare K.A.D';
    els.toastMsg.textContent = n.message || '';
    els.toast.classList.add('show');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function(){ if(els.toast) els.toast.classList.remove('show'); }, 6500);
  }
  async function fetchReads(ids){
    if (!ids.length || !currentEmail) return new Set();
    var sb = getClient();
    if (!sb) return new Set();
    try{
      var res = await sb.from(READS_TABLE).select('notification_id').eq('user_email', currentEmail).in('notification_id', ids);
      if (res.error) return new Set();
      return new Set((res.data || []).map(function(row){ return normText(row.notification_id); }).filter(Boolean));
    }catch(_e){ return new Set(); }
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
      allNotifications = visible;
      var ids = visible.map(function(n){ return normText(n.id); }).filter(Boolean);
      var reads = await fetchReads(ids);
      unreadIds = new Set(ids.filter(function(id){ return !reads.has(id); }));
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
  async function createNotification(input, options){
    options = options || {};
    var sb = getClient();
    if (!sb) return null;
    if (!currentEmail) await getUser();
    var n = Object.assign({}, input || {});
    n.page_key = normKey(n.page_key || pageFromLocation());
    n.page_name = normText(n.page_name) || pageNameFor(n.page_key);
    n.category = normText(n.category) || 'general';
    n.type = normText(n.type) || 'save';
    n.title = normText(n.title) || ('Modificare în ' + n.page_name);
    n.message = normText(n.message) || (currentUserName() + ' a salvat date în ' + n.page_name + '.');
    n.details = n.details && typeof n.details === 'object' ? n.details : (n.details ? { text:String(n.details) } : {});
    n.entity_key = normText(n.entity_key || n.source_doc_key || '');
    n.created_by_email = currentEmail || null;
    n.created_by_name = currentUserName();
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
    var n = inferNotificationFromMutation(ctx || {});
    if (!n.page_key) return;
    if (isDuplicateAuto(n)) return;
    var allowed = await canViewPage(n.page_key);
    if (!allowed) return;
    await createNotification(n, { local:false });
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
    notify:createNotification,
    captureMutation:captureMutation
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})(window, document);
