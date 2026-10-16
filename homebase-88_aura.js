'use strict';
/* HOMEBASE Aura (Field Operations): the neon-noir light layer.
   A permanent night with lamp pools, headlight cones, neon spill from every building, a rotating ring under you,
   police strobes at the screen edge when you are hot, slanted violet rain and teal motes.
   Pure canvas, nothing flashes faster than 3 Hz except the police strobe, which Calmer visuals turns off.
   Low-power skips the extras. */
HB.Aura = (function () {
  const U = HB.u, G = HB.G, VW = HB.VW, VH = HB.VH;
  const A = { night: 0.62 };
  const light = document.createElement('canvas'); light.width = VW; light.height = VH;
  const lc = light.getContext('2d');
  const vig = document.createElement('canvas'); vig.width = VW; vig.height = VH;
  (function () {
    const v = vig.getContext('2d'), g = v.createRadialGradient(VW / 2, VH / 2, VH * 0.38, VW / 2, VH / 2, VH * 0.98);
    g.addColorStop(0, 'rgba(7,7,10,0)'); g.addColorStop(1, 'rgba(7,7,10,.62)'); v.fillStyle = g; v.fillRect(0, 0, VW, VH);
  })();
  let lamps = null, lampN = -1;
  const mod = (v, m) => ((v % m) + m) % m;
  const st = () => (HB.S && HB.S.settings) || {};

  function ring(c, x, y, r, col, t, alpha, k) {
    c.save(); c.translate(x, y); c.globalAlpha = alpha; c.strokeStyle = col; c.lineWidth = 2;
    c.rotate(t * 0.7 * k); c.scale(1, 0.42); c.setLineDash([10, 8]); c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.stroke(); c.restore();
  }

  A.shadow = function (c, kind, o) {
    if (kind === 'prop' || kind === 'pick') return;
    c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath();
    if (kind === 'veh' || kind === 'traf' || kind === 'chaser') c.ellipse(o.x, o.y + 7, 36, 15, o.a || 0, 0, 7); else c.ellipse(o.x, o.y + 3, 12, 5, 0, 0, 7);
    c.fill();
  };

  A.ground = function (c, t) {
    if (st().lowPower || G.mode !== 'play') return;
    const pp = HB.E.player, pos = pp.vehicle || pp, y = pos.y + (pp.vehicle ? 6 : 2);
    ring(c, pos.x, y, pp.vehicle ? 46 : 24, '#00d4aa', t, 0.5, 1);
    ring(c, pos.x, y, pp.vehicle ? 60 : 34, '#7b2fff', t, 0.4, -1);
  };

  A.post = function (c, cx, cy, t) {
    const s = st(), low = !!s.lowPower, calm = !!s.reduceMotion;
    if (G.mode === 'boot') return;
    const n = A.night + (calm ? 0 : Math.sin(t * 0.25) * 0.03);
    if (!lamps || lampN !== HB.World.props.length) { lamps = HB.World.props.filter((p) => p.k === 'lamp'); lampN = HB.World.props.length; }
    // 1. night tint with light punched through
    lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, VW, VH);
    lc.fillStyle = 'rgba(6,5,22,' + n.toFixed(3) + ')'; lc.fillRect(0, 0, VW, VH);
    lc.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => { const g = lc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const p of lamps) { const x = p.x - cx, y = p.y - 58 - cy; if (x > -190 && x < VW + 190 && y > -190 && y < VH + 190) hole(x, y, 170, 1); }
    HB.World.buildings.forEach((b) => { const x = (b.x + b.w / 2) * 32 - cx, y = (b.y + b.h) * 32 - cy; if (x > -150 && x < VW + 150 && y > -150 && y < VH + 150) hole(x, y, 110, 0.7); });
    if (G.mode === 'play') {
      const pp = HB.E.player, pos = pp.vehicle || pp, px = pos.x - cx, py = pos.y - 14 - cy, C = HB.Combat;
      hole(px, py, pp.vehicle ? 120 : 110, 0.85);
      if (C.flash > 0) hole(px, py, 190, 0.9);
      if (pp.vehicle) { const dx = Math.cos(pp.vehicle.a), dy = Math.sin(pp.vehicle.a); hole(px + dx * 90, py + dy * 90, 120, 0.8); hole(px + dx * 170, py + dy * 170, 130, 0.6); }
      HB.E.foes.forEach((f) => { const x = f.x - cx, y = f.y - 20 - cy; if (x > -80 && x < VW + 80 && y > -80 && y < VH + 80) hole(x, y, f.fireFlash > 0 ? 120 : 62, f.fireFlash > 0 ? 0.9 : 0.6); });
      HB.E.chasers.forEach((v) => { const x = v.x - cx, y = v.y - cy; hole(x, y, 90, 0.8); });
    }
    c.drawImage(light, 0, 0);
    // 2. additive glows: lamps teal, building doors in their accent, police strobes
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of lamps) { const x = p.x - cx, y = p.y - 58 - cy; if (x < -90 || x > VW + 90 || y < -90 || y > VH + 90) continue; const g = c.createRadialGradient(x, y, 0, x, y, 84); g.addColorStop(0, 'rgba(0,212,170,.30)'); g.addColorStop(1, 'rgba(0,212,170,0)'); c.fillStyle = g; c.fillRect(x - 84, y - 84, 168, 168); }
    HB.World.buildings.forEach((b) => {
      const x = (b.x + b.w / 2) * 32 - cx, y = (b.y + b.h) * 32 - cy + 6; if (x < -130 || x > VW + 130 || y < -130 || y > VH + 130) return;
      const g = c.createRadialGradient(x, y, 0, x, y, 96), pulse = calm ? 0.2 : 0.2 + 0.05 * Math.sin(t * 1.3 + b.x); g.addColorStop(0, b.acc + Math.round(pulse * 255).toString(16).padStart(2, '0')); g.addColorStop(1, b.acc + '00'); c.fillStyle = g; c.fillRect(x - 96, y - 96, 192, 192);
    });
    if (G.mode === 'play' && HB.Combat.heat > 0 && !calm) {
      const h = HB.Combat.heat, ph = Math.floor(t * 3) % 2, a = 0.07 + h * 0.025;
      const g1 = c.createLinearGradient(0, 0, VW * 0.35, 0), g2 = c.createLinearGradient(VW, 0, VW * 0.65, 0);
      g1.addColorStop(0, (ph ? 'rgba(123,47,255,' : 'rgba(0,212,170,') + a + ')'); g1.addColorStop(1, 'rgba(0,0,0,0)');
      g2.addColorStop(0, (ph ? 'rgba(0,212,170,' : 'rgba(123,47,255,') + a + ')'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g1; c.fillRect(0, 0, VW * 0.35, VH); c.fillStyle = g2; c.fillRect(VW * 0.65, 0, VW * 0.35, VH);
    }
    c.restore();
    if (!low) {
      // 3. slanted violet rain
      if (!calm) {
        c.save(); c.strokeStyle = 'rgba(154,144,184,.20)'; c.lineWidth = 1; c.beginPath();
        for (let i = 0; i < 46; i++) {
          const sp = 380 + (i % 5) * 60, x = mod(i * 97 + t * 90 - cx * 0.3, VW + 60) - 30, y = mod(i * 53 + t * sp, VH + 40) - 20;
          c.moveTo(x, y); c.lineTo(x - 5, y + 14);
        }
        c.stroke(); c.restore();
      }
      // 4. motes
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < (calm ? 10 : 26); i++) {
        const par = 0.2 + (i % 3) * 0.1, x = mod(i * 131 + (calm ? 0 : t * (4 + (i % 5) * 2)) - cx * par, VW + 60) - 30, y = mod(i * 67 - cy * par * 0.5, VH) + Math.sin(t * 0.7 + i) * 18;
        c.globalAlpha = 0.2 + 0.28 * Math.sin(t * 2 + i) ** 2; c.fillStyle = i % 3 ? '#00d4aa' : '#7b2fff'; const sz = 1.4 + (i % 3) * 0.7; c.fillRect(x, y, sz, sz);
      }
      c.restore();
    }
    // 5. vignette
    c.drawImage(vig, 0, 0);
    // 6. title: slow reticle mandala
    if (G.mode === 'title' && !low) {
      c.save(); c.translate(VW / 2, VH / 2); c.globalCompositeOperation = 'lighter';
      for (let r = 0; r < 5; r++) {
        c.save(); c.rotate(t * 0.08 * (r % 2 ? -1 : 1)); c.strokeStyle = r % 2 ? 'rgba(123,47,255,.28)' : 'rgba(0,212,170,.22)'; c.lineWidth = 2; c.setLineDash([16 + r * 4, 12]);
        c.beginPath(); c.arc(0, 0, 90 + r * 48, 0, 6.2832); c.stroke(); c.restore();
      }
      c.setLineDash([]); c.strokeStyle = 'rgba(241,238,250,.07)'; c.lineWidth = 1;
      for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832 + t * 0.05; c.beginPath(); c.moveTo(Math.cos(a) * 60, Math.sin(a) * 60); c.lineTo(Math.cos(a) * 340, Math.sin(a) * 340); c.stroke(); }
      c.restore();
    }
  };

  ['shadow', 'ground', 'post'].forEach((name) => {
    const f = A[name];
    A[name] = function () { try { return f.apply(A, arguments); } catch (e) { if (!A._err) { A._err = 1; console.warn('HB.Aura.' + name, e); } } };
  });
  return A;
})();
