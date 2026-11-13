// Material cache, shader patches and procedural texture integration.
import {
  Color,
  DoubleSide,
  GLSL3,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  defineModuleExports,
} from "../../vendor/three-r180.js";
import { Qy, Tn, e3, t3 } from "./surface-shaders.js";
import { i3, l3, s3 } from "./textures.js";
import { bA, c3, dA, fA, gA, l1, mA, pA, vA, xA, yA } from "./catalog.js";
import { showcaseMaterials } from "./showcase.js";

var materialsShowcaseModule = {};

defineModuleExports(materialsShowcaseModule, {
  applyPatch: () => patchMaterialShader,
  create: () => createMaterials,
  showcase: () => showcaseMaterials,
});

function patchMaterialShader(i, e) {
  (Object.assign(i.uniforms, e),
    (i.vertexShader = i.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
` + dA,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
` + pA,
      )),
    (i.fragmentShader = i.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
` + mA,
      )
      .replace("#include <map_fragment>", gA)
      .replace("#include <roughnessmap_fragment>", vA)
      .replace("#include <metalnessmap_fragment>", xA)
      .replace("#include <normal_fragment_maps>", yA)
      .replace("#include <aomap_fragment>", bA)));
}

async function createMaterials(context) {
  let e = context.renderer || (context.render && context.render.renderer),
    t = context.params || {},
    n = +(t.tex || 0) || (context.quality && context.quality.tex) || 1024,
    s = Math.min(n, 1024),
    o = Math.min(
      8,
      e.capabilities.getMaxAnisotropy ? e.capabilities.getMaxAnisotropy() : 1,
    ),
    r = {
      wet: {
        value: t.wet !== void 0 ? +t.wet : 1,
      },
    },
    a = {
      sets: 0,
      bytes: 0,
      ms: 0,
    },
    l = new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    c = new Scene(),
    u = new Mesh(new PlaneGeometry(2, 2));
  ((u.frustumCulled = !1), c.add(u));
  let h = new Map(),
    f = new Map(),
    p = new Map(),
    d = 0,
    v = null,
    g = (O, q) =>
      new RawShaderMaterial({
        glslVersion: GLSL3,
        vertexShader: Qy,
        fragmentShader: O,
        uniforms: q,
        depthTest: !1,
        depthWrite: !1,
      });
  function x() {
    return (
      v ||
        (v = {
          normal: g(i3, {
            tH: {
              value: null,
            },
            uK: {
              value: new Vector2(),
            },
            uTexel: {
              value: 0,
            },
          }),
          copy: g(s3, {
            tA: {
              value: null,
            },
            uSq: {
              value: 0,
            },
          }),
        }),
      v
    );
  }
  function y(O, q) {
    ((u.material = q), e.setRenderTarget(O), e.render(c, l));
  }
  function b(O, q) {
    let U = new WebGLRenderTarget(O, O, {
      depthBuffer: !1,
      generateMipmaps: !0,
      minFilter: LinearMipmapLinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: RepeatWrapping,
      anisotropy: o,
      colorSpace: q ? SRGBColorSpace : NoColorSpace,
    });
    return ((a.bytes += O * O * 4 * 1.34), U);
  }
  function m(O) {
    let q = Math.round(s * O.size);
    return (O.hero && n >= 2048 && (q = 2048), Math.max(32, q));
  }
  function A(O) {
    let q = p.get(O);
    if (q) return q;
    let U = c3[O],
      T = performance.now(),
      D = m(U),
      C = Array.isArray(U.tile) ? U.tile : [U.tile, U.tile],
      G = h.get(D);
    G ||
      ((G = new WebGLRenderTarget(D, D, {
        count: 3,
        depthBuffer: !1,
        generateMipmaps: !1,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
      })),
      h.set(D, G));
    let j = f.get(U.fn);
    j ||
      ((j = g(e3 + Tn[U.fn] + t3, {
        uP: {
          value: new Vector4(),
        },
        uSeed: {
          value: 0,
        },
        uTexel: {
          value: 0,
        },
      })),
      f.set(U.fn, j));
    let N = U.p || [];
    (j.uniforms.uP.value.set(N[0] || 0, N[1] || 0, N[2] || 0, N[3] || 0),
      (j.uniforms.uSeed.value = U.seed || 0),
      (j.uniforms.uTexel.value = 1 / D));
    let Q = x(),
      K = e.getRenderTarget(),
      ie = e.autoClear,
      F = e.xr.enabled,
      X = e.shadowMap.autoUpdate;
    ((e.autoClear = !0),
      (e.xr.enabled = !1),
      (e.shadowMap.autoUpdate = !1),
      y(G, j));
    let ne = b(D, !0),
      re = b(D, !1),
      $ = b(D, !1);
    ((Q.copy.uniforms.tA.value = G.textures[0]),
      (Q.copy.uniforms.uSq.value = 1),
      y(ne, Q.copy),
      (Q.copy.uniforms.tA.value = G.textures[1]),
      (Q.copy.uniforms.uSq.value = 0),
      y(re, Q.copy),
      (Q.normal.uniforms.tH.value = G.textures[2]),
      (Q.normal.uniforms.uTexel.value = 1 / D),
      Q.normal.uniforms.uK.value.set(
        (U.bump * 0.001 * D) / C[0],
        (U.bump * 0.001 * D) / C[1],
      ),
      y($, Q.normal),
      e.setRenderTarget(K),
      (e.autoClear = ie),
      (e.xr.enabled = F),
      (e.shadowMap.autoUpdate = X));
    for (let ue of [ne, re, $])
      (ue.texture.repeat.set(1 / C[0], 1 / C[1]),
        (ue.texture.name = "sl_" + O));
    return (
      (q = {
        key: O,
        albedo: ne.texture,
        orm: re.texture,
        normal: $.texture,
        tile: C,
        size: D,
        targets: [ne, re, $],
      }),
      p.set(O, q),
      a.sets++,
      (a.ms += performance.now() - T),
      (d = performance.now()),
      q
    );
  }
  function _() {
    for (let O of h.values()) O.dispose();
    h.clear();
    for (let O of f.values()) O.dispose();
    f.clear();
  }
  let M = new Map(),
    E = new Set();
  function w(O, q = {}) {
    let U =
        O +
        "|" +
        (q.vertexColors ? "v" : "") +
        (q.triplanar ? "t" + (q.scale || 1) : "") +
        (q.doubleSide ? "d" : "") +
        (q.interior ? "i" : "") +
        (q.color !== void 0 ? "c" + q.color : ""),
      T = M.get(U);
    if (T) return T;
    let D = l1[O];
    D ||
      (E.has(O) ||
        (E.add(O),
        console.warn(`[mats] unknown material "${O}" \u2014 using fallback`)),
      (D = fA));
    let C;
    try {
      C = A(D.set);
    } catch (K) {
      return (
        E.has("gen:" + D.set) ||
          (E.add("gen:" + D.set),
          console.error(
            `[mats] texture set "${D.set}" failed: ${(K && K.message) || K}`,
          )),
        (T = new MeshStandardMaterial({
          color: q.color !== void 0 ? q.color : D.tint ? D.color : 8421504,
          roughness: 0.6,
          metalness: 0,
          vertexColors: !!q.vertexColors,
        })),
        (T.name = O),
        M.set(U, T),
        T
      );
    }
    let G = !!q.triplanar,
      j = !D.transparent && !D.alphaCut;
    ((T = new MeshStandardMaterial({
      map: C.albedo,
      normalMap: C.normal,
      roughnessMap: C.orm,
      metalnessMap: C.orm,
      aoMap: C.orm,
      color: q.color !== void 0 ? q.color : D.color,
      roughness: D.rough,
      metalness: D.metal,
      vertexColors: !!q.vertexColors,
    })),
      T.normalScale.set(D.nrm, D.nrm),
      (T.name = O),
      (q.doubleSide || D.side === 2) && (T.side = DoubleSide),
      D.transparent &&
        ((T.transparent = !0), (T.depthWrite = !1), (T.envMapIntensity = 1.4)),
      D.alphaCut && (T.alphaTest = 0.5),
      (T.defines = {
        ...T.defines,
        SL_TINT: D.tint,
      }),
      G && (T.defines.SL_TRIPLANAR = ""),
      j && (T.defines.SL_FX = ""),
      D.alphaCut && !G && (T.defines.SL_ACUT = ""));
    let N = {
      uSlWet: r.wet,
      uSlWetP: {
        value: new Vector4(...D.wet),
      },
      uSlMacro: {
        value: new Vector4(...D.macro),
      },
      uSlUv: {
        value: new Vector3(1, 1, G ? (q.scale || 1) / C.tile[0] : C.size),
      },
      uSlX: {
        value: new Vector2(q.interior ? 0.12 : 1, 0),
      },
    };
    ((T.userData.sl = N),
      (T.userData.set = C.key),
      (T.userData.tile = C.tile),
      q.interior && (T.userData.interior = !0),
      (T.onBeforeCompile = (K) => patchMaterialShader(K, N)));
    let Q =
      "sl2|" +
      D.tint +
      (G ? "t" : "") +
      (j ? "f" : "") +
      (D.alphaCut ? "a" : "");
    return ((T.customProgramCacheKey = () => Q), M.set(U, T), T);
  }
  function S(O = 16777215, q = 4) {
    let U = "em|" + O + "|" + q;
    if (M.has(U)) return M.get(U);
    let T = new MeshBasicMaterial({
      color: new Color(O).multiplyScalar(q),
      toneMapped: !0,
    });
    return ((T.name = "emissive"), M.set(U, T), T);
  }
  let z = l3(context, o);
  return {
    get: w,
    emissive: S,
    decal: z.decal,
    label: z.label,
    number: z.number,
    names: Object.keys(l1),
    decalNames: z.names,
    uniforms: r,
    update(O) {
      h.size && performance.now() - d > 4e3 && _();
    },
    prewarm(O) {
      for (let q of O || Object.keys(l1)) w(q);
    },
    stats() {
      return {
        sets: a.sets,
        textureMB: +(a.bytes / 1048576).toFixed(1),
        genMs: +a.ms.toFixed(0),
        decalMB: +(z.bytes() / 1048576).toFixed(1),
      };
    },
    tileOf(O) {
      let q = l1[O];
      return q ? c3[q.set].tile : 1;
    },
  };
}

export { createMaterials, materialsShowcaseModule, patchMaterialShader };
