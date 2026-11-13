import { THREE } from "../../vendor/three-r180.js";
import {
  boxGeometry,
  cylinderGeometry,
  tubeGeometry,
} from "../../core/geometry.js";
import {
  At,
  Ge,
  Ja,
  Kn,
  Mo,
  Y3,
  _f,
  eo,
  gn,
  gr,
  ja,
  to,
  tt,
  us,
  vn,
  vr,
  zi,
} from "./detail-geometry.js";
import { tv } from "./detailed-builders.js";

var tb = new THREE.Quaternion();

var iR = new THREE.Vector3(0, 1, 0);

var T1 = new THREE.Vector3();

var nb = new THREE.Matrix4();

function zr(i, e, t, n, s = 0.006, o = !1) {
  T1.set(e[0] - i[0], e[1] - i[1], e[2] - i[2]);
  let r = T1.length();
  T1.normalize();
  let a = o ? boxGeometry(t, r, n) : Ge(t, r, n, s);
  return (
    tb.setFromUnitVectors(iR, T1),
    nb.compose(
      new THREE.Vector3(
        (i[0] + e[0]) / 2,
        (i[1] + e[1]) / 2,
        (i[2] + e[2]) / 2,
      ),
      tb,
      new THREE.Vector3(1, 1, 1),
    ),
    a.applyMatrix4(nb),
    a
  );
}

var sR = (i) => {
  let e = 0;
  for (let t = 0; t < i.length; t++) {
    let n = i[t],
      s = i[(t + 1) % i.length];
    e += n[0] * s[1] - s[0] * n[1];
  }
  return e < 0 ? i.slice().reverse() : i;
};

function ib(i, e, t, n, s, o, r, a, l, c) {
  let u = tv(t, n, r, a);
  (i.push({
    p: [e, t, o > 0 ? s - n / 2 : -(s - n / 2)],
    r: [o > 0 ? tt : -tt, 0, 0],
  }),
    i.push({
      r: [0, c() * 6, 0],
    }));
  let h = c() * 20;
  i.add("tire", u, null, (p, d, v) => {
    let g = Math.hypot(p, v);
    return g < r + 0.01
      ? 0.45
      : 0.78 + 0.22 * gn(Math.atan2(v, p) * 3 + h, g * 30);
  });
  let f = n * 0.8;
  (i.add(
    "paint_yellow",
    us(
      [
        [r + 0.006, f + 0.012],
        [r - 0.012, f + 0.016],
        [r - 0.03, f - 0.02],
        [r * 0.62, f - 0.05],
        [r * 0.5, f - 0.02],
        [r * 0.42, f - 0.012],
        [0, f - 0.012],
      ],
      14,
    ),
    null,
    (p, d, v) =>
      Math.hypot(p, v) > r * 0.7 ? [0.55, 0.5, 0.42] : [0.8, 0.78, 0.7],
  ),
    i.add(
      "steel_dark",
      us(
        [
          [0, n * 0.2],
          [r + 0.004, n * 0.2],
        ],
        10,
      ),
      null,
      0.4,
    ),
    i.add(
      "steel_dark",
      cylinderGeometry(r * 0.2, r * 0.24, 0.035, 8),
      {
        p: [0, f, 0],
      },
      0.7,
    ));
  for (let p = 0; p < 6; p++) {
    let d = (p * At) / 3;
    i.add(
      "steel_galv",
      cylinderGeometry(0.011, 0.012, 0.016, 6),
      {
        p: [Math.cos(d) * r * 0.33, f - 0.006, Math.sin(d) * r * 0.33],
      },
      c.range(0.5, 0.8),
    );
  }
  (i.pop(), i.pop());
}

function oR(i, e) {
  let t = new Kn(i, "forklift", e.seed || 0),
    n = t.rng,
    s = zi(+e.forksUp || 0, 0, 1),
    o = s * 1.5,
    r = o / 2,
    [a, l] = Ja(e.color, "yellow"),
    c = (K = 1) => (typeof l == "number" ? l * K : l.map((ie) => ie * K)),
    u = "steel_dark",
    h = () => n.range(0.68, 0.95),
    f = e.number || ["04", "07", "12", "22"][t.seed % 4],
    p = 0.33,
    d = 0.23,
    v = 0.22,
    g = 0.47,
    x = 0.27,
    y = 0.18,
    b = -1.1,
    m = 0.46;
  for (let K of [1, -1])
    (ib(t, v, p, d, g, K, 0.195, 24, 0, n),
      ib(t, b, x, y, m, K, 0.155, 20, 0, n));
  (t.add(u, vn([v, p, -0.4], [v, p, 0.4], 0.07, 8), null, 0.5),
    t.add(
      u,
      Ge(0.12, 0.1, 0.78, 0.01),
      {
        p: [b, x, 0],
      },
      0.5,
    ),
    t.add(
      u,
      Ge(1.95, 0.34, 0.68, 0.02),
      {
        p: [-0.425, 0.37, 0],
      },
      0.55,
    ));
  for (let K of [1, -1]) {
    (t.add(
      a,
      Ge(0.6, 0.3, 0.17, 0.02),
      {
        p: [-0.47, 0.4, K * 0.42],
      },
      c(0.92),
    ),
      t.add(
        "diamond_plate",
        Ge(0.3, 0.012, 0.16, 0.003),
        {
          p: [-0.32, 0.556, K * 0.42],
        },
        0.7,
      ),
      t.add(
        u,
        cylinderGeometry(0.03, 0.03, 0.02, 8),
        {
          p: [-0.62, 0.56, K * 0.42],
        },
        0.6,
      ));
    let ie = [],
      F = p + 0.035,
      X = p + 0.06;
    for (let ne = 0; ne <= 7; ne++) {
      let re = 0.12 + ((At - 0.5) * ne) / 7;
      ie.push([v + Math.cos(re) * X, p + Math.sin(re) * X]);
    }
    for (let ne = 7; ne >= 0; ne--) {
      let re = 0.12 + ((At - 0.5) * ne) / 7;
      ie.push([v + Math.cos(re) * F, p + Math.sin(re) * F]);
    }
    t.add(
      a,
      Mo(ie, 0.27, {
        soft: 0.7,
      }),
      {
        p: [0, 0, K * 0.475],
      },
      c(0.95),
    );
  }
  t.add(
    "diamond_plate",
    boxGeometry(0.66, 0.016, 0.68),
    {
      p: [0.2, 0.548, 0],
    },
    0.6,
  );
  for (let K of [-0.12, 0.1])
    t.add(
      "rubber",
      Ge(0.1, 0.02, 0.07, 0.006),
      {
        p: [0.33, 0.6, K],
        r: [0, 0, 0.5],
      },
      0.8,
    );
  let A = eo(0.62, 0.63, 1.12, 0.12, 3, 3, 3);
  (to(A, (K) => {
    if (K.y > 0.1) {
      let ie = (K.y - 0.1) / 0.215;
      K.x += 0.03 * ie * (K.x < 0 ? 1 : 0);
    }
  }),
    t.add(
      a,
      gr(A),
      {
        p: [-1.39, 0.915, 0],
      },
      c(0.97),
    ),
    t.add(
      a,
      Ge(0.56, 0.37, 0.64, 0.05),
      {
        p: [-1.4, 0.43, 0],
      },
      c(0.85),
    ),
    t.add(
      "hazard_stripes",
      Ge(0.014, 0.085, 0.84, 0.004),
      {
        p: [-1.702, 0.77, 0],
      },
      0.95,
    ),
    t.label(
      f,
      {
        color: "black",
        font: "stencil",
        distress: 0.35,
      },
      0.4,
      0.2,
      {
        p: [-1.703, 0.96, 0],
        r: [0, -tt, 0],
      },
    ));
  for (let K of [1, -1])
    (t.add(
      i.mats.emissive(16722450, 0.16),
      Ge(0.012, 0.05, 0.11, 0.004),
      {
        p: [-1.69, 1.1, K * 0.37],
      },
      1,
      {
        raw: !0,
      },
    ),
      t.add(
        u,
        Ge(0.016, 0.066, 0.126, 0.004),
        {
          p: [-1.684, 1.1, K * 0.37],
        },
        0.4,
      ),
      t.label(
        "SALTLINE",
        {
          color: "black",
          font: "sans",
          distress: 0.3,
        },
        0.42,
        0.085,
        {
          p: [-1.39, 0.99, K * 0.5625],
          r: [0, K > 0 ? 0 : At, 0],
        },
      ),
      t.add(
        u,
        Ge(0.06, 0.05, 0.02, 0.004),
        {
          p: [-1.67, 0.44, K * 0.05],
        },
        0.5,
      ));
  (t.add(
    "steel_worn",
    cylinderGeometry(0.02, 0.02, 0.13, 8),
    {
      p: [-1.68, 0.44, 0],
    },
    0.7,
  ),
    t.add(
      a,
      Ge(0.98, 0.46, 0.94, 0.04),
      {
        p: [-0.59, 0.79, 0],
      },
      c(),
    ));
  for (let K of [1, -1]) {
    (t.label(
      f,
      {
        color: "black",
        font: "stencil",
        distress: 0.35,
      },
      0.3,
      0.19,
      {
        p: [-0.84, 0.8, K * 0.4715],
        r: [0, K > 0 ? 0 : At, 0],
      },
    ),
      t.add(
        u,
        boxGeometry(0.34, 0.2, 0.004),
        {
          p: [-0.36, 0.8, K * 0.47],
        },
        0.2,
      ));
    for (let ie = 0; ie < 5; ie++)
      t.add(
        a,
        boxGeometry(0.34, 0.03, 0.006),
        {
          p: [-0.36, 0.72 + ie * 0.04, K * 0.474],
          r: [K * 0.5, 0, 0],
        },
        c(0.85),
      );
  }
  t.add(
    u,
    Ge(0.4, 0.05, 0.4, 0.01),
    {
      p: [-0.54, 1.045, 0],
    },
    0.5,
  );
  let _ = eo(0.46, 0.1, 0.46, 0.04, 3, 3, 3);
  (to(_, (K) => {
    K.y > 0 && (K.y -= 0.018 * Math.cos(K.x * 5) * Math.cos(K.z * 5));
  }),
    t.add(
      "rubber",
      gr(_),
      {
        p: [-0.53, 1.115, 0],
      },
      1,
    ));
  let M = eo(0.1, 0.5, 0.44, 0.04, 3, 4, 3);
  (to(M, (K) => {
    K.x > 0 && (K.x -= 0.02 * Math.cos(K.z * 5.5));
  }),
    t.add(
      "rubber",
      gr(M),
      {
        p: [-0.8, 1.39, 0],
        r: [0, 0, 0.16],
      },
      1,
    ));
  for (let K of [1, -1])
    t.add(
      u,
      zr([-0.78, 1.08, K * 0.24], [-0.82, 1.3, K * 0.24], 0.03, 0.012, 0.004),
      null,
      0.5,
    );
  t.add(
    a,
    Mo(
      [
        [0.2, 0.55],
        [0.54, 0.55],
        [0.54, 1],
        [0.46, 1.12],
        [0.3, 1.14],
        [0.21, 1.02],
      ],
      0.7,
      {
        soft: 0.5,
      },
    ),
    null,
    c(),
  );
  let E = Math.atan2(0.12, 0.09);
  (t.push({
    p: [0.253, 1.082, 0],
    r: [0, 0, E],
  }),
    t.add(
      u,
      Ge(0.012, 0.13, 0.44, 0.004),
      {
        p: [-0.006, 0, 0],
      },
      0.45,
    ),
    t.add(
      i.mats.emissive(9429168, 0.3),
      _f(0.09, 0.05),
      {
        p: [-0.0135, 0.01, 0.1],
        r: [0, -tt, 0],
      },
      1,
      {
        raw: !0,
        cast: !1,
      },
    ),
    t.decal(i.mats.decal("csc_plate"), 0.09, {
      p: [-0.0135, 0, -0.12],
      r: [0, -tt, 0],
    }),
    t.add(
      "plastic_red",
      cylinderGeometry(0.016, 0.016, 0.02, 8),
      {
        p: [-0.02, 0, 0.19],
        r: [0, 0, tt],
      },
      0.9,
    ),
    t.add(
      "steel_bare",
      cylinderGeometry(0.009, 0.009, 0.02, 6),
      {
        p: [-0.018, -0.03, -0.01],
        r: [0, 0, tt],
      },
      0.9,
    ),
    t.pop());
  let w = [0.3, 1.1, 0.04],
    S = [0.1, 1.31, 0.04];
  (t.add(u, vn(w, S, 0.024, 8), null, 0.5),
    t.push({
      p: S,
      r: [0, 0, Math.atan2(S[1] - w[1], S[0] - w[0])],
    }),
    t.add(
      "rubber",
      ja(0.165, 0.014, 6, 18),
      {
        r: [0, tt, 0],
      },
      1,
    ));
  for (let K = 0; K < 3; K++) {
    let ie = (K * At * 2) / 3 + 0.5;
    t.add(
      u,
      vn(
        [-0.01, 0, 0],
        [0, Math.cos(ie) * 0.16, Math.sin(ie) * 0.16],
        0.009,
        5,
      ),
      null,
      0.5,
    );
  }
  (t.add(
    u,
    cylinderGeometry(0.035, 0.04, 0.03, 10),
    {
      p: [-0.005, 0, 0],
      r: [0, 0, tt],
    },
    0.5,
  ),
    t.add(
      "rubber",
      cylinderGeometry(0.016, 0.014, 0.045, 8),
      {
        p: [0.03, 0.16, 0.02],
        r: [0, 0, tt],
      },
      1,
    ),
    t.pop());
  for (let K = 0; K < 3; K++) {
    let ie = -0.2 - K * 0.055,
      F = [0.33, 1.12, ie],
      X = [0.25 - K * 0.012, 1.3 - K * 0.01, ie - 0.01];
    (t.add("steel_bare", vn(F, X, 0.007, 5), null, 0.8),
      t.add(
        "rubber",
        Y3(0.02, 7, 5),
        {
          p: X,
        },
        1,
      ));
  }
  {
    let K = [0.3, 1.1, 0.27],
      ie = [0.2, 1.24, 0.29];
    (t.add("steel_bare", vn(K, ie, 0.008, 5), null, 0.8),
      t.add(
        "plastic_red",
        cylinderGeometry(0.016, 0.016, 0.07, 7),
        {
          p: ie,
          r: [0, 0, 0.6],
        },
        0.9,
      ));
  }
  let z = 2.045,
    H = [];
  for (let K of [1, -1]) {
    let ie = [0.47, 1.08, K * 0.4],
      F = [0.27, z, K * 0.46],
      X = [-1, 1, K * 0.44],
      ne = [-0.95, z, K * 0.46];
    (t.add(u, zr(ie, F, 0.06, 0.05, 0.01), null, h()),
      t.add(u, zr(X, ne, 0.06, 0.05, 0.01), null, h()),
      t.add(
        u,
        zr([0.3, z, K * 0.46], [-0.98, z, K * 0.46], 0.05, 0.06, 0.01),
        null,
        h(),
      ),
      t.add(
        u,
        Ge(0.09, 0.012, 0.08, 0.003),
        {
          p: [0.47, 1.085, K * 0.4],
        },
        0.5,
      ),
      t.add(
        u,
        Ge(0.09, 0.012, 0.08, 0.003),
        {
          p: [-1, 1.024, K * 0.44],
        },
        0.5,
      ));
    let re = 0.36,
      $ = 1.66;
    (t.add(
      u,
      eo(0.085, 0.1, 0.13, 0.02, 3, 3, 3),
      {
        p: [re + 0.045, $, K * 0.47],
      },
      0.45,
    ),
      t.add(
        i.mats.emissive(16773330, 0.7),
        Ge(0.006, 0.075, 0.105, 0.002),
        {
          p: [re + 0.089, $, K * 0.47],
        },
        1,
        {
          raw: !0,
        },
      ),
      t.add(
        u,
        vn([0.385, 1.5, K * 0.42], [0.42, 1.52, K * 0.57], 0.008, 5),
        null,
        0.5,
      ),
      t.add(
        u,
        Ge(0.022, 0.17, 0.1, 0.006),
        {
          p: [0.42, 1.52, K * 0.573],
          r: [0, K * 0.25, 0],
        },
        0.5,
      ),
      t.add(
        "steel_bare",
        boxGeometry(0.002, 0.15, 0.084),
        {
          p: [0.408, 1.52, K * 0.57],
          r: [0, K * 0.25, 0],
        },
        1,
      ),
      H.push(
        {
          min: [-1.03, 1, K > 0 ? 0.41 : -0.5],
          max: [-0.92, z, K > 0 ? 0.5 : -0.41],
          surface: "metal",
        },
        {
          min: [0.24, 1.08, K > 0 ? 0.37 : -0.5],
          max: [0.5, z, K > 0 ? 0.5 : -0.37],
          surface: "metal",
        },
      ));
  }
  for (let K of [0.28, -0.96])
    t.add(
      u,
      Ge(0.05, 0.06, 0.92, 0.01),
      {
        p: [K, z, 0],
      },
      h(),
    );
  for (let K = 0; K < 8; K++)
    t.add(
      u,
      Ge(0.03, 0.028, 0.9, 0.006),
      {
        p: [-0.83 + K * 0.139, z + 0.012, 0],
      },
      h(),
    );
  (t.add(
    u,
    tubeGeometry(
      [
        [0.44, 1.2, 0.44],
        [0.47, 1.25, 0.49],
        [0.41, 1.55, 0.5],
        [0.36, 1.6, 0.455],
      ],
      0.011,
      5,
      !1,
      0.5,
    ),
    null,
    0.5,
  ),
    t.add(
      u,
      cylinderGeometry(0.045, 0.05, 0.03, 10),
      {
        p: [-0.86, z + 0.045, 0.3],
      },
      0.5,
    ),
    t.add(
      i.mats.emissive(16747026, 0.9),
      us(
        [
          [0.04, 0],
          [0.04, 0.06],
          [0.03, 0.082],
          [0, 0.09],
        ],
        10,
      ),
      {
        p: [-0.86, z + 0.06, 0.3],
      },
      1,
      {
        raw: !0,
      },
    ));
  let O = -1.4,
    q = 1.23 + 0.05 + 0.155;
  for (let K of [-0.2, 0.2])
    (t.add(
      u,
      Ge(0.3, 0.07, 0.04, 0.008),
      {
        p: [O, 1.262, K],
      },
      0.5,
    ),
      t.add(
        u,
        cylinderGeometry(0.159, 0.159, 0.035, 16, !0),
        {
          p: [O, q, K],
          r: [tt, 0, 0],
        },
        0.35,
      ));
  (t.add(
    "steel_galv",
    us(
      [
        [0, -0.37],
        [0.08, -0.36],
        [0.132, -0.33],
        [0.155, -0.27],
        [0.155, 0.27],
        [0.132, 0.33],
        [0.08, 0.36],
        [0, 0.37],
      ],
      16,
    ),
    {
      p: [O, q, 0],
      r: [tt, 0, 0],
    },
    (K, ie, F) => 0.8 + 0.2 * gn(K * 8, ie * 8, F * 8),
  ),
    t.add(
      "steel_galv",
      cylinderGeometry(0.09, 0.09, 0.07, 12, !0),
      {
        p: [O, q, 0.39],
        r: [tt, 0, 0],
      },
      0.7,
    ),
    t.add(
      "steel_galv",
      cylinderGeometry(0.02, 0.02, 0.05, 8),
      {
        p: [O, q, 0.39],
        r: [tt, 0, 0],
      },
      0.9,
    ),
    t.add(
      "rubber",
      tubeGeometry(
        [
          [O, q, 0.41],
          [O + 0.05, q - 0.02, 0.46],
          [O + 0.2, q - 0.15, 0.44],
          [-1.07, 1.1, 0.38],
          [-1, 0.98, 0.36],
        ],
        0.012,
        5,
        !1,
        0.5,
      ),
      null,
      1,
    ),
    t.push({
      p: [O, q, 0],
      r: [0, 0, 0.7],
    }),
    t.cdecal(i.mats.decal("hazard_flammable"), 0.157, 0.12, {
      p: [0, 0, -0.05],
      r: [-tt, 0, 0],
    }),
    t.cdecal(
      i.mats.label("LPG", {
        color: "red",
        font: "stencil",
        distress: 0.3,
      }),
      0.157,
      0.16,
      {
        p: [0, 0, 0.14],
        r: [-tt, 0, 0],
      },
    ),
    t.pop());
  let U = 0.6,
    T = 0.73,
    D = 0.375,
    C = 0.08,
    G = 2.02;
  for (let K of [1, -1]) {
    let ie = K * D,
      F = [
        [U, ie],
        [T, ie],
        [T, ie - K * 0.065],
        [T - 0.014, ie - K * 0.065],
        [T - 0.014, ie - K * 0.014],
        [U + 0.014, ie - K * 0.014],
        [U + 0.014, ie - K * 0.065],
        [U, ie - K * 0.065],
      ];
    (t.add(
      u,
      Mo(sR(F.map((P) => [P[0], -P[1]])), G - C, {
        soft: 0,
      }),
      {
        p: [0, (C + G) / 2, 0],
        r: [-tt, 0, 0],
      },
      h(),
    ),
      t.add(
        u,
        Ge(0.085, 1.86, 0.036, 0.006),
        {
          p: [0.665, 0.13 + r + 0.93, K * 0.335],
        },
        h() * 1.25,
      ),
      t.decal(i.mats.decal("hazard_general"), 0.1, {
        p: [0.665, 1.3, K * (D + 0.002)],
        r: [0, K > 0 ? 0 : At, 0],
      }));
    let X = [0.36, 0.66, K * 0.3],
      ne = [0.6, 0.86, K * 0.33],
      re = [0.5, 0.777, K * 0.317];
    (t.add(u, vn(X, re, 0.034, 8, !0), null, 0.55),
      t.add("steel_bare", vn(re, ne, 0.018, 6), null, 1));
    let $ = K * 0.13,
      ue = 1.9 + r,
      me = 0.055,
      ee = [
        [0.725, 0.5 + o, $],
        [0.725, ue, $],
      ];
    for (let P = 0.5; P < At; P += 0.55)
      ee.push([0.67 + Math.cos(P) * me, ue + Math.sin(P) * me, $]);
    ee.push([0.615, ue, $], [0.615, 1, $]);
    let B = 0;
    for (let P = 0; P < ee.length - 1; P++) {
      let V = ee[P],
        Y = ee[P + 1],
        L = Math.hypot(Y[0] - V[0], Y[1] - V[1]),
        Z = Math.max(1, Math.round(L / 0.058));
      for (let J = 0; J < Z; J++, B++) {
        let oe = J / Z,
          fe = (J + 0.86) / Z,
          le = (R) => [V[0] + (Y[0] - V[0]) * R, V[1] + (Y[1] - V[1]) * R, $];
        t.add(
          "steel_worn",
          zr(le(oe), le(fe), 0.011, B % 2 ? 0.034 : 0.022, 0, !0),
          null,
          B % 2 ? 0.55 : 0.75,
        );
      }
    }
    t.add(
      u,
      cylinderGeometry(me - 0.006, me - 0.006, 0.04, 12),
      {
        p: [0.67, ue, $],
        r: [tt, 0, 0],
      },
      0.7,
    );
  }
  (t.add(
    u,
    Ge(0.04, 0.09, 0.78, 0.008),
    {
      p: [U - 0.012, 1.96, 0],
    },
    h(),
  ),
    t.add(
      u,
      Ge(0.04, 0.12, 0.78, 0.008),
      {
        p: [U - 0.012, 0.42, 0],
      },
      h(),
    ),
    t.add(
      u,
      Ge(0.07, 0.09, 0.66, 0.008),
      {
        p: [0.665, 1.99 + r, 0],
      },
      h(),
    ),
    t.add(
      u,
      cylinderGeometry(0.048, 0.048, 1.15, 10),
      {
        p: [0.645, 0.72, 0],
      },
      0.6,
    ),
    t.add(
      u,
      cylinderGeometry(0.055, 0.055, 0.05, 10),
      {
        p: [0.645, 1.3, 0],
      },
      0.5,
    ),
    t.add(
      "steel_bare",
      cylinderGeometry(0.027, 0.027, 0.64 + r, 8, !0),
      {
        p: [0.645, 1.31 + (0.64 + r) / 2, 0],
      },
      1,
    ),
    t.label(
      "MAX 2500 kg",
      {
        color: "yellow",
        font: "stencil",
        distress: 0.3,
      },
      0.5,
      0.05,
      {
        p: [U - 0.033, 0.42, 0],
        r: [0, -tt, 0],
      },
    ));
  for (let K of [0.21, 0.245])
    t.add(
      "rubber",
      tubeGeometry(
        [
          [0.6, 1.25, K],
          [0.59, 1.65 + r * 0.6, K],
          [0.655, 1.86 + r, K + 0.005],
          [0.735, 1.6 + r * 1.2, K],
          [0.74, 0.56 + o, K],
        ],
        0.011,
        5,
        !1,
        0.5,
      ),
      null,
      1,
    );
  t.push({
    p: [0, o, 0],
  });
  let j = 0.06;
  for (let K of [j + 0.12, j + 0.5])
    t.add(
      u,
      Ge(0.04, 0.1, 1.02, 0.008),
      {
        p: [0.755, K, 0],
      },
      h(),
    );
  t.add(
    "hazard_stripes",
    boxGeometry(0.003, 0.06, 0.4),
    {
      p: [0.7765, j + 0.5, 0],
    },
    0.9,
  );
  for (let K of [1, -1])
    (t.add(
      u,
      Ge(0.03, 0.5, 0.06, 0.006),
      {
        p: [0.745, j + 0.31, K * 0.3],
      },
      h(),
    ),
      t.add(
        u,
        Ge(0.11, 0.36, 0.022, 0.005),
        {
          p: [0.685, j + 0.31, K * 0.305],
        },
        h(),
      ),
      t.add(
        u,
        Ge(0.03, 0.78, 0.04, 0.006),
        {
          p: [0.755, j + 0.94, K * 0.5],
        },
        h(),
      ),
      t.add(
        "steel_worn",
        cylinderGeometry(0.04, 0.04, 0.03, 10),
        {
          p: [0.67, j + 0.2, K * 0.325],
          r: [tt, 0, 0],
        },
        0.7,
      ));
  (t.add(
    u,
    Ge(0.03, 0.04, 1.04, 0.006),
    {
      p: [0.755, j + 1.33, 0],
    },
    h(),
  ),
    t.add(
      u,
      Ge(0.02, 0.03, 1, 0.004),
      {
        p: [0.755, j + 0.94, 0],
      },
      h(),
    ));
  for (let K = -2; K <= 2; K++)
    t.add(
      u,
      Ge(0.02, 0.76, 0.02, 0.004),
      {
        p: [0.755, j + 0.94, K * 0.165],
      },
      h(),
    );
  let N = 0.035;
  for (let K of [1, -1]) {
    let ie = Mo(
      [
        [0.777, N],
        [1.45, N],
        [1.7, N + 0.006],
        [1.7, N + 0.016],
        [0.87, N + 0.046],
        [0.826, N + 0.075],
        [0.822, N + 0.62],
        [0.777, N + 0.62],
      ],
      0.1,
      {
        soft: 0.45,
      },
    );
    (t.add(
      "steel_worn",
      ie,
      {
        p: [0, 0, K * 0.26],
      },
      (F, X, ne) => {
        let re = zi((F - 0.8) / 0.9, 0, 1),
          $ = gn(F * 14, ne * 30 + K);
        return (0.5 + 0.5 * re) * (0.8 + 0.2 * $);
      },
    ),
      t.add(
        u,
        Ge(0.075, 0.05, 0.112, 0.006),
        {
          p: [0.772, j + 0.575, K * 0.26],
        },
        0.55,
      ),
      t.add(
        u,
        Ge(0.03, 0.04, 0.112, 0.006),
        {
          p: [0.79, j + 0.07, K * 0.26],
        },
        0.55,
      ));
  }
  t.pop();
  let Q = Math.max(2.2, 0.06 + o + 1.36, 2.04 + r);
  return t.finish({
    size: [3.4, Q, 1.25],
    colliders: [
      {
        min: [-1.7, 0, -0.6],
        max: [0.58, 1.24, 0.6],
        surface: "metal",
      },
      {
        min: [-1.56, 1.24, -0.4],
        max: [-1.22, 1.6, 0.4],
        surface: "metal",
      },
      {
        min: [-0.88, 1.24, -0.24],
        max: [-0.7, 1.66, 0.24],
        surface: "rubber",
      },
      {
        min: [0.56, 0, -0.42],
        max: [0.78, 2.04 + r, 0.42],
        surface: "metal",
      },
      {
        min: [0.72, o, -0.53],
        max: [0.8, o + 1.42, 0.53],
        surface: "metal",
      },
      {
        min: [0.8, o, -0.33],
        max: [1.7, o + 0.1, 0.33],
        surface: "metal",
      },
      {
        min: [-1.02, 2, -0.5],
        max: [0.32, 2.1, 0.5],
        surface: "metal",
      },
      ...H,
    ],
  });
}

function rR(i, e) {
  let t = new Kn(i, "generator", e.seed || 0),
    n = t.rng,
    [s, o] = Ja(e.color, "yellow"),
    r = (m = 1) => (typeof o == "number" ? o * m : o.map((A) => A * m)),
    a = "steel_dark",
    l = 0.46,
    c = 1.03,
    u = 0.3,
    h = 1.16,
    f = (u + h) / 2;
  for (let m of [1, -1]) {
    t.add(
      a,
      Ge(2.2, 0.14, 0.1, 0.012),
      {
        p: [0, 0.07, m * 0.4],
      },
      0.6,
    );
    for (let A of [-0.45, 0.45])
      t.add(
        a,
        boxGeometry(0.22, 0.075, 0.004),
        {
          p: [A, 0.075, m * 0.451],
        },
        0.12,
      );
  }
  for (let m of [-0.85, 0, 0.85])
    t.add(
      a,
      boxGeometry(0.1, 0.1, 0.72),
      {
        p: [m, 0.07, 0],
      },
      0.55,
    );
  (t.add(
    a,
    Ge(2.1, 0.17, 0.94, 0.012),
    {
      p: [0, 0.215, 0],
    },
    0.8,
  ),
    t.add(
      s,
      Ge(2.06, h - u, l * 2, 0.025),
      {
        p: [0, f, 0],
      },
      r(),
    ),
    t.add(
      s,
      Ge(2.13, 0.045, 0.99, 0.014),
      {
        p: [0, h + 0.02, 0],
      },
      r(0.9),
    ));
  for (let m of [-0.52, 0.52])
    t.add(
      s,
      boxGeometry(0.04, 0.012, 0.95),
      {
        p: [m, h + 0.046, 0],
      },
      r(0.85),
    );
  for (let m of [1, -1]) {
    let A = m > 0 ? 0 : At;
    ([-0.66, 0, 0.66].forEach((_, M) => {
      (t.add(
        s,
        Ge(0.62, 0.72, 0.012, 0.006),
        {
          p: [_, f + 0.01, m * (l + 0.004)],
        },
        r(n.range(0.9, 1)),
      ),
        t.add(
          a,
          boxGeometry(0.03, 0.11, 0.016),
          {
            p: [_ + 0.27, f, m * (l + 0.012)],
          },
          0.6,
        ),
        t.add(
          "steel_galv",
          boxGeometry(0.012, 0.03, 0.006),
          {
            p: [_ + 0.27, f + 0.03, m * (l + 0.022)],
          },
          0.8,
        ));
      for (let E of [-0.25, 0.25])
        t.add(
          "steel_galv",
          cylinderGeometry(0.009, 0.009, 0.06, 5, !0),
          {
            p: [_ - 0.305, f + E, m * (l + 0.012)],
          },
          0.7,
        );
      if (M > 0) {
        let E = M === 2 ? 8 : 5,
          w = 0.42,
          S = M === 2 ? f + 0.14 : f - 0.16;
        t.add(
          a,
          boxGeometry(w, E * 0.05, 0.004),
          {
            p: [_ - 0.03, S, m * (l + 0.0105)],
          },
          0.12,
        );
        for (let z = 0; z < E; z++)
          t.add(
            s,
            boxGeometry(w, 0.04, 0.005),
            {
              p: [_ - 0.03, S + (z - (E - 1) / 2) * 0.05, m * (l + 0.018)],
              r: [m * 0.6, 0, 0],
            },
            r(0.82),
          );
        M === 2 &&
          t.decal(i.mats.decal("rust_run"), 0.3, {
            p: [_ - 0.03, S - 0.36, m * (l + 0.011)],
            r: [0, A, 0],
          });
      }
    }),
      t.label(
        e.label || "GEN-0" + (1 + (t.seed % 2)),
        {
          color: "black",
          font: "stencil",
          distress: 0.35,
        },
        0.5,
        0.13,
        {
          p: [-0.66 * m, f + 0.17, m * (l + 0.0108)],
          r: [0, A, 0],
        },
      ),
      t.decal(i.mats.decal("hazard_voltage"), 0.15, {
        p: [-0.66 * m - m * 0.18, f - 0.17, m * (l + 0.0108)],
        r: [0, A, 0],
      }));
  }
  t.add(
    a,
    boxGeometry(0.004, 0.66, 0.74),
    {
      p: [c + 0.001, f, 0],
    },
    0.1,
  );
  for (let m = 0; m < 11; m++)
    t.add(
      s,
      boxGeometry(0.006, 0.046, 0.74),
      {
        p: [c + 0.012, f - 0.3 + m * 0.06, 0],
        r: [0, 0, -0.6],
      },
      r(0.8),
    );
  for (let m of [1, -1])
    (t.add(
      s,
      boxGeometry(0.03, 0.72, 0.03),
      {
        p: [c + 0.012, f, m * 0.385],
      },
      r(0.9),
    ),
      t.add(
        s,
        boxGeometry(0.03, 0.03, 0.8),
        {
          p: [c + 0.012, f + m * 0.345, 0],
        },
        r(0.9),
      ));
  let p = -c - 0.004,
    d = 0.14;
  (t.add(
    a,
    Ge(0.01, 0.44, 0.52, 0.004),
    {
      p: [p, 0.87, d],
    },
    0.45,
  ),
    t.add(
      s,
      Ge(0.075, 0.014, 0.56, 0.004),
      {
        p: [p - 0.03, 1.1, d],
        r: [0, 0, 0.12],
      },
      r(0.9),
    ));
  for (let m of [1, -1])
    t.add(
      s,
      boxGeometry(0.06, 0.44, 0.012),
      {
        p: [p - 0.025, 0.87, d + m * 0.268],
      },
      r(0.9),
    );
  let v = p - 0.0055,
    g = [0, -tt, 0];
  (t.add(
    i.mats.emissive(8840104, 0.32),
    _f(0.13, 0.07),
    {
      p: [v - 0.001, 0.99, d - 0.12],
      r: g,
    },
    1,
    {
      raw: !0,
      cast: !1,
    },
  ),
    t.add(
      a,
      Ge(0.008, 0.09, 0.15, 0.003),
      {
        p: [v + 0.003, 0.99, d - 0.12],
      },
      0.3,
    ),
    t.add(
      "steel_galv",
      cylinderGeometry(0.02, 0.02, 0.012, 10),
      {
        p: [v - 0.004, 1, d + 0.19],
        r: [0, 0, tt],
      },
      0.7,
    ),
    t.add(
      i.mats.emissive(4063082, 3.2),
      cylinderGeometry(0.013, 0.013, 0.014, 10),
      {
        p: [v - 0.009, 1, d + 0.19],
        r: [0, 0, tt],
      },
      1,
      {
        raw: !0,
      },
    ),
    t.add(
      s,
      cylinderGeometry(0.042, 0.042, 0.006, 12),
      {
        p: [v - 0.003, 0.8, d + 0.17],
        r: [0, 0, tt],
      },
      1,
    ),
    t.add(
      "plastic_red",
      us(
        [
          [0, 0],
          [0.018, 0],
          [0.018, 0.018],
          [0.03, 0.02],
          [0.03, 0.034],
          [0.02, 0.042],
          [0, 0.044],
        ],
        10,
      ),
      {
        p: [v - 0.004, 0.8, d + 0.17],
        r: [0, 0, tt],
      },
      0.95,
    ));
  for (let m = 0; m < 3; m++) {
    let A = d - 0.2 + m * 0.105;
    (t.add(
      "aluminium",
      cylinderGeometry(0.04, 0.042, 0.012, 10),
      {
        p: [v - 0.004, 0.86, A],
        r: [0, 0, tt],
      },
      0.8,
    ),
      t.add(
        "aluminium",
        cylinderGeometry(0.034, 0.034, 0.002, 10),
        {
          p: [v - 0.0105, 0.86, A],
          r: [0, 0, tt],
        },
        1,
      ),
      t.add(
        a,
        boxGeometry(0.002, 0.028, 0.004),
        {
          p: [v - 0.0125, 0.868, A + 0.005],
          r: [n.range(-1, 1), 0, 0],
        },
        0.3,
      ));
  }
  for (let m = 0; m < 5; m++)
    t.add(
      m === 0 ? "plastic_red" : a,
      boxGeometry(0.014, 0.04, 0.022),
      {
        p: [v - 0.006, 0.74, d - 0.2 + m * 0.03],
        r: [0, 0, n() < 0.5 ? 0.25 : -0.25],
      },
      0.8,
    );
  (t.decal(i.mats.decal("hazard_voltage"), 0.13, {
    p: [-c - 0.002, 0.95, -0.28],
    r: g,
  }),
    t.label(
      "DANGER",
      {
        color: "red",
        font: "stencil",
        distress: 0.3,
      },
      0.22,
      0.05,
      {
        p: [-c - 0.002, 0.82, -0.28],
        r: g,
      },
    ));
  let x = [
    ["plastic_red", 0.02],
    ["plastic_blue", 0.2],
    ["plastic_blue", -0.25],
  ];
  for (let [m, A] of x)
    (t.add(
      a,
      Ge(0.02, 0.12, 0.1, 0.006),
      {
        p: [-c - 0.008, 0.5, A],
      },
      0.4,
    ),
      t.add(
        m,
        vn([-c - 0.01, 0.5, A], [-c - 0.06, 0.47, A], 0.036, 10, !0),
        null,
        0.9,
      ));
  (t.add(
    "plastic_blue",
    vn([-c - 0.06, 0.47, 0.2], [-c - 0.068, 0.39, 0.2], 0.03, 8, !0, 0.02),
    null,
    0.85,
  ),
    t.add(
      "rubber",
      tubeGeometry(
        [
          [-c - 0.066, 0.4, 0.2],
          [-c - 0.064, 0.25, 0.21],
          [-c - 0.05, 0.06, 0.26],
          [-c + 0.05, 0.016, 0.4],
          [-c + 0.3, 0.016, 0.478],
          [-0.35, 0.016, 0.486],
        ],
        0.014,
        5,
        !1,
        0.5,
      ),
      null,
      1,
    ));
  let y = h + 0.0425;
  (t.add(
    a,
    Ge(0.2, 0.012, 0.14, 0.004),
    {
      p: [0, y + 0.004, 0],
    },
    0.6,
  ),
    t.add(
      "steel_galv",
      ja(0.045, 0.014, 5, 10),
      {
        p: [0, y + 0.058, 0],
      },
      0.7,
    ));
  let b = [0.72, y, 0.24];
  return (
    t.add(
      "steel_rust",
      cylinderGeometry(0.062, 0.066, 0.025, 12),
      {
        p: [b[0], y + 0.012, b[2]],
      },
      0.6,
    ),
    t.add(
      "steel_rust",
      cylinderGeometry(0.04, 0.04, 0.17, 12, !0),
      {
        p: [b[0], y + 0.085, b[2]],
      },
      (m, A) => 0.45 + 0.55 * zi((y + 0.17 - A) / 0.17, 0, 1),
    ),
    t.add(
      "steel_rust",
      cylinderGeometry(0.034, 0.034, 0.002, 10),
      {
        p: [b[0], y + 0.15, b[2]],
      },
      0.08,
    ),
    t.add(
      "steel_rust",
      cylinderGeometry(0.046, 0.046, 0.005, 12),
      {
        p: [b[0] - 0.012, y + 0.186, b[2]],
        r: [0, 0, 0.5],
      },
      0.6,
    ),
    t.decal(i.mats.decal("scorch"), 0.3, {
      p: [b[0], y + 0.001, b[2]],
      r: [-tt, 0, 0],
    }),
    t.add(
      a,
      vn([-0.72, 0.25, 0.46], [-0.72, 0.32, 0.5], 0.03, 8, !0),
      null,
      0.6,
    ),
    t.add(
      "plastic_red",
      vn([-0.72, 0.32, 0.5], [-0.72, 0.338, 0.51], 0.037, 10, !0),
      null,
      0.9,
    ),
    t.decal(i.mats.decal("hazard_flammable"), 0.11, {
      p: [-0.52, 0.215, 0.4712],
    }),
    t.label(
      "DIESEL",
      {
        color: "white",
        font: "stencil",
        distress: 0.4,
      },
      0.2,
      0.05,
      {
        p: [-0.34, 0.215, 0.4712],
      },
    ),
    t.finish({
      colliders: [
        {
          min: [-1.1, 0, -0.5],
          max: [1.1, 1.21, 0.5],
          surface: "metal",
        },
      ],
    })
  );
}

function aR(i, e) {
  let t = new Kn(i, "dumpster", e.seed || 0),
    n = t.rng,
    [s, o] = Ja(e.color, "green"),
    r = (M = 1) => (typeof o == "number" ? o * M : o.map((E) => E * M)),
    a = 0.89,
    l = 0.2,
    c = 1.12,
    u = 0.3,
    h = 0.5,
    f = -0.44,
    p = -0.5,
    d = 0.022,
    v = [
      [-h, c],
      [-u, l],
      [-f, l],
      [-p, c],
      [-p - d, c],
      [-f - d * 0.8, l + d],
      [-u + d * 0.8, l + d],
      [-h + d, c],
    ],
    g = t.seed * 2.3;
  t.add(
    s,
    Mo(v, a * 2, {
      soft: 0,
    }),
    {
      r: [0, tt, 0],
    },
    (M, E, w) => {
      let S =
        Math.abs(w) < 0.4 &&
        E > l + 0.01 &&
        E < c - 0.01 &&
        Math.abs(M) < a - 0.01;
      return r(0.9 + 0.1 * gn(M * 3 + g, E * 3));
    },
  );
  for (let M of [1, -1]) {
    (t.add(
      s,
      Mo(
        [
          [-h, c],
          [-u, l],
          [-f, l],
          [-p, c],
        ],
        d,
        {
          soft: 0,
        },
      ),
      {
        p: [M * (a - d / 2), 0, 0],
        r: [0, tt, 0],
      },
      r(0.95),
    ),
      t.add(
        s,
        Ge(0.05, 0.045, h - p + 0.04, 0.008),
        {
          p: [M * a, c, 0],
        },
        r(0.9),
      ));
    for (let E of [-0.22, 0.14])
      t.add(
        s,
        Ge(0.03, 0.84, 0.05, 0.006),
        {
          p: [M * (a + 0.012), 0.66, E],
        },
        r(0.9),
      );
    (t.add(
      s,
      Ge(0.035, 0.1, 0.84, 0.008),
      {
        p: [M * (a + 0.014), 0.93, 0],
      },
      r(0.85),
    ),
      t.add(
        "steel_worn",
        vn(
          [M * (a + 0.01), 0.93, 0.3],
          [M * (a + 0.065), 0.93, 0.3],
          0.03,
          10,
          !0,
        ),
        null,
        0.7,
      ),
      t.add(
        "steel_worn",
        cylinderGeometry(0.042, 0.042, 0.008, 10),
        {
          p: [M * (a + 0.064), 0.93, 0.3],
          r: [0, 0, tt],
        },
        0.6,
      ));
  }
  (t.add(
    s,
    Ge(a * 2 + 0.04, 0.045, 0.05, 0.008),
    {
      p: [0, c, h],
    },
    r(0.9),
  ),
    t.add(
      s,
      Ge(a * 2 + 0.04, 0.045, 0.05, 0.008),
      {
        p: [0, c, p],
      },
      r(0.9),
    ));
  let x = Math.atan2(h - u, c - l),
    y = Math.atan2(p - f, c - l);
  for (let M of [-0.6, -0.2, 0.2, 0.6])
    (t.add(
      s,
      zr(
        [M, l + 0.03, u + 0.022],
        [M, c - 0.04, h + 0.012],
        0.055,
        0.03,
        0.006,
      ),
      null,
      r(0.9),
    ),
      t.add(
        s,
        zr(
          [M, l + 0.03, f - 0.016],
          [M, c - 0.04, p - 0.012],
          0.055,
          0.03,
          0.006,
        ),
        null,
        r(0.9),
      ));
  t.add(
    s,
    zr(
      [-a, l + 0.5, u + 0.022 + (0.5 * (h - u)) / (c - l)],
      [a, l + 0.5, u + 0.022 + (0.5 * (h - u)) / (c - l)],
      0.03,
      0.06,
      0.006,
    ),
    {
      r: [0, 0, 0],
    },
    r(0.88),
  );
  let b = (M) => u + ((M - l) * (h - u)) / (c - l) + 0.003;
  (t.label(
    e.label || "B4 WASTE " + (11 + (t.seed % 2)),
    {
      color: "white",
      font: "stencil",
      distress: 0.5,
    },
    0.36,
    0.09,
    {
      p: [-0.4, 0.93, b(0.93)],
      r: [-x, 0, 0],
    },
  ),
    t.decal(i.mats.decal("grime_streak"), 0.36, {
      p: [0.4, 0.82, b(0.82)],
      r: [-x, 0, 0],
    }),
    t.decal(i.mats.decal("rust_run"), 0.3, {
      p: [0, 0.5, b(0.5)],
      r: [-x, 0, 0],
    }),
    t.decal(i.mats.decal("logo_c"), 0.26, {
      p: [0.4, 0.42, b(0.42)],
      r: [-x, 0, 0],
    }),
    t.decal(i.mats.decal("leak_stain"), 0.34, {
      p: [-0.4, 0.45, b(0.45)],
      r: [-x, 0, 0],
    }));
  let m = c + 0.045,
    A = p - 0.02;
  t.add(
    "steel_galv",
    vn([-a - 0.02, m, A], [a + 0.02, m, A], 0.013, 6, !0),
    null,
    0.7,
  );
  let _ = (M, E) => {
    t.push({
      p: [M, m, A],
      r: [E, 0, 0],
    });
    let w = 1.07,
      S = eo(0.885, 0.04, w, 0.016, 3, 3, 4);
    (to(S, (H) => {
      H.y > 0 &&
        (H.y +=
          0.018 * Math.cos((H.z / w) * At) * Math.cos((H.x / 0.885) * At));
    }),
      S.computeVertexNormals());
    let z = n.range(0.75, 0.95);
    t.add(
      "plastic_grey",
      S,
      {
        p: [0, 0.005, w / 2],
      },
      z,
    );
    for (let H of [-0.26, 0.26])
      t.add(
        "plastic_grey",
        Ge(0.07, 0.016, w - 0.16, 0.006),
        {
          p: [H, 0.036, w / 2],
        },
        z * 0.9,
      );
    t.add(
      "plastic_grey",
      Ge(0.3, 0.035, 0.05, 0.01),
      {
        p: [0, 0.02, w + 0.01],
      },
      z * 0.8,
    );
    for (let H of [-0.3, 0.3])
      t.add(
        "plastic_grey",
        Ge(0.08, 0.03, 0.09, 0.008),
        {
          p: [H, 0.005, 0.03],
        },
        z * 0.8,
      );
    t.pop();
  };
  (_(-0.45, 0), _(0.45, tt + 0.07 + n.range(0, 0.05)));
  for (let [M, E, w, S] of [
    [0.45, 0.93, 0.05, 1],
    [0.66, 0.9, -0.24, 0.8],
    [0.22, 0.86, -0.2, 0.85],
  ]) {
    let z = eo(0.46 * S, 0.4 * S, 0.42 * S, 0.17 * S, 3, 3, 3),
      H = n() * 20;
    (to(z, (O) => {
      let q = gn(O.x * 9 + H, O.y * 9, O.z * 9) - 0.5;
      ((O.x += q * 0.06), (O.z += q * 0.06), (O.y += q * 0.04));
    }),
      t.add(
        "polymer_black",
        gr(z),
        {
          p: [M, E, w],
          r: [n() * 0.5, n() * 6, 0],
        },
        0.8,
      ));
  }
  t.add(
    "cardboard",
    vr(
      [
        [0.2, 0.9, 0.2],
        [0.24, 1.14, 0.26],
        [0.3, 1.2, 0.33],
      ],
      [0.16, 0, -0.05],
    ),
    null,
    0.7,
  );
  for (let M of [-0.7, 0.7])
    for (let E of [-0.3, 0.17]) {
      (t.push({
        p: [M, 0, E],
        r: [0, n() * 6, 0],
      }),
        t.add(
          "steel_galv",
          Ge(0.13, 0.012, 0.11, 0.003),
          {
            p: [0, 0.194, 0],
          },
          0.7,
        ));
      for (let w of [1, -1])
        t.add(
          "steel_galv",
          zr(
            [0, 0.19, w * 0.034],
            [0.035, 0.08, w * 0.034],
            0.05,
            0.006,
            0,
            !0,
          ),
          null,
          0.65,
        );
      (t.add(
        "rubber",
        cylinderGeometry(0.08, 0.08, 0.045, 14),
        {
          p: [0.035, 0.08, 0],
          r: [tt, 0, 0],
        },
        0.9,
      ),
        t.add(
          "steel_galv",
          cylinderGeometry(0.035, 0.035, 0.05, 8),
          {
            p: [0.035, 0.08, 0],
            r: [tt, 0, 0],
          },
          0.6,
        ),
        t.pop());
    }
  return t.finish({
    colliders: [
      {
        min: [-0.95, 0.05, -0.56],
        max: [0.95, 1.2, 0.55],
        surface: "metal",
      },
    ],
  });
}

function lR(i, e) {
  let t = new Kn(i, "toolbox_cart", e.seed || 0),
    n = t.rng,
    [s, o] = Ja(e.color, "red"),
    r = (y = 1) => (typeof o == "number" ? o * y : o.map((b) => b * y)),
    a = 0.04,
    l = 0.74,
    c = 0.125,
    u = 0.785,
    h = 0.23;
  (t.add(
    s,
    Ge(l, u - c, h * 2, 0.012),
    {
      p: [a, (c + u) / 2, 0],
    },
    r(),
  ),
    t.add(
      "steel_dark",
      Ge(l + 0.01, 0.02, h * 2 + 0.01, 0.006),
      {
        p: [a, c + 0.004, 0],
      },
      0.5,
    ));
  let f = [0.075, 0.075, 0.1, 0.13, 0.19],
    p = 1 + (t.seed % 3),
    d = u - 0.03;
  (f.forEach((y, b) => {
    let m = b === p ? 0.05 : n() < 0.3 ? 0.004 : 0,
      A = d - y / 2;
    if (
      (t.add(
        s,
        Ge(l - 0.05, y - 0.01, 0.014, 0.004),
        {
          p: [a, A, h + 0.005 + m],
        },
        r(n.range(0.9, 1)),
      ),
      t.add(
        "aluminium",
        Ge(l - 0.09, 0.016, 0.016, 0.004),
        {
          p: [a, A + y / 2 - 0.02, h + 0.019 + m],
        },
        0.85,
      ),
      m > 0.01)
    ) {
      (t.add(
        "steel_dark",
        boxGeometry(l - 0.07, y - 0.02, m),
        {
          p: [a, A, h + m / 2],
        },
        0.4,
      ),
        t.add(
          "polymer_black",
          boxGeometry(l - 0.08, 0.004, m),
          {
            p: [a, A + y / 2 - 0.012, h + m / 2],
          },
          0.3,
        ));
      for (let _ = 0; _ < 4; _++)
        t.add(
          "steel_bare",
          vn(
            [a - 0.25 + _ * 0.15, A + y / 2 - 0.016, h + 0.008],
            [a - 0.23 + _ * 0.15, A + y / 2 - 0.014, h + m - 0.012],
            0.007,
            5,
            !0,
          ),
          null,
          0.8,
        );
    }
    d -= y;
  }),
    t.add(
      "steel_bare",
      cylinderGeometry(0.011, 0.011, 0.008, 8),
      {
        p: [a + l / 2 - 0.06, u - 0.016, h + 0.004],
        r: [tt, 0, 0],
      },
      0.8,
    ),
    t.add(
      "rubber",
      boxGeometry(l - 0.04, 0.006, h * 2 - 0.04),
      {
        p: [a, u + 0.003, 0],
      },
      0.9,
    ),
    t.add(
      s,
      Ge(l, 0.03, 0.014, 0.004),
      {
        p: [a, u + 0.013, -h + 0.007],
      },
      r(0.95),
    ));
  for (let y of [1, -1])
    t.add(
      s,
      Ge(0.014, 0.03, h * 2, 0.004),
      {
        p: [a + y * (l / 2 - 0.007), u + 0.013, 0],
      },
      r(0.95),
    );
  t.add(
    "aluminium",
    tubeGeometry(
      [
        [a - l / 2, 0.56, -0.17],
        [-0.41, 0.6, -0.17],
        [-0.435, 0.73, -0.17],
        [-0.435, 0.73, 0.17],
        [-0.41, 0.6, 0.17],
        [a - l / 2, 0.56, 0.17],
      ],
      0.012,
      6,
      !1,
      0.2,
    ),
    null,
    0.85,
  );
  for (let y of [1, -1])
    for (let b of [1, -1]) {
      (t.push({
        p: [a + y * (l / 2 - 0.07), 0, b * (h - 0.06)],
        r: [0, y > 0 ? n() * 6 : 0, 0],
      }),
        t.add(
          "steel_galv",
          Ge(0.08, 0.008, 0.07, 0.002),
          {
            p: [0, 0.119, 0],
          },
          0.7,
        ));
      for (let m of [1, -1])
        t.add(
          "steel_galv",
          zr(
            [0, 0.117, m * 0.022],
            [0.02, 0.05, m * 0.022],
            0.035,
            0.004,
            0,
            !0,
          ),
          null,
          0.65,
        );
      (t.add(
        "rubber",
        cylinderGeometry(0.05, 0.05, 0.03, 12),
        {
          p: [0.02, 0.05, 0],
          r: [tt, 0, 0],
        },
        0.9,
      ),
        t.add(
          "steel_galv",
          cylinderGeometry(0.02, 0.02, 0.034, 6),
          {
            p: [0.02, 0.05, 0],
            r: [tt, 0, 0],
          },
          0.6,
        ),
        t.pop());
    }
  (t.label(
    e.label || "MAINT " + (1 + (t.seed % 2)),
    {
      color: "white",
      font: "stencil",
      distress: 0.4,
    },
    0.3,
    0.07,
    {
      p: [a + l / 2 + 0.002, 0.6, 0],
      r: [0, tt, 0],
    },
  ),
    t.decal(i.mats.decal("logo_d"), 0.2, {
      p: [a + l / 2 + 0.002, 0.42, 0],
      r: [0, tt, 0],
    }),
    t.decal(i.mats.decal("grime_streak"), 0.3, {
      p: [a, 0.45, -h - 0.002],
      r: [0, At, 0],
    }));
  let v = u + 0.006;
  (t.push({
    p: [a - 0.18, v, 0.08],
    r: [0, 0.5, 0],
  }),
    t.add(
      "steel_bare",
      Ge(0.2, 0.006, 0.02, 0.002),
      {
        p: [0, 0.004, 0],
      },
      0.9,
    ),
    t.add(
      "steel_bare",
      ja(0.016, 0.006, 4, 10),
      {
        p: [0.11, 0.005, 0],
        r: [tt, 0, 0],
      },
      0.9,
    ),
    t.add(
      "steel_bare",
      ja(0.017, 0.006, 4, 7, At * 1.4),
      {
        p: [-0.112, 0.005, 0],
        r: [tt, 0, 2.2],
      },
      0.9,
    ),
    t.pop(),
    t.push({
      p: [a + 0.02, v, -0.1],
      r: [0, -0.3, 0],
    }),
    t.add(
      "wood_pallet",
      vn([-0.14, 0.014, 0], [0.12, 0.016, 0], 0.012, 6, !0, 0.01),
      null,
      0.9,
    ),
    t.add(
      "steel_dark",
      Ge(0.032, 0.03, 0.1, 0.006),
      {
        p: [0.125, 0.017, 0.005],
      },
      0.8,
    ),
    t.pop(),
    t.push({
      p: [a + 0.2, v, 0.1],
      r: [0, 0.12, 0],
    }),
    t.add(
      "polymer_black",
      Ge(0.22, 0.014, 0.05, 0.004),
      {
        p: [0, 0.007, 0],
      },
      0.6,
    ));
  for (let y = 0; y < 6; y++)
    t.add(
      "steel_bare",
      cylinderGeometry(0.008 + y * 0.0014, 0.008 + y * 0.0014, 0.03, 8),
      {
        p: [-0.085 + y * 0.034, 0.029, 0],
      },
      0.9,
    );
  (t.pop(),
    t.add(
      "plastic_blue",
      cylinderGeometry(0.032, 0.032, 0.13, 12),
      {
        p: [a + 0.28, v + 0.065, -0.12],
      },
      0.9,
    ),
    t.add(
      "steel_bare",
      us(
        [
          [0.032, 0],
          [0.028, 0.012],
          [0.014, 0.018],
          [0.014, 0.018],
          [0.014, 0.03],
          [0, 0.03],
        ],
        10,
      ),
      {
        p: [a + 0.28, v + 0.13, -0.12],
      },
      0.9,
    ),
    t.add(
      "plastic_red",
      cylinderGeometry(0.012, 0.012, 0.014, 8),
      {
        p: [a + 0.28, v + 0.165, -0.12],
      },
      0.95,
    ),
    t.add(
      "paint_yellow",
      vn(
        [a - 0.3, v + 0.012, -0.13],
        [a - 0.2, v + 0.012, -0.16],
        0.014,
        7,
        !0,
      ),
      null,
      0.9,
    ),
    t.add(
      "steel_bare",
      vn(
        [a - 0.2, v + 0.012, -0.16],
        [a - 0.08, v + 0.01, -0.196],
        0.004,
        5,
        !0,
      ),
      null,
      0.9,
    ));
  let g = eo(0.2, 0.02, 0.15, 0.009, 4, 3, 4),
    x = n() * 9;
  return (
    to(g, (y) => {
      ((y.y += 0.012 * gn(y.x * 30 + x, y.z * 30) * (y.y > 0 ? 1 : 0)),
        (y.x += 0.012 * (gn(y.z * 20, x) - 0.5)));
    }),
    t.add(
      t.mat("glove_fabric", {
        color: 8203044,
      }),
      gr(g),
      {
        p: [a - 0.26, v + 0.01, 0.12],
        r: [0, 0.8, 0],
      },
      0.9,
    ),
    t.finish()
  );
}

function registerCargoProps(i) {
  (i("forklift", (e, t = {}) => oR(e, t)),
    i("generator", (e, t = {}) => rR(e, t)),
    i("dumpster", (e, t = {}) => aR(e, t)),
    i("toolbox_cart", (e, t = {}) => lR(e, t)));
}

export { registerCargoProps };
