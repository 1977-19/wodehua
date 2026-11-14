'use strict';
/* helpers shared by world builders: paths, paving, ground, water, finishing */
const bump = (x, z, cx, cz, r) => { const t = Math.max(0, 1 - ((x - cx) * (x - cx) + (z - cz) * (z - cz)) / (r * r)); return t * t; };

class Paths {
  constructor() { this.g = new Map(); this.cell = 6; }
  _k(i, j) { return (i + 512) * 1024 + (j + 512); }
  add(x, z, r) { const c = this.cell, i0 = Math.floor((x - r) / c), i1 = Math.floor((x + r) / c), j0 = Math.floor((z - r) / c), j1 = Math.floor((z + r) / c); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = this._k(i, j); let a = this.g.get(k); if (!a) this.g.set(k, a = []); a.push(x, z, r); } }
  on(x, z, pad) { const a = this.g.get(this._k(Math.floor(x / this.cell), Math.floor(z / this.cell))); if (!a) return false; pad = pad || 0; for (let i = 0; i < a.length; i += 3) { const dx = x - a[i], dz = z - a[i + 1], r = a[i + 2] + pad; if (dx * dx + dz * dz < r * r) return true; } return false; }
}
function smoothLine(pts, step) {
  const out = [], n = pts.length, P = i => pts[clamp(i, 0, n - 1)];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[n - 1].slice()); return out;
}
/* a painted path lying on the terrain */
function ribbon(ctx, pts, w, cols, o) {
  o = o || {}; const m = ctx.m, rng = ctx.rng, L = smoothLine(pts, o.step || 1.3), n = L.length, yo = o.y === undefined ? 0.06 : o.y, C = cols.map(hex);
  const base = m.nv;
  for (let i = 0; i < n; i++) {
    const a = L[Math.max(0, i - 1)], b = L[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const hw = w / 2 * (0.86 + rng() * 0.28) * (o.taper ? lerp(1, o.taper, i / (n - 1)) : 1), x = L[i][0], z = L[i][1];
    for (let k = -1; k <= 1; k++) {
      const px = x - tz * hw * k, pz = z + tx * hw * k;
      m.c(jit(k === 0 ? C[0] : C[1 % C.length], rng, 0.012, 0.04));
      m.v(px, ctx.H(px, pz) + yo + (k === 0 ? 0.02 : 0), pz, 0, 1, 0);
    }
    if (ctx.paths) ctx.paths.add(x, z, hw + 0.2);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < 2; k++) { const a = base + i * 3 + k; m.t(a, a + 1, a + 4); m.t(a, a + 4, a + 3); }
  return L;
}
/* cobbles: a fine grid of quads over a set of rectangles */
function pave(ctx, rects, cs, cols, o) {
  o = o || {}; const m = ctx.m, C = cols.map(hex), y = o.y === undefined ? 0.035 : o.y;
  const colAt = (x, z) => { const h = hash2(Math.round(x * 7.1), Math.round(z * 7.3)), h2 = hash2(Math.round(x * 3.3) + 91, Math.round(z * 3.7) + 17); const c = C[Math.floor(h * C.length) % C.length]; const k = 0.86 + h2 * 0.28; return [c[0] * k, c[1] * k, c[2] * k]; };
  for (const r of rects) {
    const nx = Math.max(1, Math.round((r[1] - r[0]) / cs)), nz = Math.max(1, Math.round((r[3] - r[2]) / cs)), base = m.nv;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = lerp(r[0], r[1], i / nx), z = lerp(r[2], r[3], j / nz); m.col = colAt(x, z);
      m.v(x, (o.H ? ctx.H(x, z) : 0) + y + (r[4] || 0), z, 0, 1, 0);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i; m.t(a, a + nx + 1, a + nx + 2); m.t(a, a + nx + 2, a + 1); }
    if (ctx.paved) ctx.paved.push(r);
  }
}
const inRects = (rs, x, z, pad) => { pad = pad || 0; for (const r of rs) if (x > r[0] - pad && x < r[1] + pad && z > r[2] - pad && z < r[3] + pad) return true; return false; };
/* terrain grid. colFn(x,z,h) -> rgb */
function ground(ctx, size, cs, colFn, o) {
  const m = ctx.m, n = Math.round(size * 2 / cs), base = m.nv, H = ctx.H, e = 0.6; o = o || {};
  const cx = o.cx || 0, cz = o.cz || 0;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = cx - size + i * cs, z = cz - size + j * cs, h = H(x, z);
    m.col = colFn(x, z, h);
    m.v(x, h, z, (H(x - e, z) - H(x + e, z)) / (2 * e), 1, (H(x, z - e) - H(x, z + e)) / (2 * e));
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i; m.t(a, a + n + 1, a + n + 2); m.t(a, a + n + 2, a + 1); }
}
/* ring of far hills */
function hills(ctx, r0, r1, hgt, cols, seed, o) {
  const m = ctx.m, n = 72, C = cols.map(hex), base = m.nv; o = o || {};
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU, k = i % n, hh = hgt * (0.35 + 0.9 * fbm(Math.cos(a) * 2.2 + seed, Math.sin(a) * 2.2 + seed * 1.7, 3)) * (o.mask ? o.mask(a) : 1);
    const ca = Math.cos(a), sa = Math.sin(a), wob = 1 + 0.06 * Math.sin(k * 1.7 + seed);
    m.col = jit(C[0], ctx.rng, 0.01, 0.03); m.v(ca * r0, (o.y0 || -2), sa * r0, -ca, 0.4, -sa);
    m.col = jit(mixc(C[0], C[1], 0.5), ctx.rng, 0.01, 0.03); m.v(ca * (r0 + r1) / 2 * wob, hh * 0.72, sa * (r0 + r1) / 2 * wob, -ca, 0.8, -sa);
    m.col = jit(C[1], ctx.rng, 0.01, 0.03); m.v(ca * r1, hh, sa * r1, -ca * 0.5, 1, -sa * 0.5);
    m.col = C[0]; m.v(ca * (r1 + 30), -4, sa * (r1 + 30), ca, 0.5, sa);
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const a = base + i * 4 + k; m.t(a, a + 5, a + 1); m.t(a, a + 4, a + 5); }
}
function waterRect(ctx, x0, x1, z0, z1, y, nx, nz, col, wave) {
  const w = ctx.w, base = w.nv; w.c(col || [0.5, 0.5, 0.5], wave || 0);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) w.v(lerp(x0, x1, i / nx), y, lerp(z0, z1, j / nz), 0, 1, 0);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i; w.t(a, a + nx + 1, a + nx + 2); w.t(a, a + nx + 2, a + 1); }
}
function waterDisc(ctx, x, z, r, y, col, rz) { const w = ctx.w; w.c(col || [0.5, 0.5, 0.5], 0); w.disc(x, y, z, r, 20, rz); }
/* scatter with rejection */
function scatter(ctx, n, x0, x1, z0, z1, ok, fn) {
  const rng = ctx.rng;
  for (let i = 0; i < n; i++) { const x = rng.r(x0, x1), z = rng.r(z0, z1); if (!ok || ok(x, z)) fn(x, z, i); }
}
function gridScatter(ctx, x0, x1, z0, z1, step, jitter, ok, fn) {
  const rng = ctx.rng; let i = 0;
  for (let z = z0; z <= z1; z += step) for (let x = x0; x <= x1; x += step) { const px = x + rng.s() * jitter, pz = z + rng.s() * jitter; if (!ok || ok(px, pz)) fn(px, pz, i++); }
}
/* upload everything and return the runtime world object */
function finishWorld(R, ctx, def) {
  const groundN = ctx.groundN || 0;
  const pk = ctx.m.pack(); bake(ctx, pk, def.shadowSun || null, groundN); chunkMesh(pk, def.cell || 36);
  const world = { id: def.id, solid: R.upload(pk), tris: pk.ni / 3 };
  if (ctx.d.nv) { const dk = ctx.d.pack(); bake(ctx, dk, null, 0); chunkMesh(dk, 14); world.detail = R.upload(dk); world.tris += dk.ni / 3; }
  if (ctx.w.nv) world.water = R.upload(ctx.w.pack());
  if (ctx.pq.length) world.portalMesh = R.uploadPortal(new Float32Array(ctx.pq));
  if (ctx.picq.length) { world.picMesh = R.uploadPics(new Float32Array(ctx.picq)); world.pics = ctx.pics; }
  Object.assign(world, { H: ctx.H, boxes: ctx.boxes, circles: ctx.circles, lamps: ctx.lamps, glows: ctx.glows, spots: ctx.spots, npcs: ctx.npcs, portals: ctx.portals, seats: ctx.seats, decks: ctx.decks || [], birds: ctx.birds, petals: ctx.petals,
    refl: ctx.lamps.filter(l => l.refl), bound: def.bound, spawn: def.spawn, env: def.env, defTod: def.defTod, detailDist: def.detailDist || 75, waterY: def.waterY === undefined ? -0.55 : def.waterY, extra: def.extra || {} });
  // collider grid
  const cell = 8, g = new Map(), key = (i, j) => (i + 512) * 1024 + (j + 512), put = (x, z, r, o) => { for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++) for (let j = Math.floor((z - r) / cell); j <= Math.floor((z + r) / cell); j++) { const k = key(i, j); let a = g.get(k); if (!a) g.set(k, a = []); a.push(o); } };
  for (const b of world.boxes) put(b.x, b.z, Math.hypot(b.hw, b.hd) + 0.6, b);
  for (const c of world.circles) put(c.x, c.z, c.r + 0.6, c);
  world.near = (x, z) => g.get(key(Math.floor(x / cell), Math.floor(z / cell)));
  const arches = ctx.arches || [];
  world.heightAt = (x, z) => {
    let h = ctx.H(x, z);
    for (const d of world.decks) if (x > d[0] && x < d[1] && z > d[2] && z < d[3]) h = Math.max(h, d[4]);
    for (const a of arches) { const ex = x - a.x, ez = z - a.z, c = Math.cos(a.rot), s = Math.sin(a.rot), lx = ex * c - ez * s, lz = ex * s + ez * c; if (Math.abs(lx) < a.len && Math.abs(lz) < a.w) h = Math.max(h, (a.y || 0) + 0.05 + Math.sin((lx / a.len * 0.5 + 0.5) * Math.PI) * a.h); }
    return h;
  };
  world.walkable = (x, z) => world.heightAt(x, z) > world.waterY + 0.22;
  world.dispose = () => { R.free(world.solid); R.free(world.detail); R.free(world.water); R.free(world.portalMesh); };
  return world;
}
const WORLDS = {};
