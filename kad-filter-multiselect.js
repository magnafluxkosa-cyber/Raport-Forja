(function(){
  'use strict';
  if (window.KAD_MULTI_FILTER && window.KAD_MULTI_FILTER.__installed) return;

  const API = window.KAD_MULTI_FILTER = window.KAD_MULTI_FILTER || {};
  API.__installed = true;

  const STYLE_ID = 'kad-mf-style';
  const SELECT_ATTR = 'data-kad-mf-select';
  const WRAP_CLASS = 'kad-mf-wrap';
  const NATIVE_CLASS = 'kad-mf-native';
  const MENU_CLASS = 'kad-mf-menu';
  const ACTIVE_CLASS = 'kad-mf-active';
  const HIDDEN_ROW_ATTR = 'data-kad-mf-hidden';
  const PREV_DISPLAY_ATTR = 'data-kad-mf-prev-display';
  const allInstances = new Set();
  let openInstance = null;
  let applying = false;

  function addStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      select.${NATIVE_CLASS}{display:none !important;}
      .${WRAP_CLASS}{position:relative;width:100%;min-width:0;display:block;}
      .${WRAP_CLASS} .kad-mf-btn{
        width:100%;height:38px;border:2px solid #000;border-radius:10px;background:#fff;color:#0f172a;
        padding:0 34px 0 10px;font:inherit;font-size:14px;font-weight:700;text-align:left;white-space:nowrap;
        overflow:hidden;text-overflow:ellipsis;cursor:pointer;box-shadow:none;appearance:none;position:relative;
      }
      .${WRAP_CLASS} .kad-mf-btn:hover{background:#fff;}
      .${WRAP_CLASS} .kad-mf-btn:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.18);}
      .${WRAP_CLASS} .kad-mf-btn::after{content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#334155;pointer-events:none;}
      .${WRAP_CLASS}.${ACTIVE_CLASS} .kad-mf-btn::after{content:'▴';}
      .${MENU_CLASS}{
        position:fixed;z-index:2147483000;display:none;min-width:180px;max-width:min(520px,calc(100vw - 20px));max-height:min(340px,calc(100vh - 20px));
        overflow:auto;background:#fff;border:2px solid #000;border-radius:10px;box-shadow:0 14px 34px rgba(0,0,0,.28);padding:6px;color:#0f172a;
      }
      .${MENU_CLASS}.open{display:block;}
      .kad-mf-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 8px;margin-bottom:5px;border-bottom:1px solid #cbd5e1;font-size:12px;font-weight:800;color:#475569;position:sticky;top:-6px;background:#fff;z-index:1;}
      .kad-mf-clear{color:#1e5a96;cursor:pointer;white-space:nowrap;}
      .kad-mf-clear:hover{text-decoration:underline;}
      .kad-mf-option{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:13px;line-height:1.2;cursor:pointer;user-select:none;}
      .kad-mf-option:hover{background:#eaf4ff;}
      .kad-mf-option input{width:auto !important;height:auto !important;min-width:14px;margin:0;accent-color:#2b6cb0;}
      .kad-mf-option span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .kad-mf-empty{padding:8px;color:#475569;font-size:13px;}
      thead .${WRAP_CLASS} .kad-mf-btn,.filter-control + .${WRAP_CLASS} .kad-mf-btn{height:30px;font-size:12px;border-radius:6px;padding-left:6px;}
      @media(max-width:520px){.${MENU_CLASS}{left:10px !important;right:10px !important;width:auto !important;max-width:none;}}
    `;
    document.head.appendChild(style);
  }

  function clean(value){ return String(value ?? '').trim(); }
  function norm(value){ return clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
  function upper(value){ return clean(value).toUpperCase(); }
  function esc(value){ return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function splitValues(raw){
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);
    try { const parsed = JSON.parse(String(raw)); if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean); } catch(_e) {}
    return String(raw).split('|||').map(clean).filter(Boolean);
  }

  API.values = function(selectOrId){
    const select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId;
    if (!select) return [];
    const stored = splitValues(select.dataset.kadMfValues || '');
    if (stored.length) return stored;
    const val = clean(select.value);
    return val ? [val] : [];
  };

  API.hasMulti = function(selectOrId){ return API.values(selectOrId).length > 1; };

  API.matches = function(rowValue, selectOrId, options){
    const values = API.values(selectOrId);
    if (!values.length) return true;
    const mode = options && options.contains ? 'contains' : 'equals';
    const rowNorm = norm(rowValue);
    return values.some(v => {
      const vNorm = norm(v);
      return mode === 'contains' ? rowNorm.includes(vNorm) : rowNorm === vNorm;
    });
  };

  function closestLabel(select){
    if (select.id) {
      const label = document.querySelector(`label[for="${CSS.escape(select.id)}"]`);
      if (label) return clean(label.textContent);
    }
    const field = select.closest('.field,.filter-field,.defect-filter-field,.acl-filter-field,.filter-inline,.plan-intrari-field,th,td');
    if (field) {
      const label = field.querySelector('label');
      if (label) return clean(label.textContent);
      const txt = clean(field.textContent).replace(/\s+/g,' ');
      if (txt && txt.length <= 40) return txt;
    }
    return '';
  }

  function isFilterContainer(el){
    return !!(el && el.closest('.filters,.filter-row,tr.filters,.analytics-filters,.plan-filters,.defect-filters,.filter-inline,.filter-panel,.filter-toolbar,.acl-filter-field,.plan-intrari-field,[data-rf-control*="filter"],[data-filter-zone]'));
  }

  function isEligible(select){
    if (!select || select.dataset.kadNoMultifilter === '1' || select.dataset.kadMfDisabled === '1') return false;
    if (select.closest('.kad-mf-menu')) return false;
    if (select.classList.contains(NATIVE_CLASS)) return false;
    if (select.closest('#entryModal,.modal,.backdrop,dialog') && !isFilterContainer(select)) return false;
    const id = select.id || '';
    const name = select.name || '';
    const cls = Array.from(select.classList || []).join(' ');
    const label = closestLabel(select);
    const parentCls = select.parentElement ? Array.from(select.parentElement.classList || []).join(' ') : '';
    const context = norm([id,name,cls,label,parentCls].join(' '));
    if (isFilterContainer(select)) return true;
    if (/filter|filtru|filt|searchfilter|th-filter|defect-filter/.test(context)) return true;
    if (/^(fYear|fMonth|fLuna|fReper|fDiam|fCal|fCode)$/i.test(id)) return true;
    if (/^(yearFilter|monthFilter|dayFilter|reperFilter|sarjaFilter|paramFilter|operatorFilter)$/i.test(id)) return true;
    return false;
  }

  function optionValues(select){
    return Array.from(select.options || [])
      .map(opt => ({ value: clean(opt.value), text: clean(opt.textContent || opt.value) }))
      .filter(opt => opt.value && !/^\(?toate|toţi|toți|all\)?/i.test(norm(opt.value)) && !/^\(?toate|toţi|toți|all\)?/i.test(norm(opt.text)));
  }

  function currentValues(select){
    const stored = splitValues(select.dataset.kadMfValues || '');
    const available = new Set(optionValues(select).map(o => o.value));
    const kept = stored.filter(v => available.has(v));
    if (kept.length) return kept;
    const selected = Array.from(select.options || []).filter(o => o.selected && clean(o.value)).map(o => clean(o.value)).filter(v => available.has(v));
    if (selected.length) return selected;
    const val = clean(select.value);
    return val && available.has(val) ? [val] : [];
  }

  function setNativeValue(select, values, dispatch){
    select.dataset.kadMfValues = JSON.stringify(values || []);
    const nativeValue = values.length === 1 ? values[0] : '';
    if (select.value !== nativeValue) select.value = nativeValue;
    Array.from(select.options || []).forEach(opt => { opt.selected = clean(opt.value) === nativeValue; });
    if (dispatch) {
      const ev1 = new Event('input', { bubbles:true });
      const ev2 = new Event('change', { bubbles:true });
      select.dispatchEvent(ev1);
      select.dispatchEvent(ev2);
    }
  }

  function updateLabel(instance){
    const values = currentValues(instance.select);
    if (!values.length) {
      instance.button.textContent = 'Toate';
      instance.button.title = 'Toate';
    } else if (values.length === 1) {
      instance.button.textContent = values[0];
      instance.button.title = values[0];
    } else {
      instance.button.textContent = `${values.length} selectate`;
      instance.button.title = values.join(', ');
    }
  }

  function rebuildMenu(instance){
    const select = instance.select;
    const opts = optionValues(select);
    const values = currentValues(select).filter(v => opts.some(o => o.value === v));
    select.dataset.kadMfValues = JSON.stringify(values);
    if (!opts.length) {
      instance.menu.innerHTML = '<div class="kad-mf-empty">Nu există opțiuni.</div>';
      updateLabel(instance);
      return;
    }
    instance.menu.innerHTML = `
      <div class="kad-mf-actions"><span>Selectare multiplă</span><span class="kad-mf-clear" role="button" tabindex="0">Toate</span></div>
      ${opts.map(opt => `<label class="kad-mf-option" title="${esc(opt.text)}"><input type="checkbox" value="${esc(opt.value)}" ${values.includes(opt.value) ? 'checked' : ''}><span>${esc(opt.text)}</span></label>`).join('')}
    `;
    instance.menu.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        const selected = Array.from(instance.menu.querySelectorAll('input[type="checkbox"]:checked')).map(item => clean(item.value)).filter(Boolean);
        setNativeValue(select, selected, true);
        updateLabel(instance);
        setTimeout(applyDomFilters, 0);
        setTimeout(applyDomFilters, 80);
      });
    });
    const clear = () => {
      instance.menu.querySelectorAll('input[type="checkbox"]').forEach(item => { item.checked = false; });
      setNativeValue(select, [], true);
      updateLabel(instance);
      setTimeout(applyDomFilters, 0);
      setTimeout(applyDomFilters, 80);
    };
    const clearBtn = instance.menu.querySelector('.kad-mf-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', clear);
      clearBtn.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clear(); } });
    }
    updateLabel(instance);
  }

  function positionMenu(instance){
    const rect = instance.button.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(rect.width, 180);
    let left = rect.left;
    let top = rect.bottom + 4;
    instance.menu.style.width = width + 'px';
    instance.menu.style.left = left + 'px';
    instance.menu.style.top = top + 'px';
    instance.menu.classList.add('open');
    const mrect = instance.menu.getBoundingClientRect();
    if (mrect.right > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - mrect.width - margin);
    if (mrect.bottom > window.innerHeight - margin) top = Math.max(margin, rect.top - mrect.height - 4);
    instance.menu.style.left = left + 'px';
    instance.menu.style.top = top + 'px';
  }

  function closeOpen(){
    if (!openInstance) return;
    openInstance.menu.classList.remove('open');
    openInstance.wrap.classList.remove(ACTIVE_CLASS);
    openInstance = null;
  }

  function openMenu(instance){
    if (openInstance && openInstance !== instance) closeOpen();
    rebuildMenu(instance);
    openInstance = instance;
    instance.wrap.classList.add(ACTIVE_CLASS);
    positionMenu(instance);
  }

  function enhance(select){
    if (!isEligible(select)) return;
    addStyle();
    if (select.hasAttribute(SELECT_ATTR)) return;
    select.setAttribute(SELECT_ATTR, '1');
    select.classList.add(NATIVE_CLASS);
    select.setAttribute('aria-hidden','true');
    select.tabIndex = -1;

    const wrap = document.createElement('span');
    wrap.className = WRAP_CLASS;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kad-mf-btn';
    button.textContent = 'Toate';
    wrap.appendChild(button);
    select.insertAdjacentElement('afterend', wrap);

    const menu = document.createElement('div');
    menu.className = MENU_CLASS;
    document.body.appendChild(menu);

    const instance = { select, wrap, button, menu, observer:null };
    allInstances.add(instance);
    rebuildMenu(instance);

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (openInstance === instance) closeOpen(); else openMenu(instance);
    });
    menu.addEventListener('click', event => event.stopPropagation());
    select.addEventListener('change', () => {
      if (applying) return;
      setTimeout(() => { rebuildMenu(instance); applyDomFilters(); }, 0);
    });
    instance.observer = new MutationObserver(() => {
      const values = currentValues(select);
      select.dataset.kadMfValues = JSON.stringify(values);
      rebuildMenu(instance);
    });
    instance.observer.observe(select, { childList:true, subtree:true, attributes:true, attributeFilter:['value','selected'] });
  }

  function scan(root){
    (root || document).querySelectorAll('select').forEach(enhance);
  }

  function headerText(th){ return norm(th ? th.textContent : ''); }

  function hintsForSelect(select){
    const id = norm(select.id || '');
    const label = norm(closestLabel(select));
    const ctx = `${id} ${label}`;
    const hints = [];
    if (/year|an\b|anul/.test(ctx)) hints.push('an','anul','year','data');
    if (/month|luna|lună/.test(ctx)) hints.push('luna','lună','month','data');
    if (/day|zi|data/.test(ctx)) hints.push('data','zi');
    if (/reper|part/.test(ctx)) hints.push('reper','part','pies');
    if (/diam|dimensiune|dimens/.test(ctx)) hints.push('dimensiune','diametru','diam','ø');
    if (/calitate|cal/.test(ctx)) hints.push('calitate','otel','oțel');
    if (/utilaj|linie|echipament|masina|mașina/.test(ctx)) hints.push('utilaj','linie','echipament','mașina','masina');
    if (/operator/.test(ctx)) hints.push('operator');
    if (/schimb|shift/.test(ctx)) hints.push('schimb','shift');
    if (/status|stadiu/.test(ctx)) hints.push('status','stadiu');
    if (/departament|atelier/.test(ctx)) hints.push('departament','atelier');
    if (/responsabil/.test(ctx)) hints.push('responsabil');
    if (/prioritate/.test(ctx)) hints.push('prioritate');
    if (/material/.test(ctx)) hints.push('material');
    if (/cat|cod/.test(ctx)) hints.push('cod','cat');
    if (/categorie|category/.test(ctx)) hints.push('categorie','category');
    if (/tip|type/.test(ctx)) hints.push('tip','type');
    if (/firma|client|companie/.test(ctx)) hints.push('firma','client','companie');
    return Array.from(new Set(hints.filter(Boolean)));
  }

  function columnIndexForSelect(select, table){
    const th = select.closest('th');
    if (th && th.parentElement) return Array.from(th.parentElement.children).indexOf(th);
    const hints = hintsForSelect(select);
    if (!hints.length) return -1;
    const headerRows = Array.from(table.querySelectorAll('thead tr'));
    for (const tr of headerRows) {
      const cells = Array.from(tr.children);
      for (let i=0; i<cells.length; i++) {
        const h = headerText(cells[i]);
        if (!h) continue;
        if (hints.some(x => h === x || h.includes(x) || x.includes(h))) return i;
      }
    }
    return -1;
  }

  function tablesForSelect(select){
    const table = select.closest('table');
    if (table) return [table];
    const container = select.closest('.table-panel,.panel,.card,.section,.content,.page,.app,body') || document.body;
    let tables = Array.from(container.querySelectorAll('table')).filter(t => t.querySelector('tbody tr'));
    if (!tables.length) tables = Array.from(document.querySelectorAll('table')).filter(t => t.querySelector('tbody tr'));
    return tables.slice(0, 3);
  }

  function rowMatchesSelect(row, select, values){
    const table = row.closest('table');
    const idx = columnIndexForSelect(select, table);
    const valueNorms = values.map(norm).filter(Boolean);
    if (!valueNorms.length) return true;
    if (idx >= 0 && row.children[idx]) {
      const cell = norm(row.children[idx].textContent || '');
      return valueNorms.some(v => cell === v || cell.includes(v) || v.includes(cell));
    }
    const rowText = norm(row.textContent || '');
    return valueNorms.some(v => rowText.includes(v));
  }

  function restoreRows(){
    document.querySelectorAll(`tr[${HIDDEN_ROW_ATTR}="1"]`).forEach(row => {
      row.style.display = row.getAttribute(PREV_DISPLAY_ATTR) || '';
      row.removeAttribute(HIDDEN_ROW_ATTR);
      row.removeAttribute(PREV_DISPLAY_ATTR);
    });
  }

  function applyDomFilters(){
    if (applying) return;
    applying = true;
    try {
      restoreRows();
      const active = Array.from(allInstances)
        .map(instance => ({ instance, values: splitValues(instance.select.dataset.kadMfValues || '') }))
        .filter(x => x.values.length > 1 && document.body.contains(x.instance.select));
      if (!active.length) return;
      const rowMap = new Map();
      active.forEach(({ instance }) => {
        tablesForSelect(instance.select).forEach(table => {
          table.querySelectorAll('tbody tr').forEach(row => rowMap.set(row, true));
        });
      });
      Array.from(rowMap.keys()).forEach(row => {
        if (row.closest('.kad-mf-menu')) return;
        const visibleByMulti = active.every(({ instance, values }) => rowMatchesSelect(row, instance.select, values));
        if (!visibleByMulti) {
          row.setAttribute(PREV_DISPLAY_ATTR, row.style.display || '');
          row.setAttribute(HIDDEN_ROW_ATTR, '1');
          row.style.display = 'none';
        }
      });
      updateSimpleCounters();
    } finally {
      applying = false;
    }
  }

  function numberFromText(text){
    const s = String(text || '').replace(/\s/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',', '.').replace(/[^0-9.-]/g,'');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function formatInt(n){ return Math.round(n || 0).toLocaleString('ro-RO'); }

  function updateSimpleCounters(){
    const tbody = document.querySelector('#tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
    const totalRebut = document.getElementById('totalRebut');
    const totalFinal = document.getElementById('totalFinal');
    if (totalRebut) totalRebut.textContent = formatInt(rows.reduce((sum,row)=>sum+numberFromText(row.children[6]?.textContent),0));
    if (totalFinal) totalFinal.textContent = formatInt(rows.reduce((sum,row)=>sum+numberFromText(row.children[7]?.textContent),0));
  }

  document.addEventListener('click', closeOpen);
  window.addEventListener('resize', () => { if (openInstance) positionMenu(openInstance); });
  window.addEventListener('scroll', () => { if (openInstance) positionMenu(openInstance); }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeOpen(); });

  const boot = () => {
    scan(document);
    applyDomFilters();
    const observer = new MutationObserver(muts => {
      let shouldScan = false;
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) { shouldScan = true; break; }
      }
      if (shouldScan) {
        scan(document);
        setTimeout(applyDomFilters, 30);
      }
    });
    observer.observe(document.body, { childList:true, subtree:true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
