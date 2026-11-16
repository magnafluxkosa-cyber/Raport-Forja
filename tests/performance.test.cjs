const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
// Fixed baseline: the preceding Supabase error repair, before optimizations.
const baseline = file => execFileSync('git', ['show', '3b449a7:' + file], { cwd: root, encoding: 'utf8' });

async function numeralRun(source, fail = false) {
  const keys = ['numeralkod', 'numeral-kod', 'numeral_kod', 'Numeral KOD', 'NUMERAL_KOD', 'helper-numeralkod', 'helper:numeralkod', 'helper-data:numeralkod', 'numeral-kod-premagro'];
  const docs = keys.filter((_, i) => i % 2 === 0).map((doc_key, i) => ({ doc_key, content: { code: 'K' + i } }));
  const scanned = []; let requests = 0, bytes = 0;
  const response = data => { bytes += Buffer.byteLength(JSON.stringify(data)); return data; };
  const context = vm.createContext({
    numeralKodBySarja: new Map(), numeralKodByCombo: new Map(),
    readDoc: async key => { requests++; if (fail) throw new Error('offline'); return response(docs.find(d => d.doc_key === key) || null); },
    getPayload: d => d.content, scanNumeralKodNode: d => scanned.push(d),
    sb: { from(table) { return { select() { return { in() {
      if (table === 'rf_documents') {
        requests++;
        return Promise.resolve(fail ? { error: new Error('offline') } : { data: response(docs.slice().reverse()), error: null });
      }
      assert.equal(table, 'rf_helper_items');
      return { async limit() { requests++; return { data: response([{ code: 'helper' }]), error: null }; } };
    }}; }}; } },
  });
  vm.runInContext(source.slice(source.indexOf('async function loadNumeralKodData()'), source.indexOf('function findNumeralKodForIntrare(')), context);
  await context.loadNumeralKodData();
  return { scanned, requests, bytes };
}
test('Numeralkod: 10 to 2 requests; same values and source precedence', async () => {
  const old = await numeralRun(baseline('operator-debitare.html'));
  const next = await numeralRun(read('operator-debitare.html'));
  assert.deepEqual(next.scanned, old.scanned);
  assert.equal(old.requests, 10); assert.equal(next.requests, 2);
  assert.ok(next.bytes <= old.bytes);
  console.log(`Numeralkod fixture: requests ${old.requests} -> ${next.requests}; JSON bytes ${old.bytes} -> ${next.bytes}`);
});
test('Numeralkod: failed documents still allow helper source, without retry fan-out', async () => {
  const old = await numeralRun(baseline('operator-debitare.html'), true);
  const next = await numeralRun(read('operator-debitare.html'), true);
  assert.deepEqual(next.scanned, old.scanned);
  assert.equal(next.requests, 2);
});

function permissionContext(source) {
  let requests = 0, fail = false;
  const client = { from(table) { assert.equal(table, 'user_page_permissions'); return { select() {
    const run = async (key, value) => {
      requests++; await new Promise(resolve => setImmediate(resolve));
      if (fail) throw new Error('offline');
      return { data: [{ page_key: value, can_view: true, can_edit: false }], error: null };
    };
    return { eq: run, ilike: run };
  }}; }};
  const context = vm.createContext({ normalizeAclEmail: x => String(x || '').toLowerCase(), normalizeAclPageKey: x => x, buildPermissionEntry: x => x });
  const start = source.includes('var pendingUserPermissionReads') ? source.indexOf('var pendingUserPermissionReads') : source.indexOf('async function loadUserPermissionMap(');
  vm.runInContext(source.slice(start, source.indexOf('async function loadPagePermissionMap(', start)), context);
  return { context, client, count: () => requests, setFail: x => { fail = x; } };
}
test('10 simultaneous permission loads: 20 to 2 requests; no retained results', async () => {
  for (const [source, expected] of [[baseline('rf-config.js'), 20], [read('rf-config.js'), 2]]) {
    const x = permissionContext(source), user = { id: 'user-a', email: 'a@example.invalid' };
    const results = await Promise.all(Array.from({ length: 10 }, () => x.context.loadUserPermissionMap(x.client, user)));
    assert.equal(x.count(), expected);
    for (const result of results) { assert.equal(result.size, 2); assert.equal(result.get('user-a').can_edit, false); }
    await x.context.loadUserPermissionMap(x.client, user);
    assert.equal(x.count(), expected + 2, 'next read must fetch fresh permissions');
  }
});
test('permission reads remain isolated by user and client and recover after failure', async () => {
  const x = permissionContext(read('rf-config.js'));
  const a = { id: 'a', email: 'a@example.invalid' }, b = { id: 'b', email: 'b@example.invalid' };
  const [ra, rb] = await Promise.all([x.context.loadUserPermissionMap(x.client, a), x.context.loadUserPermissionMap(x.client, b)]);
  assert.equal(ra.has('b'), false); assert.equal(rb.has('a'), false); assert.equal(x.count(), 4);
  const otherClient = { from: x.client.from };
  await Promise.all([x.context.loadUserPermissionMap(x.client, a), x.context.loadUserPermissionMap(otherClient, a)]);
  assert.equal(x.count(), 8);
  x.setFail(true);
  assert.equal(await x.context.loadUserPermissionMap(x.client, a), null);
  x.setFail(false);
  assert.equal((await x.context.loadUserPermissionMap(x.client, a)).has('a'), true);
});

test('tab resume events collapse to one refresh; hidden/logged-out tabs do not fetch', () => {
  const source = read('index.html'), timers = new Map(), events = {}; let sequence = 0, requests = 0;
  const context = vm.createContext({ currentUser: { id: 'a' },
    refreshIndexVisibilityFromCloud: force => { assert.equal(force, true); requests++; },
    window: { setTimeout: fn => { timers.set(++sequence, fn); return sequence; }, clearTimeout: id => timers.delete(id), addEventListener: (name, fn) => { events[name] = fn; } },
    document: { hidden: false, addEventListener: (name, fn) => { events[name] = fn; } },
  });
  const start = source.indexOf('let visibilityResumeTimer');
  vm.runInContext(source.slice(start, source.indexOf('sb?.auth.onAuthStateChange', start)), context);
  events.pageshow(); events.focus(); events.visibilitychange();
  assert.equal(timers.size, 1);
  const flush = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); };
  flush(); assert.equal(requests, 1);
  events.focus(); context.document.hidden = true; events.visibilitychange(); flush(); assert.equal(requests, 1);
  context.document.hidden = false; events.focus(); context.currentUser = null; flush(); assert.equal(requests, 1);
  context.currentUser = { id: 'b' }; events.focus(); flush(); assert.equal(requests, 2);
});
