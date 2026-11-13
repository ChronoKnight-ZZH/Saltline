import {
  BufferAttribute,
  BufferGeometry,
  Euler,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
} from "../../vendor/three-r180.js";
import {
  boxGeometry,
  colorGeometry,
  cylinderGeometry,
  mergeGeometryParts,
  tubeGeometry,
} from "../../core/geometry.js";

function $a(i) {
  let e = ((i | 0) * 2654435761) | 0;
  return () => {
    e = (e + 1831565813) | 0;
    let t = Math.imul(e ^ (e >>> 15), 1 | e);
    return (
      (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
}

function h1(i, e) {
  let t = Math.sin(i * 127.1 + e * 311.7) * 43758.5453;
  return t - Math.floor(t);
}

function ri(i, e) {
  let t = Math.floor(i),
    n = Math.floor(e),
    s = i - t,
    o = e - n,
    r = s * s * (3 - 2 * s),
    a = o * o * (3 - 2 * o),
    l = h1(t, n),
    c = h1(t + 1, n),
    u = h1(t, n + 1),
    h = h1(t + 1, n + 1);
  return l + (c - l) * r + (u - l) * a + (l - c - u + h) * r * a;
}

var RA = (i) => Math.max(0, Math.min(1, i));

var mn = (i, e, t) => {
  let n = RA((t - i) / (e - i));
  return n * n * (3 - 2 * n);
};

var Ir = (i, e, t) => [
  i[0] + (e[0] - i[0]) * t,
  i[1] + (e[1] - i[1]) * t,
  i[2] + (e[2] - i[2]) * t,
];

function p3(i, e, t, n = 0.01, s = "center") {
  n = Math.max(5e-4, Math.min(n, i / 2 - 1e-4, e / 2 - 1e-4, t / 2 - 1e-4));
  let o = i / 2,
    r = e / 2,
    a = t / 2,
    l = new Float32Array(72),
    c = new Float32Array(72),
    u = new Float32Array(48),
    h = (x, y, b, m) =>
      ((x > 0 ? 1 : 0) + (y > 0 ? 2 : 0) + (b > 0 ? 4 : 0)) * 3 + m;
  for (let x of [-1, 1])
    for (let y of [-1, 1])
      for (let b of [-1, 1]) {
        let m = [
            [x * o, y * (r - n), b * (a - n)],
            [x * (o - n), y * r, b * (a - n)],
            [x * (o - n), y * (r - n), b * a],
          ],
          A = [
            [x, 0, 0],
            [0, y, 0],
            [0, 0, b],
          ];
        for (let _ = 0; _ < 3; _++) {
          let M = h(x, y, b, _);
          (l.set(m[_], M * 3),
            c.set(A[_], M * 3),
            _ === 0
              ? ((u[M * 2] = m[_][2]), (u[M * 2 + 1] = m[_][1]))
              : _ === 1
                ? ((u[M * 2] = m[_][0]), (u[M * 2 + 1] = m[_][2]))
                : ((u[M * 2] = m[_][0]), (u[M * 2 + 1] = m[_][1])));
        }
      }
  let f = [],
    p = (x, y, b) => {
      let m = l[x * 3],
        A = l[x * 3 + 1],
        _ = l[x * 3 + 2],
        M = l[y * 3] - m,
        E = l[y * 3 + 1] - A,
        w = l[y * 3 + 2] - _,
        S = l[b * 3] - m,
        z = l[b * 3 + 1] - A,
        H = l[b * 3 + 2] - _,
        O = E * H - w * z,
        q = w * S - M * H,
        U = M * z - E * S,
        T = m + (M + S) / 3,
        D = A + (E + z) / 3,
        C = _ + (w + H) / 3;
      O * T + q * D + U * C >= 0 ? f.push(x, y, b) : f.push(x, b, y);
    },
    d = (x, y, b, m) => {
      (p(x, y, b), p(x, b, m));
    },
    v = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
  for (let x of [-1, 1])
    (d(...v.map(([y, b]) => h(x, y, b, 0))),
      d(...v.map(([y, b]) => h(y, x, b, 1))),
      d(...v.map(([y, b]) => h(y, b, x, 2))));
  for (let x of [-1, 1])
    for (let y of [-1, 1])
      (d(h(-1, x, y, 1), h(1, x, y, 1), h(1, x, y, 2), h(-1, x, y, 2)),
        d(h(x, -1, y, 0), h(x, 1, y, 0), h(x, 1, y, 2), h(x, -1, y, 2)),
        d(h(x, y, -1, 0), h(x, y, 1, 0), h(x, y, 1, 1), h(x, y, -1, 1)));
  for (let x of [-1, 1])
    for (let y of [-1, 1])
      for (let b of [-1, 1]) p(h(x, y, b, 0), h(x, y, b, 1), h(x, y, b, 2));
  let g = new BufferGeometry();
  return (
    g.setAttribute("position", new BufferAttribute(l, 3)),
    g.setAttribute("normal", new BufferAttribute(c, 3)),
    g.setAttribute("uv", new BufferAttribute(u, 2)),
    g.setIndex(f),
    s === "bottom" && g.translate(0, e / 2, 0),
    g
  );
}

function m3(i, e, t, n, s, o) {
  let r = 0;
  for (let a = t; a < n; a += 9) {
    let l = i[a + 3] - i[a],
      c = i[a + 4] - i[a + 1],
      u = i[a + 5] - i[a + 2],
      h = i[a + 6] - i[a],
      f = i[a + 7] - i[a + 1],
      p = i[a + 8] - i[a + 2],
      d = c * p - u * f,
      v = u * h - l * p,
      g = l * f - c * h;
    r +=
      d * ((i[a] + i[a + 3] + i[a + 6]) / 3 - s[0]) +
      v * ((i[a + 1] + i[a + 4] + i[a + 7]) / 3 - s[1]) +
      g * ((i[a + 2] + i[a + 5] + i[a + 8]) / 3 - s[2]);
  }
  if (r < 0 != !!o)
    for (let a = t; a < n; a += 9) {
      for (let c = 0; c < 3; c++) {
        let u = i[a + 3 + c];
        ((i[a + 3 + c] = i[a + 6 + c]), (i[a + 6 + c] = u));
      }
      let l = (a / 3) * 2;
      for (let c = 0; c < 2; c++) {
        let u = e[l + 2 + c];
        ((e[l + 2 + c] = e[l + 4 + c]), (e[l + 4 + c] = u));
      }
    }
}

function la(
  i,
  e,
  t,
  { closed: n = !1, center: s = null, inward: o = !1, caps: r = !1 } = {},
) {
  let a = [],
    l = [],
    c = i.length,
    u = n ? c : c - 1,
    h = [0];
  for (let g = 0; g < u; g++) {
    let x = i[g],
      y = i[(g + 1) % c];
    h.push(h[g] + Math.hypot(y[0] - x[0], y[1] - x[1]));
  }
  for (let g = 0; g < e.length - 1; g++) {
    let x = e[g],
      y = e[g + 1];
    for (let b = 0; b < u; b++) {
      let m = i[b],
        A = i[(b + 1) % c],
        _ = t(m[0], m[1], x, g),
        M = t(A[0], A[1], x, g),
        E = t(A[0], A[1], y, g + 1),
        w = t(m[0], m[1], y, g + 1);
      (a.push(..._, ...M, ...E, ..._, ...E, ...w),
        l.push(
          h[b],
          x,
          h[b + 1],
          x,
          h[b + 1],
          y,
          h[b],
          x,
          h[b + 1],
          y,
          h[b],
          y,
        ));
    }
  }
  let f = a.length,
    p = null,
    d = () => {
      if (s) return s;
      if (!p) {
        p = [0, 0, 0];
        for (let x = 0; x < f; x += 3)
          ((p[0] += a[x]), (p[1] += a[x + 1]), (p[2] += a[x + 2]));
        let g = 3 / f;
        ((p[0] *= g), (p[1] *= g), (p[2] *= g));
      }
      return p;
    };
  if ((m3(a, l, 0, f, d(), o), r && n)) {
    let g = 0,
      x = 0;
    for (let y of i) ((g += y[0]), (x += y[1]));
    ((g /= c), (x /= c));
    for (let y of [0, e.length - 1]) {
      let b = a.length,
        m = e[y],
        A = t(g, x, m, y);
      for (let _ = 0; _ < c; _++) {
        let M = i[_],
          E = i[(_ + 1) % c];
        (a.push(...A, ...t(M[0], M[1], m, y), ...t(E[0], E[1], m, y)),
          l.push(g, x, M[0], M[1], E[0], E[1]));
      }
      m3(a, l, b, a.length, d(), o);
    }
  }
  let v = new BufferGeometry();
  return (
    v.setAttribute("position", new BufferAttribute(new Float32Array(a), 3)),
    v.setAttribute("uv", new BufferAttribute(new Float32Array(l), 2)),
    v.computeVertexNormals(),
    v
  );
}

function CA(i, e, t, n, s) {
  let o = i % e;
  o < 0 && (o += e);
  let r = e - n - 2 * s;
  return o <= n
    ? 0
    : o < n + s
      ? (-t * (o - n)) / s
      : o <= n + s + r
        ? -t
        : -t * (1 - (o - n - s - r) / s);
}

function Uc(i, e, t, n, s, o, r = i) {
  let a = t - s - 2 * o,
    l = [0, s, s + o, s + o + a],
    c = [i],
    u = Math.floor((i - r) / t) - 1,
    h = Math.ceil((e - r) / t) + 1;
  for (let f = u; f <= h; f++)
    for (let p of l) {
      let d = r + f * t + p;
      d > i + 1e-4 && d < e - 1e-4 && c.push(d);
    }
  return (c.push(e), c.map((f) => [f, CA(f - r, t, n, s, o)]));
}

function pr(i, e, t = 5) {
  let n = [],
    s = Math.min(i, e) / 2,
    o = i / 2 - s,
    r = e / 2 - s;
  for (let u = 0; u < 4; u++)
    for (let h = 0; h <= t; h++) {
      let f = ((u + h / t) * Math.PI) / 2;
      n.push([
        Math.cos(f) * s + (u === 0 || u === 3 ? o : -o),
        Math.sin(f) * s + (u < 2 ? r : -r),
      ]);
    }
  let a = [],
    l = [];
  for (let u = 0; u < n.length; u++) {
    let h = n[u],
      f = n[(u + 1) % n.length];
    (a.push(0, 0, 0, h[0], h[1], 0, f[0], f[1], 0),
      l.push(
        0.5,
        0.5,
        h[0] / i + 0.5,
        h[1] / e + 0.5,
        f[0] / i + 0.5,
        f[1] / e + 0.5,
      ));
  }
  let c = new BufferGeometry();
  return (
    c.setAttribute("position", new BufferAttribute(new Float32Array(a), 3)),
    c.setAttribute("uv", new BufferAttribute(new Float32Array(l), 2)),
    c.computeVertexNormals(),
    c
  );
}

function cn(i, e) {
  return new PlaneGeometry(i, e);
}

function Nc(i, e) {
  let t = new PlaneGeometry(i, e),
    n = t.attributes.uv;
  for (let s = 0; s < n.count; s++) n.setXY(s, n.getX(s) * i, n.getY(s) * e);
  return t;
}

function PA(i) {
  let e = i.index ? i.toNonIndexed() : i;
  return (e.computeVertexNormals(), e);
}

function mr(i, e = 10, t = 6, n = Math.PI * 2, s = 0, o = Math.PI) {
  return new SphereGeometry(i, e, t, 0, n, s, o);
}

function g1(i, e = 16) {
  return new LatheGeometry(
    i.map((t) => new Vector2(t[0], t[1])),
    e,
  );
}

var f1 = new Euler();

var Fc = new Quaternion();

var g3 = new Matrix4();

var d1 = new Vector3();

var p1 = new Vector3(1, 1, 1);

function je(i, e = 0, t = 0, n = 0, s = null) {
  return (
    s ? (f1.set(s[0], s[1], s[2]), Fc.setFromEuler(f1)) : Fc.identity(),
    d1.set(e, t, n),
    g3.compose(d1, Fc, p1),
    i.applyMatrix4(g3),
    i
  );
}

function _o(i = 0, e = 0, t = 0, n = null) {
  return (
    n ? (f1.set(n[0], n[1], n[2]), Fc.setFromEuler(f1)) : Fc.identity(),
    d1.set(i, e, t),
    new Matrix4().compose(d1, Fc, p1)
  );
}

var jn = class {
  constructor(e) {
    ((this.G = e),
      (this.buckets = new Map()),
      (this.stack = []),
      (this.m = null),
      (this.defCol = new Map()));
  }
  M(e, t) {
    return this.G.mats.get(e, t);
  }
  push(e) {
    return (
      this.stack.push(this.m),
      (this.m = this.m ? this.m.clone().multiply(e) : e.clone()),
      this
    );
  }
  pop() {
    return ((this.m = this.stack.pop()), this);
  }
  add(e, t, n, s) {
    this.m && t.applyMatrix4(this.m);
    let o = n || this.defCol.get(e);
    o && colorGeometry(t, o);
    let r = this.buckets.get(e);
    return (
      r ||
        ((r = {
          mat: e,
          geos: [],
          cast: !s,
        }),
        this.buckets.set(e, r)),
      r.geos.push(t),
      t
    );
  }
  box(e, t, n, s, o, r, a, l = {}) {
    return this.add(
      e,
      je(
        l.r === 0
          ? boxGeometry(t, n, s)
          : p3(t, n, s, l.r || Math.min(0.012, Math.min(t, n, s) * 0.25)),
        o,
        r,
        a,
        l.rot,
      ),
      l.col,
    );
  }
  cyl(e, t, n, s, o, r, a, l = {}) {
    let c = cylinderGeometry(t, n, s, l.seg || 12, !!l.open);
    return (l.flat && (c = PA(c)), this.add(e, je(c, o, r, a, l.rot), l.col));
  }
  tube(e, t, n, s = {}) {
    return this.add(
      e,
      tubeGeometry(
        t,
        n,
        s.seg || 6,
        !1,
        s.tension === void 0 ? 0.5 : s.tension,
      ),
      s.col,
    );
  }
  bar(e, t, n, s, o = {}) {
    let r = new Vector3(n[0] - t[0], n[1] - t[1], n[2] - t[2]),
      a = r.length(),
      l = cylinderGeometry(
        o.r2 === void 0 ? s : o.r2,
        s,
        a,
        o.seg || 6,
        !o.caps,
      ),
      c = new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        r.normalize(),
      );
    return (
      l.applyMatrix4(
        new Matrix4().compose(
          new Vector3((t[0] + n[0]) / 2, (t[1] + n[1]) / 2, (t[2] + n[2]) / 2),
          c,
          p1,
        ),
      ),
      this.add(e, l, o.col)
    );
  }
  beam(e, t, n, s, o, r = {}) {
    let a = new Vector3(n[0] - t[0], n[1] - t[1], n[2] - t[2]),
      l = a.length(),
      c =
        r.r === 0
          ? boxGeometry(s, l, o)
          : p3(s, l, o, r.r || Math.min(s, o) * 0.2),
      u = new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        a.normalize(),
      );
    return (
      r.twist &&
        u.multiply(
          new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), r.twist),
        ),
      c.applyMatrix4(
        new Matrix4().compose(
          new Vector3((t[0] + n[0]) / 2, (t[1] + n[1]) / 2, (t[2] + n[2]) / 2),
          u,
          p1,
        ),
      ),
      this.add(e, c, r.col)
    );
  }
  decal(e, t, n, s, o, r, a) {
    return this.add(
      e.material,
      je(cn(a || t * e.aspect, t), n, s, o, r),
      null,
      !0,
    );
  }
  parts() {
    let e = [];
    for (let t of this.buckets.values())
      e.push({
        mat: t.mat,
        geo: mergeGeometryParts(t.geos),
        cast: t.cast,
      });
    return e;
  }
  group(e) {
    return Zg(this.parts(), e);
  }
};

function Zg(i, e) {
  let t = new Group();
  for (let n of i) {
    let s = new Mesh(n.geo, (e && e.get(n.mat)) || n.mat);
    ((s.castShadow = n.cast), (s.receiveShadow = !0), t.add(s));
  }
  return t;
}

function qi(i, e, t, n) {
  return ((i.userData.size = t), (i.userData.colliders = n), (i.name = e), i);
}

var m1 = new WeakMap();

function Mi(i, e, t) {
  let n = m1.get(i.mats);
  n || ((n = new Map()), m1.set(i.mats, n));
  let s = "L|" + e + "|" + JSON.stringify(t || {});
  if (!n.has(s)) {
    let o;
    try {
      o = i.mats.label(e, t || {});
    } catch {
      o = null;
    }
    n.set(
      s,
      o && o.material
        ? o
        : {
            material: i.mats.get("paint_white"),
            aspect: Math.max(1, e.length * 0.6),
          },
    );
  }
  return n.get(s);
}

function Jn(i, e) {
  let t = m1.get(i.mats);
  t || ((t = new Map()), m1.set(i.mats, t));
  let n = "D|" + e;
  if (!t.has(n)) {
    let s;
    try {
      s = i.mats.decal(e);
    } catch {
      s = null;
    }
    t.set(
      n,
      s && s.material
        ? s
        : {
            material: i.mats.get("paint_white"),
            aspect: 1,
          },
    );
  }
  return t.get(n);
}

var Bc = 2.438;

var _3 = {
  container20: {
    type: "22G1",
    gross: "30,480",
    tare: "2,230",
    net: "28,250",
    cu: "33.2",
    def: "red",
  },
  container40: {
    type: "42G1",
    gross: "32,500",
    tare: "3,750",
    net: "28,750",
    cu: "67.7",
    def: "blue",
  },
  container40hc: {
    type: "45G1",
    gross: "32,500",
    tare: "3,940",
    net: "28,560",
    cu: "76.3",
    def: "green",
  },
};

var v1 = [
  "SLTU 482915 7",
  "HBMU 307144 2",
  "NRDU 665201 9",
  "OKTU 119873 4",
  "VSLU 850362 1",
  "TQLU 274590 6",
];

var v3 = ["logo_a", "logo_b", "logo_c", "logo_d"];

var jg = ["red", "blue", "green", "yellow", "orange", "white", "grey", "teal"];

var Jt = {
  body: !0,
};

var IA = 6;

var x3 = new Map();

var y3 = 0.178;

var bf = 0.118;

var b3 = 0.162;

var Uo = {
  P: 0.278,
  d: 0.036,
  fo: 0.072,
  sl: 0.068,
};

var x1 = {
  P: 0.209,
  d: 0.02,
  fo: 0.09,
  sl: 0.03,
};

var y1 = {
  P: 0.25,
  d: 0.042,
  fo: 0.07,
  sl: 0.06,
};

export {
  $a,
  ri,
  mn,
  Ir,
  la,
  Uc,
  pr,
  cn,
  Nc,
  mr,
  g1,
  je,
  _o,
  jn,
  Zg,
  qi,
  Mi,
  Jn,
  Bc,
  _3,
  v1,
  v3,
  jg,
  Jt,
  IA,
  x3,
  y3,
  bf,
  b3,
  Uo,
  x1,
  y1,
};
