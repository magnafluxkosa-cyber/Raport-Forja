(function(){
  const STYLE_ID = 'kad-global-logo-style';
  const LOGO_CLASS = 'kad-inline-logo';
  const LOGO_SRC = './kad-forge-logo.jpeg';

  function makeLogo(){
    const box = document.createElement('div');
    box.className = LOGO_CLASS;
    box.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = LOGO_SRC;
    img.alt = 'K.A.D Forge';
    img.decoding = 'async';
    img.loading = 'eager';

    box.appendChild(img);
    return box;
  }

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${LOGO_CLASS}{
        width:68px;
        height:68px;
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:center;
        pointer-events:none;
        user-select:none;
      }
      .${LOGO_CLASS} img{
        width:100%;
        height:100%;
        object-fit:contain;
        display:block;
        filter:drop-shadow(0 6px 14px rgba(0,0,0,.22));
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
          width:56px;
          height:56px;
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
          width:48px;
          height:48px;
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

    const logo = makeLogo();
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

    const logo = makeLogo();
    host.insertBefore(logo, host.firstChild);
    host.classList.add('kad-logo-striphost');
    host.dataset.kadLogoDone = '1';
  }

  function injectBarHost(host){
    if (!host || host.dataset.kadLogoDone === '1') return;

    const logo = makeLogo();
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
