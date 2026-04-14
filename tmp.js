
    (function(){
      const form = document.getElementById('loginForm');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const togglePasswordBtn = document.getElementById('togglePassword');
      const themeSwatches = document.getElementById('themeSwatches');
      const themeName = document.getElementById('themeName');
      const loginBtn = document.getElementById('loginBtn');
      const statusBox = document.getElementById('statusBox');
      const metaInfo = document.getElementById('metaInfo');

      const cfg = {
        supabaseUrl:
          window.RF_CONFIG?.SUPABASE_URL ||
          window.RF_CONFIG?.supabaseUrl ||
          window.RF_SUPABASE_URL ||
          'https://addlybnigrywqowpbhvd.supabase.co',
        supabaseAnonKey:
          window.RF_CONFIG?.SUPABASE_ANON_KEY ||
          window.RF_CONFIG?.supabaseAnonKey ||
          window.RF_SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZGx5Ym5pZ3J5d3Fvd3BiaHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjY2NjQsImV4cCI6MjA4ODI0MjY2NH0.VjbSKs7G_5T7GhdrjT8dtj2HCF6Az9KYfkpkSE7JTo4'
      };

      let supabase = null;
      let loadingTimer = null;

      function setStatus(message, type){
        statusBox.textContent = message;
        statusBox.classList.remove('error', 'ok');
        if(type){ statusBox.classList.add(type); }
      }

      function setMeta(message){
        metaInfo.textContent = message || '';
      }

      function setLoading(isLoading, message){
        loginBtn.disabled = isLoading;
        emailInput.disabled = isLoading;
        passwordInput.disabled = isLoading;
        togglePasswordBtn.disabled = isLoading;
        if(isLoading){
          setStatus(message || 'Autentificare în curs...', '');
        }
      }

      function withTimeout(promise, ms, label){
        return Promise.race([
          promise,
          new Promise((_, reject) => {
            loadingTimer = setTimeout(() => {
              reject(new Error((label || 'Operația') + ' a depășit timpul de așteptare.'));
            }, ms);
          })
        ]).finally(() => {
          if(loadingTimer){
            clearTimeout(loadingTimer);
            loadingTimer = null;
          }
        });
      }

      function normalizeEmail(value){
        return String(value || '').trim().toLowerCase();
      }

      function safeSetLocal(key, value){
        try { localStorage.setItem(key, value); } catch(_) {}
      }

      function clearLogoutFlags(){
        try { localStorage.removeItem('rf_force_stay_on_login'); } catch(_) {}
        try { sessionStorage.removeItem('rf_force_stay_on_login'); } catch(_) {}
        try { localStorage.removeItem('rf_acl_denied_message'); } catch(_) {}
        try { sessionStorage.removeItem('rf_acl_denied_message'); } catch(_) {}
      }

      function getThemeKey(){
        return window.RF_THEME?.getThemeKey?.() || window.RF_THEME?.getPaletteKey?.() || 'blue';
      }

      function getThemeList(){
        return window.RF_THEME?.list?.() || [];
      }

      function renderThemeSwatches(){
        const themes = getThemeList();
        themeSwatches.innerHTML = '';

        themes.forEach(function(theme){
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'theme-swatch';
          btn.dataset.themeKey = theme.key;
          btn.setAttribute('aria-label', theme.label);
          btn.title = theme.label;
          btn.style.background = 'linear-gradient(135deg,' + theme.previewA + ', ' + theme.previewB + ')';
          btn.addEventListener('click', function(){
            if(window.RF_THEME?.setThemeKey){
              window.RF_THEME.setThemeKey(theme.key);
            } else if(window.RF_THEME?.setPalette){
              window.RF_THEME.setPalette(theme.key);
            }
            syncThemeUi();
          });
          themeSwatches.appendChild(btn);
        });
      }

      function syncThemeUi(){
        const current = getThemeKey();
        const themes = getThemeList();
        const currentTheme = themes.find(function(item){ return item.key === current; });

        Array.from(themeSwatches.querySelectorAll('.theme-swatch')).forEach(function(btn){
          const active = btn.dataset.themeKey === current;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        themeName.textContent = currentTheme ? ('Tema activă: ' + currentTheme.label) : '';
      }

      async function resolveRole(user){
        if(!user) return 'viewer';
        const email = String(user.email || '').trim().toLowerCase();
        try {
          const mirror = await readRoleMirror();
          const roles = mirror && mirror.roles && typeof mirror.roles === 'object' ? mirror.roles : null;
          const mirrored = roles && (roles[email] || roles[email.toLowerCase()]);
          if(mirrored) return String(mirrored).trim().toLowerCase();
        } catch(_) {}
        const attempts = [
          () => sb.from('profiles').select('role').eq('user_id', user.id).maybeSingle(),
          () => sb.from('profiles').select('role').eq('id', user.id).maybeSingle(),
          () => sb.from('profiles').select('role').eq('email', email).maybeSingle(),
          () => sb.from('rf_acl').select('role').eq('email', email).maybeSingle()
        ];
        for (const attempt of attempts) {
          try {
            const res = await attempt();
            const role = String(res && res.data && res.data.role || '').trim().toLowerCase();
            if (role) return role;
          } catch(_) {}
        }
        return 'viewer';
      }

      function buildRedirectUrl(){
        return './index.html';
      }

      function getFriendlyError(error){
        const msg = String(error?.message || error || '').trim();
        if(!msg) return 'Autentificarea a eșuat.';
        if(msg.includes('Invalid login credentials')) return 'ID sau parolă greșită.';
        if(msg.includes('Email not confirmed')) return 'Emailul nu este confirmat.';
        if(msg.includes('Failed to fetch')) return 'Nu se poate contacta serverul Supabase.';
        if(msg.includes('Cont blocat')) return msg;
        if(msg.includes('depășit timpul')) return 'Serverul nu a răspuns la timp. Verifică conexiunea și încearcă din nou.';
        return msg;
      }

      function initClient(){
        if(!window.supabase || typeof window.supabase.createClient !== 'function'){
          throw new Error('Biblioteca Supabase nu s-a încărcat.');
        }

        if(!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey){
          throw new Error('Lipsește configurația Supabase. Verifică fișierul rf-config.js.');
        }

        return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      }

      togglePasswordBtn.addEventListener('click', function(){
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = isPassword ? 'Ascunde' : 'Arată';
      });

      clearLogoutFlags();
      try {
        const blockedMsg = sessionStorage.getItem('rf_login_error') || '';
        if (blockedMsg) {
          setStatus(blockedMsg, 'error');
          sessionStorage.removeItem('rf_login_error');
        }
      } catch (_) {}

      renderThemeSwatches();
      window.addEventListener('rf-theme-change', syncThemeUi);
      syncThemeUi();

      form.addEventListener('submit', async function(event){
        event.preventDefault();

        const email = normalizeEmail(emailInput.value);
        const password = String(passwordInput.value || '');

        if(!email || !password){
          setStatus('Completează ID și parolă.', 'error');
          return;
        }

        try {
          setLoading(true, 'Autentificare în curs...');
          setMeta('Se verifică sesiunea și rolul utilizatorului...');

          supabase = supabase || initClient();

          const authResult = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            15000,
            'Autentificarea'
          );

          if(authResult.error){
            throw authResult.error;
          }

          const user = authResult.data?.user;
          if(!user){
            throw new Error('Autentificare nereușită: utilizatorul nu a fost returnat de server.');
          }

          const resolved = await withTimeout(resolveRole(user), 12000, 'Citirea rolului');
          if (window.ERPAuth && typeof window.ERPAuth.getAccountStatus === 'function') {
            const status = await withTimeout(window.ERPAuth.getAccountStatus(user), 12000, 'Verificarea contului');
            if (status && (status.is_banned || status.is_active === false)) {
              try { await supabase.auth.signOut(); } catch (_) {}
              throw new Error(status.note || 'Cont blocat.');
            }
          }

          safeSetLocal('rf_uid', user.id || '');
          safeSetLocal('rf_email', resolved.email || email);
          safeSetLocal('rf_role', resolved.role || 'viewer');
          safeSetLocal('rf_login_ts', String(Date.now()));

          clearLogoutFlags();

          setStatus('Autentificare reușită. Redirecționare...', 'ok');
          setMeta('Rol detectat: ' + (resolved.role || 'viewer'));

          window.location.href = buildRedirectUrl();
        } catch (error) {
          console.error('Login error:', error);
          setStatus(getFriendlyError(error), 'error');
          setMeta('Dacă eroarea persistă, verifică rf-config.js, conexiunea la Supabase și consola browserului.');
        } finally {
          setLoading(false);
        }
      });

      try {
        supabase = initClient();
        setMeta('Conexiune pregătită.');
      } catch (error) {
        console.error('Supabase init error:', error);
        setStatus(getFriendlyError(error), 'error');
        setMeta('Fișierul rf-config.js trebuie să fie în același folder cu login.html.');
      }
    })();
  