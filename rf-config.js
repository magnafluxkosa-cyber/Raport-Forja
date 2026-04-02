(function (window) {
  'use strict';

  var PAGE_LIST = [
    { page_key: 'index', page_name: 'Dashboard / Index' },
    { page_key: 'login', page_name: 'Login' },
    { page_key: 'group-forja', page_name: 'Grup / Forjă' },
    { page_key: 'group-prelucrari', page_name: 'Grup / Prelucrări mecanice' },
    { page_key: 'group-tratament-termic', page_name: 'Grup / Tratament termic' },
    { page_key: 'group-calitate', page_name: 'Grup / Calitate' },
    { page_key: 'group-probleme-imbunatatire', page_name: 'Grup / Probleme, îmbunătățiri și investiții' },
    { page_key: 'group-planificari', page_name: 'Grup / Planificări' },
    { page_key: 'group-zale', page_name: 'Grup / Urmărire zale' },
    { page_key: 'group-rapoarte', page_name: 'Grup / Rapoarte' },
    { page_key: 'group-inventar', page_name: 'Grup / Inventar' },
    { page_key: 'helper', page_name: 'Helper' },
    { page_key: 'helper-data', page_name: 'Helper Data' },
    { page_key: 'helper-acl', page_name: 'Helper ACL' },
    { page_key: 'numeralkod', page_name: 'Numeral KOD' },
    { page_key: 'intrari-otel', page_name: 'Intrări Oțel' },
    { page_key: 'debitate', page_name: 'Debitate' },
    { page_key: 'forjate', page_name: 'Forjate' },
    { page_key: 'eficienta', page_name: 'Eficiență' },
    { page_key: 'program-utilaje', page_name: 'Program Utilaje' },
    { page_key: 'magnaflux', page_name: 'Magnaflux' },
    { page_key: 'probleme-raportate', page_name: 'Probleme Raportate' },
    { page_key: 'urmarire-actiuni-progres', page_name: 'Urmărire acțiuni și progres' },
    { page_key: 'imbunatatire-continua', page_name: 'Îmbunătățire continuă' },
    { page_key: 'investitii', page_name: 'Investiții' },
    { page_key: 'tratament-termic-rapoarte', page_name: 'Tratament Termic - Rapoarte' },
    { page_key: 'tratament-termic-probleme', page_name: 'Tratament Termic - Probleme T.T' },
    { page_key: 'tratament-termic-fise-tehnologice', page_name: 'Tratament Termic - Fișe tehnologice' },
    { page_key: 'tratament-termic-documente', page_name: 'Tratament Termic - Rapoarte Excel / Word' },
    { page_key: 'rebut', page_name: 'Rebut' },
    { page_key: 'rebut-pm', page_name: 'Rebut PM' },
    { page_key: 'rebut-pm-helper', page_name: 'Helper Rebut PM' },
    { page_key: 'kpi', page_name: 'KPI' },
    { page_key: 'inventar-otel', page_name: 'Inventar Oțel' },
    { page_key: 'inventar-debitat', page_name: 'Inventar Debitat' },
    { page_key: 'inventar-forjat', page_name: 'Inventar Forjat' },
    { page_key: 'planificare-forja', page_name: 'Planificare Forjă' },
    { page_key: 'plan-livrari', page_name: 'Plan livrări' },
    { page_key: 'planificare-prelucrari', page_name: 'Planificare prelucrări' },
    { page_key: 'inventar-prelucrari', page_name: 'Inventar prelucrări' },
    { page_key: 'comenzi-livrare', page_name: 'Comenzi Livrare' },
    { page_key: 'livrari-zale', page_name: 'Livrări zale' },
    { page_key: 'centralizator-livrari-zale', page_name: 'Centralizator livrări zale' },
    { page_key: 'stoc-ramas-teoretic', page_name: 'Stoc rămas teoretic' },
    { page_key: 'mrc-necesar-otel', page_name: 'MRC / Necesar Oțel' },
    { page_key: 'mrc-comenzi-otel', page_name: 'MRC / Comenzi oțel' },
    { page_key: 'mrc-comenzi-saptamanale', page_name: 'MRC / Comenzi săptămânale' },
    { page_key: 'zale-9k-6628-29', page_name: '9K-6628/29' },
    { page_key: 'zale-229-6909-10', page_name: '229-6909/10' },
    { page_key: 'zale-503-0761-62', page_name: '503-0761/62' },
    { page_key: 'zale-106-1625-26', page_name: '106-1625/26' },
    { page_key: 'zale-378-8241-42', page_name: '378-8241/42' },
    { page_key: 'zale-248-2307-08', page_name: '248-2307/08' },
    { page_key: 'zale-417-3595-96', page_name: '417-3595/96' },
    { page_key: 'zale-418-2091-92', page_name: '418-2091/92' },
    { page_key: 'ambalare-9k-6628-29', page_name: 'Ambalare 9K-6628/29' },
    { page_key: 'ambalare-229-6909-10', page_name: 'Ambalare 229-6909/10' },
    { page_key: 'ambalare-503-0761-62', page_name: 'Ambalare 503-0761/62' },
    { page_key: 'ambalare-106-1625-26', page_name: 'Ambalare 106-1625/26' },
    { page_key: 'ambalare-378-8241-42', page_name: 'Ambalare 378-8241/42' },
    { page_key: 'ambalare-248-2307-08', page_name: 'Ambalare 248-2307/08' },
    { page_key: 'ambalare-417-3595-96', page_name: 'Ambalare 417-3595/96' },
    { page_key: 'ambalare-418-2091-92', page_name: 'Ambalare 418-2091/92' }
  ];

  var PAGE_MAP = Object.create(null);
  PAGE_LIST.forEach(function (page) { PAGE_MAP[page.page_key] = page.page_name; });


var COMMON_CONTROL_CATALOG = Object.freeze([
  Object.freeze({ control_key:'rows.filter', control_label:'Filtrare tabel', control_type:'filter' }),
  Object.freeze({ control_key:'rows.add', control_label:'Adăugare rând', control_type:'action' }),
  Object.freeze({ control_key:'rows.edit', control_label:'Editare rând', control_type:'action' }),
  Object.freeze({ control_key:'rows.delete', control_label:'Ștergere rând', control_type:'action' }),
  Object.freeze({ control_key:'data.export', control_label:'Export', control_type:'action' }),
  Object.freeze({ control_key:'data.import', control_label:'Import', control_type:'action' }),
  Object.freeze({ control_key:'cloud.refresh', control_label:'Refresh cloud', control_type:'action' }),
  Object.freeze({ control_key:'cloud.save', control_label:'Salvare în cloud', control_type:'action' }),
  Object.freeze({ control_key:'modal.open', control_label:'Deschidere formular', control_type:'action' })
]);

var PAGE_CONTROL_OVERRIDES = Object.freeze({
  'index': Object.freeze([
    Object.freeze({ control_key:'nav.group-forja', control_label:'Buton FORJĂ', control_type:'action' }),
    Object.freeze({ control_key:'nav.group-prelucrari', control_label:'Buton PRELUCRĂRI MECANICE', control_type:'action' }),
    Object.freeze({ control_key:'nav.group-tratament-termic', control_label:'Buton TRATAMENT TERMIC', control_type:'action' }),
    Object.freeze({ control_key:'nav.group-calitate', control_label:'Buton CALITATE', control_type:'action' }),
    Object.freeze({ control_key:'nav.group-probleme-imbunatatire', control_label:'Buton PROBLEME / ÎMBUNĂTĂȚIRI / INVESTIȚII', control_type:'action' }),
    Object.freeze({ control_key:'nav.kpi', control_label:'Buton KPI', control_type:'action' }),
    Object.freeze({ control_key:'nav.group-planificari', control_label:'Buton PLANIFICĂRI', control_type:'action' }),
    Object.freeze({ control_key:'nav.helper-data', control_label:'Buton HELPER-DATA', control_type:'action' }),
    Object.freeze({ control_key:'nav.helper-acl', control_label:'Buton HELPER-ACL', control_type:'action' }),
        Object.freeze({ control_key:'nav.numeralkod', control_label:'Buton NUMERALKOD', control_type:'action' }),
    Object.freeze({ control_key:'nav.intrari-otel', control_label:'Buton INTRĂRI OȚEL', control_type:'action' }),
    Object.freeze({ control_key:'nav.debitate', control_label:'Buton DEBITATE', control_type:'action' }),
    Object.freeze({ control_key:'nav.forjate', control_label:'Buton FORJATE', control_type:'action' }),
    Object.freeze({ control_key:'nav.program-utilaje', control_label:'Buton PROGRAM UTILAJE', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-9k-6628-29', control_label:'Buton 9K-6628/29', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-229-6909-10', control_label:'Buton 229-6909/10', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-503-0761-62', control_label:'Buton 503-0761/62', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-106-1625-26', control_label:'Buton 106-1625/26', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-378-8241-42', control_label:'Buton 378-8241/42', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-248-2307-08', control_label:'Buton 248-2307/08', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-417-3595-96', control_label:'Buton 417-3595/96', control_type:'action' }),
    Object.freeze({ control_key:'nav.zale-418-2091-92', control_label:'Buton 418-2091/92', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-9k-6628-29', control_label:'Buton AMBALARE 9K-6628/29', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-229-6909-10', control_label:'Buton AMBALARE 229-6909/10', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-503-0761-62', control_label:'Buton AMBALARE 503-0761/62', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-106-1625-26', control_label:'Buton AMBALARE 106-1625/26', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-378-8241-42', control_label:'Buton AMBALARE 378-8241/42', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-248-2307-08', control_label:'Buton AMBALARE 248-2307/08', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-417-3595-96', control_label:'Buton AMBALARE 417-3595/96', control_type:'action' }),
    Object.freeze({ control_key:'nav.ambalare-418-2091-92', control_label:'Buton AMBALARE 418-2091/92', control_type:'action' }),
    Object.freeze({ control_key:'nav.inventar-otel', control_label:'Buton INVENTAR OȚEL', control_type:'action' }),
    Object.freeze({ control_key:'nav.inventar-debitat', control_label:'Buton INVENTAR DEBITAT', control_type:'action' }),
    Object.freeze({ control_key:'nav.inventar-forjat', control_label:'Buton INVENTAR FORJAT', control_type:'action' }),
    Object.freeze({ control_key:'nav.tratament-termic-rapoarte', control_label:'Buton T.T RAPOARTE', control_type:'action' }),
    Object.freeze({ control_key:'nav.tratament-termic-probleme', control_label:'Buton T.T PROBLEME', control_type:'action' }),
    Object.freeze({ control_key:'nav.tratament-termic-fise-tehnologice', control_label:'Buton T.T FIȘE TEHNOLOGICE', control_type:'action' }),
    Object.freeze({ control_key:'nav.tratament-termic-documente', control_label:'Buton T.T RAPOARTE EXCEL / WORD', control_type:'action' }),
    Object.freeze({ control_key:'nav.magnaflux', control_label:'Buton MAGNAFLUX', control_type:'action' }),
    Object.freeze({ control_key:'nav.rebut', control_label:'Buton REBUT', control_type:'action' }),
    Object.freeze({ control_key:'nav.probleme-raportate', control_label:'Buton PROBLEME RAPORTATE', control_type:'action' }),
    Object.freeze({ control_key:'nav.urmarire-actiuni-progres', control_label:'Buton URMĂRIRE ACȚIUNI ȘI PROGRES', control_type:'action' }),
    Object.freeze({ control_key:'nav.imbunatatire-continua', control_label:'Buton ÎMBUNĂTĂȚIRE CONTINUĂ', control_type:'action' }),
    Object.freeze({ control_key:'nav.investitii', control_label:'Buton INVESTIȚII', control_type:'action' }),
    Object.freeze({ control_key:'nav.planificare-forja', control_label:'Buton PLANIFICARE FORJĂ', control_type:'action' }),
    Object.freeze({ control_key:'nav.comenzi-livrare', control_label:'Buton COMENZI LIVRARE', control_type:'action' }),
    Object.freeze({ control_key:'nav.livrari-zale', control_label:'Buton LIVRĂRI ZALE', control_type:'action' }),
    Object.freeze({ control_key:'nav.centralizator-livrari-zale', control_label:'Buton CENTRALIZATOR LIVRĂRI', control_type:'action' }),
    Object.freeze({ control_key:'nav.stoc-ramas-teoretic', control_label:'Buton STOC RĂMAS TEORETIC', control_type:'action' }),
    Object.freeze({ control_key:'nav.mrc-necesar-otel', control_label:'Buton MRC / NECESAR OȚEL', control_type:'action' }),
    Object.freeze({ control_key:'nav.mrc-comenzi-otel', control_label:'Buton COMENZI OȚEL', control_type:'action' }),
    Object.freeze({ control_key:'nav.mrc-comenzi-saptamanale', control_label:'Buton COMENZI SĂPTĂMÂNALE', control_type:'action' }),
    Object.freeze({ control_key:'nav.login', control_label:'Buton Login', control_type:'action' }),
    Object.freeze({ control_key:'nav.logout', control_label:'Buton Logout', control_type:'action' }),
    Object.freeze({ control_key:'dashboard.palette', control_label:'Paletă temă', control_type:'action' }),
    Object.freeze({ control_key:'dashboard.refresh', control_label:'Refresh dashboard', control_type:'action' })
  ]),
  'helper-data': Object.freeze([
    Object.freeze({ control_key:'masterdata.edit', control_label:'Editare helper data', control_type:'action' })
  ]),
  'tratament-termic-fise-tehnologice': Object.freeze([
    Object.freeze({ control_key:'pdf.open', control_label:'Deschidere PDF', control_type:'action' }),
    Object.freeze({ control_key:'pdf.upload', control_label:'Încărcare PDF', control_type:'action' }),
    Object.freeze({ control_key:'pdf.download', control_label:'Export / Download PDF', control_type:'action' }),
    Object.freeze({ control_key:'pdf.delete', control_label:'Ștergere PDF', control_type:'action' }),
    Object.freeze({ control_key:'pdf.revision.edit', control_label:'Editare revizie PDF', control_type:'field' })
  ]),
  'tratament-termic-rapoarte': Object.freeze([
    Object.freeze({ control_key:'problems.link', control_label:'Buton Probleme T.T', control_type:'action' }),
    Object.freeze({ control_key:'field.ore', control_label:'Câmp Ore', control_type:'field' }),
    Object.freeze({ control_key:'field.cantitate', control_label:'Câmp Cantitate', control_type:'field' })
  ]),
  'tratament-termic-probleme': Object.freeze([
    Object.freeze({ control_key:'field.minute', control_label:'Câmp Minute', control_type:'field' }),
    Object.freeze({ control_key:'field.descriere', control_label:'Câmp Problemă în schimb', control_type:'field' })
  ]),
  'tratament-termic-documente': Object.freeze([
    Object.freeze({ control_key:'doc.open', control_label:'Deschidere document', control_type:'action' }),
    Object.freeze({ control_key:'doc.upload', control_label:'Încărcare document', control_type:'action' }),
    Object.freeze({ control_key:'doc.download', control_label:'Export / Download document', control_type:'action' }),
    Object.freeze({ control_key:'doc.delete', control_label:'Ștergere document', control_type:'action' }),
    Object.freeze({ control_key:'field.titlu', control_label:'Câmp Denumire raport', control_type:'field' }),
    Object.freeze({ control_key:'field.observatii', control_label:'Câmp Observații document', control_type:'field' })
  ]),
  'rebut-pm': Object.freeze([
    Object.freeze({ control_key:'field.cod-defect', control_label:'Selector Cod defect', control_type:'field' }),
    Object.freeze({ control_key:'field.cauza', control_label:'Câmp Cauză', control_type:'field' }),
    Object.freeze({ control_key:'field.actiuni-corective', control_label:'Câmp Acțiuni corective', control_type:'field' })
  ]),
  'forjate': Object.freeze([
    Object.freeze({ control_key:'field.reper', control_label:'Câmp Reper', control_type:'field' }),
    Object.freeze({ control_key:'field.buc-realizate', control_label:'Câmp Buc realizate', control_type:'field' }),
    Object.freeze({ control_key:'field.rebut', control_label:'Câmp Rebut', control_type:'field' })
  ])
});

function cloneControlEntries(rows) {
  return (Array.isArray(rows) ? rows : []).map(function (row) {
    return Object.freeze({
      control_key: String(row && row.control_key || '').trim(),
      control_label: String(row && row.control_label || '').trim(),
      control_type: String(row && row.control_type || 'action').trim() || 'action'
    });
  }).filter(function (row) { return row.control_key; });
}

function getControlCatalogForPage(pageKey) {
  var key = String(pageKey || '').trim();
  var map = Object.create(null);
  var items = [];
  function push(row) {
    if (!row || !row.control_key) return;
    var cleanKey = String(row.control_key || '').trim();
    if (!cleanKey || map[cleanKey]) return;
    map[cleanKey] = true;
    items.push(Object.freeze({
      control_key: cleanKey,
      control_label: String(row.control_label || cleanKey).trim() || cleanKey,
      control_type: String(row.control_type || 'action').trim() || 'action'
    }));
  }
  cloneControlEntries(COMMON_CONTROL_CATALOG).forEach(push);
  cloneControlEntries(PAGE_CONTROL_OVERRIDES[key] || []).forEach(push);
  return items;
}

  function clonePages() {
    return PAGE_LIST.map(function (page) {
      return Object.freeze({ page_key: page.page_key, page_name: page.page_name });
    });
  }

  var CONFIG = Object.freeze({
    APP_NAME: 'K.A.D',
    SUPABASE_URL: 'https://addlybnigrywqowpbhvd.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4',
    ADMIN_EMAIL: 'forja.editor@gmail.com',
    DEFAULT_PAGES: PAGE_LIST.map(function (page) { return page.page_key; }),
    pages: clonePages()
  });

  var THEME_STORAGE_KEY = 'rf_theme_palette';
  var DEFAULT_THEME_KEY = 'blue';

  var THEME_PALETTES = Object.freeze({
    blue: Object.freeze({
      key: 'blue',
      label: 'Albastru',
      previewA: '#7aa5d3',
      previewB: '#dce9f7',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(122,165,211,.22), transparent 26%), linear-gradient(180deg,#d9e8f7 0%, #c7dbef 52%, #bfd6eb 100%)',
      bgSolid: '#c7dbef',
      card: 'rgba(215,228,242,.72)',
      panel: 'rgba(215,228,242,.72)',
      panel2: 'rgba(228,237,246,.80)',
      hdr: 'rgba(219,231,244,.86)',
      header: 'rgba(213,227,242,.88)',
      subheader: 'rgba(203,220,239,.90)',
      head: 'rgba(205,221,240,.92)',
      head2: 'rgba(195,215,237,.90)',
      cell: 'rgba(255,255,255,.78)',
      sticky: 'rgba(225,236,248,.95)',
      grid: 'rgba(37,62,97,.22)',
      line: 'rgba(29,29,29,.75)',
      lineSoft: 'rgba(35,56,85,.16)',
      lineStrong: 'rgba(35,56,85,.28)',
      text: '#10213d',
      muted: '#5e6f87',
      input: 'rgba(227,235,245,.92)',
      white: 'rgba(255,255,255,.84)',
      btn: '#7aa5d3',
      btn2: '#6796c8',
      btnHover: '#5d89b8',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#407cbf',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#c46b00',
      shadow: '0 20px 50px rgba(47,79,121,.18)',
      rowHover: 'rgba(122,165,211,.18)',
      rowSelected: 'rgba(122,165,211,.28)',
      selected: 'rgba(122,165,211,.20)',
      selectedBorder: 'rgba(80,118,160,.56)',
      panelBorder: 'rgba(35,56,85,.20)',
      blue: '#7aa5d3',
      blueDark: '#5d89b8',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#c46b00',
      success: '#166534',
      warning: '#c46b00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(122,165,211,.16)',
      pill: 'rgba(122,165,211,.18)'
    }),
    teal: Object.freeze({
      key: 'teal',
      label: 'Turcoaz',
      previewA: '#4ea9a4',
      previewB: '#d8f0ee',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(78,169,164,.20), transparent 26%), linear-gradient(180deg,#dff4f1 0%, #cbe8e4 52%, #c1e1dc 100%)',
      bgSolid: '#cbe8e4',
      card: 'rgba(217,239,236,.74)',
      panel: 'rgba(217,239,236,.74)',
      panel2: 'rgba(229,245,243,.82)',
      hdr: 'rgba(219,239,236,.88)',
      header: 'rgba(212,236,233,.90)',
      subheader: 'rgba(198,228,224,.92)',
      head: 'rgba(201,231,227,.92)',
      head2: 'rgba(189,223,218,.90)',
      cell: 'rgba(255,255,255,.80)',
      sticky: 'rgba(228,243,241,.95)',
      grid: 'rgba(24,87,88,.22)',
      line: 'rgba(24,52,56,.72)',
      lineSoft: 'rgba(24,87,88,.16)',
      lineStrong: 'rgba(24,87,88,.28)',
      text: '#123338',
      muted: '#527278',
      input: 'rgba(229,242,240,.94)',
      white: 'rgba(255,255,255,.84)',
      btn: '#4ea9a4',
      btn2: '#3f918d',
      btnHover: '#377e79',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#2e8e89',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#a35e00',
      shadow: '0 20px 50px rgba(33,97,100,.16)',
      rowHover: 'rgba(78,169,164,.18)',
      rowSelected: 'rgba(78,169,164,.28)',
      selected: 'rgba(78,169,164,.20)',
      selectedBorder: 'rgba(51,122,118,.52)',
      panelBorder: 'rgba(24,87,88,.20)',
      blue: '#4ea9a4',
      blueDark: '#3f918d',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#c46b00',
      success: '#166534',
      warning: '#c46b00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(78,169,164,.16)',
      pill: 'rgba(78,169,164,.18)'
    }),
    violet: Object.freeze({
      key: 'violet',
      label: 'Mov',
      previewA: '#8a7bd1',
      previewB: '#ebe6fb',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(138,123,209,.22), transparent 26%), linear-gradient(180deg,#eee9fb 0%, #ddd5f2 52%, #d4caed 100%)',
      bgSolid: '#ddd5f2',
      card: 'rgba(234,229,248,.74)',
      panel: 'rgba(234,229,248,.74)',
      panel2: 'rgba(241,237,250,.82)',
      hdr: 'rgba(235,230,248,.88)',
      header: 'rgba(229,223,247,.90)',
      subheader: 'rgba(217,209,242,.92)',
      head: 'rgba(220,212,243,.92)',
      head2: 'rgba(208,198,237,.90)',
      cell: 'rgba(255,255,255,.80)',
      sticky: 'rgba(240,235,249,.95)',
      grid: 'rgba(70,58,124,.22)',
      line: 'rgba(43,32,82,.72)',
      lineSoft: 'rgba(70,58,124,.16)',
      lineStrong: 'rgba(70,58,124,.28)',
      text: '#271f4d',
      muted: '#665f88',
      input: 'rgba(240,235,249,.94)',
      white: 'rgba(255,255,255,.84)',
      btn: '#8a7bd1',
      btn2: '#7564c2',
      btnHover: '#6653b0',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#6d59be',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#a35e00',
      shadow: '0 20px 50px rgba(78,63,140,.16)',
      rowHover: 'rgba(138,123,209,.18)',
      rowSelected: 'rgba(138,123,209,.28)',
      selected: 'rgba(138,123,209,.20)',
      selectedBorder: 'rgba(98,82,171,.52)',
      panelBorder: 'rgba(70,58,124,.20)',
      blue: '#8a7bd1',
      blueDark: '#6653b0',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#c46b00',
      success: '#166534',
      warning: '#c46b00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(138,123,209,.16)',
      pill: 'rgba(138,123,209,.18)'
    }),
    rose: Object.freeze({
      key: 'rose',
      label: 'Roz',
      previewA: '#d184a3',
      previewB: '#fae8ef',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(209,132,163,.20), transparent 26%), linear-gradient(180deg,#faeef3 0%, #edd9e2 52%, #e7ced9 100%)',
      bgSolid: '#edd9e2',
      card: 'rgba(247,234,240,.74)',
      panel: 'rgba(247,234,240,.74)',
      panel2: 'rgba(250,239,244,.82)',
      hdr: 'rgba(247,234,240,.88)',
      header: 'rgba(244,228,236,.90)',
      subheader: 'rgba(238,216,226,.92)',
      head: 'rgba(240,219,228,.92)',
      head2: 'rgba(234,208,220,.90)',
      cell: 'rgba(255,255,255,.80)',
      sticky: 'rgba(249,238,243,.95)',
      grid: 'rgba(131,72,97,.22)',
      line: 'rgba(84,36,56,.72)',
      lineSoft: 'rgba(131,72,97,.16)',
      lineStrong: 'rgba(131,72,97,.28)',
      text: '#4a2032',
      muted: '#876171',
      input: 'rgba(249,238,243,.94)',
      white: 'rgba(255,255,255,.84)',
      btn: '#d184a3',
      btn2: '#bb6f8e',
      btnHover: '#a95f7d',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#b66686',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#a35e00',
      shadow: '0 20px 50px rgba(128,75,98,.16)',
      rowHover: 'rgba(209,132,163,.18)',
      rowSelected: 'rgba(209,132,163,.28)',
      selected: 'rgba(209,132,163,.20)',
      selectedBorder: 'rgba(173,92,126,.52)',
      panelBorder: 'rgba(131,72,97,.20)',
      blue: '#d184a3',
      blueDark: '#bb6f8e',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#c46b00',
      success: '#166534',
      warning: '#c46b00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(209,132,163,.16)',
      pill: 'rgba(209,132,163,.18)'
    }),
    amber: Object.freeze({
      key: 'amber',
      label: 'Auriu',
      previewA: '#c89a52',
      previewB: '#f7ead2',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(200,154,82,.20), transparent 26%), linear-gradient(180deg,#faf2de 0%, #ecdcb8 52%, #e5d0aa 100%)',
      bgSolid: '#ecdcb8',
      card: 'rgba(248,239,220,.76)',
      panel: 'rgba(248,239,220,.76)',
      panel2: 'rgba(250,243,228,.84)',
      hdr: 'rgba(247,237,218,.88)',
      header: 'rgba(243,231,206,.90)',
      subheader: 'rgba(236,220,186,.92)',
      head: 'rgba(238,223,191,.92)',
      head2: 'rgba(232,213,174,.90)',
      cell: 'rgba(255,255,255,.80)',
      sticky: 'rgba(249,241,224,.95)',
      grid: 'rgba(110,76,24,.22)',
      line: 'rgba(79,55,18,.72)',
      lineSoft: 'rgba(110,76,24,.16)',
      lineStrong: 'rgba(110,76,24,.28)',
      text: '#473011',
      muted: '#816446',
      input: 'rgba(249,241,224,.94)',
      white: 'rgba(255,255,255,.84)',
      btn: '#c89a52',
      btn2: '#b48337',
      btnHover: '#9b6f2c',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#b27c28',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#8b5a00',
      shadow: '0 20px 50px rgba(111,81,33,.16)',
      rowHover: 'rgba(200,154,82,.18)',
      rowSelected: 'rgba(200,154,82,.28)',
      selected: 'rgba(200,154,82,.20)',
      selectedBorder: 'rgba(155,111,44,.52)',
      panelBorder: 'rgba(110,76,24,.20)',
      blue: '#c89a52',
      blueDark: '#9b6f2c',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8b5a00',
      success: '#166534',
      warning: '#8b5a00',
      bad: '#b42318',
      orange: '#b86c00',
      chip: 'rgba(200,154,82,.16)',
      pill: 'rgba(200,154,82,.18)'
    }),
    green: Object.freeze({
      key: 'green',
      label: 'Verde',
      previewA: '#6fa86f',
      previewB: '#e2f1e0',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.58), transparent 32%), radial-gradient(circle at top right, rgba(111,168,111,.20), transparent 26%), linear-gradient(180deg,#edf7eb 0%, #d9ebd5 52%, #cfe4ca 100%)',
      bgSolid: '#d9ebd5',
      card: 'rgba(232,244,228,.76)',
      panel: 'rgba(232,244,228,.76)',
      panel2: 'rgba(239,248,236,.84)',
      hdr: 'rgba(232,244,228,.88)',
      header: 'rgba(225,239,220,.90)',
      subheader: 'rgba(213,232,207,.92)',
      head: 'rgba(216,235,210,.92)',
      head2: 'rgba(203,226,196,.90)',
      cell: 'rgba(255,255,255,.80)',
      sticky: 'rgba(238,247,235,.95)',
      grid: 'rgba(43,96,43,.22)',
      line: 'rgba(29,64,29,.72)',
      lineSoft: 'rgba(43,96,43,.16)',
      lineStrong: 'rgba(43,96,43,.28)',
      text: '#1f3a1f',
      muted: '#5c785c',
      input: 'rgba(238,247,235,.94)',
      white: 'rgba(255,255,255,.84)',
      btn: '#6fa86f',
      btn2: '#5c915c',
      btnHover: '#4e7b4e',
      btnSoft: 'rgba(255,255,255,.44)',
      focus: '#5a925a',
      statusBg: 'rgba(255,255,255,.78)',
      statusText: '#8b5a00',
      shadow: '0 20px 50px rgba(57,102,57,.16)',
      rowHover: 'rgba(111,168,111,.18)',
      rowSelected: 'rgba(111,168,111,.28)',
      selected: 'rgba(111,168,111,.20)',
      selectedBorder: 'rgba(78,123,78,.52)',
      panelBorder: 'rgba(43,96,43,.20)',
      blue: '#6fa86f',
      blueDark: '#4e7b4e',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8b5a00',
      success: '#166534',
      warning: '#8b5a00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(111,168,111,.16)',
      pill: 'rgba(111,168,111,.18)'

    }),
    slate: Object.freeze({
      key: 'slate',
      label: 'Slate Soft',
      previewA: '#7f92a9',
      previewB: '#d9e2ec',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.34), transparent 30%), radial-gradient(circle at top right, rgba(106,126,149,.18), transparent 24%), linear-gradient(180deg,#d7e0ea 0%, #c2cedb 52%, #b7c4d2 100%)',
      bgSolid: '#c2cedb',
      card: 'rgba(215,224,235,.78)',
      panel: 'rgba(215,224,235,.78)',
      panel2: 'rgba(225,232,240,.86)',
      hdr: 'rgba(216,225,236,.90)',
      header: 'rgba(208,219,232,.92)',
      subheader: 'rgba(198,211,226,.94)',
      head: 'rgba(201,214,228,.94)',
      head2: 'rgba(190,204,220,.92)',
      cell: 'rgba(248,250,252,.84)',
      sticky: 'rgba(226,233,241,.96)',
      grid: 'rgba(51,72,96,.22)',
      line: 'rgba(36,49,66,.74)',
      lineSoft: 'rgba(51,72,96,.16)',
      lineStrong: 'rgba(51,72,96,.28)',
      text: '#162333',
      muted: '#546679',
      input: 'rgba(234,239,245,.96)',
      white: 'rgba(255,255,255,.86)',
      btn: '#6f849c',
      btn2: '#61758b',
      btnHover: '#56697e',
      btnSoft: 'rgba(255,255,255,.42)',
      focus: '#5a7188',
      statusBg: 'rgba(255,255,255,.80)',
      statusText: '#8a5a00',
      shadow: '0 20px 50px rgba(56,73,98,.16)',
      rowHover: 'rgba(111,132,156,.18)',
      rowSelected: 'rgba(111,132,156,.28)',
      selected: 'rgba(111,132,156,.20)',
      selectedBorder: 'rgba(86,105,126,.52)',
      panelBorder: 'rgba(51,72,96,.20)',
      blue: '#6f849c',
      blueDark: '#56697e',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8a5a00',
      success: '#166534',
      warning: '#8a5a00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(111,132,156,.16)',
      pill: 'rgba(111,132,156,.18)'
    }),
    graphite: Object.freeze({
      key: 'graphite',
      label: 'Grafit Soft',
      previewA: '#6d747f',
      previewB: '#d9dde2',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.30), transparent 30%), radial-gradient(circle at top right, rgba(90,99,111,.16), transparent 24%), linear-gradient(180deg,#d8dde3 0%, #c5ccd4 52%, #bac2cb 100%)',
      bgSolid: '#c5ccd4',
      card: 'rgba(220,225,232,.80)',
      panel: 'rgba(220,225,232,.80)',
      panel2: 'rgba(229,233,238,.88)',
      hdr: 'rgba(221,226,232,.92)',
      header: 'rgba(214,220,227,.94)',
      subheader: 'rgba(203,210,218,.94)',
      head: 'rgba(206,213,221,.94)',
      head2: 'rgba(195,203,212,.92)',
      cell: 'rgba(250,251,252,.86)',
      sticky: 'rgba(229,233,238,.96)',
      grid: 'rgba(58,64,72,.22)',
      line: 'rgba(41,46,52,.76)',
      lineSoft: 'rgba(58,64,72,.16)',
      lineStrong: 'rgba(58,64,72,.28)',
      text: '#1b2026',
      muted: '#5b6570',
      input: 'rgba(237,240,244,.96)',
      white: 'rgba(255,255,255,.88)',
      btn: '#6d747f',
      btn2: '#5d636d',
      btnHover: '#4f5660',
      btnSoft: 'rgba(255,255,255,.42)',
      focus: '#56606c',
      statusBg: 'rgba(255,255,255,.82)',
      statusText: '#8a5a00',
      shadow: '0 20px 50px rgba(61,67,75,.16)',
      rowHover: 'rgba(109,116,127,.18)',
      rowSelected: 'rgba(109,116,127,.28)',
      selected: 'rgba(109,116,127,.20)',
      selectedBorder: 'rgba(79,86,96,.52)',
      panelBorder: 'rgba(58,64,72,.20)',
      blue: '#6d747f',
      blueDark: '#4f5660',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8a5a00',
      success: '#166534',
      warning: '#8a5a00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(109,116,127,.16)',
      pill: 'rgba(109,116,127,.18)'
    }),
    petrol: Object.freeze({
      key: 'petrol',
      label: 'Petrol Soft',
      previewA: '#5f7f86',
      previewB: '#d7e6e8',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.32), transparent 30%), radial-gradient(circle at top right, rgba(75,106,113,.18), transparent 24%), linear-gradient(180deg,#d8e8ea 0%, #c2d6d9 52%, #b7cdd0 100%)',
      bgSolid: '#c2d6d9',
      card: 'rgba(219,233,235,.80)',
      panel: 'rgba(219,233,235,.80)',
      panel2: 'rgba(229,239,241,.88)',
      hdr: 'rgba(220,234,236,.92)',
      header: 'rgba(211,229,232,.94)',
      subheader: 'rgba(198,220,223,.94)',
      head: 'rgba(202,223,226,.94)',
      head2: 'rgba(190,214,218,.92)',
      cell: 'rgba(250,252,252,.86)',
      sticky: 'rgba(228,238,240,.96)',
      grid: 'rgba(39,78,86,.22)',
      line: 'rgba(26,55,61,.76)',
      lineSoft: 'rgba(39,78,86,.16)',
      lineStrong: 'rgba(39,78,86,.28)',
      text: '#17343a',
      muted: '#577176',
      input: 'rgba(236,243,244,.96)',
      white: 'rgba(255,255,255,.88)',
      btn: '#5f7f86',
      btn2: '#516e74',
      btnHover: '#455f64',
      btnSoft: 'rgba(255,255,255,.42)',
      focus: '#4f6b71',
      statusBg: 'rgba(255,255,255,.82)',
      statusText: '#8a5a00',
      shadow: '0 20px 50px rgba(43,78,85,.16)',
      rowHover: 'rgba(95,127,134,.18)',
      rowSelected: 'rgba(95,127,134,.28)',
      selected: 'rgba(95,127,134,.20)',
      selectedBorder: 'rgba(69,95,100,.52)',
      panelBorder: 'rgba(39,78,86,.20)',
      blue: '#5f7f86',
      blueDark: '#455f64',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8a5a00',
      success: '#166534',
      warning: '#8a5a00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(95,127,134,.16)',
      pill: 'rgba(95,127,134,.18)'
    }),
    plum: Object.freeze({
      key: 'plum',
      label: 'Prună Soft',
      previewA: '#7d6f86',
      previewB: '#e2dde7',
      bodyBackground: 'radial-gradient(circle at top left, rgba(255,255,255,.32), transparent 30%), radial-gradient(circle at top right, rgba(100,83,111,.16), transparent 24%), linear-gradient(180deg,#e3dfe8 0%, #d1c9d7 52%, #c7becf 100%)',
      bgSolid: '#d1c9d7',
      card: 'rgba(233,228,238,.80)',
      panel: 'rgba(233,228,238,.80)',
      panel2: 'rgba(240,236,243,.88)',
      hdr: 'rgba(233,228,238,.92)',
      header: 'rgba(227,221,233,.94)',
      subheader: 'rgba(217,208,224,.94)',
      head: 'rgba(220,211,226,.94)',
      head2: 'rgba(209,198,217,.92)',
      cell: 'rgba(252,250,253,.86)',
      sticky: 'rgba(239,234,243,.96)',
      grid: 'rgba(77,58,88,.22)',
      line: 'rgba(52,39,60,.76)',
      lineSoft: 'rgba(77,58,88,.16)',
      lineStrong: 'rgba(77,58,88,.28)',
      text: '#2a2030',
      muted: '#6c6173',
      input: 'rgba(244,240,246,.96)',
      white: 'rgba(255,255,255,.88)',
      btn: '#7d6f86',
      btn2: '#6c5e75',
      btnHover: '#5d5064',
      btnSoft: 'rgba(255,255,255,.42)',
      focus: '#685b70',
      statusBg: 'rgba(255,255,255,.82)',
      statusText: '#8a5a00',
      shadow: '0 20px 50px rgba(72,58,81,.16)',
      rowHover: 'rgba(125,111,134,.18)',
      rowSelected: 'rgba(125,111,134,.28)',
      selected: 'rgba(125,111,134,.20)',
      selectedBorder: 'rgba(93,80,100,.52)',
      panelBorder: 'rgba(77,58,88,.20)',
      blue: '#7d6f86',
      blueDark: '#5d5064',
      green: '#1f7a53',
      yellow: '#b7791f',
      red: '#c53030',
      danger: '#b42318',
      ok: '#166534',
      warn: '#8a5a00',
      success: '#166534',
      warning: '#8a5a00',
      bad: '#b42318',
      orange: '#d97706',
      chip: 'rgba(125,111,134,.16)',
      pill: 'rgba(125,111,134,.18)'
    })

  });

  var THEME_ORDER = Object.freeze(Object.keys(THEME_PALETTES));

  function normalizeThemeKey(value) {
    var key = String(value || '').trim().toLowerCase();
    return THEME_PALETTES[key] ? key : DEFAULT_THEME_KEY;
  }

  function getStoredThemeKey() {
    try {
      return normalizeThemeKey(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch (_) {
      return DEFAULT_THEME_KEY;
    }
  }

  function buildPaletteCss(key, palette) {
    return [
      'html[data-rf-theme="' + key + '"]{',
      '  color-scheme:light;',
      '  --bg:' + palette.bgSolid + ';',
      '  --card:' + palette.card + ';',
      '  --panel:' + palette.panel + ';',
      '  --panel-2:' + palette.panel2 + ';',
      '  --panel2:' + palette.panel2 + ';',
      '  --hdr:' + palette.hdr + ';',
      '  --header:' + palette.header + ';',
      '  --subheader:' + palette.subheader + ';',
      '  --head:' + palette.head + ';',
      '  --head-2:' + palette.head2 + ';',
      '  --head2:' + palette.head2 + ';',
      '  --cell:' + palette.cell + ';',
      '  --sticky:' + palette.sticky + ';',
      '  --grid:' + palette.grid + ';',
      '  --line:' + palette.line + ';',
      '  --line-soft:' + palette.lineSoft + ';',
      '  --line-strong:' + palette.lineStrong + ';',
      '  --text:' + palette.text + ';',
      '  --muted:' + palette.muted + ';',
      '  --input:' + palette.input + ';',
      '  --white:' + palette.white + ';',
      '  --btn:' + palette.btn + ';',
      '  --btn2:' + palette.btn2 + ';',
      '  --btn-hover:' + palette.btnHover + ';',
      '  --btn-soft:' + palette.btnSoft + ';',
      '  --focus:' + palette.focus + ';',
      '  --status-bg:' + palette.statusBg + ';',
      '  --status-text:' + palette.statusText + ';',
      '  --shadow:' + palette.shadow + ';',
      '  --row-hover:' + palette.rowHover + ';',
      '  --row-selected:' + palette.rowSelected + ';',
      '  --selected:' + palette.selected + ';',
      '  --selected-border:' + palette.selectedBorder + ';',
      '  --panel-border:' + palette.panelBorder + ';',
      '  --blue:' + palette.blue + ';',
      '  --blue-dark:' + palette.blueDark + ';',
      '  --green:' + palette.green + ';',
      '  --yellow:' + palette.yellow + ';',
      '  --red:' + palette.red + ';',
      '  --danger:' + palette.danger + ';',
      '  --ok:' + palette.ok + ';',
      '  --warn:' + palette.warn + ';',
      '  --success:' + palette.success + ';',
      '  --warning:' + palette.warning + ';',
      '  --bad:' + palette.bad + ';',
      '  --orange:' + palette.orange + ';',
      '  --chip:' + palette.chip + ';',
      '  --pill:' + palette.pill + ';',
      '}',
      'html[data-rf-theme="' + key + '"] body{',
      '  background:' + palette.bodyBackground + ' !important;',
      '  color:var(--text) !important;',
      '}'
    ].join('\n');
  }

  function buildSharedThemeCss() {
    return [
      'html[data-rf-theme] .card,',
      'html[data-rf-theme] .panel,',
      'html[data-rf-theme] .panel2,',
      'html[data-rf-theme] .topbar,',
      'html[data-rf-theme] .toolbar-card,',
      'html[data-rf-theme] .status-row,',
      'html[data-rf-theme] .status-panel,',
      'html[data-rf-theme] .workspace,',
      'html[data-rf-theme] .grid-card,',
      'html[data-rf-theme] .table-shell,',
      'html[data-rf-theme] .table-card,',
      'html[data-rf-theme] .sheet,',
      'html[data-rf-theme] .bucket,',
      'html[data-rf-theme] .status-box,',
      'html[data-rf-theme] .stat,',
      'html[data-rf-theme] .stat-card,',
      'html[data-rf-theme] .count-box,',
      'html[data-rf-theme] .sideCard,',
      'html[data-rf-theme] .table-wrap,',
      'html[data-rf-theme] .sideTableWrap,',
      'html[data-rf-theme] .sumWrap,',
      'html[data-rf-theme] .table-panel,',
      'html[data-rf-theme] .filters,',
      'html[data-rf-theme] .form-panel,',
      'html[data-rf-theme] .modal,',
      'html[data-rf-theme] .modal-box,',
      'html[data-rf-theme] .pm-modal,',
      'html[data-rf-theme] .lockBox,',
      'html[data-rf-theme] .panel-body,',
      'html[data-rf-theme] .header{',
      '  color:var(--text) !important;',
      '  border-color:var(--line-soft) !important;',
      '  box-shadow:var(--shadow) !important;',
      '}',
      'html[data-rf-theme] .card,',
      'html[data-rf-theme] .panel,',
      'html[data-rf-theme] .panel2,',
      'html[data-rf-theme] .workspace,',
      'html[data-rf-theme] .grid-card,',
      'html[data-rf-theme] .table-shell,',
      'html[data-rf-theme] .table-card,',
      'html[data-rf-theme] .sheet,',
      'html[data-rf-theme] .bucket,',
      'html[data-rf-theme] .stat-card,',
      'html[data-rf-theme] .sideCard,',
      'html[data-rf-theme] .table-panel,',
      'html[data-rf-theme] .table-wrap,',
      'html[data-rf-theme] .tablewrap,',
      'html[data-rf-theme] .tableWrap,',
      'html[data-rf-theme] .form-panel,',
      'html[data-rf-theme] .modal-box,',
      'html[data-rf-theme] .pm-modal,',
      'html[data-rf-theme] .lockBox{',
      '  background:var(--panel2) !important;',
      '  backdrop-filter:blur(4px) saturate(108%) !important;',
      '  -webkit-backdrop-filter:blur(4px) saturate(108%) !important;',
      '}',
      'html[data-rf-theme] .card-top,',
      'html[data-rf-theme] .panel-header,',
      'html[data-rf-theme] .bucketHead,',
      'html[data-rf-theme] .modalHead,',
      'html[data-rf-theme] .modal-head,',
      'html[data-rf-theme] .topbar,',
      'html[data-rf-theme] .toolbar-card,',
      'html[data-rf-theme] .grid-toolbar,',
      'html[data-rf-theme] .table-head{',
      '  background:linear-gradient(180deg,var(--hdr),var(--subheader)) !important;',
      '  color:var(--text) !important;',
      '  border-color:var(--line-soft) !important;',
      '}',
      'html[data-rf-theme] input,',
      'html[data-rf-theme] select,',
      'html[data-rf-theme] textarea{',
      '  background:var(--input) !important;',
      '  color:var(--text) !important;',
      '  border-color:var(--line-strong) !important;',
      '}',
      'html[data-rf-theme] input::placeholder,',
      'html[data-rf-theme] textarea::placeholder{',
      '  color:var(--muted) !important;',
      '}',
      'html[data-rf-theme] table{',
      '  color:var(--text) !important;',
      '}',
      'html[data-rf-theme] thead th{',
      '  border-color:var(--grid) !important;',
      '}',
      'html[data-rf-theme] tbody td,',
      'html[data-rf-theme] tfoot td{',
      '  border-color:var(--grid) !important;',
      '}',
      'html[data-rf-theme] .eyebrow,',
      'html[data-rf-theme] .subtitle,',
      'html[data-rf-theme] .meta,',
      'html[data-rf-theme] .hint,',
      'html[data-rf-theme] .field label,',
      'html[data-rf-theme] .status-label,',
      'html[data-rf-theme] .stat-label,',
      'html[data-rf-theme] .chip,',
      'html[data-rf-theme] .pill,',
      'html[data-rf-theme] .badge,',
      'html[data-rf-theme] .meta-pill,',
      'html[data-rf-theme] .theme-label,',
      'html[data-rf-theme] .theme-name{',
      '  color:var(--muted) !important;',
      '}',
      'html[data-rf-theme] h1,',
      'html[data-rf-theme] h2,',
      'html[data-rf-theme] h3,',
      'html[data-rf-theme] .title,',
      'html[data-rf-theme] .panel-title,',
      'html[data-rf-theme] label{',
      '  color:var(--text) !important;',
      '}',
      'html[data-rf-theme] .toggle-pass{',
      '  background:var(--btn-soft) !important;',
      '  color:var(--text) !important;',
      '  border-color:var(--line-strong) !important;',
      '}',
      'html[data-rf-theme] .status-box{',
      '  background:var(--status-bg) !important;',
      '  color:var(--status-text) !important;',
      '}',
      'html[data-rf-theme] .status-box.ok{',
      '  color:#166534 !important;',
      '  background:#f0fdf4 !important;',
      '}',
      'html[data-rf-theme] .status-box.error{',
      '  color:#b42318 !important;',
      '  background:#fff5f5 !important;',
      '}',
      'html[data-rf-theme] .main-btn,',
      'html[data-rf-theme] .theme-btn{',
      '  background:linear-gradient(180deg,var(--btn),var(--btn2)) !important;',
      '  color:#f4f8ff !important;',
      '}',
      'html[data-rf-theme] .theme-swatch{',
      '  border-color:var(--line-strong) !important;',
      '}',
      'html[data-rf-theme] .theme-swatch.active{',
      '  box-shadow:0 0 0 3px rgba(255,255,255,.65), 0 0 0 6px var(--btn) !important;',
      '}',

      'html[data-rf-theme] .tablewrap,',
      'html[data-rf-theme] .tableWrap,',
      'html[data-rf-theme] .summaryWrap,',
      'html[data-rf-theme] .sumWrap{',
      '  background:var(--white) !important;',
      '  border-color:var(--line-soft) !important;',
      '  backdrop-filter:none !important;',
      '  -webkit-backdrop-filter:none !important;',
      '}',
      'html[data-rf-theme] body,',
      'html[data-rf-theme] input,',
      'html[data-rf-theme] select,',
      'html[data-rf-theme] textarea,',
      'html[data-rf-theme] table,',
      'html[data-rf-theme] thead th,',
      'html[data-rf-theme] tbody td,',
      'html[data-rf-theme] tfoot td,',
      'html[data-rf-theme] .cellText,',
      'html[data-rf-theme] .cellInp,',
      'html[data-rf-theme] .cellSel,',
      'html[data-rf-theme] .status,',
      'html[data-rf-theme] .pill,',
      'html[data-rf-theme] .cardTitle{',
      '  text-shadow:none !important;',
      '  text-rendering:optimizeLegibility;',
      '}',
      'html[data-rf-theme] input,',
      'html[data-rf-theme] select,',
      'html[data-rf-theme] textarea,',
      'html[data-rf-theme] .cellInp,',
      'html[data-rf-theme] .cellSel,',
      'html[data-rf-theme] .cellText,',
      'html[data-rf-theme] tbody td,',
      'html[data-rf-theme] .status,',
      'html[data-rf-theme] .pill,',
      'html[data-rf-theme] .subtitle,',
      'html[data-rf-theme] .meta,',
      'html[data-rf-theme] .hint{',
      '  color:var(--text) !important;',
      '}',
      'html[data-rf-theme] input,',
      'html[data-rf-theme] select,',
      'html[data-rf-theme] textarea,',
      'html[data-rf-theme] .cellInp,',
      'html[data-rf-theme] .cellSel{',
      '  font-weight:600 !important;',
      '}',
      'html[data-rf-theme] .status{',
      '  opacity:1 !important;',
      '}'
    ].join('\n');
  }

  function ensureThemeStyle() {
    if (document.getElementById('rf-global-theme-style')) return;

    var style = document.createElement('style');
    style.id = 'rf-global-theme-style';
    style.textContent = THEME_ORDER.map(function (key) {
      return buildPaletteCss(key, THEME_PALETTES[key]);
    }).join('\n\n') + '\n\n' + buildSharedThemeCss();

    (document.head || document.documentElement).appendChild(style);
  }

  function getThemePalette(key) {
    return THEME_PALETTES[normalizeThemeKey(key)];
  }

  function applyThemeKey(key) {
    var normalized = normalizeThemeKey(key);
    try { document.documentElement.setAttribute('data-rf-theme', normalized); } catch (_) {}
    try { ensureThemeStyle(); } catch (_) {}
    return normalized;
  }

  function setThemeKey(key) {
    var normalized = applyThemeKey(key);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, normalized); } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent('rf-theme-change', {
        detail: {
          themeKey: normalized,
          palette: getThemePalette(normalized)
        }
      }));
    } catch (_) {}
    return normalized;
  }

  function getThemeList() {
    return THEME_ORDER.map(function (key) {
      var palette = THEME_PALETTES[key];
      return Object.freeze({
        key: key,
        label: palette.label,
        previewA: palette.previewA,
        previewB: palette.previewB
      });
    });
  }

  function getStoredThemeMode() {
    return 'light';
  }

  function toggleThemeMode() {
    var current = getStoredThemeKey();
    var index = THEME_ORDER.indexOf(current);
    var nextKey = THEME_ORDER[(index + 1) % THEME_ORDER.length] || DEFAULT_THEME_KEY;
    return setThemeKey(nextKey);
  }

  applyThemeKey(getStoredThemeKey());

  window.addEventListener('storage', function (event) {
    if (!event || event.key !== THEME_STORAGE_KEY) return;
    applyThemeKey(normalizeThemeKey(event.newValue));
  });



  function getAuthOptions(extra) {
    return Object.assign({ persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }, extra || {});
  }

  function createRfSupabaseClient(options) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase library is not loaded.');
    }
    var authOptions = getAuthOptions(options && options.auth);
    var singleton = window.__RF_SUPABASE_SINGLETON__;
    var canReuse = singleton && singleton.client && singleton.url === CONFIG.SUPABASE_URL && singleton.key === CONFIG.SUPABASE_ANON_KEY;
    var wantsDefaultAuth = (!options || !options.auth || JSON.stringify(authOptions) === JSON.stringify(getAuthOptions()));
    if (canReuse && wantsDefaultAuth) {
      return singleton.client;
    }
    var client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: authOptions
    });
    if (wantsDefaultAuth) {
      window.__RF_SUPABASE_SINGLETON__ = {
        url: CONFIG.SUPABASE_URL,
        key: CONFIG.SUPABASE_ANON_KEY,
        client: client
      };
    }
    return client;
  }

  function safeLower(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeRole(value) {
    var role = safeLower(value);
    return role || 'viewer';
  }

  function normalizeHref(value) {
    return String(value || '').split('#')[0].split('?')[0];
  }

  function pageKeyToHref(pageKey) {
    var key = String(pageKey || '').trim();
    if (!key) return '';
    if (key === 'index') return 'index.html';
    if (key === 'login') return 'login.html';
    return key + '.html';
  }

  function inferPageKey(pathname) {
    var path = String(pathname || window.location.pathname || '');
    var file = path.split('/').pop() || 'index.html';
    file = normalizeHref(file);
    if (!file || file === 'index' || file === 'index.html') return 'index';
    if (file === 'login' || file === 'login.html') return 'login';
    if (!/\.html$/i.test(file)) return file.replace(/\.html$/i, '');
    return file.replace(/\.html$/i, '');
  }

  var INITIAL_PAGE_KEY = inferPageKey(window.location.pathname);

  function ensureAclPendingStyle() {
    if (document.getElementById('rf-acl-pending-style')) return;
    var style = document.createElement('style');
    style.id = 'rf-acl-pending-style';
    style.textContent = [
      'html.rf-acl-pending body{visibility:hidden !important;}',
      'html.rf-acl-denied body{visibility:visible !important;}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function setAclPendingState(enabled) {
    try {
      ensureAclPendingStyle();
      if (!document.documentElement) return;
      if (enabled) document.documentElement.classList.add('rf-acl-pending');
      else document.documentElement.classList.remove('rf-acl-pending');
    } catch (_) {}
  }

  function renderAccessDeniedPage(pageKey, message) {
    function mount() {
      try {
        document.documentElement.classList.remove('rf-acl-pending');
        document.documentElement.classList.add('rf-acl-denied');
        if (!document.body) return false;
        var pageName = PAGE_MAP[String(pageKey || '').trim()] || String(pageKey || '').trim() || 'această pagină';
        var safeMessage = String(message || 'Nu ai acces în această pagină.');
        document.body.innerHTML = '' +
          '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;">' +
            '<div style="width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;">' +
              '<div style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;">Acces restricționat</div>' +
              '<div style="font-size:18px;font-weight:700;margin:0 0 10px;">' + pageName + '</div>' +
              '<div style="font-size:16px;line-height:1.5;margin:0 0 22px;">' + safeMessage + '</div>' +
              '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
                '<a href="login.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;">Schimbă utilizatorul</a>' +
              '</div>' +
            '</div>' +
          '</div>' ;
        return true;
      } catch (_) {
        return false;
      }
    }
    if (!mount()) {
      document.addEventListener('DOMContentLoaded', function once() {
        document.removeEventListener('DOMContentLoaded', once);
        mount();
      });
    }
  }

  if (INITIAL_PAGE_KEY && INITIAL_PAGE_KEY !== 'index' && INITIAL_PAGE_KEY !== 'login') {
    setAclPendingState(true);
  }

  async function resolveRole(client, user) {
    var email = safeLower(user && user.email);
    if (email && email === safeLower(CONFIG.ADMIN_EMAIL)) {
      return { role: 'admin', source: 'admin hardcoded' };
    }
    if (!client || !user || !user.id) {
      return { role: 'viewer', source: 'fallback viewer' };
    }

    try {
      var a = await client.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      if (!a.error && a.data && a.data.role) return { role: normalizeRole(a.data.role), source: 'profiles.user_id' };
    } catch (_) {}

    try {
      var b = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!b.error && b.data && b.data.role) return { role: normalizeRole(b.data.role), source: 'profiles.id' };
    } catch (_) {}

    if (email) {
      try {
        var c = await client.from('rf_acl').select('role').eq('email', email).maybeSingle();
        if (!c.error && c.data && c.data.role) return { role: normalizeRole(c.data.role), source: 'rf_acl' };
      } catch (_) {}
    }

    return { role: 'viewer', source: 'fallback viewer' };
  }

  function normalizeAclEmail(value) {
    return safeLower(value);
  }

  function buildPermissionEntry(row) {
    return {
      can_view: row && row.can_view === true,
      can_add: row && row.can_add === true,
      can_edit: row && row.can_edit === true,
      can_delete: row && row.can_delete === true,
      can_export: row && row.can_export === true,
      can_import: row && row.can_import === true
    };
  }


function buildControlPermissionEntry(row) {
  return {
    control_key: String(row && row.control_key || '').trim(),
    control_label: String(row && (row.control_label || row.control_key) || '').trim(),
    control_type: String(row && row.control_type || 'action').trim() || 'action',
    can_view: row && (row.can_view === true || row.is_visible === true),
    can_use: row && (row.can_use === true || row.is_enabled === true),
    can_edit: row && (row.can_edit === true || row.is_editable === true)
  };
}

function mergeControlAccess(base, incoming) {
  var result = Object.assign({}, base || {});
  var next = incoming && typeof incoming === 'object' ? incoming : {};
  ['can_view','can_use','can_edit'].forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      result[key] = next[key] === true;
    }
  });
  if (next.control_label) result.control_label = next.control_label;
  if (next.control_type) result.control_type = next.control_type;
  return result;
}

function defaultControlAccessFromPagePermissions(pagePermissions, controlKey) {
  var perms = pagePermissions && typeof pagePermissions === 'object' ? pagePermissions : defaultPageAccessFromRole('viewer', '');
  var key = String(controlKey || '').trim();
  var base = { can_view: perms.can_view === true, can_use: perms.can_view === true, can_edit: perms.can_edit === true };
  if (!key) return base;
  if (key === 'rows.add' || key === 'modal.open' || key === 'pdf.upload' || key === 'masterdata.edit' || key === 'permissions.save' || key === 'controls.save') {
    return { can_view: perms.can_add === true || perms.can_edit === true, can_use: perms.can_add === true || perms.can_edit === true, can_edit: false };
  }
  if (key === 'rows.edit' || key.indexOf('field.') === 0 || key.indexOf('pdf.revision.') === 0) {
    return { can_view: perms.can_view === true, can_use: perms.can_edit === true, can_edit: perms.can_edit === true };
  }
  if (key === 'rows.delete' || key === 'pdf.delete') {
    return { can_view: perms.can_delete === true, can_use: perms.can_delete === true, can_edit: false };
  }
  if (key === 'data.export' || key === 'pdf.download') {
    return { can_view: perms.can_export === true || perms.can_view === true, can_use: perms.can_export === true || perms.can_view === true, can_edit: false };
  }
  if (key === 'data.import') {
    return { can_view: perms.can_import === true, can_use: perms.can_import === true, can_edit: false };
  }
  if (key === 'rows.filter' || key === 'cloud.refresh' || key === 'pdf.open' || key === 'problems.link' || key === 'dashboard.palette' || key === 'dashboard.refresh' || key === 'users.manage' || key.indexOf('nav.') === 0) {
    return { can_view: perms.can_view === true, can_use: perms.can_view === true, can_edit: false };
  }
  if (key === 'cloud.save') {
    return { can_view: perms.can_add === true || perms.can_edit === true, can_use: perms.can_add === true || perms.can_edit === true, can_edit: false };
  }
  return base;
}

async function loadUserControlPermissionMap(client, user, pageKey) {
  if (!client || !user) return null;
  var email = normalizeAclEmail(user.email);
  var userId = user && user.id ? String(user.id).trim() : '';
  if (!email && !userId) return null;
  var map = new Map();

  function appendRows(rows) {
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var pg = String(row && row.page_key || '').trim();
      var ck = String(row && row.control_key || '').trim();
      if (!pg || !ck) return;
      map.set(pg + '::' + ck, buildControlPermissionEntry(row));
    });
  }

  var queryColumns = 'page_key,control_key,control_label,control_type,can_view,can_use,can_edit,is_visible,is_enabled,is_editable';
  if (userId) {
    try {
      var byUserId = client.from('user_control_permissions').select(queryColumns).eq('user_id', userId);
      if (pageKey) byUserId = byUserId.eq('page_key', pageKey);
      byUserId = await byUserId;
      if (!byUserId.error) appendRows(byUserId.data);
    } catch (_) {}
  }
  if (email) {
    try {
      var byEmail = client.from('user_control_permissions').select(queryColumns).ilike('email', email);
      if (pageKey) byEmail = byEmail.eq('page_key', pageKey);
      byEmail = await byEmail;
      if (!byEmail.error) appendRows(byEmail.data);
    } catch (_) {}
  }

  return map.size ? map : null;
}

async function loadRoleFieldPermissionMap(client, role, pageKey) {
  if (!client) return null;
  try {
    var query = client.from('field_permissions').select('page_key,field_key,can_edit').eq('role', normalizeRole(role));
    if (pageKey) query = query.eq('page_key', pageKey);
    var res = await query;
    if (res.error || !Array.isArray(res.data)) return null;
    var map = new Map();
    res.data.forEach(function (row) {
      var pg = String(row && row.page_key || '').trim();
      var ck = String(row && row.field_key || '').trim();
      if (!pg || !ck) return;
      map.set(pg + '::' + ck, { can_view:true, can_use: row.can_edit === true, can_edit: row.can_edit === true, control_key: ck, control_type:'field', control_label: ck });
    });
    return map.size ? map : null;
  } catch (_) {
    return null;
  }
}

async function resolveControlAccess(pageKey, controlKey, options) {
  var key = String(pageKey || '').trim();
  var cKey = String(controlKey || '').trim();
  var client = options && options.client ? options.client : createRfSupabaseClient();
  var pageAccess = options && options.pageAccess ? options.pageAccess : await resolvePageAccess(key, options);
  var user = options && options.user ? options.user : null;
  if (!user && client) {
    try {
      var sessionRes = await client.auth.getSession();
      user = sessionRes && sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
    } catch (_) { user = null; }
  }
  var base = defaultControlAccessFromPagePermissions(pageAccess && pageAccess.permissions, cKey);
  var role = normalizeRole(pageAccess && pageAccess.role || 'viewer');
  var merged = Object.assign({ control_key:cKey, control_label:cKey, control_type:'action' }, base);
  var source = 'page permissions';
  if (role !== 'admin' && client && user) {
    var userMap = await loadUserControlPermissionMap(client, user, key);
    var roleFieldMap = await loadRoleFieldPermissionMap(client, role, key);
    var fullKey = key + '::' + cKey;
    if (roleFieldMap && roleFieldMap.has(fullKey)) {
      merged = mergeControlAccess(merged, roleFieldMap.get(fullKey));
      source = 'role field permissions';
    }
    if (userMap && userMap.has(fullKey)) {
      merged = mergeControlAccess(merged, userMap.get(fullKey));
      source = 'user control permissions';
    }
  } else if (role === 'admin') {
    merged = { control_key:cKey, control_label:cKey, control_type:'action', can_view:true, can_use:true, can_edit:true };
    source = 'admin';
  }
  merged.allowed = merged.can_view === true;
  return merged;
}

async function canUseControl(pageKey, controlKey, options) {
  var res = await resolveControlAccess(pageKey, controlKey, options);
  return { allowed: res.can_use === true && res.can_view === true, visible: res.can_view === true, editable: res.can_edit === true, source: res.source || '' };
}

async function applyDomPermissions(pageKey, root, options) {
  var pageAccess = options && options.pageAccess ? options.pageAccess : await resolvePageAccess(pageKey, options);
  var scope = root && root.querySelectorAll ? root : document;
  var nodes = scope.querySelectorAll('[data-rf-permission],[data-rf-control],[data-rf-field]');
  for (var i = 0; i < nodes.length; i += 1) {
    var el = nodes[i];
    var permKey = String(el.getAttribute('data-rf-permission') || '').trim();
    if (permKey) {
      var allowByPage = pageAccess && pageAccess.permissions ? pageAccess.permissions[permKey] === true : false;
      if (!allowByPage) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        if ('disabled' in el) el.disabled = true;
        continue;
      }
    }
    var controlKey = String(el.getAttribute('data-rf-control') || el.getAttribute('data-rf-field') || '').trim();
    if (!controlKey) continue;
    var controlAccess = await resolveControlAccess(pageKey, controlKey, Object.assign({}, options || {}, { pageAccess: pageAccess }));
    if (controlAccess.can_view !== true) {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    } else if (('disabled' in el) && (controlAccess.can_use !== true || (el.matches('input,select,textarea') && controlAccess.can_edit !== true))) {
      el.disabled = true;
    }
    if (el.matches('input,select,textarea') && controlAccess.can_edit !== true) {
      el.setAttribute('readonly', 'readonly');
    }
  }
  return pageAccess;
}

  async function loadUserPermissionMap(client, user) {
    if (!client || !user) return null;
    var email = normalizeAclEmail(user.email);
    var userId = user && user.id ? String(user.id).trim() : '';
    if (!email && !userId) return null;

    function appendRows(map, rows) {
      (Array.isArray(rows) ? rows : []).forEach(function (row) {
        var key = String(row && row.page_key || '').trim();
        if (!key) return;
        map.set(key, buildPermissionEntry(row));
      });
    }

    var map = new Map();

    if (userId) {
      try {
        var byUserId = await client.from('user_page_permissions')
          .select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import')
          .eq('user_id', userId);
        if (!byUserId.error) appendRows(map, byUserId.data);
      } catch (_) {}
    }

    if (email) {
      try {
        var byEmail = await client.from('user_page_permissions')
          .select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import')
          .ilike('email', email);
        if (!byEmail.error) appendRows(map, byEmail.data);
      } catch (_) {}
    }

    return map.size ? map : null;
  }

  async function loadPagePermissionMap(client, role) {
    if (!client) return null;
    try {
      var res = await client.from('page_permissions')
        .select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import')
        .eq('role', normalizeRole(role));
      if (res.error || !Array.isArray(res.data)) return null;
      var map = new Map();
      res.data.forEach(function (row) {
        var key = String(row.page_key || '').trim();
        if (!key) return;
        map.set(key, buildPermissionEntry(row));
      });
      return map;
    } catch (_) {
      return null;
    }
  }

  function pickNewestAclDoc(rows) {
    if (!Array.isArray(rows) || !rows.length) return null;
    var sorted = rows.slice().sort(function (a, b) {
      var ta = Date.parse(a && a.updated_at || '') || 0;
      var tb = Date.parse(b && b.updated_at || '') || 0;
      return tb - ta;
    });
    for (var i = 0; i < sorted.length; i += 1) {
      var row = sorted[i] || {};
      if (row.content && typeof row.content === 'object') return row.content;
      if (row.data && typeof row.data === 'object') return row.data;
    }
    return null;
  }

  async function readDashboardAclMirror(client) {
    if (!client) return null;
    try {
      var res = await client.from('rf_documents')
        .select('content,data,updated_at')
        .eq('doc_key', 'dashboard_acl_v1')
        .order('updated_at', { ascending:false })
        .limit(50);
      if (!res.error && Array.isArray(res.data) && res.data.length) {
        var picked = pickNewestAclDoc(res.data);
        if (picked && typeof picked === 'object') return picked;
      }
    } catch (_) {}
    return null;
  }

  function mirrorHasAnyUserAcl(mirror) {
    if (!mirror || typeof mirror !== 'object') return false;
    var roots = ['user_permissions', 'user_grants'];
    for (var i = 0; i < roots.length; i += 1) {
      var root = mirror[roots[i]];
      if (!root || typeof root !== 'object') continue;
      var emails = Object.keys(root);
      for (var j = 0; j < emails.length; j += 1) {
        var emailKey = emails[j];
        var entry = root[emailKey];
        if (entry && typeof entry === 'object' && Object.keys(entry).length) {
          return true;
        }
      }
    }
    return false;
  }

  function mirrorHasUserAclForEmail(mirror, email) {
    if (!mirror || typeof mirror !== 'object' || !email) return false;
    var normalized = normalizeAclEmail(email);
    if (!normalized) return false;
    var userPermissionsRoot = mirror.user_permissions && typeof mirror.user_permissions === 'object' ? mirror.user_permissions : null;
    var userGrantsRoot = mirror.user_grants && typeof mirror.user_grants === 'object' ? mirror.user_grants : null;
    var userPermissions = userPermissionsRoot && userPermissionsRoot[normalized] && typeof userPermissionsRoot[normalized] === 'object' ? userPermissionsRoot[normalized] : null;
    var userGrants = userGrantsRoot && userGrantsRoot[normalized] && typeof userGrantsRoot[normalized] === 'object' ? userGrantsRoot[normalized] : null;
    return !!((userPermissions && Object.keys(userPermissions).length) || (userGrants && Object.keys(userGrants).length));
  }

  function collectStrictUserAclDecisions(opts) {
    var decisions = [];
    var pageKey = String(opts && opts.pageKey || '').trim();
    var href = normalizeHref(opts && opts.href);
    var email = normalizeAclEmail(opts && opts.email);
    var userMap = opts && opts.userPermissionMap instanceof Map ? opts.userPermissionMap : null;
    var mirror = opts && opts.mirror && typeof opts.mirror === 'object' ? opts.mirror : null;

    if (userMap && pageKey && userMap.has(pageKey)) {
      decisions.push(userMap.get(pageKey));
    }

    if (mirror && email) {
      var userPermissionsRoot = mirror.user_permissions && typeof mirror.user_permissions === 'object' ? mirror.user_permissions : null;
      var userPermissions = userPermissionsRoot && userPermissionsRoot[email] && typeof userPermissionsRoot[email] === 'object' ? userPermissionsRoot[email] : null;
      if (userPermissions) {
        if (pageKey && Object.prototype.hasOwnProperty.call(userPermissions, pageKey)) {
          decisions.push(permissionValueToEntry(userPermissions[pageKey]));
        }
        if (href && Object.prototype.hasOwnProperty.call(userPermissions, href)) {
          decisions.push(permissionValueToEntry(userPermissions[href]));
        }
      }

      var userGrantsRoot = mirror.user_grants && typeof mirror.user_grants === 'object' ? mirror.user_grants : null;
      var userGrants = userGrantsRoot && userGrantsRoot[email] && typeof userGrantsRoot[email] === 'object' ? userGrantsRoot[email] : null;
      if (userGrants) {
        if (pageKey && Object.prototype.hasOwnProperty.call(userGrants, pageKey)) {
          decisions.push(permissionValueToEntry(userGrants[pageKey]));
        }
        if (href && Object.prototype.hasOwnProperty.call(userGrants, href)) {
          decisions.push(permissionValueToEntry(userGrants[href]));
        }
      }
    }

    return decisions;
  }

  function permissionValueToEntry(value) {
    if (value && typeof value === 'object') {
      return buildPermissionEntry(value);
    }
    return {
      can_view: value === true,
      can_add: false,
      can_edit: false,
      can_delete: false,
      can_export: false,
      can_import: false
    };
  }

  function defaultPageAccessFromRole(role, pageKey) {
    var cleanRole = normalizeRole(role);
    var isLogin = String(pageKey || '').trim() === 'login';
    if (cleanRole === 'admin') {
      return { can_view:true, can_add:true, can_edit:true, can_delete:true, can_export:true, can_import:true };
    }
    if (cleanRole === 'editor') {
      return { can_view:true, can_add:!isLogin, can_edit:!isLogin, can_delete:false, can_export:true, can_import:!isLogin };
    }
    if (cleanRole === 'operator') {
      return { can_view:true, can_add:!isLogin, can_edit:false, can_delete:false, can_export:true, can_import:false };
    }
    return { can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false };
  }

  function collectAclDecisions(opts) {
    var decisions = [];
    var pageKey = String(opts.pageKey || '').trim();
    var href = normalizeHref(opts.href);
    var role = normalizeRole(opts.role);
    var email = normalizeAclEmail(opts.email);
    var userMap = opts.userPermissionMap instanceof Map ? opts.userPermissionMap : null;
    var roleMap = opts.permissionMap instanceof Map ? opts.permissionMap : null;
    var mirror = opts.mirror && typeof opts.mirror === 'object' ? opts.mirror : null;

    if (userMap && pageKey && userMap.has(pageKey)) {
      decisions.push(userMap.get(pageKey));
    }

    if (mirror) {
      var userPermissionsRoot = mirror.user_permissions && typeof mirror.user_permissions === 'object' ? mirror.user_permissions : null;
      var userPermissions = userPermissionsRoot && email && userPermissionsRoot[email] && typeof userPermissionsRoot[email] === 'object' ? userPermissionsRoot[email] : null;
      if (userPermissions && pageKey && Object.prototype.hasOwnProperty.call(userPermissions, pageKey)) {
        decisions.push(permissionValueToEntry(userPermissions[pageKey]));
      }

      var userGrantsRoot = mirror.user_grants && typeof mirror.user_grants === 'object' ? mirror.user_grants : null;
      var userGrants = userGrantsRoot && email && userGrantsRoot[email] && typeof userGrantsRoot[email] === 'object' ? userGrantsRoot[email] : null;
      if (userGrants) {
        if (pageKey && Object.prototype.hasOwnProperty.call(userGrants, pageKey)) {
          decisions.push(permissionValueToEntry(userGrants[pageKey]));
        }
        if (href && Object.prototype.hasOwnProperty.call(userGrants, href)) {
          decisions.push(permissionValueToEntry(userGrants[href]));
        }
      }
    }

    if (roleMap && pageKey && roleMap.has(pageKey)) {
      decisions.push(roleMap.get(pageKey));
    }

    if (mirror) {
      var pagePermissions = mirror.page_permissions && typeof mirror.page_permissions === 'object' ? mirror.page_permissions : null;
      var rolePermissions = pagePermissions && pagePermissions[role] && typeof pagePermissions[role] === 'object' ? pagePermissions[role] : null;
      if (rolePermissions && pageKey && Object.prototype.hasOwnProperty.call(rolePermissions, pageKey)) {
        decisions.push(permissionValueToEntry(rolePermissions[pageKey]));
      }

      var grants = mirror.grants && typeof mirror.grants === 'object' ? mirror.grants : null;
      var roleGrants = grants && grants[role] && typeof grants[role] === 'object' ? grants[role] : null;
      if (roleGrants) {
        if (pageKey && Object.prototype.hasOwnProperty.call(roleGrants, pageKey)) {
          decisions.push(permissionValueToEntry(roleGrants[pageKey]));
        }
        if (href && Object.prototype.hasOwnProperty.call(roleGrants, href)) {
          decisions.push(permissionValueToEntry(roleGrants[href]));
        }
      }
    }

    return decisions;
  }

  function mergePermissions(base, incoming) {
    var result = Object.assign({}, base || {});
    var next = incoming && typeof incoming === 'object' ? incoming : {};
    ['can_view','can_add','can_edit','can_delete','can_export','can_import'].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        result[key] = next[key] === true;
      }
    });
    return result;
  }



  async function loadUserAccountStatus(client, user) {
    if (!client || !user) return null;
    var email = normalizeAclEmail(user.email);
    var userId = user && user.id ? String(user.id).trim() : '';
    function normalizeRow(row) {
      if (!row || typeof row !== 'object') return null;
      return {
        is_active: row.is_active !== false,
        is_banned: row.is_banned === true,
        note: String(row.note || '').trim(),
        email: normalizeAclEmail(row.email || email),
        user_id: String(row.user_id || userId || '').trim()
      };
    }
    try {
      if (userId) {
        var byUserId = await client.from('user_account_access').select('user_id,email,is_active,is_banned,note').eq('user_id', userId).maybeSingle();
        if (!byUserId.error && byUserId.data) return normalizeRow(byUserId.data);
      }
    } catch (_) {}
    try {
      if (email) {
        var byEmail = await client.from('user_account_access').select('user_id,email,is_active,is_banned,note').ilike('email', email).maybeSingle();
        if (!byEmail.error && byEmail.data) return normalizeRow(byEmail.data);
      }
    } catch (_) {}
    return null;
  }

  async function resolvePageAccess(pageKey, options) {
    var key = String(pageKey || '').trim();
    var href = pageKeyToHref(key);
    var client = options && options.client ? options.client : createRfSupabaseClient();
    var user = options && options.user ? options.user : null;

    if (key === 'login') {
      return { allowed:true, role:'viewer', source:'login open', permissions:defaultPageAccessFromRole('viewer', key) };
    }

    if (!user) {
      try {
        var sessionRes = await client.auth.getSession();
        user = sessionRes && sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
      } catch (_) {
        user = null;
      }
    }

    if (!user) {
      if (key === 'index') {
        return { allowed:true, role:'viewer', source:'guest index', permissions:{ can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false } };
      }
      return { allowed:false, role:'viewer', source:'no session', message:'Autentifică-te pentru a intra în această foaie.', permissions:{ can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false } };
    }

    var resolved = await resolveRole(client, user);
    var role = normalizeRole((options && options.role) || resolved.role);
    var accountStatus = await loadUserAccountStatus(client, user);
    if (accountStatus && (accountStatus.is_banned === true || accountStatus.is_active === false)) {
      return {
        allowed:false,
        role:role,
        source:'account blocked',
        message: accountStatus.note || 'Cont blocat.',
        permissions:{ can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false },
        email: normalizeAclEmail(user.email),
        accountStatus: accountStatus
      };
    }

    if (role === 'admin') {
      return { allowed:true, role:role, source:'admin', permissions:defaultPageAccessFromRole(role, key), email: normalizeAclEmail(user.email), accountStatus: accountStatus };
    }

    var email = normalizeAclEmail(user.email);
    var userPermissionMap = await loadUserPermissionMap(client, user);
    var mirror = await readDashboardAclMirror(client);
    var hasUserAcl = !!((userPermissionMap && userPermissionMap.size) || mirrorHasUserAclForEmail(mirror, email));

    if (key === 'index') {
      return {
        allowed:true,
        role:role,
        source: hasUserAcl ? 'user acl strict index' : 'index by role',
        permissions: { can_view:true, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false },
        email: email,
        accountStatus: accountStatus,
        strictUserAcl: hasUserAcl
      };
    }

    if (hasUserAcl) {
      var userPermissions = { can_view:false, can_add:false, can_edit:false, can_delete:false, can_export:false, can_import:false };
      var strictDecisions = collectStrictUserAclDecisions({ pageKey:key, href:href, email:email, userPermissionMap:userPermissionMap, mirror:mirror });
      for (var s = 0; s < strictDecisions.length; s += 1) {
        userPermissions = mergePermissions(userPermissions, permissionValueToEntry(strictDecisions[s]));
      }
      return {
        allowed: userPermissions.can_view === true,
        role: role,
        source: 'user acl strict',
        message: userPermissions.can_view === true ? '' : 'Nu ai acces în această foaie. Cere acces de la admin.',
        permissions: userPermissions,
        email: email,
        accountStatus: accountStatus,
        strictUserAcl: true
      };
    }

    var permissionMap = await loadPagePermissionMap(client, role);
    var roleDecisions = collectAclDecisions({ pageKey:key, href:href, role:role, email:email, userPermissionMap:null, permissionMap:permissionMap, mirror:mirror });

    var rolePermissions = defaultPageAccessFromRole(role, key);
    var roleExplicitTrue = false;
    var roleExplicitFalse = false;
    roleDecisions.forEach(function (entry) {
      var permissionEntry = permissionValueToEntry(entry);
      rolePermissions = mergePermissions(rolePermissions, permissionEntry);
      if (permissionEntry.can_view === true) roleExplicitTrue = true;
      if (permissionEntry.can_view === false) roleExplicitFalse = true;
    });

    var allowed = rolePermissions.can_view !== false;
    if (roleExplicitFalse) allowed = false;
    else if (roleExplicitTrue) allowed = true;

    return {
      allowed: allowed,
      role: role,
      source: roleExplicitFalse ? 'role acl explicit false' : (roleExplicitTrue ? 'role acl explicit true' : 'role fallback'),
      message: allowed ? '' : 'Nu ai acces în această foaie. Cere acces de la admin.',
      permissions: rolePermissions,
      email: email,
      accountStatus: accountStatus,
      strictUserAcl: false
    };
  }

  async function canViewPage(pageKey, options) {
    var result = await resolvePageAccess(pageKey, options);
    return {
      allowed: result.allowed,
      role: result.role,
      source: result.source,
      message: result.message,
      permissions: result.permissions,
      email: result.email
    };
  }

  window.RF_CONFIG = CONFIG;
  window.ERP_FORJA_CONFIG = window.ERP_FORJA_CONFIG || {};
  window.ERP_FORJA_CONFIG.SUPABASE_URL = CONFIG.SUPABASE_URL;
  window.ERP_FORJA_CONFIG.SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  window.ERP_FORJA_CONFIG.ADMIN_EMAIL = CONFIG.ADMIN_EMAIL;
  window.__ERP_FORJA_CONFIG__ = window.ERP_FORJA_CONFIG;
  window.RF_SUPABASE_URL = CONFIG.SUPABASE_URL;
  window.RF_SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  window.RF_ADMIN_EMAIL = CONFIG.ADMIN_EMAIL;
  window.RF_PAGES = clonePages();
  window.RF_THEME = window.RF_THEME || {};
  window.RF_THEME.storageKey = THEME_STORAGE_KEY;
  window.RF_THEME.defaultKey = DEFAULT_THEME_KEY;
  window.RF_THEME.list = getThemeList;
  window.RF_THEME.getThemeKey = getStoredThemeKey;
  window.RF_THEME.getPaletteKey = getStoredThemeKey;
  window.RF_THEME.getPalette = getThemePalette;
  window.RF_THEME.apply = applyThemeKey;
  window.RF_THEME.setThemeKey = setThemeKey;
  window.RF_THEME.setPalette = setThemeKey;
  window.RF_THEME.getMode = getStoredThemeMode;
  window.RF_THEME.setMode = function () { return setThemeKey(getStoredThemeKey()); };
  window.RF_THEME.toggle = toggleThemeMode;
  window.getRfSupabaseConfig = window.getRfSupabaseConfig || function () {
    return { url: CONFIG.SUPABASE_URL, anonKey: CONFIG.SUPABASE_ANON_KEY, auth: getAuthOptions() };
  };
  window.createRfSupabaseClient = window.createRfSupabaseClient || createRfSupabaseClient;
  window.RF_ACL = window.RF_ACL || {};
  window.RF_ACL.PAGE_LIST = clonePages();
  window.RF_ACL.PAGE_MAP = PAGE_MAP;
  window.RF_ACL.CONTROL_CATALOG = { common: cloneControlEntries(COMMON_CONTROL_CATALOG), overrides: PAGE_CONTROL_OVERRIDES };
  window.RF_ACL.getControlCatalogForPage = getControlCatalogForPage;
  window.RF_ACL.safeLower = safeLower;
  window.RF_ACL.normalizeRole = normalizeRole;
  window.RF_ACL.normalizeHref = normalizeHref;
  window.RF_ACL.pageKeyToHref = pageKeyToHref;
  window.RF_ACL.inferPageKey = inferPageKey;
  window.RF_ACL.resolveRole = resolveRole;
  window.RF_ACL.loadUserPermissionMap = loadUserPermissionMap;
  window.RF_ACL.loadPagePermissionMap = loadPagePermissionMap;
  window.RF_ACL.loadUserControlPermissionMap = loadUserControlPermissionMap;
  window.RF_ACL.loadRoleFieldPermissionMap = loadRoleFieldPermissionMap;
  window.RF_ACL.resolveControlAccess = resolveControlAccess;
  window.RF_ACL.canUseControl = canUseControl;
  window.RF_ACL.applyDomPermissions = applyDomPermissions;
  window.RF_ACL.readDashboardAclMirror = readDashboardAclMirror;
  window.RF_ACL.collectAclDecisions = collectAclDecisions;
  window.RF_ACL.defaultPageAccessFromRole = defaultPageAccessFromRole;
  window.RF_ACL.resolvePageAccess = resolvePageAccess;
  window.RF_ACL.canViewPage = canViewPage;

  if (!window.__RF_AUTO_ACL_GUARD__) {
    window.__RF_AUTO_ACL_GUARD__ = true;
    Promise.resolve().then(async function () {
      var pageKey = INITIAL_PAGE_KEY || inferPageKey(window.location.pathname);
      try {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
          setAclPendingState(false);
          return;
        }
        if (!pageKey || pageKey === 'index' || pageKey === 'login') {
          setAclPendingState(false);
          return;
        }
        var client = createRfSupabaseClient();
        var result = await canViewPage(pageKey, { client: client });
        if (result.allowed) {
          setAclPendingState(false);
          return;
        }
        try { sessionStorage.setItem('rf_acl_denied_message', result.message || 'Nu ai acces în această foaie.'); } catch (_) {}
        renderAccessDeniedPage(pageKey, result.message || 'Nu ai acces în această pagină. Doar adminul are acces sau trebuie să primești permisiune.');
      } catch (_) {
        setAclPendingState(false);
      }
    });
  }
})(window);

/* --- RF fire / spark palettes extension --- */
(function (window) {
  'use strict';

  if (!window || !window.RF_THEME) return;

  var themeApi = window.RF_THEME;
  var storageKey = themeApi.storageKey || 'rf_theme_palette';
  var defaultKey = themeApi.defaultKey || 'blue';

  var originalList = typeof themeApi.list === 'function' ? themeApi.list.bind(themeApi) : function () { return []; };
  var originalGetPalette = typeof themeApi.getPalette === 'function' ? themeApi.getPalette.bind(themeApi) : function () { return null; };
  var originalApply = typeof themeApi.apply === 'function' ? themeApi.apply.bind(themeApi) : function (key) { return key; };

  function clone(obj) {
    var out = {};
    Object.keys(obj || {}).forEach(function (key) { out[key] = obj[key]; });
    return out;
  }

  function merge(base, extra) {
    var out = clone(base || {});
    Object.keys(extra || {}).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }

  var amberBase = originalGetPalette('amber') || originalGetPalette('blue') || {};
  var blueBase = originalGetPalette('blue') || amberBase || {};
  var graphiteBase = originalGetPalette('graphite') || originalGetPalette('slate') || blueBase || {};
  var petrolBase = originalGetPalette('petrol') || originalGetPalette('teal') || blueBase || {};

  var CUSTOM_THEMES = Object.freeze({
    'foc-soft': Object.freeze(merge(amberBase, {
      key: 'foc-soft',
      label: 'Foc Soft',
      previewA: '#ff9c57',
      previewB: '#7b5a4b',
      bodyBackground: 'radial-gradient(circle at 12% 100%, rgba(255,132,53,.40) 0 9%, rgba(255,132,53,0) 19%), radial-gradient(circle at 24% 100%, rgba(255,188,94,.34) 0 8%, rgba(255,188,94,0) 17%), radial-gradient(circle at 78% 100%, rgba(255,118,54,.28) 0 8%, rgba(255,118,54,0) 17%), radial-gradient(circle at 90% 100%, rgba(255,195,115,.26) 0 7%, rgba(255,195,115,0) 15%), radial-gradient(circle at 18% 12%, rgba(255,227,162,.20) 0 .55%, rgba(255,227,162,0) .9%), radial-gradient(circle at 37% 18%, rgba(255,189,103,.18) 0 .42%, rgba(255,189,103,0) .72%), radial-gradient(circle at 63% 14%, rgba(255,211,140,.18) 0 .48%, rgba(255,211,140,0) .8%), radial-gradient(circle at 81% 20%, rgba(255,177,83,.16) 0 .42%, rgba(255,177,83,0) .75%), radial-gradient(circle at top left, rgba(255,255,255,.56), transparent 30%), linear-gradient(180deg,#e8dacf 0%, #d5c4b6 52%, #c8b6a7 100%)',
      bgSolid: '#d5c4b6',
      card: 'rgba(233,223,214,.78)',
      panel: 'rgba(233,223,214,.78)',
      panel2: 'rgba(241,233,225,.86)',
      hdr: 'rgba(232,219,209,.90)',
      header: 'rgba(229,214,202,.92)',
      subheader: 'rgba(223,203,188,.94)',
      head: 'rgba(225,206,192,.94)',
      head2: 'rgba(219,198,182,.92)',
      sticky: 'rgba(243,233,224,.96)',
      grid: 'rgba(104,70,33,.22)',
      line: 'rgba(70,48,29,.74)',
      lineSoft: 'rgba(95,68,42,.16)',
      lineStrong: 'rgba(95,68,42,.28)',
      text: '#24180f',
      muted: '#6e5748',
      input: 'rgba(245,236,228,.95)',
      btn: '#cc7840',
      btn2: '#b45f2f',
      btnHover: '#9d5126',
      focus: '#c0632b',
      shadow: '0 20px 48px rgba(103,62,35,.18)',
      rowHover: 'rgba(214,117,53,.16)',
      rowSelected: 'rgba(214,117,53,.26)',
      selected: 'rgba(214,117,53,.18)',
      selectedBorder: 'rgba(160,84,40,.46)',
      panelBorder: 'rgba(112,72,40,.20)',
      blue: '#cc7840',
      blueDark: '#9d5126',
      chip: 'rgba(214,117,53,.14)',
      pill: 'rgba(214,117,53,.16)',
      orange: '#dd7b2f',
      warn: '#9d5b0e',
      warning: '#9d5b0e',
      statusText: '#9d5b0e'
    })),
    'jara-soft': Object.freeze(merge(graphiteBase, {
      key: 'jara-soft',
      label: 'Jară Soft',
      previewA: '#f39a54',
      previewB: '#58565f',
      bodyBackground: 'radial-gradient(circle at 10% 100%, rgba(247,138,60,.34) 0 8%, rgba(247,138,60,0) 16%), radial-gradient(circle at 26% 100%, rgba(255,185,103,.24) 0 7%, rgba(255,185,103,0) 15%), radial-gradient(circle at 82% 100%, rgba(239,101,39,.22) 0 8%, rgba(239,101,39,0) 16%), radial-gradient(circle at 91% 18%, rgba(255,202,126,.14) 0 .45%, rgba(255,202,126,0) .8%), radial-gradient(circle at 72% 10%, rgba(255,180,83,.12) 0 .38%, rgba(255,180,83,0) .72%), radial-gradient(circle at top left, rgba(255,255,255,.42), transparent 28%), linear-gradient(180deg,#d8d5d9 0%, #bdb8bf 54%, #b0a9b0 100%)',
      bgSolid: '#bdb8bf',
      card: 'rgba(222,219,224,.76)',
      panel: 'rgba(222,219,224,.76)',
      panel2: 'rgba(232,229,234,.84)',
      hdr: 'rgba(220,216,222,.90)',
      header: 'rgba(214,209,216,.92)',
      subheader: 'rgba(203,196,206,.94)',
      head: 'rgba(205,198,208,.94)',
      head2: 'rgba(193,185,197,.92)',
      sticky: 'rgba(234,230,235,.96)',
      grid: 'rgba(71,63,70,.22)',
      line: 'rgba(58,52,61,.74)',
      lineSoft: 'rgba(71,63,70,.16)',
      lineStrong: 'rgba(71,63,70,.28)',
      text: '#171519',
      muted: '#57515b',
      input: 'rgba(240,237,241,.95)',
      btn: '#d07b40',
      btn2: '#ad6333',
      btnHover: '#945128',
      focus: '#b8652f',
      shadow: '0 20px 48px rgba(65,58,69,.16)',
      rowHover: 'rgba(208,123,64,.15)',
      rowSelected: 'rgba(208,123,64,.24)',
      selected: 'rgba(208,123,64,.17)',
      selectedBorder: 'rgba(150,81,40,.46)',
      panelBorder: 'rgba(71,63,70,.18)',
      blue: '#d07b40',
      blueDark: '#945128',
      chip: 'rgba(208,123,64,.13)',
      pill: 'rgba(208,123,64,.15)',
      orange: '#df7b2b',
      warn: '#96550d',
      warning: '#96550d',
      statusText: '#96550d'
    })),
    'otel-foc': Object.freeze(merge(petrolBase, {
      key: 'otel-foc',
      label: 'Oțel + Scântei',
      previewA: '#6f94a9',
      previewB: '#ff9850',
      bodyBackground: 'radial-gradient(circle at 14% 100%, rgba(255,130,66,.28) 0 7%, rgba(255,130,66,0) 15%), radial-gradient(circle at 84% 100%, rgba(255,170,90,.20) 0 7%, rgba(255,170,90,0) 14%), radial-gradient(circle at 21% 15%, rgba(255,222,145,.16) 0 .55%, rgba(255,222,145,0) .9%), radial-gradient(circle at 41% 9%, rgba(255,182,100,.14) 0 .42%, rgba(255,182,100,0) .75%), radial-gradient(circle at 59% 17%, rgba(255,214,140,.16) 0 .45%, rgba(255,214,140,0) .78%), radial-gradient(circle at 78% 11%, rgba(255,174,87,.14) 0 .42%, rgba(255,174,87,0) .72%), radial-gradient(circle at top left, rgba(255,255,255,.46), transparent 30%), linear-gradient(180deg,#d5e0e4 0%, #bfced4 52%, #b2c3c9 100%)',
      bgSolid: '#bfced4',
      card: 'rgba(222,231,234,.78)',
      panel: 'rgba(222,231,234,.78)',
      panel2: 'rgba(232,239,241,.86)',
      hdr: 'rgba(219,229,232,.90)',
      header: 'rgba(213,224,228,.92)',
      subheader: 'rgba(201,216,221,.94)',
      head: 'rgba(204,218,223,.94)',
      head2: 'rgba(191,208,214,.92)',
      sticky: 'rgba(233,240,242,.96)',
      grid: 'rgba(49,79,91,.22)',
      line: 'rgba(36,59,70,.74)',
      lineSoft: 'rgba(49,79,91,.16)',
      lineStrong: 'rgba(49,79,91,.28)',
      text: '#102028',
      muted: '#4e6670',
      input: 'rgba(237,243,244,.95)',
      btn: '#6b8fa2',
      btn2: '#577685',
      btnHover: '#46616d',
      focus: '#58798c',
      shadow: '0 20px 48px rgba(46,75,88,.16)',
      rowHover: 'rgba(107,143,162,.16)',
      rowSelected: 'rgba(107,143,162,.24)',
      selected: 'rgba(107,143,162,.18)',
      selectedBorder: 'rgba(69,99,114,.46)',
      panelBorder: 'rgba(49,79,91,.18)',
      blue: '#6b8fa2',
      blueDark: '#46616d',
      chip: 'rgba(107,143,162,.14)',
      pill: 'rgba(107,143,162,.16)',
      orange: '#e08335',
      warn: '#9c5811',
      warning: '#9c5811',
      statusText: '#9c5811'
    }))
  });

  var customKeys = Object.keys(CUSTOM_THEMES);
  var baseList = originalList();
  var baseKeys = baseList.map(function (item) { return item.key; });
  var allKeys = baseKeys.concat(customKeys);

  function normalizeThemeKey(value) {
    var key = String(value || '').trim().toLowerCase();
    return allKeys.indexOf(key) !== -1 ? key : defaultKey;
  }

  function getStoredThemeKey() {
    try {
      return normalizeThemeKey(window.localStorage.getItem(storageKey));
    } catch (_) {
      return defaultKey;
    }
  }

  function buildPaletteCss(key, palette) {
    return [
      'html[data-rf-theme="' + key + '"]{',
      '  color-scheme:light;',
      '  --bg:' + palette.bgSolid + ';',
      '  --card:' + palette.card + ';',
      '  --panel:' + palette.panel + ';',
      '  --panel-2:' + palette.panel2 + ';',
      '  --panel2:' + palette.panel2 + ';',
      '  --hdr:' + palette.hdr + ';',
      '  --header:' + palette.header + ';',
      '  --subheader:' + palette.subheader + ';',
      '  --head:' + palette.head + ';',
      '  --head-2:' + palette.head2 + ';',
      '  --head2:' + palette.head2 + ';',
      '  --cell:' + palette.cell + ';',
      '  --sticky:' + palette.sticky + ';',
      '  --grid:' + palette.grid + ';',
      '  --line:' + palette.line + ';',
      '  --line-soft:' + palette.lineSoft + ';',
      '  --line-strong:' + palette.lineStrong + ';',
      '  --text:' + palette.text + ';',
      '  --muted:' + palette.muted + ';',
      '  --input:' + palette.input + ';',
      '  --white:' + palette.white + ';',
      '  --btn:' + palette.btn + ';',
      '  --btn2:' + palette.btn2 + ';',
      '  --btn-hover:' + palette.btnHover + ';',
      '  --btn-soft:' + palette.btnSoft + ';',
      '  --focus:' + palette.focus + ';',
      '  --status-bg:' + palette.statusBg + ';',
      '  --status-text:' + palette.statusText + ';',
      '  --shadow:' + palette.shadow + ';',
      '  --row-hover:' + palette.rowHover + ';',
      '  --row-selected:' + palette.rowSelected + ';',
      '  --selected:' + palette.selected + ';',
      '  --selected-border:' + palette.selectedBorder + ';',
      '  --panel-border:' + palette.panelBorder + ';',
      '  --blue:' + palette.blue + ';',
      '  --blue-dark:' + palette.blueDark + ';',
      '  --green:' + palette.green + ';',
      '  --yellow:' + palette.yellow + ';',
      '  --red:' + palette.red + ';',
      '  --danger:' + palette.danger + ';',
      '  --ok:' + palette.ok + ';',
      '  --warn:' + palette.warn + ';',
      '  --success:' + palette.success + ';',
      '  --warning:' + palette.warning + ';',
      '  --bad:' + palette.bad + ';',
      '  --orange:' + palette.orange + ';',
      '  --chip:' + palette.chip + ';',
      '  --pill:' + palette.pill + ';',
      '}',
      'html[data-rf-theme="' + key + '"] body{',
      '  background:' + palette.bodyBackground + ' !important;',
      '  color:var(--text) !important;',
      '}'
    ].join('\n');
  }

  function ensureCustomThemeStyle() {
    var style = document.getElementById('rf-fire-theme-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'rf-fire-theme-style';
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = customKeys.map(function (key) {
      return buildPaletteCss(key, CUSTOM_THEMES[key]);
    }).join('\n\n');
  }

  function getPalette(key) {
    var normalized = normalizeThemeKey(key);
    if (CUSTOM_THEMES[normalized]) return CUSTOM_THEMES[normalized];
    return originalGetPalette(normalized);
  }

  function applyTheme(key) {
    var normalized = normalizeThemeKey(key);
    if (CUSTOM_THEMES[normalized]) {
      try { ensureCustomThemeStyle(); } catch (_) {}
      try { document.documentElement.setAttribute('data-rf-theme', normalized); } catch (_) {}
      return normalized;
    }
    return originalApply(normalized);
  }

  function setThemeKey(key) {
    var normalized = applyTheme(key);
    try { window.localStorage.setItem(storageKey, normalized); } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent('rf-theme-change', {
        detail: { themeKey: normalized, palette: getPalette(normalized) }
      }));
    } catch (_) {}
    return normalized;
  }

  function listThemes() {
    return baseList.concat(customKeys.map(function (key) {
      var palette = CUSTOM_THEMES[key];
      return Object.freeze({
        key: key,
        label: palette.label,
        previewA: palette.previewA,
        previewB: palette.previewB
      });
    }));
  }

  function toggleThemeMode() {
    var current = getStoredThemeKey();
    var index = allKeys.indexOf(current);
    var nextKey = allKeys[(index + 1) % allKeys.length] || defaultKey;
    return setThemeKey(nextKey);
  }

  themeApi.list = listThemes;
  themeApi.getThemeKey = getStoredThemeKey;
  themeApi.getPaletteKey = getStoredThemeKey;
  themeApi.getPalette = getPalette;
  themeApi.apply = applyTheme;
  themeApi.setThemeKey = setThemeKey;
  themeApi.setPalette = setThemeKey;
  themeApi.toggle = toggleThemeMode;

  try { ensureCustomThemeStyle(); } catch (_) {}
  applyTheme(getStoredThemeKey());

  window.addEventListener('storage', function (event) {
    if (!event || event.key !== storageKey) return;
    applyTheme(event.newValue);
  });
})(window);


/* --- RF animated fire / spark overlay extension --- */
(function (window) {
  'use strict';

  if (!window || !window.document) return;

  function ensureStyle() {
    var style = document.getElementById('rf-fire-anim-style');
    if (style) return style;

    style = document.createElement('style');
    style.id = 'rf-fire-anim-style';
    style.textContent = [
      'html[data-rf-theme="foc-soft"]{--rf-fire-core:rgba(255,148,79,.56);--rf-fire-warm:rgba(255,204,121,.42);--rf-fire-edge:rgba(232,92,32,.24);--rf-spark-a:rgba(255,230,175,.56);--rf-spark-b:rgba(255,183,91,.42);}',
      'html[data-rf-theme="jara-soft"]{--rf-fire-core:rgba(244,141,69,.46);--rf-fire-warm:rgba(255,194,116,.34);--rf-fire-edge:rgba(219,86,26,.18);--rf-spark-a:rgba(255,223,164,.42);--rf-spark-b:rgba(255,170,80,.30);}',
      'html[data-rf-theme="otel-foc"]{--rf-fire-core:rgba(255,139,70,.34);--rf-fire-warm:rgba(255,198,116,.26);--rf-fire-edge:rgba(228,96,34,.14);--rf-spark-a:rgba(255,226,170,.36);--rf-spark-b:rgba(255,174,85,.24);}',
      '',
      '@keyframes rfFireBreath{',
      '  0%{transform:translate3d(0,0,0) scale(1);opacity:.26;}',
      '  50%{transform:translate3d(0,-1.25vh,0) scale(1.03,1.06);opacity:.38;}',
      '  100%{transform:translate3d(0,.35vh,0) scale(.99,1.02);opacity:.30;}',
      '}',
      '@keyframes rfSparkDrift{',
      '  0%{transform:translate3d(0,1vh,0);opacity:.04;}',
      '  15%{opacity:.16;}',
      '  55%{opacity:.22;}',
      '  100%{transform:translate3d(0,-5.5vh,0);opacity:.02;}',
      '}',
      'html[data-rf-theme="foc-soft"] body,',
      'html[data-rf-theme="jara-soft"] body,',
      'html[data-rf-theme="otel-foc"] body{',
      '  position:relative !important;',
      '  isolation:isolate;',
      '}',
      'html[data-rf-theme="foc-soft"] body::before,',
      'html[data-rf-theme="jara-soft"] body::before,',
      'html[data-rf-theme="otel-foc"] body::before{',
      '  content:"";',
      '  position:fixed;',
      '  left:-8vw;',
      '  right:-8vw;',
      '  bottom:-2vh;',
      '  height:29vh;',
      '  pointer-events:none;',
      '  z-index:-1;',
      '  opacity:.34;',
      '  filter:blur(18px) saturate(112%);',
      '  background:',
      '    radial-gradient(38% 100% at 8% 100%, var(--rf-fire-core) 0%, rgba(255,255,255,0) 67%),',
      '    radial-gradient(28% 82% at 24% 100%, var(--rf-fire-warm) 0%, rgba(255,255,255,0) 70%),',
      '    radial-gradient(34% 95% at 48% 100%, var(--rf-fire-core) 0%, rgba(255,255,255,0) 66%),',
      '    radial-gradient(26% 72% at 67% 100%, var(--rf-fire-warm) 0%, rgba(255,255,255,0) 70%),',
      '    radial-gradient(32% 92% at 87% 100%, var(--rf-fire-edge) 0%, rgba(255,255,255,0) 67%);',
      '  transform-origin:50% 100%;',
      '  animation:rfFireBreath 7.6s ease-in-out infinite;',
      '}',
      'html[data-rf-theme="foc-soft"] body::after,',
      'html[data-rf-theme="jara-soft"] body::after,',
      'html[data-rf-theme="otel-foc"] body::after{',
      '  content:"";',
      '  position:fixed;',
      '  inset:0;',
      '  pointer-events:none;',
      '  z-index:-1;',
      '  opacity:.22;',
      '  mix-blend-mode:screen;',
      '  background:',
      '    radial-gradient(circle at 12% 82%, var(--rf-spark-a) 0 1.2px, rgba(255,255,255,0) 2.3px),',
      '    radial-gradient(circle at 21% 77%, var(--rf-spark-b) 0 1.35px, rgba(255,255,255,0) 2.5px),',
      '    radial-gradient(circle at 33% 84%, var(--rf-spark-a) 0 1.1px, rgba(255,255,255,0) 2.2px),',
      '    radial-gradient(circle at 46% 79%, var(--rf-spark-b) 0 1.3px, rgba(255,255,255,0) 2.5px),',
      '    radial-gradient(circle at 58% 83%, var(--rf-spark-a) 0 1.2px, rgba(255,255,255,0) 2.4px),',
      '    radial-gradient(circle at 69% 76%, var(--rf-spark-b) 0 1.35px, rgba(255,255,255,0) 2.6px),',
      '    radial-gradient(circle at 81% 85%, var(--rf-spark-a) 0 1.15px, rgba(255,255,255,0) 2.3px),',
      '    radial-gradient(circle at 89% 78%, var(--rf-spark-b) 0 1.2px, rgba(255,255,255,0) 2.4px);',
      '  animation:rfSparkDrift 9.4s linear infinite;',
      '}',
      'html[data-rf-theme="jara-soft"] body::before{opacity:.28;filter:blur(19px) saturate(108%);}',
      'html[data-rf-theme="jara-soft"] body::after{opacity:.16;}',
      'html[data-rf-theme="otel-foc"] body::before{opacity:.20;filter:blur(20px) saturate(106%);}',
      'html[data-rf-theme="otel-foc"] body::after{opacity:.13;}',
      '@media (max-width: 768px){',
      '  html[data-rf-theme="foc-soft"] body::before,',
      '  html[data-rf-theme="jara-soft"] body::before,',
      '  html[data-rf-theme="otel-foc"] body::before{height:24vh;filter:blur(16px) saturate(108%);}',
      '}',
      '@media (prefers-reduced-motion: reduce){',
      '  html[data-rf-theme="foc-soft"] body::before,',
      '  html[data-rf-theme="jara-soft"] body::before,',
      '  html[data-rf-theme="otel-foc"] body::before,',
      '  html[data-rf-theme="foc-soft"] body::after,',
      '  html[data-rf-theme="jara-soft"] body::after,',
      '  html[data-rf-theme="otel-foc"] body::after{animation:none !important;}',
      '}',
      ''
    ].join('\n');

    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureStyle, { once: true });
  } else {
    ensureStyle();
  }
})(window);


/* --- RF ACL auto binding / every page --- */
(function (window) {
  'use strict';
  if (!window || !window.RF_ACL) return;

  var RF = window.RF_ACL;
  var originalGetCatalog = typeof RF.getControlCatalogForPage === 'function' ? RF.getControlCatalogForPage.bind(RF) : function () { return []; };
  var originalResolvePageAccess = typeof RF.resolvePageAccess === 'function' ? RF.resolvePageAccess.bind(RF) : null;
  var originalResolveControlAccess = typeof RF.resolveControlAccess === 'function' ? RF.resolveControlAccess.bind(RF) : null;

  function entry(controlKey, controlLabel, controlType) {
    return Object.freeze({
      control_key: String(controlKey || '').trim(),
      control_label: String(controlLabel || controlKey || '').trim() || String(controlKey || '').trim(),
      control_type: String(controlType || 'action').trim() || 'action'
    });
  }

  function entries(defs, defaultType) {
    return (Array.isArray(defs) ? defs : []).map(function (row) {
      if (Array.isArray(row)) return entry(row[0], row[1], row[2] || defaultType || 'action');
      return entry(row && row.control_key, row && row.control_label, row && row.control_type || defaultType || 'action');
    }).filter(function (row) { return row.control_key; });
  }

  function uniqueCatalog(list) {
    var seen = Object.create(null);
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (row) {
      var key = String(row && row.control_key || '').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(Object.freeze({
        control_key: key,
        control_label: String(row && row.control_label || key).trim() || key,
        control_type: String(row && row.control_type || 'action').trim() || 'action'
      }));
    });
    return out;
  }

  function makeCrudCatalog(fieldDefs, extraDefs) {
    return uniqueCatalog([].concat(
      entries([
        ['rows.filter','Filtrare / căutare'],
        ['rows.add','Adăugare rând'],
        ['modal.open','Deschidere formular'],
        ['rows.edit','Editare rând'],
        ['rows.delete','Ștergere rând'],
        ['data.import','Import date'],
        ['data.export','Export date'],
        ['cloud.refresh','Refresh cloud'],
        ['cloud.save','Salvare în cloud']
      ], 'action'),
      entries(fieldDefs || [], 'field'),
      entries(extraDefs || [], 'section')
    ));
  }

  var PAGE_CONTROL_MANIFESTS = Object.freeze({
    'index': Object.freeze({
      hint: 'Pe index, butoanele mari din stânga se setează sus în tabelul de pagini, pe rândurile group-*. Aici vezi doar elementele din interiorul indexului.',
      items: uniqueCatalog([].concat(
        entries([
          ['dashboard.palette','Buton Paletă'],
          ['dashboard.refresh','Buton Refresh'],
          ['auth.login','Buton Login'],
          ['auth.logout','Buton Logout']
        ], 'action'),
        entries([
          ['section.status-bar','Zona status autentificare'],
          ['section.preview-panel','Panoul din dreapta / preview']
        ], 'section')
      ))
    }),
    'login': Object.freeze({
      hint: 'Pe login controlezi doar câmpurile de autentificare și butonul de intrare. Loginul nu trebuie blocat din ACL.',
      items: uniqueCatalog([].concat(
        entries([
          ['auth.login','Buton Intrare']
        ], 'action'),
        entries([
          ['field.id','Câmp ID / email'],
          ['field.password','Câmp Parolă']
        ], 'field')
      ))
    }),
    'helper': Object.freeze({
      hint: 'Helper este pagina de navigare administrativă. Aici setezi doar butoanele reale din helper.',
      items: uniqueCatalog([].concat(
        entries([
          ['dashboard.refresh','Buton Refresh']
        ], 'action'),
        entries([
          ['section.nav-helper-data','Buton / zonă Helper Data'],
          ['section.nav-helper-acl','Buton / zonă Helper ACL'],
        ], 'section')
      ))
    }),
    'helper-data': Object.freeze({
      hint: 'Pe Helper Data apar doar câmpurile și acțiunile din foaia de date master.',
      items: makeCrudCatalog([
        ['field.reper','Câmp Reper'],
        ['field.material','Câmp Material'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.kg','Câmp KG / buc'],
        ['field.lungime','Câmp Lungime'],
        ['field.tact','Câmp Tact'],
        ['field.operator','Câmp Operator']
      ], [
        ['section.table-main','Tabel principal Helper Data']
      ])
    }),
    'numeralkod': Object.freeze({
      hint: 'Pentru Numeral KOD controlezi doar tabelele și câmpurile reale din pagină.',
      items: makeCrudCatalog([
        ['field.cod-intern','Câmp Cod intern'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.material','Câmp Material'],
        ['field.sarja','Câmp Sarjă']
      ], [
        ['section.table-main','Tabel Numeral KOD']
      ])
    }),
    'program-utilaje': Object.freeze({
      hint: 'Aici vezi doar programul utilajelor: formularul, filtrarea și tabelul.',
      items: makeCrudCatalog([
        ['field.data','Câmp Dată'],
        ['field.utilaj','Câmp Utilaj'],
        ['field.ore','Câmp Ore'],
        ['field.schimb','Câmp Schimb'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel program utilaje']
      ])
    }),
    'magnaflux-calendar': Object.freeze({
      hint: 'Calendarul Magnaflux are doar filtrele și zona calendarului / listei.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['data.export','Export date']
        ], 'action'),
        entries([
          ['field.data','Câmp Dată'],
          ['field.operator','Câmp Operator'],
          ['field.schimb','Câmp Schimb']
        ], 'field'),
        entries([
          ['section.calendar','Calendar Magnaflux'],
          ['section.table-main','Lista programări']
        ], 'section')
      ))
    }),
    'calendar-operatori': Object.freeze({
      hint: 'Calendar operatori: doar calendarul, filtrele și câmpurile reale.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['data.export','Export date']
        ], 'action'),
        entries([
          ['field.data','Câmp Dată'],
          ['field.operator','Câmp Operator'],
          ['field.schimb','Câmp Schimb']
        ], 'field'),
        entries([
          ['section.calendar','Calendar operatori'],
          ['section.table-main','Lista programări']
        ], 'section')
      ))
    }),
    'intrari-otel': Object.freeze({
      hint: 'Pe Intrări Oțel apar doar formularul de intrare, filtrele și tabelul principal.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.cod','Câmp Cod intern oțel'],
        ['field.sarja','Câmp Sarjă'],
        ['field.cantitate','Câmp Cantitate'],
        ['field.furnizor','Câmp Furnizor'],
        ['field.observatii','Câmp Observații / pretest']
      ], [
        ['section.table-main','Tabel Intrări Oțel']
      ])
    }),
    'debitate': Object.freeze({
      hint: 'Pe Debitate controlezi formularul, filtrele, tabelul principal și sumarul.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.echipament','Câmp Echipament'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.kg','Câmp KG / buc'],
        ['field.lungime','Câmp Lungime'],
        ['field.cod','Câmp Cod intern'],
        ['field.cantitate','Câmp Cantitate'],
        ['field.schimb','Câmp Schimb'],
        ['field.operator','Câmp Operator']
      ], [
        ['section.table-main','Tabel Debitate'],
        ['section.table-summary','Tabel sumar Debitate']
      ])
    }),
    'forjate': Object.freeze({
      hint: 'Pe Forjate controlezi doar câmpurile reale din formular, tabelul principal și sumarul.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.schimb','Câmp Schimb'],
        ['field.utilaj','Câmp Linie / utilaj'],
        ['field.operator','Câmp Operator'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Dimensiune oțel'],
        ['field.calitate','Câmp Calitate oțel'],
        ['field.tact','Câmp Tact'],
        ['field.planificat','Câmp Planificat'],
        ['field.realizat','Câmp Buc realizate'],
        ['field.rebut','Câmp Rebut']
      ], [
        ['section.table-main','Tabel Forjate'],
        ['section.table-summary','Tabel sumar Forjate']
      ])
    }),
    'magnaflux': Object.freeze({
      hint: 'Pe Magnaflux vezi doar formularul de control, filtrele și tabelul paginii.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.schimb','Câmp Schimb'],
        ['field.operator','Câmp Operator'],
        ['field.reper','Câmp Reper'],
        ['field.cod-defect','Selector Cod defect'],
        ['field.cauza','Câmp Cauză'],
        ['field.observatii','Câmp Observații'],
        ['field.realizat','Câmp Piese controlate'],
        ['field.acceptate','Câmp Acceptate'],
        ['field.rebut','Câmp Rebut']
      ], [
        ['section.table-main','Tabel Magnaflux']
      ])
    }),
    'probleme-raportate': Object.freeze({
      hint: 'Probleme raportate: formular, filtre, tabel principal și sumar minute pierdute.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.schimb','Câmp Schimb'],
        ['field.utilaj','Câmp Utilaj'],
        ['field.reper','Câmp Reper'],
        ['field.minute','Câmp Timp minute'],
        ['field.observatii','Câmp Observații'],
        ['field.probleme','Câmp Problemă / operațiune']
      ], [
        ['section.table-main','Tabel Probleme raportate'],
        ['section.table-summary','Tabel total minute']
      ])
    }),
    'urmarire-actiuni-progres': Object.freeze({
      hint: 'Urmărire acțiuni și progres: tabelul de acțiuni, formularul și filtrele reale.',
      items: makeCrudCatalog([
        ['field.data','Câmp Dată'],
        ['field.reper','Câmp Reper / temă'],
        ['field.probleme','Câmp Acțiune / problemă'],
        ['field.observatii','Câmp Observații'],
        ['field.operator','Câmp Responsabil']
      ], [
        ['section.table-main','Tabel acțiuni și progres']
      ])
    }),
    'imbunatatire-continua': Object.freeze({
      hint: 'Îmbunătățire continuă: doar elementele reale din tabel și formular.',
      items: makeCrudCatalog([
        ['field.data','Câmp Dată'],
        ['field.reper','Câmp Titlu / subiect'],
        ['field.observatii','Câmp Descriere'],
        ['field.operator','Câmp Responsabil']
      ], [
        ['section.table-main','Tabel îmbunătățire continuă']
      ])
    }),
    'investitii': Object.freeze({
      hint: 'Investiții: formular, filtre și tabelul de investiții.',
      items: makeCrudCatalog([
        ['field.data','Câmp Dată'],
        ['field.reper','Câmp Titlu investiție'],
        ['field.cantitate','Câmp Valoare / cantitate'],
        ['field.observatii','Câmp Observații'],
        ['field.operator','Câmp Responsabil']
      ], [
        ['section.table-main','Tabel investiții']
      ])
    }),
    'tratament-termic-rapoarte': Object.freeze({
      hint: 'Pe Rapoarte T.T vezi doar câmpurile reale din raport și butonul spre Probleme T.T.',
      items: uniqueCatalog([].concat(
        makeCrudCatalog([
          ['field.an','Câmp An'],
          ['field.luna','Câmp Lună'],
          ['field.data','Câmp Dată'],
          ['field.schimb','Câmp Schimb'],
          ['field.operator','Câmp Operator'],
          ['field.reper','Câmp Reper'],
          ['field.sarja','Câmp Sarjă'],
          ['field.cantitate','Câmp Cantitate'],
          ['field.ore','Câmp Ore'],
          ['field.opriri-neplanificate','Câmp Opriri neplanificate'],
          ['field.mentenanta','Câmp Mentenanță'],
          ['field.incalzire','Câmp Încălzire'],
          ['field.golire','Câmp Golire']
        ], [
          ['section.table-main','Tabel Rapoarte T.T']
        ]),
        entries([
          ['problems.link','Buton Probleme T.T']
        ], 'action')
      ))
    }),
    'tratament-termic-probleme': Object.freeze({
      hint: 'Pe Probleme T.T vezi doar formularul și tabelul de probleme din schimb.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data','Câmp Dată'],
        ['field.schimb','Câmp Schimb'],
        ['field.operator','Câmp Operator'],
        ['field.minute','Câmp Minute'],
        ['field.probleme','Câmp Problemă în schimb'],
        ['field.reper','Câmp Reper'],
        ['field.sarja','Câmp Sarjă'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel Probleme T.T']
      ])
    }),
    'tratament-termic-fise-tehnologice': Object.freeze({
      hint: 'Fișe tehnologice: doar PDF-ul, revizia, persoana și acțiunile pe PDF.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['pdf.open','Deschidere PDF'],
          ['pdf.upload','Încărcare PDF'],
          ['pdf.download','Export / download PDF'],
          ['pdf.delete','Ștergere PDF']
        ], 'action'),
        entries([
          ['field.reper','Câmp Reper'],
          ['field.revizie','Câmp Revizie'],
          ['field.pdf','Fișier PDF'],
          ['field.actualizat-de','Câmp Actualizat de']
        ], 'field'),
        entries([
          ['section.table-main','Tabel fișe tehnologice']
        ], 'section')
      ))
    }),
    'tratament-termic-documente': Object.freeze({
      hint: 'Rapoarte Excel / Word: denumire raport, fișier Excel/Word, persoana care actualizează și acțiunile pe document.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['doc.open','Deschidere document'],
          ['doc.upload','Încărcare document'],
          ['doc.download','Export / download document'],
          ['doc.delete','Ștergere document']
        ], 'action'),
        entries([
          ['field.titlu','Câmp Denumire raport'],
          ['field.tip-document','Câmp Tip document'],
          ['field.document','Fișier Excel / Word'],
          ['field.actualizat-de','Câmp Actualizat de'],
          ['field.observatii','Câmp Observații document']
        ], 'field'),
        entries([
          ['section.table-main','Tabel documente Excel / Word']
        ], 'section')
      ))
    }),
    'rebut': Object.freeze({
      hint: 'Rebut: elementele reale ale paginii de rebut.',
      items: makeCrudCatalog([
        ['field.data','Câmp Dată'],
        ['field.schimb','Câmp Schimb'],
        ['field.operator','Câmp Operator'],
        ['field.reper','Câmp Reper'],
        ['field.rebut','Câmp Rebut'],
        ['field.cod-defect','Selector Cod defect'],
        ['field.cauza','Câmp Cauză'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel rebut']
      ])
    }),
    'rebut-pm': Object.freeze({
      hint: 'Rebut PM: vezi doar câmpurile reale din formularul de neconformități și tabel.',
      items: makeCrudCatalog([
        ['field.data','Câmp Data înregistrării'],
        ['field.nr-reper','Câmp Nr. reper'],
        ['field.reper','Câmp Denumire reper'],
        ['field.cod-defect','Selector Cod defect'],
        ['field.loc-depistare','Câmp Loc depistare'],
        ['field.operator','Câmp Operator'],
        ['field.piese-neconforme','Câmp Piese neconforme'],
        ['field.piese-remaniabile','Câmp Piese remaniabile'],
        ['field.cauza','Câmp Cauză'],
        ['field.actiuni-corective','Câmp Acțiuni corective'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel Rebut PM']
      ])
    }),
    'rebut-pm-helper': Object.freeze({
      hint: 'Helper Rebut PM: coduri defect și liste auxiliare.',
      items: makeCrudCatalog([
        ['field.cod-defect','Câmp Cod defect'],
        ['field.reper','Câmp Reper / categorie'],
        ['field.observatii','Câmp Descriere']
      ], [
        ['section.table-main','Tabel helper rebut PM']
      ])
    }),
    'kpi': Object.freeze({
      hint: 'KPI are în principal filtrele, butoanele de export și zona de tabel / grafic.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['data.export','Export / PDF']
        ], 'action'),
        entries([
          ['field.data','Câmp Dată'],
          ['field.utilaj','Câmp Utilaj'],
          ['field.operator','Câmp Operator'],
          ['field.reper','Câmp Reper']
        ], 'field'),
        entries([
          ['section.table-main','Tabel KPI'],
          ['section.chart-main','Grafic KPI']
        ], 'section')
      ))
    }),
    'planificare-forja': Object.freeze({
      hint: 'Planificare Forjă: grila mare de planificare, selecția și totalurile.',
      items: uniqueCatalog([].concat(
        entries([
          ['rows.filter','Filtrare / căutare'],
          ['cloud.refresh','Refresh cloud'],
          ['cloud.save','Salvare în cloud'],
          ['data.export','Export date']
        ], 'action'),
        entries([
          ['field.data','Câmp Dată'],
          ['field.reper','Câmp Reper'],
          ['field.debitat','Câmp Debitat disponibil'],
          ['field.comanda','Câmp Comandă'],
          ['field.planificat','Câmp Planificat'],
          ['field.realizat','Câmp Realizat']
        ], 'field'),
        entries([
          ['section.grid-planificare','Grilă planificare'],
          ['section.sum-selectie','Suma selecției'],
          ['section.alert-livrari','Avertizări livrări']
        ], 'section')
      ))
    }),
    'comenzi-livrare': Object.freeze({
      hint: 'Comenzi livrare: tabelul, filtrele și câmpurile de livrare.',
      items: makeCrudCatalog([
        ['field.data-livrare','Câmp Data livrării'],
        ['field.client','Câmp Client'],
        ['field.reper','Câmp Reper'],
        ['field.cantitate','Câmp Cantitate'],
        ['field.transport','Câmp Transport'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel comenzi livrare']
      ])
    }),
    'livrari-zale': Object.freeze({
      hint: 'Livrări zale: tabelul centralizat de livrări, filtrele pe an/lună/reper și import-export Excel.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.data-livrare','Câmp Data livrării'],
        ['field.transport','Câmp Nr. transport'],
        ['field.reper','Câmp Reper'],
        ['field.cantitate','Câmp Cantitate']
      ], [
        ['section.table-main','Tabel livrări zale'],
        ['section.quick-links','Linkuri rapide foi zale']
      ])
    }),
    'centralizator-livrari-zale': Object.freeze({
      hint: 'Centralizator livrări zale: total anual pe reper, pivot lunar pe ani și grafice de livrări.',
      items: makeCrudCatalog([
        ['field.an','Câmp An selectat'],
        ['field.reper','Câmp Reper'],
        ['field.total','Câmp Total livrat']
      ], [
        ['section.table-annual','Tabel anual pe repere'],
        ['section.table-pivot','Tabel livrări lunare pe ani'],
        ['section.chart-monthly','Grafic livrări lunare'],
        ['section.chart-yearly','Grafic totaluri anuale']
      ])
    }),
    'stoc-ramas-teoretic': Object.freeze({
      hint: 'Stoc rămas teoretic: urmărește separat oțelul rămas, debitatele rămase, forjatele rămase și piesele teoretic posibile pe reper.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.stoc-otel','Câmp Oțel rămas'],
        ['field.stoc-debitat','Câmp Debitate rămase'],
        ['field.stoc-forjat','Câmp Forjate rămase'],
        ['field.piese-posibile','Câmp Piese posibile']
      ], [
        ['section.table-main','Tabel stoc rămas teoretic'],
        ['section.summary','Sumare stoc teoretic']
      ])
    }),
    'mrc-necesar-otel': Object.freeze({
      hint: 'MRC / Necesar Oțel: doar tabelul principal și filtrele reale.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.necesar','Câmp Necesar'],
        ['field.stoc','Câmp Stoc']
      ], [
        ['section.table-main','Tabel MRC necesar oțel']
      ])
    }),
    'mrc-comenzi-otel': Object.freeze({
      hint: 'MRC / Comenzi oțel: tabelul de comenzi, filtrarea și câmpurile de comandă.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.reper','Câmp Reper'],
        ['field.diametru','Câmp Diametru'],
        ['field.calitate','Câmp Calitate'],
        ['field.comandat','Câmp Cantitate comandată'],
        ['field.stoc','Câmp Stoc']
      ], [
        ['section.table-main','Tabel MRC comenzi oțel']
      ])
    }),
    'mrc-comenzi-saptamanale': Object.freeze({
      hint: 'MRC / Comenzi săptămânale: tabelul săptămânal și câmpurile de planificare.',
      items: makeCrudCatalog([
        ['field.an','Câmp An'],
        ['field.luna','Câmp Lună'],
        ['field.reper','Câmp Reper'],
        ['field.cantitate','Câmp Cantitate'],
        ['field.client','Câmp Client'],
        ['field.observatii','Câmp Observații']
      ], [
        ['section.table-main','Tabel MRC comenzi săptămânale']
      ])
    })
  });

  function buildPatternManifest(pageKey) {
    var key = String(pageKey || '').trim();
    if (!key) return { hint:'', items:[] };
    if (/^inventar-/.test(key)) {
      return {
        hint: 'Pagina de inventar are formularul, filtrele, tabelul principal și eventual sumarul.',
        items: makeCrudCatalog([
          ['field.an','Câmp An'],
          ['field.luna','Câmp Lună'],
          ['field.data','Câmp Dată'],
          ['field.reper','Câmp Reper'],
          ['field.diametru','Câmp Diametru'],
          ['field.calitate','Câmp Calitate'],
          ['field.sarja','Câmp Sarjă'],
          ['field.cantitate','Câmp Cantitate'],
          ['field.kg','Câmp KG'],
          ['field.observatii','Câmp Observații']
        ], [
          ['section.table-main','Tabel inventar'],
          ['section.table-summary','Tabel sumar inventar']
        ])
      };
    }
    if (/^zale-/.test(key)) {
      return {
        hint: 'Paginile Zale au tabelul principal, filtrele și câmpurile de transport / livrare.',
        items: makeCrudCatalog([
          ['field.an','Câmp An'],
          ['field.luna','Câmp Lună'],
          ['field.data-livrare','Câmp Data livrării'],
          ['field.transport','Câmp Nr. transport'],
          ['field.reper','Câmp Reper'],
          ['field.cantitate','Câmp Cantitate'],
          ['field.realizat','Câmp Forjat / realizat'],
          ['field.rebut','Câmp Rebut'],
          ['field.observatii','Câmp Observații']
        ], [
          ['section.table-main','Tabel Urmărire zale']
        ])
      };
    }
    if (/^ambalare-/.test(key)) {
      return {
        hint: 'Paginile de ambalare au tabelul principal și câmpurile de transport / cantitate.',
        items: makeCrudCatalog([
          ['field.an','Câmp An'],
          ['field.luna','Câmp Lună'],
          ['field.data','Câmp Dată'],
          ['field.transport','Câmp Nr. transport'],
          ['field.reper','Câmp Reper'],
          ['field.cantitate','Câmp Cantitate'],
          ['field.operator','Câmp Operator'],
          ['field.observatii','Câmp Observații']
        ], [
          ['section.table-main','Tabel ambalare']
        ])
      };
    }
    return { hint:'Pentru pagina selectată vezi doar elementele reale ale paginii. Dacă lipsește ceva special, îl poți adăuga ca element personalizat.', items: uniqueCatalog(originalGetCatalog(key) || []) };
  }

  function getManifestForPage(pageKey) {
    var key = String(pageKey || '').trim();
    return PAGE_CONTROL_MANIFESTS[key] || buildPatternManifest(key);
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function slugKey(value) {
    return normalizeText(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
  }

  RF.getControlCatalogForPage = function (pageKey) {
    return uniqueCatalog((getManifestForPage(pageKey) || {}).items || []);
  };

  RF.getControlManifestInfo = function (pageKey) {
    var manifest = getManifestForPage(pageKey) || { hint:'', items:[] };
    return {
      page_key: String(pageKey || '').trim(),
      hint: String(manifest.hint || '').trim(),
      count: Array.isArray(manifest.items) ? manifest.items.length : 0
    };
  };

  function getElementText(el) {
    if (!el) return '';
    var raw = [
      el.getAttribute && el.getAttribute('data-rf-label'),
      el.getAttribute && el.getAttribute('aria-label'),
      el.getAttribute && el.getAttribute('title'),
      el.value,
      el.innerText,
      el.textContent,
      el.placeholder,
      el.name,
      el.id,
      el.className
    ].filter(Boolean).join(' ');
    return normalizeText(raw);
  }

  function findFieldLabel(el) {
    if (!el) return '';
    var id = el.id ? String(el.id) : '';
    if (id) {
      try {
        var lbl = document.querySelector('label[for="' + CSS.escape(id) + '"]');
        if (lbl && lbl.textContent) return lbl.textContent;
      } catch (_) {}
    }
    var field = el.closest && el.closest('.field, .fltGroup, .formRow, .form-field, .editorRow, .inputWrap, .control-group');
    if (field) {
      var label = field.querySelector('label');
      if (label && label.textContent) return label.textContent;
    }
    var prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL' && prev.textContent) return prev.textContent;
    return '';
  }

  function classifyActionElement(el, pageKey) {
    if (!el) return '';
    var page = String(pageKey || '').trim();
    var text = getElementText(el);
    var href = normalizeText(el.getAttribute && el.getAttribute('href'));
    if (!text && !href) return '';

    if (page === 'helper-data' && text.indexOf('salveaza') >= 0) return 'masterdata.edit';
    if (page === 'index') {
      if (text.indexOf('paleta') >= 0 || text.indexOf('tema') >= 0) return 'dashboard.palette';
      if (text.indexOf('refresh') >= 0 || text.indexOf('reincarca') >= 0 || text.indexOf('actualizeaza') >= 0) return 'dashboard.refresh';
    }
    if (text.indexOf('probleme t t') >= 0 || href.indexOf('tratament termic probleme') >= 0 || href.indexOf('tratament-termic-probleme') >= 0) return 'problems.link';
    if ((text.indexOf('pdf') >= 0 || text.indexOf('fisa') >= 0 || text.indexOf('fise') >= 0) && (text.indexOf('incarca') >= 0 || text.indexOf('upload') >= 0 || text.indexOf('adauga') >= 0)) return 'pdf.upload';
    if ((text.indexOf('pdf') >= 0 || text.indexOf('fisa') >= 0 || text.indexOf('fise') >= 0) && (text.indexOf('descarca') >= 0 || text.indexOf('export') >= 0 || text.indexOf('download') >= 0)) return 'pdf.download';
    if ((text.indexOf('pdf') >= 0 || text.indexOf('fisa') >= 0 || text.indexOf('fise') >= 0) && (text.indexOf('sterge') >= 0 || text.indexOf('elimina') >= 0)) return 'pdf.delete';
    if ((text.indexOf('pdf') >= 0 || text.indexOf('fisa') >= 0 || text.indexOf('fise') >= 0) && (text.indexOf('deschide') >= 0 || text.indexOf('vizual') >= 0 || text.indexOf('open') >= 0)) return 'pdf.open';
    if (text.indexOf('import') >= 0 || text.indexOf('incarca excel') >= 0 || text.indexOf('upload excel') >= 0) return 'data.import';
    if (text.indexOf('export') >= 0 || text.indexOf('descarca') >= 0 || text.indexOf('excel') >= 0 || text.indexOf('pdf') >= 0) return 'data.export';
    if (text.indexOf('sterge') >= 0 || text.indexOf('elimina') >= 0 || text.indexOf('delete') >= 0) return 'rows.delete';
    if ((text.indexOf('sapt') >= 0 && (text.indexOf('ascunde') >= 0 || text.indexOf('arata') >= 0 || text.indexOf('toggle') >= 0)) || text.indexOf('culoare') >= 0 || text.indexOf('culori') >= 0 || text.indexOf('paleta') >= 0) return 'rows.edit';
    if (text.indexOf('edit') >= 0 || text.indexOf('modifica') >= 0) return 'rows.edit';
    if (text.indexOf('filtr') >= 0 || text.indexOf('cauta') >= 0 || text.indexOf('search') >= 0) return 'rows.filter';
    if (text.indexOf('refresh') >= 0 || text.indexOf('sincron') >= 0 || text.indexOf('reincarca') >= 0 || text.indexOf('reintra') >= 0 || text.indexOf('actualizeaza') >= 0) return 'cloud.refresh';
    if (text.indexOf('salveaza') >= 0 || text.indexOf('save') >= 0) return 'cloud.save';
    if (text.indexOf('rand nou') >= 0 || text.indexOf('rind nou') >= 0 || text.indexOf('adauga') >= 0 || text.indexOf('nou') >= 0 || text.indexOf('plus') >= 0) return 'rows.add';
    return '';
  }

  function isFilterField(el) {
    if (!el) return false;
    var text = getElementText(el);
    if (text.indexOf('filtr') >= 0 || text.indexOf('cauta') >= 0 || text.indexOf('search') >= 0) return true;
    return !!(el.closest && el.closest('thead .filters, thead tr.filters, thead tr.colFilters, .filtersBar, .filters, .filterBar, .toolbarFilters, .toolbar-search, .searchBox, .tableFilters, .fltGroup'));
  }

  function inferFieldControlKey(el) {
    if (!el) return '';
    var label = findFieldLabel(el);
    var raw = label || el.getAttribute('data-field-label') || el.name || el.id || el.placeholder || el.getAttribute('data-field') || el.className || '';
    var slug = slugKey(raw);
    if (!slug) return '';
    slug = slug
      .replace(/^txt-?/, '')
      .replace(/^cbo-?/, '')
      .replace(/^inp-?/, '')
      .replace(/^input-?/, '')
      .replace(/^field-?/, '')
      .replace(/^btn-?/, '');
    return 'field.' + slug;
  }

  function markAclNodes(scope, pageKey) {
    var root = scope && scope.querySelectorAll ? scope : document;
    if (String(pageKey || '').trim() === 'login') return root;
    var nodes = root.querySelectorAll('button, a, [role="button"], input, select, textarea, [contenteditable], form');
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      if (el.hasAttribute('data-rf-skip')) continue;
      if (!el.hasAttribute('data-rf-control') && !el.hasAttribute('data-rf-field')) {
        if (el.matches('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="file"]')) {
          var actionKey = classifyActionElement(el, pageKey);
          if (actionKey) {
            el.setAttribute('data-rf-control', actionKey);
          }
        }
        if (!el.hasAttribute('data-rf-control') && (el.matches('.paletteSwatch, .color-swatch-btn, [data-fill-color]') || (el.closest && el.closest('#paletteWrap, #cellColorPalette')))) {
          el.setAttribute('data-rf-control', 'rows.edit');
        }
        if (!el.hasAttribute('data-rf-control') && el.matches('input, select, textarea, [contenteditable]')) {
          if (isFilterField(el)) {
            el.setAttribute('data-rf-control', 'rows.filter');
          } else {
            var fieldKey = inferFieldControlKey(el);
            if (fieldKey) el.setAttribute('data-rf-field', fieldKey);
          }
        }
      }
    }
    return root;
  }

  function stricterDefaultForControl(controlKey, pagePermissions) {
    var perms = pagePermissions || {};
    var key = String(controlKey || '').trim();
    var view = perms.can_view === true;
    if (!key) return { can_view: view, can_use: view, can_edit: perms.can_edit === true };
    if (key === 'rows.add') return { can_view: perms.can_add === true, can_use: perms.can_add === true, can_edit: false };
    if (key === 'modal.open') return { can_view: perms.can_add === true || perms.can_edit === true, can_use: perms.can_add === true || perms.can_edit === true, can_edit: false };
    if (key === 'rows.edit') return { can_view: view, can_use: perms.can_edit === true, can_edit: perms.can_edit === true };
    if (key === 'rows.delete' || key === 'pdf.delete') return { can_view: perms.can_delete === true, can_use: perms.can_delete === true, can_edit: false };
    if (key === 'data.export' || key === 'pdf.download') return { can_view: perms.can_export === true, can_use: perms.can_export === true, can_edit: false };
    if (key === 'data.import' || key === 'pdf.upload') return { can_view: perms.can_import === true || perms.can_add === true, can_use: perms.can_import === true || perms.can_add === true, can_edit: false };
    if (key === 'cloud.save') return { can_view: perms.can_add === true || perms.can_edit === true, can_use: perms.can_add === true || perms.can_edit === true, can_edit: false };
    if (key === 'cloud.refresh' || key === 'rows.filter' || key === 'pdf.open' || key === 'problems.link' || key === 'dashboard.palette' || key === 'dashboard.refresh' || key === 'users.manage') return { can_view: view, can_use: view, can_edit: false };
    if (key.indexOf('field.') === 0 || key.indexOf('pdf.revision.') === 0) return { can_view: view, can_use: perms.can_edit === true, can_edit: perms.can_edit === true };
    if (key === 'permissions.save' || key === 'controls.save' || key === 'masterdata.edit') return { can_view: perms.can_edit === true, can_use: perms.can_edit === true, can_edit: false };
    return { can_view: view, can_use: view, can_edit: perms.can_edit === true };
  }

  RF.resolveControlAccess = async function (pageKey, controlKey, options) {
    var pageAccess = options && options.pageAccess ? options.pageAccess : (originalResolvePageAccess ? await originalResolvePageAccess(pageKey, options) : { permissions:{} });
    var res = originalResolveControlAccess
      ? await originalResolveControlAccess(pageKey, controlKey, Object.assign({}, options || {}, { pageAccess: pageAccess }))
      : { control_key: controlKey, can_view: true, can_use: true, can_edit: true, source: 'fallback' };
    var source = String(res && res.source || '');
    var explicitUser = /user control permissions|admin/i.test(source);
    if (!explicitUser) {
      var stricter = stricterDefaultForControl(controlKey, pageAccess && pageAccess.permissions ? pageAccess.permissions : {});
      res = Object.assign({}, res || {}, stricter);
      if (!source) res.source = 'page permissions';
    }
    res.allowed = res.can_view === true;
    return res;
  };

  RF.canUseControl = async function (pageKey, controlKey, options) {
    var res = await RF.resolveControlAccess(pageKey, controlKey, options);
    return { allowed: res.can_use === true && res.can_view === true, visible: res.can_view === true, editable: res.can_edit === true, source: res.source || '' };
  };

  function setReadonlyState(el, editable) {
    if (!el) return;
    if (el.matches('input, textarea')) {
      if (editable) {
        el.removeAttribute('readonly');
        if (el.type !== 'file') el.disabled = false;
      } else {
        el.setAttribute('readonly', 'readonly');
        if (el.type === 'file') el.disabled = true;
      }
      return;
    }
    if (el.matches('select')) {
      el.disabled = !editable;
      return;
    }
    if (el.hasAttribute('contenteditable')) {
      el.setAttribute('contenteditable', editable ? 'true' : 'false');
    }
  }

  RF.applyDomPermissions = async function (pageKey, root, options) {
    if (String(pageKey || '').trim() === 'login') {
      return options && options.pageAccess ? options.pageAccess : { allowed:true, permissions:{} };
    }
    var scope = markAclNodes(root && root.querySelectorAll ? root : document, pageKey);
    var pageAccess = options && options.pageAccess ? options.pageAccess : (originalResolvePageAccess ? await originalResolvePageAccess(pageKey, options) : { permissions:{} });
    var nodes = scope.querySelectorAll('[data-rf-permission],[data-rf-control],[data-rf-field]');
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var permKey = String(el.getAttribute('data-rf-permission') || '').trim();
      if (permKey) {
        var allowByPage = pageAccess && pageAccess.permissions ? pageAccess.permissions[permKey] === true : false;
        if (!allowByPage) {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
          if ('disabled' in el) el.disabled = true;
          continue;
        }
      }
      var controlKey = String(el.getAttribute('data-rf-control') || el.getAttribute('data-rf-field') || '').trim();
      if (!controlKey) continue;
      var controlAccess = await RF.resolveControlAccess(pageKey, controlKey, Object.assign({}, options || {}, { pageAccess: pageAccess }));
      if (controlAccess.can_view !== true) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        if ('disabled' in el) el.disabled = true;
        setReadonlyState(el, false);
        continue;
      }
      if (el.matches('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="file"]')) {
        if ('disabled' in el) el.disabled = controlAccess.can_use !== true;
      }
      if (el.matches('input, select, textarea, [contenteditable]')) {
        setReadonlyState(el, controlAccess.can_edit === true || controlKey === 'rows.filter');
      }
    }
    return pageAccess;
  };

  function currentPageKey() {
    if (window.__RF_ACL_PAGE_BOOT__) return window.__RF_ACL_PAGE_BOOT__.pageKey;
    return RF.inferPageKey ? RF.inferPageKey(window.location.pathname || '') : '';
  }

  function currentPageFlags() {
    return window.__RF_ACL_PAGE_BOOT__ || { pageKey: currentPageKey(), controls: {} };
  }

  function elementInEditableGrid(el) {
    return !!(el && el.closest && el.closest('table tbody tr, .tableWrap tbody tr, .table-wrap tbody tr, .grid-card tbody tr, .tableContainer tbody tr, .editableCell, td.editable, .lvRow, .listViewRow'));
  }

  function elementInEditorForm(el) {
    return !!(el && el.closest && el.closest('form, .modal, .modalCard, .editor, .editorPanel, .sheetModal, .dialog, .popup, .drawer, .panelEditor, .formCard'));
  }

  function elementInFilterZone(el) {
    return !!(el && el.closest && el.closest('thead .filters, thead tr.filters, thead tr.colFilters, .filtersBar, .filters, .filterBar, .toolbarFilters, .toolbar-search, .searchBox, .tableFilters, .fltGroup'));
  }

  function installEventGuards() {
    if (window.__RF_ACL_EVENT_GUARDS__) return;
    window.__RF_ACL_EVENT_GUARDS__ = true;

    document.addEventListener('dblclick', function (ev) {
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      if (edit && edit.can_use === false && elementInEditableGrid(ev.target)) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('click', function (ev) {
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      var add = state.controls && state.controls['rows.add'];
      var del = state.controls && state.controls['rows.delete'];
      var save = state.controls && state.controls['cloud.save'];
      var imp = state.controls && state.controls['data.import'];
      var target = ev.target;
      if (edit && edit.can_use === false && target && target.closest && target.closest('.paletteSwatch, .color-swatch-btn, [data-fill-color], [data-rf-control="rows.edit"]')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        return;
      }
      if (((add && add.can_use === false) || (del && del.can_use === false) || (save && save.can_use === false) || (imp && imp.can_use === false)) && target && target.closest && target.closest('[data-rf-control="rows.add"], [data-rf-control="rows.delete"], [data-rf-control="cloud.save"], [data-rf-control="data.import"], [data-rf-control="pdf.upload"]')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('submit', function (ev) {
      var form = ev.target;
      if (!form || elementInFilterZone(form)) return;
      var state = currentPageFlags();
      var save = state.controls && state.controls['cloud.save'];
      if (save && save.can_use === false && elementInEditorForm(form)) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('beforeinput', function (ev) {
      var target = ev.target;
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      if (edit && edit.can_use === false && target && target.hasAttribute && target.hasAttribute('contenteditable')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);
  }

    document.addEventListener('pointerdown', function (ev) {
      var target = ev.target;
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      if (edit && edit.can_use === false && target && (elementInEditableGrid(target) || (target.closest && target.closest('[contenteditable="true"], .editable-grid-cell, td.editable, .cell-input')))) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('mousedown', function (ev) {
      var target = ev.target;
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      if (edit && edit.can_use === false && target && (elementInEditableGrid(target) || (target.closest && target.closest('[contenteditable="true"], .editable-grid-cell, td.editable, .cell-input')))) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener('keydown', function (ev) {
      var target = ev.target;
      var state = currentPageFlags();
      var edit = state.controls && state.controls['rows.edit'];
      if (!edit || edit.can_use !== false || !target) return;
      var isEditor = (target.matches && target.matches('input, textarea, select, [contenteditable], .editable-grid-cell, .cell-input')) || elementInEditableGrid(target) || elementInEditorForm(target);
      if (!isEditor || elementInFilterZone(target)) return;
      var nav = ['Tab','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'];
      if (nav.indexOf(ev.key) !== -1) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }, true);

    ['input','change','paste','drop'].forEach(function (eventName) {
      document.addEventListener(eventName, function (ev) {
        var target = ev.target;
        var state = currentPageFlags();
        var edit = state.controls && state.controls['rows.edit'];
        if (!edit || edit.can_use !== false || !target) return;
        var isEditor = (target.matches && target.matches('input, textarea, select, [contenteditable], .editable-grid-cell, .cell-input')) || elementInEditableGrid(target) || elementInEditorForm(target);
        if (!isEditor || elementInFilterZone(target)) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }, true);
    });

  async function collectControlSnapshot(pageKey, pageAccess, client) {
    var keys = ['rows.filter','rows.add','rows.edit','rows.delete','data.export','data.import','cloud.refresh','cloud.save','modal.open','pdf.open','pdf.upload','pdf.download','pdf.delete','problems.link'];
    var snapshot = {};
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      snapshot[key] = await RF.resolveControlAccess(pageKey, key, { client: client, pageAccess: pageAccess });
    }
    return snapshot;
  }

  function observeAclMutations(pageKey, client, pageAccess) {
    if (window.__RF_ACL_MUTATION_OBSERVER__) return;
    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(async function () {
        pending = false;
        try {
          await RF.applyDomPermissions(pageKey, document, { client: client, pageAccess: pageAccess });
        } catch (_) {}
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.__RF_ACL_MUTATION_OBSERVER__ = observer;
  }

  async function bootstrapPageAcl() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
    var pageKey = currentPageKey();
    if (pageKey === 'login') return;
    if (!pageKey || !originalResolvePageAccess) return;
    var client = window.createRfSupabaseClient ? window.createRfSupabaseClient() : null;
    if (!client) return;
    var pageAccess = await originalResolvePageAccess(pageKey, { client: client });
    if (!pageAccess || pageAccess.allowed !== true) return;
    await RF.applyDomPermissions(pageKey, document, { client: client, pageAccess: pageAccess });
    installEventGuards();
    window.__RF_ACL_PAGE_BOOT__ = {
      pageKey: pageKey,
      pageAccess: pageAccess,
      controls: await collectControlSnapshot(pageKey, pageAccess, client)
    };
    observeAclMutations(pageKey, client, pageAccess);
  }

  if (!window.__RF_ACL_AUTO_BIND__) {
    window.__RF_ACL_AUTO_BIND__ = true;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { bootstrapPageAcl().catch(function () {}); }, { once: true });
    } else {
      bootstrapPageAcl().catch(function () {});
    }
  }
})(window);


