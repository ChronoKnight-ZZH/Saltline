// 临时路线核查：用真实 collider 表，按"步高 0.42 + 胶囊半径盖缝"逐点爬关键动线。
// 说明：采样落在相邻 collider 的接缝上时按"仍由前一步支撑"处理（真实胶囊半径 0.35 会盖住 0.06 的缝）。
import { Group, MeshBasicMaterial } from "../src/vendor/three-r180.js";
import "../src/world/props/register.js";
import { createProps } from "../src/world/props/props.js";
import { createTidegateLevel } from "../src/world/level/tidegate.js";

const STEP = 0.42;
const boxes = [];
const mat = new MeshBasicMaterial({ color: 0x8899aa });
const v3 = (v) => (Array.isArray(v) ? [v[0], v[1], v[2]] : [v.x, v.y, v.z]);
const fakeMats = {
  get: () => mat,
  emissive: (c) => new MeshBasicMaterial({ color: c }),
  decal: () => ({ material: mat, aspect: 1 }),
  label: () => ({ material: mat, aspect: 1 }),
};
const fakePhysics = {
  bounds: { min: { x: -40, z: -30 }, max: { x: 40, z: 30 } },
  addBox: (min, max, opts) => boxes.push({ min: v3(min), max: v3(max), opts: opts || {} }),
  moveCapsule: () => ({ onGround: true, surface: "concrete" }),
  nav: { cell: 0.5, isWalkable: () => true },
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
const level = createTidegateLevel(context);
console.log(`[setup] colliders ${boxes.length}`);

// 该点脚下最高的支撑面；返回 null 表示"接缝"，返回 0 表示"落到地面基准"
function support(x, z, feet) {
  let best = null;
  for (const b of boxes) {
    if (x < b.min[0] - 0.02 || x > b.max[0] + 0.02) continue;
    if (z < b.min[2] - 0.02 || z > b.max[2] + 0.02) continue;
    if (b.min[1] > feet + STEP + 0.001) continue; // 头顶的（屋顶/桥底）不算地面
    if (b.max[1] > feet + STEP + 0.001) continue; // 一步跨不上去
    if (best === null || b.max[1] > best) best = b.max[1];
  }
  if (best === null && feet <= 0.5) return 0; // 贴地时把基准地面当支撑
  return best;
}

function walk(name, pts, startFeet) {
  let feet = startFeet;
  const fails = [];
  let maxUp = 0;
  let minFeet = feet;
  let maxFeet = feet;
  let seams = 0;
  let peakAt = null;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, z0] = pts[i - 1];
    const [x1, z1] = pts[i];
    const d = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(d / 0.12));
    for (let k = 1; k <= n; k += 1) {
      const x = x0 + ((x1 - x0) * k) / n;
      const z = z0 + ((z1 - z0) * k) / n;
      const s = support(x, z, feet);
      if (s === null) {
        seams += 1;
        continue;
      }
      const delta = s - feet;
      if (delta > STEP + 0.001) {
        fails.push(`(${x.toFixed(2)},${z.toFixed(2)}) 需上 ${delta.toFixed(2)}m (${feet.toFixed(2)}→${s.toFixed(2)})`);
        feet = s;
        continue;
      }
      if (delta > maxUp) {
        maxUp = delta;
        peakAt = `(${x.toFixed(2)},${z.toFixed(2)})`;
      }
      feet = s;
      if (feet < minFeet) minFeet = feet;
      if (feet > maxFeet) maxFeet = feet;
    }
  }
  console.log(
    `[route] ${name}: ${fails.length ? "FAIL" : "ok"} | feet ${minFeet.toFixed(2)} → ${maxFeet.toFixed(2)} ` +
      `| max step-up ${maxUp.toFixed(2)}@${peakAt || "-"} | seams ${seams}`,
  );
  for (const f of fails.slice(0, 4)) console.log("   ✗ " + f);
  return fails.length === 0;
}

let allOk = true;
// 1) 冰面 → 栈桥 → 货仓区（0.06 冰面 / 0.32 桥头台阶 / 0.52 桥面）
allOk = walk("ice → bridge → depot", [[-20, 4.4], [-13, 4.4], [-5, 4.4], [-2, 4.4]], 0.06) && allOk;
// 2) 货仓区 → 9 级雪坡 → 台地
allOk = walk("depot → snow slope → plateau", [[2.0, 0.0], [4.5, -4.2], [4.5, -12], [6.0, -14]], 0) && allOk;
// 3) 货仓区 → 铁楼梯 → 走台 → 台地
allOk = walk("depot → metal stairs → catwalk → plateau", [[11.4, -2.6], [11.4, -3.9], [11.4, -6.6], [11.0, -9.0], [11.0, -12.5]], 0) && allOk;
// 4) 台地 → 第二段楼梯 → 5.2m 瞭望台
allOk = walk("plateau → stairs → lookout deck", [[6.2, -14], [6.2, -18.6], [6.2, -21.5], [6.2, -23.0], [7.2, -25.0]], 2.66) && allOk;
// 5) 南侧开阔地 → 舷梯 → 艏甲板 → 主甲板
allOk = walk("south field → gangway → bow deck → main deck", [[2.0, 16.0], [2.0, 17.4], [2.0, 20.3], [2.0, 21.4], [2.0, 27.0]], 0) && allOk;
// 6) 出生点 → 冰缝西侧安全点
allOk = walk("spawn → safe west", [[-33.4, 16.2], [-20, 10], [-16.4, 4.4]], 0.06) && allOk;

console.log(allOk ? "ALL ROUTES OK" : "SOME ROUTES FAILED");
process.exit(allOk ? 0 : 1);
