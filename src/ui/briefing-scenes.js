// 简报屏幕 4 个 lane 卡片的 Three.js 小场景。
// 1 个透明 WebGLRenderer，用 scissor/viewport 同时渲染 4 个正交小场景；
// 卡片背景色仍由 CSS .lane-* 提供，这里只画前景元素（太阳/敌人/雨/光柱）。
// WebGL 失败时抛错，由调用方 catch 并保留 CSS keyframes 降级。
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "../vendor/three-r180.js";

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

function createBriefingScenes(context) {
  let renderer = null,
    canvas = null,
    gridEl = null,
    mounted = false,
    raf = 0,
    lastT = 0,
    ro = null,
    mq = null,
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
    canvas = renderer.domElement;
    canvas.className = "briefing-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
    el.dataset.scenes = "on";

    buildAll();
    for (let l of lanes) l.el = el.querySelector(".lane-anim.lane-" + l.key);
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
    get mounted() {
      return mounted;
    },
  };
}

export { createBriefingScenes };
