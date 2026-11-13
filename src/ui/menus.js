// DOM menus, persisted settings and controls panels.
import { PLAYER_DIMENSIONS, QUALITY_PRESETS } from "../core/config.js";

var SETTINGS_KEY = "saltline.settings.v1";

var DEFAULT_SETTINGS = {
  quality: "auto",
  sens: 1,
  invertY: !1,
  volume: 0.8,
  fov: PLAYER_DIMENSIONS.fov,
};

var QUALITY_NAMES = ["low", "medium", "high", "ultra"];

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
        <div class="row"><label for="s-env-time">Time of day</label><select id="s-env-time" class="sel" data-env="timeOfDay"><option value="dawn">Dawn</option><option value="noon">Noon</option><option value="dusk">Dusk</option><option value="midnight">Midnight</option></select></div>
        <div class="row"><label for="s-env-weather">Weather</label><select id="s-env-weather" class="sel" data-env="weather"><option value="clear">Clear</option><option value="overcast">Overcast</option><option value="lightRain">Light rain</option><option value="heavyRain">Heavy rain</option></select></div>
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
    // 注意：不处理 timeOfDay/weather——环境状态不持久化，由 createMenus 内的
    // syncEnvSelects 与 environment:changed 独立管理。
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
    // M2：时间/天气下拉。从 environment 读当前值，不写 settings，不持久化。
  let envTimeSel = o('select[data-env="timeOfDay"]'),
    envWeatherSel = o('select[data-env="weather"]');
  function syncEnvSelects() {
    if (!context.environment) return;
    if (envTimeSel && context.environment.timeOfDay) {
      envTimeSel.value = context.environment.timeOfDay;
    }
    if (envWeatherSel && context.environment.weather) {
      envWeatherSel.value = context.environment.weather;
    }
  }
  if (envTimeSel) {
    envTimeSel.addEventListener("change", () => {
      if (!context.environment) return;
      context.environment.setTimeOfDay(envTimeSel.value);
      context.events.emit("ui:click", {});
    });
  }
  if (envWeatherSel) {
    envWeatherSel.addEventListener("change", () => {
      if (!context.environment) return;
      context.environment.setWeather(envWeatherSel.value);
      context.events.emit("ui:click", {});
    });
  }
  context.events.on("environment:changed", syncEnvSelects);
  syncEnvSelects();
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
    let D = T.dataset.act;
    D === "settings"
      ? w("settings")
      : D === "controls"
        ? w("controls")
        : D === "close-panel"
          ? S()
          : D === "invert"
            ? ((n.invertY = !n.invertY), v("invertY"), g(), saveSettings(n))
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
      if (
        (U.code === "Escape" &&
          !a.hidden &&
          (S(), U.stopPropagation(), U.preventDefault()),
        U.code === "Tab" && !a.hidden)
      ) {
        let T = [...a.querySelectorAll("button, input, select")].filter(
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
      show(U) {
        U !== p &&
          ((p = U),
          (s.dataset.screen = U),
          S(),
          s.classList.toggle("open", U !== "none"),
          U !== "none"
            ? (g(), setTimeout(H, 30))
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
};
