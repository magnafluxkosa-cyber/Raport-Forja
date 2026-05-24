(function(){
  'use strict';

  /*
    Config comun K.A.D pentru Supabase.
    Sursa principală este RF_CONFIG din rf-config.js.
    Aici nu se păstrează service_role și nu se dublează cheia în clar.
  */

  var rf = window.RF_CONFIG || {};
  window.ERP_FORJA_CONFIG = window.ERP_FORJA_CONFIG || {};
  window.ERP_FORJA_CONFIG.SUPABASE_URL = rf.SUPABASE_URL || window.ERP_FORJA_CONFIG.SUPABASE_URL || 'https://addlybnigrywqowpbhvd.supabase.co';
  window.ERP_FORJA_CONFIG.SUPABASE_ANON_KEY = rf.SUPABASE_ANON_KEY || window.ERP_FORJA_CONFIG.SUPABASE_ANON_KEY || '';
})();
