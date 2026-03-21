(function(){
  const LOGO_ID = 'kad-global-logo-overlay';
  const STYLE_ID = 'kad-global-logo-style';
  const LOGO_SRC = './kad-forge-logo.jpeg';

  function inject(){
    if (document.getElementById(LOGO_ID)) return;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #${LOGO_ID}{
          position:fixed;
          top:10px;
          right:12px;
          width:72px;
          height:72px;
          z-index:2147483000;
          pointer-events:none;
          user-select:none;
          opacity:.98;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        #${LOGO_ID} img{
          width:100%;
          height:100%;
          object-fit:contain;
          display:block;
          filter:drop-shadow(0 3px 10px rgba(0,0,0,.28));
        }
        @media (max-width: 900px){
          #${LOGO_ID}{
            width:58px;
            height:58px;
            top:8px;
            right:8px;
          }
        }
        @media print{
          #${LOGO_ID}{ display:none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    const host = document.createElement('div');
    host.id = LOGO_ID;
    host.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = LOGO_SRC;
    img.alt = 'K.A.D Forge';
    img.loading = 'eager';
    img.decoding = 'async';

    host.appendChild(img);
    document.body.appendChild(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once:true });
  } else {
    inject();
  }
})();
