(function(){
      'use strict';

      const DOC_KEY = 'tratament-termic-documente';
      const FILE_DOC_PREFIX = 'tratament-termic-documente:file:';
      const LOCAL_KEY = 'kad:' + DOC_KEY;
      const ALLOWED_EXTENSIONS = ['xls', 'xlsx', 'doc', 'docx'];
      const MIME_LABELS = {
        'application/vnd.ms-excel': 'Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'application/msword': 'Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word'
      };

      const els = {
        authChip: document.getElementById('authChip'),
        roleChip: document.getElementById('roleChip'),
        cloudChip: document.getElementById('cloudChip'),
        selectChip: document.getElementById('selectChip'),
        statRows: document.getElementById('statRows'),
        statDocs: document.getElementById('statDocs'),
        statUpdated: document.getElementById('statUpdated'),
        fldTitlu: document.getElementById('fldTitlu'),
        fldTip: document.getElementById('fldTip'),
        fldDoc: document.getElementById('fldDoc'),
        fldNumeFisier: document.getElementById('fldNumeFisier'),
        fldActualizatDe: document.getElementById('fldActualizatDe'),
        fldObservatii: document.getElementById('fldObservatii'),
        tbodyRows: document.getElementById('tbodyRows'),
        btnReload: document.getElementById('btnReload'),
        btnSaveRow: document.getElementById('btnSaveRow'),
        btnNew: document.getElementById('btnNew'),
        btnDelete: document.getElementById('btnDelete'),
        btnPickDoc: document.getElementById('btnPickDoc'),
        docPickerShell: document.getElementById('docPickerShell'),
        docPickName: document.getElementById('docPickName'),
        formNote: document.getElementById('formNote'),
        readonlyBanner: document.getElementById('readonlyBanner')
      };

      const state = {
        auth: null,
        pageAccess: null,
        rows: [],
        updatedAt: null,
        selectedId: '',
        pendingFile: null,
        fileCache: Object.create(null)
      };

      function toStr(value) {
        return String(value == null ? '' : value).trim();
      }

      function uid() {
        return 'tt-doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      }

      function nowIso() {
        return new Date().toISOString();
      }

      function currentRole() {
        return String((state.auth && state.auth.role) || 'viewer').toLowerCase();
      }

      function currentPermissions() {
        return state.pageAccess && state.pageAccess.permissions ? state.pageAccess.permissions : null;
      }

      function canEdit() {
        const perms = currentPermissions();
        if (perms) return !!(perms.can_add || perms.can_edit);
        return ['admin', 'editor', 'operator'].includes(currentRole());
      }

      function canDelete() {
        const perms = currentPermissions();
        if (perms) return !!perms.can_delete;
        return ['admin', 'editor'].includes(currentRole());
      }

      function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[ch]));
      }

      function setChip(el, text, kind) {
        if (!el) return;
        const dotClass = kind === 'ok' ? 'success' : kind === 'bad' ? 'danger' : 'warning';
        el.innerHTML = '<span class="dot ' + dotClass + '"></span><span>' + escapeHtml(text) + '</span>';
      }

      function errorMessage(error, fallback) {
        if (!error) return fallback || 'A apărut o eroare.';
        if (typeof error === 'string') return error || fallback || 'A apărut o eroare.';
        if (error.message) return String(error.message);
        if (error.error_description) return String(error.error_description);
        if (error.details) return String(error.details);
        try { return JSON.stringify(error); } catch (_) { return fallback || 'A apărut o eroare.'; }
      }

      function formatDateTimeDisplay(value) {
        const clean = toStr(value);
        if (!clean) return '—';
        const date = new Date(clean);
        if (Number.isNaN(date.getTime())) return clean;
        return new Intl.DateTimeFormat('ro-RO', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(date);
      }

      function formatBytes(value) {
        const bytes = Number(value || 0);
        if (!Number.isFinite(bytes) || bytes <= 0) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace('.', ',') + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2).replace('.', ',') + ' MB';
      }

      function detectFileType(fileName, mimeType) {
        const name = toStr(fileName).toLowerCase();
        const ext = name.includes('.') ? name.split('.').pop() : '';
        if (ext === 'xls' || ext === 'xlsx') return 'Excel';
        if (ext === 'doc' || ext === 'docx') return 'Word';
        const mime = toStr(mimeType).toLowerCase();
        return MIME_LABELS[mime] || 'Document';
      }

      function validateFile(file) {
        if (!file) throw new Error('Alege un fișier Excel sau Word.');
        const name = toStr(file.name);
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          throw new Error('Sunt acceptate doar fișiere .xls, .xlsx, .doc și .docx.');
        }
      }

      function normalizeRow(row) {
        return {
          id: toStr(row && row.id) || uid(),
          titlu: toStr(row && row.titlu),
          doc_type: toStr(row && row.doc_type),
          file_name: toStr(row && row.file_name),
          file_size: Number(row && row.file_size) || 0,
          mime_type: toStr(row && row.mime_type),
          file_doc_key: toStr(row && row.file_doc_key) || '',
          observatii: toStr(row && row.observatii),
          updated_at: toStr(row && row.updated_at) || nowIso(),
          updated_by: toStr(row && row.updated_by)
        };
      }

      function sortRows(rows) {
        return rows.slice().sort((a, b) => {
          const ta = toStr(a.titlu);
          const tb = toStr(b.titlu);
          if (ta !== tb) return ta.localeCompare(tb, 'ro', { numeric: true, sensitivity: 'base' });
          return toStr(b.updated_at).localeCompare(toStr(a.updated_at));
        });
      }

      function payloadFromRows(rows) {
        return {
          rows: sortRows((rows || []).map(normalizeRow)),
          updated_at: nowIso()
        };
      }

      async function createSupabase() {
        if (window.ERPAuth && typeof window.ERPAuth.getSupabaseClient === 'function') {
          try { return window.ERPAuth.getSupabaseClient(); } catch (_) { return null; }
        }
        return null;
      }

      function setReadonlyMode(readonly) {
        document.body.classList.toggle('readonly', !!readonly);
        [els.fldTitlu, els.fldActualizatDe, els.fldObservatii].forEach((el) => {
          if (el) el.readOnly = !!readonly;
        });
        if (els.btnSaveRow) els.btnSaveRow.disabled = !!readonly;
        if (els.btnNew) els.btnNew.disabled = !!readonly;
        if (els.btnDelete) els.btnDelete.disabled = !!readonly || !canDelete();
        if (els.btnPickDoc) els.btnPickDoc.disabled = !!readonly;
      }

      function updatePickedFileUi(file) {
        const picked = file || state.pendingFile || null;
        if (!els.docPickName) return;
        if (picked && toStr(picked.name)) {
          els.docPickName.textContent = picked.name;
          els.docPickName.classList.remove('muted');
        } else {
          els.docPickName.textContent = 'Niciun fișier ales';
          els.docPickName.classList.add('muted');
        }
      }

      function selectedRow() {
        return state.rows.find((row) => row.id === state.selectedId) || null;
      }

      function updateSelectionUi() {
        const row = selectedRow();
        if (row) setChip(els.selectChip, 'Document selectat: ' + (row.titlu || row.file_name || '—'), 'ok');
        else setChip(els.selectChip, 'Document selectat: niciunul', 'warn');
        if (els.btnDelete) els.btnDelete.disabled = !row || !canDelete();
      }

      function updateFormNote() {
        const row = selectedRow();
        const picked = state.pendingFile;
        const parts = [];
        parts.push(row ? 'Mod editare: document selectat' : 'Mod editare: rând nou');
        if (row && row.file_name) parts.push('Fișier curent: ' + row.file_name);
        if (picked && picked.name) parts.push('Fișier nou: ' + picked.name);
        if (!picked && !row) parts.push('Completezi denumirea raportului, persoana care actualizează și alegi fișierul Excel sau Word.');
        els.formNote.textContent = parts.join(' • ');
      }

      function setPendingFile(file) {
        state.pendingFile = file || null;
        try { els.fldDoc.value = ''; } catch (_) {}
        updatePickedFileUi(state.pendingFile);
        const selectedFile = state.pendingFile;
        if (selectedFile) {
          els.fldNumeFisier.value = selectedFile.name;
          els.fldTip.value = detectFileType(selectedFile.name, selectedFile.type);
        } else {
          const row = selectedRow();
          els.fldNumeFisier.value = row ? (row.file_name || '') : '';
          els.fldTip.value = row ? (row.doc_type || detectFileType(row.file_name, row.mime_type)) : '';
        }
        updateFormNote();
      }

      function attachPickedFile(input) {
        if (!(input && input.files && input.files[0])) return;
        validateFile(input.files[0]);
        setPendingFile(input.files[0]);
      }

      function openDocPicker() {
        if (!canEdit()) return;
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.xls,.xlsx,.doc,.docx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        tempInput.style.position = 'fixed';
        tempInput.style.left = '-9999px';
        tempInput.style.top = '0';
        document.body.appendChild(tempInput);
        tempInput.addEventListener('change', () => {
          try { attachPickedFile(tempInput); } catch (error) { alert(errorMessage(error, 'Fișier invalid.')); }
          setTimeout(() => tempInput.remove(), 0);
        }, { once: true });
        try {
          if (typeof tempInput.showPicker === 'function') tempInput.showPicker();
          else tempInput.click();
        } catch (_) {
          tempInput.click();
        }
      }

      function fillForm(row) {
        const source = normalizeRow(row || {});
        state.selectedId = source.id;
        els.fldTitlu.value = source.titlu;
        els.fldTip.value = source.doc_type || detectFileType(source.file_name, source.mime_type);
        els.fldNumeFisier.value = source.file_name;
        els.fldActualizatDe.value = source.updated_by;
        els.fldObservatii.value = source.observatii;
        setPendingFile(null);
        updateSelectionUi();
        updateFormNote();
      }

      function clearForm() {
        state.selectedId = '';
        els.fldTitlu.value = '';
        els.fldTip.value = '';
        els.fldNumeFisier.value = '';
        els.fldActualizatDe.value = '';
        els.fldObservatii.value = '';
        setPendingFile(null);
        updateSelectionUi();
        updateFormNote();
        renderTable();
        requestAnimationFrame(() => { try { els.fldTitlu.focus(); } catch (_) {} });
      }

      function renderStats() {
        els.statRows.textContent = String(state.rows.length);
        const count = state.rows.filter((row) => toStr(row.file_doc_key)).length;
        els.statDocs.textContent = String(count);
        els.statUpdated.textContent = formatDateTimeDisplay(state.updatedAt);
      }

      function renderTable() {
        const rows = sortRows(state.rows.map(normalizeRow));
        if (!rows.length) {
          els.tbodyRows.innerHTML = '<tr><td colspan="8" class="empty">Nu există documente Excel / Word salvate.</td></tr>';
          renderStats();
          updateSelectionUi();
          return;
        }

        els.tbodyRows.innerHTML = rows.map((row) => {
          const selectedClass = row.id === state.selectedId ? ' class="selected"' : '';
          return '<tr data-id="' + escapeHtml(row.id) + '"' + selectedClass + '>' +
            '<td>' + escapeHtml(row.titlu || '—') + '</td>' +
            '<td><span class="row-badge">' + escapeHtml(row.doc_type || detectFileType(row.file_name, row.mime_type)) + '</span></td>' +
            '<td>' + escapeHtml(row.file_name || '—') + '</td>' +
            '<td class="right">' + escapeHtml(formatBytes(row.file_size)) + '</td>' +
            '<td>' + escapeHtml(formatDateTimeDisplay(row.updated_at)) + '</td>' +
            '<td>' + escapeHtml(row.updated_by || '—') + '</td>' +
            '<td>' + escapeHtml(row.observatii || '—') + '</td>' +
            '<td class="actions-cell">' +
              '<button type="button" class="mini-btn" data-action="open" data-id="' + escapeHtml(row.id) + '">Deschide</button>' +
              '<button type="button" class="mini-btn" data-action="export" data-id="' + escapeHtml(row.id) + '">Exportă</button>' +
              (canDelete() ? '<button type="button" class="mini-btn danger" data-action="delete" data-id="' + escapeHtml(row.id) + '">Șterge</button>' : '') +
            '</td>' +
          '</tr>';
        }).join('');

        renderStats();
        updateSelectionUi();
      }

      function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(reader.error || new Error('Nu am putut citi fișierul.'));
          reader.readAsDataURL(file);
        });
      }

      function dataUrlToBlob(dataUrl) {
        const match = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(String(dataUrl || ''));
        if (!match) throw new Error('Fișierul salvat nu are format valid.');
        const mime = match[1] || 'application/octet-stream';
        const data = match[3] || '';
        const binary = atob(data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
      }

      async function loadFromCloudOrLocal() {
        let localRows = [];
        let localUpdatedAt = null;
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            localRows = Array.isArray(parsed && parsed.rows) ? parsed.rows.map(normalizeRow) : [];
            localUpdatedAt = parsed && parsed.updated_at ? parsed.updated_at : null;
          }
        } catch (_) {}

        let rows = localRows.slice();
        let updatedAt = localUpdatedAt;

        const sb = await createSupabase();
        if (sb && state.auth && state.auth.user) {
          try {
            const { data, error } = await sb.from('rf_documents').select('doc_key,content,updated_at').eq('doc_key', DOC_KEY).maybeSingle();
            if (error) throw error;
            if (data && data.content && Array.isArray(data.content.rows)) {
              rows = data.content.rows.map(normalizeRow);
              updatedAt = data.updated_at || data.content.updated_at || updatedAt;
              try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ rows, updated_at: updatedAt })); } catch (_) {}
              setChip(els.cloudChip, 'Cloud: sincronizat', 'ok');
            } else if (rows.length) {
              setChip(els.cloudChip, 'Cloud: încărcat din local', 'warn');
            } else {
              setChip(els.cloudChip, 'Cloud: fără documente salvate', 'warn');
            }
          } catch (error) {
            console.error(error);
            setChip(els.cloudChip, 'Cloud: eroare la încărcare', 'bad');
          }
        } else if (rows.length) {
          setChip(els.cloudChip, 'Cloud: folosește datele locale', 'warn');
        } else {
          setChip(els.cloudChip, 'Cloud: neautentificat', 'warn');
        }

        state.rows = rows.map(normalizeRow);
        state.updatedAt = updatedAt;
        renderTable();
      }

      async function saveMetadata(rows, showSuccessChip) {
        const payload = payloadFromRows(rows);
        state.rows = payload.rows.map(normalizeRow);
        state.updatedAt = payload.updated_at;
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(payload)); } catch (_) {}

        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) {
          setChip(els.cloudChip, 'Cloud: salvat doar local', 'warn');
          renderStats();
          return { ok: false, error: new Error('Nu există conexiune cloud activă.') };
        }

        try {
          const { error } = await sb.from('rf_documents').upsert({
            doc_key: DOC_KEY,
            content: payload,
            updated_at: payload.updated_at
          }, { onConflict: 'doc_key' });
          if (error) throw error;
          if (showSuccessChip !== false) setChip(els.cloudChip, 'Cloud: sincronizat', 'ok');
          renderStats();
          return { ok: true, error: null };
        } catch (error) {
          console.error(error);
          setChip(els.cloudChip, 'Cloud: eroare salvare', 'bad');
          renderStats();
          return { ok: false, error };
        }
      }

      async function ensureFileDoc(row) {
        const fileDocKey = toStr(row && row.file_doc_key);
        if (!fileDocKey) throw new Error('Documentul selectat nu are fișier salvat.');
        if (state.fileCache[fileDocKey]) return state.fileCache[fileDocKey];
        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) throw new Error('Nu există conexiune cloud activă.');
        const { data, error } = await sb.from('rf_documents').select('content').eq('doc_key', fileDocKey).maybeSingle();
        if (error) throw error;
        const content = data && data.content ? data.content : null;
        if (!content || !toStr(content.data_url)) throw new Error('Fișierul nu a putut fi găsit în cloud.');
        state.fileCache[fileDocKey] = content;
        return content;
      }

      async function saveFileDocFromFile(file, row) {
        validateFile(file);
        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) throw new Error('Nu există conexiune cloud activă.');
        const source = normalizeRow(row || {});
        const docKey = toStr(source.file_doc_key) || (FILE_DOC_PREFIX + source.id);
        const dataUrl = await fileToDataUrl(file);
        const payload = {
          file_name: toStr(file.name),
          file_size: Number(file.size || 0),
          mime_type: toStr(file.type) || 'application/octet-stream',
          data_url: dataUrl,
          updated_at: nowIso()
        };
        const { error } = await sb.from('rf_documents').upsert({
          doc_key: docKey,
          content: payload,
          updated_at: payload.updated_at
        }, { onConflict: 'doc_key' });
        if (error) throw error;
        state.fileCache[docKey] = payload;
        return { docKey, payload };
      }

      async function deleteFileDoc(fileDocKey) {
        const key = toStr(fileDocKey);
        if (!key) return;
        const sb = await createSupabase();
        if (!(sb && state.auth && state.auth.user)) return;
        try {
          await sb.from('rf_documents').delete().eq('doc_key', key);
          delete state.fileCache[key];
        } catch (error) {
          console.warn('Nu am putut șterge fișierul din rf_documents.', error);
        }
      }

      async function openOrDownloadRow(row, forceDownload) {
        const source = normalizeRow(row || {});
        const fileDoc = await ensureFileDoc(source);
        const blob = dataUrlToBlob(fileDoc.data_url);
        const objectUrl = URL.createObjectURL(blob);
        const fileName = source.file_name || fileDoc.file_name || 'document';
        try {
          if (forceDownload) {
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else {
            const opened = window.open(objectUrl, '_blank', 'noopener');
            if (!opened) {
              const a = document.createElement('a');
              a.href = objectUrl;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
          }
        } finally {
          setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch (_) {} }, 2000);
        }
      }

      async function upsertRow() {
        if (!canEdit()) return;
        try {
          const selected = selectedRow();
          const row = normalizeRow(selected || {});
          row.titlu = toStr(els.fldTitlu.value);
          row.updated_by = toStr(els.fldActualizatDe.value);
          row.observatii = toStr(els.fldObservatii.value);

          if (!row.titlu) throw new Error('Completează denumirea raportului.');
          if (!row.updated_by) throw new Error('Completează câmpul „Actualizat de”.');
          if (!selected && !state.pendingFile) throw new Error('Alege fișierul Excel sau Word înainte de salvare.');

          if (state.pendingFile) {
            const saved = await saveFileDocFromFile(state.pendingFile, row);
            row.file_doc_key = saved.docKey;
            row.file_name = saved.payload.file_name;
            row.file_size = saved.payload.file_size;
            row.mime_type = saved.payload.mime_type;
            row.doc_type = detectFileType(row.file_name, row.mime_type);
            row.updated_at = saved.payload.updated_at;
          } else if (selected) {
            row.file_doc_key = selected.file_doc_key;
            row.file_name = selected.file_name;
            row.file_size = selected.file_size;
            row.mime_type = selected.mime_type;
            row.doc_type = selected.doc_type || detectFileType(row.file_name, row.mime_type);
            row.updated_at = nowIso();
          }

          const nextRows = state.rows.filter((item) => item.id !== row.id);
          nextRows.push(row);
          const result = await saveMetadata(nextRows, true);
          if (!result.ok) throw result.error || new Error('Documentul nu a putut fi salvat.');
          state.selectedId = row.id;
          setPendingFile(null);
          fillForm(row);
          renderTable();
        } catch (error) {
          alert(errorMessage(error, 'Documentul nu a putut fi salvat.'));
        }
      }

      async function deleteSelected() {
        if (!canDelete()) return;
        const row = selectedRow();
        if (!row) {
          alert('Selectează mai întâi documentul pe care vrei să îl ștergi.');
          return;
        }
        if (!window.confirm('Ștergi documentul „' + (row.titlu || row.file_name || '—') + '”?')) return;
        try {
          await deleteFileDoc(row.file_doc_key);
          const nextRows = state.rows.filter((item) => item.id !== row.id);
          const result = await saveMetadata(nextRows, true);
          if (!result.ok) throw result.error || new Error('Documentul nu a putut fi șters.');
          clearForm();
        } catch (error) {
          alert(errorMessage(error, 'Documentul nu a putut fi șters.'));
        }
      }

      function bindRowClicks() {
        els.tbodyRows.addEventListener('click', async (event) => {
          const actionEl = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
          if (actionEl) {
            const row = state.rows.find((item) => item.id === actionEl.getAttribute('data-id')) || null;
            if (!row) return;
            const action = toStr(actionEl.getAttribute('data-action'));
            if (action === 'open') {
              try { await openOrDownloadRow(row, false); } catch (error) { alert(errorMessage(error, 'Fișierul nu a putut fi deschis.')); }
              return;
            }
            if (action === 'export') {
              try { await openOrDownloadRow(row, true); } catch (error) { alert(errorMessage(error, 'Fișierul nu a putut fi exportat.')); }
              return;
            }
            if (action === 'delete') {
              state.selectedId = row.id;
              fillForm(row);
              await deleteSelected();
              return;
            }
          }
          const tr = event.target && event.target.closest ? event.target.closest('tr[data-id]') : null;
          if (!tr) return;
          const row = state.rows.find((item) => item.id === tr.getAttribute('data-id')) || null;
          if (row) fillForm(row);
        });
      }

      async function initAuth() {
        try {
          const auth = await window.ERPAuth.requireAuth({ redirectToLogin: true, next: 'tratament-termic-documente.html' });
          if (!auth) return false;
          state.auth = auth;
          if (window.ERPAuth && typeof window.ERPAuth.getPageAccess === 'function') {
            state.pageAccess = await window.ERPAuth.getPageAccess('tratament-termic-documente', { user: auth.user, role: auth.role });
            const blockedByAcl = !state.pageAccess || state.pageAccess.allowed === false || (state.pageAccess.permissions && state.pageAccess.permissions.can_view === false);
            if (blockedByAcl) {
              const deniedMessage = (state.pageAccess && state.pageAccess.message) || 'Nu ai drept de vizualizare pentru această foaie.';
              alert(deniedMessage);
              window.location.href = 'index.html';
              return false;
            }
          }
          setChip(els.authChip, 'Autentificare: activă', 'ok');
          const roleLabel = window.ERPAuth && typeof window.ERPAuth.roleLabel === 'function' ? window.ERPAuth.roleLabel(auth.role) : auth.role;
          setChip(els.roleChip, 'Cont: ' + roleLabel, 'ok');
          setReadonlyMode(!canEdit());
          return true;
        } catch (error) {
          console.error(error);
          setChip(els.authChip, 'Autentificare: eroare', 'bad');
          setChip(els.roleChip, 'Cont: necunoscut', 'bad');
          return false;
        }
      }

      function bindActions() {
        els.btnReload.addEventListener('click', () => { window.location.reload(); });
        els.btnSaveRow.addEventListener('click', upsertRow);
        els.btnNew.addEventListener('click', clearForm);
        els.btnDelete.addEventListener('click', deleteSelected);
        els.fldDoc.addEventListener('change', () => {
          try { attachPickedFile(els.fldDoc); } catch (error) { alert(errorMessage(error, 'Fișier invalid.')); }
        });
        if (els.btnPickDoc) els.btnPickDoc.addEventListener('click', openDocPicker);
        if (els.docPickerShell) els.docPickerShell.addEventListener('dblclick', openDocPicker);
        [els.fldTitlu, els.fldActualizatDe, els.fldObservatii].forEach((el) => {
          el.addEventListener('input', updateFormNote);
          el.addEventListener('change', updateFormNote);
        });
        bindRowClicks();
      }

      async function init() {
        const ok = await initAuth();
        if (!ok) return;
        bindActions();
        await loadFromCloudOrLocal();
        clearForm();
      }

      init();
    })();