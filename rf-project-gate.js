(function (window) {
  'use strict';

  var STORAGE_KEY = 'rf_project_gate_access';
  var SESSION_KEY = 'rf_project_gate_access_session';
  var DEFAULT_TTL_HOURS = 12;

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function safeGet(store, key) {
    try { return store.getItem(key); } catch (_) { return null; }
  }

  function safeSet(store, key, value) {
    try { store.setItem(key, value); } catch (_) {}
  }

  function safeRemove(store, key) {
    try { store.removeItem(key); } catch (_) {}
  }

  function nowMs() {
    return Date.now();
  }

  function normalizeValue(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalizePin(value) {
    return normalizeValue(value).replace(/\s+/g, '');
  }

  function ensureConfig() {
    var cfg = window.RF_PROJECT_GATE_CONFIG || {};
    var projects = Array.isArray(cfg.projects) ? cfg.projects.slice() : [];
    return {
      defaultTtlHours: Number(cfg.defaultTtlHours) > 0 ? Number(cfg.defaultTtlHours) : DEFAULT_TTL_HOURS,
      projects: projects.map(function (project) {
        return {
          projectKey: normalizeValue(project && project.projectKey).toLowerCase(),
          label: normalizeValue(project && project.label),
          pin: normalizePin(project && project.pin),
          destination: normalizeValue(project && project.destination) || 'login.html',
          description: normalizeValue(project && project.description)
        };
      }).filter(function (project) {
        return project.projectKey && project.pin && project.destination;
      })
    };
  }

  function readStoredAccess() {
    var payload = safeParse(safeGet(window.sessionStorage, SESSION_KEY)) || safeParse(safeGet(window.localStorage, STORAGE_KEY));
    if (!payload || typeof payload !== 'object') return null;
    var expiresAt = Number(payload.expiresAt || 0);
    if (!expiresAt || expiresAt <= nowMs()) {
      clearAccess();
      return null;
    }
    return payload;
  }

  function clearAccess() {
    safeRemove(window.sessionStorage, SESSION_KEY);
    safeRemove(window.localStorage, STORAGE_KEY);
  }

  function storeAccess(project) {
    var cfg = ensureConfig();
    var ttlHours = cfg.defaultTtlHours;
    var grantedAt = nowMs();
    var expiresAt = grantedAt + ttlHours * 60 * 60 * 1000;
    var payload = {
      projectKey: project.projectKey,
      label: project.label,
      destination: project.destination,
      grantedAt: grantedAt,
      expiresAt: expiresAt
    };
    var raw = JSON.stringify(payload);
    safeSet(window.sessionStorage, SESSION_KEY, raw);
    safeSet(window.localStorage, STORAGE_KEY, raw);
    return payload;
  }

  function getProjectByPin(pin) {
    var normalizedPin = normalizePin(pin);
    if (!normalizedPin) return null;
    var cfg = ensureConfig();
    for (var i = 0; i < cfg.projects.length; i += 1) {
      if (cfg.projects[i].pin === normalizedPin) return cfg.projects[i];
    }
    return null;
  }

  function getProject(projectKey) {
    var cleanKey = normalizeValue(projectKey).toLowerCase();
    if (!cleanKey) return null;
    var cfg = ensureConfig();
    for (var i = 0; i < cfg.projects.length; i += 1) {
      if (cfg.projects[i].projectKey === cleanKey) return cfg.projects[i];
    }
    return null;
  }

  function hasAccess(projectKey) {
    var access = readStoredAccess();
    var cleanKey = normalizeValue(projectKey).toLowerCase();
    return Boolean(access && cleanKey && access.projectKey === cleanKey);
  }

  function buildGateUrl(expectedProjectKey, next) {
    var parts = ['access-gate.html'];
    var query = [];
    if (expectedProjectKey) query.push('project=' + encodeURIComponent(normalizeValue(expectedProjectKey).toLowerCase()));
    if (next) query.push('next=' + encodeURIComponent(normalizeValue(next)));
    if (query.length) parts.push('?' + query.join('&'));
    return parts.join('');
  }

  function redirectToGate(expectedProjectKey, next) {
    var target = buildGateUrl(expectedProjectKey, next);
    try { window.location.replace(target); }
    catch (_) { window.location.href = target; }
  }

  function requireAccess(projectKey, next) {
    if (hasAccess(projectKey)) return true;
    redirectToGate(projectKey, next);
    return false;
  }

  function resolvePin(pin) {
    var project = getProjectByPin(pin);
    if (!project) return { ok: false, reason: 'PIN invalid' };
    var access = storeAccess(project);
    return { ok: true, project: project, access: access };
  }

  window.RFProjectGate = {
    normalizePin: normalizePin,
    getConfig: ensureConfig,
    getProjectByPin: getProjectByPin,
    getProject: getProject,
    readStoredAccess: readStoredAccess,
    clearAccess: clearAccess,
    hasAccess: hasAccess,
    requireAccess: requireAccess,
    resolvePin: resolvePin,
    redirectToGate: redirectToGate,
    buildGateUrl: buildGateUrl
  };
})(window);
