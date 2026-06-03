/* K.A.D - filtrare multiplă comună, model unic, lazy/safe. */
(function(){
  'use strict';
  if (window.KAD_MULTI_FILTER && /^2026-06-03-uniform/.test(String(window.KAD_MULTI_FILTER.__version || ''))) return;

  var VERSION = '2026-06-03-uniform-v4';
  var enhanced = [];
  var activeMenu = null;
  var postFilterTimer = 0;
  var scanTimer = 0;
  var patchTimer = 0;
  var MAX_VISIBLE_OPTIONS = 700;

  var EXCLUDE_ANCESTOR_SELECTOR = [
    '.modal', '.modal-backdrop', '.modalBack', '.backdrop', '.dialog', '[role="dialog"]',
    '.form-grid', '.formGrid', '.modalBody', '.modal-body', '.modalContent', '.modal-content',
    '.pinModal', '.pin-modal', '.add-grid', '.edit-grid', '.operatorHeader', '.dailyOperatorGrid',
    '.excel-form-table', '.excel-control-table', '.intrariEditModal', '.hidden',
    'form:not(.filters):not(.filtersBar):not(.filter-row):not(.filter-bar):not(.toolbar)'
  ].join(',');

  var FILTER_CONTAINER_SELECTOR = [
    '.filters', '.filtersBar', '.summaryFiltersBar', '.filter-panel', '.filterPanel',
    '.filters-panel', '.filter-row', '.toolbar', '.toolbar-left', '.toolbar-card',
    '.controls', '.alertControls', '.analytics-filters', '.plan-filters',
    '.plan-intrari-toolbar', '.summary-toolbar', '.table-toolbar', '.filter-controls',
    '.filterbar', '.filterBar', '.pageFilters', '.kad-filters', '.top-filters',
    '.search-controls', '.toolbar-filters', '.summary-toolbar-controls', 'thead tr.colFilters', 'thead tr.filter-row'
  ].join(',');

  var FILTER_ID_RE = /(filter|filt|flt|yearselect|monthselect|atelierselect|equipmentselect|statusselect|operatorfilter|reperfil|sarjafil|paramfilter|selan|selluna|selyear|selmonth|fyear|fmonth|fscale|fstatus|fshift|futilaj|fdiam|fcal|freper|filteryear|filtermonth|filterstatus|filtercategory|filtertype|filterretention|filtermaterial|filterutilaj|filterresponsabil|filterstadiu|filterprioritate|filterdepartament|yearfilter|monthfilter|dayfilter|reperfilter|sarjafilter|operatorfilter|partselect|colreper|colmatrita|colcodcat|coloperator|colshift|coltransport|collada|colbuc|coldata|col)/i;
  var EXCLUDE_ID_RE = /^(txt|inp|fld|edit|add|m[A-Z]|r_|deb|tt|pin|docType|category|retention|source|statusField)/;
  var SEARCH_ID_RE = /(search|cauta|căutare|quick|global)/i;

  var KEY_ALIASES = {
    an: ['an','anul','year'], anul: ['an','anul','year'], year: ['an','anul','year'],
    luna: ['luna','lună','month'], lună: ['luna','lună','month'], month: ['luna','lună','month'],
    reper: ['reper','piesa','piesă','produs','cod reper','part'],
    dimensiune: ['dimensiune','diametru','diametru otel','dimensiune otel','dimensiune oțel'],
    calitate: ['calitate','calitate otel','calitate oțel'],
    utilaj: ['utilaj','linie','echipament','ciocan','linie forjare','linie de forjare','masina','mașina'],
    echipament: ['utilaj','echipament','linie'],
    operator: ['operator','nume operator'],
    schimb: ['schimb','schimbul','shift'], schimbul: ['schimb','schimbul','shift'],
    status: ['status','stare','stadiu'], stadiu: ['stadiu','status','stare'],
    prioritate: ['prioritate','nivel de prioritate'], departament: ['departament'],
    material: ['material','calitate','calitate otel'],
    matrita: ['matrita','matriță','marcaj matrita','marcaj matriță','cod matrita','cod matriță'],
    codcat: ['cod cat','codcat','cod cat dk','cod cat marc'], 'cod cat': ['cod cat','codcat','cod cat dk','cod cat marc'],
    categorie: ['categorie','categoria'], sursa: ['sursa','sursă','source'], retentie: ['retentie','retenție','retention'],
    atelier: ['atelier'], sarja: ['sarja','șarjă','cod sarja','cod șarjă'], parametru: ['parametru','param'],
    zi: ['zi','data','dată'], data: ['data','dată','zi'], transport: ['transport','nr transp','nr transport'], lada: ['lada','ladă'], buc: ['buc','bucati','bucăți','cantitate']
  };

  var ROW_KEY_CANDIDATES = {
    an: ['an','anul','year'],
    luna: ['luna','lună','month'],
    reper: ['reper','cod_reper','part','piesa'],
    dimensiune: ['dimensiune','dimensiune_otel','diametru','diametru_otel','dimensiuneOtel'],
    calitate: ['calitate','calitate_otel','calitateOtel','calitate otel'],
    utilaj: ['utilaj','ciocan','linie','echipament','linie_forjare','linieForjare'],
    operator: ['operator','nume_operator','numeOperator'],
    schimb: ['schimb','schimbul','shift'],
    status: ['status','stare','stadiu'],
    departament: ['departament'],
    prioritate: ['prioritate'],
    material: ['material','calitate','calitate_otel'],
    matrita: ['matrita','matriță','cod_matrita','cod_matriță','marcaj_matrita','marcajMatrita','matrita_superioara','matrita_inferioara'],
    codcat: ['codcat','cod_cat','cod_cat_dk','cod_cat_marc','codCat','codCatDk','codCatMarc'],
    'cod cat': ['codcat','cod_cat','cod_cat_dk','cod_cat_marc','codCat','codCatDk','codCatMarc'],
    categorie: ['categorie','categoria'],
    sursa: ['sursa','source'],
    retentie: ['retentie','retention'],
    atelier: ['atelier'],
    sarja: ['sarja','cod_sarja','codSarja'],
    parametru: ['parametru','param'],
    data: ['data','date'],
    zi: ['data','zi','date'],
    transport: ['nr_transport','nrTransport','transport','nr_transp'],
    lada: ['lada','ladă'],
    buc: ['buc','buc_realizate','bucRealizate','cantitate','qty','quantity']
  };

  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function norm(value){ return String(value == null ? '' : value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' '); }
  function canon(value){ return norm(value).replace(/[()\[\]{}]/g, ' ').replace(/[._\/\-:]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function htmlEscape(value){ return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function cssEscape(value){ return (window.CSS && typeof window.CSS.escape === 'function') ? window.CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function unique(values){
    var out = [];
    var seen = new Set();
    (values || []).forEach(function(v){
      var s = String(v == null ? '' : v).trim();
      if (!s) return;
      var k = norm(s);
      if (seen.has(k)) return;
      seen.add(k); out.push(s);
    });
    return out.sort(function(a,b){
      var na = Number(String(a).replace(/\s/g,'').replace(',', '.'));
      var nb = Number(String(b).replace(/\s/g,'').replace(',', '.'));
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
      return String(a).localeCompare(String(b), 'ro', { numeric:true, sensitivity:'base' });
    });
  }

  function addStyles(){
    if (document.getElementById('kad-filter-multiselect-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-filter-multiselect-style';
    style.textContent = [
      '.kad-ms-native{position:absolute!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}',
      '.kad-ms{position:relative;width:100%;min-width:0;}',
      '.kad-ms-trigger{width:100%;height:38px;border:2px solid #000;border-radius:10px;background:#fff;color:#0f172a;padding:0 34px 0 10px;font:inherit;font-size:14px;font-weight:700;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;position:relative;box-shadow:none;line-height:1;}',
      '.kad-ms-trigger:hover{background:#fff;} .kad-ms-trigger:focus{outline:none;border-color:#2563eb;}',
      '.kad-ms-trigger::after{content:"▾";position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:14px;color:#334155;pointer-events:none;}',
      'thead .kad-ms-trigger,.filter-row .kad-ms-trigger,.colFilters .kad-ms-trigger{height:28px;border:1px solid #95b5cd;border-radius:8px;padding:0 24px 0 7px;font-size:12px;font-weight:700;}',
      'thead .kad-ms-trigger::after,.filter-row .kad-ms-trigger::after,.colFilters .kad-ms-trigger::after{right:7px;font-size:11px;}',
      '.kad-ms-menu{position:fixed;z-index:2147483000;min-width:210px;max-width:min(540px,calc(100vw - 24px));max-height:min(410px,calc(100vh - 24px));overflow:hidden;background:#fff;border:2px solid #000;border-radius:10px;box-shadow:0 18px 42px rgba(0,0,0,.28);padding:6px;color:#0f172a;font-family:Arial,Helvetica,sans-serif;}',
      '.kad-ms-head{display:flex;align-items:center;gap:6px;padding:4px;border-bottom:1px solid #cbd5e1;margin-bottom:5px;}',
      '.kad-ms-search{flex:1;min-width:0;height:32px;border:1px solid #94a3b8;border-radius:8px;padding:0 8px;font-size:13px;outline:none;}',
      '.kad-ms-clear{border:1px solid #000;border-radius:8px;background:#e2e8f0;color:#0f172a;height:32px;padding:0 8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;}',
      '.kad-ms-list{max-height:320px;overflow:auto;padding-right:2px;}',
      '.kad-ms-option{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:13px;cursor:pointer;user-select:none;line-height:1.2;text-align:left;}',
      '.kad-ms-option:hover{background:#eaf4ff;} .kad-ms-option input{width:auto!important;height:auto!important;margin:0;accent-color:#2b6cb0;}',
      '.kad-ms-note{padding:7px 8px;color:#475569;font-size:12px;font-weight:700;}',
      '.kad-ms-post-hidden{display:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getLabelText(el){
    var id = el.id || '';
    var label = '';
    if (id) {
      var lab = document.querySelector('label[for="' + cssEscape(id) + '"]');
      if (lab) label = lab.textContent || '';
    }
    if (!label) {
      var parent = el.closest('.field,.fltGroup,.control,.filter-inline,th,td,.filter-group,.form-field');
      var parentLabel = parent ? parent.querySelector('label') : null;
      if (parentLabel) label = parentLabel.textContent || '';
    }
    if (!label && isTableHeaderFilter(el)) label = getColumnHeaderText(el);
    if (!label) label = id || el.name || el.placeholder || '';
    return String(label).replace(/[:*]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function isTableHeaderFilter(el){ return !!(el && el.closest('thead tr.filter-row, thead tr.colFilters, thead .filter-row, thead .colFilters')) || /(^|\s)(th-filter|th-filter-select|colFInput)(\s|$)/.test(el.className || ''); }

  function getColumnIndex(el){
    var cell = el.closest('th,td');
    if (!cell || !cell.parentNode) return -1;
    return Array.prototype.indexOf.call(cell.parentNode.children, cell);
  }

  function getColumnHeaderText(el){
    var idx = getColumnIndex(el);
    if (idx < 0) return '';
    var table = el.closest('table');
    if (!table) return '';
    var rows = Array.prototype.slice.call(table.querySelectorAll('thead tr'));
    for (var r = rows.length - 1; r >= 0; r--) {
      if (rows[r].contains(el)) continue;
      var cell = rows[r].children[idx];
      if (cell) {
        var txt = String(cell.textContent || '').replace(/\s*▾\s*/g,' ').replace(/\s+/g,' ').trim();
        if (txt) return txt;
      }
    }
    return '';
  }

  function inferKey(el){
    var stored = el.dataset && (el.dataset.kadRowKey || el.dataset.kadFieldKey);
    if (stored) return stored;
    if (isTableHeaderFilter(el)) {
      var colKey = inferKeyFromCOLS(el);
      if (colKey) { el.dataset.kadRowKey = colKey; return colKey; }
    }
    var raw = (getLabelText(el) + ' ' + (el.id || '') + ' ' + (el.name || '') + ' ' + (el.className || '')).trim();
    var c = canon(raw);
    if (/nr\s*transp|nr\s*transport|transport/.test(c) || /coltransport/i.test(el.id || '')) return 'transport';
    if (/lada|lazi|lad/.test(c) || /collada/i.test(el.id || '')) return 'lada';
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
    if (/buc|cantitate|qty/.test(c) || /colbuc/i.test(el.id || '')) return 'buc';
    return c;
  }

  function inferKeyFromCOLS(el){
    try {
      if (typeof COLS !== 'undefined' && Array.isArray(COLS)) {
        var idx = getColumnIndex(el);
        if (idx >= 0 && COLS[idx] && COLS[idx].key) return String(COLS[idx].key);
      }
    } catch (_) {}
    return '';
  }

  function isSelectCandidate(select){
    if (!select || select.dataset.kadNoMulti === '1' || select.dataset.kadMultiEnhanced === '1') return false;
    if (select.closest(EXCLUDE_ANCESTOR_SELECTOR)) return false;
    var id = select.id || select.name || '';
    if (EXCLUDE_ID_RE.test(id || '')) return false;
    if (select.options && select.options.length <= 1) return false;
    if (isTableHeaderFilter(select)) return true;
    var container = select.closest(FILTER_CONTAINER_SELECTOR);
    var containerText = container ? ((container.id || '') + ' ' + (container.className || '')) : '';
    var probe = id + ' ' + (select.className || '') + ' ' + containerText + ' ' + getLabelText(select);
    if (FILTER_ID_RE.test(probe)) return true;
    if (container && /(filter|filtr|filters|toolbar|controls)/i.test(containerText)) return true;
    return false;
  }

  function isInputCandidate(input){
    if (!input || input.dataset.kadNoMulti === '1' || input.dataset.kadMultiEnhanced === '1') return false;
    var type = String(input.type || 'text').toLowerCase();
    if (!['text','search','number','tel'].includes(type)) return false;
    if (input.closest(EXCLUDE_ANCESTOR_SELECTOR)) return false;
    var id = input.id || input.name || '';
    var cls = input.className || '';
    var ph = input.placeholder || '';
    var label = getLabelText(input);
    var probe = id + ' ' + cls + ' ' + ph + ' ' + label;
    if (SEARCH_ID_RE.test(probe) && !/filtru|filter|^col/i.test(id)) return false;
    if (isTableHeaderFilter(input)) return true;
    if (/filtru|filter/i.test(ph)) return true;
    if (/(^|\s)(th-filter|colFInput|filter-input|filterInput)(\s|$)/.test(cls)) return true;
    if (FILTER_ID_RE.test(probe) && input.closest(FILTER_CONTAINER_SELECTOR)) return true;
    return false;
  }

  function optionValues(control){
    if (control.tagName === 'SELECT') {
      var arr = [];
      Array.prototype.forEach.call(control.options || [], function(opt){
        var value = String(opt.value == null ? '' : opt.value).trim();
        var text = String(opt.textContent == null ? '' : opt.textContent).trim();
        if (!value && /^(toate|all|\(toate|\(toti|\(toți)/i.test(norm(text))) return;
        if (!value) return;
        arr.push({ value:value, text:text || value });
      });
      return arr;
    }
    return collectInputOptions(control).map(function(v){ return { value:v, text:v }; });
  }

  function getGlobalRows(){
    var sets = [];
    try { if (typeof STATE !== 'undefined' && STATE && Array.isArray(STATE.rows)) sets.push(STATE.rows); } catch (_) {}
    try { if (typeof state !== 'undefined' && state && Array.isArray(state.rows)) sets.push(state.rows); } catch (_) {}
    try { if (window.STATE && Array.isArray(window.STATE.rows)) sets.push(window.STATE.rows); } catch (_) {}
    try { if (window.state && Array.isArray(window.state.rows)) sets.push(window.state.rows); } catch (_) {}
    return sets.find(function(x){ return x && x.length; }) || [];
  }

  function getNestedValue(row, key){
    if (!row || !key) return '';
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
    var canonicalKey = canon(key);
    var direct = Object.keys(row).find(function(k){ return canon(k) === canonicalKey; });
    if (direct) return row[direct];
    var candidates = ROW_KEY_CANDIDATES[key] || ROW_KEY_CANDIDATES[canonicalKey] || [];
    for (var i = 0; i < candidates.length; i++) {
      var cand = candidates[i];
      if (Object.prototype.hasOwnProperty.call(row, cand)) return row[cand];
      var found = Object.keys(row).find(function(k){ return canon(k) === canon(cand); });
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
    return v == null ? '' : String(v);
  }

  function collectInputOptions(input){
    var rows = getGlobalRows();
    if (rows.length) {
      var vals = rows.map(function(row){ return rowValueForControl(row, input); }).filter(Boolean);
      if (vals.length) return unique(vals);
    }
    return unique(collectDomColumnValues(input));
  }

  function relatedBodyTables(control){
    var table = control.closest('table');
    if (!table) return Array.prototype.slice.call(document.querySelectorAll('table')).filter(function(t){ return !t.closest(EXCLUDE_ANCESTOR_SELECTOR); });
    var id = table.id || '';
    if (/head/i.test(id)) {
      var bodyId = id.replace(/head/i, 'Body');
      var bodyTable = document.getElementById(bodyId);
      if (bodyTable) return [bodyTable];
      var sibling = table.parentElement && table.parentElement.parentElement ? table.parentElement.parentElement.querySelector('table[id*="Body"], table[id*="body"]') : null;
      if (sibling) return [sibling];
    }
    return [table];
  }

  function collectDomColumnValues(control){
    var idx = getColumnIndex(control);
    if (idx < 0) return [];
    var vals = [];
    relatedBodyTables(control).forEach(function(table){
      Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(tr){
        if (tr.classList.contains('kad-ms-post-hidden')) return;
        var cell = tr.children[idx];
        if (cell) vals.push(String(cell.textContent || '').trim());
      });
    });
    return vals;
  }

  function getValues(control){
    try {
      var parsed = JSON.parse(control.dataset.kadMultiValues || '[]');
      if (Array.isArray(parsed)) return parsed.map(function(v){ return String(v); }).filter(Boolean);
    } catch (_) {}
    return [];
  }

  function setNativeValue(control, values){
    var vals = values || [];
    if (control.tagName === 'SELECT') {
      if (vals.length === 1) {
        try { control.value = vals[0]; } catch (_) {}
      } else {
        try { control.value = ''; } catch (_) {}
      }
      Array.prototype.forEach.call(control.options || [], function(opt){ opt.selected = vals.length === 1 && opt.value === vals[0]; });
    } else {
      control.value = vals.length === 1 ? vals[0] : '';
    }
  }

  function setValues(control, values, fireEvents){
    var cleanValues = unique(values || []);
    control.dataset.kadMultiValues = JSON.stringify(cleanValues);
    setNativeValue(control, cleanValues);
    updateButton(control);
    if (fireEvents !== false) triggerPageFilter(control);
  }

  function clearValues(control, fireEvents){ setValues(control, [], fireEvents); }

  function triggerPageFilter(control){
    try { control.dispatchEvent(new Event('input', { bubbles:true })); } catch (_) {}
    try { control.dispatchEvent(new Event('change', { bubbles:true })); } catch (_) {}
    schedulePatchFilter();
    schedulePostFilter();
  }

  function updateButton(control){
    var button = control._kadMsButton;
    if (!button) return;
    var values = getValues(control);
    var label = !values.length ? 'Toate' : (values.length === 1 ? values[0] : values.length + ' selectate');
    button.textContent = label;
    button.title = values.length ? values.join(', ') : 'Toate';
  }

  function makeWrapper(control){
    if (!control || control.dataset.kadMultiEnhanced === '1') return;
    var wrapper = document.createElement('div');
    wrapper.className = 'kad-ms' + (isTableHeaderFilter(control) ? ' kad-ms-table' : '');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'kad-ms-trigger';
    button.textContent = 'Toate';
    wrapper.appendChild(button);
    control.insertAdjacentElement('afterend', wrapper);
    control.classList.add('kad-ms-native');
    control.dataset.kadMultiEnhanced = '1';
    control._kadMsWrapper = wrapper;
    control._kadMsButton = button;
    button.addEventListener('click', function(event){ event.preventDefault(); event.stopPropagation(); openMenu(control); });
    if (control.tagName === 'SELECT') {
      var mo = new MutationObserver(function(){
        var allowed = new Set(optionValues(control).map(function(x){ return x.value; }));
        var current = getValues(control);
        var keep = current.filter(function(v){ return allowed.has(v); });
        if (keep.length !== current.length) setValues(control, keep, false);
        updateButton(control);
      });
      try { mo.observe(control, { childList:true, subtree:false }); } catch (_) {}
    }
    updateButton(control);
    enhanced.push(control);
  }

  function positionMenu(control, menu){
    var button = control._kadMsButton;
    if (!button || !menu) return;
    var rect = button.getBoundingClientRect();
    var width = Math.max(rect.width, 230);
    width = Math.min(width, window.innerWidth - 16);
    menu.style.width = width + 'px';
    menu.style.left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8)) + 'px';
    var top = rect.bottom + 4;
    var estimatedHeight = Math.min(410, window.innerHeight - 24);
    if (top + estimatedHeight > window.innerHeight && rect.top > estimatedHeight) top = Math.max(8, rect.top - estimatedHeight - 4);
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
      var filtered = q ? opts.filter(function(opt){ return norm(opt.text + ' ' + opt.value).indexOf(q) !== -1; }) : opts.slice();
      var clipped = filtered.length > MAX_VISIBLE_OPTIONS;
      var visible = filtered.slice(0, MAX_VISIBLE_OPTIONS);
      if (!visible.length) { list.innerHTML = '<div class="kad-ms-note">Nu există valori.</div>'; return; }
      list.innerHTML = visible.map(function(opt){
        var checked = selected.has(opt.value) ? ' checked' : '';
        return '<label class="kad-ms-option"><input type="checkbox" value="' + htmlEscape(opt.value) + '"' + checked + '><span>' + htmlEscape(opt.text) + '</span></label>';
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
    menu.addEventListener('click', function(event){ event.stopPropagation(); });
    setTimeout(function(){ try { search.focus(); } catch (_) {} }, 0);
    renderList();
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

  function activeMultiControls(){ return enhanced.filter(function(control){ return getValues(control).length > 1; }); }

  function clearPostHidden(){ Array.prototype.forEach.call(document.querySelectorAll('.kad-ms-post-hidden'), function(el){ el.classList.remove('kad-ms-post-hidden'); }); }

  function tableHeaderIndex(table, key){
    var candidates = (KEY_ALIASES[key] || [key]).map(canon).filter(Boolean);
    if (!candidates.length) return -1;
    var headers = Array.prototype.slice.call(table.querySelectorAll('thead tr:first-child th, thead tr:first-child td'));
    if (!headers.length) headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    if (!headers.length) {
      var first = table.querySelector('tr');
      if (first) headers = Array.prototype.slice.call(first.children || []);
    }
    var normalized = headers.map(function(th){ return canon(th.textContent || ''); });
    for (var i=0;i<normalized.length;i++) {
      var h = normalized[i];
      if (!h) continue;
      for (var j=0;j<candidates.length;j++) {
        var c = candidates[j];
        if (h === c || h.indexOf(c) !== -1 || c.indexOf(h) !== -1) return i;
      }
    }
    return -1;
  }

  function controlColumnIndex(control, table){
    var idx = getColumnIndex(control);
    if (idx >= 0 && control.closest('table')) return idx;
    return tableHeaderIndex(table, inferKey(control));
  }

  function applyPostFilter(){
    var controls = activeMultiControls();
    if (!controls.length) { clearPostHidden(); return; }
    clearPostHidden();
    var tables = Array.prototype.slice.call(document.querySelectorAll('table')).filter(function(table){ return !table.closest(EXCLUDE_ANCESTOR_SELECTOR) && table.querySelector('tbody tr'); });
    tables.forEach(function(table){
      var relevant = controls.map(function(ctrl){ return { ctrl:ctrl, values:getValues(ctrl), index:controlColumnIndex(ctrl, table) }; }).filter(function(item){ return item.index >= 0; });
      if (!relevant.length) return;
      Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(row){
        var ok = relevant.every(function(item){
          var cell = row.children[item.index];
          return cell ? valueMatches(cell.textContent || '', item.values) : true;
        });
        row.classList.toggle('kad-ms-post-hidden', !ok);
      });
    });
  }

  function schedulePostFilter(){
    if (postFilterTimer) clearTimeout(postFilterTimer);
    postFilterTimer = setTimeout(function(){ postFilterTimer = 0; applyPostFilter(); }, 120);
  }

  function filterRowsByMulti(rows){
    if (!Array.isArray(rows)) return rows;
    var controls = activeMultiControls();
    if (!controls.length) return rows;
    return rows.filter(function(row){
      return controls.every(function(control){ return valueMatches(rowValueForControl(row, control), getValues(control)); });
    });
  }

  function patchGlobalFilterFunction(name){
    try {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__kadMsPatched) return false;
      var wrapped = function(){ return filterRowsByMulti(fn.apply(this, arguments)); };
      wrapped.__kadMsPatched = true;
      wrapped.__kadMsOriginal = fn;
      window[name] = wrapped;
      try { eval(name + ' = window["' + name + '"];'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function patchFilterFunctions(){
    patchGlobalFilterFunction('getFilteredRows');
    patchGlobalFilterFunction('filteredRows');
    patchGlobalFilterFunction('getSummaryFilteredRows');
  }

  function schedulePatchFilter(){
    if (patchTimer) clearTimeout(patchTimer);
    patchTimer = setTimeout(function(){ patchTimer = 0; patchFilterFunctions(); }, 50);
  }

  function enhanceExisting(){
    addStyles();
    Array.prototype.slice.call(document.querySelectorAll('select')).forEach(function(select){ if (isSelectCandidate(select)) makeWrapper(select); });
    Array.prototype.slice.call(document.querySelectorAll('input')).forEach(function(input){ if (isInputCandidate(input)) makeWrapper(input); });
    patchFilterFunctions();
  }

  function scheduleScan(){
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(function(){ scanTimer = 0; enhanceExisting(); }, 180);
  }

  function clearAllEnhanced(){
    enhanced.forEach(function(control){ clearValues(control, false); });
    schedulePostFilter();
  }

  function bindResetButtons(){
    document.addEventListener('click', function(event){
      var btn = event.target && event.target.closest ? event.target.closest('button,input[type="button"]') : null;
      if (!btn) return;
      var txt = norm((btn.textContent || btn.value || '') + ' ' + (btn.id || ''));
      if (/reset|curata|curăță|clear/.test(txt) && /filtr|filter/.test(txt)) {
        setTimeout(function(){ clearAllEnhanced(); }, 0);
      }
    }, true);
  }

  function init(){
    enhanceExisting();
    bindResetButtons();
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(event){ if (event.key === 'Escape') closeMenu(); });
    var scanObserver = new MutationObserver(function(mutations){
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes || [];
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (!node || node.nodeType !== 1) continue;
          if ((node.matches && node.matches('select,input,option,thead,tr,th')) || (node.querySelector && node.querySelector('select,input,option,thead tr'))) { scheduleScan(); return; }
        }
      }
    });
    try { scanObserver.observe(document.body, { childList:true, subtree:true }); } catch (_) {}
  }

  window.KAD_MULTI_FILTER = {
    __installed: true,
    __version: VERSION,
    values: function(controlOrId){ var control = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; return control ? getValues(control) : []; },
    hasMulti: function(controlOrId){ var control = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; return !!control && getValues(control).length > 1; },
    matches: function(controlOrId, value){ var control = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; if (!control) return true; var values = getValues(control); return values.length ? valueMatches(value, values) : true; },
    rowMatches: function(row){ return filterRowsByMulti([row]).length === 1; },
    refresh: function(){ enhanceExisting(); schedulePostFilter(); },
    clear: function(controlOrId){ var control = typeof controlOrId === 'string' ? document.getElementById(controlOrId) : controlOrId; if (control) clearValues(control, true); },
    clearAll: clearAllEnhanced
  };

  ready(init);
})();
