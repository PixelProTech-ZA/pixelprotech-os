'use strict';
/* HOMEBASE world: tile map, buildings, props, collision queries, and the pre-rendered ground layer. */
HB.World = (function () {
  const T = 32, COLS = 64, ROWS = 48;
  const GRASS = 0, ROAD = 1, WALK = 2, SAND = 3, COURT = 4, WATER = 5, FENCE = 6, WALL = 7, FLOOR = 9;
  const tiles = new Uint8Array(COLS * ROWS), solid = new Uint8Array(COLS * ROWS), occupied = new Uint8Array(COLS * ROWS);
  const I = (x, y) => y * COLS + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
  let ground = null, buildings = [], props = [], trees = [], gateCells = new Set(), gateGroups = [], reachSet = null, hideReach = null;
  const HROADS = [[14, 16], [32, 34]], VROADS = [[20, 22], [42, 44]];
  const SPAWN = { x: 5, y: 13 };

  const BDEFS = [
    { id: 'home', x: 2, y: 5, w: 6, h: 8, roof: '#1c1c26', wall: '#16161d', acc: '#00d4aa', sign: 'PIXEL FIELD OFFICE', sc: '#00d4aa' },
    { id: 'workshop', x: 10, y: 6, w: 7, h: 7, roof: '#0d2a26', wall: '#14141b', acc: '#d8b96a', sign: 'THE WORKSHOP', sc: '#d8b96a' },
    { id: 'spaza', x: 25, y: 6, w: 8, h: 7, roof: '#241a4a', wall: '#15151d', acc: '#7b2fff', sign: 'KWIK STOP', sc: '#f1eefa' },
    { id: 'arcade', x: 34, y: 5, w: 6, h: 8, roof: '#2a1566', wall: '#0f0a22', acc: '#7b2fff', sign: 'UV LOUNGE', sc: '#00d4aa' },
    { id: 'garage', x: 25, y: 22, w: 9, h: 9, roof: '#1c1c26', wall: '#1a1a22', acc: '#d8b96a', sign: 'GEARHEAD GARAGE', sc: '#d8b96a' },
    { id: 'curios', x: 35, y: 24, w: 6, h: 7, roof: '#05372f', wall: '#14141b', acc: '#00d4aa', sign: 'SIGNAL & SCRAP', sc: '#f1eefa' },
    { id: 'pieter', x: 11, y: 36, w: 6, h: 6, roof: '#3a2f14', wall: '#16161d', acc: '#d8b96a', sign: 'HAVEN TAVERN', sc: '#d8b96a' },
    { id: 'pizza', x: 26, y: 37, w: 7, h: 6, roof: '#2a1566', wall: '#15151d', acc: '#7b2fff', sign: 'ROMA PIZZERIA', sc: '#f1eefa' },
    { id: 'lolly', x: 50, y: 7, w: 6, h: 6, roof: '#05372f', wall: '#15151d', acc: '#00d4aa', sign: "KOFI'S COFFEE", sc: '#00d4aa' },
    { id: 'dunehouse', x: 58, y: 36, w: 6, h: 7, roof: '#1c1c26', wall: '#101015', acc: '#00d4aa', sign: 'RELAY STATION 07', sc: '#00d4aa' },
  ];


  /* Gauteng corridor districts, one per block of the town (names from the PixelProTech coverage matrix) */
  const ZONES = [['SANDTON', 'RANDBURG', 'FOURWAYS'], ['ROODEPOORT', 'MIDRAND', 'CENTURION'], ['HATFIELD', 'MENLYN', 'PRETORIA CBD']];
  function zoneAt(px, py) {
    const tx = px / T, ty = py / T;
    const c = tx < 21 ? 0 : tx < 43 ? 1 : 2, r = ty < 15 ? 0 : ty < 33 ? 1 : 2;
    return ZONES[r][c];
  }

  function init() {
    tiles.fill(GRASS); solid.fill(0); occupied.fill(0);
    buildings = []; props = []; trees = []; gateCells = new Set(); gateGroups = [];
    for (let y = 0; y < ROWS; y++) for (let x = 47; x < COLS; x++) tiles[I(x, y)] = SAND;
    // roads, then sidewalks around them
    HROADS.forEach((r) => { for (let y = r[0]; y <= r[1]; y++) for (let x = 0; x < COLS; x++) tiles[I(x, y)] = ROAD; });
    VROADS.forEach((r) => { for (let x = r[0]; x <= r[1]; x++) for (let y = 0; y < ROWS; y++) tiles[I(x, y)] = ROAD; });
    const roadCopy = tiles.slice();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (roadCopy[I(x, y)] === ROAD) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((dx === 0 || dy === 0) && inb(x + dx, y + dy) && roadCopy[I(x + dx, y + dy)] === ROAD) tiles[I(x, y)] = WALK;
      }
    }
    // fence line between town and Dune Lane (gate on road rows)
    for (let y = 0; y < ROWS; y++) {
      const t = tiles[I(46, y)];
      if (t === ROAD || t === WALK) gateCells.add(I(46, y)); else { tiles[I(46, y)] = FENCE; solid[I(46, y)] = 1; }
    }
    gateGroups = [[46, 13, 46, 17], [46, 31, 46, 35]];
    // park: court + pond
    for (let y = 20; y <= 26; y++) for (let x = 2; x <= 9; x++) tiles[I(x, y)] = COURT;
    for (let y = 22; y <= 26; y++) for (let x = 12; x <= 16; x++) { tiles[I(x, y)] = WATER; solid[I(x, y)] = 1; }
    // secret clubhouse room (no door; reached by manhole)
    for (let y = 38; y <= 46; y++) for (let x = 1; x <= 9; x++) {
      const edge = y === 38 || y === 46 || x === 1 || x === 9;
      tiles[I(x, y)] = edge ? WALL : FLOOR; solid[I(x, y)] = edge ? 1 : 0;
    }
    // buildings
    BDEFS.forEach((d) => {
      const b = Object.assign({}, d);
      b.door = { tx: b.x + Math.floor(b.w / 2), ty: b.y + b.h - 1 };
      b.front = { x: (b.door.tx + 0.5) * T, y: (b.door.ty + 1.5) * T };
      buildings.push(b);
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { solid[I(x, y)] = 1; tiles[I(x, y)] = WALL; }
    });
    placeProps();
    computeReach();
  }

  function addProp(k, tx, ty, v, o) {
    if (!inb(tx, ty) || solid[I(tx, ty)] || tiles[I(tx, ty)] === ROAD) { if (HB.G.debugWorld) console.warn('prop skipped', k, tx, ty); return null; }
    const p = Object.assign({ k, v: v || 0, tx, ty, x: (tx + 0.5) * T, y: (ty + 1) * T - 4 }, o || {});
    props.push(p);
    if (!p.pass) solid[I(tx, ty)] = 1;
    occupied[I(tx, ty)] = 1;
    return p;
  }

  function placeProps() {
    const rng = HB.u.seeded(20260);
    // hand-placed props
    const hp = [
      ['crate', 24, 11], ['crate', 24, 12], ['barrel', 33, 12], ['bin', 33, 11], ['mailbox', 8, 13], ['bench', 36, 14, 0, { skip: 1 }],
      ['tyres', 24, 29], ['tyres', 24, 30], ['crate', 35, 22], ['barrel', 34, 22], ['post', 21, 12, 0, { id: 'sign_home' }],
      ['hoop', 1, 23], ['hoop', 10, 23], ['bench', 6, 19], ['bench', 6, 27], ['bench', 14, 20], ['umbrella', 14, 28],
      ['rock', 4, 29], ['rock', 5, 29], ['rock', 3, 29], ['manhole', 9, 28, 0, { pass: 1 }],
      ['braai', 18, 38], ['bin', 10, 41], ['mailbox', 11, 43], ['post', 24, 36],
      ['umbrella', 33, 44], ['crate', 34, 40], ['bench', 20, 45],
      ['rock', 49, 20], ['rock', 52, 22], ['rock', 60, 26], ['rock', 62, 10], ['rock', 57, 28],
      ['umbrella', 56, 14, 0, { skip: 1 }], ['crate', 49, 14], ['barrel', 55, 12], ['post', 47, 12, 0, { id: 'sign_dune' }],
      ['dish', 61, 40, 0], ['crate', 56, 44],
      ['ladder', 5, 39, 0, { pass: 0 }], ['chest', 8, 44], ['desk', 3, 44],
    ];
    hp.forEach((p) => { if (!(p[4] && p[4].skip)) addProp(p[0], p[1], p[2], p[3], p[4]); });
    // lamps along the grass edge of sidewalks
    [[19, 4], [19, 28], [23, 4], [23, 28], [41, 4], [41, 28], [19, 40], [41, 40]].forEach((l) => { addProp('lamp', l[0] - 1 + (l[0] > 30 ? 3 : 0) * 0, l[1]); });
    // cacti & acacias in Dune Lane, trees elsewhere (spaced so they never wall anything off)
    const zones = [
      { x0: 0, y0: 0, x1: 18, y1: 4, p: 0.45, k: 'tree' },
      { x0: 24, y0: 0, x1: 40, y1: 4, p: 0.4, k: 'tree' },
      { x0: 0, y0: 18, x1: 18, y1: 30, p: 0.22, k: 'tree' },
      { x0: 24, y0: 18, x1: 40, y1: 20, p: 0.4, k: 'tree' },
      { x0: 0, y0: 36, x1: 18, y1: 47, p: 0.22, k: 'tree' },
      { x0: 24, y0: 36, x1: 40, y1: 47, p: 0.2, k: 'tree' },
      { x0: 47, y0: 0, x1: 63, y1: 12, p: 0.1, k: 'cactus' },
      { x0: 47, y0: 18, x1: 63, y1: 30, p: 0.1, k: 'cactus' },
      { x0: 47, y0: 36, x1: 63, y1: 47, p: 0.1, k: 'cactus' },
      { x0: 47, y0: 18, x1: 63, y1: 30, p: 0.04, k: 'acacia' },
      { x0: 47, y0: 36, x1: 63, y1: 47, p: 0.04, k: 'acacia' },
    ];
    const near = (tx, ty, d) => { for (let y = ty - d; y <= ty + d; y++) for (let x = tx - d; x <= tx + d; x++) if (inb(x, y) && (solid[I(x, y)] || occupied[I(x, y)]) ) return true; return false; };
    zones.forEach((z) => {
      for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) {
        const t = tiles[I(x, y)];
        if (t !== GRASS && t !== SAND) continue;
        if (rng() > z.p) continue;
        if (near(x, y, 1)) continue; // never touch a wall, prop or another tree (keeps gaps open)
        if (y >= 13 && y <= 17 && (x > 45)) continue;
        const p = addProp(z.k, x, y, Math.floor(rng() * 3), { y2: 0 });
        if (p) trees.push(p);
      }
    });
    // keep clear areas near doors / NPC spots
    props = props.filter((p) => {
      const keep = BDEFS.every((b) => !(p.k !== 'post' && p.tx >= b.x - 1 && p.tx <= b.x + b.w && p.ty >= b.y + b.h && p.ty <= b.y + b.h + 2));
      if (!keep) { solid[I(p.tx, p.ty)] = 0; occupied[I(p.tx, p.ty)] = 0; }
      return keep;
    });
  }

  /* ---- reachability (4-neighbour over walkable tiles, gate treated as open) ---- */
  function bfs(sx, sy) {
    const seen = new Uint8Array(COLS * ROWS), q = [I(sx, sy)];
    seen[q[0]] = 1;
    while (q.length) {
      const c = q.pop(), x = c % COLS, y = (c / COLS) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => {
        const nx = x + d[0], ny = y + d[1];
        if (!inb(nx, ny)) return;
        const n = I(nx, ny);
        if (seen[n] || solid[n]) return;
        seen[n] = 1; q.push(n);
      });
    }
    return seen;
  }
  function computeReach() { reachSet = bfs(SPAWN.x, SPAWN.y); hideReach = bfs(5, 42); }

  function nearestFree(tx, ty, region, avoidRoad) {
    const set = region === 'hide' ? hideReach : reachSet;
    for (let r = 0; r < 12; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if (!inb(x, y)) continue;
        const i = I(x, y);
        if (!set[i] || solid[i] || (avoidRoad && tiles[i] === ROAD)) continue;
        return { tx: x, ty: y, x: (x + 0.5) * T, y: (y + 0.5) * T };
      }
    }
    return { tx, ty, x: (tx + 0.5) * T, y: (ty + 0.5) * T };
  }

  /* ---- collision ---- */
  function gateClosed() { return !HB.S || !HB.S.flags.gateOpen; }
  function solidAt(tx, ty) {
    if (!inb(tx, ty)) return true;
    const i = I(tx, ty);
    return solid[i] === 1 || (gateCells.has(i) && gateClosed());
  }
  function rectSolid(cx, cy, hw, hh) {
    const x0 = Math.floor((cx - hw) / T), x1 = Math.floor((cx + hw - 0.01) / T), y0 = Math.floor((cy - hh) / T), y1 = Math.floor((cy + hh - 0.01) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y)) return true;
    return false;
  }
  function circleSolid(cx, cy, r) {
    const x0 = Math.floor((cx - r) / T), x1 = Math.floor((cx + r) / T), y0 = Math.floor((cy - r) / T), y1 = Math.floor((cy + r) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!solidAt(x, y)) continue;
      const nx = HB.u.clamp(cx, x * T, x * T + T), ny = HB.u.clamp(cy, y * T, y * T + T);
      if ((cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r) return true;
    }
    return false;
  }
  const tileAt = (px, py) => { const x = Math.floor(px / T), y = Math.floor(py / T); return inb(x, y) ? tiles[I(x, y)] : GRASS; };

  /* ---------------- ground layer rendering ---------------- */
  function renderGround() {
    const [cv, g] = HB.Gfx.mk(COLS * T, ROWS * T);
    const rng = HB.u.seeded(77);
    const F = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = tiles[I(x, y)], px = x * T, py = y * T, r = rng();
      switch (t) {
        case GRASS: case WALL: F(px, py, T, T, r < 0.5 ? '#0b1412' : '#0c1614');
          if (r < 0.3) { F(px + 6 + (r * 40 | 0), py + 8, 2, 3, '#0f2420'); F(px + 20, py + 20, 2, 3, '#0f2420'); }
          if (r > 0.95) { F(px + 10, py + 14, 2, 2, '#05372f'); } break;
        case SAND: F(px, py, T, T, r < 0.5 ? '#15121f' : '#171424'); if (r < 0.35) F(px + 8 + (r * 30 | 0), py + 10, 3, 2, '#1d1a2e'); if (r > 0.95) F(px + 14, py + 20, 4, 3, '#262332'); break;
        case ROAD: F(px, py, T, T, '#101015'); if (r < 0.25) F(px + 6 + (r * 60 | 0), py + 9, 2, 1, '#16161d'); break;
        case WALK: F(px, py, T, T, '#1a1a22'); F(px, py + 31, T, 1, '#22202a'); F(px + 31, py, 1, T, '#22202a'); if (r < 0.2) F(px + 8, py + 8, 2, 2, '#1f1f28'); break;
        case COURT: F(px, py, T, T, '#1d1245'); if ((x + y) % 2) F(px, py, T, T, '#201650'); break;
        case WATER: F(px, py, T, T, r < 0.5 ? '#06242a' : '#08303a'); break;
        case FENCE: F(px, py, T, T, x >= 47 ? '#15121f' : '#0b1412'); break;
        case FLOOR: F(px, py, T, T, '#6b5625'); F(px, py + 15, T, 1, '#4b3c18'); F(px + (y % 2 ? 8 : 20), py, 1, 15, '#4b3c18'); F(px + (y % 2 ? 22 : 6), py + 16, 1, 16, '#4b3c18'); break;
        default: break;
      }
    }
    // lane markings and zebras
    HROADS.forEach((rr) => {
      const mid = rr[0] + 1;
      for (let x = 0; x < COLS; x++) {
        if (tiles[I(x, mid)] === ROAD && !(x >= 19 && x <= 23) && !(x >= 41 && x <= 45)) F(x * T + 6, mid * T + 14, 20, 3, '#3a3320');
        F(x * T, rr[0] * T, T, 2, '#22202a'); F(x * T, (rr[1] + 1) * T - 2, T, 2, '#22202a');
      }
    });
    VROADS.forEach((rr) => {
      const mid = rr[0] + 1;
      for (let y = 0; y < ROWS; y++) {
        if (!(y >= 13 && y <= 17) && !(y >= 31 && y <= 35)) F(mid * T + 14, y * T + 6, 3, 20, '#3a3320');
        F(rr[0] * T, y * T, 2, T, '#22202a'); F((rr[1] + 1) * T - 2, y * T, 2, T, '#22202a');
      }
    });
    VROADS.forEach((vr) => HROADS.forEach((hr) => {
      // zebra crossings just outside each intersection
      for (let k = 0; k < 3; k++) { for (let s = 0; s < 4; s++) { F((vr[0] + k) * T + 2, (hr[0] - 1) * T + 0 + s * 0, 0, 0, '#f1eefa'); } }
      const zb = (x0, y0, horiz) => { for (let s = 0; s < 6; s++) { if (horiz) F(x0 + s * 5 + 1, y0, 3, 28, '#c9c3db'); } };
      // west & east sides on horizontal road (stripes run along road rows)
      for (let r = hr[0]; r <= hr[1]; r++) { for (let s = 0; s < 6; s++) { F((vr[0] - 1) * T + 2 + s * 5, r * T + 2, 3, 28, 'rgba(154,144,184,.30)'); F((vr[1] + 1) * T + 2 + s * 5, r * T + 2, 3, 28, 'rgba(154,144,184,.30)'); } }
      for (let c = vr[0]; c <= vr[1]; c++) { for (let s = 0; s < 6; s++) { F(c * T + 2, (hr[0] - 1) * T + 2 + s * 5, 28, 3, 'rgba(154,144,184,.30)'); F(c * T + 2, (hr[1] + 1) * T + 2 + s * 5, 28, 3, 'rgba(154,144,184,.30)'); } }
      void zb;
    }));
    // court lines
    const cx0 = 2 * T, cy0 = 20 * T, cw = 8 * T, ch = 7 * T;
    g.strokeStyle = '#7b2fff'; g.lineWidth = 3; g.strokeRect(cx0 + 6, cy0 + 6, cw - 12, ch - 12);
    g.beginPath(); g.moveTo(cx0 + cw / 2, cy0 + 6); g.lineTo(cx0 + cw / 2, cy0 + ch - 6); g.stroke();
    g.beginPath(); g.arc(cx0 + cw / 2, cy0 + ch / 2, 26, 0, 7); g.stroke();
    // pond rim
    g.strokeStyle = '#2c166a'; g.lineWidth = 3; g.strokeRect(12 * T + 1, 22 * T + 1, 5 * T - 2, 5 * T - 2);
    for (let i = 0; i < 4; i++) { F(11 * T + 6 + i * 8, 22 * T - 3, 6, 3, '#363246'); F(17 * T - 6 - i * 8, 27 * T, 6, 3, '#363246'); }
    // fences
    for (let y = 0; y < ROWS; y++) if (tiles[I(46, y)] === FENCE) { const px = 46 * T, py = y * T; F(px + 8, py, 16, T, '#443615'); F(px + 10, py, 12, T, '#735d29'); F(px + 12, py + 4, 8, 2, '#a6883e'); F(px + 12, py + 18, 8, 2, '#a6883e'); }
    // hideout bricks
    for (let y = 38; y <= 46; y++) for (let x = 1; x <= 9; x++) if (tiles[I(x, y)] === WALL) { const px = x * T, py = y * T; F(px, py, T, T, '#493a17'); for (let r = 0; r < 4; r++) { F(px, py + r * 8, T, 1, '#392e12'); F(px + ((r + x) % 2 ? 8 : 20), py + r * 8, 1, 8, '#392e12'); } }
    F(2 * T, 39 * T, 7 * T, 2, 'rgba(0,0,0,.25)');
    // rugs in hideout
    F(3 * T, 41 * T, 3 * T, 2 * T, '#4e21ab'); F(3 * T + 4, 41 * T + 4, 3 * T - 8, 2 * T - 8, '#7a2ffc');
    buildings.forEach((b) => drawBuilding(g, b));
    return cv;
  }

  function drawBuilding(g, b) {
    const px = b.x * T, py = b.y * T, w = b.w * T, h = b.h * T, fh = 76, OUT = HB.Gfx.OUT, sh = HB.Gfx.shade;
    const F = (a, c, d, e, f) => { g.fillStyle = f; g.fillRect(a, c, d, e); };
    const R = (a, c, d, e, f) => { g.fillStyle = OUT; g.fillRect(a - 1, c - 1, d + 2, e + 2); g.fillStyle = f; g.fillRect(a, c, d, e); };
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(px + 8, py + 10, w, h);
    const roofH = h - fh + 8;
    R(px - 4, py, w + 8, roofH, b.roof);
    for (let y = 8; y < roofH - 4; y += 10) { F(px - 4, py + y, w + 8, 2, sh(b.roof, -26)); }
    F(px - 4, py, w + 8, 4, sh(b.roof, 30)); F(px - 4, py + roofH - 5, w + 8, 5, sh(b.roof, -40));
    const rng = HB.u.seeded(b.x * 31 + b.y);
    roofDeco(g, b, px, py, w, roofH, rng, R, F);
    // facade
    const fy = py + h - fh;
    R(px, fy + 6, w, fh - 6, b.wall); F(px, fy + 6, w, 4, sh(b.wall, -30)); F(px, py + h - 8, w, 8, sh(b.wall, -50));
    const dx = px + w / 2 - 15, dy = py + h - 48;
    const wins = Math.max(0, Math.floor((w - 80) / 66));
    for (let i = 0; i < 2; i++) for (let k = 0; k < Math.max(1, wins); k++) {
      const wx = i === 0 ? px + 12 + k * 52 : px + w - 12 - 30 - k * 52;
      if (wx + 30 > dx - 6 && wx < dx + 36) continue;
      R(wx, fy + 26, 30, 26, '#00c69f'); F(wx + 2, fy + 28, 26, 4, '#4de6c7'); F(wx + 14, fy + 26, 2, 26, OUT); F(wx - 2, fy + 52, 34, 4, sh(b.wall, -60));
      F(wx + 3, fy + 40, 6, 10, b.acc); F(wx + 20, fy + 40, 6, 10, b.acc);
    }
    // awning + door
    R(dx - 8, dy - 12, 46, 12, '#f1eefa');
    for (let s = 0; s < 6; s++) F(dx - 8 + s * 8, dy - 12, 4, 12, b.acc);
    R(dx, dy, 30, 48, sh(b.acc, -20)); F(dx + 3, dy + 4, 24, 14, '#00cea5'); F(dx + 3, dy + 22, 24, 22, sh(b.acc, -35)); F(dx + 22, dy + 26, 3, 3, '#a5863e');
    // sign board
    const txt = b.sign; g.font = 'bold 10px "Courier New", monospace';
    const sw = Math.min(w - 4, Math.max(70, g.measureText(txt).width + 16)), sx = px + (w - sw) / 2;
    R(sx, fy + 8, sw, 17, '#190d3b'); F(sx + 2, fy + 10, sw - 4, 1, 'rgba(255,255,255,.25)');
    g.fillStyle = b.sc; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, px + w / 2, fy + 17.5); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    // steps
    F(dx - 4, py + h - 4, 38, 4, '#343044');
  }

  function roofDeco(g, b, px, py, w, rh, rng, R, F) {
    switch (b.id) {
      case 'home': R(px + 14, py + 12, 14, 24, '#483a17'); F(px + 14, py + 12, 14, 4, '#362b11'); // chimney
        R(px + w - 54, py + 20, 36, 22, '#251359'); for (let i = 0; i < 3; i++) F(px + w - 52 + i * 12, py + 22, 10, 18, '#5724bb'); // solar
        R(px + w / 2 - 2, py + 34, 4, 22, '#2e2b3c'); F(px + w / 2 - 14, py + 38, 28, 2, '#2e2b3c'); F(px + w / 2 - 10, py + 46, 20, 2, '#2e2b3c'); break;
      case 'workshop': R(px + 12, py + 8, 20, 36, '#b6aecd'); g.fillStyle = '#8a7032'; g.beginPath(); g.moveTo(px + 12, py + 8); g.lineTo(px + 22, py - 12); g.lineTo(px + 32, py + 8); g.fill();
        F(px + 18, py + 20, 8, 8, '#00c69f'); F(px + 12, py + 36, 20, 4, '#8c7233'); F(px + 12, py + 40, 6, 6, '#14141b');
        R(px + w - 44, py + 14, 30, 20, '#3c374e'); g.fillStyle = '#d3cee3'; g.beginPath(); g.arc(px + w - 29, py + 24, 12, 0, 7); g.fill(); F(px + w - 40, py + 36, 24, 3, '#0d0d12'); break;
      case 'spaza': R(px + 18, py + 8, w - 36, 22, '#f1eefa'); F(px + 20, py + 10, w - 40, 18, '#5523b8'); g.fillStyle = '#f1eefa'; g.font = 'bold 12px "Courier New",monospace'; g.textAlign = 'center'; g.fillText('COLD DRINKS • AIRTIME • BREAD', px + w / 2, py + 23); g.textAlign = 'left';
        R(px + w - 30, py + 34, 14, 14, '#b99a4f'); g.fillStyle = '#8d53ff'; g.beginPath(); g.arc(px + w - 23, py + 32, 9, 0, 7); g.fill(); break;
      case 'arcade': { const pat = ['0010000100', '0001001000', '0011111100', '0110110110', '1111111111', '1011111101', '1010000101', '0001101000']; pat.forEach((rw, y) => [...rw].forEach((c, x) => { if (c === '1') F(px + 14 + x * 4, py + 10 + y * 4, 4, 4, '#00c69f'); })); F(px + 10, py + 6, 50, 3, '#8543ff'); break; }
      case 'garage': for (let i = 0; i < 4; i++) F(px + 10 + i * 24, py + 4, 12, rh - 14, sh2(b.roof, 15)); R(px + w - 50, py + 18, 36, 14, '#2e2b3c'); F(px + w - 46, py + 22, 28, 6, '#0d0d12'); R(px + 14, py + 30, 20, 20, '#0c0c10'); R(px + 20, py + 36, 8, 8, '#20202b'); R(px + 40, py + 36, 20, 20, '#0c0c10'); R(px + 46, py + 42, 8, 8, '#20202b'); break;
      case 'curios': g.fillStyle = OUTC(); g.beginPath(); g.arc(px + w / 2, py + 28, 16, 0, 7); g.fill(); g.fillStyle = '#9a6cff'; g.beginPath(); g.arc(px + w / 2, py + 28, 14, 0, 7); g.fill(); F(px + w / 2 - 6, py + 20, 5, 5, 'rgba(255,255,255,.7)');
        for (let i = 0; i < 3; i++) { F(px + 14 + i * 40, py + 10, 8, 5, '#0b0b0e'); F(px + 18 + i * 40, py + 8, 3, 3, '#f1eefa'); } break;
      case 'pieter': R(px + w - 30, py + 10, 14, 22, '#483a17'); for (let i = 0; i < 6; i++) F(px + 10 + i * 20, py + 6, 2, 16, '#2b230e'); break;
      case 'pizza': { g.fillStyle = OUTC(); g.beginPath(); g.moveTo(px + w / 2, py + 62); g.lineTo(px + w / 2 - 26, py + 4); g.lineTo(px + w / 2 + 26, py + 4); g.fill(); g.fillStyle = '#a5863e'; g.beginPath(); g.moveTo(px + w / 2, py + 58); g.lineTo(px + w / 2 - 22, py + 8); g.lineTo(px + w / 2 + 22, py + 8); g.fill(); g.fillStyle = '#8a7032'; [[-8, 18], [8, 24], [0, 38]].forEach((c) => { g.beginPath(); g.arc(px + w / 2 + c[0], py + c[1], 5, 0, 7); g.fill(); }); break; }
      case 'lolly': g.fillStyle = OUTC(); g.beginPath(); g.arc(px + w / 2, py + 26, 18, 0, 7); g.fill(); ['#8d53ff', '#f1eefa', '#a5863e'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(px + w / 2, py + 26, 16 - i * 5, 0, 7); g.fill(); }); R(px + w / 2 - 3, py + 42, 6, 18, '#b99a4f'); break;
      case 'dunehouse': g.fillStyle = OUTC(); g.beginPath(); g.arc(px + w / 2, py + rh - 6, 40, Math.PI, 0); g.fill(); g.fillStyle = '#c9b5ff'; g.beginPath(); g.arc(px + w / 2, py + rh - 6, 37, Math.PI, 0); g.fill(); F(px + w / 2 - 3, py + rh - 44, 6, 36, '#0d0d12'); R(px + 20, py + 20, 24, 8, '#16161e'); break;
      default: break;
    }
  }
  const OUTC = () => HB.Gfx.OUT;
  const sh2 = (c, a) => HB.Gfx.shade(c, a);

  return {
    T, COLS, ROWS, GRASS, ROAD, WALK, SAND, COURT, WATER, FENCE, WALL, FLOOR, SPAWN,
    init, renderGround, zoneAt, ZONES, solidAt, rectSolid, circleSolid, tileAt, nearestFree,
    get ground() { return ground; }, set ground(v) { ground = v; },
    get buildings() { return buildings; }, get props() { return props; },
    get reachSet() { return reachSet; }, get hideReach() { return hideReach; },
    gateGroups: () => gateGroups, gateCells: () => gateCells,
    isRoad: (px, py) => tileAt(px, py) === ROAD,
    building: (id) => buildings.find((b) => b.id === id),
    I, inb, solidArr: solid,
  };
})();
