'use strict';
/* interface: HUD, cards, settings, collection, music */
const ART_WORLD = { lilies: 'monet', parasol: 'monet', wave: 'hokusai', scream: 'munch', jatte: 'seurat', jiangshan: 'jiangshan' };
const TODN = ['白天', '黄昏', '夜晚'];
const UI = {
  t: 0, cur: null, spot: null, toastT: 0, openPanel: null,
  init() {
    $('start').addEventListener('click', () => { Music.start(); $('title').classList.add('gone'); G.mode = 'play'; UI.hud(true); setTimeout(() => UI.toast('梵高小镇', '左手移动 · 右手转动视角 · 走进金色画框去往另一幅画', 5200), 900); });
    $('bTod').addEventListener('click', () => { G.set.cycle = false; G.todT = (Math.round(G.todT) + 1) % 3; UI.toast(TODN[G.todT], null, 1400); UI.syncSet(); });
    $('bBook').addEventListener('click', () => UI.book());
    $('bPhoto').addEventListener('click', () => UI.photo(true));
    $('bSet').addEventListener('click', () => UI.settings());
    $('a1').addEventListener('click', () => UI.primary());
    $('a2').addEventListener('click', () => { if (UI.spot && UI.spot.view) painterView(UI.spot); });
    $('cardClose').addEventListener('click', () => UI.closeAll());
    $('cardGo').addEventListener('click', () => { const a = UI.cardActor; if (!a) return; if (G.companion === a) dismiss(); else invite(a); UI.closeAll(); });
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => UI.closeAll()));
    document.querySelectorAll('.scrim').forEach(s => s.addEventListener('click', e => { if (e.target === s) UI.closeAll(); }));
    // settings wiring
    const seg = (id, key, vals, after) => { $(id).querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { G.set[key] = vals[i]; store.set('set', G.set); UI.syncSet(); if (after) after(); })); };
    seg('sQuality', 'quality', ['auto', 'fast', 'fine'], () => { G.scale = 1; resize(); });
    seg('sStroke', 'stroke', [0.55, 1, 1.35], () => { G.envTod = -1; });
    $('sTod').querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { if (i === 3) G.set.cycle = !G.set.cycle; else { G.set.cycle = false; G.todT = i; } UI.syncSet(); }));
    const tog = (id, key, after) => $(id).addEventListener('click', () => { G.set[key] = !G.set[key]; store.set('set', G.set); UI.syncSet(); if (after) after(); });
    tog('sFps', 'fps', () => { $('fps').hidden = !G.set.fps; }); tog('sMusic', 'music', () => Music.toggle(G.set.music)); tog('sTrail', 'trail');
    $('sDismiss').addEventListener('click', () => { dismiss(); UI.closeAll(); });
    const go = $('sGo');
    Object.keys(WORLD_INFO).forEach(id => { if (!WORLDS[id]) return; const b = document.createElement('button'); b.className = 'go'; b.innerHTML = '<b>' + WORLD_INFO[id].n + '</b><span>' + WORLD_INFO[id].sub + '</span>'; b.dataset.w = id; b.addEventListener('click', () => { if (G.wid === id) { UI.closeAll(); return; } UI.closeAll(); G.mode = 'travel'; UI.hud(false); travel(id, null); }); go.appendChild(b); });
    $('fps').hidden = !G.set.fps; UI.syncSet();
  },
  syncSet() {
    const s = G.set, on = (id, i) => $(id).querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
    on('sQuality', ['auto', 'fast', 'fine'].indexOf(s.quality)); on('sStroke', [0.55, 1, 1.35].indexOf(s.stroke)); on('sTod', s.cycle ? 3 : Math.round(G.todT) % 3);
    $('sFps').classList.toggle('on', s.fps); $('sMusic').classList.toggle('on', s.music); $('sTrail').classList.toggle('on', s.trail);
    $('sDismiss').hidden = !G.companion; if (G.companion) $('sDismiss').textContent = '请' + PEOPLE[G.companion.who].n + '留步';
    $('sGo').querySelectorAll('button').forEach(b => b.classList.toggle('here', b.dataset.w === G.wid));
    $('bTod').dataset.t = Math.round(G.todT) % 3;
  },
  hud(on) { $('hud').classList.toggle('off', !on); },
  loc() { const i = WORLD_INFO[G.wid]; $('locN').textContent = i.n; $('locS').textContent = i.sub; },
  fade(on, t, s) { const f = $('fade'); if (on) { $('fadeT').textContent = t; $('fadeS').textContent = s; } f.classList.toggle('on', on); },
  toast(t, s, ms, tag) { $('toastTag').textContent = tag || ''; $('toastTag').hidden = !tag; $('toastT').textContent = t; $('toastS').textContent = s || ''; $('toastS').hidden = !s; $('toast').classList.add('on'); UI.toastT = (ms || 3000) / 1000; },
  caption(a) { const c = $('caption'); if (!a) { c.classList.remove('on'); return; } $('capT').textContent = '《' + a.t + '》'; $('capS').textContent = a.a + ' · ' + a.y; c.classList.add('on'); },
  photo(on) {
    if (on) { if (G.mode !== 'play') return; G.mode = 'photo'; UI.hud(false); const sp = spotHere(); $('plate').innerHTML = '<b>' + (sp ? '《' + ART[sp.art].t + '》里的我' : WORLD_INFO[G.wid].n) + '</b><span>' + TODN[Math.round(G.tod) % 3] + ' · 画中漫步</span>'; $('photo').classList.add('on'); }
    else { $('photo').classList.remove('on'); G.mode = 'play'; UI.hud(true); }
  },
  primary() {
    const c = UI.cur; if (G.mode !== 'play') return;
    if (G.seat) { standUp(); return; }
    if (!c) return;
    if (c.type === 'seat') sitDown(c.s); else if (c.type === 'npc') UI.card(c.a);
  },
  card(a) {
    const who = PEOPLE[a.who]; UI.cardActor = a; G.met.add(a.who); store.set('met', [...G.met]);
    $('cardN').textContent = who.n; $('cardS').textContent = who.sub; $('cardD').textContent = who.d;
    const b = $('cardGo'); b.hidden = !who.invite; b.textContent = G.companion === a ? '就送到这里' : '邀请同行';
    G.mode = 'menu'; UI.openPanel = 'card'; $('card').classList.add('on');
  },
  settings() { if (G.mode !== 'play') return; G.mode = 'menu'; UI.openPanel = 'set'; UI.syncSet(); $('set').classList.add('on'); },
  book() {
    if (G.mode !== 'play') return; G.mode = 'menu'; UI.openPanel = 'book';
    const el = $('bookList'); el.innerHTML = ''; let n = 0, total = 0;
    for (const wid of Object.keys(WORLD_INFO)) {
      if (!WORLDS[wid]) continue;
      const keys = Object.keys(ART).filter(k => (ART_WORLD[k] || 'town') === wid); if (!keys.length) continue;
      const h = document.createElement('h3'); h.textContent = WORLD_INFO[wid].n; el.appendChild(h);
      for (const k of keys) {
        const a = ART[k], f = G.found.has(k), d = document.createElement('div'); total++; if (f) n++;
        d.className = 'art' + (f ? '' : ' un');
        d.innerHTML = '<i>' + a.c.map(c => '<s style="background:' + (f ? c : '#8a8fa8') + '"></s>').join('') + '</i><div><b>' + (f ? '《' + a.t + '》' : '尚未遇见') + '</b><span>' + (f ? a.a + ' · ' + a.y : '在' + WORLD_INFO[wid].n + '里走走看') + '</span>' + (f ? '<p>' + a.d + '</p>' : '') + '</div>';
        el.appendChild(d);
      }
    }
    $('bookN').textContent = n + ' / ' + total; $('book').classList.add('on');
  },
  closeAll() { for (const id of ['card', 'set', 'book']) $(id).classList.remove('on'); if (G.mode === 'menu') G.mode = 'play'; UI.openPanel = null; UI.act(); },
  act() { UI.t = 9; },
  tick(dt) {
    if (UI.toastT > 0) { UI.toastT -= dt; if (UI.toastT <= 0) $('toast').classList.remove('on'); }
    UI.t += dt; if (UI.t < 0.15) return; UI.t = 0;
    if (G.mode !== 'play') return;
    const sp = spotHere();
    if (sp && !G.found.has(sp.art)) { G.found.add(sp.art); store.set('found', [...G.found]); const a = ART[sp.art]; UI.toast('《' + a.t + '》', a.a + ' · ' + a.y, 4200, '遇见一幅画'); Music.chime(); }
    UI.spot = sp;
    const c = nearest(); UI.cur = c;
    const a1 = $('a1'), a2 = $('a2');
    let l1 = null;
    if (G.seat) l1 = '起身'; else if (c) l1 = c.type === 'npc' ? PEOPLE[c.a.who].n : (c.s.tag === 'tea' ? '坐下喝茶' : '坐一会儿');
    a1.hidden = !l1; if (l1) a1.querySelector('span').textContent = l1;
    const v = sp && sp.view && !G.seat; a2.hidden = !v; if (v) a2.querySelector('span').textContent = '画家的位置';
  },
};

/* soft generative music: a few notes on a scale, long tails */
const SCALES = {
  town: [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99], monet: [261.63, 293.66, 329.63, 369.99, 392, 440, 493.88, 523.25],
  hokusai: [293.66, 311.13, 392, 440, 466.16, 587.33, 622.25], munch: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 440],
  seurat: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25], jiangshan: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99],
  vermeer: [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88],
};
const Music = {
  ac: null, out: null, wid: 'town', step: 0, timer: null, last: 3,
  start() {
    if (this.ac || !G.set.music) { if (this.ac && this.ac.state === 'suspended') this.ac.resume().catch(() => { }); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = this.ac = new AC(), out = this.out = ac.createGain(); out.gain.value = 0.0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      const dl = ac.createDelay(1.5); dl.delayTime.value = 0.46; const fb = ac.createGain(); fb.gain.value = 0.42; const wet = ac.createGain(); wet.gain.value = 0.5;
      out.connect(lp); lp.connect(ac.destination); out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(lp);
      out.gain.linearRampToValueAtTime(0.5, ac.currentTime + 3);
      this.loop();
    } catch (e) { this.ac = null; }
  },
  note(f, when, len, vol, type) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + 0.03); g.gain.exponentialRampToValueAtTime(0.0008, when + len);
    o.connect(g); g.connect(this.out); o.start(when); o.stop(when + len + 0.05);
  },
  loop() {
    if (!this.ac) return;
    const ac = this.ac, sc = SCALES[this.wid] || SCALES.town, t = ac.currentTime + 0.06, pl = this.wid === 'jiangshan' || this.wid === 'hokusai';
    if (G.set.music && ac.state === 'running') {
      const s = this.step++;
      if (s % 8 === 0) { this.note(sc[0] / 2, t, 5.5, 0.10, 'sine'); this.note(sc[s % 16 === 0 ? 3 : 2] / 2, t, 5.5, 0.06, 'sine'); }
      if (Math.random() < (s % 2 === 0 ? 0.62 : 0.26)) {
        let i = this.last + Math.round((Math.random() - 0.5) * 4); i = clamp(i, 0, sc.length - 1); this.last = i;
        this.note(sc[i], t, pl ? 1.6 : 2.8, 0.085, pl ? 'triangle' : 'sine'); if (!pl) this.note(sc[i] * 2, t, 1.4, 0.018, 'sine');
      }
    }
    this.timer = setTimeout(() => this.loop(), this.wid === 'munch' ? 760 : 520);
  },
  chime() { if (!this.ac || !G.set.music) return; const sc = SCALES[this.wid] || SCALES.town, t = this.ac.currentTime + 0.05; [2, 4, 6].forEach((i, k) => this.note(sc[Math.min(i, sc.length - 1)] * 2, t + k * 0.13, 1.8, 0.05, 'sine')); },
  setWorld(id) { this.wid = id; this.last = 3; },
  toggle(on) { if (on) this.start(); if (this.out && this.ac) this.out.gain.linearRampToValueAtTime(on ? 0.5 : 0, this.ac.currentTime + 0.6); },
};
