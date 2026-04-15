(function(window){
  'use strict';

  function page(key, label, href, extra){
    var base = { key:key, label:label, href:href || (key + '.html') };
    if (extra && typeof extra === 'object') {
      Object.keys(extra).forEach(function(k){ base[k] = extra[k]; });
    }
    return base;
  }

  var registry = {
    index: {
      items: [
        {
          type:'group', key:'group-forja', label:'FORJĂ', panelId:'subForja', panelMode:'tabs', sections:[
            { key:'group-forja-rapoarte', buttonKey:'group-forja-rapoarte', label:'RAPOARTE', sectionId:'forjaRapoarte', layout:'subgrid', items:[
              page('numeralkod','NUMERALKOD'), page('intrari-otel','INTRĂRI OȚEL'), page('debitate','DEBITATE'), page('forjate','FORJATE'), page('eficienta','EFICIENȚĂ'), page('program-utilaje','PROGRAM UTILAJE')
            ]},
            { key:'group-forja-zale', buttonKey:'group-forja-zale', label:'URMĂRIRE ZALE', sectionId:'forjaZale', layout:'zale-columns', leadItems:[
              page('livrari-zale','LIVRĂRI ZALE'), page('centralizator-livrari-zale','CENTRALIZATOR LIVRĂRI')
            ], leftItems:[
              page('zale-9k-6628-29','9K-6628/29'), page('zale-229-6909-10','229-6909/10'), page('zale-503-0761-62','503-0761/62'), page('zale-106-1625-26','106-1625/26'), page('zale-378-8241-42','378-8241/42'), page('zale-248-2307-08','248-2307/08'), page('zale-417-3595-96','417-3595/96'), page('zale-418-2091-92','418-2091/92')
            ], rightItems:[
              page('ambalare-9k-6628-29','AMBALARE 9K-6628/29'), page('ambalare-229-6909-10','AMBALARE 229-6909/10'), page('ambalare-503-0761-62','AMBALARE 503-0761/62'), page('ambalare-106-1625-26','AMBALARE 106-1625/26'), page('ambalare-378-8241-42','AMBALARE 378-8241/42'), page('ambalare-248-2307-08','AMBALARE 248-2307/08'), page('ambalare-417-3595-96','AMBALARE 417-3595/96'), page('ambalare-418-2091-92','AMBALARE 418-2091/92')
            ]},
            { key:'group-forja-inventar', buttonKey:'group-forja-inventar', label:'INVENTAR', sectionId:'forjaInventar', layout:'subgrid', items:[
              page('inventar-otel','INVENTAR OȚEL'), page('inventar-debitat','INVENTAR DEBITAT'), page('inventar-forjat','INVENTAR FORJAT'), page('stoc-ramas-teoretic','STOC RĂMAS TEORETIC')
            ]}
          ]
        },
        { type:'group', key:'group-prelucrari', label:'PRELUCRĂRI MECANICE', panelId:'subPrelucrari', panelMode:'flat', sections:[{ key:'group-prelucrari-links', label:'Pagini', sectionId:'prelucrariLinks', layout:'subgrid', items:[ page('plan-livrari','PLAN LIVRĂRI'), page('planificare-prelucrari','PLANIFICARE PRELUCRĂRI'), page('inventar-prelucrari','INVENTAR PRELUCRĂRI') ] }] },
        { type:'group', key:'group-tratament-termic', label:'TRATAMENT TERMIC', panelId:'subTratamentTermic', panelMode:'flat', sections:[{ key:'group-tratament-termic-links', label:'Pagini', sectionId:'tratamentTermicLinks', layout:'subgrid', items:[ page('tratament-termic-rapoarte','RAPOARTE'), page('tratament-termic-probleme','PROBLEME T.T'), page('tratament-termic-fise-tehnologice','FIȘE TEHNOLOGICE'), page('tratament-termic-documente','RAPOARTE EXCEL / WORD') ] }] },
        { type:'group', key:'group-calitate', label:'CALITATE', panelId:'subCalitate', panelMode:'flat', sections:[{ key:'group-calitate-links', label:'Pagini', sectionId:'calitateLinks', layout:'subgrid', items:[ page('magnaflux','MAGNAFLUX'), page('rebut','REBUT') ] }] },
        { type:'group', key:'group-probleme-imbunatatire', label:'PROBLEME, ÎMBUNĂTĂȚIRI ȘI INVESTIȚII', panelId:'subProblemeImbunatatire', panelMode:'flat', sections:[{ key:'group-probleme-links', label:'Pagini', sectionId:'problemeLinks', layout:'subgrid', items:[ page('probleme-raportate','PROBLEME RAPORTATE'), page('urmarire-actiuni-progres','URMĂRIRE ACȚIUNI ȘI PROGRES'), page('imbunatatire-continua','ÎMBUNĂTĂȚIRE CONTINUĂ'), page('investitii','INVESTIȚII') ] }] },
        { type:'page', key:'kpi', label:'KPI', href:'kpi.html' },
        { type:'group', key:'group-planificari', label:'PLANIFICĂRI', panelId:'subPlanificari', panelMode:'flat', sections:[{ key:'group-planificari-links', label:'Pagini', sectionId:'planificariLinks', layout:'subgrid', items:[ page('planificare-forja','PLANIFICARE FORJĂ'), page('comenzi-livrare','COMENZI LIVRARE'), page('mrc-necesar-otel','MRC / NECESAR OȚEL'), page('mrc-comenzi-otel','COMENZI OȚEL'), page('mrc-comenzi-saptamanale','COMENZI SĂPTĂMÂNALE') ] }] },
        { type:'group', key:'group-resurse-umane', label:'RESURSE UMANE', panelId:'subResurseUmane', panelMode:'tabs', sections:[{ key:'group-resurse-umane-pontaje', buttonKey:'group-resurse-umane-pontaje', label:'PONTAJE', sectionId:'resurseUmanePontaje', layout:'subgrid', items:[ page('pontaj-forja','PONTAJ FORJA'), page('pontaj-ctc','PONTAJ CTC'), page('pontaj-prelucrari-mecanice','PONTAJ PRELUCRĂRI MECANICE') ] }] },
        { type:'group', key:'group-sdv', label:'SDV', panelId:'subSdv', panelMode:'flat', sections:[{ key:'group-sdv-links', label:'Pagini', sectionId:'sdvLinks', layout:'subgrid', items:[ page('stoc-matrite','STOC MATRIȚE'), page('urmarire-matrite','URMĂRIRE MATRIȚE'), page('progres-matrite','PROGRES MATRIȚE'), page('utilaje-matrite','UTILAJE MATRIȚE'), page('repere-matrite','REPERE MATRIȚE') ] }] },
        { type:'page', key:'helper-data', label:'HELPER-DATA', href:'helper-data.html' },
        { type:'page', key:'helper-acl', label:'HELPER-ACL', href:'helper-acl.html' }
      ]
    },
    helperAcl: {
      buttonGroups: [],
      pageGroups: [
        { key:'forja-pages', label:'Foi FORJĂ', items:[ ['numeralkod','NUMERALKOD'],['intrari-otel','INTRĂRI OȚEL'],['debitate','DEBITATE'],['forjate','FORJATE'],['eficienta','EFICIENȚĂ'],['program-utilaje','PROGRAM UTILAJE'],['stoc-initial-otel','STOC INIȚIAL OȚEL'],['inventar-otel','INVENTAR OȚEL'],['inventar-debitat','INVENTAR DEBITAT'],['inventar-forjat','INVENTAR FORJAT'] ] },
        { key:'prelucrari-pages', label:'Foi PRELUCRĂRI MECANICE', items:[ ['plan-livrari','PLAN LIVRĂRI'],['planificare-prelucrari','PLANIFICARE PRELUCRĂRI'],['inventar-prelucrari','INVENTAR PRELUCRĂRI'] ] },
        { key:'zale-pages', label:'Foi ZALE / AMBALARE', items:[ ['livrari-zale','URMĂRIRE ZALE'],['centralizator-livrari-zale','CENTRALIZATOR LIVRĂRI'],['stoc-ramas-teoretic','STOC RĂMAS TEORETIC'],['zale-9k-6628-29','ZALE 9K-6628/29'],['zale-229-6909-10','ZALE 229-6909/10'],['zale-503-0761-62','ZALE 503-0761/62'],['zale-106-1625-26','ZALE 106-1625/26'],['zale-378-8241-42','ZALE 378-8241/42'],['zale-248-2307-08','ZALE 248-2307/08'],['zale-417-3595-96','ZALE 417-3595/96'],['zale-418-2091-92','ZALE 418-2091/92'],['ambalare-9k-6628-29','AMBALARE 9K-6628/29'],['ambalare-229-6909-10','AMBALARE 229-6909/10'],['ambalare-503-0761-62','AMBALARE 503-0761/62'],['ambalare-106-1625-26','AMBALARE 106-1625/26'],['ambalare-378-8241-42','AMBALARE 378-8241/42'],['ambalare-248-2307-08','AMBALARE 248-2307/08'],['ambalare-417-3595-96','AMBALARE 417-3595/96'],['ambalare-418-2091-92','AMBALARE 418-2091/92'] ] },
        { key:'quality-pages', label:'Calitate / Rebut', items:[ ['magnaflux','MAGNAFLUX'],['magnaflux-calendar','MAGNAFLUX CALENDAR'],['rebut','REBUT'],['rebut-pm','REBUT PM'],['rebut-pm-helper','REBUT PM HELPER'],['calendar-operatori','CALENDAR OPERATORI'] ] },
        { key:'ops-pages', label:'Probleme / Investiții / Planificări', items:[ ['probleme-raportate','PROBLEME RAPORTATE'],['urmarire-actiuni-progres','URMĂRIRE ACȚIUNI ȘI PROGRES'],['imbunatatire-continua','ÎMBUNĂTĂȚIRE CONTINUĂ'],['investitii','INVESTIȚII'],['kpi','KPI'],['planificare-forja','PLANIFICARE FORJĂ'],['comenzi-livrare','COMENZI LIVRARE'],['mrc-necesar-otel','MRC / NECESAR OȚEL'],['mrc-comenzi-otel','COMENZI OȚEL'],['mrc-comenzi-saptamanale','COMENZI SĂPTĂMÂNALE'],['tratament-termic-rapoarte','T.T RAPOARTE'],['tratament-termic-probleme','T.T PROBLEME'],['tratament-termic-fise-tehnologice','T.T FIȘE TEHNOLOGICE'],['tratament-termic-documente','T.T RAPOARTE EXCEL / WORD'] ] },
        { key:'resurse-umane-pages', label:'Resurse umane / Pontaje', items:[ ['pontaj-forja','PONTAJ FORJA'],['pontaj-ctc','PONTAJ CTC'],['pontaj-prelucrari-mecanice','PONTAJ PRELUCRĂRI MECANICE'] ] },
        { key:'sdv-pages', label:'Foi SDV', items:[ ['stoc-matrite','STOC MATRIȚE'],['urmarire-matrite','URMĂRIRE MATRIȚE'],['progres-matrite','PROGRES MATRIȚE'],['utilaje-matrite','UTILAJE MATRIȚE'],['repere-matrite','REPERE MATRIȚE'] ] },
        { key:'helper-pages', label:'Helper / Administrare', items:[ ['helper','HELPER'],['helper-data','HELPER-DATA'],['helper-acl','HELPER-ACL'] ] }
      ]
    }
  };

  function flattenIndexButtons(items, acc) {
    (items || []).forEach(function(item){
      if (!item || !item.key) return;
      acc.push([item.key, item.label]);
      if (item.type === 'group') {
        (item.sections || []).forEach(function(section){
          if (section && section.buttonKey) acc.push([section.buttonKey, section.label]);
          (section && section.items || []).forEach(function(link){ acc.push([link.key, link.label]); });
          (section && section.leadItems || []).forEach(function(link){ acc.push([link.key, link.label]); });
          (section && section.leftItems || []).forEach(function(link){ acc.push([link.key, link.label]); });
          (section && section.rightItems || []).forEach(function(link){ acc.push([link.key, link.label]); });
        });
      }
    });
    return acc;
  }

  registry.helperAcl.buttonGroups = [
    { key:'top', label:'Butoane principale din index', items: registry.index.items.map(function(item){ return [item.key, item.label]; }) },
    { key:'forja', label:'Submeniul FORJĂ', items: flattenIndexButtons([registry.index.items[0]], []).filter(function(entry){ return entry[0] !== 'group-forja'; }) },
    { key:'prelucrari', label:'Submeniul PRELUCRĂRI MECANICE', items: flattenIndexButtons([registry.index.items[1]], []).filter(function(entry){ return entry[0] !== 'group-prelucrari'; }) },
    { key:'tratament-termic', label:'Submeniul TRATAMENT TERMIC', items: flattenIndexButtons([registry.index.items[2]], []).filter(function(entry){ return entry[0] !== 'group-tratament-termic'; }) },
    { key:'calitate', label:'Submeniul CALITATE', items: flattenIndexButtons([registry.index.items[3]], []).filter(function(entry){ return entry[0] !== 'group-calitate'; }) },
    { key:'probleme', label:'Submeniul PROBLEME / ÎMBUNĂTĂȚIRI / INVESTIȚII', items: flattenIndexButtons([registry.index.items[4]], []).filter(function(entry){ return entry[0] !== 'group-probleme-imbunatatire'; }) },
    { key:'planificari', label:'Submeniul PLANIFICĂRI', items: flattenIndexButtons([registry.index.items[6]], []).filter(function(entry){ return entry[0] !== 'group-planificari'; }) },
    { key:'resurse-umane', label:'Submeniul RESURSE UMANE', items: flattenIndexButtons([registry.index.items[7]], []).filter(function(entry){ return entry[0] !== 'group-resurse-umane'; }) },
    { key:'sdv', label:'Submeniul SDV', items: flattenIndexButtons([registry.index.items[8]], []).filter(function(entry){ return entry[0] !== 'group-sdv'; }) }
  ];


  registry.getSideMenu = function(){
    return registry.index.items.map(function(item){
      if (item.type === 'page') return { key:item.key, label:item.label, href:item.href };
      return {
        key:item.key,
        label:item.label,
        sections:(item.sections || []).map(function(section){
          var links = [];
          (section.leadItems || []).forEach(function(link){ links.push({ key:link.key, label:link.label, href:link.href }); });
          (section.items || []).forEach(function(link){ links.push({ key:link.key, label:link.label, href:link.href }); });
          (section.leftItems || []).forEach(function(link){ links.push({ key:link.key, label:link.label, href:link.href }); });
          (section.rightItems || []).forEach(function(link){ links.push({ key:link.key, label:link.label, href:link.href }); });
          return { key:section.key, label:section.label, links:links };
        })
      };
    });
  };
  registry.getIndexItems = function(){ return JSON.parse(JSON.stringify(registry.index.items)); };
  registry.getHelperAclButtonGroups = function(){ return JSON.parse(JSON.stringify(registry.helperAcl.buttonGroups)); };
  registry.getHelperAclPageGroups = function(){ return JSON.parse(JSON.stringify(registry.helperAcl.pageGroups)); };
  registry.getManagedPageEntries = function(){
    var out = [];
    registry.helperAcl.pageGroups.forEach(function(group){ (group.items || []).forEach(function(entry){ out.push({ page_key: entry[0], page_name: entry[1] }); }); });
    [{ page_key:'group-resurse-umane', page_name:'Grup / Resurse umane' }, { page_key:'group-resurse-umane-pontaje', page_name:'Grup / Resurse umane / Pontaje' }].forEach(function(item){ out.push(item); });
    return out;
  };
  registry.patchAclCatalog = function(){
    var entries = registry.getManagedPageEntries();
    var pageMap = window.RF_ACL && window.RF_ACL.PAGE_MAP ? window.RF_ACL.PAGE_MAP : null;
    var pageList = window.RF_ACL && Array.isArray(window.RF_ACL.PAGE_LIST) ? window.RF_ACL.PAGE_LIST : (Array.isArray(window.RF_PAGES) ? window.RF_PAGES : null);
    if (pageList) {
      var existing = new Set(pageList.map(function(row){ return String(row && row.page_key || '').trim(); }).filter(Boolean));
      entries.forEach(function(item){ if (!existing.has(item.page_key)) { pageList.push({ page_key:item.page_key, page_name:item.page_name }); existing.add(item.page_key); } });
    }
    if (pageMap) entries.forEach(function(item){ if (!pageMap[item.page_key]) pageMap[item.page_key] = item.page_name; });
    if (window.RF_CONFIG && Array.isArray(window.RF_CONFIG.pages)) {
      var cfgExisting = new Set(window.RF_CONFIG.pages.map(function(row){ return String(row && row.page_key || '').trim(); }).filter(Boolean));
      entries.forEach(function(item){ if (!cfgExisting.has(item.page_key)) { window.RF_CONFIG.pages.push({ page_key:item.page_key, page_name:item.page_name }); cfgExisting.add(item.page_key); } });
    }
  };

  window.RF_APP_REGISTRY = registry;
  try { registry.patchAclCatalog(); } catch (_) {}
})(window);
