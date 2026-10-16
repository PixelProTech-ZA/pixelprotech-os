'use strict';
/* HOMEBASE graphics: every sprite is drawn in code (pixel-art style) and cached on small canvases. */
HB.Gfx = (function () {
  const cache = new Map();
  const OUT = '#0a0a10';
  const SKINS = ['#f6d2b0', '#e8b48a', '#c68a5c', '#9a6139', '#6e4326', '#4a2c1a'];
  const HAIRS = ['#2a1a12', '#5a3a1e', '#c9822b', '#e8d28a', '#b4342c', '#4a63c8', '#7b4bb7', '#d8d8d8'];

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = HB.u.clamp(Math.round(r + amt), 0, 255); g = HB.u.clamp(Math.round(g + amt), 0, 255); b = HB.u.clamp(Math.round(b + amt), 0, 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  const memo = (key, w, h, fn) => { let c = cache.get(key); if (!c) { const [cv, x] = mk(w, h); fn(x, cv); c = cv; cache.set(key, c); } return c; };

  /* ---------------- characters ---------------- */
  const CW = 32, CH = 58, OY = 12; // feet at y = 43+OY = 55
  function drawChar(x, o, dir, frame) {
    const r = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
    const f = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const side = dir === 'left' || dir === 'right';
    const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0, bob = frame % 2 ? -1 : 0;
    const skin = typeof o.skin === 'number' ? SKINS[o.skin] : (o.skin || SKINS[1]), hair = o.hair || HAIRS[0], shirt = o.shirt || '#e0533d', pants = o.pants || '#3b4a7a';
    x.save();
    if (dir === 'right') { x.translate(CW, 0); x.scale(-1, 1); }
    x.translate(0, OY);
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(16, 43, 9, 3, 0, 0, 7); x.fill();
    if (o.cape && dir !== 'down') f(7, 18 + bob, 18, 22, o.cape);
    x.translate(0, bob);
    // legs + shoes
    if (side) {
      const a = stride * 3;
      r(12 + a, 31, 5, 9, pants); r(15 - a, 31, 5, 9, shade(pants, -18));
      f(11 + a, 38, 7, 3, '#dfdbed'); f(14 - a, 38, 7, 3, '#b4accc');
    } else {
      const lL = stride > 0 ? 2 : 0, lR = stride < 0 ? 2 : 0;
      r(10, 31, 5, 9 - lL, pants); r(17, 31, 5, 9 - lR, pants);
      f(9, 38 - lL, 7, 3, '#dfdbed'); f(16, 38 - lR, 7, 3, '#dfdbed');
    }
    // body
    r(9, 19, 14, 13, shirt);
    f(9, 29, 14, 3, shade(shirt, -28));
    if (o.shirtStyle === 'stripes') { for (let i = 0; i < 4; i++) f(9, 21 + i * 3, 14, 1, '#5c25c4'); }
    if (o.shirtStyle === 'gold') { f(9, 19, 14, 3, '#8c7233'); f(15, 22, 2, 8, '#8c7233'); }
    if (o.apron) { r(11, 22, 10, 10, '#f1eefa'); f(11, 22, 10, 2, '#c9c3db'); }
    if (o.vest) { f(9, 19, 14, 13, o.vest); f(15, 19, 2, 13, '#a9a0c4'); f(9, 27, 14, 2, '#a9a0c4'); }
    if (o.stripe) f(9, 25, 14, 2, o.stripe);
    // arms
    if (side) { const s = stride * 2; r(13 + s, 20, 5, 9, shade(shirt, -10)); f(13 + s, 27, 5, 3, skin); }
    else { const s = stride; r(5, 20 + s, 4, 9, shade(shirt, -10)); r(23, 20 - s, 4, 9, shade(shirt, -10)); f(5, 27 + s, 4, 3, skin); f(23, 27 - s, 4, 3, skin); }
    // head
    r(8, 5, 16, 15, skin);
    const hs = o.hairStyle || 'short';
    if (hs !== 'bald') {
      if (dir === 'up') { f(8, 5, 16, 14, hair); if (hs === 'long') f(8, 15, 16, 8, hair); }
      else if (side) { f(11, 5, 13, 13, hair); f(8, 5, 5, 4, hair); if (hs === 'long') f(14, 15, 10, 8, hair); }
      else { f(8, 5, 16, 5, hair); f(8, 5, 3, 9, hair); f(21, 5, 3, 9, hair); if (hs === 'long') { f(8, 5, 3, 17, hair); f(21, 5, 3, 17, hair); } }
      if (hs === 'puff') { r(6, -3, 20, 10, hair); }
      if (hs === 'wild') { f(5, -2, 5, 9, hair); f(12, -5, 6, 10, hair); f(21, -2, 5, 9, hair); f(8, 2, 16, 6, hair); }
      if (hs === 'braids') { f(8, 17, 3, 9, hair); f(21, 17, 3, 9, hair); }
    }
    if (dir === 'down') {
      f(12, 12, 3, 3, '#0a0a0d'); f(18, 12, 3, 3, '#0a0a0d'); f(13, 12, 1, 1, '#f1eefa'); f(19, 12, 1, 1, '#f1eefa');
      f(14, 17, 5, 1, o.mouth || '#7a3030');
      if (o.glasses) { f(10, 11, 6, 1, o.glasses); f(17, 11, 6, 1, o.glasses); f(10, 15, 6, 1, o.glasses); f(17, 15, 6, 1, o.glasses); f(10, 11, 1, 5, o.glasses); f(15, 11, 1, 5, o.glasses); f(17, 11, 1, 5, o.glasses); f(22, 11, 1, 5, o.glasses); }
      if (o.stache) f(12, 15, 9, 2, o.stache);
      if (o.blush) { f(10, 15, 2, 1, '#ff9aa8'); f(21, 15, 2, 1, '#ff9aa8'); }
    } else if (side) {
      f(10, 12, 3, 3, '#0a0a0d'); f(8, 14, 2, 2, shade(skin, -20));
      if (o.stache) f(8, 16, 5, 2, o.stache);
      if (o.glasses) f(8, 11, 6, 1, o.glasses);
    }
    // hats / headgear
    hat(x, f, r, o, dir);
    x.restore();
  }
  function hat(x, f, r, o, dir) {
    const h = o.hat, side = dir === 'left' || dir === 'right';
    if (!h || h === 'hat_none') return;
    const c = o.hatCol || '#8a7032', d = shade(c, -35);
    switch (h) {
      case 'hat_cap': r(7, 2, 18, 6, c); if (dir === 'down') f(6, 7, 20, 3, d); else if (side) f(2, 6, 8, 3, d); break;
      case 'hat_beanie': r(7, 0, 18, 8, c); f(7, 5, 18, 3, d); r(14, -4, 4, 4, '#f1eefa'); break;
      case 'hat_sun': r(2, 4, 28, 4, c); r(8, -2, 16, 8, c); f(8, 3, 16, 2, '#8a7032'); break;
      case 'hat_party': x.fillStyle = OUT; x.beginPath(); x.moveTo(16, -14); x.lineTo(5, 7); x.lineTo(27, 7); x.fill(); x.fillStyle = c; x.beginPath(); x.moveTo(16, -12); x.lineTo(7, 6); x.lineTo(25, 6); x.fill(); f(12, 0, 3, 3, '#f1eefa'); f(17, -3, 3, 3, '#bb9c50'); f(14, -10, 4, 4, '#bb9c50'); break;
      case 'hat_chef': r(8, -9, 16, 14, '#f1eefa'); r(6, -5, 6, 8, '#f1eefa'); r(20, -5, 6, 8, '#f1eefa'); f(8, 3, 16, 2, '#b6aecd'); break;
      case 'hat_antenna': r(15, -10, 2, 12, '#2e2b3c'); r(12, -15, 8, 7, c); f(14, -14, 2, 2, '#f1eefa'); r(8, 3, 16, 3, '#191921'); break;
      case 'hat_wizard': x.fillStyle = OUT; x.beginPath(); x.moveTo(17, -22); x.lineTo(5, 6); x.lineTo(27, 6); x.fill(); x.fillStyle = c; x.beginPath(); x.moveTo(17, -19); x.lineTo(7, 5); x.lineTo(25, 5); x.fill(); r(2, 4, 28, 4, c); f(12, -2, 3, 3, '#bb9c50'); f(18, -8, 3, 3, '#bb9c50'); break;
      case 'hat_crown': r(8, -2, 16, 8, c); r(8, -6, 3, 4, c); r(14, -8, 4, 6, c); r(21, -6, 3, 4, c); f(15, 1, 2, 2, '#8a7032'); break;
      case 'hat_detective': r(3, 3, 26, 4, c); r(9, -3, 14, 8, c); f(9, 2, 14, 2, '#2a220e'); break;
      case 'hat_doek': r(7, 0, 18, 8, c); r(21, -2, 6, 6, d); f(9, 3, 3, 2, '#bb9c50'); f(15, 3, 3, 2, '#bb9c50'); break;
      case 'hat_helmet': r(7, 0, 18, 10, c); f(9, 7, 14, 3, '#1a0e3d'); f(14, 0, 4, 7, '#f1eefa'); break;
      case 'hat_goggles': r(7, 1, 18, 6, '#3b2f13'); r(9, 0, 6, 6, '#00cea5'); r(17, 0, 6, 6, '#00cea5'); break;
      case 'hat_feather': r(7, 0, 18, 8, c); f(2, 4, 28, 3, d); r(22, -12, 4, 14, '#ac8d42'); f(23, -10, 2, 4, '#8a7032'); break;
      case 'hat_hivis': r(7, 1, 18, 7, '#8a7032'); if (dir === 'down') f(6, 7, 20, 2, '#55441c'); break;
      default: break;
    }
  }
  function charSprite(o, dir, frame) {
    const key = 'c|' + [o.skin, o.hair, o.hairStyle, o.shirt, o.shirtStyle, o.hat, o.hatCol, o.pants, o.cape, o.apron, o.vest, o.glasses, o.stache, o.blush, o.stripe].join(',') + '|' + dir + frame;
    return memo(key, CW, CH, (x) => drawChar(x, o, dir, frame));
  }
  function playerLook() {
    return { skin: SKINS[HB.S.look.skin % SKINS.length], hair: '#07070a', hairStyle: 'short', shirt: '#16161d', stripe: '#00d4aa', vest: '#1c1c26', glasses: '#7b2fff', pants: '#0d0d12' };
  }

  /* ---------------- animals ---------------- */
  function goat(dir, frame) {
    return memo('goat' + dir + frame, 40, 34, (x) => {
      x.save(); if (dir === 'right') { x.translate(40, 0); x.scale(-1, 1); }
      const r = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(21, 30, 13, 3, 0, 0, 7); x.fill();
      const l = frame % 2;
      r(12 + l, 22, 3, 8, '#e4ca86'); r(18 - l, 22, 3, 8, '#ccad5f'); r(27 + l, 22, 3, 8, '#e4ca86'); r(31 - l, 22, 3, 8, '#ccad5f');
      r(10, 12, 24, 12, '#edd89d'); r(5, 6, 10, 10, '#edd89d'); r(3, 11, 6, 6, '#e4ca86'); // body, head, snout
      r(5, 2, 2, 5, '#4a3b17'); r(10, 2, 2, 5, '#4a3b17'); // horns
      r(8, 10, 2, 2, '#0a0a0d'); r(34, 14, 4, 3, '#edd89d'); r(4, 16, 2, 5, '#d6b768');
      x.restore();
    });
  }
  function ostrich(dir, frame) {
    return memo('ost' + dir + frame, 44, 64, (x) => {
      x.save(); if (dir === 'right') { x.translate(44, 0); x.scale(-1, 1); }
      const r = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(24, 60, 14, 3, 0, 0, 7); x.fill();
      const l = frame % 2;
      r(18 + l * 2, 38, 3, 20, '#c1a255'); r(26 - l * 2, 38, 3, 20, '#b09146'); r(14 + l * 2, 56, 8, 3, '#c1a255'); r(24 - l * 2, 56, 8, 3, '#b09146');
      r(10, 24, 28, 18, '#0c0c10'); r(30, 26, 10, 12, '#d0cae1'); r(8, 28, 6, 10, '#d0cae1');
      r(10, 6, 4, 22, '#d8b96a'); r(5, 2, 10, 8, '#d8b96a'); r(1, 5, 5, 3, '#ab8c42'); r(9, 4, 2, 2, '#0a0a0d');
      x.restore();
    });
  }
  function bot(t, col) {
    const k = Math.floor(t * 6) % 2;
    return memo('bot' + col + k, 28, 34, (x) => {
      const r = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(14, 30, 8, 2.5, 0, 0, 7); x.fill();
      r(13, 0, 2, 6, '#3c374e'); r(11, -2 + 2, 6, 4, '#b09146');
      r(5, 8 - k, 18, 14, col); r(8, 11 - k, 5, 5, '#f1eefa'); r(15, 11 - k, 5, 5, '#f1eefa'); x.fillStyle = '#08080c'; x.fillRect(10, 13 - k, 2, 2); x.fillRect(17, 13 - k, 2, 2);
      r(8, 22 - k, 12, 4, '#272533'); r(6 + k * 2, 26, 4, 4, '#101015'); r(18 - k * 2, 26, 4, 4, '#101015');
    });
  }

  /* ---------------- vehicles (drawn facing east, rotated at draw time) ---------------- */
  function carColor(col, style, t) { if (style === 'rainbow') return 'hsl(' + (Math.floor(t * 60) % 360) + ',80%,58%)'; return col; }
  function wheelStyle(x, wx, wy, w, h, style) {
    if (style === 'wheel_square') { x.fillStyle = OUT; x.fillRect(wx - 1, wy - 1, w + 2, h + 2); x.fillStyle = '#8a7032'; x.fillRect(wx, wy, w, h); x.fillStyle = '#bb9c50'; x.fillRect(wx + 2, wy + 1, w - 4, h - 2); return; }
    const big = style === 'wheel_chunky';
    const ww = w + (big ? 3 : 0), hh = h + (big ? 2 : 0), ox = wx - (big ? 1 : 0), oy = wy - (big ? 1 : 0);
    x.fillStyle = OUT; x.fillRect(ox - 1, oy - 1, ww + 2, hh + 2);
    x.fillStyle = '#0b0b0f'; x.fillRect(ox, oy, ww, hh);
    if (big) { x.fillStyle = '#0f0f14'; for (let i = 1; i < ww; i += 3) x.fillRect(ox + i, oy, 1, hh); }
    const hub = style === 'wheel_gold' ? '#a5863e' : style === 'wheel_star' ? '#f1eefa' : '#453f58';
    x.fillStyle = hub; x.fillRect(ox + ww / 2 - 2, oy + hh / 2 - 1, 4, 2);
    if (style === 'wheel_star') { x.fillRect(ox + ww / 2 - 1, oy + hh / 2 - 2, 2, 4); }
  }
  function vehicleSprite(type, ccol, wheel, acc, t) {
    const it = { col: ccol && ccol[0] === '#' ? ccol : '#16161d' };
    const col = carColor(it.col, it.style, t);
    const tk = type === 'patrol' ? Math.floor(t * 5) % 2 : 0;
    return memo(['veh', type, col, wheel, acc, tk].join('|'), 64, 40, (x) => {
      x.translate(32, 20);
      const R = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      const F = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
      const dk = shade(col.startsWith('#') ? col : '#2e2b3c', -40);
      x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(-23, -9, 48, 24);
      if (type === 'patrol') {
        wheelStyle(x, -20, -15, 12, 6, wheel); wheelStyle(x, -20, 9, 12, 6, wheel); wheelStyle(x, 10, -15, 12, 6, wheel); wheelStyle(x, 10, 9, 12, 6, wheel);
        R(-23, -10, 46, 20, '#16161d'); F(-23, -2, 46, 4, '#7b2fff'); F(-23, 6, 46, 4, '#0d0d12'); F(4, -8, 12, 16, '#00d4aa'); F(-12, -8, 12, 16, '#1c1c26');
        R(-4, -10, 5, 20, '#0d0d12'); F(-4, -10, 5, 8, tk % 2 ? '#00d4aa' : '#3a1a80'); F(-4, 2, 5, 8, tk % 2 ? '#3a1a80' : '#7b2fff');
        F(22, -8, 2, 4, '#f1eefa'); F(22, 4, 2, 4, '#f1eefa'); F(-24, -8, 2, 4, '#7b2fff'); F(-24, 4, 2, 4, '#7b2fff');
      } else if (type === 'buggy') {
        wheelStyle(x, -22, -17, 14, 8, wheel); wheelStyle(x, -22, 9, 14, 8, wheel); wheelStyle(x, 10, -17, 14, 8, wheel); wheelStyle(x, 10, 9, 14, 8, wheel);
        R(-20, -8, 40, 16, col); F(-20, 4, 40, 4, dk); F(6, -6, 12, 12, shade('#f1eefa', -10)); F(8, -4, 6, 8, '#00cea5');
        F(-14, -6, 8, 12, '#0d0d12'); F(-12, -4, 4, 8, '#14141b');
        x.strokeStyle = '#0b0b0e'; x.lineWidth = 2; x.strokeRect(-12, -10, 20, 20); x.beginPath(); x.moveTo(-12, -10); x.lineTo(8, 10); x.moveTo(8, -10); x.lineTo(-12, 10); x.stroke();
        F(19, -7, 2, 4, '#ddc177'); F(19, 3, 2, 4, '#ddc177'); F(-21, -6, 2, 3, '#ad8e44'); F(-21, 3, 2, 3, '#ad8e44');
      } else {
        wheelStyle(x, -20, -15, 12, 6, wheel); wheelStyle(x, -20, 9, 12, 6, wheel); wheelStyle(x, 10, -15, 12, 6, wheel); wheelStyle(x, 10, 9, 12, 6, wheel);
        R(-24, -11, 48, 22, col); F(-24, 6, 48, 5, dk); F(8, -10, 15, 20, shade(col.startsWith('#') ? col : '#7f672e', 25)); // hood
        R(-4, -9, 14, 18, shade(col.startsWith('#') ? col : '#7f672e', 12)); F(9, -8, 3, 16, '#00cea5'); F(-3, -8, 2, 16, '#00b08e'); // cab + screens
        F(-23, -9, 18, 18, 'rgba(0,0,0,.22)'); F(-21, -7, 1, 14, 'rgba(0,0,0,.25)'); F(-16, -7, 1, 14, 'rgba(0,0,0,.25)'); F(-11, -7, 1, 14, 'rgba(0,0,0,.25)'); // bed ribs
        F(22, -9, 2, 4, '#ddc177'); F(22, 5, 2, 4, '#ddc177'); F(-25, -9, 2, 4, '#ad8e44'); F(-25, 5, 2, 4, '#ad8e44');
      }
      if (acc === 'cacc_stripes') { F(-23, -4, 46, 2, '#f1eefa'); F(-23, 2, 46, 2, '#f1eefa'); }
      if (acc === 'cacc_spoiler') { R(-27, -11, 5, 22, '#0d0d12'); F(-26, -10, 2, 20, '#191921'); }
      if (acc === 'cacc_flag') { F(-22, -1, 1, 2, '#0d0d12'); R(-27, -3, 6, 5, '#8a7032'); F(-26, -2, 4, 1, '#f1eefa'); }
      if (acc === 'cacc_lights') { R(-2, -9, 4, 18, '#0d0d12'); F(-2, -9, 4, 6, '#a1833c'); F(-2, 3, 4, 6, '#752df4'); }
      if (acc === 'cacc_ears') { R(-6, -10, 3, 8, '#f1eefa'); R(-6, 2, 3, 8, '#f1eefa'); F(-5, -8, 1, 5, '#e1c781'); F(-5, 4, 1, 5, '#e1c781'); }
    });
  }
  function trafficSprite(kind, col) {
    return memo('traf' + kind + col, 80, 40, (x) => {
      x.translate(40, 20);
      const R = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      const F = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-24, -9, 52, 24);
      if (kind === 'bus') { // minibus taxi
        R(-26, -11, 52, 22, '#ded9eb'); F(-26, -2, 52, 4, '#5523b8'); F(-26, 4, 52, 7, '#ada5c7');
        F(14, -9, 10, 18, '#00cea5'); for (let i = 0; i < 4; i++) F(-22 + i * 9, -9, 7, 5, '#00cea5'); for (let i = 0; i < 4; i++) F(-22 + i * 9, 5, 7, 4, '#00cea5');
        F(24, -9, 2, 4, '#ddc177'); F(24, 5, 2, 4, '#ddc177'); F(-27, -9, 2, 4, '#ad8e44'); F(-27, 5, 2, 4, '#ad8e44'); F(-8, -1, 12, 2, '#a5863e');
      } else if (kind === 'van') {
        R(-26, -11, 52, 22, col); F(10, -9, 14, 18, shade(col, 30)); F(16, -8, 5, 16, '#00cea5'); F(-20, -4, 22, 8, 'rgba(255,255,255,.55)'); F(-18, -2, 18, 2, '#8a7032');
        F(24, -9, 2, 4, '#ddc177'); F(24, 5, 2, 4, '#ddc177'); F(-27, -9, 2, 4, '#ad8e44'); F(-27, 5, 2, 4, '#ad8e44');
      } else {
        R(-22, -10, 44, 20, col); F(2, -8, 12, 16, '#00cea5'); F(-12, -8, 12, 16, shade(col, 22)); F(-20, 5, 40, 4, shade(col, -35));
        F(21, -8, 2, 4, '#ddc177'); F(21, 4, 2, 4, '#ddc177'); F(-23, -8, 2, 4, '#ad8e44'); F(-23, 4, 2, 4, '#ad8e44');
      }
      [[-18, -15], [-18, 10], [12, -15], [12, 10]].forEach((w) => { F(w[0] - 1, w[1] - 1, 12, 7, OUT); F(w[0], w[1], 10, 5, '#0b0b0f'); });
    });
  }

  /* ---------------- props ---------------- */
  function prop(name, v) {
    return memo('p_' + name + (v || ''), 80, 90, (x) => {
      const R = (a, b, w, h, c) => { x.fillStyle = OUT; x.fillRect(a - 1, b - 1, w + 2, h + 2); x.fillStyle = c; x.fillRect(a, b, w, h); };
      const F = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
      const C = (cx, cy, rr, c) => { x.fillStyle = OUT; x.beginPath(); x.arc(cx, cy, rr + 1.5, 0, 7); x.fill(); x.fillStyle = c; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); };
      x.translate(40, 80); // anchor: bottom centre
      const shadow = (rx) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(0, -2, rx, rx * 0.3, 0, 0, 7); x.fill(); };
      switch (name) {
        case 'tree': {
          const g = ['#05372f', '#054237', '#05342c'][v % 3], gl = shade(g, 28);
          shadow(16); R(-4, -22, 8, 22, '#392e12'); C(0, -44, 17, g); C(-12, -34, 12, g); C(12, -34, 12, g); C(-4, -50, 11, gl); F(-6, -52, 5, 3, shade(gl, 20));
          F(-10, -36, 3, 3, '#8a7032'); F(8, -40, 3, 3, '#8a7032'); break;
        }
        case 'acacia': {
          shadow(20); R(-3, -34, 6, 34, '#413414'); R(-1, -44, 12, 4, '#413414');
          x.fillStyle = OUT; x.beginPath(); x.ellipse(0, -48, 34, 12, 0, 0, 7); x.fill(); x.fillStyle = '#054036'; x.beginPath(); x.ellipse(0, -49, 32, 10, 0, 0, 7); x.fill(); x.fillStyle = '#036654'; x.beginPath(); x.ellipse(-6, -53, 20, 5, 0, 0, 7); x.fill(); break;
        }
        case 'cactus': { shadow(10); R(-4, -34, 8, 34, '#044a3e'); R(-14, -26, 6, 4, '#044a3e'); R(-14, -34, 4, 12, '#044a3e'); R(8, -22, 6, 4, '#044a3e'); R(10, -30, 4, 12, '#044a3e'); F(-2, -30, 2, 24, '#027c65'); if (v) { F(-3, -38, 6, 4, '#8d53ff'); } break; }
        case 'bush': { shadow(14); C(-8, -10, 9, '#05372f'); C(8, -10, 9, '#05372f'); C(0, -15, 10, '#036251'); F(-10, -12, 3, 3, '#925dff'); F(6, -16, 3, 3, '#f1eefa'); break; }
        case 'lamp': { shadow(6); R(-2, -52, 4, 52, '#16161e'); R(-7, -60, 14, 9, '#dabc70'); F(-5, -58, 10, 3, '#edd79c'); break; }
        case 'bench': { shadow(16); R(-15, -14, 30, 6, '#5c4a1f'); R(-15, -22, 30, 4, '#735d29'); R(-14, -8, 4, 8, '#14141b'); R(10, -8, 4, 8, '#14141b'); break; }
        case 'bin': { shadow(8); R(-8, -18, 16, 18, '#05372f'); R(-9, -22, 18, 5, '#05312a'); F(-4, -14, 8, 2, '#00cfa6'); break; }
        case 'cone': { shadow(7); x.fillStyle = OUT; x.beginPath(); x.moveTo(0, -24); x.lineTo(-9, 0); x.lineTo(9, 0); x.fill(); x.fillStyle = '#866d31'; x.beginPath(); x.moveTo(0, -21); x.lineTo(-7, -2); x.lineTo(7, -2); x.fill(); F(-5, -13, 10, 3, '#f1eefa'); break; }
        case 'crate': { shadow(14); R(-13, -24, 26, 24, '#735d29'); F(-13, -14, 26, 2, '#443615'); F(-2, -24, 4, 24, '#443615'); F(-12, -23, 24, 2, '#a6883e'); break; }
        case 'tyres': { shadow(11); C(0, -6, 10, '#0c0c10'); C(0, -6, 4, '#20202b'); C(0, -16, 10, '#0e0e12'); C(0, -16, 4, '#2e2b3c'); break; }
        case 'barrel': { shadow(9); R(-9, -22, 18, 22, '#5724bb'); F(-9, -16, 18, 2, '#27145e'); F(-9, -7, 18, 2, '#27145e'); break; }
        case 'mailbox': { shadow(6); R(-2, -14, 4, 14, '#14141b'); R(-8, -26, 16, 12, '#8a7032'); F(-6, -22, 12, 2, '#473916'); F(5, -32, 3, 8, '#a5863e'); break; }
        case 'post': { shadow(7); R(-2, -30, 4, 30, '#413414'); R(-17, -42, 34, 14, '#b99a4f'); F(-14, -39, 28, 2, '#765f2a'); F(-14, -34, 28, 2, '#765f2a'); break; }
        case 'braai': { shadow(12); R(-11, -12, 22, 12, '#0e0e12'); F(-9, -10, 18, 3, '#866d31'); R(-9, -22, 2, 10, '#14141b'); R(7, -22, 2, 10, '#14141b'); break; }
        case 'hoop': { shadow(6); R(-2, -58, 4, 58, '#191921'); R(-14, -66, 28, 18, '#f1eefa'); R(-6, -62, 12, 9, '#8a7032'); F(-8, -48, 16, 3, '#866d31'); break; }
        case 'rock': { shadow(18); x.fillStyle = OUT; x.beginPath(); x.moveTo(-20, 0); x.lineTo(-14, -22); x.lineTo(2, -30); x.lineTo(18, -16); x.lineTo(22, 0); x.fill(); x.fillStyle = '#302d3e'; x.beginPath(); x.moveTo(-18, -2); x.lineTo(-12, -20); x.lineTo(2, -28); x.lineTo(16, -15); x.lineTo(20, -2); x.fill(); x.fillStyle = '#ab8c42'; x.beginPath(); x.moveTo(-12, -20); x.lineTo(2, -28); x.lineTo(6, -18); x.lineTo(-6, -12); x.fill(); break; }
        case 'umbrella': { shadow(14); R(-1, -34, 3, 34, '#20202b'); x.fillStyle = OUT; x.beginPath(); x.ellipse(0, -36, 24, 9, 0, 0, 7); x.fill(); x.fillStyle = '#8d53ff'; x.beginPath(); x.ellipse(0, -37, 22, 7, 0, 0, 7); x.fill(); F(-6, -42, 6, 8, '#f1eefa'); F(8, -42, 6, 8, '#f1eefa'); break; }
        case 'line': { /* washing line */ R(-36, -40, 3, 40, '#20202b'); R(33, -40, 3, 40, '#20202b'); x.strokeStyle = '#101015'; x.lineWidth = 1; x.beginPath(); x.moveTo(-34, -38); x.lineTo(34, -38); x.stroke(); ['#8a7032', '#5c25c4', '#8c7233', '#036d59', '#8d53ff'].forEach((c, i) => R(-28 + i * 13, -37, 9, 14, c)); break; }
        case 'goal': { R(-26, -2, 4, 2, '#f1eefa'); break; }
        case 'dish': { shadow(8); R(-2, -14, 4, 14, '#2e2b3c'); x.fillStyle = OUT; x.beginPath(); x.ellipse(0, -22, 13, 11, 0, 0, 7); x.fill(); x.fillStyle = '#d3cee3'; x.beginPath(); x.ellipse(0, -22, 11, 9, 0, 0, 7); x.fill(); break; }
        case 'manhole': { x.fillStyle = OUT; x.beginPath(); x.ellipse(0, -8, 14, 8, 0, 0, 7); x.fill(); x.fillStyle = '#1c1c26'; x.beginPath(); x.ellipse(0, -8, 12, 6.5, 0, 0, 7); x.fill(); F(-8, -9, 16, 1, '#131319'); F(-8, -6, 16, 1, '#131319'); F(-1, -10, 2, 4, '#131319'); break; }
        case 'chest': { shadow(14); R(-13, -20, 26, 20, '#4b3c17'); R(-13, -26, 26, 9, '#665223'); F(-13, -14, 26, 3, '#937736'); R(-3, -17, 6, 7, '#a5863e'); break; }
        case 'ladder': { R(-9, -30, 3, 30, '#5c4a1f'); R(6, -30, 3, 30, '#5c4a1f'); for (let i = 0; i < 4; i++) F(-8, -26 + i * 8, 16, 2, '#80682e'); break; }
        case 'desk': { shadow(18); R(-18, -22, 36, 10, '#735d29'); R(-16, -12, 4, 12, '#443615'); R(12, -12, 4, 12, '#443615'); R(-10, -34, 20, 12, '#0f0f13'); F(-8, -32, 16, 8, '#00c69f'); break; }
        case 'sign': { shadow(7); R(-2, -26, 4, 26, '#413414'); R(-14, -40, 28, 16, '#c8a95b'); F(-10, -36, 20, 2, '#4a3b17'); F(-10, -31, 14, 2, '#4a3b17'); break; }
        case 'clue': { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(0, -10, 14, 0, 7); x.fill(); R(-5, -12, 10, 12, '#e0c57e'); F(-3, -9, 6, 1, '#3c374e'); F(-3, -6, 6, 1, '#3c374e'); F(-3, -3, 4, 1, '#3c374e'); break; }
        case 'gate': { /* barrier arm drawn elsewhere */ break; }
        default: break;
      }
    });
  }

  function tinyChar(o, dir) { return charSprite(o, dir || 'down', 0); }

  return { mk, shade, memo, charSprite, playerLook, goat, ostrich, bot, vehicleSprite, trafficSprite, prop, SKINS, HAIRS, OUT, CW, CH, tinyChar, carColor };
})();
