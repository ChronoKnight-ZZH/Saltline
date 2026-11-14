// 敌人红色轮廓外圈（inverted hull / 背面放大描边）。
// 两个硬性要求：
//   1) 视角内可见 —— 外壳挂在 enemy.group 下，Three.js 默认 frustumCulled，
//      group 离开相机视锥时整棵子树（含轮廓）不渲染，天然满足。
//   2) 视距裁剪 —— 每帧按敌人到相机距离 fade：超过 MAX_DIST 隐藏，
//      [FADE_START, MAX_DIST] 区间透明度线性渐隐。
// 实现：克隆敌人 group 下所有 Mesh/SkinnedMesh，换红色 BackSide 材质；
// SkinnedMesh 共享原 skeleton 以跟随骨骼动画；外壳整体放大 PAD 倍形成描边厚度。
import {
  BackSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  SkinnedMesh,
  Vector3,
} from "../vendor/three-r180.js";

var OUTLINE_COLOR = 0xff3030;
var MAX_DIST = 60;     // 超过此距离完全不显示轮廓
var FADE_START = 45;   // 从该距离开始渐隐
var PAD = 1.07;        // 外壳放大倍率（描边厚度）

function createEnemyOutline(context) {
  // enemy -> { root, mat }
  let entries = new Map();
  let tmp = new Vector3();

  function buildFor(enemy) {
    let src = enemy.group;
    if (!src) return null;
    let mat = new MeshBasicMaterial({
      color: OUTLINE_COLOR,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    let root = new Group();
    root.name = "enemy-outline";
    src.traverse((o) => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      let m;
      if (o.isSkinnedMesh) {
        m = new SkinnedMesh(o.geometry, mat);
        m.bind(o.skeleton, o.bindMatrix);
      } else {
        m = new Mesh(o.geometry, mat);
      }
      m.position.copy(o.position);
      m.rotation.copy(o.rotation);
      m.scale.copy(o.scale).multiplyScalar(PAD);
      m.frustumCulled = true;
      root.add(m);
    });
    src.add(root);
    return { root, mat };
  }

  function camera() {
    return (
      (context.render && context.render.camera) ||
      (context.camera) ||
      null
    );
  }

  function update() {
    let cam = camera();
    let list = (context.enemies && context.enemies.list) || [];
    let seen = new Set();

    for (let enemy of list) {
      if (!enemy || !enemy.alive || !enemy.active || !enemy.group) continue;
      if (enemy.group.visible === false) continue;
      seen.add(enemy);

      let e = entries.get(enemy);
      if (!e) {
        e = buildFor(enemy);
        if (!e) continue;
        entries.set(enemy, e);
      }
      // 视距裁剪：距离 fade
      tmp.copy(enemy.group.position);
      let d = cam ? tmp.distanceTo(cam.position) : 0;
      if (d > MAX_DIST) {
        e.root.visible = false;
      } else {
        e.root.visible = true;
        let t = 1 - (d - FADE_START) / (MAX_DIST - FADE_START);
        e.mat.opacity = Math.max(0, Math.min(1, t));
      }
    }

    // 清理死亡/回收的敌人外壳
    for (let [enemy, e] of entries) {
      if (!seen.has(enemy)) {
        if (e.root.parent) e.root.parent.remove(e.root);
        e.mat.dispose();
        entries.delete(enemy);
      }
    }
  }

  return {
    update,
    setColor(hex) {
      for (let e of entries.values()) e.mat.color.setHex(hex);
    },
    get MAX_DIST() { return MAX_DIST; },
    get FADE_START() { return FADE_START; },
  };
}

export { createEnemyOutline };
