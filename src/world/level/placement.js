import {
  ExtrudeGeometry,
  Group,
  Shape,
  TorusGeometry,
  Vector3,
} from "../../vendor/three-r180.js";
import {
  beveledBoxGeometry,
  boxGeometry,
  createMesh,
  cylinderGeometry,
} from "../../core/geometry.js";
import { no } from "./buildings.js";

function Hc(i, e, t, n, s = 0) {
  let o = new Group();
  return (o.position.set(e, s, t), (o.rotation.y = n), i.staticRoot.add(o), o);
}

function Rn(i, e, t, n, s, o, r, a, l, c = 0, u = null) {
  let h = createMesh(
    c ? beveledBoxGeometry(n, s, o, c) : boxGeometry(n, s, o),
    typeof t == "string" ? i.M(t) : t,
  );
  return (
    h.position.set(r, a, l),
    u && h.rotation.set(u[0], u[1], u[2]),
    e.add(h),
    h
  );
}

function ov(i, e, t, n, s, o, r, a, l = null, c = 8) {
  let u = createMesh(
    cylinderGeometry(n, n, s, c),
    typeof t == "string" ? i.M(t) : t,
  );
  return (
    u.position.set(o, r, a),
    l && u.rotation.set(l[0], l[1], l[2]),
    e.add(u),
    u
  );
}

function rv(i, e, t, n, s, o, r, a = "metal", l = 0) {
  let c = Math.abs(Math.cos(n)),
    u = Math.abs(Math.sin(n)),
    h = Math.abs(Math.sin(2 * n)) > 0.2 ? 0.9 : 1,
    f = ((s * c + o * u) / 2) * h,
    p = ((s * u + o * c) / 2) * h;
  i.col(e - f, l, t - p, e + f, l + r, t + p, a);
}

function Ka(i, e, t, n = 0, s = "paint_blue", o = 1) {
  let r = Hc(i, e, t, n),
    a = 2.2,
    l = 1.2,
    c = 1.25,
    u = i.M(s),
    h = i.M("steel_dark");
  Rn(i, r, h, a, 0.05, l, 0, 0.13, 0);
  for (let d of [-1, 1]) Rn(i, r, u, 0.1, 0.1, l, d * (a / 2 - 0.25), 0.05, 0);
  for (let d of [-1, 1])
    for (let v of [-1, 1])
      Rn(
        i,
        r,
        u,
        0.07,
        c - 0.1,
        0.07,
        d * (a / 2 - 0.035),
        0.1 + (c - 0.1) / 2,
        v * (l / 2 - 0.035),
        0.008,
      );
  for (let d of [-1, 1])
    (Rn(i, r, u, a, 0.06, 0.06, 0, c - 0.03, d * (l / 2 - 0.03), 0.008),
      Rn(i, r, u, a, 0.05, 0.05, 0, 0.62, d * (l / 2 - 0.03)),
      Rn(
        i,
        r,
        i.M("chainlink"),
        a - 0.14,
        c - 0.25,
        0.012,
        0,
        0.15 + (c - 0.25) / 2,
        d * (l / 2 - 0.035),
      ));
  for (let d of [-1, 1])
    (Rn(i, r, u, 0.06, 0.06, l, d * (a / 2 - 0.03), c - 0.03, 0, 0.008),
      Rn(
        i,
        r,
        i.M("chainlink"),
        0.012,
        c - 0.25,
        l - 0.14,
        d * (a / 2 - 0.035),
        0.15 + (c - 0.25) / 2,
        0,
      ));
  let f = i.M("steel_worn"),
    p = i.M("steel_rust");
  for (let d = 0; d < 14; d++) {
    let v = (d * 0.618 + o * 0.37) % 1,
      g = (d * 0.414 + o * 0.11) % 1,
      x = 1.5 + g * 0.9;
    ov(
      i,
      r,
      d % 3 ? f : p,
      0.014,
      x,
      -a / 2 + 0.25 + v * (a - 0.9),
      0.16 + (x / 2) * 0.96,
      -l / 2 + 0.2 + g * (l - 0.4),
      [0.1 * (g - 0.5), 0, 0.28 * (v - 0.3)],
      5,
    );
  }
  for (let d = 0; d < 6; d++) {
    let v = (d * 0.37 + o * 0.2) % 1;
    ov(
      i,
      r,
      p,
      0.035,
      0.42,
      a / 2 - 0.45 + (v - 0.5) * 0.3,
      0.22 + d * 0.05,
      (v - 0.5) * 0.7,
      [Math.PI / 2 + v, v * 3, 0.2],
      6,
    );
  }
  return (rv(i, e, t, n, a, l, c, "metal"), r);
}

function Qa(i, e, t, n = 0, s = "paint_red") {
  let o = Hc(i, e, t, n),
    r = 1.1,
    a = 0.8,
    l = 0.75,
    c = i.M(s);
  for (let h of [-1, 1]) Rn(i, o, c, 0.09, 0.1, a, h * 0.36, 0.05, 0);
  Rn(i, o, c, r, 0.04, a, 0, 0.12, 0);
  for (let h of [-1, 1])
    Rn(
      i,
      o,
      c,
      r,
      l - 0.1,
      0.03,
      0,
      0.1 + (l - 0.1) / 2,
      h * (a / 2 - 0.015),
      0.006,
    );
  for (let h of [-1, 1])
    Rn(
      i,
      o,
      c,
      0.03,
      l - 0.1,
      a,
      h * (r / 2 - 0.015),
      0.1 + (l - 0.1) / 2,
      0,
      0.006,
    );
  for (let h of [-1, 1])
    for (let f of [-1, 1])
      Rn(
        i,
        o,
        c,
        0.06,
        l,
        0.06,
        h * (r / 2 - 0.02),
        l / 2,
        f * (a / 2 - 0.02),
        0.01,
      );
  Rn(i, o, i.M("steel_dark"), r - 0.08, 0.04, a - 0.08, 0, l - 0.22, 0);
  let u = i.M("steel_worn");
  for (let h = 0; h < 12; h++) {
    let f = (h * 0.618) % 1,
      p = (h * 0.37) % 1;
    Rn(
      i,
      o,
      u,
      0.16,
      0.11,
      0.1,
      (f - 0.5) * (r - 0.3),
      l - 0.16 + (h % 3) * 0.03,
      (p - 0.5) * (a - 0.25),
      0.012,
      [p, f * 3, f],
    );
  }
  return (rv(i, e, t, n, r, a, l, "metal"), o);
}

function Ef(i, e, t, n = 0, s = 9) {
  let o = Hc(i, e, t, n),
    r = i.M("steel_worn"),
    a = i.M("steel_rust");
  for (let l of [-1.1, 1.1])
    Rn(i, o, "wood_dark", 0.1, 0.08, 0.7, l, 0.04, 0, 0.008);
  for (let l = 0; l < s; l++) {
    let c = l < 5 ? 0 : 1,
      u = c ? l - 5 : l;
    ov(
      i,
      o,
      l % 2 ? r : a,
      0.016,
      3.4 + (l % 3) * 0.12,
      ((l % 3) - 1) * 0.06,
      0.1 + c * 0.03,
      (u - (c ? 1.5 : 2)) * 0.045 + c * 0.02,
      [0, 0.01 * (l - 4), Math.PI / 2],
      5,
    );
  }
  for (let l = 0; l < s; l += 3)
    Rn(i, o, a, 0.07, 0.05, 0.03, 1.72, 0.11, (l - 4) * 0.02);
  return o;
}

function e0(i, e, t, n = 0) {
  let s = Hc(i, e, t, n),
    o = new Shape();
  (o.moveTo(-0.16, 0),
    o.lineTo(0.16, 0),
    o.lineTo(0.16, 0.05),
    o.lineTo(-0.1, 0.19),
    o.lineTo(-0.16, 0.19),
    o.closePath());
  let r = new ExtrudeGeometry(o, {
    depth: 0.2,
    bevelEnabled: !1,
  });
  return (
    r.translate(0, 0, -0.1),
    s.add(createMesh(r, i.M("rubber"))),
    Rn(i, s, "paint_yellow", 0.012, 0.16, 0.18, -0.166, 0.1, 0),
    s
  );
}

function Sf(i, e, t, n, s = "x-", o = 3.2) {
  let r = s[0] === "x";
  (i.cyl("steel_galv", 0.045, o, e, o / 2, t, {
    seg: 8,
  }),
    i.box("steel_dark", 0.3, 0.02, 0.3, e, 0.01, t));
  let a = 1.1,
    l = 0.62,
    c = 0.03;
  i.box("paint_yellow", r ? c : a, l, r ? a : c, e, o - l / 2 - 0.05, t, {
    bevel: 0.01,
  });
  let u = s[1] === "+" ? 1 : -1,
    h = r ? e + u * (c / 2 + 0.003) : e,
    f = r ? t : t + u * (c / 2 + 0.003);
  (i.label(n, 0.4, h, o - l / 2 - 0.05, f, s, {
    color: "black",
    font: "stencil",
    distress: 0.35,
  }),
    i.col(e - 0.06, 0, t - 0.06, e + 0.06, o, t + 0.06, "metal", {
      noNav: !0,
    }));
}

function av(i, e, t, n = 2, s = !0, o = 0.02) {
  let u = ["paint_grey", "paint_teal", "paint_grey", "steel_rust"];
  for (let d = 0; d < n; d++) {
    let v = Hc(
        i,
        e + (d ? 0.12 * Math.sin(d * 2.1) : 0),
        t + (d ? 0.18 * Math.cos(d * 1.7) : 0),
        (s ? Math.PI / 2 : 0) + o * (d % 2 ? -1 : 1.3),
        0,
      ),
      g = 0.1 + d * (0.5 + 0.1);
    for (let y of [-3.6, 0, 3.6])
      Rn(i, v, "wood_dark", 0.14, 0.1, 4.2 - 0.2, y, g - 0.1 / 2, 0, 0.01);
    let x = i.M(u[d % u.length]);
    (Rn(i, v, x, 10.4, 0.5 - 0.08, 4.2, 0, g + (0.5 - 0.08) / 2, 0, 0.03),
      Rn(i, v, x, 10.4 - 0.5, 0.08, 4.2 - 0.5, 0, g + 0.5 - 0.04, 0, 0.02));
    for (let y of [-1.4, -0.7, 0, 0.7, 1.4])
      Rn(i, v, x, 10.4 - 0.9, 0.05, 0.09, 0, g + 0.5 + 0.02, y, 0.01);
    for (let y of [-1, 1])
      for (let b of [-1, 1])
        (Rn(
          i,
          v,
          "steel_dark",
          0.32,
          0.12,
          0.32,
          y * (10.4 / 2 - 0.35),
          g + 0.5 - 0.02,
          b * (4.2 / 2 - 0.35),
          0.02,
        ),
          Rn(
            i,
            v,
            "paint_yellow",
            0.5,
            0.5 - 0.1,
            0.02,
            y * (10.4 / 2 - 0.5),
            g + (0.5 - 0.08) / 2,
            b * (4.2 / 2 + 0.006),
          ));
    for (let y of [-1, 1])
      Rn(
        i,
        v,
        "rubber",
        0.04,
        0.12,
        4.2 - 0.4,
        y * (10.4 / 2 + 0.01),
        g + 0.1,
        0,
      );
  }
  let h = 0.1 + n * (0.5 + 0.1),
    f = (s ? 4.2 : 10.4) / 2 + 0.05,
    p = (s ? 10.4 : 4.2) / 2 + 0.05;
  return (
    i.col(e - f, 0, t - p, e + f, h, t + p, "metal"),
    i.metalRects.push([e - f, t - p, e + f, t + p]),
    h
  );
}

function Lr(i, e, t = 0.025, n = "rubber", s = null) {
  let o = [];
  for (let r = 0; r < e.length; r++) {
    let a = e[r];
    if (
      (o.push([a[0], a.length > 2 ? a[2] : (s ?? t * 0.9), a[1]]),
      r < e.length - 1)
    ) {
      let l = e[r + 1],
        c = l[0] - a[0],
        u = l[1] - a[1],
        h = Math.hypot(c, u);
      if (h > 2.2 && a.length < 3 && l.length < 3) {
        let f = Math.floor(h / 1.6);
        for (let p = 1; p < f; p++) {
          let d = p / f,
            v = Math.sin((r * 3.1 + p) * 2.3) * Math.min(0.28, h * 0.04);
          o.push([
            a[0] + c * d - (u / h) * v,
            s ?? t * 0.9,
            a[1] + u * d + (c / h) * v,
          ]);
        }
      }
    }
  }
  return i.tube(n, o, t, {
    radial: 6,
    cast: !1,
  });
}

function lv(i, e, t, n = 0) {
  let s = Hc(i, e, t, n);
  return (
    Rn(i, s, "concrete", 0.7, 0.12, 0.5, 0, 0.06, 0, 0.015),
    Rn(i, s, "paint_grey", 0.55, 0.9, 0.3, 0, 0.57, 0, 0.015),
    Rn(i, s, "steel_dark", 0.5, 0.03, 0.34, 0, 1.03, 0),
    Rn(i, s, "hazard_stripes", 0.3, 0.12, 0.01, 0, 0.8, 0.156),
    rv(i, e, t, n, 0.7, 0.5, 1.05, "metal"),
    s
  );
}

var lb = {
  X: 30,
  LADDER_Z: 20,
  RAILS: [18.5, 28.5],
  Z0: -30,
  Z1: 28,
};

function cb(i) {
  let {
      M: e,
      box: t,
      slab: n,
      cyl: s,
      rod: o,
      tube: r,
      col: a,
      add: l,
      place: c,
    } = i,
    { X: u, LADDER_Z: h, Z0: f, Z1: p } = lb,
    d = e("concrete"),
    v = e("concrete_dirty"),
    g = e("steel_worn"),
    x = e("steel_dark"),
    y = e("steel_galv"),
    b = e("paint_yellow"),
    m = h - 0.42,
    A = h + 0.42;
  for (let [E, w] of [
    [f - 1, m],
    [A, p + 1],
  ])
    (n(d, u - 0.65, -0.7, E, u, 0.028, w, {
      bevel: 0.03,
    }),
      n(g, u - 0.07, -0.16, E, u + 0.022, 0.036, w, {
        bevel: 0.012,
      }),
      n(b, u - 0.66, 0, E, u - 0.5, 0.032, w),
      n(v, u - 0.55, -4.2, E, u - 0.02, -0.7, w));
  (n(d, u - 0.65, -0.7, m, u - 0.38, 0.028, A),
    n(v, u - 0.55, -4.2, m, u - 0.38, -0.7, A));
  for (let E of [m, A])
    n(g, u - 0.38, -0.16, E - 0.02, u + 0.02, 0.034, E + 0.02);
  for (let E = f + 4; E < p; E += 6)
    Math.abs(E - h) < 1 ||
      (n(x, u - 0.03, -4.2, E - 0.02, u - 0.012, -0.2, E + 0.02, {
        cast: !1,
      }),
      i.decal("rust_run", 0.7, u - 0.015, -1.3, E + 1.4, "x+"));
  (a(u - 0.65, -4.2, f - 1, u, 0.028, p + 1, "concrete", {
    noNav: !0,
  }),
    a(u + 0.03, -5, f - 2, u + 0.7, 8, p + 2, "concrete", {
      playerOnly: !0,
    }));
  {
    let E = u - 0.12;
    for (let S of [-1, 1]) {
      let z = h + S * 0.26;
      (r(
        e("paint_yellow"),
        [
          [E, -3.9, z],
          [E, 0.2, z],
          [E, 0.95, z],
          [E - 0.12, 1.12, z],
          [E - 0.5, 1.12, z],
          [E - 0.62, 0.95, z],
          [E - 0.62, 0.03, z],
        ],
        0.024,
        {
          radial: 7,
          tension: 0.2,
        },
      ),
        t(x, 0.12, 0.012, 0.12, E - 0.62, 0.034, z));
    }
    for (let S = -3.7; S < 0; S += 0.3)
      o(y, [E, S, h - 0.26], [E, S, h + 0.26], 0.014, {
        seg: 6,
      });
    for (let S of [-3, -1.6, -0.3])
      for (let z of [-1, 1])
        o(y, [E, S, h + z * 0.26], [u - 0.38, S, h + z * 0.26], 0.012);
    let w = [[h - 2.6], [h - 0.9], [h + 0.9], [h + 2.6]];
    for (let [S] of w)
      (s(b, 0.032, 1.05, u - 0.82, 0.525, S, {
        seg: 8,
      }),
        s(x, 0.09, 0.02, u - 0.82, 0.01, S, {
          seg: 10,
        }),
        s(x, 0.045, 0.03, u - 0.82, 1.06, S, {
          seg: 8,
        }));
    for (let [S, z] of [
      [h - 2.6, h - 0.9],
      [h + 0.9, h + 2.6],
    ])
      for (let H of [0.98, 0.55])
        r(
          y,
          [
            [u - 0.82, H, S],
            [u - 0.82, H - 0.1, (S + z) / 2 - 0.3],
            [u - 0.82, H - 0.12, (S + z) / 2 + 0.3],
            [u - 0.82, H, z],
          ],
          0.012,
          {
            radial: 5,
          },
        );
    i.label("BOAT STN 4", 0.2, u - 1.3, 0.006, h - 1.4, "y+", {
      color: "yellow",
      font: "stencil",
      distress: 0.4,
    });
  }
  let _ = new TorusGeometry(0.4, 0.16, 8, 16);
  _.rotateY(Math.PI / 2);
  for (let E = f + 2.5, w = 0; E < p; E += 5, w++) {
    if (Math.abs(E - h) < 2) continue;
    (n(e("wood_dark"), u + 0, -3.9, E - 0.16, u + 0.2, -0.25, E + 0.16, {
      bevel: 0.02,
    }),
      n(x, u - 0.01, -0.5, E - 0.2, u + 0.215, -0.42, E + 0.2),
      n(x, u - 0.01, -2.4, E - 0.2, u + 0.215, -2.32, E + 0.2));
    let S = E + 2.4;
    if (Math.abs(S - h) < 1.6 || S > p - 0.5) continue;
    let z = -0.85 - (w % 3) * 0.18;
    (l(_.clone(), e("tire"), {
      p: [u + 0.17, z, S],
    }),
      w % 2 &&
        l(_.clone(), e("tire"), {
          p: [u + 0.17, z - 0.86, S + 0.05],
        }));
    for (let H of [-1, 1])
      o(
        y,
        [u - 0.02, 0.02, S + H * 0.3],
        [u + 0.17, z + 0.36, S + H * 0.16],
        0.011,
        {
          seg: 5,
        },
      );
    t(x, 0.1, 0.03, 0.8, u - 0.06, 0.04, S);
  }
  let M = [-22, -12, -2, 9, 16.4, 25.6];
  for (let E of M)
    c("bollard_mooring", 29.2, E, 0, {
      seed: Math.round(E + 40),
    });
  {
    let E = [...M.map((S) => [S - 1.1, S + 1.1]), [h - 3, h + 3]].sort(
        (S, z) => S[0] - z[0],
      ),
      w = f + 0.3;
    for (let [S, z] of [...E, [p - 0.3, p]]) {
      if (S - w > 1) {
        n(b, u - 0.4, 0.12, w, u - 0.2, 0.3, S, {
          bevel: 0.02,
        });
        for (let H = w + 0.3; H < S; H += 1.6)
          n(x, u - 0.42, 0.028, H - 0.12, u - 0.18, 0.12, H + 0.12);
      }
      w = Math.max(w, z);
    }
  }
  for (let E of lb.RAILS) {
    (n(x, E - 0.19, 0, f + 0.4, E + 0.19, 0.007, p - 0.4, {
      cast: !1,
    }),
      n(e("steel_rust"), E - 0.075, 0, f + 0.4, E + 0.075, 0.018, p - 0.4, {
        cast: !1,
      }),
      n(g, E - 0.037, 0, f + 0.4, E + 0.037, 0.034, p - 0.4, {
        bevel: 0.008,
        cast: !1,
      }));
    for (let w = f + 0.8; w < p - 0.5; w += 0.9)
      for (let S of [-1, 1])
        t(x, 0.07, 0.022, 0.1, E + S * 0.115, 0.012, w, {
          cast: !1,
        });
    for (let [w, S] of [
      [f + 0.75, 1],
      [p - 0.75, -1],
    ])
      (n(b, E - 0.28, 0, w - 0.3, E + 0.28, 0.75, w + 0.3, {
        bevel: 0.03,
      }),
        n(
          e("rubber"),
          E - 0.16,
          0.3,
          w + S * 0.3,
          E + 0.16,
          0.62,
          w + S * 0.42,
          {
            bevel: 0.03,
          },
        ),
        n(x, E - 0.34, 0, w - 0.38, E + 0.34, 0.04, w + 0.38),
        a(E - 0.28, 0, w - 0.36, E + 0.28, 0.75, w + 0.36, "metal"));
  }
  return (
    av(i, 23.3, -15.4, 2, !0, 0.02),
    av(i, 23.7, 14.4, 2, !0, -0.025),
    c("jersey_barrier", 20.5, -4.7, Math.PI / 2 + 0.12, {
      seed: 31,
    }),
    c("jersey_barrier", 25.3, 3.1, -0.2, {
      seed: 32,
    }),
    Ka(i, 25.7, -3.3, 0.08, "paint_blue", 2),
    c("sandbags", 20.6, 3, 1.25, {
      seed: 33,
    }),
    c("barrel", 26.5, -1.7, 0, {
      seed: 34,
      color: "red",
    }),
    c("barrel", 26.9, -1.05, 0.5, {
      seed: 35,
    }),
    Qa(i, 20.55, 1.35, 0.12),
    c("traffic_cone", 22, -1.9, 0, {
      seed: 36,
    }),
    c("traffic_cone", 24.2, 1.7, 0, {
      seed: 37,
    }),
    i.stack(23.2, -28.6, [
      [
        20,
        "white",
        {
          reefer: !0,
        },
      ],
      [
        20,
        "white",
        {
          reefer: !0,
        },
      ],
    ]),
    i.stack(23, -25.95, [
      [
        20,
        "grey",
        {
          reefer: !0,
        },
      ],
    ]),
    c("generator", 15, -26.6, 0.06, {
      seed: 41,
    }),
    c("floodlight_stand", 16.4, -23.6, 0.3, {
      seed: 42,
    }),
    Lr(
      i,
      [
        [16.1, -26.6],
        [18, -27.6],
        [19.2, -27.2],
        [19.6, -26.4],
      ],
      0.028,
    ),
    Lr(
      i,
      [
        [15.6, -26],
        [16.2, -24.6],
        [16.4, -23.9],
      ],
      0.018,
    ),
    Ka(i, 27, -18.1, Math.PI / 2 + 0.05, "paint_orange", 5),
    c("tire_stack", 24.1, -9.5, 0, {
      seed: 43,
    }),
    c("tire_stack", 25.05, -9.6, 0.5, {
      seed: 44,
    }),
    c("cable_reel", 14.3, -12.9, 0.4, {
      seed: 45,
    }),
    c("cable_reel", 15.6, -14.3, 1.9, {
      seed: 46,
    }),
    c("pallet_stack", 20.3, -9.3, 0.1, {
      seed: 47,
    }),
    c("crate_wood", 19.9, -22.6, 0.3, {
      seed: 48,
    }),
    c("barrel", 12.75, -23.3, 0, {
      seed: 49,
      color: "blue",
    }),
    c("barrel", 12.9, -24.1, 0, {
      seed: 50,
      color: "blue",
    }),
    c("light_mast", 26.6, -28.7, 0, {
      seed: 51,
    }),
    c("light_mast", 26.6, 26.7, 0, {
      seed: 52,
    }),
    Ka(i, 20.6, 22.4, 0.04, "paint_blue", 7),
    Ka(i, 20.7, 24.2, -0.06, "paint_orange", 9),
    Qa(i, 26.6, 5.5, 0.1),
    Qa(i, 26.7, 6.45, -0.15, "paint_blue"),
    c("crate_stack", 26.4, 23.6, 0.2, {
      seed: 53,
    }),
    c("ibc_tote", 22.6, 26.3, 0.05, {
      seed: 54,
    }),
    c("pallet_stack", 24, 26.2, 0.2, {
      seed: 55,
    }),
    c("barrel", 22.6, 20.3, 0, {
      seed: 56,
      color: "yellow",
    }),
    c("barrel", 23.4, 20.4, 0, {
      seed: 57,
    }),
    c("tarp_cargo", 20.3, 12.6, Math.PI / 2, {
      seed: 59,
    }),
    Ef(i, 19.6, 17.5, Math.PI / 2 + 0.05),
    e0(i, 19.6, 10.4, 0.4),
    e0(i, 20.5, 16.1, -2.6),
    c("traffic_cone", 28.2, 18.2, 0, {
      seed: 60,
    }),
    c("traffic_cone", 28.3, 21.8, 0, {
      seed: 61,
    }),
    Lr(
      i,
      [
        [28.9, 6.2],
        [28.6, 9.5],
        [28.95, 13],
        [28.7, 16.6],
        [28.3, 17.4],
        [28.6, 17.9],
        [28.9, 17.3],
      ],
      0.022,
    ),
    {
      relayPos: new Vector3(23, 0, 0),
      extraction: new Vector3(29, 0, h),
    }
  );
}

var uR = Math.PI;

var ts = uR / 2;

var R1 = 0.535;

var mt = (i, e, t) => new Vector3(i, e, t);

function hR(i) {
  let e = i.place,
    t = i.stack;
  (t(-19.45, -5.12, [
    [20, "green"],
    [20, "grey"],
    [20, "orange"],
  ]),
    t(-13.3, -5.12, [
      [
        20,
        "white",
        {
          reefer: !0,
          flip: !0,
        },
      ],
    ]),
    t(3.7, -5.12, [
      [
        20,
        "blue",
        {
          doors: 0.8,
          flip: !0,
        },
      ],
      [20, "white"],
    ]),
    t(13.53, -5.12, [
      [20, "teal"],
      [20, "grey"],
    ]),
    t(-19.45, 2.08, [[20, "blue"]]),
    t(-13.35, 2.08, [[20, "red"]]),
    t(0.8, 2.08, [
      [40, "orange"],
      [40, "teal"],
      [
        20,
        "blue",
        {
          dx: 3,
        },
      ],
    ]),
    t(12.3, 2.08, [
      [20, "red"],
      [20, "yellow"],
    ]),
    t(-21.1, 9.92, [[20, "yellow"]], 0, 0.3),
    t(
      -13.6,
      9.92,
      [
        [20, "green"],
        [20, "blue"],
        [20, "orange"],
      ],
      0,
      0.3,
    ),
    t(
      -21.6,
      12.42,
      [
        [20, "red"],
        [20, "white"],
        [20, "teal"],
      ],
      0,
      0.3,
    ),
    t(
      -15.4,
      12.42,
      [
        [
          20,
          "grey",
          {
            doors: 0.6,
          },
        ],
      ],
      0,
      0.3,
    ),
    t(4.43, 12.42, [[20, "blue"]], 0, 0),
    t(13.53, 12.42, [[20, "green"]], 0, 0),
    i.stairs(-0.1, 12.42, 0, 0, {
      seed: 9,
    }),
    i.catwalk(8.98, 12.42, 0, 2.54, {
      seed: 10,
    }));
  for (let s of [7.6, 10.36])
    for (let o of [11.86, 12.98])
      i.rod("steel_galv", [s, 0, o], [s, 2.5, o], 0.035);
  (e(
    "sandbags",
    15.95,
    12.42,
    ts,
    {
      seed: 61,
    },
    2.59,
  ),
    e(
      "crate_wood",
      14.3,
      11.75,
      0.1,
      {
        seed: 62,
      },
      2.59,
    ),
    e(
      "sandbags",
      2.3,
      11.75,
      0,
      {
        seed: 63,
      },
      2.59,
    ),
    t(-16.4, 20.12, [
      [40, "grey"],
      [40, "green"],
    ]),
    t(-2.25, 20.12, [[20, "red"]]),
    t(3.85, 20.12, [
      [20, "white"],
      [20, "blue"],
    ]),
    t(13.53, 20.12, [
      [20, "orange"],
      [20, "teal"],
      [20, "red"],
    ]),
    t(-16.4, 22.62, [
      ["hc", "teal"],
      [40, "yellow"],
      [40, "blue"],
    ]),
    t(0.8, 22.62, [
      [40, "green"],
      ["hc", "orange"],
    ]),
    t(13.53, 22.62, [
      [
        20,
        "grey",
        {
          doors: 0.4,
        },
      ],
    ]),
    t(
      -22.6,
      -19.2,
      [
        [40, "red"],
        [40, "white"],
      ],
      ts,
    ),
    t(
      -30.2,
      -18.4,
      [
        [
          20,
          "yellow",
          {
            doors: 0.5,
          },
        ],
      ],
      0.35,
      0,
    ),
    t(-31.2, 24.7, [
      [40, "teal"],
      [40, "orange"],
    ]));
  for (let [s, o] of [
    [-23.4, 0.5],
    [-23.4, 21.4],
    [17, -8.7],
    [17, 18.6],
    [-20.6, -11.6],
  ])
    e("light_mast", s, o, 0, {
      seed: Math.round(s * 3 + o),
    });
  let n = (s, o, r, a = 0.018) => {
    let l = [];
    for (let c = 0; c <= 8; c++) {
      let u = c / 8;
      l.push([
        s[0] + (o[0] - s[0]) * u,
        s[1] + (o[1] - s[1]) * u - r * 4 * u * (1 - u),
        s[2] + (o[2] - s[2]) * u,
      ]);
    }
    i.tube("rubber", l, a, {
      radial: 5,
      tension: 0.5,
    });
  };
  (n([-23.4, 12.4, 0.5], [-20.6, 12.4, -11.6], 1.3),
    n([-20.6, 11.8, -11.6], [-16.2, 7.25, -11.4], 0.9),
    n([-23.4, 12, 0.5], [-27.6, 12.2, -0.9], 0.5),
    n([17, 12.4, -8.7], [12.3, 7.3, -11.3], 1),
    Ef(i, -20.9, 8.3, 0.02),
    e0(i, -18.6, 3.75, 1.7),
    e0(i, 0.4, 13.3, 0.3),
    e("barrel", -19.6, 3.85, 0, {
      seed: 1,
      color: "blue",
    }),
    e("barrel", -18.9, 3.95, 0.7, {
      seed: 2,
      color: "blue",
    }),
    e("pallet_stack", -17.4, 4, 0.08, {
      seed: 3,
    }),
    e("crate_stack", -14.3, 8.05, 0.04, {
      seed: 4,
    }),
    e("ibc_tote", -12.95, 7.95, -0.05, {
      seed: 5,
    }));
  {
    let a = Math.cos(-0.22),
      l = -Math.sin(-0.22);
    e("forklift", -8.6, 4.5, -0.22, {
      seed: 6,
      forksUp: 0.3,
    });
    let c = -8.6 + a * 1.42,
      u = 4.5 + l * 1.42;
    (e(
      "pallet",
      c,
      u,
      -0.22,
      {
        seed: 7,
      },
      R1,
      {
        noCol: !0,
      },
    ),
      e(
        "crate_wood",
        c,
        u,
        -0.22 + 0.05,
        {
          seed: 8,
        },
        R1 + 0.144,
        {
          noCol: !0,
        },
      ),
      i.col(
        c - 0.62,
        R1 - 0.1,
        u - 0.62,
        c + 0.62,
        R1 + 1.15,
        u + 0.62,
        "wood",
      ),
      e0(i, -8.6 - 1, 4.5 + 0.78, 0.2),
      e0(i, -11.9, 3.6, 2.4));
  }
  (e("jersey_barrier", -2.9, 5.3, 0.12, {
    seed: 11,
  }),
    e("jersey_barrier", 5.6, 5, -0.1, {
      seed: 12,
    }),
    e("sandbags", -1.7, 9.7, 0.5, {
      seed: 13,
    }),
    e("ibc_tote", 5.9, 8.9, 0.1, {
      seed: 14,
    }),
    e("ibc_tote", 5.95, 10.05, -0.05, {
      seed: 15,
    }),
    e("barrel", 4.9, 9.7, 0, {
      seed: 16,
      color: "red",
    }),
    e("crate_stack", -3.9, 10.5, 0.1, {
      seed: 17,
    }),
    e("crate_wood", -3.8, 9.35, -0.2, {
      seed: 18,
    }),
    e("pallet_stack", -4.4, 11.8, 0.02, {
      seed: 19,
    }),
    e("cable_reel", 4.2, 10.5, 0.3, {
      seed: 20,
    }),
    e("tarp_cargo", 12.9, 10, 0.04, {
      seed: 21,
    }),
    e("jersey_barrier", 11.6, 3.95, 0.03, {
      seed: 81,
    }),
    e("ibc_tote", 15.2, 10.2, 0.1, {
      seed: 82,
    }));
  for (let [s, o] of [
    [0.2, 6.3],
    [2.9, 6.4],
    [2.9, 8.8],
    [0.1, 8.7],
  ])
    e("traffic_cone", s, o, 0, {
      seed: Math.round(s * 9 + o * 5),
    });
  (Qa(i, -9.55, 9.3, 0.04),
    Ef(i, -7.6, 11.9, ts + 0.06),
    Qa(i, 9.9, 12.9, ts, "paint_blue"),
    e("sign_post", -4.8, 3.72, ts, {
      seed: 22,
      sign: "hazard_voltage",
    }),
    lv(i, 0.9, 3.62, 0),
    Lr(
      i,
      [
        [0.9, 3.9],
        [1.2, 5.2],
        [0.8, 6.2],
        [1.5, 7.1],
      ],
      0.03,
    ),
    e("tarp_cargo", -13.5, -3.1, 0.05, {
      seed: 23,
    }),
    e("pallet_stack", -20.6, -0.1, 0.2, {
      seed: 24,
    }),
    e("tire_stack", -9.6, 0.2, 0, {
      seed: 25,
    }),
    e("barrel", 4.5, 0.35, 0, {
      seed: 26,
      color: "yellow",
    }),
    e("barrel", 5.2, 0.3, 0.4, {
      seed: 27,
    }),
    e("jersey_barrier", 12.2, 0.4, 0.03, {
      seed: 28,
    }),
    e("crate_wood", 11.2, -3.3, 0.3, {
      seed: 29,
    }),
    e("cardboard_boxes", -2, 0.3, 0.2, {
      seed: 30,
    }),
    Ka(i, -4.2, -3.2, 0.03, "paint_orange", 3),
    e("jersey_barrier", -0.9, -7.5, 0.1, {
      seed: 31,
    }),
    e("sandbags", -6.7, -7.8, -0.1, {
      seed: 32,
    }),
    e("dumpster", -12.3, -7.05, 0, {
      seed: 33,
    }),
    e("gas_cylinders", 9.6, -10.45, 0, {
      seed: 34,
    }),
    e("pallet_stack", 1.2, -9.9, 0.1, {
      seed: 35,
    }),
    e("barrel", 2.2, -10.3, 0, {
      seed: 36,
      color: "green",
    }),
    e("cable_reel", -18.2, -8, 0.2, {
      seed: 37,
    }),
    e("traffic_cone", -6.5, -9.9, 0, {
      seed: 38,
    }),
    e("traffic_cone", -0.5, -9.9, 0, {
      seed: 39,
    }),
    Lr(
      i,
      [
        [4.6, -10.9, 0.5],
        [4.7, -10.6, 0.05],
        [4.2, -9.2],
        [1, -8.4],
        [-2.6, -9.1],
        [-4.6, -6.4],
        [-5.9, -5.9],
      ],
      0.024,
    ),
    e("pipe_stack", -16, 14.4, 0, {
      seed: 41,
    }),
    e("crate_stack", -10.95, 18.25, 0.06, {
      seed: 42,
    }),
    e("barrel", -3, 18.35, 0, {
      seed: 43,
      color: "blue",
    }),
    e("dumpster", 4.2, 14.55, 0.02, {
      seed: 44,
    }),
    e("tire_stack", 10.95, 18.3, 0, {
      seed: 45,
    }),
    e("ibc_tote", 12, 18.25, 0, {
      seed: 46,
    }),
    e("pallet_stack", -12.3, 18.2, 0.1, {
      seed: 47,
    }),
    e("tarp_cargo", -20.5, 18.05, 0.03, {
      seed: 48,
    }),
    e("jersey_barrier", 0.6, 15.5, 0.12, {
      seed: 49,
    }),
    e("tire_stack", -8, 26.9, 0, {
      seed: 51,
    }),
    e("pallet_stack", 8.7, 27, 0.3, {
      seed: 52,
    }),
    e("crate_wood", -2, 27, 0.2, {
      seed: 53,
    }),
    e("barrel", 11.2, 27.1, 0, {
      seed: 54,
    }),
    e("cardboard_boxes", -21, 26.9, 0.4, {
      seed: 55,
    }),
    Qa(i, 16, 26.9, 0.1),
    e("pipe_stack", -30.5, -27, 0.03, {
      seed: 56,
    }),
    e("pipe_stack", -30.2, -25.4, -0.02, {
      seed: 57,
    }),
    e("dumpster", -17, -14, ts, {
      seed: 58,
    }),
    e("tarp_cargo", -27.5, -11.6, 0.3, {
      seed: 59,
    }),
    e("tarp_cargo", -29.9, -11, -0.2, {
      seed: 60,
    }),
    e("cable_reel", -34.6, -22.5, 1, {
      seed: 64,
    }),
    e("tire_stack", -25.4, -26.9, 0, {
      seed: 65,
    }),
    e("gas_cylinders", -16.9, -20.4, ts, {
      seed: 66,
    }),
    e("crate_stack", -34.8, -13.5, 0.2, {
      seed: 67,
    }),
    e("barrel", -33.6, -13, 0, {
      seed: 68,
    }),
    Ka(i, -36.6, -26, ts, "paint_blue", 4),
    e("generator", -34.2, 14.2, 0.15, {
      seed: 71,
    }),
    e("floodlight_stand", -31.4, 12.7, 0.55, {
      seed: 72,
    }),
    Lr(
      i,
      [
        [-33.2, 14],
        [-32.4, 13.2],
        [-31.6, 12.9],
      ],
      0.02,
    ),
    e("tire_stack", -36.6, 17.2, 0, {
      seed: 73,
    }),
    e("tire_stack", -36.5, 18.3, 0.6, {
      seed: 74,
    }),
    e("dumpster", -36.4, 21, ts, {
      seed: 75,
    }),
    e("pallet_stack", -27.8, 16.6, 0.4, {
      seed: 76,
    }),
    e("jerry_can", -33, 15.2, 0.4, {
      seed: 77,
    }),
    e("jerry_can", -33.3, 15.35, 1.9, {
      seed: 78,
    }),
    e("crate_wood", -28.6, 20.6, 0.1, {
      seed: 79,
    }),
    e("ibc_tote", -26.6, 21.2, 0, {
      seed: 80,
    }),
    Sf(i, -22.9, -3.62, "LANE 1", "x-"),
    Sf(i, -22.95, 3.62, "LANE 2", "x-"),
    Sf(i, -25, 14, "LANE 3", "x-"),
    Sf(i, 16.9, 9.5, "LANE 2", "x+"),
    i.label("BERTH 4 WORKSHOP", 0.55, 4.2, 4.3, no.Z1 + 0.064, "z+", {
      color: "white",
      font: "stencil",
      distress: 0.45,
    }),
    i.decal("berth4", 3.2, -12, 3.4, no.Z1 + 0.064, "z+"),
    i.decal("rust_run", 1, 9, 3.2, no.Z1 + 0.064, "z+"),
    i.decal("grime_streak", 1.2, -14, 3.9, no.Z1 + 0.064, "z+"));
}

function fR(i) {
  let e = i.place,
    t = -38,
    n = 30,
    s = -30,
    o = 28,
    r = 2,
    a = 8;
  function l(c, u, h, f, p) {
    let d = Math.hypot(h - c, f - u),
      v = Math.max(1, Math.round(d / 3.35)),
      g = d / (v * 3),
      x = Math.abs(h - c) > Math.abs(f - u);
    for (let y = 0; y < v; y++) {
      let b = (y + 0.5) / v,
        m = e(
          "fence_panel",
          c + (h - c) * b,
          u + (f - u) * b,
          x ? 0 : ts,
          {
            seed: p + y,
            posts: y === v - 1 ? "both" : "left",
          },
          0,
          {
            noCol: !0,
          },
        );
      m.scale.x = g;
    }
    (i.col(
      Math.min(c, h) - 0.05,
      0,
      Math.min(u, f) - 0.05,
      Math.max(c, h) + 0.05,
      2.4,
      Math.max(u, f) + 0.05,
      "metal",
    ),
      i.col(
        Math.min(c, h) - 0.3,
        0,
        Math.min(u, f) - 0.3,
        Math.max(c, h) + 0.3,
        7,
        Math.max(u, f) + 0.3,
        "metal",
        {
          playerOnly: !0,
        },
      ));
  }
  (l(t, s, n, s, 100),
    l(t, o, n, o, 200),
    l(t, s, t, r, 300),
    l(t, a, t, o, 400));
  for (let c of [r - 0.1, a + 0.1])
    (i.box("steel_dark", 0.22, 3.4, 0.22, t, 1.7, c, {
      bevel: 0.02,
    }),
      i.box("hazard_stripes", 0.26, 1.2, 0.26, t, 0.6, c, {
        bevel: 0.02,
      }),
      i.col(t - 0.13, 0, c - 0.13, t + 0.13, 3.4, c + 0.13, "metal"));
  {
    let c = a + 3.3,
      u = t + 0.28;
    i.box("chainlink", 0.012, 2.1, 6, u, 1.25, c);
    for (let h of [c - 3, c, c + 3])
      i.box("steel_galv", 0.06, 2.2, 0.06, u, 1.25, h);
    for (let h of [0.18, 2.32, 1.25])
      i.box("steel_galv", 0.06, 0.06, 6.06, u, h, c);
    (i.rod("steel_galv", [u, 0.2, c - 3], [u, 2.3, c], 0.018),
      i.rod("steel_galv", [u, 0.2, c + 3], [u, 2.3, c], 0.018),
      i.slab("steel_dark", u - 0.05, 0, r - 0.3, u + 0.05, 0.03, c + 3.2, {
        cast: !1,
      }));
    for (let h of [c - 2.4, c + 2.4])
      i.cyl("rubber", 0.09, 0.05, u, 0.1, h, {
        axis: "x",
        seg: 10,
      });
  }
  (i.col(t - 0.4, 0, r, t - 0.1, 7, a, "metal", {
    playerOnly: !0,
  }),
    e("guard_booth", -35.2, 0.35, 0, {
      seed: 1,
    }),
    e("gate_arm", -36.3, 5, ts, {
      seed: 2,
    }));
  for (let [c, u] of [
    [-37, 1.75],
    [-34.4, 2.3],
    [-37, 8.3],
    [-35.6, 8.9],
    [-34.4, 9.9],
    [-33.5, -1.1],
  ])
    e("bollard_post", c, u, 0, {
      seed: Math.round(c * 11 + u * 7),
    });
  (e("jersey_barrier", -34.7, 3.75, ts + 0.08, {
    seed: 3,
  }),
    e("jersey_barrier", -33.3, 8.3, ts - 0.06, {
      seed: 4,
    }),
    e("jersey_barrier", -30.6, 10.4, 0.03, {
      seed: 5,
    }),
    e("jersey_barrier", -27.3, 1.45, 0.05, {
      seed: 6,
    }),
    e("jersey_barrier", -32.2, 1.45, -0.04, {
      seed: 7,
    }),
    e("sign_post", -33.2, 9.6, ts, {
      seed: 8,
      sign: "no_entry",
    }),
    e("sign_post", -25.3, 1.1, ts, {
      seed: 9,
      sign: "berth4",
    }),
    e("sign_post", -36.6, -1.6, ts, {
      seed: 10,
      sign: "hazard_general",
    }));
  for (let [c, u] of [
    [-34.6, 5.6],
    [-28.3, 2],
    [-33.2, 6.5],
    [-26.6, 9.8],
    [-31.8, 9.9],
  ])
    e("traffic_cone", c, u, 0, {
      seed: Math.round(c * 5 + u * 3),
    });
  (e("light_mast", -27.6, -0.9, 0, {
    seed: 11,
  }),
    e("light_mast", -36.3, 12.4, 0, {
      seed: 12,
    }),
    e("barrel", -33.9, 2, 0, {
      seed: 13,
      color: "yellow",
    }),
    e("pallet_stack", -36.4, 10.3, 0.2, {
      seed: 14,
    }),
    i.decal("no_entry", 0.7, t + 0.34, 1.5, a + 3.3, "x+"),
    i.decal("arrow", 2.2, -30.5, 0.006, 6, "y+", 0));
}

export { Lr, lv, cb, ts, mt, hR, fR };
