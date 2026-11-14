'use strict';
/* Shared building blocks for every world: houses, trees, flowers, lamps, frames. */
function mkCtx(seed, H) {
  return { m: new Mesh(90000), d: new Mesh(90000), w: new Mesh(4096), rng: RNG(seed), H: H || (() => 0),
    boxes: [], circles: [], lamps: [], glows: [], occB: [], occS: [], spots: [], npcs: [], portals: [], seats: [], birds: [], petals: [], pq: [], picq: [], pics: [] };
}
function addBox(ctx, x, z, w, d, rot, h, noShadow) {
  const b = { x, z, hw: w / 2, hd: d / 2, c: Math.cos(rot || 0), s: Math.sin(rot || 0), h: h || 6 };
  ctx.boxes.push(b); if (!noShadow) ctx.occB.push(b); return b;
}
const addCircle = (ctx, x, z, r) => ctx.circles.push({ x, z, r });
const INK = '#1d2a55';

/* ---------- buildings ---------- */
function house(ctx, o) {
  const m = ctx.m, rng = ctx.rng, w = o.w, d = o.d, h = o.h, y0 = o.y === undefined ? ctx.H(o.x, o.z) : o.y;
  const wall = hex(o.wall), roofC = hex(o.roof || '#c9603a'), trim = hex(o.trim || INK), floors = o.floors || Math.max(1, Math.round(h / 3.1));
  const lit = o.lit === undefined ? 0.6 : o.lit, shut = o.shutters ? hex(o.shutters) : null;
  m.push().T(o.x, y0, o.z).RY(o.rot || 0);
  m.grad(mixc(wall, hex('#3a4078'), 0.42), y0 - 0.2, 2.6).c(wall, 0);
  m.box(0, -0.4, 0, w, h + 0.4, d, 60);
  m.grad(null);
  if (o.base) { m.c(o.base); m.box(0, 0, 0, w + 0.12, 0.55, d + 0.12, 61); }
  // ink contours on the corners
  m.c(trim);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(sx * w / 2, 0, sz * d / 2, 0.11, h, 0.11, 60);
  // roof
  const rh = o.roofH === undefined ? Math.min(w, d) * 0.36 : o.roofH, ov = o.over === undefined ? 0.4 : o.over, rt = o.roofType || 'gable';
  const alongX = o.ridgeX === undefined ? w >= d : o.ridgeX;
  m.c(mulc(wall, 0.8)); m.box(0, h - 0.05, 0, w + ov * 1.2, 0.16, d + ov * 1.2, 63);
  m.c(jit(roofC, rng, 0.015, 0.04));
  if (rt === 'gable') m.gable(0, h + 0.1, 0, w + ov * 2, d + ov * 2, rh, alongX, mulc(wall, 0.92));
  else if (rt === 'hip') m.hip(0, h + 0.1, 0, w + ov * 2, d + ov * 2, rh, Math.abs(w - d) * 0.6);
  else { m.box(0, h + 0.1, 0, w + 0.2, 0.3, d + 0.2, 61); }
  if (rt === 'gable') { m.c(mulc(roofC, 0.62)); if (alongX) m.box(0, h + rh + 0.03, 0, w + ov * 2, 0.1, 0.16, 61); else m.box(0, h + rh + 0.03, 0, 0.16, 0.1, d + ov * 2, 61); }
  if (o.chimney !== 0) { const cx = (rng() - 0.5) * w * 0.5, cz = (rng() - 0.5) * d * 0.3; m.c(mulc(wall, 0.85)); m.box(cx, h + rh * 0.3, cz, 0.6, rh * 0.75 + 0.7, 0.6, 61); m.c(mulc(roofC, 0.7)); m.box(cx, h + rh * 1.05 + 0.7, cz, 0.78, 0.14, 0.78, 63); m.c('#c9703a'); for (const s of [-0.15, 0.15]) m.cyl(cx + s, h + rh * 1.05 + 0.84, cz, 0.09, 0.07, 0.3, 6, 1); }
  if (rt === 'gable' && !o.plain) { // rows of tiles, dormers
    const rc2 = mulc(roofC, 0.74), E = (alongX ? d : w) / 2 + ov, L = (alongX ? w : d) / 2 + ov;
    for (const s of [-1, 1]) for (const t of [0.22, 0.47, 0.72]) {
      const a = E * (1 - t), b = E * (1 - t - 0.035), ya = h + 0.14 + rh * t, yb = h + 0.14 + rh * (t + 0.035); m.c(rc2);
      if (alongX) { if (s > 0) m.quad([-L, ya, a], [L, ya, a], [L, yb, b], [-L, yb, b]); else m.quad([L, ya, -a], [-L, ya, -a], [-L, yb, -b], [L, yb, -b]); }
      else { if (s > 0) m.quad([a, ya, L], [a, ya, -L], [b, yb, -L], [b, yb, L]); else m.quad([-a, ya, -L], [-a, ya, L], [-b, yb, L], [-b, yb, -L]); }
    }
    if (alongX && floors >= 2 && w > 8) for (const dx of (w > 11 ? [-w * 0.25, w * 0.25] : [0])) {
      const dz = d * 0.27, dy = h + 0.1 + rh * (1 - dz / (d / 2 + ov));
      m.c(mulc(wall, 0.95)); m.box(dx, dy - 0.5, dz + 0.5, 1.3, 1.5, 1.4, 61); m.c(jit(roofC, rng, 0.01, 0.03)); m.gable(dx, dy + 1.0, dz + 0.45, 1.7, 1.7, 0.6, false, mulc(wall, 0.9));
      m.c(trim, 0); m.box(dx, dy - 0.02, dz + 1.21, 0.86, 0.9, 0.05, 31); m.c(rng() < lit ? '#f6c648' : '#33466e', rng() < lit ? 0.8 : 0); m.box(dx, dy + 0.04, dz + 1.24, 0.7, 0.78, 0.05, 16);
    }
  }
  if (floors >= 2 && !o.plain) { m.c(mulc(wall, 1.1)); for (let f = 1; f < floors; f++) m.box(0, f * h / floors - 0.06, 0, w + 0.14, 0.13, d + 0.14, 60); }
  if (!o.plain) { m.c('#3a4658'); m.cyl(w / 2 + 0.06, 0, d / 2 + 0.06, 0.06, 0.06, h, 5, 0); }
  // facades
  const fh = h / floors, ww = o.winW || 1.0, wh = o.winH || Math.min(1.7, fh * 0.56);
  const facade = (ang, dist, width, cols, doorAt, shop) => {
    if (!cols) return;
    m.push().RY(ang).T(0, 0, dist);
    for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
      const cx = (k + 0.5) / cols * width - width / 2, cy = f * fh + fh * 0.5 - wh * 0.42 + (f === 0 ? 0.25 : 0);
      if (f === 0 && doorAt === k) {
        const dc = hex(o.doorCol || '#2f6a5a');
        m.c(trim, 0); m.box(cx, 0, 0.02, 1.25, 2.45, 0.1, 31);
        m.c(dc, 0); m.box(cx, 0, 0.06, 1.0, 2.25, 0.1, 31);
        m.c(mulc(dc, 0.7)); m.box(cx, 1.0, 0.1, 0.8, 0.06, 0.06, 31); m.c('#e9c95a'); m.box(cx + 0.33, 1.05, 0.12, 0.08, 0.08, 0.06, 31);
        m.c('#b9aeb4'); m.box(cx, 0, 0.3, 1.5, 0.14, 0.6, 61); m.box(cx, 0, 0.62, 1.8, 0.07, 0.4, 61);
        m.c(trim, 0); m.push().T(cx, 2.45, 0.02); for (let q = 0; q < 6; q++) { const a0 = q / 6 * Math.PI, a1 = (q + 1) / 6 * Math.PI; m.quad([Math.cos(a0) * 0.62, 0, 0.1], [Math.cos(a0) * 0.62, Math.sin(a0) * 0.45, 0.1], [Math.cos(a1) * 0.62, Math.sin(a1) * 0.45, 0.1], [Math.cos(a1) * 0.62, 0, 0.1]); } m.pop();
        m.c('#f6c648', lit > 0.3 ? 0.7 : 0); m.push().T(cx, 2.47, 0.04); for (let q = 0; q < 6; q++) { const a0 = q / 6 * Math.PI, a1 = (q + 1) / 6 * Math.PI; m.tri([0, 0, 0.1], [Math.cos(a0) * 0.5, Math.sin(a0) * 0.35, 0.1], [Math.cos(a1) * 0.5, Math.sin(a1) * 0.35, 0.1]); } m.pop();
        continue;
      }
      if (f === 0 && shop) {
        const sw = Math.min(width / cols - 0.5, 2.6);
        m.c(trim, 0); m.box(cx, 0.5, 0.02, sw + 0.2, 2.1, 0.1, 31);
        m.c('#f5c24a', 0.95); m.box(cx, 0.6, 0.06, sw, 1.9, 0.1, 31);
        m.c(trim, 0); m.box(cx, 0.6, 0.1, 0.07, 1.9, 0.07, 31); m.box(cx, 1.85, 0.1, sw, 0.07, 0.07, 31);
        if (k === 1 && !o.noSign) { m.c('#27303a'); m.box(cx + sw * 0.6, 3.05, 0.5, 0.05, 0.05, 1.0, 63); m.c(jit(hex(rng.pick(['#c2452f', '#3f6fb0', '#3f8a5a', '#e2b23c'])), rng, 0.02, 0.04)); m.box(cx + sw * 0.6, 2.35, 0.75, 0.07, 0.62, 0.8, 63); m.c('#f1ead6', 0); m.ell(cx + sw * 0.6, 2.66, 0.75, 0.05, 0.16, 0.2, 6, 4); }
        continue;
      }
      const on = rng() < lit;
      m.c(trim, 0); m.box(cx, cy - 0.07, 0.02, ww + 0.16, wh + 0.14, 0.09, 31);
      if (on) m.c(rng() < 0.75 ? '#f6c648' : '#e88f36', 0.72 + rng() * 0.28); else m.c(rng() < 0.5 ? '#33466e' : '#2c5560', 0);
      m.box(cx, cy, 0.05, ww, wh, 0.09, 16);
      m.c(trim, 0); m.box(cx, cy, 0.09, 0.055, wh, 0.05, 16); m.box(cx, cy + wh * 0.55, 0.09, ww, 0.055, 0.05, 16);
      if (o.sill !== 0) { m.c(mulc(wall, 1.12)); m.box(cx, cy - 0.16, 0.1, ww + 0.3, 0.1, 0.22, 31); }
      if (!o.plain && f > 0 && rng() < 0.3) { m.c('#7a4a2e'); m.box(cx, cy - 0.42, 0.22, ww + 0.2, 0.22, 0.26, 31); for (let q = 0; q < 4; q++) { m.c(jit(hex(rng.pick(['#d93a2b', '#f08a9a', '#f6e27a', '#e86a3a'])), rng, 0.02, 0.05)); m.ell(cx - ww * 0.4 + q * ww * 0.27, cy - 0.14, 0.24, 0.14, 0.12, 0.13, 5, 3); } m.c('#4f8a4a'); m.ell(cx, cy - 0.22, 0.25, ww * 0.55, 0.08, 0.13, 6, 3); }
      else if (!o.plain && f === 1 && floors >= 3 && rng() < 0.3) { m.c('#b9aeb4'); m.box(cx, cy - 0.3, 0.42, ww + 0.9, 0.1, 0.84, 63); m.c('#27303a'); for (let q = 0; q <= 6; q++) m.box(cx - (ww + 0.8) / 2 + q * (ww + 0.8) / 6, cy - 0.2, 0.8, 0.04, 0.85, 0.04, 61); m.box(cx, cy + 0.63, 0.8, ww + 0.86, 0.05, 0.05, 63); }
      if (shut) { m.c(jit(shut, rng, 0.01, 0.04)); const open = rng() < 0.85; if (open) { m.box(cx - ww * 0.78, cy - 0.03, 0.05, ww * 0.5, wh + 0.06, 0.07, 31); m.box(cx + ww * 0.78, cy - 0.03, 0.05, ww * 0.5, wh + 0.06, 0.07, 31); } else m.box(cx, cy - 0.03, 0.11, ww + 0.04, wh + 0.06, 0.06, 31); }
    }
    m.pop();
  };
  facade(0, d / 2, w, o.cols === undefined ? Math.max(1, Math.round(w / 2.6)) : o.cols, o.door === undefined ? 0 : o.door, o.shop);
  facade(Math.PI, d / 2, w, o.backCols === undefined ? Math.max(1, Math.round(w / 3.2)) : o.backCols, -1, false);
  facade(Math.PI / 2, w / 2, d, o.sideCols === undefined ? Math.max(1, Math.round(d / 3.4)) : o.sideCols, o.sideDoor === undefined ? -1 : o.sideDoor, o.sideShop);
  facade(-Math.PI / 2, w / 2, d, o.sideCols2 === undefined ? (o.sideCols === undefined ? Math.max(1, Math.round(d / 3.4)) : o.sideCols) : o.sideCols2, -1, false);
  if (o.awning) {
    const a = o.awning, aw = a.w || w * 0.8, ad = a.d || 2.2, ay = a.y || 2.9, ac = hex(a.col), ac2 = a.col2 ? hex(a.col2) : mulc(ac, 0.82), n = Math.max(2, Math.round(aw / 0.7));
    m.ds = true;
    for (let i = 0; i < n; i++) { const x0 = -aw / 2 + i / n * aw + (a.x || 0), x1 = x0 + aw / n; m.c(i % 2 ? ac : ac2, a.glow || 0); m.quad([x0, ay - 0.55, d / 2 + ad], [x1, ay - 0.55, d / 2 + ad], [x1, ay, d / 2], [x0, ay, d / 2]); m.quad([x0, ay - 0.85, d / 2 + ad], [x1, ay - 0.85, d / 2 + ad], [x1, ay - 0.55, d / 2 + ad], [x0, ay - 0.55, d / 2 + ad]); }
    m.ds = false; m.c(INK);
    for (const s of [-1, 1]) m.cyl(s * (aw / 2 - 0.1) + (a.x || 0), 0, d / 2 + ad - 0.08, 0.04, 0.04, ay - 0.55, 5, 0);
  }
  m.pop();
  addBox(ctx, o.x, o.z, w, d, o.rot || 0, h + rh * 0.5);
}

function lampPost(ctx, x, z, o) {
  o = o || {}; const m = ctx.m, y = o.y === undefined ? ctx.H(x, z) : o.y, h = o.h || 3.3;
  m.c('#1c2a33', 0);
  m.cyl(x, y, z, 0.13, 0.08, 0.4, 6, 0); m.cyl(x, y + 0.4, z, 0.05, 0.04, h - 0.4, 6, 0);
  m.box(x, y + h, z, 0.34, 0.05, 0.34, 63);
  m.c('#ffd972', 1); m.cyl(x, y + h + 0.05, z, 0.13, 0.19, 0.36, 4, 0);
  m.c('#1c2a33', 0); m.cyl(x, y + h + 0.41, z, 0.25, 0.03, 0.2, 4, 0);
  ctx.lamps.push({ x, y: y + h + 0.2, z, r: o.r || 13, col: o.col || [1.0, 0.76, 0.34], k: o.k || 0.85 });
  ctx.glows.push({ x, y: y + h + 0.22, z, s: o.gs || 1.5, col: o.gcol || [1.0, 0.82, 0.42] });
  addCircle(ctx, x, z, 0.18);
}

/* ---------- trees ---------- */
function cypress(ctx, x, z, h, o) {
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z); o = o || {};
  const dark = hex(o.col || '#12332a'), lite = hex(o.col2 || '#2c6040');
  m.sway(y, h, 0.5);
  m.c('#3a2a2a'); m.cyl(x, y, z, 0.28, 0.18, h * 0.16, 6, 0);
  const n = Math.round(6 + h * 0.45), wmax = h * 0.115 + 0.35;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = i * 2.4 + rng() * 0.8, env = Math.sin(Math.pow(t, 0.75) * Math.PI) * 0.86 + 0.14 * (1 - t);
    const r = wmax * env * (0.75 + rng() * 0.4), ly = y + h * (0.08 + t * 0.78), off = r * 0.42;
    m.c(jit(mixc(dark, lite, rng() * 0.75), rng, 0.02, 0.03));
    m.push().T(x + Math.cos(a) * off, ly, z + Math.sin(a) * off).RZ(Math.cos(a) * 0.2).RX(Math.sin(a) * 0.2);
    m.ell(0, h * 0.09, 0, r, h * (0.16 + rng() * 0.05), r, 6, 4);
    m.pop();
  }
  m.c(mixc(dark, lite, 0.4)); m.cyl(x + (rng() - 0.5) * 0.3, y + h * 0.82, z, wmax * 0.3, 0, h * 0.2, 6, 0);
  m.sway(0);
  addCircle(ctx, x, z, 0.5); ctx.occS.push({ x, y: y + h * 0.35, z, r: wmax * 1.1 }, { x, y: y + h * 0.65, z, r: wmax * 0.9 });
}
/* generic branching tree: trunk colour, blobs of foliage or blossom */
function tree(ctx, x, z, o) {
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z), h = o.h || 5, bark = hex(o.bark || '#4a3a38'), leaves = o.leaves.map(hex);
  const blob = o.blob || 1, squash = o.squash || 0.7, tips = [];
  m.sway(y + h * 0.3, h * 0.9, o.sway === undefined ? 0.5 : o.sway);
  const grow = (px, py, pz, dx, dy, dz, len, rad, depth) => {
    const pts = [[px, py, pz]], rr = [rad], seg = depth === 0 ? 3 : 2;
    for (let i = 1; i <= seg; i++) {
      dx += rng.s() * (o.twist || 0.28); dz += rng.s() * (o.twist || 0.28); dy += (o.lift || 0.05); const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
      px += dx * len / seg; py += dy * len / seg; pz += dz * len / seg; pts.push([px, py, pz]); rr.push(rad * (1 - i / seg * 0.4));
    }
    m.c(jit(bark, rng, 0.01, 0.03)); m.tube(pts, rr, depth === 0 ? 6 : (depth === 1 ? 4 : 3));
    if (depth >= (o.depth || 2)) { tips.push([px, py, pz]); return; }
    const kids = depth === 0 ? (o.forks || 3) : 2;
    for (let k = 0; k < kids; k++) {
      const a = k / kids * TAU + rng() * 1.6, sp = o.spread || 0.75;
      grow(px, py, pz, dx * (1 - sp) + Math.cos(a) * sp, dy * (1 - sp * 0.5) + 0.25, dz * (1 - sp) + Math.sin(a) * sp, len * (o.shrink || 0.68), rad * 0.58, depth + 1);
    }
  };
  grow(x, y - 0.1, z, o.leanX || rng.s() * 0.12, 1, rng.s() * 0.12, h * (o.trunk || 0.42), o.rad || h * 0.045, 0);
  for (const t of tips) {
    const n = o.blobs || 2;
    for (let i = 0; i < n; i++) {
      const r = blob * (0.7 + rng() * 0.6);
      m.c(jit(rng.pick(leaves), rng, 0.02, 0.05));
      m.ell(t[0] + rng.s() * blob * 0.7, t[1] + rng.s() * blob * 0.3 + r * 0.2, t[2] + rng.s() * blob * 0.7, r, r * squash, r, o.lo ? 5 : 7, o.lo ? 3 : 5);
    }
    if (!o.lo) for (let i = 0; i < 2; i++) { const r = blob * (0.34 + rng() * 0.22); m.c(jit(mixc(rng.pick(leaves), [1, 1, 0.8], 0.22), rng, 0.02, 0.05)); m.ell(t[0] + rng.s() * blob * 0.9, t[1] + blob * (0.35 + rng() * 0.4) * squash, t[2] + rng.s() * blob * 0.9, r, r * squash, r, 6, 4); }
  }
  m.sway(0);
  if (!o.noCollide) addCircle(ctx, x, z, Math.max(0.35, (o.rad || h * 0.045) * 2.2));
  ctx.occS.push({ x, y: y + h * 0.85, z, r: h * 0.38 + blob });
  return tips;
}
const TREES = {
  plane: { h: 8.5, forks: 3, depth: 2, blob: 1.5, blobs: 2, squash: 0.72, leaves: ['#4f8f4a', '#6aa84f', '#3d7a4a', '#8fb84a'], bark: '#5a4a3a', spread: 0.6 },
  olive: { h: 4.6, forks: 3, depth: 2, blob: 1.05, blobs: 2, squash: 0.62, twist: 0.5, leaves: ['#8fae94', '#6f9a80', '#a9c2a2', '#5f8a78'], bark: '#4c4250', spread: 0.8, rad: 0.3, trunk: 0.36 },
  almond: { h: 4.8, forks: 3, depth: 2, blob: 0.82, blobs: 3, squash: 0.7, twist: 0.42, leaves: ['#fbf4ee', '#f6dfe0', '#f1c6cf', '#fffaf2'], bark: '#3a4a58', spread: 0.85, trunk: 0.34 },
  peach: { h: 4.2, forks: 3, depth: 2, blob: 0.8, blobs: 3, squash: 0.7, twist: 0.42, leaves: ['#f3a9b6', '#f6c3c6', '#e98aa2', '#fbe3df'], bark: '#4a3a44', spread: 0.85, trunk: 0.34 },
  plum: { h: 4.4, forks: 3, depth: 2, blob: 0.7, blobs: 3, squash: 0.65, twist: 0.6, leaves: ['#e2526a', '#f08a9a', '#f6c9cf', '#d43a5a'], bark: '#2a2630', spread: 0.9, trunk: 0.3, lift: 0.0 },
  apple: { h: 5.5, forks: 3, depth: 2, blob: 1.2, blobs: 2, squash: 0.75, leaves: ['#5f9a4a', '#7fb04f', '#4a8a52'], bark: '#5a4636', spread: 0.7 },
  autumn: { h: 9, forks: 2, depth: 2, blob: 1.3, blobs: 2, squash: 1.25, leaves: ['#e8a52c', '#f0c23a', '#d9822a', '#c9b83a'], bark: '#5a4a52', spread: 0.35, trunk: 0.5 },
  pine: { h: 7, forks: 3, depth: 2, blob: 1.4, blobs: 1, squash: 0.38, twist: 0.5, leaves: ['#2f5a4a', '#3d6a52', '#274a44'], bark: '#5a3a30', spread: 0.9, trunk: 0.5, lift: -0.02 },
  dot: { h: 8, forks: 3, depth: 2, blob: 1.6, blobs: 2, squash: 0.8, leaves: ['#3f7a4a', '#5a9a4f', '#2f6a52', '#7aa84a'], bark: '#5a4a5a', spread: 0.6, sway: 0.25 },
  willow: { h: 6.5, forks: 4, depth: 2, blob: 1.3, blobs: 2, squash: 1.5, leaves: ['#8fb86a', '#a9c87a', '#7aa860', '#b9d08a'], bark: '#5a4a3a', spread: 0.9, trunk: 0.5, lift: -0.06, sway: 0.9 },
};
function pollard(ctx, x, z, o) { // pollard willow at sunset
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z), h = (o && o.h) || 2.6;
  m.c('#4a3d4a'); m.tube([[x, y - 0.1, z], [x + rng.s() * 0.15, y + h * 0.5, z + rng.s() * 0.15], [x, y + h, z]], [0.34, 0.27, 0.36], 7);
  m.ell(x, y + h, z, 0.5, 0.36, 0.5, 7, 5);
  m.sway(y + h, 2.4, 0.9);
  for (let i = 0; i < 16; i++) { const a = rng() * TAU, t = 0.25 + rng() * 0.7, l = 1.6 + rng() * 1.3; m.c(jit(hex(rng() < 0.6 ? '#e2932c' : '#d6b83a'), rng, 0.02, 0.05)); m.tube([[x + Math.cos(a) * 0.3, y + h + 0.1, z + Math.sin(a) * 0.3], [x + Math.cos(a) * (0.3 + t * l * 0.5), y + h + l * 0.6, z + Math.sin(a) * (0.3 + t * l * 0.5)], [x + Math.cos(a) * (0.3 + t * l), y + h + l, z + Math.sin(a) * (0.3 + t * l)]], [0.05, 0.035, 0.012], 4); }
  m.sway(0); addCircle(ctx, x, z, 0.45);
}
function bush(ctx, x, z, r, cols, o) {
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z), n = (o && o.n) || 4;
  m.sway(y, r * 2, 0.25);
  for (let i = 0; i < n; i++) { const a = rng() * TAU, q = r * (0.5 + rng() * 0.5); m.c(jit(hex(rng.pick(cols)), rng, 0.02, 0.05)); m.ell(x + Math.cos(a) * r * 0.5, y + q * 0.55, z + Math.sin(a) * r * 0.5, q, q * 0.8, q, 7, 4); }
  m.sway(0);
}

/* ---------- small plants (detail mesh, distance culled) ---------- */
function wheat(ctx, x, z, o) {
  const d = ctx.d, rng = ctx.rng, y = ctx.H(x, z), h = (o && o.h) || 0.95, cols = (o && o.cols) || ['#e6bd3e', '#d9a62e', '#f0d262', '#c9a43a', '#b9b24c'];
  d.ds = true; d.nup = 0.75; d.sway(y, h, 1);
  const n = (o && o.n) || 6;
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, r = rng() * 0.38, bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r, hh = h * (0.75 + rng() * 0.45), lx = rng.s() * 0.24, lz = rng.s() * 0.24, wdt = 0.04 + rng() * 0.03;
    const px = Math.cos(a + 1.3) * wdt, pz = Math.sin(a + 1.3) * wdt;
    d.c(jit(hex(rng.pick(cols)), rng, 0.012, 0.05));
    d.quad([bx - px * 0.5, y, bz - pz * 0.5], [bx + px * 0.5, y, bz + pz * 0.5], [bx + lx * 0.8 + px * 1.3, y + hh * 0.72, bz + lz * 0.8 + pz * 1.3], [bx + lx * 1.3, y + hh, bz + lz * 1.3]);
  }
  d.ds = false; d.nup = 0; d.sway(0);
}
function grass(ctx, x, z, o) {
  const d = ctx.d, rng = ctx.rng, y = ctx.H(x, z), h = (o && o.h) || 0.34, cols = (o && o.cols) || ['#6fa84a', '#8fbf4f', '#4f8f4a', '#a9c94f', '#5f9f6a'];
  d.ds = true; d.nup = 0.75; d.sway(y, h, 0.7);
  for (let i = 0; i < 4; i++) {
    const a = rng() * TAU, r = rng() * 0.25, bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r, hh = h * (0.6 + rng() * 0.8), wd = 0.045 + rng() * 0.03;
    d.c(jit(hex(rng.pick(cols)), rng, 0.02, 0.05));
    d.tri([bx - Math.cos(a + 1.5) * wd, y, bz - Math.sin(a + 1.5) * wd], [bx + Math.cos(a + 1.5) * wd, y, bz + Math.sin(a + 1.5) * wd], [bx + rng.s() * 0.16, y + hh, bz + rng.s() * 0.16]);
  }
  d.ds = false; d.nup = 0; d.sway(0);
}
function sunflower(ctx, x, z, o) {
  const d = ctx.d, rng = ctx.rng, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z), h = (o && o.h) || (1.35 + rng() * 0.6), face = (o && o.face !== undefined ? o.face : 2.4) + rng.s() * 0.6;
  const lx = Math.sin(face) * 0.18, lz = Math.cos(face) * 0.18;
  d.nup = 0.5; d.sway(y, h, 0.55);
  d.c(jit(hex('#5f8f3a'), rng, 0.02, 0.04)); d.tube([[x, y, z], [x + lx * 0.3, y + h * 0.55, z + lz * 0.3], [x + lx, y + h, z + lz]], [0.035, 0.03, 0.026], 4);
  d.ds = true;
  for (let i = 0; i < 3; i++) { const a = rng() * TAU, ly = y + h * (0.25 + i * 0.2), lw = 0.2 + rng() * 0.08, ex = Math.cos(a), ez = Math.sin(a); d.c(jit(hex(rng() < 0.5 ? '#4f8a3f' : '#6fa04a'), rng, 0.02, 0.04)); d.quad([x, ly, z], [x + ex * lw - ez * lw * 0.6, ly + 0.07, z + ez * lw + ex * lw * 0.6], [x + ex * lw * 2.1, ly - 0.06, z + ez * lw * 2.1], [x + ex * lw + ez * lw * 0.6, ly + 0.07, z + ez * lw - ex * lw * 0.6]); }
  d.ds = false;
  const R = (o && o.R) || (0.15 + rng() * 0.06), tilt = 1.0 + rng() * 0.45, pc = jit(hex(rng() < 0.7 ? '#f4c62e' : '#eda52a'), rng, 0.015, 0.04);
  d.push().T(x + lx, y + h, z + lz).RY(face).RX(tilt);
  d.c('#5f8f3a'); d.flip = true; d.disc(0, -0.015, 0, R * 1.25, 8); d.flip = false;
  d.ds = true; d.c(pc);
  const np = 11;
  for (let i = 0; i < np; i++) { const a0 = i / np * TAU, a1 = a0 + TAU / np * 0.82, am = (a0 + a1) / 2, r0 = R * 0.8, r1 = R * (1.9 + (i % 2) * 0.25); d.tri([Math.cos(a0) * r0, 0.0, Math.sin(a0) * r0], [Math.cos(am) * r1, 0.035, Math.sin(am) * r1], [Math.cos(a1) * r0, 0.0, Math.sin(a1) * r0]); }
  d.ds = false;
  d.c(jit(hex('#7a4a22'), rng, 0.02, 0.05)); d.cyl(0, 0, 0, R, R * 0.55, 0.05, 8, 1);
  d.c('#4a2c16'); d.disc(0, 0.052, 0, R * 0.5, 6);
  d.pop(); d.nup = 0; d.sway(0);
}
function iris(ctx, x, z, o) {
  const d = ctx.d, rng = ctx.rng, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z), h = 0.6 + rng() * 0.3, white = o && o.white;
  d.ds = true; d.nup = 0.6; d.sway(y, h, 0.5);
  for (let i = 0; i < 4; i++) { const a = rng() * TAU, hh = h * (0.7 + rng() * 0.4), wd = 0.035, lx = Math.cos(a) * 0.2, lz = Math.sin(a) * 0.2; d.c(jit(hex(rng() < 0.5 ? '#4f9a78' : '#6fb07a'), rng, 0.02, 0.05)); d.tri([x - Math.sin(a) * wd, y, z + Math.cos(a) * wd], [x + Math.sin(a) * wd, y, z - Math.cos(a) * wd], [x + lx, y + hh, z + lz]); }
  d.ds = false;
  d.c('#5f9a5a'); d.cyl(x, y, z, 0.014, 0.012, h, 4, 0);
  const pc = white ? hex('#f4f2ea') : jit(hex(rng() < 0.6 ? '#4a46b8' : '#6a58cf'), rng, 0.02, 0.05), pc2 = white ? hex('#e6e6f0') : mulc(pc, 1.25);
  d.ds = true;
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + rng() * 0.5, ex = Math.cos(a), ez = Math.sin(a);
    d.c(pc); d.quad([x, y + h, z], [x + ex * 0.07 - ez * 0.045, y + h + 0.01, z + ez * 0.07 + ex * 0.045], [x + ex * 0.16, y + h - 0.08, z + ez * 0.16], [x + ex * 0.07 + ez * 0.045, y + h + 0.01, z + ez * 0.07 - ex * 0.045]);
    const b = a + 1.05, fx = Math.cos(b), fz = Math.sin(b);
    d.c(pc2); d.quad([x, y + h, z], [x + fx * 0.03 - fz * 0.035, y + h + 0.07, z + fz * 0.03 + fx * 0.035], [x + fx * 0.02, y + h + 0.15, z + fz * 0.02], [x + fx * 0.03 + fz * 0.035, y + h + 0.07, z + fz * 0.03 - fx * 0.035]);
  }
  d.ds = false; d.c('#f0c832'); d.ell(x, y + h, z, 0.02, 0.02, 0.02, 5, 3); d.nup = 0; d.sway(0);
}
function poppy(ctx, x, z, o) {
  const d = ctx.d, rng = ctx.rng, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z), h = 0.38 + rng() * 0.3, c = hex((o && o.col) || (rng() < 0.85 ? '#d93a2b' : '#ee6a3a'));
  d.sway(y, h, 0.8);
  d.c('#6a9a4a'); d.cyl(x, y, z, 0.012, 0.009, h, 3, 0);
  d.c(jit(c, rng, 0.015, 0.05)); const r = (o && o.r) || (0.06 + rng() * 0.035); d.cyl(x, y + h - 0.01, z, r * 0.25, r, 0.05, 6, 0); d.c(mulc(c, 0.8)); d.disc(x, y + h + 0.03, z, r * 0.97, 6);
  d.c((o && o.eye) || '#2a1a22'); d.disc(x, y + h + 0.034, z, r * 0.3, 5); d.sway(0);
}
function bloom(ctx, x, z, col, o) { // tiny meadow flower
  const d = ctx.d, rng = ctx.rng, y = ctx.H(x, z), h = (o && o.h) || (0.16 + rng() * 0.2), r = (o && o.r) || 0.05;
  d.sway(y, h, 0.6); d.c('#6a9a4a'); d.ds = true; d.tri([x - 0.012, y, z], [x + 0.012, y, z], [x, y + h, z]); d.ds = false;
  d.c(jit(hex(col), rng, 0.02, 0.05)); d.disc(x, y + h, z, r, 5); d.sway(0);
}
function reed(ctx, x, z) {
  const d = ctx.d, rng = ctx.rng, y = ctx.H(x, z), h = 1.1 + rng() * 0.8;
  d.ds = true; d.sway(y, h, 1);
  for (let i = 0; i < 4; i++) { const a = rng() * TAU, bx = x + rng.s() * 0.25, bz = z + rng.s() * 0.25, hh = h * (0.6 + rng() * 0.5); d.c(jit(hex(rng() < 0.5 ? '#7a9a4a' : '#a9a84a'), rng, 0.02, 0.05)); d.tri([bx - Math.cos(a) * 0.035, y, bz - Math.sin(a) * 0.035], [bx + Math.cos(a) * 0.035, y, bz + Math.sin(a) * 0.035], [bx + rng.s() * 0.25, y + hh, bz + rng.s() * 0.25]); }
  d.ds = false; d.c('#6a4226'); d.cyl(x, y + h * 0.8, z, 0.03, 0.03, 0.2, 4, 1); d.sway(0);
}
function haystack(ctx, x, z, s) {
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z); s = s || 1;
  m.c(jit(hex('#e2b441'), rng, 0.02, 0.04)); m.grad('#b98a3a', y, 1.4 * s);
  m.lathe(x, y - 0.1, z, [[2.0 * s, 0], [2.3 * s, 0.7 * s], [2.2 * s, 1.5 * s], [1.6 * s, 2.3 * s], [0.7 * s, 2.9 * s], [0, 3.1 * s]], 10);
  m.grad(null); addCircle(ctx, x, z, 2.2 * s); ctx.occS.push({ x, y: y + 1.2 * s, z, r: 2.3 * s });
}

/* ---------- furniture ---------- */
function cafeTable(ctx, x, z, y, o) {
  const m = ctx.m; o = o || {};
  m.c(o.top || '#f3efe2'); m.cyl(x, y + 0.72, z, 0.42, 0.42, 0.04, 10, 3);
  m.c('#2a3a4a'); m.cyl(x, y, z, 0.035, 0.035, 0.72, 5, 0); m.cyl(x, y, z, 0.24, 0.04, 0.06, 6, 0);
  if (o.cup !== 0) { m.c('#f7f4ea'); m.cyl(x + 0.14, y + 0.76, z + 0.05, 0.035, 0.045, 0.06, 6, 1); m.c('#7a4a2a'); m.cyl(x - 0.12, y + 0.76, z - 0.08, 0.03, 0.022, 0.2, 6, 1); }
  addCircle(ctx, x, z, 0.45);
}
function chair(ctx, x, z, y, rot, o) { // the rush-seated chair of the Yellow House
  const m = ctx.m; o = o || {}; const c = hex(o.col || '#d2982e'), sc = hex(o.seat || '#e6cd72'), c2 = mulc(c, 0.78);
  m.push().T(x, y, z).RY(rot);
  for (const sx of [-1, 1]) { m.c(c); m.cyl(sx * 0.2, 0, 0.19, 0.026, 0.03, 0.47, 6, 1); m.cyl(sx * 0.2, 0, -0.2, 0.028, 0.03, 0.5, 6, 0); m.push().T(sx * 0.2, 0.5, -0.2).RX(-0.1); m.cyl(0, 0, 0, 0.026, 0.022, 0.52, 6, 1); m.ell(0, 0.53, 0, 0.03, 0.03, 0.03, 5, 3); m.pop(); m.c(c2); m.box(sx * 0.2, 0.18, 0, 0.026, 0.026, 0.38, 63); m.box(sx * 0.2, 0.32, 0, 0.026, 0.026, 0.38, 63); }
  m.c(c2); m.box(0, 0.2, 0.19, 0.38, 0.026, 0.026, 63); m.box(0, 0.26, -0.2, 0.38, 0.026, 0.026, 63);
  m.c(c); m.box(0, 0.435, 0, 0.46, 0.035, 0.46, 63);
  m.c(sc); m.box(0, 0.47, 0, 0.4, 0.022, 0.4, 61); m.c(mulc(sc, 0.82)); m.quad([-0.2, 0.494, 0.2], [0.2, 0.494, -0.2], [0.17, 0.494, -0.2], [-0.2, 0.494, 0.17]); m.quad([0.2, 0.494, 0.2], [0.2, 0.494, 0.17], [-0.17, 0.494, -0.2], [-0.2, 0.494, -0.2]);
  m.c(c); for (const yy of [0.62, 0.78, 0.94]) { m.push().T(0, yy, -0.2 - (yy - 0.5) * 0.1); m.tube([[-0.2, 0, 0], [-0.1, 0.012, -0.025], [0, 0.016, -0.033], [0.1, 0.012, -0.025], [0.2, 0, 0]], 0.02, 5); m.pop(); }
  m.pop();
  if (!o.noSeat) ctx.seats.push({ x, z, y: y + 0.49 - 0.49, rot, tag: o.tag });
  if (!o.free) addCircle(ctx, x, z, 0.26);
}
function armchair(ctx, x, z, y, rot, o) { // Gauguin's armchair
  const m = ctx.m; o = o || {}; const c = hex(o.col || '#6a3a2a'), sc = hex(o.seat || '#3f7a5a');
  m.push().T(x, y, z).RY(rot); m.c(c);
  for (const sx of [-1, 1]) { m.tube([[sx * 0.26, 0, 0.26], [sx * 0.27, 0.3, 0.22], [sx * 0.26, 0.48, 0.2]], 0.03, 6); m.tube([[sx * 0.24, 0, -0.28], [sx * 0.22, 0.5, -0.2], [sx * 0.2, 1.02, -0.3]], 0.03, 6); m.tube([[sx * 0.26, 0.48, 0.2], [sx * 0.31, 0.72, 0.22], [sx * 0.3, 0.74, 0.0], [sx * 0.22, 0.7, -0.22]], 0.026, 6); }
  m.tube([[-0.2, 1.02, -0.3], [0, 1.1, -0.34], [0.2, 1.02, -0.3]], 0.03, 6); m.tube([[-0.21, 0.62, -0.22], [0, 0.64, -0.27], [0.21, 0.62, -0.22]], 0.022, 5);
  for (const sx of [-0.1, 0, 0.1]) m.tube([[sx, 0.64, -0.26], [sx * 1.1, 1.05, -0.33]], 0.016, 4);
  m.c(sc); m.ell(0, 0.49, 0, 0.28, 0.06, 0.27, 10, 5); m.c(c); m.box(0, 0.4, 0, 0.56, 0.05, 0.5, 63);
  if (o.candle) { m.c('#f1ead6'); m.cyl(0.08, 0.55, 0.02, 0.022, 0.022, 0.16, 6, 1); m.c('#ffd972', 1); m.ell(0.08, 0.74, 0.02, 0.018, 0.035, 0.018, 5, 4); m.c('#e6c256'); m.cyl(0.08, 0.54, 0.02, 0.06, 0.05, 0.02, 8, 1); m.c('#e2b23c'); m.box(-0.08, 0.55, 0.0, 0.16, 0.03, 0.22, 63); m.c('#d98a8a'); m.box(-0.07, 0.58, 0.02, 0.15, 0.03, 0.2, 63); ctx.lamps.push({ x, y: y + 0.8, z, r: 5, col: [1, 0.75, 0.35], k: 0.6 }); ctx.glows.push({ x, y: y + 0.76, z, s: 0.5, col: [1, 0.8, 0.4] }); }
  m.pop();
  if (!o.noSeat) ctx.seats.push({ x, z, y: y + 0.53 - 0.49, rot, tag: o.tag });
  addCircle(ctx, x, z, 0.36);
}
function barrel(ctx, x, z, s) { const m = ctx.m, y = ctx.H(x, z); s = s || 1; m.c(jit(hex('#8a5a32'), ctx.rng, 0.02, 0.04)); m.lathe(x, y, z, [[0.3 * s, 0], [0.38 * s, 0.25 * s], [0.4 * s, 0.5 * s], [0.38 * s, 0.75 * s], [0.3 * s, 1.0 * s]], 10); m.c('#5a3a22'); m.disc(x, y + 1.0 * s, z, 0.3 * s, 10); m.c('#3a3a42'); for (const t of [0.2, 0.8]) m.cyl(x, y + t * s - 0.02, z, 0.385 * s - Math.abs(t - 0.5) * 0.07 * s, 0.385 * s - Math.abs(t - 0.5) * 0.07 * s, 0.04, 10, 0); addCircle(ctx, x, z, 0.42 * s); }
function crate(ctx, x, z, s, rot) { const m = ctx.m, y = ctx.H(x, z); s = s || 0.6; m.push().T(x, y, z).RY(rot || 0); m.c(jit(hex('#b98a4a'), ctx.rng, 0.02, 0.05)); m.box(0, 0, 0, s, s * 0.7, s, 63); m.c('#8a6234'); for (const q of [-1, 1]) { m.box(q * s * 0.5, 0, 0, 0.03, s * 0.7, s + 0.02, 61); m.box(0, 0, q * s * 0.5, s + 0.02, s * 0.7, 0.03, 61); } m.pop(); addCircle(ctx, x, z, s * 0.6); }
function pot(ctx, x, z, kind, o) {
  const m = ctx.m, rng = ctx.rng, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z), s = (o && o.s) || 1;
  m.c(jit(hex((o && o.col) || '#c9703a'), rng, 0.02, 0.04)); m.lathe(x, y, z, [[0.16 * s, 0], [0.24 * s, 0.3 * s], [0.26 * s, 0.34 * s], [0.22 * s, 0.34 * s]], 8);
  if (kind === 'bush') { m.sway(y + 0.3, 0.8, 0.2); for (let i = 0; i < 3; i++) { m.c(jit(hex(rng.pick(['#4f8a4a', '#6aa84f', '#3d7a4a'])), rng, 0.02, 0.05)); m.ell(x + rng.s() * 0.1, y + 0.5 * s + i * 0.12, z + rng.s() * 0.1, 0.24 * s, 0.22 * s, 0.24 * s, 6, 4); } m.sway(0); }
  else if (kind === 'sun') for (let i = 0; i < 3; i++) sunflower(ctx, x + rng.s() * 0.1, z + rng.s() * 0.1, { y: y + 0.3 * s, h: 0.5 + rng() * 0.5, R: 0.11 });
  else if (kind === 'iris') for (let i = 0; i < 4; i++) iris(ctx, x + rng.s() * 0.1, z + rng.s() * 0.1, { y: y + 0.3 * s });
  else for (let i = 0; i < 5; i++) poppy(ctx, x + rng.s() * 0.12, z + rng.s() * 0.12, { y: y + 0.3 * s, col: kind });
  addCircle(ctx, x, z, 0.26 * s);
}
function stall(ctx, x, z, rot, col) { // a market stall heaped with fruit
  const m = ctx.m, rng = ctx.rng, y = ctx.H(x, z);
  m.push().T(x, y, z).RY(rot);
  m.c('#a8824e'); m.box(0, 0.75, 0, 2.6, 0.08, 1.2, 63); m.c('#7a5630'); for (const sx of [-1.2, 1.2]) for (const sz of [-0.5, 0.5]) m.box(sx, 0, sz, 0.08, sz < 0 ? 2.3 : 0.75, 0.08, 61);
  m.ds = true; for (let i = 0; i < 6; i++) { m.c(i % 2 ? col : '#f6ead6'); const x0 = -1.5 + i * 0.5; m.quad([x0, 1.95, 0.95], [x0 + 0.5, 1.95, 0.95], [x0 + 0.5, 2.35, -0.6], [x0, 2.35, -0.6]); } m.ds = false;
  for (let b = 0; b < 4; b++) { const bx = -0.95 + b * 0.63; m.c('#c9a45a'); m.lathe(bx, 0.83, 0, [[0.2, 0], [0.26, 0.14]], 8); const fc = ['#e2412f', '#f0a23a', '#f6e27a', '#7fae4a'][b]; for (let i = 0; i < 7; i++) { m.c(jit(hex(fc), rng, 0.02, 0.05)); m.ell(bx + rng.s() * 0.13, 0.95 + rng() * 0.08, rng.s() * 0.13, 0.065, 0.065, 0.065, 6, 4); } }
  m.pop(); addBox(ctx, x, z, 2.7, 1.3, rot, 2.3, true);
}
function handcart(ctx, x, z, rot) { const m = ctx.m, y = ctx.H(x, z); m.push().T(x, y, z).RY(rot); m.c('#e3b93c'); m.box(0, 0.6, 0, 1.1, 0.07, 1.8, 63); m.c('#c79a2e'); for (const s of [-1, 1]) m.box(s * 0.55, 0.6, 0, 0.05, 0.4, 1.8, 63); m.box(0, 0.6, -0.9, 1.1, 0.4, 0.05, 63); m.c('#c2452f'); for (const s of [-1, 1]) { const ring = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU; ring.push([s * 0.66, 0.55 + Math.sin(a) * 0.55, Math.cos(a) * 0.55]); } m.tube(ring, 0.035, 5); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; m.tube([[s * 0.66, 0.55 - Math.sin(a) * 0.52, -Math.cos(a) * 0.52], [s * 0.66, 0.55 + Math.sin(a) * 0.52, Math.cos(a) * 0.52]], 0.016, 4); } } m.c('#7a5630'); for (const s of [-1, 1]) m.tube([[s * 0.45, 0.62, 0.9], [s * 0.45, 0.5, 2.0]], 0.03, 5); m.pop(); addBox(ctx, x, z, 1.5, 2.0, rot, 1.1, true); }
/* a framed picture hanging on a wall; its canvas is filled with the real painting when the app can fetch it */
function picture(ctx, x, y, z, rot, w, h, art) {
  const m = ctx.m, T = 0.16, g = '#d9a93a', g2 = '#f2cf62';
  m.push().T(x, y, z).RY(rot);
  m.c(g, 0.1); m.box(-(w / 2 + T / 2), -T, 0.05, T, h + T * 2, 0.14, 63); m.box(w / 2 + T / 2, -T, 0.05, T, h + T * 2, 0.14, 63); m.box(0, h, 0.05, w + T * 2, T, 0.14, 63); m.box(0, -T, 0.05, w + T * 2, T, 0.14, 63);
  m.c(g2, 0.18); m.box(-(w / 2 + T * 0.5), -T * 0.6, 0.09, T * 0.4, h + T * 1.2, 0.1, 63); m.box(w / 2 + T * 0.5, -T * 0.6, 0.09, T * 0.4, h + T * 1.2, 0.1, 63); m.box(0, h + T * 0.3, 0.09, w + T * 1.2, T * 0.4, 0.1, 63); m.box(0, -T * 0.7, 0.09, w + T * 1.2, T * 0.4, 0.1, 63);
  for (const sx of [-1, 1]) for (const sy of [0, 1]) m.ell(sx * (w / 2 + T / 2), sy * (h + T) - T / 2, 0.1, 0.16, 0.16, 0.09, 6, 4);
  m.c('#efe6cc'); m.box(0, -0.62, 0.03, 0.9, 0.24, 0.04, 63);
  m.pop();
  const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly) => [x + lx * c + 0.06 * s, y + ly, z - lx * s + 0.06 * c];
  const a = P(-w / 2, 0), b = P(w / 2, 0), cc = P(w / 2, h), dd = P(-w / 2, h);
  ctx.picq.push(a[0], a[1], a[2], 0, 0, b[0], b[1], b[2], 1, 0, cc[0], cc[1], cc[2], 1, 1, dd[0], dd[1], dd[2], 0, 1);
  ctx.pics.push({ art, c: ART[art].c.map(hex), tex: null });
  ctx.spots.push({ art, x: x + s * 2.2, z: z + c * 2.2, r: 3.4 });
  ctx.lamps.push({ x: x + s * 1.2, y: y + h + 0.8, z: z + c * 1.2, r: 6, col: [1, 0.88, 0.6], k: 0.8 });
}
function bench(ctx, x, z, rot, o) {
  const m = ctx.m, y = ctx.H(x, z), c = hex((o && o.col) || '#3f6a5a');
  m.push().T(x, y, z).RY(rot); m.c(c);
  m.box(0, 0.4, 0, 1.7, 0.07, 0.45, 63); m.box(0, 0.62, -0.22, 1.7, 0.36, 0.06, 63);
  m.c('#22303a'); for (const s of [-1, 1]) { m.box(s * 0.75, 0, 0, 0.07, 0.4, 0.42, 60); m.box(s * 0.75, 0.4, -0.22, 0.07, 0.6, 0.07, 61); }
  m.pop(); addBox(ctx, x, z, 1.7, 0.5, rot, 1, true);
  ctx.seats.push({ x: x + Math.sin(rot) * 0.05, z: z + Math.cos(rot) * 0.05, y: y + 0.47 - 0.86 + 0.37, rot, tag: o && o.tag });
}
function fence(ctx, x0, z0, x1, z1, o) {
  const m = ctx.m, len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.6)), c = hex((o && o.col) || '#8a6a4a'), h = (o && o.h) || 0.95;
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), y = ctx.H(x, z); m.c(jit(c, ctx.rng, 0.01, 0.04)); m.box(x, y, z, 0.1, h + ctx.rng() * 0.1, 0.1, 61); }
  const ang = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), ya = ctx.H(lerp(x0, x1, i / n), lerp(z0, z1, i / n)), yb = ctx.H(lerp(x0, x1, (i + 1) / n), lerp(z0, z1, (i + 1) / n)); for (const hh of [0.45, 0.8]) { m.push().T(x, (ya + yb) / 2 + hh * h, z).RY(ang).RX(-Math.atan2(yb - ya, len / n)); m.box(0, 0, 0, 0.05, 0.07, len / n, 63); m.pop(); } }
}
function boat(ctx, x, z, rot, col, o) {
  const m = ctx.m, y = (o && o.y !== undefined) ? o.y : -0.5, L = (o && o.L) || 4.6, Wd = (o && o.W) || 1.5, c = hex(col), c2 = hex((o && o.col2) || '#f1ead6');
  m.push().T(x, y, z).RY(rot).RZ((o && o.tilt) || 0);
  const sec = [[-L / 2, 0.25, 0.55], [-L * 0.3, 0.92, 0.1], [0, 1, 0], [L * 0.28, 0.9, 0.08], [L / 2, 0.08, 0.6]];
  for (let i = 0; i < sec.length - 1; i++) {
    const a = sec[i], b = sec[i + 1], wa = a[1] * Wd / 2, wb = b[1] * Wd / 2, ya = a[2], yb = b[2];
    for (const s of [1, -1]) {
      const A0 = [a[0], ya, s * wa * 0.45], A1 = [a[0], ya + 0.62, s * wa], B0 = [b[0], yb, s * wb * 0.45], B1 = [b[0], yb + 0.62, s * wb];
      m.c(c); if (s > 0) m.quad(A0, B0, B1, A1); else m.quad(B0, A0, A1, B1);
      m.c(mulc(c, 0.6)); if (s > 0) m.quad(B0, A0, A1, B1); else m.quad(A0, B0, B1, A1);
      m.c(c2); const A2 = [a[0], ya + 0.72, s * wa * 1.03], B2 = [b[0], yb + 0.72, s * wb * 1.03]; if (s > 0) m.quad(A1, B1, B2, A2); else m.quad(B1, A1, A2, B2);
    }
    m.c(mulc(c, 0.7)); m.quad([a[0], ya, -wa * 0.45], [a[0], ya, wa * 0.45], [b[0], yb, wb * 0.45], [b[0], yb, -wb * 0.45]);
    m.c(mulc(c, 0.5)); m.quad([a[0], ya, wa * 0.45], [a[0], ya, -wa * 0.45], [b[0], yb, -wb * 0.45], [b[0], yb, wb * 0.45]);
  }
  m.c('#c9a56a'); m.box(-L * 0.12, 0.42, 0, 0.22, 0.05, Wd * 0.86, 63); m.box(L * 0.18, 0.42, 0, 0.22, 0.05, Wd * 0.8, 63);
  if (o && o.mast) { m.c('#5a4636'); m.cyl(L * 0.05, 0.1, 0, 0.05, 0.035, o.mast, 5, 1); m.push().T(L * 0.05, o.mast * 0.8, 0).RZ(1.25); m.cyl(0, -1.4, 0, 0.03, 0.03, 2.8, 4, 0); m.pop(); }
  m.pop();
  if (!(o && o.noCollide)) addCircle(ctx, x, z, L * 0.35);
}
/* easel carrying a little study: marks a painting spot */
function easel(ctx, x, z, rot, cols, o) {
  const m = ctx.m, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z);
  m.push().T(x, y, z).RY(rot);
  m.c('#7a5630');
  m.tube([[-0.36, 0, 0.12], [-0.06, 1.75, -0.1]], 0.028, 4); m.tube([[0.36, 0, 0.12], [0.06, 1.75, -0.1]], 0.028, 4); m.tube([[0, 0, -0.62], [0, 1.72, -0.12]], 0.028, 4);
  m.box(0, 0.72, 0.06, 0.86, 0.05, 0.1, 63);
  m.push().T(0, 0.77, 0.03).RX(-0.14);
  m.c('#e9c95a'); m.box(0, -0.03, 0, 0.84, 0.7, 0.035, 63);
  const c = cols.map(hex);
  m.c(c[0], 0.25); m.box(0, 0, 0.02, 0.76, 0.64, 0.02, 16);
  m.c(c[1], 0.25); m.box(0, 0, 0.026, 0.76, 0.26, 0.02, 16);
  m.c(c[2], 0.3); m.box(0.16, 0.3, 0.03, 0.2, 0.2, 0.02, 16);
  if (c[3]) { m.c(c[3], 0.25); m.box(-0.2, 0.12, 0.032, 0.14, 0.36, 0.02, 16); }
  m.pop(); m.pop();
  addCircle(ctx, x, z, 0.4);
}
/* gilded frame you can walk through */
function frameGate(ctx, x, z, rot, id, o) {
  const m = ctx.m, y = (o && o.y !== undefined) ? o.y : ctx.H(x, z), W = 3.4, Hh = 3.9, T = 0.42, g = hex('#d9a93a'), g2 = hex('#f2cf62'), g3 = hex('#a87a26');
  m.push().T(x, y, z).RY(rot);
  m.c('#b9aeb8'); m.box(0, 0, 0.2, W + 2.2, 0.16, 2.6, 61); m.c('#cfc4c8'); m.box(0, 0.16, 0.1, W + 1.4, 0.16, 1.8, 61);
  const y0 = 0.32;
  m.c(g, 0.12);
  m.box(-(W / 2 + T / 2), y0, 0, T, Hh + T, 0.34, 63); m.box(W / 2 + T / 2, y0, 0, T, Hh + T, 0.34, 63); m.box(0, y0 + Hh, 0, W + T * 2, T, 0.34, 63); m.box(0, y0 - 0.02, 0, W + T * 2, 0.14, 0.34, 63);
  m.c(g2, 0.2);
  m.box(-(W / 2 + T / 2), y0, 0, T * 0.45, Hh + T, 0.44, 63); m.box(W / 2 + T / 2, y0, 0, T * 0.45, Hh + T, 0.44, 63); m.box(0, y0 + Hh + T * 0.28, 0, W + T * 2, T * 0.45, 0.44, 63);
  m.c(g3, 0.05);
  m.box(-(W / 2 + 0.04), y0, 0, 0.08, Hh, 0.4, 63); m.box(W / 2 + 0.04, y0, 0, 0.08, Hh, 0.4, 63); m.box(0, y0 + Hh - 0.04, 0, W, 0.08, 0.4, 63);
  m.c(g2, 0.25);
  for (const sx of [-1, 1]) for (const sy of [0, 1]) m.ell(sx * (W / 2 + T / 2), y0 + sy * (Hh + T / 2) + (sy ? 0 : 0.1), 0, 0.36, 0.36, 0.26, 8, 5);
  m.ell(0, y0 + Hh + T * 0.62, 0, 0.6, 0.3, 0.26, 8, 5);
  m.pop();
  const c = Math.cos(rot), s = Math.sin(rot), P = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  const a = P(-W / 2, y0 + 0.04, 0.02), b = P(W / 2, y0 + 0.04, 0.02), cc = P(W / 2, y0 + Hh - 0.04, 0.02), dd = P(-W / 2, y0 + Hh - 0.04, 0.02), asp = (Hh - 0.08) / W;
  ctx.pq.push(a[0], a[1], a[2], -1, -asp, b[0], b[1], b[2], 1, -asp, cc[0], cc[1], cc[2], 1, asp, dd[0], dd[1], dd[2], -1, asp);
  // back side
  const a2 = P(W / 2, y0 + 0.04, -0.02), b2 = P(-W / 2, y0 + 0.04, -0.02), c2 = P(-W / 2, y0 + Hh - 0.04, -0.02), d2 = P(W / 2, y0 + Hh - 0.04, -0.02);
  ctx.pq.push(a2[0], a2[1], a2[2], -1, -asp, b2[0], b2[1], b2[2], 1, -asp, c2[0], c2[1], c2[2], 1, asp, d2[0], d2[1], d2[2], -1, asp);
  const def = PORTALS[id];
  ctx.portals.push({ id, x, z, rot, w: W / 2, nx: s, nz: c, c: def.c.map(hex), pid: def.pid }, { id, x, z, rot, w: W / 2, nx: s, nz: c, c: def.c.map(hex), pid: def.pid, back: true });
  for (const sx of [-1, 1]) { const p = P(sx * (W / 2 + T / 2), 0, 0); addCircle(ctx, p[0], p[2], 0.42); }
  ctx.lamps.push({ x: x + s * 1.6, y: y + 2.2, z: z + c * 1.6, r: 7, col: mixc(hex(def.c[1]), [1, 0.9, 0.6], 0.5), k: 0.55 });
  ctx.lamps.push({ x: x - s * 1.6, y: y + 2.2, z: z - c * 1.6, r: 7, col: mixc(hex(def.c[1]), [1, 0.9, 0.6], 0.5), k: 0.55 });
}
const PORTALS = {
  town: { pid: 0, c: ['#1b2c7a', '#3f72c0', '#f3e27a', '#16302c'] },
  monet: { pid: 1, c: ['#5f9a7a', '#8fc0a2', '#2f6a55', '#f3c9d6'] },
  hokusai: { pid: 2, c: ['#1f3f78', '#3f6aa8', '#f1ead2', '#e9dfc2'] },
  munch: { pid: 3, c: ['#e8762a', '#f2c23a', '#33507a', '#4a3a36'] },
  seurat: { pid: 4, c: ['#7fae5a', '#5f8fc0', '#cfe0ea', '#d9643a'] },
  jiangshan: { pid: 5, c: ['#2f8a7a', '#2a5fa0', '#c9a45a', '#e6d7ae'] },
  museum: { pid: 6, c: ['#2a2a26', '#3f6fb5', '#b88c3c', '#e9dcc0'] },
  fog: { pid: 7, c: ['#aab6c6', '#eef0ee', '#22382e', '#5a6a80'] },
};

/* ---------- baking: lamp light and sun shadow per vertex ---------- */
function bake(ctx, pk, sun, ground) {
  const nv = pk.nv, P = pk.pos, N = pk.nrm, L = new Uint8Array(nv * 4), lamps = ctx.lamps;
  // lamp grid
  const cell = 16, grid = new Map(), key = (i, j) => (i + 512) * 1024 + (j + 512);
  for (const l of lamps) {
    const r = l.r, i0 = Math.floor((l.x - r) / cell), i1 = Math.floor((l.x + r) / cell), j0 = Math.floor((l.z - r) / cell), j1 = Math.floor((l.z + r) / cell);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = key(i, j); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(l); }
  }
  // occluder grid for shadows
  const oc = 10, og = new Map();
  if (sun) {
    const put = (x, z, r, o) => { const i0 = Math.floor((x - r) / oc), i1 = Math.floor((x + r) / oc), j0 = Math.floor((z - r) / oc), j1 = Math.floor((z + r) / oc); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = key(i, j); let a = og.get(k); if (!a) og.set(k, a = []); a.push(o); } };
    for (const b of ctx.occB) put(b.x, b.z, Math.hypot(b.hw, b.hd), b);
    for (const s of ctx.occS) put(s.x, s.z, s.r, s);
  }
  for (let v = 0; v < nv; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], nx = N[v * 4] / 127, ny = N[v * 4 + 1] / 127, nz = N[v * 4 + 2] / 127;
    const a = grid.get(key(Math.floor(x / cell), Math.floor(z / cell)));
    if (a) {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < a.length; i++) {
        const l = a[i], dx = l.x - x, dy = l.y - y, dz = l.z - z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > l.r * l.r) continue;
        const dd = Math.sqrt(d2) + 1e-4, at = 1 - dd / l.r, w = at * at * (0.42 + 0.58 * Math.max(0, (nx * dx + ny * dy + nz * dz) / dd)) * l.k;
        r += l.col[0] * w; g += l.col[1] * w; b += l.col[2] * w;
      }
      L[v * 4] = Math.min(255, r * 255); L[v * 4 + 1] = Math.min(255, g * 255); L[v * 4 + 2] = Math.min(255, b * 255);
    }
    if (sun && ny > 0.6 && v < ground) {
      let sh = 0;
      for (let st = 1; st <= 14 && sh < 1; st++) {
        const t = st * 1.15, sx = x + sun[0] * t, sy = y + sun[1] * t, sz = z + sun[2] * t;
        const o = og.get(key(Math.floor(sx / oc), Math.floor(sz / oc))); if (!o) continue;
        for (let i = 0; i < o.length; i++) {
          const q = o[i];
          if (q.hw !== undefined) { if (sy > q.h) continue; const ex = sx - q.x, ez = sz - q.z, lx = ex * q.c - ez * q.s, lz = ex * q.s + ez * q.c; if (Math.abs(lx) < q.hw && Math.abs(lz) < q.hd) { sh = 1; break; } }
          else { const ex = sx - q.x, ey = sy - q.y, ez = sz - q.z, d2 = ex * ex + ey * ey + ez * ez; if (d2 < q.r * q.r) { sh = Math.max(sh, 0.75 * (1 - Math.sqrt(d2) / q.r) + 0.3); } }
        }
      }
      L[v * 4 + 3] = Math.min(255, sh * 255);
    }
  }
  pk.lamp = L;
}
