'use strict';
/* interface: HUD, cards, settings, collection, camera, music */
const TODN = ['白天', '黄昏', '夜晚'];
/* taps fire on finger-up without waiting for a click, and survive a few pixels of wobble */
function tap(el, fn) {
  let sx = 0, sy = 0, st = 0, id = null;
  el.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = performance.now(); id = e.pointerId; el.classList.add('pr'); });
  el.addEventListener('pointerup', e => { el.classList.remove('pr'); if (e.pointerId === id && Math.hypot(e.clientX - sx, e.clientY - sy) < 16 && performance.now() - st < 900) { e.preventDefault(); fn(e); } id = null; });
  el.addEventListener('pointercancel', () => { el.classList.remove('pr'); id = null; });
  el.addEventListener('pointerleave', () => el.classList.remove('pr'));
  el.addEventListener('click', e => { if (e.detail === 0) fn(e); });
}
/* panels scroll by dragging anywhere on them, in whichever way the stage is turned */
function dragScroll(el) {
  let y0 = 0, s0 = 0, id = null, v = 0, ly = 0, lt = 0, raf = 0;
  el.addEventListener('pointerdown', e => { id = e.pointerId; y0 = ly = PY(e); s0 = el.scrollTop; v = 0; lt = performance.now(); cancelAnimationFrame(raf); });
  el.addEventListener('pointermove', e => { if (e.pointerId !== id) return; const y = PY(e), now = performance.now(); if (Math.abs(y - y0) > 5) el.scrollTop = s0 - (y - y0); if (now > lt) v = (ly - y) / (now - lt) * 16; ly = y; lt = now; });
  const end = e => { if (e.pointerId !== id) return; id = null; const glide = () => { if (Math.abs(v) < 0.4) return; el.scrollTop += v; v *= 0.94; raf = requestAnimationFrame(glide); }; glide(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => { el.scrollTop += e.deltaY; }, { passive: true });
}
const UI = {
  t: 0, cur: null, spot: null, toastT: 0, cardActor: null, menuOn: false,
  init() {
    tap($('start'), () => { Music.start(); $('title').classList.add('gone'); G.mode = 'play'; UI.hud(true); setTimeout(() => UI.toast('梵高小镇', '左手移动 · 右手转动视角 · 走进金色画框去往另一幅画', 5200), 900); });
    tap($('bTod'), () => { G.set.cycle = false; G.todT = (Math.round(G.todT) + 1) % 3; UI.toast(TODN[G.todT], null, 1400); UI.syncSet(); });
    tap($('bBook'), () => UI.book());
    tap($('bPhoto'), () => UI.menu(!UI.menuOn));
    tap($('bSet'), () => UI.settings());
    tap($('cPhoto'), () => { UI.menu(false); takePhoto(); });
    tap($('cRec'), () => { UI.menu(false); toggleRecord(); });
    tap($('cOrig'), () => { UI.menu(false); UI.original(); });
    tap($('rec'), () => toggleRecord());
    tap($('a1'), () => UI.primary());
    tap($('a2'), () => { if (UI.spot && UI.spot.view) painterView(UI.spot); });
    tap($('mRun'), () => { G.run = !G.run; UI.modes(); });
    tap($('mBike'), () => setRide(!G.riding));
    tap($('cardClose'), () => UI.closeAll());
    tap($('cardGo'), () => { const a = UI.cardActor; if (!a) return; UI.closeAll(); if (G.companion === a) dismiss(); else invite(a); });
    tap($('cardX'), () => { const k = $('cardX').dataset.k; UI.closeAll(); if (k === 'mail') Play.startMail(); else if (k === 'orig') UI.original(UI.cardArt); });
    tap($('vClose'), () => UI.viewer(false));
    document.querySelectorAll('[data-close]').forEach(b => tap(b, () => UI.closeAll()));
    document.querySelectorAll('.scrim').forEach(s => tap(s, e => { if (e.target === s) UI.closeAll(); }));
    document.querySelectorAll('.sheet').forEach(dragScroll);
    const seg = (id, key, vals, after) => $(id).querySelectorAll('button').forEach((b, i) => tap(b, () => { G.set[key] = vals[i]; store.set('set', G.set); UI.syncSet(); if (after) after(); }));
    seg('sQuality', 'quality', ['auto', 'fast', 'fine'], () => { G.scale = 1; resize(); });
    seg('sStroke', 'stroke', [0.55, 1, 1.35], () => { G.envTod = -1; });
    seg('sSens', 'sens', [0.65, 1, 1.5]);
    $('sTod').querySelectorAll('button').forEach((b, i) => tap(b, () => { if (i === 3) G.set.cycle = !G.set.cycle; else { G.set.cycle = false; G.todT = i; } UI.syncSet(); }));
    const tog = (id, key, after) => tap($(id), () => { G.set[key] = !G.set[key]; store.set('set', G.set); UI.syncSet(); if (after) after(); });
    tog('sFps', 'fps', () => { $('fps').hidden = !G.set.fps; }); tog('sMusic', 'music', () => Music.toggle(G.set.music)); tog('sTrail', 'trail');
    tap($('sDismiss'), () => { UI.closeAll(); dismiss(); });
    const go = $('sGo');
    Object.keys(WORLD_INFO).forEach(id => { if (!WORLDS[id]) return; const b = document.createElement('button'); b.className = 'go'; b.innerHTML = '<b>' + WORLD_INFO[id].n + '</b><span>' + WORLD_INFO[id].sub + '</span>'; b.dataset.w = id; tap(b, () => { UI.closeAll(); if (G.wid === id) return; G.mode = 'travel'; UI.hud(false); travel(id, null); }); go.appendChild(b); });
    $('fps').hidden = !G.set.fps; UI.syncSet(); UI.modes(); UI.chips();
  },
  syncSet() {
    const s = G.set, on = (id, i) => $(id).querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
    on('sQuality', ['auto', 'fast', 'fine'].indexOf(s.quality)); on('sStroke', [0.55, 1, 1.35].indexOf(s.stroke)); on('sSens', [0.65, 1, 1.5].indexOf(s.sens)); on('sTod', s.cycle ? 3 : Math.round(G.todT) % 3);
    $('sFps').classList.toggle('on', s.fps); $('sMusic').classList.toggle('on', s.music); $('sTrail').classList.toggle('on', s.trail);
    $('sDismiss').hidden = !G.companion; if (G.companion) $('sDismiss').textContent = '请' + PEOPLE[G.companion.who].n + '留步';
    $('sGo').querySelectorAll('button').forEach(b => b.classList.toggle('here', b.dataset.w === G.wid));
    $('bTod').dataset.t = Math.round(G.todT) % 3;
  },
  modes() { $('mRun').classList.toggle('on', G.run); $('mBike').classList.toggle('on', G.riding); $('mRun').querySelector('span').textContent = G.riding ? '冲' : '跑'; },
  chips() { const s = $('chStar'), m = $('chMail'); s.hidden = !G.stars; s.textContent = '★ ' + G.stars; m.hidden = !G.letters; if (G.letters) m.textContent = '信 ' + (MAIL.length - G.letters.length) + '/' + MAIL.length; },
  hud(on) { $('hud').classList.toggle('off', !on); if (!on) UI.menu(false); },
  loc() { const i = WORLD_INFO[G.wid]; $('locN').textContent = i.n; $('locS').textContent = i.sub; },
  fade(on, t, s) { const f = $('fade'); if (on) { $('fadeT').textContent = t; $('fadeS').textContent = s; } f.classList.toggle('on', on); },
  toast(t, s, ms, tag) { $('toastTag').textContent = tag || ''; $('toastTag').hidden = !tag; $('toastT').textContent = t; $('toastS').textContent = s || ''; $('toastS').hidden = !s; $('toast').classList.add('on'); UI.toastT = (ms || 3000) / 1000; },
  caption(a) { const c = $('caption'); if (!a) { c.classList.remove('on'); return; } $('capT').textContent = '《' + a.t + '》'; $('capS').textContent = a.a + ' · ' + a.y; c.classList.add('on'); },
  menu(on) { UI.menuOn = on; $('menu').classList.toggle('on', on); if (on) { const sp = spotHere(30), a = ART[sp ? sp.art : WORLD_INFO[G.wid].art]; $('cOrig').querySelector('small').textContent = '《' + a.t + '》'; $('cRec').querySelector('span').textContent = G.rec ? '结束录像' : '录像'; } },
  flash() { const f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
  recording(on) { $('rec').classList.toggle('on', on); UI.hud(!on); if (on) G.mode = 'play'; },
  viewer(on, o) {
    const v = $('viewer'), im = $('vImg'), vid = $('vVid');
    if (!on) { v.classList.remove('on'); im.removeAttribute('src'); vid.pause(); vid.removeAttribute('src'); if (G.mode === 'menu') G.mode = 'play'; return; }
    G.mode = 'menu'; im.hidden = true; vid.hidden = true; $('vT').textContent = o.t || ''; $('vS').textContent = o.s || ''; $('vMsg').textContent = o.msg || ''; $('vMsg').hidden = !o.msg;
    const l = $('vLink'); l.hidden = !o.link; if (o.link) { l.href = o.link; l.textContent = o.linkText || '在维基百科里看'; }
    v.classList.add('on');
  },
  shot(url, msg) { UI.viewer(true, { t: '拍好了', s: msg }); const im = $('vImg'); im.src = url; im.hidden = false; },
  film(url) { UI.viewer(true, { t: '录好了', s: '网页里不能直接存进相册。装上 App 后，录像会自动保存。' }); const v = $('vVid'); v.src = url; v.hidden = false; v.play().catch(() => { }); },
  original(art) {
    for (const id of ['card', 'set', 'book']) $(id).classList.remove('on');
    if (!art) { const sp = spotHere(30); art = sp ? sp.art : WORLD_INFO[G.wid].art; }
    const a = ART[art], page = 'https://en.wikipedia.org/wiki/' + encodeURIComponent((a.w || a.t).replace(/ /g, '_'));
    UI.viewer(true, { t: '《' + a.t + '》', s: a.a + ' · ' + a.y, msg: '正在取原画…', link: page });
    Wiki.find(art).then(u => { const im = $('vImg'); im.onerror = () => { im.onerror = null; im.src = u.thumb; }; im.onload = () => { im.hidden = false; $('vMsg').hidden = true; }; im.src = u.large; if (u.page) $('vLink').href = u.page; })
      .catch(() => { $('vMsg').textContent = '这里取不到图片。装上 App 并联网后可以直接看到原画，也可以点下面的链接。'; $('vMsg').hidden = false; });
  },
  primary() {
    const c = UI.cur; if (G.mode !== 'play') return;
    if (G.seat) { standUp(); return; }
    if (!c) return;
    if (c.type === 'seat') sitDown(c.s); else if (c.type === 'npc') UI.card(c.a);
  },
  card(a) {
    const who = PEOPLE[a.who]; UI.cardActor = a; G.met.add(a.who); store.set('met', [...G.met]);
    const got = Play.deliver(a.who);
    $('cardN').textContent = who.n; $('cardS').textContent = who.sub; $('cardD').textContent = who.d + (got ? ' 信已经交到手里了。' : '');
    const b = $('cardGo'); b.hidden = !who.invite; b.textContent = G.companion === a ? '就送到这里' : (a.def.statue ? '请它走下来' : '邀请同行');
    const x = $('cardX'); x.hidden = true; UI.cardArt = who.art || null;
    if (a.who === 'roulin' && !G.letters && !G.flags.mail) { x.hidden = false; x.textContent = '帮他送信'; x.dataset.k = 'mail'; }
    else if (a.who === 'roulin' && G.letters) { $('cardD').textContent = who.d + ' 还没送到的信：' + G.letters.map(k => PEOPLE[k].n).join('、') + '。'; }
    else if (who.art) { x.hidden = false; x.textContent = '查看原作'; x.dataset.k = 'orig'; }
    G.mode = 'menu'; $('card').classList.add('on');
  },
  settings() { if (G.mode !== 'play') return; UI.menu(false); G.mode = 'menu'; UI.syncSet(); $('set').classList.add('on'); },
  book() {
    if (G.mode !== 'play') return; UI.menu(false); G.mode = 'menu';
    const el = $('bookList'); el.innerHTML = ''; el.parentNode.scrollTop = 0; let n = 0, total = 0;
    for (const wid of Object.keys(WORLD_INFO)) {
      if (!WORLDS[wid]) continue;
      const keys = Object.keys(ART).filter(k => (ART[k].in || 'town') === wid); if (!keys.length) continue;
      const h = document.createElement('h3'); h.textContent = WORLD_INFO[wid].n; el.appendChild(h);
      for (const k of keys) {
        const a = ART[k], f = G.found.has(k), d = document.createElement('div'), sc = G.scores[k] || 0; total++; if (f) n++;
        d.className = 'art' + (f ? '' : ' un');
        d.innerHTML = '<i>' + a.c.map(c => '<s style="background:' + (f ? c : '#8a8fa8') + '"></s>').join('') + '</i><div><b>' + (f ? '《' + a.t + '》' : '尚未遇见') + (sc >= 80 ? '<em>临摹 ' + sc + '%</em>' : '') + '</b><span>' + (f ? a.a + ' · ' + a.y : '在' + WORLD_INFO[wid].n + '里走走看') + '</span>' + (f ? '<p>' + a.d + '</p>' : '') + '</div>';
        if (f) tap(d, () => { UI.closeAll(); UI.original(k); });
        el.appendChild(d);
      }
    }
    $('bookN').textContent = n + ' / ' + total; $('book').classList.add('on');
  },
  closeAll() { for (const id of ['card', 'set', 'book']) $(id).classList.remove('on'); $('viewer').classList.remove('on'); UI.menu(false); if (G.mode === 'menu') G.mode = 'play'; UI.act(); },
  act() { UI.t = 9; },
  tick(dt) {
    if (UI.toastT > 0) { UI.toastT -= dt; if (UI.toastT <= 0) $('toast').classList.remove('on'); }
    if (G.rec) { const s = Math.floor(G.time - G.rec.t0); if (s !== UI.recS) { UI.recS = s; $('recT').textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); } }
    UI.t += dt; if (UI.t < 0.15) return; UI.t = 0;
    if (G.mode !== 'play') return;
    const sp = spotHere();
    if (sp && !G.found.has(sp.art)) { G.found.add(sp.art); store.set('found', [...G.found]); const a = ART[sp.art]; UI.toast('《' + a.t + '》', a.a + ' · ' + a.y, 4200, '遇见一幅画'); Music.chime(); }
    UI.spot = sp;
    const c = nearest(); UI.cur = c;
    const a1 = $('a1'), a2 = $('a2');
    let l1 = null;
    if (G.seat) l1 = '起身'; else if (c) l1 = c.type === 'npc' ? PEOPLE[c.a.who].n : (c.s.tag === 'tea' ? '坐下喝茶' : '坐一会儿');
    if (l1 !== UI.l1) { UI.l1 = l1; a1.hidden = !l1; if (l1) a1.querySelector('span').textContent = l1; }
    const v = !!(sp && sp.view && !G.seat); if (v !== UI.l2) { UI.l2 = v; a2.hidden = !v; }
  },
};

/* soft generative music: a few notes on a scale, long tails */
const SCALES = {
  town: [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99], monet: [261.63, 293.66, 329.63, 369.99, 392, 440, 493.88, 523.25],
  hokusai: [293.66, 311.13, 392, 440, 466.16, 587.33, 622.25], munch: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 440],
  seurat: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25], jiangshan: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99],
  museum: [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88], fog: [174.61, 196, 233.08, 261.63, 293.66, 349.23, 392],
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
    this.timer = setTimeout(() => this.loop(), this.wid === 'munch' || this.wid === 'fog' ? 760 : 520);
  },
  chime() { if (!this.ac || !G.set.music) return; const sc = SCALES[this.wid] || SCALES.town, t = this.ac.currentTime + 0.05; [2, 4, 6].forEach((i, k) => this.note(sc[Math.min(i, sc.length - 1)] * 2, t + k * 0.13, 1.8, 0.05, 'sine')); },
  setWorld(id) { this.wid = id; this.last = 3; },
  toggle(on) { if (on) this.start(); if (this.out && this.ac) this.out.gain.linearRampToValueAtTime(on ? 0.5 : 0, this.ac.currentTime + 0.6); },
};
