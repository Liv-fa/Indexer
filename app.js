function showToast(msg, timeout = 3500) {
  const container = document.getElementById('toasts');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px) scale(0.98)'; }, timeout - 300);
  setTimeout(() => t.remove(), timeout);
}

function isExternalAnchor(a) {
  try { return a.hostname && a.hostname !== location.hostname; } catch(e){ return false; }
}

function applyOpenNewTabPreference(enabled) {
  document.querySelectorAll('a').forEach(a => {
    if (isExternalAnchor(a)) {
      if (enabled) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); }
      else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    }
  });
}

function updateStatusIndicator(online, reason) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (!dot || !text) return;
  dot.classList.remove('status-online','status-offline');
  if (online) dot.classList.add('status-online'); else dot.classList.add('status-offline');
  text.textContent = online ? ('Online' + (reason? ' — ' + reason : '')) : 'Offline';
}

async function checkHealth() {
  if (location.protocol === 'file:') { updateStatusIndicator(true, 'local'); return; }
  if (!navigator.onLine) { updateStatusIndicator(false); return; }
  try {
    const res = await fetch(window.location.href, {cache: 'no-store'});
    if (res && res.ok) { updateStatusIndicator(true, 'live'); }
    else updateStatusIndicator(true, 'stale');
  } catch (e) {
    updateStatusIndicator(false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load websites from CSV
  async function loadWebsites() {
    try {
      const response = await fetch('./websites.csv?t=' + Date.now());
      if (!response.ok) throw new Error('Failed to load websites.csv');
      let csvText = await response.text();
      csvText = csvText.replace(/^\uFEFF/, ''); // Remove BOM if present
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      const sitesList = document.getElementById('sitesList');
      sitesList.innerHTML = ''; // Clear existing list
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 3) {
          const url = values[0].trim();
          const icoUrl = values[1].trim();
          const name = values[2].trim();
          const dt = document.createElement('dt');
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          const img = document.createElement('img');
          img.className = 'site-icon';
          img.src = icoUrl;
          img.alt = name + ' icon';
          const span = document.createElement('span');
          span.className = 'site-title';
          span.textContent = name;
          a.appendChild(img);
          a.appendChild(span);
          dt.appendChild(a);
          sitesList.appendChild(dt);
        }
      }
    } catch (error) {
      console.error('Error loading websites:', error);
      showToast('Failed to load websites list');
    }
  }

  await loadWebsites();

  // Restore settings
  const openNewTab = localStorage.getItem('openNewTab') === 'true';
  const themeLight = localStorage.getItem('themeLight') === 'true';
  const reducedMotion = localStorage.getItem('reducedMotion') === 'true';

  const openNewTabEl = document.getElementById('openNewTab');
  const themeToggle = document.getElementById('themeToggle');
  const reducedMotionEl = document.getElementById('reducedMotion');

  if (openNewTabEl) { openNewTabEl.checked = openNewTab; openNewTabEl.addEventListener('change', e => { localStorage.setItem('openNewTab', e.target.checked); applyOpenNewTabPreference(e.target.checked); showToast('Links will open in new tab: ' + e.target.checked); }); }
  if (themeToggle) { themeToggle.checked = themeLight; themeToggle.addEventListener('change', e => { localStorage.setItem('themeLight', e.target.checked); document.documentElement.dataset.theme = e.target.checked ? 'light' : ''; showToast('Theme: ' + (e.target.checked ? 'Light' : 'Dark')); }); }
  if (reducedMotionEl) { reducedMotionEl.checked = reducedMotion; reducedMotionEl.addEventListener('change', e => { localStorage.setItem('reducedMotion', e.target.checked); document.documentElement.classList.toggle('reduced-motion', e.target.checked); showToast('Reduced motion: ' + e.target.checked); }); }

  applyOpenNewTabPreference(openNewTab);
  if (themeLight) document.documentElement.dataset.theme = 'light';
  if (reducedMotion) document.documentElement.classList.add('reduced-motion');

  // Settings panel toggle
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => { settingsPanel.classList.toggle('show'); settingsPanel.setAttribute('aria-hidden', String(!settingsPanel.classList.contains('show'))); });
    document.addEventListener('click', (e) => { if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) settingsPanel.classList.remove('show'); });
  }

  // Accessibility panel toggle
  const accessBtn = document.getElementById('accessBtn');
  const accessPanel = document.getElementById('accessPanel');
  const showFocusRings = document.getElementById('showFocusRings');
  const runAllPings = document.getElementById('runAllPings');
  if (accessBtn && accessPanel) {
    accessBtn.addEventListener('click', () => { accessPanel.classList.toggle('show'); accessPanel.setAttribute('aria-hidden', String(!accessPanel.classList.contains('show'))); });
    document.addEventListener('click', (e) => { if (!accessPanel.contains(e.target) && e.target !== accessBtn) accessPanel.classList.remove('show'); });
  }
  if (showFocusRings) {
    showFocusRings.checked = document.documentElement.classList.contains('show-focus');
    showFocusRings.addEventListener('change', (e) => { document.documentElement.classList.toggle('show-focus', e.target.checked); showToast('Show focus rings: ' + e.target.checked); });
  }

  // Online / offline events
  window.addEventListener('online', () => { showToast('You are online'); checkHealth(); });
  window.addEventListener('offline', () => { showToast('You are offline'); updateStatusIndicator(false); });

  // Initial check and periodic health checks
  checkHealth();
  setInterval(checkHealth, 30_000);

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // don't trigger shortcuts when typing in inputs, textareas or contenteditable elements
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) return;
    if (e.key === 't') { const v = !(document.documentElement.dataset.theme === 'light'); localStorage.setItem('themeLight', v); document.documentElement.dataset.theme = v ? 'light' : ''; if (themeToggle) themeToggle.checked = v; showToast('Theme toggled: ' + (v? 'Light' : 'Dark')); }
    if (e.key === 'o') { const cur = !(localStorage.getItem('openNewTab') === 'true'); localStorage.setItem('openNewTab', cur); applyOpenNewTabPreference(cur); if (openNewTabEl) openNewTabEl.checked = cur; showToast('Open external links in new tab: ' + cur); }
    if (e.key === '?') { if (settingsPanel) settingsPanel.classList.toggle('show'); }
  });

  // Quick search focus (press '/')
  const searchInput = document.getElementById('search');
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); searchInput && searchInput.focus();
    }
  });

  // Add per-site ping buttons (with 1 minute cooldown)
  (function addPingButtons(){
    const siteLinks = Array.from(document.querySelectorAll('#sitesGrid a'));
    siteLinks.forEach(link => {
      const url = link.href;
      const btn = document.createElement('button');
      btn.className = 'ping-btn';
      btn.type = 'button';
      btn.title = 'Ping site';
      btn.textContent = 'Ping';
      btn.dataset.url = url;
      btn.dataset.cooldownUntil = '0';
      const wrap = link.parentElement;
      if (wrap) wrap.appendChild(btn);

      btn.addEventListener('click', async () => {
        const now = Date.now();
        const cd = parseInt(btn.dataset.cooldownUntil, 10) || 0;
        if (now < cd) { showToast('Ping cooldown active'); return; }
        btn.disabled = true;
        btn.textContent = 'Pinging…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
          clearTimeout(timeout);
          btn.textContent = 'Online';
          showToast((new URL(url)).hostname + ' is online');
        } catch (err) {
          clearTimeout(timeout);
          btn.textContent = 'Offline';
          showToast((new URL(url)).hostname + ' appears offline');
        } finally {
          const next = Date.now() + 60_000;
          btn.dataset.cooldownUntil = String(next);
          setTimeout(() => { btn.disabled = false; btn.textContent = 'Ping'; }, Math.max(0, next - Date.now()));
        }
      });
    });
  })();

  // Run all pings (trigger each ping button sequentially with small delay)
  if (runAllPings) {
    runAllPings.addEventListener('click', async () => {
      const buttons = Array.from(document.querySelectorAll('.ping-btn'));
      if (!buttons.length) { showToast('No pingable sites found'); return; }
      showToast('Running pings...');
      for (let i = 0; i < buttons.length; i++) {
        try { buttons[i].click(); } catch(e){}
        await new Promise(r => setTimeout(r, 220));
      }
    });
  }

  // Reload websites button
  const reloadWebsites = document.getElementById('reloadWebsites');
  if (reloadWebsites) {
    reloadWebsites.addEventListener('click', async () => {
      showToast('Reloading websites...');
      await loadWebsites();
      showToast('Websites reloaded');
    });
  }

  // Filter links by search
  if (searchInput) {
    const links = Array.from(document.querySelectorAll('#sitesGrid a'));
    searchInput.addEventListener('input', (ev) => {
      const q = ev.target.value.trim().toLowerCase();
      links.forEach(a => {
        const title = (a.querySelector('.site-title')?.textContent || a.textContent).toLowerCase();
        const ok = q === '' || title.includes(q);
        a.style.display = ok ? '' : 'none';
      });
    });
  }

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) { ent.target.classList.add('revealed'); observer.unobserve(ent.target); }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('#sitesGrid a').forEach(a => observer.observe(a));

  // Subtle tilt effect on pointer move
  document.querySelectorAll('#sitesGrid a').forEach(card => {
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(650px) translateY(-4px) rotateX(${(-py*6).toFixed(2)}deg) rotateY(${(px*8).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Detect user location by IP and mark sites that are known to be blocked in that location
  async function detectLocationAndMark() {
    const locEl = document.getElementById('locationInfo');
    try {
      const resp = await fetch('https://ipapi.co/json/');
      if (!resp.ok) throw new Error('geo lookup failed');
      const geo = await resp.json();
      const country = geo.country || geo.country_code || '';
      const countryName = geo.country_name || geo.country || '';
      const region = geo.region_code || geo.region || '';
      if (locEl) locEl.textContent = `${geo.city ? geo.city + ', ' : ''}${geo.region ? geo.region + ', ' : ''}${countryName || country}`;
      // simple block map for common adult or restricted sites (best-effort, not exhaustive)
      const blockMap = {
        'pornhub.com': ['CN','IR','KP','AE','SA','PK','BD','OM','QA'],
        'xvideos.com': ['CN','IR','KP','AE','SA','PK'],
        'redgifs.com': ['CN','IR','KP','AE','SA'],
        'coomer.st': ['CN','IR','KP'],
        'gelbooru.com': ['CN','IR','KP'],
        'imhentai.xxx': ['CN','IR','KP'],
        'hdporncomics.com': ['CN','IR','KP'],
        'multporn.com': ['CN','IR','KP'],
        'pmvhaven.com': ['CN','IR','KP'],
        'faproulette.co': ['CN','IR']
      };

      const txOnlyBlocked = ['pornhub.com','redgifs.com'];

      function markSitesForGeo(countryCode, regionCode) {
        document.querySelectorAll('#sitesGrid a').forEach(a => {
          try {
            const host = a.hostname.replace(/^www\./, '').toLowerCase();
            // check country-level blocks
            const blkKey = Object.keys(blockMap).find(k => host === k || host.endsWith('.' + k));
            let isBlocked = false;
            let reason = '';
            if (blkKey && countryCode && blockMap[blkKey].includes(countryCode)) {
              isBlocked = true;
              reason = `Blocked in ${countryName || countryCode}`;
            }
            // check Texas-specific markers (some sites are noted "No Texas")
            if (!isBlocked && regionCode && regionCode.toUpperCase() === 'TX' && txOnlyBlocked.some(h => host === h || host.endsWith('.' + h))) {
              isBlocked = true;
              reason = 'Not available in Texas';
            }
            if (isBlocked) {
              a.classList.add('site-blocked');
              // avoid adding multiple badges
              if (!a.querySelector('.site-badge')) {
                const b = document.createElement('span');
                b.className = 'site-badge';
                b.textContent = 'Unavailable';
                b.title = reason;
                a.appendChild(b);
              }
            }
          } catch (e) { /* ignore per-link errors */ }
        });
      }

      markSitesForGeo((geo.country || geo.country_code || '').toUpperCase(), (geo.region_code || geo.region || '').toUpperCase());
    } catch (e) {
      console.warn('Could not determine location', e);
      const locEl = document.getElementById('locationInfo');
      if (locEl) locEl.textContent = 'Location unknown';
      showToast('Could not determine location');
    }
  }

  // Gentle dynamic background animation (positions controlled via CSS custom properties)
  function initDynamicBg() {
    const el = document.querySelector('.floating-bg');
    if (!el) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const storageReduced = localStorage.getItem('reducedMotion') === 'true';
    if (prefersReduced || storageReduced || document.documentElement.classList.contains('reduced-motion')) return;

    let last = performance.now();
    let t = 0;
    function frame(now) {
      const dt = now - last; last = now;
      t += dt * 0.001; // scale to seconds
      const x1 = 20 + Math.sin(t * 0.9) * 18; // percent
      const y1 = 10 + Math.cos(t * 1.1) * 12;
      const x2 = 80 + Math.cos(t * 0.7) * 20;
      const y2 = 80 + Math.sin(t * 0.6) * 16;
      el.style.setProperty('--bg-pos-1', `${x1.toFixed(2)}% ${y1.toFixed(2)}%`);
      el.style.setProperty('--bg-pos-2', `${x2.toFixed(2)}% ${y2.toFixed(2)}%`);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // run on load
  detectLocationAndMark();
  initDynamicBg();
});

// Register service worker from external JS (avoids inline scripts and allows stricter CSP)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{ console.warn('Service worker registration failed'); });
} else {
  console.log('Service worker not registered (file:// or insecure origin)');
}
