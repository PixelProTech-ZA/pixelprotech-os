'use strict';
/* HOMEBASE core: namespace, utilities, save manager. HOMEBASE: Field Operations, by PixelProTech Solutions (Pty) Ltd. 18+ */
const HB = { T: 32, VW: 960, VH: 540 };
HB.G = { mode: 'boot', time: 0, errors: [] };

HB.u = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rnd: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; },
  time(s) { s = Math.max(0, s); const m = Math.floor(s / 60); const r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); },
  esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  isObj: (o) => o && typeof o === 'object' && !Array.isArray(o),
};

/* ---------- Save manager: one local slot, safe defaults ---------- */
HB.Save = {
  KEY: 'homebase.fieldops.save.v1',
  ok: true,
  hasSave: false,
  defaults() {
    return {
      v: 2,
      started: false,
      nick: 'Operator',
      adult: false,
      ops: { i: 0, done: [], contracts: 0, intel: false },
      weap: { owned: [1, 0, 0, 0], ammo: [999, 0, 0, 0], mag: [12, 0, 0, 0], cur: 0 },
      hp: 100, maxhp: 100, armor: 0, kills: 0,
      look: { skin: 1, hair: 0, hairStyle: 'short' },
      coins: 500,
      pos: { x: 5.5 * 32, y: 13.9 * 32 },
      driving: '',
      cars: { bakkie: { x: 9.5 * 32, y: 15.5 * 32, a: 0 }, buggy: { x: 30 * 32, y: 33.5 * 32, a: 0 } },
      eq: { hat: 'hat_none', shirt: 'shirt_0', ccol: 'ccol_0', wheel: 'wheel_basic', cacc: 'cacc_none', horn: 'horn_beep', wall: 'wall_0', floor: 'floor_0' },
      owned: { hat_none: 1, shirt_0: 1, shirt_1: 1, ccol_0: 1, ccol_1: 1, wheel_basic: 1, cacc_none: 1, horn_beep: 1, wall_0: 1, floor_0: 1 },
      stickers: {},
      missions: {},
      flags: { gateOpen: 1 },
      best: { sprint: 0, medal: 0 },
      brain: { level: 1, plays: 0, perfect: 0 },
      cases: {},
      spots: { bedroom: [], clubhouse: [], garage: [] },
      settings: { music: 0.5, sfx: 0.8, interactKey: 'KeyE', bigText: false, lowPower: false, reduceMotion: false, breakMin: 0, showHints: true },
      stats: { playMs: 0, days: {} },
    };
  },
  merge(d, o) {
    if (!HB.u.isObj(o)) return d;
    for (const k of Object.keys(o)) {
      const dv = d[k], ov = o[k];
      if (k === '__proto__' || k === 'constructor') continue;
      if (HB.u.isObj(dv) && HB.u.isObj(ov)) d[k] = HB.Save.merge(dv, ov);
      else if (dv === undefined) d[k] = ov;
      else if (typeof dv === typeof ov && Array.isArray(dv) === Array.isArray(ov)) d[k] = ov;
    }
    return d;
  },
  load() {
    let raw = null;
    try { raw = localStorage.getItem(this.KEY); } catch (e) { this.ok = false; }
    let s = this.defaults();
    this.hasSave = false;
    if (raw) {
      try { s = this.merge(s, JSON.parse(raw)); this.hasSave = !!s.started; } catch (e) { console.warn('Save was unreadable; starting fresh.'); s = this.defaults(); }
    }
    s.coins = HB.u.clamp(Math.floor(+s.coins || 0), 0, 999999);
    ['music', 'sfx'].forEach((k) => { s.settings[k] = HB.u.clamp(+s.settings[k] || 0, 0, 1); });
    if (!isFinite(s.pos.x) || !isFinite(s.pos.y)) s.pos = this.defaults().pos;
    HB.S = s;
    return s;
  },
  write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(HB.S)); this.ok = true; return true; } catch (e) { this.ok = false; return false; }
  },
  reset() {
    try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ }
    HB.S = this.defaults();
    this.hasSave = false;
  },
};

HB.addCoins = function (n, quiet) {
  HB.S.coins = Math.max(0, HB.S.coins + n);
  if (n > 0 && !quiet) { HB.Audio.sfx('coin'); }
  if (HB.UI && HB.UI.refreshHud) HB.UI.refreshHud();
  if (n > 0 && HB.UI && !quiet) HB.UI.floatText('+R' + n);
};
