
(function(){
  'use strict';

  const PAGE_KEY = 'mrc';
  const DOC_KEYS = ['mrc','plan-mrc','mrc-plan'];
  const SEED = window.RF_MRC_SEED || null;

  const state = {
    supabase: null,
    user: null,
    role: 'viewer',
    canEdit: false,
    canDelete: false,
    orders: [],
    selectedKey: '',
    updatedAt: '',
    saveTimer: null,
    startWeek: 1,
    endWeek: 12,
    search: '',
    onlyCritical: false
  };

  const els = {
    authStatus: document.getElementById('authStatus'),
    authSub: document.getElementById('authSub'),
    roleStatus: document.getElementById('roleStatus'),
    roleSub: document.getElementById('roleSub'),
    cloudStatus: document.getElementById('cloudStatus'),
    cloudSub: document.getElementById('cloudSub'),
    seedStatus: document.getElementById('seedStatus'),
    seedSub: document.getElementById('seedSub'),
    summaryGrid: document.getElementById('summaryGrid'),
    groupsBody: document.getElementById('groupsBody'),
    weeksBody: document.getElementById('weeksBody'),
    ordersList: document.getElementById('ordersList'),
    sourceList: document.getElementById('sourceList'),
    detailTitle: document.getElementById('detailTitle'),
    detailPill: document.getElementById('detailPill'),
    detailCards: document.getElementById('detailCards'),
    startWeek: document.getElementById('startWeek'),
    endWeek: document.getElementById('endWeek'),
    searchInput: document.getElementById('searchInput'),
    onlyCritical: document.getElementById('onlyCritical'),
    orderWeek: document.getElementById('orderWeek'),
    orderQty: document.getElementById('orderQty'),
    orderSupplier: document.getElementById('orderSupplier'),
    orderDoc: document.getElementById('orderDoc'),
    orderNote: document.getElementById('orderNote'),
    btnAddOrder: document.getElementById('btnAddOrder'),
    btnReload: document.getElementById('btnReload'),
    btnLogout: document.getElementById('btnLogout'),
    orderFormWrap: document.getElementById('orderFormWrap'),
    lockLayer: document.getElementById('lockLayer')
  };

  function trimText(value){ return String(value == null ? '' : value).trim(); }
  function norm(value){ return trimText(value).toLowerCase(); }
  function upper(value){ return trimText(value).toUpperCase(); }
  function nowIso(){ return new Date().toISOString(); }
  function safeText(value){ return trimText(value) || '-'; }
  function escapeHtml(value){ return String(value == null ? '' : value).replace(/[&<>\"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function formatNumber(value){ const n = Number(value || 0); return n.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 1 }); }
  function formatNumber1(value){ const n = Number(value || 0); return n.toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function uniqueKeys(list){ return Array.from(new Set((list || []).map(trimText).filter(Boolean))); }
  function getWeekList(){ return Array.isArray(SEED && SEED.weeks) ? SEED.weeks.slice() : Array.from({ length:52 }, (_,i) => i + 1); }
  function getGroups(){ return Array.isArray(SEED && SEED.groups) ? SEED.groups.slice() : []; }
  function buildIncomingMap(){ const map = Object.create(null); state.orders.forEach(order => {
    const key = trimText(order.key);
    const week = Number(order.week || 0);
    const qty = Number(order.qtyKg || 0);
    if(!key || !week || qty <= 0) return;
    if(!map[key]) map[key] = Object.create(null);
    map[key][week] = (map[key][week] || 0) + qty;
  }); return map; }
  function getDefaultPermissions(role){ const clean = norm(role) || 'viewer'; return { canEdit:['admin','editor','operator'].includes(clean), canDelete:['admin','editor'].includes(clean) }; }
  async function readDocumentCompat(keys){ if(!state.supabase) return null; const list = uniqueKeys(keys); for(const key of list){ try{ const res = await state.supabase.from('rf_documents').select('*').eq('doc_key', key).maybeSingle(); if(!res.error && res.data) return res.data; }catch(_e){} } return null; }
  async function writeDocumentCompat(docKey, payload){ if(!state.supabase) throw new Error('Supabase indisponibil'); const ts = payload && payload.updated_at ? payload.updated_at : nowIso(); let res = await state.supabase.from('rf_documents').upsert({ doc_key:docKey, content:payload, data:payload, updated_at:ts }, { onConflict:'doc_key' }); if(res && res.error){ res = await state.supabase.from('rf_documents').upsert({ doc_key:docKey, content:payload, updated_at:ts }, { onConflict:'doc_key' }); } if(res && res.error) throw res.error; return true; }
  async function resolvePagePermissions(){ const defaults = getDefaultPermissions(state.role); state.canEdit = defaults.canEdit; state.canDelete = defaults.canDelete; if(!state.supabase) return; try{ const res = await state.supabase.from('page_permissions').select('*').eq('role', state.role).in('page_key', [PAGE_KEY,'mrc','plan mrc','plan-mrc']); if(!res.error && Array.isArray(res.data) && res.data.length){ state.canEdit = res.data.some(row => row.can_edit === true || row.can_add === true); state.canDelete = res.data.some(row => row.can_delete === true || row.can_edit === true); } }catch(_e){} }
  function buildPayload(){ return { version:1, orders: state.orders.map(order => ({ id:order.id, key:order.key, material:order.material, diametru:order.diametru, week:Number(order.week || 0), qtyKg:Number(order.qtyKg || 0), supplier:order.supplier || '', docRef:order.docRef || '', note:order.note || '' })), updated_at: state.updatedAt || nowIso() }; }
  function normalizeOrderRow(row, index){ const obj = row || {}; return { id: trimText(obj.id) || ('mrc-' + index + '-' + Math.random().toString(36).slice(2)), key: trimText(obj.key), material: trimText(obj.material), diametru: trimText(obj.diametru), week: Math.max(1, Math.min(52, Number(obj.week || 1) || 1)), qtyKg: Math.max(0, Number(obj.qtyKg || obj.qty || 0) || 0), supplier: trimText(obj.supplier), docRef: trimText(obj.docRef || obj.doc || obj.po), note: trimText(obj.note || obj.observatii) }; }
  function loadSeedUi(){ if(!SEED || !Array.isArray(SEED.groups)){ els.seedStatus.textContent = 'Lipsește seed'; els.seedSub.textContent = 'Nu am găsit fișierul mrc-seed.js.'; return false; } els.seedStatus.textContent = formatNumber(SEED.sourceStats && SEED.sourceStats.groupCount || 0) + ' grupe'; els.seedSub.textContent = 'Excel: ' + safeText(SEED.sourceWorkbook) + ' • comenzi brute: ' + formatNumber(SEED.sourceStats && SEED.sourceStats.dataExportRows || 0) + ' rânduri'; const weeks = getWeekList(); const options = weeks.map(w => '<option value="' + w + '">WK ' + w + '</option>').join(''); els.startWeek.innerHTML = options; els.endWeek.innerHTML = options; els.orderWeek.innerHTML = options; els.startWeek.value = String(state.startWeek); els.endWeek.value = String(state.endWeek); els.orderWeek.value = String(state.startWeek); return true; }
  function updateAccessUi(){ const label = (window.ERPAuth && window.ERPAuth.roleLabel) ? window.ERPAuth.roleLabel(state.role) : state.role; els.roleStatus.textContent = label; els.roleSub.textContent = state.canEdit ? (label + ' • editare activă') : (label + ' • doar vizualizare'); els.orderFormWrap.style.display = state.canEdit ? '' : 'none'; if(els.lockLayer){ els.lockLayer.style.display = state.canEdit ? 'none' : 'flex'; els.lockLayer.setAttribute('aria-hidden', state.canEdit ? 'true' : 'false'); } }
  async function initAuth(){ try{ if(!window.ERPAuth) throw new Error('auth-common.js nu s-a încărcat.'); const authState = await window.ERPAuth.requireAuth({ next:'mrc.html', redirectToLogin:true }); state.supabase = window.ERPAuth.getSupabaseClient(); state.user = authState.user; state.role = trimText(authState.role || 'viewer') || 'viewer'; await resolvePagePermissions(); els.authStatus.textContent = trimText(state.user && (state.user.email || state.user.id) || '-'); els.authSub.textContent = 'Sesiune activă.'; updateAccessUi(); }catch(error){ console.error(error); els.authStatus.textContent = 'Neautentificat'; els.authSub.textContent = trimText(error && error.message || 'Nu am putut valida sesiunea.'); } }
  async function loadCloudDocument(){ if(!state.supabase){ state.orders = []; return; } els.cloudStatus.textContent = 'Încărcare...'; els.cloudSub.textContent = 'Citesc documentul mrc din rf_documents.'; try{ const doc = await readDocumentCompat(DOC_KEYS); const payload = doc ? (doc.content || doc.data || {}) : {}; const rows = Array.isArray(payload.orders) ? payload.orders : (Array.isArray(payload.rows) ? payload.rows : []); state.orders = rows.map(normalizeOrderRow).filter(item => item.key); state.updatedAt = trimText(payload.updated_at || doc && doc.updated_at || ''); els.cloudStatus.textContent = doc ? 'Cloud conectat' : 'Model gol'; els.cloudSub.textContent = doc ? ('Ultima actualizare: ' + safeText(state.updatedAt)) : 'Nu există încă un document salvat.'; }catch(error){ console.error(error); state.orders = []; els.cloudStatus.textContent = 'Eroare cloud'; els.cloudSub.textContent = trimText(error && error.message || 'Nu am putut încărca documentul.'); } }
  function queueSave(){ if(!state.canEdit) return; if(state.saveTimer) clearTimeout(state.saveTimer); els.cloudStatus.textContent = 'Salvare...'; els.cloudSub.textContent = 'Se pregătește payload-ul pentru rf_documents.'; state.saveTimer = setTimeout(async () => { try{ state.updatedAt = nowIso(); const payload = buildPayload(); payload.updated_at = state.updatedAt; await writeDocumentCompat(DOC_KEYS[0], payload); els.cloudStatus.textContent = 'Cloud salvat'; els.cloudSub.textContent = 'rf_documents / mrc'; }catch(error){ console.error(error); els.cloudStatus.textContent = 'Eroare cloud'; els.cloudSub.textContent = trimText(error && error.message || 'Nu am putut salva documentul.'); } }, 500); }
  function computeMetrics(group){
    const weeks = getWeekList();
    const incomingMap = buildIncomingMap();
    const incomingByWeek = incomingMap[group.key] || Object.create(null);
    const startStockKg = Number(group.startStockKg || 0);
    let running = startStockKg;
    let firstCriticalWeek = null;
    let coverUntilWeek = weeks.length ? weeks[weeks.length - 1] : 0;
    const projections = [];
    weeks.forEach((week, index) => {
      const demand = Number(group.demandKgByWeek && group.demandKgByWeek[index] || 0);
      const incoming = Number(incomingByWeek[week] || 0);
      running += incoming - demand;
      if(firstCriticalWeek == null && running < 0){ firstCriticalWeek = week; coverUntilWeek = week - 1; }
      projections.push({ week, demandKg:demand, incomingKg:incoming, projectedKg:running, critical: running < 0 });
    });
    const start = Math.min(state.startWeek, state.endWeek);
    const end = Math.max(state.startWeek, state.endWeek);
    const filtered = projections.filter(item => item.week >= start && item.week <= end);
    const horizonDemandKg = filtered.reduce((sum, item) => sum + item.demandKg, 0);
    const horizonIncomingKg = filtered.reduce((sum, item) => sum + item.incomingKg, 0);
    const horizonEndStockKg = filtered.length ? filtered[filtered.length - 1].projectedKg : startStockKg;
    let statusText = 'Acoperit'; let statusClass = 'ok';
    if(firstCriticalWeek != null && firstCriticalWeek >= start && firstCriticalWeek <= end){ statusText = 'Neacoperit în WK ' + firstCriticalWeek; statusClass = 'bad'; }
    else if(firstCriticalWeek != null){ statusText = 'Risc după WK ' + coverUntilWeek; statusClass = 'warn'; }
    else if(horizonDemandKg <= 0 && horizonIncomingKg <= 0){ statusText = 'Fără mișcare'; statusClass = 'info'; }
    return {
      startStockKg,
      horizonDemandKg,
      horizonIncomingKg,
      horizonEndStockKg,
      firstCriticalWeek,
      coverUntilWeek,
      statusText,
      statusClass,
      projections
    };
  }
  function getVisibleGroups(){
    const list = getGroups().map(group => Object.assign({}, group, { metrics: computeMetrics(group) }));
    const search = upper(state.search);
    return list.filter(group => {
      const matchesSearch = !search || upper(group.material).includes(search) || upper(group.diametru).includes(search);
      const matchesCritical = !state.onlyCritical || group.metrics.firstCriticalWeek != null;
      return matchesSearch && matchesCritical;
    }).sort((a,b) => {
      const ac = a.metrics.firstCriticalWeek == null ? 999 : a.metrics.firstCriticalWeek;
      const bc = b.metrics.firstCriticalWeek == null ? 999 : b.metrics.firstCriticalWeek;
      if(ac !== bc) return ac - bc;
      const as = a.metrics.horizonEndStockKg;
      const bs = b.metrics.horizonEndStockKg;
      if(as !== bs) return as - bs;
      return (a.material + a.diametru).localeCompare(b.material + b.diametru, 'ro', { sensitivity:'base' });
    });
  }
  function ensureSelection(){
    const groups = getVisibleGroups();
    if(!groups.length){ state.selectedKey = ''; return null; }
    const exists = groups.find(item => item.key === state.selectedKey);
    if(exists) return exists;
    state.selectedKey = groups[0].key;
    return groups[0];
  }
  function renderSummary(groups){
    const totalStart = groups.reduce((sum, group) => sum + group.metrics.startStockKg, 0);
    const totalDemand = groups.reduce((sum, group) => sum + group.metrics.horizonDemandKg, 0);
    const totalIncoming = groups.reduce((sum, group) => sum + group.metrics.horizonIncomingKg, 0);
    const critical = groups.filter(group => group.metrics.firstCriticalWeek != null).length;
    els.summaryGrid.innerHTML = [
      '<div class="summary-card"><div class="summary-title">Grupe afișate</div><div class="summary-value">' + formatNumber(groups.length) + '</div><div class="summary-note">Material + diametru în filtrul curent.</div></div>',
      '<div class="summary-card"><div class="summary-title">Stoc start total</div><div class="summary-value">' + formatNumber(totalStart) + ' kg</div><div class="summary-note">Stoc piese convertit în kg + stoc oțel din STOCKS.</div></div>',
      '<div class="summary-card"><div class="summary-title">Necesar orizont</div><div class="summary-value">' + formatNumber(totalDemand) + ' kg</div><div class="summary-note">Cererea din PIVOT SAPT. NECESAR pentru intervalul selectat.</div></div>',
      '<div class="summary-card"><div class="summary-title">Grupe critice</div><div class="summary-value" style="color:' + (critical ? 'var(--bad)' : '#0b1f46') + '">' + formatNumber(critical) + '</div><div class="summary-note">Comenzi viitoare introduse: ' + formatNumber(totalIncoming) + ' kg.</div></div>'
    ].join('');
  }
  function renderGroupsTable(groups){
    if(!groups.length){ els.groupsBody.innerHTML = '<tr><td colspan="12" style="padding:18px;background:#fff">Nu există grupe pentru filtrul curent.</td></tr>'; return; }
    els.groupsBody.innerHTML = groups.map((group, index) => {
      const m = group.metrics;
      const active = group.key === state.selectedKey ? ' active' : '';
      const pillClass = m.statusClass === 'bad' ? 'bad' : (m.statusClass === 'warn' ? 'warn' : (m.statusClass === 'ok' ? 'ok' : 'info'));
      return '<tr class="group-row' + active + '" data-key="' + escapeHtml(group.key) + '">' +
        '<td>' + (index + 1) + '</td>' +
        '<td class="left"><strong>' + escapeHtml(group.material) + '</strong></td>' +
        '<td class="left">' + escapeHtml(group.diametru) + '</td>' +
        '<td class="right">' + formatNumber(group.startStockPieceKg) + '</td>' +
        '<td class="right">' + formatNumber(group.startStockRawKg) + '</td>' +
        '<td class="right"><strong>' + formatNumber(m.startStockKg) + '</strong></td>' +
        '<td class="right">' + formatNumber(m.horizonDemandKg) + '</td>' +
        '<td class="right">' + formatNumber(m.horizonIncomingKg) + '</td>' +
        '<td class="right"><strong>' + formatNumber(m.horizonEndStockKg) + '</strong></td>' +
        '<td>' + (m.firstCriticalWeek == null ? 'WK 52+' : ('WK ' + m.coverUntilWeek)) + '</td>' +
        '<td>' + (m.firstCriticalWeek == null ? '-' : ('WK ' + m.firstCriticalWeek)) + '</td>' +
        '<td><span class="pill ' + pillClass + '">' + escapeHtml(m.statusText) + '</span></td>' +
      '</tr>';
    }).join('');
  }
  function getSelectedGroup(){ return getGroups().find(group => group.key === state.selectedKey) || null; }
  function renderDetail(){
    const group = getSelectedGroup();
    if(!group){
      els.detailTitle.textContent = 'Selectează un material din tabelul de sus.';
      els.detailPill.textContent = '-';
      els.detailPill.className = 'pill info';
      els.detailCards.innerHTML = '<div class="empty" style="grid-column:1/-1">Nu există încă un grup selectat.</div>';
      els.weeksBody.innerHTML = '<tr><td colspan="5" style="padding:18px;background:#fff">Nu există detaliu de afișat.</td></tr>';
      els.ordersList.innerHTML = '<div class="empty">Nu există comenzi viitoare pentru acest grup.</div>';
      els.sourceList.innerHTML = '<div class="empty" style="grid-column:1/-1">Nu există detaliu de stoc pentru acest grup.</div>';
      return;
    }
    const metrics = computeMetrics(group);
    const statusClass = metrics.statusClass === 'bad' ? 'bad' : (metrics.statusClass === 'warn' ? 'warn' : (metrics.statusClass === 'ok' ? 'ok' : 'info'));
    els.detailTitle.textContent = group.material + ' • ' + group.diametru;
    els.detailPill.textContent = metrics.statusText;
    els.detailPill.className = 'pill ' + statusClass;
    els.detailCards.innerHTML = [
      ['Stoc start', formatNumber(metrics.startStockKg) + ' kg'],
      ['Necesar orizont', formatNumber(metrics.horizonDemandKg) + ' kg'],
      ['Comenzi viitoare', formatNumber(metrics.horizonIncomingKg) + ' kg'],
      ['Sold la final', formatNumber(metrics.horizonEndStockKg) + ' kg']
    ].map(item => '<div class="mini-card"><div class="k">' + item[0] + '</div><div class="v">' + item[1] + '</div></div>').join('');

    const start = Math.min(state.startWeek, state.endWeek);
    const end = Math.max(state.startWeek, state.endWeek);
    const rows = metrics.projections.filter(item => item.week >= start && item.week <= end);
    els.weeksBody.innerHTML = rows.map(item => {
      const pillClass = item.critical ? 'bad' : (item.demandKg > 0 ? 'ok' : 'info');
      const text = item.critical ? 'Neacoperit' : (item.demandKg > 0 ? 'Acoperit' : 'Fără cerere');
      return '<tr>' +
        '<td>WK ' + item.week + '</td>' +
        '<td class="right">' + formatNumber(item.demandKg) + '</td>' +
        '<td class="right">' + formatNumber(item.incomingKg) + '</td>' +
        '<td class="right"><strong>' + formatNumber(item.projectedKg) + '</strong></td>' +
        '<td><span class="pill ' + pillClass + '">' + text + '</span></td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="5" style="padding:18px;background:#fff">Nu există săptămâni în intervalul ales.</td></tr>';

    const groupOrders = state.orders.filter(order => order.key === group.key).slice().sort((a,b) => (a.week - b.week) || a.id.localeCompare(b.id));
    els.ordersList.innerHTML = groupOrders.length ? groupOrders.map(order => {
      const deleteBtn = state.canDelete ? '<button class="icon-btn danger" type="button" data-action="delete-order" data-id="' + escapeHtml(order.id) + '">✕</button>' : '';
      return '<div class="order-card">' +
        '<div class="order-main">' +
          '<div class="order-title">WK ' + order.week + ' • ' + formatNumber(order.qtyKg) + ' kg</div>' +
          '<div class="order-meta">' +
            (order.supplier ? ('Furnizor: ' + escapeHtml(order.supplier) + '<br>') : '') +
            (order.docRef ? ('PO / comandă: ' + escapeHtml(order.docRef) + '<br>') : '') +
            (order.note ? escapeHtml(order.note) : '<span class="muted">Fără notă</span>') +
          '</div>' +
        '</div>' + deleteBtn +
      '</div>';
    }).join('') : '<div class="empty">Nu există încă comenzi viitoare introduse pentru ' + escapeHtml(group.material + ' / ' + group.diametru) + '.</div>';

    els.sourceList.innerHTML = group.mappedItems.length ? group.mappedItems.map(item => '<div class="source-box"><div class="small"><strong>' + escapeHtml(item.stockItem) + '</strong></div><div class="small muted">Mapat pe reper ' + escapeHtml(item.reper) + '</div><div class="small">Piese: ' + formatNumber(item.pcsTotal) + ' • kg/buc: ' + formatNumber1(item.kgPerPiece) + '</div><div class="small">Stoc piese: ' + formatNumber(item.pieceStockKg) + ' kg • stoc oțel: ' + formatNumber(item.rawStockKg) + ' kg</div></div>').join('') : '<div class="empty" style="grid-column:1/-1">Nu am găsit mapare de stoc în STOCKS pentru acest grup.</div>';
  }
  function render(){
    if(!SEED) return;
    const groups = getVisibleGroups();
    ensureSelection();
    renderSummary(groups);
    renderGroupsTable(groups);
    renderDetail();
  }
  function addOrder(){
    if(!state.canEdit) return;
    const group = getSelectedGroup();
    if(!group){ alert('Selectează mai întâi un grup.'); return; }
    const qtyKg = Math.max(0, Number(els.orderQty.value || 0) || 0);
    if(!(qtyKg > 0)){ alert('Introdu o cantitate în kg.'); return; }
    const order = {
      id: 'mrc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7),
      key: group.key,
      material: group.material,
      diametru: group.diametru,
      week: Math.max(1, Math.min(52, Number(els.orderWeek.value || 1) || 1)),
      qtyKg,
      supplier: trimText(els.orderSupplier.value),
      docRef: trimText(els.orderDoc.value),
      note: trimText(els.orderNote.value)
    };
    state.orders.push(order);
    els.orderQty.value = '';
    els.orderSupplier.value = '';
    els.orderDoc.value = '';
    els.orderNote.value = '';
    queueSave();
    render();
  }
  function deleteOrder(id){
    if(!state.canDelete) return;
    state.orders = state.orders.filter(order => String(order.id) !== String(id));
    queueSave();
    render();
  }
  function bindEvents(){
    els.btnReload.addEventListener('click', async () => { await loadCloudDocument(); render(); });
    els.btnLogout.addEventListener('click', async () => { if(window.ERPAuth) await window.ERPAuth.signOut({ redirectTo:'login.html' }); });
    els.startWeek.addEventListener('change', () => { state.startWeek = Number(els.startWeek.value || 1) || 1; if(state.startWeek > state.endWeek){ state.endWeek = state.startWeek; els.endWeek.value = String(state.endWeek); } render(); });
    els.endWeek.addEventListener('change', () => { state.endWeek = Number(els.endWeek.value || 12) || 12; if(state.endWeek < state.startWeek){ state.startWeek = state.endWeek; els.startWeek.value = String(state.startWeek); } render(); });
    els.searchInput.addEventListener('input', () => { state.search = els.searchInput.value || ''; render(); });
    els.onlyCritical.addEventListener('change', () => { state.onlyCritical = !!els.onlyCritical.checked; render(); });
    els.btnAddOrder.addEventListener('click', addOrder);
    els.groupsBody.addEventListener('click', (event) => { const row = event.target.closest('[data-key]'); if(!row) return; state.selectedKey = row.getAttribute('data-key') || ''; render(); });
    els.ordersList.addEventListener('click', (event) => { const btn = event.target.closest('[data-action="delete-order"]'); if(!btn) return; deleteOrder(btn.getAttribute('data-id')); });
  }

  async function init(){
    if(!loadSeedUi()) return;
    bindEvents();
    await initAuth();
    await loadCloudDocument();
    const visible = getVisibleGroups();
    if(visible.length){ state.selectedKey = visible[0].key; }
    render();
  }

  init();
})();
