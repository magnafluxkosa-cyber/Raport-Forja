(function(window){
  'use strict';

  var ARCHIVE_VERSION = '2.0.0-safe';
  var AUDIT_TABLE = 'kad_audit_log';
  var VERSION_TABLE = 'kad_document_versions';
  var MAX_JSON_CHARS = 180000;

  function norm(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function lower(v){ return norm(v).toLowerCase(); }
  function nowIso(){ return new Date().toISOString(); }
  function toInt(v, fallback){ var n = parseInt(v, 10); return isFinite(n) ? n : (fallback || 0); }
  function safeCall(fn){ try{ return fn(); }catch(_e){ return null; } }
  function cfg(){ return window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {}; }

  function createClient(){
    if(window.__RF_SHARED_SUPABASE__) return window.__RF_SHARED_SUPABASE__;
    if(window.__KAD_SECURITY_SUPABASE__) return window.__KAD_SECURITY_SUPABASE__;
    if(window.createRfSupabaseClient) {
      var existing = safeCall(function(){ return window.createRfSupabaseClient(); });
      if(existing) return existing;
    }
    if(!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    var c = cfg();
    var url = norm(c.SUPABASE_URL || c.supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '');
    var key = norm(c.SUPABASE_ANON_KEY || c.supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '');
    if(!url || !key) return null;
    window.__RF_SHARED_SUPABASE__ = window.supabase.createClient(url, key, {
      auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
    return window.__RF_SHARED_SUPABASE__;
  }

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value == null ? null : value)); }
    catch(_e){ return value == null ? null : value; }
  }
  function compactJson(value, maxChars){
    var raw = 'null';
    try{ raw = JSON.stringify(value == null ? null : value); }catch(_e){ raw = 'null'; }
    if(raw.length <= (maxChars || MAX_JSON_CHARS)) {
      try{ return JSON.parse(raw); }catch(_e){ return value == null ? null : value; }
    }
    return {
      _kad_compact_snapshot:true,
      original_json_chars:raw.length,
      preview:raw.slice(0, 12000)
    };
  }
  function byteLen(value){
    var raw = '';
    try{ raw = JSON.stringify(value == null ? null : value); }catch(_e){ raw = String(value == null ? '' : value); }
    try{ return new Blob([raw]).size; }catch(_e){ return raw.length; }
  }
  function stableStringify(value){
    var seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    function walk(v){
      if(v === null || typeof v !== 'object') return v;
      if(seen){ if(seen.has(v)) return '[Circular]'; seen.add(v); }
      if(Array.isArray(v)) return v.map(walk);
      var out = {};
      Object.keys(v).sort().forEach(function(k){ out[k] = walk(v[k]); });
      return out;
    }
    try{ return JSON.stringify(walk(value)); }catch(_e){ return JSON.stringify(value == null ? null : String(value)); }
  }
  async function sha256(value){
    var text = typeof value === 'string' ? value : stableStringify(value);
    try{
      if(window.crypto && window.crypto.subtle && window.TextEncoder){
        var data = new TextEncoder().encode(text);
        var hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.prototype.map.call(new Uint8Array(hash), function(b){ return b.toString(16).padStart(2,'0'); }).join('');
      }
    }catch(_e){}
    var h = 0;
    for(var i=0;i<text.length;i+=1){ h = ((h << 5) - h + text.charCodeAt(i)) | 0; }
    return 'fallback-' + Math.abs(h).toString(16);
  }

  function normalizePageKey(v){
    return lower(v).replace(/^\.\//,'').replace(/\.html$/,'') || 'unknown';
  }
  function pickDocumentKey(row){
    row = row || {};
    return norm(row.document_id || row.document_key || row.report_id || row.doc_id || row.id || row.uuid) || ('doc-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  }
  function makeDocumentNo(row, prefix){
    row = row || {};
    if(norm(row.document_no)) return norm(row.document_no);
    var year = norm(row.an || row.year || '') || String(new Date().getFullYear());
    var id = norm(row.id || row.document_id || row.document_key || '') || Math.random().toString(16).slice(2);
    var shortId = id.replace(/[^a-zA-Z0-9]/g,'').slice(0,8).toUpperCase() || String(Date.now()).slice(-8);
    return (prefix || 'DOC') + '-' + year + '-' + shortId;
  }
  function deviceInfo(){
    var nav = window.navigator || {};
    return [norm(nav.platform), norm(nav.userAgent)].filter(Boolean).join(' | ').slice(0, 900);
  }
  async function currentUser(sb, provided){
    if(provided && (provided.id || provided.email)) return provided;
    try{
      sb = sb || createClient();
      if(!sb || !sb.auth || typeof sb.auth.getUser !== 'function') return null;
      var res = await sb.auth.getUser();
      return res && res.data && res.data.user ? res.data.user : null;
    }catch(_e){ return null; }
  }
  function userEmail(user){ return lower(user && user.email); }
  function userName(user){
    var meta = (user && (user.user_metadata || user.raw_user_meta_data)) || {};
    return norm(meta.full_name || meta.name || meta.display_name || userEmail(user));
  }

  async function prepareDocumentRow(options){
    options = options || {};
    var row = clone(options.row || {});
    var oldData = options.oldData || null;
    var user = await currentUser(options.sb, options.user);
    var id = pickDocumentKey(row);
    var versionNo = oldData ? (toInt(oldData.version_no || oldData.revision_no || oldData.audit_version || oldData.__archive_version, 0) + 1) : 1;
    row.id = row.id || id;
    row.document_id = norm(row.document_id || id);
    row.document_key = norm(row.document_key || row.document_id);
    row.document_no = makeDocumentNo(oldData || row, options.documentPrefix || 'DOC');
    row.version_no = versionNo;
    row.revision_no = versionNo;
    row.audit_version = versionNo;
    row.document_status = norm(row.document_status || row.status || (oldData && (oldData.document_status || oldData.status)) || 'Salvat');
    row.status = row.document_status;
    row.created_at = norm(oldData && oldData.created_at) || norm(row.created_at) || nowIso();
    row.created_by = norm(oldData && oldData.created_by) || norm(row.created_by) || norm(user && user.id);
    row.created_by_email = norm(oldData && oldData.created_by_email) || norm(row.created_by_email) || userEmail(user);
    row.updated_at = nowIso();
    row.updated_by = norm(user && user.id);
    row.updated_by_email = userEmail(user);
    row.archive_controlled = true;
    return row;
  }

  async function saveVersion(options){
    options = options || {};
    var sb = options.sb || createClient();
    if(!sb || typeof sb.from !== 'function') return { ok:false, skipped:true, reason:'no_supabase_client' };
    var user = await currentUser(sb, options.user);
    var data = compactJson(options.data || options.row || options.newData || {});
    var pageKey = normalizePageKey(options.pageKey || data.page_key || 'unknown');
    var documentKey = norm(options.documentId || data.document_key || data.document_id || data.id || pickDocumentKey(data));
    var versionNo = toInt(options.versionNo || data.version_no || data.revision_no || data.audit_version, 1);
    var action = norm(options.action || 'CHANGE').toUpperCase();
    var rawForHash = stableStringify(data);
    var row = {
      document_key: documentKey,
      document_no: norm(options.documentNo || data.document_no || makeDocumentNo(data, options.documentPrefix || 'DOC')),
      document_type: norm(options.documentType || data.document_type || pageKey),
      page_key: pageKey,
      version_no: versionNo,
      source_table: norm(options.sourceTable || options.tableName || ''),
      action: action,
      status: norm(options.status || data.document_status || data.status || 'Salvat'),
      reason: norm(options.reason || options.changeReason || ''),
      snapshot_hash: await sha256(rawForHash),
      payload_bytes: byteLen(data),
      created_by: user && user.id ? user.id : null,
      created_by_email: userEmail(user) || null,
      snapshot_data: data,
      created_at: nowIso()
    };
    try{
      var res = await sb.from(VERSION_TABLE).insert(row);
      if(res && res.error) throw res.error;
      return { ok:true, stored:'table', row:row };
    }catch(e){
      return { ok:false, error:e, row:row };
    }
  }

  async function logAudit(options){
    options = options || {};
    var sb = options.sb || createClient();
    if(!sb || typeof sb.from !== 'function') return { ok:false, skipped:true, reason:'no_supabase_client' };
    var user = await currentUser(sb, options.user);
    var newData = compactJson(options.newData || options.data || null, 60000);
    var oldData = compactJson(options.oldData || null, 60000);
    var pageKey = normalizePageKey(options.pageKey || (newData && newData.page_key) || 'unknown');
    var documentKey = norm(options.documentId || options.documentKey || (newData && (newData.document_key || newData.document_id || newData.id)) || (oldData && (oldData.document_key || oldData.document_id || oldData.id)) || '');
    var row = {
      user_id: user && user.id ? user.id : null,
      user_email: userEmail(user) || null,
      actor_name: userName(user) || null,
      action: norm(options.action || 'CHANGE').toUpperCase(),
      method: lower(options.method || options.action || 'manual'),
      page_key: pageKey,
      table_name: norm(options.tableName || options.sourceTable || ''),
      document_key: documentKey || null,
      entity_key: norm(options.entityKey || documentKey || ''),
      document_type: norm(options.documentType || pageKey),
      document_no: norm(options.documentNo || (newData && newData.document_no) || (oldData && oldData.document_no) || ''),
      version_no: toInt(options.versionNo || (newData && (newData.version_no || newData.audit_version)) || 0, 0) || null,
      status: norm(options.status || (newData && (newData.document_status || newData.status)) || ''),
      reason: norm(options.reason || ''),
      old_data: oldData,
      new_data: newData,
      query_info: options.queryInfo || null,
      device_info: deviceInfo(),
      source: norm(options.source || 'manual-safe-frontend'),
      success: true,
      created_at: nowIso()
    };
    try{
      var res = await sb.from(AUDIT_TABLE).insert(row);
      if(res && res.error) throw res.error;
      return { ok:true, stored:'table', row:row };
    }catch(e){
      return { ok:false, error:e, row:row };
    }
  }

  async function recordChange(options){
    options = options || {};
    var result = { version:null, audit:null };
    if(options.newData || options.data || options.row){
      result.version = await saveVersion(Object.assign({}, options, { data: options.newData || options.data || options.row }));
    }
    result.audit = await logAudit(options);
    return result;
  }
  async function recordExport(options){
    options = options || {};
    return logAudit(Object.assign({}, options, { action: options.action || 'EXPORT' }));
  }

  function mapVersionRow(row){
    row = row || {};
    if(row.snapshot_data != null && row.data_json == null) row.data_json = row.snapshot_data;
    if(row.document_key && !row.document_id) row.document_id = row.document_key;
    if(row.document_no == null && row.data_json && row.data_json.document_no) row.document_no = row.data_json.document_no;
    return row;
  }
  function mapAuditRow(row){
    row = row || {};
    if(row.document_key && !row.document_id) row.document_id = row.document_key;
    if(row.new_data != null && row.data_json == null) row.data_json = row.new_data;
    return row;
  }

  async function listVersions(options){
    options = options || {};
    var sb = options.sb || createClient();
    if(!sb || typeof sb.from !== 'function') return [];
    var pageKey = normalizePageKey(options.pageKey || '');
    try{
      var q = sb.from(VERSION_TABLE).select('*').order('created_at', { ascending:false }).limit(options.limit || 1000);
      if(pageKey) q = q.eq('page_key', pageKey);
      if(options.documentId) q = q.eq('document_key', String(options.documentId));
      var res = await q;
      if(res && res.error) throw res.error;
      return (Array.isArray(res.data) ? res.data : []).map(mapVersionRow);
    }catch(_e){ return []; }
  }
  async function listAuditLogs(options){
    options = options || {};
    var sb = options.sb || createClient();
    if(!sb || typeof sb.from !== 'function') return [];
    var pageKey = normalizePageKey(options.pageKey || '');
    try{
      var q = sb.from(AUDIT_TABLE).select('*').order('created_at', { ascending:false }).limit(options.limit || 1000);
      if(pageKey) q = q.eq('page_key', pageKey);
      if(options.documentId) q = q.eq('document_key', String(options.documentId));
      var res = await q;
      if(res && res.error) throw res.error;
      return (Array.isArray(res.data) ? res.data : []).map(mapAuditRow);
    }catch(_e){ return []; }
  }

  window.KADDigitalArchive = {
    version: ARCHIVE_VERSION,
    safeMode:true,
    createClient:createClient,
    prepareDocumentRow:prepareDocumentRow,
    saveVersion:saveVersion,
    logAudit:logAudit,
    recordChange:recordChange,
    recordExport:recordExport,
    listVersions:listVersions,
    listAuditLogs:listAuditLogs,
    sha256:sha256
  };
})(window);
