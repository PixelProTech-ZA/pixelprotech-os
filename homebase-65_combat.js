'use strict';
/* HOMEBASE: Field Operations. Combat: weapons, bullets, foes, patrol cars, heat, pickups, player damage.
   Stylised and non-graphic: hits throw sparks, defeated foes "de-rez" into brand-coloured shards. Civilians are never targeted. */
HB.Combat = (function () {
  const U = HB.u, G = HB.G, E = HB.E, W = HB.World, T = 32;
  const C = { bullets: [], listeners: [], boss: null, heat: 0, heatMin: 0, heatT: 0, heatCd: 0, spawnT: 0, hurt: 0, invuln: 0, dead: false, fireCd: 0, reloadT: 0, flash: 0, aim: 0, spread: 0, hurtSnd: 0, carHitCd: 0, mouse: { x: 480, y: 270, on: false, down: false } };

  /* ---------- weapons ---------- */
  const WEAP = [
    { id: 'px9', name: 'PX-9 SIDEARM', dmg: 18, rate: 0.26, mag: 12, spread: 0.025, pellets: 1, spd: 680, range: 540, reload: 0.9, price: 0, ammoPer: 0, ammoCost: 0, auto: false, snd: 'shot' },
    { id: 'vx30', name: 'VX-30 SMG', dmg: 9, rate: 0.075, mag: 30, spread: 0.075, pellets: 1, spd: 720, range: 470, reload: 1.3, price: 900, ammoPer: 60, ammoCost: 120, auto: true, snd: 'smg' },
    { id: 'br12', name: 'BREACH-12', dmg: 11, rate: 0.72, mag: 6, spread: 0.2, pellets: 7, spd: 620, range: 300, reload: 1.7, price: 1400, ammoPer: 18, ammoCost: 150, auto: false, snd: 'boom' },
    { id: 'ln7', name: 'LINE-7 CARBINE', dmg: 25, rate: 0.13, mag: 20, spread: 0.02, pellets: 1, spd: 840, range: 720, reload: 1.4, price: 2200, ammoPer: 60, ammoCost: 200, auto: true, snd: 'rifle' },
  ];
  C.WEAP = WEAP;

  /* ---------- foe types ---------- */
  const LOOKS = {
    thug: (v) => ({ skin: 1 + (v % 4), hair: '#07070a', hairStyle: v % 2 ? 'short' : 'bald', shirt: '#8a7640', stripe: '#d8b96a', pants: '#16161d', hat: v % 3 === 0 ? 'hat_cap' : undefined, hatCol: '#3a3320' }),
    heavy: (v) => ({ skin: 2 + (v % 3), hair: '#07070a', hairStyle: 'bald', stache: '#2a2a38', shirt: '#8a7640', vest: '#433d56', hat: 'hat_helmet', hatCol: '#2a2838', pants: '#101015' }),
    cop: (v) => ({ skin: 1 + (v % 5), hair: '#07070a', hairStyle: 'short', shirt: '#2a1566', stripe: '#00d4aa', pants: '#0d0d12', hat: 'hat_cap', hatCol: '#1c1c26' }),
    swat: (v) => ({ skin: 2 + (v % 3), hair: '#07070a', hairStyle: 'bald', shirt: '#16161d', vest: '#2a2838', hat: 'hat_helmet', hatCol: '#101015', glasses: '#7b2fff', pants: '#0d0d12' }),
    boss: () => ({ skin: 0, hair: '#d8d8d8', hairStyle: 'short', shirt: '#f1eefa', vest: '#8a7640', stripe: '#d8b96a', glasses: '#d8b96a', pants: '#07070a' }),
  };
  const FT = {
    thug: { hp: 45, spd: 66, dmg: 7, volley: 1, gap: 0.2, pause: 1.1, range: 400, pref: 170, spread: 0.09, cash: [30, 80], col: '#d8b96a', bs: 330 },
    heavy: { hp: 140, spd: 50, dmg: 6, volley: 4, gap: 0.14, pause: 1.3, range: 380, pref: 210, spread: 0.12, cash: [70, 140], col: '#d8b96a', bs: 340 },
    cop: { hp: 55, spd: 76, dmg: 7, volley: 2, gap: 0.22, pause: 1.0, range: 400, pref: 190, spread: 0.08, cash: [10, 30], col: '#7b2fff', bs: 340, cop: true },
    swat: { hp: 150, spd: 64, dmg: 8, volley: 3, gap: 0.12, pause: 1.0, range: 430, pref: 200, spread: 0.07, cash: [20, 50], col: '#00d4aa', bs: 360, cop: true },
    boss: { hp: 720, spd: 58, dmg: 9, volley: 5, gap: 0.12, pause: 1.4, range: 460, pref: 230, spread: 0.06, cash: [600, 600], col: '#f1eefa', bs: 350 },
  };
  C.FT = FT;

  /* ---------- geometry helpers ---------- */
  function los(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(d / 12));
    for (let i = 1; i < n; i++) { const k = i / n; if (W.circleSolid(ax + (bx - ax) * k, ay + (by - ay) * k, 1)) return false; }
    return true;
  }
  C.los = los;
  const pos = () => E.player.vehicle || E.player;
  const walkable = (x, y) => !W.rectSolid(x, y - 2, 6, 5);
  const VWd = HB.VW, VHd = HB.VH;

  /* ---------- state ---------- */
  C.reset = function () {
    C.bullets = []; C.boss = null; C.heat = 0; C.heatMin = 0; C.heatT = 0; C.heatCd = 0; C.spawnT = 0; C.hurt = 0; C.invuln = 1; C.dead = false;
    C.fireCd = 0; C.reloadT = 0; C.flash = 0; C.spread = 0; E.foes = []; E.chasers = []; E.picks = [];
    const w = HB.S.weap; w.cur = U.clamp(w.cur | 0, 0, 3); if (!w.owned[w.cur]) w.cur = 0;
    HB.S.hp = Math.max(1, HB.S.hp || HB.S.maxhp);
  };
  C.cur = () => WEAP[HB.S.weap.cur];
  C.ammoText = function () {
    const S = HB.S, w = S.weap, i = w.cur;
    if (C.reloadT > 0) return 'RELOADING';
    return w.mag[i] + ' / ' + (i === 0 ? '∞' : w.ammo[i]);
  };

  /* ---------- foes ---------- */
  C.spawn = function (type, x, y, o) {
    o = o || {};
    if (E.foes.length >= 22) return null;
    const t = FT[type]; if (!t) return null;
    let px = x, py = y;
    if (!walkable(px, py)) { const f = W.nearestFree(Math.floor(x / T), Math.floor(y / T)); px = f.x; py = f.y; }
    const v = Math.floor(Math.random() * 6);
    const f = { type, t, x: px, y: py, hp: t.hp * (o.hpMul || 1), max: t.hp * (o.hpMul || 1), look: LOOKS[type](v), dir: 'down', frame: 0, anim: 0, alert: !!o.aggro || !!t.cop, aggro: !!o.aggro, react: U.rnd(0.3, 0.7), cd: U.rnd(0.4, 1.0), vol: 0, strafe: 1, strafeT: 1, los: false, flash: 0, fireFlash: 0, ang: Math.PI / 2, tag: o.tag || '', name: o.name || '', stuck: 0, stand: 0, cop: !!t.cop, v };
    E.foes.push(f);
    if (o.boss) { f.boss = true; C.boss = f; }
    return f;
  };
  C.count = (tag) => E.foes.filter((f) => !f.stand && (tag === undefined || f.tag === tag)).length;
  C.clear = function (tag) { E.foes = E.foes.filter((f) => (tag !== undefined && f.tag !== tag)); if (tag === undefined) C.boss = null; };
  C.clearCops = function () { E.foes.forEach((f) => { if (f.cop) f.stand = 5; }); E.chasers.forEach((c) => { c.stand = 5; }); };

  function derez(x, y, col) {
    E.spawnParts(x, y - 20, 12, col, 70); E.spawnParts(x, y - 20, 8, '#f1eefa', 50); HB.Audio.sfx('derez');
  }
  function drop(f) {
    const t = f.t, x = f.x, y = f.y, r = Math.random();
    const add = (type, val, dx) => E.picks.push({ x: x + (dx || 0), y: y + 4, type, val, life: 24, t: Math.random() * 6 });
    if (f.boss) { add('cash', t.cash[0], -10); add('armor', 100, 10); return; }
    if (r < 0.62) add('cash', U.ri(t.cash[0], t.cash[1]), 0);
    else if (r < 0.74) add('med', 30, 0);
    else if (r < 0.82) add('armor', 25, 0);
    else if (r < 0.95) { const own = [1, 2, 3].filter((i) => HB.S.weap.owned[i]); if (own.length) { const i = U.pick(own); add('ammo', Math.ceil(WEAP[i].ammoPer / 2), 0); E.picks[E.picks.length - 1].w = i; } else add('cash', U.ri(t.cash[0], t.cash[1]), 0); }
  }
  C.killFoe = function (f, byPlayer) {
    const i = E.foes.indexOf(f); if (i < 0) return;
    E.foes.splice(i, 1);
    derez(f.x, f.y, f.t.col);
    if (byPlayer && !f.stand) { HB.S.kills++; drop(f); if (f.cop) C.addHeat(1, true); }
    if (f === C.boss) C.boss = null;
    C.listeners.forEach((fn) => { try { fn(f); } catch (e) { HB.reportError(e); } });
  };

  /* ---------- heat ---------- */
  C.addHeat = function (n, force) {
    if (!force && C.heatCd > 0) return;
    C.heatCd = 4; const old = C.heat; C.heat = Math.min(5, Math.max(C.heat, old) + (force ? n : n)); C.heatT = 0;
    if (C.heat > old) { HB.UI.toast('HEAT ' + C.heat + ' · POLICE RESPONDING', 'warn'); HB.Audio.sfx('siren'); }
  };
  C.setHeat = function (n, min) { C.heat = U.clamp(n, 0, 5); C.heatMin = min || 0; C.heatT = 0; if (C.heat > 0) HB.Audio.sfx('siren'); };
  C.clearHeat = function () { C.heat = 0; C.heatMin = 0; C.heatT = 0; C.clearCops(); };
  const WANT = { cops: [0, 2, 3, 3, 4, 4], swat: [0, 0, 0, 2, 3, 4], cars: [0, 0, 1, 1, 2, 2] };
  function updateHeat(dt) {
    C.heatCd = Math.max(0, C.heatCd - dt);
    if (C.heat <= 0) { C.heatMin = Math.max(0, C.heatMin); return; }
    const p = pos();
    let seen = false;
    for (const f of E.foes) if (f.cop && !f.stand && Math.hypot(f.x - p.x, f.y - p.y) < 440 && f.los) { seen = true; break; }
    if (seen) C.heatT = 0; else C.heatT += dt;
    if (C.heatT > 9 && C.heat > C.heatMin) { C.heat--; C.heatT = 0; if (C.heat === 0) { HB.UI.toast('HEAT CLEARED', 'good'); C.clearCops(); } else HB.UI.toast('HEAT ' + C.heat, 'warn'); }
    C.spawnT -= dt;
    if (C.spawnT > 0) return;
    C.spawnT = 1.4;
    const h = C.heat, nc = E.foes.filter((f) => f.type === 'cop' && !f.stand).length, ns = E.foes.filter((f) => f.type === 'swat' && !f.stand).length, nv = E.chasers.filter((c) => !c.stand).length;
    const spot = (road) => {
      for (let k = 0; k < 28; k++) {
        const a = Math.random() * 6.283, r = U.rnd(470, 640), x = U.clamp(p.x + Math.cos(a) * r, 40, W.COLS * T - 40), y = U.clamp(p.y + Math.sin(a) * r, 40, W.ROWS * T - 40);
        if (Math.hypot(x - p.x, y - p.y) < 430) continue;
        if (road ? W.tileAt(x, y) === W.ROAD : walkable(x, y) && W.tileAt(x, y) !== W.WATER) return { x, y };
      }
      return null;
    };
    if (nv < WANT.cars[h]) { const s = spot(true); if (s) { E.chasers.push({ type: 'patrol', x: s.x, y: s.y, a: Math.random() * 6.283, s: 0, hp: 150, max: 150, still: 0, back: 0, unloaded: false, stand: 0, life: 0, hitCd: 0, flash: 0 }); return; } }
    if (ns < WANT.swat[h]) { const s = spot(false); if (s) { C.spawn('swat', s.x, s.y, { aggro: true }); return; } }
    if (nc < WANT.cops[h]) { const s = spot(false); if (s) C.spawn('cop', s.x, s.y, { aggro: true }); }
  }

  /* ---------- bullets ---------- */
  function shoot(x, y, ang, spd, dmg, own, range, col) {
    C.bullets.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, dmg, own, life: range / spd, col });
  }
  function bulletsUpdate(dt) {
    const S = HB.S, p = pos();
    for (let i = C.bullets.length - 1; i >= 0; i--) {
      const b = C.bullets[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 7)), sx = b.vx * dt / steps, sy = b.vy * dt / steps;
      let dead = false;
      for (let s = 0; s < steps && !dead; s++) {
        b.x += sx; b.y += sy;
        if (b.x < 0 || b.y < 0 || b.x > W.COLS * T || b.y > W.ROWS * T || W.circleSolid(b.x, b.y + 20, 1)) { E.spawnParts(b.x, b.y, 4, b.own === 'p' ? '#00d4aa' : '#7b2fff', 55); dead = true; break; }
        if (b.own === 'p') {
          for (const f of E.foes) {
            if (f.stand) continue;
            if (Math.abs(b.x - f.x) < 11 && Math.abs(b.y - (f.y - 22)) < 20) {
              f.hp -= b.dmg; f.flash = 0.12; f.alert = true; f.react = Math.min(f.react, 0.25);
              E.spawnParts(b.x, b.y, 3, f.t.col, 60); HB.Audio.sfx('hit');
              if (f.cop && C.heat === 0) C.addHeat(1);
              if (f.hp <= 0) C.killFoe(f, true);
              dead = true; break;
            }
          }
          if (!dead) for (const v of E.chasers) {
            if (!v.stand && Math.hypot(b.x - v.x, b.y + 20 - v.y) < 22) { v.hp -= b.dmg; v.flash = 0.12; E.spawnParts(b.x, b.y, 3, '#7b2fff', 60); HB.Audio.sfx('hit'); if (v.hp <= 0) wreck(v); dead = true; if (C.heat === 0) C.addHeat(1); break; }
          }
        } else if (S.hp > 0 && C.invuln <= 0) {
          const rad = E.player.vehicle ? 20 : 11;
          if (Math.hypot(b.x - p.x, b.y - (p.y - (E.player.vehicle ? 8 : 20))) < rad) { C.hurtPlayer(b.dmg * (E.player.vehicle ? 0.6 : 1)); E.spawnParts(b.x, b.y, 4, '#f1eefa', 60); dead = true; }
        }
      }
      b.life -= dt;
      if (dead || b.life <= 0) C.bullets.splice(i, 1);
    }
  }
  function wreck(v) {
    const i = E.chasers.indexOf(v); if (i < 0) return; E.chasers.splice(i, 1);
    E.spawnParts(v.x, v.y - 10, 20, '#7b2fff', 110); E.spawnParts(v.x, v.y - 10, 14, '#00d4aa', 90); E.spawnParts(v.x, v.y - 10, 10, '#f1eefa', 70);
    HB.Audio.sfx('boomcar'); E.shake = Math.max(E.shake, 6);
    E.picks.push({ x: v.x, y: v.y + 4, type: 'cash', val: U.ri(80, 160), life: 24, t: 0 }); C.addHeat(1);
  }

  /* ---------- player ---------- */
  C.hurtPlayer = function (n) {
    const S = HB.S;
    if (G.mode !== 'play' || C.invuln > 0 || C.dead) return;
    if (S.armor > 0) { const a = Math.min(S.armor, n * 0.6); S.armor -= a; n -= a; }
    S.hp -= n; C.hurt = 0.35; E.shake = Math.max(E.shake, 2.5);
    if (C.hurtSnd <= 0) { HB.Audio.sfx('hurt'); C.hurtSnd = 0.2; }
    if (S.hp <= 0) { S.hp = 0; C.die(); }
  };
  C.die = function () { if (C.dead) return; C.dead = true; C.bullets = []; HB.UI.refreshHud(); HB.Screens.down(); };
  C.respawn = function () {
    const S = HB.S, p = E.player, cost = Math.floor(S.coins * 0.1);
    S.coins = Math.max(0, S.coins - cost);
    if (p.vehicle) { p.vehicle.s = 0; p.vehicle = null; S.driving = ''; }
    S.hp = S.maxhp; S.armor = 0; C.dead = false; C.bullets = []; C.boss = null;
    E.foes = []; E.chasers = []; E.picks = [];
    C.clearHeat(); C.heat = 0; C.invuln = 2.2; C.reloadT = 0;
    p.x = 5.5 * T; p.y = 13.9 * T; HB.Game.snapCamera();
    return cost;
  };
  C.heal = (n) => { const S = HB.S; S.hp = Math.min(S.maxhp, S.hp + n); };

  function aimAngle() {
    const p = E.player, cam = HB.Game.cam, ox = p.x, oy = p.y - 20;
    if (C.mouse.on) { const tx = Math.round(cam.x) + C.mouse.x, ty = Math.round(cam.y) + C.mouse.y; return Math.atan2(ty - oy, tx - ox); }
    return { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[p.dir] || 0;
  }
  C.aimAngle = aimAngle;
  function dirFrom(a) { return Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up'); }

  function startReload() {
    const S = HB.S, w = S.weap, i = w.cur, W0 = WEAP[i];
    if (C.reloadT > 0 || w.mag[i] >= W0.mag) return;
    if (i !== 0 && w.ammo[i] <= 0) { if (C.fireCd <= 0) { HB.Audio.sfx('empty'); C.fireCd = 0.3; HB.UI.toast('OUT OF AMMO · ' + W0.name, 'warn'); } return; }
    C.reloadT = W0.reload; HB.Audio.sfx('reload');
  }
  function finishReload() {
    const S = HB.S, w = S.weap, i = w.cur, W0 = WEAP[i], need = W0.mag - w.mag[i];
    if (i === 0) w.mag[i] = W0.mag; else { const take = Math.min(need, w.ammo[i]); w.mag[i] += take; w.ammo[i] -= take; }
  }
  C.selectWeapon = function (i) {
    const w = HB.S.weap; if (!w.owned[i] || w.cur === i) return;
    w.cur = i; C.reloadT = 0; C.fireCd = 0.2; HB.Audio.sfx('click'); HB.UI.toast(WEAP[i].name);
  };

  function playerUpdate(dt) {
    const S = HB.S, p = E.player, I = HB.Input, w = S.weap;
    C.fireCd = Math.max(0, C.fireCd - dt); C.flash = Math.max(0, C.flash - dt); C.spread = Math.max(0, C.spread - dt * 0.5);
    C.invuln = Math.max(0, C.invuln - dt); C.hurt = Math.max(0, C.hurt - dt); C.hurtSnd -= dt; C.carHitCd -= dt;
    if (C.reloadT > 0) { C.reloadT -= dt; if (C.reloadT <= 0) { C.reloadT = 0; finishReload(); } }
    if (p.vehicle) return;
    C.aim = aimAngle();
    if (C.mouse.on || C.mouse.down) p.dir = dirFrom(C.aim);
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((c, i) => { if (I.anyHit([c])) C.selectWeapon(i); });
    if (I.hit('cycle')) { let n = w.cur; for (let k = 0; k < 4; k++) { n = (n + 1) % 4; if (w.owned[n]) break; } C.selectWeapon(n); }
    if (I.hit('reload')) startReload();
    const W0 = WEAP[w.cur], want = I.held('fire') || C.mouse.down;
    const trig = W0.auto ? want : (want && !C.wasFire);
    C.wasFire = want;
    if (trig && C.fireCd <= 0 && C.reloadT <= 0) {
      if (w.mag[w.cur] <= 0) startReload();
      else {
        w.mag[w.cur]--; C.fireCd = W0.rate; C.flash = 0.06; C.spread = Math.min(0.12, C.spread + 0.02);
        const a0 = C.aim, mx = p.x + Math.cos(a0) * 15, my = p.y - 20 + Math.sin(a0) * 15;
        for (let k = 0; k < W0.pellets; k++) shoot(mx, my, a0 + U.rnd(-W0.spread, W0.spread) + U.rnd(-C.spread, C.spread), W0.spd * U.rnd(0.94, 1.04), W0.dmg, 'p', W0.range, '#00d4aa');
        HB.Audio.sfx(W0.snd); E.shake = Math.max(E.shake, W0.id === 'br12' ? 3 : 0.8);
        E.spawnParts(mx, my, 2, '#d8b96a', 50);
        // gunfire near police draws heat
        if (C.heat === 0) for (const f of E.foes) if (f.cop && !f.stand && Math.hypot(f.x - p.x, f.y - p.y) < 380) { C.addHeat(1); break; }
        if (w.mag[w.cur] <= 0 && (w.cur === 0 || w.ammo[w.cur] > 0)) startReload();
      }
    }
  }

  /* ---------- foe AI ---------- */
  function foeUpdate(f, dt) {
    const pp = E.player, P = pos();
    f.flash = Math.max(0, f.flash - dt); f.fireFlash = Math.max(0, f.fireFlash - dt);
    if (f.stand > 0) {
      f.stand -= dt; const a = Math.atan2(f.y - P.y, f.x - P.x), nx = f.x + Math.cos(a) * 60 * dt, ny = f.y + Math.sin(a) * 60 * dt;
      if (walkable(nx, f.y)) f.x = nx; if (walkable(f.x, ny)) f.y = ny; f.anim += dt * 8; f.frame = Math.floor(f.anim) % 4;
      if (f.stand <= 0 || Math.hypot(f.x - P.x, f.y - P.y) > 520) { const i = E.foes.indexOf(f); if (i >= 0) { E.foes.splice(i, 1); derez(f.x, f.y, f.t.col); } }
      return;
    }
    const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    f.los = los(f.x, f.y, P.x, P.y);
    f.ang = ang;
    if (!f.alert) {
      if (f.los && d < 260) { f.alert = true; f.react = U.rnd(0.35, 0.8); HB.Audio.sfx('click'); }
      else { f.dir = dirFrom(ang); f.frame = 0; return; }
    }
    f.dir = dirFrom(ang);
    let want = d > f.t.pref + 40 ? 1 : d < f.t.pref - 50 ? -1 : 0;
    if (!f.los) want = 1;
    f.strafeT -= dt;
    if (f.strafeT <= 0) { f.strafeT = U.rnd(0.8, 2.2); f.strafe = Math.random() < 0.5 ? -1 : 1; if (Math.random() < 0.18) f.strafe = 0; }
    let vx = Math.cos(ang) * want + Math.cos(ang + 1.5708) * f.strafe * (want ? 0.6 : 1);
    let vy = Math.sin(ang) * want + Math.sin(ang + 1.5708) * f.strafe * (want ? 0.6 : 1);
    const l = Math.hypot(vx, vy);
    if (l > 0.01) {
      vx /= l; vy /= l;
      const sp = f.t.spd * (f.los ? 0.85 : 1);
      // separate from other foes
      for (const o of E.foes) if (o !== f) { const ox = f.x - o.x, oy = f.y - o.y, od = Math.hypot(ox, oy); if (od < 20 && od > 0.1) { vx += ox / od * 0.8; vy += oy / od * 0.8; } }
      const nx = f.x + vx * sp * dt, ny = f.y + vy * sp * dt; let moved = false;
      if (walkable(nx, f.y) && W.tileAt(nx, f.y) !== W.WATER) { f.x = nx; moved = true; }
      if (walkable(f.x, ny) && W.tileAt(f.x, ny) !== W.WATER) { f.y = ny; moved = true; }
      if (!moved) { f.stuck += dt; if (f.stuck > 0.25) { f.strafe = -f.strafe || 1; f.strafeT = 1.1; f.stuck = 0; } } else f.stuck = 0;
      f.anim += dt * 8; f.frame = Math.floor(f.anim) % 4;
    } else f.frame = 0;
    f.react -= dt; f.cd -= dt;
    if (f.react <= 0 && f.los && d < f.t.range && f.cd <= 0 && G.mode === 'play' && !C.dead) {
      if (f.vol <= 0) f.vol = f.t.volley;
      f.vol--; f.cd = f.vol > 0 ? f.t.gap : f.t.pause * U.rnd(0.8, 1.25);
      const ox = f.x + Math.cos(ang) * 14, oy = f.y - 20 + Math.sin(ang) * 14, ty = P.y - (pp.vehicle ? 8 : 20);
      const a = Math.atan2(ty - oy, P.x - ox) + U.rnd(-f.t.spread, f.t.spread);
      shoot(ox, oy, a, f.t.bs, f.t.dmg, 'e', f.t.range + 60, f.t.col); f.fireFlash = 0.07;
      if (d < 520) HB.Audio.sfx('efire');
    }
    // vehicle ram by the player
    if (pp.vehicle && Math.abs(pp.vehicle.s) > 130 && d < 26 && (f.rammed || 0) <= 0) {
      f.hp -= 55; f.flash = 0.15; f.rammed = 0.6; E.spawnParts(f.x, f.y - 14, 8, '#f1eefa', 90); HB.Audio.sfx('bump'); pp.vehicle.s *= 0.7;
      if (f.cop) C.addHeat(1);
      if (f.hp <= 0) C.killFoe(f, true);
    }
    if (f.rammed > 0) f.rammed -= dt;
  }

  /* ---------- patrol cars ---------- */
  function chaserUpdate(v, dt) {
    const P = pos(), dx = P.x - v.x, dy = P.y - v.y, d = Math.hypot(dx, dy);
    v.flash = Math.max(0, v.flash - dt); v.life += dt; v.hitCd = Math.max(0, v.hitCd - dt);
    if (v.stand > 0) { v.stand -= dt; E.updateVehicle(v, dt, { thr: 0, steer: 0, hb: true }); if (v.stand <= 0 || d > 700) { const i = E.chasers.indexOf(v); if (i >= 0) { E.chasers.splice(i, 1); E.spawnParts(v.x, v.y - 10, 14, '#7b2fff', 80); } } return; }
    if (v.unloaded) { E.updateVehicle(v, dt, { thr: 0, steer: 0, hb: true }); if (v.life > 40 && d > 380) { v.stand = 0.01; } return; }
    let ang = Math.atan2(dy, dx), diff = U.angDiff(v.a, ang), thr = 1, steer = U.clamp(diff * 2.2, -1, 1);
    if (v.back > 0) { v.back -= dt; thr = -1; steer = -steer; }
    else if (v.hitT > 0.35) { v.back = 0.8; }
    else if (Math.abs(diff) > 1.7) thr = 0.35;
    if (d < 120) thr = Math.abs(v.s) > 80 ? -0.4 : 0;
    E.updateVehicle(v, dt, { thr, steer, hb: false });
    if (d < 190 && Math.abs(v.s) < 45) v.still += dt; else v.still = Math.max(0, v.still - dt);
    if (v.still > 0.9 && !v.unloaded) {
      v.unloaded = true;
      for (let k = 0; k < 2; k++) { const c = Math.cos(v.a + 1.57 * (k ? 1 : -1)) * 26, s = Math.sin(v.a + 1.57 * (k ? 1 : -1)) * 26; C.spawn('cop', v.x + c, v.y + s, { aggro: true }); }
    }
    if (d < 38 && Math.abs(v.s) > 90 && v.hitCd <= 0 && C.heat > 0) { v.hitCd = 0.7; C.hurtPlayer(E.player.vehicle ? 5 : 14); HB.Audio.sfx('bump'); }
  }

  /* ---------- pickups ---------- */
  function picksUpdate(dt) {
    const P = pos();
    for (let i = E.picks.length - 1; i >= 0; i--) {
      const k = E.picks[i]; k.life -= dt; k.t += dt;
      if (k.life <= 0) { E.picks.splice(i, 1); continue; }
      if (Math.hypot(P.x - k.x, P.y - k.y) < 26) {
        const S = HB.S;
        if (k.type === 'cash') HB.addCoins(k.val);
        else if (k.type === 'med') { if (S.hp >= S.maxhp) continue; C.heal(k.val); HB.UI.toast('+' + k.val + ' HP', 'good'); HB.Audio.sfx('pick'); }
        else if (k.type === 'armor') { if (S.armor >= 100) continue; S.armor = Math.min(100, S.armor + k.val); HB.UI.toast('+' + k.val + ' ARMOR', 'good'); HB.Audio.sfx('pick'); }
        else if (k.type === 'ammo') { const w = k.w || 1; S.weap.ammo[w] = Math.min(400, S.weap.ammo[w] + k.val); HB.UI.toast('+' + k.val + ' ' + WEAP[w].name, 'good'); HB.Audio.sfx('pick'); }
        else if (k.type === 'chip') { if (k.fn) k.fn(); }
        E.picks.splice(i, 1);
      }
    }
  }

  /* ---------- main update ---------- */
  C.update = function (dt) {
    if (C.dead) return;
    playerUpdate(dt);
    E.foes.slice().forEach((f) => foeUpdate(f, dt));
    E.chasers.slice().forEach((v) => chaserUpdate(v, dt));
    bulletsUpdate(dt); picksUpdate(dt); updateHeat(dt);
  };

  /* ---------- drawing ---------- */
  C.drawHeld = function (c, x, y, ang, col, flash) {
    c.save(); c.translate(Math.round(x), Math.round(y - 20)); c.rotate(ang);
    c.fillStyle = '#0a0a10'; c.fillRect(6, -3, 14, 6); c.fillStyle = '#1c1c26'; c.fillRect(7, -2, 12, 4); c.fillStyle = col; c.fillRect(17, -1, 3, 2);
    if (flash > 0) { c.fillStyle = '#f1eefa'; c.fillRect(21, -3, 5, 6); c.fillStyle = col; c.fillRect(24, -5, 5, 10); c.fillStyle = 'rgba(241,238,250,.7)'; c.fillRect(20, -1, 12, 2); }
    c.restore();
  };
  C.drawFoe = function (c, f, t) {
    const s = HB.Gfx.charSprite(f.look, f.dir, f.frame), x = Math.round(f.x - 16), y = Math.round(f.y - 55);
    if (f.stand > 0) c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 20);
    c.drawImage(s, x, y);
    if (f.flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75; c.drawImage(s, x, y); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1;
    if (f.alert || f.fireFlash > 0) C.drawHeld(c, f.x, f.y, f.ang, f.t.col, f.fireFlash);
    if (f.hp < f.max && !f.boss) { c.fillStyle = '#07070a'; c.fillRect(f.x - 13, f.y - 66, 26, 4); c.fillStyle = f.t.col; c.fillRect(f.x - 12, f.y - 65, Math.max(0, 24 * f.hp / f.max), 2); }
    if (f.boss) { c.font = 'bold 10px "Courier New",monospace'; c.textAlign = 'center'; c.fillStyle = '#07070a'; c.fillText(f.name || 'TARGET', f.x + 1, f.y - 67); c.fillStyle = '#d8b96a'; c.fillText(f.name || 'TARGET', f.x, f.y - 68); c.textAlign = 'left'; }
    if (f.alert && f.react > 0 && f.react < 0.9) { c.fillStyle = f.t.col; c.fillRect(f.x - 1, f.y - 78, 3, 7); c.fillRect(f.x - 1, f.y - 69, 3, 3); }
  };
  C.drawPlayerGun = function (c, p) { if (HB.S.hp > 0) C.drawHeld(c, p.x, p.y, C.aim, '#00d4aa', C.flash); };
  C.drawChaser = function (c, v, t) {
    const s = HB.Gfx.vehicleSprite('patrol', '#16161d', 'wheel_basic', 'cacc_none', t);
    c.save(); c.translate(Math.round(v.x), Math.round(v.y)); c.rotate(v.a); c.drawImage(s, -32, -20);
    if (v.flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(s, -32, -20); }
    c.restore();
    if (v.hp < v.max) { c.fillStyle = '#07070a'; c.fillRect(v.x - 16, v.y - 30, 32, 4); c.fillStyle = '#7b2fff'; c.fillRect(v.x - 15, v.y - 29, 30 * v.hp / v.max, 2); }
  };
  C.drawPick = function (c, k, t) {
    const b = Math.sin(k.t * 4) * 2, x = Math.round(k.x), y = Math.round(k.y - 10 + b);
    if (k.life < 4 && Math.floor(k.life * 8) % 2) return;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 6, k.y + 2, 12, 3);
    const col = k.type === 'cash' ? '#d8b96a' : k.type === 'med' ? '#00d4aa' : k.type === 'armor' ? '#7b2fff' : k.type === 'chip' ? '#00d4aa' : '#f1eefa';
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 1, x, y, 20); g.addColorStop(0, col + '88'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(x - 20, y - 20, 40, 40); c.restore();
    c.fillStyle = '#07070a'; c.fillRect(x - 6, y - 6, 12, 12); c.fillStyle = col;
    if (k.type === 'cash') { c.fillRect(x - 5, y - 5, 10, 10); c.fillStyle = '#07070a'; c.fillRect(x - 1, y - 4, 2, 8); c.fillRect(x - 3, y - 3, 6, 2); c.fillRect(x - 3, y + 1, 6, 2); }
    else if (k.type === 'med') { c.fillRect(x - 5, y - 5, 10, 10); c.fillStyle = '#07070a'; c.fillRect(x - 1, y - 4, 2, 8); c.fillRect(x - 4, y - 1, 8, 2); }
    else if (k.type === 'armor') { c.fillRect(x - 5, y - 5, 10, 7); c.fillRect(x - 3, y + 2, 6, 3); c.fillStyle = '#07070a'; c.fillRect(x - 1, y - 3, 2, 5); }
    else if (k.type === 'chip') { c.fillRect(x - 5, y - 5, 10, 10); c.fillStyle = '#07070a'; c.fillRect(x - 3, y - 3, 6, 6); c.fillStyle = '#7b2fff'; c.fillRect(x - 1, y - 1, 2, 2); }
    else { c.fillRect(x - 5, y - 4, 10, 8); c.fillStyle = '#07070a'; c.fillRect(x - 3, y - 2, 2, 5); c.fillRect(x + 1, y - 2, 2, 5); }
  };
  C.drawBullets = function (c) {
    for (const b of C.bullets) {
      const l = Math.hypot(b.vx, b.vy), ux = b.vx / l, uy = b.vy / l, len = b.own === 'p' ? 16 : 11;
      c.strokeStyle = b.col; c.lineWidth = b.own === 'p' ? 2.5 : 2; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(b.x - ux * len, b.y - uy * len); c.lineTo(b.x, b.y); c.stroke();
      c.globalAlpha = 1; c.strokeStyle = '#f1eefa'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x - ux * len * 0.4, b.y - uy * len * 0.4); c.lineTo(b.x, b.y); c.stroke();
    }
  };
  /* screen-space reticle and boss bar */
  C.drawHud = function (c, t) {
    if (G.mode !== 'play') return;
    if (C.boss && !G.modal) {
      const f = C.boss, w = 360, x = (HB.VW - w) / 2, y = 22;
      c.fillStyle = 'rgba(7,7,10,.85)'; c.fillRect(x - 2, y - 2, w + 4, 14); c.strokeStyle = '#1c1c26'; c.strokeRect(x - 2.5, y - 2.5, w + 5, 15);
      c.fillStyle = '#d8b96a'; c.fillRect(x, y, Math.max(0, w * f.hp / f.max), 10);
      c.font = 'bold 10px "Courier New",monospace'; c.textAlign = 'center'; c.fillStyle = '#f1eefa'; c.fillText('// ' + (f.name || 'TARGET'), HB.VW / 2, y + 28); c.textAlign = 'left';
    }
    if (C.mouse.on && !G.modal && !E.player.vehicle && !C.dead) {
      const x = Math.round(C.mouse.x), y = Math.round(C.mouse.y), g = 9 + Math.round(C.spread * 90) + (C.reloadT > 0 ? 6 : 0), s = 5;
      c.save(); c.lineWidth = 2; c.strokeStyle = '#7b2fff';
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((q) => { c.beginPath(); c.moveTo(x + q[0] * (g + s), y + q[1] * g); c.lineTo(x + q[0] * g, y + q[1] * g); c.lineTo(x + q[0] * g, y + q[1] * (g + s)); c.stroke(); });
      c.fillStyle = C.reloadT > 0 ? '#d8b96a' : '#00d4aa'; c.fillRect(x - 1, y - 1, 3, 3);
      if (C.reloadT > 0) { const W0 = C.cur(); c.fillStyle = '#07070a'; c.fillRect(x - 16, y + g + 10, 32, 4); c.fillStyle = '#d8b96a'; c.fillRect(x - 15, y + g + 11, 30 * (1 - C.reloadT / W0.reload), 2); }
      c.restore();
    }
    if (C.hurt > 0) { const g = c.createRadialGradient(HB.VW / 2, HB.VH / 2, HB.VH * 0.3, HB.VW / 2, HB.VH / 2, HB.VH * 0.85); g.addColorStop(0, 'rgba(123,47,255,0)'); g.addColorStop(1, 'rgba(123,47,255,' + (C.hurt * 1.1).toFixed(2) + ')'); c.fillStyle = g; c.fillRect(0, 0, HB.VW, HB.VH); }
  };

  /* ---------- pointer input ---------- */
  C.initInput = function () {
    const cv = document.getElementById('game'), m = C.mouse;
    const upd = (e) => { const r = cv.getBoundingClientRect(); m.x = U.clamp((e.clientX - r.left) / r.width * HB.VW, 0, HB.VW); m.y = U.clamp((e.clientY - r.top) / r.height * HB.VH, 0, HB.VH); };
    window.addEventListener('pointermove', (e) => { upd(e); if (G.mode === 'play' && !G.modal) { m.on = true; cv.style.cursor = 'none'; } });
    cv.addEventListener('pointerdown', (e) => { upd(e); if (e.button === 0 || e.pointerType === 'touch') { m.on = true; if (G.mode === 'play' && !G.modal) m.down = true; HB.Audio.unlock(); } });
    window.addEventListener('pointerup', () => { m.down = false; });
    window.addEventListener('blur', () => { m.down = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    HB.G.mouse = m;
  };
  C.showCursor = function (on) { const cv = document.getElementById('game'); if (cv) cv.style.cursor = on ? '' : 'none'; };

  return C;
})();
