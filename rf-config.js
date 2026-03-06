(function (global) {
  'use strict';

  const RF_CONFIG = Object.freeze({
    app: Object.freeze({
      name: 'ERP Forjă / Raport Forja',
      version: '1.0.0',
      environment: 'production'
    }),

    supabase: Object.freeze({
      url: 'https://addlybnigrywqowpbhvd.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4'
    }),

    auth: Object.freeze({
      adminEmail: 'forja.editor@gmail.com',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }),

    storageKeys: Object.freeze({
      roleCache: 'rf_role_cache'
    }),

    pages: Object.freeze([
      Object.freeze({ page_key: 'index', page_name: 'Index' }),
      Object.freeze({ page_key: 'helper', page_name: 'Helper' }),
      Object.freeze({ page_key: 'helper-data', page_name: 'Helper Data' }),
      Object.freeze({ page_key: 'helper-acl', page_name: 'Helper ACL' }),
      Object.freeze({ page_key: 'numeralkod', page_name: 'Numeral KOD' }),
      Object.freeze({ page_key: 'intrari-otel', page_name: 'Intrări Oțel' }),
      Object.freeze({ page_key: 'debitate', page_name: 'Debitate' }),
      Object.freeze({ page_key: 'forjate', page_name: 'Forjate' }),
      Object.freeze({ page_key: 'magnaflux', page_name: 'Magnaflux' })
    ])
  });

  function getRfSupabaseConfig() {
    return {
      url: RF_CONFIG.supabase.url,
      anonKey: RF_CONFIG.supabase.anonKey,
      auth: {
        persistSession: RF_CONFIG.auth.persistSession,
        autoRefreshToken: RF_CONFIG.auth.autoRefreshToken,
        detectSessionInUrl: RF_CONFIG.auth.detectSessionInUrl
      }
    };
  }

  function createRfSupabaseClient(options) {
    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      throw new Error('Supabase library is not loaded. Include @supabase/supabase-js before rf-config.js usage.');
    }

    const cfg = getRfSupabaseConfig();
    return global.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: Object.assign({}, cfg.auth, options && options.auth ? options.auth : {})
    });
  }

  global.RF_CONFIG = RF_CONFIG;
  global.RF_SUPABASE = Object.freeze({
    url: RF_CONFIG.supabase.url,
    anonKey: RF_CONFIG.supabase.anonKey
  });

  global.RF_SUPABASE_URL = RF_CONFIG.supabase.url;
  global.RF_SUPABASE_ANON_KEY = RF_CONFIG.supabase.anonKey;
  global.RF_ADMIN_EMAIL = RF_CONFIG.auth.adminEmail;
  global.RF_PAGES = RF_CONFIG.pages.slice();
  global.getRfSupabaseConfig = getRfSupabaseConfig;
  global.createRfSupabaseClient = createRfSupabaseClient;
})(window);
