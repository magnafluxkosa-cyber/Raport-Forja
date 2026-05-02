(function(window, document){
  'use strict';

  var PROJECT_KEY = 'kad';
  var DEFAULT_FUNCTION_NAME = 'rf-protected-page-core';
  var FUNCTION_BY_PAGE = {"forjate":"rf-protected-page-core","helper-acl":"rf-protected-page-core","helper-data":"rf-protected-page-core","index":"rf-protected-page-core","numeralkod":"rf-protected-page-core","planificare-forja":"rf-protected-page-core","pontaj-forja":"rf-protected-page-core","inventar-prelucrari":"rf-protected-page-2","ambalare-106-1625-26":"rf-protected-page-3","ambalare-248-2307-08":"rf-protected-page-3","ambalare-378-8241-42":"rf-protected-page-3","ambalare-9k-6628-29":"rf-protected-page-3","plan-livrari":"rf-protected-page-3","stoc-initial-otel":"rf-protected-page-3","ambalare-229-6909-10":"rf-protected-page-4","ambalare-417-3595-96":"rf-protected-page-4","ambalare-418-2091-92":"rf-protected-page-4","ambalare-503-0761-62":"rf-protected-page-4","debitate":"rf-protected-page-4","imbunatatire-continua":"rf-protected-page-4","intrari-otel":"rf-protected-page-4","inventar-debitat":"rf-protected-page-4","inventar-forjat":"rf-protected-page-4","investitii":"rf-protected-page-4","kad_system_presentation":"rf-protected-page-4","livrari-zale":"rf-protected-page-4","magnaflux":"rf-protected-page-4","planificare-prelucrari":"rf-protected-page-4","pontaj-ctc":"rf-protected-page-4","pontaj-prelucrari-mecanice":"rf-protected-page-4","pontaj-sef-echipa":"rf-protected-page-4","probleme-raportate":"rf-protected-page-4","rebut-pm":"rf-protected-page-4","stoc-ramas-teoretic":"rf-protected-page-4","tratament-termic-rapoarte":"rf-protected-page-4","urmarire-actiuni-progres":"rf-protected-page-4","utilaje-matrite":"rf-protected-page-4","zale-106-1625-26":"rf-protected-page-4","zale-229-6909-10":"rf-protected-page-4","zale-248-2307-08":"rf-protected-page-4","zale-378-8241-42":"rf-protected-page-4","zale-417-3595-96":"rf-protected-page-4","zale-418-2091-92":"rf-protected-page-4","zale-503-0761-62":"rf-protected-page-4","zale-9k-6628-29":"rf-protected-page-4","calendar-operatori":"rf-protected-page-5","centralizator-livrari-zale":"rf-protected-page-5","comenzi-livrare":"rf-protected-page-5","eficienta":"rf-protected-page-5","inventar-otel":"rf-protected-page-5","kpi":"rf-protected-page-5","lista-vanzari":"rf-protected-page-5","magnaflux-calendar":"rf-protected-page-5","mrc-comenzi-otel":"rf-protected-page-5","mrc-comenzi-saptamanale":"rf-protected-page-5","mrc-necesar-otel":"rf-protected-page-5","program-utilaje":"rf-protected-page-5","progres-matrite":"rf-protected-page-5","raport-forja":"rf-protected-page-5","raport-forja-operatori-ore":"rf-protected-page-5","rebut":"rf-protected-page-5","rebut-pm-helper":"rf-protected-page-5","repere-matrite":"rf-protected-page-5","stoc-general-real":"rf-protected-page-5","stoc-matrite":"rf-protected-page-5","tratament-termic-documente":"rf-protected-page-5","tratament-termic-fise-tehnologice":"rf-protected-page-5","tratament-termic-probleme":"rf-protected-page-5","urmarire-matrite":"rf-protected-page-5"};
  function getFunctionForPage(page){ return FUNCTION_BY_PAGE[page] || DEFAULT_FUNCTION_NAME; }
  var PROTECTED_PAGES = ["ambalare-106-1625-26", "ambalare-229-6909-10", "ambalare-248-2307-08", "ambalare-378-8241-42", "ambalare-417-3595-96", "ambalare-418-2091-92", "ambalare-503-0761-62", "ambalare-9k-6628-29", "calendar-operatori", "centralizator-livrari-zale", "comenzi-livrare", "debitate", "eficienta", "forjate", "helper-acl", "helper-data", "imbunatatire-continua", "index", "intrari-otel", "inventar-debitat", "inventar-forjat", "inventar-otel", "inventar-prelucrari", "investitii", "kad_system_presentation", "kpi", "lista-vanzari", "livrari-zale", "magnaflux-calendar", "magnaflux", "mrc-comenzi-otel", "mrc-comenzi-saptamanale", "mrc-necesar-otel", "numeralkod", "plan-livrari", "planificare-forja", "planificare-prelucrari", "pontaj-ctc", "pontaj-forja", "pontaj-prelucrari-mecanice", "pontaj-sef-echipa", "probleme-raportate", "program-utilaje", "progres-matrite", "raport-forja-operatori-ore", "raport-forja", "rebut-pm-helper", "rebut-pm", "rebut", "repere-matrite", "stoc-general-real", "stoc-initial-otel", "stoc-matrite", "stoc-ramas-teoretic", "tratament-termic-documente", "tratament-termic-fise-tehnologice", "tratament-termic-probleme", "tratament-termic-rapoarte", "urmarire-actiuni-progres", "urmarire-matrite", "utilaje-matrite", "zale-106-1625-26", "zale-229-6909-10", "zale-248-2307-08", "zale-378-8241-42", "zale-417-3595-96", "zale-418-2091-92", "zale-503-0761-62", "zale-9k-6628-29"];
  var MFA_PAGES = { 'helper-acl': true, 'helper-data': true };
  var MFA_TTL_MS = 2 * 60 * 1000;
  var TARGET_STORAGE_KEY = 'rf_protected_target_page';

  var statusBox = document.getElementById('status');
  var actionBtn = document.getElementById('actionBtn');

  function setStatus(message, error){
    if(statusBox){
      statusBox.textContent = message;
      statusBox.classList.toggle('err', !!error);
    }
  }
  function showAction(href, text){
    if(!actionBtn) return;
    actionBtn.href = href;
    actionBtn.textContent = text || 'Continuă';
    actionBtn.style.display = 'inline-flex';
  }
  function normalizePage(value){
    var v = String(value || '').trim().toLowerCase();
    v = v.split('?')[0].split('#')[0].replace(/^\.\//,'').replace(/\.html$/,'');
    if(!v) return 'index';
    if(!/^[a-z0-9\-_]+$/.test(v)) return 'index';
    return PROTECTED_PAGES.indexOf(v) >= 0 ? v : 'index';
  }
  function getTargetPage(){
    var params = new URLSearchParams(window.location.search || '');
    var page = normalizePage(params.get('page') || '');
    if(page && page !== 'index') return page;
    try{
      var stored = sessionStorage.getItem(TARGET_STORAGE_KEY);
      if(stored){
        sessionStorage.removeItem(TARGET_STORAGE_KEY);
        return normalizePage(stored);
      }
    }catch(_){}
    return normalizePage(params.get('page') || 'index');
  }
  function rememberTarget(page){
    try{ sessionStorage.setItem(TARGET_STORAGE_KEY, normalizePage(page)); }catch(_){}
  }
  function getConfig(){
    var cfg = window.ERP_FORJA_CONFIG || window.__ERP_FORJA_CONFIG__ || window.RF_CONFIG || {};
    return {
      url: String(cfg.SUPABASE_URL || cfg.supabaseUrl || '').replace(/\/$/, ''),
      key: String(cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || '')
    };
  }
  function redirect(url){
    try{ window.location.replace(url); }catch(_){ window.location.href = url; }
  }
  function hasProjectGate(){
    try{
      if(window.RFProjectGate && typeof window.RFProjectGate.hasAccess === 'function'){
        return window.RFProjectGate.hasAccess(PROJECT_KEY);
      }
      var raw = sessionStorage.getItem('rf_project_gate_access_session') || localStorage.getItem('rf_project_gate_access');
      if(!raw) return false;
      var data = JSON.parse(raw);
      return data && String(data.projectKey || '').toLowerCase() === PROJECT_KEY && Number(data.expiresAt || 0) > Date.now();
    }catch(_){ return false; }
  }
  function createClient(){
    var cfg = getConfig();
    if(!cfg.url || !cfg.key) throw new Error('Lipsește configurația Supabase.');
    if(!window.supabase || typeof window.supabase.createClient !== 'function') throw new Error('Biblioteca Supabase nu s-a încărcat.');
    return window.supabase.createClient(cfg.url, cfg.key, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  }
  function mfaMarkerOk(page){
    if(!MFA_PAGES[page]) return true;
    try{
      var ts = Number(sessionStorage.getItem('rf_mfa_gate_' + page) || 0);
      if(!ts && page === 'helper-acl') ts = Number(sessionStorage.getItem('rf_helper_acl_mfa_entry_ok') || 0);
      if(!ts && page === 'helper-data') ts = Number(sessionStorage.getItem('rf_helper_data_mfa_entry_ok') || 0);
      return ts > 0 && (Date.now() - ts) < MFA_TTL_MS;
    }catch(_){ return false; }
  }
  function requireMfa(page){
    rememberTarget(page);
    redirect('mfa-verify.html?force=1&scope=' + encodeURIComponent(page) + '&next=app.html');
  }
  function denied(message){
    setStatus(message || 'Acces refuzat.', true);
    showAction('access-gate.html?project=kad&next=login.html', 'Înapoi la acces');
  }
  function executeProtectedHtml(page, html){
    if(!html){ denied('Pagina protejată este goală.'); return; }
    try{ history.replaceState({ protectedPage: page }, '', page + '.html'); }catch(_){}
    document.open();
    document.write(html);
    document.close();
  }

  async function run(){
    var page = getTargetPage();
    setStatus('Se verifică accesul pentru: ' + page + '...');

    if(!hasProjectGate()){
      rememberTarget(page);
      redirect('access-gate.html?project=kad&next=' + encodeURIComponent('login.html?next=app.html'));
      return;
    }

    var sb = createClient();
    var sessionRes = await sb.auth.getSession();
    var session = sessionRes && sessionRes.data && sessionRes.data.session;
    if(!session || !session.access_token){
      rememberTarget(page);
      redirect('login.html?next=app.html');
      return;
    }

    if(MFA_PAGES[page] && !mfaMarkerOk(page)){
      requireMfa(page);
      return;
    }

    // După confirmarea MFA, forțăm refresh la sesiune ca tokenul trimis către Edge Function
    // să conțină nivelul aal2. Fără asta, Supabase poate păstra temporar tokenul aal1
    // și funcția blochează corect pagina sensibilă chiar dacă utilizatorul a introdus codul.
    if(MFA_PAGES[page]){
      try{
        await sb.auth.refreshSession();
        var freshRes = await sb.auth.getSession();
        if(freshRes && freshRes.data && freshRes.data.session) session = freshRes.data.session;
      }catch(refreshError){
        console.warn('MFA session refresh failed:', refreshError);
      }
    }

    var cfg = getConfig();
    var response = await fetch(cfg.url + '/functions/v1/' + getFunctionForPage(page), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.key,
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({ page: page })
    });
    var payload = null;
    try{ payload = await response.json(); }catch(_){ payload = null; }

    if(!response.ok || !payload || payload.ok !== true){
      var code = payload && payload.code ? String(payload.code) : '';
      if(code === 'MFA_REQUIRED'){ requireMfa(page); return; }
      if(code === 'AUTH_REQUIRED'){ rememberTarget(page); redirect('login.html?next=app.html'); return; }
      if(code === 'PIN_REQUIRED'){ rememberTarget(page); redirect('access-gate.html?project=kad&next=' + encodeURIComponent('login.html?next=app.html')); return; }
      denied((payload && payload.message) || 'Nu ai acces la această pagină.');
      return;
    }

    setStatus('Acces permis. Se încarcă pagina...');
    executeProtectedHtml(page, payload.html);
  }

  run().catch(function(error){
    console.error('rf-protected-loader error:', error);
    denied(error && error.message ? error.message : 'Eroare la încărcarea paginii protejate.');
  });
})(window, document);
