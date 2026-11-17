// M3: night-clear helicopter spotlight. Orbits the player, sweeps a beam,
// exposes enemies/player through the beam, and drives a 3D rotor loop.
// Decided against M3.md 3.2: the beam keeps its own SpotLight instead of
// borrowing the pooled PointLights (SpotLight is not pooled, so it is safe).
import {
  AdditiveBlending,
  CircleGeometry,
  ConeGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  SpotLight,
  Vector3,
} from "../vendor/three-r180.js";
import { createRandom } from "../core/random.js";
import { damp, clamp } from "../core/math.js";
import { WORLD_BOUNDS } from "../core/config.js";
import { HELICOPTER_TUNING, HELI_COMBAT } from "../core/environment-presets.js";
// AH-64 阿帕奇模型（移植自 docs/阿帕奇武装直升机模型-升级版.html）。
// 旧版 heli-model.js 保留为回退，两者接口一致。
import { buildApache, buildHelicopterCompat } from "./apache-model.js";
import { createMissile } from "./missile.js";

var Y_AXIS = new Vector3(0, 1, 0);

var BEAM_COLOR = 0xfff2c8;

// 立即停止时音效淡出（秒）。改造文档 4.4 要求“立即停音效”，
// 0.12s 的淡出让 WebAudio 不会爆音，听觉上等同于立即停止。
var STOP_FADE = 0.12;

var tmpA = new Vector3();

var tmpB = new Vector3();

var tmpC = new Vector3();

// 角度插值（处理 ±π 环绕），让机头转向不跳变
function dampAngle(cur, target, lambda, dt) {
  let d =
    ((target - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) -
    Math.PI;
  return cur + d * Math.min(1, lambda * dt);
}

// 模型机头指向本地 -Z（apache-model 里雷达罩在 z=-2.65、尾桨在 z=+6.1）。
// atan2(vx, vz) 得到的偏航角是「本地 +Z 为前方」的约定，两者相差 180°；
// 少了这个偏移，机头就会朝机尾方向飞（即“飞行朝向是反的”）。
var MODEL_NOSE_OFFSET = Math.PI; // -180°

// 横卧 8 字巡逻航线（绕地图中心原点，不是绕玩家）：
//   x = R·sin t，z = R·sin t·cos t（z 向幅度减半，形成横 8 字）。
// 在上面叠三组慢速调制，让航线不会每圈重复：
//   · 半径呼吸（约 60s 周期，±10%）：一圈宽、一圈窄
//   · 巡航中心漂移（约 50–100s 周期）：整条 8 字在场地上来回平移
//   · 高度双级起伏（快摆 ±3.4m + 慢漂 ±2.2m）
// setEnabled（初始位置）与 update（每帧目标点）共用这一个函数，避免两处公式走偏。
function pathPoint(t, orbitR, height, out) {
  let sx = Math.sin(t),
    cz = Math.cos(t),
    radius = orbitR * (1 + 0.1 * Math.sin(t * 0.33 + 0.4));
  out.x = 5.0 * Math.sin(t * 0.11) + radius * sx;
  out.z =
    4.0 * Math.sin(t * 0.17 + 2.1) +
    radius * sx * cz +
    2.5 * Math.sin(t * 0.62 + 0.9);
  out.y = height + Math.sin(t * 2.0) * 3.4 + Math.sin(t * 0.45 + 1.4) * 2.2;
  return out;
}



// 把单位锥体（ConeGeometry(0.5, 1)：本地 y ∈ [-0.5, 0.5]，顶点在 +y）
// 摆放成「顶点落在 origin、底面中点在 origin + dir*range」的光锥。
//   · 顶点需在 origin  → mesh.position = origin + dir*(range/2)
//   · 本地 +Y 必须映射到 -dir（顶点朝后，底面朝 dir）→ 绕 (dir×Y) 轴转 acos(-dir·Y)
//   · 底面半径 = tan(halfAngle)*range，ConeGeometry 半径 0.5 → xz 缩放 2·tan·range
function orientCone(mesh, origin, dir, range, halfAngle) {
  mesh.position.copy(origin).addScaledVector(dir, range / 2);
  let r = Math.tan(halfAngle) * range;
  mesh.scale.set(r * 2, range, r * 2);
  tmpC.copy(dir).cross(Y_AXIS);
  let sinA = tmpC.length();
  if (sinA < 1e-8) {
    // dir 与 Y 平行：转 0（同向）或 π（反向），轴任取 X
    mesh.quaternion.setFromAxisAngle(
      tmpA.set(1, 0, 0),
      dir.y > 0 ? Math.PI : 0,
    );
    return;
  }
  // 归一化轴：dir×Y / |dir×Y|，角度 acos(-dir.y) 使 +Y → -dir
  mesh.quaternion.setFromAxisAngle(tmpC.multiplyScalar(1 / sinA), Math.acos(-dir.y));
}

function createHelicopter(context) {
  let state = {
    enabled: false,
    active: false,
    pos: new Vector3(),
    // 航线目标点在上一帧的值（只用来取切线方向；null = 首帧还没基准）
    targetX: null,
    targetZ: null,
    yaw: 0,
    orbitA: 0,
    trackT: 0,
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
    // —— 战斗状态机 ——
    mode: "patrol",        // patrol | alert | lock | engage | cooldown
    lockT: 0,              // 持续照住玩家的累计时长
    telegraphT: 0,         // 锁定后预警剩余
    volleyLeft: 0,         // 本轮剩余待发导弹
    volleyT: 0,            // 两弹间隔计时
    cooldownT: 0,          // 再次锁敌冷却
    lockPoint: new Vector3(), // 锁定瞬间的地面点（导弹落点，非追踪）
    missiles: [],
    model: null,
    modelSpin: 0,
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

  // 锥体几何所有画质共用；差别只在材质（volume 用加色叠加、否则普通半透明）。
  function setupCone(volumetric) {
    if (state.cone) return;
    let geo = new ConeGeometry(0.5, 1, 24, 1, true);
    let mat = new MeshBasicMaterial({
      color: BEAM_COLOR,
      transparent: true,
      opacity: volumetric ? 0.09 : 0.045,
      // 体积光柱用加色叠加（opacity 已相应降低以补偿叠加亮度）
      blending: volumetric ? AdditiveBlending : NormalBlending,
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
      // 停飞：清导弹、复位战斗状态、隐藏模型
      for (let m of state.missiles) {
        try { m.dispose(); } catch {}
      }
      state.missiles.length = 0;
      state.mode = "patrol";
      state.lockT = 0;
      state.volleyLeft = 0;
      state.cooldownT = 0;
      if (state.model) state.model.root.visible = false;
      if (context.events && context.events.emit) {
        context.events.emit("helicopter:spot", { targets: [] });
      }
      return;
    }
    state.active = true;
    ensureModel();
    if (state.model) state.model.root.visible = true;
    state.orbitA = rng() * Math.PI * 2;
    state.trackT = state.orbitA; // 8 字轨迹起始相位随机
    // 初始位置与目标点：都取航线在 trackT 处的解析点
    pathPoint(state.trackT, state.orbitR, state.height, tmpB);
    state.pos.set(tmpB.x, tmpB.y, tmpB.z);
    state.targetX = tmpB.x;
    state.targetZ = tmpB.z;
    // 初始机头直接对准航线切线，避免起飞瞬间机头乱摆一圈
    {
      let t0 = state.trackT;
      pathPoint(t0 + 1e-3, state.orbitR, state.height, tmpA);
      state.yaw =
        Math.atan2(tmpA.x - tmpB.x, tmpA.z - tmpB.z) + MODEL_NOSE_OFFSET;
    }
    // 光柱方向：向下偏，绕 Y 随机方位，M3 不旋转
    state.beamDir
      .set(0.18, -1, 0)
      .normalize()
      .applyAxisAngle(Y_AXIS, rng() * Math.PI * 2);
    state.spotT = 0;
    state.lastSpot.clear();
    // 音效（旋翼循环）：位置化 loop，靠近/远离由 PannerNode 距离衰减处理。
    // 音量 0.8 + 素材 peak 0.8：50m 斜距下 rms 约 0.09（≈ -21dBFS），
    // 能听清发动机/桨叶声，又不会盖过枪声与爆炸。
    if (context.audio && context.audio.loop) {
      try {
        state.loop = context.audio.loop("helicopter", {
          pos: state.pos,
          gain: 0.8,
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
    // 1. 航线：8 字 + 慢速调制（半径呼吸 / 中心漂移 / 高度起伏），公式在 pathPoint。
    //    巡航速度沿轨迹脉动；战斗锁定/齐射时减速；机头始终朝航线切线。
    let alertMul =
      state.mode === "lock" || state.mode === "engage"
        ? HELI_COMBAT.alertSpeedMul
        : 1;
    let speedK = 0.65 + 0.35 * Math.sin(state.trackT * 2.0); // 0.30~1.0 快慢交替
    let prevTargetX = state.targetX,
      prevTargetZ = state.targetZ;
    state.trackT +=
      dt * HELICOPTER_TUNING.speed * 0.18 * speedK * alertMul;
    pathPoint(state.trackT, state.orbitR, state.height, tmpB);
    let targetX = tmpB.x,
      targetY = tmpB.y,
      targetZ = tmpB.z;
    state.targetX = targetX;
    state.targetZ = targetZ;
    state.pos.x = damp(state.pos.x, targetX, 3.5, dt);
    state.pos.y = damp(state.pos.y, targetY, 3.5, dt);
    state.pos.z = damp(state.pos.z, targetZ, 3.5, dt);
    // 机头朝航线切线：用「目标点位移」而不是「机身位移」取方向，
    // 后者受 damp 拖尾影响、在急转处会突然偏出很大角度。
    // 模型前进轴是本地 -Z，所以再加 MODEL_NOSE_OFFSET（-180°）。
    if (prevTargetX != null) {
      let dTX = targetX - prevTargetX,
        dTZ = targetZ - prevTargetZ;
      if (dTX * dTX + dTZ * dTZ > 1e-6) {
        state.yaw = dampAngle(
          state.yaw,
          Math.atan2(dTX, dTZ) + MODEL_NOSE_OFFSET,
          8,
          dt,
        );
      }
    }

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
          // M3.md 3.4：雨声掩蔽降低音量（0.8 基准，与上面的创建音量保持一致）
          state.loop.setGain(0.8 * (1 - clamp(mask, 0, 1) * 0.3));
          // 发动机负载轻微起伏（±3% 回放速率）：避免 2s 循环听成死板嗡嗡声
          state.loop.setPitch(1 + 0.03 * Math.sin(state.trackT * 0.9 + 0.6));
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
    // 5. 战斗状态机
    updateCombat(dt, player);
    // 6. 模型
    updateModel(dt);
  }

  // —— 战斗状态机（docs/直升机单位设计.md）——
  // —— 模型 ——
  function ensureModel() {
    if (state.model || !context.scene) return;
    try {
      state.model = buildApache();
      context.scene.add(state.model.root);
    } catch (e) {
      console.error(
        "[helicopter] apache model failed, using simple fallback: " +
          (e && e.stack ? e.stack : e),
      );
      // 回退到旧简版模型，保证光柱/战斗逻辑不受影响
      try {
        state.model = buildHelicopterCompat();
        context.scene.add(state.model.root);
      } catch (e2) {
        state.model = null;
      }
    }
  }

  function updateModel(dt) {
    if (!state.model) return;
    let m = state.model;
    m.root.position.copy(state.pos);
    m.root.rotation.y = state.yaw;
    m.spin(dt, 18);
    // 巡逻时轻微前倾，锁定时俯身朝目标
    m.tilt(state.mode === "lock" ? 0.12 : 0.04, 0);
    // 防撞灯闪烁（阿帕奇模型带独立 beacon/bellyBeacon）
    if (m.beacon) {
      let t = context.time ? context.time.t : 0;
      let on = t % 1.1 < 0.12;
      m.beacon.visible = on;
      if (m.bellyBeacon) m.bellyBeacon.visible = on;
    }
  }

  function playerGroundPoint(out) {
    let p = context.player;
    if (!p || !p.pos) return null;
    out.copy(p.pos);
    return out;
  }

  function updateCombat(dt, player) {
    // 先更新已发射导弹（独立于状态）
    for (let i = state.missiles.length - 1; i >= 0; i--) {
      if (state.missiles[i].update(dt)) state.missiles.splice(i, 1);
    }
    if (!HELI_COMBAT.enabled || !player || player.alive === false) {
      state.mode = "patrol";
      state.lockT = 0;
      return;
    }
    state.cooldownT = Math.max(0, state.cooldownT - dt);
    let exposed = isInBeam(player.eye || player.pos) || isInBeam(player.pos);

    switch (state.mode) {
      case "patrol":
        state.lockT = 0;
        if (exposed && state.cooldownT <= 0) state.mode = "alert";
        break;
      case "alert":
        if (!exposed) {
          // 照丢 → 复位巡逻
          state.mode = "patrol";
          state.lockT = 0;
        } else {
          state.lockT += dt;
          if (state.lockT >= HELI_COMBAT.lockOnTime) {
            state.mode = "lock";
            state.telegraphT = HELI_COMBAT.telegraphTime;
            // 锁定瞬间记录地面点：导弹打这个点，不追踪
            playerGroundPoint(state.lockPoint);
            emitTelegraph();
          }
        }
        break;
      case "lock":
        state.telegraphT -= dt;
        if (state.telegraphT <= 0) {
          state.mode = "engage";
          state.volleyLeft = HELI_COMBAT.missileCount;
          state.volleyT = 0;
        }
        break;
      case "engage":
        state.volleyT -= dt;
        if (state.volleyLeft > 0 && state.volleyT <= 0) {
          fireMissile();
          state.volleyLeft--;
          state.volleyT = HELI_COMBAT.missileInterval;
        }
        if (state.volleyLeft <= 0) {
          state.mode = "cooldown";
          state.cooldownT = HELI_COMBAT.reEngageCooldown;
          state.lockT = 0;
        }
        break;
      case "cooldown":
        if (state.cooldownT <= 0) state.mode = "patrol";
        break;
    }
  }

  function emitTelegraph() {
    if (context.events && context.events.emit) {
      context.events.emit("enemy:telegraph", {
        enemy: { type: "helicopter", pos: state.pos },
        point: state.lockPoint.clone(),
        duration: HELI_COMBAT.telegraphTime,
      });
    }
    if (context.audio && context.audio.play) {
      try {
        context.audio.play("heliLock", { pos: state.pos });
      } catch {}
    }
  }

  function fireMissile() {
    // 第二枚在落点上做 ±spreadOffset 散布，覆盖玩家走位
    let idx = HELI_COMBAT.missileCount - state.volleyLeft;
    let target = state.lockPoint.clone();
    if (idx > 0) {
      target.x += (rng() * 2 - 1) * HELI_COMBAT.spreadOffset;
      target.z += (rng() * 2 - 1) * HELI_COMBAT.spreadOffset;
    }
    let origin = state.pos.clone();
    origin.y -= 0.8;
    let missile = createMissile(context, {
      origin,
      target,
      speed: HELI_COMBAT.missileSpeed,
      blastRadius: HELI_COMBAT.blastRadius,
      blastDamage: HELI_COMBAT.blastDamage,
    });
    state.missiles.push(missile);
    if (context.audio && context.audio.play) {
      try {
        context.audio.play("missileLaunch", { pos: state.pos });
      } catch {}
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

  // 初始化光束部件
  setupLight();
  let volumetric = !!(
    context.quality && context.quality.envVolumetricBeam === true
  );
  setupCone(volumetric);
  setupDecal();
  ensureModel();

  return {
    get enabled() {
      return state.enabled;
    },
    get active() {
      return state.active;
    },
    get mode() {
      return state.mode;
    },
    get missiles() {
      return state.missiles;
    },
    get model() {
      return state.model;
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
    },
  };
}

export { createHelicopter };
