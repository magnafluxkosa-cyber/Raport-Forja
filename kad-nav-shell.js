
(function(){
  'use strict';

  function syncGlobalSavedTheme(){
    try {
      var saved = window.localStorage.getItem('user_theme_palette_v1')
        || (window.sessionStorage && window.sessionStorage.getItem('user_theme_palette_v1'))
        || window.localStorage.getItem('rf_theme_palette');
      if (!saved) return;
      window.localStorage.setItem('user_theme_palette_v1', saved);
      window.localStorage.setItem('rf_theme_palette', saved);
      if (window.sessionStorage) {
        window.sessionStorage.setItem('user_theme_palette_v1', saved);
        window.sessionStorage.setItem('rf_theme_palette', saved);
      }
      if (window.RF_THEME && typeof window.RF_THEME.setThemeKey === 'function') {
        window.RF_THEME.setThemeKey(saved);
      } else {
        document.documentElement.setAttribute('data-rf-theme', saved);
      }
    } catch (_) {}
  }
  syncGlobalSavedTheme();
  window.addEventListener('pageshow', syncGlobalSavedTheme);

  function ensureRegistry(next){
    if (window.RF_APP_REGISTRY) { next(); return; }
    var script = document.createElement('script');
    script.src = './rf-app-registry.js';
    script.onload = function(){ next(); };
    script.onerror = function(){ next(); };
    document.head.appendChild(script);
  }

  function start(){
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

  var MENU = (window.RF_APP_REGISTRY && typeof window.RF_APP_REGISTRY.getSideMenu === 'function')
    ? window.RF_APP_REGISTRY.getSideMenu()
    : [];


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

  function isFavKey(key){
    var k = String(key || '').trim().toLowerCase();
    if (!k) return false;
    try {
      if (window.RF_FAVORITES && typeof window.RF_FAVORITES.has === 'function') {
        return window.RF_FAVORITES.has(k);
      }
      var raw = (window.localStorage && window.localStorage.getItem('user_fav_pages_v1'))
        || (window.sessionStorage && window.sessionStorage.getItem('user_fav_pages_v1'));
      if (!raw) return false;
      var arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.map(function(v){ return String(v || '').trim().toLowerCase(); }).indexOf(k) >= 0;
    } catch (_) {
      return false;
    }
  }

  function linkHtml(link){
    var active = (link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath)) ? ' is-active' : '';
    if(link.disabled || !link.href){
      return '<span class="kad-shell-link'+active+'" aria-disabled="true">'+escapeHtml(link.label)+'</span>';
    }
    var key = String(link.key || link.href.replace(/\.html$/i, '') || '').trim().toLowerCase();
    var fav = isFavKey(key);
    var starHtml = (key && key !== 'index' && key.indexOf('group-') !== 0)
      ? '<span class="kad-shell-fav-star' + (fav ? ' is-fav' : '') + '" role="button" tabindex="0" data-fav-key="' + escapeHtml(key) + '" title="Fixează / scoate de la Favorite">' + (fav ? '★' : '☆') + '</span>'
      : '';
    return '<a class="kad-shell-link'+active+'" href="'+escapeHtml(link.href)+'" data-shell-page-key="'+escapeHtml(key)+'"><span class="kad-shell-link-text">'+escapeHtml(link.label)+'</span>'+starHtml+'</a>';
  }

  var SHELL_ICONS = {
    'index': '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    'group-forja': '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-8 8-6-6 8-8z"/><path d="M4 20l4-4"/><path d="M15 3l6 6"/></svg>',
    'group-prelucrari': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'group-tratament-termic': '<svg viewBox="0 0 24 24"><path d="M12 2c.5 3.5 3.5 5.5 3.5 9a5.5 5.5 0 1 1-11 0c0-2.5 1.5-4.5 3-6 .5 2 2 3 2 3s2-2.5 2.5-6z"/></svg>',
    'group-calitate': '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    'group-probleme-imbunatatire': '<svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>',
    'kpi': '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'group-planificari': '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    'group-resurse-umane': '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'group-sdv': '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    'group-administrator': '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };

  function buildItem(item){
    var active = itemContainsCurrent(item) ? ' is-active' : '';
    var iconSvg = SHELL_ICONS[item.key] || '';
    var iconHtml = iconSvg ? '<span class="kad-shell-cat-icon" aria-hidden="true">' + iconSvg + '</span>' : '';
    if(item.href){
      return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key || '')+'">'
        + '<a class="kad-shell-main" href="'+escapeHtml(item.href)+'">'+iconHtml+'<span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span></a>'
        + '</div>';
    }
    return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key || '')+'" data-has-submenu="1">'
      + '<button class="kad-shell-main" type="button" aria-expanded="false">'
      + iconHtml + '<span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span><span class="kad-shell-main-caret" aria-hidden="true"></span>'
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
      + '<div class="kad-shell-header"><div class="kad-shell-mini">K.A.D · Navigare</div><div class="kad-shell-brand">K.A.D</div><div class="kad-shell-current">'+escapeHtml(getCurrentLabel())+'</div><div class="kad-shell-search-wrap"><input type="search" class="kad-shell-search-input" placeholder="Caută pagină..." autocomplete="off" spellcheck="false" /></div></div>'
      + '<div class="kad-shell-layout"><nav class="kad-shell-navcol">'+filteredMenu.map(buildItem).join('')+'</nav><div class="kad-shell-subpanel"></div></div>'
      + '<div class="kad-shell-footer"><button type="button" class="kad-shell-logout">Logout</button><div class="kad-shell-note">click pe marginea stângă</div></div>'
      + '</aside>';
    document.body.appendChild(root);
    document.body.classList.add('kad-shell-mounted');
    applyAdaptivePalette();
    bind(root);
    try { if (window.RF_FAVORITES && typeof window.RF_FAVORITES.refresh === 'function') window.RF_FAVORITES.refresh(); } catch (_) {}
    window.setTimeout(applyAdaptivePalette, 80);
    window.setTimeout(applyAdaptivePalette, 600);
  }

  function foldSearchStr(str){
    return String(str || '').toLowerCase().normalize ? String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : String(str || '').toLowerCase().trim();
  }

  function bind(root){
    var shell = root.querySelector('.kad-shell');
    var sensor = root.querySelector('.kad-shell-edge-sensor');
    var subpanel = root.querySelector('.kad-shell-subpanel');
    var searchInp = root.querySelector('.kad-shell-search-input');
    var items = Array.prototype.slice.call(root.querySelectorAll('.kad-shell-item'));
    var activeItem = null;

    function openShell(){ root.classList.add('is-open'); document.body.classList.add('kad-shell-open'); }
    function closeShell(){ if(searchInp) searchInp.value = ''; hideSubmenu(); root.classList.remove('is-open'); document.body.classList.remove('kad-shell-open'); }
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

    if(searchInp){
      searchInp.addEventListener('click', function(ev){ ev.stopPropagation(); openShell(); });
      searchInp.addEventListener('input', function(){
        var q = foldSearchStr(searchInp.value);
        if(!q){ hideSubmenu(); return; }
        openShell();
        var matches = [];
        filteredMenu.forEach(function(group){
          if(group.href && foldSearchStr(group.label + ' ' + (group.key || '')).indexOf(q) !== -1){
            matches.push(group);
          }
          (group.sections || []).forEach(function(sec){
            (sec.links || []).forEach(function(lnk){
              if(foldSearchStr(lnk.label + ' ' + group.label + ' ' + (lnk.key || '')).indexOf(q) !== -1){
                matches.push(lnk);
              }
            });
          });
        });
        items.forEach(function(entry){ entry.classList.remove('is-open'); });
        activeItem = null;
        subpanel.innerHTML = '<div class="kad-shell-subtitle">Rezultate (' + matches.length + ')</div>'
          + '<section class="kad-shell-section"><div class="kad-shell-link-grid">'
          + (matches.length ? matches.map(linkHtml).join('') : '<span class="kad-shell-link" aria-disabled="true">Niciun rezultat</span>')
          + '</div></section>';
        var w = Math.min(Math.max(420, window.innerWidth - 28), 620);
        document.body.style.setProperty('--kad-shell-panel-width', w + 'px');
        root.classList.add('has-submenu');
        document.body.classList.add('kad-shell-submenu');
      });
    }

    sensor.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      toggleShell();
    });

    function syncShellStars(){
      Array.prototype.slice.call(subpanel.querySelectorAll('.kad-shell-fav-star[data-fav-key]')).forEach(function(star){
        var k = star.getAttribute('data-fav-key') || '';
        var on = isFavKey(k);
        star.classList.toggle('is-fav', on);
        star.textContent = on ? '★' : '☆';
      });
    }
    window.__kadSyncShellFavorites = syncShellStars;

    subpanel.addEventListener('click', function(ev){
      var star = ev.target && ev.target.closest ? ev.target.closest('.kad-shell-fav-star[data-fav-key]') : null;
      if (!star) return;
      ev.preventDefault();
      ev.stopPropagation();
      var k = star.getAttribute('data-fav-key') || '';
      if (!k) return;
      if (window.RF_FAVORITES && typeof window.RF_FAVORITES.toggle === 'function') {
        window.RF_FAVORITES.toggle(k);
      }
      syncShellStars();
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


  }

  ensureRegistry(start);
})();


(function(){
  'use strict';
  if (window.__RF_SECURITY_HARDENING__) return;
  window.__RF_SECURITY_HARDENING__ = true;

  var PAGE_KEY = (function(){
    try {
      var path = window.location.pathname || '';
      var name = path.split('/').pop() || 'index.html';
      return String(name).replace(/\.html$/i, '').toLowerCase() || 'index';
    } catch (_) {
      return 'index';
    }
  })();

  var PAGE_CONFIGS = {
    'stoc-matrite': {
      disableSelectors: ['#btnSave', '.manualSel', '.hInp', '.rowEditInp', '.rowEditSel', '.rowBtn', 'tr[data-row-open]'],
      allowSelectors: ['#selReper', '#btnRefresh', '.back-btn', '.actions a', '#repereList']
    },
    'utilaje-matrite': {
      disableSelectors: ['#btnSave', 'input[data-i]'],
      allowSelectors: ['.back-btn', '.actions a']
    }
  };

  function ensurePendingStyle(){
    if (document.getElementById('rf-security-pending-style')) return;
    var style = document.createElement('style');
    style.id = 'rf-security-pending-style';
    style.textContent = '' +
      'html.rf-security-pending body{visibility:hidden !important;}' +
      'html.rf-security-pending body > *{visibility:hidden !important;}' +
      'html.rf-security-ready body{visibility:visible !important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function setPending(enabled){
    try {
      ensurePendingStyle();
      if (!document.documentElement) return;
      if (enabled) {
        document.documentElement.classList.add('rf-security-pending');
        document.documentElement.classList.remove('rf-security-ready');
      } else {
        document.documentElement.classList.remove('rf-security-pending');
        document.documentElement.classList.add('rf-security-ready');
      }
    } catch (_) {}
  }

  if (PAGE_KEY !== 'index' && PAGE_KEY !== 'login') setPending(true);

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function getPageLabel(){
    try {
      if (window.RF_ACL && window.RF_ACL.PAGE_MAP && window.RF_ACL.PAGE_MAP[PAGE_KEY]) return String(window.RF_ACL.PAGE_MAP[PAGE_KEY]);
      var title = String(document.title || '').trim();
      if (title) return title.replace(/\s*-\s*K\.A\.D\s*$/i, '').trim() || title;
    } catch (_) {}
    return PAGE_KEY;
  }

  function getClient(){
    try {
      if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') return window.ERPAuth.getSupabaseClient();
    } catch (_) {}
    try {
      if (typeof window.createRfSupabaseClient === 'function') return window.createRfSupabaseClient();
    } catch (_) {}
    try {
      if (window.supabase && typeof window.createRfSupabaseClient === 'function' && window.RF_CONFIG && window.RF_CONFIG.SUPABASE_URL && window.RF_CONFIG.SUPABASE_ANON_KEY) {
        return window.createRfSupabaseClient(window.RF_CONFIG.SUPABASE_URL, window.RF_CONFIG.SUPABASE_ANON_KEY, {
          auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
        });
      }
    } catch (_) {}
    return null;
  }

  function buildLoginHref(){
    try {
      if (window.ERPAuth && typeof window.ERPAuth.buildLoginUrl === 'function') {
        return window.ERPAuth.buildLoginUrl((PAGE_KEY || 'index') + '.html');
      }
    } catch (_) {}
    try {
      var url = new URL('login.html', window.location.href);
      url.searchParams.set('next', (PAGE_KEY || 'index') + '.html');
      return url.toString();
    } catch (_) {
      return 'login.html';
    }
  }

  function showDenied(message){
    setPending(false);
    try {
      if (window.ERPAuth && typeof window.ERPAuth.renderAccessDeniedPage === 'function') {
        window.ERPAuth.renderAccessDeniedPage(getPageLabel(), message || 'Nu ai permisiune de vizualizare pentru această pagină.');
        return;
      }
    } catch (_) {}
    try {
      if (window.RF_ACL && typeof window.RF_ACL.renderAccessDeniedPage === 'function') {
        window.RF_ACL.renderAccessDeniedPage(PAGE_KEY, message || 'Nu ai permisiune de vizualizare pentru această pagină.');
        return;
      }
    } catch (_) {}
    if (!document.body) return;
    document.body.innerHTML = '' +
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#c8def0;font-family:Arial,Helvetica,sans-serif;color:#0d2240;">' +
        '<div style="width:min(640px,100%);background:#d7e6f4;border:2px solid #1b1b1b;border-radius:18px;padding:28px;box-shadow:0 1px 0 rgba(0,0,0,.06);text-align:center;">' +
          '<div style="font-size:32px;font-weight:800;line-height:1.1;margin:0 0 12px;">Acces restricționat</div>' +
          '<div style="font-size:18px;font-weight:700;margin:0 0 10px;">' + escapeHtml(getPageLabel()) + '</div>' +
          '<div style="font-size:16px;line-height:1.5;margin:0 0 22px;">' + escapeHtml(message || 'Nu ai permisiune de vizualizare pentru această pagină.') + '</div>' +
          '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
            '<a href="' + escapeHtml(buildLoginHref()) + '" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:2px solid #1b1b1b;border-radius:12px;background:#fff;color:#0d2240;font-weight:700;">Login</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function isLikelyFilter(el, config){
    if (!el) return false;
    try {
      if (el.closest && el.closest('[data-acl-filter]')) return true;
    } catch (_) {}
    try {
      if (el.matches && el.matches('.summary-select,.th-filter,.th-filter-select,.filter-input,.filter-select,.search-input,.search-select')) return true;
      if (el.closest && el.closest('.summary-toolbar-controls,.filters,.filter-bar,.toolbar-filters,.table-filters,.top-filters,.search-bar,.search-controls')) return true;
    } catch (_) {}
    try {
      var allow = config && Array.isArray(config.allowSelectors) ? config.allowSelectors : [];
      for (var i = 0; i < allow.length; i += 1) {
        if (allow[i] && el.matches && el.matches(allow[i])) return true;
        if (allow[i] && el.closest && el.closest(allow[i])) return true;
      }
    } catch (_) {}
    var s = [el.id || '', el.name || '', el.className || '', (el.getAttribute && el.getAttribute('placeholder')) || '', (el.getAttribute && el.getAttribute('aria-label')) || ''].join(' ').toLowerCase();
    return /(filter|search|find|sort|view|refresh|sel|select|reper|utilaj|luna|lun[ăa]|an|month|year|cauta|căuta|filtr|lookup|vizual|furnizor|supplier|vendor|provider|transport|lada|lad[ăa]|cod|matrita|matri[țt]a|operator|schimb|shift|status)/.test(s);
  }

  function isMutationTrigger(el, config){
    if (!el) return false;
    try {
      var disable = config && Array.isArray(config.disableSelectors) ? config.disableSelectors : [];
      for (var i = 0; i < disable.length; i += 1) {
        if (disable[i] && el.matches && el.matches(disable[i])) return true;
        if (disable[i] && el.closest && el.closest(disable[i])) return true;
      }
    } catch (_) {}
    var txt = [el.textContent || '', el.value || '', el.id || '', el.className || '', (el.getAttribute && el.getAttribute('title')) || '', (el.getAttribute && el.getAttribute('aria-label')) || ''].join(' ').trim();
    return /(save|salveaz|adaug|import|sterg|șterg|delete|reset|clear|restore|upload|nou|new|edit|modific|actualiz|actualizeaz|remove|trash|sterge|ștergere)/i.test(txt);
  }

  function markDisabled(el){
    if (!el) return;
    try { el.disabled = true; } catch (_) {}
    try { el.readOnly = true; } catch (_) {}
    try { el.setAttribute('data-acl-disabled', '1'); } catch (_) {}
    try { el.style.pointerEvents = 'none'; } catch (_) {}
    try { el.style.opacity = '0.45'; } catch (_) {}
  }

  function applyViewOnly(config){
    if (window.__RF_VIEW_ONLY_GUARDS__) return;
    window.__RF_VIEW_ONLY_GUARDS__ = true;
    window.__CAN_EDIT__ = false;
    document.documentElement.setAttribute('data-acl-viewonly', '1');

    var selectors = 'button,input[type="button"],input[type="submit"],label.btn,a.btn,.btn,.icon-btn';
    Array.prototype.slice.call(document.querySelectorAll(selectors)).forEach(function(el){
      if (isLikelyFilter(el, config)) return;
      if (isMutationTrigger(el, config)) markDisabled(el);
    });

    Array.prototype.slice.call(document.querySelectorAll('input,textarea,select')).forEach(function(el){
      if (isLikelyFilter(el, config)) return;
      markDisabled(el);
    });

    Array.prototype.slice.call(document.querySelectorAll('[contenteditable="true"]')).forEach(function(el){
      if (isLikelyFilter(el, config)) return;
      try { el.setAttribute('contenteditable', 'false'); } catch (_) {}
      markDisabled(el);
    });

    function prevent(e){
      var t = e && e.target ? e.target : null;
      if (!t) return;
      if (isLikelyFilter(t, config)) return;
      if (isMutationTrigger(t, config) || t.matches && t.matches('[contenteditable="true"],input,textarea,select,[data-acl-disabled="1"]') || t.closest && t.closest('[contenteditable="true"],[data-acl-disabled="1"]')) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        return false;
      }
    }

    function preventTyping(e){
      var t = e && e.target ? e.target : null;
      if (!t || isLikelyFilter(t, config)) return;
      var isField = !!(t.matches && t.matches('input,textarea,select,[contenteditable="true"]')) || !!(t.closest && t.closest('[contenteditable="true"]'));
      if (!isField) return;
      var key = String(e.key || '');
      if (/^(Tab|Escape|Shift|Control|Alt|Meta|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|PageUp|PageDown)$/.test(key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      return false;
    }

    ['beforeinput','paste','drop','submit','click','dblclick'].forEach(function(ev){ document.addEventListener(ev, prevent, true); });
    document.addEventListener('keydown', preventTyping, true);
  }

  async function resolveAccess(){
    var client = getClient();
    if (!client || !window.RF_ACL || typeof window.RF_ACL.resolvePageAccess !== 'function') {
      return { ok:false, reason:'acl-unavailable' };
    }
    try {
      var access = await window.RF_ACL.resolvePageAccess(PAGE_KEY, { client: client });
      return { ok:true, access: access };
    } catch (error) {
      return { ok:false, reason:'resolve-failed', error:error };
    }
  }

  async function enforce(){
    if (PAGE_KEY === 'index' || PAGE_KEY === 'login') {
      setPending(false);
      return;
    }

    var config = PAGE_CONFIGS[PAGE_KEY] || {};
    var result = await resolveAccess();
    if (!result.ok || !result.access) {
      showDenied('Accesul nu a putut fi validat în siguranță.');
      return;
    }

    var access = result.access;
    var perms = access.permissions || access;
    var canView = !!(access.allowed !== false && perms && perms.can_view !== false);
    var canEdit = !!(perms && (perms.can_edit === true || perms.can_add === true || perms.can_import === true || access.can_edit === true));

    window.__PAGE_ACCESS__ = perms;
    window.__CAN_VIEW__ = canView;
    window.__CAN_EDIT__ = canEdit;

    if (!canView) {
      if (String(access.source || '') === 'no session') {
        try {
          window.location.replace(buildLoginHref());
          return;
        } catch (_) {}
      }
      showDenied(access.message || 'Nu ai permisiune de vizualizare pentru această pagină.');
      return;
    }

    setPending(false);
    try {
      if (window.ERPAuth && typeof window.ERPAuth.showProtectedPage === 'function') window.ERPAuth.showProtectedPage();
    } catch (_) {}

    if (!canEdit) applyViewOnly(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ enforce(); }, { once:true });
  } else {
    enforce();
  }
})();
