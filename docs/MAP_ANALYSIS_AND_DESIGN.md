# Saltline 地图实现分析 & 新地图设计（TIDEGATE）

> 范围：只读分析现有港口关卡（Saltline 1.0）的空间装配与运行时契约，并给出一张可在同一套系统内落地的新关卡设计。
> 依据：`docs/WIKI.md` 第 3/4/5 章 + 源码 `src/world/level/*`、`src/world/physics.js`、`src/core/config.js`、`src/world/props/registry.js`、`src/game/flow.js`。
> 结论：新地图可在**不改动引擎与玩法代码**的前提下实现，新增一个 level 模块并切换 `app/runtime.js` 的一行 import 即可。

---

## 第一部分 · 当前地图是怎么实现的

### 1.1 一张图看清分层

```
core/config.js          WORLD_BOUNDS（唯一的空间真相：陆/海分界、地面高度）
        │
        ▼
world/level/level.js    createLevel(context) —— 关卡唯一入口，返回 LevelSystem（12 个字段）
        ├── level/buildings.js   ob()  返回“关卡 DSL”工具包；ab() 造仓库区（含天窗/点光/中继位）
        └── level/placement.js   cb()  造码头区；Lr/lv/ts/mt 等摆放辅助
        │
        ▼
world/props/*           place("容器名") → 实例化道具 → 读 userData.colliders
        │
        ▼
world/physics.js        addBox() → 全局 AABB 列表 → 导航网格（0.5m A*）
        ▼
player/enemies/combat   通过 moveCapsule / nav.findPath / raycast 消费上面的数据
```

关键点：**地图不是美术资源，而是“数据 + 程序化几何”**。没有 glTF/贴图资产，全部由 `box/slab/cyl/ibeam/place/stairs/catwalk/stack` 拼出来，材质走 `render/materials` 的程序化材质名。

### 1.2 空间真相（硬约束，改新图必须先看这张表）

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `WORLD_BOUNDS.min / max` | `(-40, 0, -30)` / `(40, 30, 30)` | 世界盒 80 × 60 × 30 |
| `groundY` | `0` | 陆地地面高度 |
| `seaY` | `-1.6` | 海面高度 |
| `quayX` | `30` | 陆/海分界线：x ≤ 30 是码头，x > 30 掉海 |
| 导航单元 | `0.5 m` | A* 网格；`x < -40`、`x > quayX - 0.5`、四周边框全部强制不可走 |

因此：**可站立/可走区域实际只有 x ∈ [-40, 29.5]、z ∈ [-30, 30]，且地面恒为 y = 0 的平面。**
`physics.groundHeight()` 与 `raycast()` 对 `x ≤ quayX` 一律返回 `0`，所以**挖坑、下沉干船坞、斜坡地形都做不出来**——垂直度只能靠楼梯、栈桥、堆叠体（可走表面必须由真实 mesh 提供，胶囊移动会做台阶吸附）。

### 1.3 关卡 DSL（写图的“语法”）

`buildings.js#ob(context)` 返回一个工具箱，主要成员：

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `place(name, x, z, yaw?, opts?, y?, cfg?)` | 道具 | 同时也是**碰撞注册入口**：自动读 `userData.colliders`、变换到世界坐标后 `physics.addBox` |
| `col(x0,y0,z0, x1,y1,z1, surface?, opts?)` | 静态盒 | 纯碰撞体（隐形墙/顶棚） |
| `box / slab / cyl / tube / rod / ibeam / quad` | 几何 | 程序化结构件 |
| `decal / label` | 贴花与文字 | 地面标线、编号、标牌 |
| `stairs(x, z, yaw?, opts?, y?)` | 楼梯 | 同时写入 `metalRects`（金属地面判定） |
| `catwalk(x, z, yaw?, opts?, y?, rails?)` | 栈桥 | 同上 |
| `stack(x, z, levels, yaw?, jitter?)` | 集装箱堆 | 返回 `{top, objs}`，并按层叠高度注册碰撞 |
| `isMetal(x, z)` | 查询 | 供 `level.groundSurfaceAt` 返回 `metal`/`concrete` |

静态对象挂 `staticRoot`（末尾 `batchStaticMeshes` 合批成一个 `level-merged` 网格）；动态或不参与合批的挂 `dynRoot`（用 `userData.noMerge` 也可临时豁免）。

### 1.4 现有地图的布局数据

| 项 | 值 |
| --- | --- |
| 玩家出生 | `(-32, 0, 6)`，yaw 朝东 |
| 区域 zones | gate `[-40,-24]×[-30,30]`、yard `[-24,-10~16,30]`、shed `[-24,-30]×[16,-10]`、quay `[16,-30]×[40,30]` |
| 中继 A（yard 堆场） | `(1.5, 0, 7.5)`，露天，破箱/护栏环绕 |
| 中继 B（shed 仓库） | `(-2, 0.03, -19.5)`，室内深处，仓库 `X0 -16 / X1 12 / Z0 -28 / Z1 -11`、檐高 7、脊高 9.5 |
| 中继 C（quay 码头） | `(23, 0, 0)`，码头前沿 |
| 撤离点 | `(29, 0, 20)`，半径 `2.5`；远景救生艇在 `(30, 0, 20)`，两者必须对齐 |
| 敌人出生点 | 42 个：地面 25 + 空中 17，按 zone 分配（yard 16 / shed 13 / quay 13） |
| 掩体点 | 54 个；其中 4 个在 `y = 2.59`（集装箱顶），只有玩家上得去 |
| 室内盒 | 1 个（仓库），用于武器湿润/室内判定 |
| 过场路径 | 12 段，从 `(-34,1.6,6.2)` 一路推进到码头 |
| 登高点 | 楼梯脚 `(-2.2, 0, 12.4)` → 箱顶 `(13.5, 2.59, 12.4)` |

### 1.5 任务流程与地图的关系（`game/flow.js`）

1. `flow` 只认 `level.objectives` 三个中继（**顺序自由**，先到先切）。
2. 每切断一个 → 派发 `objective:progress/done` → 波次强度升级，用 `enemySpawns` 按 zone 取点。
3. 三个全断 → `objective:all` → 撤离判定：进入 `level.extraction` 半径 2.5 → `extraction:reached` → 结算。
4. `playerStart` 用于 `player.reset()`；`cinematicPath` 用于开场运镜；`coverPoints` 给 AI 找掩体。

**所以新图的“玩法骨架”是固定的三中继 + 波次 + 撤离，可自由设计的只有空间与节奏。**

### 1.6 装配顺序与被约束的位置

`runtime.js`：`createPhysics → createProps → createInput → createLevel → createBackdrop → createGround → …`

- `level` 必须在 `physics / props / mats` 之后（要注册碰撞、要取材质）。
- `level` 在 `backdrop / ground` 之前，因此**地面与远景由后续系统从 `WORLD_BOUNDS` 独立生成**：改了地形高度、改了陆海分界，地面/海面/远景都会错位。
- `level.stats` 会输出 `tris / meshes / props / containers`，可用来做性能回归对比。

### 1.7 扩展一个关卡的正确姿势（结论）

- 新图 = 一个**同样导出 `createLevel`** 的模块（`src/world/level/<name>.js`），内部用 `ob(context)` 的 DSL 重建，不改 `physics / flow / ground / backdrop / player`。
- `app/runtime.js` 第 12 行是唯一接线点：`import { createLevel } from "../world/level/level.js"` → 换成新文件即可（或用 URL 参数做关卡选择）。
- 必须遵守的 5 条：①地面只能 y=0；②可走区 x ≤ 29.5；③撤离点对齐 ~`(29,0,20)`；④出生点/掩体必须在可走格 2m 内（否则会被自动修正、甚至贴墙）；⑤道具名必须在 `PROP_SIZES` 的 37 个名字里。

---

## 第二部分 · 新地图设计要素（TIDEGATE · 冷链东堤）

### 2.1 设计意图（为什么不是“换个贴图”）

现有地图是**一条东西向线性走廊**：闸口 → 堆场 → 仓库 → 码头，玩家的推进方向即视线方向，远距离交火少、绕后机会少。
新图 TIDEGATE 换成**“一个可绕圈的中央场 + 一条被抬高的终点线”**：

| 维度 | 现图 | TIDEGATE |
| --- | --- | --- |
| 拓扑 | 线性 | 环形（外环主干 + 内环捷径） |
| 主战场 | 露天堆场 | 露天堆场 + **室内冷库**（弱光、近距） |
| 终局 | 地面撤离 | **4.8 m 栈桥上的第三中继**，俯射撤离走廊 |
| 掩体 | 平面掩体为主 | 平面 + 2.59 m 箱顶 + 4.8 m 栈桥，三层立体 |
| 玩家节奏 | 推 → 守 → 跑 | 侦察选路 → 三选一破袭 → 垂直收尾 |

### 2.2 空间指标

| 指标 | 取值 | 说明 |
| --- | --- | --- |
| 世界盒 | `x[-40, 29.5]`, `z[-30, 30]`, `y[0, 9.5]` | 完全落在现有边界内，不动 `WORLD_BOUNDS` |
| 可玩面积 | ≈ 4 100 m² | 与现图同级，不扩大 |
| 主通道宽度 | 6 ~ 9 m | 保证 Hound 可列队、玩家可 ADS 走位 |
| 最短通关路 | ≈ 210 m | 现图约 160 m，节奏略长 |
| 垂直层 | 0 / 2.63 / 2.59 / 4.8 / 6.2 m | 6.2 以上仅遮挡不可达 |
| 目标数 | 3 中继 + 1 撤离 | 与 `flow` 契约一致 |

### 2.3 分区（zones 直接照抄这张表即可）

| zone | AABB `[minX, minZ] → [maxX, maxZ]` | 内容 | 设计职责 |
| --- | --- | --- | --- |
| `gate` | `[-40,-12] → [-26,12]` | 岗亭、道闸、灯杆、双排护栏 | 出生区/教学区，第一波接触 |
| `yard` | `[-26,-30] → [6,30]` | 4 列纵向集装箱阵（2 层堆）、叉车、托盘 | 主交火场，环形外环 |
| `coldstore` | `[6,-30] → [18,-4]` | 冷库（檐 6.2 / 脊 8.5）、4 处天窗、3 扇门、货架 | 室内近距，噪音/弱光压迫 |
| `quay` | `[18,-30] → [29.5,30]` | 前沿空地、龙门吊腿、系缆桩、4.8 m 栈桥 | 终局与撤离走廊 |

> 分区之间的缺口就是“门”：yard ↔ coldstore 用**两个出入口**（`z ≈ -6` 与 `z ≈ -22`）；coldstore ↔ quay 用**一个上料门 + 一段 4.8 m 栈桥**。这样三个中继都至少有两向接近路线，避免“一条路卡死”。

### 2.4 动线（三选一破袭 + 环形收尾）

```
出生 gate(-33,0,4)
   │
   ├─ 外环（开阔、暴露）：贴 z=+28 一路向东 → 绕到 quay 北端 → 栈桥下
   ├─ 内环（掩体密集）：yard 集装箱通道 → z 轴穿越 → coldstore 西门
   └─ 屋顶线（高风险高收益）：楼梯上箱顶(2.59) → 跨 3 个箱顶 → 跳入 coldstore 天窗 → 直落中继 B

中继 A（yard 中央）── 中继 B（coldstore 深处）── 中继 C（quay 4.8m 栈桥）
   └── 三者顺序自由，但每断一个都会把 wave 强度 +1，并让直升机光柱扫向该 zone
最后：从栈桥跳下/走楼梯到底 → 沿 quay 前沿南下 → 撤离点 (28.5,0,20)
```

### 2.5 三个中继的战术性格（这是新图的核心设计）

| 中继 | 位置 | 接近方式 | 防守压力 | 设计目的 |
| --- | --- | --- | --- | --- |
| **A · Yard** | `(-4, 0, 12)` | 东/西/北三面箱道 + 南面箱顶俯冲 | 中；三向同时来敌 | 训练“选角度”，第一次被迫做空间判断 |
| **B · Coldstore** | `(12, 0.03, -20)` | 西门、北门、天窗落顶 | 高；弱光近距、无遮挡退路 | 制造一次“必须进屋子”的压迫，节奏由远距切近距 |
| **C · Quay Catwalk** | `(25, 4.8, -6.2)` | 楼梯登桥 / 桥面南北两端 | 最高；上桥后无掩体、可被空中 Gull 夹击 | 收尾做成“仰角决战”，撤离前给一次高点危机 |

### 2.6 垂直系统（唯一能做的“地形”）

| 层 | 高度 | 落地方式 | 谁能到 |
| --- | --- | --- | --- |
| 地面 | `0` | 出生即有 | 全部单位 |
| 箱顶 | `2.59` | `stairs_metal`（yard 西北角）+ 三级堆叠跳接 | 仅玩家（AI 不进导航不可达格） |
| 栈桥 | `4.8` | quay 南端 `stairs_metal` 两跑（每跑 2.4 m）+ 6 段 3 m `catwalk` 连桥 | 仅玩家 |
| 冷库脊 | `6.2 ~ 8.5` | 不可达 | 仅遮挡/光影 |

> 注意：`place` 的 `y` 参数是**道具底面高度**；栈桥/楼梯自带碰撞，但**桥面可行走性来自 mesh 本身**（胶囊用 raycast 找地），所以 catwalk 必须连续铺设、不许留 0.5 m 以上缝隙，否则玩家会掉下去。

### 2.7 掩体与出生点配额（总数对照现图，便于回归）

| 项 | 数量 | 分布 |
| --- | --- | --- |
| `coverPoints` | 48 | yard 22（含 6 个箱顶）/ coldstore 12 / quay 8（含 4 个桥面）/ gate+bridge 6 |
| `enemySpawns` 地面 | 26 | yard 10 / coldstore 8 / quay 8 |
| `enemySpawns` 空中 | 17 | yard 7（y 9~12）/ coldstore 3（y 4.5~5.5，天窗下）/ quay 7（y 8.5~13） |
| `interiorBoxes` | 1 | coldstore 内腔，`y 0 → 7` |

所有点写完必须过一遍 `nav.isWalkable`；`createLevel` 末尾已有 2 m 环形搜索兜底，但**只兜底一次**，写歪了会被悄悄挪位置，验收时要用脚本断言。

### 2.8 撤离与远景对齐

- `extraction = (28.5, 0, 20)`, `radius 2.5`。
- 救生艇 `backdrop.extractionPoint = (30, 0, 20)`；两者相距 1.5 m，视觉上是“走到舷梯边”。
- 撤离走廊 `z ∈ [12, 28]` 保持**无高遮挡**，让最后一波 Gull 从海面方向压进来。

### 2.9 光、雨、可读性

- 复用现有夜雨预设，不改 `environment-presets`。
- 冷库：4 盏点光（`userData.baseIntensity`，由 `setLights` 统一调光）+ 4 个 `skylights`（仅数据，不是灯）；室内亮度低于场地 40%，靠中继自发光与手电感做引导。
- 可读性三原则：①三个中继各配**唯一颜色自发光**（A 青 / B 橙 / C 白），远处可辨；②地面用 `decal` 画“去 A/B/C”标线；③栈桥边沿加 `hazard_stripes`，防止玩家在 4.8 m 处失足。

### 2.10 道具清单（只用已注册的 37 个名字）

| 区域 | 主要道具 |
| --- | --- |
| gate | `guard_booth`、`gate_arm`、`fence_panel`、`light_mast`、`bollard_post`、`sign_post` |
| yard | `container20/40/40hc`、`forklift`、`pallet_stack`、`crate_stack`、`cable_reel`、`tire_stack`、`barrel`、`traffic_cone`、`jersey_barrier` |
| coldstore | `shelf_rack`、`pallet`、`ibc_tote`、`cardboard_boxes`、`reefer_unit`、`floodlight_stand`、`relay_node` |
| quay | `bollard_mooring`、`dumpster`、`generator`、`pipe_stack`、`catwalk`、`stairs_metal`、`relay_node` |
| 通用 | `tarp_cargo`、`sandbags`（临时掩体）、`gas_cylinders`（可爆炸点缀） |

> 想加新道具（例如“冷库卷帘门”）就必须走 `PROP_SIZES` + builder + `register.js` 四步，**不属于本图范围**，先用 `fence_panel` + `col()` 伪装。

### 2.11 性能预算

| 指标 | 目标 | 依据 |
| --- | --- | --- |
| `stats.tris` | ≤ 现图 +15% | 冷库用大面积 slab，不堆细节 |
| `stats.meshes` | ≤ 现图 +12% | 箱阵复用 `stack()`，一次调用多箱 |
| 合批后 draw call | ≤ 40 | 静态件全走 `staticRoot`，只有中继/门/吊具留 `dynRoot` |
| 导航格 | 140 × 120（0.5 m） | 不扩边界 → 不增加 A* 成本 |

### 2.12 验收清单（可执行）

1. `npm run check` 通过；`npm run build` 成功。
2. `?show=level` 能单独加载新关卡并截图（与现图对比构图）。
3. 连通性断言：`physics.nav.findPath(playerStart, relayA/B/C)` 与 `findPath(relayC, extraction)` 均返回非 null。
4. 42+ 个出生点全部 `isWalkable === true`（脚本遍历，不靠肉眼）。
5. 完整跑通：三中继 → `objective:all` → 撤离 `extraction:reached` → 结算评级。
6. 控制台无 `[props] unknown prop`、无 `[level] label atlas failed`、无 `[level] prop update threw`。
7. `?bench=1` 下 avg 帧率不低于现图 -10%。

---

## 第三部分 · 我能不能写出来

**能。** 理由与代价都摆在下面，避免“看起来能做、实际返工”。

### 3.1 可复用的部分（占工作量 70%）

- DSL 全套（`ob` 的工具箱）：盒/板/柱/梁/贴花/楼梯/栈桥/堆叠都已现成，不用碰 Three.js 底层。
- 道具 37 种 + 自动碰撞注册（`place` 已处理旋转后的 `colliders` 变换与低矮物过滤）。
- 碰撞/导航/射线/胶囊移动：`physics` 自动从 AABB 重建，写图时不需要写任何导航代码。
- 玩法流程、波次、HUD、音频、天气、远景：全部零改动。

### 3.2 必须新写的部分

| 文件 | 动作 | 规模 |
| --- | --- | --- |
| `src/world/level/tidegate.js` | 新建：4 个分区几何 + 冷库内腔 + 三层垂直 + 3 中继 + 42 出生点 + 48 掩体 + 过场路径 + 返回 LevelSystem | 约 600~800 行（照着 `level.js` 的写法） |
| `src/app/runtime.js` | 改 1 行 import（或加 `?map=tidegate` 分支） | 1~6 行 |
| `docs/WIKI.md` | 若保留双图，补一节关卡清单 | 10 行 |

### 3.3 真实风险（3 条，都是“会悄悄坏”的那种）

1. **导航可达性**：出生点/掩体落在不可走格会被 2 m 环形搜索静默挪走；必须脚本断言，否则体感是“敌人从墙里出来”。
2. **合批与 noMerge**：中继、卷帘门、吊具这类要动的物体必须 `dynRoot` 或 `noMerge`，否则被合批进 `level-merged`，`object` 引用失效 → 交互失效。
3. **4.8 m 栈桥的地面判定**：可行走面依赖 mesh 的 raycast，接缝 > 0.5 m 会掉下去；桥面必须整段 `catwalk` 连续铺。

### 3.4 建议的落地顺序

1. 先只做**空间骨架**（地面分区 + 箱阵 + 冷库壳体 + 栈桥），用 `?show=tidegate` 截图对构图。
2. 再填**战术层**（中继、掩体、出生点、标线），跑连通性断言。
3. 最后接**氛围层**（灯光、贴花、天窗、远景对齐），跑 `bench` 与完整通关。
4. 全程开一个分支，`level.js` 保持不动，随时可回切。

---

## 四、第一步落地记录（空间骨架 · 已实现）

> 本节记录实际写进代码的内容，与前面第二章的“设计意图”如有出入，以本节为准（出入处已在 2.x 改回真实值）。

### 4.1 文件与接线

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/world/level/tidegate.js` | 新建（约 400 行） | 导出 `createTidegateLevel` / `tidegateShowcaseModule` / `showcaseTidegate` |
| `src/app/showcases.js` | 改 2 处 | import + 注册 `tidegate: tidegateShowcaseModule`，使 `?show=tidegate` 可单独看构图 |
| `src/app/runtime.js` | 改 2 处 | import + `params.map === "tidegate" ? createTidegateLevel(context) : createLevel(context)` |

默认启动路径（不传 `map`）**仍然走 `createLevel`**，原关卡零改动。

入口：

- 构图验收：`http://localhost:5173/?show=tidegate&q=high&noaudio=1`（可加 `&cam=x,y,z,lx,ly,lz` 覆盖机位）
- 整局验收：`http://localhost:5173/?map=tidegate&autostart=1&noaudio=1`
- 原关卡回归：`http://localhost:5173/?show=level&q=high&noaudio=1`

### 4.2 骨架的实际数值

| 项 | 实现值 |
| --- | --- |
| 分区 `gate` | `x[-40,-26] z[-12,12]`（7 段 `fence_panel`，主门开在 `z[-2,4]`，南北侧翼各留缺口） |
| 分区 `yard` | `x[-26,6] z[-30,30]`（4 列 × 4 槽，跳过 `z=0` 留 12 m 横向穿越口 → 32 个双层 `container40`） |
| 分区 `cold` | `x[6,18] z[-30,-4]`，墙厚 0.3，**檐 6.2 / 脊 8.5**；西墙两门、东墙朝码头一门、北墙上料门；4 条天窗光带 + 中央设备脊 + 6 个 `shelf_rack` |
| 分区 `quay` | `x[18,29.5] z[-30,30]`，8 个 `bollard_mooring` 沿 x=29 |
| 栈桥高度 | **4.8 m**（`stairs_metal` 单跑只升 2.4 m，两跑 + 中间平台 = 4.8 m；要 6.0 m 必须三跑） |
| 桥面 | 6 段 3 m `catwalk` @x=26，`z = 9.2 / 6.2 / 3.2 / 0.2 / -2.8 / -5.8`，首尾相接，接缝 0 |
| 楼梯 | `stairs(26,16,yaw=HALF_TURN,y=0)` → 平台 `y=2.4` @`z[13.4,14.7]` → `stairs(26,13.2,yaw=HALF_TURN,y=2.4)` → 桥头平台 `y=4.8` @`z[10.6,11.9]` |
| 中继 C 平台 | `x[22.8,27.6] z[-7.4,-4.9] y[4.7,4.78]` + 西侧 `fence_panel` 护栏 |
| 中继 | A `(-4,0,12)`、B `(12,0.23,-20)`（0.03 地坪 + 0.2 台座）、C `(25,4.8,-6.2)` |
| 出生 | `(-33,0,4)`，yaw `-π/2`（正对闸口） |
| 撤离 | `(28.5,0,20)` r=2.5（与 `backdrop.extractionPoint=(30,0,20)` 相邻） |
| 数据 | 4 zones、1 interiorBox（冷库内腔）、7 段 cinematicPath、35 coverPoints（含 4 个 2.59 箱顶）、24 地面 + 11 空中 spawn、4 skylights |

### 4.3 参数约定（踩过的坑）

`DSL` 的位置参数顺序与直觉相反，写图时以 `buildings.js` 的签名表为准：

| 工具 | 真实签名 | 含义 |
| --- | --- | --- |
| `stairs` | `stairs(x, z, yaw?, y?, opts?)` | **第 4 个参数是高度 `y`**，不是选项 |
| `catwalk` | `catwalk(x, z, yaw?, y?, opts?, rails?)` | 同上；`rails` 是布尔二元组，不是字符串 |
| `place` | `place(name, x, z, yaw?, opts?, y?)` | 传错顺序会把对象实例塞进 `position.y`，得到 NaN 矩阵 |

> 症状对照：把 `opts` 当 `y` 传 → 该实例与所有子网格 `matrixWorld` 全为 `NaN`；合批后 NaN 被烘进 4 个材质组的顶点 → 浏览器恰好报 **4 条** `THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN`（`diamond_plate / paint_yellow / steel_dark / steel_galv`，就是 stairs+catwalk 的 4 个材质）。定位方式：遍历 `staticRoot`，先查 `matrixWorld.elements` 非有限值，再查 `geometry.attributes.position`。

### 4.4 验收结果（本次实际执行）

| 检查 | 结果 |
| --- | --- |
| `npm run check` | 通过：77 模块语法/导入/无环、环境契约 OK、原版归档 SHA-256 校验通过 |
| `npm run build` | 通过：81 modules，`dist/index.html` 1483.61 kB / gzip 458.57 kB |
| `?show=tidegate` 截图 | 门口视角、俯视、码头栈桥、冷库正面 4 张均成像；门口不再有灯杆挡镜；冷库檐 6.2 高于双层箱 5.18 |
| 控制台 | 展示模式的 4 条 `BufferGeometry ... NaN` 已归零；剩余唯一报错为原版既有 `[render] advanced pipeline failed its self test`（原图同样存在，非本次引入） |
| `?show=level` 回归 | 原关卡照常成像，`NaN` 计 0，未出现新报错 |
| `?map=tidegate&autostart=1` | 整局可启动：HUD 显示 “CUT THE THREE LINK RELAYS / RELAYS CUT 0/3”，出生在闸口内侧，任务停菜单可正常弹出 |

### 4.5 本步明确未做（Step 2 / Step 3）

1. 地面去 A/B/C 的导引贴花、`hazard_stripes` 边沿提示。
2. 冷库点光：`shedLights` 目前是空数组、`setLights` 为 no-op；天窗只是几何光带，无真实光照。
3. 掩体/出生点补到设计配额（现 35 掩体 / 24+11 出生点）。
4. 栈桥北端没有下行梯，玩家目前只能从 4.8 m 跳下。
5. **未做脚本断言**：出生点与 coverPoint 的 `nav.isWalkable`、楼梯/桥面接缝的实际通行（自动化环境拿不到 pointer lock，无法真机走位），需要在 Step 2 用无头断言补上。
6. 冷库内部视线（`interiorBoxes` 只有 1 条）、以及全局远景（直升机落在堆场空地，属 backdrop 全局资产，未按新图挪位）。