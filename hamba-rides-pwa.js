/* Hamba Rides: service worker, install prompt, wake lock and fullscreen helpers. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const say = m => { try { if (typeof toast === 'function') toast(m, 3600); } catch (e) {} };

  // Service worker is handled by the host OS (one worker for the whole flat folder).

  // Install button
  let deferred = null;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    const b = $('bInstall'); if (b && !standalone) b.classList.remove('hidden');
  });
  const inst = $('bInstall');
  if (inst) inst.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) {}
    deferred = null; inst.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => { if (inst) inst.classList.add('hidden'); deferred = null; });
  const ua = navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !standalone && $('iosHint')) $('iosHint').classList.remove('hidden');

  // Keep the screen awake while driving
  let lock = null;
  async function wake() {
    try { if ('wakeLock' in navigator && !lock && document.visibilityState === 'visible') { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; }
  }
  for (const id of ['bStart', 'bContinue']) { const b = $(id); if (b) b.addEventListener('click', () => { wake(); try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} }); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && window.G && G.started) wake(); });

  // F toggles fullscreen on desktop
  addEventListener('keydown', e => {
    if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch (err) {}
  });
})();
