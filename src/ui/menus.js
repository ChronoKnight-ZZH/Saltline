// DOM menus, persisted settings and controls panels.
import { PLAYER_DIMENSIONS, QUALITY_PRESETS } from "../core/config.js";
import { createBriefingScenes } from "./briefing-scenes.js";

var SETTINGS_KEY = "saltline.settings.v1";

var DEFAULT_SETTINGS = {
  quality: "auto",
  sens: 1,
  invertY: !1,
  volume: 0.8,
  fov: PLAYER_DIMENSIONS.fov,
};

var QUALITY_NAMES = ["low", "medium", "high", "ultra"];

// ---- 任务简报：4 条 lane 把 16 格时间/天气归并成 4 种可选的“插入配置” ----
// 每张卡只声明 cell 组合，不复制 TIME/WEATHER 预设值；若环境预设改名，这里的
// cell 字符串需同步。inferLane 的判定顺序必须与 LANES 的分组保持一致。
var LANES = {
  recon: {
    label: "Recon",
    tagline: "Open ground \xB7 no noise cover",
    cells: [
      ["dawn", "clear"],
      ["dawn", "overcast"],
      ["noon", "clear"],
      ["noon", "overcast"],
    ],
    tip: "Long sightlines. Stay in cover. Move quiet.",
  },
  assault: {
    label: "Assault",
    tagline: "Rain cover \xB7 scattered fire",
    cells: [
      ["dawn", "heavyRain"],
      ["noon", "heavyRain"],
      ["dusk", "heavyRain"],
      ["midnight", "heavyRain"],
    ],
    tip: "Rain masks your steps. Lightning doesn't. Break line of sight when it flashes.",
  },
  stealth: {
    label: "Stealth",
    tagline: "Searchlight \xB7 stay dark",
    cells: [
      ["midnight", "clear"],
      ["midnight", "overcast"],
    ],
    tip: "Spotlight's up. Stay in the dark. Don't move when it passes.",
  },
  balanced: {
    label: "Balanced",
    tagline: "Standard \xB7 no extremes",
    cells: [
      ["dawn", "lightRain"],
      ["noon", "lightRain"],
      ["midnight", "lightRain"],
      ["dusk", "clear"],
      ["dusk", "overcast"],
      ["dusk", "lightRain"],
    ],
    tip: "Standard infiltration. No extremes. Move by the book.",
  },
};

var LANE_ORDER = ["recon", "assault", "stealth", "balanced"];

var TIME_TEXT = {
  dawn: "First light.",
  noon: "High sun.",
  dusk: "Last light.",
  midnight: "Dead of night.",
};

var WEATHER_TEXT = {
  clear: "Skies clear.",
  overcast: "Overcast.",
  lightRain: "Light rain.",
  heavyRain: "Heavy rain.",
};

var TIME_LABEL = {
  dawn: "Dawn",
  noon: "Noon",
  dusk: "Dusk",
  midnight: "Midnight",
};

var WEATHER_LABEL = {
  clear: "Clear",
  overcast: "Overcast",
  lightRain: "Light rain",
  heavyRain: "Heavy rain",
};

function briefText(timeOfDay, weather, laneKey) {
  let lane = LANES[laneKey];
  if (!lane) return "";
  return (
    TIME_TEXT[timeOfDay] + " " + WEATHER_TEXT[weather] + " " + lane.tip
  );
}

function profileText(timeOfDay, weather, laneKey) {
  let lane = LANES[laneKey],
    laneLabel = lane ? lane.label : "Custom";
  return (
    "Mission profile: " +
    laneLabel +
    " \xB7 " +
    (TIME_LABEL[timeOfDay] || timeOfDay) +
    " / " +
    (WEATHER_LABEL[weather] || weather)
  );
}

// 由时间/天气反推 lane（URL 直接开局、?shot / ?autostart 没有简报屏幕时用）。
// 优先级与 LANES 分组一致：heavyRain → assault；夜晴/夜阴 → stealth；
// 白天晴/阴 → recon；其余（含 dusk 全部与 lightRain）→ balanced。
function inferLane(timeOfDay, weather) {
  if (weather === "heavyRain") return "assault";
  if (
    timeOfDay === "midnight" &&
    (weather === "clear" || weather === "overcast")
  )
    return "stealth";
  if (
    (timeOfDay === "dawn" || timeOfDay === "noon") &&
    (weather === "clear" || weather === "overcast")
  )
    return "recon";
  return "balanced";
}

// 纯 CSS 卡片动画的标记（无脚本、无 GPU 开销，reduced-motion 时全部静止）。
function laneAnimMarkup(key) {
  if (key === "recon")
    return '<i class="la-sun"></i><i class="la-enemy e1"></i><i class="la-enemy e2"></i>';
  if (key === "assault")
    return '<i class="la-rain r1"></i><i class="la-rain r2"></i><i class="la-rain r3"></i>';
  if (key === "stealth")
    return '<i class="la-beam"></i><i class="la-enemy e1"></i><i class="la-enemy e2"></i>';
  return '<i class="la-enemy"></i>';
}

// ---- 简报 TTS ----------------------------------------------------------
// 浏览器硬性限制：speechSynthesis.speak() 必须在用户手势的回调链内调用，
// 否则 Chrome 等会静默忽略（不报错也不发声）。简报的 DEPLOY 点击正好满足，
// 所以只在 deployLane() 里调用，不要挪到定时器或异步回调里。
//
// getVoices() 首次常返回空数组（异步加载），因此模块级缓存 voices，
// 并监听 voiceschanged 重新收集；拿不到时退回默认语音，不阻塞部署。

var _voices = [];
var _ttsWarm = !1;

function ttsSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function collectVoices() {
  if (!ttsSupported()) return _voices;
  try {
    // 每次调用都重新问一次浏览器：getVoices() 是同步的，列表填充后立刻可见，
    // 不依赖 voiceschanged 是否触发（部分实现不派发该事件）。
    let list = window.speechSynthesis.getVoices() || [];
    if (list.length) _voices = list;
  } catch {}
  return _voices;
}

// 预热：open 时挂一次 voiceschanged，让 deployLane 时大概率已有语音列表。
// 兼容两种事件挂法：EventTarget.addEventListener（Chrome/Firefox/Safari 现状）
// 与老式 onvoiceschanged 属性（少数实现只有这个）。
function warmVoices() {
  if (_ttsWarm || !ttsSupported()) return;
  _ttsWarm = !0;
  try {
    collectVoices();
    let synth = window.speechSynthesis;
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", collectVoices);
    } else {
      synth.onvoiceschanged = collectVoices;
    }
  } catch {}
}

// 优先本地英文语音（离线也能用），其次任意英文，最后交给浏览器默认。
function pickEnglishVoice() {
  let voices = collectVoices();
  if (!voices.length) return null;
  let isEn = (v) => /^en(-|_|$)/i.test(String(v.lang || ""));
  return (
    voices.find((v) => isEn(v) && v.localService) ||
    voices.find((v) => isEn(v)) ||
    null
  );
}

// 播报一段简报。必须在用户手势内调用。
// 每次先 cancel()，避免快速 REROLL 后连点 DEPLOY 造成语音叠加。
function speakBriefing(text) {
  if (!text || !ttsSupported()) return !1;
  try {
    let synth = window.speechSynthesis;
    synth.cancel();
    let utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95; // 冷硬简报，稍慢
    utter.pitch = 0.9; // 略低沉
    utter.volume = 0.9;
    let voice = pickEnglishVoice();
    if (voice) utter.voice = voice;
    synth.speak(utter);
    return !0;
  } catch {
    return !1;
  }
}

function loadSettings() {
  let i = {
    ...DEFAULT_SETTINGS,
  };
  try {
    let e = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    e &&
      typeof e == "object" &&
      ((e.quality === "auto" || QUALITY_NAMES.includes(e.quality)) &&
        (i.quality = e.quality),
      Number.isFinite(e.sens) && (i.sens = Math.min(3, Math.max(0.2, e.sens))),
      (i.invertY = !!e.invertY),
      Number.isFinite(e.volume) &&
        (i.volume = Math.min(1, Math.max(0, e.volume))),
      Number.isFinite(e.fov) && (i.fov = Math.min(95, Math.max(60, e.fov))));
  } catch {}
  return i;
}

function saveSettings(i) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(i));
  } catch {}
}

var KEYBOARD_CONTROLS_HTML = `
  <dl class="keys">
    <div><dt>Move</dt><dd><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dd></div>
    <div><dt>Look</dt><dd>Mouse</dd></div>
    <div><dt>Fire</dt><dd>Left button</dd></div>
    <div><dt>Aim</dt><dd>Right button</dd></div>
    <div><dt>Reload</dt><dd><kbd>R</kbd></dd></div>
    <div><dt>Cut relay</dt><dd>Hold <kbd>E</kbd></dd></div>
    <div><dt>Jump</dt><dd><kbd>Space</kbd></dd></div>
    <div><dt>Sprint</dt><dd><kbd>Shift</kbd></dd></div>
    <div><dt>Crouch</dt><dd><kbd>C</kbd> or <kbd>Ctrl</kbd></dd></div>
    <div><dt>Melee</dt><dd><kbd>F</kbd></dd></div>
    <div><dt>Pause</dt><dd><kbd>Esc</kbd> or <kbd>P</kbd></dd></div>
  </dl>`;

var TOUCH_CONTROLS_HTML = `
  <dl class="keys">
    <div><dt>Move</dt><dd>Left thumb, anywhere</dd></div>
    <div><dt>Look</dt><dd>Drag the right side</dd></div>
    <div><dt>Fire</dt><dd>Hold FIRE, drag to track</dd></div>
    <div><dt>Aim</dt><dd>AIM toggles</dd></div>
    <div><dt>Reload</dt><dd>RLD</dd></div>
    <div><dt>Jump</dt><dd>JUMP</dd></div>
    <div><dt>Cut relay</dt><dd>Hold USE at a relay</dd></div>
    <div><dt>Sprint</dt><dd>Push the stick fully forward</dd></div>
  </dl>`;

function createMenus(context, e) {
  let t = document.getElementById("ui"),
    n = loadSettings(),
    s = document.createElement("div");
  ((s.className = "menu"),
    (s.dataset.screen = "none"),
    (s.innerHTML = `
    <div class="m-veil"></div>
    <div class="m-bars"><i></i><i></i></div>

    <section class="m-screen m-title" data-s="title" aria-label="Saltline">
      <div class="m-title-main">
        <div class="m-eyebrow"><span class="m-tag">B4</span><span>Port Authority Breach Unit</span><span class="m-dim">Saltline Terminal \xB7 05:42</span></div>
        <h1 class="m-word">SALTLINE</h1>
        <p class="m-premise">The port\u2019s security net has gone feral. Cut its three uplinks. Reach the boat.</p>
        <div class="m-actions">
          <button class="btn primary" data-act="deploy">Deploy</button>
          <button class="btn" data-act="settings">Settings</button>
          <button class="btn m-only-narrow" data-act="controls">Controls</button>
        </div>
        <p class="m-note">Every surface, machine and sound is generated in your browser. Nothing is downloaded.</p>
      </div>
      <aside class="m-legend" aria-label="Controls at a glance">
        <div><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span><span><kbd>Mouse</kbd> Look</span><span><kbd>LMB</kbd> Fire</span><span><kbd>RMB</kbd> Aim</span><span><kbd>R</kbd> Reload</span></div>
        <div><span><kbd>E</kbd> Cut relay</span><span><kbd>Space</kbd> Jump</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>C</kbd> Crouch</span><span><kbd>Esc</kbd> Pause</span></div>
        <div class="lg-touch"><em>Touch</em><span>Left thumb moves</span><span>Right thumb looks</span><span>Fire \xB7 Aim \xB7 Reload \xB7 Jump on screen</span></div>
      </aside>
    </section>

    <section class="m-screen m-card" data-s="paused" aria-label="Paused">
      <div class="m-k">Operation on hold</div>
      <h2 class="m-h">Paused</h2>
      <p class="m-line" data-f="profile"></p>
      <p class="m-line" data-f="lookmode"></p>
      <div class="m-actions col">
        <button class="btn primary" data-act="resume">Resume</button>
        <button class="btn" data-act="settings">Settings</button>
        <button class="btn" data-act="controls">Controls</button>
        <button class="btn" data-act="restart">Restart mission</button>
      </div>
    </section>

    <section class="m-screen m-card m-dead" data-s="dead" aria-label="Signal lost">
      <div class="m-k">Breacher down</div>
      <h2 class="m-h">Signal lost</h2>
      <dl class="m-stats"><div><dt>Time survived</dt><dd data-f="dead-time">00:00</dd></div><div><dt>Relays cut</dt><dd data-f="dead-relays">0/3</dd></div></dl>
      <div class="m-actions col"><button class="btn primary" data-act="retry">Retry</button></div>
    </section>

    <section class="m-screen m-card m-debrief" data-s="complete" aria-label="Debrief">
      <div class="m-k">Berth 4 \xB7 Debrief</div>
      <h2 class="m-h">Saltline is dark</h2>
      <div class="m-rating"><span>Rating</span><b data-f="rating">Clean</b></div>
      <dl class="m-stats">
        <div><dt>Time</dt><dd data-f="time">00:00</dd></div>
        <div><dt>Accuracy</dt><dd data-f="acc">0%</dd></div>
        <div><dt>Machines destroyed</dt><dd data-f="kills">0</dd></div>
        <div><dt>Retries</dt><dd data-f="retries">0</dd></div>
      </dl>
      <div class="m-actions col"><button class="btn primary" data-act="redeploy">Redeploy</button></div>
    </section>

    <section class="m-screen m-briefing" data-s="briefing" aria-label="Mission profile">
      <div class="mb-head">
        <div class="m-k">Mission profile</div>
        <h2 class="mb-h">Choose your insertion</h2>
      </div>
      <div class="mb-grid">
        ${LANE_ORDER.map((key) => {
          let l = LANES[key];
          return `
          <button class="lane-btn" data-lane="${key}" aria-pressed="false">
            <div class="lane-anim lane-${key}" aria-hidden="true">${laneAnimMarkup(key)}</div>
            <b>${l.label}</b>
            <span>${l.tagline}</span>
          </button>`;
        }).join("")}
      </div>
      <div class="mb-brief" aria-live="polite">
        <p class="mb-brief-text"></p>
      </div>
      <div class="mb-actions">
        <button class="btn" data-act="reroll" disabled>Reroll</button>
        <button class="btn primary" data-act="deploy-lane" disabled>Deploy</button>
      </div>
    </section>

    <div class="panel" role="dialog" aria-modal="true" aria-label="Settings and controls" tabindex="-1" hidden>
      <header class="panel-h">
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" data-tab="settings" aria-selected="true">Settings</button>
          <button class="tab" role="tab" data-tab="controls" aria-selected="false">Controls</button>
        </div>
        <button class="btn small" data-act="close-panel">Close</button>
      </header>
      <div class="panel-b" data-pane="settings">
        <div class="row"><label id="l-q">Graphics quality</label>
          <div class="seg" role="group" aria-labelledby="l-q">${QUALITY_NAMES.map((U) => `<button data-q="${U}" aria-pressed="false">${U}</button>`).join("")}</div></div>
        <div class="row"><label for="s-sens">Mouse sensitivity</label><div class="slider"><input id="s-sens" type="range" min="0.2" max="3" step="0.05"><output data-o="sens"></output></div></div>
        <div class="row"><label id="l-inv">Invert Y</label><button class="toggle" data-act="invert" aria-labelledby="l-inv" aria-pressed="false"><i></i><span>Off</span></button></div>
        <div class="row"><label for="s-vol">Master volume</label><div class="slider"><input id="s-vol" type="range" min="0" max="100" step="1"><output data-o="vol"></output></div></div>
        <div class="row"><label for="s-fov">Field of view</label><div class="slider"><input id="s-fov" type="range" min="60" max="95" step="1"><output data-o="fov"></output></div></div>
        <div class="row" data-row="fs"><label id="l-fs">Display</label><button class="btn small" data-act="fullscreen" aria-labelledby="l-fs fs-t"><span id="fs-t">Enter fullscreen</span></button></div>
        <p class="panel-note" data-f="qnote"></p>
      </div>
      <div class="panel-b" data-pane="controls" hidden>
        <h3>Keyboard \xB7 Mouse</h3>${KEYBOARD_CONTROLS_HTML}
        <p class="panel-note">If the browser will not capture the mouse, hold a mouse button and drag to look (left also fires, right also aims). Arrow keys or <kbd>I</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd> turn, <kbd>Enter</kbd> fires.</p>
        <h3>Touch</h3>${TOUCH_CONTROLS_HTML}
        <h3>Gamepad</h3>
        <p class="panel-note">Sticks move and look \xB7 RT fire \xB7 LT aim \xB7 A jump \xB7 B crouch \xB7 X reload \xB7 Y cut relay \xB7 L3 sprint \xB7 Start pause.</p>
      </div>
    </div>

    <div class="loc-card" aria-hidden="true"><i></i><b>Saltline Terminal \xB7 Berth 4 \xB7 05:42</b><span>Port Authority Breach Unit \u2014 one breacher, no backup</span></div>
  `),
    t.appendChild(s));
  let o = (U) => s.querySelector(U),
    r = (U) => [...s.querySelectorAll(U)],
    a = o(".panel"),
    l = o(".loc-card"),
    c = (U) => s.querySelector(`[data-f="${U}"]`),
    u = o("#s-sens"),
    h = o("#s-vol"),
    f = o("#s-fov"),
    p = "none",
    d = null;
  function v(U) {
    // 注意：不处理 timeOfDay/weather——环境由简报屏幕在部署前决定，
    // 不写入 settings、不持久化。
    if (
      ((!U || U === "sens") && (context.input.sensitivity = n.sens),
      (!U || U === "invertY") && (context.input.invertY = n.invertY),
      !U || U === "volume")
    )
      try {
        context.audio &&
          context.audio.setVolume &&
          context.audio.setVolume(n.volume);
      } catch (T) {
        console.error(T);
      }
    if (
      ((!U || U === "fov") &&
        context.player &&
        context.player.setFov &&
        context.player.setFov(n.fov),
      U === "quality" ||
        (!U &&
          n.quality !== "auto" &&
          !context.params.shot &&
          !context.params.q &&
          n.quality !== (context.quality && context.quality.name)))
    ) {
      let T = QUALITY_PRESETS[n.quality];
      if (T)
        try {
          context.render && context.render.setQuality
            ? context.render.setQuality({
                ...T,
              })
            : (context.quality = {
                ...T,
              });
        } catch (D) {
          console.error("[game] setQuality failed", D);
        }
    }
  }
  function g() {
    let U =
      n.quality === "auto"
        ? context.quality && context.quality.name
        : n.quality;
    for (let D of r(".seg button"))
      D.setAttribute("aria-pressed", String(D.dataset.q === U));
    ((u.value = n.sens),
      (h.value = Math.round(n.volume * 100)),
      (f.value = n.fov),
      (o('[data-o="sens"]').textContent = n.sens.toFixed(2) + "\xD7"),
      (o('[data-o="vol"]').textContent = Math.round(n.volume * 100) + "%"),
      (o('[data-o="fov"]').textContent = Math.round(n.fov) + "\xB0"));
    let T = o('[data-act="invert"]');
    (T.setAttribute("aria-pressed", String(n.invertY)),
      (T.querySelector("span").textContent = n.invertY ? "On" : "Off"),
      (c("qnote").textContent =
        n.quality === "auto"
          ? `Quality was picked for this device (${U || "default"}). Lower it if the frame rate struggles.`
          : "Quality changes apply at once; shadows and reflections may take a moment to rebuild."));
  }
  (u.addEventListener("input", () => {
    ((n.sens = +u.value), v("sens"), g(), saveSettings(n));
  }),
    h.addEventListener("input", () => {
      ((n.volume = +h.value / 100), v("volume"), g(), saveSettings(n));
    }),
    f.addEventListener("input", () => {
      ((n.fov = +f.value), v("fov"), g(), saveSettings(n));
    }));
    // M5：时间/天气改为简报屏幕选择。游戏内不再提供下拉，
    // 环境切换只发生在部署前（或控制台调试），避免战斗中重烘焙打断。
    // briefingEnabled：带任何 URL 环境/自动化参数时跳过简报，直接开局。
  let briefingEnabled = !(
      context.params &&
      (context.params.time ||
        context.params.weather ||
        context.params.shot ||
        context.params.autostart)
    ),
    briefing = { lane: null, cell: null };
  let briefingScenes = createBriefingScenes(context);

  function pickCell(laneKey) {
    let cells = LANES[laneKey].cells;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function renderBriefing() {
    let text = o(".mb-brief-text");
    if (!text) return;
    text.textContent =
      briefing.lane && briefing.cell
        ? briefText(briefing.cell[0], briefing.cell[1], briefing.lane)
        : "";
  }

  function syncLaneButtons() {
    for (let b of r(".lane-btn")) {
      b.setAttribute("aria-pressed", String(b.dataset.lane === briefing.lane));
    }
  }

  function syncBriefingActions() {
    let rr = o('[data-act="reroll"]'),
      dp = o('[data-act="deploy-lane"]');
    if (rr) rr.disabled = !briefing.lane;
    if (dp) dp.disabled = !(briefing.lane && briefing.cell);
  }

  function selectLane(laneKey) {
    if (!LANES[laneKey]) return;
    ((briefing.lane = laneKey),
      (briefing.cell = pickCell(laneKey)),
      syncLaneButtons(),
      renderBriefing(),
      syncBriefingActions());
  }

  function rerollLane() {
    if (!briefing.lane) return;
    ((briefing.cell = pickCell(briefing.lane)), renderBriefing());
  }

  function showBriefing() {
    // 预热语音列表：open 时挂 voiceschanged，deployLane 时大概率已能选到英文语音。
    warmVoices();
    ((briefing.lane = null),
      (briefing.cell = null),
      syncLaneButtons(),
      renderBriefing(),
      syncBriefingActions(),
      // 直接操作 DOM 而非 q.show("briefing")：这些函数定义在 q 之前，
      // 虽然调用时 q 已存在，但显式写等价语句更稳。S() 会关掉设置面板，
      // 面板关闭时退回 H() 聚焦——所以先设 p 再调 S()。
      (p = "briefing"),
      s.classList.add("open"),
      (s.dataset.screen = "briefing"),
      S());
    let first = o(".lane-btn");
    if (first)
      try {
        first.focus({
          preventScroll: !0,
        });
      } catch {}
    // 挂载 Three.js 小场景；失败则保留 CSS keyframes 降级
    try {
      briefingScenes.mount(o(".mb-grid"));
    } catch (err) {
      console.warn("[briefing] Three.js scenes unavailable: " + err);
    }
  }

  function deployLane() {
    if (!briefing.lane || !briefing.cell) return;
    try {
      briefingScenes.unmount();
    } catch {}
    let cell = briefing.cell;
    // TTS 必须在这一层（click 回调链）里同步发起，满足浏览器用户手势要求；
    // 一旦挪到 setTimeout / promise / flow.start 之后的异步回调，Chrome 会静默忽略。
    speakBriefing(briefText(cell[0], cell[1], briefing.lane));
    // 不在菜单里写 environment：flow.start(payload) 统一处理，
    // 保证「设置环境」与「开局」只有一处、顺序固定。
    (context.events.emit("ui:click", {}),
      e.deploy &&
        e.deploy({
          lane: briefing.lane,
          timeOfDay: cell[0],
          weather: cell[1],
        }));
  }
  let x = o('[data-row="fs"]'),
    y = o("#fs-t"),
    b = () =>
      document.fullscreenElement || document.webkitFullscreenElement || null,
    m = document.getElementById("app") || document.documentElement;
  (m &&
    (m.requestFullscreen || m.webkitRequestFullscreen) &&
    document.fullscreenEnabled !== !1 &&
    document.webkitFullscreenEnabled !== !1) ||
    (x.hidden = !0);
  function _() {
    y.textContent = "Fullscreen is not available here";
  }
  function M() {
    try {
      if (b()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(
          document,
        );
        return;
      }
      let U = (m.requestFullscreen || m.webkitRequestFullscreen).call(m);
      U && U.catch && U.catch(_);
    } catch {
      _();
    }
  }
  let E = () => {
    y.textContent = b() ? "Exit fullscreen" : "Enter fullscreen";
  };
  (document.addEventListener("fullscreenchange", E),
    document.addEventListener("webkitfullscreenchange", E));
  function w(U) {
    ((d = document.activeElement),
      (a.hidden = !1),
      s.classList.add("panel-open"),
      z(U || "settings"));
    try {
      a.focus({
        preventScroll: !0,
      });
    } catch {}
  }
  function S() {
    return a.hidden
      ? !1
      : ((a.hidden = !0),
        s.classList.remove("panel-open"),
        d && d.focus && s.contains(d) ? d.focus() : H(),
        !0);
  }
  function z(U) {
    for (let T of r(".tab"))
      T.setAttribute("aria-selected", String(T.dataset.tab === U));
    for (let T of r(".panel-b")) T.hidden = T.dataset.pane !== U;
  }
  function H() {
    let U = s.querySelector(`.m-screen[data-s="${p}"] .btn.primary`);
    if (U)
      try {
        U.focus({
          preventScroll: !0,
        });
      } catch {}
  }
  (s.addEventListener("click", (U) => {
    let T = U.target.closest("button");
    if (!T || !s.contains(T)) return;
    if ((context.events.emit("ui:click", {}), T.dataset.q)) {
      ((n.quality = T.dataset.q), v("quality"), g(), saveSettings(n));
      return;
    }
    if (T.dataset.tab) {
      z(T.dataset.tab);
      return;
    }
    // 简报屏幕的 lane 卡片：不在 m-actions 里，没有 data-act，单独处理。
    if (T.dataset.lane && p === "briefing") {
      selectLane(T.dataset.lane);
      return;
    }
    let D = T.dataset.act;
    D === "deploy"
      ? briefingEnabled
        ? showBriefing()
        : e.deploy && e.deploy()
      : D === "reroll"
        ? rerollLane()
        : D === "deploy-lane"
          ? deployLane()
          : D === "settings"
            ? w("settings")
            : D === "controls"
              ? w("controls")
              : D === "close-panel"
                ? S()
                : D === "invert"
                  ? ((n.invertY = !n.invertY),
                    v("invertY"),
                    g(),
                    saveSettings(n))
                  : D === "fullscreen"
                    ? M()
                    : D && e[D] && e[D](U);
  }),
    s.addEventListener("mouseover", (U) => {
      let T = U.target.closest("button");
      T &&
        U.relatedTarget &&
        !T.contains(U.relatedTarget) &&
        context.events.emit("ui:hover", {});
    }),
    s.addEventListener("keydown", (U) => {
      // Escape 不关闭简报屏幕：必须选一条 lane 才能开局（强制选择）。
      if (
        (U.code === "Escape" &&
          !a.hidden &&
          (S(), U.stopPropagation(), U.preventDefault()),
        U.code === "Tab" && !a.hidden)
      ) {
        let T = [...a.querySelectorAll("button, input")].filter(
          (G) => G.offsetParent !== null,
        );
        if (!T.length) return;
        let D = T[0],
          C = T[T.length - 1];
        U.shiftKey && document.activeElement === D
          ? (C.focus(), U.preventDefault())
          : !U.shiftKey &&
            document.activeElement === C &&
            (D.focus(), U.preventDefault());
      } else if (U.code === "Tab" && p === "briefing") {
        // 简报屏幕的 Tab 只在卡片与两个按钮之间循环（跳过 disabled）。
        let T = [...r(".lane-btn"), o('[data-act="reroll"]'), o('[data-act="deploy-lane"]')].filter(
          (G) => G && !G.disabled,
        );
        if (!T.length) return;
        let D = T[0],
          C = T[T.length - 1];
        U.shiftKey && document.activeElement === D
          ? (C.focus(), U.preventDefault())
          : !U.shiftKey &&
            document.activeElement === C &&
            (D.focus(), U.preventDefault());
      }
    }));
  let O = (U) => (
      (U = Math.max(0, Math.floor(U))),
      String(Math.floor(U / 60)).padStart(2, "0") +
        ":" +
        String(U % 60).padStart(2, "0")
    ),
    q = {
      root: s,
      settings: n,
      fmtTime: O,
      get screen() {
        return p;
      },
      get panelOpen() {
        return !a.hidden;
      },
      closePanel: S,
      get briefingEnabled() {
        return briefingEnabled;
      },
      get briefing() {
        return briefing;
      },
      showBriefing,
      // flow.js 在 pause() 时写入暂停卡顶部的任务配置行。
      setProfile(U) {
        let T = c("profile");
        if (T) T.textContent = U || "";
      },
      show(U) {
        U !== p &&
          ((p = U),
          (s.dataset.screen = U),
          S(),
          s.classList.toggle("open", U !== "none"),
          U !== "briefing" && briefingScenes.unmount(),
          U !== "none"
            ? U === "briefing"
              ? setTimeout(() => {
                  let T = o(".lane-btn");
                  if (T)
                    try {
                      T.focus({
                        preventScroll: !0,
                      });
                    } catch {}
                }, 30)
              : (g(), setTimeout(H, 30))
            : document.activeElement &&
              s.contains(document.activeElement) &&
              document.activeElement.blur());
      },
      locationCard(U) {
        l.classList.toggle("on", !!U);
      },
      setLookMode(U) {
        c("lookmode").textContent = U || "";
      },
      setDead({ time: U, relays: T, total: D }) {
        ((c("dead-time").textContent = O(U)),
          (c("dead-relays").textContent = `${T}/${D}`));
      },
      setDebrief({ time: U, accuracy: T, kills: D, retries: C, rating: G }) {
        ((c("time").textContent = O(U)),
          (c("acc").textContent =
            T == null ? "\u2014" : Math.round(T * 100) + "%"),
          (c("kills").textContent = String(D)),
          (c("retries").textContent = String(C)),
          (c("rating").textContent = G));
      },
      applySettings: v,
    };
  return (g(), q);
}

export {
  createMenus,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  QUALITY_NAMES,
  KEYBOARD_CONTROLS_HTML,
  TOUCH_CONTROLS_HTML,
  LANES,
  LANE_ORDER,
  briefText,
  profileText,
  inferLane,
  speakBriefing,
  ttsSupported,
};
