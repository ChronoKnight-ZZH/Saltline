# Saltline 项目 Wiki

> 面向新加入项目的开发者、维护者与代码审查者。本文档以当前仓库实现为准，覆盖项目定位、目录结构、模块边界、关键函数契约以及逐文件说明。
>
> - 文档版本：1.0
> - 对应代码版本：`saltline-local@0.1.0`
> - 对应原版发布版本：`1794242702-61c7`
> - 模块规模：66 个 ES Module（`src/**/*.js`，含本地 Three.js r180）
> - 更新方式：修改模块公开接口、初始化顺序或事件契约时，必须同步更新本文档第 3、4、5 章。

---

## 目录

1. [项目概述](#1-项目概述)
2. [目录结构说明](#2-目录结构说明)
3. [核心模块功能定义](#3-核心模块功能定义)
4. [关键函数用法规范](#4-关键函数用法规范)
5. [各组件/文件的作用与设计意图](#5-各组件文件的作用与设计意图)
6. [附录](#6-附录)

---

## 1. 项目概述

### 1.1 项目定位

Saltline 是一个本地可编辑、可运行的浏览器第一人称射击游戏。它由公开的单文件构建产物恢复而来，并被重组为 66 个 ES 模块。游戏的画面、关卡、敌人、武器、音效、操作与菜单保持原版行为；模块边界、可读命名与构建流程为本地重建。

核心玩法目标：

1. 潜入 Saltline 港口。
2. 依次切断三个中继（Relay A 堆场 / Relay B 仓库 / Relay C 码头）。
3. 抵御随进度升级的敌人波次。
4. 抵达码头南端撤离点完成关卡。

### 1.2 技术栈与运行环境

| 类别 | 选型 | 说明 |
| --- | --- | --- |
| 语言 | 原生 JavaScript（ES Module） | `package.json` 中 `"type": "module"` |
| 渲染引擎 | 本地 Three.js r180 | [three-r180.js](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/vendor/three-r180.js)，通过标准命名导出 |
| 构建工具 | Vite 8.3.7 | 使用 `vite-plugin-singlefile` 输出单文件构建 |
| 音频 | Web Audio API | 程序化合成，无外部音频文件 |
| 样式 | 原生 CSS | [fonts.css](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/fonts.css)、[ui.css](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/ui.css) |
| Node.js | `^20.19.0 || >=22.12.0` | 见 `package.json#engines` |
| 浏览器 | 支持 WebGL 2 的 Chrome / Edge 等 | 推荐最新 LTS 浏览器 |
| 运行依赖 | 无外部 CDN、无 API Key | 字体与引擎全部本地化 |

### 1.3 启动链路

```text
index.html
  ├─ <link rel="stylesheet" href="./src/fonts.css">
  ├─ <link rel="stylesheet" href="./src/ui.css">
  ├─ <div id="app">
  │    ├─ <canvas id="view" tabindex="0">
  │    ├─ <div id="ui">
  │    └─ <div id="boot"> 启动进度层（boot-mark / boot-msg / boot-fill）
  └─ <script type="module" src="./src/game.js">

src/game.js
  ├─ import "./world/props/register.js"   // 副作用：按原版覆盖顺序安装道具 builder
  ├─ import "./app/diagnostics.js"        // 副作用：安装全局错误捕获
  └─ startGame().catch(showFatalError)
```

`startGame()` 的实际初始化顺序（由 [runtime.js](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/app/runtime.js) 集中管理）：

| 序号 | context 键 | 工厂函数 | 是否必需 | 失败回退 |
| --- | --- | --- | --- | --- |
| 1 | `render` | `createRenderer` | 是 | 无（致命错误） |
| 2 | `mats` | `createMaterials` | 否 | `FALLBACKS.mats` |
| 3 | `physics` | `createPhysics` | 否 | 无回退，直接抛出 |
| 4 | `props` | `createProps` | 否 | 无回退，直接抛出 |
| 5 | `input` | `createInput` / `createShowcaseInput` | 否 | 无回退，直接抛出 |
| 6 | `level` | `createLevel` | 是 | 无（致命错误） |
| 7 | `backdrop` | `createBackdrop` | 否 | `FALLBACKS.backdrop` |
| 8 | `ground` | `createGround` | 否 | `FALLBACKS.ground` |
| 9 | `fx` | `createEffects` | 否 | `FALLBACKS.fx` |
| 10 | `audio` | `createAudio` / `FALLBACKS.audio`（`?noaudio=1`） | 否 | `FALLBACKS.audio` |
| 11 | `player` | `createPlayer` | 否 | 无回退，直接抛出 |
| 12 | `combat` | `createCombat` | 否 | 无回退，直接抛出 |
| 13 | `weapon` | `createWeapon` | 否 | `FALLBACKS.weapon` |
| 14 | `enemies` | `createEnemies` | 否 | `FALLBACKS.enemies` |
| 15 | `hud` | `createHUD` | 否 | `FALLBACKS.hud` |
| 16 | `game` | `createGameFlow` | 否 | 无回退，直接抛出 |

`initializeSystem` 会捕获初始化异常：当 `FALLBACKS` 中存在同名实现时使用降级对象，否则重新抛出；单个系统耗时超过 150 ms 会输出 `[boot] <name> <ms>ms`。

初始化完成后调用 `context.render.onLevelReady()`，随后在 `?shot=1` 或 `?autostart=1` 时执行 `context.game.start({ skipIntro: true })`，最后进入 `renderer.setAnimationLoop`。

### 1.4 主循环与更新顺序

每帧由 [runtime.js](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/app/runtime.js) 驱动：

```text
measure real dt (averageFrameSeconds EMA)
dt = min(realDt, 0.05)；若提供 ?dt= 则强制使用该值
context.time.dt = dt; context.time.t += dt; context.time.real = performance.now()/1000; frame++

1. input.update(dt)
2. game.update(dt)                    // 返回值 !== false 且 state 不是 title/paused 时进入玩法更新
3. 若处于 showcase：showcaseInfo.update(dt)
   否则若玩法活跃：player.update → weapon.update → enemies.update
4. weapon.setWetness(...)             // 根据相机是否位于第一个 interiorBox 内平滑雨水量
5. 若 state !== "paused"：
     fx.update → ground.update → level.update → backdrop.update → mats.update
6. audio.update(dt)
7. hud.update(dt)
8. 若存在 cameraOverride：恢复固定机位（截图/基准模式）
9. 若 context.bench：bench.frame(realDt)
10. render.frame(dt)
11. input.endFrame()                  // 清空 pressed 集合与 look 增量
12. window.__frames++；第二帧时 window.__ready = true
```

关键约束：

- `dt` 上限 0.05 秒，避免切后台后物理穿透。
- `game.update` 抛错只记录一次；渲染、系统更新同样各自只记录一次，避免刷屏。
- 暂停时冻结世界与特效更新，但 `audio` 与 `hud` 仍更新。
- `input.endFrame()` 必须在每帧末尾调用，否则 `pressed()` 会持续为真。

### 1.5 运行上下文（Context）

`context` 是系统之间唯一的运行时装配容器，同时挂载到 `window.__G` 供诊断。

| 字段 | 类型 | 来源 | 说明 |
| --- | --- | --- | --- |
| `THREE` | `object` | `vendor/three-r180.js` | 引擎命名空间 |
| `params` | `Record<string,string>` | `URLSearchParams` | URL 调试参数 |
| `events` | `EventBus` | `createEventBus()` | 跨系统事件总线 |
| `rng` | `Random` | `createRandom(seed)` | 默认种子 `4207` |
| `time` | `{t, dt, frame, real}` | runtime | 游戏时间与真实时间 |
| `quality` | `QualityPreset` | `chooseQuality()` | 画质预设 |
| `showcase` | `string \| null` | `?show=` | 展示模式名称 |
| `renderer/scene/camera/viewCamera` | Three 对象 | `createRenderer` | 渲染核心句柄 |
| `render` | `RendererSystem` | `createRenderer` | 渲染系统对象 |
| `mats` | `MaterialSystem` | `createMaterials` | 材质与纹理缓存 |
| `physics` | `PhysicsSystem` | `createPhysics` | 碰撞、射线、导航 |
| `props` | `PropSystem` | `createProps` | 道具工厂 |
| `level` | `LevelSystem` | `createLevel` | 关卡、目标、出生点 |
| `backdrop` | `BackdropSystem` | `createBackdrop` | 远景、吊机、船、天际线 |
| `ground` | `GroundSystem` | `createGround` | 地面、水面、积水 |
| `fx` | `EffectsSystem` | `createEffects` | 粒子与命中特效 |
| `audio` | `AudioSystem` | `createAudio` | 合成器、混音、音乐 |
| `input` | `InputState` | `createInput` | 键鼠、触屏、手柄状态 |
| `player` | `PlayerState` | `createPlayer` | 玩家状态与相机 |
| `combat` | `CombatSystem` | `createCombat` | 射线命中、伤害判定 |
| `weapon` | `WeaponSystem` | `createWeapon` | 武器状态与视图模型 |
| `enemies` | `EnemySystem` | `createEnemies` | 敌人池、生成、射线检测 |
| `helicopter` | `HelicopterSystem` | `createHelicopter` | 夜晴直升机光柱/音效/暴露扫描（M3），见 4.3.6 |
| `lightning` | `LightningSystem` | `createLightning` | 雷暴闪电调度与视觉触发（M4），见 4.5.1 之后的 `createLightning` |
| `environment` | `EnvironmentSystem` | `createEnvironment` | 时间/天气/能见度中枢，见 4.1.6 |
| `hud` | `HUDSystem` | `createHUD` | DOM HUD |
| `game` | `GameFlow` | `createGameFlow` | 任务状态机与菜单 |
| `bench` | `{frame}` | `enableBenchmark` | 仅 `?bench=1` |
| `showcaseInfo` | `object` | showcase 模块 | 展示模式相机与 update |

### 1.6 诊断接口与 URL 参数

浏览器控制台可用：

| 接口 | 含义 |
| --- | --- |
| `window.__ready` | 至少完成两帧渲染 |
| `window.__frames` | 已渲染帧数 |
| `window.__fatal` | 启动致命错误字符串 |
| `window.__errors` | 捕获的错误数组（每条 `console.error` 截断为 400 字符） |
| `window.__stats()` | 渲染统计、FPS、游戏状态 |
| `window.__G` | 运行中的游戏上下文 |
| `window.__setShot({cam, fov, exposure})` | 固定机位/视场角/曝光，用于截图回归 |

URL 参数：

| 参数 | 示例 | 作用 |
| --- | --- | --- |
| `q` | `?q=low` | 指定画质：`test/low/medium/high/ultra` |
| `seed` | `?seed=4207` | 程序化随机种子 |
| `eseed` | `?eseed=9001` | 敌人随机种子 |
| `autostart` | `?autostart=1` | 跳过标题直接开始 |
| `noaudio` | `?noaudio=1` | 使用音频降级实现 |
| `bench` | `?bench=1` | 巡游基准与帧时间面板 |
| `shot` | `?shot=1` | 固定场景模式；默认画质 `test` |
| `dt` | `?dt=0` | 固定每帧时间步长 |
| `cam` | `?cam=-32,1.68,6,0,1.68,6` | 固定相机位置与看向点 |
| `fov` | `?fov=50` | 覆盖相机视场角 |
| `exposure` | `?exposure=0.8` | 覆盖曝光；仅在与 `cam` 同时提供时由 `setShot` 应用，或手动调用 `__setShot` |
| `noweapon` | `?noweapon=1` | 隐藏武器视图模型 |
| `show` | `?show=mats` | 进入展示模式；见 `SHOWCASE_MODULES` |
| `names` | `?show=props&names=barrel,pallet` | 道具展示过滤 |
| `bshow` | `?show=backdrop&bshow=crane` | 远景展示过滤 |
| `only` | `?show=mats&only=concrete` | 材质展示过滤 |
| `dynres` | `?dynres=0` | 关闭动态分辨率 |

### 1.7 设计原则

1. **显式装配，集中初始化**：所有系统由 `runtime.js` 按原版顺序创建，模块之间不在导入期互相启动。
2. **上下文注入**：工厂函数只接收 `context`，通过 `context.<system>` 访问运行时依赖，避免全局变量扩散。
3. **事件解耦**：跨系统副作用通过 `context.events` 通信，例如 `impact`、`enemy:killed`、`weapon:fire`。
4. **确定性随机**：世界生成使用 `context.rng`，敌人使用独立 `eseed` 随机源，便于复现与截图回归。
5. **优雅降级**：非核心系统提供 `FALLBACKS`，缺少音频、特效或 HUD 时游戏仍可启动。
6. **本地优先**：Three.js、字体、音频全部本地生成或本地文件，运行期间不访问第三方服务。
7. **静态合批**：关卡静态网格通过 `batchStaticMeshes` 合并，减少 draw call；动态物体单独挂载。

---

## 2. 目录结构说明

### 2.1 顶层结构

```text
Saltline/
├─ index.html                 # 页面入口、画布、启动层
├─ package.json               # 脚本、依赖、Node 版本约束
├─ package-lock.json          # 依赖锁定
├─ vite.config.js             # Vite 开发/构建/预览配置
├─ README.md                  # 项目说明、运行方式、操作表
├─ .github/workflows/pages.yml# GitHub Pages 自动部署
├─ archive/                   # 原始单文件、来源清单、字体清单
├─ docs/                      # 开发定位、验收记录、截图、本 Wiki
├─ licenses/                  # Three.js 与字体许可
├─ public/fonts/              # 本地字体文件
├─ scripts/                   # 源码图检查、归档校验、重构等价性校验
├─ src/                       # 66 个 ES 模块
├─ dist/                      # 构建输出（生成物）
└─ node_modules/              # 依赖（生成物）
```

### 2.2 `src/` 目录树

```text
src/
├─ game.js                       # 6 行启动入口
├─ ui.css                        # HUD、菜单、触屏布局与动效
├─ fonts.css                     # 本地字体 @font-face
├─ app/                          # 装配与运行框架（6）
│  ├─ runtime.js                 # startGame：context、初始化顺序、主循环
│  ├─ boot-screen.js             # 启动进度 DOM 与浏览器让步
│  ├─ diagnostics.js             # 全局错误捕获与致命错误展示
│  ├─ benchmark.js               # 巡游基准与帧时间面板
│  ├─ showcases.js               # 展示模块注册表
│  └─ showcase-stubs.js          # 展示模式用的 input/player 桩
├─ core/                         # 基础能力（9）
│  ├─ config.js                  # 世界/光照/玩家/画质常量
│  ├─ events.js                  # 事件总线
│  ├─ random.js                  # 可复现随机数
│  ├─ math.js                    # clamp/lerp/saturate/smoothstep/damp
│  ├─ quality.js                 # 画质选择
│  ├─ fallbacks.js               # 系统降级实现
│  ├─ geometry.js                # 共享几何、合批、网格创建
│  ├─ environment.js             # 环境状态中枢、能见度、perception
│  └─ environment-presets.js     # TIME_PRESETS / WEATHER_PRESETS / combine
├─ render/                       # 渲染管线（4）
│  ├─ renderer.js                # 场景、相机、光照、渲染通道、动态分辨率
│  ├─ sky.js                     # 程序化天空着色器与噪声纹理
│  ├─ shadows.js                 # 阴影视锥拟合与软阴影 shader 注入
│  ├─ postprocessing.js          # HDR、AO、Bloom、FXAA、色调映射等后处理
│  └─ materials/                 # 材质子系统（5）
│     ├─ materials.js            # 材质缓存、shader 补丁、纹理接入
│     ├─ catalog.js              # 材质定义与 GLSL 片段
│     ├─ surface-shaders.js      # 程序化表面生成器 GLSL 与默认表面
│     ├─ textures.js             # 法线/粗糙度烘焙、贴花、标签、编号纹理
│     └─ showcase.js             # 材质展示场景
├─ world/                        # 世界构建（23）
│  ├─ physics.js                 # AABB 碰撞、射线、导航网格、胶囊移动
│  ├─ helicopter.js              # 夜晴直升机光柱、音效、暴露扫描（M3）
│  ├─ level/                     # 关卡（3）
│  │  ├─ level.js                # 关卡装配、目标、出生点、撤离点
│  │  ├─ buildings.js            # 静态建筑与道具放置工具
│  │  └─ placement.js            # 摆件、线缆、楼梯、堆叠等放置辅助
│  ├─ backdrop/                  # 远景（5）
│  │  ├─ backdrop.js             # 远景装配与动画
│  │  ├─ geometry.js             # 远景共享几何与噪声/颜色工具
│  │  ├─ cranes.js               # 龙门吊与吊具
│  │  ├─ ships.js                # 货轮与救生艇
│  │  └─ sky.js                  # 天际线、海鸥
│  ├─ ground/                    # 地面（4）
│  │  ├─ ground.js               # 地面系统装配与积水查询
│  │  ├─ geometry.js             # 地面掩码/细节纹理生成
│  │  ├─ asphalt.js              # 沥青/混凝土路面
│  │  └─ water.js                # 海面、雨棚、反射
│  └─ props/                     # 道具（9）
│     ├─ props.js                # 道具工厂与展示
│     ├─ registry.js             # 道具尺寸表与 builder 注册表
│     ├─ register.js             # 按覆盖顺序安装 builder
│     ├─ geometry.js             # 道具共享几何与噪声
│     ├─ detail-geometry.js      # 高细节道具几何
│     ├─ basic-builders.js       # 基础道具
│     ├─ detailed-builders.js    # 精细道具
│     ├─ character-builders.js   # 角色/软体道具
│     └─ cargo-builders.js       # 车辆与货物道具
├─ input/                        # 输入（1）
│  └─ input.js                   # 键鼠、触屏、手柄
├─ player/                       # 玩家（1）
│  └─ player.js                  # 移动、相机、生命、后坐力、脚步
├─ combat/                       # 战斗判定（1）
│  └─ combat.js                  # 射线命中、伤害、爆炸
├─ weapons/                      # 武器（3）
│  ├─ weapon.js                  # 状态机、射击、换弹、动画集成
│  ├─ geometry.js                # PAC-9 程序化建模
│  └─ rig.js                     # 手套/袖口、视图模型材质与动画
├─ enemies/                      # 敌人（4）
│  ├─ enemies.js                 # 敌人池、生成、射线、协调
│  ├─ models.js                  # 四足 Gull 与 Hound 骨骼/网格
│  ├─ walker.js                  # Gull 行为
│  └─ drone.js                   # Hound 行为
├─ effects/                      # 特效（4）
│  ├─ effects.js                 # 特效系统与事件接线
│  ├─ lightning.js               # 雷暴闪电调度与触发（M4）
│  ├─ particles.js               # 粒子纹理、批次、材质
│  └─ pools.js                   # 弹壳/碎屑/贴花复用池
├─ audio/                        # 音频（4）
│  ├─ audio.js                   # 音频图、混音、调度、事件接线
│  ├─ synthesis.js               # DSP 与合成原语
│  ├─ library.js                 # 音色库注册表
│  └─ music.js                   # 程序化音乐
├─ ui/                           # 界面（2）
│  ├─ hud.js                     # HUD、目标标记、字幕、命中反馈
│  └─ menus.js                   # 标题/暂停/死亡/结算/设置/控制
├─ game/                         # 任务流程（1）
│  └─ flow.js                    # 三中继、波次、撤离、暂停、死亡、结算
└─ vendor/
   └─ three-r180.js              # 本地 Three.js r180（标准命名导出）
```

目录统计（均指 `.js` 模块）：

| 目录 | 模块数 | 职责 |
| --- | --- | --- |
| `src/` 根 | 1 | 启动入口 |
| `src/app/` | 6 | 装配、启动界面、诊断、基准、展示 |
| `src/core/` | 7 | 配置、事件、随机、数学、画质、降级、几何 |
| `src/render/` | 4 + 5 | 渲染管线与材质子系统 |
| `src/world/` | 1 + 3 + 5 + 4 + 9 | 物理、关卡、远景、地面、道具 |
| `src/input/` `src/player/` `src/combat/` | 1 + 1 + 1 | 输入、玩家、战斗判定 |
| `src/weapons/` `src/enemies/` | 3 + 4 | 武器与敌人 |
| `src/effects/` `src/audio/` | 3 + 4 | 特效与音频 |
| `src/ui/` `src/game/` | 2 + 1 | 界面与任务流程 |
| `src/vendor/` | 1 | Three.js r180 |
| **合计** | **66** | |

### 2.3 其他关键目录

| 路径 | 内容 | 是否参与运行时 |
| --- | --- | --- |
| `archive/original.html` | 与原站发布清单逐字节一致的原始单文件 | 否，仅校验 |
| `archive/manifest.json` | 来源、发布版本、大小、SHA-256 | 否 |
| `archive/font-manifest.json` | 字体下载来源与逐文件摘要 | 否 |
| `docs/DEVELOPMENT.md` | 代码定位与诊断入口 | 否 |
| `docs/VALIDATION.md` | 恢复验收结果 | 否 |
| `docs/REFACTOR_VALIDATION.md` | 模块拆分回归记录 | 否 |
| `docs/screenshots/` | 游戏截图 | 否 |
| `scripts/check-source.mjs` | 语法、命名导入、循环依赖检查 | 否，构建前检查 |
| `scripts/verify-archive.mjs` | 原始归档与字体摘要校验 | 否 |
| `scripts/verify-refactor.mjs` | 当前模块与原始归档的等价性审计 | 否，迁移审计 |
| `scripts/refactor-map.json` | 模块语句到原始归档的映射 | 仅审计使用 |
| `public/fonts/` | 本地字体文件 | 是，经 `fonts.css` 加载 |
| `licenses/` | 许可文本 | 否 |

---

## 3. 核心模块功能定义

### 3.1 分层与模块边界

| 层 | 模块 | 允许依赖 | 禁止依赖 | 边界说明 |
| --- | --- | --- | --- | --- |
| L0 引擎 | `vendor/three-r180.js` | 无 | 全部业务模块 | 唯一 Three.js 实例来源 |
| L1 基础设施 | `core/*` | L0 | L2 及以上 | 只提供纯函数、常量、事件、随机、几何工具 |
| L2 渲染与世界 | `render/*`、`world/*` | L0–L1 | `input/player/combat/weapons/enemies/ui/game` | 只负责构建场景与几何，不读取输入 |

> **L1.5 例外**：`core/environment.js` 可调用 L2 的 setter 接口（`render.setSun/setFog/setExposure/rebakeEnvironment`、`ground.setRain`、`mats.uniforms.wet`），但不读取玩法状态。
| L3 玩法 | `input`、`player`、`combat`、`weapons`、`enemies` | L0–L2 | `ui`、`game/flow` | 通过 `context` 读取世界，通过 `events` 派发结果 |
| L4 表现 | `effects`、`audio`、`ui` | L0–L3 | 不反向驱动玩法 | 订阅事件，不修改玩家/敌人核心状态 |
| L5 编排 | `app/*`、`game/flow.js` | 全部 | — | 负责装配、状态机、菜单与帧循环 |
| L6 入口 | `game.js` | `app`、`world/props/register` | — | 只做一次性副作用导入与启动 |

模块依赖无环，由 `npm run check` 的源码图校验保证。

### 3.2 各模块职责定义

#### 3.2.1 装配与运行框架（`app/`）

- **runtime.js**：创建 `context`，按固定顺序初始化系统，驱动主循环，处理 `?show` 展示模式与降级。
- **boot-screen.js**：缓存 `#boot`、`#boot-msg`、`#boot-fill`，提供异步启动进度；每次更新后 `setTimeout(0)` 让出主线程。
- **diagnostics.js**：在导入期初始化 `window.__frames/__ready/__fatal/__errors`，包装 `console.error`，提供 `showFatalError`。
- **benchmark.js**：生成 `#bench` 面板，沿 `level.cinematicPath` 或默认路径巡游相机，统计 avg/median/p99 帧时间。
- **showcases.js**：把 9 个展示模块聚合成 `SHOWCASE_MODULES`，键为 `mats/level/backdrop/ground/fx/weapon/enemies/props/render`。
- **showcase-stubs.js**：为展示模式提供零输入的 `input` 与静止的 `player`，避免展示场景依赖完整玩法。

#### 3.2.2 基础能力（`core/`）

- **config.js**：世界边界、太阳方向/颜色/强度、天空颜色、玩家尺寸、画质预设。
- **events.js**：同步事件总线；`on` 返回取消订阅函数；单个 handler 抛错不影响其他 handler。
- **random.js**：32 位 PRNG，支持 `range/int/pick/sign/fork`。
- **math.js**：`clamp/lerp/saturate/smoothstep/damp` 纯函数。
- **quality.js**：按显式参数 → 移动端 → GPU 字符串 → 默认 high 的顺序选择预设。
- **fallbacks.js**：为 `ground/backdrop/fx/audio/weapon/enemies/hud/mats` 提供最小可用替身。
- **geometry.js**：盒体/圆柱/倒角盒/管体/颜色几何、变换、合并、静态合批、`createMesh`。

#### 3.2.3 渲染（`render/`）

- **renderer.js**：创建 `WebGLRenderer`、`Scene`、主相机 `camera`、视图模型相机 `viewCamera`、太阳光、天空、点光池、环境贴图；管理尺寸、动态分辨率、阴影贴图、后处理与渲染通道。
- **sky.js**：生成 256×256 可平铺噪声纹理，创建天空盒 ShaderMaterial，烘焙 PMREM 环境贴图。
- **shadows.js**：按场景 AABB 拟合方向光阴影视锥；替换 `ShaderChunk.shadowmap_pars_fragment` 注入 blocker search + Vogel 采样软阴影。
- **postprocessing.js**：HDR 半浮点目标、深度复制、AO、Bloom、运动模糊、色调映射、FXAA、颗粒、调色、屏幕反馈（受伤/低血量/ADS/闪白/淡入淡出）。
- **materials/materials.js**：按材质名与选项缓存 `MeshStandardMaterial`，接入程序化纹理与 shader 补丁，提供 `get/emissive/decal/label/number/prewarm/stats/tileOf`。
- **materials/catalog.js**：定义材质数据表与注入 GLSL 片段（顶点/片元替换点）。
- **materials/surface-shaders.js**：程序化表面 DSL 与默认表面（沥青、混凝土、水面等）。
- **materials/textures.js**：从高度图烘焙法线/ORM，生成贴花、标签、编号纹理。
- **materials/showcase.js**：材质球/平面的展示场景。

#### 3.2.4 世界（`world/`）

- **physics.js**：AABB 列表、射线检测（含地面/海面）、视线检测、地面高度、胶囊移动、导航网格（A* + 视线拉直）。
- **level/level.js**：装配静态建筑、三个中继、掩体、敌人出生点、区域、室内包围盒、过场路径，输出 `LevelSystem`。
- **level/buildings.js**：静态建筑构建器与放置工具（`box/slab/cyl/rod/ibeam/col/place/stairs/catwalk/stack`）。
- **level/placement.js**：线缆、地面贴花、楼梯、堆叠等场景摆件辅助。
- **backdrop/backdrop.js**：装配吊机、货轮、救生艇、天际线与海鸥，并注册远景碰撞盒。
- **backdrop/geometry.js**：远景共享几何、噪声、颜色与材质辅助。
- **backdrop/cranes.js**：龙门吊、吊具与结构细节。
- **backdrop/ships.js**：货轮 `KITTIWAKE` 与救生艇。
- **backdrop/sky.js**：远景天际线与海鸥动画。
- **ground/ground.js**：生成地面掩码/细节/标线纹理，装配沥青、海面、雨棚与平面反射；提供积水与湿度查询。
- **ground/geometry.js**：地面掩码、细节法线、标线纹理的 Canvas 生成。
- **ground/asphalt.js**：沥青/混凝土路面网格与材质 uniform。
- **ground/water.js**：海面网格、波浪位移、雨滴涟漪、平面反射。
- **props/props.js**：道具工厂；未知道具回退为尺寸盒。
- **props/registry.js**：`PROP_SIZES` 尺寸表与 `PROP_BUILDERS` 注册表。
- **props/register.js**：按“基础 → 精细 → 角色 → 货物”的覆盖顺序安装 builder。
- **props/geometry.js** / **detail-geometry.js**：道具共享几何与高细节几何。
- **props/*-builders.js**：具体道具构建实现。

#### 3.2.5 玩法（`input/player/combat/weapons/enemies`）

- **input.js**：统一键鼠、指针锁定、拖拽视角、触屏摇杆/按钮、标准手柄；输出 `move/look/fire/ads/sprint/crouch` 与 `down/pressed`。
- **player.js**：水平加速度、跳跃缓冲/土狼时间、蹲下/站起检测、冲刺、ADS、FOV、脚步/摆动、后坐力、镜头震动、受伤/回血、落水救援。
- **combat.js**：玩家射击射线（敌人优先于场景）、弱点倍率、敌人射击命中玩家胶囊、爆炸范围伤害。
- **weapon.js**：30 发弹匣、150 发备弹、720 RPM、射速/热量/扩散、换弹与空仓换弹、视图模型弹簧动画、雨水量 uniform。
- **enemies.js**：Gull/Hound 对象池、生成令牌、听觉/视觉警报、统一射线检测、更新调度、残骸与弹丸管理。
- **walker.js**：Gull 四足敌人行为（巡逻、警觉、追击、齐射、死亡爆炸）。
- **drone.js**：Hound 无人机行为（巡逻、潜行、突进、齐射、残骸）。
- **models.js**：两类敌人的骨骼、网格、材质与辅助几何。

#### 3.2.6 表现（`effects/audio/ui`）

- **effects.js**：枪口焰、曳光、命中、火花、烟、尘、爆炸、弹壳、水花、碎屑、发射器；订阅 `impact/player:step/player:land`。
- **particles.js**：粒子图集/纹理、批次、材质、渲染顺序。
- **pools.js**：弹壳、碎屑、贴花等复用池，避免频繁分配。
- **audio.js**：AudioContext 图、声音池、3D 声像、混响、音乐、事件接线；提供 `play/loop/update/setIntensity/setInterior/setVolume/setPaused`。
- **synthesis.js**：DSP 原语（噪声、滤波、包络、混响、失真、重采样）。
- **library.js**：`Go` 音色注册表与逻辑名映射 `i_`。
- **music.js**：程序化音乐生成（BPM、段落、和弦）。
- **hud.js**：罗盘、目标、中继计数、警告、准星、命中标记、伤害方向、交互提示、击杀信息、血量、弹药、世界目标菱形、字幕。
- **menus.js**：标题/暂停/死亡/结算/设置/控制面板；设置持久化到 `localStorage`。

#### 3.2.7 编排（`game/flow.js`）

- 维护 `title → intro → playing → paused / dead → complete` 状态机。
- 负责三中继交互（按住 E、朝向、距离、进度）、波次生成、追击补员、撤离判定、暂停/恢复/重开/结算评级。
- 通过 `createMenus` 绑定 UI 回调，通过 `context.events` 驱动音频与 HUD。

### 3.3 调用关系

```text
                         ┌──────────────────────────────┐
                         │        app/runtime.js        │
                         │  context 装配 / 主循环驱动    │
                         └──────────────┬───────────────┘
                                        │ context
        ┌───────────────┬───────────────┼────────────────┬────────────────┐
        ▼               ▼               ▼                ▼                ▼
   render/*        world/*          input/player      combat/weapons     ui/game
   （场景与像素）  （几何与碰撞）    （意图与运动）    （命中与敌人）     （反馈与流程）
        │               │               │                │                │
        └───────────────┴───────┬───────┴────────────────┘                │
                                ▼                                         │
                        context.events（事件总线）                         │
                                │                                         │
              ┌─────────────────┼──────────────────┐                      │
              ▼                 ▼                  ▼                      ▼
          effects/*          audio/*            hud.js               menus.js / flow.js
```

关键调用链：

1. **启动**：`game.js → register.js`（安装 builder）→ `diagnostics.js`（安装错误捕获）→ `runtime.startGame()`。
2. **初始化**：`runtime → createRenderer → createMaterials → createPhysics/createProps/createInput → createLevel → createBackdrop → createGround → createEffects → createAudio → createPlayer/createCombat → createWeapon → createEnemies → createHUD → createGameFlow → createHelicopter → createLightning → createEnvironment`。
3. **射击**：`weapon.update → combat.playerShot → physics.raycast + enemies.raycast → enemy.damage → events("enemy:hit"/"enemy:killed"/"impact") → effects/audio/hud/combat.stats`。
4. **受击**：`enemy fire → combat.enemyShot → player.damage → events("player:hit"/"player:dead") → hud/audio/flow`。
5. **任务**：`flow.update → 中继交互/波次/撤离 → events("objective:progress"/"objective:done"/"objective:all"/"extraction:reached") → hud/audio/menus`。
6. **渲染**：`runtime 主循环 → render.frame → postprocessing.run → renderer.render(scene, camera)`。

### 3.4 数据流

#### 3.4.1 输入数据流

```text
DOM 事件 / Gamepad API
  → input 内部集合（key/mouse/touch/pad）
  → input.update(dt) 归一化
  → player.update / weapon.update / flow.update 读取
  → input.endFrame() 清空 pressed/look 增量
```

- `move.x`：右为正，范围约 [-1, 1]。
- `move.y`：前为正，范围约 [-1, 1]。
- `look.dx/dy`：本帧累计视角增量（已乘灵敏度与反转）。
- `pressed(action)`：仅本帧为真；`down(action)`：持续按住为真。
- 触屏模式由 `touchstart` 自动切换；指针锁定失败时降级为 `drag` 模式。

#### 3.4.2 世界数据流

```text
createLevel / createBackdrop / createGround
  → 生成 Three.js 网格
  → physics.addBox(...) 注册碰撞
  → player/enemies 通过 physics.moveCapsule / nav.findPath 使用
  → render.frame 绘制
```

- 关卡静态网格在 `createLevel` 末尾通过 `batchStaticMeshes` 合并。
- 远景碰撞盒标记 `tag: "backdrop"`，`noNav` 控制是否进入导航网格。
- 地面 `ground.groundSurfaceAt` 与 `level.groundSurfaceAt` 共同决定脚步/命中表面类型。

#### 3.4.3 战斗数据流

```text
weapon.fire
  → combat.playerShot(origin, dir, {damage, range})
      → physics.raycast(origin, dir, range)      // 场景命中
      → enemies.raycast(origin, dir, sceneDist)  // 敌人命中（优先）
      → enemy.damage(damage * partMultiplier, point, dir, part)
  → events("impact", hitInfo)
  → effects.impact / audio.play / hud.hitmarker
```

- 敌人弱点 `part === "weak"` 伤害倍率 `2.2`。
- 场景命中返回 `{point, normal, dist, surface, box}`；无命中返回 `null`。
- 敌人命中返回 `{dist, point, normal, enemy, part}`；无命中返回 `null`。

#### 3.4.4 音频数据流

```text
context.events（weapon:fire / impact / explosion / player:step ...）
  → audio.play(name, {pos, gain, pitch, delay, jitter})
  → 3D 声像（PannerNode）+ 混音总线（world/near/amb/dry/music）
  → 混响发送（yard/shed IR）
  → destination
```

- `audio.setIntensity(0..1)` 控制战斗强度层。
- `audio.setInterior(0..1)` 控制室内混响与滤波。
- `audio.setPaused(true)` 暂停调度但保留 AudioContext。

### 3.5 事件契约

事件由 `context.events` 同步派发。新增事件必须在本表登记。

| 事件 | 载荷 | 生产者 | 消费者 |
| --- | --- | --- | --- |
| `impact` | `{point, normal, dist, surface, enemy, dir, from, part?, killed?}` | `combat`、`enemies`、`effects` | `effects`、`audio` |
| `player:hit` | `{amount, fromPos}` | `player` | `hud`、`audio`、`flow` |
| `player:hitEnemy` | `{enemy, part, killed, weak}` | `combat` | `hud` |
| `player:dead` | `{}` | `player` | `flow` |
| `player:jump` | `{pos}` | `player` | `audio` |
| `player:land` | `{speed, surface, pos}` | `player` | `effects`、`audio` |
| `player:step` | `{surface, sprint, pos}` | `player` | `effects`、`audio` |
| `player:rescued` | `{}` | `player` | `flow` |
| `player:hitEnemy` | `{enemy, part, killed, weak}` | `combat` | `hud` |
| `enemy:hit` | `{enemy, point, part}` | `walker`、`drone` | `audio` |
| `enemy:killed` | `{enemy, pos, type}` | `walker`、`drone` | `combat`、`hud`、`audio` |
| `enemy:spawn` | `{enemy}` | `enemies` | 诊断/扩展 |
| `helicopter:spot` | `{targets: [{id}], playerExposed}` | `world/helicopter.js` | `hud`（M3 暴露标记） |
| `lightning:flash` | `{night, postFlash, intensity, pos}` | `effects/lightning.js` | `render`（post.flash）、`hud`（准星泛白） |
| `lightning:exposed` | `{targets: [{id}]}` | `core/environment.js` | `hud`（M4 暴露标记） |
| `enemy:alert` | `{enemy, noise?}` | `enemies` | `flow`、`audio` |
| `enemy:telegraph` | `{enemy, ...}` | `walker`、`drone` | `audio` |
| `enemy:fire` | `{enemy, ...}` | `walker`、`drone` | `audio` |
| `enemy:melee` | `{enemy, ...}` | `drone` | `audio` |
| `enemy:step` | `{enemy, ...}` | `drone` | `audio` |
| `weapon:fire` | `{origin, dir, muzzle, ads}` | `weapon` | `enemies`、`audio`、`effects` |
| `weapon:reload` | `{phase: "start"\|"magout"\|"magin"\|"bolt"\|"done", empty?}` | `weapon` | `audio`、`hud` |
| `weapon:dry` | `{}` | `weapon` | `audio` |
| `explosion` | `{pos, size}` | `effects` | `player`、`enemies`、`audio` |
| `environment:changed` | `{timeOfDay, weather}` | `core/environment.js` | HUD、音频（M5） |
| `objective:progress` | `{id, t}` | `flow` | `hud` |
| `objective:done` | `{id, index, total}` | `flow` | `hud`、`audio` |
| `objective:all` | `{}` | `flow` | `hud`、`audio` |
| `extraction:reached` | `{}` | `flow` | `hud`、`audio` |
| `game:state` | `{state, prev}` | `flow` | `enemies`、`audio`、`render` |
| `input:lock` | `{locked}` | `input` | `flow` |
| `ui:click` / `ui:hover` | `{}` | `menus` | `audio` |
| `radio:line` | `{text}` | `hud` | `audio`（如接线） |
| `shell:bounce` | `{pos, surface}` | `pools` | `audio` |
| `thunder` | `{intensity}` | `ground/water` | `render`、`audio` |
| `quality:auto` | `{name}` | `render/renderer` | 诊断/HUD |

### 3.6 状态机

#### 3.6.1 游戏流程状态

```text
title ──start()──▶ intro ──introlSeconds──▶ playing
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                       paused               dead                complete
                          │                    │
                     resume()              retry()/redeploy()
                          │                    │
                          └──────▶ playing ◀───┘
```

- `title`：标题菜单，玩家不更新。
- `intro`：过场镜头与任务简报，`introSeconds = 3.5`。
- `playing`：正常玩法。
- `paused`：Esc/P 或菜单暂停，世界与特效冻结。
- `dead`：玩家死亡，显示死亡卡片。
- `complete`：撤离成功，显示结算与评级。

#### 3.6.2 武器状态

`idle → firing → reloading → idle`；空仓换弹时长 `2.72s`，非空仓 `2.1s`；`weapon:reload` 的 `phase` 依次为 `start → magout → magin → bolt → done`。

#### 3.6.3 敌人行为

- Gull（`walker.js`）：`patrol → investigate → search → engage → dead`。
- Hound（`drone.js`）：`patrol → investigate → search → engage → dead`；突进（lunge）是 `engage` 内部的子状态。
- 统一字段：`alive/active/mode/health/pos/vel/yaw/hasToken/lastKnown`。

### 3.7 降级与容错

| 场景 | 行为 |
| --- | --- |
| 材质系统失败 | `FALLBACKS.mats` 返回灰色 `MeshStandardMaterial`，避免场景全黑 |
| 音频初始化失败或 `?noaudio=1` | `FALLBACKS.audio` 提供空操作 API，游戏静音运行 |
| 特效 WebGL 资源失败 | `FALLBACKS.fx` 提供空操作特效方法 |
| 地面/远景失败 | 使用纯色平面/空对象，保证可移动与可渲染 |
| 武器/敌人失败 | 使用桩对象，HUD 与流程仍可运行 |
| renderer 必需系统失败 | `showFatalError` 在 `#app` 内显示致命错误 |
| showcase 模块抛错 | `showFatalError` 显示栈信息，不中断主循环 |
| 单系统 update 抛错 | 每系统仅记录一次 `[loop] <name>.update threw` |

### 3.8 展示模式（Showcase）

`?show=<name>` 会跳过完整关卡初始化，使用：

- `createShowcaseInput()`：零输入。
- `createShowcasePlayer(context)`：静止玩家。
- 80×80 混凝土平面与空关卡桩。
- 初始化 `render/mats/physics/props`，并始终初始化特效（`fx` 展示时视为必需）；`backdrop/ground/audio/hud/weapon/enemies` 使用降级实现。
- 调用 `SHOWCASE_MODULES[name].showcase(context)`，返回 `{cam, target, update?}`。

展示模块键与文件：

| 键 | 文件 | 展示内容 |
| --- | --- | --- |
| `mats` | `render/materials/showcase.js` | 材质球/平面 |
| `level` | `world/level/level.js` | 完整关卡 |
| `backdrop` | `world/backdrop/backdrop.js` | 吊机/船/天际线 |
| `ground` | `world/ground/ground.js` | 地面/水面/雨 |
| `fx` | `effects/effects.js` | 粒子与爆炸 |
| `weapon` | `weapons/weapon.js` | 武器视图模型 |
| `enemies` | `enemies/enemies.js` | 敌人编队 |
| `props` | `world/props/props.js` | 道具陈列 |
| `render` | `render/renderer.js` | 渲染管线 |

---

## 4. 关键函数用法规范

约定：

- 类型标注使用 TypeScript 风格描述，项目本身是原生 JS，不做运行时类型检查。
- `Vector3`、`Color`、`Mesh` 等均指 [three-r180.js](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/vendor/three-r180.js) 的导出。
- 所有系统工厂的第一个参数统一为 `context`（`Showcase` 相关桩函数除外）。
- 向量参数若接受数组，均按 `[x, y, z]` 解释。

### 4.0 通用约定

本章所有工厂函数的第一个参数都是同一个运行时容器：

```ts
type Context = {
  THREE: typeof import("../vendor/three-r180.js");
  events: EventBus;
  rng: Random;
  time: { t: number; dt: number; frame: number; real: number };
  quality: QualityPreset;
  render: RendererSystem;
  mats: MaterialSystem;
  physics: PhysicsSystem;
  props: PropSystem;
  level: LevelSystem;
  backdrop: BackdropSystem;
  ground: GroundSystem;
  fx: EffectsSystem;
  audio: AudioSystem;
  input: InputState;
  player: PlayerState;
  combat: CombatSystem;
  weapon: WeaponSystem;
  enemies: EnemySystem;
  hud: HUDSystem;
  game: GameFlow;
};
```

| 约定 | 说明 |
| --- | --- |
| `context` | 必填，由 `runtime.startGame()` 创建；测试/展示模式可传入手工构造的最小上下文 |
| `Vector3` | Three.js 可变对象；除非注明“会被拷贝”，函数可能保留引用或直接修改 |
| `number[]` | 三维数组 `[x, y, z]`；颜色使用 `[r, g, b]` 或 `[r, g, b, a]` |
| `dt` | 秒；主循环已限制 `dt <= 0.05` |
| `options` | 普通对象；未传或字段缺省时使用函数内默认值 |
| 返回值 | 工厂返回“系统对象”，其余函数返回类型在各自条目说明 |
| 异常 | 工厂可能抛出初始化错误；调用方应使用 `try/catch` 或依赖 `runtime` 的降级机制 |

示例（手工构造最小上下文仅用于单元/展示场景）：

```js
const context = {
  THREE,
  events: createEventBus(),
  rng: createRandom(1),
  time: { t: 0, dt: 0, frame: 0, real: 0 },
  quality: chooseQuality("low"),
  // ...按被测系统补齐依赖
};
```

### 4.1 基础能力（`core/`）

#### 4.1.1 `createEventBus()`

```js
function createEventBus(): {
  on(type: string, handler: (payload?: any) => void): () => void;
  off(type: string, handler: (payload?: any) => void): void;
  emit(type: string, payload?: any): void;
};
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 事件名，建议使用 `域:动作` 格式 |
| `handler` | `(payload?: any) => void` | 同步回调 |
| `payload` | `any` | 事件载荷，建议使用普通对象 |

返回值：`on` 返回取消订阅函数；`off` 无返回；`emit` 无返回。

示例：

```js
const events = createEventBus();
const off = events.on("player:hit", ({ amount }) => {
  console.log("damage", amount);
});
events.emit("player:hit", { amount: 12 });
off();
```

注意事项：

- `emit` 是同步的，handler 内不要执行长任务。
- 单个 handler 抛错会被捕获并输出 `[events] handler for "<type>" threw`，不会中断其他 handler。
- 事件名没有命名空间校验，新增事件必须登记到第 3.5 节。

#### 4.1.2 `createRandom(seed = 1337)`

```js
function createRandom(seed?: number): Random;
interface Random {
  (): number;                               // [0, 1)
  range(min: number, max: number): number;  // [min, max)
  int(min: number, max: number): number;    // 闭区间整数
  pick<T>(items: T[]): T;
  sign(): 1 | -1;
  fork(): Random;
}
```

示例：

```js
const rng = createRandom(4207);
const angle = rng.range(0, Math.PI * 2);
const count = rng.int(2, 5);
const prop = rng.pick(["barrel", "pallet", "crate"]);
```

注意事项：

- 种子会 `>>> 0` 转为 32 位无符号整数。
- `pick([])` 会返回 `undefined`，调用方需保证数组非空。
- `fork()` 基于当前序列派生新随机源，适合按子系统隔离。

#### 4.1.3 数学函数

```js
function clamp(value: number, min: number, max: number): number;
function lerp(a: number, b: number, t: number): number;
function saturate(value: number): number;                 // clamp(value, 0, 1)
function smoothstep(edge0: number, edge1: number, x: number): number;
function damp(current: number, target: number, lambda: number, dt: number): number;
```

| 函数 | 公式/语义 | 边界 |
| --- | --- | --- |
| `clamp` | `min(max, max(min, value))` | `min > max` 时结果不可预期 |
| `lerp` | `a + (b - a) * t` | 不限制 `t`，可外插 |
| `saturate` | 限制到 `[0, 1]` | 非数值会得到 `NaN` |
| `smoothstep` | `t²(3-2t)`，`t = saturate((x-edge0)/(edge1-edge0))` | `edge0 === edge1` 会得到 `NaN` |
| `damp` | `target + (current-target) * exp(-lambda*dt)` | 帧率无关的指数趋近；`dt` 为秒 |

示例：

```js
const fov = lerp(74, 52, ads);
const eye = damp(currentEye, targetEye, 11, dt);
const fade = smoothstep(0, 0.85, elapsed);
```

#### 4.1.4 `chooseQuality(name)`

```js
function chooseQuality(name?: string): QualityPreset;
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string \| undefined` | `test/low/medium/high/ultra`；非法值忽略 |

返回：`QUALITY_PRESETS` 的浅拷贝，字段见 [config.js](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/core/config.js#L38-L104)。

选择顺序：

1. 显式合法预设。
2. 移动端 UA 或触屏且短边 < 900 → `low`。
3. GPU 为 SwiftShader/llvmpipe/Software/Mali/Adreno/PowerVR，或 Intel 非 Arc → `medium`。
4. 其余 → `high`。

注意事项：探测使用临时 canvas，并在读取后主动 `loseContext()` 释放。

示例：

```js
const preset = chooseQuality(new URLSearchParams(location.search).get("q"));
console.log(preset.name, preset.scale, preset.shadow);
```

#### 4.1.5 几何工具

```js
function boxGeometry(w: number, h: number, d: number, anchor?: "center" | "bottom"): BoxGeometry;
function beveledBoxGeometry(w: number, h: number, d: number, bevel?: number, anchor?: "center" | "bottom"): BufferGeometry;
function cylinderGeometry(radiusTop: number, radiusBottom: number, height: number, segments?: number, openEnded?: boolean, anchor?: "center" | "bottom"): CylinderGeometry;
function tubeGeometry(points: Array<Vector3 | number[]>, radius?: number, radialSegments?: number, closed?: boolean, tension?: number): TubeGeometry;
function transformGeometry(geometry: BufferGeometry, { p?: number[], r?: number[], s?: number | number[] } = {}): BufferGeometry;
function colorGeometry(geometry: BufferGeometry, color: number[] | ((x: number, y: number, z: number) => number[])): BufferGeometry;
function mergeGeometries(geometries: BufferGeometry[], useGroups?: boolean): BufferGeometry | null;
function mergeGeometryParts(geometries: BufferGeometry[]): BufferGeometry;
function createMesh(geometry: BufferGeometry, material: Material, { cast?: boolean, recv?: boolean } = {}): Mesh;
function batchStaticMeshes(root: Object3D, { castShadow?: boolean, receiveShadow?: boolean } = {}): Group;
```

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `w/h/d` | `number` | — | 盒体宽/高/深（米） |
| `bevel` | `number` | `0.02` | 倒角半径，内部会限制到最小边长的一半 |
| `anchor` | `"center" \| "bottom"` | `"center"` | 原点位置；`bottom` 使原点位于底面中心 |
| `radiusTop/radiusBottom` | `number` | — | 圆柱上下半径；相等为圆柱，否则为圆台 |
| `segments` | `number` | `16` | 圆周分段 |
| `openEnded` | `boolean` | `false` | 是否去掉上下端盖 |
| `points` | `Array<Vector3 \| number[]>` | — | 管体中心线控制点 |
| `radius` | `number` | `0.03` | 管体半径 |
| `radialSegments` | `number` | `8` | 管体截面分段 |
| `closed` | `boolean` | `false` | 是否闭合中心线 |
| `tension` | `number` | `0` | 曲线张力 |
| `geometry` | `BufferGeometry` | — | 待变换/着色/合并的几何 |
| `{p, r, s}` | `number[]` | — | 位置、欧拉旋转（弧度）、缩放；`s` 可为标量 |
| `color` | `number[] \| (x,y,z) => number[]` | — | 常量颜色或逐顶点函数 |
| `useGroups` | `boolean` | `false` | 合并时是否保留材质分组 |
| `root` | `Object3D` | — | 需要合批的静态根节点 |
| `{castShadow, receiveShadow}` | `boolean` | 均为 `true` | 合批后统一设置的阴影标志 |

返回：

| 函数 | 返回 |
| --- | --- |
| `boxGeometry` / `beveledBoxGeometry` / `cylinderGeometry` / `tubeGeometry` | 新建的 `BufferGeometry` |
| `transformGeometry` / `colorGeometry` | 原地修改并返回同一几何 |
| `mergeGeometries` | 合并结果；不兼容时 `null` |
| `mergeGeometryParts` | 清理后的合并几何 |
| `createMesh` | 设置阴影标志后的 `Mesh` |
| `batchStaticMeshes` | 包含合并批次的 `Group` |

示例：

```js
import { boxGeometry, beveledBoxGeometry, createMesh } from "../core/geometry.js";

const crate = createMesh(
  beveledBoxGeometry(1.2, 1, 0.9, 0.012, "bottom"),
  context.mats.get("wood_pallet"),
  { cast: true, recv: true },
);
```

注意事项：

- `anchor: "bottom"` 会把几何体沿 Y 平移，使原点位于底面中心。
- `mergeGeometries` 要求所有几何体索引状态一致、属性集合一致；失败返回 `null` 并 `console.error`。
- `mergeGeometryParts` 会补齐 `uv/normal/color`，并裁剪非标准属性，适合合批前的清理。
- `batchStaticMeshes` 会跳过 `userData.noMerge` 子树、`SkinnedMesh`、`InstancedMesh` 与多材质 Mesh；这些对象会保留世界变换后单独挂载。
- 合批按“材质 UUID + 投影/接收阴影 + layer”分组，改变这些属性会拆成不同批次。


#### 4.1.6 `createEnvironment(context)`

```js
function createEnvironment(context): EnvironmentSystem;
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `context` | `Context` | 运行时容器；需要 `render`、`ground`、`mats` 已可用 |

返回的系统对象：

```ts
interface EnvironmentSystem {
  timeOfDay: string;            // "dawn" | "morning" | "noon" | "dusk" | "night" | "midnight"
  weather: string;              // "clear" | "cloudy" | "overcast" | "lightRain" | "heavyRain" | "storm" | "fog"
  wetness: number;              // 0..1 全局湿润度
  perception: number;           // 0..1 玩家感知度（敌人警觉加成）
  visibility: number;           // 0..1 能见度（敌人视距倍率）
  fog: number;                  // 当前雾浓度（与 FOG_K 结合）
  sunIntensity: number;         // 当前太阳强度
  sunColor: Color;              // 当前太阳颜色
  ambientIntensity: number;     // 当前环境光强度
  envExposure: number;          // 当前曝光
  set(time?: string, weather?: string, options?: { force?: boolean; emit?: boolean }): void;
  randomize(options?: { timeOfDay?: string[]; weather?: string[] }): void;
  pushFrame(dt: number): void;  // 每帧更新与渐变写入
  apply(): void;                // 立即把当前状态写入 render/ground/mats
  onChange(cb: (env: EnvironmentSystem) => void): () => void;
}
```

| 成员 | 类型/签名 | 说明 |
| --- | --- | --- |
| `TIME_PRESETS` | `Record<string, TimePreset>` | 见 `environment-presets.js`；每个预设含 `sunColor/sunIntensity/ambient/skyColor/fogDensity/exposure/zenith` |
| `WEATHER_PRESETS` | `Record<string, WeatherPreset>` | 每个预设含 `wetness/perception/visibility/fogAdd/rain/ambientMul` |
| `FOG_K` | `number` | 雾浓度系数；默认约 `9.1e-5` |
| `set(time, weather, { force, emit })` | `void` | 切换预设；默认渐变，`force: true` 立即应用；`emit: false` 时不派发 `environment:changed` |
| `randomize(options)` | `void` | 从给定数组（或全部）随机选 time/weather |
| `pushFrame(dt)` | `void` | 每帧由 runtime 调用，做湿度/能见度渐变、雷雨计时、直升机调度 |
| `apply()` | `void` | 立即写入 `render.setSun/setFog/setExposure/rebakeEnvironment`、`ground.setRain`、`mats.uniforms.wet` |
| `onChange(cb)` | `() => void` | 订阅 `environment:changed`，返回取消函数 |

示例：

```js
const env = createEnvironment(context);
env.set("dawn", "lightRain");
env.set("midnight", "heavyRain", { force: true });
env.randomize({ weather: ["clear", "cloudy", "fog"] });
console.log("visibility", env.visibility, "wetness", env.wetness);
```

`context.params` 支持的 URL 参数：

| 参数 | 示例 | 作用 |
| --- | --- | --- |
| `time` | `?time=midnight` | 固定时间预设，启动时强制应用 |
| `weather` | `?weather=heavyRain` | 固定天气预设，启动时强制应用 |

注意事项：

- `createEnvironment` 是必需系统；失败会导致 runtime 致命错误。
- 初始化顺序位于 `helicopter → lightning → environment`，确保 `applyStatic` 能检测到两个子系统并启停。
- 调用方不读取玩法状态，保持 L1.5 边界。
- `apply()` 会调用 `render.rebakeEnvironment()`，在 `?q=low` 下 rebake 为空操作，`__G.render.env` 保持启动值。
- `combine(timePreset, weatherPreset)` 是纯函数，合并两个预设的覆盖项、乘算天气因子，不修改环境状态。
- `LIGHTNING_TIMING` 控制闪电高能窗口（`high = 0.8s`）与基础间隔；`HELICOPTER_TUNING` 控制光柱半径/高度/锥角/扫描频率。
- `lampOn` 是只读 getter（0..1），供 `lightning` 判定夜晚（`> 0.5`）。
- `_onLightningFlash()` 触发能见度脉冲（`lightningT = 0.8`，连续闪电取 max 不叠加）并执行 `scanLightningExpose`。
- 能见度回落用 `damp(..., 5, dt)`，约 0.8s 衰减到 1/e。

### 4.2 装配与渲染（`app/`、`render/`）

#### 4.2.1 `startGame()`

```js
async function startGame(): Promise<void>;
```

无参数。读取 `location.search` 与 `location.hash`，构建 `context`，完成所有系统初始化并启动 `setAnimationLoop`。

示例：仅由入口调用。

```js
startGame().catch((error) => showFatalError(error?.stack || error));
```

注意事项：

- 不返回 `context`；通过 `window.__G` 访问。
- `?bench=1` 或 `#bench` 会强制 `noaudio=1` 与 `autostart=1`。
- `?show=` 会走展示分支，此时 `level/backdrop/ground/audio/hud/weapon/enemies` 使用桩或降级实现。
- 初始化失败时，只有 `FALLBACKS` 覆盖的系统才会降级；`render` 与 `level` 标记为必需。

#### 4.2.2 `setBootProgress(message, progress)`

```js
function setBootProgress(message: string, progress: number): Promise<void>;
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `message` | `string` | 写入 `#boot-msg` 的文本 |
| `progress` | `number` | `0..1`，写入 `#boot-fill` 的宽度百分比 |

返回：在 `setTimeout(0)` 后完成的 Promise，用于让浏览器绘制启动进度。

示例：

```js
await setBootProgress("Stacking containers", 0.34);
```

注意事项：DOM 节点在模块加载时缓存；若页面缺少对应节点，函数静默跳过。

#### 4.2.3 `showFatalError(message)`

```js
function showFatalError(message: string): void;
```

写入 `window.__fatal`，向 `#app` 追加/复用 `#fatal` 节点并显示 `Saltline could not start: <message>`。

示例：

```js
showFatalError(error.stack || String(error));
```

注意事项：该函数不会停止已启动的动画循环；仅用于启动期不可恢复错误。

#### 4.2.4 `createRenderer(context)`

```js
async function createRenderer(context): Promise<RendererSystem>;
```

主要返回字段/方法：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `renderer` | `WebGLRenderer` | 画布渲染器 |
| `scene` | `Scene` | 主场景 |
| `camera` | `PerspectiveCamera` | 玩家/过场相机 |
| `viewCamera` | `PerspectiveCamera` | 视图模型相机 |
| `sun` | `DirectionalLight` | 主方向光 |
| `sky` | `Mesh` | 天空盒 |
| `sunDir` | `Vector3` | 太阳方向副本 |
| `lightPool` | `LightPool` | 瞬时点光池（枪口焰/爆炸） |
| `post` | `object` | 后处理输入（damage/lowHealth/ads/flash/fade/saturation/focusDist/shake/wet） |
| `exposure` | `number` | 曝光 |
| `env` / `interiorEnv` | `Texture \| null` | 室外/室内环境贴图 |
| `resolution` | `Vector2` | 当前渲染分辨率 |
| `advanced` | `boolean`（getter） | 是否启用高级后处理管线 |
| `autoExposure` | `boolean`（getter/setter） | 自动曝光开关 |
| `depthTexture` | `DepthTexture \| null`（getter） | 深度复制 |
| `addPrePass(fn)` | `(renderer, scene, camera) => void` | 注册渲染前回调 |
| `renderWorld(camera, target)` | `void` | 用指定相机渲染到目标 |
| `onLevelReady()` | `Promise<void>` | 阴影重建、环境探针、shader 预编译 |
| `setQuality(preset)` | `void` | 切换画质并重建尺寸/阴影/MSAA |
| `resize()` | `void` | 依据画布与 DPR 重算尺寸 |
| `frame(dt)` | `void` | 每帧渲染入口 |
| `stats()` | `object` | draw call、三角形、几何/纹理/程序数、分辨率、缩放、高级管线状态 |

示例：

```js
const render = await createRenderer(context);
render.setQuality(context.quality);
render.resize();
```

注意事项：

- 必须在 `createMaterials` 之前创建，因为材质需要 `context.renderer` 与 `quality`。
- `post` 是普通对象，玩家、武器、流程直接写入字段，不通过事件。
- 高级后处理初始化失败会自动回退到前向渲染，并输出一次错误。
- `onLevelReady` 必须在校验关卡与材质后调用，否则阴影/环境贴图可能为空。

#### 4.2.5 `createNoiseTexture()`

```js
function createNoiseTexture(): DataTexture;
```

参数：无。

返回：256×256 RGBA `DataTexture`，`wrapS/wrapT = RepeatWrapping`，`colorSpace = NoColorSpace`，供天空 fbm 与后处理颗粒使用。

示例：

```js
const noise = createNoiseTexture();
const sky = Hy(noise);
```

注意事项：纹理只创建一次并由调用方缓存；重复调用会增加显存占用。

#### 4.2.6 `Hy(noiseTexture)`

```js
function Hy(noiseTexture: DataTexture): {
  mesh: Mesh;
  material: ShaderMaterial;
  geometry: BoxGeometry;
};
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `noiseTexture` | `DataTexture` | 通常来自 `createNoiseTexture()` |

返回：天空盒 `mesh`、其 `ShaderMaterial` 与 `BoxGeometry`。材质启用 `BackSide`、`depthWrite: false`、`renderOrder: -1000`。

示例：

```js
const { mesh } = Hy(createNoiseTexture());
scene.add(mesh);
```

注意事项：天空盒不参与深度写入，必须最后渲染或依赖 `renderOrder`；修改 `uEnv` 会影响环境烘焙结果。

#### 4.2.7 `Vy(renderer, sky)`

```js
function Vy(
  renderer: WebGLRenderer,
  sky: { mesh: Mesh; material: ShaderMaterial; geometry: BoxGeometry },
): WebGLRenderTarget;
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `renderer` | `WebGLRenderer` | 用于 PMREM 烘焙 |
| `sky` | `object` | `Hy()` 的返回值 |

返回：已烘焙的 PMREM `WebGLRenderTarget`，可作为 `scene.environment`。

示例：

```js
const env = Vy(renderer, sky);
scene.environment = env.texture;
```

注意事项：烘焙会克隆天空材质并令 `uEnv = 1`；必须在渲染器尺寸确定后调用。

#### 4.2.8 `Gy(sun, boxMin, boxMax, focusMin, focusMax)`

```js
function Gy(
  sun: DirectionalLight,
  boxMin: Vector3,
  boxMax: Vector3,
  focusMin: Vector3,
  focusMax: Vector3,
): { width: number; height: number; depth: number };
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `sun` | `DirectionalLight` | 主方向光，使用其 `position/target` 方向 |
| `boxMin/boxMax` | `Vector3` | 需要覆盖阴影的场景包围盒 |
| `focusMin/focusMax` | `Vector3` | 高精度阴影聚焦区域 |

返回：拟合后的正交视锥尺寸 `{width, height, depth}`。

示例：

```js
const frustum = Gy(sun, sceneMin, sceneMax, playerMin, playerMax);
sun.shadow.camera.left = -frustum.width / 2;
sun.shadow.camera.right = frustum.width / 2;
```

注意事项：`boxMin/boxMax` 必须包含所有投影物体，否则阴影会被裁切；每帧移动玩家时不必重新拟合，除非跨区域。

#### 4.2.9 `installSoftShadows(frustum, options)`

```js
function installSoftShadows(
  frustum: { width: number; height: number; depth: number },
  options?: { taps?: number; searchTaps?: number },
): boolean;
```

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `frustum` | `object` | — | 来自 `Gy()` |
| `options.taps` | `number` | 内建 | Vogel 采样数 |
| `options.searchTaps` | `number` | 内建 | blocker search 采样数 |

返回：`true` 表示注入成功；`false` 表示 shader chunk 结构与预期不符，已保留原生 PCF。

示例：

```js
if (!installSoftShadows(frustum, { taps: 12 })) {
  console.warn("soft shadows unavailable");
}
```

注意事项：依赖 Three.js r180 的 `ShaderChunk.shadowmap_pars_fragment` 文本结构；升级引擎必须重新验证。重复调用不会叠加注入。

#### 4.2.10 `Xy()`

```js
function Xy(): void;
```

参数：无。返回：无。恢复原始 `ShaderChunk`，用于清理或热重载。

示例：

```js
Xy();
installSoftShadows(frustum);
```

注意事项：已有材质需要 `material.needsUpdate = true` 才会重新编译。

#### 4.2.11 `createPostprocessing(renderer, camera, { noiseTex })`

```js
function createPostprocessing(renderer: WebGLRenderer, camera: PerspectiveCamera, options: { noiseTex: Texture }): PostSystem;
```

主要返回字段：

| 成员 | 说明 |
| --- | --- |
| `run(dt)` | 执行完整后处理链 |
| `resize(width, height)` | 重设内部目标 |
| `applyQuality()` | 按 `context.quality` 调整采样/步数 |
| `copyDepth()` / `ensureDepthCopy()` | 深度复制 |
| `readAdapt()` | 读取自动曝光状态 |
| `autoExposure` | 自动曝光开关 |
| `materials` / `rt` / `size` / `TUNE` | 调试与调参入口 |

示例：

```js
const post = createPostprocessing(renderer, camera, { noiseTex });
post.resize(width, height);
post.run(dt);
```

注意事项：该对象由 `createRenderer` 内部创建，业务代码通常只读写 `context.render.post`。

#### 4.2.12 `createMaterials(context)`

```js
async function createMaterials(context): Promise<MaterialSystem>;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `get` | `(name: string, options?: object) => MeshStandardMaterial` | 按名称+选项缓存材质 |
| `emissive` | `(color?: number, intensity?: number) => MeshBasicMaterial` | 自发光材质，默认白色 ×4 |
| `decal` | `(name: string, options?: object) => { material, aspect }` | 贴花 |
| `label` | `(text: string, options?: object) => { material, aspect }` | 文字标签 |
| `number` | `(value: number \| string, options?: object) => { material, aspect }` | 编号纹理 |
| `names` | `string[]` | 已注册材质名 |
| `decalNames` | `string[]` | 已注册贴花名 |
| `uniforms` | `{ wet: { value: number } }` | 全局湿度 uniform |
| `update(dt)` | `void` | 延迟清理/统计 |
| `prewarm(names?)` | `void` | 预生成材质，避免首帧卡顿 |
| `stats()` | `{ sets, textureMB, genMs, decalMB }` | 缓存与内存统计 |
| `tileOf(name)` | `number` | 材质平铺尺寸 |

示例：

```js
const steel = context.mats.get("steel_galv", { triplanar: true, vertexColors: true });
const label = context.mats.label("SALTLINE 04", { color: "white", font: "stencil", distress: 0.35 });
```

注意事项：

- 未注册材质名会返回灰色默认标准材质，并输出警告。
- `vertexColors: true` 会参与缓存键与 program cache key。
- `patchMaterialShader(shader, uniforms)` 会替换标准材质多个 shader chunk；修改 chunk 注入顺序会影响所有材质。

### 4.3 世界（`world/`）

#### 4.3.1 `createPhysics(context)`

```js
function createPhysics(context): PhysicsSystem;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `boxes` | `PhysicsBox[]` | 所有 AABB |
| `bounds` | `{ min: Vector3, max: Vector3 }` | 世界边界副本 |
| `addBox` | `(min, max, options?) => PhysicsBox` | 注册 AABB；`min/max` 支持 `Vector3` 或数组 |
| `removeBox` | `(box) => void` | 移除并标记导航网格脏 |
| `build` | `() => void` | 重建导航网格 |
| `raycast` | `(origin, dir, maxDist?) => RayHit \| null` | 场景/地面/海面射线 |
| `lineOfSight` | `(from, to) => boolean` | 两点间无遮挡 |
| `groundHeight` | `(x, z, maxY?) => number` | 指定平面位置可站立高度 |
| `moveCapsule` | `(pos, vel, dt, radius?, height?, snap?) => MoveResult` | 胶囊移动并解算碰撞 |
| `nav` | `NavGrid` | 导航查询 |

`addBox` 选项：

| 选项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `surface` | `string` | `"concrete"` | 命中表面类型（脚步/音效/粒子） |
| `tag` | `string` | `""` | 逻辑标签，如 `"backdrop"` |
| `noNav` | `boolean` | `false` | 不写入导航网格 |
| `bulletOnly` | `boolean` | `false` | 仅阻挡子弹，不阻挡玩家/敌人 |
| `playerOnly` | `boolean` | `false` | 仅阻挡玩家，不阻挡子弹 |

`raycast` 返回：

```ts
interface RayHit {
  dist: number;
  point: Vector3;
  normal: Vector3;
  surface: string;
  box: PhysicsBox | null; // 地面/海面命中为 null
}
```

`moveCapsule` 返回：

```ts
interface MoveResult {
  onGround: boolean;
  hitWall: boolean;
  hitCeil: boolean;
  surface: string;
}
```

`nav` 成员：

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `isWalkable` | `(x, z) => boolean` | 网格内且未被阻挡 |
| `findPath` | `(from: Vector3, to: Vector3) => Vector3[] \| null` | A* + 视线拉直；失败返回 `null` |
| `randomPoint` | `(center: Vector3, radius: number) => Vector3` | 随机采样最多 24 次，失败时回退到 `center` |
| `clearLine` | `(a: Vector3, b: Vector3) => boolean` | 导航网格上的直线可达 |
| `_grid` | `() => { blocked, w, h, minX, minZ, cell }` | 调试用网格视图 |

示例：

```js
const box = context.physics.addBox(
  [-2, 0, -2],
  [2, 3, 2],
  { surface: "metal", tag: "container" },
);

const hit = context.physics.raycast(origin, dir, 300);
const canSee = context.physics.lineOfSight(eye, target);
const path = context.physics.nav.findPath(enemy.pos, player.pos);
```

注意事项：

- AABB 坐标必须是世界坐标；`addBox` 会自动对 `min/max` 排序。
- 修改 `boxes` 后必须调用 `build()` 或等待导航查询自动重建。
- `raycast` 的 `dir` 必须是单位向量；非单位向量会导致距离错误。
- 地面命中：当 `x <= WORLD_BOUNDS.quayX` 时使用 `groundY = 0`，否则使用 `seaY = -1.6`。
- `moveCapsule` 会做最多 3 次水平推出，避免角落抖动；`snap` 用于下台阶吸附。
- 导航网格单元 `0.5m`，覆盖 `x ∈ [-40, 31]`、`z ∈ [-32, 30]`。

#### 4.3.2 `createLevel(context)`

```js
async function createLevel(context): Promise<LevelSystem>;
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `root` | `Group` | 关卡根节点 |
| `playerStart` | `{ pos: Vector3, yaw: number }` | 玩家出生点 |
| `objectives` | `Objective[]` | 三个中继目标 |
| `extraction` | `{ pos: Vector3, radius: number }` | 撤离点，半径 `2.5` |
| `enemySpawns` | `SpawnPoint[]` | 地面/空中出生点 |
| `zones` | `Zone[]` | `gate/yard/shed/quay` 区域 |
| `interiorBoxes` | `{ min, max }[]` | 室内包围盒（用于武器湿度） |
| `cinematicPath` | `{ pos, look }[]` | 过场/基准相机路径 |
| `coverPoints` | `Vector3[]` | 掩体点 |
| `skylights` / `shedLights` | `object` | 灯光配置 |
| `vantage` | `{ stairsFoot, roof }` | 登高点 |
| `stats` | `{ labelsAtlased, containers, props, tris, meshes }` | 构建统计 |
| `placed` | `Array` | 已放置道具 |
| `groundSurfaceAt(x, z)` | `"metal" \| "concrete"` | 地面材质 |
| `update(dt)` | `void` | 驱动动态道具/标签/动画 |

`Objective` 结构：

```ts
interface Objective {
  id: "relay_a" | "relay_b" | "relay_c";
  label: string;
  zone: "yard" | "shed" | "quay";
  pos: Vector3;
  object: Group;
}
```

示例：

```js
const level = await createLevel(context);
context.player.reset(level.playerStart);
```

注意事项：

- 必须在 `physics`、`props`、`mats` 之后创建。
- 静态网格会被合批到 `level-merged`；`dynRoot` 保留动态对象。
- 目标对象在 `createLevel` 返回前会从静态根移除并挂到 `dynRoot`，避免被合批。
- 导航不可达的出生点/掩体会在返回前做最多 2 米环形搜索修正。

#### 4.3.3 `createBackdrop(context)`

```js
async function createBackdrop(context): Promise<BackdropSystem>;
```

| 字段 | 说明 |
| --- | --- |
| `root` | 远景根节点 |
| `boat` | 救生艇根节点 |
| `crane` / `ship` / `skyline` | 对应根节点或 `null` |
| `gulls` | 海鸥群 |
| `lamps` | 远景灯集合 |
| `colliders` | 已注册的碰撞盒 |
| `spreader` | 吊具（用于摆动动画） |
| `boatBase` | 救生艇基准位置 |
| `extractionPoint` | 撤离点 `(30, 0, 20)` |
| `shipName` / `craneId` | 船名/吊机编号 |
| `stats` | `{ tris, drawCalls }` |
| `update(dt)` | 驱动吊具摆动、雷达旋转、船体起伏、海鸥 |

示例：

```js
const backdrop = await createBackdrop(context);
backdrop.update(dt);
```

注意事项：远景默认注册 `tag: "backdrop"` 的碰撞盒；展示模式会缩小船体并跳过部分碰撞。

#### 4.3.4 `createGround(context)`

```js
async function createGround(context): Promise<GroundSystem>;
```

| 字段/方法 | 签名 | 说明 |
| --- | --- | --- |
| `root` | `Group` | 地面根节点 |
| `apron` | `Mesh` | 码头铺面 |
| `sea` | `Mesh` | 海面 |
| `rain` | `object` | 雨棚/雨幕 |
| `planar` | `object` | 平面反射 |
| `reflectionTarget` / `reflectionCamera` | WebGL 对象 | 反射目标/相机 |
| `maskTexture` | `Texture` | 积水掩码 |
| `uniforms` | `object` | 地面 uniform |
| `puddleDepth(x, z)` | `number` | 积水深度；`-0.2` 表示无水 |
| `isPuddle(x, z)` | `boolean` | 深度 > `0.015` |
| `wetnessAt(x, z)` | `number` | `0..1` 湿润度 |
| `seaHeight(x, z)` | `number` | 海面波高 |
| `setRain(level)` | `void` | 设置雨量 |
| `rainLevel` | `number`（getter） | 当前雨量 |
| `setReflections(enabled)` | `void` | 开关平面反射 |
| `update(dt)` | `void` | 推进时间、雨量与水面 |

示例：

```js
if (context.ground.isPuddle(player.pos.x, player.pos.z)) {
  context.ground.setRain(0.8);
}
```

注意事项：

- 地面纹理依赖 `document.fonts` 加载标线字体，最多等待 350 ms。
- 海面高度用于漂浮/水花判定；不要把它当作碰撞高度。
- `setReflections(false)` 可显著降低低端设备开销。

#### 4.3.5 `createProps(context)` 与 `registerProp`

```js
function createProps(context): PropSystem;
function registerProp(name: string, builder: (context, options?: object) => Group): void;
function build(name: string, options?: object): Group;
```

`PropSystem`：

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `names()` | `string[]` | 已登记尺寸的道具名 |
| `has(name)` | `boolean` | 是否存在尺寸定义 |
| `build(name, options?)` | `Group` | 调用 builder；失败/未注册时回退尺寸盒 |

Builder 返回值约定：

| `group.userData` 字段 | 类型 | 说明 |
| --- | --- | --- |
| `prop` | `string` | 道具名（由 `build` 补写） |
| `colliders` | `{ min: number[], max: number[], surface: string, bulletOnly?: boolean, noNav?: boolean }[]` | 局部碰撞盒 |
| `size` | `[w, h, d]` | 尺寸，用于布局与展示 |

示例：

```js
const barrel = context.props.build("barrel", { color: "paint_blue", seed: 3 });
scene.add(barrel);
for (const c of barrel.userData.colliders) {
  context.physics.addBox(c.min, c.max, c);
}
```

注意事项：

- `register.js` 的注册顺序决定覆盖关系：基础 → 精细 → 角色 → 货物。
- 新增道具必须同时更新 `PROP_SIZES` 与 `register.js` 的显式注册。
- 未知道具会输出 `[props] unknown prop "<name>"` 并生成占位盒。

#### 4.3.6 `createHelicopter(context)`（M3）

```js
function createHelicopter(context): HelicopterSystem;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `enabled` | `boolean` | 由 `environment._applyStatic` 按 `target.helicopterEnabled` 控制 |
| `active` | `boolean` | `enabled &&` 有光柱；`setEnabled(false)` 立即清除 |
| `pos` | `Vector3` | 盘旋位置（玩家为中心，半径 `HELICOPTER_TUNING.radius`） |
| `beam` | `{ origin, dir, halfAngle, range }` | 光柱几何（`dir` 单位向量，向下偏） |
| `setEnabled(on)` | `void` | 立即启停：停时清光柱/音效/暴露，不等 damp |
| `update(dt)` | `void` | 盘旋 + 光柱几何 + 音效跟踪 + 暴露扫描（0.25s，`low` 0.5s） |
| `isInBeam(targetPos)` | `boolean` | 锥体判定（距离粗筛 0.3m 容差）→ `physics.lineOfSight` |
| `getSpotTargets()` | `Array<{type, ref}>` | 当前帧光柱内敌人与玩家 |
| `setModel(mesh)` | `void` | M3 占位，不接模型 |
| `debug` | `object` | 内部状态与 `lastSpotTimes()` |

事件：

| 事件 | payload | 说明 |
| --- | --- | --- |
| `helicopter:spot` | `{ targets: [{id}], playerExposed }` | 每 0.25s 派发（含空 targets 清空信号），HUD 订阅 |

渲染分级：`ultra/high`（`envVolumetricBeam=true`）锥形网格加色叠加；`medium` 半透明锥体；`low/test` 仅 `SpotLight` + 地面光斑贴花。光束 `SpotLight` 不占 `lightPool`（池中无 `SpotLight`），`castShadow=false`。

注意事项：

- 冻结：`game.state` 非 `playing/showcase` 时 `update` 直接返回。
- 音效：`audio.loop("helicopter", {pos})` 每 100ms（`low` 200ms）`setPos`，音量乘 `1 - 0.3 × audioMask`（雨声掩蔽）。
- 装配顺序：`createHelicopter` 先于 `createEnvironment`（environment 的 `applyStatic` 需要它）。
- 失败降级：`FALLBACKS.helicopter` 提供全 noop 桩。

### 4.4 玩法（`input/player/combat/weapons/enemies`）

#### 4.4.1 `createInput(context)`

```js
function createInput(context): InputState;
```

| 字段/方法 | 类型/签名 | 说明 |
| --- | --- | --- |
| `move` | `{ x: number, y: number }` | 归一化移动输入 |
| `look` | `{ dx: number, dy: number }` | 本帧视角增量 |
| `fire/ads/sprint/crouch` | `boolean` | 动作状态 |
| `locked` | `boolean` | 指针是否锁定 |
| `touch` / `gamepad` | `boolean` | 输入设备状态 |
| `sensitivity` / `invertY` | `number` / `boolean` | 可在运行时修改 |
| `mode` | `"lock" \| "drag" \| "touch"` | 当前视角模式 |
| `down(action)` | `boolean` | 持续按住 |
| `pressed(action)` | `boolean` | 本帧按下 |
| `update(dt)` | `void` | 汇总手柄/转向键/拖拽 |
| `endFrame()` | `void` | 清空 pressed 与 look |
| `requestLock()` / `exitLock()` | `void` | 指针锁定控制 |
| `setGameplay(enabled)` | `void` | 启用/禁用玩法输入 |
| `setPrompt(visible)` | `void` | 触屏交互提示 |
| `onModeChange(fn)` | `void` | 注册模式变化回调 |
| `describeMode()` | `string` | 当前模式的可读描述 |

示例：

```js
if (context.input.pressed("jump")) playerJump();
const forward = context.input.move.y;
```

注意事项：

- 键位由 `KEY_BINDINGS` 映射；新增动作需同时更新映射与 `down/pressed` 消费方。
- `pressed` 的有效期只有当前帧，循环末尾必须调用 `endFrame()`。
- 输入框/下拉框/文本域获得焦点时不会触发游戏按键。
- 指针锁定失败会切换到 `drag` 模式，鼠标移到屏幕边缘持续转向。
- 触屏左半屏为移动摇杆，右半屏拖动视角；按钮通过 `data-a` 映射动作。

#### 4.4.2 `createPlayer(context)`

```js
function createPlayer(context): PlayerState;
```

| 字段/方法 | 类型/签名 | 说明 |
| --- | --- | --- |
| `pos/eye/vel/forward` | `Vector3` | 位置、眼位、速度、朝向 |
| `yaw/pitch` | `number` | 视角（弧度） |
| `health/maxHealth` | `number` | 生命值 |
| `alive/onGround/sprinting/crouching` | `boolean` | 状态 |
| `ads` | `number` | `0..1` 瞄准进度 |
| `speed` | `number` | 水平速度 |
| `enabled` | `boolean` | 是否响应输入 |
| `invulnerable` | `boolean` | 无敌 |
| `baseFov` | `number` | 基础 FOV |
| `hurtPulse` | `number` | 受伤反馈强度 |
| `lastSafe` | `Vector3` | 最近安全点 |
| `tuning` | `PLAYER_MOVEMENT` | 可运行时调参 |
| `reset(spawn?)` | `void` | 重置到指定/关卡出生点 |
| `damage(amount, fromPos)` | `void` | 扣血、震动、事件 |
| `heal(amount)` | `void` | 回血 |
| `addRecoil(pitch, yaw)` | `void` | 后坐力 |
| `addShake(amount)` | `void` | 镜头震动 |
| `setFov(fov)` | `void` | 设置基础 FOV（55–100） |
| `update(dt)` | `void` | 移动、碰撞、相机、回血 |

示例：

```js
context.player.damage(12, enemy.pos);
context.player.addRecoil(0.0068, 0.002);
context.player.reset(context.level.playerStart);
```

注意事项：

- `pos.y` 表示脚底高度；`eye` 已包含蹲伏、摆动、落地下沉与后坐力。
- 玩家被相机驱动：`update` 会直接写 `context.camera.position/rotation/fov`。
- 落水低于 `seaY - 2.2` 会传送到 `lastSafe`、扣 12 点血并派发 `player:rescued`。
- 站立空间检测使用 `PLAYER_DIMENSIONS.radius * 0.9` 与站/蹲高度。
- 受击后 `regenDelay = 4s` 才开始回血，速率 `25/s`。

#### 4.4.3 `createCombat(context)`

```js
function createCombat(context): CombatSystem;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `stats` | `{ shots, hits, kills }` | 本局统计 |
| `reset()` | `void` | 清零统计 |
| `playerShot(origin, dir, options?)` | `Impact \| null` | 玩家射线 |
| `enemyShot(origin, dir, options?)` | `boolean` | 敌人射线是否命中玩家 |
| `explode(pos, radius?, damage?, from?)` | `void` | 范围伤害 |

`playerShot` 选项：

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `damage` | `28` | 基础伤害 |
| `range` | `300` | 最大射程 |
| `impulse` | `1` | 预留冲量参数 |

`enemyShot` 选项：`damage = 6`、`range = 200`。

示例：

```js
const hit = context.combat.playerShot(origin, dir, { damage: 26, range: 300 });
if (hit?.enemy) hud.hitmarker(hit.killed ? "kill" : "hit");
```

注意事项：

- 玩家射线先查敌人，再查场景；敌人命中优先。
- 弱点 `part === "weak"` 伤害 ×2.2。
- `enemyShot` 使用射线到玩家胶囊的最近距离近似判定（水平 0.38、垂直 0.95）。
- `explode` 对敌人按距离线性衰减，对玩家按 50% 伤害衰减，并要求视线可达。

#### 4.4.4 `createWeapon(context)`

```js
async function createWeapon(context): Promise<WeaponSystem>;
```

| 字段/方法 | 类型/签名 | 说明 |
| --- | --- | --- |
| `name` | `string` | `"PAC-9 Longshore"` |
| `ammo/magSize/reserve` | `number` | 当前弹药/弹匣/备弹（30/30/150） |
| `state` | `"idle" \| "firing" \| "reloading"` | 武器状态 |
| `ads` | `number` | `0..1` |
| `spread` | `number` | 当前扩散（弧度） |
| `damage/rpm` | `number` | 26 / 720 |
| `root` | `Group` | 视图模型根节点 |
| `debug` / `info` | `object` | 调试与三角形/网格统计 |
| `update(dt)` | `void` | 输入、射击、换弹、动画 |
| `reset()` | `void` | 重置弹药与动画 |
| `setVisible(visible)` | `void` | 显示/隐藏视图模型 |
| `muzzleWorld(target?)` | `Vector3` | 枪口世界坐标 |
| `reloadNow()` | `boolean` | 主动换弹，条件不满足返回 `false` |
| `addAmmo(amount)` | `void` | 增加备弹 |
| `setWetness(0..1)` | `void` | 视图模型雨水表现 |
| `snap()` | `void` | 立即对齐 ADS/弹簧状态 |

示例：

```js
context.weapon.addAmmo(30);
if (!context.weapon.reloadNow()) {
  // 弹匣已满、备弹为 0 或正在换弹
}
```

注意事项：

- `createWeapon` 是异步的，内部会构建大量几何与材质。
- 射击通过 `context.combat.playerShot` 结算，并派发 `weapon:fire`。
- 空仓换弹 `2.72s`，非空仓 `2.1s`；换弹期间不能开火；`weapon:reload` 的 `phase` 依次为 `start/magout/magin/bolt/done`。
- 视图模型使用独立相机 `viewCamera`，因此不会被场景遮挡。
- `muzzleWorld` 会把枪口从视图模型空间转换到主相机空间，用于曳光与枪口光。

#### 4.4.5 `createEnemies(context)` 与敌人行为

```js
async function createEnemies(context): Promise<EnemySystem>;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `list` | `Enemy[]` | 当前活跃敌人 |
| `TUNE` | `ENEMY_TUNING` | 全局参数 |
| `spawn(type, pos, options?)` | `Enemy \| null` | `type: "gull" \| "hound"` |
| `raycast(origin, dir, maxDist?)` | `EnemyHit \| null` | 命中最近敌人 |
| `aliveCount()` | `number` | 存活数量 |
| `clear()` | `void` | 回收全部敌人 |
| `alert(pos, radius?)` | `void` | 以噪声位置惊醒敌人（M2 起乘听觉遮蔽） |
| `forceExpose(pos, mode, targetEnemy?)` | `void` | 信息层暴露：写 `lastKnown` + 触发 `investigate`（最短 2s），1.5s 冷却；`engage` 不降级（M3） |
| `update(dt)` | `void` | 更新所有敌人、弹丸、残骸 |
| `debug` | `object` | 池、网格、材质、三角形统计 |

`Enemy` 公共字段：

```ts
interface Enemy {
  id: number;
  type: "gull" | "hound";
  pos: Vector3;
  alive: boolean;
  active: boolean;
  hp: number;
  passive: boolean;
  mode: "patrol" | "investigate" | "search" | "engage" | "dead";
  lastKnown: Vector3;
  hasToken: boolean;
  damage(amount: number, point: Vector3, dir: Vector3, part: string): boolean;
  _activate(pos: Vector3, options?: object): void;
  _update(dt: number): void;
  _raycast(origin: Vector3, dir: Vector3, maxDist: number, hit: object): void;
}
```

示例：

```js
const enemy = context.enemies.spawn("gull", spawnPoint.pos, { zone: "yard" });
context.enemies.alert(player.pos, 45);
```

注意事项：

- `spawn` 从对象池取未激活实例；池耗尽且为 `hound` 时会回收最旧残骸。
- `spawn` 成功会派发 `enemy:spawn`。
- 敌人攻击 token 限制同时交战数量：默认 2，存活 > 5 时为 3，间隔 1.25s。
- `weapon:fire` 会以 0.3s 节流触发 45m 听觉警报。
- `game:state` 变化会暂停/恢复敌人 AI。
- 模型命名注意：`createWalker`（Gull，飞行）使用 `createDroneModel`；`createDrone`（Hound，地面）使用 `createWalkerModel`。这是历史命名，修改时不要按函数名想当然。

### 4.5 表现（`effects/audio/ui/game`）

#### 4.5.1 `createEffects(context)`

```js
async function createEffects(context): Promise<EffectsSystem>;
```

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `update(dt)` | `void` | 推进所有粒子/发射器 |
| `clear()` | `void` | 清空 |
| `muzzleFlash(pos, dir)` | `void` | 枪口焰 |
| `tracer(from, to)` | `void` | 曳光 |
| `impact(hit)` | `void` | 通用命中 |
| `sparks(pos, normal, count?)` | `void` | 火花 |
| `smoke(pos, options?)` | `void` | 烟 |
| `dust(pos, options?)` | `void` | 尘 |
| `explosion(pos, size?)` | `void` | 爆炸（派发 `explosion`） |
| `shell(pos, vel)` | `void` | 弹壳 |
| `splash(pos, size?)` | `void` | 水花 |
| `addEmitter(options)` | `{ stop(), setPos() }` | 持续发射器 |
| `debris(pos, options?)` | `void` | 碎屑 |
| `decal(pos, normal, kind?, scale?)` | `void` | 贴花，默认 `bullet_concrete` |
| `wind` / `root` | `object` | 风场与特效根节点 |

示例：

```js
context.fx.impact(hit);
context.fx.explosion(pos, 1.2);
const steam = context.fx.addEmitter({ kind: "steam", pos });
steam.stop();
```

注意事项：

- 大部分方法内部使用对象池；调用方不需要手动回收。
- `explosion` 会派发 `explosion` 事件，玩家与敌人都会响应。
- `explosion` 的事件对象是复用的，订阅方必须立即拷贝 `pos/size`，不要长期持有引用。
- `?show=fx` 展示模式会单独初始化特效系统。

#### `createLightning(context)`（M4）

```js
function createLightning(context): LightningSystem;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `enabled` | `boolean` | 由 `environment._applyStatic` 按 `target.lightningEnabled` 控制 |
| `nextT` | `number` | 距下次闪电的秒数（诊断用） |
| `flashes` | `number` | 累计触发次数 |
| `setEnabled(on)` | `void` | 启用时立即排一次调度（不立刻劈）；停用清 `nextT` |
| `update(dt)` | `void` | 倒计时 → 触发 → 重排；`game.state` 非 `playing/showcase` 时冻结 |
| `trigger()` | `void` | 立即触发一次（调试/展示，不受 `enabled` 限制） |
| `debug` | `object` | 内部状态、当前天气与调度区间 |

调度区间按天气覆盖：`lightRain` 16–20s、`heavyRain` 8–12s；`clear`/`overcast` 不启用（`lightningEnabled=false`）。随机源为 `context.rng.fork()`，固定 `?seed` 下可复现。

一次闪电同时做三件事：

1. 派发 `thunder`（`renderer` 驱动天空 `uFlash`，`audio` 播雷声）
2. 派发 `lightning:flash`（`renderer` 写 `post.flash` 全屏闪白，`hud` 准星泛白）
3. 调 `environment._onLightningFlash()`（能见度脉冲 + 全场暴露扫描）

注意事项：

- 夜晚判定用 `environment.lampOn > 0.5`：`midnight = 1.0`、`dusk = 0.7` 判为夜晚，`dawn = 0.4`、`noon = 0.0` 判为白天。白天只闪天空，不 `post.flash`。
- `QUALITY_PRESETS.envFlash === false`（`low`）时不 `post.flash`。
- `post.flash` 的衰减在 `renderer.frame()` 内做（`exp(-3.2*dt)`），否则写入后会永久泛白。
- 不适配敌人侧订阅：暴露扫描统一由 `environment.scanLightningExpose` 完成，避免同一闪电重复 `forceExpose`。
- 失败降级：`FALLBACKS.lightning`。

#### 4.5.2 `createAudio(context)`

```js
async function createAudio(context): Promise<AudioSystem>;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `ctx` | `AudioContext` | 音频上下文 |
| `ready` | `Promise<void>` | 资源准备完成 |
| `resume()` | `Promise<void> \| void` | 用户手势后恢复 |
| `play(name, options?)` | `void` | 播放一次性音效 |
| `loop(name, options?)` | `LoopHandle` | 循环音效 |
| `update(dt)` | `void` | 环境声/音乐调度 |
| `setIntensity(0..1)` | `void` | 战斗强度 |
| `setInterior(0..1)` | `void` | 室内程度 |
| `setVolume(0..1)` | `void` | 主音量 |
| `setPaused(bool)` | `void` | 暂停调度 |
| `selfTest()` | `object` | 离线渲染自检 |
| `debug()` | `object` | 队列、voice、混响、音乐状态 |
| `names` | `string[]` | 可用非 IR 音色 |

`play` 选项：

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `pos` | `Vector3` | 3D 位置；省略为 2D |
| `gain` | `number` | 线性增益 |
| `pitch` | `number` | 播放速率 |
| `delay` | `number` | 延迟秒数 |
| `jitter` | `number` | 随机音高/时间抖动 |

`loop` 返回：`{ setPos, setGain, setPitch, stop }`。

示例：

```js
context.audio.play("rifle_shot", { pos: player.pos, gain: 0.9, jitter: 0.03 });
const rain = context.audio.loop("rain", { gain: 0.4 });
rain.stop();
```

注意事项：

- 浏览器要求用户手势后才能启动 AudioContext；`DEPLOY` 按钮回调中调用 `audio.resume()`。
- 音效名来自 `library.js#Go`；未知名会被忽略。
- 混响 IR 分为室外/仓库两套；`setInterior` 控制混合。
- `?noaudio=1` 使用 `FALLBACKS.audio`，所有方法为空操作。

#### 4.5.3 `createHUD(context)`

```js
function createHUD(context): HUDSystem;
```

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `root` | `HTMLElement` | HUD 根节点 |
| `show(visible)` | `void` | 显示/隐藏 |
| `setObjective(text)` | `void` | 目标文本 |
| `setRelays(done, total)` | `void` | 中继计数 |
| `setMarkers(markers)` | `void` | 世界/罗盘目标标记 |
| `setPrompt(label, progress?)` | `void` | 交互提示与圆环进度 |
| `radio(text, secs?)` | `void` | 队列字幕 |
| `clearRadio()` | `void` | 清空字幕 |
| `warn(text, secs?)` | `void` | 警告 |
| `message(text, secs?)` | `void` | 瞬时消息 |
| `feed(html)` | `object` | 添加击杀信息，最多 4 条 |
| `hitmarker(kind?)` | `void` | `hit/weak/kill` |
| `reset()` | `void` | 清空动态状态 |
| `update(dt)` | `void` | 罗盘、距离、血量、弹药、反馈 |

`markers` 项：

```ts
interface Marker {
  pos: Vector3;
  kind?: "relay" | "extract" | string;
  short?: string;
  label?: string;
}
```

示例：

```js
context.hud.setObjective("Cut Relay B");
context.hud.setRelays(1, 3);
context.hud.hitmarker("weak");
```

注意事项：

- HUD 是纯 DOM，不参与 WebGL；样式位于 [ui.css](file:///d:/ZZH/aska/github/Saltline_en/Saltline/src/ui.css)。
- `setPrompt` 会同步调用 `input.setPrompt`，用于触屏按钮状态。
- `feed` 返回对象包含 `el/life/weak`，调用方可继续修改。
- `update` 在 HUD 隐藏时只处理衰减，不更新视觉。

#### 4.5.4 `createMenus(context, handlers)`

```js
function createMenus(context, handlers: MenuHandlers): MenuSystem;
```

`handlers` 回调：`deploy()`、`resume()`、`restart()`、`retry()`、`redeploy()`。

| 成员 | 说明 |
| --- | --- |
| `root` | 菜单根节点 |
| `settings` | 当前设置对象 |
| `fmtTime(seconds)` | `MM:SS` |
| `screen` | 当前屏幕名（getter） |
| `panelOpen` | 设置面板是否打开（getter） |
| `closePanel()` | 关闭设置面板 |
| `show(name)` | 切换屏幕：`none/title/paused/dead/complete`；设置/控制为覆盖面板 |
| `locationCard(visible)` | 过场地点卡片 |
| `setLookMode(text)` | 标题页视角提示 |
| `setDead({time, relays, total})` | 死亡卡片数据 |
| `setDebrief({time, accuracy, kills, retries, rating})` | 结算数据 |
| `applySettings()` | 应用设置到输入/画质/FOV/音量 |

设置持久化：

```js
loadSettings(): Settings;
saveSettings(settings: Settings): void;
// localStorage key: "saltline.settings.v1"
```

示例：

```js
const menus = createMenus(context, {
  deploy() { /* start game */ },
  resume() { /* resume */ },
  restart() { /* restart */ },
  retry() { /* retry */ },
  redeploy() { /* redeploy */ },
});
menus.show("title");
```

注意事项：

- `loadSettings` 对每个字段做范围校验；损坏的 JSON 会回退默认值。
- 设置项：`quality/sens/invertY/volume/fov`。
- 菜单使用 `data-s`/`data-screen` 控制显示；新增屏幕需同步 HTML 模板与 `show` 调用。
- 面板打开时 Tab 焦点被限制在面板内，Escape 关闭。

#### 4.5.5 `createGameFlow(context)`

```js
function createGameFlow(context): GameFlow;
```

| 成员 | 说明 |
| --- | --- |
| `state` | 当前状态：`title/intro/playing/paused/dead/complete` |
| `flow` | `GAME_FLOW` 参数副本 |
| `run` | 本局运行时数据（时间、中继、波次、统计） |
| `menus` | 菜单系统 |
| `start({ skipIntro?, quick? })` | 开始/重开 |
| `pause()` / `resume()` | 暂停/恢复 |
| `update(dt)` | 状态机、交互、波次、撤离 |
| `debugCut()` | 立即切断一个未完成中继（调试） |

`GAME_FLOW` 关键参数：

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `introSeconds` | `3.5` | 首次过场 |
| `retryIntroSeconds` | `1.3` | 重试过场 |
| `interactRange` | `2.2` | 中继交互距离 |
| `interactFacing` | `0.45` | 朝向点积阈值 |
| `cutSeconds` | `2.4` | 按住 E 切断耗时 |
| `patrol` | `{ gull: 2, hound: 1 }` | 初始巡逻编队 |
| `waves` | 3 组 | 每次切断后的波次 |
| `maxAlive` | `9` | 同时存活上限 |
| `spawnStagger` | `0.85` | 出生间隔 |
| `spawnFar` | `18` | 最小出生距离 |
| `pursuitEvery` | `7` | 追击补员间隔 |
| `pursuitMinAlive` | `4` | 低于该数量触发补员 |
| `pursuitExtra` | `5` | 补员额外数量 |
| `titleSpeed` / `titleFov` | `1.15` / `50` | 标题相机 |

示例：

```js
context.game.start({ skipIntro: true });
context.game.pause();
context.game.resume();
```

注意事项：

- `start` 会重置玩家、武器、敌人、特效与统计，再进入 `intro` 或 `playing`。
- 中继交互需要玩家在范围内、朝向正确，并持续按住 `interact`。
- 三次切断后进入撤离阶段；进入 `extraction.radius` 触发 `extraction:reached`。
- 玩家死亡进入 `dead`；撤离成功进入 `complete` 并计算评级。
- 暂停时 `runtime` 跳过世界更新，但菜单与音频仍可用。

---

## 5. 各组件/文件的作用与设计意图

本章逐文件说明。表头含义：

- **路径**：相对仓库根目录。
- **核心职责**：该文件解决的问题。
- **依赖**：直接导入的本地模块。
- **主要对外接口**：其他模块可使用的导出。
- **设计意图**：为什么这样拆分。

### 5.1 入口与工程配置

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `index.html` | 页面骨架、画布 `#view`、HUD 容器 `#ui`、启动层 `#boot` | `src/fonts.css`、`src/ui.css`、`src/game.js` | DOM 契约 | 让 HTML 只承载稳定挂载点，所有界面由 JS 创建 |
| `package.json` | 脚本、依赖、Node 版本约束 | — | `dev/start/build/preview/check/format/verify:*` | 用标准 npm 脚本封装开发、校验与构建 |
| `vite.config.js` | 开发服务器 `127.0.0.1:5173`、预览 `4173`、相对基路径、sourcemap、单文件插件 | `vite`、`vite-plugin-singlefile` | Vite 配置 | 保留原版“单文件可分发”的产物形态 |
| `.github/workflows/pages.yml` | main 分支推送自动校验、构建并发布 `dist/` 到 GitHub Pages | `npm ci`、`npm run check`、`npm run build` | CI 工作流 | 把校验前置到部署前，避免坏产物上线 |
| `src/game.js` | 一次性副作用导入与启动 | `app/runtime.js`、`app/diagnostics.js`、`world/props/register.js` | 无导出 | 保持入口极小，启动顺序显式可见 |
| `src/ui.css` | HUD、菜单、触屏、启动层、响应式与动效 | 无 | 全局 class/变量 | 把表现与结构分离，便于单独调整视觉 |
| `src/fonts.css` | 三组本地字体的 `@font-face` | `public/fonts/*` | 字体族名 | 移除 Google Fonts 运行时依赖 |

### 5.2 装配与运行框架（`src/app/`）

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `app/runtime.js` | 创建 context、按原版顺序初始化、主循环、展示模式、降级 | vendor、`core/{quality,events,random,fallbacks,geometry}`、全部系统工厂、`showcases.js`、`diagnostics.js`、`boot-screen.js`、`benchmark.js`、`showcase-stubs.js` | `startGame()` | 唯一装配点，避免模块导入期副作用 |
| `app/boot-screen.js` | 启动进度文本/进度条、浏览器让步 | 无 | `bootElement`、`setBootProgress`、`bootMessage`、`bootProgress`、`yieldToBrowser` | 长初始化期间给出可见反馈 |
| `app/diagnostics.js` | 全局错误捕获、致命错误展示、控制台包装 | 无 | `showFatalError` | 让启动失败可见且可诊断 |
| `app/benchmark.js` | 巡游基准、帧时间统计面板 | vendor | `enableBenchmark(context)` | 性能回归与 GPU 信息采集 |
| `app/showcases.js` | 聚合 9 个展示模块 | `render/*`、`world/*`、`effects/effects`、`weapons/weapon`、`enemies/enemies` | `SHOWCASE_MODULES` | 用 URL 参数快速检视单个子系统 |
| `app/showcase-stubs.js` | 展示模式的输入/玩家桩 | vendor、`core/config` | `createShowcaseInput`、`createShowcasePlayer` | 展示场景不需要完整玩法依赖 |

### 5.3 基础能力（`src/core/`）

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `core/config.js` | 世界边界、太阳、天空、玩家尺寸、画质预设 | vendor | `WORLD_BOUNDS`、`SUN_LIGHT`、`SKY_COLORS`、`PLAYER_DIMENSIONS`、`QUALITY_PRESETS`、`vf`、`zc` | 把可调常量集中，避免散落魔法数 |
| `core/events.js` | 同步事件总线 | 无 | `createEventBus()` | 用事件解除玩法与表现的直接依赖 |
| `core/random.js` | 可复现 PRNG | 无 | `createRandom(seed)` | 世界生成可复现，便于截图回归 |
| `core/math.js` | 标量数学工具 | 无 | `clamp`、`lerp`、`saturate`、`smoothstep`、`damp` | 统一缓动/插值语义 |
| `core/quality.js` | 画质预设选择 | `core/config` | `chooseQuality(name)` | 依据设备能力自动降级 |
| `core/fallbacks.js` | 非核心系统降级实现 | vendor | `FALLBACKS`、`noop` | 单系统失败不阻断启动 |
| `core/geometry.js` | 共享几何、UV 校正、变换、合并、静态合批、网格创建 | vendor | `boxGeometry`、`beveledBoxGeometry`、`cylinderGeometry`、`tubeGeometry`、`transformGeometry`、`colorGeometry`、`mergeGeometries`、`mergeGeometryParts`、`batchStaticMeshes`、`createMesh`、`mergeAttributes` | 统一 UV 尺度与合批规则，减少重复几何代码 |
| `core/environment-presets.js` | 时间/天气预设、combine 纯函数、LIGHTNING_TIMING、HELICOPTER_TUNING | vendor、`core/config` | `TIME_PRESETS`、`WEATHER_PRESETS`、`DEFAULT_ENV`、`FOG_K`、`combine`、`LIGHTNING_TIMING`、`HELICOPTER_TUNING` | 数据与状态中枢分离，便于调参 |
| `core/environment.js` | 状态中枢、能见度模型、perception、表现写入 | `core/{random,math,environment-presets}`、`context.render/ground/mats` | `createEnvironment` | 唯一环境状态源，驱动渲染/地面/材质 |

### 5.4 渲染（`src/render/`）

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `render/renderer.js` | 渲染器、场景、双相机、太阳/天空、点光池、尺寸/动态分辨率、阴影、后处理、渲染通道 | vendor、`core/config`、`core/geometry`、`render/sky`、`render/shadows`、`render/postprocessing` | `createRenderer`、`rendererShowcaseModule`、`showcaseRenderer` | 把渲染生命周期集中，业务只调用 `frame/stats/post` |
| `render/sky.js` | 噪声纹理、天空盒 shader、PMREM 环境烘焙 | vendor、`core/config` | `createNoiseTexture`、`Hy`、`Vy`、`SKY_NOISE_GLSL`、`SKY_COLOR_GLSL` | 程序化天空避免大纹理资源 |
| `render/shadows.js` | 阴影视锥拟合、软阴影 shader 注入/恢复 | vendor、`core/config` | `Gy`、`installSoftShadows`、`Xy`、`Yy`、`SHADOW_SHADER_MARKER` | 在 r180 上获得接触硬化软阴影 |
| `render/postprocessing.js` | HDR、深度、AO、Bloom、运动模糊、色调映射、FXAA、颗粒、屏幕反馈 | vendor、`core/config` | `createPostprocessing`、`POSTPROCESS_SHADER_MARKER` | 把后处理封装成可整体降级的管线 |
| `render/materials/materials.js` | 材质缓存、shader 补丁、纹理接入、贴花/标签/编号 | vendor、`materials/surface-shaders`、`materials/textures`、`materials/catalog`、`materials/showcase` | `createMaterials`、`patchMaterialShader`、`materialsShowcaseModule` | 同参数材质复用，减少 program/纹理切换 |
| `render/materials/catalog.js` | 材质数据表与 GLSL 注入片段 | vendor | `c3`、`l1`、`fA`、`dA`、`pA`、`mA`、`gA`、`vA`、`xA`、`yA`、`bA` | 数据与逻辑分离，新增材质只改表 |
| `render/materials/surface-shaders.js` | 程序化表面 DSL 与默认表面 | 无 | `Qy`、`e3`、`t3`、`Tn` | 在 GPU 上生成沥青/混凝土/水等表面 |
| `render/materials/textures.js` | 法线/ORM 烘焙、贴花、标签、编号纹理 | vendor | `i3`、`s3`、`l3` | 用 Canvas/GPU 生成纹理，避免外部贴图 |
| `render/materials/showcase.js` | 材质展示场景 | vendor | `showcaseMaterials` | 快速检查材质与 shader 补丁 |

### 5.5 世界（`src/world/`）

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `world/physics.js` | AABB 列表、射线、视线、地面高度、胶囊移动、导航网格与 A* | vendor、`core/config` | `createPhysics`、`cloneVector3` | 用轻量 AABB 替代完整物理引擎，保证确定性 |
| `world/helicopter.js` | 夜晴直升机盘旋、光柱渲染（分级）、音效跟踪、暴露扫描 | vendor、`core/{random,math,config,environment-presets}` | `createHelicopter` | 产出 `helicopter:spot`；`enabled` 由 environment 控制（M3） |
| `world/level/level.js` | 关卡装配、中继目标、出生点、区域、室内盒、过场路径、静态合批 | vendor、`core/geometry`、`level/buildings`、`level/placement` | `createLevel`、`levelShowcaseModule`、`showcaseLevel` | 关卡数据与构建逻辑集中，便于调整布局 |
| `world/level/buildings.js` | 建筑构建器与放置工具（盒/板/柱/杆/工字梁/楼梯/栈桥/堆叠） | vendor、`core/geometry` | `ob`、`rb`、`no`、`ab` | 提供“关卡 DSL”，让布局代码可读 |
| `world/level/placement.js` | 线缆、地面标牌、楼梯、围栏、集装箱堆叠等摆件 | vendor、`core/geometry`、`level/buildings` | `Lr`、`lv`、`cb`、`ts`、`mt`、`hR`、`fR` | 把重复摆放模式抽成函数 |
| `world/backdrop/backdrop.js` | 远景装配、动画、碰撞注册 | vendor、`backdrop/geometry`、`backdrop/cranes`、`backdrop/ships`、`backdrop/sky` | `createBackdrop`、`backdropShowcaseModule`、`showcaseBackdrop` | 远景与可玩区解耦 |
| `world/backdrop/geometry.js` | 远景共享几何、噪声、颜色、材质辅助 | vendor、`core/geometry` | `_t`、`io`、`kr`、`ua`、`pb`、`rl`、`uv`、`so`、`Ee`、`xt`、`Ke`、`jt`、`ns`、`Bn`、`hv`、`ll` | 复用远景几何与风化颜色 |
| `world/backdrop/cranes.js` | 龙门吊、吊具与结构细节 | vendor、`backdrop/geometry` | `z1`、`mb` | 港口标志性大型结构 |
| `world/backdrop/ships.js` | 货轮 `KITTIWAKE` 与救生艇 | vendor、`backdrop/geometry` | `vb`、`xb` | 远景主体与撤离目标 |
| `world/backdrop/sky.js` | 远景天际线与海鸥 | vendor、`core/geometry` | `Mb`、`wb` | 用低模剪影撑起城市尺度 |
| `world/ground/ground.js` | 地面系统装配、积水/湿度查询、雨与反射 | vendor、`core/config`、`ground/geometry`、`ground/asphalt`、`ground/water` | `createGround`、`groundShowcaseModule`、`showcaseGround` | 统一地表查询接口，供玩家/武器/特效使用 |
| `world/ground/geometry.js` | 地面掩码、细节法线、标线纹理生成 | vendor | `Li`、`Rb`、`U1`、`Cb`、`N1`、`Pb`、`fa` | 程序化生成大面积地表细节 |
| `world/ground/asphalt.js` | 沥青/混凝土网格与材质 uniform | vendor、`ground/geometry` | `Ib`、`zb` | 承载湿润、反射与标线 |
| `world/ground/water.js` | 海面网格、波浪、雨滴涟漪、平面反射 | vendor、`core/config`、`ground/geometry` | `Lb`、`kb`、`Nb` | 港口水面与雨夜氛围 |
| `world/props/props.js` | 道具工厂、未知道具回退、展示 | vendor、`core/geometry`、`props/registry` | `createProps`、`propsShowcaseModule`、`showcaseProps` | 让关卡只依赖“道具名” |
| `world/props/registry.js` | 尺寸表与 builder 注册表 | 无 | `PROP_SIZES`、`PROP_BUILDERS`、`registerProp` | 数据与实现分离，避免循环导入 |
| `world/props/register.js` | 按覆盖顺序安装 builder | `props/registry`、`props/*-builders` | 无导出（副作用） | 用一个文件固定覆盖顺序 |
| `world/props/geometry.js` | 道具共享几何、噪声、随机 | vendor、`core/geometry` | `$a`、`ri`、`mn`、`Ir`、`la`、`Uc`、`pr`、`cn`、`Nc`、`mr`、`g1` 等 | 复用倒角/圆角/磨边几何 |
| `world/props/detail-geometry.js` | 高细节道具几何 | vendor、`core/random`、`core/geometry`、`props/registry` | `At`、`tt`、`zi`、`gn`、`us`、`Ge`、`eo`、`to`、`gr`、`M1` 等 | 把复杂几何从 builder 中拆出 |
| `world/props/basic-builders.js` | 基础道具：集装箱、护栏、灯杆、围栏、岗亭、道闸、系缆桩、标牌、楼梯、栈桥、货架、冷机、中继 | vendor、`core/geometry`、`props/registry`、`props/geometry` | 15 个 `build*` 函数 | 高频、结构简单的道具 |
| `world/props/detailed-builders.js` | 精细道具：桶、托盘、木箱、IBC、电缆盘、轮胎、油桶、锥桶、气瓶、管堆 | vendor、`props/registry`、`props/geometry`、`props/detail-geometry` | `registerDetailedProps`、`S1`、`tv` | 高细节但可缓存的批量道具 |
| `world/props/character-builders.js` | 软体道具：篷布货、沙袋、纸箱 | vendor、`core/geometry` | `registerCharacterProps` | 低成本软体轮廓 |
| `world/props/cargo-builders.js` | 车辆与货物：叉车、发电机、垃圾箱、工具车 | vendor | `registerCargoProps` | 大型可交互/遮挡物 |

### 5.6 输入、玩家与战斗判定

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `input/input.js` | 键鼠、指针锁定、拖拽视角、触屏、手柄 | 无（通过 `context` 访问 renderer/scene） | `createInput`、`KEY_BINDINGS` | 把设备差异收敛为统一动作状态 |
| `player/player.js` | 移动、跳跃、蹲伏、冲刺、ADS、相机、生命、后坐力、脚步 | vendor、`core/config`、`core/math` | `createPlayer`、`PLAYER_MOVEMENT`、`JUMP_SPEED` | 玩家物理与相机表现集中，便于调手感 |
| `combat/combat.js` | 射线命中、弱点、敌人射击、爆炸范围伤害、统计 | vendor | `createCombat` | 把“谁打到谁”从武器/敌人中抽离 |

### 5.7 武器与敌人

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `weapons/weapon.js` | 武器状态机、射击、换弹、扩散、视图模型动画、雨水 | vendor、`core/config`、`core/math`、`weapons/geometry`、`weapons/rig` | `createWeapon`、`weaponShowcaseModule`、`showcaseWeapon` | 把玩法状态与视图动画放同一系统，保证反馈一致 |
| `weapons/geometry.js` | PAC-9 程序化建模 | vendor、`core/geometry`、`weapons/rig` | `mi`（武器尺寸/锚点）、`w_`（构建几何）、`Kc`（三角形计数） | 程序化建模避免外部模型资源 |
| `weapons/rig.js` | 手套/袖口几何、视图模型材质、湿润模拟 | vendor、`core/config`、`core/geometry` | `Vv`、`F_`、`U_`、`N_`、`Wv`、`Bf` | 第一人称手部与雨滴表现 |
| `enemies/enemies.js` | 敌人池、生成、射线、警报、token、更新、残骸/弹丸 | vendor、`core/random`、`core/geometry`、`enemies/models`、`enemies/walker`、`enemies/drone` | `createEnemies`、`enemiesShowcaseModule`、`showcaseEnemies`、`ENEMY_TUNING` | 统一管理两类敌人生命周期与性能预算 |
| `enemies/models.js` | Gull/Hound 骨骼、网格、材质、辅助几何 | vendor | `createWalkerModel`、`createDroneModel`、`pm`、`DRONE_MODEL`、`q_`、`$v` | 把模型构建从行为逻辑中拆出 |
| `enemies/walker.js` | Gull（飞行）行为：巡逻、警觉、齐射、死亡爆炸 | vendor、`enemies/models` | `WALKER_TUNING`、`createWalker` | 飞行敌人的独立参数与状态机 |
| `enemies/drone.js` | Hound（地面）行为：巡逻、潜行、突进、齐射 | vendor、`enemies/models` | `DRONE_TUNING`、`createDrone` | 地面敌人的独立参数与状态机 |

### 5.8 特效与音频

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `effects/effects.js` | 枪口焰、曳光、命中、火花、烟、尘、爆炸、弹壳、水花、碎屑、发射器 | vendor、`core/config`、`core/geometry`、`effects/particles`、`effects/pools` | `createEffects`、`effectsShowcaseModule`、`showcaseEffects` | 事件驱动的表现层，不反向改玩法 |
| `effects/particles.js` | 粒子纹理/图集、批次、材质、渲染顺序 | vendor | `Wc`、`H1`、`Bb`、`Af`、`bv`、`oo`、`_v`、`n0`、`Mv`、`V1`、`Gc`、`W1`、`Ob`、`Ev`、`qc`、`Xc`、`Rf`、`q1`、`da`、`Hb`、`ws`、`Oo`、`X1`、`Y1`、`Wb` | 批量渲染与纹理复用 |
| `effects/pools.js` | 弹壳、碎屑、贴花池 | vendor、`effects/particles` | `$1`、`Z1`、`j1` | 避免高频分配/GC |
| `audio/audio.js` | 音频图、混音总线、3D 声像、混响、音乐调度、事件接线 | `audio/synthesis`、`audio/library` | `createAudio` | 集中管理 voice 与性能预算 |
| `audio/synthesis.js` | DSP 原语、噪声/滤波/包络/混响/失真/重采样 | 无 | `vt`、`ao`、`St`、`Xt`、`Ns`、`Qn`、`Av`、`tn`、`di`、`Vo`、`lo`、`co`、`Se`、`Us`、`Wo`、`em`、`at`、`ei`、`dn`、`Q1`、`Kb`、`Qb`、`ml`、`KR`、`QR`、`e8`… | 程序化音频，无采样资源 |
| `audio/library.js` | 音色注册表与逻辑名映射 | `audio/synthesis`、`audio/music` | `Go`、`i_`、`s_` | 名称到合成器的单一映射表 |
| `audio/music.js` | 程序化音乐（BPM、段落、和弦） | `audio/synthesis` | `MUSIC_TIMING`、`G8`、`q8`、`X8`、`Y8`、`$8`、`Z8`、`j8`、`J8`、`K8`、`Q8`、`eC` | 动态氛围音乐 |

### 5.9 界面与任务流程

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `ui/hud.js` | 罗盘、目标、中继、警告、准星、命中标记、伤害方向、交互提示、击杀信息、血量、弹药、世界标记、字幕 | vendor | `createHUD`、`createElement` | HUD 作为纯 DOM 层，便于样式化与无障碍 |
| `ui/menus.js` | 标题/暂停/死亡/结算/设置/控制、设置持久化 | `core/config` | `createMenus`、`loadSettings`、`saveSettings`、`SETTINGS_KEY`、`DEFAULT_SETTINGS`、`QUALITY_NAMES`、`KEYBOARD_CONTROLS_HTML`、`TOUCH_CONTROLS_HTML` | 菜单与流程解耦，流程只传回调 |
| `game/flow.js` | 任务状态机、三中继、波次、追击、撤离、暂停/死亡/结算 | vendor、`core/math`、`ui/menus` | `createGameFlow`、`GAME_FLOW` | 把玩法节奏集中到可调参数表 |

### 5.10 引擎

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `vendor/three-r180.js` | 本地 Three.js r180 全量实现，标准命名导出 | 无 | Three.js 全部命名导出 + `THREE` + `defineModuleExports` | 锁定版本，避免与外部 `three` 实例混用 |

### 5.11 脚本与归档

| 路径 | 核心职责 | 依赖 | 主要对外接口 | 设计意图 |
| --- | --- | --- | --- | --- |
| `scripts/check-source.mjs` | 校验 66 个模块的语法、命名导入、循环依赖 | `scripts/lib/module-analysis.mjs` | CLI | 构建前快速失败 |
| `scripts/verify-archive.mjs` | 校验原始 HTML 与字体文件的字节数/SHA-256 | `archive/manifest.json`、`archive/font-manifest.json` | CLI | 证明本地副本未漂移 |
| `scripts/verify-refactor.mjs` | 当前模块与原始归档的 AST 等价性审计 | `@babel/parser`、`prettier`、`scripts/lib/module-analysis.mjs`、`refactor-map.json` | CLI | 迁移期证明拆分未改逻辑；有意改玩法后预期失败 |
| `scripts/lib/module-analysis.mjs` | 源文件枚举、AST 解析、import/export 图构建与校验 | `@babel/parser`、`@babel/traverse` | `sourceFiles`、`programPath`、`readSourceGraph`、`validateSourceGraph`、`traverse`、`projectRoot` | 把源码图分析复用给两个校验脚本 |
| `scripts/refactor-map.json` | 模块语句到原始归档的映射 | 无 | 数据文件 | 迁移审计的映射表 |
| `archive/original.html` | 原始发布单文件 | 无 | 数据文件 | 只读基准 |
| `archive/manifest.json` | 来源、版本、大小、SHA-256 | 无 | 数据文件 | 归档元数据 |
| `archive/font-manifest.json` | 字体来源与逐文件摘要 | 无 | 数据文件 | 字体许可与完整性 |
| `docs/DEVELOPMENT.md` | 代码定位与诊断入口 | 无 | 文档 | 开发导航 |
| `docs/VALIDATION.md` | 恢复验收结果 | 无 | 文档 | 验收记录 |
| `docs/REFACTOR_VALIDATION.md` | 模块拆分回归记录 | 无 | 文档 | 拆分证据 |
| `licenses/` | Three.js 与字体许可 | 无 | 文档 | 合规 |

---

## 6. 附录

### 6.1 常用命令

```sh
npm ci                 # 按锁文件安装依赖
npm run dev            # 开发服务器 127.0.0.1:5173
npm start              # 同 dev
npm run check          # 语法、命名导入、循环依赖 + 归档/字体校验
npm run build          # 生产构建到 dist/
npm run preview        # 预览构建 127.0.0.1:4173
npm run format         # Prettier 格式化
npm run verify:archive # 仅校验原始归档与字体
npm run verify:refactor# 迁移等价性审计（有意改玩法后预期失败）
```

### 6.2 按需求定位修改点

| 需求 | 首选文件 | 关键位置 |
| --- | --- | --- |
| 调整移动手感 | `player/player.js` | `PLAYER_MOVEMENT`、`JUMP_SPEED` |
| 调整画质/性能 | `core/config.js`、`render/renderer.js` | `QUALITY_PRESETS`、动态分辨率 |
| 调整任务节奏 | `game/flow.js` | `GAME_FLOW` |
| 调整键位 | `input/input.js` | `KEY_BINDINGS` |
| 调整武器数值 | `weapons/weapon.js` | `Gv/B_/O_/H_/V_`、`WeaponSystem` |
| 调整敌人数值 | `enemies/{enemies,walker,drone}.js` | `ENEMY_TUNING`、`WALKER_TUNING`、`DRONE_TUNING` |
| 新增道具 | `world/props/registry.js`、`register.js`、对应 builder | `PROP_SIZES`、`registerProp` |
| 新增材质 | `render/materials/catalog.js` | `c3`/`l1` 数据表 |
| 新增音色 | `audio/library.js`、`audio/synthesis.js` | `Go` 注册表 |
| 新增 HUD 元素 | `ui/hud.js` + `ui.css` | 构造函数与 `update` |
| 新增菜单屏幕 | `ui/menus.js` + `ui.css` | HTML 模板与 `show()` |
| 调整关卡布局 | `world/level/level.js`、`placement.js` | 中继/出生点/掩体坐标 |
| 调整地表观感 | `world/ground/*`、`render/materials/*` | 纹理生成与 uniform |
| 调整天空/光照 | `core/config.js`、`render/sky.js` | `SKY_COLORS`、`SUN_LIGHT` |
| 调整时间天气 | `core/environment-presets.js` | `TIME_PRESETS`、`WEATHER_PRESETS`、`FOG_K` |
| 调整能见度/暴露 | `core/environment.js` | `visibility`、`perception`、`pushFrame` |

### 6.3 新增道具检查清单

1. 在 `props/registry.js#PROP_SIZES` 添加 `[w, h, d, materialName, surface]`。
2. 在对应 builder 文件实现 `(context, options) => Group`。
3. 在 `props/register.js` 显式导入并 `registerProp(name, builder)`，注意覆盖顺序。
4. 在 builder 返回的 `group.userData` 写入 `colliders` 与 `size`。
5. 需要展示时，`?show=props&names=<name>` 验证布局与材质。
6. 执行 `npm run check` 与 `npm run build`。

### 6.4 新增事件检查清单

1. 在生产者中使用 `context.events.emit("域:动作", payload)`。
2. 在消费者中使用 `context.events.on(...)`，并保存返回的取消订阅函数（如需销毁）。
3. 在第 3.5 节事件表登记载荷结构与生产者/消费者。
4. 确认事件不会形成同步递归（A 派发 → B 处理 → B 再派发同名事件）。
5. 在 `?bench=1` 下确认没有每帧高频派发导致性能问题。

### 6.5 命名与历史遗留说明

- 复杂算法内部仍保留原版短变量名（如 `w_`、`mi`、`Vv`、`Lr`、`Tn`），主要工厂与引擎类型已语义化。
- `enemies/models.js` 的模型命名与使用方存在历史交叉：
  - `createWalker`（Gull，飞行）实际使用 `createDroneModel()` 的产物。
  - `createDrone`（Hound，地面）实际使用 `createWalkerModel()` 的产物。
  - 修改模型结构时必须同时检查 `walker.js`/`drone.js` 对骨骼名的假设。
- `core/config.js` 的 `vf`、`zc` 是原版 layer 常量：`vf = 0` 用于主相机与场景层，`zc = 1` 用于 `viewCamera` 与武器视图模型层。
- `showcase*` 模块统一通过 `defineModuleExports` 挂载 `create/showcase`，便于 `showcases.js` 聚合。

### 6.6 验证与回归

| 场景 | 建议验证 |
| --- | --- |
| 日常修改 | `npm run check`、`npm run dev` 手动试玩 |
| 视觉/着色器修改 | `?shot=1&q=test&seed=4207&dt=0&noaudio=1&cam=...` 固定场景截图对比 |
| 性能修改 | `?bench=1` 查看 avg/median/p99 与 draw call |
| 玩法数值修改 | 固定 `seed`/`eseed` 复现波次与出生点 |
| 构建产物 | `npm run build && npm run preview`，通过 HTTP 打开 |
| 迁移审计 | `npm run verify:refactor`；若已改玩法，失败是预期行为 |

注意事项：

- 不要通过 `file://` 直接打开 `index.html`；ES Module、指针锁定和音频需要 HTTP。
- 不同 GPU 的基准数据不可直接比较，记录 URL、画质与设备信息。
- 修改 `archive/` 下任何文件都会导致 `verify:archive` 失败；归档应视为只读。

### 6.7 常见问题排查

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 页面空白，`#fatal` 显示错误 | `render` 或 `level` 初始化失败 | 查看控制台 `[boot]` 与 `window.__fatal` |
| 有画面但无法转向 | 指针锁定失败、处于 `drag` 模式 | 点击画布；查看 `input.describeMode()` |
| 没有声音 | 未发生用户手势、`?noaudio=1`、AudioContext 被挂起 | 点击 DEPLOY；调用 `context.audio.resume()` |
| 低帧率 | 高级后处理/动态分辨率/阴影过大 | 降低 `?q=`；检查 `__stats()` |
| 卡在标题 | `startGame` 未完成或 `game.start` 抛错 | 查看 `[boot]`、`[loop] game.update threw` |
| 地面/远景缺失 | 对应系统降级或初始化失败 | 检查 `context.ground.stub`、`context.backdrop.stub` |
| 道具显示为灰盒 | 未注册 builder 或 builder 抛错 | 查看 `[props]` 警告/错误 |
| 敌人不动 | `game.state` 非 `playing` 或 AI 暂停 | 检查 `context.game.state` 与 `game:state` 事件 |
| 改动后 `verify:refactor` 失败 | 审计只针对迁移前代码 | 属预期；不要用它约束后续开发 |

### 6.8 术语表

| 术语 | 含义 |
| --- | --- |
| Context | `runtime.js` 创建的系统装配容器，挂载到 `window.__G` |
| System | 由工厂函数返回的对象，通常带 `update(dt)` |
| Showcase | 通过 `?show=` 进入的单子系统展示模式 |
| Fallback | 非核心系统失败时的最小替身 |
| Relay | 任务目标中继，共 3 个 |
| Gull / Hound | 两类敌人；Gull 飞行，Hound 地面 |
| ADS | Aim Down Sights，瞄准 |
| Token | 敌人同时交战配额 |
| Pre-pass | 渲染前回调，用于地形/反射等额外通道 |
| Static batching | 将静态网格按材质合并，减少 draw call |
| IR | Impulse Response，混响脉冲响应 |

### 6.9 相关文档

- [README.md](file:///d:/ZZH/aska/github/Saltline_en/Saltline/README.md)：运行、构建、操作、原件校验。
- [DEVELOPMENT.md](file:///d:/ZZH/aska/github/Saltline_en/Saltline/docs/DEVELOPMENT.md)：代码定位、依赖图、诊断参数。
- [VALIDATION.md](file:///d:/ZZH/aska/github/Saltline_en/Saltline/docs/VALIDATION.md)：恢复验收结果。
- [REFACTOR_VALIDATION.md](file:///d:/ZZH/aska/github/Saltline_en/Saltline/docs/REFACTOR_VALIDATION.md)：模块拆分回归记录。

### 6.10 文档维护约定

1. 新增/删除模块时，更新第 2 章目录树与第 5 章文件表。
2. 修改工厂返回结构或公开方法时，更新第 4 章对应条目。
3. 新增事件或状态时，更新第 3.5/3.6 节。
4. 修改初始化顺序时，更新第 1.3 节与第 3.3 节。
5. 文档中的示例必须能通过 `npm run check`（仅语法层面）并在浏览器中运行。
6. 不确定的实现细节应阅读源码确认，禁止在文档中写入推测性接口。

---

_本文档基于仓库当前实现编写。若代码与文档冲突，以代码为准，并请提交文档修正。_

