'use strict';
/* 梵高小镇 — Arles, Saint-Rémy and Auvers folded into one walkable town. */
WORLDS.town = function (R) {
  const urban = (x, z) => sstep(-58, -48, x) * (1 - sstep(66, 76, x)) * sstep(-66, -58, z) * (1 - sstep(41, 44, z));
  const H = (x, z) => {
    const r = Math.hypot(x, z);
    let h = sstep(56, 112, r) * (fbm(x * 0.017 + 3.1, z * 0.017 + 7.7, 3) - 0.47) * 8.5 * (1 - urban(x, z));
    h *= 1 - bump(x, z, -60, 0, 14);
    h += bump(x, z, -54, -74, 33) * 10 + bump(x, z, 2, -95, 30) * 3.4 + bump(x, z, 74, -86, 28) * 7.5;
    h *= 1 - bump(x, z, 87, -7, 27);
    h -= bump(x, z, 84, -2, 9.5) * 1.55;
    const far = 1 - sstep(124, 132, z);
    h = lerp(h, -1.7, sstep(41, 46.5, z) * far);
    h = lerp(h, -1.6, (1 - sstep(2.4, 5.0, Math.abs(x + 52))) * sstep(-44, -34, z) * far);
    return h;
  };
  const ctx = mkCtx(1888, H); ctx.paths = new Paths(); ctx.paved = []; ctx.decks = [];
  const m = ctx.m, d = ctx.d, rng = ctx.rng;
  const rectK = (x, z, x0, x1, z0, z1, n) => sstep(0, 3, Math.min(x - x0, x1 - x, z - z0, z1 - z) + n);
  const G1 = hex('#6a9f4a'), G2 = hex('#8fb54f'), G3 = hex('#b9c75a'), G4 = hex('#4f8a55');
  const reg = {
    wheat: (x, z, n) => rectK(x, z, -120, -59, -30, 40, n), sower: (x, z, n) => rectK(x, z, -114, -64, -60, -33, n),
    sun: (x, z, n) => rectK(x, z, 46, 75, 6, 32, n), poppy: (x, z, n) => rectK(x, z, 84, 116, -52, -26, n),
    vine: (x, z, n) => rectK(x, z, 42, 66, -74, -57, n), orchard: (x, z, n) => rectK(x, z, 47, 81, -51, -21, n),
  };
  ground(ctx, 178, 2.2, (x, z, h) => {
    const n1 = fbm(x * 0.06 + 1.3, z * 0.06 + 4.2, 3), n2 = vnoise(x * 0.33 + 9, z * 0.33 + 2), nn = (n2 - 0.5) * 5;
    let c = mixc(G1, G2, n1); c = mixc(c, G3, sstep(0.55, 0.85, n2) * 0.6); c = mixc(c, G4, sstep(0.6, 0.3, n1) * 0.5);
    c = mixc(c, mixc(hex('#d9b040'), hex('#c79a2e'), n2), reg.wheat(x, z, nn));
    const fur = 0.5 + 0.5 * Math.sin(z * 1.9 + x * 0.25 + n1 * 6);
    c = mixc(c, mixc(hex('#7c6cb0'), hex('#c98a4c'), fur * 0.55 + n2 * 0.2), reg.sower(x, z, nn));
    c = mixc(c, hex('#7c9440'), reg.sun(x, z, nn) * 0.8); c = mixc(c, hex('#7fae54'), reg.poppy(x, z, nn) * 0.7);
    c = mixc(c, mixc(hex('#b0603c'), hex('#c9783a'), n2), reg.vine(x, z, nn) * 0.85);
    c = mixc(c, hex('#9fc070'), reg.orchard(x, z, nn) * 0.5);
    c = mixc(c, hex('#cdbb8a'), sstep(0.25, -0.15, h) * sstep(38, 41, z));
    c = mixc(c, hex('#3f5f7a'), sstep(-0.3, -0.9, h));
    if (z > 132) c = mixc(c, hex('#4a6a8a'), 0.5);
    return c;
  });
  /* country paths */
  const DIRT = ['#dcb873', '#c9a25a'];
  ribbon(ctx, [[-56, 0], [-62, 0.5], [-70, 2], [-80, 3], [-92, 5], [-104, 4], [-118, 6]], 3.0, DIRT);
  ribbon(ctx, [[-64, 1], [-70, -5], [-78, -12], [-90, -18], [-104, -22], [-116, -22]], 2.4, DIRT, { taper: 0.6 });
  ribbon(ctx, [[-64, 1], [-70, 9], [-78, 18], [-90, 26], [-104, 32], [-116, 34]], 2.4, DIRT, { taper: 0.6 });
  ribbon(ctx, [[-70, -5], [-72, -18], [-76, -30], [-80, -40], [-86, -48]], 2.0, DIRT);
  ribbon(ctx, [[1, -72], [-4, -77], [-10, -84], [-15, -94], [-17, -106], [-14, -118]], 2.6, ['#e6c77a', '#d2ad5c']);
  ribbon(ctx, [[1, -72], [7, -77], [14, -84], [19, -94], [21, -106], [18, -118]], 2.6, ['#e6c77a', '#d2ad5c']);
  ribbon(ctx, [[-8.2, -61.5], [-18, -62], [-28, -60], [-36, -60], [-44, -64], [-49, -69]], 2.2, DIRT);
  ribbon(ctx, [[-46, -8], [-44, -20], [-40, -34], [-36, -46], [-36, -60]], 2.0, DIRT);
  ribbon(ctx, [[45, 0], [52, 1.5], [60, 2], [68, 1], [74, -1.5]], 3.0, DIRT);
  ribbon(ctx, [[60, 2], [59, 12], [60, 22], [62, 31], [63, 36]], 2.2, DIRT);
  ribbon(ctx, [[13, -57], [26, -57.5], [38, -54], [46, -46], [56, -40], [66, -37], [78, -36], [90, -38], [100, -40]], 2.4, DIRT);
  ribbon(ctx, [[66, -37], [68, -50], [70, -62], [72, -72], [73, -79]], 2.2, DIRT);
  ribbon(ctx, [[74, -1.5], [78, -9], [82, -13], [88, -12.5]], 2.0, ['#d8d0c0', '#bfb6a8']);
  ribbon(ctx, [[78, -36], [80, -26], [82, -18], [84, -13]], 2.0, DIRT);
  /* cobbles */
  const COB = ['#b9a8bd', '#c9aaaa', '#9ea7c6', '#cdb891', '#a898b8', '#bfb2c4'];
  pave(ctx, [[-17, 17, -13, 13], [-3.6, 4.9, -60, -13], [-46.5, -17, -3.6, 3.6], [17, 45, -3.6, 3.6], [-4, 4, 13, 36], [-46.5, 64, 36, 41]], 0.85, COB);
  pave(ctx, [[-11, 12, -72, -60]], 0.85, COB, { H: 1 });
  ctx.groundN = m.nv;
  const paved = (x, z, pad) => inRects(ctx.paved, x, z, pad || 0);
  const wet = (x, z) => H(x, z) < -0.25;
  const inBox = (x, z, pad) => { for (const b of ctx.boxes) { const ex = x - b.x, ez = z - b.z, lx = ex * b.c - ez * b.s, lz = ex * b.s + ez * b.c; if (Math.abs(lx) < b.hw + pad && Math.abs(lz) < b.hd + pad) return true; } return false; };

  /* ---------- water ---------- */
  waterRect(ctx, -190, 190, 41.2, 131, -0.55, 14, 6);
  waterRect(ctx, -57.6, -46.4, -44, 42, -0.55, 1, 8);
  waterDisc(ctx, 84, -2, 7.6, -0.4, [0.5, 0.56, 0.5]);
  m.c('#b9aeb4'); m.grad('#6a6a8a', -1.6, 1.6); m.box(9, -2, 41.5, 111, 2.03, 0.9, 61); m.grad(null);
  m.c('#cfc4c0'); m.box(9, 0.03, 41.4, 111, 0.16, 0.7, 61);

  /* ---------- the town ---------- */
  const SH = ['#3f8a6a', '#3f7a8a', '#5a8a6a', '#3f6a9a', '#4f8a5a', '#4a7a9a'];
  const W = Math.PI / 2;
  // Café Terrace at Night
  house(ctx, { x: -13.3, z: -22.5, w: 17, d: 9.4, rot: W, h: 8.8, floors: 3, wall: '#ecc85a', roof: '#5a6aa0', shutters: '#3f8a6a', shop: true, cols: 5, door: 0, doorCol: '#2f6f8a', lit: 0.4, trim: '#27408a',
    awning: { col: '#f6cf3e', col2: '#f0b930', d: 4.7, w: 15.6, y: 4.5, glow: 0.55 } });
  m.c('#dc923a'); m.box(-6.05, 0, -22.5, 5.1, 0.22, 16, 61); m.c('#b9682a'); m.box(-3.5, 0, -22.5, 0.12, 0.24, 16, 61);
  ctx.decks.push([-8.6, -3.45, -30.5, -14.5, 0.22]);
  for (const lz of [-18.6, -26.4]) {
    m.c('#27303a'); m.cyl(-6.3, 3.75, lz, 0.015, 0.015, 0.5, 4, 0); m.c('#ffe07a', 1); m.cyl(-6.3, 3.3, lz, 0.14, 0.2, 0.45, 6, 3);
    ctx.lamps.push({ x: -6.3, y: 3.4, z: lz, r: 16, col: [1.0, 0.78, 0.28], k: 0.95 }); ctx.glows.push({ x: -6.3, y: 3.5, z: lz, s: 2.3, col: [1.0, 0.86, 0.40] });
  }
  const tables = [[-7.4, -16.6], [-5.5, -17.2], [-7.4, -19.4], [-5.2, -20.2], [-7.4, -22.4], [-7.4, -25.2], [-5.4, -24.6], [-7.4, -28.2], [-5.3, -27.6]];
  tables.forEach((t, i) => {
    cafeTable(ctx, t[0], t[1], 0.22, { cup: i % 3 === 0 ? 0 : 1 });
    chair(ctx, t[0], t[1] + 0.72, 0.22, Math.PI, { tag: 'cafe' }); chair(ctx, t[0] + (i % 2 ? 0.72 : -0.0), t[1] - 0.72, 0.22, 0, { tag: 'cafe', noSeat: i % 2 === 0 });
  });
  ctx.npcs.push({ cast: 'patronA', who: null, x: -7.4, z: -18.68, rot: 0, pose: 'sit', sit: 0.22 }, { cast: 'patronB', who: null, x: -7.4, z: -24.48, rot: 0, pose: 'sit', sit: 0.22 }, { cast: 'patronC', who: null, x: -5.4, z: -23.88, rot: Math.PI, pose: 'sit', sit: 0.22, dz: 0 },
    { cast: 'waiter', who: 'waiter', x: -6.3, z: -21.6, rot: 0.6, pose: 'serve', mode: 'wander', rad: 1.2, y: 0.22 },
    { cast: 'ginoux', who: 'ginoux', x: -6.2, z: -13.3, rot: 0.5, pose: 'hold' });
  ctx.spots.push({ art: 'cafe', x: -1, z: -17, r: 9, view: { p: [3.6, 1.5, -8.4], t: [-4.2, 3.9, -27], tod: 2 } });
  easel(ctx, 5.6, -10.2, -2.2, ART.cafe.c);
  // east row
  [[-18.5, 10, 9.6, '#9aa6cf', '#b9603e', 1], [-28.6, 9.6, 8.2, '#cfa9b6', '#c96a3e', 0], [-38.6, 10, 10.6, '#b9c2a2', '#a8553a', 0], [-48.9, 10, 8.6, '#dcc490', '#c9603a', 0]].forEach((b, i) =>
    house(ctx, { x: 9.1, z: b[0], w: b[1], d: 8.4, rot: -W, h: b[2], wall: b[3], roof: b[4], shutters: SH[i], shop: !!b[5], door: b[5] ? 3 : 1, lit: 0.7 }));
  [[-36.5, 10, 9, '#d9b7a0', '#b9603e'], [-47, 10.4, 10.2, '#a9b4d6', '#c96a3e'], [-56.4, 7.2, 8, '#e2cf9a', '#a8553a']].forEach((b, i) =>
    house(ctx, { x: -7.9, z: b[0], w: b[1], d: 8.4, rot: W, h: b[2], wall: b[3], roof: b[4], shutters: SH[i + 2], door: 1, lit: 0.65 }));
  // post office and flower shop on the plaza's west side
  house(ctx, { x: -23, z: -9, w: 9, d: 11, rot: W, h: 7.4, wall: '#b9cbe0', roof: '#b9603e', shutters: '#2b3f8e', door: 1, doorCol: '#2b3f8e', lit: 0.6, base: '#8f9ab8' });
  m.c('#edc24a'); m.box(-17.42, 3.0, -9, 0.1, 0.5, 3.2, 63); m.c('#2b3f8e'); m.box(-17.36, 3.08, -9, 0.1, 0.34, 2.9, 63);
  m.c('#e9b83a'); m.box(-17.2, 0.9, -11.6, 0.36, 0.55, 0.5, 63); m.c('#2b3f8e'); m.box(-17.2, 0, -11.6, 0.12, 0.9, 0.12, 60);
  ctx.npcs.push({ cast: 'roulin', who: 'roulin', x: -15.9, z: -7.2, rot: 1.3, pose: 'fold' });
  house(ctx, { x: -23, z: 9, w: 9, d: 11, rot: W, h: 7.0, wall: '#e9d7b8', roof: '#c96a3e', shutters: '#3f8a5a', shop: true, cols: 3, door: 1, doorCol: '#3f8a5a', lit: 0.7, awning: { col: '#f3b6b0', col2: '#f6ead6', d: 2.4, w: 8.2, y: 3.1 } });
  // flower shop buckets: the cut flowers of 1888
  for (let i = 0; i < 9; i++) {
    const bx = -15.6 - (i % 3) * 0.75, bz = 6.3 + Math.floor(i / 3) * 1.25 + (i % 3) * 0.2;
    m.c(jit(hex(['#3f8a8a', '#c9783a', '#e9dfc0'][i % 3]), rng, 0.02, 0.04)); m.cyl(bx, 0, bz, 0.2, 0.26, 0.42, 8, 0);
    for (let k = 0; k < 5; k++) { const fx = bx + rng.s() * 0.16, fz = bz + rng.s() * 0.16; if (i % 3 === 0) sunflower(ctx, fx, fz, { y: 0.3, h: 0.55 + rng() * 0.35, face: 1.6, R: 0.11 }); else if (i % 3 === 1) iris(ctx, fx, fz, { y: 0.3, white: i === 4 && k === 0 }); else poppy(ctx, fx, fz, { y: 0.3, col: k % 2 ? '#f3a9b6' : '#d93a2b' }); }
  }
  m.c('#c9a56a'); m.box(-16.3, 0, 11.4, 1.5, 0.8, 0.7, 61); m.c('#e2b23c'); m.cyl(-16.3, 0.8, 11.4, 0.16, 0.2, 0.34, 8, 0);
  for (let k = 0; k < 7; k++) sunflower(ctx, -16.3 + rng.s() * 0.14, 11.4 + rng.s() * 0.14, { y: 1.05, h: 0.45 + rng() * 0.3, face: 1.6 + rng.s(), R: 0.12 });
  ctx.npcs.push({ cast: 'berceuse', who: 'berceuse', x: -15.2, z: 10.0, rot: 1.4, pose: 'fold' });
  ctx.spots.push({ art: 'sunflowers', x: -14.5, z: 9, r: 6, view: { p: [-13.6, 1.25, 11.4], t: [-16.3, 1.45, 11.4], tod: 0 } });
  // night café and the yellow house on the east side
  house(ctx, { x: 22.6, z: -9.5, w: 9.5, d: 10.6, rot: -W, h: 7.2, wall: '#c8463a', roof: '#3f6a5a', trim: '#2f6a4a', shutters: '#3f8a5a', shop: true, cols: 3, door: 1, doorCol: '#3f8a5a', lit: 0.9 });
  ctx.spots.push({ art: 'nightcafe', x: 15.5, z: -9.5, r: 5 });
  house(ctx, { x: 23.5, z: 9.6, w: 11, d: 9, rot: Math.PI, h: 7.2, wall: '#f4cd45', roof: '#c9603a', shutters: '#3f8a5a', door: 2, doorCol: '#3f8a5a', lit: 0.75, trim: '#2f5f9a', cols: 4, sideCols: 3, sideShop: false, base: '#d9a93a',
    awning: null });
  // pink awning of the grocer next door, on the plaza side
  m.ds = true; for (let i = 0; i < 6; i++) { m.c(i % 2 ? '#f0a8a8' : '#f6d8cc'); const z0 = 5.6 + i * 1.3, z1 = z0 + 1.3; m.quad([17.9, 3.1, z0], [17.9, 3.1, z1], [16.2, 2.5, z1], [16.2, 2.5, z0]); } m.ds = false;
  house(ctx, { x: 24.5, z: 20, w: 12, d: 9, rot: Math.PI, h: 12.2, floors: 4, wall: '#e6c9b4', roof: '#b9603e', shutters: '#5a8a9a', lit: 0.55, door: -1 });
  ctx.spots.push({ art: 'yellow', x: 22, z: 2, r: 8, view: { p: [8.5, 1.7, -4.5], t: [23, 4.4, 9], tod: 0 } });
  easel(ctx, 30.6, 3.0, 0.5, ART.yellow.c);
  // van gogh's chair, with pipe and tobacco
  chair(ctx, 16.9, 2.0, 0, -1.9, { col: '#e3b93c', seat: '#d9c06a', noSeat: true }); m.c('#5a3a22'); m.cyl(16.9, 0.5, 2.0, 0.03, 0.035, 0.04, 6, 1); m.c('#e9e2cf'); m.box(17.02, 0.49, 2.08, 0.1, 0.02, 0.08, 63);
  ctx.spots.push({ art: 'chair', x: 16.9, z: 2.0, r: 2.6 });
  ctx.npcs.push({ cast: 'vincent', who: 'vincent', x: 30.2, z: 4.3, rot: 2.9, pose: 'paint' });
  // plaza south, south street, quay
  house(ctx, { x: -11, z: 17.4, w: 13.4, d: 8.4, rot: Math.PI, h: 9, wall: '#c9d2e2', roof: '#b9603e', shutters: SH[1], door: 2, lit: 0.7 });
  house(ctx, { x: 10.9, z: 17.4, w: 13.2, d: 8.4, rot: Math.PI, h: 8, wall: '#e9c9a0', roof: '#c96a3e', shutters: SH[0], door: 1, shop: true, lit: 0.7 });
  house(ctx, { x: -8.4, z: 28.7, w: 13, d: 8.4, rot: W, h: 8.4, wall: '#d8b6c2', roof: '#a8553a', shutters: SH[3], lit: 0.6 });
  house(ctx, { x: 8.4, z: 28.7, w: 13, d: 8.4, rot: -W, h: 9.2, wall: '#aebcd8', roof: '#c9603a', shutters: SH[4], lit: 0.6 });
  [[-21, 13, 7.6, '#e6d3a0'], [-35.5, 13, 9.2, '#b6c6b0'], [21.5, 13, 8.6, '#d9b8a8'], [36, 13, 7.4, '#c2cbe6'], [50, 12, 9, '#e9d2a8']].forEach((b, i) =>
    house(ctx, { x: b[0], z: 30.6, w: b[1], d: 8.6, rot: 0, h: b[2], wall: b[3], roof: i % 2 ? '#b9603e' : '#c96a3e', shutters: SH[i], lit: 0.8, door: i % 3 }));
  house(ctx, { x: -35, z: -8.6, w: 12, d: 9.4, rot: 0, h: 8.2, wall: '#d6c2d8', roof: '#b9603e', shutters: SH[2], lit: 0.6 });
  house(ctx, { x: -35, z: 8.6, w: 12, d: 9.4, rot: Math.PI, h: 7.6, wall: '#e6cf9a', roof: '#c96a3e', shutters: SH[5], lit: 0.6 });
  house(ctx, { x: 36.5, z: -8.7, w: 13, d: 9.6, rot: 0, h: 8.8, wall: '#b9c8d8', roof: '#a8553a', shutters: SH[0], lit: 0.6 });
  house(ctx, { x: 40, z: 9, w: 9, d: 9, rot: Math.PI, h: 7.2, wall: '#e2b9a6', roof: '#c9603a', shutters: SH[3], lit: 0.6 });
  m.c('#c9bfb0'); m.box(15.2, 0, -14.6, 3.9, 2.3, 0.5, 61); addBox(ctx, 15.2, -14.6, 3.9, 0.5, 0, 2.3);
  // fountain
  m.c('#c9c2c8'); m.lathe(0, 0, -0.5, [[2.5, 0], [2.6, 0.5], [2.35, 0.62], [2.2, 0.5], [2.15, 0.2]], 12); m.c('#5f9fd0', 0.12); m.disc(0, 0.42, -0.5, 2.2, 12);
  m.c('#b9b2c0'); m.lathe(0, 0, -0.5, [[0.42, 0.2], [0.28, 0.9], [0.22, 1.5], [0.8, 1.75], [0.86, 1.86], [0.2, 1.8], [0.14, 2.3], [0.0, 2.45]], 10);
  m.c('#8fc6e6', 0.15); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.tube([[Math.cos(a) * 0.2, 2.3, -0.5 + Math.sin(a) * 0.2], [Math.cos(a) * 0.7, 2.2, -0.5 + Math.sin(a) * 0.7], [Math.cos(a) * 1.05, 1.5, -0.5 + Math.sin(a) * 1.05], [Math.cos(a) * 1.2, 0.5, -0.5 + Math.sin(a) * 1.2]], [0.03, 0.03, 0.025, 0.02], 4); }
  addCircle(ctx, 0, -0.5, 2.7);
  // lamps
  [[-11.5, -8.5], [11.5, 8.5], [-11.5, 8.5], [12.5, -8], [4.4, -34], [-3.1, -45.5], [4.4, -57], [-30, 3.2], [-42, -3.2], [31, 3.2], [43, -3.2], [3.5, 24.5], [-8, -66], [9, -66]].forEach(p => lampPost(ctx, p[0], p[1]));
  for (let x = -40; x <= 60; x += 12.5) { lampPost(ctx, x, 40.2, { r: 12 }); ctx.lamps[ctx.lamps.length - 1].refl = [x, 43, 26, 0.5]; }
  // trees and benches in town
  [[-13.5, 10.2], [13.6, 10.4], [6.6, -11.6], [-14, -10.6]].forEach(p => tree(ctx, p[0], p[1], Object.assign({}, TREES.plane, { h: 8 + rng() * 1.5 })));
  for (let x = -34; x <= 54; x += 14.6) if (Math.abs(x - 1) > 6) tree(ctx, x + 6, 37.3, Object.assign({}, TREES.plane, { h: 7 + rng() * 1.5 }));
  bench(ctx, -10.6, 11.6, Math.PI, { tag: 'bench' }); bench(ctx, 10.5, 11.6, Math.PI, { tag: 'bench' }); bench(ctx, -18, 37.0, 0, { tag: 'quay' }); bench(ctx, 18, 37.0, 0, { tag: 'quay' }); bench(ctx, 44, 37.0, 0, { tag: 'quay' });
  ctx.spots.push({ art: 'rhone', x: 12, z: 39, r: 10, view: { p: [-13, 1.6, 39.2], t: [22, 6, 82], tod: 2 } });
  easel(ctx, 6.5, 39.6, Math.PI + 0.3, ART.rhone.c);
  // boats, pier, far bank
  boat(ctx, -14, 44.2, 1.45, '#3f6fb0', { col2: '#e9dfc0' }); boat(ctx, -9.6, 44.6, 1.7, '#c8463a', { col2: '#f1e4b8' }); boat(ctx, 24, 44.4, 1.5, '#3f8a6a', { col2: '#e9c95a' }); boat(ctx, 29, 45, 1.75, '#e3b93c', { col2: '#3f6fb0', mast: 4.2 });
  m.c('#a8824e'); m.box(0, 0.08, 46.2, 4, 0.17, 10.4, 63); m.c('#6a4e30'); for (const pz of [42.5, 46, 49.5, 51]) for (const px of [-1.8, 1.8]) m.cyl(px, -1.7, pz, 0.13, 0.13, 2.2, 6, 1);
  ctx.decks.push([-2, 2, 40.8, 51.4, 0.25]);
  lampPost(ctx, -1.7, 50.6, { h: 2.6, r: 9 }); ctx.lamps[ctx.lamps.length - 1].refl = [-1.7, 51.5, 14, 0.4];
  for (let i = 0; i < 9; i++) {
    const x = -120 + i * 30 + rng.s() * 8, hh = 5 + rng() * 5; m.c(jit(hex('#5a6aa0'), rng, 0.02, 0.05), 0); m.box(x, 0, 136 + rng() * 6, 10 + rng() * 8, hh, 8, 61);
    m.c('#f6c648', 1); for (let k = 0; k < 3; k++) m.box(x - 3 + k * 3, hh * 0.45, 131.9 + rng() * 0.1, 0.9, 1.2, 0.2, 63);
    const lx = x + 6; ctx.lamps.push({ x: lx, y: 3, z: 131, r: 10, col: [1, 0.78, 0.34], k: 1, refl: [lx, 129.5, 62, 1.3] }); ctx.glows.push({ x: lx, y: 3, z: 131, s: 3.2, col: [1, 0.8, 0.4] });
  }
  ctx.npcs.push({ cast: 'loverM', who: 'lovers', x: 20, z: 38.6, rot: W, pose: 'idle', mode: 'path', path: [[-30, 38.7], [52, 38.7]], speed: 0.75 }, { cast: 'loverF', who: 'lovers', x: 20, z: 39.3, rot: W, pose: 'hold', mode: 'follow', of: -1, side: 0.62 });

  /* ---------- the church at Auvers ---------- */
  {
    const cy = H(2, -92), cw = '#8f9ac6', cw2 = '#7f8cc0', orange = '#d8743a', slate = '#6578b0';
    m.grad('#5f6aa8', cy - 0.5, 4);
    m.c(cw); m.cyl(2, cy - 0.5, -80.5, 4.6, 4.6, 7.6, 10, 0); m.grad(null); m.c(orange); m.cyl(2, cy + 7.1, -80.5, 5.0, 0.2, 3.4, 10, 0);
    m.grad('#5f6aa8', cy - 0.5, 4); m.c(cw2); m.box(2, cy - 0.5, -86, 9.4, 10, 8, 60); m.grad(null); m.c(slate); m.gable(2, cy + 9.5, -86, 10, 8.4, 3.6, false, hex(cw2));
    m.grad('#5f6aa8', cy - 0.5, 4); m.c(cw); m.box(2, cy - 0.5, -92.5, 21, 9, 7, 60); m.grad(null); m.c(orange); m.gable(2, cy + 8.5, -92.5, 21.8, 7.6, 3.4, true, hex(cw));
    m.grad('#5f6aa8', cy - 0.5, 6); m.c(cw2); m.box(2, cy - 0.5, -92.5, 6.4, 18.5, 6.4, 60); m.grad(null); m.c(slate); m.hip(2, cy + 18, -92.5, 7.4, 7.4, 5.4, 0);
    m.c('#e9c95a'); m.cyl(2, cy + 23.3, -92.5, 0.06, 0.03, 1.2, 4, 0); m.box(2, cy + 24.0, -92.5, 0.6, 0.08, 0.08, 63);
    m.grad('#5f6aa8', cy - 0.5, 4); m.c(cw); m.box(2, cy - 0.5, -104, 10.4, 9.4, 16, 60); m.grad(null); m.c(slate); m.gable(2, cy + 8.9, -104, 11.2, 16.6, 3.6, false, hex(cw));
    const gwin = (x, y, z, ry, w, h) => { m.push().T(x, y, z).RY(ry); m.c(INK, 0); m.box(0, 0, 0, w + 0.24, h + 0.2, 0.1, 31); m.c('#2f48b0', 0.35); m.box(0, 0.08, 0.04, w, h, 0.1, 16); m.tri([-w / 2, h + 0.08, 0.09], [w / 2, h + 0.08, 0.09], [0, h + 0.08 + w * 0.8, 0.09]); m.c(INK, 0); m.box(0, 0.08, 0.08, 0.07, h, 0.06, 16); m.pop(); };
    for (let i = -2; i <= 2; i++) { const a = i * 0.56; gwin(2 + Math.sin(a) * 4.62, cy + 2.2, -80.5 + Math.cos(a) * 4.62, a, 0.9, 3.0); }
    gwin(12.52, cy + 2.6, -92.5, W, 1.8, 3.6); gwin(-8.52, cy + 2.6, -92.5, -W, 1.8, 3.6);
    for (const s of [-1, 1]) { gwin(2 + s * 1.6, cy + 12.2, -89.28, 0, 0.8, 2.6); gwin(2 + s * 3.22, cy + 12.2, -92.5 + s * 1.2, s * W, 0.8, 2.6); gwin(2 + s * 3.22, cy + 12.2, -92.5 - s * 1.2, s * W, 0.8, 2.6); }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { gwin(2 + s * 5.22, cy + 2.4, -98 - i * 3.6, s * W, 0.9, 3.0); m.c(cw2); m.box(2 + s * 5.6, cy - 0.5, -99.8 - i * 3.6, 0.9, 6.4, 0.9, 61); }
    addBox(ctx, 2, -80.5, 8.8, 8.8, 0.4, 9); addBox(ctx, 2, -86, 9.4, 8, 0, 12); addBox(ctx, 2, -92.5, 21, 7, 0, 14); addBox(ctx, 2, -104, 11.6, 16, 0, 12);
    
    ctx.spots.push({ art: 'church', x: 1, z: -68, r: 9, view: { p: [1.2, 1.45, -55], t: [2, cy + 9.5, -90], tod: 0 } });
    easel(ctx, 6.8, -68.5, 2.9, ART.church.c);
    ctx.npcs.push({ cast: 'washer', who: 'peasant', x: -6.5, z: -79.5, rot: 2.6, pose: 'hold' }, { cast: 'gachet', who: 'gachet', x: -7.2, z: -63.2, rot: 0.9, pose: 'think' });
    bench(ctx, 8.5, -62.2, Math.PI, { tag: 'bench', col: '#5a7a9a' });
  }

  /* ---------- Langlois bridge and the canal ---------- */
  {
    const st = '#dcc890', wood = '#d9b648';
    for (const s of [-1, 1]) {
      const ax = -52 + s * 4.6; m.c(st); m.grad('#8f9ab0', -1.6, 2); m.box(ax, -1.8, 0, 2.6, 2.25, 5.6, 61); m.grad(null);
      m.c(mulc(hex(st), 0.9)); m.quad([ax + s * 1.3, 0.45, 2.3], [ax + s * 4.6, 0.04, 2.3], [ax + s * 4.6, 0.04, -2.3], [ax + s * 1.3, 0.45, -2.3]); if (s < 0) { /* flipped winding */ m.quad([ax + s * 1.3, 0.45, -2.3], [ax + s * 4.6, 0.04, -2.3], [ax + s * 4.6, 0.04, 2.3], [ax + s * 1.3, 0.45, 2.3]); }
      const fx = -52 + s * 3.4;
      m.c(wood); for (const z of [-2.35, 2.35]) m.box(fx, 0.45, z, 0.24, 5.4, 0.24, 61);
      m.box(fx, 5.6, 0, 0.26, 0.26, 5.1, 63);
      for (const z of [-2.2, 2.2]) {
        m.push().T(fx, 5.85, z).RZ(s * 0.3); m.c('#3f6fb0'); m.box(-s * 0.7, 0, 0, 7.2, 0.2, 0.2, 63); m.c(st); m.box(s * 2.4, -0.5, 0, 0.9, 0.7, 0.5, 63); m.pop();
        m.c('#3a3a4a'); m.box(-52 + s * 0.35, 0.5, z * 0.92, 0.04, 6.1, 0.04, 60);
      }
    }
    m.c('#b98a4a'); m.box(-52, 0.3, 0, 7.2, 0.16, 4.4, 63); m.c('#8a6234'); for (const z of [-2.15, 2.15]) { m.box(-52, 0.46, z, 7.2, 0.5, 0.08, 63); }
    ctx.decks.push([-57.2, -46.8, -2.25, 2.25, 0.45]);
    addBox(ctx, -52, -2.5, 9.6, 0.4, 0, 1.4, true); addBox(ctx, -52, 2.5, 9.6, 0.4, 0, 1.4, true);
    for (const z of [-28, -19, -10, 16, 25, 34]) pollard(ctx, -46.2 + rng.s() * 0.4, z + rng.s() * 1.5);
    for (const z of [-30, -22, -14, 10, 20, 30]) tree(ctx, -58.6 + rng.s() * 0.5, z + rng.s() * 1.5, Object.assign({}, TREES.autumn, { h: 8.5 + rng() * 2.5 }));
    m.c('#e9e4d6'); m.box(-47.2, -0.5, 10.6, 1.2, 0.08, 1.6, 63);
    ctx.npcs.push({ cast: 'washer', who: 'washer', x: -47.4, z: 9.3, rot: -W, pose: 'wash', y: -0.42 }, { cast: 'washer', who: 'washer', x: -47.3, z: 12.0, rot: -1.9, pose: 'wash', y: -0.42 },
      { cast: 'zouave', who: 'zouave', x: -44.6, z: -2.6, rot: 0.8, pose: 'guard' });
    lampPost(ctx, -45.6, 2.9, { h: 2.8 }); ctx.lamps[ctx.lamps.length - 1].refl = [-48, 2.9, 8, 0.4];
    ctx.spots.push({ art: 'bridge', x: -47, z: 0, r: 8, view: { p: [-42.6, 1.5, 7.2], t: [-53, 3.0, -0.5], tod: 0 } });
    easel(ctx, -44.6, 4.4, 2.2, ART.bridge.c);
  }

  /* ---------- wheat fields, cypresses, the sower ---------- */
  const free = (x, z, pad) => !ctx.paths.on(x, z, pad || 0) && !wet(x, z);
  gridScatter(ctx, -118, -60, -29, 39, 1.22, 0.5, (x, z) => free(x, z, 0.1) && reg.wheat(x, z, 0) > 0.3, (x, z) => wheat(ctx, x, z, { n: 6 }));
  [[-70.5, -19.5, 13.5], [-73.6, -16.6, 9], [-96, 14, 11], [-99, 12, 7.5], [-112, -8, 10]].forEach(c => cypress(ctx, c[0], c[1], c[2]));
  haystack(ctx, -84, 15, 1); haystack(ctx, -90, 19, 0.8); haystack(ctx, -108, 24, 1.1);
  ctx.spots.push({ art: 'crows', x: -66, z: 1.5, r: 9, view: { p: [-61.5, H(-61.5, 2.5) + 1.45, 2.5], t: [-96, H(-96, 5) + 5, 5], tod: 0 } });
  easel(ctx, -63.5, -3.4, 1.2, ART.crows.c);
  ctx.spots.push({ art: 'cypress', x: -70, z: -12, r: 8, view: { p: [-63, H(-63, -9) + 1.3, -9], t: [-72, H(-72, -18) + 7, -18.5], tod: 0 } });
  ctx.spots.push({ art: 'hay', x: -86, z: 22, r: 8 });
  ctx.birds.push({ x: -88, z: 4, y: 9, r: 24, n: 16 });
  ctx.npcs.push({ cast: 'sower', who: 'sower', x: -84, z: -44, rot: 0, pose: 'sow', mode: 'path', path: [[-72, -40], [-104, -50], [-102, -42], [-74, -36]], speed: 1.0 });
  ctx.spots.push({ art: 'sower', x: -84, z: -42, r: 11, view: { p: [-74, H(-74, -41) + 1.1, -41], t: [-100, H(-100, -52) + 3.2, -53], tod: 1 } });
  easel(ctx, -79.6, -37.2, 2.4, ART.sower.c);
  tree(ctx, -68, -45, Object.assign({}, TREES.apple, { h: 6, leanX: 0.5, leaves: ['#3a4a3a', '#4a5a3a', '#2f3f3a'] }));

  /* ---------- the hill of the starry night ---------- */
  cypress(ctx, -47.5, -66.5, 16.5); cypress(ctx, -45.6, -68.2, 10.5); cypress(ctx, -60, -84, 9);
  for (let i = 0; i < 17; i++) { const a = rng() * TAU, r = 13 + rng() * 15, x = -54 + Math.cos(a) * r, z = -74 + Math.sin(a) * r * 0.9; if (free(x, z, 1.5) && Math.hypot(x + 47, z + 67) > 6) tree(ctx, x, z, Object.assign({}, TREES.olive, { h: 4 + rng() * 1.4 })); }
  ctx.spots.push({ art: 'starry', x: -51, z: -70, r: 8, view: { p: [-55.5, H(-55.5, -75) + 2.1, -75], t: [-20, 17, -52], tod: 2 } });
  easel(ctx, -52.2, -67.2, 2.2, ART.starry.c);
  bench(ctx, -55.5, -71.2, 2.1, { tag: 'hill', col: '#5a6a8a' });
  ctx.spots.push({ art: 'olive', x: -40, z: -56, r: 8 });

  /* ---------- the eastern gardens ---------- */
  gridScatter(ctx, 47, 74, 7.5, 31, 1.38, 0.3, (x, z) => free(x, z, 0.3), (x, z) => sunflower(ctx, x, z));
  fence(ctx, 45.6, 5.2, 75, 5.6); fence(ctx, 45.6, 5.2, 45.4, 33);
  ctx.spots.push({ art: 'sunflowers', x: 58, z: 9, r: 8, view: { p: [57, 1.25, 4.6], t: [59, 1.5, 12], tod: 0 }, silent: 1 });
  let firstIris = true;
  gridScatter(ctx, 47, 72, -6.2, -1.9, 0.52, 0.2, (x, z) => free(x, z, 0.1), (x, z) => { iris(ctx, x, z, { white: firstIris && x > 58 && z < -3.5 }); if (x > 58 && z < -3.5) firstIris = false; });
  ctx.spots.push({ art: 'irises', x: 59, z: -3, r: 7, view: { p: [59, 0.75, -0.3], t: [59.3, 0.55, -5.2], tod: 0 } });
  easel(ctx, 54, -0.9, 3.0, ART.irises.c);
  gridScatter(ctx, 51, 79, -48, -24, 6.6, 1.4, (x, z) => free(x, z, 1.2), (x, z, i) => tree(ctx, x, z, Object.assign({}, i % 5 === 3 ? TREES.peach : TREES.almond, { h: 4.4 + rng() * 1.2 })));
  ctx.petals.push({ x: 65, z: -36, r: 20, col: [1.0, 0.93, 0.93] });
  ctx.spots.push({ art: 'almond', x: 64, z: -36.5, r: 9, view: { p: [63.2, H(63.2, -37.6) + 0.9, -37.6], t: [65.2, H(65, -35) + 6.2, -34.2], tod: 0 } });
  easel(ctx, 61, -39.4, 0.6, ART.almond.c);
  gridScatter(ctx, 85, 115, -51, -27, 0.86, 0.4, (x, z) => free(x, z, 0.2) && vnoise(x * 0.22, z * 0.22) > 0.36, (x, z) => poppy(ctx, x, z));
  ctx.spots.push({ art: 'poppy', x: 92, z: -38, r: 9 });
  for (let r = 0; r < 6; r++) for (let i = 0; i < 9; i++) { const x = 44.5 + i * 2.5 + rng.s() * 0.4, z = -72.5 + r * 2.9 + rng.s() * 0.3; if (free(x, z, 0.8)) bush(ctx, x, z, 0.75, ['#c8382b', '#e2752c', '#e9b83a', '#a82f3a', '#7a3a6a'], { n: 3 }); }
  ctx.spots.push({ art: 'vineyard', x: 56, z: -62, r: 9 });
  // windmill
  {
    const wx = 74, wz = -86, wy = H(wx, wz);
    m.c('#b9b0a8'); m.cyl(wx, wy - 0.5, wz, 3.4, 3.2, 2.6, 10, 0); m.c('#6f5f58'); m.grad('#4a4250', wy + 2, 5); m.cyl(wx, wy + 2.1, wz, 3.0, 2.3, 7.6, 10, 0); m.grad(null);
    m.c('#4a4a5a'); m.cyl(wx, wy + 9.7, wz, 2.7, 0.3, 2.6, 10, 0);
    m.push().T(wx - 1.6, wy + 9.4, wz + 1.9).RY(-0.7).RX(-0.12);
    m.c('#3a3238'); m.cyl(0, 0, 0, 0.16, 0.16, 0.9, 6, 1);
    for (let i = 0; i < 4; i++) { m.push().T(0, 0, 0.75).RZ(i * W + 0.35); m.c('#5a4a42'); m.box(0, 0, 0, 0.14, 7.2, 0.1, 63); m.c('#e9dfc0'); m.box(0.55, 1.2, 0, 0.9, 5.8, 0.04, 63); m.c('#5a4a42'); for (let k = 0; k < 6; k++) m.box(0.55, 1.4 + k * 1.05, 0.03, 1.0, 0.06, 0.04, 63); m.pop(); }
    m.pop();
    m.c('#c9452f'); m.box(wx, wy + 12.2, wz, 0.9, 0.5, 0.04, 63); m.c('#3a3238'); m.cyl(wx - 0.45, wy + 11.6, wz, 0.03, 0.03, 1.2, 4, 0);
    addCircle(ctx, wx, wz, 3.6); ctx.occS.push({ x: wx, y: wy + 5, z: wz, r: 4 }); lampPost(ctx, wx - 5, wz + 4.5, { h: 2.6 });
    fence(ctx, wx - 9, wz + 7, wx + 6, wz + 9); ctx.spots.push({ art: 'moulin', x: wx - 2, z: wz + 7, r: 9 });
  }
  /* ---------- tea garden ---------- */
  {
    const tx = 89, tz = -18.5, red = '#b8392c';
    m.c('#8a6a4a'); m.box(tx, 0, tz, 9.6, 0.5, 7.2, 61); m.c('#d9c69a'); m.box(tx, 0.5, tz, 9.2, 0.06, 6.8, 61);
    m.c('#a89a8a'); m.box(tx, 0, tz + 4.1, 3, 0.25, 1.0, 61);
    ctx.decks.push([tx - 4.8, tx + 4.8, tz - 3.6, tz + 4.6, 0.56]);
    for (const px of [-4.4, 0, 4.4]) for (const pz of [-3.2, 3.2]) { if (px === 0 && pz > 0) continue; m.c(red); m.cyl(tx + px, 0.5, tz + pz, 0.17, 0.15, 3.3, 8, 0); addCircle(ctx, tx + px, tz + pz, 0.25); }
    m.c('#f3ecd6', 0.55); m.box(tx, 0.56, tz - 3.2, 8.6, 3.1, 0.08, 63); m.box(tx - 4.4, 0.56, tz - 0.8, 0.08, 3.1, 4.4, 63); m.box(tx + 4.4, 0.56, tz - 0.8, 0.08, 3.1, 4.4, 63);
    m.c('#5a3a2a', 0); for (let i = -3; i <= 3; i++) m.box(tx + i * 1.2, 0.56, tz - 3.14, 0.05, 3.1, 0.06, 63); for (const yy of [1.4, 2.4]) m.box(tx, yy, tz - 3.14, 8.6, 0.05, 0.06, 63);
    addBox(ctx, tx, tz - 3.2, 9, 0.4, 0, 4); addBox(ctx, tx - 4.4, tz - 0.8, 0.4, 4.6, 0, 4, true); addBox(ctx, tx + 4.4, tz - 0.8, 0.4, 4.6, 0, 4, true);
    const roof = (y, sx, sz, hh, c1) => { m.c(c1); const n = 12, ov = 1.0; for (let i = 0; i < 4; i++) { m.push().T(tx, y, tz).RY(i * W); const a = i % 2 ? sz : sx, b = i % 2 ? sx : sz; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, f = t => [lerp(b / 2 + ov, 0.25, t), hh * (1 - Math.pow(1 - t, 1.9)), 0]; const p0 = f(t0), p1 = f(t1), w0 = lerp(a / 2 + ov, 0.25, t0), w1 = lerp(a / 2 + ov, 0.25, t1); m.quad([-w0, p0[1], p0[0]], [w0, p0[1], p0[0]], [w1, p1[1], p1[0]], [-w1, p1[1], p1[0]]); } m.pop(); } };
    roof(3.75, 9.6, 7.2, 2.3, '#3a4a6e'); m.c('#2a3350'); m.box(tx, 3.62, tz, 11.4, 0.16, 9, 63); m.c('#b8392c'); m.box(tx, 5.9, tz, 2.4, 0.3, 0.3, 63);
    ctx.occB.push({ x: tx, z: tz, hw: 5.6, hd: 4.4, c: 1, s: 0, h: 5 });
    for (const px of [-4.6, 4.6]) { m.c('#d8452f', 1); m.ell(tx + px, 3.1, tz + 4.0, 0.26, 0.34, 0.26, 8, 6); m.c('#22202a', 0); m.cyl(tx + px, 3.42, tz + 4.0, 0.1, 0.1, 0.08, 6, 1); ctx.lamps.push({ x: tx + px, y: 3, z: tz + 4.2, r: 10, col: [1.0, 0.55, 0.3], k: 1 }); ctx.glows.push({ x: tx + px, y: 3.1, z: tz + 4.0, s: 1.3, col: [1.0, 0.5, 0.3] }); }
    m.c('#27406e'); m.ds = true; for (let i = 0; i < 3; i++) m.quad([tx - 1.3 + i * 0.9, 2.5, tz + 3.4], [tx - 0.5 + i * 0.9, 2.5, tz + 3.4], [tx - 0.5 + i * 0.9, 3.6, tz + 3.4], [tx - 1.3 + i * 0.9, 3.6, tz + 3.4]); m.ds = false;
    // low table, cushions, tea
    m.c('#5a3226'); m.box(tx, 0.56, tz - 0.6, 1.5, 0.32, 0.9, 63); m.c('#3f6a5a'); m.lathe(tx - 0.3, 0.88, tz - 0.6, [[0.08, 0], [0.13, 0.06], [0.11, 0.14], [0.05, 0.17]], 8); m.c('#e9e2cf'); for (const cx of [0.15, 0.4]) m.cyl(tx + cx, 0.88, tz - 0.5 - cx * 0.3, 0.04, 0.05, 0.06, 6, 1);
    for (const s of [[0, 0.55, Math.PI], [0, -1.75, 0], [-1.3, -0.6, W]]) { m.c(jit(hex('#c9452f'), rng, 0.02, 0.04)); m.box(tx + s[0], 0.56, tz + s[1], 0.62, 0.1, 0.62, 63); ctx.seats.push({ x: tx + s[0], z: tz + s[1], y: 0.56 + 0.1 - 0.49 + 0.2, rot: s[2], tag: 'tea', low: 1 }); }
    addCircle(ctx, tx, tz - 0.6, 0.85);
    // pond, bridge, stone lantern, plum trees
    m.push().T(84, 0, -2).RY(0.25);
    const arc = t => [lerp(-8.2, 8.2, t), 0.05 + Math.sin(t * Math.PI) * 1.5];
    for (let k = 0; k < 14; k++) { const a = arc(k / 14), b = arc((k + 1) / 14); m.c(k % 2 ? '#c9a45a' : '#b8924c'); m.quad([a[0], a[1], 1.1], [b[0], b[1], 1.1], [b[0], b[1], -1.1], [a[0], a[1], -1.1]); m.c('#8a6234'); m.quad([b[0], b[1], 1.1], [a[0], a[1], 1.1], [a[0], a[1] - 0.2, 1.1], [b[0], b[1] - 0.2, 1.1]); m.quad([a[0], a[1], -1.1], [b[0], b[1], -1.1], [b[0], b[1] - 0.2, -1.1], [a[0], a[1] - 0.2, -1.1]);
      if (k % 2 === 0) for (const s of [-1, 1]) { m.c(red); m.box(a[0], a[1], s * 1.05, 0.12, 0.95, 0.12, 61); } }
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) { const a = arc(k / 14), b = arc((k + 1) / 14); m.c(red); m.quad([a[0], a[1] + 0.8, s * 1.1], [b[0], b[1] + 0.8, s * 1.1], [b[0], b[1] + 0.92, s * 1.1], [a[0], a[1] + 0.92, s * 1.1]); m.quad([b[0], b[1] + 0.8, s * 1.1], [a[0], a[1] + 0.8, s * 1.1], [a[0], a[1] + 0.92, s * 1.1], [b[0], b[1] + 0.92, s * 1.1]); m.quad([a[0], a[1] + 0.92, 1.1 * s - 0.06], [b[0], b[1] + 0.92, 1.1 * s - 0.06], [b[0], b[1] + 0.92, 1.1 * s + 0.06], [a[0], a[1] + 0.92, 1.1 * s + 0.06]); }
    m.pop();
    ctx.arches = [{ x: 84, z: -2, rot: 0.25, len: 8.2, w: 1.0, h: 1.5 }];
    for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = 1.5 + rng() * 5.2, x = 84 + Math.cos(a) * r, z = -2 + Math.sin(a) * r; const c = Math.cos(0.25), s = Math.sin(0.25), lx = (x - 84) * c - (z + 2) * s, lz = (x - 84) * s + (z + 2) * c; if (Math.abs(lz) < 1.6) continue; m.c(jit(hex('#4f8a5a'), rng, 0.02, 0.05)); m.disc(x, -0.37, z, 0.3 + rng() * 0.25, 7); if (i % 3 === 0) { m.c(i % 2 ? '#f6dfe6' : '#f3a9c0', 0.1); m.ell(x, -0.3, z, 0.13, 0.09, 0.13, 6, 3); } }
    m.c('#a8a29a'); m.cyl(78.6, 0, -7.6, 0.3, 0.22, 0.5, 6, 0); m.cyl(78.6, 0.5, -7.6, 0.13, 0.13, 0.6, 6, 0); m.c('#ffe08a', 1); m.box(78.6, 1.1, -7.6, 0.36, 0.36, 0.36, 61); m.c('#8f8a84', 0); m.cyl(78.6, 1.46, -7.6, 0.42, 0.05, 0.3, 6, 0);
    ctx.lamps.push({ x: 78.6, y: 1.3, z: -7.6, r: 9, col: [1, 0.8, 0.4], k: 0.9, refl: [79.5, -6, 9, 0.4] }); ctx.glows.push({ x: 78.6, y: 1.3, z: -7.6, s: 1.0, col: [1, 0.85, 0.45] }); addCircle(ctx, 78.6, -7.6, 0.4);
    [[80.5, -15.5], [96.5, -22], [97, -9], [77, 4.5], [92, 5.5], [84.5, -24]].forEach(p => tree(ctx, p[0], p[1], Object.assign({}, TREES.plum, { h: 4 + rng() })));
    ctx.petals.push({ x: 87, z: -10, r: 15, col: [1.0, 0.72, 0.78] });
    ctx.npcs.push({ cast: 'oiran', who: 'oiran', x: tx + 2.6, z: tz + 1.6, rot: -0.5, pose: 'fold', y: 0.56 });
    ctx.spots.push({ art: 'japan', x: 86, z: -12, r: 10, view: { p: [78, 1.4, 4.8], t: [88, 2.6, -17], tod: 1 } });
    easel(ctx, 79.8, -11.2, 1.3, ART.japan.c);
    for (let i = 0; i < 40; i++) { const a = rng() * TAU, x = 84 + Math.cos(a) * (8.6 + rng() * 1.2), z = -2 + Math.sin(a) * (8.6 + rng() * 1.2); if (!ctx.paths.on(x, z, 0.5) && Math.abs(Math.sin(a - 0.25 + W)) < 0.93) reed(ctx, x, z); }
  }

  /* ---------- trees and small plants everywhere else ---------- */
  const open = (x, z, pad) => free(x, z, pad) && !paved(x, z, 1) && !inBox(x, z, 1.5) && Math.hypot(x, z) < 172 && z < 122;
  scatter(ctx, 26, -150, 150, -150, 118, (x, z) => open(x, z, 3) && Math.hypot(x, z) > 96 && reg.wheat(x, z, 0) < 0.1, (x, z) => cypress(ctx, x, z, 7 + rng() * 6));
  scatter(ctx, 54, -150, 150, -150, 40, (x, z) => open(x, z, 3) && (Math.hypot(x, z) > 62 || (z < -60 && Math.abs(x) > 22)) && reg.wheat(x, z, 0) < 0.1 && reg.sower(x, z, 0) < 0.1 && reg.poppy(x, z, 0) < 0.1 && reg.sun(x, z, 0) < 0.1 && reg.orchard(x, z, 0) < 0.1 && reg.vine(x, z, 0) < 0.1 && bump(x, z, 86, -6, 20) < 0.01 && Math.hypot(x - 74, z + 86) > 9,
    (x, z, i) => tree(ctx, x, z, Object.assign({}, [TREES.apple, TREES.olive, TREES.plane, TREES.autumn][i % 4], { noCollide: Math.hypot(x, z) > 125, lo: Math.hypot(x, z) > 90 })));
  [[-30, -14.5], [-41, -15], [30, -15.5], [44, -15], [46, 13], [-30, 15], [-43, 14], [15, -18.5], [-20, -18], [-21, -30], [-16, -44]].forEach((p, i) => { if (!inBox(p[0], p[1], 1.2)) tree(ctx, p[0], p[1], Object.assign({}, [TREES.peach, TREES.apple, TREES.almond][i % 3], { h: 4.6 + rng() })); });
  for (let i = 0; i < 70; i++) { const x = rng.r(-150, 150), z = 41.5 + rng() * 2.2; if (!(x > -47 && x < 65) && Math.abs(x + 52) > 6) reed(ctx, x, z); }
  for (let i = 0; i < 46; i++) { const z = rng.r(-36, 40), s = rng() < 0.5 ? -1 : 1; if (Math.abs(z) > 5) reed(ctx, -52 + s * (4.3 + rng() * 0.6), z); }
  const meadow = ['#f6e27a', '#fbf4ea', '#6f8fd8', '#f0a8b8', '#f2c230', '#e9eef8'];
  scatter(ctx, 5200, -128, 128, -128, 41, (x, z) => open(x, z, 0.3) && reg.wheat(x, z, 0) < 0.2 && reg.sower(x, z, 0) < 0.2 && reg.sun(x, z, 0) < 0.5 && !(x > 46.5 && x < 72.5 && z > -6.6 && z < -1.5), (x, z) => grass(ctx, x, z));
  scatter(ctx, 2600, -124, 124, -124, 40, (x, z) => open(x, z, 0.3) && reg.wheat(x, z, 0) < 0.2 && reg.sower(x, z, 0) < 0.2 && reg.sun(x, z, 0) < 0.5 && vnoise(x * 0.09 + 5, z * 0.09) > 0.42, (x, z, i) => bloom(ctx, x, z, meadow[i % meadow.length]));
  scatter(ctx, 320, -16, 22, -84, -62, (x, z) => open(x, z, 0.4), (x, z, i) => bloom(ctx, x, z, ['#f6e27a', '#fbf4ea', '#f0a8b8', '#e86a3a'][i % 4], { h: 0.25 + rng() * 0.2, r: 0.065 }));
  scatter(ctx, 220, -118, -60, -29, 39, (x, z) => free(x, z, 0.1) && reg.wheat(x, z, 0) > 0.3, (x, z, i) => poppy(ctx, x, z, { col: i % 4 === 0 ? '#3f6fd0' : '#d93a2b' }));

  /* viaduct and the little train of the Yellow House */
  {
    const vx = 132; m.c('#b9a8a0');
    for (let z = -70; z <= 20; z += 9) { m.box(vx, -2, z, 3, 9.5, 2.2, 61); }
    m.c('#a89890'); m.box(vx, 7.2, -25, 3.4, 1.2, 96, 63);
    m.c('#22222c'); m.box(vx, 8.4, -30, 2.2, 2.2, 6, 63); m.cyl(vx, 10.6, -28, 0.4, 0.5, 1.2, 6, 1); m.c('#7a3a2a'); for (let k = 1; k <= 3; k++) m.box(vx, 8.4, -30 - k * 7, 2.2, 2.0, 6, 63);
    m.c('#f1f1ea', 0.1); for (let k = 0; k < 5; k++) m.ell(vx + rng.s(), 12.5 + k * 1.1, -27 - k * 3.2, 1.2 + k * 0.35, 1.0 + k * 0.2, 1.4 + k * 0.4, 7, 5);
  }
  hills(ctx, 186, 250, 34, ['#3f5fa6', '#6f8fd0'], 3.3);
  hills(ctx, 262, 340, 62, ['#5f7fc6', '#93a9de'], 9.1);

  /* frames to other paintings */
  frameGate(ctx, 0, 50.2, Math.PI, 'hokusai', { y: 0.25 });
  frameGate(ctx, 62, 38.5, -W, 'seurat');
  frameGate(ctx, -44, 38.5, W, 'munch');
  frameGate(ctx, 75.2, 2.5, -W + 0.5, 'monet');
  frameGate(ctx, 98.5, -15, -W, 'jiangshan');

  return finishWorld(R, ctx, { id: 'town', env: TOWN_ENV, defTod: 2, shadowSun: nrm3(TOWN_ENV[0].sunDir), bound: { r: 124 }, spawn: { x: 0.6, z: 8.5, rot: Math.PI, cam: 0 }, cell: 28 });
};
CAST.oiran = { skin: '#f6e2d0', hair: '#1c1a20', hairStyle: 'bun', top: '#c9452f', style: 'robe', sleeve: '#c9452f', legs: '#e9e2cc', shoes: '#22202a', collar: '#e9d98a', scarf: '#3f8a5a', face: { eye: '#1c1a20', blush: 0.5, mouth: '#c9302f' }, props: [{ type: 'fan', col: '#e9d98a' }] };
