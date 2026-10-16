'use strict';
/* HOMEBASE: Field Operations screens: 18+ gate, title, pause, controls, map, settings, about, armoury, down, recover. */
HB.Screens = (function () {
  const U = HB.u, esc = U.esc, G = HB.G, UI = HB.UI;
  const S = {};
  const LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="10" fill="#07070a"/><g fill="#7b2fff"><path d="M8 8h14v4H12v10H8z"/><path d="M56 8H42v4h10v10h4z"/><path d="M8 56h14v-4H12V42H8z"/><path d="M56 56H42v-4h10V42h4z"/></g><g fill="none" stroke="#00d4aa" stroke-width="2"><circle cx="32" cy="32" r="14" stroke-dasharray="5 4"/><circle cx="32" cy="32" r="7"/></g><rect x="29" y="29" width="6" height="6" fill="#00d4aa"/><rect x="45" y="17" width="4" height="4" fill="#d8b96a"/><rect x="15" y="43" width="4" height="4" fill="#d8b96a"/></svg>';
  S.LOGO = LOGO;
  const btn = (act, label, cls, extra) => '<button class="btn ' + (cls || '') + '" data-act="' + act + '" ' + (extra || '') + '>' + label + '</button>';
  const close = (n, e, ent) => UI.close(ent);

  /* ---------- 18+ gate ---------- */
  S.gate = function () {
    UI.open('<div class="panel gate">' + LOGO + '<div class="kick">[ SYS ] AGE VERIFICATION</div><h2>ADULTS ONLY · 18+</h2>' +
      '<p>HOMEBASE: Field Operations is an action game for adults. It contains stylised gun violence, police pursuits and strong language themes. Everything in it is fictional: the crews, the police unit, the town.</p>' +
      '<p class="dim">No gore. Civilians cannot be harmed. Nothing here is based on a real person or agency.</p>' +
      '<div class="prow">' + btn('yes', 'I AM 18 OR OLDER', '', 'data-focus') + btn('no', 'LEAVE', 'ghost') + '</div></div>', {
      closable: false,
      on: {
        yes: (n, e, ent) => { HB.S.adult = true; HB.Save.write(); UI.close(ent); S.title(); },
        no: (n, e, ent) => { UI.setHtml(ent, '<div class="panel gate">' + LOGO + '<h2>SEE YOU LATER</h2><p>Come back when you are 18. You can close this window.</p></div>'); },
      },
    });
  };

  /* ---------- title ---------- */
  S.title = function () {
    if (!HB.S.adult) return S.gate();
    const has = HB.Save.hasSave;
    UI.open('<div class="title">' + LOGO + '<div class="kick">PIXELPROTECH SOLUTIONS PRESENTS</div><h1>HOMEBASE</h1><h2>FIELD OPERATIONS</h2>' +
      '<p class="tag">[ SYS ] ADULTS ONLY · 18+ · FICTIONAL VIOLENCE</p>' +
      '<div class="menu">' + (has ? btn('cont', 'CONTINUE', '', 'data-focus') : '') + btn('new', has ? 'NEW OPERATION' : 'BEGIN OPERATION', has ? 'ghost' : '', has ? '' : 'data-focus') + btn('ctl', 'CONTROLS', 'ghost') + btn('set', 'SETTINGS', 'ghost') + btn('about', 'ABOUT PIXELPROTECH', 'ghost') + '</div>' +
      '<div class="foot">© 2026 PixelProTech Solutions (Pty) Ltd · Centurion, Gauteng</div></div>', {
      closable: false, cls: 'titlemodal',
      on: {
        cont: (n, e, ent) => { UI.close(ent); HB.Game.fade(() => HB.Game.startPlaying()); },
        new: (n, e, ent) => {
          const go = () => { UI.close(ent); HB.Game.fade(() => { HB.Game.wipeAndStart(); }); };
          if (HB.Save.hasSave) UI.confirm('Start over? Your saved operation will be erased.', go, null, 'Erase and start'); else go();
        },
        ctl: () => S.controls(), set: () => S.settings(), about: () => S.about(),
      },
    });
  };

  /* ---------- pause ---------- */
  S.pause = function () {
    if (G.mode !== 'play' || G.modal) return;
    UI.open('<div class="panel small"><h2>PAUSED</h2><div class="menu">' + btn('res', 'RESUME', '', 'data-focus') + btn('map', 'MAP', 'ghost') + btn('ctl', 'CONTROLS', 'ghost') + btn('set', 'SETTINGS', 'ghost') + btn('sav', 'SAVE', 'ghost') + btn('about', 'ABOUT', 'ghost') + btn('quit', 'SAVE & QUIT TO TITLE', 'ghost') + '</div></div>', {
      on: { res: close, map: () => S.map(), ctl: () => S.controls(), set: () => S.settings(), about: () => S.about(), sav: () => { HB.Game.snapshot(); HB.Save.write(); UI.toast(HB.Save.ok ? 'GAME SAVED' : 'SAVE BLOCKED BY THIS BROWSER', HB.Save.ok ? 'good' : 'warn'); }, quit: (n, e, ent) => { UI.close(ent); HB.Game.toTitle(); } },
    });
  };

  /* ---------- controls ---------- */
  S.controls = function () {
    const k = (a, b) => '<tr><td><kbd>' + a + '</kbd></td><td>' + b + '</td></tr>';
    UI.panel('CONTROLS', '<table class="keys">' + k('W A S D / ARROWS', 'Move. Driving: the car goes the way you press') + k('MOUSE', 'Aim') + k('CLICK / J / SPACE', 'Fire (on foot)') + k('R', 'Reload') + k('Q / TAB', 'Next weapon') + k('1 2 3 4', 'Pick weapon') + k('SHIFT', 'Sprint (on foot) · handbrake (driving)') + k(UI.keyName(), 'Talk · enter or leave a vehicle · use') + k('H', 'Horn') + k('M', 'Map') + k('ESC / P', 'Pause') + '</table><p class="dim">Hitting police raises your HEAT. Break line of sight and stay hidden to cool it down. Drive over hostile gunmen at speed to flatten them.</p>', { wide: true });
  };

  /* ---------- map ---------- */
  S.map = function () {
    const ent = UI.panel('MAP', '<canvas id="bigmap" width="640" height="480"></canvas><p class="dim">Gauteng corridor · Sandton to Pretoria CBD · teal ring = objective</p>', { wide: true });
    const cv = ent.el.querySelector('#bigmap'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(UI.miniBaseCanvas(), 0, 0, 640, 480);
    const k = 10, W = HB.World;
    c.strokeStyle = 'rgba(123,47,255,.35)'; c.lineWidth = 1; c.setLineDash([4, 6]);
    [21, 43].forEach((x) => { c.beginPath(); c.moveTo(x * k, 0); c.lineTo(x * k, 480); c.stroke(); });
    [15, 33].forEach((y) => { c.beginPath(); c.moveTo(0, y * k); c.lineTo(640, y * k); c.stroke(); });
    c.setLineDash([]); c.font = 'bold 11px "Courier New",monospace'; c.fillStyle = 'rgba(154,144,184,.9)';
    W.ZONES.forEach((row, r) => row.forEach((n, i) => { c.fillText(n, [6, 214, 436][i], [16, 162, 346][r]); }));
    c.font = '9px "Courier New",monospace'; c.fillStyle = '#f1eefa';
    W.buildings.forEach((b) => { c.fillText(b.sign, b.x * k, b.y * k - 3); });
    const p = HB.E.player, pos = p.vehicle || p, t = HB.Missions.target();
    if (t) { c.strokeStyle = '#00d4aa'; c.lineWidth = 2; c.beginPath(); c.arc(t.x / 32 * k, t.y / 32 * k, 9, 0, 7); c.stroke(); }
    c.fillStyle = '#f1eefa'; c.beginPath(); c.arc(pos.x / 32 * k, pos.y / 32 * k, 5, 0, 7); c.fill(); c.fillStyle = '#00d4aa'; c.beginPath(); c.arc(pos.x / 32 * k, pos.y / 32 * k, 3, 0, 7); c.fill();
  };

  /* ---------- settings ---------- */
  S.settings = function () {
    const st = HB.S.settings, chk = (id, v, l) => '<label class="chk"><input type="checkbox" data-ch="' + id + '"' + (v ? ' checked' : '') + '> ' + l + '</label>';
    UI.panel('SETTINGS', '<label class="rng">STREET AMBIENCE <input type="range" min="0" max="100" value="' + Math.round(st.music * 100) + '" data-in="music"></label><label class="rng">EFFECTS <input type="range" min="0" max="100" value="' + Math.round(st.sfx * 100) + '" data-in="sfx"></label>' +
      chk('calm', st.reduceMotion, 'Calmer visuals (no drifting effects)') + chk('low', st.lowPower, 'Low-power mode (30 fps, fewer effects)') + chk('big', st.bigText, 'Larger text'), {
      on: {
        music: (n) => { st.music = +n.value / 100; HB.Audio.volumes(); if (st.music > 0) HB.Audio.music(G.mode === 'play' ? (HB.Combat.heat ? 'race' : 'town') : 'town'); else HB.Audio.stop(); },
        sfx: (n) => { st.sfx = +n.value / 100; HB.Audio.volumes(); },
        calm: (n) => { st.reduceMotion = n.checked; UI.applySettings(); },
        low: (n) => { st.lowPower = n.checked; },
        big: (n) => { st.bigText = n.checked; UI.applySettings(); },
      }, onClose: () => HB.Save.write(),
    });
  };

  /* ---------- about / company ---------- */
  S.about = function () {
    const row = (a, b) => '<tr><td>' + a + '</td><td>' + b + '</td></tr>';
    UI.panel('ABOUT PIXELPROTECH', '<div class="about">' + LOGO + '<div><div class="kick">// COMPANY</div><p><b>PixelProTech Solutions (Pty) Ltd</b><br>Self-built software, repair and field IT. Pretoria and Centurion, Gauteng.</p></div></div>' +
      '<table class="keys">' + row('REGISTRATION', '2026/622131/07 · registered 04 Aug 2026') + row('REGISTERED OFFICE', 'Centurion, Gauteng') + row('B-BBEE', 'Level 1') + row('CONTACT', 'pixelprotechsolutions@proton.me') + row('DIRECTOR', 'Lindokuhle Mabika') + '</table>' +
      '<div class="kick">// THE PIXEL METHOD</div><p class="method">01 REQUEST · 02 ASSESS · 03 DIAGNOSE · 04 APPROVE · 05 REPAIR · 06 TEST · 07 DOCUMENT · 08 HANDOVER</p>' +
      '<p class="dim">Each story mission in this game follows one chapter of the method. Fictional work: all characters, crews and the police unit are invented and not affiliated with any real person or agency. Rare, self-built, no copies, no middlemen.</p>', { wide: true });
  };

  /* ---------- armoury ---------- */
  S.armoury = function () {
    const C = HB.Combat;
    const ent = UI.panel('THE WORKSHOP · ARMOURY', '', { wide: true, closeLabel: 'LEAVE' });
    const render = () => {
      const st = HB.S, w = st.weap;
      const rows = C.WEAP.map((W0, i) => {
        const own = w.owned[i];
        const stats = 'DMG ' + W0.dmg + (W0.pellets > 1 ? ' ×' + W0.pellets : '') + ' · MAG ' + W0.mag + ' · ' + (W0.auto ? 'AUTO' : 'SEMI');
        let act;
        if (!own) act = btn('buy', 'BUY R' + W0.price, st.coins >= W0.price ? '' : 'ghost dis', 'data-i="' + i + '"');
        else if (i === 0) act = '<span class="dim">STANDARD ISSUE</span>';
        else act = btn('ammo', '+' + W0.ammoPer + ' AMMO R' + W0.ammoCost, st.coins >= W0.ammoCost ? '' : 'ghost dis', 'data-i="' + i + '"') + ' <span class="dim">' + w.ammo[i] + ' in reserve</span>';
        return '<div class="shoprow"><div><b>' + W0.name + '</b><div class="dim">' + stats + '</div></div><div>' + act + '</div></div>';
      }).join('');
      const gear = '<div class="shoprow"><div><b>ARMOUR PLATE</b><div class="dim">+50 armour · now ' + Math.round(st.armor) + '/100</div></div><div>' + btn('gear', 'R250', st.coins >= 250 && st.armor < 100 ? '' : 'ghost dis', 'data-k="armor"') + '</div></div>' +
        '<div class="shoprow"><div><b>MEDKIT</b><div class="dim">+50 HP · now ' + Math.ceil(st.hp) + '/' + st.maxhp + '</div></div><div>' + btn('gear', 'R150', st.coins >= 150 && st.hp < st.maxhp ? '' : 'ghost dis', 'data-k="med"') + '</div></div>';
      ent.el.querySelector('.pbody').innerHTML = '<div class="kick">// CASH R ' + st.coins + '</div>' + rows + '<div class="kick">// GEAR</div>' + gear;
    };
    ent.on.buy = (n) => { const i = +n.dataset.i, W0 = C.WEAP[i], st = HB.S; if (st.weap.owned[i] || st.coins < W0.price) return HB.Audio.sfx('oops'); HB.addCoins(-W0.price, true); st.weap.owned[i] = 1; st.weap.ammo[i] = W0.ammoPer; st.weap.mag[i] = W0.mag; C.selectWeapon(i); HB.Audio.sfx('good'); render(); };
    ent.on.ammo = (n) => { const i = +n.dataset.i, W0 = C.WEAP[i], st = HB.S; if (st.coins < W0.ammoCost || st.weap.ammo[i] >= 400) return HB.Audio.sfx('oops'); HB.addCoins(-W0.ammoCost, true); st.weap.ammo[i] += W0.ammoPer; HB.Audio.sfx('pick'); render(); };
    ent.on.gear = (n) => { const k = n.dataset.k, st = HB.S; if (k === 'armor') { if (st.coins < 250 || st.armor >= 100) return HB.Audio.sfx('oops'); HB.addCoins(-250, true); st.armor = Math.min(100, st.armor + 50); } else { if (st.coins < 150 || st.hp >= st.maxhp) return HB.Audio.sfx('oops'); HB.addCoins(-150, true); C.heal(50); } HB.Audio.sfx('pick'); render(); };
    render();
  };

  /* ---------- down / recover ---------- */
  S.down = function () {
    const cost = Math.floor(HB.S.coins * 0.1);
    UI.open('<div class="panel small down"><div class="kick">[ SYS ] SIGNAL LOST</div><h2>OPERATOR DOWN</h2><p>Redeploy at the Field Office. Medical and recovery fee: <b>R ' + cost + '</b> (10% of your cash). Armour is lost.</p><div class="prow">' + btn('go', 'REDEPLOY', '', 'data-focus') + '</div></div>', {
      closable: false,
      on: { go: (n, e, ent) => { UI.close(ent); HB.Game.fade(() => { const c = HB.Combat.respawn(); if (HB.Missions.cur) HB.Missions.retry(); HB.UI.refreshHud(); HB.UI.toast('REDEPLOYED · −R' + c, 'warn'); }); } },
    });
  };
  S.recover = function () {
    UI.open('<div class="panel small"><div class="kick">[ SYS ] FAULT</div><h2>RECOVERY</h2><p>Several errors in a row. Your last save is safe.</p><div class="prow">' + btn('rl', 'RELOAD FROM SAVE', '', 'data-focus') + '</div></div>', {
      closable: false, on: { rl: (n, e, ent) => { G.recovering = false; G.errors = []; UI.close(ent); HB.Game.reloadFromSave(); } },
    });
  };
  S.breakNudge = () => false;

  return S;
})();
