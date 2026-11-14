'use strict';
/* Light and sky palettes. Each world gives three keyframes: day, dusk, night. */
const nrm3 = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
function mixEnv(a, b, t) {
  const o = {};
  for (const k in a) {
    const x = a[k], y = b[k];
    if (typeof x === 'number') o[k] = x + (y - x) * t;
    else if (Array.isArray(x)) o[k] = [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
    else if (typeof x === 'object' && x) o[k] = mixEnv(x, y, t);
    else o[k] = t < 0.5 ? x : y;
  }
  return o;
}
function envAt(keys, tod) { // tod 0 day .. 1 dusk .. 2 night
  const e = tod <= 1 ? mixEnv(keys[0], keys[1], sstep(0, 1, tod)) : mixEnv(keys[1], keys[2], sstep(1, 2, tod));
  e.sunDir = nrm3(e.sunDir); return e;
}
const H3 = hex;
const ENV_BASE = {
  stroke: 'oil', strokeScale: 0.36, strokeAmt: 0.95, wind: 1, tint: [0.20, 0.05, -0.18],
  glowCol: [1.0, 0.80, 0.36], reflCol: [1.0, 0.80, 0.36], reflAmt: 1, glitter: 0, glitCol: [1, 1, 1],
  nightA: [0.07, 0.11, 0.36], nightB: [0.22, 0.36, 0.78], nightMix: 0,
};
const TOWN_ENV = [
  Object.assign({}, ENV_BASE, { // day — the wheat-field skies of 1889
    sunDir: [-0.42, 0.74, 0.50], light: [1.16, 1.08, 0.86], shade: [0.50, 0.57, 0.86], fog: H3('#b9d6d6'), fogD: 0.0042,
    lampAmt: 0, glow: 0.0, shadowAmt: 0.42, nightMix: 0, glitter: 0.35, glitCol: [0.9, 0.95, 0.8],
    waterA: H3('#3f7fae'), waterB: H3('#7fc0cf'), waterC: H3('#e6f2d8'),
    sky: { A: H3('#3d84c8'), B: H3('#7cc2de'), C: H3('#a9dcd2'), accent: H3('#f6f3d6'), horizon: H3('#cfe6d6'), cloudCol: H3('#f8f5e6'), sunCol: H3('#fff4a2'), haloCol: H3('#ffe98c'),
      swirl: 0.85, wave: 0.0, band: 0.0, flow: 0.010, stars: 0, crescent: 0, cloud: 0.9, sunSize: 0.062, sunAmt: 1 },
  }),
  Object.assign({}, ENV_BASE, { // dusk — the sower's yellow sun
    sunDir: [-0.82, 0.31, -0.49], light: [1.20, 0.90, 0.56], shade: [0.46, 0.40, 0.72], fog: H3('#e9b96a'), fogD: 0.0048,
    lampAmt: 0.5, glow: 0.7, shadowAmt: 0.3, nightMix: 0.12, nightA: [0.20, 0.14, 0.42], nightB: [0.60, 0.42, 0.50], glitter: 0.9, glitCol: [1.0, 0.85, 0.4],
    waterA: H3('#4a5f9a'), waterB: H3('#e9a94a'), waterC: H3('#ffe48a'),
    sky: { A: H3('#f0a83a'), B: H3('#f8d75e'), C: H3('#a8c98a'), accent: H3('#fff3b8'), horizon: H3('#f08c3c'), cloudCol: H3('#f6b79a'), sunCol: H3('#fff27e'), haloCol: H3('#ffd65c'),
      swirl: 0.7, wave: 0.0, band: 0.0, flow: 0.008, stars: 0, crescent: 0, cloud: 0.35, sunSize: 0.15, sunAmt: 1 },
  }),
  Object.assign({}, ENV_BASE, { // night — june 1889
    sunDir: [0.50, 0.50, -0.70], light: [0.62, 0.72, 1.0], shade: [0.22, 0.27, 0.60], fog: H3('#2c4a92'), fogD: 0.0056,
    lampAmt: 1, glow: 1.35, shadowAmt: 0.0, nightMix: 0.72, glitter: 0.5, glitCol: [0.95, 0.85, 0.5],
    waterA: H3('#16286e'), waterB: H3('#2f5aa8'), waterC: H3('#6fa2d2'),
    sky: { A: H3('#14246c'), B: H3('#2f62b6'), C: H3('#5c9fd2'), accent: H3('#e6ecc0'), horizon: H3('#7fa6d0'), cloudCol: H3('#8fb3d8'), sunCol: H3('#f8b83c'), haloCol: H3('#f3e37c'),
      swirl: 1.0, wave: 0.0, band: 0.0, flow: 0.013, stars: 1, crescent: 1, cloud: 0.0, sunSize: 0.07, sunAmt: 1 },
  }),
];
/* make a night keyframe out of a day one for worlds that are mostly about daylight */
function nightOf(day, o) {
  const e = JSON.parse(JSON.stringify(day)); o = o || {};
  e.light = [0.60, 0.70, 0.98]; e.shade = [0.22, 0.27, 0.58]; e.fog = o.fog || mixc(day.fog, H3('#1c2f6e'), 0.82);
  e.lampAmt = 1; e.glow = 1.3; e.shadowAmt = 0; e.nightMix = o.mix === undefined ? 0.66 : o.mix; e.glitter = 0.5; e.glitCol = [0.9, 0.85, 0.55];
  e.sunDir = o.sunDir || [0.45, 0.55, -0.7];
  e.waterA = mixc(day.waterA, H3('#101c56'), 0.8); e.waterB = mixc(day.waterB, H3('#2a4f9a'), 0.75); e.waterC = mixc(day.waterC, H3('#6f9fd0'), 0.6);
  const s = e.sky, k = day.sky;
  s.A = mixc(k.A, H3('#101f60'), 0.85); s.B = mixc(k.B, H3('#2a56a8'), 0.8); s.C = mixc(k.C, H3('#4f8fc8'), 0.7); s.horizon = mixc(k.horizon, H3('#5f86c0'), 0.75);
  s.cloudCol = mixc(k.cloudCol, H3('#6f8fc8'), 0.7); s.cloud = k.cloud * 0.5; s.stars = o.stars === undefined ? 1 : o.stars; s.crescent = 1; s.sunCol = H3('#f6c860'); s.haloCol = H3('#efe08a'); s.sunSize = 0.07; s.sunAmt = 1;
  Object.assign(s, o.sky || {});
  return e;
}
function duskOf(day, night, o) {
  const e = mixEnv(day, night, 0.35); o = o || {};
  e.light = [1.18, 0.88, 0.58]; e.shade = [0.46, 0.40, 0.70]; e.fog = o.fog || H3('#e6b674'); e.lampAmt = 0.5; e.glow = 0.7; e.shadowAmt = 0.25; e.nightMix = 0.12;
  e.nightA = [0.20, 0.14, 0.42]; e.nightB = [0.60, 0.42, 0.50];
  e.sunDir = o.sunDir || [-0.82, 0.31, -0.49]; e.glitter = 0.8; e.glitCol = [1, 0.85, 0.45];
  e.waterA = mixc(day.waterA, H3('#4a5a96'), 0.6); e.waterB = H3('#e6a850'); e.waterC = H3('#ffe08a');
  const s = e.sky; s.A = H3('#ee9f3c'); s.B = H3('#f6d062'); s.C = H3('#b6c48c'); s.horizon = H3('#ee8a40'); s.cloudCol = H3('#f4b49a'); s.sunCol = H3('#fff07c'); s.haloCol = H3('#ffd45c');
  s.stars = 0; s.crescent = 0; s.sunSize = 0.14; s.sunAmt = 1; s.cloud = day.sky.cloud * 0.5;
  Object.assign(s, o.sky || {});
  return e;
}
