
(function(){
  'use strict';
  const DOC_KEYS = {
    stoc: 'matrite:stoc',
    utilaje: 'matrite:utilaje-minime',
    repere: 'matrite:repere-minime'
  };
  const LETTERS = ['N','U','M','E','R','A','L','K','O','D'];
  const DEFAULT_MIN_BY_UTILAJ = {
    '1,25 T': 136,
    '2,5 T': 134,
    '3 T BR': 136,
    'MP': 138,
    '5 T CHINA': 140
  };

  function norm(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){ return norm(v).toUpperCase(); }
  function toNum(v){
    const s = norm(v).replace(/\s/g,'').replace(',', '.');
    if(!s) return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function fmtNum(v, digits){
    const n = Number(v || 0);
    return n.toLocaleString('ro-RO', { minimumFractionDigits: digits||0, maximumFractionDigits: digits||0 });
  }
  function fmtDate(v){
    const d = parseDate(v);
    if(!d) return '';
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  }
  function parseDate(v){
    if(!v) return null;
    if(v instanceof Date) return v;
    let s = norm(v);
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return null;
  }
  function pad3(n){ return String(n).padStart(3, '0'); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function sb(){
    return window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function' ? window.ERPAuth.getSupabaseClient() : null;
  }
  function applyViewOnlyMatrite(){
    const allow = (node) => !!(node && (node.closest('.back-btn') || node.closest('a[href]')));
    document.documentElement.setAttribute('data-acl-viewonly', '1');
    document.querySelectorAll('input, textarea, select, button').forEach(el => {
      if(allow(el)) return;
      try { el.disabled = true; } catch(_) {}
      try { el.readOnly = true; } catch(_) {}
      el.setAttribute('aria-disabled', 'true');
      el.style.pointerEvents = 'none';
      el.classList.add('acl-view-only');
    });
    const stop = (ev) => {
      const t = ev.target;
      if(allow(t)) return;
      const blocked = !!(t && (t.matches('input, textarea, select, button') || (t.closest && t.closest('input, textarea, select, button'))));
      if(blocked){
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation && ev.stopImmediatePropagation();
      }
    };
    ['beforeinput','input','change','paste','drop','submit','keydown','click'].forEach(type => document.addEventListener(type, stop, true));
  }

  async function requirePage(pageKey){
    if(window.ERPAuth && typeof window.ERPAuth.requireAuth === 'function'){
      const auth = await window.ERPAuth.requireAuth({ next: location.pathname.split('/').pop(), redirectToLogin: true });
      const access = await window.ERPAuth.getPageAccess(pageKey, { user: auth.user, role: auth.role });
      const perms = access && access.permissions ? access.permissions : null;
      if(access && (access.allowed === false || (perms && perms.can_view === false))){
        if(window.ERPAuth && typeof window.ERPAuth.renderAccessDeniedPage === 'function'){
          window.ERPAuth.renderAccessDeniedPage(pageKey, access && access.message ? access.message : 'Nu ai acces în această pagină.');
        }
        throw new Error('Fără acces');
      }
      if(window.ERPAuth && typeof window.ERPAuth.showProtectedPage === 'function'){
        window.ERPAuth.showProtectedPage();
      }
      if(perms && perms.can_view === true && perms.can_edit === false){
        applyViewOnlyMatrite();
      }
      return { auth, access };
    }
    return { auth:null, access:null };
  }

  async function loadDoc(docKey){
    const client = sb();
    if(!client) throw new Error('Supabase indisponibil');
    const { data, error } = await client.from('rf_documents')
      .select('content,data,updated_at')
      .eq('doc_key', docKey)
      .order('updated_at', { ascending:false })
      .limit(1);
    if(error) throw error;
    if(Array.isArray(data) && data.length){
      const row = data[0];
      const payload = row.content && typeof row.content === 'object' ? row.content : (row.data && typeof row.data === 'object' ? row.data : null);
      return { payload: payload || {}, updated_at: row.updated_at || '' };
    }
    return { payload:{}, updated_at:'' };
  }

  async function saveDoc(docKey, payload){
    const client = sb();
    if(!client) throw new Error('Supabase indisponibil');
    const body = { doc_key: docKey, content: payload, data: payload, updated_at: new Date().toISOString() };
    const { error } = await client.from('rf_documents').upsert(body, { onConflict:'doc_key' });
    if(error) throw error;
    return body.updated_at;
  }

  async function fetchRepereForjate(){
    const client = sb();
    if(!client) throw new Error('Supabase indisponibil');
    const rows = [];
    let from = 0;
    const pageSize = 1000;
    while(true){
      const { data, error } = await client
        .from('rf_helper_repere_forjate')
        .select('reper_forjat,is_active,sort_order')
        .order('sort_order', { ascending:true, nullsFirst:false })
        .order('reper_forjat', { ascending:true })
        .range(from, from + pageSize - 1);
      if(error) throw error;
      if(!data || !data.length) break;
      rows.push(...data);
      if(data.length < pageSize) break;
      from += pageSize;
    }
    const repere = rows
      .filter(r => r && norm(r.reper_forjat) && (r.is_active === null || r.is_active === undefined || r.is_active === true))
      .map(r => upper(r.reper_forjat));
    return Array.from(new Set(repere)).sort((a,b) => a.localeCompare(b, 'ro', { sensitivity:'base' }));
  }

  async function fetchForjateRows2026Plus(){
    const idx = await loadDoc('forjate:index').catch(() => ({ payload:{}, updated_at:'' }));
    let years = Array.isArray(idx.payload.years) ? idx.payload.years.map(x => String(x)).filter(y => /^\d{4}$/.test(y) && Number(y) >= 2026) : [];
    years = Array.from(new Set(years)).sort();
    const out = [];
    if(!years.length){
      // fallback legacy single doc
      const legacy = await loadDoc('forjate').catch(() => ({ payload:{}, updated_at:'' }));
      const rows = Array.isArray(legacy.payload.rows) ? legacy.payload.rows : [];
      out.push(...rows);
    } else {
      for(const y of years){
        const doc = await loadDoc(`forjate:${y}`).catch(() => ({ payload:{}, updated_at:'' }));
        const rows = Array.isArray(doc.payload.rows) ? doc.payload.rows : [];
        out.push(...rows);
      }
    }
    return out.map(normalizeForjateRow).filter(Boolean).filter(r => {
      const d = parseDate(r.data);
      return d && d.getFullYear() >= 2026;
    });
  }

  function pick(row, keys){
    if(!row || typeof row !== 'object') return '';
    const entries = Object.keys(row);
    for(const key of keys){
      if(row[key] != null && row[key] !== '') return row[key];
      const found = entries.find(k => k.toLowerCase() === String(key).toLowerCase());
      if(found && row[found] != null && row[found] !== '') return row[found];
    }
    return '';
  }

  function extractLetter(v){
    const s = upper(v);
    if(!s) return '';
    if(LETTERS.includes(s)) return s;
    if(s.length >= 1 && LETTERS.includes(s.charAt(0))) return s.charAt(0);
    return '';
  }

  function normalizeForjateRow(row){
    if(!row || typeof row !== 'object') return null;
    const reper = upper(pick(row, ['reper','REPER','BP']));
    if(!reper) return null;
    const data = pick(row, ['data','DATA','BM','C']);
    const utilaj = norm(pick(row, ['ciocan','CIOCAN','utilaj','UTILAJ','linie forjare','Linie de forjare','BO']));
    const bucati = toNum(pick(row, ['buc_realizate','BUC_REALIZATE','CB']));
    const supLetter = extractLetter(pick(row, ['matrita_sup','MATRITA_SUP','matrita superioara','MATRITA SUPERIOARA','MATRITA SUP']));
    const infLetter = extractLetter(pick(row, ['matrita_inf','MATRITA_INF','matrita inferioara','MATRITA INFERIOARA','MATRITA INF']));
    const supHeight = toNum(pick(row, ['inaltime_sup','INALTIME_SUP','inaltime mf sup','INALTIME MF SUP','Inaltime MF SUP']));
    const infHeight = toNum(pick(row, ['inaltime_inf','INALTIME_INF','inaltime mf inf','INALTIME MF INF','Inaltime MF INF']));
    return {
      reper, data, utilaj, bucati,
      sup_litera: supLetter,
      inf_litera: infLetter,
      sup_h: supHeight,
      inf_h: infHeight
    };
  }

  function assignInternalCodes(rows){
    const sorted = [...rows].sort((a,b) => {
      const da = parseDate(a.data), db = parseDate(b.data);
      const ta = da ? da.getTime() : 0, tb = db ? db.getTime() : 0;
      return ta - tb;
    });
    const trackers = new Map();

    for(const row of sorted){
      for(const side of [
        { tip:'Superior', letterKey:'sup_litera', heightKey:'sup_h', outKey:'sup_code' },
        { tip:'Inferior', letterKey:'inf_litera', heightKey:'inf_h', outKey:'inf_code' }
      ]){
        const lit = upper(row[side.letterKey]);
        const h = toNum(row[side.heightKey]);
        if(!lit){
          row[side.outKey] = '';
          continue;
        }
        const key = `${row.reper}|${side.tip}|${lit}`;
        const tr = trackers.get(key);
        if(!tr){
          trackers.set(key, { idx:1, start:h });
          row[side.outKey] = `${lit}${pad3(1)}`;
          continue;
        }
        if(h > tr.start){
          tr.idx += 1;
          tr.start = h;
        }
        row[side.outKey] = `${lit}${pad3(tr.idx)}`;
      }
    }
    return sorted;
  }

  function buildRegistry(forjateRows){
    const rows = assignInternalCodes(forjateRows);
    const map = new Map();
    const combos = new Map();
    const heights = [];

    for(const r of rows){
      for(const side of [
        { tip:'Superior', codeKey:'sup_code', letterKey:'sup_litera', heightKey:'sup_h', otherCodeKey:'inf_code' },
        { tip:'Inferior', codeKey:'inf_code', letterKey:'inf_litera', heightKey:'inf_h', otherCodeKey:'sup_code' }
      ]){
        const code = norm(r[side.codeKey]);
        const lit = upper(r[side.letterKey]);
        const h = toNum(r[side.heightKey]);
        if(!code || !lit) continue;
        const key = `${r.reper}|${side.tip}|${code}`;
        if(!map.has(key)){
          map.set(key, {
            reper: r.reper,
            tip: side.tip,
            litera: lit,
            cod_intern: code,
            buc_total: 0,
            utilaje: new Set(),
            inaltimi_map: new Map(),
            combinatii_map: new Map()
          });
        }
        const item = map.get(key);
        item.buc_total += r.bucati;
        if(r.utilaj) item.utilaje.add(r.utilaj);
        item.inaltimi_map.set(h, (item.inaltimi_map.get(h) || 0) + r.bucati);
        const otherCode = norm(r[side.otherCodeKey]);
        if(otherCode){
          const combo = side.tip === 'Superior' ? `${code} + ${otherCode}` : `${otherCode} + ${code}`;
          item.combinatii_map.set(combo, (item.combinatii_map.get(combo) || 0) + r.bucati);
          combos.set(`${r.reper}|${combo}`, (combos.get(`${r.reper}|${combo}`) || 0) + r.bucati);
        }
        heights.push({ reper:r.reper, tip:side.tip, litera:lit, cod_intern:code, inaltime:h, bucati:r.bucati, data:r.data, utilaj:r.utilaj });
      }
    }

    const outRows = Array.from(map.values()).map(r => ({
      reper: r.reper,
      tip: r.tip,
      litera: r.litera,
      cod_intern: r.cod_intern,
      buc_total: r.buc_total,
      utilaje: Array.from(r.utilaje).sort(),
      inaltimi: Array.from(r.inaltimi_map.entries()).map(([inaltime,bucati]) => ({ inaltime, bucati })).sort((a,b)=>a.inaltime-b.inaltime),
      combinatii: Array.from(r.combinatii_map.entries()).map(([combinatie,bucati]) => ({ combinatie, bucati })).sort((a,b)=>b.bucati-a.bucati)
    })).sort((a,b) => a.reper.localeCompare(b.reper) || a.tip.localeCompare(b.tip) || a.cod_intern.localeCompare(b.cod_intern));

    return { registryRows: outRows, comboTotals: combos, heightRows: heights, sourceRows: rows };
  }

  async function loadStocHeights(){
    const doc = await loadDoc(DOC_KEYS.stoc).catch(() => ({ payload:{ rows:[] }, updated_at:'' }));
    const rows = Array.isArray(doc.payload.rows) ? doc.payload.rows : [];
    return rows.map(r => ({
      reper: upper(r.reper),
      tip: norm(r.tip),
      litera: upper(r.litera),
      cod_intern: upper(r.cod_intern),
      inaltime: toNum(r.inaltime)
    })).filter(r => r.reper && r.tip && r.litera && r.cod_intern);
  }
  async function saveStocHeights(rows){ return saveDoc(DOC_KEYS.stoc, { rows }); }

  async function loadUtilajeMinime(){
    const helperRows = [];
    try{
      const client = sb();
      let from = 0;
      while(true){
        const { data, error } = await client.from('rf_helper_items')
          .select('label,code,category_key,module_key,is_active,sort_order')
          .eq('module_key', 'forja')
          .eq('category_key', 'utilaje')
          .order('sort_order', { ascending:true, nullsFirst:false })
          .range(from, from + 999);
        if(error) break;
        if(!data || !data.length) break;
        helperRows.push(...data);
        if(data.length < 1000) break;
        from += 1000;
      }
    }catch(_e){}
    const names = Array.from(new Set([
      ...Object.keys(DEFAULT_MIN_BY_UTILAJ),
      ...helperRows.filter(r => r.is_active === null || r.is_active === undefined || r.is_active === true).map(r => norm(r.label || r.code)).filter(Boolean)
    ])).sort((a,b) => a.localeCompare(b, 'ro', { sensitivity:'base' }));
    const doc = await loadDoc(DOC_KEYS.utilaje).catch(() => ({ payload:{ rows:[] }, updated_at:'' }));
    const saved = Array.isArray(doc.payload.rows) ? doc.payload.rows : [];
    const byName = new Map(saved.map(r => [norm(r.utilaj), toNum(r.inaltime_minima)]));
    return names.map(name => ({ utilaj:name, inaltime_minima: byName.has(name) ? byName.get(name) : (DEFAULT_MIN_BY_UTILAJ[name] || 0) }));
  }
  async function saveUtilajeMinime(rows){ return saveDoc(DOC_KEYS.utilaje, { rows }); }

  async function loadRepereMinime(repere){
    const doc = await loadDoc(DOC_KEYS.repere).catch(() => ({ payload:{ rows:[] }, updated_at:'' }));
    const saved = Array.isArray(doc.payload.rows) ? doc.payload.rows : [];
    const byRep = new Map(saved.map(r => [upper(r.reper), { min_sup: toNum(r.min_sup), min_inf: toNum(r.min_inf) }]));
    return repere.map(reper => ({ reper, min_sup: byRep.has(reper) ? byRep.get(reper).min_sup : 0, min_inf: byRep.has(reper) ? byRep.get(reper).min_inf : 0 }));
  }
  async function saveRepereMinime(rows){ return saveDoc(DOC_KEYS.repere, { rows }); }

  function mergeStocWithRegistry(repere, registryRows, stocRows){
    const stocMap = new Map(stocRows.map(r => [`${r.reper}|${r.tip}|${r.cod_intern}`, r.inaltime]));
    const regByReperTipLetter = new Map();
    for(const row of registryRows){
      const key = `${row.reper}|${row.tip}|${row.litera}`;
      if(!regByReperTipLetter.has(key)) regByReperTipLetter.set(key, []);
      regByReperTipLetter.get(key).push(row);
    }

    const out = [];
    for(const reper of repere){
      for(const tip of ['Inferior','Superior']){
        for(const lit of LETTERS){
          const list = regByReperTipLetter.get(`${reper}|${tip}|${lit}`) || [];
          if(list.length){
            list.sort((a,b) => a.cod_intern.localeCompare(b.cod_intern));
            for(const row of list){
              out.push({
                reper, tip, litera: lit, cod_intern: row.cod_intern,
                inaltime: stocMap.has(`${reper}|${tip}|${row.cod_intern}`) ? stocMap.get(`${reper}|${tip}|${row.cod_intern}`) : 0,
                buc_total: row.buc_total
              });
            }
          }else{
            const code = `${lit}001`;
            out.push({ reper, tip, litera: lit, cod_intern: code, inaltime: stocMap.has(`${reper}|${tip}|${code}`) ? stocMap.get(`${reper}|${tip}|${code}`) : 0, buc_total: 0 });
          }
        }
      }
    }
    return out;
  }

  function getProgressRows(registryRows){
    const groups = new Map();
    for(const row of registryRows){
      const key = `${row.reper}|${row.tip}`;
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    const out = [];
    for(const arr of groups.values()){
      const totals = arr.map(r => r.buc_total);
      const min = Math.min(...totals), max = Math.max(...totals);
      for(const row of arr){
        let color = 'green';
        if(row.buc_total === min) color = 'red';
        else if(row.buc_total !== max) color = 'orange';
        out.push({ ...row, progress_color: color });
      }
    }
    return out.sort((a,b) => a.reper.localeCompare(b.reper) || a.tip.localeCompare(b.tip) || a.cod_intern.localeCompare(b.cod_intern));
  }

  window.MATRITE_LIVE = {
    LETTERS, DOC_KEYS, DEFAULT_MIN_BY_UTILAJ,
    norm, upper, toNum, fmtNum, fmtDate, esc,
    requirePage, loadDoc, saveDoc,
    fetchRepereForjate, fetchForjateRows2026Plus,
    assignInternalCodes, buildRegistry,
    loadStocHeights, saveStocHeights,
    loadUtilajeMinime, saveUtilajeMinime,
    loadRepereMinime, saveRepereMinime,
    mergeStocWithRegistry, getProgressRows
  };
})();
