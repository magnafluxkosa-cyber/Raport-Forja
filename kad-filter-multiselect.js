/* K.A.D - model unic filtrare multiplă, variantă stabilă fără blocare la încărcare. */
(function(){
  'use strict';

  if (window.KAD_MULTI_FILTER && String(window.KAD_MULTI_FILTER.__version || '').indexOf('2026-06-03-stable-v8') === 0) return;

  var VERSION = '2026-06-03-stable-v8';
  var enhanced = [];
  var activeMenu = null;
  var postTimer = 0;
  var scanDone = false;
  var MAX_VISIBLE_OPTIONS = 500;

  var FILTER_CONTAINER_SELECTOR = [
    '.filters', '.filtersBar', '.filterBar', '.filterbar', '.filter-panel', '.filterPanel', '.filters-panel',
    '.filter-row', '.filterRow', '.pageFilters', '.kad-filters', '.top-filters', '.analytics-filters',
    '.plan-filters', '.filter-controls', '.search-controls', '.toolbar-filters', '.table-toolbar',
    '.summary-toolbar', '.summary-toolbar-controls', '.alertControls', '.sideControls', '#filterRow',
    'thead', 'thead tr', 'thead tr.filters', 'thead tr.colFilters', 'thead tr.filter-row'
  ].join(',');

  var EXCLUDE_ANCESTOR_SELECTOR = [
    '.modal', '.modalback', '.modal-backdrop', '.modalBack', '.backdrop', '[role="dialog"]',
    '.pinModal', '.pin-modal', '.entryModal', '.modalBody', '.modal-body', '.modalContent', '.modal-content',
    '.kad-ms', '.kad-ms-menu', 'form:not(.filters):not(.filterPanel):not(.filter-panel):not(.filter-row):not(.filterbar):not(.filterBar)'
  ].join(',');

  var FILTER_ID_RE = /(filter|filt|flt|selan|selluna|selyear|selmonth|fyear|fmonth|freper|futilaj|fdiam|fcal|fstatus|fshift|thfilter|colfilter|yearfilter|monthfilter|reperfilter|operatorfilter|statusfilter|utilajfilter|sarjafilter|departamentfilter)/i;
  var EXCLUDE_ID_RE = /^(txt|inp|fld|edit|add|m[A-Z]|pt|pin|docType|category|retention|source|statusField|fAn|fData|fDim|fCal|fPrem|fCat|fKg|fPre|fFurn|mData|mAn|mLuna|mEchip|mReper|mDiam|mCal|mKgBuc|mLungime|mSarja|mPlan|mCant|mSchimb|mOper|mOre)/;

  var KEY_ALIASES = {
    an:['an','anul','year'], anul:['an','anul','year'], year:['an','anul','year'],
    luna:['luna','lună','month'], lună:['luna','lună','month'], month:['luna','lună','month'],
    data:['data','dată','date','zi'], zi:['zi','data','dată','date'],
    reper:['reper','piesa','piesă','produs','cod reper','part'],
    dimensiune:['dimensiune','diametru','diametru otel','diametru oțel','dimensiune otel','dimensiune oțel'],
    diametru:['dimensiune','diametru','diametru otel','diametru oțel','dimensiune otel','dimensiune oțel'],
    calitate:['calitate','calitate otel','calitate oțel'],
    utilaj:['utilaj','linie','echipament','ciocan','linie forjare','linie de forjare','masina','mașina'],
    echipament:['utilaj','echipament','linie'], operator:['operator','nume operator'],
    schimb:['schimb','schimbul','shift'], schimbul:['schimb','schimbul','shift'],
    status:['status','stare','stadiu'], stadiu:['stadiu','status','stare'],
    departament:['departament'], prioritate:['prioritate'], material:['material','calitate','calitate otel','calitate oțel'],
    matrita:['matrita','matriță','marcaj matrita','marcaj matriță','cod matrita','cod matriță'],
    codcat:['cod cat','codcat','cod cat dk','cod cat marc'], 'cod cat':['cod cat','codcat','cod cat dk','cod cat marc'],
    categorie:['categorie','categoria'], sursa:['sursa','sursă','source'], retentie:['retentie','retenție','retention'],
    atelier:['atelier'], sarja:['sarja','șarjă','cod sarja','cod șarjă'], parametru:['parametru','param'],
    transport:['transport','nr transp','nr transport'], lada:['lada','ladă'], buc:['buc','bucati','bucăți','cantitate','qty']
  };

  var ROW_KEY_CANDIDATES = {
    an:['an','anul','year'], luna:['luna','lună','month'], data:['data','date','zi'],
    reper:['reper','cod_reper','part','piesa'], dimensiune:['dimensiune','dimensiune_otel','diametru','diametru_otel','dimensiuneOtel'],
    diametru:['diametru','diametru_otel','dimensiune','dimensiune_otel'], calitate:['calitate','calitate_otel','calitateOtel','calitate otel'],
    utilaj:['utilaj','ciocan','linie','echipament','linie_forjare','linieForjare'], echipament:['utilaj','echipament','linie'],
    operator:['operator','nume_operator','numeOperator'], schimb:['schimb','schimbul','shift'], status:['status','stare','stadiu'],
    departament:['departament'], prioritate:['prioritate'], material:['material','calitate','calitate_otel'],
    matrita:['matrita','matriță','cod_matrita','cod_matriță','marcaj_matrita','marcajMatrita','matrita_superioara','matrita_inferioara'],
    codcat:['codcat','cod_cat','cod_cat_dk','cod_cat_marc','codCat','codCatDk','codCatMarc'], 'cod cat':['codcat','cod_cat','cod_cat_dk','cod_cat_marc','codCat','codCatDk','codCatMarc'],
    categorie:['categorie','categoria'], sursa:['sursa','source'], retentie:['retentie','retention'], atelier:['atelier'],
    sarja:['sarja','cod_sarja','codSarja'], parametru:['parametru','param'], transport:['nr_transport','nrTransport','transport','nr_transp'],
    lada:['lada','ladă'], buc:['buc','buc_realizate','bucRealizate','cantitate','qty','quantity']
  };

  function ready(fn){
    if (document.readyState === 'complete') return setTimeout(fn, 0);
    window.addEventListener('load', function(){ setTimeout(fn, 0); }, { once:true });
  }

  function idle(fn){
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout:1500 });
    else setTimeout(fn, 350);
  }

  function norm(v){ return String(v == null ? '' : v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
  function canon(v){ return norm(v).replace(/[()\[\]{}]/g,' ').replace(/[._\/\-:]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function cssEsc(v){ return (window.CSS && CSS.escape) ? CSS.escape(String(v)) : String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&'); }

  function unique(values){
    var out = [], seen = new Set();
    (values || []).forEach(function(v){
      var s = String(v == null ? '' : v).trim();
      if (!s) return;
      var k = norm(s);
      if (seen.has(k)) return;
      seen.add(k);
      out.push(s);
    });
    return out.sort(function(a,b){
      var na = Number(String(a).replace(/\s/g,'').replace(',', '.'));
      var nb = Number(String(b).replace(/\s/g,'').replace(',', '.'));
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
      return String(a).localeCompare(String(b),'ro',{ numeric:true, sensitivity:'base' });
    });
  }

  function addStyles(){
    if (document.getElementById('kad-filter-multiselect-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-filter-multiselect-style';
    style.textContent = [
      '.kad-ms-native{position:absolute!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}',
      '.kad-ms{position:relative;width:100%;min-width:0;display:block;}',
      '.kad-ms-trigger{width:100%;height:38px;border:2px solid #000;border-radius:10px;background:#fff;color:#0f172a;padding:0 34px 0 10px;font:inherit;font-size:14px;font-weight:700;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;position:relative;box-shadow:none;line-height:1;}',
      '.kad-ms-trigger:hover{background:#fff;} .kad-ms-trigger:focus{outline:none;border-color:#2563eb;}',
      '.kad-ms-trigger::after{content:"▾";position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#334155;pointer-events:none;}',
      'thead .kad-ms-trigger,#filterRow .kad-ms-trigger,.filter-row .kad-ms-trigger,.colFilters .kad-ms-trigger,.filters .kad-ms-trigger{height:28px;border:1px solid #95b5cd;border-radius:8px;padding:0 23px 0 7px;font-size:12px;font-weight:700;}',
      'thead .kad-ms-trigger::after,#filterRow .kad-ms-trigger::after,.filter-row .kad-ms-trigger::after,.colFilters .kad-ms-trigger::after{right:7px;font-size:11px;}',
      '.kad-ms-menu{position:fixed;z-index:2147483000;min-width:210px;max-width:min(540px,calc(100vw - 24px));max-height:min(410px,calc(100vh - 24px));overflow:hidden;background:#fff;border:2px solid #000;border-radius:10px;box-shadow:0 18px 42px rgba(0,0,0,.28);padding:6px;color:#0f172a;font-family:Arial,Helvetica,sans-serif;}',
      '.kad-ms-head{display:flex;align-items:center;gap:6px;padding:4px;border-bottom:1px solid #cbd5e1;margin-bottom:5px;}',
      '.kad-ms-search{flex:1;min-width:0;height:32px!important;border:1px solid #94a3b8!important;border-radius:8px!important;padding:0 8px!important;font-size:13px!important;outline:none!important;}',
      '.kad-ms-clear{border:1px solid #000!important;border-radius:8px!important;background:#e2e8f0!important;color:#0f172a!important;height:32px!important;padding:0 8px!important;font-size:12px!important;font-weight:700!important;cursor:pointer!important;white-space:nowrap!important;}',
      '.kad-ms-list{max-height:320px;overflow:auto;padding-right:2px;}',
      '.kad-ms-option{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:13px;cursor:pointer;user-select:none;line-height:1.2;text-align:left;}',
      '.kad-ms-option:hover{background:#eaf4ff;} .kad-ms-option input{width:auto!important;height:auto!important;margin:0!important;accent-color:#2b6cb0!important;}',
      '.kad-ms-note{padding:7px 8px;color:#475569;font-size:12px;font-weight:700;}',
      '.kad-ms-post-hidden{display:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function insideExcluded(el){ return !!(el && el.closest(EXCLUDE_ANCESTOR_SELECTOR)); }

  function isTableHeaderControl(el){
    if (!el) return false;
    if (el.closest('#filterRow, .colFilters, .filter-row, tr.filters')) return true;
    if (el.closest('thead')) {
      var cls = String(el.className || '');
      var ph = String(el.getAttribute('placeholder') || '');
      var id = String(el.id || el.name || '');
      var row = el.closest('tr');
      var rowText = row ? String(row.id + ' ' + row.className) : '';
      if (/thFilter|th-filter|filt|filter|colFInput|finput|fselect/i.test(cls + ' ' + id + ' ' + ph + ' ' + rowText)) return true;
      if (el.dataset && (el.dataset.col != null || el.dataset.key || el.dataset.field)) return true;
      if (/filtru|filter/i.test(ph)) return true;
    }
    return false;
  }

  function isFilterContainer(el){
    if (!el) return false;
    if (isTableHeaderControl(el)) return true;
    var c = el.closest(FILTER_CONTAINER_SELECTOR);
    if (!c) return false;
    var txt = norm((c.id || '') + ' ' + (c.className || '') + ' ' + (c.querySelector('.cardTitle,.sideTitle,.title') ? c.querySelector('.cardTitle,.sideTitle,.title').textContent : ''));
    if (/filtr|filter/.test(txt)) return true;
    if (c.matches && c.matches('.filters,.filtersBar,.filterBar,.filterbar,.filterPanel,.filter-panel,.filter-row,#filterRow,.colFilters,.alertControls,.sideControls')) return true;
    return false;
  }

  function getLabelText(el){
    var id = el.id || '';
    var label = '';
    if (id) {
      var lab = document.querySelector('label[for="' + cssEsc(id) + '"]');
      if (lab) label = lab.textContent || '';
    }
    if (!label) {
      var parent = el.closest('.field,.sideField,.fltGroup,.control,.filter-inline,th,td,.filter-group,.form-field');
      var parentLabel = parent ? parent.querySelector('label') : null;
      if (parentLabel) label = parentLabel.textContent || '';
    }
    if (!label && isTableHeaderControl(el)) label = getColumnHeaderText(el);
    if (!label) label = id || el.name || el.placeholder || '';
    return String(label).replace(/[:*]/g,' ').replace(/\s+/g,' ').trim();
  }

  function getColumnIndex(el){
    if (!el) return -1;
    if (el.dataset && el.dataset.col != null && /^\d+$/.test(String(el.dataset.col))) return Number(el.dataset.col);
    var cell = el.closest('th,td');
    if (!cell || !cell.parentNode) return -1;
    var children = Array.prototype.slice.call(cell.parentNode.children || []);
    return children.indexOf(cell);
  }

  function getColumnHeaderText(el){
    var idx = getColumnIndex(el);
    if (idx < 0) return '';
    var table = el.closest('table');
    if (!table) return '';
    var rows = Array.prototype.slice.call(table.querySelectorAll('thead tr'));
    for (var r = 0; r < rows.length; r++) {
      if (rows[r].contains(el)) continue;
      var cell = rows[r].children[idx];
      if (cell) {
        var clone = cell.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('input,select,button,.kad-ms,.filter'), function(n){ n.remove(); });
        var txt = String(clone.textContent || '').replace(/\s+/g,' ').trim();
        if (txt) return txt;
      }
    }
    return '';
  }

  function inferKey(el){
    if (!el) return '';
    if (el.dataset && (el.dataset.kadRowKey || el.dataset.kadFieldKey)) return el.dataset.kadRowKey || el.dataset.kadFieldKey;
    if (el.dataset && el.dataset.key) return String(el.dataset.key);
    try {
      if (typeof COLUMNS !== 'undefined' && Array.isArray(COLUMNS) && isTableHeaderControl(el)) {
        var idx0 = getColumnIndex(el);
        if (idx0 >= 0 && COLUMNS[idx0] && COLUMNS[idx0].key) return String(COLUMNS[idx0].key);
      }
    } catch(_e) {}
    try {
      if (typeof COLS !== 'undefined' && Array.isArray(COLS) && isTableHeaderControl(el)) {
        var idx1 = getColumnIndex(el);
        if (idx1 >= 0 && COLS[idx1] && COLS[idx1].key) return String(COLS[idx1].key);
      }
    } catch(_e) {}
    var raw = (getLabelText(el) + ' ' + (el.id || '') + ' ' + (el.name || '') + ' ' + (el.className || '') + ' ' + (el.placeholder || '')).trim();
    var c = canon(raw);
    if (/nr\s*transp|nr\s*transport|transport/.test(c)) return 'transport';
    if (/lada|lazi|lad/.test(c)) return 'lada';
    if (/\b(an|anul|year)\b/.test(c)) return 'an';
    if (/\b(luna|month)\b/.test(c)) return 'luna';
    if (/reper|part|piesa/.test(c)) return 'reper';
    if (/dimensiune|diametru/.test(c)) return 'dimensiune';
    if (/calitate/.test(c)) return 'calitate';
    if (/utilaj|linie|echipament|ciocan|masina/.test(c)) return 'utilaj';
    if (/operator/.test(c)) return 'operator';
    if (/schimb|shift/.test(c)) return 'schimb';
    if (/status|stadiu|stare/.test(c)) return 'status';
    if (/prioritate/.test(c)) return 'prioritate';
    if (/departament/.test(c)) return 'departament';
    if (/material/.test(c)) return 'material';
    if (/matrita|marcaj/.test(c)) return 'matrita';
    if (/cod\s*cat|codcat/.test(c)) return 'codcat';
    if (/categorie/.test(c)) return 'categorie';
    if (/sursa|source/.test(c)) return 'sursa';
    if (/retentie|retention/.test(c)) return 'retentie';
    if (/atelier/.test(c)) return 'atelier';
    if (/sarja/.test(c)) return 'sarja';
    if (/param/.test(c)) return 'parametru';
    if (/data|zi|day/.test(c)) return 'data';
    if (/buc|cantitate|qty/.test(c)) return 'buc';
    return c;
  }

  function isSelectCandidate(sel){
    if (!sel || sel.dataset.kadNoMulti === '1' || sel.dataset.kadMultiEnhanced === '1') return false;
    if (insideExcluded(sel)) return false;
    if (!sel.options || sel.options.length <= 1) return false;
    var id = sel.id || sel.name || '';
    if (EXCLUDE_ID_RE.test(id) && !FILTER_ID_RE.test(id)) return false;
    if (isTableHeaderControl(sel)) return true;
    var probe = id + ' ' + (sel.className || '') + ' ' + getLabelText(sel);
    if (FILTER_ID_RE.test(probe) && isFilterContainer(sel)) return true;
    if (/^(flt|filter|sel|f[A-Z]|sum|sarjaWarn)/.test(id) && isFilterContainer(sel)) return true;
    return false;
  }

  function isInputCandidate(inp){
    if (!inp || inp.dataset.kadNoMulti === '1' || inp.dataset.kadMultiEnhanced === '1') return false;
    var type = String(inp.type || 'text').toLowerCase();
    if (['hidden','button','submit','file','checkbox','radio','date','datetime-local','time','password','number'].indexOf(type) !== -1) return false;
    if (insideExcluded(inp)) return false;
    var id = inp.id || inp.name || '';
    if (EXCLUDE_ID_RE.test(id) && !isTableHeaderControl(inp)) return false;
    var cls = String(inp.className || '');
    var ph = String(inp.placeholder || '');
    var label = getLabelText(inp);
    var probe = id + ' ' + cls + ' ' + ph + ' ' + label;
    if (isTableHeaderControl(inp)) return true;
    if (/filtru|filter/i.test(ph)) return true;
    if (/thFilter|th-filter|colFInput|filt|filter-input|filterInput/i.test(cls)) return true;
    if (FILTER_ID_RE.test(probe) && isFilterContainer(inp)) return true;
    return false;
  }

  function getValues(control){
    try {
      var p = JSON.parse(control.dataset.kadMultiValues || '[]');
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch(_e) {}
    return [];
  }

  function setNativeValue(control, values){
    var vals = values || [];
    if (control.tagName === 'SELECT') {
      var single = vals.length === 1 ? vals[0] : '';
      try { control.value = single; } catch(_e) {}
      Array.prototype.forEach.call(control.options || [], function(opt){ opt.selected = !!single && opt.value === single; });
    } else {
      control.value = vals.length === 1 ? vals[0] : '';
    }
  }

  function updateButton(control){
    var btn = control && control._kadMsButton;
    if (!btn) return;
    var vals = getValues(control);
    var txt = !vals.length ? 'Toate' : (vals.length === 1 ? vals[0] : vals.length + ' selectate');
    btn.textContent = txt;
    btn.title = vals.length ? vals.join(', ') : 'Toate';
  }

  function fireNativeEvents(control){
    try { control.dispatchEvent(new Event('input', { bubbles:true })); } catch(_e) {}
    try { control.dispatchEvent(new Event('change', { bubbles:true })); } catch(_e) {}
  }

  function setValues(control, values, fire){
    var vals = unique(values || []);
    control.dataset.kadMultiValues = JSON.stringify(vals);
    setNativeValue(control, vals);
    updateButton(control);
    if (fire !== false) {
      fireNativeEvents(control);
      schedulePostFilter();
    }
  }

  function clearValues(control, fire){ setValues(control, [], fire); }

  function makeWrapper(control){
    if (!control || control.dataset.kadMultiEnhanced === '1') return;
    var wrapper = document.createElement('div');
    wrapper.className = 'kad-ms' + (isTableHeaderControl(control) ? ' kad-ms-table' : '');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kad-ms-trigger';
    btn.textContent = 'Toate';
    wrapper.appendChild(btn);
    try { control.insertAdjacentElement('afterend', wrapper); } catch(_e) { return; }
    control.classList.add('kad-ms-native');
    control.dataset.kadMultiEnhanced = '1';
    control._kadMsWrapper = wrapper;
    control._kadMsButton = btn;
    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); openMenu(control); });
    updateButton(control);
    enhanced.push(control);
  }

  function getGlobalRows(){
    var candidates = [];
    try { if (Array.isArray(window.rows)) candidates.push(window.rows); } catch(_e) {}
    try { if (typeof rows !== 'undefined' && Array.isArray(rows)) candidates.push(rows); } catch(_e) {}
    try { if (typeof STATE !== 'undefined' && STATE && Array.isArray(STATE.rows)) candidates.push(STATE.rows); } catch(_e) {}
    try { if (typeof state !== 'undefined' && state && Array.isArray(state.rows)) candidates.push(state.rows); } catch(_e) {}
    try { if (window.STATE && Array.isArray(window.STATE.rows)) candidates.push(window.STATE.rows); } catch(_e) {}
    try { if (window.state && Array.isArray(window.state.rows)) candidates.push(window.state.rows); } catch(_e) {}
    return candidates.find(function(a){ return a && a.length; }) || [];
  }

  function getNestedValue(row, key){
    if (!row || !key) return '';
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
    var ck = canon(key);
    var direct = Object.keys(row).find(function(k){ return canon(k) === ck; });
    if (direct) return row[direct];
    var cand = ROW_KEY_CANDIDATES[key] || ROW_KEY_CANDIDATES[ck] || [];
    for (var i=0;i<cand.length;i++) {
      if (Object.prototype.hasOwnProperty.call(row, cand[i])) return row[cand[i]];
      var found = Object.keys(row).find(function(k){ return canon(k) === canon(cand[i]); });
      if (found) return row[found];
    }
    return '';
  }

  function rowValueForControl(row, control){
    var key = inferKey(control);
    var v = getNestedValue(row, key);
    if ((v == null || v === '') && key === 'an') {
      var d = getNestedValue(row, 'data');
      var m = String(d || '').match(/(19|20)\d{2}/);
      if (m) v = m[0];
    }
    if ((v == null || v === '') && key === 'luna') {
      var d2 = getNestedValue(row, 'data');
      var m2 = String(d2 || '').match(/^(\d{4})-(\d{2})-/);
      if (m2) v = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'][Number(m2[2])-1] || '';
    }
    return v == null ? '' : String(v);
  }

  function optionValues(control){
    if (control.tagName === 'SELECT') {
      var arr = [];
      Array.prototype.forEach.call(control.options || [], function(opt){
        var val = String(opt.value == null ? '' : opt.value).trim();
        var txt = String(opt.textContent == null ? '' : opt.textContent).trim();
        if (!val && /^(toate|all|\(toate|\(toti|\(toți|alege)/i.test(norm(txt))) return;
        if (!val) return;
        arr.push({ value:val, text:txt || val });
      });
      return arr;
    }
    return collectInputOptions(control).map(function(v){ return { value:v, text:v }; });
  }

  function collectInputOptions(input){
    var rows = getGlobalRows();
    if (rows.length) {
      var vals = rows.map(function(r){ return rowValueForControl(r, input); }).filter(Boolean);
      if (vals.length) return unique(vals);
    }
    var dlId = input.getAttribute('list');
    if (dlId) {
      var dl = document.getElementById(dlId);
      if (dl) return unique(Array.prototype.map.call(dl.querySelectorAll('option'), function(o){ return o.value || o.textContent || ''; }));
    }
    return unique(collectDomColumnValues(input));
  }

  function relatedBodyTables(control){
    var table = control.closest('table');
    if (table) return [table];
    return Array.prototype.slice.call(document.querySelectorAll('table')).filter(function(t){ return !insideExcluded(t) && t.querySelector('tbody tr'); });
  }

  function collectDomColumnValues(control){
    var idx = getColumnIndex(control);
    if (idx < 0) return [];
    var vals = [];
    relatedBodyTables(control).forEach(function(table){
      var trs = table.querySelectorAll('tbody tr');
      var max = Math.min(trs.length, 3000);
      for (var i=0; i<max; i++) {
        var tr = trs[i];
        if (tr.classList.contains('kad-ms-post-hidden')) continue;
        var cell = tr.children[idx];
        if (cell) vals.push(String(cell.textContent || cell.value || '').trim());
      }
    });
    return vals;
  }

  function positionMenu(control, menu){
    var btn = control._kadMsButton;
    if (!btn || !menu) return;
    var rect = btn.getBoundingClientRect();
    var width = Math.max(rect.width, 230);
    width = Math.min(width, window.innerWidth - 16);
    menu.style.width = width + 'px';
    menu.style.left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8)) + 'px';
    var top = rect.bottom + 4;
    var h = Math.min(410, window.innerHeight - 24);
    if (top + h > window.innerHeight && rect.top > h) top = Math.max(8, rect.top - h - 4);
    menu.style.top = Math.max(8, top) + 'px';
  }

  function closeMenu(){
    if (activeMenu && activeMenu.parentNode) activeMenu.parentNode.removeChild(activeMenu);
    activeMenu = null;
    window.removeEventListener('scroll', closeMenu, true);
    window.removeEventListener('resize', closeMenu, true);
  }

  function openMenu(control){
    closeMenu();
    var opts = optionValues(control);
    var selected = new Set(getValues(control));
    var menu = document.createElement('div');
    menu.className = 'kad-ms-menu';
    menu.innerHTML = '<div class="kad-ms-head"><input class="kad-ms-search" type="text" placeholder="Caută..."><button class="kad-ms-clear" type="button">Toate</button></div><div class="kad-ms-list"></div>';
    document.body.appendChild(menu);
    activeMenu = menu;
    positionMenu(control, menu);
    var search = menu.querySelector('.kad-ms-search');
    var list = menu.querySelector('.kad-ms-list');
    var clearBtn = menu.querySelector('.kad-ms-clear');

    function renderList(){
      var q = norm(search.value || '');
      var filtered = q ? opts.filter(function(o){ return norm(o.text + ' ' + o.value).indexOf(q) !== -1; }) : opts.slice();
      var clipped = filtered.length > MAX_VISIBLE_OPTIONS;
      var visible = filtered.slice(0, MAX_VISIBLE_OPTIONS);
      if (!visible.length) { list.innerHTML = '<div class="kad-ms-note">Nu există valori.</div>'; return; }
      list.innerHTML = visible.map(function(o){
        var chk = selected.has(o.value) ? ' checked' : '';
        return '<label class="kad-ms-option"><input type="checkbox" value="' + esc(o.value) + '"' + chk + '><span>' + esc(o.text) + '</span></label>';
      }).join('') + (clipped ? '<div class="kad-ms-note">Sunt afișate primele ' + MAX_VISIBLE_OPTIONS + ' valori. Folosește căutarea.</div>' : '');
      Array.prototype.forEach.call(list.querySelectorAll('input[type="checkbox"]'), function(input){
        input.addEventListener('change', function(){
          if (input.checked) selected.add(input.value); else selected.delete(input.value);
          setValues(control, Array.from(selected), true);
        });
      });
    }

    search.addEventListener('input', renderList);
    clearBtn.addEventListener('click', function(){ selected.clear(); clearValues(control, true); renderList(); });
    menu.addEventListener('click', function(ev){ ev.stopPropagation(); });
    renderList();
    setTimeout(function(){ try { search.focus(); } catch(_e) {} }, 0);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu, true);
  }

  function valueMatches(cellText, values){
    var c = canon(cellText);
    return (values || []).some(function(v){
      var vv = canon(v);
      return !!vv && (c === vv || c.indexOf(vv) !== -1 || vv.indexOf(c) !== -1);
    });
  }

  function activeControls(){ return enhanced.filter(function(c){ return getValues(c).length > 0; }); }

  function clearPostHidden(){
    var hidden = document.querySelectorAll('.kad-ms-post-hidden');
    for (var i=0; i<hidden.length; i++) hidden[i].classList.remove('kad-ms-post-hidden');
  }

  function tableHeaderIndex(table, key){
    var candidates = (KEY_ALIASES[key] || [key]).map(canon).filter(Boolean);
    var headers = Array.prototype.slice.call(table.querySelectorAll('thead tr:first-child th, thead tr:first-child td'));
    if (!headers.length) headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var normalized = headers.map(function(th){ return canon(th.textContent || ''); });
    for (var i=0; i<normalized.length; i++) {
      var h = normalized[i]; if (!h) continue;
      for (var j=0; j<candidates.length; j++) {
        var c = candidates[j];
        if (h === c || h.indexOf(c) !== -1 || c.indexOf(h) !== -1) return i;
      }
    }
    return -1;
  }

  function controlColumnIndex(control, table){
    var ownTable = control.closest('table');
    if (ownTable && ownTable === table) {
      var idx = getColumnIndex(control);
      if (idx >= 0) return idx;
    }
    return tableHeaderIndex(table, inferKey(control));
  }

  function applyPostFilter(){
    var controls = activeControls();
    if (!controls.length) { clearPostHidden(); return; }
    clearPostHidden();
    var tables = Array.prototype.slice.call(document.querySelectorAll('table')).filter(function(t){ return !insideExcluded(t) && t.querySelector('tbody tr'); });
    tables.forEach(function(table){
      var relevant = controls.map(function(ctrl){ return { ctrl:ctrl, values:getValues(ctrl), index:controlColumnIndex(ctrl, table) }; }).filter(function(item){ return item.index >= 0 && item.values.length; });
      if (!relevant.length) return;
      var rows = table.querySelectorAll('tbody tr');
      for (var r=0; r<rows.length; r++) {
        var row = rows[r];
        var ok = relevant.every(function(item){
          var cell = row.children[item.index];
          return cell ? valueMatches(cell.textContent || '', item.values) : true;
        });
        row.classList.toggle('kad-ms-post-hidden', !ok);
      }
    });
  }

  function schedulePostFilter(){
    if (postTimer) clearTimeout(postTimer);
    postTimer = setTimeout(function(){ postTimer = 0; try { applyPostFilter(); } catch(_e) {} }, 80);
  }

  function enhanceExisting(){
    if (!document.body) return;
    addStyles();
    var selects = Array.prototype.slice.call(document.querySelectorAll('select'));
    var inputs = Array.prototype.slice.call(document.querySelectorAll('input'));
    selects.forEach(function(sel){ try { if (isSelectCandidate(sel)) makeWrapper(sel); } catch(_e) {} });
    inputs.forEach(function(inp){ try { if (isInputCandidate(inp)) makeWrapper(inp); } catch(_e) {} });
    schedulePostFilter();
    scanDone = true;
  }

  function clearAllEnhanced(){
    enhanced.forEach(function(c){ clearValues(c, false); });
    schedulePostFilter();
  }

  function bindResetButtons(){
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('button,input[type="button"]') : null;
      if (!btn) return;
      var txt = norm((btn.textContent || btn.value || '') + ' ' + (btn.id || ''));
      if (/reset|curata|curăță|clear/.test(txt) && /filtr|filter/.test(txt)) setTimeout(clearAllEnhanced, 0);
    }, true);
  }

  function refresh(){
    try { enhanceExisting(); } catch(_e) {}
  }

  function init(){
    bindResetButtons();
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape') closeMenu(); });
    idle(refresh);
    setTimeout(refresh, 1500);
    setTimeout(refresh, 4000);
  }

  window.KAD_MULTI_FILTER = {
    __installed:true,
    __version:VERSION,
    refresh:refresh,
    clearAll:clearAllEnhanced,
    values:function(controlOrId){ var c = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; return c ? getValues(c) : []; },
    hasMulti:function(controlOrId){ var c = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; return !!c && getValues(c).length > 1; },
    matches:function(controlOrId, value){ var c = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; if (!c) return true; var vals = getValues(c); return vals.length ? valueMatches(value, vals) : true; },
    rescan:refresh,
    scanDone:function(){ return scanDone; }
  };

  ready(init);
})();
