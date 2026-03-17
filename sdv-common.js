(function(){
  'use strict';

  const STORAGE_KEY = 'rf_sdv_data_v1';
  const DOC_TABLE = 'rf_documents';
  const DOC_KEY = 'sdv-data';
  const FORJATE_DOC_KEY = 'forjate';
  const STATUS_OPTIONS = Object.freeze(['PE STOC','LUCREAZA','IN REGRAVARE','REGRAVATA','CASAT']);
  const EDIT_ROLES = new Set(['admin','editor','operator']);

  let __docCols = null;
  let __supabase = null;

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
  function nowIso(){ return new Date().toISOString(); }
  function uid(prefix){ return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function upper(v){ return String(v == null ? '' : v).trim().toUpperCase(); }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function toNum(value){
    if(value == null || value === '') return 0;
    if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const s = String(value).trim().replace(/\s+/g,'').replace(/\./g,'').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function fmtNum(value, digits){
    const n = toNum(value);
    return n.toLocaleString('ro-RO', { maximumFractionDigits: digits == null ? 0 : digits, minimumFractionDigits: digits == null ? 0 : digits });
  }
  function statusOrder(status){
    const map = { 'PE STOC': 1, 'LUCREAZA': 2, 'IN REGRAVARE': 3, 'REGRAVATA': 4, 'CASAT': 5 };
    return map[upper(status)] || 99;
  }
  function normalizeStatus(status){
    const s = upper(status);
    if(s === 'LUCREAZĂ') return 'LUCREAZA';
    return STATUS_OPTIONS.includes(s) ? s : (s || 'PE STOC');
  }
  function normalizeTip(value){
    const s = upper(value);
    if(s.startsWith('SUP')) return 'Superior';
    if(s.startsWith('INF')) return 'Inferior';
    return clean(value);
  }
  function formatDateDisplay(value){
    const iso = toIsoDate(value);
    if(!iso) return '';
    const parts = iso.split('-');
    return parts.length === 3 ? (parts[2] + '.' + parts[1] + '.' + parts[0]) : iso;
  }
  function toIsoDate(value){
    if(value == null || value === '') return '';
    if(typeof value === 'string'){
      const s = value.trim();
      if(!s) return '';
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
      if(m){
        let d = Number(m[1]); let mo = Number(m[2]); let y = Number(m[3]);
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
  function readSeed(){
    const raw = window.SDV_SEED || window.URMARIRE_MATRITE_SEED || {};
    const state = {
      meta: Object.assign({ version: 2, generatedAt: nowIso(), source: 'seed' }, raw.meta || {}),
      form: {
        date: toIsoDate(raw.form && (raw.form.data || raw.form.date)) || nowIso().slice(0,10),
        reper: clean(raw.form && raw.form.reper),
        utilaj: clean(raw.form && raw.form.utilaj),
        observatii: clean(raw.form && raw.form.observatii),
        superior: {
          cod: clean(raw.form && raw.form.superior && raw.form.superior.cod),
          idIntern: '',
          inaltime: toNum(raw.form && raw.form.superior && raw.form.superior.inaltime),
          piese: toNum(raw.form && raw.form.superior && raw.form.superior.piese)
        },
        inferior: {
          cod: clean(raw.form && raw.form.inferior && raw.form.inferior.cod),
          idIntern: '',
          inaltime: toNum(raw.form && raw.form.inferior && raw.form.inferior.inaltime),
          piese: toNum(raw.form && raw.form.inferior && raw.form.inferior.piese)
        }
      },
      stocMatrite: Array.isArray(raw.stocMatrite) ? raw.stocMatrite.map(function(row){
        return {
          id: clean(row.id) || uid('stoc'),
          reper: clean(row.reper),
          tip: normalizeTip(row.tip),
          cod: clean(row.cod),
          idIntern: clean(row.idIntern),
          status: normalizeStatus(row.status),
          inaltime: toNum(row.inaltime),
          ultimaDataIstoric: toIsoDate(row.ultimaDataIstoric),
          observatii: clean(row.observatii)
        };
      }) : [],
      istoric: Array.isArray(raw.istoric) ? raw.istoric.map(function(row){
        return {
          id: clean(row.id) || uid('istoric'),
          date: toIsoDate(row.date || row.data),
          reper: clean(row.reper),
          tip: normalizeTip(row.tip),
          cod: clean(row.cod),
          idIntern: clean(row.idIntern),
          height: toNum(row.height || row.inaltime),
          pieces: toNum(row.pieces || row.piese),
          utilaj: clean(row.utilaj),
          observatii: clean(row.observatii),
          source: clean(row.source) || 'seed',
          sourceRowId: clean(row.sourceRowId)
        };
      }) : [],
      limitsRows: Array.isArray(raw.limitaRegravare) ? raw.limitaRegravare.map(function(row){
        return {
          reper: clean(row.reper),
          tip: normalizeTip(row.tip),
          limitPiese: toNum(row.limitPiese || row.limita),
          warningPct: row.warningPct == null ? toNum(row.pragAvertizare || 0.9) : Number(row.warningPct),
          minMp: row.minMp == null ? null : toNum(row.minMp),
          minChina5T: row.minChina5T == null ? null : toNum(row.minChina5T)
        };
      }) : [],
      utilajeRows: Array.isArray(raw.utilajeMinime) ? raw.utilajeMinime.map(function(row){
        return { utilaj: clean(row.utilaj), minHeight: row.minHeight == null ? null : toNum(row.minHeight || row.inaltimeMinima) };
      }) : [],
      helperRows: Array.isArray(raw.helperRows) ? raw.helperRows.map(function(row){
        return { reper: clean(row.reper), cod: clean(row.cod), utilaj: clean(row.utilaj), status: clean(row.status) };
      }) : [],
      syncMeta: { lastForjateImportAt: '', importedForjateIds: [] }
    };
    return ensureState(state);
  }
  function ensureState(sourceState){
    const state = sourceState && typeof sourceState === 'object' ? sourceState : {};
    if(!state.meta || typeof state.meta !== 'object') state.meta = { version: 2, generatedAt: nowIso() };
    state.meta.version = 2;
    if(!state.meta.generatedAt) state.meta.generatedAt = nowIso();
    if(!state.form || typeof state.form !== 'object') state.form = {};
    state.form.date = toIsoDate(state.form.date || state.form.data) || nowIso().slice(0,10);
    state.form.reper = clean(state.form.reper);
    state.form.utilaj = clean(state.form.utilaj);
    state.form.observatii = clean(state.form.observatii);
    if(!state.form.superior || typeof state.form.superior !== 'object') state.form.superior = {};
    if(!state.form.inferior || typeof state.form.inferior !== 'object') state.form.inferior = {};
    ['superior','inferior'].forEach(function(side){
      const part = state.form[side];
      part.cod = clean(part.cod);
      part.idIntern = clean(part.idIntern);
      part.inaltime = toNum(part.inaltime);
      part.piese = toNum(part.piese);
    });

    state.stocMatrite = Array.isArray(state.stocMatrite) ? state.stocMatrite : [];
    state.stocMatrite = state.stocMatrite.map(function(row){
      return {
        id: clean(row.id) || uid('stoc'),
        reper: clean(row.reper),
        tip: normalizeTip(row.tip),
        cod: clean(row.cod),
        idIntern: clean(row.idIntern),
        status: normalizeStatus(row.status),
        inaltime: toNum(row.inaltime),
        ultimaDataIstoric: toIsoDate(row.ultimaDataIstoric),
        observatii: clean(row.observatii)
      };
    }).filter(function(row){ return row.reper || row.cod || row.idIntern; });

    state.istoric = Array.isArray(state.istoric) ? state.istoric : [];
    state.istoric = state.istoric.map(function(row){
      return {
        id: clean(row.id) || uid('istoric'),
        date: toIsoDate(row.date || row.data),
        reper: clean(row.reper),
        tip: normalizeTip(row.tip),
        cod: clean(row.cod),
        idIntern: clean(row.idIntern),
        height: toNum(row.height || row.inaltime),
        pieces: toNum(row.pieces || row.piese),
        utilaj: clean(row.utilaj),
        observatii: clean(row.observatii),
        source: clean(row.source) || 'manual',
        sourceRowId: clean(row.sourceRowId)
      };
    }).filter(function(row){ return row.date && row.reper && row.tip; });

    state.limitsRows = Array.isArray(state.limitsRows) ? state.limitsRows : [];
    state.limitsRows = state.limitsRows.map(function(row){
      return {
        reper: clean(row.reper),
        tip: normalizeTip(row.tip),
        limitPiese: toNum(row.limitPiese || row.limita),
        warningPct: row.warningPct == null ? 0.9 : Number(row.warningPct),
        minMp: row.minMp == null ? null : toNum(row.minMp),
        minChina5T: row.minChina5T == null ? null : toNum(row.minChina5T)
      };
    }).filter(function(row){ return row.reper && row.tip; });

    state.utilajeRows = Array.isArray(state.utilajeRows) ? state.utilajeRows : [];
    state.utilajeRows = state.utilajeRows.map(function(row){
      return { utilaj: clean(row.utilaj), minHeight: row.minHeight == null ? null : toNum(row.minHeight) };
    }).filter(function(row){ return row.utilaj; });

    state.helperRows = Array.isArray(state.helperRows) ? state.helperRows : [];
    state.helperRows = state.helperRows.map(function(row){
      return { reper: clean(row.reper), cod: clean(row.cod), utilaj: clean(row.utilaj), status: clean(row.status) };
    });

    if(!state.syncMeta || typeof state.syncMeta !== 'object') state.syncMeta = {};
    state.syncMeta.lastForjateImportAt = toIsoDate(state.syncMeta.lastForjateImportAt) || '';
    state.syncMeta.importedForjateIds = Array.isArray(state.syncMeta.importedForjateIds)
      ? state.syncMeta.importedForjateIds.map(function(v){ return clean(v); }).filter(Boolean)
      : [];

    refreshStockDatesFromHistory(state);
    state.updated_at = nowIso();
    return state;
  }

  function refreshStockDatesFromHistory(state){
    const latest = new Map();
    (state.istoric || []).forEach(function(row){
      const key = [clean(row.reper), normalizeTip(row.tip), clean(row.idIntern || row.cod)].join('|');
      const prev = latest.get(key);
      const val = toIsoDate(row.date);
      if(!prev || val > prev) latest.set(key, val);
    });
    (state.stocMatrite || []).forEach(function(row){
      const key = [clean(row.reper), normalizeTip(row.tip), clean(row.idIntern || row.cod)].join('|');
      if(latest.get(key)) row.ultimaDataIstoric = latest.get(key);
    });
  }

  function seedOrStored(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        return ensureState(parsed);
      }
    } catch (_) {}
    return readSeed();
  }

  async function getSupabase(){
    if(__supabase) return __supabase;
    if(window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function'){
      __supabase = window.ERPAuth.getSupabaseClient();
      return __supabase;
    }
    const cfg = window.RF_CONFIG || window.ERP_FORJA_CONFIG || {};
    if(window.supabase && typeof window.supabase.createClient === 'function' && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY){
      __supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      return __supabase;
    }
    return null;
  }

  async function detectDocColumns(sb){
    if(__docCols) return __docCols;
    let cols = [];
    try {
      const a = await sb.from(DOC_TABLE).select('content').limit(1);
      if(!a.error) cols.push('content');
    } catch (_) {}
    try {
      const b = await sb.from(DOC_TABLE).select('data').limit(1);
      if(!b.error) cols.push('data');
    } catch (_) {}
    if(!cols.length) cols = ['content'];
    __docCols = cols;
    return cols;
  }

  async function readDocument(sb, docKey){
    const cols = await detectDocColumns(sb);
    const selectCols = cols.concat(['updated_at']).join(',');
    const res = await sb.from(DOC_TABLE).select(selectCols).eq('doc_key', docKey).maybeSingle();
    if(res.error) throw res.error;
    const row = res.data || null;
    return {
      payload: row ? (row.content != null ? row.content : row.data != null ? row.data : null) : null,
      updated_at: row && row.updated_at ? row.updated_at : null
    };
  }

  async function writeDocument(sb, docKey, payload){
    const cols = await detectDocColumns(sb);
    const up = { doc_key: docKey, updated_at: nowIso() };
    if(cols.includes('content')) up.content = payload;
    if(cols.includes('data')) up.data = payload;
    const res = await sb.from(DOC_TABLE).upsert(up, { onConflict:'doc_key' });
    if(res.error) throw res.error;
  }

  async function loadState(){
    const fallback = seedOrStored();
    const sb = await getSupabase();
    if(!sb) return fallback;
    try {
      const doc = await readDocument(sb, DOC_KEY);
      if(doc && doc.payload){
        const state = ensureState(doc.payload);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
        return state;
      }
    } catch (_) {}
    return fallback;
  }

  async function saveState(state){
    const cleanState = ensureState(clone(state));
    cleanState.updated_at = nowIso();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState)); } catch (_) {}
    const sb = await getSupabase();
    if(!sb) return cleanState;
    await writeDocument(sb, DOC_KEY, cleanState);
    return cleanState;
  }

  async function getUserContext(){
    if(window.ERPAuth && typeof window.ERPAuth.getCurrentUserWithRole === 'function'){
      try {
        const ctx = await window.ERPAuth.getCurrentUserWithRole();
        if(ctx && ctx.user){
          return { ok:true, user:ctx.user, role: clean(ctx.role || 'viewer').toLowerCase(), email: clean(ctx.user.email || '') };
        }
      } catch (_) {}
    }
    const sb = await getSupabase();
    if(!sb) return { ok:false, user:null, role:'viewer', email:'' };
    try {
      const res = await sb.auth.getUser();
      const user = res && res.data ? res.data.user : null;
      return { ok:!!user, user:user || null, role:'viewer', email: clean(user && user.email || '') };
    } catch (_) {
      return { ok:false, user:null, role:'viewer', email:'' };
    }
  }

  function canEdit(role){
    return EDIT_ROLES.has(String(role || 'viewer').toLowerCase());
  }

  function limitLookup(state){
    const map = new Map();
    (state.limitsRows || []).forEach(function(row){
      map.set([upper(row.reper), upper(row.tip)].join('|'), row);
    });
    return map;
  }

  function utilajLookup(state){
    const map = new Map();
    (state.utilajeRows || []).forEach(function(row){
      map.set(upper(row.utilaj), row);
    });
    return map;
  }

  function buildMoldStats(state){
    const limitMap = limitLookup(state);
    const histByHeight = new Map();
    const histById = new Map();
    const latestById = new Map();
    const latestUtilajById = new Map();
    const maxHeightById = new Map();

    (state.istoric || []).forEach(function(row){
      const baseKey = [upper(row.reper), upper(row.tip), upper(row.idIntern || row.cod)].join('|');
      const heightKey = baseKey + '|' + String(toNum(row.height));
      histByHeight.set(heightKey, (histByHeight.get(heightKey) || 0) + toNum(row.pieces));
      histById.set(baseKey, (histById.get(baseKey) || 0) + toNum(row.pieces));
      const date = toIsoDate(row.date);
      if(date){
        const prev = latestById.get(baseKey);
        if(!prev || date > prev){
          latestById.set(baseKey, date);
          latestUtilajById.set(baseKey, clean(row.utilaj));
        }
      }
      const h = toNum(row.height);
      if(!maxHeightById.has(baseKey) || h > maxHeightById.get(baseKey)) maxHeightById.set(baseKey, h);
    });

    const rows = (state.stocMatrite || []).map(function(row){
      const baseKey = [upper(row.reper), upper(row.tip), upper(row.idIntern || row.cod)].join('|');
      const heightKey = baseKey + '|' + String(toNum(row.inaltime));
      const limitRow = limitMap.get([upper(row.reper), upper(row.tip)].join('|')) || {};
      const currentPieces = histByHeight.get(heightKey) || 0;
      const totalPiecesId = histById.get(baseKey) || 0;
      const limit = toNum(limitRow.limitPiese);
      const warningPct = limitRow.warningPct == null ? 0.9 : Number(limitRow.warningPct || 0.9);
      const remaining = limit ? (limit - currentPieces) : 0;
      const maxHeight = maxHeightById.get(baseKey);
      const mmRegravat = maxHeight != null ? Math.max(0, toNum(maxHeight) - toNum(row.inaltime)) : 0;
      let warningLabel = 'OK';
      if(limit){
        if(currentPieces >= limit) warningLabel = 'LIMITA ATINSA';
        else if(currentPieces >= limit * warningPct) warningLabel = 'APROAPE DE LIMITA';
      }
      return Object.assign({}, row, {
        currentPieces: currentPieces,
        totalPiecesId: totalPiecesId,
        limitPiese: limit,
        warningPct: warningPct,
        remaining: remaining,
        warningLabel: warningLabel,
        lastUseDate: latestById.get(baseKey) || row.ultimaDataIstoric || '',
        lastUseUtilaj: latestUtilajById.get(baseKey) || '',
        mmRegravat: mmRegravat
      });
    });

    const byRowId = new Map(rows.map(function(row){ return [row.id, row]; }));
    return { rows: rows, byRowId: byRowId };
  }

  function availableRowsForReper(state, reper, tip){
    const stats = buildMoldStats(state).rows;
    const filtered = stats.filter(function(row){
      if(reper && upper(row.reper) !== upper(reper)) return false;
      if(tip && upper(row.tip) !== upper(normalizeTip(tip))) return false;
      return upper(row.status) !== 'CASAT';
    });
    const dedupe = new Map();
    filtered.forEach(function(row){
      const key = [upper(row.reper), upper(row.tip), upper(row.idIntern || row.cod)].join('|');
      const prev = dedupe.get(key);
      if(!prev){
        dedupe.set(key, row);
        return;
      }
      const prevScore = statusOrder(prev.status);
      const rowScore = statusOrder(row.status);
      if(toNum(row.inaltime) < toNum(prev.inaltime) || (toNum(row.inaltime) === toNum(prev.inaltime) && rowScore < prevScore)){
        dedupe.set(key, row);
      }
    });
    return Array.from(dedupe.values()).sort(function(a, b){
      return upper(a.reper).localeCompare(upper(b.reper), 'ro') ||
        upper(a.tip).localeCompare(upper(b.tip), 'ro') ||
        statusOrder(a.status) - statusOrder(b.status) ||
        toNum(a.inaltime) - toNum(b.inaltime) ||
        upper(a.cod).localeCompare(upper(b.cod), 'ro');
    });
  }

  function buildCombos(state, reper, utilaj){
    const utilMap = utilajLookup(state);
    const utilRow = utilMap.get(upper(utilaj)) || {};
    const minHeight = utilRow.minHeight == null ? null : toNum(utilRow.minHeight);
    const supRows = availableRowsForReper(state, reper, 'Superior');
    const infRows = availableRowsForReper(state, reper, 'Inferior');
    const combos = [];
    supRows.forEach(function(sup){
      infRows.forEach(function(inf){
        const total = toNum(sup.inaltime) + toNum(inf.inaltime);
        const ok = minHeight == null ? true : total >= minHeight;
        combos.push({
          supId: sup.id,
          infId: inf.id,
          supCode: sup.cod,
          supInternal: sup.idIntern,
          supStatus: sup.status,
          supHeight: sup.inaltime,
          infCode: inf.cod,
          infInternal: inf.idIntern,
          infStatus: inf.status,
          infHeight: inf.inaltime,
          totalHeight: total,
          ok: ok,
          minHeight: minHeight
        });
      });
    });
    combos.sort(function(a, b){
      return (a.ok === b.ok ? 0 : a.ok ? -1 : 1) ||
        (a.minHeight == null ? 0 : Math.abs(a.totalHeight - a.minHeight) - Math.abs(b.totalHeight - b.minHeight)) ||
        a.totalHeight - b.totalHeight ||
        upper(a.supCode).localeCompare(upper(b.supCode), 'ro') ||
        upper(a.infCode).localeCompare(upper(b.infCode), 'ro');
    });
    return { rows: combos, minHeight: minHeight, supRows: supRows, infRows: infRows };
  }

  function getRowByCode(state, reper, tip, code){
    const rows = availableRowsForReper(state, reper, tip).filter(function(row){ return upper(row.cod) === upper(code); });
    return rows.length ? rows[0] : null;
  }

  function upsertStockRow(state, row){
    const cleanRow = {
      id: clean(row.id) || uid('stoc'),
      reper: clean(row.reper),
      tip: normalizeTip(row.tip),
      cod: clean(row.cod),
      idIntern: clean(row.idIntern),
      status: normalizeStatus(row.status),
      inaltime: toNum(row.inaltime),
      ultimaDataIstoric: toIsoDate(row.ultimaDataIstoric),
      observatii: clean(row.observatii)
    };
    const idx = state.stocMatrite.findIndex(function(item){ return String(item.id) === String(cleanRow.id); });
    if(idx >= 0) state.stocMatrite[idx] = cleanRow;
    else state.stocMatrite.push(cleanRow);
    refreshStockDatesFromHistory(state);
    return cleanRow;
  }

  function removeStockRow(state, rowId){
    state.stocMatrite = state.stocMatrite.filter(function(row){ return String(row.id) !== String(rowId); });
    return state;
  }

  function addHistoryRows(state, rows){
    (rows || []).forEach(function(row){
      state.istoric.push({
        id: clean(row.id) || uid('istoric'),
        date: toIsoDate(row.date || row.data) || nowIso().slice(0,10),
        reper: clean(row.reper),
        tip: normalizeTip(row.tip),
        cod: clean(row.cod),
        idIntern: clean(row.idIntern),
        height: toNum(row.height || row.inaltime),
        pieces: toNum(row.pieces || row.piese),
        utilaj: clean(row.utilaj),
        observatii: clean(row.observatii),
        source: clean(row.source) || 'manual',
        sourceRowId: clean(row.sourceRowId)
      });
    });
    refreshStockDatesFromHistory(state);
    return state;
  }

  function buildManualHistoryEntries(state, form){
    const entries = [];
    const base = {
      date: toIsoDate(form.date) || nowIso().slice(0,10),
      reper: clean(form.reper),
      utilaj: clean(form.utilaj),
      observatii: clean(form.observatii),
      source: 'manual'
    };
    ['superior','inferior'].forEach(function(side){
      const part = form[side] || {};
      const tip = side === 'superior' ? 'Superior' : 'Inferior';
      const code = clean(part.cod);
      const pieces = toNum(part.piese);
      if(!code || pieces <= 0 || !base.reper) return;
      const row = getRowByCode(state, base.reper, tip, code);
      entries.push({
        date: base.date,
        reper: base.reper,
        tip: tip,
        cod: code,
        idIntern: clean(part.idIntern || (row && row.idIntern) || code),
        height: toNum(part.inaltime || (row && row.inaltime) || 0),
        pieces: pieces,
        utilaj: base.utilaj,
        observatii: base.observatii,
        source: 'manual'
      });
    });
    return entries;
  }

  function rowFingerprint(row){
    return clean(row.id) || [
      toIsoDate(row.data || row.date),
      clean(row.reper),
      clean(row.ciocan || row.utilaj || row.linie || row['linie de forjare']),
      clean(row.matrita_sup || row.MATRITA_SUP || row.matritasup),
      clean(row.matrita_inf || row.MATRITA_INF || row.matritainf),
      toNum(row.buc_realizate || row.BUC_REALIZATE || row.buc || row.BUC)
    ].join('|');
  }

  function pick(row, keys){
    if(!row || typeof row !== 'object') return '';
    for(let i = 0; i < keys.length; i += 1){
      const key = keys[i];
      if(row[key] != null && row[key] !== '') return row[key];
    }
    const normalized = new Map(Object.keys(row).map(function(key){
      return [String(key).toLowerCase().replace(/[^a-z0-9]/g, ''), row[key]];
    }));
    for(let i = 0; i < keys.length; i += 1){
      const k = String(keys[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
      if(normalized.has(k) && normalized.get(k) != null && normalized.get(k) !== '') return normalized.get(k);
    }
    return '';
  }

  function resolveRowsPayload(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    const aliases = ['rows','data','items','records','entries','table'];
    for(let i = 0; i < aliases.length; i += 1){
      const key = aliases[i];
      if(Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function chooseStockMatch(state, reper, tip, code){
    const rows = (state.stocMatrite || []).filter(function(row){
      return upper(row.reper) === upper(reper) &&
        upper(row.tip) === upper(tip) &&
        upper(row.cod) === upper(code) &&
        upper(row.status) !== 'CASAT';
    }).sort(function(a, b){
      return statusOrder(a.status) - statusOrder(b.status) || toNum(a.inaltime) - toNum(b.inaltime);
    });
    return rows.length ? rows[0] : null;
  }

  async function importFromForjate(state, options){
    const opts = Object.assign({ markWorking: false }, options || {});
    const sb = await getSupabase();
    if(!sb) throw new Error('Supabase nu este configurat.');
    const doc = await readDocument(sb, FORJATE_DOC_KEY);
    const rows = resolveRowsPayload(doc.payload);
    const importedSet = new Set((state.syncMeta && state.syncMeta.importedForjateIds) || []);
    const newEntries = [];
    let processed = 0;
    let skipped = 0;

    rows.forEach(function(row){
      const fingerprint = rowFingerprint(row);
      if(!fingerprint || importedSet.has(fingerprint)){
        skipped += 1;
        return;
      }
      const reper = clean(pick(row, ['reper','REPER']));
      const utilaj = clean(pick(row, ['ciocan','utilaj','linie','linie de forjare','Linie de forjare']));
      const date = toIsoDate(pick(row, ['data','DATA','date','Date'])) || nowIso().slice(0,10);
      const pieces = toNum(pick(row, ['buc_realizate','BUC_REALIZATE','buc','BUC']));
      const supCode = clean(pick(row, ['matrita_sup','MATRITA_SUP','matritasup','matritasuperioara']));
      const infCode = clean(pick(row, ['matrita_inf','MATRITA_INF','matritainf','matritainferioara']));
      const supHeight = toNum(pick(row, ['inaltime_sup','INALTIME_SUP','inaltimesup']));
      const infHeight = toNum(pick(row, ['inaltime_inf','INALTIME_INF','inaltimeinf']));
      if(!reper || pieces <= 0 || (!supCode && !infCode)){
        skipped += 1;
        return;
      }

      function appendHistory(tip, code, height){
        if(!code) return;
        const match = chooseStockMatch(state, reper, tip, code);
        newEntries.push({
          date: date,
          reper: reper,
          tip: tip,
          cod: code,
          idIntern: clean(match && match.idIntern) || code,
          height: height || (match ? toNum(match.inaltime) : 0),
          pieces: pieces,
          utilaj: utilaj,
          observatii: clean(pick(row, ['observatii','OBSERVATII'])),
          source: 'forjate',
          sourceRowId: fingerprint
        });
        if(opts.markWorking && match){
          match.status = 'LUCREAZA';
        }
      }

      appendHistory('Superior', supCode, supHeight);
      appendHistory('Inferior', infCode, infHeight);
      importedSet.add(fingerprint);
      processed += 1;
    });

    if(newEntries.length) addHistoryRows(state, newEntries);
    state.syncMeta.lastForjateImportAt = nowIso().slice(0,10);
    state.syncMeta.importedForjateIds = Array.from(importedSet).slice(-12000);
    return { processed: processed, skipped: skipped, addedHistory: newEntries.length };
  }

  function getRepers(state){
    const set = new Set();
    (state.stocMatrite || []).forEach(function(row){ if(row.reper) set.add(row.reper); });
    (state.limitsRows || []).forEach(function(row){ if(row.reper) set.add(row.reper); });
    (state.helperRows || []).forEach(function(row){ if(row.reper) set.add(row.reper); });
    return Array.from(set).sort(function(a, b){ return upper(a).localeCompare(upper(b), 'ro'); });
  }

  function getUtilaje(state){
    const set = new Set();
    (state.utilajeRows || []).forEach(function(row){ if(row.utilaj) set.add(row.utilaj); });
    (state.helperRows || []).forEach(function(row){ if(row.utilaj) set.add(row.utilaj); });
    (state.istoric || []).forEach(function(row){ if(row.utilaj) set.add(row.utilaj); });
    return Array.from(set).sort(function(a, b){ return upper(a).localeCompare(upper(b), 'ro'); });
  }

  function statusBadge(status){
    const s = upper(status);
    if(s === 'PE STOC') return '<span class="pill pill-ok">PE STOC</span>';
    if(s === 'LUCREAZA') return '<span class="pill pill-info">LUCREAZĂ</span>';
    if(s === 'IN REGRAVARE') return '<span class="pill pill-warn">ÎN REGRAVARE</span>';
    if(s === 'REGRAVATA') return '<span class="pill pill-neutral">REGRAVATĂ</span>';
    if(s === 'CASAT') return '<span class="pill pill-bad">CASAT</span>';
    return '<span class="pill pill-neutral">' + esc(status || '-') + '</span>';
  }

  function warningBadge(label){
    const s = upper(label);
    if(s === 'LIMITA ATINSA') return '<span class="pill pill-bad">LIMITĂ ATINSĂ</span>';
    if(s === 'APROAPE DE LIMITA') return '<span class="pill pill-warn">APROAPE LIMITĂ</span>';
    return '<span class="pill pill-ok">OK</span>';
  }

  window.SDV = {
    DOC_KEY: DOC_KEY,
    FORJATE_DOC_KEY: FORJATE_DOC_KEY,
    STATUS_OPTIONS: STATUS_OPTIONS,
    loadState: loadState,
    saveState: saveState,
    ensureState: ensureState,
    getSupabase: getSupabase,
    getUserContext: getUserContext,
    canEdit: canEdit,
    getRepers: getRepers,
    getUtilaje: getUtilaje,
    buildMoldStats: buildMoldStats,
    buildCombos: buildCombos,
    availableRowsForReper: availableRowsForReper,
    getRowByCode: getRowByCode,
    upsertStockRow: upsertStockRow,
    removeStockRow: removeStockRow,
    buildManualHistoryEntries: buildManualHistoryEntries,
    addHistoryRows: addHistoryRows,
    importFromForjate: importFromForjate,
    formatDateDisplay: formatDateDisplay,
    toIsoDate: toIsoDate,
    fmtNum: fmtNum,
    toNum: toNum,
    esc: esc,
    statusBadge: statusBadge,
    warningBadge: warningBadge,
    statusOrder: statusOrder,
    normalizeStatus: normalizeStatus,
    normalizeTip: normalizeTip
  };
})();
