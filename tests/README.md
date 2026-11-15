# 简报 TTS 测试（四个模式 / 四条 lane）

两个测试各管一层，互相不能替代：

| 文件 | 验证什么 | 怎么跑 |
|---|---|---|
| `tts-briefing.test.mjs` | **调用链是否正确**：四条 lane 的台词、参数、cancel 顺序、语音挑选、异常兜底 | `npm run test:tts`（或 `node --test tests/tts-briefing.test.mjs`） |
| `tts-lanes.html` | **真的有没有出声**：真实 `speechSynthesis` 引擎、真实点击手势、`onstart` 是否触发 | `npm run dev` → 打开 `http://127.0.0.1:5173/tests/tts-lanes.html` → 用鼠标点卡片按钮 |
| `tts-min.html` | 对照用最小页：不引入任何项目代码，只有一个按钮和原生 `speak()` | `http://127.0.0.1:5173/tests/tts-min.html` |

## tts-lanes.html 怎么读结果

- 每张卡片一个模式（Recon / Assault / Stealth / Balanced），点按钮走的是与 DEPLOY **完全相同**的调用链：`briefText()` → `speakBriefing()`，且在 click 回调内同步执行。
- **PASS** = 引擎在 1.5s 内触发了 `onstart`（真的开始发声）。
- **FAIL** = `speak()` 已调用，但只有 `end`、没有 `start`。
- 顶部「对照实验」三个单选：
  - 原样（cancel → speak 同帧）
  - 跳过 cancel()
  - cancel() 后延迟 30ms 再 speak
- 「原生最小播报（绕过全部包装）」用原生构造器和原生 `speak()`，排除页面代码干扰。

## 2026-11-14 实测结论（本机 Chrome/Chromium 147，Windows）

- Node 侧 15/15 通过：四条 lane 都正确走到 `speakBriefing()`，文本、`lang/rate/pitch/volume`、`cancel → speak` 顺序、英文语音挑选全部符合预期。
- 浏览器侧四条 lane **全部 FAIL**：日志只有 `cancel → speak → end`，`onstart` 从未触发，`end` 在 3–10ms 内就到达。
- 三个对照实验**全部 FAIL**（跳过 cancel、延迟 speak 都一样）。
- 「原生最小播报」也 **FAIL**（默认语音 / 英文语音 / 中文语音三种都是只 `end` 不 `start`）。
- `tests/tts-min.html` 纯原生页同样 **FAIL**。
- 同一台机器上，Windows SAPI 用 `System.Speech` 朗读 `Hello. System speech test.` 正常阻塞 4758ms。

**结论**：不是游戏代码、也不是四个模式的接线问题，而是当前浏览器实例的 `speechSynthesis` 后端不出声（引擎直接判定朗读结束）。继续排查的方向是浏览器/系统层，而不是 `menus.js`。

## 后续排查建议

1. 在同一台机器换一个浏览器（Edge / Chrome 另一份实例）打开 `tts-min.html`，点「直接 speak」。能听到就说明是某一浏览器的语音后端坏了。
2. 检查 Windows「设置 → 系统 → 声音」里的默认输出设备是否是可用的扬声器（不是已拔掉的 HDMI 显示器）。
3. 浏览器地址栏 `edge://settings/content/speech` / `chrome://settings/content/speech`，确认语音输出没有被禁用、默认语音不是空。
4. 若换浏览器仍无声，再考虑在 `speakBriefing()` 里加防御：空闲时不先 `cancel()`、`speak()` 后 200ms 检查 `synth.speaking` 仍为 false 则重试一次——但这只能绕开引擎的偶发抽风，不能救一个完全不出声的引擎。
