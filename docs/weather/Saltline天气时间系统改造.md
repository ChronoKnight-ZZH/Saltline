# Saltline 环境系统（时间 / 天气 / 能见度 / 直升机 / 雷暴）修改实施方案

> 对应需求确认：开局随机、用户可自定义、不实时流逝、影响玩法、接受切换卡顿、低端机降级、不持久化；夜晚无雨直升机光柱、夜晚雨停飞、闪电统一能见度语义、方案 B（0.8s 高能见 + 0.8s damp 回落）、暴露采用信息层语义、闪电后敌人进入 `investigate`、HUD 标记上限 3。

---

## 0. 总体设计

新增一个 **`EnvironmentSystem`** 作为环境状态中枢，持有 `timeOfDay × weather` 两个正交维度，派生出一个**统一的能见度模型**，并驱动两个特殊事件子系统：

```
                 ┌─────────────────────────────────────┐
                 │        core/environment.js          │
                 │  timeOfDay / weather / visibility   │
                 └───────┬──────────────┬──────────────┘
                         │              │
         ┌───────────────┘              └───────────────┐
         ▼                                              ▼
  world/helicopter.js                          effects/lightning.js
  （夜晴：光柱 + 音效 + 暴露）                  （雨：闪电 + 雷暴 + 能见度脉冲）
         │                                              │
         └──────────────┬───────────────────────────────┘
                        ▼
            perception { visibility, visualAlert, audioMask, spreadScale }
                        │
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
   enemies/*        weapon.js        ui/hud.js       render/*（雾密度）
```

**核心原则**：能见度是唯一距离语义，暴露是能见度恢复的自然结果，不引入独立倍率。

---

## 1. 状态与数据结构

### 1.1 环境状态

```js
// core/environment.js 内部
state = {
  timeOfDay: "dawn" | "noon" | "dusk" | "midnight",
  weather:   "clear" | "overcast" | "lightRain" | "heavyRain",
  // 派生
  target:  { /* presets 组合后的目标值 */ },
  current: { /* 每帧 damp 后的当前值 */ },
}
```

### 1.2 预设数据结构（`core/environment-presets.js`）

```js
TIME_PRESETS = {
  dawn:     { sunDir, sunColor, sunIntensity, skyTop, skyHorizon, fogColor, exposure, ambient, visibility: 180, lampOn: 0.4, musicMood: "calm" },
  noon:     { ... visibility: 220, lampOn: 0.0, musicMood: "bright" },
  dusk:     { ... visibility: 160, lampOn: 0.7, musicMood: "warm" },
  midnight: { ... visibility: 90,  lampOn: 1.0, musicMood: "dark" },
}

WEATHER_PRESETS = {
  clear:     { visibilityMul: 1.00, audioMask: 0.00, spreadScale: 1.00, rainLevel: 0.0, wetness: 0.0, lightning: false, fogMul: 1.00 },
  overcast:  { visibilityMul: 0.78, audioMask: 0.10, spreadScale: 1.00, rainLevel: 0.0, wetness: 0.2, lightning: false, fogMul: 1.25 },
  lightRain: { visibilityMul: 0.50, audioMask: 0.50, spreadScale: 1.05, rainLevel: 0.45, wetness: 0.6, lightning: true,  fogMul: 1.60 },
  heavyRain: { visibilityMul: 0.28, audioMask: 0.72, spreadScale: 1.15, rainLevel: 1.0, wetness: 1.0, lightning: true,  fogMul: 2.20 },
}
```

`combine(time, weather)` 产出 `target`：

```js
target.visibility = time.visibility * weather.visibilityMul   // 米
target.fogDensity = k / target.visibility * weather.fogMul
target.audioMask  = weather.audioMask
target.spreadScale = weather.spreadScale
target.lampOn     = time.lampOn
target.lightningEnabled = weather.lightning && (timeOfDay !== 无用) // 雨天即可
target.helicopterEnabled = (timeOfDay === "midnight") && !weather.lightning
// 即：夜晚 + 无雨（clear/overcast）才有直升机
```

### 1.3 能见度模型

```js
visibility = {
  base:     target.visibility,          // 目标基础能见距离
  current:  number,                     // 当前实际能见距离
  lightningPeak: min(base * 3.5, 200),  // 闪电峰值
  lightningT: 0,                        // 闪电高能窗口剩余时间
}
```

每帧：

```js
if (lightningT > 0) {
  lightningT -= dt;
  visibility.current = lightningPeak;              // 0.8s 高能窗口
} else if (visibility.current > base) {
  visibility.current = damp(visibility.current, base, 5, dt);  // 0.8s 左右回落
} else {
  visibility.current = damp(visibility.current, base, 3, dt);
}
```

**方案 B 实现**：`lightningT = 0.8`，回落 `damp lambda ≈ 5`（约 0.8s 回落到 1/e）。

### 1.4 `perception`（暴露给玩法层）

```js
environment.perception = {
  get visibility()   { return visibility.current; },
  get visualAlert()  { return 1.0; },      // 预留：敌人自身警觉倍率，当前恒 1
  get audioMask()    { return current.audioMask; },
  get spreadScale()  { return current.spreadScale; },
  footstepMaskAt(pos) { /* 直升机距离 + 雨声合并，见 4.3 */ },
}
```

`visualAlert` 与能见度解耦，当前恒 1，保留接口供后续"巡逻 0.6 / 警戒 1.0"扩展。

---

## 2. 新增文件

### 2.1 `core/environment-presets.js`（约 220–300 行）

- `TIME_PRESETS`、`WEATHER_PRESETS`、`DEFAULT_ENV`
- `combine(time, weather)` 纯函数
- `LIGHTNING_TIMING = { high: 0.8, dampLambda: 5, minInterval: 8, maxInterval: 20 }`
- `HELICOPTER_TUNING = { radius, height, speed, beamHalfAngle, beamRange, exposeInterval: 0.25, maskRadius }`

### 2.2 `core/environment.js`（约 320–450 行）

```js
export function createEnvironment(context) {
  return {
    timeOfDay, weather,
    setTimeOfDay(name), setWeather(name), set({ timeOfDay, weather }),
    randomize(),                 // 开局用 context.rng 随机
    update(dt),                  // damp + 分发 + 驱动 helicopter/lightning
    perception,                  // 见 1.4
    visibility,                  // 见 1.3
    _applyStatic(),              // 切换瞬间：PMREM 重烘焙、阴影重拟合、灯开关
    _pushFrame(),                // 每帧：sun/fog/exposure/wet/rain/audio
    _onLightningFlash(),         // 闪电触发：暴露扫描 + 视觉脉冲
    _updateHelicopter(dt),       // 委托 helicopter.update
  };
}
```

关键逻辑：

- `set()` 时：若 `timeOfDay` 或 `weather` 变化，调 `_applyStatic()`（同步，接受卡顿）；若天气从"有雨"变"无雨"或反之，立即停/启直升机。
- `update(dt)`：damp 所有标量 → `_pushFrame()` → 驱动 `helicopter.update(dt)` → 驱动 `lightning.update(dt)`。
- 闪电触发由 `lightning` 回调 `_onLightningFlash()`：设置 `visibility.lightningT = 0.8`，执行一次全场暴露扫描（见 4.2），派发 `lightning:flash` 事件。
- 直升机暴露由 `helicopter` 每 0.25s 回调 `_onHelicopterSpot(targets)`。

### 2.3 `world/helicopter.js`（约 200–320 行）

```js
export function createHelicopter(context) {
  return {
    enabled, active, pos: Vector3, model: null,   // model 接口占位
    beam: { origin, dir, halfAngle, range },
    setEnabled(on), update(dt),
    isInBeam(targetPos) → boolean,                // 锥体 + LOS
    getSpotTargets() → Array<{type:"player"|"enemy", ref}>,
    setModel(mesh) {},                            // 后续接模型
  };
}
```

- 盘旋：`context.rng.fork()` 派生独立随机源，圆形/椭圆路径 + 高度起伏，周期固定 → 可复现。
- 光柱：锥形网格（`ultra/high` 加噪声 + additive；`medium` 纯半透明；`low` 仅 `SpotLight` + 地面光斑贴花）。
- 音效：`context.audio.loop("helicopter", { pos })`，每 100ms `setPos`。
- `isInBeam`：先锥体判定（`dot > cos(halfAngle)` + 距离粗筛），再 `physics.lineOfSight`。
- 默认 `model = null`，`setModel` 保留接口。

### 2.4 `effects/lightning.js`（约 120–200 行）

```js
export function createLightning(context) {
  return {
    enabled, update(dt),
    trigger(),                    // 手动触发（调试/展示）
    _schedule(),                  // 按 minInterval/maxInterval 随机
    _flash(),                     // 视觉 + 音效 + 回调 environment
  };
}
```

- 调度：`context.rng.fork()`，`clear/overcast` 不触发，`lightRain` 间隔长、`heavyRain` 间隔短。
- 视觉：夜晚 `post.flash` 全屏；白天只做"雨幕变淡 + 天空提亮"（不改 `post.flash`）。
- 音效：`context.audio.play("thunder", { delay: 随机 })`（复用已有 `thunder` 事件链）。
- 回调 `environment._onLightningFlash()`，由 environment 执行能见度脉冲 + 暴露扫描。

---

## 3. 修改文件

### 3.1 L1 基础

| 文件             | 改动                                                         | 行数  |
| ---------------- | ------------------------------------------------------------ | ----- |
| `core/config.js` | `QUALITY_PRESETS` 增加 `envBake: boolean`、`envVolumetricBeam: boolean`、`envRainParticles: number`、`envFlash: boolean` | 20–40 |

### 3.2 L2 渲染

| 文件                            | 改动                                                         | 行数   |
| ------------------------------- | ------------------------------------------------------------ | ------ |
| `render/sky.js`                 | 确认 `SKY_COLORS` 是否 uniform；若否，把 `uSkyTop/uSkyHorizon/uSunColor/uSunDir` 改为 uniform 并暴露 setter；`Vy` 暴露为可重调用 | 60–120 |
| `render/shadows.js`             | 暴露 `refit()`；太阳方向变化 > 15° 时重拟合 + `installSoftShadows`（已注入跳过） | 30–60  |
| `render/renderer.js`            | `setSun(dir,color,intensity)`、`setFog(color,density)`、`setExposure(v)`、`rebakeEnvironment()`（调 `Vy` 换 `scene.environment`，`low` 跳过） | 60–120 |
| `render/postprocessing.js`      | 闪电闪光：夜晚 `post.flash`；白天只用 `post.wet` 短暂降低    | 20–60  |
| `render/materials/materials.js` | 确认 `uniforms.wet` 由 environment 写                        | 0–10   |

### 3.3 L2 世界

| 文件                         | 改动                                                         | 行数  |
| ---------------------------- | ------------------------------------------------------------ | ----- |
| `world/ground/ground.js`     | `setRain` 由 environment 驱动；`setReflections` 由画质 + 天气驱动 | 30–60 |
| `world/ground/water.js`      | 大雨波浪增强；`thunder` 由 lightning 派发（移除原生产者或保留兼容） | 20–40 |
| `world/backdrop/backdrop.js` | `setLights(on, intensity)`：`lampOn` 驱动                    | 30–60 |
| `world/level/level.js`       | `setLights(on, intensity)`：`skylights/shedLights`           | 40–80 |

### 3.4 L3 玩法

| 文件                             | 改动                                                         | 行数   |
| -------------------------------- | ------------------------------------------------------------ | ------ |
| `app/runtime.js`                 | 装配 `createEnvironment`（`ground` 之后、`fx` 之前）、`createHelicopter`、`createLightning`；主循环插入 `environment.update(dt)`；URL `?time=&weather=`；无参数时 `environment.randomize()` | 50–90  |
| `enemies/enemies.js`             | `alert(pos, radius)` 乘 `(1 - audioMask)`；新增 `forceExpose(pos, mode)` 供暴露扫描调用（写入 `lastKnown` + 触发 `investigate`，带 1.5s 冷却） | 40–80  |
| `enemies/walker.js` / `drone.js` | 视觉检测 `dist < min(perception.visibility, baseRadius * visualAlert)`；订阅 `lightning:flash` → 若 LOS 可达玩家则 `forceExpose` | 60–120 |
| `weapons/weapon.js`              | `spread` 乘 `perception.spreadScale`                         | 20–40  |
| `combat/combat.js`               | 可选：敌人射程随能见度微调                                   | 0–40   |

### 3.5 L4 表现

| 文件                 | 改动                                                         | 行数   |
| -------------------- | ------------------------------------------------------------ | ------ |
| `audio/audio.js`     | `setWeather(w)` 雨/风层淡入淡出；`setTimeOfDay(t)` 音乐氛围；直升机循环音 3D 跟踪 | 80–150 |
| `audio/library.js`   | 注册 `helicopter`、`wind`（`thunder` 若已有则复用）          | 20–50  |
| `effects/effects.js` | `setRainIntensity(level)` 全局雨幕；闪电视觉若未拆到 lightning.js 则在此 | 40–100 |
| `ui/hud.js`          | 光柱/闪电暴露标记：绑定 `enemy.id`，上限 3（按距离排序），持续 1.5–2s，`setTimeout` 移除；玩家被照亮时准星边缘泛白 | 60–120 |
| `ui/menus.js`        | 设置面板加"时间""天气"两个 `<select>`，回调 `environment.set`，**不写入 settings** | 40–80  |
| `game/flow.js`       | `start()` 读 environment 做简报；`game:state` 非 playing 时冻结暴露系统 | 20–40  |
| `app/showcases.js`   | 可选注册 `environment` 展示模块                              | 10–20  |

### 3.6 文档

`WIKI.md`：1.3 初始化顺序加 `environment/helicopter/lightning`；3.5 事件表加 `environment:changed`、`lightning:flash`、`helicopter:spot`；3.6 加环境状态；4 章加 `createEnvironment/createHelicopter/createLightning`；5 章加 4 个新文件。

---

## 4. 关键机制实现要点

### 4.1 直升机暴露扫描（每 0.25s）

```
1. 光柱外接球 vs WORLD_BOUNDS 相交粗筛，无交集 return
2. 遍历敌人：AABB vs 光柱外接球 → 锥体判定（dot + 距离）→ LOS
3. 通过者写入 exposureSet（信息层）：
   - HUD 标记（上限 3，按距离排序）
   - 敌人 lastKnown = player.pos，触发 investigate（最短 2s，带 1.5s 冷却）
4. 同时判定玩家是否在光柱内 + 敌人 LOS 可达玩家 → 反之暴露玩家
```

### 4.2 闪电暴露扫描（瞬时，可分帧）

```
1. visibility.lightningT = 0.8；visibility.current = lightningPeak
2. 全场遍历敌人：
   - 距离粗筛：dist(player, enemy) <= lightningPeak
   - LOS：physics.lineOfSight(player.eye, enemy.pos)
   - 通过者：HUD 标记 + 敌人 lastKnown = player.pos → investigate
3. 敌人规模 ≤9 时单帧完成；未来 >9 可分 2–3 帧（视觉先播，逻辑延后）
4. 派发 lightning:flash（供 HUD/音频）
```

### 4.3 `footstepMaskAt(pos)`

```
mask = 0
if (helicopter.active) mask = max(mask, clamp(1 - dist(pos, heli.pos)/heli.maskRadius, 0, 1) * 0.9)
mask = max(mask, perception.audioMask)      // 雨声
return min(mask, 0.85)                      // 上限，避免完全听不见
```

### 4.4 状态机稳定性

- 光柱边缘：锥体判定加 0.3m 容差 + 进入 `investigate` 后最短 2s。
- 闪电 `alert` 冷却 1.5s；闪电调度最小间隔 8s。
- 玩家死亡/重生：`player:dead` / `player:rescued` 清空暴露状态。
- `game:state` 非 playing：冻结暴露系统，不清空（恢复时继续）。
- 夜雨切换：`set()` 检测到 `helicopterEnabled` 变化，**立即**停光柱 + 停音效 + 清暴露，不等 damp。

### 4.5 暴露语义（信息层）

- HUD 标记：绑定 `enemy.id`，每帧校验 `alive && active`，失效移除；上限 3。
- AI：只写 `lastKnown` + 触发 `investigate`，不强制 `engage`；`lastKnown` 5s 衰减。
- 对称：每帧对玩家和敌人各做一次判定。

---

## 5. 性能与降级

| 项             | 默认                                   | `low`                                                      |
| -------------- | -------------------------------------- | ---------------------------------------------------------- |
| 光柱检测       | 0.25s                                  | 0.5s                                                       |
| 光柱体积       | 锥体 + 噪声 + additive（`ultra/high`） | 纯半透明锥体（`medium`）/ 仅 SpotLight + 地面贴花（`low`） |
| PMREM 重烘焙   | 切换时同步                             | **跳过**，用启动时通用环境贴图                             |
| 平面反射       | 开                                     | 关                                                         |
| 雨幕粒子       | 全量                                   | 减半                                                       |
| 闪电全屏 flash | 夜晚开                                 | 关（只改雾密度）                                           |
| HUD 标记更新   | 批量 rAF                               | 同                                                         |
| 直升机音效位置 | 10Hz                                   | 5Hz                                                        |

闪电扫描距离粗筛（`dist <= lightningPeak`）在 LOS 之前，降低开销。

---

## 6. 实施里程碑

| 里程碑              | 内容                                                         | 预估   |
| ------------------- | ------------------------------------------------------------ | ------ |
| **M1 骨架**         | `environment-presets` + `environment` + `runtime` 装配 + 随机初始化 + URL 参数 + `renderer.setSun/setFog/setExposure` + `sky` uniform 化 + `ground.setRain` + `weapon.setWetness` | 2–3 天 |
| **M2 能见度与玩法** | `visibility` 模型 + `perception` + `enemies/walker/drone` 视觉/听觉接入 + `weapon.spread` + `menus` 两个下拉 | 2 天   |
| **M3 直升机**       | `helicopter.js` 光柱/音效/`isInBeam` + 暴露扫描 + HUD 标记 + 玩家被照亮提示 + 夜雨停飞逻辑 | 2–3 天 |
| **M4 雷暴**         | `lightning.js` 调度/视觉/音效 + 能见度脉冲（方案 B）+ 暴露扫描 + 白天/夜晚视觉差异 | 2 天   |
| **M5 表现与降级**   | `audio.setWeather/setTimeOfDay`、`effects` 雨幕、`backdrop/level` 灯光、`QUALITY_PRESETS` 降级分支、`?show=environment` 展示模式 | 2–3 天 |
| **M6 调参与验收**   | 固定 seed 下 4 组组合实测（夜晴/夜雨/昼晴/昼雨）、可靠性清单逐项验证、文档 | 2 天   |

**总计约 12–15 个工作日**，新增/修改约 **20–25 个文件、1100–1800 行**。

---

## 7. 验收清单（对应之前可靠性验证）

**逻辑**
- [ ] 光柱与闪电共用 `lineOfSight`
- [ ] 锥体判定 0.3m 容差
- [ ] 多重暴露合并（HUD 取 max 时间，AI 取最新位置）
- [ ] 暴露对称（玩家/敌人同时判定）

**状态机**
- [ ] 光柱边缘最短 2s investigate
- [ ] 闪电 alert 冷却 1.5s
- [ ] 敌人死亡/回收清 HUD 标记
- [ ] 玩家死亡/重生清暴露
- [ ] `game:state` 非 playing 冻结

**边界**
- [ ] 光柱边缘稳定
- [ ] 墙后不被闪电暴露
- [ ] 光柱无交集跳过
- [ ] 零距离射线不除零
- [ ] 夜雨立即停直升机并清状态

**能见度**
- [ ] 闪电 0.8s 高能 + 0.8s damp 回落，不过冲
- [ ] 连续闪电取 max 不叠加
- [ ] 敌人视觉半径 ≤ 玩家能见距离
- [ ] 白天闪电不触发 `post.flash`

**可复现**
- [ ] 固定 `seed/eseed`，光柱路径与闪电调度一致

**性能**
- [ ] 9 敌人 + 闪电单帧 < 2ms
- [ ] 光柱检测单帧 < 0.5ms
- [ ] `low` 画质无体积噪声、无重烘焙、无平面反射

---

## 8. 唯一遗留待定

**设置面板切换时机**：仅标题/暂停菜单可切（推荐，避免战斗中重烘焙打断），还是游戏中随时可切？此点不影响架构，只影响 `menus.js` 的 `panelOpen` 与 `flow` 的暂停联动，可在 M2 前确认。