(function (global) {
  'use strict';
  const COLORS = ['', '#fff2cc', '#d9ead3', '#cfe2f3', '#ead1dc', '#d9d2e9', '#fce5cd', '#d0e0e3', '#ffffff'];
  function normalize(value) {
    const clean = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
    for (const [key, item] of Object.entries(value)) {
      if (!/^(an|data|zi|machine:.+:(reper|planificat|realizat))$/.test(key) || !item || typeof item !== 'object') continue;
      const color = COLORS.includes(item.color) ? item.color : '';
      const note = typeof item.note === 'string' ? item.note.slice(0, 4000) : '';
      if (color || note) clean[key] = { color, note };
    }
    return clean;
  }
  function cellKey(index, machines) {
    if (index < 3) return ['an', 'data', 'zi'][index] || '';
    const machine = machines[Math.floor((index - 3) / 3)];
    return machine ? `machine:${machine}:${['reper', 'planificat', 'realizat'][(index - 3) % 3]}` : '';
  }
  function attach(options) {
    const { body, toolbar, machines, rows, canEdit, save } = options;
    let editing = false, active = null, base = '', picked = '', lastTrigger = null;
    const el = (tag, text, parent) => { const node = document.createElement(tag); if (text) node.textContent = text; if (parent) parent.append(node); return node; };
    const style = el('style', '', document.head);
    style.textContent = `
      #planBody td.plan-note-cell:not(.sticky1):not(.sticky2):not(.sticky3){position:relative}
      #planBody td.plan-cell-colored,#planBody td.plan-cell-colored>.cell-input,#planBody td.plan-cell-colored>.cell-static,#planBody td.plan-cell-colored>.readonly{background:var(--plan-note-color)!important}
      #planBody .plan-note-marker{position:absolute;right:1px;top:1px;z-index:4;width:17px;height:17px;padding:0;border:1px solid #805900;border-radius:3px;background:#fff2cc;color:#533900;font:bold 11px/1 Arial;cursor:pointer}
      #planBody.plan-note-editing td{cursor:crosshair}
      #planBody.plan-note-editing td:hover{outline:2px solid #2563eb;outline-offset:-2px}
      .plan-note-dialog{width:min(440px,calc(100vw - 24px));max-height:85vh;overflow:auto;border:1px solid #9baec6;border-radius:14px;padding:20px;color:#10213d;background:#fff;font:14px/1.5 Arial;box-shadow:0 15px 50px #10213d44}
      .plan-note-dialog::backdrop{background:#10213d55}
      .plan-note-dialog h2{font-size:18px;margin:0 0 12px}
      .plan-note-palette{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}
      .plan-note-palette button{width:32px;height:32px;border:1px solid #899bb2;border-radius:6px;cursor:pointer}
      .plan-note-palette button[aria-pressed=true]{outline:3px solid #2563eb;outline-offset:2px}
      .plan-note-dialog textarea{box-sizing:border-box;width:100%;min-height:130px;padding:10px;border:1px solid #899bb2;border-radius:8px;font:inherit;resize:vertical}
      .plan-note-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
      .plan-note-actions button{padding:8px 12px;border:1px solid #899bb2;border-radius:8px;cursor:pointer}
      .plan-note-error{color:#b42318;white-space:pre-wrap}
      @media print{.plan-note-marker,.plan-note-mode,.plan-note-dialog{display:none!important}}
    `;
    const mode = el('button', 'Culori și notițe', toolbar); mode.type = 'button'; mode.className = 'btn secondary plan-note-mode'; mode.setAttribute('aria-pressed', 'false');
    const dialog = el('dialog', '', document.body); dialog.className = 'plan-note-dialog';
    const heading = el('h2', 'Culoare și notiță', dialog); heading.id = 'plan-note-heading'; dialog.setAttribute('aria-labelledby', heading.id);
    const location = el('p', '', dialog);
    el('div', 'Culoarea celulei', dialog);
    const palette = el('div', '', dialog); palette.className = 'plan-note-palette';
    const swatches = COLORS.map((color, i) => {
      const labels = ['Fără culoare', 'Galben', 'Verde', 'Albastru', 'Roz', 'Mov', 'Portocaliu', 'Turcoaz', 'Alb'];
      const button = el('button', i === 0 ? '×' : '', palette); button.type = 'button'; button.style.background = color || '#fff'; button.title = labels[i]; button.setAttribute('aria-label', labels[i]);
      button.addEventListener('click', () => { if (!canEdit()) return; picked = color; showChoice(); });
      return button;
    });
    const label = el('label', 'Notiță (maximum 4.000 de caractere)', dialog); label.htmlFor = 'plan-note-text';
    const text = el('textarea', '', dialog); text.id = 'plan-note-text'; text.maxLength = 4000;
    const error = el('p', '', dialog); error.className = 'plan-note-error'; error.setAttribute('role', 'alert');
    const actions = el('div', '', dialog); actions.className = 'plan-note-actions';
    const cancel = el('button', 'Închide', actions); cancel.type = 'button';
    const submit = el('button', 'Salvează', actions); submit.type = 'button';
    function showChoice() { swatches.forEach((b, i) => b.setAttribute('aria-pressed', String(COLORS[i] === picked))); }
    function getRow(id) { return rows().find(row => String(row.id) === id); }
    function info(td) {
      const tr = td?.closest('tr[data-row-id]');
      if (!tr || !body.contains(tr) || td.colSpan > 1) return null;
      const key = cellKey(td.cellIndex, machines), id = tr.dataset.rowId;
      return key && getRow(id) ? { id, key } : null;
    }
    function open(td, trigger) {
      active = info(td); if (!active) return;
      const row = getRow(active.id), current = normalize(row.cell_annotations)[active.key] || { color: '', note: '' };
      base = JSON.stringify(current); picked = current.color; text.value = current.note; error.textContent = '';
      location.textContent = [row.data, active.key.replace('machine:', '').replaceAll(':', ' / ')].filter(Boolean).join(' — ');
      const editable = canEdit(); text.readOnly = !editable; submit.hidden = !editable;
      swatches.forEach(b => { b.disabled = !editable; }); showChoice();
      lastTrigger = trigger; dialog.showModal(); text.focus();
    }
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { active = null; if (lastTrigger?.isConnected) lastTrigger.focus(); });
    submit.addEventListener('click', () => {
      if (!active || !canEdit()) return;
      const row = getRow(active.id); if (!row) { error.textContent = 'Rândul nu mai există. Închide această fereastră.'; return; }
      const annotations = normalize(row.cell_annotations), current = annotations[active.key] || { color: '', note: '' };
      if (JSON.stringify(current) !== base) { error.textContent = 'Celula a fost modificată între timp. Redeschide notița pentru a vedea versiunea actuală.'; return; }
      const note = text.value.slice(0, 4000);
      if (note || picked) annotations[active.key] = { color: picked, note }; else delete annotations[active.key];
      if (JSON.stringify(current) !== JSON.stringify({ color: picked, note })) { row.cell_annotations = annotations; save(); apply(); }
      dialog.close();
    });
    mode.addEventListener('click', () => {
      if (!canEdit()) return;
      editing = !editing; mode.setAttribute('aria-pressed', String(editing));
      mode.textContent = editing ? 'Gata — închide culori și notițe' : 'Culori și notițe';
      body.classList.toggle('plan-note-editing', editing);
    });
    // Capture before the existing spreadsheet range selection and cell editor handlers.
    for (const type of ['pointerdown', 'mousedown', 'dblclick', 'click']) body.addEventListener(type, event => {
      const td = event.target.closest('td'), marker = event.target.closest('.plan-note-marker');
      if (!td || (!marker && !(editing && canEdit())) || !info(td)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (type === 'click') open(td, marker || mode);
    }, true);
    function apply() {
      mode.disabled = !canEdit();
      if (!canEdit()) { editing = false; body.classList.remove('plan-note-editing'); mode.setAttribute('aria-pressed', 'false'); mode.textContent = 'Culori și notițe'; }
      body.querySelectorAll('tr[data-row-id]').forEach(tr => {
        const row = getRow(tr.dataset.rowId); if (!row) return;
        const annotations = normalize(row.cell_annotations);
        Array.from(tr.cells).forEach(td => {
          const key = cellKey(td.cellIndex, machines), annotation = annotations[key];
          td.classList.add('plan-note-cell');
          td.classList.toggle('plan-cell-colored', !!annotation?.color);
          if (annotation?.color) td.style.setProperty('--plan-note-color', annotation.color); else td.style.removeProperty('--plan-note-color');
          td.querySelectorAll('.plan-note-marker').forEach(node => node.remove());
          if (annotation?.note) {
            const marker = el('button', 'N', td); marker.type = 'button'; marker.className = 'plan-note-marker';
            marker.setAttribute('aria-label', 'Deschide notița celulei');
          }
        });
      });
    }
    return { apply };
  }
  global.KADPlanCellNotes = { normalize, cellKey, attach };
})(window);
