(function(){
  const MOBILE_WIDTH = 900;
  let scaleObserver = null;
  const MOBILE_CSS_HREF = './mobile-erp.css';

  function isMobileViewport(){
    return window.innerWidth <= MOBILE_WIDTH || (window.matchMedia && window.matchMedia('(pointer:coarse) and (max-width: 1024px)').matches);
  }

  function updateViewportVars(){
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--rf-vh', `${vh}px`);
  }


  function ensureMobileCssLoaded(){
    if(document.querySelector('link[href$="mobile-erp.css"]')) return;
    const head = document.head || document.getElementsByTagName('head')[0];
    if(!head) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MOBILE_CSS_HREF;
    link.setAttribute('data-rf-mobile-css', '1');
    head.appendChild(link);
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
      markExistingTableContainers();
      neutralizeStickyInsideScroll();
    });
    try{
      scaleObserver.observe(document.documentElement || document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
    }catch(_err){}
  }

  function tableScrollContainerSelector(){
    return '.rf-mobile-table-scroll, .table-wrap, .tableWrap, .tablewrap, .tableScroll, .table-scroll, .sheet-scroll, .sheetScroll, .sumWrap, .summaryWrap, .summary-table-wrap, .summaryTableWrap, .sideTableWrap, .matrix-wrap, .ranking-wrap, .mini-table-wrap, .mini-table, .deptTableWrap, .defect-filter-table-wrap, .generator-preview-wrap, .main-table-wrap, .monthly-table-wrap, .tableInner, .fit-table, .excel-wrap, .excel-scroll, .data-scroll, .grid-scroll, .list-scroll, .table-panel, .table-shell, .table-card, .sideTable';
  }

  function isInsideExistingScrollWrap(table){
    return !!table.closest(tableScrollContainerSelector());
  }

  function shouldWrapTable(table){
    if(!table || !table.parentElement) return false;
    if(isInsideExistingScrollWrap(table)) return false;
    if(table.closest('#kadNavShellRoot, .modal, .modalBody, .modal-body, .pm-modal, .pm-modal-body, .modal-content, .kad-shell')) return false;
    return true;
  }


  function isIgnoredTable(table){
    return !table || table.closest('#kadNavShellRoot, .modal, .modalBody, .modal-body, .pm-modal, .pm-modal-body, .modal-content, .kad-shell, script, template');
  }

  function getColumnCount(table){
    const row = table.tHead && table.tHead.rows && table.tHead.rows[0] ? table.tHead.rows[0] : table.querySelector('tr');
    if(!row) return 0;
    return Array.from(row.cells || []).reduce((sum, cell) => sum + (Number(cell.colSpan) || 1), 0);
  }

  function estimateTableMinWidth(table){
    const cols = getColumnCount(table);
    const viewport = Math.max(window.innerWidth || 360, 320);
    const base = cols >= 12 ? 92 : cols >= 8 ? 104 : 118;
    const estimated = cols ? cols * base : table.scrollWidth;
    const natural = Math.max(table.scrollWidth || 0, table.offsetWidth || 0, estimated || 0);
    return Math.max(viewport - 18, natural, cols >= 5 ? 640 : 0);
  }

  function prepareTableForMobile(table){
    if(!table || isIgnoredTable(table)) return;
    table.classList.add('rf-mobile-wide-table');
    const minWidth = estimateTableMinWidth(table);
    if(minWidth > 0){
      table.style.minWidth = `${Math.ceil(minWidth)}px`;
    }
    table.style.width = 'max-content';
    table.style.maxWidth = 'none';
    table.style.tableLayout = 'auto';
  }

  function markExistingTableContainers(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('table').forEach((table) => {
      if(isIgnoredTable(table)) return;
      prepareTableForMobile(table);
      const container = table.closest(tableScrollContainerSelector());
      if(container){
        container.classList.add('rf-mobile-table-scroll');
        let parent = container.parentElement;
        let hops = 0;
        while(parent && parent !== document.body && hops < 3){
          parent.setAttribute('data-rf-mobile-scroll-parent', '1');
          parent = parent.parentElement;
          hops += 1;
        }
      }
    });
  }

  function wrapFreeTables(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    document.querySelectorAll('table').forEach((table) => {
      if(!shouldWrapTable(table)) return;
      const parent = table.parentElement;
      if(!parent) return;
      prepareTableForMobile(table);
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



  function ensureLateMobileOverrideStyle(){
    if(document.getElementById('rf-mobile-late-override-style')) return;
    const style = document.createElement('style');
    style.id = 'rf-mobile-late-override-style';
    style.textContent = `
@media (max-width: 1024px), (pointer: coarse){
  :root{ --kad-shell-peek:10px !important; }
  html,body,body.rf-mobile,body.rf-mobile.kad-shell-mounted{ width:100vw !important; max-width:100vw !important; min-width:0 !important; height:auto !important; min-height:100dvh !important; overflow-x:auto !important; overflow-y:auto !important; -webkit-overflow-scrolling:touch !important; }
  body.rf-mobile.kad-shell-mounted .kad-shell-page-content, body.rf-mobile.kad-shell-mounted.kad-shell-open .kad-shell-page-content, body.rf-mobile.kad-shell-mounted.kad-shell-submenu .kad-shell-page-content{ margin-left:0 !important; width:100vw !important; max-width:100vw !important; min-width:0 !important; height:auto !important; min-height:100dvh !important; overflow:visible !important; padding-left:14px !important; padding-right:8px !important; box-sizing:border-box !important; }
  body.rf-mobile #kadNavShellRoot .kad-shell-edge-sensor{ width:14px !important; }
  body.rf-mobile #kadNavShellRoot .kad-shell{ width:min(86vw,330px) !important; max-width:min(86vw,330px) !important; transform:translateX(calc(-100% + 10px)) !important; border-radius:0 16px 16px 0 !important; }
  body.rf-mobile #kadNavShellRoot.is-open .kad-shell, body.rf-mobile #kadNavShellRoot.has-submenu .kad-shell{ transform:translateX(0) !important; width:min(86vw,330px) !important; max-width:min(86vw,330px) !important; }
  body.rf-mobile :is(.topbar,.filtersBar,.pills,.wrap,.sheet,.mainTableBlock,.summarySection,.summaryGrid,.analyticsCards,.summaryFiltersBar,.card,.panel,.subpanel,.table-panel,.table-shell,.table-card){ width:100% !important; max-width:100% !important; min-width:0 !important; box-sizing:border-box !important; }
  body.rf-mobile :is(.wrap,.sheet,.mainTableBlock,.summarySection,.table-panel,.table-shell,.table-card){ overflow:visible !important; }
  body.rf-mobile :is(#tableWrap,.tableWrap,.tablewrap,.table-wrap,.table-scroll,.tableScroll,.rf-mobile-table-scroll,.table-panel,.table-shell,.table-card,.summaryWrap,.sumWrap,.sideTableWrap,.matrix-wrap,.ranking-wrap,.excel-scroll,.data-scroll,.grid-scroll,.list-scroll){ display:block !important; width:100% !important; max-width:100% !important; min-width:0 !important; overflow-x:auto !important; overflow-y:auto !important; -webkit-overflow-scrolling:touch !important; touch-action:pan-x pan-y !important; overscroll-behavior:contain !important; box-sizing:border-box !important; }
  body.rf-mobile #tableWrap{ max-height:70dvh !important; }
  body.rf-mobile :is(.tableInner,#tableInner,.fit-table,.table-fit){ width:max-content !important; min-width:100% !important; max-width:none !important; transform:none !important; height:auto !important; }
  body.rf-mobile :is(table,#tblHead,#tblBody,.rf-mobile-wide-table){ width:max-content !important; min-width:100% !important; max-width:none !important; table-layout:auto !important; }
  body.rf-mobile :is(table,#tblHead,#tblBody) :is(th,td){ white-space:nowrap !important; }
  body.rf-mobile :is(.mainTotalBar,.summaryFiltersBar,.filtersBar){ width:100% !important; max-width:100% !important; box-sizing:border-box !important; }
}`;
    (document.head || document.documentElement).appendChild(style);
  }

  function forceMobileScrollers(){
    if(!document.body || !document.body.classList.contains('rf-mobile')) return;
    const sels = ['#tableWrap','.tableWrap','.tablewrap','.table-wrap','.tableScroll','.table-scroll','.summaryWrap','.sumWrap','.sideTableWrap','.matrix-wrap','.ranking-wrap','.excel-scroll','.data-scroll','.grid-scroll','.list-scroll','.rf-mobile-table-scroll'];
    document.querySelectorAll(sels.join(',')).forEach((el) => {
      el.style.overflowX = 'auto';
      el.style.overflowY = 'auto';
      el.style.webkitOverflowScrolling = 'touch';
      el.style.maxWidth = '100%';
      el.style.minWidth = '0';
      el.style.width = '100%';
      el.style.boxSizing = 'border-box';
    });
    document.querySelectorAll('#tableInner,.tableInner,.table-fit,.fit-table').forEach((el) => {
      el.style.width = 'max-content';
      el.style.minWidth = '100%';
      el.style.maxWidth = 'none';
      el.style.transform = 'none';
    });
    document.querySelectorAll('table,#tblHead,#tblBody').forEach((table) => {
      prepareTableForMobile(table);
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
    ensureMobileCssLoaded();
    ensureLateMobileOverrideStyle();
    updateViewportVars();
    enforceUnscaledTables();
    wrapFreeTables();
    markExistingTableContainers();
    neutralizeStickyInsideScroll();
    forceMobileScrollers();
    attachScaleObserver();
    dispatchMobileLayoutEvent();
    window.setTimeout(forceMobileScrollers, 250);
    window.setTimeout(forceMobileScrollers, 900);
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
