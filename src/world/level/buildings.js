import {
  Box3,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  LinearMipmapLinearFilter,
  MathUtils,
  Mesh,
  Path,
  PlaneGeometry,
  PointLight,
  Shape,
  THREE,
  TorusGeometry,
  Vector3,
} from "../../vendor/three-r180.js";
import {
  beveledBoxGeometry,
  boxGeometry,
  createMesh,
  cylinderGeometry,
  tubeGeometry,
} from "../../core/geometry.js";

var cR = new Set(["traffic_cone", "jerry_can"]);

function ob(i) {
  let e = new Group();
  e.name = "level-static";
  let t = new Group();
  t.name = "level-dynamic";
  let n = [],
    s = [],
    o = [],
    r = i.rng && i.rng.fork ? i.rng.fork() : Math.random,
    a = (T, D) => T + (D - T) * r(),
    l = (T, D) => i.mats.get(T, D),
    c = (T, D) =>
      i.mats.get(T, {
        interior: !0,
        ...(D || {}),
      }),
    u = (T) => (typeof T == "string" ? l(T) : T);
  function h(T, D, C = {}) {
    let G = createMesh(T, u(D), {
      cast: C.cast !== !1,
      recv: C.recv !== !1,
    });
    return (
      C.p && G.position.set(C.p[0], C.p[1], C.p[2]),
      C.r && G.rotation.set(C.r[0] || 0, C.r[1] || 0, C.r[2] || 0),
      (C.parent || e).add(G),
      G
    );
  }
  function f(T, D, C, G, j, N, Q, K = {}) {
    let ie = K.bevel
      ? beveledBoxGeometry(D, C, G, K.bevel)
      : boxGeometry(D, C, G);
    return h(ie, T, {
      ...K,
      p: [j, N, Q],
    });
  }
  function p(T, D, C, G, j, N, Q, K = {}) {
    return f(
      T,
      Math.abs(j - D),
      Math.abs(N - C),
      Math.abs(Q - G),
      (D + j) / 2,
      (C + N) / 2,
      (G + Q) / 2,
      K,
    );
  }
  function d(T, D, C, G, j, N, Q = {}) {
    let K = cylinderGeometry(Q.rTop ?? D, D, C, Q.seg || 12, !!Q.open),
      ie =
        Q.axis === "x"
          ? [0, 0, Math.PI / 2]
          : Q.axis === "z"
            ? [Math.PI / 2, 0, 0]
            : Q.r || [0, 0, 0];
    return h(K, T, {
      ...Q,
      p: [G, j, N],
      r: ie,
    });
  }
  function v(T, D, C = 0.03, G = {}) {
    return h(tubeGeometry(D, C, G.radial || 6, !1, G.tension ?? 0.5), T, G);
  }
  function g(T, D, C, G = 0.015, j = {}) {
    let N = new Vector3(...D),
      Q = new Vector3(...C),
      K = N.distanceTo(Q),
      ie = cylinderGeometry(G, G, K, j.seg || 6),
      F = h(ie, T, j);
    return (
      F.position.copy(N).add(Q).multiplyScalar(0.5),
      F.quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0),
        Q.sub(N).normalize(),
      ),
      F
    );
  }
  function x(
    T,
    D,
    C,
    G,
    j,
    N,
    {
      depth: Q = 0.4,
      width: K = 0.2,
      tf: ie = 0.02,
      tw: F = 0.012,
      depthAxis: X = null,
      r: ne = null,
    } = {},
  ) {
    let re = new Group();
    (re.position.set(G, j, N),
      ne && re.rotation.set(ne[0] || 0, ne[1] || 0, ne[2] || 0));
    let $ = X || (D === "y" ? "z" : "y"),
      ue = ["x", "y", "z"].find((P) => P !== D && P !== $),
      me = (P, V, Y) => {
        let L = {};
        return ((L[D] = P), (L[$] = V), (L[ue] = Y), [L.x, L.y, L.z]);
      },
      ee = (P) => {
        let V = {
          x: 0,
          y: 0,
          z: 0,
        };
        return ((V[$] = P), [V.x, V.y, V.z]);
      },
      B = u(T);
    for (let P of [-1, 1])
      h(boxGeometry(...me(C, ie, K)), B, {
        parent: re,
        p: ee(P * (Q / 2 - ie / 2)),
      });
    return (
      h(boxGeometry(...me(C, Q - 2 * ie, F)), B, {
        parent: re,
      }),
      e.add(re),
      re
    );
  }
  function y(T, D, C, G, j, N, Q = "z+", K = 0) {
    let ie = new PlaneGeometry(D, C),
      F = new Mesh(ie, T);
    return (
      (F.castShadow = !1),
      (F.receiveShadow = !0),
      F.position.set(G, j, N),
      Q === "z-"
        ? (F.rotation.y = Math.PI)
        : Q === "x+"
          ? (F.rotation.y = Math.PI / 2)
          : Q === "x-"
            ? (F.rotation.y = -Math.PI / 2)
            : Q === "y+" && ((F.rotation.x = -Math.PI / 2), (F.rotation.z = K)),
      e.add(F),
      F
    );
  }
  function b(T, D, C, G, j, N, Q) {
    try {
      let K = i.mats.decal(T);
      return !K || !K.material
        ? null
        : y(K.material, D, D / (K.aspect || 1), C, G, j, N, Q);
    } catch {
      return null;
    }
  }
  function m(T, D, C, G, j, N, Q) {
    try {
      let K = i.mats.label(T, Q || {});
      return !K || !K.material
        ? null
        : y(K.material, D * (K.aspect || 4), D, C, G, j, N);
    } catch {
      return null;
    }
  }
  function A(T, D, C, G, j, N, Q = "concrete", K = {}) {
    return i.physics.addBox([T, D, C], [G, j, N], {
      surface: Q,
      ...K,
    });
  }
  let _ = new Box3();
  function M(T, D, C = {}) {
    let G = T.userData.colliders || [],
      j = Math.abs(Math.sin(2 * D)) > 0.2;
    for (let N of G) {
      let Q = [N];
      if (j) {
        let K = N.max[0] - N.min[0],
          ie = N.max[2] - N.min[2],
          F = K >= ie ? 0 : 2,
          X = Math.max(K, ie),
          ne = Math.max(0.25, Math.min(K, ie)),
          re = Math.min(10, Math.max(1, Math.round(X / ne)));
        if (re > 1) {
          Q = [];
          for (let $ = 0; $ < re; $++) {
            let ue = N.min.slice(),
              me = N.max.slice();
            ((ue[F] = N.min[F] + (X * $) / re),
              (me[F] = N.min[F] + (X * ($ + 1)) / re),
              Q.push({
                min: ue,
                max: me,
                surface: N.surface,
              }));
          }
        }
      }
      for (let K of Q)
        if (
          (_.min.set(K.min[0], K.min[1], K.min[2]),
          _.max.set(K.max[0], K.max[1], K.max[2]),
          _.applyMatrix4(T.matrixWorld),
          !(_.max.y - _.min.y < 0.2 && _.max.y < 0.3))
        ) {
          if (j) {
            let ie = (_.max.x - _.min.x) * 0.07,
              F = (_.max.z - _.min.z) * 0.07;
            ((_.min.x += ie), (_.max.x -= ie), (_.min.z += F), (_.max.z -= F));
          }
          i.physics.addBox(_.min, _.max, {
            surface: K.surface || N.surface || "metal",
            ...(C.colOpts || {}),
          });
        }
    }
  }
  function E(T, D, C, G = 0, j = {}, N = 0, Q = {}) {
    let K = i.props.build(T, j);
    return (
      K.position.set(D, N, C),
      (K.rotation.y = G),
      (Q.dynamic ? t : e).add(K),
      K.updateMatrixWorld(!0),
      !Q.noCol && !cR.has(T) && M(K, G, Q),
      typeof K.userData.update == "function" &&
        s.push((ie) => K.userData.update(ie)),
      o.push({
        name: T,
        x: D,
        y: N,
        z: C,
        yaw: G,
      }),
      K
    );
  }
  function w(T, D, C = 0, G = 0, j = {}) {
    let N = E("stairs_metal", T, D, C, j, G),
      Q = Math.abs(Math.cos(C)) > 0.5;
    return (
      n.push(
        Q
          ? [T - 1.5, D - 0.5, T + 1.5, D + 0.5]
          : [T - 0.5, D - 1.5, T + 0.5, D + 1.5],
      ),
      N
    );
  }
  function S(T, D, C = 0, G = 0, j = {}, N = [!0, !0]) {
    let Q = N[0] && N[1] ? "both" : N[0] ? "left" : N[1] ? "right" : "none",
      K = E(
        "catwalk",
        T,
        D,
        C,
        {
          ...j,
          rails: Q,
        },
        G,
      ),
      ie = Math.abs(Math.cos(C)) > 0.5,
      F = ie ? 1.5 : 0.6,
      X = ie ? 0.6 : 1.5;
    return (n.push([T - F, D - X, T + F, D + X]), K);
  }
  let z = {
      20: "container20",
      40: "container40",
      hc: "container40hc",
    },
    H = {
      container20: 2.59,
      container40: 2.59,
      container40hc: 2.9,
    },
    O = {
      container20: 6.06,
      container40: 12.19,
      container40hc: 12.19,
    };
  function q(T, D, C, G = 0, j = 1) {
    let N = 0,
      Q = [];
    for (let K = 0; K < C.length; K++) {
      let [ie, F, X = {}] = C[K],
        ne = z[ie],
        re = (X.dx || 0) + (K ? a(-0.05, 0.05) * j : 0),
        $ = (X.dz || 0) + (K ? a(-0.04, 0.04) * j : 0),
        ue = G + a(-1, 1) * 0.022 * j * (K ? 0.6 : 1) + (X.flip ? Math.PI : 0),
        me = E(
          ne,
          T + re,
          D + $,
          ue,
          {
            color: F,
            seed: Math.floor(a(1, 99999)),
            wear: X.wear ?? a(0.2, 0.85),
            doors: X.doors || 0,
          },
          N,
        ),
        ee = O[ne],
        B = H[ne],
        P = Math.abs(Math.cos(G)) > 0.5,
        V = (P ? ee : 2.44) / 2,
        Y = (P ? 2.44 : ee) / 2;
      if ((n.push([T + re - V, D + $ - Y, T + re + V, D + $ + Y]), X.reefer)) {
        let L = -(ee / 2 + 0.2),
          Z = Math.cos(ue),
          J = Math.sin(ue);
        E(
          "reefer_unit",
          T + re + L * Z,
          D + $ - L * J,
          ue,
          {
            seed: K + 3,
          },
          N + 0.14,
        );
      }
      (Q.push(me), (N += B));
    }
    return {
      top: N,
      objs: Q,
    };
  }
  function U(T, D) {
    for (let C of n)
      if (T >= C[0] && T <= C[2] && D >= C[1] && D <= C[3]) return !0;
    return !1;
  }
  return {
    G: i,
    THREE: THREE,
    staticRoot: e,
    dynRoot: t,
    metalRects: n,
    updaters: s,
    placed: o,
    rng: r,
    rnd: a,
    M: l,
    MI: c,
    add: h,
    box: f,
    slab: p,
    cyl: d,
    tube: v,
    rod: g,
    ibeam: x,
    quad: y,
    decal: b,
    label: m,
    col: A,
    place: E,
    stairs: w,
    catwalk: S,
    stack: q,
    isMetal: U,
  };
}

var Dr = 4;

function rb(i, { scale: e = 0.5, maxW: t = 2048 } = {}) {
  let n = {
    count: 0,
    material: null,
    update() {},
  };
  if (typeof document > "u") return n;
  let s = new Map();
  if (
    (i.traverse((b) => {
      if (!b.isMesh || Array.isArray(b.material)) return;
      let m = b.material;
      if (
        !m ||
        m.name !== "label" ||
        !m.map ||
        !m.map.image ||
        !m.map.image.width
      )
        return;
      let A = b,
        _ = !1;
      for (; A;) {
        if (A.userData && A.userData.noMerge) {
          _ = !0;
          break;
        }
        A = A.parent;
      }
      _ || (s.has(m) || s.set(m, []), s.get(m).push(b));
    }),
    s.size < 2)
  )
    return n;
  let o = [...s.keys()].map((b) => {
    let m = b.map.image;
    return {
      m: b,
      img: m,
      w: Math.max(4, Math.ceil(m.width * e)),
      h: Math.max(4, Math.ceil(m.height * e)),
    };
  });
  o.sort((b, m) => m.h - b.h || m.w - b.w);
  let r = 0,
    a = 0,
    l = 0;
  for (let b of o) {
    let m = Math.min(b.w, t - 2 * Dr);
    (m < b.w && ((b.h = Math.max(4, Math.round((b.h * m) / b.w))), (b.w = m)),
      r + b.w + 2 * Dr > t && ((r = 0), (a += l), (l = 0)),
      (b.x = r + Dr),
      (b.y = a + Dr),
      (r += b.w + 2 * Dr),
      (l = Math.max(l, b.h + 2 * Dr)));
  }
  let c = t,
    u = MathUtils.ceilPowerOfTwo(Math.max(16, a + l));
  if (u > 4096) return n;
  let h = document.createElement("canvas");
  ((h.width = c), (h.height = u));
  let f = h.getContext("2d"),
    p = () => {
      (f.setTransform(1, 0, 0, 1, 0, 0),
        (f.globalAlpha = 1),
        (f.globalCompositeOperation = "source-over"),
        f.clearRect(0, 0, c, u));
      for (let b of o)
        (f.drawImage(b.img, b.x - Dr, b.y - Dr, b.w + 2 * Dr, b.h + 2 * Dr),
          f.clearRect(b.x, b.y, b.w, b.h),
          f.drawImage(b.img, b.x, b.y, b.w, b.h),
          (b.version = b.m.map.version));
    };
  p();
  let d = o[0].m,
    v = new CanvasTexture(h);
  ((v.colorSpace = d.map.colorSpace),
    (v.anisotropy = d.map.anisotropy),
    (v.generateMipmaps = !0),
    (v.minFilter = LinearMipmapLinearFilter));
  let g = d.clone();
  ((g.map = v), (g.name = "label_atlas"));
  let x = new Map();
  for (let b of o) {
    let m = b.x / c,
      A = (b.x + b.w) / c,
      _ = 1 - b.y / u,
      M = 1 - (b.y + b.h) / u;
    for (let E of s.get(b.m)) {
      let w = E.geometry.uuid + "|" + b.m.uuid,
        S = x.get(w);
      if (!S) {
        S = E.geometry.clone();
        let z = S.attributes.uv;
        if (z) {
          for (let H = 0; H < z.count; H++)
            z.setXY(
              H,
              m + MathUtils.clamp(z.getX(H), 0, 1) * (A - m),
              M + MathUtils.clamp(z.getY(H), 0, 1) * (_ - M),
            );
          z.needsUpdate = !0;
        }
        x.set(w, S);
      }
      ((E.geometry = S), (E.material = g));
    }
  }
  let y = 0;
  return {
    count: o.length,
    material: g,
    size: [c, u],
    update(b) {
      if (!(y > 8)) {
        y += b;
        for (let m of o)
          if (m.m.map.version !== m.version) {
            (p(), (v.needsUpdate = !0));
            break;
          }
      }
    },
  };
}

var no = {
  X0: -16,
  X1: 12,
  Z0: -28,
  Z1: -11,
  EAVE: 7,
  RIDGE: 9.5,
  ZR: -19.5,
  FLOOR: 0.03,
};

var No = [-16, -11.1, -6.2, -0.8, 5.6, 12];

var yt = {
  x0: -6,
  x1: -1,
  h: 5,
};

var Yt = {
  z0: -22,
  z1: -17,
  h: 4.5,
};

var iv = [
  ["S", 1, 4],
  ["S", 2, 5],
  ["S", 1, 11],
  ["S", 2, 15],
  ["S", 3, 8],
  ["N", 2, 7],
  ["N", 1, 13],
  ["N", 3, 17],
];

var A1 = [-0.04, 0.25, 0.5, 0.75, 1];

var sv = 20;

function ab(i) {
  let {
      M: e,
      MI: t,
      box: n,
      slab: s,
      cyl: o,
      rod: r,
      ibeam: a,
      col: l,
      add: c,
      G: u,
    } = i,
    { X0: h, X1: f, Z0: p, Z1: d, EAVE: v, RIDGE: g, ZR: x, FLOOR: y } = no,
    b = (d - p) / 2,
    m = g - v,
    A = Math.atan2(m, b),
    _ = Math.hypot(b, m),
    M = (L) => v + m * (1 - Math.abs(L - x) / b),
    E = e("corrugated_roof"),
    w = t("corrugated_roof"),
    S = e("concrete"),
    z = t("concrete_painted"),
    H = t("paint_grey"),
    O = t("steel_galv"),
    q = e("steel_galv"),
    U = t("steel_dark"),
    T = 0.25;
  (s(t("floor_epoxy"), h, -0.25, p, f, y, d, {
    cast: !1,
  }),
    l(h, -0.5, p, f, y, d, "concrete"),
    s(S, yt.x0 - 0.4, -0.2, d, yt.x1 + 0.4, 0.02, d + 1.4, {
      cast: !1,
    }),
    s(S, f, -0.2, Yt.z0 - 0.4, f + 1.4, 0.02, Yt.z1 + 0.4, {
      cast: !1,
    }));
  function D(L, Z, J, oe, fe, le) {
    if (oe - J < 0.02 || le - fe < 0.02) return;
    let R = L,
      I = L - Z * T;
    if (fe < 1.2) {
      let ae = L - Z * T * 0.5;
      (s(
        S,
        J,
        y - 0.2,
        Math.min(R, ae),
        oe,
        Math.min(1.2, le),
        Math.max(R, ae),
        {
          bevel: 0.015,
        },
      ),
        s(
          z,
          J,
          y - 0.2,
          Math.min(ae, I),
          oe,
          Math.min(1.2, le),
          Math.max(ae, I),
          {
            bevel: 0.015,
          },
        ));
    }
    let se = Math.max(fe, 1.2);
    le <= se ||
      (s(
        E,
        J,
        se - 0.03,
        Math.min(R + Z * 0.02, R + Z * 0.06),
        oe,
        le,
        Math.max(R + Z * 0.02, R + Z * 0.06),
      ),
      s(
        w,
        J,
        se,
        Math.min(R - Z * 0.1, R - Z * 0.13),
        oe,
        le,
        Math.max(R - Z * 0.1, R - Z * 0.13),
      ));
  }
  function C(L, Z, J, oe, fe, le) {
    if (oe - J < 0.02 || le - fe < 0.02) return;
    let R = L,
      I = L - Z * T;
    if (fe < 1.2) {
      let ae = L - Z * T * 0.5;
      (s(
        S,
        Math.min(R, ae),
        y - 0.2,
        J,
        Math.max(R, ae),
        Math.min(1.2, le),
        oe,
        {
          bevel: 0.015,
        },
      ),
        s(
          z,
          Math.min(ae, I),
          y - 0.2,
          J,
          Math.max(ae, I),
          Math.min(1.2, le),
          oe,
          {
            bevel: 0.015,
          },
        ));
    }
    let se = Math.max(fe, 1.2);
    le <= se ||
      (s(
        E,
        Math.min(R + Z * 0.02, R + Z * 0.06),
        se - 0.03,
        J,
        Math.max(R + Z * 0.02, R + Z * 0.06),
        le,
        oe,
      ),
      s(
        w,
        Math.min(R - Z * 0.1, R - Z * 0.13),
        se,
        J,
        Math.max(R - Z * 0.1, R - Z * 0.13),
        le,
        oe,
      ));
  }
  function G(L, Z, J, oe, fe, le, R = 0.25, I = 0.45, se = 0.26) {
    let ae = Math.max(1, Math.floor((le - fe - 0.1) / I));
    for (let k = 0; k <= ae; k++) {
      let ce = fe + 0.08 + ((le - fe - 0.16) * k) / ae;
      n(q, oe - J, 0.018, se, (J + oe) / 2, ce, L - Z * 0.06, {
        r: [Z * R, 0, 0],
      });
    }
    for (let k of [J + 0.03, oe - 0.03, (J + oe) / 2])
      s(q, k - 0.03, fe, L - Z * 0.2, k + 0.03, le, L + Z * 0.06);
    (s(q, J, fe - 0.05, L - Z * 0.2, oe, fe, L + Z * 0.07),
      s(q, J, le, L - Z * 0.2, oe, le + 0.05, L + Z * 0.07));
  }
  function j(L, Z, J, oe, fe, le, R = 0.5, I = 0.45, se = 0.26) {
    let ae = Math.max(1, Math.floor((le - fe - 0.1) / I));
    for (let k = 0; k <= ae; k++) {
      let ce = fe + 0.08 + ((le - fe - 0.16) * k) / ae;
      n(q, se, 0.018, oe - J, L - Z * 0.06, ce, (J + oe) / 2, {
        r: [0, 0, -Z * R],
      });
    }
    for (let k of [J + 0.03, oe - 0.03, (J + oe) / 2])
      s(q, L - Z * 0.2, fe, k - 0.03, L + Z * 0.06, le, k + 0.03);
    (s(q, L - Z * 0.2, fe - 0.05, J, L + Z * 0.07, fe, oe),
      s(q, L - Z * 0.2, le, J, L + Z * 0.07, le + 0.05, oe));
  }
  let N = 5.45,
    Q = 6.8;
  for (let L = 0; L < No.length - 1; L++) {
    let Z = No[L],
      J = No[L + 1];
    L === 2
      ? (D(d, 1, Z, yt.x0, 0, v),
        D(d, 1, yt.x1, J, 0, v),
        D(d, 1, yt.x0, yt.x1, yt.h, v))
      : (D(d, 1, Z, J, 0, N - 0.05),
        D(d, 1, Z, J, Q + 0.05, v),
        G(d, 1, Z + 0.15, J - 0.15, N, Q));
  }
  (D(p, -1, h, f, 0, v),
    s(t("paint_grey"), 6.2, y, p + T, 7.2, 2.1, p + T + 0.04),
    s(e("paint_grey"), 6.2, 0, p - 0.09, 7.2, 2.1, p - 0.05),
    C(h, -1, p, d, 0, v),
    C(f, 1, p, Yt.z0, 0, N - 0.05));
  let K = {
    z0: -15.55,
    z1: -13.35,
    y0: 3.3,
  };
  (C(f, 1, Yt.z1, K.z0, 0, N - 0.05),
    C(f, 1, K.z1, d, 0, N - 0.05),
    C(f, 1, K.z0, K.z1, 0, K.y0),
    n(E, 0.03, 1.5, 1.05, f + 0.2, K.y0 - 0.55, K.z0 + 0.5, {
      r: [0.25, 0.1, -0.22],
    }),
    n(E, 1, 0.03, 2, f + 1.3, 0.05, K.z0 + 1.6, {
      r: [0.02, 0.5, 0.03],
    }));
  for (let L of [K.z0, K.z1])
    s(O, f - 0.16, K.y0, L - 0.03, f - 0.1, N - 0.05, L + 0.03);
  (C(f, 1, Yt.z0, Yt.z1, Yt.h, N - 0.05), C(f, 1, p, d, Q + 0.05, v));
  for (let [L, Z] of [
    [p + 0.3, -22.45],
    [-22.15, -16.85],
    [-16.55, d - 0.3],
  ])
    j(f, 1, L, Z, N, Q);
  let ie = {
    y: 8.02,
    r: 0.56,
  };
  function F(L, Z, J) {
    let oe = (fe, le, R) => {
      let I = new Shape();
      if (
        (I.moveTo(-(d + 0.05), v - 0.02),
        I.lineTo(-x, g),
        I.lineTo(-(p - 0.05), v - 0.02),
        I.closePath(),
        J)
      ) {
        let ae = new Path();
        (ae.absarc(-x, ie.y, ie.r, 0, Math.PI * 2, !0), I.holes.push(ae));
      }
      let se = new ExtrudeGeometry(I, {
        depth: fe,
        bevelEnabled: !1,
        curveSegments: 20,
      });
      (se.rotateY(Math.PI / 2), se.translate(L + R, 0, 0), c(se, le));
    };
    (oe(0.04, E, Z > 0 ? 0.02 : -0.06), oe(0.03, w, Z > 0 ? -0.13 : 0.1));
  }
  (F(f, 1, !0),
    F(h, -1, !1),
    l(h, 0, d - T, yt.x0, v, d + 0.06, "metal"),
    l(yt.x1, 0, d - T, f, v, d + 0.06, "metal"),
    l(yt.x0, yt.h - 0.5, d - 0.6, yt.x1, v, d + 0.06, "metal"),
    l(h, 0, p - 0.06, f, v, p + T, "metal"),
    l(h - 0.06, 0, p, h + T, g, d, "metal"),
    l(f - T, 0, p, f + 0.06, g, Yt.z0, "metal"),
    l(f - T, 0, Yt.z1, f + 0.06, g, -15.55, "metal"),
    l(f - T, 0, -13.35, f + 0.06, g, d, "metal"),
    l(f - T, 0, -15.55, f + 0.06, 3.3, -13.35, "metal"),
    l(f - T, 5.4, -15.55, f + 0.06, g, -13.35, "metal"),
    l(f - T, Yt.h, Yt.z0, f + 0.06, g, Yt.z1, "metal"));
  let X = [],
    ne = (f - h + 0.6) / sv,
    re = h - 0.3;
  for (let L of ["S", "N"]) {
    let Z = L === "S" ? 1 : -1,
      J = [Z * A, 0, 0],
      oe = Math.cos(A),
      fe = Z * Math.sin(A);
    for (let R = 0; R < 4; R++) {
      let I = A1[R],
        se = A1[R + 1],
        ae = (I + se) / 2,
        k = (se - I) * _,
        ce = x + Z * b * (1 - ae),
        ve = v + m * ae,
        _e = 0;
      for (; _e < sv;) {
        if (iv.some((Ne) => Ne[0] === L && Ne[1] === R && Ne[2] === _e)) {
          _e++;
          continue;
        }
        let Te = _e;
        for (
          ;
          Te + 1 < sv &&
          !iv.some((Ne) => Ne[0] === L && Ne[1] === R && Ne[2] === Te + 1);
        )
          Te++;
        let Pe = re + _e * ne,
          Re = re + (Te + 1) * ne,
          Fe = (Pe + Re) / 2;
        (n(E, Re - Pe, 0.04, k + 0.02, Fe, ve + oe * 0.03, ce + fe * 0.03, {
          r: J,
        }),
          n(w, Re - Pe, 0.02, k + 0.02, Fe, ve - oe * 0.02, ce - fe * 0.02, {
            r: J,
          }));
        let ze = x + Z * b * (1 - I),
          We = x + Z * b * (1 - se);
        (l(
          Math.max(Pe, h - 0.3),
          v + m * Math.max(0, I) - 0.05,
          Math.min(ze, We),
          Re,
          v + m * se + 0.08,
          Math.max(ze, We),
          "metal",
          {
            noNav: !0,
          },
        ),
          (_e = Te + 1));
      }
    }
    for (let R of iv)
      if (R[0] === L) {
        let I = A1[R[1]],
          se = A1[R[1] + 1],
          ae = re + R[2] * ne,
          k = (I + se) / 2,
          ce = x + Z * b * (1 - k),
          ve = v + m * k;
        (X.push({
          x: ae + ne / 2,
          y: ve,
          z: ce,
          w: ne,
          d: (se - I) * b,
        }),
          i.decal(
            "leak_stain",
            1.9,
            ae + ne / 2 + 0.2,
            y + 0.004,
            ce,
            "y+",
            R[2] * 1.7,
          ),
          n(
            O,
            0.05,
            0.05,
            (se - I) * _,
            ae + 0.02,
            ve - oe * 0.06,
            ce - fe * 0.06,
            {
              r: J,
            },
          ),
          n(
            O,
            0.05,
            0.05,
            (se - I) * _,
            ae + ne - 0.02,
            ve - oe * 0.06,
            ce - fe * 0.06,
            {
              r: J,
            },
          ));
      }
    for (let R of [0.03, 0.2, 0.37, 0.54, 0.71, 0.88, 0.985]) {
      let I = x + Z * b * (1 - R),
        se = v + m * R;
      n(
        O,
        f - h - 0.3,
        0.17,
        0.06,
        (h + f) / 2,
        se - oe * 0.13,
        I - fe * 0.13,
        {
          r: J,
        },
      );
    }
    let le = x + Z * (b + 0.38);
    (s(
      q,
      h - 0.3,
      v - 0.22,
      Math.min(le, le + Z * 0.16),
      f + 0.3,
      v - 0.08,
      Math.max(le, le + Z * 0.16),
    ),
      s(
        q,
        h - 0.3,
        v - 0.22,
        Math.min(le - Z * 0.05, le + Z * 0.21),
        f + 0.3,
        v - 0.19,
        Math.max(le - Z * 0.05, le + Z * 0.21),
      ));
    for (let R = 0; R < No.length; R++) {
      if (L === "S" && (R === 2 || R === 3)) continue;
      let I = Math.min(f - 0.5, Math.max(h + 0.5, No[R])) + 0.42,
        se = x + Z * (b + 0.13);
      (o(q, 0.055, v - 0.4, I, (v - 0.4) / 2 + 0.2, se, {
        seg: 8,
      }),
        r(q, [I, v - 0.2, se], [I, v - 0.12, le + Z * 0.08], 0.05));
      for (let ae of [1.6, 3.6, 5.6])
        n(q, 0.16, 0.04, 0.14, I, ae, se - Z * 0.02);
      r(q, [I, 0.2, se], [I + 0.02, 0.06, se + Z * 0.22], 0.055);
    }
  }
  for (let L of [-1, 1])
    n(q, f - h + 0.7, 0.03, 0.34, (h + f) / 2, g + 0.03, x + L * 0.15, {
      r: [L * A, 0, 0],
    });
  for (let L of [h - 0.31, f + 0.31])
    for (let Z of [-1, 1])
      n(q, 0.04, 0.22, _ + 0.4, L, (v + g) / 2 - 0.05, x + Z * (b / 2 + 0.1), {
        r: [Z * A, 0, 0],
      });
  let $ = [d - T - 0.24, p + T + 0.24];
  for (let L = 0; L < No.length; L++) {
    let Z = L === 0 ? h + T + 0.12 : L === No.length - 1 ? f - T - 0.12 : No[L];
    for (let J of $)
      (a(H, "y", v - 0.35, Z, y + (v - 0.35) / 2, J, {
        depth: 0.46,
        width: 0.22,
        depthAxis: "z",
      }),
        n(U, 0.36, 0.03, 0.62, Z, y + 0.015, J),
        l(Z - 0.12, 0, J - 0.24, Z + 0.12, v, J + 0.24, "metal"));
    for (let J of [1, -1]) {
      let oe = x + (J * b) / 2 - J * 0.14,
        fe = v + m / 2 - 0.42;
      (a(H, "z", _ - 0.5, Z, fe, oe, {
        depth: 0.4,
        width: 0.2,
        depthAxis: "y",
        r: [J * A, 0, 0],
      }),
        n(H, 0.014, 0.5, 1.5, Z, v - 0.55, x + J * (b - T - 0.9), {
          r: [J * (A + 0.22), 0, 0],
        }),
        n(H, 0.2, 0.02, 1.55, Z, v - 0.82, x + J * (b - T - 0.95), {
          r: [J * (A + 0.42), 0, 0],
        }));
    }
    n(H, 0.22, 0.5, 0.03, Z, g - 0.55, x);
  }
  for (let L of [h + T + 0.12, f - T - 0.12])
    for (let Z of [-22.3, -16.7]) {
      let J = M(Z) - 0.55;
      (a(H, "y", J, L, y + J / 2, Z, {
        depth: 0.3,
        width: 0.18,
        depthAxis: "x",
      }),
        l(L - 0.16, 0, Z - 0.1, L + 0.16, J, Z + 0.1, "metal"));
    }
  for (let L of $) {
    let Z = L > x ? 1 : -1;
    for (let J of [2.3, 3.7, 5.15])
      Z > 0
        ? (s(O, h + 0.3, J - 0.08, d - 0.2, yt.x0 - 0.2, J + 0.08, d - 0.14),
          s(O, yt.x1 + 0.2, J - 0.08, d - 0.2, f - 0.3, J + 0.08, d - 0.14))
        : s(O, h + 0.3, J - 0.08, p + 0.14, f - 0.3, J + 0.08, p + 0.2);
    n(H, f - h - 0.6, 0.14, 0.14, (h + f) / 2, v - 0.25, L);
  }
  for (let L of [h + 0.17, f - 0.17])
    for (let Z of [2.3, 3.7, 5.15])
      L > 0
        ? (s(O, L - 0.03, Z - 0.08, p + 0.3, L + 0.03, Z + 0.08, Yt.z0 - 0.2),
          s(O, L - 0.03, Z - 0.08, Yt.z1 + 0.2, L + 0.03, Z + 0.08, d - 0.3))
        : s(O, L - 0.03, Z - 0.08, p + 0.3, L + 0.03, Z + 0.08, d - 0.3);
  for (let [L, Z] of [
    [No[0] + 0.4, No[1]],
    [No[4], No[5] - 0.4],
  ]) {
    for (let J of $)
      (r(O, [L, 1.35, J], [Z, 5.3, J], 0.016),
        r(O, [Z, 1.35, J + 0.04], [L, 5.3, J + 0.04], 0.016));
    for (let J of [1, -1]) {
      let oe = x + J * (b - 0.6),
        fe = -0.3;
      (r(O, [L, v + fe + 0.1, oe], [Z, g + fe - 0.1, x + J * 0.3], 0.014),
        r(O, [Z, v + fe + 0.1, oe], [L, g + fe - 0.1, x + J * 0.3], 0.014));
    }
  }
  {
    let L = d - T;
    for (let Z of [yt.x0 - 0.07, yt.x1 + 0.07])
      (s(U, Z - 0.07, y, L - 0.16, Z + 0.07, yt.h + 0.75, d + 0.07),
        s(e("hazard_stripes"), Z - 0.11, y, L - 0.2, Z + 0.11, 1.3, d + 0.1, {
          bevel: 0.01,
        }));
    (s(U, yt.x0 - 0.2, yt.h, L - 0.1, yt.x1 + 0.2, yt.h + 0.14, d + 0.08),
      s(O, yt.x0 - 0.25, yt.h + 0.78, L - 0.72, yt.x1 + 0.25, yt.h + 0.81, L),
      s(
        O,
        yt.x0 - 0.25,
        yt.h + 0.3,
        L - 0.72,
        yt.x1 + 0.25,
        yt.h + 0.81,
        L - 0.69,
      ));
    for (let Z of [yt.x0 - 0.24, yt.x1 + 0.24])
      s(O, Z - 0.012, yt.h + 0.05, L - 0.72, Z + 0.012, yt.h + 0.81, L);
    (o(
      w,
      0.3,
      yt.x1 - yt.x0 + 0.3,
      (yt.x0 + yt.x1) / 2,
      yt.h + 0.44,
      L - 0.36,
      {
        axis: "x",
        seg: 18,
      },
    ),
      o(
        U,
        0.05,
        yt.x1 - yt.x0 + 0.46,
        (yt.x0 + yt.x1) / 2,
        yt.h + 0.44,
        L - 0.36,
        {
          axis: "x",
          seg: 8,
        },
      ),
      s(
        w,
        yt.x0 + 0.02,
        yt.h - 0.42,
        L - 0.09,
        yt.x1 - 0.02,
        yt.h + 0.42,
        L - 0.06,
      ),
      s(
        e("hazard_stripes"),
        yt.x0 + 0.02,
        yt.h - 0.52,
        L - 0.12,
        yt.x1 - 0.02,
        yt.h - 0.42,
        L - 0.03,
      ),
      s(
        U,
        yt.x1 + 0.28,
        yt.h + 0.2,
        L - 0.6,
        yt.x1 + 0.7,
        yt.h + 0.7,
        L - 0.15,
        {
          bevel: 0.02,
        },
      ),
      r(
        U,
        [yt.x1 + 0.5, yt.h + 0.2, L - 0.3],
        [yt.x1 + 0.5, 1.2, L - 0.3],
        0.008,
      ));
    for (let Z of [yt.x0 - 0.45, yt.x1 + 0.45])
      i.place("bollard_post", Z, d + 0.55, 0, {
        seed: 5,
      });
  }
  {
    let L = f + 0.12,
      Z = Yt.z0 - 0.25,
      J = Z - 5.1;
    s(E, L, 0.12, J, L + 0.05, Yt.h + 0.1, Z);
    for (let oe of [J, Z, (J + Z) / 2])
      s(q, L - 0.02, 0.1, oe - 0.05, L + 0.09, Yt.h + 0.12, oe + 0.05);
    for (let oe of [0.14, Yt.h + 0.08, Yt.h * 0.5])
      s(q, L - 0.02, oe - 0.05, J, L + 0.09, oe + 0.05, Z);
    (r(q, [L + 0.02, 0.2, J + 0.1], [L + 0.02, Yt.h, (J + Z) / 2], 0.02),
      r(q, [L + 0.02, 0.2, Z - 0.1], [L + 0.02, Yt.h, (J + Z) / 2], 0.02),
      s(U, L - 0.04, Yt.h + 0.16, J - 0.2, L + 0.12, Yt.h + 0.3, Yt.z1 + 0.3),
      s(U, f - T - 0.02, y, Yt.z0 - 0.12, f + 0.08, Yt.h + 0.1, Yt.z0),
      s(U, f - T - 0.02, y, Yt.z1, f + 0.08, Yt.h + 0.1, Yt.z1 + 0.12),
      s(
        U,
        f - T - 0.02,
        Yt.h,
        Yt.z0 - 0.12,
        f + 0.08,
        Yt.h + 0.12,
        Yt.z1 + 0.12,
      ));
    for (let oe of [Yt.z0 - 0.06, Yt.z1 + 0.06])
      s(
        e("hazard_stripes"),
        f - T - 0.05,
        y,
        oe - 0.1,
        f + 0.1,
        1.3,
        oe + 0.1,
        {
          bevel: 0.01,
        },
      );
    (l(L - 0.05, 0, J, L + 0.12, Yt.h + 0.3, Z, "metal"),
      i.place("bollard_post", f + 0.6, Yt.z0 - 0.4, 0, {
        seed: 6,
      }));
  }
  let ue = new Group();
  (ue.position.set(f - 0.05, ie.y, x), (ue.userData.noMerge = !0));
  {
    let L = new TorusGeometry(ie.r + 0.02, 0.05, 8, 28);
    (L.rotateY(Math.PI / 2),
      c(L, q, {
        p: [f + 0.04, ie.y, x],
      }));
    let Z = new TorusGeometry(ie.r + 0.02, 0.035, 6, 28);
    (Z.rotateY(Math.PI / 2),
      c(Z, O, {
        p: [f - 0.16, ie.y, x],
      }));
    for (let fe of [0.4, 0.4 + Math.PI / 2])
      r(
        q,
        [f + 0.1, ie.y - Math.sin(fe) * ie.r, x - Math.cos(fe) * ie.r],
        [f + 0.1, ie.y + Math.sin(fe) * ie.r, x + Math.cos(fe) * ie.r],
        0.012,
      );
    for (let fe of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3])
      r(
        O,
        [f - 0.18, ie.y + Math.sin(fe) * ie.r, x + Math.cos(fe) * ie.r],
        [f - 0.18, ie.y, x],
        0.014,
      );
    o(U, 0.13, 0.26, f - 0.22, ie.y, x, {
      axis: "x",
      seg: 12,
    });
    let J = t("steel_worn");
    for (let fe = 0; fe < 5; fe++) {
      let le = boxGeometry(0.012, 0.42, 0.2);
      (le.rotateY(0.5),
        le.translate(0, 0.3, 0),
        le.rotateX((fe / 5) * Math.PI * 2));
      let R = new Mesh(le, J);
      ((R.castShadow = !0), (R.receiveShadow = !0), ue.add(R));
    }
    let oe = new Mesh(
      cylinderGeometry(0.1, 0.1, 0.1, 12).rotateZ(Math.PI / 2),
      U,
    );
    ((oe.castShadow = !0), ue.add(oe), i.dynRoot.add(ue));
  }
  let me = u.mats.emissive(16757864, 7),
    ee = t("aluminium"),
    B = [];
  for (let L of [-15.4, -23.6])
    for (let Z of [-13.6, -8.5, -3.5, 2.6, 8.6])
      (L < -20 && Z < -10) || B.push([Z, L]);
  for (let [L, Z] of B) {
    let J = M(Z) - 0.3,
      oe = 6.05;
    (r(U, [L, J, Z], [L, oe + 0.3, Z], 0.012, {
      cast: !1,
    }),
      o(ee, 0.33, 0.3, L, oe + 0.15, Z, {
        rTop: 0.09,
        seg: 14,
      }),
      o(U, 0.09, 0.14, L, oe + 0.37, Z, {
        seg: 10,
      }),
      o(me, 0.24, 0.02, L, oe + 0.02, Z, {
        seg: 14,
        cast: !1,
        recv: !1,
      }));
  }
  let P = [];
  for (let [L, Z] of [
    [-8.5, -15.4],
    [2.6, -15.4],
    [-3.5, -23.6],
    [8.6, -23.6],
  ]) {
    let J = new PointLight(16761994, 34, 13, 2);
    (J.position.set(L, 5.75, Z),
      (J.castShadow = !1),
      i.dynRoot.add(J),
      P.push(J));
  }
  {
    let Z = h + T + 0.02,
      J = -10.25,
      oe = p + T + 0.02,
      fe = -23.75;
    s(t("diamond_plate"), Z, 2.6 - 0.1, oe, J, 2.6, fe);
    for (let Te of [Z + 0.1, -13, J - 0.08])
      s(H, Te - 0.07, 2.6 - 0.3, oe, Te + 0.07, 2.6 - 0.1, fe);
    for (let [Te, Pe] of [
      [J - 0.08, fe - 0.08],
      [J - 0.08, oe + 0.3],
      [-13, fe - 0.08],
    ])
      (n(H, 0.14, 2.6 - 0.1, 0.14, Te, (2.6 - 0.1) / 2, Pe, {
        bevel: 0.01,
      }),
        l(Te - 0.08, 0, Pe - 0.08, Te + 0.08, 2.6, Pe + 0.08, "metal", {
          noNav: !0,
        }));
    let le = t("paint_white"),
      R = e("glass_dirty"),
      I = Z + 0.05,
      se = J - 0.05,
      ae = oe + 0.05,
      k = fe - 0.05,
      ce = 5,
      ve = (Te, Pe, Re, Fe = 0.07) => {
        (s(Re, I, Te, k - Fe, se, Pe, k),
          s(Re, se - Fe, Te, ae, se, Pe, k - Fe));
      };
    (ve(2.6, 3.5, le), ve(4.45, ce, le), ve(3.5, 4.45, R, 0.02));
    for (let Te of [I + 0.04, -14.2, -12.9, -11.75, se - 0.04])
      s(le, Te - 0.04, 3.5, k - 0.07, Te + 0.04, 4.45, k);
    for (let Te of [ae + 0.04, -26.3, -25, k - 0.04])
      s(le, se - 0.07, 3.5, Te - 0.04, se, 4.45, Te + 0.04);
    (s(t("paint_grey"), -11.65, 2.6, k - 0.01, -10.75, 4.6, k + 0.03),
      s(le, I, ce, ae, se + 0.1, ce + 0.08, k + 0.1),
      s(t("wood_dark"), I + 0.2, 3.3, ae + 0.3, se - 0.3, 3.36, ae + 1),
      s(U, -13.4, 3.36, ae + 0.5, -12.7, 3.8, ae + 0.56),
      n(
        u.mats.emissive(13624063, 2.4),
        1.2,
        0.04,
        0.14,
        -13,
        ce - 0.05,
        -25.8,
        {
          cast: !1,
          recv: !1,
        },
      ),
      n(
        u.mats.emissive(10473727, 1.6),
        0.6,
        0.36,
        0.01,
        -13.05,
        3.6,
        ae + 0.59,
        {
          cast: !1,
          recv: !1,
        },
      ),
      l(I, 2.6 - 0.12, ae, se, ce + 0.08, k, "metal", {
        noNav: !0,
      }),
      l(Z, 2.6 - 0.12, oe, J, 2.6, fe, "metal", {
        noNav: !0,
      }));
    let _e = fe + 0.6;
    (i.catwalk(
      -14.25,
      _e,
      0,
      2.6 - 0.05,
      {
        seed: 2,
      },
      [!1, !0],
    ),
      i.catwalk(
        -11.25,
        _e,
        0,
        2.6 - 0.05,
        {
          seed: 3,
        },
        [!1, !0],
      ));
    for (let Te of [-15.6, -12.75, -9.85])
      n(H, 0.1, 2.6 - 0.12, 0.1, Te, (2.6 - 0.12) / 2, _e + 0.5, {
        bevel: 0.01,
      });
    (s(H, -15.75, 2.6 - 0.26, _e + 0.44, -9.75, 2.6 - 0.12, _e + 0.56),
      i.stairs(-8.25, _e, Math.PI, 0, {
        seed: 4,
      }),
      i.metalRects.push([Z, oe, -6.7, _e + 0.6]));
  }
  {
    let J = d - T - 0.05,
      oe = J - 0.75;
    s(t("wood_dark"), 1.6, 0.88, oe, 5, 0.94, J, {
      bevel: 0.012,
    });
    for (let fe of [1.6 + 0.06, 5 - 0.06, (1.6 + 5) / 2])
      for (let le of [oe + 0.06, J - 0.06])
        n(U, 0.05, 0.86, 0.05, fe, y + 0.43, le);
    (s(U, 1.6 + 0.04, 0.2, oe + 0.06, 5 - 0.04, 0.23, J - 0.04),
      s(
        t("paint_grey"),
        1.6 + 0.1,
        0.55,
        oe + 0.04,
        1.6 + 1.3,
        0.86,
        J - 0.05,
        {
          bevel: 0.01,
        },
      ),
      s(t("wood_pallet"), 1.6, 1.25, J - 0.02, 5, 2.3, J + 0.01));
    for (let fe = 0; fe < 7; fe++)
      r(
        O,
        [1.6 + 0.3 + fe * 0.42, 1.5 + (fe % 3) * 0.12, J - 0.04],
        [1.6 + 0.3 + fe * 0.42, 2.05 + (fe % 2) * 0.1, J - 0.04],
        0.012 + (fe % 2) * 0.006,
        {
          cast: !1,
        },
      );
    (n(U, 0.16, 0.14, 0.3, 5 - 0.5, 1.01, oe + 0.2, {
      bevel: 0.015,
    }),
      n(O, 0.03, 0.03, 0.34, 5 - 0.5, 1.1, oe + 0.12),
      n(t("paint_red"), 0.45, 0.22, 0.24, 1.6 + 1.9, 1.05, oe + 0.35, {
        bevel: 0.02,
        r: [0, 0.3, 0],
      }),
      s(U, 1.6, 2.5, J - 0.3, 5, 2.53, J),
      n(
        u.mats.emissive(16773328, 3),
        5 - 1.6 - 0.4,
        0.03,
        0.1,
        (1.6 + 5) / 2,
        2.48,
        J - 0.18,
        {
          cast: !1,
          recv: !1,
        },
      ),
      l(1.6, 0, oe, 5, 0.94, J, "wood"));
  }
  {
    for (let fe of [-1, 1]) {
      let le = -11.6 + (fe * 2.6) / 2;
      (r(t("paint_yellow"), [le, y, -17.6 - 0.9], [le, 3.3, -17.6], 0.045),
        r(t("paint_yellow"), [le, y, -17.6 + 0.9], [le, 3.3, -17.6], 0.045),
        r(
          t("paint_yellow"),
          [le, 1, -17.6 - 0.62],
          [le, 1, -17.6 + 0.62],
          0.03,
        ));
      for (let R of [-17.6 - 0.9, -17.6 + 0.9])
        o(U, 0.07, 0.1, le, y + 0.05, R, {
          axis: "x",
          seg: 8,
        });
    }
    (a(t("paint_yellow"), "x", 2.6 + 0.5, -11.6, 3.3 + 0.1, -17.6, {
      depth: 0.22,
      width: 0.14,
    }),
      n(U, 0.3, 0.26, 0.24, -11.6 + 0.2, 3.3 - 0.14, -17.6, {
        bevel: 0.02,
      }),
      r(O, [-11.6 + 0.2, 3.3 - 0.26, -17.6], [-11.6 + 0.2, 1.75, -17.6], 0.012),
      r(
        O,
        [-11.6 + 0.32, 3.3 - 0.26, -17.6],
        [-11.6 + 0.34, 2.2, -17.6 + 0.02],
        0.008,
      ),
      n(U, 0.85, 0.5, 0.55, -11.6 + 0.2, 1.42, -17.6, {
        bevel: 0.03,
        r: [0, 0.2, 0.05],
      }),
      n(t("steel_worn"), 0.7, 0.16, 0.42, -11.6 + 0.2, 1.74, -17.6, {
        bevel: 0.02,
        r: [0, 0.2, 0.05],
      }),
      o(t("steel_bare"), 0.16, 0.12, -11.6 - 0.28, 1.4, -17.6 - 0.08, {
        axis: "x",
        seg: 12,
      }),
      l(
        -11.6 - 2.6 / 2 - 0.1,
        0,
        -17.6 - 0.35,
        -11.6 + 2.6 / 2 + 0.1,
        1.9,
        -17.6 + 0.35,
        "metal",
      ));
  }
  let V = Math.PI / 2,
    Y = (L, Z, J, oe, fe, le = y, R) => i.place(L, Z, J, oe, fe, le, R);
  for (let L of [-8.4, -5.6, -2.8, 2.8, 5.6, 8.4])
    Y("shelf_rack", L, p + T + 0.62, 0, {
      seed: Math.round(L * 7 + 90),
    });
  for (let L of [2.8, 5.6, 8.4])
    Y("shelf_rack", L, -23.45, 0, {
      seed: Math.round(L * 5 + 40),
    });
  return (
    Y("pallet_stack", 0, -26.9, 0.1, {
      seed: 3,
    }),
    Y(
      "cardboard_boxes",
      -0.05,
      -26.9,
      0.5,
      {
        seed: 4,
      },
      y + 1.15,
      {
        noCol: !0,
      },
    ),
    Y("crate_stack", 2.9, -15.9, 0.12, {
      seed: 11,
    }),
    Y("crate_wood", 4.15, -16.3, -0.25, {
      seed: 12,
    }),
    Y("pallet_stack", 2, -17.3, 1.45, {
      seed: 13,
    }),
    Y("ibc_tote", 6.9, -19.6, 0.1, {
      seed: 14,
    }),
    Y("barrel", 7.9, -18.5, 0, {
      seed: 15,
      color: "blue",
    }),
    Y("barrel", 6, -18.4, 0.6, {
      seed: 16,
      color: "red",
    }),
    Y("ibc_tote", -7.6, -16.4, -0.08, {
      seed: 17,
    }),
    Y("barrel", -8.6, -15.3, 0, {
      seed: 18,
    }),
    Y("barrel", -7.9, -15, 0.9, {
      seed: 19,
      color: "yellow",
    }),
    Y("sandbags", 10.2, -16.4, V + 0.05, {
      seed: 20,
    }),
    Y("forklift", 8.3, -13.9, 2.75, {
      seed: 21,
    }),
    Y("toolbox_cart", 6, -12.2, 0.15, {
      seed: 22,
    }),
    Y("gas_cylinders", 10.9, -11.9, 0, {
      seed: 23,
    }),
    Y("tarp_cargo", -13.2, -13.2, 0.12, {
      seed: 24,
    }),
    Y("tire_stack", -15, -15.6, 0, {
      seed: 25,
    }),
    Y("tire_stack", -14.9, -16.6, 0.4, {
      seed: 26,
    }),
    Y("cardboard_boxes", -14.6, -26.6, 0.2, {
      seed: 27,
    }),
    Y("crate_wood", -12.4, -26.9, -0.1, {
      seed: 28,
    }),
    Y("barrel", -10.9, -27, 0, {
      seed: 29,
      color: "green",
    }),
    Y("crate_wood", -14.7, -24.6, 0.3, {
      seed: 30,
    }),
    Y("jerry_can", -9.3, -12, 0.4, {
      seed: 31,
    }),
    Y("jerry_can", -9.7, -12.1, 1.2, {
      seed: 32,
    }),
    Y("pallet", 10.6, -13.6, 0.2, {
      seed: 33,
    }),
    Y(
      "cardboard_boxes",
      10.6,
      -13.6,
      0.3,
      {
        seed: 34,
      },
      0.17,
    ),
    Y("traffic_cone", -6.6, -12.2, 0, {
      seed: 35,
    }),
    Y("traffic_cone", -0.4, -12.3, 0, {
      seed: 36,
    }),
    i.tube(
      t("rubber"),
      [
        [1.7, 0.9, -11.9],
        [1.4, 0.4, -12.3],
        [1.2, 0.06, -13.2],
        [2.4, 0.055, -14],
        [1, 0.055, -14.9],
        [-0.8, 0.055, -14.4],
        [-1.6, 0.055, -15.6],
      ],
      0.018,
      {
        cast: !1,
      },
    ),
    s(U, 7.2, y, -14.6, 8.4, y + 0.04, -13.6),
    i.decal("oil_stain", 2.2, 7.6, y + 0.004, -15.2, "y+", 0.6),
    i.decal("oil_stain", 1.6, -3.8, y + 0.004, -13.6, "y+", 2.1),
    i.decal("hazard_voltage", 0.5, -1.25, 1.9, d - T - 0.142, "z-"),
    i.decal("caution_stripes", 2.4, -3.5, y + 0.004, -11.9, "y+", 0),
    {
      fan: ue,
      lights: P,
      skylights: X,
      relayPos: new Vector3(-2, y, -19.5),
      update(L) {
        ue.rotation.x += L * 1.7;
      },
    }
  );
}

export { ob, rb, no, ab };
