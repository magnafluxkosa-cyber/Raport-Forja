const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function extract(file, name, end, globals) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const start = text.indexOf('async function ' + name + '(');
  const context = vm.createContext(globals);
  vm.runInContext(text.slice(start, text.indexOf(end, start)) + '\nthis.run = ' + name, context);
  return context.run;
}
function tracker() {
  let active = 0, peak = 0, count = 0;
  return {
    async read(value) { count++; active++; peak = Math.max(peak, active); await new Promise(r => setImmediate(r)); active--; return value; },
    check() { assert.equal(peak, 2); assert.equal(count, 2); }
  };
}
test('shared authentication loads account and role together; blocked account stays blocked', async () => {
  const track = tracker(); const persisted = [];
  const run = extract('auth-common.js', 'getCurrentUserWithRole', 'function getCurrentPageName(', {
    getSession: async () => ({ user: { id: 'a', email: 'a@example.invalid' } }),
    normalizeEmail: x => x, safeGetItem: () => '', STORAGE: {}, clearUserState() {},
    getAccountStatus: () => track.read({ is_active: false, is_banned: true }),
    resolveUserRole: () => track.read('viewer'), persistUserState: (user, role) => persisted.push(role),
  });
  const result = await run(); track.check();
  assert.equal(result.accountStatus.is_banned, true); assert.equal(result.role, 'viewer');
  assert.deepEqual(persisted, ['viewer']);
});
test('shared authentication makes no account queries without a session', async () => {
  const run = extract('auth-common.js', 'getCurrentUserWithRole', 'function getCurrentPageName(', {
    getSession: async () => null, clearUserState() {},
    getAccountStatus: () => assert.fail('unexpected read'), resolveUserRole: () => assert.fail('unexpected read'),
  });
  assert.equal(await run(), null);
});
test('parallel user permission reads keep email override priority and existing cache', async () => {
  const track = tracker(), cache = new Map();
  const run = extract('auth-common.js', 'loadUserPermissionMap', 'function publishPageAccess(', {
    normalizeEmail: x => x, normalizePageKey: x => x, buildPermissions: x => x,
    permissionMapCache: cache, PERMISSION_MAP_CACHE_TTL_MS: 1000,
    cacheGet: (bucket, key) => bucket.get(key), cacheSet: (bucket, key, value) => bucket.set(key, value),
    maybeSelect: async query => query,
    readLatestRfDocument: () => assert.fail('unnecessary fallback'),
  });
  const sb = { from() { return { select() {
    const filter = key => ({ limit: () => track.read([{ page_key: 'page', can_view: key === 'user_id', can_edit: false }]) });
    return { eq: filter };
  }}; }};
  const user = { id: 'a', email: 'a@example.invalid' };
  const result = await run(sb, user); track.check();
  assert.equal(result.get('page').can_view, false);
  assert.equal((await run(sb, user)).get('page').can_view, false); track.check();
});
test('parallel control reads retain explicit user denial over role grant', async () => {
  const track = tracker();
  const run = extract('rf-config.js', 'resolveControlAccess', 'async function canUseControl(', {
    normalizeRole: x => x,
    defaultControlAccessFromPagePermissions: x => x,
    mergeControlAccess: (a, b) => ({ ...a, ...b }),
    loadUserControlPermissionMap: () => track.read(new Map([['page::button', { can_view: false, can_use: false }]])),
    loadRoleFieldPermissionMap: () => track.read(new Map([['page::button', { can_view: true, can_use: true }]])),
  });
  const result = await run('page', 'button', { client: {}, user: { id: 'a' }, pageAccess: { role: 'viewer', permissions: { can_view: true } } });
  track.check(); assert.equal(result.allowed, false); assert.equal(result.can_use, false);
});
test('shared authentication JavaScript parses', () => {
  new vm.Script(fs.readFileSync(path.join(root, 'auth-common.js'), 'utf8'));
});
