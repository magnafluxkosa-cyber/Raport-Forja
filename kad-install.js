(function () {
  'use strict';
  if (window.__kadInstallLoaded) return;
  window.__kadInstallLoaded = true;

  var pendingPrompt = null;
  var installed = false;
  var button;
  var dialog;
  var status;
  var displayMode = window.matchMedia('(display-mode: standalone)');

  function sync() {
    if (button) button.hidden = installed || displayMode.matches || navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    pendingPrompt = event;
    sync();
  });
  window.addEventListener('appinstalled', function () {
    installed = true;
    pendingPrompt = null;
    if (dialog && dialog.open) dialog.close();
    sync();
  });
  if (displayMode.addEventListener) displayMode.addEventListener('change', sync);

  function mount() {
    var style = document.createElement('style');
    style.textContent = '#kad-install-button{position:fixed;right:18px;bottom:18px;z-index:10000;width:auto;padding:12px 18px;border:1px solid #d9e8f5;border-radius:12px;background:#163a5b;color:white;font:600 14px system-ui;cursor:pointer;box-shadow:0 4px 16px #0003}#kad-install-button[hidden]{display:none!important}#kad-install-dialog{max-width:440px;width:calc(100% - 48px);box-sizing:border-box;border:1px solid #d9e8f5;border-radius:16px;padding:24px;background:#fff;color:#163a5b;font:16px/1.5 system-ui;box-shadow:0 12px 48px #0004}#kad-install-dialog::backdrop{background:#0007}#kad-install-dialog h2{margin:0 0 12px;font-size:22px}#kad-install-dialog p{margin:12px 0}#kad-install-dialog button{padding:10px 16px;border:0;border-radius:8px;background:#163a5b;color:#fff;font:600 14px system-ui;cursor:pointer}#kad-install-button:focus-visible,#kad-install-dialog button:focus-visible{outline:3px solid #36a9e1;outline-offset:3px}';
    document.head.appendChild(style);
    button = document.createElement('button');
    button.id = 'kad-install-button';
    button.type = 'button';
    button.textContent = 'Instalează KAD';
    dialog = document.createElement('dialog');
    dialog.id = 'kad-install-dialog';
    dialog.setAttribute('aria-labelledby', 'kad-install-title');
    dialog.innerHTML = '<h2 id="kad-install-title">Instalează KAD</h2><p id="kad-install-status" role="status"></p><p><strong>Chrome:</strong> meniul ⋮ → Transmite, salvează și distribuie → Instalează pagina ca aplicație.</p><p><strong>Edge:</strong> meniul … → Aplicații → Instalează acest site ca aplicație.</p><p>Dacă aplicația este deja instalată, caută K.A.D în meniul Start. Pentru utilizare ai nevoie de conexiune la internet.</p><button type="button">Închide</button>';
    document.body.appendChild(button);
    document.body.appendChild(dialog);
    status = dialog.querySelector('#kad-install-status');
    dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
    function help(message) {
      status.textContent = message;
      if (!dialog.open) dialog.showModal();
    }
    button.addEventListener('click', async function () {
      if (!pendingPrompt) {
        help('Dacă browserul nu oferă încă instalarea directă, folosește opțiunea din meniul său. Denumirea poate varia în funcție de versiune și limbă.');
        return;
      }
      var prompt = pendingPrompt;
      pendingPrompt = null;
      button.disabled = true;
      try {
        await prompt.prompt();
        var choice = await prompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          help('Ai acceptat instalarea. Browserul finalizează adăugarea aplicației KAD.');
          if (installed && dialog.open) dialog.close();
        }
      } catch (error) {
        help('Instalarea directă nu a putut porni. Poți încerca instalarea din meniul browserului.');
      } finally {
        button.disabled = false;
        sync();
      }
    });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
