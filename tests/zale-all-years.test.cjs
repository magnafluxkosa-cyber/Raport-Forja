const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sheets = ['9k-6628-29','229-6909-10','503-0761-62','106-1625-26','378-8241-42','248-2307-08','417-3595-96','418-2091-92'];
const months = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
function block(source, name, next) {
  const start = source.indexOf('    function ' + name + '(');
  const end = source.indexOf('    ' + next, start);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end);
}
function harness(source) {
  const elements = new Map();
  const element = id => {
    assert.notEqual(id, 'fltAn', 'the removed year control must never be accessed');
    if(!elements.has(id)) elements.set(id, { value:'', innerHTML:'', dataset:{}, listeners:{}, addEventListener(type, fn) { this.listeners[type] = fn; } });
    return elements.get(id);
  };
  const state = { rows:[{ id:'old', an:'2026', luna:'Noiembrie', nr_transport:'101', data_livrarii:'20.11.2026' }], derivedRows:[], selectedYear:'2026' };
  let rendered = [], saved = [], draft;
  const context = vm.createContext({
    state, selectedRowId:'', pageAccess:{ can_add:true, can_edit:true }, MONTHS:months,
    document:{ getElementById:element, addEventListener() {} },
    normalizeYear:x => String(x || '').trim(), normalizeMonthName:x => String(x || '').trim(),
    normalizeDate:x => String(x || '').trim(), toStr:x => String(x || '').trim(), escapeHtml:x => x,
    refreshDerivedRows() { state.derivedRows = state.rows.map(row => ({ ...row })); },
    buildDraftFromForm:() => ({ ...draft }), normalizeMainRow:row => row,
    transportSort:(a,b) => Number(a.an) - Number(b.an) || a.nr_transport.localeCompare(b.nr_transport),
    renderTable() { rendered = Array.from(context.getFilteredRows(), row => row.id); },
    queueSave() { saved = state.derivedRows.map(row => ({ ...row })); },
    openModal() {}, closeModal() {}, deleteSelected() {}, refreshAll() {}, updateDraftCalculatedFields() {},
    alert:message => assert.fail(message)
  });
  vm.runInContext(block(source, 'refreshFilters', 'function scrollTableBottom(')
    + block(source, 'saveModal', 'function deleteSelected(')
    + block(source, 'bindEvents', source.includes('    function refreshOnWake(') ? 'function refreshOnWake(' : 'async function init('), context);
  context.bindEvents();
  return { context, state, element, draft:value => { draft=value; }, rendered:() => rendered, saved:() => saved };
}
for(const sheet of sheets) {
  const file = 'zale-' + sheet + '.html';
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  test(file + ': adding and editing a 2027 transport keeps 2026 and 2027 visible and saved', () => {
    const h = harness(source);
    h.context.refreshFilters(); h.context.renderTable();
    assert.deepEqual(h.rendered(), ['old']);
    h.draft({ id:'new', an:'2027', luna:'Ianuarie', nr_transport:'102', data_livrarii:'05.01.2027' });
    h.context.saveModal();
    assert.deepEqual(h.rendered(), ['old','new']);
    assert.deepEqual(h.saved().map(row => row.an), ['2026','2027']);
    assert.match(h.element('fltLuna').innerHTML, /Ianuarie/);
    assert.match(h.element('fltLuna').innerHTML, /Noiembrie/);
    h.draft({ ...h.state.rows[1], nr_transport:'103' });
    h.context.saveModal();
    assert.deepEqual(h.rendered(), ['old','new']);
    h.context.refreshFilters(); h.context.renderTable();
    assert.deepEqual(h.rendered(), ['old','new'], 'refresh must not select the newest year');
  });
  test(file + ': remaining filters and reset work across all years', () => {
    const h = harness(source);
    h.state.rows.push({ id:'older', an:'2025', luna:'Noiembrie', nr_transport:'99', data_livrarii:'01.11.2025' });
    h.state.rows.push({ id:'future', an:'2027', luna:'Ianuarie', nr_transport:'102', data_livrarii:'05.01.2027', data_livrare_actualizata:'06.01.2027' });
    h.context.refreshFilters();
    h.element('fltLuna').value='Noiembrie'; h.context.renderTable();
    assert.deepEqual(h.rendered(), ['old','older']);
    h.element('fltLuna').value=''; h.element('fltTransport').value='102'; h.context.renderTable();
    assert.deepEqual(h.rendered(), ['future']);
    h.element('fltTransport').value=''; h.element('fltData').value='06.01.2027'; h.context.renderTable();
    assert.deepEqual(h.rendered(), ['future']);
    h.element('btnClearFilters').listeners.click();
    assert.deepEqual(h.rendered(), ['old','older','future']);
    assert.doesNotMatch(source, /fltAn|selectedYear/);
    assert.match(source, /id="f_an"/, 'transport year remains editable');
    assert.match(source, />Anul<\/th>/, 'year column stays visible');
    for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      if(match[1].trim()) new vm.Script(match[1], { filename:file });
    }
  });
}
