(function (window) {
  'use strict';

  window.RF_CONFIG = Object.freeze({
    APP_NAME: 'ERP Forja / Raport Forja',
    SUPABASE_URL: 'https://addlybnigrywqowpbhvd.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4',
    ADMIN_EMAIL: 'forja.editor@gmail.com',
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
      'lpi'
    ]
  });

  window.RF_SUPABASE_URL = window.RF_CONFIG.SUPABASE_URL;
  window.RF_SUPABASE_ANON_KEY = window.RF_CONFIG.SUPABASE_ANON_KEY;
})(window);