(function(){
  'use strict';
  const cfg = window.RF_CONFIG || window.__RF_CONFIG__ || {};
  window.ERP_FORJA_CONFIG = Object.freeze({
    SUPABASE_URL: cfg.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: cfg.SUPABASE_ANON_KEY || '',
    ADMIN_EMAIL: cfg.ADMIN_EMAIL || 'forja.editor@gmail.com',
    ENABLE_REALTIME: Boolean(cfg.ENABLE_REALTIME),
    SYNC: cfg.SYNC || {}
  });
})();
