(function(){
  'use strict';

  const PAGE_KEY = 'pivot-comenzi';
  const DOC_KEYS = ['comenzi-piese','forecast-clienti','comenzi-clienti'];
  const MONTH_NAMES = {
    '01':'IANUARIE','02':'FEBRUARIE','03':'MARTIE','04':'APRILIE','05':'MAI','06':'IUNIE',
    '07':'IULIE','08':'AUGUST','09':'SEPTEMBRIE','10':'OCTOMBRIE','11':'NOIEMBRIE','12':'DECEMBRIE'
  };

  const state = {
    supabase: null,
    user: null,
    role: 'viewer',
    rows: [],
    filterClient: '',
    filterYear: '',
    filterMonth: '',
    filterSource: '',
    valueMode: 'pcs',
    search: '',
    onlyWithValues: true,
    showTotals: true,
    selectedCellKey: '',
    selectedDetails: [],
    selectedMeta: null,
    updatedAt: ''
  };

  const els = {
    authStatus: document.getElementById('authStatus'),
    authSub: document.getElementById('authSub'),
    roleStatus: document.getElementById('roleStatus'),
    roleSub: document.getElementById('roleSub'),
    cloudStatus: document.getElementById('cloudStatus'),
    cloudSub: document.getElementById('cloudSub'),
    selStatus: document.getElementById('selStatus'),
    selSub: document.getElementById('selSub'),
    filterClient: document.getElementById('filterClient'),
    filterYear: document.getElementById('filterYear'),
    filterMonth: document.getElementById('filterMonth'),
    filterSource: document.getElementById('filterSource'),
    valueMode: document.getElementById('valueMode'),
    searchInput: document.getElementById('searchInput'),
    onlyWithValues: document.getElementById('onlyWithValues'),
    showTotals: document.getElementById('showTotals'),
    summaryGrid: document.getElementById('summaryGrid'),
    rowsPill: document.getElementById('rowsPill'),
    pivotHead: document.getElementById('pivotHead'),
    pivotBody: document.getElementById('pivotBody'),
    tableInfo: document.getElementById('tableInfo'),
    detailPill: document.getElementById('detailPill'),
    detailMetrics: document.getElementById('detailMetrics'),
    detailBody: document.getElementById('detailBody'),
    btnReload: document.getElementById('btnReload'),
    btnLogout: document.getElementById('btnLogout')
  };

  function trimText(value){ return String(value == null ? '' : value).trim(); }
  function norm(value){ return trimText(value).toLowerCase(); }
  function upper(value){ return trimText(value).toUpperCase(); }
  function safeText(value){ return trimText(value) || '-'; }
  function escapeHtml(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function parseNumber(value){
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const text = trimText(value).replace(/\s+/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',', '.');
    const num = Number(text);
    return Number.isFinite(num) ? num : 0;
  }
  function formatInteger(value){
    const n = Math.round(Number(value || 0) || 0);
    return n.toLocaleString('ro-RO', { maximumFractionDigits: 0 });
  }
  function formatNumber(value){
    const n = Number(value || 0);
    return n.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }
  function formatDateDisplay(value){
    const iso = trimText(value);
    if(!iso) return '-';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m) return iso;
    return m[3] + '.' + m[2] + '.' + m[1];
  }
  function uniqueValues(list){ return Array.from(new Set((list || []).map(trimText).filter(Boolean))); }
  function normalizeSourceType(value){
    const clean = norm(value);
    if (!clean) return '';
    if (clean.indexOf('forecast') >= 0 || clean === 'f') return 'forecast';
    if (clean.indexOf('firm') >= 0 || clean.indexOf('comanda') >= 0 || clean.indexOf('open') >= 0 || clean.indexOf('pending') >= 0 || clean === 'p') return 'comanda';
    if (clean.indexOf('schedule') >= 0) return 'schedule';
    if (clean.indexOf('manual') >= 0) return 'manual';
    if (clean.indexOf('data_export') >= 0) return 'comanda';
    return clean;
  }
  function sourceLabel(value){
    const clean = normalizeSourceType(value);
    if (clean === 'forecast') return 'Forecast';
    if (clean === 'comanda') return 'Comandă';
    if (clean === 'schedule') return 'Schedule';
    if (clean === 'manual') return 'Manual';
    return clean ? clean.toUpperCase() : '-';
  }
  function coalesce(){
    for (let i = 0; i < arguments.length; i += 1) {
      const text = trimText(arguments[i]);
      if (text) return text;
    }
    return '';
  }
  function enrichRow(row, idx){
    const raw = row || {};
    const shipTo = coalesce(raw.shipTo, raw.ship_to, raw.shipto, raw.destination);
    const client = coalesce(raw.client, raw.customer, raw.customerName, raw.supplier, shipTo);
    const groupLabel = shipTo || client || 'Fără client';
    const reperClient = coalesce(raw.reperClient, raw.part, raw.itemId, raw.customerPartNo);
    const reperForMrc = coalesce(raw.reperForMrc, raw.reper_client_mrc, reperClient);
    const year = coalesce(raw.year, raw.shipYear);
    const rawMonth = coalesce(raw.month, raw.shipMonth);
    const month = rawMonth ? rawMonth.padStart(2,'0') : '';
    const week = coalesce(raw.week, raw.shipWeek);
    const qtyPcs = Math.max(0, parseNumber(raw.qtyPcs || raw.qty || raw.requestedQty || raw.orderedQty || raw.dueQty));
    const kgPerPiece = parseNumber(raw.kgPerPiece || raw.kg_per_piece || 0);
    const demandKg = parseNumber(raw.demandKg || raw.demand_kg || 0) || (kgPerPiece ? qtyPcs * kgPerPiece : 0);
    return {
      id: coalesce(raw.id, 'row-' + idx + '-' + Math.random().toString(36).slice(2,7)),
      client: client,
      shipTo: shipTo,
      groupLabel: groupLabel,
      sourceType: normalizeSourceType(raw.sourceType || raw.commitmentLevel || raw.statusRaw || raw.status || raw.rawFileType || 'manual') || 'manual',
      rawFileType: trimText(raw.rawFileType || raw.fileType || raw.format || 'manual'),
      reperClient: reperClient,
      reperForMrc: reperForMrc,
      qtyPcs: qtyPcs,
      demandKg: demandKg,
      kgPerPiece: kgPerPiece,
      shipDate: trimText(raw.shipDate || raw.needBy || raw.deliveryDate || raw.date || ''),
      year: year,
      month: month,
      week: week,
      orderRef: coalesce(raw.orderRef, raw.orderNo, raw.poNbr, raw.lineId),
      statusRaw: trimText(raw.statusRaw || raw.status || raw.commitmentLevel || ''),
      description: trimText(raw.description || raw.descr1 || ''),
      isMapped: !!coalesce(raw.mappedKey, raw.mappedMaterial, raw.mappedDiametru) || demandKg > 0,
      mappedMaterial: trimText(raw.mappedMaterial || ''),
      mappedDiametru: trimText(raw.mappedDiametru || ''),
      notes: trimText(raw.notes || '')
    };
  }

  async function readDocumentCompat(keys){
    if (!state.supabase) return null;
    const list = uniqueValues(keys || []);
    for (let i = 0; i < list.length; i += 1) {
      try {
        const res = await state.supabase.from('rf_documents').select('*').eq('doc_key', list[i]).maybeSingle();
        if (!res.error && res.data) return res.data;
      } catch (_e) {}
    }
    return null;
  }

  async function initAuth(){
    try {
      if (!window.ERPAuth) throw new Error('auth-common.js nu s-a încărcat.');
      const authState = await window.ERPAuth.requireAuth({ next:'pivot-comenzi.html', redirectToLogin:true });
      state.supabase = window.ERPAuth.getSupabaseClient();
      if (!authState || !authState.user) return false;
      state.user = authState.user;
      state.role = authState.role || 'viewer';
      els.authStatus.textContent = 'Autentificat';
      els.authSub.textContent = safeText(state.user.email || state.user.id);
      els.roleStatus.textContent = window.ERPAuth.roleLabel ? window.ERPAuth.roleLabel(state.role) : state.role;
      els.roleSub.textContent = 'Vizualizare pivot pentru rolul curent.';
      return true;
    } catch (error) {
      console.error(error);
      els.authStatus.textContent = 'Eroare';
      els.authSub.textContent = trimText(error && error.message || 'Nu am putut valida sesiunea.');
      els.roleStatus.textContent = '-';
      return false;
    }
  }

  async function loadCloud(){
    try {
      els.cloudStatus.textContent = 'Se încarcă';
      els.cloudSub.textContent = 'Citesc documentul comenzi-piese din rf_documents.';
      const doc = await readDocumentCompat(DOC_KEYS);
      const payload = doc ? (doc.content || doc.data || {}) : {};
      const rows = Array.isArray(payload.orders) ? payload.orders : (Array.isArray(payload.rows) ? payload.rows : []);
      state.rows = rows.map(function(item, index){ return enrichRow(item, index); }).filter(function(row){
        return row.year && row.month && row.week && row.reperClient;
      });
      state.updatedAt = trimText(payload.updated_at || (doc && doc.updated_at) || '');
      els.cloudStatus.textContent = doc ? 'Cloud conectat' : 'Model gol';
      els.cloudSub.textContent = doc ? ('Ultima actualizare: ' + safeText(state.updatedAt)) : 'Nu există încă un document salvat.';
      els.tableInfo.innerHTML = 'Rândurile sunt citite din <strong>rf_documents / comenzi-piese</strong>. Ultima actualizare: <strong>' + escapeHtml(safeText(state.updatedAt)) + '</strong>.';
    } catch (error) {
      console.error(error);
      state.rows = [];
      els.cloudStatus.textContent = 'Eroare cloud';
      els.cloudSub.textContent = trimText(error && error.message || 'Nu am putut încărca documentul.');
    }
  }

  function getAvailableYears(){
    return uniqueValues(state.rows.map(function(row){ return row.year; })).sort();
  }

  function populateFilters(){
    const groupValues = uniqueValues(state.rows.map(function(row){ return row.groupLabel; })).sort(function(a,b){ return a.localeCompare(b, 'ro', { sensitivity:'base' }); });
    const sourceValues = uniqueValues(state.rows.map(function(row){ return sourceLabel(row.sourceType); })).sort(function(a,b){ return a.localeCompare(b, 'ro', { sensitivity:'base' }); });
    const yearValues = getAvailableYears();
    if (!state.filterYear && yearValues.length) state.filterYear = yearValues[yearValues.length - 1];
    const monthValues = uniqueValues(state.rows.filter(function(row){ return !state.filterYear || row.year === state.filterYear; }).map(function(row){ return row.month; })).sort();

    function fillSelect(select, values, current, emptyLabel, allowEmpty){
      const final = (allowEmpty ? [''] : []).concat(values);
      select.innerHTML = final.map(function(value){
        const text = !value ? emptyLabel : (select === els.filterMonth ? (value + ' ' + (MONTH_NAMES[value] || value)) : value);
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(text) + '</option>';
      }).join('');
      if (current && final.indexOf(current) >= 0) select.value = current;
      else if (!allowEmpty && final.length) select.value = final[0];
      else if (allowEmpty) select.value = current || '';
    }

    fillSelect(els.filterClient, groupValues, state.filterClient, 'Toți clienții', true);
    fillSelect(els.filterYear, yearValues, state.filterYear, 'Fără an', false);
    state.filterYear = els.filterYear.value;
    const refreshedMonths = uniqueValues(state.rows.filter(function(row){ return !state.filterYear || row.year === state.filterYear; }).map(function(row){ return row.month; })).sort();
    if (state.filterMonth && refreshedMonths.indexOf(state.filterMonth) < 0) state.filterMonth = '';
    fillSelect(els.filterMonth, refreshedMonths, state.filterMonth, 'Toate lunile', true);
    fillSelect(els.filterSource, sourceValues, state.filterSource, 'Toate sursele', true);
    els.valueMode.value = state.valueMode;
    els.searchInput.value = state.search;
    els.onlyWithValues.checked = state.onlyWithValues;
    els.showTotals.checked = state.showTotals;
  }

  function getVisibleRows(){
    const search = upper(state.search);
    return state.rows.filter(function(row){
      const matchesClient = !state.filterClient || row.groupLabel === state.filterClient;
      const matchesYear = !state.filterYear || row.year === state.filterYear;
      const matchesMonth = !state.filterMonth || row.month === state.filterMonth;
      const matchesSource = !state.filterSource || sourceLabel(row.sourceType) === state.filterSource;
      const hay = [row.groupLabel, row.client, row.shipTo, row.reperClient, row.reperForMrc, row.orderRef, row.description].join(' ');
      const matchesSearch = !search || upper(hay).indexOf(search) >= 0;
      return matchesClient && matchesYear && matchesMonth && matchesSource && matchesSearch;
    });
  }

  function buildPivotModel(rows){
    const monthWeekMap = new Map();
    const groupsMap = new Map();
    const grandTotals = Object.create(null);
    const grandDetailMap = Object.create(null);

    rows.forEach(function(row){
      const month = row.month.padStart(2,'0');
      const week = trimText(row.week);
      if (!monthWeekMap.has(month)) monthWeekMap.set(month, new Set());
      monthWeekMap.get(month).add(week);

      const groupKey = row.groupLabel || 'Fără client';
      const itemKey = row.reperClient || 'Fără reper';
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, { key:groupKey, label:groupKey, items:new Map(), totals:Object.create(null), totalValue:0 });
      }
      const group = groupsMap.get(groupKey);
      if (!group.items.has(itemKey)) {
        group.items.set(itemKey, {
          key:itemKey,
          reperClient:row.reperClient,
          reperForMrc:row.reperForMrc,
          totalValue:0,
          totals:Object.create(null),
          detailMap:Object.create(null)
        });
      }
      const item = group.items.get(itemKey);
      const value = state.valueMode === 'kg' ? Number(row.demandKg || 0) : Number(row.qtyPcs || 0);
      const cellKey = month + '|' + week;
      item.totals[cellKey] = (item.totals[cellKey] || 0) + value;
      group.totals[cellKey] = (group.totals[cellKey] || 0) + value;
      grandTotals[cellKey] = (grandTotals[cellKey] || 0) + value;
      item.totalValue += value;
      group.totalValue += value;
      if (!item.detailMap[cellKey]) item.detailMap[cellKey] = [];
      item.detailMap[cellKey].push(row);
      if (!grandDetailMap[cellKey]) grandDetailMap[cellKey] = [];
      grandDetailMap[cellKey].push(row);
    });

    const months = Array.from(monthWeekMap.keys()).sort();
    const columns = months.map(function(month){
      const weeks = Array.from(monthWeekMap.get(month) || []).sort(function(a,b){ return Number(a || 0) - Number(b || 0); });
      return { month:month, label:MONTH_NAMES[month] || month, weeks:weeks };
    });

    const groups = Array.from(groupsMap.values()).sort(function(a,b){ return a.label.localeCompare(b.label, 'ro', { sensitivity:'base' }); }).map(function(group){
      const items = Array.from(group.items.values()).sort(function(a,b){ return (a.reperClient || '').localeCompare(b.reperClient || '', 'ro', { sensitivity:'base' }); });
      return Object.assign(group, { items:items });
    });

    return { columns:columns, groups:groups, grandTotals:grandTotals, grandDetailMap:grandDetailMap };
  }

  function renderSummary(rows, model){
    const groups = uniqueValues(rows.map(function(row){ return row.groupLabel; })).length;
    const pieces = rows.reduce(function(sum, row){ return sum + Number(row.qtyPcs || 0); }, 0);
    const kg = rows.reduce(function(sum, row){ return sum + Number(row.demandKg || 0); }, 0);
    const weeks = model.columns.reduce(function(sum, col){ return sum + col.weeks.length; }, 0);
    els.summaryGrid.innerHTML = [
      '<div class="summary-card"><div class="summary-title">Linii filtrate</div><div class="summary-value">' + formatInteger(rows.length) + '</div><div class="summary-note">Liniile brute care intră acum în pivot.</div></div>',
      '<div class="summary-card"><div class="summary-title">Clienți / Ship To</div><div class="summary-value">' + formatInteger(groups) + '</div><div class="summary-note">Grupe afișate în pivotul curent.</div></div>',
      '<div class="summary-card"><div class="summary-title">Cantitate totală</div><div class="summary-value">' + formatInteger(pieces) + ' buc</div><div class="summary-note">Echivalent în material: ' + formatNumber(kg) + ' kg.</div></div>',
      '<div class="summary-card"><div class="summary-title">Săptămâni vizibile</div><div class="summary-value">' + formatInteger(weeks) + '</div><div class="summary-note">Coloanele active după filtrele alese.</div></div>'
    ].join('');
  }

  function getCellValue(totals, month, week){
    const key = month + '|' + week;
    return Number(totals && totals[key] || 0);
  }

  function formatCellValue(value){
    return state.valueMode === 'kg' ? formatNumber(value) : formatInteger(value);
  }

  function chooseDetails(meta){
    state.selectedMeta = meta || null;
    state.selectedCellKey = meta ? meta.selectionKey : '';
    state.selectedDetails = meta && Array.isArray(meta.details) ? meta.details.slice() : [];
    if (!meta) {
      els.selStatus.textContent = 'Nicio celulă';
      els.selSub.textContent = 'Apasă pe o cantitate din pivot ca să vezi detaliile ei.';
      return;
    }
    els.selStatus.textContent = safeText(meta.groupLabel + ' / ' + meta.itemLabel);
    els.selSub.textContent = (meta.monthLabel || '-') + ' / WK' + safeText(meta.week) + ' • ' + formatCellValue(meta.value) + (state.valueMode === 'kg' ? ' kg' : ' buc');
  }

  function renderPivot(model){
    const totalCols = model.columns.reduce(function(sum, col){ return sum + col.weeks.length; }, 0);
    if (!model.columns.length || !model.groups.length) {
      els.rowsPill.textContent = '0 repere';
      els.pivotHead.innerHTML = '<tr class="head-year"><th class="sticky-col-1" rowspan="3">SHIP TO</th><th class="sticky-col-2" rowspan="3">REPER</th><th rowspan="3">TOTAL</th></tr>';
      els.pivotBody.innerHTML = '<tr><td colspan="3" class="empty">Nu există date pentru filtrul curent. Verifică anul, luna sau importurile din pagina Comenzi piese.</td></tr>';
      return;
    }

    const yearLabel = state.filterYear || 'AN';
    els.rowsPill.textContent = formatInteger(model.groups.reduce(function(sum, group){ return sum + group.items.length; }, 0)) + ' repere';

    const yearRow = '<tr class="head-year">' +
      '<th class="sticky-col-1" rowspan="3">SHIP TO</th>' +
      '<th class="sticky-col-2" rowspan="3">REPER</th>' +
      '<th colspan="' + totalCols + '">' + escapeHtml(yearLabel) + '</th>' +
      '<th rowspan="3">TOTAL ' + (state.valueMode === 'kg' ? 'KG' : 'BUC') + '</th>' +
    '</tr>';

    const monthCells = model.columns.map(function(col){ return '<th colspan="' + col.weeks.length + '">' + escapeHtml(col.month + ' ' + col.label) + '</th>'; }).join('');
    const weekCells = model.columns.map(function(col){ return col.weeks.map(function(week){ return '<th>WK' + escapeHtml(week) + '</th>'; }).join(''); }).join('');
    els.pivotHead.innerHTML = yearRow + '<tr class="head-month">' + monthCells + '</tr><tr class="head-week">' + weekCells + '</tr>';

    const body = [];
    model.groups.forEach(function(group){
      const visibleItems = group.items.filter(function(item){ return !state.onlyWithValues || item.totalValue > 0; });
      if (!visibleItems.length) return;
      visibleItems.forEach(function(item, index){
        const row = [];
        row.push('<tr>');
        row.push('<td class="left sticky-col-1' + (index === 0 ? ' group-cell' : '') + '">' + (index === 0 ? escapeHtml(group.label) : '') + '</td>');
        row.push('<td class="left sticky-col-2"><span class="item-main">' + escapeHtml(item.reperClient || '-') + '</span>' + (item.reperForMrc && item.reperForMrc !== item.reperClient ? '<span class="item-sub">MRC: ' + escapeHtml(item.reperForMrc) + '</span>' : '') + '</td>');
        model.columns.forEach(function(col){
          col.weeks.forEach(function(week){
            const value = getCellValue(item.totals, col.month, week);
            const cellId = ['cell', group.label, item.reperClient, col.month, week].join('|');
            const details = item.detailMap[col.month + '|' + week] || [];
            const isSelected = state.selectedCellKey === cellId;
            const classes = ['right','num-cell'];
            if (value > 0) classes.push('has-value'); else classes.push('num-zero');
            if (isSelected) classes.push('selected');
            row.push('<td class="' + classes.join(' ') + '" data-action="select-cell" data-cell-key="' + escapeHtml(cellId) + '" data-group="' + escapeHtml(group.label) + '" data-item="' + escapeHtml(item.reperClient || '-') + '" data-item-mrc="' + escapeHtml(item.reperForMrc || '') + '" data-month="' + escapeHtml(col.month) + '" data-month-label="' + escapeHtml(col.label) + '" data-week="' + escapeHtml(week) + '" data-value="' + escapeHtml(String(value)) + '">' + (value > 0 ? formatCellValue(value) : '') + '</td>');
          });
        });
        row.push('<td class="right total-col">' + (item.totalValue > 0 ? formatCellValue(item.totalValue) : '') + '</td>');
        row.push('</tr>');
        body.push(row.join(''));
      });
      if (state.showTotals) {
        const totalRow = [];
        totalRow.push('<tr class="client-total">');
        totalRow.push('<td class="left sticky-col-1 group-cell">' + escapeHtml(group.label + ' Total') + '</td>');
        totalRow.push('<td class="left sticky-col-2">Total client</td>');
        model.columns.forEach(function(col){
          col.weeks.forEach(function(week){
            const value = getCellValue(group.totals, col.month, week);
            totalRow.push('<td class="right">' + (value > 0 ? formatCellValue(value) : '') + '</td>');
          });
        });
        totalRow.push('<td class="right total-col">' + (group.totalValue > 0 ? formatCellValue(group.totalValue) : '') + '</td>');
        totalRow.push('</tr>');
        body.push(totalRow.join(''));
      }
    });

    const grandRow = [];
    grandRow.push('<tr class="grand-total">');
    grandRow.push('<td class="left sticky-col-1 group-cell">TOTAL GENERAL</td>');
    grandRow.push('<td class="left sticky-col-2">Toți clienții</td>');
    let grandTotal = 0;
    model.columns.forEach(function(col){
      col.weeks.forEach(function(week){
        const value = getCellValue(model.grandTotals, col.month, week);
        grandTotal += value;
        grandRow.push('<td class="right">' + (value > 0 ? formatCellValue(value) : '') + '</td>');
      });
    });
    grandRow.push('<td class="right total-col">' + (grandTotal > 0 ? formatCellValue(grandTotal) : '') + '</td>');
    grandRow.push('</tr>');
    body.push(grandRow.join(''));

    els.pivotBody.innerHTML = body.join('');
  }

  function renderDetails(){
    const details = state.selectedDetails.slice().sort(function(a,b){
      const da = trimText(a.shipDate);
      const db = trimText(b.shipDate);
      if (da !== db) return da.localeCompare(db);
      return trimText(a.orderRef).localeCompare(trimText(b.orderRef), 'ro', { sensitivity:'base' });
    });
    els.detailPill.textContent = formatInteger(details.length) + ' linii';

    if (!details.length || !state.selectedMeta) {
      els.detailMetrics.innerHTML = [
        '<div class="mini-card"><div class="k">Celulă</div><div class="v">-</div></div>',
        '<div class="mini-card"><div class="k">Valoare</div><div class="v">-</div></div>',
        '<div class="mini-card"><div class="k">Client</div><div class="v">-</div></div>',
        '<div class="mini-card"><div class="k">Reper</div><div class="v">-</div></div>'
      ].join('');
      els.detailBody.innerHTML = '<tr><td colspan="10" class="empty">Selectează o celulă din pivot pentru a vedea liniile brute.</td></tr>';
      return;
    }

    const totalPcs = details.reduce(function(sum, row){ return sum + Number(row.qtyPcs || 0); }, 0);
    const totalKg = details.reduce(function(sum, row){ return sum + Number(row.demandKg || 0); }, 0);
    els.detailMetrics.innerHTML = [
      '<div class="mini-card"><div class="k">Celulă</div><div class="v">WK' + escapeHtml(state.selectedMeta.week) + '</div></div>',
      '<div class="mini-card"><div class="k">Valoare</div><div class="v">' + escapeHtml(formatCellValue(state.selectedMeta.value)) + (state.valueMode === 'kg' ? ' kg' : ' buc') + '</div></div>',
      '<div class="mini-card"><div class="k">Client</div><div class="v">' + escapeHtml(state.selectedMeta.groupLabel) + '</div></div>',
      '<div class="mini-card"><div class="k">Reper</div><div class="v">' + escapeHtml(state.selectedMeta.itemLabel) + '</div></div>',
      '<div class="mini-card"><div class="k">Total linii selectate</div><div class="v">' + formatInteger(details.length) + '</div></div>',
      '<div class="mini-card"><div class="k">Sumă reală</div><div class="v">' + formatInteger(totalPcs) + ' buc / ' + formatNumber(totalKg) + ' kg</div></div>'
    ].join('');

    els.detailBody.innerHTML = details.map(function(row){
      return '<tr>' +
        '<td class="left">' + escapeHtml(row.client || '-') + '</td>' +
        '<td class="left">' + escapeHtml(row.shipTo || '-') + '</td>' +
        '<td class="left"><strong>' + escapeHtml(row.reperClient || '-') + '</strong></td>' +
        '<td class="left">' + escapeHtml(row.reperForMrc || '-') + '</td>' +
        '<td class="right">' + formatInteger(row.qtyPcs) + '</td>' +
        '<td class="right">' + formatNumber(row.demandKg) + '</td>' +
        '<td class="center">' + formatDateDisplay(row.shipDate) + '</td>' +
        '<td class="center">' + escapeHtml(sourceLabel(row.sourceType)) + '</td>' +
        '<td class="left">' + escapeHtml(row.orderRef || '-') + '</td>' +
        '<td class="left">' + escapeHtml(row.statusRaw || '-') + '</td>' +
      '</tr>';
    }).join('');
  }

  function fullRender(){
    populateFilters();
    const rows = getVisibleRows();
    const model = buildPivotModel(rows);
    renderSummary(rows, model);
    renderPivot(model);
    renderDetails();
  }

  function bindEvents(){
    els.filterClient.addEventListener('change', function(){ state.filterClient = this.value; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.filterYear.addEventListener('change', function(){ state.filterYear = this.value; state.filterMonth=''; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.filterMonth.addEventListener('change', function(){ state.filterMonth = this.value; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.filterSource.addEventListener('change', function(){ state.filterSource = this.value; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.valueMode.addEventListener('change', function(){ state.valueMode = this.value; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.searchInput.addEventListener('input', function(){ state.search = trimText(this.value); fullRender(); });
    els.onlyWithValues.addEventListener('change', function(){ state.onlyWithValues = this.checked; state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.showTotals.addEventListener('change', function(){ state.showTotals = this.checked; fullRender(); });
    els.btnReload.addEventListener('click', async function(){ await loadCloud(); state.selectedCellKey=''; state.selectedDetails=[]; state.selectedMeta=null; fullRender(); });
    els.btnLogout.addEventListener('click', async function(){ if(window.ERPAuth) await window.ERPAuth.signOut({ redirectTo:'login.html' }); });

    els.pivotBody.addEventListener('click', function(event){
      const cell = event.target.closest('[data-action="select-cell"]');
      if (!cell) return;
      const groupLabel = cell.getAttribute('data-group') || '';
      const itemLabel = cell.getAttribute('data-item') || '';
      const itemMrc = cell.getAttribute('data-item-mrc') || '';
      const month = cell.getAttribute('data-month') || '';
      const monthLabel = cell.getAttribute('data-month-label') || '';
      const week = cell.getAttribute('data-week') || '';
      const value = parseNumber(cell.getAttribute('data-value') || 0);
      const selectionKey = cell.getAttribute('data-cell-key') || '';
      const details = getVisibleRows().filter(function(row){
        return row.groupLabel === groupLabel && row.reperClient === itemLabel && row.month === month && trimText(row.week) === week;
      });
      chooseDetails({
        selectionKey: selectionKey,
        groupLabel: groupLabel,
        itemLabel: itemLabel,
        itemMrc: itemMrc,
        month: month,
        monthLabel: monthLabel,
        week: week,
        value: value,
        details: details
      });
      renderPivot(buildPivotModel(getVisibleRows()));
      renderDetails();
    });
  }

  async function init(){
    bindEvents();
    const ok = await initAuth();
    if (!ok) return;
    await loadCloud();
    fullRender();
  }

  init();
})();