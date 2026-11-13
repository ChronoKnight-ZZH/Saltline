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

![开发版标题](local-title.jpg)

开发版实际战斗画面：

![开发版战斗](local-gameplay.jpg)

构建版标题：

![构建版标题](production-title.jpg)

## 验收范围

本次完成启动、基本键盘操作、UI 和构建烟测，没有通关三中继任务，也没有验证移动设备、实体手柄和不同浏览器。内嵌测试浏览器未提供鼠标捕获，已使用原版提供的方向键/Enter 替代操作验证转向和射击；独立 Chrome 中的 Pointer Lock 尚未单独测试。音频验证到 AudioContext 启动，未进行听觉品质评估。
