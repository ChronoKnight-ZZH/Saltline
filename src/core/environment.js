// Environment state hub: timeOfDay x weather, visibility model, perception.
import { defineModuleExports } from "../vendor/three-r180.js";
import { createRandom } from "./random.js";
import { damp } from "./math.js";
import {
  TIME_PRESETS,
  WEATHER_PRESETS,
  DEFAULT_ENV,
  LIGHTNING_TIMING,
  LIGHTNING_PEAK_CAP,
  SOLAR_FLARE_TUNING,
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
      lightningPeak: Math.min(state.target.visibility * 3.5, LIGHTNING_PEAK_CAP),
      lightningT: 0,
    },
    // 启动时 mats.uniforms.wet 的默认值是 1（原版“港口一直湿”）。
    // wetApplied 为 false 时不写 mats.uniforms.wet，也不 damp current.wetness，
    // 保证 ?shot=1 的 ?shot=1 截图回归与改造前一致。
    wetApplied = false,
    // §6：雷声响度窗口剩余时间（秒）。>0 时 audioMask 追加遮蔽。
    thunderMaskT = 0;

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

  // §5：耀斑 debuff 是否生效（只在峰值段）。diagnostics 也可读。
  function flareEffect() {
    let sf = context.solarflare;
    return !!(sf && sf.effect > 0);
  }

  let perception = {
    get visibility() {
      return visibility.current;
    },
    get visualAlert() {
      return 1.0;
    },
    get audioMask() {
      // §6：雷声窗口内追加遮蔽（雷声掩盖脚步 = 玩家的转移窗口）
      if (thunderMaskT > 0) {
        return Math.min(
          LIGHTNING_TIMING.thunderMaskCap,
          state.current.audioMask + LIGHTNING_TIMING.thunderMaskBoost,
        );
      }
      return state.current.audioMask;
    },
    get spreadScale() {
      return state.current.spreadScale;
    },
    // §5：太阳耀斑 debuff（敌我双方同时被削）
    get enemySpeedMul() {
      return flareEffect() ? SOLAR_FLARE_TUNING.enemySpeedMul : 1;
    },
    get enemyFireMul() {
      return flareEffect() ? SOLAR_FLARE_TUNING.enemyFireIntervalMul : 1;
    },
    get playerSwayMul() {
      return flareEffect() ? SOLAR_FLARE_TUNING.playerSwayMul : 1;
    },
    get hudSuppressed() {
      return !!(flareEffect() && SOLAR_FLARE_TUNING.suppressHudMarks);
    },
    get solarFlare() {
      return context.solarflare ? context.solarflare.level : 0;
    },
    footstepMaskAt() {
      // M1 只合并雨声；直升机在 M3 接入
      return Math.min(this.audioMask, 0.85);
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
        // 天气驱动的直射阴影浓度与太阳盘可见度
        shadowIntensity: t.shadowIntensity,
        sunDisk: t.sunDisk,
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
    // §5：太阳耀斑启停。只在白天晴天启用（夜间由直升机占据）。
    if (context.solarflare && context.solarflare.setEnabled) {
      let want =
        SOLAR_FLARE_TUNING.enabled &&
        state.timeOfDay !== "midnight" &&
        state.weather === "clear";
      if (context.solarflare.enabled !== want) {
        context.solarflare.setEnabled(want);
      }
    }
    // M5：表现层——灯光、地面反射。
    // 这些只在切换时变一次，放这里避免每帧重复写入。
    let lampOn = t.lampOn,
      lampsOn = lampOn > 0.05;
    if (context.level && context.level.setLights) {
      try {
        context.level.setLights(lampsOn, lampOn);
      } catch (e) {
        console.error("[environment] level.setLights threw: " + (e && e.stack ? e.stack : e));
      }
    }
    if (context.backdrop && context.backdrop.setLights) {
      try {
        context.backdrop.setLights(lampsOn, lampOn);
      } catch (e) {
        console.error("[environment] backdrop.setLights threw: " + (e && e.stack ? e.stack : e));
      }
    }
    if (context.ground && context.ground.setReflections) {
      // 平面反射：画质允许 + 有雨/湿地面
      let planar = !!(context.quality && context.quality.planar > 0),
        wet = t.rainLevel > 0.3 || t.wetness > 0.4;
      try {
        context.ground.setReflections(planar && wet);
      } catch (e) {
        console.error("[environment] ground.setReflections threw: " + (e && e.stack ? e.stack : e));
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
    // §6：雷声遮蔽窗口倒计时
    if (thunderMaskT > 0) {
      thunderMaskT -= dt;
      if (thunderMaskT < 0) thunderMaskT = 0;
    }

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
    visibility.lightningPeak = Math.min(visibility.base * 3.5, LIGHTNING_PEAK_CAP);
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
    // §5：驱动太阳耀斑（包络 + 调度）
    if (context.solarflare && context.solarflare.update) {
      try {
        context.solarflare.update(dt);
      } catch (e) {
        console.error(
          "[environment] solarflare.update threw: " + (e && e.stack ? e.stack : e),
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
    // §6：雷声到达 → 打开听觉遮蔽窗口（脚步近乎静音 = 玩家的转移窗口）。
    _onThunderArrive() {
      thunderMaskT = LIGHTNING_TIMING.thunderMaskTime;
    },
    get thunderMaskT() {
      return thunderMaskT;
    },
    _updateHelicopter() {
      // M3
    },
  };

  applyStatic(false);
  return system;
}

// M5：`?show=environment` 展示模式。
// environment 已在 runtime 的公共段初始化，这里只负责相机与定时切换。
var environmentShowcaseModule = {};

defineModuleExports(environmentShowcaseModule, {
  create: () => createEnvironment,
  showcase: () => showcaseEnvironment,
});

function showcaseEnvironment(context) {
  let times = ["dawn", "noon", "dusk", "midnight"],
    weathers = ["clear", "overcast", "lightRain", "heavyRain"],
    ti = 0,
    wi = 0,
    tAcc = 0,
    wAcc = 0,
    TIME_STEP = 6,
    WEATHER_STEP = 4;
  return {
    cam: [-9, 1.7, 5.6],
    target: [14, 0.4, 5],
    update(dt) {
      let env = context.environment;
      if (!env) return;
      tAcc += dt;
      if (tAcc >= TIME_STEP) {
        tAcc = 0;
        ti = (ti + 1) % times.length;
        env.setTimeOfDay(times[ti]);
      }
      wAcc += dt;
      if (wAcc >= WEATHER_STEP) {
        wAcc = 0;
        wi = (wi + 1) % weathers.length;
        env.setWeather(weathers[wi]);
      }
    },
  };
}

export {
  createEnvironment,
  environmentShowcaseModule,
  showcaseEnvironment,
};