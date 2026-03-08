(function (window) {
  'use strict';

  var DEFAULT_PAGES = [
    'index','login','helper-data','helper-acl',
    'group-rapoarte','numeralkod','intrari-otel','debitate','forjate','program-utilaje','magnaflux',
    'group-zale','zale-9k-6628-29','zale-229-6909-10','zale-503-0761-62','zale-106-1625-26','zale-378-8241-42','zale-248-2307-08','zale-417-3595-96','zale-418-2091-92',
    'ambalare-9k-6628-29','ambalare-229-6909-10','ambalare-503-0761-62','ambalare-106-1625-26','ambalare-378-8241-42','ambalare-248-2307-08','ambalare-417-3595-96','ambalare-418-2091-92',
    'probleme-raportate','rebut','kpi','group-inventar','inventar-otel','inventar-debitat','inventar-forjat'
  ];

  window.RF_CONFIG = Object.freeze({
    APP_NAME: 'ERP Forja / Raport Forja',
    SUPABASE_URL: 'https://addlybnigrywqowpbhvd.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4',
    ADMIN_EMAIL: 'forja.editor@gmail.com',
    DEFAULT_PAGES: DEFAULT_PAGES.slice()
  });

  window.RF_SUPABASE_URL = window.RF_CONFIG.SUPABASE_URL;
  window.RF_SUPABASE_ANON_KEY = window.RF_CONFIG.SUPABASE_ANON_KEY;

  window.getRfSupabaseConfig = window.getRfSupabaseConfig || function(){ return window.RF_CONFIG; };
  window.createRfSupabaseClient = window.createRfSupabaseClient || function(){
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    return window.supabase.createClient(window.RF_SUPABASE_URL, window.RF_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 2 } }
    });
  };
})(window);
