const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const next = fs.readFileSync(path.join(root, 'rf-config.js'), 'utf8');
const previous = execFileSync('git', ['show', 'e298c9b:rf-config.js'], { cwd: root, encoding: 'utf8' });

async function run(source, scenario) {
  let active = 0, parallel = 0;
  const calls = [];
  const read = async (name, value) => {
    calls.push(name); active++; parallel = Math.max(active, parallel);
    await new Promise(resolve => setImmediate(resolve));
    active--; return value;
  };
  const client = { auth: { getSession: async () => ({ data: { session: scenario.guest ? null : { user: { id: 'a', email: 'a@example.invalid' } } } }) } };
  const defaults = { can_view: true, can_edit: false };
  const context = vm.createContext({
    normalizeAclPageKey: x => x, pageKeyToHref: x => x + '.html', createRfSupabaseClient: () => client,
    normalizeRole: x => x, normalizeAclEmail: x => x,
    resolveRole: () => read('role', { role: scenario.admin ? 'admin' : 'viewer' }),
    loadUserAccountStatus: () => read('account', { is_active: !scenario.blocked, is_banned: !!scenario.blocked }),
    loadUserPermissionMap: () => read('user-permissions', scenario.strict ? new Map([['another-page', { can_view: true }]]) : null),
    loadPagePermissionMap: () => read('role-permissions', new Map()),
    readDashboardAclMirror: () => read('mirror', {}),
    defaultPageAccessFromRole: () => ({ ...defaults }),
    collectAclDecisions: () => scenario.denied ? [{ can_view: false }] : [],
    permissionValueToEntry: x => x, mergePermissions: (a, b) => ({ ...a, ...b }), buildPermissionEntry: x => x,
  });
  const start = source.indexOf('async function resolvePageAccess(pageKey, options)');
  vm.runInContext(source.slice(start, source.indexOf('async function canViewPage(', start)), context);
  const result = await context.resolvePageAccess('test-page', {});
  return { result: JSON.parse(JSON.stringify(result)), calls, parallel };
}

for (const scenario of [{ guest: true }, { admin: true, blocked: true }, { admin: true }, { strict: true }, { denied: true }, {}]) {
  test('access decisions and request counts preserved: ' + JSON.stringify(scenario), async () => {
    const before = await run(previous, scenario), after = await run(next, scenario);
    assert.deepEqual(after.result, before.result);
    assert.deepEqual(after.calls.sort(), before.calls.sort());
    if (!scenario.guest) { assert.equal(before.parallel, 1); assert.equal(after.parallel, 2); }
    if (scenario.blocked || scenario.strict || scenario.denied || scenario.guest) assert.equal(after.result.allowed, false);
  });
}

test('loading screen leaves protected body hidden and follows existing pending flags', () => {
  const styles = [];
  const context = vm.createContext({ document: {
    getElementById: () => null, createElement: () => ({}), head: { appendChild: el => styles.push(el.textContent) },
  }});
  const start = next.indexOf('function ensureAclPendingStyle()');
  vm.runInContext(next.slice(start, next.indexOf('function setAclPendingState(', start)), context);
  context.ensureAclPendingStyle();
  assert.match(styles[0], /html\.rf-acl-pending body\{visibility:hidden !important;\}/);
  for (const selector of ['html.rf-acl-pending::before', 'html[data-rf-prehide="1"]::before', 'body.acl-loading::before']) assert.ok(styles[0].includes(selector));
  assert.ok(styles[0].includes('Se încarcă pagina'));
});
