/* ═══════════════════════════════════════════════════════════════
   SPOKENMASTER PWA REGISTRATION + INSTALL PROMPT
═══════════════════════════════════════════════════════════════ */

// 1. REGISTER SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered. Scope:', registration.scope);

        // Check for updates every 30 minutes
        setInterval(function() {
          registration.update();
        }, 30 * 60 * 1000);

        // Notify user when new version is available
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch(function(error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}

// 2. INSTALL PROMPT — "Add to Home Screen" banner
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', function(event) {
  event.preventDefault();
  deferredPrompt = event;
  showInstallBanner();
});

function showInstallBanner() {
  // Only show if not already installed and user hasn't dismissed 3+ times
  const dismissCount = parseInt(localStorage.getItem('pwa_dismiss') || '0');
  if (dismissCount >= 3) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  // Create install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:linear-gradient(135deg,#6C63FF,#FF6584);
      color:white;border-radius:16px;padding:14px 20px;
      display:flex;align-items:center;gap:12px;
      box-shadow:0 8px 32px rgba(108,99,255,0.5);
      z-index:9999;max-width:calc(100vw - 32px);width:400px;
      font-family:'Poppins',sans-serif;font-size:0.85rem;
      animation:slideUpBanner 0.4s ease;
    ">
      <span style="font-size:1.8rem;flex-shrink:0">📚</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:0.9rem">Install SpokenMaster App</div>
        <div style="opacity:0.88;font-size:0.75rem;margin-top:2px">
          Learn offline — works without internet!
        </div>
      </div>
      <button id="pwa-install-btn" style="
        background:white;color:#6C63FF;border:none;border-radius:10px;
        padding:8px 16px;font-weight:700;font-size:0.78rem;cursor:pointer;
        flex-shrink:0;font-family:'Poppins',sans-serif;min-height:36px;
      ">Install</button>
      <button id="pwa-dismiss-btn" style="
        background:rgba(255,255,255,0.2);color:white;border:none;
        border-radius:8px;width:28px;height:28px;cursor:pointer;
        font-size:1rem;display:flex;align-items:center;justify-content:center;
        flex-shrink:0;padding:0;
      ">✕</button>
    </div>
    <style>
      @keyframes slideUpBanner {
        from { opacity:0; transform:translateX(-50%) translateY(20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    </style>
  `;
  document.body.appendChild(banner);

  // Install button click
  document.getElementById('pwa-install-btn').addEventListener('click', function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(result) {
      console.log('[PWA] Install result:', result.outcome);
      localStorage.setItem('pwa_installed', result.outcome === 'accepted' ? '1' : '0');
      deferredPrompt = null;
    });
    banner.remove();
  });

  // Dismiss button click
  document.getElementById('pwa-dismiss-btn').addEventListener('click', function() {
    localStorage.setItem('pwa_dismiss', String(dismissCount + 1));
    banner.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(function() {
    if (document.getElementById('pwa-install-banner')) {
      banner.remove();
    }
  }, 10000);
}

// 3. DETECT INSTALLED STATE
window.addEventListener('appinstalled', function() {
  console.log('[PWA] App installed successfully!');
  localStorage.setItem('pwa_installed', '1');
  showToast('✅ SpokenMaster installed! Open from your home screen.');
  deferredPrompt = null;
});

// 4. UPDATE BANNER — notify user when new version available
function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="
      position:fixed;top:70px;right:16px;
      background:linear-gradient(135deg,#43E97B,#00C9FF);
      color:white;border-radius:14px;padding:12px 18px;
      display:flex;align-items:center;gap:10px;
      box-shadow:0 8px 24px rgba(67,233,123,0.4);
      z-index:9998;font-family:'Poppins',sans-serif;font-size:0.82rem;
      max-width:280px;
    ">
      <span>🔄</span>
      <div style="flex:1">
        <div style="font-weight:700">New version available!</div>
        <div style="opacity:0.88;font-size:0.72rem">Refresh to get latest content.</div>
      </div>
      <button onclick="window.location.reload()" style="
        background:white;color:#00B894;border:none;border-radius:8px;
        padding:6px 12px;font-weight:700;font-size:0.72rem;cursor:pointer;
        font-family:'Poppins',sans-serif;
      ">Update</button>
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}

// 5. ONLINE/OFFLINE STATUS INDICATOR
function showToast(message, color) {
  color = color || '#43E97B';
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:${color};color:white;border-radius:12px;
    padding:10px 20px;font-family:'Poppins',sans-serif;font-size:0.82rem;
    font-weight:600;z-index:9999;white-space:nowrap;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
    animation:toastAnim 0.3s ease;
  `;
  toast.textContent = message;
  const style = document.createElement('style');
  style.textContent = '@keyframes toastAnim{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

window.addEventListener('online',  () => showToast('✅ Back online!', '#43E97B'));
window.addEventListener('offline', () => showToast('📵 You are offline. App still works!', '#FA8231'));

// 6. iOS SAFARI INSTALL INSTRUCTIONS
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
function isInStandaloneMode() {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
}

if (isIOS() && !isInStandaloneMode()) {
  const dismissed = localStorage.getItem('ios_banner_dismissed');
  if (!dismissed) {
    setTimeout(function() {
      const banner = document.createElement('div');
      banner.innerHTML = `
        <div style="
          position:fixed;bottom:0;left:0;right:0;
          background:rgba(13,13,43,0.97);
          backdrop-filter:blur(20px);
          color:white;padding:20px 20px 32px;
          border-top:2px solid rgba(108,99,255,0.4);
          z-index:9999;font-family:'Poppins',sans-serif;
          text-align:center;
        ">
          <button onclick="this.closest('[style]').parentElement.remove();localStorage.setItem('ios_banner_dismissed','1')"
            style="position:absolute;top:10px;right:14px;background:transparent;border:none;
            color:rgba(255,255,255,0.5);font-size:1.2rem;cursor:pointer;padding:4px">✕</button>
          <div style="font-size:1.5rem;margin-bottom:8px">📱</div>
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:8px">
            Install SpokenMaster on iPhone
          </div>
          <div style="font-size:0.78rem;color:rgba(255,255,255,0.7);line-height:1.7;margin-bottom:14px">
            Tap the <strong style="color:white">Share button</strong> ↑ at the bottom of Safari<br>
            Then tap <strong style="color:white">"Add to Home Screen"</strong> 📲<br>
            The app will appear on your home screen!
          </div>
          <div style="display:flex;justify-content:center;align-items:center;gap:8px;
            background:rgba(108,99,255,0.15);border-radius:12px;padding:10px 16px;
            font-size:0.75rem;color:rgba(255,255,255,0.8);border:1px solid rgba(108,99,255,0.3)">
            <span>⬆️ Safari → Share → Add to Home Screen</span>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
    }, 3000); // show after 3 seconds
  }
}

// 7. BOTTOM NAVIGATION BAR HIGH LIGHTING
(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
    const href = item.getAttribute('href');
    if (href && currentPage === href) {
      item.classList.add('active');
    }
  });
})();
