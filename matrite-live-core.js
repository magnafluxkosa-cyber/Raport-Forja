
(function(){
  'use strict';
  const RF = window.RF_CONFIG || {};
  const SUPABASE_URL = RF.SUPABASE_URL || 'https://addlybnigrywqowpbhvd.supabase.co';
  const SUPABASE_ANON_KEY = RF.SUPABASE_ANON_KEY || '';
  const DOC_TABLE = 'rf_documents';
  const HELPERS_TABLE = 'rf_helper_repere_forjate';
  const FORJATE_INDEX_KEY = 'forjate:index';
  const FORJATE_PREFIX = 'forjate:';
  const STOK_KEY = 'stoc-matrite';
  const UTILAJE_KEY = 'utilaje-matrite';
  const REPERE_KEY = 'repere-matrite';
  const LETTERS = ['N','U','M','E','R','A','L','K','O','D'];
  const MIN_YEAR = 2026;

  function norm(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){ return norm(v).toUpperCase(); }
  function low(v){ return norm(v).toLowerCase(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function toNum(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    let s = String(v).trim().replace(/\s/g,'');
    if(s.includes(',') && s.includes('.')){
      if(s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g,'').replace(',', '.');
      else s = s.replace(/,/g,'');
    } else if(s.includes(',')) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function fmtInt(v){ return Math.round(Number(v || 0)).toLocaleString('ro-RO'); }
  function parseDateValue(v){
    if(v == null || v === '') return null;
    if(v instanceof Date && !Number.isNaN(v.getTime())) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    if(typeof v === 'number' && Number.isFinite(v)){
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      if(!Number.isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    let s = norm(v);
    if(!s) return null;
    s = s.replace(/[T]/g, ' ').split(' ')[0];
    let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if(m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    return null;
  }
  function fmtDate(v){ const d=parseDateValue(v); return d ? `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}` : ''; }
  function pick(obj, keys){
    const src = obj || {};
    for(const k of keys){
      if(src[k] != null && src[k] !== '') return src[k];
      const found = Object.keys(src).find(x => x.toLowerCase() === String(k).toLowerCase());
      if(found && src[found] != null && src[found] !== '') return src[found];
    }
    return '';
  }
  function resolveRowsPayload(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    if(Array.isArray(payload.rows)) return payload.rows;
    if(Array.isArray(payload.data)) return payload.data;
    return [];
  }
  function normalizeYearValue(v){
    const s = String(v == null ? '' : v).trim();
    if(!s) return '';
    const m = s.match(/(19|20)\d{2}/);
    return m ? m[0] : '';
  }
  function sortYearsAsc(years){ return years.slice().sort((a,b)=> Number(a)-Number(b)); }

  async function getClient(){
    if(window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') return window.ERPAuth.getSupabaseClient();
    if(!(window.supabase && window.supabase.createClient) || !SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase indisponibil');
    if(window.__RF_SHARED_SUPABASE__) return window.__RF_SHARED_SUPABASE__;
    window.__RF_SHARED_SUPABASE__ = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window.__RF_SHARED_SUPABASE__;
  }
  async function requirePage(pageKey, nextFile){
    if(window.ERPAuth && typeof window.ERPAuth.requireAuth === 'function'){
      const auth = await window.ERPAuth.requireAuth({ next: nextFile || (pageKey + '.html'), redirectToLogin:true });
      const access = await window.ERPAuth.getPageAccess(pageKey, { user: auth.user, role: auth.role });
      const perms = access && access.permissions ? access.permissions : { can_view:true, can_edit:false, can_add:false, can_delete:false };
      if(perms.can_view === false){ window.location.href = 'index.html'; throw new Error('Fără acces'); }
      return { auth, perms };
    }
    return { auth:null, perms:{ can_view:true, can_edit:true, can_add:true, can_delete:true } };
  }
  async function readDoc(docKey){
    const sb = await getClient();
    const res = await sb.from(DOC_TABLE).select('*').eq('doc_key', docKey).maybeSingle();
    if(res.error) throw res.error;
    const row = res.data || null;
    return row ? { row, payload: row.content ?? row.data ?? null } : { row:null, payload:null };
  }
  async function writeDoc(docKey, payload){
    const sb = await getClient();
    const ts = payload && payload.updated_at ? payload.updated_at : new Date().toISOString();
    let res = await sb.from(DOC_TABLE).upsert({ doc_key: docKey, content: payload, data: payload, updated_at: ts }, { onConflict:'doc_key' });
    if(res.error){
      res = await sb.from(DOC_TABLE).upsert({ doc_key: docKey, content: payload, updated_at: ts }, { onConflict:'doc_key' });
    }
    if(res.error) throw res.error;
    return ts;
  }

  async function loadHelperRepereForjate(){
    const sb = await getClient();
    try{
      const res = await sb.from(HELPERS_TABLE).select('reper_forjat,is_active,sort_order').order('sort_order', { ascending:true }).order('reper_forjat', { ascending:true });
      if(res.error) throw res.error;
      const rows = Array.isArray(res.data) ? res.data : [];
      return Array.from(new Set(rows.filter(r => r && (r.is_active !== false)).map(r => upper(r.reper_forjat)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ro',{sensitivity:'base'}));
    }catch(err){
      console.warn('helper repere forjate fallback', err);
      return [];
    }
  }

  async function loadForjateRows2026Plus(){
    const years = [];
    let latest = '';
    try{
      const idx = await readDoc(FORJATE_INDEX_KEY);
      const payload = idx.payload || {};
      const ys = Array.isArray(payload.years) ? payload.years.map(normalizeYearValue).filter(Boolean).filter(y => Number(y) >= MIN_YEAR) : [];
      years.push(...sortYearsAsc(Array.from(new Set(ys))));
      latest = idx.row && idx.row.updated_at || latest;
    }catch(err){ console.warn('forjate:index fallback', err); }
    if(!years.length){
      const current = new Date().getFullYear();
      for(let y=MIN_YEAR; y<=current; y++) years.push(String(y));
    }
    let raw = [];
    for(const y of years){
      try{
        const doc = await readDoc(FORJATE_PREFIX + y);
        if(doc && doc.payload){ raw.push(...resolveRowsPayload(doc.payload)); if(doc.row && doc.row.updated_at && doc.row.updated_at > latest) latest = doc.row.updated_at; }
      }catch(err){ /* ignore missing year */ }
    }
    if(!raw.length){
      try{
        const legacy = await readDoc('forjate');
        raw.push(...resolveRowsPayload(legacy.payload));
        latest = legacy.row && legacy.row.updated_at || latest;
      }catch(err){}
    }
    const rows = raw.map((row, idx) => normalizeForjateRow(row, idx)).filter(Boolean).filter(r => Number(r.an) >= MIN_YEAR);
    return { rows, latest };
  }

  function normalizeForjateRow(row, idx){
    const data = parseDateValue(pick(row, ['data','DATA','date','Date','BM']));
    const an = normalizeYearValue(pick(row, ['an','AN','ANUL','Anul','A'])) || (data ? String(data.getFullYear()) : '');
    if(!an || Number(an) < MIN_YEAR) return null;
    const reper = upper(pick(row, ['reper','REPER','BP']));
    if(!reper) return null;
    const utilaj = norm(pick(row, ['ciocan','CIOCAN','utilaj','UTILAJ','linie de forjare','Linie de forjare','BO']));
    const supLetter = upper(pick(row, ['matrita_sup','MATRITA_SUP']));
    const infLetter = upper(pick(row, ['matrita_inf','MATRITA_INF']));
    const supH = toNum(pick(row, ['inaltime_sup','INALTIME_SUP']));
    const infH = toNum(pick(row, ['inaltime_inf','INALTIME_INF']));
    const buc = Math.max(0, Math.round(toNum(pick(row, ['buc_realizate','BUC_REALIZATE','CB']))));
    const schimb = norm(pick(row, ['schimb','SCHIMB','D']));
    return { id: 'fj-' + idx, an, data: data ? `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}` : '', reper, utilaj, schimb, supLetter, supH, infLetter, infH, buc };
  }

  function deriveInternalSeries(rows){
    const sorted = rows.slice().sort((a,b)=> (a.data||'').localeCompare(b.data||''));
    const trackers = new Map();
    for(const row of sorted){
      for(const side of [
        { tip:'Superior', letterKey:'supLetter', heightKey:'supH', outCode:'supCode' },
        { tip:'Inferior', letterKey:'infLetter', heightKey:'infH', outCode:'infCode' }
      ]){
        const lit = upper(row[side.letterKey]);
        const h = toNum(row[side.heightKey]);
        if(!lit){ row[side.outCode] = ''; continue; }
        const key = `${row.reper}|${side.tip}|${lit}`;
        const tr = trackers.get(key);
        if(!tr){ trackers.set(key, { index:1, startHeight:h }); row[side.outCode] = `${lit}${String(1).padStart(3,'0')}`; continue; }
        if(h > tr.startHeight){ tr.index += 1; tr.startHeight = h; }
        row[side.outCode] = `${lit}${String(tr.index).padStart(3,'0')}`;
      }
    }
    return sorted;
  }

  function buildStocTemplate(repere, forjateRows){
    const seriesMap = new Map();
    for(const r of forjateRows){
      if(r.supCode){ const key = `${r.reper}|Superior|${r.supLetter}`; seriesMap.set(key, Math.max(seriesMap.get(key)||0, Number(r.supCode.slice(1))||1)); }
      if(r.infCode){ const key = `${r.reper}|Inferior|${r.infLetter}`; seriesMap.set(key, Math.max(seriesMap.get(key)||0, Number(r.infCode.slice(1))||1)); }
    }
    const out = [];
    repere.forEach(reper => {
      ['Inferior','Superior'].forEach(tip => {
        LETTERS.forEach(lit => {
          const count = Math.max(1, seriesMap.get(`${reper}|${tip}|${lit}`) || 1);
          for(let i=1;i<=count;i++){
            out.push({ reper, tip, litera:lit, cod_intern:`${lit}${String(i).padStart(3,'0')}`, inaltime:'', updated_at:'' });
          }
        });
      });
    });
    return out;
  }

  function mergeStocManual(templateRows, manualPayload){
    const manualRows = resolveRowsPayload(manualPayload).map(r => ({ reper:upper(r.reper), tip:norm(r.tip), litera:upper(r.litera), cod_intern:upper(r.cod_intern), inaltime:r.inaltime == null ? '' : r.inaltime, updated_at:r.updated_at || '' }));
    const byKey = new Map(manualRows.map(r => [`${r.reper}|${r.tip}|${r.cod_intern}`, r]));
    const merged = templateRows.map(r => {
      const key = `${r.reper}|${r.tip}|${r.cod_intern}`;
      return byKey.has(key) ? { ...r, ...byKey.get(key) } : { ...r };
    });
    // keep extra manual rows too
    manualRows.forEach(r => {
      const key = `${r.reper}|${r.tip}|${r.cod_intern}`;
      if(!merged.find(x => `${x.reper}|${x.tip}|${x.cod_intern}` === key)) merged.push(r);
    });
    return merged;
  }

  function buildRegistry(forjateRows, stocRows){
    const stocMap = new Map(stocRows.map(r => [`${r.reper}|${r.tip}|${r.cod_intern}`, r]));
    const reg = new Map();
    const comboMap = new Map();
    for(const row of forjateRows){
      const entries = [
        { tip:'Superior', code:row.supCode, lit:row.supLetter, h:row.supH, otherCode:row.infCode },
        { tip:'Inferior', code:row.infCode, lit:row.infLetter, h:row.infH, otherCode:row.supCode }
      ];
      for(const e of entries){
        if(!e.code) continue;
        const key = `${row.reper}|${e.tip}|${e.code}`;
        if(!reg.has(key)){
          const manual = stocMap.get(key) || null;
          reg.set(key, {
            reper: row.reper,
            tip: e.tip,
            litera: e.lit,
            cod_intern: e.code,
            inaltime_stoc: manual && manual.inaltime !== '' ? toNum(manual.inaltime) : '',
            buc_total: 0,
            utilaje: new Set(),
            historyHeights: new Map(),
            combinations: new Map(),
            lastDate: ''
          });
        }
        const item = reg.get(key);
        item.buc_total += row.buc;
        if(row.utilaj) item.utilaje.add(row.utilaj);
        item.historyHeights.set(e.h, (item.historyHeights.get(e.h) || 0) + row.buc);
        if(e.otherCode) item.combinations.set(`${e.code}+${e.otherCode}`, (item.combinations.get(`${e.code}+${e.otherCode}`) || 0) + row.buc);
        if(row.data && (!item.lastDate || row.data > item.lastDate)) item.lastDate = row.data;
      }
      if(row.supCode && row.infCode){
        const ck = `${row.reper}|${row.supCode}+${row.infCode}`;
        comboMap.set(ck, (comboMap.get(ck) || 0) + row.buc);
      }
    }
    return { rows:Array.from(reg.values()).sort((a,b)=>a.reper.localeCompare(b.reper)||a.tip.localeCompare(b.tip)||a.cod_intern.localeCompare(b.cod_intern)), comboTotals: comboMap };
  }

  function summarizeHeightMap(map){
    return Array.from(map.entries()).sort((a,b)=>Number(b[0])-Number(a[0])).map(([h,b]) => `${h}: ${fmtInt(b)} buc`).join(' | ');
  }
  function summarizeComboMap(map){
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).map(([c,b]) => `${c}: ${fmtInt(b)} buc`).join(' | ');
  }

  window.MATRITE_LIVE = {
    LETTERS, MIN_YEAR, esc, toNum, fmtInt, fmtDate, norm, upper,
    getClient, requirePage, readDoc, writeDoc,
    loadHelperRepereForjate, loadForjateRows2026Plus,
    deriveInternalSeries, buildStocTemplate, mergeStocManual, buildRegistry,
    summarizeHeightMap, summarizeComboMap
  };
})();
