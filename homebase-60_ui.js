'use strict';
/* HOMEBASE UI: stage scaling, HUD, dialog, modal stack, toast, minimap. All DOM, no external assets. */
HB.UI = (function () {
  const U = HB.u, esc = U.esc;
  const UI = { stack: [], dlg: null };
  let el = {}, mini = null, miniCtx = null, miniBase = null, toastT = 0;

  UI.init = function () {
    const q = (id) => document.getElementById(id);
    el = { stage: q('stage'), ui: q('ui'), coins: q('hud-coins'), track: q('hud-track'), prompt: q('hud-prompt'), toasts: q('toasts'), modals: q('modals'), dialog: q('dialog'), float: q('floats'), mini: q('minimap'), hud: q('hud'), timer: q('hud-timer'), speed: q('hud-speed'), hp: q('hp-fill'), hpt: q('hp-txt'), ar: q('ar-fill'), heat: q('heat'), wpn: q('hud-weapon'), zone: q('zone'), cine: q('cine') };
    mini = el.mini; miniCtx = mini.getContext('2d');
    window.addEventListener('resize', UI.fit); UI.fit();
    el.modals.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      const top = UI.stack[UI.stack.length - 1]; if (!top) return;
      const fn = top.on && top.on[t.getAttribute('data-act')];
      HB.Audio.unlock(); HB.Audio.sfx('click');
      if (fn) safe(() => fn(t, e, top));
    });
    el.modals.addEventListener('input', (e) => { const t = e.target.closest('[data-in]'); if (!t) return; const top = UI.stack[UI.stack.length - 1]; const fn = top && top.on && top.on[t.getAttribute('data-in')]; if (fn) safe(() => fn(t, e, top)); });
    el.modals.addEventListener('change', (e) => { const t = e.target.closest('[data-ch]'); if (!t) return; const top = UI.stack[UI.stack.length - 1]; const fn = top && top.on && top.on[t.getAttribute('data-ch')]; if (fn) safe(() => fn(t, e, top)); });
    buildMiniBase();
  };
  function safe(fn) { try { fn(); } catch (e) { HB.reportError(e); } }

  UI.fit = function () {
    const s = Math.min(window.innerWidth / HB.VW, window.innerHeight / HB.VH);
    el.stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    UI.scale = s;
  };
  UI.applySettings = function () {
    el.ui.classList.toggle('big', !!HB.S.settings.bigText);
    el.stage.classList.toggle('calm', !!HB.S.settings.reduceMotion);
  };

  /* ---------- HUD ---------- */
  const setT = (e, v) => { if (e && e._v !== v) { e._v = v; e.textContent = v; } };
  UI.refreshHud = function () {
    if (!el.coins) return;
    const S = HB.S, C = HB.Combat;
    setT(el.coins, 'R ' + S.coins);
    const hp = Math.round(U.clamp(S.hp / S.maxhp, 0, 1) * 100);
    if (el.hp._w !== hp) { el.hp._w = hp; el.hp.style.width = hp + '%'; el.hp.parentNode.classList.toggle('low', hp < 30); }
    setT(el.hpt, 'HP ' + Math.ceil(S.hp));
    const ar = Math.round(U.clamp(S.armor / 100, 0, 1) * 100);
    if (el.ar._w !== ar) { el.ar._w = ar; el.ar.style.width = ar + '%'; }
    const h = C ? C.heat : 0;
    if (el.heat._h !== h) { el.heat._h = h; [].forEach.call(el.heat.children, (c, i) => c.classList.toggle('on', i < h)); el.heat.classList.toggle('hot', h > 0); }
    if (C) { const w = C.cur(), txt = w.name + '\u2003' + C.ammoText(); setT(el.wpn, txt); }
    const t = HB.Missions ? HB.Missions.tracker() : null;
    const html = t ? '<small>// OBJECTIVE</small><b>' + esc(t.title) + '</b>' + t.lines.map((l) => '<div>' + esc(l) + '</div>').join('') : '';
    if (el.track._h !== html) { el.track._h = html; el.track.innerHTML = html; }
  };
  function keyName() { const k = HB.S.settings.interactKey; return k.replace('Key', '').replace('Enter', 'Enter').replace('Space', 'Space'); }
  UI.keyName = keyName;
  UI.showHud = function (on) { el.hud.style.display = on ? '' : 'none'; };
  UI.setPrompt = function (txt) { if (txt !== UI._pt) { UI._pt = txt; el.prompt.style.display = txt ? '' : 'none'; if (txt) el.prompt.innerHTML = '<span class="key">' + esc(keyName()) + '</span> ' + esc(txt); } };
  UI.setTimer = function (txt) { el.timer.style.display = txt ? '' : 'none'; if (txt) el.timer.innerHTML = txt; };
  UI.setSpeed = function (txt) { el.speed.style.display = txt ? '' : 'none'; if (txt) el.speed.textContent = txt; };
  UI.toast = function (text, kind) {
    const d = document.createElement('div'); d.className = 'toast ' + (kind || ''); d.textContent = text; el.toasts.appendChild(d);
    while (el.toasts.children.length > 3) el.toasts.removeChild(el.toasts.firstChild);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 3200);
  };
  UI.floatText = function (text) {
    if (HB.S.settings.reduceMotion) return;
    const d = document.createElement('div'); d.className = 'float'; d.textContent = text; el.float.appendChild(d); setTimeout(() => d.remove(), 1400);
  };

  /* ---------- minimap ---------- */
  function buildMiniBase() {
    const [c, g] = HB.Gfx.mk(160, 120); const k = 2.5;
    miniBase = { c, g, k };
  }
  UI.miniBaseCanvas = () => miniBase.c;
  UI.renderMiniBase = function () {
    const W = HB.World, g = miniBase.g, k = miniBase.k;
    const col = { 0: '#0f2019', 1: '#2c2c3a', 2: '#1f1f2b', 3: '#201b36', 4: '#2a1b66', 5: '#08323a', 6: '#2a2838', 7: '#2a2838', 8: '#1c1c26' };
    for (let y = 0; y < W.ROWS; y++) for (let x = 0; x < W.COLS; x++) { g.fillStyle = col[W.tileAt(x * 32 + 1, y * 32 + 1)] || '#0f2019'; g.fillRect(x * k, y * k, k + 0.5, k + 0.5); }
    W.buildings.forEach((b) => { g.fillStyle = '#3a3750'; g.fillRect(b.x * k, b.y * k, b.w * k, b.h * k); g.fillStyle = b.acc; g.fillRect(b.x * k, b.y * k, b.w * k, 1); g.fillStyle = '#f1eefa'; g.fillRect((b.door.tx) * k, (b.door.ty) * k, k, k); });
  };
  UI.drawMini = function (target) {
    const g = miniCtx, k = miniBase.k, p = HB.E.player, pos = p.vehicle || p, C = HB.Combat, t = HB.G.time;
    g.clearRect(0, 0, 160, 120); g.drawImage(miniBase.c, 0, 0);
    HB.E.vehicles.forEach((v) => { g.fillStyle = '#d8b96a'; g.fillRect(v.x / 32 * k - 1.5, v.y / 32 * k - 1.5, 3, 3); });
    HB.E.foes.forEach((f) => { if (f.stand) return; g.fillStyle = f.cop ? (Math.floor(t * 4) % 2 ? '#7b2fff' : '#00d4aa') : '#d8b96a'; g.fillRect(f.x / 32 * k - 1, f.y / 32 * k - 1, 2.5, 2.5); });
    HB.E.chasers.forEach((v) => { g.fillStyle = Math.floor(t * 5) % 2 ? '#7b2fff' : '#00d4aa'; g.fillRect(v.x / 32 * k - 2, v.y / 32 * k - 1.5, 4, 3); });
    if (target) { const bl = Math.floor(t * 3) % 2; g.strokeStyle = bl ? '#00d4aa' : '#f1eefa'; g.lineWidth = 1.5; g.beginPath(); g.arc(target.x / 32 * k, target.y / 32 * k, 4 + bl, 0, 7); g.stroke(); }
    g.fillStyle = '#f1eefa'; g.beginPath(); g.arc(pos.x / 32 * k, pos.y / 32 * k, 3.2, 0, 7); g.fill(); g.fillStyle = '#00d4aa'; g.beginPath(); g.arc(pos.x / 32 * k, pos.y / 32 * k, 1.8, 0, 7); g.fill();
  };

  /* ---------- cinematic title cards and zone banners ---------- */
  UI.cine = function (kicker, title, sub, ms) {
    const c = el.cine; if (!c) return;
    c.innerHTML = '<i class="bar t"></i><i class="bar b"></i><div class="card"><small>' + esc(kicker) + '</small><h1 style="font-size:' + (title.length > 18 ? 34 : title.length > 12 ? 44 : 54) + 'px">' + esc(title) + '</h1><p>' + esc(sub || '') + '</p></div>';
    c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
    clearTimeout(UI._cine); UI._cine = setTimeout(() => c.classList.remove('on'), ms || 2800);
  };
  UI.zone = function (name) {
    const z = el.zone; if (!z) return; z.textContent = '// ' + name; z.classList.remove('on'); void z.offsetWidth; z.classList.add('on');
  };

  /* ---------- modal stack ---------- */
  UI.open = function (html, opts) {
    opts = opts || {};
    const m = document.createElement('div');
    m.className = 'modal ' + (opts.cls || '');
    m.innerHTML = html;
    el.modals.appendChild(m);
    const entry = { el: m, on: opts.on || {}, onClose: opts.onClose, closable: opts.closable !== false, noBack: !!opts.noBack };
    UI.stack.forEach((s) => { s.el.style.display = 'none'; });
    UI.stack.push(entry);
    HB.G.modal = true; UI.setPrompt(null);
    if (opts.focus !== false) { const f = m.querySelector('[data-focus]') || m.querySelector('button'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 30); }
    return entry;
  };
  UI.setHtml = function (entry, html) { entry.el.innerHTML = html; const f = entry.el.querySelector('[data-focus]'); if (f) f.focus({ preventScroll: true }); };
  UI.close = function (entry) {
    const i = UI.stack.indexOf(entry); if (i < 0) return;
    UI.stack.splice(i, 1); entry.el.remove();
    const top = UI.stack[UI.stack.length - 1];
    if (top) { top.el.style.display = ''; const f = top.el.querySelector('[data-focus]') || top.el.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
    else { HB.G.modal = false; HB.Input.clear(); }
    if (entry.onClose) safe(() => entry.onClose());
  };
  UI.closeTop = function () { const t = UI.stack[UI.stack.length - 1]; if (t && t.closable) UI.close(t); return !!t; };
  UI.closeAll = function () { while (UI.stack.length) { const t = UI.stack[UI.stack.length - 1]; t.onClose = null; UI.close(t); } if (el.dialog) el.dialog.style.display = 'none'; UI.dlg = null; HB.G.modal = false; HB.G.paused = false; };
  UI.top = () => UI.stack[UI.stack.length - 1];

  UI.panel = function (title, body, opts) {
    opts = opts || {};
    const html = '<div class="panel ' + (opts.wide ? 'wide' : '') + '">' + (title ? '<h2>' + title + '</h2>' : '') + '<div class="pbody">' + body + '</div>' + (opts.noClose ? '' : '<div class="prow"><button class="btn ghost" data-act="close" data-focus>' + (opts.closeLabel || 'CLOSE') + '</button></div>') + '</div>';
    const on = Object.assign({ close: (n, e, ent) => UI.close(ent) }, opts.on || {});
    return UI.open(html, { on, onClose: opts.onClose, closable: opts.closable });
  };

  /* ---------- dialog (bottom box with portrait + typewriter) ---------- */
  UI.dialog = function (who, look, lines, opts) {
    opts = opts || {};
    const d = { who, look, lines: Array.isArray(lines) ? lines.slice() : [lines], i: 0, shown: 0, opts, choices: opts.choices || null, done: false };
    UI.dlg = d; HB.G.modal = true; UI.setPrompt(null);
    el.dialog.style.display = '';
    renderDialog(); return d;
  };
  function renderDialog() {
    const d = UI.dlg; if (!d) return;
    const last = d.i >= d.lines.length - 1;
    el.dialog.innerHTML = '<canvas id="dportrait" width="64" height="76"></canvas><div class="dtext"><div class="dname">' + esc(d.who) + '</div><div class="dline" id="dline"></div><div class="dchoices" id="dchoices"></div><div class="dhint" id="dhint"></div></div>';
    const c = document.getElementById('dportrait').getContext('2d'); c.imageSmoothingEnabled = false;
    if (d.look) { const spr = HB.Gfx.charSprite(d.look, 'down', 0); c.drawImage(spr, 0, 0, 32, 58, 11, 0, 42, 76); }
    else if (d.opts.icon) { c.font = '44px sans-serif'; c.textAlign = 'center'; c.fillText(d.opts.icon, 32, 52); }
    d.shown = 0; d.full = d.lines[d.i]; d.done = false;
    clearInterval(d.timer);
    const line = document.getElementById('dline');
    const step = () => { d.shown += HB.S.settings.reduceMotion ? 999 : 2; line.textContent = d.full.slice(0, d.shown); if (d.shown >= d.full.length) { clearInterval(d.timer); d.done = true; showTail(last); } };
    d.timer = setInterval(step, 24); step();
    if (!el.dialog.dataset.bound) { el.dialog.dataset.bound = 1; el.dialog.addEventListener('click', (e) => { const b = e.target.closest('[data-choice]'); if (b) { UI.pickChoice(+b.getAttribute('data-choice')); return; } UI.advanceDialog(); }); }
  }
  function showTail(last) {
    const d = UI.dlg; if (!d) return;
    const ch = document.getElementById('dchoices'), hint = document.getElementById('dhint');
    if (last && d.choices) { ch.innerHTML = d.choices.map((c, i) => '<button class="btn small" data-choice="' + i + '">' + (i + 1) + '. ' + esc(c.label) + '</button>').join(''); hint.textContent = ''; }
    else hint.textContent = last ? 'Press ' + keyName() + ' to close' : 'Press ' + keyName() + ' ▸';
  }
  UI.advanceDialog = function () {
    const d = UI.dlg; if (!d) return;
    if (!d.done) { d.shown = 9999; clearInterval(d.timer); document.getElementById('dline').textContent = d.full; d.done = true; showTail(d.i >= d.lines.length - 1); return; }
    if (d.i < d.lines.length - 1) { d.i++; renderDialog(); return; }
    if (d.choices) return; // must pick
    UI.endDialog();
  };
  UI.pickChoice = function (i) {
    const d = UI.dlg; if (!d || !d.choices || !d.done || d.i < d.lines.length - 1) return;
    const c = d.choices[i]; if (!c) return;
    HB.Audio.sfx('click'); UI.endDialog(true); if (c.fn) safe(() => c.fn());
  };
  UI.endDialog = function (skipEnd) {
    const d = UI.dlg; if (!d) return;
    clearInterval(d.timer); UI.dlg = null; el.dialog.style.display = 'none'; el.dialog.innerHTML = '';
    if (!UI.stack.length) HB.G.modal = false;
    if (!skipEnd && d.opts.onEnd) safe(() => d.opts.onEnd());
    HB.Input.clear();
  };
  /* convenience: speech with a sequence of lines then optional choices */
  UI.say = function (npcId, lines, opts) {
    const n = HB.E.npcs.find((q) => q.id === npcId);
    return UI.dialog(n ? n.name : npcId, n ? n.look : null, lines, opts);
  };

  UI.update = function () {
    const I = HB.Input;
    if (UI.dlg) {
      if (I.hit('confirm') && !UI.dlg.choices) UI.advanceDialog();
      else if (I.hit('confirm') && UI.dlg.choices && UI.dlg.i < UI.dlg.lines.length - 1) UI.advanceDialog();
      else if (I.hit('confirm') && UI.dlg.choices && !UI.dlg.done) UI.advanceDialog();
      ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((c, i) => { if (I.anyHit([c])) UI.pickChoice(i); });
      if (I.hit('pause')) { UI.endDialog(true); }
      return;
    }
    if (I.hit('pause')) { if (!UI.closeTop() && HB.G.mode === 'play') HB.Screens.pause(); }
  };

  UI.confirm = function (text, yes, no, yesLabel) {
    return UI.open('<div class="panel small"><p class="msg">' + esc(text) + '</p><div class="prow"><button class="btn" data-act="yes" data-focus>' + esc(yesLabel || 'Yes') + '</button><button class="btn ghost" data-act="no">Not now</button></div></div>', { on: { yes: (n, e, ent) => { UI.close(ent); if (yes) yes(); }, no: (n, e, ent) => { UI.close(ent); if (no) no(); } } });
  };

  return UI;
})();

HB.reportError = function (e) {
  try {
    console.error(e);
    const now = performance.now();
    HB.G.errors = HB.G.errors.filter((t) => now - t < 8000); HB.G.errors.push(now);
    if (HB.G.errors.length === 1 && HB.UI && HB.UI.toast) HB.UI.toast('[ SYS ] Recoverable fault logged. Continuing.', 'warn');
    if (HB.G.errors.length > 25 && !HB.G.recovering) { HB.G.recovering = true; HB.Screens && HB.Screens.recover(); }
  } catch (x) { /* nothing more to do */ }
};
