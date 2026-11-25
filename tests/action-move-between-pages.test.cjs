const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = process.env.KAD_REPO || path.join(__dirname, '..');

const pageConfigs = [
  {
    key: 'urmarire-actiuni-progres',
    expectedTargets: ['imbunatatire-continua', 'investitii'],
    files: [
      'urmarire-actiuni-progres.html',
      'supabase/functions/rf-protected-page/pages/urmarire-actiuni-progres.html',
      'supabase/functions/rf-protected-page-4/pages/urmarire-actiuni-progres.html'
    ]
  },
  {
    key: 'investitii',
    expectedTargets: ['urmarire-actiuni-progres', 'imbunatatire-continua'],
    files: [
      'investitii.html',
      'supabase/functions/rf-protected-page/pages/investitii.html',
      'supabase/functions/rf-protected-page-4/pages/investitii.html'
    ]
  },
  {
    key: 'imbunatatire-continua',
    expectedTargets: ['urmarire-actiuni-progres', 'investitii'],
    files: [
      'imbunatatire-continua.html',
      'supabase/functions/rf-protected-page/pages/imbunatatire-continua.html',
      'supabase/functions/rf-protected-page-4/pages/imbunatatire-continua.html'
    ]
  }
];

function extractMoveBlock(source) {
  const pageKeyMatch = source.match(/const PAGE_KEY\s*=\s*"([^"]+)";/);
  const opKeyMatch = source.match(/const OPERATOR_NAME_KEY\s*=\s*"([^"]+)";/);
  assert(pageKeyMatch, 'PAGE_KEY present');
  assert(opKeyMatch, 'OPERATOR_NAME_KEY present');
  const start = source.indexOf('    const MOVE_TARGETS = {');
  const end = source.indexOf('    function deleteSelected() {', start);
  assert(start > 0 && end > start, 'MOVE_TARGETS block present');
  return `const PAGE_KEY = "${pageKeyMatch[1]}";\nconst OPERATOR_NAME_KEY = "${opKeyMatch[1]}";\n` + source.slice(start, end);
}

for (const cfg of pageConfigs) {
  for (const rel of cfg.files) {
    test(`${rel}: syntax, UI buttons, bidirectional move, ACL check and zero-data-loss rollback`, async () => {
      const fullPath = path.join(base, rel);
      const html = fs.readFileSync(fullPath, 'utf8');
      assert(html.includes('id="btnMove"'), 'Toolbar Move button exists');
      assert(html.includes('id="btnMoveForm"'), 'Form Move button exists');
      assert(html.includes('id="moveModal"'), 'Move modal exists');

      for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
        if (match[1].trim()) new vm.Script(match[1]);
      }

      const cloudDocs = new Map();
      let failNextUpsert = false;
      let targetCanAdd = true;
      let sourceCloudSaves = 0;
      const localStore = new Map();

      const fakeSupabase = {
        from(table) {
          assert.equal(table, 'rf_documents');
          return {
            _keys: [],
            select() { return this; },
            in(col, keys) { this._keys = keys; return this; },
            order() { return this; },
            async limit() {
              for (const k of this._keys) {
                if (cloudDocs.has(k)) return { data: [cloudDocs.get(k)], error: null };
              }
              return { data: [], error: null };
            },
            async upsert(row) {
              if (failNextUpsert) return { error: new Error('Simulated cloud write failure') };
              cloudDocs.set(row.doc_key, { doc_key: row.doc_key, content: row.content, updated_at: row.updated_at });
              return { error: null };
            }
          };
        }
      };

      const sampleRow = {
        id: 'forja-test-move-1',
        created_at: '2026-11-25T10:00:00.000Z',
        descriere_probleme: 'Modernizare presa debavurare',
        linie_utilaj: '2,5 T',
        data_constatare: '25.11.2026',
        nivel_prioritate: '2',
        descriere_prioritate: '2 Saptamani',
        stadiu: 'A',
        descriere_stadiu: 'Constatare/Cauza',
        procent_realizat: 25,
        data_finalizare: '',
        responsabil_actiune: 'URS M',
        departament: 'Mecanic',
        termen_prop: '15.12.2026',
        observatii: '[25.11.2026 12:00] Creat de URS M'
      };

      let selectedTargetKey = cfg.expectedTargets[0];
      const dom = {
        editModal: { classList: { contains: () => false } },
        moveModal: {
          openState: false,
          attrs: {},
          classList: {
            add(c) { if (c === 'open') dom.moveModal.openState = true; },
            remove(c) { if (c === 'open') dom.moveModal.openState = false; },
            contains(c) { return c === 'open' ? dom.moveModal.openState : false; }
          },
          setAttribute(k, v) { dom.moveModal.attrs[k] = v; }
        },
        moveRowTitle: { textContent: '' },
        moveRowSheet: { textContent: '' },
        moveTargetOptions: {
          innerHTML: '',
          querySelector: () => ({ value: selectedTargetKey })
        },
        moveAuthorInput: { value: 'URS M', focus() {} },
        moveModalError: {
          textContent: '',
          hidden: true,
          classList: {
            add(c) { if (c === 'hidden') dom.moveModalError.hidden = true; },
            remove(c) { if (c === 'hidden') dom.moveModalError.hidden = false; }
          }
        },
        btnConfirmMove: { disabled: false, textContent: 'Mută acțiunea' },
        btnMove: { disabled: false },
        chipCloud: {},
        dotCloud: {}
      };

      const state = {
        activeSheet: 'forja',
        datasets: { forja: [{ ...sampleRow }], prelucrari: [] },
        selectedId: sampleRow.id,
        permissions: { canView: true, canAdd: true, canEdit: true, canDelete: true },
        user: { id: 'u-1', email: 'forja-v@forja.local' },
        role: 'editor',
        syncInFlight: false,
        moveInFlight: false,
        dirty: false,
        actionChanges: []
      };

      const ctx = vm.createContext({
        state,
        dom,
        window: {
          __rfUapSaveTimer: null,
          ERPAuth: {
            getPageAccess: async () => ({
              allowed: true,
              permissions: { can_view: true, can_add: targetCanAdd, can_edit: targetCanAdd, can_delete: targetCanAdd }
            })
          }
        },
        localStorage: {
          getItem: k => localStore.get(k) || null,
          setItem: (k, v) => localStore.set(k, v)
        },
        console: { warn() {}, error() {} },
        alert() {},
        confirm: () => true,
        setTimeout: fn => fn(),
        clearTimeout() {},
        deepClone: v => JSON.parse(JSON.stringify(v)),
        escapeHtml: v => String(v ?? ''),
        formatDate: v => String(v ?? '').trim(),
        normalizePercentValue: v => Number(v || 0),
        currentDateTimeString: () => '25.11.2026 20:15',
        getSavedOperatorName: () => localStore.get('op') || 'URS M',
        randomId: prefix => `${prefix}-gen-id`,
        getActiveRows: () => state.datasets[state.activeSheet],
        rowById: id => state.datasets[state.activeSheet].find(r => r.id === id) || null,
        getSupabaseClient: () => fakeSupabase,
        applyPermissionsToUi() { dom.btnMove.disabled = !state.permissions.canDelete || !state.selectedId || !!state.moveInFlight; },
        updateSelectedRowUi() {},
        closeModal() {},
        persistLocal() {},
        renderTable() {},
        setBadge() {},
        recordActionChange(sheet, author, rowId) {
          state.actionChanges.push({ sheet, author, row: rowId });
        },
        saveCloud: async () => {
          sourceCloudSaves++;
          state.dirty = false;
          return true;
        },
        Date,
        Set,
        Array,
        Object,
        String,
        Number,
        JSON
      });

      vm.runInContext(extractMoveBlock(html), ctx);

      const targets = ctx.getAvailableMoveTargets().map(t => t.key);
      assert.deepEqual(targets.sort(), [...cfg.expectedTargets].sort());

      // 1. Simulated cloud write error must NOT remove row from source
      failNextUpsert = true;
      await ctx.executeMoveRow({ preventDefault() {} });
      assert.equal(state.datasets.forja.length, 1, 'Source row preserved when target write fails');
      assert.equal(sourceCloudSaves, 0, 'Source not saved when target write fails');
      assert.equal(dom.moveModalError.hidden, false, 'Error message shown');

      // 2. Simulated ACL denial on target must NOT remove row from source
      failNextUpsert = false;
      targetCanAdd = false;
      await ctx.executeMoveRow({ preventDefault() {} });
      assert.equal(state.datasets.forja.length, 1, 'Source row preserved when target ACL denies add');
      assert.equal(cloudDocs.size, 0, 'Target untouched when ACL denies add');

      // 3. Successful move writes to target first, appends audit trail, then removes from source and saves source
      targetCanAdd = true;
      selectedTargetKey = cfg.expectedTargets[0];
      dom.moveAuthorInput.value = 'URS M';
      ctx.openMoveModal();
      assert.equal(dom.moveModal.openState, true);
      await ctx.executeMoveRow({ preventDefault() {} });

      assert.equal(state.datasets.forja.length, 0, 'Source row removed after successful move');
      assert.equal(state.selectedId, null, 'Selection cleared');
      assert.equal(sourceCloudSaves, 1, 'Source cloud saved immediately');
      assert.equal(dom.moveModal.openState, false, 'Move modal closed');

      const savedTarget = cloudDocs.get(selectedTargetKey);
      assert(savedTarget, 'Target cloud document written');
      assert.equal(savedTarget.content.datasets.forja.length, 1, 'Row added to target forja sheet');
      const movedRow = savedTarget.content.datasets.forja[0];
      assert.equal(movedRow.id, sampleRow.id);
      assert.equal(movedRow.descriere_probleme, sampleRow.descriere_probleme);
      assert(movedRow.observatii.includes('[25.11.2026 20:15] URS M: Mutat din '), 'Audit line appended to observatii');
      if (selectedTargetKey === 'urmarire-actiuni-progres') {
        assert.equal(savedTarget.content.action_changes.length, 1, 'Notification event recorded when moving into Urmarire');
        assert.equal(savedTarget.content.action_changes[0].row, sampleRow.id);
      }
    });
  }
}
