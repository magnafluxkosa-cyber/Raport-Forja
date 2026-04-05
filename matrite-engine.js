
window.MATRITE_APP = (() => {
  const utilaje = [
    { utilaj: "1,25 T", inaltime_minima: 136 },
    { utilaj: "2,5 T", inaltime_minima: 134 },
    { utilaj: "3 T BR", inaltime_minima: 136 },
    { utilaj: "MP", inaltime_minima: 138 },
    { utilaj: "5 T CHINA", inaltime_minima: 140 }
  ];

  const repereMinime = [
    { reper: "418-2091", min_sup: 0, min_inf: 0, observatii: "" },
    { reper: "418-2092", min_sup: 0, min_inf: 0, observatii: "" },
    { reper: "248-2307", min_sup: 0, min_inf: 0, observatii: "" },
    { reper: "248-2308", min_sup: 0, min_inf: 0, observatii: "" }
  ];

  // Dataset demo shaped from FORJATE logic.
  // Rule implemented exactly as asked:
  // for same reper + tip + letter:
  // first height starts 001;
  // when a later height is STRICTLY GREATER than current series start height, code increments to 002, 003...
  const forjateRaw = [
    { data:"2026-01-10", reper:"418-2091", utilaj:"3 T BR", bucati:1100, sup_litera:"N", sup_h:250, inf_litera:"U", inf_h:240 },
    { data:"2026-01-12", reper:"418-2091", utilaj:"3 T BR", bucati:1250, sup_litera:"N", sup_h:248, inf_litera:"U", inf_h:238 },
    { data:"2026-01-18", reper:"418-2091", utilaj:"3 T BR", bucati:1180, sup_litera:"N", sup_h:245, inf_litera:"U", inf_h:236 },
    { data:"2026-02-02", reper:"418-2091", utilaj:"3 T BR", bucati:1300, sup_litera:"N", sup_h:300, inf_litera:"U", inf_h:280 },
    { data:"2026-02-10", reper:"418-2091", utilaj:"3 T BR", bucati:1190, sup_litera:"N", sup_h:296, inf_litera:"U", inf_h:276 },
    { data:"2026-02-18", reper:"418-2091", utilaj:"2,5 T", bucati:900,  sup_litera:"N", sup_h:292, inf_litera:"U", inf_h:272 },

    { data:"2026-03-02", reper:"418-2091", utilaj:"MP", bucati:1400, sup_litera:"M", sup_h:350, inf_litera:"E", inf_h:330 },
    { data:"2026-03-07", reper:"418-2091", utilaj:"MP", bucati:1350, sup_litera:"M", sup_h:346, inf_litera:"E", inf_h:326 },
    { data:"2026-03-14", reper:"418-2091", utilaj:"MP", bucati:1420, sup_litera:"M", sup_h:600, inf_litera:"E", inf_h:500 },

    { data:"2026-01-08", reper:"418-2092", utilaj:"2,5 T", bucati:1000, sup_litera:"R", sup_h:210, inf_litera:"A", inf_h:205 },
    { data:"2026-01-16", reper:"418-2092", utilaj:"2,5 T", bucati:980,  sup_litera:"R", sup_h:208, inf_litera:"A", inf_h:203 },
    { data:"2026-02-20", reper:"418-2092", utilaj:"2,5 T", bucati:1120, sup_litera:"R", sup_h:260, inf_litera:"A", inf_h:250 },

    { data:"2026-01-05", reper:"248-2307", utilaj:"3 T BR", bucati:1500, sup_litera:"L", sup_h:190, inf_litera:"K", inf_h:180 },
    { data:"2026-01-15", reper:"248-2307", utilaj:"3 T BR", bucati:1480, sup_litera:"L", sup_h:188, inf_litera:"K", inf_h:178 },
    { data:"2026-02-03", reper:"248-2307", utilaj:"3 T BR", bucati:1550, sup_litera:"L", sup_h:240, inf_litera:"K", inf_h:220 },

    { data:"2026-01-09", reper:"248-2308", utilaj:"1,25 T", bucati:870, sup_litera:"O", sup_h:175, inf_litera:"D", inf_h:172 },
    { data:"2026-01-25", reper:"248-2308", utilaj:"1,25 T", bucati:910, sup_litera:"O", sup_h:173, inf_litera:"D", inf_h:170 },
    { data:"2026-03-25", reper:"248-2308", utilaj:"1,25 T", bucati:920, sup_litera:"O", sup_h:220, inf_litera:"D", inf_h:210 }
  ];

  function norm(v){ return String(v ?? "").trim(); }
  function upper(v){ return norm(v).toUpperCase(); }
  function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
  function fmtDate(v){
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v ?? "");
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  }
  function pad3(n){ return String(n).padStart(3, "0"); }
  function key(reper, tip, litera){ return `${upper(reper)}|${tip}|${upper(litera)}`; }

  function deriveCodes(rows){
    const sorted = [...rows].sort((a,b) => String(a.data).localeCompare(String(b.data)));
    const trackers = new Map();

    for (const row of sorted){
      for (const side of [
        { tip:"Superior", lit:"sup_litera", h:"sup_h", out:"sup_code" },
        { tip:"Inferior", lit:"inf_litera", h:"inf_h", out:"inf_code" }
      ]){
        const litera = upper(row[side.lit]);
        const h = num(row[side.h]);
        if (!litera) { row[side.out] = ""; continue; }
        const k = key(row.reper, side.tip, litera);
        if (!trackers.has(k)){
          trackers.set(k, { index:1, startHeight:h });
          row[side.out] = `${litera}${pad3(1)}`;
        } else {
          const tr = trackers.get(k);
          if (h > tr.startHeight){
            tr.index += 1;
            tr.startHeight = h;
          }
          row[side.out] = `${litera}${pad3(tr.index)}`;
        }
      }
    }
    return sorted;
  }

  const forjate = deriveCodes(forjateRaw);

  function buildRegistry(rows){
    const map = new Map();
    const combos = new Map();

    for (const row of rows){
      const pairKey = `${upper(row.reper)}|${row.sup_code}|${row.inf_code}`;
      combos.set(pairKey, (combos.get(pairKey) || 0) + num(row.bucati));

      for (const side of [
        { tip:"Superior", code:"sup_code", lit:"sup_litera", h:"sup_h", other:"inf_code" },
        { tip:"Inferior", code:"inf_code", lit:"inf_litera", h:"inf_h", other:"sup_code" }
      ]){
        const codIntern = norm(row[side.code]);
        if (!codIntern) continue;
        const k = `${upper(row.reper)}|${side.tip}|${codIntern}`;
        if (!map.has(k)){
          map.set(k, {
            reper: upper(row.reper),
            tip: side.tip,
            litera: upper(row[side.lit]),
            cod_intern: codIntern,
            inaltime_initiala: num(row[side.h]),
            inaltime_curenta: num(row[side.h]),
            buc_total: 0,
            status: "PE STOC",
            utilaje: new Set(),
            inaltimi: new Map(),
            combinatii: new Map()
          });
        }
        const item = map.get(k);
        const h = num(row[side.h]);
        item.buc_total += num(row.bucati);
        item.utilaje.add(norm(row.utilaj));
        if (h > item.inaltime_initiala) item.inaltime_initiala = h;
        if (!item.inaltime_curenta || (h > 0 && h < item.inaltime_curenta)) item.inaltime_curenta = h;
        item.inaltimi.set(h, (item.inaltimi.get(h) || 0) + num(row.bucati));
        const comboCode = norm(row[side.other]);
        if (comboCode){
          const comboName = `${codIntern} + ${comboCode}`;
          item.combinatii.set(comboName, (item.combinatii.get(comboName) || 0) + num(row.bucati));
        }
      }
    }

    return {
      rows: Array.from(map.values()).sort((a,b) =>
        a.reper.localeCompare(b.reper) ||
        a.tip.localeCompare(b.tip) ||
        a.cod_intern.localeCompare(b.cod_intern)
      ),
      combos
    };
  }

  const registry = buildRegistry(forjate);

  function getRepere(){
    return Array.from(new Set(registry.rows.map(r => r.reper))).sort();
  }

  function getUtilaje(){ return utilaje; }
  function getRepereMinime(){ return repereMinime; }

  function getStocBlocks(){
    return getRepere().map(reper => {
      const inf = registry.rows.filter(r => r.reper === reper && r.tip === "Inferior");
      const sup = registry.rows.filter(r => r.reper === reper && r.tip === "Superior");
      return { reper, inf, sup };
    });
  }

  function getFilteredRegistry({ reper="", utilaj="", tip="" } = {}){
    const rep = upper(reper);
    const ut = norm(utilaj);
    const tp = norm(tip);
    return registry.rows.filter(r => {
      if (rep && r.reper !== rep) return false;
      if (tp && r.tip !== tp) return false;
      if (ut && !r.utilaje.has(ut)) return false;
      return true;
    });
  }

  function getProgressRows(reper=""){
    const rows = getFilteredRegistry({ reper });
    const groups = new Map();
    rows.forEach(r => {
      const k = `${r.reper}|${r.tip}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    });
    const out = [];
    for (const arr of groups.values()){
      const totals = arr.map(x => x.buc_total);
      const min = Math.min(...totals);
      const max = Math.max(...totals);
      arr.forEach(r => {
        let color = "green";
        if (r.buc_total === min) color = "red";
        else if (r.buc_total !== max) color = "orange";
        out.push({ ...r, progress_color: color });
      });
    }
    return out.sort((a,b) => a.reper.localeCompare(b.reper) || a.tip.localeCompare(b.tip) || a.cod_intern.localeCompare(b.cod_intern));
  }

  function getMoldHistory(codIntern){
    const code = norm(codIntern);
    return forjate.filter(r => r.sup_code === code || r.inf_code === code);
  }

  function getUrmarireData(reper, utilaj=""){
    const rep = upper(reper);
    const util = norm(utilaj);
    const molds = registry.rows.filter(r => r.reper === rep && (!util || r.utilaje.has(util)));
    const superior = molds.filter(r => r.tip === "Superior");
    const inferior = molds.filter(r => r.tip === "Inferior");

    const utilObj = utilaje.find(u => u.utilaj === util);
    const repMin = repereMinime.find(r => upper(r.reper) === rep) || { min_sup:0, min_inf:0 };
    const combos = [];
    superior.forEach(s => {
      inferior.forEach(i => {
        const total = num(s.inaltime_curenta) + num(i.inaltime_curenta);
        const utilMin = utilObj ? num(utilObj.inaltime_minima) : 0;
        const repSupMin = num(repMin.min_sup || 0);
        const repInfMin = num(repMin.min_inf || 0);
        const validSup = !repSupMin || num(s.inaltime_curenta) >= repSupMin;
        const validInf = !repInfMin || num(i.inaltime_curenta) >= repInfMin;
        const validUtil = !utilMin || total >= utilMin;
        const pairName = `${s.cod_intern} + ${i.cod_intern}`;
        combos.push({
          superior: s.cod_intern,
          inferior: i.cod_intern,
          total,
          util_min: utilMin,
          diferenta: utilMin ? (total - utilMin) : 0,
          valid_sup: validSup,
          valid_inf: validInf,
          valid_util: validUtil,
          buc_total: registry.combos.get(`${rep}|${s.cod_intern}|${i.cod_intern}`) || 0,
          status: (validSup && validInf && validUtil) ? "VALIDĂ" : "SUB LIMITĂ"
        });
      });
    });
    combos.sort((a,b) => {
      const av = a.status === "VALIDĂ" ? 0 : 1;
      const bv = b.status === "VALIDĂ" ? 0 : 1;
      if (av !== bv) return av - bv;
      return Math.abs(a.diferenta) - Math.abs(b.diferenta);
    });

    return { superior, inferior, combos, utilObj, repMin };
  }

  return {
    utilaje,
    repereMinime,
    forjate,
    registryRows: registry.rows,
    getRepere,
    getUtilaje,
    getRepereMinime,
    getStocBlocks,
    getFilteredRegistry,
    getProgressRows,
    getMoldHistory,
    getUrmarireData,
    fmtDate
  };
})();
