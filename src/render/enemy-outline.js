// 敌人红色轮廓（inverted hull / 背面描边）。
//
// 作法：给敌人每个"实心"网格在**原父节点**下挂一层红色 BackSide 外壳，外壳顶点在
// 顶点着色器里按屏幕像素定宽外扩，于是无论 3m 还是 40m，描边都是同一个粗细（2~3px），
// 不会近处糊成一坨、远处细到看不见。
//
// 三个必须记住的坑：
//   a) 敌人对象上**没有** enemy.group，模型根是 enemy.rig.group（见 walker.js /
//      drone.js 的 rig 字段）。曾经写成 enemy.group，外壳一个都没生成。
//   b) **不能靠缩放外壳**做厚度：SkinnedMesh 在 AttachedBindMode 下每帧把
//      bindMatrixInverse 重算为自身世界矩阵的逆，顶点最终回到世界空间，
//      `mesh.scale` 被完全抵消 —— 外壳与本体严格重合，本体不给侧面就一条边都看不到。
//      （早期版本"桨盘整片红、本体没轮廓"就是这个原因。）
//   c) 发光/透明件（glow、lens、桨盘糊影 disc、光锥 cone、贴花）不能参与描边，
//      否则红边会变成一圈红色光斑或整片红盘。做法：按 geometry.groups 对应材质判断，
//      材质 `transparent === true` 或 `name === "emissive"` 的三角形直接不拷进外壳几何体。
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  SkinnedMesh,
  Vector3,
} from "../vendor/three-r180.js";

var OUTLINE_COLOR = 0xff3030;
var OUTLINE_PX = 2.4;  // 描边宽度（CSS 像素），屏幕空间定宽
var MAX_DIST = 60;     // 超过此距离完全不显示轮廓
var FADE_START = 48;   // 从该距离开始渐隐（保证 50m 左右还能看见轮廓）

function createEnemyOutline(context) {
  // enemy -> { hulls, mat }
  let entries = new Map();
  let tmp = new Vector3();
  // 原始几何体 -> 外壳几何体（null 表示全是发光/透明件，不需要描边）
  let geoCache = new WeakMap();
  // onBeforeCompile 里拿到的那份 shader，用来每帧同步视口高度
  let shaderRef = null;

  function groupOf(enemy) {
    let rig = enemy && enemy.rig,
      g = rig && rig.group;
    return g && g.isObject3D ? g : null;
  }

  // 只有不透明的非发光材质才描边
  function solidMaterial(m) {
    return !!m && m.transparent !== true && m.name !== "emissive";
  }

  // 顶点级掩码：这个顶点是否属于实心分组
  function solidMask(geometry, material) {
    let count = geometry.attributes.position.count,
      mask = new Uint8Array(count),
      any = false;
    let mats = Array.isArray(material) ? material : [material];
    if (geometry.groups && geometry.groups.length) {
      for (let g of geometry.groups) {
        if (!solidMaterial(mats[g.materialIndex])) continue;
        let end = Math.min(count, g.start + g.count);
        for (let i = g.start; i < end; i++) {
          mask[i] = 1;
          any = true;
        }
      }
    } else if (solidMaterial(mats[0])) {
      mask.fill(1);
      any = true;
    }
    return any ? mask : null;
  }

  // 只保留实心三角形的几何体副本（保留 skinIndex / skinWeight 等全部属性，
  // 蒙皮管线照旧工作）。
  function hullGeometry(src, mask) {
    let attrs = src.attributes,
      names = Object.keys(attrs),
      count = attrs.position.count;

    if (src.index) {
      // 敌人模型目前都是 mergeGeometries(non-indexed) 出来的；
      // 万一遇到索引几何体，退化成整块外壳（贴花这类本来就会被掩码挡掉）。
      let g = src.clone();
      (g.clearGroups(), g.computeBoundingSphere());
      return g;
    }

    let total = 0;
    for (let i = 0; i < count; i += 3) if (mask[i]) total += 3;
    let out = new BufferGeometry();
    for (let name of names) {
      let a = attrs[name],
        itemSize = a.itemSize,
        arr = new a.array.constructor(total * itemSize),
        w = 0;
      for (let i = 0; i < count; i += 3) {
        if (!mask[i]) continue;
        for (let v = 0; v < 3; v++)
          for (let c = 0; c < itemSize; c++)
            arr[w++] = a.array[(i + v) * itemSize + c];
      }
      out.setAttribute(
        name,
        new BufferAttribute(arr, itemSize, a.normalized),
      );
    }
    (out.clearGroups(), out.computeBoundingSphere());
    return out;
  }

  function cachedHull(geometry, material) {
    if (geoCache.has(geometry)) return geoCache.get(geometry);
    let mask = solidMask(geometry, material);
    let result = mask ? hullGeometry(geometry, mask) : null;
    if (result && !result.attributes.normal) result.computeVertexNormals();
    geoCache.set(geometry, result);
    return result;
  }

  function outlineMaterial() {
    let mat = new MeshBasicMaterial({
      color: OUTLINE_COLOR,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    // 屏幕空间定宽：把顶点沿"视图空间法线在屏幕上的投影方向"外推固定像素数。
    // 背面外壳只在外轮廓处有横向法线，所以加粗的正好是那圈边，
    // 而不会像世界空间膨胀那样近处把细零件整根吞掉。
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uOutlinePx = { value: OUTLINE_PX };
      shader.uniforms.uViewportH = { value: 960 };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uOutlinePx;\nuniform float uViewportH;",
        )
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
{
  vec3 viewNormal;
  #ifdef USE_SKINNING
    viewNormal = transformedNormal;
  #else
    viewNormal = normalize( normalMatrix * normal );
  #endif
  vec2 dir = viewNormal.xy;
  float len = length( dir );
  if ( len > 1e-4 ) {
    // clip 空间偏移 k * w 后，屏幕上正好是 uOutlinePx 个像素
    float k = 2.0 * uOutlinePx / max( uViewportH, 1.0 );
    gl_Position.xy += ( dir / len ) * k * gl_Position.w;
  }
}`,
        );
      shaderRef = shader;
    };
    return mat;
  }

  function buildFor(enemy) {
    let src = groupOf(enemy);
    if (!src) return null;
    let mat = outlineMaterial();
    // 先收集再挂载：traverse 期间往 children 里塞对象会污染遍历。
    let targets = [];
    src.traverse((o) => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      if (o.userData && o.userData.enemyOutline) return;
      targets.push(o);
    });
    let hulls = [];
    for (let o of targets) {
      if (!o.parent) continue;
      let geo = cachedHull(o.geometry, o.material);
      if (!geo) continue; // 全是发光/透明件（桨盘糊影、光锥、贴花）
      let m;
      if (o.isSkinnedMesh) {
        m = new SkinnedMesh(geo, mat);
        m.bindMode = o.bindMode;
        m.bind(o.skeleton, o.bindMatrix);
      } else {
        m = new Mesh(geo, mat);
      }
      m.name = "enemy-outline";
      m.userData.enemyOutline = true;
      // 变换与本体完全一致：厚度由着色器给，不缩放（见文件头 b 条）
      m.position.copy(o.position);
      m.quaternion.copy(o.quaternion);
      m.scale.copy(o.scale);
      (m.castShadow = false), (m.receiveShadow = false);
      // 蒙皮后的实际体积与静态包围球不一致，交给可见性 + 视距控制开销
      m.frustumCulled = false;
      m.renderOrder = o.renderOrder;
      // 挂到原网格的父节点：保留层级，骨骼动画一并跟随
      o.parent.add(m);
      hulls.push(m);
    }
    return hulls.length ? { hulls, mat } : null;
  }

  function setVisible(e, visible) {
    for (let h of e.hulls) h.visible = visible;
  }

  function dispose(e) {
    for (let h of e.hulls) if (h.parent) h.parent.remove(h);
    e.hulls.length = 0;
    e.mat.dispose();
  }

  function camera() {
    return (context.render && context.render.camera) || context.camera || null;
  }

  function viewportHeight() {
    let el =
      (context.renderer && context.renderer.domElement) ||
      (context.render && context.render && context.render.domElement) ||
      null;
    return el && el.clientHeight ? el.clientHeight : 960;
  }

  function update() {
    let cam = camera();
    let list = (context.enemies && context.enemies.list) || [];
    let seen = new Set();

    for (let enemy of list) {
      if (!enemy || !enemy.alive || !enemy.active) continue;
      let src = groupOf(enemy);
      if (!src || src.visible === false) continue;
      seen.add(enemy);

      let e = entries.get(enemy);
      if (!e) {
        e = buildFor(enemy);
        if (!e) continue;
        entries.set(enemy, e);
      }
      // 视距裁剪
      tmp.copy(src.position);
      let d = cam ? tmp.distanceTo(cam.position) : 0;
      if (d > MAX_DIST) {
        setVisible(e, false);
      } else {
        setVisible(e, true);
        let t = 1 - (d - FADE_START) / (MAX_DIST - FADE_START);
        e.mat.opacity = Math.max(0, Math.min(1, t));
      }
    }

    if (shaderRef)
      shaderRef.uniforms.uViewportH.value = viewportHeight();

    // 清理死亡/回收的敌人外壳
    for (let [enemy, e] of entries) {
      if (!seen.has(enemy)) {
        dispose(e);
        entries.delete(enemy);
      }
    }
  }

  return {
    update,
    setColor(hex) {
      for (let e of entries.values()) e.mat.color.setHex(hex);
    },
    get MAX_DIST() {
      return MAX_DIST;
    },
    get FADE_START() {
      return FADE_START;
    },
  };
}

export { createEnemyOutline };
