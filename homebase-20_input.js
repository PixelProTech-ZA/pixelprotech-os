'use strict';
/* HOMEBASE input: keyboard with remappable interact key. Edge-triggered "hit" plus held state. */
HB.Input = (function () {
  const down = new Set(), pressed = new Set();
  const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape', 'Tab']);

  function codes(action) {
    const k = HB.S ? HB.S.settings.interactKey : 'KeyE';
    switch (action) {
      case 'up': return ['KeyW', 'ArrowUp'];
      case 'down': return ['KeyS', 'ArrowDown'];
      case 'left': return ['KeyA', 'ArrowLeft'];
      case 'right': return ['KeyD', 'ArrowRight'];
      case 'run': return ['ShiftLeft', 'ShiftRight'];
      case 'pause': return ['Escape', 'KeyP'];
      case 'interact': return k === 'Enter' ? ['Enter'] : [k];
      case 'handbrake': return k === 'Space' ? ['ShiftLeft', 'ShiftRight'] : ['Space'];
      case 'honk': return ['KeyH'];
      case 'map': return ['KeyM'];
      case 'fire': return ['KeyJ', 'Space'];
      case 'reload': return ['KeyR'];
      case 'cycle': return ['KeyQ', 'Tab'];
      case 'confirm': return [k, 'Enter', 'Space'];
      default: return [];
    }
  }
  function held(a) { return codes(a).some((c) => down.has(c)); }
  function hit(a) { return codes(a).some((c) => pressed.has(c)); }

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
    if (typing) return;
    if (HB.G.capturing) { HB.G.capturing(e); return; }
    if (HB.G.mode === 'play' && (GAME_KEYS.has(e.code))) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    down.add(e.code);
    if (HB.Audio) HB.Audio.unlock();
  });
  window.addEventListener('keyup', (e) => { down.delete(e.code); });
  window.addEventListener('blur', () => { down.clear(); pressed.clear(); });

  return {
    held, hit, codes,
    axis() {
      return { x: (held('right') ? 1 : 0) - (held('left') ? 1 : 0), y: (held('down') ? 1 : 0) - (held('up') ? 1 : 0) };
    },
    endFrame() { pressed.clear(); },
    clear() { down.clear(); pressed.clear(); },
    anyHit(list) { return list.some((c) => pressed.has(c)); },
  };
})();
