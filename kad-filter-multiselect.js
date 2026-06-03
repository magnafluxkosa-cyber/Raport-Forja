/* K.A.D - filtrare multiplă comună, lazy/safe. */
(function(){
  'use strict';
  if (window.KAD_MULTI_FILTER && window.KAD_MULTI_FILTER.__version === '2026-06-03-safe-lazy-v2') return;

  var VERSION = '2026-06-03-safe-lazy-v2';
  var enhanced = [];
  var activeMenu = null;
  var postFilterTimer = 0;
  var bodyObserver = null;
  var MAX_VISIBLE_OPTIONS = 700;

  var EXCLUDE_ANCESTOR_SELECTOR = [
    '.modal', '.modal-backdrop', '.modalBack', '.backdrop', '.dialog', '[role="dialog"]',
    '.form-grid', '.formGrid', '.modalBody', '.modal-body', '.modalContent', '.modal-content',
    '.pinModal', '.pin-modal', '.add-grid', '.edit-grid', '.operatorHeader', '.dailyOperatorGrid',
    '.excel-form-table', '.excel-control-table', '.intrariEditModal', '.hidden'
  ].join(',');

  var FILTER_CONTAINER_SELECTOR = [
    '.filters', '.filtersBar', '.summaryFiltersBar', '.filter-panel', '.filterPanel',
    '.filters-panel', '.filter-row', '.toolbar', '.toolbar-left', '.toolbar-card',
    '.controls', '.alertControls', '.analytics-filters', '.plan-filters',
    '.plan-intrari-toolbar', '.summary-toolbar', '.table-toolbar', '.filter-controls',
    '.filterbar', '.filterBar', '.pageFilters', '.kad-filters'
  ].join(',');

  var FILTER_ID_RE = /(filter|filt|flt|yearselect|monthselect|atelierselect|equipmentselect|statusselect|operatorfilter|reperfil|sarjafil|paramfilter|selan|selluna|selyear|selmonth|fyear|fmonth|fscale|fstatus|fshift|futilaj|fdiam|fcal|freper|filteryear|filtermonth|filterstatus|filtercategory|filtertype|filterretention|filtermaterial|filterutilaj|filterresponsabil|filterstadiu|filterprioritate|filterdepartament|yearfilter|monthfilter|dayfilter|reperfilter|sarjafilter|operatorfilter|partselect|colreper|colmatrita|colcodcat|coloperator|colshift)/i;
  var EXCLUDE_ID_RE = /^(txt|inp|fld|edit|add|m[A-Z]|r_|deb|tt|pin|docType|category|retention|source|statusField)/;

  var ALIASES = {
    an: ['an','anul','year'], anul: ['an','anul','year'], year: ['an','anul','year'],
    luna: ['luna','lună','month'], lună: ['luna','lună','month'], month: ['luna','lună','month'],
    reper: ['reper','piesa','piesă','produs','cod reper'],
    dimensiune: ['dimensiune','diametru','diametru otel','dimensiune otel'],
    calitate: ['calitate','calitate otel','calitate oțel'],
    utilaj: ['utilaj','linie','echipament','linie / utilaj','masina','mașina'],
    echipament: ['utilaj','echipament','linie'],
    operator: ['operator','nume operator'], schimb: ['schimb','schimbul'],
    status: ['status','stare','stadiu'], stadiu: ['stadiu','status','stare'],
    prioritate: ['prioritate','nivel de prioritate'], departament: ['departament'],
    material: ['material','calitate','calitate otel'], matrita: ['matrita','matriță','marcaj matrita','marcaj matriță'],
    'cod cat': ['cod cat','codcat'], codcat: ['cod cat','codcat'],
    categorie: ['categorie','categoria'], sursa: ['sursa','sursă','source'], retentie: ['retentie','retenție','retention'],
    atelier: ['atelier'], sarja: ['sarja','șarjă','cod sarja','cod șarjă'], parametru: ['parametru','param'],
    zi: ['zi','data','dată'], data: ['data','dată','zi']
  };

  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function norm(value){ return String(value == null ? '' : value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' '); }
  function canon(value){ return norm(value).replace(/[()\[\]{}]/g, ' ').replace(/[._\/\-:]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cssEscape(value){ return (window.CSS && typeof window.CSS.escape === 'function') ? window.CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function htmlEscape(value){ return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function addStyles(){
    if (document.getElementById('kad-filter-multiselect-style')) return;
    var style = document.createElement('style');
    style.id = 'kad-filter-multiselect-style';
    style.textContent = [
      '.kad-ms-native{display:none!important;}',
      '.kad-ms{position:relative;width:100%;min-width:0;}',
      '.kad-ms-trigger{width:100%;height:38px;border:2px solid #000;border-radius:10px;background:#fff;color:#0f172a;padding:0 34px 0 10px;font:inherit;font-size:14px;font-weight:400;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;position:relative;box-shadow:none;}',
      '.kad-ms-trigger:hover{background:#fff;}',
      '.kad-ms-trigger:focus{outline:none;border-color:#2563eb;}',
      '.kad-ms-trigger::after{content:"▾";position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:14px;color:#334155;pointer-events:none;}',
      '.kad-ms-menu{position:fixed;z-index:2147483000;min-width:210px;max-width:min(520px,calc(100vw - 24px));max-height:min(390px,calc(100vh - 24px));overflow:hidden;background:#fff;border:2px solid #000;border-radius:10px;box-shadow:0 18px 42px rgba(0,0,0,.28);padding:6px;color:#0f172a;font-family:Arial,Helvetica,sans-serif;}',
      '.kad-ms-head{display:flex;align-items:center;gap:6px;padding:4px;border-bottom:1px solid #cbd5e1;margin-bottom:5px;}',
      '.kad-ms-search{flex:1;min-width:0;height:32px;border:1px solid #94a3b8;border-radius:8px;padding:0 8px;font-size:13px;outline:none;}',
      '.kad-ms-clear{border:1px solid #000;border-radius:8px;background:#e2e8f0;color:#0f172a;height:32px;padding:0 8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;}',
      '.kad-ms-list{max-height:300px;overflow:auto;padding-right:2px;}',
      '.kad-ms-option{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:13px;cursor:pointer;user-select:none;line-height:1.2;}',
      '.kad-ms-option:hover{background:#eaf4ff;}',
      '.kad-ms-option input{width:auto!important;height:auto!important;margin:0;accent-color:#2b6cb0;}',
      '.kad-ms-note{padding:7px 8px;color:#475569;font-size:12px;font-weight:700;}',
      '.kad-ms-post-hidden{display:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getLabelText(select){
    var id = select.id || '';
    var label = '';
    if (id) {
      var lab = document.querySelector('label[for="' + cssEscape(id) + '"]');
      if (lab) label = lab.textContent || '';
    }
    if (!label) {
      var parent = select.closest('.field,.fltGroup,.control,.filter-inline,th,td');
      var parentLabel = parent ? parent.querySelector('label') : null;
      if (parentLabel) label = parentLabel.textContent || '';
    }
    if (!label) label = id || select.name || '';
    return String(label).replace(/[:*]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function inferKey(select){
    var c = canon((getLabelText(select) + ' ' + (select.id || select.name || '')).trim());
    if (/\b(an|anul|year)\b/.test(c)) return 'an';
    if (/\b(luna|month)\b/.test(c)) return 'luna';
    if (/reper|part/.test(c)) return 'reper';
    if (/dimensiune|diametru/.test(c)) return 'dimensiune';
    if (/calitate/.test(c)) return 'calitate';
    if (/utilaj|linie|echipament|masina/.test(c)) return 'utilaj';
    if (/operator/.test(c)) return 'operator';
    if (/schimb/.test(c)) return 'schimb';
    if (/status|stadiu|stare/.test(c)) return 'status';
    if (/prioritate/.test(c)) return 'prioritate';
    if (/departament/.test(c)) return 'departament';
    if (/material/.test(c)) return 'material';
    if (/matrita|marcaj/.test(c)) return 'matrita';
    if (/cod\s*cat|codcat/.test(c)) return 'cod cat';
    if (/categorie/.test(c)) return 'categorie';
    if (/sursa|source/.test(c)) return 'sursa';
    if (/retentie|retention/.test(c)) return 'retentie';
    if (/atelier/.test(c)) return 'atelier';
    if (/sarja/.test(c)) return 'sarja';
    if (/param/.test(c)) return 'parametru';
    if (/\bzi\b|\bday\b/.test(c)) return 'zi';
    return c;
  }

  function isCandidate(select){
    if (!select || select.dataset.kadNoMulti === '1' || select.dataset.kadMultiEnhanced === '1') return false;
    if (select.closest(EXCLUDE_ANCESTOR_SELECTOR)) return false;
    var id = select.id || select.name || '';
    if (EXCLUDE_ID_RE.test(id || '')) return false;
    if (select.options && select.options.length <= 1) return false;
    var container = select.closest(FILTER_CONTAINER_SELECTOR);
    var containerText = container ? ((container.id || '') + ' ' + (container.className || '')) : '';
    var probe = id + ' ' + (select.className || '') + ' ' + containerText + ' ' + getLabelText(select);
    if (FILTER_ID_RE.test(probe)) return true;
    if (container && /(filter|filtr|filters|toolbar|controls)/i.test(containerText)) return true;
    return false;
  }

  function optionValues(select){
    var arr = [];
    Array.prototype.forEach.call(select.options || [], function(opt){
      var value = String(opt.value == null ? '' : opt.value).trim();
      var text = String(opt.textContent == null ? '' : opt.textContent).trim();
      if (!value && /^(toate|all)$/i.test(norm(text))) return;
      if (!value) return;
      arr.push({ value:value, text:text || value });
    });
    return arr;
  }

  function getValues(select){
    try {
      var parsed = JSON.parse(select.dataset.kadMultiValues || '[]');
      if (Array.isArray(parsed)) return parsed.map(function(v){ return String(v); }).filter(Boolean);
    } catch (_) {}
    return [];
  }

  function setValues(select, values){
    var cleanValues = Array.from(new Set((values || []).map(function(v){ return String(v || '').trim(); }).filter(Boolean)));
    select.dataset.kadMultiValues = JSON.stringify(cleanValues);
    try { select.value = cleanValues.length === 1 ? cleanValues[0] : ''; } catch (_) {}
    updateButton(select);
  }
  function clearValues(select){ setValues(select, []); }
  function triggerPageFilter(select){
    try { select.dispatchEvent(new Event('input', { bubbles:true })); } catch (_) {}
    try { select.dispatchEvent(new Event('change', { bubbles:true })); } catch (_) {}
    schedulePostFilter();
  }
  function updateButton(select){
    var button = select._kadMsButton;
    if (!button) return;
    var values = getValues(select);
    var label = !values.length ? 'Toate' : (values.length === 1 ? values[0] : values.length + ' selectate');
    button.textContent = label;
    button.title = values.length ? values.join(', ') : 'Toate';
  }

  function makeWrapper(select){
    var wrapper = document.createElement('div');
    wrapper.className = 'kad-ms';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'kad-ms-trigger';
    button.textContent = 'Toate';
    wrapper.appendChild(button);
    select.insertAdjacentElement('afterend', wrapper);
    select.classList.add('kad-ms-native');
    select.dataset.kadMultiEnhanced = '1';
    select._kadMsWrapper = wrapper;
    select._kadMsButton = button;
    button.addEventListener('click', function(event){ event.preventDefault(); event.stopPropagation(); openMenu(select); });
    var mo = new MutationObserver(function(){
      var allowed = new Set(optionValues(select).map(function(x){ return x.value; }));
      var current = getValues(select);
      var keep = current.filter(function(v){ return allowed.has(v); });
      if (keep.length !== current.length) setValues(select, keep);
      updateButton(select);
    });
    try { mo.observe(select, { childList:true, subtree:false }); } catch (_) {}
    updateButton(select);
    enhanced.push(select);
  }

  function positionMenu(select, menu){
    var button = select._kadMsButton;
    if (!button || !menu) return;
    var rect = button.getBoundingClientRect();
    var width = Math.max(rect.width, 210);
    menu.style.width = width + 'px';
    menu.style.left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8)) + 'px';
    var top = rect.bottom + 4;
    var estimatedHeight = Math.min(390, window.innerHeight - 24);
    if (top + estimatedHeight > window.innerHeight && rect.top > estimatedHeight) top = Math.max(8, rect.top - estimatedHeight - 4);
    menu.style.top = Math.max(8, top) + 'px';
  }

  function closeMenu(){
    if (activeMenu && activeMenu.parentNode) activeMenu.parentNode.removeChild(activeMenu);
    activeMenu = null;
    window.removeEventListener('scroll', closeMenu, true);
    window.removeEventListener('resize', closeMenu, true);
  }

  function openMenu(select){
    closeMenu();
    var opts = optionValues(select);
    var selected = new Set(getValues(select));
    var menu = document.createElement('div');
    menu.className = 'kad-ms-menu';
    menu.innerHTML = '<div class="kad-ms-head"><input class="kad-ms-search" type="text" placeholder="Caută..."><button class="kad-ms-clear" type="button">Toate</button></div><div class="kad-ms-list"></div>';
    document.body.appendChild(menu);
    activeMenu = menu;
    positionMenu(select, menu);
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
          setValues(select, Array.from(selected));
          triggerPageFilter(select);
        });
      });
    }
    search.addEventListener('input', renderList);
    clearBtn.addEventListener('click', function(){ selected.clear(); clearValues(select); renderList(); triggerPageFilter(select); });
    menu.addEventListener('click', function(event){ event.stopPropagation(); });
    setTimeout(function(){ try { search.focus(); } catch (_) {} }, 0);
    renderList();
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu, true);
  }

  function getColumnCandidates(key){
    var base = ALIASES[key] ? ALIASES[key].slice() : [];
    if (key && base.indexOf(key) === -1) base.unshift(key);
    return base.map(canon).filter(Boolean);
  }
  function findHeaderIndex(table, key){
    var candidates = getColumnCandidates(key);
    if (!candidates.length) return -1;
    var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));
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
  function valueMatches(cellText, values){
    var c = canon(cellText);
    return values.some(function(v){
      var vv = canon(v);
      return !!vv && (c === vv || c.indexOf(vv) !== -1 || vv.indexOf(c) !== -1);
    });
  }
  function selectedMultiControls(){
    return enhanced.map(function(select){ return { select:select, values:getValues(select), key:inferKey(select) }; })
      .filter(function(item){ return item.values.length > 1; });
  }
  function clearPostHidden(){
    Array.prototype.forEach.call(document.querySelectorAll('.kad-ms-post-hidden'), function(el){ el.classList.remove('kad-ms-post-hidden'); });
  }
  function applyPostFilter(){
    var controls = selectedMultiControls();
    if (!controls.length) { clearPostHidden(); stopBodyObserver(); return; }
    var tables = Array.prototype.slice.call(document.querySelectorAll('table')).filter(function(table){
      return !table.closest(EXCLUDE_ANCESTOR_SELECTOR) && table.querySelector('tbody tr');
    });
    tables.forEach(function(table){
      var relevant = controls.map(function(ctrl){ return { key:ctrl.key, values:ctrl.values, index:findHeaderIndex(table, ctrl.key) }; }).filter(function(item){ return item.index >= 0; });
      if (!relevant.length) return;
      Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(row){
        var ok = relevant.every(function(item){
          var cell = row.children[item.index];
          return cell ? valueMatches(cell.textContent || '', item.values) : true;
        });
        row.classList.toggle('kad-ms-post-hidden', !ok);
      });
    });
    startBodyObserver();
  }
  function schedulePostFilter(){
    if (postFilterTimer) clearTimeout(postFilterTimer);
    postFilterTimer = setTimeout(function(){ postFilterTimer = 0; applyPostFilter(); }, 80);
  }
  function startBodyObserver(){
    if (bodyObserver) return;
    bodyObserver = new MutationObserver(function(mutations){
      for (var i=0;i<mutations.length;i++) if (mutations[i].type === 'childList') { schedulePostFilter(); break; }
    });
    try { bodyObserver.observe(document.body, { childList:true, subtree:true }); } catch (_) {}
  }
  function stopBodyObserver(){ if (bodyObserver) { try { bodyObserver.disconnect(); } catch (_) {} bodyObserver = null; } }

  function enhanceExisting(){
    addStyles();
    Array.prototype.slice.call(document.querySelectorAll('select')).forEach(function(select){ if (isCandidate(select)) makeWrapper(select); });
  }
  function init(){
    enhanceExisting();
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(event){ if (event.key === 'Escape') closeMenu(); });
    var scanTimer = 0;
    var scanObserver = new MutationObserver(function(mutations){
      var shouldScan = mutations.some(function(m){
        return Array.prototype.some.call(m.addedNodes || [], function(node){
          return node && node.nodeType === 1 && ((node.matches && node.matches('select')) || (node.querySelector && node.querySelector('select')));
        });
      });
      if (!shouldScan) return;
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(function(){ scanTimer = 0; enhanceExisting(); }, 250);
    });
    try { scanObserver.observe(document.body, { childList:true, subtree:true }); } catch (_) {}
  }

  window.KAD_MULTI_FILTER = {
    __installed: true,
    __version: VERSION,
    values: function(selectOrId){ var select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId; return select ? getValues(select) : []; },
    hasMulti: function(selectOrId){ var select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId; return !!select && getValues(select).length > 1; },
    matches: function(selectOrId, value){ var select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId; if (!select) return true; var values = getValues(select); return values.length ? valueMatches(value, values) : true; },
    refresh: function(){ enhanceExisting(); schedulePostFilter(); },
    clear: function(selectOrId){ var select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId; if (select) { clearValues(select); triggerPageFilter(select); } }
  };
  ready(init);
})();
