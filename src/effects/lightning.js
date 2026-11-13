// M4: thunderstorm lightning scheduler + visibility pulse trigger.
// Decides the flash moment, then hands off to environment._onLightningFlash
// (visibility pulse + exposure sweep) and the sky's existing `thunder` chain.
import { LIGHTNING_TIMING } from "../core/environment-presets.js";
import { createRandom } from "../core/random.js";

// 按天气覆盖的调度区间（秒）。clear/overcast 不启用，见 lightningEnabled。
var SCHEDULE = {
  lightRain: { min: 16, max: 20 },
  heavyRain: { min: 8, max: 12 },
};

// dusk.lampOn = 0.7 也判为“夜晚”：黄昏在雷雨里天色已暗，全屏 flash 合理。
var NIGHT_LAMP_ON = 0.5;

function createLightning(context) {
  let state = {
    enabled: false,
    nextT: 0,
    // 独立派生随机源：不推进 context.rng，固定 ?seed 下调度可复现。
    rng:
      context.rng && context.rng.fork
        ? context.rng.fork()
        : createRandom(1337),
    flashes: 0,
    lastAt: -9,
  };

  function currentWeather() {
    return (context.environment && context.environment.weather) || "clear";
  }

  function isHeavy() {
    return currentWeather() === "heavyRain";
  }

  function schedule() {
    let w = currentWeather(),
      range = SCHEDULE[w] || {
        min: LIGHTNING_TIMING.minInterval,
        max: LIGHTNING_TIMING.maxInterval,
      };
    state.nextT = range.min + state.rng() * (range.max - range.min);
  }

  function setEnabled(on) {
    on = !!on;
    if (state.enabled === on) return;
    state.enabled = on;
    if (!on) {
      state.nextT = 0;
      return;
    }
    // 启用后先等一个完整间隔，避免“刚切到雨天就劈一下”
    schedule();
  }

  function flash() {
    if (!state.enabled) return;
    let heavy = isHeavy(),
      lampOn =
        (context.environment &&
          typeof context.environment.lampOn === "number" &&
          context.environment.lampOn) ||
        0,
      isNight = lampOn > NIGHT_LAMP_ON;
    state.flashes++;
    state.lastAt = context.time ? context.time.t : 0;
    // 1. 天空闪白：复用 renderer 已订阅的 `thunder` 事件（uFlash + uFlashDir）。
    //    这条链路原版就有，也顺带让 audio.js 的 thunder 监听器播雷声。
    if (context.events && context.events.emit) {
      context.events.emit("thunder", { intensity: heavy ? 1 : 0.6 });
      // 2. 全屏 / HUD 反馈：夜晚且画质允许才 post.flash（low 关闭）
      context.events.emit("lightning:flash", {
        night: isNight,
        postFlash: isNight && context.quality && context.quality.envFlash !== false,
        intensity: heavy ? 1 : 0.6,
        pos: context.player ? context.player.pos : null,
      });
    }
    // 3. 能见度脉冲 + 全场暴露扫描
    if (
      context.environment &&
      typeof context.environment._onLightningFlash === "function"
    ) {
      context.environment._onLightningFlash();
    }
  }

  function update(dt) {
    if (!state.enabled) return;
    // game:state 非 playing/showcase 时冻结调度（不清空 nextT，恢复后继续）
    if (
      context.game &&
      context.game.state !== "playing" &&
      context.game.state !== "showcase"
    )
      return;
    state.nextT -= dt;
    if (state.nextT <= 0) {
      flash();
      schedule();
    }
  }

  return {
    get enabled() {
      return state.enabled;
    },
    /** 距下次闪电的秒数，诊断用 */
    get nextT() {
      return state.nextT;
    },
    get flashes() {
      return state.flashes;
    },
    setEnabled,
    update,
    trigger() {
      let was = state.enabled;
      state.enabled = true;
      flash();
      state.enabled = was;
    },
    debug: {
      state,
      weather: currentWeather,
      range: () => SCHEDULE[currentWeather()] || null,
    },
  };
}

export { createLightning };
