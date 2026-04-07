(function (global) {
  'use strict';

  const SHEET_JS_CDNS = [
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ];

  let sheetJsPromise = null;

  function normalizeText(value) {
    return String(value ?? '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[_]/g, ' ')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(s => s.src === src);
      if (existing && global.XLSX) {
        resolve(global.XLSX);
        return;
      }
      const script = existing || document.createElement('script');
      script.src = src;
      script.async = true;
      const done = () => resolve(global.XLSX);
      const fail = () => reject(new Error('Nu s-a putut încărca biblioteca XLSX.'));
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', fail, { once: true });
      if (!existing) document.head.appendChild(script);
    });
  }

  async function ensureSheetJs() {
    if (global.XLSX) return global.XLSX;
    if (sheetJsPromise) return sheetJsPromise;

    sheetJsPromise = (async () => {
      let lastError = null;
      for (const src of SHEET_JS_CDNS) {
        try {
          await loadScript(src);
          if (global.XLSX) return global.XLSX;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error('Nu s-a putut încărca biblioteca XLSX.');
    })();

    return sheetJsPromise;
  }

  function cleanupInput(input) {
    if (!input) return;
    setTimeout(() => {
      try { input.remove(); } catch (_) {}
    }, 0);
  }

  function pickFile(options = {}) {
    const accept = options.accept || '.xlsx,.xls';
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.top = '0';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      document.body.appendChild(input);

      let settled = false;
      const finish = (file) => {
        if (settled) return;
        settled = true;
        cleanupInput(input);
        resolve(file || null);
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        cleanupInput(input);
        reject(error);
      };

      input.addEventListener('change', () => finish(input.files && input.files[0] ? input.files[0] : null), { once: true });
      input.addEventListener('cancel', () => finish(null), { once: true });

      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      } catch (_error) {
        try {
          input.click();
        } catch (error) {
          fail(error);
          return;
        }
      }

      setTimeout(() => finish(input.files && input.files[0] ? input.files[0] : null), options.timeoutMs || 120000);
    });
  }

  function findHeaderRow(rawArrays, expectedHeaders, aliases = {}) {
    const expected = expectedHeaders.map(header => [header, ...(aliases[header] || [])].map(normalizeText));
    const limit = Math.min(rawArrays.length, 30);
    for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
      const row = Array.isArray(rawArrays[rowIndex]) ? rawArrays[rowIndex].map(normalizeText) : [];
      let matched = 0;
      expected.forEach(variants => {
        if (row.some(cell => cell && variants.some(variant => cell === variant || cell.includes(variant) || variant.includes(cell)))) {
          matched += 1;
        }
      });
      if (matched >= Math.max(1, expectedHeaders.length - 1)) return rowIndex;
    }
    return -1;
  }

  function readExcelRowsFromSheet(ws, expectedHeaders, aliases = {}) {
    const XLSX = global.XLSX;
    if (!XLSX) throw new Error('XLSX nu este încărcat.');
    const rawArrays = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    if (!rawArrays.length) return [];

    const headerRowIndex = findHeaderRow(rawArrays, expectedHeaders, aliases);
    if (headerRowIndex < 0) return [];

    const headerRow = (rawArrays[headerRowIndex] || []).map(normalizeText);
    const indexMap = {};
    expectedHeaders.forEach(header => {
      const variants = [header, ...(aliases[header] || [])].map(normalizeText);
      let idx = headerRow.findIndex(cell => variants.some(variant => cell === variant));
      if (idx < 0) idx = headerRow.findIndex(cell => variants.some(variant => cell && (cell.includes(variant) || variant.includes(cell))));
      indexMap[header] = idx;
    });

    return rawArrays.slice(headerRowIndex + 1).map(row => {
      const obj = {};
      expectedHeaders.forEach(header => {
        const idx = indexMap[header];
        obj[header] = idx >= 0 ? row[idx] : '';
      });
      return obj;
    }).filter(obj => expectedHeaders.some(header => String(obj[header] ?? '').trim() !== ''));
  }

  async function importWorkbook(options = {}) {
    const XLSX = await ensureSheetJs();
    const file = options.file || await pickFile({ accept: options.accept || '.xlsx,.xls', timeoutMs: options.timeoutMs });
    if (!file) return { cancelled: true, file: null, workbook: null, sheetName: '', rows: [], normalizedRows: [], XLSX };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = options.sheetName || workbook.SheetNames[0];
    if (!sheetName) throw new Error('Fișierul Excel nu conține foi.');
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error('Nu am putut deschide prima foaie din Excel.');

    let rows = [];
    if (Array.isArray(options.expectedHeaders) && options.expectedHeaders.length) {
      rows = readExcelRowsFromSheet(worksheet, options.expectedHeaders, options.aliases || {});
    } else {
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
    }

    const normalizedRows = typeof options.normalizeRow === 'function'
      ? rows.map((row, index) => options.normalizeRow(row, index, file.name)).filter(Boolean)
      : rows;

    return { cancelled: false, file, workbook, sheetName, worksheet, rows, normalizedRows, XLSX };
  }

  global.RFExcelImport = {
    ensureSheetJs,
    pickFile,
    normalizeText,
    findHeaderRow,
    readExcelRowsFromSheet,
    importWorkbook
  };
})(window);