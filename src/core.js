'use strict';
/* 画中漫步 — core math & helpers */
const TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function RNG(seed) {
  let a = seed | 0;
  const f = function () {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  f.r = (lo, hi) => lo + (hi - lo) * f();
  f.i = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.s = () => f() * 2 - 1;
  return f;
}

/* value noise */
function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < (oct || 3); i++) { s += a * vnoise(x, y); n += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return s / n;
}

/* colours: plain display-space rgb triples in 0..1 */
function hex(h) {
  if (typeof h !== 'string') return h;
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
function rgb2hsl(c) {
  const r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2, d = mx - mn;
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const f = n => { const k = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)];
}
/* painterly jitter: nudges hue, saturation and lightness */
function jit(c, rng, dh, dl, ds) {
  const q = rgb2hsl(c);
  return hsl2rgb(q[0] + rng.s() * (dh || 0.02), clamp(q[1] + rng.s() * (ds || 0.06), 0, 1), clamp(q[2] + rng.s() * (dl || 0.05), 0, 1));
}

/* mat4 — column major */
const M4 = {
  create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(o) { o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  copy(o, a) { o.set(a); return o; },
  mul(o, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
      o[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      o[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      o[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      o[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }
    return o;
  },
  persp(o, fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2); o.fill(0);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
  },
  /* view matrix from eye + orthonormal basis (r,u,b) where b points backwards */
  view(o, e, r, u, b) {
    o[0] = r[0]; o[4] = r[1]; o[8] = r[2]; o[12] = -(r[0] * e[0] + r[1] * e[1] + r[2] * e[2]);
    o[1] = u[0]; o[5] = u[1]; o[9] = u[2]; o[13] = -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]);
    o[2] = b[0]; o[6] = b[1]; o[10] = b[2]; o[14] = -(b[0] * e[0] + b[1] * e[1] + b[2] * e[2]);
    o[3] = 0; o[7] = 0; o[11] = 0; o[15] = 1; return o;
  },
  trans(o, x, y, z) { M4.ident(o); o[12] = x; o[13] = y; o[14] = z; return o; },
  /* post-multiply helpers: o = o * T */
  translate(o, x, y, z) {
    o[12] += o[0] * x + o[4] * y + o[8] * z; o[13] += o[1] * x + o[5] * y + o[9] * z;
    o[14] += o[2] * x + o[6] * y + o[10] * z; o[15] += o[3] * x + o[7] * y + o[11] * z; return o;
  },
  scale(o, x, y, z) {
    for (let i = 0; i < 4; i++) { o[i] *= x; o[4 + i] *= y; o[8 + i] *= z; } return o;
  },
  rotX(o, a) {
    const s = Math.sin(a), c = Math.cos(a);
    for (let i = 0; i < 4; i++) { const y = o[4 + i], z = o[8 + i]; o[4 + i] = y * c + z * s; o[8 + i] = z * c - y * s; } return o;
  },
  rotY(o, a) {
    const s = Math.sin(a), c = Math.cos(a);
    for (let i = 0; i < 4; i++) { const x = o[i], z = o[8 + i]; o[i] = x * c - z * s; o[8 + i] = x * s + z * c; } return o;
  },
  rotZ(o, a) {
    const s = Math.sin(a), c = Math.cos(a);
    for (let i = 0; i < 4; i++) { const x = o[i], y = o[4 + i]; o[i] = x * c + y * s; o[4 + i] = y * c - x * s; } return o;
  },
};
