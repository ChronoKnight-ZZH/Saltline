// Game context, original system startup order and frame loop.
import { PlaneGeometry, THREE, Vector3 } from "../vendor/three-r180.js";
import { chooseQuality } from "../core/quality.js";
import { createEventBus } from "../core/events.js";
import { createRandom } from "../core/random.js";
import { FALLBACKS } from "../core/fallbacks.js";
import { createMesh } from "../core/geometry.js";
import { createRenderer } from "../render/renderer.js";
import { createMaterials } from "../render/materials/materials.js";
import { createPhysics } from "../world/physics.js";
import { createProps } from "../world/props/props.js";
import { createLevel } from "../world/level/level.js";
import { createBackdrop } from "../world/backdrop/backdrop.js";
import { createGround } from "../world/ground/ground.js";
import { createEffects } from "../effects/effects.js";
import { createAudio } from "../audio/audio.js";
import { createInput } from "../input/input.js";
import { createPlayer } from "../player/player.js";
import { createCombat } from "../combat/combat.js";
import { createWeapon } from "../weapons/weapon.js";
import { createEnemies } from "../enemies/enemies.js";
import { createHUD } from "../ui/hud.js";
import { createGameFlow } from "../game/flow.js";
import { SHOWCASE_MODULES } from "./showcases.js";
import { showFatalError } from "./diagnostics.js";
import { bootElement, setBootProgress } from "./boot-screen.js";
import { enableBenchmark } from "./benchmark.js";
import { createShowcaseInput, createShowcasePlayer } from "./showcase-stubs.js";
import { createEnvironment } from "../core/environment.js";
import { createHelicopter } from "../world/helicopter.js";
import {
  DEFAULT_ENV,
  TIME_PRESETS,
  WEATHER_PRESETS,
} from "../core/environment-presets.js";

async function startGame() {
  let params = Object.fromEntries(new URLSearchParams(location.search)),
    benchmark = !!params.bench || location.hash === "#bench";
  benchmark && ((params.noaudio = "1"), (params.autostart = "1"));
  let context = {
    THREE: THREE,
    params: params,
    events: createEventBus(),
    rng: createRandom(+(params.seed || 4207)),
    time: {
      t: 0,
      dt: 0,
      frame: 0,
      real: 0,
    },
    quality: chooseQuality(params.q || (params.shot ? "test" : "")),
  };
  window.__G = context;
  let showcaseName =
    params.show && SHOWCASE_MODULES[params.show] ? params.show : null;
  context.showcase = showcaseName;
  let cameraOverride = null;
  function setShot(h) {
    if (h.cam) {
      let f = String(h.cam).split(",").map(Number);
      cameraOverride = {
        pos: new Vector3(f[0], f[1], f[2]),
        look: new Vector3(f[3] ?? 0, f[4] ?? 1, f[5] ?? 0),
      };
    }
    (h.cam === "" && (cameraOverride = null),
      h.fov &&
        ((context.camera.fov = +h.fov),
        context.camera.updateProjectionMatrix()),
      h.exposure && (context.render.exposure = +h.exposure));
  }
  window.__setShot = setShot;
  async function initializeSystem(h, f, p, d = !1) {
    let v = performance.now();
    try {
      context[h] = await p();
    } catch (x) {
      if (
        (console.error(`[boot] module "${h}" failed: ${(x && x.stack) || x}`),
        d || !FALLBACKS[h])
      )
        throw x;
      context[h] = FALLBACKS[h]();
    }
    let g = performance.now() - v;
    g > 150 && console.log(`[boot] ${h} ${g.toFixed(0)}ms`);
  }
  if (
    (await setBootProgress("Waking the renderer", 0.04),
    await initializeSystem(
      "render",
      "render",
      () => createRenderer(context),
      !0,
    ),
    (context.renderer = context.render.renderer),
    (context.scene = context.render.scene),
    (context.camera = context.render.camera),
    (context.viewCamera = context.render.viewCamera),
    await setBootProgress("Mixing paint, rust and rain", 0.12),
    await initializeSystem("mats", "materials", () => createMaterials(context)),
    (context.physics = createPhysics(context)),
    (context.props = createProps(context)),
    (context.input = showcaseName
      ? createShowcaseInput()
      : createInput(context)),
    showcaseName)
  ) {
    let h = createMesh(
      new PlaneGeometry(80, 80).rotateX(-Math.PI / 2),
      context.mats.get("concrete"),
      {
        cast: !1,
      },
    );
    if (
      (context.scene.add(h),
      (context.level = {
        stub: !0,
        playerStart: {
          pos: new Vector3(0, 0, 4),
          yaw: 0,
        },
        objectives: [],
        enemySpawns: [],
        zones: [],
        interiorBoxes: [],
        cinematicPath: [],
        extraction: {
          pos: new Vector3(),
          radius: 2,
        },
        groundSurfaceAt: () => "concrete",
        update() {},
      }),
      (context.backdrop = FALLBACKS.backdrop()),
      (context.ground = FALLBACKS.ground()),
      context.physics.build(),
      showcaseName === "fx")
    )
      await initializeSystem("fx", "fx", () => createEffects(context));
    else
      try {
        context.fx = await createEffects(context);
      } catch {
        context.fx = FALLBACKS.fx();
      }
    ((context.audio = FALLBACKS.audio()),
      (context.hud = FALLBACKS.hud()),
      (context.player = createShowcasePlayer(context)),
      (context.combat = createCombat(context)),
      (context.weapon = FALLBACKS.weapon()),
      (context.enemies = FALLBACKS.enemies()),
      (context.game = {
        state: "showcase",
        update: () => !1,
        start() {},
      }));
    let f = null;
    try {
      f = await SHOWCASE_MODULES[showcaseName].showcase(context);
    } catch (p) {
      showFatalError(
        `showcase "${showcaseName}" threw: ${(p && p.stack) || p}`,
      );
    }
    ((context.showcaseInfo = f || {}),
      f &&
        f.cam &&
        setShot({
          cam: [...f.cam, ...(f.target || [0, 1, 0])].join(","),
        }));
  } else {
    if (
      (await setBootProgress("Stacking containers", 0.34),
      await initializeSystem("level", "level", () => createLevel(context), !0),
      await setBootProgress("Raising the cranes", 0.5),
      await initializeSystem("backdrop", "backdrop", () =>
        createBackdrop(context),
      ),
      await setBootProgress("Flooding the apron", 0.58),
      await initializeSystem("ground", "ground", () => createGround(context)),
      context.ground.stub)
    ) {
      let h = createMesh(
        new PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
        context.mats.get("asphalt"),
        {
          cast: !1,
        },
      );
      context.scene.add(h);
    }
    (context.physics.build(),
      await setBootProgress("Loading tracers and smoke", 0.66),
      await initializeSystem("fx", "fx", () => createEffects(context)),
      await initializeSystem("audio", "audio", () =>
        params.noaudio ? FALLBACKS.audio() : createAudio(context),
      ),
      (context.player = createPlayer(context)),
      (context.combat = createCombat(context)),
      await setBootProgress("Checking the rifle", 0.74),
      await initializeSystem("weapon", "weapon", () => createWeapon(context)),
      await setBootProgress("Waking the Harbormaster", 0.82),
      await initializeSystem("enemies", "enemies", () =>
        createEnemies(context),
      ),
      await initializeSystem("hud", "hud", () => createHUD(context)),
      (context.game = createGameFlow(context)));
  }
  await setBootProgress("Reading the sky", 0.88);
  // M3：helicopter 必须先于 environment 装配，否则 environment 的
  // applyStatic 检测不到 context.helicopter，启停逻辑会被跳过。
  await initializeSystem("helicopter", "helicopter", () =>
    createHelicopter(context),
  );
  await initializeSystem("environment", "environment", () =>
    createEnvironment(context),
  );
  if (params.time || params.weather) {
    let timeValid = params.time && TIME_PRESETS[params.time],
      weatherValid = params.weather && WEATHER_PRESETS[params.weather];
    if (timeValid || weatherValid) {
      // 显式参数即使等于默认也 force 应用，避免“指定了晴天却还是湿的”歧义
      context.environment.set(
        {
          timeOfDay: timeValid ? params.time : undefined,
          weather: weatherValid ? params.weather : undefined,
        },
        true,
      );
    } else {
      context.environment.set(DEFAULT_ENV, true);
    }
  } else if (params.shot || params.bench) {
    // 幂等：environment 构造时已是 DEFAULT_ENV，set 不触发 applyStatic，
    // wetApplied 保持 false，mats.uniforms.wet 保持 1，截图与原版一致。
    context.environment.set(DEFAULT_ENV);
  } else {
    context.environment.randomize();
  }
  await setBootProgress("Waiting for first light", 0.92);
  try {
    await context.render.onLevelReady();
  } catch (h) {
    console.error(
      "[boot] render.onLevelReady failed: " + ((h && h.stack) || h),
    );
  }
  let averageFrameSeconds = 0;
  if (
    ((window.__stats = () => ({
      ...(context.render.stats ? context.render.stats() : {}),
      fps: averageFrameSeconds ? +(1 / averageFrameSeconds).toFixed(1) : 0,
      state: context.game && context.game.state,
    })),
    params.cam && setShot(params),
    params.fov &&
      setShot({
        fov: params.fov,
      }),
    !showcaseName && (params.shot || params.autostart))
  )
    try {
      context.game.start({
        skipIntro: !0,
      });
    } catch (h) {
      console.error("[boot] game.start failed", h);
    }
  (params.noweapon &&
    context.weapon.setVisible &&
    context.weapon.setVisible(!1),
    benchmark && enableBenchmark(context),
    await setBootProgress("Ready", 1),
    bootElement.classList.add("done"),
    setTimeout(() => {
      bootElement.hidden = !0;
    }, 700));
  let previousFrameTime = performance.now(),
    weaponWetness =
      context.environment && typeof context.environment.wetness === "number"
        ? context.environment.wetness
        : 1,
    updateSystem = (h, f) => {
      let p = context[h];
      if (p && p.update)
        try {
          p.update(f);
        } catch (d) {
          updateSystem.err[h] ||
            ((updateSystem.err[h] = 1),
            console.error(`[loop] ${h}.update threw: ${(d && d.stack) || d}`));
        }
    };
  ((updateSystem.err = {}),
    context.renderer.setAnimationLoop(() => {
      let h = performance.now(),
        f = (h - previousFrameTime) / 1e3;
      ((previousFrameTime = h),
        (averageFrameSeconds = averageFrameSeconds
          ? averageFrameSeconds * 0.95 + f * 0.05
          : f));
      let p = Math.min(f, 0.05);
      (params.dt && (p = +params.dt),
        (context.time.dt = p),
        (context.time.t += p),
        (context.time.real = h / 1e3),
        context.time.frame++,
        updateSystem("input", p));
      let d = !1;
      try {
        d =
          context.game.update(p) !== !1 &&
          context.game.state !== "title" &&
          context.game.state !== "paused";
      } catch (v) {
        updateSystem.err.game ||
          ((updateSystem.err.game = 1),
          console.error("[loop] game.update threw: " + ((v && v.stack) || v)));
      }
      updateSystem("environment", p);
      if (showcaseName) {
        if (context.showcaseInfo.update)
          try {
            context.showcaseInfo.update(p);
          } catch (v) {
            updateSystem.err.sc ||
              ((updateSystem.err.sc = 1),
              console.error(
                "[loop] showcase update threw: " + ((v && v.stack) || v),
              ));
          }
      } else
        d &&
          (updateSystem("player", p),
          updateSystem("weapon", p),
          updateSystem("enemies", p));
      if (
        context.weapon &&
        context.weapon.setWetness &&
        context.level &&
        context.level.interiorBoxes &&
        context.level.interiorBoxes[0]
      ) {
        let v = context.level.interiorBoxes[0],
          g = context.camera.position,
          x =
            g.x > v.min.x &&
            g.x < v.max.x &&
            g.z > v.min.z &&
            g.z < v.max.z &&
            g.y < v.max.y;
        let envWet =
          context.environment && typeof context.environment.wetness === "number"
            ? context.environment.wetness
            : 1;
        weaponWetness +=
          ((x ? envWet * 0.3 : envWet) - weaponWetness) *
          Math.min(1, p * (x ? 0.25 : 0.6));
        try {
          context.weapon.setWetness(weaponWetness);
        } catch {}
      }
      (context.game.state !== "paused" &&
        (updateSystem("fx", p),
        updateSystem("ground", p),
        updateSystem("level", p),
        updateSystem("backdrop", p),
        updateSystem("mats", p)),
        updateSystem("audio", p),
        updateSystem("hud", p),
        cameraOverride &&
          (context.camera.position.copy(cameraOverride.pos),
          context.camera.lookAt(cameraOverride.look)),
        context.bench && context.bench.frame(f));
      try {
        context.render.frame(p);
      } catch (v) {
        updateSystem.err.render ||
          ((updateSystem.err.render = 1),
          console.error("[loop] render.frame threw: " + ((v && v.stack) || v)));
      }
      (context.input.endFrame && context.input.endFrame(),
        window.__frames++,
        window.__frames === 2 && (window.__ready = !0));
    }));
}

export { startGame };
