// §5: solar flare / EMP — daytime-clear environmental event.
// Both sides get debuffed: machines slow down and fire slower, the player
// gets weapon sway and degraded HUD. Neither side may safely snipe.
//
// The flare itself only owns timing + visual envelope; the gameplay debuffs are
// exposed through environment.perception (enemySpeedMul / enemyFireMul /
// playerSwayMul / hudSuppressed) so enemies/weapon/hud read them like any other
// perception value.
import { SOLAR_FLARE_TUNING as T } from "../core/environment-presets.js";
import { createRandom } from "../core/random.js";

// 白天集合：夜间晴天由直升机占据，不触发耀斑。
var DAY_TIMES = { dawn: 1, noon: 1, dusk: 1 };

function createSolarFlare(context) {
  let state = {
    enabled: false,
    // 距下次耀斑的秒数
    nextT: 0,
    // 当前耀斑剩余时间（0 表示未激活）
    life: 0,
    // 0..1 的强度包络（起升 → 峰值 → 回落）
    level: 0,
    // 0..1，debuff 生效强度（峰值段=1）
    effect: 0,
    rng:
      context.rng && context.rng.fork
        ? context.rng.fork()
        : createRandom(2027),
    flares: 0,
  };

  function isDaytimeClear() {
    let env = context.environment;
    if (!env) return false;
    return !!DAY_TIMES[env.timeOfDay] && env.weather === "clear";
  }

  function schedule() {
    state.nextT = T.interval.min + state.rng() * (T.interval.max - T.interval.min);
  }

  function setEnabled(on) {
    on = !!on;
    if (state.enabled === on) return;
    state.enabled = on;
    if (!on) {
      state.nextT = 0;
      state.life = 0;
      state.level = 0;
      state.effect = 0;
      return;
    }
    schedule();
  }

  // 强度包络：rise 线性升到 1，peak 保持，fall 线性回到 0。
  function envelope(elapsed) {
    let rise = T.rise,
      peak = T.peak,
      fall = T.fall;
    if (elapsed <= 0) return 0;
    if (elapsed < rise) return elapsed / rise;
    if (elapsed < rise + peak) return 1;
    let f = elapsed - rise - peak;
    if (f < fall) return 1 - f / fall;
    return 0;
  }

  function trigger() {
    if (state.life > 0) return;
    state.flares++;
    state.life = T.rise + T.peak + T.fall;
    state.level = 0;
    state.effect = 0;
    if (context.events && context.events.emit) {
      context.events.emit("solarflare:start", {
        duration: state.life,
        enemySpeedMul: T.enemySpeedMul,
        enemyFireMul: T.enemyFireIntervalMul,
        playerSwayMul: T.playerSwayMul,
      });
    }
  }

  function update(dt) {
    // 耀斑进行中：驱动包络，不重新调度
    if (state.life > 0) {
      state.life -= dt;
      let elapsed = T.rise + T.peak + T.fall - Math.max(0, state.life);
      state.level = envelope(elapsed);
      // debuff 只在峰值段生效（起升/回落是视觉过渡）
      state.effect =
        elapsed >= T.rise && elapsed < T.rise + T.peak ? 1 : 0;
      if (state.life <= 0) {
        state.life = 0;
        state.level = 0;
        state.effect = 0;
        if (context.events && context.events.emit) {
          context.events.emit("solarflare:end", {});
        }
        schedule();
      }
      return;
    }
    if (!state.enabled) return;
    // game:state 非 playing/showcase 时冻结调度
    if (
      context.game &&
      context.game.state !== "playing" &&
      context.game.state !== "showcase"
    )
      return;
    // 天气/时间变了：清掉待触发（只在白天晴天出现）
    if (!isDaytimeClear()) {
      state.nextT = Infinity;
      return;
    }
    if (state.nextT === Infinity) schedule();
    state.nextT -= dt;
    if (state.nextT <= 0) trigger();
  }

  return {
    get enabled() {
      return state.enabled;
    },
    get active() {
      return state.life > 0;
    },
    /** 视觉强度 0..1 */
    get level() {
      return state.level;
    },
    /** debuff 生效强度 0..1（仅峰值段为 1） */
    get effect() {
      return state.effect;
    },
    get nextT() {
      return state.nextT;
    },
    get flares() {
      return state.flares;
    },
    setEnabled,
    update,
    trigger,
    debug: { state },
  };
}

export { createSolarFlare };
