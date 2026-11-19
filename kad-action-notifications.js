(function () {
  'use strict';
  if (window.__kadDailyActionNotices) return;
  window.__kadDailyActionNotices = true;
  const page = location.pathname.split('/').pop() || 'index.html';
  if (/^(login|access-gate|mfa-setup|mfa-verify|forja-ctc-pin|operator-debitare-pin)\.html$/.test(page)) return;
  function dayInRomania(value = new Date()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function calendarDay(value) {
    const s = String(value || '').trim();
    let m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (m) m = [m[0], m[3], m[2], m[1]];
    else m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return '';
    const y = +m[1], month = +m[2], d = +m[3], dt = new Date(Date.UTC(y, month - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== d) return '';
    return `${m[1]}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  function collectActionNotices(payload, today) {
    const notices = [];
    for (const sheet of ['forja', 'prelucrari']) {
      const rows = Array.isArray(payload?.datasets?.[sheet]) ? payload.datasets[sheet] : [];
      rows.forEach((row, index) => {
        const id = String(row.id || index), title = String(row.descriere_probleme || 'Acțiune fără descriere');
        const percent = Number(String(row.procent_realizat ?? 0).replace('%', '').replace(',', '.'));
        const due = calendarDay(row.termen_prop);
        if (due && due <= today && percent !== 100) notices.push({ id: JSON.stringify(['due', today, sheet, id, due]), sheet, row: row.id ? String(row.id) : '', kind: 'due', deadlineDay: due, title, detail: `${due < today ? 'Termen depășit' : 'Termen astăzi'}: ${row.termen_prop}. Responsabil: ${row.responsabil_actiune || 'neprecizat'}` });
        const lines = String(row.observatii || '').split(/\r?\n/);
        let hasNote = false;
        lines.forEach((line, lineIndex) => {
          const date = line.match(/\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}\b/);
          if (!date || calendarDay(date[0]) !== today) return;
          hasNote = true;
          const author = line.match(/^\[[^\]]+\]\s*(?:Creat de\s+(.+)|([^:]+):)/);
          const name = author ? (author[1] || author[2]).trim() : '';
          notices.push({ id: JSON.stringify(['note', today, sheet, id, lineIndex, line]), sheet, row: row.id ? String(row.id) : '', kind: 'today', title, detail: (name ? `Autor: ${name}. ` : 'Autor neprecizat. ') + line });
        });
        if (!hasNote && (calendarDay(row.data_constatare) === today || (row.created_at && dayInRomania(row.created_at) === today))) notices.push({ id: JSON.stringify(['created', today, sheet, id]), sheet, row: row.id ? String(row.id) : '', kind: 'today', title, detail: 'Acțiune datată astăzi. Autor neprecizat în istoric.' });
      });
    }
    for (const event of Array.isArray(payload?.action_changes) ? payload.action_changes : []) {
      if (!event || !['forja', 'prelucrari'].includes(event.sheet) || !event.at || dayInRomania(event.at) !== today) continue;
      notices.push({ id: JSON.stringify(['event', today, event.id]), sheet: event.sheet, row: event.row && (payload?.datasets?.[event.sheet] || []).some(r => String(r.id) === String(event.row)) ? String(event.row) : '', kind: 'today', title: 'Modificare salvată astăzi', detail: `Autor: ${event.author || event.account || 'neprecizat'}` });
    }
    return notices;
  }
  let busy = false, panel, launcher, signature = '', epoch = 0, subscription, selectedCategory = '', panelOpen = false;
  const keys = ['urmarire-actiuni-progres', 'urmarire_actiuni_progres', 'Urmarire actiuni si progres', 'urmarire actiuni si progres'];
  function clear() { panel?.remove(); launcher?.remove(); panel = launcher = null; signature = ''; panelOpen = false; }
  function setPanelOpen(open) {
    panelOpen = open === true;
    panel.hidden = !panelOpen;
    panel.style.setProperty('display', panelOpen ? 'block' : 'none', 'important');
    launcher.setAttribute('aria-expanded', String(panelOpen));
    if (panelOpen) document.body.append(panel); else panel.remove();
  }
  function element(tag, text, parent) { const el = document.createElement(tag); if (text) el.textContent = text; if (parent) parent.append(el); return el; }
  async function check() {
    if (busy || document.hidden || !document.body) return;
    busy = true; const run = epoch;
    try {
      const auth = window.ERPAuth;
      const client = auth ? auth.getSupabaseClient() : window.createRfSupabaseClient?.();
      if (!client) return;
      if (!subscription) subscription = client.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_OUT') { epoch++; clear(); }
        if (event === 'SIGNED_IN') setTimeout(check, 0);
      });
      const session = await client.auth.getSession();
      const user = session.data?.session?.user;
      if (!user) { clear(); return; }
      const access = auth ? await auth.getPageAccess(keys[0], { user, publish: false }) : await window.RF_ACL.resolvePageAccess(keys[0], { user, client });
      if (!access?.allowed || access.permissions?.can_view !== true) { clear(); return; }
      const result = await client.from('rf_documents').select('content,data,updated_at').in('doc_key', keys).order('updated_at', { ascending: false }).limit(1);
      if (result.error || run !== epoch) return;
      const payload = result.data?.[0]?.content || result.data?.[0]?.data;
      const today = dayInRomania();
      const notices = collectActionNotices(payload, today);
      const receiptKey = `kad-action-notices-v2:${user.id}:${today}`;
      let seen = [];
      try { seen = JSON.parse(localStorage.getItem(receiptKey) || '[]'); } catch (_) {}
      if (!Array.isArray(seen)) seen = [];
      const nextSignature = JSON.stringify([user.id, today, notices, seen]);
      if (signature === nextSignature) return;
      const wasOpen = panelOpen;
      clear(); signature = nextSignature;
      if (!notices.length) return;
      launcher = element('button', '', document.body);
      launcher.type = 'button';
      launcher.title = `Notificări acțiuni (${notices.length})`;
      launcher.setAttribute('aria-label', launcher.title);
      launcher.setAttribute('aria-controls', 'kad-action-notice-panel');
      launcher.style.cssText = 'position:fixed;right:16px;top:12px;z-index:99998;width:36px;height:36px;display:grid;place-items:center;background:#173f68;color:white;padding:0;border:1px solid #ffffff99;border-radius:50%;box-shadow:0 2px 6px #10243b26;cursor:pointer';
      launcher.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4M12 2V1"/></svg>';
      const badge = element('span', notices.length > 99 ? '99+' : String(notices.length), launcher);
      badge.setAttribute('aria-hidden', 'true');
      badge.style.cssText = 'position:absolute;top:-5px;right:-7px;min-width:17px;height:17px;padding:0 3px;box-sizing:border-box;display:grid;place-items:center;border-radius:10px;background:#b42318;color:#fff;border:1px solid #fff;font:600 10px/1 system-ui;pointer-events:none';
      // Keep the list detached until the user opens it: page styles cannot expose it.
      panel = element('section', '');
      panel.id = 'kad-action-notice-panel';
      panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Notificări zilnice acțiuni');
      panel.style.cssText = 'position:fixed;right:16px;top:58px;z-index:99999;width:min(460px,calc(100vw - 32px));max-height:min(80vh,calc(100dvh - 76px));overflow:auto;box-sizing:border-box;background:#fff;color:#182b45;border:1px solid #bbcbe1;border-radius:14px;padding:20px;box-shadow:0 12px 40px #10243b44;font:14px/1.5 system-ui;text-align:left';
      launcher.addEventListener('click', () => setPanelOpen(!panelOpen));
      element('h2', 'Urmărire acțiuni și progres — ' + today.split('-').reverse().join('.'), panel).style.fontSize = '18px';
      const dismiss = element('button', 'Am văzut — închide pentru moment', panel);
      dismiss.type = 'button';
      dismiss.addEventListener('click', () => {
        setPanelOpen(false);
        try { localStorage.setItem(receiptKey, JSON.stringify(notices.map(n => n.id))); } catch (_) {}
      });
      const categories = [
        { id: 'overdue', label: 'Termene depășite', color: '#a52323', list: notices.filter(n => n.kind === 'due' && n.deadlineDay < today) },
        { id: 'due-today', label: 'Termene astăzi', color: '#895600', list: notices.filter(n => n.kind === 'due' && n.deadlineDay === today) },
        { id: 'new', label: 'Adăugări și modificări noi', color: '#173f68', list: notices.filter(n => n.kind === 'today') }
      ];
      if (!categories.some(c => c.id === selectedCategory && c.list.length)) selectedCategory = categories.find(c => c.list.length).id;
      const navigation = element('div', '', panel);
      navigation.setAttribute('role', 'group'); navigation.setAttribute('aria-label', 'Categorii notificări');
      navigation.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:16px 0';
      const views = [];
      const selectCategory = id => {
        selectedCategory = id;
        for (const view of views) {
          const active = view.id === id;
          view.section.hidden = !active;
          view.button.setAttribute('aria-pressed', String(active));
          view.button.style.background = active ? view.color : '#fff';
          view.button.style.color = active ? '#fff' : view.color;
        }
      };
      for (const category of categories) {
        const button = element('button', `${category.label} (${category.list.length})`, navigation);
        button.type = 'button'; button.style.cssText = `padding:9px 10px;border:1px solid ${category.color};border-radius:8px;cursor:pointer;font:inherit`;
        button.addEventListener('click', () => selectCategory(category.id));
        const section = element('section', '', panel);
        section.setAttribute('aria-label', category.label);
        views.push({ ...category, button, section });
        element('h3', category.label, section).style.color = category.color;
        if (!category.list.length) element('p', 'Nu există notificări în această categorie.', section);
        const list = category.list;
        for (const notice of list) {
          const box = element('div', '', section); box.style.cssText = 'padding:10px 0;border-top:1px solid #ddd';
          const destination = 'urmarire-actiuni-progres.html?sheet=' + notice.sheet + (notice.row ? '&row=' + encodeURIComponent(notice.row) : '');
          if (notice.row) {
            const titleLink = element('a', '', box);
            titleLink.href = destination;
            element('strong', notice.title, titleLink);
          } else element('strong', notice.title, box);
          element('p', notice.detail, box);
          const label = notice.sheet === 'forja' ? 'Forjă' : 'Prelucrări';
          const link = element('a', (notice.row ? 'Mergi la rând — ' : 'Deschide ') + label, box);
          link.href = destination;
        }
      }
      selectCategory(selectedCategory);
      setPanelOpen(wasOpen);
    } catch (error) { console.warn('Notificări acțiuni indisponibile', error); }
    finally { busy = false; }
  }
  function start() {
    void check();
    setInterval(check, 60000);
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    window.addEventListener('kad-actions-saved', check);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('storage', check);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
