(function (window) {
  'use strict';

  var STORAGE_KEY = 'rf_project_gate_access';
  var SESSION_KEY = 'rf_project_gate_access_session';
  var DEFAULT_TTL_HOURS = 12;
  var DEFAULT_CONFIG = {
    defaultTtlHours: 12,
    projects: [
      {
        projectKey: 'kad',
        label: 'ERP Forja / K.A.D',
        pin: '2580',
        destination: 'login.html',
        description: 'PIN-ul principal pentru proiectul ERP Forja / K.A.D.',
        destinationLabel: 'Login K.A.D'
      },
      {
        projectKey: 'proiect-2',
        label: 'Proiect 2',
        pin: '7412',
        destination: 'proiect-2/index.html',
        description: 'Exemplu pregătit pentru un proiect viitor. Schimbă eticheta, PIN-ul și destinația.',
        destinationLabel: 'proiect-2/index.html'
      },
      {
        projectKey: 'proiect-3',
        label: 'Proiect 3',
        pin: '9631',
        destination: 'proiect-3/index.html',
        description: 'Al treilea slot pregătit pentru alt proiect sau alt portal.',
        destinationLabel: 'proiect-3/index.html'
      }
    ]
  };

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

  function normalizeProject(project, fallbackIndex) {
    var normalizedKey = normalizeValue(project && project.projectKey).toLowerCase();
    return {
      projectKey: normalizedKey || ('project-' + String(fallbackIndex || 0)),
      label: normalizeValue(project && project.label) || ('Proiect ' + String(fallbackIndex || 0)),
      pin: normalizePin(project && project.pin),
      destination: normalizeValue(project && project.destination) || 'login.html',
      description: normalizeValue(project && project.description),
      destinationLabel: normalizeValue(project && project.destinationLabel) || normalizeValue(project && project.destination) || 'Destinație proiect'
    };
  }

  function ensureConfig() {
    var cfg = window.RF_PROJECT_GATE_CONFIG || DEFAULT_CONFIG;
    var projects = Array.isArray(cfg.projects) ? cfg.projects.slice() : [];
    if (!projects.length) projects = DEFAULT_CONFIG.projects.slice();
    return {
      defaultTtlHours: Number(cfg.defaultTtlHours) > 0 ? Number(cfg.defaultTtlHours) : DEFAULT_TTL_HOURS,
      projects: projects.map(function (project, index) {
        return normalizeProject(project, index + 1);
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
      destinationLabel: project.destinationLabel,
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

  function listProjects() {
    return ensureConfig().projects.slice();
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
    listProjects: listProjects,
    readStoredAccess: readStoredAccess,
    clearAccess: clearAccess,
    hasAccess: hasAccess,
    requireAccess: requireAccess,
    resolvePin: resolvePin,
    redirectToGate: redirectToGate,
    buildGateUrl: buildGateUrl
  };
})(window);
