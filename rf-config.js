(function (window) {
  'use strict';

  const RF_CONFIG = Object.freeze({
    APP_NAME: 'ERP Forja / Raport Forja',
    SUPABASE_URL: 'https://addlybnigrywqowpbhvd.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4',
    ADMIN_EMAIL: 'forja.editor@gmail.com',
    ENABLE_REALTIME: false,
    SYNC: Object.freeze({
      FORJATE_META_POLL_MS: 20000,
      FORJATE_HELPERS_POLL_MS: 60000,
      FORJATE_PUSH_DEBOUNCE_MS: 2500,
      DEBITATE_POLL_MS: 20000,
      DEBITATE_HELPERS_POLL_MS: 60000,
      DEBITATE_PUSH_DEBOUNCE_MS: 2000,
      NUMERALKOD_POLL_MS: 15000,
      NUMERALKOD_PUSH_DEBOUNCE_MS: 2000,
      INTRARI_POLL_MS: 45000,
      MAGNAFLUX_META_POLL_MS: 45000,
      KPI_POLL_MS: 60000,
      KPI_DEBOUNCE_MS: 800,
      PROBLEME_REFRESH_MS: 45000,
      PROBLEME_SAVE_DEBOUNCE_MS: 12000
    }),
    DEFAULT_PAGES: [
      'index',
      'login',
      'helper',
      'helper-data',
      'helper-acl',
      'numeralkod',
      'intrari-otel',
      'debitate',
      'forjate',
      'magnaflux',
      'kpi',
      'probleme-raportate'
    ]
  });

  window.RF_CONFIG = RF_CONFIG;
  window.__RF_CONFIG__ = RF_CONFIG;
  window.RF_SUPABASE_URL = RF_CONFIG.SUPABASE_URL;
  window.RF_SUPABASE_ANON_KEY = RF_CONFIG.SUPABASE_ANON_KEY;
  window.ERP_FORJA_CONFIG = Object.freeze({
    SUPABASE_URL: RF_CONFIG.SUPABASE_URL,
    SUPABASE_ANON_KEY: RF_CONFIG.SUPABASE_ANON_KEY,
    ADMIN_EMAIL: RF_CONFIG.ADMIN_EMAIL,
    ENABLE_REALTIME: RF_CONFIG.ENABLE_REALTIME,
    SYNC: RF_CONFIG.SYNC
  });

  window.createRfSupabaseClient = function createRfSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Biblioteca Supabase nu s-a încărcat.');
    }
    return window.supabase.createClient(RF_CONFIG.SUPABASE_URL, RF_CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: { eventsPerSecond: RF_CONFIG.ENABLE_REALTIME ? 2 : 0 }
      }
    });
  };
})(window);
