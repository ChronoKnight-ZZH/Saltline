import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "../../vendor/three-r180.js";
import {
  beveledBoxGeometry,
  boxGeometry,
  colorGeometry,
  cylinderGeometry,
  mergeGeometries,
  mergeGeometryParts,
} from "../../core/geometry.js";

var _t = (i, e, t) => new Vector3(i, e, t);

var al = (i) => (i.isVector3 ? i : new Vector3(i[0], i[1], i[2]));

var hb = new Vector3(0, 1, 0);

var gR = new Vector3(1, 1, 1);

var ub = new Quaternion();

var I1 = new Matrix4();

function t0(i, e, t) {
  let n =
    Math.imul(i, 374761393) ^
    Math.imul(e, 668265263) ^
    Math.imul(t, 1274126177);
  return (
    (n = Math.imul(n ^ (n >>> 13), 1274126177)),
    ((n ^ (n >>> 16)) >>> 0) / 4294967295
  );
}

function rl(i, e, t) {
  let n = Math.floor(i),
    s = Math.floor(e),
    o = Math.floor(t),
    r = i - n,
    a = e - s,
    l = t - o;
  ((r = r * r * (3 - 2 * r)),
    (a = a * a * (3 - 2 * a)),
    (l = l * l * (3 - 2 * l)));
  let c = (u, h, f) => u + (h - u) * f;
  return c(
    c(
      c(t0(n, s, o), t0(n + 1, s, o), r),
      c(t0(n, s + 1, o), t0(n + 1, s + 1, o), r),
      a,
    ),
    c(
      c(t0(n, s, o + 1), t0(n + 1, s, o + 1), r),
      c(t0(n, s + 1, o + 1), t0(n + 1, s + 1, o + 1), r),
      a,
    ),
    l,
  );
}

function uv(i) {
  let e = i >>> 0;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}

var P1 = [1, 1, 1];

var fb = [1, 1, 1];

function hv(i, e, t, n = fb, s = 1) {
  let o = rl(i * 0.31 + 11.3, e * 0.23 + 5.1, t * 0.31 + 3.7),
    r = rl(i * 1.7 + 40.2, 9.5, t * 1.7 + 17.9),
    a = 1 - s * (0.3 - 0.36 * o),
    l = n[0] * a,
    c = n[1] * a,
    u = n[2] * a;
  if (r > 0.68) {
    let h =
      Math.min(1, (r - 0.68) / 0.3) *
      0.6 *
      s *
      (0.35 + 0.65 * rl(i * 0.9, e * 0.45, t * 0.9));
    ((l *= 1 + 0.45 * h), (c *= 1 - 0.3 * h), (u *= 1 - 0.6 * h));
  }
  return ((P1[0] = l), (P1[1] = c), (P1[2] = u), P1);
}

var db = new WeakSet();

function so(i, e, t = {}) {
  let n = i.mats.get(e, {
    vertexColors: !0,
    ...t,
  });
  return (db.add(n), n);
}

var io = class {
  constructor() {
    ((this.b = new Map()),
      (this.tris = 0),
      (this.remap = null),
      (this.dz = 0),
      (this.minSize = 0));
  }
  add(e, t, n) {
    if (!t) return;
    if (Array.isArray(t)) {
      for (let o of t) this.add(e, o, n);
      return;
    }
    if (this.remap) {
      let o = this.remap(e, n);
      if (!o) return;
      if (this.minSize) {
        t.computeBoundingBox();
        let r = t.boundingBox;
        if (
          Math.max(r.max.x - r.min.x, r.max.y - r.min.y, r.max.z - r.min.z) <
          this.minSize
        )
          return;
      }
      ((e = o[0]), (n = o[1]), this.dz && t.translate(0, 0, this.dz));
    }
    db.has(e) &&
      !t.attributes.color &&
      colorGeometry(t, (o, r, a) => hv(o, r, a, n || fb));
    let s = this.b.get(e.uuid);
    (s ||
      ((s = {
        mat: e,
        geos: [],
      }),
      this.b.set(e.uuid, s)),
      s.geos.push(t),
      (this.tris +=
        (t.index ? t.index.count : t.attributes.position.count) / 3));
  }
  build({ cast: e = !0, recv: t = !0 } = {}) {
    let n = new Group();
    for (let s of this.b.values()) {
      let o = mergeGeometryParts(s.geos),
        r = new Mesh(o, s.mat),
        a = s.mat.isMeshBasicMaterial || s.mat.transparent;
      ((r.castShadow = e && !a), (r.receiveShadow = t && !a), n.add(r));
    }
    return (this.b.clear(), n);
  }
};

function Ee(i, e, t, n, s, o, r = 0) {
  let a = Math.abs(n - i),
    l = Math.abs(s - e),
    c = Math.abs(o - t),
    u = r > 0 ? beveledBoxGeometry(a, l, c, r) : boxGeometry(a, l, c);
  return (u.translate((i + n) / 2, (e + s) / 2, (t + o) / 2), u);
}

function xt(i, e, t, n, s, o, r, a = 12, l = !1) {
  let c = cylinderGeometry(i, e, t, a, l);
  return (
    n === "x" ? c.rotateZ(Math.PI / 2) : n === "z" && c.rotateX(Math.PI / 2),
    c.translate(s, o, r),
    c
  );
}

function Ke(i, e, t = 0.03, n = 5, s = !1) {
  ((i = al(i)), (e = al(e)));
  let o = new Vector3().subVectors(e, i),
    r = o.length();
  if (r < 1e-5) return null;
  let a = cylinderGeometry(t, t, r, n, !s);
  return (
    ub.setFromUnitVectors(hb, o.multiplyScalar(1 / r)),
    I1.compose(new Vector3().addVectors(i, e).multiplyScalar(0.5), ub, gR),
    a.applyMatrix4(I1),
    a
  );
}

function jt(i, e, t = 0.3, n = 0.3, s = 0) {
  ((i = al(i)), (e = al(e)));
  let o = new Vector3().subVectors(e, i),
    r = o.length();
  o.multiplyScalar(1 / r);
  let a = new Vector3().crossVectors(o, hb);
  a.lengthSq() < 1e-6 ? a.set(1, 0, 0) : a.normalize();
  let l = new Vector3().crossVectors(a, o),
    c = s > 0 ? beveledBoxGeometry(t, r, n, s) : boxGeometry(t, r, n);
  return (
    I1.makeBasis(a, o, l).setPosition(
      (i.x + e.x) / 2,
      (i.y + e.y) / 2,
      (i.z + e.z) / 2,
    ),
    c.applyMatrix4(I1),
    c
  );
}

function kr(i, e = 0.03, t = 5) {
  let n = [];
  for (let s = 0; s < i.length - 1; s++) {
    let o = Ke(i[s], i[s + 1], e, t);
    o && n.push(o);
  }
  return n;
}

function ua(i, e, t = 1, n = 10) {
  ((i = al(i)), (e = al(e)));
  let s = [];
  for (let o = 0; o <= n; o++) {
    let r = o / n,
      a = new Vector3().lerpVectors(i, e, r);
    ((a.y -= t * 4 * r * (1 - r)), s.push(a));
  }
  return s;
}

function ll(i, e, t, n, s, o = 0, r = 0) {
  let a = new PlaneGeometry(i, e);
  return (r && a.rotateX(r), o && a.rotateY(o), a.translate(t, n, s), a);
}

function ns(
  i,
  e,
  t,
  { h: n = 1.1, post: s = 2.2, r: o = 0.022, tint: r, mid: a = !0 } = {},
) {
  t = t.map(al);
  for (let l = 0; l < t.length - 1; l++) {
    let c = t[l],
      u = t[l + 1],
      h = c.distanceTo(u),
      f = Math.max(1, Math.round(h / s));
    for (let p = l === 0 ? 0 : 1; p <= f; p++) {
      let d = new Vector3().lerpVectors(c, u, p / f);
      i.add(e, Ke(d, _t(d.x, d.y + n, d.z), o, 4), r);
    }
    (i.add(e, Ke(_t(c.x, c.y + n, c.z), _t(u.x, u.y + n, u.z), o * 1.15, 5), r),
      a &&
        i.add(
          e,
          Ke(
            _t(c.x, c.y + n * 0.5, c.z),
            _t(u.x, u.y + n * 0.5, u.z),
            o * 0.9,
            4,
          ),
          r,
        ));
  }
}

function pb() {
  let i = {
      value: 0,
    },
    e = new MeshBasicMaterial({
      vertexColors: !0,
      fog: !1,
    });
  ((e.onBeforeCompile = (n) => {
    ((n.uniforms.uTime = i),
      (n.vertexShader =
        `attribute vec3 blink;
uniform float uTime;
varying float vBlink;
` +
        n.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
 float bph = fract(uTime / max(blink.x, 0.001) + blink.y);
 vBlink = blink.x <= 0.0 ? 1.0 : mix(0.02, 1.0, smoothstep(0.0, 0.06, bph) * (1.0 - smoothstep(blink.z, blink.z + 0.12, bph)));`,
        )),
      (n.fragmentShader =
        `varying float vBlink;
` +
        n.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
 diffuseColor.rgb *= vBlink;`,
        )));
  }),
    (e.customProgramCacheKey = () => "saltline-blink"));
  let t = [];
  return {
    uTime: i,
    mat: e,
    add(n, s, o = 0, r = 0, a = 0.5) {
      if (!n) return;
      let l = n.index ? n.toNonIndexed() : n,
        c = l.attributes.position.count,
        u = new Float32Array(c * 3),
        h = new Float32Array(c * 3);
      for (let p = 0; p < c; p++)
        ((u[p * 3] = s[0]),
          (u[p * 3 + 1] = s[1]),
          (u[p * 3 + 2] = s[2]),
          (h[p * 3] = o),
          (h[p * 3 + 1] = r),
          (h[p * 3 + 2] = a));
      let f = new BufferGeometry();
      (f.setAttribute("position", l.attributes.position),
        f.setAttribute("color", new BufferAttribute(u, 3)),
        f.setAttribute("blink", new BufferAttribute(h, 3)),
        t.push(f));
    },
    build() {
      if (!t.length) return null;
      let n = new Mesh(mergeGeometries(t.splice(0), !1), e);
      return ((n.castShadow = !1), (n.receiveShadow = !1), n);
    },
  };
}

var Bn = (i, e, t, n = 0.12) => {
  let s = new OctahedronGeometry(n, 0);
  return (s.translate(i, e, t), s);
};

export { _t, io, kr, ua, pb, rl, uv, so, Ee, xt, Ke, jt, ns, Bn, hv, ll };
