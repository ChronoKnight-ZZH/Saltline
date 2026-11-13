// 非制导导弹飞行体：从发射点飞向【发射瞬间锁定的地面点】，不做追踪。
// 玩家反制 = 看见烟迹后跑出落点。落地回调负责爆炸（fx.explosion + combat.explode）。
import { Vector3 } from "../vendor/three-r180.js";
import { buildMissileMesh } from "./heli-model.js";

var UP = new Vector3(0, 1, 0);

function createMissile(context, opts) {
  // opts: { origin:Vector3, target:Vector3, speed, blastRadius, blastDamage, onImpact(pos) }
  let origin = opts.origin.clone();
  let target = opts.target.clone();
  let speed = opts.speed || 26;
  let dir = target.clone().sub(origin);
  let totalDist = dir.length();
  dir.normalize();

  let mesh = buildMissileMesh();
  mesh.position.copy(origin);
  // 让导弹朝向飞行方向
  let yaw = Math.atan2(dir.x, dir.z);
  let pitch = Math.asin(-dir.y);
  mesh.rotation.set(pitch, yaw, 0, "YXZ");
  if (context.scene) context.scene.add(mesh);

  let pos = origin.clone();
  let traveled = 0;
  let dead = false;
  // 烟迹：沿路径定期留小点（复用 effects 的 dust/tracer，这里用简单球池）
  let trail = [];
  let trailT = 0;
  let tmp = new Vector3();

  function spawnTrail() {
    if (!context.fx || typeof context.fx.dust !== "function") return;
    try {
      context.fx.dust(pos, { count: 2, size: 0.3, life: 0.6, color: 0xbbbbbb });
    } catch {}
  }

  function impact() {
    if (dead) return;
    dead = true;
    if (context.scene) context.scene.remove(mesh);
    // 视觉爆炸 + 派发 explosion 事件
    if (context.fx && typeof context.fx.explosion === "function") {
      try {
        context.fx.explosion(target, 1.6);
      } catch {}
    }
    // 范围伤害（对玩家 50% 衰减、LOS 判定由 combat.explode 内部处理）
    if (context.combat && typeof context.combat.explode === "function") {
      try {
        context.combat.explode(target, opts.blastRadius || 5, opts.blastDamage || 30, "helicopter");
      } catch {}
    }
    if (typeof opts.onImpact === "function") opts.onImpact(target);
  }

  return {
    get pos() { return pos; },
    get target() { return target; },
    get dead() { return dead; },
    get mesh() { return mesh; },
    update(dt) {
      if (dead) return true;
      let step = speed * dt;
      traveled += step;
      pos.addScaledVector(dir, step);
      mesh.position.copy(pos);
      // 烟迹
      trailT -= dt;
      if (trailT <= 0) { trailT = 0.05; spawnTrail(); }
      if (traveled >= totalDist) {
        impact();
        return true;
      }
      return false;
    },
    dispose() {
      if (context.scene) context.scene.remove(mesh);
      dead = true;
    },
  };
}

export { createMissile };
