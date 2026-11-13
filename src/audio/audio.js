import { Kb, Qb, ao, em, ml } from "./synthesis.js";
import { Go, i_, s_ } from "./library.js";

function o_(i, e, t) {
  let n = Array.isArray(e) ? e : [e];
  if (!i.loop) for (let r of n) em(r, t, i.ir ? 0 : 3e-4, i.ir ? 0.05 : 0.012);
  let s = 0;
  for (let r of n) s = Math.max(s, Qb(r));
  let o = s > 0 ? i.peak / s : 1;
  for (let r of n) ml(r, o);
  return {
    sr: t,
    ch: n,
    loop: !!i.loop,
  };
}

function r_(i, e = 0, t) {
  let n = Go[i];
  if (!n) return null;
  let s = t || n.sr,
    o = e % n.n,
    r = n.gen(s, ao(Kb(i) + o * 7919), o);
  if (s_(r)) {
    let a;
    do a = r.next();
    while (!a.done);
    r = a.value;
  }
  return o_(n, r, s);
}

function a_(i, e = 0, t) {
  let n = Go[i];
  if (!n) return null;
  let s = t || n.sr,
    o = e % n.n,
    r = n.gen(s, ao(Kb(i) + o * 7919), o),
    a = null;
  return {
    step() {
      if (a) return a;
      if (s_(r)) {
        let l = r.next();
        if (!l.done) return null;
        r = l.value;
      }
      return (a = o_(n, r, s));
    },
  };
}

var pi = (i, e, t) => Math.min(t, Math.max(e, i));

var Pv = (i, e, t) => {
  let n = pi((t - i) / (e - i), 0, 1);
  return n * n * (3 - 2 * n);
};

var l_ = {
  metal: "impact_metal",
  concrete: "impact_concrete",
  wood: "impact_wood",
  water: "impact_water",
  glass: "impact_glass",
  dirt: "impact_concrete",
  rubber: "impact_wood",
};

var Iv = {
  metal: "step_metal",
  water: "step_water",
  concrete: "step_concrete",
  wood: "step_concrete",
  dirt: "step_concrete",
  glass: "step_concrete",
  rubber: "step_concrete",
};

var tC = new Set([
  "thunder",
  "foghorn",
  "objective",
  "objective_all",
  "complete",
  "death",
  "explosion",
  "rifle_tail_in",
  "gull_die",
  "hound_die",
  "relay_cut",
  "container_bang",
  "ear_ring",
]);

var nC = [
  "ir_outdoor",
  "ir_shed",
  "rain",
  "whiz",
  "reload_magout",
  "reload_magin",
  "reload_bolt",
  "shell_bounce",
  "impact_concrete",
  "impact_metal",
  "land",
  "jump",
  "hurt",
  "music_drone",
  "wind",
  "music_motif",
  "impact_enemy",
  "impact_wood",
  "impact_water",
  "impact_glass",
  "ricochet",
  "gull_rotor",
  "hound_servo",
  "alert",
  "telegraph",
  "gull_fire",
  "hound_fire",
  "hound_step",
  "ui_click",
  "ui_hover",
  "sea",
  "rain_interior",
  "relay_hum",
  "gull_die",
  "hound_die",
  "explosion",
  "ear_ring",
  "death",
  "music_ost",
  "music_perc",
  "music_brass",
  "relay_cut",
  "objective",
  "thunder",
  "objective_all",
  "complete",
  "gull_cry",
  "halyard",
  "foghorn",
  "container_bang",
];

var tm = [
  "music_drone",
  "music_ost",
  "music_perc",
  "music_brass",
  "music_motif",
];

function iC() {
  let i = () => {},
    e = {
      setPos: i,
      setGain: i,
      setPitch: i,
      stop: i,
    };
  return {
    silent: !0,
    update: i,
    resume: i,
    play: i,
    loop: () => e,
    setIntensity: i,
    setInterior: i,
    setVolume: i,
    setPaused: i,
    debug: () => ({
      state: "none",
    }),
    names: Object.keys(Go),
    ready: Promise.resolve(),
  };
}

async function createAudio(context) {
  let e =
      typeof window < "u" && (window.AudioContext || window.webkitAudioContext),
    t = null;
  try {
    e &&
      (t = new e({
        latencyHint: "interactive",
      }));
  } catch {
    t = null;
  }
  return t
    ? u_(context, t, null)
    : (console.warn("[audio] WebAudio unavailable \u2014 running silent"),
      iC());
}

function u_(i, e, t) {
  let n = i.events,
    s = Math.random,
    o = () => (t ? !0 : e.state === "running"),
    r = t ? t.bufs : new Map(),
    a = new Map(),
    l = 0,
    c = 0,
    u = 0;
  function h(te, he) {
    let pe = e.createBuffer(he.ch.length, he.ch[0].length, he.sr);
    for (let ye = 0; ye < he.ch.length; ye++)
      pe.getChannelData(ye).set(he.ch[ye]);
    (r.set(te, pe), c++);
    let ge = a.get(te);
    if (ge) {
      a.delete(te);
      for (let ye of ge)
        try {
          ye(pe);
        } catch (Le) {
          console.error("[audio] ready callback", Le);
        }
    }
    return pe;
  }
  let f = (te) => (Go[te].ir ? e.sampleRate : void 0);
  function p(te, he) {
    let pe = performance.now(),
      ge = h(te + "#" + he, r_(te, he, f(te)));
    return ((l += performance.now() - pe), ge);
  }
  let d = [],
    v = new Set();
  for (let te of [...nC, ...Object.keys(Go)]) {
    let he = Go[te];
    if (!(!he || v.has(te))) {
      v.add(te);
      for (let pe = 0; pe < he.n; pe++)
        r.has(te + "#" + pe) ||
          (he.boot
            ? p(te, pe)
            : d.push({
                name: te,
                v: pe,
                k: te + "#" + pe,
                steps: null,
              }));
    }
  }
  u = l;
  let g,
    x = new Promise((te) => {
      g = te;
    });
  function y() {
    let te = performance.now();
    for (; d.length;) {
      let he = d[0];
      if (r.has(he.k)) {
        d.shift();
        continue;
      }
      he.steps || (he.steps = a_(he.name, he.v, f(he.name)));
      let pe = null;
      try {
        pe = he.steps.step();
      } catch (ge) {
        (console.error("[audio] synthesis failed for " + he.k, ge), d.shift());
        continue;
      }
      if (
        (pe && (h(he.k, pe), d.shift(), be(he.name)),
        performance.now() - te > 6)
      )
        break;
    }
    ((l += performance.now() - te), d.length ? setTimeout(y, 12) : g());
  }
  t ? g() : setTimeout(y, 120);
  function b(te, he, pe) {
    let ge = te + "#" + he,
      ye = r.get(ge);
    if (ye) {
      pe(ye);
      return;
    }
    (a.has(ge) || a.set(ge, []), a.get(ge).push(pe));
    let Le = d.findIndex((ke) => ke.k === ge);
    if (Le > 0 && !d[Le].steps) {
      let [ke] = d.splice(Le, 1);
      d.splice(d[0] && d[0].steps ? 1 : 0, 0, ke);
    }
  }
  let m = (te) => {
      let he = e.createGain();
      return ((he.gain.value = te), he);
    },
    A = m(1),
    _ = e.createDynamicsCompressor(),
    M = m(0.45),
    E = e.createWaveShaper(),
    w = m(0.9);
  ((_.threshold.value = -10),
    (_.knee.value = 6),
    (_.ratio.value = 6),
    (_.attack.value = 0.002),
    (_.release.value = 0.14));
  {
    let he = new Float32Array(2049);
    for (let pe = 0; pe < 2049; pe++) {
      let ge = ((pe / 2048) * 2 - 1) * 2,
        ye = Math.abs(ge);
      he[pe] =
        Math.sign(ge) *
        (ye <= 0.6 ? ye : 0.6 + 0.4 * Math.tanh((ye - 0.6) / 0.4));
    }
    E.curve = he;
    try {
      E.oversample = "2x";
    } catch {}
  }
  (A.connect(_),
    _.connect(M),
    M.connect(E),
    E.connect(w),
    w.connect(e.destination));
  let S = e.createBiquadFilter();
  ((S.type = "lowpass"), (S.frequency.value = 2e4), (S.Q.value = 0.5));
  let z = m(1);
  (S.connect(z), z.connect(A));
  let H = {
    world: m(1),
    near: m(0.95),
    amb: m(0.55),
    dry: m(1),
    music: m(0.62),
  };
  (H.world.connect(S), H.near.connect(S), H.amb.connect(S), H.dry.connect(A));
  let O = m(1);
  (H.music.connect(O), O.connect(A));
  let q = m(1),
    U = m(1),
    T = m(0),
    D = e.createConvolver(),
    C = e.createConvolver(),
    G = m(0.75),
    j = m(0.95),
    N = m(0.9),
    Q = m(0.32),
    K = m(0.2);
  (H.world.connect(N),
    N.connect(q),
    H.near.connect(Q),
    Q.connect(q),
    q.connect(U),
    q.connect(T),
    U.connect(D),
    T.connect(C),
    D.connect(G),
    C.connect(j),
    G.connect(S),
    j.connect(S),
    H.music.connect(K),
    K.connect(C),
    b("ir_outdoor", 0, (te) => {
      D.buffer = te;
    }),
    b("ir_shed", 0, (te) => {
      C.buffer = te;
    }));
  function ie(te, he, pe, ge) {
    te.positionX
      ? ((te.positionX.value = he),
        (te.positionY.value = pe),
        (te.positionZ.value = ge))
      : te.setPosition(he, pe, ge);
  }
  function F(te) {
    let he = e.createPanner();
    return (
      (he.panningModel = te ? "HRTF" : "equalpower"),
      (he.distanceModel = "inverse"),
      (he.refDistance = 3),
      (he.rolloffFactor = 0.6),
      (he.maxDistance = 400),
      (he.coneInnerAngle = 360),
      he
    );
  }
  let X = {
    world: [],
    near: [],
    dry: [],
    music: [],
  };
  function ne(te, he) {
    let pe = {
      g: m(0),
      pan: null,
      src: null,
      end: 0,
      start: 0,
      name: "",
      pri: 0,
    };
    (he
      ? ((pe.pan = F(!1)), pe.g.connect(pe.pan), pe.pan.connect(H[te]))
      : pe.g.connect(H[te]),
      X[te].push(pe));
  }
  for (let te = 0; te < 22; te++) ne("world", !0);
  for (let te = 0; te < 12; te++) ne("near", !1);
  for (let te = 0; te < 8; te++) ne("dry", !1);
  for (let te = 0; te < 3; te++) ne("music", !1);
  let re = {
      x: 0,
      y: 1.7,
      z: 0,
    },
    $ = !1,
    ue = !1,
    me = 0.9,
    ee = (i.game && i.game.state) || "title",
    B = 0,
    P = 0,
    V = 0,
    Y = 0,
    L = 0,
    Z = 0,
    J = 1,
    oe = 1,
    fe = 0,
    le = -9,
    R = -9,
    I = 0,
    se = -9,
    ae = -9,
    k = -9,
    ce = -9,
    ve = -9,
    _e = -9,
    Te = -9,
    Pe = {},
    // M5：天气/时间对音频层的额外倍率。原版 4 个环境层（rain/rainIn/wind/sea）
    // 增益恒定，不随天气变化；M5 用独立倍率相乘，不改原版的基础公式。
    // 初值取 clear/overcast 之间的中性值，避免 ?shot=1 静默改变音量。
    weatherMul = {
      rain: 1,
      wind: 1,
      sea: 1,
    },
    // M5：musicMood 对 5 层音乐的额外倍率。按 tm 的键名索引，
    // 不依赖 we() 返回值的顺序（tm[1] 是 music_ost，与 we 的第 5 项对应）。
    musicMood = "calm",
    MOOD_MUL = {
      calm: { music_drone: 1.0, music_ost: 0.9, music_perc: 0.3, music_brass: 0.4, music_motif: 0.6 },
      bright: { music_drone: 0.7, music_ost: 0.9, music_perc: 1.0, music_brass: 1.0, music_motif: 0.9 },
      warm: { music_drone: 0.9, music_ost: 0.95, music_perc: 0.6, music_brass: 0.8, music_motif: 0.8 },
      dark: { music_drone: 1.2, music_ost: 0.85, music_perc: 0.4, music_brass: 0.3, music_motif: 0.5 },
    },
    WEATHER_GAIN = {
      clear: { rain: 0.0, wind: 0.25, sea: 0.6 },
      overcast: { rain: 0.12, wind: 0.45, sea: 0.7 },
      lightRain: { rain: 0.55, wind: 0.65, sea: 0.8 },
      heavyRain: { rain: 1.0, wind: 0.9, sea: 0.9 },
    },
    TIME_MOOD = {
      dawn: "calm",
      noon: "bright",
      dusk: "warm",
      midnight: "dark",
    };
  // M5：天气 → 雨/风/海倍率。只改目标乘子，实际增益由 lu() 每帧计算。
  function applyWeather(te) {
    let he = WEATHER_GAIN[te] || WEATHER_GAIN.clear;
    weatherMul.rain = he.rain;
    weatherMul.wind = he.wind;
    weatherMul.sea = he.sea;
  }
  // M5：时间 → 音乐氛围
  function applyTimeOfDay(te) {
    musicMood = TIME_MOOD[te] || "calm";
  }
  let Re = {
      autoIntensity: !0,
    };
  function Fe(te, he, pe, ge) {
    let ye = null,
      Le = 0,
      ke = null,
      Ue = null;
    for (let ct = 0; ct < te.length; ct++) {
      let De = te[ct];
      if (De.end <= ge) {
        ye || (ye = De);
        continue;
      }
      (De.name === he && (Le++, (!ke || De.start < ke.start) && (ke = De)),
        (!Ue ||
          De.pri < Ue.pri ||
          (De.pri === Ue.pri && De.start < Ue.start)) &&
          (Ue = De));
    }
    return Le >= (pe.max || 4)
      ? ke
      : ye || (Ue && Ue.pri <= pe.pri ? Ue : null);
  }
  function ze(te, he) {
    ((he = he || {}),
      (te = i_[te] || te),
      he.surface &&
        (te === "impact_concrete"
          ? (te = l_[he.surface] || te)
          : te === "step_concrete" && (te = Iv[he.surface] || te)));
    let pe = Go[te];
    if (!pe || pe.loop || pe.ir || !o()) return !1;
    let ge = he.variant;
    ge == null
      ? (ge = Pe[te] =
          ((Pe[te] || 0) + 1 + (pe.n > 2 && s() < 0.3 ? 1 : 0)) % pe.n)
      : (ge %= pe.n);
    let ye = r.get(te + "#" + ge);
    if (!ye) {
      if (tC.has(te)) {
        let Ht = e.currentTime;
        return (
          b(te, ge, () => {
            e.currentTime - Ht < 2.5 &&
              ze(
                te,
                Object.assign({}, he, {
                  variant: ge,
                }),
              );
          }),
          !1
        );
      }
      ye = p(te, ge);
    }
    let Le = e.currentTime,
      ke = he.pos,
      Ue = !!ke && pe.bus === "world",
      ct = Ue ? X.world : X[pe.bus === "world" ? "near" : pe.bus],
      De = Fe(ct, te, pe, Le);
    if (!De) return !1;
    let it = Le + (he.delay || 0),
      gt = De.g.gain;
    if ((gt.cancelScheduledValues(Le), De.end > Le && De.src)) {
      gt.setTargetAtTime(0, Le, 0.004);
      try {
        De.src.stop(Le + 0.025);
      } catch {}
      it = Math.max(it, Le + 0.025);
    }
    let Ot = he.jitter != null ? he.jitter : 0.035,
      xn = pi((he.pitch || 1) * (1 + (s() * 2 - 1) * Ot), 0.25, 4);
    if (
      (gt.setValueAtTime(
        (he.gain != null ? he.gain : 1) * (1 - s() * 0.08),
        it,
      ),
      Ue)
    ) {
      let Ht = Array.isArray(ke)
        ? {
            x: ke[0],
            y: ke[1],
            z: ke[2],
          }
        : ke;
      (ie(De.pan, Ht.x || 0, Ht.y || 0, Ht.z || 0),
        (De.pan.refDistance = he.ref || pe.ref || 3),
        (De.pan.rolloffFactor =
          he.roll != null ? he.roll : pe.roll != null ? pe.roll : 0.6));
    }
    let $t = e.createBufferSource();
    return (
      ($t.buffer = ye),
      ($t.playbackRate.value = xn),
      $t.connect(De.g),
      ($t.onended = () => {
        try {
          $t.disconnect();
        } catch {}
      }),
      $t.start(it),
      (De.src = $t),
      (De.start = it),
      (De.end = it + ye.duration / xn + 0.03),
      (De.name = te),
      (De.pri = pe.pri || 0),
      !0
    );
  }
  let We = new Set(),
    Ne = new Set(),
    dt = () => {},
    xe = !1,
    Ie = {
      setPos: dt,
      setGain: dt,
      setPitch: dt,
      stop: dt,
      alive: !1,
    };
  function Be(te, he) {
    he = he || {};
    let pe = Go[te];
    if (!pe || !pe.loop) return Ie;
    let ge = (te === "gull_rotor" || te === "hound_servo") && !he._auto;
    ge &&
      !he.hrtf &&
      (he = Object.assign(
        {
          hrtf: !0,
        },
        he,
      ));
    let ye = {
        name: te,
        alive: !0,
        vT: 1,
        vC: 1,
        px: 0,
        py: 0,
        pz: 0,
        gT: he.gain != null ? he.gain : 1,
        gC: 0,
        pT: he.pitch || 1,
        pC: he.pitch || 1,
        src: null,
        g: m(0),
        pan: null,
        rate: he.fade || 6,
      },
      Le = ye.g;
    if (
      (he.pos &&
        ((ye.pan = F(!!he.hrtf)),
        (ye.pan.refDistance = he.ref || pe.ref || 3),
        (ye.pan.rolloffFactor =
          he.roll != null ? he.roll : pe.roll != null ? pe.roll : 0.6),
        ye.g.connect(ye.pan),
        (Le = ye.pan)),
      Le.connect(H[he.bus || (he.pos ? "world" : pe.music ? "music" : "amb")]),
      (ye.setPos = (ke) => {
        ye.pan &&
          ke &&
          (Array.isArray(ke)
            ? ((ye.px = ke[0]), (ye.py = ke[1]), (ye.pz = ke[2]))
            : ((ye.px = ke.x || 0), (ye.py = ke.y || 0), (ye.pz = ke.z || 0)),
          Number.isFinite(ye.px + ye.py + ye.pz) &&
            ie(ye.pan, ye.px, ye.py, ye.pz));
      }),
      (ye.setGain = (ke) => {
        ye.gT = Math.max(0, +ke || 0);
      }),
      (ye.setPitch = (ke) => {
        ye.pT = pi(+ke || 1, 0.25, 4);
      }),
      (ye.stop = (ke) => {
        if (!ye.alive) return;
        ((ye.alive = !1), We.delete(ye), Ne.delete(ye));
        let Ue = ke ?? 0.18,
          ct = e.currentTime;
        try {
          (ye.g.gain.setValueAtTime(ye.gC, ct),
            ye.g.gain.linearRampToValueAtTime(0, ct + Ue),
            ye.src && ye.src.stop(ct + Ue + 0.03));
        } catch {}
        setTimeout(
          () => {
            try {
              (ye.src && ye.src.disconnect(),
                ye.g.disconnect(),
                ye.pan && ye.pan.disconnect());
            } catch {}
          },
          (Ue + 0.3) * 1e3,
        );
      }),
      he.pos && ye.setPos(he.pos),
      b(te, 0, (ke) => {
        if (!ye.alive) return;
        let Ue = e.createBufferSource();
        ((Ue.buffer = ke),
          (Ue.loop = !0),
          (Ue.playbackRate.value = ye.pC),
          Ue.connect(ye.g),
          Ue.start(0, he.offset != null ? he.offset : s() * ke.duration),
          (ye.src = Ue));
      }),
      We.add(ye),
      ge && (Ne.add(ye), !xe))
    ) {
      xe = !0;
      for (let ke of [...pn.keys()]) Rs(ke);
    }
    return ye;
  }
  let Xe = {
    on: !1,
    layers: {},
  };
  function Me() {
    if (Xe.on || !o()) return;
    for (let he of tm) if (!r.has(he + "#0")) return;
    let te = e.currentTime + 0.08;
    for (let he of tm) {
      let pe = m(0),
        ge = e.createBufferSource();
      ((ge.buffer = r.get(he + "#0")),
        (ge.loop = !0),
        ge.connect(pe),
        pe.connect(H.music),
        ge.start(te),
        (Xe.layers[he] = {
          g: pe,
          s: ge,
          c: 0,
        }));
    }
    ((Xe.on = !0), (Xe.t0 = te));
  }
  function we(te) {
    return ee === "title"
      ? [0.85, 0, 0, 0, 0.9]
      : ee === "intro"
        ? [0.8, 0, 0, 0, 0.6]
        : ee === "dead"
          ? [0.75, 0, 0, 0, 0]
          : ee === "complete"
            ? [0.6, 0, 0, 0, 0.7]
            : [
                0.6 + 0.3 * te,
                Pv(0.05, 0.5, te) * 0.85,
                Pv(0.4, 0.8, te) * 0.95,
                Pv(0.62, 1, te) * 0.8,
                0,
              ];
  }
  function be(te) {
    Go[te].music && Me();
  }
  let Oe = {
      rain: Be("rain", {
        gain: 0,
        fade: 2,
      }),
      rainIn: Be("rain_interior", {
        gain: 0,
        fade: 2,
      }),
      wind: Be("wind", {
        gain: 0,
        fade: 2,
      }),
      sea: Be("sea", {
        gain: 0,
        pos: [33, -1, 0],
        fade: 2,
        bus: "amb",
      }),
    },
    pt = 0.4,
    ut = 0.4,
    nn = 2,
    bt = {
      fog: 14 + s() * 14,
      gull: 5 + s() * 8,
      hal: 4 + s() * 6,
      bang: 20 + s() * 25,
    };
  function Os(te, he) {
    let pe = 1 - 0.7 * P;
    if ((bt.fog -= te) <= 0) {
      bt.fog = 40 + s() * 30;
      let ge = re.z + (s() * 2 - 1) * 250;
      ze("foghorn", {
        pos: [re.x + 320, 8, ge],
        ref: 400,
        gain: 0.34 * he * pe,
        pitch: s() < 0.3 ? 0.89 : 1,
        jitter: 0.01,
      });
    }
    if ((bt.gull -= te) <= 0) {
      bt.gull = 9 + s() * 16;
      let ge = s() * 6.283,
        ye = 35 + s() * 50;
      ze("gull_cry", {
        pos: [
          re.x + Math.cos(ge) * ye,
          14 + s() * 18,
          re.z + Math.sin(ge) * ye,
        ],
        ref: ye,
        roll: 1,
        gain: (0.16 + s() * 0.16) * he * pe,
        jitter: 0.1,
      });
    }
    if (
      ((bt.hal -= te) <= 0 &&
        ((bt.hal = 6 + s() * 11),
        ze("halyard", {
          pos: [29 + s() * 8, 3 + s() * 6, -8 + s() * 32],
          ref: 16,
          roll: 0.5,
          gain: (0.3 + s() * 0.3) * he * pe,
          jitter: 0.08,
        })),
      (bt.bang -= te) <= 0)
    ) {
      bt.bang = 28 + s() * 34;
      let ge = 1.6 + s() * 3.2;
      ze("container_bang", {
        pos: [re.x + Math.cos(ge) * 150, 4, re.z + Math.sin(ge) * 150],
        ref: 150,
        gain: (0.2 + s() * 0.16) * he * pe,
        jitter: 0.12,
      });
    }
  }
  let pn = new Map(),
    Ti = 0;
  function ho(te) {
    !te ||
      xe ||
      pn.has(te) ||
      te.alive === !1 ||
      pn.set(te, {
        h: null,
        type: te.type === "hound" ? "hound" : "gull",
        lx: te.pos ? te.pos.x : 0,
        ly: te.pos ? te.pos.y : 0,
        lz: te.pos ? te.pos.z : 0,
        sp: 0,
        d: 1e9,
        tune: 0.96 + s() * 0.1,
      });
  }
  function Rs(te) {
    let he = pn.get(te);
    he && (he.h && he.h.stop(0.12), pn.delete(te));
  }
  let Un = [];
  function zo(te) {
    if (((Ti -= te), Ti <= 0 && xe)) {
      ((Ti = 0.25), (Un.length = 0));
      for (let he of Ne)
        ((he.d = Math.hypot(he.px - re.x, he.py - re.y, he.pz - re.z)),
          Un.push(he));
      Un.sort((he, pe) => he.d - pe.d);
      for (let he = 0; he < Un.length; he++)
        Un[he].vT = he < 6 && Un[he].d < 90 ? 1 : 0;
    }
    if (Ti <= 0) {
      Ti = 0.25;
      let he = i.enemies && i.enemies.list;
      if (Array.isArray(he))
        for (let pe = 0; pe < he.length; pe++) {
          let ge = he[pe];
          ge && ge.alive !== !1 && !pn.has(ge) && ho(ge);
        }
      Un.length = 0;
      for (let [pe, ge] of pn) {
        if (pe.alive === !1 || (Array.isArray(he) && he.indexOf(pe) < 0)) {
          Rs(pe);
          continue;
        }
        let ye = pe.pos;
        ye &&
          ((ge.d = Math.hypot(ye.x - re.x, ye.y - re.y, ye.z - re.z)),
          Un.push(ge));
      }
      Un.sort((pe, ge) => pe.d - ge.d);
      for (let pe = 0; pe < Un.length; pe++) {
        let ge = Un[pe],
          ye = pe < 6 && ge.d < 90;
        ye && !ge.h
          ? (ge.h = Be(ge.type === "gull" ? "gull_rotor" : "hound_servo", {
              pos: [ge.lx, ge.ly, ge.lz],
              gain: 0,
              hrtf: !0,
              fade: 5,
              _auto: !0,
            }))
          : !ye && ge.h && (ge.h.stop(0.25), (ge.h = null));
      }
    }
    for (let [he, pe] of pn) {
      let ge = he.pos;
      if (ge) {
        if (te > 0) {
          let ye = Math.hypot(ge.x - pe.lx, ge.y - pe.ly, ge.z - pe.lz) / te;
          pe.sp += (Math.min(ye, 30) - pe.sp) * Math.min(1, te * 5);
        }
        if (((pe.lx = ge.x), (pe.ly = ge.y), (pe.lz = ge.z), !!pe.h))
          if ((pe.h.setPos(ge), pe.type === "gull"))
            (pe.h.setGain(1),
              pe.h.setPitch(pe.tune * (0.94 + 0.3 * pi(pe.sp / 10, 0, 1))));
          else {
            let ye = pi(pe.sp / 3, 0, 1);
            (pe.h.setGain(0.3 + 0.5 * ye),
              pe.h.setPitch(pe.tune * (0.88 + 0.3 * ye)));
          }
      }
    }
  }
  let $i = [];
  function ya() {
    for (let he of $i) he.h.stop(0.2);
    $i = [];
    let te = i.level && i.level.objectives;
    Array.isArray(te) &&
      te.forEach((he, pe) => {
        he &&
          he.pos &&
          $i.push({
            id: he.id,
            index: pe,
            pos: {
              x: he.pos.x,
              y: (he.pos.y || 0) + 1.2,
              z: he.pos.z,
            },
            h: Be("relay_hum", {
              pos: [he.pos.x, (he.pos.y || 0) + 1.2, he.pos.z],
              gain: 0.9,
            }),
          });
      });
  }
  function ba(te) {
    te = te || {};
    let he = $i.findIndex((pe) => te.id != null && pe.id === te.id);
    if (
      (he < 0 &&
        te.index != null &&
        (he = $i.findIndex((pe) => pe.index === te.index)),
      he >= 0)
    ) {
      let pe = $i[he];
      (pe.h.stop(0.08),
        $i.splice(he, 1),
        ze("relay_cut", {
          pos: pe.pos,
          gain: 1,
        }));
    } else
      ze("relay_cut", {
        gain: 0.8,
      });
  }
  let Hn = (te) => (te && typeof te.x == "number" ? te : null);
  function fo(te) {
    let he = P;
    (he < 0.95 &&
      ze("rifle_tail_out", {
        gain: te * (1 - he),
        jitter: 0.03,
      }),
      he > 0.05 &&
        ze("rifle_tail_in", {
          gain: te * he,
          jitter: 0.03,
        }),
      (R = e.currentTime));
  }
  let ln = (te, he) => {
    n &&
      n.on &&
      n.on(te, (pe) => {
        try {
          he(pe || {});
        } catch (ge) {
          console.error("[audio] " + te, ge);
        }
      });
  };
  (ln("weapon:fire", () => {
    ((I = (I + 1) & 3),
      ze("rifle_shot", {
        variant: I,
        gain: 1,
        jitter: 0.012,
      }));
    let te = e.currentTime;
    ((le = te),
      te - R > 0.28 && fo(1),
      (J = Math.min(J, 0.55)),
      Y > 0.3 && (Y = Math.min(1, Y + 0.015)));
  }),
    ln("weapon:dry", () =>
      ze("rifle_dry", {
        gain: 0.9,
      }),
    ),
    ln("weapon:reload", (te) => {
      te.phase === "magout"
        ? ze("reload_magout")
        : te.phase === "magin"
          ? ze("reload_magin")
          : te.phase === "bolt"
            ? ze("reload_bolt")
            : te.phase === "start" &&
              ze("jump", {
                gain: 0.5,
                pitch: 1.3,
              });
    }),
    ln("weapon:melee", () =>
      ze("jump", {
        gain: 0.9,
        pitch: 1.2,
      }),
    ),
    ln("shell:bounce", (te) => {
      let he = e.currentTime;
      he - ce < 0.04 ||
        ((ce = he),
        te.surface === "water"
          ? ze("impact_water", {
              pos: Hn(te.pos),
              gain: 0.25,
              pitch: 1.7,
            })
          : ze("shell_bounce", {
              pos: Hn(te.pos),
              gain: te.surface === "metal" ? 1 : 0.8,
              pitch: te.surface === "metal" ? 1.12 : 1,
            }));
    }),
    ln("impact", (te) => {
      let he = e.currentTime;
      if (he - se < 0.022) return;
      se = he;
      let pe = Hn(te.point),
        ge = te.surface;
      if (te.enemy) {
        ze("impact_enemy", {
          pos: pe,
          gain: te.part === "weak" ? 1 : 0.85,
          pitch: te.part === "weak" ? 1.25 : 1,
        });
        return;
      }
      if (
        te.from === "enemy" &&
        pe &&
        te.dir &&
        typeof te.dir.x == "number" &&
        he - Te > 0.09
      ) {
        let ye = te.dir,
          Le = ye.x * ye.x + ye.y * ye.y + ye.z * ye.z || 1,
          ke =
            ((re.x - pe.x) * ye.x +
              (re.y - pe.y) * ye.y +
              (re.z - pe.z) * ye.z) /
            Le;
        if (ke < -1.5) {
          let Ue = pe.x + ye.x * ke,
            ct = pe.y + ye.y * ke,
            De = pe.z + ye.z * ke,
            it = Math.hypot(re.x - Ue, re.y - ct, re.z - De);
          it < 3.2 &&
            ((Te = he),
            ze("whiz", {
              pos: {
                x: Ue,
                y: ct,
                z: De,
              },
              gain: pi(1.15 - it / 3.5, 0.3, 1),
              jitter: 0.1,
            }));
        }
      }
      (ze(l_[ge] || "impact_concrete", {
        pos: pe,
        gain: te.from === "enemy" ? 0.8 : 0.9,
        pitch: ge === "dirt" ? 0.8 : ge === "rubber" ? 0.7 : 1,
        jitter: 0.07,
      }),
        he - ae > 0.22 &&
          ((ge === "metal" && s() < 0.24) ||
            (ge === "concrete" && s() < 0.07)) &&
          ((ae = he),
          ze("ricochet", {
            pos: pe,
            gain: 0.75,
            delay: 0.012,
            jitter: 0.12,
          })));
    }),
    ln("player:step", (te) => {
      let he = te.surface || "concrete";
      try {
        te.pos &&
          i.ground &&
          i.ground.isPuddle &&
          i.ground.isPuddle(te.pos.x, te.pos.z) &&
          (he = "water");
      } catch {}
      ze(Iv[he] || "step_concrete", {
        gain: (te.sprint ? 0.8 : 0.55) * (he === "water" ? 0.9 : 1),
        pitch: (te.sprint ? 1.05 : 1) * (he === "wood" ? 1.18 : 1),
        jitter: 0.06,
      });
    }),
    ln("player:jump", () =>
      ze("jump", {
        gain: 0.8,
      }),
    ),
    ln("player:land", (te) => {
      let he = pi(0.35 + (Math.abs(te.speed) || 4) / 10, 0.35, 1);
      (ze("land", {
        gain: he,
      }),
        (te.surface === "water" || te.surface === "metal") &&
          ze(Iv[te.surface], {
            gain: he * 0.8,
            pitch: 0.9,
          }));
    }),
    ln("player:hit", (te) => {
      let he = +te.amount || 10,
        pe = e.currentTime;
      (ze("hurt", {
        gain: pi(0.5 + he / 40, 0.5, 1),
        jitter: 0.08,
      }),
        he >= 6 &&
          pe - k > 1.8 &&
          ((k = pe),
          ze("ear_ring", {
            gain: pi(he / 28, 0.3, 1),
            jitter: 0.02,
          })),
        (Z = Math.max(Z, pi(he / 40, 0.2, 0.7))),
        (Y = Math.min(1, Math.max(Y, 0.6) + 0.15)));
    }),
    ln("player:dead", () => {
      (e.currentTime - _e > 1 &&
        ((_e = e.currentTime),
        ze("death", {
          gain: 1,
          jitter: 0,
        })),
        (Z = 1));
    }),
    ln("enemy:spawn", (te) => ho(te.enemy)),
    ln("enemy:alert", (te) => {
      Y = Math.max(Y, 0.6);
      let he = e.currentTime;
      if (he - ve < 0.12) return;
      ve = he;
      let pe = te.enemy || {};
      ze("alert", {
        pos: Hn(pe.pos) || Hn(te.pos),
        variant: pe.type === "hound" ? 1 : 0,
        gain: 0.9,
      });
    }),
    ln("enemy:fire", (te) => {
      let he = te.type || (te.enemy && te.enemy.type),
        pe = Hn(te.pos) || (te.enemy && Hn(te.enemy.pos));
      (ze(he === "hound" ? "hound_fire" : "gull_fire", {
        pos: pe,
        gain: 1,
        jitter: 0.04,
      }),
        (Y = Math.min(1, Math.max(Y, 0.6) + 0.05)));
    }),
    ln("enemy:step", (te) => {
      if (te.crash) {
        (ze("hound_step", {
          pos: Hn(te.pos),
          gain: 1,
          pitch: 0.72,
        }),
          ze("impact_metal", {
            pos: Hn(te.pos),
            gain: 0.8,
            pitch: 0.55,
          }));
        return;
      }
      te.type !== "gull" &&
        ze("hound_step", {
          pos: Hn(te.pos),
          gain: pi(0.6 + (+te.speed || 2) * 0.1, 0.6, 1),
          jitter: 0.06,
        });
    }),
    ln("enemy:telegraph", (te) => {
      let he = te.enemy || {},
        pe = te.type || he.type,
        ge = pi(+te.time || 0.55, 0.15, 1.5);
      (ze("telegraph", {
        pos: Hn(te.pos) || Hn(he.pos),
        variant: pe === "hound" ? 1 : 0,
        pitch: 0.55 / ge,
        gain: te.melee ? 0.7 : 1,
        jitter: 0,
      }),
        (Y = Math.max(Y, 0.6)));
    }),
    ln("enemy:melee", (te) => {
      let he = Hn(te.pos) || (te.enemy && Hn(te.enemy.pos));
      (ze("hound_step", {
        pos: he,
        gain: 1,
        pitch: 0.8,
      }),
        ze("impact_metal", {
          pos: he,
          gain: 0.9,
          pitch: 0.7,
        }),
        ze("hurt", {
          gain: 0.6,
        }));
    }),
    ln("enemy:killed", (te) => {
      let he = te.enemy,
        pe = te.type || (he && he.type),
        ge = Hn(te.pos) || (he && Hn(he.pos));
      (he && Rs(he),
        ze(pe === "hound" ? "hound_die" : "gull_die", {
          pos: ge,
          gain: 1,
          jitter: 0.05,
        }));
    }),
    ln("explosion", (te) => {
      let he = pi(+te.size || 1, 0.3, 3),
        pe = Hn(te.pos);
      if (
        (ze("explosion", {
          pos: pe,
          gain: pi(0.6 + 0.25 * he, 0.5, 1.1),
          pitch: pi(1.12 - 0.1 * he, 0.8, 1.15),
          jitter: 0.04,
        }),
        pe)
      ) {
        let ge = Math.hypot(pe.x - re.x, pe.y - re.y, pe.z - re.z);
        Z = Math.max(Z, pi(1 - (ge - 5) / 10, 0, 0.8));
      }
      ((Y = Math.max(Y, 0.6)), (J = Math.min(J, 0.4)));
    }),
    ln("objective:done", (te) => {
      (ba(te),
        ze("objective", {
          delay: 0.35,
          gain: 1,
          jitter: 0,
        }));
    }),
    ln("objective:all", () =>
      ze("objective_all", {
        delay: 2.2,
        gain: 1,
        jitter: 0,
      }),
    ));
  let Zo = () => {
    let te = e.currentTime;
    te - _e > 6 &&
      ((_e = te),
      ze("complete", {
        gain: 1,
        jitter: 0,
      }));
  };
  (ln("extraction:reached", Zo),
    ln("thunder", (te) => {
      let he = pi(te.intensity != null ? +te.intensity : 0.6, 0.1, 1);
      ze("thunder", {
        variant: he > 0.6 ? 1 : 0,
        delay: 0.5 + (1 - he) * 2 + s() * 0.6,
        gain: 0.35 + 0.65 * he,
        jitter: 0.1,
      });
    }),
    ln("ui:click", () => ze("ui_click")),
    ln("ui:hover", () => ze("ui_hover")),
    ln("game:state", (te) => {
      let he = ee;
      if (((ee = te.state || ee), ee === "playing" && he !== "paused")) {
        ((Y = 0), (Z = 0), ya());
        for (let pe of [...pn.keys()]) pe.alive === !1 && Rs(pe);
      }
      (ee === "complete" && Zo(),
        ee === "paused" ? (ue = !0) : he === "paused" && (ue = !1));
    }),
    // M5：环境切换 → 音频天气层与音乐氛围。
    // 只在切换时调一次，不每帧轮询；实际增益由 lu() 每帧平滑推进。
    ln("environment:changed", (te) => {
      if (!te) return;
      te.weather && applyWeather(te.weather);
      te.timeOfDay && applyTimeOfDay(te.timeOfDay);
    }));
  function yr() {
    if ((($ = !0), e.state !== "running" && e.state !== "closed"))
      try {
        let te = e.resume();
        te && te.catch && te.catch(() => {});
      } catch {}
  }
  if (typeof window < "u" && !t) {
    let te = () => {
      if ((yr(), o()))
        for (let he of ["pointerdown", "keydown", "touchend", "mousedown"])
          window.removeEventListener(he, te, !0);
    };
    for (let he of ["pointerdown", "keydown", "touchend", "mousedown"])
      window.addEventListener(he, te, {
        capture: !0,
        passive: !0,
      });
    document.addEventListener("visibilitychange", () => {
      try {
        document.hidden ? e.suspend() : $ && e.resume();
      } catch {}
    });
  }
  function lu(te) {
    te = Math.min(Math.max(+te || 0, 0), 0.25);
    let he = i.camera,
      pe = e.listener;
    if (he && he.matrixWorld) {
      let De = he.matrixWorld.elements;
      ((re.x = De[12]),
        (re.y = De[13]),
        (re.z = De[14]),
        Number.isFinite(re.x + re.y + re.z + De[8] + De[4]) &&
          (pe.positionX
            ? ((pe.positionX.value = re.x),
              (pe.positionY.value = re.y),
              (pe.positionZ.value = re.z),
              (pe.forwardX.value = -De[8]),
              (pe.forwardY.value = -De[9]),
              (pe.forwardZ.value = -De[10]),
              (pe.upX.value = De[4]),
              (pe.upY.value = De[5]),
              (pe.upZ.value = De[6]))
            : (pe.setPosition(re.x, re.y, re.z),
              pe.setOrientation(
                -De[8],
                -De[9],
                -De[10],
                De[4],
                De[5],
                De[6],
              ))));
    }
    let ge = i.level && i.level.interiorBoxes;
    if (Array.isArray(ge) && ge.length) {
      let De = 0;
      for (let it = 0; it < ge.length; it++) {
        let gt = ge[it];
        if (
          gt &&
          gt.min &&
          gt.max &&
          re.x > gt.min.x &&
          re.x < gt.max.x &&
          re.y > gt.min.y - 0.5 &&
          re.y < gt.max.y &&
          re.z > gt.min.z &&
          re.z < gt.max.z
        ) {
          De = 1;
          break;
        }
      }
      B = De;
    }
    let ye = (De) => 1 - Math.exp(-te * De);
    if (
      ((P += (B - P) * ye(3)),
      (U.gain.value = 1 - 0.9 * P),
      (T.gain.value = P),
      !o())
    )
      return;
    Me();
    let Le = e.currentTime;
    le > R + 0.02 && Le - le > 0.1 && fo(0.9);
    let ke = ee === "playing" || ee === "intro";
    ((fe +=
      ((ue ? 0 : ee === "title" ? 0.6 : ee === "dead" ? 0.7 : 1) - fe) *
      ye(1.2)),
      (oe += ((ue ? 0 : 1) - oe) * ye(12)),
      (z.gain.value = oe),
      (Z += ((ee === "dead" ? 0.85 : 0) - Z) * ye(ee === "dead" ? 3 : 0.9)),
      (S.frequency.value = 2e4 * Math.pow(0.03, pi(Z, 0, 1))),
      (w.gain.value = me),
      (nn -= te) <= 0 && ((nn = 3 + s() * 6), (ut = 0.12 + s() * 0.88)),
      (pt += (ut - pt) * ye(0.5)),
      Oe.rain.setGain(fe * (1 - 0.93 * P) * 0.95 * weatherMul.rain),
      Oe.rainIn.setGain(fe * P * 0.95 * weatherMul.rain),
      Oe.wind.setGain(fe * (0.3 + 0.7 * pt) * (1 - 0.65 * P) * 0.75 * weatherMul.wind),
      Oe.wind.setPitch(0.9 + 0.25 * pt),
      Oe.sea.setGain(fe * (1 - 0.5 * P) * 1 * weatherMul.sea),
      Oe.sea.setPos([33, -1, pi(re.z, -28, 26)]),
      !ue &&
        (ke || ee === "title" || ee === "complete") &&
        Os(te, ee === "title" ? 0.7 : 1),
      ue || zo(te),
      (Y = Math.max(0, Y - te * (pn.size ? 0.045 : 0.14))));
    let ct =
      ke || ue ? Math.max(V, Re.autoIntensity ? Math.max(0.15, Y) : 0) : 0;
    if (
      ((L += (ct - L) * ye(2)),
      (J += (1 - J) * ye(3.5)),
      (O.gain.value = J * (ue ? 0.45 : 1)),
      Xe.on)
    ) {
      let De = we(L),
        it = ye(1 / 0.5),
        mood = MOOD_MUL[musicMood] || MOOD_MUL.calm;
      for (let gt = 0; gt < tm.length; gt++) {
        let Ot = Xe.layers[tm[gt]],
          // M5：按层名查 mood 倍率（不依赖 we() 的返回顺序）
          target = De[gt] * (mood[tm[gt]] || 1);
        ((Ot.c += (target - Ot.c) * it), (Ot.g.gain.value = Ot.c));
      }
    }
    for (let De of We)
      ((De.vC += (De.vT - De.vC) * ye(4)),
        (De.gC += (De.gT * De.vC - De.gC) * ye(De.rate)),
        (De.g.gain.value = De.gC),
        De.src &&
          Math.abs(De.pT - De.pC) > 1e-4 &&
          ((De.pC += (De.pT - De.pC) * ye(8)),
          (De.src.playbackRate.value = De.pC)));
  }
  async function de(te) {
    ((te = te || {}), await x);
    let he = e.sampleRate,
      pe = te.seconds || 10,
      ge = new OfflineAudioContext(2, he * pe, he),
      ye = new Map(),
      Le = {
        on(Tt, Ai) {
          (ye.has(Tt) || ye.set(Tt, []), ye.get(Tt).push(Ai));
        },
        emit(Tt, Ai) {
          for (let sn of ye.get(Tt) || []) sn(Ai);
        },
      },
      ke = new Float32Array(16);
    ((ke[0] = ke[5] = ke[10] = ke[15] = 1), (ke[13] = 1.7));
    let Ue = [
        {
          type: "gull",
          alive: !0,
          pos: {
            x: 6,
            y: 4,
            z: -9,
          },
        },
        {
          type: "hound",
          alive: !0,
          pos: {
            x: -8,
            y: 0,
            z: -14,
          },
        },
        {
          type: "gull",
          alive: !0,
          pos: {
            x: 0,
            y: 5,
            z: -30,
          },
        },
      ],
      ct = {
        min: {
          x: -99,
          y: -9,
          z: -99,
        },
        max: {
          x: 99,
          y: 99,
          z: 99,
        },
      },
      De = {
        events: Le,
        params: {},
        camera: {
          matrixWorld: {
            elements: ke,
          },
        },
        enemies: {
          list: [],
        },
        level: {
          interiorBoxes: te.interior
            ? [ct]
            : [
                {
                  min: {
                    x: 500,
                    y: 0,
                    z: 500,
                  },
                  max: {
                    x: 501,
                    y: 1,
                    z: 501,
                  },
                },
              ],
          objectives: [
            {
              id: "A",
              pos: {
                x: 4,
                y: 0,
                z: 3,
              },
            },
          ],
        },
      },
      it = u_(De, ge, {
        bufs: r,
      }),
      gt = 0.02,
      Ot = 0,
      xn = (Tt) => {
        let Ai = Tt * gt;
        if (
          (Tt === 0 &&
            Le.emit("game:state", {
              state: "playing",
            }),
          Ai < 3 &&
            Tt % 23 === 0 &&
            Le.emit("player:step", {
              surface: "concrete",
              sprint: !1,
            }),
          Tt === 150)
        ) {
          for (let sn of Ue)
            (De.enemies.list.push(sn),
              Le.emit("enemy:spawn", {
                enemy: sn,
              }));
          (Le.emit("enemy:alert", {
            enemy: Ue[0],
          }),
            it.setIntensity(1));
        }
        (Ai >= 3 &&
          Ai < 6 &&
          (Tt % 4 === 0 &&
            (Ai < 4.2 || Ai > 4.8) &&
            (Le.emit("weapon:fire", {}),
            Le.emit("impact", {
              point: {
                x: 4,
                y: 1,
                z: -12,
              },
              surface: Tt % 8 ? "metal" : "concrete",
              from: "player",
            }),
            Le.emit("shell:bounce", {
              pos: {
                x: 0.6,
                y: 0,
                z: 0.2,
              },
              surface: "concrete",
            })),
          Tt % 13 === 0 &&
            Le.emit("enemy:fire", {
              enemy: Ue[0],
              pos: Ue[0].pos,
              type: "gull",
            }),
          Tt % 17 === 0 &&
            Le.emit("enemy:fire", {
              enemy: Ue[1],
              pos: Ue[1].pos,
              type: "hound",
            }),
          Tt % 25 === 0 &&
            Le.emit("enemy:step", {
              pos: Ue[1].pos,
              type: "hound",
            })),
          Tt === 300 &&
            Le.emit("explosion", {
              pos: {
                x: 3,
                y: 0,
                z: -5,
              },
              size: 1.5,
            }),
          Tt === 350 &&
            Le.emit("player:hit", {
              amount: 20,
            }),
          Tt === 360 &&
            ((Ue[0].alive = !1),
            Le.emit("enemy:killed", {
              enemy: Ue[0],
              pos: Ue[0].pos,
              type: "gull",
            })),
          Tt === 400 &&
            (Le.emit("objective:done", {
              id: "A",
              index: 0,
              total: 3,
            }),
            it.setIntensity(0.15)));
      };
    for (let Tt = 1; Tt * gt < pe - 0.01; Tt++)
      ge.suspend(Tt * gt).then(() => {
        (xn(Tt), it.update(gt), Ot++, ge.resume());
      });
    (xn(0), it.update(gt));
    let $t = performance.now(),
      Ht = await ge.startRendering(),
      Je = performance.now() - $t,
      Pt = {
        interior: !!te.interior,
        renderMs: Math.round(Je),
        steps: Ot,
        peak: 0,
        over: 0,
        nan: 0,
        rmsDb: [],
        inst: it.debug(),
      },
      Vt = Ht.getChannelData(0),
      ss = Ht.getChannelData(1),
      Hs = Math.round(he / 2);
    for (let Tt = 0; Tt * Hs < Vt.length; Tt++) {
      let Ai = 0;
      for (let sn = Tt * Hs; sn < (Tt + 1) * Hs && sn < Vt.length; sn++) {
        let os = Vt[sn],
          rs = ss[sn];
        (!(Math.abs(os) < 1e9) || !(Math.abs(rs) < 1e9)) && Pt.nan++;
        let Ni = Math.max(Math.abs(os), Math.abs(rs));
        (Ni > Pt.peak && (Pt.peak = Ni),
          Ni >= 0.999 && Pt.over++,
          (Ai += os * os + rs * rs));
      }
      Pt.rmsDb.push(+(10 * Math.log10(Ai / (2 * Hs) + 1e-12)).toFixed(1));
    }
    return ((Pt.peak = +Pt.peak.toFixed(3)), Pt);
  }
  return (
    Object.assign(Re, {
      ctx: e,
      resume: yr,
      play: ze,
      loop: Be,
      update: lu,
      ready: x,
      selfTest: de,
      setIntensity(te) {
        V = pi(+te || 0, 0, 1);
      },
      setInterior(te) {
        B = pi(+te || 0, 0, 1);
      },
      setVolume(te) {
        ((me = pi(+te, 0, 1)),
          Number.isFinite(me) || (me = 0.9),
          (w.gain.value = me));
      },
      setPaused(te) {
        ue = !!te;
      },
      // M5：天气 → 雨/风/海层增益倍率。只改目标乘子，
      // 实际增益仍由 update() 每帧按 fe/P/pt 计算，避免被下一帧覆盖。
      setWeather: applyWeather,
      // M5：时间 → 音乐氛围倍率（calm/bright/warm/dark）
      setTimeOfDay: applyTimeOfDay,
      // 注：weather / musicMood 是实时值，不能用 Object.assign 的 getter
      // （assign 会把 getter 求值成快照），在下方用 defineProperties 定义。
      names: Object.keys(Go).filter((te) => !Go[te].ir),
      get intensity() {
        return L;
      },
      get interior() {
        return P;
      },
      debug() {
        let te = 0,
          he = e.currentTime;
        for (let pe in X) for (let ge of X[pe]) ge.end > he && te++;
        return {
          state: e.state,
          sampleRate: e.sampleRate,
          buffers: c,
          queued: d.length,
          genMs: Math.round(l),
          bootMs: Math.round(u),
          voices: te,
          loops: We.size,
          tracked: pn.size,
          music: Xe.on,
          intensity: +L.toFixed(2),
          interior: +P.toFixed(2),
          gameState: ee,
          reverb: [!!D.buffer, !!C.buffer],
        };
      },
    }),
    // M5：weather / musicMood 必须是实时 getter。
    // 前面用 Object.assign 定义 getter 会被求值成快照（assign 复制的是值），
    // 所以这里用 defineProperties 保留 getter 语义。
    Object.defineProperties(Re, {
      weather: {
        get() {
          return {
            rain: weatherMul.rain,
            wind: weatherMul.wind,
            sea: weatherMul.sea,
          };
        },
        enumerable: !0,
      },
      musicMood: {
        get() {
          return musicMood;
        },
        enumerable: !0,
      },
    }),
    Re
  );
}

export { createAudio };
