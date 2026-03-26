(function(){
  const STYLE_ID = 'kad-global-logo-style';
  const LOGO_CLASS = 'kad-inline-logo';
  const LOGO_SRC = './kad-forge-logo.jpeg';

  function hostAlreadyBranded(host){
    const text = (host && host.textContent ? host.textContent : '').replace(/\s+/g, ' ').trim().toUpperCase();
    return text.includes('K.A.D') || text.includes('KAD');
  }

  function makeLogo(iconOnly){
    const box = document.createElement('div');
    box.className = LOGO_CLASS + (iconOnly ? ' is-icon-only' : '');
    box.setAttribute('aria-hidden', 'true');

    const badge = document.createElement('div');
    badge.className = 'kad-inline-badge';

    const img = document.createElement('img');
    img.src = LOGO_SRC;
    img.alt = 'K.A.D';
    img.decoding = 'async';
    img.loading = 'eager';
    badge.appendChild(img);

    const word = document.createElement('div');
    word.className = 'kad-inline-wordmark';
    word.textContent = 'K.A.D';

    box.appendChild(badge);
    box.appendChild(word);
    return box;
  }

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${LOGO_CLASS}{
        flex:0 0 auto;
        min-width:0;
        display:inline-flex;
        align-items:center;
        gap:12px;
        padding:8px 14px 8px 10px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.28);
        background:linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.08));
        box-shadow:0 10px 24px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.16);
        backdrop-filter:blur(12px) saturate(135%);
        -webkit-backdrop-filter:blur(12px) saturate(135%);
        pointer-events:none;
        user-select:none;
      }
      .${LOGO_CLASS}.is-icon-only{
        padding:8px;
      }
      .${LOGO_CLASS}.is-icon-only .kad-inline-wordmark{
        display:none;
      }
      .${LOGO_CLASS} .kad-inline-badge{
        width:52px;
        height:52px;
        flex:0 0 52px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.32), rgba(255,255,255,.10));
        overflow:hidden;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.18), 0 6px 14px rgba(0,0,0,.16);
      }
      .${LOGO_CLASS} img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }
      .${LOGO_CLASS} .kad-inline-wordmark{
        font-size:24px;
        line-height:1;
        font-weight:900;
        letter-spacing:.18em;
        color:inherit;
        text-shadow:0 2px 10px rgba(0,0,0,.12);
        white-space:nowrap;
      }

      .kad-logo-titlehost{
        display:flex !important;
        align-items:center !important;
        gap:14px !important;
        min-width:0;
      }
      .kad-logo-titletext{
        min-width:0;
        display:flex;
        flex-direction:column;
        gap:4px;
      }

      .kad-logo-striphost{
        gap:12px !important;
      }

      .kad-logo-barhost{
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
      }
      .kad-logo-actionpack{
        min-width:0;
        flex:1 1 auto;
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:inherit;
        flex-wrap:wrap;
      }

      @media (max-width: 900px){
        .${LOGO_CLASS}{
          gap:10px;
          padding:7px 12px 7px 8px;
        }
        .${LOGO_CLASS} .kad-inline-badge{
          width:46px;
          height:46px;
          flex-basis:46px;
        }
        .${LOGO_CLASS} .kad-inline-wordmark{
          font-size:20px;
          letter-spacing:.15em;
        }
        .kad-logo-titlehost{
          gap:10px !important;
        }
        .kad-logo-barhost{
          align-items:flex-start !important;
        }
        .kad-logo-actionpack{
          flex:1 1 100%;
          justify-content:flex-start;
        }
      }

      @media (max-width: 640px){
        .${LOGO_CLASS}{
          gap:8px;
          padding:6px 10px 6px 7px;
        }
        .${LOGO_CLASS} .kad-inline-badge{
          width:40px;
          height:40px;
          flex-basis:40px;
        }
        .${LOGO_CLASS} .kad-inline-wordmark{
          font-size:17px;
          letter-spacing:.12em;
        }
      }

      @media print{
        .${LOGO_CLASS}{
          display:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isTitleContainer(el){
    if (!el) return false;
    if (el.matches('.titlebox, .title-wrap, .titleBlock, .topbar-left, .top-left, .title')) return true;
    if (el.querySelector && el.querySelector('h1, h2, h3, .title, .subtitle, .eyebrow')) return true;
    return false;
  }

  function hasButtonCluster(el){
    if (!el || !el.querySelectorAll) return false;
    return el.querySelectorAll('button, a.btn, .btn, .btnTop, .menuBtn, .directLink').length >= 3;
  }

  function firstElementChild(el){
    return Array.from(el.children || []).find(node => node.nodeType === 1) || null;
  }

  function chooseHost(){
    const rootSelectors = [
      '.page > .header',
      '.page > header.topbar',
      '.page > .topbar',
      '.app > header.topbar',
      '.app > .topbar',
      'body > .topbar',
      '.page > .toolbar',
      'body > .toolbar'
    ];

    let root = null;
    for (const selector of rootSelectors) {
      root = document.querySelector(selector);
      if (root) break;
    }
    if (!root) return null;

    const titleSelectors = [
      ':scope > .titlebox',
      ':scope > .title-wrap',
      ':scope > .titleBlock',
      ':scope > .topbar-left',
      ':scope > .top-left',
      ':scope > .title'
    ];

    for (const selector of titleSelectors) {
      const candidate = root.querySelector(selector);
      if (candidate) {
        return { host: candidate, mode: 'title' };
      }
    }

    const first = firstElementChild(root);
    if (first && isTitleContainer(first) && !hasButtonCluster(first)) {
      return { host: first, mode: 'title' };
    }

    const leftGroup = root.querySelector(':scope > .left');
    if (leftGroup) {
      return { host: leftGroup, mode: 'strip' };
    }

    if (first && root.children.length <= 2 && hasButtonCluster(first)) {
      return { host: first, mode: 'strip' };
    }

    return { host: root, mode: 'bar' };
  }

  function injectTitleHost(host){
    if (!host || host.dataset.kadLogoDone === '1') return;

    const logo = makeLogo(hostAlreadyBranded(host));
    const textWrap = document.createElement('div');
    textWrap.className = 'kad-logo-titletext';

    while (host.firstChild) {
      textWrap.appendChild(host.firstChild);
    }

    host.appendChild(logo);
    host.appendChild(textWrap);
    host.classList.add('kad-logo-titlehost');
    host.dataset.kadLogoDone = '1';
  }

  function injectStripHost(host){
    if (!host || host.dataset.kadLogoDone === '1') return;

    const logo = makeLogo(hostAlreadyBranded(host));
    host.insertBefore(logo, host.firstChild);
    host.classList.add('kad-logo-striphost');
    host.dataset.kadLogoDone = '1';
  }

  function injectBarHost(host){
    if (!host || host.dataset.kadLogoDone === '1') return;

    const logo = makeLogo(hostAlreadyBranded(host));
    const pack = document.createElement('div');
    pack.className = 'kad-logo-actionpack';

    while (host.firstChild) {
      pack.appendChild(host.firstChild);
    }

    host.appendChild(logo);
    host.appendChild(pack);
    host.classList.add('kad-logo-barhost');
    host.dataset.kadLogoDone = '1';
  }

  function inject(){
    if (document.body && document.body.classList.contains('rf-login-page')) return;

    ensureStyle();

    const picked = chooseHost();
    if (!picked || !picked.host) return;

    if (picked.mode === 'title') {
      injectTitleHost(picked.host);
    } else if (picked.mode === 'bar') {
      injectBarHost(picked.host);
    } else {
      injectStripHost(picked.host);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once:true });
  } else {
    inject();
  }
})();



(function(){
  const DOC_KEY = 'index_button_visibility_v1';
  let fallbackClient = null;
  let hiddenKeys = [];
  let observer = null;

  function normalize(value){
    return String(value || '').trim().toLowerCase();
  }

  function isIndexPage(){
    const path = String(window.location.pathname || '').toLowerCase();
    return /(^|\/)index\.html$/.test(path) || path === '/' || path.endsWith('/');
  }

  function findLeftMenu(){
    return document.getElementById('leftMenu') || document.querySelector('.left');
  }

  function ensureHelperAclButton(){
    const leftMenu = findLeftMenu();
    if (!leftMenu) return null;

    let existing = document.getElementById('itemAcl');
    if (existing) return existing;

    const helperItem = document.getElementById('itemHelperData') || Array.from(document.querySelectorAll('[data-page-key]')).find(function(node){
      return String(node.dataset.pageKey || '') === 'helper-data';
    });

    let item = null;
    if (helperItem) {
      item = helperItem.cloneNode(true);
      item.id = 'itemAcl';
      item.setAttribute('data-page-key', 'helper-acl');
      item.classList.remove('hidden', 'disabled');
      item.style.display = '';
      const link = item.querySelector('a,button,.directLink,.menuBtn');
      if (link) {
        link.id = 'helperAclLink';
        if (link.tagName === 'A') link.setAttribute('href', 'helper-acl.html');
        link.textContent = 'HELPER-ACL';
      }
      if (helperItem.parentNode) {
        helperItem.parentNode.insertBefore(item, helperItem.nextSibling);
      } else {
        leftMenu.appendChild(item);
      }
    } else {
      item = document.createElement('div');
      item.className = 'item page-item';
      item.id = 'itemAcl';
      item.setAttribute('data-page-key', 'helper-acl');
      const link = document.createElement('a');
      link.className = 'directLink';
      link.id = 'helperAclLink';
      link.href = 'helper-acl.html';
      link.textContent = 'HELPER-ACL';
      item.appendChild(link);
      leftMenu.appendChild(item);
    }

    return item;
  }

  function getSupabaseClient(){
    try {
      if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
        return window.ERPAuth.getSupabaseClient();
      }
    } catch (_) {}

    if (fallbackClient) return fallbackClient;
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
      const cfg = window.RF_CONFIG || window.rfConfig || window.RAPORT_FORJA_CONFIG || window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || {};
      const url = cfg.supabaseUrl || cfg.SUPABASE_URL || '';
      const key = cfg.supabaseAnonKey || cfg.SUPABASE_ANON_KEY || '';
      if (!url || !key) return null;
      fallbackClient = window.supabase.createClient(url, key, {
        auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      return fallbackClient;
    } catch (_) {
      return null;
    }
  }

  async function getCurrentUser(sb){
    if (!sb || !sb.auth || typeof sb.auth.getSession !== 'function') return null;
    try {
      const res = await sb.auth.getSession();
      return res && res.data && res.data.session && res.data.session.user ? res.data.session.user : null;
    } catch (_) {
      return null;
    }
  }

  async function readVisibilityDoc(sb){
    if (!sb || typeof sb.from !== 'function') return { users:{} };
    try {
      const a = await sb.from('rf_documents').select('content').eq('doc_key', DOC_KEY).maybeSingle();
      if (!a.error && a.data && a.data.content && typeof a.data.content === 'object') {
        return a.data.content;
      }
    } catch (_) {}
    try {
      const b = await sb.from('rf_documents').select('data').eq('doc_key', DOC_KEY).maybeSingle();
      if (!b.error && b.data && b.data.data && typeof b.data.data === 'object') {
        return b.data.data;
      }
    } catch (_) {}
    return { users:{} };
  }

  function getHiddenKeysForUser(doc, user){
    const users = doc && doc.users && typeof doc.users === 'object' ? doc.users : {};
    const identities = [normalize(user && user.email), normalize(user && user.id)].filter(Boolean);
    for (const key of identities) {
      const row = users[key];
      if (row && Array.isArray(row.hiddenPageKeys)) {
        return row.hiddenPageKeys.map(function(v){ return String(v || '').trim(); }).filter(Boolean);
      }
    }
    return [];
  }

  function showNode(node){
    if (!node) return;
    node.classList.remove('hidden');
    node.style.display = '';
    node.style.visibility = '';
    node.style.pointerEvents = '';
    node.removeAttribute('aria-hidden');
  }

  function hideNode(node){
    if (!node) return;
    node.classList.add('hidden');
    node.style.display = 'none';
    node.setAttribute('aria-hidden', 'true');
  }

  function pageNodes(pageKey){
    return Array.from(document.querySelectorAll('[data-page-key]')).filter(function(node){
      return String(node.dataset.pageKey || '').trim() === String(pageKey || '').trim();
    });
  }

  function applyHiddenKey(pageKey, hidden){
    pageNodes(pageKey).forEach(function(node){
      const box = node.closest('.item,.page-item,.group-item') || node;
      if (hidden) hideNode(box);
      else showNode(box);
      if (box !== node && (node.matches('a,button,.subbtn,.directLink,.menuBtn') || node.querySelector('a,button,.subbtn,.directLink,.menuBtn'))) {
        if (hidden) node.classList.add('disabled');
        else node.classList.remove('disabled');
      }
    });
  }

  function applyVisibility(){
    ensureHelperAclButton();
    const hidden = new Set(hiddenKeys.map(function(v){ return String(v || '').trim(); }).filter(Boolean));
    hidden.forEach(function(pageKey){
      applyHiddenKey(pageKey, true);
    });
    if (!hidden.has('helper-acl')) {
      applyHiddenKey('helper-acl', false);
    }
  }

  async function refreshIndexAcl(){
    if (!isIndexPage()) return;
    ensureHelperAclButton();
    const sb = getSupabaseClient();
    if (!sb) return;
    const user = await getCurrentUser(sb);
    if (!user) return;
    const doc = await readVisibilityDoc(sb);
    hiddenKeys = getHiddenKeysForUser(doc, user);
    applyVisibility();
  }

  function scheduleRefresh(){
    if (!isIndexPage()) return;
    ensureHelperAclButton();
    applyVisibility();
    window.setTimeout(refreshIndexAcl, 60);
    window.setTimeout(refreshIndexAcl, 500);
    window.setTimeout(refreshIndexAcl, 1200);
    if (observer) return;
    try {
      observer = new MutationObserver(function(){ applyVisibility(); });
      observer.observe(document.documentElement, { subtree:true, childList:true, attributes:true });
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRefresh, { once:true });
  } else {
    scheduleRefresh();
  }
  window.addEventListener('pageshow', scheduleRefresh, { passive:true });
})();

