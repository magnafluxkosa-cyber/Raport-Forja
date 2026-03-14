(function (window) {
  'use strict';

  var PAGE_LIST = [
    { page_key: 'index', page_name: 'Dashboard / Index' },
    { page_key: 'login', page_name: 'Login' },
    { page_key: 'helper-data', page_name: 'Helper Data' },
    { page_key: 'helper-acl', page_name: 'Helper ACL' },
    { page_key: 'numeralkod', page_name: 'Numeral KOD' },
    { page_key: 'intrari-otel', page_name: 'Intrări Oțel' },
    { page_key: 'debitate', page_name: 'Debitate' },
    { page_key: 'forjate', page_name: 'Forjate' },
    { page_key: 'program-utilaje', page_name: 'Program Utilaje' },
    { page_key: 'magnaflux', page_name: 'Magnaflux' },
    { page_key: 'probleme-raportate', page_name: 'Probleme Raportate' },
    { page_key: 'rebut', page_name: 'Rebut' },
    { page_key: 'kpi', page_name: 'KPI' },
    { page_key: 'inventar-otel', page_name: 'Inventar Oțel' },
    { page_key: 'inventar-debitat', page_name: 'Inventar Debitat' },
    { page_key: 'inventar-forjat', page_name: 'Inventar Forjat' },
    { page_key: 'planificare-forja', page_name: 'Planificare Forjă' },
    { page_key: 'comenzi-livrare', page_name: 'Comenzi Livrare' },
    { page_key: 'zale-9k-6628-29', page_name: '9K-6628/29' },
    { page_key: 'zale-229-6909-10', page_name: '229-6909/10' },
    { page_key: 'zale-503-0761-62', page_name: '503-0761/62' },
    { page_key: 'zale-106-1625-26', page_name: '106-1625/26' },
    { page_key: 'zale-378-8241-42', page_name: '378-8241/42' },
    { page_key: 'zale-248-2307-08', page_name: '248-2307/08' },
    { page_key: 'zale-417-3595-96', page_name: '417-3595/96' },
    { page_key: 'zale-418-2091-92', page_name: '418-2091/92' },
    { page_key: 'ambalare-9k-6628-29', page_name: 'Ambalare 9K-6628/29' },
    { page_key: 'ambalare-229-6909-10', page_name: 'Ambalare 229-6909/10' },
    { page_key: 'ambalare-503-0761-62', page_name: 'Ambalare 503-0761/62' },
    { page_key: 'ambalare-106-1625-26', page_name: 'Ambalare 106-1625/26' },
    { page_key: 'ambalare-378-8241-42', page_name: 'Ambalare 378-8241/42' },
    { page_key: 'ambalare-248-2307-08', page_name: 'Ambalare 248-2307/08' },
    { page_key: 'ambalare-417-3595-96', page_name: 'Ambalare 417-3595/96' },
    { page_key: 'ambalare-418-2091-92', page_name: 'Ambalare 418-2091/92' }
  ];

  var PAGE_MAP = Object.create(null);
  PAGE_LIST.forEach(function (page) { PAGE_MAP[page.page_key] = page.page_name; });

  function clonePages() {
    return PAGE_LIST.map(function (page) {
      return Object.freeze({ page_key: page.page_key, page_name: page.page_name });
    });
  }

  var CONFIG = Object.freeze({
    APP_NAME: 'ERP Forja / Raport Forja',
    SUPABASE_URL: 'https://addlybnigrywqowpbhvd.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4',
    ADMIN_EMAIL: 'forja.editor@gmail.com',
    DEFAULT_PAGES: PAGE_LIST.map(function (page) { return page.page_key; }),
    pages: clonePages()
  });

  function getAuthOptions(extra) {
    return Object.assign({ persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }, extra || {});
  }

  function createRfSupabaseClient(options) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase library is not loaded.');
    }
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: getAuthOptions(options && options.auth)
    });
  }

  function safeLower(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeRole(value) {
    var role = safeLower(value);
    return role || 'viewer';
  }

  function normalizeHref(value) {
    return String(value || '').split('#')[0].split('?')[0];
  }

  function pageKeyToHref(pageKey) {
    var key = String(pageKey || '').trim();
    if (!key) return '';
    if (key === 'index') return 'index.html';
    if (key === 'login') return 'login.html';
    return key + '.html';
  }

  function inferPageKey(pathname) {
    var path = String(pathname || window.location.pathname || '');
    var file = path.split('/').pop() || 'index.html';
    file = normalizeHref(file);
    if (!file || file === 'index' || file === 'index.html') return 'index';
    if (file === 'login' || file === 'login.html') return 'login';
    if (!/\.html$/i.test(file)) return file.replace(/\.html$/i, '');
    return file.replace(/\.html$/i, '');
  }

  var INITIAL_PAGE_KEY = inferPageKey(window.location.pathname);

  function ensureAclPendingStyle() {
    if (document.getElementById('rf-acl-pending-style')) return;
    var style = document.createElement('style');
    style.id = 'rf-acl-pending-style';
    style.textContent = [
      'html.rf-acl-pending body{visibility:hidden !important;}',
      'html.rf-acl-denied body{visibility:visible !important;}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function setAclPendingState(enabled) {
    try {
      ensureAclPendingStyle();
      if (!document.documentElement) return;
      if (enabled) document.documentElement.classList.add('rf-acl-pending');
      else document.documentElement.classList.remove('rf-acl-pending');
    } catch (_) {}
  }

  function renderAccessDeniedPage(pageKey, message) {
    function mount() {
      try {
        document.documentElement.classList.remove('rf-acl-pending');
        document.documentElement.classList.add('rf-acl-denied');
        if (!document.body) return false;
        var pageName = PAGE_MAP[String(pageKey || '').trim()] || String(pageKey || '').trim() || 'această pagină';
        var safeMessage = String(message || 'Nu ai acces în această pagină.');
        document.body.innerHTML = '' +
          '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;">' +
            '<div style="width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;">' +
              '<div style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;">Acces restricționat</div>' +
              '<div style="font-size:18px;font-weight:700;margin:0 0 10px;">' + pageName + '</div>' +
              '<div style="font-size:16px;line-height:1.5;margin:0 0 22px;">' + safeMessage + '</div>' +
              '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
                '<a href="index.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#3d73b9;color:#fff;font-weight:700;">Înapoi la Dashboard</a>' +
                '<a href="login.html" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;">Schimbă utilizatorul</a>' +
              '</div>' +
            '</div>' +
          '</div>' ;
        return true;
      } catch (_) {
        return false;
      }
    }
    if (!mount()) {
      document.addEventListener('DOMContentLoaded', function once() {
        document.removeEventListener('DOMContentLoaded', once);
        mount();
      });
    }
  }

  if (INITIAL_PAGE_KEY && INITIAL_PAGE_KEY !== 'index' && INITIAL_PAGE_KEY !== 'login') {
    setAclPendingState(true);
  }

  async function resolveRole(client, user) {
    var email = safeLower(user && user.email);
    if (email && email === safeLower(CONFIG.ADMIN_EMAIL)) {
      return { role: 'admin', source: 'admin hardcoded' };
    }
    if (!client || !user || !user.id) {
      return { role: 'viewer', source: 'fallback viewer' };
    }

    try {
      var a = await client.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      if (!a.error && a.data && a.data.role) return { role: normalizeRole(a.data.role), source: 'profiles.user_id' };
    } catch (_) {}

    try {
      var b = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!b.error && b.data && b.data.role) return { role: normalizeRole(b.data.role), source: 'profiles.id' };
    } catch (_) {}

    if (email) {
      try {
        var c = await client.from('rf_acl').select('role').eq('email', email).maybeSingle();
        if (!c.error && c.data && c.data.role) return { role: normalizeRole(c.data.role), source: 'rf_acl' };
      } catch (_) {}
    }

    return { role: 'viewer', source: 'fallback viewer' };
  }

  async function loadPagePermissionMap(client, role) {
    if (!client) return null;
    try {
      var res = await client.from('page_permissions').select('page_key,can_view').eq('role', normalizeRole(role));
      if (res.error || !Array.isArray(res.data)) return null;
      var map = new Map();
      res.data.forEach(function (row) {
        var key = String(row.page_key || '').trim();
        if (!key) return;
        map.set(key, row.can_view === true);
      });
      return map;
    } catch (_) {
      return null;
    }
  }

  async function readDashboardAclMirror(client) {
    if (!client) return null;
    try {
      var a = await client.from('rf_documents').select('content').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
      if (!a.error && a.data && a.data.content && typeof a.data.content === 'object') return a.data.content;
    } catch (_) {}
    try {
      var b = await client.from('rf_documents').select('data').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
      if (!b.error && b.data && b.data.data && typeof b.data.data === 'object') return b.data.data;
    } catch (_) {}
    return null;
  }

  function collectAclDecisions(opts) {
    var decisions = [];
    var pageKey = String(opts.pageKey || '').trim();
    var href = normalizeHref(opts.href);
    var role = normalizeRole(opts.role);
    var map = opts.permissionMap instanceof Map ? opts.permissionMap : null;
    var mirror = opts.mirror && typeof opts.mirror === 'object' ? opts.mirror : null;

    if (map && pageKey && map.has(pageKey)) {
      decisions.push(map.get(pageKey) === true);
    }

    if (mirror) {
      var pagePermissions = mirror.page_permissions && typeof mirror.page_permissions === 'object' ? mirror.page_permissions : null;
      var rolePermissions = pagePermissions && pagePermissions[role] && typeof pagePermissions[role] === 'object' ? pagePermissions[role] : null;
      if (rolePermissions && pageKey && Object.prototype.hasOwnProperty.call(rolePermissions, pageKey)) {
        var permValue = rolePermissions[pageKey];
        if (permValue && typeof permValue === 'object' && Object.prototype.hasOwnProperty.call(permValue, 'can_view')) {
          decisions.push(permValue.can_view === true);
        } else {
          decisions.push(permValue === true);
        }
      }

      var grants = mirror.grants && typeof mirror.grants === 'object' ? mirror.grants : null;
      var roleGrants = grants && grants[role] && typeof grants[role] === 'object' ? grants[role] : null;
      if (roleGrants) {
        if (pageKey && Object.prototype.hasOwnProperty.call(roleGrants, pageKey)) {
          decisions.push(roleGrants[pageKey] === true);
        }
        if (href && Object.prototype.hasOwnProperty.call(roleGrants, href)) {
          decisions.push(roleGrants[href] === true);
        }
      }
    }

    return decisions;
  }

  async function canViewPage(pageKey, options) {
    var key = String(pageKey || '').trim();
    var href = pageKeyToHref(key);
    var client = options && options.client ? options.client : createRfSupabaseClient();
    var user = options && options.user ? options.user : null;

    if (key === 'login') {
      return { allowed: true, role: 'viewer', source: 'login open' };
    }

    if (!user) {
      try {
        var sessionRes = await client.auth.getSession();
        user = sessionRes && sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
      } catch (_) {
        user = null;
      }
    }

    if (!user) {
      return { allowed: true, role: 'viewer', source: 'no session fallback' };
    }

    var resolved = await resolveRole(client, user);
    var role = normalizeRole(resolved.role);
    if (role === 'admin') {
      return { allowed: true, role: role, source: resolved.source };
    }

    var permissionMap = await loadPagePermissionMap(client, role);
    var mirror = await readDashboardAclMirror(client);
    var decisions = collectAclDecisions({ pageKey: key, href: href, role: role, permissionMap: permissionMap, mirror: mirror });

    if (decisions.indexOf(false) !== -1) {
      return { allowed: false, role: role, source: 'acl explicit false', message: 'Nu ai acces în această foaie. Cere acces de la admin.' };
    }
    if (decisions.indexOf(true) !== -1) {
      return { allowed: true, role: role, source: 'acl explicit true' };
    }

    return { allowed: true, role: role, source: 'acl fallback allow' };
  }

  window.RF_CONFIG = CONFIG;
  window.RF_SUPABASE_URL = CONFIG.SUPABASE_URL;
  window.RF_SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  window.RF_ADMIN_EMAIL = CONFIG.ADMIN_EMAIL;
  window.RF_PAGES = clonePages();
  window.getRfSupabaseConfig = window.getRfSupabaseConfig || function () {
    return { url: CONFIG.SUPABASE_URL, anonKey: CONFIG.SUPABASE_ANON_KEY, auth: getAuthOptions() };
  };
  window.createRfSupabaseClient = window.createRfSupabaseClient || createRfSupabaseClient;
  window.RF_ACL = window.RF_ACL || {};
  window.RF_ACL.PAGE_LIST = clonePages();
  window.RF_ACL.PAGE_MAP = PAGE_MAP;
  window.RF_ACL.safeLower = safeLower;
  window.RF_ACL.normalizeRole = normalizeRole;
  window.RF_ACL.normalizeHref = normalizeHref;
  window.RF_ACL.pageKeyToHref = pageKeyToHref;
  window.RF_ACL.inferPageKey = inferPageKey;
  window.RF_ACL.resolveRole = resolveRole;
  window.RF_ACL.loadPagePermissionMap = loadPagePermissionMap;
  window.RF_ACL.readDashboardAclMirror = readDashboardAclMirror;
  window.RF_ACL.collectAclDecisions = collectAclDecisions;
  window.RF_ACL.canViewPage = canViewPage;

  if (!window.__RF_AUTO_ACL_GUARD__) {
    window.__RF_AUTO_ACL_GUARD__ = true;
    Promise.resolve().then(async function () {
      var pageKey = INITIAL_PAGE_KEY || inferPageKey(window.location.pathname);
      try {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
          setAclPendingState(false);
          return;
        }
        if (!pageKey || pageKey === 'index' || pageKey === 'login') {
          setAclPendingState(false);
          return;
        }
        var client = createRfSupabaseClient();
        var result = await canViewPage(pageKey, { client: client });
        if (result.allowed) {
          setAclPendingState(false);
          return;
        }
        try { sessionStorage.setItem('rf_acl_denied_message', result.message || 'Nu ai acces în această foaie.'); } catch (_) {}
        renderAccessDeniedPage(pageKey, result.message || 'Nu ai acces în această pagină. Doar adminul are acces sau trebuie să primești permisiune.');
      } catch (_) {
        setAclPendingState(false);
      }
    });
  }
})(window);
