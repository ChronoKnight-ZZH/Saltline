import {
  BoxGeometry,
  CylinderGeometry,
  DataTexture,
  Group,
  MathUtils,
  Mesh,
  defineModuleExports,
} from "../../vendor/three-r180.js";
import { WORLD_BOUNDS } from "../../core/config.js";
import { Cb, Li, N1, Pb, Rb, U1 } from "./geometry.js";
import { Ib, zb } from "./asphalt.js";
import { Lb, Nb, kb } from "./water.js";

var groundShowcaseModule = {};

defineModuleExports(groundShowcaseModule, {
  create: () => createGround,
  showcase: () => showcaseGround,
});

async function createGround(context) {
  let e = (context.quality.tex || 512) >= 1024,
    t = Math.min(
      8,
      context.renderer.capabilities.getMaxAnisotropy
        ? context.renderer.capabilities.getMaxAnisotropy()
        : 1,
    ),
    n = e ? 1024 : 512,
    s = Rb(n),
    o = N1(s, n, {
      repeat: !1,
      aniso: 2,
    }),
    r = e ? 512 : 256,
    { det: a, nrm: l } = Cb(r),
    c = N1(a, r, {
      aniso: t,
    }),
    u = N1(l, r, {
      aniso: t,
    });
  try {
    document.fonts &&
      document.fonts.load &&
      (await Promise.race([
        document.fonts.load('900 40px "Big Shoulders Display"'),
        new Promise((M) => setTimeout(M, 350)),
      ]));
  } catch {}
  let h = Pb(e ? 2048 : 1024, t),
    f = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  f.needsUpdate = !0;
  let p = {
      mask: o,
      detail: c,
      detailN: u,
      marks: h,
      black: f,
    },
    d = new Group();
  d.name = "ground";
  let v = Ib(context, p),
    g = kb(context, p),
    x = Nb(context, p);
  (d.add(v.mesh, g.mesh, g.skirt, x.rain, x.splash), context.scene.add(d));
  let y = zb(context, v.uniforms, [v.mesh, g.mesh, x.rain, x.splash]);
  context.render &&
    context.render.addPrePass &&
    context.render.addPrePass(y.pass);
  let b = (M, E) => {
      let w = context.level && context.level.interiorBoxes;
      if (!w) return !1;
      for (let S = 0; S < w.length; S++) {
        let z = w[S];
        if (
          z &&
          z.min &&
          M > z.min.x &&
          M < z.max.x &&
          E > z.min.z &&
          E < z.max.z
        )
          return !0;
      }
      return !1;
    },
    m = (M, E) =>
      M > Li.x0 && M < Li.x0 + Li.size && E > Li.z0 && E < Li.z0 + Li.size,
    A = 0,
    _ = {
      root: d,
      apron: v.mesh,
      sea: g.mesh,
      rain: x.rain,
      planar: y,
      reflectionTarget: y.target,
      reflectionCamera: y.camera,
      maskTexture: o,
      uniforms: v.uniforms,
      puddleDepth(M, E) {
        return M > WORLD_BOUNDS.quayX || !m(M, E) || b(M, E)
          ? -0.2
          : 0.5 - U1(s, n, M, E, 0);
      },
      isPuddle(M, E) {
        return _.puddleDepth(M, E) > 0.015;
      },
      wetnessAt(M, E) {
        if (M > WORLD_BOUNDS.quayX) return 1;
        if (b(M, E)) return 0.12;
        if (!m(M, E)) return 0.6;
        let w = 0.5 - U1(s, n, M, E, 0);
        if (w > 0.015) return 1;
        let S = MathUtils.smoothstep,
          z = S(w, -0.11, 0),
          H = S(w, -0.65, -0.02),
          O = 1 - S(U1(s, n, M, E, 1) + H * 0.55, 0.2, 0.42);
        return Math.min(0.95, 0.25 + (1 - O) * 0.4 + z * 0.3);
      },
      seaHeight(M, E) {
        return Lb(M, E, A);
      },
      setRain(M) {
        x.setRain(M);
      },
      get rainLevel() {
        return x.rainLevel;
      },
      setReflections(M) {
        y.enabled = !!M;
      },
      update(M) {
        ((A += M),
          x.update(M),
          (v.uniforms.uTime.value = A),
          (v.uniforms.uRain.value = x.rainLevel),
          (g.uniforms.uTime.value = A));
      },
    };
  return _;
}

async function showcaseGround(context) {
  let e = context.scene.children.find(
    (o) =>
      o.isMesh &&
      o.geometry &&
      o.geometry.type === "PlaneGeometry" &&
      o.geometry.parameters &&
      o.geometry.parameters.width === 80,
  );
  (e && context.scene.remove(e),
    (context.ground = await createGround(context)));
  let t = new Group(),
    n = (o, r, a, l, c, u = 0) => {
      let h = new Mesh(o, r);
      return (
        h.position.set(a, l, c),
        (h.rotation.y = u),
        (h.castShadow = h.receiveShadow = !0),
        t.add(h),
        h
      );
    },
    s = (o) => context.mats.get(o);
  return (
    n(new BoxGeometry(6.06, 2.59, 2.44), s("paint_red"), 3, 1.295, -0.2),
    n(new BoxGeometry(6.06, 2.59, 2.44), s("paint_blue"), 9.4, 1.295, -0.2),
    n(new BoxGeometry(6.06, 2.59, 2.44), s("paint_teal"), 9.4, 3.885, -0.2),
    n(new BoxGeometry(12.19, 2.59, 2.44), s("paint_yellow"), 3, 1.295, 11.2),
    n(new BoxGeometry(6.06, 2.59, 2.44), s("paint_white"), 12.4, 1.295, 11.2),
    n(new BoxGeometry(1.1, 1.1, 1.1), s("paint_orange"), 5.6, 0.55, 4.7, 0.4),
    n(
      new CylinderGeometry(0.29, 0.29, 0.88, 20),
      s("plastic_blue"),
      3.9,
      0.44,
      6.3,
    ),
    n(
      new CylinderGeometry(0.29, 0.29, 0.88, 20),
      s("steel_rust"),
      4.6,
      0.44,
      6.6,
    ),
    n(new CylinderGeometry(0.06, 0.06, 5, 10), s("steel_galv"), 12.5, 2.5, 6.2),
    n(
      new BoxGeometry(0.08, 1.6, 0.08),
      context.mats.emissive(16726556, 6),
      6.6,
      0.82,
      2.6,
    ),
    n(
      new BoxGeometry(0.08, 1.6, 0.08),
      context.mats.emissive(3524863, 5),
      2.2,
      0.82,
      3.2,
    ),
    n(
      new BoxGeometry(2.4, 0.08, 0.06),
      context.mats.emissive(16773328, 6),
      9.4,
      2.2,
      1.06,
    ),
    n(
      new BoxGeometry(0.3, 0.12, 0.3),
      context.mats.emissive(16760944, 12),
      12.5,
      5,
      6.2,
    ),
    n(
      new BoxGeometry(0.06, 1.2, 0.06),
      context.mats.emissive(5832570, 5),
      23,
      0.62,
      8.2,
    ),
    n(new BoxGeometry(1.2, 1.2, 1.2), s("steel_dark"), 22.4, 0.6, 9.6, 0.3),
    context.scene.add(t),
    {
      cam: [-9, 1.65, 5.6],
      target: [14, 0.4, 5],
    }
  );
}

export { createGround, groundShowcaseModule, showcaseGround };
