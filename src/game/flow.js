// Mission progression, relay objectives, waves, extraction and game states.
import { Vector3 } from "../vendor/three-r180.js";
import { clamp, damp, saturate, smoothstep } from "../core/math.js";
import { createMenus } from "../ui/menus.js";

var GAME_FLOW = {
  introSeconds: 3.5,
  retryIntroSeconds: 1.3,
  interactRange: 2.2,
  interactFacing: 0.45,
  cutSeconds: 2.4,
  patrol: {
    gull: 2,
    hound: 1,
  },
  waves: [
    {
      gull: 3,
      hound: 1,
    },
    {
      gull: 3,
      hound: 2,
    },
    {
      gull: 4,
      hound: 3,
    },
  ],
  maxAlive: 9,
  spawnStagger: 0.85,
  spawnFar: 18,
  pursuitEvery: 7,
  pursuitMinAlive: 4,
  pursuitExtra: 5,
  titleSpeed: 1.15,
  titleFov: 50,
};

var jC = [
  "NORTH",
  "NORTH-EAST",
  "EAST",
  "SOUTH-EAST",
  "SOUTH",
  "SOUTH-WEST",
  "WEST",
  "NORTH-WEST",
];

var _l = {
  intro:
    "Breacher, this is Control. The Harbormaster holds the berth. Cut its three uplinks \u2014 yard, shed, quay.",
  contact: "It has seen you. Gulls fly, Hounds walk. Put them down.",
  cut: [
    "One relay dark. It felt that \u2014 machines inbound.",
    "Two dark. It is throwing everything it has left at you.",
  ],
  all: "All three dark. The boat is holding at the quay ladder, south end. Run.",
  low: "You are hit hard. Get behind steel and breathe.",
  done: "Breacher is aboard. Saltline is dark. Good work.",
};

function createGameFlow(context) {
  let e = (context.render && context.render.post) || {},
    t = typeof e.saturation == "number" ? e.saturation : 1,
    n = context.player,
    s = context.level,
    o = context.hud,
    r = context.input,
    a = (P, V, ...Y) => {
      try {
        if (P && typeof P[V] == "function") return P[V](...Y);
      } catch (L) {
        console.error(`[game] ${V} threw`, L);
      }
    },
    l = createMenus(context, {
      deploy() {
        (a(context.audio, "resume"), r.requestLock(), U({}));
      },
      resume() {
        j(!0);
      },
      restart() {
        (a(context.audio, "resume"),
          r.requestLock(),
          c.retries++,
          U({
            quick: !0,
            keepRetries: !0,
          }));
      },
      retry() {
        (a(context.audio, "resume"),
          r.requestLock(),
          c.retries++,
          U({
            quick: !0,
            keepRetries: !0,
          }));
      },
      redeploy() {
        (a(context.audio, "resume"),
          r.requestLock(),
          U({
            quick: !0,
          }));
      },
    });
  l.applySettings();
  let c = {
      time: 0,
      retries: 0,
      relays: [],
      cut: 0,
      allCut: !1,
      queue: [],
      waveHot: 0,
      alertT: 0,
      pursuitT: 0,
      pursuitLeft: 0,
      contactSaid: !1,
      lowSaid: !1,
      extractHint: 0,
      intensity: 0.15,
      used: new Map(),
    },
    u = 0,
    h = GAME_FLOW.introSeconds,
    f = !1,
    p = !1,
    d = 0,
    v = 0,
    g = !1,
    x = "",
    y = 0.8,
    b = new Vector3(),
    m = new Vector3(),
    A = () => (s && s.objectives) || [],
    _ = {
      state: "title",
      flow: GAME_FLOW,
      run: c,
      menus: l,
      start(P = {}) {
        U({
          skipIntro: !!P.skipIntro,
          quick: !!P.quick,
        });
      },
      pause() {
        G();
      },
      resume() {
        j(!1);
      },
      update: B,
      debugCut() {
        let P = c.relays.find((V) => !V.cut);
        P && me(P);
      },
    };
  function M(P) {
    let V = _.state;
    P !== V &&
      ((_.state = P),
      (u = 0),
      context.events.emit("game:state", {
        state: P,
        prev: V,
      }));
  }
  let E = {
    pos: [],
    look: [],
    len: 1,
    t: 0,
  };
  function w() {
    let P = (s && s.cinematicPath) || [];
    if (
      ((E.pos = P.map((Y) => new Vector3(...Y.pos))),
      (E.look = P.map((Y) => new Vector3(...Y.look))),
      E.pos.length < 2)
    ) {
      let Y = (s && s.playerStart && s.playerStart.pos) || new Vector3();
      ((E.pos = [new Vector3(Y.x, 2.2, Y.z), new Vector3(Y.x + 8, 2, Y.z)]),
        (E.look = [
          new Vector3(Y.x + 30, 2.5, Y.z - 2),
          new Vector3(Y.x + 40, 3, Y.z - 2),
        ]));
    }
    let V = 0;
    for (let Y = 1; Y < E.pos.length; Y++)
      V += E.pos[Y].distanceTo(E.pos[Y - 1]);
    E.len = Math.max(V, 4);
  }
  function S(P, V, Y) {
    let L = P.length - 1,
      Z = clamp(V, 0, 1) * L,
      J = Math.min(L - 1, Math.floor(Z)),
      oe = Z - J,
      fe = P[Math.max(0, J - 1)],
      le = P[J],
      R = P[J + 1],
      I = P[Math.min(L, J + 2)],
      se = oe * oe,
      ae = se * oe,
      k = (ce, ve, _e, Te) =>
        0.5 *
        (2 * ve +
          (-ce + _e) * oe +
          (2 * ce - 5 * ve + 4 * _e - Te) * se +
          (-ce + 3 * ve - 3 * _e + Te) * ae);
    return Y.set(
      k(fe.x, le.x, R.x, I.x),
      k(fe.y, le.y, R.y, I.y),
      k(fe.z, le.z, R.z, I.z),
    );
  }
  function z(P) {
    let V = Math.max(26, E.len / GAME_FLOW.titleSpeed);
    ((E.t += P), E.t >= V && (E.t = 0));
    let Y = E.t / V,
      L = Y * Y * (3 - 2 * Y) * 0.25 + Y * 0.75,
      Z = context.camera,
      J = context.time.t;
    (S(E.pos, L, b),
      S(E.look, L, m),
      (b.x += Math.sin(J * 0.31) * 0.05),
      (b.y += Math.sin(J * 0.43 + 1.7) * 0.035),
      (b.z += Math.sin(J * 0.27 + 0.6) * 0.05),
      (m.y += Math.sin(J * 0.19) * 0.12),
      (m.x += Math.sin(J * 0.13 + 2) * 0.2),
      Z.position.copy(b),
      Z.lookAt(m),
      (Z.rotation.z += Math.sin(J * 0.21) * 0.006),
      !context.params.fov &&
        Math.abs(Z.fov - GAME_FLOW.titleFov) > 0.01 &&
        ((Z.fov = GAME_FLOW.titleFov), Z.updateProjectionMatrix()),
      (e.fade = Math.max(
        1 - smoothstep(0, 1.8, E.t),
        smoothstep(V - 1.6, V, E.t),
      )));
  }
  function H() {
    (a(context.enemies, "clear"),
      a(context.fx, "clear"),
      a(context.combat, "reset"),
      a(context.weapon, "reset"),
      (c.time = 0),
      (c.cut = 0),
      (c.allCut = !1),
      (c.queue.length = 0),
      (c.waveHot = 0),
      (c.alertT = 0),
      (c.pursuitT = 0),
      (c.pursuitLeft = 0),
      (c.contactSaid = !1),
      (c.lowSaid = !1),
      (c.extractHint = 0),
      c.used.clear(),
      (c.relays = A().map((P, V) => {
        let Y = (/([a-z0-9])$/i.exec(String(P.id || "")) || [
          0,
          String.fromCharCode(65 + V),
        ])[1].toUpperCase();
        return (
          O(P, "live"),
          {
            o: P,
            id: P.id || "relay_" + V,
            short: Y,
            t: 0,
            cut: !1,
            cutting: !1,
          }
        );
      })),
      n.reset(s.playerStart),
      o.reset && o.reset(),
      (e.saturation = t),
      (e.flash = 0),
      q(),
      o.setRelays && o.setRelays(0, c.relays.length),
      ie());
  }
  function O(P, V) {
    try {
      let Y = P && P.object && P.object.userData;
      Y && typeof Y.setState == "function" && Y.setState(V);
    } catch (Y) {
      console.error("[game] relay setState threw", Y);
    }
  }
  function q() {
    if (!o.setMarkers) return;
    let P = c.relays
      .filter((V) => !V.cut)
      .map((V) => ({
        id: V.id,
        short: V.short,
        label: V.o.label || "Relay " + V.short,
        pos: V.o.pos,
        kind: "relay",
      }));
    (c.allCut &&
      s.extraction &&
      P.push({
        id: "extract",
        short: "EX",
        label: "Boat",
        pos: s.extraction.pos,
        kind: "extract",
      }),
      o.setMarkers(P));
  }
  function U({ skipIntro: P = !1, quick: V = !1, keepRetries: Y = !1 } = {}) {
    if (
      (Y || (c.retries = 0),
      l.show("none"),
      l.locationCard(!1),
      a(context.audio, "setPaused", !1),
      H(),
      a(context.weapon, "setVisible", !0),
      (g = !1),
      P)
    ) {
      ((e.fade = 0), T());
      return;
    }
    ((h = V ? GAME_FLOW.retryIntroSeconds : GAME_FLOW.introSeconds),
      (f = V),
      (p = V),
      (n.enabled = !1),
      r.setGameplay && r.setGameplay(!1),
      o.show(!1),
      (e.fade = 1),
      a(context.audio, "setIntensity", 0.15),
      M("intro"));
  }
  function T() {
    ((n.enabled = !0),
      o.show(!0),
      r.setGameplay && r.setGameplay(!0),
      o.setObjective(D()),
      M("playing"),
      C(!0));
  }
  function D() {
    if (c.allCut) return "Get to the boat";
    let P = c.relays.length - c.cut;
    return c.cut === 0
      ? "Cut the three uplink relays"
      : P === 1
        ? "Cut the last relay"
        : `Cut the remaining ${P} relays`;
  }
  function C(P) {
    let V = r.describeMode ? r.describeMode() : "";
    (l.setLookMode(V),
      !(!P && V === x) &&
        ((x = V),
        _.state === "playing" &&
        (r.mode === "drag" ||
          (r.mode === "lock" &&
            !r.locked &&
            !context.params.shot &&
            !context.params.autostart))
          ? o.message(V, r.mode === "drag" ? 7 : 4)
          : _.state === "playing" && r.locked && o.message("", 0)));
  }
  (r.onModeChange && r.onModeChange(() => C(!1)),
    context.events.on("input:lock", (P) => {
      if (P.locked) {
        ((g = !0), C(!1));
        return;
      }
      (_.state === "playing" && g && G(), (g = !1));
    }),
    document.addEventListener("visibilitychange", () => {
      document.hidden && _.state === "playing" && G();
    }),
    addEventListener("keydown", (P) => {
      _.state !== "title" ||
        l.panelOpen ||
        (P.code !== "Enter" && P.code !== "NumpadEnter") ||
        (P.target && P.target.tagName === "BUTTON") ||
        (a(context.audio, "resume"), r.requestLock(), U({}));
    }));
  function G() {
    _.state === "playing" &&
      (r.setGameplay && r.setGameplay(!1),
      r.exitLock(),
      a(context.audio, "setPaused", !0),
      l.setLookMode(
        r.mode === "drag"
          ? r.describeMode()
          : r.touch
            ? ""
            : "Resume recaptures the mouse.",
      ),
      o.show(!1),
      l.show("paused"),
      (d = 0.35),
      M("paused"));
  }
  function j(P) {
    _.state === "paused" &&
      (l.show("none"),
      a(context.audio, "setPaused", !1),
      o.show(!0),
      r.setGameplay && r.setGameplay(!0),
      (g = !1),
      r.requestLock(),
      M("playing"),
      setTimeout(() => C(!0), 700));
  }
  function N(P) {
    let V = P === "gull" ? "air" : "ground",
      Y = (s && s.enemySpawns) || [],
      L = Y.filter((Z) => Z.type === V);
    return L.length ? L : Y;
  }
  function Q(
    P,
    {
      minDist: V = GAME_FLOW.spawnFar,
      from: Y = n.pos,
      preferHidden: L = !0,
    } = {},
  ) {
    let Z = N(P),
      J = null,
      oe = -1e9;
    for (let le of Z) {
      let R = Math.hypot(le.pos.x - Y.x, le.pos.z - Y.z),
        I = context.rng() * 1.5;
      if (
        ((I += R >= V ? 2 + Math.min(1, (R - V) / 30) * 0.5 : -(V - R) / 4), L)
      ) {
        (b.copy(le.pos), (b.y += P === "gull" ? 0 : 1));
        let ae = !0;
        try {
          ae = context.physics.lineOfSight(b, n.eye);
        } catch {}
        ae || (I += 2.5);
      }
      let se = c.used.get(le);
      (se !== void 0 && c.time - se < 6 && (I -= 3),
        I > oe && ((oe = I), (J = le)));
    }
    let fe = new Vector3();
    if (J) {
      (c.used.set(J, c.time), fe.copy(J.pos));
      let le = (context.rng() - 0.5) * 2.4,
        R = (context.rng() - 0.5) * 2.4,
        I = P === "gull";
      try {
        I || (I = context.physics.nav.isWalkable(fe.x + le, fe.z + R));
      } catch {
        I = !1;
      }
      I && ((fe.x += le), (fe.z += R));
    } else {
      let le = context.rng() * Math.PI * 2;
      fe.set(
        clamp(Y.x + Math.cos(le) * 26, -34, 26),
        0,
        clamp(Y.z + Math.sin(le) * 26, -26, 24),
      );
    }
    return (P === "gull" && fe.y < 2.5 && (fe.y = 6 + context.rng() * 3), fe);
  }
  function K(P, V, Y) {
    let L = null;
    try {
      L = context.enemies.spawn(P, V, Y);
    } catch (Z) {
      console.error("[game] enemies.spawn threw", Z);
    }
    return L;
  }
  function ie() {
    let P = (s.playerStart && s.playerStart.pos) || n.pos;
    for (let V of ["gull", "hound"])
      for (let Y = 0; Y < GAME_FLOW.patrol[V]; Y++)
        K(
          V,
          Q(V, {
            minDist: 32,
            from: P,
            preferHidden: !0,
          }),
          {
            state: "patrol",
          },
        );
  }
  function F(P) {
    let V = GAME_FLOW.waves[Math.min(P, GAME_FLOW.waves.length - 1)],
      Y = [];
    for (let oe = 0; oe < V.gull; oe++) Y.push("gull");
    for (let oe = 0; oe < V.hound; oe++)
      Y.splice(Math.min(Y.length, 1 + oe * 2), 0, "hound");
    let L = 0,
      Z = 0;
    (Y.forEach((oe, fe) => {
      let le = Q(oe);
      ((L += le.x - n.pos.x),
        (Z += le.z - n.pos.z),
        c.queue.push({
          type: oe,
          pos: le,
          at: c.time + 1.6 + fe * GAME_FLOW.spawnStagger,
        }));
    }),
      (c.waveHot = 30));
    let J = ((Math.atan2(L, -Z) * 180) / Math.PI + 360) % 360;
    o.warn && o.warn("Contact \u2014 " + jC[Math.round(J / 45) % 8], 3.4);
  }
  function X(P) {
    let V = ne();
    for (let Y = 0; Y < c.queue.length; Y++) {
      let L = c.queue[Y];
      if (c.time < L.at) continue;
      if (V >= GAME_FLOW.maxAlive) {
        L.at = c.time + 1;
        continue;
      }
      if (
        !K(L.type, L.pos, {
          state: "alert",
          target: n.pos,
        }) &&
        !context.enemies.stub &&
        (L.tries = (L.tries || 0) + 1) < 6
      ) {
        L.at = c.time + 1.5;
        continue;
      }
      (c.queue.splice(Y, 1), a(context.enemies, "alert", n.pos, 60));
      break;
    }
    if (c.allCut) {
      if (
        ((c.pursuitT -= P),
        c.pursuitT <= 0 &&
          c.pursuitLeft > 0 &&
          !c.queue.length &&
          V < GAME_FLOW.pursuitMinAlive)
      ) {
        ((c.pursuitT = GAME_FLOW.pursuitEvery), c.pursuitLeft--);
        let Y = context.rng() < 0.6 ? "gull" : "hound";
        c.queue.push({
          type: Y,
          pos: Q(Y),
          at: c.time + 0.5,
        });
      }
      c.pursuitT <= 0 &&
        ((c.pursuitT = 4), a(context.enemies, "alert", n.pos, 90));
    }
  }
  function ne() {
    try {
      return context.enemies.aliveCount
        ? context.enemies.aliveCount()
        : context.enemies.list.filter((P) => P.alive).length;
    } catch {
      return 0;
    }
  }
  function re(P) {
    let V = (context.enemies && context.enemies.list) || [];
    for (let Y = 0; Y < V.length; Y++) {
      let L = V[Y];
      if (
        L &&
        L.alive &&
        L.pos &&
        Math.hypot(L.pos.x - n.pos.x, L.pos.z - n.pos.z) < P
      )
        return !0;
    }
    return !1;
  }
  (context.events.on("enemy:alert", () => {
    ((c.alertT = 10),
      _.state === "playing" &&
        !c.contactSaid &&
        ((c.contactSaid = !0), o.radio && o.radio(_l.contact, 3.2)));
  }),
    context.events.on("player:hit", () => {
      c.alertT = Math.max(c.alertT, 8);
    }),
    context.events.on("player:rescued", () => {
      _.state === "playing" && o.message("Hauled out of the water", 2.5);
    }));
  function $() {
    let P = null,
      V = GAME_FLOW.interactRange;
    for (let Y of c.relays) {
      if (Y.cut) continue;
      let L = Y.o.pos.x - n.pos.x,
        Z = Y.o.pos.z - n.pos.z,
        J = Math.hypot(L, Z);
      J > V ||
        Math.abs((Y.o.pos.y || 0) - n.pos.y) > 2.5 ||
        (J > 0.9 &&
          (L * n.forward.x + Z * n.forward.z) /
            (J * Math.max(0.2, Math.hypot(n.forward.x, n.forward.z))) <
            GAME_FLOW.interactFacing) ||
        ((P = Y), (V = J));
    }
    return P;
  }
  function ue(P) {
    let V = n.alive ? $() : null;
    for (let L of c.relays)
      L.cut ||
        (L === V && r.down("interact")
          ? (L.cutting || ((L.cutting = !0), O(L.o, "cutting")),
            (L.t += P / GAME_FLOW.cutSeconds),
            context.events.emit("objective:progress", {
              id: L.id,
              t: Math.min(1, L.t),
            }),
            L.t >= 1 && me(L))
          : L.t > 0 &&
            ((L.t = Math.max(0, L.t - P * 1.6)),
            L.cutting &&
              ((L.cutting = !1),
              O(L.o, "live"),
              context.events.emit("objective:progress", {
                id: L.id,
                t: 0,
              }))));
    V && !V.cut
      ? o.setPrompt && o.setPrompt("Cut relay " + V.short, saturate(V.t))
      : o.setPrompt && o.setPrompt(null);
    let Y = s.extraction;
    if (Y && Y.pos) {
      let L = Math.hypot(Y.pos.x - n.pos.x, Y.pos.z - n.pos.z),
        Z = L < (Y.radius || 2.5) && Math.abs(Y.pos.y - n.pos.y) < 3.5;
      (Z && c.allCut && n.alive
        ? ee()
        : Z &&
          !c.allCut &&
          c.extractHint <= 0 &&
          ((c.extractHint = 8),
          o.message(
            "Relays still live \u2014 the boat will not wait under fire",
            3.5,
          )),
        (c.extractHint = Math.max(0, c.extractHint - P)));
    }
  }
  function me(P) {
    ((P.cut = !0), (P.cutting = !1), (P.t = 1), c.cut++, O(P.o, "cut"));
    let V = c.relays.length;
    (context.events.emit("objective:done", {
      id: P.id,
      index: c.cut,
      total: V,
    }),
      o.setRelays && o.setRelays(c.cut, V),
      o.setPrompt && o.setPrompt(null),
      n.addShake(0.18),
      F(c.cut - 1),
      c.cut >= V
        ? ((c.allCut = !0),
          (c.pursuitLeft = GAME_FLOW.pursuitExtra),
          (c.pursuitT = 12),
          context.events.emit("objective:all", {}),
          o.radio && o.radio(_l.all, 4.5))
        : o.radio &&
          o.radio(_l.cut[Math.min(c.cut - 1, _l.cut.length - 1)], 3.6),
      o.setObjective(D()),
      q());
  }
  context.events.on("player:dead", () => {
    (_.state !== "playing" && _.state !== "paused") ||
      (r.setGameplay && r.setGameplay(!1),
      r.exitLock(),
      o.setPrompt && o.setPrompt(null),
      o.show(!1),
      o.clearRadio && o.clearRadio(),
      l.setDead({
        time: c.time,
        relays: c.cut,
        total: c.relays.length,
      }),
      M("dead"));
  });
  function ee() {
    ((n.invulnerable = !0),
      (n.enabled = !1),
      r.setGameplay && r.setGameplay(!1),
      r.exitLock(),
      o.setPrompt && o.setPrompt(null),
      o.show(!1),
      context.events.emit("extraction:reached", {}),
      o.clearRadio && o.clearRadio(),
      o.radio && o.radio(_l.done, 2.2));
    let P = (context.combat && context.combat.stats) || {
        shots: 0,
        hits: 0,
        kills: 0,
      },
      V = P.shots > 0 ? clamp(P.hits / P.shots, 0, 1) : null,
      Y =
        (c.time < 270 ? 2 : c.time < 400 ? 1 : 0) +
        (V >= 0.5 ? 2 : V >= 0.3 ? 1 : 0) +
        (c.retries === 0 ? 1 : 0),
      L = ["Messy", "Loud", "Steady", "Clean", "Sharp", "Surgical"][Y];
    (l.setDebrief({
      time: c.time,
      accuracy: V,
      kills: P.kills || 0,
      retries: c.retries,
      rating: L,
    }),
      M("complete"));
  }
  function B(P) {
    switch (((u += P), _.state)) {
      case "title":
        return (z(P), !1);
      case "intro":
        return (
          (e.fade = 1 - smoothstep(0.25, Math.min(h, 2.6), u)),
          !f && u > 0.5 && ((f = !0), l.locationCard(!0)),
          !p && u > 1.3 && ((p = !0), o.radio && o.radio(_l.intro, 4.2)),
          u > h - 0.6 &&
            !o.root?.classList.contains("on") &&
            (o.show(!0), o.setObjective(D())),
          u >= h && (l.locationCard(!1), (e.fade = 0), T()),
          !0
        );
      case "playing": {
        if (
          ((c.time += P),
          (e.fade = damp(e.fade || 0, 0, 6, P)),
          d > 0 && (d -= P),
          r.pressed("pause"))
        )
          return (G(), !1);
        if ((ue(P), _.state !== "playing")) return !0;
        (X(P),
          (c.alertT = Math.max(0, c.alertT - P)),
          (c.waveHot = Math.max(0, c.waveHot - P)));
        let V = ne();
        c.waveHot > 0 &&
          V === 0 &&
          !c.queue.length &&
          c.waveHot < 24 &&
          (c.waveHot = 0);
        let Y =
          c.allCut || c.queue.length || (c.waveHot > 0 && V > 0)
            ? 1
            : c.alertT > 0 || (V > 0 && re(26))
              ? 0.6
              : 0.15;
        return (
          Y !== c.intensity &&
            ((c.intensity = Y), a(context.audio, "setIntensity", Y)),
          r.mode === "lock" &&
          !r.locked &&
          !r.touch &&
          !context.params.shot &&
          !context.params.autostart
            ? ((y -= P), y <= 0 && ((y = 2), o.message(r.describeMode(), 2.6)))
            : (y = 0.8),
          !c.lowSaid &&
            n.alive &&
            n.health < 30 &&
            ((c.lowSaid = !0), o.radio && o.radio(_l.low, 3)),
          !0
        );
      }
      case "paused":
        return (
          d > 0 ? (d -= P) : r.pressed("pause") && (l.closePanel() || j(!1)),
          !1
        );
      case "dead":
        return (
          (e.saturation = damp(e.saturation ?? 1, 0.12, 2.2, P)),
          (e.fade = damp(e.fade || 0, 0.55, 1.4, P)),
          u > 1.5 &&
            l.screen !== "dead" &&
            (l.show("dead"), a(context.audio, "setIntensity", 0.15)),
          !0
        );
      case "complete":
        return (
          (e.fade = damp(e.fade || 0, 0.72, 0.9, P)),
          (e.saturation = damp(e.saturation ?? 1, t * 0.7, 1, P)),
          u > 3.3 &&
            l.screen !== "complete" &&
            (l.show("complete"), a(context.audio, "setIntensity", 0.15)),
          !0
        );
    }
    return !1;
  }
  return (
    w(),
    (n.enabled = !1),
    o.show(!1),
    a(context.weapon, "setVisible", !1),
    r.setGameplay && r.setGameplay(!1),
    a(context.audio, "setIntensity", 0.15),
    context.params.shot || context.params.autostart || l.show("title"),
    _
  );
}

export { createGameFlow, GAME_FLOW };
