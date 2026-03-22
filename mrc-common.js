(function(window){
  'use strict';

  const DOC_TABLE = 'rf_documents';
  const FORJATE_DOC_PREFIX = 'forjate:';
  const LEGACY_FORJATE_DOC_KEY = 'forjate';
  const PLAN_DOC_KEY = 'planificare-forja';
  const MAPPING_TABLE = 'rf_helper_mrc_part_mapping';
  const REPERE_FORJATE_TABLE = 'rf_helper_repere_forjate';
  const REPERE_DEBITARE_TABLE = 'rf_helper_repere_debitare';
  const MONTH_NAMES = ['IANUARIE','FEBRUARIE','MARTIE','APRILIE','MAI','IUNIE','IULIE','AUGUST','SEPTEMBRIE','OCTOMBRIE','NOIEMBRIE','DECEMBRIE'];
  const MACHINE_ORDER = ['2,5 T','3 T BR','MP','1,25 T','3 T ZR','5 T CHINA'];

  function trimText(value){ return String(value == null ? '' : value).trim(); }
  function toNumber(value){
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const txt = trimText(value).replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = Number(txt);
    return Number.isFinite(num) ? num : 0;
  }
  function toRound(value){ return Math.max(0, Math.round(toNumber(value))); }
  function normalizeText(value){
    return trimText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '')
      .toUpperCase();
  }
  function normalizeLoose(value){ return normalizeText(value).replace(/^0+/, ''); }
  function normalizePart(value){ return normalizeLoose(String(value || '').replace(/[._\-\s/]+/g, '')); }
  function formatNumber(value, digits){
    const num = Number(value || 0);
    const useDigits = Number.isFinite(digits) ? digits : 0;
    return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: useDigits, maximumFractionDigits: useDigits }).format(num);
  }
  function formatKg(value){ return formatNumber(value, 2); }
  function safeJsonClone(value){ try { return JSON.parse(JSON.stringify(value)); } catch(_){ return value; } }
  function nowIso(){ return new Date().toISOString(); }
  function arrayCell(row, idx, fallback){ return Array.isArray(row) ? (row[idx] == null ? fallback : row[idx]) : fallback; }
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
  function getMonthName(value){
    const idx = Number(value || 0) - 1;
    return idx >= 0 && idx < MONTH_NAMES.length ? MONTH_NAMES[idx] : '';
  }
  function monthNumberFromAny(value){
    if (typeof value === 'number' && value >= 1 && value <= 12) return Math.round(value);
    const txt = trimText(value).toUpperCase();
    if (!txt) return 0;
    const direct = Number(txt);
    if (direct >= 1 && direct <= 12) return Math.round(direct);
    const normalized = normalizeText(txt);
    const idx = MONTH_NAMES.findIndex(name => normalizeText(name) === normalized || normalizeText(name).startsWith(normalized) || normalized.startsWith(normalizeText(name)));
    return idx >= 0 ? idx + 1 : 0;
  }
  function monthKey(year, monthNum){
    const y = Number(year || 0);
    const m = Number(monthNum || 0);
    if (!y || !m) return '';
    return String(y).padStart(4,'0') + '-' + String(m).padStart(2,'0');
  }
  function monthInputToIso(value){
    const txt = trimText(value);
    if (!/^\d{4}-\d{2}$/.test(txt)) return '';
    return txt + '-01';
  }
  function startOfMonthIsoFromInput(value){ return monthInputToIso(value); }
  function endOfMonthIso(isoOrMonth){
    let iso = trimText(isoOrMonth);
    if (/^\d{4}-\d{2}$/.test(iso)) iso += '-01';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end.toISOString().slice(0,10);
  }
  function compareIso(a, b){ return String(a || '').localeCompare(String(b || '')); }
  function addDaysIso(iso, delta){
    const txt = trimText(iso);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txt)) return '';
    const d = new Date(txt + 'T00:00:00');
    d.setDate(d.getDate() + Number(delta || 0));
    return d.toISOString().slice(0,10);
  }
  function displayToIso(value){
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0,10);
    const txt = trimText(value);
    if (!txt) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) return txt;
    if (/^\d{4}-\d{2}$/.test(txt)) return txt + '-01';
    if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(txt)){
      const parts = txt.split(/[.\/-]/).map(x => Number(x));
      let d = parts[0] || 0; let m = parts[1] || 0; let y = parts[2] || 0;
      if (y < 100) y += 2000;
      if (!y || m < 1 || m > 12 || d < 1 || d > 31) return '';
      return String(y).padStart(4,'0') + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    }
    const asDate = new Date(txt);
    return Number.isNaN(asDate.getTime()) ? '' : asDate.toISOString().slice(0,10);
  }
  function isoToDisplay(value){
    const iso = displayToIso(value);
    if (!iso) return '';
    return iso.slice(8,10) + '.' + iso.slice(5,7) + '.' + iso.slice(0,4);
  }
  function isoWeekParts(iso){
    const txt = displayToIso(iso);
    if (!txt) return { year:0, week:0, key:'' };
    const date = new Date(txt + 'T00:00:00Z');
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    const year = date.getUTCFullYear();
    return { year, week, key: String(year) + '-W' + String(week).padStart(2,'0') };
  }
  function isoWeekKey(iso){ return isoWeekParts(iso).key; }
  function parseYearWeek(value){
    const txt = trimText(value).toUpperCase();
    const m = txt.match(/^(\d{4})[- ]?W?(\d{1,2})$/);
    if (!m) return null;
    return { year: Number(m[1]), week: Number(m[2]) };
  }
  function startOfIsoWeek(year, week){
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay() || 7;
    if (dow <= 4) simple.setUTCDate(simple.getUTCDate() - dow + 1);
    else simple.setUTCDate(simple.getUTCDate() + 8 - dow);
    return simple.toISOString().slice(0,10);
  }
  function isActive(value){ return !(value === false || String(value).toLowerCase() === 'false' || String(value) === '0'); }
  function buildSpecKey(material, diametru){
    const mat = trimText(material).toUpperCase();
    const diam = trimText(diametru);
    if (!mat && !diam) return '';
    return mat + '|' + diam;
  }
  function parseDocRowArray(row){ return Array.isArray(row) ? row : []; }
  function extractRowsPayload(payload){
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  }
  async function readDocumentCompat(sb, docKey){
    if (!sb || !docKey) return null;
    try {
      const res = await sb.from(DOC_TABLE).select('*').eq('doc_key', docKey).maybeSingle();
      if (res.error) return null;
      return res.data || null;
    } catch(_){
      return null;
    }
  }
  async function queryDocsByKeys(sb, keys){
    const list = Array.from(new Set((keys || []).map(trimText).filter(Boolean)));
    if (!sb || !list.length) return [];
    try {
      const res = await sb.from(DOC_TABLE).select('*').in('doc_key', list);
      return res.error ? [] : (res.data || []);
    } catch(_){
      return [];
    }
  }
  async function writeDocumentCompat(sb, docKey, payload){
    const body = { doc_key: docKey, updated_at: payload && payload.updated_at ? payload.updated_at : nowIso(), content: payload };
    const res = await sb.from(DOC_TABLE).upsert(body, { onConflict:'doc_key' });
    if (res.error) throw res.error;
    return true;
  }

  function detectHeaderRowIndex(sheet){
    if (!sheet || !window.XLSX || !window.XLSX.utils) return 0;
    const matrix = window.XLSX.utils.sheet_to_json(sheet, { header:1, raw:true, defval:'' });
    const markers = [
      ['customer', 'customer part no', 'need by', 'requested quantity'],
      ['rawpart', 'part_norm', 'reper_intern'],
      ['reper', 'stoc forja', 'stoc otel'],
      ['customer part no.', 'order no.', 'need by']
    ];
    let bestIndex = 0;
    let bestScore = 0;
    for (let i = 0; i < Math.min(matrix.length, 15); i += 1){
      const row = (matrix[i] || []).map(value => normalizeText(value));
      const joined = row.join(' | ');
      let score = 0;
      markers.forEach(group => {
        let hit = 0;
        group.forEach(token => { if (joined.includes(normalizeText(token))) hit += 1; });
        score = Math.max(score, hit);
      });
      if (score > bestScore){
        bestScore = score;
        bestIndex = i;
      }
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


  async function loadHelperMaps(sb){
    const result = {
      mappingRows: [],
      forjaRows: [],
      debitRows: [],
      byRawPart: Object.create(null),
      byNormPart: Object.create(null),
      byInternalReper: Object.create(null),
      byDebitare: Object.create(null),
      source: 'helper-data'
    };

    let usedFallbackDoc = false;

    try {
      const [mapRes, forjaRes, debitRes] = await Promise.all([
        sb.from(MAPPING_TABLE).select('*').order('sort_order', { ascending:true }),
        sb.from(REPERE_FORJATE_TABLE).select('*').order('sort_order', { ascending:true }),
        sb.from(REPERE_DEBITARE_TABLE).select('*').order('sort_order', { ascending:true })
      ]);
      if (!mapRes.error) result.mappingRows = (mapRes.data || []).filter(isActive).map((row, index) => normalizeMappingRow(row, index));
      if (!forjaRes.error) result.forjaRows = (forjaRes.data || []).filter(isActive);
      if (!debitRes.error) result.debitRows = (debitRes.data || []).filter(isActive);
    } catch(error){
      result.source = 'helper-data error';
    }

    try {
      const doc = await readDocumentCompat(sb, 'mrc-part-mapping');
      const payloadRows = doc ? extractRowsPayload(doc.content || doc.data) : [];
      if (payloadRows.length) {
        result.mappingRows = payloadRows.map((row, index) => normalizeMappingRow(row, index)).filter(row => isActive(row.is_active));
        result.source = 'rf_documents / mrc-part-mapping';
        usedFallbackDoc = true;
      }
    } catch (_) {}

    result.mappingRows.forEach(row => {
      const rawKey = normalizePart(row.raw_part);
      const normKey = normalizePart(row.part_norm);
      const internalKey = normalizeLoose(row.reper_intern);
      if (rawKey && !result.byRawPart[rawKey]) result.byRawPart[rawKey] = row;
      if (normKey && !result.byNormPart[normKey]) result.byNormPart[normKey] = row;
      if (internalKey && !result.byInternalReper[internalKey]) result.byInternalReper[internalKey] = row;
    });

    result.forjaRows.forEach(raw => {
      const row = {
        reper_forjat: trimText(raw.reper_forjat || raw.REPER_FORJAT || raw.reper || raw.REPER).toUpperCase(),
        reper_debitare_origine: trimText(raw.reper_debitare_origine || raw.REPER_DEBITARE_ORIGINE || raw.reper_debitare || raw.REPER_DEBITARE).toUpperCase(),
        material: trimText(raw.calitate_otel || raw.CALITATE_OTEL || '').toUpperCase(),
        dimensiune_otel: trimText(raw.dimensiune_otel || raw.DIMENSIUNE_OTEL || raw.diametru_otel || ''),
        kg_buc_forjat: toNumber(raw.kg_buc_forjat || raw.KG_BUC_FORJAT || 0)
      };
      const key = normalizeLoose(row.reper_forjat);
      if (key) result.byInternalReper[key] = Object.assign({}, result.byInternalReper[key] || {}, {
        reper_intern: row.reper_forjat,
        reper_debitare_origine: row.reper_debitare_origine || (result.byInternalReper[key] && result.byInternalReper[key].reper_debitare_origine) || '',
        material: row.material || (result.byInternalReper[key] && result.byInternalReper[key].material) || '',
        diametru: row.dimensiune_otel || (result.byInternalReper[key] && result.byInternalReper[key].diametru) || '',
        kg_per_buc: row.kg_buc_forjat || (result.byInternalReper[key] && result.byInternalReper[key].kg_per_buc) || 0
      });
    });

    result.debitRows.forEach(raw => {
      const reper = trimText(raw.reper_debitare || raw.REPER_DEBITARE || '').toUpperCase();
      if (!reper) return;
      result.byDebitare[normalizeLoose(reper)] = {
        reper_debitare_origine: reper,
        material: trimText(raw.calitate_otel || raw.CALITATE_OTEL || '').toUpperCase(),
        diametru: trimText(raw.diametru_otel || raw.DIAMETRU_OTEL || ''),
        kg_per_buc: toNumber(raw.kg_buc_debitat || raw.KG_BUC_DEBITAT || 0)
      };
    });

    if (usedFallbackDoc && !result.mappingRows.length) result.source = 'fără mapare';
    return result;
  }


  function normalizeMappingRow(row, index){
    return {
      id: trimText(row.id || '') || ('map-' + index),
      client_name: trimText(row.client_name || row.CLIENT_NAME || row.customer || row.Customer || ''),
      raw_part: trimText(row.raw_part || row.RAW_PART || row.RawPart || row['RawPart'] || row.part || row.Part || '').toUpperCase(),
      part_norm: trimText(row.part_norm || row.PART_NORM || row.Part_Norm || row['Part_Norm'] || '').toUpperCase(),
      reper_intern: trimText(row.reper_intern || row.REPER_INTERN || row.Reper_intern || '').toUpperCase(),
      reper_debitare_origine: trimText(row.reper_debitare_origine || row.REPER_DEBITARE_ORIGINE || row.Reper_debitare_origine || '').toUpperCase(),
      material: trimText(row.material || row.MATERIAL || row.Material || '').toUpperCase(),
      diametru: trimText(row.diametru || row.DIAMETRU || row.Diametru || ''),
      kg_per_buc: toNumber(row.kg_per_buc || row.KG_PER_BUC || row.Kg_per_buc || 0),
      notes: trimText(row.notes || row.NOTES || row.observatii || row.OBSERVATII || ''),
      sort_order: Number(row.sort_order || index + 1) || (index + 1),
      is_active: isActive(row.is_active)
    };
  }


  function importPartMappingFromWorkbook(workbook){
    const rows = [];
    listWorkbookSheetNames(workbook).forEach(sheetName => {
      const rawRows = loadSheetRows(workbook, sheetName);
      rawRows.forEach((raw, index) => {
        const row = normalizeMappingRow(Object.assign({ source_sheet: sheetName }, raw), rows.length + index);
        if (!row.raw_part && !row.part_norm && !row.reper_intern) return;
        rows.push(row);
      });
    });
    const seen = new Set();
    return rows.filter(row => {
      const key = [normalizePart(row.raw_part), normalizePart(row.part_norm), normalizeLoose(row.reper_intern)].join('|');
      if (!key.replace(/\|/g,'')) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeIntrariOtelRow(row, index){
    const obj = Array.isArray(row) ? {
      an: arrayCell(row, 0, 0),
      luna: arrayCell(row, 1, ''),
      data: arrayCell(row, 2, ''),
      diametru: arrayCell(row, 3, ''),
      calitate: arrayCell(row, 4, ''),
      cantitate_kg: arrayCell(row, 7, 0)
    } : (row || {});
    const dataIso = displayToIso(pick(obj, ['data','DATA','date','Date','Data Intrare','data intrare','Delivery Date']));
    return {
      id: trimText(pick(obj, ['id','_id'])) || ('intrari-flow-' + index),
      an: Number(pick(obj, ['an','AN','Anul','year'])) || (dataIso ? Number(dataIso.slice(0,4)) : 0),
      data: dataIso,
      material: trimText(pick(obj, ['calitate','calitate_otel','Calitate otel','Calitate Oțel','material','Material'])).toUpperCase(),
      diametru: trimText(pick(obj, ['diametru','diametru_otel','Diametru otel','Dimensiune Otel','Dimensiune Oțel'])),
      cantitate_kg: Math.max(0, toNumber(pick(obj, ['cantitate_kg','cantitateKg','cantitate','Cantitate in KG','Cantitate KG','kg'])))
    };
  }

  async function loadIntrariRowsForYears(sb, years){
    const uniqueYears = Array.from(new Set((years || []).map(v => Number(v)).filter(v => v > 0)));
    const rows = [];
    const sourceParts = [];
    if (!uniqueYears.length) return { rows, source:'', ok:true };
    const keys = uniqueYears.map(year => 'intrari-otel:' + year).concat(['intrari-otel']);
    const docs = await queryDocsByKeys(sb, keys);
    uniqueYears.forEach(year => {
      const specific = docs.find(doc => doc.doc_key === ('intrari-otel:' + year) && extractRowsPayload(doc.content || doc.data).length);
      const fallback = docs.find(doc => doc.doc_key === 'intrari-otel' && extractRowsPayload(doc.content || doc.data).length);
      const picked = specific || fallback;
      if (!picked) return;
      sourceParts.push(picked.doc_key || 'intrari-otel');
      extractRowsPayload(picked.content || picked.data).forEach((raw, index) => {
        const row = normalizeIntrariOtelRow(raw, index);
        if (row.data && row.material && row.diametru && row.cantitate_kg > 0 && row.an) rows.push(row);
      });
    });
    return { rows, source: Array.from(new Set(sourceParts)).join(', '), ok:true };
  }

  function findMappingFromCompositeText(text, maps){
    const sourceText = trimText(text).toUpperCase();
    if (!maps || !sourceText) return null;
    const hayPart = normalizePart(sourceText);
    const hayLoose = normalizeLoose(sourceText);
    if (!hayPart && !hayLoose) return null;
    const rows = Array.isArray(maps.mappingRows) ? maps.mappingRows : [];
    let best = null;
    let bestScore = 0;
    rows.forEach(row => {
      const candidates = [
        { key: normalizePart(row.raw_part), score: 40 },
        { key: normalizePart(row.part_norm), score: 35 },
        { key: normalizeLoose(row.reper_intern), score: 28 },
        { key: normalizeLoose(row.reper_debitare_origine), score: 24 }
      ];
      candidates.forEach(candidate => {
        if (!candidate.key) return;
        const hay = candidate.score >= 35 ? hayPart : hayLoose;
        if (!hay) return;
        if (hay === candidate.key || hay.includes(candidate.key)) {
          const score = candidate.score + candidate.key.length;
          if (score > bestScore) {
            best = row;
            bestScore = score;
          }
        }
      });
    });
    return best;
  }

  function applyPartMapping(row, maps){
    const target = Object.assign({}, row || {});
    const rawText = trimText(target.raw_part || target.raw_reper || target.part || target.customer_part_no);
    const rawKey = normalizePart(rawText);
    const normKey = normalizePart(target.part_norm);
    const internalKey = normalizeLoose(target.reper_intern);
    const debitKey = normalizeLoose(target.reper_debitare_origine);
    const source = (maps && (
      maps.byRawPart[rawKey] ||
      maps.byNormPart[normKey] ||
      maps.byInternalReper[internalKey] ||
      maps.byInternalReper[debitKey] ||
      findMappingFromCompositeText(rawText, maps)
    )) || null;
    if (source){
      target.client_name = target.client_name || source.client_name || '';
      target.part_norm = trimText(target.part_norm || source.part_norm).toUpperCase();
      target.reper_intern = trimText(target.reper_intern || source.reper_intern).toUpperCase();
      target.reper_debitare_origine = trimText(target.reper_debitare_origine || source.reper_debitare_origine).toUpperCase();
      target.material = trimText(target.material || source.material).toUpperCase();
      target.diametru = trimText(target.diametru || source.diametru);
      target.kg_per_buc = toNumber(target.kg_per_buc || source.kg_per_buc);
      target.mapping_status = 'Mapat';
    } else if (maps && internalKey && maps.byInternalReper[internalKey]) {
      const helper = maps.byInternalReper[internalKey];
      target.reper_intern = trimText(target.reper_intern || helper.reper_intern).toUpperCase();
      target.reper_debitare_origine = trimText(target.reper_debitare_origine || helper.reper_debitare_origine).toUpperCase();
      target.material = trimText(target.material || helper.material).toUpperCase();
      target.diametru = trimText(target.diametru || helper.diametru);
      target.kg_per_buc = toNumber(target.kg_per_buc || helper.kg_per_buc);
      target.mapping_status = 'Mapat intern';
    } else {
      target.mapping_status = target.reper_intern ? 'Parțial' : 'Nemapat';
    }
    if (!target.material && target.reper_debitare_origine){
      const deb = maps && maps.byDebitare[normalizeLoose(target.reper_debitare_origine)];
      if (deb){
        target.material = trimText(target.material || deb.material).toUpperCase();
        target.diametru = trimText(target.diametru || deb.diametru);
        if (!target.kg_per_buc) target.kg_per_buc = toNumber(deb.kg_per_buc);
      }
    }
    return target;
  }

  function normalizeCustomerOrderRow(row, index, maps){
    const obj = Array.isArray(row) ? {
      client_name: arrayCell(row, 0, ''),
      raw_part: arrayCell(row, 2, ''),
      order_no: arrayCell(row, 3, ''),
      delivery_date: arrayCell(row, 5, ''),
      quantity_buc: arrayCell(row, 7, 0)
    } : (row || {});
    let deliveryIso = displayToIso(pick(obj, ['delivery_date','Need By','Delivery Date','NeedBy','due date','Due Date','need_by','data_livrare','Ship Date']));
    if (!deliveryIso) deliveryIso = displayToIso(pick(obj, ['WeekDlvDate']));
    const rawPart = trimText(pick(obj, ['raw_part','Customer Part No.','Customer Part No','customer_part_no','Part','Item ID','Item Id','Part No','Customer Part', 'pn', 'Pn'])).toUpperCase();
    const sourceFile = trimText(pick(obj, ['source_file','Source','Sheet','sheet_name'])) || '';
    const clientName = trimText(pick(obj, ['client_name','Customer','Supplier','Description','Ship To','Supplier Name','SUPPLIER NAME']));
    const normalized = applyPartMapping({
      id: trimText(pick(obj, ['id','_id'])) || ('ord-' + index + '-' + Math.random().toString(36).slice(2,8)),
      source_file: sourceFile,
      client_name: clientName,
      raw_part: rawPart,
      part_norm: trimText(pick(obj, ['part_norm','Part_Norm','Part Norm','part norm'])).toUpperCase() || normalizePart(rawPart),
      reper_intern: trimText(pick(obj, ['reper_intern','Reper_intern','reper'])).toUpperCase(),
      reper_debitare_origine: trimText(pick(obj, ['reper_debitare_origine','Reper_debitare_origine'])).toUpperCase(),
      material: trimText(pick(obj, ['material','Material'])).toUpperCase(),
      diametru: trimText(pick(obj, ['diametru','Diametru'])),
      kg_per_buc: toNumber(pick(obj, ['kg_per_buc','Kg_per_buc','kg/buc','Kg/Buc'])),
      delivery_date: deliveryIso,
      year: deliveryIso ? Number(deliveryIso.slice(0,4)) : Number(pick(obj, ['year','Ship Year','an'])) || 0,
      month: deliveryIso ? getMonthName(Number(deliveryIso.slice(5,7))) : trimText(pick(obj, ['month','Ship Month','luna'])).toUpperCase(),
      week_key: deliveryIso ? isoWeekKey(deliveryIso) : trimText(pick(obj, ['WeekDlvDate','YearWeek','yearweek','week_key'])).replace(/\s+/g,''),
      quantity_buc: Math.max(0, Math.round(toNumber(pick(obj, ['quantity_buc','Requested Quantity','Due Qty','Ordered Qty','Balance','Demand','Cum Qty','qty','RequestedQuantity','cantitate'])))),
      order_no: trimText(pick(obj, ['order_no','Order No.','PO Nbr','PO NUMBER ','Order Id','Reference'])),
      commitment_level: trimText(pick(obj, ['commitment_level','Commitment Level','Stato','Status'])),
      notes: trimText(pick(obj, ['notes','Descr1','Description','Item Description','observatii'])),
      imported_at: nowIso()
    }, maps);
    if (!normalized.week_key && normalized.delivery_date) normalized.week_key = isoWeekKey(normalized.delivery_date);
    if (!normalized.month && normalized.delivery_date) normalized.month = getMonthName(Number(normalized.delivery_date.slice(5,7)));
    if (!normalized.year && normalized.delivery_date) normalized.year = Number(normalized.delivery_date.slice(0,4));
    return normalized;
  }

  function customerOrderDedupKey(row){
    const item = row || {};
    return [
      normalizeLoose(item.client_name || item.customer_name || ''),
      normalizePart(item.raw_part || item.part_norm || item.reper_intern || ''),
      trimText(item.order_no).toUpperCase(),
      displayToIso(item.delivery_date),
      trimText(item.commitment_level).toUpperCase(),
      Math.round(toNumber(item.quantity_buc || 0) * 1000) / 1000
    ].join('|');
  }

  function dedupeCustomerOrders(rows){
    const seen = new Set();
    return (rows || []).filter(row => {
      const key = customerOrderDedupKey(row);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function mergeCustomerOrders(existingRows, importedRows){
    return dedupeCustomerOrders([].concat(Array.isArray(existingRows) ? existingRows : [], Array.isArray(importedRows) ? importedRows : []));
  }


  function customerOrderClientPeriod(rows){
    const list = Array.isArray(rows) ? rows : [];
    const clients = Array.from(new Set(list.map(row => normalizeLoose(row.client_name || row.customer_name || '')).filter(Boolean)));
    const dates = list.map(row => displayToIso(row.delivery_date)).filter(Boolean).sort();
    return { clients, fromIso: dates[0] || '', toIso: dates.length ? dates[dates.length - 1] : '' };
  }

  function replaceCustomerOrdersForClientPeriod(existingRows, importedRows){
    const existing = Array.isArray(existingRows) ? existingRows : [];
    const imported = dedupeCustomerOrders(importedRows || []);
    if (!imported.length) return dedupeCustomerOrders(existing);
    const period = customerOrderClientPeriod(imported);
    const kept = existing.filter(row => {
      const clientKey = normalizeLoose(row.client_name || row.customer_name || '');
      const rowDate = displayToIso(row.delivery_date);
      if (period.clients.length && !period.clients.includes(clientKey)) return true;
      if (!period.fromIso || !period.toIso || !rowDate) return false;
      return rowDate < period.fromIso || rowDate > period.toIso;
    });
    return dedupeCustomerOrders([].concat(kept, imported));
  }

  function openingStockDedupKey(row){
    const item = row || {};
    return [
      monthKey(item.year, item.month_num),
      normalizeLoose(item.reper_intern || item.raw_reper || item.reper || ''),
      normalizePart(item.raw_reper || ''),
      normalizeLoose(item.material || ''),
      trimText(item.diametru || '')
    ].join('|');
  }

  function dedupeOpeningStocks(rows){
    const map = new Map();
    (rows || []).forEach(row => {
      const key = openingStockDedupKey(row);
      if (!key.replace(/\|/g, '')) return;
      map.set(key, row);
    });
    return Array.from(map.values());
  }

  function mergeOpeningStocks(existingRows, importedRows){
    return dedupeOpeningStocks([].concat(Array.isArray(existingRows) ? existingRows : [], Array.isArray(importedRows) ? importedRows : []));
  }

  function hasFullMapping(row){
    const item = row || {};
    return !!(trimText(item.reper_intern) && trimText(item.material) && trimText(item.diametru) && toNumber(item.kg_per_buc) > 0);
  }

  function importCustomerOrdersFromWorkbook(workbook, maps, options){
    const rows = [];
    const opts = options || {};
    const workbookName = trimText(opts.workbookName || opts.fileName || opts.source_file);
    listWorkbookSheetNames(workbook).forEach(sheetName => {
      const rawRows = loadSheetRows(workbook, sheetName);
      rawRows.forEach((raw, index) => {
        const sourceLabel = workbookName ? (workbookName + ' / ' + sheetName) : sheetName;
        const normalized = normalizeCustomerOrderRow(Object.assign({ source_file: sourceLabel, source_workbook: workbookName, sheet_name: sheetName }, raw), index, maps);
        if (!normalized.raw_part && !normalized.reper_intern) return;
        if (!normalized.delivery_date) return;
        if (!(normalized.quantity_buc > 0)) return;
        rows.push(normalized);
      });
    });
    return dedupeCustomerOrders(rows);
  }

  function normalizeOpeningStockRow(row, index, maps){
    const obj = row || {};
    const rawReper = trimText(pick(obj, ['raw_reper','Reper raw','reper_raw','reper','Part','RawPart'])).toUpperCase();
    const normalized = applyPartMapping({
      id: trimText(pick(obj, ['id','_id'])) || ('stock-' + index + '-' + Math.random().toString(36).slice(2,8)),
      source_label: trimText(pick(obj, ['source_label','month_label','month'])),
      raw_reper: rawReper,
      reper_intern: trimText(pick(obj, ['reper_intern','reper'])).toUpperCase(),
      reper_debitare_origine: trimText(pick(obj, ['reper_debitare_origine'])).toUpperCase(),
      material: trimText(pick(obj, ['material'])).toUpperCase(),
      diametru: trimText(pick(obj, ['diametru'])),
      kg_per_buc: toNumber(pick(obj, ['kg_per_buc'])),
      notes: trimText(pick(obj, ['notes','observatii']))
    }, maps);
    const year = Number(pick(obj, ['year','an','AN'])) || 0;
    const monthNum = Number(pick(obj, ['month_num','month','luna_num'])) || monthNumberFromAny(pick(obj, ['luna','month_label','source_label']));
    normalized.year = year;
    normalized.month_num = monthNum;
    normalized.month = getMonthName(monthNum);
    normalized.month_key = monthKey(year, monthNum);
    normalized.stoc_ambalat = toRound(pick(obj, ['stoc_ambalat','packed','STOC AMBALAT (PACKED PCS)']));
    normalized.stoc_finite = toRound(pick(obj, ['stoc_finite','finished','STOC FINITE PRELUCRARI (FINISHED PCS)']));
    normalized.stoc_wip = toRound(pick(obj, ['stoc_wip','STOC WIP      (WORK IN PROCESS PCS)','wip']));
    normalized.stoc_forja = toRound(pick(obj, ['stoc_forja','STOC FORJA (BUC)','forja']));
    normalized.stoc_debitat = toRound(pick(obj, ['stoc_debitat','STOC DEBITAT (BUC)','debitat']));
    normalized.stoc_otel_kg = toNumber(pick(obj, ['stoc_otel_kg','STOC OTEL       (KG)','otel']));
    normalized.stoc_remaniere = toRound(pick(obj, ['stoc_remaniere','Stoc Remaniere/ptr tratare']));
    normalized.total_piese = normalized.stoc_ambalat + normalized.stoc_finite + normalized.stoc_wip + normalized.stoc_forja;
    return normalized;
  }

  function parseMonthLabel(label){
    const txt = trimText(label).toUpperCase();
    if (!txt) return { year:0, month:0, label:'' };
    const yearMatch = txt.match(/(20\d{2})/);
    const year = yearMatch ? Number(yearMatch[1]) : 0;
    const nameMatch = MONTH_NAMES.findIndex(name => normalizeText(txt).includes(normalizeText(name)));
    return { year, month: nameMatch >= 0 ? nameMatch + 1 : 0, label: txt };
  }

  function importOpeningStockFromWorkbook(workbook, maps){
    const stocksSheetName = listWorkbookSheetNames(workbook).find(name => normalizeText(name) === 'STOCKS');
    const rows = [];
    if (stocksSheetName){
      const sheet = workbook.Sheets[stocksSheetName];
      const matrix = window.XLSX.utils.sheet_to_json(sheet, { header:1, raw:true, defval:'' });
      const header = matrix[0] || [];
      const groups = [];
      for (let col = 0; col < header.length; col += 8){
        const parsed = parseMonthLabel(header[col]);
        if (!parsed.year || !parsed.month) continue;
        groups.push({ col, year: parsed.year, month: parsed.month, label: parsed.label });
      }
      for (let r = 2; r < matrix.length; r += 1){
        const row = matrix[r] || [];
        groups.forEach(group => {
          const rawReper = trimText(row[group.col]).toUpperCase();
          const values = row.slice(group.col, group.col + 8);
          const hasData = values.some(v => trimText(v) !== '');
          if (!rawReper || !hasData) return;
          rows.push(normalizeOpeningStockRow({
            raw_reper: rawReper,
            year: group.year,
            month_num: group.month,
            source_label: group.label,
            stoc_ambalat: row[group.col + 1],
            stoc_finite: row[group.col + 2],
            stoc_wip: row[group.col + 3],
            stoc_forja: row[group.col + 4],
            stoc_debitat: row[group.col + 5],
            stoc_otel_kg: row[group.col + 6],
            stoc_remaniere: row[group.col + 7]
          }, rows.length, maps));
        });
      }
      return rows.filter(row => row.year && row.month_num && (row.raw_reper || row.reper_intern));
    }
    listWorkbookSheetNames(workbook).forEach(sheetName => {
      loadSheetRows(workbook, sheetName).forEach((raw, index) => {
        const row = normalizeOpeningStockRow(Object.assign({ source_label: sheetName }, raw), index, maps);
        if (!row.year || !row.month_num || (!row.raw_reper && !row.reper_intern)) return;
        rows.push(row);
      });
    });
    return rows;
  }

  function normalizeSteelPoRow(row, index){
    const obj = row || {};
    const etaIso = displayToIso(pick(obj, ['eta_date','ETA','data_livrare','delivery_date','Data','date']));
    return {
      id: trimText(pick(obj, ['id','_id'])) || ('po-' + index + '-' + Math.random().toString(36).slice(2,8)),
      po_number: trimText(pick(obj, ['po_number','order_no','nr_comanda','numar comanda','PO'])),
      supplier: trimText(pick(obj, ['supplier','furnizor','Supplier'])),
      material: trimText(pick(obj, ['material','Material'])).toUpperCase(),
      diametru: trimText(pick(obj, ['diametru','Diametru'])),
      qty_kg: toNumber(pick(obj, ['qty_kg','cantitate_kg','cantitate','Qty','KG'])),
      eta_date: etaIso,
      eta_week_key: etaIso ? isoWeekKey(etaIso) : trimText(pick(obj, ['eta_week_key','week_key','YearWeek'])),
      status: trimText(pick(obj, ['status','Status'])) || 'Planificat',
      notes: trimText(pick(obj, ['notes','observatii']))
    };
  }

  function normalizeForjateFlowRow(row, index){
    const obj = Array.isArray(row) ? {
      an: arrayCell(row, 0, 0),
      luna: arrayCell(row, 1, ''),
      data: arrayCell(row, 2, ''),
      utilaj: arrayCell(row, 4, ''),
      reper: arrayCell(row, 5, ''),
      buc_realizate: arrayCell(row, 17, 0),
      rebut: arrayCell(row, 18, 0)
    } : (row || {});
    const dataIso = displayToIso(pick(obj, ['data','DATA','date','Date','BM']));
    return {
      id: trimText(pick(obj, ['id','_id'])) || ('forjate-flow-' + index),
      an: Number(pick(obj, ['an','AN','An'])) || (dataIso ? Number(dataIso.slice(0,4)) : 0),
      data: dataIso,
      machine: trimText(pick(obj, ['ciocan','utilaj','linie','linie_de_forjare','E','BO'])).toUpperCase(),
      reper: trimText(pick(obj, ['reper','REPER','Reper','BP'])).toUpperCase(),
      buc_realizate: Math.max(0, Math.round(toNumber(pick(obj, ['buc_realizate','BUC_REALIZATE','buc','buc realizate','CB'])))),
      rebut: Math.max(0, Math.round(toNumber(pick(obj, ['rebut','REBUT','CC']))))
    };
  }

  async function loadForjateRowsForYears(sb, years){
    const uniqueYears = Array.from(new Set((years || []).map(v => Number(v)).filter(v => v > 0)));
    const rows = [];
    const sourceParts = [];
    if (!uniqueYears.length) return { rows, source:'', ok:true };
    const keys = uniqueYears.map(year => FORJATE_DOC_PREFIX + year).concat([LEGACY_FORJATE_DOC_KEY]);
    const docs = await queryDocsByKeys(sb, keys);
    uniqueYears.forEach(year => {
      const specific = docs.find(doc => doc.doc_key === (FORJATE_DOC_PREFIX + year) && extractRowsPayload(doc.content || doc.data).length);
      const fallback = docs.find(doc => doc.doc_key === LEGACY_FORJATE_DOC_KEY && extractRowsPayload(doc.content || doc.data).length);
      const picked = specific || fallback;
      if (!picked) return;
      sourceParts.push(picked.doc_key || 'forjate');
      extractRowsPayload(picked.content || picked.data).forEach((raw, index) => {
        const row = normalizeForjateFlowRow(raw, index);
        if (row.reper && row.data && row.an) rows.push(row);
      });
    });
    return { rows, source: Array.from(new Set(sourceParts)).join(', '), ok:true };
  }

  function normalizePlanSlot(slot){
    const source = slot && typeof slot === 'object' ? slot : {};
    return {
      reper: trimText(source.reper || source.REPER || '').toUpperCase(),
      planificat: Math.max(0, Math.round(toNumber(source.planificat || source.PLANIFICAT || 0))),
      realizat_seed: Math.max(0, Math.round(toNumber(source.realizat_seed || source.realizat || source.REALIZAT || 0)))
    };
  }

  function normalizePlanRow(row, index){
    const source = row && typeof row === 'object' ? row : {};
    const dataIso = displayToIso(source.data || source.DATA || source.id || '');
    const an = Number(source.an || source.AN || (dataIso ? dataIso.slice(0,4) : 0)) || 0;
    const slotsSource = source.slots && typeof source.slots === 'object' ? source.slots : {};
    const slots = {};
    MACHINE_ORDER.forEach(machine => { slots[machine] = normalizePlanSlot(slotsSource[machine] || source[machine] || {}); });
    return {
      id: trimText(source.id || '') || ('plan-row-' + index),
      an,
      data: dataIso,
      slots
    };
  }

  async function loadPlanRows(sb){
    const doc = await readDocumentCompat(sb, PLAN_DOC_KEY);
    const rows = doc ? extractRowsPayload(doc.content || doc.data).map((row, index) => normalizePlanRow(row, index)).filter(row => row.data) : [];
    return { rows, source: doc ? (doc.doc_key || PLAN_DOC_KEY) : '', ok:true };
  }

  function computeHorizonWeeks(fromIso, toIso){
    const start = displayToIso(fromIso);
    const end = displayToIso(toIso);
    if (!start || !end || start > end) return [];
    const weeks = [];
    let cursor = start;
    const seen = new Set();
    while (cursor && cursor <= end){
      const key = isoWeekKey(cursor);
      if (key && !seen.has(key)){
        seen.add(key);
        weeks.push(key);
      }
      cursor = addDaysIso(cursor, 7);
    }
    return weeks;
  }

  function aggregateMrcData(options){
    const opts = options || {};
    const customerOrders = Array.isArray(opts.customerOrders) ? opts.customerOrders : [];
    const openingStocks = Array.isArray(opts.openingStocks) ? opts.openingStocks : [];
    const steelOrders = Array.isArray(opts.steelOrders) ? opts.steelOrders : [];
    const forjateRows = Array.isArray(opts.forjateRows) ? opts.forjateRows : [];
    const planRows = Array.isArray(opts.planRows) ? opts.planRows : [];
    const fromIso = displayToIso(opts.fromIso);
    const toIso = displayToIso(opts.toIso);
    const todayIso = displayToIso(opts.todayIso || new Date());
    const startMonthKey = monthKey(Number(fromIso ? fromIso.slice(0,4) : 0), Number(fromIso ? fromIso.slice(5,7) : 0));
    const weekKeys = computeHorizonWeeks(fromIso, toIso);
    const reperMap = Object.create(null);
    const specDemandByWeek = Object.create(null);
    const specOpening = Object.create(null);
    const specPoRows = Object.create(null);
    const unmappedOrders = [];

    function ensureReper(row){
      const reperKey = normalizeLoose(row.reper_intern || row.reper || row.raw_part);
      if (!reperKey) return null;
      if (!reperMap[reperKey]){
        reperMap[reperKey] = {
          reper_key: reperKey,
          reper_intern: trimText(row.reper_intern || row.reper || row.raw_part).toUpperCase(),
          reper_debitare_origine: trimText(row.reper_debitare_origine).toUpperCase(),
          material: trimText(row.material).toUpperCase(),
          diametru: trimText(row.diametru),
          kg_per_buc: toNumber(row.kg_per_buc),
          raw_parts: new Set(),
          demand_buc: 0,
          demand_kg: 0,
          opening_pieces: 0,
          opening_steel_kg: 0,
          forged_good_buc: 0,
          planned_future_buc: 0,
          steel_po_kg: 0,
          weekly_qty: Object.create(null),
          weekly_kg: Object.create(null),
          weekly_piece_balance: Object.create(null),
          weekly_steel_balance: Object.create(null),
          mapping_status: trimText(row.mapping_status) || '',
          clients: new Set(),
          order_count: 0
        };
      }
      const item = reperMap[reperKey];
      if (row.raw_part) item.raw_parts.add(row.raw_part);
      if (row.client_name) item.clients.add(row.client_name);
      if (!item.reper_debitare_origine && row.reper_debitare_origine) item.reper_debitare_origine = trimText(row.reper_debitare_origine).toUpperCase();
      if (!item.material && row.material) item.material = trimText(row.material).toUpperCase();
      if (!item.diametru && row.diametru) item.diametru = trimText(row.diametru);
      if (!(item.kg_per_buc > 0) && toNumber(row.kg_per_buc) > 0) item.kg_per_buc = toNumber(row.kg_per_buc);
      if (!item.mapping_status && row.mapping_status) item.mapping_status = row.mapping_status;
      return item;
    }

    const relevantOrders = customerOrders.filter(row => row && row.delivery_date && row.delivery_date >= fromIso && row.delivery_date <= toIso);
    relevantOrders.forEach(row => {
      const item = ensureReper(row);
      if (!item) return;
      const qty = Math.max(0, Math.round(toNumber(row.quantity_buc)));
      const kg = qty * toNumber(item.kg_per_buc || row.kg_per_buc);
      const week = row.week_key || isoWeekKey(row.delivery_date);
      item.demand_buc += qty;
      item.demand_kg += kg;
      item.weekly_qty[week] = toRound(item.weekly_qty[week]) + qty;
      item.weekly_kg[week] = toNumber(item.weekly_kg[week]) + kg;
      item.order_count += 1;
      if ((row.mapping_status || item.mapping_status) === 'Nemapat') unmappedOrders.push(row);
      const spec = buildSpecKey(item.material, item.diametru);
      if (spec){
        specDemandByWeek[spec] = specDemandByWeek[spec] || Object.create(null);
        specDemandByWeek[spec][week] = toNumber(specDemandByWeek[spec][week]) + kg;
      }
    });

    openingStocks.filter(row => row && row.month_key === startMonthKey).forEach(row => {
      const item = ensureReper(row);
      if (!item) return;
      item.opening_pieces += toRound(row.total_piese);
      item.opening_steel_kg += toNumber(row.stoc_otel_kg);
      const spec = buildSpecKey(item.material, item.diametru);
      if (spec) specOpening[spec] = toNumber(specOpening[spec]) + toNumber(row.stoc_otel_kg);
    });

    forjateRows.forEach(row => {
      if (!row.data || row.data < fromIso || row.data > (todayIso < toIso ? todayIso : toIso)) return;
      const item = ensureReper({ reper_intern: row.reper });
      if (!item) return;
      item.forged_good_buc += Math.max(0, row.buc_realizate - row.rebut);
    });

    const planStart = todayIso > fromIso ? addDaysIso(todayIso, 1) : fromIso;
    planRows.forEach(row => {
      if (!row.data || row.data < planStart || row.data > toIso) return;
      MACHINE_ORDER.forEach(machine => {
        const slot = row.slots && row.slots[machine];
        if (!slot || !slot.reper || !(slot.planificat > 0)) return;
        const item = ensureReper({ reper_intern: slot.reper });
        if (!item) return;
        item.planned_future_buc += Math.max(0, Math.round(toNumber(slot.planificat)));
      });
    });

    steelOrders.forEach(row => {
      const spec = buildSpecKey(row.material, row.diametru);
      if (!spec) return;
      specPoRows[spec] = specPoRows[spec] || [];
      specPoRows[spec].push(Object.assign({}, row));
    });

    Object.keys(specPoRows).forEach(spec => {
      specPoRows[spec].sort((a,b) => compareIso(a.eta_date, b.eta_date));
      const demandMap = specDemandByWeek[spec] || Object.create(null);
      const demandList = weekKeys.map(week => ({ week, demandKg: toNumber(demandMap[week]) }));
      let cumDemand = 0;
      let coveredUntil = '';
      weekKeys.forEach(week => {
        cumDemand += toNumber(demandMap[week]);
        const supply = toNumber(specOpening[spec]);
        const poSupply = specPoRows[spec].filter(po => (po.eta_week_key || (po.eta_date ? isoWeekKey(po.eta_date) : '')) <= week).reduce((sum, po) => sum + toNumber(po.qty_kg), 0);
        if (supply + poSupply >= cumDemand) coveredUntil = week;
      });
      let runningSupply = toNumber(specOpening[spec]);
      let runningDemand = 0;
      specPoRows[spec].forEach(po => {
        runningSupply += toNumber(po.qty_kg);
        let coverageWeek = '';
        runningDemand = 0;
        weekKeys.forEach(week => {
          runningDemand += toNumber(demandMap[week]);
          if (runningSupply >= runningDemand) coverageWeek = week;
        });
        po.coverage_until_week = coverageWeek;
      });
      specPoRows[spec].covered_until_week = coveredUntil;
      specPoRows[spec].demand_map = demandMap;
    });

    const reperRows = Object.values(reperMap).sort((a,b) => String(a.reper_intern).localeCompare(String(b.reper_intern), 'ro'));
    reperRows.forEach(item => {
      item.raw_parts = Array.from(item.raw_parts).sort();
      item.clients = Array.from(item.clients).sort();
      const spec = buildSpecKey(item.material, item.diametru);
      item.steel_po_kg = (specPoRows[spec] || []).reduce((sum, po) => sum + toNumber(po.qty_kg), 0);
      item.available_pieces = item.opening_pieces + item.forged_good_buc + item.planned_future_buc;
      item.piece_gap = Math.max(0, item.demand_buc - item.available_pieces);
      item.available_steel_kg = item.opening_steel_kg + item.steel_po_kg;
      item.steel_gap_kg = Math.max(0, item.demand_kg - item.available_steel_kg);
      let pieceRunning = item.opening_pieces + item.forged_good_buc + item.planned_future_buc;
      let steelRunning = item.opening_steel_kg + item.steel_po_kg;
      let pieceCum = 0;
      let steelCum = 0;
      weekKeys.forEach(week => {
        pieceCum += toRound(item.weekly_qty[week]);
        steelCum += toNumber(item.weekly_kg[week]);
        item.weekly_piece_balance[week] = pieceRunning - pieceCum;
        item.weekly_steel_balance[week] = steelRunning - steelCum;
      });
      item.status = item.mapping_status === 'Nemapat' ? 'Nemapat'
        : item.piece_gap > 0 && item.steel_gap_kg > 0 ? 'Lipsă piese + oțel'
        : item.piece_gap > 0 ? 'Trebuie planificat'
        : item.steel_gap_kg > 0 ? 'Trebuie comandat oțel'
        : 'Acoperit';
      item.status_tone = item.status === 'Acoperit' ? 'ok' : (item.mapping_status === 'Nemapat' ? 'bad' : (item.piece_gap > 0 || item.steel_gap_kg > 0 ? 'warn' : 'info'));
    });

    return {
      reperRows,
      relevantOrders,
      unmappedOrders,
      weekKeys,
      specDemandByWeek,
      specOpening,
      specPoRows,
      fromIso,
      toIso,
      startMonthKey
    };
  }

  const api = {
    DOC_TABLE,
    MAPPING_TABLE,
    MONTH_NAMES,
    MACHINE_ORDER,
    trimText,
    toNumber,
    toRound,
    normalizeText,
    normalizeLoose,
    normalizePart,
    formatNumber,
    formatKg,
    safeJsonClone,
    nowIso,
    displayToIso,
    isoToDisplay,
    getMonthName,
    monthNumberFromAny,
    monthKey,
    monthInputToIso,
    startOfMonthIsoFromInput,
    endOfMonthIso,
    addDaysIso,
    isoWeekKey,
    isoWeekParts,
    parseYearWeek,
    startOfIsoWeek,
    buildSpecKey,
    extractRowsPayload,
    readDocumentCompat,
    queryDocsByKeys,
    writeDocumentCompat,
    loadHelperMaps,
    normalizeMappingRow,
    importPartMappingFromWorkbook,
    applyPartMapping,
    normalizeCustomerOrderRow,
    customerOrderDedupKey,
    dedupeCustomerOrders,
    mergeCustomerOrders,
    customerOrderClientPeriod,
    replaceCustomerOrdersForClientPeriod,
    importCustomerOrdersFromWorkbook,
    normalizeOpeningStockRow,
    openingStockDedupKey,
    dedupeOpeningStocks,
    mergeOpeningStocks,
    hasFullMapping,
    importOpeningStockFromWorkbook,
    normalizeSteelPoRow,
    normalizeIntrariOtelRow,
    normalizeForjateFlowRow,
    loadForjateRowsForYears,
    loadIntrariRowsForYears,
    normalizePlanRow,
    loadPlanRows,
    computeHorizonWeeks,
    aggregateMrcData
  };

  window.MRCCommon = api;
  window.MRC = api;
})(window);
