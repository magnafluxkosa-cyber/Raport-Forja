(function(){
  const MOBILE_WIDTH = 900;
  let scaleObserver = null;

  function isMobileViewport(){
    return window.innerWidth <= MOBILE_WIDTH || (window.matchMedia && window.matchMedia('(pointer:coarse) and (max-width: 1024px)').matches);
  }

  function updateViewportVars(){
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--rf-vh', `${vh}px`);
  }

  function enforceUnscaledTables(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('.table-fit').forEach((el) => {
      el.style.transform = 'none';
      el.style.width = 'max-content';
      el.style.minWidth = '100%';
      el.style.height = 'auto';
    });
  }

  function attachScaleObserver(){
    if(scaleObserver) return;
    scaleObserver = new MutationObserver(() => {
      enforceUnscaledTables();
      wrapFreeTables();
      neutralizeStickyInsideScroll();
    });
    try{
      scaleObserver.observe(document.documentElement || document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
    }catch(_err){}
  }

  function isInsideExistingScrollWrap(table){
    return !!table.closest('.rf-mobile-table-scroll, .table-wrap, .tableWrap, .tablewrap, .sumWrap, .summaryWrap, .sideTableWrap, .matrix-wrap, .ranking-wrap, .mini-table, .table-panel, .table-shell, .table-card, .sideTable');
  }

  function shouldWrapTable(table){
    if(!table || !table.parentElement) return false;
    if(isInsideExistingScrollWrap(table)) return false;
    if(table.closest('#kadNavShellRoot, .modal, .modalBody, .modal-body, .pm-modal, .pm-modal-body, .modal-content, .kad-shell')) return false;
    return true;
  }

  function wrapFreeTables(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('table').forEach((table) => {
      if(!shouldWrapTable(table)) return;
      const parent = table.parentElement;
      if(!parent) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'rf-mobile-table-scroll';
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function neutralizeStickyInsideScroll(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('.rf-mobile-table-scroll, .table-wrap, .tableWrap, .tablewrap, .sumWrap, .summaryWrap, .sideTableWrap, .matrix-wrap, .ranking-wrap, .mini-table, .table-panel, .table-shell, .table-card, .sideTable').forEach((root) => {
      root.querySelectorAll('*').forEach((el) => {
        const pos = window.getComputedStyle(el).position;
        if(pos === 'sticky'){
          el.setAttribute('data-rf-mobile-sticky', '1');
        }
      });
    });
  }

  function dispatchMobileLayoutEvent(){
    try{
      window.dispatchEvent(new CustomEvent('rf:mobile-layout', { detail:{ mobile:isMobileViewport() } }));
    }catch(_err){}
  }

  function applyMobileClass(){
    if(!document.body) return;
    document.body.classList.toggle('rf-mobile', isMobileViewport());
    updateViewportVars();
    enforceUnscaledTables();
    wrapFreeTables();
    neutralizeStickyInsideScroll();
    attachScaleObserver();
    dispatchMobileLayoutEvent();
  }

  function scrollFocusedFieldIntoView(target){
    if(!target || !document.body || !document.body.classList.contains('rf-mobile')) return;
    if(!/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    window.setTimeout(() => {
      try{
        target.scrollIntoView({ block:'center', inline:'nearest', behavior:'smooth' });
      }catch(_err){
        try{ target.scrollIntoView(); }catch(_err2){}
      }
    }, 180);
  }

  window.addEventListener('resize', applyMobileClass, { passive:true });
  window.addEventListener('orientationchange', applyMobileClass, { passive:true });
  window.addEventListener('pageshow', applyMobileClass, { passive:true });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', updateViewportVars, { passive:true });
    window.visualViewport.addEventListener('scroll', updateViewportVars, { passive:true });
  }

  document.addEventListener('focusin', (event) => {
    scrollFocusedFieldIntoView(event.target);
  }, true);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', applyMobileClass, { once:true });
  }else{
    applyMobileClass();
  }
})();
