// Original postprocessing shaders and render pipeline.
import {
  AlwaysDepth,
  BufferAttribute,
  BufferGeometry,
  DataUtils,
  DepthTexture,
  FloatType,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  Mesh,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  RGBAFormat,
  RedFormat,
  ShaderMaterial,
  UnsignedByteType,
  UnsignedIntType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "../vendor/three-r180.js";
import { SKY_COLORS, SUN_LIGHT } from "../core/config.js";
import { SKY_COLOR_GLSL, SKY_NOISE_GLSL } from "./sky.js";

var POSTPROCESS_SHADER_MARKER = "// SALTLINE_POST";

var n1 = "0.05";

var Zy = "0.05";

var G6 =
  "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

var Js = `
varying vec2 vUv;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

var Og = `
uniform sampler2D tAdapt; uniform float uExposure, uKey, uMinE, uMaxE, uAuto;
float slExposure(){ float a = texture2D(tAdapt, vec2(0.5)).r; return uExposure * mix(1.0, clamp(pow(uKey / max(a, 1e-4), 0.85), uMinE, uMaxE), uAuto); }
`;

var q6 = `${Js}
uniform sampler2D tDepth;
void main(){ gl_FragDepth = texture2D(tDepth, vUv).r; gl_FragColor = vec4(0.0); }`;

var X6 = `${Js}
uniform sampler2D tDepth; uniform float uNear, uFar;
void main(){
  // exact texel fetch: sampling at a texel corner would pick rows unpredictably and band the AO on grazing floors
  ivec2 p = min(ivec2(gl_FragCoord.xy) * 2, textureSize(tDepth, 0) - 1);
  float d = texelFetch(tDepth, p, 0).r;
  float z = d < ${n1} ? 0.01 : (uNear * uFar) / (uFar - d * (uFar - uNear));
  gl_FragColor = vec4(z, 0.0, 0.0, 1.0);
}`;

var Y6 = `${Js}
uniform sampler2D tDepthHalf; uniform vec2 uTanHalf, uTexel; uniform float uRadius, uIntensity, uAspect;
vec3 vpos(vec2 uv, float z){ return vec3((uv * 2.0 - 1.0) * uTanHalf * z, -z); }
void main(){
  float z0 = texture2D(tDepthHalf, vUv).r;
  if (z0 < ${Zy} || z0 > 140.0) { gl_FragColor = vec4(1.0); return; }
  vec3 P = vpos(vUv, z0);
  vec2 ox = vec2(uTexel.x, 0.0), oy = vec2(0.0, uTexel.y);
  float zl = texture2D(tDepthHalf, vUv - ox).r, zr = texture2D(tDepthHalf, vUv + ox).r;
  float zd = texture2D(tDepthHalf, vUv - oy).r, zu = texture2D(tDepthHalf, vUv + oy).r;
  vec3 dx = abs(zl - z0) < abs(zr - z0) ? P - vpos(vUv - ox, zl) : vpos(vUv + ox, zr) - P;
  vec3 dy = abs(zd - z0) < abs(zu - z0) ? P - vpos(vUv - oy, zd) : vpos(vUv + oy, zu) - P;
  vec3 n = normalize(cross(dx, dy));
  float R = uRadius * (0.6 + 0.4 * clamp(z0 / 12.0, 0.0, 1.0));
  float rUv = clamp(R / (2.0 * z0 * uTanHalf.y), 3.0 * uTexel.y, 0.14);
  float R2 = R * R;
  float rot = ign(gl_FragCoord.xy) * 6.2831853;
  float sum = 0.0;
  for (int i = 0; i < AO_TAPS; i++) {
    float a = (float(i) + 0.5) / float(AO_TAPS);
    float th = a * 6.2831853 * 3.0 + rot;
    vec2 o = vec2(cos(th), sin(th)) * a * rUv; o.x /= uAspect;
    vec2 uv2 = vUv + o;
    float z2 = texture2D(tDepthHalf, uv2).r;
    vec3 v = vpos(uv2, z2) - P;
    float vv = dot(v, v), vn = dot(v, n);
    float f = max(R2 - vv, 0.0);
    sum += f * f * f * max((vn - (0.015 + 0.004 * z0)) / (vv + 0.004), 0.0);
  }
  float ao = max(0.0, 1.0 - uIntensity * sum * 5.0 / (R2 * R2 * R2 * float(AO_TAPS)));
  ao = mix(ao, 1.0, smoothstep(70.0, 140.0, z0));
  gl_FragColor = vec4(ao, ao, ao, 1.0);
}`;

var $6 = `${Js}
uniform sampler2D tDepthHalf, tShadow;
uniform mat4 uShadowMatrix, uCamWorld;
uniform vec3 uCamPos, uSunRad, uAmb;
uniform vec2 uTanHalf;
uniform float uHasShadow, uMaxDist, uSigma, uFarZ, uFarHaze, uFlicker, uBoxDust;
uniform vec3 uBoxMin, uBoxMax;
${SKY_COLOR_GLSL}
float shape(float h){ return 0.30 + 0.70 * exp(-max(h, 0.0) / 5.5); }
float hg(float mu, float g){ float g2 = g * g; return (1.0 - g2) / (12.566371 * pow(max(1.0 + g2 - 2.0 * g * mu, 1e-4), 1.5)); }
float sunVis(vec3 p){
  vec4 sc = uShadowMatrix * vec4(p, 1.0);
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0 || sc.z < 0.0) return 1.0;
  float d = dot(texture2D(tShadow, sc.xy), vec4(0.99609375, 0.99609375 / 256.0, 0.99609375 / 65536.0, 1.0 / 16777216.0));
  return step(sc.z - 0.0006, d);
}
void main(){
  float z = texture2D(tDepthHalf, vUv).r;
  if (z < ${Zy}) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec3 vd = vec3((vUv * 2.0 - 1.0) * uTanHalf, -1.0);
  float rl = length(vd);
  vec3 rd = normalize(mat3(uCamWorld) * vd);
  float dist = z * rl;
  bool isSky = z > uFarZ * 0.97;
  float maxD = min(dist, isSky ? uMaxDist * 0.55 : uMaxDist);
  float mu = dot(rd, uSunDir);
  // two-lobe phase: tight forward lobe for the gold glow toward the sun + a broad lobe so side-lit shafts stay visible
  float ph = min(hg(mu, 0.78) * 0.55 + hg(mu, 0.25) * 0.45, 1.15);
  float j = ign(gl_FragCoord.xy);
  vec3 acc = vec3(0.0); float T = 1.0; float tPrev = 0.0;
  for (int i = 0; i < VOL_STEPS; i++) {
    float f = (float(i) + 1.0) / float(VOL_STEPS);
    float t1 = maxD * f * (0.35 + 0.65 * f);              // denser sampling near the eye
    float ds = t1 - tPrev;
    vec3 p = uCamPos + rd * (tPrev + ds * j);
    float sh = uHasShadow > 0.5 ? sunVis(p) : 1.0;
    // dusty interior (the shed): thicker air so sun shafts through doors, louvres and roof holes read; less sky ambient
    vec3 bq = step(uBoxMin, p) * step(p, uBoxMax); float inb = bq.x * bq.y * bq.z;
    float ext = uSigma * shape(p.y) * (1.0 + uBoxDust * inb);
    float Ti = exp(-ext * ds);
    // art direction: beams near the eye read strongly (shafts between stacks), the far field stays a restrained veil
    float nearW = mix(2.3, 0.55, smoothstep(4.0, 85.0, tPrev + ds * j));
    vec3 src = uSunRad * (ph * sh * mix(nearW, 1.6, inb)) + uAmb * (0.40 + 0.60 * sh) * mix(1.0, 0.22, inb);
    acc += T * src * (1.0 - Ti);
    T *= Ti; tPrev = t1;
  }
  // analytic continuation for far geometry (ship, cranes, skyline): fades into the horizon colour of that direction
  if (!isSky && dist > uMaxDist) {
    float h1 = uCamPos.y + rd.y * uMaxDist, h2 = uCamPos.y + rd.y * dist;
    float tau = uSigma * uFarHaze * (dist - uMaxDist) * 0.5 * (shape(h1) + shape(h2));
    float Tf = exp(-tau);
    vec3 hc = horizonColor(rd) * 0.50 + uAmb * 0.6;
    acc += T * hc * (1.0 - Tf);
    T *= Tf;
  }
  gl_FragColor = vec4(acc, T);
}`;

var $y = `${Js}
uniform sampler2D tSrc, tDepthHalf; uniform vec2 uDir;
void main(){
  float z0 = texture2D(tDepthHalf, vUv).r;
  float zc = min(z0, 300.0);
  vec4 acc = vec4(0.0); float ws = 0.0;
  for (int i = -3; i <= 3; i++) {
    vec2 uv = vUv + uDir * float(i);
    float z = min(texture2D(tDepthHalf, uv).r, 300.0);
    float w = (1.0 - abs(float(i)) * 0.22) * max(0.0, 1.0 - abs(z - zc) / (BLUR_TOL * zc + 0.02));
    acc += texture2D(tSrc, uv) * w; ws += w;
  }
  gl_FragColor = ws > 1e-4 ? acc / ws : texture2D(tSrc, vUv);
}`;

var Z6 = `${Js}
uniform sampler2D tColor, tDepth, tDepthHalf, tAO, tVol;
uniform vec2 uHalfRes; uniform float uNear, uFar, uAoOn, uVolOn, uAoStrength;
${Og}
void main(){
  vec3 col = max(texture2D(tColor, vUv).rgb, vec3(0.0));
  float d = texture2D(tDepth, vUv).r;
  if (d >= ${n1}) {
    float z = (uNear * uFar) / (uFar - d * (uFar - uNear));
    // joint bilateral upsample of the half-res buffers
    vec2 hp = vUv * uHalfRes - 0.5; vec2 f = fract(hp); vec2 base = (floor(hp) + 0.5) / uHalfRes; vec2 tx = 1.0 / uHalfRes;
    float ao = 0.0; vec4 vol = vec4(0.0); float ws = 0.0;
    float zc = min(z, 300.0);
    for (int k = 0; k < 4; k++) {
      vec2 o = vec2(float(k & 1), float(k >> 1));
      vec2 uv = base + o * tx;
      float zh = min(texture2D(tDepthHalf, uv).r, 300.0);
      float w = (o.x > 0.5 ? f.x : 1.0 - f.x) * (o.y > 0.5 ? f.y : 1.0 - f.y);
      w *= 1.0 / (0.015 + abs(zh - zc) / zc) ;
      w = max(w, 1e-5);
      ao += texture2D(tAO, uv).r * w; vol += texture2D(tVol, uv) * w; ws += w;
    }
    ao /= ws; vol /= ws;
    if (uAoOn > 0.5 && d < 0.99999) {
      // occlusion belongs to ambient light: fade it out on brightly lit pixels so sunlit surfaces never get dirty halos
      float lit = smoothstep(0.16, 0.85, luma(col) * slExposure());
      float a = mix(1.0, ao, uAoStrength * (1.0 - 0.8 * lit));
      col *= mix(vec3(a), vec3(1.0), vec3(0.0, 0.03, 0.07));      // faintly cool occlusion
    }
    if (uVolOn > 0.5) col = col * vol.a + vol.rgb;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

var j6 = `${Js}
uniform sampler2D tColor, tDepth; uniform mat4 uInvViewProj, uPrevViewProj; uniform float uShutter; uniform vec2 uRes;
void main(){
  vec4 c0 = texture2D(tColor, vUv);
  float d = texture2D(tDepth, vUv).r;
  if (d < ${n1}) { gl_FragColor = c0; return; }
  vec4 wp = uInvViewProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); wp /= wp.w;
  vec4 pc = uPrevViewProj * wp;
  vec2 puv = pc.xy / max(pc.w, 1e-4) * 0.5 + 0.5;
  vec2 vel = (vUv - puv) * uShutter;
  float len = length(vel);
  if (pc.w <= 0.0 || len * uRes.y < 0.75) { gl_FragColor = c0; return; }
  vel *= min(1.0, 0.018 / len);
  float j = ign(gl_FragCoord.xy) - 0.5;
  vec3 acc = c0.rgb; float ws = 1.0;
  for (int i = 0; i < 9; i++) {
    vec2 uv = vUv + vel * ((float(i) + 0.5 + j) / 9.0 - 0.5);
    float w = texture2D(tDepth, uv).r < ${n1} ? 0.0 : 1.0;
    acc += texture2D(tColor, uv).rgb * w; ws += w;
  }
  gl_FragColor = vec4(acc / ws, 1.0);
}`;

var J6 = `${Js}
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uFirst;
vec3 s(vec2 o){ return min(max(texture2D(tSrc, vUv + o * uTexel).rgb, vec3(0.0)), vec3(400.0)); }
float kw(vec3 c){ return 1.0 / (1.0 + luma(c) * 0.08); }
void main(){
  vec3 a = s(vec2(-2.0, 2.0)), b = s(vec2(0.0, 2.0)), c = s(vec2(2.0, 2.0));
  vec3 d = s(vec2(-2.0, 0.0)), e = s(vec2(0.0, 0.0)), f = s(vec2(2.0, 0.0));
  vec3 g = s(vec2(-2.0, -2.0)), h = s(vec2(0.0, -2.0)), i = s(vec2(2.0, -2.0));
  vec3 j = s(vec2(-1.0, 1.0)), k = s(vec2(1.0, 1.0)), l = s(vec2(-1.0, -1.0)), m = s(vec2(1.0, -1.0));
  vec3 col;
  if (uFirst > 0.5) {
    // partial Karis average on the first downsample: tames fireflies without killing the sun
    vec3 g0 = (a + b + d + e) * 0.25, g1 = (b + c + e + f) * 0.25, g2 = (d + e + g + h) * 0.25, g3 = (e + f + h + i) * 0.25, g4 = (j + k + l + m) * 0.25;
    float w0 = kw(g0) * 0.125, w1 = kw(g1) * 0.125, w2 = kw(g2) * 0.125, w3 = kw(g3) * 0.125, w4 = kw(g4) * 0.5;
    col = (g0 * w0 + g1 * w1 + g2 * w2 + g3 * w3 + g4 * w4) / (w0 + w1 + w2 + w3 + w4);
  } else {
    col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

var K6 = `${Js}
uniform sampler2D tLow, tHigh; uniform vec2 uTexel; uniform float uMix;
void main(){
  vec2 o = uTexel;
  vec3 t = texture2D(tLow, vUv).rgb * 4.0;
  t += (texture2D(tLow, vUv + vec2(o.x, 0.0)).rgb + texture2D(tLow, vUv - vec2(o.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(0.0, o.y)).rgb + texture2D(tLow, vUv - vec2(0.0, o.y)).rgb) * 2.0;
  t += texture2D(tLow, vUv + o).rgb + texture2D(tLow, vUv - o).rgb + texture2D(tLow, vUv + vec2(o.x, -o.y)).rgb + texture2D(tLow, vUv + vec2(-o.x, o.y)).rgb;
  t *= 1.0 / 16.0;
  gl_FragColor = vec4(mix(texture2D(tHigh, vUv).rgb, t, uMix), 1.0);
}`;

var Q6 = `${Js}
uniform sampler2D tSrc; uniform vec2 uDir; uniform float uThreshold;
${Og}
void main(){
  float thr = uThreshold / max(slExposure(), 0.2);
  vec3 acc = vec3(0.0); float ws = 0.0;
  for (int i = -7; i <= 7; i++) {
    float x = float(i); float w = exp(-x * x / 18.0);
    vec3 c = texture2D(tSrc, vUv + uDir * x).rgb;
    c = max(c - vec3(thr), vec3(0.0));
    acc += c * w; ws += w;
  }
  gl_FragColor = vec4(acc / ws, 1.0);
}`;

var eA = `${Js}
uniform sampler2D tPrev, tLum, tDepth; uniform vec2 uSunUv; uniform float uSunOn, uRate, uVisRate, uAspect;
void main(){
  float ls = 0.0, ws = 0.0;
  for (int y = 0; y < 5; y++) for (int x = 0; x < 7; x++) {
    vec2 uv = (vec2(float(x), float(y)) + 0.5) / vec2(7.0, 5.0);
    vec2 c = uv - 0.5;
    float w = 1.0 - 0.75 * smoothstep(0.1, 0.55, length(c));       // centre-weighted metering
    float l = luma(texture2D(tLum, uv).rgb);
    ls += log(max(l, 1e-4)) * w; ws += w;
  }
  float avg = clamp(exp(ls / ws), 0.002, 40.0);
  float vis = 0.0;
  for (int i = 0; i < 12; i++) {
    float r = sqrt((float(i) + 0.5) / 12.0) * 0.011; float th = float(i) * 2.39996323;
    vec2 uv = uSunUv + vec2(cos(th) / uAspect, sin(th)) * r;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) vis += 1.0;
    else vis += step(0.99999, texture2D(tDepth, uv).r);
  }
  vis = vis / 12.0 * uSunOn;
  vec4 prev = texture2D(tPrev, vec2(0.5));
  float a = mix(prev.r, avg, uRate);
  if (!(a > 0.0) || a > 1e4) a = avg;                                 // NaN / first-frame guard
  float v = mix(prev.g, vis, uVisRate);
  if (!(v >= 0.0)) v = vis;
  gl_FragColor = vec4(a, v, 0.0, 1.0);
}`;

var tA = `${Js}
${SKY_NOISE_GLSL}
uniform float uAspect;
void main(){
  vec2 p = vUv * vec2(uAspect, 1.0);
  float acc = 0.0;
  for (int i = 0; i < 70; i++) {
    float fi = float(i);
    vec2 c = vec2(hash12(vec2(fi, 1.7)), hash12(vec2(fi, 9.2))) * vec2(uAspect, 1.0);
    float sz = mix(0.012, 0.085, pow(hash12(vec2(fi, 4.4)), 3.0));
    float r = length(p - c) / sz;
    float disc = smoothstep(1.0, 0.86, r) * (0.35 + 0.65 * smoothstep(0.35, 0.98, r));
    acc += disc * mix(0.15, 0.7, hash12(vec2(fi, 6.1)));
  }
  float smudge = fbm5(vUv * vec2(5.0, 9.0) + 3.0) * fbm3(vUv * 2.3 + 9.0);
  float streaks = pow(n2(vec2(vUv.x * 90.0, vUv.y * 2.0)), 4.0) * 0.25;
  float v = acc * 0.55 + smudge * 0.9 + streaks;
  v *= 0.45 + 0.9 * smoothstep(0.15, 0.75, length(vUv - 0.5));
  gl_FragColor = vec4(vec3(v) * vec3(1.0, 0.96, 0.9), 1.0);
}`;

var nA = `${Js}
uniform sampler2D tScene, tBloom, tBlur, tStreak, tDirt;
${Og}
uniform vec3 uSunCol;
uniform vec2 uSunUv;
uniform float uTime, uAspect, uBloom, uDirt, uStreak, uFlare, uCA, uVignette;
uniform float uDamage, uLowHealth, uAds, uFlash, uFade, uSaturation, uSunOn, uThunder, uAgxMix;

// ---- AgX (Filament/Blender fit, as in three.js) ----
const mat3 SL_REC2020_TO_SRGB = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
const mat3 SL_SRGB_TO_REC2020 = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
vec3 slAgxContrast(vec3 x){ vec3 x2 = x * x; vec3 x4 = x2 * x2; return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
vec3 slAgx(vec3 color){
  const mat3 inset = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
  const mat3 outset = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
  const float minEv = -12.47393, maxEv = 4.026069;
  color = inset * (SL_SRGB_TO_REC2020 * color);
  color = clamp((log2(max(color, 1e-10)) - minEv) / (maxEv - minEv), 0.0, 1.0);
  color = slAgxContrast(color);
  // "punchy"-style look: a little more contrast and chroma than the base AgX rendering
  float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = pow(max(color, vec3(0.0)), vec3(LOOK_POWER));
  color = l + (color - l) * LOOK_SAT;
  color = outset * color;
  color = pow(max(color, vec3(0.0)), vec3(2.2));
  return clamp(SL_REC2020_TO_SRGB * color, 0.0, 1.0);
}
vec3 slRRTODT(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 slAces(vec3 c){
  const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  return clamp(outM * slRRTODT(inM * (c * 1.3)), 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }

vec3 flare(vec2 uv, vec2 sun, float vis){
  vec2 asp = vec2(uAspect, 1.0);
  vec2 p = (uv - 0.5) * asp, s = (sun - 0.5) * asp;
  vec2 dv = p - s; float r = length(dv);
  vec3 c = vec3(0.0);
  // veiling glare + a few soft diffraction spikes
  float ang = atan(dv.y, dv.x);
  float spikes = pow(abs(cos(ang * 3.0 + 0.4)), 24.0) + 0.6 * pow(abs(cos(ang * 4.0 - 1.1)), 40.0);
  c += uSunCol * (0.020 / (r * r * 9.0 + 0.010) + 0.10 * exp(-r * 3.2));
  c += uSunCol * spikes * 0.30 * exp(-r * 5.5);
  // ghosts along the sun -> centre axis
  vec3 g = vec3(0.0);
  float k0 = length(p + s * 0.38);  g += vec3(0.30, 0.75, 0.55) * smoothstep(0.085, 0.06, k0) * 0.050;
  float k1 = length(p + s * 0.82);  g += vec3(0.85, 0.45, 0.25) * smoothstep(0.045, 0.030, k1) * 0.075;
  float k2 = length(p + s * 1.35);  g += vec3(0.35, 0.50, 0.95) * smoothstep(0.17, 0.12, k2) * (0.4 + 0.6 * smoothstep(0.05, 0.16, k2)) * 0.040;
  float k3 = length(p - s * 0.45);  g += vec3(0.80, 0.70, 0.35) * smoothstep(0.030, 0.018, k3) * 0.060;
  // halo ring opposite the sun
  float hr = length(p + s * 0.15);
  g += vec3(0.45, 0.55, 0.85) * exp(-pow((hr - 0.52) * 16.0, 2.0)) * 0.035 * smoothstep(0.1, 0.5, length(s));
  c += g * uSunCol * 2.4;
  return c * vis;
}

void main(){
  vec2 c = vUv - 0.5;
  float r2 = dot(c * vec2(uAspect, 1.0), c * vec2(uAspect, 1.0)) / (0.25 * (uAspect * uAspect + 1.0));   // 0 centre .. 1 corner
  vec4 ad = texture2D(tAdapt, vec2(0.5));
  // radial chromatic aberration (tiny; grows a little when hurt)
  vec2 off = c * r2 * (uCA + uDamage * 0.006);
  vec3 col = vec3(texture2D(tScene, vUv + off).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv - off).b);
  // ADS: soften the periphery
  vec3 soft = texture2D(tBlur, vUv).rgb;
  col = mix(col, soft, uAds * 0.75 * smoothstep(0.22, 0.85, r2));
  // bloom (energy conserving mix), lens dirt, anamorphic streak
  vec3 bloom = texture2D(tBloom, vUv).rgb;
  vec3 dirt = texture2D(tDirt, vUv).rgb;
  col = mix(col, bloom, uBloom);
  col += bloom * dirt * uDirt;
  col += texture2D(tStreak, vUv).rgb * vec3(0.45, 0.62, 1.0) * uStreak;
  // sun glare + flare (occlusion-tested)
  float vis = ad.g * uSunOn;
  if (vis > 0.002) { vec3 fl = flare(vUv, uSunUv, vis) * uFlare; col += fl * (1.0 + dirt * 1.5); }
  // exposure: manual * eye adaptation
  col *= slExposure();
  col += vec3(1.0, 0.97, 0.9) * uFlash * 2.5;
  // filmic curve: ACES (Hill fit) for punch and burning oranges, pulled toward AgX so highlights roll off to white
  col = mix(slAces(col), slAgx(col), uAgxMix);

  // ---- grade (display-linear) ----
  float l = luma(col);
  // split tone: teal shadows, warm highlights
  vec3 sh = vec3(0.80, 1.01, 1.13), hi = vec3(1.07, 1.0, 0.90);
  col *= mix(sh, hi, smoothstep(0.03, 0.55, l));
  // gentle S-curve
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.22);
  // lifted, slightly teal blacks
  col = col * 0.988 + vec3(0.006, 0.0085, 0.011);
  // saturation (gameplay driven)
  float sat = uSaturation * (1.0 - 0.65 * uLowHealth) * (1.0 - 0.5 * uDamage);
  l = luma(col);
  col = mix(vec3(l), col, sat);
  // vignette: base + low health + ADS tightening
  float vig = uVignette + uLowHealth * 0.55 + uAds * 0.22;
  float vr = smoothstep(0.15 - uAds * 0.08, 1.05, r2);
  col *= 1.0 - vig * vr * vr * (3.0 - 2.0 * vr) ;
  // damage: red-edged pulse
  float edge = smoothstep(0.18, 1.0, r2);
  col = mix(col, vec3(0.55, 0.02, 0.01) * (0.35 + l), clamp(uDamage * edge * 0.85 + uLowHealth * edge * edge * 0.25 * (0.75 + 0.25 * sin(uTime * 5.0)), 0.0, 1.0));
  col *= 1.0 - uFade;
  col = toSRGB(clamp(col, 0.0, 1.0));
  gl_FragColor = vec4(col, dot(col, vec3(0.299, 0.587, 0.114)));
}`;

var iA = `${Js}
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uTime, uGrain, uSharpen, uFxaa;
void main(){
  vec4 M = texture2D(tSrc, vUv);
  vec3 col = M.rgb;
  vec4 NW = texture2D(tSrc, vUv + vec2(-1.0, -1.0) * uTexel), NE = texture2D(tSrc, vUv + vec2(1.0, -1.0) * uTexel);
  vec4 SW = texture2D(tSrc, vUv + vec2(-1.0, 1.0) * uTexel), SE = texture2D(tSrc, vUv + vec2(1.0, 1.0) * uTexel);
  float lMin = min(M.a, min(min(NW.a, NE.a), min(SW.a, SE.a)));
  float lMax = max(M.a, max(max(NW.a, NE.a), max(SW.a, SE.a)));
  float contrast = lMax - lMin;
  if (uFxaa > 0.5 && contrast > max(0.0312, lMax * 0.10)) {
    vec2 dir = vec2(-((NW.a + NE.a) - (SW.a + SE.a)), (NW.a + SW.a) - (NE.a + SE.a));
    float dirReduce = max((NW.a + NE.a + SW.a + SE.a) * 0.03125, 0.0078125);
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * uTexel;
    vec4 A = 0.5 * (texture2D(tSrc, vUv + dir * (1.0 / 3.0 - 0.5)) + texture2D(tSrc, vUv + dir * (2.0 / 3.0 - 0.5)));
    vec4 B = A * 0.5 + 0.25 * (texture2D(tSrc, vUv - dir * 0.5) + texture2D(tSrc, vUv + dir * 0.5));
    col = (B.a < lMin || B.a > lMax) ? A.rgb : B.rgb;
  }
  // light unsharp mask, backed off on strong edges (those belong to FXAA)
  vec3 blur = (NW.rgb + NE.rgb + SW.rgb + SE.rgb) * 0.25;
  col += (M.rgb - blur) * uSharpen * (1.0 - smoothstep(0.04, 0.22, contrast));
  // animated, luminance-weighted film grain
  vec2 seed = gl_FragCoord.xy + fract(uTime * vec2(7.31, 3.17)) * vec2(311.7, 173.3);
  float g = hash12(seed) + hash12(seed + 57.3) - 1.0;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col += g * uGrain * mix(1.0, 0.30, smoothstep(0.25, 0.9, l)) * (0.35 + 0.65 * smoothstep(0.0, 0.08, l));
  // dither against banding in the sky gradients
  col += (hash12(gl_FragCoord.xy * 1.37 + 11.0) + hash12(gl_FragCoord.xy * 0.71 + 3.0) - 1.0) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

function createPostprocessing(i, e, { noiseTex: t }) {
  let n = new BufferGeometry();
  (n.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  ),
    n.setAttribute(
      "uv",
      new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2),
    ));
  let s = new Mesh(n, null);
  s.frustumCulled = !1;
  let o = new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    r = [],
    a = (oe, fe, le, R = {}) => {
      let I = new ShaderMaterial({
        name: "post-" + oe,
        vertexShader: G6,
        fragmentShader: `${POSTPROCESS_SHADER_MARKER} ${oe}
${fe}`,
        uniforms: le,
        depthTest: !1,
        depthWrite: !1,
        blending: NoBlending,
        toneMapped: !1,
        ...R,
      });
      return (r.push(I), I);
    };
  function l(oe, fe) {
    ((s.material = oe), i.setRenderTarget(fe), i.render(s, o));
  }
  let c = HalfFloatType,
    u = UnsignedByteType,
    h = LinearFilter,
    f = NearestFilter,
    p = (oe = c, fe = h, le = {}) => {
      let R = new WebGLRenderTarget(4, 4, {
        type: oe,
        format: RGBAFormat,
        minFilter: fe,
        magFilter: fe,
        depthBuffer: !1,
        stencilBuffer: !1,
        generateMipmaps: !1,
        ...le,
      });
      return ((R.texture.generateMipmaps = !1), R);
    },
    d = () => e.quality,
    v = () => ({
      uSunDir: {
        value: SUN_LIGHT.dir.clone(),
      },
      uZen: {
        value: SKY_COLORS.zenith.clone(),
      },
      uHor: {
        value: SKY_COLORS.horizon.clone(),
      },
      uHorAway: {
        value: SKY_COLORS.horizonAway.clone(),
      },
      uSunCol: {
        value: SUN_LIGHT.color.clone(),
      },
      // 体积雾远端地平线色使用同一套 SKY_COLOR_GLSL；默认保持太阳光晕可见。
      uSunDisk: {
        value: 1,
      },
    }),
    g = {
      volSunScale: 0.85,
      volAmbient: 0.2,
      volSigma: 0.0034,
      volMaxDist: 170,
      volFarHaze: 0.42,
      volInteriorDust: 6,
      aoRadius: 0.9,
      aoIntensity: 1.6,
      aoStrength: 0.95,
      bloom: 0.065,
      bloomMix: 0.62,
      dirt: 0.1,
      streak: 0.03,
      streakThreshold: 2.2,
      flare: 0.16,
      key: 0.12,
      minExposure: 0.6,
      maxExposure: 2,
      adaptTau: 1.5,
      agxMix: 0.25,
      ca: 0.0013,
      vignette: 0.3,
      grain: 0.02,
      sharpen: 0.3,
      lookPower: 1.18,
      lookSat: 1.22,
    },
    x = !1;
  try {
    x = !!i.extensions.has("EXT_color_buffer_float");
  } catch {
    x = !1;
  }
  let y = {
      scene: p(c, h),
      motion: p(c, h),
      ldr: p(u, h),
      depthHalf: x
        ? p(FloatType, f, {
            format: RedFormat,
          })
        : p(c, f),
      aoA: p(u, f),
      aoB: p(u, f),
      volA: p(c, f),
      volB: p(c, f),
      down: [],
      up: [],
      streakA: p(c, h),
      streakB: p(c, h),
      adapt: [p(c, f), p(c, f)],
      dirt: p(u, h),
      depthCopy: null,
    },
    b = 6;
  for (let oe = 0; oe < b; oe++) y.down.push(p(c, h));
  for (let oe = 0; oe < b - 1; oe++) y.up.push(p(c, h));
  (y.adapt[0].setSize(1, 1),
    y.adapt[1].setSize(1, 1),
    y.dirt.setSize(512, 288));
  let m = 0,
    A = 0,
    _ = !1,
    M = {
      w: 4,
      h: 4,
      hw: 2,
      hh: 2,
    },
    E = {
      tAdapt: {
        value: null,
      },
      uExposure: {
        value: 1,
      },
      uKey: {
        value: g.key,
      },
      uMinE: {
        value: g.minExposure,
      },
      uMaxE: {
        value: g.maxExposure,
      },
      uAuto: {
        value: 1,
      },
    },
    w = a(
      "depthcopy",
      q6,
      {
        tDepth: {
          value: null,
        },
      },
      {
        depthTest: !0,
        depthWrite: !0,
        depthFunc: AlwaysDepth,
        colorWrite: !1,
      },
    ),
    S = a("depthhalf", X6, {
      tDepth: {
        value: null,
      },
      uNear: {
        value: 0.08,
      },
      uFar: {
        value: 900,
      },
    }),
    z = a(
      "ao",
      Y6,
      {
        tDepthHalf: {
          value: y.depthHalf.texture,
        },
        uTanHalf: {
          value: new Vector2(),
        },
        uTexel: {
          value: new Vector2(),
        },
        uRadius: {
          value: g.aoRadius,
        },
        uIntensity: {
          value: g.aoIntensity,
        },
        uAspect: {
          value: 1,
        },
      },
      {
        defines: {
          AO_TAPS: 12,
        },
      },
    ),
    H = a(
      "vol",
      $6,
      {
        tDepthHalf: {
          value: y.depthHalf.texture,
        },
        tShadow: {
          value: null,
        },
        uShadowMatrix: {
          value: new Matrix4(),
        },
        uCamWorld: {
          value: new Matrix4(),
        },
        uCamPos: {
          value: new Vector3(),
        },
        uSunRad: {
          value: new Vector3(),
        },
        uAmb: {
          value: new Vector3(),
        },
        uTanHalf: {
          value: new Vector2(),
        },
        uHasShadow: {
          value: 0,
        },
        uMaxDist: {
          value: g.volMaxDist,
        },
        uSigma: {
          value: g.volSigma,
        },
        uFarZ: {
          value: 900,
        },
        uFarHaze: {
          value: g.volFarHaze,
        },
        uFlicker: {
          value: 0,
        },
        uBoxDust: {
          value: 0,
        },
        uBoxMin: {
          value: new Vector3(1e6, 1e6, 1e6),
        },
        uBoxMax: {
          value: new Vector3(-1e6, -1e6, -1e6),
        },
        ...v(),
      },
      {
        defines: {
          VOL_STEPS: 16,
        },
      },
    ),
    O = a(
      "blur-ao",
      $y,
      {
        tSrc: {
          value: null,
        },
        tDepthHalf: {
          value: y.depthHalf.texture,
        },
        uDir: {
          value: new Vector2(),
        },
      },
      {
        defines: {
          BLUR_TOL: "0.04",
        },
      },
    ),
    q = a(
      "blur-vol",
      $y,
      {
        tSrc: {
          value: null,
        },
        tDepthHalf: {
          value: y.depthHalf.texture,
        },
        uDir: {
          value: new Vector2(),
        },
      },
      {
        defines: {
          BLUR_TOL: "0.30",
        },
      },
    ),
    U = a("composite", Z6, {
      tColor: {
        value: null,
      },
      tDepth: {
        value: null,
      },
      tDepthHalf: {
        value: y.depthHalf.texture,
      },
      tAO: {
        value: y.aoA.texture,
      },
      tVol: {
        value: y.volA.texture,
      },
      uHalfRes: {
        value: new Vector2(),
      },
      uNear: {
        value: 0.08,
      },
      uFar: {
        value: 900,
      },
      uAoOn: {
        value: 1,
      },
      uVolOn: {
        value: 1,
      },
      uAoStrength: {
        value: g.aoStrength,
      },
      ...E,
    }),
    T = a("motion", j6, {
      tColor: {
        value: y.scene.texture,
      },
      tDepth: {
        value: null,
      },
      uInvViewProj: {
        value: new Matrix4(),
      },
      uPrevViewProj: {
        value: new Matrix4(),
      },
      uShutter: {
        value: 0.5,
      },
      uRes: {
        value: new Vector2(),
      },
    }),
    D = a("down", J6, {
      tSrc: {
        value: null,
      },
      uTexel: {
        value: new Vector2(),
      },
      uFirst: {
        value: 0,
      },
    }),
    C = a("up", K6, {
      tLow: {
        value: null,
      },
      tHigh: {
        value: null,
      },
      uTexel: {
        value: new Vector2(),
      },
      uMix: {
        value: g.bloomMix,
      },
    }),
    G = a("streak", Q6, {
      tSrc: {
        value: null,
      },
      uDir: {
        value: new Vector2(),
      },
      uThreshold: {
        value: 0,
      },
      ...E,
    }),
    j = a("adapt", eA, {
      tPrev: {
        value: null,
      },
      tLum: {
        value: null,
      },
      tDepth: {
        value: null,
      },
      uSunUv: {
        value: new Vector2(0.5, 0.5),
      },
      uSunOn: {
        value: 0,
      },
      uRate: {
        value: 1,
      },
      uVisRate: {
        value: 1,
      },
      uAspect: {
        value: 1,
      },
    }),
    N = a("dirt", tA, {
      tNoise: {
        value: t,
      },
      uAspect: {
        value: 16 / 9,
      },
    }),
    Q = a(
      "grade",
      nA,
      {
        tScene: {
          value: null,
        },
        tBloom: {
          value: y.up[0].texture,
        },
        tBlur: {
          value: y.down[1].texture,
        },
        tStreak: {
          value: y.streakB.texture,
        },
        tDirt: {
          value: y.dirt.texture,
        },
        ...E,
        uSunCol: {
          value: SUN_LIGHT.color.clone(),
        },
        uSunUv: {
          value: new Vector2(0.5, 0.5),
        },
        uTime: {
          value: 0,
        },
        uAspect: {
          value: 1,
        },
        uBloom: {
          value: g.bloom,
        },
        uDirt: {
          value: g.dirt,
        },
        uStreak: {
          value: g.streak,
        },
        uFlare: {
          value: g.flare,
        },
        uCA: {
          value: g.ca,
        },
        uVignette: {
          value: g.vignette,
        },
        uDamage: {
          value: 0,
        },
        uLowHealth: {
          value: 0,
        },
        uAds: {
          value: 0,
        },
        uFlash: {
          value: 0,
        },
        uFade: {
          value: 0,
        },
        uSaturation: {
          value: 1,
        },
        uSunOn: {
          value: 0,
        },
        uThunder: {
          value: 0,
        },
        uAgxMix: {
          value: g.agxMix,
        },
      },
      {
        defines: {
          LOOK_POWER: g.lookPower.toFixed(3),
          LOOK_SAT: g.lookSat.toFixed(3),
        },
      },
    ),
    K = a("final", iA, {
      tSrc: {
        value: y.ldr.texture,
      },
      uTexel: {
        value: new Vector2(),
      },
      uTime: {
        value: 0,
      },
      uGrain: {
        value: g.grain,
      },
      uSharpen: {
        value: g.sharpen,
      },
      uFxaa: {
        value: 1,
      },
    }),
    ie = new Matrix4(),
    F = new Matrix4(),
    X = new Matrix4(),
    ne = new Vector3(),
    re = new Vector3(),
    $ = !1;
  function ue() {
    let oe = Math.max(6, d().volSteps | 0),
      fe =
        d().name === "test" || d().name === "low"
          ? 8
          : d().name === "ultra"
            ? 16
            : 12;
    (H.defines.VOL_STEPS !== oe &&
      ((H.defines.VOL_STEPS = oe), (H.needsUpdate = !0)),
      z.defines.AO_TAPS !== fe &&
        ((z.defines.AO_TAPS = fe), (z.needsUpdate = !0)));
  }
  function me(oe, fe) {
    if (
      ((oe = Math.max(8, oe | 0)),
      (fe = Math.max(8, fe | 0)),
      (M.w = oe),
      (M.h = fe),
      (M.hw = Math.max(4, Math.ceil(oe / 2))),
      (M.hh = Math.max(4, Math.ceil(fe / 2))),
      y.scene.setSize(oe, fe),
      y.motion.setSize(oe, fe),
      y.ldr.setSize(oe, fe),
      y.depthCopy)
    ) {
      y.depthCopy.setSize(oe, fe);
      let I = y.depthCopy.depthTexture.image;
      (I.width !== oe || I.height !== fe) &&
        ((I.width = oe),
        (I.height = fe),
        (y.depthCopy.depthTexture.needsUpdate = !0));
    }
    for (let I of [y.depthHalf, y.aoA, y.aoB, y.volA, y.volB])
      I.setSize(M.hw, M.hh);
    let le = M.hw,
      R = M.hh;
    for (let I = 0; I < b; I++)
      (y.down[I].setSize(le, R),
        I < b - 1 && y.up[I].setSize(le, R),
        (le = Math.max(2, le >> 1)),
        (R = Math.max(2, R >> 1)));
    (y.streakA.setSize(y.down[2].width, y.down[2].height),
      y.streakB.setSize(y.down[2].width, y.down[2].height),
      ($ = !1),
      ue());
  }
  function ee() {
    if (!y.depthCopy) {
      let oe = new DepthTexture(M.w, M.h);
      ((oe.type = UnsignedIntType),
        (oe.minFilter = oe.magFilter = f),
        (y.depthCopy = new WebGLRenderTarget(M.w, M.h, {
          type: u,
          format: RGBAFormat,
          minFilter: f,
          magFilter: f,
          depthBuffer: !0,
          stencilBuffer: !1,
          depthTexture: oe,
          generateMipmaps: !1,
        })),
        i.setRenderTarget(y.depthCopy),
        i.setClearColor(0, 1),
        i.clear(!0, !0, !1),
        i.setRenderTarget(null));
    }
    return y.depthCopy.depthTexture;
  }
  function B(oe) {
    y.depthCopy && ((w.uniforms.tDepth.value = oe), l(w, y.depthCopy));
  }
  function P({
    hdr: oe,
    camera: fe,
    sun: le,
    dt: R,
    post: I,
    exposure: se,
    time: ae,
    fast: k,
    thunder: ce,
  }) {
    let ve = d(),
      _e = fe.projectionMatrix.elements,
      Te = 1 / _e[0],
      Pe = 1 / _e[5],
      Re = Te / Pe,
      Fe = oe.depthTexture;
    ((E.tAdapt.value = y.adapt[m].texture),
      (E.uExposure.value = se),
      (E.uAuto.value = J.autoExposure ? 1 : 0),
      (E.uKey.value = g.key),
      (E.uMinE.value = g.minExposure),
      (E.uMaxE.value = g.maxExposure),
      _ || ((N.uniforms.uAspect.value = 16 / 9), l(N, y.dirt), (_ = !0)),
      (S.uniforms.tDepth.value = Fe),
      (S.uniforms.uNear.value = fe.near),
      (S.uniforms.uFar.value = fe.far),
      l(S, y.depthHalf));
    let ze = 1 / M.hw,
      We = 1 / M.hh,
      Ne = !!ve.ao;
    Ne &&
      (z.uniforms.uTanHalf.value.set(Te, Pe),
      z.uniforms.uTexel.value.set(ze, We),
      (z.uniforms.uAspect.value = Re),
      l(z, y.aoA),
      (O.uniforms.tSrc.value = y.aoA.texture),
      O.uniforms.uDir.value.set(ze, 0),
      l(O, y.aoB),
      (O.uniforms.tSrc.value = y.aoB.texture),
      O.uniforms.uDir.value.set(0, We),
      l(O, y.aoA));
    let dt = (ve.volSteps | 0) > 0;
    if (dt) {
      let be = H.uniforms,
        Oe = e.level && e.level.interiorBoxes && e.level.interiorBoxes[0];
      // 体积光的太阳方向/颜色/可见度与实际平行光保持一致。
      be.uSunDir.value.set(sunDX, sunDY, sunDZ);
      be.uSunCol.value.copy(le.color);
      be.uSunDisk.value = sunDisk;
      Oe
        ? (be.uBoxMin.value.copy(Oe.min),
          be.uBoxMax.value.copy(Oe.max),
          (be.uBoxDust.value = g.volInteriorDust))
        : (be.uBoxDust.value = 0);
      let pt = le.shadow && le.shadow.map ? le.shadow.map.texture : null;
      ((be.tShadow.value = pt),
        (be.uHasShadow.value = pt ? 1 : 0),
        pt && be.uShadowMatrix.value.copy(le.shadow.matrix),
        be.uCamWorld.value.copy(fe.matrixWorld),
        be.uCamPos.value.setFromMatrixPosition(fe.matrixWorld),
        be.uTanHalf.value.set(Te, Pe),
        (be.uFarZ.value = fe.far));
      let ut = le.intensity * g.volSunScale;
      be.uSunRad.value.set(le.color.r * ut, le.color.g * ut, le.color.b * ut);
      let nn = g.volAmbient * (1 + ce * 1.5);
      (be.uAmb.value.set(
        SKY_COLORS.fog.r * nn,
        SKY_COLORS.fog.g * nn,
        SKY_COLORS.fog.b * nn,
      ),
        l(H, y.volA),
        (q.uniforms.tSrc.value = y.volA.texture),
        q.uniforms.uDir.value.set(ze, 0),
        l(q, y.volB),
        (q.uniforms.tSrc.value = y.volB.texture),
        q.uniforms.uDir.value.set(0, We),
        l(q, y.volA));
    }
    {
      let be = U.uniforms;
      ((be.tColor.value = oe.texture),
        (be.tDepth.value = Fe),
        be.uHalfRes.value.set(M.hw, M.hh),
        (be.uNear.value = fe.near),
        (be.uFar.value = fe.far),
        (be.uAoOn.value = Ne ? 1 : 0),
        (be.uVolOn.value = dt ? 1 : 0),
        l(U, y.scene));
    }
    let xe = y.scene.texture;
    if (
      (ie.multiplyMatrices(fe.projectionMatrix, fe.matrixWorldInverse),
      ve.motionBlur && $ && R > 0)
    ) {
      let be = T.uniforms;
      ((be.tDepth.value = Fe),
        be.uInvViewProj.value.copy(X.copy(ie).invert()),
        be.uPrevViewProj.value.copy(F),
        (be.uShutter.value = Math.min(0.5, 1 / 190 / Math.max(R, 0.001))),
        be.uRes.value.set(M.w, M.h),
        l(T, y.motion),
        (xe = y.motion.texture));
    }
    if ((F.copy(ie), ($ = !0), ve.bloom)) {
      let be = xe,
        Oe = M.w,
        pt = M.h;
      for (let bt = 0; bt < b; bt++)
        ((D.uniforms.tSrc.value = be),
          D.uniforms.uTexel.value.set(1 / Oe, 1 / pt),
          (D.uniforms.uFirst.value = bt === 0 ? 1 : 0),
          l(D, y.down[bt]),
          (be = y.down[bt].texture),
          (Oe = y.down[bt].width),
          (pt = y.down[bt].height));
      let ut = y.down[b - 1];
      for (let bt = b - 2; bt >= 0; bt--)
        ((C.uniforms.tLow.value = ut.texture),
          (C.uniforms.tHigh.value = y.down[bt].texture),
          C.uniforms.uTexel.value.set(1 / ut.width, 1 / ut.height),
          l(C, y.up[bt]),
          (ut = y.up[bt]));
      let nn = 1 / y.streakA.width;
      ((G.uniforms.tSrc.value = y.down[2].texture),
        G.uniforms.uDir.value.set(nn * 1.5, 0),
        (G.uniforms.uThreshold.value = g.streakThreshold),
        l(G, y.streakA),
        (G.uniforms.tSrc.value = y.streakA.texture),
        G.uniforms.uDir.value.set(nn * 5, 0),
        (G.uniforms.uThreshold.value = 0),
        l(G, y.streakB));
    }
    // 平行光位置由时间预设驱动；眩光方向必须跟着实际光照方向走，
    // 否则天空太阳盘与后处理眩光会分裂，午夜还会残留太阳眩光。
    (ne.copy(le.position).sub(le.target.position),
      ne.lengthSq() < 1e-8 && ne.copy(SUN_LIGHT.dir),
      ne.normalize());
    let sunDX = ne.x,
      sunDY = ne.y,
      sunDZ = ne.z;
    ne
      .multiplyScalar(500)
      .add(re.setFromMatrixPosition(fe.matrixWorld))
      .project(fe);
    fe.getWorldDirection(re);
    let sunDisk =
        le.userData && typeof le.userData.sunDisk === "number"
          ? le.userData.sunDisk
          : 1,
      Ie = re.x * sunDX + re.y * sunDY + re.z * sunDZ > 0.05,
      Be = Math.max(Math.abs(ne.x), Math.abs(ne.y)),
      Xe = Ie
        ? (1 - Math.min(1, Math.max(0, (Be - 1) / 0.3))) * sunDisk
        : 0,
      Me = ne.x * 0.5 + 0.5,
      we = ne.y * 0.5 + 0.5;
    {
      let be = j.uniforms,
        Oe = y.adapt[m],
        pt = y.adapt[1 - m];
      ((be.tPrev.value = Oe.texture),
        (be.tLum.value = ve.bloom ? y.down[b - 1].texture : xe),
        (be.tDepth.value = Fe),
        be.uSunUv.value.set(Me, we),
        (be.uSunOn.value = Xe),
        (be.uAspect.value = Re));
      let ut = A < 2 || k;
      ((be.uRate.value = ut
        ? A < 2
          ? 1
          : 0.6
        : 1 - Math.exp(-R / g.adaptTau)),
        (be.uVisRate.value = ut ? 1 : 1 - Math.exp(-R / 0.12)),
        l(j, pt),
        (m = 1 - m),
        A++);
    }
    {
      let be = Q.uniforms;
      ((be.tScene.value = xe),
        (E.tAdapt.value = y.adapt[m].texture),
        be.uSunUv.value.set(Me, we),
        (be.uSunOn.value = Xe),
        be.uSunCol.value.copy(le.color),
        (be.uAspect.value = Re),
        (be.uTime.value = ae),
        (be.uBloom.value = ve.bloom ? g.bloom : 0),
        (be.uDirt.value = ve.bloom ? g.dirt : 0),
        (be.uStreak.value = ve.bloom ? g.streak : 0),
        (be.uFlare.value = g.flare),
        (be.uAgxMix.value = g.agxMix),
        (be.uCA.value = g.ca),
        (be.uVignette.value = g.vignette),
        (be.uDamage.value = V(I.damage)),
        (be.uLowHealth.value = V(I.lowHealth)),
        (be.uAds.value = V(I.ads)),
        (be.uFlash.value = V(I.flash)),
        (be.uFade.value = V(I.fade)),
        (be.uSaturation.value = Number.isFinite(I.saturation)
          ? I.saturation
          : 1),
        l(Q, y.ldr));
    }
    {
      let be = K.uniforms;
      (be.uTexel.value.set(1 / M.w, 1 / M.h),
        (be.uTime.value = ae),
        (be.uGrain.value = g.grain),
        (be.uSharpen.value = g.sharpen),
        l(K, null));
    }
  }
  let V = (oe) => (oe > 0 ? (oe < 1 ? oe : 1) : 0);
  function Y() {
    for (let fe of r) fe.dispose();
    let oe = [
      y.scene,
      y.motion,
      y.ldr,
      y.depthHalf,
      y.aoA,
      y.aoB,
      y.volA,
      y.volB,
      y.streakA,
      y.streakB,
      y.dirt,
      ...y.down,
      ...y.up,
      ...y.adapt,
    ];
    y.depthCopy && oe.push(y.depthCopy);
    for (let fe of oe) fe.dispose();
  }
  let L = new Uint16Array(4);
  function Z() {
    try {
      i.readRenderTargetPixels(y.adapt[m], 0, 0, 1, 1, L);
      let oe = DataUtils.fromHalfFloat(L[0]),
        fe = Math.min(
          g.maxExposure,
          Math.max(g.minExposure, Math.pow(g.key / Math.max(oe, 1e-4), 0.85)),
        );
      return {
        lum: +oe.toFixed(4),
        auto: +fe.toFixed(3),
        sunVis: +DataUtils.fromHalfFloat(L[1]).toFixed(2),
      };
    } catch {
      return null;
    }
  }
  let J = {
    readAdapt: Z,
    run: P,
    resize: me,
    copyDepth: B,
    ensureDepthCopy: ee,
    applyQuality: ue,
    dispose: Y,
    materials: r,
    rt: y,
    size: M,
    TUNE: g,
    autoExposure: !0,
    pass: l,
    quad: s,
    fsCam: o,
  };
  return J;
}

export { POSTPROCESS_SHADER_MARKER, createPostprocessing };
