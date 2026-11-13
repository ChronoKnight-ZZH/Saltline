// Weapon state, firing, reloading, view model and animation integration.
import {
  Color,
  Euler,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  defineModuleExports,
} from "../vendor/three-r180.js";
import { vf, zc } from "../core/config.js";
import { clamp, damp, lerp, saturate } from "../core/math.js";
import { Kc, mi, w_ } from "./geometry.js";
import { Bf, F_, N_, U_, Vv, Wv } from "./rig.js";

var weaponShowcaseModule = {};

defineModuleExports(weaponShowcaseModule, {
  create: () => createWeapon,
  showcase: () => showcaseWeapon,
});

var gi = Vector3;

var fm = Quaternion;

var Gv = 30;

var B_ = 150;

var O_ = 720;

var H_ = 26;

var V_ = 300;

var eu = {
  p: [0.118, -0.122, -0.275],
  r: [0.034, 0.085, -0.03],
};

var qv = {
  p: [0, -mi.sightY, -0.135],
  r: [0, 0, 0],
};

var tu = {
  p: [-0.035, 0.004, 0.03],
  r: [-0.04, 0.62, 0.26],
};

var nu = {
  p: [-0.03, 0.1, -0.02],
  r: [0.46, 0.22, -0.8],
};

var W_ = 2.1;

var G_ = 2.72;

var Yo = (i) => ((i = saturate(i)), i * i * i * (i * (6 * i - 15) + 10));

var pa = (i, e) => ({
  x: 0,
  v: 0,
  k: i,
  c: e,
});

function ma(i, e, t) {
  let n = t > 0.012 ? Math.ceil(t / 0.008) : 1,
    s = t / n;
  for (let o = 0; o < n; o++)
    ((i.v += ((e - i.x) * i.k - i.v * i.c) * s), (i.x += i.v * s));
  return i.x;
}

var i0 = (i, e, t, n = "XYZ") => new fm().setFromEuler(new Euler(i, e, t, n));

async function createWeapon(context) {
  let e = new Group();
  e.name = "viewmodel-pac9";
  let t = w_(),
    n = {
      anodized_black: 2,
      gunmetal: 2,
      brass: 4,
      glove_fabric: 3,
      rubber: 4,
    },
    s = (Me) =>
      context.mats.get(Me, {
        triplanar: !0,
        vertexColors: !0,
        scale: n[Me] || 1,
      }),
    o = (Me, we) => {
      let be = new Mesh(Me, we);
      return (
        (be.castShadow = !1),
        (be.receiveShadow = !0),
        (be.frustumCulled = !1),
        be
      );
    },
    r = new MeshStandardMaterial({
      color: new Color(0.0085, 0.009, 0.0105),
      roughness: 0.4,
      metalness: 0.45,
      vertexColors: !0,
    });
  ((r.name = "pac9_anodised"), Bf(r, 0));
  let a = new MeshStandardMaterial({
    color: 16777215,
    roughness: 0.92,
    metalness: 0,
    vertexColors: !0,
  });
  a.name = "pac9_matte";
  let l = new MeshStandardMaterial({
    color: new Color(0.016, 0.016, 0.0165),
    roughness: 0.5,
    metalness: 0.7,
    vertexColors: !0,
  });
  ((l.name = "pac9_phosphate"), Bf(l, 1));
  let c = new MeshStandardMaterial({
    color: new Color(0.0125, 0.0128, 0.0135),
    roughness: 0.62,
    metalness: 0,
    vertexColors: !0,
  });
  ((c.name = "pac9_polymer"), Bf(c, 2));
  let u = new MeshStandardMaterial({
    color: new Color(0.105, 0.08, 0.05),
    roughness: 0.62,
    metalness: 0,
    vertexColors: !0,
  });
  ((u.name = "pac9_polymer_tan"),
    Bf(u, 2),
    e.add(o(t.ano, r), o(t.gun, l), o(t.poly, c), o(t.plain, a)));
  let h = o(t.bolt, l);
  e.add(h);
  let f = new Group(),
    p = new gi().fromArray(mi.magPos);
  f.position.copy(p);
  let d = o(t.round, s("brass"));
  (f.add(o(t.mag, u), d), e.add(f));
  let v = null,
    g = null,
    x = null;
  try {
    ((v = F_([
      ["model", -0.0168, -0.0315, 0.064, 0.0095, "L"],
      ["maker", -0.0168, -0.042, 0.064, 0.003, "L"],
      ["cal", -0.0168, -0.0465, 0.064, 0.0028, "L"],
      ["prop", -0.0168, -0.071, 0.066, 0.0026, "L"],
      ["auto", -0.0168, -0.027, -0.0335, 0.0036, "L"],
      ["semi", -0.0168, -0.0262, -0.049, 0.0036, "L"],
      ["safe", -0.0168, -0.0362, -0.062, 0.0036, "L"],
      ["rack", -0.0168, -0.004, -0.205, 0.02, "L"],
      ["warn", -0.0181, -0.01, 0.03, 0.0062, "L"],
      ["optic", -0.0195, 0.0735, 0.021, 0.0024, "L"],
      ["model", 0.0168, -0.0315, 0.068, 0.0095, "R"],
      ["warn", 0.0168, -0.066, 0.066, 0.0075, "R"],
      ["rack", 0.0168, -0.004, -0.205, 0.02, "R"],
      ["auto", 0.0168, -0.027, -0.0335, 0.0036, "R"],
      ["safe", 0.0168, -0.0362, -0.062, 0.0036, "R"],
      ["optic", 0.0195, 0.0735, 0.021, 0.0024, "R"],
      ["cal", 0.0181, 0.0245, -0.055, 0.0026, "R"],
      ["r2", 0, 0.04365, -0.0816, 0.003, "T"],
      ["r4", 0, 0.04365, -0.0616, 0.003, "T"],
      ["r6", 0, 0.04365, 0.0584, 0.003, "T"],
      ["r8", 0, 0.04365, 0.0784, 0.003, "T"],
      ["r10", 0, 0.04365, 0.0984, 0.003, "T"],
      ["r12", 0, 0.04365, 0.1184, 0.003, "T"],
    ])),
      (v.castShadow = !1),
      (v.receiveShadow = !0),
      (v.frustumCulled = !1),
      e.add(v));
  } catch (Me) {
    console.warn("[weapon] markings skipped: " + Me);
  }
  ((g = U_(
    mi.window.map((Me) => [
      Me[0] * 1.01,
      (Me[1] - mi.sightY) * 1.01 + mi.sightY,
    ]),
    mi.lensF + 0.0025,
  )),
    (g.frustumCulled = !1),
    e.add(g),
    (x = N_()),
    x.position.fromArray(mi.muzzle),
    (x.visible = !1),
    e.add(x));
  let y = (Me, we, be) => {
      let Oe = new gi(we[0], we[1], we[2])
        .normalize()
        .applyQuaternion(Me.clone().invert());
      return (be && (Oe.x *= -1), [Oe.x, Oe.y, Oe.z]);
    },
    b = i0(-0.24, 0, 0).multiply(i0(0, 0, -Math.PI / 2)),
    m = Vv({
      mirror: !1,
      fingers: [
        null,
        [0.62, 1.72, 0.8, 0],
        [0.68, 1.7, 0.8, -0.03],
        [0.74, 1.66, 0.8, -0.09],
      ],
      indexPoses: [
        [0.1, 0.16, 0.1, 0.05],
        [0.46, 1.15, 0.5, 0],
      ],
      thumb: [
        y(b, [-0.85, 0.05, -0.5]),
        y(b, [-0.6, -0.05, -0.8]),
        y(b, [-0.05, -0.2, -0.97]),
      ],
      forearm: y(b, [0.27, -0.44, 0.86]),
      sleeve: 0.34,
    }),
    A = new Group();
  (A.quaternion.copy(b),
    A.position
      .fromArray(mi.grip)
      .sub(new gi(0.006, -0.031, -0.085).applyQuaternion(b)));
  let _ = s("glove_fabric");
  A.add(o(m.fabric, _));
  let M = o(m.index[0].clone(), _);
  (A.add(M), e.add(A));
  let E = m.index[0].attributes,
    w = m.index[1].attributes,
    S = -1;
  function z(Me) {
    if (Math.abs(Me - S) < 0.004) return;
    S = Me;
    let we = M.geometry.attributes.position,
      be = M.geometry.attributes.normal,
      Oe = E.position.array,
      pt = w.position.array,
      ut = E.normal.array,
      nn = w.normal.array;
    for (let bt = 0; bt < Oe.length; bt++)
      ((we.array[bt] = Oe[bt] + (pt[bt] - Oe[bt]) * Me),
        (be.array[bt] = ut[bt] + (nn[bt] - ut[bt]) * Me));
    ((we.needsUpdate = !0), (be.needsUpdate = !0));
  }
  let H = i0(0, 0, Math.PI / 2).multiply(i0(0.06, 0, 0)),
    O = Vv({
      mirror: !0,
      fingers: [
        [1.27, 1.42, 0.75, 0.02],
        [1.3, 1.45, 0.75, 0],
        [1.3, 1.45, 0.75, -0.02],
        [1.33, 1.45, 0.75, -0.05],
      ],
      thumb: [
        y(H, [0, 0.25, -0.97], !0),
        y(H, [0.05, 0.1, -0.99], !0),
        y(H, [0, 0, -1], !0),
      ],
      forearm: y(H, [-0.5, -0.35, 0.79], !0),
      sleeve: 0.34,
    }),
    q = new Group();
  (q.add(o(O.fabric, _)), e.add(q));
  let U = new gi(0, -0.015, -0.055),
    T = (Me, we, be = U) => ({
      q: Me.clone(),
      p: new gi(we[0], we[1], we[2]).sub(be.clone().applyQuaternion(Me)),
    }),
    D = (Me, we, be, Oe, pt = null) => ({
      q: pt ? pt.clone() : Me.q.clone(),
      p: Me.p.clone().add(new gi(we, be, Oe)),
    }),
    C = i0(0, 0, Math.PI / 2).multiply(i0(0.12, 0, 0)),
    G = T(H, [-0.015, -0.062, -0.236]),
    j = T(C, [-0.0135, -0.15, -0.0745]),
    N = D(j, -0.035, -0.02, 0.01),
    Q = D(j, -0.06, -0.3, 0.13, C.clone().multiply(i0(-0.5, 0, 0.25))),
    K = D(j, 0, -0.035, 0.004),
    ie = D(j, -0.004, -0.06, 0),
    F = D(j, 0, -0.012, 0),
    X = i0(-0.6, 0, 0).multiply(
      new fm().setFromRotationMatrix(
        new Matrix4().makeBasis(
          new gi(0, 0, 1),
          new gi(-1, 0, 0),
          new gi(0, -1, 0),
        ),
      ),
    ),
    ne = T(
      X,
      [mi.handlePos[0] - 0.004, mi.handlePos[1], mi.handlePos[2]],
      new gi(0, -0.024, -0.118),
    ),
    re = D(ne, 0, 0, mi.boltTravel),
    $ = [
      [0, G],
      [0.1, G],
      [0.36, N],
      [0.44, j],
      [0.5, j],
      [0.8, Q],
      [0.98, Q],
      [1.28, K],
      [1.35, j],
      [1.45, ie],
      [1.52, F],
      [1.62, j],
      [1.7, N],
      [2.02, G],
      [9, G],
    ],
    ue = [
      ...$.slice(0, 12),
      [1.7, N],
      [1.96, ne],
      [2.02, ne],
      [2.14, re],
      [2.19, re],
      [2.26, ne],
      [2.36, ne],
      [2.66, G],
      [9, G],
    ],
    me = 0.47,
    ee = 1.345,
    B = 2.02,
    P = 2.14,
    V = 2.19,
    Y = new gi(),
    L = new fm(),
    Z = new fm(),
    J = new gi(),
    oe = new gi(),
    fe = new gi();
  function le(Me, we) {
    let be = 0;
    for (; be < Me.length - 2 && we > Me[be + 1][0];) be++;
    let Oe = Me[be],
      pt = Me[be + 1],
      ut = Yo((we - Oe[0]) / Math.max(1e-4, pt[0] - Oe[0]));
    (Y.copy(Oe[1].p).lerp(pt[1].p, ut), L.copy(Oe[1].q).slerp(pt[1].q, ut));
  }
  (q.position.copy(G.p), q.quaternion.copy(G.q));
  let R = C.clone().invert();
  (e.traverse((Me) => {
    Me.layers.set(zc);
  }),
    context.camera.add(e));
  let I =
      Object.values(t).reduce((Me, we) => Me + Kc(we), 0) +
      Kc(m.fabric) +
      Kc(m.index[0]) +
      Kc(O.fabric) +
      (v ? Kc(v.geometry) : 0) +
      2,
    se = 0;
  (e.traverse((Me) => {
    Me.isMesh && se++;
  }),
    console.log(
      `[weapon] ${mi.name}: ${Math.round(I)} tris, ${se} meshes (flash only while firing)`,
    ));
  let ae = context.rng && context.rng.fork ? context.rng.fork() : Math.random,
    k = {
      t: 0,
      cooldown: 0,
      prevFire: !1,
      dryDone: !1,
      autoReload: -1,
      reload: null,
      burst: 0,
      lastShot: -9,
      bloom: 0,
      heat: 0,
      smoke: 0,
      smokeTick: 0,
      adsLin: 0,
      adsE: 0,
      sprintT: 0,
      reloadW: 0,
      rackW: 0,
      bobPhase: 0,
      bobAmt: 0,
      finger: 0,
      boltT: 9,
      boltLocked: !1,
      flashT: 0,
      flashDur: 0.05,
      recPhase: 0,
      wasGround: !0,
      lastVy: 0,
      spreadS: 0.0125,
      idleT: 0,
      inspect: -1,
      kZ: pa(520, 30),
      kP: pa(380, 26),
      kY: pa(300, 22),
      kR: pa(300, 20),
      swY: pa(110, 15),
      swP: pa(110, 15),
      jY: pa(140, 13),
      jP: pa(140, 13),
      bump: pa(600, 30),
    },
    ce = {
      freeze: !1,
      reloadT: null,
      empty: !1,
      flash: !1,
      noFire: !1,
    },
    ve = {
      name: mi.name,
      ammo: Gv,
      magSize: Gv,
      reserve: B_,
      state: "idle",
      ads: 0,
      spread: 0.0125,
      damage: H_,
      rpm: O_,
      root: e,
      debug: ce,
      info: {
        tris: Math.round(I),
        meshes: se,
      },
      update: Xe,
      reset: _e,
      setVisible(Me) {
        e.visible = !!Me;
      },
      muzzleWorld: Re,
      reloadNow: Fe,
      addAmmo(Me) {
        ve.reserve += Me;
      },
      setWetness(Me) {
        Wv.value = Math.max(0, Math.min(1, +Me || 0));
      },
      snap() {
        k.adsLin = context.input.ads ? 1 : 0;
        for (let Me of [
          "kZ",
          "kP",
          "kY",
          "kR",
          "swY",
          "swP",
          "jY",
          "jP",
          "bump",
        ])
          ((k[Me].x = 0), (k[Me].v = 0));
        k.sprintT = context.player.sprinting ? 1 : 0;
      },
    };
  function _e() {
    ((ve.ammo = Gv),
      (ve.reserve = B_),
      (ve.state = "idle"),
      (ve.ads = 0),
      Object.assign(k, {
        cooldown: 0,
        prevFire: !1,
        dryDone: !1,
        autoReload: -1,
        reload: null,
        burst: 0,
        lastShot: -9,
        bloom: 0,
        heat: 0,
        smoke: 0,
        adsLin: 0,
        adsE: 0,
        sprintT: 0,
        reloadW: 0,
        boltT: 9,
        boltLocked: !1,
        flashT: 0,
        idleT: 0,
        inspect: -1,
      }));
    for (let Me of ["kZ", "kP", "kY", "kR", "swY", "swP", "jY", "jP", "bump"])
      ((k[Me].x = 0), (k[Me].v = 0));
    ((d.visible = !0),
      (f.visible = !0),
      f.position.copy(p),
      f.quaternion.identity(),
      q.position.copy(G.p),
      q.quaternion.copy(G.q));
  }
  let Te = new Matrix4();
  function Pe(Me, we) {
    (e.updateMatrix(), we.fromArray(Me).applyMatrix4(e.matrix));
    let be = context.camera,
      Oe =
        Math.tan((be.fov * Math.PI) / 360) /
        Math.tan((context.viewCamera.fov * Math.PI) / 360);
    return (
      (we.x *= Oe),
      (we.y *= Oe),
      we.applyQuaternion(be.quaternion).add(be.position)
    );
  }
  function Re(Me = new gi()) {
    return Pe(mi.muzzle, Me);
  }
  function Fe() {
    if (k.reload || ve.ammo >= ve.magSize || ve.reserve <= 0) return !1;
    let Me = ve.ammo <= 0;
    return (
      (k.reload = {
        t: 0,
        T: Me ? G_ : W_,
        empty: Me,
        f: {},
      }),
      (k.autoReload = -1),
      context.events.emit("weapon:reload", {
        phase: "start",
        empty: Me,
      }),
      !0
    );
  }
  let ze = new gi(),
    We = new gi(),
    Ne = new gi(),
    dt = new gi(),
    xe = new gi(),
    Ie = new gi();
  function Be() {
    let Me = context.player,
      we = context.camera;
    (ve.ammo--,
      k.burst++,
      (k.lastShot = k.t),
      (k.heat = Math.min(1.3, k.heat + 0.05)));
    let be = ve.spread,
      Oe = ae() * Math.PI * 2,
      pt = Math.tan(be) * Math.sqrt(ae());
    (ze
      .set(Math.cos(Oe) * pt, Math.sin(Oe) * pt, -1)
      .normalize()
      .applyQuaternion(we.quaternion),
      Ie.copy(Me.eye || we.position));
    let ut = null;
    try {
      ut = context.combat.playerShot(Ie, ze, {
        damage: H_,
        range: V_,
      });
    } catch {}
    (ut && ut.point ? Ne.copy(ut.point) : Ne.copy(Ie).addScaledVector(ze, V_),
      Re(We));
    let nn = context.fx;
    (nn &&
      (nn.tracer && nn.tracer(We, Ne),
      nn.shell &&
        (Pe(mi.eject, dt),
        xe
          .set(2 + ae() * 1.2, 1.2 + ae() * 0.8, 0.5 - ae() * 0.6)
          .applyQuaternion(we.quaternion),
        Me.vel && xe.add(Me.vel),
        nn.shell(dt, xe))),
      context.render &&
        context.render.lightPool &&
        context.render.lightPool.flash(We, 16756832, 45, 9, 0.05),
      context.events.emit("weapon:fire", {
        origin: Ie,
        dir: ze,
        muzzle: We,
        ads: k.adsE,
      }));
    let bt = lerp(1, 0.55, k.adsE) * (Me.crouching ? 0.85 : 1),
      Os = k.burst,
      pn = Os <= 9 ? 1 : 0.38,
      Ti =
        (Os < 4
          ? (ae() - 0.5) * 0.0022
          : Math.sin(Os * 0.57 + k.recPhase) * 0.0042 + (ae() - 0.5) * 0.002) *
        bt;
    (Me.addRecoil && Me.addRecoil(0.0068 * pn * bt * (0.85 + ae() * 0.3), Ti),
      Me.addShake && Me.addShake(0.12 * bt),
      (k.kZ.v += 1.5 * lerp(1, 0.6, k.adsE)),
      (k.kP.v += 1.5 * bt),
      (k.kY.v += (ae() - 0.5) * 1 * bt),
      (k.kR.v += (ae() - 0.5) * 1.8 * bt),
      (k.bloom = Math.min(1, k.bloom + 0.17)),
      (k.flashT = k.flashDur = 0.036 + ae() * 0.02));
    let ho = x.material.uniforms;
    ((ho.uSeed.value = ae() * 100),
      (ho.uJet.value = 0.6 + ae() * 0.6),
      (x.rotation.z = (ae() - 0.5) * 0.4));
    let Rs = (0.8 + ae() * 0.5) * lerp(1, 0.62, k.adsE);
    (x.scale.set(Rs, Rs, Rs * (0.8 + ae() * 0.5)),
      (k.boltT = 0),
      ve.ammo <= 0 && ((k.boltLocked = !0), (d.visible = !1)));
  }
  function Xe(Me) {
    let we = context.player,
      be = context.input;
    if (!we || !be || !we.alive) {
      ((k.prevFire = !1), x && (x.visible = !1));
      return;
    }
    k.t += Me;
    let Oe = !!be.fire && e.visible && !ce.noFire,
      pt = Oe && !k.prevFire;
    ((k.prevFire = Oe), Oe || (k.dryDone = !1));
    let ut = !!we.sprinting && !Oe && !be.ads && !k.reload;
    ((k.sprintT = damp(k.sprintT, ut ? 1 : 0, 9, Me)),
      be.pressed && be.pressed("reload") && Fe(),
      k.autoReload >= 0 && ((k.autoReload -= Me), k.autoReload < 0 && Fe()));
    let nn = 0;
    if (
      (ce.reloadT != null &&
        !k.reload &&
        (k.reload = {
          t: 0,
          T: ce.empty ? G_ : W_,
          empty: ce.empty,
          f: {},
        }),
      k.reload)
    ) {
      let Je = k.reload;
      ce.reloadT != null ? (Je.t = ce.reloadT) : (Je.t += Me);
      let Pt = Je.t,
        Vt = (Tt, Ai) =>
          Pt >= Ai && !Je.f[Tt]
            ? ((Je.f[Tt] = 1),
              context.events.emit("weapon:reload", {
                phase: Tt,
                empty: Je.empty,
              }),
              !0)
            : !1;
      if (
        (Vt("magout", me) && (k.bump.v -= 0.25),
        Pt > 0.86 && !Je.f.fresh && ((Je.f.fresh = 1), (d.visible = !0)),
        Vt("magin", ee))
      ) {
        k.bump.v += 0.55;
        let Tt = Math.min(ve.magSize - ve.ammo, ve.reserve);
        ((ve.ammo += Tt), (ve.reserve -= Tt), Je.empty || (k.boltLocked = !1));
      }
      (Pt >= 1.5 && !Je.f.tap && ((Je.f.tap = 1), (k.bump.v += 0.4)),
        Je.empty &&
          (Pt >= B &&
            (nn =
              Pt < P
                ? Yo((Pt - B) / (P - B))
                : Pt < V
                  ? 1
                  : Math.max(0, 1 - (Pt - V) / 0.035)),
          Vt("bolt", V) &&
            ((k.boltLocked = !1), (k.bump.v += 0.3), (k.kZ.v -= 0.5))),
        le(Je.empty ? ue : $, Pt),
        q.position.copy(Y),
        q.quaternion.copy(L),
        Pt >= me && Pt < ee
          ? (Z.copy(L).multiply(R),
            f.quaternion.copy(Z),
            f.position.copy(p).sub(j.p).applyQuaternion(Z).add(Y))
          : (f.quaternion.identity(), f.position.copy(p)));
      let ss = Yo(Pt / 0.3),
        Hs = 1 - Yo((Pt - (Je.T - 0.46)) / 0.4);
      ((k.reloadW = Math.min(ss, Hs)),
        (k.rackW = Je.empty ? Yo((Pt - 1.62) / 0.3) * Hs : 0),
        Pt >= Je.T &&
          ce.reloadT == null &&
          ((k.reload = null),
          (k.reloadW = 0),
          (k.rackW = 0),
          context.events.emit("weapon:reload", {
            phase: "done",
          }),
          q.position.copy(G.p),
          q.quaternion.copy(G.q)));
    }
    k.cooldown -= Me;
    let bt = !k.reload && k.sprintT < 0.45;
    if (Oe && bt)
      if (ve.ammo > 0) {
        let Je = 0;
        for (; k.cooldown <= 0 && ve.ammo > 0 && Je < 3;)
          (Be(), (k.cooldown += 60 / O_), Je++);
      } else
        k.dryDone ||
          ((k.dryDone = !0),
          context.events.emit("weapon:dry", {}),
          (k.bump.v -= 0.08),
          ve.reserve > 0 && (k.autoReload = 0.32));
    (k.cooldown < 0 && (k.cooldown = Math.max(k.cooldown, -0.001)),
      k.t - k.lastShot > 0.24 &&
        (k.burst > 0 && (k.recPhase = ae() * 6.28), (k.burst = 0)),
      (k.bloom = Math.max(0, k.bloom - Me * 1.5)),
      k.t - k.lastShot > 0.11 &&
        k.t - k.lastShot < 0.11 + Me * 1.5 &&
        k.heat > 0.4 &&
        (k.smoke = Math.min(1.6, k.heat * 1.3)),
      k.smoke > 0 &&
        ((k.smoke -= Me),
        (k.smokeTick -= Me),
        k.smokeTick <= 0 &&
          context.fx &&
          context.fx.smoke &&
          ((k.smokeTick = 0.085),
          Re(We),
          context.fx.smoke(We, {
            size: 0.1 + k.smoke * 0.06,
            life: 1.3,
            rise: 0.5,
            count: 1,
            alpha: 0.22,
          }))),
      (k.heat = Math.max(0, k.heat - Me * 0.2)));
    let Os = !!be.ads && !k.reload && k.sprintT < 0.35;
    ((k.adsLin = clamp(k.adsLin + (Os ? Me : -Me) / 0.18, 0, 1)),
      (k.adsE = Yo(k.adsLin)),
      (ve.ads = k.adsE));
    let pn = we.speed || 0,
      Ti = saturate(pn / 6),
      ho =
        lerp(0.0125, 0.0012, k.adsE) +
        Ti * lerp(0.013, 0.004, k.adsE) +
        k.bloom * lerp(0.0065, 0.0022, k.adsE) +
        (we.onGround === !1 ? 0.022 : 0) -
        (we.crouching ? 0.002 * (1 - k.adsE) : 0);
    ((k.spreadS = damp(k.spreadS, ho, 18, Me)),
      (ve.spread = k.spreadS),
      Oe ||
      !!be.ads ||
      !!k.reload ||
      pn > 0.2 ||
      (be.look && Math.abs(be.look.dx) + Math.abs(be.look.dy) > 0.002) ||
      k.sprintT > 0.1
        ? ((k.idleT = 0),
          k.inspect >= 0 && (k.inspect = Math.max(k.inspect, 2.9)))
        : (k.idleT += Me),
      k.inspect < 0 && k.idleT > 24 && (k.inspect = 0));
    let Un = 0,
      zo = 0,
      $i = 0;
    if (k.inspect >= 0) {
      let Je = (k.inspect += Me);
      ((Un = Yo(Je / 0.5) * (1 - Yo((Je - 1.4) / 0.5))),
        (zo = Yo((Je - 1.5) / 0.5) * (1 - Yo((Je - 2.8) / 0.5))),
        ($i = Yo(Je / 0.5) * (1 - Yo((Je - 2.9) / 0.5))),
        Je > 3.5 && ((k.inspect = -1), (k.idleT = 0)));
    }
    ((ve.state = k.reload
      ? "reloading"
      : k.inspect >= 0
        ? "inspect"
        : k.sprintT > 0.5
          ? "sprinting"
          : k.t - k.lastShot < 0.14
            ? "firing"
            : "idle"),
      (k.boltT += Me));
    let ya = 0.072,
      ba = k.boltT < ya ? Math.sin((Math.PI * k.boltT) / ya) : 0;
    (k.boltLocked && k.boltT > ya * 0.5 && (ba = Math.max(ba, 0.86)),
      (h.position.z = mi.boltTravel * Math.max(ba * 0.95, nn)),
      (k.finger = damp(k.finger, (Oe && bt) || ce.flash ? 1 : 0, 30, Me)),
      z(k.finger));
    let Hn = x.material.uniforms;
    if (
      (ce.flash && ((k.flashT = k.flashDur = 0.05), (Hn.uSeed.value = 3.7)),
      (k.flashT -= Me),
      (Hn.uInt.value =
        k.flashT > 0 ? 9.5 * Math.sqrt(Math.max(0, k.flashT / k.flashDur)) : 0),
      (Hn.uHeat.value = saturate((k.heat - 0.45) / 0.8) * 2.2),
      (x.visible = Hn.uInt.value > 0 || Hn.uHeat.value > 0.02),
      ce.freeze)
    )
      return;
    let fo = we.onGround !== !1,
      ln = we.vel ? we.vel.y : 0;
    ((k.bobAmt = damp(k.bobAmt, fo ? saturate(pn / 3.6) : 0, 8, Me)),
      (k.bobPhase += Me * (pn > 0.3 && fo ? 5.2 + pn * 1.55 : 0)));
    let Zo = k.bobPhase,
      yr = k.bobAmt * lerp(1, 0.12, k.adsE) * (1 + k.sprintT * 1.4),
      lu = Math.sin(Zo) * 0.006 * yr,
      de =
        (Math.sin(2 * Zo) * 0.0042 -
          Math.pow(0.5 + 0.5 * Math.cos(2 * Zo + 0.6), 4) * 0.0048) *
        yr,
      te = lerp(1, 0.3, k.adsE),
      he = k.t,
      pe = lerp(1, 0.4, k.adsE);
    if (
      ((k.swY.v += clamp(be.look ? be.look.dx : 0, -0.2, 0.2) * 3.2 * pe),
      (k.swP.v += clamp(be.look ? be.look.dy : 0, -0.2, 0.2) * 2.6 * pe),
      ma(k.swY, 0, Me),
      ma(k.swP, 0, Me),
      (k.swY.x = clamp(k.swY.x, -0.09, 0.09)),
      (k.swP.x = clamp(k.swP.x, -0.07, 0.07)),
      k.wasGround && !fo && ln > 1 && ((k.jY.v -= 0.22), (k.jP.v += 0.7)),
      !k.wasGround && fo)
    ) {
      let Je = clamp(-k.lastVy * 0.06, 0, 0.6);
      ((k.jY.v -= Je), (k.jP.v -= Je * 3.2), (k.kR.v += (ae() - 0.5) * Je * 2));
    }
    ((k.wasGround = fo),
      fo || (k.lastVy = ln),
      ma(k.jY, fo ? 0 : clamp(-ln * 0.0045, -0.02, 0.024), Me),
      ma(k.jP, fo ? 0 : clamp(ln * 0.012, -0.06, 0.06), Me),
      ma(k.kZ, 0, Me),
      ma(k.kP, 0, Me),
      ma(k.kY, 0, Me),
      ma(k.kR, 0, Me),
      ma(k.bump, 0, Me));
    let ge = be.move ? be.move.x : 0,
      ye = be.move ? be.move.y : 0,
      Le = 1 - k.adsE,
      ke = k.adsE,
      Ue = k.sprintT,
      ct = k.reloadW,
      De = k.rackW,
      it =
        lerp(eu.p[0], qv.p[0], ke) +
        tu.p[0] * Ue +
        nu.p[0] * ct +
        lu +
        Math.sin(he * 0.85 + 1) * 0.0012 * te -
        k.swY.x * 0.06 -
        ge * 0.004 * Le -
        0.035 * $i,
      gt =
        lerp(eu.p[1], qv.p[1], ke) +
        tu.p[1] * Ue +
        nu.p[1] * ct +
        de +
        Math.sin(he * 1.7) * 0.0016 * te +
        k.swP.x * 0.05 +
        k.jY.x +
        k.bump.x * 0.6 +
        0.045 * $i,
      Ot =
        lerp(eu.p[2], qv.p[2], ke) +
        tu.p[2] * Ue +
        nu.p[2] * ct +
        k.kZ.x * 0.55 +
        ye * 0.004 * Le * (1 - Ue),
      xn =
        eu.r[0] * Le +
        tu.r[0] * Ue +
        nu.r[0] * ct -
        0.16 * De +
        Math.sin(he * 1.7 + 0.8) * 0.0035 * te +
        Math.sin(2 * Zo + 0.5) * 0.008 * yr +
        k.swP.x +
        k.jP.x +
        k.kP.x +
        k.bump.x * 1.5 +
        0.3 * $i,
      $t =
        eu.r[1] * Le +
        tu.r[1] * Ue +
        nu.r[1] * ct +
        Math.sin(he * 0.6) * 0.002 * te +
        Math.sin(Zo) * 0.01 * yr +
        k.swY.x +
        k.kY.x +
        0.18 * $i +
        0.25 * zo,
      Ht =
        eu.r[2] * Le +
        tu.r[2] * Ue +
        nu.r[2] * ct +
        0.62 * De +
        Math.sin(Zo) * 0.014 * yr +
        k.swY.x * 0.7 -
        ge * 0.035 * Le +
        k.kR.x -
        0.75 * Un +
        0.55 * zo +
        Math.sin(he * 0.5) * 0.004 * te;
    (e.position.set(it, gt, Ot), e.rotation.set(xn, $t, Ht, "YXZ"));
  }
  return (_e(), ve);
}

async function showcaseWeapon(context) {
  let e = await createWeapon(context);
  context.weapon = e;
  let t = e.root,
    n = new gi(0, 1.68, 4),
    s = {
      south: [0.28, -0.01, 1],
      east: [1, 0, 0.25],
      north: [-0.2, -0.01, -1],
      west: [-1, 0, 0.1],
      nw: [-0.75, -0.01, -0.65],
    },
    o = {
      side: [Math.PI, [1.12, 1.3, 0.11], [0, 1.235, 0.11], 30],
      right: [0, [1.12, 1.3, -0.11], [0, 1.235, -0.11], 30],
      top: [Math.PI * 0.86, [0.62, 1.8, -0.42], [0, 1.24, 0.12], 32],
      hands: [Math.PI, [0.4, 1.4, 0.02], [0.02, 1.215, 0.25], 30],
      rhand: [0, [0.36, 1.22, 0.27], [0.03, 1.16, 0.09], 30],
      muzzle: [Math.PI, [0.26, 1.37, 0.98], [0, 1.262, 0.44], 30],
      optic: [Math.PI, [0.2, 1.4, -0.26], [0, 1.31, 0.02], 30],
      lower: [Math.PI, [0.34, 1.26, 0.04], [0, 1.2, 0.03], 30],
    },
    r = window.__setShot,
    a = null;
  function l(u, h = {}) {
    a = u;
    let f = o[u],
      p = context.input,
      d = context.player;
    ((p.ads = !1),
      (p.fire = !1),
      (d.sprinting = !1),
      (d.speed = 0),
      (e.debug.reloadT = null),
      (e.debug.flash = !1),
      (e.debug.empty = !1),
      (e.debug.freeze = !!f),
      e.reset());
    let v, g, x;
    if (f)
      (context.scene.add(t),
        t.position.set(0, 1.25, 0),
        t.rotation.set(0, f[0], 0, "YXZ"),
        t.traverse((y) => y.layers.set(vf)),
        (v = f[1]),
        (g = f[2]),
        (x = f[3]),
        h.wt != null &&
          ((e.debug.reloadT = +h.wt), (e.debug.empty = !!h.wempty)));
    else {
      (context.camera.add(t), t.traverse((b) => b.layers.set(zc)));
      let y = s[h.wlook] || s.south;
      ((v = [n.x, n.y, n.z]),
        (g = [n.x + y[0] * 50, n.y + y[1] * 50, n.z + y[2] * 50]),
        (x = 74),
        u === "ads" && ((p.ads = !0), (x = 52)),
        u === "sprint" && ((d.sprinting = !0), (d.speed = 6)),
        u === "fire" &&
          ((e.debug.flash = !0), h.wads && ((p.ads = !0), (x = 52))),
        (u === "reload" || u === "empty") &&
          ((e.debug.reloadT = h.wt != null ? +h.wt : 0.62),
          (e.debug.empty = u === "empty")),
        u === "empty" && (e.ammo = 0));
    }
    return (
      e.snap(),
      e.update(0.016),
      e.snap(),
      r &&
        r({
          cam: h.cam || [...v, ...g].join(","),
          fov: h.fov || x,
          exposure: h.exposure,
        }),
      {
        cam: v,
        target: g,
      }
    );
  }
  window.__setShot = (u) => {
    u && u.wpose ? l(u.wpose, u) : r && r(u);
  };
  let c = l(context.params.wpose || "hip", context.params);
  return {
    cam: c.cam,
    target: c.target,
    update(u) {
      (e.update(u), a === "fire" && (e.debug.flash = !0));
    },
  };
}

export { createWeapon, weaponShowcaseModule, showcaseWeapon };
