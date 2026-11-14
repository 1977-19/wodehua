'use strict';
/* Mesh builder: everything in a world is merged into a handful of big vertex buffers. */
class Mesh {
  constructor(cap) {
    this.cap = cap || 8192;
    this.P = new Float32Array(this.cap * 3);
    this.N = new Float32Array(this.cap * 3);
    this.C = new Float32Array(this.cap * 4);
    this.S = new Float32Array(this.cap);
    this.icap = this.cap * 3;
    this.I = new Uint32Array(this.icap);
    this.nv = 0; this.ni = 0;
    this.m = M4.create(); this.nm = new Float32Array(9); this.hasM = false; this.stack = [];
    this.col = [1, 1, 1]; this.a = 0; this.sw = 0;
    this.swk = 0; this.swy0 = 0;        // height based sway
    this.gk = 0; this.gy0 = 0; this.gcol = null; // vertical colour gradient
    this.ds = false;                     // double sided
    this.nup = 0;                        // bend normals upward (soft plant lighting)
    this.flip = false;
  }
  _growV() {
    const c = this.cap * 2, g = (A, n) => { const B = new Float32Array(c * n); B.set(A); return B; };
    this.P = g(this.P, 3); this.N = g(this.N, 3); this.C = g(this.C, 4); this.S = g(this.S, 1); this.cap = c;
  }
  _growI() { const B = new Uint32Array(this.icap * 2); B.set(this.I); this.I = B; this.icap *= 2; }
  /* transforms */
  _upd() {
    const m = this.m, n = this.nm;
    n[0] = m[5] * m[10] - m[6] * m[9]; n[1] = m[6] * m[8] - m[4] * m[10]; n[2] = m[4] * m[9] - m[5] * m[8];
    n[3] = m[9] * m[2] - m[10] * m[1]; n[4] = m[10] * m[0] - m[8] * m[2]; n[5] = m[8] * m[1] - m[9] * m[0];
    n[6] = m[1] * m[6] - m[2] * m[5]; n[7] = m[2] * m[4] - m[0] * m[6]; n[8] = m[0] * m[5] - m[1] * m[4];
    this.hasM = true; return this;
  }
  push() { this.stack.push(new Float32Array(this.m)); return this; }
  pop() { this.m.set(this.stack.pop()); return this._upd(); }
  reset() { M4.ident(this.m); this.hasM = false; return this; }
  T(x, y, z) { M4.translate(this.m, x, y, z); return this._upd(); }
  RX(a) { M4.rotX(this.m, a); return this._upd(); }
  RY(a) { M4.rotY(this.m, a); return this._upd(); }
  RZ(a) { M4.rotZ(this.m, a); return this._upd(); }
  SC(x, y, z) { M4.scale(this.m, x, y === undefined ? x : y, z === undefined ? x : z); return this._upd(); }
  /* state */
  c(col, a) { this.col = typeof col === 'string' ? hex(col) : col; if (a !== undefined) this.a = a; return this; }
  sway(y0, h, amt) { if (!h) { this.swk = 0; this.sw = y0 || 0; } else { this.swy0 = y0; this.swk = 1 / h; this.sw = amt === undefined ? 1 : amt; } return this; }
  grad(col, y0, h) { if (!col) { this.gk = 0; this.gcol = null; } else { this.gcol = typeof col === 'string' ? hex(col) : col; this.gy0 = y0; this.gk = 1 / h; } return this; }

  v(x, y, z, nx, ny, nz) {
    if (this.nv >= this.cap) this._growV();
    let px = x, py = y, pz = z;
    if (this.hasM) {
      const m = this.m, n = this.nm;
      px = m[0] * x + m[4] * y + m[8] * z + m[12];
      py = m[1] * x + m[5] * y + m[9] * z + m[13];
      pz = m[2] * x + m[6] * y + m[10] * z + m[14];
      const ax = n[0] * nx + n[3] * ny + n[6] * nz, ay = n[1] * nx + n[4] * ny + n[7] * nz, az = n[2] * nx + n[5] * ny + n[8] * nz;
      nx = ax; ny = ay; nz = az;
    }
    if (this.flip) { nx = -nx; ny = -ny; nz = -nz; }
    if (this.nup) { const q = Math.hypot(nx, ny, nz) || 1, k = this.nup; nx = nx / q * (1 - k); ny = ny / q * (1 - k) + k; nz = nz / q * (1 - k); }
    const l = Math.hypot(nx, ny, nz) || 1, i = this.nv, i3 = i * 3, i4 = i * 4;
    this.P[i3] = px; this.P[i3 + 1] = py; this.P[i3 + 2] = pz;
    this.N[i3] = nx / l; this.N[i3 + 1] = ny / l; this.N[i3 + 2] = nz / l;
    let r = this.col[0], g = this.col[1], b = this.col[2];
    if (this.gk) {
      const t = clamp((py - this.gy0) * this.gk, 0, 1), q = this.gcol;
      r = q[0] + (r - q[0]) * t; g = q[1] + (g - q[1]) * t; b = q[2] + (b - q[2]) * t;
    }
    this.C[i4] = r; this.C[i4 + 1] = g; this.C[i4 + 2] = b; this.C[i4 + 3] = this.a;
    this.S[i] = this.swk ? this.sw * Math.pow(clamp((py - this.swy0) * this.swk, 0, 1), 1.4) : this.sw;
    return this.nv++;
  }
  t(a, b, c) {
    if (this.ni + 3 > this.icap) this._growI();
    if (this.flip) { this.I[this.ni++] = a; this.I[this.ni++] = c; this.I[this.ni++] = b; }
    else { this.I[this.ni++] = a; this.I[this.ni++] = b; this.I[this.ni++] = c; }
  }
  /* flat triangle / quad, counter-clockwise seen from the front */
  tri(a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const i = this.v(a[0], a[1], a[2], nx, ny, nz); this.v(b[0], b[1], b[2], nx, ny, nz); this.v(c[0], c[1], c[2], nx, ny, nz);
    this.t(i, i + 1, i + 2);
    if (this.ds) { const j = this.v(a[0], a[1], a[2], -nx, -ny, -nz); this.v(b[0], b[1], b[2], -nx, -ny, -nz); this.v(c[0], c[1], c[2], -nx, -ny, -nz); this.t(j, j + 2, j + 1); }
    return this;
  }
  quad(a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx === 0 && ny === 0 && nz === 0) { const wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2]; nx = uy * wz - uz * wy; ny = uz * wx - ux * wz; nz = ux * wy - uy * wx; }
    const i = this.v(a[0], a[1], a[2], nx, ny, nz); this.v(b[0], b[1], b[2], nx, ny, nz); this.v(c[0], c[1], c[2], nx, ny, nz); this.v(d[0], d[1], d[2], nx, ny, nz);
    this.t(i, i + 1, i + 2); this.t(i, i + 2, i + 3);
    if (this.ds) { const j = this.v(a[0], a[1], a[2], -nx, -ny, -nz); this.v(b[0], b[1], b[2], -nx, -ny, -nz); this.v(c[0], c[1], c[2], -nx, -ny, -nz); this.v(d[0], d[1], d[2], -nx, -ny, -nz); this.t(j, j + 2, j + 1); this.t(j, j + 3, j + 2); }
    return this;
  }
  /* box with centre x,z and base y0. mask bits: 1 top 2 bottom 4 +x 8 -x 16 +z 32 -z */
  box(x, y0, z, sx, sy, sz, mask) {
    if (mask === undefined) mask = 61;
    const x0 = x - sx / 2, x1 = x + sx / 2, y1 = y0 + sy, z0 = z - sz / 2, z1 = z + sz / 2;
    if (mask & 1) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (mask & 2) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (mask & 4) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    if (mask & 8) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    if (mask & 16) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    if (mask & 32) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    return this;
  }
  /* tapered cylinder along y. cap bits: 1 top 2 bottom */
  cyl(x, y0, z, r0, r1, h, seg, cap) {
    seg = seg || 8; if (cap === undefined) cap = 1;
    const base = this.nv, sl = (r0 - r1) / h;
    for (let i = 0; i <= seg; i++) {
      const a = i / seg * TAU, cx = Math.cos(a), sz = Math.sin(a);
      this.v(x + cx * r0, y0, z + sz * r0, cx, sl, sz);
      this.v(x + cx * r1, y0 + h, z + sz * r1, cx, sl, sz);
    }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; this.t(a, a + 1, a + 3); this.t(a, a + 3, a + 2); }
    if ((cap & 1) && r1 > 0) { const c = this.v(x, y0 + h, z, 0, 1, 0), b = this.nv; for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; this.v(x + Math.cos(a) * r1, y0 + h, z + Math.sin(a) * r1, 0, 1, 0); } for (let i = 0; i < seg; i++) this.t(c, b + i + 1, b + i); }
    if ((cap & 2) && r0 > 0) { const c = this.v(x, y0, z, 0, -1, 0), b = this.nv; for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; this.v(x + Math.cos(a) * r0, y0, z + Math.sin(a) * r0, 0, -1, 0); } for (let i = 0; i < seg; i++) this.t(c, b + i, b + i + 1); }
    return this;
  }
  /* ellipsoid */
  ell(x, y, z, rx, ry, rz, su, sv, vmin, vmax) {
    su = su || 10; sv = sv || 7; if (rz === undefined) rz = rx;
    const base = this.nv, t0 = vmin === undefined ? 0 : vmin, t1 = vmax === undefined ? 1 : vmax;
    for (let j = 0; j <= sv; j++) {
      const ph = lerp(t0, t1, j / sv) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
      for (let i = 0; i <= su; i++) {
        const th = i / su * TAU, cx = Math.cos(th) * sp, cz = Math.sin(th) * sp;
        this.v(x + cx * rx, y + cp * ry, z + cz * rz, cx / rx, cp / ry, cz / rz);
      }
    }
    const w = su + 1;
    for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) { const a = base + j * w + i; this.t(a, a + 1, a + w + 1); this.t(a, a + w + 1, a + w); }
    return this;
  }
  /* surface of revolution: prof = [[r,y],...] from bottom to top. kz squashes depth */
  lathe(x, y0, z, prof, seg, kz, kx) {
    seg = seg || 10; kz = kz || 1; kx = kx || 1;
    const base = this.nv, n = prof.length;
    for (let j = 0; j < n; j++) {
      const a = prof[Math.max(0, j - 1)], b = prof[Math.min(n - 1, j + 1)];
      let dr = b[0] - a[0], dy = b[1] - a[1]; const dl = Math.hypot(dr, dy) || 1; dr /= dl; dy /= dl;
      const r = prof[j][0], y = prof[j][1];
      for (let i = 0; i <= seg; i++) {
        const th = i / seg * TAU, cx = Math.cos(th), cz = Math.sin(th);
        this.v(x + cx * r * kx, y0 + y, z + cz * r * kz, cx * dy / kx, -dr, cz * dy / kz);
      }
    }
    const w = seg + 1;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = base + j * w + i; this.t(a, a + w, a + w + 1); this.t(a, a + w + 1, a + 1); }
    return this;
  }
  /* tube along a polyline with per-point radius */
  tube(pts, rad, seg, capEnd) {
    seg = seg || 6;
    const n = pts.length, base = this.nv;
    let ux = 0, uy = 0, uz = 1;
    for (let j = 0; j < n; j++) {
      const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // orthonormal frame
      let d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz;
      let ul = Math.hypot(ux, uy, uz);
      if (ul < 1e-4) { ux = 1; uy = 0; uz = 0; d = tx; ux -= d * tx; uy -= d * ty; uz -= d * tz; ul = Math.hypot(ux, uy, uz); }
      ux /= ul; uy /= ul; uz /= ul;
      const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
      const r = typeof rad === 'number' ? rad : rad[j];
      for (let i = 0; i <= seg; i++) {
        const th = i / seg * TAU, c = Math.cos(th), s = Math.sin(th);
        const nx = ux * c + vx * s, ny = uy * c + vy * s, nz = uz * c + vz * s;
        this.v(pts[j][0] + nx * r, pts[j][1] + ny * r, pts[j][2] + nz * r, nx, ny, nz);
      }
    }
    const w = seg + 1;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = base + j * w + i; this.t(a, a + w + 1, a + w); this.t(a, a + 1, a + w + 1); }
    if (capEnd) { const p = pts[n - 1], q = pts[n - 2], c = this.v(p[0], p[1], p[2], p[0] - q[0], p[1] - q[1], p[2] - q[2]), b = base + (n - 1) * w; for (let i = 0; i < seg; i++) this.t(c, b + i, b + i + 1); }
    return this;
  }
  disc(x, y, z, r, seg, rz) {
    seg = seg || 12; rz = rz || r;
    const c = this.v(x, y, z, 0, 1, 0), b = this.nv;
    for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; this.v(x + Math.cos(a) * r, y, z + Math.sin(a) * rz, 0, 1, 0); }
    for (let i = 0; i < seg; i++) this.t(c, b + i + 1, b + i);
    return this;
  }
  /* gabled roof. ridge runs along x when alongX */
  gable(x, y0, z, sx, sz, h, alongX, gcol) {
    const x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y0 + h;
    if (alongX) {
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z], [x0, y1, z]);
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z], [x1, y1, z]);
      if (gcol) { const k = this.col; this.c(gcol); this.tri([x1, y0, z1], [x1, y0, z0], [x1, y1, z]); this.tri([x0, y0, z0], [x0, y0, z1], [x0, y1, z]); this.col = k; }
    } else {
      this.quad([x1, y0, z1], [x1, y0, z0], [x, y1, z0], [x, y1, z1]);
      this.quad([x0, y0, z0], [x0, y0, z1], [x, y1, z1], [x, y1, z0]);
      if (gcol) { const k = this.col; this.c(gcol); this.tri([x0, y0, z1], [x1, y0, z1], [x, y1, z1]); this.tri([x1, y0, z0], [x0, y0, z0], [x, y1, z0]); this.col = k; }
    }
    return this;
  }
  /* hipped (pyramid-ish) roof with ridge length */
  hip(x, y0, z, sx, sz, h, ridge) {
    const x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y0 + h, r = (ridge || 0) / 2;
    if (sx >= sz) {
      this.quad([x0, y0, z1], [x1, y0, z1], [x + r, y1, z], [x - r, y1, z]);
      this.quad([x1, y0, z0], [x0, y0, z0], [x - r, y1, z], [x + r, y1, z]);
      this.tri([x1, y0, z1], [x1, y0, z0], [x + r, y1, z]); this.tri([x0, y0, z0], [x0, y0, z1], [x - r, y1, z]);
    } else {
      this.quad([x1, y0, z1], [x1, y0, z0], [x, y1, z - r], [x, y1, z + r]);
      this.quad([x0, y0, z0], [x0, y0, z1], [x, y1, z + r], [x, y1, z - r]);
      this.tri([x0, y0, z1], [x1, y0, z1], [x, y1, z + r]); this.tri([x1, y0, z0], [x0, y0, z0], [x, y1, z - r]);
    }
    return this;
  }
  /* pack to GPU-ready typed arrays */
  pack() {
    const nv = this.nv, pos = this.P.slice(0, nv * 3), nrm = new Int8Array(nv * 4), col = new Uint8Array(nv * 4);
    for (let i = 0; i < nv; i++) {
      nrm[i * 4] = Math.round(this.N[i * 3] * 127); nrm[i * 4 + 1] = Math.round(this.N[i * 3 + 1] * 127); nrm[i * 4 + 2] = Math.round(this.N[i * 3 + 2] * 127);
      nrm[i * 4 + 3] = Math.round(clamp(this.S[i], 0, 1) * 127);
      col[i * 4] = clamp(this.C[i * 4], 0, 1) * 255; col[i * 4 + 1] = clamp(this.C[i * 4 + 1], 0, 1) * 255;
      col[i * 4 + 2] = clamp(this.C[i * 4 + 2], 0, 1) * 255; col[i * 4 + 3] = clamp(this.C[i * 4 + 3], 0, 1) * 255;
    }
    return { nv, ni: this.ni, pos, nrm, col, idx: this.I.slice(0, this.ni), bone: this.S.slice(0, nv) };
  }
}

/* sort triangles into square cells so the renderer can cull whole blocks */
function chunkMesh(pk, cell) {
  const nt = pk.ni / 3, keys = new Int32Array(nt), P = pk.pos, I = pk.idx, map = new Map();
  for (let t = 0; t < nt; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const cx = Math.floor((P[a] + P[b] + P[c]) / 3 / cell), cz = Math.floor((P[a + 2] + P[b + 2] + P[c + 2]) / 3 / cell);
    const k = (cx + 512) * 1024 + (cz + 512); keys[t] = k;
    let e = map.get(k); if (!e) { e = { n: 0, k }; map.set(k, e); } e.n++;
  }
  const chunks = [...map.values()]; let off = 0;
  for (const c of chunks) { c.start = off; c.fill = off; off += c.n * 3; c.minx = c.miny = c.minz = 1e9; c.maxx = c.maxy = c.maxz = -1e9; }
  const out = new Uint32Array(pk.ni);
  for (let t = 0; t < nt; t++) {
    const c = map.get(keys[t]);
    for (let j = 0; j < 3; j++) {
      const vi = I[t * 3 + j]; out[c.fill++] = vi;
      const x = P[vi * 3], y = P[vi * 3 + 1], z = P[vi * 3 + 2];
      if (x < c.minx) c.minx = x; if (x > c.maxx) c.maxx = x; if (y < c.miny) c.miny = y; if (y > c.maxy) c.maxy = y; if (z < c.minz) c.minz = z; if (z > c.maxz) c.maxz = z;
    }
  }
  pk.idx = out;
  pk.chunks = chunks.map(c => ({
    start: c.start, count: c.n * 3,
    cx: (c.minx + c.maxx) / 2, cy: (c.miny + c.maxy) / 2, cz: (c.minz + c.maxz) / 2,
    r: Math.hypot(c.maxx - c.minx, c.maxy - c.miny, c.maxz - c.minz) / 2,
  }));
  return pk;
}
