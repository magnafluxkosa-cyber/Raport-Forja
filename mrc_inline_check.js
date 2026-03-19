(() => {
    'use strict';

    const PAGE_KEY = 'mrc';
    const PAGE_ALIASES = ['mrc','mrc.html','MRC'];
    const DOC_KEYS = ['mrc','MRC','mrc.html'];
    const LOCAL_KEY = 'rf_mrc_local_v1';
    const SAVE_DEBOUNCE_MS = 900;
    const REMOTE_POLL_MS = 45000;
    const SEED_FILES = {
      rows: 'mrc_data_export_seed.json',
      stocks: 'mrc_stocks_seed.json',
      diag: 'mrc_diag.json',
      itemMaster: 'mrc_item_master_seed.json'
    };
    const SEED_DIAG = {"sourceWorkbook": "d5b1ee0b-6435-4ef2-a73a-02f4404d1456.xlsx", "dataExportRows": 1094, "stockSnapshots": 29, "formulaIssues": {"country_ref": 455, "working_days_ref": 455, "balance_errors": 1}, "firstShipDate": "2024-01-16", "lastShipDate": "2027-08-03"};
    const NEED_PIVOT_STATUSES = ['open','pending','in process',"matl' acquisition",'planned','completed'];
    const FIELD_DEFS = [
      { key:'lineId', label:'Line ID', type:'text' },
      { key:'shipTo', label:'Ship To', type:'text' },
      { key:'itemId', label:'Item ID', type:'text' },
      { key:'bpoLineId', label:'BPO Line ID', type:'text' },
      { key:'status', label:'Status', type:'text' },
      { key:'orderedQty', label:'Ordered Qty', type:'number' },
      { key:'shipDate', label:'Ship Date', type:'date' },
      { key:'deliveryDate', label:'Delivery Date', type:'date' },
      { key:'promiseDate', label:'Promise Date', type:'date' },
      { key:'receivedQty', label:'Received Qty', type:'number' },
      { key:'shippedQty', label:'Shipped Qty', type:'number' },
      { key:'promiseQty', label:'Promise Qty', type:'number' },
      { key:'shipmentOverride', label:'Shipment Override', type:'text' },
      { key:'deliverTo', label:'Deliver To', type:'text' },
      { key:'replenishmentType', label:'Replenishment Type', type:'text' },
      { key:'uom', label:'UOM', type:'text' },
      { key:'plannerCode', label:'Planner Code', type:'text' },
      { key:'supplier', label:'Supplier', type:'text' },
      { key:'country', label:'Country', type:'text' },
      { key:'groupId', label:'Group ID', type:'text' },
      { key:'sloc', label:'SLOC', type:'text' },
      { key:'versionNo', label:'Version No', type:'text' },
      { key:'confirmationDate', label:'Confirmation Date', type:'date' },
      { key:'odQty', label:'OD Qty', type:'number' },
      { key:'creationDate', label:'Creation Date', type:'date' },
      { key:'shippedQtyDue', label:'Shipped Qty Due', type:'number' },
      { key:'receivedQtyDue', label:'Received Qty Due', type:'number' }
    ];
    const DATA_EXPORT_COLUMNS = [
      { key:'lineId', label:'Line ID', width:190, className:'nowrap sticky-col' },
      { key:'shipTo', label:'Ship To', width:160, className:'sticky-col-2 nowrap' },
      { key:'itemId', label:'Item ID', width:120, className:'nowrap' },
      { key:'status', label:'Status', width:120, className:'center' },
      { key:'orderedQty', label:'Ordered Qty', width:110, className:'right mono' },
      { key:'receivedQty', label:'Received Qty', width:110, className:'right mono' },
      { key:'balance', label:'Balance', width:100, className:'right mono' },
      { key:'shipDate', label:'Ship Date', width:100, className:'center nowrap mono' },
      { key:'deliveryDate', label:'Delivery Date', width:108, className:'center nowrap mono' },
      { key:'promiseDate', label:'Promise Date', width:108, className:'center nowrap mono' },
      { key:'shipWeek', label:'Ship Week', width:86, className:'center mono' },
      { key:'shipMo', label:'Ship Mo', width:86, className:'center mono' },
      { key:'shipYear', label:'Ship Year', width:94, className:'center mono' },
      { key:'workingDaysFirmOrder', label:'Working Days', width:98, className:'right mono' },
      { key:'deliverTo', label:'Deliver To', width:120, className:'nowrap' },
      { key:'plannerCode', label:'Planner', width:92, className:'nowrap' },
      { key:'supplier', label:'Supplier', width:110, className:'nowrap' },
      { key:'country', label:'Country', width:94, className:'center nowrap' }
    ];
    const STATUS_CLASS_MAP = {
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      open: 'status-open'
    };

    const dom = {
      btnBack: document.getElementById('btnBack'),
      btnImport: document.getElementById('btnImport'),
      btnExport: document.getElementById('btnExport'),
      btnSync: document.getElementById('btnSync'),
      btnAdd: document.getElementById('btnAdd'),
      btnDelete: document.getElementById('btnDelete'),
      excelInput: document.getElementById('excelInput'),
      filters: document.getElementById('filters'),
      tableWrap: document.getElementById('tableWrap'),
      tableNote: document.getElementById('tableNote'),
      statRows: document.getElementById('statRows'),
      statItems: document.getElementById('statItems'),
      statBalance: document.getElementById('statBalance'),
      statSpan: document.getElementById('statSpan'),
      chipAuth: document.getElementById('chipAuth'),
      chipRole: document.getElementById('chipRole'),
      chipCloud: document.getElementById('chipCloud'),
      chipSeed: document.getElementById('chipSeed'),
      chipDiag: document.getElementById('chipDiag'),
      dotAuth: document.getElementById('dotAuth'),
      dotRole: document.getElementById('dotRole'),
      dotCloud: document.getElementById('dotCloud'),
      dotSeed: document.getElementById('dotSeed'),
      dotDiag: document.getElementById('dotDiag'),
      tabs: Array.from(document.querySelectorAll('.tab')),
      modalBackdrop: document.getElementById('modalBackdrop'),
      formGrid: document.getElementById('formGrid'),
      modalTitle: document.getElementById('modalTitle'),
      btnCloseModal: document.getElementById('btnCloseModal'),
      btnCancelModal: document.getElementById('btnCancelModal'),
      btnSaveModal: document.getElementById('btnSaveModal')
    };

    const state = {
      activeTab: 'pivotNeed',
      rows: [],
      stocksSnapshots: [],
      itemMasterRows: [],
      diagnostics: clone(SEED_DIAG),
      role: 'viewer',
      permissions: { can_view:true, can_add:false, can_edit:false, can_delete:false },
      user: null,
      supabase: null,
      selectedId: '',
      modalId: '',
      dirty: false,
      syncInFlight: false,
      cloudUpdatedAt: '',
      sourceLabel: 'seed workbook',
      seedLoaded: false,
      stocksLabel: '',
      filters: {
        query: '',
        shipTo: '',
        itemId: '',
        status: '',
        year: '',
        month: '',
        balanceMode: 'all',
        stockLabel: ''
      }
    };

    function clone(value){ return JSON.parse(JSON.stringify(value)); }
    function uid(prefix='row'){ return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9); }
    function escapeHtml(value){
      return String(value ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }
    function setChip(textEl, dotEl, text, tone){
      textEl.textContent = text;
      dotEl.className = 'dot' + (tone ? ' ' + tone : '');
    }
    function normalizeText(value){
      return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim()
        .toLowerCase();
    }
    function normalizeItem(value){
      return String(value ?? '')
        .toUpperCase()
        .replace(/\s+/g,'')
        .replace(/_/g,'')
        .replace(/\//g,'')
        .replace(/[.\-]/g,'')
        .replace(/ZA/g,'');
    }
    function monthNameShort(month){
      const map = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'];
      return map[Math.max(0, Math.min(11, Number(month || 1) - 1))] || '';
    }
    function formatNumber(value){
      const num = toNumber(value);
      if (num === null) return '';
      return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(num);
    }
    function formatInt(value){
      const num = toNumber(value);
      if (num === null) return '';
      return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(num);
    }
    function formatDateDisplay(value){
      const iso = toIsoDate(value);
      if (!iso) return '';
      const [y,m,d] = iso.split('-');
      return [d,m,y].join('.');
    }
    function toNumber(value){
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string'){
        const trimmed = value.trim();
        if (!trimmed || /^#/.test(trimmed)) return null;
        const normalized = trimmed.replace(/\./g,'').replace(',', '.').replace(/[^\d.\-]/g,'');
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    }
    function pad2(value){ return String(value).padStart(2,'0'); }
    function toIsoDate(value){
      if (!value && value !== 0) return '';
      if (typeof value === 'string'){
        const v = value.trim();
        if (!v) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        if (/^\d{2}[./]\d{2}[./]\d{4}$/.test(v)){
          const parts = v.replace(/\//g,'.').split('.');
          return [parts[2], pad2(parts[1]), pad2(parts[0])].join('-');
        }
        if (/^\d{4}[./]\d{2}[./]\d{2}$/.test(v)){
          return v.replace(/[.]/g,'-').replace(/\//g,'-');
        }
      }
      if (typeof value === 'number' && Number.isFinite(value)){
        const excelEpoch = new Date(Date.UTC(1899,11,30));
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date.toISOString().slice(0,10);
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().slice(0,10);
    }
    function getIsoWeek(dateValue){
      const iso = toIsoDate(dateValue);
      if (!iso) return null;
      const date = new Date(iso + 'T00:00:00');
      const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = utc.getUTCDay() || 7;
      utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(utc.getUTCFullYear(),0,1));
      return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
    }
    function businessDaysUntil(targetIso){
      if (!targetIso) return null;
      const today = new Date();
      const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const targetDate = new Date(targetIso + 'T00:00:00Z');
      if (Number.isNaN(targetDate.getTime())) return null;
      const step = targetDate >= start ? 1 : -1;
      let count = 0;
      const cursor = new Date(start.getTime());
      while ((step > 0 && cursor < targetDate) || (step < 0 && cursor > targetDate)) {
        cursor.setUTCDate(cursor.getUTCDate() + step);
        const day = cursor.getUTCDay();
        if (day !== 0 && day !== 6) count += step;
        if (Math.abs(count) > 2000) break;
      }
      return count;
    }
    function inferCountry(shipTo, current){
      const existing = String(current ?? '').trim();
      if (existing && existing !== '#REF!') return existing;
      const ship = normalizeText(shipTo);
      if (ship.includes('grenoble')) return 'France';
      if (ship.includes('mec track')) return 'Italy';
      return '';
    }
    function statusTone(status){
      const key = normalizeText(status);
      if (key === 'completed') return 'ok';
      if (key === 'cancelled') return 'bad';
      if (key === 'open' || key === 'pending' || key === 'in process' || key === "matl' acquisition" || key === 'planned') return 'warn';
      return '';
    }
    function statusClass(status){
      const key = normalizeText(status);
      if (STATUS_CLASS_MAP[key]) return STATUS_CLASS_MAP[key];
      return 'status-default';
    }
    function recomputeDerived(row){
      const shipIso = toIsoDate(row.shipDate || row.deliveryDate || row.promiseDate);
      if (shipIso) row.shipDate = shipIso;
      const receivedQty = toNumber(row.receivedQty) ?? 0;
      const orderedQty = toNumber(row.orderedQty);
      row.orderedQty = orderedQty;
      row.receivedQty = toNumber(row.receivedQty);
      row.shippedQty = toNumber(row.shippedQty);
      row.promiseQty = toNumber(row.promiseQty);
      row.odQty = toNumber(row.odQty);
      row.shippedQtyDue = toNumber(row.shippedQtyDue);
      row.receivedQtyDue = toNumber(row.receivedQtyDue);
      row.country = inferCountry(row.shipTo, row.country);
      if (shipIso){
        const [year, month] = shipIso.split('-');
        row.shipYear = Number(year);
        row.shipMo = Number(month);
        row.shipWeek = getIsoWeek(shipIso);
        row.workingDaysFirmOrder = businessDaysUntil(shipIso);
      } else {
        row.shipYear = toNumber(row.shipYear);
        row.shipMo = toNumber(row.shipMo);
        row.shipWeek = toNumber(row.shipWeek);
        row.workingDaysFirmOrder = toNumber(row.workingDaysFirmOrder);
      }
      row.balance = orderedQty === null ? toNumber(row.balance) : orderedQty - receivedQty;
      row.deliveryDate = toIsoDate(row.deliveryDate);
      row.promiseDate = toIsoDate(row.promiseDate);
      row.confirmationDate = toIsoDate(row.confirmationDate);
      row.creationDate = toIsoDate(row.creationDate);
      return row;
    }
    function stripEphemeral(row){
      const copy = {};
      Object.keys(row || {}).forEach(key => {
        if (!key.startsWith('__')) copy[key] = row[key];
      });
      return copy;
    }
    function ensureRowIdentity(row, index){
      row.__id = row.__id || row.lineId || uid('mrc');
      row.__index = index;
      return row;
    }
    function applyAclButtons(){
      const canEdit = !!state.permissions.can_edit;
      const canAdd = !!state.permissions.can_add || canEdit;
      const canDelete = !!state.permissions.can_delete || canEdit;
      dom.btnAdd.disabled = !canAdd;
      dom.btnImport.disabled = !canAdd;
      dom.btnDelete.disabled = !canDelete;
      dom.btnSync.disabled = !canEdit;
    }
    function getConfig(){
      const cfg = window.RF_CONFIG || {};
      return {
        url: cfg.SUPABASE_URL || window.SUPABASE_URL || '',
        key: cfg.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '',
        adminEmail: String(cfg.ADMIN_EMAIL || (cfg.auth && cfg.auth.adminEmail) || window.ADMIN_EMAIL || 'forja.editor@gmail.com').toLowerCase()
      };
    }
    function getSupabaseClient(){
      if (state.supabase) return state.supabase;
      const cfg = getConfig();
      if (!cfg.url || !cfg.key || !window.supabase || typeof window.supabase.createClient !== 'function') return null;
      state.supabase = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return state.supabase;
    }
    async function initAuthAndPermissions(){
      const supabase = getSupabaseClient();
      if (!supabase){
        setChip(dom.chipAuth, dom.dotAuth, 'Autentificare: fără rf-config / Supabase', 'warning');
        setChip(dom.chipRole, dom.dotRole, 'Rol: viewer', 'warning');
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: indisponibil', 'danger');
        applyAclButtons();
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        state.user = data && data.session ? data.session.user : null;
      } catch (error) {
        console.warn('getSession error', error);
      }
      if (!state.user){
        setChip(dom.chipAuth, dom.dotAuth, 'Autentificare: neintrat', 'warning');
        setChip(dom.chipRole, dom.dotRole, 'Rol: viewer', 'warning');
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: doar cache local', 'warning');
        applyAclButtons();
        return;
      }
      setChip(dom.chipAuth, dom.dotAuth, 'Autentificare: ' + (state.user.email || 'OK'), 'success');
      let role = '';
      const roleLookups = [
        async () => supabase.from('profiles').select('*').eq('user_id', state.user.id).limit(1),
        async () => supabase.from('profiles').select('*').eq('id', state.user.id).limit(1),
        async () => supabase.from('profiles').select('*').eq('email', state.user.email).limit(1)
      ];
      for (const lookup of roleLookups){
        try {
          const { data, error } = await lookup();
          if (!error && Array.isArray(data) && data[0] && data[0].role) { role = String(data[0].role); break; }
        } catch (_) {}
      }
      if (!role && state.user.email){
        try {
          const { data, error } = await supabase.from('rf_acl').select('*').eq('email', state.user.email).limit(1);
          if (!error && Array.isArray(data) && data[0] && data[0].role) role = String(data[0].role);
        } catch (_) {}
      }
      if (!role && state.user.email && state.user.email.toLowerCase() === getConfig().adminEmail) role = 'admin';
      state.role = (role || 'viewer').toLowerCase();
      setChip(dom.chipRole, dom.dotRole, 'Rol: ' + state.role, state.role === 'viewer' ? 'warning' : 'success');

      try {
        const { data, error } = await supabase.from('page_permissions').select('*').eq('role', state.role).in('page_key', PAGE_ALIASES);
        if (!error && Array.isArray(data) && data.length){
          const candidate = data.find(row => PAGE_ALIASES.includes(row.page_key)) || data[0];
          state.permissions = {
            can_view: candidate.can_view !== false,
            can_add: !!candidate.can_add,
            can_edit: !!candidate.can_edit,
            can_delete: !!candidate.can_delete
          };
        } else {
          state.permissions = {
            can_view: true,
            can_add: state.role !== 'viewer',
            can_edit: state.role !== 'viewer',
            can_delete: state.role === 'admin' || state.role === 'editor'
          };
        }
      } catch (error) {
        console.warn('page_permissions fallback', error);
        state.permissions = {
          can_view: true,
          can_add: state.role !== 'viewer',
          can_edit: state.role !== 'viewer',
          can_delete: state.role === 'admin' || state.role === 'editor'
        };
      }
      applyAclButtons();
      setChip(dom.chipCloud, dom.dotCloud, 'Cloud: pregătit pentru încărcare', 'success');
    }
    function saveLocal(){
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(buildDocumentPayload()));
      } catch (error) {
        console.warn('saveLocal', error);
      }
    }
    function loadLocal(){
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (error) {
        console.warn('loadLocal', error);
        return null;
      }
    }
    async function loadCloudDocument(silent = false){
      const supabase = getSupabaseClient();
      if (!supabase || !state.user) return false;
      try {
        const { data, error } = await supabase.from('rf_documents').select('*').in('doc_key', DOC_KEYS).order('updated_at', { ascending:false }).limit(5);
        if (error) throw error;
        const doc = Array.isArray(data) && data[0] ? (data[0].content || data[0].data || data[0]) : null;
        if (!doc || !Array.isArray(doc.rows)) return false;
        applyLoadedDocument(doc);
        state.cloudUpdatedAt = Array.isArray(data) && data[0] ? String(data[0].updated_at || '') : '';
        state.sourceLabel = 'cloud rf_documents';
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: document încărcat', 'success');
        setChip(dom.chipSeed, dom.dotSeed, 'Sursă: cloud rf_documents', 'success');
        if (!silent) renderAll();
        return true;
      } catch (error) {
        console.warn('loadCloudDocument', error);
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: citire eșuată, folosesc local/seed', 'warning');
        return false;
      }
    }
    function buildDocumentPayload(){
      return {
        version: 1,
        pageKey: PAGE_KEY,
        updatedAt: new Date().toISOString(),
        sourceLabel: state.sourceLabel,
        diagnostics: state.diagnostics,
        stocksLabel: state.filters.stockLabel || state.stocksLabel || '',
        rows: state.rows.map(stripEphemeral),
        stocksSnapshots: state.stocksSnapshots,
        itemMasterRows: state.itemMasterRows
      };
    }
    function scheduleSave(){
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(() => { void saveCloud(false); }, SAVE_DEBOUNCE_MS);
    }
    async function saveCloud(force = false){
      const supabase = getSupabaseClient();
      if (!supabase || !state.user) return false;
      if (state.syncInFlight) return false;
      if (!state.dirty && !force) return true;
      state.syncInFlight = true;
      try {
        const payload = buildDocumentPayload();
        saveLocal();
        const row = { doc_key: PAGE_KEY, content: payload, data: payload, updated_at: new Date().toISOString() };
        const { error } = await supabase.from('rf_documents').upsert(row, { onConflict:'doc_key' });
        if (error) throw error;
        state.dirty = false;
        state.cloudUpdatedAt = row.updated_at;
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: sincronizat ' + new Date().toLocaleTimeString('ro-RO', { hour:'2-digit', minute:'2-digit' }), 'success');
        return true;
      } catch (error) {
        console.error('saveCloud', error);
        saveLocal();
        setChip(dom.chipCloud, dom.dotCloud, 'Cloud: salvare eșuată, ai cache local', 'danger');
        return false;
      } finally {
        state.syncInFlight = false;
      }
    }
    async function checkRemoteChanges(){
      const supabase = getSupabaseClient();
      if (!supabase || !state.user || document.hidden || state.dirty) return;
      try {
        const { data, error } = await supabase.from('rf_documents').select('doc_key,updated_at').in('doc_key', DOC_KEYS).order('updated_at', { ascending:false }).limit(3);
        if (error) throw error;
        const remote = Array.isArray(data) && data[0] ? String(data[0].updated_at || '') : '';
        if (remote && remote !== state.cloudUpdatedAt) await loadCloudDocument(true);
      } catch (error) {
        console.warn('checkRemoteChanges', error);
      }
    }
    async function fetchJson(path){
      const url = new URL(path, window.location.href.split('#')[0].split('?')[0]).toString();
      const res = await fetch(url, { cache:'no-cache' });
      if (!res.ok) throw new Error('Nu pot încărca ' + path);
      return res.json();
    }
    async function loadSeedFiles(){
      try {
        const [rows, stocks, diag, itemMaster] = await Promise.all([
          fetchJson(SEED_FILES.rows),
          fetchJson(SEED_FILES.stocks),
          fetchJson(SEED_FILES.diag),
          fetchJson(SEED_FILES.itemMaster)
        ]);
        return { rows, stocks, diag, itemMaster };
      } catch (error) {
        console.warn('loadSeedFiles', error);
        return { rows: [], stocks: [], diag: clone(SEED_DIAG), itemMaster: [] };
      }
    }
    function applyLoadedDocument(doc){
      state.rows = (Array.isArray(doc.rows) ? doc.rows : []).map((row, idx) => ensureRowIdentity(recomputeDerived(Object.assign({}, row)), idx));
      state.stocksSnapshots = Array.isArray(doc.stocksSnapshots) ? doc.stocksSnapshots : [];
      state.itemMasterRows = Array.isArray(doc.itemMasterRows) ? doc.itemMasterRows : [];
      state.diagnostics = doc.diagnostics && typeof doc.diagnostics === 'object' ? doc.diagnostics : clone(SEED_DIAG);
      state.stocksLabel = doc.stocksLabel || (state.stocksSnapshots[0] ? String(state.stocksSnapshots[0].label || '') : '');
      if (!state.filters.stockLabel) state.filters.stockLabel = state.stocksLabel;
    }
    async function initData(){
      if (await loadCloudDocument()) return;
      const local = loadLocal();
      if (local && Array.isArray(local.rows) && local.rows.length){
        applyLoadedDocument(local);
        state.sourceLabel = 'cache local';
        setChip(dom.chipSeed, dom.dotSeed, 'Sursă: cache local', 'success');
        renderAll();
        return;
      }
      const seed = await loadSeedFiles();
      applyLoadedDocument({ rows: seed.rows, stocksSnapshots: seed.stocks, itemMasterRows: seed.itemMaster, diagnostics: seed.diag, stocksLabel: seed.stocks && seed.stocks[0] ? seed.stocks[0].label : '' });
      state.sourceLabel = 'seed workbook';
      state.seedLoaded = true;
      setChip(dom.chipSeed, dom.dotSeed, 'Sursă: workbook încărcat ca seed', 'success');
      renderAll();
    }
    function updateDiagnosticsChip(){
      const issues = state.diagnostics && state.diagnostics.formulaIssues ? state.diagnostics.formulaIssues : {};
      const countryIssues = Number(issues.country_ref || 0);
      const workIssues = Number(issues.working_days_ref || 0);
      const balanceIssues = Number(issues.balance_errors || 0);
      const message = 'Diagnostic workbook: ' + countryIssues + ' Country #REF, ' + workIssues + ' Working Days #REF, ' + balanceIssues + ' Balance erori';
      setChip(dom.chipDiag, dom.dotDiag, message, (countryIssues || workIssues || balanceIssues) ? 'warning' : 'success');
    }
    function updateStats(){
      const rows = state.rows;
      const items = new Set(rows.map(row => normalizeItem(row.itemId)).filter(Boolean));
      const balance = rows.reduce((sum, row) => sum + (toNumber(row.balance) || 0), 0);
      const dates = rows.map(row => toIsoDate(row.shipDate)).filter(Boolean).sort();
      dom.statRows.textContent = formatInt(rows.length);
      dom.statItems.textContent = formatInt(items.size);
      dom.statBalance.textContent = formatNumber(balance);
      dom.statSpan.textContent = dates.length ? (formatDateDisplay(dates[0]) + ' → ' + formatDateDisplay(dates[dates.length - 1])) : '-';
    }
    function getDistinctValues(key, sourceRows = state.rows){
      const values = new Set();
      sourceRows.forEach(row => {
        const v = row[key];
        if (v !== null && v !== undefined && v !== '') values.add(String(v));
      });
      return Array.from(values).sort((a,b) => a.localeCompare(b, 'ro', { numeric:true, sensitivity:'base' }));
    }
    function getDistinctYears(rows = state.rows){
      return Array.from(new Set(rows.map(row => Number(row.shipYear)).filter(Number.isFinite))).sort((a,b) => a - b);
    }
    function getSelectedStockRows(){
      const label = state.filters.stockLabel || state.stocksLabel || (state.stocksSnapshots[0] ? state.stocksSnapshots[0].label : '');
      const snapshot = state.stocksSnapshots.find(entry => String(entry.label) === String(label)) || state.stocksSnapshots[0] || { rows: [] };
      state.stocksLabel = snapshot.label || '';
      if (!state.filters.stockLabel && snapshot.label) state.filters.stockLabel = snapshot.label;
      return snapshot.rows || [];
    }

    function getItemMasterLookup(){
      const lookup = new Map();
      (state.itemMasterRows || []).forEach(row => {
        const key = normalizeItem(row.itemId);
        if (!key) return;
        lookup.set(key, {
          itemId: String(row.itemId || ''),
          material: String(row.material || '').replace(/—/g, '-'),
          diametruTip: String(row.diametruTip || ''),
          kg: toNumber(row.kg) || 0
        });
      });
      return lookup;
    }
    function matchNeedFilters(row, master){
      const q = normalizeText(state.filters.query);
      if (q){
        const hay = normalizeText([row.lineId, row.shipTo, row.itemId, row.status, row.deliverTo, row.supplier, row.plannerCode, master && master.material, master && master.diametruTip].join(' '));
        if (!hay.includes(q)) return false;
      }
      if (state.filters.shipTo && String(row.shipTo || '') !== state.filters.shipTo) return false;
      if (state.filters.itemId && String(row.itemId || '') !== state.filters.itemId) return false;
      if (state.filters.status){
        if (String(row.status || '') !== state.filters.status) return false;
      } else {
        const statusKey = normalizeText(row.status);
        if (!NEED_PIVOT_STATUSES.includes(statusKey)) return false;
      }
      if (state.filters.year && Number(row.shipYear) !== Number(state.filters.year)) return false;
      if (state.filters.month && Number(row.shipMo) !== Number(state.filters.month)) return false;
      if (state.filters.balanceMode === 'positive' && (toNumber(row.balance) || 0) <= 0) return false;
      if (state.filters.balanceMode === 'zero' && (toNumber(row.balance) || 0) !== 0) return false;
      if (state.filters.balanceMode === 'negative' && (toNumber(row.balance) || 0) >= 0) return false;
      return true;
    }
    function buildNeedPivotModel(){
      const years = getDistinctYears();
      if (!state.filters.year && years.length) state.filters.year = String(years[years.length - 1]);
      const masterLookup = getItemMasterLookup();
      const sourceRows = [];
      const unmapped = new Map();
      state.rows.forEach(row => {
        const master = masterLookup.get(normalizeItem(row.itemId));
        if (!matchNeedFilters(row, master)) return;
        const actualWeek = Number(row.shipWeek);
        const displayWeek = actualWeek - 1; // workbook INFO SAPT Materiale_Kg(2) is shifted by one week
        if (!Number.isFinite(actualWeek) || displayWeek < 1 || displayWeek > 52) return;
        const qty = toNumber(row.orderedQty) || 0;
        if (!master){
          const key = String(row.itemId || '-');
          if (!unmapped.has(key)) unmapped.set(key, { itemId: key, rows: 0, totalQty: 0 });
          const entry = unmapped.get(key);
          entry.rows += 1;
          entry.totalQty += qty;
          return;
        }
        sourceRows.push({
          row,
          master,
          week: displayWeek,
          qty,
          kgValue: qty * (toNumber(master.kg) || 0)
        });
      });

      const materialsMap = new Map();
      sourceRows.forEach(entry => {
        const materialKey = String(entry.master.material || 'FĂRĂ MATERIAL');
        const diamKey = String(entry.master.diametruTip || '-');
        if (!materialsMap.has(materialKey)){
          materialsMap.set(materialKey, {
            material: materialKey,
            weekMap: new Map(),
            totalKg: 0,
            itemIds: new Set(),
            rows: new Map()
          });
        }
        const material = materialsMap.get(materialKey);
        material.totalKg += entry.kgValue;
        material.itemIds.add(String(entry.row.itemId || ''));
        material.weekMap.set(entry.week, (material.weekMap.get(entry.week) || 0) + entry.kgValue);

        if (!material.rows.has(diamKey)){
          material.rows.set(diamKey, {
            diametruTip: diamKey,
            weekMap: new Map(),
            totalKg: 0,
            itemIds: new Set()
          });
        }
        const child = material.rows.get(diamKey);
        child.totalKg += entry.kgValue;
        child.itemIds.add(String(entry.row.itemId || ''));
        child.weekMap.set(entry.week, (child.weekMap.get(entry.week) || 0) + entry.kgValue);
      });

      const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
      const materials = Array.from(materialsMap.values()).map(material => ({
        material: material.material,
        totalKg: material.totalKg,
        itemCount: material.itemIds.size,
        weekMap: material.weekMap,
        rows: Array.from(material.rows.values()).map(child => ({
          diametruTip: child.diametruTip,
          totalKg: child.totalKg,
          itemCount: child.itemIds.size,
          weekMap: child.weekMap
        })).sort((a,b) => a.diametruTip.localeCompare(b.diametruTip, 'ro', { numeric:true, sensitivity:'base' }))
      })).sort((a,b) => a.material.localeCompare(b.material, 'ro', { numeric:true, sensitivity:'base' }));

      const grandWeekMap = new Map();
      let totalKg = 0;
      materials.forEach(material => {
        totalKg += material.totalKg;
        weeks.forEach(week => grandWeekMap.set(week, (grandWeekMap.get(week) || 0) + (material.weekMap.get(week) || 0)));
      });

      return {
        weeks,
        materials,
        totalKg,
        rowCount: sourceRows.length,
        unmapped: Array.from(unmapped.values()).sort((a,b) => a.itemId.localeCompare(b.itemId, 'ro', { numeric:true, sensitivity:'base' }))
      };
    }
    function matchBaseFilters(row){
      const q = normalizeText(state.filters.query);
      if (q){
        const hay = normalizeText([row.lineId, row.shipTo, row.itemId, row.status, row.deliverTo, row.supplier, row.plannerCode].join(' '));
        if (!hay.includes(q)) return false;
      }
      if (state.filters.shipTo && String(row.shipTo || '') !== state.filters.shipTo) return false;
      if (state.filters.itemId && String(row.itemId || '') !== state.filters.itemId) return false;
      if (state.filters.status && String(row.status || '') !== state.filters.status) return false;
      if (state.filters.year && Number(row.shipYear) !== Number(state.filters.year)) return false;
      if (state.filters.month && Number(row.shipMo) !== Number(state.filters.month)) return false;
      if (state.filters.balanceMode === 'positive' && (toNumber(row.balance) || 0) <= 0) return false;
      if (state.filters.balanceMode === 'zero' && (toNumber(row.balance) || 0) !== 0) return false;
      if (state.filters.balanceMode === 'negative' && (toNumber(row.balance) || 0) >= 0) return false;
      return true;
    }
    function getFilteredRows(){
      return state.rows.filter(matchBaseFilters);
    }
    function getStocksLookup(rows){
      const lookup = new Map();
      rows.forEach(row => lookup.set(normalizeItem(row.itemId), row));
      return lookup;
    }
    function buildForecastModel(){
      const years = getDistinctYears();
      if (!state.filters.year && years.length) state.filters.year = String(years[years.length - 1]);
      const rows = state.rows.filter(row => {
        if (!matchBaseFilters(row)) return false;
        if (Number(row.shipYear) !== Number(state.filters.year || 0)) return false;
        return true;
      });
      const stockLookup = getStocksLookup(getSelectedStockRows());
      const weekSet = new Set(rows.map(row => Number(row.shipWeek)).filter(Number.isFinite));
      const weeks = Array.from(weekSet).sort((a,b) => a - b);
      const monthByWeek = new Map();
      rows.forEach(row => {
        if (Number.isFinite(Number(row.shipWeek)) && Number.isFinite(Number(row.shipMo)) && !monthByWeek.has(Number(row.shipWeek))){
          monthByWeek.set(Number(row.shipWeek), Number(row.shipMo));
        }
      });
      const byShip = new Map();
      rows.forEach(row => {
        const shipTo = String(row.shipTo || '-');
        const itemId = String(row.itemId || '-');
        if (!byShip.has(shipTo)) byShip.set(shipTo, new Map());
        const itemMap = byShip.get(shipTo);
        if (!itemMap.has(itemId)){
          itemMap.set(itemId, {
            shipTo,
            itemId,
            weekMap: new Map(),
            totalQty: 0,
            totalBalance: 0,
            nextShipDate: row.shipDate || '',
            stock: stockLookup.get(normalizeItem(itemId)) || null,
            statuses: new Set()
          });
        }
        const item = itemMap.get(itemId);
        const week = Number(row.shipWeek);
        const qty = toNumber(row.orderedQty) || 0;
        item.weekMap.set(week, (item.weekMap.get(week) || 0) + qty);
        item.totalQty += qty;
        item.totalBalance += toNumber(row.balance) || 0;
        item.statuses.add(String(row.status || ''));
        if (row.shipDate && (!item.nextShipDate || row.shipDate < item.nextShipDate)) item.nextShipDate = row.shipDate;
      });
      const groups = Array.from(byShip.entries()).map(([shipTo, itemMap]) => {
        const items = Array.from(itemMap.values()).sort((a,b) => a.itemId.localeCompare(b.itemId, 'ro', { numeric:true, sensitivity:'base' }));
        return { shipTo, items };
      }).sort((a,b) => a.shipTo.localeCompare(b.shipTo, 'ro', { sensitivity:'base' }));
      const shipTotals = groups.map(group => {
        const weekMap = new Map();
        let totalQty = 0;
        let totalBalance = 0;
        group.items.forEach(item => {
          totalQty += item.totalQty;
          totalBalance += item.totalBalance;
          weeks.forEach(week => {
            weekMap.set(week, (weekMap.get(week) || 0) + (item.weekMap.get(week) || 0));
          });
        });
        return { shipTo: group.shipTo, weekMap, totalQty, totalBalance };
      });
      const grandWeekMap = new Map();
      shipTotals.forEach(t => weeks.forEach(week => grandWeekMap.set(week, (grandWeekMap.get(week) || 0) + (t.weekMap.get(week) || 0))));
      return { rows, weeks, monthByWeek, groups, shipTotals, grandWeekMap };
    }
    function renderFilters(){
      const shipToOptions = ['<option value="">Toate</option>']
        .concat(getDistinctValues('shipTo').map(v => '<option value="' + escapeHtml(v) + '"' + (state.filters.shipTo === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>')).join('');
      const itemOptions = ['<option value="">Toate</option>']
        .concat(getDistinctValues('itemId').map(v => '<option value="' + escapeHtml(v) + '"' + (state.filters.itemId === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>')).join('');
      const statusOptions = ['<option value="">Workbook implicit</option>']
        .concat(getDistinctValues('status').map(v => '<option value="' + escapeHtml(v) + '"' + (state.filters.status === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>')).join('');
      const yearOptions = ['<option value="">Toți</option>']
        .concat(getDistinctYears().map(v => '<option value="' + escapeHtml(v) + '"' + (String(state.filters.year) === String(v) ? ' selected' : '') + '>' + escapeHtml(v) + '</option>')).join('');
      const monthOptions = ['<option value="">Toate</option>']
        .concat(Array.from({ length:12 }, (_, i) => '<option value="' + (i+1) + '"' + (String(state.filters.month) === String(i+1) ? ' selected' : '') + '>' + monthNameShort(i+1) + '</option>')).join('');
      const stockOptions = ['<option value="">Implicit</option>']
        .concat((state.stocksSnapshots || []).map(entry => {
          const label = String(entry.label || '');
          return '<option value="' + escapeHtml(label) + '"' + (state.filters.stockLabel === label ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
        })).join('');
      const balanceSelect = `<div class="field"><label>Balance</label><select id="fltBalanceMode">
            <option value="all"${state.filters.balanceMode === 'all' ? ' selected' : ''}>Toate</option>
            <option value="positive"${state.filters.balanceMode === 'positive' ? ' selected' : ''}>Pozitiv</option>
            <option value="zero"${state.filters.balanceMode === 'zero' ? ' selected' : ''}>Zero</option>
            <option value="negative"${state.filters.balanceMode === 'negative' ? ' selected' : ''}>Negativ</option>
          </select></div>`;
      let extra = '';
      let help = '';
      if (state.activeTab === 'pivotNeed'){
        extra = `
          <div class="field"><label>Luna</label><select id="fltMonth">${monthOptions}</select></div>
          ${balanceSelect}
        `;
        help = 'Pivotul săptămână necesar este prioritar. Se recalculează live din data_export + maparea INFO SAPT Materiale_Kg (2). Când Status este gol, se aplică exact setul workbook: open, pending, in process, matl\' acquisition, planned, completed.';
      } else if (state.activeTab === 'forecast'){
        extra = `
          <div class="field"><label>Luna</label><select id="fltMonth">${monthOptions}</select></div>
          ${balanceSelect}
          <div class="field"><label>Stock snapshot</label><select id="fltStock">${stockOptions}</select></div>
        `;
        help = 'Forecastul se calculează din Ordered Qty, grupat pe Ship To / Item / ISO week, pentru anul selectat.';
      } else if (state.activeTab === 'stocks'){
        extra = `
          <div class="field"><label>Stock snapshot</label><select id="fltStock">${stockOptions}</select></div>
          <div class="field"><label>Balance</label><select id="fltBalanceMode"><option value="all" selected>N/A</option></select></div>
        `;
        help = 'Stocks se citesc din sheet-ul STOCKS al workbook-ului și se filtrează pe snapshot.';
      } else {
        extra = `
          <div class="field"><label>Luna</label><select id="fltMonth">${monthOptions}</select></div>
          ${balanceSelect}
        `;
        help = 'Dublu click pe rând pentru editare. Câmpurile derivate se recalculează automat.';
      }

      dom.filters.innerHTML = `
        <div class="field">
          <label>Căutare</label>
          <input id="fltQuery" type="text" value="${escapeHtml(state.filters.query)}" placeholder="Line ID / reper / ship to / material / planner…" />
        </div>
        <div class="field"><label>Ship To</label><select id="fltShipTo">${shipToOptions}</select></div>
        <div class="field"><label>Item ID</label><select id="fltItemId">${itemOptions}</select></div>
        <div class="field"><label>Status</label><select id="fltStatus">${statusOptions}</select></div>
        <div class="field"><label>An</label><select id="fltYear">${yearOptions}</select></div>
        ${extra}
        <button class="btn secondary" type="button" id="btnResetFilters">Resetează filtre</button>
        <div class="field-help">${help}</div>
      `;
      bindFilterInputs();
    }
    function bindFilterInputs(){
      const bind = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => { state.filters[key] = el.value; renderAll(); });
        el.addEventListener('change', () => { state.filters[key] = el.value; renderAll(); });
      };
      bind('fltQuery', 'query');
      bind('fltShipTo', 'shipTo');
      bind('fltItemId', 'itemId');
      bind('fltStatus', 'status');
      bind('fltYear', 'year');
      bind('fltMonth', 'month');
      bind('fltBalanceMode', 'balanceMode');
      bind('fltStock', 'stockLabel');
      const reset = document.getElementById('btnResetFilters');
      if (reset) reset.addEventListener('click', () => {
        state.filters.query = '';
        state.filters.shipTo = '';
        state.filters.itemId = '';
        state.filters.status = '';
        state.filters.year = '';
        state.filters.month = '';
        state.filters.balanceMode = 'all';
        state.filters.stockLabel = state.stocksSnapshots[0] ? String(state.stocksSnapshots[0].label || '') : '';
        renderAll();
      });
    }
    function renderDataExportTable(){
      const rows = getFilteredRows();
      dom.tableNote.textContent = 'Data export: ' + formatInt(rows.length) + ' rânduri filtrate din ' + formatInt(state.rows.length) + '.';
      const colgroup = DATA_EXPORT_COLUMNS.map(col => '<col style="width:' + col.width + 'px">').join('');
      const head = DATA_EXPORT_COLUMNS.map(col => '<th class="' + escapeHtml(col.className || '') + '">' + escapeHtml(col.label) + '</th>').join('');
      const body = rows.length ? rows.map(row => {
        const selected = row.__id === state.selectedId ? ' selected' : '';
        const cells = DATA_EXPORT_COLUMNS.map(col => {
          let value = row[col.key];
          if (col.key === 'status'){
            value = '<span class="cell-status ' + statusClass(value) + '">' + escapeHtml(value || '') + '</span>';
          } else if (/Qty|Balance|Week|Year|Mo|Days/i.test(col.key)) {
            value = escapeHtml(/Week|Year|Mo/i.test(col.key) ? formatInt(value) : formatNumber(value));
          } else if (/Date/i.test(col.key)) {
            value = escapeHtml(formatDateDisplay(value));
          } else {
            value = escapeHtml(value ?? '');
          }
          return '<td class="' + escapeHtml(col.className || '') + '">' + value + '</td>';
        }).join('');
        return '<tr data-row-id="' + escapeHtml(row.__id) + '" class="' + selected.trim() + '">' + cells + '</tr>';
      }).join('') : '<tr><td colspan="' + DATA_EXPORT_COLUMNS.length + '" class="table-empty">Nu există rânduri pentru filtrarea curentă.</td></tr>';
      dom.tableWrap.innerHTML = '<table><colgroup>' + colgroup + '</colgroup><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
      dom.tableWrap.querySelectorAll('tbody tr[data-row-id]').forEach(tr => {
        tr.addEventListener('click', () => {
          state.selectedId = tr.getAttribute('data-row-id') || '';
          renderAll();
        });
        tr.addEventListener('dblclick', () => {
          if (!state.permissions.can_edit) return;
          openModal(tr.getAttribute('data-row-id') || '');
        });
      });
    }
    function renderStocksTable(){
      const q = normalizeText(state.filters.query);
      const rows = getSelectedStockRows().filter(row => {
        if (!q) return true;
        const hay = normalizeText([row.itemId, row.packed, row.finished, row.wip, row.forja, row.debitat, row.steelKg].join(' '));
        return hay.includes(q);
      });
      const label = state.filters.stockLabel || state.stocksLabel || '-';
      dom.tableNote.textContent = 'Stocks snapshot: ' + label + ' — ' + formatInt(rows.length) + ' repere.';
      const cols = [
        ['itemId','Item ID',180], ['packed','Packed PCS',110], ['finished','Finished PCS',110], ['wip','WIP PCS',100],
        ['forja','Forja',92], ['debitat','Debitat',92], ['steelKg','Oțel KG',110], ['remaniere','Remaniere',110]
      ];
      const colgroup = cols.map(col => '<col style="width:' + col[2] + 'px">').join('');
      const head = cols.map(col => '<th>' + escapeHtml(col[1]) + '</th>').join('');
      const body = rows.length ? rows.map(row => '<tr>' + cols.map(col => {
        const key = col[0];
        const val = key === 'itemId' ? escapeHtml(row[key] ?? '') : escapeHtml(formatNumber(row[key]));
        return '<td class="' + (key === 'itemId' ? 'nowrap' : 'right mono') + '">' + val + '</td>';
      }).join('') + '</tr>').join('') : '<tr><td colspan="8" class="table-empty">Nu există rânduri pentru snapshot-ul selectat.</td></tr>';
      dom.tableWrap.innerHTML = '<table><colgroup>' + colgroup + '</colgroup><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
    }

    function renderNeedPivotTable(){
      const model = buildNeedPivotModel();
      const yearLabel = state.filters.year || '-';
      const unmappedCount = model.unmapped.length;
      dom.tableNote.textContent = 'Pivot săptămână necesar: an ' + escapeHtml(yearLabel) + ', ' + formatInt(model.materials.length) + ' materiale, ' + formatInt(model.rowCount) + ' linii sursă. Recalculat live, nu din pivot cache-ul vechi din Excel.';
      if (!model.materials.length){
        dom.tableWrap.innerHTML = '<div class="table-empty">Nu există date pentru filtrarea curentă în Pivot săptămână necesar.</div>';
        return;
      }
      const colgroup = ['<col style="width:170px"><col style="width:170px"><col style="width:92px"><col style="width:110px">']
        .concat(model.weeks.map(() => '<col style="width:74px">')).join('');
      const head = '<tr><th class="sticky-col w-material">Material</th><th class="sticky-col-2 w-diam">Diametru tip</th><th class="right mono">Repere</th><th class="right mono">Total KG</th>' +
        model.weeks.map(week => '<th>W' + escapeHtml(String(week)) + '</th>').join('') + '</tr>';
      let body = '';
      model.materials.forEach(material => {
        body += '<tr class="material-row">' +
          '<td class="sticky-col nowrap">' + escapeHtml(material.material) + '</td>' +
          '<td class="sticky-col-2"></td>' +
          '<td class="right mono">' + escapeHtml(formatInt(material.itemCount)) + '</td>' +
          '<td class="right mono">' + escapeHtml(formatNumber(material.totalKg)) + '</td>' +
          model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(material.weekMap.get(week) || null)) + '</td>').join('') +
        '</tr>';
        material.rows.forEach(child => {
          body += '<tr class="child-row">' +
            '<td class="sticky-col"></td>' +
            '<td class="sticky-col-2 nowrap">' + escapeHtml(child.diametruTip) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatInt(child.itemCount)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(child.totalKg)) + '</td>' +
            model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(child.weekMap.get(week) || null)) + '</td>').join('') +
          '</tr>';
        });
      });
      body += '<tr class="total">' +
        '<td class="sticky-col nowrap">TOTAL GENERAL</td>' +
        '<td class="sticky-col-2"></td>' +
        '<td></td>' +
        '<td class="right mono">' + escapeHtml(formatNumber(model.totalKg)) + '</td>' +
        model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(model.grandWeekMap.get(week) || null)) + '</td>').join('') +
      '</tr>';
      let warn = '';
      if (unmappedCount){
        warn = '<div class="warn-box"><b>Atenție:</b> ' + escapeHtml(String(unmappedCount)) + ' repere din data_export nu au mapare kg în INFO SAPT Materiale_Kg (2), deci nu intră în pivot. ' +
          'Exemple: ' + escapeHtml(model.unmapped.slice(0,8).map(x => x.itemId).join(', ')) + (model.unmapped.length > 8 ? '…' : '') + '.</div>';
      }
      dom.tableWrap.innerHTML = '<div class="need-wrap"><table><colgroup>' + colgroup + '</colgroup><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' + warn + '</div>';
    }

    function renderForecastTable(){
      const model = buildForecastModel();
      dom.tableNote.textContent = 'MRC Forecast: an ' + escapeHtml(state.filters.year || '-') + ', ' + formatInt(model.groups.reduce((sum, group) => sum + group.items.length, 0)) + ' combinații Ship To + Item.';
      if (!model.weeks.length){
        dom.tableWrap.innerHTML = '<div class="table-empty">Nu există date pentru filtrarea curentă în forecast.</div>';
        return;
      }
      const monthBands = [];
      let currentMonth = null;
      let startWeek = null;
      model.weeks.forEach((week, idx) => {
        const month = model.monthByWeek.get(week) || 0;
        if (month !== currentMonth){
          if (currentMonth !== null){
            monthBands.push({ month: currentMonth, start: startWeek, span: idx - startWeek });
          }
          currentMonth = month;
          startWeek = idx;
        }
      });
      if (currentMonth !== null) monthBands.push({ month: currentMonth, start: startWeek, span: model.weeks.length - startWeek });

      let headTop = `
        <tr>
          <th class="sticky-col w-ship" rowspan="2">Ship To</th>
          <th class="sticky-col-2 w-item" rowspan="2">Item ID</th>
          <th class="w-fixed" rowspan="2">Total Qty</th>
          <th class="w-fixed" rowspan="2">Balance</th>
          <th class="w-fixed" rowspan="2">Next Ship</th>
          <th class="w-fixed" rowspan="2">Packed</th>
          <th class="w-fixed" rowspan="2">Forja</th>
          <th class="w-fixed" rowspan="2">Debitat</th>
          <th class="w-fixed" rowspan="2">Steel Kg</th>
      `;
      monthBands.forEach(band => {
        headTop += '<th colspan="' + band.span + '">' + escapeHtml(monthNameShort(band.month)) + '</th>';
      });
      headTop += '</tr>';
      const weekHead = model.weeks.map(week => '<th class="w-week">W' + escapeHtml(String(week)) + '</th>').join('');
      const headBottom = '<tr class="subhead">' + weekHead + '</tr>';
      let body = '';
      model.groups.forEach(group => {
        group.items.forEach((item, idx) => {
          const stock = item.stock || {};
          body += '<tr>' +
            '<td class="sticky-col nowrap">' + (idx === 0 ? escapeHtml(group.shipTo) : '') + '</td>' +
            '<td class="sticky-col-2 nowrap">' + escapeHtml(item.itemId) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(item.totalQty)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(item.totalBalance)) + '</td>' +
            '<td class="center nowrap mono">' + escapeHtml(formatDateDisplay(item.nextShipDate)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(stock.packed)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(stock.forja)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(stock.debitat)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(stock.steelKg)) + '</td>' +
            model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(item.weekMap.get(week) || null)) + '</td>').join('') +
          '</tr>';
        });
        const subtotal = model.shipTotals.find(entry => entry.shipTo === group.shipTo);
        if (subtotal){
          body += '<tr class="subtotal">' +
            '<td class="sticky-col nowrap">' + escapeHtml(group.shipTo + ' total') + '</td>' +
            '<td class="sticky-col-2"></td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(subtotal.totalQty)) + '</td>' +
            '<td class="right mono">' + escapeHtml(formatNumber(subtotal.totalBalance)) + '</td>' +
            '<td></td><td></td><td></td><td></td><td></td>' +
            model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(subtotal.weekMap.get(week) || null)) + '</td>').join('') +
          '</tr>';
        }
      });
      const grandTotalQty = model.shipTotals.reduce((sum, item) => sum + item.totalQty, 0);
      const grandBalance = model.shipTotals.reduce((sum, item) => sum + item.totalBalance, 0);
      body += '<tr class="total">' +
        '<td class="sticky-col nowrap">TOTAL GENERAL</td>' +
        '<td class="sticky-col-2"></td>' +
        '<td class="right mono">' + escapeHtml(formatNumber(grandTotalQty)) + '</td>' +
        '<td class="right mono">' + escapeHtml(formatNumber(grandBalance)) + '</td>' +
        '<td></td><td></td><td></td><td></td><td></td>' +
        model.weeks.map(week => '<td class="right mono">' + escapeHtml(formatNumber(model.grandWeekMap.get(week) || null)) + '</td>').join('') +
      '</tr>';
      dom.tableWrap.innerHTML = '<div class="forecast-wrap"><table><thead>' + headTop + headBottom + '</thead><tbody>' + body + '</tbody></table></div>';
    }
    function renderAll(){
      if (!state.filters.year){
        const years = getDistinctYears();
        if (years.length) state.filters.year = String(years[years.length - 1]);
      }
      updateDiagnosticsChip();
      updateStats();
      renderFilters();
      dom.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === state.activeTab));
      if (state.activeTab === 'pivotNeed') renderNeedPivotTable();
      else if (state.activeTab === 'dataExport') renderDataExportTable();
      else if (state.activeTab === 'stocks') renderStocksTable();
      else renderForecastTable();
    }
    function openModal(rowId){
      if (!state.permissions.can_edit) return;
      const source = rowId ? state.rows.find(row => row.__id === rowId) : null;
      const row = source ? clone(stripEphemeral(source)) : {};
      state.modalId = rowId || '';
      dom.modalTitle.textContent = rowId ? 'Editare rând data_export' : 'Adăugare rând data_export';
      dom.formGrid.innerHTML = FIELD_DEFS.map(def => {
        const value = row[def.key];
        const rendered = def.type === 'date'
          ? '<input data-field="' + def.key + '" type="date" value="' + escapeHtml(toIsoDate(value)) + '" />'
          : '<input data-field="' + def.key + '" type="' + def.type + '" value="' + escapeHtml(value ?? '') + '" />';
        return '<div class="field ' + ((def.key === 'lineId' || def.key === 'shipTo' || def.key === 'itemId' || def.key === 'bpoLineId') ? 'span-2' : '') + '"><label>' + escapeHtml(def.label) + '</label>' + rendered + '</div>';
      }).join('');
      dom.modalBackdrop.classList.add('open');
      dom.modalBackdrop.setAttribute('aria-hidden','false');
    }
    function closeModal(){
      state.modalId = '';
      dom.modalBackdrop.classList.remove('open');
      dom.modalBackdrop.setAttribute('aria-hidden','true');
      dom.formGrid.innerHTML = '';
    }
    function saveModal(){
      const fields = Array.from(dom.formGrid.querySelectorAll('[data-field]'));
      const row = {};
      fields.forEach(input => row[input.dataset.field] = input.value);
      if (!String(row.shipTo || '').trim()){
        alert('Ship To este obligatoriu.');
        return;
      }
      if (!String(row.itemId || '').trim()){
        alert('Item ID este obligatoriu.');
        return;
      }
      if (!toIsoDate(row.shipDate)){
        alert('Ship Date este obligatoriu și trebuie să fie valid.');
        return;
      }
      recomputeDerived(row);
      if (state.modalId){
        const idx = state.rows.findIndex(entry => entry.__id === state.modalId);
        if (idx >= 0){
          row.__id = state.modalId;
          state.rows[idx] = ensureRowIdentity(row, idx);
        }
      } else {
        row.__id = uid('mrc');
        state.rows.push(ensureRowIdentity(row, state.rows.length));
      }
      state.dirty = true;
      saveLocal();
      scheduleSave();
      closeModal();
      renderAll();
    }
    function deleteSelected(){
      if (!state.permissions.can_delete && !state.permissions.can_edit) return;
      if (!state.selectedId){
        alert('Selectează mai întâi un rând din Data export.');
        return;
      }
      if (!confirm('Șterg rândul selectat din data_export?')) return;
      state.rows = state.rows.filter(row => row.__id !== state.selectedId);
      state.selectedId = '';
      state.dirty = true;
      saveLocal();
      scheduleSave();
      renderAll();
    }
    async function ensureSheetJs(){
      if (window.XLSX) return window.XLSX;
      if (state.sheetJsPromise) return state.sheetJsPromise;
      state.sheetJsPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-xlsx-loader="1"]');
        if (existing){
          existing.addEventListener('load', () => resolve(window.XLSX), { once:true });
          existing.addEventListener('error', () => reject(new Error('Nu s-a putut încărca XLSX.')), { once:true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.dataset.xlsxLoader = '1';
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('Nu s-a putut încărca XLSX.'));
        document.head.appendChild(script);
      });
      return state.sheetJsPromise;
    }
    function pick(source, keys){
      for (const key of keys){
        if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) return source[key];
      }
      return undefined;
    }
    function mapImportedRow(source){
      const row = {
        lineId: pick(source, ['Line ID','lineId','LineId']),
        shipTo: pick(source, ['Ship To','shipTo']),
        itemId: pick(source, ['Item ID','itemId']),
        bpoLineId: pick(source, ['BPO Line ID','bpoLineId']),
        status: pick(source, ['Status','status']),
        groupId: pick(source, ['Group ID','groupId']),
        sloc: pick(source, ['SLOC','sloc']),
        versionNo: pick(source, ['Version No','versionNo']),
        orderedQty: pick(source, ['Ordered Qty','orderedQty']),
        shipDate: pick(source, ['Ship Date','shipDate']),
        deliveryDate: pick(source, ['Delivery Date','deliveryDate']),
        promiseDate: pick(source, ['Promise Date','promiseDate']),
        promiseQty: pick(source, ['Promise Qty','promiseQty']),
        shippedQty: pick(source, ['Shipped Qty','shippedQty']),
        receivedQty: pick(source, ['Received Qty','receivedQty']),
        deliverTo: pick(source, ['Deliver To','deliverTo']),
        replenishmentType: pick(source, ['Replenishment Type','replenishmentType']),
        shipmentOverride: pick(source, ['Shipment Override','shipmentOverride']),
        uom: pick(source, ['UOM','uom']),
        plannerCode: pick(source, ['Planner Code','plannerCode']),
        supplier: pick(source, ['Supplier','supplier']),
        confirmationDate: pick(source, ['Confirmation Date','confirmationDate']),
        odQty: pick(source, ['OD Qty','odQty']),
        creationDate: pick(source, ['Creation Date','creationDate']),
        shippedQtyDue: pick(source, ['Shipped Qty Due','shippedQtyDue']),
        receivedQtyDue: pick(source, ['Received Qty Due','receivedQtyDue']),
        country: pick(source, ['Country','country']),
        shipMo: pick(source, ['Ship Mo','shipMo']),
        shipYear: pick(source, ['Ship Year','shipYear']),
        shipWeek: pick(source, ['Ship Week','shipWeek']),
        balance: pick(source, ['Balance','balance']),
        workingDaysFirmOrder: pick(source, ['Working Days - firm order','workingDaysFirmOrder'])
      };
      if (!row.lineId && !row.itemId && !row.shipTo) return null;
      if (String(row.country || '').trim() === '#REF!') row.country = '';
      if (String(row.workingDaysFirmOrder || '').trim() === '#REF!') row.workingDaysFirmOrder = '';
      if (String(row.balance || '').trim() === '#VALUE!') row.balance = '';
      return recomputeDerived(row);
    }
    function parseStocksSheetFromAoA(aoa){
      const snapshots = [];
      if (!Array.isArray(aoa) || !aoa.length) return snapshots;
      const headerRow = aoa[0] || [];
      for (let start = 1; start < headerRow.length; start += 8){
        const label = headerRow[start];
        if (!label) continue;
        const rows = [];
        for (let r = 2; r < aoa.length; r += 1){
          const src = aoa[r] || [];
          const itemId = src[start];
          if (!itemId) continue;
          const row = {
            itemId,
            packed: src[start + 1] ?? null,
            finished: src[start + 2] ?? null,
            wip: src[start + 3] ?? null,
            forja: src[start + 4] ?? null,
            debitat: src[start + 5] ?? null,
            steelKg: src[start + 6] ?? null,
            remaniere: src[start + 7] ?? null
          };
          if ([row.packed,row.finished,row.wip,row.forja,row.debitat,row.steelKg,row.remaniere].some(v => v !== null && v !== undefined && v !== '')){
            rows.push(row);
          }
        }
        snapshots.push({ label:String(label), rows });
      }
      return snapshots;
    }

    function parseItemMasterFromAoA(aoa){
      const rows = [];
      const seen = new Set();
      if (!Array.isArray(aoa) || !aoa.length) return rows;
      for (let r = 3; r < aoa.length; r += 1){
        const src = aoa[r] || [];
        const itemId = src[0];
        if (!itemId) continue;
        const key = normalizeItem(itemId);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({
          itemId: String(itemId).trim(),
          material: String(src[1] ?? '').replace(/—/g,'-').trim(),
          diametruTip: String(src[2] ?? '').trim(),
          kg: toNumber(src[3])
        });
      }
      return rows;
    }
    async function importExcelFile(file){
      if (!file) return;
      if (!state.permissions.can_add && !state.permissions.can_edit){
        alert('Nu ai drept de import pe această pagină.');
        return;
      }
      try {
        const XLSX = await ensureSheetJs();
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type:'array', cellDates:true });
        const names = wb.SheetNames || [];
        const dataSheetName = names.find(name => normalizeText(name) === 'data_export') || names[0];
        if (!dataSheetName){
          alert('Fișierul Excel nu conține foi.');
          return;
        }
        const dataSheet = wb.Sheets[dataSheetName];
        const rawRows = XLSX.utils.sheet_to_json(dataSheet, { defval:null, raw:true });
        const importedRows = rawRows.map(mapImportedRow).filter(Boolean).map((row, idx) => ensureRowIdentity(row, idx));
        if (!importedRows.length){
          alert('Fișierul Excel nu conține rânduri valide pentru data_export.');
          return;
        }
        let importedStocks = state.stocksSnapshots;
        let importedItemMaster = state.itemMasterRows;
        const stockName = names.find(name => normalizeText(name) === 'stocks');
        if (stockName){
          const aoa = XLSX.utils.sheet_to_json(wb.Sheets[stockName], { header:1, defval:null, raw:true });
          importedStocks = parseStocksSheetFromAoA(aoa);
        }
        const infoName = names.find(name => normalizeText(name).includes('info sapt materiale'));
        if (infoName){
          const aoa = XLSX.utils.sheet_to_json(wb.Sheets[infoName], { header:1, defval:null, raw:true });
          importedItemMaster = parseItemMasterFromAoA(aoa);
        }
        const mode = prompt('Import MRC:\n1 = înlocuiește complet datele curente\n2 = adaugă peste datele curente\n3 = anulează', '1');
        if (mode !== '1' && mode !== '2') return;
        if (mode === '1'){
          state.rows = importedRows;
          state.stocksSnapshots = importedStocks;
          state.itemMasterRows = importedItemMaster;
        } else {
          const seen = new Set(state.rows.map(row => [row.lineId,row.shipTo,row.itemId,row.shipDate,row.orderedQty].join('|')));
          importedRows.forEach(row => {
            const fp = [row.lineId,row.shipTo,row.itemId,row.shipDate,row.orderedQty].join('|');
            if (!seen.has(fp)){
              seen.add(fp);
              state.rows.push(ensureRowIdentity(row, state.rows.length));
            }
          });
          if (importedStocks && importedStocks.length) state.stocksSnapshots = importedStocks;
          if (importedItemMaster && importedItemMaster.length) state.itemMasterRows = importedItemMaster;
        }
        state.diagnostics = {
          sourceWorkbook: file.name,
          dataExportRows: state.rows.length,
          stockSnapshots: state.stocksSnapshots.length,
          formulaIssues: {
            country_ref: rawRows.filter(r => String(r['Country'] ?? '').trim() === '#REF!').length,
            working_days_ref: rawRows.filter(r => String(r['Working Days - firm order'] ?? '').trim() === '#REF!').length,
            balance_errors: rawRows.filter(r => String(r['Balance'] ?? '').trim() === '#VALUE!').length
          },
          firstShipDate: state.rows.map(r => toIsoDate(r.shipDate)).filter(Boolean).sort()[0] || '',
          lastShipDate: state.rows.map(r => toIsoDate(r.shipDate)).filter(Boolean).sort().slice(-1)[0] || ''
        };
        state.filters.stockLabel = state.stocksSnapshots[0] ? String(state.stocksSnapshots[0].label || '') : '';
        state.sourceLabel = 'import excel';
        state.dirty = true;
        saveLocal();
        scheduleSave();
        setChip(dom.chipSeed, dom.dotSeed, 'Sursă: import Excel ' + file.name, 'success');
        renderAll();
        alert('Import finalizat: ' + importedRows.length + ' rânduri data_export citite din Excel.');
      } catch (error) {
        console.error('importExcelFile', error);
        alert('Import Excel eșuat. Fișierul nu respectă structura așteptată sau nu poate fi citit.');
      } finally {
        dom.excelInput.value = '';
      }
    }
    async function exportExcel(){
      try {
        const XLSX = await ensureSheetJs();
        const wb = XLSX.utils.book_new();
        const dataRows = state.rows.map(stripEphemeral).map(row => ({
          'Line ID': row.lineId,
          'Ship To': row.shipTo,
          'Item ID': row.itemId,
          'BPO Line ID': row.bpoLineId,
          'Status': row.status,
          'Group ID': row.groupId,
          'SLOC': row.sloc,
          'Version No': row.versionNo,
          'Ordered Qty': row.orderedQty,
          'Ship Date': toIsoDate(row.shipDate),
          'Delivery Date': toIsoDate(row.deliveryDate),
          'Promise Date': toIsoDate(row.promiseDate),
          'Promise Qty': row.promiseQty,
          'Shipped Qty': row.shippedQty,
          'Received Qty': row.receivedQty,
          'Deliver To': row.deliverTo,
          'Replenishment Type': row.replenishmentType,
          'Shipment Override': row.shipmentOverride,
          'UOM': row.uom,
          'Planner Code': row.plannerCode,
          'Supplier': row.supplier,
          'Confirmation Date': toIsoDate(row.confirmationDate),
          'OD Qty': row.odQty,
          'Creation Date': toIsoDate(row.creationDate),
          'Shipped Qty Due': row.shippedQtyDue,
          'Received Qty Due': row.receivedQtyDue,
          'Country': row.country,
          'Ship Mo': row.shipMo,
          'Ship Year': row.shipYear,
          'Ship Week': row.shipWeek,
          'Balance': row.balance,
          'Working Days - firm order': row.workingDaysFirmOrder
        }));
        const wsData = XLSX.utils.json_to_sheet(dataRows);
        wsData['!cols'] = [
          { wch:26 },{ wch:18 },{ wch:16 },{ wch:20 },{ wch:18 },{ wch:12 },{ wch:8 },{ wch:11 },
          { wch:11 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:11 },{ wch:11 },{ wch:12 },{ wch:12 },
          { wch:18 },{ wch:18 },{ wch:8 },{ wch:12 },{ wch:12 },{ wch:14 },{ wch:11 },{ wch:12 },
          { wch:13 },{ wch:14 },{ wch:12 },{ wch:9 },{ wch:9 },{ wch:9 },{ wch:10 },{ wch:18 }
        ];
        XLSX.utils.book_append_sheet(wb, wsData, 'data_export');

        const needModel = buildNeedPivotModel();
        const needFlat = [];
        needModel.materials.forEach(material => {
          needFlat.push({
            'Year': state.filters.year,
            'Row Type': 'Material',
            'Material': material.material,
            'Diametru Tip': '',
            'Repere': material.itemCount,
            'Total KG': material.totalKg
          });
          needModel.weeks.forEach(week => {
            const kg = material.weekMap.get(week) || 0;
            if (kg){
              needFlat.push({
                'Year': state.filters.year,
                'Row Type': 'Week',
                'Material': material.material,
                'Diametru Tip': '',
                'Repere': material.itemCount,
                'Week': week,
                'KG': kg
              });
            }
          });
          material.rows.forEach(child => {
            needFlat.push({
              'Year': state.filters.year,
              'Row Type': 'Diametru',
              'Material': material.material,
              'Diametru Tip': child.diametruTip,
              'Repere': child.itemCount,
              'Total KG': child.totalKg
            });
            needModel.weeks.forEach(week => {
              const kg = child.weekMap.get(week) || 0;
              if (kg){
                needFlat.push({
                  'Year': state.filters.year,
                  'Row Type': 'Week',
                  'Material': material.material,
                  'Diametru Tip': child.diametruTip,
                  'Repere': child.itemCount,
                  'Week': week,
                  'KG': kg
                });
              }
            });
          });
        });
        const wsNeed = XLSX.utils.json_to_sheet(needFlat);
        wsNeed['!cols'] = [{ wch:8 },{ wch:12 },{ wch:18 },{ wch:18 },{ wch:10 },{ wch:10 },{ wch:12 }];
        XLSX.utils.book_append_sheet(wb, wsNeed, 'Pivot_Sapt_Necesar');

        const wsMaster = XLSX.utils.json_to_sheet((state.itemMasterRows || []).map(row => ({
          'Item ID': row.itemId,
          'Material': row.material,
          'Diametru Tip': row.diametruTip,
          'Kg': row.kg
        })));
        wsMaster['!cols'] = [{ wch:16 },{ wch:14 },{ wch:18 },{ wch:10 }];
        XLSX.utils.book_append_sheet(wb, wsMaster, 'INFO_Item_Master');

        if (needModel.unmapped.length){
          const wsMissing = XLSX.utils.json_to_sheet(needModel.unmapped.map(row => ({
            'Item ID': row.itemId,
            'Rows': row.rows,
            'Total Qty': row.totalQty
          })));
          wsMissing['!cols'] = [{ wch:16 },{ wch:10 },{ wch:12 }];
          XLSX.utils.book_append_sheet(wb, wsMissing, 'Need_Unmapped');
        }

        const model = buildForecastModel();
        const flatForecast = [];
        model.groups.forEach(group => group.items.forEach(item => model.weeks.forEach(week => {
          const qty = item.weekMap.get(week) || 0;
          if (qty){
            flatForecast.push({
              'Ship To': group.shipTo,
              'Item ID': item.itemId,
              'Ship Year': state.filters.year,
              'Ship Month': monthNameShort(model.monthByWeek.get(week)),
              'Ship Week': week,
              'Ordered Qty': qty,
              'Balance Item': item.totalBalance,
              'Next Ship Date': toIsoDate(item.nextShipDate)
            });
          }
        })));
        const wsForecast = XLSX.utils.json_to_sheet(flatForecast);
        wsForecast['!cols'] = [{ wch:18 },{ wch:16 },{ wch:10 },{ wch:10 },{ wch:9 },{ wch:12 },{ wch:12 },{ wch:12 }];
        XLSX.utils.book_append_sheet(wb, wsForecast, 'MRC_Forecast');

        const stockFlat = [];
        state.stocksSnapshots.forEach(snap => (snap.rows || []).forEach(row => {
          stockFlat.push({
            'Snapshot': snap.label,
            'Item ID': row.itemId,
            'Packed': row.packed,
            'Finished': row.finished,
            'WIP': row.wip,
            'Forja': row.forja,
            'Debitat': row.debitat,
            'Steel Kg': row.steelKg,
            'Remaniere': row.remaniere
          });
        }));
        const wsStocks = XLSX.utils.json_to_sheet(stockFlat);
        wsStocks['!cols'] = [{ wch:22 },{ wch:24 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:12 }];
        XLSX.utils.book_append_sheet(wb, wsStocks, 'STOCKS');

        const fname = 'mrc_' + new Date().toISOString().slice(0,10) + '.xlsx';
        XLSX.writeFile(wb, fname);
      } catch (error) {
        console.error('exportExcel', error);
        alert('Export Excel eșuat.');
      }
    }
    function bindEvents(){
      dom.btnBack.addEventListener('click', () => { window.location.href = 'index.html'; });
      dom.btnImport.addEventListener('click', () => dom.excelInput.click());
      dom.excelInput.addEventListener('change', e => importExcelFile(e.target.files && e.target.files[0]));
      dom.btnExport.addEventListener('click', exportExcel);
      dom.btnSync.addEventListener('click', () => saveCloud(true));
      dom.btnAdd.addEventListener('click', () => openModal(''));
      dom.btnDelete.addEventListener('click', deleteSelected);
      dom.tabs.forEach(tab => tab.addEventListener('click', () => {
        if (state.activeTab === tab.dataset.tab) return;
        state.activeTab = tab.dataset.tab;
        renderAll();
      }));
      dom.btnCloseModal.addEventListener('click', closeModal);
      dom.btnCancelModal.addEventListener('click', closeModal);
      dom.btnSaveModal.addEventListener('click', saveModal);
      dom.modalBackdrop.addEventListener('click', (event) => {
        if (event.target === dom.modalBackdrop) closeModal();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dom.modalBackdrop.classList.contains('open')) closeModal();
      });
    }
    async function init(){
      bindEvents();
      setChip(dom.chipSeed, dom.dotSeed, 'Sursă: seed workbook în curs de încărcare', 'warning');
      setChip(dom.chipDiag, dom.dotDiag, 'Diagnostic workbook: se verifică…', 'warning');
      await initAuthAndPermissions();
      await initData();
      updateDiagnosticsChip();
      renderAll();
      applyAclButtons();
      window.setInterval(() => { void checkRemoteChanges(); }, REMOTE_POLL_MS);
    }

    init();
  })();
