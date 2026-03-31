(function(){
  'use strict';

  var currentPath = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if(!currentPath || currentPath === 'login.html' || currentPath === 'index.html') return;

  var MENU = [
    { key:'group-forja', label:'FORJĂ', sections:[
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
    ]},
    { key:'group-tratament-termic', label:'TRATAMENT TERMIC', sections:[
      { key:'tratament-termic-links', label:'Pagini', links:[
        { key:'tratament-termic-rapoarte', label:'RAPOARTE', href:'tratament-termic-rapoarte.html' },
        { key:'tratament-termic-probleme', label:'PROBLEME T.T', href:'tratament-termic-probleme.html' },
        { key:'tratament-termic-fise-tehnologice', label:'FIȘE TEHNOLOGICE', href:'tratament-termic-fise-tehnologice.html' }
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
    { key:'group-probleme', label:'PROBLEME · ÎMBUNĂTĂȚIRI', sections:[
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
  if(document.querySelector('a[href="helper.html"],button[data-page="helper"],#helperPage')) MENU.splice(MENU.length-2,0,{ key:'helper', label:'HELPER', href:'helper.html' });

  function escapeHtml(str){ return String(str == null ? '' : str).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function currentKey(){ return currentPath.replace(/\.html$/i,''); }
  function parseHidden(raw){ if(!raw) return null; try{ var d=JSON.parse(raw); return Array.isArray(d && d.hidden) ? d.hidden.map(function(v){ return String(v||'').trim(); }).filter(Boolean) : null; }catch(_){ return null; } }
  function getHiddenSet(){ try{ return new Set(parseHidden(sessionStorage.getItem('rf_hidden_index_buttons')) || parseHidden(localStorage.getItem('rf_hidden_index_buttons')) || []); }catch(_){ return new Set(); } }
  var hiddenSet = getHiddenSet();

  function isVisibleByHidden(key){ return !key || !hiddenSet.has(key); }
  function normalizeHref(href){ return String(href||'').split('?')[0].split('#')[0].toLowerCase(); }
  function itemContainsCurrent(item){
    var ck=currentKey();
    if(item.key===ck || normalizeHref(item.href)===currentPath) return true;
    return !!(item.sections && item.sections.some(function(section){ return (section.links||[]).some(function(link){ return link.key===ck || normalizeHref(link.href)===currentPath; }); }));
  }

  function filterHidden(items){
    return items.map(function(item){
      if(!isVisibleByHidden(item.key)) return null;
      var clone = Object.assign({}, item);
      if(item.sections){
        clone.sections = item.sections.map(function(section){
          var s = Object.assign({}, section);
          s.links = (section.links||[]).filter(function(link){ return isVisibleByHidden(link.key); });
          return s.links.length ? s : null;
        }).filter(Boolean);
        if(!clone.sections.length && !clone.href) return null;
      }
      return clone;
    }).filter(Boolean);
  }

  function buildLink(link){
    var active = (link.key===currentKey() || normalizeHref(link.href)===currentPath) ? ' is-active' : '';
    if(!link.href) return '<span class="kad-shell-link'+active+'" aria-disabled="true">'+escapeHtml(link.label)+'</span>';
    return '<a class="kad-shell-link'+active+'" href="'+escapeHtml(link.href)+'">'+escapeHtml(link.label)+'</a>';
  }
  function buildItem(item){
    var active = itemContainsCurrent(item) ? ' is-active' : '';
    if(item.href){
      return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key||'')+'"><a class="kad-shell-main" href="'+escapeHtml(item.href)+'"><span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span></a></div>';
    }
    return '<div class="kad-shell-item'+active+'" data-item-key="'+escapeHtml(item.key||'')+'" data-has-submenu="1"><button class="kad-shell-main" type="button" aria-expanded="false"><span class="kad-shell-main-label">'+escapeHtml(item.label)+'</span><span class="kad-shell-main-caret" aria-hidden="true"></span></button></div>';
  }
  function renderSubpanel(item){
    if(!item || !item.sections) return '';
    return '<div class="kad-shell-subtitle">'+escapeHtml(item.label)+'</div>' + item.sections.map(function(section){
      return '<section class="kad-shell-section"><div class="kad-shell-section-label">'+escapeHtml(section.label)+'</div><div class="kad-shell-link-grid">'+(section.links||[]).map(buildLink).join('')+'</div></section>';
    }).join('');
  }
  function estimatePanelWidth(item){
    if(!item || !item.sections) return 220;
    var linkCount=0, maxLabel=0;
    item.sections.forEach(function(s){ (s.links||[]).forEach(function(l){ linkCount++; maxLabel=Math.max(maxLabel,String(l.label||'').length); }); });
    var columns = linkCount > 10 || maxLabel > 18 ? 2 : 1;
    var width = 220 + 18 + (columns * 190) + 40;
    return Math.min(Math.max(width, 420), Math.max(420, window.innerWidth - 28));
  }

  function findCurrentLabel(items){
    var label = document.title || currentKey() || 'K.A.D';
    items.some(function(item){
      if(item.key===currentKey() || normalizeHref(item.href)===currentPath){ label=item.label; return true; }
      return !!(item.sections && item.sections.some(function(s){ return (s.links||[]).some(function(l){ if(l.key===currentKey() || normalizeHref(l.href)===currentPath){ label=l.label; return true; } return false; }); }));
    });
    return label;
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

  function openState(root, open){
    root.classList.toggle('is-open', !!open);
    document.body.classList.toggle('kad-shell-open', !!open);
  }

  function closeSubmenu(root){
    root.classList.remove('has-submenu');
    document.body.classList.remove('kad-shell-submenu');
    var panel = root.querySelector('.kad-shell-subpanel');
    if(panel) panel.innerHTML='';
    root.querySelectorAll('.kad-shell-item.is-open').forEach(function(el){ el.classList.remove('is-open'); var btn=el.querySelector('.kad-shell-main'); if(btn) btn.setAttribute('aria-expanded','false'); });
  }

  function openSubmenu(root, item, trigger){
    if(!item || !item.sections) return;
    closeSubmenu(root);
    var panel = root.querySelector('.kad-shell-subpanel');
    panel.innerHTML = renderSubpanel(item);
    root.classList.add('has-submenu');
    document.body.classList.add('kad-shell-submenu');
    document.documentElement.style.setProperty('--kad-shell-panel-width', estimatePanelWidth(item)+'px');
    if(trigger){ trigger.classList.add('is-open'); var btn=trigger.querySelector('.kad-shell-main'); if(btn) btn.setAttribute('aria-expanded','true'); }
  }

  async function filterAcl(items){
    if(!window.ERPAuth || !window.RF_ACL || typeof window.ERPAuth.getCurrentUserWithRole !== 'function') return items;
    try{
      var auth = await window.ERPAuth.getCurrentUserWithRole();
      var client = window.ERPAuth.getSupabaseClient();
      var user = auth && auth.user ? auth.user : null;
      var out = [];
      for(var i=0;i<items.length;i++){
        var item = Object.assign({}, items[i]);
        if(item.href){
          var access = await window.RF_ACL.resolvePageAccess({ client:client, user:user, href:item.href, pageKey:item.key });
          if(access && access.allowed === false) continue;
          out.push(item);
          continue;
        }
        if(item.sections){
          var sections = [];
          for(var j=0;j<item.sections.length;j++){
            var sec = Object.assign({}, item.sections[j]);
            var links = [];
            for(var k=0;k<(sec.links||[]).length;k++){
              var link = sec.links[k];
              if(!link.href){ links.push(link); continue; }
              var a = await window.RF_ACL.resolvePageAccess({ client:client, user:user, href:link.href, pageKey:link.key });
              if(a && a.allowed === false) continue;
              links.push(link);
            }
            if(links.length){ sec.links = links; sections.push(sec); }
          }
          if(sections.length){ item.sections = sections; out.push(item); }
        }
      }
      return out;
    }catch(_){
      return items;
    }
  }

  async function mount(){
    ensureContentWrapper();
    document.body.classList.add('kad-shell-mounted');
    var items = await filterAcl(filterHidden(MENU));
    if(!items.length) return;

    var root = document.createElement('div');
    root.id = 'kadNavShellRoot';
    root.innerHTML = '<div class="kad-shell-edge-sensor" aria-hidden="true"></div>'
      + '<aside class="kad-shell" aria-label="Navigare laterală">'
      + '<div class="kad-shell-peek-label">MENIU</div>'
      + '<div class="kad-shell-header"><div class="kad-shell-mini">K.A.D</div><div class="kad-shell-brand">K.A.D</div><div class="kad-shell-current">'+escapeHtml(findCurrentLabel(items))+'</div></div>'
      + '<div class="kad-shell-layout"><div class="kad-shell-navcol">'+items.map(buildItem).join('')+'</div><div class="kad-shell-subpanel"></div></div>'
      + '<div class="kad-shell-footer"><button class="kad-shell-logout" type="button">Logout</button><div class="kad-shell-note">hover la marginea stângă</div></div>'
      + '</aside>';
    document.body.appendChild(root);

    var closeTimer = null;
    function scheduleClose(){ clearTimeout(closeTimer); closeTimer = setTimeout(function(){ openState(root,false); closeSubmenu(root); }, 130); }
    function cancelClose(){ clearTimeout(closeTimer); }

    var sensor = root.querySelector('.kad-shell-edge-sensor');
    sensor.addEventListener('mouseenter', function(){ cancelClose(); openState(root,true); });
    root.querySelector('.kad-shell').addEventListener('mouseenter', function(){ cancelClose(); openState(root,true); });
    root.querySelector('.kad-shell').addEventListener('mouseleave', function(){ scheduleClose(); });
    root.addEventListener('mouseleave', function(){ scheduleClose(); });

    root.querySelectorAll('.kad-shell-item[data-has-submenu="1"]').forEach(function(node){
      var key = node.getAttribute('data-item-key');
      var item = items.find(function(it){ return it.key === key; });
      node.addEventListener('mouseenter', function(){ cancelClose(); openState(root,true); openSubmenu(root, item, node); });
      node.querySelector('.kad-shell-main').addEventListener('click', function(ev){ ev.preventDefault(); cancelClose(); openState(root,true); if(node.classList.contains('is-open')) closeSubmenu(root); else openSubmenu(root,item,node); });
    });

    root.querySelector('.kad-shell-logout').addEventListener('click', async function(){
      try{
        if(window.ERPAuth && typeof window.ERPAuth.signOut === 'function') await window.ERPAuth.signOut();
      }catch(_){ }
      window.location.href = 'login.html';
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true });
  else mount();
})();
