(function(window){
  'use strict';

  function requireCommon(){ return window.MRC || window.MRCCommon || {}; }
  function trimText(value){ return String(value == null ? '' : value).trim(); }
  function toNumber(value){
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const txt = trimText(value).replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = Number(txt);
    return Number.isFinite(num) ? num : 0;
  }
  function normalizeText(value){
    return trimText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '')
      .toUpperCase();
  }
  function normalizePart(value){ return normalizeText(String(value || '').replace(/[._\-\s/]+/g, '')); }
  function pick(obj, keys){
    if (!obj || typeof obj !== 'object') return '';
    for (let i = 0; i < keys.length; i += 1){
      const key = keys[i];
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null && obj[key] !== '') return obj[key];
      const found = Object.keys(obj).find(k => normalizeText(k) === normalizeText(key));
      if (found && obj[found] != null && obj[found] !== '') return obj[found];
    }
    return '';
  }
  function detectHeaderRowIndex(sheet){
    if (!sheet || !window.XLSX || !window.XLSX.utils) return 0;
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header:1, raw:true, defval:'' });
    const markers = [
      ['customer part no', 'requested quantity', 'need by'],
      ['item id', 'ordered qty', 'ship date'],
      ['part', 'due qty', 'delivery date']
    ];
    let bestIndex = 0;
    let bestScore = 0;
    for (let i = 0; i < Math.min(matrix.length, 20); i += 1){
      const row = (matrix[i] || []).map(value => normalizeText(value));
      const joined = row.join('|');
      let score = 0;
      markers.forEach(group => {
        let hit = 0;
        group.forEach(token => { if (joined.includes(normalizeText(token))) hit += 1; });
        score = Math.max(score, hit);
      });
      if (score > bestScore){ bestScore = score; bestIndex = i; }
    }
    return bestScore >= 2 ? bestIndex : 0;
  }
  function loadSheetRows(workbook, sheetName){
    if (!workbook || !workbook.Sheets || !sheetName || !workbook.Sheets[sheetName]) return [];
    const sheet = workbook.Sheets[sheetName];
    const headerRowIndex = detectHeaderRowIndex(sheet);
    return window.XLSX.utils.sheet_to_json(sheet, { defval:'', raw:true, range:headerRowIndex });
  }
  function listWorkbookSheetNames(workbook){ return workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames.slice() : []; }
  function hasKeys(sample, keys){ return keys.every(key => trimText(pick(sample, [key])) !== ''); }

  function detectWorkbookSource(workbook){
    const names = listWorkbookSheetNames(workbook);
    for (const sheetName of names){
      const rows = loadSheetRows(workbook, sheetName);
      const sample = rows.find(row => row && typeof row === 'object' && !Array.isArray(row) && Object.keys(row).length);
      if (!sample) continue;
      const upperName = normalizeText(sheetName);
      if (upperName === 'RESULTS' && hasKeys(sample, ['Customer Part No.', 'Requested Quantity', 'Need By'])){
        return { sourceType:'results', sheetName };
      }
      if (upperName === 'DATA' && hasKeys(sample, ['Part', 'Due Qty', 'Delivery Date'])){
        return { sourceType:'data_sheet', sheetName };
      }
      if (hasKeys(sample, ['Item ID', 'Ordered Qty', 'Ship Date'])){
        return { sourceType:'data_export', sheetName };
      }
    }
    for (const sheetName of names){
      const rows = loadSheetRows(workbook, sheetName);
      const sample = rows.find(row => row && typeof row === 'object' && !Array.isArray(row) && Object.keys(row).length);
      if (!sample) continue;
      if (hasKeys(sample, ['Customer Part No.', 'Requested Quantity', 'Need By'])) return { sourceType:'results', sheetName };
      if (hasKeys(sample, ['Part', 'Due Qty', 'Delivery Date'])) return { sourceType:'data_sheet', sheetName };
      if (hasKeys(sample, ['Item ID', 'Ordered Qty', 'Ship Date'])) return { sourceType:'data_export', sheetName };
    }
    return { sourceType:'generic', sheetName:names[0] || '' };
  }

  function baseMappedRow(raw, maps, sourceLabel, sourceType, index){
    const MRC = requireCommon();
    const displayToIso = MRC.displayToIso || (v => trimText(v));
    const isoWeekKey = MRC.isoWeekKey || (() => '');
    const getMonthName = MRC.getMonthName || (() => '');
    const applyPartMapping = MRC.applyPartMapping || (row => row);
    const nowIso = MRC.nowIso || (() => new Date().toISOString());

    let rawPart = '';
    let quantity = 0;
    let deliveryIso = '';
    let clientName = trimText(pick(raw, ['Customer','Supplier','Description','Ship To','Supplier Name']));
    const lineId = trimText(pick(raw, ['line_id','Line ID','Line Id','BPO Line ID','BPO Line Id','line id']));
    let orderNo = trimText(pick(raw, ['Order No.','PO Nbr','PO NUMBER ','Order Id','Reference'])) || lineId;
    let commitment = trimText(pick(raw, ['Commitment Level','Status','Stato']));
    let notes = trimText(pick(raw, ['Description','Item Description','Descr1','observatii']));

    if (sourceType === 'results'){
      rawPart = trimText(pick(raw, ['Customer Part No.','Customer Part No','customer_part_no'])).toUpperCase();
      quantity = Math.max(0, Math.round(toNumber(pick(raw, ['Requested Quantity','RequestedQuantity']))));
      deliveryIso = displayToIso(pick(raw, ['Need By','NeedBy']));
    } else if (sourceType === 'data_export'){
      rawPart = trimText(pick(raw, ['Item ID','Item Id'])).toUpperCase();
      quantity = Math.max(0, Math.round(toNumber(pick(raw, ['Ordered Qty']))));
      deliveryIso = displayToIso(pick(raw, ['Ship Date']));
    } else if (sourceType === 'data_sheet'){
      rawPart = trimText(pick(raw, ['Part'])).toUpperCase();
      quantity = Math.max(0, Math.round(toNumber(pick(raw, ['Due Qty','DueQty']))));
      deliveryIso = displayToIso(pick(raw, ['Delivery Date']));
    } else {
      rawPart = trimText(pick(raw, ['raw_part','Customer Part No.','Part','Item ID'])).toUpperCase();
      quantity = Math.max(0, Math.round(toNumber(pick(raw, ['Requested Quantity','Due Qty','Ordered Qty','qty']))));
      deliveryIso = displayToIso(pick(raw, ['Need By','Ship Date','Delivery Date']));
    }

    const normalized = applyPartMapping({
      id: trimText(pick(raw, ['id','_id'])) || ('ord-' + sourceType + '-' + index + '-' + Math.random().toString(36).slice(2,8)),
      source_type: sourceType,
      source_file: sourceLabel,
      client_name: clientName,
      raw_part: rawPart,
      part_norm: normalizePart(rawPart),
      reper_intern: trimText(pick(raw, ['reper_intern','Reper_intern','reper'])).toUpperCase(),
      reper_debitare_origine: trimText(pick(raw, ['reper_debitare_origine','Reper_debitare_origine'])).toUpperCase(),
      material: trimText(pick(raw, ['material','Material'])).toUpperCase(),
      diametru: trimText(pick(raw, ['diametru','Diametru'])),
      kg_per_buc: toNumber(pick(raw, ['kg_per_buc','Kg_per_buc','kg/buc','Kg/Buc'])),
      delivery_date: deliveryIso,
      year: deliveryIso ? Number(deliveryIso.slice(0,4)) : 0,
      month: deliveryIso ? getMonthName(Number(deliveryIso.slice(5,7))) : '',
      week_key: deliveryIso ? isoWeekKey(deliveryIso) : '',
      quantity_buc: quantity,
      line_id: lineId,
      order_no: orderNo,
      commitment_level: commitment,
      notes: notes,
      imported_at: nowIso()
    }, maps);

    if (!normalized.week_key && normalized.delivery_date && isoWeekKey) normalized.week_key = isoWeekKey(normalized.delivery_date);
    if (!normalized.month && normalized.delivery_date && getMonthName) normalized.month = getMonthName(Number(normalized.delivery_date.slice(5,7)));
    if (!normalized.year && normalized.delivery_date) normalized.year = Number(normalized.delivery_date.slice(0,4));
    normalized.source_type = sourceType;
    return normalized;
  }

  function importCustomerOrdersFromWorkbook(workbook, maps, options){
    const MRC = requireCommon();
    const dedupeCustomerOrders = MRC.dedupeCustomerOrders || (rows => rows || []);
    const opts = options || {};
    const workbookName = trimText(opts.workbookName || opts.fileName || opts.source_file);
    const detected = detectWorkbookSource(workbook);
    const sheetName = detected.sheetName;
    const sourceType = detected.sourceType;
    const rows = [];
    const rawRows = sheetName ? loadSheetRows(workbook, sheetName) : [];
    rawRows.forEach((raw, index) => {
      const sourceLabel = workbookName ? (workbookName + ' / ' + sheetName) : sheetName;
      const normalized = baseMappedRow(raw, maps || {}, sourceLabel, sourceType, index);
      if (!normalized.raw_part && !normalized.reper_intern) return;
      if (!normalized.delivery_date) return;
      if (!(normalized.quantity_buc > 0)) return;
      rows.push(normalized);
    });
    return dedupeCustomerOrders(rows);
  }

  window.MRCOrderImporters = {
    detectWorkbookSource,
    importCustomerOrdersFromWorkbook
  };
})(window);
