(function(){
  'use strict';

  var currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var currentKey = currentPath.replace(/\.html$/i, '');

  function getStoredHidden(){
    function parse(raw){
      if(!raw) return null;
      try{
        var data = JSON.parse(raw);
        if(!data || typeof data !== 'object') return null;
        return Array.isArray(data.hidden) ? data.hidden.map(function(v){ return String(v || '').trim(); }).filter(Boolean) : [];
      }catch(_){
        return null;
      }
    }
    try{
      return parse(window.sessionStorage && sessionStorage.getItem('rf_hidden_index_buttons'))
        || parse(window.localStorage && localStorage.getItem('rf_hidden_index_buttons'))
        || [];
    }catch(_){
      return [];
    }
  }

  var hiddenSet = new Set(getStoredHidden());

  var MENU = [
    {
      key:'group-forja',
      label:'FORJĂ',
      sections:[
        {
          key:'forja-rapoarte',
          label:'Rapoarte',
          links:[
            { key:'numeralkod', label:'NUMERALKOD', href:'numeralkod.html' },
            { key:'intrari-otel', label:'INTRĂRI OȚEL', href:'intrari-otel.html' },
            { key:'debitate', label:'DEBITATE', href:'debitate.html' },
            { key:'forjate', label:'FORJATE', href:'forjate.html' },
            { key:'eficienta', label:'EFICIENȚĂ', href:'eficienta.html' },
            { key:'program-utilaje', label:'PROGRAM UTILAJE', href:'program-utilaje.html' }
          ]
        },
        {
          key:'forja-zale',
          label:'Urmărire zale',
          links:[
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
          ]
        },
        {
          key:'forja-inventar',
          label:'Inventar',
          links:[
            { key:'inventar-otel', label:'INVENTAR OȚEL', href:'inventar-otel.html' },
            { key:'inventar-debitat', label:'INVENTAR DEBITAT', href:'inventar-debitat.html' },
            { key:'inventar-forjat', label:'INVENTAR FORJAT', href:'inventar-forjat.html' },
            { key:'stoc-ramas-teoretic', label:'STOC RĂMAS TEORETIC', href:'stoc-ramas-teoretic.html' }
          ]
        }
      ]
    },
    {
      key:'group-prelucrari',
      label:'PRELUCRĂRI MECANICE',
      sections:[
        {
          key:'prelucrari-coming-soon',
          label:'Secțiune',
          links:[
            { key:'prelucrari-placeholder', label:'În lucru — paginile pot fi adăugate aici', href:null, disabled:true }
          ]
        }
      ]
    },
    {
      key:'group-tratament-termic',
      label:'TRATAMENT TERMIC',
      sections:[
        {
          key:'tratament-termic-links',
          label:'Pagini',
          links:[
            { key:'tratament-termic-rapoarte', label:'RAPOARTE', href:'tratament-termic-rapoarte.html' },
            { key:'tratament-termic-probleme', label:'PROBLEME T.T', href:'tratament-termic-probleme.html' },
            { key:'tratament-termic-fise-tehnologice', label:'FIȘE TEHNOLOGICE', href:'tratament-termic-fise-tehnologice.html' }
          ]
        }
      ]
    },
    {
      key:'group-calitate',
      label:'CALITATE',
      sections:[
        {
          key:'calitate-links',
          label:'Pagini',
          links:[
            { key:'magnaflux', label:'MAGNAFLUX', href:'magnaflux.html' },
            { key:'rebut', label:'REBUT', href:'rebut.html' },
            { key:'rebut-pm', label:'REBUT PM', href:'rebut-pm.html' },
            { key:'rebut-pm-helper', label:'REBUT PM HELPER', href:'rebut-pm-helper.html' },
            { key:'magnaflux-calendar', label:'CALENDAR MAGNAFLUX', href:'magnaflux-calendar.html' },
            { key:'calendar-operatori', label:'CALENDAR OPERATORI', href:'calendar-operatori.html' }
          ]
        }
      ]
    },
    {
      key:'group-probleme-imbunatatire',
      label:'PROBLEME · ÎMBUNĂTĂȚIRI',
      sections:[
        {
          key:'probleme-links',
          label:'Pagini',
          links:[
            { key:'probleme-raportate', label:'PROBLEME RAPORTATE', href:'probleme-raportate.html' },
            { key:'urmarire-actiuni-progres', label:'URMĂRIRE ACȚIUNI ȘI PROGRES', href:'urmarire-actiuni-progres.html' },
            { key:'imbunatatire-continua', label:'ÎMBUNĂTĂȚIRE CONTINUĂ', href:'imbunatatire-continua.html' },
            { key:'investitii', label:'INVESTIȚII', href:'investitii.html' }
          ]
        }
      ]
    },
    { key:'kpi', label:'KPI', href:'kpi.html' },
    {
      key:'group-planificari',
      label:'PLANIFICĂRI',
      sections:[
        {
          key:'planificari-links',
          label:'Pagini',
          links:[
            { key:'planificare-forja', label:'PLANIFICARE FORJĂ', href:'planificare-forja.html' },
            { key:'comenzi-livrare', label:'COMENZI LIVRARE', href:'comenzi-livrare.html' },
            { key:'mrc-necesar-otel', label:'MRC / NECESAR OȚEL', href:'mrc-necesar-otel.html' },
            { key:'mrc-comenzi-otel', label:'COMENZI OȚEL', href:'mrc-comenzi-otel.html' },
            { key:'mrc-comenzi-saptamanale', label:'COMENZI SĂPTĂMÂNALE', href:'mrc-comenzi-saptamanale.html' }
          ]
        }
      ]
    },
    { key:'helper', label:'HELPER', href:'helper.html' },
    { key:'helper-data', label:'HELPER-DATA', href:'helper-data.html' },
    { key:'helper-acl', label:'HELPER-ACL', href:'helper-acl.html' }
  ];

  function normalizeLabel(text){
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function getActivePageLabel(){
    var match = findByKey(MENU, currentKey);
    return match ? match.label : normalizeLabel(document.title || currentKey || 'Dashboard');
  }

  function isVisibleKey(key){
    return !!key && !hiddenSet.has(key);
  }

  function filterMenu(items){
    return items.map(function(item){
      if(!isVisibleKey(item.key)) return null;
      var clone = Object.assign({}, item);
      if(Array.isArray(item.sections)){
        clone.sections = item.sections.map(function(section){
          var s = Object.assign({}, section);
          s.links = (section.links || []).filter(function(link){
            return !link.key || isVisibleKey(link.key);
          });
          return s.links.length ? s : null;
        }).filter(Boolean);
        if(!clone.sections.length && !clone.href) return null;
      }
      return clone;
    }).filter(Boolean);
  }

  function findByKey(items, key){
    for(var i=0;i<items.length;i++){
      var item = items[i];
      if(item.key === key) return item;
      if(item.sections){
        for(var j=0;j<item.sections.length;j++){
          var sec = item.sections[j];
          if(sec.key === key) return sec;
          for(var k=0;k<(sec.links||[]).length;k++){
            var link = sec.links[k];
            if(link.key === key) return link;
          }
        }
      }
    }
    return null;
  }

  function itemContainsCurrent(item){
    if(item.key === currentKey) return true;
    if(item.href && item.href.toLowerCase() === currentPath) return true;
    if(item.sections){
      return item.sections.some(function(section){
        return (section.links || []).some(function(link){
          return link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath);
        });
      });
    }
    return false;
  }

  function escapeHtml(str){
    return String(str == null ? '' : str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function linkHtml(link){
    var activeClass = (link.key === currentKey || (link.href && link.href.toLowerCase() === currentPath)) ? ' is-active' : '';
    if(link.disabled || !link.href){
      return '<span class="kad-shell-flyout-link' + activeClass + '" aria-disabled="true">' + escapeHtml(link.label) + '</span>';
    }
    return '<a class="kad-shell-flyout-link' + activeClass + '" data-kad-nav-link="1" data-page-key="' + escapeHtml(link.key || '') + '" href="' + escapeHtml(link.href) + '">' + escapeHtml(link.label) + '</a>';
  }

  function itemHtml(item){
    var active = itemContainsCurrent(item) ? ' is-active' : '';
    if(item.href){
      return '' +
        '<div class="kad-shell-item' + active + '" data-page-key="' + escapeHtml(item.key || '') + '">' +
          '<a class="kad-shell-main" data-kad-nav-link="1" href="' + escapeHtml(item.href) + '">' +
            '<span class="kad-shell-main-label">' + escapeHtml(item.label) + '</span>' +
          '</a>' +
        '</div>';
    }

    var sectionsHtml = (item.sections || []).map(function(section){
      return '' +
        '<section class="kad-shell-section" data-page-key="' + escapeHtml(section.key || '') + '">' +
          '<h3 class="kad-shell-section-label">' + escapeHtml(section.label) + '</h3>' +
          '<div class="kad-shell-link-grid">' + (section.links || []).map(linkHtml).join('') + '</div>' +
        '</section>';
    }).join('');

    return '' +
      '<div class="kad-shell-item' + active + '" data-page-key="' + escapeHtml(item.key || '') + '">' +
        '<button class="kad-shell-main" type="button" aria-expanded="false">' +
          '<span class="kad-shell-main-label">' + escapeHtml(item.label) + '</span>' +
          '<span class="kad-shell-main-caret" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="kad-shell-flyout" role="group" aria-label="' + escapeHtml(item.label) + '">' +
          '<div class="kad-shell-flyout-title">Navigare rapidă</div>' +
          sectionsHtml +
        '</div>' +
      '</div>';
  }

  function mount(){
    if(document.getElementById('kadNavShellRoot')) return;

    var filtered = filterMenu(MENU);
    var shellRoot = document.createElement('div');
    shellRoot.id = 'kadNavShellRoot';
    shellRoot.innerHTML = '' +
      '<div class="kad-shell-edge" aria-hidden="true"></div>' +
      '<aside class="kad-shell" aria-label="Navigare proiect K.A.D">' +
        '<div class="kad-shell-header">' +
          '<div class="kad-shell-caption">K.A.D · Navigare</div>' +
          '<div class="kad-shell-brand">K.A.D</div>' +
          '<div class="kad-shell-active-page">' + escapeHtml(getActivePageLabel()) + '</div>' +
        '</div>' +
        '<nav class="kad-shell-nav">' + filtered.map(itemHtml).join('') + '</nav>' +
        '<div class="kad-shell-utility">' +
          '<a class="kad-shell-utility-link" data-kad-nav-link="1" href="index.html">Dashboard</a>' +
          '<a class="kad-shell-utility-link" data-kad-nav-link="1" href="login.html">Login</a>' +
          '<div class="kad-shell-note">hover la marginea stângă</div>' +
        '</div>' +
      '</aside>' +
      '<div class="kad-shell-transition" aria-hidden="true"></div>';

    document.body.appendChild(shellRoot);
    document.body.classList.add('kad-shell-mounted');
    bindShell(shellRoot);
  }

  function bindShell(root){
    var edge = root.querySelector('.kad-shell-edge');
    var shell = root.querySelector('.kad-shell');
    var transition = root.querySelector('.kad-shell-transition');
    var closeTimer = 0;
    var openTimer = 0;
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    function clearTimers(){
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
    }

    function openShell(){
      clearTimers();
      root.classList.add('is-open');
    }

    function closeShell(){
      clearTimers();
      closeTimer = window.setTimeout(function(){
        root.classList.remove('is-open');
        closeAllItems();
      }, 140);
    }

    function closeAllItems(except){
      root.querySelectorAll('.kad-shell-item.is-open').forEach(function(item){
        if(item !== except){
          item.classList.remove('is-open');
          var btn = item.querySelector('.kad-shell-main');
          if(btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    edge.addEventListener('mouseenter', function(){
      openTimer = window.setTimeout(openShell, 20);
    });
    shell.addEventListener('mouseenter', openShell);
    shell.addEventListener('mouseleave', closeShell);
    edge.addEventListener('mouseleave', function(){
      if(!shell.matches(':hover')) closeShell();
    });
    shell.addEventListener('focusin', openShell);
    shell.addEventListener('focusout', function(){
      window.setTimeout(function(){
        if(!shell.contains(document.activeElement)) closeShell();
      }, 0);
    });

    function layoutFlyout(item, flyout){
      if(!item || !flyout || window.innerWidth <= 1100) return;

      item.style.setProperty('--kad-flyout-top', '0px');

      var links = flyout.querySelectorAll('.kad-shell-flyout-link').length;
      var shellRect = shell.getBoundingClientRect();
      var gap = 18;
      var availableWidth = Math.max(320, window.innerWidth - shellRect.right - gap);
      var minColWidth = 190;
      var panelPadding = 28;
      var maxCols = Math.max(1, Math.floor((availableWidth - panelPadding) / minColWidth));
      var cols = links > 20 ? 5 : links > 12 ? 4 : links > 6 ? 3 : links > 3 ? 2 : 1;
      cols = Math.max(1, Math.min(cols, maxCols));

      function applySize(){
        var desiredWidth = Math.min(availableWidth, cols * minColWidth + panelPadding);
        item.style.setProperty('--kad-flyout-max-width', availableWidth + 'px');
        item.style.setProperty('--kad-flyout-width', desiredWidth + 'px');
        item.style.setProperty('--kad-flyout-cols', String(cols));
      }

      applySize();

      var viewportLimit = window.innerHeight - 28;
      var tries = 0;
      while(tries < 8){
        var height = flyout.offsetHeight;
        if(height <= viewportLimit || cols >= maxCols) break;
        cols += 1;
        applySize();
        tries += 1;
      }

      var rect = flyout.getBoundingClientRect();
      var shift = 0;
      if(rect.right > window.innerWidth - 12){
        var clipped = rect.right - (window.innerWidth - 12);
        var newWidth = Math.max(320, parseFloat(getComputedStyle(item).getPropertyValue('--kad-flyout-width')) - clipped);
        item.style.setProperty('--kad-flyout-width', newWidth + 'px');
        rect = flyout.getBoundingClientRect();
      }
      if(rect.bottom > window.innerHeight - 14){
        shift -= rect.bottom - (window.innerHeight - 14);
      }
      if(rect.top + shift < 14){
        shift += 14 - (rect.top + shift);
      }
      item.style.setProperty('--kad-flyout-top', shift + 'px');
    }

    root.querySelectorAll('.kad-shell-item').forEach(function(item){
      var main = item.querySelector('.kad-shell-main');
      var flyout = item.querySelector('.kad-shell-flyout');
      var hasFlyout = !!flyout;
      if(!main || !hasFlyout) return;

      function showItem(){
        closeAllItems(item);
        item.classList.add('is-open');
        main.setAttribute('aria-expanded', 'true');
        openShell();
        window.requestAnimationFrame(function(){
          layoutFlyout(item, flyout);
        });
      }

      function hideItem(){
        if(isTouch) return;
        window.setTimeout(function(){
          if(!item.matches(':hover') && !item.contains(document.activeElement)){
            item.classList.remove('is-open');
            main.setAttribute('aria-expanded', 'false');
            item.style.setProperty('--kad-flyout-top', '0px');
          }
        }, 120);
      }

      item.addEventListener('mouseenter', function(){ if(!isTouch) showItem(); });
      item.addEventListener('mouseleave', hideItem);
      main.addEventListener('click', function(ev){
        ev.preventDefault();
        var open = item.classList.contains('is-open');
        closeAllItems();
        if(!open){
          item.classList.add('is-open');
          main.setAttribute('aria-expanded', 'true');
          openShell();
          window.requestAnimationFrame(function(){
            layoutFlyout(item, flyout);
          });
        }else{
          item.classList.remove('is-open');
          main.setAttribute('aria-expanded', 'false');
          item.style.setProperty('--kad-flyout-top', '0px');
        }
      });
    });

    window.addEventListener('resize', function(){
      root.querySelectorAll('.kad-shell-item.is-open').forEach(function(item){
        var flyout = item.querySelector('.kad-shell-flyout');
        if(flyout) layoutFlyout(item, flyout);
      });
    });

    root.addEventListener('click', function(ev){
      var link = ev.target.closest('a[data-kad-nav-link]');
      if(!link) return;
      var href = link.getAttribute('href');
      if(!href || href === '#' || link.target === '_blank' || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if(/^https?:/i.test(href) && !href.startsWith(window.location.origin)) return;
      ev.preventDefault();
      navigateWithPulse(href, ev.clientX, ev.clientY, transition);
    });

    document.addEventListener('keydown', function(ev){
      if(ev.key === 'Escape'){
        root.classList.remove('is-open');
        closeAllItems();
      }
    });
  }

  function navigateWithPulse(href, clientX, clientY, transition){
    if(!transition) return window.location.href = href;
    var x = typeof clientX === 'number' ? clientX : 72;
    var y = typeof clientY === 'number' ? clientY : window.innerHeight / 2;
    transition.style.setProperty('--kad-x', x + 'px');
    transition.style.setProperty('--kad-y', y + 'px');
    transition.classList.remove('is-active');
    void transition.offsetWidth;
    transition.classList.add('is-active');
    window.setTimeout(function(){
      window.location.href = href;
    }, 470);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount, { once:true });
  }else{
    mount();
  }
})();
