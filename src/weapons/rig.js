import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from "../vendor/three-r180.js";
import { SKY_COLORS, SUN_LIGHT } from "../core/config.js";
import { mergeGeometryParts } from "../core/geometry.js";

var ti = Vector3;

var vl = Quaternion;

var rm = Matrix4;

var Bv = [31, 21.5, 12.5];

var Fv = [5.6, 5.3, 5];

var Lv = [3.2, 3.1, 3];

var am = [12.5, 10, 7.6];

var lm = [16, 11, 6.6];

var dC = [3, 2.6, 2.2];

var kf = [36, 27, 16];

var gl = [20, 14, 8.4];

var Df = [4.8, 4.5, 4.2];

var pC = [30, 9.5, 2.2];

var E_ = [5, 6.9, 9];

var mC = [30, 9.5, 2.2];

var gC = [26, 26, 25];

var um = (i) => (i < 0 ? 0 : i > 1 ? 1 : i);

var xl = (i, e, t) => ((t = um((t - i) / (e - i))), t * t * (3 - 2 * t));

var Ff = (i, e) => Math.sign(i) * Math.pow(Math.abs(i), e);

var vC = (i) => {
  let e = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return e - Math.floor(e);
};

var Xo = new ti();

var S_ = new ti(0, 0, -1);

var yl = class {
  constructor(e) {
    ((this.N = e), (this.P = []), (this.C = []), (this.weld = []));
  }
  v(e, t, n = 1) {
    (this.P.push(e.x, e.y, e.z), this.C.push(t[0] * n, t[1] * n, t[2] * n));
  }
  rings() {
    return this.P.length / 3 / this.N;
  }
  collapse() {
    this.weld.push(this.rings() - 1);
  }
  geo(e = !1) {
    let t = this.N,
      n = this.rings(),
      s = [];
    for (let a = 0; a < n - 1; a++)
      for (let l = 0; l < t; l++) {
        let c = a * t + l,
          u = a * t + ((l + 1) % t),
          h = c + t,
          f = u + t;
        e ? s.push(c, u, h, u, f, h) : s.push(c, h, u, u, h, f);
      }
    let o = new BufferGeometry();
    (o.setAttribute("position", new Float32BufferAttribute(this.P, 3)),
      o.setAttribute("color", new Float32BufferAttribute(this.C, 3)),
      o.setAttribute(
        "uv",
        new Float32BufferAttribute(
          new Float32Array((this.P.length / 3) * 2),
          2,
        ),
      ),
      o.setIndex(s),
      o.computeVertexNormals());
    let r = o.attributes.normal;
    for (let a of this.weld) {
      let l = 0,
        c = 0,
        u = 0;
      for (let f = 0; f < t; f++)
        ((l += r.getX(a * t + f)),
          (c += r.getY(a * t + f)),
          (u += r.getZ(a * t + f)));
      let h = Math.hypot(l, c, u) || 1;
      for (let f = 0; f < t; f++) r.setXYZ(a * t + f, l / h, c / h, u / h);
    }
    return o;
  }
};

function I_(i, e, t) {
  let n = [],
    s = [],
    o = [],
    r = i.length,
    a = e.length;
  for (let c = 0; c < a; c++)
    for (let u = 0; u < r; u++) {
      let h = t(i[u], e[c], Xo);
      (n.push(Xo.x, Xo.y, Xo.z), s.push(h[0], h[1], h[2]));
    }
  for (let c = 0; c < a - 1; c++)
    for (let u = 0; u < r - 1; u++) {
      let h = c * r + u,
        f = h + 1,
        p = h + r,
        d = p + 1;
      o.push(h, f, p, f, d, p);
    }
  let l = new BufferGeometry();
  return (
    l.setAttribute("position", new Float32BufferAttribute(n, 3)),
    l.setAttribute("color", new Float32BufferAttribute(s, 3)),
    l.setAttribute(
      "uv",
      new Float32BufferAttribute(new Float32Array((n.length / 3) * 2), 2),
    ),
    l.setIndex(o),
    l.computeVertexNormals(),
    l
  );
}

var Uv = [-1, -0.9, -0.5, 0, 0.5, 0.9, 1];

var cm = (i) => (Math.abs(i) > 0.95 ? -1 : Math.abs(i) > 0.8 ? 0.82 : 1);

function Lf(i, e, t, n, s, o, r, a = null, l = !1, c = Uv, u = Uv) {
  return I_(c, u, (h, f, p) => {
    let d = i + h * t,
      v = e + (l ? f : -f) * n,
      g = Math.min(cm(h), cm(f)),
      x = r(d, v) + (g < 0 ? -0.0022 : s * g);
    (p.set(d, l ? -x : x, v), a && a(p));
    let y = typeof o == "function" ? o(h, f) : o,
      b = g < 0 ? 0.5 : g < 1 ? 0.8 : 1;
    return [y[0] * b, y[1] * b, y[2] * b];
  });
}

var om = [
  {
    base: [-0.031, 0, -0.094],
    len: [0.044, 0.026, 0.022],
    rad: [0.0096, 0.009, 0.0083, 0.0076],
  },
  {
    base: [-0.0105, 0.001, -0.099],
    len: [0.049, 0.03, 0.023],
    rad: [0.0097, 0.0091, 0.0084, 0.0077],
  },
  {
    base: [0.0105, 0, -0.095],
    len: [0.045, 0.028, 0.022],
    rad: [0.0094, 0.0088, 0.0081, 0.0074],
  },
  {
    base: [0.03, -0.002, -0.086],
    len: [0.035, 0.021, 0.02],
    rad: [0.0084, 0.0078, 0.0072, 0.0066],
  },
];

var Nv = [
  12, 34, 44, 68, 90, 112, 136, 146, 168, 192, 220, 245, 270, 295, 320, 348,
].map((i) => (i * Math.PI) / 180);

var T_ = Nv.length;

var A_ = 0.0012;

var R_ = [0.14, 0.22, 0.27, 0.73, 0.78, 0.88];

var xC = [0.1, 0.17, 0.1];

function z_(i) {
  let e = new yl(T_),
    { base: t, qs: n, len: s, rad: o } = i,
    r = i.pads || [1, 1, 0],
    a = i.patchJ ?? 1,
    l = i.bump || xC,
    c = i.tipW || 1,
    u = i.tipH || 1,
    h = [],
    f = [],
    p = t.clone();
  for (let M = 0; M < 3; M++)
    (h.push(p.clone()),
      f.push(S_.clone().applyQuaternion(n[M + 1])),
      p.addScaledVector(f[M], s[M]));
  let d = S_.clone().applyQuaternion(n[0]),
    v = (M) => (M ? f[M - 1] : d),
    g = [0, 1, 2].map((M) => new ti().addVectors(v(M), f[M]).normalize()),
    x = (M, E) =>
      (M.x - h[E].x) * g[E].x +
      (M.y - h[E].y) * g[E].y +
      (M.z - h[E].z) * g[E].z,
    y = (M, E) => {
      let w = x(M, E);
      w > 0 && M.addScaledVector(v(E), -w / v(E).dot(g[E]));
    },
    b = (M, E) => {
      let w = x(M, E);
      w < 0 && M.addScaledVector(f[E], -w / f[E].dot(g[E]));
    },
    m = new ti(),
    A = new vl(),
    _ = (M, E, w, S) => {
      let z = S.kD || 1,
        H = S.kP || 1,
        O = S.ao || 1;
      for (let q = 0; q < T_; q++) {
        let U = Math.cos(Nv[q]),
          T = Math.sin(Nv[q]),
          D = q >= 1 && q <= 7,
          C = q >= 2 && q <= 6,
          G = w * U,
          j =
            T > 0
              ? w * 0.96 * T * (C ? z : 1 + (z - 1) * 0.4)
              : w * 0.98 * T * H;
        (S.pad && C && ((G += U * A_), (j += T * A_)),
          (G *= S.wx || 1),
          (j *= S.wy || 1),
          m.set(G, j, 0).applyQuaternion(M).add(E),
          S.a >= 0 && y(m, S.a),
          S.b >= 0 && b(m, S.b));
        let N = D ? Bv : q >= 10 && q <= 14 ? am : lm,
          Q = O;
        (S.pad && C ? (N = Fv) : S.patch && C && ((N = lm), (Q *= 0.9)),
          ((S.pad && D && !C) || (S.edge && D)) && (N = dC),
          S.saddle && q >= 8 && ((N = am), (Q *= 0.9)),
          S.stitch && D && ((N = kf), (Q *= 0.8)),
          (q === 0 || q === 8 || q === 9 || q === 15) && (Q *= 0.72),
          q >= 9 && (Q *= S.aoP || 1),
          e.v(m, N, Q));
      }
    };
  (_(
    n[0],
    Xo.copy(h[0]).addScaledVector(d, -(i.rootBack || 0.012) - 0.002),
    1e-5,
    {
      a: 0,
      b: -1,
      ao: i.rootAo || 0.5,
    },
  ),
    e.collapse(),
    _(
      n[0],
      Xo.copy(h[0]).addScaledVector(d, -(i.rootBack || 0.012)),
      o[0] * (i.rootK || 1),
      {
        a: 0,
        b: -1,
        ao: i.rootAo || 0.5,
        saddle: i.saddle,
      },
    ));
  for (let M = 0; M < 3; M++) {
    for (let E = 0; E < 4; E++) {
      let w = E / 3;
      (A.slerpQuaternions(n[M], n[M + 1], w),
        _(
          A,
          Xo.copy(h[M]).addScaledVector(E < 2 ? v(M) : f[M], (E - 1.5) * 4e-4),
          o[M],
          {
            a: w < 0.5 ? M : -1,
            b: w < 0.5 ? -1 : M,
            kD: 1 + l[M] * (E === 0 || E === 3 ? 0.55 : 1),
            patch: M === a,
            saddle: i.saddle && M < 2,
            wx: M === 2 ? 1 + (c - 1) * 0.5 : 1,
            wy: M === 2 ? 1 + (u - 1) * 0.5 : 1,
            ao: M === 0 && !i.rootAo ? 0.62 + 0.1 * E : 1,
            aoP: E === 1 || E === 2 ? 0.55 : 0.8,
          },
        ));
    }
    if (M < 2)
      for (let E = 0; E < R_.length; E++) {
        let w = R_[E],
          S =
            (o[M] + (o[M + 1] - o[M]) * w) * (1 - 0.06 * Math.sin(Math.PI * w));
        _(n[M + 1], Xo.copy(h[M]).addScaledVector(f[M], s[M] * w), S, {
          a: M + 1,
          b: M,
          pad: r[M] && (E === 2 || E === 3),
          edge: r[M] && (E === 1 || E === 4),
          saddle: i.saddle && M === 0,
          ao: M === 0 && !i.rootAo ? 0.86 + 0.14 * xl(0, 0.5, w) : 1,
        });
      }
    else {
      let E = o[3],
        w = s[2] - E;
      (_(n[3], Xo.copy(h[2]).addScaledVector(f[2], s[2] * 0.2), o[2] * 0.97, {
        a: -1,
        b: 2,
        stitch: 1,
        wx: c,
        wy: u,
      }),
        _(
          n[3],
          Xo.copy(h[2]).addScaledVector(f[2], s[2] * 0.42),
          (o[2] + E) * 0.5,
          {
            a: -1,
            b: 2,
            kP: 1.08,
            wx: c,
            wy: u,
          },
        ));
      for (let S of [0, 0.6, 1.05, 1.36])
        _(
          n[3],
          Xo.copy(h[2]).addScaledVector(f[2], w + E * 1.08 * Math.sin(S)),
          E * Math.cos(S),
          {
            a: -1,
            b: -1,
            kP: 1.06,
            wx: c,
            wy: u,
          },
        );
      (_(n[3], Xo.copy(h[2]).addScaledVector(f[2], w + E * 1.08), 1e-5, {
        a: -1,
        b: -1,
      }),
        e.collapse());
    }
  }
  return e.geo();
}

var yC = (i) => new vl().setFromAxisAngle(new ti(0, 1, 0), i);

var bC = (i) => new vl().setFromAxisAngle(new ti(1, 0, 0), i);

function C_(i, e) {
  let t = [yC(e[3] || 0)];
  for (let n = 0; n < 3; n++) t.push(t[n].clone().multiply(bC(-e[n])));
  return z_({
    base: new ti(i.base[0], i.base[1], i.base[2]),
    qs: t,
    len: i.len,
    rad: i.rad,
  });
}

function _C(i, e) {
  let t = i.clone().negate(),
    n = new ti().crossVectors(e, t);
  (n.lengthSq() < 1e-6 && n.set(1, 0, 0), n.normalize());
  let s = new ti().crossVectors(t, n);
  return new vl().setFromRotationMatrix(new rm().makeBasis(n, s, t));
}

function MC(i) {
  let e = i.map((o) => new ti(o[0], o[1], o[2]).normalize()),
    t = new ti(-0.72, 0.69, 0),
    n = [],
    s = e[2].clone().sub(e[0]);
  s.length() > 0.12 &&
    t.multiplyScalar(0.25).addScaledVector(s.normalize(), -1);
  for (let o = 0; o < 3; o++) n.push(_C(e[o], t));
  return (
    n.unshift(n[0].clone()),
    z_({
      base: new ti(-0.028, -0.007, -0.014),
      qs: n,
      len: [0.044, 0.031, 0.026],
      rad: [0.0165, 0.0118, 0.011, 0.01],
      pads: [0, 1, 0],
      patchJ: 2,
      bump: [0, 0.2, 0.2],
      tipW: 1.12,
      tipH: 0.86,
      saddle: 1,
      rootBack: 0.01,
      rootK: 0.72,
      rootAo: 0.9,
    })
  );
}

var Qc = 0.006;

var D_ = (i) => -0.0975 + 0.0125 * Math.pow((i + 0.008) / 0.04, 2);

var Ov = (i) => D_(i) + 0.006;

var Hv = (i) => 0.029 + 0.014 * xl(0.05, 0.85, i);

var L_ = (i) => 0.0185 - 0.0065 * xl(0.1, 1, i);

var k_ = (i) =>
  0.0185 + 0.003 * Math.sin(Math.PI * um(i * 1.6)) - 0.0055 * xl(0.3, 1, i);

function kv(i, e) {
  let t = um((Qc - e) / (Qc - Ov(i))),
    n = Math.min(0.999, Math.abs(i / Hv(t)));
  return L_(t) * Math.pow(1 - Math.pow(n, 2.5), 0.4);
}

function wC(i, e) {
  let t = um((Qc - e) / (Qc - Ov(i))),
    n = Hv(t),
    s = Math.min(0.999, Math.abs(i / n));
  return (
    k_(t) *
    Math.pow(1 - Math.pow(s, 2.5), 0.4) *
    (1 + 0.14 * Math.max(0, i / n) * Math.sin(Math.PI * t))
  );
}

function EC() {
  let e = new yl(24),
    t = new ti(),
    n = [
      [0, 0, 1, 1],
      [0.1, 0, 1, 1],
      [0.22, 0, 1, 1],
      [0.36, 0, 1, 1],
      [0.5, 0, 1, 1],
      [0.64, 0, 1, 1],
      [0.77, 0, 1, 1],
      [0.89, 0, 1, 1],
      [1, 0, 1, 1],
      [1, -0.005, 0.8, 1],
      [1, -0.009, 0.45, 0.985],
      [1, -0.0105, 0.04, 0.97],
    ];
  for (let [s, o, r, a] of n) {
    let l = Hv(s) * a,
      c = L_(s) * r,
      u = k_(s) * r;
    for (let h = 0; h < 24; h++) {
      let f = ((h + 0.5) / 24) * Math.PI * 2,
        p = Math.cos(f),
        d = Math.sin(f),
        v = l * Ff(p, 0.8),
        g =
          d >= 0
            ? c * Ff(d, 0.8)
            : u *
              Ff(d, 0.8) *
              (1 + 0.14 * Math.max(0, v / l) * Math.sin(Math.PI * s));
      t.set(v, g, Qc + (Ov(v) - Qc) * s + o);
      let x = d > 0.3 ? Bv : d < -0.3 ? am : lm,
        y = 1;
      (s === 0.1 && d > 0.3 && ((x = kf), (y = 0.75)),
        o < 0 && ((x = lm), (y = 0.7 + o * 30)),
        d < -0.3 && (y *= 0.82 + 0.18 * Math.abs(p)),
        e.v(t, x, y));
    }
  }
  return e.geo();
}

function SC(i) {
  let t = new yl(12),
    n = new ti(),
    s = new ti(),
    o = new ti(),
    r = new ti(),
    a = new ti(),
    l = new ti(i.x, i.y, i.z - 1).normalize(),
    c = [-0.12, 0, 0.2, 0.4, 0.6, 0.78, 0.9];
  for (let d = 0; d < c.length; d++) {
    let v = c[d],
      g = d === 0 || d === c.length - 1;
    (s.set(-0.028, -0.007, -0.014).addScaledVector(i, 0.044 * v),
      o.set(-0.03, -0.003, -0.022 - 0.06 * v),
      r.subVectors(s, o));
    let x = r.length() * 0.5 + 0.005;
    (r.normalize(), a.crossVectors(r, l).normalize());
    let y = g ? 1e-5 : 0.0085 * (1 - 0.55 * v),
      b = g ? 1e-5 : x * (1 - 0.3 * v * v);
    for (let m = 0; m < 12; m++) {
      let A = ((m + 0.5) / 12) * Math.PI * 2,
        _ = Math.cos(A),
        M = Math.sin(A);
      n.copy(s)
        .add(o)
        .multiplyScalar(0.5)
        .addScaledVector(r, _ * b)
        .addScaledVector(a, M * y);
      let E = a.y * M < 0;
      t.v(n, E ? am : Bv, E ? 0.85 : 0.92);
    }
    g && t.collapse();
  }
  let u = t.geo(),
    h = u.attributes.position,
    f = u.index.array,
    p = 0;
  for (let d = 0; d < f.length; d += 3)
    (s.fromBufferAttribute(h, f[d]),
      o.fromBufferAttribute(h, f[d + 1]),
      n.fromBufferAttribute(h, f[d + 2]),
      (p += s.dot(o.cross(n))));
  if (p < 0) {
    for (let d = 0; d < f.length; d += 3) {
      let v = f[d + 1];
      ((f[d + 1] = f[d + 2]), (f[d + 2] = v));
    }
    u.computeVertexNormals();
  }
  return u;
}

function P_(i) {
  if ((i.scale(-1, 1, 1), !i.index)) {
    let t = i.attributes.position.count,
      n = new Uint32Array(t);
    for (let s = 0; s < t; s++) n[s] = s;
    i.setIndex(new BufferAttribute(n, 1));
  }
  let e = i.index.array;
  for (let t = 0; t < e.length; t += 3) {
    let n = e[t + 1];
    ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
  }
  return i;
}

function Vv(i) {
  let e = [],
    t = i.debugParts || null,
    n = (d, v) => (e.push(v), t && t.push([d, v]), v);
  n("palm", EC());
  {
    let d = [];
    for (let v = 0; v <= 30; v++) d.push(-1 + v / 15);
    n(
      "guard",
      I_(d, [-1, -0.9, -0.5, 0, 0.5, 0.9, 1], (v, g, x) => {
        let y = -5e-4 + v * 0.0405,
          b = D_(y) + 0.0045 - g * 0.011,
          m = Math.min(cm(v), cm(g)),
          A = 0;
        for (let M = 0; M < 4; M++) {
          let E = (y - om[M].base[0]) / 0.0058;
          A += (M === 3 ? 0.8 : 1) * Math.exp(-E * E);
        }
        ((A = Math.min(1, A) * (1 - 0.55 * g * g)),
          x.set(
            y,
            kv(y, b) +
              (m < 0 ? (g > 0.95 ? -0.008 : -0.003) : (0.0016 + 0.006 * A) * m),
            b,
          ));
        let _ = m < 0 ? 0.6 : 0.85 + 1.3 * A;
        return [Lv[0] * _, Lv[1] * _, Lv[2] * _];
      }),
    );
  }
  for (let d = 0; d < 3; d++)
    n(
      "bar",
      Lf(0.001, -0.034 - d * 0.015, 0.023 + d * 0.0025, 0.0052, 0.0019, Fv, kv),
    );
  (n(
    "seam",
    Lf(
      0,
      -0.0225,
      0.027,
      0.0013,
      9e-4,
      kf.map((d) => d * 0.8),
      kv,
      null,
      !1,
      Uv,
      [-1, 0, 1].map((d) => d * 0.9),
    ),
  ),
    n("heelPad", Lf(0.013, -0.03, 0.0135, 0.017, 0.0017, Fv, wC, null, !0)));
  let s = [];
  for (let d = 0; d < 4; d++) {
    if (d === 0 && i.indexPoses) {
      for (let v of i.indexPoses) s.push(C_(om[0], v));
      continue;
    }
    n("finger" + d, C_(om[d], i.fingers[d]));
  }
  (n("thumb", MC(i.thumb)),
    n(
      "web",
      SC(new ti(i.thumb[0][0], i.thumb[0][1], i.thumb[0][2]).normalize()),
    ));
  let o = new ti(i.forearm[0], i.forearm[1], i.forearm[2]).normalize(),
    r = i.sleeve || 0.36,
    a = 0.022,
    l = new vl().setFromUnitVectors(new ti(0, 0, 1), o),
    c = new vl(),
    u = new vl(),
    h = (d) => (
      u.slerpQuaternions(c, l, xl(0.002, 0.042, d.z)),
      (d.z -= a),
      d.applyQuaternion(u),
      (d.z += a),
      d
    );
  {
    let v = new yl(24),
      g = new ti(),
      x = [
        [-0.0085, -0.0015, Df, 0.6],
        [-0.009, 0.0022, Df, 1.3],
        [-0.006, 0.0026, Df, 1.3],
        [-0.0052, 0.002, gl, 0.75],
        [0.004, 0.0014, gl, 1],
        [0.011, 0.0016, gl, 0.7],
        [0.0122, 0.003, Df, 1.2],
        [0.0305, 0.0032, Df, 1.2],
        [0.0317, 0.0018, gl, 0.7],
        [0.04, 0.002, gl, 1],
        [0.054, 0.0024, gl, 1],
        [0.058, 0.0026, kf, 0.7],
        [0.058, -0.004, gl, 0.4],
      ];
    for (let [y, b, m, A] of x)
      for (let _ = 0; _ < 24; _++) {
        let M = ((_ + 0.5) / 24) * Math.PI * 2,
          E = Math.sin(M);
        v.v(
          h(
            g.set(
              (0.0296 + b) * Ff(Math.cos(M), 0.8),
              (E >= 0 ? 0.0185 + b : 0.0204 + b) * Ff(E, 0.8),
              y,
            ),
          ),
          m,
          A,
        );
      }
    n("cuff", v.geo(!0));
  }
  (n(
    "strapTab",
    Lf(
      0.009,
      0.0215,
      0.0135,
      0.0076,
      0.0017,
      (d) => (d > 0.55 ? kf.map((v) => v * 0.75) : [9, 9, 9.6]),
      (d) =>
        0.0217 *
        Math.pow(1 - Math.pow(Math.min(0.999, Math.abs(d / 0.0328)), 2.5), 0.4),
      h,
    ),
  ),
    n(
      "pullTab",
      Lf(0.003, 0.004, 0.0065, 0.0115, 0.0022, pC, () => 0.022, h, !0),
    ));
  {
    let d = [];
    for (let z = 0; z < 24; z++)
      (d.push(z * 15),
        (z === 4 || z === 16) && d.push(z * 15 + 11.5),
        (z === 5 || z === 17) && d.push(z * 15 + 3.5));
    d.sort((z, H) => z - H);
    let v = d.length,
      g = d.indexOf(75),
      x = d.indexOf(255),
      y = new yl(v),
      b = new ti(),
      m = 0.04 + r,
      A = [
        [0.0415, 0],
        [0.04, 1],
        [0.044, 2],
        [0.049, 3],
        [0.055, 3],
        [0.061, 3],
        [0.0655, 4],
        [0.0685, 5],
      ],
      _ = [0.1415, 0.143, 0.157, 0.1582, 0.1662, 0.1674, 0.181, 0.1825],
      M = _.slice(),
      E = Math.ceil((m - 0.074) / 0.0052);
    for (let z = 0; z <= E; z++) {
      let H = 0.074 + ((m - 0.074) * z) / E;
      _.some((O) => Math.abs(O - H) < 0.0016) || M.push(H);
    }
    M.sort((z, H) => z - H);
    for (let z of M) A.push([z, 6]);
    let w = 0;
    for (let [z, H] of A)
      for (let O = 0; O < v; O++) {
        let q = (d[O] * Math.PI) / 180,
          U,
          T = 1,
          D = E_;
        if (H === 0) ((U = 0.0292), (T = 0.4));
        else if (H === 1) ((U = 0.0372), (T = 1.15));
        else if (H === 2) ((U = 0.0377), (T = 1.1));
        else if (H === 3) {
          let C = Math.cos(q * 12);
          ((U = 0.0368 + 0.0012 * C), (T = 0.62 + 0.26 * C));
        } else if (H === 4) ((U = 0.0356), (T = 0.55));
        else if (H === 5) ((U = 0.038), (T = 0.9));
        else {
          let C = (z - 0.0685) / (m - 0.0685),
            G = 0.0048 * Math.exp(-Math.pow((C - 0.13) / 0.11, 2)),
            j = 0.0048 * xl(0.62, 0.85, C),
            N =
              Math.pow(
                Math.abs(
                  Math.sin(
                    (Math.PI * z) / 0.027 +
                      1.7 * Math.sin(q + 0.5) +
                      0.8 * Math.sin(2 * q + 1.3),
                  ),
                ),
                0.6,
              ) *
                2 -
              1.25,
            Q =
              Math.pow(
                Math.abs(
                  Math.sin(
                    (Math.PI * z) / 0.034 +
                      1.9 * Math.sin(q - 0.8) +
                      0.7 * Math.sin(2 * q),
                  ),
                ),
                0.6,
              ) *
                2 -
              1.25,
            K =
              Math.sin(z * 40 + 2 * Math.sin(q * 2 + 1)) +
              0.6 * Math.sin(3 * q + z * 25);
          ((U =
            0.0405 +
            0.012 * Math.pow(C, 0.85) +
            0.0025 * Math.exp(-Math.pow((z - 0.082) / 0.012, 2)) +
            G * N +
            j * Q +
            0.0016 * K),
            (T =
              0.78 +
              0.26 * xl(-1.1, 0.5, (G * N + j * Q) / (G + j + 8e-4)) +
              0.04 * K));
          let ie = vC(w);
          z > 0.1575 && z < 0.167
            ? ((D = gC), (T *= 0.85 + 0.25 * ie))
            : z > 0.1425 && z < 0.1815 && ((D = mC), (T *= 0.78 + 0.3 * ie));
        }
        (H > 0 &&
          (O === g || O === x
            ? ((U += 0.0019), (T *= 1.3))
            : (Math.abs(O - g) === 1 || Math.abs(O - x) === 1) && (T *= 0.52)),
          b.set(Math.cos(q) * U, Math.sin(q) * U * 0.84, z),
          y.v(b, D, T),
          w++);
      }
    for (let z = 0; z < v; z++) y.v(b.set(0, 0, m + 0.006), E_, 0.3);
    y.collapse();
    let S = y.geo(!0);
    (S.applyMatrix4(
      new rm()
        .makeTranslation(0, 0, a)
        .multiply(new rm().makeRotationFromQuaternion(l))
        .multiply(new rm().makeTranslation(0, 0, -a)),
    ),
      n("sleeve", S));
  }
  let p = {
    fabric: mergeGeometryParts(e),
    rubber: null,
    index: s.length ? s : null,
    knuckle: om[0].base.slice(),
  };
  return (
    i.mirror &&
      (P_(p.fabric), p.index && p.index.forEach(P_), (p.knuckle[0] *= -1)),
    p
  );
}

var hm = {
  model: [8, 8, 330, 84],
  maker: [8, 100, 560, 40],
  cal: [8, 146, 560, 40],
  prop: [8, 192, 700, 40],
  safe: [8, 240, 90, 34],
  semi: [110, 240, 90, 34],
  auto: [212, 240, 90, 34],
  rack: [8, 290, 300, 110],
  warn: [330, 290, 420, 110],
  optic: [580, 8, 300, 60],
  light: [580, 76, 300, 60],
  dots: [320, 240, 60, 34],
  r2: [8, 420, 56, 40],
  r4: [72, 420, 56, 40],
  r6: [136, 420, 56, 40],
  r8: [200, 420, 56, 40],
  r10: [264, 420, 56, 40],
  r12: [328, 420, 56, 40],
};

var Uf = 1024;

var Nf = 512;

function TC() {
  let i = document.createElement("canvas");
  ((i.width = Uf), (i.height = Nf));
  let e = i.getContext("2d");
  (e.clearRect(0, 0, Uf, Nf), (e.textBaseline = "middle"));
  let t = (u, h, f, p, d = "left") => {
      let [v, g, x, y] = hm[u];
      ((e.font = f),
        (e.fillStyle = p),
        (e.textAlign = d),
        e.fillText(h, d === "left" ? v + 2 : v + x / 2, g + y / 2 + 1, x - 4));
    },
    n = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
    s = '"IBM Plex Mono", "Courier New", monospace',
    o = '"Big Shoulders Display", "Barlow Condensed", Impact, sans-serif',
    r = "rgba(196,198,194,0.92)";
  (t("model", "PAC-9", `700 78px ${o}`, r),
    t("maker", "LONGSHORE ARMS WORKS  \xB7  SALTLINE", `600 30px ${n}`, r),
    t("cal", "CAL 5.8\xD740   SN PA-004217", `500 27px ${s}`, r),
    t(
      "prop",
      "PROPERTY OF PORT AUTHORITY \u2014 BERTH 4 ARMOURY",
      `600 28px ${n}`,
      r,
    ),
    t("safe", "S", `700 30px ${n}`, r, "center"),
    t("semi", "1", `700 30px ${n}`, r, "center"),
    t("auto", "A", `700 30px ${n}`, "rgba(205,60,40,0.95)", "center"),
    t("rack", "B4-07", `800 104px ${o}`, "rgba(214,206,170,0.9)", "center"));
  for (let u of [2, 4, 6, 8, 10, 12])
    t("r" + u, "T" + u, `600 30px ${s}`, "rgba(190,192,188,0.85)", "center");
  (t("optic", "HX-2 REFLEX", `700 44px ${n}`, r, "center"),
    t("light", "900 LM  IPX8", `600 40px ${n}`, r, "center"));
  {
    let [u, h] = hm.warn;
    ((e.fillStyle = r),
      (e.textAlign = "left"),
      (e.font = `600 24px ${n}`),
      [
        "WARNING \u2014 CLEAR CHAMBER BEFORE",
        "STOWAGE. AUTHORISED BREACH",
        "PERSONNEL ONLY. PA-REG 44/7",
      ].forEach((f, p) => e.fillText(f, u + 2, h + 20 + p * 34)));
  }
  {
    let [u, h, f, p] = hm.dots;
    ((e.fillStyle = r),
      e.beginPath(),
      e.arc(u + 12, h + p / 2, 7, 0, 7),
      e.fill(),
      (e.fillStyle = "rgba(205,60,40,0.95)"),
      e.beginPath(),
      e.arc(u + 40, h + p / 2, 7, 0, 7),
      e.fill());
  }
  e.globalCompositeOperation = "destination-out";
  let a = 7,
    l = () => ((a = (a * 16807) % 2147483647), a / 2147483647);
  for (let u = 0; u < 2600; u++) {
    e.fillStyle = `rgba(0,0,0,${0.25 + l() * 0.6})`;
    let h = l() < 0.9 ? 1 + l() * 1.5 : 2 + l() * 5;
    e.fillRect(l() * Uf, l() * Nf, h, h * (0.4 + l()));
  }
  let c = new CanvasTexture(i);
  return (
    (c.colorSpace = SRGBColorSpace),
    (c.anisotropy = 8),
    (c.generateMipmaps = !0),
    (c.minFilter = LinearMipmapLinearFilter),
    c
  );
}

function F_(i) {
  let e = [],
    t = [],
    n = [],
    s = [];
  for (let [l, c, u, h, f, p, d = 0] of i) {
    let [v, g, x, y] = hm[l],
      b = (f * x) / y,
      m = v / Uf,
      A = (v + x) / Uf,
      _ = 1 - g / Nf,
      M = 1 - (g + y) / Nf,
      E = e.length / 3,
      w;
    if (
      (p === "L"
        ? (w = [
            [c, u - f / 2, -(h + b / 2)],
            [c, u - f / 2, -(h - b / 2)],
            [c, u + f / 2, -(h - b / 2)],
            [c, u + f / 2, -(h + b / 2)],
          ])
        : p === "R"
          ? (w = [
              [c, u - f / 2, -(h - b / 2)],
              [c, u - f / 2, -(h + b / 2)],
              [c, u + f / 2, -(h + b / 2)],
              [c, u + f / 2, -(h - b / 2)],
            ])
          : (w = [
              [c - b / 2, u, -(h - f / 2)],
              [c + b / 2, u, -(h - f / 2)],
              [c + b / 2, u, -(h + f / 2)],
              [c - b / 2, u, -(h + f / 2)],
            ]),
      d)
    ) {
      let z = Math.cos(d),
        H = Math.sin(d),
        O = u,
        q = -h;
      for (let U of w) {
        let T = U[1] - O,
          D = U[2] - q;
        ((U[1] = O + T * z - D * H), (U[2] = q + T * H + D * z));
      }
    }
    for (let z of w) e.push(z[0], z[1], z[2]);
    t.push(m, M, A, M, A, _, m, _);
    let S = p === "L" ? [-1, 0, 0] : p === "R" ? [1, 0, 0] : [0, 1, 0];
    for (let z = 0; z < 4; z++) n.push(S[0], S[1], S[2]);
    s.push(E, E + 1, E + 2, E, E + 2, E + 3);
  }
  let o = new BufferGeometry();
  (o.setAttribute("position", new Float32BufferAttribute(e, 3)),
    o.setAttribute("uv", new Float32BufferAttribute(t, 2)),
    o.setAttribute("normal", new Float32BufferAttribute(n, 3)),
    o.setIndex(s));
  let r = new MeshStandardMaterial({
      map: TC(),
      transparent: !0,
      roughness: 0.62,
      metalness: 0,
      depthWrite: !1,
      polygonOffset: !0,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
      side: DoubleSide,
    }),
    a = new Mesh(o, r);
  return ((a.renderOrder = 2), a);
}

function U_(i, e) {
  let t = new Shape();
  (i.forEach((r, a) => (a ? t.lineTo(r[0], r[1]) : t.moveTo(r[0], r[1]))),
    t.closePath());
  let n = new ShapeGeometry(t);
  n.translate(0, 0, -e);
  {
    let r = 1e9,
      a = -1e9,
      l = 1e9,
      c = -1e9;
    for (let f of i)
      ((r = Math.min(r, f[0])),
        (a = Math.max(a, f[0])),
        (l = Math.min(l, f[1])),
        (c = Math.max(c, f[1])));
    let u = n.attributes.position,
      h = n.attributes.uv;
    for (let f = 0; f < u.count; f++)
      h.setXY(f, (u.getX(f) - r) / (a - r), (u.getY(f) - l) / (c - l));
  }
  let s = new ShaderMaterial({
      transparent: !0,
      premultipliedAlpha: !0,
      depthWrite: !1,
      side: DoubleSide,
      uniforms: {
        uBright: {
          value: 7,
        },
        uSun: {
          value: SUN_LIGHT.dir.clone(),
        },
        uSunCol: {
          value: SUN_LIGHT.color.clone(),
        },
        uZen: {
          value: SKY_COLORS.zenith.clone(),
        },
        uHor: {
          value: SKY_COLORS.horizonAway.clone(),
        },
        uTilt: {
          value: 0.1,
        },
      },
      vertexShader: `
      varying vec3 vView, vFwd, vRight, vUp, vWPos, vWN; varying vec2 vUv;
      uniform float uTilt;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = mv.xyz;
        vFwd = (modelViewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz; vRight = (modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz; vUp = (modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
        vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWN = normalize(mat3(modelMatrix) * normalize(vec3(0.0, -uTilt, 1.0)));   // real sights tilt the glass a few degrees
        gl_Position = projectionMatrix * mv;
      }`,
      fragmentShader: `
      varying vec3 vView, vFwd, vRight, vUp, vWPos, vWN; varying vec2 vUv;
      uniform float uBright; uniform vec3 uSun, uSunCol, uZen, uHor;
      void main(){
        vec3 d = normalize(vView), fw = normalize(vFwd);
        float k = max(dot(d, fw), 1e-3);
        vec2 a = vec2(dot(d, normalize(vRight)), dot(d, normalize(vUp))) / k;      // tangent of the angle off the bore axis
        float r = length(a), px = max(fwidth(r), 1e-5);
        float dotR = max(0.0011, px * 0.9), ringW = max(0.00045, px * 0.6);
        float dotI = 1.0 - smoothstep(dotR - px, dotR + px, r);
        float ring = 1.0 - smoothstep(ringW - px * 0.5, ringW + px, abs(r - 0.0128));
        float ang = atan(a.y, a.x);
        float tick = (1.0 - smoothstep(0.0, px * 1.2 + 0.0004, min(abs(a.x), abs(a.y)))) * step(0.0128, r) * (1.0 - smoothstep(0.0165, 0.0175, r));
        float ret = clamp(dotI + ring * 0.8 + tick * 0.8, 0.0, 1.0);
        // faint halo so the bloom has something to hold on to
        ret += 0.05 * exp(-r * r / 0.00002);
        vec3 retCol = vec3(1.0, 0.11, 0.045) * ret * uBright;
        // coated glass: sky/sun reflection through a ruby-teal dichroic coating, stronger at grazing angles
        vec3 wv = normalize(vWPos - cameraPosition); vec3 n = normalize(vWN); if (dot(n, wv) > 0.0) n = -n;
        vec3 rf = reflect(wv, n);
        float fres = pow(1.0 - abs(dot(wv, n)), 3.0);
        vec3 sky = mix(uHor, uZen, clamp(rf.y * 1.4 + 0.2, 0.0, 1.0));
        float sd = max(dot(rf, uSun), 0.0);
        sky += uSunCol * (pow(sd, 6.0) * 0.6 + pow(sd, 90.0) * 6.0);
        // blue -> amber dichroic coating across the glass, a soft diagonal sheen band, and a thin dark edge
        float band = smoothstep(0.25, 0.5, vUv.x * 0.6 + vUv.y) * (1.0 - smoothstep(0.62, 0.95, vUv.x * 0.6 + vUv.y));
        vec3 coat = mix(vec3(0.30, 0.50, 0.95), vec3(1.0, 0.62, 0.28), clamp(fres * 2.2 + vUv.y * 0.75 - 0.15, 0.0, 1.0));
        vec2 e = abs(vUv - 0.5) * 2.0; float edge = smoothstep(0.90, 1.0, max(e.x, e.y));
        float refl = 0.12 + 0.60 * fres + 0.07 * band;
        // faint emitter glow that stays visible off-axis (what you see of a powered sight from the hip)
        vec2 eg = (vUv - vec2(0.5, 0.16)) * vec2(1.0, 1.6); retCol += vec3(1.0, 0.10, 0.04) * 0.20 * exp(-dot(eg, eg) * 60.0) * (1.0 - smoothstep(0.985, 0.9995, k));
        vec3 col = (sky * 1.5 + vec3(0.03, 0.035, 0.045)) * coat * refl * (1.0 - edge) + retCol;
        float alpha = clamp(0.20 + 0.32 * fres + 0.05 * band + 0.6 * edge, 0.0, 0.94);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }),
    o = new Mesh(n, s);
  return ((o.renderOrder = 5), o);
}

function N_() {
  let i = [],
    e = [],
    t = [],
    n = [],
    s = (d, v, g, x, y) => {
      let b = i.length / 3;
      for (let m of [d, v, g, x]) i.push(m[0], m[1], m[2]);
      e.push(0, 0, 1, 0, 1, 1, 0, 1);
      for (let m = 0; m < 4; m++) t.push(y);
      n.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
  (s(
    [-0.13, -0.13, -0.03],
    [0.13, -0.13, -0.03],
    [0.13, 0.13, -0.03],
    [-0.13, 0.13, -0.03],
    0,
  ),
    s(
      [-0.13 * 0.7, -0.13 * 0.7, -0.09],
      [0.13 * 0.7, -0.13 * 0.7, -0.09],
      [0.13 * 0.7, 0.13 * 0.7, -0.09],
      [-0.13 * 0.7, 0.13 * 0.7, -0.09],
      0,
    ));
  let r = 0.065,
    a = 0.34;
  (s([-r, 0, 0.01], [r, 0, 0.01], [r, 0, -a], [-r, 0, -a], 1),
    s([0, -r, 0.01], [0, r, 0.01], [0, r, -a], [0, -r, -a], 1));
  let l = 0.17,
    c = 0.05,
    u = 0.035;
  (s([-l, -c, u], [l, -c, u], [l, c, u], [-l, c, u], 2),
    s([-l, 0, u + c], [l, 0, u + c], [l, 0, u - c], [-l, 0, u - c], 2),
    s(
      [-0.05, -0.05, -0.01],
      [0.05, -0.05, -0.01],
      [0.05, 0.05, -0.01],
      [-0.05, 0.05, -0.01],
      3,
    ),
    s(
      [-0.03, -0.03, 0.02],
      [0.03, -0.03, 0.02],
      [0.03, 0.03, 0.02],
      [-0.03, 0.03, 0.02],
      4,
    ));
  let h = new BufferGeometry();
  (h.setAttribute("position", new Float32BufferAttribute(i, 3)),
    h.setAttribute("uv", new Float32BufferAttribute(e, 2)),
    h.setAttribute("aType", new Float32BufferAttribute(t, 1)),
    h.setIndex(n));
  let f = new ShaderMaterial({
      transparent: !0,
      depthWrite: !1,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: {
        uSeed: {
          value: 0,
        },
        uInt: {
          value: 0,
        },
        uHeat: {
          value: 0,
        },
        uJet: {
          value: 1,
        },
      },
      vertexShader: `attribute float aType; varying vec2 vUv; varying float vType;
      void main(){ vUv = uv; vType = aType; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; varying float vType; uniform float uSeed, uInt, uHeat, uJet;
      float h1(float n){ return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p), a = atan(p.y, p.x); float I = 0.0; vec3 tintc = vec3(1.0, 0.50, 0.16);
        if (vType < 0.5) {
          float n1 = 3.0 + floor(h1(1.0) * 3.0), n2 = 5.0 + floor(h1(2.0) * 4.0);
          float pet = pow(abs(cos(a * n1 * 0.5 + h1(3.0) * 6.283)), 5.0) * (0.55 + 0.45 * h1(4.0));
          pet += pow(abs(cos(a * n2 * 0.5 + h1(5.0) * 6.283)), 14.0) * 0.55;
          float reach = 0.35 + 0.65 * pet;
          I = (0.25 + pet) * smoothstep(reach, reach * 0.15, r) * (0.75 + 0.25 * sin(r * 26.0 + h1(6.0) * 20.0));
        } else if (vType < 1.5) {
          float y = vUv.y, x = p.x * (1.0 + 0.5 * sin(y * 17.0 + h1(7.0) * 30.0) * y);
          float wdt = mix(0.20, 0.75, smoothstep(0.0, 0.35, y)) * (1.0 - y * 0.75);
          I = exp(-x * x / (wdt * wdt * 0.35)) * pow(1.0 - y, 1.4) * (0.7 + 0.3 * sin(y * 31.0 + h1(8.0) * 9.0)) * 0.9;
        } else if (vType < 2.5) {
          float u = abs(p.x), len = 0.55 + 0.45 * h1(9.0 + step(0.0, p.x));
          float wv = p.y * (1.0 + u * 3.0) + 0.12 * sin(u * 14.0 + h1(10.0) * 20.0) * u;
          I = exp(-wv * wv * 22.0) * smoothstep(len, 0.06, u) * smoothstep(0.02, 0.10, u) * 0.85 * uJet;
        } else if (vType < 3.5) {
          I = exp(-r * r * 5.0) * 2.4 * smoothstep(1.0, 0.6, r); tintc = vec3(1.0, 0.82, 0.58);
        } else {
          gl_FragColor = vec4(vec3(1.0, 0.28, 0.06) * exp(-r * r * 4.0) * smoothstep(1.0, 0.5, r) * uHeat, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          return;
        }
        vec3 col = mix(tintc, vec3(1.0, 0.90, 0.70), clamp(I * I * 0.7, 0.0, 1.0)) * I * uInt;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }),
    p = new Mesh(h, f);
  return ((p.renderOrder = 10), (p.frustumCulled = !1), p);
}

var Wv = {
  value: 1,
};

var AC = `
varying vec3 vObjP; varying vec3 vWNrm; varying vec3 vONrm; uniform float uKind; uniform float uRain;
float dh3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float dn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dh3(i), dh3(i + vec3(1,0,0)), f.x), mix(dh3(i + vec3(0,1,0)), dh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(dh3(i + vec3(0,0,1)), dh3(i + vec3(1,0,1)), f.x), mix(dh3(i + vec3(0,1,1)), dh3(i + vec3(1,1,1)), f.x), f.y), f.z); }
vec2 dh2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
vec2 dDrops(vec2 uv, float cell, float seed){ vec2 g = uv / cell, i = floor(g), f = fract(g); float best = 0.0;
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) { vec2 o = vec2(float(a), float(b)); vec2 r = dh2(i + o + seed);
    float keep = step(0.70, fract(r.x * 7.31 + r.y * 3.17)); vec2 c = o + 0.2 + 0.6 * r; float rad = (0.16 + 0.22 * fract(r.x * 13.7)) * keep;
    float d = length(f - c); best = max(best, sqrt(max(rad * rad - d * d, 0.0))); }
  return vec2(best * cell, step(1e-6, best)); }
vec3 dBump(vec3 N, float h){ vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition); float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx); float det = dot(dpdx, r1); vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - g); }
`;

var RC = `
vec3 dP = vObjP; vec3 dAn = abs(vONrm);
vec2 dUV = (dAn.y > dAn.x && dAn.y > dAn.z) ? dP.xz : (dAn.x > dAn.z ? dP.zy : dP.xy);
float dSm = dn3(dP * 36.0), dSm2 = dn3(dP * 150.0 + 7.0), dFine = dn3(dP * 2400.0);
float dHt = 0.0, dR = 0.0;
if (uKind < 0.5) {
  float scuff = smoothstep(0.70, 0.9, dn3(dP * vec3(420.0, 420.0, 26.0) + 3.0));
  float smudge = smoothstep(0.55, 0.8, dn3(dP * 55.0 + 11.0));
  dR = (dSm - 0.5) * 0.20 + (dSm2 - 0.5) * 0.10 + (dFine - 0.5) * 0.08 + scuff * 0.18 - smudge * 0.12;
  dHt = dFine * 0.000010 - scuff * 0.000015;
} else if (uKind < 1.5) {
  float ring = sin(dP.z * 5200.0) * 0.5 + 0.5, streak = dn3(vec3(dP.z * 950.0, 1.0, 2.0));
  dR = (streak - 0.5) * 0.26 + (dSm - 0.5) * 0.14 + (dFine - 0.5) * 0.10;
  dHt = ring * 0.000014 + dFine * 0.000010;
} else {
  float st = dn3(dP * 1500.0) * 0.6 + dn3(dP * 3100.0 + 5.0) * 0.4;
  dR = (dSm - 0.5) * 0.18 + (st - 0.5) * 0.14 - smoothstep(0.6, 0.85, dSm2) * 0.10;
  dHt = st * 0.000075;
}
float dUp = smoothstep(0.30, 0.75, vWNrm.y) * uRain;
vec2 dD1 = dDrops(dUV, 0.0046, 3.0), dD2 = dDrops(dUV + 0.31, 0.0023, 9.0);
float dDrop = max(dD1.y, dD2.y) * dUp, dDropH = max(dD1.x, dD2.x) * dUp;
float dWet = dUp * (0.5 + 0.5 * smoothstep(0.3, 0.7, dSm));
roughnessFactor = clamp(roughnessFactor + dR, 0.10, 1.0);
roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.5, dWet);
roughnessFactor = mix(roughnessFactor, 0.10, dDrop);
diffuseColor.rgb *= 1.0 - 0.18 * dWet;
`;

var CC = `
normal = dBump(normal, dHt + dDropH * 0.32);
`;

function Bf(i, e) {
  return (
    (i.onBeforeCompile = (t) => {
      ((t.uniforms.uKind = {
        value: e,
      }),
        (t.uniforms.uRain = Wv),
        (t.vertexShader = t.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
varying vec3 vObjP; varying vec3 vWNrm; varying vec3 vONrm;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
vObjP = position; vONrm = normal; vWNrm = normalize(mat3(modelMatrix) * normal);`,
          )),
        (t.fragmentShader = t.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
` + AC,
          )
          .replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>
` + RC,
          )
          .replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
` + CC,
          )));
    }),
    (i.customProgramCacheKey = () => "pac9-detail-" + e),
    i
  );
}

export { Vv, F_, U_, N_, Wv, Bf };
