'use strict';
/* 画中漫步 — game loop, input, camera, people, travel between paintings */
const $ = id => document.getElementById(id);
const G = {
  R: null, worlds: {}, world: null, wid: 'town', actors: [], player: null, companion: null,
  tod: 2, todT: 2, env: null, envTod: -1, time: 0,
  cam: { yaw: 0, pitch: 0.12, dist: 5.4, pos: new Float32Array(3), fwd: new Float32Array(3), skyR: new Float32Array(3), skyU: new Float32Array(3), vp: M4.create(), view: M4.create(), proj: M4.create(), tx: 0, ty: 0, tz: 0, lastDrag: -9 },
  inp: { jx: 0, jy: 0, keys: {}, stick: null, looks: new Map() },
  mode: 'title', found: new Set(), met: new Set(),
  set: { quality: 'auto', fps: false, stroke: 1, music: true, cycle: false, trail: true },
  scale: 1, hz: 60, ft: [], dabs: [], dabT: 0, parts: [], fire: [], view: null, seat: null, busy: false,
};
const store = { get(k, d) { try { const v = localStorage.getItem('hzmb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hzmb.' + k, JSON.stringify(v)); } catch (e) { } } };

/* ---------- world management ---------- */
function loadWorld(id) {
  if (!G.worlds[id]) { const w = WORLDS[id](G.R); w.actorsDef = w.npcs; G.worlds[id] = w; }
  return G.worlds[id];
}
const MODELS = {};
function model(name) { if (!MODELS[name]) { const pk = buildChar(CAST[name]); const u = G.R.upload(pk, 'char'); u.sx = pk.sx; u.hasProp = pk.hasProp; MODELS[name] = u; } return MODELS[name]; }
function enterWorld(id, from) {
  const w = loadWorld(id), prev = G.wid; G.world = w; G.wid = id;
  G.actors = [];
  for (const n of w.npcs) {
    const a = new Actor(model(n.cast), { x: n.x, z: n.z, rot: n.rot || 0, pose: n.pose, scale: n.scale || 1, extra: { def: n, who: n.who, mode: n.mode || 'stand', rad: n.rad || 0, path: n.path, pi: 0, spd: n.speed || 1, yoff: n.y, sitY: n.sit, propUp: n.propUp, propBend: n.propBend, propTilt: n.propTilt } });
    a.y = n.sit !== undefined ? n.sit - 0.01 : (n.y !== undefined ? n.y : w.heightAt(a.x, a.z));
    G.actors.push(a);
  }
  const p = G.player; let sp = w.spawn;
  if (from) { const g = w.portals.find(q => q.id === from && !q.back); if (g) sp = { x: g.x + g.nx * 3.2, z: g.z + g.nz * 3.2, rot: Math.atan2(g.nx, g.nz) }; }
  p.x = sp.x; p.z = sp.z; p.rot = sp.rot; p.y = w.heightAt(p.x, p.z); p.speed = 0; p.pose = 'idle';
  G.cam.yaw = Math.PI - p.rot + (sp.cam || 0); G.cam.pitch = 0.1; G.px = p.x; G.pz = p.z;
  if (G.companion) { const c = G.companion; c.x = p.x - Math.sin(p.rot) * 1.2 + 0.8; c.z = p.z - Math.cos(p.rot) * 1.2; c.y = w.heightAt(c.x, c.z); G.actors.push(c); }
  if (!from || prev !== id) { G.tod = G.todT = (G.keepTod !== undefined ? G.keepTod : w.defTod); G.keepTod = undefined; }
  G.envTod = -1; G.dabs.length = 0; G.seat = null; G.view = null; UI.caption(null);
  UI.loc(); Music.setWorld(id);
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
  return [x, z];
}
function stepActor(a, vx, vz, dt, r) {
  const w = G.world; let nx = a.x + vx * dt, nz = a.z + vz * dt;
  const c = collide(w, nx, nz, r); nx = c[0]; nz = c[1];
  if (!w.walkable(nx, nz)) { if (w.walkable(nx, a.z)) nz = a.z; else if (w.walkable(a.x, nz)) nx = a.x; else { nx = a.x; nz = a.z; } }
  const b = w.bound;
  if (b.r) { const d = Math.hypot(nx - (b.x || 0), nz - (b.z || 0)); if (d > b.r) { nx = (b.x || 0) + (nx - (b.x || 0)) / d * b.r; nz = (b.z || 0) + (nz - (b.z || 0)) / d * b.r; } }
  else { nx = clamp(nx, b.x0, b.x1); nz = clamp(nz, b.z0, b.z1); }
  const moved = Math.hypot(nx - a.x, nz - a.z); a.x = nx; a.z = nz;
  const gy = w.heightAt(nx, nz); a.y += (gy - a.y) * Math.min(1, dt * 14);
  return moved;
}
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function updatePlayer(dt) {
  const p = G.player, I = G.inp, c = G.cam;
  let jx = I.jx, jy = I.jy;
  const k = I.keys;
  if (k.KeyW || k.ArrowUp) jy += 1; if (k.KeyS || k.ArrowDown) jy -= 1; if (k.KeyA || k.ArrowLeft) jx -= 1; if (k.KeyD || k.ArrowRight) jx += 1;
  let mag = Math.hypot(jx, jy); if (mag > 1) { jx /= mag; jy /= mag; mag = 1; }
  if (G.mode !== 'play') { mag = 0; jx = jy = 0; }
  if (G.seat && mag > 0.3) standUp();
  if (G.seat) { p.speed = 0; return; }
  const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = Math.sin(c.yaw);
  const sp = (mag < 0.12 ? 0 : (mag < 0.6 ? 2.0 * mag / 0.6 : lerp(2.0, 4.6, (mag - 0.6) / 0.4))) * (k.ShiftLeft ? 1.5 : 1);
  const wx = (fx * jy + rx * jx) / (mag || 1), wz = (fz * jy + rz * jx) / (mag || 1);
  p.vx = lerp(p.vx || 0, wx * sp, Math.min(1, dt * 9)); p.vz = lerp(p.vz || 0, wz * sp, Math.min(1, dt * 9));
  const v = Math.hypot(p.vx, p.vz);
  if (v > 0.05) {
    const moved = stepActor(p, p.vx, p.vz, dt, 0.34);
    p.speed = lerp(p.speed, moved / dt, Math.min(1, dt * 10));
    p.rot += angDiff(p.rot, Math.atan2(p.vx, p.vz)) * Math.min(1, dt * 10);
    p.phase += dt * (2.4 + p.speed * 1.75);
    if (G.time - c.lastDrag > 0.8) c.yaw += jx * dt * 1.15 * mag;
  } else { p.speed = lerp(p.speed, 0, Math.min(1, dt * 10)); p.y += (G.world.heightAt(p.x, p.z) - p.y) * Math.min(1, dt * 14); }
  // crossing a frame
  const w = G.world;
  for (const g of w.portals) {
    if (g.back) continue;
    const d0 = (G.px - g.x) * g.nx + (G.pz - g.z) * g.nz, d1 = (p.x - g.x) * g.nx + (p.z - g.z) * g.nz, lat = Math.abs((p.x - g.x) * g.nz - (p.z - g.z) * g.nx);
    if (lat < g.w && ((d0 > 0) !== (d1 > 0)) && Math.abs(d1) < 1.5) { G.mode = 'travel'; UI.hud(false); travel(g.id, G.wid); break; }
  }
  G.px = p.x; G.pz = p.z;
}

function updateNPC(a, dt) {
  const p = G.player, w = G.world;
  if (a === G.companion) {
    const tx = p.x - Math.sin(p.rot) * 1.25 + Math.cos(p.rot) * 0.95, tz = p.z - Math.cos(p.rot) * 1.25 - Math.sin(p.rot) * 0.95;
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    if (d > 30) { a.x = tx; a.z = tz; a.y = w.heightAt(tx, tz); }
    if (d > 0.5) { const sp = Math.min(5.2, 0.6 + d * 1.6); const mv = stepActor(a, dx / d * sp, dz / d * sp, dt, 0.3); a.speed = lerp(a.speed, mv / dt, Math.min(1, dt * 8)); a.rot += angDiff(a.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 8); a.phase += dt * (2.4 + a.speed * 1.75); }
    else { a.speed = lerp(a.speed, 0, Math.min(1, dt * 8)); a.rot += angDiff(a.rot, p.rot) * Math.min(1, dt * 2); a.y += (w.heightAt(a.x, a.z) - a.y) * Math.min(1, dt * 14); }
    return;
  }
  const pd = Math.hypot(p.x - a.x, p.z - a.z);
  if (a.mode === 'path' || a.mode === 'wander') {
    if (a.mode === 'wander') { a.wait -= dt; if (a.wait < 0) { const an = Math.random() * TAU, r = Math.random() * a.rad; a.tx = a.home[0] + Math.cos(an) * r; a.tz = a.home[1] + Math.sin(an) * r; a.wait = 3 + Math.random() * 5; } }
    else { const q = a.path[a.pi]; a.tx = q[0]; a.tz = q[1]; if (Math.hypot(q[0] - a.x, q[1] - a.z) < 0.6) a.pi = (a.pi + 1) % a.path.length; }
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
    if (d > 0.25 && !(pd < 2.2 && a.who)) {
      const sp = a.spd; a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; a.speed = lerp(a.speed, sp, dt * 5); a.rot += angDiff(a.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 5); a.phase += dt * (2.4 + a.speed * 1.75);
      a.y = (a.yoff !== undefined ? a.yoff : w.heightAt(a.x, a.z));
    } else a.speed = lerp(a.speed, 0, dt * 6);
  } else if (a.mode === 'follow') {
    const l = G.actors[G.actors.indexOf(a) + a.def.of]; if (l) { a.x = l.x + Math.cos(l.rot) * a.def.side; a.z = l.z - Math.sin(l.rot) * a.def.side; a.rot = l.rot; a.speed = l.speed; a.phase = l.phase + 0.4; a.y = w.heightAt(a.x, a.z); }
  }
  // glance at the visitor
  let look = 0;
  if (pd < 6 && a.pose !== 'wash') { look = clamp(angDiff(a.rot, Math.atan2(p.x - a.x, p.z - a.z)), -1.1, 1.1); if (a.mode === 'stand' && pd < 3 && a.pose !== 'sit' && a.pose !== 'paint') a.rot += angDiff(a.rot, Math.atan2(p.x - a.x, p.z - a.z)) * Math.min(1, dt * 1.5); }
  else if (a.mode === 'stand' && a.pose !== 'sit') a.rot += angDiff(a.rot, a.homeRot) * Math.min(1, dt);
  a.look += (look - a.look) * Math.min(1, dt * 4);
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  const c = G.cam, p = G.player, w = G.world, R = G.R, asp = R.w / R.h;
  const fov = asp < 1 ? 1.22 : 0.98;
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
    const hy = (G.seat ? 1.05 : 1.42), tx = c.tx, ty = c.ty + hy, tz = c.tz;
    const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    let dist = c.dist;
    // pull the camera in front of walls
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
    c.eye = [ex, ey, ez]; c.look = [lx, ly, lz];
  }
  let dx = lx - ex, dy = ly - ey, dz = lz - ez; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
  let rx = -dz, rz = dx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
  const ux = -rz * dy, uy = rz * dx - rx * dz, uz = rx * dy;
  M4.view(c.view, [ex, ey, ez], [rx, 0, rz], [ux, uy, uz], [-dx, -dy, -dz]);
  M4.persp(c.proj, fov, asp, 0.25, 520); M4.mul(c.vp, c.proj, c.view);
  c.pos[0] = ex; c.pos[1] = ey; c.pos[2] = ez; c.fwd[0] = dx; c.fwd[1] = dy; c.fwd[2] = dz;
  const th = Math.tan(fov / 2);
  c.skyR[0] = rx * th * asp; c.skyR[1] = 0; c.skyR[2] = rz * th * asp; c.skyU[0] = ux * th; c.skyU[1] = uy * th; c.skyU[2] = uz * th;
  c.r = [rx, 0, rz]; c.u = [ux, uy, uz];
}

/* ---------- interactions ---------- */
function nearest() {
  const p = G.player, w = G.world; let best = null, bd = 1e9;
  for (const a of G.actors) { if (!a.who || a === G.companion) continue; const d = Math.hypot(a.x - p.x, a.z - p.z); if (d < 2.7 && d < bd) { bd = d; best = { type: 'npc', a }; } }
  if (!G.seat) for (const s of w.seats) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < 1.5 && d < bd) { let used = false; for (const a of G.actors) if (Math.hypot(a.x - s.x, a.z - s.z) < 0.5) used = true; if (!used) { bd = d; best = { type: 'seat', s }; } } }
  return best;
}
function spotHere() { const p = G.player; for (const s of G.world.spots) if (Math.hypot(s.x - p.x, s.z - p.z) < s.r) return s; return null; }
function sitDown(s) {
  const p = G.player; G.seat = s; p.x = s.x; p.z = s.z; p.rot = s.rot; p.y = s.y; p.pose = 'sit'; p.speed = 0; G.cam.pitch = 0.16; G.cam.dist = 4.6;
  if (s.tag === 'tea') { G.todT = (Math.round(G.todT) + 1) % 3; UI.toast('一盏茶的工夫', ['白天', '黄昏', '夜晚'][G.todT] + '到了', 2600); }
  UI.act();
}
function standUp() { const p = G.player, s = G.seat; if (!s) return; G.seat = null; p.pose = 'idle'; p.x = s.x + Math.sin(s.rot) * 0.75; p.z = s.z + Math.cos(s.rot) * 0.75; p.y = G.world.heightAt(p.x, p.z); G.cam.dist = 5.4; UI.act(); }
function painterView(s) {
  const c = G.cam, v = s.view; G.view = { t: 0, out: false, fp: c.eye.slice(), ft: c.look.slice(), p: v.p, to: v.t, spot: s };
  if (v.tod !== undefined) G.todT = v.tod;
  G.mode = 'view'; UI.hud(false); UI.caption(ART[s.art]);
}
function leaveView() { const v = G.view; if (!v || v.out) return; v.out = true; v.t = 0; UI.caption(null); }
function invite(a) {
  if (G.companion) { const o = G.companion; o.mode = o.def.mode || 'stand'; if (!G.world.npcs.includes(o.def)) G.actors.splice(G.actors.indexOf(o), 1); }
  G.companion = a; a.mode = 'companion'; if (a.pose === 'sit' || a.pose === 'wash' || a.pose === 'paint') a.pose = 'idle';
  UI.toast(PEOPLE[a.who].n, '愿意陪你走一段', 2400); UI.act();
}
function dismiss() { const a = G.companion; if (!a) return; G.companion = null; a.mode = a.def.mode || 'stand'; a.pose = a.def.pose || 'idle'; if (G.world.npcs.includes(a.def)) { a.x = a.home[0]; a.z = a.home[1]; a.y = a.def.sit !== undefined ? a.def.sit - 0.01 : (a.def.y !== undefined ? a.def.y : G.world.heightAt(a.x, a.z)); a.rot = a.homeRot; } else G.actors.splice(G.actors.indexOf(a), 1); UI.act(); }

/* ---------- little living things ---------- */
const TRAIL = ['#f6d24a', '#3f72c0', '#e8762a', '#8fc0a2', '#f3c9d6', '#f2efe2'].map(hex);
function sprites(dt) {
  const R = G.R, c = G.cam, w = G.world, e = G.env, p = G.player, r = c.r, u = c.u, night = e.lampAmt;
  R.sprBegin();
  const sh = 0.30 * (1 - 0.45 * e.nightMix);
  for (const a of G.actors.concat([p])) { if (a.hidden) continue; const d = Math.hypot(a.x - c.pos[0], a.z - c.pos[2]); if (d > 60) continue; const s = 0.46 * a.scale; R.spr(0, a.x, a.y + 0.05, a.z, s, 0, 0, 0, 0, s, 0.03, 0.04, 0.12, a.pose === 'sit' ? sh * 0.6 : sh); }
  // paint left behind by your steps
  if (G.set.trail) {
    if (p.speed > 0.8 && !G.seat) { G.dabT -= dt * p.speed; if (G.dabT < 0) { G.dabT = 0.62; const sd = (G.dabs.n = (G.dabs.n || 0) + 1) % 2 ? 1 : -1; G.dabs.push({ x: p.x + Math.cos(p.rot) * 0.12 * sd, y: p.y + 0.07, z: p.z - Math.sin(p.rot) * 0.12 * sd, t: 0, c: TRAIL[Math.floor(G.time * 0.35) % TRAIL.length], a: p.rot }); if (G.dabs.length > 46) G.dabs.shift(); } }
    for (const q of G.dabs) { q.t += dt; const al = Math.max(0, 1 - q.t / 7) * 0.7; if (al <= 0) continue; const ca = Math.cos(q.a), sa = Math.sin(q.a); R.spr(0, q.x, q.y, q.z, ca * 0.1, 0, -sa * 0.1, sa * 0.2, 0, ca * 0.2, q.c[0], q.c[1], q.c[2], al); }
  }
  if (night > 0.02) for (const g of w.glows) { const d = Math.hypot(g.x - c.pos[0], g.z - c.pos[2]); if (d > 130 || !R.visible(g.x, g.y, g.z, g.s)) continue; const s = g.s * (1 + d * 0.012), k = night * (0.75 + 0.08 * Math.sin(G.time * 3 + g.x)); R.spr(1, g.x, g.y, g.z, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, g.col[0], g.col[1], g.col[2], k); }
  // fireflies after dark
  if (night > 0.6 && w.extra.fireflies !== 0) {
    if (!G.fire.length) for (let i = 0; i < 16; i++) G.fire.push({ x: Math.random() * 30 - 15, y: 0.4 + Math.random() * 1.6, z: Math.random() * 30 - 15, ph: Math.random() * 9 });
    for (const f of G.fire) {
      const fx = p.x + ((f.x + Math.sin(G.time * 0.3 + f.ph) * 1.5 - p.x % 30 + 45) % 30) - 15, fz = p.z + ((f.z + Math.cos(G.time * 0.23 + f.ph) * 1.5 - p.z % 30 + 45) % 30) - 15;
      const gy = w.heightAt(fx, fz); if (gy < w.waterY + 0.1) continue; const bl = Math.max(0, Math.sin(G.time * 1.7 + f.ph * 3)); if (bl < 0.05) continue;
      const s = 0.22; R.spr(1, fx, gy + f.y + Math.sin(G.time + f.ph) * 0.3, fz, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, 0.8, 1.0, 0.45, bl * 0.9);
    }
  }
  // petals
  for (const z of w.petals) {
    const d = Math.hypot(p.x - z.x, p.z - z.z); if (d > z.r + 14) continue;
    for (let i = 0; i < 40; i++) {
      const h1 = hash2(i, 7), h2 = hash2(i, 13), h3 = hash2(i, 29), t = G.time * (0.25 + h3 * 0.25) + h1 * 10, fall = t % 1;
      const px = z.x + (h1 * 2 - 1) * z.r + Math.sin(t * 2 + i) * 0.6 + G.time * 0.0, pz = z.z + (h2 * 2 - 1) * z.r + Math.cos(t * 1.7 + i) * 0.6, py = w.heightAt(px, pz) + 5.5 * (1 - fall);
      const s = 0.07, a = t * 3; R.spr(0, px, py, pz, r[0] * s * Math.cos(a) + u[0] * s * Math.sin(a), u[1] * s * Math.sin(a), r[2] * s * Math.cos(a) + u[2] * s * Math.sin(a), u[0] * s * 0.6, u[1] * s * 0.6, u[2] * s * 0.6, z.col[0], z.col[1], z.col[2], Math.min(1, fall * 6) * Math.min(1, (1 - fall) * 5) * 0.95);
    }
  }
  // crows over the wheat: they scatter when you walk in
  for (const b of w.birds) {
    const pd = Math.hypot(p.x - b.x, p.z - b.z); b.ex = lerp(b.ex || 0, pd < b.r * 0.8 ? 1 : 0, dt * 0.8);
    for (let i = 0; i < b.n; i++) {
      const h1 = hash2(i, 3), h2 = hash2(i, 11), sp = 0.16 + h1 * 0.14, a = G.time * sp * (i % 2 ? 1 : -1) + h1 * 20, rr = b.r * (0.25 + h2 * 0.75) * (1 + b.ex * 0.5);
      const x = b.x + Math.cos(a) * rr, z = b.z + Math.sin(a * 1.13) * rr * 0.8, y = w.heightAt(b.x, b.z) + b.y * (0.35 + h2 * 0.9) + b.ex * 6 * h1 + Math.sin(G.time * 0.6 + i) * 1.2;
      const s = (b.s || 0.62) * (0.8 + h1 * 0.5), flap = Math.sin(G.time * (6 + h2 * 3) + i * 2);
      R.spr(2, x, y, z, r[0] * s, 0, r[2] * s, u[0] * s, u[1] * s, u[2] * s, b.col ? b.col[0] : 0.05, b.col ? b.col[1] : 0.05, b.col ? b.col[2] : 0.10, flap);
    }
  }
}

/* ---------- frame ---------- */
function env() {
  if (Math.abs(G.tod - G.envTod) > 1e-4 || !G.env) { G.env = envAt(G.world.env, G.tod); G.envTod = G.tod; G.env.strokeAmt *= G.set.stroke; }
  return G.env;
}
let lastT = 0, acc = 0, frames = 0, fpsShown = 0, slow = 0, fast = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (G.pause) { lastT = t / 1000; return; }
  G.fc = (G.fc || 0) + 1;
  const now = t / 1000; let dt = now - lastT; lastT = now; if (dt > 0.1) dt = 0.1; if (dt <= 0) return;
  G.time += dt;
  // adaptive resolution keeps the frame rate at the display's refresh
  acc += dt; frames++;
  if (dt < 1 / (G.hz * 1.25) && frames > 10) G.hz = dt < 0.0075 ? 144 : dt < 0.0095 ? 120 : dt < 0.0125 ? 90 : G.hz;
  if (acc >= 0.5) {
    const fps = frames / acc; fpsShown = fps; acc = 0; frames = 0;
    if (G.set.fps) $('fps').textContent = Math.round(fps) + ' fps · ' + Math.round(G.scale * 100) + '% · ' + Math.round(G.R.drawn / 3000) + 'k△';
    if (G.set.quality === 'auto' && G.mode !== 'title') {
      if (fps < G.hz * 0.90) { slow++; fast = 0; if (slow >= 2) { G.scale = Math.max(0.5, G.scale - 0.1); slow = 0; resize(); } }
      else if (fps > G.hz * 0.97) { fast++; slow = 0; if (fast >= 6 && G.scale < 1) { G.scale = Math.min(1, G.scale + 0.05); fast = 0; resize(); } }
    }
  }
  if (!G.world) return;
  const w = G.world, p = G.player, R = G.R;
  if (G.set.cycle && G.mode === 'play') { G.todT += dt / 80; if (G.todT >= 3) G.todT -= 3; G.tod = G.todT <= 2 ? G.todT : 2 - (G.todT - 2) * 2; }
  else if (G.tod !== G.todT) { const d = G.todT - G.tod, s = dt / 2.6; G.tod = Math.abs(d) < s ? G.todT : G.tod + Math.sign(d) * s; }
  updatePlayer(dt);
  for (const a of G.actors) updateNPC(a, dt);
  updateCamera(dt);
  const e = env();
  // actors: skin + light
  const c = G.cam, list = G.actors;
  R.begin(c, e, G.time);
  R.drawWorld(w.solid);
  if (w.detail) R.drawWorld(w.detail, w.detailDist * (G.set.quality === 'fast' ? 0.6 : 1));
  if (w.portalMesh) R.drawPortals(w.portalMesh, w.portals);
  R.beginChars();
  for (let i = -1; i < list.length; i++) {
    const a = i < 0 ? p : list[i]; if (a.hidden) continue;
    const d = Math.hypot(a.x - c.pos[0], a.z - c.pos[2]); if (d > 110 || !R.visible(a.x, a.y + 0.9, a.z, 1.6)) continue;
    a.animate(G.time);
    let lr = 0, lg = 0, lb = 0;
    if (e.lampAmt > 0.01) for (const l of w.lamps) { const dx = l.x - a.x, dz = l.z - a.z, dy = l.y - a.y - 1, d2 = dx * dx + dy * dy + dz * dz; if (d2 < l.r * l.r) { const at = 1 - Math.sqrt(d2) / l.r, k = at * at * l.k * e.lampAmt; lr += l.col[0] * k; lg += l.col[1] * k; lb += l.col[2] * k; } }
    a.lamp[0] = Math.min(lr, 1.2); a.lamp[1] = Math.min(lg, 1.2); a.lamp[2] = Math.min(lb, 1.2);
    R.drawChar(a.model, a.bones, a.lamp, d < 45 ? a.outline : 0);
  }
  if (w.water) {
    const rf = G.rf || (G.rf = new Float32Array(32)); rf.fill(0); let n = 0;
    const cand = w.refl.map(l => ({ l, d: Math.hypot(l.refl[0] - c.pos[0], l.refl[1] - c.pos[2]) })).sort((a, b) => a.d - b.d);
    for (const q of cand) { if (n >= 8) break; const f = q.l.refl; rf[n * 4] = f[0]; rf[n * 4 + 1] = f[1]; rf[n * 4 + 2] = f[2]; rf[n * 4 + 3] = f[3]; n++; }
    for (; n < 8; n++) { rf[n * 4] = 1e5; rf[n * 4 + 1] = 1e5; rf[n * 4 + 2] = 1; rf[n * 4 + 3] = 1; }
    R.drawWater(w.water, rf);
  }
  R.drawSky();
  sprites(dt);
  R.sprFlush();
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
  const dpr = Math.min(window.devicePixelRatio || 1, G.set.quality === 'fine' ? 3 : 2), q = G.set.quality === 'fast' ? 0.62 : G.set.quality === 'fine' ? 1 : G.scale;
  G.R.resize(G.LW, G.LH, dpr * q);
}

/* ---------- input ---------- */
function bindInput() {
  const cv = $('c'), I = G.inp, st = $('stick'), nub = $('nub');
  const down = e => {
    if (G.mode === 'view') { leaveView(); return; }
    if (G.mode === 'photo') { UI.photo(false); return; }
    if (G.mode !== 'play') return;
    Music.start();
    const x = PX(e), y = PY(e), left = x < G.LW * 0.42 && y > G.LH * 0.22;
    if (left && !I.stick && e.pointerType !== 'mouse') { I.stick = { id: e.pointerId, x, y }; st.style.left = x + 'px'; st.style.top = y + 'px'; st.classList.add('on'); nub.style.transform = 'translate(-50%,-50%)'; }
    else I.looks.set(e.pointerId, { x, y });
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  };
  const move = e => {
    const x = PX(e), y = PY(e);
    if (I.stick && e.pointerId === I.stick.id) {
      let dx = x - I.stick.x, dy = y - I.stick.y; const R0 = 56, l = Math.hypot(dx, dy); if (l > R0) { dx *= R0 / l; dy *= R0 / l; }
      I.jx = dx / R0; I.jy = -dy / R0; nub.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    } else if (I.looks.has(e.pointerId)) {
      const q = I.looks.get(e.pointerId);
      if (I.looks.size >= 2) { const o = [...I.looks.entries()].find(k => k[0] !== e.pointerId)[1]; const d0 = Math.hypot(q.x - o.x, q.y - o.y), d1 = Math.hypot(x - o.x, y - o.y); G.cam.dist = clamp(G.cam.dist * (d0 / Math.max(1, d1)), 2.4, 11); }
      else { G.cam.yaw += (x - q.x) * 0.0052; G.cam.pitch = clamp(G.cam.pitch + (y - q.y) * 0.004, -0.42, 1.15); G.cam.lastDrag = G.time; }
      q.x = x; q.y = y;
    }
  };
  const up = e => { if (I.stick && e.pointerId === I.stick.id) { I.stick = null; I.jx = I.jy = 0; st.classList.remove('on'); } I.looks.delete(e.pointerId); };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { G.cam.dist = clamp(G.cam.dist * (1 + Math.sign(e.deltaY) * 0.08), 2.4, 11); e.preventDefault(); }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => { I.keys[e.code] = true; if (e.code === 'KeyE' || e.code === 'Enter') UI.primary(); if (e.code === 'Escape') { leaveView(); UI.closeAll(); } });
  window.addEventListener('keyup', e => { I.keys[e.code] = false; });
  window.addEventListener('blur', () => { I.keys = {}; I.jx = I.jy = 0; });
  window.addEventListener('resize', resize);
}

function boot() {
  const cv = $('c');
  try { G.R = new Renderer(cv); } catch (e) { $('err').textContent = '这个浏览器不支持 WebGL2，无法打开画布。' + (e && e.message ? '（' + String(e.message).slice(0, 120) + '）' : ''); $('err').hidden = false; return; }
  const R = G.R; R.makeStroke('oil', 'oil', 7); R.makeStroke('dots', 'dots', 11); R.makeStroke('paper', 'paper', 5); R.makeStroke('dab', 'dab', 3);
  Object.assign(G.set, store.get('set', {})); G.found = new Set(store.get('found', [])); G.met = new Set(store.get('met', []));
  G.scale = 1; resize();
  G.player = new Actor(model('player'), { x: 0, z: 0, rot: Math.PI, outline: 0.012 });
  bindInput(); UI.init();
  enterWorld('town'); G.mode = 'title';
  // slow orbit behind the title
  requestAnimationFrame(t => { lastT = t / 1000; requestAnimationFrame(frame); });
}
window.addEventListener('DOMContentLoaded', boot);
