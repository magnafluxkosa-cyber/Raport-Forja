(function(){
  const MOBILE_WIDTH = 900;
  const CSS_HREF = './mobile-erp.css';

  function isMobileViewport(){
    return window.innerWidth <= MOBILE_WIDTH || (window.matchMedia && window.matchMedia('(pointer:coarse) and (max-width: 1024px)').matches);
  }

  function updateViewportVars(){
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--rf-vh', `${h * 0.01}px`);
  }

  function ensureMobileCssLoaded(){
    if(document.querySelector('link[href$="mobile-erp.css"]')) return;
    const head = document.head || document.getElementsByTagName('head')[0];
    if(!head) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    link.setAttribute('data-rf-mobile-css', '1');
    head.appendChild(link);
  }

  function scrollContainersSelector(){
    return '.rf-mobile-table-scroll,.table-wrap,.tableWrap,.tablewrap,.table-scroll,.tableScroll,.sumWrap,.summaryWrap,.sideTableWrap,.matrix-wrap,.ranking-wrap,.mini-table,.table-panel,.table-shell,.table-card,.sideTable,.excel-scroll,.data-scroll,.grid-scroll,.list-scroll';
  }

  function ignoredTable(table){
    return !table || table.closest('#kadNavShellRoot,.kad-shell,.modal,.modalBody,.modal-body,.pm-modal,.pm-modal-body,.modal-content,script,template');
  }

  function inScrollContainer(table){
    return !!table.closest(scrollContainersSelector());
  }

  function wrapFreeTables(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('table').forEach((table) => {
      if(ignoredTable(table) || inScrollContainer(table) || table.closest('.rf-mobile-table-scroll')) return;
      const parent = table.parentElement;
      if(!parent) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'rf-mobile-table-scroll';
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function prepareTables(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll(scrollContainersSelector()).forEach((el) => {
      el.classList.add('rf-mobile-table-scroll');
    });
    document.querySelectorAll('.table-fit').forEach((el) => {
      el.style.transform = 'none';
      el.style.transformOrigin = 'top left';
    });
    document.querySelectorAll('table').forEach((table) => {
      if(ignoredTable(table)) return;
      table.classList.add('rf-mobile-wide-table');
    });
  }

  function neutralizeStickyInsideScroll(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll(scrollContainersSelector()).forEach((root) => {
      root.querySelectorAll('*').forEach((el) => {
        try{
          if(window.getComputedStyle(el).position === 'sticky'){
            el.setAttribute('data-rf-mobile-sticky', '1');
          }
        }catch(_err){}
      });
    });
  }

  function applyMobileClass(){
    if(!document.body) return;
    ensureMobileCssLoaded();
    document.body.classList.toggle('rf-mobile', isMobileViewport());
    updateViewportVars();
    wrapFreeTables();
    prepareTables();
    neutralizeStickyInsideScroll();
    try{
      window.dispatchEvent(new CustomEvent('rf:mobile-layout', { detail:{ mobile:isMobileViewport() } }));
    }catch(_err){}
  }

  function scrollFocusedFieldIntoView(target){
    if(!target || !document.body || !document.body.classList.contains('rf-mobile')) return;
    if(!/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    window.setTimeout(() => {
      try{ target.scrollIntoView({ block:'center', inline:'nearest', behavior:'smooth' }); }
      catch(_err){ try{ target.scrollIntoView(); }catch(_err2){} }
    }, 180);
  }

  window.addEventListener('resize', applyMobileClass, { passive:true });
  window.addEventListener('orientationchange', applyMobileClass, { passive:true });
  window.addEventListener('pageshow', applyMobileClass, { passive:true });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', updateViewportVars, { passive:true });
    window.visualViewport.addEventListener('scroll', updateViewportVars, { passive:true });
  }
  document.addEventListener('focusin', (event) => scrollFocusedFieldIntoView(event.target), true);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', applyMobileClass, { once:true });
  }else{
    applyMobileClass();
  }
  window.setTimeout(applyMobileClass, 400);
  window.setTimeout(applyMobileClass, 1200);
})();
