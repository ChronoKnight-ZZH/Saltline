// 简报屏幕 4 个 lane 卡片的 Three.js 小场景。
// 1 个透明 WebGLRenderer，用 scissor/viewport 同时渲染 4 个正交小场景。
//
// 天空：复用实机 sky shader（`Hy` + `applySkyPreset`），用 `combine(time, weather)`
// 的真实预设值着色，再烘到每卡一张 RenderTarget 当背景贴图。每帧只画一个贴图 quad，
// 不在每帧跑 fbm5 天空着色器——后者每像素要十几次纹理采样，4 张卡同时跑会拖垮低端机。
// `setLaneSky()` 在选卡/重 roll 时只改 uniform + 重烘一次，卡片即时反映所选时间+天气。
//
// 前景（太阳/敌人/雨丝/闪电/光柱）仍是轻量几何体，保持原实现。
// WebGL 失败时抛错，由调用方 catch 并保留 CSS keyframes 降级。
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderTarget,
  WebGLRenderer,
} from "../vendor/three-r180.js";
import { combine } from "../core/environment-presets.js";
import { Hy, applySkyPreset, createNoiseTexture } from "../render/sky.js";

// 每张卡的「签名」环境：卡片默认显示它，玩家选卡/重 roll 后换成实际滚动到的格子。
// 注意：`combine()` 里 skyTop/skyHorizon 只由「时间」决定，天气只改 sunDisk，
// 所以 4 张卡必须用 4 个不同时间段，缩略图上才真的能分辨。
// 每个格子都在对应 lane 的 cells 列表内（见 menus.js 的 LANES）。
var PREVIEW_CELLS = {
  recon: ["noon", "clear"], // 正午晴：太阳盘全开、天最亮
  assault: ["dusk", "heavyRain"], // 黄昏暴雨：暗橙天、太阳盘几乎熄灭
  stealth: ["midnight", "clear"], // 午夜晴：深蓝夜空，无太阳
  balanced: ["dawn", "lightRain"], // 黎明小雨：灰暖天，太阳盘压到 0.08
};

// 正交相机视锥：x ∈ [-1,1]，y ∈ [-0.62,0.62]（16:10）。背景 quad 与之等大。
var FRUSTUM = { halfW: 1, halfH: 0.62, near: 0.1, far: 10, z: 5 };

// 实机 ACES 的曝光基准（renderer.js 用 0.6 * exposure）：这里把 toneMappingExposure
// 固定成 0.6，逐卡把 exposure 乘到 bgMat.color 上，等价于实机的 ACES(linear * exposure)。
var ACES_BASE = 0.6;

function isLowQuality(context) {
  let q = context && context.quality;
  if (!q) return false;
  let name = q.name || q;
  return name === "low" || name === "test" || name === "mobile";
}

// ---- 单个场景：recon (A) 白天开阔——脉动太阳 + 两个远处敌人巡逻 ----
function buildRecon(low) {
  let scene = new Scene();
  let cam = new OrthographicCamera(-1, 1, 0.62, -0.62, 0.1, 10);
  cam.position.z = 5;

  let sun = new Mesh(
    new SphereGeometry(0.16, 20, 14),
    new MeshBasicMaterial({ color: 0xffd070, toneMapped: false }),
  );
  sun.position.set(-0.62, 0.3, 0);
  scene.add(sun);

  // 太阳光晕（加色半透明球）
  let halo = new Mesh(
    new SphereGeometry(0.26, 20, 14),
    new MeshBasicMaterial({
      color: 0xffe6a8,
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.position.copy(sun.position);
  scene.add(halo);

  let eg = new BoxGeometry(0.05, 0.16, 0.05);
  let em = new MeshBasicMaterial({ color: 0x2a3440, toneMapped: false });
  let e1 = new Mesh(eg, em);
  e1.position.set(0.45, -0.42, 0);
  let e2 = new Mesh(eg, em);
  e2.position.set(0.72, -0.42, 0);
  scene.add(e1, e2);

  return {
    scene,
    cam,
    update(dt, t) {
      let s = 1 + Math.sin(t * 2.4) * 0.12;
      sun.scale.setScalar(s);
      halo.scale.setScalar(1 + Math.sin(t * 2.4) * 0.2);
      e1.position.x = 0.45 + Math.sin(t * 1.2) * 0.07;
      e2.position.x = 0.72 + Math.sin(t * 1.2 + 1.3) * 0.07;
    },
  };
}

// ---- 单个场景：assault (B) 白天雨——下落雨丝 + 周期性闪电白闪 ----
function buildAssault(low) {
  let scene = new Scene();
  let cam = new OrthographicCamera(-1, 1, 0.62, -0.62, 0.1, 10);
  cam.position.z = 5;

  let count = low ? 18 : 32;
  let rainGeo = new PlaneGeometry(0.008, 0.09);
  let rainMat = new MeshBasicMaterial({
    color: 0x9bb8dc,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    toneMapped: false,
  });
  let rain = new InstancedMesh(rainGeo, rainMat, count);
  let dummy = new Object3D();
  let drops = [];
  for (let i = 0; i < count; i++)
    drops.push({
      x: (Math.random() * 2 - 1) * 0.95,
      y: Math.random() * 1.3 - 0.65,
      spd: 1.6 + Math.random() * 1.6,
    });
  scene.add(rain);

  let flashMat = new MeshBasicMaterial({
    color: 0xdfe8ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  let flash = new Mesh(new PlaneGeometry(2.2, 1.4), flashMat);
  flash.position.z = 1;
  scene.add(flash);

  return {
    scene,
    cam,
    update(dt, t) {
      for (let i = 0; i < count; i++) {
        let d = drops[i];
        d.y -= d.spd * dt;
        if (d.y < -0.7) {
          d.y = 0.7;
          d.x = (Math.random() * 2 - 1) * 0.95;
        }
        dummy.position.set(d.x, d.y, 0);
        dummy.updateMatrix();
        rain.setMatrixAt(i, dummy.matrix);
      }
      rain.instanceMatrix.needsUpdate = true;
      // 每 2.8s 一次双闪
      let f = t % 2.8;
      flashMat.opacity =
        (f > 2.55 && f < 2.6) || (f > 2.68 && f < 2.72) ? 0.75 : 0;
    },
  };
}

// ---- 单个场景：stealth (C) 夜晴——探照光柱横扫 + 地面光斑 + 悬停直升机 + 暗处敌人 ----
function buildStealth(low) {
  let scene = new Scene();
  let cam = new OrthographicCamera(-1, 1, 0.62, -0.62, 0.1, 10);
  cam.position.z = 5;

  let beamMat = new MeshBasicMaterial({
    color: 0xfff0c8,
    transparent: true,
    opacity: 0.35,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  let beam = new Mesh(new PlaneGeometry(0.18, 2.2), beamMat);
  beam.rotation.z = -0.28;
  beam.position.set(-1.4, 0.1, 0);
  scene.add(beam);

  // 光柱落地的圆形光斑
  let spotMat = new MeshBasicMaterial({
    color: 0xfff0c8,
    transparent: true,
    opacity: 0.25,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  let spot = new Mesh(new PlaneGeometry(0.5, 0.18), spotMat);
  spot.position.set(-1.4, -0.5, 0.1);
  scene.add(spot);

  // 光柱顶端悬停的直升机小亮点
  let heli = new Mesh(
    new BoxGeometry(0.09, 0.035, 0.035),
    new MeshBasicMaterial({ color: 0x9fb4cc, toneMapped: false }),
  );
  heli.position.set(-1.4, 1.05, 0);
  scene.add(heli);

  let eg = new BoxGeometry(0.05, 0.16, 0.05);
  let em = new MeshBasicMaterial({ color: 0x1a2030, toneMapped: false });
  let e1 = new Mesh(eg, em);
  e1.position.set(-0.3, -0.42, 0);
  let e2 = new Mesh(eg, em);
  e2.position.set(0.35, -0.42, 0);
  scene.add(e1, e2);

  return {
    scene,
    cam,
    update(dt, t) {
      let c = (t % 3.8) / 3.8;
      let x = -1.4 + c * 2.8;
      beam.position.x = x;
      spot.position.x = x;
      heli.position.x = x;
      heli.position.y = 1.05 + Math.sin(t * 3) * 0.02;
    },
  };
}

// ---- 单个场景：balanced (D) 夜暴风雨——更密斜雨 + 更频繁闪电 + 一个敌人微晃 ----
function buildStorm(low) {
  let scene = new Scene();
  let cam = new OrthographicCamera(-1, 1, 0.62, -0.62, 0.1, 10);
  cam.position.z = 5;

  let count = low ? 24 : 44;
  // 斜雨：用细长平面并整体倾斜
  let rainGeo = new PlaneGeometry(0.008, 0.12);
  let rainMat = new MeshBasicMaterial({
    color: 0x8aa6cc,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    toneMapped: false,
  });
  let rain = new InstancedMesh(rainGeo, rainMat, count);
  let dummy = new Object3D();
  dummy.rotation.z = 0.18; // 斜雨角度
  let drops = [];
  for (let i = 0; i < count; i++)
    drops.push({
      x: (Math.random() * 2 - 1) * 0.95,
      y: Math.random() * 1.3 - 0.65,
      spd: 2.4 + Math.random() * 2.0,
    });
  scene.add(rain);

  let flashMat = new MeshBasicMaterial({
    color: 0xcdd8f0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  let flash = new Mesh(new PlaneGeometry(2.2, 1.4), flashMat);
  flash.position.z = 1;
  scene.add(flash);

  let enemy = new Mesh(
    new BoxGeometry(0.05, 0.16, 0.05),
    new MeshBasicMaterial({ color: 0x2a2030, toneMapped: false }),
  );
  enemy.position.set(0, -0.42, 0);
  scene.add(enemy);

  return {
    scene,
    cam,
    update(dt, t) {
      for (let i = 0; i < count; i++) {
        let d = drops[i];
        d.y -= d.spd * dt;
        d.x -= d.spd * dt * 0.18; // 斜雨水平分量
        if (d.y < -0.7) {
          d.y = 0.7;
          d.x = (Math.random() * 2 - 1) * 0.95;
        }
        dummy.position.set(d.x, d.y, 0);
        dummy.updateMatrix();
        rain.setMatrixAt(i, dummy.matrix);
      }
      rain.instanceMatrix.needsUpdate = true;
      // 暴雨闪电更频繁：每 1.7s
      let f = t % 1.7;
      flashMat.opacity =
        (f > 1.5 && f < 1.54) || (f > 1.58 && f < 1.61) ? 0.6 : 0;
      enemy.rotation.z = Math.sin(t * 0.8) * 0.1;
    },
  };
}

// 纯函数：时间+天气 → 天空 uniform 载荷 + 曝光。抽出来便于无 WebGL 环境单测。
// 只取 `combine()` 里天空真正消费的字段，其余（雾/雨/能见度）不动。
function briefingSkyPreset(timeOfDay, weather) {
  let p = combine(timeOfDay, weather);
  return {
    skyTop: p.skyTop,
    skyHorizon: p.skyHorizon,
    sunColor: p.sunColor,
    sunDir: p.sunDir,
    sunDisk: p.sunDisk,
    exposure: p.exposure,
  };
}

function createBriefingScenes(context) {
  let renderer = null,
    canvas = null,
    gridEl = null,
    mounted = false,
    raf = 0,
    lastT = 0,
    ro = null,
    mq = null,
    noiseTex = null,
    lanes = [],
    viewports = [],
    low = isLowQuality(context);

  function buildAll() {
    lanes = [
      { key: "recon", el: null, ...buildRecon(low) },
      { key: "assault", el: null, ...buildAssault(low) },
      { key: "stealth", el: null, ...buildStealth(low) },
      { key: "balanced", el: null, ...buildStorm(low) },
    ];
    for (let l of lanes) attachSky(l);
  }

  // 每卡一套：真天空材质 + 专用正交相机 + 一张 RenderTarget（烘好的天色）+ 背景 quad。
  // 4 个天空材质 shader 源码完全相同、无差异化 define，three 的程序缓存会复用同一个
  // program；noise 贴图 4 卡共享一张。
  function attachSky(lane) {
    let sky = Hy(noiseTex);

    let skyScene = new Scene();
    skyScene.add(sky.mesh);

    let skyCam = new OrthographicCamera(
      -FRUSTUM.halfW,
      FRUSTUM.halfW,
      FRUSTUM.halfH,
      -FRUSTUM.halfH,
      FRUSTUM.near,
      FRUSTUM.far,
    );
    skyCam.position.z = FRUSTUM.z;

    // 初始 64x40，mount 后 resize() 会按卡片实际像素重设并重烘
    let rt = new WebGLRenderTarget(64, 40);
    rt.texture.colorSpace = LinearSRGBColorSpace;

    let bgMat = new MeshBasicMaterial({
      map: rt.texture,
      depthWrite: false,
      fog: false,
    });
    let bg = new Mesh(
      new PlaneGeometry(FRUSTUM.halfW * 2, FRUSTUM.halfH * 2),
      bgMat,
    );
    bg.position.z = -2;
    bg.frustumCulled = false;
    bg.renderOrder = -500;
    lane.scene.add(bg);

    lane.sky = sky;
    lane.skyScene = skyScene;
    lane.skyCam = skyCam;
    lane.rt = rt;
    lane.bgMat = bgMat;
    lane.bg = bg;
    lane.cell = null;
    lane.exposure = 1;
  }

  // 把某个时间+天气刷到一张卡上。只写 uniform，O(1)，不重建、不重编译。
  function applyCell(lane, cell, stamp) {
    if (!lane || !lane.sky || !cell) return;
    let p = briefingSkyPreset(cell[0], cell[1]);
    applySkyPreset(lane.sky, p);
    let u = lane.sky.material.uniforms;
    if (u.uTime) u.uTime.value = stamp;
    if (u.uEnv) u.uEnv.value = 0; // 0 = 可见天空（1 是 PMREM 环境贴图模式）
    if (u.uFlash) u.uFlash.value = 0;
    lane.exposure = p.exposure;
    lane.cell = [cell[0], cell[1]];
    // 曝光乘进材质颜色：renderer.toneMappingExposure 固定 0.6，
    // 于是像素 = ACES(linearSky * exposure)，与实机 ACES(linear * exposure) 等价。
    if (lane.bgMat) lane.bgMat.color.setScalar(p.exposure);
  }

  // 把该卡天空烘进 RenderTarget。只在挂载 / 换格 / resize 时调用，不在每帧调用。
  function bakeSky(lane) {
    if (!renderer || !lane || !lane.rt || !lane.skyScene) return;
    if (lane.rt.width < 8 || lane.rt.height < 8) return;
    renderer.setScissorTest(false);
    renderer.setRenderTarget(lane.rt);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(!0, !0, !1);
    renderer.render(lane.skyScene, lane.skyCam);
    renderer.setRenderTarget(null);
    renderer.setScissorTest(true);
  }

  // 对外：选卡 / 重 roll 时切某张卡的天色。
  function setLaneSky(key, timeOfDay, weather) {
    let lane = null;
    for (let l of lanes) if (l.key === key) lane = l;
    if (!lane) return false;
    applyCell(lane, [timeOfDay, weather], performance.now() / 1000);
    if (mounted) bakeSky(lane);
    return true;
  }

  function computeViewports() {
    if (!canvas || !gridEl) return;
    let cr = canvas.getBoundingClientRect();
    let sx = canvas.width / Math.max(1, cr.width);
    let sy = canvas.height / Math.max(1, cr.height);
    viewports = [];
    for (let l of lanes) {
      if (!l.el) continue;
      let r = l.el.getBoundingClientRect();
      viewports.push({
        lane: l,
        x: (r.left - cr.left) * sx,
        y: (cr.bottom - r.bottom) * sy,
        w: r.width * sx,
        h: r.height * sy,
      });
    }
  }

  function resize() {
    if (!renderer || !gridEl) return;
    let rect = gridEl.getBoundingClientRect();
    let dpr = low ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    computeViewports();
    // 天空贴图跟卡片实际像素走；宽度上限 512 约束重烘成本。
    for (let vp of viewports) {
      let lane = vp.lane;
      if (!lane || !lane.rt) continue;
      let w = Math.max(48, Math.round(vp.w));
      let h = Math.max(32, Math.round(vp.h));
      if (w > 512) {
        h = Math.max(32, Math.round((h * 512) / w));
        w = 512;
      }
      if (lane.rt.width !== w || lane.rt.height !== h) {
        lane.rt.setSize(w, h);
        bakeSky(lane);
      }
    }
  }

  function renderOnce(t, dt) {
    if (!renderer) return;
    for (let l of lanes) l.update(dt, t);
    renderer.setScissorTest(true);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, false, false);
    for (let vp of viewports) {
      if (vp.w <= 0 || vp.h <= 0) continue;
      renderer.setViewport(vp.x, vp.y, vp.w, vp.h);
      renderer.setScissor(vp.x, vp.y, vp.w, vp.h);
      renderer.render(vp.lane.scene, vp.lane.cam);
    }
  }

  function loop(now) {
    if (!mounted) return;
    let dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    renderOnce(now / 1000, dt);
    raf = requestAnimationFrame(loop);
  }

  function applyReducedMotion() {
    let reduced = mq && mq.matches;
    if (reduced) {
      cancelAnimationFrame(raf);
      raf = 0;
      renderOnce(lastT / 1000, 0);
    } else if (mounted && !raf) {
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function mount(el) {
    if (mounted || !el) return;
    gridEl = el;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch (err) {
      gridEl = null;
      throw err;
    }
    renderer.setPixelRatio(low ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    // 与实机后处理同样的 tone mapping：背景贴图走 ACES，前景材质 toneMapped:false 保持原样。
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = ACES_BASE;
    canvas = renderer.domElement;
    canvas.className = "briefing-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
    el.dataset.scenes = "on";

    // noise 贴图 4 卡共享一张（256x256 RGBA）
    noiseTex = createNoiseTexture();
    buildAll();
    for (let l of lanes) l.el = el.querySelector(".lane-anim.lane-" + l.key);
    // 初始天色：每张卡先给它的「签名」环境，uTime 取随机相位让 4 张卡云层不同。
    for (let l of lanes) {
      let c = PREVIEW_CELLS[l.key];
      if (c) applyCell(l, c, Math.random() * 20);
    }
    resize();

    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", applyReducedMotion);
    ro = new ResizeObserver(() => {
      if (mounted) resize();
    });
    ro.observe(el);

    mounted = true;
    if (mq.matches) {
      renderOnce(0, 0);
    } else {
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function unmount() {
    if (!mounted && !renderer) return;
    mounted = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (mq) {
      mq.removeEventListener("change", applyReducedMotion);
      mq = null;
    }
    if (ro) {
      ro.disconnect();
      ro = null;
    }
    if (renderer) {
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      renderer = null;
    }
    if (canvas) {
      canvas.remove();
      canvas = null;
    }
    for (let l of lanes) {
      l.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      // 天空是独立 scene，主 scene.traverse 覆盖不到，单独释放
      if (l.skyScene) {
        l.skyScene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material))
              obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
      if (l.rt) {
        l.rt.dispose();
        l.rt = null;
      }
      l.sky = null;
      l.skyScene = null;
      l.bgMat = null;
      l.bg = null;
    }
    if (noiseTex) {
      noiseTex.dispose();
      noiseTex = null;
    }
    lanes = [];
    viewports = [];
    if (gridEl) {
      gridEl.dataset.scenes = "off";
      gridEl = null;
    }
  }

  return {
    mount,
    unmount,
    setLaneSky,
    get mounted() {
      return mounted;
    },
  };
}

export { createBriefingScenes, briefingSkyPreset, PREVIEW_CELLS };
