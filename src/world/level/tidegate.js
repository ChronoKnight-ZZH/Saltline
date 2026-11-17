// TIDEGATE — 第二张关卡：FROZEN OUTPOST（冰封前哨）
//
// 设计前提：必须和 level.js（Saltline Terminal）在轮廓上明显不同 —— 不共用
// "门楼 + 双层集装箱矩阵 + 货架冷库 + 高架栈桥"那套骨架。这里换成一整片
// 冻结的港湾，四区按方位铺开：
//
//   冰面码头（西）  x[-40,-13] z[-12,30]  冻结海面 / 冰缝 / 冰钓小屋 / 搁浅集装箱 / 冰面信标(A)
//   货仓区  （东）  x[ -7,26]  z[-12,16]  半埋仓库 + 供暖站(B) + 箱堆 + 叉车残骸
//   缆车塔  （北）  x[-16,12]  z[-30,-12] 2.6m 高地 / 塔楼 / 瞭望台 / 信号台(C)
//   破冰船  （南）  x[ -6,26]  z[16,30]   船头压碎冰面 / 舷梯 / 撤离点
//
// 三条连接：
//   1) 冰面码头 ↔ 货仓区：木栈桥跨过 x[-13,-7] 的冰缝（lead）。桥面 0.42m，
//      掉进冰缝 = 扣 12 血 + 传回桥头安全点（复刻 player.js 的落水语义：
//      damage(12) + 传送 + addShake + emit("player:rescued")）。
//   2) 货仓区 ↔ 缆车塔：x[1,8] 的 9 级雪坡 + x≈11.4 的金属楼梯（两条路），
//      坡面两侧摆了雪堆掩体。
//   3) 所有区 ↔ 破冰船：z[16,20.4] 的南侧开阔雪地，只有一排反光标杆，没有掩体。
//
// 与 level.js 的差异点（刻意）：
//   · 地面只在西侧是冰（player 站高 0.06），东/南是压实的雪，北侧是 2.6m 台地；
//     没有一张图那样的整块沥青 apron。
//   · 垂直动线是"雪坡台阶 + 铁楼梯 + 塔身爬梯"，不是 catwalk 栈桥。
//   · 目标三台设备全部自带 setState 状态机（live/cutting/cut），
//     灯的呼吸/闪灭/转绿由本文件自己驱动，不依赖 props 的 relay_node。
//   · 破冰船是"卡在冰里"的船体（艏部压碎冰板的碎块带），撤离点在主甲板上。
import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry,
  Vector3,
  defineModuleExports,
} from "../../vendor/three-r180.js";
import { batchStaticMeshes } from "../../core/geometry.js";
import { ob } from "./buildings.js";

var HALF_PI = Math.PI / 2;
var FULL_PI = Math.PI;
var EPS = 0.001;

// 朝向 → decal 的旋转（沿用旧版核对过的映射）
var DIR_ROT = { "x+": -HALF_PI, "x-": HALF_PI, "z+": FULL_PI, "z-": 0 };

var L = {
  landMaxX: 29.5,
  ice: { x0: -40, x1: -13, z0: -12, z1: 30, y: 0.06 },
  lead: { x0: -13, x1: -7, z0: -12, z1: 30 },
  depot: { x0: -7, x1: 26, z0: -12, z1: 16 },
  shed: { x0: 8, x1: 26, z0: -6, z1: 12, wall: 0.34, h: 5.4 },
  hill: { x0: -16, x1: 12, z0: -30, z1: -12, h: 2.6 },
  slope: { x0: 1, x1: 8, z0: -12, z1: -4.2, steps: 9 },
  bridge: { x0: -15, x1: -5, z0: 2.2, z1: 6.6, y: 0.42 },
  tower: { x: 7, z: -24, deck: 5.2, top: 12.6 },
  ship: { x0: -6, x1: 10, z0: 20.4, z1: 31, deck: 3.04, bow: 2.66 },
  extraction: { x: 2, z: 23.6, y: 3.04, r: 2.8 },
  beacon: { x: -20.8, z: 9 },
  heat: { x: 17.6, z: 3.2 },
  signal: { x: 5.8, z: -24.4 },
};

var SAFE_WEST = new Vector3(-16.4, 0.06, 4.4);
var SAFE_EAST = new Vector3(-3.6, 0.035, 4.4);

// ---------------------------------------------------------------------------
// 材质
// ---------------------------------------------------------------------------
// 只在这里做"冰/雪"的色偏；其余沿用 catalog 的原名，避免多出无谓的材质实例。
function buildMaterials(context) {
  var m = context.mats;
  return {
    ice: m.get("paint_white", { color: 0xb2c8d5 }),
    iceDeep: m.get("concrete_painted", { color: 0x77909f }),
    iceSheen: m.get("paint_white", { color: 0xd2e3ec }),
    iceRim: m.get("steel_bare", { color: 0xc4d9e4 }),
    snow: m.get("paint_white", { color: 0xdfe8ee }),
    snowDull: m.get("concrete_dirty", { color: 0xc6d1d9 }),
    water: "water_dark",
    timber: "wood_dark",
    plank: "wood_pallet",
    galv: "steel_galv",
    dark: "steel_dark",
    worn: "steel_worn",
    rust: "steel_rust",
    deck: "diamond_plate",
    roof: "corrugated_roof",
    hull: "hull_paint",
    hullRed: "hull_red",
    white: "paint_white",
    red: "paint_red",
    yellow: "paint_yellow",
    grey: "paint_grey",
    teal: "paint_teal",
    glass: "glass_dirty",
    hazard: "hazard_stripes",
    tarp: "tarp",
    rubber: "rubber",
    rope: "rope",
    concrete: "concrete",
    concreteDirty: "concrete_dirty",
  };
}

// ---------------------------------------------------------------------------
// 通用积木
// ---------------------------------------------------------------------------
function block(t, mat, x0, y0, z0, x1, y1, z1, surface) {
  t.slab(mat, x0, y0, z0, x1, y1, z1);
  t.col(x0, y0, z0, x1, y1, z1, surface || "concrete");
}

// 栏杆：立柱 + 一道横杆（沿 x 或沿 z）
function railLine(t, mat, x0, z0, x1, z1, y, h) {
  var len = Math.hypot(x1 - x0, z1 - z0);
  var n = Math.max(1, Math.round(len / 1.9));
  for (var i = 0; i <= n; i += 1) {
    var u = i / n;
    t.box(mat, 0.08, h, 0.08, x0 + (x1 - x0) * u, y + h / 2, z0 + (z1 - z0) * u);
  }
  var w = Math.abs(x1 - x0) || 0.07;
  var d = Math.abs(z1 - z0) || 0.07;
  t.box(mat, w, 0.07, d, (x0 + x1) / 2, y + h, (z0 + z1) / 2);
}

function arrow(t, dir, size, x, y, z) {
  t.decal("arrow", size, x, y, z, "y+", DIR_ROT[dir] || 0);
}

// 半沉的集装箱：圆柱/箱体按 yaw 近似成 AABB 碰撞
function sunkContainer(t, x, z, yaw, y, seed, color) {
  t.place("container20", x, z, yaw, { seed: seed, color: color, wear: 0.62 }, y, {
    noCol: true,
  });
  var c = Math.abs(Math.cos(yaw));
  var s = Math.abs(Math.sin(yaw));
  var hx = (c * 6.06 + s * 2.44) / 2;
  var hz = (s * 6.06 + c * 2.44) / 2;
  t.col(x - hx, 0, z - hz, x + hx, y + 2.59, z + hz, "metal");
}

// ---------------------------------------------------------------------------
// 冰面码头（西）
// ---------------------------------------------------------------------------
function buildIceSheet(t, m) {
  var I = L.ice;
  t.slab(m.ice, I.x0, 0, I.z0, I.x1, I.y, I.z1);
  // surface 标 "ice"：player 侧据此切到低摩擦（打滑），audio 对未知名会自动回落
  t.col(I.x0, 0, I.z0, I.x1, I.y, I.z1, "ice");

  // 冰纹：深色裂缝带（视觉，无碰撞）
  var cracks = [
    [-38.5, -9.4, -25, -9.0],
    [-33.5, 3.6, -19.5, 4.0],
    [-39, 17.2, -21.5, 17.7],
    [-31, 26.2, -17.5, 26.6],
    [-27.5, -7.4, -20.5, -7.1],
    [-36.5, 22.4, -24, 22.9],
  ];
  for (var i = 0; i < cracks.length; i += 1) {
    var c = cracks[i];
    t.slab(m.iceDeep, c[0], I.y + 0.002, c[1], c[2], I.y + 0.014, c[3]);
  }

  // 挤压冰脊：两片叠压的板 + 顶部积雪，高度都压在 0.2m 以内（不挡路、不挡视线）
  var ridges = [
    [-36.2, -2.4, 0.5, 4.4, 1.5],
    [-33.6, 12.8, -0.32, 3.8, 1.2],
    [-38.2, 21.4, 0.88, 4.0, 1.4],
    [-30.4, -9.2, 0.22, 3.4, 1.1],
    [-18.6, -8.4, -0.62, 3.6, 1.3],
    [-18.2, 25.2, 0.4, 3.2, 1.1],
    [-27.4, -22.6, 0.14, 3.8, 1.2],
  ];
  for (var r = 0; r < ridges.length; r += 1) {
    var g = ridges[r];
    t.box(m.iceSheen, g[3], 0.12, g[4], g[0], I.y + 0.09, g[1], {
      r: [0, g[2], 0],
    });
    t.box(m.snow, g[3] * 0.72, 0.07, g[4] * 0.66, g[0], I.y + 0.19, g[1], {
      r: [0, g[2] * 1.15, 0],
    });
  }

  // 雪斑：被风吹到冰面上的粉雪
  var drifts = [
    [-37, 4, 5.5, 4],
    [-32, -14, 4.8, 3.6],
    [-34, 18, 6.5, 4.5],
    [-24, 22, 5, 3.4],
    [-22, -12, 4.2, 3],
    [-38, -20, 5, 3.2],
    [-16, 16, 4.4, 3.2],
  ];
  for (var d = 0; d < drifts.length; d += 1) {
    var s = drifts[d];
    t.box(m.snow, s[2], 0.04, s[3], s[0], I.y + 0.02, s[1], {
      r: [0, t.rnd(-0.8, 0.8), 0],
    });
  }

  // 台地以西 / 以北的黑冰面：只是把大地板盖住（2cm 薄片，无碰撞）
  t.slab(m.iceDeep, -40, 0, -30, -13, 0.02, -12);
  t.box(m.snow, 6.0, 0.04, 4.0, -34, 0.03, -18, { r: [0, 0.3, 0] });
  t.box(m.snow, 5.0, 0.04, 3.4, -22, 0.03, -22, { r: [0, -0.4, 0] });

  // 搁浅集装箱（半沉在冰里，三个，20ft）
  sunkContainer(t, -33.2, 10.4, 0.34, -1.15, 21, "teal");
  sunkContainer(t, -24.4, -4.2, -0.58, -0.95, 22, "orange");
  sunkContainer(t, -26.6, 24.4, 1.02, -1.28, 23, "green");

  // 冰钓小屋 × 3
  fishingHut(t, m, -36.4, -6.2, 0);
  fishingHut(t, m, -30.2, 25.4, FULL_PI);
  fishingHut(t, m, -38.2, 13.6, 0);

  // 钓洞 + 桶 + 折凳
  iceHole(t, m, -35.1, -4.6);
  iceHole(t, m, -29.0, 24.0);
  t.place("barrel", -31.6, 24.2, 0.3, { seed: 311, color: "grey" }, L.ice.y);
  t.place("toolbox_cart", -35.0, 12.2, 1.1, { seed: 312 }, L.ice.y);
  t.place("pallet", -25.8, 12.6, 0.2, { seed: 313 }, L.ice.y);

  // 目标 A：冰面信标（三脚桅 + 氛灯 + 机柜）
  buildIceBeacon(t, m, L.beacon.x, L.beacon.z);

  // 桥头西侧的木桩与缆绳（栈桥的"锚固"感）
  for (var p = 0; p < 4; p += 1) {
    t.cyl(m.plank, 0.15, 0.9, -15.6 - p * 1.1, 0.45, 2.0 + p * 0.2, { seg: 8 });
    t.cyl(m.plank, 0.15, 0.9, -15.6 - p * 1.1, 0.45, 6.8 - p * 0.2, { seg: 8 });
  }
}

// 冰面上的钓洞：深色水面 + 白冰沿
function iceHole(t, m, x, z) {
  t.box(m.water, 1.15, 0.02, 1.15, x, L.ice.y + 0.006, z);
  var w = 1.34;
  t.box(m.iceRim, w, 0.045, 0.1, x, L.ice.y + 0.02, z - 0.66);
  t.box(m.iceRim, w, 0.045, 0.1, x, L.ice.y + 0.02, z + 0.66);
  t.box(m.iceRim, 0.1, 0.045, 1.2, x - 0.66, L.ice.y + 0.02, z);
  t.box(m.iceRim, 0.1, 0.045, 1.2, x + 0.66, L.ice.y + 0.02, z);
}

// 冰钓小屋：木箱 + 雪顶 + 炉管 + 门
function fishingHut(t, m, x, z, yaw) {
  var g = new Group();
  t.staticRoot.add(g);
  g.position.set(x, L.ice.y, z);
  g.rotation.y = yaw;

  t.box(m.timber, 2.6, 2.05, 2.5, 0, 1.05, 0, { parent: g });
  t.box(m.plank, 2.52, 0.11, 2.42, 0, 2.16, 0, { parent: g });
  t.box(m.snow, 2.78, 0.24, 2.66, 0.06, 2.33, 0.04, { parent: g });
  t.box(m.snow, 2.6, 0.12, 0.5, 0, 2.47, 1.0, { parent: g });

  // 门（+z 面）
  t.box(m.plank, 0.94, 1.66, 0.09, 0.44, 0.83, 1.27, { parent: g });
  t.box(m.iceDeep, 0.82, 1.5, 0.04, 0.44, 0.8, 1.31, { parent: g });
  t.box(m.dark, 0.06, 0.06, 0.06, 0.8, 1.5, 1.34, { parent: g });

  // 炉管 + 雪帽
  t.cyl(m.rust, 0.075, 1.15, -0.82, 2.6, -0.62, { parent: g, seg: 8 });
  t.cyl(m.dark, 0.12, 0.12, -0.82, 3.19, -0.62, { parent: g, seg: 8 });
  // 窗（-x 面）
  t.box(m.glass, 0.04, 0.5, 0.9, -1.31, 1.42, 0.16, { parent: g });
  t.box(m.plank, 0.03, 0.07, 1.0, -1.33, 1.2, 0.16, { parent: g });
  // 门口的踏板与雪堆
  t.box(m.plank, 1.2, 0.08, 0.5, 0.44, 0.02, 1.62, { parent: g });

  t.col(x - 1.4, 0, z - 1.36, x + 1.4, 2.45, z + 1.36, "wood");
  // 屋顶积雪厚，顶上再压一块（不碰撞）
  t.box(m.snow, 2.2, 0.16, 1.8, x + Math.sin(yaw) * 0.3, 2.52, z + Math.cos(yaw) * 0.3, {
    r: [0, yaw, 0],
  });
}

// 目标 A：冰面信标
function buildIceBeacon(t, m, x, z) {
  var baseY = L.ice.y;
  var g = new Group();
  t.staticRoot.add(g);
  g.position.set(x, baseY, z);

  // 混凝土基座
  t.box(m.concrete, 2.6, 0.22, 2.6, 0, 0.11, 0, { parent: g });
  t.box(m.snow, 2.9, 0.1, 2.9, 0, 0.26, 0, { parent: g });

  // 三脚桅（桅顶 4.4）
  var apex = [0, 4.4, 0];
  var feet = [
    [-1.05, 0.2, 0.6],
    [1.05, 0.2, 0.6],
    [0, 0.2, -1.2],
  ];
  for (var i = 0; i < feet.length; i += 1) {
    t.rod(m.galv, feet[i], apex, 0.055, { parent: g });
    // 地脚螺栓
    t.box(m.dark, 0.3, 0.14, 0.3, feet[i][0], 0.29, feet[i][2], { parent: g });
  }
  // 横撑
  t.rod(m.galv, [-0.62, 1.4, 0.36], [0.62, 1.4, 0.36], 0.03, { parent: g });
  t.rod(m.galv, [-0.62, 1.4, 0.36], [0, 1.4, -0.72], 0.03, { parent: g });
  t.rod(m.galv, [0.62, 1.4, 0.36], [0, 1.4, -0.72], 0.03, { parent: g });

  // 桅顶灯箱 + 百叶
  t.box(m.dark, 0.62, 0.46, 0.62, 0, 4.55, 0, { parent: g });
  t.box(m.galv, 0.5, 0.06, 0.5, 0, 4.82, 0, { parent: g });
  t.box(m.snow, 0.6, 0.07, 0.6, 0, 4.88, 0, { parent: g });
  // 走线
  t.rod(m.rubber, [0.24, 0.2, 1.05], [0.24, 3.9, 0.18], 0.02, { parent: g });

  // 机柜（交互点）
  t.box(m.galv, 1.0, 1.16, 0.6, 1.55, 0.58, 0.1, { parent: g });
  t.box(m.dark, 0.86, 0.52, 0.06, 1.55, 0.86, 0.42, { parent: g });
  t.box(m.snow, 1.06, 0.08, 0.66, 1.55, 1.21, 0.1, { parent: g });
  t.box(m.hazard, 0.9, 0.1, 0.05, 1.55, 0.3, 0.42, { parent: g });
  // 舱口
  t.box(m.dark, 0.34, 0.1, 0.34, 1.55, 0.06, 0.1, { parent: g });

  var lamp = makeLamp(g, 0xffa64a, [0, 4.6, 0], t);
  var device = wireDevice(g, lamp);
  g.position.set(x, baseY, z);
  return device;
}

// ---------------------------------------------------------------------------
// 冰缝（lead）—— 落冰 = 扣血 + 传回安全点
// ---------------------------------------------------------------------------
function buildLead(t, m) {
  var D = L.lead;
  // 未冻的深水
  t.slab(m.water, D.x0, 0.0, D.z0, D.x1, 0.03, D.z1);
  // 两侧冰沿：稍微高出冰面，形成"断口"
  t.box(m.iceRim, 2.4, 0.16, D.z1 - D.z0, D.x0 - 0.7, 0.05, (D.z0 + D.z1) / 2);
  t.box(m.iceRim, 2.4, 0.16, D.z1 - D.z0, D.x1 + 0.7, 0.05, (D.z0 + D.z1) / 2);
  // 断口上的碎冰（视觉）
  var chunks = [
    [-12.2, -6.2, 0.9, -0.4],
    [-11.4, 8.6, 0.7, 0.8],
    [-9.6, 18.2, 1.1, 0.2],
    [-10.4, 26.4, 0.8, -0.7],
    [-8.2, 0.4, 0.6, 1.2],
    [-12.4, 14.2, 0.9, 0.6],
    [-8.6, 12.4, 0.7, -0.9],
  ];
  for (var i = 0; i < chunks.length; i += 1) {
    var c = chunks[i];
    t.box(m.iceSheen, c[2], 0.12, c[2] * 0.8, c[0], 0.06, c[1], {
      r: [0, c[3], 0],
    });
  }
  // 冰缝上不再铺白片 —— 让深水断口一眼看得出来
  // 红色警示带（桥两侧断口）
  t.box(m.hazard, 0.4, 0.02, 6.0, D.x0 - 0.28, 0.075, 4.4);
  t.box(m.hazard, 0.4, 0.02, 6.0, D.x1 + 0.28, 0.075, 4.4);
}

// ---------------------------------------------------------------------------
// 雪覆栈桥（冰面码头 ↔ 货仓区）
// ---------------------------------------------------------------------------
function buildBridge(t, m) {
  var B = L.bridge;
  var zc = (B.z0 + B.z1) / 2;

  // 桥面板
  t.box(m.timber, B.x1 - B.x0, 0.08, B.z1 - B.z0, (B.x0 + B.x1) / 2, B.y, zc);
  t.box(m.snow, B.x1 - B.x0, 0.055, B.z1 - B.z0 - 0.2, (B.x0 + B.x1) / 2, B.y + 0.07, zc);
  // 通行碰撞（顶面 0.52 = 雪面）
  t.col(B.x0, 0, B.z0, B.x1, B.y + 0.1, B.z1, "metal");

  // 桥头两级台阶：冰面 0.06（西）/ 货仓地面 0（东）→ 桥面 0.52，步高都 < 0.42
  t.box(m.timber, 1.0, 0.32, B.z1 - B.z0, B.x0 - 0.5, 0.16, zc);
  t.col(B.x0 - 1.0, 0, B.z0, B.x0, 0.32, B.z1, "wood");
  t.box(m.snow, 1.0, 0.06, B.z1 - B.z0, B.x0 - 0.5, 0.35, zc);
  t.box(m.timber, 1.0, 0.32, B.z1 - B.z0, B.x1 + 0.5, 0.16, zc);
  t.col(B.x1, 0, B.z0, B.x1 + 1.0, 0.32, B.z1, "wood");
  t.box(m.snow, 1.0, 0.06, B.z1 - B.z0, B.x1 + 0.5, 0.35, zc);

  // 横梁 + 木桩
  for (var i = 0; i < 5; i += 1) {
    var x = B.x0 + 1.2 + i * 2.4;
    t.box(m.plank, 0.16, 0.14, B.z1 - B.z0 + 0.4, x, B.y - 0.09, zc);
    t.cyl(m.timber, 0.13, 1.1, x, 0.1, B.z0 + 0.15, { seg: 8 });
    t.cyl(m.timber, 0.13, 1.1, x, 0.1, B.z1 - 0.15, { seg: 8 });
  }

  // 北侧护栏（全长）
  railLine(t, m.galv, B.x0, B.z1 - 0.12, B.x1, B.z1 - 0.12, B.y + 0.1, 0.86);
  // 南侧护栏：中间 4m 断开 —— 掉下去的地方
  railLine(t, m.galv, B.x0, B.z0 + 0.12, -12.1, B.z0 + 0.12, B.y + 0.1, 0.86);
  railLine(t, m.galv, -7.9, B.z0 + 0.12, B.x1, B.z0 + 0.12, B.y + 0.1, 0.86);
  // 断口的警示牌与红白斜带
  t.box(m.hazard, 0.42, 0.9, 0.08, -11.9, B.y + 0.55, B.z0 + 0.14);
  t.box(m.hazard, 0.42, 0.9, 0.08, -8.1, B.y + 0.55, B.z0 + 0.14);
  t.box(m.red, 0.36, 0.1, 0.1, -11.85, B.y + 1.0, B.z0 + 0.14);
  t.box(m.red, 0.36, 0.1, 0.1, -8.15, B.y + 1.0, B.z0 + 0.14);

  // 桥头雪堆与导引箭头
  t.box(m.snow, 3.2, 0.35, 1.6, -14.2, 0.14, zc + 0.4, { r: [0, 0.2, 0] });
  t.box(m.snow, 3.0, 0.3, 1.5, -5.9, 0.12, zc - 0.5, { r: [0, -0.24, 0] });
  arrow(t, "x+", 1.6, -16.4, 0.08, zc);
  arrow(t, "x+", 1.6, -6.2, 0.05, zc);
}

// ---------------------------------------------------------------------------
// 货仓区（东）—— 半埋仓库 / 供暖站 / 箱堆 / 叉车残骸
// ---------------------------------------------------------------------------
function buildWarehouse(t, m, devices, context) {
  var S = L.shed;
  var H = S.h;
  var W = S.wall;

  // 地坪（比雪面高 3cm）
  t.slab(m.concrete, S.x0, 0.035, S.z0, S.x1, 0.07, S.z1);
  t.col(S.x0, 0, S.z0, S.x1, 0.07, S.z1, "concrete");

  // 墙体：北墙整段；西墙中间留门（z 2..6）；南墙留门（x 14..18）；东墙整段
  // 北墙
  block(t, m.concrete, S.x0, 0, S.z0 - W, S.x1, H, S.z0);
  // 西墙（门洞 z[2,6]）
  block(t, m.concrete, S.x0, 0, S.z0 - W, S.x0 + W, H, 2);
  block(t, m.concrete, S.x0, 0, 6, S.x0 + W, H, S.z1);
  // 南墙（门洞 x[14,18]）
  block(t, m.concrete, S.x0, 0, S.z1, 14, H, S.z1 + W);
  block(t, m.concrete, 18, 0, S.z1, S.x1, H, S.z1 + W);
  // 东墙
  block(t, m.concrete, S.x1 - W, 0, S.z0, S.x1, H, S.z1);

  // 墙皮：上沿压顶 + 斑驳的暖色涂装（只在门洞两侧留一点，避免整墙一个色）
  t.slab(m.teal, S.x0, H - 0.34, S.z0 - W, S.x1, H, S.z0);
  t.slab(m.teal, S.x0, H - 0.34, S.z0, S.x1, H, S.z1);
  t.slab(m.teal, S.x0, H - 0.34, S.z0, S.x0 + W, H, S.z1);

  // 屋顶：整块 + 一处塌陷（x[18,22] z[6,10]）
  var roofY = H + 0.12;
  t.slab(m.roof, S.x0 - 0.3, H, S.z0 - 0.3, S.x1 + 0.3, roofY, 6);
  t.slab(m.roof, S.x0 - 0.3, H, 10, S.x1 + 0.3, roofY, S.z1 + 0.3);
  t.slab(m.roof, S.x0 - 0.3, H, 6, 18, roofY, 10);
  t.slab(m.roof, 22, H, 6, S.x1 + 0.3, roofY, 10);
  t.col(S.x0 - 0.3, H, S.z0 - 0.3, S.x1 + 0.3, roofY, 6, "concrete");
  t.col(S.x0 - 0.3, H, 10, S.x1 + 0.3, roofY, S.z1 + 0.3, "concrete");
  t.col(S.x0 - 0.3, H, 6, 18, roofY, 10, "concrete");
  t.col(22, H, 6, S.x1 + 0.3, roofY, 10, "concrete");
  // 屋顶积雪：按四块屋面板分别铺，塌陷口 x[18,22] z[6,10] 留空（露出椽子）
  var sx0 = S.x0 - 0.3;
  var sx1 = S.x1 + 0.3;
  var sz0 = S.z0 - 0.3;
  var sz1 = S.z1 + 0.3;
  var snY = roofY + 0.09;
  // 北板（z sz0..6）
  t.box(m.snow, sx1 - sx0, 0.18, 6 - sz0, (sx0 + sx1) / 2, snY, (sz0 + 6) / 2);
  // 南板（z 10..sz1）
  t.box(m.snow, sx1 - sx0, 0.18, sz1 - 10, (sx0 + sx1) / 2, snY, (10 + sz1) / 2);
  // 西片（x sx0..18，z 6..10）
  t.box(m.snow, 18 - sx0, 0.18, 4, (sx0 + 18) / 2, snY, 8);
  // 东片（x 22..sx1，z 6..10）
  t.box(m.snow, sx1 - 22, 0.18, 4, (22 + sx1) / 2, snY, 8);
  // 塌陷处的椽子（露出来）
  for (var i = 0; i < 5; i += 1) {
    t.rod(m.rust, [18 + i * 1.0, H + 0.22, 6], [18 + i * 1.0, H + 0.05, 10], 0.05);
  }
  t.box(m.roof, 3.6, 0.1, 0.9, 20, H + 0.45, 7.4, { r: [0, 0.1, 0.34] });
  t.box(m.snow, 3.0, 0.12, 1.2, 20, H + 0.62, 9.4, { r: [0, -0.18, -0.26] });

  // 墙脚雪堆：只贴北墙外侧、西墙北段、南墙西段 —— 门洞和箱堆前留出通路
  snowBerm(t, m, 17.0, -6.9, 17.0, 1.4, 1.9, 0.3);
  snowBerm(t, m, 7.7, -0.6, 1.4, 4.8, 1.8, 0.28);
  snowBerm(t, m, 10.3, 13.0, 4.2, 1.6, 1.7, 0.3);
  // 门口的两堆（从门口往里吹）
  t.box(m.snow, 2.0, 1.1, 3.6, 8.8, 0.55, 7.6, { r: [0, 0.06, 0] });
  t.box(m.snow, 1.6, 0.7, 2.4, 8.9, 0.35, 10.4, { r: [0, -0.1, 0] });

  // 门框（西门、南门）
  for (var d = 0; d < 2; d += 1) {
    var dz = d === 0 ? 4 : null;
    if (d === 0) {
      t.box(m.dark, 0.16, 2.5, 0.22, S.x0 + 0.02, 1.25, 2.05);
      t.box(m.dark, 0.16, 2.5, 0.22, S.x0 + 0.02, 1.25, 5.95);
      t.box(m.dark, 0.18, 0.18, 4.2, S.x0 + 0.02, 2.52, 4.0);
      t.box(m.hazard, 0.12, 0.24, 4.2, S.x0 - 0.02, 0.16, 4.0);
    }
  }
  t.box(m.dark, 0.2, 2.4, 0.22, 13.96, 1.2, S.z1 + 0.02);
  t.box(m.dark, 0.2, 2.4, 0.22, 18.04, 1.2, S.z1 + 0.02);
  t.box(m.dark, 4.2, 0.18, 0.2, 16, 2.42, S.z1 + 0.02);
  t.box(m.hazard, 4.0, 0.24, 0.12, 16, 0.16, S.z1 - 0.02);

  // 门板（半开，靠墙）
  t.box(m.roof, 1.7, 2.3, 0.12, 9.2, 1.2, 1.4, { r: [0, 0.7, 0] });

  // 供暖站（目标 B）
  buildHeatingPlant(t, m, devices, context);

  // 仓库内的货：桶、托盘、木箱、料箱、气瓶（只用真实注册过的 prop 名）
  t.place("barrel", 11.2, -4.4, 0.4, { seed: 401, color: "grey" }, 0.07);
  t.place("barrel", 12.2, -4.9, 1.2, { seed: 402, color: "grey" }, 0.07);
  t.place("barrel", 10.4, -4.6, 0.2, { seed: 403, color: "blue" }, 0.07);
  t.place("ibc_tote", 24.2, 10.4, 1.4, { seed: 404 }, 0.07);
  t.place("crate_wood", 10.0, 9.8, 0.3, { seed: 405 }, 0.07);
  t.place("crate_wood", 10.9, 10.2, 1.1, { seed: 406 }, 0.07);
  t.place("crate_stack", 13.6, 10.4, 0.6, { seed: 407 }, 0.07);
  t.place("ibc_tote", 14.8, 9.4, 0.2, { seed: 408 }, 0.07);
  t.place("pipe_stack", 22.4, -4.2, 0.1, { seed: 409 }, 0.07);
  t.place("gas_cylinders", 25.0, -4.6, 0.5, { seed: 410 }, 0.07);
  t.place("toolbox_cart", 15.2, -4.8, 2.4, { seed: 411 }, 0.07);
  t.place("pallet", 20.6, 10.6, 0.2, { seed: 412 }, 0.07);
  t.place("pallet_stack", 21.0, 10.5, 0.3, { seed: 413 }, 0.07);

  // 工作台 + 挂灯
  t.box(m.plank, 2.4, 0.1, 0.9, 14.4, 0.95, -3.6);
  t.box(m.plank, 0.08, 0.88, 0.8, 13.3, 0.51, -3.6);
  t.box(m.plank, 0.08, 0.88, 0.8, 15.5, 0.51, -3.6);
  t.rod(m.dark, [14.4, 5.32, -3.6], [14.4, 4.5, -3.6], 0.02);
  t.box(m.dark, 0.34, 0.16, 0.34, 14.4, 4.42, -3.6);

  // 内部油渍 / 脚印（脚印没有 decal，用 oil_stain 做"被踩脏的雪"）
  t.decal("oil_stain", 2.2, 12.4, 0.075, 3.2, "y+", 0.4);
  t.decal("oil_stain", 1.8, 18.6, 0.075, 8.4, "y+", -1.1);

  // 梁柱（室内可见的桁架）
  for (var c = 0; c < 4; c += 1) {
    var cx = 11 + c * 4.4;
    t.box(m.dark, 0.22, H, 0.22, cx, H / 2, -5.8);
    t.box(m.dark, 0.22, H, 0.22, cx, H / 2, 11.8);
  }
}

// 墙脚雪堆：三级递降，读作被风堆起来的雪
function snowBerm(t, m, x, z, w, d, h, thick) {
  t.box(m.snow, w, h, d, x, h / 2, z);
  t.box(m.snow, w * 0.8, h * 0.55, d * 0.92, x + thick, h * 0.62, z);
  t.box(m.snow, w * 0.6, h * 0.3, d * 0.8, x + thick * 1.9, h * 0.5, z);
  t.col(x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2, "snow");
}

// 供暖站：锅炉 + 烟囱 + 管路 + 控制台（目标 B）+ 暖光
function buildHeatingPlant(t, m, devices, context) {
  var hx = L.heat.x;
  var hz = L.heat.z;

  // 锅炉本体
  t.cyl(m.rust, 1.55, 3.1, 20.4, 1.55 + 0.07, 1.0, { seg: 16 });
  t.col(18.85, 0.07, -0.55, 21.95, 3.17, 2.55, "metal");
  // 顶部封头与雪
  t.cyl(m.dark, 1.6, 0.14, 20.4, 3.24, 1.0, { seg: 16 });
  t.box(m.snow, 2.6, 0.1, 2.0, 20.4, 3.34, 1.0);
  // 炉膛口 + 火光（自发光）
  t.box(m.dark, 0.9, 0.72, 0.16, 19.2, 0.55, 2.2, { r: [0, 0.34, 0] });
  var glow = new Mesh(new SphereGeometry(0.5, 14, 10), contextEmissive(context, 0xff7a2e, 2.6));
  glow.position.set(19.35, 0.55, 2.35);
  glow.scale.set(1.1, 0.7, 0.5);
  t.dynRoot.add(glow);

  // 烟囱：穿过屋顶
  t.cyl(m.dark, 0.5, 6.2, 22.4, 3.4, -2.6, { seg: 14 });
  t.cyl(m.rust, 0.56, 0.5, 22.4, 6.2, -2.6, { seg: 14 });
  t.box(m.snow, 1.1, 0.12, 1.1, 22.4, 6.5, -2.6);

  // 管路：锅炉 → 西墙 / 锅炉 → 东侧
  t.cyl(m.galv, 0.18, 4.6, 20.4, 2.5, -1.2, { axis: "x", seg: 10 });
  t.cyl(m.galv, 0.14, 3.0, 18.4, 1.1, 1.0, { axis: "z", seg: 10 });
  t.box(m.dark, 0.5, 0.5, 0.5, 20.4, 0.32, 1.9);
  // 阀门轮
  t.cyl(m.red, 0.22, 0.1, 19.6, 1.9, 1.4, { axis: "x", seg: 10 });

  // 控制台（交互点）
  var g = new Group();
  t.staticRoot.add(g);
  g.position.set(hx, 0.07, hz);
  g.rotation.y = -HALF_PI;
  t.box(m.galv, 1.25, 1.2, 0.62, 0, 0.6, 0, { parent: g });
  t.box(m.dark, 1.0, 0.52, 0.06, 0, 0.94, 0.34, { parent: g });
  // 三个压力表
  t.cyl(m.white, 0.11, 0.05, -0.34, 1.05, 0.1, { axis: "z", seg: 10, parent: g });
  t.cyl(m.white, 0.11, 0.05, 0, 1.05, 0.1, { axis: "z", seg: 10, parent: g });
  t.cyl(m.white, 0.11, 0.05, 0.34, 1.05, 0.1, { axis: "z", seg: 10, parent: g });
  // 拉杆
  t.box(m.red, 0.09, 0.42, 0.09, 0.44, 0.55, 0.36, { parent: g, r: [0.5, 0, 0] });
  t.box(m.hazard, 1.2, 0.1, 0.04, 0, 0.22, 0.34, { parent: g });
  t.box(m.snow, 1.3, 0.06, 0.68, 0, 1.23, 0, { parent: g });
  // 接地线
  t.rod(m.rubber, [0.6, 0.1, 0.2], [1.4, 0.05, 0.6], 0.02);

  var lamp = makeLamp(g, 0xff8a3c, [0, 1.36, 0.1], t);
  devices.push(wireDevice(g, lamp));

  // 控制台旁边的工具箱与灭火器（灭火器没有现成 prop，用圆柱现搭）
  t.place("toolbox_cart", hx - 0.9, hz + 1.2, 0.3, { seed: 421 }, 0.07);
  t.cyl(m.red, 0.13, 0.62, hx + 1.1, 0.38, hz - 1.3, { seg: 10 });
  t.cyl(m.dark, 0.08, 0.1, hx + 1.1, 0.74, hz - 1.3, { seg: 8 });
  t.col(hx + 0.95, 0.07, hz - 1.45, hx + 1.25, 0.72, hz - 1.15, "metal");
}

// 自发光材质：走 context.mats.emissive（真实材质 API），拿不到才退回 MeshBasic
function contextEmissive(context, color, mult) {
  var api = context && context.mats;
  if (api && typeof api.emissive === "function") {
    return api.emissive(color, mult);
  }
  return new MeshBasicMaterial({ color: color, toneMapped: false });
}

// ---------------------------------------------------------------------------
// 货仓区室外：箱堆 / 叉车残骸 / 发电机 / 散料
// ---------------------------------------------------------------------------
function buildDepotYard(t, m) {
  // 东侧箱堆：两组叠箱 + 一组单层（和地图一的双层矩阵不同，这里是"堆场边角"）
  // color 必须是 container 合法色名（red/blue/green/yellow/orange/white/grey/teal）
  t.place("container20", 22.4, -9.4, 0.16, { seed: 501, color: "teal", wear: 0.5 }, 0.04);
  t.place("container20", 22.4, -9.4, 0.16, { seed: 502, color: "white", wear: 0.55 }, 2.63);
  t.place("container20", 16.2, -9.6, -0.08, { seed: 503, color: "green", wear: 0.45 }, 0.04);
  t.place("container20", 20.0, 14.4, 0.02, { seed: 504, color: "blue", wear: 0.6 }, 0.04);
  t.place("container20", 20.0, 14.4, 0.02, { seed: 505, color: "orange", wear: 0.65 }, 2.63);
  t.place("container20", -1.2, 8.6, 0.12, { seed: 506, color: "grey", wear: 0.5 }, 0.04);

  // 叉车残骸：侧翻，货叉还挂着托盘
  var fk = t.place("forklift", 4.6, -8.6, 2.35, { seed: 510 }, 0, { noCol: true });
  fk.rotation.z = 0.92;
  fk.position.y = 0.72;
  t.col(2.6, 0, -10.0, 6.8, 1.35, -7.0, "metal");
  var fkPallet = t.place("pallet", 3.6, -10.2, 0.9, { seed: 511 }, 0.04, { noCol: true });
  if (fkPallet) fkPallet.rotation.x = 0.32;
  t.place("crate_wood", 5.4, -10.4, 1.3, { seed: 512 }, 0.04);

  // 发电机（带油渍）
  t.place("generator", 9.4, 14.2, -0.4, { seed: 520 }, 0.04);
  t.decal("leak_stain", 2.0, 8.2, 0.05, 13.6, "y+", 0.3);

  // 垃圾箱 / 轮胎 / 电缆盘 / 锥筒
  t.place("dumpster", 26.2, -2.4, 1.58, { seed: 521 }, 0.04);
  t.place("tire_stack", 1.2, -2.6, 0.2, { seed: 522 }, 0.04);
  t.place("tire_stack", 1.9, -3.1, 1.1, { seed: 523 }, 0.04);
  t.place("cable_reel", -3.4, 10.4, 0.3, { seed: 524 }, 0.035);
  t.place("traffic_cone", -5.2, 12.2, 0, { seed: 525 }, 0.035);
  t.place("traffic_cone", -2.6, 12.6, 0, { seed: 526 }, 0.035);
  t.place("barrel", 7.4, 3.2, 0.2, { seed: 527, color: "rust" }, 0.04);
  t.place("barrel", 7.9, 3.9, 1.3, { seed: 528, color: "rust" }, 0.04);

  // 南门外的斜坡台（卸货用的木坡）
  t.box(m.plank, 4.0, 0.08, 2.6, 16, 0.24, 14.2, { r: [0.12, 0, 0] });

  // 东侧靠海的挡墙（和地图一的 quay 栏杆不同：这里是混凝土雪障）
  for (var i = 0; i < 6; i += 1) {
    t.box(m.concreteDirty, 1.4, 1.5, 0.5, 27.6, 0.75, -6 + i * 3.2);
    t.box(m.snow, 1.5, 0.16, 0.6, 27.6, 1.58, -6 + i * 3.2);
  }
}

// ---------------------------------------------------------------------------
// 缆车塔（北）—— 2.6m 高地 / 雪坡 + 楼梯 / 塔楼 / 瞭望台 / 信号台
// ---------------------------------------------------------------------------
function buildHill(t, m) {
  var H = L.hill;

  // 台地：一整块 2.6m 高的岩土台，南面是断崖
  block(t, m.concrete, H.x0, 0, H.z0, H.x1, H.h, H.z1);
  t.slab(m.snow, H.x0, H.h, H.z0, H.x1, H.h + 0.06, H.z1);
  t.col(H.x0, H.h, H.z0, H.x1, H.h + 0.06, H.z1, "concrete");
  // 台地边缘的雪檐（悬出去一点）
  t.box(m.snow, H.x1 - H.x0 + 0.6, 0.22, 0.8, (H.x0 + H.x1) / 2, H.h + 0.06, H.z1 - 0.3);
  // 崖面上的雪挂
  for (var i = 0; i < 6; i += 1) {
    t.box(m.snow, 2.4, 0.9, 0.5, H.x0 + 1.4 + i * 2.3, H.h - 0.4, H.z1 + 0.12, {
      r: [0.22, 0, 0.05],
    });
  }

  // 雪坡：9 级台阶（x[1,8]，从 z=-4.2 升到 -12）
  var S = L.slope;
  var run = (S.z1 - S.z0) / S.steps;
  for (var s = 0; s < S.steps; s += 1) {
    var top = ((s + 1) * H.h) / S.steps;
    var zFront = S.z1 - s * run;
    var zBack = S.z1 - (s + 1) * run;
    t.box(m.snow, S.x1 - S.x0, top, run, (S.x0 + S.x1) / 2, top / 2, (zFront + zBack) / 2);
    t.col(S.x0, 0, zBack, S.x1, top, zFront, "concrete");
    // 前沿的一道薄雪檐，让台阶不显得像楼梯
    t.box(m.snow, S.x1 - S.x0 + 0.3, 0.08, 0.2, (S.x0 + S.x1) / 2, top + 0.03, zFront);
  }

  // 坡上的雪堆掩体（左右各一排，中间留 3m 通道）
  var mounds = [
    [2.3, -5.8, 1.8, 1.05, 2.2],
    [6.6, -6.2, 2.0, 1.15, 2.4],
    [2.4, -8.4, 1.9, 1.2, 2.4],
    [6.5, -8.9, 1.8, 1.1, 2.3],
    [2.2, -10.9, 1.7, 0.95, 2.1],
  ];
  for (var k = 0; k < mounds.length; k += 1) {
    var md = mounds[k];
    var y = 1.1;
    // 找到该 z 所在的台阶高度
    for (var s2 = 0; s2 < S.steps; s2 += 1) {
      var zF = S.z1 - s2 * run;
      if (md[1] <= zF && md[1] > zF - run) y = ((s2 + 1) * H.h) / S.steps;
    }
    t.box(m.snow, md[2], md[3], md[4], md[0], y + md[3] / 2 - 0.1, md[1], {
      r: [0, t.rnd(-0.3, 0.3), 0],
    });
    t.col(md[0] - md[2] / 2, y - 0.1, md[1] - md[4] / 2, md[0] + md[2] / 2, y + md[3], md[1] + md[4] / 2, "concrete");
  }

  // 铁楼梯（第二条路，x≈11.4）
  t.stairs(11.4, -5.4, HALF_PI, 0.05, { mat: "steel_galv" });
  // 楼梯顶 → 台地的走台（2.6 高）
  t.box(m.deck, 3.0, 0.1, 5.3, 11.4, 2.6, -9.35);
  t.col(9.9, 2.56, -12, 12.9, 2.66, -6.7, "metal");
  t.box(m.snow, 3.0, 0.05, 5.2, 11.4, 2.67, -9.35);
  // 走台支柱
  for (var c = 0; c < 3; c += 1) {
    t.box(m.dark, 0.18, 2.56, 0.18, 10.2, 1.28, -7.2 - c * 2.2);
    t.box(m.dark, 0.18, 2.56, 0.18, 12.6, 1.28, -7.2 - c * 2.2);
  }
  // 走台护栏（靠崖一侧）
  railLine(t, m.galv, 9.95, -6.8, 9.95, -12, 2.66, 0.9);
  // 楼梯顶的台阶过渡
  t.box(m.deck, 2.6, 0.08, 1.2, 11.4, 2.6, -6.2);

  // 台地上的杂物：补给箱、油桶、雪地履带痕（用油渍 decal 表现）
  t.place("crate_wood", -8.4, -18.4, 0.3, { seed: 601 }, 2.66);
  t.place("crate_wood", -8.9, -19.2, 1.2, { seed: 602 }, 2.66);
  t.place("barrel", -12.4, -20.2, 0.2, { seed: 603, color: "grey" }, 2.66);
  t.place("toolbox_cart", -4.2, -16.4, 2.1, { seed: 604 }, 2.66);
  t.place("pallet", 2.4, -14.2, 0.4, { seed: 605 }, 2.66);
  t.decal("oil_stain", 2.6, 1.2, 2.68, -14.6, "y+", 0.2);

  // 台地上的风力雪堆（几片，给一点遮挡）
  t.box(m.snow, 5.2, 0.9, 2.4, -12.6, 2.66 + 0.35, -22.4, { r: [0, 0.3, 0] });
  t.box(m.snow, 4.0, 0.7, 2.0, -2.4, 2.66 + 0.25, -27.2, { r: [0, -0.2, 0] });
  t.col(-15.2, 2.66, -23.6, -10, 3.51, -21.2, "concrete");
  t.col(-4.4, 2.66, -28.2, -0.4, 3.36, -26.2, "concrete");
}

// 缆车塔：四腿格构塔 + 5.2m 瞭望台（目标 C）+ 12.6m 塔顶 + 缆索 + 吊舱
function buildCableTower(t, m, devices) {
  var T = L.tower;
  var baseY = L.hill.h + 0.06;
  var topY = T.top;
  var legs = [
    [T.x - 3.0, T.z - 2.8],
    [T.x + 3.0, T.z - 2.8],
    [T.x - 3.0, T.z + 3.0],
    [T.x + 3.0, T.z + 3.0],
  ];
  for (var i = 0; i < legs.length; i += 1) {
    t.box(m.worn, 0.4, topY - baseY, 0.4, legs[i][0], (baseY + topY) / 2, legs[i][1]);
    // 基础
    t.box(m.concrete, 0.9, 0.5, 0.9, legs[i][0], baseY + 0.2, legs[i][1]);
    t.col(legs[i][0] - 0.28, baseY, legs[i][1] - 0.28, legs[i][0] + 0.28, topY, legs[i][1] + 0.28, "metal");
  }
  // 横撑 + 斜撑（三档）
  var ring = [3.2, 7.2, 11.4];
  for (var r = 0; r < ring.length; r += 1) {
    var y = baseY + ring[r];
    t.rod(m.galv, [T.x - 3, y, T.z - 2.8], [T.x + 3, y, T.z - 2.8], 0.05);
    t.rod(m.galv, [T.x - 3, y, T.z + 3], [T.x + 3, y, T.z + 3], 0.05);
    t.rod(m.galv, [T.x - 3, y, T.z - 2.8], [T.x - 3, y, T.z + 3], 0.05);
    t.rod(m.galv, [T.x + 3, y, T.z - 2.8], [T.x + 3, y, T.z + 3], 0.05);
    if (r > 0) {
      var yPrev = baseY + ring[r - 1];
      t.rod(m.galv, [T.x - 3, yPrev, T.z - 2.8], [T.x + 3, y, T.z - 2.8], 0.035);
      t.rod(m.galv, [T.x + 3, yPrev, T.z + 3], [T.x - 3, y, T.z + 3], 0.035);
    }
  }

  // 5.2m 瞭望台（T.deck）
  var deckY = T.deck;
  t.box(m.deck, 5.2, 0.12, 4.8, T.x, deckY - 0.06, T.z);
  t.col(T.x - 2.6, deckY - 0.12, T.z - 2.4, T.x + 2.6, deckY, T.z + 2.4, "metal");
  t.box(m.snow, 5.2, 0.05, 4.7, T.x, deckY + 0.02, T.z);
  // 台下托梁
  for (var b = 0; b < 4; b += 1) {
    t.box(m.dark, 5.0, 0.14, 0.16, T.x, deckY - 0.2, T.z - 2.2 + b * 1.45);
  }
  // 台面护栏（四周；南侧留 2m 上塔口，东侧也留 1 个口）
  railLine(t, m.galv, T.x - 2.55, T.z - 2.35, T.x + 2.55, T.z - 2.35, deckY, 0.95);
  railLine(t, m.galv, T.x - 2.55, T.z + 2.35, 5.2, T.z + 2.35, deckY, 0.95);
  railLine(t, m.galv, 7.2, T.z + 2.35, T.x + 2.55, T.z + 2.35, deckY, 0.95);
  railLine(t, m.galv, T.x - 2.55, T.z - 2.35, T.x - 2.55, T.z + 2.35, deckY, 0.95);
  railLine(t, m.galv, T.x + 2.55, T.z - 2.35, T.x + 2.55, T.z - 1.2, deckY, 0.95);
  railLine(t, m.galv, T.x + 2.55, T.z + 1.2, T.x + 2.55, T.z + 2.35, deckY, 0.95);

  // 上瞭望台的第二段铁楼梯：从台地（2.66）沿 -z 爬 2.6m，
  // 顶台落在 deck 南缘 z=-21.6 外侧，正好从护栏缺口进台面。
  t.stairs(6.2, -20.1, HALF_PI, L.hill.h + 0.06, { mat: "steel_galv" });

  // 瞭望台小屋（北侧）
  t.box(m.timber, 2.6, 2.1, 2.2, T.x + 1.4, deckY + 1.05, T.z - 1.3);
  t.box(m.snow, 2.8, 0.22, 2.4, T.x + 1.4, deckY + 2.2, T.z - 1.3);
  t.box(m.glass, 2.2, 0.6, 0.05, T.x + 1.4, deckY + 1.5, T.z - 2.41);
  t.col(T.x + 0.1, deckY, T.z - 2.5, T.x + 2.7, deckY + 2.3, T.z - 0.2, "wood");

  // 塔顶平台 + 天线
  t.box(m.deck, 2.8, 0.12, 2.8, T.x, topY + 0.06, T.z);
  t.cyl(m.galv, 0.6, 0.2, T.x + 1.6, topY + 0.16, T.z - 0.6, { seg: 12 });
  t.cyl(m.dark, 0.14, 4.2, T.x, topY + 2.2, T.z, { seg: 8 });
  t.rod(m.galv, [T.x - 1.4, topY + 3.2, T.z], [T.x + 1.4, topY + 3.2, T.z], 0.03);
  t.rod(m.galv, [T.x + 0.8, topY + 0.3, T.z - 0.8], [T.x - 0.8, topY + 2.4, T.z + 0.8], 0.03);
  var topLamp = new Mesh(new SphereGeometry(0.14, 10, 8), new MeshBasicMaterial({ color: 0xff3a2a }));
  topLamp.position.set(T.x, topY + 4.34, T.z);
  t.dynRoot.add(topLamp);

  // 缆索：塔顶 → 货仓屋顶的小塔架，中间吊一个轿厢
  var pylonTop = [24, 6.7, 6];
  t.box(m.galv, 0.6, 1.2, 0.6, 24, 5.9, 6);
  t.rod(m.galv, [24, 5.5, 6], [24, 6.9, 6], 0.07);
  t.rod(m.galv, [T.x, topY + 0.1, T.z], pylonTop, 0.035);
  t.rod(m.galv, [T.x, topY + 0.1, T.z + 1.0], [24, 6.7, 7.0], 0.035);
  // 轿厢：挂在缆索 40% 处（缆在该处高度约 10.38m），吊杆顶端顶在缆上
  var gond = new Group();
  t.staticRoot.add(gond);
  gond.position.set(13.8, 8.4, -12.0);
  t.box(m.white, 1.6, 1.9, 2.2, 0, 0, 0, { parent: gond });
  t.box(m.dark, 1.66, 0.22, 2.26, 0, 0.55, 0, { parent: gond });
  t.box(m.glass, 1.5, 0.7, 0.05, 0, 0.35, 1.12, { parent: gond });
  t.box(m.hazard, 1.56, 0.3, 0.06, 0, -0.7, 1.14, { parent: gond });
  t.rod(m.dark, [0, 0.95, 0], [0, 1.98, 0], 0.04, { parent: gond });

  // 目标 C：信号台（瞭望台上的机柜 + 天线转盘）
  buildSignalPost(t, m, devices);
}

// 目标 C：信号台
function buildSignalPost(t, m, devices) {
  var g = new Group();
  t.staticRoot.add(g);
  g.position.set(L.signal.x, L.tower.deck + 0.02, L.signal.z);
  g.rotation.y = 0;

  t.box(m.dark, 1.15, 1.05, 0.75, 0, 0.52, 0, { parent: g });
  t.box(m.galv, 1.05, 0.08, 0.68, 0, 1.09, 0, { parent: g });
  t.box(m.glass, 0.7, 0.34, 0.05, 0, 0.7, 0.38, { parent: g });
  // 面板：三个旋钮 + 一个红色手柄
  t.cyl(m.white, 0.075, 0.05, -0.28, 0.88, 0.4, { axis: "z", seg: 10, parent: g });
  t.cyl(m.white, 0.075, 0.05, -0.02, 0.88, 0.4, { axis: "z", seg: 10, parent: g });
  t.cyl(m.red, 0.06, 0.05, 0.24, 0.88, 0.4, { axis: "z", seg: 10, parent: g });
  t.box(m.hazard, 1.0, 0.08, 0.04, 0, 0.2, 0.38, { parent: g });
  // 天线座
  t.cyl(m.galv, 0.18, 0.3, 0.3, 1.28, -0.1, { seg: 10, parent: g });
  t.rod(m.galv, [0.3, 1.4, -0.1], [0.3, 3.4, -0.1], 0.035, { parent: g });
  t.box(m.white, 0.5, 0.14, 0.1, 0.3, 3.3, -0.1, { parent: g, r: [0, 0.4, 0] });
  // 折叠椅与小桌（值班痕迹）
  t.box(m.plank, 0.5, 0.06, 0.5, -0.9, 0.5, 0.5, { parent: g });
  t.box(m.dark, 0.06, 0.5, 0.06, -0.9, 0.25, 0.5, { parent: g });

  var lamp = makeLamp(g, 0xff6a3a, [0.3, 3.5, -0.1], t);
  devices.push(wireDevice(g, lamp));

  // 台面上的雪堆（角落）
  t.box(m.snow, 1.2, 0.5, 1.1, L.signal.x - 1.8, L.tower.deck + 0.27, L.signal.z - 1.6, {
    r: [0, 0.4, 0],
  });
}

// ---------------------------------------------------------------------------
// 破冰船（南）—— 改版 KITTIWAKE：船头压碎冰面，撤离点在主甲板
// ---------------------------------------------------------------------------
function buildShip(t, m) {
  var S = L.ship;
  var deck = S.deck;
  var bow = S.bow;

  // 三段箱体（艏段低、中段、主段），舷侧做红漆水线
  hullBlock(t, m, -3, 20.4, 7, 22.0, bow);
  hullBlock(t, m, -5, 22.0, 9, 24.0, deck);
  hullBlock(t, m, -6, 24.0, 10, 31.0, deck);

  // 甲板铺板
  t.box(m.deck, S.x1 - S.x0, 0.06, 7, (S.x0 + S.x1) / 2, deck + 0.03, 27.5);
  t.box(m.deck, 14, 0.06, 2, 2, deck + 0.03, 23.0);
  t.box(m.deck, 10, 0.06, 1.6, 2, bow + 0.03, 21.2);
  // 甲板积雪（薄，被踩出路径）
  t.box(m.snow, 12.4, 0.03, 5.4, 2, deck + 0.075, 27.3);
  t.box(m.snow, 6.0, 0.03, 1.0, 2, deck + 0.075, 23.2);
  // 艏甲板(2.66) → 主甲板(3.04) 之间有 0.38 的单级落差，补一块 0.19 的过渡台板，
  // 视觉上是一道甲板压条，脚感从"一整级"拆成两级
  t.box(m.deck, 6.6, 0.19, 0.5, 2, bow + 0.095, 22.15);
  t.col(-1.3, bow, 21.9, 5.3, bow + 0.19, 22.4, "metal");

  // 船体舷墙（沿甲板两侧，前段破口）
  railLine(t, m.hullRed, S.x0 + 0.35, 26, S.x0 + 0.35, 30.4, deck + 0.06, 0.9);
  railLine(t, m.hullRed, S.x1 - 0.35, 26, S.x1 - 0.35, 30.4, deck + 0.06, 0.9);
  railLine(t, m.hullRed, S.x0 + 0.35, 24, S.x0 + 0.35, 26, deck + 0.06, 0.9);
  railLine(t, m.hullRed, S.x1 - 0.35, 24, S.x1 - 0.35, 26, deck + 0.06, 0.9);

  // 上层建筑
  t.box(m.white, 5.0, 3.3, 3.2, 3.4, deck + 1.65, 28.7);
  t.col(0.9, deck, 27.1, 5.9, deck + 3.3, 30.3, "concrete");
  t.box(m.snow, 5.2, 0.16, 3.4, 3.4, deck + 3.38, 28.7);
  // 驾驶台窗带
  t.box(m.glass, 4.6, 0.75, 0.06, 3.4, deck + 2.55, 27.06);
  t.box(m.glass, 4.6, 0.75, 0.06, 3.4, deck + 2.55, 30.34);
  t.box(m.glass, 0.06, 0.75, 3.0, 0.88, deck + 2.55, 28.7);
  t.box(m.glass, 0.06, 0.75, 3.0, 5.92, deck + 2.55, 28.7);
  // 舷窗
  for (var i = 0; i < 3; i += 1) {
    t.cyl(m.glass, 0.22, 0.06, 1.6, deck + 1.3, 27.04, { axis: "z", seg: 10 });
    t.cyl(m.glass, 0.22, 0.06, 4.6, deck + 1.3, 27.04, { axis: "z", seg: 10 });
  }
  // 烟囱
  t.cyl(m.hullRed, 0.82, 3.6, 7.4, deck + 1.8, 28.4, { seg: 14 });
  t.cyl(m.dark, 0.86, 0.28, 7.4, deck + 3.7, 28.4, { seg: 14 });
  t.box(m.snow, 1.5, 0.12, 1.5, 7.4, deck + 3.86, 28.4);
  // 桅杆与天线
  t.rod(m.galv, [4.6, deck + 3.3, 26.4], [4.6, deck + 7.6, 26.4], 0.06);
  t.rod(m.galv, [2.0, deck + 3.3, 26.6], [2.0, deck + 6.2, 26.6], 0.045);
  t.rod(m.hullRed, [4.6, deck + 6.4, 26.4], [3.4, deck + 6.4, 26.4], 0.03);

  // 船名（用贴片做"KITTIWAKE II"的色块，不依赖文字）
  t.box(m.red, 2.6, 0.34, 0.03, 2.0, deck + 0.2, 30.02);
  t.box(m.white, 2.2, 0.1, 0.04, 2.0, deck + 0.2, 29.99);

  // 舷梯（从冰面到艏甲板）：底在 z=17.4，顶台正好收在艏段前沿 z=20.4
  t.stairs(2, 18.9, -HALF_PI, 0.05, { mat: "steel_galv" });
  // 舷梯两侧扶手（楼梯宽 0.9 → x 1.55..2.45）
  t.rod(m.galv, [1.52, 0.2, 17.35], [1.52, 2.62, 20.35], 0.035);
  t.rod(m.galv, [2.48, 0.2, 17.35], [2.48, 2.62, 20.35], 0.035);

  // 甲板货：桶、缆绳、绞盘
  t.place("barrel", -4.6, 27.6, 0.2, { seed: 701, color: "grey" }, deck + 0.06);
  t.place("barrel", -4.2, 28.4, 1.1, { seed: 702, color: "rust" }, deck + 0.06);
  t.place("pallet", 8.4, 26.2, 1.4, { seed: 703 }, deck + 0.06);
  t.cyl(m.dark, 0.6, 0.5, -4.4, deck + 0.31, 25.4, { seg: 12 });
  t.rod(m.rope, [-4.4, deck + 0.4, 25.4], [-2.8, deck + 0.2, 26.2], 0.07);

  // 船头压碎的冰板（碎块带，从艏部散到南侧雪地）
  var iceDebris = [
    [-3.4, 19.2, 2.6, 0.7, 0.5],
    [0.6, 18.6, 2.0, 1.0, -0.3],
    [4.2, 19.4, 2.4, 0.6, 0.9],
    [7.2, 18.9, 1.8, 0.5, -0.8],
    [-1.6, 20.0, 1.6, 0.3, 0.4],
    [2.6, 19.8, 1.4, 0.4, 1.2],
    [-6.2, 20.6, 2.2, 0.5, 0.2],
    [9.8, 20.4, 1.8, 0.4, -0.6],
    [-4.8, 18.2, 1.9, 0.35, 0.7],
    [6.0, 17.6, 1.6, 0.3, 0.3],
  ];
  for (var d = 0; d < iceDebris.length; d += 1) {
    var b = iceDebris[d];
    t.box(m.iceSheen, b[2], b[3], b[4], b[0], 0.05 + b[3] / 2, b[1], {
      r: [0.05, b[4] * 0.9, 0],
    });
  }
  // 舷侧的冰刮痕（用 hazard 贴片做极窄的一排，读作被冰磨出的刮痕）
  t.box(m.iceRim, 0.12, 0.9, 6.4, S.x0 - 0.02, deck - 0.6, 27.2);
  t.box(m.iceRim, 0.12, 0.9, 6.4, S.x1 + 0.02, deck - 0.6, 27.2);
}

// 一段船体：底漆 + 红水线 + 上舷，一次生成碰撞
function hullBlock(t, m, x0, z0, x1, z1, h) {
  var cx = (x0 + x1) / 2;
  var cz = (z0 + z1) / 2;
  var w = x1 - x0;
  var d = z1 - z0;
  t.slab(m.hull, x0, 0, z0, x1, h * 0.62, z1);
  t.slab(m.hullRed, x0, h * 0.62, z0, x1, h * 0.74, z1);
  t.slab(m.hull, x0, h * 0.74, z0, x1, h, z1);
  t.col(x0, 0, z0, x1, h, z1, "metal");
  // 甲板边缘的白色围板
  t.box(m.white, w, 0.05, 0.05, cx, h + 0.02, z0 + 0.02);
}

// ---------------------------------------------------------------------------
// 南侧开阔地（所有区 ↔ 破冰船）
// ---------------------------------------------------------------------------
function buildSouthField(t, m) {
  // 反光标杆：唯一的路标，暴雪里只能看见顶端那一截橙色
  var poles = [
    [-4.4, 16.4],
    [1.6, 16.6],
    [7.4, 16.2],
    [13.4, 16.8],
    [19.2, 16.4],
    [24.4, 18.2],
    [-1.2, 19.6],
    [5.2, 19.8],
  ];
  for (var i = 0; i < poles.length; i += 1) {
    var p = poles[i];
    t.cyl(m.galv, 0.055, 1.9, p[0], 0.95, p[1], { seg: 6 });
    t.box(m.yellow, 0.1, 0.28, 0.1, p[0], 1.96, p[1]);
    t.box(m.red, 0.11, 0.06, 0.11, p[0], 2.12, p[1]);
  }

  // 开阔地上的雪堆掩体（低矮、稀疏 —— 走过去要绕）
  var drift = [
    [-3.2, 18.2, 4.6, 0.75, 2.6, 0.3],
    [10.4, 18.4, 3.8, 0.65, 2.2, -0.2],
    [17.6, 18.6, 4.2, 0.7, 2.4, 0.4],
    [23.8, 19.4, 3.4, 0.6, 2.0, -0.35],
    [12.4, 15.4, 3.2, 0.55, 1.9, 0.15],
  ];
  for (var k = 0; k < drift.length; k += 1) {
    var g = drift[k];
    t.box(m.snow, g[2], g[3], g[4], g[0], g[3] / 2, g[1], { r: [0, g[5], 0] });
    t.col(g[0] - g[2] / 2, 0, g[1] - g[4] / 2, g[0] + g[2] / 2, g[3], g[1] + g[4] / 2, "concrete");
  }

  // 被雪埋住的旧推车 / 木箱（给"这条路以前有人走"的暗示）
  t.place("toolbox_cart", 13.6, 20.2, 0.9, { seed: 801 }, 0.05);
  t.place("crate_wood", 9.2, 19.6, 0.2, { seed: 802 }, 0.05);
  t.place("crate_wood", 20.4, 20.4, 1.3, { seed: 803 }, 0.05);

  // 撤离点的甲板标记：一圈黄色方框 + 探照灯
  var ex = L.extraction;
  t.decal("caution_stripes", 3.0, ex.x, ex.y + 0.14, ex.z, "y+", 0);
  arrow(t, "z+", 1.4, ex.x, ex.y + 0.15, ex.z - 1.8);
}

// ---------------------------------------------------------------------------
// 导引贴片
// ---------------------------------------------------------------------------
function buildGuide(t, m, context) {
  arrow(t, "x+", 1.4, -18.6, 0.075, 1.6);
  arrow(t, "x+", 1.4, -12.8, 0.075, 1.6);
  arrow(t, "x+", 1.5, 6.2, 0.075, 4.0);
  arrow(t, "x+", 1.5, 12.4, 0.075, 4.0);
  arrow(t, "x+", 1.5, 22.4, 0.075, 4.0);
  arrow(t, "z-", 1.5, 4.5, 0.075, -2.8);
  arrow(t, "z-", 1.4, 4.5, 2.68, -10.6);
  arrow(t, "z-", 1.4, 11.4, 0.075, -3.0);
  arrow(t, "z-", 1.3, 11.4, 2.68, -7.4);
  arrow(t, "z-", 1.4, 11.4, 2.68, -18.4);
  arrow(t, "z+", 1.6, 2.0, 0.075, 15.2);
  arrow(t, "z+", 1.6, 2.0, 0.075, 18.2);
  // 危险提示：冰缝两端的斜纹
  t.decal("caution_stripes", 2.6, -12.4, 0.078, 2.4, "y+", 0);
  t.decal("caution_stripes", 2.6, -7.6, 0.078, 2.4, "y+", 0);
  t.decal("caution_stripes", 2.4, -12.4, 0.078, 6.4, "y+", 0);
  t.decal("caution_stripes", 2.4, -7.6, 0.078, 6.4, "y+", 0);
  // 仓库内的指示
  t.decal("arrow", 1.3, 10.2, 0.078, 7.4, "y+", DIR_ROT["z-"]);
  t.decal("arrow", 1.3, 18.4, 0.078, 11.0, "y+", DIR_ROT["z+"]);
  t.decal("arrow", 1.3, 3.0, 0.075, -13.4, "y+", DIR_ROT["z-"]);
}

// ---------------------------------------------------------------------------
// 灯光
// ---------------------------------------------------------------------------
function makeLight(root, color, intensity, distance, x, y, z, scale) {
  var l = new PointLight(color, intensity, distance, 2);
  l.position.set(x, y, z);
  l.userData.baseIntensity = intensity;
  l.intensity = intensity * (scale === undefined ? 1 : scale);
  root.add(l);
  return l;
}

function buildLights(levelRoot) {
  var lamps = [];
  var heat = [];
  // 仓库：两盏冷白工作灯（随 lampOn 亮灭）
  lamps.push(makeLight(levelRoot, 0xcdd9e4, 26, 16, 12.4, 4.5, 2.0));
  lamps.push(makeLight(levelRoot, 0xcdd9e4, 24, 15, 21.4, 4.5, 8.4));
  // 供暖站：两台暖光（热源本身要一直看得见，所以不接 lampOn）
  heat.push(makeLight(levelRoot, 0xff9a54, 14, 9, 20.4, 1.4, 1.0, 0.42));
  heat.push(makeLight(levelRoot, 0xff6a34, 8, 7, 19.4, 0.32, 2.4, 0.36));
  // 塔顶红灯（只在暴雪里闪）
  heat.push(makeLight(levelRoot, 0xff3a24, 6, 8, L.tower.x, L.tower.top + 4.3, L.tower.z, 0.4));
  return { lamps: lamps, heat: heat };
}

// ---------------------------------------------------------------------------
// 设备（目标台）—— 灯 + 状态机
// ---------------------------------------------------------------------------
function makeLamp(g, color, pos) {
  var mat = new MeshBasicMaterial({ color: color, toneMapped: false });
  var core = new Mesh(new SphereGeometry(0.105, 10, 8), mat);
  core.position.set(pos[0], pos[1], pos[2]);
  g.add(core);
  var haloMat = new MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.18,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  var halo = new Mesh(new SphereGeometry(0.38, 10, 8), haloMat);
  halo.position.copy(core.position);
  g.add(halo);
  // 灯罩（挡住往上的光，读起来像信号灯）
  var shade = new Mesh(new SphereGeometry(0.19, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), new MeshBasicMaterial({ color: 0x11181d }));
  shade.position.set(pos[0], pos[1] + 0.14, pos[2]);
  g.add(shade);
  return {
    mat: mat,
    haloMat: haloMat,
    halo: halo,
    core: core,
    color: color,
    state: "live",
    phase: g.userData.phase || 0,
  };
}

function wireDevice(g, lamp) {
  g.userData.state = "live";
  g.userData.lamp = lamp;
  g.userData.beacon = [0, lamp.core.position.y, 0];
  g.userData.interact = [0, 1.0, 0.9];
  g.userData.setState = function (v) {
    if (v !== "live" && v !== "cutting" && v !== "cut") return;
    if (v === g.userData.state) return;
    g.userData.state = v;
    lamp.state = v;
    lamp.halo.visible = v !== "cut";
  };
  return g;
}

var LAMP_GREEN = 0x5fe08c;

function updateLamp(lamp, dt, clock) {
  lamp.phase += dt * (lamp.state === "cutting" ? 11 : 1.5);
  if (lamp.state === "cut") {
    lamp.mat.color.setHex(LAMP_GREEN);
    lamp.haloMat.color.setHex(LAMP_GREEN);
    lamp.halo.scale.setScalar(1.45);
    lamp.halo.visible = false;
    return;
  }
  var k = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(lamp.phase));
  lamp.mat.color.setHex(lamp.color).multiplyScalar(k);
  lamp.haloMat.color.setHex(lamp.color).multiplyScalar(k);
  lamp.halo.scale.setScalar(0.85 + 0.5 * k);
  lamp.halo.visible = true;
}

// ---------------------------------------------------------------------------
// 关卡
// ---------------------------------------------------------------------------
function createTidegateLevel(context) {
  var levelRoot = new Group();
  levelRoot.name = "level";
  context.scene.add(levelRoot);

  var t = ob(context);
  var mats = buildMaterials(context);
  var devices = [];

  buildIceSheet(t, mats);
  buildLead(t, mats);
  buildBridge(t, mats);
  buildWarehouse(t, mats, devices, context);
  buildDepotYard(t, mats);
  buildHill(t, mats);
  buildCableTower(t, mats, devices);
  buildShip(t, mats);
  buildSouthField(t, mats);
  buildGuide(t, mats, context);

  // 设备挂到动态根（不参与静态合并，因为要呼吸）
  for (var i = 0; i < devices.length; i += 1) t.dynRoot.attach(devices[i]);
  // wireDevice 已把 lamp 写进 userData.lamp，这里只挂呼吸驱动
  devices.forEach(function (g) {
    t.updaters.push(function (dt) {
      var lamp = g.userData.lamp;
      if (lamp) updateLamp(lamp, dt);
    });
  });

  // 静态合并：与 level.js 同写法 —— 只把合并后的组挂进关卡根，
  // 原 staticRoot 不再入场景（否则可合并件会被画两遍），
  // noMerge / Skinned / Instanced / 多材质件由 batchStaticMeshes 原样搬进合并组。
  var merged = batchStaticMeshes(t.staticRoot);
  merged.name = "level-merged";
  levelRoot.add(merged);
  levelRoot.add(t.dynRoot);

  // ---- 灯光 ----
  var lights = buildLights(levelRoot);
  // 与 level.js 同语义：on 是布尔门，intensity 是 0..1 档位。
  function setLights(on, intensity) {
    var k = Math.max(0, Math.min(1, +intensity || 0));
    var lit = !!on && k > 0.05;
    lights.lamps.forEach(function (l) {
      l.intensity = lit ? (l.userData.baseIntensity || 1) * k : 0;
    });
  }

  // ---- 冰缝救援 ----
  var hazardClock = 0;
  function updateHazards(dt) {
    hazardClock = Math.max(0, hazardClock - dt);
    var p = context.player;
    if (!p || !p.pos || hazardClock > 0) return;
    if (p.alive === false) return;
    if (typeof p.health === "number" && p.health <= 0) return;
    var x = p.pos.x;
    var z = p.pos.z;
    if (x < L.lead.x0 + 0.2 || x > L.lead.x1 - 0.2) return;
    if (z < L.lead.z0 || z > L.lead.z1) return;
    if (p.pos.y > 0.3) return;
    var safe = x < (L.lead.x0 + L.lead.x1) / 2 ? SAFE_WEST : SAFE_EAST;
    p.pos.copy(safe);
    if (p.vel) p.vel.set(0, 0, 0);
    if (p.lastSafe) p.lastSafe.copy(safe);
    if (typeof p.addShake === "function") p.addShake(0.55);
    if (typeof p.damage === "function") p.damage(12);
    if (context.events && typeof context.events.emit === "function") {
      context.events.emit("player:rescued");
    }
    hazardClock = 1.4;
  }

  // ---- 更新 ----
  var clock = 0;
  function update(dt) {
    clock += dt;
    for (var u = 0; u < t.updaters.length; u += 1) t.updaters[u](dt, clock);
    updateHazards(dt);
  }

  // ---- 出生点与目标 ----
  var playerStart = {
    pos: new Vector3(-33.4, L.ice.y + 0.01, 16.2),
    yaw: -HALF_PI,
  };

  var beaconObj = findDevice(devices, L.beacon.x, L.beacon.z);
  var heatObj = findDevice(devices, L.heat.x, L.heat.z);
  var signalObj = findDevice(devices, L.signal.x, L.signal.z);

  // id 末位字符决定 HUD 短号（flow 用 /([a-z0-9])$/ 推导），所以统一 _a/_b/_c
  var objectives = [
    {
      id: "ice_beacon_a",
      label: "Beacon \u2014 Ice Quay",
      short: "A",
      zone: "icequay",
      pos: new Vector3(L.beacon.x + 1.7, L.ice.y, L.beacon.z),
      object: beaconObj,
      hint: "Restart the lamp on the frozen harbour",
    },
    {
      id: "heat_plant_b",
      label: "Heat Plant \u2014 Depot",
      short: "B",
      zone: "depot",
      pos: new Vector3(L.heat.x, 0.07, L.heat.z),
      object: heatObj,
      hint: "Restart the boiler, bring the yard back online",
    },
    {
      id: "signal_post_c",
      label: "Signal Post \u2014 Cable Hill",
      short: "C",
      zone: "hill",
      pos: new Vector3(L.signal.x, L.tower.deck + 0.02, L.signal.z),
      object: signalObj,
      hint: "Send the distress call from the lookout",
    },
  ];

  var extraction = {
    name: "Icebreaker Deck",
    pos: new Vector3(L.extraction.x, L.extraction.y, L.extraction.z),
    radius: L.extraction.r,
  };

  // ---- 敌人点 / 掩体 ----
  var spawns = buildSpawns();
  var covers = buildCovers();

  // zones 用二维数组（和 level.js 契约一致：min/max 是 [x,z]，不是 Vector3）
  var zones = [
    { name: "icequay", min: [L.ice.x0, L.ice.z0], max: [L.ice.x1, L.ice.z1] },
    { name: "lead", min: [L.lead.x0, L.lead.z0], max: [L.lead.x1, L.lead.z1] },
    { name: "depot", min: [L.depot.x0, L.depot.z0], max: [L.depot.x1, L.depot.z1] },
    { name: "hill", min: [L.hill.x0, L.hill.z0], max: [L.hill.x1, L.hill.z1] },
    { name: "ship", min: [-7, 16], max: [26, 30] },
  ];

  var interiorBoxes = [
    {
      min: new Vector3(L.shed.x0, 0.07, L.shed.z0),
      max: new Vector3(L.shed.x1, L.shed.h, L.shed.z1),
    },
  ];

  var skylights = [
    { x: 11.4, y: 5.52, z: -2.0, w: 3.0, d: 3.0 },
    { x: 16.2, y: 5.52, z: 8.2, w: 3.0, d: 3.0 },
    { x: 23.0, y: 5.52, z: 2.0, w: 3.4, d: 3.4 },
  ];

  // cinematicPath 必须是纯数组 pos/look（flow 里 new Vector3(...Y.pos) 展开的是数组）
  var cinematicPath = [
    { pos: [-36.4, 2.6, 22.4], look: [-20.8, 3.4, 9] },
    { pos: [-30.2, 1.4, 12.0], look: [-21, 1.2, 4] },
    { pos: [-17.2, 1.6, 4.4], look: [-8, 0.8, 4.4] },
    { pos: [-1.0, 2.2, 4.0], look: [17.6, 1.4, 3.2] },
    { pos: [12.6, 2.4, -2.0], look: [19, 3.6, -3] },
    { pos: [7.0, 4.4, -12.4], look: [7, 7.0, -24] },
    { pos: [5.0, 8.0, -20.6], look: [2, 10.4, -6] },
    { pos: [2.8, 5.0, 16.4], look: [2, 2.6, 24] },
  ];

  // 与 level.js 同形状：{stairsFoot, roof} 两个 Vector3
  var vantage = {
    stairsFoot: new Vector3(11.4, 0.05, -3.9),
    roof: new Vector3(L.tower.x, L.tower.deck, L.tower.z),
  };

  // stats 是对象（不是函数），口径按 level.js
  var placedList = t.placed;
  var stats = {
    labelsAtlased: 0,
    containers: placedList.filter(function (p) {
      return String(p.name).indexOf("container") === 0;
    }).length,
    props: placedList.length,
    tris: countTris(levelRoot),
    meshes: countMeshes(levelRoot),
  };

  function groundSurfaceAt(x, z) {
    if (x >= L.bridge.x0 && x <= L.bridge.x1 && z >= L.bridge.z0 && z <= L.bridge.z1) return "metal";
    if (x >= L.ship.x0 && x <= L.ship.x1 && z >= L.ship.z0 - 0.2 && z <= L.ship.z1) return "metal";
    return "concrete";
  }

  var hazards = [
    {
      name: "lead",
      x0: L.lead.x0,
      x1: L.lead.x1,
      z0: L.lead.z0,
      z1: L.lead.z1,
      yMax: 0.3,
      damage: 12,
      cooldown: 1.4,
      safe: [SAFE_WEST.clone(), SAFE_EAST.clone()],
    },
  ];

  // ---- 导航自检：地面出生点 / 掩体点必须落在可走格 ----
  // 写在构建末尾（此时所有 collider 已进物理），失败只警告坐标，不影响加载。
  (function auditNav() {
    var nav = context.physics && context.physics.nav;
    if (!nav || typeof nav.isWalkable !== "function") return;
    var bad = [];
    spawns.forEach(function (s) {
      if (s.type !== "ground") return;
      if (!nav.isWalkable(s.pos.x, s.pos.z)) bad.push("spawn(" + s.pos.x + "," + s.pos.z + ")");
    });
    covers.forEach(function (c) {
      if (!nav.isWalkable(c.x, c.z)) bad.push("cover(" + c.x + "," + c.z + ")");
    });
    if (bad.length) {
      console.warn("[tidegate] " + bad.length + " 个地面点不可走: " + bad.join(" | "));
    }
  })();

  return {
    root: levelRoot,
    playerStart: playerStart,
    objectives: objectives,
    extraction: extraction,
    enemySpawns: spawns,
    zones: zones,
    interiorBoxes: interiorBoxes,
    cinematicPath: cinematicPath,
    coverPoints: covers,
    skylights: skylights,
    shedLights: lights.lamps,
    heatLights: lights.heat,
    vantage: vantage,
    hazards: hazards,
    stats: stats,
    placed: placedList,
    groundSurfaceAt: groundSurfaceAt,
    setLights: setLights,
    update: update,
  };
}

function findDevice(devices, x, z) {
  for (var i = 0; i < devices.length; i += 1) {
    var g = devices[i];
    if (Math.abs(g.position.x - x) < 2.2 && Math.abs(g.position.z - z) < 2.2) return g;
  }
  return devices[0];
}

// ---------------------------------------------------------------------------
// 敌人生成点（地面只放 nav 走得到的位置；空中不限）
// ---------------------------------------------------------------------------
function buildSpawns() {
  var g = function (x, z, zone) {
    return { pos: new Vector3(x, 0.06, z), zone: zone, type: "ground" };
  };
  var a = function (x, y, z, zone) {
    return { pos: new Vector3(x, y, z), zone: zone, type: "air" };
  };
  return [
    // 冰面
    g(-35.2, -2.4, "icequay"),
    g(-37.4, 8.4, "icequay"),
    g(-30.6, -7.4, "icequay"),
    g(-24.8, 0.6, "icequay"),
    g(-27.2, 18.4, "icequay"),
    g(-19.4, 22.6, "icequay"),
    g(-16.2, 8.2, "icequay"),
    g(-30.2, -8.4, "icequay"),
    g(-22.4, 0.6, "icequay"),
    g(-36.6, 27.4, "icequay"),
    // 货仓区（室外）
    g(-4.2, 8.2, "depot"),
    g(-4.6, -1.4, "depot"),
    g(1.2, 9.6, "depot"),
    g(5.4, 0.6, "depot"),
    g(3.4, -2.4, "depot"),
    g(27.2, -1.4, "depot"),
    g(27.4, 8.6, "depot"),
    // 仓库室内
    g(10.2, -4.2, "depot"),
    g(12.4, 6.4, "depot"),
    g(24.4, 6.2, "depot"),
    g(14.2, -2.4, "depot"),
    g(17.4, 8.6, "depot"),
    // 高地下方 / 楼梯口
    g(-1.4, -8.4, "depot"),
    g(13.4, -9.4, "depot"),
    g(9.6, -3.4, "depot"),
    // 南侧开阔地
    g(-1.2, 17.2, "ship"),
    g(8.2, 17.4, "ship"),
    g(15.4, 17.6, "ship"),
    g(21.6, 18.4, "ship"),
    g(24.6, 14.2, "ship"),
    // 空中
    a(-30.4, 7.2, 4.4, "icequay"),
    a(-36, 9.4, 19, "icequay"),
    a(-21.2, 6.6, -4.4, "icequay"),
    a(-18.4, 10.2, 14.6, "icequay"),
    a(-3.2, 7.4, 3.4, "depot"),
    a(13.2, 10.4, 13.4, "depot"),
    a(23.4, 9.2, -7.4, "depot"),
    a(4.4, 8.6, -2.4, "depot"),
    a(-8.4, 8.4, -20.4, "hill"),
    a(5.6, 11.4, -26.4, "hill"),
    a(11.4, 9.6, -17.4, "hill"),
    a(1.4, 8.2, 25.4, "ship"),
    a(9.4, 9.8, 19.4, "ship"),
    a(18.4, 11.2, 23.4, "ship"),
    a(-4.4, 8.4, 22.4, "ship"),
  ];
}

function buildCovers() {
  var c = function (x, z) {
    return new Vector3(x, 0, z);
  };
  return [
    // 冰面（冰脊、箱体、小屋、信标基座）
    c(-36.2, -3.4),
    c(-32.4, 11.6),
    c(-24.6, -4.4),
    c(-26.4, 23.6),
    c(-37.4, 13.4),
    c(-20.6, 8.6),
    c(-36.4, -5.4),
    c(-19.4, -8.6),
    c(-15.6, 4.6),
    c(-30.6, 25.6),
    // 货仓区
    c(-5.4, 5.0),
    c(-4.6, 12.4),
    c(0.8, -2.6),
    c(4.4, -9.6),
    c(7.4, 12.4),
    c(10.2, 14.6),
    c(13.4, -4.2),
    c(18.4, -4.4),
    c(22.4, -4.6),
    c(25.4, 10.4),
    c(12.2, -4.6),
    c(27.6, 3.0),
    c(2.4, -2.6),
    // 高地/楼梯口/坡下
    c(-1.2, -9.4),
    c(9.4, -3.4),
    c(13.4, -10.4),
    c(-8.4, -11.4),
    // 南侧开阔地
    c(-3.4, 18.4),
    c(8.4, 18.4),
    c(15.4, 18.4),
    c(21.4, 19.4),
    c(12.4, 15.4),
    // 破冰船艏
    c(3.4, 19.4),
    c(7.4, 19.4),
  ];
}

// ---------------------------------------------------------------------------
// 统计与展示
// ---------------------------------------------------------------------------
function countTris(root) {
  var n = 0;
  root.traverse(function (o) {
    if (o.isMesh && o.geometry && o.geometry.index) {
      n += o.geometry.index.count / 3;
    } else if (o.isMesh && o.geometry && o.geometry.attributes.position) {
      n += o.geometry.attributes.position.count / 3;
    }
  });
  return Math.round(n);
}

function countMeshes(root) {
  var n = 0;
  root.traverse(function (o) {
    if (o.isMesh) n += 1;
  });
  return n;
}

function showcaseTidegate(context) {
  var level = createTidegateLevel(context);
  if (context.camera) {
    context.camera.position.set(-24, 26, 44);
    context.camera.lookAt(4, 2, -4);
  }
  return level;
}

var tidegateShowcaseModule = {};
defineModuleExports(tidegateShowcaseModule, {
  create: function () {
    return createTidegateLevel;
  },
  showcase: function () {
    return showcaseTidegate;
  },
});

export {
  createTidegateLevel,
  showcaseTidegate,
  tidegateShowcaseModule,
};
