




  (function(){
    'use strict';
    const S = window.RFPlanificareShared;
    if(!S){ alert('Lipsește planificare-shared.js'); return; }

    const HEADERS = ["DATA","UTILAJ","REPER_FORJAT","PLANIFICAT_BUC","REALIZAT_BUC","BUC_SIMULAT","REPER_DEBITARE","DIAMETRU_OTEL","CALITATE_OTEL","KG_BUC_DEBITAT","KG_TOTAL_DEBITAT","STOC_OTEL_INAINTE","OTEL_NECESAR_DEBITARE","OTEL_RAMAS_DACA_DEBITEZI","STOC_DEBITAT_INAINTE","CONSUM_DEBITAT_SIMULAT","STOC_DEBITAT_RAMAS","STATUS","OBS"];
    const els = {
      theadRow: document.getElementById('theadRow'),
      tbodyRows: document.getElementById('tbodyRows'),
      sheetWrap: document.getElementById('sheetWrap'),
      yearInfo: document.getElementById('yearInfo'),
      rowInfo: document.getElementById('rowInfo'),
      btnLogout: document.getElementById('btnLogout'),
      btnBack: document.getElementById('btnBack'),
      lock: document.getElementById('lock')
    };
    const state = {
      supabase: null,
      role: 'viewer',
      rows: S.hydrateRowsFromPayload(null),
      helperMaps: S.buildHelperMaps([], []),
      activeYear: Number(new URLSearchParams(window.location.search).get('year') || 0) || new Date().getFullYear(),
      realizedSummary: Object.create(null),
      liveStocks: { steelByMaterial:Object.create(null), debByReper:Object.create(null) }
    };

    function scrollKey(year){ return 'rf_planificare_calc_scroll_' + String(year || ''); }
    function saveScroll(){
      try{
        localStorage.setItem(scrollKey(state.activeYear), JSON.stringify({ top: els.sheetWrap.scrollTop, left: els.sheetWrap.scrollLeft }));
      }catch(_e){}
    }
    function restoreScroll(){
      try{
        const raw = localStorage.getItem(scrollKey(state.activeYear));
        if(!raw) return;
        const pos = JSON.parse(raw);
        requestAnimationFrame(()=>{
          els.sheetWrap.scrollTop = Number(pos.top || 0);
          els.sheetWrap.scrollLeft = Number(pos.left || 0);
        });
      }catch(_e){}
    }
    async function initAuth(){
      if(!window.ERPAuth) throw new Error('Lipsește auth-common.js');
      state.supabase = window.ERPAuth.getSupabaseClient();
      const info = await window.ERPAuth.getCurrentUserWithRole();
      if(!info || !info.user){
        window.location.href = window.ERPAuth.buildLoginUrl('planificare-calc.html?year=' + encodeURIComponent(String(state.activeYear)));
        return false;
      }
      state.role = String(info.role || 'viewer').toLowerCase();
      if(state.role !== 'admin'){
        els.lock.style.display = 'flex';
        return false;
      }
      return true;
    }
    async function readDocument(docKey){
      if(!state.supabase) return null;
      try{
        const res = await state.supabase.from('rf_documents').select('*').eq('doc_key', docKey).maybeSingle();
        if(res && !res.error && res.data){
          return {
            updated_at: res.data.updated_at || (res.data.content && res.data.content.updated_at) || (res.data.data && res.data.data.updated_at) || null,
            payload: res.data.content || res.data.data || null
          };
        }
      }catch(_e){}
      return null;
    }
    async function loadPlanRows(){
      const cached = S.readCachedPayload();
      if(cached){
        state.rows = S.hydrateRowsFromPayload(cached);
      } else {
        state.rows = S.hydrateRowsFromPayload(null);
      }
      const remote = await readDocument('planificare-forja');
      if(remote && remote.payload){
        state.rows = S.hydrateRowsFromPayload(remote.payload);
      }
    }
    async function loadHelpers(){
      let forjateRows = [];
      let debitRows = [];
      if(state.supabase){
        try{
          const a = await state.supabase.from('rf_helper_repere_forjate')
            .select('reper_forjat,reper_debitare_origine,dimensiune_otel,calitate_otel,kg_buc_forjat,is_active')
            .order('sort_order', { ascending:true })
            .order('reper_forjat', { ascending:true });
          if(!a.error && Array.isArray(a.data)) forjateRows = a.data;
        }catch(_e){}
        try{
          const b = await state.supabase.from('rf_helper_repere_debitare')
            .select('reper_debitare,diametru_otel,calitate_otel,kg_buc_debitat,lungime_debitare_mm,is_active')
            .order('sort_order', { ascending:true })
            .order('reper_debitare', { ascending:true });
          if(!b.error && Array.isArray(b.data)) debitRows = b.data;
        }catch(_e){}
      }
      state.helperMaps = S.buildHelperMaps(forjateRows, debitRows);
    }

    function normKey(v){ return S.normUpper(String(v || '').replace(/^Ø/i,'')); }
    function extractRows(payload){ return S.extractRowsPayload(payload); }
    function pick(obj, keys){
      if(!obj || typeof obj !== 'object') return '';
      for(const key of keys){
        if(obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
      }
      const entries = Object.entries(obj).map(([k,v]) => ({ k:S.normUpper(k).replace(/[^A-Z0-9]/g,''), v }));
      for(const key of keys){
        const wanted = S.normUpper(key).replace(/[^A-Z0-9]/g,'');
        const found = entries.find(e => e.k === wanted && e.v !== undefined && e.v !== null && e.v !== '');
        if(found) return found.v;
      }
      return '';
    }
    function fmtDate(v){
      const s = String(v || '').trim();
      if(!s) return '';
      if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
      if(/^\d{4}-\d{2}-\d{2}/.test(s)){ const [y,m,d] = s.slice(0,10).split('-'); return `${d}.${m}.${y}`; }
      return s;
    }
    function dateScore(v){ const s=fmtDate(v); return /^\d{2}\.\d{2}\.\d{4}$/.test(s) ? Number(s.slice(6,10)+s.slice(3,5)+s.slice(0,2)) : 0; }
    async function queryDocsByKeys(keys){
      const list = [...new Set((Array.isArray(keys)?keys:[]).map(x=>String(x||'').trim()).filter(Boolean))];
      if(!list.length) return [];
      const { data, error } = await state.supabase.from('rf_documents').select('*').in('doc_key', list);
      if(error) throw error;
      return Array.isArray(data) ? data : [];
    }
    async function queryDocsByPrefixes(prefixes){
      const out = [];
      for(const prefix of [...new Set((Array.isArray(prefixes)?prefixes:[]).map(x=>String(x||'').trim()).filter(Boolean))]){
        const { data, error } = await state.supabase.from('rf_documents').select('*').like('doc_key', `${prefix}:%`);
        if(error) throw error;
        if(Array.isArray(data)) out.push(...data);
      }
      return out;
    }
    function uniqueDocs(docs){ const m=new Map(); (Array.isArray(docs)?docs:[]).forEach(d=>{ if(d && d.doc_key && !m.has(d.doc_key)) m.set(d.doc_key,d); }); return [...m.values()]; }
    function excludeIndexDocs(docs){ return (Array.isArray(docs)?docs:[]).filter(doc => !String(doc.doc_key || '').toLowerCase().endsWith(':index')); }
    function normalizeInitialRow(row){
      return {
        diam: String(pick(row,['diametru','diametru otel','diametru_otel','Diametru otel','Diametru']) || '').trim(),
        cal: String(pick(row,['calitate','calitate otel','calitate_otel','Calitate otel','Calitate']) || '').trim(),
        qty: S.toNum(pick(row,['cantitateKg','cantitate','cantitate kg','cantitate_kg','kg','stoc initial','stoc_initial']))
      };
    }
    function normalizeEntryRow(row){
      return {
        diam: String(pick(row,['diametru','diametru otel','diametru_otel','dimensiune otel','Dimensiune Oțel','Diametru']) || '').trim(),
        cal: String(pick(row,['calitate','calitate otel','calitate_otel','Calitate Oțel','Calitate']) || '').trim(),
        qty: S.toNum(pick(row,['cantitate','cantitate kg','cantitate_kg','kg','H']))
      };
    }
    function normalizeConsumptionRow(row){
      let qty = S.toNum(pick(row,['total kg debitat','total_kg_debitat','totalKgDebitat','cantitate kg','cantitate_kg','kg']));
      if(!qty){
        const kgBuc = S.toNum(pick(row,['kg/buc','kg buc','kg_buc','Kg/buc','H']));
        const buc = S.toNum(pick(row,['cantitate','cantitate buc','cantitate_buc','J']));
        qty = kgBuc * buc;
      }
      return {
        diam: String(pick(row,['diametru','diametru otel','diametru_otel','Diametru Oțel','Diametru']) || '').trim(),
        cal: String(pick(row,['calitate','calitate otel','calitate_otel','Calitate Oțel','Calitate']) || '').trim(),
        qty
      };
    }
    function normalizeDebInventoryRow(row, index){
      return {
        _index:index,
        reper: String(pick(row,['reper','REPER','Reper','denumire reper debitare','Denumire reper debitare']) || '').trim(),
        qty: Math.round(S.toNum(pick(row,['cantitateBuc','STOC DEBITATE FINAL (buc)','Stoc debitate final (buc)','Stoc Debitat (Buc)']))),
        data: fmtDate(pick(row,['data','date','DATA','Date'])),
        an: String(pick(row,['an','anul','year','AN','Year','Anul']) || '').trim()
      };
    }
    function shouldReplaceDeb(existing, candidate){
      if(!candidate) return false;
      if(!existing) return true;
      const cd = dateScore(candidate.data), ed = dateScore(existing.data);
      if(cd !== ed) return cd > ed;
      const cy = Number(candidate.an || 0), ey = Number(existing.an || 0);
      if(cy !== ey) return cy > ey;
      return (candidate._index || 0) > (existing._index || 0);
    }
    async function loadInventoryStocks(){
      const initialDocs = await queryDocsByKeys(['stoc-initial-otel','stoc_initial_otel','inventar-otel-initial','inventar_otel_initial']);
      const entryDocs = uniqueDocs(excludeIndexDocs([...(await queryDocsByKeys(['intrari-otel','intrari_otel','intrari otel'])), ...(await queryDocsByPrefixes(['intrari-otel','intrari_otel']))]));
      const consDocs = uniqueDocs(excludeIndexDocs([...(await queryDocsByKeys(['debitate','debitari'])), ...(await queryDocsByPrefixes(['debitate','debitari']))]));
      const debInvDocs = uniqueDocs(excludeIndexDocs([...(await queryDocsByKeys(['inventar-debitat','inventar_debitat'])), ...(await queryDocsByPrefixes(['inventar-debitat','inventar_debitat','stoc-initial-debitat','stoc_initial_debitat']))]));

      const steelByMaterial = Object.create(null);
      const bump = (key, delta) => { if(!key) return; steelByMaterial[key] = S.toNum(steelByMaterial[key]) + S.toNum(delta); };
      initialDocs.flatMap(doc => extractRows(doc.content || doc.data || doc)).map(normalizeInitialRow).forEach(r => bump(normKey(`${r.diam}|${r.cal}`), r.qty));
      entryDocs.flatMap(doc => extractRows(doc.content || doc.data || doc)).map(normalizeEntryRow).forEach(r => bump(normKey(`${r.diam}|${r.cal}`), r.qty));
      consDocs.flatMap(doc => extractRows(doc.content || doc.data || doc)).map(normalizeConsumptionRow).forEach(r => bump(normKey(`${r.diam}|${r.cal}`), -r.qty));

      const latestDeb = new Map();
      debInvDocs.flatMap(doc => extractRows(doc.content || doc.data || doc)).forEach((raw, index) => {
        const row = normalizeDebInventoryRow(raw, index);
        if(!row.reper) return;
        const key = normKey(row.reper);
        const existing = latestDeb.get(key);
        if(shouldReplaceDeb(existing, row)) latestDeb.set(key, row);
      });
      const debByReper = Object.create(null);
      latestDeb.forEach((row, key) => { debByReper[key] = Math.max(0, S.toNum(row.qty)); });

      state.liveStocks = { steelByMaterial, debByReper };
    }

    async function loadForjateSummary(){
      state.realizedSummary = Object.create(null);
      const preferred = ['forjate:' + String(state.activeYear), 'forjate'];
      for (const key of preferred){
        const doc = await readDocument(key);
        if(!doc || !doc.payload) continue;
        const summary = S.buildForjateSummary(doc.payload, state.activeYear);
        Object.keys(summary).forEach(k => {
          state.realizedSummary[k] = S.toNum(state.realizedSummary[k]) + S.toNum(summary[k]);
        });
        if(key.indexOf(':') > -1) break;
      }
    }
    function render(){
      els.theadRow.innerHTML = HEADERS.map(h => '<th>' + h + '</th>').join('');
      const calc = S.computeCalcForYear(state.rows.filter(r => Number(r.an) === Number(state.activeYear)), state.realizedSummary, state.helperMaps, state.activeYear, state.liveStocks);
      const todayIso = S.todayIso();
      els.rowInfo.textContent = 'Rânduri: ' + calc.rows.length;
      els.yearInfo.textContent = 'An: ' + state.activeYear;
      els.btnBack.href = 'planificare-forja.html?year=' + encodeURIComponent(String(state.activeYear));
      els.tbodyRows.innerHTML = calc.rows.map(row => {
        const isToday = row.DATA === todayIso;
        const status = String(row.STATUS || '').toUpperCase();
        const statusClass = status === 'LIPSA' ? 'status-lipsa' : (status === 'SIMULAT' ? 'status-sim' : 'status-real');
        const cells = HEADERS.map(h => {
          const v = row[h];
          let text = '';
          let cls = '';
          if (h === 'DATA'){ text = S.isoToDisplay(v); cls = 'left'; }
          else if (h === 'UTILAJ' || h === 'REPER_FORJAT' || h === 'REPER_DEBITARE' || h === 'CALITATE_OTEL' || h === 'OBS'){ text = String(v ?? ''); cls = 'left'; }
          else if (h === 'STATUS'){ text = String(v ?? ''); cls = 'center ' + statusClass; }
          else if (typeof v === 'number'){ text = (h.indexOf('KG') >= 0 || h.indexOf('OTEL') >= 0 || h.indexOf('DIAMETRU') >= 0) ? S.formatKgRO(v) : S.formatIntRO(v); }
          else { text = String(v ?? ''); }
          if (h === 'STOC_OTEL_INAINTE' || h === 'OTEL_RAMAS_DACA_DEBITEZI' || h === 'STOC_DEBITAT_INAINTE'){
            if (S.toNum(v) < 0) cls += ' red';
          }
          return '<td class="' + cls.trim() + '">' + text + '</td>';
        }).join('');
        return '<tr class="' + (isToday ? 'today ' : '') + '" data-date="' + row.DATA + '">' + cells + '</tr>';
      }).join('');

      els.tbodyRows.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('mouseenter', () => tr.classList.add('hover'));
        tr.addEventListener('mouseleave', () => tr.classList.remove('hover'));
      });
      restoreScroll();
    }

    async function bootstrap(){
      try{
        const ok = await initAuth();
        if(!ok) return;
        await loadPlanRows();
        const years = Array.from(new Set(state.rows.map(r => Number(r.an)).filter(Boolean))).sort((a,b)=>a-b);
        if(years.length && !years.includes(Number(state.activeYear))) state.activeYear = years[0];
        await loadHelpers();
        await loadInventoryStocks();
        await loadForjateSummary();
        render();
      }catch(err){
        console.error(err);
        alert(String(err && err.message || err || 'Eroare la încărcare.'));
      }
    }

    els.sheetWrap.addEventListener('scroll', saveScroll, { passive:true });
    els.btnLogout.addEventListener('click', async () => {
      try{ await window.ERPAuth.signOut(); } catch(_e){}
      window.location.href = 'login.html';
    });

    bootstrap();
  })();
  