import {
  Color,
  Group,
  Mesh,
  Vector3,
  defineModuleExports,
} from "../vendor/three-r180.js";
import { SKY_COLORS, SUN_LIGHT } from "../core/config.js";
import { beveledBoxGeometry } from "../core/geometry.js";
import {
  Af,
  Bb,
  Ev,
  Gc,
  H1,
  Mv,
  Ob,
  Rf,
  V1,
  W1,
  Wc,
  Xc,
  _v,
  bv,
  n0,
  oo,
  q1,
  qc,
} from "./particles.js";
import { $1, Z1, j1 } from "./pools.js";

var effectsShowcaseModule = {};

defineModuleExports(effectsShowcaseModule, {
  create: () => createEffects,
  showcase: () => showcaseEffects,
});

var $b = 1400;

var Zb = 3200;

var ht = Math.random;

var Ze = (i, e) => i + (e - i) * Math.random();

var Et = new Vector3();

var zt = new Vector3();

var J1 = new Vector3();

var qe = new Vector3();

var Es = new Vector3();

var Ho = new Vector3();

var Ei = new Vector3(0, 1, 0);

var jR = new Vector3(0, -1, 0);

var K1 = new Color();

var Ao = [1, 1, 1];

function Yc(i, e, t, n) {
  return (
    i == null
      ? ((Ao[0] = e), (Ao[1] = t), (Ao[2] = n))
      : Array.isArray(i)
        ? ((Ao[0] = i[0]), (Ao[1] = i[1]), (Ao[2] = i[2]))
        : i.isColor
          ? ((Ao[0] = i.r), (Ao[1] = i.g), (Ao[2] = i.b))
          : (K1.set(i), (Ao[0] = K1.r), (Ao[1] = K1.g), (Ao[2] = K1.b)),
    Ao
  );
}

function ro(i, e, t) {
  let n = ht() * 2 - 1,
    s = ht() * 2 - 1,
    o = ht() * 2 - 1,
    r = Math.hypot(n, s, o) || 1,
    a = (e * Math.cbrt(ht())) / r;
  t.set(i.x + n * a, i.y + s * a, i.z + o * a);
  let l = t.length();
  return (l < 1e-4 ? t.copy(i) : t.multiplyScalar(1 / l), t);
}

async function createEffects(context) {
  let e = context.scene || (context.render && context.render.scene),
    t = new Vector3(-0.8, 0, 0.3),
    n = new Vector3(
      SUN_LIGHT.color.r,
      SUN_LIGHT.color.g,
      SUN_LIGHT.color.b,
    ).multiplyScalar((SUN_LIGHT.intensity / Math.PI) * 0.9),
    s = new Vector3(
      SKY_COLORS.zenith.r * 0.6 +
        SKY_COLORS.horizonAway.r * 0.5 +
        SKY_COLORS.fog.r * 0.25,
      SKY_COLORS.zenith.g * 0.6 +
        SKY_COLORS.horizonAway.g * 0.5 +
        SKY_COLORS.fog.g * 0.25,
      SKY_COLORS.zenith.b * 0.6 +
        SKY_COLORS.horizonAway.b * 0.5 +
        SKY_COLORS.fog.b * 0.25,
    ),
    o = new Vector3(
      SKY_COLORS.horizonAway.r * 0.3 + SKY_COLORS.fog.r * 0.14,
      SKY_COLORS.horizonAway.g * 0.3 + SKY_COLORS.fog.g * 0.14,
      SKY_COLORS.horizonAway.b * 0.3 + SKY_COLORS.fog.b * 0.14,
    ),
    r = Ev(context, $b, {
      lit: !0,
      tex: Bb(128),
      cols: Wc,
      rows: H1,
      renderOrder: 10,
      sun: n,
      sunDir: SUN_LIGHT.dir.clone().normalize(),
      ambLo: o,
      ambHi: s,
    }),
    a = Ev(context, Zb, {
      lit: !1,
      tex: Ob(128),
      cols: Af,
      rows: bv,
      renderOrder: 20,
    }),
    l = new Rf($b, !0),
    c = new Rf(Zb - 160, !1),
    u = new q1(48),
    h = new $1(context, 256),
    f = new Z1(context, 60),
    p = new j1(context, 160),
    d = new Group();
  ((d.name = "fx"), d.add(p.mesh, h.mesh, f.mesh, r.mesh, a.mesh), e.add(d));
  let v = 0,
    g = -1,
    x = -1,
    y = () => context.render && context.render.lightPool,
    b = (ee, B, P, V, Y) => {
      let L = y();
      L && L.flash(ee, B, P, V, Y);
    };
  function m(ee, B) {
    let P = context.physics;
    if (!P || !P.raycast) return 1;
    (Es.copy(ee), B && Es.addScaledVector(B, 0.08), (Es.y += 0.03));
    let V = null;
    try {
      V = P.raycast(Es, SUN_LIGHT.dir, 90);
    } catch {
      V = null;
    }
    return V ? 0.2 : 1;
  }
  function A(ee) {
    let B = context.physics;
    if (!B || !B.raycast) return 0;
    (Es.copy(ee), (Es.y += 0.1));
    let P = null;
    try {
      P = B.raycast(Es, jR, 12);
    } catch {
      P = null;
    }
    return P ? P.point.y : -50;
  }
  function _(ee, B, P, V, Y, L, Z, J, oe, fe, le, R, I, se, ae, k, ce, ve) {
    let _e = l.emit(ee, B, P, V, Y, L, Z, J, oe);
    return _e < 0
      ? -1
      : ((l.r[_e] = fe),
        (l.g[_e] = le),
        (l.b[_e] = R),
        (l.a[_e] = I),
        (l.shade[_e] = se),
        (l.drag[_e] = ae),
        (l.grav[_e] = -k),
        (l.wind[_e] = ce),
        (l.turb[_e] = 0.5),
        (l.rot[_e] = ht() * 6.283),
        (l.rotv[_e] = (ht() - 0.5) * 1.2),
        (l.frame[_e] = ve < 0 ? (ht() * 6) | 0 : ve),
        (l.fin[_e] = 0.06),
        (l.fout[_e] = 0.3),
        (l.sk[_e] = 2.5),
        _e);
  }
  function M(ee, B, P, V, Y, L, Z, J, oe, fe, le, R) {
    let I = c.emit(ee, B, P, V, Y, L, Z, J, J * 0.5);
    return I < 0
      ? -1
      : ((c.mode[I] = 1),
        (c.frame[I] = _v),
        (c.stretch[I] = 0.03),
        (c.grav[I] = 9.81),
        (c.drag[I] = 0.9),
        (c.ramp[I] = 1),
        (c.r[I] = oe * 0.6),
        (c.g[I] = fe * 0.6),
        (c.b[I] = le * 0.6),
        (c.fout[I] = 0.55),
        (c.flags[I] = R),
        (c.sk[I] = 1),
        I);
  }
  function E(ee, B, P, V, Y, L, Z, J, oe, fe, le, R) {
    for (let I = 0; I < P; I++) {
      ro(B, L, qe);
      let se = Ze(V, Y) * (0.35 + 0.65 * ht());
      M(
        ee.x,
        ee.y,
        ee.z,
        qe.x * se,
        qe.y * se,
        qe.z * se,
        Ze(Z, J),
        Ze(0.01, 0.02),
        oe * Ze(0.6, 1.2),
        fe * Ze(0.6, 1.2),
        le,
        R,
      );
    }
  }
  function w(ee, B, P, V, Y, L, Z, J, oe, fe) {
    let le = c.emit(ee, B, P, 0, 0, 0, V, Y, L);
    return le < 0
      ? -1
      : ((c.frame[le] = fe),
        (c.r[le] = Z),
        (c.g[le] = J),
        (c.b[le] = oe),
        (c.fout[le] = 0.2),
        (c.rot[le] = ht() * 6.283),
        (c.sk[le] = 1.5),
        le);
  }
  function S(ee, B, P, V, Y, L, Z, J, oe) {
    let fe = c.emit(ee, B, P, 0, 0, 0, V, Y, L);
    return fe < 0
      ? -1
      : ((c.mode[fe] = 2),
        (c.frame[fe] = Mv),
        (c.r[fe] = Z),
        (c.g[fe] = J),
        (c.b[fe] = oe),
        (c.fout[fe] = 0.15),
        (c.fin[fe] = 0.08),
        (c.sk[fe] = 2.2),
        (c.rot[fe] = ht() * 6.283),
        fe);
  }
  function z(ee, B, P, V, Y, L, Z, J, oe, fe, le, R, I, se, ae, k) {
    for (let ce = 0; ce < P; ce++) {
      ro(B, ae, qe);
      let ve = Ze(V, Y),
        _e = Ze(0.8, 1.15);
      h.add(
        ee.x + qe.x * 0.02,
        ee.y + qe.y * 0.02,
        ee.z + qe.z * 0.02,
        qe.x * ve,
        qe.y * ve + 0.8,
        qe.z * ve,
        Ze(L, Z),
        Ze(J, oe),
        Ze(fe, le),
        R * _e,
        I * _e,
        se * _e,
        Ze(3.5, 6),
        k,
      );
    }
  }
  function H(ee, B, P = 12) {
    (zt.copy(B || Ei),
      zt.lengthSq() < 1e-6 && zt.copy(Ei),
      zt.normalize(),
      E(ee, zt, P, 5, 18, 0.6, 0.15, 0.5, 36, 22, 9, qc),
      w(ee.x, ee.y, ee.z, 0.05, 0.2, 0.35, 10, 6.5, 3, oo));
  }
  function O(ee, B = {}) {
    let P = B.size || 1,
      V = B.life || 2.5,
      Y = B.rise === void 0 ? 0.6 : B.rise,
      L = Yc(B.color, 0.32, 0.32, 0.33),
      Z = B.vel,
      J = m(ee, null),
      oe = B.count || 3;
    for (let fe = 0; fe < oe; fe++)
      _(
        ee.x + (ht() - 0.5) * 0.2 * P,
        ee.y + (ht() - 0.5) * 0.2 * P,
        ee.z + (ht() - 0.5) * 0.2 * P,
        (Z ? Z.x : 0) + (ht() - 0.5) * 0.4,
        (Z ? Z.y : 0) + ht() * 0.3,
        (Z ? Z.z : 0) + (ht() - 0.5) * 0.4,
        V * Ze(0.75, 1.2),
        P * 0.3,
        P * Ze(1, 1.5),
        L[0],
        L[1],
        L[2],
        B.alpha || 0.4,
        J,
        1.2,
        Y,
        1,
        -1,
      );
  }
  function q(ee, B, P = 1, V = 0.5, Y = 0.48, L = 0.45) {
    (Et.copy(B || Ei), Et.lengthSq() < 1e-6 && Et.copy(Ei), Et.normalize());
    let Z = m(ee, Et);
    for (let J = 0; J < 8; J++) {
      ro(Et, 0.5, qe);
      let oe = Ze(1, 4.5) * P,
        fe = Ze(0.85, 1.1);
      _(
        ee.x + Et.x * 0.03,
        ee.y + Et.y * 0.03,
        ee.z + Et.z * 0.03,
        qe.x * oe,
        qe.y * oe,
        qe.z * oe,
        Ze(0.5, 1.1),
        0.08 * P,
        Ze(0.35, 0.7) * P,
        V * fe,
        Y * fe,
        L * fe,
        0.9,
        Z,
        3.5,
        0.15,
        0.6,
        J < 3 ? 7 : -1,
      );
    }
    for (let J = 0; J < 2; J++)
      _(
        ee.x + Et.x * 0.15,
        ee.y + Et.y * 0.15,
        ee.z + Et.z * 0.15,
        Et.x * 0.5 + (ht() - 0.5) * 0.3,
        Et.y * 0.5 + 0.1,
        Et.z * 0.5 + (ht() - 0.5) * 0.3,
        Ze(2.2, 3.6),
        0.25 * P,
        Ze(0.9, 1.5) * P,
        V,
        Y,
        L,
        0.28,
        Z,
        1.5,
        0.1,
        1,
        -1,
      );
    return Z;
  }
  function U(ee, B = {}) {
    let P;
    if (B.color !== void 0) P = Yc(B.color, 0.4, 0.4, 0.4);
    else if (B.mat) {
      let oe = null;
      try {
        oe = typeof B.mat == "string" ? context.mats.get(B.mat) : B.mat;
      } catch {
        oe = null;
      }
      P = Yc(oe && oe.color ? oe.color : null, 0.4, 0.4, 0.4);
    } else P = Yc(null, 0.4, 0.39, 0.37);
    let V = P[0],
      Y = P[1],
      L = P[2],
      Z = B.size || 0.06,
      J = B.speed || 5;
    (Et.copy(B.normal || Ei).normalize(),
      z(
        ee,
        Et,
        Math.min(B.count || 6, 40),
        J * 0.4,
        J * 1.3,
        Z * 0.4,
        Z * 1.2,
        Z * 0.3,
        Z * 0.9,
        Z * 0.4,
        Z * 1.2,
        V,
        Y,
        L,
        B.spread || 1,
        A(ee),
      ));
  }
  function T(ee, B = 1) {
    let P = m(ee, Ei),
      V = ee.y;
    for (let fe = 0; fe < 5; fe++) {
      let le = Ze(0.35, 0.6) * B,
        R = _(
          ee.x + (ht() - 0.5) * 0.08 * B,
          V + 0.1 * B,
          ee.z + (ht() - 0.5) * 0.08 * B,
          (ht() - 0.5) * 0.5,
          Ze(1.6, 2.8) * Math.sqrt(B),
          (ht() - 0.5) * 0.5,
          Ze(0.4, 0.65),
          le * 0.3,
          le,
          0.72,
          0.78,
          0.84,
          0.95,
          P,
          0.5,
          -7,
          0,
          6,
        );
      R >= 0 &&
        ((l.rot[R] = (ht() - 0.5) * 0.3),
        (l.rotv[R] = 0),
        (l.turb[R] = 0),
        (l.sk[R] = 3),
        (l.fout[R] = 0.4));
    }
    for (let fe = 0; fe < 2; fe++)
      _(
        ee.x,
        V + 0.15 * B,
        ee.z,
        (ht() - 0.5) * 0.6,
        0.5,
        (ht() - 0.5) * 0.6,
        Ze(0.7, 1.1),
        0.2 * B,
        0.7 * B,
        0.7,
        0.75,
        0.8,
        0.14,
        P,
        2,
        0,
        0.8,
        -1,
      );
    let Y = 1.9 * P + 0.35,
      L = 1.5 * P + 0.45,
      Z = 1.05 * P + 0.55,
      J = Math.round(14 * Math.min(B, 1.6));
    for (let fe = 0; fe < J; fe++) {
      ro(Ei, 0.75, qe);
      let le = Ze(1.5, 4.8) * Math.sqrt(B),
        R = c.emit(
          ee.x,
          V + 0.03,
          ee.z,
          qe.x * le,
          Math.abs(qe.y) * le,
          qe.z * le,
          Ze(0.5, 1),
          Ze(0.012, 0.024),
          0.01,
        );
      R >= 0 &&
        ((c.mode[R] = 1),
        (c.frame[R] = Gc),
        (c.stretch[R] = 0.012),
        (c.grav[R] = 9.81),
        (c.drag[R] = 0.4),
        (c.r[R] = Y),
        (c.g[R] = L),
        (c.b[R] = Z),
        (c.fout[R] = 0.7),
        (c.flags[R] = Xc),
        (c.sk[R] = 1),
        (c.gy[R] = V));
    }
    S(
      ee.x,
      V + 0.012,
      ee.z,
      0.9,
      0.12 * B,
      1.5 * B,
      0.3 * P + 0.08,
      0.27 * P + 0.09,
      0.22 * P + 0.1,
    );
    let oe = S(
      ee.x,
      V + 0.012,
      ee.z,
      1.3,
      0.05 * B,
      1 * B,
      0.2 * P + 0.05,
      0.18 * P + 0.06,
      0.15 * P + 0.07,
    );
    oe >= 0 && (c.fin[oe] = 0.35);
  }
  let D = {
    p: new Vector3(),
  };
  function C(ee, B, P, V, Y) {
    (Et.copy(B || Ei),
      Et.lengthSq() < 1e-6 && Et.copy(Ei),
      Et.normalize(),
      V && V.lengthSq() > 1e-6 ? zt.copy(V).normalize() : zt.copy(Et).negate(),
      J1.copy(zt)
        .addScaledVector(Et, -2 * zt.dot(Et))
        .normalize());
    let L = D.p.copy(ee);
    if (
      (Y && (P = "enemy"),
      P !== "enemy" &&
        P !== "water" &&
        Et.y > 0.7 &&
        context.ground &&
        context.ground.isPuddle)
    )
      try {
        context.ground.isPuddle(L.x, L.z) && L.y < 0.08 && (P = "water");
      } catch {}
    let J =
        (context.camera
          ? context.camera.position
          : Es.set(0, 0, 0)
        ).distanceToSquared(L) > 3025,
      oe = J ? 0.5 : 1,
      fe = Et.x,
      le = Et.y,
      R = Et.z;
    switch (P) {
      case "metal": {
        (qe.copy(J1).addScaledVector(Et, 0.6).normalize(),
          zt.copy(qe),
          E(
            L,
            zt,
            Math.round(18 * oe),
            6,
            24,
            0.55,
            0.1,
            0.38,
            40,
            25,
            10.5,
            0,
          ),
          E(L, zt, 2 + ((ht() * 2) | 0), 9, 18, 0.9, 0.7, 1.3, 32, 18, 7, qc),
          w(
            L.x + fe * 0.03,
            L.y + le * 0.03,
            L.z + R * 0.03,
            0.05,
            0.25,
            0.45,
            16,
            11,
            5.5,
            oo,
          ),
          w(
            L.x + fe * 0.04,
            L.y + le * 0.04,
            L.z + R * 0.04,
            0.04,
            0.35,
            0.5,
            9,
            6,
            2.6,
            n0 + ((ht() * 2) | 0),
          ),
          v - g > 0.09 &&
            ((g = v),
            Es.copy(L).addScaledVector(Et, 0.12),
            b(Es, 16760944, 10, 5, 0.05)));
        let I = m(L, Et);
        for (let se = 0; se < 2; se++)
          _(
            L.x + fe * 0.04,
            L.y + le * 0.04,
            L.z + R * 0.04,
            fe * 0.8 + (ht() - 0.5) * 0.5,
            le * 0.8 + 0.2,
            R * 0.8 + (ht() - 0.5) * 0.5,
            Ze(0.5, 0.9),
            0.06,
            Ze(0.3, 0.5),
            0.4,
            0.4,
            0.41,
            0.4,
            I,
            2.5,
            0.3,
            0.8,
            -1,
          );
        (J ||
          z(
            L,
            Et,
            2,
            1.5,
            4,
            0.012,
            0.03,
            0.003,
            0.005,
            0.01,
            0.025,
            0.2,
            0.21,
            0.23,
            0.8,
            A(L),
          ),
          p.add(L, Et, "bullet_metal"));
        break;
      }
      case "wood": {
        let I = q(L, Et, 0.75, 0.5, 0.42, 0.32);
        (z(
          L,
          Et,
          J ? 3 : 7,
          2,
          6,
          0.004,
          0.009,
          0.03,
          0.1,
          0.004,
          0.012,
          0.62,
          0.5,
          0.33,
          0.7,
          A(L),
        ),
          I > 0.5 &&
            ht() < 0.3 &&
            w(L.x, L.y, L.z, 0.04, 0.1, 0.2, 3, 2, 1, oo),
          p.add(L, Et, "bullet_wood"));
        break;
      }
      case "water": {
        T(L, 1);
        break;
      }
      case "rubber":
      case "dirt": {
        let I = m(L, Et),
          se = P === "dirt",
          ae = se ? 0.3 : 0.14,
          k = se ? 0.25 : 0.14,
          ce = se ? 0.19 : 0.14;
        for (let ve = 0; ve < 5; ve++) {
          ro(Et, 0.6, qe);
          let _e = Ze(0.6, 2.6);
          _(
            L.x + fe * 0.03,
            L.y + le * 0.03,
            L.z + R * 0.03,
            qe.x * _e,
            qe.y * _e,
            qe.z * _e,
            Ze(0.5, 1),
            0.07,
            Ze(0.3, 0.55),
            ae,
            k,
            ce,
            0.85,
            I,
            3.5,
            0.1,
            0.6,
            ve < 2 ? 7 : -1,
          );
        }
        (z(
          L,
          Et,
          3,
          1.5,
          4,
          0.01,
          0.03,
          0.008,
          0.02,
          0.01,
          0.03,
          ae * 0.8,
          k * 0.8,
          ce * 0.8,
          0.7,
          A(L),
        ),
          p.add(L, Et, "soot", 0.2, 1, 0.8));
        break;
      }
      case "glass": {
        for (let I = 0; I < 12; I++) {
          ro(Et, 0.9, qe);
          let se = Ze(1.5, 6),
            ae = c.emit(
              L.x,
              L.y,
              L.z,
              qe.x * se,
              qe.y * se,
              qe.z * se,
              Ze(0.4, 0.9),
              Ze(0.012, 0.02),
              0.008,
            );
          ae >= 0 &&
            ((c.mode[ae] = 1),
            (c.frame[ae] = Gc),
            (c.stretch[ae] = 0.01),
            (c.grav[ae] = 9.81),
            (c.r[ae] = 2.6),
            (c.g[ae] = 2.7),
            (c.b[ae] = 2.8),
            (c.flags[ae] = Xc),
            (c.ramp[ae] = 3));
        }
        (z(
          L,
          Et,
          4,
          1.5,
          5,
          0.01,
          0.03,
          0.002,
          0.004,
          0.01,
          0.03,
          0.62,
          0.72,
          0.74,
          0.8,
          A(L),
        ),
          _(
            L.x,
            L.y,
            L.z,
            fe * 0.6,
            le * 0.6 + 0.2,
            R * 0.6,
            0.6,
            0.08,
            0.4,
            0.75,
            0.8,
            0.82,
            0.2,
            m(L, Et),
            2.5,
            0.2,
            0.8,
            -1,
          ),
          p.add(L, Et, "bullet_glass"));
        break;
      }
      case "enemy": {
        (qe.copy(J1).addScaledVector(Et, 0.8).normalize(),
          zt.copy(qe),
          E(L, zt, Math.round(13 * oe), 5, 20, 0.9, 0.12, 0.45, 42, 29, 14, 0),
          E(L, zt, 2, 6, 12, 1, 0.6, 1.1, 32, 18, 7, qc),
          w(L.x, L.y, L.z, 0.06, 0.3, 0.55, 18, 12, 6, oo),
          w(L.x, L.y, L.z, 0.04, 0.3, 0.45, 8, 5, 2.4, n0 + ((ht() * 2) | 0)),
          v - g > 0.09 && ((g = v), b(L, 16756832, 8, 4.5, 0.05)));
        let I = m(L, Et);
        for (let se = 0; se < 2; se++)
          _(
            L.x,
            L.y,
            L.z,
            fe * 0.5 + (ht() - 0.5) * 0.4,
            le * 0.5 + 0.3,
            R * 0.5 + (ht() - 0.5) * 0.4,
            Ze(0.6, 1.1),
            0.06,
            Ze(0.3, 0.5),
            0.13,
            0.13,
            0.14,
            0.65,
            I,
            2.2,
            0.5,
            0.9,
            -1,
          );
        if (!J) {
          let se = ht() < 0.35;
          z(
            L,
            Et,
            3,
            2,
            6,
            0.012,
            0.035,
            0.004,
            0.008,
            0.012,
            0.03,
            0.6,
            se ? 0.2 : 0.62,
            se ? 0.05 : 0.64,
            0.8,
            A(L),
          );
        }
        break;
      }
      default: {
        (q(L, Et, 1, 0.52, 0.5, 0.47),
          z(
            L,
            Et,
            J ? 2 : 4,
            1.5,
            5.5,
            0.012,
            0.035,
            0.008,
            0.02,
            0.012,
            0.035,
            0.42,
            0.41,
            0.39,
            0.7,
            A(L),
          ),
          qe.copy(J1).addScaledVector(Et, 0.7).normalize(),
          zt.copy(qe));
        for (let I = 0; I < 4; I++) {
          ro(zt, 0.5, qe);
          let se = Ze(3, 9),
            ae = _(
              L.x,
              L.y,
              L.z,
              qe.x * se,
              qe.y * se,
              qe.z * se,
              Ze(0.25, 0.45),
              0.03,
              0.09,
              0.6,
              0.58,
              0.54,
              0.7,
              1,
              2,
              -6,
              0.2,
              7,
            );
          ae >= 0 && (l.turb[ae] = 0);
        }
        (ht() < 0.3 && E(L, zt, 3, 4, 10, 0.6, 0.08, 0.2, 26, 15, 6, 0),
          p.add(L, Et, "bullet_concrete"));
      }
    }
  }
  function G(ee, B, P = {}) {
    let V = Yc(P.color, 1, 0.8, 0.46),
      Y = P.intensity || 16;
    if (
      (u.add(
        ee,
        B,
        V[0] * Y,
        V[1] * Y,
        V[2] * Y,
        P.speed || 260,
        P.width || 0.024,
      ),
      v - x > 0.07 && P.trail !== !1)
    ) {
      ((x = v), qe.subVectors(B, ee));
      let L = qe.length();
      if (L > 2) {
        qe.multiplyScalar(1 / L);
        let Z = 5,
          J = Math.min(L, 7),
          oe = m(ee, null);
        for (let fe = 0; fe < Z; fe++) {
          let le = 0.6 + ((fe + ht()) / Z) * (J - 0.6),
            R = _(
              ee.x + qe.x * le,
              ee.y + qe.y * le,
              ee.z + qe.z * le,
              qe.x * 0.6,
              0.05,
              qe.z * 0.6,
              Ze(0.45, 0.8),
              0.04,
              Ze(0.12, 0.2),
              0.6,
              0.6,
              0.62,
              0.1,
              oe,
              2,
              0.1,
              0.7,
              -1,
            );
          R >= 0 && (l.fin[R] = 0.25);
        }
      }
    }
  }
  function j(ee, B, P = {}) {
    let V = P.scale || 1;
    (zt.copy(B || Ei),
      zt.lengthSq() < 1e-6 && zt.set(0, 0, -1),
      zt.normalize());
    let Y = Yc(P.color, 1, 0.68, 0.32),
      L = ee.x,
      Z = ee.y,
      J = ee.z,
      oe = Y[0],
      fe = Y[1],
      le = Y[2];
    (w(
      L + zt.x * 0.1 * V,
      Z + zt.y * 0.1 * V,
      J + zt.z * 0.1 * V,
      0.045,
      0.75 * V,
      1.15 * V,
      34 * oe,
      34 * fe,
      34 * le,
      n0,
    ),
      w(
        L + zt.x * 0.14 * V,
        Z + zt.y * 0.14 * V,
        J + zt.z * 0.14 * V,
        0.035,
        0.5 * V,
        0.85 * V,
        22 * oe,
        22 * fe,
        22 * le,
        n0 + 1,
      ),
      w(
        L + zt.x * 0.05 * V,
        Z + zt.y * 0.05 * V,
        J + zt.z * 0.05 * V,
        0.045,
        0.13 * V,
        0.2 * V,
        22,
        22 * (fe + 0.25),
        22 * (le + 0.3),
        oo,
      ),
      w(L, Z, J, 0.05, 0.8 * V, 1.1 * V, 0.4 * oe, 0.4 * fe, 0.4 * le, oo));
    let R = c.emit(
      L + zt.x * 0.4 * V,
      Z + zt.y * 0.4 * V,
      J + zt.z * 0.4 * V,
      -zt.x,
      -zt.y,
      -zt.z,
      0.04,
      0.11 * V,
      0.14 * V,
    );
    R >= 0 &&
      ((c.mode[R] = 1),
      (c.frame[R] = W1),
      (c.stretch[R] = 0.9 * V),
      (c.r[R] = 18 * oe),
      (c.g[R] = 18 * fe),
      (c.b[R] = 18 * le),
      (c.fout[R] = 0.3));
    for (let I = 0; I < 3; I++) {
      ro(zt, 0.25, qe);
      let se = Ze(8, 22);
      M(
        L,
        Z,
        J,
        qe.x * se,
        qe.y * se,
        qe.z * se,
        Ze(0.08, 0.22),
        0.012,
        30,
        18,
        7,
        0,
      );
    }
    (_(
      L + zt.x * 0.2,
      Z + zt.y * 0.2,
      J + zt.z * 0.2,
      zt.x * 1.5,
      zt.y * 1.5 + 0.2,
      zt.z * 1.5,
      Ze(0.5, 0.9),
      0.08 * V,
      0.45 * V,
      0.5,
      0.5,
      0.52,
      0.16,
      1,
      3,
      0.3,
      0.8,
      -1,
    ),
      Es.copy(ee).addScaledVector(zt, 0.25),
      b(Es, 16756832, 16 * V, 7 * V, 0.05));
  }
  function N(ee, B) {
    f.add(ee, B);
  }
  let Q = {
    pos: new Vector3(),
    size: 1,
  };
  function K(ee, B = 1) {
    let P = Math.max(0.4, Math.min(B, 4)),
      V = ee.x,
      Y = ee.y,
      L = ee.z,
      Z = Math.sqrt(P),
      J = A(ee),
      oe = Y - J < 1.4 * P,
      fe = m(ee, Ei);
    (Es.set(V, Y + 0.4, L),
      b(Es, 16769712, 320 * P, 10 + 9 * P, 0.08),
      b(Es, 16747056, 55 * P, 8 + 6 * P, 0.45));
    let le = Y + 0.35 * P;
    (w(V, le, L, 0.055, 1.5 * P, 2.3 * P, 16, 13.5, 9.5, oo),
      w(V, le, L, 0.05, 2.6 * P, 4.2 * P, 7, 5, 2.4, n0 + ((ht() * 2) | 0)),
      w(V, le, L, 0.3, 3.5 * P, 5.5 * P, 0.35, 0.2, 0.08, oo));
    let R = Math.round(13 + 5 * P);
    for (let ae = 0; ae < R; ae++) {
      (ro(Ei, 1.6, qe), oe && qe.y < -0.1 && (qe.y = -qe.y * 0.5));
      let k = Ze(2.2, 7.5) * Z,
        ce = Ze(0.7, 1.15),
        ve = l.emit(
          V + qe.x * 0.3 * P,
          le + qe.y * 0.3 * P,
          L + qe.z * 0.3 * P,
          qe.x * k,
          qe.y * k + 1.4,
          qe.z * k,
          Ze(0.55, 1.05),
          0.85 * P,
          Ze(1.8, 2.7) * P,
        );
      ve >= 0 &&
        ((l.frame[ve] = ae % 4 === 0 ? 7 : (ht() * 6) | 0),
        (l.ramp[ve] = 2),
        (l.r[ve] = 5.8 * ce),
        (l.g[ve] = 2.4 * ce),
        (l.b[ve] = 0.5 * ce),
        (l.a[ve] = 0.96),
        (l.shade[ve] = 2 + fe),
        (l.drag[ve] = 4),
        (l.grav[ve] = -2.6),
        (l.wind[ve] = 0.6),
        (l.turb[ve] = 1.5),
        (l.rot[ve] = ht() * 6.283),
        (l.rotv[ve] = (ht() - 0.5) * 2.5),
        (l.sk[ve] = 3),
        (l.fin[ve] = 0),
        (l.fout[ve] = 0.6));
    }
    for (let ae = 0; ae < 5; ae++) {
      ro(Ei, 1.4, qe);
      let k = Ze(2, 5) * Z,
        ce = c.emit(
          V + qe.x * 0.3 * P,
          le + qe.y * 0.3 * P,
          L + qe.z * 0.3 * P,
          qe.x * k,
          Math.abs(qe.y) * k + 1.2,
          qe.z * k,
          Ze(0.3, 0.55),
          0.6 * P,
          Ze(1.2, 1.8) * P,
        );
      ce >= 0 &&
        ((c.frame[ce] = V1),
        (c.ramp[ce] = 2),
        (c.r[ce] = 2.4),
        (c.g[ce] = 1.1),
        (c.b[ce] = 0.3),
        (c.drag[ce] = 4),
        (c.grav[ce] = -2.5),
        (c.rot[ce] = ht() * 6.283),
        (c.sk[ce] = 3),
        (c.fout[ce] = 0.4));
    }
    let I = Math.round(11 + 5 * P);
    for (let ae = 0; ae < I; ae++) {
      let k = ae % 2 === 0;
      (ro(Ei, 1.4, qe), oe && qe.y < 0 && (qe.y = -qe.y * 0.4));
      let ce = (k ? Ze(4.5, 9) : Ze(1.5, 5)) * Z,
        ve = Ze(0.04, 0.1),
        _e = k ? 0.75 : 0.3,
        Te = _(
          V + qe.x * _e * P,
          le + qe.y * _e * P,
          L + qe.z * _e * P,
          qe.x * ce,
          qe.y * ce + 0.8,
          qe.z * ce,
          Ze(2.8, 4.8),
          (k ? 0.8 : 1.2) * P,
          Ze(2.6, 4.2) * P,
          ve,
          ve * 0.95,
          ve * 0.9,
          k ? 0.7 : 0.8,
          fe,
          3.4,
          Ze(0.8, 1.7),
          1,
          ae % 3 === 0 ? 7 : -1,
        );
      Te >= 0 &&
        ((l.fin[Te] = k ? 0.025 : 0.16),
        (l.fout[Te] = 0.35),
        (l.turb[Te] = 1.2));
    }
    X(V, Y + 0.3 * P, L, "smolder", 1.3 + 0.3 * P, P, fe);
    let se = Math.min(90, Math.round(34 * P));
    for (let ae = 0; ae < se; ae++) {
      (ro(Ei, 1.5, qe), oe && qe.y < 0 && (qe.y = -qe.y));
      let k = Ze(6, 26) * Z,
        ce = M(
          V,
          Y + 0.05,
          L,
          qe.x * k,
          qe.y * k,
          qe.z * k,
          Ze(0.5, 1.5),
          Ze(0.014, 0.028),
          40,
          23,
          8,
          qc,
        );
      ce >= 0 && ((c.drag[ce] = 1.4), (c.stretch[ce] = 0.035));
    }
    for (let ae = 0; ae < 10 * P; ae++) {
      ro(Ei, 1.2, qe);
      let k = Ze(1, 5),
        ce = c.emit(
          V,
          Y + 0.3,
          L,
          qe.x * k,
          Math.abs(qe.y) * k + 1,
          qe.z * k,
          Ze(1.4, 3),
          0.035,
          0.02,
        );
      ce >= 0 &&
        ((c.frame[ce] = oo),
        (c.ramp[ce] = 3),
        (c.r[ce] = 9),
        (c.g[ce] = 4),
        (c.b[ce] = 1),
        (c.drag[ce] = 1.2),
        (c.grav[ce] = 0.6),
        (c.turb[ce] = 3),
        (c.wind[ce] = 1),
        (c.fout[ce] = 0.5));
    }
    if (oe) {
      let ae = J + 0.015;
      S(V, ae, L, 0.32, 0.6 * P, 9 * P, 1.6, 1.2, 0.75);
      let k = Math.round(12 + 3 * P);
      for (let ce = 0; ce < k; ce++) {
        let ve = ((ce + ht()) / k) * 6.283,
          _e = Ze(5, 10) * Z,
          Te = Ze(0.42, 0.55),
          Pe = _(
            V + Math.cos(ve) * 0.4 * P,
            ae + 0.2,
            L + Math.sin(ve) * 0.4 * P,
            Math.cos(ve) * _e,
            Ze(0.2, 0.9),
            Math.sin(ve) * _e,
            Ze(1.2, 2.2),
            0.4 * P,
            Ze(1.2, 1.9) * P,
            Te,
            Te * 0.96,
            Te * 0.9,
            0.26,
            fe,
            3,
            0.15,
            0.7,
            -1,
          );
        Pe >= 0 && (l.fin[Pe] = 0.1);
      }
      (Ho.set(V, J, L), p.add(Ho, Ei, "scorch", 2.3 * P, 1, 0.92));
    }
    (Ho.set(V, Math.max(Y, J + 0.1), L),
      z(
        Ho,
        Ei,
        Math.round(13 + 6 * P),
        4,
        13 * Z,
        0.04,
        0.13,
        0.025,
        0.08,
        0.04,
        0.13,
        0.07,
        0.066,
        0.062,
        1.1,
        J,
      ),
      Q.pos.copy(ee),
      (Q.size = B),
      context.events.emit("explosion", Q));
  }
  let ie = [];
  for (let ee = 0; ee < 24; ee++) {
    let B = {
      active: !1,
      kind: "steam",
      pos: new Vector3(),
      acc: 0,
      acc2: 0,
      ttl: 1 / 0,
      scale: 1,
      shade: 1,
      t: 0,
      light: null,
      drop: -1,
    };
    ((B.stop = () => {
      ((B.active = !1), B.light && (B.light.release(), (B.light = null)));
    }),
      (B.setPos = (P) => {
        B.pos.copy(P);
      }),
      ie.push(B));
  }
  let F = {
    active: !1,
    pos: new Vector3(),
    stop() {},
    setPos() {},
  };
  function X(ee, B, P, V, Y, L, Z) {
    let J = null;
    for (let oe = 0; oe < ie.length; oe++)
      if (!ie[oe].active) {
        J = ie[oe];
        break;
      }
    if (!J) return F;
    if (
      ((J.active = !0),
      (J.kind = V),
      J.pos.set(ee, B, P),
      (J.acc = 0),
      (J.acc2 = 0),
      (J.ttl = Y),
      (J.scale = L),
      (J.t = 0),
      (J.drop = -1),
      (J.shade = Z === void 0 ? m(J.pos, null) : Z),
      V === "fire")
    ) {
      let oe = y();
      ((J.light = oe && oe.acquire ? oe.acquire() : null),
        J.light &&
          (J.light.light.color.set(16747066),
          (J.light.light.distance = 9),
          J.light.light.position.set(ee, B + 0.5, P)));
    }
    return J;
  }
  function ne(ee, B = "steam", P = {}) {
    return X(ee.x, ee.y, ee.z, B, P.ttl || 1 / 0, P.scale || 1, void 0);
  }
  function re(ee) {
    for (let B = 0; B < ie.length; B++) {
      let P = ie[B];
      if (!P.active) continue;
      if (((P.t += ee), P.t > P.ttl)) {
        P.stop();
        continue;
      }
      let V = P.pos.x,
        Y = P.pos.y,
        L = P.pos.z,
        Z = P.scale;
      if (P.kind === "steam")
        for (P.acc += ee * 13; P.acc > 1;) {
          P.acc -= 1;
          let J = _(
            V + (ht() - 0.5) * 0.08,
            Y,
            L + (ht() - 0.5) * 0.08,
            (ht() - 0.5) * 0.4,
            Ze(1.4, 2.4),
            (ht() - 0.5) * 0.4,
            Ze(1.8, 3),
            0.12 * Z,
            Ze(0.8, 1.3) * Z,
            0.8,
            0.82,
            0.85,
            0.2,
            P.shade,
            1.3,
            0.5,
            1,
            -1,
          );
          J >= 0 && ((l.fin[J] = 0.12), (l.turb[J] = 0.9));
        }
      else if (P.kind === "smolder")
        for (P.acc += ee * 9 * (1 - P.t / P.ttl); P.acc > 1;) {
          P.acc -= 1;
          let J = Ze(0.05, 0.11),
            oe = _(
              V + (ht() - 0.5) * 0.5 * Z,
              Y,
              L + (ht() - 0.5) * 0.5 * Z,
              (ht() - 0.5) * 0.6,
              Ze(1.2, 2.4),
              (ht() - 0.5) * 0.6,
              Ze(2.4, 3.8),
              0.5 * Z,
              Ze(1.6, 2.6) * Z,
              J,
              J,
              J,
              0.6,
              P.shade,
              1,
              0.9,
              1,
              -1,
            );
          oe >= 0 && ((l.fin[oe] = 0.12), (l.turb[oe] = 1));
        }
      else if (P.kind === "embers")
        for (P.acc += ee * 8; P.acc > 1;) {
          P.acc -= 1;
          let J = c.emit(
            V + (ht() - 0.5) * 0.4 * Z,
            Y,
            L + (ht() - 0.5) * 0.4 * Z,
            (ht() - 0.5) * 0.6,
            Ze(0.6, 1.8),
            (ht() - 0.5) * 0.6,
            Ze(1.5, 3.2),
            Ze(0.02, 0.04),
            0.012,
          );
          J >= 0 &&
            ((c.frame[J] = oo),
            (c.ramp[J] = 3),
            (c.r[J] = 10),
            (c.g[J] = 4.2),
            (c.b[J] = 1),
            (c.drag[J] = 0.8),
            (c.grav[J] = -0.5),
            (c.turb[J] = 3.5),
            (c.wind[J] = 1),
            (c.fout[J] = 0.5));
        }
      else if (P.kind === "fire") {
        for (P.acc += ee * 24; P.acc > 1;) {
          P.acc -= 1;
          let J = c.emit(
            V + (ht() - 0.5) * 0.3 * Z,
            Y + 0.1 * Z,
            L + (ht() - 0.5) * 0.3 * Z,
            (ht() - 0.5) * 0.5,
            Ze(1.2, 2.6) * Z,
            (ht() - 0.5) * 0.5,
            Ze(0.35, 0.65),
            0.45 * Z,
            Ze(0.2, 0.35) * Z,
          );
          J >= 0 &&
            ((c.frame[J] = V1),
            (c.ramp[J] = 2),
            (c.r[J] = 9),
            (c.g[J] = 5.5),
            (c.b[J] = 2.2),
            (c.drag[J] = 1),
            (c.rot[J] = ht() * 6.283),
            (c.rotv[J] = (ht() - 0.5) * 4),
            (c.fin[J] = 0.12),
            (c.fout[J] = 0.4),
            (c.wind[J] = 1),
            (c.turb[J] = 2));
        }
        for (P.acc2 += ee * 4; P.acc2 > 1;) {
          P.acc2 -= 1;
          let J = Ze(0.05, 0.1),
            oe = _(
              V,
              Y + 0.8 * Z,
              L,
              (ht() - 0.5) * 0.4,
              Ze(1.2, 2),
              (ht() - 0.5) * 0.4,
              Ze(2.2, 3.4),
              0.3 * Z,
              Ze(1.1, 1.8) * Z,
              J,
              J,
              J,
              0.5,
              P.shade,
              0.9,
              0.8,
              1,
              -1,
            );
          oe >= 0 && ((l.fin[oe] = 0.2), (l.turb[oe] = 1));
          let fe = c.emit(
            V + (ht() - 0.5) * 0.3,
            Y + 0.3,
            L + (ht() - 0.5) * 0.3,
            ht() - 0.5,
            Ze(1.5, 3),
            ht() - 0.5,
            Ze(1, 2.2),
            0.03,
            0.012,
          );
          fe >= 0 &&
            ((c.frame[fe] = oo),
            (c.ramp[fe] = 3),
            (c.r[fe] = 10),
            (c.g[fe] = 4.2),
            (c.b[fe] = 1),
            (c.drag[fe] = 0.8),
            (c.grav[fe] = -0.6),
            (c.turb[fe] = 4),
            (c.wind[fe] = 1));
        }
        P.light &&
          (P.light.light.intensity =
            (14 + 6 * Math.sin(P.t * 23) + 4 * Math.sin(P.t * 37.7)) * Z);
      } else if (P.kind === "drip") {
        if (
          ((P.acc += ee * 1.6), P.drop >= 0 && ((P.drop -= ee), P.drop < 0))
        ) {
          let J = P.shade;
          S(
            V,
            0.014,
            L,
            0.8,
            0.05,
            0.55,
            0.4 * J + 0.14,
            0.36 * J + 0.16,
            0.3 * J + 0.18,
          );
          for (let oe = 0; oe < 3; oe++) {
            ro(Ei, 0.7, qe);
            let fe = c.emit(
              V,
              0.03,
              L,
              qe.x * 1.2,
              Math.abs(qe.y) * 1.6,
              qe.z * 1.2,
              0.35,
              0.012,
              0.008,
            );
            fe >= 0 &&
              ((c.mode[fe] = 1),
              (c.frame[fe] = Gc),
              (c.stretch[fe] = 0.012),
              (c.grav[fe] = 9.81),
              (c.r[fe] = 1.6 * J + 0.3),
              (c.g[fe] = 1.3 * J + 0.4),
              (c.b[fe] = 0.9 * J + 0.5),
              (c.flags[fe] = Xc));
          }
        }
        for (; P.acc > 1;) {
          P.acc -= 1 + ht() * 0.6;
          let J = Math.sqrt((2 * Math.max(Y, 0.05)) / 9.81),
            oe = c.emit(V, Y, L, 0, -0.2, 0, J + 0.05, 0.014, 0.014);
          (oe >= 0 &&
            ((c.mode[oe] = 1),
            (c.frame[oe] = Gc),
            (c.stretch[oe] = 0.02),
            (c.grav[oe] = 9.81),
            (c.r[oe] = 1.4 * P.shade + 0.4),
            (c.g[oe] = 1.2 * P.shade + 0.5),
            (c.b[oe] = 0.9 * P.shade + 0.6),
            (c.flags[oe] = Xc),
            (c.fout[oe] = 0.98)),
            (P.drop = J));
        }
      }
    }
  }
  context.events.on("impact", (ee) => {
    !ee || !ee.point || C(ee.point, ee.normal, ee.surface, ee.dir, ee.enemy);
  });
  let $ = (ee, B) => {
    try {
      return !!(
        context.ground &&
        context.ground.isPuddle &&
        context.ground.isPuddle(ee, B)
      );
    } catch {
      return !1;
    }
  };
  (context.events.on("player:step", (ee) => {
    let B = (ee && ee.pos) || (context.player && context.player.pos);
    B &&
      ((ee && ee.surface === "water") || $(B.x, B.z)) &&
      (Ho.set(B.x, Math.max(0, B.y), B.z), T(Ho, ee && ee.sprint ? 0.55 : 0.4));
  }),
    context.events.on("player:land", (ee) => {
      let B = context.player && context.player.pos;
      if (B) {
        if (
          (Ho.set(B.x, Math.max(0, B.y), B.z),
          (ee && ee.surface === "water") || $(B.x, B.z))
        )
          T(Ho, 0.9);
        else if (ee && ee.speed > 5) {
          let P = m(Ho, Ei);
          for (let V = 0; V < 6; V++) {
            let Y = ht() * 6.283;
            _(
              Ho.x + Math.cos(Y) * 0.2,
              Ho.y + 0.08,
              Ho.z + Math.sin(Y) * 0.2,
              Math.cos(Y) * 1.6,
              0.3,
              Math.sin(Y) * 1.6,
              Ze(0.7, 1.2),
              0.15,
              Ze(0.5, 0.8),
              0.45,
              0.44,
              0.42,
              0.22,
              P,
              3,
              0.1,
              0.8,
              -1,
            );
          }
        }
      }
    }));
  function ue(ee) {
    (ee > 0 || (ee = 0), (v += ee), re(ee));
    let B = context.camera ? context.camera.position : Es.set(0, 0, 0);
    (r.begin(),
      l.update(ee, r, B, t, v),
      r.end(),
      a.begin(),
      c.update(ee, a, B, t, v),
      u.update(ee, a, W1, oo),
      a.end(),
      h.update(ee),
      f.update(ee));
  }
  function me() {
    (l.clear(), c.clear(), u.clear(), h.clear(), f.clear(), p.clear());
    for (let ee of ie) ee.active && ee.stop();
    (r.begin(), r.end(), a.begin(), a.end());
  }
  return {
    update: ue,
    clear: me,
    muzzleFlash: j,
    tracer: G,
    impact: C,
    sparks: H,
    smoke: O,
    dust: q,
    explosion: K,
    shell: N,
    splash: T,
    addEmitter: ne,
    debris: U,
    decal(ee, B, P = "bullet_concrete", V) {
      (Et.copy(B || Ei), p.add(ee, Et, P, V));
    },
    wind: t,
    root: d,
    stats() {
      return {
        lit: l.n,
        add: c.n,
        tracers: u.n,
        debris: h.live,
        drawCalls: 5,
      };
    },
  };
}

function showcaseEffects(context) {
  let e = context.fx,
    t = context.params.fxshow || "all",
    n = new Group(),
    s = (N, Q, K, ie, F) => {
      let X = new Mesh(N, context.mats.get(Q));
      return (
        X.position.set(K, ie, F),
        (X.castShadow = X.receiveShadow = !0),
        n.add(X),
        X
      );
    };
  (s(beveledBoxGeometry(2.6, 2.2, 0.3, 0.02), "concrete", -3.2, 1.1, 0),
    s(beveledBoxGeometry(2.2, 2, 0.08, 0.01), "paint_blue", 0, 1, 0),
    s(beveledBoxGeometry(1.2, 1.2, 1.2, 0.015), "wood_pallet", 3.2, 0.6, 0),
    context.scene.add(n),
    context.physics.addBox([-4.5, 0, -0.15], [-1.9, 2.2, 0.15], {
      surface: "concrete",
    }),
    context.physics.addBox([-1.1, 0, -0.04], [1.1, 2, 0.04], {
      surface: "metal",
    }),
    context.physics.addBox([2.6, 0, -0.6], [3.8, 1.2, 0.6], {
      surface: "wood",
    }));
  let o = (N, Q, K) => new Vector3(N, Q, K),
    r = o(-6.5, 1.5, 7),
    a = o(6.5, 1.4, 7),
    l = o(5.2, 1.3, 3.2),
    c = o(-4.6, 1.35, 4.2),
    u = o(0, 0, 0),
    h = o(0, 0, 0),
    f = o(0, 0, 0),
    p = o(0, 1, 0),
    d = {
      point: o(0, 0, 0),
      normal: o(0, 1, 0),
      surface: "concrete",
      dir: o(0, 0, 0),
      enemy: null,
      from: "player",
    },
    v = Math.random,
    g = 0,
    x = 0,
    y = 0,
    b = 0,
    m = 0,
    A = 0.2,
    _ = 0,
    M = 3.4,
    E = !1,
    w = t === "all" || t === "impact",
    S = t === "all" || t === "explosion",
    z = t === "all" || t === "tracer",
    H = t === "explosion" ? 2.4 : 3.5;
  (t === "explosion" && (M = 0.6),
    (t === "all" || t === "impact") &&
      (e.addEmitter(o(-6.2, 0.05, -1.5), "steam"),
      e.addEmitter(o(5.6, 0, 1.6), "fire"),
      e.addEmitter(o(0.4, 2.6, 1.6), "drip")));
  function O(N) {
    let Q = y++ % 2 ? a : r;
    if (((d.enemy = null), (d.from = "player"), N === 5)) {
      (d.point.set(-1.5 + v() * 0.3, 2.5 + v() * 0.3, 0.8),
        d.normal.copy(Q).sub(d.point).normalize(),
        (d.surface = "enemy"),
        (d.enemy = {}),
        d.dir.copy(d.point).sub(Q).normalize(),
        e.tracer(Q, d.point),
        context.events.emit("impact", d));
      return;
    }
    (N === 0
      ? u.set(-3.2 + (v() - 0.5) * 2, 0.4 + v() * 1.5, 0)
      : N === 1 || N === 7
        ? u.set((v() - 0.5) * 1.8, 0.3 + v() * 1.5, 0)
        : N === 2
          ? u.set(3.2 + (v() - 0.5) * 0.9, 0.2 + v() * 0.9, 0.6)
          : N === 3
            ? u.set(-1.6 + (v() - 0.5) * 1.2, 0, 2.2 + v())
            : N === 4
              ? u.set(1.5 + (v() - 0.5) * 0.8, 0, 2.6 + v() * 0.8)
              : u.set(3.4 + (v() - 0.5), 0, 2.4 + v() * 0.6),
      h.copy(u).sub(Q).normalize());
    let K = context.physics.raycast(Q, h, 100);
    K &&
      (d.point.copy(K.point),
      d.normal.copy(K.normal),
      d.dir.copy(h),
      (d.surface = N === 4 ? "water" : N === 6 ? "dirt" : K.surface),
      e.tracer(Q, d.point),
      context.events.emit("impact", d));
  }
  let q = context.params.fxhold,
    U = o(0, 1.3, 3),
    T = o(1, 0, 0);
  function D(N) {
    if (
      ((g += N),
      q === "muzzle" &&
        (e.muzzleFlash(U, T, {
          scale: 1,
        }),
        (U.x = 2.5),
        T.set(-0.5, 0, 0.86),
        e.muzzleFlash(U, T, {
          scale: 1.6,
        }),
        (U.x = 0),
        T.set(1, 0, 0)),
      w)
    )
      for (m -= N; m <= 0;) ((m += t === "impact" ? 0.09 : 0.13), O(x++ % 8));
    if (
      (z &&
        ((A -= N),
        A <= 0 &&
          ((A += t === "tracer" ? 0.16 : 0.45),
          f.set(-5 + v() * 3, 1.2 + v() * 0.8, 6 + v() * 2),
          h.copy(f).sub(l).normalize(),
          e.muzzleFlash(l, h, {
            scale: 1,
          }),
          e.tracer(l, f, {
            color: 16730658,
            speed: 120,
          }),
          t === "tracer" &&
            (f.set(6, 1 + v() * 1.5, -6 - v() * 6),
            u.set(-7, 1.6, 6.5),
            e.tracer(u, f, {
              speed: 200,
            }))),
        (_ -= N),
        _ <= 0 &&
          ((_ += 0.22),
          f.set(1.6 + v() * 0.8, 1.6 + v() * 0.8, 0.4 + (v() - 0.5) * 0.8),
          e.shell(c, f))),
      S && ((M -= N), M <= 0))
    ) {
      M += H;
      let Q = +(context.params.fxsize || 0) || 1 + (b++ % 3);
      (f.set(t === "explosion" ? 0 : 7, 0.25, t === "explosion" ? 3.5 : -3.5),
        e.explosion(f, Q));
    }
  }
  let C = !1,
    G = e.update;
  e.update = (N) => {
    C || G(N);
  };
  let j = window.__setShot;
  return (
    j &&
      (window.__setShot = (N) => {
        if (N && N.fxage !== void 0) {
          (e.clear(), f.set(0, 0.25, 3.5), e.explosion(f, +(N.fxsize || 1.2)));
          let Q = +N.fxage;
          for (let K = 0; K < Q - 1e-6; K += 1 / 60) G(1 / 60);
          (G(0), (C = !0));
        }
        j(N);
      }),
    {
      cam: t === "explosion" ? [0, 2, 12.5] : [0.3, 1.6, 7.2],
      target: t === "explosion" ? [0, 2.2, 3.5] : [0.2, 1, 0],
      update(N) {
        if (!E) {
          E = !0;
          let Q = +(context.params.fxt || 0);
          for (let K = 0; K < Q; K += 1 / 30) (D(1 / 30), e.update(1 / 30));
        }
        C || D(N);
      },
    }
  );
}

export { createEffects, effectsShowcaseModule, showcaseEffects };
