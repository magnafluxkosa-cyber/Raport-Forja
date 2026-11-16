const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function loadFunction(file, name, nextName, globals = {}) {
  const source = read(file);
  const start = source.indexOf('async function ' + name + '(');
  const end = source.indexOf('async function ' + nextName + '(', start + 1);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext(globals);
  vm.runInContext(source.slice(start, end) + '\nthis.subject = ' + name, context);
  return context.subject;
}

for (const [file, name, next] of [
  ['rf-config.js', 'loadPagePermissionMap', 'readDashboardAclMirror'],
  ['index.html', 'loadRolePermissionMap', 'loadDashboardAcl'],
]) {
  test(file + ': role permissions load against the deployed schema', async () => {
    const row = { page_key: 'test-page', can_view: true, can_add: false, can_edit: false, can_delete: false };
    let calls = 0;
    const client = { from(table) {
      assert.equal(table, 'page_permissions');
      return { select(columns) {
        for (const key of columns.split(',')) assert.ok(key in row, 'Missing column: ' + key);
        return { async eq(key, role) {
          assert.equal(key, 'role'); assert.equal(role, 'viewer'); calls++;
          return { data: [row], error: null };
        }};
      }};
    }};
    const fn = loadFunction(file, name, next, {
      sb: client, normalizeRole: x => x, normalizeAclPageKey: x => x,
      buildPermissionEntry: row => ({ ...row, can_export: row.can_export === true, can_import: row.can_import === true }),
    });
    const result = file === 'index.html' ? await fn('viewer') : await fn(client, 'viewer');
    assert.equal(calls, 1);
    assert.equal(result.get('test-page').can_view, true);
    assert.equal(result.get('test-page').can_edit, false);
    assert.equal(result.get('test-page').can_export, false);
    assert.equal(result.get('test-page').can_import, false);
  });
}

function accountSaver(result) {
  const calls = [];
  const fn = loadFunction('helper-acl.html', 'persistAccountAccess', 'saveDoc', {
    sb: { from(table) {
      calls.push(table);
      return { upsert(payload, options) {
        assert.equal(options.onConflict, 'user_id');
        assert.equal(payload.user_id, 'account-id');
        return { select(columns) {
          assert.equal(columns, 'user_id');
          return { async single() { return result; } };
        }};
      }};
    }},
  });
  return { fn, calls };
}
test('account saving confirms the user_id without deleting the existing account', async () => {
  const { fn, calls } = accountSaver({ data: { user_id: 'account-id' }, error: null });
  await fn({ user_id: 'account-id', email: 'test@example.invalid', is_active: true });
  assert.deepEqual(calls, ['user_account_access']);
});
test('account saving propagates permission/uniqueness errors without a destructive fallback', async () => {
  const { fn, calls } = accountSaver({ data: null, error: new Error('permission denied') });
  await assert.rejects(fn({ user_id: 'account-id' }), /permission denied/);
  assert.equal(calls.length, 1);
});
test('account saving rejects missing IDs before any request and unconfirmed writes', async () => {
  const { fn, calls } = accountSaver({ data: null, error: null });
  await assert.rejects(fn({ email: 'test@example.invalid' }), /identificatorul/);
  assert.equal(calls.length, 0);
  await assert.rejects(fn({ user_id: 'account-id' }), /confirmată/);
});
test('Numeralkod loads existing documents and helper items without probing missing tables', async () => {
  const source = read('operator-debitare.html');
  const start = source.indexOf('async function loadNumeralKodData()');
  const end = source.indexOf('function findNumeralKodForIntrare(', start);
  const scanned = [], tables = [];
  const context = vm.createContext({
    numeralKodBySarja: new Map(), numeralKodByCombo: new Map(),
    readDoc: async key => key === 'numeralkod' ? { rows: [{ cod: 'KAD-1' }] } : null,
    getPayload: x => x, scanNumeralKodNode: x => scanned.push(x),
    sb: { from(table) {
      tables.push(table); assert.equal(table, 'rf_helper_items');
      return { select() { return { in() { return { async limit() { return { data: [{ cod: 'KAD-2' }], error: null }; } }; } }; } };
    }},
  });
  vm.runInContext(source.slice(start, end), context);
  await context.loadNumeralKodData();
  assert.deepEqual(tables, ['rf_helper_items']);
  assert.equal(scanned[0].rows[0].cod, 'KAD-1');
  assert.equal(scanned[1][0].cod, 'KAD-2');
});

test('edited JavaScript and inline HTML scripts parse', () => {
  new vm.Script(read('rf-config.js'));
  for (const file of ['index.html', 'helper-acl.html', 'operator-debitare.html']) {
    for (const match of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
      new vm.Script(match[2], { filename: file });
    }
  }
});
