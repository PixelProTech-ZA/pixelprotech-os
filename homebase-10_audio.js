'use strict';
/* HOMEBASE audio: everything is synthesised with WebAudio, no files, no network. Music is replaced by clean street ambience. */
HB.Audio = (function () {
  let ctx = null, master, musicG, sfxG, timer = null, playing = false;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.connect(ctx.destination);
      musicG = ctx.createGain(); musicG.connect(master);
      sfxG = ctx.createGain(); sfxG.connect(master);
      volumes();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function volumes() {
    if (!ctx) return;
    const s = HB.S.settings;
    musicG.gain.value = s.music * 0.55;
    sfxG.gain.value = s.sfx * 0.5;
  }
  function resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }

  function tone(f, t, d, type, v, dest, slide) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || sfxG);
    o.start(t); o.stop(t + d + 0.03);
  }
  function noise(t, d, v, hp) {
    const len = Math.floor(ctx.sampleRate * d), buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = hp || 900;
    g.gain.value = v; src.buffer = buf; src.connect(f); f.connect(g); g.connect(sfxG); src.start(t);
  }

  const SFX = {
    click(t) { tone(660, t, 0.05, 'square', 0.25); },
    coin(t) { tone(988, t, 0.07, 'square', 0.3); tone(1319, t + 0.07, 0.18, 'square', 0.3); },
    pop(t) { tone(300, t, 0.1, 'sine', 0.5, null, 700); },
    bump(t) { noise(t, 0.18, 0.9, 500); tone(110, t, 0.15, 'triangle', 0.5, null, 60); },
    door(t) { tone(392, t, 0.08, 'triangle', 0.4); tone(523, t + 0.08, 0.12, 'triangle', 0.4); },
    good(t) { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.14, 'square', 0.28)); },
    win(t) { [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.18, 'square', 0.3)); },
    oops(t) { tone(220, t, 0.2, 'sawtooth', 0.3, null, 140); },
    beep(t) { tone(300, t, 0.14, 'square', 0.35); },
    check(t) { tone(880, t, 0.08, 'triangle', 0.5); tone(1175, t + 0.08, 0.14, 'triangle', 0.5); },
    count(t) { tone(440, t, 0.2, 'square', 0.35); },
    go(t) { tone(880, t, 0.5, 'square', 0.4); },
    step(t) { noise(t, 0.03, 0.12, 1800); },
    duck(t) { tone(420, t, 0.09, 'sawtooth', 0.35, null, 300); tone(400, t + 0.11, 0.09, 'sawtooth', 0.35, null, 280); },
    goat(t) { tone(500, t, 0.35, 'sawtooth', 0.3, null, 320); },
    trumpet(t) { tone(392, t, 0.1, 'square', 0.35); tone(523, t + 0.1, 0.1, 'square', 0.35); tone(659, t + 0.2, 0.3, 'square', 0.35); },
    sticker(t) { [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.06, 0.12, 'triangle', 0.5)); },
    zap(t) { tone(900, t, 0.12, 'sawtooth', 0.25, null, 200); },
    catch(t) { tone(500, t, 0.06, 'square', 0.3, null, 900); tone(900, t + 0.06, 0.1, 'square', 0.3); },
    shot(t) { noise(t, 0.09, 0.8, 2600); tone(180, t, 0.08, 'sawtooth', 0.35, null, 60); },
    smg(t) { noise(t, 0.05, 0.6, 3000); tone(240, t, 0.05, 'square', 0.25, null, 90); },
    boom(t) { noise(t, 0.25, 1.0, 1400); tone(90, t, 0.22, 'sawtooth', 0.5, null, 40); },
    rifle(t) { noise(t, 0.08, 0.7, 3400); tone(140, t, 0.1, 'sawtooth', 0.4, null, 50); },
    efire(t) { noise(t, 0.06, 0.35, 2000); tone(200, t, 0.06, 'square', 0.2, null, 80); },
    hit(t) { tone(1200, t, 0.04, 'square', 0.25, null, 600); },
    hurt(t) { tone(160, t, 0.18, 'sawtooth', 0.45, null, 70); noise(t, 0.1, 0.5, 700); },
    derez(t) { tone(900, t, 0.25, 'triangle', 0.3, null, 160); tone(1400, t, 0.2, 'sine', 0.2, null, 300); },
    reload(t) { tone(500, t, 0.04, 'square', 0.25); tone(750, t + 0.18, 0.05, 'square', 0.25); },
    empty(t) { tone(300, t, 0.03, 'square', 0.25); },
    siren(t) { tone(700, t, 0.3, 'sawtooth', 0.12, null, 980); tone(980, t + 0.3, 0.3, 'sawtooth', 0.12, null, 700); },
    pick(t) { tone(1100, t, 0.05, 'triangle', 0.35); tone(1500, t + 0.05, 0.08, 'triangle', 0.35); },
    boomcar(t) { noise(t, 0.5, 1.0, 900); tone(70, t, 0.4, 'sawtooth', 0.6, null, 30); },
    pad0(t) { tone(262, t, 0.3, 'triangle', 0.5); }, pad1(t) { tone(330, t, 0.3, 'triangle', 0.5); },
    pad2(t) { tone(392, t, 0.3, 'triangle', 0.5); }, pad3(t) { tone(523, t, 0.3, 'triangle', 0.5); },
  };

  /* ---- clean street ambience (no melody, no beat): city bed, passing cars, distant horns and sirens ---- */
  let bed = null, nbuf = null, evT = 0, mood = 'town', eng = null;
  function noiseBuf() {
    if (nbuf) return nbuf;
    const len = ctx.sampleRate * 4; nbuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = nbuf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } // brown noise, loops
    return nbuf;
  }
  function loopSrc() { const s = ctx.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; return s; }
  function startBed() {
    if (bed) return;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(musicG);
    const a = loopSrc(), fa = ctx.createBiquadFilter(); fa.type = 'lowpass'; fa.frequency.value = 260; const ga = ctx.createGain(); ga.gain.value = 1.1; a.connect(fa); fa.connect(ga); ga.connect(g);
    const b = loopSrc(), fb = ctx.createBiquadFilter(); fb.type = 'bandpass'; fb.frequency.value = 1100; fb.Q.value = 0.5; const gb = ctx.createGain(); gb.gain.value = 0.16; b.connect(fb); fb.connect(gb); gb.connect(g);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 70; lfo.connect(lg); lg.connect(fa.frequency); // slow breathing of the city
    a.start(); b.start(); lfo.start();
    g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    bed = { g, nodes: [a, b, lfo] };
  }
  function stopBed() {
    if (!bed) return; const t = ctx.currentTime, x = bed; bed = null;
    x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(x.g.gain.value, t); x.g.gain.linearRampToValueAtTime(0, t + 0.4);
    x.nodes.forEach((n) => { try { n.stop(t + 0.5); } catch (e) { /* already stopped */ } });
  }
  function pan(v) { if (!ctx.createStereoPanner) return null; const p = ctx.createStereoPanner(); p.pan.value = v; return p; }
  function passingCar(t) {
    const dur = 2.2 + Math.random() * 1.6, dir = Math.random() < 0.5 ? -1 : 1, s = loopSrc();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
    f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(760, t + dur * 0.5); f.frequency.exponentialRampToValueAtTime(300, t + dur);
    const g = ctx.createGain(), v = 0.5 + Math.random() * 0.4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = pan(dir * 0.9); if (p) p.pan.linearRampToValueAtTime(-dir * 0.9, t + dur);
    s.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(musicG); } else g.connect(musicG);
    s.start(t, Math.random() * 3); s.stop(t + dur + 0.1);
  }
  function farHorn(t) {
    const base = 330 + Math.random() * 120, f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.03); g.gain.setValueAtTime(0.16, t + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    const p = pan(Math.random() * 1.6 - 0.8); f.connect(g); if (p) { g.connect(p); p.connect(musicG); } else g.connect(musicG);
    [1, 1.26].forEach((m) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = base * m; o.connect(f); o.start(t); o.stop(t + 0.4); });
  }
  function farSiren(t) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = pan(Math.random() * 1.4 - 0.7);
    o.type = 'triangle'; f.type = 'lowpass'; f.frequency.value = 1300;
    for (let i = 0; i < 4; i++) { o.frequency.setValueAtTime(660, t + i * 1.4); o.frequency.linearRampToValueAtTime(940, t + i * 1.4 + 0.7); o.frequency.linearRampToValueAtTime(660, t + i * 1.4 + 1.4); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 1.5); g.gain.linearRampToValueAtTime(0.0001, t + 5.6);
    o.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(musicG); } else g.connect(musicG); o.start(t); o.stop(t + 5.7);
  }
  function sched() {
    if (!ctx || !playing) return;
    const t = ctx.currentTime; if (t < evT) return;
    const r = Math.random();
    if (mood === 'race') { if (r < 0.5) farSiren(t); else passingCar(t); evT = t + 2 + Math.random() * 3; }
    else if (r < 0.62) { passingCar(t); evT = t + 2.5 + Math.random() * 4; }
    else if (r < 0.80) { farHorn(t); evT = t + 3 + Math.random() * 4; }
    else if (r < 0.88) { farSiren(t); evT = t + 8 + Math.random() * 6; }
    else evT = t + 2 + Math.random() * 3;
  }
  function engineTick(sp) {
    if (!ctx || !HB.S || HB.S.settings.sfx <= 0) sp = null;
    if (sp == null) { if (eng) { const t = ctx.currentTime, e = eng; eng = null; e.g.gain.cancelScheduledValues(t); e.g.gain.setTargetAtTime(0, t, 0.08); try { e.o.stop(t + 0.5); e.o2.stop(t + 0.5); } catch (x) { /* done */ } } return; }
    if (!eng) {
      const g = ctx.createGain(), f = ctx.createBiquadFilter(), o = ctx.createOscillator(), o2 = ctx.createOscillator();
      g.gain.value = 0; f.type = 'lowpass'; f.frequency.value = 420; o.type = 'sawtooth'; o2.type = 'triangle';
      o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxG); o.start(); o2.start(); eng = { g, f, o, o2 };
    }
    const t = ctx.currentTime, s = Math.min(1.2, sp), fr = 48 + s * 95;
    eng.o.frequency.setTargetAtTime(fr, t, 0.06); eng.o2.frequency.setTargetAtTime(fr * 0.5, t, 0.06);
    eng.f.frequency.setTargetAtTime(300 + s * 520, t, 0.08); eng.g.gain.setTargetAtTime(0.06 + s * 0.1, t, 0.08);
  }

  return {
    unlock() { resume(); },
    volumes,
    sfx(name) { if (!ctx || HB.S.settings.sfx <= 0 || !SFX[name]) return; try { SFX[name](ctx.currentTime); } catch (e) { /* audio must never break the game */ } },
    music(name) {
      mood = name === 'race' ? 'race' : 'town';
      if (!ensure()) return;
      if (HB.S.settings.music <= 0) { this.stop(); return; }
      if (!playing) { playing = true; evT = ctx.currentTime + 1.5; startBed(); timer = setInterval(() => { try { sched(); } catch (e) { /* ignore */ } }, 250); }
    },
    stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } if (ctx) stopBed(); },
    engine(sp) { try { engineTick(sp); } catch (e) { /* audio must never break the game */ } },
    get active() { return playing; },
    get hasCtx() { return !!ctx; },
  };
})();
