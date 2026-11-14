# 简报屏幕动画改为 Three.js 小场景（C 方案）

## 0. 方案要点

| 项 | 决策 |
|---|---|
| 渲染器 | **1 个独立 `WebGLRenderer`**（透明背景），不是 4 个（避免浏览器 context 上限） |
| 布局 | **1 个 canvas 覆盖 `.mb-grid`**，用 `scissor` + `viewport` 渲染到 4 个 `.lane-anim` 的区域 |
| 场景 | 4 个独立 `Scene` + 4 个 `OrthographicCamera`，每个场景只放前景元素（太阳/敌人/雨/光柱），背景色仍由 CSS `.lane-*` 提供 |
| 循环 | 自带 `requestAnimationFrame`，`mount` 启动、`unmount` 停止；`prefers-reduced-motion` 时只渲染 1 帧 |
| 降级 | WebGL 失败 → `data-scenes="off"` → 保留 CSS keyframes 作降级 |
| 卸载 | `unmount` 时 `renderer.dispose()` + `forceContextLoss()` + 遍历 scene dispose 几何/材质 |

---

## 1. 新增 `src/ui/briefing-scenes.js`

```js
// 4 lane cards' mini-scenes, rendered with one shared WebGL renderer
// via scissor/viewport. Foreground elements only; card background stays CSS.
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  Mesh,
  InstancedMesh,
  SphereGeometry,
  BoxGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  AdditiveBlending,
  Object3D,
  Color,
} from "../vendor/three-r180.js";

var isLowQuality = (context) =>
  context && context.quality &&
  (context.quality.name === "low" || context.quality.name === "test");

export function createBriefingScenes(context) {
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
    reducedMotion = false,
    low = isLowQuality(context);

  function buildRecon() {
    let scene = new Scene(),
      cam = new OrthographicCamera(-1, 1, 0.6, -0.6, 0.1, 10);
    cam.position.z = 5;
    let sun = new Mesh(
      new SphereGeometry(0.35, 24, 16),
      new MeshBasicMaterial({ color: 0xffd070, toneMapped: false }),
    );
    sun.position.set(-0.55, 0.35, 0);
    scene.add(sun);
    let enemyGeo = new BoxGeometry(0.08, 0.22, 0.08),
      enemyMat = new MeshBasicMaterial({ color: 0x2a3440 });
    let e1 = new Mesh(enemyGeo, enemyMat);
    e1.position.set(0.45, -0.35, 0);
    scene.add(e1);
    let e2 = new Mesh(enemyGeo, enemyMat);
    e2.position.set(0.7, -0.35, 0);
    scene.add(e2);
    return {
      scene,
      cam,
      update(dt, t) {
        sun.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);
        e1.position.x = 0.45 + Math.sin(t * 1.2) * 0.08;
        e2.position.x = 0.7 + Math.sin(t * 1.2 + 1.2) * 0.08;
      },
    };
  }

  function buildAssault() {
    let scene = new Scene(),
      cam = new OrthographicCamera(-1, 1, 0.6, -0.6, 0.1, 10);
    cam.position.z = 5;
    let rainCount = low ? 16 : 32,
      rainGeo = new PlaneGeometry(0.012, 0.08),
      rainMat = new MeshBasicMaterial({
        color: 0x9bb8dc,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
      rain = new InstancedMesh(rainGeo, rainMat, rainCount),
      dummy = new Object3D(),
      drops = [];
    for (let i = 0; i < rainCount; i++)
      drops.push({
        x: (Math.random() * 2 - 1) * 0.9,
        y: Math.random() * 1.4 - 0.7,
        speed: 1.5 + Math.random() * 1.5,
      });
    scene.add(rain);
    let flashMat = new MeshBasicMaterial({
        color: 0xdfe8ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      flash = new Mesh(new PlaneGeometry(2, 1.2), flashMat);
    flash.position.z = 1;
    scene.add(flash);
    return {
      scene,
      cam,
      update(dt, t) {
        for (let i = 0; i < rainCount; i++) {
          let d = drops[i];
          d.y -= d.speed * dt;
          if (d.y < -0.7) {
            d.y = 0.7;
            d.x = (Math.random() * 2 - 1) * 0.9;
          }
          dummy.position.set(d.x, d.y, 0);
          dummy.updateMatrix();
          rain.setMatrixAt(i, dummy.matrix);
        }
        rain.instanceMatrix.needsUpdate = true;
        let f = t % 2.8;
        flashMat.opacity =
          (f > 2.6 && f < 2.65) || (f > 2.7 && f < 2.73) ? 0.7 : 0;
      },
    };
  }

  function buildStealth() {
    let scene = new Scene(),
      cam = new OrthographicCamera(-1, 1, 0.6, -0.6, 0.1, 10);
    cam.position.z = 5;
    let beamMat = new MeshBasicMaterial({
        color: 0xfff0c8,
        transparent: true,
        opacity: 0.4,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
      beam = new Mesh(new PlaneGeometry(0.3, 2), beamMat);
    beam.rotation.z = -0.3;
    beam.position.set(-1.5, 0, 0);
    scene.add(beam);
    let enemyGeo = new BoxGeometry(0.08, 0.22, 0.08),
      enemyMat = new MeshBasicMaterial({ color: 0x1a2030 }),
      e1 = new Mesh(enemyGeo, enemyMat),
      e2 = new Mesh(enemyGeo, enemyMat);
    e1.position.set(-0.3, -0.35, 0);
    e2.position.set(0.3, -0.35, 0);
    scene.add(e1, e2);
    return {
      scene,
      cam,
      update(dt, t) {
        let c = (t % 3.6) / 3.6;
        beam.position.x = -1.5 + c * 3;
      },
    };
  }

  function buildBalanced() {
    let scene = new Scene(),
      cam = new OrthographicCamera(-1, 1, 0.6, -0.6, 0.1, 10);
    cam.position.z = 5;
    let enemy = new Mesh(
      new BoxGeometry(0.08, 0.22, 0.08),
      new MeshBasicMaterial({ color: 0x2a2030 }),
    );
    enemy.position.set(0, -0.35, 0);
    scene.add(enemy);
    return {
      scene,
      cam,
      update(dt, t) {
        enemy.rotation.z = Math.sin(t * 0.8) * 0.1;
      },
    };
  }

  function buildAll() {
    lanes = [
      { key: "recon", el: null, ...buildRecon() },
      { key: "assault", el: null, ...buildAssault() },
      { key: "stealth", el: null, ...buildStealth() },
      { key: "balanced", el: null, ...buildBalanced() },
    ];
  }

  function computeViewports() {
    if (!canvas || !gridEl) return;
    let canvasRect = canvas.getBoundingClientRect(),
      scaleX = canvas.width / Math.max(1, canvasRect.width),
      scaleY = canvas.height / Math.max(1, canvasRect.height);
    viewports = [];
    for (let l of lanes) {
      if (!l.el) continue;
      let r = l.el.getBoundingClientRect();
      viewports.push({
        lane: l,
        x: (r.left - canvasRect.left) * scaleX,
        y: (canvasRect.bottom - r.bottom) * scaleY,
        w: r.width * scaleX,
        h: r.height * scaleY,
      });
    }
  }

  function resize() {
    if (!renderer || !gridEl) return;
    let rect = gridEl.getBoundingClientRect(),
      dpr = low ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);
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
    renderer.clear();
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
    reducedMotion = mq && mq.matches;
    if (reducedMotion) {
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
    el.appendChild(canvas);
    el.dataset.scenes = "on";

    buildAll();
    for (let l of lanes) {
      l.el = el.querySelector(".lane-anim.lane-" + l.key);
    }
    resize();

    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = mq.matches;
    mq.addEventListener("change", applyReducedMotion);
    ro = new ResizeObserver(() => {
      if (mounted) resize();
    });
    ro.observe(el);

    mounted = true;
    if (reducedMotion) {
      renderOnce(0, 0);
    } else {
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;
    cancelAnimationFrame(raf);
    raf = 0;
    mq && mq.removeEventListener("change", applyReducedMotion);
    ro && ro.disconnect();
    ro = null;
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss && renderer.forceContextLoss();
      renderer = null;
    }
    canvas && canvas.remove();
    canvas = null;
    for (let l of lanes) {
      l.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
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
    debug: {
      get low() { return low; },
      get reducedMotion() { return reducedMotion; },
      get lanes() { return lanes.map((l) => l.key); },
    },
  };
}
```

**要点**：
- `renderer.autoClear = false`，`renderOnce` 手动 `clear()` 一次，4 个 viewport 各自 `setScissor`。
- `y` 翻转：`(canvasRect.bottom - r.bottom) * scaleY`，WebGL 原点在左下。
- `computeViewports` 用 `.lane-anim.lane-<key>` 定位，`gridEl.querySelector` 一次即可。
- `unmount` 遍历 scene dispose 所有几何/材质，`forceContextLoss` 释放 WebGL context。
- `low` 画质：`dpr 0.75` + 雨滴 16，减少开销。
- `prefers-reduced-motion`：只渲染 1 帧，不启动 rAF；偏好变化时动态切换。

---

## 2. `src/ui/menus.js` 改动

### 2.1 顶部 import

```js
import { createBriefingScenes } from "./briefing-scenes.js";
```

### 2.2 `createMenus` 内初始化

在 `let briefing = { lane: null, cell: null };` 之后：

```js
  let briefingScenes = createBriefingScenes(context);
```

### 2.3 `showBriefing()` 加 `mount`

在 `showBriefing` 末尾、`setTimeout(H, 30)` 之前：

```js
  function showBriefing() {
    briefing.lane = null;
    briefing.cell = null;
    syncLaneButtons();
    renderBriefing();
    let rr = o('[data-act="reroll"]');
    let dp = o('[data-act="deploy-lane"]');
    if (rr) rr.disabled = true;
    if (dp) dp.disabled = true;
    p = "briefing";
    s.dataset.screen = "briefing";
    s.classList.add("open");
    S();
    try {
      briefingScenes.mount(o(".mb-grid"));
    } catch (err) {
      console.warn("[briefing] Three.js scenes unavailable: " + err);
    }
    setTimeout(H, 30);
  }
```

### 2.4 `deployLane()` 加 `unmount`

```js
  function deployLane() {
    if (!briefing.lane || !briefing.cell) return;
    let text = briefText(briefing.cell[0], briefing.cell[1], briefing.lane);
    speakBriefing(text);
    try { briefingScenes.unmount(); } catch {}
    if (context.environment && context.environment.set) {
      context.environment.set({
        timeOfDay: briefing.cell[0],
        weather: briefing.cell[1],
      });
    }
    context.events.emit("ui:click", {});
    e.deploy({
      lane: briefing.lane,
      timeOfDay: briefing.cell[0],
      weather: briefing.cell[1],
    });
  }
```

### 2.5 `q.show` 离开 `briefing` 时 `unmount`

在 `q.show` 的 `U !== p` 分支内、`s.classList.toggle("open", U !== "none")` 之后：

```js
      show(U) {
        U !== p &&
          ((p = U),
          (s.dataset.screen = U),
          S(),
          s.classList.toggle("open", U !== "none"),
          U !== "briefing" && briefingScenes.unmount(),
          U !== "none"
            ? (g(), setTimeout(H, 30))
            : document.activeElement &&
              s.contains(document.activeElement) &&
              document.activeElement.blur());
      },
```

**理由**：`showBriefing` 直接用 DOM 设 `dataset.screen`，不经过 `q.show`；但若外部调 `q.show("title")` 时简报屏幕还开着，`unmount` 释放资源。

### 2.6 `speakBriefing`（可选，TTS）

如果之前加过 `speakBriefing`，保留；`deployLane` 内调用位置不变。TTS 与 Three.js 小场景无冲突。

---

## 3. `src/ui.css` 改动

### 3.1 新增 canvas 样式与 `data-scenes` 降级

```css
/* ---- briefing Three.js scenes (M5 C) ---- */
.mb-grid {
  position: relative;
}
.mb-grid > canvas.briefing-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  display: block;
}
/* 当 Three.js 场景接管时，隐藏 CSS 降级动画的前景元素 */
.mb-grid[data-scenes="on"] .lane-anim > * {
  display: none;
}
.mb-grid[data-scenes="on"] .lane-anim::after {
  animation: none;
  opacity: 0;
}
```

### 3.2 `.lane-anim` 保留作为占位 + 降级

`.lane-recon` / `.lane-assault` / `.lane-stealth` / `.lane-balanced` 的**背景色/渐变**保留（Three.js canvas 透明，背景由 CSS 提供）：

```css
.lane-recon { background: linear-gradient(180deg, #b8c8d8 0%, #e8eef2 70%); }
.lane-assault { background: #0a1220; }
.lane-stealth { background: #05070c; }
.lane-balanced { background: linear-gradient(180deg, #4a3a52 0%, #c08a6a 100%); }
```

**CSS keyframes 全部保留**作为 `data-scenes="off"` 时的降级（WebGL 失败、低端机、`prefers-reduced-motion` 且用户不愿看静态）。Three.js 成功时 `data-scenes="on"` 隐藏前景元素，只剩背景。

**关键**：`.la-*` 子元素仍由 HTML 提供（`laneAnimMarkup` 生成），只是 `data-scenes="on"` 时 `display: none`。这样 CSS 降级完整保留。

### 3.3 `prefers-reduced-motion`

现有块内追加：

```css
  .mb-grid[data-scenes="off"] .lane-anim *,
  .mb-grid[data-scenes="off"] .lane-anim::after {
    animation: none !important;
  }
```

`data-scenes="on"` 时 Three.js 只渲染 1 帧静态，CSS 动画被隐藏，无需额外处理。

---

## 4. 验收清单

**功能**
- [ ] 无 URL 参数：Title 的 `Deploy` → 简报屏幕，4 个 `.lane-anim` 显示 Three.js 小场景
- [ ] `recon`：太阳脉动、两个敌人左右巡逻
- [ ] `assault`：雨滴下落、每 2.8s 闪电闪白
- [ ] `stealth`：光柱从左扫到右、两个敌人静止
- [ ] `balanced`：一个敌人左右微摆
- [ ] 点 `DEPLOY`：`unmount` 释放 WebGL，进游戏
- [ ] 关闭简报（外部 `q.show`）时 `unmount`

**降级**
- [ ] WebGL 失败（模拟：`WebGLRenderer` 抛错）：`data-scenes="off"`，CSS keyframes 动画正常工作
- [ ] `?q=low`：雨滴 16、`pixelRatio 0.75`，动画仍可读
- [ ] `prefers-reduced-motion: reduce`：只渲染 1 帧静态图，不跑 rAF；切换偏好时动态切换

**性能**
- [ ] 简报屏幕打开时 `requestAnimationFrame` 运行，关闭时停止
- [ ] `unmount` 后 `canvas` 从 DOM 移除，`renderer.dispose()` + `forceContextLoss`
- [ ] 4 个 scene 的几何/材质在 `unmount` 时 `dispose`
- [ ] 打开简报屏幕首次 `mount` < 50ms（4 个小场景，几何极少）

**边界**
- [ ] 窄屏 2×2 布局：`ResizeObserver` 重算 4 个 viewport，无错位
- [ ] 窗口 resize：`resize()` 重算 canvas 尺寸和 viewport
- [ ] `?autostart=1` / `?shot=1`：不进简报屏幕，`briefingScenes` 不 `mount`，无 WebGL 开销
- [ ] 反复 `showBriefing` / `deployLane`：`mount` 幂等（`mounted` 检查），`unmount` 幂等

**回归**
- [ ] `npm run check` 通过（新增 `briefing-scenes.js`，模块数 71 → 72）
- [ ] M1–M5 其他验收项不受影响

---

## 5. 风险与缓解

| 风险 | 缓解 |
|---|---|
| WebGL context 上限 | 只 1 个 briefing renderer + 1 个主 renderer，2 个 context，远低于浏览器上限 |
| 与主 renderer 的 canvas 重叠 | 简报 canvas 在 `#ui` 内的 `.mb-grid`，主 canvas 在 `#view`；`#ui` z-index 更高，简报 canvas 在上层；`pointer-events: none` 不挡点击 |
| `mount` 时 `gridEl` 尺寸为 0（简报屏幕 `display: none`） | `showBriefing` 先设 `dataset.screen = "briefing"` + `classList.add("open")`，再 `mount`；`ResizeObserver` 首次回调会重算 |
| `prefers-reduced-motion` 下只渲染 1 帧，`viewport` 未算好 | `resize()` 在 `mount` 内先调，`computeViewports` 完成后才 `renderOnce` |
| `low` 画质下 `pixelRatio 0.75` 太糊 | 简报屏幕是小卡片，0.75 可接受；若太糊，改 1.0，性能仍轻 |
| 雨滴 `InstancedMesh` 的 `instanceMatrix.needsUpdate` 每帧 | 32 个实例，开销可忽略 |
| `forceContextLoss` 后主 renderer 是否受影响 | 独立 renderer，互不影响 |
| `menus.js` 的 `q` 未定义时 `briefingScenes` 未初始化 | `briefingScenes` 在 `createMenus` 内、`q` 之前初始化，`showBriefing` 用它，`q.show` 也用它，顺序安全 |
| Three.js 场景的 `MeshBasicMaterial` 不受 `scene.fog` 影响 | 简报场景无 `fog`，且 `toneMapped: false` 的太阳不被 tone mapping 影响，颜色可控 |

---

## 6. 文件改动汇总

| 文件 | 改动 | 行数 |
|---|---|---|
| `src/ui/briefing-scenes.js` | **新增**，完整文件 | 约 330 行 |
| `src/ui/menus.js` | import / `briefingScenes` 初始化 / `showBriefing` 加 `mount` / `deployLane` 加 `unmount` / `q.show` 加 `unmount` | 约 15 行 |
| `src/ui.css` | 新增 `.mb-grid` 相对定位 + `.briefing-canvas` + `data-scenes="on"` 隐藏前景；保留 `.lane-*` 背景与 keyframes 作降级；`prefers-reduced-motion` 补充 | 约 25 行 |
| `src/core/fallbacks.js` | 不需要（`menus.js` 内 try/catch 降级） | — |
| `src/app/runtime.js` | 不需要（`createMenus` 已由 `flow.js` 调用） | — |

**模块数**：66 → 72（M1 加 2、M3 加 1、M4 加 1、M5 加 `environment` 展示模块可并入 `environment.js`、M5 加 `briefing-scenes.js`）。`WIKI.md` 第 1.1/2.2 的模块数需同步。

---

## 7. 与之前 Q1–Q5 决策的兼容性

| 决策 | 是否受影响 |
|---|---|
| Q1=A（Deploy → 简报 → 选 lane + 随机 → REROLL/DEPLOY） | 不受影响，`showBriefing` / `deployLane` 逻辑不变，只加 `mount`/`unmount` |
| Q2=A（简报屏幕显示完整台词，进游戏不重复 `hud.radio`） | 不受影响，`speakBriefing` 是额外 TTS，与 Three.js 无关 |
| Q3=B（暂停菜单 "Mission profile" 行） | 不受影响 |
| Q4=A（URL / `?shot` / `?autostart` 跳过简报） | 不受影响，`briefingEnabled` 判断不变，跳过时 `briefingScenes` 不 `mount` |
| Q5=A（全屏 4 卡横排，窄屏 2×2） | 不受影响，`ResizeObserver` 处理 2×2 的 viewport 重算 |

**需要你确认**：

1. **Three.js 小场景的视觉细节**：上面的 4 个场景（太阳+敌人 / 雨+闪电 / 光柱+敌人 / 敌人摆动）是否满意？还是要调整元素（比如 recon 加个掩体箱、assault 加个水面反光、stealth 加个地面圆斑）？
2. **`low` 画质的降级程度**：`pixelRatio 0.75` + 雨滴 16 是否够？还是要直接降级到 `data-scenes="off"`（CSS 动画）？
3. **`prefers-reduced-motion` 的静态帧**：只渲染 1 帧（元素停在初始位置）是否可接受？还是渲染 1 帧后仍保留 CSS 动画但减速？
4. **TTS 是否保留**：上一轮讨论的 `speakBriefing` 是否仍在 `deployLane` 内？Three.js 场景与 TTS 无冲突，可同时保留。

回 "确认" 或指出要改的点，我输出完整可粘贴的 `briefing-scenes.js` + `menus.js` diff + `ui.css` diff。