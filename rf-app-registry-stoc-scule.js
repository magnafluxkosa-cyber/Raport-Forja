(function(window){
  'use strict';
  var reg = window.RF_APP_REGISTRY;
  if (!reg || !reg.index || !Array.isArray(reg.index.items)) return;

  var PAGES = [
    { key:'stoc-consum-scule', label:'STOC ȘI CONSUM SCULE', href:'stoc-consum-scule.html' },
    { key:'stoc-scule-reascutite', label:'STOC SCULE REASCUTITE', href:'stoc-scule-reascutite.html' }
  ];

  function itemKey(x){ return x && (x.key || x[0]); }
  function hasKey(list,key){ return Array.isArray(list) && list.some(function(x){ return itemKey(x) === key; }); }
  function insertAfter(list, afterKey, item){
    if (!Array.isArray(list) || hasKey(list,item.key || item[0])) return;
    var idx=list.findIndex(function(x){ return itemKey(x)===afterKey; });
    if(idx>=0) list.splice(idx+1,0,item); else list.push(item);
  }

  try{
    var group = reg.index.items.find(function(x){ return x && x.key === 'group-prelucrari'; });
    if (group && Array.isArray(group.sections) && group.sections.length) {
      var sec = group.sections[0];
      sec.items = Array.isArray(sec.items) ? sec.items : [];
      insertAfter(sec.items, 'inventar-prelucrari', {key:PAGES[0].key,label:PAGES[0].label,href:PAGES[0].href});
      insertAfter(sec.items, PAGES[0].key, {key:PAGES[1].key,label:PAGES[1].label,href:PAGES[1].href});
    }

    if (reg.helperAcl) {
      reg.helperAcl.pageGroups = Array.isArray(reg.helperAcl.pageGroups) ? reg.helperAcl.pageGroups : [];
      var pg = reg.helperAcl.pageGroups.find(function(x){ return x && x.key === 'prelucrari-pages'; });
      if (!pg) {
        pg = { key:'prelucrari-pages', label:'Foi PRELUCRĂRI MECANICE', items:[] };
        reg.helperAcl.pageGroups.push(pg);
      }
      pg.items = Array.isArray(pg.items) ? pg.items : [];
      insertAfter(pg.items, 'inventar-prelucrari', [PAGES[0].key,PAGES[0].label]);
      insertAfter(pg.items, PAGES[0].key, [PAGES[1].key,PAGES[1].label]);

      reg.helperAcl.buttonGroups = Array.isArray(reg.helperAcl.buttonGroups) ? reg.helperAcl.buttonGroups : [];
      var bg = reg.helperAcl.buttonGroups.find(function(x){ return x && x.key === 'prelucrari'; });
      if (bg) {
        bg.items = Array.isArray(bg.items) ? bg.items : [];
        insertAfter(bg.items, 'inventar-prelucrari', [PAGES[0].key,PAGES[0].label]);
        insertAfter(bg.items, PAGES[0].key, [PAGES[1].key,PAGES[1].label]);
      }
    }

    if (typeof reg.patchAclCatalog === 'function') reg.patchAclCatalog();
  } catch (err) {
    console.warn('KAD registry patch stoc scule', err);
  }
})(window);
