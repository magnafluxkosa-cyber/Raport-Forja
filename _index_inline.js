
    (() => {
      const qs = (s) => document.querySelector(s);
      const qsa = (s) => Array.from(document.querySelectorAll(s));

      const chipAuth = qs('#chipAuth');
      const chipUser = qs('#chipUser');
      const chipRole = qs('#chipRole');
      const btnRefresh = qs('#btnRefresh');
      const btnLogout = qs('#btnLogout');
      const btnLogin = qs('#btnLogin');
      const defaultHint = qs('#defaultHint');
      const itemHelperData = qs('#itemHelperData');
      const itemAcl = qs('#itemAcl');
      const helperDataLink = qs('#helperDataLink');
      const helperAclLink = qs('#helperAclLink');
      const aclTooltip = qs('#aclTooltip');
      const aclDeniedBanner = qs('#aclDeniedBanner');

      const btnPalette = qs('#btnPalette');
      const palettePanel = qs('#palettePanel');
      const paletteGrid = qs('#paletteGrid');
      const PALETTE_STORAGE_KEY = 'rf_index_palette_v1';
      const PALETTES = [
        {
          key:'classic-blue', name:'Albastru clasic',
          vars:{'--bg1':'#081526','--bg2':'#123456','--bg3':'#4fa2ff','--line':'rgba(255,255,255,.32)','--line-strong':'rgba(255,255,255,.48)','--text':'#eef7ff','--muted':'#c4d9ef','--danger':'#ff7c8c','--danger-hover':'#ff96a3'},
          swatches:['#081526','#123456','#4fa2ff','#eef7ff']
        },
        {
          key:'soft-dark', name:'Soft dark',
          vars:{'--bg1':'#111827','--bg2':'#25314a','--bg3':'#7ba8ff','--line':'rgba(255,255,255,.26)','--line-strong':'rgba(255,255,255,.40)','--text':'#f2f6ff','--muted':'#ced6ea','--danger':'#ff8fa1','--danger-hover':'#ffb0bb'},
          swatches:['#111827','#25314a','#7ba8ff','#f2f6ff']
        },
        {
          key:'grafit', name:'Grafit',
          vars:{'--bg1':'#121417','--bg2':'#2d3748','--bg3':'#8aa3be','--line':'rgba(255,255,255,.24)','--line-strong':'rgba(255,255,255,.38)','--text':'#f4f7fb','--muted':'#d2dae3','--danger':'#ff8b8b','--danger-hover':'#ffaaaa'},
          swatches:['#121417','#2d3748','#8aa3be','#f4f7fb']
        },
        {
          key:'foc-si-scantei', name:'Foc și scântei',
          vars:{'--bg1':'#2a0c05','--bg2':'#63210f','--bg3':'#ff9b2f','--line':'rgba(255,228,201,.28)','--line-strong':'rgba(255,228,201,.44)','--text':'#fff3e8','--muted':'#ffd7bd','--danger':'#ff6b57','--danger-hover':'#ff8a79'},
          swatches:['#2a0c05','#63210f','#ff9b2f','#fff3e8']
        },
        {
          key:'otel', name:'Oțel',
          vars:{'--bg1':'#12202c','--bg2':'#42596d','--bg3':'#9ab5c9','--line':'rgba(255,255,255,.26)','--line-strong':'rgba(255,255,255,.40)','--text':'#f3f7fb','--muted':'#d3dce5','--danger':'#f07d7d','--danger-hover':'#f39a9a'},
          swatches:['#12202c','#42596d','#9ab5c9','#f3f7fb']
        },
        {
          key:'smarald', name:'Smarald',
          vars:{'--bg1':'#071d19','--bg2':'#0f4f46','--bg3':'#5ad7be','--line':'rgba(223,255,247,.26)','--line-strong':'rgba(223,255,247,.42)','--text':'#effffb','--muted':'#c5ece4','--danger':'#ff8aa3','--danger-hover':'#ffafbf'},
          swatches:['#071d19','#0f4f46','#5ad7be','#effffb']
        },
        {
          key:'mov-nocturn', name:'Mov nocturn',
          vars:{'--bg1':'#140c25','--bg2':'#35215c','--bg3':'#9a7cff','--line':'rgba(245,240,255,.26)','--line-strong':'rgba(245,240,255,.40)','--text':'#f5f0ff','--muted':'#d8d0ef','--danger':'#ff8eb1','--danger-hover':'#ffb3c9'},
          swatches:['#140c25','#35215c','#9a7cff','#f5f0ff']
        },
        {
          key:'gri-deschis', name:'Gri deschis',
          vars:{'--bg1':'#4b5c70','--bg2':'#7d90a6','--bg3':'#c8d7e8','--line':'rgba(255,255,255,.34)','--line-strong':'rgba(255,255,255,.50)','--text':'#f7fbff','--muted':'#e4edf6','--danger':'#ff8a96','--danger-hover':'#ffadb5'},
          swatches:['#4b5c70','#7d90a6','#c8d7e8','#f7fbff']
        }
      ];

      function getPalette(key){
        return PALETTES.find(item => item.key === key) || PALETTES[0];
      }

      function applyPalette(key){
        const palette = getPalette(key);
        Object.entries(palette.vars).forEach(([name, value]) => {
          document.documentElement.style.setProperty(name, value);
        });
        try { localStorage.setItem(PALETTE_STORAGE_KEY, palette.key); } catch (_) {}
        renderPaletteButtons(palette.key);
      }

      function renderPaletteButtons(activeKey){
        if (!paletteGrid) return;
        paletteGrid.innerHTML = PALETTES.map(item => {
          const swatches = item.swatches.map(color => `<i style="background:${color}"></i>`).join('');
          return `<button type="button" class="paletteBtn${item.key === activeKey ? ' active' : ''}" data-palette-key="${item.key}"><span class="paletteName">${item.name}</span><span class="paletteSwatches">${swatches}</span></button>`;
        }).join('');
        paletteGrid.querySelectorAll('[data-palette-key]').forEach(btn => {
          btn.addEventListener('click', () => applyPalette(btn.getAttribute('data-palette-key')));
        });
      }

      function initPalette(){
        const stored = (() => { try { return localStorage.getItem(PALETTE_STORAGE_KEY) || ''; } catch (_) { return ''; } })();
        applyPalette(stored || 'classic-blue');
      }


      const GROUP_MAP = {
        subForja: [
          'numeralkod','intrari-otel','debitate','forjate','program-utilaje',
          'zale-9k-6628-29','zale-229-6909-10','zale-503-0761-62','zale-106-1625-26',
          'zale-378-8241-42','zale-248-2307-08','zale-417-3595-96','zale-418-2091-92',
          'ambalare-9k-6628-29','ambalare-229-6909-10','ambalare-503-0761-62','ambalare-106-1625-26',
          'ambalare-378-8241-42','ambalare-248-2307-08','ambalare-417-3595-96','ambalare-418-2091-92',
          'inventar-otel','inventar-debitat','inventar-forjat'
        ],
        subPrelucrari: [],
        subTratamentTermic: [],
        subCalitate: ['magnaflux','rebut'],
        subProblemeImbunatatire: ['probleme-raportate','urmarire-actiuni-progres','imbunatatire-continua','investitii'],
        subPlanificari: ['planificare-forja','comenzi-livrare','mrc-necesar-otel','mrc-comenzi-otel','mrc-comenzi-saptamanale']
      };

      function getConfig(){
        const cfg = window.RF_CONFIG || {};
        const url = cfg.SUPABASE_URL || window.SUPABASE_URL || '';
        const key = cfg.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || '';
        return { url, key };
      }

      const cfg = getConfig();
      const sb = (cfg.url && cfg.key && window.supabase)
        ? ((window.createRfSupabaseClient && typeof window.createRfSupabaseClient === 'function')
            ? window.createRfSupabaseClient()
            : window.supabase.createClient(cfg.url, cfg.key, {
                auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
              }))
        : null;

      let currentUser = null;
      let currentRole = 'viewer';
      let currentPermissions = null;
      let currentUserPermissions = null;
      let currentRolePermissions = null;
      let currentDashAcl = null;
      let currentIndexButtonVisibilityDoc = null;
      let currentPanel = null;
      const currentInnerPanels = { subForja:null };

      const ADMIN_ONLY_KEYS = new Set(['helper-data','helper-acl']);
      const ADMIN_ONLY_HREFS = new Set(['helper-data.html','helper-acl.html']);
      const ID_STORAGE_KEYS = ['rf_display_id','rf_login_id','rf_user_id','rf_user_email','rf_email'];
      const ROLE_STORAGE_KEYS = ['rf_login_role','rf_role','rf_user_role','rf_cached_role'];

      function readStoredValue(keys){
        const stores = [window.sessionStorage, window.localStorage];
        for (const store of stores) {
          for (const key of keys) {
            try {
              const value = store.getItem(key);
              if (value) return String(value);
            } catch (_) {}
          }
        }
        return '';
      }

      function safeIdFromEmail(email){
        if (!email) return '—';
        const raw = String(email).trim();
        const at = raw.indexOf('@');
        return at > 0 ? raw.slice(0, at).toUpperCase() : raw.toUpperCase();
      }

      function normalizeRoleName(role){
        const raw = String(role || '').trim().toLowerCase();
        if (!raw) return '';
        if (['admin','editor','operator','viewer'].includes(raw)) return raw;
        return raw;
      }

      function getStoredDisplayId(){
        const raw = readStoredValue(ID_STORAGE_KEYS);
        if (!raw) return '';
        return raw.includes('@') ? safeIdFromEmail(raw) : raw;
      }

      function getStoredRole(){
        return normalizeRoleName(readStoredValue(ROLE_STORAGE_KEYS));
      }

      function parseSupabaseUserFromStorage(){
        const stores = [window.localStorage, window.sessionStorage];
        for (const store of stores) {
          try {
            for (let i = 0; i < store.length; i += 1) {
              const key = store.key(i);
              if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
              const raw = store.getItem(key);
              if (!raw) continue;
              const parsed = JSON.parse(raw);
              const user = parsed?.user || parsed?.currentSession?.user || parsed?.session?.user || null;
              if (user?.id || user?.email) return user;
            }
          } catch (_) {}
        }
        return null;
      }

      function setStatusChips(isAuthenticated, userForDisplay, roleForDisplay){
        if (isAuthenticated) {
          chipAuth.textContent = 'Autentificat';
          chipAuth.className = 'chip ok';
          chipUser.textContent = `ID: ${getStoredDisplayId() || safeIdFromEmail(userForDisplay?.email)}`;
          chipRole.textContent = `Cont: ${normalizeRoleName(roleForDisplay) || '—'}`;
        } else {
          chipAuth.textContent = 'Neautentificat';
          chipAuth.className = 'chip warn';
          chipUser.textContent = 'ID: —';
          chipRole.textContent = 'Cont: —';
        }
      }


      async function readRoleMirror(){
        try {
          const a = await sb.from('rf_documents').select('content,updated_at').eq('doc_key', 'acl_roles_v1').maybeSingle();
          if (!a.error && a.data?.content && typeof a.data.content === 'object') return a.data.content;
        } catch (_) {}
        try {
          const b = await sb.from('rf_documents').select('data,updated_at').eq('doc_key', 'acl_roles_v1').maybeSingle();
          if (!b.error && b.data?.data && typeof b.data.data === 'object') return b.data.data;
        } catch (_) {}
        return null;
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

      async function loadUserPermissionMap(user){
        if (!sb || !user || !(window.RF_ACL && typeof window.RF_ACL.loadUserPermissionMap === 'function')) return null;
        try {
          const userMap = await window.RF_ACL.loadUserPermissionMap(sb, user);
          return userMap && userMap.size ? userMap : null;
        } catch(_){
          return null;
        }
      }

      async function loadRolePermissionMap(role){
        if (!sb) return null;
        try {
          const res = await sb.from('page_permissions').select('page_key,can_view,can_add,can_edit,can_delete,can_export,can_import').eq('role', role);
          if (res.error || !Array.isArray(res.data)) return null;
          const map = new Map();
          res.data.forEach(r => map.set(String(r.page_key), {
            can_view: r.can_view === true,
            can_add: r.can_add === true,
            can_edit: r.can_edit === true,
            can_delete: r.can_delete === true,
            can_export: r.can_export === true,
            can_import: r.can_import === true
          }));
          return map;
        } catch(_){
          return null;
        }
      }

      async function loadDashboardAcl(){
        if (!sb) return null;

        if (window.RF_ACL && typeof window.RF_ACL.readDashboardAclMirror === 'function') {
          currentDashAcl = await window.RF_ACL.readDashboardAclMirror(sb);
          return currentDashAcl;
        }

        try {
          const a = await sb.from('rf_documents').select('content,updated_at').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
          if (!a.error && a.data?.content && typeof a.data.content === 'object') {
            currentDashAcl = a.data.content;
            return currentDashAcl;
          }
        } catch(_){ }

        try {
          const b = await sb.from('rf_documents').select('data,updated_at').eq('doc_key', 'dashboard_acl_v1').maybeSingle();
          if (!b.error && b.data?.data && typeof b.data.data === 'object') {
            currentDashAcl = b.data.data;
            return currentDashAcl;
          }
        } catch(_){ }

        currentDashAcl = null;
        return null;
      }

      async function loadIndexButtonVisibilityDoc(){
        if (!sb) {
          currentIndexButtonVisibilityDoc = null;
          return null;
        }
        try {
          const a = await sb.from('rf_documents').select('content,updated_at').eq('doc_key', 'index_button_visibility_v1').maybeSingle();
          if (!a.error && a.data?.content && typeof a.data.content === 'object') {
            currentIndexButtonVisibilityDoc = a.data.content;
            return currentIndexButtonVisibilityDoc;
          }
        } catch(_){ }
        try {
          const b = await sb.from('rf_documents').select('data,updated_at').eq('doc_key', 'index_button_visibility_v1').maybeSingle();
          if (!b.error && b.data?.data && typeof b.data.data === 'object') {
            currentIndexButtonVisibilityDoc = b.data.data;
            return currentIndexButtonVisibilityDoc;
          }
        } catch(_){ }
        currentIndexButtonVisibilityDoc = null;
        return null;
      }

      function getHiddenIndexButtonKeys(){
        const email = currentUserEmail();
        if (!email) return new Set();
        const doc = currentIndexButtonVisibilityDoc && typeof currentIndexButtonVisibilityDoc === 'object' ? currentIndexButtonVisibilityDoc : null;
        const users = doc && doc.users && typeof doc.users === 'object' ? doc.users : null;
        const entry = users && users[email] && typeof users[email] === 'object' ? users[email] : null;
        const hidden = entry && Array.isArray(entry.hidden) ? entry.hidden : [];
        return new Set(hidden.map(v => String(v || '').trim()).filter(Boolean));
      }

      function normalizeHref(href){
        if (window.RF_ACL && typeof window.RF_ACL.normalizeHref === 'function') {
          return window.RF_ACL.normalizeHref(href);
        }
        return String(href || '').split('#')[0].split('?')[0];
      }

      function currentUserEmail(){
        return String(currentUser?.email || '').trim().toLowerCase();
      }

      function hasAnyExplicitUserAcl(){
        if (currentUserPermissions instanceof Map && currentUserPermissions.size > 0) return true;
        const mirror = getMirrorRoleData();
        return !!((mirror.userPermissions && Object.keys(mirror.userPermissions).length) || (mirror.userGrants && Object.keys(mirror.userGrants).length));
      }

      function permissionEntryCanView(value){
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'can_view')) {
          return value.can_view === true;
        }
        return value === true;
      }

      function getMirrorRoleData(){
        const doc = currentDashAcl && typeof currentDashAcl === 'object' ? currentDashAcl : null;
        const grants = doc && doc.grants && typeof doc.grants === 'object' ? doc.grants : null;
        const pagePermissions = doc && doc.page_permissions && typeof doc.page_permissions === 'object' ? doc.page_permissions : null;
        const userGrantsRoot = doc && doc.user_grants && typeof doc.user_grants === 'object' ? doc.user_grants : null;
        const userPermissionsRoot = doc && doc.user_permissions && typeof doc.user_permissions === 'object' ? doc.user_permissions : null;
        const email = currentUserEmail();
        return {
          grants: grants && grants[currentRole] && typeof grants[currentRole] === 'object' ? grants[currentRole] : null,
          pagePermissions: pagePermissions && pagePermissions[currentRole] && typeof pagePermissions[currentRole] === 'object' ? pagePermissions[currentRole] : null,
          userGrants: userGrantsRoot && email && userGrantsRoot[email] && typeof userGrantsRoot[email] === 'object' ? userGrantsRoot[email] : null,
          userPermissions: userPermissionsRoot && email && userPermissionsRoot[email] && typeof userPermissionsRoot[email] === 'object' ? userPermissionsRoot[email] : null
        };
      }

      function getUserExplicitAclDecision(pageKey, href){
        const decisions = [];
        const normalizedHref = normalizeHref(href);

        if (currentUserPermissions instanceof Map && currentUserPermissions.has(pageKey)) {
          decisions.push(permissionEntryCanView(currentUserPermissions.get(pageKey)));
        }

        const mirror = getMirrorRoleData();
        if (mirror.userPermissions && Object.prototype.hasOwnProperty.call(mirror.userPermissions, pageKey)) {
          decisions.push(permissionEntryCanView(mirror.userPermissions[pageKey]));
        }
        if (mirror.userGrants) {
          if (Object.prototype.hasOwnProperty.call(mirror.userGrants, pageKey)) {
            decisions.push(permissionEntryCanView(mirror.userGrants[pageKey]));
          }
          if (normalizedHref && Object.prototype.hasOwnProperty.call(mirror.userGrants, normalizedHref)) {
            decisions.push(permissionEntryCanView(mirror.userGrants[normalizedHref]));
          }
        }

        if (decisions.includes(false)) return false;
        if (decisions.includes(true)) return true;
        return null;
      }

      function getExplicitAclDecision(pageKey, href){
        const decisions = [];
        const normalizedHref = normalizeHref(href);

        if (currentRolePermissions instanceof Map && currentRolePermissions.has(pageKey)) {
          decisions.push(permissionEntryCanView(currentRolePermissions.get(pageKey)));
        }

        const mirror = getMirrorRoleData();
        if (mirror.pagePermissions && Object.prototype.hasOwnProperty.call(mirror.pagePermissions, pageKey)) {
          decisions.push(permissionEntryCanView(mirror.pagePermissions[pageKey]));
        }

        if (mirror.grants) {
          if (Object.prototype.hasOwnProperty.call(mirror.grants, pageKey)) {
            decisions.push(permissionEntryCanView(mirror.grants[pageKey]));
          }
          if (normalizedHref && Object.prototype.hasOwnProperty.call(mirror.grants, normalizedHref)) {
            decisions.push(permissionEntryCanView(mirror.grants[normalizedHref]));
          }
        }

        if (decisions.includes(false)) return false;
        if (decisions.includes(true)) return true;
        return null;
      }

      async function controlAllowed(controlKey){
        if (currentRole === 'admin') return true;
        if (!currentUser) return controlKey === 'nav.login';
        try {
          if (window.RF_ACL && typeof window.RF_ACL.resolveControlAccess === 'function') {
            const res = await window.RF_ACL.resolveControlAccess('index', controlKey, { client: sb, user: currentUser, role: currentRole });
            return !!(res && res.can_view === true);
          }
        } catch (_) {}
        return true;
      }

      function hasStrictUserAcl(){
        return currentUserPermissions instanceof Map && currentUserPermissions.size > 0;
      }

      function elementAllowed(el, pageKey){
        if (!currentUser) return false;
        const link = el?.matches?.('a[href]') ? el : el?.querySelector?.('a[href]');
        const href = link ? link.getAttribute('href') : '';
        const normalizedHref = normalizeHref(href);

        if (ADMIN_ONLY_KEYS.has(pageKey) || ADMIN_ONLY_HREFS.has(normalizedHref)) {
          return currentRole === 'admin';
        }

        if (currentRole === 'admin') {
          return true;
        }

        if (hasStrictUserAcl()) {
          const userExplicit = getUserExplicitAclDecision(pageKey, href);
          return userExplicit === true;
        }

        const userExplicit = getUserExplicitAclDecision(pageKey, href);
        if (userExplicit !== null) {
          return userExplicit === true;
        }

        const explicit = getExplicitAclDecision(pageKey, href);
        if (explicit === false) return false;
        if (explicit === true) return true;
        return true;
      }

      function getDeniedMessage(pageKey, href){
        const normalizedHref = normalizeHref(href);
        if (ADMIN_ONLY_KEYS.has(pageKey) || ADMIN_ONLY_HREFS.has(normalizedHref)) {
          return 'În această foaie are acces doar adminul.';
        }
        if (String(pageKey || '').startsWith('group-')) {
          return 'În această secțiune nu ai acces. Cere acces de la admin.';
        }
        return 'Nu ai acces în această foaie. Cere acces de la admin.';
      }

      function setVisible(el, on){
        if (!el) return;
        el.classList.toggle('hidden', !on);
      }

      function setDisabled(el, on){
        if (!el) return;
        el.classList.toggle('disabled', !!on);
        if (el instanceof HTMLElement) {
          el.setAttribute('aria-disabled', on ? 'true' : 'false');
        }
      }

      function setDeniedHint(el, message){
        if (!el) return;
        const targets = [el].concat(Array.from(el.querySelectorAll('a, .menuBtn, .directLink, .subbtn, .miniLink')));
        const uniqueTargets = [];
        const seen = new Set();
        targets.forEach(node => {
          if (!node || !(node instanceof HTMLElement)) return;
          if (seen.has(node)) return;
          seen.add(node);
          uniqueTargets.push(node);
        });

        uniqueTargets.forEach(node => {
          node.removeAttribute('title');
          if (message) {
            node.dataset.deniedMessage = message;
            node.setAttribute('aria-label', message);
          } else {
            delete node.dataset.deniedMessage;
            node.removeAttribute('aria-label');
          }
        });
      }

      function applyAccessState(el, allowed, message){
        setDisabled(el, !allowed);
        setDeniedHint(el, allowed ? '' : message);
      }

      function positionTooltip(x, y){
        if (!aclTooltip) return;
        const pad = 14;
        const rect = aclTooltip.getBoundingClientRect();
        let left = x + 16;
        let top = y + 16;

        if (left + rect.width > window.innerWidth - pad) {
          left = Math.max(pad, x - rect.width - 16);
        }
        if (top + rect.height > window.innerHeight - pad) {
          top = Math.max(pad, y - rect.height - 16);
        }

        aclTooltip.style.left = `${left}px`;
        aclTooltip.style.top = `${top}px`;
      }

      function showDeniedTooltip(message, x, y){
        if (!aclTooltip || !message) return;
        aclTooltip.textContent = message;
        aclTooltip.classList.remove('hidden');
        requestAnimationFrame(() => {
          aclTooltip.classList.add('show');
          positionTooltip(x, y);
        });
      }

      function hideDeniedTooltip(){
        if (!aclTooltip) return;
        aclTooltip.classList.remove('show');
        aclTooltip.classList.add('hidden');
        aclTooltip.textContent = '';
      }

      function showInnerPanel(scopeId, sectionId){
        const scope = qs(`#${scopeId}`);
        if (!scope) return;
        currentInnerPanels[scopeId] = sectionId || null;

        qsa(`#${scopeId} .innerSection`).forEach(section => {
          section.classList.toggle('active', !!sectionId && section.id === sectionId);
        });

        const hint = scope.querySelector('.innerHint');
        if (hint) hint.classList.toggle('hidden', !!sectionId);

        qsa(`#${scopeId} .innerTrigger`).forEach(btn => {
          btn.classList.toggle('active', btn.dataset.innerTarget === sectionId);
        });
      }

      function showPanel(panelId){
        currentPanel = panelId || null;
        qsa('.subpanel').forEach(panel => {
          panel.classList.toggle('active', !!panelId && panel.id === panelId);
        });
        defaultHint.classList.toggle('hidden', !!panelId);

        if (panelId === 'subForja') {
          showInnerPanel('subForja', currentInnerPanels.subForja || null);
        }
      }

      function firstVisiblePanel(){
        const groupItems = qsa('.group-item').filter(el => !el.classList.contains('hidden') && !el.classList.contains('disabled'));
        return groupItems.length ? groupItems[0].dataset.target : null;
      }


      function isCurrentAdmin(){
        const email = String(currentUser?.email || '').trim().toLowerCase();
        return String(currentRole || '').trim().toLowerCase() === 'admin';
      }

      function enforceAdminOnlyButtons(){
        const show = !!currentUser;
        [itemHelperData, itemAcl].forEach(item => {
          if (!item) return;
          if (!show) {
            item.classList.add('hidden');
            item.style.display = 'none';
          }
          item.classList.toggle('disabled', !show);
          if (show) {
            item.removeAttribute('aria-disabled');
            setDeniedHint(item, '');
          }
        });
      }

      async function applyLayout(){
        const hiddenButtons = getHiddenIndexButtonKeys();
        const loginVisible = !currentUser && await controlAllowed('nav.login');
        const logoutVisible = !!currentUser && await controlAllowed('nav.logout');
        setVisible(btnLogin, loginVisible);
        setVisible(btnLogout, logoutVisible);

        if (currentUser) {
          setStatusChips(true, currentUser, currentRole);
          try {
            const deniedMsg = sessionStorage.getItem('rf_acl_denied_message') || '';
            if (aclDeniedBanner) {
              if (deniedMsg) { aclDeniedBanner.textContent = deniedMsg; aclDeniedBanner.classList.remove('hidden'); }
              else { aclDeniedBanner.classList.add('hidden'); aclDeniedBanner.textContent = ''; }
            }
            sessionStorage.removeItem('rf_acl_denied_message');
          } catch (_) {}
        } else {
          setStatusChips(false, null, '');
          if (aclDeniedBanner) { aclDeniedBanner.classList.add('hidden'); aclDeniedBanner.textContent = ''; }
        }

        const navControlByPage = {
          'helper-data': 'nav.helper-data',
          'helper-acl': 'nav.helper-acl',
          'kpi': 'nav.kpi'
        };
        const navControlByGroup = {
          'group-forja': 'nav.group-forja',
          'group-prelucrari': 'nav.group-prelucrari',
          'group-tratament-termic': 'nav.group-tratament-termic',
          'group-calitate': 'nav.group-calitate',
          'group-probleme-imbunatatire': 'nav.group-probleme-imbunatatire',
          'group-planificari': 'nav.group-planificari'
        };

        const pageItems = qsa('.page-item[data-page-key]');
        for (const item of pageItems) {
          const pageKey = item.dataset.pageKey;
          const link = item.matches('a[href]') ? item : item.querySelector('a[href]');
          const navControl = navControlByPage[pageKey] || '';
          const controlOk = navControl ? await controlAllowed(navControl) : true;
          const on = !!currentUser && elementAllowed(item, pageKey) && controlOk && !hiddenButtons.has(pageKey);
          setVisible(item, on);
          item.style.display = on ? '' : 'none';
          applyAccessState(item, on, getDeniedMessage(pageKey, link ? link.getAttribute('href') : ''));
        }

        const subLinks = qsa('.subpanel [data-page-key]');
        for (const a of subLinks) {
          const on = !!currentUser && elementAllowed(a, a.dataset.pageKey) && !hiddenButtons.has(a.dataset.pageKey);
          setVisible(a, on);
          applyAccessState(a, on, getDeniedMessage(a.dataset.pageKey, a.getAttribute('href')));
        }

        if (helperDataLink) {
          const helperDataControlOk = await controlAllowed('nav.helper-data');
          const helperDataAllowed = !!currentUser && elementAllowed(helperDataLink, 'helper-data') && helperDataControlOk && !hiddenButtons.has('helper-data');
          if (itemHelperData) {
            setVisible(itemHelperData, helperDataAllowed);
            itemHelperData.style.display = helperDataAllowed ? '' : 'none';
            applyAccessState(itemHelperData, helperDataAllowed, getDeniedMessage('helper-data', helperDataLink.getAttribute('href')));
          }
          setVisible(helperDataLink, helperDataAllowed);
          applyAccessState(helperDataLink, helperDataAllowed, getDeniedMessage('helper-data', helperDataLink.getAttribute('href')));
        }

        if (itemAcl) {
          const aclLink = itemAcl.querySelector('a[href]');
          const aclControlOk = await controlAllowed('nav.helper-acl');
          const aclAllowed = !!currentUser && elementAllowed(itemAcl, 'helper-acl') && aclControlOk && !hiddenButtons.has('helper-acl');
          setVisible(itemAcl, aclAllowed);
          itemAcl.style.display = aclAllowed ? '' : 'none';
          if (aclLink) {
            setVisible(aclLink, aclAllowed);
            applyAccessState(aclLink, aclAllowed, getDeniedMessage('helper-acl', aclLink.getAttribute('href')));
          }
          applyAccessState(itemAcl, aclAllowed, getDeniedMessage('helper-acl', aclLink ? aclLink.getAttribute('href') : 'helper-acl.html'));
        }

        qsa('.subpanel').forEach(panel => {
          const pageButtons = qsa('#' + panel.id + ' [data-page-key]');
          let hasVisibleChild = pageButtons.some(node => !node.classList.contains('hidden'));

          qsa('#' + panel.id + ' .innerSection').forEach(section => {
            const sectionButtons = qsa('#' + section.id + ' [data-page-key]');
            const sectionVisible = sectionButtons.some(node => !node.classList.contains('hidden'));
            setVisible(section, sectionVisible);
            const trigger = panel.querySelector('.innerTrigger[data-inner-target="' + section.id + '"]');
            if (trigger) setVisible(trigger, sectionVisible);
          });

          const hasVisibleDirectLink = qsa('#' + panel.id + ' > a[data-page-key], #' + panel.id + ' > .subgrid > a[data-page-key], #' + panel.id + ' > .zaleGrid a[data-page-key]').some(node => !node.classList.contains('hidden'));
          hasVisibleChild = hasVisibleChild || hasVisibleDirectLink;

          panel.dataset.hasVisibleChild = hasVisibleChild ? '1' : '0';
          panel.dataset.totalPageButtons = String(pageButtons.length);
        });

        const groupItems = qsa('.group-item[data-target]');
        for (const item of groupItems) {
          const groupKey = item.dataset.pageKey || '';
          const panelId = item.dataset.target || '';
          const panel = panelId ? qs('#' + panelId) : null;
          const totalPageButtons = panel ? Number(panel.dataset.totalPageButtons || '0') : 0;
          const panelHasVisibleChild = !!(panel && panel.dataset.hasVisibleChild === '1');
          const controlOk = await controlAllowed(navControlByGroup[groupKey] || '');
          const groupAllowed = !!currentUser && elementAllowed(item, groupKey) && controlOk;
          const on = groupAllowed && totalPageButtons > 0 && panelHasVisibleChild && !hiddenButtons.has(groupKey);
          setVisible(item, on);
          item.style.display = on ? '' : 'none';
          applyAccessState(item, on, getDeniedMessage(groupKey, ''));
        }

        enforceAdminOnlyButtons();

        const desiredPanel = currentPanel && qsa('#' + currentPanel + ' [data-page-key]').some(node => !node.classList.contains('hidden'))
          ? currentPanel
          : firstVisiblePanel();
        showPanel(desiredPanel);
      }

      function goToLogin(){
        const target = `./login.html?t=${Date.now()}`;
        try { window.location.replace(target); }
        catch (_) { window.location.href = target; }
      }

      function clearLogoutFlags(){
        try { sessionStorage.removeItem('rf_force_stay_on_login'); } catch (_) {}
        try { localStorage.removeItem('rf_force_stay_on_login'); } catch (_) {}
      }

      async function getActiveSession(){
        if (!sb) return null;

        for (let i = 0; i < 6; i += 1) {
          try {
            const { data, error } = await sb.auth.getSession();
            if (!error && data?.session?.user) return data.session;
          } catch (_) {}
          await new Promise(resolve => window.setTimeout(resolve, 120));
        }

        try {
          const { data, error } = await sb.auth.getUser();
          if (!error && data?.user) return { user:data.user };
        } catch (_) {}

        return null;
      }

      async function boot(){
        if (!sb) {
          chipAuth.textContent = 'Config lipsă';
          chipAuth.className = 'chip bad';
          return;
        }

        const cachedUser = parseSupabaseUserFromStorage();
        const cachedRole = getStoredRole();
        if (cachedUser || cachedRole) {
          setStatusChips(true, cachedUser, cachedRole || 'viewer');
        }

        const activeSession = await getActiveSession();
        if (!activeSession?.user) {
          currentUser = null;
          currentRole = 'viewer';
          currentPermissions = null;
          currentUserPermissions = null;
          currentRolePermissions = null;
          currentIndexButtonVisibilityDoc = null;
          await applyLayout();
          return;
        }

        clearLogoutFlags();
        currentUser = activeSession.user;
        const resolved = await resolveRole(currentUser);
        currentRole = resolved.role || cachedRole || 'viewer';

        try { localStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
        try { sessionStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
        try {
          const displayId = getStoredDisplayId() || safeIdFromEmail(currentUser.email);
          if (displayId) {
            localStorage.setItem('rf_display_id', displayId);
            sessionStorage.setItem('rf_display_id', displayId);
          }
        } catch (_) {}

        currentUserPermissions = await loadUserPermissionMap(currentUser);
        currentRolePermissions = await loadRolePermissionMap(currentRole);
        currentPermissions = currentUserPermissions || currentRolePermissions;
        await loadDashboardAcl();
        await loadIndexButtonVisibilityDoc();
        await applyLayout();
      }

      btnRefresh.addEventListener('click', () => window.location.reload());

      function clearAuthStorage(){
        const stores = [window.localStorage, window.sessionStorage];
        const keysToRemove = [];
        stores.forEach(store => {
          try {
            for (let i = 0; i < store.length; i += 1) {
              const key = store.key(i);
              if (!key) continue;
              if (
                key.startsWith('sb-') ||
                key.includes('-auth-token') ||
                key.includes('supabase.auth.token') ||
                key.startsWith('rf_')
              ) {
                keysToRemove.push([store, key]);
              }
            }
          } catch (_) {}
        });

        keysToRemove.forEach(([store, key]) => {
          try { store.removeItem(key); } catch (_) {}
        });
      }

      async function handleLogout(){
        const target = `./login.html?logout=1&t=${Date.now()}`;

        btnLogout.disabled = true;
        btnRefresh.disabled = true;

        try { sessionStorage.setItem('rf_force_stay_on_login', '1'); } catch (_) {}
        try { localStorage.setItem('rf_force_stay_on_login', '1'); } catch (_) {}

        clearAuthStorage();
        currentUser = null;
        currentRole = 'viewer';
        currentPermissions = null;
        currentIndexButtonVisibilityDoc = null;
        await applyLayout();

        try {
          if (sb) {
            sb.auth.signOut({ scope: 'local' }).catch(() => {});
            sb.auth.signOut({ scope: 'global' }).catch(() => {});
          }
        } catch (_) {}

        window.setTimeout(() => {
          try { window.location.replace(target); }
          catch (_) { window.location.href = target; }
        }, 10);
      }

      btnLogout.addEventListener('click', handleLogout);

      qsa('.innerTrigger[data-inner-target]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!currentUser) { goToLogin(); return; }
          const scopeId = btn.dataset.innerScope;
          const targetId = btn.dataset.innerTarget;
          if (!scopeId || !targetId) return;
          showInnerPanel(scopeId, currentInnerPanels[scopeId] === targetId ? null : targetId);
        });
      });

      qsa('.group-item').forEach(item => {
        const target = item.dataset.target;
        const trigger = item.querySelector('.menuBtn');
        if (!trigger) return;

        item.addEventListener('mouseenter', () => {
          if (!currentUser || item.classList.contains('hidden')) return;
          if (item.classList.contains('disabled')) { showPanel(null); return; }
          showPanel(target);
        });

        trigger.addEventListener('click', () => {
          if (!currentUser) { goToLogin(); return; }
          if (item.classList.contains('hidden') || item.classList.contains('disabled')) return;
          showPanel(currentPanel === target ? null : target);
        });

        trigger.setAttribute('tabindex', '0');
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trigger.click();
          }
        });
      });

      qsa('.page-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
          if (!currentUser || item.classList.contains('hidden')) return;
          showPanel(null);
        });

        item.addEventListener('focusin', () => {
          if (!currentUser || item.classList.contains('hidden')) return;
          showPanel(null);
        });
      });

      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-denied-message]');
        if (!target) {
          hideDeniedTooltip();
          return;
        }
        showDeniedTooltip(target.dataset.deniedMessage || '', e.clientX, e.clientY);
      });

      document.addEventListener('mousemove', (e) => {
        const target = e.target.closest('[data-denied-message]');
        if (!target || !aclTooltip || aclTooltip.classList.contains('hidden')) return;
        positionTooltip(e.clientX, e.clientY);
      });

      document.addEventListener('mouseout', (e) => {
        const from = e.target.closest('[data-denied-message]');
        if (!from) return;
        const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-denied-message]') : null;
        if (from === to) return;
        hideDeniedTooltip();
      });

      document.addEventListener('focusin', (e) => {
        const target = e.target.closest('[data-denied-message]');
        if (!target) return;
        const r = target.getBoundingClientRect();
        showDeniedTooltip(target.dataset.deniedMessage || '', r.right, r.bottom);
      });

      document.addEventListener('focusout', (e) => {
        const target = e.target.closest('[data-denied-message]');
        if (!target) return;
        hideDeniedTooltip();
      });

      window.addEventListener('scroll', hideDeniedTooltip, true);
      window.addEventListener('resize', hideDeniedTooltip);

      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        if (!currentUser) {
          e.preventDefault();
          goToLogin();
          return;
        }

        const controlled = link.closest('[data-page-key]');
        if (controlled && !elementAllowed(controlled, controlled.dataset.pageKey)) {
          e.preventDefault();
          return;
        }
      }, true);

      window.setInterval(enforceAdminOnlyButtons, 800);

      sb?.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          clearLogoutFlags();
          currentUser = session.user;
          const resolved = await resolveRole(currentUser);
          currentRole = resolved.role || getStoredRole() || 'viewer';
          try { localStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
          try { sessionStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
          try {
            const displayId = getStoredDisplayId() || safeIdFromEmail(currentUser.email);
            if (displayId) {
              localStorage.setItem('rf_display_id', displayId);
              sessionStorage.setItem('rf_display_id', displayId);
            }
          } catch (_) {}
          currentUserPermissions = await loadUserPermissionMap(currentUser);
          currentRolePermissions = await loadRolePermissionMap(currentRole);
          currentPermissions = currentUserPermissions || currentRolePermissions;
          await loadDashboardAcl();
          await applyLayout();
          return;
        }

        const logoutFlag = sessionStorage.getItem('rf_force_stay_on_login') === '1' || localStorage.getItem('rf_force_stay_on_login') === '1';
        if (event !== 'SIGNED_OUT' && !logoutFlag) {
          const recoveredSilent = await getActiveSession();
          if (recoveredSilent?.user) {
            clearLogoutFlags();
            currentUser = recoveredSilent.user;
            const resolvedSilent = await resolveRole(currentUser);
            currentRole = resolvedSilent.role || getStoredRole() || 'viewer';
            try { localStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
            try { sessionStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
            currentUserPermissions = await loadUserPermissionMap(currentUser);
            currentRolePermissions = await loadRolePermissionMap(currentRole);
            currentPermissions = currentUserPermissions || currentRolePermissions;
            await loadDashboardAcl();
            await applyLayout();
          }
          return;
        }

        const recovered = await getActiveSession();
        if (recovered?.user) {
          clearLogoutFlags();
          currentUser = recovered.user;
          const resolved = await resolveRole(currentUser);
          currentRole = resolved.role || getStoredRole() || 'viewer';
          try { localStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
          try { sessionStorage.setItem('rf_cached_role', currentRole); } catch (_) {}
          currentUserPermissions = await loadUserPermissionMap(currentUser);
          currentRolePermissions = await loadRolePermissionMap(currentRole);
          currentPermissions = currentUserPermissions || currentRolePermissions;
          await loadDashboardAcl();
          await applyLayout();
          return;
        }

        currentUser = null;
        currentRole = 'viewer';
        currentPermissions = null;
        currentUserPermissions = null;
        currentRolePermissions = null;
        currentIndexButtonVisibilityDoc = null;
        await applyLayout();

        const target = `./login.html?logout=1&t=${Date.now()}`;
        window.setTimeout(() => {
          try { window.location.replace(target); }
          catch (_) { window.location.href = target; }
        }, 10);
      });

      if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
      else boot();
    })();
  