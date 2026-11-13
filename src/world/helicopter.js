// M3: night-clear helicopter spotlight. Orbits the player, sweeps a beam,
// exposes enemies/player through the beam, and drives a 3D rotor loop.
// Decided against M3.md 3.2: the beam keeps its own SpotLight instead of
// borrowing the pooled PointLights (SpotLight is not pooled, so it is safe).
import {
  CircleGeometry,
  ConeGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SpotLight,
  Vector3,
} from "../vendor/three-r180.js";
import { createRandom } from "../core/random.js";
import { damp, clamp } from "../core/math.js";
import { WORLD_BOUNDS } from "../core/config.js";
import { HELICOPTER_TUNING } from "../core/environment-presets.js";

var Y_AXIS = new Vector3(0, 1, 0);

var BEAM_COLOR = 0xfff2c8;

// 立即停止时音效淡出（秒）。改造文档 4.4 要求“立即停音效”，
// 0.12s 的淡出让 WebAudio 不会爆音，听觉上等同于立即停止。
var STOP_FADE = 0.12;

var tmpA = new Vector3();

var tmpC = new Vector3();

function orientCone(mesh, origin, dir, range, halfAngle) {
  tmpA.set(0, -1, 0).copy(dir).normalize();
  // 顶点在 origin（向下射：光圈朝下），几何高 = range
  mesh.position.copy(origin).addScaledVector(dir, -range / 2);
  mesh.scale.set(
    Math.tan(halfAngle) * range * 2,
    range,
    Math.tan(halfAngle) * range * 2,
  );
  tmpC.copy(Y_AXIS).cross(dir);
  if (tmpC.lengthSq() < 1e-8) tmpC.set(1, 0, 0);
  tmpC.normalize();
  mesh.quaternion.setFromAxisAngle(tmpC, Math.acos(-dir.y));
}

function createHelicopter(context) {
  let state = {
    enabled: false,
    active: false,
    pos: new Vector3(),
    yaw: 0,
    orbitA: 0,
    orbitR: HELICOPTER_TUNING.radius,
    height: HELICOPTER_TUNING.height,
    beamDir: new Vector3(),
    beamOrigin: new Vector3(),
    spotT: 0,
    lastSpot: new Map(),
    light: null,
    cone: null,
    decal: null,
    loop: null,
    audioT: 0,
  };

  // M3.md 3.3：rng 派生自 context.rng.fork()，固定 seed 下路径可复现。
  // 环境随机源已独立派生（M1），此处只消费一次 fork，不推进父序列
  // 也不会让光柱路径依赖其它系统的随机调用顺序。
  let rng = context.rng && context.rng.fork ? context.rng.fork() : createRandom();

  function setupLight() {
    if (state.light) return;
    state.light = new SpotLight(
      BEAM_COLOR,
      8,
      HELICOPTER_TUNING.beamRange,
      HELICOPTER_TUNING.beamHalfAngle,
      0.35,
      1.2,
    );
    // M3.md 3.8：不开阴影，光柱不需要投影
    state.light.castShadow = false;
    state.light.visible = false;
    context.scene.add(state.light);
    context.scene.add(state.light.target);
  }

  function setupCone(volumetric) {
    if (state.cone) return;
    let geo = new ConeGeometry(0.5, 1, 24, 1, true);
    // ConeGeometry 顶点在上、底在下；orientCone 会整体旋转。
    if (!volumetric) geo.translate(0, -0.5, 0);
    let mat = new MeshBasicMaterial({
      color: BEAM_COLOR,
      transparent: true,
      opacity: 0.07,
      blending: 1, // AdditiveBlending
      depthWrite: false,
      side: DoubleSide,
      fog: false,
    });
    state.cone = new Mesh(geo, mat);
    state.cone.visible = false;
    state.cone.frustumCulled = false;
    context.scene.add(state.cone);
  }

  function setupDecal() {
    if (state.decal) return;
    let geo = new CircleGeometry(1, 28);
    geo.rotateX(-Math.PI / 2);
    let mat = new MeshBasicMaterial({
      color: BEAM_COLOR,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      fog: false,
    });
    state.decal = new Mesh(geo, mat);
    state.decal.visible = false;
    state.decal.renderOrder = 2;
    context.scene.add(state.decal);
  }

  function setEnabled(on) {
    on = !!on;
    if (state.enabled === on) return;
    state.enabled = on;
    if (!on) {
      // M3.md 3.3：立即停——光柱隐藏、音效停、暴露清、光斑隐藏，不等 damp。
      state.active = false;
      if (state.cone) state.cone.visible = false;
      if (state.decal) state.decal.visible = false;
      if (state.light) {
        state.light.visible = false;
        state.light.intensity = 0;
      }
      if (state.loop) {
        try {
          state.loop.stop(STOP_FADE);
        } catch {}
        state.loop = null;
      }
      state.lastSpot.clear();
      if (context.events && context.events.emit) {
        context.events.emit("helicopter:spot", { targets: [] });
      }
      return;
    }
    state.active = true;
    state.orbitA = rng() * Math.PI * 2;
    let player = context.player;
    state.pos.set(
      (player && player.pos ? player.pos.x : 0) +
        Math.cos(state.orbitA) * state.orbitR,
      state.height,
      (player && player.pos ? player.pos.z : 0) +
        Math.sin(state.orbitA) * state.orbitR,
    );
    // 光柱方向：向下偏，绕 Y 随机方位，M3 不旋转
    state.beamDir
      .set(0.18, -1, 0)
      .normalize()
      .applyAxisAngle(Y_AXIS, rng() * Math.PI * 2);
    state.spotT = 0;
    state.lastSpot.clear();
    // 音效
    if (context.audio && context.audio.loop) {
      try {
        state.loop = context.audio.loop("helicopter", {
          pos: state.pos,
          gain: 0.7,
        });
      } catch {
        state.loop = null;
      }
    }
  }

  function update(dt) {
    if (!state.active) return;
    // M3.md 5：game:state 非 playing/showcase 冻结
    if (
      context.game &&
      context.game.state !== "playing" &&
      context.game.state !== "showcase"
    )
      return;
    let player = context.player;
    if (!player || !player.pos) return;
    // 1. 盘旋：玩家为中心的圆，高度小幅起伏
    state.orbitA += HELICOPTER_TUNING.speed * dt;
    let targetX = player.pos.x + Math.cos(state.orbitA) * state.orbitR;
    let targetZ = player.pos.z + Math.sin(state.orbitA) * state.orbitR;
    let targetY = state.height + Math.sin(state.orbitA * 2.3) * 1.5;
    state.pos.x = damp(state.pos.x, targetX, 2, dt);
    state.pos.y = damp(state.pos.y, targetY, 2, dt);
    state.pos.z = damp(state.pos.z, targetZ, 2, dt);
    state.yaw = Math.atan2(player.pos.x - state.pos.x, player.pos.z - state.pos.z);
    // 2. 光柱几何
    state.beamOrigin.copy(state.pos);
    state.beamOrigin.y -= 0.5;
    if (state.light) {
      state.light.visible = true;
      state.light.position.copy(state.beamOrigin);
      state.light.target.position
        .copy(state.beamOrigin)
        .addScaledVector(state.beamDir, HELICOPTER_TUNING.beamRange);
      state.light.target.updateMatrixWorld();
    }
    if (state.cone) {
      state.cone.visible = true;
      orientCone(
        state.cone,
        state.beamOrigin,
        state.beamDir,
        HELICOPTER_TUNING.beamRange,
        HELICOPTER_TUNING.beamHalfAngle,
      );
    }
    if (state.decal) {
      let hit = context.physics.raycast(
        state.beamOrigin,
        state.beamDir,
        HELICOPTER_TUNING.beamRange,
      );
      if (hit && hit.point) {
        state.decal.position.copy(hit.point);
        state.decal.position.y += 0.03;
        state.decal.visible = true;
      } else {
        state.decal.visible = false;
      }
    }
    // 3. 音效位置（10Hz / low 5Hz）
    state.audioT -= dt;
    if (state.audioT <= 0) {
      state.audioT =
        context.quality && context.quality.name === "low" ? 0.2 : 0.1;
      if (state.loop) {
        let mask =
          (context.environment &&
            context.environment.perception &&
            context.environment.perception.audioMask) ||
          0;
        try {
          state.loop.setPos(state.pos);
          // M3.md 3.4：雨声掩蔽降低音量
          state.loop.setGain(0.7 * (1 - clamp(mask, 0, 1) * 0.3));
        } catch {}
      }
    }
    // 4. 暴露扫描
    state.spotT -= dt;
    if (state.spotT <= 0) {
      let isLow = context.quality && context.quality.name === "low";
      state.spotT =
        HELICOPTER_TUNING.exposeInterval * (isLow ? 2 : 1);
      scanAndExpose();
    }
  }

  function isInBeam(targetPos) {
    if (!state.active || !targetPos) return false;
    // 1. 距离粗筛（0.3m 容差）
    tmpA.copy(targetPos).sub(state.beamOrigin);
    let dist = tmpA.length();
    if (dist > HELICOPTER_TUNING.beamRange + 0.3) return false;
    // 2. 零距离保护（目标在光源原点，无意义）
    if (dist < 1e-6) return false;
    // 3. 锥体判定
    tmpA.multiplyScalar(1 / dist);
    if (tmpA.dot(state.beamDir) < Math.cos(HELICOPTER_TUNING.beamHalfAngle))
      return false;
    // 4. LOS（physics.lineOfSight 内部有零距离保护，见 physics.js）
    return !!context.physics.lineOfSight(state.beamOrigin, targetPos);
  }

  function getSpotTargets() {
    let targets = [];
    if (!state.active) return targets;
    // 1. 敌人
    let list = context.enemies && context.enemies.list;
    if (Array.isArray(list)) {
      for (let enemy of list) {
        if (!enemy || !enemy.alive || !enemy.active) continue;
        if (enemy.pos && isInBeam(enemy.pos)) {
          targets.push({ type: "enemy", ref: enemy });
        }
      }
    }
    // 2. 玩家：eye 和 pos 两个点（站/蹲），覆盖更全
    let player = context.player;
    if (player && player.alive !== false) {
      let eye = player.eye || player.pos;
      let hit =
        (eye && isInBeam(eye)) || (player.pos && isInBeam(player.pos));
      if (hit) targets.push({ type: "player", ref: player });
    }
    return targets;
  }

  function beamIntersectsWorld() {
    // M3.md 3.7 简化粗筛：光束中点在 WORLD_BOUNDS Y 区间之外则跳过。
    // 盘旋高度 22、射程 45 时该条件恒为假，保留为低开销的防御性检查。
    let range = HELICOPTER_TUNING.beamRange;
    let midY = state.beamOrigin.y + state.beamDir.y * (range / 2);
    if (midY > WORLD_BOUNDS.max.y + range) return false;
    if (midY < WORLD_BOUNDS.min.y - range) return false;
    return true;
  }

  function scanAndExpose() {
    // 0. 粗筛：光柱与 WORLD_BOUNDS 相交
    if (!beamIntersectsWorld()) return;
    // 1. 收集光柱内目标
    let targets = getSpotTargets();
    if (!targets.length) {
      // 无目标也要派发（HUD 清空）
      if (context.events && context.events.emit) {
        context.events.emit("helicopter:spot", { targets: [] });
      }
      return;
    }
    // 2. 对称暴露
    let enemyIds = [];
    let enemies = context.enemies;
    let player = context.player;
    if (enemies && enemies.forceExpose) {
      for (let t of targets) {
        if (t.type === "enemy") {
          // 敌人被照到：写 lastKnown + investigate
          if (player && player.pos) {
            enemies.forceExpose(player.pos, "helicopter", t.ref);
          }
          if (t.ref && t.ref.id != null) enemyIds.push(t.ref.id);
        } else if (t.type === "player") {
          // 玩家被照到：所有 LOS 可达玩家的敌人 forceExpose
          let list = enemies.list;
          if (Array.isArray(list)) {
            for (let enemy of list) {
              if (!enemy || !enemy.alive || !enemy.active) continue;
              // M3.md 3.7：已交战的不降级
              if (enemy.mode === "engage") continue;
              if (
                context.physics.lineOfSight(
                  enemy.sensor || enemy.pos,
                  player.eye || player.pos,
                )
              ) {
                enemies.forceExpose(player.pos, "helicopter", enemy);
                enemyIds.push(enemy.id);
              }
            }
          }
        }
      }
    }
    // 3. 派发事件（HUD 订阅）
    if (context.events && context.events.emit) {
      context.events.emit("helicopter:spot", {
        targets: enemyIds.map((id) => ({ id })),
        playerExposed: targets.some((t) => t.type === "player"),
      });
    }
  }

  // 玩家死亡/重生清暴露（M3.md 5）
  if (context.events && context.events.on) {
    context.events.on("player:dead", () => {
      state.lastSpot.clear();
      if (context.events.emit) {
        context.events.emit("helicopter:spot", { targets: [] });
      }
    });
    context.events.on("player:rescued", () => {
      state.lastSpot.clear();
    });
  }

  // 初始化光束部件（惰性创建，避免 boot 阶段多余的对象）
  setupLight();
  let beamName = context.quality && context.quality.name;
  let volumetric = !!(
    context.quality && context.quality.envVolumetricBeam === true
  );
  setupCone(volumetric);
  setupDecal();

  return {
    get enabled() {
      return state.enabled;
    },
    get active() {
      return state.active;
    },
    get pos() {
      return state.pos;
    },
    get beam() {
      return {
        origin: state.beamOrigin,
        dir: state.beamDir,
        halfAngle: HELICOPTER_TUNING.beamHalfAngle,
        range: HELICOPTER_TUNING.beamRange,
      };
    },
    setEnabled,
    update,
    isInBeam,
    getSpotTargets,
    setModel(mesh) {
      // M3 占位：不接模型
    },
    debug: {
      state,
      lastSpotTimes() {
        return Array.from(state.lastSpot.entries()).map(([id, t]) => ({
          id,
          t,
        }));
      },
      beamName,
    },
  };
}

export { createHelicopter };
