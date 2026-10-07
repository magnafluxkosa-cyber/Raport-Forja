(function(window){
  'use strict';
  var reg = window.RF_APP_REGISTRY;
  if (!reg || !reg.index || !Array.isArray(reg.index.items)) return;
  var PAGE_KEY = 'stoc-consum-scule';
  var LABEL = 'STOC ȘI CONSUM SCULE';
  var HREF = 'stoc-consum-scule.html';

  function hasItem(list){
    return Array.isArray(list) && list.some(function(x){ return x && (x.key === PAGE_KEY || x[0] === PAGE_KEY); });
  }

  try{
    var group = reg.index.items.find(function(x){ return x && x.key === 'group-prelucrari'; });
    if (group && Array.isArray(group.sections) && group.sections.length) {
      var sec = group.sections[0];
      sec.items = Array.isArray(sec.items) ? sec.items : [];
      if (!hasItem(sec.items)) {
        var item = { key:PAGE_KEY, label:LABEL, href:HREF };
        var idx = sec.items.findIndex(function(x){ return x && x.key === 'inventar-prelucrari'; });
        if (idx >= 0) sec.items.splice(idx + 1, 0, item); else sec.items.push(item);
      }
    }

    if (reg.helperAcl) {
      reg.helperAcl.pageGroups = Array.isArray(reg.helperAcl.pageGroups) ? reg.helperAcl.pageGroups : [];
      var pg = reg.helperAcl.pageGroups.find(function(x){ return x && x.key === 'prelucrari-pages'; });
      if (!pg) {
        pg = { key:'prelucrari-pages', label:'Foi PRELUCRĂRI MECANICE', items:[] };
        reg.helperAcl.pageGroups.push(pg);
      }
      pg.items = Array.isArray(pg.items) ? pg.items : [];
      if (!hasItem(pg.items)) {
        var pidx = pg.items.findIndex(function(x){ return x && x[0] === 'inventar-prelucrari'; });
        if (pidx >= 0) pg.items.splice(pidx + 1, 0, [PAGE_KEY, LABEL]); else pg.items.push([PAGE_KEY, LABEL]);
      }

      reg.helperAcl.buttonGroups = Array.isArray(reg.helperAcl.buttonGroups) ? reg.helperAcl.buttonGroups : [];
      var bg = reg.helperAcl.buttonGroups.find(function(x){ return x && x.key === 'prelucrari'; });
      if (bg) {
        bg.items = Array.isArray(bg.items) ? bg.items : [];
        if (!hasItem(bg.items)) {
          var bidx = bg.items.findIndex(function(x){ return x && x[0] === 'inventar-prelucrari'; });
          if (bidx >= 0) bg.items.splice(bidx + 1, 0, [PAGE_KEY, LABEL]); else bg.items.push([PAGE_KEY, LABEL]);
        }
      }
    }

    if (typeof reg.patchAclCatalog === 'function') reg.patchAclCatalog();
  } catch (err) {
    console.warn('KAD registry patch stoc scule', err);
  }
})(window);
