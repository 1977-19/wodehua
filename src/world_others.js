'use strict';
/* Five more paintings to walk into. */
function E3(day, no, du) {
  const d = Object.assign({}, ENV_BASE, { sunDir: [-0.42, 0.74, 0.5], light: [1.14, 1.08, 0.9], shade: [0.54, 0.58, 0.84], fogD: 0.0046, lampAmt: 0, glow: 0, shadowAmt: 0.4, nightMix: 0, glitter: 0.3, glitCol: [0.95, 0.95, 0.85] }, day);
  d.sky = Object.assign({ accent: H3('#fbf6dc'), cloudCol: H3('#fbf8ee'), sunCol: H3('#fff4a8'), haloCol: H3('#ffeb94'), swirl: 0.3, wave: 0, band: 0, flow: 0.008, stars: 0, crescent: 0, cloud: 0.5, sunSize: 0.06, sunAmt: 1 }, day.sky);
  const n = nightOf(d, no), k = duskOf(d, n, du); return [d, k, n];
}
const backGate = (ctx, x, z, rot, y) => frameGate(ctx, x, z, rot, 'town', y === undefined ? undefined : { y });

/* ---- Monet: the water-lily pond at Giverny ---- */
WORLDS.monet = function (R) {
  const H = (x, z) => 0.25 + (fbm(x * 0.03 + 2, z * 0.03, 3) - 0.5) * 1.6 * sstep(26, 50, Math.hypot(x, z + 8)) + bump(x, z, 30, -34, 22) * 5 - bump(x, z, 0, -10, 19) * 2.4;
  const ctx = mkCtx(1899, H), m = ctx.m, rng = ctx.rng; ctx.paths = new Paths();
  ground(ctx, 90, 2.2, (x, z, h) => { const n = fbm(x * 0.08, z * 0.08 + 3, 3); let c = mixc(hex('#7fb86a'), hex('#a9d08a'), n); c = mixc(c, hex('#5f9f72'), sstep(0.6, 0.3, n) * 0.5); return mixc(c, hex('#3f6f5f'), sstep(-0.1, -0.7, h)); });
  ribbon(ctx, [[0, 26], [-3, 16], [-9, 9], [-9.5, 2]], 2.2, ['#e9dcc0', '#d6c6a4']); ribbon(ctx, [[9.5, -22], [16, -26], [24, -31], [30, -34]], 2.0, ['#e9dcc0', '#d6c6a4']);
  ctx.groundN = m.nv;
  waterDisc(ctx, 0, -10, 15.5, -0.3, [0.5, 0.5, 0.5]);
  // the green bridge
  m.push().T(0, 0, -10).RY(0.9); const arc = t => [lerp(-10.5, 10.5, t), 0.3 + Math.sin(t * Math.PI) * 1.9];
  for (let k = 0; k < 16; k++) { const a = arc(k / 16), b = arc((k + 1) / 16); m.c(k % 2 ? '#b9c7a8' : '#a8b898'); m.quad([a[0], a[1], 1.2], [b[0], b[1], 1.2], [b[0], b[1], -1.2], [a[0], a[1], -1.2]); for (const s of [-1, 1]) { m.c('#3f8a6a'); for (const hh of [0.5, 1.0]) { m.quad([a[0], a[1] + hh, s * 1.2], [b[0], b[1] + hh, s * 1.2], [b[0], b[1] + hh + 0.1, s * 1.2], [a[0], a[1] + hh + 0.1, s * 1.2]); m.quad([b[0], b[1] + hh, s * 1.2], [a[0], a[1] + hh, s * 1.2], [a[0], a[1] + hh + 0.1, s * 1.2], [b[0], b[1] + hh + 0.1, s * 1.2]); } m.box(a[0], a[1] - 0.2, s * 1.2, 0.1, 1.3, 0.1, 61); } }
  m.pop(); ctx.arches = [{ x: 0, z: -10, rot: 0.9, len: 10.5, w: 1.1, h: 1.9, y: 0.25 }];
  for (let i = 0; i < 70; i++) { const a = rng() * TAU, r = 2 + rng() * 12, x = Math.cos(a) * r, z = -10 + Math.sin(a) * r, c = Math.cos(0.9), s = Math.sin(0.9), lz = x * s + (z + 10) * c; if (Math.abs(lz) < 1.8) continue; m.c(jit(hex(rng() < 0.5 ? '#5f9f6a' : '#7fb87a'), rng, 0.02, 0.05)); m.disc(x, -0.27, z, 0.35 + rng() * 0.3, 7); if (i % 2) { m.c(rng.pick(['#f6dfe6', '#f3a9c0', '#fbf4ea', '#f6e27a']), 0.08); m.ell(x, -0.2, z, 0.15, 0.1, 0.15, 6, 3); } }
  const dry = (x, z) => H(x, z) > 0.05 && !ctx.paths.on(x, z, 0.3);
  [[-17, -6], [15, 2], [-12, -24], [17, -14], [-20, 6], [6, 8], [-4, -28]].forEach(p => tree(ctx, p[0], p[1], Object.assign({}, TREES.willow, { h: 7 + rng() * 2 })));
  scatter(ctx, 30, -70, 70, -70, 60, (x, z) => dry(x, z) && Math.hypot(x, z + 10) > 26, (x, z, i) => tree(ctx, x, z, Object.assign({}, i % 2 ? TREES.apple : TREES.plane, { lo: 1 })));
  scatter(ctx, 520, -22, 22, -32, 12, (x, z) => dry(x, z) && Math.hypot(x, z + 10) < 21, (x, z, i) => i % 3 ? iris(ctx, x, z, { white: i % 17 === 0 }) : reed(ctx, x, z));
  scatter(ctx, 2600, -50, 50, -55, 45, dry, (x, z, i) => i % 3 ? grass(ctx, x, z) : (i % 2 ? poppy(ctx, x, z) : bloom(ctx, x, z, ['#f6e27a', '#fbf4ea', '#c9a8e0', '#f0a8b8'][i % 4])));
  ctx.npcs.push({ cast: 'monetLady', who: 'monetLady', x: 28, z: -33, rot: -0.8, pose: 'idle', propUp: 0.75, propBend: 1.5, propTilt: 0.15 }, { cast: 'monetBoy', who: null, x: 31, z: -31.5, rot: -1.2, pose: 'idle', scale: 0.72 });
  ctx.spots.push({ art: 'lilies', x: -8, z: 1, r: 9, view: { p: [-13.5, 1.3, 2.5], t: [0, 1.6, -10], tod: 0 } }, { art: 'parasol', x: 27, z: -31, r: 8, view: { p: [24.5, H(24.5, -27) + 0.5, -27], t: [28, H(28, -33) + 2.6, -33], tod: 0 } });
  easel(ctx, -11.5, 3.5, 2.3, ART.lilies.c); backGate(ctx, 0, 30, Math.PI);
  bench(ctx, -14.5, 7.5, 2.2, { tag: 'bench', col: '#3f8a6a' }); bench(ctx, 14, -27, -1.0, { tag: 'bench', col: '#3f8a6a' }); chair(ctx, 25.5, -29.5, H(25.5, -29.5), 2.2, { tag: 'chair', col: '#e9e2cf', seat: '#9db7d8' }); chair(ctx, -17, -16, H(-17, -16), 1.4, { tag: 'chair', col: '#e9e2cf', seat: '#9db7d8' });
  hills(ctx, 110, 170, 22, ['#7fae8a', '#a9c8b0'], 4.4);
  return finishWorld(R, ctx, { id: 'monet', defTod: 0, bound: { r: 82, z: -4 }, spawn: { x: 0, z: 25, rot: Math.PI }, waterY: -0.3, shadowSun: nrm3([-0.42, 0.74, 0.5]),
    env: E3({ stroke: 'dab', strokeScale: 0.5, strokeAmt: 1.1, tint: [0.16, -0.06, 0.2], fog: H3('#d9e6dc'), waterA: H3('#3f7a6a'), waterB: H3('#8fc4a4'), waterC: H3('#f6d3de'), sky: { A: H3('#86b4e2'), B: H3('#c6dcf2'), C: H3('#f3dbe4'), horizon: H3('#e9efdc'), swirl: 0.2, cloud: 0.7 } }) });
};

/* ---- Hokusai: under the wave off Kanagawa ---- */
WORLDS.hokusai = function (R) {
  const H = (x, z) => lerp(-2.0, 0.5 + (fbm(x * 0.05, z * 0.05, 2) - 0.5) * 0.8 + bump(x, z, 30, 34, 18) * 3, sstep(-3, 5, z + Math.sin(x * 0.07) * 3));
  const ctx = mkCtx(1831, H), m = ctx.m, rng = ctx.rng;
  ground(ctx, 110, 2.5, (x, z, h) => mixc(mixc(hex('#e6d6a8'), hex('#d9c592'), vnoise(x * 0.2, z * 0.2)), hex('#8fa67a'), sstep(1.0, 2.2, h + vnoise(x * 0.1, z * 0.1))));
  ctx.groundN = m.nv;
  waterRect(ctx, -160, 160, -200, 6, -0.5, 16, 14, [0.5, 0.5, 0.5], 0.5);
  // the great wave: a curling sheet with claws of foam
  const wave = (wx, wz, s, ry) => { m.push().T(wx, -0.6, wz).RY(ry).SC(s);
    const prof = t => { const a = t * 3.9; return [-7 + t * 7 + Math.sin(a) * 4.2 * t, 11.5 * Math.sin(Math.min(1, t * 1.25) * 1.57) - (t > 0.8 ? (t - 0.8) * 16 : 0)]; };
    for (let i = 0; i < 16; i++) { const z0 = -14 + i * 1.75, z1 = z0 + 1.75, k0 = Math.sin(i / 16 * Math.PI), k1 = Math.sin((i + 1) / 16 * Math.PI);
      for (let j = 0; j < 12; j++) { const a = prof(j / 12), b = prof((j + 1) / 12); m.ds = true; m.c(mixc(hex('#1f3f78'), hex('#3f6aa8'), (j % 2) * 0.5 + j / 24)); m.quad([a[0] * k0, a[1] * k0, z0], [b[0] * k0, b[1] * k0, z0], [b[0] * k1, b[1] * k1, z1], [a[0] * k1, a[1] * k1, z1]); m.ds = false; }
      const tp = prof(1), cr = prof(0.86); m.c('#f4f1e4'); for (let f = 0; f < 3; f++) { const zz = z0 + f * 0.58, kk = Math.sin((i + f / 3) / 16 * Math.PI); m.tube([[cr[0] * kk, cr[1] * kk, zz], [(cr[0] + 1.6) * kk, (cr[1] - 0.6) * kk, zz + 0.2], [(tp[0] + 1.2) * kk, (tp[1] - 0.6) * kk, zz + rng.s() * 0.4]], [0.5 * kk + 0.05, 0.36 * kk + 0.04, 0.03], 4); }
      m.c('#eef0e6'); m.ell(prof(0.7)[0] * k0, prof(0.7)[1] * k0 + 0.4, z0, 0.9 * k0 + 0.1, 0.6 * k0 + 0.1, 0.9, 5, 3); }
    m.pop(); };
  wave(-14, -26, 2.3, 0.3); wave(30, -46, 1.1, -0.2); wave(-60, -62, 1.4, 0.5);
  m.c('#3f5f8f'); m.grad('#f6f4ec', 26, 14); m.lathe(70, -4, -230, [[58, 0], [34, 14], [17, 27], [7, 36], [0, 39]], 9); m.grad(null);
  [[-2, -14, 0.5, '#d9b878'], [9, -24, 0.9, '#c9a868'], [-14, -22, 0.2, '#d9b878']].forEach(b => boat(ctx, b[0], b[1], b[2], b[3], { L: 8, W: 1.5, col2: '#8a6a3a', y: -0.6, tilt: 0.14, noCollide: 1 }));
  scatter(ctx, 26, -80, 80, 8, 70, (x, z) => H(x, z) > 0.6, (x, z) => tree(ctx, x, z, Object.assign({}, TREES.pine, { h: 6 + rng() * 3 })));
  scatter(ctx, 900, -60, 60, 6, 60, (x, z) => H(x, z) > 1.0, (x, z) => grass(ctx, x, z, { cols: ['#8fa67a', '#a9b88a', '#6f8f6a'] }));
  // torii and shrine lantern
  m.c('#c9452f'); for (const s of [-1, 1]) m.cyl(s * 2.2, H(0, 16), 16, 0.22, 0.18, 4.4, 8, 0); m.box(0, H(0, 16) + 4.2, 16, 6.2, 0.3, 0.4, 63); m.box(0, H(0, 16) + 3.5, 16, 5, 0.22, 0.3, 63); m.c('#22202a'); m.box(0, H(0, 16) + 4.5, 16, 6.8, 0.16, 0.55, 63);
  addCircle(ctx, -2.2, 16, 0.3); addCircle(ctx, 2.2, 16, 0.3); lampPost(ctx, 5, 12, { h: 2.2 }); ctx.lamps[ctx.lamps.length - 1].refl = [5, 2, 16, 0.5];
  ctx.npcs.push({ cast: 'traveler', who: 'traveler', x: -6, z: 10, rot: 2.8, pose: 'idle', propUp: 0.5, propBend: 1.2 }, { cast: 'fisher', who: 'fisher', x: -2, z: -14, rot: 0.5, pose: 'wash', y: -0.75 }, { cast: 'fisher', who: null, x: 9.4, z: -23.4, rot: 0.9, pose: 'wash', y: -0.75 });
  ctx.birds.push({ x: 10, z: -20, y: 16, r: 30, n: 9, col: [0.95, 0.95, 0.9], s: 0.5 });
  ctx.spots.push({ art: 'wave', x: 0, z: 8, r: 14, view: { p: [12, 1.0, 7], t: [-8, 9, -26], tod: 0 } });
  easel(ctx, 6, 9, 2.6, ART.wave.c); backGate(ctx, 0, 30, Math.PI);
  bench(ctx, -9, 12.5, Math.PI, { tag: 'bench', col: '#8a5a3a' }); bench(ctx, 12, 14, Math.PI, { tag: 'bench', col: '#8a5a3a' });
  return finishWorld(R, ctx, { id: 'hokusai', defTod: 0, bound: { x0: -100, x1: 100, z0: -90, z1: 100 }, spawn: { x: 0, z: 25, rot: Math.PI }, waterY: -0.5, extra: { fireflies: 0 },
    env: E3({ stroke: 'paper', strokeScale: 0.3, strokeAmt: 0.55, tint: [0.05, 0.02, -0.05], light: [1.08, 1.05, 0.96], shade: [0.62, 0.66, 0.8], fog: H3('#e6dcc0'), fogD: 0.003, waterA: H3('#1f3f78'), waterB: H3('#3f6aa8'), waterC: H3('#f1ead2'), sky: { A: H3('#e6dbbd'), B: H3('#f1e9d0'), C: H3('#d6cba8'), horizon: H3('#f3ecd6'), swirl: 0, cloud: 0.35, cloudCol: H3('#b9b6a8'), flow: 0.004 } }, { mix: 0.6 }) });
};

/* ---- Munch: the bridge over the fjord ---- */
WORLDS.munch = function (R) {
  const H = (x, z) => { const road = 1 - sstep(3.0, 6.5, Math.abs(x - z * 0.12)); return lerp(lerp(-2, 4 + fbm(x * 0.04, z * 0.04, 3) * 9, sstep(8, 30, x - z * 0.12 + Math.sin(z * 0.05) * 6)), 3.0, road); };
  const ctx = mkCtx(1893, H), m = ctx.m, rng = ctx.rng;
  ground(ctx, 110, 2.4, (x, z, h) => mixc(mixc(hex('#3a5a4a'), hex('#5a6a3a'), fbm(x * 0.07, z * 0.07, 2)), hex('#33507a'), sstep(0, -1, h)));
  ctx.groundN = m.nv;
  waterRect(ctx, -220, 60, -220, 120, -0.5, 10, 12);
  const P = z => z * 0.12;
  for (let z = -60; z < 60; z += 1.5) { const x = P(z); m.c(jit(hex(((z / 1.5) | 0) % 2 ? '#8a5a3a' : '#a06a40'), rng, 0.02, 0.05)); m.quad([x - 3.2, 3.06, z + 1.5], [x + 3.2 + 0.18, 3.06, z + 1.5], [x + 3.2, 3.06, z], [x - 3.2 - 0.18, 3.06, z]); }
  for (const s of [-1, 1]) for (let z = -60; z < 60; z += 3) { if ((s < 0 && z >= 18 && z < 24) || (s > 0 && ((z >= 24 && z < 30) || (z >= -36 && z < -30)))) continue; const x = P(z) + s * 3.2, x1 = P(z + 3) + s * 3.2; m.c('#5a3a2e'); m.box(x, 3, z, 0.16, 1.25, 0.16, 61); for (const hh of [0.55, 0.9, 1.22]) { m.push().T((x + x1) / 2, 3 + hh, z + 1.5).RY(Math.atan2(x1 - x, 3)); m.c(hh > 1 ? '#7a4a36' : '#6a4030'); m.box(0, 0, 0, 0.1, 0.1, 3.02, 63); m.pop(); } }
  for (let z = -60; z < 60; z += 6) { if (z !== 18) addBox(ctx, P(z + 3) - 3.3, z + 3, 0.3, 6, 0.12, 1.3, true); if (z !== 24 && z !== -36) addBox(ctx, P(z + 3) + 3.3, z + 3, 0.3, 6, 0.12, 1.3, true); }
  m.c('#4a3a36'); for (let z = -54; z < 60; z += 12) for (const s of [-1, 1]) m.cyl(P(z) + s * 2.8, -2, z, 0.3, 0.3, 5, 6, 0);
  boat(ctx, -30, -20, 0.6, '#3a3a4a', { L: 7, mast: 6, col2: '#d9c8a8', noCollide: 1 }); boat(ctx, -44, -44, 1.0, '#4a3a36', { L: 6, mast: 5, noCollide: 1 });
  m.c('#2a3a5a'); m.box(-70, -1, -120, 9, 12, 7, 61); m.c('#3a3040'); m.cyl(-60, -1, -126, 3, 0.2, 16, 6, 0);
  scatter(ctx, 40, 14, 100, -90, 90, (x, z) => H(x, z) > 4, (x, z) => tree(ctx, x, z, Object.assign({}, TREES.pine, { h: 6 + rng() * 4, leaves: ['#27403a', '#33504a', '#1f3a3a'], lo: 1 })));
  hills(ctx, 150, 230, 46, ['#2f4a7a', '#4a5f9a'], 6.6, { mask: a => 0.25 + 0.75 * Math.pow(Math.abs(Math.sin(a * 0.5 + 0.4)), 1.5) });
  ctx.npcs.push({ cast: 'scream', who: 'scream', x: P(4) + 0.4, z: 4, rot: 0.15, pose: 'scream' }, { cast: 'munchA', who: 'munchA', x: P(-26) - 1.6, z: -26, rot: Math.PI, pose: 'idle', mode: 'path', path: [[P(-52) - 1.6, -52], [P(-16) - 1.6, -16]], speed: 0.6 }, { cast: 'munchA', who: 'munchA', x: P(-26) - 0.8, z: -26, rot: Math.PI, pose: 'idle', mode: 'follow', of: -1, side: 0.8 });
  ctx.spots.push({ art: 'scream', x: P(6), z: 8, r: 12, view: { p: [P(11) + 1.7, 4.45, 11], t: [P(-30) - 1.5, 5.3, -30], tod: 1 } });
  backGate(ctx, P(44), 44, Math.PI, 3.06); ctx.decks = [[-12, 12, -62, 62, 3.06]];
  return finishWorld(R, ctx, { id: 'munch', defTod: 1, bound: { x0: -100, x1: 100, z0: -100, z1: 100 }, spawn: { x: P(38), z: 38, rot: Math.PI }, waterY: -0.5, extra: { fireflies: 0 },
    env: (() => { const e = E3({ strokeAmt: 1.15, tint: [0.22, 0.02, -0.2], fog: H3('#5a6a9a'), waterA: H3('#22386a'), waterB: H3('#4a6aa0'), waterC: H3('#e8a04a'), sky: { A: H3('#6f8fc0'), B: H3('#c9d6e6'), C: H3('#9fb0d0'), horizon: H3('#d9dccc'), swirl: 0, wave: 0.22, band: 0.6, cloud: 0.4 } },
      { sky: { wave: 0.22, band: 0.5 } }, { fog: H3('#c9683a'), sunDir: [-0.7, 0.2, -0.68], sky: { A: H3('#d8452a'), B: H3('#f6b23a'), C: H3('#f7d86a'), accent: H3('#fff0b0'), horizon: H3('#f09a3a'), cloudCol: H3('#3f5a8a'), cloud: 0.42, swirl: 0, wave: 0.24, band: 0.85, sunAmt: 0.5 } });
      e[1].light = [1.15, 0.72, 0.46]; e[1].shade = [0.34, 0.32, 0.6]; e[1].waterA = H3('#27407a'); e[1].waterB = H3('#5a6aa0'); e[1].waterC = H3('#f09a3a'); e[1].nightMix = 0.2; return e; })() });
};

/* ---- Seurat: a Sunday on La Grande Jatte ---- */
WORLDS.seurat = function (R) {
  const H = (x, z) => lerp(-1.8, 0.4 + bump(x, z, 30, -10, 30) * 2.2, sstep(-30, -22, x + Math.sin(z * 0.06) * 3));
  const ctx = mkCtx(1884, H), m = ctx.m, rng = ctx.rng;
  const shadeAt = (x, z) => sstep(4, 16, x - z * 0.25 + vnoise(x * 0.15, z * 0.15) * 6) * (1 - sstep(30, 40, x));
  ground(ctx, 100, 2.2, (x, z, h) => mixc(mixc(mixc(hex('#a9c86a'), hex('#c6d87a'), vnoise(x * 0.3, z * 0.3)), hex('#4f8a5a'), shadeAt(x, z) * 0.85), hex('#5f8fc0'), sstep(0, -0.8, h)));
  ctx.groundN = m.nv;
  waterRect(ctx, -200, -18, -160, 160, -0.5, 8, 12);
  [[8, 4], [14, -12], [20, 10], [26, -4], [12, 22], [30, 20], [18, -28], [34, -18], [6, -22], [24, 32]].forEach(p => tree(ctx, p[0], p[1], Object.assign({}, TREES.dot, { h: 9 + rng() * 3 })));
  scatter(ctx, 30, 36, 90, -90, 90, null, (x, z) => tree(ctx, x, z, Object.assign({}, TREES.dot, { lo: 1 })));
  scatter(ctx, 1800, -24, 40, -50, 50, (x, z) => H(x, z) > 0.2, (x, z, i) => i % 6 ? grass(ctx, x, z, { h: 0.2, cols: ['#a9c86a', '#8fb85a', '#c6d87a', '#6fa05a'] }) : bloom(ctx, x, z, ['#f6e27a', '#fbf4ea', '#e8a0b0'][i % 3]));
  for (const b of [[-40, -12, 1.5, '#f1ead6'], [-58, 14, 1.3, '#f1ead6'], [-36, 30, 1.7, '#c9452f']]) { boat(ctx, b[0], b[1], b[2], b[3], { L: 6, mast: 6.5, noCollide: 1 }); m.ds = true; m.c('#fbf8ee'); m.push().T(b[0], 0, b[1]).RY(b[2]); m.tri([0.5, 1.2, 0], [0.5, 6.4, 0], [3.0, 1.4, 0.3]); m.pop(); m.ds = false; }
  m.c('#e9e2d0'); m.box(-140, -1, 0, 6, 5, 260, 61); for (let i = 0; i < 14; i++) tree(ctx, -128 + rng() * 6, -110 + i * 17, Object.assign({}, TREES.dot, { lo: 1, noCollide: 1 }));
  // the little monkey on its leash
  m.push().T(3.3, H(3.3, 1.6), 1.6).RY(-1.2); m.c('#7a5a3a'); m.ell(0, 0.26, 0, 0.12, 0.13, 0.2, 7, 5); m.ell(0, 0.42, 0.2, 0.1, 0.1, 0.1, 7, 5); m.tube([[0, 0.3, -0.18], [0, 0.55, -0.34], [0.03, 0.75, -0.26], [0, 0.72, -0.16]], 0.022, 4); for (const s of [-1, 1]) for (const z of [-0.12, 0.14]) m.cyl(s * 0.07, 0, z, 0.025, 0.03, 0.2, 4, 0); m.pop();
  ctx.npcs.push({ cast: 'seuratLady', who: 'seuratLady', x: 2.4, z: 2.2, rot: -W2(), pose: 'idle', propUp: 0.6, propBend: 1.5 }, { cast: 'seuratGent', who: 'seuratGent', x: 2.6, z: 3.0, rot: -W2(), pose: 'idle', propUp: 0.1, propBend: 0.35 },
    { cast: 'seuratGirl', who: 'seuratGirl', x: -5, z: 0, rot: 0, pose: 'idle', scale: 0.7, mode: 'wander', rad: 3, speed: 0.9 }, { cast: 'seuratRower', who: 'seuratRower', x: -15, z: 9, rot: -1.9, pose: 'sit', y: H(-15, 9) - 0.3 },
    { cast: 'patronC', who: null, x: -10, z: -6, rot: -1.6, pose: 'sit', y: H(-10, -6) - 0.3 }, { cast: 'patronA', who: null, x: -8.6, z: -5.2, rot: -1.7, pose: 'sit', y: H(-8.6, -5.2) - 0.3 }, { cast: 'monetLady', who: null, x: -12, z: -16, rot: -1.5, pose: 'idle', mode: 'path', path: [[-14, -30], [-12, 26]], speed: 0.6, propUp: 0.6, propBend: 1.5 });
  ctx.spots.push({ art: 'jatte', x: 0, z: 3, r: 14, view: { p: [9.5, 1.5, 9.5], t: [-12, 1.6, -2], tod: 0 } });
  easel(ctx, 6.5, 8, 2.4, ART.jatte.c); backGate(ctx, 14, 0, -Math.PI / 2);
  bench(ctx, 0, 12, 2.6, { tag: 'bench', col: '#3f6a5a' }); bench(ctx, -6, -14, 1.2, { tag: 'bench', col: '#3f6a5a' }); chair(ctx, -17, 3, H(-17, 3), -1.6, { tag: 'chair' }); chair(ctx, 5, -6, H(5, -6), -1.9, { tag: 'chair' });
  return finishWorld(R, ctx, { id: 'seurat', defTod: 0, bound: { x0: -90, x1: 90, z0: -92, z1: 92 }, spawn: { x: 10.5, z: 0, rot: -Math.PI / 2 }, waterY: -0.5, shadowSun: nrm3([0.5, 0.74, 0.3]),
    env: E3({ stroke: 'dots', strokeScale: 0.62, strokeAmt: 1.35, tint: [0.3, -0.05, -0.3], sunDir: [0.5, 0.74, 0.3], fog: H3('#dfe8dc'), waterA: H3('#5f8fc0'), waterB: H3('#9fc0dc'), waterC: H3('#f1ead6'), sky: { A: H3('#9fc0e0'), B: H3('#cfe0ea'), C: H3('#e9e6d0'), horizon: H3('#e6ecd6'), swirl: 0, cloud: 0.3 } }) });
};
function W2() { return Math.PI / 2; }

/* ---- Wang Ximeng: a thousand li of rivers and mountains ---- */
WORLDS.jiangshan = function (R) {
  const isl = [[0, 0, 26], [34, -30, 20], [-40, -22, 22], [10, -64, 24], [-30, 40, 18], [52, 22, 16]];
  const H = (x, z) => { let h = -1.6; for (const i of isl) h = Math.max(h, -1.6 + bump(x, z, i[0], i[1], i[2]) * 3.4); const br = (1 - sstep(1.2, 2.2, Math.abs(z + x * 0.88 + 0.5))) * (x > 8 && x < 26 ? 1 : 0); return h + (fbm(x * 0.1, z * 0.1, 2) - 0.5) * 0.3 * (h > -0.5 ? 1 : 0) + br * 0; };
  const ctx = mkCtx(1113, H), m = ctx.m, rng = ctx.rng;
  ground(ctx, 110, 2.2, (x, z, h) => mixc(mixc(hex('#c9a45a'), hex('#5fa88a'), sstep(0.1, 0.9, h + vnoise(x * 0.2, z * 0.2) * 0.4)), hex('#3f8a8a'), sstep(1.2, 1.8, h)));
  ctx.groundN = m.nv;
  waterRect(ctx, -220, 220, -220, 220, -0.5, 12, 12);
  const peak = (x, z, r, h, far) => { const y = Math.max(-0.5, H(x, z)) - 0.5; m.push().T(x, y, z).RY(rng() * 6); const g = '#3fa07a', b = far ? '#3f6fb0' : '#2a5fa8';
    for (let k = 0; k < (far ? 2 : 4); k++) { const a = k * 1.9 + rng(), o = k ? r * 0.45 : 0, rr = r * (k ? 0.5 + rng() * 0.25 : 1), hh = h * (k ? 0.45 + rng() * 0.35 : 1); m.grad(g, y, hh * 0.5); m.c(jit(hex(b), rng, 0.015, 0.04)); m.lathe(Math.cos(a) * o, 0, Math.sin(a) * o, [[rr, 0], [rr * 0.82, hh * 0.22], [rr * 0.6, hh * 0.5], [rr * 0.42, hh * 0.7], [rr * 0.2, hh * 0.9], [0, hh]], 6, 0.8); }
    m.grad(null); m.pop(); if (!far) { addCircle(ctx, x, z, r * 0.8); ctx.occS.push({ x, y: y + h * 0.3, z, r: r * 0.9 }); } };
  peak(-8, -10, 7, 24); peak(12, 6, 5, 15); peak(34, -34, 8, 30); peak(-44, -26, 7, 22); peak(-34, -14, 5, 14); peak(10, -70, 9, 34); peak(18, -58, 5, 16); peak(-30, 46, 6, 18); peak(54, 26, 6, 20);
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; peak(Math.cos(a) * (130 + rng() * 50), Math.sin(a) * (130 + rng() * 50), 14 + rng() * 10, 30 + rng() * 40, 1); }
  // covered bridge between two islands, a pavilion, pines
  const bx0 = 14, bz0 = -12, bx1 = 24, bz1 = -22, ba = Math.atan2(bx1 - bx0, bz1 - bz0), bl = Math.hypot(bx1 - bx0, bz1 - bz0);
  m.push().T((bx0 + bx1) / 2, 0.5, (bz0 + bz1) / 2).RY(ba); m.c('#b98a5a'); m.box(0, 0, 0, 2.2, 0.14, bl + 6, 63); m.c('#8a3a2a'); for (let k = -3; k <= 3; k++) for (const s of [-1, 1]) m.box(s * 1.0, -2, k * 2.6, 0.14, 4.2, 0.14, 61); m.c('#4a4a52'); m.gable(0, 2.2, 0, 3.0, bl * 0.5, 0.8, false, hex('#8a3a2a')); m.pop();
  ctx.decks = [[Math.min(bx0, bx1) - 3, Math.max(bx0, bx1) + 3, Math.min(bz0, bz1) - 3, Math.max(bz0, bz1) + 3, 0.64]];
  const pav = (x, z) => { const y = H(x, z); m.c('#d9c9a8'); m.box(x, y, z, 4.4, 0.4, 4.4, 61); m.c('#8a3a2a'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { m.cyl(x + sx * 1.8, y + 0.4, z + sz * 1.8, 0.13, 0.13, 2.6, 6, 0); addCircle(ctx, x + sx * 1.8, z + sz * 1.8, 0.2); } m.c('#3a4a52'); m.hip(x, y + 3.0, z, 6.2, 6.2, 1.9, 0); m.c('#e2bb4e'); m.ell(x, y + 5.0, z, 0.18, 0.26, 0.18, 6, 4); ctx.seats.push({ x, z, y: y + 0.4 - 0.49 + 0.2, rot: 2.4, tag: 'tea', low: 1 }); ctx.lamps.push({ x, y: y + 2.4, z, r: 9, col: [1, 0.8, 0.45], k: 0.8 }); };
  pav(4, 14); pav(38, -22);
  scatter(ctx, 60, -60, 64, -80, 56, (x, z) => H(x, z) > 0.5 && H(x, z) < 1.5, (x, z) => tree(ctx, x, z, Object.assign({}, TREES.pine, { h: 4 + rng() * 3, leaves: ['#2f6a5a', '#3f7a5a', '#27584a'] })));
  scatter(ctx, 1300, -60, 64, -80, 56, (x, z) => H(x, z) > 0.2, (x, z, i) => i % 7 ? grass(ctx, x, z, { cols: ['#5fa88a', '#7fb88a', '#3f8a7a'] }) : bloom(ctx, x, z, ['#fbf4ea', '#f0a8b8'][i % 2]));
  boat(ctx, -14, 22, 0.8, '#8a6a4a', { L: 6, noCollide: 1 }); boat(ctx, 30, 2, 2.2, '#8a6a4a', { L: 5, mast: 4, noCollide: 1 });
  ctx.npcs.push({ cast: 'scholar', who: 'scholar', x: 6, z: 11, rot: 0.6, pose: 'idle', mode: 'wander', rad: 4, speed: 0.7 }, { cast: 'boatman', who: 'boatman', x: -14, z: 22, rot: 0.8, pose: 'fish', y: -0.2, propUp: 0.6, propBend: 0.7 });
  ctx.birds.push({ x: 0, z: -20, y: 20, r: 40, n: 8, col: [0.97, 0.97, 0.95], s: 0.6 });
  ctx.spots.push({ art: 'jiangshan', x: 2, z: 8, r: 14, view: { p: [-3, 3.4, 22], t: [8, 9, -30], tod: 0 } });
  easel(ctx, -2, 14, 2.6, ART.jiangshan.c); backGate(ctx, -8, 16, 2.2);
  return finishWorld(R, ctx, { id: 'jiangshan', defTod: 0, bound: { r: 100 }, spawn: { x: -5.4, z: 14.1, rot: 2.2 }, waterY: -0.5,
    env: E3({ stroke: 'paper', strokeScale: 0.3, strokeAmt: 0.6, tint: [0.04, 0.03, -0.04], light: [1.06, 1.04, 0.96], shade: [0.6, 0.68, 0.8], fog: H3('#dccb9c'), fogD: 0.0034, waterA: H3('#c2b182'), waterB: H3('#d9c99c'), waterC: H3('#efe4c2'), sky: { A: H3('#d6c493'), B: H3('#e6d7ae'), C: H3('#cdb983'), horizon: H3('#e9dcb6'), swirl: 0, cloud: 0.25, cloudCol: H3('#f1e8cc'), flow: 0.003, sunCol: H3('#e0563a'), haloCol: H3('#e6c08a') } }, { mix: 0.55 }) });
};

/* ---- an open-air museum: sixteen masterpieces, three sculptures, a lady with a famous smile ---- */
WORLDS.museum = function (R) {
  const inHall = (x, z) => Math.abs(x) < 13 && z > -86 && z < 12;
  const H = (x, z) => (1 - sstep(13, 30, Math.max(Math.abs(x) - 0, 0)) * 0 ) * 0 + sstep(40, 90, Math.hypot(x, z + 36)) * (fbm(x * 0.02 + 5, z * 0.02, 3) - 0.4) * 9;
  const ctx = mkCtx(1503, H), m = ctx.m, rng = ctx.rng; ctx.paved = [];
  ground(ctx, 130, 2.6, (x, z, h) => { const n = fbm(x * 0.07, z * 0.07 + 2, 3); return mixc(mixc(hex('#7fb060'), hex('#a3c770'), n), hex('#5f9458'), sstep(0.6, 0.3, n) * 0.5); }, { cz: -36 });
  // marble floor
  const T0 = hex('#efe6d2'), T1 = hex('#c9a27a'), T2 = hex('#8a3a2e');
  { const base = m.nv, cs = 2, nx = 13, nz = 49; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x0 = -13 + i * cs, z0 = -86 + j * cs, c = (i + j) % 2 ? T0 : ((i * 3 + j) % 5 === 0 ? T2 : T1); m.col = jit(c, rng, 0.006, 0.025); m.quad([x0, 0.05, z0 + cs], [x0 + cs, 0.05, z0 + cs], [x0 + cs, 0.05, z0], [x0, 0.05, z0]); } }
  ctx.groundN = m.nv;
  m.c('#d9cdb6'); m.box(0, -0.4, -37, 27, 0.44, 99.4, 60);
  // two long walls of paintings, with a colonnade in front of each
  const WALL = '#8a2f2a', list = ['mona', 'pearl', 'venusb', 'meninas', 'kiss', 'sunrise', 'arnolfini', 'haywain', 'supper', 'milk', 'nightwatch', 'liberty', 'adam', 'athens', 'swing', 'starry'];
  const asp = { mona: 0.69, pearl: 0.88, venusb: 1.62, meninas: 0.87, kiss: 1.0, sunrise: 1.31, arnolfini: 0.73, haywain: 1.42, supper: 1.91, milk: 0.9, nightwatch: 1.2, liberty: 1.25, adam: 2.04, athens: 1.54, swing: 0.79, starry: 1.25 };
  for (const s of [-1, 1]) {
    m.grad('#5a2422', 0, 3); m.c(WALL); m.box(s * 12.4, 0, -37, 0.7, 6.4, 80, 61); m.grad(null);
    m.c('#e9dcc0'); m.box(s * 12.4, 0, -37, 0.86, 0.9, 80.2, 61); m.box(s * 12.4, 6.4, -37, 1.1, 0.4, 80.4, 63);
    addBox(ctx, s * 12.4, -37, 0.9, 80.2, 0, 6.8);
    for (let i = 0; i < 8; i++) {
      const art = list[(s < 0 ? 0 : 8) + i], z = -4 - i * 9.4, hh = 2.9, ww = Math.min(4.8, hh * asp[art]), h2 = ww / asp[art];
      picture(ctx, s * 12.0, 1.55 + (2.9 - h2) / 2, z, s < 0 ? Math.PI / 2 : -Math.PI / 2, ww, h2, art);
    }
    for (let i = 0; i <= 8; i++) { const z = 0.7 - i * 9.4, x = s * 9.6; m.c('#f1ead6'); m.cyl(x, 0, z, 0.5, 0.44, 0.35, 10, 0); m.lathe(x, 0.35, z, [[0.36, 0], [0.33, 2.4], [0.3, 4.9], [0.42, 5.1], [0.46, 5.25]], 12); addCircle(ctx, x, z, 0.5); ctx.occS.push({ x, y: 3, z, r: 0.7 }); }
    m.c('#efe6d2'); m.box(s * 9.6, 5.6, -37, 1.1, 0.5, 78, 63); m.c('#d9c9a8'); m.box(s * 9.6, 6.1, -37, 1.3, 0.16, 78.2, 63);
    for (let i = 0; i < 8; i++) lampPost(ctx, s * 9.5, -4 - i * 9.4 - 4.7, { h: 2.9, r: 10, k: 0.7 });
  }
  // end wall with a niche for David, a rotunda of columns
  m.c('#e9dcc0'); m.box(0, 0, -80.5, 25.4, 0.9, 0.9, 61); m.c(WALL); m.box(0, 0.9, -80.5, 25.4, 5.5, 0.7, 61); m.c('#e9dcc0'); m.box(0, 6.4, -80.5, 25.8, 0.4, 1.1, 63); addBox(ctx, 0, -80.5, 25.4, 0.9, 0, 6.8);
  const plinth = (x, z, r, h) => { m.c('#e9e2d2'); m.lathe(x, 0.05, z, [[r * 1.15, 0], [r * 1.15, 0.2], [r, 0.3], [r, h - 0.2], [r * 1.08, h - 0.1], [r * 1.08, h]], 14); m.c('#d6ccb6'); m.disc(x, h + 0.05, z, r * 1.08, 14); addCircle(ctx, x, z, r * 1.15); ctx.occS.push({ x, y: h, z, r: r * 1.4 }); };
  plinth(0, -66, 1.7, 1.5); plinth(0, -24, 1.2, 1.1); plinth(0, -44, 1.3, 0.9);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.39, x = Math.cos(a) * 5.4, z = -66 + Math.sin(a) * 5.4; m.c('#f1ead6'); m.lathe(x, 0.05, z, [[0.4, 0], [0.3, 0.3], [0.27, 6.3], [0.4, 6.6]], 10); addCircle(ctx, x, z, 0.4); }
  m.c('#efe6d2'); const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; ring.push([Math.cos(a) * 5.4, 6.9, -66 + Math.sin(a) * 5.4]); } m.tube(ring, 0.36, 6);
  ctx.npcs.push({ cast: 'david', who: 'david', x: 0, z: -66, y: 1.55, rot: 0, pose: 'statue', statue: 'david', scale: 2.5 }, { cast: 'venus', who: 'venusm', x: 0, z: -24, y: 1.15, rot: 0.2, pose: 'statue', statue: 'venus', scale: 1.7 }, { cast: 'thinker', who: 'thinker', x: 0, z: -44, y: 1.42, rot: 0, pose: 'statue', statue: 'thinker', scale: 1.8 });
  m.c('#d9cdb6'); m.box(0, 0.95, -44.2, 1.5, 0.75, 1.3, 61);
  ctx.spots.push({ art: 'david', x: 0, z: -61, r: 6, view: { p: [0, 1.5, -57.5], t: [0, 5.2, -66], tod: 0 } }, { art: 'venusm', x: 0, z: -21, r: 4 }, { art: 'thinker', x: 0, z: -41, r: 4 });
  ctx.lamps.push({ x: 0, y: 5, z: -62, r: 12, col: [1, 0.9, 0.7], k: 0.9 }, { x: 0, y: 4, z: -21, r: 9, col: [1, 0.9, 0.7], k: 0.8 }, { x: 0, y: 4, z: -41, r: 9, col: [1, 0.9, 0.7], k: 0.8 });
  // long pool, benches, hedges and cypresses outside
  m.c('#e9e2d2'); m.box(0, 0.05, -8.5, 5.4, 0.4, 14.4, 61); m.c('#5f9fc8', 0.1); m.box(0, 0.05, -8.5, 4.6, 0.32, 13.6, 1); addBox(ctx, 0, -8.5, 5.4, 14.4, 0, 0.5, true);
  [[-5, -6, 1.57], [5, -6, -1.57], [-5, -14.5, 1.57], [5, -14.5, -1.57], [-4.4, -33, 1.57], [4.4, -33, -1.57], [-4.4, -52, 1.57], [4.4, -52, -1.57]].forEach(b => bench(ctx, b[0], b[1], b[2], { tag: 'bench', col: '#6a4a36' }));
  [[-7.6, -29, 1.3], [7.6, -38, -1.3], [-7.6, -57, 1.3], [7.6, -66.5, -1.3]].forEach(c => armchair(ctx, c[0], c[1], 0.05, c[2], { col: '#7a5a2e', seat: '#8a2f2a', tag: 'chair' }));
  for (const s of [-1, 1]) for (let i = 0; i < 11; i++) { cypress(ctx, s * 17.5, 2 - i * 8.4, 8 + (i % 3)); bush(ctx, s * 15, -2 - i * 8.4, 1.1, ['#3f7a4a', '#5a9a4f', '#2f6a52'], { n: 4 }); }
  scatter(ctx, 34, -110, 110, -150, 80, (x, z) => Math.abs(x) > 24 || z < -92 || z > 22, (x, z, i) => tree(ctx, x, z, Object.assign({}, [TREES.plane, TREES.apple, TREES.olive][i % 3], { lo: 1 })));
  scatter(ctx, 2600, -70, 70, -120, 40, (x, z) => !inHall(x, z) && Math.abs(x) > 14.5 || z < -82 || z > 13, (x, z, i) => i % 4 ? grass(ctx, x, z) : bloom(ctx, x, z, ['#f6e27a', '#fbf4ea', '#e86a3a', '#c9a8e0'][i % 4]));
  ctx.npcs.push({ cast: 'mona', who: 'mona', x: -9.2, z: -1.4, rot: 1.2, pose: 'fold' }, { cast: 'visitorA', who: 'visitor', x: 9.8, z: -14, rot: 1.57, pose: 'hold' }, { cast: 'visitorB', who: 'visitor', x: -9.9, z: -41, rot: -1.57, pose: 'think' }, { cast: 'patronC', who: null, x: 4, z: -30, rot: 0, pose: 'idle', mode: 'path', path: [[4, -56], [4, -20], [-4, -20], [-4, -56]], speed: 0.6 });
  hills(ctx, 150, 220, 26, ['#6f9a6a', '#a3c08a'], 2.2);
  backGate(ctx, 0, 14, Math.PI);
  return finishWorld(R, ctx, { id: 'museum', defTod: 0, bound: { r: 118, z: -36 }, spawn: { x: 0, z: 9.5, rot: Math.PI }, shadowSun: nrm3([-0.5, 0.7, 0.5]), extra: { fireflies: 0 },
    env: E3({ strokeAmt: 0.8, sunDir: [-0.5, 0.7, 0.5], fog: H3('#d6e2dc'), waterA: H3('#5f9fc8'), waterB: H3('#9fc8dc'), waterC: H3('#f1ead6'), sky: { A: H3('#5f9ad6'), B: H3('#a6cdea'), C: H3('#e6ecd8'), horizon: H3('#e9efdc'), swirl: 0.35, cloud: 0.75 } }) });
};

/* ---- Friedrich: the wanderer above the sea of fog ---- */
WORLDS.fog = function (R) {
  const H = (x, z) => -6 + bump(x, z, 0, 8, 36) * 12.5 + bump(x, z, -40, -34, 22) * 11 + bump(x, z, 44, -26, 20) * 10 + bump(x, z, 18, -66, 24) * 12 + bump(x, z, -34, 44, 18) * 9 + bump(x, z, 58, 40, 20) * 9.5 + (fbm(x * 0.09, z * 0.09, 3) - 0.5) * 2.2;
  const ctx = mkCtx(1818, H), m = ctx.m, rng = ctx.rng;
  ground(ctx, 120, 2.4, (x, z, h) => { const n = fbm(x * 0.12, z * 0.12, 3); let c = mixc(hex('#3a3f48'), hex('#5a5f66'), n); c = mixc(c, hex('#4a5a40'), sstep(1.5, 4.5, h) * sstep(0.35, 0.6, n)); return mixc(c, hex('#8a94a0'), sstep(1.0, -1.5, h) * 0.7); });
  ctx.groundN = m.nv;
  waterRect(ctx, -260, 260, -260, 260, 0, 14, 14, [0.5, 0.5, 0.5], 0.35);
  const rock = (x, z, r, h) => { const y = H(x, z) - 0.4; m.push().T(x, y, z).RY(rng() * 6).RZ(rng.s() * 0.12); m.grad('#22262e', y, h * 0.7); m.c(jit(hex('#4a4f58'), rng, 0.01, 0.04)); m.lathe(0, 0, 0, [[r, 0], [r * 0.92, h * 0.3], [r * 0.7, h * 0.62], [r * 0.4, h * 0.88], [0, h]], 6, 0.75); m.grad(null); m.pop(); addCircle(ctx, x, z, r * 0.7); ctx.occS.push({ x, y: y + h * 0.4, z, r }); };
  [[-3.2, 1.5, 1.6, 2.6], [3.6, 3.5, 1.3, 2.0], [-5, 8, 1.8, 3.4], [5.5, 10, 1.5, 2.8], [1.6, -3.4, 0.9, 1.1], [-1.8, -2.8, 0.8, 0.9], [-8, 16, 2.2, 3], [8, 20, 1.6, 2.2]].forEach(r => rock(r[0], r[1], r[2], r[3]));
  scatter(ctx, 60, -90, 90, -90, 90, (x, z) => H(x, z) > 1.2 && Math.hypot(x, z - 4) > 9, (x, z) => rock(x, z, 0.8 + rng() * 1.6, 1 + rng() * 3));
  scatter(ctx, 26, -90, 90, -90, 90, (x, z) => H(x, z) > 2 && Math.hypot(x, z - 6) > 8, (x, z) => tree(ctx, x, z, Object.assign({}, TREES.pine, { h: 4 + rng() * 3, leaves: ['#27403a', '#33504a', '#1f3a3a'] })));
  scatter(ctx, 900, -60, 60, -70, 60, (x, z) => H(x, z) > 2.5, (x, z) => grass(ctx, x, z, { cols: ['#5a6a48', '#6f7a52', '#4a5a44'], h: 0.26 }));
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.2, d = 150 + rng() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d, hh = 20 + rng() * 34; m.c(jit(hex('#7f8ea6'), rng, 0.01, 0.04)); m.grad('#c9d2dc', 0, hh * 0.5); m.lathe(x, -2, z, [[hh * 0.8, 0], [hh * 0.5, hh * 0.4], [hh * 0.22, hh * 0.8], [0, hh]], 7, 0.8); m.grad(null); }
  m.c('#93a2ba'); m.grad('#d6dde6', 0, 40); m.lathe(-30, -2, -250, [[90, 0], [50, 30], [22, 58], [0, 70]], 8, 0.7); m.grad(null);
  const sy = H(0, -1.2);
  ctx.npcs.push({ cast: 'wanderer', who: 'wanderer', x: 0, z: -1.2, rot: Math.PI, pose: 'idle', propUp: 0.1, propBend: 0.4 });
  ctx.spots.push({ art: 'wanderer', x: 0, z: 2, r: 9, view: { p: [0.2, sy + 1.75, 3.4], t: [0, sy + 1.9, -40], tod: 0 } });
  bench(ctx, 3.4, 7.2, Math.PI + 0.4, { tag: 'bench', col: '#4a4038' }); chair(ctx, -2.6, 5.4, H(-2.6, 5.4), Math.PI - 0.3, { tag: 'chair', col: '#6a5a44', seat: '#8a7a5a' });
  easel(ctx, 2.6, 4.6, Math.PI + 0.3, ART.wanderer.c); backGate(ctx, 0, 24, Math.PI);
  ctx.birds.push({ x: 0, z: -30, y: 14, r: 40, n: 6, col: [0.1, 0.1, 0.14], s: 0.7 });
  return finishWorld(R, ctx, { id: 'fog', defTod: 0, bound: { r: 110 }, spawn: { x: 0, z: 19.5, rot: Math.PI }, waterY: 0, extra: { fireflies: 0 },
    env: E3({ strokeAmt: 0.85, tint: [0.08, 0.02, -0.08], light: [1.05, 1.02, 0.98], shade: [0.5, 0.56, 0.72], fog: H3('#c9d2dc'), fogD: 0.006, reflAmt: 0, glitter: 0, waterA: H3('#d2dae4'), waterB: H3('#f0f2f0'), waterC: H3('#ffffff'), sky: { A: H3('#93a8c4'), B: H3('#d9e2ea'), C: H3('#f1ead6'), horizon: H3('#eef0ee'), swirl: 0.15, cloud: 0.6, flow: 0.006 } },
      { mix: 0.6 }, { fog: H3('#e6c8a8') }) });
};
