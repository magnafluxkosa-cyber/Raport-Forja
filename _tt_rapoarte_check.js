
    (() => {
      'use strict';

      const DOC_KEY = 'tratament-termic-rapoarte';
      const LOCAL_KEY = 'kad_tratament_termic_rapoarte_v1';
      const SAVE_DEBOUNCE_MS = 250;
      const MONTHS = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
      ];

      const els = {
        authChip: document.getElementById('authChip'),
        roleChip: document.getElementById('roleChip'),
        cloudChip: document.getElementById('cloudChip'),
        selectChip: document.getElementById('selectChip'),
        statRows: document.getElementById('statRows'),
        statQty: document.getElementById('statQty'),
        statUpdated: document.getElementById('statUpdated'),
        btnReload: document.getElementById('btnReload'),
        btnCloudSave: document.getElementById('btnCloudSave'),
        btnSaveRow: document.getElementById('btnSaveRow'),
        btnNew: document.getElementById('btnNew'),
        btnDelete: document.getElementById('btnDelete'),
        formNote: document.getElementById('formNote'),
        tbodyRows: document.getElementById('tbodyRows'),
        readonlyBanner: document.getElementById('readonlyBanner'),
        fldAn: document.getElementById('fldAn'),
        fldLuna: document.getElementById('fldLuna'),
        fldData: document.getElementById('fldData'),
        fldSchimbul: document.getElementById('fldSchimbul'),
        fldOperator: document.getElementById('fldOperator'),
        fldReper: document.getElementById('fldReper'),
        fldSarja: document.getElementById('fldSarja'),
        fldCantitate: document.getElementById('fldCantitate')
      };

      const state = {
        auth: null,
        rows: [],
        selectedId: null,
        updatedAt: null,
        saveTimer: null
      };

      function toStr(value) {
        return String(value == null ? '' : value).trim();
      }

      function toNumber(value) {
        const clean = String(value == null ? '' : value).replace(',', '.').trim();
        const num = Number(clean);
        return Number.isFinite(num) ? num : 0;
      }

      function uid() {
        return 'tt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      }

      function nowIso() {
        return new Date().toISOString();
      }

      function currentRole() {
        return String((state.auth && state.auth.role) || 'viewer').toLowerCase();
      }

      function canEdit() {
        return ['admin', 'editor', 'operator'].includes(currentRole());
      }

      function setChip(el, text, kind) {
        if (!el) return;
        const dotClass = kind === 'ok' ? 'success' : kind === 'bad' ? 'danger' : 'warning';
        el.innerHTML = '<span class="dot ' + dotClass + '"></span><span>' + escapeHtml(text) + '</span>';
      }

      function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[ch]));
      }

      function formatNumber(value) {
        const num = toNumber(value);
        return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(num);
      }

      function formatDateDisplay(value) {
        const clean = toStr(value);
        if (!clean) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          const [y, m, d] = clean.split('-');
          return d + '.' + m + '.' + y;
        }
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(clean)) {
          return clean;
        }
        const date = new Date(clean);
        if (!Number.isNaN(date.getTime())) {
          const d = String(date.getDate()).padStart(2, '0');
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = date.getFullYear();
          return d + '.' + m + '.' + y;
        }
        return clean;
      }

      function formatDateTimeDisplay(value) {
        const clean = toStr(value);
        if (!clean) return '—';
        const date = new Date(clean);
        if (Number.isNaN(date.getTime())) return clean;
        return new Intl.DateTimeFormat('ro-RO', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(date);
      }

      function dateSortValue(value) {
        const clean = toStr(value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(clean)) {
          const [d, m, y] = clean.split('.');
          return y + '-' + m + '-' + d;
        }
        return clean;
      }

      function normalizeRow(row) {
        return {
          id: row && row.id ? String(row.id) : uid(),
          an: toStr(row && row.an),
          luna: toStr(row && row.luna),
          data: toStr(row && row.data),
          schimbul: toStr(row && row.schimbul),
          operator: toStr(row && row.operator),
          reper: toStr(row && row.reper),
          sarja: toStr(row && row.sarja),
          cantitate: toNumber(row && row.cantitate)
        };
      }

      function sortRows(rows) {
        return rows.slice().sort((a, b) => {
          const da = dateSortValue(a.data);
          const db = dateSortValue(b.data);
          if (da !== db) return db.localeCompare(da);
          const aa = toStr(a.an);
          const ab = toStr(b.an);
          if (aa !== ab) return ab.localeCompare(aa, 'ro');
          const la = toStr(a.luna);
          const lb = toStr(b.luna);
          if (la !== lb) return la.localeCompare(lb, 'ro');
          return toStr(a.reper).localeCompare(toStr(b.reper), 'ro');
        });
      }

      function payloadFromRows(rows) {
        return { rows: rows.map(normalizeRow), updated_at: nowIso() };
      }

      function setDefaults() {
        const now = new Date();
        if (!els.fldAn.value) els.fldAn.value = String(now.getFullYear());
        if (!els.fldLuna.value) els.fldLuna.value = MONTHS[now.getMonth()];
        if (!els.fldData.value) els.fldData.value = now.toISOString().slice(0, 10);
        if (!els.fldSchimbul.value) els.fldSchimbul.value = '1';
      }

      function fillMonths() {
        els.fldLuna.innerHTML = '<option value=""></option>' + MONTHS.map((month) => '<option value="' + escapeHtml(month) + '">' + escapeHtml(month) + '</option>').join('');
      }

      function readForm() {
        return normalizeRow({
          id: state.selectedId || uid(),
          an: els.fldAn.value,
          luna: els.fldLuna.value,
          data: els.fldData.value,
          schimbul: els.fldSchimbul.value,
          operator: els.fldOperator.value,
          reper: els.fldReper.value,
          sarja: els.fldSarja.value,
          cantitate: els.fldCantitate.value
        });
      }

      function validateRow(row) {
        if (!toStr(row.an)) return 'Completează câmpul An.';
        if (!toStr(row.luna)) return 'Completează câmpul Lună.';
        if (!toStr(row.data)) return 'Completează câmpul Data.';
        if (!toStr(row.schimbul)) return 'Completează câmpul Schimbul.';
        if (!toStr(row.operator)) return 'Completează câmpul Operator.';
        if (!toStr(row.reper)) return 'Completează câmpul Reper.';
        if (!toStr(row.sarja)) return 'Completează câmpul Sarjă.';
        if (toNumber(row.cantitate) <= 0) return 'Cantitatea trebuie să fie mai mare decât 0.';
        return '';
      }

      function fillForm(row) {
        const source = normalizeRow(row || {});
        els.fldAn.value = source.an;
        els.fldLuna.value = source.luna;
        els.fldData.value = source.data;
        els.fldSchimbul.value = source.schimbul;
        els.fldOperator.value = source.operator;
        els.fldReper.value = source.reper;
        els.fldSarja.value = source.sarja;
        els.fldCantitate.value = source.cantitate ? String(source.cantitate) : '';
      }

      function clearForm() {
        state.selectedId = null;
        fillForm({});
        setDefaults();
        updateSelectionUi();
      }

      function updateSelectionUi() {
        const row = state.rows.find((item) => item.id === state.selectedId) || null;
        if (row) {
          setChip(els.selectChip, 'Rând selectat: ' + [row.data ? formatDateDisplay(row.data) : '', row.reper].filter(Boolean).join(' • '), 'ok');
          els.formNote.textContent = 'Mod editare: actualizare rând selectat';
        } else {
          setChip(els.selectChip, 'Rând selectat: niciunul', 'warn');
          els.formNote.textContent = 'Mod editare: rând nou';
        }
        els.btnDelete.disabled = !row || !canEdit();
      }

      function renderStats() {
        els.statRows.textContent = String(state.rows.length);
        const totalQty = state.rows.reduce((sum, row) => sum + toNumber(row.cantitate), 0);
        els.statQty.textContent = formatNumber(totalQty);
        els.statUpdated.textContent = formatDateTimeDisplay(state.updatedAt);
      }

      function renderTable() {
        const rows = sortRows(state.rows);
        if (!rows.length) {
          els.tbodyRows.innerHTML = '<tr><td colspan="8" class="empty">Nu există rânduri salvate.</td></tr>';
          renderStats();
          updateSelectionUi();
          return;
        }

        els.tbodyRows.innerHTML = rows.map((row) => {
          const selectedClass = row.id === state.selectedId ? ' class="selected"' : '';
          return '<tr data-id="' + escapeHtml(row.id) + '"' + selectedClass + '>' +
            '<td class="center">' + escapeHtml(row.an) + '</td>' +
            '<td class="center">' + escapeHtml(row.luna) + '</td>' +
            '<td class="center">' + escapeHtml(formatDateDisplay(row.data)) + '</td>' +
            '<td class="center">' + escapeHtml(row.schimbul) + '</td>' +
            '<td>' + escapeHtml(row.operator) + '</td>' +
            '<td>' + escapeHtml(row.reper) + '</td>' +
            '<td>' + escapeHtml(row.sarja) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.cantitate)) + '</td>' +
          '</tr>';
        }).join('');

        renderStats();
        updateSelectionUi();
      }

      function bindRowClicks() {
        els.tbodyRows.addEventListener('click', (event) => {
          const tr = event.target.closest('tr[data-id]');
          if (!tr) return;
          state.selectedId = tr.getAttribute('data-id');
          const row = state.rows.find((item) => item.id === state.selectedId);
          if (row) fillForm(row);
          renderTable();
        });
      }

      function setReadonlyMode(readonly) {
        [
          els.fldAn, els.fldLuna, els.fldData, els.fldSchimbul,
          els.fldOperator, els.fldReper, els.fldSarja, els.fldCantitate
        ].forEach((el) => { el.disabled = readonly; });
        els.btnSaveRow.disabled = readonly;
        els.btnNew.disabled = readonly;
        els.btnDelete.disabled = readonly || !state.selectedId;
        els.readonlyBanner.classList.toggle('show', readonly);
      }

      async function createSupabase() {
        if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
          try { return window.ERPAuth.getSupabaseClient(); } catch (_) { return null; }
        }
        return null;
      }

      async function loadFromCloudOrLocal() {
        let localRows = [];
        let localUpdatedAt = null;
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            const sourceRows = Array.isArray(parsed && parsed.rows) ? parsed.rows : [];
            localRows = sourceRows.map(normalizeRow);
            localUpdatedAt = parsed.updated_at || null;
          }
        } catch (_) {}

        let rows = localRows.slice();
        let updatedAt = localUpdatedAt;

        const sb = await createSupabase();
        if (sb && state.auth && state.auth.user) {
          try {
            const { data, error } = await sb.from('rf_documents').select('doc_key,content,updated_at').eq('doc_key', DOC_KEY).maybeSingle();
            if (error) throw error;
            if (data && data.content && Array.isArray(data.content.rows)) {
              rows = data.content.rows.map(normalizeRow);
              updatedAt = data.updated_at || data.content.updated_at || updatedAt;
              try {
                localStorage.setItem(LOCAL_KEY, JSON.stringify({ rows, updated_at: updatedAt }));
              } catch (_) {}
              setChip(els.cloudChip, 'Cloud: sincronizat', 'ok');
            } else if (rows.length) {
              setChip(els.cloudChip, 'Cloud: încărcat din local', 'warn');
            } else {
              setChip(els.cloudChip, 'Cloud: fără date salvate', 'warn');
            }
          } catch (error) {
            console.error(error);
            setChip(els.cloudChip, 'Cloud: eroare la încărcare', 'bad');
          }
        } else if (rows.length) {
          setChip(els.cloudChip, 'Cloud: folosește datele locale', 'warn');
        } else {
          setChip(els.cloudChip, 'Cloud: neautentificat', 'warn');
        }

        state.rows = rows.map(normalizeRow);
        state.updatedAt = updatedAt;
        renderTable();
      }

      async function saveToCloud(showSuccessChip = true) {
        const payload = payloadFromRows(state.rows);
        state.updatedAt = payload.updated_at;
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
        } catch (_) {}

        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) {
          setChip(els.cloudChip, 'Cloud: salvat doar local', 'warn');
          renderStats();
          return false;
        }

        try {
          const { error } = await sb.from('rf_documents').upsert({
            doc_key: DOC_KEY,
            content: payload,
            updated_at: payload.updated_at
          }, { onConflict: 'doc_key' });
          if (error) throw error;
          if (showSuccessChip) setChip(els.cloudChip, 'Cloud: sincronizat', 'ok');
          renderStats();
          return true;
        } catch (error) {
          console.error(error);
          setChip(els.cloudChip, 'Cloud: eroare salvare', 'bad');
          renderStats();
          return false;
        }
      }

      function queueSave() {
        clearTimeout(state.saveTimer);
        state.saveTimer = setTimeout(() => { saveToCloud(false); }, SAVE_DEBOUNCE_MS);
      }

      function upsertRow(event) {
        if (event) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          if (typeof event.stopPropagation === 'function') event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }
        if (!canEdit()) return false;
        let row = readForm();
        if (isFullShiftWithoutProduction(row)) {
          row = normalizeRow(Object.assign({}, row, { reper: '', sarja: '', cantitate: 0 }));
        }
        const validationMessage = validateRow(row);
        if (validationMessage) {
          alert(validationMessage);
          return false;
        }

        const existingIndex = state.rows.findIndex((item) => item.id === state.selectedId);
        if (existingIndex >= 0) {
          state.rows.splice(existingIndex, 1, row);
        } else {
          state.rows.push(row);
          state.selectedId = row.id;
        }

        renderTable();
        queueSave();
        return false;
      }

      function deleteSelected() {
        if (!canEdit()) return;
        if (!state.selectedId) {
          alert('Selectează mai întâi un rând.');
          return;
        }
        const row = state.rows.find((item) => item.id === state.selectedId);
        if (!row) return;
        const ok = confirm('Ștergi rândul pentru reperul „' + row.reper + '”?');
        if (!ok) return;
        state.rows = state.rows.filter((item) => item.id !== state.selectedId);
        clearForm();
        renderTable();
        queueSave();
      }

      async function initAuth() {
        try {
          const auth = await window.ERPAuth.requireAuth({ redirectToLogin: true, next: 'tratament-termic-rapoarte.html' });
          if (!auth) return false;
          state.auth = auth;
          setChip(els.authChip, 'Autentificare: activă', 'ok');
          const roleLabel = window.ERPAuth && typeof window.ERPAuth.roleLabel === 'function'
            ? window.ERPAuth.roleLabel(auth.role)
            : auth.role;
          setChip(els.roleChip, 'Cont: ' + roleLabel, 'ok');
          setReadonlyMode(!canEdit());
          return true;
        } catch (error) {
          console.error(error);
          setChip(els.authChip, 'Autentificare: eroare', 'bad');
          setChip(els.roleChip, 'Cont: necunoscut', 'bad');
          return false;
        }
      }

      function bindActions() {
        els.btnReload.addEventListener('click', () => { window.location.reload(); });
        els.btnCloudSave.addEventListener('click', () => { saveToCloud(true); });
        els.btnDelete.addEventListener('click', deleteSelected);
        bindRowClicks();
      }

      function bindKeyboardFlow() {
        const ordered = [
          els.fldAn, els.fldLuna, els.fldData, els.fldSchimbul,
          els.fldOperator, els.fldReper, els.fldSarja, els.fldCantitate
        ];
        ordered.forEach((el, index) => {
          el.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (index === ordered.length - 1) {
              if (canEdit()) upsertRow();
              return;
            }
            ordered[index + 1].focus();
            if (typeof ordered[index + 1].select === 'function') ordered[index + 1].select();
          });
        });
      }

      async function init() {
        fillMonths();
        setDefaults();
        bindActions();
        bindKeyboardFlow();
        const ok = await initAuth();
        if (!ok) return;
        await loadFromCloudOrLocal();
        clearForm();
      }

      init();
    })();
  