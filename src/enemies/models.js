import {
  Bone,
  Box3,
  BufferAttribute,
  ConeGeometry,
  Group,
  LatheGeometry,
  Matrix4,
  Quaternion,
  RingGeometry,
  Skeleton,
  SkinnedMesh,
  Sphere,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "../vendor/three-r180.js";
import {
  beveledBoxGeometry,
  cylinderGeometry,
  mergeGeometries,
  transformGeometry,
  tubeGeometry,
} from "../core/geometry.js";

var iu = class {
  constructor() {
    ((this.bones = []),
      (this.index = {}),
      (this.slots = {}),
      (this.order = []));
  }
  bone(e, t, n = 0, s = 0, o = 0) {
    let r = t ? this.bones[this.index[t]] : null;
    if (t && !r) throw new Error("rig: unknown parent bone " + t);
    let a = {
      name: e,
      parent: r ? r.i : -1,
      local: [n, s, o],
      world: [
        n + (r ? r.world[0] : 0),
        s + (r ? r.world[1] : 0),
        o + (r ? r.world[2] : 0),
      ],
      i: this.bones.length,
    };
    return ((this.index[e] = a.i), this.bones.push(a), a);
  }
  add(e, t, n, s = [1, 1, 1], o = !0) {
    let r = this.bones[this.index[t]];
    if (!r) throw new Error("rig: unknown bone " + t);
    let a = n;
    a.attributes.normal || a.computeVertexNormals();
    for (let p of Object.keys(a.attributes))
      p !== "position" && p !== "normal" && p !== "uv" && a.deleteAttribute(p);
    let l = a.attributes.position.count;
    (a.attributes.uv ||
      a.setAttribute("uv", new BufferAttribute(new Float32Array(l * 2), 2)),
      a.translate(r.world[0], r.world[1], r.world[2]));
    let c = new Float32Array(l * 3),
      u = new Uint16Array(l * 4),
      h = new Float32Array(l * 4),
      f = a.attributes.normal;
    for (let p = 0; p < l; p++) {
      let d = o ? 0.74 + 0.26 * (f.getY(p) * 0.5 + 0.5) : 1;
      ((c[p * 3] = s[0] * d),
        (c[p * 3 + 1] = s[1] * d),
        (c[p * 3 + 2] = s[2] * d),
        (u[p * 4] = r.i),
        (h[p * 4] = 1));
    }
    return (
      a.setAttribute("color", new BufferAttribute(c, 3)),
      a.setAttribute("skinIndex", new BufferAttribute(u, 4)),
      a.setAttribute("skinWeight", new BufferAttribute(h, 4)),
      this.slots[e] || ((this.slots[e] = []), this.order.push(e)),
      this.slots[e].push(a),
      this
    );
  }
  build(e) {
    let t = (e || this.order).filter(
        (o) => this.slots[o] && this.slots[o].length,
      ),
      n = t.map((o) => {
        let r = this.slots[o],
          l = r.some((u) => !u.index)
            ? r.map((u) => (u.index ? u.toNonIndexed() : u))
            : r,
          c = mergeGeometries(l, !1);
        return c.index ? c.toNonIndexed() : c;
      }),
      s = mergeGeometries(n, !0);
    return (
      s.computeBoundingSphere(),
      s.computeBoundingBox(),
      {
        geometry: s,
        slots: t,
        bones: this.bones,
        tris: s.attributes.position.count / 3,
      }
    );
  }
};

function pm(
  i,
  e,
  {
    castShadow: t = !0,
    receiveShadow: n = !0,
    radius: s = 1.5,
    center: o = [0, 0.5, 0],
    extra: r = null,
  } = {},
) {
  let a = i.bones.map((p) => {
    let d = new Bone();
    return (
      (d.name = p.name),
      d.position.set(p.local[0], p.local[1], p.local[2]),
      d
    );
  });
  i.bones.forEach((p, d) => {
    p.parent >= 0 && a[p.parent].add(a[d]);
  });
  let l = new Group(),
    c = new SkinnedMesh(
      i.geometry,
      i.slots.map((p) => e[p]),
    );
  ((c.castShadow = t),
    (c.receiveShadow = n),
    l.add(c),
    i.bones.forEach((p, d) => {
      p.parent < 0 && c.add(a[d]);
    }),
    l.updateMatrixWorld(!0));
  let u = new Skeleton(a);
  (c.bind(u),
    (c.boundingSphere = new Sphere(new Vector3(o[0], o[1], o[2]), s)),
    (c.boundingBox = new Box3(
      new Vector3(o[0] - s, o[1] - s, o[2] - s),
      new Vector3(o[0] + s, o[1] + s, o[2] + s),
    )));
  let h = {};
  a.forEach((p) => {
    h[p.name] = p;
  });
  let f = {
    group: l,
    mesh: c,
    bones: h,
    skeleton: u,
    extraMesh: null,
  };
  if (r) {
    let p = new SkinnedMesh(
      r.def.geometry,
      r.def.slots.map((d) => e[d]),
    );
    ((p.castShadow = !1),
      (p.receiveShadow = !1),
      (p.renderOrder = 5),
      l.add(p),
      p.updateMatrixWorld(!0),
      p.bind(u, c.bindMatrix),
      (p.boundingSphere = new Sphere(
        new Vector3(o[0], o[1], o[2]),
        r.radius || s,
      )),
      (p.boundingBox = new Box3().setFromCenterAndSize(
        p.boundingSphere.center,
        new Vector3(1, 1, 1).multiplyScalar(2 * (r.radius || s)),
      )),
      (f.extraMesh = p));
  }
  return f;
}

function q_(i, e, t, n, s, o, r, a) {
  let l = e * e + t * t,
    c = Math.sqrt(Math.max(l - o * o, 1e-6));
  ((i.abd = Math.atan2(t, e) - Math.atan2(-c, s * o)),
    i.abd > Math.PI
      ? (i.abd -= 2 * Math.PI)
      : i.abd < -Math.PI && (i.abd += 2 * Math.PI));
  let u = Math.hypot(c, n),
    h = (r + a) * 0.995,
    f = Math.abs(r - a) + 0.03;
  ((i.reach = u / (r + a)), u > h ? (u = h) : u < f && (u = f));
  let p = Math.atan2(n, c),
    d = (r * r + u * u - a * a) / (2 * r * u),
    v = (r * r + a * a - u * u) / (2 * r * a),
    g = Math.acos(d < -1 ? -1 : d > 1 ? 1 : d),
    x = Math.acos(v < -1 ? -1 : v > 1 ? 1 : v);
  return ((i.hip = g - p), (i.knee = -(Math.PI - x)), i);
}

var Ss = [1.15, 1.15, 1.15];

var vm = [0.95, 0.96, 0.97];

var Ts = [1, 0.34, 0.08];

var s0 = [0.1, 0.11, 0.12];

var ga = [0.035, 0.035, 0.038];

var Of = [1, 0.7, 0.07];

var As = [1, 1, 1];

var Yn = [2.4, 2.5, 2.6];

var an = [0.45, 0.46, 0.48];

var IC = [9, 9, 9.6];

var zC = [5.5, 4, 1.6];

var va = Math.PI / 2;

var ft = (i, e, t, n = 0.008) => beveledBoxGeometry(i, e, t, n);

var Ce = (i, e, t, n, s = 0, o = 0, r = 0, a = 1) =>
  transformGeometry(i, {
    p: [e, t, n],
    r: [s, o, r],
    s: a,
  });

var ds = (i, e, t, n = 12) => cylinderGeometry(i, e, t, n);

var Ro = (i, e, t, n = 12) =>
  transformGeometry(cylinderGeometry(i, e, t, n), {
    r: [0, 0, -va],
  });

var Si = (i, e, t, n = 12) =>
  transformGeometry(cylinderGeometry(i, e, t, n), {
    r: [va, 0, 0],
  });

var mm = new Vector3();

var gm = new Vector3();

var X_ = new Quaternion();

var DC = new Vector3(0, 1, 0);

var Y_ = new Matrix4();

var LC = new Vector3(1, 1, 1);

function su(i, e, t, n = t, s = 8) {
  (mm.set(i[0], i[1], i[2]), gm.set(e[0], e[1], e[2]));
  let o = mm.distanceTo(gm),
    r = cylinderGeometry(n, t, o, s);
  return (
    X_.setFromUnitVectors(DC, gm.clone().sub(mm).normalize()),
    Y_.compose(mm.clone().add(gm).multiplyScalar(0.5), X_, LC),
    r.applyMatrix4(Y_),
    r
  );
}

var Ur = (i, e = 14, t = 10, n = 1, s = 1, o = 1) => {
  let r = new SphereGeometry(i, e, t);
  return (r.scale(n, s, o), r);
};

var $_ = (i, e, t) => Ce(Ro(0.0075, 0.0075, 0.006, 6), i, e, t);

var Yv = (i, e, t) => Ce(ds(0.0075, 0.0075, 0.006, 6), i, e, t);

var kC = (i, e, t) => Ce(Si(0.0075, 0.0075, 0.006, 6), i, e, t);

var $v = {
  stand: 0.72,
  L1: 0.4,
  L2: 0.42,
  l0: 0.075,
  hipX: 0.165,
  hipY: -0.01,
  hipZ: 0.4,
  footX: 0.275,
  footZ: [0.37, 0.37, -0.42, -0.42],
  legs: ["FL", "FR", "RL", "RR"],
  side: [1, -1, 1, -1],
  fore: [1, 1, -1, -1],
  muzzle: [0, 0, 0.43],
  eye: [0, 0, 0.14],
  footR: 0.046,
};

function createWalkerModel() {
  let i = $v,
    e = new iu();
  (e.bone("root", null, 0, 0, 0),
    e.bone("body", "root", 0, i.stand, 0),
    e.bone("neck", "body", 0, 0.06, 0.49),
    e.bone("head", "neck", 0, 0.13, 0.12),
    e.bone("turret", "body", 0, 0.152, -0.03),
    e.bone("gun", "turret", 0, 0.095, 0.02),
    e.bone("antenna", "body", -0.105, 0.15, -0.46),
    e.bone("beacon", "body", 0.105, 0.2, -0.455));
  for (let n = 0; n < 4; n++) {
    let s = i.legs[n],
      o = i.side[n];
    (e.bone("abd" + s, "body", o * i.hipX, i.hipY, i.fore[n] * i.hipZ),
      e.bone("thigh" + s, "abd" + s, o * i.l0, 0, 0),
      e.bone("shin" + s, "thigh" + s, 0, -i.L1, 0));
  }
  let t = (n, s, o, r, a) => e.add(n, s, o, r, a);
  (t("metal", "body", Ce(ft(0.27, 0.2, 0.98, 0.02), 0, -0.01, 0), an),
    t("shell", "body", Ce(ft(0.35, 0.05, 0.3, 0.014), 0, 0.125, 0.33), Ss),
    t("shell", "body", Ce(ft(0.35, 0.05, 0.36, 0.014), 0, 0.125, -0.012), Ss),
    t(
      "shell",
      "body",
      Ce(ft(0.1, 0.052, 0.36, 0.01), 0, 0.126, -0.012 + 0),
      vm,
    ));
  for (let n of [-0.15, 0.15])
    for (let s of [0.21, 0.45, -0.17, 0.145])
      t("metal", "body", Yv(n, 0.152, s), Yn);
  t("metal", "body", Ce(ft(0.31, 0.03, 0.25, 0.006), 0, 0.112, -0.335), As);
  for (let n = 0; n < 10; n++)
    t(
      "metal",
      "body",
      Ce(ft(0.007, 0.062, 0.225, 0.002), -0.126 + n * 0.028, 0.155, -0.335),
      Yn,
    );
  (t("metal", "body", Ce(ft(0.3, 0.012, 0.02, 0.003), 0, 0.186, -0.24), an),
    t("metal", "body", Ce(ft(0.3, 0.012, 0.02, 0.003), 0, 0.186, -0.43), an));
  for (let n of [1, -1]) {
    (t(
      "shell",
      "body",
      Ce(ft(0.032, 0.15, 0.31, 0.012), n * 0.15, 0.022, -0.075),
      Ss,
    ),
      t(
        "shell",
        "body",
        Ce(ft(0.032, 0.15, 0.135, 0.012), n * 0.15, 0.022, 0.1625),
        vm,
      ),
      t(
        "metal",
        "body",
        tubeGeometry(
          [
            [n * 0.168, 0.06, 0.125],
            [n * 0.182, 0.06, 0.135],
            [n * 0.182, 0.06, 0.19],
            [n * 0.168, 0.06, 0.2],
          ],
          0.005,
          5,
        ),
        Yn,
      ),
      t(
        "shell",
        "body",
        Ce(ft(0.034, 0.016, 0.135, 0.004), n * 0.151, -0.035, 0.1625),
        Of,
      ),
      t(
        "shell",
        "body",
        Ce(ft(0.034, 0.042, 0.46, 0.008), n * 0.151, -0.078, 0),
        Ts,
      ),
      t(
        "shell",
        "body",
        Ce(ft(0.028, 0.1, 0.11, 0.008), n * 0.146, 0.01, 0.305),
        s0,
      ));
    for (let s = 0; s < 4; s++)
      t(
        "metal",
        "body",
        Ce(ft(0.004, 0.012, 0.085, 0.001), n * 0.161, -0.02 + s * 0.022, 0.305),
        an,
      );
    for (let s of [-0.035, 0.08])
      for (let o of [-0.21, 0.06, 0.115, 0.21])
        t("metal", "body", $_(n * 0.167, s, o), Yn);
    t(
      "metal",
      "body",
      tubeGeometry(
        [
          [n * 0.135, 0.148, -0.19],
          [n * 0.135, 0.205, -0.16],
          [n * 0.135, 0.212, 0],
          [n * 0.135, 0.205, 0.43],
          [n * 0.135, 0.148, 0.465],
        ],
        0.0105,
        6,
      ),
      Yn,
    );
    for (let s of [0, 0.26])
      t(
        "metal",
        "body",
        Ce(ds(0.008, 0.008, 0.06, 6), n * 0.135, 0.178, s),
        Yn,
      );
    (t(
      "shell",
      "body",
      tubeGeometry(
        [
          [n * 0.118, -0.105, -0.36],
          [n * 0.132, -0.118, -0.2],
          [n * 0.13, -0.112, 0.1],
          [n * 0.118, -0.1, 0.36],
        ],
        0.009,
        5,
      ),
      ga,
    ),
      t(
        "metal",
        "body",
        Ce(
          new TorusGeometry(0.02, 0.005, 5, 10),
          n * 0.17,
          0.085,
          -0.335,
          0,
          va,
          0,
        ),
        Yn,
      ));
  }
  (t("shell", "body", Ce(ft(0.3, 0.15, 0.075, 0.018), 0, -0.005, 0.505), Ts),
    t("shell", "body", Ce(ft(0.2, 0.07, 0.02, 0.006), 0, 0.012, 0.545), s0));
  for (let n = 0; n < 6; n++)
    t(
      "shell",
      "body",
      Ce(
        ft(0.05, 0.034, 0.014, 0.003),
        -0.125 + n * 0.05,
        -0.098,
        0.538,
        0,
        0,
        0,
      ),
      n % 2 ? s0 : Of,
    );
  for (let n of [-0.115, 0.115])
    (t("metal", "body", Ce(Si(0.021, 0.021, 0.014, 10), n, 0.012, 0.547), an),
      t(
        "glow",
        "body",
        Ce(Si(0.015, 0.015, 0.004, 10), n, 0.012, 0.556),
        [6.5, 4.6, 2.2],
        !1,
      ));
  (t("metal", "body", Ce(ft(0.24, 0.095, 0.56, 0.02), 0, -0.145, 0), As),
    t("shell", "body", Ce(ft(0.246, 0.03, 0.09, 0.006), 0, -0.14, 0.12), Ts),
    t("shell", "body", Ce(ft(0.246, 0.03, 0.09, 0.006), 0, -0.14, -0.12), Ts),
    t("shell", "body", Ce(ft(0.29, 0.15, 0.05, 0.014), 0, 0, -0.495), Ss),
    t("shell", "body", Ce(ft(0.17, 0.05, 0.012, 0.004), 0, 0.03, -0.523), s0),
    t(
      "glow",
      "body",
      Ce(ft(0.13, 0.012, 0.004, 0.001), 0, 0.03, -0.531),
      [5, 0.3, 0.1],
      !1,
    ),
    t(
      "metal",
      "body",
      Ce(Si(0.022, 0.022, 0.02, 10), 0.085, -0.035, -0.525),
      Yn,
    ),
    t(
      "metal",
      "body",
      Ce(
        new TorusGeometry(0.024, 0.006, 5, 10),
        -0.07,
        -0.05,
        -0.528,
        va,
        0,
        0,
      ),
      Yn,
    ));
  for (let n of [-0.125, 0.125])
    for (let s of [-0.055, 0.055]) t("metal", "body", kC(n, s, -0.523), Yn);
  (t(
    "shell",
    "body",
    tubeGeometry(
      [
        [0.09, 0.15, -0.2],
        [0.13, 0.2, -0.16],
        [0.12, 0.2, -0.08],
        [0.09, 0.165, -0.05],
      ],
      0.009,
      5,
    ),
    ga,
  ),
    t(
      "metal",
      "neck",
      su([0, -0.02, -0.02], [0, 0.11, 0.1], 0.045, 0.036, 10),
      an,
    ));
  for (let n = 0; n < 3; n++) {
    let s = 0.2 + n * 0.28;
    t(
      "shell",
      "neck",
      su(
        [0, -0.02 + 0.13 * s - 0.008, -0.02 + 0.12 * s - 0.0075],
        [0, -0.02 + 0.13 * s + 0.008, -0.02 + 0.12 * s + 0.0075],
        0.052,
        0.052,
        10,
      ),
      ga,
    );
  }
  (t("shell", "neck", Ce(ft(0.13, 0.05, 0.1, 0.012), 0, -0.01, -0.03), Ss),
    t(
      "shell",
      "neck",
      tubeGeometry(
        [
          [0.05, -0.02, -0.04],
          [0.07, 0.05, 0.02],
          [0.06, 0.11, 0.07],
          [0.045, 0.12, 0.1],
        ],
        0.007,
        5,
      ),
      ga,
    ),
    t("shell", "head", Ce(ft(0.19, 0.118, 0.25, 0.03), 0, 0, 0), Ss),
    t("shell", "head", Ce(ft(0.168, 0.074, 0.03, 0.012), 0, -0.004, 0.118), s0),
    t(
      "lens",
      "head",
      Ce(ft(0.128, 0.024, 0.006, 0.002), 0, 0.006, 0.1345),
      [1, 1, 1],
      !1,
    ));
  for (let n of [-0.056, 0.056])
    (t("metal", "head", Ce(Si(0.015, 0.015, 0.012, 10), n, -0.022, 0.132), an),
      t(
        "metal",
        "head",
        Ce(Si(0.009, 0.009, 0.004, 8), n, -0.022, 0.139),
        [0.1, 0.12, 0.2],
      ));
  (t("shell", "head", Ce(ft(0.062, 0.008, 0.2, 0.003), 0, 0.06, -0.005), Ts),
    t("metal", "head", Ce(Ro(0.032, 0.032, 0.214, 12), 0, 0, -0.055), an));
  for (let n of [1, -1])
    t(
      "shell",
      "head",
      Ce(Ro(0.022, 0.022, 0.006, 10), n * 0.108, 0, -0.055),
      Ts,
    );
  (t("metal", "head", Ce(ds(0.036, 0.036, 0.026, 14), 0, 0.072, -0.05), an),
    t(
      "metal",
      "head",
      Ce(ds(0.037, 0.037, 0.006, 14), 0, 0.074, -0.05),
      [0.2, 0.3, 0.5],
    ),
    t("metal", "head", Ce(ft(0.12, 0.03, 0.13, 0.008), 0, -0.068, 0.02), As));
  for (let n of [-0.08, 0.08])
    for (let s of [-0.09, 0.07]) t("metal", "head", Yv(n, 0.061, s), Yn);
  (t("metal", "turret", Ce(ds(0.105, 0.118, 0.034, 18), 0, 0, 0), an),
    t("metal", "turret", Ce(ft(0.18, 0.02, 0.16, 0.005), 0, 0.026, 0), As));
  for (let n of [1, -1])
    (t(
      "shell",
      "turret",
      Ce(ft(0.028, 0.115, 0.15, 0.012), n * 0.078, 0.085, 0.005),
      Ss,
    ),
      t(
        "metal",
        "turret",
        Ce(Ro(0.022, 0.022, 0.008, 10), n * 0.094, 0.095, 0.02),
        Yn,
      ));
  (t("shell", "gun", Ce(ft(0.108, 0.086, 0.21, 0.016), 0, 0, -0.012), Ss),
    t("shell", "gun", Ce(ft(0.11, 0.02, 0.212, 0.006), 0, -0.022, -0.012), Ts),
    t("metal", "gun", Ce(Si(0.035, 0.035, 0.11, 12), 0, 0, 0.145), an));
  for (let n = 0; n < 4; n++)
    t(
      "metal",
      "gun",
      Ce(Si(0.039, 0.039, 0.008, 12), 0, 0, 0.105 + n * 0.026),
      As,
    );
  (t("metal", "gun", Ce(Si(0.022, 0.024, 0.3, 12), 0, 0, 0.25), As),
    t("metal", "gun", Ce(Si(0.036, 0.036, 0.06, 10), 0, 0, 0.395), an),
    t(
      "metal",
      "gun",
      Ce(ft(0.08, 0.012, 0.025, 0.003), 0, 0, 0.395),
      [0.15, 0.15, 0.15],
    ),
    t(
      "metal",
      "gun",
      Ce(Ro(0.056, 0.056, 0.06, 14), 0.084, -0.004, -0.045),
      an,
    ),
    t("metal", "gun", Ce(Ro(0.02, 0.02, 0.066, 8), 0.084, -0.004, -0.045), zC),
    t("metal", "gun", Ce(ft(0.036, 0.036, 0.095, 0.008), -0.03, 0.06, 0), an),
    t(
      "glow",
      "gun",
      Ce(Si(0.011, 0.011, 0.003, 8), -0.03, 0.06, 0.049),
      [1.6, 0.12, 0.05],
      !1,
    ),
    t(
      "shell",
      "gun",
      tubeGeometry(
        [
          [0.05, -0.03, -0.11],
          [0.06, -0.07, -0.13],
          [0.04, -0.09, -0.1],
        ],
        0.008,
        5,
      ),
      ga,
    ),
    t(
      "metal",
      "body",
      Ce(ds(0.022, 0.026, 0.05, 10), 0.105, 0.175, -0.455),
      an,
    ),
    t(
      "glow",
      "beacon",
      Ce(Ur(0.02, 10, 6, 1, 1.25, 1), 0, 0.012, 0),
      [14, 5.5, 0.5],
      !1,
    ),
    t("metal", "antenna", Ce(ds(0.011, 0.014, 0.05, 8), 0, 0.025, 0), an),
    t("metal", "antenna", Ce(ds(0.0028, 0.005, 0.62, 5), 0, 0.36, 0), an),
    t("shell", "antenna", Ce(Ur(0.009, 6, 4), 0, 0.67, 0), Ts));
  for (let n = 0; n < 4; n++) {
    let s = i.legs[n],
      o = i.side[n],
      r = "abd" + s,
      a = "thigh" + s,
      l = "shin" + s;
    (t("metal", r, Ce(Si(0.06, 0.06, 0.17, 14), -o * 0.02, 0, 0), an),
      t("shell", r, Ce(ft(0.11, 0.05, 0.155, 0.014), o * 0, 0.058, 0), Ss),
      t("metal", r, Ce(Si(0.03, 0.03, 0.18, 8), -o * 0.02, 0, 0), Yn),
      t("shell", a, Ce(Ro(0.078, 0.078, 0.07, 18), 0, 0, 0), Ss),
      t("shell", a, Ce(Ro(0.081, 0.081, 0.016, 18), o * 0.012, 0, 0), Ts),
      t("metal", a, Ce(Ro(0.048, 0.048, 0.082, 12), 0, 0, 0), an));
    for (let c = 0; c < 5; c++) {
      let u = c * 1.2566;
      t(
        "metal",
        a,
        $_(o * 0.039, Math.cos(u) * 0.062, Math.sin(u) * 0.062),
        Yn,
      );
    }
    (t(
      "shell",
      a,
      Ce(ft(0.062, i.L1 - 0.07, 0.1, 0.022), 0, -i.L1 * 0.5 - 0.005, 0.004),
      Ss,
    ),
      t(
        "metal",
        a,
        Ce(ft(0.044, i.L1 - 0.04, 0.06, 0.012), 0, -i.L1 * 0.5, -0.035),
        an,
      ),
      t("shell", a, Ce(ft(0.065, 0.045, 0.103, 0.01), 0, -0.145, 0.004), Ts),
      t("shell", a, Ce(ft(0.064, 0.012, 0.102, 0.004), 0, -0.26, 0.004), s0),
      t(
        "metal",
        a,
        su([0, -0.06, -0.082], [0, -i.L1 * 0.62, -0.078], 0.021, 0.021, 10),
        Yn,
      ),
      t(
        "metal",
        a,
        su(
          [0, -i.L1 * 0.62, -0.078],
          [0, -i.L1 + 0.025, -0.058],
          0.009,
          0.009,
          6,
        ),
        IC,
      ),
      t("metal", a, Ce(ft(0.05, 0.03, 0.035, 0.006), 0, -0.055, -0.07), As),
      t(
        "shell",
        a,
        tubeGeometry(
          [
            [o * 0.036, -0.02, 0.05],
            [o * 0.044, -0.13, 0.062],
            [o * 0.042, -0.28, 0.058],
            [o * 0.034, -i.L1 + 0.03, 0.035],
          ],
          0.0065,
          5,
        ),
        ga,
      ),
      t("metal", a, Ce(Ro(0.05, 0.05, 0.086, 14), 0, -i.L1, 0), an),
      t("shell", a, Ce(Ro(0.036, 0.036, 0.092, 12), 0, -i.L1, 0), vm),
      t(
        "metal",
        l,
        Ce(ds(0.03, 0.021, i.L2 - 0.08, 10), 0, -(i.L2 - 0.08) / 2 - 0.01, 0),
        an,
      ),
      t("shell", l, Ce(ft(0.052, 0.21, 0.04, 0.014), 0, -0.14, 0.02), Ss),
      t("shell", l, Ce(ft(0.054, 0.02, 0.042, 0.006), 0, -0.215, 0.02), Ts),
      t("metal", l, Ce(ft(0.03, 0.06, 0.05, 0.008), 0, -0.02, -0.03), As),
      t("metal", l, Ce(ds(0.024, 0.03, 0.03, 10), 0, -i.L2 + 0.085, 0), Yn),
      t(
        "shell",
        l,
        Ce(
          Ur(i.footR + 0.002, 12, 8, 1, 0.86, 1.08),
          0,
          -i.L2 + i.footR * 0.86,
          0.004,
        ),
        ga,
      ));
  }
  return e.build(["shell", "metal", "glow", "lens"]);
}

var DRONE_MODEL = {
  rotors: [
    [0.33, 0.035, 0.3],
    [-0.33, 0.035, 0.3],
    [0.33, 0.035, -0.3],
    [-0.33, 0.035, -0.3],
  ],
  gimbal: [0, -0.095, 0.275],
  ball: [0, -0.072, 0],
  gun: [0, -0.085, -0.1],
  muzzle: [0, -0.032, 0.27],
  lamp: [0, -0.066, 0.025],
};

function FC() {
  let i = [
    [0.176, -0.036],
    [0.196, -0.032],
    [0.206, 0],
    [0.202, 0.03],
    [0.19, 0.04],
    [0.178, 0.032],
    [0.173, 0],
    [0.176, -0.036],
  ].map((e) => new Vector2(e[0], e[1]));
  return new LatheGeometry(i, 28);
}

function createDroneModel() {
  let i = DRONE_MODEL,
    e = new iu(),
    t = new iu(),
    n = (l, c, u, h, f) => {
      (e.bone(l, c, u, h, f), t.bone(l, c, u, h, f));
    };
  (n("root", null, 0, 0, 0), n("body", "root", 0, 0, 0));
  for (let l = 0; l < 4; l++)
    n("rotor" + l, "body", i.rotors[l][0], i.rotors[l][1], i.rotors[l][2]);
  (n("gimbalYaw", "body", i.gimbal[0], i.gimbal[1], i.gimbal[2]),
    n("ball", "gimbalYaw", i.ball[0], i.ball[1], i.ball[2]),
    n("lamp", "ball", i.lamp[0], i.lamp[1], i.lamp[2]),
    n("gun", "body", i.gun[0], i.gun[1], i.gun[2]),
    n("strobeG", "body", 0, 0, 0),
    n("strobeR", "body", 0, 0, 0),
    n("strobeW", "body", 0, 0, 0));
  let s = (l, c, u, h, f) => e.add(l, c, u, h, f);
  (s("shell", "body", Ce(Ur(1, 20, 12, 0.118, 0.074, 0.27), 0, 0.02, 0), Ss),
    s(
      "shell",
      "body",
      Ce(
        cylinderGeometry(1, 0.9, 1, 20),
        0,
        0.02,
        0.165,
        va,
        0,
        0,
        [0.094, 0.05, 0.06],
      ),
      Ts,
    ),
    s(
      "shell",
      "body",
      Ce(
        cylinderGeometry(1, 1, 1, 20),
        0,
        0.02,
        -0.02,
        va,
        0,
        0,
        [0.121, 0.012, 0.0765],
      ),
      s0,
    ),
    s("shell", "body", Ce(ft(0.118, 0.014, 0.2, 0.005), 0, 0.089, -0.03), vm),
    s("shell", "body", Ce(ft(0.03, 0.006, 0.2, 0.002), 0, 0.0975, -0.03), Ts));
  for (let l of [-0.05, 0.05])
    for (let c of [-0.12, 0.06]) s("metal", "body", Yv(l, 0.097, c), Yn);
  (s("metal", "body", Ce(ft(0.175, 0.06, 0.37, 0.016), 0, -0.035, -0.005), an),
    s("metal", "body", Ce(ft(0.12, 0.075, 0.11, 0.014), 0, 0.005, -0.265), As),
    s("shell", "body", Ce(ft(0.124, 0.02, 0.03, 0.005), 0, 0.03, -0.3), Ts),
    s(
      "glow",
      "body",
      Ce(ft(0.05, 0.006, 0.003, 0.001), 0, 0, -0.321),
      [0.3, 1.6, 0.4],
      !1,
    ));
  for (let l of [1, -1]) {
    for (let c = 0; c < 4; c++)
      s(
        "metal",
        "body",
        Ce(ft(0.004, 0.01, 0.06, 0.001), l * 0.0885, -0.045 + c * 0.016, -0.06),
        [0.2, 0.2, 0.2],
      );
    s(
      "metal",
      "body",
      tubeGeometry(
        [
          [l * 0.075, -0.055, 0.13],
          [l * 0.135, -0.175, 0.16],
          [l * 0.135, -0.192, 0.11],
          [l * 0.135, -0.192, -0.14],
          [l * 0.135, -0.175, -0.19],
          [l * 0.075, -0.055, -0.15],
        ],
        0.0085,
        6,
        !1,
        0.5,
      ),
      Yn,
    );
    for (let c of [0.07, -0.1])
      s(
        "shell",
        "body",
        Ce(Si(0.0135, 0.0135, 0.07, 8), l * 0.135, -0.192, c),
        ga,
      );
    (s(
      "metal",
      "body",
      su([l * 0.04, 0.07, -0.17], [l * 0.085, 0.37, -0.27], 0.004, 0.002, 5),
      an,
    ),
      s(
        "metal",
        "body",
        Ce(ds(0.008, 0.01, 0.025, 6), l * 0.04, 0.078, -0.17),
        Yn,
      ));
  }
  (s("metal", "body", Ce(ds(0.007, 0.007, 0.04, 6), 0, 0.105, 0.1), Yn),
    s("shell", "body", Ce(ds(0.034, 0.036, 0.018, 14), 0, 0.132, 0.1), Ss),
    s("metal", "body", Ce(ft(0.07, 0.03, 0.09, 0.008), 0, -0.075, 0.235), As));
  let o = FC();
  for (let l = 0; l < 4; l++) {
    let [c, u, h] = i.rotors[l],
      f = Math.sign(c),
      p = Math.sign(h);
    (s(
      "metal",
      "body",
      su([f * 0.07, 0, p * 0.09], [c, u - 0.05, h], 0.017, 0.015, 8),
      an,
    ),
      s(
        "shell",
        "body",
        Ce(
          ft(0.07, 0.045, 0.07, 0.014),
          f * 0.085,
          0,
          p * 0.1,
          0,
          f * p * 0.74,
          0,
        ),
        Ss,
      ),
      s(
        "shell",
        "body",
        tubeGeometry(
          [
            [f * 0.09, 0.02, p * 0.12],
            [f * 0.18, 0.012, p * 0.19],
            [c - f * 0.05, u - 0.03, h - p * 0.04],
          ],
          0.005,
          5,
        ),
        ga,
      ),
      s("metal", "body", Ce(ds(0.04, 0.03, 0.075, 12), c, u - 0.05, h), an),
      s("metal", "body", Ce(ds(0.042, 0.042, 0.012, 12), c, u - 0.02, h), Yn),
      s("shell", "body", Ce(o.clone(), c, u, h), Ss),
      s(
        "shell",
        "body",
        Ce(new TorusGeometry(0.196, 0.0085, 6, 28), c, u + 0.036, h, va, 0, 0),
        Ts,
      ));
    for (let v = 0; v < 3; v++) {
      let g = v * 2.094 + 0.5 + l;
      s(
        "metal",
        "body",
        Ce(
          ft(0.145, 0.007, 0.016, 0.002),
          c + Math.cos(g) * 0.105,
          u - 0.022,
          h - Math.sin(g) * 0.105,
          0,
          g,
          0,
        ),
        an,
      );
    }
    for (let v = -1; v <= 1; v++) {
      let g = Math.atan2(p, f) + v * 0.2;
      s(
        "shell",
        "body",
        Ce(
          ft(0.012, 0.05, 0.036, 0.003),
          c + Math.cos(g) * 0.205,
          u,
          h + Math.sin(g) * 0.205,
          0,
          -g,
          0,
        ),
        v === 0 ? s0 : Of,
      );
    }
    (s("metal", "rotor" + l, Ce(ds(0.017, 0.02, 0.03, 8), 0, -0.002, 0), Yn),
      s(
        "metal",
        "rotor" + l,
        Ce(ft(0.158, 0.0035, 0.03, 0.001), 0.088, 0.008, 0, 0.22, 0, 0),
        an,
      ),
      s(
        "metal",
        "rotor" + l,
        Ce(ft(0.158, 0.0035, 0.03, 0.001), -0.088, 0.008, 0, -0.22, 0, 0),
        an,
      ),
      s(
        "shell",
        "rotor" + l,
        Ce(ft(0.02, 0.004, 0.031, 0.001), 0.158, 0.008, 0, 0.22, 0, 0),
        Of,
      ),
      s(
        "shell",
        "rotor" + l,
        Ce(ft(0.02, 0.004, 0.031, 0.001), -0.158, 0.008, 0, -0.22, 0, 0),
        Of,
      ));
    let d = new RingGeometry(0.03, 0.168, 24, 1);
    (d.rotateX(-va),
      t.add("disc", "body", Ce(d, c, u + 0.008, h), [1, 1, 1], !1));
  }
  (s(
    "glow",
    "strobeR",
    Ce(Ur(0.012, 8, 6), 0.33 + 0.215, 0.035, 0.3),
    [10, 0.4, 0.2],
    !1,
  ),
    s(
      "glow",
      "strobeR",
      Ce(Ur(0.012, 8, 6), 0.33 + 0.215, 0.035, -0.3),
      [10, 0.4, 0.2],
      !1,
    ),
    s(
      "glow",
      "strobeG",
      Ce(Ur(0.012, 8, 6), -0.33 - 0.215, 0.035, 0.3),
      [0.3, 9, 1],
      !1,
    ),
    s(
      "glow",
      "strobeG",
      Ce(Ur(0.012, 8, 6), -0.33 - 0.215, 0.035, -0.3),
      [0.3, 9, 1],
      !1,
    ),
    s("glow", "strobeW", Ce(Ur(0.011, 8, 6), 0, 0.05, -0.325), [9, 9, 9], !1),
    s("metal", "gimbalYaw", Ce(ds(0.036, 0.036, 0.014, 12), 0, -0.004, 0), an),
    s(
      "metal",
      "gimbalYaw",
      Ce(ft(0.156, 0.01, 0.03, 0.003), 0, -0.014, 0),
      As,
    ));
  for (let l of [1, -1])
    s(
      "metal",
      "gimbalYaw",
      Ce(ft(0.009, 0.075, 0.03, 0.003), l * 0.0735, -0.05, 0),
      As,
    );
  (s("metal", "ball", Ce(Ur(0.06, 18, 12), 0, 0, 0), an),
    s("metal", "ball", Ce(Ro(0.013, 0.013, 0.142, 8), 0, 0, 0), Yn),
    s("metal", "ball", Ce(Si(0.031, 0.036, 0.03, 14), 0, 0.004, 0.048), As),
    s(
      "lens",
      "ball",
      Ce(Si(0.025, 0.025, 0.004, 14), 0, 0.004, 0.0645),
      [1, 1, 1],
      !1,
    ),
    s(
      "metal",
      "ball",
      Ce(Si(0.012, 0.012, 0.01, 8), 0.03, 0.036, 0.04),
      [0.1, 0.12, 0.2],
    ),
    s(
      "metal",
      "ball",
      Ce(Si(0.019, 0.023, 0.045, 10), i.lamp[0], i.lamp[1], i.lamp[2] - 0.022),
      an,
    ),
    s(
      "glow",
      "lamp",
      Ce(Si(0.016, 0.016, 0.003, 10), 0, 0, 0.001),
      [11, 9.8, 7.6],
      !1,
    ));
  {
    let u = new ConeGeometry(1.25, 9, 20, 6, !0);
    (u.translate(0, -9 / 2, 0),
      u.rotateX(-va),
      t.add("cone", "lamp", u, [1, 1, 1], !1));
  }
  (s("metal", "gun", Ce(ft(0.05, 0.03, 0.05, 0.006), 0, 0.012, 0), As),
    s("metal", "gun", Ce(Ro(0.012, 0.012, 0.07, 8), 0, -0.005, 0), Yn),
    s("metal", "gun", Ce(ft(0.052, 0.046, 0.13, 0.008), 0, -0.032, 0), As),
    s("shell", "gun", Ce(ft(0.054, 0.012, 0.05, 0.003), 0, -0.02, -0.03), Ts));
  for (let l of [-0.014, 0.014])
    (s("metal", "gun", Ce(Si(0.0085, 0.0085, 0.2, 8), l, -0.032, 0.16), an),
      s("metal", "gun", Ce(Si(0.012, 0.012, 0.03, 8), l, -0.032, 0.255), As));
  (s("metal", "gun", Ce(ft(0.045, 0.012, 0.012, 0.002), 0, -0.032, 0.2), Yn),
    s(
      "metal",
      "gun",
      Ce(ft(0.03, 0.05, 0.05, 0.006), 0.04, -0.035, -0.02),
      an,
    ));
  let r = e.build(["shell", "metal", "glow", "lens"]),
    a = t.build(["disc", "cone"]);
  return ((r.extra = a), r);
}

export { createWalkerModel, createDroneModel, pm, DRONE_MODEL, q_, $v };
