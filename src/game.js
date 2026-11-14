'use strict';
/* 画中漫步 — game loop, input, camera, people, travel between paintings */
const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('hzmb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hzmb.' + k, JSON.stringify(v)); } catch (e) { } } };
const G = {
  R: null, worlds: {}, world: null, wid: 'town', actors: [], player: null, companion: null,
  tod: 2, todT: 2, env: null, envTod: -1, time: 0,
  cam: { yaw: 0, pitch: 0.12, dist: 5.4, pos: new Float32Array(3), fwd: new Float32Array(3), skyR: new Float32Array(3), skyU: new Float32Array(3), vp: M4.create(), view: M4.create(), proj: M4.create(), tx: 0, ty: 0, tz: 0, lastDrag: -9, eye: [0, 2, 5], look: [0, 2, 0], r: [1, 0, 0], u: [0, 1, 0] },
  inp: { jx: 0, jy: 0, keys: {}, stick: null, looks: new Map() },
  mode: 'title', found: new Set(), met: new Set(),
  set: { quality: 'auto', fps: false, stroke: 1, music: true, cycle: false, trail: true, sens: 1 },
  scale: 1, hz: 60, dabs: [], dabT: 0, fire: [], view: null, seat: null, busy: false,
  run: false, riding: false, bike: { has: false, x: 0, y: 0, z: 0, rot: 0, steer: 0, spin: 0, crank: 0, lean: 0, v: 0, bones: new Float32Array(NB * 16), lamp: new Float32Array(3) },
  stars: 0, letters: null, scores: {}, flags: {}, rf: new Float32Array(32), rfT: 0, cap: null, rec: null,
};

/* ---------- native shell (the iOS app) ---------- */
const Native = {
  on: !!window.__native, cbs: {},
  post(cmd, data, cb) { try { if (cb) this.cbs[cmd] = cb; window.webkit.messageHandlers.native.postMessage(Object.assign({ cmd }, data || {})); return true; } catch (e) { return false; } },
  done(what, ok, msg) { const cb = this.cbs[what]; if (cb) { this.cbs[what] = null; cb(ok, msg); } },
};
window.Native = Native;

/* ---------- originals from Wikipedia (works in the app; a sandboxed web page may block it) ---------- */
const Wiki = {
  cache: {},
  async find(art) {
    if (this.cache[art]) return this.cache[art];
    const a = ART[art], t = a.w || a.t; let j = null;
    try { const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(t.replace(/ /g, '_')) + '?redirect=true'); if (r.ok) j = await r.json(); } catch (e) { }
    let thumb = j && j.thumbnail && j.thumbnail.source, page = j && j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page;
    if (!thumb) {
      const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1&prop=pageimages|info&inprop=url&pithumbsize=500&format=json&origin=*&gsrsearch=' + encodeURIComponent(a.q || t));
      const q = await r.json(), pg = q.query && Object.values(q.query.pages)[0];
      thumb = pg && pg.thumbnail && pg.thumbnail.source; page = pg && pg.fullurl;
    }
    if (!thumb) throw new Error('no image');
    const sized = n => /\/\d+px-/.test(thumb) ? thumb.replace(/\/\d+px-/, '/' + n + 'px-') : thumb;
    return (this.cache[art] = { small: sized(500), large: sized(960), thumb, page });
  },
  image(url, alt) { return new Promise((ok, no) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => { if (alt && alt !== url) { const i2 = new Image(); i2.crossOrigin = 'anonymous'; i2.onload = () => ok(i2); i2.onerror = no; i2.src = alt; } else no(new Error('img')); }; im.src = url; }); },
};
async function loadPics(w) {
  if (!w.pics || w.picsLoading) return; w.picsLoading = true;
  for (const p of w.pics) {
    if (p.tex) continue;
    try { const u = await Wiki.find(p.art), im = await Wiki.image(u.small, u.thumb); if (G.worlds[w.id] === w) p.tex = G.R.picTexture(im); } catch (e) { w.picsFail = true; }
  }
}

/* ---------- world management ---------- */
function loadWorld(id) { if (!G.worlds[id]) G.worlds[id] = WORLDS[id](G.R); return G.worlds[id]; }
const MODELS = {};
function model(name) {
  if (!MODELS[name]) {
    const pk = name === 'bike' ? buildBike('#c2452f') : name === 'bikeGold' ? buildBike('#e2b23c') : buildChar(CAST[name]);
    const u = G.R.upload(pk, 'char'); u.sx = pk.sx; u.hasProp = pk.hasProp; MODELS[name] = u;
  }
  return MODELS[name];
}
function placeNPC(a, w) { const n = a.def; a.y = n.sit !== undefined ? n.sit - 0.01 : (n.y !== undefined ? n.y : w.heightAt(a.x, a.z)); }
function enterWorld(id, from) {
  const w = loadWorld(id), prev = G.wid; G.world = w; G.wid = id;
  G.actors = [];
  for (const n of w.npcs) {
    const a = new Actor(model(n.cast), { x: n.x, z: n.z, rot: n.rot || 0, pose: n.pose, scale: n.scale || 1, outline: n.statue ? 0.014 : undefined, extra: { def: n, who: n.who, mode: n.mode || 'stand', rad: n.rad || 0, path: n.path, pi: 0, spd: n.speed || 1, yoff: n.y, propUp: n.propUp, propBend: n.propBend, propTilt: n.propTilt } });
    placeNPC(a, w); G.actors.push(a);
  }
  const p = G.player; let sp = w.spawn;
  if (from) { const g = w.portals.find(q => q.id === from && !q.back); if (g) sp = { x: g.x + g.nx * 3.4, z: g.z + g.nz * 3.4, rot: Math.atan2(g.nx, g.nz) }; }
  p.x = sp.x; p.z = sp.z; p.rot = sp.rot; p.y = w.heightAt(p.x, p.z); p.speed = 0; p.vx = p.vz = 0;
  G.cam.yaw = Math.PI - p.rot + (sp.cam || 0); G.cam.pitch = 0.1; G.cam.tx = p.x; G.cam.tz = p.z; G.cam.ty = p.y; G.cam.cd = undefined; G.px = p.x; G.pz = p.z;
  const b = G.bike; b.v = 0; if (G.riding) { b.has = true; b.x = p.x; b.z = p.z; b.rot = p.rot; } else b.has = false;
  if (G.companion) { const c = G.companion; c.x = p.x - Math.sin(p.rot) * 1.2 + 0.8; c.z = p.z - Math.cos(p.rot) * 1.2; c.y = w.heightAt(c.x, c.z); G.actors.push(c); }
  if (prev !== id || !G.env) { G.tod = G.todT = w.defTod; }
  G.envTod = -1; G.dabs.length = 0; G.seat = null; G.view = null; UI.caption(null);
  Play.reset(); UI.loc(); Music.setWorld(id); loadPics(w);
}
function travel(id, from) {
  if (G.busy) return; G.busy = true;
  const info = WORLD_INFO[id], art = ART[info.art];
  UI.fade(true, info.n, '《' + art.t + '》 ' + art.a + ' · ' + art.y);
  setTimeout(() => {
    enterWorld(id, from);
    requestAnimationFrame(() => requestAnimationFrame(() => { setTimeout(() => { UI.fade(false); G.busy = false; G.mode = 'play'; UI.hud(true); }, 900); }));
  }, 620);
}

/* ---------- movement ---------- */
const _col = [0, 0];
function collide(w, x, z, r) {
  for (let it = 0; it < 2; it++) {
    const a = w.near(x, z); if (!a) break;
    for (let i = 0; i < a.length; i++) {
      const o = a[i];
      if (o.hw !== undefined) {
        const ex = x - o.x, ez = z - o.z, lx = ex * o.c - ez * o.s, lz = ex * o.s + ez * o.c, dx = Math.abs(lx) - o.hw, dz = Math.abs(lz) - o.hd;
        if (dx < r && dz < r) { let nx = lx, nz = lz; if (dx > dz) nx = (lx < 0 ? -1 : 1) * (o.hw + r); else nz = (lz < 0 ? -1 : 1) * (o.hd + r); x = o.x + nx * o.c + nz * o.s; z = o.z - nx * o.s + nz * o.c; }
      } else { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), mm = o.r + r; if (d < mm && d > 1e-5) { x = o.x + dx / d * mm; z = o.z + dz / d * mm; } }
    }
  }
  _col[0] = x; _col[1] = z; return _col;
}
/* no invisible walls: only solid things stop you. water is waded through. the far rim of each world is its only edge */
function groundY(w, x, z, a) { let gy = w.heightAt(x, z); const fl = w.waterY - 0.92; if (a) a.wade = gy < w.waterY - 0.12; if (gy < fl) gy = fl; return gy; }
function stepActor(a, vx, vz, dt, r) {
  const w = G.world; let nx = a.x + vx * dt, nz = a.z + vz * dt;
  const c = collide(w, nx, nz, r); nx = c[0]; nz = c[1];
  const b = w.bound;
  if (b.r) { const d = Math.hypot(nx - (b.x || 0), nz - (b.z || 0)); if (d > b.r) { nx = (b.x || 0) + (nx - (b.x || 0)) / d * b.r; nz = (b.z || 0) + (nz - (b.z || 0)) / d * b.r; } }
  else { nx = clamp(nx, b.x0, b.x1); nz = clamp(nz, b.z0, b.z1); }
  const moved = Math.hypot(nx - a.x, nz - a.z); a.x = nx; a.z = nz;
  a.y += (groundY(w, nx, nz, a) - a.y) * Math.min(1, dt * 14);
  return moved;
}
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function setRide(on) {
  const p = G.player, b = G.bike;
  if (on === G.riding) return;
  if (on) { if (G.seat) standUp(); b.has = true; b.x = p.x; b.z = p.z; b.rot = p.rot; b.v = Math.min(p.speed, 3); G.riding = true; p.pose = 'ride'; p.zoff = -0.27; }
  else { G.riding = false; p.pose = 'idle'; p.zoff = 0; p.roll = 0; p.steer = 0; b.v = 0; b.lean = 0.09; const c = collide(G.world, p.x + Math.cos(p.rot) * 0.6, p.z - Math.sin(p.rot) * 0.6, 0.34); p.x = c[0]; p.z = c[1]; G.px = p.x; G.pz = p.z; }
  UI.modes();
}
function updatePlayer(dt) {
  const p = G.player, I = G.inp, c = G.cam, k = I.keys, w = G.world, b = G.bike;
  let jx = I.jx, jy = I.jy;
  if (k.KeyW || k.ArrowUp) jy += 1; if (k.KeyS || k.ArrowDown) jy -= 1; if (k.KeyA || k.ArrowLeft) jx -= 1; if (k.KeyD || k.ArrowRight) jx += 1;
  let mag = Math.hypot(jx, jy); if (mag > 1) { jx /= mag; jy /= mag; mag = 1; }
  if (G.mode !== 'play') { mag = 0; jx = jy = 0; }
  if (mag < 0.1) { mag = 0; jx = jy = 0; }
  if (G.seat && mag > 0.3) standUp();
  if (G.seat) { p.speed = 0; return; }
  const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = Math.sin(c.yaw);
  const wx = mag ? (fx * jy + rx * jx) / mag : 0, wz = mag ? (fz * jy + rz * jx) / mag : 0;
  const fast = G.run || k.ShiftLeft || k.ShiftRight;
  if (G.riding) {
    let dh = 0; if (mag) dh = angDiff(p.rot, Math.atan2(wx, wz));
    const turn = clamp(dh * 3.2, -2.6, 2.6) * (0.3 + Math.min(1, b.v / 3.5) * 0.7);
    p.rot += turn * dt;
    const top = (fast ? 12.5 : 9) * (p.wade ? 0.35 : 1), tv = mag * top * Math.max(0.2, Math.cos(dh));
    b.v += clamp(tv - b.v, -7.5 * dt, (b.v < 3 ? 6 : 3.6) * dt);
    if (b.v > 0.05) { const moved = stepActor(p, Math.sin(p.rot) * b.v, Math.cos(p.rot) * b.v, dt, 0.42); if (moved < b.v * dt * 0.45) b.v *= 0.82; }
    else p.y += (groundY(w, p.x, p.z, p) - p.y) * Math.min(1, dt * 14);
    b.lean += (clamp(-turn * b.v * 0.03, -0.42, 0.42) - b.lean) * Math.min(1, dt * 7);
    b.steer += (clamp(dh, -0.55, 0.55) - b.steer) * Math.min(1, dt * 9);
    b.spin += b.v * dt / 0.34; b.crank += b.v * dt * 1.5; p.phase = b.crank; p.speed = b.v; p.roll = b.lean; p.steer = b.steer;
    b.x = p.x; b.z = p.z; b.y = p.y; b.rot = p.rot;
    if (G.time - c.lastDrag > 1.2 && b.v > 1.2) c.yaw += angDiff(c.yaw, Math.PI - p.rot) * Math.min(1, dt * 1.5);
  } else {
    const top = (fast ? 6.4 : 3.2) * (p.wade ? 0.5 : 1), sp = mag * top;
    p.vx = lerp(p.vx || 0, wx * sp, Math.min(1, dt * 9)); p.vz = lerp(p.vz || 0, wz * sp, Math.min(1, dt * 9));
    const v = Math.hypot(p.vx, p.vz);
    if (v > 0.05) {
      const moved = stepActor(p, p.vx, p.vz, dt, 0.34);
      p.speed = lerp(p.speed, moved / dt, Math.min(1, dt * 10));
      p.rot += angDiff(p.rot, Math.atan2(p.vx, p.vz)) * Math.min(1, dt * 11);
      p.phase += dt * (2.4 + p.speed * 1.55);
      if (G.time - c.lastDrag > 0.8) c.yaw += jx * dt * 1.1 * mag;
    } else { p.speed = lerp(p.speed, 0, Math.min(1, dt * 10)); p.y += (groundY(w, p.x, p.z, p) - p.y) * Math.min(1, dt * 14); }
  }
  // crossing a frame
  for (const g of w.portals) {
    if (g.back) continue;
    const d0 = (G.px - g.x) * g.nx + (G.pz - g.z) * g.nz, d1 = (p.x - g.x) * g.nx + (p.z - g.z) * g.nz, lat = Math.abs((p.x - g.x) * g.nz - (p.z - g.z) * g.nx);
    if (lat < g.w && ((d0 > 0) !== (d1 > 0)) && Math.abs(d1) < 2.5) { G.mode = 'travel'; UI.hud(false); travel(g.id, G.wid); break; }
  }
  G.px = p.x; G.pz = p.z;
}

function updateNPC(a, dt) {
  const p = G.player, w = G.world;
  if (a === G.companion) {
    if (G.riding) { // ride pillion on the rack
      a.x = p.x - Math.sin(p.rot) * 0.62; a.z = p.z - Math.cos(p.rot) * 0.62; a.y = p.y + 0.37; a.rot = p.rot + Math.PI / 2; a.pose = 'pillion'; a.speed = 0; a.wade = false; return;
    }
    if (a.pose === 'pillion') a.pose = 'idle';
    const tx = p.x - Math.sin(p.rot) * 1.25 + Math.cos(p.rot) * 0.95, tz = p.z - Math.cos(p.rot) * 1.25 - Math.sin(p.rot) * 0.95;
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    if (d > 30) { a.x = tx; a.z = tz; a.y = groundY(w, tx, tz, a); }
    if (d > 0.5) { const sp = Math.min(7, 0.6 + d * 1.7); const mv = stepActor(a, dx / d * sp, dz / d * sp, dt, 0.3); a.speed = lerp(a.speed, mv / dt, Math.min(1, dt * 8)); a.rot += angDiff(a.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 8); a.phase += dt * (2.4 + a.speed * 1.55); }
    else { a.speed = lerp(a.speed, 0, Math.min(1, dt * 8)); a.rot += angDiff(a.rot, p.rot) * Math.min(1, dt * 2); a.y += (groundY(w, a.x, a.z, a) - a.y) * Math.min(1, dt * 14); }
    return;
  }
  if (a.def.statue) return;
  const pd = Math.hypot(p.x - a.x, p.z - a.z);
  if (a.mode === 'path' || a.mode === 'wander') {
    if (a.mode === 'wander') { a.wait -= dt; if (a.wait < 0) { const an = Math.random() * TAU, r = Math.random() * a.rad; a.tx = a.home[0] + Math.cos(an) * r; a.tz = a.home[1] + Math.sin(an) * r; a.wait = 3 + Math.random() * 5; } }
    else { const q = a.path[a.pi]; a.tx = q[0]; a.tz = q[1]; if (Math.hypot(q[0] - a.x, q[1] - a.z) < 0.6) a.pi = (a.pi + 1) % a.path.length; }
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
    if (d > 0.25 && !(pd < 2.2 && a.who)) {
      const sp = a.spd; a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; a.speed = lerp(a.speed, sp, dt * 5); a.rot += angDiff(a.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 5); a.phase += dt * (2.4 + a.speed * 1.55);
      a.y = (a.yoff !== undefined ? a.yoff : w.heightAt(a.x, a.z));
    } else a.speed = lerp(a.speed, 0, dt * 6);
  } else if (a.mode === 'follow') {
    const l = G.actors[G.actors.indexOf(a) + a.def.of]; if (l) { a.x = l.x + Math.cos(l.rot) * a.def.side; a.z = l.z - Math.sin(l.rot) * a.def.side; a.rot = l.rot; a.speed = l.speed; a.phase = l.phase + 0.4; a.y = w.heightAt(a.x, a.z); }
  }
  let look = 0;
  if (pd < 6 && a.pose !== 'wash') { look = clamp(angDiff(a.rot, Math.atan2(p.x - a.x, p.z - a.z)), -1.1, 1.1); if (a.mode === 'stand' && pd < 3 && a.pose !== 'sit' && a.pose !== 'paint') a.rot += angDiff(a.rot, Math.atan2(p.x - a.x, p.z - a.z)) * Math.min(1, dt * 1.5); }
  else if (a.mode === 'stand' && a.pose !== 'sit') a.rot += angDiff(a.rot, a.homeRot) * Math.min(1, dt);
  a.look += (look - a.look) * Math.min(1, dt * 4);
}

/* ---------- camera ---------- */
const _b = [0, 0, 0];
function updateCamera(dt) {
  const c = G.cam, p = G.player, w = G.world, R = G.R, asp = R.w / R.h;
  const fov = (asp < 1 ? 1.22 : 0.98) + Math.min(0.14, Math.max(0, p.speed - 5) * 0.02);
  c.fov = c.fov === undefined ? fov : lerp(c.fov, fov, Math.min(1, dt * 3));
  let ex, ey, ez, lx, ly, lz;
  if (G.view) {
    const v = G.view; v.t = Math.min(1, v.t + dt / 1.8); const e = sstep(0, 1, v.t), q = v.out ? 1 - e : e;
    ex = lerp(v.fp[0], v.p[0], q); ey = lerp(v.fp[1], v.p[1], q); ez = lerp(v.fp[2], v.p[2], q);
    lx = lerp(v.ft[0], v.to[0], q); ly = lerp(v.ft[1], v.to[1], q); lz = lerp(v.ft[2], v.to[2], q);
    if (v.out && v.t >= 1) { G.view = null; G.mode = 'play'; UI.hud(true); }
    else if (!v.out) { ex += Math.sin(G.time * 0.25) * 0.05; ey += Math.sin(G.time * 0.31) * 0.03; }
  } else {
    if (G.seat || G.mode === 'title') c.yaw += dt * 0.06;
    c.tx += (p.x - c.tx) * Math.min(1, dt * 12); c.tz += (p.z - c.tz) * Math.min(1, dt * 12); c.ty += (p.y - c.ty) * Math.min(1, dt * 8);
    const hy = (G.seat ? 1.05 : G.riding ? 1.55 : 1.42), tx = c.tx, ty = c.ty + hy, tz = c.tz;
    const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    let dist = c.dist * (G.riding ? 1.22 : 1) * (1 + Math.min(0.25, p.speed * 0.02));
    const steps = 9; let free = dist;
    for (let i = 1; i <= steps; i++) {
      const t = dist * i / steps, x = tx - fx * cp * t, y = ty + sp * t, z = tz - fz * cp * t, a = w.near(x, z); let hit = false;
      if (a) for (let k = 0; k < a.length; k++) { const o = a[k]; if (o.hw === undefined || y > o.h) continue; const qx = x - o.x, qz = z - o.z, ux = qx * o.c - qz * o.s, uz = qx * o.s + qz * o.c; if (Math.abs(ux) < o.hw + 0.25 && Math.abs(uz) < o.hd + 0.25) { hit = true; break; } }
      if (hit) { free = Math.max(0.9, dist * (i - 1) / steps); break; }
    }
    c.cd = c.cd === undefined ? free : (free < c.cd ? free : lerp(c.cd, free, Math.min(1, dt * 4)));
    dist = c.cd;
    ex = tx - fx * cp * dist; ez = tz - fz * cp * dist; ey = ty + sp * dist;
    const gy = w.heightAt(ex, ez) + 0.28; if (ey < gy) ey = gy;
    if (ey < w.waterY + 0.3) ey = w.waterY + 0.3;
    lx = tx + fx * 2.0; lz = tz + fz * 2.0; ly = ty + 0.55 - sp * 1.2;
    c.eye[0] = ex; c.eye[1] = ey; c.eye[2] = ez; c.look[0] = lx; c.look[1] = ly; c.look[2] = lz;
  }
  let dx = lx - ex, dy = ly - ey, dz = lz - ez; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
  let rx = -dz, rz = dx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
  const ux = -rz * dy, uy = rz * dx - rx * dz, uz = rx * dy;
  c.pos[0] = ex; c.pos[1] = ey; c.pos[2] = ez; c.fwd[0] = dx; c.fwd[1] = dy; c.fwd[2] = dz;
  c.r[0] = rx; c.r[2] = rz; c.u[0] = ux; c.u[1] = uy; c.u[2] = uz;
  _b[0] = -dx; _b[1] = -dy; _b[2] = -dz;
  M4.view(c.view, c.pos, c.r, c.u, _b);
  M4.persp(c.proj, c.fov, asp, 0.25, 560); M4.mul(c.vp, c.proj, c.view);
  const th = Math.tan(c.fov / 2);
  c.skyR[0] = rx * th * asp; c.skyR[1] = 0; c.skyR[2] = rz * th * asp; c.skyU[0] = ux * th; c.skyU[1] = uy * th; c.skyU[2] = uz * th;
}

/* ---------- interactions ---------- */
function nearest() {
  const p = G.player, w = G.world; let best = null, bd = 1e9;
  for (const a of G.actors) { if (!a.who || a === G.companion) continue; const d = Math.hypot(a.x - p.x, a.z - p.z); if (d < (a.def.statue && !a.def.walked ? 4.2 : 2.7) && d < bd) { bd = d; best = { type: 'npc', a }; } }
  if (!G.seat && !G.riding) for (const s of w.seats) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < 1.6 && d < bd) { let used = false; for (const a of G.actors) if (Math.hypot(a.x - s.x, a.z - s.z) < 0.5) used = true; if (!used) { bd = d; best = { type: 'seat', s }; } } }
  return best;
}
function spotHere(pad) { const p = G.player; let best = null, bd = 1e9; for (const s of G.world.spots) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < s.r + (pad || 0) && d - s.r < bd) { bd = d - s.r; best = s; } } return best; }
function sitDown(s) {
  const p = G.player; G.seat = s; p.x = s.x; p.z = s.z; p.rot = s.rot; p.y = s.y; p.pose = 'sit'; p.speed = 0; p.wade = false; G.cam.pitch = 0.14; G.cam.dist = 4.6;
  if (s.tag === 'tea') { G.set.cycle = false; G.todT = (Math.round(G.todT) + 1) % 3; UI.toast('一盏茶的工夫', ['白天', '黄昏', '夜晚'][G.todT] + '到了', 2600); }
  UI.act();
}
function standUp() { const p = G.player, s = G.seat; if (!s) return; G.seat = null; p.pose = 'idle'; const c = collide(G.world, s.x + Math.sin(s.rot) * 0.8, s.z + Math.cos(s.rot) * 0.8, 0.34); p.x = c[0]; p.z = c[1]; p.y = G.world.heightAt(p.x, p.z); G.px = p.x; G.pz = p.z; G.cam.dist = 5.4; UI.act(); }
function painterView(s) {
  const c = G.cam, v = s.view; G.view = { t: 0, out: false, fp: c.eye.slice(), ft: c.look.slice(), p: v.p, to: v.t, spot: s };
  if (v.tod !== undefined) { G.set.cycle = false; G.todT = v.tod; }
  G.mode = 'view'; UI.hud(false); UI.caption(ART[s.art]);
}
function leaveView() { const v = G.view; if (!v || v.out) return; v.out = true; v.t = 0; UI.caption(null); }
function invite(a) {
  if (G.companion) dismiss(true);
  G.companion = a; a.mode = 'companion'; if (['sit', 'wash', 'paint', 'statue', 'sow', 'scream'].includes(a.pose)) a.pose = 'idle';
  if (a.def.statue) { a.scale = 1; a.def.walked = true; }
  UI.toast(PEOPLE[a.who].n, a.def.statue ? '从基座上走了下来' : '愿意陪你走一段', 2400); UI.act();
}
function dismiss(quiet) {
  const a = G.companion; if (!a) return; G.companion = null; a.mode = a.def.mode || 'stand'; a.pose = a.def.pose || 'idle'; a.roll = 0; a.wade = false;
  if (G.world.npcs.includes(a.def)) { a.x = a.home[0]; a.z = a.home[1]; a.rot = a.homeRot; a.scale = a.def.scale || 1; a.def.walked = false; placeNPC(a, G.world); } else G.actors.splice(G.actors.indexOf(a), 1);
  if (!quiet) UI.act();
}

/* ---------- things to do: letters, falling stars, matching the painter's view ---------- */
const MAIL = ['ginoux', 'berceuse', 'vincent', 'gachet', 'zouave', 'oiran'];
const Play = {
  star: null, starT: 14, burst: [],
  reset() { this.star = null; this.starT = 10 + Math.random() * 8; this.burst.length = 0; },
  startMail() { G.letters = MAIL.slice(); store.set('letters', G.letters); UI.chips(); UI.toast('六封信', '送给吉努夫人、鲁兰夫人、画家、加歇医生、祖阿夫兵和花魁', 5600, '邮差的托付'); },
  deliver(who) {
    if (!G.letters) return false; const i = G.letters.indexOf(who); if (i < 0) return false;
    G.letters.splice(i, 1); Music.chime(); Native.post('haptic');
    if (!G.letters.length) { G.letters = null; G.flags.mail = true; store.set('flags', G.flags); UI.toast('信都送到了', '邮差把自行车漆成了金色送给你', 5200, '完成'); }
    else UI.toast(PEOPLE[who].n + '收到了信', '还有 ' + G.letters.length + ' 封', 2600);
    store.set('letters', G.letters); UI.chips(); return true;
  },
  /* how close the camera is to where the painter stood */
  score(spot) {
    if (!spot || !spot.view) return null; const v = spot.view, c = G.cam;
    const d = Math.hypot(c.pos[0] - v.p[0], c.pos[1] - v.p[1], c.pos[2] - v.p[2]);
    const dx = v.t[0] - v.p[0], dy = v.t[1] - v.p[1], dz = v.t[2] - v.p[2], l = Math.hypot(dx, dy, dz);
    const dot = Math.max(0, (dx * c.fwd[0] + dy * c.fwd[1] + dz * c.fwd[2]) / l);
    const tod = v.tod === undefined ? 1 : Math.max(0.75, 1 - Math.abs(G.tod - v.tod) * 0.25);
    return Math.round(100 * Math.exp(-d / 9) * Math.pow(dot, 3) * tod);
  },
  update(dt) {
    const w = G.world, p = G.player, night = G.env.lampAmt > 0.6 && !w.extra.noStars;
    for (let i = this.burst.length - 1; i >= 0; i--) { const b = this.burst[i]; b.t += dt; if (b.t > 1) this.burst.splice(i, 1); }
    const s = this.star;
    if (!s) {
      if (!night || G.mode !== 'play') return;
      this.starT -= dt; if (this.starT > 0) return;
      for (let k = 0; k < 8; k++) {
        const a = Math.random() * TAU, d = 26 + Math.random() * 34, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, b = w.bound;
        if (b.r ? Math.hypot(x - (b.x || 0), z - (b.z || 0)) > b.r - 4 : (x < b.x0 + 3 || x > b.x1 - 3 || z < b.z0 + 3 || z > b.z1 - 3)) continue;
        const c = collide(w, x, z, 1.2); if (Math.hypot(c[0] - x, c[1] - z) > 0.01) continue;
        this.star = { x, z, y: groundY(w, x, z), t: 0, sx: x + 34 * Math.cos(a + 1), sz: z + 34 * Math.sin(a + 1), life: 80 }; break;
      }
      this.starT = 4; return;
    }
    s.t += dt;
    if (s.t > 1.5) {
      const pd = Math.hypot(p.x - s.x, p.z - s.z);
      if (pd < (G.riding ? 3 : 2.1)) {
        G.stars++; store.set('stars', G.stars); Music.chime(); Native.post('haptic');
        for (let i = 0; i < 12; i++) this.burst.push({ x: s.x, y: s.y + 1, z: s.z, a: i / 12 * TAU, t: 0 });
        UI.toast('接住了一颗星', '一共 ' + G.stars + ' 颗' + (G.stars % 3 === 0 && G.stars <= 15 ? ' · 多了一点星光跟着你' : ''), 2800); UI.chips();
        this.star = null; this.starT = 16 + Math.random() * 16; return;
      }
      if (s.t > s.life || !night) { this.star = null; this.starT = 12 + Math.random() * 12; }
    }
  },
  sprites(R, r, u) {
    const s = this.star, t = G.time, p = G.player;
    if (s) {
      if (s.t < 1.5) {
        const k = s.t / 1.5;
        for (let i = 0; i < 9; i++) { const q = Math.max(0, k - i * 0.035), x = lerp(s.sx, s.x, q), y = lerp(s.y + 70, s.y + 0.8, q * q), z = lerp(s.sz, s.z, q), sz = 1.5 * (1 - i * 0.09); R.spr(1, x, y, z, r[0] * sz, 0, r[2] * sz, u[0] * sz, u[1] * sz, u[2] * sz, 1.0, 0.92, 0.6, 1 - i * 0.1); }
      } else {
        const fade = Math.min(1, (s.life - s.t) / 6), pul = 0.8 + 0.2 * Math.sin(t * 4);
        for (let i = 0; i < 7; i++) { const sz = (i === 0 ? 1.5 : 0.7 - i * 0.05) * pul, y = s.y + 0.7 + i * 2.6; R.spr(1, s.x, y, s.z, r[0] * sz, 0, r[2] * sz, u[0] * sz, u[1] * sz, u[2] * sz, 1.0, 0.9, 0.5, fade * (i === 0 ? 1 : 0.5)); }
      }
    }
    for (let i = 0; i < this.burst.length; i++) { const b = this.burst[i], d = b.t * 3.2, sz = 0.35 * (1 - b.t); R.spr(1, b.x + Math.cos(b.a) * d, b.y + Math.sin(b.a * 3 + 1) * d * 0.5 + b.t * 1.5, b.z + Math.sin(b.a) * d, r[0] * sz, 0, r[2] * sz, u[0] * sz, u[1] * sz, u[2] * sz, 1, 0.9, 0.55, 1 - b.t); }
    const n = Math.min(5, Math.floor(G.stars / 3));
    for (let i = 0; i < n; i++) { const a = t * 0.9 + i / n * TAU, sz = 0.2; R.spr(1, p.x + Math.cos(a) * 0.75, p.y + 1.25 + Math.sin(t * 1.3 + i) * 0.25 + (G.riding ? 0.3 : 0), p.z + Math.sin(a) * 0.75, r[0] * sz, 0, r[2] * sz, u[0] * sz, u[1] * sz, u[2] * sz, 1.0, 0.92, 0.6, 0.85); }
  },
};

/* ---------- little living things ---------- */
const TRAIL = ['#f6d24a', '#3f72c0', '#e8762a', '#8fc0a2', '#f3c9d6', '#f2efe2'].map(hex);
function sprites(dt) {
  const R = G.R, c = G.cam, w = G.world, e = G.env, p = G.player, r = c.r, u = c.u, night = e.lampAmt, A = G.actors;
  R.sprBegin();
  const sh = 0.30 * (1 - 0.45 * e.nightMix);
  for (let i = -1; i < A.length; i++) { const a = i < 0 ? p : A[i]; if (a.wade || a.pose === 'pillion') continue; const d = Math.hypot(a.x - c.pos[0], a.z - c.pos[2]); if (d > 60) continue; const s = 0.46 * a.scale; R.spr(0, a.x, a.y + 0.05, a.z, s, 0, 0, 0, 0, s, 0.03, 0.04, 0.12, a.pose === 'sit' ? sh * 0.6 : sh); }
  const b = G.bike; if (b.has && !p.wade) { const ca = Math.cos(b.rot), sa = Math.sin(b.rot); R.spr(0, b.x, b.y + 0.05, b.z, ca * 0.3, 0, -sa * 0.3, sa * 0.95, 0, ca * 0.95, 0.03, 0.04, 0.12, sh); }
  if (p.wade && p.speed > 0.3) for (let i = 0; i < 3; i++) { const k = (G.time * 0.9 + i / 3) % 1, s = 0.4 + k * 1.3; R.spr(0, p.x, w.waterY + 0.03, p.z, s, 0, 0, 0, 0, s, 0.95, 0.97, 1.0, (1 - k) * 0.22); }
  if (G.set.trail) {
    if (p.speed > 0.8 && !G.seat && !p.wade) {
      G.dabT -= dt * p.speed;
      if (G.dabT < 0) {
        G.dabT = G.riding ? 0.5 : 0.62; const sd = G.riding ? 0 : ((G.dabN = (G.dabN || 0) + 1) % 2 ? 1 : -1), q = G.dabs.length < 54 ? {} : G.dabs.shift();
        q.x = p.x + Math.cos(p.rot) * 0.12 * sd; q.y = p.y + 0.07; q.z = p.z - Math.sin(p.rot) * 0.12 * sd; q.t = 0; q.c = G.flags.mail && G.riding ? TRAIL[0] : TRAIL[Math.floor(G.time * 0.35) % TRAIL.length]; q.a = p.rot; q.l = G.riding ? 0.34 : 0.2; G.dabs.push(q);
      }
    }
    for (let i = 0; i < G.dabs.length; i++) { const q = G.dabs[i]; q.t += dt; const al = Math.max(0, 1 - q.t / 7) * 0.7; if (al <= 0) continue; const ca = Math.cos(q.a), sa = Math.sin(q.a); R.spr(0, q.x, q.y, q.z, ca * 0.1, 0, -sa * 0.1, sa * q.l, 0, ca * q.l, q.c[0], q.c[1], q.c[2], al); }
  }
  if (night > 0.02) for (let i = 0; i < w.glows.length; i++) { const g = w.glows[i], d = Math.hypot(g.x - c.pos[0], g.z - c.pos[2]); if (d > 130 || !R.visible(g.x, g.y, g.z, g.s)) continue; const s = g.s * (1 + d * 0.012), k = night * (0.75 + 0.08 * Math.sin(G.time * 3 + g.x)); R.spr(1, g.x, g.y, g.z, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, g.col[0], g.col[1], g.col[2], k); }
  if (night > 0.6 && w.extra.fireflies !== 0) {
    if (!G.fire.length) for (let i = 0; i < 16; i++) G.fire.push({ x: Math.random() * 30 - 15, y: 0.4 + Math.random() * 1.6, z: Math.random() * 30 - 15, ph: Math.random() * 9 });
    for (let i = 0; i < G.fire.length; i++) {
      const f = G.fire[i], fx = p.x + ((f.x + Math.sin(G.time * 0.3 + f.ph) * 1.5 - p.x % 30 + 45) % 30) - 15, fz = p.z + ((f.z + Math.cos(G.time * 0.23 + f.ph) * 1.5 - p.z % 30 + 45) % 30) - 15;
      const gy = w.heightAt(fx, fz); if (gy < w.waterY + 0.1) continue; const bl = Math.max(0, Math.sin(G.time * 1.7 + f.ph * 3)); if (bl < 0.05) continue;
      const s = 0.22; R.spr(1, fx, gy + f.y + Math.sin(G.time + f.ph) * 0.3, fz, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, 0.8, 1.0, 0.45, bl * 0.9);
    }
  }
  for (let j = 0; j < w.petals.length; j++) {
    const z = w.petals[j], d = Math.hypot(p.x - z.x, p.z - z.z); if (d > z.r + 14) continue;
    for (let i = 0; i < 44; i++) {
      const h1 = hash2(i, 7), h2 = hash2(i, 13), h3 = hash2(i, 29), t = G.time * (0.25 + h3 * 0.25) + h1 * 10, fall = t % 1;
      const px = z.x + (h1 * 2 - 1) * z.r + Math.sin(t * 2 + i) * 0.6, pz = z.z + (h2 * 2 - 1) * z.r + Math.cos(t * 1.7 + i) * 0.6, py = w.heightAt(px, pz) + 5.5 * (1 - fall);
      const s = 0.07, a = t * 3; R.spr(0, px, py, pz, r[0] * s * Math.cos(a) + u[0] * s * Math.sin(a), u[1] * s * Math.sin(a), r[2] * s * Math.cos(a) + u[2] * s * Math.sin(a), u[0] * s * 0.6, u[1] * s * 0.6, u[2] * s * 0.6, z.col[0], z.col[1], z.col[2], Math.min(1, fall * 6) * Math.min(1, (1 - fall) * 5) * 0.95);
    }
  }
  for (let j = 0; j < w.birds.length; j++) {
    const b2 = w.birds[j], pd = Math.hypot(p.x - b2.x, p.z - b2.z); b2.ex = lerp(b2.ex || 0, pd < b2.r * 0.8 ? 1 : 0, dt * 0.8);
    for (let i = 0; i < b2.n; i++) {
      const h1 = hash2(i, 3), h2 = hash2(i, 11), sp = 0.16 + h1 * 0.14, a = G.time * sp * (i % 2 ? 1 : -1) + h1 * 20, rr = b2.r * (0.25 + h2 * 0.75) * (1 + b2.ex * 0.5);
      const x = b2.x + Math.cos(a) * rr, z = b2.z + Math.sin(a * 1.13) * rr * 0.8, y = w.heightAt(b2.x, b2.z) + b2.y * (0.35 + h2 * 0.9) + b2.ex * 6 * h1 + Math.sin(G.time * 0.6 + i) * 1.2;
      const s = (b2.s || 0.62) * (0.8 + h1 * 0.5), flap = Math.sin(G.time * (6 + h2 * 3) + i * 2);
      R.spr(2, x, y, z, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, b2.col ? b2.col[0] : 0.05, b2.col ? b2.col[1] : 0.05, b2.col ? b2.col[2] : 0.10, flap);
    }
  }
  Play.sprites(R, r, u);
}

/* ---------- frame ---------- */
function env() {
  if (Math.abs(G.tod - G.envTod) > 1e-4 || !G.env) { G.env = envAt(G.world.env, G.tod); G.envTod = G.tod; G.env.strokeAmt *= G.set.stroke; }
  return G.env;
}
function lampAt(w, a, out, amt) {
  let lr = 0, lg = 0, lb = 0;
  if (amt > 0.01) { const L = w.lamps; for (let i = 0; i < L.length; i++) { const l = L[i], dx = l.x - a.x, dz = l.z - a.z; if (dx > l.r || dx < -l.r || dz > l.r || dz < -l.r) continue; const dy = l.y - a.y - 1, d2 = dx * dx + dy * dy + dz * dz; if (d2 < l.r * l.r) { const at = 1 - Math.sqrt(d2) / l.r, k = at * at * l.k * amt; lr += l.col[0] * k; lg += l.col[1] * k; lb += l.col[2] * k; } } }
  out[0] = Math.min(lr, 1.2); out[1] = Math.min(lg, 1.2); out[2] = Math.min(lb, 1.2);
}
let lastT = 0, acc = 0, frames = 0, slow = 0, fast = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (G.pause) { lastT = t / 1000; return; }
  G.fc = (G.fc || 0) + 1;
  const now = t / 1000; let dt = now - lastT; lastT = now; if (dt > 0.1) dt = 0.1; if (dt <= 0) return;
  G.time += dt;
  // adaptive resolution: hold the display's refresh rate, give back sharpness whenever there is room
  acc += dt; frames++;
  if (frames > 10 && dt < 1 / (G.hz * 1.3)) G.hz = dt < 0.0075 ? 144 : dt < 0.0095 ? 120 : dt < 0.0125 ? 90 : G.hz;
  if (acc >= 0.5) {
    const fps = frames / acc; acc = 0; frames = 0; G.fps = fps;
    if (G.set.fps) $('fps').textContent = Math.round(fps) + ' 帧 · ' + G.R.w + '×' + G.R.h + ' · ' + Math.round(G.R.drawn / 3000) + 'k 面';
    if (G.set.quality !== 'fine' && G.mode !== 'title' && !G.busy && !window.__sync) {
      const target = G.set.quality === 'fast' ? Math.min(G.hz, 120) : Math.min(G.hz, 60);
      if (fps < target * 0.88) { slow++; fast = 0; if (slow >= 2) { if (G.scale > 0.72) { G.scale = Math.max(0.72, G.scale - 0.07); resize(); } slow = 0; } }
      else if (fps > target * 0.965) { fast++; slow = 0; if (fast >= 5 && G.scale < 1) { G.scale = Math.min(1, G.scale + 0.05); fast = 0; resize(); } }
      else { slow = 0; fast = 0; }
    }
  }
  if (!G.world) return;
  const w = G.world, p = G.player, R = G.R;
  if (G.set.cycle && G.mode === 'play') { G.todT += dt / 80; if (G.todT >= 3) G.todT -= 3; G.tod = G.todT <= 2 ? G.todT : 2 - (G.todT - 2) * 2; }
  else if (G.tod !== G.todT) { const d = G.todT - G.tod, s = dt / 2.6; G.tod = Math.abs(d) < s ? G.todT : G.tod + Math.sign(d) * s; }
  updatePlayer(dt);
  for (let i = 0; i < G.actors.length; i++) updateNPC(G.actors[i], dt);
  updateCamera(dt);
  const e = env(), c = G.cam, list = G.actors;
  Play.update(dt);
  R.begin(c, e, G.time);
  R.drawWorld(w.solid);
  if (w.detail) R.drawWorld(w.detail, w.detailDist * (G.set.quality === 'fast' ? 0.7 : 1));
  if (w.portalMesh) R.drawPortals(w.portalMesh, w.portals);
  if (w.picMesh) R.drawPics(w.picMesh, w.pics);
  R.beginChars();
  for (let i = -1; i < list.length; i++) {
    const a = i < 0 ? p : list[i];
    const d = Math.hypot(a.x - c.pos[0], a.z - c.pos[2]); if (d > 110 || !R.visible(a.x, a.y + 0.9 * a.scale, a.z, 1.6 * a.scale)) continue;
    a.animate(G.time); lampAt(w, a, a.lamp, e.lampAmt);
    R.drawChar(a.model, a.bones, a.lamp, d < 38 ? a.outline * a.scale : 0);
  }
  const b = G.bike;
  if (b.has && R.visible(b.x, b.y + 0.6, b.z, 1.4)) {
    if (!G.riding) b.y += (groundY(w, b.x, b.z) - b.y) * Math.min(1, dt * 10);
    bikeBones(b.bones, b.x, b.y, b.z, b.rot, b.lean, b.steer, b.spin, b.crank); lampAt(w, b, b.lamp, e.lampAmt);
    R.drawChar(model(G.flags.mail ? 'bikeGold' : 'bike'), b.bones, b.lamp, 0.01);
  }
  if (w.water) {
    if (--G.rfT <= 0) {
      G.rfT = 12; const rf = G.rf, L = w.refl; let n = 0;
      if (!G.rfd || G.rfd.length < L.length) G.rfd = new Float32Array(L.length + 8);
      for (let i = 0; i < L.length; i++) G.rfd[i] = Math.hypot(L[i].refl[0] - c.pos[0], L[i].refl[1] - c.pos[2]);
      for (; n < 8; n++) { let bi = -1, bd = 1e9; for (let i = 0; i < L.length; i++) if (G.rfd[i] < bd) { bd = G.rfd[i]; bi = i; } if (bi < 0) break; G.rfd[bi] = 2e9; const f = L[bi].refl; rf[n * 4] = f[0]; rf[n * 4 + 1] = f[1]; rf[n * 4 + 2] = f[2]; rf[n * 4 + 3] = f[3]; }
      for (; n < 8; n++) { rf[n * 4] = 1e5; rf[n * 4 + 1] = 1e5; rf[n * 4 + 2] = 1; rf[n * 4 + 3] = 1; }
    }
    R.drawWater(w.water, G.rf);
  }
  R.drawSky();
  sprites(dt);
  R.sprFlush();
  if (G.cap) { const f = G.cap; G.cap = null; f(); }
  UI.tick(dt);
  if (window.__sync) { const px = new Uint8Array(4); R.gl.readPixels(0, 0, 1, 1, R.gl.RGBA, R.gl.UNSIGNED_BYTE, px); }
}

/* always landscape: if the phone is held upright the whole stage is turned on its side */
function layout() {
  const pw = window.innerWidth, ph = window.innerHeight, app = $('app'), rot = ph > pw;
  G.rot = rot; G.LW = rot ? ph : pw; G.LH = rot ? pw : ph;
  app.style.width = G.LW + 'px'; app.style.height = G.LH + 'px'; app.style.transform = rot ? 'rotate(90deg) translateY(-100%)' : 'none'; app.classList.toggle('rot', rot);
}
const PX = e => G.rot ? e.clientY : e.clientX, PY = e => G.rot ? window.innerWidth - e.clientX : e.clientY;
function resize() {
  layout();
  const dpr = Math.min(window.devicePixelRatio || 1, 3), q = G.set.quality; let eff;
  // clarity first: native resolution wherever the pixel count allows, and never below a crisp floor
  if (q === 'fine') eff = dpr; else if (q === 'fast') eff = Math.min(dpr, 1.5) * Math.max(0.8, G.scale);
  else { const px = G.LW * G.LH * dpr * dpr, base = Math.min(1, Math.sqrt(4.6e6 / px)); eff = Math.max(Math.min(dpr, 1.7), dpr * base * G.scale); }
  G.R.skyScale = q === 'fine' ? 0.85 : q === 'fast' ? 0.55 : 0.7; G.big = G.LH > 700; $('app').classList.toggle('big', G.big);
  G.R.resize(G.LW, G.LH, eff);
}

/* ---------- photo and film ---------- */
function composePhoto(spot, score) {
  const cv = $('c'), w = cv.width, h = cv.height, o = document.createElement('canvas'); o.width = w; o.height = h;
  const x = o.getContext('2d'); x.drawImage(cv, 0, 0);
  const b = Math.round(h * 0.03), g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f3d77a'); g.addColorStop(0.3, '#a87d24'); g.addColorStop(0.52, '#f0cf66'); g.addColorStop(0.76, '#8a6219'); g.addColorStop(1, '#e6c256');
  x.strokeStyle = g; x.lineWidth = b; x.strokeRect(b / 2, b / 2, w - b, h - b); x.strokeStyle = '#6a4a12'; x.lineWidth = Math.max(1, b * 0.1); x.strokeRect(b, b, w - 2 * b, h - 2 * b);
  const t1 = spot ? '《' + ART[spot.art].t + '》里的我' : WORLD_INFO[G.wid].n, t2 = ['白天', '黄昏', '夜晚'][Math.round(G.tod) % 3] + ' · 画中漫步' + (score !== null && score !== undefined ? ' · 还原度 ' + score + '%' : '');
  const f1 = Math.round(h * 0.036), f2 = Math.round(h * 0.022); x.font = '900 ' + f1 + 'px "Noto Serif SC","Songti SC",serif';
  const tw = Math.max(x.measureText(t1).width, f2 * t2.length * 0.95) + f1 * 2, ph = f1 + f2 + f1 * 0.9, px = (w - tw) / 2, py = h - b * 1.6 - ph;
  const pg = x.createLinearGradient(0, py, 0, py + ph); pg.addColorStop(0, '#f3d77a'); pg.addColorStop(1, '#c99a34'); x.fillStyle = pg; x.fillRect(px, py, tw, ph); x.strokeStyle = '#6a4a12'; x.lineWidth = Math.max(1, b * 0.08); x.strokeRect(px, py, tw, ph);
  x.fillStyle = '#3a2a0a'; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(t1, w / 2, py + f1 * 0.3); x.font = '600 ' + f2 + 'px "Noto Serif SC","Songti SC",serif'; x.fillText(t2, w / 2, py + f1 * 1.45);
  return o.toDataURL('image/jpeg', 0.93);
}
function takePhoto() {
  if (G.mode !== 'play') return;
  const spot = spotHere(), score = Play.score(spot);
  UI.hud(false); UI.flash();
  setTimeout(() => {
    G.cap = () => {
      let url = null; try { url = composePhoto(spot, score); } catch (e) { }
      UI.hud(true);
      if (score !== null && spot) { const best = G.scores[spot.art] || 0; if (score > best) { G.scores[spot.art] = score; store.set('scores', G.scores); } }
      const tail = score !== null ? (score >= 80 ? ' · 还原度 ' + score + '%，几乎就是那幅画' : ' · 还原度 ' + score + '%') : '';
      if (!url) { UI.toast('没有拍下来', '请再试一次', 2400); return; }
      if (Native.on && Native.post('photo', { data: url }, (ok, msg) => UI.toast(ok ? '已存入相册' : '没有存下来', ok ? ('照片' + tail) : msg, 3200))) return;
      UI.shot(url, '长按图片可以保存' + tail);
    };
  }, 140);
}
function toggleRecord() {
  if (G.rec) {
    const r = G.rec; G.rec = null; UI.recording(false);
    if (r.native) Native.post('recStop', null, (ok, msg) => UI.toast(ok ? '录像已存入相册' : '录像没有存下来', ok ? null : msg, 3200));
    else { try { r.mr.stop(); } catch (e) { } }
    return;
  }
  if (G.mode !== 'play') return;
  if (Native.on) { Native.post('recStart', null, (ok, msg) => { if (ok) { G.rec = { native: true, t0: G.time }; UI.recording(true); } else UI.toast('没有开始录像', msg, 3200); }); return; }
  try {
    const st = $('c').captureStream(60), types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'], type = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) throw new Error('unsupported');
    const mr = new MediaRecorder(st, { mimeType: type, videoBitsPerSecond: 12e6 }), chunks = [];
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => UI.film(URL.createObjectURL(new Blob(chunks, { type })));
    mr.start(500); G.rec = { mr, t0: G.time }; UI.recording(true);
  } catch (e) { UI.toast('这里不能录像', '装上 App 后可以直接录到相册', 3600); }
}

/* ---------- input ---------- */
function bindInput() {
  const cv = $('c'), I = G.inp, st = $('stick'), nub = $('nub');
  const down = e => {
    if (G.mode === 'view') { leaveView(); return; }
    if (G.mode !== 'play') return;
    UI.menu(false); Music.start();
    const x = PX(e), y = PY(e), left = x < G.LW * 0.42 && y > G.LH * 0.2;
    if (left && !I.stick && e.pointerType !== 'mouse') { I.stick = { id: e.pointerId, x, y }; st.style.left = x + 'px'; st.style.top = y + 'px'; st.classList.add('on'); nub.style.transform = 'translate(-50%,-50%)'; }
    else I.looks.set(e.pointerId, { x, y });
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  };
  const move = e => {
    const x = PX(e), y = PY(e);
    if (I.stick && e.pointerId === I.stick.id) {
      let dx = x - I.stick.x, dy = y - I.stick.y; const R0 = G.big ? 72 : 54, l = Math.hypot(dx, dy);
      if (l > R0) { // the base follows a thumb that drifts
        I.stick.x += dx * (1 - R0 / l) * 0.5; I.stick.y += dy * (1 - R0 / l) * 0.5; st.style.left = I.stick.x + 'px'; st.style.top = I.stick.y + 'px';
        dx = x - I.stick.x; dy = y - I.stick.y; const l2 = Math.hypot(dx, dy); if (l2 > R0) { dx *= R0 / l2; dy *= R0 / l2; }
      }
      I.jx = dx / R0; I.jy = -dy / R0; nub.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    } else if (I.looks.has(e.pointerId)) {
      const q = I.looks.get(e.pointerId);
      if (I.looks.size >= 2) { let o = null; I.looks.forEach((v, k2) => { if (k2 !== e.pointerId) o = v; }); const d0 = Math.hypot(q.x - o.x, q.y - o.y), d1 = Math.hypot(x - o.x, y - o.y); G.cam.dist = clamp(G.cam.dist * (d0 / Math.max(1, d1)), 2.2, 12); }
      else { const s = G.set.sens * 1.3; G.cam.yaw += (x - q.x) * 0.0058 * s; G.cam.pitch = clamp(G.cam.pitch + (y - q.y) * 0.0044 * s, -0.45, 1.2); G.cam.lastDrag = G.time; }
      q.x = x; q.y = y;
    }
  };
  const up = e => { if (I.stick && e.pointerId === I.stick.id) { I.stick = null; I.jx = I.jy = 0; st.classList.remove('on'); } I.looks.delete(e.pointerId); };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { G.cam.dist = clamp(G.cam.dist * (1 + Math.sign(e.deltaY) * 0.08), 2.2, 12); e.preventDefault(); }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  window.addEventListener('keydown', e => { I.keys[e.code] = true; if (e.code === 'KeyE' || e.code === 'Enter') UI.primary(); if (e.code === 'KeyB') setRide(!G.riding); if (e.code === 'KeyR') { G.run = !G.run; UI.modes(); } if (e.code === 'Escape') { leaveView(); UI.closeAll(); } });
  window.addEventListener('keyup', e => { I.keys[e.code] = false; });
  window.addEventListener('blur', () => { I.keys = {}; I.jx = I.jy = 0; });
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));
}

function boot() {
  const cv = $('c');
  try { G.R = new Renderer(cv); } catch (e) { $('err').textContent = '这个浏览器不支持 WebGL2，无法打开画布。' + (e && e.message ? '（' + String(e.message).slice(0, 120) + '）' : ''); $('err').hidden = false; return; }
  const R = G.R; R.makeStroke('oil', 'oil', 7); R.makeStroke('dots', 'dots', 11); R.makeStroke('paper', 'paper', 5); R.makeStroke('dab', 'dab', 3);
  Object.assign(G.set, store.get('set', {})); G.found = new Set(store.get('found', [])); G.met = new Set(store.get('met', []));
  G.stars = store.get('stars', 0); G.letters = store.get('letters', null); G.scores = store.get('scores', {}); G.flags = store.get('flags', {});
  G.scale = 1; resize();
  G.player = new Actor(model('player'), { x: 0, z: 0, rot: Math.PI, outline: 0.012, extra: { def: {} } });
  bindInput(); UI.init();
  enterWorld('town'); G.mode = 'title';
  requestAnimationFrame(t => { lastT = t / 1000; requestAnimationFrame(frame); });
}
window.addEventListener('DOMContentLoaded', boot);
