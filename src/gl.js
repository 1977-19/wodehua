'use strict';
/* WebGL2 renderer. Few draw calls, one texture fetch pair per pixel, no post-processing:
   the oil-paint look is done inside the material so the frame rate stays high. */

const SH = {};
SH.worldV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aNrm; layout(location=2) in vec4 aCol; layout(location=3) in vec4 aLamp;
uniform mat4 uVP; uniform vec3 uCam; uniform vec4 uW; // time, wind, fogDensity, fogHeight
out vec3 vPos; out vec3 vNrm; out vec4 vCol; out vec4 vLamp; out vec2 vFog;
void main(){
  vec3 p = aPos; float sw = aNrm.w;
  if (sw > 0.0) {
    float ph = p.x*0.31 + p.z*0.27;
    p.x += sw*(sin(uW.x*1.6+ph)*0.11 + sin(uW.x*2.9+ph*2.3)*0.04)*uW.y;
    p.z += sw*(cos(uW.x*1.3+ph*1.1)*0.07)*uW.y;
  }
  gl_Position = uVP*vec4(p,1.0);
  vPos = p; vNrm = aNrm.xyz; vCol = aCol; vLamp = aLamp;
  float d = distance(p, uCam);
  vFog = vec2(1.0 - exp(-pow(d*uW.z, 1.5)), d);
}`;
SH.worldF = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; in vec4 vCol; in vec4 vLamp; in vec2 vFog;
uniform sampler2D uStroke;
uniform vec3 uSunDir, uLight, uShade, uFogCol, uTint, uGlowCol, uNA, uNB; uniform float uNMix;
uniform vec4 uP; // strokeScale, strokeAmt, lampAmt, glow
uniform float uShadowAmt; uniform vec2 uRes; uniform float uQ;
out vec4 o;
void main(){
  vec3 n = normalize(vNrm); vec3 an = abs(n);
  vec2 uv = an.y > 0.55 ? vPos.xz : (an.x > an.z ? vPos.zy : vPos.xy);
  vec4 s = texture(uStroke, uv*uP.x);
  if (uQ > 0.5) s = mix(s, texture(uStroke, uv*uP.x*0.21 + 0.31), smoothstep(14.0, 55.0, vFog.y));
  float sh = 1.0 - vLamp.a*uShadowAmt;
  float ndl = dot(n, uSunDir)*0.5 + 0.5;
  float l = smoothstep(0.36, 0.64, ndl + (s.r-0.5)*0.34)*sh;
  vec3 base = vCol.rgb;
  base *= 1.0 + (s.r-0.5)*uP.y;
  base += (s.g-0.5)*uTint*uP.y;
  base *= 1.0 - s.b*0.30*uP.y;
  vec3 c = base*mix(uShade, uLight, l);
  float lum = dot(base, vec3(0.30, 0.52, 0.18));
  c = mix(c, mix(uNA, uNB, l)*(0.30 + lum*1.15), uNMix);
  c += (base*1.25 + 0.05)*vLamp.rgb*uP.z;
  c += mix(uGlowCol, vCol.rgb, 0.4)*vCol.a*uP.w*(0.7 + 0.7*s.r);
  vec2 vq = gl_FragCoord.xy*uRes - 0.5;
  o = vec4(mix(c, uFogCol, vFog.x)*(1.0 - dot(vq, vq)*0.42), 1.0);
}`;

SH.charV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aNrm; layout(location=2) in vec4 aCol; layout(location=3) in vec4 aBone;
uniform mat4 uVP; uniform mat4 uBones[16]; uniform vec3 uCam; uniform float uOutline; uniform float uFogD;
out vec3 vL; out vec3 vNrm; out vec4 vCol; out float vFog; out float vFlag; out vec3 vV;
void main(){
  mat4 B = uBones[int(aBone.x)];
  vec4 wp = B*vec4(aPos,1.0);
  vec3 n = normalize(mat3(B)*aNrm.xyz);
  float d = distance(wp.xyz, uCam);
  if (uOutline > 0.0) wp.xyz += n*uOutline*aCol.a*(1.0 + d*0.07);
  gl_Position = uVP*wp;
  vL = aPos; vNrm = n; vCol = aCol; vFlag = aBone.y; vV = normalize(uCam - wp.xyz);
  vFog = 1.0 - exp(-pow(d*uFogD, 1.5));
}`;
SH.charF = `#version 300 es
precision highp float;
in vec3 vL; in vec3 vNrm; in vec4 vCol; in float vFog; in float vFlag; in vec3 vV;
uniform sampler2D uStroke;
uniform vec3 uSunDir, uLight, uShade, uFogCol, uLamp, uTint, uNA, uNB;
uniform float uOutline; uniform float uStrokeAmt; uniform float uNMix;
out vec4 o;
void main(){
  vec3 base = vCol.rgb;
  if (uOutline > 0.0) { o = vec4(mix(base*0.22 + vec3(0.02,0.03,0.10), uFogCol, vFog), 1.0); return; }
  vec3 n = normalize(vNrm);
  vec4 s = texture(uStroke, vL.xy*2.6 + vL.z*1.3);
  float ndl = dot(n, uSunDir)*0.5 + 0.5;
  float l = smoothstep(0.44, 0.56, ndl + (s.r-0.5)*0.16);
  vec3 c;
  if (vFlag > 0.5) c = base*(0.8 + 0.2*max(uLight.r, max(uLight.g, uLight.b)));
  else {
    base *= 1.0 + (s.r-0.5)*uStrokeAmt*0.6;
    base += (s.g-0.5)*uTint*uStrokeAmt*0.5;
    c = base*mix(uShade, uLight, l);
    float lum = dot(base, vec3(0.30, 0.52, 0.18));
    c = mix(c, mix(uNA*1.5, uNB*1.25, l)*(0.42 + lum*1.25), uNMix*0.62);
    c += (base*1.4 + 0.06)*uLamp;
    float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0);
    c += rim*(uNB*uNMix*0.9 + uLight*0.10)*(0.5 + lum);
  }
  o = vec4(mix(c, uFogCol, vFog), 1.0);
}`;

SH.skyV = `#version 300 es
layout(location=0) in vec2 aPos; out vec2 vN;
void main(){ vN = aPos; gl_Position = vec4(aPos, 1.0, 1.0); }`;
SH.skyF = `#version 300 es
precision highp float;
in vec2 vN;
uniform vec3 uR, uU, uF;
uniform float uTime;
uniform sampler2D uStroke;
uniform vec3 uSkyA, uSkyB, uSkyC, uAccent, uHorizon, uFogCol, uCloudCol, uSunCol, uHaloCol, uSunP;
uniform vec4 uSw; // vortex strength, wave amp, band mix, flow speed
uniform vec4 uSt; // stars, crescent, clouds, sun size
out vec4 o;
const int NV = 8;
const vec4 VT[NV] = vec4[NV](
  vec4(-0.06,-1.18, 0.30, 1.0), vec4( 0.40,-0.98, 0.19,-1.0), vec4(-0.95,-0.62, 0.26,-1.0), vec4( 1.25, 0.25, 0.30, 1.0),
  vec4(-0.55, 1.05, 0.28,-1.0), vec4( 0.55, 1.75, 0.34, 1.0), vec4(-1.95,-1.55, 0.42, 1.0), vec4( 1.85,-1.70, 0.38,-1.0));
void main(){
  vec3 d = normalize(uF + vN.x*uR + vN.y*uU);
  float h = d.y;
  if (h < -0.03) { o = vec4(uFogCol, 1.0); return; }
  vec2 p = d.xz/(max(h, 0.0) + 0.30);
  vec2 q = p; float acc = 0.0;
  if (uSw.x > 0.0) {
    for (int i = 0; i < NV; i++) {
      vec2 e = q - VT[i].xy; float el = length(e)/VT[i].z;
      if (el < 4.5) {
        float f = exp(-el*1.5);
        float a = uSw.x*VT[i].w*4.4*f; float c = cos(a), s = sin(a);
        q = VT[i].xy + vec2(c*e.x - s*e.y, s*e.x + c*e.y);
        acc += f;
      }
    }
  }
  q.y += uSw.y*sin(q.x*2.3 + 1.7*sin(q.y*1.6) + uTime*0.06);
  vec2 fl = vec2(uTime*uSw.w, 0.0);
  vec4 s1 = texture(uStroke, q*vec2(1.25, 2.9) + fl);
  vec4 s2 = texture(uStroke, q*vec2(0.26, 0.62) + fl*0.3 + 0.37);
  float band = mix(s1.r*0.75 + s2.r*0.55 - 0.15, 0.5 + 0.5*sin(q.y*6.5 + s1.r*2.0 + s2.r*3.0), uSw.z);
  vec3 col = mix(uSkyA, uSkyB, smoothstep(0.24, 0.76, band));
  col = mix(col, uSkyC, smoothstep(0.52, 0.80, s2.g*0.7 + s1.g*0.3)*0.8);
  col = mix(col, uAccent, smoothstep(0.58, 0.86, s1.g*0.75 + s1.r*0.25)*clamp(acc*1.5, 0.0, 1.0)*uSw.x*0.9);
  col *= 1.0 - s1.b*0.22;
  float cl = smoothstep(0.50, 0.68, s2.r*0.8 + s2.g*0.2 + (s1.r - 0.5)*0.25)*uSt.z;
  col = mix(col, uCloudCol*(0.80 + 0.36*s1.r), cl);
  if (uSt.x > 0.0) {
    vec2 g = p*1.4; vec2 c0 = floor(g - 0.5);
    for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
      vec2 c = c0 + vec2(float(i), float(j));
      vec2 hs = fract(sin(vec2(dot(c, vec2(127.1, 311.7)), dot(c, vec2(269.5, 183.3))))*43758.5453);
      float pick = fract(hs.x*17.3 + hs.y*5.1);
      if (pick < 0.86) {
        vec2 e = p - (c + 0.3 + 0.4*hs)/1.4; float sz = 0.022 + 0.034*pick;
        float dd = length(e)/sz;
        if (dd < 6.0) {
          float ring = 0.5 + 0.5*cos(dd*4.4 - uTime*0.9 + s1.r*4.5 + pick*20.0);
          float halo = exp(-dd*0.50)*(0.30 + 0.70*ring)*smoothstep(6.0, 3.0, dd);
          col = mix(col, mix(uHaloCol, uAccent, smoothstep(1.0, 4.0, dd)*0.7), halo*uSt.x);
          col = mix(col, mix(vec3(1.0, 0.98, 0.80), uHaloCol, smoothstep(0.3, 0.95, dd)*0.6), smoothstep(1.0, 0.78, dd)*uSt.x);
        }
      }
    }
  }
  {
    vec2 e = p - uSunP.xy; float dd = length(e)/uSt.w;
    if (dd < 9.0) {
      float ring = 0.5 + 0.5*cos(dd*4.2 - uTime*0.7 + s1.r*3.4);
      float halo = exp(-dd*0.55)*(0.42 + 0.58*ring)*smoothstep(9.0, 5.0, dd);
      col = mix(col, mix(uHaloCol, uSunCol, 0.35), halo*uSunP.z*0.95);
      float disc = smoothstep(1.0, 0.88, dd);
      float bite = smoothstep(0.78, 0.92, length(e - vec2(0.46, -0.12)*uSt.w)/uSt.w);
      col = mix(col, uSunCol*(0.94 + 0.12*s1.r), disc*mix(1.0, bite, uSt.y)*uSunP.z);
    }
  }
  vec3 hc = uHorizon*(0.88 + 0.24*s1.r);
  col = mix(hc, col, smoothstep(0.0, 0.24, h));
  col = mix(uFogCol, col, smoothstep(-0.03, 0.045, h));
  o = vec4(col, 1.0);
}`;

SH.waterV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=2) in vec4 aCol;
uniform mat4 uVP; uniform vec3 uCam; uniform vec4 uW;
out vec3 vPos; out vec4 vCol; out float vFog;
void main(){
  vec3 p = aPos;
  p.y += aCol.a*(sin(p.x*0.21 + uW.x*0.9) + sin(p.z*0.17 + uW.x*0.7 + p.x*0.05))*0.5;
  gl_Position = uVP*vec4(p,1.0); vPos = p; vCol = aCol;
  vFog = 1.0 - exp(-pow(distance(p, uCam)*uW.z, 1.5));
}`;
SH.waterF = `#version 300 es
precision highp float;
in vec3 vPos; in vec4 vCol; in float vFog;
uniform sampler2D uStroke;
uniform vec3 uCam, uWA, uWB, uWC, uFogCol, uReflCol, uSunCol, uSunDir;
uniform vec4 uW; uniform vec4 uRefl[8]; uniform vec2 uWP; uniform vec2 uRes; // lampAmt, glitter
out vec4 o;
void main(){
  vec2 uv = vPos.xz; float t = uW.x;
  float wv = sin(uv.x*0.33 + t*0.7 + sin(uv.y*0.55)*1.3)*0.07;
  vec4 s = texture(uStroke, vec2(uv.x*0.085 + t*0.011, uv.y*0.29 + wv));
  vec4 s2 = texture(uStroke, vec2(uv.x*0.027 - t*0.005, uv.y*0.10) + 0.5);
  vec3 c = mix(uWA, uWB, smoothstep(0.28, 0.72, s.r + (s2.r - 0.5)*0.7));
  c = mix(c, uWC, smoothstep(0.66, 0.92, s.g)*0.55);
  c *= mix(vec3(1.0), vCol.rgb*2.0, 0.6);
  c *= 1.0 - s.b*0.18;
  float dash = 0.35 + 1.1*smoothstep(0.30, 0.72, s.r);
  if (uWP.x > 0.0) {
    for (int i = 0; i < 8; i++) {
      vec2 L = uRefl[i].xy; vec2 dir = normalize(uCam.xz - L); vec2 e = uv - L;
      float al = dot(e, dir), ac = dot(e, vec2(-dir.y, dir.x)); float len = uRefl[i].z;
      float st = exp(-ac*ac/uRefl[i].w)*smoothstep(-0.5, 2.5, al)*smoothstep(len, len*0.25, al);
      c += uReflCol*st*dash*uWP.x;
    }
  }
  if (uWP.y > 0.0) {
    vec2 dir = normalize(uSunDir.xz + 1e-4); vec2 e = uv - uCam.xz;
    float al = dot(e, dir), ac = dot(e, vec2(-dir.y, dir.x));
    float g = exp(-ac*ac/max(10.0 + al*1.2, 4.0))*smoothstep(2.0, 14.0, al)*smoothstep(0.52, 0.80, s.g*0.6 + s.r*0.4);
    c += uSunCol*g*uWP.y;
  }
  vec2 vq = gl_FragCoord.xy*uRes - 0.5;
  o = vec4(mix(c, uFogCol, vFog)*(1.0 - dot(vq, vq)*0.42), 1.0);
}`;

SH.sprV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aCol;
uniform mat4 uVP; out vec2 vUV; out vec4 vCol;
void main(){ gl_Position = uVP*vec4(aPos,1.0); vUV = aUV; vCol = aCol; }`;
SH.sprF = `#version 300 es
precision mediump float;
in vec2 vUV; in vec4 vCol; uniform int uMode; uniform float uTime; out vec4 o;
void main(){
  float r = length(vUV);
  if (uMode == 0) { o = vec4(vCol.rgb, vCol.a*smoothstep(1.0, 0.25, r)); }
  else if (uMode == 1) {
    float a = atan(vUV.y, vUV.x);
    float rays = 0.55 + 0.45*cos(a*14.0 + r*5.0 - uTime*0.8);
    float ring = 0.6 + 0.4*cos(r*16.0 - uTime*1.2);
    float g = exp(-r*3.2)*1.3 + exp(-r*1.6)*0.45*rays*ring;
    g *= smoothstep(1.0, 0.7, r);
    o = vec4(vCol.rgb*g*vCol.a, 1.0);
  } else {
    float w = abs(vUV.x);
    float line = vUV.y - (w*vCol.a*0.85 - 0.15 - w*w*0.25);
    float wing = smoothstep(0.17*(1.0 - 0.65*w), 0.04, abs(line))*smoothstep(1.0, 0.82, w);
    o = vec4(vCol.rgb, wing);
  }
}`;

SH.blitV = `#version 300 es
layout(location=0) in vec2 aPos; void main(){ gl_Position = vec4(aPos, 1.0, 1.0); }`;
SH.blitF = `#version 300 es
precision mediump float;
uniform sampler2D uTex; uniform vec2 uRes; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy*uRes; vec2 vq = uv - 0.5; o = vec4(texture(uTex, uv).rgb*(1.0 - dot(vq, vq)*0.42), 1.0); }`;
SH.picV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV;
uniform mat4 uVP; uniform vec3 uCam; uniform float uFogD; out vec2 vUV; out float vFog;
void main(){ gl_Position = uVP*vec4(aPos,1.0); vUV = aUV; vFog = 1.0 - exp(-pow(distance(aPos, uCam)*uFogD, 1.5)); }`;
SH.picF = `#version 300 es
precision mediump float;
in vec2 vUV; in float vFog; uniform sampler2D uTex; uniform vec3 uTintC, uFogCol, uC0, uC1, uC2; uniform float uHas; out vec4 o;
void main(){
  vec3 c = texture(uTex, vUV).rgb;
  if (uHas < 0.5) { // a colour study in the painting's own palette until the real picture arrives
    vec4 s = texture(uTex, vUV*vec2(0.55, 0.8)); vec4 s2 = texture(uTex, vUV*0.16 + 0.3);
    c = mix(uC0, uC1, smoothstep(0.3, 0.7, s2.r + (s.r - 0.5)*0.5)); c = mix(c, uC2, smoothstep(0.55, 0.8, s2.g + (s.g - 0.5)*0.4)); c *= 0.85 + 0.3*s.r;
  }
  o = vec4(mix(c*uTintC, uFogCol, vFog), 1.0);
}`;
SH.portalV = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV;
uniform mat4 uVP; out vec2 vUV;
void main(){ gl_Position = uVP*vec4(aPos,1.0); vUV = aUV; }`;
SH.portalF = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uStroke; uniform float uTime; uniform int uId;
uniform vec3 uC0, uC1, uC2, uC3;
out vec4 o;
float sdArc(vec2 p, float r, float w){ return abs(length(p) - r) - w; }
void main(){
  vec2 p = vUV; float t = uTime;
  vec4 s = texture(uStroke, p*vec2(0.9, 1.6) + vec2(t*0.02, 0.0));
  vec4 s2 = texture(uStroke, p*0.35 + 0.2);
  vec3 c;
  if (uId == 1) { // water lilies & the green bridge
    c = mix(uC0, uC1, smoothstep(0.3, 0.7, s.r + s2.r*0.5 - 0.25));
    float lil = smoothstep(0.80, 0.9, texture(uStroke, p*vec2(2.2, 5.0) + 0.1).g)*step(p.y, 0.05);
    c = mix(c, uC3, lil*0.9);
    float br = sdArc(vec2(p.x, (p.y - 0.02)*1.9 + 0.55), 0.95, 0.035);
    c = mix(c, uC2, smoothstep(0.02, 0.0, br)*step(0.0, p.y - 0.02 + 0.3));
    c = mix(c, uC2, smoothstep(0.02, 0.0, abs(sdArc(vec2(p.x, (p.y - 0.14)*1.9 + 0.55), 0.95, 0.0)) - 0.012)*step(-0.2, p.y));
  } else if (uId == 2) { // the great wave
    c = mix(uC3, uC3*0.86, smoothstep(0.2, 0.9, p.y + s2.r*0.3));
    float fuji = smoothstep(0.0, 0.02, (0.18 - abs(p.x - 0.25)*0.9) - (p.y + 0.25));
    c = mix(c, mix(uC0, vec3(0.96), smoothstep(-0.16, -0.12, p.y)), fuji);
    vec2 w = p - vec2(-0.35, -0.15);
    float curl = length(w) - 0.62; float inner = length(w - vec2(0.22, -0.10)) - 0.50;
    float wave = max(curl, -inner); wave = max(wave, -(p.y + 0.55));
    float sea = p.y + 0.48 - 0.07*sin(p.x*7.0 + t*0.6);
    float m = smoothstep(0.02, 0.0, min(wave, sea));
    c = mix(c, mix(uC0, uC1, s.r), m);
    c = mix(c, vec3(0.97, 0.96, 0.9), m*smoothstep(-0.07, -0.01, curl)*step(inner, 0.25)*step(0.0, w.y + 0.2));
  } else if (uId == 3) { // the scream
    float y = p.y + 0.10*sin(p.x*4.0 + sin(p.y*5.0)*1.2 + t*0.3);
    c = mix(uC0, uC1, 0.5 + 0.5*sin(y*16.0 + s.r*2.0));
    c = mix(c, uC2, smoothstep(0.05, -0.05, y + 0.02 + s2.r*0.2));
    float br = smoothstep(0.0, 0.03, (p.x*0.75 - 0.30) - p.y - 0.25);
    c = mix(c, uC3, br);
    float head = length((p - vec2(0.10, -0.30))*vec2(1.0, 0.78)) - 0.12;
    float body = max(abs(p.x - 0.10) - 0.10 - (p.y + 0.42)*-0.25, p.y + 0.40);
    c = mix(c, vec3(0.86, 0.78, 0.55), smoothstep(0.012, 0.0, head));
    c = mix(c, vec3(0.08, 0.08, 0.14), smoothstep(0.012, 0.0, body));
  } else if (uId == 4) { // la grande jatte
    c = mix(uC0, uC0*1.25, smoothstep(0.3, 0.7, s.g));
    c = mix(c, uC1, smoothstep(0.34, 0.38, p.y - p.x*0.22));
    c = mix(c, uC2, smoothstep(0.62, 0.66, p.y - p.x*0.05));
    c = mix(c, uC0*0.55, smoothstep(0.0, 0.25, -p.y - 0.25 + p.x*0.3));
    float par = length((p - vec2(0.30, 0.02))*vec2(1.0, 1.9)) - 0.16;
    c = mix(c, uC3, smoothstep(0.012, 0.0, max(par, -(p.y - 0.0))));
    float fig = max(abs(p.x - 0.30) - 0.055 - (0.0 - p.y)*0.12, max(p.y - 0.0, -p.y - 0.52));
    c = mix(c, vec3(0.16, 0.13, 0.25), smoothstep(0.012, 0.0, fig));
    c *= 0.85 + 0.3*texture(uStroke, p*3.5).r;
  } else if (uId == 5) { // a thousand li of rivers and mountains
    c = mix(uC3, uC3*0.9, s2.r);
    for (int i = 0; i < 3; i++) {
      float fi = float(i); float x = p.x*(1.6 + fi*0.5) + fi*2.3;
      float ridge = -0.28 + fi*-0.16 + 0.26*abs(sin(x*1.9)) + 0.12*sin(x*4.7) + 0.05*sin(x*11.0);
      float m = smoothstep(0.012, 0.0, p.y - ridge);
      vec3 mc = mix(uC1, uC0, smoothstep(ridge - 0.22, ridge, p.y));
      c = mix(c, mix(mc, uC2, fi*0.25), m);
    }
  } else if (uId == 6) { // interior with pearl
    c = mix(uC0, uC0*1.5, smoothstep(0.6, -0.4, length(p - vec2(-0.4, 0.3))));
    float face = length((p - vec2(0.0, 0.02))*vec2(1.0, 0.8)) - 0.26;
    c = mix(c, vec3(0.90, 0.74, 0.58), smoothstep(0.012, 0.0, face));
    float tur = max(length((p - vec2(0.03, 0.14))*vec2(0.92, 1.0)) - 0.30, -(p.y - 0.10 + p.x*0.25));
    c = mix(c, uC1, smoothstep(0.012, 0.0, tur));
    c = mix(c, uC2, smoothstep(0.012, 0.0, max(abs(p.x - 0.22) - 0.05, max(p.y - 0.12, -p.y - 0.42))));
    c = mix(c, uC3, smoothstep(0.012, 0.0, max(abs(p.y + 0.52) - 0.2, abs(p.x) - 0.5 - (p.y + 0.5)*-0.5)));
    c = mix(c, vec3(1.0), smoothstep(0.03, 0.015, length(p - vec2(-0.13, -0.20))));
  } else if (uId == 7) { // wanderer above the sea of fog
    c = mix(uC1, uC0, smoothstep(-0.2, 0.9, p.y + s2.r*0.3));
    for (int i = 0; i < 3; i++) { float fi = float(i); float x = p.x*(1.4 + fi*0.6) + fi*1.7; float ridge = -0.05 - fi*0.2 + 0.2*abs(sin(x*2.1)) + 0.08*sin(x*5.3); c = mix(c, mix(uC3, uC1, 0.55 - fi*0.2), smoothstep(0.012, 0.0, p.y - ridge)*0.75); }
    c = mix(c, uC1, smoothstep(0.0, -0.3, p.y + 0.35 + 0.08*sin(p.x*6.0 + t*0.4)));
    float rock = max(abs(p.x)*0.9 - 0.42 - (p.y + 0.62)*-0.9, p.y + 0.42); c = mix(c, uC2*0.7, smoothstep(0.012, 0.0, rock));
    float man = max(abs(p.x) - 0.075 - (-0.06 - p.y)*0.07, max(p.y + 0.06, -p.y - 0.46)); c = mix(c, uC2, smoothstep(0.012, 0.0, man));
    c = mix(c, vec3(0.80, 0.52, 0.30), smoothstep(0.012, 0.0, length(p - vec2(0.0, 0.0)) - 0.06));
  } else { // starry night — the way home
    vec2 e = p - vec2(0.1, 0.25); float a = 5.0*exp(-length(e)*3.0);
    vec2 q = vec2(cos(a)*e.x - sin(a)*e.y, sin(a)*e.x + cos(a)*e.y);
    vec4 k = texture(uStroke, q*vec2(0.9, 2.2) + vec2(t*0.03, 0.0));
    c = mix(uC0, uC1, smoothstep(0.25, 0.75, k.r));
    c = mix(c, uC2, smoothstep(0.7, 0.9, k.g)*0.8);
    c = mix(c, uC2, exp(-length(p - vec2(0.62, 0.62))*7.0));
    c = mix(c, uC2, exp(-length(p - vec2(-0.55, 0.55))*12.0));
    float hills = smoothstep(0.0, 0.02, -0.35 + 0.10*sin(p.x*3.0 + 1.0) - p.y);
    c = mix(c, uC0*0.6, hills);
    float cyp = max(abs(p.x + 0.55) - 0.10*(1.0 - smoothstep(-0.8, 0.5, p.y)) - 0.02, p.y - 0.45);
    c = mix(c, uC3, smoothstep(0.012, 0.0, cyp));
  }
  c *= 0.86 + 0.28*s.r; c *= 1.0 - s.b*0.2;
  float vg = smoothstep(1.25, 0.6, length(p*vec2(1.0, 0.9)));
  o = vec4(c*(0.75 + 0.25*vg)*(1.0 + 0.06*sin(t*1.3)), 1.0);
}`;

class Renderer {
  constructor(canvas, aa) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: !!aa, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', desynchronized: true, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.prog = {};
    for (const n of ['world', 'char', 'sky', 'water', 'spr', 'portal', 'blit', 'pic']) this.prog[n] = this._program(SH[n + 'V'], SH[n + 'F']);
    this.tex = {};
    this.scale = 1; this.w = 1; this.h = 1; this.skyScale = 0.6;
    // fullscreen triangle
    this.fsVao = gl.createVertexArray(); gl.bindVertexArray(this.fsVao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // dynamic sprite buffer
    this.sprMax = 1300; this.sprData = new Float32Array(this.sprMax * 4 * 9);
    this.sprVao = gl.createVertexArray(); gl.bindVertexArray(this.sprVao);
    this.sprBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.sprBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.sprData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
    const si = new Uint16Array(this.sprMax * 6);
    for (let i = 0; i < this.sprMax; i++) si.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const sib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, si, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.sprN = [0, 0, 0]; this.sprOff = [0, 0, 0];
    this.planes = new Float32Array(24);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.depthFunc(gl.LEQUAL);
    this.drawn = 0; this.md = gl.getExtension('WEBGL_multi_draw'); this.mdC = new Int32Array(1024); this.mdO = new Int32Array(1024);
  }
  _program(vs, fs) {
    const gl = this.gl, mk = (t, s) => {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
      return sh;
    };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i), nm = inf.name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  }
  /* brush-stroke atlas: R value, G hue selector, B gap between strokes */
  makeStroke(name, mode, seed) {
    const gl = this.gl, S = 1024, K = S / 512, D = new Uint8Array(S * S * 4), rng = RNG(seed || 7);
    for (let i = 0; i < S * S; i++) { D[i * 4] = 110 + rng() * 36; D[i * 4 + 1] = 110 + rng() * 36; D[i * 4 + 2] = 40; D[i * 4 + 3] = 255; }
    const stamp = (x, y, ang, len, wid, r, g, round) => {
      x *= K; y *= K; len *= K; wid *= K;
      const dx = Math.cos(ang), dy = Math.sin(ang), hw = wid / 2, ext = Math.ceil(len / 2 + hw + 2);
      const fr = (0.5 + rng() * 0.9) / K, ph = rng() * 9, grad = rng.s() * 22;
      for (let j = -ext; j <= ext; j++) for (let i = -ext; i <= ext; i++) {
        const al = i * dx + j * dy, ac = -i * dy + j * dx;
        const cl = Math.max(-len / 2, Math.min(len / 2, al)), d = Math.hypot(al - cl, ac);
        if (d > hw) continue;
        const px = ((Math.round(x) + i) % S + S) % S, py = ((Math.round(y) + j) % S + S) % S, k = (py * S + px) * 4;
        const edge = sstep(hw - 2.4 * K, hw, d);
        const bristle = round ? 0 : Math.sin(ac * fr + ph) * 16 + Math.sin(ac * fr * 2.7 + ph * 2) * 7;
        D[k] = clamp(r + bristle + grad * (al / len) + (1 - edge) * 6, 0, 255);
        D[k + 1] = g; D[k + 2] = edge * 255;
      }
    };
    if (mode === 'dots') {
      for (let n = 0; n < 5200; n++) stamp(rng() * 512, rng() * 512, 0, 0, rng.r(9, 15), rng.r(30, 225), rng.r(10, 245), true);
    } else if (mode === 'paper') {
      for (let n = 0; n < 2600; n++) stamp(rng() * 512, rng() * 512, rng.s() * 0.2, rng.r(60, 180), rng.r(3, 7), rng.r(108, 148), rng.r(108, 148), true);
      for (let i = 0; i < S * S; i++) D[i * 4 + 2] = D[i * 4 + 2] * 0.25;
    } else if (mode === 'dab') {
      for (let n = 0; n < 4200; n++) stamp(rng() * 512, rng() * 512, rng.s() * 0.9, rng.r(10, 26), rng.r(10, 17), rng.r(35, 220), rng.r(15, 240), false);
      for (let i = 0; i < S * S; i++) D[i * 4 + 2] = D[i * 4 + 2] * 0.5;
    } else {
      for (let n = 0; n < 3400; n++) {
        const big = n < 900;
        stamp(rng() * 512, rng() * 512, (rng() + rng() + rng() - 1.5) * 0.42, big ? rng.r(46, 96) : rng.r(26, 60), big ? rng.r(12, 19) : rng.r(8, 13), rng.r(28, 228), rng.r(15, 240), false);
      }
    }
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, D);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    this.tex[name] = t; return t;
  }
  /* static geometry */
  upload(pk, kind) {
    const gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = (data, loc, n, type, norm) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, type, norm, 0, 0); return b; };
    const bufs = [buf(pk.pos, 0, 3, gl.FLOAT, false), buf(pk.nrm, 1, 4, gl.BYTE, true), buf(pk.col, 2, 4, gl.UNSIGNED_BYTE, true)];
    if (kind === 'char') bufs.push(buf(pk.boneB, 3, 4, gl.UNSIGNED_BYTE, false));
    else bufs.push(buf(pk.lamp || new Uint8Array(pk.nv * 4), 3, 4, gl.UNSIGNED_BYTE, true));
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    const small = pk.nv < 65536, idx = small ? new Uint16Array(pk.idx) : pk.idx;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    bufs.push(ib);
    return { vao, ni: pk.ni, chunks: pk.chunks || null, type: small ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT, isz: small ? 2 : 4, bufs };
  }
  uploadPortal(quads) { // quads: Float32Array of pos3+uv2 per vertex, 4 per quad
    const gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, quads, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    const n = quads.length / 20, si = new Uint16Array(n * 6);
    for (let i = 0; i < n; i++) si.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, si, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, n, bufs: [b, ib] };
  }
  free(m) { if (!m) return; const gl = this.gl; for (const b of m.bufs) gl.deleteBuffer(b); gl.deleteVertexArray(m.vao); }
  resize(cssW, cssH, scale) {
    const w = Math.max(2, Math.round(cssW * scale)), h = Math.max(2, Math.round(cssH * scale));
    if (w !== this.w || h !== this.h) { this.canvas.width = this.w = w; this.canvas.height = this.h = h; }
    this.scale = scale;
  }
  _planes(vp) {
    const P = this.planes, m = vp;
    const set = (i, a, b, c, d) => { const l = Math.hypot(a, b, c); P[i * 4] = a / l; P[i * 4 + 1] = b / l; P[i * 4 + 2] = c / l; P[i * 4 + 3] = d / l; };
    set(0, m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
    set(1, m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
    set(2, m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
    set(3, m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
    set(4, m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
    set(5, m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
  }
  visible(x, y, z, r) {
    const P = this.planes;
    for (let i = 0; i < 6; i++) if (P[i * 4] * x + P[i * 4 + 1] * y + P[i * 4 + 2] * z + P[i * 4 + 3] < -r) return false;
    return true;
  }
  begin(cam, env, time) {
    const gl = this.gl;
    this.cam = cam; this.env = env; this.time = time;
    { // repaint the sky only when the view turned, the light changed, or its turn came up
      const f = cam.fwd, l = this.lastF || (this.lastF = new Float32Array(3)); this.skyN = (this.skyN || 0) + 1;
      if (this.skyDirty || this.skyN >= (this.skyEvery || 1) || Math.abs(f[0] - l[0]) + Math.abs(f[1] - l[1]) + Math.abs(f[2] - l[2]) > 0.0012) { this.paintSky(cam, env, time); l[0] = f[0]; l[1] = f[1]; l[2] = f[2]; this.skyN = 0; this.skyDirty = false; }
    }
    gl.viewport(0, 0, this.w, this.h);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    this._planes(cam.vp); this.drawn = 0;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[env.stroke] || this.tex.oil);
  }
  drawWorld(m, maxDist) {
    const gl = this.gl, pr = this.prog.world, u = pr.u, e = this.env, c = this.cam;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(u.uVP, false, c.vp); gl.uniform3fv(u.uCam, c.pos);
    gl.uniform4f(u.uW, this.time, e.wind, e.fogD, 0);
    gl.uniform3fv(u.uSunDir, e.sunDir); gl.uniform3fv(u.uLight, e.light); gl.uniform3fv(u.uShade, e.shade);
    gl.uniform3fv(u.uFogCol, e.fog); gl.uniform3fv(u.uTint, e.tint);
    gl.uniform4f(u.uP, e.strokeScale, e.strokeAmt, e.lampAmt, e.glow); gl.uniform1f(u.uShadowAmt, e.shadowAmt);
    gl.uniform1i(u.uStroke, 0); gl.uniform2f(u.uRes, 1 / this.w, 1 / this.h); gl.uniform1f(u.uQ, this.q2 ? 1 : 0); gl.uniform3fv(u.uGlowCol, e.glowCol); gl.uniform3fv(u.uNA, e.nightA); gl.uniform3fv(u.uNB, e.nightB); gl.uniform1f(u.uNMix, e.nightMix);
    gl.bindVertexArray(m.vao);
    if (m.chunks) {
      const md = maxDist || 1e9, cx = c.pos[0], cz = c.pos[2], C = this.mdC, O = this.mdO; let n = 0;
      for (const k of m.chunks) if (this.visible(k.cx, k.cy, k.cz, k.r) && Math.hypot(k.cx - cx, k.cz - cz) - k.r < md && n < 1024) {
        const off = k.start * m.isz;
        if (n && O[n - 1] + C[n - 1] * m.isz === off) C[n - 1] += k.count; else { C[n] = k.count; O[n] = off; n++; }
        this.drawn += k.count;
      }
      if (this.md) this.md.multiDrawElementsWEBGL(gl.TRIANGLES, C, 0, m.type, O, 0, n);
      else for (let i = 0; i < n; i++) gl.drawElements(gl.TRIANGLES, C[i], m.type, O[i]);
      this.calls = n;
    } else { gl.drawElements(gl.TRIANGLES, m.ni, m.type, 0); this.drawn += m.ni; }
  }
  beginChars() {
    const gl = this.gl, pr = this.prog.char, u = pr.u, e = this.env, c = this.cam;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(u.uVP, false, c.vp); gl.uniform3fv(u.uCam, c.pos); gl.uniform1f(u.uFogD, e.fogD);
    gl.uniform3fv(u.uSunDir, e.sunDir); gl.uniform3fv(u.uLight, e.light); gl.uniform3fv(u.uShade, e.cshade || e.shade);
    gl.uniform3fv(u.uFogCol, e.fog); gl.uniform3fv(u.uTint, e.tint); gl.uniform1f(u.uStrokeAmt, e.strokeAmt);
    gl.uniform1i(u.uStroke, 0); gl.uniform3fv(u.uNA, e.nightA); gl.uniform3fv(u.uNB, e.nightB); gl.uniform1f(u.uNMix, e.nightMix);
  }
  drawChar(m, bones, lamp, outline) {
    const gl = this.gl, u = this.prog.char.u;
    gl.uniformMatrix4fv(u.uBones, false, bones); gl.uniform3fv(u.uLamp, lamp);
    gl.bindVertexArray(m.vao);
    gl.uniform1f(u.uOutline, 0); gl.drawElements(gl.TRIANGLES, m.ni, m.type, 0);
    if (outline > 0) { gl.cullFace(gl.FRONT); gl.uniform1f(u.uOutline, outline); gl.drawElements(gl.TRIANGLES, m.ni, m.type, 0); gl.cullFace(gl.BACK); }
    this.drawn += m.ni;
  }
  drawWater(m, refl) {
    const gl = this.gl, pr = this.prog.water, u = pr.u, e = this.env, c = this.cam;
    gl.useProgram(pr.p);
    gl.uniformMatrix4fv(u.uVP, false, c.vp); gl.uniform3fv(u.uCam, c.pos);
    gl.uniform4f(u.uW, this.time, e.wind, e.fogD, 0);
    gl.uniform3fv(u.uWA, e.waterA); gl.uniform3fv(u.uWB, e.waterB); gl.uniform3fv(u.uWC, e.waterC);
    gl.uniform3fv(u.uFogCol, e.fog); gl.uniform3fv(u.uReflCol, e.reflCol); gl.uniform3fv(u.uSunCol, e.glitCol); gl.uniform3fv(u.uSunDir, e.sunDir);
    gl.uniform4fv(u.uRefl, refl); gl.uniform2f(u.uWP, e.lampAmt * e.reflAmt, e.glitter); gl.uniform2f(u.uRes, 1 / this.w, 1 / this.h);
    gl.uniform1i(u.uStroke, 0);
    gl.bindVertexArray(m.vao); gl.drawElements(gl.TRIANGLES, m.ni, m.type, 0); this.drawn += m.ni;
  }
  drawPortals(m, list) {
    const gl = this.gl, pr = this.prog.portal, u = pr.u;
    gl.useProgram(pr.p); gl.uniformMatrix4fv(u.uVP, false, this.cam.vp); gl.uniform1f(u.uTime, this.time); gl.uniform1i(u.uStroke, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex.oil);
    gl.bindVertexArray(m.vao);
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      gl.uniform1i(u.uId, q.id); gl.uniform3fv(u.uC0, q.c[0]); gl.uniform3fv(u.uC1, q.c[1]); gl.uniform3fv(u.uC2, q.c[2]); gl.uniform3fv(u.uC3, q.c[3]);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 12);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.env.stroke] || this.tex.oil);
  }
  _skyTarget() {
    const gl = this.gl, w = Math.max(2, Math.round(this.w * this.skyScale)), h = Math.max(2, Math.round(this.h * this.skyScale));
    if (this.skyW === w && this.skyH === h) return;
    this.skyW = w; this.skyH = h;
    if (!this.skyTex) { this.skyTex = gl.createTexture(); this.skyFbo = gl.createFramebuffer(); }
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.skyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.skyFbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.skyTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE0);
  }
  /* the sky is the costliest shader: paint it small first, enlarge it behind the scene later */
  paintSky(cam, env, time) {
    const gl = this.gl, pr = this.prog.sky, u = pr.u, e = env, c = cam, k = e.sky;
    this._skyTarget();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.skyFbo); gl.viewport(0, 0, this.skyW, this.skyH);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[env.stroke] || this.tex.oil);
    gl.useProgram(pr.p);
    gl.uniform3fv(u.uR, c.skyR); gl.uniform3fv(u.uU, c.skyU); gl.uniform3fv(u.uF, c.fwd);
    gl.uniform1f(u.uTime, time); gl.uniform1i(u.uStroke, 0);
    gl.uniform3fv(u.uSkyA, k.A); gl.uniform3fv(u.uSkyB, k.B); gl.uniform3fv(u.uSkyC, k.C); gl.uniform3fv(u.uAccent, k.accent);
    gl.uniform3fv(u.uHorizon, k.horizon); gl.uniform3fv(u.uFogCol, e.fog); gl.uniform3fv(u.uCloudCol, k.cloudCol);
    gl.uniform3fv(u.uSunCol, k.sunCol); gl.uniform3fv(u.uHaloCol, k.haloCol);
    const s = e.sunDir, d = Math.max(s[1], 0) + 0.30;
    gl.uniform3f(u.uSunP, s[0] / d, s[2] / d, k.sunAmt);
    gl.uniform4f(u.uSw, k.swirl, k.wave, k.band, k.flow); gl.uniform4f(u.uSt, k.stars, k.crescent, k.cloud, k.sunSize);
    gl.bindVertexArray(this.fsVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.depthMask(true);
  }
  drawSky() {
    const gl = this.gl, pr = this.prog.blit, u = pr.u;
    gl.useProgram(pr.p); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.skyTex);
    gl.uniform1i(u.uTex, 1); gl.uniform2f(u.uRes, 1 / this.w, 1 / this.h);
    gl.bindVertexArray(this.fsVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  }
  /* framed pictures with real textures (museum) */
  uploadPics(quads) { return this.uploadPortal(quads); }
  picTexture(img) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch (e) { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.deleteTexture(t); return null; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.env ? this.env.stroke : 'oil'] || this.tex.oil);
    return t;
  }
  drawPics(m, list) {
    const gl = this.gl, pr = this.prog.pic, u = pr.u, e = this.env;
    gl.useProgram(pr.p); gl.uniformMatrix4fv(u.uVP, false, this.cam.vp); gl.uniform3fv(u.uCam, this.cam.pos); gl.uniform1f(u.uFogD, e.fogD); gl.uniform3fv(u.uFogCol, e.fog);
    const k = 1 - e.nightMix * 0.45; gl.uniform3f(u.uTintC, k, k, k * 1.02 + e.nightMix * 0.08); gl.uniform1i(u.uTex, 0);
    gl.bindVertexArray(m.vao);
    for (let i = 0; i < list.length; i++) { const q = list[i]; gl.bindTexture(gl.TEXTURE_2D, q.tex || this.tex.oil); gl.uniform1f(u.uHas, q.tex ? 1 : 0); if (!q.tex) { gl.uniform3fv(u.uC0, q.c[0]); gl.uniform3fv(u.uC1, q.c[1]); gl.uniform3fv(u.uC2, q.c[2]); } gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 12); }
    gl.bindTexture(gl.TEXTURE_2D, this.tex[e.stroke] || this.tex.oil);
  }
  /* sprites: mode 0 soft blobs (alpha), 1 glow (additive), 2 birds (alpha) */
  sprBegin() { if (!this.sq) { this.sq = [new Float32Array(13 * 700), new Float32Array(13 * 400), new Float32Array(13 * 200)]; this.sn = [0, 0, 0]; } this.sn[0] = this.sn[1] = this.sn[2] = 0; }
  spr(mode, x, y, z, rx, ry, rz, ux, uy, uz, r, g, b, a) {
    const Q = this.sq[mode]; let i = this.sn[mode]; if (i + 13 > Q.length) return;
    Q[i++] = x; Q[i++] = y; Q[i++] = z; Q[i++] = rx; Q[i++] = ry; Q[i++] = rz; Q[i++] = ux; Q[i++] = uy; Q[i++] = uz; Q[i++] = r; Q[i++] = g; Q[i++] = b; Q[i++] = a; this.sn[mode] = i;
  }
  sprFlush() {
    const gl = this.gl, D = this.sprData; let n = 0;
    for (let mode = 0; mode < 3; mode++) {
      const Q = this.sq[mode], len = this.sn[mode]; this.sprOff[mode] = n; let c = 0;
      for (let i = 0; i < len && n < this.sprMax; i += 13, n++, c++) {
        const x = Q[i], y = Q[i + 1], z = Q[i + 2], rx = Q[i + 3], ry = Q[i + 4], rz = Q[i + 5], ux = Q[i + 6], uy = Q[i + 7], uz = Q[i + 8];
        for (let k = 0; k < 4; k++) {
          const sx = (k === 1 || k === 2) ? 1 : -1, sy = k >= 2 ? 1 : -1, o = (n * 4 + k) * 9;
          D[o] = x + rx * sx + ux * sy; D[o + 1] = y + ry * sx + uy * sy; D[o + 2] = z + rz * sx + uz * sy;
          D[o + 3] = sx; D[o + 4] = sy; D[o + 5] = Q[i + 9]; D[o + 6] = Q[i + 10]; D[o + 7] = Q[i + 11]; D[o + 8] = Q[i + 12];
        }
      }
      this.sprN[mode] = c;
    }
    if (!n) return;
    const pr = this.prog.spr, u = pr.u;
    gl.useProgram(pr.p); gl.uniformMatrix4fv(u.uVP, false, this.cam.vp); gl.uniform1f(u.uTime, this.time);
    gl.bindVertexArray(this.sprVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.sprBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, D.subarray(0, n * 36));
    gl.enable(gl.BLEND); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    for (let mode = 0; mode < 3; mode++) {
      if (!this.sprN[mode]) continue;
      if (mode === 1) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1i(u.uMode, mode);
      gl.drawElements(gl.TRIANGLES, this.sprN[mode] * 6, gl.UNSIGNED_SHORT, this.sprOff[mode] * 12);
    }
    gl.disable(gl.BLEND); gl.depthMask(true); gl.enable(gl.CULL_FACE);
  }
}
