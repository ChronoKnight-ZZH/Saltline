// M4: thunderstorm lightning scheduler + visibility pulse trigger.
// Decides the flash moment, then hands off to environment._onLightningFlash
// (visibility pulse + exposure sweep) and the sky's existing `thunder` chain.
// §6：闪光是瞬時的，雷声延后 1.8–2.8s 到达（拟合声速），雷声窗口内追加听觉遮蔽。
import { LIGHTNING_TIMING } from "../core/environment-presets.js";
import { createRandom } from "../core/random.js";

// 按天气覆盖的调度区间（秒）。clear/overcast 不启用，见 lightningEnabled。
var SCHEDULE = {
  lightRain: LIGHTNING_TIMING.lightRainInterval,
  heavyRain: LIGHTNING_TIMING.heavyRainInterval,
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
    // §6：延迟雷声的剩余时间与强度（0 表示没有待播放的雷）
    thunderT: 0,
    thunderPower: 0,
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
    // §6：先闪后雷。闪光必须立即发生（给情报），雷声延后 1.8–2.8s（拟合声速）。
    // renderer 的 `thunder` 事件链路同时驱动天空 uFlash 与雷声播放，
    // 所以闪光改用 lightning:flash 立即播，雷声再单独延迟派发 thunder。
    if (context.events && context.events.emit) {
      // 1. 闪光（瞬时）：天空 uFlashDir 由 thunder 链路设置，这里给一次立即的视觉
      context.events.emit("lightning:flash", {
        night: isNight,
        postFlash:
          isNight && context.quality && context.quality.envFlash !== false,
        intensity: heavy ? 1 : 0.6,
        pos: context.player ? context.player.pos : null,
      });
      // 2. 雷声延后：由 update() 在状态里计时后派发 `thunder`
      let t = LIGHTNING_TIMING.thunderDelay;
      state.thunderT = t.min + state.rng() * (t.max - t.min);
      state.thunderPower = heavy ? 1 : 0.6;
    }
    // 3. 能见度脉冲 + 全场暴露扫描
    if (
      context.environment &&
      typeof context.environment._onLightningFlash === "function"
    ) {
      context.environment._onLightningFlash();
    }
  }

  // §6：雷声到达。此时派发 `thunder`（天空闪 + 雷声），
  // 并让 environment 打开 3s 的听觉遮蔽窗口（转移窗口）。
  function thunderArrive() {
    if (context.events && context.events.emit) {
      context.events.emit("thunder", { intensity: state.thunderPower || 0.6 });
    }
    if (
      context.environment &&
      typeof context.environment._onThunderArrive === "function"
    ) {
      context.environment._onThunderArrive();
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
    // §6：延迟雷声倒计时（即使 nextT 还没到也要推）
    if (state.thunderT > 0) {
      state.thunderT -= dt;
      if (state.thunderT <= 0) {
        state.thunderT = 0;
        thunderArrive();
      }
    }
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
