import { THREE } from "../../vendor/three-r180.js";
import { boxGeometry, tubeGeometry } from "../../core/geometry.js";
import {
  At,
  Ge,
  Kn,
  M1,
  eo,
  ev,
  gn,
  gr,
  to,
  tt,
  vr,
  zi,
} from "./detail-geometry.js";
import { S1 } from "./detailed-builders.js";

var Q3 = (i, e, t) => {
  let n = zi((t - i) / (e - i), 0, 1);
  return n * n * (3 - 2 * n);
};

function nv(i, e, t = 0, n = 0) {
  let s = new THREE.PlaneGeometry(i, e),
    o = s.attributes.uv,
    r = s.attributes.position;
  for (let a = 0; a < o.count; a++) o.setXY(a, r.getX(a) + t, r.getY(a) + n);
  return s;
}

function QA(i, e) {
  let t = new Kn(i, "tarp_cargo", e.seed || 0),
    n = t.rng,
    s = t.seed * 1.7,
    o = 0.144,
    r = [
      [-1.06, -0.12, -0.58, 0.58, n.range(0.98, 1.12)],
      [-0.06, 1.06, -0.58, 0.12, n.range(1.32, 1.42)],
      [0.02, 0.62, 0.16, 0.58, n.range(0.72, 0.86)],
      [0.66, 1.06, 0.18, 0.56, n.range(0.5, 0.62)],
    ];
  for (let N of [-0.6, 0.6])
    (t.push({
      p: [N, 0, 0],
      r: [0, 0, 0],
    }),
      S1(t, n, {
        stamp: !1,
      }),
      t.pop());
  for (let N of r) {
    let Q = N[1] - N[0],
      K = N[3] - N[2],
      ie = N[4] - o,
      F = (N[0] + N[1]) / 2,
      X = (N[2] + N[3]) / 2,
      ne = n.range(0.7, 0.95);
    (t.add(
      "wood_pallet",
      Ge(Q, ie, K, 0.006),
      {
        p: [F, o + ie / 2, X],
      },
      [ne, ne * 0.95, ne * 0.88],
    ),
      t.add(
        "wood_pallet",
        boxGeometry(Q + 0.012, 0.07, K + 0.012),
        {
          p: [F, o + 0.04, X],
        },
        ne * 0.75,
      ));
  }
  let a = 1.9,
    l = 22,
    c = 14,
    u = -1.125,
    h = 1.125,
    f = -0.645,
    p = 0.645,
    d = 5,
    v = (N, Q) => {
      let K = 0.3;
      for (let ie of r) {
        let F = Math.max(ie[0] - N, 0, N - ie[1]),
          X = Math.max(ie[2] - Q, 0, Q - ie[3]),
          ne = Math.hypot(F, X);
        K = Math.max(K, ie[4] - 0.95 * ne - 0.9 * ne * ne);
      }
      return (
        K +
        0.016 +
        0.022 * gn(N * 5 + s, Q * 5) +
        0.008 * Math.sin(N * 23 + Q * 7 + s) +
        0.006 * Math.sin(Q * 31 - N * 5)
      );
    },
    g = [],
    x = [],
    y = [],
    b = (N, Q) => Q * (l + 1) + N;
  for (let N = 0; N <= c; N++)
    for (let Q = 0; Q <= l; Q++) {
      let K = u + ((h - u) * Q) / l,
        ie = f + ((p - f) * N) / c;
      (g.push(K, v(K, ie), ie), x.push(K * a, ie * a));
    }
  for (let N = 0; N < c; N++)
    for (let Q = 0; Q < l; Q++) {
      let K = b(Q, N),
        ie = b(Q + 1, N),
        F = b(Q + 1, N + 1),
        X = b(Q, N + 1);
      y.push(K, X, ie, ie, X, F);
    }
  let m = [];
  for (let N = 0; N < l; N++) m.push([N, 0, 0, -1]);
  for (let N = 0; N < c; N++) m.push([l, N, 1, 0]);
  for (let N = l; N > 0; N--) m.push([N, c, 0, 1]);
  for (let N = c; N > 0; N--) m.push([0, N, -1, 0]);
  let A = m.length,
    _ = (l + 1) * (c + 1),
    M = new Map(),
    E = n() * A;
  m.forEach((N, Q) => {
    M.set(N[0] + "," + N[1], Q);
    let K = (N[0] === 0 || N[0] === l) && (N[1] === 0 || N[1] === c),
      ie = N[2],
      F = N[3];
    K &&
      ((ie = N[0] === 0 ? -0.707 : 0.707), (F = N[1] === 0 ? -0.707 : 0.707));
    let X = b(N[0], N[1]),
      ne = g[X * 3],
      re = g[X * 3 + 1],
      $ = g[X * 3 + 2],
      ue = Math.abs(Q - E);
    ue = Math.min(ue, A - ue);
    let me =
        0.17 +
        0.07 * Math.sin(Q * 0.55 + s) +
        0.07 * gn(Q * 0.31 + s, 2.2) +
        0.3 * Math.exp((-ue * ue) / 14),
      ee = n() * 6;
    for (let B = 1; B <= d; B++) {
      let P = B / d,
        V = re + (me - re) * (0.25 * P + 0.75 * P * P) - (B === 1 ? 0.02 : 0),
        Y =
          (N[0] === 5 || N[0] === 16) && N[2] === 0
            ? 0.035 * Math.sin(Math.PI * P)
            : 0,
        L =
          P *
            (0.04 * Math.sin(Q * 1.7 + ee * 0.2) +
              0.028 * Math.sin(Q * 0.83 + 1.3 + s)) +
          0.02 * P * gn(Q * 0.8, B * 0.9 + s) -
          Y,
        Z = (B === 1 ? 0.028 : 0.04 + 0.03 * P) + L + (K ? 0.012 * P : 0),
        J = zi(ne + ie * Z, -1.2, 1.2),
        oe = zi($ + F * Z, -0.7, 0.7),
        fe = re - V;
      (g.push(J, V, oe),
        x.push((ne + ie * (Z + fe)) * a, ($ + F * (Z + fe)) * a));
    }
  });
  let w = (N, Q) => (Q === 0 ? b(m[N][0], m[N][1]) : _ + N * d + (Q - 1));
  for (let N = 0; N < A; N++)
    for (let Q = 0; Q < d; Q++) {
      let K = (N + 1) % A,
        ie = w(N, Q),
        F = w(K, Q),
        X = w(K, Q + 1),
        ne = w(N, Q + 1);
      y.push(ie, F, ne, F, X, ne);
    }
  let S = new THREE.BufferGeometry();
  (S.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(g), 3),
  ),
    S.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(x), 2)),
    S.setIndex(y),
    S.computeVertexNormals());
  let z = S.attributes.normal,
    H = S.attributes.position,
    O = (N, Q) => [
      H.getX(N) + z.getX(N) * Q,
      H.getY(N) + z.getY(N) * Q,
      H.getZ(N) + z.getZ(N) * Q,
    ],
    q = [];
  for (let N of [5, 16]) {
    let Q = [],
      K = M.get(N + ",0"),
      ie = M.get(N + "," + c);
    Q.push([H.getX(w(K, d)), 0.11, -0.52]);
    for (let F = d; F >= 1; F--) Q.push(O(w(K, F), 0.007));
    for (let F = 0; F <= c; F++) Q.push(O(b(N, F), 0.007));
    for (let F = 1; F <= d; F++) Q.push(O(w(ie, F), 0.007));
    (Q.push([H.getX(w(ie, d)), 0.11, 0.52]), q.push(Q));
  }
  let U = 6,
    T = [],
    D = M.get("0," + U),
    C = M.get(l + "," + U);
  T.push([-1.1, 0.1, H.getZ(w(D, d))]);
  for (let N = d; N >= 1; N -= 2) T.push(O(w(D, N), 0.012));
  for (let N = 0; N <= l; N += 2) T.push(O(b(N, U), 0.012));
  for (let N = 1; N <= d; N += 2) T.push(O(w(C, N), 0.012));
  (T.push([1.1, 0.1, H.getZ(w(C, d))]),
    t.add(
      t.mat("tarp", {
        doubleSide: !0,
      }),
      S,
      null,
      (N, Q, K) => {
        let ie = gn(N * 2.3 + s, Q * 2.3, K * 2.3),
          F = gn(N * 11, Q * 11, K * 11 + s);
        return (
          (0.72 + 0.28 * ie) * (0.9 + 0.1 * F) * (0.8 + 0.2 * Q3(0.15, 0.6, Q))
        );
      },
    ));
  for (let N of q) {
    t.add("paint_orange", vr(N, [0.024, 0, 0]), null, [1, 0.82, 0.5]);
    let Q = N[N.length - 4];
    (t.add(
      "steel_worn",
      Ge(0.065, 0.1, 0.03, 0.006),
      {
        p: [Q[0], Q[1], Q[2] + 0.014],
        r: [0.25, 0, 0],
      },
      0.8,
    ),
      t.add(
        "steel_dark",
        Ge(0.02, 0.09, 0.012, 0.003),
        {
          p: [Q[0] + 0.03, Q[1] + 0.06, Q[2] + 0.04],
          r: [0.9, 0, 0],
        },
        0.8,
      ));
  }
  t.add("rope", tubeGeometry(T, 0.009, 4, !1, 0.5), null, 0.85);
  let G = [2.4, 1.5, 1.4],
    j = Math.max(...r.map((N) => N[4])) + 0.04;
  return t.finish({
    size: G,
    colliders: [
      {
        min: [-1.2, 0, -0.7],
        max: [1.2, j, 0.7],
        surface: "dirt",
      },
    ],
  });
}

function eR(i, e, t, n) {
  let s = ev(eo(i, e, t, Math.min(e * 0.46, 0.075), 3, 3, 3), 3),
    o = n() * 9,
    r = n.range(-0.05, 0.05),
    a = n.range(0.4, 1);
  return (
    to(s, (l) => {
      let c = l.x / (i / 2),
        u = l.z / (t / 2),
        h = l.y / (e / 2),
        f = 1 - 0.22 * Math.pow(Math.abs(c), 2.5);
      ((l.z *= f * (h < 0 ? 1.05 : 1)),
        (l.y = (l.y + e / 2) * (1 - 0.3 * Math.pow(Math.abs(c), 3)) - e / 2),
        h > 0 && (l.y += 0.016 * Math.cos(tt * c) * Math.cos(tt * u)),
        (l.y -=
          a * 0.018 * Math.abs(c) * Math.abs(c) * (h > -0.9 ? 1 : 0) +
          r * l.x * 0.3));
      let p = gn(l.x * 9 + o, l.y * 9, l.z * 9 + o) - 0.5;
      ((l.x += p * 0.014), (l.z += p * 0.016), h > -0.9 && (l.y += p * 0.014));
    }),
    gr(s)
  );
}

function tR(i, e) {
  let t = new Kn(i, "sandbags", e.seed || 0),
    n = t.rng,
    s = 0.18,
    o = zi(e.courses | 0 || 5, 1, 7),
    r = t.mat(K3[0], K3[1]),
    a = (l, c, u, h) => {
      let f = s * n.range(1.02, 1.12),
        p = n() < 0.3 ? n.range(0.55, 0.75) : n.range(0.82, 1),
        d = n() * 30,
        v = {
          p: [
            u[0] + n.range(-0.012, 0.012),
            u[1] + f / 2 - 0.004,
            u[2] + n.range(-0.012, 0.012),
          ],
          r: [n.range(-0.03, 0.03), h + n.range(-0.06, 0.06), 0],
        };
      t.add(r, eR(l, f, c, n), v, (g, x, y) => {
        let b = gn(g * 7 + d, x * 7, y * 7);
        return [
          p * (0.85 + 0.15 * b),
          p * (0.84 + 0.15 * b),
          p * (0.8 + 0.16 * b),
        ];
      });
      for (let g of [1, -1])
        t.add(
          r,
          vr(
            [
              [g * (l / 2 - 0.004), n.range(-0.008, 0.008), -c * 0.27],
              [g * (l / 2 - 0.002), n.range(-0.008, 0.008), c * 0.27],
            ],
            [g * 0.009, 0.001, 0],
          ),
          v,
          p * 0.9,
        );
    };
  for (let l = 0; l < o; l++) {
    let c = l * s,
      u = l === o - 1;
    if (l % 2 === 0)
      for (let h = 0; h < 3; h++)
        for (let f of [1, -1])
          (u && h === 2 && f === 1 && o > 2) ||
            a(0.655, 0.3, [(h - 1) * 0.655, c, f * 0.148], 0);
    else
      for (let h = 0; h < 5; h++)
        (u && h === 0 && o > 2) || a(0.585, 0.385, [(h - 2) * 0.392, c, 0], tt);
  }
  return t.finish({
    size: [2, o * s, 0.6],
    surface: "dirt",
  });
}

var K3 = [
  "glove_fabric",
  {
    color: 9207134,
  },
];

function Oc(
  i,
  e,
  t,
  n,
  s,
  {
    crush: o = 0,
    damp: r = 0.3,
    open: a = !1,
    tape: l = !0,
    label: c = "",
    arrow: u = !1,
    tint: h = 1,
  } = {},
) {
  let f = i.rng,
    p = i.G,
    d = f() * 40;
  i.push(s);
  let v = (_) => {
      if (!o) return;
      let M = zi(_.y / t, 0, 1),
        E = M * M;
      ((_.y -=
        o *
        t *
        0.32 *
        E *
        (0.55 + 0.45 * Math.cos(((At * _.x) / e) * 0.9 + 0.5)) *
        (0.8 + 0.2 * Math.cos((At * _.z) / n))),
        (_.z *= 1 + 0.1 * o * Math.sin(At * M)),
        (_.x +=
          0.12 * o * t * M + 0.02 * o * Math.sin(At * M) * Math.sign(_.x)));
    },
    g = eo(e, t, n, 0.007, 4, 5, 4, "bottom");
  (a && ev(g, 2), o && (to(g, v), gr(g)));
  let x = r * t,
    y = (_, M, E) => {
      let w = gn(_ * 6 + d, M * 3, E * 6 + d),
        S = Q3(x - 0.03, x + 0.04, M + 0.08 * (w - 0.5)),
        z = (0.86 + 0.14 * gn(_ * 13, M * 13 + d, E * 13)) * h;
      return [
        z * (0.5 + 0.5 * S),
        z * (0.47 + 0.53 * S),
        z * (0.42 + 0.58 * S),
      ];
    };
  {
    let _ = g.attributes.position,
      M = new Float32Array(_.count * 3);
    for (let E = 0; E < _.count; E++) {
      let w = y(_.getX(E), _.getY(E), _.getZ(E));
      ((M[E * 3] = w[0]), (M[E * 3 + 1] = w[1]), (M[E * 3 + 2] = w[2]));
    }
    g.setAttribute("color", new THREE.BufferAttribute(M, 3));
  }
  i.add("cardboard", g);
  let b = 0.0025;
  if (a) {
    let _ = Math.min(0.16, t * 0.6);
    i.add(
      "cardboard",
      nv(e - 0.012, n - 0.012),
      {
        p: [0, t - _, 0],
        r: [-tt, 0, 0],
      },
      0.45 * h,
    );
    for (let [E, w, S] of [
      [0, e, n / 2],
      [At, e, n / 2],
      [tt, n, e / 2],
      [-tt, n, e / 2],
    ])
      i.add(
        "cardboard",
        M1(nv(w - 0.012, _)),
        {
          p: [Math.sin(E) * (S - 0.006), t - _ / 2, Math.cos(E) * (S - 0.006)],
          r: [0, E, 0],
        },
        0.55 * h,
      );
    let M = (E, w, S) => {
      let z = Math.sin(S),
        H = Math.cos(S);
      return [E, w, z, H];
    };
    for (let E of [1, -1]) {
      let w = f.range(0.3, 1.9),
        S = n / 2 - 0.01;
      i.add(
        "cardboard",
        vr(
          [
            [0, t, (E * n) / 2],
            [0, t + Math.sin(w) * S * 0.5, E * (n / 2 + Math.cos(w) * S * 0.5)],
            [0, t + Math.sin(w) * S, E * (n / 2 + Math.cos(w) * S + 0.01)],
          ],
          [e / 2 - 0.004, 0, 0],
        ),
        null,
        0.9 * h,
      );
    }
    for (let E of [1, -1]) {
      let w = f.range(0.9, 2.3),
        S = n / 2 - 0.02;
      i.add(
        "cardboard",
        vr(
          [
            [(E * e) / 2, t, 0],
            [E * (e / 2 + Math.cos(w) * S), t + Math.sin(w) * S, 0],
          ],
          [0, 0, n / 2 - 0.004],
        ),
        null,
        0.82 * h,
      );
    }
  } else if (l) {
    let M = [];
    M.push([-e / 2 - b, t - 0.075, 0]);
    for (let w = 0; w <= 8; w++)
      M.push([(-0.5 + w / 8) * (e + 2 * b), t + b, 0]);
    M.push([e / 2 + b, t - 0.075, 0]);
    let E = new THREE.Vector3();
    for (let w of M)
      (E.set(w[0], w[1], w[2]),
        v(E),
        (w[0] = E.x),
        (w[1] = E.y + (o ? 0.004 : 0)),
        (w[2] = E.z));
    i.add("polymer_tan", vr(M, [0, 0, 0.025], !1), null, 0.9);
  }
  let m = n / 2 + b,
    A = Math.min(0.055, t * 0.2);
  if (
    (c &&
      !o &&
      (i.label(
        c,
        {
          color: "black",
          font: "sans",
          distress: 0.3,
        },
        e * 0.6,
        A,
        {
          p: [-e * 0.1, t * 0.62, m],
        },
      ),
      i.add(
        "paint_white",
        nv(0.11, 0.075),
        {
          p: [e * 0.26, t * 0.3, m - 0.001],
        },
        0.9,
        {
          cast: !1,
        },
      ),
      i.decal(p.mats.decal("numbers_0_9"), 0.095, {
        p: [e * 0.26, t * 0.3, m + 6e-4],
      })),
    u && !o)
  )
    for (let _ of [1, -1])
      i.decal(p.mats.decal("arrow"), Math.min(0.09, t * 0.3), {
        p: [_ * (e / 2 + b), t * 0.55, _ * n * 0.2],
        r: [0, _ * tt, tt],
      });
  i.pop();
}

function nR(i, e) {
  let t = new Kn(i, "cardboard_boxes", e.seed || 0),
    n = t.rng,
    s = () => n.range(-0.015, 0.015),
    o = () => n.range(0.82, 1);
  return (
    Oc(
      t,
      0.5,
      0.38,
      0.44,
      {
        p: [-0.23 + s(), 0, -0.16 + s()],
        r: [0, n.range(-0.05, 0.05), 0],
      },
      {
        damp: 0.45,
        label: "FRAGILE",
        arrow: !0,
        tint: o(),
      },
    ),
    Oc(
      t,
      0.42,
      0.33,
      0.4,
      {
        p: [0.26 + s(), 0, -0.17 + s()],
        r: [0, n.range(-0.08, 0.08), 0],
      },
      {
        damp: 0.5,
        label: "KEEP DRY",
        tint: o(),
      },
    ),
    Oc(
      t,
      0.46,
      0.28,
      0.4,
      {
        p: [-0.24 + s(), 0.38, -0.15 + s()],
        r: [0, n.range(-0.2, 0.2), 0],
      },
      {
        crush: 1,
        damp: 0.75,
        tint: o() * 0.92,
      },
    ),
    Oc(
      t,
      0.33,
      0.26,
      0.32,
      {
        p: [0.27 + s(), 0.33, -0.18 + s()],
        r: [0, n.range(-0.3, 0.3), 0],
      },
      {
        open: !0,
        damp: 0.1,
        label: "",
        arrow: !0,
        tint: o(),
      },
    ),
    Oc(
      t,
      0.3,
      0.16,
      0.24,
      {
        p: [-0.26 + s(), 0.565, -0.16 + s()],
        r: [0.03, n.range(-0.5, 0.5), -0.09],
      },
      {
        damp: 0.2,
        label: "HX-2291",
        tint: o(),
      },
    ),
    Oc(
      t,
      0.36,
      0.26,
      0.3,
      {
        p: [0.06 + s(), 0.105, 0.2],
        r: [0.62, n.range(-0.25, 0.25), 0],
      },
      {
        damp: 0.9,
        crush: 0.25,
        tint: o() * 0.85,
      },
    ),
    t.finish()
  );
}

function registerCharacterProps(i) {
  (i("tarp_cargo", (e, t = {}) => QA(e, t)),
    i("sandbags", (e, t = {}) => tR(e, t)),
    i("cardboard_boxes", (e, t = {}) => nR(e, t)));
}

export { registerCharacterProps };
