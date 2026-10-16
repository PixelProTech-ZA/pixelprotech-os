'use strict';
/* HOMEBASE entities: player, vehicles + physics, ambient traffic, NPC/animal data, particles, interactables. */
HB.E = (function () {
  const T = 32, U = HB.u;
  const E = {
    player: { x: 0, y: 0, dir: 'down', frame: 0, anim: 0, moving: false, vehicle: null, hidden: false, stepT: 0 },
    vehicles: [], traffic: [], npcs: [], animals: [], bots: [], stickers: [], interact: [], parts: [], clues: [], cones: [],
    trafficOn: true, shake: 0,
  };

  const SPECS = {
    bakkie: { max: 285, acc: 330, brake: 620, drag: 150, turn: 2.7, rad: 10, off: 14, name: 'Field Bakkie' },
    buggy: { max: 340, acc: 440, brake: 640, drag: 130, turn: 3.1, rad: 10, off: 12, name: 'Night Runner' },
    patrol: { max: 300, acc: 380, brake: 640, drag: 130, turn: 2.9, rad: 10, off: 13, name: 'Patrol' },
  };
  E.SPECS = SPECS;

  /* ------------ NPC and animal data ------------ */
  const NPCS = [
    { id: 'nandi', name: 'Nandi, Dispatch', tx: 5, ty: 14, look: { skin: 3, hair: '#07070a', hairStyle: 'braids', shirt: '#16161d', stripe: '#00d4aa', hat: 'hat_antenna', hatCol: '#00d4aa', pants: '#0d0d10' } },
    { id: 'sizwe', name: 'Sizwe, Armoury', tx: 13, ty: 14, look: { skin: 4, hair: '#07070a', hairStyle: 'bald', stache: '#2a2a38', shirt: '#1c1c26', vest: '#433d56', glasses: '#d8b96a', pants: '#101015' } },
    { id: 'venter', name: 'Mr Venter, Client', tx: 17, ty: 43, look: { skin: 0, hair: '#d8d8d8', hairStyle: 'short', glasses: '#d8b96a', shirt: '#f1eefa', stripe: '#7b2fff', pants: '#07070a' } },
    { id: 'kofi', name: 'Kofi', tx: 53, ty: 14, look: { skin: 5, hair: '#07070a', hairStyle: 'puff', shirt: '#05372f', apron: true, pants: '#101015' } },
  ];
  E.chasers = []; E.foes = []; E.picks = [];

  E.init = function () {
    const W = HB.World, S = HB.S;
    E.npcs = NPCS.map((n) => {
      const p = W.nearestFree(n.tx, n.ty);
      return { id: n.id, name: n.name, x: p.x, y: p.y + 10, look: n.look, dir: 'down', frame: 0, t: Math.random() * 5, home: { x: p.x, y: p.y + 10 } };
    });
    E.vehicles = ['bakkie', 'buggy'].map((id) => { const c = S.cars[id]; return { id, type: id, x: c.x, y: c.y, a: c.a, s: 0, owner: false }; });
    E.stickers = []; E.animals = []; E.bots = []; E.clues = []; E.cones = [];
    E.chasers = []; E.foes = []; E.picks = [];
    E.makeTraffic();
    const p = E.player;
    p.x = S.pos.x; p.y = S.pos.y; p.vehicle = null;
    if (S.driving) { const v = E.vehicles.find((q) => q.id === S.driving); if (v) { p.vehicle = v; v.x = S.pos.x; v.y = S.pos.y; } }
  };

  E.makeTraffic = function () {
    const lanes = [
      { x0: 0, y0: 14.5, dx: 1, dy: 0, len: 46 * T }, { x0: 0, y0: 16.5, dx: -1, dy: 0, len: 46 * T },
      { x0: 0, y0: 32.5, dx: 1, dy: 0, len: 46 * T }, { x0: 0, y0: 34.5, dx: -1, dy: 0, len: 46 * T },
      { x0: 20.5, y0: 0, dx: 0, dy: 1, len: 48 * T }, { x0: 22.5, y0: 0, dx: 0, dy: -1, len: 48 * T },
      { x0: 42.5, y0: 0, dx: 0, dy: 1, len: 48 * T }, { x0: 44.5, y0: 0, dx: 0, dy: -1, len: 48 * T },
    ];
    const cols = ['#2a2838', '#433d56', '#1c1c26', '#05372f', '#2a1566', '#3a3320'];
    const kinds = ['car', 'bus', 'van', 'car'];
    E.traffic = [];
    lanes.forEach((ln, li) => {
      for (let k = 0; k < 2; k++) {
        const pos = ((li * 311 + k * 0.5 * ln.len + 200) % ln.len);
        const horiz = ln.dx !== 0;
        const x = horiz ? (ln.dx > 0 ? pos : ln.len - pos) : ln.x0 * T, y = horiz ? ln.y0 * T : (ln.dy > 0 ? pos : ln.len - pos);
        E.traffic.push({ x, y, a: Math.atan2(ln.dy, ln.dx), s: 0, cruise: U.rnd(70, 105), lane: ln, kind: kinds[(li + k) % 4], col: cols[(li * 2 + k) % 6], wait: 0, honk: 0 });
      }
    });
  };

  /* ------------ collision helpers ------------ */
  function circlesOf(v) {
    const sp = SPECS[v.type] || { off: 15, rad: 10 };
    const c = Math.cos(v.a), s = Math.sin(v.a), o = sp.off;
    return [[v.x - c * o, v.y - s * o, sp.rad], [v.x, v.y, sp.rad], [v.x + c * o, v.y + s * o, sp.rad]];
  }
  E.circlesOf = circlesOf;
  function trafficCircles(t) { const c = Math.cos(t.a), s = Math.sin(t.a), o = t.kind === 'bus' ? 17 : 13, r = t.kind === 'bus' ? 11 : 10; return [[t.x - c * o, t.y - s * o, r], [t.x, t.y, r], [t.x + c * o, t.y + s * o, r]]; }

  function movers(except) {
    const out = [];
    E.vehicles.forEach((v) => { if (v !== except) out.push(...circlesOf(v)); });
    E.traffic.forEach((t) => { if (t !== except) out.push(...trafficCircles(t)); });
    (E.chasers || []).forEach((v) => { if (v !== except) out.push(...circlesOf(v)); });
    return out;
  }
  function npcCircles() { const o = []; E.npcs.forEach((n) => o.push([n.x, n.y - 4, 9])); E.animals.forEach((n) => o.push([n.x, n.y - 4, 10])); return o; }
  E.dynBlocked = function (cs, from, others) {
    // blocked if a circle overlaps AND the move brings it closer than before
    for (const c of cs) for (const o of others) {
      const d = Math.hypot(c[0] - o[0], c[1] - o[1]), lim = c[2] + o[2];
      if (d < lim) {
        const f = from ? Math.hypot(c[0] - from.dx - o[0], c[1] - from.dy - o[1]) : 99;
        if (d < f - 0.01 || f >= lim) return true;
      }
    }
    return false;
  };

  /* ------------ player on foot ------------ */
  E.updatePlayer = function (dt) {
    const p = E.player, ax = HB.Input.axis();
    let mx = ax.x, my = ax.y;
    p.moving = !!(mx || my);
    if (p.moving) {
      const l = Math.hypot(mx, my); mx /= l; my /= l;
      const sp = HB.Input.held('run') ? 165 : 108;
      const others = movers(null).concat(npcCircles());
      const tryMove = (nx, ny) => {
        if (HB.World.rectSolid(nx, ny - 2, 6, 5)) return false;
        const cs = [[nx, ny - 3, 7]];
        return !E.dynBlocked(cs, { dx: nx - p.x, dy: ny - p.y }, others);
      };
      const nx = p.x + mx * sp * dt, ny = p.y + my * sp * dt;
      if (tryMove(nx, p.y)) p.x = nx;
      if (tryMove(p.x, ny)) p.y = ny;
      if (Math.abs(mx) > Math.abs(my)) p.dir = mx > 0 ? 'right' : 'left'; else p.dir = my > 0 ? 'down' : 'up';
      p.anim += dt * (sp > 120 ? 11 : 8);
      p.frame = Math.floor(p.anim) % 4;
      p.stepT -= dt; if (p.stepT <= 0) { p.stepT = sp > 120 ? 0.2 : 0.3; HB.Audio.sfx('step'); }
    } else { p.frame = 0; p.anim = 0; }
    // unstick from moving things that overlapped the player
    p.x = U.clamp(p.x, 8, HB.World.COLS * T - 8); p.y = U.clamp(p.y, 8, HB.World.ROWS * T - 8);
  };

  /* ------------ vehicles ------------ */
  E.updateVehicle = function (v, dt, ctl) {
    const sp = SPECS[v.type], W = HB.World;
    const tt = W.tileAt(v.x, v.y);
    const onRoad = tt === W.ROAD || tt === W.WALK || tt === W.COURT;
    const surf = onRoad ? 1 : (v.type === 'buggy' ? 0.85 : 0.58);
    const maxF = (v.boost ? 1.12 : 1) * sp.max * surf * (ctl.dir && ctl.thr > 0 ? 0.28 + 0.72 * ctl.thr : 1);
    if (ctl.thr > 0) { v.s += sp.acc * (ctl.dir ? 0.6 * ctl.thr : 1) * dt * (v.s < 0 ? 2.2 : 1) * (onRoad ? 1 : 0.8); }
    else if (ctl.thr < 0) { if (v.s > 5) v.s -= sp.brake * dt; else v.s -= sp.acc * 0.55 * dt; }
    else { const d = Math.min(Math.abs(v.s), (sp.drag + (onRoad ? 0 : 160)) * dt); v.s -= Math.sign(v.s) * d; }
    if (ctl.hb) { const d = Math.min(Math.abs(v.s), 700 * dt); v.s -= Math.sign(v.s) * d; }
    if (v.s > maxF) v.s = Math.max(maxF, v.s - 420 * dt);
    v.s = U.clamp(v.s, -sp.max * 0.4, sp.max * 1.15);
    const grip = ctl.dir ? Math.max(0.6, U.clamp(Math.abs(v.s) / 90, 0, 1)) : U.clamp(Math.abs(v.s) / 90, 0, 1);
    const turn = sp.turn * grip * (v.s >= 0 || ctl.dir ? 1 : -1) * ctl.steer * (ctl.hb ? 1.5 : 1) * dt;
    const na = v.a + turn;
    const others = movers(v).concat(npcCircles());
    const blockedAt = (x, y, a, from) => {
      const w = { x, y, a, type: v.type };
      const cs = circlesOf(w);
      for (const c of cs) if (W.circleSolid(c[0], c[1], c[2])) return true;
      return E.dynBlocked(cs, from, others);
    };
    if (turn !== 0 && !blockedAt(v.x, v.y, na, null)) v.a = na;
    const dx = Math.cos(v.a) * v.s * dt, dy = Math.sin(v.a) * v.s * dt;
    let hit = false;
    if (!blockedAt(v.x + dx, v.y, v.a, { dx, dy: 0 })) v.x += dx; else hit = true;
    if (!blockedAt(v.x, v.y + dy, v.a, { dx: 0, dy })) v.y += dy; else hit = true;
    if (hit) {
      if (Math.abs(v.s) > 70 && (v.bumpCd || 0) <= 0) { HB.Audio.sfx('bump'); E.shake = Math.min(7, Math.abs(v.s) / 45); v.bumpCd = 0.35; spawnParts(v.x, v.y, 6, '#ddd', 60); }
      v.s *= -0.22;
      v.hitT = (v.hitT || 0) + dt;
    } else v.hitT = 0;
    v.bumpCd = Math.max(0, (v.bumpCd || 0) - dt);
    // dust + skid smoke
    if (Math.abs(v.s) > 60 && (!onRoad || ctl.hb) && !HB.S.settings.lowPower) { if (Math.random() < 0.5) spawnParts(v.x - Math.cos(v.a) * 18, v.y - Math.sin(v.a) * 18, 1, onRoad ? '#ccc' : '#d9b97c', 22); }
    v.x = U.clamp(v.x, 20, HB.World.COLS * T - 20); v.y = U.clamp(v.y, 20, HB.World.ROWS * T - 20);
  };

  E.exitSpot = function (v) {
    const W = HB.World;
    const side = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
    for (let r = 26; r < 80; r += 10) for (const s of side) {
      const a = v.a + s, x = v.x + Math.cos(a) * r, y = v.y + Math.sin(a) * r;
      if (!W.rectSolid(x, y - 2, 6, 5) && !W.circleSolid(x, y, 8) && !E.dynBlocked([[x, y - 3, 7]], null, movers(v).concat(npcCircles()))) return { x, y };
    }
    return { x: v.x, y: v.y };
  };

  /* ------------ traffic ------------ */
  E.updateTraffic = function (dt) {
    if (!E.trafficOn) return;
    const p = E.player, car = p.vehicle;
    const others = [];
    E.vehicles.forEach((v) => others.push(...circlesOf(v)));
    others.push([p.x, p.y - 3, 8]);
    E.npcs.forEach((n) => others.push([n.x, n.y - 4, 9]));
    E.traffic.forEach((t) => {
      const ln = t.lane, horiz = ln.dx !== 0;
      const ahead = [[t.x + Math.cos(t.a) * 34, t.y + Math.sin(t.a) * 34], [t.x + Math.cos(t.a) * 58, t.y + Math.sin(t.a) * 58]];
      let blocked = false;
      for (const a of ahead) {
        for (const o of others) if (Math.hypot(a[0] - o[0], a[1] - o[1]) < o[2] + 9) blocked = true;
        for (const q of E.traffic) if (q !== t && q.lane === t.lane) { const d = Math.hypot(a[0] - q.x, a[1] - q.y); if (d < 26) blocked = true; }
      }
      if (blocked) { t.s = Math.max(0, t.s - 420 * dt); t.wait += dt; if (t.wait > 0.8 && t.honk <= 0) { t.honk = 4; if (Math.hypot(t.x - p.x, t.y - p.y) < 300) HB.Audio.sfx('beep'); } } else { t.s = Math.min(t.cruise, t.s + 120 * dt); t.wait = 0; }
      t.honk -= dt;
      t.x += Math.cos(t.a) * t.s * dt; t.y += Math.sin(t.a) * t.s * dt;
      if (horiz) { if (t.x > ln.len + 40) t.x = -40; if (t.x < -40) t.x = ln.len + 40; t.y = ln.y0 * T; }
      else { if (t.y > ln.len + 40) t.y = -40; if (t.y < -40) t.y = ln.len + 40; t.x = ln.x0 * T; }
    });
  };

  /* ------------ NPCs, animals, bots ------------ */
  E.updateNPCs = function (dt) {
    const p = E.player, pos = p.vehicle || p;
    E.npcs.forEach((n) => {
      n.t += dt;
      const d = Math.hypot(pos.x - n.x, pos.y - n.y);
      if (d < 110) { const dx = pos.x - n.x, dy = pos.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) * 1.4 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); n.frame = 0; }
      else { n.dir = ['down', 'left', 'down', 'right'][Math.floor(n.t / 3.5) % 4]; n.frame = 0; }
      n.bob = Math.sin(n.t * 2.2 + n.x) > 0.9 ? -1 : 0;
    });
    E.animals.forEach((a) => {
      a.t -= dt;
      if (a.t <= 0) { a.t = U.rnd(1.2, 3.5); if (Math.random() < 0.4) { a.vx = a.vy = 0; } else { const ang = Math.random() * 6.28; a.vx = Math.cos(ang) * 30; a.vy = Math.sin(ang) * 30; } }
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      const ok = (x, y) => !HB.World.rectSolid(x, y - 3, 8, 5) && Math.hypot(x - a.home.x, y - a.home.y) < a.range && Math.hypot(x - E.player.x, y - E.player.y) > 16 && HB.World.tileAt(x, y) !== HB.World.ROAD;
      if (ok(nx, a.y)) a.x = nx; else a.vx = -a.vx;
      if (ok(a.x, ny)) a.y = ny; else a.vy = -a.vy;
      if (a.vx || a.vy) { a.dir = a.vx > 0 ? 'right' : 'left'; a.anim = (a.anim || 0) + dt * 6; a.frame = Math.floor(a.anim) % 2; } else a.frame = 0;
    });
    E.bots.forEach((b) => {
      b.t += dt;
      const pos2 = p.vehicle || p, dx = b.x - pos2.x, dy = b.y - pos2.y, d = Math.hypot(dx, dy);
      let vx = Math.cos(b.ang) * 38, vy = Math.sin(b.ang) * 38;
      if (d < 120) { vx = (dx / (d || 1)) * 80; vy = (dy / (d || 1)) * 80; }
      b.turn -= dt; if (b.turn <= 0) { b.turn = U.rnd(0.8, 2); b.ang += U.rnd(-1.4, 1.4); }
      const nx = b.x + vx * dt, ny = b.y + vy * dt, W = HB.World;
      const ok = (x, y) => !W.rectSolid(x, y - 2, 7, 5) && x > b.box[0] && x < b.box[2] && y > b.box[1] && y < b.box[3];
      if (ok(nx, b.y)) b.x = nx; else { b.ang = Math.PI - b.ang + U.rnd(-0.4, 0.4); }
      if (ok(b.x, ny)) b.y = ny; else { b.ang = -b.ang + U.rnd(-0.4, 0.4); }
      // cornered? nudge away from walls so they can always be caught
      if (d < 120 && (!ok(b.x + vx * 0.2, b.y) || !ok(b.x, b.y + vy * 0.2))) { b.ang += 2.2; b.x += Math.cos(b.ang) * 40 * dt; b.y += Math.sin(b.ang) * 40 * dt; if (W.rectSolid(b.x, b.y - 2, 7, 5)) { b.x = nx - vx * dt; b.y = ny - vy * dt; } }
    });
  };

  /* ------------ particles ------------ */
  function spawnParts(x, y, n, col, speed) {
    if (HB.S.settings.lowPower || HB.S.settings.reduceMotion) return;
    for (let i = 0; i < n && E.parts.length < 140; i++) {
      const a = Math.random() * 6.28, sp = Math.random() * (speed || 40);
      E.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, life: 0.5 + Math.random() * 0.5, max: 1, size: 2 + Math.random() * 3, col });
    }
  }
  E.spawnParts = spawnParts;
  E.updateParts = function (dt) {
    for (let i = E.parts.length - 1; i >= 0; i--) { const p = E.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; if (p.life <= 0) E.parts.splice(i, 1); }
    E.shake = Math.max(0, E.shake - dt * 14);
  };

  /* ------------ interactables ------------ */
  E.addInteract = function (o) { E.interact.push(o); return o; };
  E.nearestInteract = function (x, y) {
    let best = null, bd = 1e9;
    for (const it of E.interact) {
      if (it.hidden && it.hidden()) continue;
      const ix = typeof it.x === 'function' ? it.x() : it.x, iy = typeof it.y === 'function' ? it.y() : it.y;
      const d = Math.hypot(ix - x, iy - y);
      if (d < (it.r || 34) && d < bd) { bd = d; best = it; }
    }
    return best;
  };
  E.near = function (x, y, r) { return Math.hypot(E.player.x - x, E.player.y - y) < r; };

  return E;
})();
