import {
  Av,
  Ns,
  Q1,
  Qn,
  Se,
  St,
  Us,
  Vo,
  Wo,
  Xt,
  ao,
  at,
  co,
  di,
  dn,
  ei,
  em,
  lo,
  tn,
  vt,
} from "./synthesis.js";

var MUSIC_TIMING = {
  bpm: 100,
  bar: 2.4,
  loopBars: 8,
  sr: 32e3,
};

var Cv = [
  {
    root: 38,
    tones: [0, 3, 7, 12, 10],
    base: 50,
  },
  {
    root: 34,
    tones: [0, 4, 7, 12, 11],
    base: 46,
  },
  {
    root: 31,
    tones: [0, 3, 7, 12, 10],
    base: 43,
  },
  {
    root: 33,
    tones: [0, 5, 7, 12, 10],
    base: 45,
  },
];

function Jb(i, e, t, n, s, o, r) {
  let a = Math.round((t + s) * i),
    l = new Float32Array(a),
    c = [r(), r(), r()],
    u = [1 - o, 1, 1 + o * 1.1];
  for (let h = 0; h < a; h++) {
    let f = h / i,
      p = 0;
    for (let v = 0; v < 3; v++)
      ((c[v] += (e * u[v]) / i),
        (c[v] -= Math.floor(c[v])),
        (p += 2 * c[v] - 1));
    let d =
      f < t
        ? 1 - Math.exp(-f / n)
        : (1 - Math.exp(-t / n)) * Math.exp(-(f - t) / (s * 0.3));
    l[h] = p * d * 0.33;
  }
  return (em(l, i, 0, 0.1), l);
}

function* G8(i, e) {
  let t = MUSIC_TIMING.bar * 8,
    n = Math.round(t * i),
    s = function* (o) {
      let r = new Float32Array(n);
      for (let a = 0; a < 4; a++) {
        let l = Cv[a],
          c = a * 4.8;
        for (let [u, h] of [
          [0, 1],
          [7, 0.6],
          [12, 0.5],
          [l.tones[1] + 12, 0.28],
        ])
          (Us(
            r,
            Jb(i, Ns(l.root + u), 4.6, 1.3, 1.8, 0.0035, o),
            c - 0.5,
            h * 0.3,
            i,
          ),
            yield);
      }
      return (
        Us(r, Jb(i, Ns(26), t - 0.2, 2.5, 0.2, 0.002, o), 0.1, 0.16, i),
        yield,
        di(
          r,
          "lp",
          (a) =>
            560 + 300 * Math.sin(vt * a * 2) + 120 * Math.sin(vt * a * 5 + 1),
          0.9,
          i,
          2,
        ),
        yield,
        r
      );
    };
  return [
    yield* s(ao(Math.floor(e() * 1e9))),
    yield* s(ao(Math.floor(e() * 1e9))),
  ];
}

function n_(i, e, t) {
  let n = Math.round(0.42 * i),
    s = new Float32Array(n),
    o = 0,
    r = 0,
    a = 0,
    l = 0,
    c = 0;
  for (let u = 0; u < n; u++) {
    let h = u / i;
    ((o += e / i),
      (o -= Math.floor(o)),
      (r += (e * 0.5) / i),
      (r -= Math.floor(r)));
    let f = 2 * o - 1 + 0.4 * (r < 0.5 ? 1 : -1);
    ((u & 15) === 0 &&
      (c = 1 - Math.exp((-vt * (300 + 2600 * t * Math.exp(-h / 0.06))) / i)),
      (a += (f - a) * c),
      (l += (a - l) * c),
      (s[u] = l * Math.exp(-h / 0.1) * Math.min(1, u / 40)));
  }
  return em(s, i, 0, 0.03);
}

function* q8(i) {
  let e = MUSIC_TIMING.bar * 8,
    t = new Float32Array(Math.round(e * i)),
    n = [0, 0, 2, 0, 1, 0, 2, 0, 3, 0, 2, 0, 1, 0, 4, 2],
    s = [
      1, 0.45, 0.7, 0.45, 0.85, 0.45, 0.7, 0.5, 1, 0.45, 0.7, 0.45, 0.85, 0.5,
      0.8, 0.6,
    ];
  for (let o = 0; o < 128; o++) {
    let r = Cv[(o >> 5) & 3],
      a = o & 15,
      l = n_(i, Ns(r.base + r.tones[n[a]]), s[a]);
    (Us(t, l, o * 0.15, 0.5 * (0.5 + 0.5 * s[a]), i),
      Us(t, l, o * 0.15 + 0.45, 0.14, i),
      (o & 7) === 7 && (yield));
  }
  return t;
}

function* X8(i, e) {
  let t = MUSIC_TIMING.bar * 4,
    n = new Float32Array(Math.round(t * i)),
    s = () =>
      Q1(
        Math.round(0.9 * i),
        [ei(i, 0.9, 74, 34, 0.07, 0.24, 0.002), 1],
        [
          at(i, e, 0.4, 0.07, {
            lp: 240,
          }),
          1.2,
        ],
        [
          at(i, e, 0.05, 0.008, {
            bp: 1400,
            q: 0.8,
          }),
          0.25,
        ],
      ),
    o = (a) =>
      Q1(
        Math.round(0.5 * i),
        [ei(i, 0.5, a, a * 0.55, 0.05, 0.12, 0.002), 1],
        [
          at(i, e, 0.1, 0.02, {
            lp: 600,
          }),
          0.5,
        ],
      ),
    r = (a) =>
      at(i, e, 0.06, 0.008 + a * 0.01, {
        hp: 6500,
      });
  for (let a = 0; a < 4; a++) {
    let l = a * 2.4;
    (Us(n, s(), l, 1, i),
      Us(n, o(104), l + 1.5, 0.55, i),
      a % 2 === 1 && Us(n, s(), l + 2.1, 0.6, i));
    for (let c = 0; c < 16; c++)
      Us(
        n,
        r(c % 4 === 2 ? 1 : 0),
        l + c * 0.15,
        c % 4 === 2 ? 0.34 : c % 2 ? 0.11 : 0.2,
        i,
      );
    yield;
  }
  for (let [a, l] of [
    [12, 120],
    [13, 104],
    [14, 88],
    [15, 74],
  ])
    Us(n, o(l), 7.2 + a * 0.15, 0.6, i);
  return Wo(n, 1.3);
}

function $c(i, e, t) {
  let n = Math.round(t * i),
    s = new Float32Array(n),
    o = 0,
    r = 0,
    a = 0,
    l = 0,
    c = null;
  for (let u = 0; u < n; u++) {
    let h = u / i,
      f = u / n,
      p = Math.pow(Math.sin(Math.PI * Math.pow(f, 0.8)), 1.5),
      d = 1 + 0.004 * Math.sin(vt * 5.1 * h) * Math.min(1, h);
    ((o += (e * d) / i),
      (o -= Math.floor(o)),
      (r += (e * 1.004 * d) / i),
      (r -= Math.floor(r)),
      (u & 31) === 0 && (c = Av("lp", 240 + 1700 * p * p, 1.1, i)));
    let v = 2 * o - 1 + (2 * r - 1),
      g = c[0] * v + a;
    ((a = c[1] * v - c[3] * g + l),
      (l = c[2] * v - c[4] * g),
      (s[u] = g * p * 0.5));
  }
  return s;
}

function* Y8(i) {
  let e = MUSIC_TIMING.bar * 8,
    t = new Float32Array(Math.round(e * i));
  for (let n = 0; n < 4; n++) {
    let s = Cv[n];
    for (let [o, r] of [
      [12, 1],
      [19, 0.7],
      [24 + s.tones[1], 0.5],
      [24, 0.4],
    ])
      (Us(t, $c(i, Ns(s.root + o), 4.7), n * 4.8 + 0.05, r * 0.3, i), yield);
  }
  return t;
}

function Pf(i, e, t) {
  let n = dn(i, t, [
      [e, t * 0.3, 1],
      [e * 2.003, t * 0.18, 0.4],
      [e * 3.01, t * 0.1, 0.18],
      [e * 4.2, t * 0.05, 0.1],
      [e * 0.5, t * 0.3, 0.25],
    ]),
    s = Math.round(0.006 * i);
  for (let o = 0; o < s; o++) n[o] *= o / s;
  return em(n, i, 0, 0.2);
}

function* $8(i) {
  let e = MUSIC_TIMING.bar * 8,
    t = new Float32Array(Math.round(e * i)),
    n = (s, o, r) => {
      let a = Pf(i, Ns(o), 3.2);
      (Us(t, a, s, r, i),
        Us(t, a, s + 0.45, r * 0.28, i),
        Us(t, a, s + 0.9, r * 0.1, i));
    };
  for (let [s, o] of [
    [0, 62],
    [0.9, 69],
    [1.8, 70],
    [3, 65],
  ])
    (n(s, o, 0.5), yield);
  for (let [s, o] of [
    [0, 62],
    [0.9, 69],
    [1.8, 72],
    [3, 67],
  ])
    (n(9.6 + s, o, 0.42), yield);
  return t;
}

function* Z8(i) {
  let e = St(i, 2.8);
  ([57, 62, 65, 69].forEach((t, n) => {
    (Se(e, Pf(i, Ns(t), 1.6), n * 0.15, 0.45 + n * 0.08, i),
      Se(e, n_(i, Ns(t), 1), n * 0.15, 0.3, i));
  }),
    Se(e, ei(i, 0.8, 73.4, 36.7, 0.1, 0.25, 0.002), 0.45, 0.7, i));
  for (let t of [50, 57, 62, 64])
    (Se(e, $c(i, Ns(t), 2.2), 0.45, 0.14, i), yield);
  return e;
}

function* j8(i) {
  let e = St(i, 4.2);
  (Se(e, ei(i, 1, 73.4, 36.7, 0.1, 0.3, 0.002), 0, 0.9, i),
    Se(e, ei(i, 1, 73.4, 36.7, 0.1, 0.3, 0.002), 0.6, 0.7, i));
  for (let t of [50, 57, 62, 65]) (Se(e, $c(i, Ns(t), 1.5), 0, 0.16, i), yield);
  for (let t of [48, 55, 60, 64])
    (Se(e, $c(i, Ns(t), 1.4), 0.6, 0.16, i), yield);
  for (let t of [50, 57, 62, 65, 69])
    (Se(e, $c(i, Ns(t), 2.9), 1.2, 0.17, i), yield);
  return (
    [62, 65, 69, 74].forEach((t, n) =>
      Se(e, Pf(i, Ns(t), 2), 1.2 + n * 0.15, 0.4, i),
    ),
    e
  );
}

function* J8(i) {
  let e = St(i, 6);
  Se(e, ei(i, 1.4, 73.4, 36.7, 0.15, 0.4, 0.003), 0, 0.9, i);
  for (let [t, n] of [
    [38, 1],
    [50, 0.8],
    [57, 0.7],
    [62, 0.7],
    [66, 0.7],
    [69, 0.5],
  ])
    (Se(e, $c(i, Ns(t), 5.6), 0, 0.14 * n, i), yield);
  return (
    [62, 66, 69, 74, 78, 81].forEach((t, n) => {
      (Se(e, Pf(i, Ns(t), 3), 0.3 + n * 0.3, 0.42, i),
        Se(e, Pf(i, Ns(t), 3), 0.75 + n * 0.3, 0.12, i));
    }),
    e
  );
}

function K8(i, e) {
  let t = St(i, 3.8),
    n = t.length,
    s = [0, 0, 0];
  for (let o = 0; o < n; o++) {
    let r = o / i,
      a = Math.pow(2, -1.1 * Math.pow(r / 3.8, 0.7)),
      l = 0;
    ([73.42, 110, 146.83].forEach((c, u) => {
      ((s[u] += (c * a * (1 + u * 0.002)) / i),
        (s[u] -= Math.floor(s[u])),
        (l += (2 * s[u] - 1) * (u === 1 ? 0.6 : 1)));
    }),
      (t[o] =
        l * 0.3 * Math.pow(1 - r / 3.8, 1.3) * (1 - Math.exp(-r / 0.01))));
  }
  return (
    di(t, "lp", Vo(1500, 110, 0.7), 1.2, i),
    Se(t, ei(i, 1.2, 82, 30, 0.12, 0.35, 0.002), 0, 1, i),
    Se(
      t,
      at(i, e, 0.3, 0.06, {
        lp: 300,
      }),
      0,
      0.8,
      i,
    ),
    t
  );
}

function Q8(i, e) {
  let t = (n, s) => {
    let o = St(i, 1.4),
      r = [
        [0.062, 0.55],
        [0.089, 0.42],
        [0.118, 0.36],
        [0.151, 0.26],
        [0.178, 0.2],
        [0.243, 0.1],
      ];
    for (let [l, c] of r)
      Se(
        o,
        at(i, n, 0.01, 0.0018, {
          hp: 700,
          lp: 5500,
        }),
        l * (s ? 1.07 : 0.96) + Xt(n, 0, 0.006),
        c * Xt(n, 0.6, 1.15),
        i,
      );
    let a = Qn(i, 1.3, n);
    return (
      tn(a, "hp", 300, 0.7, i),
      di(a, "lp", Vo(6e3, 900, 0.6), 0.7, i),
      Se(o, lo(a, i, co(0.27, 0.04)), 0.04, 0.045, i),
      o
    );
  };
  return [t(ao(Math.floor(e() * 1e9)), 0), t(ao(Math.floor(e() * 1e9)), 1)];
}

function eC(i, e) {
  let t = (n, s) => {
    let o = St(i, 2.2),
      r = Qn(i, 2.18, n);
    (di(r, "lp", Vo(5200, 650, 0.5), 0.7, i),
      Se(o, lo(r, i, co(0.33, 0.006)), 0.012, 0.3, i));
    let a = Qn(i, 2.1, n);
    (tn(a, "lp", 260, 0.7, i), Se(o, lo(a, i, co(0.4, 0.01)), 0.012, 0.5, i));
    for (let [l, c] of [
      [0.018, 0.7],
      [0.031, 0.55],
      [0.047, 0.45],
      [0.093, 0.3],
      [0.139, 0.2],
    ])
      Se(
        o,
        at(i, n, 0.008, 0.0015, {
          lp: 4500,
        }),
        l * (s ? 1.09 : 0.95),
        c,
        i,
      );
    return o;
  };
  return [t(ao(Math.floor(e() * 1e9)), 0), t(ao(Math.floor(e() * 1e9)), 1)];
}

export { MUSIC_TIMING, G8, q8, X8, Y8, $8, Z8, j8, J8, K8, Q8, eC };
