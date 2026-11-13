// AH-64 Apache 程序化模型（移植自 docs/阿帕奇武装直升机模型-升级版.html）。
// 接口与旧版 heli-model.js 保持一致：{ root, mainRotor, tailRotor, pods, spin, tilt }，
// 供 helicopter.js（光柱/盘旋）与 missile.js（挂舱弹体）复用。
//
// 与 demo 的差异：
//   · 不用 importmap/CDN，全部走本地 vendor；
//   · 静态小件按材质合并（mergeGeometries），把 draw call 从 ~400 降到十几个档；
//   · 不创建 PointLight / 探照灯锥体（M3 的 SpotLight 光柱已在 helicopter.js 里做）；
//   · 所有 mesh 关闭阴影（直升机在 22–28m 高空，投影收益低而开销大）。
import {
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
  AdditiveBlending,
} from "../vendor/three-r180.js";
import { mergeGeometries } from "../core/geometry.js";

// AH-64 涂装：暗橄榄绿机身 + 深灰金属件
var BODY = 0x3f4a35;
var BODY_DARK = 0x2b3325;
var BODY_PANEL = 0x36402e;
var METAL = 0x2a2e33;
var METAL_DARK = 0x161a1e;
var METAL_LIGHT = 0x4a5058;
var GLASS = 0x0d1a26;
var BLADE = 0x121416;
var BLADE_TIP = 0xb8a050;
var ROCKET = 0x34383d;
var ROCKET_TIP = 0x7a1a1a;
var MISSILE_COL = 0x4a5044;
var TIRE = 0x0c0d0f;

var _q = new Quaternion();
var _m = new Matrix4();
var _up = new Vector3(0, 1, 0);

// —— 几何辅助：返回「已定位」的 BufferGeometry，便于按材质合批 ——
function boxG(w, h, d, x, y, z, rx, ry, rz) {
  let g = new BoxGeometry(w, h, d);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(x || 0, y || 0, z || 0);
  return g;
}

function cylG(rTop, rBottom, h, seg, x, y, z, rx, ry, rz) {
  let g = new CylinderGeometry(rTop, rBottom, h, seg || 16);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(x || 0, y || 0, z || 0);
  return g;
}

function ellipsoidG(rx, ry, rz, wSeg, hSeg, x, y, z) {
  let g = new SphereGeometry(1, wSeg || 20, hSeg || 14);
  g.scale(rx, ry, rz);
  g.translate(x || 0, y || 0, z || 0);
  return g;
}

// 两点之间的圆柱（用于支柱/斜撑）
function strutG(a, b, r1, r2, seg) {
  let A = new Vector3(a[0], a[1], a[2]),
    B = new Vector3(b[0], b[1], b[2]),
    dir = B.clone().sub(A),
    len = dir.length();
  if (len < 1e-6) return new CylinderGeometry(r1, r2, 1e-4, seg || 8);
  let g = new CylinderGeometry(r2, r1, len, seg || 8);
  g.translate(0, len / 2, 0);
  _q.setFromUnitVectors(_up, dir.normalize());
  g.applyQuaternion(_q);
  g.translate(A.x, A.y, A.z);
  return g;
}

// 按材质收集几何，最后合并成少量 Mesh
function makeBatch() {
  let buckets = new Map();
  return {
    add(mat, geo) {
      let list = buckets.get(mat);
      if (!list) buckets.set(mat, (list = []));
      list.push(geo);
      return geo;
    },
    // 生成一个 Group，每种材质一个 Mesh
    build(name) {
      let g = new Group();
      g.name = name || "batch";
      for (let [mat, geos] of buckets) {
        if (!geos.length) continue;
        let merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
        if (!merged) continue;
        let m = new Mesh(merged, mat);
        m.castShadow = false;
        m.receiveShadow = false;
        g.add(m);
      }
      buckets.clear();
      return g;
    },
  };
}

function buildApache() {
  let root = new Group();
  root.name = "apache";

  // —— 材质库 ——
  let MAT = {
    body: new MeshStandardMaterial({ color: BODY, roughness: 0.6, metalness: 0.32 }),
    bodyDark: new MeshStandardMaterial({ color: BODY_DARK, roughness: 0.68, metalness: 0.28 }),
    bodyPanel: new MeshStandardMaterial({ color: BODY_PANEL, roughness: 0.55, metalness: 0.4 }),
    metal: new MeshStandardMaterial({ color: METAL, roughness: 0.4, metalness: 0.88 }),
    metalDark: new MeshStandardMaterial({ color: METAL_DARK, roughness: 0.48, metalness: 0.82 }),
    metalLight: new MeshStandardMaterial({ color: METAL_LIGHT, roughness: 0.35, metalness: 0.9 }),
    glass: new MeshPhysicalMaterial({
      color: GLASS,
      roughness: 0.05,
      metalness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.7,
    }),
    blade: new MeshStandardMaterial({ color: BLADE, roughness: 0.78, metalness: 0.18 }),
    bladeTip: new MeshStandardMaterial({ color: BLADE_TIP, roughness: 0.5, metalness: 0.45 }),
    rocket: new MeshStandardMaterial({ color: ROCKET, roughness: 0.55, metalness: 0.6 }),
    rocketTip: new MeshStandardMaterial({ color: ROCKET_TIP, roughness: 0.5, metalness: 0.3 }),
    missile: new MeshStandardMaterial({ color: MISSILE_COL, roughness: 0.52, metalness: 0.48 }),
    tire: new MeshStandardMaterial({ color: TIRE, roughness: 0.95, metalness: 0.02 }),
    navRed: new MeshBasicMaterial({ color: 0xff2a1a }),
    navGreen: new MeshBasicMaterial({ color: 0x2aff5a }),
    beacon: new MeshBasicMaterial({ color: 0xff3311 }),
  };

  // —— 4.1 机身 ——
  let fb = makeBatch();
  // 机头雷达罩 / 前机身 / 中机身 / 后机身
  fb.add(MAT.bodyDark, ellipsoidG(0.4, 0.32, 0.5, 24, 16, 0, -0.02, -2.65));
  fb.add(MAT.body, cylG(0.55, 0.4, 1.0, 24, 0, 0, -1.95, Math.PI / 2));
  fb.add(MAT.body, cylG(0.55, 0.55, 1.8, 24, 0, 0, -0.5, Math.PI / 2));
  fb.add(MAT.body, cylG(0.35, 0.55, 1.6, 22, 0, 0.02, 1.2, Math.PI / 2));
  fb.add(MAT.bodyDark, ellipsoidG(0.42, 0.22, 1.1, 20, 14, 0, -0.32, -0.35));
  fb.add(MAT.bodyDark, boxG(0.28, 0.12, 2.6, 0, 0.53, 0.1));
  // 两侧航电舱
  for (let s of [-1, 1]) {
    fb.add(MAT.bodyPanel, ellipsoidG(0.17, 0.27, 0.68, 16, 12, s * 0.43, 0.06, -0.55));
  }
  // 面板线
  for (let s of [-1, 1]) {
    fb.add(MAT.metalDark, boxG(0.006, 0.02, 2.6, s * 0.545, 0.12, -0.3));
    fb.add(MAT.metalDark, boxG(0.006, 0.02, 1.6, s * 0.52, 0.28, 0.6));
    fb.add(MAT.metalDark, boxG(0.006, 0.02, 1.2, s * 0.49, -0.12, -1.2));
  }
  fb.add(MAT.metalDark, boxG(0.9, 0.018, 0.006, 0, 0.5, 0.9));
  fb.add(MAT.metalDark, boxG(1.0, 0.018, 0.006, 0, 0.05, -1.3));
  fb.add(MAT.metalDark, boxG(0.85, 0.018, 0.006, 0, -0.1, 1.0));
  let fuselage = fb.build("fuselage");
  root.add(fuselage);

  // —— 4.2 串列座舱 ——
  let cb = makeBatch();
  cb.add(MAT.glass, boxG(0.68, 0.34, 0.6, 0, 0.36, -1.82, -0.26));
  cb.add(MAT.glass, boxG(0.74, 0.42, 0.7, 0, 0.54, -1.0, -0.18));
  cb.add(MAT.metalDark, boxG(0.06, 0.09, 1.55, 0, 0.62, -1.28, -0.22));
  cb.add(MAT.metalDark, boxG(0.66, 0.09, 0.12, 0, 0.18, -2.16, -0.36));
  for (let s of [-1, 1]) {
    cb.add(MAT.metalDark, boxG(0.04, 0.42, 1.28, s * 0.38, 0.44, -1.28, -0.22));
    cb.add(MAT.metalLight, boxG(0.05, 0.05, 0.05, s * 0.4, 0.22, -1.5));
    cb.add(MAT.metalLight, boxG(0.05, 0.05, 0.05, s * 0.4, 0.22, -0.9));
  }
  cb.add(MAT.metalDark, boxG(0.32, 0.28, 0.12, 0, 0.32, -1.25, -0.2));
  cb.add(MAT.metalDark, boxG(0.3, 0.24, 0.12, 0, 0.44, -0.82, -0.16));
  let canopy = cb.build("canopy");
  root.add(canopy);

  // —— 4.3 尾梁与尾翼 ——
  let tb = makeBatch();
  tb.add(MAT.body, cylG(0.1, 0.35, 4.2, 18, 0, 0.48, 4.1, Math.PI / 2 - 0.17));
  tb.add(MAT.bodyDark, boxG(0.09, 0.1, 3.9, 0, 0.68, 4.0, -0.17));
  for (let i = 0; i < 3; i++) {
    tb.add(MAT.bodyPanel, boxG(0.12, 0.02, 0.3, 0, 0.62, 3.0 + i * 0.9, -0.17));
  }
  // 垂直尾翼
  tb.add(MAT.body, boxG(0.08, 1.45, 0.75, 0, 1.12, 6.05, -0.22));
  tb.add(MAT.bodyDark, boxG(0.06, 0.85, 0.5, 0, 1.42, 6.32, -0.3));
  tb.add(MAT.bodyDark, ellipsoidG(0.09, 0.18, 0.36, 14, 10, 0, 1.88, 6.15, -0.24));
  tb.add(MAT.metalDark, cylG(0.03, 0.03, 1.4, 8, 0, 1.05, 5.68, 0.22));
  // 平尾
  for (let s of [-1, 1]) {
    tb.add(MAT.body, boxG(0.95, 0.06, 0.42, s * 0.52, 0.74, 5.55, 0, s * -0.14));
    tb.add(MAT.bodyDark, boxG(0.18, 0.09, 0.4, s * 1.02, 0.72, 5.6, 0, s * -0.14));
    tb.add(
      MAT.metalDark,
      cylG(0.025, 0.025, 0.9, 6, s * 0.52, 0.74, 5.34, 0, Math.PI / 2 + s * -0.14),
    );
  }
  // 天线
  tb.add(MAT.metalDark, cylG(0.006, 0.006, 0.4, 6, 0.02, 0.9, 5.3, 0.3));
  let tail = tb.build("tail");
  root.add(tail);

  // —— 4.4 尾桨（X 型 4 叶，独立旋转组）——
  let tailRotor = new Group();
  tailRotor.name = "tailRotor";
  tailRotor.position.set(-0.16, 1.28, 6.12);
  {
    let b = makeBatch();
    b.add(MAT.metal, cylG(0.09, 0.09, 0.12, 12, 0, 0, 0, 0, 0, Math.PI / 2));
    b.add(MAT.metalLight, cylG(0.05, 0.05, 0.16, 10, 0, 0, 0, 0, 0, Math.PI / 2));
    for (let i = 0; i < 4; i++) {
      let a = (i * Math.PI) / 2 + Math.PI / 4,
        blade = boxG(0.055, 1.15, 0.022, 0, 0, 0);
      blade.rotateZ(a);
      blade.translate(0, 0, 0);
      // 沿叶片方向外推
      let off = new Vector3(0, 0.6, 0).applyAxisAngle(new Vector3(0, 0, 1), a);
      blade.translate(off.x, off.y, 0);
      b.add(MAT.blade, blade);
      let tip = boxG(0.06, 0.12, 0.026, 0, 0, 0);
      tip.rotateZ(a);
      let off2 = new Vector3(0, 1.12, 0).applyAxisAngle(new Vector3(0, 0, 1), a);
      tip.translate(off2.x, off2.y, 0);
      b.add(MAT.bladeTip, tip);
    }
    tailRotor.add(b.build("tailBlades"));
    // 尾桨盘（加色叠加，避免夜空下的灰色圆片）
    let disc = new Mesh(
      new CircleGeometry(1.2, 24),
      new MeshBasicMaterial({
        color: 0x8899aa,
        transparent: true,
        opacity: 0.015,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    );
    disc.position.z = 0.02;
    tailRotor.add(disc);
  }
  root.add(tailRotor);

  // —— 4.5 主旋翼系统 ——
  let mainRotor = new Group();
  mainRotor.name = "mainRotor";
  mainRotor.position.set(0, 0.78, 0.15);
  {
    let b = makeBatch();
    b.add(MAT.metal, cylG(0.12, 0.15, 0.55, 16, 0, -0.25, 0));
    b.add(MAT.metalDark, cylG(0.3, 0.3, 0.035, 20, 0, -0.02, 0));
    b.add(MAT.metalLight, cylG(0.24, 0.24, 0.03, 18, 0, 0.02, 0));
    b.add(MAT.metalDark, cylG(0.2, 0.24, 0.14, 16, 0, 0.08, 0));
    b.add(MAT.metal, ellipsoidG(0.14, 0.07, 0.14, 14, 10, 0, 0.17, 0));
    // 星形臂 + 变距拉杆
    for (let i = 0; i < 4; i++) {
      let a = (i * Math.PI) / 2,
        arm = boxG(0.42, 0.06, 0.11, 0, 0, 0);
      arm.rotateY(a);
      arm.translate(Math.cos(a) * 0.32, 0.1, -Math.sin(a) * 0.32);
      b.add(MAT.metal, arm);
      b.add(
        MAT.metalLight,
        strutG(
          [Math.cos(a) * 0.26, 0.02, -Math.sin(a) * 0.26],
          [Math.cos(a) * 0.42, 0.14, -Math.sin(a) * 0.42],
          0.012,
          0.012,
          5,
        ),
      );
    }
    // 桅顶 PNVS 转塔
    b.add(MAT.metalDark, cylG(0.1, 0.12, 0.1, 12, 0, 0.33, -0.35));
    b.add(MAT.metal, ellipsoidG(0.11, 0.1, 0.12, 14, 10, 0, 0.41, -0.35));
    mainRotor.add(b.build("mast"));
  }
  // 桨叶组（独立旋转）
  let mainBlades = new Group();
  mainBlades.name = "mainBlades";
  {
    let b = makeBatch();
    for (let i = 0; i < 4; i++) {
      let a = (i * Math.PI) / 2;
      // boxG 先平移到 (x,0,0)，再 rotateY(a) 即绕桨毂转到角度 a。
      // 4 片在 0/90/180/270°，顶视看是一条十字（两两共线），属正常。
      //
      // 比例：机身约 9m（机头 -2.9 → 尾桨 6.1），真机旋翼直径/机长 ≈ 0.82，
      // 故桨叶半径取 ~4.6m（直径 9.2m）。demo 原值 6.5 会让旋翼明显大一圈。
      let R = 4.6;
      let place = (geo) => geo.rotateY(a);
      // 根部连接件
      b.add(MAT.metalDark, place(boxG(0.22, 0.09, 0.22, 0.55, 0.12, 0)));
      // 主桨叶：从 0.85 到 R 分 3 段（模拟轻微扭转）
      let root0 = 0.85,
        segLen = (R - root0) / 3;
      for (let s = 0; s < 3; s++) {
        let x = root0 + s * segLen + segLen / 2,
          twist = 0.012 * s;
        b.add(MAT.blade, place(boxG(segLen, 0.042, 0.3, x, 0.12 + s * 0.002, 0, twist)));
      }
      // 桨尖后掠 + 黄色标记（AH-64 的桨尖是深色带黄条）
      b.add(MAT.blade, place(boxG(0.32, 0.044, 0.27, R - 0.28, 0.128, -0.02, 0.02, 0.05)));
      b.add(MAT.bladeTip, place(boxG(0.24, 0.048, 0.29, R - 0.02, 0.13, -0.02, 0.02, 0.05)));
      // 后缘襟翼条 / 前缘防磨条（跟随桨叶长度）
      b.add(MAT.metalDark, place(boxG(R - 1.2, 0.018, 0.05, (R + 0.4) / 2, 0.1, 0.15)));
      b.add(MAT.metalLight, place(boxG(R - 1.0, 0.02, 0.04, (R + 0.4) / 2, 0.12, -0.14)));
    }
    mainBlades.add(b.build("blades"));
    // 旋翼盘：加色叠加 + 极低不透明度，夜空下不出现灰色实心圆
    let disc = new Mesh(
      new CircleGeometry(4.75, 40),
      new MeshBasicMaterial({
        color: 0x8fa4c0,
        transparent: true,
        opacity: 0.012,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.13;
    mainBlades.add(disc);
  }
  mainRotor.add(mainBlades);
  root.add(mainRotor);

  // —— 4.6 短翼与武器 ——
  let wb = makeBatch();
  // pods 保留挂舱引用（helicopter.js 发射导弹后隐藏）
  let pods = [];
  for (let s of [-1, 1]) {
    wb.add(MAT.body, boxG(1.4, 0.14, 0.6, s * 0.7 + s * 0.52, -0.05, -0.15, 0, 0, s * 0.035));
    wb.add(
      MAT.bodyDark,
      cylG(0.075, 0.075, 1.4, 12, s * 0.7 + s * 0.52, -0.05, -0.45, 0, 0, Math.PI / 2),
    );
    wb.add(MAT.bodyDark, boxG(0.14, 0.18, 0.5, s * 1.42 + s * 0.52, -0.1, -0.15));
    wb.add(MAT.body, ellipsoidG(0.18, 0.14, 0.32, 12, 10, s * 0.15 + s * 0.52, -0.05, -0.15));
    // 挂架
    wb.add(MAT.metalDark, boxG(0.12, 0.22, 0.4, s * 0.55 + s * 0.52, -0.25, -0.15));
    wb.add(MAT.metalDark, boxG(0.12, 0.22, 0.4, s * 1.05 + s * 0.52, -0.25, -0.15));

    // M261 19 管火箭巢
    let podX = s * 0.55 + s * 0.52,
      podY = -0.53,
      podZ = -0.15;
    wb.add(MAT.bodyDark, cylG(0.26, 0.28, 1.0, 20, podX, podY, podZ, Math.PI / 2));
    wb.add(MAT.metalDark, cylG(0.26, 0.26, 0.05, 20, podX, podY, podZ - 0.5, Math.PI / 2));
    wb.add(MAT.metalDark, cylG(0.28, 0.28, 0.05, 20, podX, podY, podZ + 0.5, Math.PI / 2));
    // 19 管端面（1 + 6 + 12），用一个 group 承载 InstancedMesh
    let podGrp = new Group();
    podGrp.name = "rocketPod";
    podGrp.position.set(podX, podY, podZ);
    {
      let layout = [[0, 0]];
      for (let k = 0; k < 6; k++) {
        let ang = (k * Math.PI) / 3;
        layout.push([Math.cos(ang) * 0.09, Math.sin(ang) * 0.09]);
      }
      for (let k = 0; k < 12; k++) {
        let ang = (k * Math.PI) / 6;
        layout.push([Math.cos(ang) * 0.18, Math.sin(ang) * 0.18]);
      }
      let tubeGeo = new CylinderGeometry(0.034, 0.034, 0.06, 8);
      tubeGeo.rotateX(Math.PI / 2);
      let inst = new InstancedMesh(tubeGeo, MAT.rocket, 19);
      inst.castShadow = false;
      inst.receiveShadow = false;
      let dummy = new Object3D();
      layout.forEach((p, idx) => {
        dummy.position.set(p[0], p[1], -0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        inst.setMatrixAt(idx, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      podGrp.add(inst);
      pods.push(podGrp);
    }
    root.add(podGrp);

    // M299 四联装地狱火挂架
    let rackX = s * 1.05 + s * 0.52,
      rackY = -0.53,
      rackZ = -0.15;
    wb.add(MAT.metalDark, boxG(0.3, 0.06, 0.55, rackX, rackY + 0.1, rackZ));
    wb.add(MAT.metalDark, boxG(0.04, 0.16, 0.5, rackX, rackY + 0.02, rackZ));
    for (let ox of [-0.08, 0.08]) {
      for (let oz of [-0.15, 0.15]) {
        let mx = rackX + ox,
          my = rackY - 0.04,
          mz = rackZ + oz;
        wb.add(MAT.missile, cylG(0.055, 0.055, 1.15, 12, mx, my, mz, Math.PI / 2));
        wb.add(MAT.metalDark, cylG(0.005, 0.055, 0.18, 12, mx, my, mz - 0.66, Math.PI / 2));
        wb.add(MAT.metalDark, cylG(0.062, 0.062, 0.035, 12, mx, my, mz + 0.08, Math.PI / 2));
        wb.add(MAT.metalDark, cylG(0.04, 0.05, 0.05, 10, mx, my, mz + 0.59, Math.PI / 2));
        // 4 片尾翼
        for (let k = 0; k < 4; k++) {
          let a = (k * Math.PI) / 2,
            fin = boxG(0.018, 0.16, 0.14, 0, 0, 0);
          fin.rotateZ(a);
          let off = new Vector3(0, 0.08, 0).applyAxisAngle(new Vector3(0, 0, 1), a);
          fin.translate(mx + off.x, my + off.y, mz + 0.52);
          wb.add(MAT.metalDark, fin);
        }
      }
    }
    // 翼尖航行灯
    let nav = new Mesh(new SphereGeometry(0.035, 8, 6), s > 0 ? MAT.navGreen : MAT.navRed);
    nav.castShadow = false;
    nav.position.set(s * 1.47 + s * 0.52, -0.1, -0.43);
    root.add(nav);
  }
  root.add(wb.build("wings"));

  // —— 4.7 发动机短舱 ——
  let eb = makeBatch();
  for (let s of [-1, 1]) {
    let ex = s * 0.42,
      ey = 0.3,
      ez = 0.55;
    eb.add(MAT.body, cylG(0.24, 0.28, 1.15, 18, ex, ey, ez, Math.PI / 2));
    eb.add(MAT.metalDark, cylG(0.23, 0.24, 0.14, 18, ex, ey, ez - 0.64, Math.PI / 2));
    // 进气风扇
    for (let k = 0; k < 6; k++) {
      let a = (k * Math.PI) / 3,
        blade = boxG(0.15, 0.012, 0.05, 0, 0, 0);
      blade.rotateZ(a);
      let off = new Vector3(0.07, 0, 0).applyAxisAngle(new Vector3(0, 0, 1), a);
      blade.translate(ex + off.x, ey + off.y, ez - 0.68);
      eb.add(MAT.metalLight, blade);
    }
    eb.add(MAT.metalDark, cylG(0.1, 0.1, 0.05, 14, ex, ey, ez - 0.71, Math.PI / 2));
    // 排气口（上翘 + 红外抑制）
    eb.add(MAT.metalDark, cylG(0.17, 0.14, 0.3, 14, ex, ey + 0.06, ez + 0.72, Math.PI / 2 + 0.28));
    eb.add(MAT.metalDark, boxG(0.22, 0.08, 0.12, ex, ey + 0.16, ez + 0.84, 0.28));
    eb.add(MAT.metal, cylG(0.12, 0.12, 0.04, 12, ex, ey + 0.18, ez + 0.9, Math.PI / 2 + 0.28));
    eb.add(MAT.bodyDark, boxG(0.1, 0.18, 0.85, ex + s * -0.2, ey - 0.12, ez));
    eb.add(MAT.bodyPanel, boxG(0.14, 0.02, 0.3, ex, ey + 0.26, ez + 0.1));
  }
  root.add(eb.build("engines"));

  // —— 4.8 机头传感器 + M230 机炮 ——
  let nb = makeBatch();
  // TADS
  nb.add(MAT.metalDark, cylG(0.16, 0.18, 0.1, 14, 0, -0.17, -2.3));
  nb.add(MAT.metal, ellipsoidG(0.17, 0.17, 0.2, 16, 12, 0, -0.24, -2.3));
  nb.add(MAT.metalDark, cylG(0.075, 0.075, 0.04, 14, 0, -0.24, -2.49, Math.PI / 2));
  nb.add(MAT.metalDark, cylG(0.05, 0.05, 0.03, 12, 0.14, -0.24, -2.3, 0, 0, Math.PI / 2));
  nb.add(MAT.metalDark, cylG(0.06, 0.06, 0.03, 12, 0, -0.39, -2.28));
  // M230 链炮
  nb.add(MAT.metalDark, cylG(0.14, 0.16, 0.12, 14, 0, -0.4, -1.55));
  nb.add(MAT.metal, boxG(0.17, 0.17, 0.38, 0, -0.47, -1.59));
  nb.add(MAT.metalDark, cylG(0.032, 0.042, 0.82, 10, 0, -0.47, -2.19, Math.PI / 2));
  nb.add(MAT.metalDark, cylG(0.055, 0.055, 0.1, 10, 0, -0.47, -2.62, Math.PI / 2));
  nb.add(MAT.metalDark, boxG(0.08, 0.1, 0.24, 0.13, -0.44, -1.43));
  nb.add(MAT.metalDark, boxG(0.04, 0.08, 0.2, 0, -0.47, -1.95));
  // 机腹双联发射巢（helicopter.js 的导弹从这里射出）
  nb.add(MAT.bodyDark, boxG(0.44, 0.16, 0.55, 0, -0.5, 0.15));
  nb.add(MAT.metalDark, cylG(0.06, 0.06, 0.5, 10, -0.11, -0.48, 0.35, 0, 0, Math.PI / 2));
  nb.add(MAT.metal, cylG(0.07, 0.07, 0.42, 12, -0.1, -0.5, -0.1, Math.PI / 2));
  nb.add(MAT.metal, cylG(0.07, 0.07, 0.42, 12, 0.1, -0.5, -0.1, Math.PI / 2));
  nb.add(MAT.metalDark, cylG(0.072, 0.072, 0.03, 12, -0.1, -0.5, -0.3, Math.PI / 2));
  nb.add(MAT.metalDark, cylG(0.072, 0.072, 0.03, 12, 0.1, -0.5, -0.3, Math.PI / 2));
  // 天线
  nb.add(MAT.metalDark, cylG(0.007, 0.007, 0.45, 6, 0.18, 0.75, 0.9, 0, 0, -0.18));
  nb.add(MAT.metalDark, cylG(0.007, 0.007, 0.35, 6, -0.22, -0.62, 0.65, 0, 0, 0.22));
  root.add(nb.build("nose"));

  // —— 4.9 起落架 ——
  let gb = makeBatch();
  for (let s of [-1, 1]) {
    let gx = s * 0.48,
      gy = -0.55,
      gz = 0.3;
    gb.add(MAT.metal, cylG(0.045, 0.055, 0.62, 10, gx, gy - 0.31, gz));
    gb.add(MAT.metalDark, cylG(0.065, 0.065, 0.18, 10, gx, gy - 0.15, gz));
    gb.add(MAT.metalLight, cylG(0.03, 0.03, 0.28, 8, gx, gy - 0.62, gz, 0, 0, Math.PI / 2));
    gb.add(MAT.tire, cylG(0.16, 0.16, 0.13, 16, gx, gy - 0.62, gz, 0, 0, Math.PI / 2));
    gb.add(MAT.metalDark, cylG(0.085, 0.085, 0.15, 10, gx, gy - 0.62, gz, 0, 0, Math.PI / 2));
    gb.add(MAT.metalLight, cylG(0.06, 0.06, 0.02, 10, gx + s * 0.08, gy - 0.62, gz, 0, 0, Math.PI / 2));
    gb.add(
      MAT.metal,
      strutG([gx + s * 0.12, gy - 0.08, gz + 0.5], [gx, gy - 0.62, gz], 0.022, 0.022, 6),
    );
  }
  // 尾轮
  gb.add(MAT.metal, cylG(0.025, 0.035, 0.32, 8, 0, -0.18, 4.75));
  gb.add(MAT.tire, cylG(0.085, 0.085, 0.08, 12, 0, -0.34, 4.75, 0, 0, Math.PI / 2));
  gb.add(MAT.metalDark, cylG(0.045, 0.045, 0.1, 10, 0, -0.34, 4.75, 0, 0, Math.PI / 2));
  root.add(gb.build("gear"));

  // —— 4.10 闪烁灯（保留独立 mesh 以便动画）——
  let beacon = new Mesh(new SphereGeometry(0.05, 8, 6), MAT.beacon.clone());
  beacon.castShadow = false;
  beacon.position.set(0, 2.0, 6.15);
  root.add(beacon);
  let bellyBeacon = new Mesh(new SphereGeometry(0.04, 8, 6), MAT.beacon.clone());
  bellyBeacon.castShadow = false;
  bellyBeacon.position.set(0, -0.68, -0.1);
  root.add(bellyBeacon);

  // —— 4.11 机腹探照灯灯泡（配合 M3 的 SpotLight 定位）——
  let bulb = new Mesh(
    new SphereGeometry(0.075, 10, 8),
    new MeshBasicMaterial({ color: 0xfff0c0 }),
  );
  bulb.castShadow = false;
  bulb.position.set(0, -0.56, -0.75);
  root.add(bulb);

  root.traverse((o) => {
    if (o.isMesh || o.isInstancedMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });

  return {
    root,
    mainRotor,
    mainBlades,
    tailRotor,
    pods,
    beacon,
    bellyBeacon,
    bulb,
    /** 旋翼转动（主旋翼绕 Y，尾桨绕 Z） */
    spin(dt, speed) {
      let s = speed || 18;
      if (mainBlades) mainBlades.rotation.y += dt * s;
      if (tailRotor) tailRotor.rotation.z += dt * s * 1.6;
    },
    /** 机体倾斜（前俯/侧倾），不影响 yaw */
    tilt(pitch, roll) {
      root.rotation.x = pitch || 0;
      root.rotation.z = roll || 0;
    },
  };
}

/** 单枚地狱火外形（供 heli-model 旧接口与 missile.js 复用） */
function buildMissileMesh(bodyMat, tipMat) {
  bodyMat =
    bodyMat ||
    new MeshStandardMaterial({ color: MISSILE_COL, roughness: 0.52, metalness: 0.48 });
  tipMat = tipMat || new MeshBasicMaterial({ color: 0x7a1a1a });
  let g = new Group();
  let body = new Mesh(new CylinderGeometry(0.055, 0.055, 1.15, 12), bodyMat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  let tip = new Mesh(new ConeGeometry(0.055, 0.18, 12), tipMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = -0.66;
  g.add(tip);
  for (let i = 0; i < 4; i++) {
    let a = (i * Math.PI) / 2,
      fin = new Mesh(new BoxGeometry(0.018, 0.16, 0.14), bodyMat);
    fin.rotation.z = a;
    fin.geometry.translate(0, 0.08, 0);
    fin.position.z = 0.52;
    g.add(fin);
  }
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return g;
}

export { buildApache, buildMissileMesh, buildHelicopterCompat };

// 旧接口名兼容：helicopter.js 以 buildHelicopter 调用
function buildHelicopterCompat() {
  return buildApache();
}
