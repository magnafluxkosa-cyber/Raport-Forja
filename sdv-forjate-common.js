(function(){
  'use strict';

  const DOC_TABLE = 'rf_documents';
  const CLOUD_PREFIX = 'forjate:';
  const LEGACY_DOC_KEY = 'forjate';
  const YEAR_INDEX_KEY = 'forjate:index';
  const LOCAL_YEAR_PREFIX = 'FORJATE_autosave_year_v2_';
  const LOCAL_INDEX_KEY = 'FORJATE_autosave_index_v2';
  const EDIT_ROLES = new Set(['admin','editor','operator']);

  let __supabase = null;
  let __docCols = null;

  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function upper(v){ return clean(v).toUpperCase(); }
  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function toNum(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const s = String(v).trim().replace(/\s+/g,'').replace(/\./g,'').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function fmtNum(v, digits){
    const n = toNum(v);
    const d = digits == null ? 0 : digits;
    return n.toLocaleString('ro-RO', { minimumFractionDigits:d, maximumFractionDigits:d });
  }
  function toIsoDate(value){
    if(value == null || value === '') return '';
    if(typeof value === 'string'){
      const s = value.trim();
      if(!s) return '';
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
      if(m){
        let d = Number(m[1]);
        let mo = Number(m[2]);
        let y = Number(m[3]);
        if(y < 100) y += 2000;
        return String(y).padStart(4, '0') + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      }
      const dt = new Date(s);
      if(!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0,10);
      return '';
    }
    if(value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0,10);
    return '';
  }
  function formatDateDisplay(value){
    const iso = toIsoDate(value);
    if(!iso) return '';
    const p = iso.split('-');
    return p.length === 3 ? (p[2] + '.' + p[1] + '.' + p[0]) : iso;
  }
  function normalizeYear(v){
    const s = clean(v);
    const m = s.match(/(19|20)\d{2}/);
    return m ? m[0] : '';
  }
  function pick(row, keys){
    if(!row || typeof row !== 'object') return '';
    for(let i = 0; i < keys.length; i += 1){
      const key = keys[i];
      if(row[key] != null && row[key] !== '') return row[key];
    }
    const normalized = new Map(Object.keys(row).map(function(key){
      return [String(key).toLowerCase().replace(/[^a-z0-9]/g,''), row[key]];
    }));
    for(let i = 0; i < keys.length; i += 1){
      const k = String(keys[i]).toLowerCase().replace(/[^a-z0-9]/g,'');
      if(normalized.has(k) && normalized.get(k) != null && normalized.get(k) !== '') return normalized.get(k);
    }
    return '';
  }
  function resolveRowsPayload(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    const keys = ['rows','data','items','records','entries','table'];
    for(const key of keys){
      if(Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }
  function canEdit(role){ return EDIT_ROLES.has(String(role || 'viewer').toLowerCase()); }

  async function getSupabase(){
    if(__supabase) return __supabase;
    if(window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function'){
      __supabase = window.ERPAuth.getSupabaseClient();
      return __supabase;
    }
    const cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || {};
    if(window.supabase && typeof window.supabase.createClient === 'function' && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY){
      __supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      return __supabase;
    }
    return null;
  }

  async function detectDocColumns(sb){
    if(__docCols) return __docCols;
    let cols = [];
    try { const a = await sb.from(DOC_TABLE).select('content').limit(1); if(!a.error) cols.push('content'); } catch(_){}
    try { const b = await sb.from(DOC_TABLE).select('data').limit(1); if(!b.error) cols.push('data'); } catch(_){}
    if(!cols.length) cols = ['content'];
    __docCols = cols;
    return cols;
  }

  async function getUserContext(){
    if(window.ERPAuth && typeof window.ERPAuth.getCurrentUserWithRole === 'function'){
      try {
        const ctx = await window.ERPAuth.getCurrentUserWithRole();
        if(ctx && ctx.user){
          return { ok:true, user:ctx.user, role: clean(ctx.role || 'viewer').toLowerCase(), email: clean(ctx.user.email || '') };
        }
      } catch(_){}
    }
    const sb = await getSupabase();
    if(!sb) return { ok:false, user:null, role:'viewer', email:'' };
    try {
      const res = await sb.auth.getUser();
      const user = res && res.data ? res.data.user : null;
      return { ok:!!user, user:user || null, role:'viewer', email: clean(user && user.email || '') };
    } catch(_){
      return { ok:false, user:null, role:'viewer', email:'' };
    }
  }

  function uniqueById(rows){
    const map = new Map();
    rows.forEach(function(row){
      map.set(row.__id, row);
    });
    return Array.from(map.values());
  }

  function normalizeForjateRow(row, meta, idx){
    const date = toIsoDate(pick(row, ['data','DATA','date','Date']));
    const reper = clean(pick(row, ['reper','REPER']));
    const utilaj = clean(pick(row, ['ciocan','utilaj','linie','linie de forjare','Linie de forjare']));
    const buc = toNum(pick(row, ['buc_realizate','BUC_REALIZATE','buc','BUC']));
    const rebut = toNum(pick(row, ['rebut','REBUT']));
    const sup = clean(pick(row, ['matrita_sup','MATRITA_SUP','matritasup','matritasuperioara']));
    const supH = toNum(pick(row, ['inaltime_sup','INALTIME_SUP','inaltimesup','inaltimemfsup']));
    const inf = clean(pick(row, ['matrita_inf','MATRITA_INF','matritainf','matritainferioara']));
    const infH = toNum(pick(row, ['inaltime_inf','INALTIME_INF','inaltimeinf','inaltimemfinf']));
    const an = normalizeYear(pick(row, ['an','AN'])) || normalizeYear(meta && meta.year) || (date ? date.slice(0,4) : '');
    const sourceId = clean(pick(row, ['id','ID'])) || [meta.doc_key || '', idx, reper, utilaj, date, sup, inf, buc, rebut].join('|');
    return {
      __id: sourceId,
      an: an,
      date: date,
      reper: reper,
      utilaj: utilaj,
      matrita_sup: sup,
      inaltime_sup: supH,
      matrita_inf: inf,
      inaltime_inf: infH,
      buc_realizate: buc,
      rebut: rebut,
      total_lovituri: buc + rebut,
      source_doc_key: meta.doc_key || '',
      source_updated_at: meta.updated_at || ''
    };
  }

  function normalizeDocRows(doc){
    const payload = doc && doc.payload ? doc.payload : null;
    const rows = resolveRowsPayload(payload);
    return uniqueById(rows.map(function(row, idx){ return normalizeForjateRow(row, doc, idx); }).filter(function(row){
      return row.reper && (row.matrita_sup || row.matrita_inf) && (row.buc_realizate > 0 || row.rebut > 0 || row.total_lovituri > 0);
    }));
  }

  async function readCloudDocs(){
    const sb = await getSupabase();
    if(!sb) return [];
    const cols = await detectDocColumns(sb);
    const selectCols = ['doc_key'].concat(cols).concat(['updated_at']).join(',');
    const docs = [];
    const years = new Set();

    try {
      const legacy = await sb.from(DOC_TABLE).select(selectCols).eq('doc_key', LEGACY_DOC_KEY).maybeSingle();
      if(!legacy.error && legacy.data){
        docs.push({
          doc_key: legacy.data.doc_key,
          payload: legacy.data.content != null ? legacy.data.content : legacy.data.data != null ? legacy.data.data : null,
          updated_at: legacy.data.updated_at || ''
        });
      }
    } catch(_){}

    try {
      const indexRes = await sb.from(DOC_TABLE).select(selectCols).eq('doc_key', YEAR_INDEX_KEY).maybeSingle();
      if(!indexRes.error && indexRes.data){
        const indexPayload = indexRes.data.content != null ? indexRes.data.content : indexRes.data.data != null ? indexRes.data.data : null;
        const idxYears = [];
        if(indexPayload && Array.isArray(indexPayload.years)) idxYears.push.apply(idxYears, indexPayload.years);
        idxYears.forEach(y => { const yy = normalizeYear(y); if(yy) years.add(yy); });
      }
    } catch(_){}

    try {
      const prefixed = await sb.from(DOC_TABLE).select(selectCols).like('doc_key', CLOUD_PREFIX + '%').order('doc_key', { ascending:true });
      if(!prefixed.error && Array.isArray(prefixed.data)){
        prefixed.data.forEach(function(item){
          if(item.doc_key === YEAR_INDEX_KEY) return;
          const payload = item.content != null ? item.content : item.data != null ? item.data : null;
          docs.push({ doc_key:item.doc_key, payload:payload, updated_at:item.updated_at || '' });
          const yy = normalizeYear(String(item.doc_key).replace(CLOUD_PREFIX, ''));
          if(yy) years.add(yy);
        });
      }
    } catch(_){}

    if(years.size && !docs.some(d => String(d.doc_key || '').startsWith(CLOUD_PREFIX))){
      for(const year of Array.from(years).sort()){
        try {
          const res = await sb.from(DOC_TABLE).select(selectCols).eq('doc_key', CLOUD_PREFIX + year).maybeSingle();
          if(!res.error && res.data){
            docs.push({
              doc_key: res.data.doc_key,
              payload: res.data.content != null ? res.data.content : res.data.data != null ? res.data.data : null,
              updated_at: res.data.updated_at || ''
            });
          }
        } catch(_){}
      }
    }

    const seen = new Set();
    return docs.filter(function(doc){
      const key = String(doc.doc_key || '');
      if(!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function readLocalDocs(){
    const docs = [];
    let years = [];
    try {
      const idxRaw = localStorage.getItem(LOCAL_INDEX_KEY);
      const idx = idxRaw ? JSON.parse(idxRaw) : null;
      if(idx && Array.isArray(idx.years)) years = idx.years.map(normalizeYear).filter(Boolean);
    } catch(_){}

    if(!years.length){
      try {
        years = Object.keys(localStorage)
          .filter(k => k.indexOf(LOCAL_YEAR_PREFIX) === 0)
          .map(k => normalizeYear(k.replace(LOCAL_YEAR_PREFIX, '')))
          .filter(Boolean);
      } catch(_){}
    }

    years = Array.from(new Set(years)).sort();
    years.forEach(function(year){
      try {
        const raw = localStorage.getItem(LOCAL_YEAR_PREFIX + year);
        if(!raw) return;
        const payload = JSON.parse(raw);
        docs.push({ doc_key:CLOUD_PREFIX + year, payload:payload, updated_at:payload && payload.updated_at ? payload.updated_at : '' });
      } catch(_){}
    });
    return docs;
  }

  async function loadAllForjateRows(){
    let docs = [];
    let source = 'local';
    try {
      docs = await readCloudDocs();
      if(docs.length) source = 'cloud';
    } catch(_){ docs = []; }
    if(!docs.length){
      docs = readLocalDocs();
      source = docs.length ? 'local' : 'empty';
    }
    const rows = [];
    let lastUpdated = '';
    docs.forEach(function(doc){
      normalizeDocRows(doc).forEach(r => rows.push(r));
      if(doc.updated_at && (!lastUpdated || doc.updated_at > lastUpdated)) lastUpdated = doc.updated_at;
    });
    rows.sort(function(a,b){
      return (a.date || '').localeCompare(b.date || '') || upper(a.reper).localeCompare(upper(b.reper), 'ro') || upper(a.utilaj).localeCompare(upper(b.utilaj), 'ro') || String(a.__id).localeCompare(String(b.__id), 'ro');
    });
    return {
      rows: rows,
      source: source,
      docCount: docs.length,
      updatedAt: lastUpdated,
      years: Array.from(new Set(rows.map(r => normalizeYear(r.an || (r.date ? r.date.slice(0,4) : ''))).filter(Boolean))).sort()
    };
  }

  function deriveMoldStock(forjateRows){
    const normalizedRows = Array.isArray(forjateRows) ? forjateRows.slice() : [];
    normalizedRows.sort(function(a,b){
      return (a.date || '').localeCompare(b.date || '') || String(a.__id).localeCompare(String(b.__id), 'ro');
    });

    const reperMap = new Map();
    const moldMap = new Map();

    function ensureReper(reper){
      const key = upper(reper);
      if(!reperMap.has(key)){
        reperMap.set(key, {
          reper: clean(reper),
          superior: [],
          inferior: [],
          history: [],
          totalGoodPieces: 0,
          totalHits: 0,
          lastDate: '',
          lastUtilaj: ''
        });
      }
      return reperMap.get(key);
    }

    function applyMold(rec, tip, cod, height, goodPieces, totalHits, date, utilaj){
      if(!cod) return;
      const key = [upper(rec.reper), upper(tip), upper(cod)].join('|');
      if(!moldMap.has(key)){
        moldMap.set(key, {
          id: key,
          reper: rec.reper,
          tip: tip,
          cod: clean(cod),
          currentHeight: 0,
          currentPiecesGood: 0,
          currentHits: 0,
          totalPiecesGood: 0,
          totalHits: 0,
          uses: 0,
          firstDate: '',
          lastDate: '',
          lastUtilaj: '',
          maxHeight: null,
          minHeight: null,
          heightsSet: new Set(),
          heightTotalsGood: new Map(),
          heightTotalsHits: new Map(),
          lastHeightByDate: 0
        });
      }
      const mold = moldMap.get(key);
      mold.totalPiecesGood += goodPieces;
      mold.totalHits += totalHits;
      mold.uses += 1;
      if(!mold.firstDate || (date && date < mold.firstDate)) mold.firstDate = date;
      if(!mold.lastDate || (date && date >= mold.lastDate)){
        mold.lastDate = date;
        mold.lastUtilaj = utilaj;
        mold.currentHeight = height;
      }
      if(mold.maxHeight == null || height > mold.maxHeight) mold.maxHeight = height;
      if(mold.minHeight == null || height < mold.minHeight) mold.minHeight = height;
      mold.heightsSet.add(height);
      mold.heightTotalsGood.set(height, (mold.heightTotalsGood.get(height) || 0) + goodPieces);
      mold.heightTotalsHits.set(height, (mold.heightTotalsHits.get(height) || 0) + totalHits);
    }

    normalizedRows.forEach(function(row){
      const reperRec = ensureReper(row.reper);
      reperRec.history.push(row);
      reperRec.totalGoodPieces += row.buc_realizate;
      reperRec.totalHits += row.total_lovituri;
      if(!reperRec.lastDate || (row.date && row.date >= reperRec.lastDate)){
        reperRec.lastDate = row.date;
        reperRec.lastUtilaj = row.utilaj;
      }
      applyMold(reperRec, 'Superior', row.matrita_sup, toNum(row.inaltime_sup), toNum(row.buc_realizate), toNum(row.total_lovituri), row.date, row.utilaj);
      applyMold(reperRec, 'Inferior', row.matrita_inf, toNum(row.inaltime_inf), toNum(row.buc_realizate), toNum(row.total_lovituri), row.date, row.utilaj);
    });

    moldMap.forEach(function(mold){
      mold.currentPiecesGood = mold.heightTotalsGood.get(mold.currentHeight) || 0;
      mold.currentHits = mold.heightTotalsHits.get(mold.currentHeight) || 0;
      mold.mmConsumati = mold.maxHeight != null ? Math.max(0, toNum(mold.maxHeight) - toNum(mold.currentHeight)) : 0;
      mold.heightsUsed = Array.from(mold.heightsSet).sort(function(a,b){ return a-b; });
      delete mold.heightsSet;
      delete mold.heightTotalsGood;
      delete mold.heightTotalsHits;
      const rec = ensureReper(mold.reper);
      if(mold.tip === 'Superior') rec.superior.push(mold);
      else rec.inferior.push(mold);
    });

    const repers = Array.from(reperMap.values()).sort(function(a,b){
      return upper(a.reper).localeCompare(upper(b.reper), 'ro');
    });

    repers.forEach(function(rec){
      rec.superior.sort(function(a,b){ return upper(a.cod).localeCompare(upper(b.cod), 'ro') || toNum(a.currentHeight) - toNum(b.currentHeight); });
      rec.inferior.sort(function(a,b){ return upper(a.cod).localeCompare(upper(b.cod), 'ro') || toNum(a.currentHeight) - toNum(b.currentHeight); });
      rec.history.sort(function(a,b){ return (b.date || '').localeCompare(a.date || '') || String(a.__id).localeCompare(String(b.__id), 'ro'); });
      rec.summary = {
        moldsCount: rec.superior.length + rec.inferior.length,
        superiorCount: rec.superior.length,
        inferiorCount: rec.inferior.length,
        totalGoodPieces: rec.totalGoodPieces,
        totalHits: rec.totalHits,
        lastDate: rec.lastDate,
        lastUtilaj: rec.lastUtilaj
      };
    });

    return {
      repers: repers,
      reperMap: reperMap,
      allMolds: Array.from(moldMap.values()).sort(function(a,b){
        return upper(a.reper).localeCompare(upper(b.reper), 'ro') || upper(a.tip).localeCompare(upper(b.tip), 'ro') || upper(a.cod).localeCompare(upper(b.cod), 'ro');
      }),
      allRows: normalizedRows
    };
  }

  window.SDVForjate = {
    DOC_TABLE: DOC_TABLE,
    CLOUD_PREFIX: CLOUD_PREFIX,
    LEGACY_DOC_KEY: LEGACY_DOC_KEY,
    YEAR_INDEX_KEY: YEAR_INDEX_KEY,
    getSupabase: getSupabase,
    getUserContext: getUserContext,
    canEdit: canEdit,
    loadAllForjateRows: loadAllForjateRows,
    deriveMoldStock: deriveMoldStock,
    clean: clean,
    upper: upper,
    esc: esc,
    toNum: toNum,
    fmtNum: fmtNum,
    toIsoDate: toIsoDate,
    formatDateDisplay: formatDateDisplay
  };
})();
