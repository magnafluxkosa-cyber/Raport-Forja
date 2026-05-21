(function(window){
  'use strict';

  var ARCHIVE_VERSION = '1.0.0';
  var AUDIT_TABLE = 'rf_audit_log';
  var VERSION_TABLE = 'rf_document_versions';
  var DOC_TABLE = 'rf_documents';

  function cfg(){ return window.RF_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {}; }
  function supabaseUrl(){ return String(cfg().SUPABASE_URL || cfg().supabaseUrl || window.RF_SUPABASE_URL || window.SUPABASE_URL || '').trim(); }
  function supabaseKey(){ return String(cfg().SUPABASE_ANON_KEY || cfg().supabaseAnonKey || window.RF_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '').trim(); }
  function createClient(){
    if(window.__RF_SHARED_SUPABASE__) return window.__RF_SHARED_SUPABASE__;
    if(window.__KAD_SECURITY_SUPABASE__) return window.__KAD_SECURITY_SUPABASE__;
    if(!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    var url = supabaseUrl(), key = supabaseKey();
    if(!url || !key) return null;
    window.__RF_SHARED_SUPABASE__ = window.supabase.createClient(url, key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    return window.__RF_SHARED_SUPABASE__;
  }
  function nowIso(){ return new Date().toISOString(); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function toInt(v, fallback){ var n = parseInt(v, 10); return isFinite(n) ? n : (fallback || 0); }
  function safeJson(raw){ try { return raw ? JSON.parse(raw) : null; } catch(_) { return null; } }
  function clone(v){ try { return JSON.parse(JSON.stringify(v == null ? null : v)); } catch(_) { return v; } }
  function normalizePageKey(v){ return clean(v).toLowerCase().replace(/^\.\//,'').replace(/\.html$/,'') || 'unknown'; }
  function docId(row){ return clean(row && (row.document_id || row.id || row.report_id || row.doc_id)) || ('doc-' + Date.now() + '-' + Math.random().toString(16).slice(2)); }
  function docNo(row, prefix){
    if(row && row.document_no) return clean(row.document_no);
    var year = clean(row && (row.an || row.year || '')) || String(new Date().getFullYear());
    var id = clean(row && (row.id || row.document_id || '')) || Math.random().toString(16).slice(2);
    var shortId = id.replace(/[^a-zA-Z0-9]/g,'').slice(0,8).toUpperCase() || String(Date.now()).slice(-8);
    return (prefix || 'DOC') + '-' + year + '-' + shortId;
  }
  function stableStringify(value){
    var seen = new WeakSet();
    function walk(v){
      if(v === null || typeof v !== 'object') return v;
      if(seen.has(v)) return '[Circular]';
      seen.add(v);
      if(Array.isArray(v)) return v.map(walk);
      var out = {};
      Object.keys(v).sort().forEach(function(k){ out[k] = walk(v[k]); });
      return out;
    }
    return JSON.stringify(walk(value));
  }
  async function sha256(value){
    var text = typeof value === 'string' ? value : stableStringify(value);
    try{
      if(window.crypto && window.crypto.subtle && window.TextEncoder){
        var data = new TextEncoder().encode(text);
        var hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.prototype.map.call(new Uint8Array(hash), function(b){ return b.toString(16).padStart(2,'0'); }).join('');
      }
    }catch(_){}
    var h = 0;
    for(var i=0;i<text.length;i+=1){ h = ((h << 5) - h + text.charCodeAt(i)) | 0; }
    return 'fallback-' + Math.abs(h).toString(16);
  }
  function currentUserEmail(user){ return clean(user && user.email).toLowerCase(); }
  function deviceInfo(){
    var nav = window.navigator || {};
    return clean([nav.platform || '', nav.userAgent || ''].join(' | ')).slice(0, 900);
  }
  async function currentUser(sb, provided){
    if(provided && (provided.id || provided.email)) return provided;
    try{
      sb = sb || createClient();
      if(!sb || !sb.auth || !sb.auth.getUser) return null;
      var res = await sb.auth.getUser();
      return res && res.data && res.data.user ? res.data.user : null;
    }catch(_){ return null; }
  }
  async function readDoc(sb, key){
    if(!sb) return null;
    var cols = 'doc_key,content,data,updated_at';
    var res = await sb.from(DOC_TABLE).select(cols).eq('doc_key', key).maybeSingle();
    if(res.error) throw res.error;
    var row = res.data || null;
    return row ? (row.content || row.data || null) : null;
  }
  async function writeDoc(sb, key, payload){
    if(!sb) return false;
    var up = { doc_key:key, updated_at: nowIso() };
    up.content = payload;
    var res = await sb.from(DOC_TABLE).upsert(up, { onConflict:'doc_key' });
    if(res.error){
      delete up.content;
      up.data = payload;
      res = await sb.from(DOC_TABLE).upsert(up, { onConflict:'doc_key' });
    }
    if(res.error) throw res.error;
    return true;
  }
  async function appendFallbackDoc(sb, key, row, maxRows){
    var payload = null;
    try{ payload = await readDoc(sb, key); }catch(_){ payload = null; }
    var rows = payload && Array.isArray(payload.rows) ? payload.rows : [];
    rows.push(row);
    if(maxRows && rows.length > maxRows) rows = rows.slice(rows.length - maxRows);
    await writeDoc(sb, key, { app:'KAD_DIGITAL_ARCHIVE_FALLBACK', version:ARCHIVE_VERSION, updated_at:nowIso(), rows:rows });
    return true;
  }
  async function prepareDocumentRow(options){
    options = options || {};
    var row = clone(options.row || {});
    var oldData = options.oldData || null;
    var user = await currentUser(options.sb, options.user);
    var id = docId(row);
    var prefix = options.documentPrefix || 'DOC';
    var versionNo = oldData ? (toInt(oldData.version_no || oldData.revision_no || oldData.audit_version || oldData.__archive_version, 0) + 1) : 1;
    row.id = row.id || id;
    row.document_id = clean(row.document_id || id);
    row.document_no = docNo(oldData || row, prefix);
    row.version_no = versionNo;
    row.revision_no = versionNo;
    row.audit_version = versionNo;
    row.document_status = clean(row.document_status || row.status || (oldData && (oldData.document_status || oldData.status)) || 'Salvat');
    row.status = row.document_status;
    row.created_at = clean(oldData && oldData.created_at) || clean(row.created_at) || nowIso();
    row.created_by = clean(oldData && oldData.created_by) || clean(row.created_by) || clean(user && user.id);
    row.created_by_email = clean(oldData && oldData.created_by_email) || clean(row.created_by_email) || currentUserEmail(user);
    row.updated_at = nowIso();
    row.updated_by = clean(user && user.id);
    row.updated_by_email = currentUserEmail(user);
    row.archive_controlled = true;
    return row;
  }
  async function saveVersion(options){
    options = options || {};
    var sb = options.sb || createClient();
    var user = await currentUser(sb, options.user);
    var data = clone(options.data || options.row || {});
    var pageKey = normalizePageKey(options.pageKey || data.page_key || 'unknown');
    var documentType = clean(options.documentType || data.document_type || pageKey);
    var documentId = docId(data);
    var versionNo = toInt(options.versionNo || data.version_no || data.revision_no || data.audit_version, 1);
    var hash = await sha256(data);
    var payload = {
      document_id: documentId,
      document_no: docNo(data, options.documentPrefix || 'DOC'),
      page_key: pageKey,
      document_type: documentType,
      version_no: versionNo,
      status: clean(options.status || data.document_status || data.status || 'Salvat'),
      data_json: data,
      data_hash: hash,
      created_by: user && user.id ? user.id : null,
      created_by_email: currentUserEmail(user),
      change_reason: clean(options.reason || options.changeReason || ''),
      created_at: nowIso()
    };
    try{
      var res = await sb.from(VERSION_TABLE).upsert(payload, { onConflict:'page_key,document_id,version_no' });
      if(res.error) throw res.error;
      return { ok:true, stored:'table', row:payload };
    }catch(e){
      try{
        await appendFallbackDoc(sb, 'archive:versions:' + pageKey + ':' + documentId, payload, 500);
        return { ok:true, stored:'rf_documents_fallback', row:payload, warning:e && e.message };
      }catch(fb){ return { ok:false, error:fb || e, row:payload }; }
    }
  }
  async function logAudit(options){
    options = options || {};
    var sb = options.sb || createClient();
    var user = await currentUser(sb, options.user);
    var newData = clone(options.newData || options.data || null);
    var oldData = clone(options.oldData || null);
    var pageKey = normalizePageKey(options.pageKey || (newData && newData.page_key) || 'unknown');
    var documentId = clean(options.documentId || docId(newData || oldData || {}));
    var documentNo = clean(options.documentNo || (newData && newData.document_no) || (oldData && oldData.document_no) || '');
    var versionNo = toInt(options.versionNo || (newData && (newData.version_no || newData.audit_version)) || (oldData && oldData.version_no), 0);
    var row = {
      user_id: user && user.id ? user.id : null,
      user_email: currentUserEmail(user),
      action: clean(options.action || 'UNKNOWN').toUpperCase(),
      page_key: pageKey,
      document_type: clean(options.documentType || pageKey),
      document_id: documentId,
      document_no: documentNo,
      version_no: versionNo || null,
      status: clean(options.status || (newData && (newData.document_status || newData.status)) || ''),
      old_data: oldData,
      new_data: newData,
      reason: clean(options.reason || ''),
      ip_address: clean(options.ipAddress || ''),
      device_info: deviceInfo(),
      created_at: nowIso()
    };
    try{
      var res = await sb.from(AUDIT_TABLE).insert(row);
      if(res.error) throw res.error;
      return { ok:true, stored:'table', row:row };
    }catch(e){
      try{
        var ym = row.created_at.slice(0,7);
        await appendFallbackDoc(sb, 'archive:audit:' + ym, row, 2000);
        return { ok:true, stored:'rf_documents_fallback', row:row, warning:e && e.message };
      }catch(fb){ return { ok:false, error:fb || e, row:row }; }
    }
  }
  async function recordChange(options){
    options = options || {};
    var results = [];
    if(options.newData){ results.push(await saveVersion(options)); }
    results.push(await logAudit(options));
    return results;
  }
  async function recordExport(options){
    options = options || {};
    return logAudit(Object.assign({}, options, { action: options.action || 'EXPORT' }));
  }
  async function listVersions(options){
    options = options || {};
    var sb = options.sb || createClient();
    var pageKey = normalizePageKey(options.pageKey || 'raport-forja');
    var q = sb.from(VERSION_TABLE).select('*').eq('page_key', pageKey).order('created_at', { ascending:false }).limit(options.limit || 1000);
    if(options.documentId) q = q.eq('document_id', String(options.documentId));
    try{
      var res = await q;
      if(res.error) throw res.error;
      return Array.isArray(res.data) ? res.data : [];
    }catch(e){
      try{
        var res2 = await sb.from(DOC_TABLE).select('doc_key,content,data,updated_at').ilike('doc_key', 'archive:versions:' + pageKey + ':%').limit(options.limit || 1000);
        if(res2.error) throw res2.error;
        var out = [];
        (res2.data || []).forEach(function(r){ var p = r.content || r.data || {}; (p.rows || []).forEach(function(x){ out.push(x); }); });
        out.sort(function(a,b){ return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
        return out;
      }catch(_){ return []; }
    }
  }
  async function listAuditLogs(options){
    options = options || {};
    var sb = options.sb || createClient();
    var pageKey = normalizePageKey(options.pageKey || 'raport-forja');
    var q = sb.from(AUDIT_TABLE).select('*').eq('page_key', pageKey).order('created_at', { ascending:false }).limit(options.limit || 1000);
    if(options.documentId) q = q.eq('document_id', String(options.documentId));
    try{
      var res = await q;
      if(res.error) throw res.error;
      return Array.isArray(res.data) ? res.data : [];
    }catch(e){
      try{
        var res2 = await sb.from(DOC_TABLE).select('doc_key,content,data,updated_at').ilike('doc_key', 'archive:audit:%').limit(options.limit || 1000);
        if(res2.error) throw res2.error;
        var out = [];
        (res2.data || []).forEach(function(r){ var p = r.content || r.data || {}; (p.rows || []).forEach(function(x){ if(normalizePageKey(x.page_key) === pageKey) out.push(x); }); });
        out.sort(function(a,b){ return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
        return out;
      }catch(_){ return []; }
    }
  }

  window.KADDigitalArchive = {
    version: ARCHIVE_VERSION,
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
