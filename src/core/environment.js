// Environment state hub: timeOfDay x weather, visibility model, perception.
import { createRandom } from "./random.js";
import { damp } from "./math.js";
import {
  TIME_PRESETS,
  WEATHER_PRESETS,
  DEFAULT_ENV,
  LIGHTNING_TIMING,
  combine,
} from "./environment-presets.js";

function createEnvironment(context) {
  let seed = Number(
      context.params && context.params.seed ? context.params.seed : 4207,
    ),
    rng = createRandom((seed ^ 0x9e3779b9) >>> 0),
    state = {
      timeOfDay: DEFAULT_ENV.timeOfDay,
      weather: DEFAULT_ENV.weather,
      target: combine(DEFAULT_ENV.timeOfDay, DEFAULT_ENV.weather),
      current: null,
    },
    visibility = {
      base: state.target.visibility,
      current: state.target.visibility,
      lightningPeak: Math.min(state.target.visibility * 3.5, 200),
      lightningT: 0,
    },
    // 启动时 mats.uniforms.wet 的默认值是 1（原版“港口一直湿”）。
    // wetApplied 为 false 时不写 mats.uniforms.wet，也不 damp current.wetness，
    // 保证 ?shot=1 的 ?shot=1 截图回归与改造前一致。
    wetApplied = false;

  function cloneCurrent(target) {
    return {
      fogDensity: target.fogDensity,
      exposure: target.exposure,
      rainLevel: target.rainLevel,
      wetness: target.wetness,
      audioMask: target.audioMask,
      spreadScale: target.spreadScale,
    };
  }

  state.current = cloneCurrent(state.target);
  // 让启动时的 current.wetness 与原 mats.uniforms.wet 对齐（通常是 1），
  // 后续 set(force) 从该值开始 damp。
  if (context.mats && context.mats.uniforms && context.mats.uniforms.wet) {
    state.current.wetness = context.mats.uniforms.wet.value;
  }

  let perception = {
    get visibility() {
      return visibility.current;
    },
    get visualAlert() {
      return 1.0;
    },
    get audioMask() {
      return state.current.audioMask;
    },
    get spreadScale() {
      return state.current.spreadScale;
    },
    footstepMaskAt() {
      // M1 只合并雨声；直升机在 M3 接入
      return Math.min(state.current.audioMask, 0.85);
    },
  };

  function applyStatic(force) {
    let t = state.target,
      c = state.current;
    if (context.render && context.render.setSun) {
      context.render.setSun({
        sunDir: t.sunDir,
        sunColor: t.sunColor,
        sunIntensity: t.sunIntensity,
        skyTop: t.skyTop,
        skyHorizon: t.skyHorizon,
      });
    }
    if (context.render && context.render.setFog) {
      context.render.setFog(t.fogColor, c.fogDensity);
    }
    if (context.render && context.render.setExposure) {
      context.render.setExposure(c.exposure);
    }
    if (context.render && context.render.rebakeEnvironment) {
      context.render.rebakeEnvironment();
    }
    if (context.ground && context.ground.setRain) {
      context.ground.setRain(c.rainLevel);
    }
    if (force) wetApplied = true;
    if (
      wetApplied &&
      context.mats &&
      context.mats.uniforms &&
      context.mats.uniforms.wet
    ) {
      context.mats.uniforms.wet.value = c.wetness;
    }
    // M3：直升机启停。变化时立即启停，不等 damp。
    // 构造时 context.helicopter 尚未装配（runtime 顺序），这里跳过；
    // URL 参数处理在 helicopter 装配之后（见 runtime.js），届时自动生效。
    if (context.helicopter && context.helicopter.setEnabled) {
      let want = !!state.target.helicopterEnabled;
      if (context.helicopter.enabled !== want) {
        context.helicopter.setEnabled(want);
      }
    }
    // M4：闪电启停（同直升机模式，按 target.lightningEnabled 派生）
    if (context.lightning && context.lightning.setEnabled) {
      let want = !!state.target.lightningEnabled;
      if (context.lightning.enabled !== want) {
        context.lightning.setEnabled(want);
      }
    }
  }

  function pushFrame(dt) {
    let c = state.current,
      t = state.target;
    c.fogDensity = damp(c.fogDensity, t.fogDensity, 3, dt);
    c.exposure = damp(c.exposure, t.exposure, 3, dt);
    c.rainLevel = damp(c.rainLevel, t.rainLevel, 3, dt);
    if (wetApplied) {
      c.wetness = damp(c.wetness, t.wetness, 3, dt);
    }
    c.audioMask = damp(c.audioMask, t.audioMask, 4, dt);
    c.spreadScale = damp(c.spreadScale, t.spreadScale, 4, dt);

    if (visibility.lightningT > 0) {
      visibility.lightningT -= dt;
      visibility.current = visibility.lightningPeak;
    } else {
      // M4：lambda 3 → 5，与改造文档“0.8s 回落到 1/e”一致。
      visibility.current = damp(visibility.current, visibility.base, 5, dt);
    }

    if (context.render && context.render.setFog) {
      context.render.setFog(t.fogColor, c.fogDensity);
    }
    if (context.render && context.render.setExposure) {
      context.render.setExposure(c.exposure);
    }
    if (context.ground && context.ground.setRain) {
      context.ground.setRain(c.rainLevel);
    }
    if (
      wetApplied &&
      context.mats &&
      context.mats.uniforms &&
      context.mats.uniforms.wet
    ) {
      context.mats.uniforms.wet.value = c.wetness;
    }
  }

  function applyTarget(nextTime, nextWeather) {
    state.timeOfDay = nextTime;
    state.weather = nextWeather;
    state.target = combine(nextTime, nextWeather);
    visibility.base = state.target.visibility;
    visibility.lightningPeak = Math.min(visibility.base * 3.5, 200);
    if (visibility.current > visibility.base) {
      visibility.current = visibility.base;
    }
  }

  function emitChanged() {
    if (context.events && context.events.emit) {
      context.events.emit("environment:changed", {
        timeOfDay: state.timeOfDay,
        weather: state.weather,
      });
    }
  }

  function setTimeOfDay(name) {
    if (!TIME_PRESETS[name] || name === state.timeOfDay) return;
    applyTarget(name, state.weather);
    applyStatic(true);
    emitChanged();
  }

  function setWeather(name) {
    if (!WEATHER_PRESETS[name] || name === state.weather) return;
    applyTarget(state.timeOfDay, name);
    applyStatic(true);
    emitChanged();
  }

  // force=true 时即使状态未变也应用静态写入（用于显式 URL 参数）。
  function set(opts, force) {
    opts = opts || {};
    let nextTime =
        opts.timeOfDay && TIME_PRESETS[opts.timeOfDay]
          ? opts.timeOfDay
          : state.timeOfDay,
      nextWeather =
        opts.weather && WEATHER_PRESETS[opts.weather]
          ? opts.weather
          : state.weather;
    if (nextTime === state.timeOfDay && nextWeather === state.weather) {
      if (force) applyStatic(true);
      return;
    }
    applyTarget(nextTime, nextWeather);
    applyStatic(true);
    emitChanged();
  }

  function randomize() {
    let times = Object.keys(TIME_PRESETS),
      weathers = Object.keys(WEATHER_PRESETS);
    set(
      {
        timeOfDay: rng.pick(times),
        weather: rng.pick(weathers),
      },
      true,
    );
  }

  function update(dt) {
    pushFrame(dt);
    // M3：驱动直升机（try/catch 保护，单帧异常不阻断主循环）
    if (context.helicopter && context.helicopter.update) {
      try {
        context.helicopter.update(dt);
      } catch (e) {
        console.error(
          "[environment] helicopter.update threw: " + (e && e.stack ? e.stack : e),
        );
      }
    }
    // M4：驱动闪电（同样 try/catch 保护）
    if (context.lightning && context.lightning.update) {
      try {
        context.lightning.update(dt);
      } catch (e) {
        console.error(
          "[environment] lightning.update threw: " + (e && e.stack ? e.stack : e),
        );
      }
    }
  }

  // M4：闪电瞬时暴露扫描。从玩家视角遍历敌人：距离粗筛 → LOS → forceExpose。
  // 与 helicopter.scanAndExpose 对称；1.5s 冷却在 enemies 侧，两者共享。
  function scanLightningExpose() {
    if (!context.enemies || !context.enemies.list) return;
    if (!context.enemies.forceExpose) return;
    let p = context.player;
    if (!p || p.alive === false) return;
    let eye = p.eye || p.pos;
    if (!eye) return;
    let peak = visibility.lightningPeak,
      peak2 = peak * peak,
      exposedIds = [];
    for (let enemy of context.enemies.list) {
      if (!enemy || !enemy.alive || !enemy.active) continue;
      // 已交战不降级（改造文档 4.5）
      if (enemy.mode === "engage") continue;
      let dx = enemy.pos.x - p.pos.x,
        dy = enemy.pos.y - p.pos.y,
        dz = enemy.pos.z - p.pos.z;
      if (dx * dx + dy * dy + dz * dz > peak2) continue;
      if (!context.physics.lineOfSight(enemy.sensor || enemy.pos, eye)) continue;
      context.enemies.forceExpose(p.pos, "lightning", enemy);
      if (enemy.id != null) exposedIds.push(enemy.id);
    }
    if (exposedIds.length && context.events && context.events.emit) {
      context.events.emit("lightning:exposed", {
        targets: exposedIds.map((id) => ({ id })),
      });
    }
  }

  let system = {
    get timeOfDay() {
      return state.timeOfDay;
    },
    get weather() {
      return state.weather;
    },
    get wetness() {
      return state.current.wetness;
    },
    // M4：当前灯光强度（0..1）。lightning 用 >0.5 判定“夜晚”决定是否全屏 flash。
    get lampOn() {
      return state.target.lampOn;
    },
    setTimeOfDay,
    setWeather,
    set,
    randomize,
    update,
    perception,
    visibility,
    _applyStatic: applyStatic,
    _pushFrame: pushFrame,
    _onLightningFlash() {
      // M4：能见度脉冲（方案 B：0.8s 高能 + 约 0.8s damp 回落）。
      // 连续闪电取 max 不叠加：lightningT 不累加，current 不翻倍。
      visibility.lightningT = Math.max(
        visibility.lightningT,
        LIGHTNING_TIMING.high,
      );
      visibility.current = Math.max(visibility.current, visibility.lightningPeak);
      // 全场暴露扫描（9 敌人单帧完成，不分帧）
      scanLightningExpose();
    },
    _updateHelicopter() {
      // M3
    },
  };

  applyStatic(false);
  return system;
}

export { createEnvironment };