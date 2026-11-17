const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const file = 'planificare-forja.html';
const current = fs.readFileSync(path.join(root, file), 'utf8');
const previous = execFileSync('git', ['show', 'b343835:' + file], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const plain = value => JSON.parse(JSON.stringify(value));
function extract(text, name, next, globals) {
  const pattern = new RegExp('(?:async )?function ' + name + '\\(');
  const start = text.search(pattern);
  const end = text.indexOf(next, start);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext(globals);
  vm.runInContext(text.slice(start, end) + '\nthis.run = ' + name, context);
  return context.run;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const names = ['loadSteelStock', 'loadDebitatStock', 'loadIntrariOtelEntries', 'loadDebitariEntries', 'loadForjateDailyMovements', 'loadDeliveryOrders', 'loadInventarForjatRows', 'loadLivrariZaleRows'];
function supportHarness(text, options = {}) {
  const calls = [], state = { activeYear: '2026', helperMaps: { source: 'helper', debitByReper: {}, forjaByReper: {} } };
  const globals = { state, CURRENT_YEAR: '2026', loadHelperMaps: async force => {
    calls.push(['helper', force]);
    if (options.helper) await options.helper;
    state.helperMaps.debitByReper.part = { kg_buc: 2 };
  }};
  names.forEach((name, i) => {
    globals[name] = async argument => {
      assert.ok(state.helperMaps.debitByReper.part, 'helper must be ready before calculating stock');
      calls.push([name, argument]);
      if (options.read) await options.read(name);
      return { rows: [{ part: name, quantity: i + 1 }], map: { part: i + 1 }, byDate: { '2026-11-17': i + 1 }, steelByDate: { '2026-11-17': 2 * i }, source: name, ok: true, baseYear: 2026, baseMonth: 10, period: 'oct', startIso: '2026-11-01', startLabel: 'noiembrie' };
    };
  });
  return { state, calls, run: extract(text, 'refreshSupportData', 'function resolvePlanningHelper(', globals) };
}
test('parallel sources preserve stock, production, delivery and source selection with the same reads', async () => {
  const before = supportHarness(previous), after = supportHarness(current);
  await before.run(true);
  await after.run(true);
  assert.deepEqual(plain(after.state), plain(before.state));
  const sorted = calls => calls.slice().sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(sorted(after.calls), sorted(before.calls));
});
test('independent reads overlap only after helpers; forjate waits for its existing year download', async () => {
  const helper = deferred(), year = deferred(), reads = deferred();
  const h = supportHarness(current, { helper: helper.promise, read: () => reads.promise });
  const pending = h.run(false, year.promise);
  await tick();
  assert.equal(h.calls.length, 1);
  helper.resolve();
  await tick();
  assert.equal(h.calls.length, 8, 'seven independent sources should be in flight');
  assert.ok(!h.calls.some(call => call[0] === 'loadForjateDailyMovements'));
  assert.equal(h.state.stockSupport, undefined, 'do not publish incomplete stock');
  year.resolve();
  await tick();
  assert.equal(h.calls.length, 9);
  reads.resolve();
  await pending;
  assert.equal(h.state.stockSupport.forjateFlowOk, true);
});
test('a failed year summary does not prevent the normal forjate fallback read', async () => {
  const year = deferred(), h = supportHarness(current);
  const pending = h.run(false, year.promise);
  await tick();
  year.reject(new Error('summary failed'));
  await pending;
  assert.equal(h.calls.filter(call => call[0] === 'loadForjateDailyMovements').length, 1);
});
test('a failed support source preserves the previous complete stock snapshot', async () => {
  const h = supportHarness(current, { read: async name => { if (name === 'loadDebitariEntries') throw new Error('read failed'); } });
  const old = { steelOk: true, steelRows: [{ quantity: 42 }] };
  h.state.stockSupport = old;
  await assert.rejects(h.run(false), /read failed/);
  assert.equal(h.state.stockSupport, old);
});
function snapshotHarness(text, initial = {}) {
  const state = { rows: [{ id: 'local' }], updatedAt: '2026-11-17T10:00:00Z', hasPendingLocalChanges: false, ...plain(initial) };
  const work = { normalized: 0, seeds: 0, expanded: 0 };
  const els = { cloudValue: {}, cloudSub: {} }, indicators = [];
  const run = extract(text, 'applyPlanDocumentSnapshot', 'function loadPlanDocumentFromCache(', {
    state, els, cloneSeedRows() { work.seeds++; return [{ id: 'seed' }]; },
    extractRowsPayload: p => p.rows || [],
    normalizePlanRow: row => { work.normalized++; return { ...row, normalized: true }; },
    reindexRowsInDisplayOrder: rows => rows, sortRowsStable: rows => rows,
    mergeSeedWithCloud: (seed, rows) => seed.concat(rows),
    ensureRowsContinueToYearEnd: rows => { work.expanded++; return rows.concat({ id: 'year-end' }); },
    rememberCloudDocumentStats: ({ content }) => { state.lastCloudRowsWithData = content.rows.length; },
    nowIso: () => '2026-11-17T12:00:00Z', formatDateTime: value => value,
    setCloudIndicator: (...args) => indicators.push(args)
  });
  return { run, state, els, indicators, work };
}
test('unchanged cloud plan updates sync status without rebuilding the current rows', () => {
  const h = snapshotHarness(current), rows = h.state.rows;
  const changed = h.run({ content: { version: 3, rows: [{ id: 'remote' }], updated_at: h.state.updatedAt } }, false);
  assert.equal(changed, false);
  assert.equal(h.state.rows, rows);
  assert.deepEqual(h.work, { normalized: 0, seeds: 0, expanded: 0 });
  assert.equal(h.els.cloudValue.textContent, 'Cloud încărcat');
});
test('new, forced, legacy, cached and missing plans keep their existing contents and status', () => {
  const scenarios = [
    { doc: { content: { version: 3, rows: [{ id: 'new' }], updated_at: '2026-11-17T11:00:00Z' } } },
    { doc: { content: { full_snapshot: true, rows: [{ id: 'forced' }] }, updated_at: '2026-11-17T09:00:00Z' }, force: true },
    { doc: { data: { rows: [{ id: 'legacy' }], updated_at: '2026-11-17T11:00:00Z' } } },
    { doc: { __fromCache: true, content: { version: 3, rows: [{ id: 'cached' }], updated_at: '2026-11-17T10:00:00Z' } }, force: true },
    { doc: { content: { version: 3, rows: [{ id: 'recover' }], updated_at: '2026-11-17T09:00:00Z' } }, initial: { rows: [] } },
    { doc: null, force: true },
    { doc: null, initial: { rows: [] } },
    { doc: { content: { rows: [] } }, force: true }
  ];
  for (const scenario of scenarios) {
    const before = snapshotHarness(previous, scenario.initial), after = snapshotHarness(current, scenario.initial);
    assert.equal(after.run(scenario.doc, scenario.force), before.run(scenario.doc, scenario.force));
    assert.deepEqual(plain(after.state), plain(before.state));
    assert.deepEqual(plain(after.els), plain(before.els));
    assert.deepEqual(after.indicators, before.indicators);
  }
});
test('an older cloud version cannot replace the newer displayed plan', () => {
  const h = snapshotHarness(current), rows = h.state.rows;
  assert.equal(h.run({ content: { version: 3, rows: [{ id: 'old' }], updated_at: '2026-11-17T09:00:00Z' } }, false), false);
  assert.equal(h.state.rows, rows);
});
test('forge planning inline scripts parse', () => {
  for (const match of current.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
});

function documentHarness(remote) {
  const calls = [], memory = new Map();
  const context = vm.createContext({
    rfDocumentMemoryCache: memory, RF_DOC_MEMORY_CACHE_LIMIT: 24, RF_DOC_CACHE_PREFIX: 'test:',
    trimText: value => String(value || '').trim(), DOC_KEY: 'planificare-forja',
    localStorage: { getItem() { return null; }, setItem() { throw new Error('quota'); } },
    rememberCloudDocumentStats() {},
    state: { supabase: { from: table => ({ select: columns => ({ eq: (field, key) => ({ maybeSingle: async () => {
      calls.push({ table, columns, key });
      return { data: columns.includes('content') ? remote : { doc_key: remote.doc_key, updated_at: remote.updated_at }, error: null };
    } }) }) }) } }
  });
  const start = current.indexOf('function getRfDocCacheKey(');
  const end = current.indexOf('async function queryDocsByKeys(', start);
  vm.runInContext(current.slice(start, end), context);
  return { context, calls, memory };
}
test('storage eviction does not cause a full document download again when its version is unchanged', async () => {
  const doc = { doc_key: 'forjate:2026', content: { rows: [{ quantity: 42 }] }, updated_at: '2026-11-17T10:00:00Z' };
  const h = documentHarness(doc);
  h.context.writeCachedRfDocument(doc);
  assert.deepEqual(plain(await h.context.readDocumentCompat(doc.doc_key)), doc);
  assert.deepEqual(h.calls.map(call => call.columns), ['doc_key,updated_at']);
});
test('the page cache still downloads a newer cloud version and replaces its old data', async () => {
  const newer = { doc_key: 'forjate:2026', content: { rows: [{ quantity: 99 }] }, updated_at: '2026-11-17T11:00:00Z' };
  const h = documentHarness(newer);
  h.context.writeCachedRfDocument({ ...newer, content: { rows: [{ quantity: 42 }] }, updated_at: '2026-11-17T10:00:00Z' });
  assert.deepEqual(plain(await h.context.readDocumentCompat(newer.doc_key)), newer);
  assert.equal(h.calls.length, 2);
  assert.deepEqual(plain(h.context.readCachedRfDocument(newer.doc_key)), newer);
});
test('temporary document cache is bounded and retains recently used records', () => {
  const h = documentHarness({});
  for(let i = 0; i < 24; i++) h.context.writeCachedRfDocument({ doc_key: 'doc-' + i });
  h.context.readCachedRfDocument('doc-0');
  h.context.writeCachedRfDocument({ doc_key: 'doc-24' });
  assert.equal(h.memory.size, 24);
  assert.equal(h.memory.has('doc-0'), true);
  assert.equal(h.memory.has('doc-1'), false);
});
