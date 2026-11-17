// 风雪粒子层：一团跟随相机的点云，风把雪吹成斜的墙。
// 只读 environment 的 snowLevel / wind，不反向写环境状态。
// 数值口径见 docs/weather/TIDEGATE暴风雪数值平移.md（snowLevel 0.5 = 小雪，1.0 = 暴风雪）。
import {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from "../vendor/three-r180.js";

// 暴风雪满档的粒子数。CPU 每帧只做位移+环绕，4200 个远低于一帧预算。
var SNOW_MAX = 4200;
// 雪体积（米）：以相机为中心的水平盒 + 垂直厚度。太大则稀疏，太小则像贴脸的白点。
var BOX_X = 30;
var BOX_Z = 30;
var BOX_Y = 16;

var VERT = `
attribute float aSize;
uniform float uPixel;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = max(0.4, -mv.z);
  // 近处小、远处也小，但都留 1px 下限，避免远处成片消失。
  gl_PointSize = clamp(aSize * uPixel / depth, 1.0, 9.0);
  // 贴脸 0.4m 内与 28m 外淡出：前者防"雪墙"，后者交给雾。
  vFade = smoothstep(0.4, 2.0, depth) * smoothstep(28.0, 14.0, depth);
  gl_Position = projectionMatrix * mv;
}`;

var FRAG = `
uniform float uOpacity;
uniform vec3 uColor;
varying float vFade;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float r = length(p);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.16, r);
  gl_FragColor = vec4(uColor, soft * uOpacity * vFade);
}`;

function createSnow(context) {
  // 调试开关 ?snow=0：只关粒子层，雾/压暗/风力/雷雪都照旧。
  // 用来区分"看不清"到底是雪幕（雾）还是白点（粒子）造成的。
  let muted =
    !!context.params &&
    (context.params.snow === "0" || context.params.snow === "off");
  if (muted) console.info("[snow] snow=0/off：本次不显示雪粒子（天气档不变）");
  let count = SNOW_MAX,
    rng = context.rng && context.rng.fork ? context.rng.fork() : Math.random,
    positions = new Float32Array(count * 3),
    sizes = new Float32Array(count),
    falls = new Float32Array(count),
    phases = new Float32Array(count),
    levels = 0,
    time = 0,
    cx = 0,
    cy = 2,
    cz = 0;

  // 初始撒满盒子；后续只靠 update 的环绕维持分布，不重新生成。
  for (let i = 0; i < count; i++) {
    let i3 = i * 3;
    positions[i3] = (rng() - 0.5) * BOX_X;
    positions[i3 + 1] = rng() * BOX_Y;
    positions[i3 + 2] = (rng() - 0.5) * BOX_Z;
    sizes[i] = 0.04 + rng() * 0.09;
    falls[i] = 1.4 + rng() * 1.2;
    phases[i] = rng() * 6.283;
  }

  let geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setDrawRange(0, 0);

  let material = new ShaderMaterial({
    uniforms: {
      uPixel: { value: 400 },
      uOpacity: { value: 0 },
      // 直接用分量数组：不进色彩空间转换，雪保持接近纯白。
      uColor: { value: [0.93, 0.96, 1.0] },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
  });

  let points = new Points(geometry, material);
  points.name = "snow";
  points.frustumCulled = false;
  points.renderOrder = 901;
  points.matrixAutoUpdate = false;
  points.visible = false;
  context.scene.add(points);

  function wrap(value, min, max) {
    let span = max - min;
    if (span <= 0) return value;
    while (value < min) value += span;
    while (value > max) value -= span;
    return value;
  }

  function update(dt) {
    if (dt > 0.1) dt = 0.1;
    time += dt;
    let env = context.environment,
      level = muted
        ? 0
        : env && typeof env.snowLevel === "number"
          ? env.snowLevel
          : 0,
      wind = (env && env.wind) || { x: 0, z: 0, speed: 0 },
      cam = (context.camera && context.camera.position) || { x: 0, y: 2, z: 0 };

    levels += (level - levels) * Math.min(1, dt * 4);
    let visible = levels > 0.02 && !!context.camera;
    points.visible = visible;
    if (!visible) return;

    // 相机移动时盒子跟着走：只做边界环绕，不在原地重撒（避免整场雪瞬移）。
    cx = cam.x;
    cy = cam.y;
    cz = cam.z;

    let halfX = BOX_X * 0.5,
      halfZ = BOX_Z * 0.5,
      minY = cy - 2.2,
      maxY = cy + BOX_Y - 2.2,
      wx = (wind.x || 0) * 0.55,
      wz = (wind.z || 0) * 0.55,
      flutter = 0.35 + levels * 0.55,
      i3 = 0;

    for (let i = 0; i < count; i++, i3 += 3) {
      let ph = phases[i] + time * (0.6 + sizes[i] * 6),
        sway = Math.sin(ph) * flutter;
      positions[i3] += (wx + sway) * dt;
      positions[i3 + 1] -= falls[i] * (0.6 + levels * 0.8) * dt;
      positions[i3 + 2] += (wz + Math.cos(ph * 0.8) * flutter) * dt;

      positions[i3] = wrap(positions[i3], cx - halfX, cx + halfX);
      positions[i3 + 2] = wrap(positions[i3 + 2], cz - halfZ, cz + halfZ);
      positions[i3 + 1] = wrap(positions[i3 + 1], minY, maxY);
    }

    geometry.attributes.position.needsUpdate = true;
    // 密度用 drawRange 表达：小雪 2100 颗，暴风雪 4200 颗。
    let drawn = Math.max(120, Math.round(count * Math.min(1, levels)));
    geometry.setDrawRange(0, drawn);
    material.uniforms.uOpacity.value = 0.42 + 0.22 * Math.min(1, levels);

    let res = context.render && context.render.resolution;
    if (res && res.y > 8) material.uniforms.uPixel.value = res.y * 0.5;
  }

  return {
    points,
    update,
    get level() {
      return levels;
    },
  };
}

export { createSnow };
