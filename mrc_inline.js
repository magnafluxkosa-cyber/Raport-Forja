
(() => {
  const PAGE_KEY = 'mrc';
  const ADJUST_DOC_KEY = 'mrc-manual';
  const ORDER_DOC_KEY = 'mrc-orders';
  const PLAN_DOC_KEY = 'planificare-forja';
  const LEGACY_FORJATE_DOC_KEY = 'forjate';
  const FORJATE_DOC_PREFIX = 'forjate:';
  const STEEL_DOC_KEYS = ['stoc-initial-otel','stoc_initial_otel','inventar-otel','inventar_otel','inventar-otel-initial','inventar_otel_initial'];
  const DEBITAT_DOC_BASE_KEYS = ['inventar-debitat','inventar_debitat','stoc-initial-debitat','stoc_initial_debitat'];
  const INTRARI_OTEL_DOC_BASE_KEYS = ['intrari-otel','intrari_otel','intrari otel','INTRARI_OTEL','INTRARI OTEL'];
  const DEBITARI_FLOW_DOC_BASE_KEYS = ['debitate','debitari','debitate_otel','debitari_otel','DEBITATE','DEBITARI'];
  const MONTHS = ['IANUARIE','FEBRUARIE','MARTIE','APRILIE','MAI','IUNIE','IULIE','AUGUST','SEPTEMBRIE','OCTOMBRIE','NOIEMBRIE','DECEMBRIE'];
  const MACHINE_ORDER = ['1,25 T','2,5 T','3 T BR','MP','5 T CHINA'];

  const state = {
    rows: [],
    orders: [],
    pivotMode: 'need',
    client: null,
    user: null,
    role: 'viewer',
    canEdit: false,
    selectedId: null,
    helperMaps: { debitByReper:Object.create(null), forjaByReper:Object.create(null), source:'-', loadedAt:'' },
    manualMap: Object.create(null),
    sourceNotes: [],
    lastLoadedAt: ''
  };

  const el = id => document.getElementById(id);
  const safe = v => v == null ? '' : String(v);
  const fmtKg = n => `${Number(n || 0).toLocaleString('ro-RO', {maximumFractionDigits: 2})} kg`;
  const fmtNum = n => Number(n || 0).toLocaleString('ro-RO', {maximumFractionDigits: 2});
  const fmtPct = n => `${Math.round(Number(n || 0) * 100)}%`;

  function trimText(v){ return safe(v).trim(); }
  function stripDiacritics(v){ return safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(v){ return stripDiacritics(v).toLowerCase().replace(/\s+/g,' ').trim(); }
  function normUpper(v){ return stripDiacritics(v).toUpperCase().replace(/\s+/g,' ').trim(); }
  function normKey(v){ return normUpper(v).replace(/[^A-Z0-9]+/g,''); }
  function normDiameterLoose(v){ return normUpper(v).replace(/[Øø⌀]/g,'').replace(/\s+/g,'').replace(/,/g,'.').trim(); }
  function normalizeReperLoose(v){ return normUpper(v).replace(/[Øø⌀]/g,'').replace(/\s+/g,' ').trim(); }
  function normalizeCalitateLoose(v){ return normKey(v); }
  function buildSpecKey(diametru, calitate){ return normDiameterLoose(diametru) + '|' + normalizeCalitateLoose(calitate); }
  function nowIso(){ return new Date().toISOString(); }
  function toNumber(value){
    if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = trimText(value);
    if(!raw) return 0;
    if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) return Number(raw.replace(/\./g,'').replace(',','.')) || 0;
    if(raw.includes(',') && !raw.includes('.')) return Number(raw.replace(',','.')) || 0;
    return Number(raw.replace(/\s+/g,'').replace(/,/g,'.')) || 0;
  }
  function getMonthName(month){
    if(month == null || month === '') return '';
    const n = Number(month);
    if(Number.isFinite(n) && n >= 1 && n <= 12) return MONTHS[n - 1];
    const txt = trimText(month);
    if(!txt) return '';
    const idx = MONTHS.findIndex(x => norm(x) === norm(txt));
    return idx >= 0 ? MONTHS[idx] : txt.toUpperCase();
  }
  function monthNumberFromAny(value){
    if(value == null || value === '') return 0;
    const n = Number(value);
    if(Number.isFinite(n) && n >= 1 && n <= 12) return n;
    const txt = trimText(value);
    if(!txt) return 0;
    const normalized = norm(txt);
    const idx = MONTHS.findIndex(x => norm(x) === normalized);
    if(idx >= 0) return idx + 1;
    const map = { ian:1, feb:2, mar:3, apr:4, mai:5, iun:6, iul:7, aug:8, sep:9, sept:9, oct:10, noi:11, nov:11, dec:12 };
    return map[normalized.slice(0,4)] || map[normalized.slice(0,3)] || 0;
  }
  function excelSerialToIso(serial){
    const n = Number(serial);
    if(!Number.isFinite(n)) return '';
    const utc = Date.UTC(1899,11,30) + Math.round(n) * 86400000;
    const d = new Date(utc);
    return d.toISOString().slice(0,10);
  }
  function displayToIso(value){
    const raw = trimText(value);
    if(!raw) return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if(typeof value === 'number' && Number.isFinite(value)) return excelSerialToIso(value);
    if(/^\d+$/.test(raw) && Number(raw) > 30000 && Number(raw) < 80000) return excelSerialToIso(Number(raw));
    const clean = raw.replace(/\//g,'.').replace(/-/g,'.');
    const m = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
    if(!m) return '';
    let d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    if(y < 100) y += 2000;
    if(mo > 12 && d <= 12){ const t = d; d = mo; mo = t; }
    if(!y || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    return String(y).padStart(4,'0') + '-' + String(mo).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  }
  function normalizeDateAny(value){ return displayToIso(value); }
  function isoToDisplay(iso){
    const m = trimText(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : trimText(iso);
  }
  function pick(obj, keys){
    for(const key of keys){
      if(obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null && obj[key] !== '') return obj[key];
    }
    return '';
  }
  function arrayCell(row, index, fallback){
    if(Array.isArray(row) && index >= 0 && index < row.length){
      const value = row[index];
      if(value != null && value !== '') return value;
    }
    return fallback == null ? '' : fallback;
  }
  function extractRowsPayload(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    if(Array.isArray(payload.rows)) return payload.rows;
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.items)) return payload.items;
    if(Array.isArray(payload.records)) return payload.records;
    if(Array.isArray(payload.entries)) return payload.entries;
    if(payload.payload && Array.isArray(payload.payload.rows)) return payload.payload.rows;
    return [];
  }
  function weekMeta(iso){
    const d = new Date(iso + 'T00:00:00');
    if(Number.isNaN(d.getTime())) return { week:'', start:'', end:'' };
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    const jan4 = new Date(thursday.getFullYear(), 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const week1 = new Date(jan4);
    week1.setDate(jan4.getDate() - jan4Day + 1);
    const weekNo = 1 + Math.round((monday - week1) / 604800000);
    return {
      week: `S${String(weekNo).padStart(2,'0')}`,
      start: monday.toISOString().slice(0,10),
      end: sunday.toISOString().slice(0,10)
    };
  }
  function sameOrBefore(a,b){ return trimText(a) && trimText(b) && String(a) <= String(b); }
  function nextDayIso(iso){ const d = new Date(iso + 'T00:00:00'); if(Number.isNaN(d.getTime())) return ''; d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }
  function endOfMonthIso(an, lunaNum){
    const y = Number(an || 0);
    const m = Number(lunaNum || 0);
    if(!y || m < 1 || m > 12) return '';
    return new Date(Date.UTC(y, m, 0)).toISOString().slice(0,10);
  }
  function findLatestSnapshotEnd(rows, firstPlanIso){
    let best = '';
    (rows || []).forEach(row => {
      const eom = endOfMonthIso(row && row.an, row && row.lunaNum);
      if(!eom) return;
      if(firstPlanIso && eom >= firstPlanIso) return;
      if(!best || eom > best) best = eom;
    });
    return best;
  }
  function findLatestCommonSnapshotEnd(steelRows, debitatRows, firstPlanIso){
    const steelSet = new Set();
    (steelRows || []).forEach(row => {
      const eom = endOfMonthIso(row && row.an, row && row.lunaNum);
      if(eom && (!firstPlanIso || eom < firstPlanIso)) steelSet.add(eom);
    });
    const common = new Set();
    (debitatRows || []).forEach(row => {
      const eom = endOfMonthIso(row && row.an, row && row.lunaNum);
      if(eom && steelSet.has(eom)) common.add(eom);
    });
    const commonList = Array.from(common).sort();
    if(commonList.length) return commonList[commonList.length - 1];
    return findLatestSnapshotEnd(steelRows, firstPlanIso) || findLatestSnapshotEnd(debitatRows, firstPlanIso) || '';
  }
  function queryKeys(keys){ return Array.from(new Set((keys || []).map(trimText).filter(Boolean))); }
  function buildFlowDocKeys(baseKeys, year){
    const y = trimText(year) || String(new Date().getFullYear());
    const keys = [];
    (baseKeys || []).forEach(base => { const clean = trimText(base); if(!clean) return; keys.push(`${clean}:${y}`); keys.push(clean); });
    return queryKeys(keys);
  }
  async function queryDocsByKeys(keys){
    const unique = queryKeys(keys);
    if(!unique.length || !state.client) return [];
    try{
      const res = await state.client.from('rf_documents').select('*').in('doc_key', unique);
      return !res.error && Array.isArray(res.data) ? res.data : [];
    }catch(_e){ return []; }
  }
  async function readDocumentCompat(docKey){
    if(!state.client) return null;
    try{
      const res = await state.client.from('rf_documents').select('*').eq('doc_key', docKey).maybeSingle();
      return !res.error && res.data ? res.data : null;
    }catch(_e){ return null; }
  }
  async function writeDocumentCompat(docKey, payload){
    if(!state.client) throw new Error('Supabase indisponibil');
    let res = await state.client.from('rf_documents').upsert({ doc_key:docKey, content:payload, data:payload, updated_at:nowIso() }, { onConflict:'doc_key' });
    if(res && res.error){
      res = await state.client.from('rf_documents').upsert({ doc_key:docKey, content:payload, updated_at:nowIso() }, { onConflict:'doc_key' });
    }
    if(res && res.error) throw res.error;
    return true;
  }

  function normalizeSteelRow(row, index){
    const data = normalizeDateAny(
      Array.isArray(row)
        ? ''
        : pick(row, ['data','date','DATA','Date','data intrare','Data intrare','C'])
    );
    const an = trimText(
      Array.isArray(row)
        ? arrayCell(row, 0, '')
        : pick(row, ['an','anul','year','AN','Year','Anul','an intrare','An intrare','A'])
    ) || (data ? data.slice(0,4) : '');
    const lunaRaw = Array.isArray(row)
      ? arrayCell(row, 1, '')
      : pick(row, ['luna','month','Luna','Month','B']);
    const lunaNum = monthNumberFromAny(lunaRaw) || (data ? Number(data.slice(5,7)) : 0);
    return {
      id: trimText(Array.isArray(row) ? '' : pick(row, ['id','_id'])) || ('steel-' + index),
      an,
      data,
      luna: getMonthName(lunaNum || lunaRaw),
      lunaNum,
      diametru: trimText(
        Array.isArray(row)
          ? arrayCell(row, 4, '')
          : pick(row, ['diametru','diametru otel','diametru_otel','Diametru oțel','Diametru','dimensiune otel','dimensiune_otel','Dimensiune OTEL','Dimensiune Otel'])
      ),
      calitate: trimText(
        Array.isArray(row)
          ? arrayCell(row, 5, '')
          : pick(row, ['calitate','calitate otel','calitate_otel','Calitate oțel','Calitate','Calitate Otel'])
      ),
      codIntern: trimText(
        Array.isArray(row)
          ? arrayCell(row, 2, '')
          : pick(row, ['cod intern otel','cod intern oțel','cod_intern_otel','cod intern','codInternOtel','codIntern','cod','COD CAT'])
      ).toUpperCase(),
      furnizor: trimText(
        Array.isArray(row)
          ? arrayCell(row, 7, '')
          : pick(row, ['furnizor','Furnizor','FURNIZOR'])
      ),
      cantitateKg: Math.max(0, toNumber(
        Array.isArray(row)
          ? arrayCell(row, 3, 0)
          : pick(row, ['cantitateKg','cantitate','cantitate kg','cantitate_kg','kg','stoc initial','stoc_initial','stoc actual','stoc actual kg','stoc_actual','stoc_final','stoc final','stoc final kg','STOC FINAL KG','Stoc Otel (Kg)','Stoc Otel Kg','Stoc otel (Kg)','STOC OTEL (KG)'])
      ))
    };
  }
  function normalizeDebitatRow(row, index){
    const data = Array.isArray(row) ? '' : displayToIso(pick(row, ['data','date','DATA','Date']));
    const an = trimText(Array.isArray(row) ? arrayCell(row, 1, '') : pick(row, ['an','year','AN','Year'])) || (data ? data.slice(0,4) : '');
    const lunaRaw = Array.isArray(row) ? arrayCell(row, 2, '') : pick(row, ['luna','month','Luna','Month']);
    return {
      id: trimText(Array.isArray(row) ? '' : pick(row, ['id','_id'])) || ('debitat-' + index),
      an,
      data,
      luna: getMonthName(monthNumberFromAny(lunaRaw) || (data ? Number(data.slice(5,7)) : 0) || lunaRaw),
      reper: trimText(Array.isArray(row) ? arrayCell(row, 5, '') : pick(row, ['reper','reper debitat','reper_debitat','Reper'])).toUpperCase(),
      cantitateBuc: Math.max(0, Math.round(toNumber(Array.isArray(row) ? arrayCell(row, 8, '') : pick(row, ['cantitate','cantitate buc','cantitate_buc','buc','stoc initial','stoc_initial']))))
    };
  }

  function normalizeDebitatRow(row, index){
    const data = normalizeDateAny(
      Array.isArray(row)
        ? ''
        : pick(row, ['data','date','DATA','Date','data intrare','Data intrare','DATA INTRARE'])
    );
    const an = trimText(
      Array.isArray(row)
        ? arrayCell(row, 1, '')
        : pick(row, ['an','anul','year','AN','Year','Anul','an intrare','An intrare','AN INTRARE'])
    ) || (data ? data.slice(0,4) : '');
    const lunaRaw = Array.isArray(row)
      ? arrayCell(row, 2, '')
      : pick(row, ['luna','month','LUNA','Month','Luna','luna intrare','Luna intrare','LUNA INTRARE']);
    const lunaNum = monthNumberFromAny(lunaRaw) || (data ? Number(data.slice(5,7)) : 0);
    return {
      id: trimText(Array.isArray(row) ? '' : pick(row, ['id','_id'])) || ('debitat-' + index),
      an,
      data,
      luna: getMonthName(lunaNum || lunaRaw),
      lunaNum,
      reper: trimText(
        Array.isArray(row)
          ? arrayCell(row, 3, '')
          : pick(row, ['reper','REPER','Reper','denumire reper debitare','Denumire reper debitare'])
      ).toUpperCase(),
      cantitateBuc: Math.max(0, Math.round(toNumber(
        Array.isArray(row)
          ? arrayCell(row, 6, 0)
          : pick(row, ['cantitateBuc','STOC DEBITATE FINAL (buc)','Stoc debitate final (buc)','Stoc Debitat (Buc)','cantitate'])
      )))
    };
  }

  function normalizeIntrariOtelRow(row, index){
    const data = normalizeDateAny(
      Array.isArray(row)
        ? arrayCell(row, 2, '')
        : pick(row, ['data','date','DATA','Date','data intrare','Data intrare','C'])
    );
    const an = trimText(
      Array.isArray(row)
        ? arrayCell(row, 0, '')
        : pick(row, ['an','anul','year','AN','Year','Anul','an intrare','An intrare','A'])
    ) || (data ? data.slice(0,4) : '');
    const lunaRaw = Array.isArray(row)
      ? arrayCell(row, 1, '')
      : pick(row, ['luna','month','luna intrare','Luna','Month','B']);
    const lunaNum = monthNumberFromAny(lunaRaw) || (data ? Number(data.slice(5,7)) : 0);
    return {
      id: trimText(Array.isArray(row) ? '' : pick(row, ['id','_id'])) || ('intrari-' + index),
      an,
      data,
      luna: getMonthName(lunaNum || lunaRaw),
      lunaNum,
      diametru: trimText(
        Array.isArray(row)
          ? arrayCell(row, 3, '')
          : pick(row, ['diametru','diametru otel','diametru_otel','Diametru','D','Dimensiune Otel'])
      ),
      calitate: trimText(
        Array.isArray(row)
          ? arrayCell(row, 4, '')
          : pick(row, ['calitate','calitate otel','calitate_otel','Calitate','E'])
      ),
      cantitateKg: Math.max(0, toNumber(
        Array.isArray(row)
          ? arrayCell(row, 7, 0)
          : pick(row, ['cantitateKg','cantitate','cantitate kg','cantitate_kg','kg','cantitate in kg','cantitate în kg','Cantitate în kg','Cantitate in kg','Cantitate KG','Cantitate kg','Cantitate (kg)','Cantitate [kg]','H'])
      )),
      codIntern: trimText(
        Array.isArray(row)
          ? arrayCell(row, 5, '')
          : pick(row, ['cod intern otel','cod_intern_otel','cod intern','F'])
      ).toUpperCase(),
      furnizor: trimText(
        Array.isArray(row)
          ? arrayCell(row, 9, '')
          : pick(row, ['furnizor','J'])
      )
    };
  }
  function normalizeForjateFlowRow(row, index){
    const data = normalizeDateAny(
      Array.isArray(row)
        ? arrayCell(row, 2, '')
        : pick(row, ['data','DATA','date','Date','C'])
    );
    const an = trimText(
      Array.isArray(row)
        ? arrayCell(row, 0, '')
        : pick(row, ['an','AN','anul','ANUL','year','Year','A'])
    ) || (data ? data.slice(0,4) : '');
    const lunaRaw = Array.isArray(row)
      ? arrayCell(row, 1, '')
      : pick(row, ['luna','LUNA','month','Month','B']);
    const lunaNum = monthNumberFromAny(lunaRaw) || (data ? Number(data.slice(5,7)) : 0);
    const utilajRaw = Array.isArray(row)
      ? arrayCell(row, 4, '')
      : pick(row, ['ciocan','CIOCAN','linie de forjare','Linie de forjare','linie_de_forjare','linie','Linie','utilaj','Utilaj','machine','Machine','E','BO']);
    const reperRaw = Array.isArray(row)
      ? arrayCell(row, 5, '')
      : pick(row, ['reper','REPER','Reper','reper_forjat','REPER_FORJAT','Reper forjat','F']);
    const realizatRaw = Array.isArray(row)
      ? arrayCell(row, 17, 0)
      : pick(row, ['buc_realizate','BUC_REALIZATE','bucRealizate','BUC Realizate','BUC REALIZATE','buc realizate','Buc realizate','buc','BUC','CB']);
    const rebutRaw = Array.isArray(row)
      ? arrayCell(row, 18, 0)
      : pick(row, ['rebut','REBUT','Rebut','rebuturi','Rebuturi','rebut pm','Rebut PM','CC']);
    return {
      id: trimText(Array.isArray(row) ? '' : pick(row, ['id','_id'])) || ('forjate-' + index),
      an,
      data,
      luna: getMonthName(lunaNum || lunaRaw),
      lunaNum,
      utilaj: trimText(utilajRaw),
      reper: trimText(reperRaw).toUpperCase(),
      bucRealizate: Math.max(0, Math.round(toNumber(realizatRaw))),
      rebut: Math.max(0, Math.round(toNumber(rebutRaw)))
    };
  }
  function normalizePlanSlot(slot){
    const source = slot && typeof slot === 'object' ? slot : {};
    return {
      reper: trimText(source.reper || source.REPER || '').toUpperCase(),
      planificat: Math.max(0, Math.round(toNumber(source.planificat || source.PLANIFICAT || 0))),
      realizat_seed: Math.max(0, Math.round(toNumber(source.realizat_seed || source.realizat || source.REALIZAT || 0)))
    };
  }
  function normalizePlanRow(row, index){
    const source = row && typeof row === 'object' ? row : {};
    const dataIso = displayToIso(source.data || source.DATA || source.id || '');
    const an = Number(source.an || source.AN || (dataIso ? dataIso.slice(0,4) : 0)) || 0;
    const slotsSource = source.slots && typeof source.slots === 'object' ? source.slots : {};
    const slots = {};
    MACHINE_ORDER.forEach(machine => {
      slots[machine] = normalizePlanSlot(slotsSource[machine] || source[machine] || {});
    });
    return {
      id: trimText(source.id || '') || ('plan-' + index),
      row_no: Number(source.row_no || source.rowNo || index + 1) || (index + 1),
      an,
      luna: trimText(source.luna || source.LUNA || getMonthName(dataIso ? Number(dataIso.slice(5,7)) : '')),
      data: dataIso,
      slots
    };
  }
  function pickLatestRowsByYearMonth(rows){
    let latestYear = 0, latestMonth = 0;
    (rows || []).forEach(row => {
      const year = Number(row && row.an || 0);
      const month = Number(row && row.lunaNum || monthNumberFromAny(row && row.luna));
      if(!year || !month) return;
      if(year > latestYear || (year === latestYear && month > latestMonth)){ latestYear = year; latestMonth = month; }
    });
    const selected = (rows || []).filter(row => Number(row && row.an || 0) === latestYear && Number(row && (row.lunaNum || monthNumberFromAny(row.luna))) === latestMonth);
    return { year:latestYear, month:latestMonth, label: latestYear && latestMonth ? `${getMonthName(latestMonth)} ${latestYear}` : '', rows:selected.length ? selected : (rows || []) };
  }

  async function initSupabase(){
    try{
      const authState = window.ERPAuth ? await window.ERPAuth.requireAuth({ next:'mrc.html', redirectToLogin:true }) : null;
      state.client = window.ERPAuth ? window.ERPAuth.getSupabaseClient() : null;
      state.user = authState && authState.user ? authState.user : null;
      state.role = authState && authState.role ? authState.role : 'viewer';
      el('authState').textContent = state.user ? `${state.user.email} • ${window.ERPAuth ? window.ERPAuth.roleLabel(state.role) : state.role}` : 'User neautentificat';
      el('syncState').textContent = state.client ? 'Cloud conectat' : 'Cloud indisponibil';
    }catch(err){
      console.error(err);
      el('authState').textContent = 'Autentificare indisponibilă';
      el('syncState').textContent = 'Cloud indisponibil';
    }
  }
  async function resolvePagePermissions(){
    state.canEdit = ['admin','editor'].includes(String(state.role || '').toLowerCase());
    if(!state.client) return;
    try{
      const res = await state.client.from('page_permissions').select('*').eq('role', state.role).in('page_key', [PAGE_KEY,'mrc']);
      if(!res.error && Array.isArray(res.data) && res.data.length){
        state.canEdit = res.data.some(row => row.can_edit === true || row.can_add === true);
      }
    }catch(_e){}
  }
  async function loadHelperMaps(){
    let debitByReper = Object.create(null), forjaByReper = Object.create(null), source='-';
    try{
      const [debitRes, forjaRes] = await Promise.all([
        state.client.from('rf_helper_repere_debitare').select('*').order('sort_order', { ascending:true }),
        state.client.from('rf_helper_repere_forjate').select('*').order('sort_order', { ascending:true })
      ]);
      if(debitRes.error) throw debitRes.error;
      if(forjaRes.error) throw forjaRes.error;
      (debitRes.data || []).forEach(row => {
        const active = row.is_active == null ? true : !!row.is_active;
        if(!active) return;
        const reper = trimText(row.reper_debitare || row.REPER_DEBITARE || '').toUpperCase();
        if(!reper) return;
        debitByReper[reper] = {
          reper_debitare: reper,
          diametru_otel: trimText(row.diametru_otel || row.DIAMETRU_OTEL || ''),
          calitate_otel: trimText(row.calitate_otel || row.CALITATE_OTEL || ''),
          kg_buc_debitat: toNumber(row.kg_buc_debitat || row.KG_BUC_DEBITAT || 0)
        };
      });
      (forjaRes.data || []).forEach(row => {
        const active = row.is_active == null ? true : !!row.is_active;
        if(!active) return;
        const reper = trimText(row.reper_forjat || row.REPER_FORJAT || '').toUpperCase();
        if(!reper) return;
        forjaByReper[reper] = {
          reper_forjat: reper,
          reper_debitare_origine: trimText(row.reper_debitare_origine || row.REPER_DEBITARE_ORIGINE || '').toUpperCase(),
          dimensiune_otel: trimText(row.dimensiune_otel || row.DIMENSIUNE_OTEL || row.diametru_otel || ''),
          calitate_otel: trimText(row.calitate_otel || row.CALITATE_OTEL || ''),
          kg_buc_forjat: toNumber(row.kg_buc_forjat || row.KG_BUC_FORJAT || 0)
        };
      });
      source = 'helper-data';
    }catch(err){ console.error('helper', err); source = 'helper-data error'; }
    state.helperMaps = { debitByReper, forjaByReper, source, loadedAt: nowIso() };
  }
  async function loadManualData(){
    state.manualMap = Object.create(null);
    state.orders = [];
    const [manualDoc, ordersDoc] = await Promise.all([readDocumentCompat(ADJUST_DOC_KEY), readDocumentCompat(ORDER_DOC_KEY)]);
    const manualRows = extractRowsPayload((manualDoc && (manualDoc.content || manualDoc.data)) || {}).length ? extractRowsPayload(manualDoc.content || manualDoc.data) : ((manualDoc && (manualDoc.content || manualDoc.data) && (manualDoc.content || manualDoc.data).rows) || []);
    const manualItems = Array.isArray(manualRows) ? manualRows : (((manualDoc && (manualDoc.content || manualDoc.data)) || {}).rows || []);
    manualItems.forEach(item => { if(item && item.rowKey) state.manualMap[item.rowKey] = item; });
    const op = (ordersDoc && (ordersDoc.content || ordersDoc.data)) || {};
    state.orders = Array.isArray(op.orders) ? op.orders : [];
  }
  async function loadSteelStock(){
    const docs = await queryDocsByKeys(STEEL_DOC_KEYS);
    const picked = docs.find(item => extractRowsPayload(item.content || item.data).length) || docs[0] || null;
    if(!picked) return { map:Object.create(null), source:'stoc-initial-otel lipsă', period:'' };
    const rows = extractRowsPayload(picked.content || picked.data).map(normalizeSteelRow);
    const latest = pickLatestRowsByYearMonth(rows);
    const bySpec = Object.create(null);
    const metaBySpec = Object.create(null);
    latest.rows.forEach(row => {
      if(!row.diametru || !row.calitate || row.cantitateKg <= 0) return;
      const key = buildSpecKey(row.diametru, row.calitate);
      bySpec[key] = toNumber(bySpec[key]) + row.cantitateKg;
      if(!metaBySpec[key]) metaBySpec[key] = { codIntern: row.codIntern || '', furnizor: row.furnizor || '' };
      if(!metaBySpec[key].codIntern && row.codIntern) metaBySpec[key].codIntern = row.codIntern;
      if(!metaBySpec[key].furnizor && row.furnizor) metaBySpec[key].furnizor = row.furnizor;
    });
    return { map:bySpec, metaBySpec, rows, source:picked.doc_key || 'stoc-initial-otel', period:latest.label };
  }


  async function loadDebitatStock(year){
    const docs = await queryDocsByKeys(buildFlowDocKeys(DEBITAT_DOC_BASE_KEYS, year));
    const picked = docs.find(item => extractRowsPayload(item.content || item.data).length) || docs[0] || null;
    if(!picked) return { rows:[], source:'inventar-debitat lipsă' };
    const rows = extractRowsPayload(picked.content || picked.data).map(normalizeDebitatRow);
    return { rows, source:picked.doc_key || 'inventar-debitat' };
  }

  async function loadIntrariOtelEntries(year){
    const docs = await queryDocsByKeys(buildFlowDocKeys(INTRARI_OTEL_DOC_BASE_KEYS, year));
    const picked = docs.find(item => extractRowsPayload(item.content || item.data).length) || docs[0] || null;
    if(!picked) return { rows:[], source:'intrari-otel lipsă' };
    const rows = extractRowsPayload(picked.content || picked.data).map(normalizeIntrariOtelRow).filter(r => !year || String(r.an) === String(year));
    return { rows, source:picked.doc_key || 'intrari-otel' };
  }
  async function loadForjateRows(year){
    let doc = await readDocumentCompat(FORJATE_DOC_PREFIX + year);
    if(!(doc && (doc.content || doc.data))) doc = await readDocumentCompat(LEGACY_FORJATE_DOC_KEY);
    if(!(doc && (doc.content || doc.data))) return { rows:[], source:'forjate lipsă' };
    const rows = extractRowsPayload(doc.content || doc.data).map(normalizeForjateFlowRow).filter(r => !year || String(r.an) === String(year));
    return { rows, source:doc.doc_key || LEGACY_FORJATE_DOC_KEY };
  }
  async function loadPlanRows(year){
    const doc = await readDocumentCompat(PLAN_DOC_KEY);
    if(!(doc && (doc.content || doc.data))) return { rows:[], source:'planificare-forja lipsă' };
    const rows = extractRowsPayload(doc.content || doc.data).map(normalizePlanRow).filter(r => !year || Number(r.an) === Number(year));
    return { rows, source:doc.doc_key || PLAN_DOC_KEY };
  }

  function aggregateRealizedByDateAndReper(rows){
    const map = Object.create(null);
    (rows || []).forEach(row => {
      if(!row.data || !row.reper) return;
      const key = `${row.data}|${normalizeReperLoose(row.reper)}`;
      map[key] = Math.max(0, Math.round(toNumber(map[key]) + row.bucRealizate));
    });
    return map;
  }
  function aggregateIntrariByWeekAndSpec(rows){
    const map = Object.create(null);
    (rows || []).forEach(row => {
      if(!row.data || !row.diametru || !row.calitate || row.cantitateKg <= 0) return;
      const meta = weekMeta(row.data);
      const spec = buildSpecKey(row.diametru, row.calitate);
      const key = `${meta.start}|${spec}`;
      map[key] = map[key] || { qty:0, codIntern:'', furnizor:'' };
      map[key].qty += row.cantitateKg;
      if(!map[key].codIntern && row.codIntern) map[key].codIntern = row.codIntern;
      if(!map[key].furnizor && row.furnizor) map[key].furnizor = row.furnizor;
    });
    return map;
  }

  function resolveMaterialForForgedReper(reper){
    const forgedRaw = trimText(reper).toUpperCase();
    const forgedKey = normalizeReperLoose(forgedRaw);
    const forjaHelper = state.helperMaps.forjaByReper[forgedRaw] || state.helperMaps.forjaByReper[forgedKey] || Object.values(state.helperMaps.forjaByReper).find(item => normalizeReperLoose(item.reper_forjat) === forgedKey) || null;
    const debitedReper = trimText(forjaHelper && forjaHelper.reper_debitare_origine).toUpperCase() || forgedRaw;
    const debitKey = normalizeReperLoose(debitedReper);
    const debitHelper = state.helperMaps.debitByReper[debitedReper] || state.helperMaps.debitByReper[debitKey] || Object.values(state.helperMaps.debitByReper).find(item => normalizeReperLoose(item.reper_debitare) === debitKey) || null;
    const diameter = trimText((debitHelper && debitHelper.diametru_otel) || (forjaHelper && forjaHelper.dimensiune_otel) || '');
    const quality = trimText((debitHelper && debitHelper.calitate_otel) || (forjaHelper && forjaHelper.calitate_otel) || '');
    const kgPerPiece = Math.max(0, toNumber((debitHelper && debitHelper.kg_buc_debitat) || 0));
    return { forgedRaw, forgedKey, debitedReper, diameter, quality, kgPerPiece };
  }

  function aggregateForjateConsumptionByWeekAndSpec(rows){
    const map = Object.create(null);
    (rows || []).forEach(row => {
      if(!row.data || !row.reper) return;
      const material = resolveMaterialForForgedReper(row.reper);
      if(!material.diameter || !material.quality || material.kgPerPiece <= 0) return;
      const meta = weekMeta(row.data);
      const spec = buildSpecKey(material.diameter, material.quality);
      const key = `${meta.start}|${spec}`;
      map[key] = map[key] || { bucRealizate:0, rebut:0, consumKg:0 };
      const good = Math.max(0, Math.round(toNumber(row.bucRealizate)));
      const rebut = Math.max(0, Math.round(toNumber(row.rebut)));
      map[key].bucRealizate += good;
      map[key].rebut += rebut;
      map[key].consumKg += (good + rebut) * material.kgPerPiece;
    });
    return map;
  }
  function buildDemandRows(planRows, realizedMap){
    const rows = [];
    (planRows || []).forEach(planRow => {
      if(!planRow.data) return;
      MACHINE_ORDER.forEach(machine => {
        const slot = planRow.slots[machine] || { reper:'', planificat:0, realizat_seed:0 };
        if(!slot.reper || slot.planificat <= 0) return;
        const realized = toNumber(realizedMap[`${planRow.data}|${normalizeReperLoose(slot.reper)}`]) + toNumber(slot.realizat_seed || 0);
        const remaining = Math.max(0, Math.round(slot.planificat - realized));
        if(remaining <= 0) return;
        const material = resolveMaterialForForgedReper(slot.reper);
        const meta = weekMeta(planRow.data);
        rows.push({
          id: `${meta.start}|${slot.reper}|${material.debitedReper}|${machine}|${planRow.data}`,
          rowDate: planRow.data,
          year: Number(planRow.an) || Number(String(planRow.data).slice(0,4)) || 0,
          month: getMonthName(Number(String(planRow.data).slice(5,7))),
          week: meta.week,
          start: meta.start,
          end: meta.end,
          forged: trimText(slot.reper).toUpperCase(),
          debited: material.debitedReper,
          diameter: material.diameter,
          quality: material.quality,
          internalCode: '',
          machine,
          kgPerPiece: material.kgPerPiece,
          plannedPiecesOriginal: Math.max(0, Math.round(slot.planificat)),
          realizedPieces: Math.max(0, Math.round(realized)),
          planFuturePieces: remaining,
          sourceDate: planRow.data
        });
      });
    });
    const grouped = Object.create(null);
    rows.forEach(row => {
      const key = [row.start,row.end,row.forged,row.debited,row.diameter,row.quality,row.kgPerPiece].join('|');
      if(!grouped[key]) grouped[key] = { ...row };
      else {
        grouped[key].plannedPiecesOriginal += row.plannedPiecesOriginal;
        grouped[key].realizedPieces += row.realizedPieces;
        grouped[key].planFuturePieces += row.planFuturePieces;
      }
    });
    return Object.values(grouped).sort((a,b) => (a.start||'').localeCompare(b.start||'') || a.forged.localeCompare(b.forged));
  }


  function applyStocksAndManual(demandRows, steelData, debitatRows, intrariByWeekSpec, realizedWeekSpec){
    const rows = Array.isArray(demandRows) ? demandRows.slice() : [];
    if(!rows.length) return { rows:[], snapshotEnd:'' };

    rows.sort((a,b) => (a.start || '').localeCompare(b.start || '') || (a.sourceDate || '').localeCompare(b.sourceDate || '') || a.forged.localeCompare(b.forged) || a.machine.localeCompare(b.machine));

    const firstPlanIso = rows.reduce((acc, row) => {
      const v = trimText(row.rowDate || row.sourceDate || row.start || '');
      return !acc || (v && v < acc) ? v : acc;
    }, '');
    const snapshotEnd = findLatestCommonSnapshotEnd((steelData && steelData.rows) || [], debitatRows || [], firstPlanIso);

    const running = Object.create(null);
    const steelMetaBySpec = Object.assign(Object.create(null), (steelData && steelData.metaBySpec) || {});

    ((steelData && steelData.rows) || []).forEach(row => {
      if(endOfMonthIso(row && row.an, row && row.lunaNum) !== snapshotEnd) return;
      if(!row.diametru || !row.calitate || row.cantitateKg <= 0) return;
      const specKey = buildSpecKey(row.diametru, row.calitate);
      running[specKey] = toNumber(running[specKey]) + toNumber(row.cantitateKg);
      steelMetaBySpec[specKey] ||= { codIntern: row.codIntern || '', furnizor: row.furnizor || '' };
      if(!steelMetaBySpec[specKey].codIntern && row.codIntern) steelMetaBySpec[specKey].codIntern = row.codIntern;
      if(!steelMetaBySpec[specKey].furnizor && row.furnizor) steelMetaBySpec[specKey].furnizor = row.furnizor;
    });

    (debitatRows || []).forEach(row => {
      if(endOfMonthIso(row && row.an, row && row.lunaNum) !== snapshotEnd) return;
      if(!row.reper || row.cantitateBuc <= 0) return;
      const mat = resolveMaterialForDebitedReper(row.reper);
      if(!mat.diameter || !mat.quality || mat.kgPerPiece <= 0) return;
      const specKey = buildSpecKey(mat.diameter, mat.quality);
      running[specKey] = toNumber(running[specKey]) + (toNumber(row.cantitateBuc) * toNumber(mat.kgPerPiece));
      steelMetaBySpec[specKey] ||= { codIntern:'', furnizor:'' };
    });

    const weekMap = Object.create(null);
    rows.forEach(row => {
      weekMap[row.start] = weekMap[row.start] || [];
      weekMap[row.start].push(row);
    });

    const timelineWeeks = new Set(Object.keys(weekMap));
    Object.keys(intrariByWeekSpec || {}).forEach(key => {
      const weekStart = key.split('|')[0];
      if(!snapshotEnd || weekStart > snapshotEnd) timelineWeeks.add(weekStart);
    });
    Object.keys(realizedWeekSpec || {}).forEach(key => {
      const weekStart = key.split('|')[0];
      if(!snapshotEnd || weekStart > snapshotEnd) timelineWeeks.add(weekStart);
    });
    const weekOrder = Array.from(timelineWeeks).sort();

    const out = [];
    weekOrder.forEach(weekStart => {
      const weekRows = (weekMap[weekStart] || []).slice().sort((a,b) => (a.sourceDate || '').localeCompare(b.sourceDate || '') || a.forged.localeCompare(b.forged) || a.machine.localeCompare(b.machine));
      const specsInWeek = new Set();
      weekRows.forEach(row => specsInWeek.add(buildSpecKey(row.diameter, row.quality)));
      Object.keys(intrariByWeekSpec || {}).forEach(key => { if(key.startsWith(weekStart + '|')) specsInWeek.add(key.split('|').slice(1).join('|')); });
      Object.keys(realizedWeekSpec || {}).forEach(key => { if(key.startsWith(weekStart + '|')) specsInWeek.add(key.split('|').slice(1).join('|')); });

      const openingBySpec = Object.create(null);
      specsInWeek.forEach(specKey => {
        openingBySpec[specKey] = Math.max(0, toNumber(running[specKey]));
      });

      specsInWeek.forEach(specKey => {
        const intrariMeta = (intrariByWeekSpec && intrariByWeekSpec[`${weekStart}|${specKey}`]) || { qty:0, codIntern:'', furnizor:'' };
        const realizedMeta = (realizedWeekSpec && realizedWeekSpec[`${weekStart}|${specKey}`]) || { bucRealizate:0, rebut:0, consumKg:0 };
        running[specKey] = Math.max(0, toNumber(openingBySpec[specKey]) + Math.max(0, toNumber(intrariMeta.qty)) - Math.max(0, toNumber(realizedMeta.consumKg)));
        steelMetaBySpec[specKey] ||= { codIntern:'', furnizor:'' };
        if(!steelMetaBySpec[specKey].codIntern && intrariMeta.codIntern) steelMetaBySpec[specKey].codIntern = intrariMeta.codIntern;
        if(!steelMetaBySpec[specKey].furnizor && intrariMeta.furnizor) steelMetaBySpec[specKey].furnizor = intrariMeta.furnizor;
      });

      const seenWeekSpec = new Set();
      weekRows.forEach(row => {
        const specKey = buildSpecKey(row.diameter, row.quality);
        const weekSpecKey = `${weekStart}|${specKey}`;
        const firstWeekSpecRow = !seenWeekSpec.has(weekSpecKey);
        seenWeekSpec.add(weekSpecKey);
        const intrariMeta = (intrariByWeekSpec && intrariByWeekSpec[weekSpecKey]) || { qty:0, codIntern:'', furnizor:'' };
        const realizedMeta = (realizedWeekSpec && realizedWeekSpec[weekSpecKey]) || { bucRealizate:0, rebut:0, consumKg:0 };
        const stocDisponibilReal = Math.max(0, toNumber(running[specKey]));
        const consumPlanificatKg = Math.max(0, toNumber(row.planFuturePieces) * toNumber(row.kgPerPiece));
        const stocTeoreticFinal = stocDisponibilReal - consumPlanificatKg;
        const necesarKg = Math.max(0, -stocTeoreticFinal);
        const coverage = consumPlanificatKg > 0 ? Math.max(0, Math.min(1, stocDisponibilReal / consumPlanificatKg)) : 1;
        running[specKey] = Math.max(0, stocTeoreticFinal);
        const rowKey = [row.start,row.forged,row.debited,row.diameter,row.quality].join('|');
        const manual = state.manualMap[rowKey] || {};
        const specMeta = steelMetaBySpec[specKey] || {};
        const defaultStatus = necesarKg > 0 ? 'Lipsă material' : (coverage < 1 ? 'Aproape limită' : 'Acoperit');

        out.push({
          ...row,
          rowKey,
          consumPlanificatKg,
          startStockKg: firstWeekSpecRow ? Math.max(0, toNumber(openingBySpec[specKey])) : 0,
          plannedInKg: firstWeekSpecRow ? Math.max(0, toNumber(intrariMeta.qty)) : 0,
          bucRealizate: firstWeekSpecRow ? Math.max(0, Math.round(toNumber(realizedMeta.bucRealizate))) : 0,
          rebut: firstWeekSpecRow ? Math.max(0, Math.round(toNumber(realizedMeta.rebut))) : 0,
          consumRealizatKg: firstWeekSpecRow ? Math.max(0, toNumber(realizedMeta.consumKg)) : 0,
          stocDisponibilReal,
          stocTeoreticFinal,
          needKg: necesarKg,
          coverage,
          internalCode: trimText(manual.internalCode || intrariMeta.codIntern || specMeta.codIntern || row.internalCode || ''),
          proposedOrderKg: manual.proposedOrderKg != null ? toNumber(manual.proposedOrderKg) : necesarKg,
          proposedSupplier: trimText(manual.proposedSupplier || intrariMeta.furnizor || specMeta.furnizor || ''),
          needDate: trimText(manual.needDate || row.start || ''),
          status: trimText(manual.status || defaultStatus),
          notes: trimText(manual.notes || '')
        });
      });
    });

    return { rows: out, snapshotEnd };
  }


  async function loadProjectData(){
    const activeYear = String(new Date().getFullYear());
    await loadHelperMaps();
    await loadManualData();
    const [steelRes, debitatRes, intrariRes, forjateRes, planRes] = await Promise.all([
      loadSteelStock(),
      loadDebitatStock(activeYear),
      loadIntrariOtelEntries(activeYear),
      loadForjateRows(activeYear),
      loadPlanRows(activeYear)
    ]);
    const realizedMap = aggregateRealizedByDateAndReper(forjateRes.rows);
    const demandRows = buildDemandRows(planRes.rows, realizedMap);
    const firstPlanIso = demandRows.reduce((acc, row) => {
      const v = trimText(row.rowDate || row.sourceDate || row.start || '');
      return !acc || (v && v < acc) ? v : acc;
    }, '');
    const snapshotEnd = findLatestCommonSnapshotEnd((steelRes.rows || []), (debitatRes.rows || []), firstPlanIso);
    const intrariFiltered = (intrariRes.rows || []).filter(r => !snapshotEnd || trimText(r.data) > snapshotEnd);
    const forjateFiltered = (forjateRes.rows || []).filter(r => !snapshotEnd || trimText(r.data) > snapshotEnd);
    const intrariByWeekSpec = aggregateIntrariByWeekAndSpec(intrariFiltered);
    const realizedWeekSpec = aggregateForjateConsumptionByWeekAndSpec(forjateFiltered);
    const calc = applyStocksAndManual(demandRows, steelRes, debitatRes.rows || [], intrariByWeekSpec, realizedWeekSpec);
    state.rows = calc.rows || [];
    const snapshotLabel = calc.snapshotEnd ? isoToDisplay(calc.snapshotEnd) : '-';
    state.sourceNotes = [
      `Planificare: ${planRes.source}`,
      `Forjate: ${forjateRes.source}`,
      `Stoc oțel: ${steelRes.source}${steelRes.period ? ' • ' + steelRes.period : ''}`,
      `Stoc debitat: ${debitatRes.source}`,
      `Intrări oțel: ${intrariRes.source}`,
      `Helper: ${state.helperMaps.source}`,
      `Snapshot MRC comun: ${snapshotLabel}`
    ];
    state.lastLoadedAt = nowIso();
    if(!state.rows.length){
      el('syncState').textContent = 'Cloud conectat, dar MRC nu a găsit date suficiente';
    }else{
      el('syncState').textContent = `Legat de proiect • ${state.rows.length} rânduri`;
    }
  }

  function initFilters(){
    const years = [...new Set(state.rows.map(r => String(r.year)).filter(Boolean))].sort();
    el('fYear').innerHTML = `<option value="">Toți</option>` + years.map(y => `<option value="${y}">${y}</option>`).join('');
    el('fMonth').innerHTML = `<option value="">Toate</option>` + MONTHS.map(m => `<option value="${m}">${m}</option>`).join('');
    const weeks = [...new Set(state.rows.map(r => r.week).filter(Boolean))].sort();
    el('fWeek').innerHTML = `<option value="">Toate</option>` + weeks.map(w => `<option value="${w}">${w}</option>`).join('');
    const now = new Date();
    if(years.includes(String(now.getFullYear()))) el('fYear').value = String(now.getFullYear());
    el('fMonth').value = MONTHS[now.getMonth()] || '';
  }
  function getFilteredRows(){
    const year = trimText(el('fYear').value);
    const month = normUpper(el('fMonth').value);
    const week = normUpper(el('fWeek').value);
    const forged = normUpper(el('fForged').value);
    const diameter = normUpper(el('fDiameter').value);
    const quality = normUpper(el('fQuality').value);
    const internalCode = normUpper(el('fInternalCode').value);
    const supplier = normUpper(el('fSupplier').value);
    const onlyDeficit = el('fOnlyDeficit').checked;
    const onlyOpenOrders = el('fOnlyOpenOrders').checked;
    return state.rows.filter(r => {
      if(year && String(r.year) !== year) return false;
      if(month && normUpper(r.month) !== month) return false;
      if(week && normUpper(r.week) !== week) return false;
      if(forged && !normUpper(r.forged).includes(forged)) return false;
      if(diameter && !normUpper(r.diameter).includes(diameter)) return false;
      if(quality && !normUpper(r.quality).includes(quality)) return false;
      if(internalCode && !normUpper(r.internalCode).includes(internalCode)) return false;
      if(supplier && !normUpper(r.proposedSupplier).includes(supplier)) return false;
      if(onlyDeficit && Number(r.deficitKg) <= 0) return false;
      if(onlyOpenOrders && !['COMANDĂ LANSATĂ','PROPUSĂ','ÎN AȘTEPTARE APROBARE'].includes(normUpper(r.status))) return false;
      return true;
    });
  }
  function rowClass(r){
    const status = normUpper(r.status);
    if(status.includes('LIPS')) return 'row-status-risk';
    if(status.includes('APROAPE') || status.includes('PARȚ') || status.includes('PARTIAL')) return 'row-status-partial';
    if(status.includes('LANSAT') || status.includes('AȘTEPTARE')) return 'row-status-order';
    return 'row-status-ok';
  }
  function renderMainTable(){
    const rows = getFilteredRows();
    el('tableCountBadge').textContent = `${rows.length} rânduri`;
    el('mrcBody').innerHTML = rows.map(r => `
      <tr class="${rowClass(r)} ${state.selectedId === r.id ? 'selected' : ''}" data-id="${r.id}">
        <td class="sticky-col">${r.year}</td>
        <td class="sticky-col-2">${r.month}</td>
        <td>${r.week}</td>
        <td>${isoToDisplay(r.start)}</td>
        <td>${isoToDisplay(r.end)}</td>
        <td class="bold">${r.forged}</td>
        <td>${r.debited}</td>
        <td>${r.diameter}</td>
        <td>${r.quality}</td>
        <td>${r.internalCode || ''}</td>
        <td class="num">${fmtNum(r.kgPerPiece)}</td>
        <td class="num" title="Plan inițial ${fmtNum(r.plannedPiecesOriginal)} / Realizat bun deja ${fmtNum(r.realizedPieces)}">${fmtNum(r.planFuturePieces)}</td>
        <td class="num bold">${fmtNum(r.consumPlanificatKg)}</td>
        <td class="num">${fmtNum(r.startStockKg)}</td>
        <td class="num">${fmtNum(r.plannedInKg)}</td>
        <td class="num">${fmtNum(r.bucRealizate)}</td>
        <td class="num">${fmtNum(r.rebut)}</td>
        <td class="num">${fmtNum(r.consumRealizatKg)}</td>
        <td class="num bold ${r.stocDisponibilReal >= 0 ? 'success':''}">${fmtNum(r.stocDisponibilReal)}</td>
        <td class="num bold ${r.stocTeoreticFinal < 0 ? 'danger':'success'}">${fmtNum(r.stocTeoreticFinal)}</td>
        <td class="num bold ${r.needKg > 0 ? 'danger':''}">${fmtNum(r.needKg)}</td>
        <td class="num bold ${r.coverage < 1 ? 'danger':'success'}">${fmtPct(r.coverage)}</td>
        <td class="num"><input ${state.canEdit ? '' : 'disabled'} class="editable num cell-edit" data-row-key="${r.rowKey}" data-field="proposedOrderKg" value="${fmtNum(r.proposedOrderKg)}"></td>
        <td><input ${state.canEdit ? '' : 'disabled'} class="editable cell-edit" data-row-key="${r.rowKey}" data-field="proposedSupplier" value="${safe(r.proposedSupplier)}"></td>
        <td><input ${state.canEdit ? '' : 'disabled'} type="date" class="editable cell-edit" data-row-key="${r.rowKey}" data-field="needDate" value="${safe(r.needDate)}"></td>
        <td><select ${state.canEdit ? '' : 'disabled'} class="editable cell-edit" data-row-key="${r.rowKey}" data-field="status">${['Acoperit','Aproape limită','Lipsă material','Comandă lansată','În așteptare aprobare'].map(v => `<option ${r.status===v?'selected':''}>${v}</option>`).join('')}</select></td>
        <td><input ${state.canEdit ? '' : 'disabled'} class="editable cell-edit" data-row-key="${r.rowKey}" data-field="notes" value="${safe(r.notes)}"></td>
      </tr>`).join('') || `<tr><td colspan="27" style="text-align:center;padding:20px;font-weight:800">Nu există date pentru filtrarea selectată.</td></tr>`;
  }
  function renderKPIs(){
    const rows = getFilteredRows();
    const totalPlanned = rows.reduce((s, r) => s + Number(r.consumPlanificatKg || 0), 0);
    const totalAvailable = rows.reduce((s, r) => s + Number(r.stocDisponibilReal || 0), 0);
    const totalNeed = rows.reduce((s, r) => s + Number(r.needKg || 0), 0);
    const riskCount = rows.filter(r => r.needKg > 0 || r.coverage < 1).length;
    el('kNeed').textContent = fmtKg(totalPlanned);
    el('kAvailable').textContent = fmtKg(totalAvailable);
    el('kDeficit').textContent = fmtKg(totalNeed);
    el('kRisk').textContent = riskCount;
    const critical = Object.values(rows.reduce((acc, r) => {
      const key = `${r.diameter} | ${r.quality}`;
      acc[key] ||= { key, deficit: 0 };
      acc[key].deficit += Number(r.needKg || 0);
      return acc;
    }, {})).sort((a,b)=>b.deficit-a.deficit).slice(0,5);
    el('criticalList').innerHTML = critical.length ? critical.map(x => `<div class="mini-item"><div>${x.key}<small>Material critic</small></div><span class="badge ${x.deficit > 0 ? 'risk':'ok'}">${fmtKg(x.deficit)}</span></div>`).join('') : `<div class="mini-item"><div>Nu există materiale critice<small>Totul este acoperit</small></div><span class="badge ok">OK</span></div>`;
    const riskyParts = Object.values(rows.reduce((acc, r) => {
      const key = r.forged || '-';
      acc[key] ||= { key, deficit:0 };
      acc[key].deficit += Number(r.needKg || 0);
      return acc;
    }, {})).sort((a,b)=>b.deficit-a.deficit).slice(0,5);
    el('riskPartsList').innerHTML = riskyParts.length ? riskyParts.map(x => `<div class="mini-item"><div>${x.key}<small>Reper cu risc</small></div><span class="badge ${x.deficit > 0 ? 'risk':'ok'}">${fmtKg(x.deficit)}</span></div>`).join('') : `<div class="mini-item"><div>Nu există repere cu risc<small>Necesarele sunt acoperite</small></div><span class="badge ok">OK</span></div>`;
  }
  function renderPivot(){
    const rows = getFilteredRows();
    const weekOrder = [...new Set(rows.map(r => r.week).filter(Boolean))].sort();
    const grouped = {};
    rows.forEach(r => {
      const key = `${r.diameter} | ${r.quality}`;
      grouped[key] ||= { material:key, totals:Object.create(null) };
      const value = state.pivotMode === 'stock'
        ? r.stocTeoreticFinal
        : (state.pivotMode === 'consum' ? r.consumPlanificatKg : r.needKg);
      grouped[key].totals[r.week] = toNumber(grouped[key].totals[r.week]) + value;
    });
    el('pivotHead').innerHTML = `<tr><th class="sticky-col">Material</th>${weekOrder.map(w => `<th>${w}</th>`).join('')}<th>Total</th></tr>`;
    const body = Object.values(grouped).map(item => {
      const total = weekOrder.reduce((s,w)=>s+toNumber(item.totals[w]),0);
      return `<tr><td class="sticky-col bold">${item.material}</td>${weekOrder.map(w => `<td class="num ${toNumber(item.totals[w]) < 0 ? 'danger' : ''}">${fmtNum(item.totals[w] || 0)}</td>`).join('')}<td class="num bold ${total < 0 ? 'danger' : ''}">${fmtNum(total)}</td></tr>`;
    }).join('');
    el('pivotBody').innerHTML = body || `<tr><td colspan="10" style="text-align:center;padding:16px;font-weight:800">Nu există date pivot.</td></tr>`;
  }
  function renderOrders(){
    const html = state.orders.map(o => `<tr><td>${safe(o.no)}</td><td>${isoToDisplay(o.orderDate)}</td><td>${safe(o.supplier)}</td><td>${safe(o.diameter)}</td><td>${safe(o.quality)}</td><td>${safe(o.internalCode)}</td><td class="num">${fmtNum(o.qtyKg)}</td><td>${isoToDisplay(o.deliveryDate)}</td><td>${safe(o.week)}</td><td>${safe(o.reason)}</td><td>${safe(o.status)}</td><td>${safe(o.notes)}</td></tr>`).join('');
    el('ordersBody').innerHTML = html || `<tr><td colspan="12" style="text-align:center;padding:16px;font-weight:800">Nu există comenzi generate.</td></tr>`;
  }
  function rerender(){ renderMainTable(); renderKPIs(); renderPivot(); renderOrders(); }

  function updateManual(rowKey, field, value){
    state.manualMap[rowKey] = state.manualMap[rowKey] || { rowKey };
    state.manualMap[rowKey][field] = value;
    const row = state.rows.find(r => r.rowKey === rowKey);
    if(row) row[field] = field === 'proposedOrderKg' ? toNumber(value) : value;
  }
  async function saveCloudData(){
    if(!state.canEdit){ alert('Contul curent nu are drept de editare pe MRC.'); return; }
    try{
      const payload = { rows:Object.values(state.manualMap), updated_at:nowIso(), source_notes:state.sourceNotes };
      const orders = { orders:state.orders, updated_at:nowIso() };
      await Promise.all([writeDocumentCompat(ADJUST_DOC_KEY, payload), writeDocumentCompat(ORDER_DOC_KEY, orders)]);
      el('syncState').textContent = `Cloud salvat ${new Date().toLocaleTimeString('ro-RO')}`;
    }catch(err){ console.error(err); alert('Nu am putut salva în rf_documents.'); }
  }
  function generateOrdersFromDeficit(){
    const rows = getFilteredRows().filter(r => toNumber(r.proposedOrderKg) > 0);
    state.orders = rows.map((r, idx) => ({
      id: `mrc-order-${idx+1}-${r.rowKey}`,
      no: `PO-MRC-${String(idx+1).padStart(3,'0')}`,
      orderDate: new Date().toISOString().slice(0,10),
      supplier: r.proposedSupplier || '',
      diameter: r.diameter,
      quality: r.quality,
      internalCode: r.internalCode || '',
      qtyKg: toNumber(r.proposedOrderKg),
      deliveryDate: r.needDate || r.start,
      week: r.week,
      reason: `${r.forged} / ${r.debited}`,
      status: r.status === 'Comandă lansată' ? 'Lansată' : 'Propusă',
      notes: r.notes || ''
    }));
    renderOrders();
  }
  function exportExcel(){
    const rows = getFilteredRows().map(r => ({
      An:r.year,Luna:r.month,Saptamana:r.week,DataStart:r.start,DataEnd:r.end,ReperForjat:r.forged,ReperDebitat:r.debited,
      Diametru:r.diameter,Calitate:r.quality,CodIntern:r.internalCode,KgBuc:r.kgPerPiece,
      PlanBucViitor:r.planFuturePieces,ConsumPlanificatKg:r.consumPlanificatKg,
      StocInceput:r.startStockKg,Intrari:r.plannedInKg,BucRealizate:r.bucRealizate,Rebut:r.rebut,
      ConsumRealizatKg:r.consumRealizatKg,StocDisponibilReal:r.stocDisponibilReal,StocTeoreticFinal:r.stocTeoreticFinal,
      NecesarKg:r.needKg,Acoperire:r.coverage,ComandaPropusaKg:r.proposedOrderKg,Furnizor:r.proposedSupplier,
      DataNecesara:r.needDate,Status:r.status,Observatii:r.notes,RowKey:r.rowKey
    }));
    const ws1 = XLSX.utils.json_to_sheet(rows);
    const ws2 = XLSX.utils.json_to_sheet(state.orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'MRC');
    XLSX.utils.book_append_sheet(wb, ws2, 'Comenzi');
    XLSX.writeFile(wb, `MRC_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
  function importExcel(file){
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval:'' });
      data.forEach(row => {
        const rowKey = trimText(row.RowKey || row.rowKey);
        if(!rowKey) return;
        updateManual(rowKey, 'proposedOrderKg', row.ComandaPropusaKg || row.proposedOrderKg || 0);
        updateManual(rowKey, 'proposedSupplier', row.Furnizor || row.proposedSupplier || '');
        updateManual(rowKey, 'needDate', row.DataNecesara || row.needDate || '');
        updateManual(rowKey, 'status', row.Status || row.status || '');
        updateManual(rowKey, 'notes', row.Observatii || row.notes || '');
      });
      rerender();
    };
    reader.readAsArrayBuffer(file);
  }
  function bindEvents(){
    ['fYear','fMonth','fWeek','fForged','fDiameter','fQuality','fInternalCode','fSupplier'].forEach(id => {
      el(id).addEventListener('input', rerender);
      el(id).addEventListener('change', rerender);
    });
    ['fOnlyDeficit','fOnlyOpenOrders'].forEach(id => el(id).addEventListener('change', rerender));
    document.querySelectorAll('.pivot-mode').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.pivot-mode').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      state.pivotMode = btn.dataset.mode;
      renderPivot();
    }));
    document.addEventListener('input', ev => {
      const t = ev.target;
      if(!t.classList.contains('cell-edit')) return;
      updateManual(t.dataset.rowKey, t.dataset.field, t.value);
    });
    document.addEventListener('change', ev => {
      const t = ev.target;
      if(!t.classList.contains('cell-edit')) return;
      updateManual(t.dataset.rowKey, t.dataset.field, t.value);
    });
    el('btnSave').addEventListener('click', saveCloudData);
    el('btnRefresh').addEventListener('click', async () => { await loadProjectData(); initFilters(); rerender(); });
    el('btnGenerateOrders').addEventListener('click', generateOrdersFromDeficit);
    el('btnExport').addEventListener('click', exportExcel);
    el('btnImport').addEventListener('click', () => el('fileInput').click());
    el('fileInput').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) importExcel(f); e.target.value=''; });
    el('btnBack').addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  async function boot(){
    await initSupabase();
    if(!state.client) return;
    await resolvePagePermissions();
    await loadProjectData();
    initFilters();
    bindEvents();
    rerender();
  }
  boot();
})();
