


    const PAGE_KEY = 'inventar-otel';
    const CACHE_KEY = 'rf_inventar_otel_cache_v1';
    const DOC_KEYS = {
      initial: ['stoc-initial-otel', 'stoc_initial_otel', 'inventar-otel-initial', 'inventar_otel_initial'],
      entries: ['intrari-otel', 'intrari_otel', 'intrari otel'],
      consumption: ['debitate', 'debitari']
    };

    const MONTH_ORDER = {
      'ianuarie':1,'februarie':2,'martie':3,'aprilie':4,'mai':5,'iunie':6,
      'iulie':7,'august':8,'septembrie':9,'octombrie':10,'noiembrie':11,'decembrie':12
    };

    const state = {
      supabase: null,
      session: null,
      role: 'viewer',
      raw: { initial: [], entries: [], consumption: [] },
      rows: [],
      filtered: [],
      lastCloudUpdatedAt: '',
      lastLoadTs: 0,
      lastRefreshReason: 'Inițializare'
    };

    const els = {
      authBox: document.getElementById('authBox'),
      totalStock: document.getElementById('totalStock'),
      totalEntries: document.getElementById('totalEntries'),
      totalConsumption: document.getElementById('totalConsumption'),
      metaInfo: document.getElementById('metaInfo'),
      sourceInfo: document.getElementById('sourceInfo'),
      tbody: document.getElementById('tbody'),
      emptyBox: document.getElementById('emptyBox'),
      btnPhysical: document.getElementById('btnPhysical'),
      btnRefresh: document.getElementById('btnRefresh'),
      btnExport: document.getElementById('btnExport'),
      btnLogout: document.getElementById('btnLogout'),
      btnBack: document.getElementById('btnBack'),
      fYear: document.getElementById('fYear'),
      fMonth: document.getElementById('fMonth'),
      fDiam: document.getElementById('fDiam'),
      fCal: document.getElementById('fCal'),
      fCode: document.getElementById('fCode'),
      fSupplier: document.getElementById('fSupplier'),
      fPretest: document.getElementById('fPretest'),
      fSearch: document.getElementById('fSearch')
    };

    function getConfig(){
      const shared = window.RF_CONFIG || window.rfConfig || {};
      return {
        supabaseUrl: shared.supabaseUrl || shared.SUPABASE_URL || 'https://addlybnigrywqowpbhvd.supabase.co',
        supabaseAnonKey: shared.supabaseAnonKey || shared.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4'
      };
    }

    function createClient(){
      const cfg = getConfig();
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        throw new Error('Lipsește configurația Supabase.');
      }
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }

    function normText(value){
      return String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function clean(value){
      return String(value ?? '').trim();
    }

    function upper(value){
      return clean(value).toUpperCase();
    }

    function pick(obj, keys){
      if (!obj || typeof obj !== 'object') return '';
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
      }
      const loweredMap = {};
      for (const [k,v] of Object.entries(obj)) loweredMap[normText(k)] = v;
      for (const key of keys) {
        const v = loweredMap[normText(key)];
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return '';
    }

    function toNumber(value){
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      const s = String(value ?? '').trim();
      if (!s) return 0;
      const normalized = s
        .replace(/\s/g,'')
        .replace(/\.(?=\d{3}(\D|$))/g,'')
        .replace(',', '.');
      const n = Number(normalized.replace(/[^0-9.-]/g,''));
      return Number.isFinite(n) ? n : 0;
    }

    function prettyNumber(value){
      const n = Number(value || 0);
      return n.toLocaleString('ro-RO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }

    function escapeHtml(value){
      return String(value ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }

    function monthNameFromAny(value){
      const raw = clean(value);
      if (!raw) return '';
      const normalized = normText(raw);
      if (MONTH_ORDER[normalized]) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      const num = Number(raw);
      if (Number.isInteger(num) && num >= 1 && num <= 12) {
        const found = Object.entries(MONTH_ORDER).find(([,n]) => n === num);
        if (found) return found[0].charAt(0).toUpperCase() + found[0].slice(1);
      }
      return raw;
    }

    function monthSortValue(label){
      return MONTH_ORDER[normText(label)] || 99;
    }

    function formatDate(value){
      const s = clean(value);
      if (!s) return '';
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y,m,d] = s.slice(0,10).split('-');
        return `${d}.${m}.${y}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d,m,y] = s.split('/');
        return `${d}.${m}.${y}`;
      }
      const dt = new Date(s);
      if (!Number.isNaN(dt.getTime())) {
        const d = String(dt.getDate()).padStart(2,'0');
        const m = String(dt.getMonth()+1).padStart(2,'0');
        const y = dt.getFullYear();
        return `${d}.${m}.${y}`;
      }
      return s;
    }

    function yearFromRow(obj){
      const direct = clean(pick(obj,['an','year','AN','Year']));
      if (direct) return direct;
      const d = formatDate(pick(obj,['data','date','DATA','Date']));
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) return d.slice(-4);
      return '';
    }

    function extractRows(doc){
      if (!doc) return [];
      const candidates = [doc.content, doc.data];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
          if (Array.isArray(candidate.rows)) return candidate.rows;
          if (Array.isArray(candidate.items)) return candidate.items;
          if (Array.isArray(candidate.data)) return candidate.data;
          if (Array.isArray(candidate.records)) return candidate.records;
          if (Array.isArray(candidate.values)) return candidate.values;
        }
      }
      return [];
    }

    function normalizeInitialRow(row){
      const diametru = clean(pick(row,['diametru','diametru otel','diametru_otel','D','diam'])) || clean(pick(row,['Diametru otel','Diametru'])) ;
      const calitate = clean(pick(row,['calitate','calitate otel','calitate_otel'])) || clean(pick(row,['Calitate otel','Calitate']));
      const codIntern = upper(pick(row,['cod intern otel','cod_intern_otel','cod intern','codInternOtel','codIntern','cod'])) ;
      const cantitate = toNumber(pick(row,['cantitate','cantitate kg','cantitate_kg','kg','stoc initial','stoc_initial','cantitate initiala','cantitate_initiala']));
      const furnizor = clean(pick(row,['furnizor','supplier']));
      const pretest = clean(pick(row,['pretest']));
      const data = formatDate(pick(row,['data','date']));
      const an = yearFromRow(row) || (data ? data.slice(-4) : '');
      const luna = monthNameFromAny(pick(row,['luna','month'])) || (data ? monthNameFromAny(Number(data.slice(3,5))) : '');
      return { an, luna, data, diametru, calitate, codIntern, furnizor, pretest, cantitate };
    }

    function normalizeEntryRow(row){
      const diametru = clean(pick(row,['diametru otel','diametru_otel','diametru','D'])) || clean(pick(row,['Diametru oțel','Diametru'])) ;
      const calitate = clean(pick(row,['calitate otel','calitate_otel','calitate'])) || clean(pick(row,['Calitate oțel','Calitate']));
      const codIntern = upper(pick(row,['cod intern otel','cod_intern_otel','cod intern','codInternOtel','codIntern','F'])) ;
      const cantitate = toNumber(pick(row,['cantitate','cantitate kg','cantitate_kg','kg','H']));
      const furnizor = clean(pick(row,['furnizor','J']));
      const pretest = clean(pick(row,['pretest','I']));
      const data = formatDate(pick(row,['data','date','C']));
      const an = clean(pick(row,['an','year','A'])) || (data ? data.slice(-4) : '');
      const luna = monthNameFromAny(pick(row,['luna','month','B'])) || (data ? monthNameFromAny(Number(data.slice(3,5))) : '');
      return { an, luna, data, diametru, calitate, codIntern, furnizor, pretest, cantitate };
    }

    function normalizeConsumptionRow(row){
      const diametru = clean(pick(row,['diametru otel','diametru_otel','diametru'])) || clean(pick(row,['Diametru oțel','Diametru']));
      const calitate = clean(pick(row,['calitate otel','calitate_otel','calitate'])) || clean(pick(row,['Calitate oțel','Calitate']));
      const codIntern = upper(pick(row,['cod intern otel','cod_intern_otel','cod intern','codInternOtel','codIntern','I']));
      let cantitate = toNumber(pick(row,['total kg debitat','total_kg_debitat','totalKgDebitat','cantitate kg','cantitate_kg','kg']));
      if (!cantitate) {
        const kgBuc = toNumber(pick(row,['kg/buc','kg buc','kg_buc','Kg/buc','H']));
        const buc = toNumber(pick(row,['cantitate','cantitate buc','cantitate_buc','J']));
        cantitate = kgBuc * buc;
      }
      const data = formatDate(pick(row,['data','date','C']));
      const an = clean(pick(row,['an','year','A'])) || (data ? data.slice(-4) : '');
      const luna = monthNameFromAny(pick(row,['luna','month','B'])) || (data ? monthNameFromAny(Number(data.slice(3,5))) : '');
      return { an, luna, data, diametru, calitate, codIntern, cantitate };
    }

    function latestNonEmpty(...values){
      for (const value of values) {
        const c = clean(value);
        if (c) return c;
      }
      return '';
    }

    function aggregateRows(){
      const map = new Map();

      const touch = (normalized, kind) => {
        if (!normalized.diametru && !normalized.calitate && !normalized.codIntern) return;
        const key = [upper(normalized.diametru), upper(normalized.calitate), upper(normalized.codIntern)].join('||');
        if (!map.has(key)) {
          map.set(key, {
            key,
            an: normalized.an || '',
            luna: normalized.luna || '',
            data: normalized.data || '',
            diametru: normalized.diametru || '',
            calitate: normalized.calitate || '',
            codIntern: normalized.codIntern || '',
            furnizor: normalized.furnizor || '',
            pretest: normalized.pretest || '',
            initialKg: 0,
            entryKg: 0,
            consumptionKg: 0,
            stockKg: 0
          });
        }
        const row = map.get(key);
        row.an = latestNonEmpty(normalized.an, row.an);
        row.luna = latestNonEmpty(normalized.luna, row.luna);
        row.data = latestNonEmpty(normalized.data, row.data);
        row.diametru = latestNonEmpty(normalized.diametru, row.diametru);
        row.calitate = latestNonEmpty(normalized.calitate, row.calitate);
        row.codIntern = latestNonEmpty(normalized.codIntern, row.codIntern);
        row.furnizor = latestNonEmpty(normalized.furnizor, row.furnizor);
        row.pretest = latestNonEmpty(normalized.pretest, row.pretest);
        if (kind === 'initial') row.initialKg += normalized.cantitate;
        if (kind === 'entries') row.entryKg += normalized.cantitate;
        if (kind === 'consumption') row.consumptionKg += normalized.cantitate;
      };

      state.raw.initial.map(normalizeInitialRow).forEach(r => touch(r, 'initial'));
      state.raw.entries.map(normalizeEntryRow).forEach(r => touch(r, 'entries'));
      state.raw.consumption.map(normalizeConsumptionRow).forEach(r => touch(r, 'consumption'));

      const rows = [...map.values()].map(row => ({
        ...row,
        stockKg: row.initialKg + row.entryKg - row.consumptionKg
      }));

      rows.sort((a,b) => {
        const da = toNumber(String(a.diametru).replace('Ø',''));
        const db = toNumber(String(b.diametru).replace('Ø',''));
        if (da !== db) return da - db;
        const ca = upper(a.calitate), cb = upper(b.calitate);
        if (ca !== cb) return ca.localeCompare(cb, 'ro');
        return upper(a.codIntern).localeCompare(upper(b.codIntern), 'ro');
      });

      state.rows = rows;
      persistCache();
    }

    function persistCache(){
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          rows: state.rows,
          raw: state.raw,
          lastCloudUpdatedAt: state.lastCloudUpdatedAt
        }));
      } catch (_) {}
    }

    function restoreCache(){
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.rows)) return false;
        state.rows = parsed.rows;
        state.raw = parsed.raw || state.raw;
        state.lastCloudUpdatedAt = parsed.lastCloudUpdatedAt || '';
        renderFilters();
        applyFilters();
        els.metaInfo.textContent = 'Se afișează ultima versiune salvată local.';
        return true;
      } catch (_) {
        return false;
      }
    }

    async function resolveRole(session){
      const userId = session?.user?.id;
      const email = session?.user?.email || '';
      let role = 'viewer';

      try {
        const r1 = await state.supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!r1.error && r1.data?.role) return r1.data.role;
      } catch (_) {}

      try {
        const r2 = await state.supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!r2.error && r2.data?.role) return r2.data.role;
      } catch (_) {}

      try {
        const r3 = await state.supabase
          .from('rf_acl')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (!r3.error && r3.data?.role) return r3.data.role;
      } catch (_) {}

      return role;
    }

    async function canViewPage(role){
      try {
        const { data, error } = await state.supabase
          .from('page_permissions')
          .select('page_key, can_view')
          .eq('role', role)
          .in('page_key', [PAGE_KEY, 'inventar', 'stoc-otel-actual']);

        if (!error && Array.isArray(data) && data.length) {
          return data.some(x => !!x.can_view);
        }
      } catch (_) {}

      return ['admin','editor','operator','viewer'].includes(normText(role));
    }

    async function queryDocsByKeys(keys){
      const cleanKeys = [...new Set((Array.isArray(keys) ? keys : []).map(x => clean(x)).filter(Boolean))];
      if (!cleanKeys.length) return [];
      const { data, error } = await state.supabase
        .from('rf_documents')
        .select('*')
        .in('doc_key', cleanKeys);
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    }

    async function queryDocsByPrefixes(prefixes){
      const list = [...new Set((Array.isArray(prefixes) ? prefixes : []).map(x => clean(x)).filter(Boolean))];
      const out = [];
      for (const prefix of list) {
        const { data, error } = await state.supabase
          .from('rf_documents')
          .select('*')
          .like('doc_key', `${prefix}:%`);
        if (error) throw error;
        if (Array.isArray(data)) out.push(...data);
      }
      return out;
    }

    function uniqueDocs(docs){
      const map = new Map();
      (Array.isArray(docs) ? docs : []).forEach(doc => {
        if (!doc || !doc.doc_key) return;
        if (!map.has(doc.doc_key)) map.set(doc.doc_key, doc);
      });
      return [...map.values()];
    }

    function excludeIndexDocs(docs){
      return (Array.isArray(docs) ? docs : []).filter(doc => !String(doc.doc_key || '').toLowerCase().endsWith(':index'));
    }

    async function fetchDocuments(){
      const initialDocs = await queryDocsByKeys(DOC_KEYS.initial);
      const entryDocs = uniqueDocs(excludeIndexDocs([
        ...(await queryDocsByKeys(DOC_KEYS.entries)),
        ...(await queryDocsByPrefixes(['intrari-otel','intrari_otel']))
      ]));
      const consumptionDocs = uniqueDocs(excludeIndexDocs([
        ...(await queryDocsByKeys(DOC_KEYS.consumption)),
        ...(await queryDocsByPrefixes(['debitate','debitari']))
      ]));

      state.raw.initial = initialDocs.flatMap(extractRows);
      state.raw.entries = entryDocs.flatMap(extractRows);
      state.raw.consumption = consumptionDocs.flatMap(extractRows);

      const allDocs = [...initialDocs, ...entryDocs, ...consumptionDocs];
      state.lastCloudUpdatedAt = allDocs.map(d => d.updated_at).filter(Boolean).sort().slice(-1)[0] || '';
      state.lastLoadTs = Date.now();
    }

    function fillSelect(selectEl, values, keepValue = true){
      const current = keepValue ? selectEl.value : '';
      const firstLabel = selectEl.querySelector('option')?.textContent || 'Toate';
      selectEl.innerHTML = '';
      const base = document.createElement('option');
      base.value = '';
      base.textContent = firstLabel;
      selectEl.appendChild(base);
      values.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        selectEl.appendChild(opt);
      });
      if (keepValue && values.includes(current)) selectEl.value = current;
    }

    function renderFilters(){
      const years = [...new Set(state.rows.map(r => clean(r.an)).filter(Boolean))].sort((a,b) => b.localeCompare(a,'ro'));
      const months = [...new Set(state.rows.map(r => clean(r.luna)).filter(Boolean))].sort((a,b) => monthSortValue(a) - monthSortValue(b));
      const diam = [...new Set(state.rows.map(r => clean(r.diametru)).filter(Boolean))].sort((a,b) => toNumber(a) - toNumber(b));
      const cal = [...new Set(state.rows.map(r => clean(r.calitate)).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ro'));
      const codes = [...new Set(state.rows.map(r => clean(r.codIntern)).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ro'));
      const suppliers = [...new Set(state.rows.map(r => clean(r.furnizor)).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ro'));
      const pretests = [...new Set(state.rows.map(r => clean(r.pretest)).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ro'));
      fillSelect(els.fYear, years);
      fillSelect(els.fMonth, months);
      fillSelect(els.fDiam, diam);
      fillSelect(els.fCal, cal);
      fillSelect(els.fCode, codes);
      fillSelect(els.fSupplier, suppliers);
      fillSelect(els.fPretest, pretests);
    }

    function matches(row){
      const search = normText(els.fSearch.value);
      const hay = normText([
        row.an,row.luna,row.data,row.diametru,row.calitate,row.codIntern,row.furnizor,row.pretest
      ].join(' '));

      if (els.fYear.value && clean(row.an) !== els.fYear.value) return false;
      if (els.fMonth.value && clean(row.luna) !== els.fMonth.value) return false;
      if (els.fDiam.value && clean(row.diametru) !== els.fDiam.value) return false;
      if (els.fCal.value && clean(row.calitate) !== els.fCal.value) return false;
      if (els.fCode.value && clean(row.codIntern) !== els.fCode.value) return false;
      if (els.fSupplier.value && clean(row.furnizor) !== els.fSupplier.value) return false;
      if (els.fPretest.value && clean(row.pretest) !== els.fPretest.value) return false;
      if (search && !hay.includes(search)) return false;
      return true;
    }

    function applyFilters(){
      state.filtered = state.rows.filter(matches);
      renderTable();
      renderTotals();
    }

    function stockClass(stock){
      if (stock < 0) return 'bad';
      if (stock <= 100) return 'warn';
      return 'ok';
    }

    function renderTable(){
      if (!state.filtered.length) {
        els.tbody.innerHTML = '';
        els.emptyBox.style.display = 'block';
        els.emptyBox.textContent = state.rows.length
          ? 'Nu există rânduri pentru filtrele curente.'
          : 'Nu s-au găsit documente compatibile în cloud pentru stoc inițial / intrări / debitate.';
      } else {
        els.emptyBox.style.display = 'none';
        els.tbody.innerHTML = state.filtered.map(row => {
          const trClass = row.stockKg < 0 ? 'negative' : (row.stockKg <= 100 ? 'low' : '');
          return `
            <tr class="${trClass}">
              <td>${escapeHtml(row.an)}</td>
              <td>${escapeHtml(row.luna)}</td>
              <td>${escapeHtml(row.data)}</td>
              <td>${escapeHtml(row.diametru)}</td>
              <td>${escapeHtml(row.calitate)}</td>
              <td class="mono">${escapeHtml(row.codIntern)}</td>
              <td class="left">${escapeHtml(row.furnizor)}</td>
              <td>${escapeHtml(row.pretest)}</td>
              <td class="right mono">${prettyNumber(row.initialKg)}</td>
              <td class="right mono">${prettyNumber(row.entryKg)}</td>
              <td class="right mono">${prettyNumber(row.consumptionKg)}</td>
              <td class="right mono ${stockClass(row.stockKg)}">${prettyNumber(row.stockKg)}</td>
            </tr>
          `;
        }).join('');
      }

      const updated = state.lastCloudUpdatedAt ? `Ultim update cloud: ${formatDate(state.lastCloudUpdatedAt)}` : 'Ultim update cloud: -';
      els.metaInfo.textContent = `Rânduri afișate: ${state.filtered.length} din ${state.rows.length} · ${updated} · Ultima reîncărcare: ${state.lastRefreshReason}`;
      els.sourceInfo.textContent = `Surse: Stoc inițial ${state.raw.initial.length} · Intrări ${state.raw.entries.length} · Debitări ${state.raw.consumption.length}`;
    }

    function renderTotals(){
      const totals = state.filtered.reduce((acc,row) => {
        acc.stock += row.stockKg;
        acc.entries += row.entryKg;
        acc.consumption += row.consumptionKg;
        return acc;
      }, { stock:0, entries:0, consumption:0 });

      els.totalStock.textContent = prettyNumber(totals.stock);
      els.totalEntries.textContent = prettyNumber(totals.entries);
      els.totalConsumption.textContent = prettyNumber(totals.consumption);
    }

    function toCsvValue(value){
      const text = String(value ?? '');
      if (/[";,\n]/.test(text)) return '"' + text.replace(/"/g,'""') + '"';
      return text;
    }

    function exportCsv(){
      const header = ['An','Luna','Ultima data','Diametru otel','Calitate otel','Cod intern otel','Furnizor','Pretest','Stoc initial (kg)','Intrari (kg)','Consum (kg)','Stoc actual (kg)'];
      const lines = [header.join(';')];
      state.filtered.forEach(row => {
        lines.push([
          row.an,row.luna,row.data,row.diametru,row.calitate,row.codIntern,row.furnizor,row.pretest,
          prettyNumber(row.initialKg),prettyNumber(row.entryKg),prettyNumber(row.consumptionKg),prettyNumber(row.stockKg)
        ].map(toCsvValue).join(';'));
      });
      const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventar-otel.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    async function logout(){
      try { await state.supabase.auth.signOut(); } catch (_) {}
      window.location.href = 'login.html';
    }

    async function loadCloud(reason = 'Manual'){
      els.btnRefresh.disabled = true;
      try {
        await fetchDocuments();
        aggregateRows();
        renderFilters();
        state.lastRefreshReason = reason;
        applyFilters();
      } catch (error) {
        console.error(error);
        const restored = restoreCache();
        if (!restored) {
          els.emptyBox.style.display = 'block';
          els.emptyBox.textContent = 'Nu am putut încărca datele din cloud. Verifică rf_documents și conexiunea Supabase.';
        }
      } finally {
        els.btnRefresh.disabled = false;
      }
    }

    function bindEvents(){
      [els.fYear, els.fMonth, els.fDiam, els.fCal, els.fCode, els.fSupplier, els.fPretest].forEach(el => el.addEventListener('change', applyFilters));
      els.fSearch.addEventListener('input', applyFilters);
      els.btnPhysical.addEventListener('click', () => { window.location.href = 'stoc-initial-otel.html'; });
      els.btnRefresh.addEventListener('click', () => loadCloud('Reîncărcare manuală'));
      els.btnExport.addEventListener('click', exportCsv);
      els.btnLogout.addEventListener('click', logout);
      els.btnBack.addEventListener('click', () => { window.location.href = 'index.html'; });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && Date.now() - state.lastLoadTs > 45000) {
          loadCloud('Revenire în pagină');
        }
      });

      window.addEventListener('focus', () => {
        if (Date.now() - state.lastLoadTs > 45000) {
          loadCloud('Focus pagină');
        }
      });

      setInterval(() => {
        if (!document.hidden && Date.now() - state.lastLoadTs > 120000) {
          loadCloud('Refresh rar automat');
        }
      }, 30000);
    }

    async function boot(){
      try {
        state.supabase = createClient();
        const { data: { session } } = await state.supabase.auth.getSession();
        state.session = session;
        if (!session) {
          window.location.href = 'login.html';
          return;
        }

        state.role = await resolveRole(session);
        const allowed = await canViewPage(state.role);
        els.authBox.innerHTML = `Utilizator: <b>${escapeHtml(session.user.email || '')}</b><br>Rol: <b>${escapeHtml(state.role)}</b>${allowed ? '' : '<br><span class="bad">Fără acces pe această pagină</span>'}`;

        if (!allowed) {
          els.emptyBox.style.display = 'block';
          els.emptyBox.innerHTML = 'Nu ai permisiune de vizualizare pentru această pagină.';
          return;
        }

        bindEvents();
        restoreCache();
        await loadCloud('Inițializare');
      } catch (error) {
        console.error(error);
        els.authBox.innerHTML = '<span class="bad">Eroare la inițializare.</span>';
        const restored = restoreCache();
        if (!restored) {
          els.emptyBox.style.display = 'block';
          els.emptyBox.textContent = 'Pagina nu a putut fi pornită. Verifică rf-config.js și conexiunea Supabase.';
        }
      }
    }

    boot();
  