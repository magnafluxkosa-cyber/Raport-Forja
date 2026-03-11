(function (window) {
  'use strict';

  var PAGE_LIST = [
    { page_key: 'index', page_name: 'Dashboard / Index' },
    { page_key: 'login', page_name: 'Login' },
    { page_key: 'helper-data', page_name: 'Helper Data' },
    { page_key: 'helper-acl', page_name: 'Helper ACL' },
    { page_key: 'numeralkod', page_name: 'Numeral KOD' },
    { page_key: 'intrari-otel', page_name: 'Intrări Oțel' },
    { page_key: 'debitate', page_name: 'Debitate' },
    { page_key: 'forjate', page_name: 'Forjate' },
    { page_key: 'program-utilaje', page_name: 'Program Utilaje' },
    { page_key: 'magnaflux', page_name: 'Magnaflux' },
    { page_key: 'probleme-raportate', page_name: 'Probleme Raportate' },
    { page_key: 'rebut', page_name: 'Rebut' },
    { page_key: 'kpi', page_name: 'KPI' },
    { page_key: 'inventar-otel', page_name: 'Inventar Oțel' },
    { page_key: 'inventar-debitat', page_name: 'Inventar Debitat' },
    { page_key: 'inventar-forjat', page_name: 'Inventar Forjat' },
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

  function clonePages() {
    return PAGE_LIST.map(function (page) {
      return Object.freeze({ page_key: page.page_key, page_name: page.page_name });
    });
  }

  var CONFIG = Object.freeze({
    APP_NAME: 'ERP Forja / Raport Forja',
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
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: getAuthOptions(options && options.auth)
    });
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
                '<a href="index.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#3d73b9;color:#fff;font-weight:700;">Înapoi la Dashboard</a>' +
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

  async function loadPagePermissionMap(client, role) {
    if (!client) return null;
    try {
      var res = await client.from('page_permissions').select('page_key,can_view').eq('role', normalizeRole(role));
      if (res.error || !Array.isArray(res.data)) return null;
      var map = new Map();
      res.data.forEach(function (row) {
        var key = String(row.page_key || '').trim();
        if (!key) return;
        map.set(key, row.can_view === true);
      });
      return map;
    } catch (_) {
      return null;
    }
  }

  async function readDashboardAclMirror(client) {
    if (!client) return null;
    try {
      var a = await client.from('rf_documents').select('content').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
      if (!a.error && a.data && a.data.content && typeof a.data.content === 'object') return a.data.content;
    } catch (_) {}
    try {
      var b = await client.from('rf_documents').select('data').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
      if (!b.error && b.data && b.data.data && typeof b.data.data === 'object') return b.data.data;
    } catch (_) {}
    return null;
  }

  function collectAclDecisions(opts) {
    var decisions = [];
    var pageKey = String(opts.pageKey || '').trim();
    var href = normalizeHref(opts.href);
    var role = normalizeRole(opts.role);
    var map = opts.permissionMap instanceof Map ? opts.permissionMap : null;
    var mirror = opts.mirror && typeof opts.mirror === 'object' ? opts.mirror : null;

    if (map && pageKey && map.has(pageKey)) {
      decisions.push(map.get(pageKey) === true);
    }

    if (mirror) {
      var pagePermissions = mirror.page_permissions && typeof mirror.page_permissions === 'object' ? mirror.page_permissions : null;
      var rolePermissions = pagePermissions && pagePermissions[role] && typeof pagePermissions[role] === 'object' ? pagePermissions[role] : null;
      if (rolePermissions && pageKey && Object.prototype.hasOwnProperty.call(rolePermissions, pageKey)) {
        var permValue = rolePermissions[pageKey];
        if (permValue && typeof permValue === 'object' && Object.prototype.hasOwnProperty.call(permValue, 'can_view')) {
          decisions.push(permValue.can_view === true);
        } else {
          decisions.push(permValue === true);
        }
      }

      var grants = mirror.grants && typeof mirror.grants === 'object' ? mirror.grants : null;
      var roleGrants = grants && grants[role] && typeof grants[role] === 'object' ? grants[role] : null;
      if (roleGrants) {
        if (pageKey && Object.prototype.hasOwnProperty.call(roleGrants, pageKey)) {
          decisions.push(roleGrants[pageKey] === true);
        }
        if (href && Object.prototype.hasOwnProperty.call(roleGrants, href)) {
          decisions.push(roleGrants[href] === true);
        }
      }
    }

    return decisions;
  }

  async function canViewPage(pageKey, options) {
    var key = String(pageKey || '').trim();
    var href = pageKeyToHref(key);
    var client = options && options.client ? options.client : createRfSupabaseClient();
    var user = options && options.user ? options.user : null;

    if (key === 'login') {
      return { allowed: true, role: 'viewer', source: 'login open' };
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
      return { allowed: true, role: 'viewer', source: 'no session fallback' };
    }

    var resolved = await resolveRole(client, user);
    var role = normalizeRole(resolved.role);
    if (role === 'admin') {
      return { allowed: true, role: role, source: resolved.source };
    }

    var permissionMap = await loadPagePermissionMap(client, role);
    var mirror = await readDashboardAclMirror(client);
    var decisions = collectAclDecisions({ pageKey: key, href: href, role: role, permissionMap: permissionMap, mirror: mirror });

    if (decisions.indexOf(false) !== -1) {
      return { allowed: false, role: role, source: 'acl explicit false', message: 'Nu ai acces în această foaie. Cere acces de la admin.' };
    }
    if (decisions.indexOf(true) !== -1) {
      return { allowed: true, role: role, source: 'acl explicit true' };
    }

    return { allowed: true, role: role, source: 'acl fallback allow' };
  }

  window.RF_CONFIG = CONFIG;
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
  window.RF_ACL.safeLower = safeLower;
  window.RF_ACL.normalizeRole = normalizeRole;
  window.RF_ACL.normalizeHref = normalizeHref;
  window.RF_ACL.pageKeyToHref = pageKeyToHref;
  window.RF_ACL.inferPageKey = inferPageKey;
  window.RF_ACL.resolveRole = resolveRole;
  window.RF_ACL.loadPagePermissionMap = loadPagePermissionMap;
  window.RF_ACL.readDashboardAclMirror = readDashboardAclMirror;
  window.RF_ACL.collectAclDecisions = collectAclDecisions;
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
