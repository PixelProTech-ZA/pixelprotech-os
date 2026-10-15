/* ORCHARD SHIFT — vanilla JS + Canvas. No dependencies, no remote assets. */
(() => {
'use strict';

/* ───────────────────────── constants ───────────────────────── */
const W = 360, H = 600, R = 15;               // logical field size, fruit radius
const TYPES = ['apple', 'citrus', 'plum'];
const TYPE_COLOR = { apple: '#ff4d4d', citrus: '#ffa21f', plum: '#a574e8' };
// PixelProTech palette (from the 2026 corporate profile)
const C = { bg: '#07070a', p1: '#1a1a22', p2: '#1c1c26', teal: '#00d4aa', violet: '#7b2fff', violetHi: '#a67bff',
  gold: '#d8b96a', t1: '#f1eefa', t2: '#c7c1da', t3: '#9a90b8', t4: '#524b6a', bad: '#ff5470' };
const GATE_COL = { A: C.teal, B: C.violetHi };
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
const mix = (h, w, a) => { const p = hex2rgb(h), q = hex2rgb(w), m = (x, y) => Math.round(x + (y - x) * a); return 'rgb(' + m(p[0], q[0]) + ',' + m(p[1], q[1]) + ',' + m(p[2], q[2]) + ')'; };
const MONO = (s, w) => w + ' ' + s + 'px ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,"Liberation Mono","Courier New",monospace';
const SANS = (s, w) => w + ' ' + s + 'px system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const BASKET_X = [60, 180, 300];               // basket 0 = apple, 1 = citrus, 2 = plum
const BASKET_TOP = 468;
const SPR = 52;                                // sprite logical size
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ───────────────────────── storage (fails gracefully) ───────────────────────── */
const store = (() => {
  const mem = {};
  let ok = true;
  try { localStorage.setItem('__os_t', '1'); localStorage.removeItem('__os_t'); } catch (e) { ok = false; }
  return {
    get(k, d) {
      try { if (ok) { const v = localStorage.getItem(k); if (v !== null) return v; } } catch (e) {}
      return k in mem ? mem[k] : d;
    },
    set(k, v) {
      mem[k] = String(v);
      try { if (ok) localStorage.setItem(k, String(v)); } catch (e) {}
    }
  };
})();

const SETTINGS_KEY = 'orchardShift.settings';
const settings = { sound: true, haptics: true, reduce: false };
(function loadSettings() {
  const raw = store.get(SETTINGS_KEY, null);
  if (raw) {
    try { const o = JSON.parse(raw); for (const k in settings) if (typeof o[k] === 'boolean') settings[k] = o[k]; } catch (e) {}
  } else if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settings.reduce = true;
  }
})();
const saveSettings = () => store.set(SETTINGS_KEY, JSON.stringify(settings));
const best = {
  relaxed: parseInt(store.get('orchardShift.best.relaxed', '0'), 10) || 0,
  challenge: parseInt(store.get('orchardShift.best.challenge', '0'), 10) || 0
};
function commitBest() {
  const m = state.mode;
  if (state.score > best[m]) {
    best[m] = state.score;
    state.newBest = true;
  }
  store.set('orchardShift.best.' + m, best[m]);
}

/* ───────────────────────── track geometry ───────────────────────── */
function cubic(p0, c1, c2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]
    ]);
  }
  return pts;
}
const line = (a, b) => [a, b];
function makePath(parts) {
  const pts = [];
  parts.forEach(p => p.forEach((pt, i) => { if (pts.length && i === 0) return; pts.push(pt); }));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
function pointAt(path, d, out) {
  const { pts, cum } = path;
  if (d <= 0) { out.x = pts[0][0]; out.y = pts[0][1]; return out; }
  if (d >= path.len) { const l = pts[pts.length - 1]; out.x = l[0]; out.y = l[1]; return out; }
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
  const seg = (cum[hi] - cum[lo]) || 1, t = (d - cum[lo]) / seg;
  out.x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t;
  out.y = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t;
  return out;
}
const PATHS = {
  P0: makePath([line([180, 18], [180, 170])]),
  AL: makePath([cubic([180, 170], [140, 210], [60, 230], [60, 330], 28), line([60, 330], [60, BASKET_TOP])]),
  AR: makePath([cubic([180, 170], [220, 205], [270, 200], [270, 280], 28)]),
  BL: makePath([cubic([270, 280], [230, 325], [180, 340], [180, 440], 28), line([180, 440], [180, BASKET_TOP])]),
  BR: makePath([cubic([270, 280], [300, 320], [300, 350], [300, 440], 28), line([300, 440], [300, BASKET_TOP])])
};
const GATES = {
  A: { x: 180, y: 170, br: { L: 'AL', R: 'AR' }, ang: {} },
  B: { x: 270, y: 280, br: { L: 'BL', R: 'BR' }, ang: {} }
};
(function () {
  const tmp = {};
  for (const g of ['A', 'B']) for (const d of ['L', 'R']) {
    pointAt(PATHS[GATES[g].br[d]], 34, tmp);
    GATES[g].ang[d] = Math.atan2(tmp.y - GATES[g].y, tmp.x - GATES[g].x);
  }
})();
const DEST = { AL: 0, BL: 1, BR: 2 };          // final piece -> basket index

/* ───────────────────────── game state ───────────────────────── */
const state = {
  status: 'menu', mode: 'relaxed',
  score: 0, combo: 0, bestCombo: 0, resolved: 0, level: 1, lives: 3,
  fruits: [], spawnT: 0.7, gate: { A: 'L', B: 'L' }, gateAng: { A: GATES.A.ang.L, B: GATES.B.ang.L },
  streakType: '', streakN: 0, time: 0, newBest: false,
  next: '', counts: [0, 0, 0], correct: 0, hint: 0
};
const fx = { particles: [], floaters: [], baskets: [0, 1, 2].map(() => ({ flash: 0, type: 'ok', shake: 0 })) };

function params() {
  const L = state.level - 1;
  if (state.mode === 'relaxed') return { speed: Math.min(96, 62 + L * 3.5), interval: Math.max(1.6, 2.5 - L * 0.07) };
  return { speed: Math.min(150, 72 + L * 7), interval: Math.max(1.0, 2.3 - L * 0.12) };
}

function resetRun(mode) {
  state.mode = mode;
  state.score = 0; state.combo = 0; state.bestCombo = 0; state.resolved = 0; state.level = 1; state.lives = 3;
  state.fruits.length = 0; state.spawnT = 0.7; state.streakType = ''; state.streakN = 0; state.newBest = false;
  state.counts = [0, 0, 0]; state.correct = 0; state.next = pickType();
  state.hint = store.get('orchardShift.seen', '') ? 0 : 9;
  state.gate.A = 'L'; state.gate.B = 'L';
  state.gateAng.A = GATES.A.ang.L; state.gateAng.B = GATES.B.ang.L;
  fx.particles.length = 0; fx.floaters.length = 0;
  fx.baskets.forEach(b => { b.flash = 0; b.shake = 0; });
  syncGateButtons(); hudDirty = true;
}

function pickType() {
  let t;
  do { t = TYPES[(Math.random() * 3) | 0]; } while (state.streakN >= 3 && t === state.streakType);
  if (t === state.streakType) state.streakN++; else { state.streakType = t; state.streakN = 1; }
  return t;
}
function spawn() {
  const t = state.next || pickType();
  state.next = pickType();
  state.fruits.push({ type: t, piece: 'P0', d: 0, speed: params().speed, state: 'move', t: 0, seed: Math.random() * 6.28 });
}

function deliver(f, idx) {
  const ok = TYPES[idx] === f.type;
  const x = BASKET_X[idx];
  state.resolved++;
  f.state = 'drop'; f.t = 0; f.ok = ok;
  if (ok) {
    state.counts[idx]++; state.correct++;
    state.combo++;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    const mult = 1 + Math.min(4, Math.floor((state.combo - 1) / 5));
    const pts = 10 * mult;
    state.score += pts;
    fx.baskets[idx].flash = 1; fx.baskets[idx].type = 'ok';
    addFloater(x, BASKET_TOP - 26, '+' + pts, C.t1);
    burst(x, BASKET_TOP - 4, TYPE_COLOR[f.type], 10);
    if (state.combo > 1 && state.combo % 5 === 0) {
      addFloater(180, 330, 'COMBO ×' + (1 + Math.min(4, Math.floor(state.combo / 5))) + '!', C.gold, 22);
      sfx.chime();
    } else sfx.ok(state.combo);
    buzz(12);
  } else {
    state.combo = 0;
    fx.baskets[idx].flash = 1; fx.baskets[idx].type = 'bad'; fx.baskets[idx].shake = 1;
    addFloater(x, BASKET_TOP - 26, 'WRONG BASKET', C.bad, 12);
    burst(x, BASKET_TOP - 4, C.bad, 8);
    sfx.bad(); buzz([30, 40, 30]);
    if (state.mode === 'challenge') {
      state.lives--;
      if (state.lives <= 0) gameOver();
    }
  }
  const nl = 1 + Math.floor(state.resolved / 12);
  if (nl > state.level) { state.level = nl; addFloater(180, 300, 'SHIFT ' + nl, C.teal, 20); }
  hudDirty = true;
}

function updateGame(dt) {
  if (state.hint > 0) state.hint -= dt;
  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    const last = state.fruits.length ? state.fruits[state.fruits.length - 1] : null;
    if (last && last.piece === 'P0' && last.d < 46) state.spawnT = 0.1;
    else { spawn(); state.spawnT = params().interval; }
  }
  for (let i = state.fruits.length - 1; i >= 0; i--) {
    const f = state.fruits[i];
    if (f.state === 'move') {
      f.d += f.speed * dt;
      let guard = 0;
      while (f.state === 'move' && f.d >= PATHS[f.piece].len && guard++ < 4) {
        const over = f.d - PATHS[f.piece].len;
        if (f.piece === 'P0') { f.piece = state.gate.A === 'L' ? 'AL' : 'AR'; f.d = over; }
        else if (f.piece === 'AR') { f.piece = state.gate.B === 'L' ? 'BL' : 'BR'; f.d = over; }
        else { f.d = PATHS[f.piece].len; deliver(f, DEST[f.piece]); }
      }
    } else {
      f.t += dt;
      if (f.t >= 0.34) state.fruits.splice(i, 1);
    }
  }
}

function updateFx(dt) {
  for (const g of ['A', 'B']) {
    const target = GATES[g].ang[state.gate[g]];
    if (settings.reduce) state.gateAng[g] = target;
    else {
      let diff = target - state.gateAng[g];
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      state.gateAng[g] += diff * Math.min(1, dt * 18);
    }
  }
  fx.baskets.forEach(b => { b.flash = Math.max(0, b.flash - dt * 2.6); b.shake = Math.max(0, b.shake - dt * 3.2); });
  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    p.life -= dt; if (p.life <= 0) { fx.particles.splice(i, 1); continue; }
    p.vy += 240 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = fx.floaters.length - 1; i >= 0; i--) {
    const f = fx.floaters[i];
    f.life -= dt; if (f.life <= 0) { fx.floaters.splice(i, 1); continue; }
    f.y -= 26 * dt;
  }
}
function burst(x, y, color, n) {
  if (settings.reduce) return;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, s = 50 + Math.random() * 90;
    fx.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, max: 0.8, color, size: 1.6 + Math.random() * 2.2 });
  }
}
function addFloater(x, y, text, color, size) {
  fx.floaters.push({ x, y, text, color, size: size || 15, life: 1.0, max: 1.0 });
}

/* ───────────────────────── procedural fruit art ───────────────────────── */
function leaf(c, x, y, len, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  const g = c.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, '#5d8a2a'); g.addColorStop(1, '#9cc455');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(len * .5, -len * .42, len, 0);
  c.quadraticCurveTo(len * .5, len * .4, 0, 0); c.fill();
  c.strokeStyle = 'rgba(30,60,10,.45)'; c.lineWidth = Math.max(.6, len * .05);
  c.beginPath(); c.moveTo(len * .05, 0); c.lineTo(len * .85, 0); c.stroke();
  c.restore();
}
function highlight(c, x, y, rx, ry, rot, a) {
  c.fillStyle = 'rgba(255,255,255,' + a + ')';
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill();
}
function shapeApple(c, r) {
  c.save();
  const p = new Path2D();
  p.moveTo(0, -r * .6);
  p.bezierCurveTo(r * .3, -r * 1.02, r * 1.12, -r * .84, r * 1.04, -r * .04);
  p.bezierCurveTo(r * .98, r * .72, r * .52, r * 1.06, 0, r * .94);
  p.bezierCurveTo(-r * .52, r * 1.06, -r * .98, r * .72, -r * 1.04, -r * .04);
  p.bezierCurveTo(-r * 1.12, -r * .84, -r * .3, -r * 1.02, 0, -r * .6);
  p.closePath();
  let g = c.createRadialGradient(-r * .38, -r * .35, r * .08, 0, 0, r * 1.35);
  g.addColorStop(0, '#f26d5c'); g.addColorStop(.42, '#c9302b'); g.addColorStop(.85, '#7c1219'); g.addColorStop(1, '#4d0a10');
  c.fillStyle = g; c.fill(p); c.clip(p);
  c.strokeStyle = 'rgba(70,8,12,.16)'; c.lineWidth = r * .09; c.lineCap = 'round';
  for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * r * .24, -r * .8); c.quadraticCurveTo(i * r * .34, 0, i * r * .22, r * .95); c.stroke(); }
  g = c.createRadialGradient(r * .2, -r * .75, 0, r * .2, -r * .75, r * .75);
  g.addColorStop(0, 'rgba(226,190,70,.38)'); g.addColorStop(1, 'rgba(226,190,70,0)');
  c.fillStyle = g; c.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
  g = c.createRadialGradient(r * .42, r * .72, 0, r * .42, r * .72, r * .62);
  g.addColorStop(0, 'rgba(255,150,110,.3)'); g.addColorStop(1, 'rgba(255,150,110,0)');
  c.fillStyle = g; c.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
  c.restore();
  c.fillStyle = 'rgba(40,6,8,.55)';
  c.beginPath(); c.ellipse(0, -r * .62, r * .2, r * .1, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4a3018'; c.lineWidth = r * .14; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -r * .58); c.quadraticCurveTo(r * .05, -r * 1.0, r * .2, -r * 1.22); c.stroke();
  leaf(c, r * .1, -r * .95, r * .8, -.5);
  highlight(c, -r * .44, -r * .34, r * .17, r * .3, -.55, .4);
  highlight(c, -r * .2, -r * .66, r * .06, r * .06, 0, .5);
}
function shapeCitrus(c, r) {
  c.save();
  const p = new Path2D(); p.ellipse(0, 0, r * 1.02, r * .98, 0, 0, Math.PI * 2);
  let g = c.createRadialGradient(-r * .35, -r * .4, r * .08, 0, 0, r * 1.3);
  g.addColorStop(0, '#ffd666'); g.addColorStop(.45, '#f7a122'); g.addColorStop(.85, '#c2610c'); g.addColorStop(1, '#8e4206');
  c.fillStyle = g; c.fill(p); c.clip(p);
  const rnd = rng(7);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r * .95;
    c.fillStyle = rnd() > .45 ? 'rgba(120,50,0,.28)' : 'rgba(255,230,150,.3)';
    c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, r * (.025 + rnd() * .03), 0, 6.283); c.fill();
  }
  g = c.createRadialGradient(r * .4, r * .7, 0, r * .4, r * .7, r * .6);
  g.addColorStop(0, 'rgba(255,170,80,.3)'); g.addColorStop(1, 'rgba(255,170,80,0)');
  c.fillStyle = g; c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  c.restore();
  g = c.createRadialGradient(0, -r * .9, 0, 0, -r * .9, r * .28);
  g.addColorStop(0, 'rgba(90,40,0,.7)'); g.addColorStop(1, 'rgba(90,40,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, -r * .9, r * .3, 0, 6.283); c.fill();
  c.strokeStyle = '#5a7a22'; c.lineWidth = r * .12; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -r * .92); c.lineTo(r * .04, -r * 1.12); c.stroke();
  leaf(c, 0, -r * 1.0, r * .85, -.35);
  leaf(c, 0, -r * 1.0, r * .6, -2.6);
  highlight(c, -r * .42, -r * .38, r * .18, r * .3, -.6, .42);
}
function shapePlum(c, r) {
  c.save();
  const p = new Path2D(); p.ellipse(0, r * .02, r * .98, r * 1.04, 0, 0, Math.PI * 2);
  let g = c.createRadialGradient(-r * .36, -r * .38, r * .08, 0, 0, r * 1.35);
  g.addColorStop(0, '#c09cf0'); g.addColorStop(.4, '#8456c4'); g.addColorStop(.8, '#4a2476'); g.addColorStop(1, '#2a1245');
  c.fillStyle = g; c.fill(p); c.clip(p);
  g = c.createRadialGradient(r * .25, r * .3, 0, r * .25, r * .3, r * 1.0);
  g.addColorStop(0, 'rgba(225,215,245,.26)'); g.addColorStop(1, 'rgba(225,215,245,0)');
  c.fillStyle = g; c.fillRect(-r * 1.3, -r * 1.3, r * 2.6, r * 2.6);
  c.strokeStyle = 'rgba(18,6,34,.5)'; c.lineWidth = r * .1; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -r * .8); c.bezierCurveTo(r * .35, -r * .3, r * .38, r * .35, r * .08, r * .95); c.stroke();
  c.restore();
  c.fillStyle = 'rgba(15,5,28,.6)';
  c.beginPath(); c.ellipse(0, -r * .86, r * .17, r * .08, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4e3620'; c.lineWidth = r * .13; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -r * .84); c.quadraticCurveTo(-r * .05, -r * 1.1, r * .08, -r * 1.28); c.stroke();
  leaf(c, r * .04, -r * 1.02, r * .7, -.9);
  highlight(c, -r * .42, -r * .38, r * .16, r * .28, -.55, .38);
  highlight(c, -r * .2, -r * .7, r * .05, r * .05, 0, .5);
}
function drawFruitShape(c, type, r) {
  if (type === 'apple') shapeApple(c, r); else if (type === 'citrus') shapeCitrus(c, r); else shapePlum(c, r);
}

/* ───────────────────────── canvas, assets, resize ───────────────────────── */
const canvas = $('game'), stage = $('stage');
const ctx = canvas.getContext('2d');
let k = 1, staticC = null, basketsC = [];
const sprites = {}, plaques = {};

function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

function buildSprites() {
  for (const t of TYPES) {
    const c = makeCanvas(SPR * k, SPR * k), x = c.getContext('2d');
    x.scale(k, k); x.translate(SPR / 2, SPR / 2 + 2); drawFruitShape(x, t, R);
    sprites[t] = c;
    const P = 44, pc = makeCanvas(P * k, P * k), p = pc.getContext('2d');
    p.scale(k, k); p.translate(P / 2, P / 2);
    const col = TYPE_COLOR[t];
    p.fillStyle = 'rgba(0,0,0,.55)'; p.beginPath(); p.arc(1, 2, 20, 0, 6.283); p.fill();
    let g = p.createLinearGradient(-20, -20, 20, 20);
    g.addColorStop(0, mix(col, '#ffffff', .35)); g.addColorStop(1, col);
    p.fillStyle = g; p.beginPath(); p.arc(0, 0, 20, 0, 6.283); p.fill();
    g = p.createRadialGradient(0, -4, 2, 0, 0, 17);
    g.addColorStop(0, '#22222e'); g.addColorStop(1, '#0a0a0f');
    p.fillStyle = g; p.beginPath(); p.arc(0, 0, 16.5, 0, 6.283); p.fill();
    p.save(); p.translate(0, 1.5); p.scale(.84, .84); drawFruitShape(p, t, R); p.restore();
    plaques[t] = pc;
  }
}

function buildBaskets() {
  basketsC = TYPES.map(t => {
    const bw = 108, bh = 100, col = TYPE_COLOR[t];
    const cv = makeCanvas(bw * k, bh * k), c = cv.getContext('2d'); c.scale(k, k);
    const body = new Path2D();
    body.moveTo(6, 12); body.lineTo(102, 12); body.lineTo(94, 88); body.quadraticCurveTo(93, 96, 84, 96);
    body.lineTo(24, 96); body.quadraticCurveTo(15, 96, 14, 88); body.closePath();
    c.save();
    let g = c.createLinearGradient(0, 12, 0, 98);
    g.addColorStop(0, '#2c2c3b'); g.addColorStop(1, '#12121a');
    c.fillStyle = g; c.fill(body); c.clip(body);
    for (let x = -4; x < bw; x += 12) {
      c.fillStyle = 'rgba(0,0,0,.34)'; c.fillRect(x, 12, 2, 90);
      c.fillStyle = 'rgba(241,238,250,.05)'; c.fillRect(x + 2, 12, 1, 90);
    }
    g = c.createLinearGradient(0, 0, bw, 0);
    g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(.25, 'rgba(0,0,0,0)');
    g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = g; c.fillRect(0, 0, bw, bh);
    g = c.createLinearGradient(0, 66, 0, 88);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, .2));
    c.fillStyle = g; c.fillRect(0, 66, bw, 22);
    c.fillStyle = rgba(col, .9); c.fillRect(0, 86, bw, 4);
    c.restore();
    c.strokeStyle = 'rgba(154,144,184,.3)'; c.lineWidth = 1.2; c.stroke(body);
    g = c.createLinearGradient(0, 0, 0, 15);
    g.addColorStop(0, '#3c3c50'); g.addColorStop(1, '#1c1c26');
    c.fillStyle = g; rr(c, 0, 0, bw, 15, 7); c.fill();
    c.strokeStyle = rgba(col, .95); c.lineWidth = 1.5; rr(c, .75, .75, bw - 1.5, 13.5, 6.5); c.stroke();
    c.fillStyle = 'rgba(241,238,250,.22)'; c.fillRect(10, 2.2, bw - 20, 1);
    for (const bx of [11, bw - 11]) {
      c.fillStyle = '#0a0a0f'; c.beginPath(); c.arc(bx, 7.5, 2.4, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(154,144,184,.8)'; c.beginPath(); c.arc(bx - .5, 7, 1, 0, 6.283); c.fill();
    }
    return cv;
  });
}

function paintBackground(c) {
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  let g = c.createRadialGradient(W / 2, 90, 10, W / 2, 90, 340);
  g.addColorStop(0, 'rgba(0,212,170,.09)'); g.addColorStop(1, 'rgba(0,212,170,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createRadialGradient(W / 2, H, 10, W / 2, H, 360);
  g.addColorStop(0, 'rgba(123,47,255,.13)'); g.addColorStop(1, 'rgba(123,47,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // pixel grid
  c.lineWidth = 1;
  for (let x = 0; x <= W; x += 20) {
    c.strokeStyle = x % 100 === 0 ? 'rgba(154,144,184,.11)' : 'rgba(154,144,184,.05)';
    c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke();
  }
  for (let y = 0; y <= H; y += 20) {
    c.strokeStyle = y % 100 === 0 ? 'rgba(154,144,184,.11)' : 'rgba(154,144,184,.05)';
    c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke();
  }
  // scattered lit pixels
  const rnd = rng(11);
  for (let i = 0; i < 16; i++) {
    const cx = 1 + (rnd() * 17 | 0), cy = 1 + (rnd() * 28 | 0);
    c.fillStyle = rgba(rnd() > .35 ? C.teal : C.violet, .05 + rnd() * .06);
    c.fillRect(cx * 20 + 1, cy * 20 + 1, 19, 19);
  }
  // basket bay
  const by = BASKET_TOP - 34;
  g = c.createLinearGradient(0, by, 0, H);
  g.addColorStop(0, 'rgba(26,26,34,.0)'); g.addColorStop(.18, 'rgba(26,26,34,.88)'); g.addColorStop(1, 'rgba(14,14,20,.96)');
  c.fillStyle = g; c.fillRect(0, by, W, H - by);
  c.fillStyle = rgba(C.teal, .3); c.fillRect(0, by + 6, W, 1);
  c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, by + 7, W, 2);
  // vignette
  g = c.createRadialGradient(W / 2, H * .5, H * .3, W / 2, H * .5, H * .78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // corner brackets
  c.strokeStyle = rgba(C.teal, .55); c.lineWidth = 1.5; c.lineCap = 'square';
  const m = 7, L = 14;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    c.beginPath(); c.moveTo(x + sx * L, y); c.lineTo(x, y); c.lineTo(x, y + sy * L); c.stroke();
  }
  c.lineCap = 'round';
}
function strokePath(c, path) {
  c.beginPath();
  path.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
  c.stroke();
}
function paintTracks(c) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  const names = Object.keys(PATHS);
  const layers = [
    ['rgba(0,0,0,.55)', 32], [rgba(C.teal, .16), 27], ['#050508', 25], ['#1c1c26', 21.5], ['rgba(241,238,250,.04)', 8]
  ];
  for (const [col, w] of layers) {
    c.strokeStyle = col; c.lineWidth = w;
    for (const n of names) strokePath(c, PATHS[n]);
  }
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 17; c.lineCap = 'butt'; c.setLineDash([2, 12]);
  for (const n of names) strokePath(c, PATHS[n]);
  c.setLineDash([]); c.lineCap = 'round';
  // junction plates
  for (const g of ['A', 'B']) {
    const gt = GATES[g];
    const gr = c.createRadialGradient(gt.x, gt.y, 4, gt.x, gt.y, 28);
    gr.addColorStop(0, '#2a2a38'); gr.addColorStop(1, 'rgba(42,42,56,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(gt.x, gt.y, 28, 0, 6.283); c.fill();
  }
}
function paintHopper(c) {
  const g = c.createLinearGradient(0, 0, 0, 18);
  g.addColorStop(0, '#2b2b3a'); g.addColorStop(1, '#16161e');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(136, -2); c.lineTo(224, -2); c.lineTo(206, 17); c.lineTo(154, 17); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(154,144,184,.3)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(136, -2); c.lineTo(154, 17); c.lineTo(206, 17); c.lineTo(224, -2); c.stroke();
  c.strokeStyle = C.teal; c.lineWidth = 2.5; c.beginPath(); c.moveTo(156, 17); c.lineTo(204, 17); c.stroke();
  c.fillStyle = rgba(C.teal, .55);
  for (const dx of [-12, 0, 12]) { c.beginPath(); c.moveTo(180 + dx - 4, 4); c.lineTo(180 + dx + 4, 4); c.lineTo(180 + dx, 10); c.closePath(); c.fill(); }
}
function buildStatic() {
  staticC = makeCanvas(canvas.width, canvas.height);
  const c = staticC.getContext('2d'); c.scale(k, k);
  paintBackground(c); paintTracks(c); paintHopper(c);
}

function resize() {
  const rect = stage.getBoundingClientRect();
  const pad = 6;
  const s = Math.max(0.1, Math.min((rect.width - pad * 2) / W, (rect.height - pad * 2) / H));
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  k = s * dpr;
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  buildSprites(); buildBaskets(); buildStatic();
}
let resizeQueued = false;
function queueResize() { if (resizeQueued) return; resizeQueued = true; requestAnimationFrame(() => { resizeQueued = false; resize(); }); }
window.addEventListener('resize', queueResize);
window.addEventListener('orientationchange', queueResize);
if ('ResizeObserver' in window) new ResizeObserver(queueResize).observe(stage);

/* ───────────────────────── rendering ───────────────────────── */
const tmp = { x: 0, y: 0 };
const LABELS = ['APPLE', 'CITRUS', 'PLUM'];
function setLS(c, px) { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; }
function drawSprite(c, t, x, y, sc, rot, alpha) {
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(sc, sc);
  if (alpha < 1) c.globalAlpha = alpha;
  c.drawImage(sprites[t], -SPR / 2, -SPR / 2 - 2, SPR, SPR);
  c.restore();
}
function drawHighlights(c) {
  const t = state.time;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // highlight the live route; gate B only matters when gate A sends fruit right
  const dashed = ['P0', state.gate.A === 'L' ? 'AL' : 'AR'];
  if (state.gate.A === 'R') dashed.push(state.gate.B === 'L' ? 'BL' : 'BR');
  c.strokeStyle = rgba(C.teal, .13); c.lineWidth = 15;
  for (const n of dashed) strokePath(c, PATHS[n]);
  c.strokeStyle = rgba(C.teal, .8); c.lineWidth = 2.5; c.setLineDash([5, 9]);
  c.lineDashOffset = settings.reduce ? 0 : -(t * 34) % 14;
  for (const n of dashed) strokePath(c, PATHS[n]);
  c.setLineDash([]); c.lineDashOffset = 0;
}
function drawGate(c, g) {
  const gt = GATES[g], a = state.gateAng[g], col = GATE_COL[g];
  c.save(); c.translate(gt.x, gt.y);
  if (state.status === 'playing' && !settings.reduce) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 3 + (g === 'B' ? 1.5 : 0));
    c.strokeStyle = rgba(col, 0.15 + 0.25 * pulse); c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 21 + pulse * 3, 0, 6.283); c.stroke();
  }
  c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(1.5, 2.5, 17, 0, 6.283); c.fill();
  let gr = c.createLinearGradient(-15, -15, 15, 15);
  gr.addColorStop(0, '#34344a'); gr.addColorStop(1, '#16161f');
  c.fillStyle = gr; c.beginPath(); c.arc(0, 0, 16.5, 0, 6.283); c.fill();
  c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 16, 0, 6.283); c.stroke();
  c.save(); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,.4)'; rr(c, 1, -4.5 + 2, 30, 9, 4.5); c.fill();
  c.fillStyle = col; rr(c, 0, -4.5, 30, 9, 4.5); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, 3, -3.4, 22, 2, 1); c.fill();
  c.fillStyle = C.t1; c.beginPath(); c.arc(28, 0, 4.4, 0, 6.283); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(28, 0, 2, 0, 6.283); c.fill();
  c.restore();
  gr = c.createRadialGradient(0, -2, 1, 0, 0, 11);
  gr.addColorStop(0, '#1e1e2a'); gr.addColorStop(1, '#08080c');
  c.fillStyle = gr; c.beginPath(); c.arc(0, 0, 10.5, 0, 6.283); c.fill();
  c.fillStyle = col; c.font = MONO(12, 800); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(g, 0, 1);
  c.restore();
}
function drawChips(c) {
  if (state.status === 'menu') return;
  c.save();
  c.textAlign = 'left'; c.textBaseline = 'middle';
  // shift chip with progress pips
  c.fillStyle = rgba(C.p1, .94); rr(c, 14, 6, 104, 34, 9); c.fill();
  c.strokeStyle = 'rgba(154,144,184,.24)'; c.lineWidth = 1; c.stroke();
  c.font = MONO(9, 700); setLS(c, 1.6); c.fillStyle = C.t3; c.fillText('SHIFT', 24, 16);
  setLS(c, 0); c.font = MONO(12, 800); c.fillStyle = C.teal; c.fillText(String(state.level), 66, 16);
  const done = state.resolved % 12;
  for (let i = 0; i < 12; i++) {
    c.fillStyle = i < done ? C.teal : 'rgba(154,144,184,.24)';
    c.fillRect(24 + i * 7, 27, 5, 4);
  }
  // next chip
  c.fillStyle = rgba(C.p1, .94); rr(c, 242, 6, 104, 34, 9); c.fill();
  c.strokeStyle = 'rgba(154,144,184,.24)'; c.stroke();
  c.font = MONO(9, 700); setLS(c, 1.6); c.fillStyle = C.t3; c.fillText('NEXT', 254, 23);
  setLS(c, 0);
  if (state.next) {
    c.fillStyle = rgba(TYPE_COLOR[state.next], .22); c.beginPath(); c.arc(320, 23, 14, 0, 6.283); c.fill();
    drawSprite(c, state.next, 320, 24, .62, 0, 1);
  }
  c.restore();
}
function basketShake(i) {
  const b = fx.baskets[i];
  return (!settings.reduce && b.shake > 0) ? Math.sin(state.time * 70) * 4 * b.shake : 0;
}
function drawBasketBack(c, i) {
  const x = BASKET_X[i] + basketShake(i);
  c.fillStyle = '#030305'; c.beginPath(); c.ellipse(x, BASKET_TOP + 2, 46, 9, 0, 0, 6.283); c.fill();
  const g = c.createLinearGradient(0, BASKET_TOP - 6, 0, BASKET_TOP + 10);
  g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(1, rgba(TYPE_COLOR[TYPES[i]], .14));
  c.fillStyle = g; c.beginPath(); c.ellipse(x, BASKET_TOP + 2, 46, 9, 0, 0, 6.283); c.fill();
  // the harvest heap grows with correct deliveries
  const n = state.counts[i], t = TYPES[i];
  if (n >= 1) drawSprite(c, t, x, BASKET_TOP - 8, .6, .1, 1);
  if (n >= 4) drawSprite(c, t, x - 17, BASKET_TOP - 7, .56, -.25, 1);
  if (n >= 9) drawSprite(c, t, x + 17, BASKET_TOP - 7, .56, .3, 1);
  if (n >= 16) drawSprite(c, t, x - 6, BASKET_TOP - 15, .52, -.1, 1);
}
function drawBasketFront(c, i) {
  const b = fx.baskets[i], x = BASKET_X[i] + basketShake(i), top = BASKET_TOP - 6;
  if (b.flash > 0) {
    const col = b.type === 'ok' ? '0,212,170' : '255,84,106';
    const g = c.createRadialGradient(x, top + 40, 10, x, top + 40, 80);
    g.addColorStop(0, 'rgba(' + col + ',' + (0.42 * b.flash) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = g; c.fillRect(x - 90, top - 40, 180, 170);
  }
  c.drawImage(basketsC[i], x - 54, top, 108, 100);
  c.drawImage(plaques[TYPES[i]], x - 22, top + 55 - 22 + 4, 44, 44);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.font = MONO(9, 700); setLS(c, 1.8); c.fillStyle = C.t3; c.fillText(LABELS[i], x + .9, 577);
  setLS(c, 0); c.font = SANS(14, 800);
  c.fillStyle = (b.flash > 0 && b.type === 'ok') ? C.teal : C.t1; c.fillText(String(state.counts[i]), x, 593);
}
function drawFruit(c, f) {
  const path = PATHS[f.piece];
  pointAt(path, f.d, tmp);
  let x = tmp.x, y = tmp.y, sc = 1, rot = settings.reduce ? 0 : Math.sin(state.time * 2.6 + f.seed) * .09;
  if (f.state === 'drop') {
    const p = clamp(f.t / 0.34, 0, 1);
    y += 36 * p * p; sc = 1 - .22 * p;
  } else {
    if (f.piece === 'P0') sc = .45 + .55 * clamp(f.d / 26, 0, 1);
    const hg = c.createRadialGradient(x, y, 4, x, y, 25 * sc);
    hg.addColorStop(0, rgba(TYPE_COLOR[f.type], .3)); hg.addColorStop(1, rgba(TYPE_COLOR[f.type], 0));
    c.fillStyle = hg; c.beginPath(); c.arc(x, y, 25 * sc, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath(); c.ellipse(x + 2, y + R * .88, R * .85 * sc, R * .34 * sc, 0, 0, 6.283); c.fill();
  }
  drawSprite(c, f.type, x, y, sc, rot, 1);
}
function drawHint(c) {
  if (state.hint <= 0 || state.status !== 'playing') return;
  const a = clamp(state.hint / 0.8, 0, 1);
  const pulse = settings.reduce ? .5 : 0.5 + 0.5 * Math.sin(state.time * 5);
  c.save(); c.globalAlpha = a;
  c.strokeStyle = rgba(C.teal, .5 + .4 * pulse); c.lineWidth = 2.5;
  c.beginPath(); c.arc(GATES.A.x, GATES.A.y, 25 + pulse * 4, 0, 6.283); c.stroke();
  c.fillStyle = rgba(C.p2, .96); rr(c, 122, 226, 116, 38, 10); c.fill();
  c.strokeStyle = rgba(C.teal, .7); c.lineWidth = 1; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.t1;
  c.font = MONO(10, 700); setLS(c, 1);
  c.fillText('TAP A GATE', 180, 238); c.fillStyle = C.teal; c.fillText('TO SWITCH', 180, 253);
  setLS(c, 0); c.restore();
}
function render() {
  if (!staticC) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(staticC, 0, 0);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  if (state.status !== 'menu') drawHighlights(ctx);
  drawChips(ctx);
  drawGate(ctx, 'A'); drawGate(ctx, 'B');
  for (let i = 0; i < 3; i++) drawBasketBack(ctx, i);
  for (const f of state.fruits) drawFruit(ctx, f);
  for (let i = 0; i < 3; i++) drawBasketFront(ctx, i);
  for (const p of fx.particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of fx.floaters) {
    ctx.globalAlpha = clamp(f.life / f.max * 1.6, 0, 1);
    ctx.font = SANS(f.size, 800);
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(f.text, f.x + 1, f.y + 1.5);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  drawHint(ctx);
}

/* ───────────────────────── audio (synthesised, optional) ───────────────────────── */
let actx = null, master = null;
function ac() {
  if (!settings.sound) return null;
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC(); master = actx.createGain(); master.gain.value = 0.4; master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(f, dur, o) {
  o = o || {};
  const a = ac(); if (!a) return;
  try {
    const t0 = a.currentTime + (o.delay || 0), osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master); osc.start(t0); osc.stop(t0 + dur + 0.03);
  } catch (e) {}
}
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const sfx = {
  ui() { tone(620, .05, { type: 'triangle', gain: .07, to: 480 }); },
  toggle() { tone(430, .07, { type: 'triangle', gain: .1, to: 300 }); },
  ok(c) {
    const n = 523.25 * Math.pow(2, SCALE[Math.min(Math.max(c, 1) - 1, SCALE.length - 1)] / 12);
    tone(n, .22, { gain: .14 }); tone(n * 1.5, .18, { type: 'triangle', gain: .05, delay: .05 });
  },
  bad() { tone(180, .3, { type: 'sawtooth', gain: .06, to: 90 }); },
  chime() { [0, 4, 7, 12].forEach((s, i) => tone(784 * Math.pow(2, s / 12), .26, { gain: .08, delay: i * .07 })); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(f, .35, { type: 'triangle', gain: .1, delay: i * .16 })); }
};
function buzz(p) {
  if (settings.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} }
}

/* ───────────────────────── HUD & UI ───────────────────────── */
let hudDirty = true;
const el = {
  score: $('score'), best: $('bestLabel'), combo: $('combo'), comboN: $('comboN'),
  comboMult: $('comboMult'), lives: $('lives'), gateA: $('gateA'), gateB: $('gateB'),
  btnSound: $('btnSound'), btnPause: $('btnPause')
};
let lastScore = -1;
function updateHud() {
  hudDirty = false;
  el.score.textContent = state.score;
  if (state.score !== lastScore && state.score > 0) {
    el.score.classList.remove('bump'); void el.score.offsetWidth; el.score.classList.add('bump');
  }
  lastScore = state.score;
  el.best.textContent = 'BEST ' + Math.max(best[state.mode], state.score);
  const showCombo = state.combo >= 2 && state.status !== 'menu';
  if (showCombo) {
    el.comboN.textContent = state.combo;
    const m = 1 + Math.min(4, Math.floor((state.combo - 1) / 5));
    el.comboMult.hidden = m < 2; el.comboMult.textContent = '×' + m;
    if (el.combo.hidden) { el.combo.hidden = false; }
    el.combo.style.animation = 'none'; void el.combo.offsetWidth; el.combo.style.animation = '';
  } else el.combo.hidden = true;
  const ch = state.mode === 'challenge';
  el.lives.hidden = !ch;
  [...el.lives.children].forEach((n, i) => n.classList.toggle('lost', i >= state.lives));
}
function syncGateButtons() {
  for (const g of ['A', 'B']) {
    const b = g === 'A' ? el.gateA : el.gateB, d = state.gate[g];
    b.dataset.dir = d;
    b.querySelector('.gate-dir').textContent = d === 'L' ? 'LEFT' : 'RIGHT';
    b.setAttribute('aria-label', 'Gate ' + g + ', set ' + (d === 'L' ? 'left' : 'right') + '. Press to switch.');
  }
}
function syncSettingsUI() {
  document.documentElement.classList.toggle('reduce', settings.reduce);
  document.querySelectorAll('.switch[data-setting]').forEach(b => b.setAttribute('aria-checked', String(!!settings[b.dataset.setting])));
  el.btnSound.setAttribute('aria-pressed', String(settings.sound));
  el.btnSound.setAttribute('aria-label', settings.sound ? 'Sound on' : 'Sound off');
}
function refreshBestLabels() {
  $('bestRelaxed').textContent = 'Best ' + best.relaxed;
  $('bestChallenge').textContent = 'Best ' + best.challenge;
}

const overlays = {};
['menu', 'pause', 'over', 'howto', 'settings'].forEach(n => overlays[n] = $(n));
let backTo = 'menu';
function show(name) {
  for (const n in overlays) overlays[n].classList.toggle('show', n === name);
  const first = overlays[name].querySelector('.btn,.switch');
  if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
}
function hideAll() {
  for (const n in overlays) overlays[n].classList.remove('show');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

/* ───────────────────────── flow ───────────────────────── */
function startGame(mode) {
  resetRun(mode);
  state.status = 'playing';
  hideAll(); updateHud(); lockScreen();
}
const accuracy = () => state.resolved ? Math.round(state.correct / state.resolved * 100) : 100;
let wake = null;
async function lockScreen() {   // keep the screen on while playing (taxi rides, long sessions)
  try {
    if ('wakeLock' in navigator && !wake) {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
    }
  } catch (e) { wake = null; }
}
function pauseGame() {
  if (state.status !== 'playing') return;
  state.status = 'paused'; commitBest(); backTo = 'pause';
  $('pauseStats').textContent = 'SCORE ' + state.score + '  ·  SHIFT ' + state.level + '  ·  ACC ' + accuracy() + '%';
  show('pause');
}
function resumeGame() {
  if (state.status !== 'paused') return;
  state.status = 'playing'; hideAll(); lockScreen();
}
function toMenu() {
  commitBest();
  state.status = 'menu';
  state.fruits.length = 0; fx.particles.length = 0; fx.floaters.length = 0;
  state.combo = 0; state.score = 0; state.level = 1;
  refreshBestLabels(); backTo = 'menu'; show('menu'); hudDirty = true;
}
let overTimer = 0;
function gameOver() {
  state.status = 'over';
  if (wake) { try { wake.release(); } catch (e) {} wake = null; }
  commitBest(); sfx.over(); buzz([60, 40, 60]);
  $('overScore').textContent = state.score;
  $('overBest').textContent = best[state.mode];
  $('overCombo').textContent = state.bestCombo;
  $('overSorted').textContent = state.resolved;
  $('overAcc').textContent = accuracy() + '%';
  $('overShift').textContent = state.level;
  $('overBadge').hidden = !(state.newBest && state.score > 0);
  clearTimeout(overTimer);
  overTimer = setTimeout(() => { if (state.status === 'over') show('over'); }, 650);
}
function toggleGate(g) {
  if (state.status !== 'playing') return;
  state.gate[g] = state.gate[g] === 'L' ? 'R' : 'L';
  if (state.hint > 0) { state.hint = 0; store.set('orchardShift.seen', '1'); }
  sfx.toggle(); buzz(8); syncGateButtons();
}
function toggleSound() {
  settings.sound = !settings.sound; saveSettings(); syncSettingsUI();
  if (settings.sound) sfx.toggle();
}

/* ───────────────────────── input ───────────────────────── */
let audioPrimed = false;
window.addEventListener('pointerdown', () => { if (!audioPrimed) { audioPrimed = true; ac(); } }, { passive: true });

canvas.addEventListener('pointerdown', e => {
  if (state.status !== 'playing') return;
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  let bestG = null, bestD = 78;
  for (const g of ['A', 'B']) {
    const d = Math.hypot(x - GATES[g].x, y - GATES[g].y);
    if (d < bestD) { bestD = d; bestG = g; }
  }
  if (bestG) toggleGate(bestG);
});

[el.gateA, el.gateB].forEach(b => {
  let lastPress = -1e9;
  b.addEventListener('pointerdown', e => { e.preventDefault(); lastPress = performance.now(); toggleGate(b.dataset.gate); });
  // A click that follows a press is the same tap; a click with no recent press is keyboard activation.
  b.addEventListener('click', () => { if (performance.now() - lastPress > 900) toggleGate(b.dataset.gate); });
});
el.btnPause.addEventListener('click', () => state.status === 'playing' ? pauseGame() : resumeGame());
el.btnSound.addEventListener('click', toggleSound);

document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => { sfx.ui(); startGame(b.dataset.start); }));
$('btnHow').addEventListener('click', () => { sfx.ui(); backTo = 'menu'; show('howto'); });
document.querySelectorAll('[data-open-settings]').forEach(b => b.addEventListener('click', () => { sfx.ui(); show('settings'); }));
document.querySelectorAll('[data-close-overlay]').forEach(b => b.addEventListener('click', () => { sfx.ui(); show(backTo); }));
$('btnResume').addEventListener('click', () => { sfx.ui(); resumeGame(); });
$('btnRestart').addEventListener('click', () => { sfx.ui(); startGame(state.mode); });
$('btnToMenu').addEventListener('click', () => { sfx.ui(); toMenu(); });
$('btnAgain').addEventListener('click', () => { sfx.ui(); startGame(state.mode); });
$('btnOverMenu').addEventListener('click', () => { sfx.ui(); toMenu(); });

document.querySelectorAll('.switch[data-setting]').forEach(b => b.addEventListener('click', () => {
  const k2 = b.dataset.setting;
  settings[k2] = !settings[k2]; saveSettings(); syncSettingsUI();
  if (k2 === 'sound' && settings.sound) sfx.toggle();
  if (k2 === 'haptics' && settings.haptics) buzz(15);
}));
if (!('vibrate' in navigator)) $('rowHaptics').hidden = true;

let resetArmed = 0;
$('btnReset').addEventListener('click', () => {
  const b = $('btnReset');
  if (!resetArmed) {
    resetArmed = setTimeout(() => { resetArmed = 0; b.firstElementChild.textContent = 'Reset best scores'; }, 3500);
    b.firstElementChild.textContent = 'Tap again to confirm';
    return;
  }
  clearTimeout(resetArmed); resetArmed = 0;
  best.relaxed = 0; best.challenge = 0;
  store.set('orchardShift.best.relaxed', 0); store.set('orchardShift.best.challenge', 0);
  b.firstElementChild.textContent = 'Best scores cleared';
  setTimeout(() => { b.firstElementChild.textContent = 'Reset best scores'; }, 1500);
  refreshBestLabels(); hudDirty = true;
});

window.addEventListener('keydown', e => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const gateFocus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('gate');
  switch (e.code) {
    case 'KeyA': case 'Digit1': toggleGate('A'); break;
    case 'KeyB': case 'Digit2': toggleGate('B'); break;
    case 'KeyM': toggleSound(); break;
    case 'KeyP': case 'Escape':
      if (state.status === 'playing') pauseGame();
      else if (state.status === 'paused' && overlays.pause.classList.contains('show')) resumeGame();
      break;
    case 'Space':
      if (gateFocus) return;
      if (state.status === 'playing') { e.preventDefault(); pauseGame(); }
      break;
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); commitBest(); } });
window.addEventListener('pagehide', () => commitBest());
document.addEventListener('contextmenu', e => e.preventDefault());

/* ───────────────────────── logo & chips ───────────────────────── */
function drawLogo() {
  const c = $('logoFruit'), dpr = Math.min(window.devicePixelRatio || 1, 3);
  c.width = 220 * dpr; c.height = 64 * dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  [['apple', 48, -.12], ['citrus', 110, 0.05], ['plum', 172, .14]].forEach(([t, px, rot]) => {
    x.save(); x.translate(px, 38); x.rotate(rot); drawFruitShape(x, t, 21); x.restore();
  });
  document.querySelectorAll('.chip[data-fruit]').forEach(ch => {
    ch.width = 34 * dpr; ch.height = 34 * dpr;
    const cx = ch.getContext('2d'); cx.scale(dpr, dpr); cx.translate(17, 19); drawFruitShape(cx, ch.dataset.fruit, 10.5);
  });
}

/* ───────────────────────── main loop ───────────────────────── */
let lastTs = 0;
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000)); lastTs = ts;
  if (state.status !== 'paused') {
    state.time += dt;
    if (state.status === 'playing') updateGame(dt);
    updateFx(dt);
  }
  if (hudDirty) updateHud();
  render();
  requestAnimationFrame(frame);
}

/* ───────────────────────── boot ───────────────────────── */
syncSettingsUI(); syncGateButtons(); refreshBestLabels(); drawLogo(); resize(); updateHud();
lastTs = performance.now();
requestAnimationFrame(frame);

// Service worker is handled by the host OS.

// test hook (harmless in production)
window.__orchard = { state, toggleGate, startGame, params, pauseGame, toMenu };
})();
