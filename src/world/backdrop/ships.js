import {
  BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Quaternion,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "../../vendor/three-r180.js";
import {
  Bn,
  Ee,
  Ke,
  _t,
  hv,
  io,
  jt,
  kr,
  ll,
  ns,
  so,
  ua,
  xt,
} from "./geometry.js";

var rt = 41;

var vR = 8;

var Eo = -9;

var qn = 63;

var xR = -4.4;

var Fs = 13;

var Vc = -1.6;

var gb = (i, e, t) => {
  let n = Math.min(1, Math.max(0, (t - i) / (e - i)));
  return n * n * (3 - 2 * n);
};

var yR = (i) =>
  1.7 * Math.pow(Math.max(0, 1 - i / 20), 2) +
  0.5 * Math.pow(Math.max(0, (i - (qn - 12)) / 12), 2);

var hs = (i) => Fs + yR(i);

var Tf = (i) => 1.15 * (1 - gb(14.5, 18, i) + gb(qn - 10.5, qn - 8, i));

var Bo = (i) => hs(i) + Tf(i);

var bR = Bo(0);

function fn(i, e, t) {
  let n = (bR - e) * 0.22,
    s = Math.max(0, 1 - i / 22),
    o = Eo - i - n * s,
    r = Math.min(1, Math.max(0, (e - Vc) / (Fs - Vc))),
    a = 17 - 8.5 * Math.pow(r, 1.3),
    l = i / a,
    c = l >= 1 ? 1 : Math.pow(Math.sin((l * Math.PI) / 2), 0.72),
    u = 0.2 + (vR - 0.2) * c,
    h = (i - (qn - 10)) / 10;
  return (
    h > 0 && (u *= 1 - 0.24 * h * h * (1 - 0.6 * r)),
    new Vector3(rt + t * u, e, o)
  );
}

function ha(i, e, t) {
  let s = fn(i + 0.05, e, t).sub(fn(Math.max(0, i - 0.05), e, t)),
    o = fn(i, e + 0.05, t).sub(fn(i, e - 0.05, t)),
    r = s.cross(o).normalize();
  return (r.x * t + r.z * 0.25 < 0 && r.negate(), r);
}

function ul(i, e, t, n, s, o = 0.012, r = 6, a = 1) {
  let l = [],
    c = [],
    u = [],
    h = [];
  for (let d = 0; d <= a; d++)
    for (let v = 0; v <= r; v++) {
      let g = i + ((e - i) * v) / r,
        x = t + ((n - t) * d) / a,
        y = ha(g, x, s),
        b = fn(g, x, s).addScaledVector(y, o);
      (l.push(b.x, b.y, b.z),
        u.push(y.x, y.y, y.z),
        c.push(s < 0 ? 1 - v / r : v / r, d / a));
    }
  let f = r + 1;
  for (let d = 0; d < a; d++)
    for (let v = 0; v < r; v++) {
      let g = d * f + v,
        x = g + 1,
        y = g + f + 1,
        b = g + f;
      s > 0 ? h.push(g, x, y, g, y, b) : h.push(g, y, x, g, b, y);
    }
  let p = new BufferGeometry();
  return (
    p.setAttribute("position", new Float32BufferAttribute(l, 3)),
    p.setAttribute("normal", new Float32BufferAttribute(u, 3)),
    p.setAttribute("uv", new Float32BufferAttribute(c, 2)),
    p.setIndex(h),
    p
  );
}

var D1 = class {
  constructor() {
    ((this.p = []), (this.n = []), (this.u = []), (this.c = []));
  }
  v(e, t, n, s, o) {
    (this.p.push(e.x, e.y, e.z),
      this.n.push(t.x, t.y, t.z),
      this.u.push(n, s),
      this.c.push(o[0], o[1], o[2]));
  }
  quad(e, t, n, s) {
    let o = e[1].clone().sub(e[0]),
      r = e[3].clone().sub(e[0]),
      a = o.cross(r).dot(t[0]) >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (let l of a) this.v(e[l], t[l], n[l][0], n[l][1], s[l]);
  }
  geo() {
    let e = new BufferGeometry();
    return (
      e.setAttribute("position", new Float32BufferAttribute(this.p, 3)),
      e.setAttribute("normal", new Float32BufferAttribute(this.n, 3)),
      e.setAttribute("uv", new Float32BufferAttribute(this.u, 2)),
      e.setAttribute("color", new Float32BufferAttribute(this.c, 3)),
      e
    );
  }
};

var hl = (i, e) => {
  let t = Math.imul(i + 31, 374761393) ^ Math.imul(e + 17, 668265263);
  return (
    (t = Math.imul(t ^ (t >>> 13), 1274126177)),
    ((t ^ (t >>> 16)) >>> 0) / 4294967295
  );
};

function vb(i, e) {
  let t = new io(),
    n = so(i, "hull_paint"),
    s = so(i, "hull_red"),
    o = so(i, "paint_white"),
    r = i.mats.get("steel_dark"),
    a = i.mats.get("steel_galv"),
    l = i.mats.get("rope"),
    c = i.mats.get("rubber"),
    u = [2.6, 1.75, 0.95],
    h = ($) => e.add($, u, 0),
    f = ($, ue, me) => t.add($, ue, me),
    p = [0, 0.35, 0.9, 1.8, 3, 4.5, 6, 8, 10, 12, 14.5, 17, 20];
  for (let $ = 23; $ < qn - 0.5; $ += 3) p.push($);
  p.push(qn);
  let d = [0, 0.17, 0.34, 0.5, 0.66, 0.83, 1],
    v = ($) => {
      let ue = hs($),
        me = [xR, -2.3, -0.4, 1];
      for (let ee = 1; ee < d.length; ee++) me.push(1 + (ue - 1) * d[ee]);
      return (me.push(Bo($)), me);
    },
    g = 10,
    x = 3,
    y = new D1(),
    b = new D1(),
    m = ($, ue, me, ee) => {
      let B = hv($.x * 0.6, $.y, $.z * 0.6, void 0, 0.8),
        P = [B[0] * ee, B[1] * ee, B[2] * ee];
      return (
        ue < x
          ? $.y < -0.2
            ? ((P[0] *= 0.55), (P[1] *= 0.72), (P[2] *= 0.55))
            : me && ((P[0] *= 1.12), (P[1] *= 1), (P[2] *= 0.92))
          : $.y < 1.1 && ((P[0] *= 1.7), (P[1] *= 1.62), (P[2] *= 1.45)),
        P
      );
    };
  for (let $ of [-1, 1])
    for (let ue = 0; ue < p.length - 1; ue++) {
      let me = p[ue],
        ee = p[ue + 1],
        B = v(me),
        P = v(ee);
      for (let V = 0; V < g; V++) {
        if (V === g - 1 && Tf(me) < 0.02 && Tf(ee) < 0.02) continue;
        let Y = (V < x ? 0.8 : 0.58) + 0.36 * hl(ue * 7 + ($ > 0 ? 100 : 0), V),
          L = [
            fn(me, B[V], $),
            fn(ee, P[V], $),
            fn(ee, P[V + 1], $),
            fn(me, B[V + 1], $),
          ],
          Z = [
            ha(me, B[V], $),
            ha(ee, P[V], $),
            ha(ee, P[V + 1], $),
            ha(me, B[V + 1], $),
          ],
          J = [
            [me, B[V]],
            [ee, P[V]],
            [ee, P[V + 1]],
            [me, B[V + 1]],
          ],
          oe = [
            m(L[0], V, !1, Y),
            m(L[1], V, !1, Y),
            m(L[2], V, !0, Y),
            m(L[3], V, !0, Y),
          ];
        if (me > 1.5 && V >= 2 && V < g - 1) {
          let fe = L[0]
            .clone()
            .add(L[1])
            .add(L[2])
            .add(L[3])
            .multiplyScalar(0.25);
          for (let le = 0; le < 4; le++)
            Z[le]
              .addScaledVector(fe.clone().sub(L[le]).normalize(), 0.075)
              .normalize();
        }
        (V < x ? y : b).quad(L, Z, J, oe);
      }
    }
  {
    let $ = v(0),
      ue = v(qn),
      me = _t(0, 0.2, 1).normalize(),
      ee = _t(0, 0, -1),
      B = _t(0, 1, 0);
    for (let P = 0; P < g; P++) {
      let V = P < x ? [0.8, 0.8, 0.8] : [0.9, 0.9, 0.9];
      ((P < x ? y : b).quad(
        [
          fn(0, $[P], -1),
          fn(0, $[P], 1),
          fn(0, $[P + 1], 1),
          fn(0, $[P + 1], -1),
        ],
        [me, me, me, me],
        [
          [0, $[P]],
          [0.4, $[P]],
          [0.4, $[P + 1]],
          [0, $[P + 1]],
        ],
        [V, V, V, V],
      ),
        (P < x ? y : b).quad(
          [
            fn(qn, ue[P], -1),
            fn(qn, ue[P], 1),
            fn(qn, ue[P + 1], 1),
            fn(qn, ue[P + 1], -1),
          ],
          [ee, ee, ee, ee],
          [
            [0, ue[P]],
            [14, ue[P]],
            [14, ue[P + 1]],
            [0, ue[P + 1]],
          ],
          [V, V, V, V],
        ));
    }
    for (let P = 0; P < p.length - 1; P++) {
      let V = fn(p[P], hs(p[P]), -1),
        Y = fn(p[P], hs(p[P]), 1),
        L = fn(p[P + 1], hs(p[P + 1]), 1),
        Z = fn(p[P + 1], hs(p[P + 1]), -1),
        J = [0.75, 0.72, 0.7];
      y.quad(
        [V, Y, L, Z],
        [B, B, B, B],
        [
          [V.x, V.z],
          [Y.x, Y.z],
          [L.x, L.z],
          [Z.x, Z.z],
        ],
        [J, J, J, J],
      );
    }
  }
  (f(s, y.geo()), f(n, b.geo()));
  {
    let $ = (me, ee) => fn(me, ee, -1).addScaledVector(ha(me, ee, -1), 0.012),
      ue = [1.05, 0.92, 0.8];
    for (let me = 2; me < p.length - 1; me++) {
      let ee = v(p[me]),
        B = v(p[me + 1]);
      for (let P = 4; P <= 9; P++)
        f(n, jt($(p[me], ee[P]), $(p[me + 1], B[P]), 0.03, 0.045), ue);
      for (let P = 3; P < 9; P++)
        (me + P) % 2 === 0 &&
          f(n, jt($(p[me], ee[P]), $(p[me], ee[P + 1]), 0.035, 0.03), ue);
    }
  }
  for (let $ of [-1, 1]) {
    for (let Y = 3; Y < p.length - 1; Y++) {
      let L = (Z, J) => fn(Z, J, $).addScaledVector(ha(Z, J, $), 0.07);
      (f(n, jt(L(p[Y], 9.6), L(p[Y + 1], 9.6), 0.16, 0.3), [0.55, 0.55, 0.55]),
        Tf(p[Y]) > 0.6 &&
          Tf(p[Y + 1]) > 0.6 &&
          f(
            r,
            Ke(fn(p[Y], Bo(p[Y]), $), fn(p[Y + 1], Bo(p[Y + 1]), $), 0.07, 6),
          ));
    }
    for (let Y = 0; Y < 3; Y++)
      f(r, Ke(fn(p[Y], Bo(p[Y]), $), fn(p[Y + 1], Bo(p[Y + 1]), $), 0.07, 6));
    let ue = [];
    for (let Y = 18; Y <= qn - 10.4; Y += 3)
      ue.push(fn(Y, hs(Y), $).add(_t(-$ * 0.12, 0, 0)));
    ns(t, r, ue, {
      h: 1.05,
      post: 1.5,
      r: 0.028,
    });
    let me = 4.6,
      ee = hs(me) - 2.3,
      B = fn(me, ee, $),
      P = ha(me, ee, $);
    f(
      r,
      Ke(
        B.clone().addScaledVector(P, -0.3),
        B.clone().addScaledVector(P, 0.22),
        0.5,
        12,
        !0,
      ),
    );
    let V = (Y, L, Z) => fn(Y, L, $).addScaledVector(ha(Y, L, $), Z);
    (f(r, jt(V(me, ee - 0.1, 0.34), V(me, ee - 2.3, 0.3), 0.22, 0.22, 0.03)),
      f(
        r,
        jt(
          V(me - 0.95, ee - 2.45, 0.34),
          V(me + 0.95, ee - 2.45, 0.34),
          0.42,
          0.42,
          0.05,
        ),
      ));
    for (let Y of [-0.8, 0.8])
      f(
        r,
        jt(
          V(me + Y, ee - 2.4, 0.3),
          V(me + Y * 1.1, ee - 1.1, 0.34),
          0.5,
          0.12,
          0.02,
        ),
      );
  }
  let A = i.mats.label("KITTIWAKE", {
    color: "white",
    font: "sans",
    distress: 0.3,
  });
  {
    let ue = Math.min(12, 1.7 * Math.max(2, A.aspect || 6));
    (f(A.material, ul(7.6, 7.6 + ue, 10.25, 10.25 + 1.7, -1, 0.014, 10, 1)),
      f(A.material, ul(7.6, 7.6 + ue, 10.25, 10.25 + 1.7, 1, 0.014, 10, 1)));
  }
  let _ = i.mats.decal("rust_run");
  f(
    _.material,
    ul(4.6 - 0.8, 4.6 + 0.8, hs(4.6) - 9.5, hs(4.6) - 2.6, -1, 0.012, 2, 3),
  );
  for (let $ = 21.5; $ < qn - 11; $ += 5.5) {
    let ue = fn($, Fs - 0.45, -1);
    f(
      r,
      Ee(
        ue.x - 0.04,
        ue.y - 0.09,
        ue.z - 0.3,
        ue.x + 0.01,
        ue.y + 0.09,
        ue.z + 0.3,
      ),
    );
    let me = 2.6 + 3.2 * hl(Math.round($ * 10), 5);
    f(
      _.material,
      ul($ - 0.45, $ + 0.45, Fs - 0.5 - me, Fs - 0.5, -1, 0.012, 1, 1),
    );
  }
  for (let $ of [6.4, qn - 7])
    for (let ue = 0; ue < 9; ue++) {
      let me = 1.6 + ue * 0.62;
      f(
        o,
        ul($, $ + (ue % 2 ? 0.28 : 0.5), me, me + 0.13, -1, 0.01, 1, 1),
        [1.1, 1.1, 1.05],
      );
    }
  (f(o, ul(33, 33.9, 3.2, 3.3, -1, 0.01, 1, 1), [1.1, 1.1, 1.05]),
    f(o, ul(33.4, 33.5, 2.4, 4.1, -1, 0.01, 1, 1), [1.1, 1.1, 1.05]));
  let M = hs(7);
  for (let $ of [-1, 1]) {
    (f(r, xt(0.55, 0.55, 0.9, "x", rt + $ * 1.5, M + 0.75, Eo - 6.2, 12)),
      f(
        r,
        Ee(rt + $ * 0.5, M, Eo - 6.9, rt + $ * 2.6, M + 0.5, Eo - 5.5, 0.04),
      ));
    for (let ue of [0, 0.7])
      f(r, xt(0.16, 0.16, 0.7, "y", rt + $ * 4.2, M + 0.35, Eo - 8.5 - ue, 8));
  }
  let E = Eo - 10.5,
    w = M + 15;
  (f(o, xt(0.26, 0.42, 15, "y", rt, M + 7.5, E, 10), [0.85, 0.8, 0.7]),
    f(
      o,
      Ee(rt - 2.6, M + 10, E - 0.12, rt + 2.6, M + 10.24, E + 0.12),
      [0.85, 0.8, 0.7],
    ),
    f(r, Ke([rt, w, E], [rt, w + 2.4, E], 0.03, 5)));
  for (let $ of [-1, 1])
    (f(
      r,
      Ke(
        [rt + $ * 2.5, M + 10.2, E],
        [rt + $ * 5.6, M + 0.6, E - 1.2],
        0.022,
        4,
      ),
    ),
      f(r, Ke([rt + $ * 2.5, M + 10.2, E], [rt, w, E], 0.02, 4)));
  (f(r, Ke([rt, w, E], [rt, Bo(0) + 0.3, Eo - 0.4], 0.022, 4)),
    f(r, Ke([rt, Bo(0), Eo - 0.3], [rt, Bo(0) + 2.6, Eo - 0.15], 0.03, 5)));
  let S = _t(rt, M + 2.2, E - 0.5),
    z = _t(rt + 1.2, M + 9.5, E - 11.5);
  (f(o, Ke(S, z, 0.2, 8, !0), [0.85, 0.8, 0.7]),
    f(r, Ke(z, [rt, w - 0.4, E], 0.022, 4)),
    f(r, Ke(z, [z.x, Fs + 4, z.z], 0.018, 4)),
    f(
      r,
      Ee(
        z.x - 0.18,
        Fs + 3.4,
        z.z - 0.18,
        z.x + 0.18,
        Fs + 4,
        z.z + 0.18,
        0.04,
      ),
    ),
    e.add(Bn(rt, w - 0.6, E + 0.5, 0.14), [5, 4.6, 3.8], 0));
  let H = [
    [0.62, 0.17, 0.13],
    [0.17, 0.29, 0.5],
    [0.2, 0.42, 0.3],
    [0.78, 0.36, 0.12],
    [0.8, 0.62, 0.16],
    [0.82, 0.83, 0.8],
    [0.4, 0.43, 0.47],
    [0.16, 0.42, 0.45],
  ];
  [
    [-45.6, 12.19],
    [-32.7, 12.19],
    [-22.8, 6.06],
  ].forEach(([$, ue], me) => {
    f(
      s,
      Ee(
        rt - 7.7,
        Fs,
        $ - ue / 2 - 0.2,
        rt + 7.7,
        Fs + 0.42,
        $ + ue / 2 + 0.2,
        0.04,
      ),
      [0.6, 0.6, 0.62],
    );
    for (let ee = 0; ee < 6; ee++) {
      let B = rt + (ee - 2.5) * 2.52,
        P = me === 2 ? 2 : 2 + (hl(ee * 3 + me, 9) > 0.4 ? 1 : 0);
      for (let V = 0; V < P; V++) {
        let Y = Fs + 0.44 + V * 2.61,
          L = H[Math.floor(hl(ee * 5 + V * 13 + me * 29, 2) * H.length)];
        if (
          (f(
            o,
            Ee(B - 1.22, Y, $ - ue / 2, B + 1.22, Y + 2.59, $ + ue / 2, 0.035),
            L,
          ),
          ee === 0)
        )
          for (let Z = $ - ue / 2 + 0.5; Z < $ + ue / 2 - 0.3; Z += 0.58)
            f(
              o,
              Ee(B - 1.24, Y + 0.15, Z - 0.1, B - 1.21, Y + 2.45, Z + 0.1),
              L,
            );
      }
    }
    for (let ee of [$ - ue / 2 - 0.45, $ + ue / 2 + 0.45]) {
      for (let B = 0; B <= 6; B++)
        f(
          r,
          Ee(
            rt + (B - 3) * 2.52 - 0.05,
            Fs,
            ee - 0.05,
            rt + (B - 3) * 2.52 + 0.05,
            Fs + 5.6,
            ee + 0.05,
          ),
        );
      for (let B of [Fs + 2.9, Fs + 5.6])
        f(r, Ee(rt - 7.6, B - 0.05, ee - 0.12, rt + 7.6, B + 0.05, ee + 0.12));
    }
  });
  let q = [0.92, 0.93, 0.92],
    U = -53,
    T = -66.5;
  [
    [7.2, 13, 15.9, 0],
    [6.7, 15.9, 18.7, 0.5],
    [6.3, 18.7, 21.5, 1],
    [6.5, 21.5, 24.4, 1.5],
  ].forEach(([$, ue, me, ee], B) => {
    (f(o, Ee(rt - $, ue, T + ee * 0.4, rt + $, me, U - ee, 0.08), q),
      f(
        o,
        Ee(
          rt - $ - 0.7,
          me - 0.06,
          T + ee * 0.4 - 0.3,
          rt + $ + 0.7,
          me + 0.06,
          U - ee + 1,
        ),
        [0.7, 0.72, 0.72],
      ));
    let P = me + 0.06,
      V = rt - $ - 0.67,
      Y = rt + $ + 0.67,
      L = U - ee + 0.97,
      Z = T + ee * 0.4 - 0.27;
    if (
      (ns(
        t,
        a,
        [
          [V, P, Z],
          [V, P, L],
          [Y, P, L],
          [Y, P, Z],
        ],
        {
          h: 1.05,
          post: 1.6,
          r: 0.026,
        },
      ),
      B < 3)
    )
      for (let J = U - ee - 1.2, oe = 0; J > T + 1.5; J -= 1.45, oe++) {
        let fe = hl(oe * 3 + B * 11, 4) > 0.8;
        for (let le of [-1, 1]) {
          let R = Ee(
            rt + le * ($ + 0.012) - 0.012,
            ue + 1.25,
            J - 0.33,
            rt + le * ($ + 0.012) + 0.012,
            ue + 1.85,
            J + 0.33,
          );
          fe && le < 0 ? h(R) : f(r, R);
        }
      }
    if (B < 3)
      for (let J = rt - $ + 1, oe = 0; J < rt + $ - 0.6; J += 1.5, oe++) {
        let fe = Ee(
          J - 0.33,
          ue + 1.25,
          U - ee - 0.01,
          J + 0.33,
          ue + 1.85,
          U - ee + 0.014,
        );
        hl(oe + B * 7, 8) > 0.84 ? h(fe) : f(r, fe);
      }
  });
  let C = 21.5,
    G = U - 1.5,
    j = 6.5;
  f(r, Ee(rt - j + 0.2, C + 1.3, G - 0.01, rt + j - 0.2, C + 2.25, G + 0.02));
  for (let $ = rt - j + 0.75, ue = 0; $ < rt + j - 0.4; $ += 1.05, ue++)
    (hl(ue, 21) > 0.62 &&
      h(Ee($ - 0.44, C + 1.36, G + 0.02, $ + 0.44, C + 2.19, G + 0.03)),
      f(o, Ee($ + 0.48, C + 1.3, G, $ + 0.57, C + 2.25, G + 0.04), q));
  for (let $ of [-1, 1])
    (f(
      r,
      Ee(
        rt + $ * j - 0.02,
        C + 1.3,
        G - 5,
        rt + $ * j + 0.02,
        C + 2.25,
        G - 0.2,
      ),
    ),
      f(
        o,
        Ee(
          rt + $ * 6.4,
          C - 0.12,
          G - 3.4,
          rt + $ * 8.3,
          C + 0.02,
          G + 0.9,
          0.03,
        ),
        q,
      ),
      f(o, Ee(rt + $ * 8.22, C, G - 3.4, rt + $ * 8.3, C + 1.1, G + 0.9), q),
      f(o, Ee(rt + $ * 6.5, C, G + 0.82, rt + $ * 8.3, C + 1.1, G + 0.9), q),
      f(
        r,
        jt(
          [rt + $ * 6.6, C - 2.6, G - 1.2],
          [rt + $ * 8.1, C - 0.1, G - 1.2],
          0.12,
          0.12,
        ),
      ),
      e.add(
        Bn(rt + $ * 8.25, C + 1.35, G - 0.4, 0.13),
        $ < 0 ? [0.3, 5, 1.6] : [6, 0.4, 0.3],
        0,
      ));
  (h(Ee(rt - 2.2, 24.42, G + 0.6, rt - 1.6, 24.52, G + 0.9)),
    h(Ee(rt + 1.6, 24.42, G + 0.6, rt + 2.2, 24.52, G + 0.9)));
  let N = _t(rt, 24.46, -57.5);
  (f(o, xt(0.16, 0.28, 8.5, "y", N.x, N.y + 4.25, N.z, 8), q),
    f(
      o,
      Ee(N.x - 2.4, N.y + 5.2, N.z - 0.08, N.x + 2.4, N.y + 5.36, N.z + 0.08),
      q,
    ),
    f(
      o,
      Ee(N.x - 1.3, N.y + 7.3, N.z - 0.06, N.x + 1.3, N.y + 7.42, N.z + 0.06),
      q,
    ),
    f(o, Ee(N.x - 0.5, N.y + 3.2, N.z, N.x + 0.5, N.y + 3.3, N.z + 1.2), q));
  for (let $ of [-2.3, -1.2, 1.2, 2.3])
    f(
      r,
      Ke(
        [N.x + $, N.y + 5.36, N.z],
        [N.x + $, N.y + 5.36 + (Math.abs($) > 2 ? 3.2 : 1.2), N.z],
        0.012,
        4,
      ),
    );
  f(r, Ke([N.x, N.y + 8.5, N.z], [N.x, N.y + 10.8, N.z], 0.015, 4));
  for (let $ of [-1, 1])
    f(
      r,
      Ke([N.x + $ * 2.3, N.y + 5.3, N.z], [rt + $ * 6, 24.5, T + 2], 0.014, 4),
    );
  (e.add(Bn(N.x, N.y + 8.7, N.z + 0.3, 0.14), [5, 4.6, 3.8], 0),
    e.add(Bn(N.x, N.y + 7.6, N.z, 0.12), [8, 0.4, 0.25], 3.4, 0.6, 0.4));
  let Q = -62.6;
  (f(
    o,
    Ee(rt - 1.7, 24.4, Q - 2.3, rt + 1.7, 29.3, Q + 2.1, 0.25),
    [0.2, 0.34, 0.5],
  ),
    f(
      o,
      Ee(rt - 1.72, 27.2, Q - 2.32, rt + 1.72, 28.1, Q + 2.12, 0.1),
      [0.9, 0.88, 0.8],
    ),
    f(
      o,
      Ee(rt - 1.75, 29.3, Q - 2.35, rt + 1.75, 30.3, Q + 2.15, 0.2),
      [0.07, 0.07, 0.08],
    ));
  for (let $ of [-0.9, 0.5])
    f(r, xt(0.28, 0.28, 1.1, "y", rt, 30.7, Q + $, 10));
  let K = i.mats.decal("logo_b");
  f(
    K.material,
    ll(
      2.6,
      2.6 / Math.max(1, K.aspect || 1),
      rt - 1.705,
      26.1,
      Q - 0.1,
      -Math.PI / 2,
    ),
  );
  {
    let $ = rt - 7.9,
      ue = 17.5,
      me = -61,
      ee = [1.25, 0.42, 0.1],
      B = new CapsuleGeometry(1.15, 3.6, 4, 12);
    (B.rotateX(Math.PI / 2),
      B.scale(0.95, 0.82, 1),
      B.translate($, ue, me),
      f(o, B, ee),
      f(
        o,
        Ee($ - 0.6, ue + 0.7, me - 1.2, $ + 0.6, ue + 1.25, me + 0.9, 0.12),
        ee,
      ));
    for (let P of [-2.1, 2.1])
      (f(
        r,
        jt([rt - 6.9, 15.9, me + P], [$ - 0.2, ue + 2.3, me + P], 0.16, 0.22),
      ),
        f(
          r,
          Ke([$ - 0.2, ue + 2.2, me + P], [$, ue + 0.9, me + P * 0.8], 0.02, 4),
        ));
  }
  (f(
    r,
    Ke([rt, Bo(qn), Eo - qn + 0.4], [rt, Bo(qn) + 3.4, Eo - qn - 0.3], 0.03, 5),
  ),
    e.add(Bn(rt, Bo(qn) + 0.6, Eo - qn - 0.1, 0.1), [4, 3.7, 3], 0));
  {
    let $ = _t(32.55, 13, -51.5),
      ue = _t(31.4, 1.25, -38.5);
    for (let me of [-0.4, 0.4])
      (f(
        a,
        jt(
          [$.x + me, $.y - 0.1, $.z],
          [ue.x + me, ue.y - 0.1, ue.z],
          0.05,
          0.3,
        ),
      ),
        f(
          a,
          Ke([$.x + me, $.y + 1, $.z], [ue.x + me, ue.y + 1, ue.z], 0.025, 5),
        ),
        f(
          a,
          Ke(
            [$.x + me, $.y + 0.5, $.z],
            [ue.x + me, ue.y + 0.5, ue.z],
            0.02,
            4,
          ),
        ));
    for (let me = 0; me <= 8; me++) {
      let ee = $.clone().lerp(ue, me / 8);
      for (let B of [-0.4, 0.4])
        f(
          a,
          Ke([ee.x + B, ee.y - 0.1, ee.z], [ee.x + B, ee.y + 1, ee.z], 0.02, 4),
        );
    }
    for (let me = 1; me < 44; me++) {
      let ee = $.clone().lerp(ue, me / 44);
      f(
        a,
        Ee(
          ee.x - 0.38,
          ee.y - 0.02,
          ee.z - 0.12,
          ee.x + 0.38,
          ee.y,
          ee.z + 0.12,
        ),
      );
    }
    (f(a, Ee(31, 1.15, -38.5, 32, 1.2, -37.3)),
      f(a, jt([31.2, 1.2, -37.9], [29.2, 0.12, -37.9], 0.8, 0.06)),
      ns(
        t,
        a,
        [
          [31, 1.2, -37.32],
          [32, 1.2, -37.32],
          [32, 1.2, -38.5],
        ],
        {
          post: 1.1,
        },
      ),
      f(
        r,
        Ke([$.x, $.y + 3.2, $.z + 4], [ue.x, ue.y + 1.2, ue.z + 0.3], 0.014, 4),
      ),
      f(r, jt([33.2, 13.2, $.z + 4], [32.2, 16.4, $.z + 4], 0.14, 0.14)));
  }
  let ie = ($, ue, me, ee) => {
    let B = fn($, ue, -1);
    ((B.x -= 0.1), f(l, kr(ua(B, me, ee, 12), 0.042, 5)));
    let P = ua(B, me, ee, 12)[3],
      V = ua(B, me, ee, 12)[4].clone().sub(P).normalize(),
      Y = xt(0.42, 0.42, 0.012, "y", 0, 0, 0, 12);
    (Y.applyQuaternion(new Quaternion().setFromUnitVectors(_t(0, 1, 0), V)),
      Y.translate(P.x, P.y, P.z),
      f(a, Y),
      f(
        r,
        Ee(
          B.x - 0.12,
          B.y - 0.28,
          B.z - 0.35,
          B.x + 0.12,
          B.y + 0.28,
          B.z + 0.35,
          0.05,
        ),
      ));
  };
  (ie(4.4, hs(4.4) + 0.55, _t(29.2, 0.5, -12), 1.3),
    ie(4.9, hs(4.9) + 0.55, _t(29.2, 0.36, -12.1), 1.7),
    ie(1.6, hs(1.6) + 0.6, _t(29.2, 0.5, -2), 1.6),
    ie(2.2, hs(2.2) + 0.6, _t(29.2, 0.36, -2.1), 2.2),
    ie(qn - 5, hs(qn - 5) + 0.6, _t(29.2, 0.5, -82), 1.6),
    ie(qn - 9, hs(qn - 9) + 0.6, _t(29.2, 0.45, -58), 1.2));
  for (let $ of [-82, -58])
    (f(r, xt(0.2, 0.26, 0.55, "y", 29.2, 0.27, $, 10)),
      f(r, xt(0.34, 0.3, 0.14, "y", 29.2, 0.6, $, 10)));
  for (let $ of [-17.6, -37, -54])
    (f(c, xt(1.25, 1.25, 2.2, "z", 31.55, Vc + 0.35, $, 14)),
      f(c, xt(0.45, 1.25, 0.5, "z", 31.55, Vc + 0.35, $ + 1.35, 14)),
      f(c, xt(1.25, 0.45, 0.5, "z", 31.55, Vc + 0.35, $ - 1.35, 14)),
      f(l, Ke([31.55, Vc + 1.6, $], [29.9, 0.1, $ + 0.6], 0.03, 4)));
  let F = t.build({
    cast: !0,
    recv: !0,
  });
  F.name = "ship";
  let X = new io();
  (X.add(o, Ee(-1.25, -0.07, -0.1, 1.25, 0.07, 0.1, 0.02), q),
    X.add(o, xt(0.1, 0.12, 0.25, "y", 0, -0.18, 0, 8), q));
  let ne = X.build({
    cast: !1,
  });
  (ne.position.set(N.x, N.y + 3.62, N.z + 0.8),
    (ne.userData.noMerge = !0),
    F.add(ne));
  let re = [
    {
      min: [33, -5, Eo - qn],
      max: [49, 15, -17.5],
    },
    {
      min: [34.9, -5, -17.5],
      max: [47.1, 15.5, -13],
    },
    {
      min: [37.7, -5, -13],
      max: [44.3, 16, -9.3],
    },
    {
      min: [rt - 7.2, 13, T],
      max: [rt + 7.2, 24.4, U],
    },
  ];
  return {
    root: F,
    radar: ne,
    colliders: re,
    tris: t.tris,
    name: "KITTIWAKE",
  };
}

function xb(i, e) {
  let t = new io(),
    n = so(i, "plastic_grey"),
    s = so(i, "paint_orange"),
    o = i.mats.get("polymer_black"),
    r = i.mats.get("steel_galv"),
    a = i.mats.get("glass"),
    l = (U, T, D) => t.add(U, T, D),
    c = [2, 2.02, 2.08],
    u = [0.5, 0.5, 0.52],
    h = [1.9, 1.7, 1.2],
    f = [
      [-3.35, 0.5, 1.03],
      [-1.6, 0.5, 1.06],
      [0.5, 0.52, 1.05],
      [1.8, 0.58, 0.93],
      [2.75, 0.68, 0.6],
      [3.3, 0.78, 0.22],
    ],
    p = [
      ...f.map((U) => _t(U[0], U[1], U[2])),
      _t(3.43, 0.8, 0),
      ...f
        .slice()
        .reverse()
        .map((U) => _t(U[0], U[1], -U[2])),
    ],
    d = new CatmullRomCurve3(p, !1, "centripetal"),
    v = new TubeGeometry(d, 60, 0.27, 12, !1);
  {
    let U = v.attributes.uv,
      T = d.getLength();
    for (let D = 0; D < U.count; D++)
      U.setXY(D, U.getX(D) * T, U.getY(D) * 1.7);
  }
  l(n, v, c);
  for (let U of [-1, 1])
    l(n, xt(0.07, 0.27, 0.42, "x", -3.56, 0.5, U * 1.03, 12), c);
  let g = 11,
    x = [];
  for (let U = 0; U < g; U++) {
    let T = 0.04 + (0.92 * U) / (g - 1),
      D = d.getPointAt(T),
      C = d.getTangentAt(T),
      G = new TorusGeometry(0.276, 0.016, 5, 14);
    (G.applyQuaternion(new Quaternion().setFromUnitVectors(_t(0, 0, 1), C)),
      G.translate(D.x, D.y, D.z),
      l(n, G, u));
    let j = _t(D.x, 0, D.z)
      .sub(_t(Math.min(D.x, 2.2), 0, 0))
      .normalize();
    x.push(
      D.clone()
        .addScaledVector(j, 0.2)
        .add(_t(0, 0.2, 0)),
    );
  }
  for (let U = 0; U < g - 1; U++)
    l(n, kr(ua(x[U], x[U + 1], 0.1, 4), 0.012, 4), h);
  let y = [-3.4, -2, -0.5, 1, 2, 2.8, 3.3],
    b = [0.9, 0.93, 0.93, 0.85, 0.62, 0.34, 0.08],
    m = [0.22, 0.22, 0.24, 0.3, 0.42, 0.56, 0.7],
    A = [-0.3, -0.32, -0.33, -0.3, -0.15, 0.15, 0.62],
    _ = [],
    M = (U, T, D) => {
      let C = T.clone().sub(U).cross(D.clone().sub(U)),
        G = U.clone()
          .add(T)
          .add(D)
          .multiplyScalar(1 / 3),
        j = _t(0, G.y - 0.45, G.z);
      (Math.abs(G.x) > 3.39 && j.set(G.x, 0, 0),
        C.dot(j) < 0
          ? _.push(U.x, U.y, U.z, D.x, D.y, D.z, T.x, T.y, T.z)
          : _.push(U.x, U.y, U.z, T.x, T.y, T.z, D.x, D.y, D.z));
    };
  for (let U of [-1, 1]) {
    for (let T = 0; T < y.length - 1; T++) {
      let D = _t(y[T], A[T], 0),
        C = _t(y[T + 1], A[T + 1], 0),
        G = _t(y[T], m[T], U * b[T]),
        j = _t(y[T + 1], m[T + 1], U * b[T + 1]),
        N = _t(y[T], 0.5 + Math.max(0, m[T] - 0.22) * 0.6, U * (b[T] + 0.1)),
        Q = _t(
          y[T + 1],
          0.5 + Math.max(0, m[T + 1] - 0.22) * 0.6,
          U * (b[T + 1] + 0.1),
        );
      (M(D, C, j), M(D, j, G), M(G, j, Q), M(G, Q, N));
    }
    (M(
      _t(-3.4, A[0], 0),
      _t(-3.4, m[0], U * b[0]),
      _t(-3.4, 0.78, U * (b[0] + 0.1)),
    ),
      M(
        _t(-3.4, A[0], 0),
        _t(-3.4, 0.78, U * (b[0] + 0.1)),
        _t(-3.4, 0.78, 0),
      ));
  }
  let E = new BufferGeometry();
  (E.setAttribute("position", new Float32BufferAttribute(_, 3)),
    E.computeVertexNormals(),
    l(o, E),
    l(n, Ee(-3.38, 0.2, -0.86, 2.1, 0.26, 0.86), u),
    l(n, Ee(2, 0.26, -0.62, 2.85, 0.56, 0.62, 0.05), u),
    l(o, Ee(-3.46, 0.1, -0.92, -3.34, 0.8, 0.92, 0.02)),
    l(r, Ke([3.2, 0.95, -0.12], [3.2, 0.95, 0.12], 0.02, 5)),
    l(r, Ke([3.2, 0.8, 0], [3.2, 0.95, 0], 0.018, 5)),
    l(s, Ee(0.3, 0.26, -0.4, 1, 1.12, 0.4, 0.05), [1, 0.9, 0.85]),
    l(o, jt([0.28, 1.14, 0], [0.86, 1.3, 0], 0.76, 0.05)));
  let w = Ee(-0.012, 0, -0.42, 0.012, 0.5, 0.42);
  (w.rotateZ(0.42), w.translate(0.95, 1.2, 0), l(a, w));
  for (let U of [-0.43, 0.43])
    l(
      r,
      Ke(
        [0.95, 1.2, U],
        [0.95 - Math.sin(0.42) * 0.52, 1.2 + Math.cos(0.42) * 0.52, U],
        0.016,
        5,
      ),
    );
  l(
    r,
    Ke(
      [0.95 - Math.sin(0.42) * 0.52, 1.2 + Math.cos(0.42) * 0.52, -0.43],
      [0.95 - Math.sin(0.42) * 0.52, 1.2 + Math.cos(0.42) * 0.52, 0.43],
      0.016,
      5,
    ),
  );
  let S = new TorusGeometry(0.18, 0.017, 6, 18);
  (S.rotateY(Math.PI / 2),
    S.rotateZ(-0.5),
    S.translate(0.2, 1.12, -0.12),
    l(o, S),
    l(r, Ke([0.2, 1.12, -0.12], [0.36, 1.03, -0.12], 0.02, 5)));
  for (let U of [0, 2.1, 4.2])
    l(
      r,
      Ke(
        [0.2, 1.12, -0.12],
        [
          0.2 + Math.sin(-0.5) * Math.cos(U) * -0.17,
          1.12 + Math.cos(-0.5) * Math.cos(U) * 0.17,
          -0.12 + Math.sin(U) * 0.17,
        ],
        0.01,
        4,
      ),
    );
  (l(o, Ee(0.34, 1.16, 0.16, 0.5, 1.34, 0.3, 0.02)),
    l(r, Ke([0.42, 1.34, 0.23], [0.36, 1.48, 0.23], 0.012, 4)),
    l(r, Ke([0.35, 0.3, -0.46], [0.35, 1, -0.46], 0.02, 5)),
    l(r, Ke([0.35, 1, -0.46], [0.95, 1, -0.46], 0.02, 5)),
    l(r, Ke([0.35, 0.3, 0.46], [0.35, 1, 0.46], 0.02, 5)),
    l(r, Ke([0.35, 1, 0.46], [0.95, 1, 0.46], 0.02, 5)));
  for (let U of [-0.75, -1.75])
    (l(s, Ee(U - 0.28, 0.26, -0.2, U + 0.28, 0.82, 0.2, 0.05), [1, 0.9, 0.85]),
      l(o, Ee(U - 0.3, 0.82, -0.22, U + 0.3, 0.93, 0.22, 0.04)),
      l(o, Ee(U - 0.34, 0.93, -0.2, U - 0.26, 1.2, 0.2, 0.03)),
      l(r, Ke([U + 0.3, 0.6, -0.22], [U + 0.3, 1.02, 0], 0.014, 4)),
      l(r, Ke([U + 0.3, 0.6, 0.22], [U + 0.3, 1.02, 0], 0.014, 4)));
  l(s, Ee(-2.9, 0.26, -0.3, -2.45, 0.58, 0.3, 0.04), [1.1, 0.5, 0.4]);
  for (let U of [-1, 1])
    (l(r, Ke([-2.95, 0.55, U * 0.9], [-2.75, 2, U * 0.55], 0.03, 6)),
      l(r, Ke([-2.3, 0.55, U * 0.9], [-2.75, 1.3, U * 0.7], 0.022, 5)));
  (l(r, Ke([-2.75, 2, -0.55], [-2.75, 2, 0.55], 0.03, 6)),
    l(r, Ee(-2.88, 2, -0.2, -2.62, 2.04, 0.2)),
    l(o, xt(0.05, 0.06, 0.1, "y", -2.75, 2.09, 0, 8)),
    l(o, Ke([-2.75, 2, 0.42], [-2.9, 3.7, 0.46], 0.011, 5)),
    l(o, xt(0.16, 0.16, 0.07, "y", -2.75, 2.1, -0.36, 10)));
  for (let U of [-0.36, 0.36])
    (l(r, Ee(-3.6, 0.42, U - 0.16, -3.44, 0.78, U + 0.16, 0.02)),
      l(o, Ee(-4.1, 0.78, U - 0.23, -3.48, 1.4, U + 0.23, 0.09)),
      l(n, Ee(-4.11, 1, U - 0.235, -3.47, 1.05, U + 0.235), [1.4, 1.4, 1.4]),
      l(o, Ee(-3.92, -0.05, U - 0.085, -3.62, 0.8, U + 0.085, 0.03)),
      l(o, Ee(-4.02, -0.52, U - 0.04, -3.6, -0.05, U + 0.04, 0.015)),
      l(o, xt(0.07, 0.03, 0.42, "x", -3.9, -0.3, U, 8)));
  for (let U of [-1.8, 0.4, 1.7])
    (l(s, xt(0.11, 0.11, 0.42, "y", U, 0.42, 1.36, 10), [1.2, 0.8, 0.7]),
      l(n, Ke([U, 0.63, 1.36], [U, 0.78, 1.12], 0.01, 4), h));
  let z = new TorusGeometry(0.26, 0.07, 6, 16);
  (z.rotateY(Math.PI / 2),
    z.translate(1.02, 0.72, 0),
    l(s, z, [1.3, 0.6, 0.45]));
  let H = t.build({
    cast: !0,
    recv: !0,
  });
  (e.add(Bn(-2.75, 2.2, 0, 0.075), [1.2, 11, 3.2], 1.5, 0, 0.1),
    e.add(Bn(-2.75, 2.2, 0, 0.074), [1.2, 11, 3.2], 1.5, 0.2, 0.08));
  let O = e.build();
  O && ((O.frustumCulled = !1), H.add(O));
  let q = new Group();
  return (
    (q.name = "boat"),
    q.add(H),
    (q.userData.noMerge = !0),
    {
      root: q,
      hullGrp: H,
      tris: t.tris,
    }
  );
}

export { vb, xb };
