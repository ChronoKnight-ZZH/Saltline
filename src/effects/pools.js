import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector2,
  Vector3,
} from "../vendor/three-r180.js";
import { Hb, Oo, Wb, X1, Y1, da, ws } from "./particles.js";

function XR() {
  let i = new BoxGeometry(1, 1, 1, 2, 1, 2),
    e = i.attributes.position,
    t = 1234.5,
    n = () => (
      (t = Math.sin(t * 12.9898 + 78.233) * 43758.5453),
      (t -= Math.floor(t)),
      t
    ),
    s = new Map();
  for (let o = 0; o < e.count; o++) {
    let r =
        e.getX(o).toFixed(3) +
        "," +
        e.getY(o).toFixed(3) +
        "," +
        e.getZ(o).toFixed(3),
      a = s.get(r);
    if (!a) {
      let l = e.getX(o),
        c = e.getY(o),
        u = e.getZ(o),
        f = Math.abs(l) > 0.49 && Math.abs(u) > 0.49 ? 0.72 + n() * 0.2 : 1;
      ((l = l * f + (n() - 0.5) * 0.14),
        (u = u * f + (n() - 0.5) * 0.14),
        (c = c * (0.8 + n() * 0.3) + (n() - 0.5) * 0.1),
        (a = [l, c, u]),
        s.set(r, a));
    }
    e.setXYZ(o, a[0], a[1], a[2]);
  }
  return ((i = i.toNonIndexed()), i.computeVertexNormals(), i);
}

var $1 = class {
  constructor(e, t = 256) {
    ((this.G = e), (this.cap = t), (this.next = 0), (this.live = 0));
    let n = new MeshStandardMaterial({
      color: 16777215,
      roughness: 0.82,
      metalness: 0.05,
    });
    n.name = "fx_debris";
    let s = (this.mesh = new InstancedMesh(XR(), n, t));
    (s.instanceMatrix.setUsage(DynamicDrawUsage),
      (s.instanceColor = new InstancedBufferAttribute(
        new Float32Array(t * 3).fill(1),
        3,
      )),
      (s.frustumCulled = !1),
      (s.castShadow = !1),
      (s.receiveShadow = !0),
      (s.name = "fx_debris"));
    let o = () => new Float32Array(t);
    ((this.px = o()),
      (this.py = o()),
      (this.pz = o()),
      (this.vx = o()),
      (this.vy = o()),
      (this.vz = o()),
      (this.ax = o()),
      (this.ay = o()),
      (this.az = o()),
      (this.ang = o()),
      (this.spin = o()),
      (this.sx = o()),
      (this.sy = o()),
      (this.sz = o()),
      (this.age = o()),
      (this.life = o()),
      (this.floor = o()),
      (this.state = new Uint8Array(t)),
      ws.makeScale(0, 0, 0));
    for (let r = 0; r < t; r++) ws.toArray(s.instanceMatrix.array, r * 16);
    s.visible = !1;
  }
  clear() {
    (this.state.fill(0), ws.makeScale(0, 0, 0));
    for (let e = 0; e < this.cap; e++)
      ws.toArray(this.mesh.instanceMatrix.array, e * 16);
    ((this.mesh.instanceMatrix.needsUpdate = !0),
      (this.live = 0),
      (this.mesh.visible = !1));
  }
  add(e, t, n, s, o, r, a, l, c, u, h, f, p, d) {
    let v = this.next;
    ((this.next = (v + 1) % this.cap),
      (this.px[v] = e),
      (this.py[v] = t),
      (this.pz[v] = n),
      (this.vx[v] = s),
      (this.vy[v] = o),
      (this.vz[v] = r));
    let g = Math.random() - 0.5,
      x = Math.random() - 0.5,
      y = Math.random() - 0.5,
      b = Math.hypot(g, x, y) || 1;
    ((this.ax[v] = g / b),
      (this.ay[v] = x / b),
      (this.az[v] = y / b),
      (this.ang[v] = Math.random() * 6.28),
      (this.spin[v] = (Math.random() - 0.5) * 50),
      (this.sx[v] = a),
      (this.sy[v] = l),
      (this.sz[v] = c),
      (this.age[v] = 0),
      (this.life[v] = p),
      (this.floor[v] = d),
      (this.state[v] = 1));
    let m = this.mesh.instanceColor.array;
    ((m[v * 3] = u),
      (m[v * 3 + 1] = h),
      (m[v * 3 + 2] = f),
      (this.mesh.instanceColor.needsUpdate = !0));
  }
  update(e) {
    let t = this.state,
      n = this.mesh.instanceMatrix.array,
      s = 0,
      o = !1;
    for (let r = 0; r < this.cap; r++) {
      let a = t[r];
      if (!a) continue;
      this.age[r] += e;
      let l = this.life[r] - this.age[r];
      if (l <= 0) {
        ((t[r] = 0), ws.makeScale(0, 0, 0), ws.toArray(n, r * 16), (o = !0));
        continue;
      }
      if ((s++, a === 2 && l > 0.5)) continue;
      if (a === 1) {
        ((this.vy[r] -= 9.81 * e),
          (this.px[r] += this.vx[r] * e),
          (this.py[r] += this.vy[r] * e),
          (this.pz[r] += this.vz[r] * e),
          (this.ang[r] += this.spin[r] * e));
        let u =
          this.floor[r] + Math.min(this.sx[r], this.sy[r], this.sz[r]) * 0.5;
        this.py[r] < u &&
          this.vy[r] < 0 &&
          ((this.py[r] = u),
          this.vy[r] > -1.2
            ? ((t[r] = 2), (this.vx[r] = this.vy[r] = this.vz[r] = 0))
            : ((this.vy[r] = -this.vy[r] * 0.32),
              (this.vx[r] *= 0.55),
              (this.vz[r] *= 0.55),
              (this.spin[r] *= 0.5)));
      }
      let c = l < 0.5 ? l / 0.5 : 1;
      (Wb.set(this.ax[r], this.ay[r], this.az[r]),
        Oo.setFromAxisAngle(Wb, this.ang[r]),
        X1.set(this.px[r], this.py[r], this.pz[r]),
        Y1.set(this.sx[r] * c, this.sy[r] * c, this.sz[r] * c),
        ws.compose(X1, Oo, Y1),
        ws.toArray(n, r * 16),
        (o = !0));
    }
    ((this.live = s),
      (this.mesh.visible = s > 0),
      o && (this.mesh.instanceMatrix.needsUpdate = !0));
  }
};

var wv = {
  pos: new Vector3(),
  surface: "concrete",
};

var YR = new Vector3(0, -1, 0);

var Gb = new Vector3();

var qb = new Quaternion();

var G1 = new Euler();

function $R() {
  let t = [
      [0, 0],
      [0.006076, 0],
      [0.0062, 0.0012],
      [0.005083999999999999, 0.0022],
      [0.005083999999999999, 0.0034],
      [0.006013999999999999, 0.0046],
      [0.005889999999999999, 0.036399999999999995],
      [0.004092, 0.0416],
      [0.003968, 0.052],
      [0.003224, 0.052],
      [0.0031, 0.044719999999999996],
    ],
    n = new LatheGeometry(
      t.map((s) => new Vector2(s[0], s[1] - 0.052 / 2)),
      10,
    );
  return (n.computeVertexNormals(), n);
}

var Z1 = class {
  constructor(e, t = 60) {
    ((this.G = e), (this.cap = t), (this.next = 0));
    let n;
    try {
      n = e.mats.get("brass");
    } catch {
      n = null;
    }
    (!n || !n.isMaterial) &&
      (n = new MeshStandardMaterial({
        color: 11570492,
        roughness: 0.3,
        metalness: 1,
      }));
    let s = (this.mesh = new InstancedMesh($R(), n, t));
    (s.instanceMatrix.setUsage(DynamicDrawUsage),
      (s.frustumCulled = !1),
      (s.castShadow = !1),
      (s.receiveShadow = !0),
      (s.name = "fx_shells"));
    let o = () => new Float32Array(t);
    ((this.px = o()),
      (this.py = o()),
      (this.pz = o()),
      (this.vx = o()),
      (this.vy = o()),
      (this.vz = o()),
      (this.qx = o()),
      (this.qy = o()),
      (this.qz = o()),
      (this.qw = o().fill(1)),
      (this.wx = o()),
      (this.wy = o()),
      (this.wz = o()),
      (this.age = o()),
      (this.rest = o()),
      (this.floor = o()),
      (this.state = new Uint8Array(t)),
      (this.bounces = new Uint8Array(t)),
      ws.makeScale(0, 0, 0));
    for (let r = 0; r < t; r++) ws.toArray(s.instanceMatrix.array, r * 16);
    ((s.visible = !1), (this.surface = new Array(t).fill("concrete")));
  }
  clear() {
    (this.state.fill(0), ws.makeScale(0, 0, 0));
    for (let e = 0; e < this.cap; e++)
      ws.toArray(this.mesh.instanceMatrix.array, e * 16);
    ((this.mesh.instanceMatrix.needsUpdate = !0), (this.mesh.visible = !1));
  }
  _floorAt(e) {
    let t = this.G.physics;
    if (((this.floor[e] = 0), (this.surface[e] = "concrete"), t && t.raycast)) {
      Gb.set(this.px[e], this.py[e] + 0.25, this.pz[e]);
      let n = t.raycast(Gb, YR, 6);
      n
        ? ((this.floor[e] = n.point.y),
          (this.surface[e] = n.surface || "concrete"))
        : (this.floor[e] = -50);
    }
  }
  add(e, t) {
    let n = this.next;
    ((this.next = (n + 1) % this.cap),
      (this.px[n] = e.x),
      (this.py[n] = e.y),
      (this.pz[n] = e.z),
      (this.vx[n] = t.x),
      (this.vy[n] = t.y),
      (this.vz[n] = t.z),
      G1.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
      Oo.setFromEuler(G1),
      (this.qx[n] = Oo.x),
      (this.qy[n] = Oo.y),
      (this.qz[n] = Oo.z),
      (this.qw[n] = Oo.w),
      (this.wx[n] = (Math.random() - 0.5) * 40),
      (this.wy[n] = (Math.random() - 0.5) * 20),
      (this.wz[n] = (Math.random() - 0.5) * 40),
      (this.age[n] = 0),
      (this.rest[n] = 0),
      (this.state[n] = 1),
      (this.bounces[n] = 0),
      this._floorAt(n));
  }
  update(e) {
    let t = this.state,
      n = this.mesh.instanceMatrix.array,
      s = 0,
      o = !1;
    for (let r = 0; r < this.cap; r++) {
      let a = t[r];
      if (!a) continue;
      (s++, (this.age[r] += e));
      let l = 1;
      if (a === 1) {
        ((this.vy[r] -= 9.81 * e),
          (this.px[r] += this.vx[r] * e),
          (this.py[r] += this.vy[r] * e),
          (this.pz[r] += this.vz[r] * e));
        let c = this.wx[r],
          u = this.wy[r],
          h = this.wz[r],
          f = this.qx[r],
          p = this.qy[r],
          d = this.qz[r],
          v = this.qw[r],
          g = 0.5 * e,
          x = f + g * (c * v + u * d - h * p),
          y = p + g * (u * v + h * f - c * d),
          b = d + g * (h * v + c * p - u * f),
          m = v - g * (c * f + u * p + h * d),
          A = 1 / (Math.hypot(x, y, b, m) || 1);
        ((this.qx[r] = x * A),
          (this.qy[r] = y * A),
          (this.qz[r] = b * A),
          (this.qw[r] = m * A));
        let _ = this.floor[r] + 0.0065;
        if (this.py[r] < _ && this.vy[r] < 0) {
          this.py[r] = _;
          let M = this.bounces[r]++;
          (M < 2 &&
            (wv.pos.set(this.px[r], this.py[r], this.pz[r]),
            (wv.surface = this.surface[r]),
            this.G.events.emit("shell:bounce", wv)),
            this.vy[r] > -0.9 || M >= 4
              ? ((t[r] = 2),
                (this.vx[r] = this.vy[r] = this.vz[r] = 0),
                G1.set(Math.PI / 2, 0, Math.random() * 6.28, "ZXY"),
                Oo.setFromEuler(G1),
                (this.qx[r] = Oo.x),
                (this.qy[r] = Oo.y),
                (this.qz[r] = Oo.z),
                (this.qw[r] = Oo.w))
              : ((this.vy[r] = -this.vy[r] * (0.32 + Math.random() * 0.16)),
                (this.vx[r] = this.vx[r] * 0.6 + (Math.random() - 0.5) * 0.6),
                (this.vz[r] = this.vz[r] * 0.6 + (Math.random() - 0.5) * 0.6),
                (this.wx[r] = (Math.random() - 0.5) * 50),
                (this.wy[r] = (Math.random() - 0.5) * 30),
                (this.wz[r] = (Math.random() - 0.5) * 50),
                M === 0 && this._floorAt(r)));
        }
        this.age[r] > 8 && (t[r] = 2);
      } else {
        if (((this.rest[r] += e), this.rest[r] < 4 && this.rest[r] > e * 1.5))
          continue;
        if (this.rest[r] >= 4.7) {
          ((t[r] = 0), ws.makeScale(0, 0, 0), ws.toArray(n, r * 16), (o = !0));
          continue;
        }
        this.rest[r] >= 4 && (l = 1 - (this.rest[r] - 4) / 0.7);
      }
      (qb.set(this.qx[r], this.qy[r], this.qz[r], this.qw[r]),
        X1.set(this.px[r], this.py[r], this.pz[r]),
        Y1.set(l, l, l),
        ws.compose(X1, qb, Y1),
        ws.toArray(n, r * 16),
        (o = !0));
    }
    ((this.mesh.visible = s > 0),
      o && (this.mesh.instanceMatrix.needsUpdate = !0));
  }
};

var ZR = {
  bullet_metal: 0.25,
  bullet_concrete: 0.34,
  bullet_wood: 0.24,
  scorch: 2.4,
  soot: 0.3,
  bullet_glass: 0.3,
};

var Yb = 14;

var j1 = class {
  constructor(e, t = 160) {
    ((this.cap = t), (this.next = 0), (this.count = 0));
    let n = (this.atlas = Hb(256)),
      s = new BufferGeometry();
    ((this.pos = new BufferAttribute(new Float32Array(t * 12), 3)),
      this.pos.setUsage(DynamicDrawUsage),
      (this.nor = new BufferAttribute(new Float32Array(t * 12), 3)),
      this.nor.setUsage(DynamicDrawUsage),
      (this.uv = new BufferAttribute(new Float32Array(t * 8), 2)),
      this.uv.setUsage(DynamicDrawUsage),
      (this.col = new BufferAttribute(new Float32Array(t * 16), 4)),
      this.col.setUsage(DynamicDrawUsage),
      (this.baseA = new Float32Array(t)),
      s.setAttribute("position", this.pos),
      s.setAttribute("normal", this.nor),
      s.setAttribute("uv", this.uv),
      s.setAttribute("color", this.col));
    let o = new Uint16Array(t * 6);
    for (let l = 0; l < t; l++) {
      let c = l * 4,
        u = l * 6;
      ((o[u] = c),
        (o[u + 1] = c + 1),
        (o[u + 2] = c + 2),
        (o[u + 3] = c),
        (o[u + 4] = c + 2),
        (o[u + 5] = c + 3));
    }
    s.setIndex(new BufferAttribute(o, 1));
    let r = new MeshStandardMaterial({
      map: n.map,
      roughnessMap: n.orm,
      metalnessMap: n.orm,
      roughness: 1,
      metalness: 1,
      transparent: !0,
      vertexColors: !0,
      depthWrite: !1,
      polygonOffset: !0,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    (n.nrm && ((r.normalMap = n.nrm), (r.normalScale = new Vector2(1, 1))),
      (r.name = "fx_decals"));
    let a = (this.mesh = new Mesh(s, r));
    ((a.frustumCulled = !1),
      (a.castShadow = !1),
      (a.receiveShadow = !0),
      (a.renderOrder = -5),
      (a.matrixAutoUpdate = !1),
      (a.name = "fx_decals"),
      (a.visible = !1),
      (this.uvs = {}));
    for (let l in da) this.uvs[l] = da[l].map((c) => n.uv(c));
  }
  clear() {
    (this.col.array.fill(0),
      this.pos.array.fill(0),
      (this.col.needsUpdate = this.pos.needsUpdate = !0),
      (this.next = 0),
      (this.count = 0),
      (this.mesh.visible = !1));
  }
  add(e, t, n, s, o = 1, r = 1) {
    let a = this.uvs[n] || this.uvs.bullet_concrete,
      l = a[(Math.random() * a.length) | 0],
      c = (s || ZR[n] || 0.25) * (0.85 + Math.random() * 0.3) * 0.5,
      u = this.next;
    ((this.next = (u + 1) % this.cap), this.count < this.cap && this.count++);
    let h = t.x,
      f = t.y,
      p = t.z,
      d = Math.hypot(h, f, p) || 1;
    ((h /= d), (f /= d), (p /= d));
    let v, g, x;
    Math.abs(f) > 0.9
      ? ((v = 1), (g = 0), (x = 0))
      : ((v = -p), (g = 0), (x = h));
    let y = v * h + g * f + x * p;
    ((v -= h * y), (g -= f * y), (x -= p * y));
    let b = Math.hypot(v, g, x) || 1;
    ((v /= b), (g /= b), (x /= b));
    let m = f * x - p * g,
      A = p * v - h * x,
      _ = h * g - f * v,
      M =
        n === "bullet_wood"
          ? (Math.random() - 0.5) * 0.3
          : Math.random() * 6.283,
      E = Math.cos(M),
      w = Math.sin(M),
      S = (v * E + m * w) * c,
      z = (g * E + A * w) * c,
      H = (x * E + _ * w) * c,
      O = (m * E - v * w) * c,
      q = (A * E - g * w) * c,
      U = (_ * E - x * w) * c,
      T = 0.004 + (u % 7) * 3e-4,
      D = e.x + h * T,
      C = e.y + f * T,
      G = e.z + p * T,
      j = this.pos.array,
      N = this.nor.array,
      Q = this.uv.array,
      K = this.col.array,
      ie = u * 12;
    ((j[ie] = D - S - O),
      (j[ie + 1] = C - z - q),
      (j[ie + 2] = G - H - U),
      (j[ie + 3] = D + S - O),
      (j[ie + 4] = C + z - q),
      (j[ie + 5] = G + H - U),
      (j[ie + 6] = D + S + O),
      (j[ie + 7] = C + z + q),
      (j[ie + 8] = G + H + U),
      (j[ie + 9] = D - S + O),
      (j[ie + 10] = C - z + q),
      (j[ie + 11] = G - H + U));
    for (let F = 0; F < 4; F++)
      ((N[ie + F * 3] = h), (N[ie + F * 3 + 1] = f), (N[ie + F * 3 + 2] = p));
    ((ie = u * 8),
      (Q[ie] = l[0]),
      (Q[ie + 1] = l[1]),
      (Q[ie + 2] = l[2]),
      (Q[ie + 3] = l[1]),
      (Q[ie + 4] = l[2]),
      (Q[ie + 5] = l[3]),
      (Q[ie + 6] = l[0]),
      (Q[ie + 7] = l[3]),
      (ie = u * 16),
      (this.baseA[u] = r));
    for (let F = 0; F < 4; F++)
      ((K[ie + F * 4] = o),
        (K[ie + F * 4 + 1] = o),
        (K[ie + F * 4 + 2] = o),
        (K[ie + F * 4 + 3] = r));
    if (this.count >= this.cap)
      for (let F = 0; F < Yb; F++) {
        let X = (this.next + F) % this.cap,
          ne = (this.baseA[X] * (F + 1)) / (Yb + 1),
          re = X * 16;
        K[re + 3] = K[re + 7] = K[re + 11] = K[re + 15] = ne;
      }
    ((this.pos.needsUpdate =
      this.nor.needsUpdate =
      this.uv.needsUpdate =
      this.col.needsUpdate =
        !0),
      (this.mesh.visible = !0));
  }
};

export { $1, Z1, j1 };
