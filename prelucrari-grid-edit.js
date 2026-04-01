(function(){
  'use strict';

  const cfg = window.PRELUCRARI_GRID_CONFIG || {};
  const table = document.querySelector('.excel-sheet');
  if(!table) return;

  const STORAGE_KEY = cfg.storageKey || ('kad-prelucrari-grid:' + (location.pathname.split('/').pop() || document.title || 'page'));
  const ENABLE_HOLIDAYS = !!cfg.enableHolidayHighlight;
  const editableSelector = '.excel-sheet td, .excel-sheet th';

  function safeText(v){ return String(v == null ? '' : v); }
  function normalizeSpaces(v){ return safeText(v).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(); }
  function isBlank(v){ return normalizeSpaces(v) === ''; }
  function parseRoDate(text){
    const s = normalizeSpaces(text);
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(!m) return null;
    const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    const dt = new Date(y, mo-1, d);
    if(dt.getFullYear() !== y || dt.getMonth() !== mo-1 || dt.getDate() !== d) return null;
    return dt;
  }
  function dateKey(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  function orthodoxEaster(year){
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    const julian = new Date(Date.UTC(year, month - 1, day));
    julian.setUTCDate(julian.getUTCDate() + 13);
    return new Date(julian.getUTCFullYear(), julian.getUTCMonth(), julian.getUTCDate());
  }
  function getRoHolidaySet(year){
    const easter = orthodoxEaster(year);
    const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
    const easterMonday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);
    const pentecostSunday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 49);
    const pentecostMonday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 50);
    const dates = [
      new Date(year,0,1), new Date(year,0,2), new Date(year,0,6), new Date(year,0,7), new Date(year,0,24),
      goodFriday, easter, easterMonday,
      new Date(year,4,1), new Date(year,5,1),
      pentecostSunday, pentecostMonday,
      new Date(year,7,15), new Date(year,10,30),
      new Date(year,11,1), new Date(year,11,25), new Date(year,11,26)
    ];
    return new Set(dates.map(dateKey));
  }

  function annotateGrid(){
    const occupied = [];
    const rows = Array.from(table.rows);
    rows.forEach((tr, rIdx) => {
      occupied[rIdx] ||= [];
      let cIdx = 0;
      Array.from(tr.cells).forEach(cell => {
        while(occupied[rIdx][cIdx]) cIdx++;
        const rs = Number(cell.rowSpan) || 1;
        const cs = Number(cell.colSpan) || 1;
        cell.dataset.gridRow = String(rIdx + 1);
        cell.dataset.gridCol = String(cIdx + 1);
        cell.dataset.gridRowspan = String(rs);
        cell.dataset.gridColspan = String(cs);
        for(let rr=0; rr<rs; rr++){
          occupied[rIdx + rr] ||= [];
          for(let cc=0; cc<cs; cc++) occupied[rIdx + rr][cIdx + cc] = true;
        }
        cIdx += cs;
      });
    });
  }

  function getCellKey(cell){
    return `${cell.dataset.gridRow || '0'}:${cell.dataset.gridCol || '0'}`;
  }

  function parseEditableExpression(raw){
    const trimmed = normalizeSpaces(raw);
    if(!trimmed) return null;

    let expr = trimmed;
    const hasExplicitFormula = expr.startsWith('=');
    if(hasExplicitFormula) expr = expr.slice(1).trim();

    const implicitAllowed = /[+*/()]/.test(expr);
    if(!hasExplicitFormula && !implicitAllowed) return null;

    if(!/^[0-9+\-*/().,\s]+$/.test(expr)) return null;
    if(!hasExplicitFormula && /^[0-9]+-[0-9]+$/.test(expr)) return null;

    const normalized = expr.replace(/,/g,'.');
    try{
      const result = Function('"use strict"; return (' + normalized + ');')();
      if(typeof result !== 'number' || !Number.isFinite(result)) return null;
      return result;
    }catch(_err){
      return null;
    }
  }

  function formatResult(num){
    if(Math.abs(num - Math.round(num)) < 1e-10) return String(Math.round(num));
    const fixed = num.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
    return fixed;
  }

  function setDisplay(cell, raw){
    cell.dataset.rawValue = raw;
    const value = normalizeSpaces(raw);
    if(!value){
      cell.innerHTML = '&nbsp;';
      return;
    }
    const result = parseEditableExpression(value);
    cell.textContent = result == null ? value : formatResult(result);
  }

  function loadState(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    }catch(_err){
      return {};
    }
  }
  function saveState(state){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_err){}
  }

  function makeEditable(){
    const saved = loadState();
    const cells = Array.from(table.querySelectorAll(editableSelector));
    cells.forEach(cell => {
      const key = getCellKey(cell);
      cell.classList.add('editable-grid-cell');
      cell.setAttribute('contenteditable','true');
      cell.setAttribute('spellcheck','false');
      cell.dataset.originalText = normalizeSpaces(cell.textContent);

      const initialRaw = Object.prototype.hasOwnProperty.call(saved, key)
        ? safeText(saved[key])
        : normalizeSpaces(cell.textContent);

      setDisplay(cell, initialRaw);

      cell.addEventListener('focus', () => {
        cell.classList.add('is-editing');
        const raw = cell.dataset.rawValue != null ? cell.dataset.rawValue : normalizeSpaces(cell.textContent);
        cell.textContent = raw;
        const sel = window.getSelection && window.getSelection();
        if(sel && document.createRange){
          const range = document.createRange();
          range.selectNodeContents(cell);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });

      cell.addEventListener('keydown', (ev) => {
        if(ev.key === 'Enter'){
          ev.preventDefault();
          cell.blur();
        }
      });

      cell.addEventListener('blur', () => {
        cell.classList.remove('is-editing');
        const raw = normalizeSpaces(cell.textContent);
        saved[key] = raw;
        setDisplay(cell, raw);
        saveState(saved);
      });
    });
  }

  function highlightHolidayColumns(){
    if(!ENABLE_HOLIDAYS) return;
    const rows = Array.from(table.rows).slice(0, 12);
    let bestRow = null;
    let bestCount = 0;
    rows.forEach(tr => {
      const dateCells = Array.from(tr.cells).filter(cell => parseRoDate(cell.textContent));
      if(dateCells.length > bestCount){
        bestCount = dateCells.length;
        bestRow = tr;
      }
    });
    if(!bestRow || bestCount === 0) return;

    const holidayCols = new Set();
    Array.from(bestRow.cells).forEach(cell => {
      const dt = parseRoDate(cell.textContent);
      if(!dt) return;
      const holidaySet = getRoHolidaySet(dt.getFullYear());
      if(!holidaySet.has(dateKey(dt))) return;
      const start = Number(cell.dataset.gridCol || 0);
      const span = Number(cell.dataset.gridColspan || 1);
      for(let c = start; c < start + span; c++) holidayCols.add(c);
    });
    if(!holidayCols.size) return;

    Array.from(table.querySelectorAll(editableSelector)).forEach(cell => {
      const start = Number(cell.dataset.gridCol || 0);
      const span = Number(cell.dataset.gridColspan || 1);
      for(let c = start; c < start + span; c++){
        if(holidayCols.has(c)){
          cell.classList.add('holiday-auto');
          break;
        }
      }
    });
  }

  function init(){
    annotateGrid();
    makeEditable();
    highlightHolidayColumns();
  }

  init();
})();