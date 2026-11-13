import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
  Vector4,
} from "../../vendor/three-r180.js";
import { SKY_COLORS, SUN_LIGHT, WORLD_BOUNDS } from "../../core/config.js";
import { Li } from "./geometry.js";

var B1 = [
  [-0.92, 0.39, 9.5, 0.06],
  [-0.75, -0.66, 5.7, 0.04],
  [-0.99, 0.12, 3.3, 0.026],
  [-0.5, 0.87, 2, 0.016],
];

var Db = [
  [-0.8, 0.6, 1.31, 0.02],
  [-0.95, -0.31, 0.83, 0.014],
  [-0.35, -0.94, 0.57, 0.01],
  [-0.6, 0.8, 0.39, 0.007],
  [-1, 0.05, 0.27, 0.005],
  [0.3, 0.95, 0.47, 0.006],
  [-0.86, -0.51, 0.21, 0.0035],
];

for (let i of B1.concat(Db)) {
  let e = Math.hypot(i[0], i[1]);
  ((i[0] /= e),
    (i[1] /= e),
    (i[4] = (2 * Math.PI) / i[2]),
    (i[5] = Math.sqrt(9.81 * i[4])));
}

var fi = (i) => (Number.isInteger(i) ? i.toFixed(1) : i.toFixed(5));

function Lb(i, e, t) {
  let n = 1 - MathUtils.smoothstep(Math.hypot(i - 30, e), 50, 220),
    s = 0;
  for (let o of B1)
    s += o[3] * Math.sin(o[4] * (o[0] * i + o[1] * e) - o[5] * t);
  return WORLD_BOUNDS.seaY + s * n;
}

var CR = B1.map(
  (i) =>
    `  { float ph = ${fi(i[4])} * dot(vec2(${fi(i[0])}, ${fi(i[1])}), swp.xz) - ${fi(i[5])} * uTime; sdisp.y += ${fi(i[3])} * sin(ph); sdisp.xz += vec2(${fi(i[0])}, ${fi(i[1])}) * (${fi(i[3] * 0.6)} * cos(ph)); }`,
).join(`
`);

var PR = B1.map(
  (i) =>
    `  slopeA += vec2(${fi(i[0])}, ${fi(i[1])}) * (${fi(i[3] * i[4])} * cos(${fi(i[4])} * dot(vec2(${fi(i[0])}, ${fi(i[1])}), sxz) - ${fi(i[5])} * uTime));`,
).join(`
`);

var IR = Db.map(
  (i) =>
    `  slopeB += vec2(${fi(i[0])}, ${fi(i[1])}) * (${fi(i[3] * i[4])} * cos(${fi(i[4])} * dot(vec2(${fi(i[0])}, ${fi(i[1])}), sxz) - ${fi(i[5])} * uTime));`,
).join(`
`);

var zR = `
uniform float uTime; uniform sampler2D uDetail, uDetailN; uniform vec3 uHazeA, uHazeB, uSunDirW;
varying vec3 vGWorld; varying float vSAmp;
float gRough; vec2 gNxz; float gOcc; float gSDist; float gSpark;
`;

var DR = `
{
  vec2 sxz = vGWorld.xz;
  float sd = length(cameraPosition - vGWorld); gSDist = sd;
  vec2 slopeA = vec2(0.0), slopeB = vec2(0.0);
${PR}
${IR}
  float nearB = 1.0 - smoothstep(25.0, 110.0, sd);
  vec2 t1 = texture2D(uDetailN, sxz * 0.113 + uTime * vec2(-0.021, 0.009)).ba - 0.5;
  vec2 t2 = texture2D(uDetailN, sxz * 0.031 + uTime * vec2(-0.007, -0.004)).ba - 0.5;
  vec2 t3 = texture2D(uDetailN, sxz.yx * 0.39 + uTime * vec2(0.031, -0.027)).ba - 0.5;
  gNxz = slopeA * vSAmp + slopeB * nearB + t1 * 0.2 + t2 * 0.24 + t3 * 0.1 * nearB;
  // foam / scum along the quay wall (x = 30) and around the moored hull x[33,49] z[-60,-9]
  float dq = sxz.x - 30.0;
  vec2 hq = abs(sxz - vec2(41.0, -34.5)) - vec2(4.0, 21.5);
  float dh = length(max(hq, 0.0)) + min(max(hq.x, hq.y), 0.0) - 4.0;
  float de = min(dq, dh);
  vec4 fn = texture2D(uDetail, sxz * 0.41 + uTime * vec2(-0.012, 0.007));
  vec4 fn2 = texture2D(uDetail, sxz * 0.093 + uTime * vec2(0.004, 0.003));
  float band = 1.0 - smoothstep(0.0, 0.2 + fn2.g * fn2.g * 2.2, de);
  float foam = clamp(band * smoothstep(0.5, 0.68, fn.a * 0.55 + fn.r * 0.25 + fn2.g * 0.3 + band * 0.2), 0.0, 1.0) * step(-0.3, de);
  float scum = (1.0 - smoothstep(0.0, 5.0, de)) * smoothstep(0.4, 0.7, fn2.g);
  vec3 alb = vec3(0.0045, 0.013, 0.017);
  alb = mix(alb, vec3(0.03, 0.04, 0.034), scum * 0.6);
  alb = mix(alb, vec3(0.3, 0.32, 0.3), foam * 0.7);
  diffuseColor.rgb *= alb;
  // wind structure: broad cat's-paw patches (ruffled, darker, duller) between calmer slicks, plus long swell shading
  vec4 fn3 = texture2D(uDetail, sxz * 0.0123 + uTime * vec2(0.0016, 0.0011));
  float gust = smoothstep(0.38, 0.62, fn2.g * 0.45 + fn3.g * 0.75 - 0.1);
  float swell = sin(dot(sxz, vec2(-0.118, 0.05)) - uTime * 0.55 + fn3.a * 5.0) * 0.5 + 0.5;
  gNxz = gNxz * mix(0.4, 1.35, gust) + vec2(-0.92, 0.39) * (swell - 0.5) * 0.07;
  gSpark = mix(0.55, 1.0, swell) * mix(1.0, 0.6, gust);
  diffuseColor.rgb *= mix(1.0, 0.6, gust);
  gRough = mix(mix(0.1, 0.32, smoothstep(12.0, 380.0, sd)) * mix(0.62, 1.5, gust), 0.65, max(foam, scum * 0.3));
  gNxz *= 1.0 - foam * 0.6;
  gOcc = mix(0.3, 1.0, smoothstep(0.0, 8.0, de)) * mix(0.8, 1.05, swell);
}
`;

var LR = `
{
  vec3 sdir = normalize(vGWorld - cameraPosition);
  float toSun = pow(max(dot(normalize(sdir.xz + vec2(1e-5)), normalize(uSunDirW.xz)), 0.0), 3.0);
  vec3 hz = mix(uHazeA, uHazeB, toSun);
  outgoingLight = mix(outgoingLight, hz, smoothstep(220.0, 860.0, gSDist) * 0.8);
}
`;

function gv(i, e, t, n, s) {
  let o = [i],
    r = i,
    a = t;
  for (; r < e - 0.001;)
    ((r = Math.min(e, r + a)), o.push(r), (a = Math.min(s, a * n)));
  return o;
}

function kb(i, e) {
  let t = WORLD_BOUNDS.seaY,
    n = gv(27.5, 880, 0.75, 1.075, 120),
    s = gv(48, 880, 0.9, 1.085, 120),
    r = s
      .map((M) => -M)
      .reverse()
      .concat(gv(-48 + 0.9, 48 - 0.9, 0.9, 1, 0.9), s.slice(0)),
    a = n.length,
    l = r.length,
    c = 12,
    u = new Float32Array((a * l + c) * 3),
    h = [],
    f = 0;
  for (let M = 0; M < l; M++)
    for (let E = 0; E < a; E++)
      ((u[f++] = n[E]), (u[f++] = t), (u[f++] = r[M]));
  for (let M = 0; M < l - 1; M++)
    for (let E = 0; E < a - 1; E++) {
      let w = M * a + E,
        S = w + 1,
        z = w + a,
        H = z + 1;
      h.push(w, z, S, S, z, H);
    }
  let p = (M, E, w, S) => {
    let z = f / 3;
    for (let [H, O] of [
      [M, E],
      [w, E],
      [M, S],
      [w, S],
    ])
      ((u[f++] = H), (u[f++] = t), (u[f++] = O));
    h.push(z, z + 2, z + 1, z + 1, z + 2, z + 3);
  };
  (p(-880, -880, 27.5, -158),
    p(-880, 158, 27.5, 880),
    p(-880, -158, -158, 158));
  let d = new BufferGeometry();
  d.setAttribute("position", new BufferAttribute(u, 3));
  let v = new Float32Array(u.length);
  for (let M = 1; M < v.length; M += 3) v[M] = 1;
  (d.setAttribute("normal", new BufferAttribute(v, 3)),
    d.setIndex(h),
    (d.boundingSphere = new Sphere(new Vector3(0, t, 0), 1300)));
  let g = SKY_COLORS.horizonAway.clone().multiplyScalar(0.85),
    x = SKY_COLORS.horizon.clone().multiplyScalar(0.8),
    y = {
      uTime: {
        value: 0,
      },
      uDetail: {
        value: e.detail,
      },
      uDetailN: {
        value: e.detailN,
      },
      uHazeA: {
        value: g,
      },
      uHazeB: {
        value: x,
      },
      uSunDirW: {
        value: SUN_LIGHT.dir.clone(),
      },
    },
    b = new MeshStandardMaterial({
      color: 16777215,
      roughness: 0.1,
      metalness: 0,
    });
  ((b.name = "sea"),
    (b.onBeforeCompile = (M) => {
      (Object.assign(M.uniforms, y),
        (M.vertexShader =
          `uniform float uTime; varying vec3 vGWorld; varying float vSAmp;
` +
          M.vertexShader.replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
  vec3 swp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vSAmp = 1.0 - smoothstep(50.0, 220.0, distance(swp.xz, vec2(30.0, 0.0)));
  vec3 sdisp = vec3(0.0);
${CR}
  transformed += sdisp * vSAmp;
  vGWorld = swp;`,
          )),
        (M.fragmentShader = M.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
` + zR,
          )
          .replace("#include <map_fragment>", DR)
          .replace(
            "#include <roughnessmap_fragment>",
            "float roughnessFactor = gRough;",
          )
          .replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
  normal = normalize(mat3(viewMatrix) * normalize(vec3(-gNxz.x, 1.0, -gNxz.y)));`,
          )
          .replace(
            "#include <lights_fragment_maps>",
            `#include <lights_fragment_maps>
  radiance *= gOcc; iblIrradiance *= gOcc;`,
          )
          .replace(
            "#include <lights_fragment_end>",
            `#include <lights_fragment_end>
  { // sun glitter: strongest along the sun's azimuth, calmer to the sides; broken by swell and cat's paws
    vec3 sv = normalize(vGWorld - cameraPosition);
    float az = max(dot(normalize(sv.xz + vec2(1e-5)), normalize(uSunDirW.xz)), 0.0);
    reflectedLight.directSpecular = min(reflectedLight.directSpecular, vec3(40.0)) * gSpark * mix(0.3, 1.0, az * az * az);
  }`,
          )
          .replace(
            "#include <opaque_fragment>",
            LR +
              `
#include <opaque_fragment>`,
          )));
    }),
    (b.customProgramCacheKey = () => "saltline-sea-1"));
  let m = new Mesh(d, b);
  ((m.name = "sea"),
    (m.receiveShadow = !0),
    (m.castShadow = !1),
    (m.frustumCulled = !1),
    (m.matrixAutoUpdate = !1));
  let A = new MeshStandardMaterial({
      color: 724238,
      roughness: 0.55,
      metalness: 0,
    }),
    _ = new Mesh(
      new PlaneGeometry(320, 4.4)
        .rotateY(Math.PI / 2)
        .translate(29.88, -2.18, 0),
      A,
    );
  return (
    (_.name = "quaySkirt"),
    (_.receiveShadow = !0),
    (_.matrixAutoUpdate = !1),
    {
      mesh: m,
      skirt: _,
      uniforms: y,
      material: b,
    }
  );
}

var Ub = `
uniform vec3 uBoxMin[4]; uniform vec3 uBoxMax[4];
bool wInside(vec3 p){
  for (int i = 0; i < 4; i++) { if (all(greaterThan(p, uBoxMin[i])) && all(lessThan(p, uBoxMax[i]))) return true; }
  return false;
}
float wPhase(float c){ float g = 0.72; return (1.0 - g * g) / (12.566 * pow(1.0 + g * g - 2.0 * g * c, 1.5)); }
`;

var kR = `
uniform float uTime, uRain, uPix, uDrip; uniform vec3 uVel, uBox, uSunDir, uSunCol, uAmb;
attribute vec4 aSeed;
varying vec3 vCol; varying float vA; varying vec2 vUv;
${Ub}
uniform vec4 uSky[8];   // roof openings (x, z, half w, half d): rain falls through these into the shed
bool wSky(vec3 p){
  for (int i = 0; i < 8; i++) { if (abs(p.x - uSky[i].x) < uSky[i].z && abs(p.z - uSky[i].y) < uSky[i].w) return true; }
  return false;
}
void main(){
  vUv = position.xy;
  float sp = 0.82 + 0.36 * aSeed.w;
  vec3 vel = uVel * sp;
  vec3 p; float len; float kill = 0.0;
  if (aSeed.w < 0.0) {                       // eave drip line (shed south eave), free-fall from 7 m
    float T = 1.19; float t = fract(uTime / T * (0.9 + 0.2 * aSeed.y) + aSeed.z) * T;
    p = vec3(mix(-16.0, 12.0, aSeed.x), 7.0 - 4.9 * t * t, -10.72 + 0.05 * sin(aSeed.x * 911.0));
    vel = vec3(0.0, -9.81 * t - 0.3, 0.0); len = 0.022 * length(vel) + 0.03;
    kill = 1.0 - uDrip;
    if (fract(aSeed.x * 37.7) > 0.55 + 0.45 * uRain) kill = 1.0;
  } else {
    p = aSeed.xyz * uBox + vel * uTime;
    p = mod(p - cameraPosition + 0.5 * uBox, uBox) - 0.5 * uBox + cameraPosition;
    len = 0.03 * length(vel);
    if (fract(aSeed.w * 7.13 + aSeed.x) > uRain) kill = 1.0;
    if (wInside(p) && !wSky(p)) kill = 1.0;
  }
  if (p.y < (p.x > 30.0 ? -1.6 : 0.0)) kill = 1.0;
  vec3 dir = normalize(vel);
  vec3 toP = p - cameraPosition; float dist = length(toP);
  vec3 side = normalize(cross(dir, toP));
  float w0 = 0.005 + 0.004 * fract(aSeed.w * 3.7);
  float w = max(w0, dist * uPix * 0.75);
  vec3 wp = p + dir * (len * (position.y - 0.5)) + side * (w * position.x);
  float a = (w0 / w) * smoothstep(0.7, 2.6, dist) * (1.0 - smoothstep(0.38, 0.5, dist / uBox.x));
  float c = dot(toP / max(dist, 1e-3), uSunDir);
  vCol = uAmb + uSunCol * wPhase(c);
  vA = a * (0.55 + 0.45 * fract(aSeed.w * 13.3));
  gl_Position = kill > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

var FR = `
varying vec3 vCol; varying float vA; varying vec2 vUv;
void main(){
  float x = 1.0 - abs(vUv.x) * 2.0;
  float e = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
  gl_FragColor = vec4(vCol, vA * x * e);
}`;

var UR = `
uniform float uTime, uRain; uniform vec3 uSunDir, uSunCol, uAmb, uMaskRect; uniform sampler2D uMask;
attribute vec4 aSeed;
varying vec3 vCol; varying float vA; varying vec2 vUv; varying float vLife;
${Ub}
vec2 sHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
void main(){
  vUv = position.xy;
  float period = 0.26 + 0.14 * aSeed.z;
  float tt = uTime / period + aSeed.w * 10.0; float cyc = floor(tt); float life = fract(tt);
  vec2 r = sHash(aSeed.xy * 91.7 + cyc * 0.371);
  vec2 rr = r - 0.5; rr *= 0.35 + 1.3 * abs(rr);                    // denser near the player
  vec2 snap = floor(cameraPosition.xz / 4.0) * 4.0;
  vec3 p = vec3(snap.x + rr.x * 30.0, 0.0, snap.y + rr.y * 30.0);
  float kill = 0.0;
  vec2 muv = (p.xz - uMaskRect.xy) * uMaskRect.z;
  float inM = step(0.0, muv.x) * step(muv.x, 1.0) * step(0.0, muv.y) * step(muv.y, 1.0);
  float pud = step(textureLod(uMask, muv, 0.0).r, 0.49) * inM;
  float k = fract(aSeed.w * 5.3 + cyc * 0.17);
  if (pud < 0.5 && k > 0.3) kill = 1.0;
  if (k > 0.2 + 0.8 * uRain) kill = 1.0;
  if (p.x > 29.7 || wInside(p + vec3(0.0, 0.2, 0.0))) kill = 1.0;
  float sz = mix(0.04, 0.08, aSeed.z) * mix(0.65, 1.0, pud);
  float wd = sz * (0.7 + 1.5 * life), ht = sz * (0.4 + 1.3 * sin(life * 3.14159));
  vec3 toP = p - cameraPosition; float dist = length(toP);
  vec3 side = normalize(vec3(toP.z, 0.0, -toP.x));
  vec3 wp = p + side * (wd * position.x * 2.0) + vec3(0.0, ht * position.y + 0.004, 0.0);
  float c = dot(toP / max(dist, 1e-3), uSunDir);
  vCol = uAmb * 1.4 + uSunCol * wPhase(c) * 0.8;
  vA = (1.0 - life) * (1.0 - smoothstep(11.0, 15.0, dist)) * mix(0.5, 1.0, pud);
  vLife = life;
  gl_Position = kill > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

var NR = `
varying vec3 vCol; varying float vA; varying vec2 vUv; varying float vLife;
void main(){
  float x = vUv.x * 2.0, y = vUv.y;
  // little crown: a rim arc that opens outward, plus a few thrown droplets
  float dome = smoothstep(1.0, 0.25, length(vec2(x * 1.15, y * 1.5)));
  float crown = dome * (0.35 + 0.65 * smoothstep(0.25, 0.75, length(vec2(x, y * 1.4))));
  float core = smoothstep(0.5, 0.0, length(vec2(x * 1.6, (y - 0.25) * 1.6))) * (1.0 - vLife);
  float dots = smoothstep(0.16, 0.05, length(vec2(abs(x) - 0.75, y - 0.82))) + smoothstep(0.14, 0.04, length(vec2(x - 0.2, y - 0.93)));
  float a = clamp(crown * 0.5 + core * 0.8 + dots * 0.0, 0.0, 1.0) * vA * 0.6;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCol, a);
}`;

function Fb(i, e, t) {
  let n = new InstancedBufferGeometry();
  (n.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]),
      3,
    ),
  ),
    n.setIndex([0, 1, 2, 2, 1, 3]));
  let s = new Float32Array((i + e) * 4);
  for (let o = 0; o < (i + e) * 4; o++) s[o] = t();
  for (let o = i; o < i + e; o++) s[o * 4 + 3] = -1;
  return (
    n.setAttribute("aSeed", new InstancedBufferAttribute(s, 4)),
    (n.instanceCount = i + e),
    (n.boundingSphere = new Sphere(new Vector3(), 1e5)),
    n
  );
}

function Nb(i, e) {
  let t = i.rng && i.rng.fork ? i.rng.fork() : Math.random,
    n = Math.max(0.15, i.quality.rain || 0.5),
    s = Math.round(9e3 * n),
    o = 260,
    r = Math.round(900 * n),
    a = [0, 1, 2, 3].map(() => new Vector3()),
    l = [0, 1, 2, 3].map(() => new Vector3()),
    c = SUN_LIGHT.color.clone().multiplyScalar(1.9),
    u = SKY_COLORS.fog.clone().multiplyScalar(0.15),
    h = {
      uTime: {
        value: 0,
      },
      uRain: {
        value: 0.6,
      },
      uBoxMin: {
        value: a,
      },
      uBoxMax: {
        value: l,
      },
      uSunDir: {
        value: SUN_LIGHT.dir.clone(),
      },
      uSunCol: {
        value: c,
      },
      uAmb: {
        value: u,
      },
    },
    f = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new Vector4(0, 0, -1, -1)),
    p = {
      ...h,
      uSky: {
        value: f,
      },
      uPix: {
        value: 0.002,
      },
      uDrip: {
        value: 0,
      },
      uVel: {
        value: new Vector3(-2.6, -9.4, 1.1),
      },
      uBox: {
        value: new Vector3(26, 15, 26),
      },
    },
    d = new ShaderMaterial({
      uniforms: p,
      vertexShader: kR,
      fragmentShader: FR,
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: !1,
    }),
    v = new Mesh(Fb(s, o, t), d);
  ((v.frustumCulled = !1),
    (v.renderOrder = 900),
    (v.name = "rain"),
    (v.matrixAutoUpdate = !1),
    (v.castShadow = v.receiveShadow = !1));
  let g = {
      ...h,
      uMask: {
        value: e.mask,
      },
      uMaskRect: {
        value: new Vector3(Li.x0, Li.z0, 1 / Li.size),
      },
    },
    x = new ShaderMaterial({
      uniforms: g,
      vertexShader: UR,
      fragmentShader: NR,
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: !1,
    }),
    y = new Mesh(Fb(r, 0, t), x);
  ((y.frustumCulled = !1),
    (y.renderOrder = 890),
    (y.name = "rainSplash"),
    (y.matrixAutoUpdate = !1));
  let b = 0.6,
    m = 0.6,
    A = 22 + t() * 25,
    _ = 0,
    M = new Vector2();
  return {
    rain: v,
    splash: y,
    wind: p.uVel.value,
    setRain(w) {
      m = Math.min(1, Math.max(0, w));
    },
    get rainLevel() {
      return b;
    },
    update(w) {
      ((_ += w),
        (b += (m - b) * Math.min(1, w * 0.8)),
        (h.uTime.value = _),
        (h.uRain.value = b),
        (v.visible = y.visible = b > 0.01));
      let S = i.camera;
      if (S) {
        let O = i.render && i.render.resolution;
        (O && O.x > 8 ? M.copy(O) : i.renderer.getDrawingBufferSize(M),
          (p.uPix.value =
            (2 * Math.tan((S.fov * Math.PI) / 360)) / Math.max(1, M.y)));
      }
      let z = (i.level && i.level.interiorBoxes) || [];
      for (let O = 0; O < 4; O++) {
        let q = z[O];
        q && q.min && q.max
          ? (a[O].set(q.min.x - 0.15, q.min.y - 1, q.min.z - 0.15),
            l[O].set(q.max.x + 0.15, q.max.y + 0.3, q.max.z + 0.15))
          : (a[O].set(0, 0, 0), l[O].set(0, 0, 0));
      }
      p.uDrip.value = z.length ? 1 : 0;
      let H = (i.level && i.level.skylights) || [];
      for (let O = 0; O < 8; O++) {
        let q = H[O];
        q && q.w > 0
          ? f[O].set(q.x, q.z, q.w * 0.5, (q.d || q.w) * 0.5)
          : f[O].set(0, 0, -1, -1);
      }
      ((A -= w),
        A <= 0 &&
          ((A = 30 + t() * 30),
          i.events.emit("thunder", {
            intensity: 0.3 + 0.7 * t(),
          })));
    },
  };
}

export { Lb, kb, Nb };
