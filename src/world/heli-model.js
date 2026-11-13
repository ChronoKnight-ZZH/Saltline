// 简版通用直升机模型 —— 仅作 apache-model.js 失败时的回退。
// 正式模型见 apache-model.js（AH-64，移植自 docs/阿帕奇武装直升机模型-升级版.html）。
// 结构：机身 / 驾驶舱 / 尾梁尾桨 / 起落橇 / 旋转主旋翼 / 导弹挂舱。
// 用普通 Group + Mesh（与敌人骨骼 SkinnedMesh 不同，便于独立挂载和验证 Demo 复用）。
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "../vendor/three-r180.js";
import { beveledBoxGeometry, cylinderGeometry, mergeGeometries } from "../core/geometry.js";

var HULL = 0x2b3038;      // 机体主色（暗钢灰）
var TRIM = 0x3d4752;      // 尾梁/起落橇
var GLASS = 0x7fb2d4;     // 驾驶舱玻璃
var ROTOR = 0x14181c;     // 旋翼
var MISSILE = 0x6b7078;   // 弹体
var TIP = 0xc4452f;       // 弹头红

function buildHelicopter() {
  let root = new Group();
  root.name = "heli";

  let hullMat = new MeshStandardMaterial({ color: HULL, roughness: 0.6, metalness: 0.35 });
  let trimMat = new MeshStandardMaterial({ color: TRIM, roughness: 0.7, metalness: 0.3 });
  let glassMat = new MeshStandardMaterial({
    color: GLASS, roughness: 0.15, metalness: 0.6,
    transparent: true, opacity: 0.75,
  });
  let rotorMat = new MeshStandardMaterial({ color: ROTOR, roughness: 0.5, metalness: 0.5 });
  let missileMat = new MeshStandardMaterial({ color: MISSILE, roughness: 0.4, metalness: 0.7 });
  let tipMat = new MeshBasicMaterial({ color: TIP });

  // —— 机身（略椭球舱体）——
  let body = new Mesh(new SphereGeometry(1.1, 20, 16), hullMat);
  body.scale.set(1.0, 0.92, 1.7);
  root.add(body);

  // —— 驾驶舱玻璃（前部）——
  let canopy = new Mesh(new SphereGeometry(0.78, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), glassMat);
  canopy.position.set(0, 0.12, 1.25);
  canopy.rotation.x = -0.35;
  canopy.scale.set(1.0, 0.85, 1.0);
  root.add(canopy);

  // —— 尾梁 ——
  let boom = new Mesh(new CylinderGeometry(0.18, 0.28, 3.4, 12), trimMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.25, -2.9);
  root.add(boom);

  // —— 尾桨（竖直小桨）——
  let tailFin = new Mesh(new BoxGeometry(0.08, 0.9, 0.5), trimMat);
  tailFin.position.set(0, 0.7, -4.4);
  root.add(tailFin);
  let tailRotor = new Group();
  let tailBlade = new Mesh(new BoxGeometry(0.06, 1.1, 0.12), rotorMat);
  tailRotor.add(tailBlade);
  tailRotor.position.set(0.18, 0.6, -4.4);
  root.add(tailRotor);

  // —— 起落橇 ——
  for (let side of [-1, 1]) {
    let skid = new Mesh(new CylinderGeometry(0.05, 0.05, 2.6, 8), trimMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(side * 0.75, -0.95, 0.1);
    root.add(skid);
    let strutF = new Mesh(new CylinderGeometry(0.04, 0.04, 0.55, 6), trimMat);
    strutF.position.set(side * 0.6, -0.6, 0.8);
    root.add(strutF);
    let strutB = strutF.clone();
    strutB.position.set(side * 0.6, -0.6, -0.6);
    root.add(strutB);
  }

  // —— 主旋翼（顶部旋转组）——
  let mast = new Mesh(new CylinderGeometry(0.07, 0.07, 0.5, 8), trimMat);
  mast.position.set(0, 0.95, 0);
  root.add(mast);
  let mainRotor = new Group();
  mainRotor.position.set(0, 1.2, 0);
  for (let i = 0; i < 4; i++) {
    let blade = new Mesh(new BoxGeometry(4.4, 0.04, 0.22), rotorMat);
    blade.rotation.y = (i / 4) * Math.PI * 2;
    // 桨叶沿径向伸出：绕 y 转后需把几何沿 x 平移一半
    blade.geometry = blade.geometry.clone();
    blade.geometry.translate(2.2, 0, 0);
    mainRotor.add(blade);
  }
  root.add(mainRotor);

  // —— 两侧导弹挂舱 ——
  let pods = [];
  for (let side of [-1, 1]) {
    let pod = new Group();
    pod.position.set(side * 1.15, -0.15, 0.3);
    let rail = new Mesh(new BoxGeometry(0.3, 0.25, 1.3), trimMat);
    pod.add(rail);
    // 挂舱内两枚待发导弹（发射后隐藏）
    for (let j = 0; j < 2; j++) {
      let m = buildMissileMesh(missileMat, tipMat);
      m.position.set(0, -0.18, 0.4 - j * 0.7);
      pod.add(m);
    }
    root.add(pod);
    pods.push(pod);
  }

  // —— 机腹探照灯（小发光球，配合 M3 SpotLight）——
  let lamp = new Mesh(
    new SphereGeometry(0.14, 10, 8),
    new MeshBasicMaterial({ color: 0xfff2c8 }),
  );
  lamp.position.set(0, -0.85, 0.6);
  root.add(lamp);

  // 每个 mesh 设 shadow（主旋翼不投影，太大）
  root.traverse((o) => {
    if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; }
  });

  return {
    root,
    mainRotor,
    tailRotor,
    pods,
    /** 旋翼转动 */
    spin(dt, speed) {
      mainRotor.rotation.y += dt * (speed || 18);
      tailRotor.rotation.z += dt * (speed || 18) * 1.6;
    },
    /** 机体轻微倾斜（前俯/侧倾） */
    tilt(pitch, roll) {
      root.rotation.x = pitch || 0;
      root.rotation.z = roll || 0;
    },
  };
}

/** 单枚导弹几何（供挂舱与飞行体复用） */
function buildMissileMesh(bodyMat, tipMat) {
  bodyMat = bodyMat || new MeshStandardMaterial({ color: MISSILE, roughness: 0.4, metalness: 0.7 });
  tipMat = tipMat || new MeshBasicMaterial({ color: TIP });
  let g = new Group();
  // 弹体：细圆柱，沿 +Z 指向前方
  let body = new Mesh(new CylinderGeometry(0.08, 0.08, 1.0, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  // 弹头：圆锥
  let tip = new Mesh(new ConeGeometry(0.08, 0.28, 8), tipMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.62;
  g.add(tip);
  // 尾翼
  for (let i = 0; i < 4; i++) {
    let fin = new Mesh(new BoxGeometry(0.02, 0.22, 0.18), bodyMat);
    fin.position.z = -0.45;
    fin.rotation.z = (i / 4) * Math.PI * 2;
    fin.position.x = Math.cos((i / 4) * Math.PI * 2) * 0.1;
    fin.position.y = Math.sin((i / 4) * Math.PI * 2) * 0.1;
    g.add(fin);
  }
  return g;
}

export { buildHelicopter, buildMissileMesh };
