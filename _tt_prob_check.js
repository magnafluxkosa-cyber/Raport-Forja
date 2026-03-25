(() => {
      'use strict';

      const DOC_KEY = 'tratament-termic-probleme';
      const LOCAL_KEY = 'kad_tratament_termic_probleme_v1';
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
        statMinutes: document.getElementById('statMinutes'),
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
        fldCategorie: document.getElementById('fldCategorie'),
        fldMinute: document.getElementById('fldMinute'),
        fldProblema: document.getElementById('fldProblema'),
        fldReper: document.getElementById('fldReper'),
        fldSarja: document.getElementById('fldSarja'),
        fldObservatii: document.getElementById('fldObservatii'),
        operatorList: document.getElementById('operatorList'),
        reperList: document.getElementById('reperList')
      };

      const state = {
        auth: null,
        rows: [],
        selectedId: null,
        updatedAt: null,
        saveTimer: null,
        operators: [],
        repere: []
      };

      function toStr(value) {
        return String(value == null ? '' : value).trim();
      }

      function toNumber(value) {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const clean = String(value == null ? '' : value).replace(/\s+/g, '').replace(',', '.').trim();
        const num = Number(clean);
        return Number.isFinite(num) ? num : 0;
      }

      function uid() {
        return 'tt-prob-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
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

      function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[ch]));
      }

      function setChip(el, text, kind) {
        if (!el) return;
        const dotClass = kind === 'ok' ? 'success' : kind === 'bad' ? 'danger' : 'warning';
        el.innerHTML = '<span class="dot ' + dotClass + '"></span><span>' + escapeHtml(text) + '</span>';
      }

      function formatNumber(value, digits) {
        const num = Number(value || 0);
        const useDigits = Number.isFinite(digits) ? digits : 0;
        return new Intl.NumberFormat('ro-RO', {
          minimumFractionDigits: useDigits,
          maximumFractionDigits: useDigits
        }).format(num);
      }

      function formatDateDisplay(value) {
        const clean = toStr(value);
        if (!clean) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          const [y, m, d] = clean.split('-');
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

      function syncYearMonthFromDate() {
        const clean = toStr(els.fldData.value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          els.fldAn.value = '';
          els.fldLuna.value = '';
          return;
        }
        const [y, m] = clean.split('-');
        els.fldAn.value = y;
        els.fldLuna.value = MONTHS[Number(m) - 1] || '';
      }

      function isActiveRow(value) {
        return !(value === false || value === 0 || String(value).toLowerCase() === 'false');
      }

      function normalizeRow(row) {
        const base = {
          id: toStr(row && row.id) || uid(),
          an: toStr(row && row.an),
          luna: toStr(row && row.luna),
          data: toStr(row && row.data),
          schimbul: toStr(row && row.schimbul),
          operator: toStr(row && row.operator),
          categorie: toStr(row && row.categorie),
          minute: toNumber(row && row.minute),
          problema: toStr(row && row.problema),
          reper: toStr(row && row.reper),
          sarja: toStr(row && row.sarja),
          observatii: toStr(row && row.observatii),
          updated_at: toStr(row && row.updated_at) || nowIso()
        };
        return base;
      }

      function sortRows(rows) {
        return rows.slice().sort((a, b) => {
          const da = toStr(a.data);
          const db = toStr(b.data);
          if (da !== db) return db.localeCompare(da);
          const sa = toStr(a.schimbul);
          const sb = toStr(b.schimbul);
          if (sa !== sb) return sa.localeCompare(sb, 'ro', { numeric: true });
          const oa = toStr(a.operator);
          const ob = toStr(b.operator);
          if (oa !== ob) return oa.localeCompare(ob, 'ro');
          return a.updated_at.localeCompare(b.updated_at);
        });
      }

      function payloadFromRows(rows) {
        return {
          rows: sortRows((rows || []).map(normalizeRow)),
          updated_at: nowIso()
        };
      }

      function renderLookupLists() {
        const operatorValues = Array.from(new Set((state.operators || []).concat(state.rows.map((row) => row.operator)).map(toStr).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ro'));
        const reperValues = Array.from(new Set((state.repere || []).concat(state.rows.map((row) => row.reper)).map(toStr).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ro'));
        els.operatorList.innerHTML = operatorValues.map((value) => '<option value="' + escapeHtml(value) + '"></option>').join('');
        els.reperList.innerHTML = reperValues.map((value) => '<option value="' + escapeHtml(value) + '"></option>').join('');
      }

      async function createSupabase() {
        if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
          try { return window.ERPAuth.getSupabaseClient(); } catch (_) { return null; }
        }
        return null;
      }

      async function loadHelperSources() {
        state.operators = [];
        state.repere = [];
        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) {
          renderLookupLists();
          return;
        }

        try {
          const [operatorsRes, repereRes] = await Promise.all([
            sb.from('rf_helper_items')
              .select('label,code,sort_order,is_active,module_key,category_key')
              .eq('module_key', 'magnaflux')
              .eq('category_key', 'operatori')
              .order('sort_order', { ascending: true }),
            sb.from('rf_helper_repere_forjate')
              .select('reper_forjat,sort_order,is_active')
              .order('sort_order', { ascending: true })
          ]);

          if (operatorsRes.error) throw operatorsRes.error;
          if (repereRes.error) throw repereRes.error;

          state.operators = (operatorsRes.data || [])
            .filter((row) => isActiveRow(row.is_active))
            .map((row) => toStr(row.label || row.code))
            .filter(Boolean);

          state.repere = (repereRes.data || [])
            .filter((row) => isActiveRow(row.is_active))
            .map((row) => toStr(row.reper_forjat))
            .filter(Boolean);
        } catch (error) {
          console.error('Nu am putut încărca listele helper pentru Probleme T.T:', error);
        }

        renderLookupLists();
      }

      function readForm() {
        syncYearMonthFromDate();
        return normalizeRow({
          id: state.selectedId || uid(),
          an: els.fldAn.value,
          luna: els.fldLuna.value,
          data: els.fldData.value,
          schimbul: els.fldSchimbul.value,
          operator: els.fldOperator.value,
          categorie: els.fldCategorie.value,
          minute: els.fldMinute.value,
          problema: els.fldProblema.value,
          reper: els.fldReper.value,
          sarja: els.fldSarja.value,
          observatii: els.fldObservatii.value,
          updated_at: nowIso()
        });
      }

      function validateRow(row) {
        if (!toStr(row.data)) return 'Completează câmpul Data.';
        if (!toStr(row.an)) return 'Completează câmpul An.';
        if (!toStr(row.luna)) return 'Completează câmpul Lună.';
        if (!toStr(row.schimbul)) return 'Completează câmpul Schimbul.';
        if (!toStr(row.operator)) return 'Completează câmpul Operator.';
        if (!toStr(row.categorie)) return 'Completează câmpul Categoria problemei.';
        if (toNumber(row.minute) <= 0) return 'Minutele trebuie să fie mai mari decât 0.';
        if (!toStr(row.problema)) return 'Completează câmpul Problemă în schimb.';
        return '';
      }

      function fillForm(row) {
        const source = normalizeRow(row || {});
        els.fldAn.value = source.an;
        els.fldLuna.value = source.luna;
        els.fldData.value = source.data;
        els.fldSchimbul.value = source.schimbul;
        els.fldOperator.value = source.operator;
        els.fldCategorie.value = source.categorie;
        els.fldMinute.value = source.minute ? String(source.minute) : '';
        els.fldProblema.value = source.problema;
        els.fldReper.value = source.reper;
        els.fldSarja.value = source.sarja;
        els.fldObservatii.value = source.observatii;
        updateFormNote();
      }

      function setDefaults() {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        els.fldData.value = y + '-' + m + '-' + d;
        syncYearMonthFromDate();
        if (!els.fldSchimbul.value) els.fldSchimbul.value = '1';
      }

      function clearForm() {
        state.selectedId = null;
        els.fldAn.value = '';
        els.fldLuna.value = '';
        els.fldData.value = '';
        els.fldSchimbul.value = '';
        els.fldOperator.value = '';
        els.fldCategorie.value = '';
        els.fldMinute.value = '';
        els.fldProblema.value = '';
        els.fldReper.value = '';
        els.fldSarja.value = '';
        els.fldObservatii.value = '';
        setDefaults();
        updateSelectionUi();
        updateFormNote();
        renderTable();
        requestAnimationFrame(() => {
          try { els.fldData.focus(); } catch (_) {}
        });
      }

      function updateSelectionUi() {
        const row = state.rows.find((item) => item.id === state.selectedId) || null;
        if (row) {
          setChip(els.selectChip, 'Rând selectat: ' + [row.data ? formatDateDisplay(row.data) : '', row.categorie].filter(Boolean).join(' • '), 'ok');
        } else {
          setChip(els.selectChip, 'Rând selectat: niciunul', 'warn');
        }
        els.btnDelete.disabled = !row || !canEdit();
      }

      function updateFormNote() {
        const modeText = state.selectedId ? 'Mod editare: actualizare rând selectat' : 'Mod editare: rând nou';
        const category = toStr(els.fldCategorie.value);
        const minute = toNumber(els.fldMinute.value);
        if (category && minute > 0) {
          els.formNote.textContent = modeText + ' • Problema se salvează ca „' + category + '” cu ' + formatNumber(minute, 0) + ' minute înregistrate pentru schimbul selectat.';
          return;
        }
        els.formNote.textContent = modeText + ' • Minutele și descrierea problemei se salvează separat de raportul principal T.T.';
      }

      function renderStats() {
        els.statRows.textContent = String(state.rows.length);
        const totalMinutes = state.rows.reduce((sum, row) => sum + toNumber(row.minute), 0);
        els.statMinutes.textContent = formatNumber(totalMinutes, 0);
        els.statUpdated.textContent = formatDateTimeDisplay(state.updatedAt);
      }

      function renderTable() {
        const rows = sortRows(state.rows.map(normalizeRow));
        if (!rows.length) {
          els.tbodyRows.innerHTML = '<tr><td colspan="11" class="empty">Nu există probleme salvate.</td></tr>';
          renderStats();
          updateSelectionUi();
          renderLookupLists();
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
            '<td>' + escapeHtml(row.categorie) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.minute, 0)) + '</td>' +
            '<td>' + escapeHtml(row.problema) + '</td>' +
            '<td>' + escapeHtml(row.reper) + '</td>' +
            '<td>' + escapeHtml(row.sarja) + '</td>' +
            '<td>' + escapeHtml(row.observatii) + '</td>' +
          '</tr>';
        }).join('');

        renderStats();
        updateSelectionUi();
        renderLookupLists();
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
          els.fldData, els.fldSchimbul, els.fldOperator, els.fldCategorie,
          els.fldMinute, els.fldProblema, els.fldReper, els.fldSarja, els.fldObservatii
        ].forEach((el) => { el.disabled = readonly; });
        els.btnSaveRow.disabled = readonly;
        els.btnNew.disabled = readonly;
        els.btnDelete.disabled = readonly || !state.selectedId;
        els.readonlyBanner.classList.toggle('show', readonly);
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
        state.rows = payload.rows.map(normalizeRow);
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
        const row = readForm();
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
        const label = row.problema || row.categorie || 'rândul selectat';
        const ok = confirm('Ștergi problema „' + label + '”?');
        if (!ok) return;
        state.rows = state.rows.filter((item) => item.id !== state.selectedId);
        clearForm();
        renderTable();
        queueSave();
      }

      async function initAuth() {
        try {
          const auth = await window.ERPAuth.requireAuth({ redirectToLogin: true, next: 'tratament-termic-probleme.html' });
          if (!auth) return false;
          state.auth = auth;
          setChip(els.authChip, 'Autentificare: activă', 'ok');
          const roleLabel = window.ERPAuth && typeof window.ERPAuth.roleLabel === 'function'
            ? window.ERPAuth.roleLabel(auth.role)
            : auth.role;
          setChip(els.roleChip, 'Rol: ' + roleLabel, 'ok');
          setReadonlyMode(!canEdit());
          return true;
        } catch (error) {
          console.error(error);
          setChip(els.authChip, 'Autentificare: eroare', 'bad');
          setChip(els.roleChip, 'Rol: necunoscut', 'bad');
          return false;
        }
      }

      function bindActions() {
        els.btnSaveRow.addEventListener('click', upsertRow);
        els.btnNew.addEventListener('click', (event) => {
          if (event) {
            if (typeof event.preventDefault === 'function') event.preventDefault();
            if (typeof event.stopPropagation === 'function') event.stopPropagation();
          }
          clearForm();
        });
        els.btnReload.addEventListener('click', () => { window.location.reload(); });
        els.btnCloudSave.addEventListener('click', () => { saveToCloud(true); });
        els.btnDelete.addEventListener('click', deleteSelected);
        els.fldData.addEventListener('input', () => {
          syncYearMonthFromDate();
          updateFormNote();
        });
        [els.fldSchimbul, els.fldOperator, els.fldCategorie, els.fldMinute, els.fldProblema].forEach((el) => {
          el.addEventListener('input', updateFormNote);
          el.addEventListener('change', updateFormNote);
        });
        bindRowClicks();
      }

      function bindKeyboardFlow() {
        const ordered = [
          els.fldData, els.fldSchimbul, els.fldOperator, els.fldCategorie,
          els.fldMinute, els.fldProblema, els.fldReper, els.fldSarja, els.fldObservatii
        ];
        ordered.forEach((el, index) => {
          el.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            if (el.tagName === 'TEXTAREA') return;
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
        setDefaults();
        updateFormNote();
        bindActions();
        bindKeyboardFlow();
        const authOk = await initAuth();
        if (!authOk) return;
        await loadHelperSources();
        await loadFromCloudOrLocal();
        renderLookupLists();
      }

      init();
    })();
