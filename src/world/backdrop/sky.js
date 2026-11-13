import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from "../../vendor/three-r180.js";
import { colorGeometry } from "../../core/geometry.js";
import { Bn, Ee, Ke, io, jt, ns, rl, so, uv, xt } from "./geometry.js";
import { mb, z1 } from "./cranes.js";

var dv = new Color(12172214);

var k1 = (i, e = 1) => {
  let t = new Color(i);
  return [(e * t.r) / dv.r, (e * t.g) / dv.g, (e * t.b) / dv.b];
};

var yb = [
  8200729, 8200729, 6957596, 2047846, 2047846, 2307146, 2906692, 2906692,
  11751962, 9062946, 5922920, 5922920, 4146764, 2055523, 10121752, 8093308,
  6962468, 6962468,
].map((i) => k1(i));

var L1 = [
  [0.6, 0.17, 0.13],
  [0.17, 0.29, 0.5],
  [0.2, 0.42, 0.3],
  [0.76, 0.35, 0.12],
  [0.78, 0.6, 0.16],
  [0.8, 0.81, 0.78],
  [0.4, 0.43, 0.47],
  [0.16, 0.42, 0.45],
  [0.55, 0.2, 0.15],
  [0.2, 0.3, 0.45],
];

var _b = (i, e, t) => {
  let n = Math.min(1, Math.max(0, (t - i) / (e - i)));
  return n * n * (3 - 2 * n);
};

var bb = (i, e) => 1 - 0.6 * _b(38, 160, Math.hypot(i + 5, e));

function Mb(i, e) {
  let t = new io(),
    n = so(i, "paint_white"),
    s = uv(90417),
    o = [5.5, 4.3, 2.9],
    r = [8, 0.45, 0.25],
    a = [0, 0, 0];
  function l(D, C, G, j, N = 1) {
    let Q = rl(C * 0.23 + 1.3, G * 0.31, j * 0.23 + 7.7),
      K = rl(C * 1.9 + 4.1, 2.2, j * 1.9 + 9.3),
      ie = N * (0.56 + 0.52 * Q) * (0.62 + 0.38 * _b(0, 5, G)),
      F = D[0] * ie,
      X = D[1] * ie,
      ne = D[2] * ie;
    if (K > 0.62) {
      let re = Math.min(1, (K - 0.62) / 0.3) * 0.55;
      ((F = F * (1 - re) + 0.3 * re * ie),
        (X = X * (1 - re) + 0.15 * re * ie),
        (ne = ne * (1 - re) + 0.08 * re * ie));
    }
    return ((a[0] = F), (a[1] = X), (a[2] = ne), a);
  }
  let c = (D, C) => {
      if (!D) return;
      if (Array.isArray(D)) {
        for (let Q of D) c(Q, C);
        return;
      }
      D.computeBoundingBox();
      let G = D.boundingBox,
        j = (G.min.x + G.max.x) / 2,
        N = (G.min.z + G.max.z) / 2;
      if (j < 31) {
        let Q = bb(j, N);
        (colorGeometry(D, (K, ie, F) => l(C, K, ie, F, Q)), t.add(n, D));
      } else t.add(n, D, C);
    },
    u = [],
    h = [],
    f = [],
    p = [];
  function d(D, C, G) {
    let j = D[1][0] - D[0][0],
      N = D[1][1] - D[0][1],
      Q = D[1][2] - D[0][2],
      K = D[3][0] - D[0][0],
      ie = D[3][1] - D[0][1],
      F = D[3][2] - D[0][2],
      X =
        (N * F - Q * ie) * C[0] +
          (Q * K - j * F) * C[1] +
          (j * ie - N * K) * C[2] <
        0;
    for (let ne of X ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]) {
      let re = D[ne];
      (u.push(re[0], re[1], re[2]),
        h.push(C[0], C[1], C[2]),
        p.push(G[ne][0], G[ne][1], G[ne][2]),
        Math.abs(C[0]) > 0.5
          ? f.push(re[2], re[1])
          : Math.abs(C[1]) > 0.5
            ? f.push(re[0], re[2])
            : f.push(re[0], re[1]));
    }
  }
  let v = [0.866, -0.5, 0],
    g = (D, C, G) => C.map((j) => l(D, j[0], j[1], j[2], G).slice());
  function x(D, C, G, j, N, Q, K, ie, F) {
    for (let X of ie) {
      let ne, re;
      X === "E"
        ? ((ne = [
            [j, C, Q],
            [j, C, G],
            [j, N, G],
            [j, N, Q],
          ]),
          (re = v))
        : X === "W"
          ? ((ne = [
              [D, C, G],
              [D, C, Q],
              [D, N, Q],
              [D, N, G],
            ]),
            (re = [-1, 0, 0]))
          : X === "S"
            ? ((ne = [
                [D, C, Q],
                [j, C, Q],
                [j, N, Q],
                [D, N, Q],
              ]),
              (re = [0, 0, 1]))
            : X === "N"
              ? ((ne = [
                  [j, C, G],
                  [D, C, G],
                  [D, N, G],
                  [j, N, G],
                ]),
                (re = [0, 0, -1]))
              : ((ne = [
                  [D, N, Q],
                  [j, N, Q],
                  [j, N, G],
                  [D, N, G],
                ]),
                (re = [0, 1, 0]));
      let $ = g(K, ne, X === "T" ? F * 0.8 : X === "E" ? F * 0.92 : F);
      if (C < 0.1 && X !== "T")
        for (let ue of [0, 1])
          (($[ue][0] *= 0.62), ($[ue][1] *= 0.62), ($[ue][2] *= 0.62));
      d(ne, re, $);
    }
  }
  function y(
    D,
    C,
    G,
    { faceZ: j = 0, ribs: N = !1, doorRows: Q = 0, west: K = !1 } = {},
  ) {
    let ie = Math.sign(G - C),
      F = [];
    for (let re = C, $ = 1; ie > 0 ? re < G : re > G; re += ie * 2.62, $++)
      $ % 8 >= 1 &&
        $ % 8 <= 5 &&
        F.push({
          z: re,
          blk: Math.floor($ / 8),
          first: $ === 1,
        });
    let X = F.map((re, $) =>
        D.map((ue, me) => {
          let ee = rl(ue * 0.04 + 3, 0.5, re.z * 0.05 + 7),
            B = Math.round(0.2 + ee * 5.4 + (s() - 0.5) * 2.4);
          return (
            !re.first && s() < 0.07 && (B = 0),
            Math.max(re.first ? 2 : 0, Math.min(5, B))
          );
        }),
      ),
      ne = (re, $) =>
        re >= 0 && re < F.length && $ >= 0 && $ < D.length ? X[re][$] : 0;
    F.forEach((re, $) =>
      D.forEach((ue, me) => {
        let ee = X[$][me],
          B = re.z,
          P = bb(ue, B),
          V = Math.max(Math.abs(ue + 5) - 40, Math.abs(B) - 30) < 55,
          Y = (L, Z) =>
            L >= 0 &&
            Z >= 0 &&
            L < D.length &&
            Z < D.length &&
            Math.abs(D[L] - D[Z]) < 12.8;
        for (let L = 0; L < ee; L++) {
          let Z = yb[Math.floor(s() * yb.length)],
            J = 0.6 + s() * 0.4,
            oe = [Z[0] * J, Z[1] * J, Z[2] * J],
            fe = (s() - 0.5) * 0.22,
            le = L * 2.6,
            R = ue - 6.095 + fe,
            I = ue + 6.095 + fe,
            se = B - 1.22,
            ae = B + 1.22,
            k = L === ee - 1 ? "T" : "";
          for (let Pe of j ? [j] : [-1, 1]) {
            let Re = $ + Pe * ie;
            (!(
              Re >= 0 &&
              Re < F.length &&
              F[Re].blk === re.blk &&
              Math.abs(F[Re].z - B) < 2.7
            ) ||
              ne(Re, me) <= L) &&
              (k += Pe > 0 ? "S" : "N");
          }
          let ce = !(Y(me - 1, me) && ne($, me - 1) > L),
            ve = !K && !(Y(me + 1, me) && ne($, me + 1) > L);
          (ce && (k += "E"),
            ve && (k += "W"),
            x(R, le, se, I, le + 2.59, ae, oe, k, P));
          let _e = [oe[0] * 0.45, oe[1] * 0.45, oe[2] * 0.45],
            Te = re.first
              ? j
                ? [j]
                : [-ie]
              : me === 0 && K && Math.abs(B) < 42
                ? [-1, 1].filter((Pe) => k.includes(Pe > 0 ? "S" : "N"))
                : [];
          if (N && V && Te.length) {
            let Pe = Te;
            for (let Re of Pe) {
              let Fe = Re > 0 ? ae : se,
                ze = Fe + Re * 0.04,
                We = le + 0.15,
                Ne = le + 2.45,
                dt = [oe[0] * 0.7, oe[1] * 0.7, oe[2] * 0.7];
              for (let xe = R + 0.24; xe < I - 0.3; xe += 0.575) {
                let Ie = [
                  [xe, We, Fe],
                  [xe + 0.07, We, ze],
                  [xe + 0.07, Ne, ze],
                  [xe, Ne, Fe],
                ];
                (d(Ie, [-0.5, 0, Re * 0.87], g(dt, Ie, P)),
                  (Ie = [
                    [xe + 0.07, We, ze],
                    [xe + 0.2, We, ze],
                    [xe + 0.2, Ne, ze],
                    [xe + 0.07, Ne, ze],
                  ]),
                  d(Ie, [0, 0, Re], g(oe, Ie, P)),
                  (Ie = [
                    [xe + 0.2, We, ze],
                    [xe + 0.27, We, Fe],
                    [xe + 0.27, Ne, Fe],
                    [xe + 0.2, Ne, ze],
                  ]),
                  d(Ie, [0.42, -0.52, Re * 0.74], g(dt, Ie, P)));
              }
              for (let [xe, Ie] of [
                [le, We],
                [Ne, le + 2.59],
              ]) {
                let Be = Fe + Re * 0.05,
                  Xe = [
                    [R, xe, Be],
                    [I, xe, Be],
                    [I, Ie, Be],
                    [R, Ie, Be],
                  ];
                (d(Xe, [0, 0, Re], g(_e, Xe, P)),
                  (Xe = [
                    [R, Ie, Fe],
                    [I, Ie, Fe],
                    [I, Ie, Be],
                    [R, Ie, Be],
                  ]),
                  d(Xe, [0, xe === le ? 1 : -1, 0], g(_e, Xe, P)));
              }
            }
          }
          if (ce && me === 0 && $ < Q) {
            let Pe = I + 0.03,
              Re = I + 0.055,
              Fe = le + 0.02,
              ze = le + 2.57,
              We = [oe[0] * 0.55, oe[1] * 0.55, oe[2] * 0.55],
              Ne = [0.34, 0.35, 0.36],
              dt = [0.05, 0.05, 0.055],
              xe = (Ie, Be, Xe, Me, we, be) => {
                let Oe = [
                    [Ie, Me, Xe],
                    [Ie, Me, Be],
                    [Ie, we, Be],
                    [Ie, we, Xe],
                  ],
                  pt = g(be, Oe, P);
                if (le < 0.1 && Me < 0.3)
                  for (let ut of [0, 1])
                    ((pt[ut][0] *= 0.62),
                      (pt[ut][1] *= 0.62),
                      (pt[ut][2] *= 0.62));
                d(Oe, v, pt);
              };
            (xe(Pe, se, se + 0.13, Fe, ze, We),
              xe(Pe, ae - 0.13, ae, Fe, ze, We),
              xe(Pe, se + 0.13, ae - 0.13, le, le + 0.15, We),
              xe(Pe, se + 0.13, ae - 0.13, le + 2.44, le + 2.59, We),
              xe(Pe, B - 0.018, B + 0.018, le + 0.15, le + 2.44, dt));
            for (let Ie of [-0.8, -0.32, 0.32, 0.8])
              if (
                (xe(Re, B + Ie - 0.024, B + Ie + 0.024, le + 0.1, le + 2.5, Ne),
                $ < 8)
              )
                for (let Be of [0.32, 2.2])
                  xe(
                    Re + 0.01,
                    B + Ie - 0.07,
                    B + Ie + 0.07,
                    le + Be,
                    le + Be + 0.09,
                    Ne,
                  );
            if ($ < 8)
              for (let Ie of [-0.56, 0.56])
                xe(
                  Re + 0.01,
                  B + Ie - 0.1,
                  B + Ie + 0.1,
                  le + 1.02,
                  le + 1.1,
                  Ne,
                );
          }
        }
      }),
    );
  }
  let b = [-48.6, -61.2, -73.8, -90.5, -103.1, -115.7, -132, -144.6],
    m = [6.3, -6.3, -18.9, -31.5];
  (y(b, -4.9, -112, {
    ribs: !0,
    doorRows: 15,
    west: !0,
  }),
    y(b, 14.9, 112, {
      ribs: !0,
      doorRows: 15,
      west: !0,
    }),
    y(m, -36.4, -110, {
      faceZ: 1,
      ribs: !0,
      doorRows: 12,
    }),
    y(m, 33.9, 110, {
      faceZ: -1,
      ribs: !0,
      doorRows: 12,
    }));
  {
    let D = new BufferGeometry();
    (D.setAttribute("position", new Float32BufferAttribute(u, 3)),
      D.setAttribute("normal", new Float32BufferAttribute(h, 3)),
      D.setAttribute("uv", new Float32BufferAttribute(f, 2)),
      D.setAttribute("color", new Float32BufferAttribute(p, 3)),
      t.add(n, D));
  }
  let A = k1(5922920, 0.85),
    _ = [0.1, 0.1, 0.11],
    M = [0.36, 0.38, 0.4],
    E = k1(12159516, 0.5),
    w = [0.5, 0.5, 0.48];
  function S(D, C, G, j, N) {
    let K = G,
      ie = [K[0] * 0.7, K[1] * 0.7, K[2] * 0.7];
    for (let ne of [-1, 1]) {
      let re = C + ne * 9.5;
      for (let $ of [-1, 1]) {
        let ue = D + $ * 7.5;
        (c(Ee(ue - 1.5, 0.05, re - 0.28, ue + 1.5, 0.8, re + 0.28), _),
          c(Ee(ue - 0.36, 0.8, re - 0.36, ue + 0.36, 19.1, re + 0.36), K),
          c(Ee(ue - 0.4, 6.9, re - 0.4, ue + 0.4, 7, re + 0.4), ie),
          c(Ee(ue - 0.4, 13, re - 0.4, ue + 0.4, 13.1, re + 0.4), ie),
          c(jt([ue, 14.6, re], [ue - $ * 3.2, 19.1, re], 0.3, 0.3), K));
      }
      (c(Ee(D - 9.3, 0.8, re - 0.4, D + 9.3, 1.7, re + 0.4), K),
        c(Ee(D - 8, 19.1, re - 0.45, D + 8, 20.2, re + 0.45), K),
        c(Ee(D - 2.4, 1.7, re - 0.5, D + 0.8, 3.9, re + 0.5), w));
    }
    for (let ne of [-1, 1]) {
      let re = D + ne * 3.3,
        $ = C - 9.5 - 5.6,
        ue = C + 9.5 + 5.6;
      c(Ee(re - 0.45, 20.2, $, re + 0.45, 21.9, ue), K);
      for (let me = $ + 4.4; me < ue; me += 4.4)
        c(Ee(re - 0.48, 20.15, me - 0.03, re + 0.48, 21.95, me + 0.03), ie);
      (c(Ee(re + ne * 0.45, 21, $, re + ne * 1.3, 21.05, ue), M),
        ns(
          z,
          null,
          [
            [re + ne * 1.27, 21.05, $],
            [re + ne * 1.27, 21.05, ue],
          ],
          {
            post: 3.3,
            r: 0.035,
            mid: !1,
            tint: E,
          },
        ),
        c(
          Ke([re, 20.2, C - 9.5 + 0.5], [re, 20.2, C + 9.5 - 0.5], 0.05, 4),
          _,
        ));
    }
    for (let ne of [C - 9.5 - 5.4, C + 9.5 + 5.4])
      c(Ee(D - 3.3, 20.4, ne - 0.25, D + 3.3, 21.7, ne + 0.25), K);
    let F = C + j;
    (c(Ee(D - 4, 21.9, F - 2.3, D + 4, 22.5, F + 2.3), E),
      c(Ee(D - 2.6, 22.5, F - 1.7, D + 1.4, 24.5, F + 1.7), w),
      c(Ee(D + 1.8, 22.5, F - 0.9, D + 3.4, 23.3, F + 0.9), _),
      c(Ee(D + 4.3, 17.2, F - 1, D + 6.1, 19.5, F + 1), w),
      c(
        Ee(D + 4.4, 18.2, F - 1.02, D + 6.12, 19.2, F + 1.02),
        [0.08, 0.1, 0.12],
      ));
    for (let ne of [-0.9, 0.9])
      c(Ee(D + 4.9, 19.5, F + ne - 0.06, D + 5.05, 21.9, F + ne + 0.06), E);
    let X = 21.9 - N;
    for (let ne of [-2.2, 2.2])
      for (let re of [-0.8, 0.8])
        c(Ke([D + ne, 21.9, F + re], [D + ne, X, F + re], 0.03, 4), _);
    (c(Ee(D - 6.1, X - 0.4, F - 1.22, D + 6.1, X, F + 1.22), E),
      c(Ee(D - 2.4, X, F - 0.9, D + 2.4, X + 0.5, F + 0.9), E));
    {
      let ne = D - 7.5 - 0.5,
        re = C - 9.5,
        $ = 1.7;
      for (let ue = 0; ue < 6; ue++) {
        let me = re + (ue % 2 ? 1.9 : -1.9),
          ee = re + (ue % 2 ? -1.9 : 1.9),
          B = Math.min(20.2, $ + 3.1);
        (c(jt([ne, $, me], [ne, B, ee], 0.6, 0.07), M),
          c(Ke([ne - 0.3, $ + 1, me], [ne - 0.3, B + 1, ee], 0.03, 4), E),
          c(Ee(ne - 0.35, B - 0.04, ee - 0.5, ne + 0.35, B, ee + 0.5), M),
          ($ = B));
      }
      for (let ue of [-2.4, 2.4])
        c(
          Ee(ne - 0.3, 1.7, re + ue - 0.05, ne - 0.2, 20.2, re + ue + 0.05),
          ie,
        );
      (c(xt(1.25, 1.25, 0.5, "z", D + 7.5 + 1, 3.3, C + 9.5 + 0.9, 12), E),
        c(xt(0.5, 0.5, 0.6, "z", D + 7.5 + 1, 3.3, C + 9.5 + 0.9, 8), _));
      for (let ue of [-0.2, 0.2])
        c(
          Ke(
            [D + 7.5 + 0.45, 1.7, C - 9.5 + ue],
            [D + 7.5 + 0.45, 20.2, C - 9.5 + ue],
            0.022,
            4,
          ),
          M,
        );
    }
    (e.add(Bn(D, 24.9, F, 0.3), r, 3.1, s(), 0.4),
      e.add(Bn(D - 3.3, 20, C - 4, 0.24), o, 0),
      e.add(Bn(D + 3.3, 20, C + 4, 0.24), o, 0));
  }
  let z = {
      add: (D, C, G) => c(C, G),
    },
    H = k1(6172444, 0.7);
  (S(-61, -52.06, A, -3, 4.5),
    S(-61, 41.1, H, 5, 9),
    S(-103, -10.14, H, 2, 3),
    S(-6, -62.6, A, -6, 7),
    S(-12, 60.1, A, 4, 5));
  for (let [D, C, G] of [
    [-67.5, -22, 32],
    [-67.5, 31, 32],
    [-122, 4, 34],
    [-12.6, -53, 30],
    [-12.6, 51, 30],
    [-140, -84, 34],
    [-96, 96, 34],
    [0.2, -100, 30],
    [-52, -70, 28],
    [-55, 72, 28],
    [-84, -45, 34],
    [-84, 24, 34],
    [-25, -84, 30],
    [-28, 90, 30],
    [-120, 60, 34],
    [10.5, 49, 26],
  ]) {
    (c(xt(0.14, 0.3, G, "y", D, G / 2, C, 6), M),
      c(xt(1.5, 1.5, 0.18, "y", D, G - 0.5, C, 8), _));
    for (let [j, N] of [
      [-1.4, 0],
      [1.4, 0],
      [0, -1.4],
      [0, 1.4],
    ])
      (c(
        Ee(
          D + j - 0.25,
          G - 0.95,
          C + N - 0.25,
          D + j + 0.25,
          G - 0.6,
          C + N + 0.25,
        ),
        _,
      ),
        e.add(Bn(D + j, G - 1.05, C + N, 0.2), o, 0));
  }
  for (let [D, C, G] of [
    [-158, -30, 62],
    [-76, -128, 48],
    [-150, 104, 54],
  ]) {
    let N = [
      [-1.1, -0.638],
      [1.1, -0.638],
      [0, 1.265],
    ];
    for (let [Q, K] of N)
      c(
        Ke([D + Q, 0, C + K], [D + Q * 0.3, G, C + K * 0.3], 0.07, 4),
        [0.42, 0.14, 0.1],
      );
    for (let Q = 3, K = 0; Q < G; Q += 6, K++)
      for (let ie = 0; ie < 3; ie++) {
        let F = N[ie],
          X = N[(ie + 1) % 3],
          ne = 1 - (0.7 * Q) / G,
          re = 1 - (0.7 * Math.min(G, Q + 6)) / G;
        c(
          Ke(
            [D + F[0] * ne, Q, C + F[1] * ne],
            [D + X[0] * re, Math.min(G, Q + 6), C + X[1] * re],
            0.04,
            3,
          ),
          K % 2 ? w : [0.42, 0.14, 0.1],
        );
      }
    for (let Q of [0.5, 2.6, 4.7])
      c(
        Ke(
          [D, G * 0.72, C],
          [D + Math.cos(Q) * G * 0.5, 0, C + Math.sin(Q) * G * 0.5],
          0.025,
          3,
        ),
        _,
      );
    (c(Ke([D, G, C], [D, G + 5, C], 0.04, 3), _),
      c(Ee(D - 0.9, G * 0.8, C - 0.25, D + 0.9, G * 0.8 + 1.6, C + 0.25), w),
      e.add(Bn(D, G + 0.4, C, 0.35), r, 2.4, s(), 0.45),
      e.add(Bn(D, G * 0.55, C, 0.28), r, 0));
  }
  for (let [D, C, G] of [
    [-178, -70, 90],
    [-182, 40, 110],
    [-60, -150, 70],
    [-70, 150, 80],
  ]) {
    let j = Math.abs(C) > 120,
      N = (Q, K, ie, F, X, ne, re) =>
        c(
          j
            ? Ee(D + Q, K, C + ie, D + F, X, C + ne)
            : Ee(D + ie, K, C + Q, D + ne, X, C + F),
          re,
        );
    (N(-G / 2, 0, -16, G / 2, 9.5, 16, [0.2, 0.22, 0.24]),
      N(-G / 2, 9.5, -16.4, G / 2, 9.9, 16.4, [0.12, 0.12, 0.13]),
      N(-G / 2, 9.9, -10, G / 2, 12.2, 10, [0.17, 0.18, 0.2]),
      N(-G / 2 + 4, 12.2, -1.2, G / 2 - 4, 13.3, 1.2, [0.13, 0.13, 0.14]));
    for (let Q = -G / 2 + 6; Q < G / 2 - 5; Q += 12)
      (N(Q - 0.25, 0, -16.2, Q + 0.25, 9.5, 16.2, [0.13, 0.14, 0.15]),
        (Q | 0) % 3 === 0 &&
          N(Q + 2, 0, -16.1, Q + 8, 6.2, 16.1, [0.06, 0.06, 0.07]));
  }
  (z1(i, e, {
    into: t,
    mat: n,
    dz: 66,
  }),
    [
      [-132, 1.15, !0, [0.14, 0.17, 0.21]],
      [-186, 1.25, !1, [0.14, 0.17, 0.21]],
      [-252, 1.35, !0, [0.26, 0.12, 0.06]],
      [-336, 1.4, !1, [0.26, 0.12, 0.06]],
      [128, 1.2, !1, [0.14, 0.17, 0.21]],
      [182, 1.3, !0, [0.24, 0.25, 0.27]],
      [250, 1.4, !1, [0.24, 0.25, 0.27]],
      [330, 1.45, !0, [0.26, 0.12, 0.06]],
    ].forEach(([D, C, G, j], N) => {
      let Q = mb(t, n, 23.5, D, {
        s: C,
        up: G,
        tint: j,
      });
      e.add(
        Bn(Q[0], Q[1], Q[2], 0.45 * C),
        r,
        2.6 + (N % 3) * 0.35,
        N * 0.37,
        0.45,
      );
    }),
    c(Ee(-230, -1.6, -384, 30, -0.12, 425), [0.24, 0.24, 0.25]));
  function q(D, C, G, j, N, Q, K) {
    (c(Ee(D, -1.6, G, C, N, j), Q),
      c(Ee(D, -1.6, G, C, 0.8, j + 0.2), [0.42, 0.14, 0.1]));
    let ie = j - G,
      F = G + ie * K;
    (c(Ee(D + 2, N, F - 7, C - 2, N + 17, F + 7), [0.72, 0.73, 0.7]),
      c(
        Ee((D + C) / 2 - 3, N + 17, F - 5, (D + C) / 2 + 3, N + 24, F + 1),
        [0.2, 0.3, 0.45],
      ));
    for (let X = G + 12; X < j - 12; X += 13.2) {
      if (Math.abs(X + 6 - F) < 14) continue;
      let ne = 2.6 * (2 + Math.floor(s() * 4)),
        re = L1[Math.floor(s() * L1.length)];
      c(Ee(D + 1, N, X, (D + C) / 2 - 0.2, N + ne, X + 12.2), re);
      let $ = L1[Math.floor(s() * L1.length)];
      c(
        Ee(
          (D + C) / 2 + 0.2,
          N,
          X,
          C - 1,
          N + ne - 2.6 * Math.floor(s() * 2),
          X + 12.2,
        ),
        $,
      );
    }
    e.add(Bn((D + C) / 2, N + 26, F, 0.4), [5, 4.6, 3.8], 0);
  }
  (q(34, 62, 140, 345, 11, [0.1, 0.13, 0.2], 0.78),
    q(34, 58, -360, -205, 10, [0.2, 0.08, 0.07], 0.2),
    q(470, 500, -190, -40, 9, [0.12, 0.14, 0.17], 0.8),
    q(600, 626, 160, 300, 9, [0.16, 0.12, 0.1], 0.2));
  for (let D = 340; D > -66; D -= 12.5) {
    let C = 398 + Math.sin(D * 0.013) * 14 + (s() - 0.5) * 3,
      G = Ee(-6 - s() * 2, -1.6, -7, 6 + s() * 2, 2.2 + s() * 1.2, 7);
    (G.rotateY((s() - 0.5) * 0.5),
      G.translate(C, 0, D),
      c(G, [0.2, 0.21, 0.22]));
  }
  {
    (c(xt(5, 6, 3.6, "y", 399, 0.2, -72, 10), [0.3, 0.3, 0.3]),
      c(xt(1.7, 2.3, 6, "y", 399, 5, -72, 10), [0.85, 0.85, 0.82]),
      c(xt(1.5, 1.7, 4, "y", 399, 10, -72, 10), [0.62, 0.14, 0.1]),
      c(xt(1.3, 1.5, 4, "y", 399, 14, -72, 10), [0.85, 0.85, 0.82]),
      c(xt(2, 2, 0.3, "y", 399, 16.1, -72, 10), [0.3, 0.3, 0.32]),
      c(xt(0.2, 1.3, 1.2, "y", 399, 18.9, -72, 8), [0.25, 0.25, 0.27]));
    for (let G = 0; G < 6; G++) {
      let j = (G / 6) * 6.283;
      c(
        Ee(
          399 + Math.cos(j) * 1.1 - 0.06,
          16.2,
          -72 + Math.sin(j) * 1.1 - 0.06,
          399 + Math.cos(j) * 1.1 + 0.06,
          18.3,
          -72 + Math.sin(j) * 1.1 + 0.06,
        ),
        [0.25, 0.25, 0.27],
      );
    }
    e.add(Bn(399, 17.25, -72, 0.85), [16, 15, 11], 6, 0, 0.09);
  }
  let U = 300;
  c(Ee(U - 330, -1.6, -520, U + 330, 2.2, -430), [0.16, 0.17, 0.18]);
  for (let [D, C, G, j] of [
    [-150, -452, 17, 15],
    [-112, -458, 17, 15],
    [-76, -450, 13, 18],
    [20, -455, 20, 14],
    [64, -462, 20, 14],
    [104, -452, 14, 19],
    [136, -462, 14, 19],
    [210, -456, 22, 12],
  ])
    (c(xt(G, G, j, "y", U + D, 2.2 + j / 2, C, 14), [0.62, 0.63, 0.62]),
      c(
        xt(G * 0.2, G, j * 0.12, "y", U + D, 2.2 + j * 1.06, C, 14),
        [0.52, 0.53, 0.53],
      ));
  for (let [D, C, G, j] of [
    [-32, -470, 96, 3.2],
    [168, -475, 70, 2.6],
  ]) {
    c(xt(j * 0.62, j, G, "y", U + D, 2.2 + G / 2, C, 10), [0.5, 0.5, 0.5]);
    for (let N of [0.82, 0.94])
      c(
        xt(j * 0.66, j * 0.7, G * 0.05, "y", U + D, 2.2 + G * N, C, 10),
        [0.6, 0.15, 0.1],
      );
    (e.add(Bn(U + D, 3.2 + G, C, 0.9), r, 2.2, s(), 0.5),
      e.add(Bn(U + D + j, 2.2 + G * 0.55, C, 0.7), r, 2.2, s(), 0.5));
  }
  for (let [D, C, G, j, N] of [
    [-230, -455, 70, 16, 30],
    [-10, -445, 30, 22, 18],
    [0, -452, 8, 44, 8],
    [-18, -450, 5, 36, 5],
    [270, -450, 60, 12, 30],
    [150, -448, 26, 28, 14],
  ])
    c(
      Ee(U + D - G / 2, 2.2, C - N / 2, U + D + G / 2, 2.2 + j, C + N / 2),
      [0.34, 0.36, 0.38],
    );
  for (let D = 0; D < 26; D++)
    e.add(
      Bn(U - 300 + s() * 600, 6 + s() * 26, -436 + s() * 6, 0.55),
      s() > 0.3 ? o : [3, 3.4, 3.8],
      0,
    );
  let T = t.build({
    cast: !1,
    recv: !1,
  });
  return (
    (T.name = "skyline"),
    {
      root: T,
      tris: t.tris,
    }
  );
}

function wb(i, e, t = 12) {
  let n = uv(5521),
    s = [],
    o = [],
    r = [];
  for (let u = 0; u < t; u++) {
    let f =
        u % 3 === 0
          ? [54 + n() * 30, 9 + n() * 14, -4 + n() * 56]
          : [16 + n() * 26, 33 + n() * 12, -14 + n() * 28],
      p = 9 + n() * 16,
      d = (0.16 + n() * 0.16) * (n() > 0.5 ? 1 : -1),
      v = n() * 6.283,
      g = 5 + n() * 3,
      x = [
        [0.15, 0, 0, 0],
        [-0.13, 0, 0, 0],
        [-0.24, 0, 0.8, 1],
        [0.15, 0, 0, 0],
        [-0.24, 0, -0.8, 1],
        [-0.13, 0, 0, 0],
      ];
    for (let y of x)
      (s.push(y[0], y[1] - 60, y[2]),
        o.push(f[0], f[1], f[2], p),
        r.push(d, v, g, y[3]));
  }
  let a = new BufferGeometry();
  (a.setAttribute("position", new Float32BufferAttribute(s, 3)),
    a.setAttribute("aOrbit", new Float32BufferAttribute(o, 4)),
    a.setAttribute("aPar", new Float32BufferAttribute(r, 4)));
  let l = new MeshBasicMaterial({
    color: new Color(0.2, 0.21, 0.23),
    side: DoubleSide,
    fog: !1,
  });
  ((l.onBeforeCompile = (u) => {
    ((u.uniforms.uTime = e),
      (u.vertexShader =
        `attribute vec4 aOrbit;
attribute vec4 aPar;
uniform float uTime;
` +
        u.vertexShader.replace(
          "#include <begin_vertex>",
          `
      float ga = aPar.y + uTime * aPar.x;
      float gdir = sign(aPar.x);
      vec3 gfw = vec3(-sin(ga), 0.0, cos(ga)) * gdir;
      vec3 grt = vec3(gfw.z, 0.0, -gfw.x);
      vec3 gl = position + vec3(0.0, 60.0, 0.0);
      float glide = smoothstep(-0.2, 0.5, sin(uTime * 0.31 + aPar.y * 3.0));
      float gflap = sin(uTime * aPar.z + aPar.y * 7.0) * mix(0.12, 0.55, glide) + 0.18;
      gl.y += aPar.w * gflap * abs(gl.z);
      gl.z *= mix(1.0, 0.86, aPar.w * abs(gflap));
      vec3 gc = aOrbit.xyz + vec3(cos(ga), 0.0, sin(ga)) * aOrbit.w + vec3(0.0, sin(ga * 0.7 + aPar.y) * 2.2 + sin(uTime * 0.23 + aPar.y) * 1.5, 0.0);
      vec3 transformed = gc + gfw * gl.x + grt * gl.z + vec3(0.0, gl.y - 0.3 * gdir * gl.z, 0.0);`,
        )));
  }),
    (l.customProgramCacheKey = () => "saltline-gulls"));
  let c = new Mesh(a, l);
  return (
    (c.frustumCulled = !1),
    (c.castShadow = !1),
    (c.receiveShadow = !1),
    (c.name = "gulls"),
    c
  );
}

export { Mb, wb };
