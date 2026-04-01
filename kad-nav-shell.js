
(function(){
  'use strict';

  var currentPath = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if(!currentPath || currentPath === 'index.html' || currentPath === 'login.html') return;

  function parseHidden(raw){
    if(!raw) return null;
    try{
      var data = JSON.parse(raw);
      if(!data || typeof data !== 'object') return null;
      return Array.isArray(data.hidden) ? data.hidden.map(function(v){ return String(v || '').trim(); }).filter(Boolean) : [];
    }catch(_){ return null; }
  }

  function getHiddenSet(){
    try{
      return new Set(
        parseHidden(window.sessionStorage && sessionStorage.getItem('rf_hidden_index_buttons')) ||
        parseHidden(window.localStorage && localStorage.getItem('rf_hidden_index_buttons')) || []
      );
    }catch(_){
      return new Set();
    }
  }

  var hiddenSet = getHiddenSet();
  var currentKey = currentPath.replace(/\.html$/i,'');

  var MENU = [
    {
      key:'group-forja', label:'FORJĂ', sections:[
        { key:'forja-rapoarte', label:'Rapoarte', links:[
          { key:'numeralkod', label:'NUMERALKOD', href:'numeralkod.html' },
          { key:'intrari-otel', label:'INTRĂRI OȚEL', href:'intrari-otel.html' },
          { key:'debitate', label:'DEBITATE', href:'debitate.html' },
          { key:'forjate', label:'FORJATE', href:'forjate.html' },
          { key:'eficienta', label:'EFICIENȚĂ', href:'eficienta.html' },
          { key:'program-utilaje', label:'PROGRAM UTILAJE', href:'program-utilaje.html' }
        ]},
        { key:'forja-zale', label:'Urmărire zale', links:[
          { key:'livrari-zale', label:'LIVRĂRI ZALE', href:'livrari-zale.html' },
          { key:'centralizator-livrari-zale', label:'CENTRALIZATOR LIVRĂRI', href:'centralizator-livrari-zale.html' },
          { key:'zale-9k-6628-29', label:'9K-6628/29', href:'zale-9k-6628-29.html' },
          { key:'zale-229-6909-10', label:'229-6909/10', href:'zale-229-6909-10.html' },
          { key:'zale-503-0761-62', label:'503-0761/62', href:'zale-503-0761-62.html' },
          { key:'zale-106-1625-26', label:'106-1625/26', href:'zale-106-1625-26.html' },
          { key:'zale-378-8241-42', label:'378-8241/42', href:'zale-378-8241-42.html' },
          { key:'zale-248-2307-08', label:'248-2307/08', href:'zale-248-2307-08.html' },
          { key:'zale-417-3595-96', label:'417-3595/96', href:'zale-417-3595-96.html' },
          { key:'zale-418-2091-92', label:'418-2091/92', href:'zale-418-2091-92.html' },
          { key:'ambalare-9k-6628-29', label:'AMBALARE 9K-6628/29', href:'ambalare-9k-6628-29.html' },
          { key:'ambalare-229-6909-10', label:'AMBALARE 229-6909/10', href:'ambalare-229-6909-10.html' },
          { key:'ambalare-503-0761-62', label:'AMBALARE 503-0761/62', href:'ambalare-503-0761-62.html' },
          { key:'ambalare-106-1625-26', label:'AMBALARE 106-1625/26', href:'ambalare-106-1625-26.html' },
          { key:'ambalare-378-8241-42', label:'AMBALARE 378-8241/42', href:'ambalare-378-8241-42.html' },
          { key:'ambalare-248-2307-08', label:'AMBALARE 248-2307/08', href:'ambalare-248-2307-08.html' },
          { key:'ambalare-417-3595-96', label:'AMBALARE 417-3595/96', href:'ambalare-417-3595-96.html' },
          { key:'ambalare-418-2091-92', label:'AMBALARE 418-2091/92', href:'ambalare-418-2091-92.html' }
        ]},
        { key:'forja-inventar', label:'Inventar', links:[
          { key:'inventar-otel', label:'INVENTAR OȚEL', href:'inventar-otel.html' },
          { key:'inventar-debitat', label:'INVENTAR DEBITAT', href:'inventar-debitat.html' },
          { key:'inventar-forjat', label:'INVENTAR FORJAT', href:'inventar-forjat.html' },
          { key:'stoc-initial-otel', label:'STOC INIȚIAL OȚEL', href:'stoc-initial-otel.html' },
          { key:'stoc-ramas-teoretic', label:'STOC RĂMAS TEORETIC', href:'stoc-ramas-teoretic.html' }
        ]}
      ]
    },
    { key:'group-prelucrari', label:'PRELUCRĂRI MECANICE', sections:[
      { key:'prelucrari-coming-soon', label:'Secțiune', links:[
        { key:'prelucrari-placeholder', label:'În lucru', href:null, disabled:true }
      ]}
    ]},
    { key:'group-tratament-termic', label:'TRATAMENT TERMIC', sections:[
      { key:'tratament-termic-links', label:'Pagini', links:[
        { key:'tratament-termic-rapoarte', label:'RAPOARTE', href:'tratament-termic-rapoarte.html' },
        { key:'tratament-termic-probleme', label:'PROBLEME T.T', href:'tratament-termic-probleme.html' },
        { key:'tratament-termic-fise-tehnologice', label:'FIȘE TEHNOLOGICE', href:'tratament-termic-fise-tehnologice.html' },
        { key:'tratament-termic-documente', label:'RAPOARTE EXCEL / WORD', href:'tratament-termic-documente.html' }
      ]}
    ]},
    { key:'group-calitate', label:'CALITATE', sections:[
      { key:'calitate-links', label:'Pagini', links:[
        { key:'magnaflux', label:'MAGNAFLUX', href:'magnaflux.html' },
        { key:'rebut', label:'REBUT', href:'rebut.html' },
        { key:'rebut-pm', label:'REBUT PM', href:'rebut-pm.html' },
        { key:'rebut-pm-helper', label:'REBUT PM HELPER', href:'rebut-pm-helper.html' },
        { key:'magnaflux-calendar', label:'CALENDAR MAGNAFLUX', href:'magnaflux-calendar.html' },
        { key:'calendar-operatori', label:'CALENDAR OPERATORI', href:'calendar-operatori.html' }
      ]}
    ]},
    { key:'group-probleme-imbunatatire', label:'PROBLEME · ÎMBUNĂTĂȚIRI', sections:[
      { key:'probleme-links', label:'Pagini', links:[
        { key:'probleme-raportate', label:'PROBLEME RAPORTATE', href:'probleme-raportate.html' },
        { key:'urmarire-actiuni-progres', label:'URMĂRIRE ACȚIUNI ȘI PROGRES', href:'urmarire-actiuni-progres.html' },
        { key:'imbunatatire-continua', label:'ÎMBUNĂTĂȚIRE CONTINUĂ', href:'imbunatatire-continua.html' },
        { key:'investitii', label:'INVESTIȚII', href:'investitii.html' }
      ]}
    ]},
    { key:'kpi', label:'KPI', href:'kpi.html' },
    { key:'group-planificari', label:'PLANIFICĂRI', sections:[
      { key:'planificari-links', label:'Pagini', links:[
        { key:'planificare-forja', label:'PLANIFICARE FORJĂ', href:'planificare-forja.html' },
        { key:'comenzi-livrare', label:'COMENZI LIVRARE', href:'comenzi-livrare.html' },
        { key:'mrc-necesar-otel', label:'MRC / NECESAR OȚEL', href:'mrc-necesar-otel.html' },
        { key:'mrc-comenzi-otel', label:'COMENZI OȚEL', href:'mrc-comenzi-otel.html' },
        { key:'mrc-comenzi-saptamanale', label:'COMENZI SĂPTĂMÂNALE', href:'mrc-comenzi-saptamanale.html' }
      ]}
    ]},
    { key:'helper-data', label:'HELPER-DATA', href:'helper-data.html' },
    { key:'helper-acl', label:'HELPER-ACL', href:'helper-acl.html' }
  ];

  function escapeHtml(str){
    return String(str == null ? '' : str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function isVisibleKey(key){ return !key || !hiddenSet.has(key); }

  function filterMenu(items){
    return items.map(function(item){
      if(!isVisibleKey(item.key)) return null;
      var clone = Object.assign({}, item);
      if(Array.isArray(item.sections)){
        clone.sections = item.sections.map(function(section){
          var s = Object.assign({}, section);
          s.links = (section.links || []).filter(function(link){ return isVisibleKey(link.key); });
          return s.links.length ? s : null;
        }).filter(Boolean);
        if(!clone.sections.length && !clone.href) return null;
      }
      return clone;
    }).filter(Boolean);
  }

  function findMatch(items){
    for(var i=0;i<items.length;i++){
      var item = items[i];
      if(item.key === currentKey || (item.href && item.href.toLowerCase() === currentPath)) return item;
      if(item.sections){
        for(var j=0;j<item.sections.length;j++){
          var section = item.sections[j];
          for(var k=0;k<(section.links||[]).length;k++){
            var link = section.links[k];
            if(link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath)) return link;
          }
        }
      }
    }
    return null;
  }

  var filteredMenu = filterMenu(MENU);
  var currentMatch = findMatch(filteredMenu);

  function getCurrentLabel(){
    return currentMatch ? currentMatch.label : (document.title || currentKey || 'K.A.D');
  }

  function itemContainsCurrent(item){
    if(item.key === currentKey || (item.href && item.href.toLowerCase() === currentPath)) return true;
    if(item.sections){
      return item.sections.some(function(section){
        return (section.links || []).some(function(link){
          return link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath);
        });
      });
    }
    return false;
  }

  function linkHtml(link){
    var active = (link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath)) ? ' is-active' : '';
    if(link.disabled || !link.href){
      return '<span class="kad-shell-link'+active+'" aria-disabled="true">'+escapeHtml(link.label)+'</span>';
    }
    return '<a class="kad-shell-link'+active+'" href="'+escapeHtml(link.href)+'">'+escapeHtml(link.label)+'</a>';
  }

  function buildItem(item){
    var active = itemContainsCurrent(item) ? ' is-active' : '';
    if(item.href){
      return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key || '')+'">'
        + '<a class="kad-shell-main" href="'+escapeHtml(item.href)+'"><span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span></a>'
        + '</div>';
    }
    return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key || '')+'" data-has-submenu="1">'
      + '<button class="kad-shell-main" type="button" aria-expanded="false">'
      + '<span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span><span class="kad-shell-main-caret" aria-hidden="true"></span>'
      + '</button></div>';
  }

  function ensureContentWrapper(){
    var existing = document.querySelector('.kad-shell-page-content');
    if(existing) return existing;
    var wrapper = document.createElement('div');
    wrapper.className = 'kad-shell-page-content';
    var nodes = [];
    Array.prototype.slice.call(document.body.childNodes).forEach(function(node){
      if(node.nodeType === 1){
        var tag = node.tagName;
        if(tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') return;
      }
      nodes.push(node);
    });
    document.body.insertBefore(wrapper, document.body.firstChild);
    nodes.forEach(function(node){ wrapper.appendChild(node); });
    return wrapper;
  }

  function estimatePanelWidth(item){
    if(!item || !item.sections) return 214;
    var linkCount = 0;
    var maxLabel = 0;
    item.sections.forEach(function(section){
      (section.links || []).forEach(function(link){
        linkCount += 1;
        maxLabel = Math.max(maxLabel, String(link.label || '').length);
      });
    });
    var columns = linkCount > 9 || maxLabel > 18 ? 2 : 1;
    var width = 214 + 14 + (columns * 190) + 28;
    var maxAllowed = Math.max(360, window.innerWidth - 28);
    return Math.min(width, maxAllowed);
  }

  function renderSubpanel(item){
    if(!item || !item.sections) return '';
    return '<div class="kad-shell-subtitle">'+escapeHtml(item.label)+'</div>'
      + item.sections.map(function(section){
          return '<section class="kad-shell-section">'
            + '<div class="kad-shell-section-label">'+escapeHtml(section.label)+'</div>'
            + '<div class="kad-shell-link-grid">'+(section.links || []).map(linkHtml).join('')+'</div>'
            + '</section>';
        }).join('');
  }

  function parseColor(value){
    if(!value) return null;
    value = String(value).trim();
    var m;
    if((m = value.match(/^rgba?\(([^)]+)\)$/i))){
      var parts = m[1].split(',').map(function(v){ return parseFloat(v.trim()); });
      if(parts.length >= 3){
        return { r: clamp(parts[0],0,255), g: clamp(parts[1],0,255), b: clamp(parts[2],0,255), a: clamp(parts.length > 3 ? parts[3] : 1, 0, 1) };
      }
    }
    if((m = value.match(/^#([0-9a-f]{3,8})$/i))){
      var hex = m[1];
      if(hex.length === 3 || hex.length === 4){
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
          a: hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
        };
      }
      if(hex.length === 6 || hex.length === 8){
        return {
          r: parseInt(hex.slice(0,2), 16),
          g: parseInt(hex.slice(2,4), 16),
          b: parseInt(hex.slice(4,6), 16),
          a: hex.length === 8 ? parseInt(hex.slice(6,8), 16) / 255 : 1
        };
      }
    }
    return null;
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, Number(v) || 0)); }

  function rgba(color, alpha){
    if(!color) return '';
    var a = alpha == null ? (color.a == null ? 1 : color.a) : alpha;
    return 'rgba(' + Math.round(color.r) + ',' + Math.round(color.g) + ',' + Math.round(color.b) + ',' + clamp(a,0,1) + ')';
  }

  function mix(a,b,t){
    if(!a && !b) return { r:244, g:246, b:251, a:1 };
    if(!a) return b;
    if(!b) return a;
    t = clamp(t,0,1);
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
      a: (a.a == null ? 1 : a.a) + (((b.a == null ? 1 : b.a) - (a.a == null ? 1 : a.a)) * t)
    };
  }

  function luminance(c){
    if(!c) return 1;
    function channel(v){
      v = clamp(v / 255, 0, 1);
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }

  function isTransparent(color){
    return !color || color.a === 0;
  }

  function readColor(el, prop){
    if(!el) return null;
    var color = parseColor(window.getComputedStyle(el)[prop]);
    return isTransparent(color) ? null : color;
  }

  function isVisible(el){
    if(!el || !el.getBoundingClientRect) return false;
    var cs = window.getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 6 && rect.height > 6;
  }

  function pickFirst(selectors, excludeInsideShell){
    var list = document.querySelectorAll(selectors);
    for(var i=0;i<list.length;i++){
      var el = list[i];
      if(excludeInsideShell && el.closest && el.closest('#kadNavShellRoot')) continue;
      if(isVisible(el)) return el;
    }
    return null;
  }

  function applyAdaptivePalette(){
    var root = document.documentElement;
    var body = document.body;
    if(!body) return;

    var bg = readColor(body, 'backgroundColor') || readColor(document.documentElement, 'backgroundColor');
    var panelEl = pickFirst('.box,.panel,.card,.toolbar,.topbar,.header,.wrap,.container,.controls,.table-wrap,.modal,.dialog,.sheet,.content', true);
    var panelBg = readColor(panelEl, 'backgroundColor');
    var btnEl = pickFirst('button,.btn,a.btn,.back-btn,.btn-soft,.btnMenu,.secondary,.primary,[class*="btn"]', true);
    var accent = readColor(btnEl, 'backgroundColor') || readColor(btnEl, 'borderTopColor');
    var text = readColor(body, 'color') || readColor(panelEl, 'color') || { r:29, g:47, b:82, a:1 };

    var base = panelBg || bg || { r:244, g:246, b:251, a:1 };
    var light = luminance(base) > 0.56;
    var accentBase = accent || text;

    var shellBg, shellBg2, border, divider, shellText, muted, surface, surfaceHover, surfaceBorder, caret, scroll, shine1, shine2, shadow;

    if(light){
      var violetGlass = { r:146, g:118, b:210, a:1 };
      var violetGlassDeep = { r:124, g:95, b:192, a:1 };
      shellText = luminance(text) > 0.6 ? { r:29, g:47, b:82, a:1 } : text;
      shellBg = mix(base, violetGlass, 0.22);
      shellBg2 = mix(base, violetGlassDeep, 0.34);
      border = mix(shellText, violetGlass, 0.68);
      divider = mix(shellText, violetGlass, 0.80);
      surface = mix(base, { r:255, g:255, b:255, a:1 }, 0.62);
      surfaceHover = mix(surface, violetGlass, 0.10);
      surfaceBorder = mix(shellText, violetGlass, 0.78);
      caret = mix(shellText, violetGlass, 0.26);
      scroll = mix(shellText, violetGlass, 0.76);
      muted = shellText;
      shine1 = { r:255, g:255, b:255, a:0.34 };
      shine2 = { r:196, g:178, b:241, a:0.18 };
      shadow = '0 20px 46px rgba(58,41,96,.18)';
      root.style.setProperty('--kad-shell-bg', rgba(shellBg, 0.94));
      root.style.setProperty('--kad-shell-bg-2', rgba(shellBg2, 0.97));
      root.style.setProperty('--kad-shell-border', rgba(border, 0.26));
      root.style.setProperty('--kad-shell-divider', rgba(divider, 0.18));
      root.style.setProperty('--kad-shell-text', rgba(shellText, 1));
      root.style.setProperty('--kad-shell-muted', rgba(muted, 0.68));
      root.style.setProperty('--kad-shell-surface', rgba(surface, 0.72));
      root.style.setProperty('--kad-shell-surface-hover', rgba(surfaceHover, 0.9));
      root.style.setProperty('--kad-shell-surface-border', rgba(surfaceBorder, 0.2));
      root.style.setProperty('--kad-shell-caret', rgba(caret, 0.82));
      root.style.setProperty('--kad-shell-scroll', rgba(scroll, 0.26));
      root.style.setProperty('--kad-shell-shine-1', rgba(shine1, 1));
      root.style.setProperty('--kad-shell-shine-2', rgba(shine2, 1));
      root.style.setProperty('--kad-shell-shadow', shadow);
    } else {
      shellText = luminance(text) < 0.45 ? { r:236, g:242, b:255, a:1 } : text;
      shellBg = mix(base, accentBase, 0.16);
      shellBg2 = mix(base, accentBase, 0.28);
      border = mix(shellText, base, 0.75);
      divider = mix(shellText, base, 0.82);
      surface = mix(base, { r:255, g:255, b:255, a:1 }, 0.08);
      surfaceHover = mix(surface, { r:255, g:255, b:255, a:1 }, 0.06);
      surfaceBorder = mix(shellText, base, 0.82);
      caret = mix(shellText, accentBase, 0.16);
      scroll = mix(shellText, base, 0.8);
      muted = shellText;
      shine1 = { r:255, g:255, b:255, a:0.14 };
      shine2 = { r:255, g:255, b:255, a:0.05 };
      shadow = '0 18px 42px rgba(0,0,0,.28)';
      root.style.setProperty('--kad-shell-bg', rgba(shellBg, 0.9));
      root.style.setProperty('--kad-shell-bg-2', rgba(shellBg2, 0.95));
      root.style.setProperty('--kad-shell-border', rgba(border, 0.24));
      root.style.setProperty('--kad-shell-divider', rgba(divider, 0.14));
      root.style.setProperty('--kad-shell-text', rgba(shellText, 1));
      root.style.setProperty('--kad-shell-muted', rgba(muted, 0.72));
      root.style.setProperty('--kad-shell-surface', rgba(surface, 0.22));
      root.style.setProperty('--kad-shell-surface-hover', rgba(surfaceHover, 0.32));
      root.style.setProperty('--kad-shell-surface-border', rgba(surfaceBorder, 0.22));
      root.style.setProperty('--kad-shell-caret', rgba(caret, 0.84));
      root.style.setProperty('--kad-shell-scroll', rgba(scroll, 0.24));
      root.style.setProperty('--kad-shell-shine-1', rgba(shine1, 1));
      root.style.setProperty('--kad-shell-shine-2', rgba(shine2, 1));
      root.style.setProperty('--kad-shell-shadow', shadow);
    }
  }

  function mount(){
    if(document.getElementById('kadNavShellRoot')) return;
    ensureContentWrapper();
    var root = document.createElement('div');
    root.id = 'kadNavShellRoot';
    root.innerHTML = '<div class="kad-shell-edge-sensor" aria-hidden="true"></div>'
      + '<aside class="kad-shell" aria-label="Navigare K.A.D">'
      + '<div class="kad-shell-peek-label">MENIU</div>'
      + '<div class="kad-shell-header"><div class="kad-shell-mini">K.A.D · Navigare</div><div class="kad-shell-brand">K.A.D</div><div class="kad-shell-current">'+escapeHtml(getCurrentLabel())+'</div></div>'
      + '<div class="kad-shell-layout"><nav class="kad-shell-navcol">'+filteredMenu.map(buildItem).join('')+'</nav><div class="kad-shell-subpanel"></div></div>'
      + '<div class="kad-shell-footer"><button type="button" class="kad-shell-logout">Logout</button><div class="kad-shell-note">click pe marginea stângă</div></div>'
      + '</aside>';
    document.body.appendChild(root);
    document.body.classList.add('kad-shell-mounted');
    applyAdaptivePalette();
    bind(root);
    window.setTimeout(applyAdaptivePalette, 80);
    window.setTimeout(applyAdaptivePalette, 600);
  }

  function bind(root){
    var shell = root.querySelector('.kad-shell');
    var sensor = root.querySelector('.kad-shell-edge-sensor');
    var subpanel = root.querySelector('.kad-shell-subpanel');
    var items = Array.prototype.slice.call(root.querySelectorAll('.kad-shell-item'));
    var activeItem = null;

    function openShell(){ root.classList.add('is-open'); document.body.classList.add('kad-shell-open'); }
    function closeShell(){ hideSubmenu(); root.classList.remove('is-open'); document.body.classList.remove('kad-shell-open'); }
    function toggleShell(){
      if(root.classList.contains('is-open')){
        closeShell();
      } else {
        openShell();
      }
    }
    function hideSubmenu(){
      activeItem = null;
      items.forEach(function(item){ item.classList.remove('is-open'); var btn = item.querySelector('button.kad-shell-main'); if(btn) btn.setAttribute('aria-expanded','false'); });
      root.classList.remove('has-submenu');
      document.body.classList.remove('kad-shell-submenu');
      subpanel.innerHTML = '';
      document.body.style.removeProperty('--kad-shell-panel-width');
    }
    function showSubmenu(item, data){
      if(!item || !data || !data.sections){ hideSubmenu(); return; }
      activeItem = item;
      items.forEach(function(entry){ if(entry !== item){ entry.classList.remove('is-open'); var btn = entry.querySelector('button.kad-shell-main'); if(btn) btn.setAttribute('aria-expanded','false'); } });
      item.classList.add('is-open');
      var btn = item.querySelector('button.kad-shell-main');
      if(btn) btn.setAttribute('aria-expanded','true');
      subpanel.innerHTML = renderSubpanel(data);
      var width = estimatePanelWidth(data);
      document.body.style.setProperty('--kad-shell-panel-width', width + 'px');
      root.classList.add('has-submenu');
      document.body.classList.add('kad-shell-submenu');
    }

    sensor.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      toggleShell();
    });

    items.forEach(function(item){
      var key = item.getAttribute('data-item-key');
      var data = filteredMenu.find(function(entry){ return entry.key === key; });
      var main = item.querySelector('.kad-shell-main');
      if(!main) return;
      if(item.getAttribute('data-has-submenu') === '1'){
        main.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          openShell();
          if(activeItem === item){
            hideSubmenu();
          } else {
            showSubmenu(item, data);
          }
        });
      }
    });

    var logoutBtn = root.querySelector('.kad-shell-logout');
    if(logoutBtn){
      logoutBtn.addEventListener('click', async function(){
        try{
          if(window.ERPAuth && typeof window.ERPAuth.signOut === 'function'){
            await window.ERPAuth.signOut({ redirectTo:'login.html' });
            return;
          }
        }catch(_){ }
        try{
          if(window.__SUPA__ && window.__SUPA__.auth && typeof window.__SUPA__.auth.signOut === 'function'){
            await window.__SUPA__.auth.signOut();
          }
        }catch(_){ }
        window.location.href = 'login.html';
      });
    }

    document.addEventListener('click', function(ev){
      if(!root.classList.contains('is-open')) return;
      if(root.contains(ev.target)) return;
      closeShell();
    });

    document.addEventListener('keydown', function(ev){
      if(ev.key === 'Escape' && root.classList.contains('is-open')){
        closeShell();
      }
    });

    window.addEventListener('resize', function(){
      applyAdaptivePalette();
      if(activeItem){
        var key = activeItem.getAttribute('data-item-key');
        var data = filteredMenu.find(function(entry){ return entry.key === key; });
        if(data) document.body.style.setProperty('--kad-shell-panel-width', estimatePanelWidth(data) + 'px');
      }
    });

    if(window.MutationObserver){
      var mo = new MutationObserver(function(){ applyAdaptivePalette(); });
      mo.observe(document.documentElement, { attributes:true, attributeFilter:['style','class'] });
      mo.observe(document.body, { attributes:true, attributeFilter:['style','class'] });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount, { once:true });
  } else {
    mount();
  }
})();
