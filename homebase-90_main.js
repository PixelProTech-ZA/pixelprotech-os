'use strict';
/* HOMEBASE: Field Operations main: game loop, state, camera, rendering, vehicle enter/exit, autosave. */
HB.Game = (function () {
  const U = HB.u, G = HB.G, E = HB.E, W = HB.World, C = HB.Combat, T = 32, VW = HB.VW, VH = HB.VH;
  const Game = { cam: { x: 0, y: 0 }, saveClock: 0 };
  let canvas, ctx, last = 0, acc = 0, skip = false, slowFrames = 0, slowHinted = false, fpsAvg = 16, lastZone = '', curs = '';
  const STEP = 1 / 60;
  const CAR_COL = { bakkie: '#2a1566', buggy: '#05372f' };

  /* ---------- boot ---------- */
  Game.init = function () {
    HB.Save.load();
    canvas = document.getElementById('game'); ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    HB.UI.init(); HB.UI.applySettings();
    W.init(); W.ground = W.renderGround(); HB.UI.renderMiniBase();
    E.init(); C.reset(); C.initInput(); HB.Missions.setup();
    Game.snapCamera();
    window.addEventListener('error', (e) => HB.reportError(e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => HB.reportError(e.reason));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.mode === 'play') { Game.snapshot(); HB.Save.write(); } HB.Audio.engine(null); HB.Audio.stop(); } else if (G.mode !== 'boot' && HB.S.settings.music > 0 && HB.Audio.hasCtx) HB.Audio.music(C.heat ? 'race' : 'town'); });
    window.addEventListener('beforeunload', () => { if (G.mode === 'play') { Game.snapshot(); HB.Save.write(); } });
    G.mode = 'title';
    HB.Screens.title();
    if (!HB.Save.ok) HB.UI.toast('This browser will not let the game save progress.', 'warn');
    last = performance.now(); requestAnimationFrame(frame);
  };

  Game.startPlaying = function () {
    E.init(); C.reset(); HB.Missions.setup();
    HB.S.started = true; HB.Save.hasSave = true; G.mode = 'play'; G.paused = false; lastZone = '';
    HB.UI.showHud(true); HB.UI.applySettings(); HB.UI.refreshHud();
    HB.Audio.music('town'); Game.snapCamera(); HB.Input.clear();
    Game.saveClock = 0;
  };
  Game.wipeAndStart = function () {
    const adult = HB.S.adult; HB.Save.reset(); HB.S.adult = adult; HB.S.started = true;
    Game.startPlaying();
    HB.UI.cine('PIXELPROTECH SOLUTIONS', 'FIELD OPERATIONS', 'GAUTENG CORRIDOR · SANDTON TO PRETORIA', 3400);
    setTimeout(() => HB.Screens.controls(), 3200);
  };
  Game.toTitle = function () {
    Game.snapshot(); HB.Save.write();
    HB.UI.closeAll(); G.mode = 'title'; G.paused = false; HB.UI.showHud(false); HB.UI.setSpeed(null);
    HB.Save.load(); HB.Save.hasSave = !!HB.S.started; E.init(); C.reset(); HB.Missions.setup(); HB.Screens.title();
  };
  Game.reloadFromSave = function () { HB.UI.closeAll(); HB.Save.load(); Game.startPlaying(); };
  Game.snapshot = function () {
    const S = HB.S, p = E.player, pos = p.vehicle || p;
    S.pos = { x: pos.x, y: pos.y }; S.driving = p.vehicle ? p.vehicle.id : '';
    E.vehicles.forEach((v) => { S.cars[v.id] = { x: v.x, y: v.y, a: v.a }; });
  };
  Game.fade = function (fn) {
    const f = document.getElementById('fade'); G.fading = true; f.classList.add('on');
    setTimeout(() => { try { fn(); } catch (e) { HB.reportError(e); } f.classList.remove('on'); setTimeout(() => { G.fading = false; }, 220); }, 240);
  };
  Game.snapCamera = function () { const p = E.player.vehicle || E.player; Game.cam.x = U.clamp(p.x - VW / 2, 0, W.COLS * T - VW); Game.cam.y = U.clamp(p.y - VH / 2, 0, W.ROWS * T - VH); };

  /* ---------- vehicles ---------- */
  Game.enterVehicle = function (v) {
    const p = E.player; if (p.vehicle) return;
    p.vehicle = v; HB.S.driving = v.id; v.s = 0; HB.Audio.sfx('door');
    HB.UI.toast('Drive with W A S D · ' + HB.UI.keyName() + ' to get out · H horn');
  };
  Game.exitVehicle = function () {
    const p = E.player, v = p.vehicle; if (!v) return;
    const spot = E.exitSpot(v); p.x = spot.x; p.y = spot.y; p.vehicle = null; v.s = 0; HB.S.driving = ''; HB.Audio.sfx('door');
  };
  let th = 0; // throttle ramp: a light tap crawls, holding builds speed
  function driveControls(dt) {
    const I = HB.Input;
    /* Screen-direction driving: LEFT goes left, RIGHT goes right, UP goes up, DOWN goes down (diagonals combine). The car turns toward the pressed direction and drives that way. */
    const ax = I.axis(), car = E.player.vehicle, hb = I.held('handbrake');
    if (!car || (ax.x === 0 && ax.y === 0)) { th = 0; return { thr: 0, steer: 0, hb }; }
    th = Math.min(1, th + dt / 1.1);
    const diff = U.angDiff(car.a, Math.atan2(ax.y, ax.x));
    if (Math.abs(diff) > 2.0 && car.s > 50) return { thr: 0, steer: U.clamp(diff * 3, -1, 1), hb: true, dir: true }; // pointing the opposite way: brake, then swing round
    return { thr: Math.max(0.12, th), steer: U.clamp(diff * 3, -1, 1), hb, dir: true };
  }

  /* ---------- update ---------- */
  function update(dt) {
    G.time += dt;
    HB.UI.update();
    if (G.mode === 'title') { titleCam(dt); E.updateNPCs(dt); E.updateTraffic(dt); return; }
    if (G.mode !== 'play') { HB.Audio.engine(null); return; }
    if (G.fading) return;
    if (G.modal || G.paused) { HB.Audio.engine(null); return; }
    const p = E.player, S = HB.S, I = HB.Input;
    S.stats.playMs += dt * 1000;
    const wasDriving = !!p.vehicle;
    if (p.vehicle) {
      E.updateVehicle(p.vehicle, dt, driveControls(dt));
      p.x = p.vehicle.x; p.y = p.vehicle.y;
      if (I.hit('interact')) Game.exitVehicle();
      if (I.hit('honk')) HB.Audio.sfx('beep');
      if (p.vehicle) { HB.UI.setSpeed(Math.round(Math.abs(p.vehicle.s) * 0.22) + ' km/h'); HB.Audio.engine(Math.abs(p.vehicle.s) / E.SPECS[p.vehicle.type].max); } else HB.UI.setSpeed(null);
    } else { E.updatePlayer(dt); HB.UI.setSpeed(null); HB.Audio.engine(null); }
    E.vehicles.forEach((v) => { if (v !== p.vehicle) { v.s = 0; } });
    E.updateTraffic(dt); E.updateNPCs(dt); E.updateParts(dt);
    C.update(dt); HB.Missions.update(dt);
    // interaction
    const it = E.nearestInteract(p.x, p.y);
    if (p.vehicle) HB.UI.setPrompt('Get out');
    else if (it) { HB.UI.setPrompt(it.label()); if (I.hit('interact') && !G.modal && !wasDriving) { G.nearIt = it; try { it.use(); } catch (e) { HB.reportError(e); } } }
    else HB.UI.setPrompt(null);
    if (I.hit('map')) HB.Screens.map();
    // district banner
    const z = W.zoneAt(p.x, p.y); if (z !== lastZone) { lastZone = z; HB.UI.zone(z); }
    // music follows the heat
    const mood = C.heat > 0 ? 'race' : 'town'; if (mood !== G.mood) { G.mood = mood; if (HB.Audio.active) HB.Audio.music(mood); }
    // timers
    Game.saveClock += dt; if (Game.saveClock > 20) { Game.saveClock = 0; if (!C.dead) { Game.snapshot(); HB.Save.write(); } }
    G.uiClock = (G.uiClock || 0) + dt; if (G.uiClock > 0.1) { G.uiClock = 0; HB.UI.refreshHud(); }
    // camera, with a little pull toward the aim point on foot
    const tgt = p.vehicle || p; let ox = 0, oy = 0;
    if (p.vehicle) { ox = Math.cos(p.vehicle.a) * p.vehicle.s * 0.28; oy = Math.sin(p.vehicle.a) * p.vehicle.s * 0.28; }
    else if (C.mouse.on) { ox = (C.mouse.x - VW / 2) * 0.22; oy = (C.mouse.y - VH / 2) * 0.22; }
    const tx = U.clamp(tgt.x + ox - VW / 2, 0, W.COLS * T - VW), ty = U.clamp(tgt.y + oy - 20 - VH / 2 + 30, 0, W.ROWS * T - VH);
    const k = 1 - Math.exp(-7 * dt); Game.cam.x += (tx - Game.cam.x) * k; Game.cam.y += (ty - Game.cam.y) * k;
  }
  function titleCam() { const t = G.time * 0.05; Game.cam.x = U.clamp(900 + Math.sin(t) * 700, 0, W.COLS * T - VW); Game.cam.y = U.clamp(420 + Math.cos(t * 1.3) * 260, 0, W.ROWS * T - VH); }

  /* ---------- render ---------- */
  function nameTag(c, x, y, text) {
    c.font = 'bold 10px "Courier New", monospace'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#07070a'; c.strokeText(text, x, y); c.fillStyle = '#00d4aa'; c.fillText(text, x, y); c.textAlign = 'left';
  }
  function render() {
    const cx = Math.round(Game.cam.x + (E.shake ? U.rnd(-E.shake, E.shake) : 0)), cy = Math.round(Game.cam.y + (E.shake ? U.rnd(-E.shake, E.shake) : 0));
    const c = ctx, low = HB.S.settings.lowPower, t = G.time, pp = E.player, ppos = pp.vehicle || pp;
    c.drawImage(W.ground, cx, cy, VW, VH, 0, 0, VW, VH);
    c.save(); c.translate(-cx, -cy);
    if (!low) { c.fillStyle = 'rgba(0,212,170,.16)'; for (let i = 0; i < 9; i++) { const x = 12 * T + 8 + ((i * 53 + t * 18) % (5 * T - 24)), y = 22 * T + 10 + ((i * 37) % (5 * T - 20)); c.fillRect(x, y, 10, 2); } }
    if (HB.Aura) HB.Aura.ground(c, t);
    if (G.mode === 'play') HB.Missions.draw(c, t);
    const list = [], vx0 = cx - 80, vx1 = cx + VW + 80, vy0 = cy - 40, vy1 = cy + VH + 140;
    const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    W.props.forEach((p) => { if (vis(p.x, p.y)) list.push({ y: p.y, k: 'prop', o: p }); });
    E.npcs.forEach((n) => { if (vis(n.x, n.y)) list.push({ y: n.y, k: 'npc', o: n }); });
    E.vehicles.forEach((v) => { if (vis(v.x, v.y)) list.push({ y: v.y + 4, k: 'veh', o: v }); });
    E.chasers.forEach((v) => { if (vis(v.x, v.y)) list.push({ y: v.y + 4, k: 'chaser', o: v }); });
    if (!E.trafficHidden) E.traffic.forEach((v) => { if (vis(v.x, v.y)) list.push({ y: v.y + 4, k: 'traf', o: v }); });
    E.foes.forEach((f) => { if (vis(f.x, f.y)) list.push({ y: f.y, k: 'foe', o: f }); });
    E.picks.forEach((k) => { if (vis(k.x, k.y)) list.push({ y: k.y - 2, k: 'pick', o: k }); });
    if (G.mode === 'play' && !pp.vehicle) list.push({ y: pp.y, k: 'player', o: pp });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      const o = it.o;
      if (HB.Aura && it.k !== 'pick') HB.Aura.shadow(c, it.k, o);
      switch (it.k) {
        case 'prop': { const s = HB.Gfx.prop(o.k, o.v); c.drawImage(s, Math.round(o.x - 40), Math.round(o.y - 80 + 4)); break; }
        case 'npc': {
          const s = HB.Gfx.charSprite(o.look, o.dir, o.frame); const by = o.bob || 0;
          c.drawImage(s, Math.round(o.x - 16), Math.round(o.y - 55 + by));
          if (Math.hypot(ppos.x - o.x, ppos.y - o.y) < 150 && G.mode === 'play') nameTag(c, o.x, o.y - 62, o.name.toUpperCase());
          if (G.mode === 'play' && HB.Missions.markerFor(o.id)) { const b = Math.sin(t * 5) * 3; c.fillStyle = '#07070a'; c.fillRect(o.x - 4, o.y - 90 + b - 1, 8, 18); c.fillStyle = '#d8b96a'; c.fillRect(o.x - 3, o.y - 89 + b, 6, 12); c.fillRect(o.x - 3, o.y - 74 + b, 6, 3); }
          break;
        }
        case 'veh': {
          const s = HB.Gfx.vehicleSprite(o.type, CAR_COL[o.type] || '#1c1c26', 'wheel_basic', 'cacc_none', t);
          c.save(); c.translate(Math.round(o.x), Math.round(o.y)); c.rotate(o.a); c.drawImage(s, -32, -20); c.restore(); break;
        }
        case 'chaser': C.drawChaser(c, o, t); break;
        case 'traf': { const s = HB.Gfx.trafficSprite(o.kind, o.col); c.save(); c.translate(Math.round(o.x), Math.round(o.y)); c.rotate(o.a); c.drawImage(s, -40, -20); c.restore(); break; }
        case 'foe': C.drawFoe(c, o, t); break;
        case 'pick': C.drawPick(c, o, t); break;
        case 'player': {
          const s = HB.Gfx.charSprite(HB.Gfx.playerLook(), o.dir, o.frame);
          if (C.invuln > 0 && Math.floor(t * 14) % 2) c.globalAlpha = 0.5;
          c.drawImage(s, Math.round(o.x - 16), Math.round(o.y - 55)); c.globalAlpha = 1; C.drawPlayerGun(c, o); break;
        }
        default: break;
      }
    }
    C.drawBullets(c);
    E.parts.forEach((q) => { c.globalAlpha = U.clamp(q.life * 1.6, 0, 1); c.fillStyle = q.col; c.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }); c.globalAlpha = 1;
    if (G.mode === 'play' && !G.modal && !pp.vehicle) { const it = E.nearestInteract(pp.x, pp.y); if (it) { const ix = typeof it.x === 'function' ? it.x() : it.x, iy = typeof it.y === 'function' ? it.y() : it.y; const b = Math.sin(t * 6) * 3; c.fillStyle = '#07070a'; c.beginPath(); c.moveTo(ix - 8, iy - 46 + b); c.lineTo(ix + 8, iy - 46 + b); c.lineTo(ix, iy - 34 + b); c.fill(); c.fillStyle = '#00d4aa'; c.beginPath(); c.moveTo(ix - 6, iy - 45 + b); c.lineTo(ix + 6, iy - 45 + b); c.lineTo(ix, iy - 36 + b); c.fill(); } }
    c.restore();
    if (HB.Aura) HB.Aura.post(c, cx, cy, t);
    if (G.mode === 'play') { drawPointer(c, cx, cy); C.drawHud(c, t); HB.UI.drawMini(HB.Missions.target()); }
    if (G.mode === 'title') { c.fillStyle = 'rgba(7,7,10,.45)'; c.fillRect(0, 0, VW, VH); }
    const want = (G.mode === 'play' && !G.modal && !pp.vehicle && C.mouse.on) ? 'none' : '';
    if (want !== curs) { curs = want; canvas.style.cursor = want; }
  }
  function drawPointer(c, cx, cy) {
    const tg = HB.Missions.target();
    if (!tg || G.modal) return;
    const sx = tg.x - cx, sy = tg.y - cy, m = 36;
    const on = sx > m && sx < VW - m && sy > m && sy < VH - m;
    if (on) { const b = Math.sin(G.time * 5) * 4; c.fillStyle = '#07070a'; c.beginPath(); c.moveTo(sx - 9, sy - 62 + b); c.lineTo(sx + 9, sy - 62 + b); c.lineTo(sx, sy - 48 + b); c.fill(); c.fillStyle = '#00d4aa'; c.beginPath(); c.moveTo(sx - 7, sy - 61 + b); c.lineTo(sx + 7, sy - 61 + b); c.lineTo(sx, sy - 51 + b); c.fill(); return; }
    const pp = E.player.vehicle || E.player, ang = Math.atan2(tg.y - pp.y, tg.x - pp.x);
    const ex = U.clamp(VW / 2 + Math.cos(ang) * 400, m, VW - m), ey = U.clamp(VH / 2 + Math.sin(ang) * 220, m + 36, VH - m);
    c.save(); c.translate(ex, ey); c.rotate(ang); c.fillStyle = '#07070a'; c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -13); c.lineTo(-10, 13); c.fill(); c.fillStyle = '#00d4aa'; c.beginPath(); c.moveTo(12, 0); c.lineTo(-7, -9); c.lineTo(-7, 9); c.fill(); c.restore();
  }

  /* ---------- frame ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.25) dt = 0.25;
    if (HB.S && HB.S.settings.lowPower) { skip = !skip; if (skip) { acc += dt; return; } }
    fpsAvg = fpsAvg * 0.95 + dt * 1000 * 0.05;
    if (!HB.S.settings.lowPower && fpsAvg > 26 && G.mode === 'play') { slowFrames++; if (slowFrames > 240 && !slowHinted) { slowHinted = true; HB.UI.toast('Running slowly? Try Low-power mode in Settings.', 'warn'); } } else slowFrames = Math.max(0, slowFrames - 1);
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      try { update(STEP); } catch (e) { HB.reportError(e); }
      HB.Input.endFrame(); acc -= STEP; n++;
    }
    if (n === 5) acc = 0;
    try { render(); } catch (e) { HB.reportError(e); }
  }

  return Game;
})();

window.addEventListener('DOMContentLoaded', () => { try { HB.Game.init(); } catch (e) { console.error(e); const d = document.getElementById('fatal'); if (d) { d.style.display = 'block'; d.textContent = 'HOMEBASE could not start in this browser. Try reloading the page.'; } } });
