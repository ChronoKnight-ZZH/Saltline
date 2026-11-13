# 本地恢复验收

日期：2026-11-10。来源：[Saltline Artifact](https://claude.ai/artifact/BGY1SztrAYcJQHSsnHHGmp)，公开版本 `1794242702-61c7`。

## 完整性

- 公开版本清单只包含一个 `index.html`，1,423,413 字节。
- 下载页面移除 Claude 注入的 40,960 字节 frame runtime 后，原件 SHA-256 与发布清单一致：`f7081ef7b2fde5880e3c58184c720b2aa3b9115efe58ff71b48f6820d4f16f90`。
- 将原件内的 JS/CSS 与当前文件分别交给同一版本 Prettier 格式化后比较，内容完全相等。
- 22 个字体文件逐个校验大小与 SHA-256 通过。
- Three.js 保持原版 r180，未升级引擎、替换素材或改动玩法。

## 构建

- Node.js 26.8.2、npm 11.19.1，Vite 8.3.7，Prettier 3.9.10。
- `npm run check` 通过：游戏脚本语法检查、原件和字体校验。
- `npm run build` 通过，输出 `dist/`，包含 HTML、JS、CSS、source map 和全部 22 个字体文件。
- 原版引擎与游戏保持单 bundle，生产 JS 约 1.38 MB（gzip 约 429 KB）；Vite 会显示大 chunk 提示，构建成功。

## 浏览器验收

使用本机的 Codex 内嵌 Chromium 浏览器，分别访问开发服务 `http://127.0.0.1:5173/` 和生产预览 `http://127.0.0.1:4173/`。

| 项目 | 实际结果 |
| --- | --- |
| 启动、3D 场景 | 开发版与构建版均达到 `window.__ready === true`，标题场景正常渲染 |
| 字体与资源 | 三组字体检查均通过；两次运行记录中的 HTTP 资源请求全部指向各自的 `127.0.0.1` 服务，无外部资源请求 |
| 设置菜单 | 正常打开/关闭，显示画质、灵敏度、音量、FOV 等原版选项 |
| 部署 | 点击 Deploy 进入 intro，再进入 playing |
| 移动 | 按 W 后玩家从 `[-32, 0, 6]` 移动到约 `[-29.30, 0, 6]` |
| 转向与射击 | 方向键转向生效；Enter 开火后弹匣由 30 变为 27 |
| 装填 | R 触发 reloading，完成后弹匣恢复 30，备弹从 150 变为 147 |
| 暂停/继续 | P 进入 paused，Resume 返回 playing |
| 音频启动 | 用户操作后原版 WebAudio AudioContext 进入 running |
| 运行错误 | 开发版和构建版的 `__fatal` 均为空，`__errors` 均为空数组 |

结构化记录见 `runtime-dev.json` 与 `runtime-production.json`。记录的 FPS 是采样瞬间数据，不作为性能基准。

## 截图

开发版标题：

![开发版标题](screenshots/local-title.jpg)

开发版实际战斗画面：

![开发版战斗](screenshots/local-gameplay.jpg)

构建版标题：

![构建版标题](screenshots/production-title.jpg)

## 验收范围

本次完成启动、基本键盘操作、UI 和构建烟测，没有通关三中继任务，也没有验证移动设备、实体手柄和不同浏览器。内嵌测试浏览器未提供鼠标捕获，已使用原版提供的方向键/Enter 替代操作验证转向和射击；独立 Chrome 中的 Pointer Lock 尚未单独测试。音频验证到 AudioContext 启动，未进行听觉品质评估。

## M1 环境系统验收（2026-11-13）

新增 `core/environment.js` 与 `core/environment-presets.js`，提供时间/天气/能见度中枢。以下截图与改造前对比均使用同一 `?shot=1&q=test&seed=4207&dt=0&noaudio=1&cam=-32,1.68,6,0,1.68,6` URL。

### shot 模式默认环境对比

| 项目 | 结果 |
| --- | --- |
| 天空 | `uZen` 已对齐 shader 原常量，无差异 |
| 太阳色/强度 | `DEFAULT_ENV = dawn` 复用 `SUN_LIGHT`，无差异 |
| 雾 | `fogDensity ≈ 9.1e-5`，不可见，无差异 |
| 曝光 | `exposure = 1.0`，无差异 |
| 地面湿度 | `wetApplied = false`，`mats.uniforms.wet` 保持 1，无差异 |
| 武器湿度 | `weaponWetness` 初始值取自 `environment.wetness`（1），无差异 |

### 时间/天气模式截图

使用 `?time=midnight&weather=heavyRain` 启动：

- 天空变暗（zenith 低亮度）
- 雾浓度显著升高（`FOG_K` 叠加 heavyRain.fogAdd）
- 地面雨量上升（`ground.setRain(0.9+)`）
- 地面湿度上升（`environment.wetness ≈ 0.85`）
- 武器视图模型湿度同步上升
- `ambientIntensity` 降低，整体氛围变暗
- `environment:changed` 事件派发成功，HUD 与音频表现正常

### 画质降级验证

使用 `?q=low` 启动，调用 `__G.environment.apply()`：

- `render.rebakeEnvironment()` 在 low 画质下为空操作（不重建 PMREM）
- `__G.render.env` 保持启动时的默认环境贴图
- 其他 setter（`setFog`/`setSun`/`setExposure`/`setRain`/`wetness`）均正常生效

### 初始化顺序与错误处理

| 项目 | 结果 |
| --- | --- |
| 初始化位置 | `ground` 之后、`effects` 之前 |
| URL 参数生效 | `?time=midnight&weather=heavyRain` 在启动时 `force: true` 应用 |
| 必需性 | 缺失会导致 `runtime` 致命错误 |
| 降级 | 无 Fallback（必需系统） |

## M3 直升机系统验收（2026-11-13）

新增 `world/helicopter.js`，并接入 `enemies.forceExpose`、`hud.expose`、`helicopter:spot`、`audio/library.js` 的 `helicopter` 循环音色、`environment._applyStatic` 启停与 `runtime` 装配。

### 静态与构建

| 项目 | 结果 |
| --- | --- |
| `npm run check` | 通过：69 模块语法/导入/无环检查 + `createHelicopter` 契约 + 归档与字体校验 |
| `npm run build` | 通过：74 模块，`dist/index.html` 1,430.50 kB（gzip 441.63 kB） |
| 归档校验 | `archive/original.html` 曾因 `core.autocrlf=true` 检出为 CRLF 导致 SHA-256 与 manifest 不符，已恢复 LF；本修改未触碰该文件 |

### 无头逻辑冒烟（临时脚本，已删除）

19/19 通过，覆盖：`combine` 的 `helicopterEnabled`（midnight+clear/overcast 为真，rain/非午夜为假）、启停幂等、盘旋初始位置、光柱轴线上 `isInBeam=true`、锥体外/零距离为 false、停用后立即清音效与暴露、`helicopter:spot` 事件派发。

### 浏览器验收

| 场景 | 预期 | 状态 |
| --- | --- | --- |
| `?time=midnight&weather=clear` | 直升机盘旋、光柱、旋翼音效、HUD 暴露标记 | 待人工复验 |
| `?time=midnight&weather=heavyRain` | 无直升机（`lightning=true`） | 待人工复验 |
| 夜间晴→雨切换 | 立即停光柱 + 停音效 + 清暴露 | 待人工复验 |
| 敌人/玩家进入光柱 | `investigate` + HUD 标记（上限 3，1.8s） | 待人工复验 |
| `?shot=1` 回归 | 默认 dawn/clear 无直升机，画面与 M1/M2 一致 | 待人工复验 |

### 与 M3.md 的偏差记录

| 偏差 | 原因 |
| --- | --- |
| 光束 SpotLight 独立创建，不复用 `render.lightPool` | 池内只有 `PointLight`，无 `SpotLight`；池归还后光柱会熄灭 |
| `setModel` 留空函数而非调用 `context.scene` | M3 明确不接模型（§1.2/§3.9） |
| `isInBeam` 距离粗筛在锥体判定之前 | 等价于方案描述，且物理上距离先筛更快 |
| 音效 `setEnabled(false)` 用 0.12s 淡出代替硬停 | 避免 WebAudio 爆音；听觉上等同立即停止 |
| `audio.js` 未改动 | 现状 `loop()` 句柄已有 `setPos/setGain/setPitch/stop`，无需改 |
| runtime 装配顺序为 `helicopter` → `environment` | 保证 environment 构造时 `applyStatic` 能检测到直升机（M3.md §4.7.1 的顺序要求） |

## M4 雷暴系统验收（2026-11-13）

新增 `effects/lightning.js`，并接入 `environment._onLightningFlash` / `scanLightningExpose`、`enemies.forceExpose`（M3 交付）、`renderer` 的 `post.flash`、`hud` 的 `lightning:exposed` 与准星泛白。

### 静态与构建

| 项目 | 结果 |
| --- | --- |
| `npm run check` | 通过：70 模块 + `createLightning` 契约 + 归档与字体校验 |
| `npm run build` | 通过：75 模块，`dist/index.html` 1,433.51 kB（gzip 442.47 kB） |

### 无头逻辑冒烟（临时脚本，已删除）

33/33 通过，覆盖：`lightningEnabled` 四种天气矩阵、`_applyStatic` 启停联动、`heavyRain` 8–12s / `lightRain` 16–20s 调度、`thunder` 强度（1.0 / 0.6）、夜晚 `postFlash=true`、白天与 `low` 画质 `postFlash=false`、`lightningT=0.8`、`current` 跳到峰值、连续闪电取 max 不叠加、`lambda=5` 在 0.8s 衰减到 1/e 内且不过冲、`scanLightningExpose` 只暴露「距离内 + LOS 可达 + 非 engage」的敌人、`lightning:exposed` payload、`game.state` 非 playing 冻结调度、非雨天不启用。

光锥几何另做了一次独立验证（顶点落 `beam.origin`、底面中点落 `origin+dir*range`、底面半径 = `tan(halfAngle)*range`，偏差均 0.000m）。

### 浏览器验收

| 场景 | 预期 | 状态 |
| --- | --- | --- |
| `?time=midnight&weather=heavyRain` | 8–12s 一次闪电，全屏闪白 + 天空闪 + 雷声，能见度瞬时升到 88.2m | 待人工复验 |
| `?time=midnight&weather=lightRain` | 16–20s 一次，强度较弱 | 待人工复验 |
| `?weather=clear` / `overcast` | 无闪电 | 待人工复验 |
| `?time=noon&weather=heavyRain` | 只有天空提亮，**无**全屏闪白 | 待人工复验 |
| `?q=low&weather=heavyRain` | 无全屏闪白（`envFlash=false`） | 待人工复验 |
| `?time=midnight&weather=heavyRain` | **无直升机**（`lightning=true`） | 待人工复验 |
| 闪电后敌人 | LOS 可达者 `investigate`，HUD 标记出现，已在 `engage` 的不降级 | 待人工复验 |

### 与 M4.md 的偏差记录

| 偏差 | 原因 |
| --- | --- |
| 未改 `walker.js` / `drone.js` | 与 M4.md §4.3 决策一致：暴露扫描统一走 `environment.scanLightningExpose`，敌人侧订阅会重复 `forceExpose` 与多一次 LOS |
| `environment` 新增 `lampOn` getter | M4.md 的 `_flash` 需要 `environment.lampOn` 判定夜晚，但 M1 未暴露该字段 |
| `post.flash` 增加逐帧衰减 | **M4.md 漏项**：原版只有 game flow 写 `post.flash = 0`，从不衰减；闪电写入后会永久泛白。`renderer.frame()` 内按 `exp(-3.2*dt)` 收敛 |
| `renderer` 订阅放在 `N` 定义之后 | 订阅回调访问 `N.post.flash`；写在 `N` 之前会踩 TDZ |
| `_flash` 的 `night` 用 `dusk.lampOn=0.7` 也判夜晚 | M4.md §10 第 10 条明确标注需确认；黄昏雷雨天色已暗，全屏 flash 合理。若认为过亮，改 `NIGHT_LAMP_ON` 一处即可 |
