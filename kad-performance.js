(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('kad_perf') !== '1') return;
  var longTasks = [];
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) { longTasks.push({ start: Math.round(entry.startTime), ms: Math.round(entry.duration) }); });
    }).observe({ type: 'longtask', buffered: true });
  } catch (_) {}
  function mount() {
    var panel = document.createElement('details');
    panel.id = 'kad-performance';
    panel.open = true;
    panel.style.cssText = 'position:fixed;bottom:8px;right:8px;width:min(680px,95vw);max-height:65vh;overflow:auto;z-index:2147483647;background:#fff;color:#111;border:2px solid #163a5b;padding:12px;font:12px monospace;visibility:visible!important';
    var summary = document.createElement('summary');
    summary.textContent = 'Diagnostic încărcare KAD (fără cereri suplimentare)';
    var output = document.createElement('pre');
    output.style.cssText = 'white-space:pre-wrap;visibility:visible!important';
    panel.append(summary, output);
    document.body.appendChild(panel);
    var readyAt = null;
    function update() {
      var root = document.documentElement;
      var pending = root.classList.contains('rf-acl-pending') || root.getAttribute('data-rf-prehide') === '1' || document.body.classList.contains('acl-loading');
      if (!pending && readyAt === null) readyAt = Math.round(performance.now());
      var nav = performance.getEntriesByType('navigation')[0];
      var resources = performance.getEntriesByType('resource').map(function (entry) {
        var url = new URL(entry.name, location.href);
        return { path: url.hostname + url.pathname, type: entry.initiatorType, start: Math.round(entry.startTime), ms: Math.round(entry.duration), bytes: entry.transferSize };
      });
      output.textContent = JSON.stringify({
        elapsedMs: Math.round(performance.now()), accessPending: pending, accessReadyObservedMs: readyAt,
        navigation: nav ? { ttfbMs: Math.round(nav.responseStart), htmlCompleteMs: Math.round(nav.responseEnd), domMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd) } : null,
        requestCount: resources.length,
        slowest: resources.slice().sort(function (a,b) { return b.ms-a.ms; }).slice(0,12),
        latest: resources.slice(-12), longTasks: longTasks.slice(-10)
      }, null, 2);
    }
    update();
    var timer = setInterval(update, 1000);
    setTimeout(function () { clearInterval(timer); update(); }, 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
