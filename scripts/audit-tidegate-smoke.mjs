// TIDEGATE 冒烟审计：用桩 context 在 node 里真跑一遍 createTidegateLevel。
// 目的：把上千行几何代码真正执行一次，抓运行期异常（未定义材质键、参数错、API 用错）。
// 不做渲染，也不模拟移动（动线核查见 audit-tidegate-routes.mjs）。
import { Group, MeshBasicMaterial } from "../src/vendor/three-r180.js";
import "../src/world/props/register.js";
import { createProps } from "../src/world/props/props.js";
import { l1 } from "../src/render/materials/catalog.js";
import { createTidegateLevel } from "../src/world/level/tidegate.js";

const boxes = [];
const mat = new MeshBasicMaterial({ color: 0x8899aa });
const askedNames = new Set();
// addBox 的 min/max 既可能是数组（t.col），也可能是 Box3 的 Vector3（place 的 collider 路径）
const v3 = (v) => (Array.isArray(v) ? [v[0], v[1], v[2]] : [v.x, v.y, v.z]);

const fakeMats = {
  get(name) {
    if (typeof name === "string") askedNames.add(name);
    return mat;
  },
  emissive(color) {
    return new MeshBasicMaterial({ color });
  },
  decal(name) {
    return { material: mat, aspect: 1 };
  },
  label(name, text) {
    return { material: mat, aspect: 1 };
  },
};

const fakePhysics = {
  bounds: { min: { x: -40, z: -30 }, max: { x: 40, z: 30 } },
  addBox(min, max, opts) {
    boxes.push({ min: v3(min), max: v3(max), opts: opts || {} });
  },
  moveCapsule() {
    return { onGround: true, surface: "concrete" };
  },
  nav: {
    cell: 0.5,
    isWalkable() {
      return true;
    },
  },
};

const warnings = [];
const origWarn = console.warn;
console.warn = (...a) => {
  warnings.push(a.join(" "));
};
const errors = [];
const origError = console.error;
console.error = (...a) => {
  const first = a.map((x) => (x && x.stack ? x.stack.split("\n").slice(0, 4).join("\n  ") : String(x))).join(" ");
  errors.push(first);
};

const scene = new Group();
const context = {
  scene,
  mats: fakeMats,
  physics: fakePhysics,
  events: { emit() {} },
  player: { pos: null, alive: true, health: 100 },
  rng: Math.random,
  camera: null,
};
context.props = createProps(context);

let level = null;
let boom = null;
try {
  level = createTidegateLevel(context);
} catch (e) {
  boom = e;
}

console.warn = origWarn;
console.error = origError;

if (boom) {
  console.log("THREW:", boom && boom.stack ? boom.stack.split("\n").slice(0, 6).join("\n") : boom);
  process.exit(1);
}

console.log("objects in scene root:", scene.children.length);
console.log("collider boxes:", boxes.length);
console.log("level keys:", Object.keys(level).join(", "));
console.log("spawns:", level.enemySpawns.length,
  "(ground", level.enemySpawns.filter((s) => s.type === "ground").length,
  "/ air", level.enemySpawns.filter((s) => s.type === "air").length + ")");
console.log("covers:", level.coverPoints.length, "| placed:", level.placed.length);
console.log(
  "placed names:",
  JSON.stringify(
    level.placed.reduce((a, p) => ((a[p.name] = (a[p.name] || 0) + 1), a), {}),
  ),
);
console.log("objectives:", level.objectives.map((o) => `${o.id}[${o.short}]`).join(", "));
console.log("stats:", JSON.stringify(level.stats));
console.log("cinematicPath[0]:", JSON.stringify(level.cinematicPath[0]));
console.log("zones[0]:", JSON.stringify(level.zones[0]));
console.log("vantage:", JSON.stringify(level.vantage, (k, v) => (v && v.isVector3 ? [v.x, v.y, v.z] : v)));
console.log("warnings:", warnings.length);
for (const w of warnings.slice(0, 12)) console.log("  W:", w);
console.log("errors:", errors.length);
for (const e of errors.slice(0, 6)) console.log("  E:", e);

// 材质键核对：请求过的名字是否都在 catalog 里
const unknown = [...askedNames].filter((n) => !(n in l1));
console.log(`material names asked: ${askedNames.size} | unknown: ${unknown.length}`);
for (const n of unknown) console.log("  ? unknown material:", n);

// 桥面/台阶高度核查：桥头台阶与桥面碰撞顶面
const bridgers = boxes.filter(
  (b) => b.min[2] <= 6.7 && b.max[2] >= 2.1 && b.min[0] <= -4 && b.max[0] >= -16.5,
);
for (const b of bridgers) {
  console.log(
    "bridge-ish box x", b.min[0].toFixed(2), "..", b.max[0].toFixed(2),
    "z", b.min[2].toFixed(2), "..", b.max[2].toFixed(2),
    "top", b.max[1].toFixed(2), "surface", b.opts.surface,
  );
}

// 返回契约核对（level.js / flow.js 的消费形状）
const isXyz = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number");
const contract = [];
for (const [i, p] of level.cinematicPath.entries()) {
  if (!isXyz(p.pos) || !isXyz(p.look)) contract.push(`cinematicPath[${i}] 不是纯数组 pos/look`);
}
for (const [i, z] of level.zones.entries()) {
  if (!Array.isArray(z.min) || !Array.isArray(z.max) || z.min.length !== 2) contract.push(`zones[${i}] 形状不对`);
}
if (!level.vantage.stairsFoot.isVector3 || !level.vantage.roof.isVector3) contract.push("vantage 不是 Vector3");
if (typeof level.stats !== "object" || !level.stats) contract.push("stats 不是对象");
if (level.objectives.some((o) => !o.zone || !o.pos)) contract.push("objectives 缺 zone/pos");
console.log(`contract checks: ${contract.length ? "FAIL" : "ok"} ${contract.join(" | ")}`);

const ok =
  contract.length === 0 &&
  errors.length === 0 &&
  warnings.length === 0 &&
  unknown.length === 0 &&
  level.objectives.length === 3 &&
  level.enemySpawns.filter((s) => s.type === "ground").length > 0;
console.log(ok ? "SMOKE OK" : "SMOKE FAILED");
process.exit(ok ? 0 : 1);
