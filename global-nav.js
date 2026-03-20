
(() => {
  if (window.__ERP_GLOBAL_NAV_INIT__) return;
  window.__ERP_GLOBAL_NAV_INIT__ = true;

  const groups = [
    {
      title: 'Principal',
      items: [
        ['index.html', 'Dashboard'],
        ['login.html', 'Login'],
        ['helper.html', 'Helper'],
        ['helper-data.html', 'Helper Data'],
        ['helper-acl.html', 'Permisiuni (ACL)']
      ]
    },
    {
      title: 'Forjă',
      items: [
        ['numeralkod.html', 'Numeralkod'],
        ['intrari-otel.html', 'Intrări oțel'],
        ['debitate.html', 'Debitate'],
        ['forjate.html', 'Forjate'],
        ['inventar-otel.html', 'Inventar oțel'],
        ['stoc-initial-otel.html', 'Stoc inițial oțel'],
        ['inventar-debitat.html', 'Inventar debitat'],
        ['inventar-forjat.html', 'Inventar forjat'],
        ['planificare-forja.html', 'Planificare forjă'],
        ['mrc.html', 'MRC'],
        ['comenzi-livrare.html', 'Comenzi livrare'],
        ['program-utilaje.html', 'Program utilaje'],
        ['calendar-operatori.html', 'Calendar operatori'],
        ['kpi.html', 'KPI'],
        ['magnaflux.html', 'Magnaflux'],
        ['magnaflux-calendar.html', 'Calendar Magnaflux'],
        ['rebut.html', 'Rebut'],
        ['rebut-pm.html', 'Rebut PM'],
        ['rebut-pm-helper.html', 'Rebut PM Helper']
      ]
    },
    {
      title: 'Probleme / îmbunătățiri',
      items: [
        ['probleme-raportate.html', 'Probleme raportate'],
        ['urmarire-actiuni-progres.html', 'Urmărire acțiuni și progres'],
        ['imbunatatire-continua.html', 'Îmbunătățire continuă'],
        ['investitii.html', 'Investiții']
      ]
    },
    {
      title: 'Urmărire zale',
      items: [
        ['zale-9k-6628-29.html', 'Zale 9K-6628/29'],
        ['zale-229-6909-10.html', 'Zale 229-6909/10'],
        ['zale-503-0761-62.html', 'Zale 503-0761/62'],
        ['zale-106-1625-26.html', 'Zale 106-1625/26'],
        ['zale-378-8241-42.html', 'Zale 378-8241/42'],
        ['zale-248-2307-08.html', 'Zale 248-2307/08'],
        ['zale-417-3595-96.html', 'Zale 417-3595/96'],
        ['zale-418-2091-92.html', 'Zale 418-2091/92']
      ]
    },
    {
      title: 'Ambalare',
      items: [
        ['ambalare-9k-6628-29.html', 'Ambalare 9K-6628/29'],
        ['ambalare-229-6909-10.html', 'Ambalare 229-6909/10'],
        ['ambalare-503-0761-62.html', 'Ambalare 503-0761/62'],
        ['ambalare-106-1625-26.html', 'Ambalare 106-1625/26'],
        ['ambalare-378-8241-42.html', 'Ambalare 378-8241/42'],
        ['ambalare-248-2307-08.html', 'Ambalare 248-2307/08'],
        ['ambalare-417-3595-96.html', 'Ambalare 417-3595/96'],
        ['ambalare-418-2091-92.html', 'Ambalare 418-2091/92']
      ]
    }
  ];

  const currentPage = (() => {
    const raw = (location.pathname.split('/').pop() || 'index.html').trim();
    return raw || 'index.html';
  })();

  const style = document.createElement('style');
  style.textContent = `
    #erpGlobalNavToggle{
      position:fixed;
      top:10px;
      left:10px;
      z-index:2147483000;
      width:42px;
      height:42px;
      border:1px solid rgba(18,52,86,.25);
      border-radius:12px;
      background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(232,242,252,.96));
      color:#123456;
      box-shadow:0 10px 28px rgba(0,0,0,.22);
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      font-size:22px;
      font-weight:800;
      line-height:1;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      transition:transform .15s ease, box-shadow .15s ease, background .15s ease;
    }
    #erpGlobalNavToggle:hover{ transform:translateY(-1px); box-shadow:0 14px 32px rgba(0,0,0,.26); }
    #erpGlobalNavToggle:active{ transform:translateY(0); }

    #erpGlobalNavOverlay{
      position:fixed;
      inset:0;
      z-index:2147482998;
      background:rgba(3, 14, 29, .42);
      opacity:0;
      pointer-events:none;
      transition:opacity .18s ease;
      backdrop-filter:blur(2px);
      -webkit-backdrop-filter:blur(2px);
    }
    #erpGlobalNavOverlay.open{
      opacity:1;
      pointer-events:auto;
    }

    #erpGlobalNavDrawer{
      position:fixed;
      top:0;
      left:0;
      height:100vh;
      width:min(390px, calc(100vw - 16px));
      max-width:100vw;
      z-index:2147482999;
      background:linear-gradient(180deg, rgba(250,252,255,.985), rgba(236,244,252,.985));
      color:#0f172a;
      box-shadow:22px 0 48px rgba(0,0,0,.24);
      border-right:1px solid rgba(18,52,86,.12);
      transform:translateX(-102%);
      transition:transform .2s ease;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      font-family:Arial, Helvetica, sans-serif;
    }
    #erpGlobalNavDrawer.open{ transform:translateX(0); }

    .erpGlobalNavHeader{
      padding:14px 14px 10px;
      border-bottom:1px solid rgba(18,52,86,.12);
      background:linear-gradient(180deg, rgba(225,238,252,.95), rgba(238,246,253,.95));
    }
    .erpGlobalNavHeaderRow{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:10px;
    }
    .erpGlobalNavTitle{
      font-size:17px;
      font-weight:800;
      color:#123456;
      margin:0;
      line-height:1.2;
    }
    .erpGlobalNavSub{
      font-size:12px;
      color:#334155;
      margin:0;
    }
    .erpGlobalNavClose{
      width:34px;
      height:34px;
      border-radius:10px;
      border:1px solid rgba(18,52,86,.16);
      background:#ffffff;
      color:#123456;
      cursor:pointer;
      font-size:18px;
      font-weight:700;
      box-shadow:0 3px 10px rgba(0,0,0,.08);
    }
    .erpGlobalNavSearch{
      width:100%;
      height:38px;
      border-radius:10px;
      border:1px solid rgba(18,52,86,.18);
      background:#fff;
      color:#0f172a;
      padding:0 12px;
      outline:none;
      font-size:14px;
      box-shadow:inset 0 1px 2px rgba(0,0,0,.04);
    }
    .erpGlobalNavSearch:focus{
      border-color:#2b6cb0;
      box-shadow:0 0 0 3px rgba(43,108,176,.14);
    }
    .erpGlobalNavBody{
      flex:1;
      overflow:auto;
      padding:12px 12px 22px;
    }
    .erpGlobalNavGroup + .erpGlobalNavGroup{ margin-top:16px; }
    .erpGlobalNavGroupTitle{
      font-size:12px;
      font-weight:800;
      letter-spacing:.4px;
      text-transform:uppercase;
      color:#4b5563;
      margin:0 0 8px;
      padding:0 2px;
    }
    .erpGlobalNavLinks{
      display:grid;
      grid-template-columns:1fr;
      gap:8px;
    }
    .erpGlobalNavLink{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      min-height:40px;
      padding:9px 12px;
      border-radius:12px;
      text-decoration:none;
      color:#0f172a !important;
      background:rgba(255,255,255,.88);
      border:1px solid rgba(18,52,86,.10);
      box-shadow:0 3px 10px rgba(0,0,0,.04);
      transition:transform .12s ease, background .12s ease, border-color .12s ease;
      font-size:14px;
      font-weight:700;
    }
    .erpGlobalNavLink:hover{
      transform:translateY(-1px);
      background:#fff;
      border-color:rgba(43,108,176,.28);
    }
    .erpGlobalNavLink.current{
      background:linear-gradient(180deg, rgba(72,145,255,.18), rgba(111,183,255,.16));
      border-color:rgba(43,108,176,.34);
      color:#123456 !important;
    }
    .erpGlobalNavTag{
      flex:0 0 auto;
      font-size:11px;
      line-height:1;
      padding:4px 7px;
      border-radius:999px;
      background:rgba(18,52,86,.08);
      color:#334155;
      font-weight:800;
    }
    .erpGlobalNavEmpty{
      padding:14px 12px;
      border-radius:12px;
      border:1px dashed rgba(18,52,86,.18);
      background:rgba(255,255,255,.55);
      color:#475569;
      font-size:13px;
    }
    @media (max-width: 640px){
      #erpGlobalNavToggle{ top:8px; left:8px; width:40px; height:40px; border-radius:11px; }
      #erpGlobalNavDrawer{ width:calc(100vw - 8px); }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'erpGlobalNavOverlay';

  const drawer = document.createElement('aside');
  drawer.id = 'erpGlobalNavDrawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="erpGlobalNavHeader">
      <div class="erpGlobalNavHeaderRow">
        <div>
          <h2 class="erpGlobalNavTitle">Navigare rapidă</h2>
          <p class="erpGlobalNavSub">Toate paginile într-un singur loc</p>
        </div>
        <button type="button" class="erpGlobalNavClose" aria-label="Închide meniul">✕</button>
      </div>
      <input type="text" class="erpGlobalNavSearch" placeholder="Caută o pagină..." aria-label="Caută o pagină" />
    </div>
    <div class="erpGlobalNavBody"></div>
  `;

  const toggle = document.createElement('button');
  toggle.id = 'erpGlobalNavToggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Deschide meniul cu toate paginile');
  toggle.setAttribute('title', 'Meniu pagini');
  toggle.textContent = '☰';

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  document.body.appendChild(toggle);

  const bodyEl = drawer.querySelector('.erpGlobalNavBody');
  const searchInput = drawer.querySelector('.erpGlobalNavSearch');
  const closeBtn = drawer.querySelector('.erpGlobalNavClose');

  function pageTag(href){
    if (href === currentPage) return 'Aici';
    const base = href.replace(/\.html$/i, '');
    const idx = base.indexOf('-');
    return idx > 0 ? base.slice(0, idx).toUpperCase() : 'Pagină';
  }

  function render(filterText){
    const q = String(filterText || '').trim().toLowerCase();
    bodyEl.innerHTML = '';
    let visibleCount = 0;

    groups.forEach(group => {
      const items = group.items.filter(([href, label]) => {
        if (!q) return true;
        const hay = (href + ' ' + label + ' ' + group.title).toLowerCase();
        return hay.includes(q);
      });
      if (!items.length) return;
      visibleCount += items.length;

      const groupWrap = document.createElement('section');
      groupWrap.className = 'erpGlobalNavGroup';
      const title = document.createElement('h3');
      title.className = 'erpGlobalNavGroupTitle';
      title.textContent = group.title;
      const links = document.createElement('div');
      links.className = 'erpGlobalNavLinks';

      items.forEach(([href, label]) => {
        const a = document.createElement('a');
        a.className = 'erpGlobalNavLink' + (href === currentPage ? ' current' : '');
        a.href = href;
        a.innerHTML = `<span>${label}</span><span class="erpGlobalNavTag">${pageTag(href)}</span>`;
        links.appendChild(a);
      });

      groupWrap.appendChild(title);
      groupWrap.appendChild(links);
      bodyEl.appendChild(groupWrap);
    });

    if (!visibleCount) {
      const empty = document.createElement('div');
      empty.className = 'erpGlobalNavEmpty';
      empty.textContent = 'Nu există nicio pagină care să corespundă căutării.';
      bodyEl.appendChild(empty);
    }
  }

  function openMenu(){
    overlay.classList.add('open');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.setProperty('--erp-global-nav-open', '1');
    window.requestAnimationFrame(() => {
      try { searchInput.focus({ preventScroll:true }); } catch(_) { try { searchInput.focus(); } catch(__){} }
      searchInput.select();
    });
  }

  function closeMenu(){
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.removeProperty('--erp-global-nav-open');
  }

  toggle.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeMenu();
    else openMenu();
  });
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  searchInput.addEventListener('input', () => render(searchInput.value));
  drawer.addEventListener('click', ev => {
    const link = ev.target.closest('a.erpGlobalNavLink');
    if (!link) return;
    closeMenu();
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && drawer.classList.contains('open')) {
      ev.preventDefault();
      closeMenu();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      openMenu();
    }
  });

  render('');
})();
