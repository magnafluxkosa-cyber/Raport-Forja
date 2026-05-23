(function(window, document){
  'use strict';
  try { document.documentElement.removeAttribute('data-kad-security-pending'); } catch(_) {}
  try { document.documentElement.removeAttribute('data-kad-security-denied'); } catch(_) {}
  try { document.documentElement.setAttribute('data-kad-security-ready','1'); } catch(_) {}
  window.KADSecurityGuard = {
    ready: Promise.resolve(true),
    getState: function(){ return { allowed:true, ready:true, passive:true }; },
    clearGateAccess: function(){}
  };
})(window, document);
