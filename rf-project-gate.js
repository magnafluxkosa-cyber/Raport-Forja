(function(window){
  'use strict';
  function buildNext(next){ return next || 'login.html'; }
  window.RFProjectGate = {
    hasAccess: function(){ return true; },
    redirectToGate: function(_project, next){ window.location.href = buildNext(next); },
    grantAccess: function(){ return true; },
    clearAccess: function(){},
    getLockState: function(){ return { locked:false, remainingMs:0 }; },
    validatePin: function(){ return { ok:true }; }
  };
})(window);
