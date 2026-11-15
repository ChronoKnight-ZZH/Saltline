// 简报 TTS 测试：四个模式（4 条 lane）× DEPLOY 播报
//
// 运行：npm run test:tts   （即 node --test tests/tts-briefing.test.mjs）
//
// 覆盖点：
//   - 不支持 speechSynthesis 时静默返回、不抛错
//   - 空文本不播报
//   - 四条 lane 各自的 briefText 非空、互不相同
//   - 每个 lane 播报时的文本 / lang / rate / pitch / volume 精确
//   - cancel() 一定发生在 speak() 之前（不叠音）
//   - 语音挑选：无列表 → 不设 voice；仅中文 → 退回默认；非本地英文可用；本地英文优先
//   - 连续两次调用两次 cancel + 两次 speak
//   - speak 抛错不阻断部署
//   - 20 个格子全部产出非空台词
//
// 注意：本测试验证的是「调用链是否正确触发 TTS」。浏览器真正是否发声（引擎、
// 系统音量、用户手势、Safari/Chrome 对 cancel→speak 同帧的处理）无法在 Node 里
// 验证，真机请用 tests/tts-lanes.html。

import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const menusUrl = pathToFileURL(path.join(here, "..", "src", "ui", "menus.js"));

// ---- 浏览器 API 桩 ------------------------------------------------------
class FakeUtterance {
  constructor(text) {
    this.text = String(text);
    this.voice = null;
  }
}

const spoken = [];
const calls = [];

function makeSynth(voices) {
  return {
    getVoices: () => voices,
    speak(u) {
      calls.push({ op: "speak", text: u.text, voice: u.voice ? u.voice.name : null });
      spoken.push(u);
    },
    cancel() {
      calls.push({ op: "cancel" });
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

// 模块首次加载前装好 window，避免 ttsSupported() 早退。
globalThis.window = {
  speechSynthesis: makeSynth([]),
  SpeechSynthesisUtterance: FakeUtterance,
};

const menus = await import(menusUrl.href);
const { LANES, LANE_ORDER, briefText, speakBriefing, ttsSupported } = menus;

const realSpeechSynthesis = globalThis.window.speechSynthesis;
const realUtterance = globalThis.window.SpeechSynthesisUtterance;

// 每个用例换一份新的假 speechSynthesis，并清空调用记录。
function reset(voices = []) {
  spoken.length = 0;
  calls.length = 0;
  globalThis.window.speechSynthesis = makeSynth(voices);
  globalThis.window.SpeechSynthesisUtterance = FakeUtterance;
  return globalThis.window.speechSynthesis;
}

const enLocal = { name: "Microsoft Zira (Local)", lang: "en-US", localService: true };
const enRemote = { name: "Google US English", lang: "en-US", localService: false };
const zhOnly = { name: "Microsoft Huihui", lang: "zh-CN", localService: true };

test("无 speechSynthesis API 时 speakBriefing 静默返回 false 且不抛错", () => {
  delete globalThis.window.speechSynthesis;
  delete globalThis.window.SpeechSynthesisUtterance;
  try {
    assert.equal(ttsSupported(), false);
    assert.equal(speakBriefing("Mission profile: Recon."), false);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.window.speechSynthesis = realSpeechSynthesis;
    globalThis.window.SpeechSynthesisUtterance = realUtterance;
  }
});

// 这条必须排在所有带 voices 的用例之前：_voices 是模块级缓存，
// getVoices() 返回空数组时不会覆盖已有缓存。
test("空文本 / null 不播报、不 cancel", () => {
  reset([]);
  assert.equal(speakBriefing(""), false);
  assert.equal(speakBriefing(null), false);
  assert.equal(speakBriefing(undefined), false);
  assert.deepEqual(calls, []);
});

test("无语音列表时不设置 voice，但仍调用 speak", () => {
  reset([]);
  assert.equal(speakBriefing("High sun. Skies clear."), true);
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].voice, null);
});

test("只有中文语音时退回浏览器默认（不设 voice）", () => {
  reset([zhOnly]);
  assert.equal(speakBriefing("Dead of night. Skies clear."), true);
  assert.equal(spoken[0].voice, null);
});

test("非本地英文语音也会被选中", () => {
  reset([zhOnly, enRemote]);
  assert.equal(speakBriefing("Dead of night. Skies clear."), true);
  assert.equal(spoken[0].voice.name, enRemote.name);
});

test("本地英文语音优先于非本地英文", () => {
  reset([enRemote, enLocal, zhOnly]);
  assert.equal(speakBriefing("Dead of night. Skies clear."), true);
  assert.equal(spoken[0].voice.name, enLocal.name);
});

// ---- 四个模式：逐 lane 验证播报 ---------------------------------------
for (const laneKey of LANE_ORDER) {
  test(`模式 ${LANES[laneKey].label}：台词/参数精确，先 cancel 后 speak`, () => {
    const synth = reset([zhOnly, enLocal]);
    const cell = LANES[laneKey].cells[0];
    const text = briefText(cell[0], cell[1], laneKey);

    assert.equal(typeof text, "string");
    assert.ok(text.length > 0, "台词不能为空");

    assert.equal(speakBriefing(text), true);
    assert.equal(spoken.length, 1);

    const u = spoken[0];
    assert.equal(u.text, text);
    assert.equal(u.lang, "en-US");
    assert.equal(u.rate, 0.95);
    assert.equal(u.pitch, 0.9);
    assert.equal(u.volume, 0.9);
    assert.equal(u.voice.name, enLocal.name);

    // 顺序：cancel 必须先于 speak，且只各一次
    assert.deepEqual(
      calls.map((c) => c.op),
      ["cancel", "speak"],
    );
    assert.equal(synth.getVoices().length, 2);
  });
}

test("四个模式的代表台词互不相同", () => {
  const texts = LANE_ORDER.map((key) => {
    const cell = LANES[key].cells[0];
    return briefText(cell[0], cell[1], key);
  });
  assert.equal(new Set(texts).size, LANE_ORDER.length);
});

test("全部 16 个格子都产出非空台词且能播报", () => {
  reset([enLocal]);
  let count = 0;
  for (const laneKey of LANE_ORDER) {
    for (const cell of LANES[laneKey].cells) {
      const text = briefText(cell[0], cell[1], laneKey);
      assert.ok(text && text.trim().length > 0, `${laneKey}/${cell.join("+")} 台词为空`);
      spoken.length = 0;
      calls.length = 0;
      assert.equal(speakBriefing(text), true);
      assert.equal(spoken.length, 1);
      count++;
    }
  }
  const expected = LANE_ORDER.reduce((n, key) => n + LANES[key].cells.length, 0);
  assert.equal(count, expected);
});

test("连点两次 DEPLOY：cancel 两次、speak 两次，不叠音", () => {
  reset([enLocal]);
  const text = briefText("dusk", "heavyRain", "assault");
  assert.equal(speakBriefing(text), true);
  assert.equal(speakBriefing(text), true);
  assert.deepEqual(
    calls.map((c) => c.op),
    ["cancel", "speak", "cancel", "speak"],
  );
});

test("speak() 抛错时返回 false，不向上抛（部署不被阻断）", () => {
  reset([enLocal]);
  globalThis.window.speechSynthesis.speak = () => {
    throw new Error("engine boom");
  };
  assert.equal(speakBriefing("Last light. Light rain."), false);
});

test("未知 lane 的 briefText 返回空串（不会播报脏文本）", () => {
  assert.equal(briefText("dawn", "clear", "no-such-lane"), "");
});
