
    (() => {
      'use strict';

      const DOC_KEY = 'tratament-termic-rapoarte';
      const LOCAL_KEY = 'kad_tratament_termic_rapoarte_v2';
      const LEGACY_LOCAL_KEY = 'kad_tratament_termic_rapoarte_v1';
      const SAVE_DEBOUNCE_MS = 250;
      const MONTHS = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
      ];
      const TREATMENT_RULES = [{"reper":"106-1625","kg_piesa":4.6,"tact_sec":540,"cant_cos":34},{"reper":"106-1626","kg_piesa":4.6,"tact_sec":540,"cant_cos":34},{"reper":"229-6909","kg_piesa":4.419,"tact_sec":540,"cant_cos":34},{"reper":"229-6910","kg_piesa":4.419,"tact_sec":540,"cant_cos":34},{"reper":"378-8241","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"378-8242","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"248-2307","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"248-2308","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"503-0761","kg_piesa":8.19,"tact_sec":540,"cant_cos":22},{"reper":"503-0762","kg_piesa":8.19,"tact_sec":540,"cant_cos":22},{"reper":"9K-6628","kg_piesa":2.8075,"tact_sec":540,"cant_cos":48},{"reper":"9K-6629","kg_piesa":2.8075,"tact_sec":540,"cant_cos":48},{"reper":"9P-9664/65","kg_piesa":2.95,"tact_sec":540,"cant_cos":45},{"reper":"7G-0521/22","kg_piesa":1.51,"tact_sec":540,"cant_cos":65},{"reper":"7G-2532/34","kg_piesa":1.77,"tact_sec":540,"cant_cos":60},{"reper":"358-5253/55","kg_piesa":2.38,"tact_sec":540,"cant_cos":55},{"reper":"SK-203034","kg_piesa":24.3,"tact_sec":660,"cant_cos":5},{"reper":"418-2091","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"418-2092","kg_piesa":6.25,"tact_sec":540,"cant_cos":30},{"reper":"417-3595","kg_piesa":4.6,"tact_sec":540,"cant_cos":34},{"reper":"417-3596","kg_piesa":4.6,"tact_sec":540,"cant_cos":34}];

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
        fldCantitate: document.getElementById('fldCantitate'),
        fldOre: document.getElementById('fldOre'),
        fldOpriri: document.getElementById('fldOpriri'),
        fldMentenanta: document.getElementById('fldMentenanta'),
        fldIncalzire: document.getElementById('fldIncalzire'),
        fldGolire: document.getElementById('fldGolire'),
        operatorList: document.getElementById('operatorList'),
        reperList: document.getElementById('reperList')
      };

      const state = {
        auth: null,
        rows: [],
        selectedId: null,
        updatedAt: null,
        saveTimer: null,
        helpersLoaded: false,
        operators: [],
        repere: [],
        ttRuleMap: new Map()
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

      function round2(value) {
        return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
      }

      function normalizeText(value) {
        return toStr(value)
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, ' ')
          .toUpperCase();
      }

      function normalizeCode(value) {
        return normalizeText(value).replace(/\s+/g, '');
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

      function isActiveRow(value) {
        return !(value === false || value === 0 || String(value).toLowerCase() === 'false');
      }

      function buildTreatmentRuleMap() {
        const map = new Map();
        TREATMENT_RULES.forEach((rule) => {
          const reper = toStr(rule.reper);
          if (!reper) return;
          map.set(normalizeCode(reper), {
            reper,
            kg_piesa: toNumber(rule.kg_piesa),
            tact_sec: toNumber(rule.tact_sec),
            tact_min: round2(toNumber(rule.tact_sec) / 60),
            cant_cos: toNumber(rule.cant_cos),
            buc_ora: round2((60 / (toNumber(rule.tact_sec) / 60)) * toNumber(rule.cant_cos))
          });
        });
        state.ttRuleMap = map;
      }

      function getTreatmentRule(reper) {
        return state.ttRuleMap.get(normalizeCode(reper)) || null;
      }

      function getMonthNameFromDateInput(value) {
        const clean = toStr(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return '';
        const monthIndex = Number(clean.slice(5, 7)) - 1;
        return MONTHS[monthIndex] || '';
      }

      function syncYearMonthFromDate() {
        const clean = toStr(els.fldData.value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return;
        els.fldAn.value = clean.slice(0, 4);
        els.fldLuna.value = getMonthNameFromDateInput(clean);
      }

      function isFullShiftWithoutProduction(row) {
        const coverage = getIssueCoverageDetails(row);
        return coverage.fullShiftCovered;
      }

      function calculateOreDetails(source) {
        const row = source || {};
        const cantitate = toNumber(row.cantitate);
        const opriri = toNumber(row.opriri_neplanificate);
        const incalzire = toNumber(row.incalzire);
        const golire = toNumber(row.golire);
        const rule = getTreatmentRule(row.reper);
        let procesMinute = 0;
        if (rule && rule.cant_cos > 0 && rule.tact_sec > 0 && cantitate > 0) {
          procesMinute = (cantitate / rule.cant_cos) * (rule.tact_sec / 60);
        }
        const minuteConsumate = procesMinute + opriri + incalzire + golire;
        return {
          rule,
          procesMinute: round2(procesMinute),
          minuteConsumate: round2(minuteConsumate),
          ore: round2(minuteConsumate / 60)
        };
      }

      function normalizeRow(row) {
        const base = {
          id: row && row.id ? String(row.id) : uid(),
          an: toStr(row && row.an),
          luna: toStr(row && row.luna),
          data: toStr(row && row.data),
          schimbul: toStr(row && row.schimbul),
          operator: toStr(row && row.operator),
          reper: toStr(row && row.reper),
          sarja: toStr(row && row.sarja),
          cantitate: toNumber(row && row.cantitate),
          ore: toNumber(row && row.ore),
          opriri_neplanificate: toNumber(row && row.opriri_neplanificate),
          mentenanta: toNumber(row && row.mentenanta),
          incalzire: toNumber(row && row.incalzire),
          golire: toNumber(row && row.golire)
        };
        if (isFullShiftWithoutProduction(base)) {
          base.reper = '';
          base.sarja = '';
          base.cantitate = 0;
        }
        const calc = calculateOreDetails(base);
        if (calc.rule || base.cantitate || base.opriri_neplanificate || base.mentenanta || base.incalzire || base.golire) {
          base.ore = calc.ore;
        }
        return base;
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
        const normalizedRows = rows.map(normalizeRow);
        return { rows: normalizedRows, updated_at: nowIso() };
      }

      function fillMonths() {
        els.fldLuna.innerHTML = '<option value=""></option>' + MONTHS.map((month) => '<option value="' + escapeHtml(month) + '">' + escapeHtml(month) + '</option>').join('');
      }

      function setDefaults() {
        const now = new Date();
        if (!els.fldData.value) els.fldData.value = now.toISOString().slice(0, 10);
        syncYearMonthFromDate();
        if (!els.fldSchimbul.value) els.fldSchimbul.value = '1';
      }

      function renderLookupLists() {
        const operatorValues = Array.from(new Set((state.operators || []).concat(state.rows.map((row) => row.operator)).map(toStr).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'ro'));
        const reperValues = Array.from(new Set((state.repere || []).concat(TREATMENT_RULES.map((rule) => rule.reper)).concat(state.rows.map((row) => row.reper)).map(toStr).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'ro'));

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
        buildTreatmentRuleMap();
        state.operators = [];
        state.repere = TREATMENT_RULES.map((rule) => rule.reper);
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

          const helperRepere = (repereRes.data || [])
            .filter((row) => isActiveRow(row.is_active))
            .map((row) => toStr(row.reper_forjat))
            .filter(Boolean);

          state.repere = Array.from(new Set(state.repere.concat(helperRepere)));
          state.helpersLoaded = true;
        } catch (error) {
          console.error('Nu am putut încărca listele helper pentru tratament termic:', error);
        }

        renderLookupLists();
      }

      function readForm() {
        syncYearMonthFromDate();
        const coveragePreview = getIssueCoverageDetails({
          opriri_neplanificate: els.fldOpriri.value,
          mentenanta: els.fldMentenanta.value,
          incalzire: els.fldIncalzire.value,
          golire: els.fldGolire.value
        });
        const fullShiftCovered = coveragePreview.fullShiftCovered;
        const base = {
          id: state.selectedId || uid(),
          an: els.fldAn.value,
          luna: els.fldLuna.value,
          data: els.fldData.value,
          schimbul: els.fldSchimbul.value,
          operator: els.fldOperator.value,
          reper: fullShiftCovered ? '' : els.fldReper.value,
          sarja: fullShiftCovered ? '' : els.fldSarja.value,
          cantitate: fullShiftCovered ? 0 : els.fldCantitate.value,
          opriri_neplanificate: els.fldOpriri.value,
          mentenanta: els.fldMentenanta.value,
          incalzire: els.fldIncalzire.value,
          golire: els.fldGolire.value
        };
        return normalizeRow(base);
      }

      function validateRow(row) {
        if (!toStr(row.data)) return 'Completează câmpul Data.';
        if (!toStr(row.an)) return 'Completează câmpul An.';
        if (!toStr(row.luna)) return 'Completează câmpul Lună.';
        if (!toStr(row.schimbul)) return 'Completează câmpul Schimbul.';
        if (!toStr(row.operator)) return 'Completează câmpul Operator.';

        if (isFullShiftWithoutProduction(row)) return '';

        const hasProductionData = !!toStr(row.reper) || !!toStr(row.sarja) || toNumber(row.cantitate) > 0;

        if (!toStr(row.reper)) return 'Completează câmpul Reper.';
        if (!toStr(row.sarja)) return 'Completează câmpul Sarjă.';
        if (toNumber(row.cantitate) <= 0) {
          if (!hasProductionData) {
            return 'Dacă nu introduci reper, sarjă și cantitate, minutele din opriri neplanificate + mentenanță + încălzire + golire trebuie să acopere tot schimbul de 8 ore (480 minute).';
          }
          return 'Cantitatea trebuie să fie mai mare decât 0.';
        }
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
        els.fldOpriri.value = source.opriri_neplanificate ? String(source.opriri_neplanificate) : '';
        els.fldMentenanta.value = source.mentenanta ? String(source.mentenanta) : '';
        els.fldIncalzire.value = source.incalzire ? String(source.incalzire) : '';
        els.fldGolire.value = source.golire ? String(source.golire) : '';
        applyComputedOreToForm();
      }

      function clearForm() {
        state.selectedId = null;
        fillForm({});
        setDefaults();
        applyComputedOreToForm();
        updateSelectionUi();
      }

      function updateSelectionUi() {
        const row = state.rows.find((item) => item.id === state.selectedId) || null;
        if (row) {
          setChip(els.selectChip, 'Rând selectat: ' + [row.data ? formatDateDisplay(row.data) : '', row.reper].filter(Boolean).join(' • '), 'ok');
        } else {
          setChip(els.selectChip, 'Rând selectat: niciunul', 'warn');
        }
        els.btnDelete.disabled = !row || !canEdit();
        updateFormNote();
      }

      function updateFormNote() {
        const calc = calculateOreDetails({
          reper: els.fldReper.value,
          cantitate: els.fldCantitate.value,
          opriri_neplanificate: els.fldOpriri.value,
          mentenanta: els.fldMentenanta.value,
          incalzire: els.fldIncalzire.value,
          golire: els.fldGolire.value
        });
        const modeText = state.selectedId ? 'Mod editare: actualizare rând selectat' : 'Mod editare: rând nou';

        if (!toStr(els.fldReper.value) || toNumber(els.fldCantitate.value) <= 0) {
          els.formNote.textContent = modeText + ' • Orele se calculează automat după reper + cantitate + opriri + încălzire + golire';
          return;
        }

        if (!calc.rule) {
          els.formNote.textContent = modeText + ' • Reperul nu are regulă de tratament termic în excelul de bază, deci orele rămân 0';
          return;
        }

        els.formNote.textContent = modeText + ' • Ore auto: ' + formatNumber(calc.ore, 2) +
          ' h (tact ' + formatNumber(calc.rule.tact_min, 2) + ' min, ' +
          formatNumber(calc.rule.cant_cos, 0) + ' buc/cos; mentenanța nu intră în consum)';
      }

      function applyComputedOreToForm() {
        const calc = calculateOreDetails({
          reper: els.fldReper.value,
          cantitate: els.fldCantitate.value,
          opriri_neplanificate: els.fldOpriri.value,
          mentenanta: els.fldMentenanta.value,
          incalzire: els.fldIncalzire.value,
          golire: els.fldGolire.value
        });
        els.fldOre.value = calc.ore > 0 ? String(calc.ore.toFixed(2)) : '';
        updateFormNote();
      }

      function renderStats() {
        els.statRows.textContent = String(state.rows.length);
        const totalQty = state.rows.reduce((sum, row) => sum + toNumber(row.cantitate), 0);
        els.statQty.textContent = formatNumber(totalQty, 0);
        els.statUpdated.textContent = formatDateTimeDisplay(state.updatedAt);
      }

      function renderTable() {
        const rows = sortRows(state.rows.map(normalizeRow));
        if (!rows.length) {
          els.tbodyRows.innerHTML = '<tr><td colspan="13" class="empty">Nu există rânduri salvate.</td></tr>';
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
            '<td>' + escapeHtml(row.reper) + '</td>' +
            '<td>' + escapeHtml(row.sarja) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.cantitate, 0)) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.ore, 2)) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.opriri_neplanificate, 0)) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.mentenanta, 0)) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.incalzire, 0)) + '</td>' +
            '<td class="right">' + escapeHtml(formatNumber(row.golire, 0)) + '</td>' +
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
          els.fldAn, els.fldLuna, els.fldData, els.fldSchimbul,
          els.fldOperator, els.fldReper, els.fldSarja, els.fldCantitate,
          els.fldOpriri, els.fldMentenanta, els.fldIncalzire, els.fldGolire
        ].forEach((el) => { el.disabled = readonly; });
        els.fldOre.disabled = readonly;
        els.btnSaveRow.disabled = readonly;
        els.btnNew.disabled = readonly;
        els.btnDelete.disabled = readonly || !state.selectedId;
        els.readonlyBanner.classList.toggle('show', readonly);
      }

      async function loadFromCloudOrLocal() {
        let localRows = [];
        let localUpdatedAt = null;

        try {
          const raw = localStorage.getItem(LOCAL_KEY) || localStorage.getItem(LEGACY_LOCAL_KEY);
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
        els.btnReload.addEventListener('click', () => { window.location.reload(); });
        els.btnCloudSave.addEventListener('click', () => { saveToCloud(true); });
        els.btnDelete.addEventListener('click', deleteSelected);
        els.fldData.addEventListener('input', () => {
          syncYearMonthFromDate();
          updateFormNote();
        });
        [els.fldReper, els.fldCantitate, els.fldOpriri, els.fldMentenanta, els.fldIncalzire, els.fldGolire].forEach((el) => {
          el.addEventListener('input', applyComputedOreToForm);
          el.addEventListener('change', applyComputedOreToForm);
        });
        bindRowClicks();
      }

      function bindKeyboardFlow() {
        const ordered = [
          els.fldData, els.fldSchimbul, els.fldOperator, els.fldReper,
          els.fldSarja, els.fldCantitate, els.fldOpriri, els.fldMentenanta, els.fldIncalzire, els.fldGolire
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
        await loadHelperSources();
        await loadFromCloudOrLocal();
        clearForm();
      }

      init();
    })();
  