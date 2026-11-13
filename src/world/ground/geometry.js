import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  UnsignedByteType,
} from "../../vendor/three-r180.js";

function F1(i, e, t) {
  let n =
    Math.imul(i | 0, 374761393) ^
    Math.imul(e | 0, 668265263) ^
    Math.imul(t | 0, 1274126177);
  return (
    (n = Math.imul(n ^ (n >>> 13), 1274126177)),
    ((n ^ (n >>> 16)) >>> 0) / 4294967296
  );
}

function Ab(i, e, t, n) {
  let s = Math.floor(i),
    o = Math.floor(e),
    r = i - s,
    a = e - o,
    l = r * r * (3 - 2 * r),
    c = a * a * (3 - 2 * a),
    u = s,
    h = s + 1,
    f = o,
    p = o + 1;
  n &&
    ((u = ((u % n) + n) % n),
    (h = ((h % n) + n) % n),
    (f = ((f % n) + n) % n),
    (p = ((p % n) + n) % n));
  let d = F1(u, f, t),
    v = F1(h, f, t),
    g = F1(u, p, t),
    x = F1(h, p, t);
  return d + (v - d) * l + (g - d) * c + (d - v - g + x) * l * c;
}

function fs(i, e, t, n = 4, s = 0) {
  let o = 0,
    r = 0.5,
    a = 0;
  for (let l = 0; l < n; l++)
    ((o += r * Ab(i, e, t + l * 17, s)),
      (a += r),
      (i *= 2),
      (e *= 2),
      (s *= 2),
      (r *= 0.5));
  return o / a;
}

var So = (i) => (i < 0 ? 0 : i > 1 ? 1 : i);

var fl = (i, e, t) => {
  let n = So((t - i) / (e - i));
  return n * n * (3 - 2 * n);
};

var wR = 0.385;

var Li = {
  x0: -44,
  z0: -40,
  size: 80,
};

var Sb = [
  [-30.5, 6.6, 2.6, 1.7, 0.24],
  [-19.5, 5.2, 7.5, 1.5, 0.27],
  [-11.5, 7, 5, 1.2, 0.24],
  [-7.6, 5.6, 2.3, 1.7, 0.2],
  [5.6, 4.7, 3.3, 1.35, 0.26],
  [13, 6.6, 2.6, 1.2, 0.2],
  [-13, -1.3, 4.6, 1.5, 0.2],
  [1, -1.6, 3.4, 1.4, 0.18],
  [12.5, -1.4, 2.4, 1.3, 0.18],
  [-3.5, -8.2, 4.4, 1.6, 0.2],
  [-20, -8.6, 3.6, 1.6, 0.18],
  [14.6, -19.5, 2, 3.6, 0.2],
  [23.5, 6.9, 3.2, 2, 0.22],
  [23.2, -7.6, 3.4, 1.8, 0.2],
  [20.8, 1.5, 1.4, 3.6, 0.16],
  [23.5, 22.5, 3, 2, 0.2],
  [24, -25, 2.8, 2.6, 0.2],
  [-1, 16.5, 7, 1.7, 0.2],
  [11.5, 16.9, 3.6, 1.4, 0.18],
  [-17, 15.8, 3.2, 1.5, 0.18],
  [8.6, 12.3, 1.5, 3.4, 0.17],
  [-7.8, 19.5, 1.7, 3.6, 0.17],
  [-8, 25.8, 6, 1.3, 0.18],
  [9, 25.9, 4, 1.2, 0.18],
  [-32, -4, 2.6, 3.4, 0.18],
  [-31, 18, 3, 4, 0.18],
];

var Tb = 1;

var ER = 0.02;

function SR(i, e) {
  let t =
    0.5 +
    (fs(i / 8.5, e / 8.5, 11, 4) - 0.47) * 0.3 +
    (fs(i / 2.4, e / 2.4, 23, 3) - 0.5) * 0.14;
  for (let n = 0; n < Sb.length; n++) {
    let s = Sb[n],
      o = (i - s[0]) / (s[2] * Tb),
      r = (e - s[1]) / (s[3] * Tb),
      a = o * o + r * r;
    a < 9 && (t -= (s[4] + ER) * Math.exp(-a * a));
  }
  if (i > -37 && i < 29) {
    let n = 0.5 + 0.5 * Ab(i / 6, 3.1, 5),
      s = (e - 4.9) / 0.5,
      o = (e - 7.1) / 0.5,
      r = (e - 15.4) / 0.5,
      a = (e - 17.2) / 0.5,
      l =
        fl(0.14, 0.34, fs(i / 9, 7.7, 19, 2)) *
        fl(-27, -24, i) *
        (1 - fl(14, 17, i));
    t -=
      0.22 * (0.55 + 0.45 * n) * l * (Math.exp(-s * s) + Math.exp(-o * o)) +
      0.09 *
        n *
        (1 - fl(0.3, 0.6, fs(i / 9, 7.7, 19, 2))) *
        (Math.exp(-r * r) + Math.exp(-a * a));
  }
  return ((t += 0.25 * fl(28.6, 29.8, i)), t);
}

function Rb(i) {
  let e = new Uint8Array(i * i * 4),
    { x0: t, z0: n, size: s } = Li,
    o = s / i;
  for (let r = 0; r < i; r++) {
    let a = n + (r + 0.5) * o;
    for (let l = 0; l < i; l++) {
      let c = t + (l + 0.5) * o,
        u = (r * i + l) * 4,
        h = SR(c, a);
      ((e[u] = Math.round(So(0.5 + (h - wR) * 2.5) * 255)),
        (e[u + 1] = Math.round(
          So(
            0.5 + (fs(c / 5.5, a / 5.5, 41, 3) - 0.5) * 1.5 + (0.5 - h) * 0.9,
          ) * 255,
        )));
      let f =
        fl(0.6, 0.78, fs(c / 1.4, a / 1.4, 77, 4)) *
        fl(0.47, 0.62, fs(c / 9, a / 9, 91, 2));
      ((e[u + 2] = Math.round(So(f) * 255)),
        (e[u + 3] = Math.round(
          So(
            fs(c / 22, a / 0.9, 57, 3) * 0.6 + fs(c / 13, a / 13, 63, 3) * 0.4,
          ) * 255,
        )));
    }
  }
  return e;
}

function U1(i, e, t, n, s) {
  let o = ((t - Li.x0) / Li.size) * e - 0.5,
    r = ((n - Li.z0) / Li.size) * e - 0.5;
  ((o = o < 0 ? 0 : o > e - 1.001 ? e - 1.001 : o),
    (r = r < 0 ? 0 : r > e - 1.001 ? e - 1.001 : r));
  let a = o | 0,
    l = r | 0,
    c = o - a,
    u = r - l,
    h = (l * e + a) * 4 + s,
    f = e * 4;
  return (
    ((i[h] * (1 - c) + i[h + 4] * c) * (1 - u) +
      (i[h + f] * (1 - c) + i[h + f + 4] * c) * u) /
    255
  );
}

function Cb(i) {
  let e = new Uint8Array(i * i * 4),
    t = new Uint8Array(i * i * 4),
    n = new Float32Array(i * i),
    s = new Float32Array(i * i);
  for (let r = 0; r < i; r++)
    for (let a = 0; a < i; a++) {
      let l = a / i,
        c = r / i,
        u = r * i + a,
        h =
          fs(l * 96, c * 96, 3, 2, 96) * 0.6 +
          fs(l * 40, c * 40, 9, 2, 40) * 0.4,
        f = fs(l * 6, c * 6, 21, 4, 6),
        p = (fs(l * 8, c * 8, 31, 2, 8) - 0.5) * 0.25,
        d = (fs(l * 8, c * 8, 37, 2, 8) - 0.5) * 0.25,
        v = 1 - Math.abs(2 * fs((l + p) * 5, (c + d) * 5, 43, 3, 5) - 1),
        g = fs(l * 28, c * 28, 51, 3, 28);
      ((e[u * 4] = Math.round(So(h) * 255)),
        (e[u * 4 + 1] = Math.round(So(f) * 255)),
        (e[u * 4 + 2] = Math.round(So(v) * 255)),
        (e[u * 4 + 3] = Math.round(So(g) * 255)),
        (n[u] = h),
        (s[u] = fs(l * 9, c * 9, 71, 4, 9)));
    }
  let o = (r) => (r + i) % i;
  for (let r = 0; r < i; r++)
    for (let a = 0; a < i; a++) {
      let l = r * i + a,
        c = (n[r * i + o(a + 1)] - n[r * i + o(a - 1)]) * 2.2,
        u = (n[o(r + 1) * i + a] - n[o(r - 1) * i + a]) * 2.2,
        h = (s[r * i + o(a + 2)] - s[r * i + o(a - 2)]) * 9,
        f = (s[o(r + 2) * i + a] - s[o(r - 2) * i + a]) * 9;
      ((t[l * 4] = Math.round(So(0.5 - c) * 255)),
        (t[l * 4 + 1] = Math.round(So(0.5 - u) * 255)),
        (t[l * 4 + 2] = Math.round(So(0.5 - h) * 255)),
        (t[l * 4 + 3] = Math.round(So(0.5 - f) * 255)));
    }
  return {
    det: e,
    nrm: t,
  };
}

function N1(i, e, { repeat: t = !0, aniso: n = 1 } = {}) {
  let s = new DataTexture(i, e, e, RGBAFormat, UnsignedByteType);
  return (
    (s.wrapS = s.wrapT = t ? RepeatWrapping : ClampToEdgeWrapping),
    (s.magFilter = LinearFilter),
    (s.minFilter = LinearMipmapLinearFilter),
    (s.generateMipmaps = !0),
    (s.anisotropy = n),
    (s.colorSpace = NoColorSpace),
    (s.needsUpdate = !0),
    s
  );
}

var fa = {
  x0: -40,
  z0: -30,
  w: 70,
  h: 60,
};

function Pb(i, e = 1) {
  let t = document.createElement("canvas");
  t.width = t.height = i;
  let n = t.getContext("2d");
  ((n.fillStyle = "#000"), n.fillRect(0, 0, i, i));
  let s = i / fa.w,
    o = i / fa.h;
  (n.setTransform(s, 0, 0, o, -fa.x0 * s, -fa.z0 * o),
    (n.globalCompositeOperation = "lighter"));
  let r = "#ff0000",
    a = "#00ff00",
    l =
      '"Big Shoulders Display", "Barlow Condensed", Impact, "Arial Narrow", sans-serif',
    c = 90210,
    u = () => {
      ((c |= 0), (c = (c + 1831565813) | 0));
      let A = Math.imul(c ^ (c >>> 15), 1 | c);
      return (
        (A = (A + Math.imul(A ^ (A >>> 7), 61 | A)) ^ A),
        ((A ^ (A >>> 14)) >>> 0) / 4294967296
      );
    },
    h = (A, _, M, E, w, S, z) => {
      ((n.strokeStyle = S),
        (n.lineWidth = w),
        (n.lineCap = "butt"),
        n.setLineDash(z || []),
        n.beginPath(),
        n.moveTo(A, _),
        n.lineTo(M, E),
        n.stroke(),
        n.setLineDash([]));
    },
    f = (A, _, M, E, w, S) => {
      ((n.strokeStyle = S),
        (n.lineWidth = w),
        n.setLineDash([]),
        n.strokeRect(A, _, M - A, E - _));
    },
    p = (A, _, M, E, w) => {
      ((n.fillStyle = w), n.fillRect(A, _, M - A, E - _));
    },
    d = (A, _, M, E, w, S) => {
      (n.save(),
        n.translate(_, M),
        n.rotate(w),
        n.scale(E / 100, E / 100),
        (n.font = `900 100px ${l}`),
        (n.textAlign = "left"),
        (n.textBaseline = "middle"),
        (n.fillStyle = S));
      let H = -n.measureText(A).width / 2;
      (n.fillText(A, H, 0),
        (n.globalCompositeOperation = "source-over"),
        (n.fillStyle = "#000"));
      for (let O of A) {
        let q = n.measureText(O).width;
        (" I1".includes(O) || n.fillRect(H + q * 0.36, -60, 4.5, 120),
          (H += q));
      }
      ((n.globalCompositeOperation = "lighter"), n.restore());
    },
    v = (A, _, M, E, w, S = 1.1, z = 0.14) => {
      (n.save(), n.beginPath(), n.rect(A, _, M - A, E - _), n.clip());
      let H = M - A + (E - _);
      for (let O = 0; O < H; O += S) h(A + O, _, A + O - (E - _), E, z, w);
      (n.restore(), f(A, _, M, E, 0.15, w));
    },
    g = (A, _, M, E) => {
      (n.save(),
        n.translate(A, _),
        n.scale(M, 1),
        (n.fillStyle = E),
        n.beginPath(),
        n.moveTo(-1.6, -0.14),
        n.lineTo(0.5, -0.14),
        n.lineTo(0.5, -0.5),
        n.lineTo(1.7, 0),
        n.lineTo(0.5, 0.5),
        n.lineTo(0.5, 0.14),
        n.lineTo(-1.6, 0.14),
        n.closePath(),
        n.fill(),
        n.restore());
    };
  (h(-25.6, 3.6, 16.2, 3.6, 0.15, r),
    h(-25.6, 8.4, -5.6, 8.4, 0.15, r),
    h(10.4, 8.4, 16.2, 8.4, 0.15, r),
    h(-24, 6, -3, 6, 0.12, a, [3, 4.5]),
    h(6, 6, 15.5, 6, 0.12, a, [3, 4.5]),
    h(-23, 14, 16.2, 14, 0.15, r),
    h(-23, 18.6, 16.2, 18.6, 0.15, r),
    h(-23, 16.3, 15.5, 16.3, 0.1, a, [2, 6]),
    h(-23, -3.6, 16.2, -3.6, 0.12, r),
    h(-23, 0.56, 16.2, 0.56, 0.12, r),
    h(-23, 24.2, 16.2, 24.2, 0.12, r),
    h(-37.5, 2.6, -26.4, 2.6, 0.15, a),
    h(-37.5, 9.2, -26.4, 9.2, 0.15, a),
    g(-14, 4.7, 1, a),
    g(13, 7.3, -1, a),
    g(-16, 15.2, 1, a),
    g(2, 17.5, -1, a),
    p(-26.2, 3.6, -25.75, 8.4, a));
  for (let A = 2.75; A < 9; A += 1) p(-31.2, A, -28.2, A + 0.5, a);
  (d("SLOW", -21.4, 6, 1.7, Math.PI / 2, a),
    d("10", -19, 6, 1.8, Math.PI / 2, a),
    (n.strokeStyle = a),
    (n.lineWidth = 0.14),
    n.beginPath(),
    n.ellipse(-19, 6, 1.35, 1.8, 0, 0, Math.PI * 2),
    n.stroke(),
    h(-30.4, 2.6, -30.4, -10.2, 0.12, a),
    h(-29, 2.6, -29, -8.8, 0.12, a),
    h(-30.4, -10.2, -7, -10.2, 0.12, a),
    h(-29, -8.8, -7, -8.8, 0.12, a));
  for (let A = -28; A < -7.5; A += 2.2) h(A, -10.2, A + 0.9, -8.8, 0.1, a);
  for (let A = -7.5; A < 2; A += 2.2) h(-30.4, A, -29, A + 0.9, 0.1, a);
  let x = [
      [-22.5, -10.3],
      [-5.3, 6.9],
      [10.5, 16.6],
    ],
    y = (A, _, M, E, w, S) => {
      x.forEach((z, H) => {
        if (S && H === 1) return;
        let O = H === 2 ? 1 : 2,
          q = _ - A > 4 ? 2 : 1;
        for (let U = 0; U < O; U++)
          for (let T = 0; T < q; T++) {
            let D = z[0] + ((z[1] - z[0]) * U) / O,
              C = z[0] + ((z[1] - z[0]) * (U + 1)) / O,
              G = A + ((_ - A) * T) / q,
              j = A + ((_ - A) * (T + 1)) / q;
            f(D - 0.12, G - 0.12, C + 0.12, j + 0.12, 0.1, a);
          }
        d(M + (H + 1), (z[0] + z[1]) / 2, E, 0.85, w, r);
      });
    };
  (y(-6.34, -3.9, "D0", -2.9, Math.PI, !1),
    y(0.86, 3.3, "C0", -0.15, 0, !1),
    y(8.7, 13.64, "B0", 14.75, Math.PI, !0),
    y(18.9, 23.84, "A0", 17.85, 0, !1));
  for (let A of [-10.3, -5.3, 6.9, 10.5])
    h(
      A + (A === -10.3 || A === 6.9 ? 0.35 : -0.35),
      -6.3,
      A + (A === -10.3 || A === 6.9 ? 0.35 : -0.35),
      23.8,
      0.1,
      r,
      [1.5, 1.5],
    );
  (v(-6.6, -10.9, -0.4, -8.9, r, 0.9, 0.12),
    v(12.2, -22.6, 16.2, -16.4, r),
    v(-0.9, 5.4, 3.9, 9.9, r, 0.95, 0.13),
    d("KEEP CLEAR", 1.5, 10.6, 0.62, 0, r),
    v(19.8, -4.2, 27.2, 4.2, r, 1.2, 0.16),
    d("KEEP CLEAR", 17.4, -19.5, 0.8, Math.PI / 2, r),
    h(16.9, -29.5, 16.9, 27.5, 0.15, r),
    h(17.7, -29.5, 17.7, 27.5, 0.1, r, [1, 1]),
    h(19.3, -29.5, 19.3, 27.5, 0.1, r, [1, 1]),
    h(27.7, -29.5, 27.7, 27.5, 0.1, r, [1, 1]),
    d("BERTH 4", 23.5, 21.6, 1.9, 0, a),
    d("BERTH 4", 23.5, -7.7, 1.7, Math.PI, a));
  for (let A = -27; A < 27; A += 9)
    d(
      String(400 + Math.round((A + 27) / 9) * 5),
      26.9,
      A + 2,
      0.5,
      Math.PI / 2,
      a,
    );
  n.lineCap = "round";
  let b = (A, _, M, E, w, S) => {
    for (let z of [-0.95, 0.95])
      for (let H of [-0.16, 0.16])
        ((n.strokeStyle = `rgba(0,0,255,${S})`),
          (n.lineWidth = 0.26),
          n.beginPath(),
          n.moveTo(A, _ + z + H),
          n.quadraticCurveTo(
            (A + M) / 2,
            (_ + E) / 2 + w + z + H,
            M,
            E + z + H,
          ),
          n.stroke());
  };
  for (let A = 0; A < 46; A++) {
    let _ = u() < 0.68 ? 6 : 16.3,
      M = _ + (u() - 0.5) * 2.6,
      E = -36 + u() * 40,
      w = 8 + u() * 26;
    b(
      E,
      M,
      Math.min(E + w, 28),
      M + (u() - 0.5) * 1.6,
      (u() - 0.5) * 1.4,
      0.1 + u() * 0.22,
    );
  }
  for (let A = 0; A < 12; A++) {
    let _ = u() < 0.5 ? 6 : 16.3,
      M = u() < 0.5 ? -1 : 1,
      E = 0.12 + u() * 0.2;
    ((n.strokeStyle = `rgba(0,0,255,${E})`),
      (n.lineWidth = 0.3),
      n.beginPath(),
      n.moveTo(10 + u() * 4, _ + (u() - 0.5) * 2),
      n.quadraticCurveTo(21 + u() * 3, _, 22 + u() * 4, _ + M * (8 + u() * 10)),
      n.stroke());
  }
  for (let A = 0; A < 60; A++) {
    let _ = -34 + u() * 62,
      M = -8 + u() * 34,
      E = 0.6 + u() * 2.5,
      w = (u() - 0.5) * 0.5;
    ((n.strokeStyle = `rgba(0,0,255,${0.15 + u() * 0.3})`),
      (n.lineWidth = 0.12 + u() * 0.2),
      n.beginPath(),
      n.moveTo(_, M),
      n.lineTo(_ + Math.cos(w) * E, M + Math.sin(w) * E),
      n.stroke());
  }
  let m = new CanvasTexture(t);
  return (
    (m.flipY = !1),
    (m.colorSpace = NoColorSpace),
    (m.wrapS = m.wrapT = ClampToEdgeWrapping),
    (m.minFilter = LinearMipmapLinearFilter),
    (m.magFilter = LinearFilter),
    (m.generateMipmaps = !0),
    (m.anisotropy = e),
    (m.needsUpdate = !0),
    m
  );
}

export { Li, Rb, U1, Cb, N1, Pb, fa };
