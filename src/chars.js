'use strict';
/* Stylised figures: one skinned mesh each (rigid bones), toon shading + ink outline. */
const B = { hips: 0, chest: 1, head: 2, uaL: 3, faL: 4, uaR: 5, faR: 6, thL: 7, shL: 8, thR: 9, shR: 10, skirt: 11, prop: 12, hair: 13 };
const NB = 16;

function buildChar(sp) {
  const m = new Mesh(6000), W = sp.w || 1;
  const bone = (b, unlit) => { m.sw = b + (unlit ? 0.5 : 0); };
  const col = (c, o) => m.c(c, o === undefined ? 1 : o);
  const skin = hex(sp.skin || '#f5d0ae'), top = hex(sp.top || '#e2b23c'), legC = hex(sp.legs || '#2d3e63'), shoe = hex(sp.shoes || '#4a3024');
  const hairC = hex(sp.hair || '#3a2a26'), sleeve = hex(sp.sleeve || sp.top || '#e2b23c');
  const SX = 0.168 * W, HX = 0.085;
  const style = sp.style || 'jacket';

  /* legs */
  for (const s of [1, -1]) {
    const x = HX * s;
    bone(s > 0 ? B.thL : B.thR); col(legC); m.cyl(x, 0.46, 0, 0.053, 0.072, 0.40, 8, 0); m.ell(x, 0.46, 0, 0.055, 0.055, 0.055, 8, 5);
    bone(s > 0 ? B.shL : B.shR); col(sp.socks ? hex(sp.socks) : legC); m.cyl(x, 0.09, 0, 0.042, 0.053, 0.37, 8, 0);
    col(shoe); m.ell(x, 0.052, 0.035, 0.056, 0.052, 0.105, 8, 5);
  }
  /* torso */
  const kz = 0.66;
  if (style === 'robe') {
    bone(B.skirt); col(top);
    m.lathe(0, 0, 0, [[0.25 * W, 0.03], [0.235 * W, 0.3], [0.19 * W, 0.62], [0.145 * W, 0.9], [0.13 * W, 0.99]], 12, 0.8);
  } else {
    bone(B.hips); col(sp.hipCol ? hex(sp.hipCol) : (style === 'dress' ? top : legC));
    m.lathe(0, 0, 0, [[0.10, 0.74], [0.13 * W, 0.80], [0.138 * W, 0.87], [0.130 * W, 0.93], [0.124 * W, 0.99]], 12, kz + 0.06);
  }
  bone(B.chest); col(top);
  m.lathe(0, 0, 0, [[0.126 * W, 0.97], [0.134 * W, 1.07], [0.156 * W, 1.19], [0.162 * W, 1.26], [0.125 * W, 1.315], [0.05, 1.35]], 12, kz);
  if (sp.belly) m.ell(0, 1.03, 0.03, 0.15 * W, 0.13, 0.12 * W, 10, 6);
  col(skin); m.cyl(0, 1.30, 0, 0.046, 0.046, 0.09, 8, 0);
  if (style === 'dress' || style === 'skirt') {
    bone(B.skirt); col(sp.skirt || sp.top);
    const L = sp.skirtLen === undefined ? 0.16 : sp.skirtLen, R = sp.skirtR || 0.30;
    m.lathe(0, 0, 0, [[R, L], [R * 0.93, L + (0.97 - L) * 0.3], [R * 0.7, L + (0.97 - L) * 0.65], [0.132 * W, 0.99]], 14, 0.9);
    if (sp.bustle) m.ell(0, 0.78, -0.2, 0.2, 0.24, 0.2, 10, 6);
    if (sp.apron) { col(sp.apron); m.push().T(0, 0, 0.012); m.lathe(0, 0, 0, [[R * 0.98, L + 0.06], [R * 0.9, L + (0.97 - L) * 0.33], [R * 0.69, L + (0.97 - L) * 0.66], [0.134 * W, 0.985]], 10, 0.9, 0.62); m.pop(); }
  }
  if (style === 'coat' || style === 'smock') {
    bone(B.skirt); col(top);
    const L = style === 'coat' ? 0.50 : 0.64;
    m.lathe(0, 0, 0, [[0.185 * W, L], [0.17 * W, L + 0.16], [0.14 * W, 0.92], [0.128 * W, 0.99]], 12, 0.72);
  }
  if (style === 'baggy') { bone(B.skirt); col(sp.skirt || sp.legs); m.lathe(0, 0, 0, [[0.10, 0.36], [0.215, 0.44], [0.235, 0.62], [0.19, 0.82], [0.13, 0.98]], 12, 0.78); }
  /* trims on the chest */
  bone(B.chest);
  if (sp.buttons) { col(sp.buttons, 0); const rows = sp.buttonRows || 1; for (let r = 0; r < rows; r++) for (let i = 0; i < 4; i++) m.ell((rows > 1 ? (r ? 0.045 : -0.045) : 0) * W, 1.02 + i * 0.072, (0.124 + i * 0.006) * W * kz + 0.012, 0.014, 0.014, 0.01, 6, 4); }
  if (sp.fichu) { col(sp.fichu); m.push().T(0, 1.16, 0.062 * W).RX(-0.18); m.ell(0, 0, 0, 0.115 * W, 0.15, 0.06, 10, 6); m.pop(); }
  if (sp.collar) { col(sp.collar); m.lathe(0, 0, 0, [[0.085, 1.295], [0.078, 1.335], [0.058, 1.36]], 10, 0.9); }
  if (sp.scarf) { col(sp.scarf); m.lathe(0, 0, 0, [[0.082, 1.29], [0.096, 1.325], [0.085, 1.365], [0.06, 1.385]], 10, 0.95); m.push().T(0.05, 1.3, 0.085).RZ(0.12).RX(0.1); m.box(0, -0.2, 0, 0.065, 0.2, 0.02); m.pop(); }
  if (sp.trim) { col(sp.trim, 0); m.push().T(0, 0, 0.004); m.lathe(0, 0, 0, [[0.132 * W, 1.0], [0.137 * W, 1.07], [0.158 * W, 1.19]], 4, kz, 0.16); m.pop(); for (const s of [1, -1]) m.ell(0.07 * s * W, 1.13, 0.098 * W, 0.035, 0.05, 0.012, 8, 4); }
  if (sp.bag) { col(sp.bag); m.push().T(-0.19 * W, 0.92, 0.02); m.box(0, -0.11, 0, 0.07, 0.2, 0.22, 63); m.pop(); m.push().T(0, 1.14, 0).RZ(0.62); m.lathe(0, 0, 0, [[0.172 * W, -0.012], [0.172 * W, 0.012]], 12, 0.72); m.pop(); }
  /* arms */
  for (const s of (sp.noArms ? [] : [1, -1])) {
    const x = SX * s;
    bone(s > 0 ? B.uaL : B.uaR); col(sleeve); m.ell(x, 1.275, 0, 0.061, 0.061, 0.061, 8, 5); m.cyl(x, 1.04, 0, 0.044, 0.055, 0.235, 8, 0);
    bone(s > 0 ? B.faL : B.faR); m.ell(x, 1.04, 0, 0.046, 0.046, 0.046, 8, 5);
    if (sp.shortSleeve) col(skin);
    m.cyl(x, 0.83, 0, 0.037, 0.044, 0.21, 8, 0);
    if (sp.cuff) { col(sp.cuff); m.cyl(x, 0.83, 0, 0.044, 0.046, 0.04, 8, 0); }
    col(skin); m.ell(x, 0.79, 0, 0.04, 0.046, 0.04, 8, 5);
  }
  /* head */
  bone(B.head);
  const HY = 1.50, face = sp.face || {};
  if (sp.skull) {
    col(skin); m.ell(0, HY + 0.02, 0, 0.14, 0.2, 0.15, 14, 10);
    bone(B.head, 1); col('#1b1a22', 0);
    m.ell(0.052, HY + 0.045, 0.128, 0.03, 0.034, 0.012, 8, 5); m.ell(-0.052, HY + 0.045, 0.128, 0.03, 0.034, 0.012, 8, 5);
    m.ell(0, HY - 0.085, 0.124, 0.03, 0.052, 0.012, 8, 5);
    col('#6d5a3c', 0); m.ell(0.012, HY - 0.012, 0.148, 0.007, 0.012, 0.005, 6, 4); m.ell(-0.012, HY - 0.012, 0.148, 0.007, 0.012, 0.005, 6, 4);
  } else {
    col(skin); m.ell(0, HY, 0.004, 0.158, 0.172, 0.158, 16, 11);
    m.ell(0.156, HY - 0.012, 0, 0.022, 0.036, 0.026, 6, 4); m.ell(-0.156, HY - 0.012, 0, 0.022, 0.036, 0.026, 6, 4);
    col(mixc(skin, [0.80, 0.45, 0.35], 0.35), 0); m.ell(0, HY - 0.038, 0.158, 0.012, 0.012, 0.012, 6, 4);
    /* eyes */
    const ec = hex(face.eye || '#2b2a44'), ex = 0.062, ey = HY - 0.006, ez = 0.143, eh = face.eyeH || 0.037;
    for (const s of [1, -1]) {
      bone(B.head, 1);
      col('#fbf8f0', 0); m.ell(ex * s, ey, ez - 0.003, 0.031, eh + 0.004, 0.012, 10, 6);
      col(ec, 0); m.ell(ex * s, ey - 0.002, ez + 0.004, 0.024, eh - 0.003, 0.011, 10, 6);
      col(mulc(ec, 0.35), 0); m.ell(ex * s, ey - 0.004, ez + 0.009, 0.013, eh * 0.55, 0.008, 8, 5);
      col('#ffffff', 0); m.ell(ex * s + 0.011, ey + 0.014, ez + 0.014, 0.008, 0.01, 0.005, 6, 4);
      bone(B.head);
      col(mulc(hairC, 0.55), 0); m.push().T(ex * s, ey + eh + 0.006, ez + 0.002).RZ(-0.1 * s * (face.sad ? -2.2 : 1)); m.box(0, -0.004, 0, 0.062, 0.01, 0.012, 63); m.pop();
      col(mulc(sp.brow ? hex(sp.brow) : hairC, 0.8), 0); m.push().T(ex * s, ey + eh + 0.034, ez - 0.004).RZ((face.sad ? 0.28 : -0.12) * s); m.box(0, -0.005, 0, 0.058, 0.011, 0.01, 63); m.pop();
      if (face.blush !== 0) { col(mixc(skin, [0.95, 0.45, 0.42], face.blush || 0.38), 0); m.ell(0.098 * s, HY - 0.052, 0.116, 0.03, 0.017, 0.012, 8, 4); }
    }
    col(face.mouth || '#a8453c', 0);
    if (face.open) m.ell(0, HY - 0.086, 0.146, 0.02, 0.02, 0.008, 8, 4); else m.push().T(0, HY - 0.084, 0.147).box(0, -0.004, 0, 0.034, 0.008, 0.008, 63).pop();
  }
  /* hair */
  const hs = sp.hairStyle || 'short';
  if (hs !== 'bald' && !sp.skull) {
    bone(B.head); col(hairC);
    m.push().T(0, HY + 0.004, -0.004).RX(-0.5); m.ell(0, 0, 0, 0.169, 0.184, 0.171, 16, 8, 0, 0.60); m.pop();
    if (hs !== 'swept') for (let i = -2; i <= 2; i++) { m.push().T(i * 0.052, HY + 0.108 - Math.abs(i) * 0.016, 0.108 - Math.abs(i) * 0.02).RZ(i * -0.2).RX(0.5); m.ell(0, 0, 0, 0.042, 0.062, 0.03, 8, 5); m.pop(); }
    if (hs === 'bun') { m.ell(0, HY + 0.15, -0.09, 0.075, 0.07, 0.075, 10, 7); }
    if (hs === 'chignon') { m.ell(0, HY + 0.02, -0.165, 0.085, 0.08, 0.07, 10, 7); }
    if (hs === 'bob') { m.push().T(0, HY - 0.06, -0.03); m.lathe(0, 0, 0, [[0.172, -0.07], [0.178, 0.0], [0.165, 0.1]], 14, 0.92, 1); m.pop(); for (const s of [1, -1]) m.ell(0.14 * s, HY - 0.06, 0.05, 0.045, 0.11, 0.06, 8, 5); }
    if (hs === 'long') { bone(B.hair); m.push().T(0, HY - 0.1, -0.1); m.lathe(0, 0, 0, [[0.06, -0.42], [0.13, -0.3], [0.15, -0.05], [0.14, 0.12]], 12, 0.6); m.pop(); bone(B.head); for (const s of [1, -1]) m.ell(0.145 * s, HY - 0.07, 0.03, 0.04, 0.13, 0.055, 8, 5); }
    if (hs === 'curly') for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; m.ell(Math.cos(a) * 0.14, HY + 0.07 + Math.sin(a * 2) * 0.02, Math.sin(a) * 0.13 - 0.02, 0.06, 0.06, 0.06, 6, 4); }
  }
  /* beard */
  if (sp.beard) {
    bone(B.head); col(sp.beard);
    const bs = sp.beardStyle || 'full';
    for (const s of [1, -1]) m.push().T(0.034 * s, HY - 0.062, 0.153).RZ(0.45 * s).ell(0, 0, 0, 0.04, 0.014, 0.014, 8, 4).pop();
    if (bs !== 'mustache') {
      m.ell(0, HY - 0.125, 0.075, 0.125, 0.085, 0.095, 12, 7);
      for (const s of [1, -1]) m.ell(0.12 * s, HY - 0.07, 0.05, 0.045, 0.085, 0.07, 8, 5);
      if (bs === 'fork') for (const s of [1, -1]) m.push().T(0.05 * s, HY - 0.21, 0.09).RZ(0.22 * s).ell(0, 0, 0, 0.055, 0.1, 0.055, 8, 6).pop();
      if (bs === 'long') m.ell(0, HY - 0.22, 0.085, 0.07, 0.13, 0.055, 8, 6);
    }
  }
  /* hats */
  const hat = sp.hat;
  if (hat) {
    bone(B.head);
    const hc = hex(hat.col), band = hat.band ? hex(hat.band) : null, y = HY + 0.105;
    switch (hat.type) {
      case 'straw':
        m.push().T(0, y, 0).RX(-0.1); col(hc); m.lathe(0, 0, 0, [[0.30, -0.012], [0.31, 0.0], [0.30, 0.012], [0.14, 0.026]], 16); m.cyl(0, -0.012, 0, 0.30, 0.31, 0.012, 16, 2);
        m.cyl(0, 0.02, 0, 0.145, 0.125, 0.10, 14, 1); if (band) { col(band); m.cyl(0, 0.022, 0, 0.149, 0.146, 0.03, 14, 0); } m.pop(); break;
      case 'kasa': m.push().T(0, y - 0.02, 0); col(hc); m.cyl(0, 0, 0, 0.34, 0.0, 0.17, 16, 2); m.pop(); break;
      case 'cap':
        m.push().T(0, y - 0.02, 0).RX(-0.08); col(hc); m.cyl(0, 0, 0, 0.165, 0.185, 0.09, 14, 1);
        if (band) { col(band); m.cyl(0, 0.0, 0, 0.169, 0.172, 0.032, 14, 0); col(band, 0); m.ell(0, 0.058, 0.176, 0.02, 0.02, 0.008, 6, 4); }
        col('#15161f'); m.push().T(0, 0.0, 0.13).RX(0.35); m.ell(0, 0, 0, 0.12, 0.012, 0.085, 10, 4); m.pop(); m.pop(); break;
      case 'beret':
        m.push().T(0.02, y - 0.005, -0.01).RZ(-0.2).RX(-0.12); col(hc); m.ell(0, 0.035, 0, 0.2, 0.062, 0.2, 14, 6); m.cyl(0, -0.01, 0, 0.158, 0.165, 0.03, 14, 0); m.cyl(0, 0.09, 0, 0.012, 0.008, 0.03, 5, 1); m.pop(); break;
      case 'top':
        m.push().T(0, y - 0.012, 0); col(hc); m.cyl(0, 0, 0, 0.235, 0.235, 0.014, 16, 3); m.cyl(0, 0.014, 0, 0.143, 0.152, 0.2, 14, 1); if (band) { col(band); m.cyl(0, 0.016, 0, 0.147, 0.148, 0.035, 14, 0); } m.pop(); break;
      case 'bowler':
        m.push().T(0, y - 0.012, 0); col(hc); m.cyl(0, 0, 0, 0.215, 0.215, 0.014, 16, 3); m.ell(0, 0.014, 0, 0.15, 0.125, 0.15, 12, 6, 0, 0.5); m.pop(); break;
      case 'white':
        m.push().T(0, y - 0.01, 0).RX(-0.08); col(hc); m.ell(0, 0.02, 0, 0.172, 0.075, 0.172, 14, 6); m.push().T(0, 0.0, 0.14).RX(0.3); m.ell(0, 0, 0, 0.1, 0.012, 0.06, 10, 4); m.pop(); m.pop(); break;
      case 'chechia':
        m.push().T(0, y - 0.015, 0).RX(-0.12); col(hc); m.cyl(0, 0, 0, 0.158, 0.125, 0.13, 14, 1); col(band || '#2a3a8c'); m.tube([[0, 0.13, 0], [0.06, 0.13, -0.08], [0.1, 0.02, -0.14], [0.11, -0.1, -0.15]], 0.012, 5); m.ell(0.11, -0.13, -0.15, 0.03, 0.045, 0.03, 6, 4); m.pop(); break;
      case 'turban':
        m.push().T(0, HY + 0.045, -0.01).RX(-0.28); col(hc); m.ell(0, 0.04, 0, 0.178, 0.13, 0.18, 14, 7); m.pop();
        col(band || '#e0b84a'); m.ell(0, HY + 0.13, -0.05, 0.11, 0.07, 0.12, 10, 6);
        bone(B.hair); m.tube([[0.02, HY + 0.1, -0.15], [0.03, HY - 0.05, -0.2], [0.02, HY - 0.25, -0.17], [0.0, HY - 0.38, -0.15]], [0.045, 0.05, 0.04, 0.012], 6); break;
      case 'bonnet':
        col(hc); m.ell(0, HY + 0.13, -0.075, 0.095, 0.075, 0.095, 10, 6); if (band) { col(band); bone(B.hair); m.tube([[0, HY + 0.11, -0.15], [0.02, HY - 0.02, -0.19], [0.0, HY - 0.16, -0.17]], [0.03, 0.035, 0.012], 5); } break;
      case 'coif':
        m.push().T(0, HY + 0.01, -0.012).RX(-0.42); col(hc); m.ell(0, 0, 0, 0.176, 0.19, 0.178, 14, 8, 0, 0.66); m.pop();
        for (const s of [1, -1]) m.push().T(0.15 * s, HY - 0.06, 0.0).RZ(-0.25 * s).ell(0, 0, 0, 0.04, 0.1, 0.09, 8, 5).pop(); break;
      case 'flower':
        m.push().T(0, y - 0.01, 0).RX(-0.1); col(hc); m.cyl(0, 0, 0, 0.22, 0.225, 0.014, 16, 3); m.ell(0, 0.014, 0, 0.14, 0.08, 0.14, 12, 6, 0, 0.5);
        col(band || '#d8452f'); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.ell(0.06 + Math.cos(a) * 0.03, 0.07 + Math.sin(a) * 0.025, 0.1, 0.028, 0.028, 0.02, 6, 4); } m.pop(); break;
      case 'veil':
        m.push().T(0, y - 0.005, 0).RX(-0.14); col(hc); m.cyl(0, 0, 0, 0.25, 0.26, 0.012, 16, 3); m.cyl(0, 0.012, 0, 0.14, 0.13, 0.07, 14, 1); if (band) { col(band); m.cyl(0, 0.014, 0, 0.145, 0.143, 0.03, 14, 0); } m.pop();
        bone(B.hair); col(mixc(hc, [1, 1, 1], 0.5)); m.tube([[0.0, y + 0.02, -0.14], [0.05, y - 0.1, -0.26], [0.1, y - 0.3, -0.34]], [0.06, 0.07, 0.02], 6); break;
    }
  }
  if (sp.earring) { bone(B.head, 1); col(sp.earring, 0); m.ell(-0.158, HY - 0.075, 0.012, 0.022, 0.026, 0.022, 8, 5); bone(B.head); }
  if (sp.pipe) { bone(B.head); col('#5a3a22'); m.tube([[0.03, HY - 0.088, 0.15], [0.05, HY - 0.1, 0.24], [0.052, HY - 0.085, 0.27]], 0.01, 5); m.cyl(0.052, HY - 0.092, 0.27, 0.02, 0.022, 0.035, 6, 1); }
  /* things carried */
  for (const p of (sp.props || [])) {
    switch (p.type) {
      case 'palette': bone(B.faL); m.push().T(SX + 0.02, 0.78, 0.07).RX(1.25).RZ(0.2); col('#c79a5a'); m.cyl(0, 0, 0, 0.13, 0.13, 0.012, 12, 3); const pc = ['#e2b23c', '#2f5fb4', '#c7332b', '#f3efe0', '#3f7d4a', '#e07a2e']; for (let i = 0; i < 6; i++) { const a = i / 6 * 4.2 + 0.5; col(pc[i], 0); m.ell(Math.cos(a) * 0.085, 0.014, Math.sin(a) * 0.085, 0.022, 0.008, 0.022, 6, 3); } m.pop(); break;
      case 'brush': bone(B.faR); m.push().T(-SX, 0.775, 0.02).RX(-1.5); col('#7a5630'); m.cyl(0, 0, 0, 0.008, 0.006, 0.2, 5, 0); col(p.col || '#e2b23c', 0); m.cyl(0, 0.2, 0, 0.011, 0.004, 0.045, 5, 1); m.pop(); break;
      case 'books': bone(B.faL); m.push().T(SX + 0.01, 0.80, 0.07).RX(1.35); col('#b5422f'); m.box(0, 0, 0, 0.15, 0.03, 0.2, 63); col('#3d6b4a'); m.box(0.01, 0.03, 0, 0.14, 0.025, 0.19, 63); col('#e9dfc0'); m.box(0.0, 0.055, 0.005, 0.13, 0.02, 0.18, 63); m.pop(); break;
      case 'tray': bone(B.faL); m.push().T(SX, 0.76, 0.1).RX(1.45); col('#c9cdd6'); m.cyl(0, 0, 0, 0.16, 0.16, 0.012, 12, 3); col('#f4f1e6'); m.cyl(0.05, 0.012, 0.02, 0.03, 0.035, 0.05, 8, 1); col('#7a4a2a'); m.cyl(-0.05, 0.012, -0.03, 0.022, 0.02, 0.11, 6, 1); m.pop(); break;
      case 'foxglove': bone(B.faL); m.push().T(SX, 0.78, 0.03).RX(0.9); col('#4d7a45'); m.cyl(0, 0, 0, 0.007, 0.005, 0.34, 5, 0); for (let i = 0; i < 7; i++) { col(i % 2 ? '#a35fb8' : '#c58ad0', 0); m.ell((i % 2 ? 0.02 : -0.02), 0.14 + i * 0.03, 0.012, 0.02, 0.022, 0.02, 6, 4); } m.pop(); break;
      case 'bag': bone(B.chest); col(p.col || '#c9a55a'); m.ell(0.13 * W, 0.98, 0.1, 0.12, 0.13, 0.09, 10, 6); m.push().T(0, 1.14, 0).RZ(-0.62); m.lathe(0, 0, 0, [[0.172 * W, -0.012], [0.172 * W, 0.012]], 12, 0.72); m.pop(); break;
      case 'parasol': bone(B.prop); col('#6b4a2a'); m.cyl(0, -0.12, 0, 0.011, 0.011, 1.0, 6, 0); col(p.col); m.push().T(0, 0.74, 0); m.lathe(0, 0, 0, [[0.52, 0], [0.42, 0.09], [0.24, 0.165], [0.0, 0.2]], 12); m.flip = true; col(p.under || mulc(hex(p.col), 0.7)); m.lathe(0, 0, 0, [[0.52, 0], [0.42, 0.085], [0.24, 0.158], [0.0, 0.19]], 12); m.flip = false; col('#6b4a2a'); m.cyl(0, 0.2, 0, 0.01, 0.004, 0.06, 5, 1); m.pop(); break;
      case 'cane': bone(B.prop); col(p.col || '#3a2a1e'); m.cyl(0, -0.78, 0, 0.011, 0.013, 0.82, 6, 1); m.ell(0, 0.05, 0, 0.022, 0.022, 0.022, 6, 4); break;
      case 'staff': bone(B.prop); col(p.col || '#8a6a3a'); m.cyl(0, -0.8, 0, 0.014, 0.016, 1.5, 6, 1); break;
      case 'yoke': bone(B.chest); col('#7a5a34'); m.push().T(0, 1.33, -0.02).RZ(Math.PI / 2); m.cyl(0, -0.5, 0, 0.016, 0.016, 1.0, 6, 3); m.pop(); for (const s of [1, -1]) { col('#5a4326'); m.cyl(0.48 * s, 0.86, -0.02, 0.004, 0.004, 0.47, 4, 0); col('#b5894c'); m.cyl(0.48 * s, 0.7, -0.02, 0.08, 0.1, 0.17, 10, 1); } break;
      case 'jug': bone(B.faR); m.push().T(-SX, 0.72, 0.06); col('#b5683a'); m.lathe(0, 0, 0, [[0.04, -0.08], [0.07, -0.02], [0.065, 0.05], [0.035, 0.09], [0.045, 0.12]], 10); m.pop(); break;
      case 'fan': bone(B.faR); m.push().T(-SX, 0.76, 0.05).RX(-0.6); col(p.col || '#e9e2c8'); m.ds = true; for (let i = 0; i < 6; i++) { const a0 = -0.9 + i * 0.3, a1 = a0 + 0.3; m.tri([0, 0, 0], [Math.sin(a0) * 0.2, Math.cos(a0) * 0.2, 0], [Math.sin(a1) * 0.2, Math.cos(a1) * 0.2, 0]); } m.ds = false; m.pop(); break;
    }
  }
  const pk = m.pack(), nv = pk.nv, bb = new Uint8Array(nv * 4);
  for (let i = 0; i < nv; i++) { const s = pk.bone[i]; bb[i * 4] = Math.floor(s + 1e-3); bb[i * 4 + 1] = (s - Math.floor(s + 1e-3)) > 0.25 ? 1 : 0; }
  pk.boneB = bb; pk.sx = SX; pk.hasProp = (sp.props || []).some(p => ['parasol', 'cane', 'staff'].includes(p.type)) ? ((sp.props.find(p => ['parasol', 'cane', 'staff'].includes(p.type)).hand === 'L') ? 1 : -1) : 0;
  return pk;
}

/* ---------- animation ---------- */
const _bm = []; for (let i = 0; i < NB; i++) _bm.push(M4.create());
const _mdl = M4.create(), _tmp = M4.create();
function _bone(out, parent, px, py, pz, rx, ry, rz) {
  M4.copy(out, parent); M4.translate(out, px, py, pz);
  if (ry) M4.rotY(out, ry); if (rx) M4.rotX(out, rx); if (rz) M4.rotZ(out, rz);
  M4.translate(out, -px, -py, -pz);
}
const POSE = {};
class Actor {
  constructor(model, o) {
    this.model = model; this.sx = model.sx; this.hasProp = model.hasProp;
    this.x = o.x || 0; this.y = o.y || 0; this.z = o.z || 0; this.rot = o.rot || 0; this.scale = o.scale || 1;
    this.pose = o.pose || 'idle'; this.phase = Math.random() * 6; this.speed = 0; this.seed = Math.random() * 100;
    this.bones = new Float32Array(NB * 16); this.lamp = new Float32Array(3);
    this.home = [this.x, this.z]; this.homeRot = this.rot; this.tx = this.x; this.tz = this.z; this.wait = Math.random() * 3;
    this.look = 0; this.lookT = 0; this.vy = 0; this.sit = 0; this.outline = o.outline === undefined ? 0.011 : o.outline;
    Object.assign(this, o.extra || {});
  }
  /* compute skinning matrices for the current state */
  animate(t) {
    const P = this.P || (this.P = {});
    const w = clamp(this.speed / 2.2, 0, 1.6), ph = this.phase, s = Math.sin(ph), c = Math.cos(ph), tt = t + this.seed;
    const A = 0.58 * Math.min(w, 1.25);
    P.hipY = -0.03 * w * Math.abs(s) - 0.012 * w; P.lean = 0.06 * w; P.twist = 0.12 * w * s; P.roll = 0;
    P.headY = this.look * 0.6 + Math.sin(tt * 0.31) * 0.14 * (1 - Math.min(w, 1)); P.headX = Math.sin(tt * 0.47) * 0.04; P.headZ = 0;
    P.thL = A * s; P.thR = -A * s; P.knL = 1.0 * Math.min(w, 1.2) * Math.max(0, c) + 0.04; P.knR = 1.0 * Math.min(w, 1.2) * Math.max(0, -c) + 0.04;
    P.uaL = -A * 0.75 * s; P.uaR = A * 0.75 * s; P.ozL = 0.07 + 0.02 * Math.sin(tt * 1.3); P.ozR = 0.07 + 0.02 * Math.sin(tt * 1.3 + 1);
    P.faL = 0.18 + 0.35 * w * Math.max(0, -s) + 0.12 * w; P.faR = 0.18 + 0.35 * w * Math.max(0, s) + 0.12 * w;
    P.chX = Math.sin(tt * 1.5) * 0.012; P.skirt = 0.05 * w * s; P.hair = -0.1 * w + Math.sin(tt * 1.1) * 0.02;
    P.rotArmL = 0; P.rotArmR = 0;
    const pf = POSE[this.pose]; if (pf) pf(P, tt, w, this);
    if (this.hasProp) { if (this.hasProp > 0) { P.uaL = P.uaL * 0.2 + (this.propUp || 0.5); P.faL = this.propBend || 1.45; } else { P.uaR = P.uaR * 0.2 + (this.propUp || 0.5); P.faR = this.propBend || 1.45; } }
    const sc = this.scale, m = _bm, sx = this.sx;
    M4.trans(_mdl, this.x, this.y + (this.yadd || 0), this.z); M4.rotY(_mdl, this.rot); if (this.roll) M4.rotZ(_mdl, this.roll); if (this.zoff) M4.translate(_mdl, 0, 0, this.zoff); M4.scale(_mdl, sc, sc, sc);
    M4.copy(_tmp, _mdl); M4.translate(_tmp, 0, P.hipY, 0);
    _bone(m[B.hips], _tmp, 0, 0.86, 0, P.lean * 0.4, -P.twist * 0.6, P.roll);
    _bone(m[B.chest], m[B.hips], 0, 0.98, 0, P.lean + P.chX, P.twist * 1.6, -P.roll * 0.6);
    _bone(m[B.head], m[B.chest], 0, 1.345, 0, P.headX - P.lean * 0.9, P.headY - P.twist, P.headZ);
    _bone(m[B.uaL], m[B.chest], sx, 1.275, 0, -P.uaL, P.rotArmL, P.ozL);
    _bone(m[B.faL], m[B.uaL], sx, 1.04, 0, -P.faL, 0, 0);
    _bone(m[B.uaR], m[B.chest], -sx, 1.275, 0, -P.uaR, P.rotArmR, -P.ozR);
    _bone(m[B.faR], m[B.uaR], -sx, 1.04, 0, -P.faR, 0, 0);
    _bone(m[B.thL], m[B.hips], 0.085, 0.84, 0, -P.thL, 0, 0);
    _bone(m[B.shL], m[B.thL], 0.085, 0.46, 0, P.knL, 0, 0);
    _bone(m[B.thR], m[B.hips], -0.085, 0.84, 0, -P.thR, 0, 0);
    _bone(m[B.shR], m[B.thR], -0.085, 0.46, 0, P.knR, 0, 0);
    _bone(m[B.skirt], m[B.hips], 0, 0.98, 0, P.skirt * 0.5 - (this.sit ? 0.0 : 0), 0, P.skirt);
    _bone(m[B.hair], m[B.head], 0, 1.55, -0.1, P.hair, 0, 0);
    if (this.hasProp) {
      const fa = m[this.hasProp > 0 ? B.faL : B.faR], hx = this.hasProp > 0 ? sx : -sx, hy = 0.79;
      const wx = fa[0] * hx + fa[4] * hy + fa[12], wy = fa[1] * hx + fa[5] * hy + fa[13], wz = fa[2] * hx + fa[6] * hy + fa[14];
      const pm = m[B.prop]; M4.trans(pm, wx, wy, wz); M4.rotY(pm, this.rot); M4.rotZ(pm, (this.propTilt || 0) * this.hasProp + Math.sin(tt * 0.8) * 0.03); M4.scale(pm, sc, sc, sc);
    } else M4.copy(m[B.prop], m[B.chest]);
    const out = this.bones;
    for (let i = 0; i < 14; i++) out.set(m[i], i * 16);
  }
}
POSE.paint = (P, t) => { P.uaR = 1.05 + Math.sin(t * 2.1) * 0.12; P.faR = 0.75 + Math.sin(t * 3.3) * 0.2; P.ozR = 0.05 + Math.sin(t * 1.7) * 0.08; P.uaL = 0.35; P.faL = 1.25; P.headY += -0.12; P.headX += 0.03 + Math.sin(t * 0.9) * 0.03; };
POSE.sow = (P, t) => { const k = Math.sin(t * 2.2); P.uaR = 0.5 + k * 0.6; P.faR = 0.5 - k * 0.3; P.ozR = 0.35 + k * 0.3; P.uaL = 0.4; P.faL = 1.3; P.lean += 0.06; };
POSE.scream = (P, t) => { P.uaL = P.uaR = 1.0; P.faL = P.faR = 2.25; P.ozL = P.ozR = 0.28; P.rotArmL = -0.75; P.rotArmR = 0.75; P.roll = Math.sin(t * 0.9) * 0.07; P.headZ = Math.sin(t * 0.9 + 0.6) * 0.06; P.headX += -0.06; P.lean += 0.03; };
POSE.sit = (P, t) => { P.hipY = -0.37; P.thL = 1.5; P.thR = 1.5; P.knL = 1.5; P.knR = 1.5; P.uaL = 0.55; P.faL = 0.95 + Math.sin(t * 0.6) * 0.06; P.uaR = 0.5; P.faR = 1.0; P.lean = -0.04; P.skirt = 0; };
POSE.hold = (P, t) => { P.uaL = P.uaL * 0.3 + 0.3; P.faL = 1.35; P.uaR = P.uaR * 0.6; };
POSE.think = (P, t) => { P.uaR = 0.75; P.faR = 2.2; P.rotArmR = 0.5; P.ozR = 0.1; P.headZ = -0.2; P.headX += 0.08; P.lean += 0.05; P.uaL = P.uaL * 0.3 + 0.3; P.faL = 1.3; };
POSE.serve = (P, t) => { P.uaL = P.uaL * 0.2 + 0.25; P.faL = 1.4; };
POSE.fold = (P, t) => { P.uaL = P.uaL * 0.3 + 0.25; P.uaR = P.uaR * 0.3 + 0.25; P.faL = 1.25; P.faR = 1.25; P.rotArmL = -0.55; P.rotArmR = 0.55; };
POSE.guard = (P, t) => { P.ozL = 0.25; P.faL = 1.9; P.uaL = P.uaL * 0.3 - 0.2; P.rotArmL = 0.6; };
POSE.wash = (P, t) => { P.lean = 0.75; P.hipY = -0.3; P.thL = 1.25; P.thR = 1.25; P.knL = 1.9; P.knR = 1.9; P.uaL = 1.2 + Math.sin(t * 3) * 0.2; P.uaR = 1.2 - Math.sin(t * 3) * 0.2; P.faL = P.faR = 0.5; P.headX += -0.4; };
POSE.pour = (P, t) => { P.uaR = 0.75; P.faR = 0.9 + Math.sin(t * 0.7) * 0.05; P.uaL = 0.55; P.faL = 0.9; P.headX += 0.22; P.lean += 0.05; };
POSE.ride = (P, t, w, a) => { const ph = a.phase, s = Math.sin(ph), c = Math.cos(ph); P.hipY = 0.07; P.lean = 0.34; P.twist = 0; P.roll = 0; P.thL = 0.98 + 0.36 * s; P.thR = 0.98 - 0.36 * s; P.knL = 1.5 - 0.42 * c; P.knR = 1.5 + 0.42 * c; P.uaL = P.uaR = 1.02; P.faL = P.faR = 0.3; P.ozL = P.ozR = 0.12; P.headX = -0.26; P.headY = (a.steer || 0) * 0.5; P.skirt = 0; P.chX = 0; };
POSE.pillion = (P, t) => { P.hipY = -0.02; P.thL = 1.35; P.thR = 1.45; P.knL = 1.25; P.knR = 1.35; P.uaL = 0.5; P.faL = 0.9; P.uaR = 0.45; P.faR = 0.8; P.lean = -0.03; P.skirt = 0; };
POSE.statue = (P, t, w, a) => { const k = a.def && a.def.statue; P.chX = 0; P.headX = 0; P.headY = 0; P.ozL = 0.07; P.ozR = 0.07; if (k === 'david') { P.roll = 0.05; P.headY = 0.75; P.uaL = 0.35; P.faL = 2.2; P.rotArmL = -0.2; P.uaR = 0.02; P.faR = 0.12; P.thR = 0.12; P.knR = 0.2; P.twist = -0.08; } else if (k === 'venus') { P.roll = -0.06; P.twist = 0.12; P.headY = -0.3; P.thL = 0.14; P.knL = 0.25; } else if (k === 'thinker') { POSE.sit(P, 0); P.hipY = -0.37; P.lean = 0.5; P.uaR = 0.95; P.faR = 2.25; P.rotArmR = 0.55; P.uaL = 0.75; P.faL = 0.9; P.rotArmL = -0.3; P.headX = 0.2; } };
POSE.fish = (P, t) => { P.uaR = 0.9; P.faR = 0.6; P.uaL = 0.7; P.faL = 0.9; P.lean += 0.08; };

/* ---------- cast ---------- */
const CAST = {
  player: { skin: '#f7d6b8', hair: '#4a3026', hairStyle: 'bob', top: '#e3b340', style: 'coat', legs: '#2c3d66', shoes: '#6a3d26', scarf: '#2f5fa8', buttons: '#7a4a22', cuff: '#f1e7c8', hat: { type: 'beret', col: '#b8392c' }, bag: '#8a5a32', face: { eye: '#3a4f8a', blush: 0.42 } },
  vincent: { skin: '#f1cba6', hair: '#d2702a', hairStyle: 'short', beard: '#d87a2c', beardStyle: 'full', top: '#3f6fb0', style: 'smock', legs: '#4c5f8c', shoes: '#4a3526', hat: { type: 'straw', col: '#ecd06a', band: '#3c5a9a' }, collar: '#e8e2cc', face: { eye: '#3f7a6a', blush: 0.3 }, props: [{ type: 'palette' }, { type: 'brush', col: '#f0c63a' }], pipe: false },
  roulin: { w: 1.18, belly: 1, skin: '#eec39a', hair: '#7a6038', beard: '#9c7c44', beardStyle: 'fork', top: '#2b3f8e', style: 'coat', legs: '#27377c', shoes: '#22202a', buttons: '#edc24a', buttonRows: 2, cuff: '#edc24a', collar: '#edc24a', hat: { type: 'cap', col: '#273a86', band: '#edc24a' }, face: { eye: '#4a5a6a', blush: 0.5 } },
  ginoux: { skin: '#f0dfbd', hair: '#1c1a24', hairStyle: 'swept', top: '#1e1d2c', style: 'dress', skirt: '#232233', fichu: '#eef1e6', shoes: '#1a1820', hat: { type: 'bonnet', col: '#1c1a24', band: '#2a2a3c' }, face: { eye: '#2a2a36', blush: 0.18, sad: 1 }, props: [{ type: 'books' }] },
  gachet: { skin: '#f0d0aa', hair: '#c98a48', hairStyle: 'short', beard: '#c98a48', beardStyle: 'mustache', top: '#27336e', style: 'coat', legs: '#2a3050', shoes: '#22202a', buttons: '#1a2147', hat: { type: 'white', col: '#f1ecd9' }, face: { eye: '#5a7a9a', sad: 1, blush: 0.25 }, props: [{ type: 'foxglove' }] },
  sower: { skin: '#e2b78c', hair: '#4a3a2a', top: '#3f62a6', style: 'smock', legs: '#35508e', shoes: '#4a3a2a', hat: { type: 'bowler', col: '#5a4a36' }, face: { eye: '#2a2a36', blush: 0.25 }, props: [{ type: 'bag', col: '#d0ab5e' }] },
  berceuse: { w: 1.1, skin: '#f4cfa6', hair: '#cc6a2c', hairStyle: 'bun', top: '#2f6a45', style: 'dress', skirt: '#4a8f58', skirtR: 0.33, collar: '#e9e6cf', shoes: '#3a2a22', face: { eye: '#3a6a5a', blush: 0.5 } },
  waiter: { skin: '#f2cfaa', hair: '#2a2228', hairStyle: 'short', beard: '#2a2228', beardStyle: 'mustache', top: '#f3f0e3', style: 'dress', skirt: '#f6f3e8', skirtLen: 0.3, skirtR: 0.2, legs: '#1e1d2a', shoes: '#15141c', buttons: '#c9c2a8', face: { eye: '#2a2a36' }, props: [{ type: 'tray' }] },
  zouave: { skin: '#cf9566', hair: '#1c1820', hairStyle: 'short', beard: '#1c1820', beardStyle: 'mustache', top: '#222e60', style: 'baggy', skirt: '#c8382b', legs: '#c8382b', socks: '#efe7d2', shoes: '#2a2228', trim: '#e2752c', cuff: '#e2752c', hat: { type: 'chechia', col: '#c9332b', band: '#27408e' }, face: { eye: '#2a2028', blush: 0.2 } },
  loverM: { skin: '#eac6a0', hair: '#3a2a22', top: '#2f4f96', style: 'jacket', legs: '#2a3a6a', shoes: '#22202a', hat: { type: 'straw', col: '#d8bd62', band: '#27408e' }, face: { eye: '#2a2a36' } },
  loverF: { skin: '#f3d3b4', hair: '#5a3a26', hairStyle: 'chignon', top: '#7a3a4a', style: 'dress', skirt: '#2a3566', shoes: '#22202a', hat: null, face: { eye: '#3a3a56', blush: 0.5 } },
  patronA: { skin: '#f2d0ae', hair: '#6a3a22', hairStyle: 'chignon', top: '#c9453a', style: 'dress', skirt: '#b53a32', shoes: '#22202a', hat: { type: 'flower', col: '#e9dfc0', band: '#3f6fb0' }, face: { eye: '#3a3a56', blush: 0.5 } },
  patronB: { skin: '#eec8a2', hair: '#2a2228', top: '#2a2a3a', style: 'jacket', legs: '#3a3a4c', shoes: '#15141c', hat: { type: 'bowler', col: '#1e1d2a' }, beard: '#2a2228', beardStyle: 'mustache', face: { eye: '#2a2a36' } },
  patronC: { skin: '#f4d6b6', hair: '#c9a24a', hairStyle: 'bun', top: '#f0ead6', style: 'dress', skirt: '#e9e2c8', shoes: '#4a3526', face: { eye: '#4a6a8a', blush: 0.5 } },
  washer: { skin: '#eac09a', hair: '#3a2a22', top: '#c9584a', style: 'dress', skirt: '#3a5a9a', apron: '#e9e4d0', shoes: '#3a2a22', hat: { type: 'coif', col: '#f1ede0' }, shortSleeve: 1, face: { eye: '#2a2a36', blush: 0.5 } },
  monetLady: { skin: '#f7dcc4', hair: '#6a4a32', hairStyle: 'chignon', top: '#eef2f8', style: 'dress', skirt: '#e6edf6', skirtR: 0.34, shoes: '#b7a98c', scarf: '#9db7d8', hat: { type: 'veil', col: '#efe6c8', band: '#8fa6c4' }, face: { eye: '#4a5a7a', blush: 0.45 }, props: [{ type: 'parasol', col: '#e9efe2', under: '#6f9a5c' }] },
  monetBoy: { skin: '#f6d8be', hair: '#b98a4a', top: '#e9eef2', style: 'smock', legs: '#c9d3df', shoes: '#8a6a4a', hat: { type: 'straw', col: '#ead9a0', band: '#3a4a6a' }, face: { eye: '#4a5a7a', blush: 0.5 } },
  traveler: { skin: '#eccaa0', hair: '#1c1a20', top: '#28457a', style: 'robe', sleeve: '#28457a', legs: '#e9e2cc', socks: '#e9e2cc', shoes: '#b89a5a', collar: '#e9e2cc', hat: { type: 'kasa', col: '#dcc88e' }, face: { eye: '#1c1a20', blush: 0.2 }, props: [{ type: 'staff' }] },
  fisher: { skin: '#e2b88c', hair: '#1c1a20', top: '#3a5f8f', style: 'jacket', shortSleeve: 1, legs: '#d9d2bc', socks: '#e2b88c', shoes: '#b89a5a', hat: { type: 'kasa', col: '#cfb878' }, face: { eye: '#1c1a20', blush: 0.2 } },
  scream: { skull: 1, skin: '#d9cf9a', top: '#16161f', sleeve: '#16161f', style: 'robe', legs: '#16161f', shoes: '#101016' },
  munchA: { skin: '#d8c4a8', hair: '#1c1a20', top: '#1c1c2a', style: 'coat', legs: '#1a1a26', shoes: '#101016', hat: { type: 'top', col: '#14141c' }, face: { eye: '#14141c', blush: 0 } },
  seuratLady: { skin: '#f3d6bc', hair: '#5a3222', hairStyle: 'chignon', top: '#2d2644', style: 'dress', skirt: '#3b3558', bustle: 1, skirtR: 0.31, shoes: '#1c1a24', collar: '#e9e2cf', hat: { type: 'flower', col: '#1f1c2c', band: '#d8452f' }, face: { eye: '#2a2a40', blush: 0.4 }, props: [{ type: 'parasol', col: '#d9643a', under: '#a8452a' }] },
  seuratGent: { skin: '#f0d0b0', hair: '#2a2226', top: '#23202e', style: 'coat', legs: '#4a4658', shoes: '#15141c', collar: '#f1ede0', beard: '#2a2226', beardStyle: 'mustache', hat: { type: 'top', col: '#191722', band: '#2a2636' }, face: { eye: '#2a2a40' }, props: [{ type: 'cane' }] },
  seuratGirl: { skin: '#f6dcc6', hair: '#c98a3a', hairStyle: 'long', top: '#f4f1e8', style: 'dress', skirt: '#f6f3ea', skirtLen: 0.4, skirtR: 0.26, shoes: '#b56a4a', hat: { type: 'flower', col: '#f1ead2', band: '#e8a03a' }, face: { eye: '#4a5a7a', blush: 0.55 } },
  seuratRower: { skin: '#e8b88e', hair: '#3a2a22', top: '#e9e4d6', style: 'jacket', shortSleeve: 1, legs: '#4a5f8c', shoes: '#3a2a22', hat: { type: 'cap', col: '#c9452f' }, pipe: 1, face: { eye: '#2a2a36' } },
  scholar: { skin: '#f1d6b4', hair: '#1c1a20', hairStyle: 'bun', top: '#f1ecda', style: 'robe', sleeve: '#f1ecda', legs: '#e9e2cc', shoes: '#2a2a2a', collar: '#3f8a7a', beard: '#1c1a20', beardStyle: 'long', face: { eye: '#1c1a20', blush: 0.15 }, props: [{ type: 'fan' }] },
  boatman: { skin: '#e2b88c', hair: '#1c1a20', top: '#6a8a6a', style: 'robe', sleeve: '#6a8a6a', legs: '#5a5a4a', shoes: '#3a3a2a', hat: { type: 'kasa', col: '#c9b070' }, face: { eye: '#1c1a20', blush: 0.2 }, props: [{ type: 'staff', col: '#6a5a3a' }] },
  pearl: { skin: '#f6dcc4', hair: '#5a4a32', hairStyle: 'bald', top: '#b88c3c', style: 'dress', skirt: '#a67c34', collar: '#f3efe2', shoes: '#4a3a2a', hat: { type: 'turban', col: '#4a7ac0', band: '#e2bb4e' }, earring: '#f6f3ea', face: { eye: '#4a4a3a', blush: 0.4, mouth: '#c9453f', open: 1 } },
  milkmaid: { w: 1.1, skin: '#f2d0aa', hair: '#6a4a2a', hairStyle: 'bald', top: '#e3c04a', style: 'dress', skirt: '#b5422f', apron: '#3f62a8', sleeve: '#3f7a5a', cuff: '#3f62a8', shoes: '#3a2a22', hat: { type: 'coif', col: '#f4f1e6' }, face: { eye: '#3a3a36', blush: 0.5 }, props: [{ type: 'jug' }] },
};

/* a town bicycle with a basket of sunflowers. bones: 0 frame, 1 fork+bars, 2 front wheel, 3 rear wheel, 4 cranks */
function buildBike(col) {
  const m = new Mesh(6000), c1 = hex(col || '#c2452f'), dark = hex('#22242e'), cream = hex('#efe6cc'), R = 0.34;
  const bone = b => { m.sw = b; }, C = (c, o) => m.c(c, o === undefined ? 1 : o);
  const wheel = (z) => {
    const ring = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; ring.push([0, 0.34 + Math.sin(a) * R, z + Math.cos(a) * R]); }
    C(dark); m.tube(ring, 0.03, 6); const rim = ring.map(p => [0, 0.34 + (p[1] - 0.34) * 0.9, z + (p[2] - z) * 0.9]); C(cream, 0); m.tube(rim, 0.014, 4);
    C('#c9c9d2', 0); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; m.tube([[0.02 * (i % 2 ? 1 : -1), 0.34, z], [0, 0.34 + Math.sin(a) * R * 0.88, z + Math.cos(a) * R * 0.88]], 0.005, 3); }
    C(dark); m.push().T(0, 0.34, z).RZ(Math.PI / 2); m.cyl(0, -0.05, 0, 0.03, 0.03, 0.1, 6, 3); m.pop();
  };
  const RZ0 = -0.52, FZ0 = 0.58, bb = [0, 0.3, -0.04], seat = [0, 0.86, -0.3], head = [0, 0.92, 0.34], headLo = [0, 0.74, 0.4];
  bone(3); wheel(RZ0); bone(2); wheel(FZ0);
  bone(0); C(c1);
  m.tube([bb, seat], 0.022, 6); m.tube([seat, [0, 0.9, 0.0], head], 0.02, 6); m.tube([headLo, [0, 0.52, 0.16], bb], 0.024, 6); m.tube([head, headLo], 0.026, 6);
  for (const s of [-1, 1]) { m.tube([bb, [0.05 * s, 0.33, -0.3], [0.05 * s, 0.34, RZ0]], 0.013, 4); m.tube([[0, 0.8, -0.3], [0.05 * s, 0.56, -0.42], [0.05 * s, 0.34, RZ0]], 0.012, 4); }
  C('#5a3a26'); m.ell(0, 0.905, -0.32, 0.085, 0.035, 0.14, 8, 5); C(dark); m.cyl(0, 0.84, -0.3, 0.014, 0.014, 0.06, 5, 0);
  C(mulc(c1, 0.8)); const fen = []; for (let i = 0; i <= 8; i++) { const a = -0.5 + i / 8 * 2.6; fen.push([0, 0.34 + Math.sin(a) * (R + 0.045), RZ0 + Math.cos(a) * (R + 0.045)]); } m.tube(fen, 0.018, 4);
  C('#8a6a3a'); m.box(0, 0.74, -0.62, 0.2, 0.02, 0.34, 63); for (const s of [-1, 1]) m.tube([[0.09 * s, 0.74, -0.74], [0.05 * s, 0.34, RZ0]], 0.008, 3);
  C(dark); m.tube([[0, 0.3, RZ0 + 0.02], [0, 0.3, -0.04]], 0.008, 3);
  bone(4); C('#c9c9d2', 0); m.push().T(0, 0.3, -0.04).RZ(Math.PI / 2); m.cyl(0, -0.012, 0, 0.085, 0.085, 0.024, 10, 3); m.pop();
  C(dark); for (const s of [-1, 1]) { m.tube([[0.03 * s, 0.3, -0.04], [0.07 * s, 0.3 - 0.17 * s, -0.04]], 0.012, 4); m.box(0.12 * s, 0.3 - 0.17 * s - 0.012, -0.04, 0.1, 0.024, 0.07, 63); }
  bone(1); C(c1); for (const s of [-1, 1]) m.tube([headLo, [0.055 * s, 0.6, 0.48], [0.055 * s, 0.34, FZ0]], 0.014, 4);
  m.tube([head, [0, 1.02, 0.3]], 0.016, 5); C('#c9c9d2'); m.tube([[-0.27, 1.0, 0.2], [-0.2, 1.03, 0.3], [0, 1.03, 0.31], [0.2, 1.03, 0.3], [0.27, 1.0, 0.2]], 0.013, 5);
  C('#5a3a26'); for (const s of [-1, 1]) m.tube([[0.27 * s, 1.0, 0.2], [0.29 * s, 0.99, 0.12]], 0.02, 5, true);
  C(mulc(c1, 0.8)); const ff = []; for (let i = 0; i <= 6; i++) { const a = 0.5 + i / 6 * 1.9; ff.push([0, 0.34 + Math.sin(a) * (R + 0.045), FZ0 + Math.cos(a) * (R + 0.045)]); } m.tube(ff, 0.018, 4);
  C('#c9a45a'); m.lathe(0, 0.74, 0.62, [[0.12, 0], [0.16, 0.1], [0.17, 0.2]], 8, 0.75); m.c(mulc(hex('#c9a45a'), 0.75), 1); m.disc(0, 0.75, 0.62, 0.12, 8, 0.09);
  C('#ffe07a', 1); m.ell(0, 0.72, 0.5, 0.035, 0.035, 0.02, 6, 4);
  const rng = RNG(5); for (let i = 0; i < 4; i++) { const fx = rng.s() * 0.08, fz = 0.62 + rng.s() * 0.06, fy = 1.0 + rng() * 0.12; C('#5f8f3a', 0); m.tube([[fx * 0.5, 0.8, fz], [fx, fy, fz]], 0.008, 3); m.push().T(fx, fy, fz).RX(0.9).RZ(rng.s() * 0.5); C('#f4c62e', 0); m.cyl(0, 0, 0, 0.075, 0.07, 0.012, 9, 1); C('#7a4a22', 0); m.cyl(0, 0.012, 0, 0.035, 0.03, 0.012, 7, 1); m.pop(); }
  const pk = m.pack(), bbs = new Uint8Array(pk.nv * 4); for (let i = 0; i < pk.nv; i++) bbs[i * 4] = Math.round(pk.bone[i]); pk.boneB = bbs; return pk;
}
const _bk = []; for (let i = 0; i < 6; i++) _bk.push(M4.create());
function bikeBones(out, x, y, z, rot, roll, steer, spin, crank) {
  const M = _bk[5]; M4.trans(M, x, y, z); M4.rotY(M, rot); if (roll) M4.rotZ(M, roll);
  M4.copy(_bk[0], M);
  M4.copy(_bk[1], M); M4.translate(_bk[1], 0, 0.83, 0.37); M4.rotY(_bk[1], steer); M4.translate(_bk[1], 0, -0.83, -0.37);
  M4.copy(_bk[2], _bk[1]); M4.translate(_bk[2], 0, 0.34, 0.58); M4.rotX(_bk[2], spin); M4.translate(_bk[2], 0, -0.34, -0.58);
  M4.copy(_bk[3], M); M4.translate(_bk[3], 0, 0.34, -0.52); M4.rotX(_bk[3], spin); M4.translate(_bk[3], 0, -0.34, 0.52);
  M4.copy(_bk[4], M); M4.translate(_bk[4], 0, 0.3, -0.04); M4.rotX(_bk[4], crank); M4.translate(_bk[4], 0, -0.3, 0.04);
  for (let i = 0; i < 5; i++) out.set(_bk[i], i * 16);
}
const MARBLE = { skin: '#eeeae0', hair: '#e6e2d6', top: '#eeeae0', sleeve: '#eeeae0', legs: '#eeeae0', socks: '#eeeae0', shoes: '#e6e2d6', hipCol: '#eeeae0', face: { eye: '#dcd8cc', blush: 0, mouth: '#d6d2c6' }, brow: '#d6d2c6', marble: 1 };
Object.assign(CAST, {
  david: Object.assign({}, MARBLE, { hairStyle: 'curly', style: 'jacket', w: 1.08 }),
  venus: Object.assign({}, MARBLE, { hairStyle: 'chignon', style: 'dress', skirt: '#e9e5da', skirtR: 0.27, skirtLen: 0.04, noArms: 1 }),
  thinker: Object.assign({}, MARBLE, { skin: '#5a6a5a', hair: '#4a5a4c', top: '#5a6a5a', sleeve: '#5a6a5a', legs: '#5a6a5a', socks: '#5a6a5a', shoes: '#4a5a4c', hipCol: '#5a6a5a', hairStyle: 'short', w: 1.15, face: { eye: '#4a5a4c', blush: 0, mouth: '#4a5a4c' }, brow: '#3f4f42' }),
  mona: { skin: '#f0d6a8', hair: '#3a2a1e', hairStyle: 'long', top: '#2f3a2a', style: 'dress', skirt: '#27301f', sleeve: '#a8823a', collar: '#3a2a1e', shoes: '#1c1a16', hat: null, face: { eye: '#4a3a22', blush: 0.25, mouth: '#b8605a' }, brow: '#e6c89a' },
  wanderer: { skin: '#f0d0b0', hair: '#c9823a', hairStyle: 'curly', top: '#22382e', style: 'coat', legs: '#1f3028', shoes: '#22202a', collar: '#e9e2cf', face: { eye: '#3a4a5a' }, props: [{ type: 'cane', col: '#5a4030' }] },
  visitorA: { skin: '#f4d6b6', hair: '#2a2228', hairStyle: 'bob', top: '#3f6fb0', style: 'jacket', legs: '#e9e2cc', shoes: '#b5422f', bag: '#c9a45a', face: { eye: '#3a3a56', blush: 0.5 } },
  visitorB: { skin: '#e2b88c', hair: '#1c1a20', hairStyle: 'short', top: '#e9dfc0', style: 'coat', legs: '#4a5f8c', shoes: '#3a2a22', scarf: '#c2452f', face: { eye: '#2a2a36' } },
});
