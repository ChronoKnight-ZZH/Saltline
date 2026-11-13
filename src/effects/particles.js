import {
  AddEquation,
  BufferAttribute,
  CanvasTexture,
  ClampToEdgeWrapping,
  CustomBlending,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  NoColorSpace,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Quaternion,
  RGBAFormat,
  SRGBColorSpace,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  ZeroFactor,
} from "../vendor/three-r180.js";

function yv(i) {
  let n = new Float32Array(4096),
    s = i >>> 0,
    o = () => {
      ((s |= 0), (s = (s + 1831565813) | 0));
      let l = Math.imul(s ^ (s >>> 15), 1 | s);
      return (
        (l = (l + Math.imul(l ^ (l >>> 7), 61 | l)) ^ l),
        ((l ^ (l >>> 14)) >>> 0) / 4294967296
      );
    };
  for (let l = 0; l < 4096; l++) n[l] = o();
  let r = (l, c) => {
    let u = Math.floor(l),
      h = Math.floor(c),
      f = l - u,
      p = c - h;
    ((f = f * f * (3 - 2 * f)), (p = p * p * (3 - 2 * p)));
    let d = u & 63,
      v = (u + 1) & 63,
      g = (h & 63) * 64,
      x = ((h + 1) & 63) * 64,
      y = n[g + d],
      b = n[g + v],
      m = n[x + d],
      A = n[x + v];
    return y + (b - y) * f + (m - y + (y - b - m + A) * f) * p;
  };
  return {
    noise: r,
    fbm: (l, c, u = 4) => {
      let h = 0,
        f = 0.5,
        p = 0;
      for (let d = 0; d < u; d++)
        ((h += r(l, c) * f),
          (p += f),
          (l = l * 2.03 + 17.1),
          (c = c * 2.03 + 9.7),
          (f *= 0.5));
      return h / p;
    },
    rnd: o,
  };
}

var To = (i, e, t) => {
  let n = (t - i) / (e - i);
  return ((n = n < 0 ? 0 : n > 1 ? 1 : n), n * n * (3 - 2 * n));
};

var Wc = 4;

var H1 = 2;

function Bb(i = 128) {
  let e = i * Wc,
    t = i * H1,
    n = new Uint8Array(e * t * 4),
    s = yv(9173),
    o = new Float32Array(i * i),
    r = new Float32Array(i * i),
    a = new Float32Array(i * i);
  for (let c = 0; c < Wc * H1; c++) {
    let u = c % Wc,
      h = Math.floor(c / Wc),
      f = c * 13.37 + 3.1,
      p = c * 7.77 + 1.3;
    for (let d = 0; d < i; d++)
      for (let v = 0; v < i; v++) {
        let g = ((v + 0.5) / i) * 2 - 1,
          x = ((d + 0.5) / i) * 2 - 1,
          y = 1 - To(0.78, 0.98, Math.max(Math.abs(g), Math.abs(x))),
          b,
          m,
          A;
        if (c === 6) {
          let M = x * 0.5 + 0.5,
            E = 0.16 + 0.5 * M * M,
            w = (s.fbm(g * 2 + f, M * 2 + p, 3) - 0.5) * 0.25,
            S = 1 - To(E * 0.3, E, Math.abs(g + w * M)),
            z = s.fbm(g * 9 + f, M * 2.2 + p, 4),
            H = 1 - To(0.55, 0.95, M - (s.noise(g * 6 + f, 3.3) - 0.5) * 0.35),
            O = To(0, 0.12, M);
          ((b = S * H * O * To(0.22, 0.7, z + 0.25 * (1 - M))),
            (m = S * H),
            (A = b * 0.5));
        } else {
          let M = c === 7,
            E = M ? 0.3 : 0.6,
            w = (s.fbm(g * 1.4 + f, x * 1.4 + p, 3) - 0.5) * E,
            S = (s.fbm(g * 1.4 + p + 5.2, x * 1.4 + f + 1.7, 3) - 0.5) * E,
            z = g + w,
            H = x + S,
            O = Math.sqrt(z * z + H * H),
            q = (s.fbm(z * 2.2 + f, H * 2.2 + p, 3) - 0.5) * 0.6,
            U = 1 - To(0, M ? 0.84 : 0.8, O + q),
            T = s.fbm(z * 4.2 + f * 2, H * 4.2 + p * 2, 5),
            D = U * (M ? 0.8 + 0.7 * T : 0.25 + 1.5 * T);
          ((b = To(M ? 0.02 : 0.06, M ? 0.7 : 0.95, D)),
            (m = U),
            (A =
              U * 0.55 + U * s.fbm(z * 3.1 + f * 3, H * 3.1 + p * 3, 3) * 0.9));
        }
        let _ = d * i + v;
        ((r[_] = b * y), (a[_] = m), (o[_] = A * y));
      }
    for (let d = 0; d < i; d++)
      for (let v = 0; v < i; v++) {
        let g = Math.max(0, v - 2),
          x = Math.min(i - 1, v + 2),
          y = Math.max(0, d - 2),
          b = Math.min(i - 1, d + 2),
          m = ((o[d * i + x] - o[d * i + g]) * i) / 8,
          A = ((o[b * i + v] - o[y * i + v]) * i) / 8,
          _ = 0.55,
          M = -m * _,
          E = -A * _,
          w = 1 / Math.sqrt(M * M + E * E + 1);
        ((M *= w), (E *= w));
        let S = ((h * i + d) * e + u * i + v) * 4,
          z = d * i + v;
        ((n[S] = Math.round((M * 0.5 + 0.5) * 255)),
          (n[S + 1] = Math.round((E * 0.5 + 0.5) * 255)),
          (n[S + 2] = Math.min(255, a[z] * 255)),
          (n[S + 3] = Math.min(255, r[z] * 255)));
      }
  }
  let l = new DataTexture(n, e, t, RGBAFormat, UnsignedByteType);
  return (
    (l.magFilter = LinearFilter),
    (l.minFilter = LinearMipmapLinearFilter),
    (l.generateMipmaps = !0),
    (l.wrapS = l.wrapT = ClampToEdgeWrapping),
    (l.colorSpace = NoColorSpace),
    (l.needsUpdate = !0),
    l
  );
}

var Af = 4;

var bv = 2;

var oo = 0;

var _v = 1;

var n0 = 2;

var OR = 3;

var Mv = 4;

var V1 = 5;

var Gc = 6;

var W1 = 7;

function Ob(i = 128) {
  let e = i * Af,
    t = i * bv,
    n = new Uint8Array(e * t * 4),
    s = yv(4441),
    o = [0, 1].map(() => {
      let a = 7 + Math.floor(s.rnd() * 4),
        l = [];
      for (let c = 0; c < a; c++)
        l.push({
          a: (c / a + (s.rnd() - 0.5) * 0.12) * Math.PI * 2,
          l: 0.35 + s.rnd() * 0.6,
          w: 0.018 + s.rnd() * 0.05,
          g: 0.5 + s.rnd() * 0.5,
        });
      return l;
    });
  for (let a = 0; a < 8; a++) {
    let l = a % Af,
      c = Math.floor(a / Af);
    for (let u = 0; u < i; u++)
      for (let h = 0; h < i; h++) {
        let f = ((h + 0.5) / i) * 2 - 1,
          p = ((u + 0.5) / i) * 2 - 1,
          d = Math.sqrt(f * f + p * p),
          v = 1 - To(0.86, 0.99, Math.max(Math.abs(f), Math.abs(p))),
          g = 0;
        if (a === oo) {
          let b = Math.max(0, 1 - d);
          g = b * b * b * 0.75 + Math.exp(-d * d * 22) * 0.5;
        } else if (a === _v) {
          let b = Math.pow(Math.max(0, 1 - f * f), 1.5);
          g = Math.exp(-(p * p) / (0.42 * 0.42)) * b;
        } else if (a === n0 || a === OR) {
          let b = o[a - n0],
            m = Math.atan2(p, f);
          for (let A of b) {
            let _ = Math.abs(m - A.a) % (Math.PI * 2);
            _ > Math.PI && (_ = Math.PI * 2 - _);
            let M = Math.sin(Math.min(_, 1.5)) * d;
            _ < 1.5 &&
              (g +=
                A.g *
                Math.exp(-(M * M) / (A.w * A.w * (0.4 + d))) *
                Math.pow(Math.max(0, 1 - d / A.l), 1.4));
          }
          g =
            g * (0.7 + 0.6 * s.fbm(f * 5 + a * 9, p * 5, 3)) +
            Math.exp(-d * d * 70) * 1.2 +
            Math.max(0, 1 - d * 2.2) * 0.06;
        } else if (a === Mv) {
          let b = Math.atan2(p, f),
            m =
              0.78 +
              (s.noise(Math.cos(b) * 2 + 5, Math.sin(b) * 2 + 5) - 0.5) * 0.04;
          g =
            Math.exp(-((d - m) * (d - m)) / (0.03 * 0.03)) *
              (0.6 + 0.4 * s.noise(Math.cos(b) * 5 + 9, Math.sin(b) * 5 + 9)) +
            0.05 * To(0.2, 0.78, d) * (1 - To(0.78, 0.8, d));
        } else if (a === V1) {
          let b = (s.fbm(f * 1.6 + 3.3, p * 1.6 + 8.1, 3) - 0.5) * 0.5,
            m = (s.fbm(f * 1.6 + 7.7, p * 1.6 + 2.2, 3) - 0.5) * 0.5,
            A = f + b,
            _ = p + m,
            M = Math.sqrt(A * A + _ * _),
            E = 1 - To(0, 0.84, M),
            w = s.fbm(A * 4 + 1.1, _ * 4 + 6.6, 5);
          g = To(0.04, 0.9, E * (0.3 + 1.4 * w)) * (0.45 + 0.75 * E);
        } else if (a === Gc) g = 1 - To(0.3, 0.62, d);
        else if (a === W1) {
          let b = f * 0.5 + 0.5,
            m = 0.22 + 0.3 * b,
            A = Math.exp(-(p * p) / (m * m)) * Math.pow(b, 1.8),
            _ = (f - 0.8) / 0.16;
          (f > 0.8 && (A *= Math.max(0, 1 - _ * _)), (g = A * 1.15));
        }
        g *= v;
        let x = Math.max(0, Math.min(255, g * 255)),
          y = ((c * i + u) * e + l * i + h) * 4;
        ((n[y] = n[y + 1] = n[y + 2] = x), (n[y + 3] = 255));
      }
  }
  let r = new DataTexture(n, e, t, RGBAFormat, UnsignedByteType);
  return (
    (r.magFilter = LinearFilter),
    (r.minFilter = LinearMipmapLinearFilter),
    (r.generateMipmaps = !0),
    (r.wrapS = r.wrapT = ClampToEdgeWrapping),
    (r.colorSpace = NoColorSpace),
    (r.needsUpdate = !0),
    r
  );
}

var dl = 4;

var xv = 2;

var da = {
  bullet_metal: [0, 1],
  bullet_concrete: [2, 3],
  bullet_wood: [4],
  scorch: [5],
  soot: [6],
  bullet_glass: [7],
};

function Hb(i = 256) {
  let e = i * dl,
    t = i * xv,
    n = document.createElement("canvas");
  ((n.width = e), (n.height = t));
  let s = document.createElement("canvas");
  ((s.width = e), (s.height = t));
  let o = document.createElement("canvas");
  ((o.width = e), (o.height = t));
  let r = n.getContext("2d"),
    a = s.getContext("2d"),
    l = o.getContext("2d", {
      willReadFrequently: !0,
    });
  ((l.fillStyle = "rgb(128,128,128)"), l.fillRect(0, 0, e, t));
  let c = (_, M) => {
      let E = l.createRadialGradient(0, 0, 0, 0, 0, M);
      for (let [w, S] of _) E.addColorStop(w, `rgb(${S},${S},${S})`);
      ((l.fillStyle = E),
        l.beginPath(),
        l.arc(0, 0, M, 0, Math.PI * 2),
        l.fill());
    },
    h = yv(77123).rnd;
  ((a.fillStyle = "rgb(0,235,0)"), a.fillRect(0, 0, e, t));
  let f = Math.PI * 2,
    p = (_, M, E, w = 22, S = 1) => {
      _.beginPath();
      for (let z = 0; z < w; z++) {
        let H = (z / w) * f,
          O = M * (1 + (h() - 0.5) * E),
          q = Math.cos(H) * O,
          U = Math.sin(H) * O * S;
        z ? _.lineTo(q, U) : _.moveTo(q, U);
      }
      _.closePath();
    },
    d = (_, M, E, w, S, z, H) => {
      _.beginPath();
      let O = E,
        q = M;
      _.moveTo(Math.cos(q) * O, Math.sin(q) * O);
      let U = 5 + Math.floor(h() * 4);
      for (let T = 1; T <= U; T++)
        ((O = E + ((w - E) * T) / U),
          (q += (h() - 0.5) * S),
          _.lineTo(Math.cos(q) * O, Math.sin(q) * O));
      ((_.strokeStyle = H),
        (_.lineWidth = z),
        (_.lineCap = "round"),
        (_.lineJoin = "round"),
        _.stroke());
    },
    v = (_, M) => {
      let E = ((_ % dl) + 0.5) * i,
        w = (Math.floor(_ / dl) + 0.5) * i,
        S = i / 2;
      for (let z of [r, a, l])
        (z.save(),
          z.beginPath(),
          z.rect(E - S, w - S, i, i),
          z.clip(),
          z.translate(E, w));
      (M(S), r.restore(), a.restore(), l.restore());
    },
    g = (_, M, E, w) => {
      let S = _.createRadialGradient(0, 0, M, 0, 0, E);
      for (let [z, H] of w) S.addColorStop(z, H);
      return S;
    };
  for (let _ of da.bullet_metal)
    v(_, (M) => {
      ((r.fillStyle = g(r, M * 0.1, M * 0.6, [
        [0, "rgba(14,13,12,0.4)"],
        [0.5, "rgba(18,17,16,0.14)"],
        [1, "rgba(20,20,20,0)"],
      ])),
        r.fillRect(-M, -M, 2 * M, 2 * M));
      let E = 6 + Math.floor(h() * 5);
      for (let T = 0; T < E; T++) {
        let D = h() * f;
        d(
          r,
          D,
          M * 0.2,
          M * (0.38 + h() * 0.45),
          0.3,
          0.8 + h() * 1,
          "rgba(8,8,8,0.55)",
        );
      }
      let w = M * (0.24 + h() * 0.08),
        S = 0.7 + h() * 0.5,
        z = h() * f,
        H = (T, D, C, G, j, N) => {
          for (let F of [r, a]) (F.save(), F.translate(T, D), F.rotate(G));
          let Q = [];
          for (let F = 0; F < N; F++) Q.push(1 + (h() - 0.5) * j);
          let K = (F, X) => {
            F.beginPath();
            for (let ne = 0; ne < N; ne++) {
              let re = (ne / N) * f,
                $ = C * Q[ne] * X,
                ue = Math.cos(re) * $,
                me = Math.sin(re) * $ * S;
              ne ? F.lineTo(ue, me) : F.moveTo(ue, me);
            }
            F.closePath();
          };
          (K(r, 1),
            (r.lineJoin = "miter"),
            (r.strokeStyle = "rgba(92,54,36,0.95)"),
            (r.lineWidth = Math.max(1.5, C * 0.14)),
            r.stroke());
          let ie = 150 + Math.floor(h() * 50);
          (K(r, 1),
            (r.fillStyle = g(r, 0, C * 1.2, [
              [0, `rgb(${ie - 30},${ie - 26},${ie - 20})`],
              [0.7, `rgb(${ie + 30},${ie + 33},${ie + 36})`],
              [1, `rgb(${ie},${ie + 3},${ie + 6})`],
            ])),
            r.fill(),
            K(a, 1),
            (a.fillStyle = "rgb(0,85,255)"),
            a.fill(),
            r.restore(),
            a.restore());
        };
      H(0, 0, w, z, 0.75, 11);
      let O = 2 + Math.floor(h() * 4);
      for (let T = 0; T < O; T++) {
        let D = h() * f,
          C = w * (1 + h() * 0.7);
        H(
          Math.cos(D) * C,
          Math.sin(D) * C,
          w * (0.15 + h() * 0.3),
          h() * f,
          0.8,
          7,
        );
      }
      for (let T = 0; T < 9; T++) {
        let D = h() * f,
          C = w * 0.3,
          G = w * (0.6 + h() * 0.3);
        (r.beginPath(),
          r.moveTo(Math.cos(D) * C, Math.sin(D) * C),
          r.lineTo(Math.cos(D + 0.1) * G, Math.sin(D + 0.1) * G),
          (r.strokeStyle =
            h() < 0.5 ? "rgba(245,246,248,0.7)" : "rgba(70,72,76,0.5)"),
          (r.lineWidth = 0.8),
          r.stroke());
      }
      let q = M * (0.1 + h() * 0.025),
        U = 8 + Math.floor(h() * 5);
      for (let T = 0; T < U; T++) {
        if (h() < 0.15) continue;
        let D = ((T + (h() - 0.5) * 0.6) / U) * f,
          C = q * (1.25 + h() * 0.9),
          G = 0.16 + h() * 0.16,
          j = 205 + Math.floor(h() * 50);
        (r.beginPath(),
          r.moveTo(Math.cos(D - G) * q * 0.9, Math.sin(D - G) * q * 0.9),
          r.lineTo(Math.cos(D) * C, Math.sin(D) * C),
          r.lineTo(Math.cos(D + G) * q * 0.9, Math.sin(D + G) * q * 0.9),
          r.closePath(),
          (r.fillStyle = `rgb(${j},${j},${Math.min(255, j + 4)})`),
          r.fill(),
          (r.strokeStyle = "rgba(40,40,42,0.6)"),
          (r.lineWidth = 0.7),
          r.stroke());
      }
      (a.beginPath(),
        a.arc(0, 0, q * 1.8, 0, f),
        (a.fillStyle = "rgb(0,60,255)"),
        a.fill(),
        p(r, q, 0.3, 11),
        (r.fillStyle = g(r, 0, q, [
          [0, "#000000"],
          [0.8, "#040404"],
          [1, "#141414"],
        ])),
        r.fill(),
        c(
          [
            [0, 0],
            [0.26, 10],
            [0.36, 240],
            [0.5, 200],
            [0.62, 100],
            [1, 128],
          ],
          q * 3.4,
        ),
        p(a, q, 0.1, 11),
        (a.fillStyle = "rgb(0,250,0)"),
        a.fill());
    });
  for (let _ of da.bullet_concrete)
    v(_, (M) => {
      ((r.fillStyle = g(r, M * 0.2, M * 0.9, [
        [0, "rgba(186,180,168,0.22)"],
        [0.6, "rgba(180,175,165,0.07)"],
        [1, "rgba(170,165,155,0)"],
      ])),
        r.fillRect(-M, -M, 2 * M, 2 * M));
      let E = 4 + Math.floor(h() * 4);
      for (let O = 0; O < E; O++) {
        let q = h() * f,
          U = M * (0.5 + h() * 0.42);
        (d(r, q, M * 0.25, U, 0.35, 1.3 + h() * 1.3, "rgba(20,19,18,0.75)"),
          h() < 0.5 &&
            d(
              r,
              q + (h() - 0.5) * 0.6,
              U * 0.7,
              U * 1.05,
              0.6,
              0.9,
              "rgba(20,19,18,0.5)",
            ));
      }
      let w = M * (0.33 + h() * 0.09),
        S = 12,
        z = [];
      for (let O = 0; O < S; O++) z.push(1 + (h() - 0.5) * 0.6);
      let H = (O, q, U, T) => {
        O.beginPath();
        for (let D = 0; D < S; D++) {
          let C = (D / S) * f,
            G = w * z[D] * q;
          D
            ? O.lineTo(Math.cos(C) * G + U, Math.sin(C) * G + T)
            : O.moveTo(Math.cos(C) * G + U, Math.sin(C) * G + T);
        }
        O.closePath();
      };
      (H(r, 1.05, 1.5, 1.5),
        (r.fillStyle = "rgba(22,21,20,0.8)"),
        r.fill(),
        H(r, 1, 0, 0),
        (r.fillStyle = g(r, w * 0.1, w * 1.1, [
          [0, "#35332f"],
          [0.4, "#6f6b63"],
          [0.8, "#8f8b82"],
          [1, "#9a968c"],
        ])),
        r.fill(),
        H(r, 0.97, -1, -1),
        (r.strokeStyle = "rgba(206,201,190,0.55)"),
        (r.lineWidth = 1.2),
        r.stroke());
      for (let O = 0; O < 6; O++) {
        let q = h() * f;
        d(r, q, w * 0.2, w * 0.9, 0.5, 1, "rgba(28,27,25,0.5)");
      }
      for (let O = 0; O < 60; O++) {
        let q = h() * f,
          U = Math.sqrt(h()) * w * 0.85;
        ((r.fillStyle =
          h() < 0.55 ? "rgba(36,34,32,0.6)" : "rgba(196,191,180,0.6)"),
          r.beginPath(),
          r.arc(Math.cos(q) * U, Math.sin(q) * U, 0.7 + h() * 2, 0, f),
          r.fill());
      }
      (p(r, w * 0.3, 0.45, 9),
        (r.fillStyle = g(r, 0, w * 0.33, [
          [0, "#060606"],
          [0.7, "#161514"],
          [1, "#2c2a27"],
        ])),
        r.fill(),
        c(
          [
            [0, 0],
            [0.24, 20],
            [0.3, 70],
            [0.8, 112],
            [0.88, 150],
            [1, 128],
          ],
          w * 1.15,
        ));
      for (let O = 0; O < 22; O++) {
        let q = h() * f,
          U = w * (1.15 + h() * 1.3);
        ((r.fillStyle =
          h() < 0.5 ? "rgba(190,185,175,0.45)" : "rgba(30,29,27,0.45)"),
          r.beginPath(),
          r.arc(Math.cos(q) * U, Math.sin(q) * U, 0.6 + h() * 1.6, 0, f),
          r.fill());
      }
    });
  for (let _ of da.bullet_wood)
    v(_, (M) => {
      (p(r, M * 0.27, 0.7, 11, 1.45),
        (r.fillStyle = "rgba(206,182,140,0.85)"),
        r.fill());
      for (let E = 0; E < 46; E++) {
        let w = (h() - 0.5) * M * 0.62,
          S = M * (0.25 + h() * 0.6) * (1 - Math.abs(w) / (M * 0.4)),
          z = (h() - 0.5) * M * 0.2;
        (r.beginPath(),
          r.moveTo(w, z - S),
          r.lineTo(w + (h() - 0.5) * 5, z + S),
          (r.strokeStyle =
            h() < 0.5 ? "rgba(236,216,172,0.85)" : "rgba(88,62,38,0.7)"),
          (r.lineWidth = 0.8 + h() * 2.2),
          r.stroke());
      }
      (p(r, M * 0.1, 0.5, 9, 1.1),
        (r.fillStyle = g(r, 0, M * 0.12, [
          [0, "#050403"],
          [0.8, "#140f0a"],
          [1, "#3a2a1a"],
        ])),
        r.fill(),
        c(
          [
            [0, 0],
            [0.5, 30],
            [0.8, 140],
            [1, 128],
          ],
          M * 0.17,
        ));
    });
  for (let _ of da.scorch)
    v(_, (M) => {
      ((r.fillStyle = g(r, 0, M * 0.98, [
        [0, "rgba(6,5,5,0.92)"],
        [0.3, "rgba(10,9,8,0.85)"],
        [0.55, "rgba(22,18,15,0.5)"],
        [0.8, "rgba(30,24,20,0.16)"],
        [1, "rgba(30,24,20,0)"],
      ])),
        r.fillRect(-M, -M, 2 * M, 2 * M));
      for (let E = 0; E < 90; E++) {
        let w = h() * f,
          S = M * (0.1 + h() * 0.3),
          z = M * (0.5 + h() * 0.46);
        (r.beginPath(),
          r.moveTo(Math.cos(w - 0.03) * S, Math.sin(w - 0.03) * S),
          r.lineTo(Math.cos(w) * z, Math.sin(w) * z),
          r.lineTo(Math.cos(w + 0.03) * S, Math.sin(w + 0.03) * S),
          r.closePath(),
          (r.fillStyle = `rgba(8,7,6,${0.12 + h() * 0.3})`),
          r.fill());
      }
      for (let E = 0; E < 60; E++) {
        let w = h() * f,
          S = M * (0.15 + h() * 0.6);
        ((r.fillStyle =
          h() < 0.3 ? "rgba(150,140,128,0.25)" : "rgba(0,0,0,0.4)"),
          r.beginPath(),
          r.arc(Math.cos(w) * S, Math.sin(w) * S, 1 + h() * 4, 0, f),
          r.fill());
      }
    });
  for (let _ of da.soot)
    v(_, (M) => {
      for (let E = 0; E < 14; E++) {
        let w = h() * f,
          S = h() * M * 0.3,
          z = M * (0.15 + h() * 0.3),
          H = Math.cos(w) * S,
          O = Math.sin(w) * S,
          q = r.createRadialGradient(H, O, 0, H, O, z);
        (q.addColorStop(0, "rgba(8,8,8,0.4)"),
          q.addColorStop(1, "rgba(8,8,8,0)"),
          (r.fillStyle = q),
          r.fillRect(-M, -M, 2 * M, 2 * M));
      }
      (p(r, M * 0.1, 0.4, 12), (r.fillStyle = "rgba(0,0,0,0.9)"), r.fill());
    });
  for (let _ of da.bullet_glass)
    v(_, (M) => {
      ((r.fillStyle = g(r, 0, M * 0.5, [
        [0, "rgba(235,240,242,0.55)"],
        [1, "rgba(235,240,242,0)"],
      ])),
        r.fillRect(-M, -M, 2 * M, 2 * M));
      for (let E = 0; E < 13; E++) {
        let w = ((E + h() * 0.6) / 13) * f;
        d(
          r,
          w,
          M * 0.07,
          M * (0.5 + h() * 0.45),
          0.12,
          0.9 + h(),
          "rgba(240,246,248,0.85)",
        );
      }
      for (let E = 0; E < 3; E++) {
        let w = M * (0.2 + E * 0.17 + h() * 0.05);
        for (let S = 0; S < 9; S++) {
          if (h() < 0.45) continue;
          let z = (S / 9) * f;
          (r.beginPath(),
            r.arc(0, 0, w, z, z + 0.5),
            (r.strokeStyle = "rgba(240,246,248,0.6)"),
            (r.lineWidth = 1),
            r.stroke());
        }
      }
      (p(r, M * 0.07, 0.3, 10), (r.fillStyle = "#060606"), r.fill());
    });
  let x = new CanvasTexture(n);
  ((x.colorSpace = SRGBColorSpace), (x.anisotropy = 4));
  let y = new CanvasTexture(s);
  y.colorSpace = NoColorSpace;
  let b = 2 / i,
    m = (_) => {
      let M = _ % dl,
        E = Math.floor(_ / dl);
      return [
        (M + b) / dl,
        1 - (E + 1 - b) / xv,
        (M + 1 - b) / dl,
        1 - (E + b) / xv,
      ];
    },
    A = null;
  try {
    let _ = l.getImageData(0, 0, e, t),
      M = _.data;
    if (M && M.length === e * t * 4) {
      let E = l.createImageData(e, t),
        w = E.data,
        S = 5 / 255;
      for (let z = 0; z < t; z++) {
        let H = Math.max(0, z - 1) * e,
          O = Math.min(t - 1, z + 1) * e;
        for (let q = 0; q < e; q++) {
          let U = Math.max(0, q - 1),
            T = Math.min(e - 1, q + 1),
            D = (M[(z * e + T) * 4] - M[(z * e + U) * 4]) * S,
            C = (M[(O + q) * 4] - M[(H + q) * 4]) * S,
            G = 1 / Math.sqrt(D * D + C * C + 1),
            j = (z * e + q) * 4;
          ((w[j] = (-D * G * 0.5 + 0.5) * 255),
            (w[j + 1] = (C * G * 0.5 + 0.5) * 255),
            (w[j + 2] = (G * 0.5 + 0.5) * 255),
            (w[j + 3] = 255));
        }
      }
      (l.putImageData(E, 0, 0),
        (A = new CanvasTexture(o)),
        (A.colorSpace = NoColorSpace));
    }
  } catch {
    A = null;
  }
  return {
    map: x,
    orm: y,
    nrm: A,
    uv: m,
  };
}

var HR = `
attribute vec4 aPos;    // xyz centre, w size (m)
attribute vec4 aAxis;   // mode 1: stretch axis (length = streak length); mode 2: plane normal; w = roll (rad)
attribute vec4 aCol;    // rgb (HDR), a
attribute vec4 aMisc;   // x atlas frame, y mode (0 billboard, 1 velocity-stretched, 2 surface-aligned), z age 0..1, w sun visibility
uniform vec2 uAtlas;
uniform float uPx;      // world size of one pixel at distance 1
varying vec2 vUv;
varying vec4 vCol;
varying vec3 vOff;
varying vec3 vToCam;
varying vec3 vInfo;     // view z, age, shade
varying float vSoftD;
varying vec3 vT;
varying vec3 vB;
void main() {
  vec2 c = position.xy;
  vec3 center = aPos.xyz; float size = aPos.w; float mode = aMisc.y;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 toCam = cameraPosition - center; float dist = length(toCam); toCam /= max(dist, 1e-4);
  float sn = sin(aAxis.w), cs = cos(aAxis.w);
  vec2 rc = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
  vec3 off; float comp = 1.0;
  if (mode < 0.5) {
    off = (camR * rc.x + camU * rc.y) * size;
    vT = camR * cs + camU * sn; vB = camU * cs - camR * sn;
  } else if (mode < 1.5) {
    float len = length(aAxis.xyz); vec3 d = aAxis.xyz / max(len, 1e-5);
    vec3 side = cross(d, toCam); float sl = length(side); side = sl > 1e-3 ? side / sl : camR;
    float w = max(size, dist * uPx * 1.4); comp = size / w;
    if (aMisc.w > 1.5) w = min(w, dist * uPx * aMisc.w);       // additive only: cap on-screen width (tracers near the lens)
    off = d * (c.x * max(len, w)) + side * (c.y * w);
    vT = d; vB = side;
  } else {
    vec3 n = normalize(aAxis.xyz);
    vec3 t = normalize(abs(n.y) > 0.9 ? cross(n, vec3(1.0, 0.0, 0.0)) : cross(vec3(0.0, 1.0, 0.0), n));
    vec3 b = cross(n, t);
    off = (t * rc.x + b * rc.y) * size;
    vT = t * cs + b * sn; vB = b * cs - t * sn;
  }
  vec4 mv = viewMatrix * vec4(center + off, 1.0);
  gl_Position = projectionMatrix * mv;
  float f = floor(aMisc.x + 0.5);
  float col = mod(f, uAtlas.x), row = floor(f / uAtlas.x);
  vUv = (vec2(col, row) + c + 0.5) / uAtlas;
  vCol = vec4(aCol.rgb * comp, aCol.a);
  vOff = off / max(size, 1e-4);
  vToCam = toCam;
  vInfo = vec3(mv.z, aMisc.z, aMisc.w);
  vSoftD = clamp(size * 0.4, 0.04, 0.7);
}`;

var Xb = `
uniform sampler2D uTex;
uniform sampler2D uDepth;
uniform vec2 uRes;
uniform vec2 uNearFar;
uniform float uSoft;
varying vec2 vUv;
varying vec4 vCol;
varying vec3 vOff;
varying vec3 vToCam;
varying vec3 vInfo;
varying float vSoftD;
varying vec3 vT;
varying vec3 vB;
float softFade() {
  float s = 1.0;
  if (uSoft > 0.5) {
    float d = texture2D(uDepth, gl_FragCoord.xy / uRes).x;
    float zs = (uNearFar.x * uNearFar.y) / ((uNearFar.y - uNearFar.x) * d - uNearFar.y);
    s = clamp((vInfo.x - zs) / vSoftD, 0.0, 1.0);
  }
  return s;
}`;

var VR =
  Xb +
  `
uniform vec3 uSun, uSunDir, uAmbLo, uAmbHi;
void main() {
  vec4 t = texture2D(uTex, vUv);
  float er = vInfo.y * 0.45;                                  // wisps erode as the puff ages
  float a = smoothstep(er, er + (vInfo.z > 1.5 ? 0.38 : 0.6), t.a) * vCol.a;   // fire lobes: denser body, crisper edge
  a *= softFade() * smoothstep(0.2, 0.9, -vInfo.x);           // soft intersection + fade right at the lens
  if (a < 0.004) discard;
  vec3 V = normalize(vToCam);
  vec3 q = vOff * 2.0; float r2 = min(dot(q, q), 1.0);
  vec3 Ns = q + V * (sqrt(1.0 - r2) * 0.9 + 0.05);            // overall sphere normal
  vec2 tn = t.rg * 2.0 - 1.0;                                 // billow normal from the flipbook
  vec3 Nb = vT * tn.x + vB * tn.y + V * sqrt(max(1.0 - dot(tn, tn), 0.0));
  vec3 N = normalize(Ns * 0.55 + Nb);
  float wrap = clamp((dot(N, uSunDir) + 0.45) / 1.45, 0.0, 1.0);
  float back = pow(clamp(dot(-V, uSunDir), 0.0, 1.0), 5.0);   // looking into the sun: forward scatter through thin edges
  float thin = 1.0 - t.b * smoothstep(0.0, 0.5, a);
  float hot = step(1.5, vInfo.z), shade = vInfo.z - 2.0 * hot;      // aMisc.w >= 2: emissive fire lobe (colour = emission)
  vec3 sun = uSun * (wrap * wrap * 0.85 + back * (0.15 + 1.3 * thin)) * shade;
  vec3 amb = mix(uAmbLo, uAmbHi, N.y * 0.5 + 0.5) * (1.0 - 0.35 * t.b);
  vec3 col = vCol.rgb * (amb + sun);
  if (hot > 0.5) {
    // alpha-blended fire: hot dense cores, dim orange skin, soot underneath. Because it is NOT additive, overlapping lobes
    // keep their shape and smoke in front can occlude them.
    float lump = clamp(dot(tn, vec2(0.6, 0.8)) * 0.6 + 0.5, 0.0, 1.0);
    float core = t.b * t.b * smoothstep(0.15, 0.9, t.a);
    vec3 fire = vCol.rgb * (0.10 + 1.7 * core) * (0.45 + 1.1 * lump);
    col = vec3(0.045, 0.042, 0.04) * (amb + sun) + fire;
  }
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;                         // premultiply after the (possibly no-op) output transform
}`;

var WR =
  Xb +
  `
void main() {
  float t = texture2D(uTex, vUv).r;
  float k = t * vCol.a * softFade();
  if (k < 0.002) discard;
  gl_FragColor = vec4(vCol.rgb * k, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

var Vb = new Vector2();

function Ev(
  i,
  e,
  {
    lit: t,
    tex: n,
    cols: s,
    rows: o,
    renderOrder: r,
    sun: a,
    sunDir: l,
    ambLo: c,
    ambHi: u,
  },
) {
  let h = new InstancedBufferGeometry();
  (h.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
      ]),
      3,
    ),
  ),
    h.setIndex([0, 1, 2, 0, 2, 3]));
  let f = (S) => {
      let z = new InstancedBufferAttribute(new Float32Array(e * 4), 4);
      return (z.setUsage(DynamicDrawUsage), h.setAttribute(S, z), z);
    },
    p = f("aPos"),
    d = f("aAxis"),
    v = f("aCol"),
    g = f("aMisc");
  h.instanceCount = 0;
  let x = {
    uTex: {
      value: n,
    },
    uAtlas: {
      value: new Vector2(s, o),
    },
    uPx: {
      value: 0.001,
    },
    uDepth: {
      value: null,
    },
    uRes: {
      value: new Vector2(1, 1),
    },
    uNearFar: {
      value: new Vector2(0.08, 900),
    },
    uSoft: {
      value: 0,
    },
  };
  t &&
    Object.assign(x, {
      uSun: {
        value: a,
      },
      uSunDir: {
        value: l,
      },
      uAmbLo: {
        value: c,
      },
      uAmbHi: {
        value: u,
      },
    });
  let y = new ShaderMaterial({
    uniforms: x,
    vertexShader: HR,
    fragmentShader: t ? VR : WR,
    transparent: !0,
    depthWrite: !1,
    depthTest: !0,
    side: DoubleSide,
    fog: !1,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: t ? OneMinusSrcAlphaFactor : OneFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
  });
  y.name = t ? "fx_lit" : "fx_add";
  let b = new Mesh(h, y);
  ((b.frustumCulled = !1),
    (b.renderOrder = r),
    (b.castShadow = !1),
    (b.receiveShadow = !1),
    (b.matrixAutoUpdate = !1),
    (b.name = y.name),
    (b.onBeforeRender = (S, z, H) => {
      let O = S.getRenderTarget(),
        q;
      O ? (q = O.height) : (S.getDrawingBufferSize(Vb), (q = Vb.y));
      let U = H.projectionMatrix.elements;
      x.uPx.value = 2 / (Math.max(U[5], 0.001) * Math.max(q, 1));
      let T = i.render,
        D = T && T.depthTexture;
      D &&
      D.image &&
      H === i.camera &&
      T.depthTextureIsLive !== !0 &&
      i.params.fxsoft !== "0"
        ? ((x.uDepth.value = D),
          (x.uSoft.value = 1),
          T.resolution && T.resolution.x > 0
            ? x.uRes.value.set(T.resolution.x, T.resolution.y)
            : x.uRes.value.set(D.image.width || 1, D.image.height || 1),
          x.uNearFar.value.set(H.near, H.far))
        : ((x.uDepth.value = null), (x.uSoft.value = 0));
    }));
  let m = p.array,
    A = d.array,
    _ = v.array,
    M = g.array,
    E = {
      mesh: b,
      cap: e,
      n: 0,
      P: m,
      A,
      C: _,
      M,
      begin() {
        E.n = 0;
      },
      push(S, z, H, O, q, U, T, D, C, G, j, N, Q, K, ie, F) {
        let X = E.n;
        if (X >= e) return !1;
        let ne = X * 4;
        return (
          (m[ne] = S),
          (m[ne + 1] = z),
          (m[ne + 2] = H),
          (m[ne + 3] = O),
          (A[ne] = q),
          (A[ne + 1] = U),
          (A[ne + 2] = T),
          (A[ne + 3] = D),
          (_[ne] = C),
          (_[ne + 1] = G),
          (_[ne + 2] = j),
          (_[ne + 3] = N),
          (M[ne] = Q),
          (M[ne + 1] = K),
          (M[ne + 2] = ie),
          (M[ne + 3] = F),
          (E.n = X + 1),
          !0
        );
      },
      end: null,
    },
    w = [p, d, v, g];
  return (
    (E.end = () => {
      let S = E.n;
      if (((h.instanceCount = S), (b.visible = S > 0), !!S))
        for (let z = 0; z < 4; z++) {
          let H = w[z];
          (H.clearUpdateRanges(),
            H.addUpdateRange(0, S * 4),
            (H.needsUpdate = !0));
        }
    }),
    E
  );
}

var qc = 1;

var Xc = 2;

var GR = 4;

var Rf = class {
  constructor(e, t) {
    ((this.cap = e), (this.sorted = t), (this.n = 0), (this.freeTop = e));
    let n = () => new Float32Array(e);
    ((this.px = n()),
      (this.py = n()),
      (this.pz = n()),
      (this.vx = n()),
      (this.vy = n()),
      (this.vz = n()),
      (this.age = n()),
      (this.life = n()),
      (this.s0 = n()),
      (this.s1 = n()),
      (this.sk = n()),
      (this.rot = n()),
      (this.rotv = n()),
      (this.r = n()),
      (this.g = n()),
      (this.b = n()),
      (this.a = n()),
      (this.drag = n()),
      (this.grav = n()),
      (this.wind = n()),
      (this.turb = n()),
      (this.seed = n()),
      (this.fin = n()),
      (this.fout = n()),
      (this.stretch = n()),
      (this.shade = n()),
      (this.key = n()),
      (this.gy = n()),
      (this.frame = new Uint8Array(e)),
      (this.mode = new Uint8Array(e)),
      (this.flags = new Uint8Array(e)),
      (this.ramp = new Uint8Array(e)),
      (this.order = new Uint16Array(e)),
      (this.free = new Uint16Array(e)));
    for (let s = 0; s < e; s++) this.free[s] = e - 1 - s;
  }
  clear() {
    ((this.n = 0), (this.freeTop = this.cap));
    for (let e = 0; e < this.cap; e++) this.free[e] = this.cap - 1 - e;
  }
  emit(e, t, n, s, o, r, a, l, c) {
    if (this.freeTop === 0) return -1;
    let u = this.free[--this.freeTop];
    return (
      (this.order[this.n++] = u),
      (this.px[u] = e),
      (this.py[u] = t),
      (this.pz[u] = n),
      (this.vx[u] = s),
      (this.vy[u] = o),
      (this.vz[u] = r),
      (this.age[u] = -1),
      (this.life[u] = a),
      (this.s0[u] = l),
      (this.s1[u] = c),
      (this.sk[u] = 2),
      (this.rot[u] = 0),
      (this.rotv[u] = 0),
      (this.r[u] = 1),
      (this.g[u] = 1),
      (this.b[u] = 1),
      (this.a[u] = 1),
      (this.drag[u] = 0),
      (this.grav[u] = 0),
      (this.wind[u] = 0),
      (this.turb[u] = 0),
      (this.seed[u] = Math.random() * 100),
      (this.fin[u] = 0),
      (this.fout[u] = 0.5),
      (this.stretch[u] = 0.02),
      (this.shade[u] = 1),
      (this.key[u] = 0),
      (this.gy[u] = 0),
      (this.frame[u] = 0),
      (this.mode[u] = 0),
      (this.flags[u] = 0),
      (this.ramp[u] = 0),
      u
    );
  }
  update(e, t, n, s, o) {
    let {
        px: r,
        py: a,
        pz: l,
        vx: c,
        vy: u,
        vz: h,
        age: f,
        life: p,
        order: d,
        flags: v,
      } = this,
      g = n.x,
      x = n.y,
      y = n.z,
      b = 0,
      m = this.n;
    for (let A = 0; A < m; A++) {
      let _ = d[A];
      if (f[_] < 0) f[_] = 0;
      else {
        if (((f[_] += e), f[_] >= p[_])) {
          this.free[this.freeTop++] = _;
          continue;
        }
        let M = 1 - Math.exp(-this.drag[_] * e),
          E = this.wind[_];
        ((c[_] += (s.x * E - c[_]) * M),
          (u[_] += (s.y * E - u[_]) * M),
          (h[_] += (s.z * E - h[_]) * M),
          (u[_] -= this.grav[_] * e));
        let w = this.turb[_];
        if (w > 0) {
          let H = this.seed[_];
          ((c[_] += Math.sin(a[_] * 2.3 + H + o * 1.7) * w * e),
            (h[_] += Math.cos(r[_] * 1.9 + H * 1.3 + o * 1.3) * w * e),
            (u[_] += Math.sin(l[_] * 2.1 + H * 0.7 + o * 2.1) * w * 0.4 * e));
        }
        ((r[_] += c[_] * e),
          (a[_] += u[_] * e),
          (l[_] += h[_] * e),
          (this.rot[_] += this.rotv[_] * e));
        let S = v[_],
          z = this.gy[_] + 0.012;
        if (S && a[_] < z) {
          if (S & Xc) {
            this.free[this.freeTop++] = _;
            continue;
          }
          S & qc
            ? ((a[_] = z),
              u[_] < 0 &&
                ((u[_] = -u[_] * (0.25 + (this.seed[_] % 1) * 0.3)),
                (c[_] *= 0.65),
                (h[_] *= 0.65)))
            : S & GR && ((a[_] = z), (c[_] = u[_] = h[_] = 0));
        }
      }
      if (this.sorted) {
        let M = r[_] - g,
          E = a[_] - x,
          w = l[_] - y;
        this.key[_] = M * M + E * E + w * w;
      }
      d[b++] = _;
    }
    if (((this.n = b), this.sorted && b > 1)) {
      let A = this.key;
      for (let _ = 1; _ < b; _++) {
        let M = d[_],
          E = A[M],
          w = _ - 1;
        for (; w >= 0 && A[d[w]] < E;) ((d[w + 1] = d[w]), w--);
        d[w + 1] = M;
      }
    }
    for (let A = 0; A < b; A++) {
      let _ = d[A],
        M = f[_] / p[_],
        E = 1 - M,
        w = 1 - Math.pow(E, this.sk[_]),
        S = this.s0[_] + (this.s1[_] - this.s0[_]) * w,
        z = this.a[_],
        H = this.fin[_],
        O = this.fout[_];
      if ((H > 0 && M < H && (z *= M / H), M > O)) {
        let Q = 1 - (M - O) / (1 - O);
        z *= Q * Q * (3 - 2 * Q);
      }
      let q = this.r[_],
        U = this.g[_],
        T = this.b[_],
        D = this.ramp[_];
      if (D === 1)
        ((q *= Math.pow(E, 0.5)),
          (U *= Math.pow(E, 1.4)),
          (T *= Math.pow(E, 3)));
      else if (D === 2) {
        let Q = 1 - Math.pow(M, 1.6),
          K = Q * Math.sqrt(Q);
        ((q *= K),
          (U *= (0.22 + 0.78 * Math.pow(Q, 1.3)) * K),
          (T *= (0.04 + 0.96 * Math.pow(Q, 3.5)) * K));
      } else if (D === 3) {
        let Q = 0.55 + 0.45 * Math.sin(o * 17 + this.seed[_] * 9);
        ((q *= Q), (U *= Q * (0.6 + 0.4 * E)), (T *= Q * E));
      }
      let C = this.mode[_],
        G = 0,
        j = 1,
        N = 0;
      if (C === 1) {
        let Q = this.stretch[_];
        ((G = c[_] * Q), (j = u[_] * Q), (N = h[_] * Q));
      }
      if (
        !t.push(
          r[_],
          a[_],
          l[_],
          S,
          G,
          j,
          N,
          this.rot[_],
          q,
          U,
          T,
          z,
          this.frame[_],
          C,
          M,
          this.shade[_],
        )
      )
        break;
    }
  }
};

var q1 = class {
  constructor(e = 48) {
    ((this.cap = e), (this.n = 0));
    let t = () => new Float32Array(e);
    ((this.fx = t()),
      (this.fy = t()),
      (this.fz = t()),
      (this.dx = t()),
      (this.dy = t()),
      (this.dz = t()),
      (this.dist = t()),
      (this.speed = t()),
      (this.trav = t()),
      (this.len = t()),
      (this.width = t()),
      (this.r = t()),
      (this.g = t()),
      (this.b = t()),
      (this.frames = new Uint8Array(e)));
  }
  clear() {
    this.n = 0;
  }
  add(e, t, n, s, o, r, a) {
    let l = this.n;
    l >= this.cap ? (l = 0) : this.n++;
    let c = t.x - e.x,
      u = t.y - e.y,
      h = t.z - e.z,
      f = Math.sqrt(c * c + u * u + h * h);
    if (f < 0.001) {
      l === this.n - 1 && this.n--;
      return;
    }
    ((this.fx[l] = e.x),
      (this.fy[l] = e.y),
      (this.fz[l] = e.z),
      (this.dx[l] = c / f),
      (this.dy[l] = u / f),
      (this.dz[l] = h / f),
      (this.dist[l] = f),
      (this.speed[l] = r),
      (this.trav[l] = 0),
      (this.len[l] = Math.min(Math.max(r * 0.022, 2), 7)),
      (this.width[l] = a),
      (this.r[l] = n),
      (this.g[l] = s),
      (this.b[l] = o),
      (this.frames[l] = 0));
  }
  update(e, t, n, s) {
    let o = this.n;
    for (let r = 0; r < o; r++) {
      let a = this.speed[r],
        l = this.dist[r],
        c = this.len[r];
      this.frames[r] === 0
        ? (this.trav[r] = Math.min(
            l,
            a * Math.max(e, 0.008) * (0.35 + Math.random() * 0.4),
          ))
        : (this.trav[r] += a * e);
      let u = Math.min(this.trav[r], l),
        h = Math.max(0, this.trav[r] - c);
      if (h >= l) {
        if (this.frames[r] >= 2) {
          if ((o--, r !== o)) {
            for (let E of qR) this[E][r] = this[E][o];
            this.frames[r] = this.frames[o];
          }
          r--;
          continue;
        }
        ((h = Math.max(0, l - c * 0.5)), (u = l));
      }
      this.frames[r] = Math.min(250, this.frames[r] + 1);
      let f = (u + h) * 0.5,
        p = Math.max(u - h, 0.05),
        d = this.dx[r],
        v = this.dy[r],
        g = this.dz[r],
        x = this.width[r],
        y = this.fx[r] + d * f,
        b = this.fy[r] + v * f,
        m = this.fz[r] + g * f,
        A = this.r[r],
        _ = this.g[r],
        M = this.b[r];
      (t.push(y, b, m, x, d * p, v * p, g * p, 0, A, _, M, 1, n, 1, 0, 5),
        t.push(
          y,
          b,
          m,
          x * 6,
          d * p * 1.05,
          v * p * 1.05,
          g * p * 1.05,
          0,
          A * 0.04,
          _ * 0.032,
          M * 0.028,
          1,
          n,
          1,
          0,
          28,
        ),
        t.push(
          this.fx[r] + d * u,
          this.fy[r] + v * u,
          this.fz[r] + g * u,
          x * 5,
          0,
          1,
          0,
          0,
          A * 0.2,
          _ * 0.16,
          M * 0.12,
          1,
          s,
          0,
          0,
          1,
        ));
    }
    this.n = o;
  }
};

var qR = [
  "fx",
  "fy",
  "fz",
  "dx",
  "dy",
  "dz",
  "dist",
  "speed",
  "trav",
  "len",
  "width",
  "r",
  "g",
  "b",
];

var ws = new Matrix4();

var Oo = new Quaternion();

var X1 = new Vector3();

var Y1 = new Vector3();

var Wb = new Vector3();

export {
  Wc,
  H1,
  Bb,
  Af,
  bv,
  oo,
  _v,
  n0,
  Mv,
  V1,
  Gc,
  W1,
  Ob,
  Ev,
  qc,
  Xc,
  Rf,
  q1,
  da,
  Hb,
  ws,
  Oo,
  X1,
  Y1,
  Wb,
};
