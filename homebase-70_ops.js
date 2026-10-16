'use strict';
/* HOMEBASE: Field Operations. Mission engine: eight story missions mapped to The Pixel Method
   (01 Request, 02 Assess, 03 Diagnose, 04 Approve, 05 Repair, 06 Test, 07 Document, 08 Handover), then repeatable contracts. */
HB.Missions = (function () {
  const U = HB.u, G = HB.G, E = HB.E, C = HB.Combat, T = 32;
  const M = { cur: null };
  const px = (t) => (t + 0.5) * T;
  const pos = () => E.player.vehicle || E.player;
  const KESSLER = { name: 'KESSLER', look: { skin: 0, hair: '#d8d8d8', hairStyle: 'short', shirt: '#f1eefa', vest: '#8a7640', stripe: '#d8b96a', glasses: '#d8b96a', pants: '#07070a' } };
  const LAWYER = { name: 'K. LAWYER (PHONE)', look: { skin: 1, hair: '#07070a', hairStyle: 'short', shirt: '#16161d', stripe: '#d8b96a', glasses: '#d8b96a', pants: '#07070a' } };

  /* ---------------- story ---------------- */
  const STORY = [
    { id: 'm1', num: '01', chapter: 'REQUEST', name: 'COLD CALL', pay: 800, stages: [
      { t: 'say', who: 'nandi', lines: ['Operator. A client walked in off the street with a shaking hand. Mr Venter.', 'His courier was running thirty years of client backups to a data room in Centurion. The Kessler Crew hijacked the van.', 'Kessler runs this corridor. Gold jackets, short tempers. They do not take invoices.', 'Venter is waiting south of the Haven Tavern. Aim with the mouse, fire with click or J, reload with R. Stay alive.'] },
      { t: 'goto', x: 17, y: 42, r: 80, label: 'MEET MR VENTER (SOUTH OF THE TAVERN)' },
      { t: 'say', who: 'venter', lines: ['Every client file I own. Thirty years.', 'They said they would trade it back for money. Then they stopped answering the phone.', 'Careful. They followed me here.'] },
      { t: 'kill', label: 'CLEAR THE AMBUSH', spawn: [{ type: 'thug', n: 3, ring: 330 }] },
      { t: 'say', who: 'venter', lines: ['Thank you. One of them dropped a pager slip. Gearhead Garage, east side.', 'Go and look. Do not be seen.'] },
    ] },
    { id: 'm2', num: '02', chapter: 'ASSESS', name: 'RECON', pay: 1200, stages: [
      { t: 'say', who: 'nandi', lines: ['Assess before you act. Get eyes on Gearhead Garage and pull whatever intel you can.', 'Expect guards. They will notice you if you wander into their line of sight.'] },
      { t: 'goto', x: 29, y: 31, r: 90, label: 'REACH GEARHEAD GARAGE' },
      { t: 'collect', label: 'SECURE THE INTEL CHIPS', chips: [[26, 31], [32, 31], [36, 32]], spawn: [{ type: 'thug', x: 24, y: 31 }, { type: 'thug', x: 31, y: 33 }, { type: 'thug', x: 37, y: 31 }, { type: 'heavy', x: 29, y: 33 }] },
      { t: 'say', who: 'nandi', lines: ['Chips received. They map Kessler courier routes. Every road points east.', 'Take the bakkie next. It is parked by the office.'] },
    ] },
    { id: 'm3', num: '03', chapter: 'DIAGNOSE', name: 'SIGNAL TRACE', pay: 1500, stages: [
      { t: 'say', who: 'nandi', lines: ['Diagnose the fault, not the symptom. The chips point to Relay Station 07 in the east sands.', 'Kessler is bouncing stolen drive images through it. Drive there. The bakkie and the buggy are both out front.'] },
      { t: 'goto', x: 56, y: 43, r: 110, veh: true, label: 'DRIVE TO RELAY STATION 07 (EAST SANDS)' },
      { t: 'kill', label: 'CLEAR THE STATION', spawn: [{ type: 'thug', n: 4, ring: 300 }, { type: 'heavy', n: 1, ring: 340 }] },
      { t: 'collect', label: 'PULL THE TRACE LOGS', chips: [[55, 39], [53, 45]] },
      { t: 'say', who: 'nandi', lines: ['That is the trace. Forty client names on those drives. Venter is one of forty.', 'Kessler is not just a thief. He is selling people their own data back.'] },
    ] },
    { id: 'm4', num: '04', chapter: 'APPROVE', name: 'THE OFFER', pay: 1500, stages: [
      { t: 'say', who: 'nandi', lines: ['Kessler lawyer just called. He is offering R2 500 and Venter\'s drives if you walk away. Clean cash, no questions.', 'Approval is yours, Operator. Nothing moves without your word.'], choices: [{ label: 'TAKE THE BUYOUT', set: 'a' }, { label: 'REFUSE. GO LOUD', set: 'b' }] },
      { t: 'branch', map: {
        a: [
          { t: 'say', who: LAWYER, lines: ['Sensible. The money is in your account.', 'A word of warning: the notes were marked. I made a call. Run.'] },
          { t: 'fn', fn: () => { HB.addCoins(2500); C.setHeat(2, 0); HB.UI.toast('MARKED CASH · HEAT 2', 'warn'); } },
          { t: 'escape', heat: 2, label: 'LOSE THE POLICE (HEAT 2)' },
        ],
        b: [
          { t: 'say', who: 'nandi', lines: ['Understood. They will send heavies to teach you manners.', 'Make them regret the postage.'] },
          { t: 'kill', label: 'DEFEAT THE HEAVIES', spawn: [{ type: 'heavy', n: 3, ring: 340 }, { type: 'thug', n: 2, ring: 380 }] },
          { t: 'fn', fn: () => { HB.S.armor = 100; C.heal(100); const w = HB.S.weap; [1, 2, 3].forEach((i) => { if (w.owned[i]) w.ammo[i] = Math.min(400, w.ammo[i] + C.WEAP[i].ammoPer); }); HB.UI.toast('LOOT: ARMOR 100 · AMMO RESTOCKED', 'good'); } },
        ],
      } },
    ] },
    { id: 'm5', num: '05', chapter: 'REPAIR', name: 'HOLD THE LINE', pay: 1800, stages: [
      { t: 'say', who: 'nandi', lines: ['Repair means holding the system together while it is under load.', 'Kessler knows where we run from. They are coming to the office. Stock up with Sizwe at the armoury first.'] },
      { t: 'goto', x: 13, y: 14, r: 70, label: 'VISIT SIZWE AT THE ARMOURY (SPEND YOUR CASH)' },
      { t: 'survive', secs: 55, label: 'HOLD THE OFFICE STREET', waves: [
        { at: 0, spawn: [{ type: 'thug', n: 3, ring: 400 }] },
        { at: 14, spawn: [{ type: 'thug', n: 2, ring: 420 }, { type: 'heavy', n: 1, ring: 440 }] },
        { at: 32, spawn: [{ type: 'thug', n: 4, ring: 420 }] },
        { at: 44, spawn: [{ type: 'heavy', n: 2, ring: 450 }] },
      ] },
      { t: 'say', who: 'nandi', lines: ['Line held. Test them next: I need to know how the corridor behaves when the police join in.'] },
    ] },
    { id: 'm6', num: '06', chapter: 'TEST', name: 'HEAT TEST', pay: 2000, stages: [
      { t: 'say', who: 'nandi', lines: ['A patrolman on Kessler payroll will radio you in the moment you misbehave. Good. Test the system under pressure.', 'Fire a few rounds near his unit. Then lose them. Lines of sight, side streets, distance.'] },
      { t: 'fn', fn: () => { C.setHeat(3, 0); HB.UI.toast('FLAGGED BY THE PAYROLL PATROL · HEAT 3', 'warn'); } },
      { t: 'escape', heat: 3, label: 'LOSE THE POLICE (HEAT 3)' },
      { t: 'say', who: 'nandi', lines: ['Clean break. That is what a stress test is for.', 'Document everything next. Kessler keeps a ledger on site in the east sands.'] },
    ] },
    { id: 'm7', num: '07', chapter: 'DOCUMENT', name: 'PAPER TRAIL', pay: 2500, stages: [
      { t: 'say', who: 'nandi', lines: ['If it is not documented it did not happen. Kessler ledger pages are on four chips inside his compound.', 'Eight guns minimum. Load up before you go.'] },
      { t: 'goto', x: 50, y: 24, r: 100, label: 'APPROACH THE KESSLER COMPOUND (EAST SANDS)' },
      { t: 'collect', label: 'COLLECT THE LEDGER CHIPS', chips: [[54, 21], [59, 22], [54, 28], [60, 28]], spawn: [{ type: 'thug', x: 52, y: 23 }, { type: 'thug', x: 57, y: 21 }, { type: 'thug', x: 55, y: 26 }, { type: 'thug', x: 59, y: 26 }, { type: 'thug', x: 57, y: 29 }, { type: 'thug', x: 61, y: 24 }, { type: 'heavy', x: 56, y: 24 }, { type: 'heavy', x: 59, y: 29 }] },
      { t: 'say', who: 'nandi', lines: ['Ledger secured. Names, dates, amounts. It is enough.', 'Last chapter. Kessler himself. Finish it.'] },
    ] },
    { id: 'm8', num: '08', chapter: 'HANDOVER', name: 'KESSLER', pay: 4000, stages: [
      { t: 'say', who: 'nandi', lines: ['Handover: the job is not finished until the client has what is his.', 'Kessler has the last drive. He is at the compound. End this.'] },
      { t: 'goto', x: 52, y: 26, r: 90, label: 'ENTER THE KESSLER COMPOUND' },
      { t: 'say', who: KESSLER, lines: ['A repair shop with a gun. How charming.', 'Those drives are my pension. Every name on them is a payment, every month, forever.', 'Boys. Show him what a pension looks like.'] },
      { t: 'kill', label: 'DEFEAT KESSLER', spawn: [{ type: 'boss', x: 57, y: 25, boss: true, name: 'KESSLER' }, { type: 'thug', n: 4, ring: 300 }, { type: 'heavy', n: 2, ring: 340 }] },
      { t: 'fn', fn: () => { C.setHeat(2, 0); HB.UI.toast('ALARM RAISED · HEAT 2', 'warn'); } },
      { t: 'goto', x: 17, y: 42, r: 80, label: 'DELIVER THE DRIVES TO MR VENTER' },
      { t: 'say', who: 'venter', lines: ['My files. All of them. Thirty years.', 'I do not have the words. Tell your people at PixelProTech: diagnosed, repaired, tested, documented, handed over.', 'That is the method, is it not? Thank you, Operator.'] },
    ] },
  ];

  const SPOTS = [
    { x: 56, y: 24, n: 'EAST SANDS' }, { x: 29, y: 31, n: 'GEARHEAD GARAGE' }, { x: 17, y: 41, n: 'HAVEN TAVERN' },
    { x: 30, y: 19, n: 'MIDRAND CROSSING' }, { x: 6, y: 23, n: 'ROODEPOORT COURTS' }, { x: 30, y: 4, n: 'KWIK STOP ROW' }, { x: 52, y: 42, n: 'RELAY STATION APPROACH' },
  ];
  function contract() {
    const n = HB.S.ops.contracts, pay = 600 + 150 * Math.min(n, 10), sp = U.pick(SPOTS), kind = U.pick(['clear', 'sweep', 'hold']);
    const base = { id: 'c' + n, num: 'C' + (n + 1), chapter: 'CONTRACT', pay, contract: true };
    if (kind === 'clear') return Object.assign(base, { name: 'CLEAR: ' + sp.n, stages: [{ t: 'goto', x: sp.x, y: sp.y, r: 90, label: 'GO TO ' + sp.n }, { t: 'kill', label: 'ELIMINATE THE CREW', spawn: [{ type: 'thug', n: 3 + Math.min(4, n), ring: 320 }, { type: 'heavy', n: 1 + (n > 3 ? 1 : 0), ring: 360 }] }] });
    if (kind === 'sweep') return Object.assign(base, { name: 'SWEEP: ' + sp.n, stages: [{ t: 'goto', x: sp.x, y: sp.y, r: 90, label: 'GO TO ' + sp.n }, { t: 'collect', label: 'RECOVER THE CHIPS', chips: [[sp.x - 3, sp.y - 2], [sp.x + 3, sp.y + 2], [sp.x, sp.y + 4]], spawn: [{ type: 'thug', n: 3 + Math.min(3, n), ring: 260 }] }] });
    return Object.assign(base, { name: 'HOLD: ' + sp.n, stages: [{ t: 'goto', x: sp.x, y: sp.y, r: 90, label: 'GO TO ' + sp.n }, { t: 'survive', secs: 40, label: 'HOLD THE POSITION', waves: [{ at: 0, spawn: [{ type: 'thug', n: 3, ring: 380 }] }, { at: 14, spawn: [{ type: 'thug', n: 3, ring: 400 }, { type: 'heavy', n: 1, ring: 420 }] }, { at: 28, spawn: [{ type: 'thug', n: 3 + Math.min(3, n), ring: 400 }] }] }] });
  }

  /* ---------------- engine ---------------- */
  const nextDef = () => (HB.S.ops.i < STORY.length ? STORY[HB.S.ops.i] : null);
  M.nextDef = nextDef;
  M.done = (id) => HB.S.ops.done.indexOf(id) >= 0;
  M.active = (id) => !!(M.cur && M.cur.def.id === id);

  function speak(who, lines, opts) {
    if (typeof who === 'string') return HB.UI.say(who, lines, opts);
    return HB.UI.dialog(who.name, who.look, lines, opts);
  }
  function spawnSpec(m, s, tag) {
    const P = pos();
    (s.spawn || []).forEach((sp) => {
      const n = sp.n || 1;
      for (let k = 0; k < n; k++) {
        let x, y;
        if (sp.ring) { const a = Math.random() * 6.283; x = P.x + Math.cos(a) * sp.ring; y = P.y + Math.sin(a) * sp.ring; x = U.clamp(x, 48, HB.World.COLS * T - 48); y = U.clamp(y, 48, HB.World.ROWS * T - 48); }
        else { x = px(sp.x); y = px(sp.y); }
        C.spawn(sp.type, x, y, { tag, aggro: s.aggro !== undefined ? s.aggro : !!sp.ring, boss: sp.boss, name: sp.name });
      }
    });
  }
  function enter(s) {
    const m = M.cur; m.s = s; m.t = 0; m.waveI = 0; m.tag = m.def.id + '.' + m.i;
    switch (s.t) {
      case 'say': {
        const o = { onEnd: () => M.next() };
        if (s.choices) o.choices = s.choices.map((ch) => ({ label: ch.label, fn: () => { m.data.choice = ch.set; M.next(); } }));
        speak(s.who, s.lines, o); break;
      }
      case 'goto': m.cp = m.i; s.px = px(s.x); s.py = px(s.y); break;
      case 'kill': m.cp = m.cp === undefined ? m.i : m.cp; spawnSpec(m, s, m.tag); break;
      case 'collect': m.chips = s.chips.map((c) => ({ x: px(c[0]), y: px(c[1]), got: false, t: Math.random() * 6 })); spawnSpec(m, s, m.tag); break;
      case 'survive': break;
      case 'escape': if (C.heat < s.heat) C.setHeat(s.heat, 0); m.t = 0; break;
      case 'fn': try { s.fn(m); } catch (e) { HB.reportError(e); } M.next(); break;
      case 'branch': { const sub = s.map[m.data.choice || 'a'] || []; m.stages.splice(m.i + 1, 0, ...sub); M.next(); break; }
      default: M.next();
    }
  }
  M.next = function () {
    const m = M.cur; if (!m) return;
    m.i++;
    if (m.i >= m.stages.length) return finish();
    enter(m.stages[m.i]);
  };
  function finish() {
    const m = M.cur, d = m.def, S = HB.S;
    C.clear(); C.boss = null; m.chips = null;
    HB.addCoins(d.pay);
    if (d.contract) S.ops.contracts++; else { if (S.ops.done.indexOf(d.id) < 0) S.ops.done.push(d.id); S.ops.i = Math.max(S.ops.i, STORY.indexOf(d) + 1); }
    HB.UI.cine('MISSION COMPLETE', d.name, '+ R' + d.pay, 2800); HB.Audio.sfx('win');
    M.cur = null;
    HB.Game.snapshot(); HB.Save.write(); HB.UI.refreshHud();
    if (!d.contract && S.ops.i >= STORY.length) setTimeout(() => HB.UI.toast('STORY COMPLETE · CONTRACTS UNLOCKED AT DISPATCH', 'good'), 3000);
  }
  M.start = function (def) {
    if (M.cur) return;
    M.cur = { def, stages: def.stages.slice(), i: -1, data: {}, t: 0, s: null, cp: undefined, chips: null };
    HB.UI.cine('CHAPTER ' + def.num + ' · ' + def.chapter, def.name, def.contract ? 'PIXELPROTECH FIELD CONTRACT' : 'THE PIXEL METHOD', 3200);
    setTimeout(() => { if (M.cur && M.cur.i < 0) M.next(); }, 1500);
    HB.UI.refreshHud();
  };
  M.retry = function () {
    const m = M.cur; if (!m) return;
    C.clear(); m.chips = null;
    m.i = (m.cp !== undefined ? m.cp : 0) - 1; M.next();
    HB.UI.toast('CHECKPOINT · TRY AGAIN', 'warn');
  };
  M.abort = function () { if (!M.cur) return; C.clear(); C.clearHeat(); M.cur = null; HB.UI.refreshHud(); HB.UI.toast('ASSIGNMENT ABANDONED', 'warn'); };

  M.update = function (dt) {
    const m = M.cur; if (!m || !m.s || G.mode !== 'play') return;
    const s = m.s, P = pos(); m.t += dt;
    switch (s.t) {
      case 'goto': {
        const d = Math.hypot(P.x - s.px, P.y - s.py);
        if (s.veh && !E.player.vehicle) { m.hint = 'GET IN A VEHICLE'; break; } m.hint = '';
        if (d < s.r) M.next(); break;
      }
      case 'kill': if (C.count(m.tag) === 0 && m.t > 0.3) M.next(); break;
      case 'collect': {
        let left = 0; m.chips.forEach((c) => { if (!c.got) { if (Math.hypot(P.x - c.x, P.y - c.y) < 30) { c.got = true; HB.Audio.sfx('check'); HB.UI.toast('CHIP SECURED ' + m.chips.filter((q) => q.got).length + '/' + m.chips.length, 'good'); } else left++; } });
        if (!left) M.next(); break;
      }
      case 'survive': {
        while (m.waveI < s.waves.length && m.t >= s.waves[m.waveI].at) { spawnSpec(m, s.waves[m.waveI], m.tag); HB.UI.toast('INBOUND · WAVE ' + (m.waveI + 1) + '/' + s.waves.length, 'warn'); m.waveI++; }
        if (m.t >= s.secs) { C.clear(m.tag); M.next(); } break;
      }
      case 'escape': if (m.t > 3 && C.heat === 0) M.next(); break;
      default: break;
    }
  };
  M.tracker = function () {
    const m = M.cur, S = HB.S;
    if (!m || !m.s) {
      const d = nextDef();
      return { title: d ? 'NEXT · ' + d.num + ' ' + d.name : 'CONTRACTS OPEN', lines: ['Speak to Nandi at the Field Office.'] };
    }
    const s = m.s, lines = [];
    if (s.label) lines.push(s.label);
    if (s.t === 'kill') lines.push(C.count(m.tag) + ' HOSTILE' + (C.count(m.tag) === 1 ? '' : 'S') + ' LEFT');
    if (s.t === 'collect') lines.push(m.chips.filter((c) => c.got).length + ' / ' + m.chips.length + ' CHIPS');
    if (s.t === 'survive') lines.push(Math.max(0, Math.ceil(s.secs - m.t)) + 's REMAINING');
    if (s.t === 'escape') lines.push('HEAT ' + C.heat + ' · BREAK LINE OF SIGHT');
    if (m.hint) lines.push(m.hint);
    return { title: m.def.num + ' · ' + m.def.name, lines };
  };
  M.target = function () {
    const m = M.cur; if (!m || !m.s) return null;
    const s = m.s, P = pos();
    if (s.t === 'goto') return { x: s.px, y: s.py };
    if (s.t === 'kill') { let b = null, bd = 1e9; E.foes.forEach((f) => { if (f.tag === m.tag && !f.stand) { const d = Math.hypot(f.x - P.x, f.y - P.y); if (d < bd) { bd = d; b = f; } } }); return b ? { x: b.x, y: b.y } : null; }
    if (s.t === 'collect') { let b = null, bd = 1e9; m.chips.forEach((c) => { if (!c.got) { const d = Math.hypot(c.x - P.x, c.y - P.y); if (d < bd) { bd = d; b = c; } } }); return b; }
    return null;
  };
  /* world-space drawing: objective beam + ring, and the data chips */
  M.draw = function (c, t) {
    const m = M.cur; if (!m || !m.s) return;
    if (m.chips) m.chips.forEach((k) => { if (!k.got) C.drawPick(c, { x: k.x, y: k.y, type: 'chip', t: t + k.t, life: 99 }, t); });
    const s = m.s;
    if (s.t === 'goto') {
      const x = s.px, y = s.py, r = Math.min(s.r, 90), calm = HB.S.settings.reduceMotion;
      c.save();
      const g = c.createLinearGradient(0, y - 220, 0, y); g.addColorStop(0, 'rgba(0,212,170,0)'); g.addColorStop(1, 'rgba(0,212,170,.28)'); c.fillStyle = g; c.fillRect(x - 3, y - 220, 6, 220);
      c.globalCompositeOperation = 'lighter'; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        c.save(); c.translate(x, y); c.rotate(calm ? k : t * (0.6 + k * 0.25) * (k % 2 ? -1 : 1) + k * 2.1); c.scale(1, 0.42);
        c.strokeStyle = k === 1 ? '#7b2fff' : '#00d4aa'; c.globalAlpha = 0.85 - k * 0.2; c.setLineDash(k === 2 ? [6, 8] : k === 1 ? [18, 10] : []);
        c.beginPath(); c.arc(0, 0, r * (1 - k * 0.2), 0, 6.2832); c.stroke(); c.restore();
      }
      c.restore();
    }
  };

  /* ---------------- world hooks ---------------- */
  M.markerFor = function (id) {
    if (id === 'nandi') return !M.cur;
    return false;
  };
  function nandiMenu() {
    const S = HB.S, d = nextDef();
    if (M.cur) {
      HB.UI.say('nandi', ['You have an open assignment: ' + M.cur.def.name + '.', 'Check the objective box top left. I will keep the lights on.'], { choices: [{ label: 'ABANDON IT', fn: () => HB.UI.confirm('Abandon ' + M.cur.def.name + '? You restart this chapter from the briefing.', () => M.abort(), null, 'Abandon') }, { label: 'SAVE GAME', fn: saveNow }, { label: 'CLOSE', fn: () => { } }] });
      return;
    }
    const ch = [];
    if (d) ch.push({ label: 'TAKE ' + d.num + ' · ' + d.name, fn: () => M.start(d) });
    else ch.push({ label: 'TAKE A CONTRACT (R' + (600 + 150 * Math.min(S.ops.contracts, 10)) + '+)', fn: () => M.start(contract()) });
    ch.push({ label: 'PATCH UP & SAVE', fn: () => { C.heal(999); saveNow(); } });
    ch.push({ label: 'CLOSE', fn: () => { } });
    const lines = d ? ['Dispatch. Next chapter on the board: ' + d.num + ' ' + d.chapter + ' · ' + d.name + '.', 'Pay R' + d.pay + '. Medic bag is open if you need it.'] : ['Story is closed. Kessler Crew is done. The corridor is quiet.', 'Which means contracts. PixelProTech has always taken on field work.'];
    HB.UI.say('nandi', lines, { choices: ch });
  }
  function saveNow() { HB.Game.snapshot(); HB.Save.write(); HB.UI.toast(HB.Save.ok ? 'GAME SAVED' : 'SAVE BLOCKED BY THIS BROWSER', HB.Save.ok ? 'good' : 'warn'); }

  M.setup = function () {
    E.interact = []; M.cur = null;
    const npc = (id) => E.npcs.find((n) => n.id === id);
    const add = (id, label, use) => { const n = npc(id); if (!n) return; E.addInteract({ x: () => n.x, y: () => n.y, r: 48, label, use }); };
    add('nandi', () => 'Dispatch', nandiMenu);
    add('sizwe', () => 'Armoury', () => HB.Screens.armoury());
    add('kofi', () => "Kofi's Coffee (R35)", () => {
      const S = HB.S;
      if (S.hp >= S.maxhp) return HB.UI.say('kofi', ['You look fine. Come back when you are bleeding for the cause.'], {});
      if (S.coins < 35) return HB.UI.say('kofi', ['R35. Come back when your pockets disagree.'], {});
      HB.addCoins(-35, true); C.heal(25); HB.Audio.sfx('pick'); HB.UI.say('kofi', ['Flat white, strong. On the house for the corridor, almost.'], {});
    });
    add('venter', () => 'Mr Venter', () => HB.UI.say('venter', M.done('m8') ? ['Thirty years of files, safe. I sleep again.'] : ['Take your time. Just bring back the drives.'], {}));
    E.vehicles.forEach((v) => E.addInteract({ x: () => v.x, y: () => v.y, r: 44, label: () => 'Enter ' + E.SPECS[v.type].name, hidden: () => !!E.player.vehicle, use: () => HB.Game.enterVehicle(v) }));
  };

  M.STORY = STORY;
  return M;
})();
