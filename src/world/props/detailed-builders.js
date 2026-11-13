import { THREE } from "../../vendor/three-r180.js";
import {
  boxGeometry,
  cylinderGeometry,
  tubeGeometry,
} from "../../core/geometry.js";
import {
  $3,
  At,
  Ge,
  HA,
  Ja,
  Kn,
  M1,
  Mo,
  eo,
  gn,
  gr,
  j3,
  ja,
  to,
  tt,
  us,
  vn,
  vr,
  w1,
  wf,
  zi,
} from "./detail-geometry.js";

function S1(i, e, { broken: t = !1, stamp: n = !0, bevel: s = !1 } = {}) {
  let o = s
      ? (u, h, f) => Ge(u, h, f, 0.004)
      : (u, h, f) => boxGeometry(u, h, f),
    r = () => {
      let u = e.range(0.62, 1),
        h = e.range(0.9, 1);
      return [u, u * (0.93 + 0.07 * h), u * (0.82 + 0.18 * h)];
    },
    a = (u = 0.003) => e.range(-u, u);
  for (let [u, h] of [
    [-0.45, 0.1],
    [0, 0.145],
    [0.45, 0.1],
  ])
    i.add(
      "wood_pallet",
      o(1.2, 0.022, h),
      {
        p: [a(), 0.011, u + a()],
        r: [0, a(0.006), 0],
      },
      r(),
    );
  let l = (u, h, f = 0.012) => [
    [-u / 2 + f, -h / 2],
    [u / 2 - f, -h / 2],
    [u / 2, -h / 2 + f],
    [u / 2, h / 2 - f],
    [u / 2 - f, h / 2],
    [-u / 2 + f, h / 2],
    [-u / 2, h / 2 - f],
    [-u / 2, -h / 2 + f],
  ];
  for (let u of [-0.5275, 0, 0.5275])
    for (let h of [-0.45, 0, 0.45])
      i.add(
        "wood_pallet",
        Mo(l(0.145, h === 0 ? 0.145 : 0.1), 0.078, {
          caps: !1,
          soft: 0,
        }),
        {
          p: [u + a(), 0.061, h + a()],
          r: [-tt, a(0.03), 0],
        },
        r().map((f) => f * 0.8),
      );
  for (let u of [-0.5275, 0, 0.5275])
    i.add(
      "wood_pallet",
      o(0.145, 0.022, 1),
      {
        p: [u + a(), 0.111, a()],
        r: [0, a(0.006), 0],
      },
      r(),
    );
  if (
    ([
      [-0.4275, 0.145],
      [-0.215, 0.1],
      [0, 0.145],
      [0.215, 0.1],
      [0.4275, 0.145],
    ].forEach(([u, h], f) => {
      (t && f === 3) ||
        i.add(
          "wood_pallet",
          o(1.2, 0.022, h),
          {
            p: [a(), 0.133, u + a(0.006)],
            r: [a(0.004), a(0.008), 0],
          },
          r(),
        );
    }),
    n)
  ) {
    let u = i.G.mats.label("EUR", {
      color: "black",
      font: "sans",
      distress: 0.6,
    });
    (i.decal(u, 0.085, {
      p: [-0.5275, 0.062, 0.5015],
    }),
      i.decal(u, 0.085, {
        p: [0.5275, 0.062, -0.5015],
        r: [0, At, 0],
      }));
  }
}

function VA(i, e, t) {
  let n = new Kn(i, "pallet", t);
  return (
    S1(n, n.rng, {
      broken: !!e.broken,
      bevel: !0,
    }),
    n.finish()
  );
}

function WA(i, e) {
  let t = new Kn(i, "pallet_stack", e.seed || 0),
    n = t.rng,
    s = zi(e.count | 0 || 8, 1, 12);
  for (let o = 0; o < s; o++) {
    let r = o === s - 1;
    (t.push({
      p: [
        o ? n.range(-0.028, 0.028) : 0,
        o * 0.144,
        o ? n.range(-0.022, 0.022) : 0,
      ],
      r: [
        0,
        n.range(-0.035, 0.035) +
          (n() < 0.3 ? At : 0) +
          (r ? n.range(-0.06, 0.06) : 0),
        0,
      ],
    }),
      S1(t, n, {
        broken: !r && n() < 0.2,
        stamp: o % 3 === 0,
        bevel: r,
      }),
      t.pop());
  }
  return t.finish({
    size: [1.2, s * 0.144, 1],
  });
}

function E1(
  i,
  e,
  t,
  n,
  {
    detail: s = !0,
    label: o = "FRAGILE",
    code: r = "B4-117",
    skids: a = !0,
  } = {},
) {
  let l = i.rng,
    c = i.G,
    u = 0.022,
    h = 0.07,
    f = a ? 0.07 : 0,
    p = t - f,
    d = f + p / 2,
    v = (z = 1) => {
      let H = l.range(0.7, 1) * z;
      return [H, H * l.range(0.92, 1), H * l.range(0.82, 0.95)];
    },
    g = s ? (z, H, O) => Ge(z, H, O, 0.004) : (z, H, O) => boxGeometry(z, H, O);
  if (a)
    for (let z of [-(e / 2 - 0.13), 0, e / 2 - 0.13])
      i.add(
        "wood_pallet",
        Ge(0.09, f, n - 0.02, 0.006),
        {
          p: [z, f / 2, 0],
        },
        v(0.6),
      );
  i.add(
    "wood_dark",
    boxGeometry(e - 2 * u - 0.012, p - u - 0.012, n - 2 * u - 0.012),
    {
      p: [0, f + (p - u - 0.012) / 2 + 0.002, 0],
    },
    0.25,
  );
  let x = Math.max(3, Math.round(p / 0.125)),
    y = p / x;
  for (let z = 0; z < x; z++) {
    let H = f + y * (z + 0.5);
    for (let [O, q, U] of [
      ["pz", e, n / 2 - u],
      ["nz", e, n / 2 - u],
      ["px", n, e / 2 - u],
      ["nx", n, e / 2 - u],
    ]) {
      let T = U - l.range(0, 0.004),
        D =
          O === "pz"
            ? [0, H, T]
            : O === "nz"
              ? [0, H, -T]
              : O === "px"
                ? [T, H, 0]
                : [-T, H, 0];
      i.add(
        "wood_pallet",
        $3(q - 0.03, y - 0.005, l() * 3, l() * 3),
        {
          p: D,
          r: w1[O],
        },
        v(),
      );
    }
  }
  let b = Math.max(3, Math.round(n / 0.13)),
    m = (n - 0.02) / b;
  for (let z = 0; z < b; z++)
    i.add(
      "wood_pallet",
      $3(e - 0.03, m - 0.005, l() * 3, l() * 3),
      {
        p: [0, t - u - l.range(0, 0.003), -n / 2 + 0.01 + m * (z + 0.5)],
        r: [-tt, 0, 0],
      },
      v(),
    );
  let A = Math.atan2(p - 2 * h, e - 2 * h),
    _ = Math.hypot(e - 2 * h, p - 2 * h);
  for (let z of [1, -1]) {
    let H = z * (n / 2 - u / 2);
    (i.add(
      "wood_pallet",
      g(e, h, u),
      {
        p: [0, f + h / 2, H],
      },
      v(0.85),
    ),
      i.add(
        "wood_pallet",
        g(e, h, u),
        {
          p: [0, t - h / 2, H],
        },
        v(0.85),
      ));
    for (let U of [1, -1])
      i.add(
        "wood_pallet",
        g(h, p - 2 * h, u),
        {
          p: [U * (e / 2 - h / 2), d, H],
        },
        v(0.85),
      );
    s &&
      i.add(
        "wood_pallet",
        Ge(_, h * 0.85, u * 0.8, 0.004),
        {
          p: [0, d, z * (n / 2 - u * 0.6)],
          r: [0, 0, z * A],
        },
        v(0.8),
      );
    let O = z * (e / 2 - u / 2),
      q = n - 2 * u;
    for (let U of [1, -1])
      i.add(
        "wood_pallet",
        g(u, p, h),
        {
          p: [O, d, U * (q / 2 - h / 2)],
        },
        v(0.85),
      );
    (i.add(
      "wood_pallet",
      g(u, h, q - 2 * h),
      {
        p: [O, f + h / 2, 0],
      },
      v(0.85),
    ),
      i.add(
        "wood_pallet",
        g(u, h, q - 2 * h),
        {
          p: [O, t - h / 2, 0],
        },
        v(0.85),
      ),
      i.add(
        "wood_pallet",
        g(e, u, h),
        {
          p: [0, t - u / 2, z * (n / 2 - h / 2)],
        },
        v(0.85),
      ),
      i.add(
        "wood_pallet",
        g(h, u, n - 2 * h),
        {
          p: [z * (e / 2 - h / 2), t - u / 2, 0],
        },
        v(0.85),
      ));
  }
  s &&
    i.add(
      "wood_pallet",
      Ge(h, u, n - 2 * h, 0.004),
      {
        p: [0, t - u / 2, 0],
      },
      v(0.85),
    );
  let M = 0.085,
    E = () => {
      let z = l.range(0.55, 0.9);
      return [z, z * 0.9, z * 0.8];
    };
  for (let z of [1, -1])
    for (let H of [1, -1])
      for (let O of s ? [1, 0] : [1]) {
        let q = O ? t - M / 2 : f + M / 2,
          U = E();
        (i.add(
          "steel_galv",
          boxGeometry(M, M, 0.003),
          {
            p: [z * (e / 2 - M / 2), q, H * (n / 2 + 0.0015)],
          },
          U,
        ),
          i.add(
            "steel_galv",
            boxGeometry(0.003, M, M),
            {
              p: [z * (e / 2 + 0.0015), q, H * (n / 2 - M / 2)],
            },
            U,
          ),
          O &&
            i.add(
              "steel_galv",
              boxGeometry(M, 0.003, M),
              {
                p: [z * (e / 2 - M / 2), t + 0.0015, H * (n / 2 - M / 2)],
              },
              U,
            ));
      }
  let w = n / 2 - u + 0.003,
    S = Math.min(0.11, p * 0.15);
  (o &&
    (i.label(
      o,
      {
        color: "black",
        font: "stencil",
        distress: 0.25,
      },
      e * 0.4,
      S,
      {
        p: [-e * 0.2, t - h - S * 0.95, w],
      },
    ),
    i.label(
      o,
      {
        color: "black",
        font: "stencil",
        distress: 0.25,
      },
      e * 0.4,
      S,
      {
        p: [e * 0.2, t - h - S * 0.95, -w],
        r: [0, At, 0],
      },
    ),
    i.decal(c.mats.decal("arrow"), Math.min(0.14, p * 0.2), {
      p: [e * 0.27, f + h + p * 0.16, w],
      r: [0, 0, tt],
    })),
    r &&
      i.label(
        r,
        {
          color: "black",
          font: "stencil",
          distress: 0.3,
        },
        n * 0.5,
        S * 0.9,
        {
          p: [e / 2 - u + 0.003, d + p * 0.12, 0],
          r: w1.px,
        },
      ),
    s &&
      i.decal(c.mats.decal("logo_b"), Math.min(0.2, p * 0.25), {
        p: [-(e / 2 - u + 0.003), d - p * 0.05, 0],
        r: w1.nx,
      }));
}

function GA(i, e) {
  let t = new Kn(i, "crate_wood", e.seed || 0);
  return (
    E1(t, 1.1, 1, 0.9, {
      label:
        e.label === void 0
          ? ["FRAGILE", "THIS SIDE UP", "KEEP DRY", "MACHINE PARTS"][t.seed % 4]
          : e.label,
      code: e.code || "B4-" + [117, 204, 318][t.seed % 3],
    }),
    t.finish()
  );
}

function qA(i, e) {
  let t = new Kn(i, "crate_stack", e.seed || 0),
    n = t.rng;
  E1(t, 1.2, 0.95, 1, {
    label: "HEAVY",
    code: "SLT 04" + (t.seed % 2),
  });
  let s = {
    x: n.range(-0.1, 0.02),
    z: n.range(-0.05, 0.05),
    th: (n() < 0.5 ? -1 : 1) * n.range(0.1, 0.16),
    L: 0.86,
    W: 0.72,
  };
  (t.push({
    p: [s.x, 0.95, s.z],
    r: [0, s.th, 0],
  }),
    E1(t, s.L, 0.6, s.W, {
      detail: !1,
      skids: !1,
      label: "FRAGILE",
      code: "B4-204",
    }),
    t.pop());
  let o = {
    x: s.x + n.range(-0.05, 0.05),
    z: s.z + n.range(-0.04, 0.04),
    th: n.range(-0.12, 0.12),
  };
  (t.push({
    p: [o.x, 1.55, o.z],
    r: [0, o.th, 0],
  }),
    E1(t, 0.55, 0.35, 0.45, {
      detail: !1,
      skids: !1,
      label: "",
      code: "",
    }),
    t.pop());
  let r = (a, l, c, u, h) => {
    let f = (a - l.x - h * u * Math.sin(c)) / Math.cos(c);
    return l.z - f * Math.sin(c) + h * u * Math.cos(c);
  };
  for (let a of [-0.2, 0.17]) {
    let c = [],
      u = (h) => [
        [a, 0.09, h * 0.506],
        [a, 0.956, h * 0.506],
        [a, 1.556, r(a, s, s.th, s.W / 2, h) + h * 0.006],
        [a, 1.906, r(a, o, o.th, 0.225, h) + h * 0.006],
      ];
    (c.push(...u(1), ...u(-1).reverse()),
      t.add("paint_orange", vr(c, [0.02, 0, 0]), null, [1, 0.8, 0.5]),
      t.add(
        "steel_worn",
        Ge(0.06, 0.09, 0.025, 0.006),
        {
          p: [a, 0.62, 0.5 + 0.016],
        },
        0.8,
      ),
      t.add(
        "steel_dark",
        vn([a - 0.035, 0.66, 0.53], [a + 0.035, 0.66, 0.53], 0.008, 6, !0),
        null,
        0.8,
      ));
  }
  return t.finish();
}

function XA(i, e) {
  let t = new Kn(i, "ibc_tote", e.seed || 0),
    n = t.rng,
    s = () => n.range(0.75, 1);
  for (let y of [-0.44, 0, 0.44])
    t.add(
      "steel_galv",
      boxGeometry(1.2, 0.028, 0.1),
      {
        p: [0, 0.014, y],
      },
      s(),
    );
  for (let y of [-0.54, 0, 0.54])
    for (let b of [-0.44, 0, 0.44])
      t.add(
        "steel_galv",
        Ge(0.12, 0.074, 0.1, 0.008),
        {
          p: [y, 0.065, b],
        },
        s() * 0.85,
      );
  for (let y of [-0.48, 0.48])
    t.add(
      "steel_galv",
      Ge(1.2, 0.03, 0.04, 0.006),
      {
        p: [0, 0.115, y],
      },
      s(),
    );
  for (let y of [-0.58, 0.58])
    t.add(
      "steel_galv",
      Ge(0.04, 0.03, 0.92, 0.006),
      {
        p: [y, 0.115, 0],
      },
      s(),
    );
  t.add(
    "steel_galv",
    boxGeometry(1.12, 0.012, 0.92),
    {
      p: [0, 0.124, 0],
    },
    0.6,
  );
  let o = 1.1,
    r = 0.95,
    a = 0.9,
    l = 0.13 + r / 2,
    c = eo(o, r, a, 0.07, 8, 6, 8);
  (to(c, (y) => {
    let b = y.x / (o / 2),
      m = y.y / (r / 2),
      A = y.z / (a / 2),
      _ = Math.cos(tt * m) * Math.cos(tt * A),
      M = Math.cos(tt * b) * Math.cos(tt * A),
      E = Math.cos(tt * b) * Math.cos(tt * m);
    (Math.abs(b) > 0.9 &&
      (y.x +=
        Math.sign(b) *
        (0.016 * _ + 0.004 * Math.abs(Math.sin((y.y * At) / 0.22)) * _)),
      Math.abs(A) > 0.9 &&
        (y.z +=
          Math.sign(A) *
          (0.016 * E + 0.004 * Math.abs(Math.sin((y.y * At) / 0.22)) * E)),
      m > 0.9 &&
        (y.y +=
          0.012 * M - 0.01 * Math.max(0, 1 - Math.hypot(y.x, y.z) / 0.3)));
  }),
    gr(c));
  let u = 0.13 + r * n.range(0.45, 0.8),
    h = t.seed * 1.3,
    f = t.mat("plastic_grey", {
      color: 14278096,
    });
  (t.add(
    f,
    c,
    {
      p: [0, l, 0],
    },
    (y, b, m) => {
      let A = j3(u - 0.03, u + 0.03, b + 0.02 * gn(y * 3 + h, m * 3)),
        _ = 0.9 + 0.1 * gn(y * 6, b * 6 + h, m * 6);
      return [
        _ * (0.52 + 0.48 * A),
        _ * (0.6 + 0.4 * A),
        _ * (0.66 + 0.34 * A),
      ];
    },
  ),
    t.add(
      f,
      cylinderGeometry(0.12, 0.125, 0.03, 14),
      {
        p: [0, 0.13 + r + 0.005, 0],
      },
      0.9,
    ),
    t.add(
      "plastic_red",
      us(
        [
          [0.105, 0],
          [0.105, 0.042],
          [0.105, 0.042],
          [0.09, 0.05],
          [0, 0.05],
        ],
        14,
      ),
      {
        p: [0, 0.13 + r + 0.015, 0],
      },
      0.9,
    ));
  for (let y = 0; y < 8; y++) {
    let b = (y * At) / 4;
    t.add(
      "plastic_red",
      boxGeometry(0.012, 0.04, 0.02),
      {
        p: [Math.cos(b) * 0.108, 0.13 + r + 0.036, Math.sin(b) * 0.108],
        r: [0, -b, 0],
      },
      0.8,
    );
  }
  let p = 0.575,
    d = 0.475,
    v = 0.13,
    g = 1.1,
    x = 0.011;
  for (let y of [0.2, 0.42, 0.64, 0.86, g]) {
    let b = y === g ? 0.014 : x;
    for (let m of [1, -1])
      (t.add("steel_galv", vn([-p, y, m * d], [p, y, m * d], b, 5), null, s()),
        t.add(
          "steel_galv",
          vn([m * p, y, -d], [m * p, y, d], b, 5),
          null,
          s(),
        ));
  }
  for (let y of [1, -1]) {
    for (let b = -0.46; b <= 0.461; b += 0.184)
      t.add(
        "steel_galv",
        vn([b, v, y * (d - 0.012)], [b, g, y * (d - 0.012)], x, 5),
        null,
        s(),
      );
    for (let b = -0.36; b <= 0.361; b += 0.18)
      t.add(
        "steel_galv",
        vn([y * (p - 0.012), v, b], [y * (p - 0.012), g, b], x, 5),
        null,
        s(),
      );
    t.add(
      "steel_galv",
      vn([y * 0.28, g + 0.01, -d], [y * 0.28, g + 0.01, d], 0.013, 5),
      null,
      s(),
    );
  }
  return (
    t.add(
      "aluminium",
      Ge(0.42, 0.3, 0.004, 0.0015),
      {
        p: [-0.1, 0.72, d + 0.014],
      },
      0.85,
    ),
    t.label(
      "IBC 1000 L",
      {
        color: "black",
        font: "sans",
        distress: 0.2,
      },
      0.36,
      0.06,
      {
        p: [-0.1, 0.8, d + 0.0175],
      },
    ),
    t.decal(
      i.mats.decal(["hazard_flammable", "hazard_general"][t.seed % 2]),
      0.15,
      {
        p: [-0.19, 0.67, d + 0.0175],
      },
    ),
    t.decal(i.mats.decal("numbers_0_9"), 0.2, {
      p: [0, 0.66, d + 0.0175],
    }),
    t.decal(i.mats.decal("leak_stain"), 0.3, {
      p: [p + 0.004, 0.3, 0.02],
      r: w1.px,
    }),
    t.add(
      "polymer_black",
      vn([0.52, 0.2, 0], [0.575, 0.2, 0], 0.05, 10, !0),
      null,
      1,
    ),
    t.add(
      "plastic_red",
      vn([0.575, 0.2, 0], [0.598, 0.2, 0], 0.045, 10, !0),
      null,
      0.9,
    ),
    t.add(
      "plastic_red",
      Ge(0.02, 0.022, 0.13, 0.005),
      {
        p: [0.55, 0.262, 0.02],
        r: [0, 0.4, 0],
      },
      0.9,
    ),
    t.add("polymer_black", cylinderGeometry(0.012, 0.012, 0.03, 6), {
      p: [0.55, 0.245, 0],
    }),
    t.finish()
  );
}

function Z3(i, e, t, n = 0) {
  let s = [],
    o = (2 * i) / e;
  for (let r = 0; r < e; r++) {
    let a = -i + r * o + 0.003,
      l = -i + (r + 1) * o - 0.003,
      c = [a, (a + l) / 2, l],
      u = [],
      h = [],
      f = [],
      p = [],
      d = (y) => Math.sqrt(Math.max(0, i * i - y * y)),
      v = t() * 2,
      g = t() * 2;
    for (let y of c)
      (u.push(y, -d(y), 0, y, d(y), 0),
        h.push(0, 0, 1, 0, 0, 1),
        f.push(-d(y) + v, y + g, d(y) + v, y + g));
    p.push(0, 2, 3, 0, 3, 1, 2, 4, 5, 2, 5, 3);
    let x = new THREE.BufferGeometry();
    (x.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(u), 3),
    ),
      x.setAttribute(
        "normal",
        new THREE.BufferAttribute(new Float32Array(h), 3),
      ),
      x.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(f), 2)),
      x.setIndex(p),
      s.push(x));
  }
  return s;
}

function YA(i, e) {
  let t = new Kn(i, "cable_reel", e.seed || 0),
    n = t.rng,
    s = 0.65,
    o = s,
    r = 0.4,
    a = 0.045,
    l = (y = 1) => {
      let b = n.range(0.7, 1) * y;
      return [b, b * n.range(0.93, 1), b * n.range(0.85, 0.97)];
    },
    c = n.range(-0.5, 0.5);
  t.push({
    p: [0, o, 0],
    r: [0, 0, c],
  });
  for (let y of [1, -1]) {
    for (let b of Z3(s - 0.004, 9, n))
      t.add(
        "wood_dark",
        b,
        {
          p: [0, 0, y * (r + n.range(0, 0.003))],
          r: [0, y > 0 ? 0 : At, 0],
        },
        l(),
      );
    for (let b of Z3(s - 0.004, 9, n))
      t.add(
        "wood_dark",
        b,
        {
          p: [0, 0, y * (r - a)],
          r: [0, y > 0 ? At : 0, tt],
        },
        l(0.8),
      );
    (t.add(
      "wood_dark",
      cylinderGeometry(s, s, a, 24, !0),
      {
        p: [0, 0, y * (r - a / 2)],
        r: [tt, 0, 0],
      },
      l(0.75),
    ),
      t.add(
        "steel_dark",
        cylinderGeometry(0.105, 0.105, 0.008, 12),
        {
          p: [0, 0, y * (r + 0.006)],
          r: [tt, 0, 0],
        },
        0.9,
      ),
      t.add(
        "polymer_black",
        cylinderGeometry(0.04, 0.04, 0.004, 10),
        {
          p: [0, 0, y * (r + 0.0105)],
          r: [tt, 0, 0],
        },
        0.3,
      ));
    for (let b = 0; b < 6; b++) {
      let m = (b * At) / 3 + 0.3;
      t.add(
        "steel_galv",
        cylinderGeometry(0.017, 0.017, 0.014, 6),
        {
          p: [Math.cos(m) * 0.3, Math.sin(m) * 0.3, y * (r + 0.006)],
          r: [tt, 0, 0],
        },
        n.range(0.5, 0.9),
      );
    }
    (t.label(
      y > 0 ? "NYY-J 4x95 mm2  500 m" : "SALTLINE TERMINAL",
      {
        color: "white",
        font: "stencil",
        distress: 0.45,
      },
      0.7,
      0.085,
      {
        p: [0, 0.4, y * (r + 0.006)],
        r: [0, y > 0 ? 0 : At, 0],
      },
    ),
      y > 0 &&
        t.decal(i.mats.decal("arrow"), 0.2, {
          p: [0.36, -0.2, r + 0.006],
          r: [0, 0, -1.2],
        }));
  }
  let u = 16,
    h = r - a,
    f = (2 * h) / u,
    p = 0.47,
    d = [];
  for (let y = 0; y <= u; y++)
    (d.push([p - 0.017, -h + y * f]), y < u && d.push([p, -h + (y + 0.5) * f]));
  let v = t.seed * 0.7;
  (t.add(
    "rubber",
    us(d, 20),
    {
      r: [tt, 0, 0],
    },
    (y, b, m) => 0.7 + 0.5 * gn(Math.atan2(b, y) * 2 + v, m * 30),
  ),
    t.pop());
  let g = 0.2,
    x = [];
  for (let y = 1.9; y >= -0.25; y -= 0.36)
    x.push([
      Math.cos(y) * (p + 0.012),
      o + Math.sin(y) * (p + 0.012),
      g + (1.9 - y) * 0.02,
    ]);
  (x.push(
    [0.53, 0.3, g + 0.05],
    [0.56, 0.08, g + 0.06],
    [0.5, 0.024, g + 0.02],
    [0.3, 0.022, g - 0.1],
    [0.05, 0.022, g - 0.02],
    [-0.2, 0.022, g + 0.06],
    [-0.38, 0.022, g - 0.05],
  ),
    t.add("rubber", tubeGeometry(x, 0.02, 6, !1, 0.5), null, 0.9),
    t.add(
      "brass",
      vn([-0.38, 0.022, g - 0.05], [-0.41, 0.022, g - 0.07], 0.014, 6, !0),
      null,
      0.9,
    ));
  for (let y of [r - a / 2, -(r - a / 2)])
    (t.add(
      "wood_pallet",
      Mo(
        [
          [0.14, 0],
          [0.37, 0],
          [0.37, 0.1],
        ],
        0.1,
        {
          soft: 0,
        },
      ),
      {
        p: [0, 0, y],
      },
      l(0.8),
    ),
      t.add(
        "wood_pallet",
        Mo(
          [
            [-0.37, 0],
            [-0.14, 0],
            [-0.37, 0.1],
          ],
          0.1,
          {
            soft: 0,
          },
        ),
        {
          p: [0, 0, y],
        },
        l(0.8),
      ));
  return t.finish();
}

function tv(i, e, t, n = 20) {
  let s = i - t,
    o = Math.min(0.011, s * 0.08),
    r = [
      [t, e * 0.18],
      [t + s * 0.45, e * 0.035],
      [i - s * 0.2, e * 0.02],
      [i - s * 0.06, e * 0.07],
      [i, e * 0.17],
      [i, e * 0.17],
      [i, e * 0.355],
      [i - o, e * 0.385],
      [i, e * 0.415],
      [i, e * 0.585],
      [i - o, e * 0.615],
      [i, e * 0.645],
      [i, e * 0.83],
      [i, e * 0.83],
      [i - s * 0.06, e * 0.93],
      [i - s * 0.2, e * 0.98],
      [t + s * 0.45, e * 0.965],
      [t, e * 0.82],
      [t, e * 0.82],
      [t, e * 0.18],
    ],
    a = us(r, n),
    l = a.attributes.uv,
    c = r.length,
    u = [0];
  for (let v = 1; v < c; v++)
    u.push(u[v - 1] + Math.hypot(r[v][0] - r[v - 1][0], r[v][1] - r[v - 1][1]));
  let h = (u[8] + u[9]) / 2,
    f = h - u[4],
    p = u[4] - u[0],
    d = Math.max(1, Math.round((2 * At * i) / 0.5)) * 0.5;
  for (let v = 0; v < c; v++) {
    let g = v >= c - 2 ? -(f + p) : u[v] - h,
      x = Math.abs(g),
      y =
        Math.sign(g) *
        (x <= f + 1e-6
          ? (x / f) * 0.126
          : 0.126 + Math.min(1, (x - f) / p) * 0.022);
    for (let b = 0; b <= n; b++) l.setXY(v * (n + 1) + b, (b / n) * d, y);
  }
  return a;
}

function $A(i, e) {
  let t = new Kn(i, "tire_stack", e.seed || 0),
    n = t.rng,
    s = zi(e.count | 0 || 4, 1, 5);
  for (let o = 0; o < s; o++) {
    let r = tv(0.39, 0.25, 0.215, s > 4 ? 16 : 20),
      a = {
        p: [
          o ? n.range(-0.022, 0.022) : 0,
          o * 0.25 - (o ? 0.004 : 0),
          o ? n.range(-0.022, 0.022) : 0,
        ],
        r: [0, n() * 6, 0],
      },
      l = n.range(0.75, 1),
      c = o * 3.1;
    t.add("tire", r, a, (u, h, f) => {
      let p = Math.hypot(u - a.p[0], f - a.p[2]);
      return (
        l * (p < 0.23 ? 0.5 : 0.8 + 0.2 * gn(Math.atan2(f, u) * 3 + c, p * 30))
      );
    });
  }
  return t.finish({
    size: [0.8, s * 0.25, 0.8],
  });
}

function ZA(i, e, t) {
  let n = new Kn(i, "jerry_can", t),
    [s, o] = Ja(e.color, "olive"),
    r = eo(0.336, 0.36, 0.156, 0.022, 3, 3, 3, "bottom"),
    a = (x, y) => (y > 0.3 && x > 0.04 ? y - (x - 0.04) * 0.5 : y);
  (to(r, (x) => {
    ((x.y = a(x.x, x.y)),
      Math.abs(x.z) > 0.07 &&
        Math.abs(x.x) < 0.14 &&
        x.y > 0.04 &&
        x.y < 0.3 &&
        (x.z *= 1.02));
  }),
    r.computeVertexNormals(),
    n.add(s, r, null, o),
    n.add(
      s,
      Mo(
        [
          [-0.172, 0],
          [0.172, 0],
          [0.172, 0.297],
          [0.045, 0.364],
          [-0.172, 0.364],
        ],
        0.007,
        {
          soft: 0,
        },
      ),
      null,
      typeof o == "number" ? 0.8 : o.map((x) => x * 0.8),
    ));
  let l = 0.24,
    c = 0.2,
    u = -0.025,
    h = 0.165,
    f = Math.hypot(l, c) - 0.02,
    p = Math.atan2(c, l);
  for (let x of [1, -1]) {
    let y = x * 0.079;
    for (let b of [1, -1])
      n.add(
        s,
        Ge(l, 0.016, 0.007, 0.003),
        {
          p: [u, h + (b * c) / 2, y],
        },
        o,
      );
    for (let b of [1, -1])
      n.add(
        s,
        Ge(0.016, c, 0.007, 0.003),
        {
          p: [u + (b * l) / 2, h, y],
        },
        o,
      );
    for (let b of [1, -1])
      n.add(
        s,
        Ge(f, 0.018, 0.008, 0.003),
        {
          p: [u, h, y],
          r: [0, 0, b * p],
        },
        o,
      );
  }
  for (let x of [-0.042, 0, 0.042])
    n.add(
      s,
      tubeGeometry(
        [
          [-0.135, 0.35, x],
          [-0.125, 0.42, x],
          [-0.09, 0.44, x],
          [-0.02, 0.44, x],
          [0.01, 0.42, x],
          [0.02, 0.35, x],
        ],
        0.0105,
        5,
        !1,
        0.5,
      ),
      null,
      o,
    );
  let d = [0.1, 0.33, 0],
    v = [0.42, 0.9, 0],
    g = (x) => [d[0] + v[0] * x, d[1] + v[1] * x, 0];
  return (
    n.add(s, vn(g(-0.02), g(0.07), 0.03, 8, !0), null, o),
    n.add("steel_dark", vn(g(0.07), g(0.1), 0.036, 8, !0), null, 0.9),
    n.add(
      "steel_galv",
      Ge(0.07, 0.008, 0.02, 0.002),
      {
        p: g(0.108),
        r: [0, 0, -0.44],
      },
      0.8,
    ),
    n.decal(i.mats.decal("hazard_flammable"), 0.055, {
      p: [0.125, 0.25, 0.0795],
    }),
    n.decal(i.mats.decal("hazard_flammable"), 0.055, {
      p: [-0.125, 0.25, -0.0795],
      r: [0, At, 0],
    }),
    n.finish()
  );
}

function jA(i, e, t) {
  let n = new Kn(i, "traffic_cone", t),
    s = n.rng,
    o = t * 4.1;
  e.lying &&
    (n.push({
      p: [-0.34, 0.18, 0],
      r: [0, s() * 6, 0],
    }),
    n.push({
      r: [0, 0, -tt + 0.16],
    }));
  let r = (h) => 0.128 + ((0.031 - 0.128) * (h - 0.05)) / (0.685 - 0.05);
  n.add("rubber", Ge(0.36, 0.03, 0.36, 0.008, "bottom"), null, 0.9);
  let a = (h, f, p) => {
      let d = gn(Math.atan2(p, h) * 3 + o, f * 14);
      return d > 0.68 ? 0.45 : 0.85 + 0.15 * d;
    },
    l = (h, f, p = [], d = []) => us([...p, [r(h), h], [r(f), f], ...d], 16),
    c = n.mat("plastic_red", {
      color: 12734234,
    }),
    u = n.mat("plastic_grey", {
      color: 13224386,
    });
  return (
    n.add(
      c,
      l(0.05, 0.36, [
        [0.165, 0.03],
        [0.15, 0.04],
        [0.136, 0.05],
      ]),
      null,
      a,
    ),
    n.add(u, l(0.36, 0.5), null, (h, f, p) => 0.85 * a(h, f, p)),
    n.add(c, l(0.5, 0.56), null, a),
    n.add(u, l(0.56, 0.61), null, (h, f, p) => 0.85 * a(h, f, p)),
    n.add(
      c,
      l(
        0.61,
        0.685,
        [],
        [
          [0.028, 0.696],
          [0.018, 0.7],
          [0.018, 0.7],
          [0, 0.7],
        ],
      ),
      null,
      a,
    ),
    e.lying && (n.pop(), n.pop()),
    n.finish(
      e.lying
        ? {
            size: [0.72, 0.36, 0.36],
          }
        : {},
    )
  );
}

function JA(i, e) {
  let t = new Kn(i, "gas_cylinders", e.seed || 0),
    n = t.rng,
    s = 12,
    o = () => n.range(0.6, 0.9);
  t.add("diamond_plate", Ge(0.9, 0.016, 0.5, 0.004, "bottom"), null, 0.8);
  for (let u of [-0.43, 0.43])
    (t.add(
      "steel_dark",
      Ge(0.04, 1.14, 0.04, 0.005),
      {
        p: [u, 0.585, -0.225],
      },
      o(),
    ),
      t.add(
        "steel_dark",
        Ge(0.036, 0.036, 0.43, 0.005),
        {
          p: [u, 1.06, -0.01],
        },
        o(),
      ),
      t.add(
        "steel_dark",
        Ge(0.036, 0.036, 0.43, 0.005),
        {
          p: [u, 0.3, -0.01],
        },
        o(),
      ),
      t.add(
        "steel_dark",
        Ge(0.036, 0.32, 0.036, 0.005),
        {
          p: [u, 0.16, 0.19],
        },
        o(),
      ),
      t.add(
        "steel_galv",
        ja(0.016, 0.004, 4, 8),
        {
          p: [u - Math.sign(u) * 0, 1.06, 0.215],
          r: [0, tt, 0],
        },
        0.8,
      ));
  for (let u of [0.45, 1.06])
    t.add(
      "steel_dark",
      Ge(0.9, 0.04, 0.036, 0.005),
      {
        p: [0, u, -0.225],
      },
      o(),
    );
  (t.add(
    "paint_yellow",
    Ge(0.3, 0.2, 0.004, 0.001),
    {
      p: [0, 0.76, -0.245],
    },
    0.9,
  ),
    t.decal(i.mats.decal("hazard_flammable"), 0.15, {
      p: [0, 0.76, -0.2475],
      r: [0, At, 0],
    }));
  let r = [
      ["paint_red", 1],
      ["paint_white", 1],
      ["paint_blue", 1],
      ["paint_yellow", 1],
      ["paint_grey", 0.5],
    ],
    a = [
      ["paint_grey", 0.75],
      ["paint_grey", 0.55],
      ["paint_red", [0.55, 0.4, 0.4]],
      ["paint_blue", 0.8],
    ];
  for (let u = 0; u < 3; u++) {
    let h = (u - 1) * 0.272,
      f = 1 - n.range(0, 0.05),
      p = 0.115,
      d = r[(t.seed + u * 2) % r.length],
      v = a[(t.seed + u) % a.length],
      g = u * 5.3 + t.seed,
      x = n() * 6;
    (t.push({
      p: [h, 0.016, 0.015 + n.range(-0.01, 0.01)],
      r: [0, x, 0],
      s: [1, f, 1],
    }),
      t.add(
        v[0],
        us(
          [
            [0, 0.012],
            [0.095, 0.012],
            [0.095, 0.012],
            [0.1, 0],
            [0.111, 0],
            [p, 0.008],
            [p, 0.4],
            [p, 0.8],
            [p, 1.22],
          ],
          s,
        ),
        null,
        (y, b, m) => {
          let A = gn(Math.atan2(m, y) * 3 + g, b * 5),
            _ = A > 0.7 ? 0.55 : 1,
            M = typeof v[1] == "number" ? [v[1], v[1], v[1]] : v[1];
          return [
            M[0] * _,
            M[1] * _ * (A > 0.7 ? 0.85 : 1),
            M[2] * _ * (A > 0.7 ? 0.7 : 1),
          ];
        },
      ),
      t.add(
        d[0],
        us(
          [
            [p, 1.22],
            [0.111, 1.285],
            [0.098, 1.34],
            [0.075, 1.385],
            [0.052, 1.41],
            [0.04, 1.42],
          ],
          s,
        ),
        null,
        d[1],
      ),
      t.add(
        "steel_dark",
        us(
          [
            [0.04, 1.42],
            [0.057, 1.42],
            [0.057, 1.42],
            [0.057, 1.448],
            [0.057, 1.448],
            [0.05, 1.452],
            [0.053, 1.53],
            [0.046, 1.565],
            [0.026, 1.585],
            [0, 1.588],
          ],
          s,
        ),
        null,
        0.8,
      ));
    for (let y of [0, At])
      t.add(
        "polymer_black",
        cylinderGeometry(0.016, 0.016, 0.004, 6),
        {
          p: [Math.cos(y) * 0.052, 1.5, Math.sin(y) * 0.052],
          r: [0, -y, tt],
        },
        0.2,
      );
    (u !== 1 &&
      t.cdecal(
        i.mats.decal(u ? "hazard_general" : "hazard_flammable"),
        p + 0.0015,
        0.1,
        {
          p: [0, 1.08, 0],
          r: [0, n.range(-0.5, 0.5) - x, 0],
        },
      ),
      t.cdecal(
        i.mats.label(
          ["ACETYLENE", "OXYGEN", "ARGON", "PROPANE"][(t.seed + u) % 4],
          {
            color: "white",
            font: "stencil",
            distress: 0.4,
          },
        ),
        p + 0.0015,
        0.2,
        {
          p: [0, 0.86, 0],
          r: [0, n.range(-0.4, 0.4) - x, 0],
        },
      ),
      t.pop());
  }
  let l = 19,
    c = (u) => {
      let h = 0.215;
      for (let f = -1; f <= 1; f++) {
        let p = u - f * 0.272;
        Math.abs(p) < 0.115 &&
          (h = Math.max(h, 0.015 + Math.sqrt(0.123 * 0.123 - p * p) + 0));
      }
      return Math.max(h, 0.1);
    };
  for (let u = 0; u < l; u++) {
    let h = u / (l - 1),
      f = -0.425 + 0.85 * h,
      p = Math.max(c(f), c(f - 0.03), c(f + 0.03)) + 0.004,
      d = 1.05 - 0.035 * Math.sin(At * ((h * 3) % 1)) - 0.01;
    t.add(
      "steel_galv",
      ja(0.017, 0.0045, 3, 6),
      {
        p: [f, d, p],
        r: [u % 2 ? tt : 0.15, 0, 0],
        s: [1.35, 1, 1],
      },
      n.range(0.6, 0.95),
    );
  }
  return t.finish();
}

function KA(i, e) {
  let t = new Kn(i, "pipe_stack", e.seed || 0),
    n = t.rng,
    s = 0.1365,
    o = 0.012,
    r = 0.08,
    a = 14,
    l = (h = 1) => {
      let f = n.range(0.6, 0.95) * h;
      return [f, f * 0.95, f * 0.86];
    };
  for (let h of [-2.2, 0, 2.2]) {
    t.add(
      "wood_dark",
      Ge(0.11, r, 1.2, 0.008),
      {
        p: [h + n.range(-0.1, 0.1), r / 2, 0],
        r: [0, n.range(-0.03, 0.03), 0],
      },
      l(),
    );
    for (let f of [1, -1])
      t.add(
        "wood_pallet",
        Mo(
          f > 0
            ? [
                [0, 0],
                [0.158, 0],
                [0.158, 0.1],
              ]
            : [
                [-0.158, 0],
                [0, 0],
                [-0.158, 0.1],
              ],
          0.1,
          {
            soft: 0,
          },
        ),
        {
          p: [h, r, f * 0.44],
          r: [0, -tt, 0],
        },
        l(0.9),
      );
  }
  let c = [4, 3, 2],
    u = 2 * s * Math.sin(At / 3);
  c.forEach((h, f) => {
    for (let p = 0; p < h; p++) {
      let d = (p - (h - 1) / 2) * 2 * s,
        v = r + s + f * u,
        g = n.range(5.78, 5.92),
        x = n.range(-3, 3 - g) * 0.999 + 0,
        y = Math.max(-3, Math.min(3 - g, x)) + g / 2,
        b = n() < 0.7 ? "steel_rust" : "steel_dark",
        m = n() * 50,
        A = n.range(0.75, 1),
        _ = new THREE.CylinderGeometry(s, s, g, a, 4, !0);
      {
        let w = _.attributes.uv,
          S = _.attributes.position;
        for (let z = 0; z < w.count; z++)
          w.setXY(z, w.getX(z) * 2 * At * s, S.getY(z));
      }
      let M = {
        p: [y, v, d],
        r: [n() * 6, 0, tt],
      };
      t.add(
        b,
        _,
        M,
        (w, S, z) => A * (0.75 + 0.35 * gn(w * 1.3 + m, z * 9, S * 9)),
      );
      let E = M1(cylinderGeometry(s - o, s - o, g - 0.002, a, !0));
      t.add(
        "steel_rust",
        E,
        M,
        (w) =>
          0.16 +
          0.5 *
            j3(
              g / 2 + Math.abs(y) - 0.9,
              g / 2 + Math.abs(y) + 0.2,
              Math.abs(w - y) + Math.abs(y),
            ),
      );
      for (let w of [1, -1])
        t.add(
          b,
          us(
            w > 0
              ? [
                  [s, 0],
                  [s - o, 0],
                ]
              : [
                  [s - o, 0],
                  [s, 0],
                ],
            a,
          ),
          {
            p: [y + (w * g) / 2, v, d],
            r: [0, 0, -tt],
          },
          A * 1.1,
        );
    }
  });
  for (let h of [-1.35, 1.5]) {
    let p = 2 * s,
      d = r + s + 2 * u + s + 0.004,
      v = [],
      g = [
        [-(1.5 * p + s + 0.004), r + s],
        [-(0.5 * p + s * 0.5 + 0.004), r + s + 2 * u + s * 0.87],
        [-0.5 * p, d],
        [0.5 * p, d],
        [0.5 * p + s * 0.5 + 0.004, r + s + 2 * u + s * 0.87],
        [1.5 * p + s + 0.004, r + s],
        [1.5 * p, r - 0.004],
        [-1.5 * p, r - 0.004],
        [-(1.5 * p + s + 0.004), r + s],
      ];
    for (let x of g) v.push([h, x[1], x[0]]);
    (t.add("steel_dark", vr(v, [0.016, 0, 0]), null, 0.7),
      t.add(
        "steel_galv",
        Ge(0.04, 0.012, 0.05, 0.003),
        {
          p: [h, d + 0.005, 0.03],
        },
        0.8,
      ));
  }
  return (
    t.cdecal(
      i.mats.label("API 5L X52  273.1 x 12.5  HEAT 40719", {
        color: "white",
        font: "stencil",
        distress: 0.5,
      }),
      s + 0.002,
      0.2,
      {
        p: [0.9, r + s + 2 * u, s],
        r: [-tt + 0.9, 0, tt],
      },
      1.6,
    ),
    t.finish()
  );
}

function registerDetailedProps(i) {
  (i("barrel", (e, t = {}) => {
    let n = Math.abs(t.seed | 0) % 4;
    return wf(`barrel|${t.color}|${!!t.lying}|${!!t.open}|${n}`, () =>
      HA(e, t, n),
    );
  }),
    i("pallet", (e, t = {}) => {
      let n = Math.abs(t.seed | 0) % 4;
      return wf(`pallet|${!!t.broken}|${n}`, () => VA(e, t, n));
    }),
    i("pallet_stack", (e, t = {}) => WA(e, t)),
    i("crate_wood", (e, t = {}) => GA(e, t)),
    i("crate_stack", (e, t = {}) => qA(e, t)),
    i("ibc_tote", (e, t = {}) => XA(e, t)),
    i("cable_reel", (e, t = {}) => YA(e, t)),
    i("tire_stack", (e, t = {}) => $A(e, t)),
    i("jerry_can", (e, t = {}) => {
      let n = Math.abs(t.seed | 0) % 2;
      return wf(`jerry|${t.color}|${n}`, () => ZA(e, t, n));
    }),
    i("traffic_cone", (e, t = {}) => {
      let n = Math.abs(t.seed | 0) % 3;
      return wf(`cone|${!!t.lying}|${n}`, () => jA(e, t, n));
    }),
    i("gas_cylinders", (e, t = {}) => JA(e, t)),
    i("pipe_stack", (e, t = {}) => KA(e, t)));
}

export { S1, tv, registerDetailedProps };
