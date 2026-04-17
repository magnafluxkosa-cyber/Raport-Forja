(function (window) {
  'use strict';

  window.RF_PROJECT_GATE_CONFIG = Object.freeze({
    functionName: 'project-pin-verify',
    defaultNext: 'login.html',
    storageKey: 'rf_project_gate_token',
    keepTokenInLocalStorage: true,
    requestTimeoutMs: 12000,
    projectKey: 'kad',
    expectedProjectKeyOnLogin: 'kad',
    pinMaskDigitsOnly: false
  });
})(window);
