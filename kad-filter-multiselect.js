/* K.A.D - emergency unblock for global multiselect filter.
   This file intentionally does not modify any page at load time.
   It keeps the public API so existing pages that reference it do not break. */
(function(){
  'use strict';
  window.KAD_MULTI_FILTER = {
    __installed: true,
    __disabled: true,
    __version: '2026-06-03-emergency-unblock-noop',
    refresh: function(){},
    rescan: function(){},
    clearAll: function(){},
    values: function(){ return []; },
    hasMulti: function(){ return false; },
    matches: function(){ return true; },
    scanDone: function(){ return true; }
  };
})();
