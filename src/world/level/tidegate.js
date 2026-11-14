// TIDEGATE — 第二张关卡的关卡空间与战术层（Step 1 骨架 + Step 2 战术层）。
//
// 目标：在不改动 physics / flow / ground / backdrop / player 的前提下，
// 用与 level.js 完全相同的关卡 DSL（buildings.js#ob）搭出四个分区：
//   gate / yard / coldstore / quay，并返回同样形状的 LevelSystem。
//
// Step 1：分区壳体、集装箱阵列、冷库壳体与内腔、码头栈桥、三中继占位。
// Step 2：地面导引贴花与 hazard 边沿、冷库 4 盏点光（接 setLights）、
//         掩体补到 48、出生点补到 26 地面 + 17 空中，并在构建期做 nav 断言。
// Step 3：栈桥北端下行梯（两跑镜像，落回码头 0m）、天窗加色光柱。
//
// bench 对照与完整通关在 docs/MAP_ANALYSIS_AND_DESIGN.md 4.6 记录（不在运行时代码里）。

import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Vector3,
  defineModuleExports,
} from "../../vendor/three-r180.js";
import { batchStaticMeshes } from "../../core/geometry.js";
import { ob } from "./buildings.js";

var tidegateShowcaseModule = {};

defineModuleExports(tidegateShowcaseModule, {
  create: () => createTidegateLevel,
  showcase: () => showcaseTidegate,
});

// 关卡常量。全部落在 WORLD_BOUNDS（x[-40,40] / z[-30,30] / 陆地 x<=30）内。
var L = {
  landMaxX: 29.5, // 陆地可走上限（readme：quayX=30，再留 0.5m 安全边）
  gate: { x0: -40, x1: -26, z0: -12, z1: 12 },
  yard: { x0: -26, x1: 6, z0: -30, z1: 30 },
  cold: { x0: 6, x1: 18, z0: -30, z1: -4, wall: 0.3, h: 6.2, ridge: 8.5 },
  quay: { x0: 18, x1: 29.5, z0: -30, z1: 30 },
  bridgeY: 4.8,
};

var HALF_TURN = Math.PI / 2;

// 静态墙：一份网格 + 一份碰撞。墙与地板的碰撞必须成对出现，否则会出现
// “看得见走得进去”或“看不见走不过去”。
function wall(t, mat, x0, z0, x1, z1, y0, y1, surface) {
  t.slab(mat, x0, y0, z0, x1, y1, z1);
  t.col(x0, y0, z0, x1, y1, z1, surface || "concrete");
}

function slabAndCollide(t, mat, x0, z0, x1, z1, y0, y1, surface) {
  t.slab(mat, x0, y0, z0, x1, y1, z1);
  t.col(x0, y0, z0, x1, y1, z1, surface || "concrete");
}

function createTidegateLevel(context) {
  var levelRoot = new Group();
  levelRoot.name = "level";
  context.scene.add(levelRoot);

  var t = ob(context);
  var relays = placeRelays(t);
  buildGate(t);
  buildYard(t);
  buildColdStore(t);
  buildQuay(t);
  buildGuide(t);

  // 动态件（中继、栈桥灯箱之类）在合批前搬到 dynRoot，否则引用会被合批吃掉。
  for (var relay of relays) t.dynRoot.attach(relay);

  t.staticRoot.updateMatrixWorld(!0);
  var merged = batchStaticMeshes(t.staticRoot);
  merged.name = "level-merged";
  levelRoot.add(merged);
  levelRoot.add(t.dynRoot);

  // 冷库点光必须挂在 levelRoot（不在 staticRoot 里，否则会进合批）。
  var lights = buildColdLights(levelRoot);
  buildLightShafts(levelRoot);
  auditNav(context);

  var tris = 0;
  merged.traverse(function (node) {
    if (!node.isMesh) return;
    var geo = node.geometry;
    tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  });

  return {
    root: levelRoot,
    playerStart: { pos: new Vector3(-33, 0, 4), yaw: -HALF_TURN },
    objectives: [
      {
        id: "relay_a",
        label: "Relay A \u2014 Yard",
        zone: "yard",
        pos: new Vector3(-4, 0, 12),
        object: relays[0],
      },
      {
        id: "relay_b",
        label: "Relay B \u2014 Coldstore",
        zone: "coldstore",
        pos: new Vector3(12, 0.03, -20),
        object: relays[1],
      },
      {
        id: "relay_c",
        label: "Relay C \u2014 Catwalk",
        zone: "quay",
        pos: new Vector3(25, L.bridgeY, -6.2),
        object: relays[2],
      },
    ],
    extraction: { pos: new Vector3(28.5, 0, 20), radius: 2.5 },
    enemySpawns: spawnPoints(),
    zones: [
      { name: "gate", min: [L.gate.x0, L.gate.z0], max: [L.gate.x1, L.gate.z1] },
      { name: "yard", min: [L.yard.x0, L.yard.z0], max: [L.yard.x1, L.yard.z1] },
      {
        name: "coldstore",
        min: [L.cold.x0, L.cold.z0],
        max: [L.cold.x1, L.cold.z1],
      },
      { name: "quay", min: [L.quay.x0, L.quay.z0], max: [L.quay.x1, L.quay.z1] },
    ],
    interiorBoxes: [
      {
        min: new Vector3(L.cold.x0, 0, L.cold.z0),
        max: new Vector3(L.cold.x1, L.cold.h, L.cold.z1),
      },
    ],
    cinematicPath: cinematicPath(),
    coverPoints: coverPoints(),
    skylights: skylights(),
    shedLights: lights,
    vantage: {
      stairsFoot: new Vector3(26, 0, 16.6),
      roof: new Vector3(25, L.bridgeY, -6.2),
    },
    stats: {
      labelsAtlased: 0,
      containers: t.placed.filter(function (p) {
        return p.name.indexOf("container") === 0;
      }).length,
      props: t.placed.length,
      tris: Math.round(tris),
      meshes: merged.children.length + countMeshes(t.dynRoot),
    },
    placed: t.placed,
    groundSurfaceAt(x, z) {
      return t.isMetal(x, z) ? "metal" : "concrete";
    },
    setLights(on, intensity) {
      // 与原关卡同一套语义：environment 用 lampOn 驱动，白天彻底熄灭。
      var k = Math.max(0, Math.min(1, +intensity || 0));
      var lit = !!on && k > 0.05;
      for (var i = 0; i < lights.length; i++) {
        var l = lights[i];
        if (l && l.isLight) l.intensity = lit ? (l.userData.baseIntensity || 1) * k : 0;
      }
    },
    update(dt) {
      for (var i = 0; i < t.updaters.length; i++) {
        try {
          t.updaters[i](dt);
        } catch (err) {
          // 单个道具动画抛错不应拖垮整帧。
          if (!update.warned) {
            update.warned = true;
            console.error("[level:tidegate] prop update threw", err);
          }
        }
      }
    },
  };
}

// ---------------------------------------------------------------- 中继

function placeRelays(t) {
  var a = t.place("relay_node", -4, 12, 0.32, { seed: 1 }, 0);
  var b = t.place("relay_node", 12, -20, 0.18, { seed: 2 }, 0.23);
  var c = t.place("relay_node", 25, -6.2, -0.2, { seed: 3 }, L.bridgeY);
  return [a, b, c];
}

// ---------------------------------------------------------------- 闸口（出生区）

function buildGate(t) {
  // 西侧围栏墙留在 x=-26：主闸门开口 z[-2,4]，南北两侧各留一条侧翼缺口。
  var panelZ = [-12.5, -9.5, -6.5, -3.5, 5.5, 8.5, 11.5];
  for (var z of panelZ) t.place("fence_panel", -26, z, HALF_TURN, { seed: 7 }, 0);

  t.place("guard_booth", -31, -6, 0, { seed: 11 }, 0);
  t.place("gate_arm", -27.4, 5, 0, { seed: 12 }, 0);
  t.place("gate_arm", -27.4, -3, HALF_TURN, { seed: 13 }, 0);
  // 灯杆立在堆场西侧的场角，避开出生视角中轴。
  t.place("light_mast", -24.6, 16.5, 0, { seed: 14 }, 0);
  t.place("light_mast", -24.6, -16.5, 0, { seed: 15 }, 0);
  t.place("sign_post", -29.5, 1.5, 0, { seed: 16 }, 0);
  t.place("bollard_post", -28, 6.4, 0, { seed: 17 }, 0);
  t.place("bollard_post", -28, 1.4, 0, { seed: 18 }, 0);
}

// ---------------------------------------------------------------- 堆场

function buildYard(t) {
  // 4 列 × 4 槽的 40ft 双层箱阵；每列中心跳过 z=0，留出 12m 的横向穿越口。
  var rows = [-24, -16, -8, 0];
  var slots = [-25, -12.5, 12.5, 25];
  var palette = ["paint_blue", "paint_red", "paint_green", "paint_orange"];
  var seed = 20;
  for (var r = 0; r < rows.length; r++) {
    for (var s = 0; s < slots.length; s++) {
      var color = palette[(r + s) % palette.length];
      var opts = { color: color, seed: seed++, wear: 0.35 + ((r + s) % 4) * 0.12 };
      t.place("container40", rows[r], slots[s], HALF_TURN, opts, 0);
      t.place("container40", rows[r], slots[s], HALF_TURN, opts, 2.59);
    }
  }

  // 中继 A 所在的纵向通道（x=-4）两侧摆低矮掩体，制造“走位”而不是“堵路”。
  t.place("jersey_barrier", -6.4, 9.4, 0, { seed: 31 }, 0);
  t.place("jersey_barrier", -1.4, 14.6, 0, { seed: 32 }, 0);
  t.place("sandbags", -2, 8.6, HALF_TURN, { seed: 33 }, 0);
  t.place("crate_stack", -6.2, 15.4, 0, { seed: 34 }, 0);
  t.place("pallet_stack", -1.8, 11.2, HALF_TURN, { seed: 35 }, 0);
  t.place("barrel", -5.6, 11.6, 0, { seed: 36 }, 0);
  t.place("barrel", -5.2, 10.8, 0, { seed: 37 }, 0);
  t.place("traffic_cone", -2.6, 12.6, 0, { seed: 38 }, 0);

  // 叉车与托盘：给堆场加“活物”尺度参照，也做临时掩体。
  t.place("forklift", -20.5, 5.5, 0.4, { seed: 40 }, 0);
  t.place("forklift", 2.4, -18, -1.2, { seed: 41 }, 0);
  t.place("cable_reel", -12.4, 20.5, 0, { seed: 42 }, 0);
  t.place("tire_stack", -11.6, -6.4, 0, { seed: 43 }, 0);
  t.place("dumpster", 3.2, 24.5, HALF_TURN, { seed: 44 }, 0);
  t.place("pipe_stack", -20, -25.5, 0, { seed: 45 }, 0);
  t.place("tarp_cargo", -20.6, -12.4, 0, { seed: 46 }, 0);
  t.place("cardboard_boxes", -12.4, 12.4, 0, { seed: 47 }, 0);
  t.place("pallet", 3.4, 8.4, 0, { seed: 48 }, 0);
  t.place("ibc_tote", 3.6, -4.4, 0, { seed: 49 }, 0);
}

// ---------------------------------------------------------------- 冷库

function buildColdStore(t) {
  var c = L.cold;

  // 室内地坪（比场地高 3cm，和原仓库一致的 FLOOR 处理方式）。
  slabAndCollide(t, "concrete", c.x0, c.z0, c.x1, c.z1, 0, 0.03, "concrete");

  // 西墙 x[6,6.3]：两个 4m 宽的出入口（z[-24,-20] 与 z[-10,-6]）。
  wall(t, "concrete_painted", c.x0, c.z0, c.x0 + c.wall, -24, 0, c.h);
  wall(t, "concrete_painted", c.x0, -20, c.x0 + c.wall, -10, 0, c.h);
  wall(t, "concrete_painted", c.x0, -6, c.x0 + c.wall, c.z1, 0, c.h);

  // 东墙 x[17.7,18]：一个朝码头的卷帘开口 z[-20,-14]。
  wall(t, "concrete_painted", c.x1 - c.wall, c.z0, c.x1, -20, 0, c.h);
  wall(t, "concrete_painted", c.x1 - c.wall, -14, c.x1, c.z1, 0, c.h);

  // 北墙 z[-4.3,-4]：上料门开在 x[14,17.4]。
  wall(t, "concrete_painted", c.x0, c.z1 - c.wall, 14, c.z1, 0, c.h);

  // 南墙整面。
  wall(t, "concrete_painted", c.x0, c.z0, c.x1, c.z0 + c.wall, 0, c.h);

  // 屋面 + 中央设备脊（脊只是遮挡与体量，不参与导航）。
  slabAndCollide(t, "concrete_painted", c.x0, c.z0, c.x1, c.z1, c.h, c.h + 0.12, "metal");
  t.box("paint_white", 4.2, 2.05, 22, 12, c.h + 1.16, -17);
  t.col(9.9, c.h + 0.12, -28, 14.1, c.ridge, -6, "metal");

  // 4 条天窗光带（只是视觉与数据，Step 3 再接真实点光）。
  t.slab("paint_white", 7, c.h + 0.12, -26, 11, c.h + 0.16, -22);
  t.slab("paint_white", 13, c.h + 0.12, -26, 17, c.h + 0.16, -22);
  t.slab("paint_white", 7, c.h + 0.12, -14, 11, c.h + 0.16, -10);
  t.slab("paint_white", 13, c.h + 0.12, -14, 17, c.h + 0.16, -10);

  // 货架两排 × 三列，留出 z[-22,-18] 与 z[-10,-4] 两条作业通道。
  var rackX = [8.5, 12, 15.5];
  var rackZ = [-26, -14];
  var s = 50;
  for (var x of rackX) for (var z of rackZ) t.place("shelf_rack", x, z, 0, { seed: s++ }, 0);

  t.place("pallet_stack", 9.6, -10.4, 0, { seed: 60 }, 0);
  t.place("pallet_stack", 14.8, -22.2, 0, { seed: 61 }, 0);
  t.place("ibc_tote", 7.2, -18.6, 0, { seed: 62 }, 0);
  t.place("cardboard_boxes", 16.2, -24.6, 0, { seed: 63 }, 0);
  t.place("reefer_unit", 10.2, -28.4, 0, { seed: 64 }, 0);
  t.place("floodlight_stand", 12, -22.6, 0, { seed: 65 }, 0);

  // 中继 B 的混凝土台座：让目标在室内有个“台子”，也避免和货架抢空间。
  slabAndCollide(t, "concrete", 10.9, -21.1, 13.1, -18.9, 0.03, 0.23, "concrete");
}

// ---------------------------------------------------------------- 码头 + 栈桥

function buildQuay(t) {
  var q = L.quay;

  // 系缆桩沿 x≈29 一列，撤离走廊 z[12,28] 保持无遮挡。
  var bollardZ = [-28, -20, -12, -4, 4, 12, 20, 28];
  var s = 70;
  for (var z of bollardZ) t.place("bollard_mooring", 29, z, 0, { seed: s++ }, 0);

  t.place("generator", 21.4, 26.4, 0, { seed: 80 }, 0);
  t.place("dumpster", 28.2, -12.6, HALF_TURN, { seed: 81 }, 0);
  t.place("pipe_stack", 19.6, -24.6, HALF_TURN, { seed: 82 }, 0);
  t.place("tire_stack", 19.4, -2.6, 0, { seed: 83 }, 0);
  t.place("pallet_stack", 21.2, 2.4, HALF_TURN, { seed: 84 }, 0);
  t.place("traffic_cone", 24.6, 18.4, 0, { seed: 85 }, 0);
  t.place("traffic_cone", 27.2, 6.4, 0, { seed: 86 }, 0);

  buildCatwalk(t, 26);
}

// 两跑楼梯（每跑升 2.4m）接到 4.8m 的栈桥，桥面从 z=10.6 一路铺到 z=-7.4。
function buildCatwalk(t, x) {
  // 第一跑：脚在 z=17.5，顶在 z=14.5。
  t.stairs(x, 16, HALF_TURN, 0, { seed: 90 });
  slabAndCollide(t, "diamond_plate", x - 1.5, 13.4, x + 1.5, 14.7, 2.4, 2.48, "metal");

  // 第二跑：脚在 z=14.7，顶在 z=11.7。
  t.stairs(x, 13.2, HALF_TURN, 2.4, { seed: 91 });
  slabAndCollide(t, "diamond_plate", x - 1.5, 10.6, x + 1.5, 11.9, 4.8, 4.88, "metal");

  // 桥面：6 段 3m 栈桥首尾相接（接缝 0，禁止出现 0.5m 以上缺口）。
  var deckZ = [9.2, 6.2, 3.2, 0.2, -2.8, -5.8];
  var sd = 93;
  for (var z of deckZ) t.catwalk(x, z, HALF_TURN, L.bridgeY, { seed: sd++ }, [true, true]);

  // 中继 C 的平台：3×2.6m 的加宽端头。
  slabAndCollide(t, "diamond_plate", 22.8, -7.4, 27.6, -4.9, 4.7, 4.78, "metal");

  // 平台边沿用护栏件做“失足提示”（hazard 材质在贴花层，Step 3 补）。
  t.place("fence_panel", 22.8, -6.2, HALF_TURN, { seed: 92 }, L.bridgeY + 0.05);

  // Step 3：北端下行梯。与上升段镜像（yaw 取 -HALF_TURN，高端朝 +z），
  // 上跑 -7.4 → -10.4（4.8 → 2.4），下跑 -10.4 → -13.4（2.4 → 0）。
  t.stairs(x, -8.9, -HALF_TURN, 2.4, { seed: 94 });
  slabAndCollide(t, "diamond_plate", x - 1.5, -10.7, x + 1.5, -9.4, 2.4, 2.48, "metal");
  t.stairs(x, -11.9, -HALF_TURN, 0, { seed: 95 });
}

// ---------------------------------------------------------------- 导引层（Step 2）

// decal 的旋转：quad 先绕 z 转 K，再绕 x 转 -90°，因此 K 决定地面文案的朝向。
// 推导结果：K=0 → 箭头指 -z；K=-π/2 → +x；K=π/2 → -x；K=π → +z。
var DIR_ROT = { "x+": -HALF_TURN, "x-": HALF_TURN, "z+": Math.PI, "z-": 0 };

function arrow(t, x, z, dir, size, y) {
  t.decal("arrow", size || 2.4, x, y === undefined ? 0.006 : y, z, "y+", DIR_ROT[dir] || 0);
}

function buildGuide(t) {
  // 1) 主路线箭头：闸口 → 中继 A → 冷库西门 → 中继 B → 码头东门 → 楼梯 → 栈桥 → 撤离。
  arrow(t, -31.4, 1, "x+");
  arrow(t, -20, 3.4, "x+");
  arrow(t, -12, 7.6, "x+");
  arrow(t, -6.2, 10.4, "x+");
  arrow(t, -4, 3.2, "z-");
  arrow(t, -2.2, -8, "x+");
  arrow(t, 4, -8, "x+");
  arrow(t, 8.4, -9.4, "z-");
  arrow(t, 11, -14.6, "z-");
  arrow(t, 16.2, -17, "x+");
  arrow(t, 20, -9.6, "z+");
  arrow(t, 22.6, 4.2, "z+");
  arrow(t, 26, 20.6, "z-");
  arrow(t, 26, 2, "z-", 1.8);
  arrow(t, 26, -4, "z-", 1.8);
  arrow(t, 28.4, 6.4, "z+");
  arrow(t, 28.4, 14.4, "z+");

  // Step 3：桥面 → 北端下行梯的引导（平台面 4.79 / 中间平台 2.48 / 梯脚 0）。
  arrow(t, 26, -7.9, "z-", 1.9, 4.786);
  arrow(t, 26, -9.9, "z-", 1.7, 2.486);
  arrow(t, 26, -16.2, "z+", 2.2);

  // 2) 门槛 hazard：四个洞口的进出提示，避免“看得见门、找不到边”。
  var hz = function (x0, z0, x1, z1, y) {
    t.slab("hazard_stripes", x0, y, z0, x1, y + 0.012, z1);
  };
  hz(5.6, -24, 6.4, -20, 0.004);
  hz(5.6, -10, 6.4, -6, 0.004);
  hz(17.55, -20, 18.35, -14, 0.004);
  hz(14, -4.42, 17.4, -3.6, 0.004);

  // 3) 失足边沿：桥面北端、中继 C 平台南沿、楼梯脚下。
  hz(25.45, -7.46, 26.55, -7.3, 4.79);
  hz(22.8, -5.06, 27.6, -4.9, 4.79);
  hz(24.4, 17.5, 27.6, 18.12, 0.004);
  // 下行梯梯脚（Step 3）：落点四周一圈，告诉玩家“到这儿就到底了”。
  hz(24.4, -13.7, 27.6, -13.3, 0.004);

  // 4) 场地气味层：少量污渍与警戒条，避免新地面“太干净”。
  t.decal("caution_stripes", 3, -29.6, 0.006, 7.4, "y+", 0);
  t.decal("oil_stain", 2.2, -19.4, 0.005, 6.4, "y+", 0.7);
  t.decal("oil_stain", 1.6, 21.2, 0.005, 24.6, "y+", 2.3);
  t.decal("leak_stain", 2.6, 26.4, 4.806, -1.6, "y+", 0.4);
}

// ---------------------------------------------------------------- 冷库点光

// 四盏点光压在天窗正下方；intensity 由 environment 的 lampOn 通过 setLights 缩放。
function buildColdLights(levelRoot) {
  var specs = [
    [9, 5.35, -24],
    [15, 5.35, -24],
    [9, 5.35, -12],
    [15, 5.35, -12],
  ];
  var out = [];
  for (var p of specs) {
    var light = new PointLight(0xbfd4e6, 34, 13, 2);
    light.position.set(p[0], p[1], p[2]);
    light.castShadow = false;
    light.userData.baseIntensity = light.intensity;
    levelRoot.add(light);
    out.push(light);
  }
  return out;
}

// 天窗光柱：四根加色圆锥壳，从屋面孔洞一直落到地面。
// 做法对齐 helicopter.js 的 volumetric cone：AdditiveBlending + depthWrite:false，
// 这样只加亮空气、不参与深度，不会把货架挡成“贴纸”。
function buildLightShafts(levelRoot) {
  var floorY = 0.02;
  var top = L.cold.h + 0.12;
  var h = top - floorY;
  var beam = 0xc8dcee;
  var shafts = skylights();
  for (var i = 0; i < shafts.length; i++) {
    var s = shafts[i];
    var geo = new CylinderGeometry(1.5, 2.3, h, 14, 1, true);
    var mat = new MeshBasicMaterial({
      color: beam,
      transparent: true,
      opacity: 0.055,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      fog: false,
    });
    var mesh = new Mesh(geo, mat);
    mesh.position.set(s.x, floorY + h / 2, s.z);
    mesh.renderOrder = 2;
    levelRoot.add(mesh);
  }
}

// ---------------------------------------------------------------- 构建期断言

// 地面出生点与地面掩体必须落在导航网格的可走格里，否则 physics 会在 2m 内
// 环形搜索把它们静默挪走（体感就是“敌人从墙里出来”）。这里在构建期自检。
function auditNav(context) {
  var nav = context.physics && context.physics.nav;
  if (!nav || typeof nav.isWalkable !== "function") return;
  var bad = [];
  var total = 0;
  var spawns = spawnPoints();
  for (var i = 0; i < spawns.length; i++) {
    var s = spawns[i];
    if (s.pos.y > 0.5) continue;
    total++;
    if (!nav.isWalkable(s.pos.x, s.pos.z)) {
      bad.push("spawn/" + s.zone + " (" + s.pos.x + ", " + s.pos.z + ")");
    }
  }
  var covers = coverPoints();
  for (var j = 0; j < covers.length; j++) {
    var c = covers[j];
    if (c.y > 0.5) continue;
    total++;
    if (!nav.isWalkable(c.x, c.z)) {
      bad.push("cover (" + c.x + ", " + c.z + ")");
    }
  }
  if (bad.length) {
    console.warn(
      "[tidegate] " + bad.length + "/" + total + " 个地面点不可走（会被物理静默挪走）：" + bad.join(" | "),
    );
  } else {
    console.info("[tidegate] nav audit: " + total + " 个地面点全部可走");
  }
}

// ---------------------------------------------------------------- 关卡数据

function spawnPoints() {
  var ground = [
    [-20, -20, "yard"],
    [-20, 10, "yard"],
    [-20, 24, "yard"],
    [-12, -12, "yard"],
    [-12, 6, "yard"],
    [-12, 22, "yard"],
    [-4, 6, "yard"],
    [-4, 22, "yard"],
    [-4, -8, "yard"],
    [3.5, -10, "yard"],
    [3.5, 18, "yard"],
    [3.5, 28, "yard"],
    [9, -22, "coldstore"],
    [13, -22, "coldstore"],
    [16, -18, "coldstore"],
    [10.4, -7.6, "coldstore"],
    [13, -10, "coldstore"],
    [16, -6, "coldstore"],
    [20, 22, "quay"],
    [22, 10, "quay"],
    [28, -8, "quay"],
    [27, 12, "quay"],
    [20, -18, "quay"],
    [24, 26, "quay"],
    [-21, 2, "yard"],
    [20, -1, "quay"],
  ];
  var air = [
    [-14, 10, 14, "yard"],
    [0, 11, 20, "yard"],
    [-18, 9, -6, "yard"],
    [2, 12, 4, "yard"],
    [10, 5, -16, "coldstore"],
    [15, 5, -8, "coldstore"],
    [12, 5, -24, "coldstore"],
    [22, 10, 18, "quay"],
    [27, 12, 4, "quay"],
    [20, 9, -12, "quay"],
    [26, 13, 26, "quay"],
    [-22, 13, 8, "yard"],
    [-8, 15, -4, "yard"],
    [4, 11, 14, "yard"],
    [22, 9, -22, "quay"],
    [28, 13, 8, "quay"],
    [12, 4.4, -16, "coldstore"],
  ];
  var out = [];
  for (var g of ground) {
    out.push({ pos: new Vector3(g[0], 0, g[1]), zone: g[2], type: "ground" });
  }
  for (var a of air) {
    out.push({ pos: new Vector3(a[0], a[1], a[2]), zone: a[3], type: "air" });
  }
  return out;
}

function coverPoints() {
  var pts = [
    // 堆场通道
    [-20, -24], [-20, -8], [-20, 2], [-20, 16], [-20, 26],
    [-12, -24], [-12, -4], [-12, 10], [-12, 16], [-12, 28],
    [-4, -24], [-4, -2], [-4, 4], [-4, 16], [-4, 26],
    [3.5, -24], [3.5, -6], [3.5, 4], [3.5, 14], [4.6, 21],
    // 冷库内部
    [8, -22], [8, -12], [11.6, -18], [10.2, -24], [16, -12], [10, -6],
    // 码头
    [19.6, 8], [23, 16], [28, 24], [27, -22], [19.4, -14],
    // Step 2 补足（通道交汇与侧翼，保证每个 zone 都有两向接近路线）
    [-21.5, -6], [-13, -18], [-5, 20], [2.5, 12], [20, 20], [27, 4], [23.5, -26],
  ];
  var out = [];
  for (var p of pts) out.push(new Vector3(p[0], 0, p[1]));
  // 十个箱顶掩体（y=2.59，只有玩家能上）。
  out.push(new Vector3(-24, 2.59, 12.5));
  out.push(new Vector3(-8, 2.59, 12.5));
  out.push(new Vector3(0, 2.59, 25));
  out.push(new Vector3(-16, 2.59, -25));
  out.push(new Vector3(-24, 2.59, -12.5));
  out.push(new Vector3(-8, 2.59, 25));
  out.push(new Vector3(-16, 2.59, 12.5));
  out.push(new Vector3(0, 2.59, -12.5));
  out.push(new Vector3(-8, 2.59, -25));
  out.push(new Vector3(-24, 2.59, 25));
  return out;
}

function skylights() {
  return [
    { x: 9, y: L.cold.h + 0.12, z: -24, w: 4, d: 4 },
    { x: 15, y: L.cold.h + 0.12, z: -24, w: 4, d: 4 },
    { x: 9, y: L.cold.h + 0.12, z: -12, w: 4, d: 4 },
    { x: 15, y: L.cold.h + 0.12, z: -12, w: 4, d: 4 },
  ];
}

function cinematicPath() {
  var pts = [
    { pos: [-38, 1.7, 8], look: [-24, 2.2, 6] },
    { pos: [-28, 1.6, 4], look: [-14, 2.4, 8] },
    { pos: [-14, 2.1, 10], look: [0, 2.6, 8] },
    { pos: [-4, 2.2, 16], look: [0, 2.2, -6] },
    { pos: [4, 2.4, -10], look: [14, 2.6, -18] },
    { pos: [16, 2.2, -16], look: [26, 3.4, -6] },
    { pos: [24, 1.8, 4], look: [28, 1.2, 18] },
  ];
  return pts.map(function (p) {
    return { pos: new Vector3(p.pos[0], p.pos[1], p.pos[2]), look: new Vector3(p.look[0], p.look[1], p.look[2]) };
  });
}

function countMeshes(root) {
  var n = 0;
  root.traverse(function (o) {
    if (o.isMesh) n++;
  });
  return n;
}

async function showcaseTidegate(context) {
  var level = createTidegateLevel(context);
  return {
    cam: [-36, 6.2, 12],
    target: [2, 2.6, 2],
    update: function (dt) {
      level.update(dt);
    },
  };
}

export { createTidegateLevel, tidegateShowcaseModule, showcaseTidegate };
