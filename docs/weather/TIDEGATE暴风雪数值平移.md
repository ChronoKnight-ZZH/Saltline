# TIDEGATE 暴风雪：设计稿 → 代码基线的数值平移

> 对应需求：第二张地图（TIDEGATE）锁定「风雪」，取消该图其它天气；先把设计稿数值平移到当前代码基线。
>
> 设计稿：`码头+暴风雪天气.md`（1.1–1.6 / 2.x / 4.x）。
> 代码基线：`src/core/environment-presets.js`（`TIME_PRESETS` / `WEATHER_PRESETS` / `combine` / `LIGHTNING_TIMING`）。
> 复算：`node scripts/audit-snow.mjs`。

---

## 0. 一句话结论

设计稿的**结构**（两档雪 + 风维度 + 雪盲 + 雷雪 + 停飞）全部保留；设计稿的**具体数字**有 3 处写于旧基线、不能照抄：`spreadScale` 会被现码的 §4 调参倒挂，`fogMul` 在 FogExp2 下等于没有雾，`fogColor` 的绝对值在子时会变成发光白墙。这三处按「保持设计意图的相对关系」重新解算，其余数字原样落地。

---

## 1. 平移规则（三条）

| 规则 | 内容 | 影响字段 |
| --- | --- | --- |
| **R1 相对间距不变** | 设计稿的数值是相对「同档雨」写的，平移时保留它和同档雨的差值，而不是保留绝对值 | `spreadScale` |
| **R2 雾用光学厚度** | `FogExp2` 的雾量是 `1-exp(-(d·L)²)`，不是线性；`fogMul` 只能微调 0.1% 级雾量。雪档改用「在能见度距离处被吃掉多少」反解密度 | `fogMul` → `fogOptical` + `fogDensityFor()` |
| **R3 颜色按光照压暗** | 设计稿的 `fogColor` 是白天绝对值；夜间必须按 `time.ambient` 压暗，再与时间雾色混色 | `fogColor` → `snowFogColor()` + `fogMix` / `skyMix` |
| **R4 只回填不改手感** | 新维度（`windLevel` / `snowLevel` / `snowAccum` / `groundFriction` / `screenFx`）给原 4 档补默认值，不改变既有雨天表现 | 原 4 档 |

---

## 2. 逐项对照

### 2.1 能见度（稿值原样采用）

| 字段 | 稿 `lightSnow` | 稿 `blizzard` | 落码 | 说明 |
| --- | --- | --- | --- | --- |
| `visibilityMul` | 0.40 | 0.12 | **0.40 / 0.12** | 与现码时间基准（180/220/160/90）自洽，四时段正好落在稿 1.6 的 88 / 26 / 36 / 11 附近 |
| `audioMask` | 0.55 | 0.82 | **0.55 / 0.82** | 在步噪上限 0.85、雷声上限 0.85 之内，不越界 |

四时段实测（`combine(时段, blizzard)`）：

| 时段 | 时间基准 | 暴雪能见度 | 占敌视距 120m |
| --- | --- | --- | --- |
| dawn | 180 | **21.6m** | 18% |
| noon | 220 | **26.4m** | 22% |
| dusk | 160 | **19.2m** | 16% |
| midnight | 90 | **10.8m** | 9% |

稿 1.6 的难度表写 88 / 26 / 36 / 11，对应 noon 小雪 88、noon 暴雪 26、midnight 小雪 36、midnight 暴雪 11 —— 与落码一致（四舍五入差 0.4–0.8m，来自 220×0.12=26.4）。

### 2.2 武器扩散（R1：防倒挂）

| | `clear` | `overcast` | `lightRain` | `lightSnow` | `heavyRain` | `blizzard` |
| --- | --- | --- | --- | --- | --- | --- |
| 现码基线 | 1.00 | 1.00 | **1.15** | — | **1.35** | — |
| 稿值 | 1.00 | 1.00 | 1.05 | 1.05 | 1.15 | 1.20 |
| **落码** | 1.00 | 1.00 | 1.15 | **1.15** | 1.35 | **1.40** |

**为什么不能照抄**：稿写于 §4 调参之前（小雨 1.05 / 大雨 1.15）。现码已上调到 1.15 / 1.35；若照抄 `blizzard: 1.20`，风雪会比暴雨**更准**（1.20 < 1.35），直接倒挂。

**平移方式**：稿里「小雪 = 小雨」「暴雪 = 暴雨 + 0.05」，于是
- `lightSnow = 现码 lightRain = 1.15`
- `blizzard = 现码 heavyRain + 0.05 = 1.40`

排序校验（`noon` 同时间比较，越大越散）：`clear 1.00 < overcast 1.00 < lightRain 1.15 = lightSnow 1.15 < heavyRain 1.35 < blizzard 1.40`，单调，无倒挂。

### 2.3 雾：`fogMul` 失效（R2）

稿给 `lightSnow fogMul 1.8`、`blizzard fogMul 3.2`。现码 `combine` 的雾密度是

```
d = FOG_K / visibility × fogMul        (FOG_K = 0.02)
雾量 = 1 - exp(-(d · L)²)              (FogExp2)
```

把稿值代进去：

| 组合 | visibility | 稿 fogMul | d | 在能见度处的雾量 |
| --- | --- | --- | --- | --- |
| noon + lightSnow | 88 | 1.8 | 4.09e-4 | **0.13%** |
| noon + blizzard | 26.4 | 3.2 | 2.42e-3 | **0.41%** |
| midnight + blizzard | 10.8 | 3.2 | 5.93e-3 | 2.4% |

结论：`fogMul 3.2` 在 26m 能见度下只有 **0.4%** 的雾量——视觉上等于没有雾，只剩下雪粒子在飘，稿 2.6 要的「白雾／白毛风」根本不会出现。现码的雨档其实也几乎没有雾（`noon + lightRain` 仅 0.1%），雨靠的是着色器雨幕，所以这个公式一直被「够用」掩盖着；雪没有雨幕，必须靠雾。

**平移方式**：改成光学厚度反解，`T` = 在能见度距离处被雪幕吃掉的比例，`d = sqrt(-ln(1-T)) / visibility`。

| 档 | `fogOptical` | noon 能见度 | 落码 d | 能见度处透过率 | 半程（13.2m）透过率 |
| --- | --- | --- | --- | --- | --- |
| lightSnow | **0.55** | 88 | 0.0102 | 45% | 82% |
| blizzard | **0.90** | 26.4 | 0.0575 | 10% | 54% |
| blizzard（子时） | **0.90** | 10.8 | 0.1405 | 10% | 54% |

`0.90` 的含义：能见度距离处九成对比度被吃掉，剩下 10% 刚好够辨认剪影——和 `visibilityMul 0.12` 的「安全视距」语义对齐。`lightSnow 0.55` 保留小雪「能看清但发灰」的定位。

> 雨档公式**完全不改**（`fogMul` 原样保留），避免动到已验证的夜雨观感。

### 2.4 雾色与天空（R3）

稿：`lightSnow #d8e2ec`、`blizzard #e4ecf2`（绝对色，写明是「白天」）。直接用于子时会得到一块比天空亮 4 倍的发光白墙（子时 `fogColor` 亮度只有 0.05）。落码改为两步：

1. **按环境光压暗**：`k = clamp(time.ambient / 1.15, 0.18, 1.0)`，`snowFogColor = Color(稿色) × k`
   - dawn 1.0 / noon 1.0 / dusk 0.78 / midnight 0.30
2. **与时间雾色混色**：`fogColor = time.fogColor.lerp(snowFog, fogMix)`
   - `lightSnow fogMix 0.80`、`blizzard fogMix 0.88`（雪幕里几乎只剩雪色）
3. **天空同步**（新增 `skyMix`，稿未给）：`skyTop.lerp(snowFog, 0.45 / 0.80)`、`skyHorizon.lerp(fogColor, +0.10)`。只压雾不压天的话，抬头还是一片晴空，2.6 的「几乎看不见天空」会直接穿帮。

落码后的亮度（线性亮度，0–1）：

| 时段 | 雾色亮度 | 天空顶亮度 | 同日时间原雾色 |
| --- | --- | --- | --- |
| dawn | 0.690 | 0.604 | 0.53 |
| noon | 0.803 | 0.705 | 0.62 |
| dusk | 0.610 | 0.537 | 0.30 |
| midnight | 0.228 | 0.207 | 0.05 |

子时雾色只比夜空亮一档（0.228 vs 0.207），符合「雪雾把微弱环境光散射开」的观感，而不是自发光。

### 2.5 直射光（稿未给，按排序推导）

稿只给了雾和能见度，没有 `sunMul / sunDiskMul`。按「雪比同档雨更漫射、更少直射」排序推导：

| | lightRain | **lightSnow** | heavyRain | **blizzard** |
| --- | --- | --- | --- | --- |
| `sunMul` | 0.45 | **0.35** | 0.25 | **0.10** |
| `sunDiskMul` | 0.08 | **0.06** | 0.02 | **0.00** |

`sunMul` 同时是 `shadowIntensity`，所以暴雪阴影基本消失（0.10），符合 2.6 的「整体漫射光（无阴影）」。亮度缺口由 `time.ambient`（不改动）与雪面反照补——**反照材质尚未接线**，见 §4。

### 2.6 听觉、雷雪、停飞

| 字段 | 稿 | 落码 | 说明 |
| --- | --- | --- | --- |
| `audioMask` | 0.82 | 0.82 | 步噪 `footstepMaskAt` 仍卡 0.85 上限 |
| `lightning` | `"thundersnow"` | `"thundersnow"` | `lightning.js` 新增 `SCHEDULE.blizzard` |
| 雷雪间隔 | 60–120s | 60–120s | `LIGHTNING_TIMING.blizzardInterval` |
| 闪电峰值 | `min(base×3.5, 200)` | `min(base×3.5, 120)` | 现码上限 120 = 敌视距；暴雪下 10.8×3.5=**37.8m** 远低于两者，稿的 200 不生效 |
| `helicopter` | `false` | `false` | 显式停飞，不再走「只有子夜雨停飞」的隐式规则 |
| `wetness` | 0 | 0 | 雪是覆盖不是打湿：平面反射 `setReflections` 自动关闭（`rainLevel>0.3` / `wetness>0.4` 都不成立） |
| `rainLevel` | 0 | 0 | `ground.setRain(0)`，雨幕不渲染 |

### 2.7 新维度（R4 回填）

| 字段 | clear | overcast | lightRain | heavyRain | lightSnow | blizzard | 接线状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `windLevel` | 0 | 1 | 1 | 2 | 1 | 3 | **已接**：`environment.wind` 每帧给 `{x,z,speed,level}`，雪粒子读取 |
| `snowLevel` | 0 | 0 | 0 | 0 | 0.5 | 1.0 | **已接**：`effects/snow.js` 用 `drawRange` 表密度（4200 颗满档） |
| `snowAccum` | — | — | — | — | 0.5 | 1.0 | 仅数据：地面雪覆盖材质未做 |
| `groundFriction` | — | — | — | — | `{snow:0.92, ice:0.85}` | `{snow:0.82, ice:0.70}` | 仅数据：`physics.moveCapsule` / `player` 未读 |
| `screenFx` | — | — | — | — | — | `{snowBlind:true, windShake:0.35}` | 仅数据：后处理未加 uniform |

`windLevel 0–3` 的速度：`speed = 0.8 + 4.2 × level` m/s（0→0.8、1→5.0、2→9.2、3→13.4），方向缓慢旋转，雪粒子再乘 0.55 横向漂移。

### 2.8 模式映射（简报卡 / 开局播报）

| 天气 | 原 lane | TIDEGATE lane |
| --- | --- | --- |
| clear/overcast × 白天 | A | —（该图无此天气） |
| clear/overcast × 夜 | C | — |
| lightRain/heavyRain × 白天 | B | — |
| lightRain/heavyRain × 夜 | D | — |
| lightSnow/blizzard × 任意 | — | **E / Whiteout（按时段给四张卡，固定 blizzard）** |

---

## 3. 地图锁定（取消其它天气）

`environment-presets.js` 新增：

```js
MAP_WEATHER_LOCK = { tidegate: ["blizzard"] }
weatherAllowedForMap(mapId, weather)
lockedWeatherForMap(mapId)
```

生效点（共 4 处，任一入口都进不来雨）：

1. `createEnvironment`：`weather` 初值 = 锁定档（标题页不会先闪一帧晴天）。
2. `environment.setWeather` / `set`：非法天气回落到锁定档，再走正常阻尼。
3. `environment.randomize`：只从白名单里抽。
4. `runtime`：`?weather=heavyRain` 这类显式参数被忽略并 `console.info` 提示；`?shot / ?bench` 走锁定档；无参数时**只随机时段、天气锁死**。

菜单侧同一件事：`?map=tidegate` 时 `mb-grid` 的 4 张卡从 `LANE_ORDER` 换成 `WHITEOUT_ORDER`（Dawn/Noon/Dusk/Midnight 四张白毛风卡，`cells` 全部是 `[时段, "blizzard"]`），不存在能选到雨的卡。

---

## 4. 未接线清单（本轮只做数值与天气锁定）

| 项 | 稿章节 | 现状 |
| --- | --- | --- |
| 地面雪覆盖材质 / 集装箱顶积雪 | 2.5 / 2.6 | 未做（`snowAccum` 只是数据） |
| 冰面材质与滑倒（`physics` 读 `groundFriction`） | 1.2 / B / C | 未接（数据已备） |
| 雪地脚印 + 敌人追踪 | 1.5 B | 未做 |
| 屏幕雪盲 / 风抖（`post` uniform） | 1.5 F | 未做（`screenFx` 只是数据） |
| 风的方向性听觉（`footstepMaskAt(pos, listener)`） | 1.5 A | 未做（风向量已备，`perception` 仍是全局 `audioMask`） |
| 风声 / 雪脚步音频层 | 1.4 | 部分：`WEATHER_GAIN` 已给 雪档增益（风 0.85/1.0），3D 风声层未建 |
| 极简体温霜化 | 1.5 D | 未做 |

这些项都不影响本轮验收（「第二张图只有风雪」+「数值平移可复算」），但做玩法前必须补。

---

## 5. 复算与验收

```powershell
node scripts/audit-snow.mjs   # 打印四时段能见度/雾密度/亮度/扩散/听觉表
npm run check                 # 契约：模块导出、runtime 接线、原始存档哈希
npm run build                 # vite 单文件 dist
```

实机检查（`?map=tidegate&time=noon&shot=1`）：应看到横向雪幕、无雨幕、无湿地面反射、天空为雪雾色、`console` 无 weather 忽略提示（因为参数就是 blizzard）。`?map=tidegate&weather=heavyRain` 应打印「只接受 blizzard，已忽略 weather=heavyRain」并仍是雪。

**调试用的"关天气"开关**（只读 URL，不改锁定档，刷新即恢复）：

| URL | 效果 |
| --- | --- |
| `?map=tidegate&wx=off` | 解除天气锁，落到晴/黎明（`?weather=off` 等价）；可再叠 `&weather=clear`、`&time=noon` |
| `?map=tidegate&snow=0` | 只关雪粒子，暴雪的雾/压暗/风力/雷雪照旧 |
| `?map=tidegate&lightning=0` | 本次不建闪电（雷雪也一并消失） |
| `?map=tidegate&wx=off&snow=0&lightning=0` | 一条命令回到干净天空，做地形/几何验收 |

判定逻辑在 `environment-presets.interpretWeatherParams`，自检 `npm run audit:weather`（详见 `docs/DEVELOPMENT.md` 的「原版调试参数」表）。
