# 开发定位

当前代码由 66 个 ES 模块组成；`src/game.js` 只负责导入一次性初始化，再调用 `startGame()`。引擎版本、渲染参数、着色器、关卡、物理、输入和玩法保持原版行为。

## 从哪里开始修改

| 文件/目录 | 职责与主要接口 |
| --- | --- |
| `app/runtime.js` | `startGame`：创建 context、依次初始化系统、驱动主循环 |
| `app/boot-screen.js`、`diagnostics.js` | 加载进度、错误捕获、致命错误显示 |
| `core/config.js` | `WORLD_BOUNDS`、`SUN_LIGHT`、`SKY_COLORS`、`PLAYER_DIMENSIONS`、`QUALITY_PRESETS` |
| `core/events.js`、`random.js`、`math.js` | `createEventBus`、`createRandom`、`clamp`、`lerp`、`smoothstep`、`damp` |
| `core/geometry.js` | 共享几何、倒角、变换、颜色、静态合批 |
| `core/environment-presets.js` | `TIME_PRESETS`、`WEATHER_PRESETS`、`combine`、`LIGHTNING_TIMING`、`HELICOPTER_TUNING` |
| `core/environment.js` | `createEnvironment`：时间/天气/能见度中枢，perception、visibility、set/randomize |
| `world/helicopter.js` | `createHelicopter`（M3）：夜晴光柱、盘旋、音效、`isInBeam`、暴露扫描 |
| `effects/lightning.js` | `createLightning`（M4）：闪电调度、`lightning:flash`/`thunder` 派发、能见度脉冲触发 |
| `effects/solarflare.js` | `createSolarFlare`：白天晴天耀斑/EMP 调度与包络；debuff 经 `perception` 暴露 |
| 平衡数值 | `ENEMY_TUNING.sightRange=120`、脚步噪声 20/8/2、`spreadScale` 1.15/1.35、`LIGHTNING_PEAK_CAP=120`、`HELICOPTER_TUNING`、`SOLAR_FLARE_TUNING`（见 `docs/游戏参数设计方案.md`） |
| `render/renderer.js` | `createRenderer`：场景、镜头、光照、resize、渲染通道 |
| `render/sky.js`、`shadows.js`、`postprocessing.js` | 天空着色器、软阴影和后处理 |
| `render/materials/` | `materials.js` 创建材质；`catalog.js` 定义材质数据；`surface-shaders.js` 和 `textures.js` 生成表面/纹理 |
| `world/physics.js` | `createPhysics`：碰撞、射线和导航 |
| `world/props/` | 道具尺寸和注册表、共享几何、基本/精细/角色/货物建模、`createProps` |
| `world/level/` | `createLevel`，以及建筑和物件放置辅助逻辑 |
| `world/backdrop/` | `createBackdrop`；远景几何、吊机、船舶、天空 |
| `world/ground/` | `createGround`；地面、沥青、积水和水面 |
| `input/input.js` | `createInput`、`KEY_BINDINGS`：键鼠、触屏、手柄 |
| `player/player.js` | `createPlayer`、`PLAYER_MOVEMENT`：移动、跳跃、镜头、生命和后坐力 |
| `combat/combat.js` | `createCombat`：射线命中、伤害和击杀统计 |
| `weapons/` | `weapon.js` 管理状态/射击/装填；`geometry.js` 建模；`rig.js` 装配与动画 |
| `enemies/` | `enemies.js` 管理生成/回收与 `ENEMY_TUNING`；`models.js` 建模；`walker.js`、`drone.js` 行为 |
| `effects/` | `effects.js` 创建/更新特效；`particles.js` 纹理/粒子；`pools.js` 复用池 |
| `audio/` | `synthesis.js` 合成器；`music.js` 音乐；`library.js` 音库；`audio.js` 调度/混音 |
| `ui/hud.js`、`ui/menus.js`、`ui.css` | HUD、字幕、菜单、设置、控件和布局；`menus.js` 另有 `LANES`/`briefText`/`profileText`/`inferLane`（部署前简报屏幕） |
| `ui/briefing-scenes.js` | 简报卡片的 Three.js 场景：4 个正交小场景共用 1 个渲染器（scissor/viewport）；天空复用 `render/sky.js` 并按 `时间×天气` 预设烘到 RenderTarget，`setLaneSky()` 供选卡/重 roll 实时换天色 |
| `game/flow.js` | `createGameFlow`、`GAME_FLOW`：三中继任务、波次、撤离、暂停、死亡和结算；`start(payload)` 接收简报的 `lane/timeOfDay/weather` |

常见改动可直接从这些地方入手：移动速度在 `PLAYER_MOVEMENT`，画质在 `QUALITY_PRESETS`，任务节奏在 `GAME_FLOW`，键位在 `KEY_BINDINGS`，敌人参数在对应敌人模块中。

## 依赖和运行上下文

```text
game.js
  ├─ world/props/register.js  → 按原顺序安装道具 builder
  ├─ app/diagnostics.js       → 安装错误捕获
  └─ app/runtime.js           → startGame → context → 各系统 → 主循环

vendor/three-r180.js ← core ← 各系统
```

模块依赖没有循环。系统工厂使用显式导入的函数/常量，并通过 `context` 访问正在运行的其他系统；`window.__G` 保留为诊断入口。新增逻辑应通过 context 或 `context.events` 协作，避免再增加浏览器全局变量。

初始化顺序在 `app/runtime.js` 中集中管理，仍按原版的 render、materials、physics/props/input、level、backdrop、ground、effects、audio、player/combat、weapon、enemies、HUD、game flow 顺序执行。模型构造、随机数调用和主循环更新顺序也沿用原版。

道具注册有覆盖关系：基础 builder → 精细 builder → 角色 builder → 货物 builder。`world/props/register.js` 集中保留这一顺序；其余 builder 文件只导出实现。新增道具时更新 `registry.js` 中的 `PROP_SIZES`，并在 `register.js` 显式导入并注册对应 builder。

引擎是已校验的本地 r180，实现位于 `vendor/three-r180.js`，可使用标准名称导入：

```js
import { Vector3, Mesh, Group } from "../vendor/three-r180.js";
```

该示例路径适用于 `src/` 的下一层目录。无需再安装另一份 `three`；继续使用本地导出可以避免版本和实例混用。

复杂程序化建模、着色器和声音合成内部仍保留部分原版短变量名，主要工厂和引擎类型已语义命名。改动一个功能时通常只需编辑对应系统文件。

## 原版诊断接口

这些接口本来就在游戏里，适合在浏览器开发者工具中检查：

```js
window.__ready;    // 至少完成两帧渲染
window.__fatal;    // 启动错误
window.__errors;   // 捕获的错误
window.__stats();  // 渲染统计、FPS、游戏状态
window.__G;        // 运行中的游戏上下文
```

`__G` 包含 `game`、`player`、`weapon`、`enemies`、`level`、`render`、`audio`、`physics`、`input`、`events`、`environment`、`helicopter`、`lightning` 等对象。不要将它们作为新的持久存储格式。

`window.__G.environment` 可用，含 `timeOfDay`、`weather`、`wetness`、`lampOn`、`perception`、`visibility`、`set`、`randomize`。

`window.__G.lightning.trigger()` 可立即触发一次闪电（调试用），`window.__G.helicopter.setEnabled(true)` 可强制开光柱。

`window.__G.audio.setWeather("heavyRain")` / `setTimeOfDay("midnight")` 可手动切音频层，`__G.audio.weather` / `__G.audio.musicMood` 读当前倍率（M5）。`?show=environment` 每 6s 换时间、每 4s 换天气。

时间/天气在**游戏内不再提供 UI 开关**（M2 的下拉已移除）：正常流程走 Title → Deploy → 简报屏幕选 lane 并随机到某个组合。控制台调试仍可 `__G.environment.set({ timeOfDay, weather })`。简报屏幕的卡片分组是 `menus.js` 的 `LANES`（recon/assault/stealth/balanced），与 `flow.js` 的 `pickLane`（A/B/C/D 播报分组）是两套独立分类，详见 `docs/gameConfig/模式改造.md` §8.2。

## 原版调试参数

| URL | 用途 |
| --- | --- |
| `/?q=low` | 低画质 |
| `/?q=high` | 高画质 |
| `/?seed=4207` | 固定程序化随机种子 |
| `/?autostart=1` | 跳过标题/入场，直接进入游戏 |
| `/?noaudio=1` | 禁用声音模块 |
| `/?bench=1` | 原版巡游基准和帧时间面板 |
| `/?shot=1&q=test&seed=4207&dt=0&noaudio=1&cam=-32,1.68,6,0,1.68,6` | 本次回归使用的固定时间、种子、镜头场景 |
| `/?time=midnight&weather=heavyRain` | 固定时间/天气（M1 起）；**同时跳过简报屏幕** |
| `/?time=dawn&weather=clear` | 显式默认组合，`force: true` 应用 |
| `/?show=environment` | 时间/天气/直升机/闪电展示，每 6s/4s 自动切换（M5） |

无上述环境/自动化参数时，Deploy 会先进入简报屏幕（`menus.js` 的 `briefingEnabled`），必须选一条 lane 才能开局。

首次启动的画质也会受到已保存设置影响；验收时应同时记录 URL 和设置。不同机器的 GPU 性能不能直接比较。

## 构建说明

Vite 将当前入口、ES 模块、CSS 和字体输出到 `dist/`。源文件已经模块化，生产构建仍由 Vite 合并优化；完整引擎会使输出 chunk 超过默认提示大小，这不影响构建成功。

```sh
npm run check            # 检查所有模块的语法、导入/导出、循环依赖和归档完整性
npm run build            # 构建生产版本
npm run verify:refactor  # 可选：核对本次拆分与原始归档的代码等价性
```

`verify:refactor` 使用 `scripts/refactor-map.json` 将模块语句对应回原始归档，检查表达式、常量、着色器/模板、局部绑定及语句覆盖。只允许模块边界、作用域内改名和不改变逻辑的空 if 包裹块差异。它用于证明这次迁移，**后续有意修改游戏逻辑时预期会失败**，因此没有加入日常 `check`，也不需要为继续开发重写原始归档。

依赖版本锁定在 `package-lock.json`。完整恢复记录见 `archive/manifest.json`，字体下载来源及逐文件摘要见 `archive/font-manifest.json`。
