// DOM HUD, objective markers, damage feedback and radio subtitles.
import { Vector3 } from "../vendor/three-r180.js";

var tx = 4;

var nx = -90;

var WC = 450;

var GC = {
  0: "N",
  45: "NE",
  90: "E",
  135: "SE",
  180: "S",
  225: "SW",
  270: "W",
  315: "NW",
};

var ix = 2 * Math.PI * 19;

function createElement(i, e, t) {
  let n = document.createElement(i);
  return (e && (n.className = e), t != null && (n.innerHTML = t), n);
}

function createHUD(context) {
  let e = document.getElementById("ui"),
    t = createElement("div", "hud");
  t.setAttribute("aria-hidden", "true");
  let n = createElement("div", "h-compass"),
    s = createElement("div", "h-tape"),
    o = "";
  for (let k = nx; k <= WC; k += 5) {
    let ce = (k - nx) * tx,
      ve = ((k % 360) + 360) % 360,
      _e = ve % 45 === 0,
      Te = ve % 15 === 0;
    ((o += `<i class="${_e ? "mj" : Te ? "md" : "mn"}" style="left:${ce}px"></i>`),
      _e
        ? (o += `<b class="${ve % 90 === 0 ? "card" : "ic"}" style="left:${ce}px">${GC[ve]}</b>`)
        : ve % 15 === 0 &&
          (o += `<b class="num" style="left:${ce}px">${String(ve).padStart(3, "0")}</b>`));
  }
  s.innerHTML = o;
  let r = createElement("div", "h-tape-wrap");
  r.appendChild(s);
  let a = createElement("div", "h-cmarks"),
    l = createElement("div", "h-heading", "000");
  n.append(r, createElement("i", "h-needle"), a, l);
  let c = createElement(
      "div",
      "h-obj",
      '<div class="h-k">Objective</div><div class="h-obj-t"></div><div class="h-relays"><span>Relays</span><i></i><i></i><i></i><b>0/3</b></div>',
    ),
    u = c.querySelector(".h-obj-t"),
    h = c.querySelector(".h-relays"),
    f = h.querySelector("b"),
    p = [...h.querySelectorAll("i")],
    d = createElement("div", "h-warn"),
    v = createElement(
      "div",
      "h-cross",
      '<i class="c-t"></i><i class="c-b"></i><i class="c-l"></i><i class="c-r"></i><i class="c-dot"></i>',
    ),
    g = v.querySelectorAll("i"),
    x = createElement("div", "h-hit", "<i></i><i></i><i></i><i></i>"),
    y = createElement("div", "h-arcs"),
    b = [];
  for (let k = 0; k < 4; k++) {
    let ce = createElement(
      "div",
      "h-arc",
      '<svg viewBox="-100 -100 200 200"><path d="M -38 -84 A 92 92 0 0 1 38 -84" /><path class="tip" d="M -7 -97 L 0 -106 L 7 -97" /></svg>',
    );
    (y.appendChild(ce),
      b.push({
        el: ce,
        life: 0,
        src: new Vector3(),
        op: -1,
        rot: 1e9,
      }));
  }
  let m = createElement(
      "div",
      "h-prompt",
      `<svg viewBox="-24 -24 48 48"><circle class="bg" r="19"/><circle class="fg" r="19" stroke-dasharray="${ix.toFixed(2)}" stroke-dashoffset="${ix.toFixed(2)}" transform="rotate(-90)"/></svg><span class="h-key">E</span><span class="h-plabel"></span>`,
    ),
    A = m.querySelector(".fg"),
    _ = m.querySelector(".h-key"),
    M = m.querySelector(".h-plabel"),
    E = createElement("div", "h-feed"),
    w = createElement("div", "h-msg"),
    S = createElement(
      "div",
      "h-health",
      '<div class="h-k">Vitals</div><div class="h-hp-row"><b class="h-hp-n">100</b><div class="h-hp-bar">' +
        "<i></i>".repeat(10) +
        "</div></div>",
    ),
    z = S.querySelector(".h-hp-n"),
    H = [...S.querySelectorAll(".h-hp-bar i")],
    O = createElement(
      "div",
      "h-ammo",
      '<div class="h-cue"></div><div class="h-ammo-row"><b class="h-ammo-n">30</b><span class="h-ammo-r">120</span></div><div class="h-pips"></div><div class="h-wname"></div>',
    ),
    q = O.querySelector(".h-ammo-n"),
    U = O.querySelector(".h-ammo-r"),
    T = O.querySelector(".h-pips"),
    D = O.querySelector(".h-wname"),
    C = O.querySelector(".h-cue"),
    G = createElement("div", "h-marks");
  (t.append(G, n, c, d, y, v, x, m, E, w, S, O), e.appendChild(t));
  let j = createElement(
    "div",
    "comms",
    '<span class="comms-who">Control</span><span class="comms-t"></span>',
  );
  (j.setAttribute("role", "status"), j.setAttribute("aria-live", "polite"));
  let N = j.querySelector(".comms-t");
  e.appendChild(j);
  let Q = !1,
    K = 420,
    ie = innerWidth,
    F = innerHeight,
    X = {
      ammo: -1,
      mag: -1,
      reserve: -1,
      name: null,
      cue: null,
      low: null,
      hp: -1,
      hpSeg: -1,
      hurt: null,
      head: -1,
      tapeX: 1e9,
      gap: -1,
      crossOn: null,
      promptOn: null,
      promptText: null,
      promptT: -1,
      promptKey: null,
      marksOn: null,
      done: -1,
      total: -1,
    },
    ne = [],
    re = "",
    $ = 0,
    ue = 0,
    me = [],
    ee = null,
    B = 0,
    P = 0,
    V = 0,
    Y = 0,
    L = 0,
    Z = [],
    J = [],
    oe = new Vector3(),
    fe = null,
    le = -1;
  function R() {
    ((ie = innerWidth),
      (F = innerHeight),
      (K = n.clientWidth || Math.min(420, ie * 0.6)),
      (X.tapeX = 1e9),
      (X.gap = -1));
    for (let k of J) ((k.lastC = 1e9), (k.lastW = ""));
  }
  (addEventListener("resize", R),
    context.events.on("player:hitEnemy", (k) => {
      (I.hitmarker(
        k && k.killed
          ? "kill"
          : k && (k.weak || k.part === "weak")
            ? "weak"
            : "hit",
      ),
        k &&
          k.killed &&
          k.weak &&
          fe &&
          le === context.time.frame &&
          !fe.weak &&
          ((fe.weak = !0), (fe.el.innerHTML += "<em>Weak point</em>")));
    }),
    context.events.on("enemy:killed", (k) => {
      let ce = String(
        (k && (k.type || (k.enemy && k.enemy.type))) || "machine",
      ).toUpperCase();
      ((fe = I.feed(`<b>${ce}</b> destroyed`)), (le = context.time.frame));
    }),
    context.events.on("player:hit", (k) => {
      if (!k || !k.fromPos) return;
      let ce = b[0];
      for (let ve of b) {
        if (ve.life <= 0) {
          ce = ve;
          break;
        }
        ve.life < ce.life && (ce = ve);
      }
      (ce.src.copy(k.fromPos), (ce.life = 1.5), (ce.max = 1.5));
    }));
  let I = {
    root: t,
    show(k) {
      ((k = !!k), k !== Q && ((Q = k), t.classList.toggle("on", k), k && R()));
    },
    setObjective(k) {
      ((k = k || ""),
        k !== re &&
          ((re = k),
          ($ = 0),
          (ue = 0),
          (u.textContent = ""),
          c.classList.toggle("has", !!k),
          c.classList.remove("flash"),
          c.offsetWidth,
          c.classList.add("flash")));
    },
    setRelays(k, ce) {
      if (!(k === X.done && ce === X.total)) {
        if (ce !== X.total) {
          (p.forEach((ve) => ve.remove()), (p = []));
          for (let ve = 0; ve < ce; ve++) {
            let _e = document.createElement("i");
            (h.insertBefore(_e, f), p.push(_e));
          }
        }
        ((X.done = k),
          (X.total = ce),
          p.forEach((ve, _e) => ve.classList.toggle("cut", _e < k)),
          (f.textContent = `${k}/${ce}`),
          h.classList.toggle("all", k >= ce && ce > 0));
      }
    },
    setMarkers(k) {
      for (let ce of J) (ce.cEl.remove(), ce.wEl.remove());
      J = (k || []).map((ce) => {
        let ve = createElement(
            "div",
            "h-cm " + (ce.kind || "relay"),
            `<i></i><b>${ce.short || ""}</b><span></span>`,
          ),
          _e = createElement(
            "div",
            "h-wm " + (ce.kind || "relay"),
            `<i></i><b>${ce.short || ""}</b><span></span>`,
          );
        return (
          a.appendChild(ve),
          G.appendChild(_e),
          {
            ...ce,
            cEl: ve,
            wEl: _e,
            cDist: ve.querySelector("span"),
            wDist: _e.querySelector("span"),
            lastD: -1,
            lastC: 1e9,
            lastW: "",
            vis: null,
          }
        );
      });
    },
    setPrompt(k, ce = 0) {
      let ve = !!k;
      if (
        (ve !== X.promptOn &&
          ((X.promptOn = ve),
          m.classList.toggle("on", ve),
          context.input.setPrompt && context.input.setPrompt(ve)),
        !ve)
      )
        return;
      let _e = context.input.touch
        ? "USE"
        : context.input.gamepad && !context.input.locked
          ? "Y"
          : "E";
      _e !== X.promptKey &&
        ((X.promptKey = _e),
        (_.textContent = _e),
        _.classList.toggle("wide", _e.length > 1));
      let Te = `Hold ${_e} \u2014 ${k}`;
      Te !== X.promptText && ((X.promptText = Te), (M.textContent = Te));
      let Pe = Math.round(ce * 200) / 200;
      Pe !== X.promptT &&
        ((X.promptT = Pe),
        A.setAttribute("stroke-dashoffset", (ix * (1 - Pe)).toFixed(2)),
        m.classList.toggle("busy", Pe > 0));
    },
    radio(k, ce = 4.5) {
      k &&
        me.push({
          text: k,
          secs: ce,
        });
    },
    clearRadio() {
      ((me.length = 0), (ee = null), j.classList.remove("on"));
    },
    warn(k, ce = 3) {
      ((d.textContent = k),
        (Y = ce),
        d.classList.remove("on"),
        d.offsetWidth,
        d.classList.add("on"));
    },
    message(k, ce = 3) {
      ((w.textContent = k || ""),
        (L = k ? ce : 0),
        w.classList.toggle("on", !!k));
    },
    feed(k) {
      let ce = createElement("div", "h-fl", k);
      E.appendChild(ce);
      let ve = {
        el: ce,
        life: 4.2,
        weak: !1,
      };
      for (Z.push(ve); Z.length > 4;) Z.shift().el.remove();
      return ve;
    },
    hitmarker(k = "hit") {
      x.className = "h-hit " + k;
      let ce = k === "weak" || k === "kill" ? 1.5 : 1.15;
      try {
        x.animate(
          [
            {
              opacity: 1,
              transform: `translate(-50%,-50%) scale(${ce})`,
            },
            {
              opacity: 1,
              transform: "translate(-50%,-50%) scale(1)",
              offset: 0.35,
            },
            {
              opacity: 0,
              transform: "translate(-50%,-50%) scale(0.92)",
            },
          ],
          {
            duration: k === "kill" ? 420 : 240,
            easing: "ease-out",
          },
        );
      } catch {}
    },
    reset() {
      ((me.length = 0), (ee = null), j.classList.remove("on"));
      for (let k of Z) k.el.remove();
      Z.length = 0;
      for (let k of b) k.life = 0;
      ((Y = 0),
        d.classList.remove("on"),
        I.message(""),
        I.setPrompt(null),
        I.setObjective(""),
        (X.hp = -1));
    },
    update: se,
  };
  function se(k) {
    if ((ae(k), !Q)) return;
    let ce = context.player,
      ve = context.weapon || {},
      _e = context.camera,
      Te = ce.ads || 0,
      Pe = ((-ce.yaw * 180) / Math.PI) % 360;
    Pe < 0 && (Pe += 360);
    let Re = Math.round((K / 2 - (Pe - nx) * tx) * 2) / 2;
    Re !== X.tapeX &&
      ((X.tapeX = Re), (s.style.transform = `translate3d(${Re}px,0,0)`));
    let Fe = Math.round(Pe) % 360;
    Fe !== X.head &&
      ((X.head = Fe), (l.textContent = String(Fe).padStart(3, "0")));
    let ze = Te < 0.5;
    if (
      (ze !== X.marksOn && ((X.marksOn = ze), G.classList.toggle("off", !ze)),
      J.length)
    ) {
      (_e.updateMatrixWorld(),
        _e.matrixWorldInverse.copy(_e.matrixWorld).invert());
      let we = K / 2 - 14;
      for (let be of J) {
        let Oe = be.pos.x - ce.pos.x,
          pt = be.pos.z - ce.pos.z,
          ut = Math.round(Math.hypot(Oe, pt));
        if (ut !== be.lastD) {
          be.lastD = ut;
          let Un = ut + "m";
          ((be.cDist.textContent = Un), (be.wDist.textContent = Un));
        }
        let nn = (Math.atan2(Oe, -pt) * 180) / Math.PI - Pe;
        nn = ((nn + 540) % 360) - 180;
        let bt = Math.round(Math.max(-we, Math.min(we, nn * tx)));
        (bt !== be.lastC &&
          ((be.lastC = bt),
          (be.cEl.style.transform = `translate3d(${bt}px,0,0)`),
          be.cEl.classList.toggle("edge", Math.abs(bt) >= we)),
          oe
            .set(
              be.pos.x,
              be.pos.y + (be.kind === "extract" ? 1.2 : 1.9),
              be.pos.z,
            )
            .project(_e));
        let Os,
          pn,
          Ti = !1;
        if (
          (oe.z > 1 && ((Ti = !0), (oe.x = -oe.x), (oe.y = -oe.y)),
          Ti || Math.abs(oe.x) > 0.9 || Math.abs(oe.y) > 0.82)
        ) {
          Ti = !0;
          let Un = Math.max(Math.abs(oe.x) / 0.9, Math.abs(oe.y) / 0.82, 0.001);
          if (((oe.x /= Un), (oe.y /= Un), oe.z > 1)) {
            let zo = Math.max(Math.abs(oe.x) / 0.9, Math.abs(oe.y) / 0.82);
            zo < 0.999 && ((oe.x /= zo), (oe.y /= zo));
          }
        }
        ((Os = Math.round((oe.x * 0.5 + 0.5) * ie)),
          (pn = Math.round((-oe.y * 0.5 + 0.5) * F)));
        let ho = !Ti && Math.hypot(oe.x, oe.y * 0.6) < 0.16,
          Rs =
            Os +
            "," +
            pn +
            (Ti ? "o" : "") +
            (ut < 3 ? "n" : "") +
            (ho ? "d" : "");
        Rs !== be.lastW &&
          ((be.lastW = Rs),
          (be.wEl.style.transform = `translate3d(${Os}px,${pn}px,0)`),
          be.wEl.classList.toggle("offscreen", Ti),
          be.wEl.classList.toggle("near", ut < 3),
          be.wEl.classList.toggle("dim", ho));
      }
    }
        let We = Te <= 0.6 && ce.alive && ve.state !== "reloading_hidden";
    if (
      (We !== X.crossOn && ((X.crossOn = We), v.classList.toggle("off", !We)),
      We)
    ) {
      // M2：准星间距与实际弹道一致。weapon.js#Be() 用
      // ve.spread * perception.spreadScale 算弹道，这里必须同步，
      // 否则 heavyRain 下准星比实际弹道紧 15%。
      let spreadScale =
          (context.environment &&
            context.environment.perception &&
            context.environment.perception.spreadScale) ||
          1,
        we = (typeof ve.spread == "number" ? ve.spread : 0.012) * spreadScale,
        be = (_e.fov * Math.PI) / 360,
        Oe =
          (Math.tan(we) / Math.tan(be)) * (F / 2) + 4 + (ce.sprinting ? 10 : 0);
      ((Oe = Math.round(Math.max(4, Math.min(70, Oe)) * 2) / 2),
        Oe !== X.gap &&
          ((X.gap = Oe),
          (g[0].style.transform = `translate3d(-50%,${-Oe}px,0) translateY(-100%)`),
          (g[1].style.transform = `translate3d(-50%,${Oe}px,0)`),
          (g[2].style.transform = `translate3d(${-Oe}px,-50%,0) translateX(-100%)`),
          (g[3].style.transform = `translate3d(${Oe}px,-50%,0)`)));
    }
    let Ne = Math.max(1, Math.min(60, ve.magSize | 0 || 30)),
      dt = Math.max(0, ve.ammo | 0),
      xe = Math.max(0, ve.reserve | 0);
    if (
      (Ne !== X.mag &&
        ((X.mag = Ne),
        (T.innerHTML = "<i></i>".repeat(Ne)),
        (ne = [...T.children]),
        (X.ammo = -1)),
      dt !== X.ammo)
    ) {
      ((X.ammo = dt), (q.textContent = String(dt).padStart(2, "0")));
      for (let we = 0; we < ne.length; we++)
        ne[we].className = we < dt ? "" : "off";
    }
    (xe !== X.reserve &&
      ((X.reserve = xe), (U.textContent = String(xe).padStart(3, "0"))),
      ve.name !== X.name &&
        ((X.name = ve.name), (D.textContent = ve.name || "")));
    let Ie = dt <= Math.ceil(Ne * 0.27),
      Be =
        ve.state === "reloading"
          ? "Reloading"
          : dt === 0
            ? xe > 0
              ? context.input.touch
                ? "Reload"
                : "R \u2014 Reload"
              : "Empty"
            : Ie
              ? "Low ammo"
              : "";
    (Be !== X.cue &&
      ((X.cue = Be),
      (C.textContent = Be),
      (C.className =
        "h-cue" +
        (Be ? " on" : "") +
        (dt === 0 && ve.state !== "reloading" ? " urgent" : ""))),
      Ie !== X.low && ((X.low = Ie), O.classList.toggle("low", Ie)));
    let Xe = Math.max(0, Math.ceil(ce.health)),
      Me = ce.health < ce.maxHealth - 0.5;
    if (Xe !== X.hp) {
      ((X.hp = Xe), (z.textContent = String(Xe)));
      let we = Math.ceil((Xe / ce.maxHealth) * H.length);
      if (we !== X.hpSeg) {
        X.hpSeg = we;
        for (let be = 0; be < H.length; be++)
          H[be].className = be < we ? "" : "off";
        S.classList.toggle("crit", we <= 3);
      }
    }
    Me !== X.hurt && ((X.hurt = Me), S.classList.toggle("on", Me));
    for (let we of b) {
      if (we.life <= 0) {
        we.op !== 0 && ((we.op = 0), (we.el.style.opacity = "0"));
        continue;
      }
      we.life -= k;
      let be = Math.atan2(we.src.x - ce.pos.x, -(we.src.z - ce.pos.z)) + ce.yaw,
        Oe = Math.round((be * 180) / Math.PI);
      Oe !== we.rot &&
        ((we.rot = Oe),
        (we.el.style.transform = `translate(-50%,-50%) rotate(${Oe}deg)`));
      let pt = Math.round(Math.min(1, Math.max(0, we.life / 0.6)) * 20) / 20;
      pt !== we.op && ((we.op = pt), (we.el.style.opacity = String(pt)));
    }
    if ($ < re.length) {
      ue += k * 46;
      let we = Math.min(re.length, Math.floor(ue));
      we !== $ && (($ = we), (u.textContent = re.slice(0, we)));
    }
    (Y > 0 && ((Y -= k), Y <= 0 && d.classList.remove("on")),
      L > 0 && ((L -= k), L <= 0 && w.classList.remove("on")));
    for (let we = Z.length - 1; we >= 0; we--) {
      let be = Z[we];
      ((be.life -= k),
        be.life <= 0
          ? (be.el.remove(), Z.splice(we, 1))
          : be.life < 0.6 &&
            !be.out &&
            ((be.out = !0), be.el.classList.add("out")));
    }
  }
  function ae(k) {
    if (!ee) {
      if (!me.length) return;
      ((ee = me.shift()),
        (B = 0),
        (P = 0),
        (V = ee.secs),
        (N.textContent = ""),
        j.classList.add("on"),
        context.events.emit("radio:line", {
          text: ee.text,
        }));
    }
    let ce = ee.text;
    if (B < ce.length) {
      P += k * 58;
      let ve = Math.min(ce.length, Math.floor(P));
      ve !== B && ((B = ve), (N.textContent = ce.slice(0, ve)));
    } else
      ((V -= k),
        V <= 0 && ((ee = null), me.length || j.classList.remove("on")));
  }
  return (R(), I);
}

export { createHUD, createElement };
