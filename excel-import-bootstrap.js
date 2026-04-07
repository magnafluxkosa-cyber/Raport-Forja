(function (global) {
  'use strict';

  function textNorm(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function hasWritePermission() {
    if (typeof global.canModifyRows === 'function') {
      try { return !!global.canModifyRows(); } catch (_) {}
    }
    if (typeof global.canImportExcel === 'function') {
      try { return !!global.canImportExcel(); } catch (_) {}
    }
    if (global.state && global.state.permissions) {
      const p = global.state.permissions;
      if (p.canImport !== undefined) return !!p.canImport;
      return !!(p.canAdd || p.canEdit || p.add || p.edit);
    }
    if (global.__CAN_ADD__ || global.__CAN_EDIT__) return true;
    return true;
  }

  function findByIds(ids) {
    for (const id of ids || []) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function findButtonsByText(matches) {
    const out = [];
    const wanted = (matches || []).map(textNorm).filter(Boolean);
    document.querySelectorAll('button, [role="button"], .btn').forEach(el => {
      const txt = textNorm(el.textContent || el.innerText || '');
      if (!txt) return;
      if (wanted.some(w => txt === w || txt.includes(w))) out.push(el);
    });
    return out;
  }

  function buildMappings() {
    const configs = [
      { buttonIds:['btnImportMapping'], inputIds:['fileMapping'], texts:['import mapare'] },
      { buttonIds:['btnImportOrders'], inputIds:['fileOrders'], texts:['import comenzi piese'] },
      { buttonIds:['btnImportStock'], inputIds:['fileStock'], texts:['import stoc initial'] },
      { buttonIds:['btnImportPm'], inputIds:['fileImportPm'], texts:['import excel pm'] },
      { buttonIds:['btnImportExcel'], inputIds:['fileImportExcel','fileImportXLSX'], texts:['import excel'] },
      { buttonIds:['btnImportXlsx'], inputIds:[], texts:['import excel'] },
      { buttonIds:['btnImport'], inputIds:['excelInput','fileImportXlsx','fileInput','fileImport','fileImportJson','fileImportPm','fileImportExcel','fileImportXLSX'], texts:['import excel','import','import stocks'] },
      { buttonIds:['btnImportZale'], inputIds:['fileImportXLSX'], texts:['import zale'] },
      { buttonIds:['btnImportAlte'], inputIds:['fileImportXLSX'], texts:['import alte'] },
      { buttonIds:['btnImportRezervat'], inputIds:['fileImportXLSX'], texts:['import rezervat'] },
    ];

    const results = [];
    configs.forEach(cfg => {
      const btns = [];
      (cfg.buttonIds || []).forEach(id => {
        const el = document.getElementById(id);
        if (el) btns.push(el);
      });
      if (!btns.length && cfg.texts && cfg.texts.length) btns.push(...findButtonsByText(cfg.texts));
      const input = findByIds(cfg.inputIds || []);
      btns.forEach(btn => {
        if (!btn || results.some(x => x.button === btn)) return;
        results.push({ button: btn, input });
      });
    });
    return results;
  }

  function assignFilesToInput(input, files) {
    if (!input || !files || !files.length) return false;
    try {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.warn('RF import bootstrap assignFilesToInput fallback:', error);
      return false;
    }
  }

  async function fallbackInvoke(files) {
    const file = files && files[0] ? files[0] : null;
    if (!file) return false;
    const names = [
      'handleImportXlsx',
      'handleImportExcelFile',
      'importExcelFile',
      'importJsonFile',
      'handleExcelSelection',
      'runPmImportFile'
    ];
    for (const name of names) {
      if (typeof global[name] === 'function') {
        await global[name](file);
        return true;
      }
    }
    if (typeof global.importXlsx === 'function') {
      await global.importXlsx();
      return true;
    }
    return false;
  }

  async function onImportClick(event, mapping) {
    if (!mapping || !mapping.button) return;
    if (mapping.button.disabled) return;
    if (!hasWritePermission()) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    try {
      if (!global.RFExcelImport || typeof global.RFExcelImport.pickFiles !== 'function') return;
      await global.RFExcelImport.ensureSheetJs();
      const accept = mapping.input && mapping.input.accept ? mapping.input.accept : '.xlsx,.xls,.xlsm,.xlsb,.csv';
      const multiple = !!(mapping.input && mapping.input.multiple);
      const files = await global.RFExcelImport.pickFiles({ accept, multiple, timeoutMs: 120000 });
      if (!files || !files.length) return;
      if (assignFilesToInput(mapping.input, files)) return;
      const handled = await fallbackInvoke(files);
      if (!handled) {
        throw new Error('Nu am găsit handlerul de import pentru această pagină.');
      }
    } catch (error) {
      console.error('RFExcelImport bootstrap', error);
      alert('Importul Excel a eșuat.\n' + (error && error.message ? error.message : error));
    }
  }

  function bind() {
    if (!global.RFExcelImport) return;
    const mappings = buildMappings();
    mappings.forEach(mapping => {
      if (!mapping.button) return;
      mapping.button.addEventListener('click', ev => { onImportClick(ev, mapping); }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})(window);
