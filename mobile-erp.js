(function(){
  const MOBILE_WIDTH = 900;

  function isMobileViewport(){
    return window.innerWidth <= MOBILE_WIDTH || (window.matchMedia && window.matchMedia('(pointer:coarse) and (max-width: 1024px)').matches);
  }

  function updateViewportVars(){
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--rf-vh', `${vh}px`);
  }

  function applyMobileClass(){
    if(!document.body) return;
    document.body.classList.toggle('rf-mobile', isMobileViewport());
    updateViewportVars();
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
