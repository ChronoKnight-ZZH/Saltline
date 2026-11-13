// Scene, cameras, renderer lifecycle and render passes.
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CubeCamera,
  DepthTexture,
  DirectionalLight,
  FogExp2, 
  Group,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  RGBAFormat,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  UnsignedIntType,
  Vector2,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderTarget,
  WebGLRenderer,
  defineModuleExports,
} from "../vendor/three-r180.js";
import {
  PLAYER_DIMENSIONS,
  QUALITY_PRESETS,
  SUN_LIGHT,
  vf,
  zc,
} from "../core/config.js";
import {
  beveledBoxGeometry,
  boxGeometry,
  createMesh,
} from "../core/geometry.js";
import { Hy, Vy, applySkyPreset, createNoiseTexture } from "./sky.js";
import { Gy, Xy, Yy, installSoftShadows } from "./shadows.js";
import {
  POSTPROCESS_SHADER_MARKER,
  createPostprocessing,
} from "./postprocessing.js";

var rendererShowcaseModule = {};

defineModuleExports(rendererShowcaseModule, {
  create: () => createRenderer,
  showcase: () => showcaseRenderer,
});

var Jy = 2;

var Ky = 1;

async function createRenderer(context) {
  let e = context.params || {},
    t = document.getElementById("view"),
    n = new WebGLRenderer({
      canvas: t,
      antialias: !1,
      powerPreference: "high-performance",
      alpha: !1,
      depth: !0,
      stencil: !1,
    });
  ((n.outputColorSpace = SRGBColorSpace),
    (n.toneMapping = NoToneMapping),
    (n.toneMappingExposure = 1),
    (n.shadowMap.enabled = !0),
    (n.shadowMap.type = PCFShadowMap),
    (n.shadowMap.autoUpdate = !1),
    (n.autoClear = !1),
    (n.info.autoReset = !1),
    n.setClearColor(0, 1));
  let s = n.getContext(),
    o = {
      post: !1,
      shadow: !1,
      sky: !1,
      other: 0,
    };
  n.debug.onShaderError = (ie, F, X, ne) => {
    let re = "",
      $ = "";
    try {
      ((re = ie.getShaderSource(ne) || ""),
        ($ =
          (ie.getShaderInfoLog(ne) || "") +
          " " +
          (ie.getShaderInfoLog(X) || "") +
          " " +
          (ie.getProgramInfoLog(F) || "")));
    } catch {}
    let ue = "material";
    (re.includes(POSTPROCESS_SHADER_MARKER)
      ? ((o.post = !0),
        (ue = "post pass " + (re.match(/SALTLINE_POST (\S+)/) || [])[1]))
      : re.includes("SALTLINE_SKY")
        ? ((o.sky = !0), (ue = "sky"))
        : re.includes(Yy)
          ? ((o.shadow = !0), (ue = "material (soft shadow chunk active)"))
          : o.other++,
      console.error(
        `[render] shader error in ${ue}: ${$.trim().slice(0, 700)}`,
      ));
  };
  let r = new Scene(),
    a = new PerspectiveCamera(PLAYER_DIMENSIONS.fov, 16 / 9, 0.08, 900);
  (a.layers.set(vf), (a.rotation.order = "YXZ"), r.add(a));
  let l = new PerspectiveCamera(PLAYER_DIMENSIONS.viewFov, 16 / 9, 0.01, 10);
  l.layers.set(zc);
  let c = createNoiseTexture(),
    u = Hy(c);
  r.add(u.mesh);
  let h = new DirectionalLight(SUN_LIGHT.color, SUN_LIGHT.intensity);
  ((h.name = "sun"), (h.castShadow = !0));
  let f = Gy(
      h,
      new Vector3(-41, -0.2, -33),
      new Vector3(37, 32, 31),
      new Vector3(-41, -3, -64),
      new Vector3(72, 36, 34),
    ),
    p = () =>
      Math.min(context.quality.shadow || 2048, n.capabilities.maxTextureSize);
  (h.shadow.mapSize.set(p(), p()),
    (h.shadow.bias = -12e-5),
    (h.shadow.normalBias = 0.02),
    (h.shadow.radius = 1),
    (h.shadow.autoUpdate = !0),
    r.add(h, h.target));
  let d = !1;
  try {
    d = installSoftShadows(f, {
      taps: context.quality.name === "low" ? 10 : 16,
      searchTaps: 8,
    });
  } catch (ie) {
    console.warn("[render] soft shadows unavailable: " + ie);
  }
  let v = 6,
    g = [];
  for (let ie = 0; ie < v; ie++) {
    let F = new PointLight(16777215, 0, 12, 2);
    ((F.userData = {
      busy: !1,
      ttl: 0,
      dur: 0,
      peak: 0,
      persistent: !1,
    }),
      r.add(F),
      g.push(F));
  }
  let x = {
      flash(ie, F = 16763008, X = 30, ne = 10, re = 0.06) {
        let $ =
          g.find((ue) => !ue.userData.busy) ||
          g
            .filter((ue) => !ue.userData.persistent)
            .sort((ue, me) => ue.userData.ttl - me.userData.ttl)[0];
        $ &&
          ($.position.copy(ie),
          $.color.set(F),
          ($.distance = ne),
          ($.intensity = X),
          Object.assign($.userData, {
            busy: !0,
            ttl: re,
            dur: re,
            peak: X,
            persistent: !1,
          }));
      },
      acquire() {
        let ie = g.find((F) => !F.userData.busy);
        return ie
          ? ((ie.userData.busy = !0),
            (ie.userData.persistent = !0),
            (ie.intensity = 0),
            {
              light: ie,
              release() {
                ((ie.userData.busy = !1),
                  (ie.userData.persistent = !1),
                  (ie.intensity = 0));
              },
            })
          : null;
      },
      update(ie) {
        for (let F of g) {
          let X = F.userData;
          X.busy &&
            !X.persistent &&
            ((X.ttl -= ie),
            X.ttl <= 0
              ? ((X.busy = !1), (F.intensity = 0))
              : (F.intensity = X.peak * (X.ttl / X.dur)));
        }
      },
    },
    y = null;
  try {
    ((y = Vy(n, u)),
      (r.environment = y.texture),
      (r.environmentIntensity = Jy));
  } catch (ie) {
    console.error(
      "[render] environment capture failed: " + ((ie && ie.stack) || ie),
    );
  }
  let b = new DepthTexture(4, 4);
  ((b.type = UnsignedIntType), (b.minFilter = b.magFilter = NearestFilter));
  let m = new WebGLRenderTarget(4, 4, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: !0,
      stencilBuffer: !1,
      depthTexture: b,
      samples: context.quality.msaa | 0,
      generateMipmaps: !1,
    }),
    A = null,
    _ = e.post !== "0";
  if (
    (e.ao === "0" && (context.quality.ao = !1),
    e.vol === "0" && (context.quality.volSteps = 0),
    e.bloom === "0" && (context.quality.bloom = !1),
    e.mb === "1" && (context.quality.motionBlur = !0),
    _)
  )
    try {
      A = createPostprocessing(n, context, {
        noiseTex: c,
      });
    } catch (ie) {
      ((_ = !1),
        console.error(
          "[render] post chain failed to initialise, using forward fallback: " +
            ((ie && ie.stack) || ie),
        ));
    }
  let M = !!(e.shot || e.show),
    E = !1,
    w = {
      t: 99,
      power: 0,
      value: 0,
    };
  context.events &&
    context.events.on &&
    context.events.on("thunder", (ie) => {
      ((w.t = 0), (w.power = Math.min(1, (ie && ie.intensity) || 0.6)));
      let F = Math.PI * (0.55 + Math.random() * 0.9);
      u.material.uniforms.uFlashDir.value
        .set(
          Math.cos(F),
          0.35 + Math.random() * 0.3,
          Math.sin(F) * (Math.random() < 0.5 ? -1 : 1),
        )
        .normalize();
    });
  let S = {
    scale: 1,
    enabled: !(e.shot || e.show || e.dynres === "0"),
    acc: 0,
    n: 0,
    settle: 3.5,
    upWait: 4,
    upDelay: 4,
  };
  function z(ie) {
    if (!S.enabled || !_ || ie > 1500) return;
    if (((S.settle -= ie / 1e3), (S.upWait -= ie / 1e3), S.settle > 0)) {
      ((S.acc = 0), (S.n = 0));
      return;
    }
    if (((S.acc += ie), S.n++, S.n < 45 && S.acc < 900)) return;
    let F = S.acc / S.n;
    ((S.acc = 0), (S.n = 0));
    let X = S.scale;
    if (
      (F > 21.5 && X > 0.6
        ? ((X = F > 45 ? 0.6 : Math.max(0.6, X - (F > 30 ? 0.2 : 0.1))),
          (S.upDelay = Math.min(60, S.upDelay * 2)),
          (S.upWait = S.upDelay))
        : F < 17.4 && X < 1 && S.upWait <= 0
          ? ((X = Math.min(1, X + 0.1)), (S.upWait = 2))
          : F < 17.4 && X >= 1 && (S.upDelay = 4),
      (X = Math.round(X * 10) / 10),
      X <= 0.6 && F > 26)
    ) {
      S.floorHits = (S.floorHits || 0) + 1;
      let ne = {
        ultra: "high",
        high: "medium",
        medium: "low",
      }[context.quality.name];
      if (S.floorHits >= 2 && ne && QUALITY_PRESETS[ne]) {
        ((S.floorHits = 0),
          (S.scale = 0.8),
          (S.settle = 2),
          (S.upDelay = 4),
          console.log(
            "[render] frame time " +
              F.toFixed(0) +
              " ms at minimum scale: dropping quality to " +
              ne,
          ));
        try {
          (N.setQuality({
            ...QUALITY_PRESETS[ne],
          }),
            context.events.emit("quality:auto", {
              name: ne,
            }));
        } catch {}
        return;
      }
    } else S.floorHits = 0;
    X !== S.scale && ((S.scale = X), (S.settle = 1), N.resize());
  }
  let H = [],
    O = {},
    q = (ie, F) => {
      O[ie] || ((O[ie] = 1), console.error(F));
    },
    U = {
      calls: 0,
      tris: 0,
    },
    T = 0,
    D = 0;
  function C() {
    (a.updateMatrixWorld(!0),
      (l.matrixAutoUpdate = !1),
      (l.matrixWorldAutoUpdate = !1),
      l.matrixWorld.copy(a.matrixWorld),
      l.matrixWorldInverse.copy(l.matrixWorld).invert());
  }
  function G() {
    (n.toneMapping !== ACESFilmicToneMapping &&
      (n.toneMapping = ACESFilmicToneMapping),
      (n.toneMappingExposure =
        0.6 * N.exposure * (1 - Math.min(1, Math.max(0, N.post.fade)))),
      n.setRenderTarget(null),
      n.clear(),
      (n.shadowMap.needsUpdate = !0),
      n.render(r, a),
      n.clearDepth(),
      n.render(r, l));
  }
  function j(ie) {
    (n.toneMapping !== NoToneMapping && (n.toneMapping = NoToneMapping),
      (n.toneMappingExposure = 1),
      n.setRenderTarget(m),
      n.clear(!0, !0, !1),
      (context.quality.name === "ultra" ||
        e.shot ||
        (T & 1) === 0 ||
        !h.shadow.map) &&
        (n.shadowMap.needsUpdate = !0),
      n.render(r, a),
      E && (A.copyDepth(b), n.setRenderTarget(m)),
      s.depthRange(0, 0.05));
    let F = r.environmentIntensity,
      X = r.environment,
      ne =
        N.interiorEnv &&
        context.level &&
        context.level.interiorBoxes &&
        context.level.interiorBoxes[0],
      re = !!(
        ne &&
        ne.min &&
        a.position.x > ne.min.x &&
        a.position.x < ne.max.x &&
        a.position.z > ne.min.z &&
        a.position.z < ne.max.z &&
        a.position.y < ne.max.y
      );
    (re && (r.environment = N.interiorEnv),
      (r.environmentIntensity = F * (re ? Ky / Jy : 1) * (N.viewFill || 1.35)));
    try {
      n.render(r, l);
    } finally {
      (s.depthRange(0, 1), (r.environmentIntensity = F), (r.environment = X));
    }
    if (
      (A.run({
        hdr: m,
        camera: a,
        sun: h,
        dt: ie,
        post: N.post,
        exposure: N.exposure,
        time: context.time ? context.time.t : T / 60,
        fast: M,
        thunder: w.value,
      }),
      n.setRenderTarget(null),
      o.post)
    )
      throw new Error("a post shader failed to compile");
  }
  let N = {
      renderer: n,
      scene: r,
      camera: a,
      viewCamera: l,
      sun: h,
      sky: u.mesh,
      sunDir: SUN_LIGHT.dir.clone(),
      // ---- environment 接口（M1） ----
      setSun(preset) {
        if (!preset) return;
        if (preset.sunDir) {
          N.sunDir.copy(preset.sunDir);
          if (N.sunDir.lengthSq() > 0) N.sunDir.normalize();
        }
        if (preset.sunColor) h.color.copy(preset.sunColor);
        if (typeof preset.sunIntensity === "number") {
          h.intensity = preset.sunIntensity;
        }
        // M1 不移动 h.position、不重拟合阴影；阴影方向保持启动时状态，
        // M3/M6 再接 shadows.refit()。
        applySkyPreset(u.mesh, {
          skyTop: preset.skyTop,
          skyHorizon: preset.skyHorizon,
          sunColor: preset.sunColor,
          sunDir: preset.sunDir ? N.sunDir : undefined,
        });
      },
      setSkyColors(skyTop, skyHorizon) {
        applySkyPreset(u.mesh, { skyTop, skyHorizon });
      },
      setFog(color, density) {
        if (!r.fog) {
          r.fog = new FogExp2(color, density);
        } else {
          r.fog.color.copy(color);
          r.fog.density = density;
        }
      },
      setExposure(v) {
        N.exposure = v;
      },
      rebakeEnvironment() {
        if (!context.quality || context.quality.envBake === false) return;
        try {
          let rt = Vy(n, u);
          N.env = rt.texture;
          r.environment = rt.texture;
          r.environmentIntensity = Jy;
        } catch (ie) {
          console.error(
            "[render] rebakeEnvironment failed: " + ((ie && ie.stack) || ie),
          );
        }
      },
      // ---- environment 接口结束 ----
      lightPool: x,
      post: {
        damage: 0,
        lowHealth: 0,
        ads: 0,
        flash: 0,
        fade: 0,
        saturation: 1,
        focusDist: 0,
        shake: 0,
        wet: 1,
      },
      exposure: 1,
      env: y ? y.texture : null,
      interiorEnv: null,
      resolution: new Vector2(4, 4),
      depthTextureIsLive: !1,
      tune: A ? A.TUNE : {},
      get advanced() {
        return _;
      },
      get autoExposure() {
        return A ? A.autoExposure : !1;
      },
      set autoExposure(ie) {
        A && (A.autoExposure = !!ie);
      },
      get depthTexture() {
        if (!A) return null;
        E = !0;
        try {
          return A.ensureDepthCopy();
        } catch {
          return null;
        }
      },
      addPrePass(ie) {
        H.push(ie);
      },
      renderWorld(ie, F) {
        let X = n.getRenderTarget(),
          ne = n.shadowMap.needsUpdate,
          re = n.toneMapping,
          $ = n.toneMappingExposure,
          ue = ie.layers.mask;
        (ie.layers.disable(zc),
          (n.shadowMap.needsUpdate = !1),
          (n.toneMapping = NoToneMapping),
          (n.toneMappingExposure = 1));
        try {
          (n.setRenderTarget(F), n.clear(), n.render(r, ie));
        } finally {
          ((ie.layers.mask = ue),
            n.setRenderTarget(X),
            (n.shadowMap.needsUpdate = ne),
            (n.toneMapping = re),
            (n.toneMappingExposure = $));
        }
      },
      async onLevelReady() {
        n.shadowMap.needsUpdate = !0;
        try {
          K();
        } catch (ie) {
          console.error(
            "[render] interior probe failed: " + ((ie && ie.stack) || ie),
          );
        }
        try {
          if (
            (_ && n.setRenderTarget(m),
            await n.compileAsync(r, a),
            N.interiorEnv)
          ) {
            let ie = r.environment;
            r.environment = N.interiorEnv;
            try {
              n.compile(r, l);
            } finally {
              r.environment = ie;
            }
          }
        } catch {}
        (n.setRenderTarget(null), (S.settle = 3.5), (S.acc = 0), (S.n = 0));
      },
      setQuality(ie) {
        context.quality = ie;
        let F = p();
        h.shadow.mapSize.x !== F &&
          (h.shadow.mapSize.set(F, F),
          h.shadow.map && (h.shadow.map.dispose(), (h.shadow.map = null)));
        let X = ie.msaa | 0;
        (m.samples !== X && ((m.samples = X), m.dispose()),
          A && A.applyQuality(),
          N.resize());
      },
      resize() {
        let ie = Math.max(2, t.clientWidth || window.innerWidth),
          F = Math.max(2, t.clientHeight || window.innerHeight),
          X = Math.min(window.devicePixelRatio || 1, 2),
          ne = context.quality.scale || 1;
        if (_) {
          (n.setPixelRatio(X), n.setSize(ie, F, !1));
          let re = ne * S.scale,
            $ =
              {
                low: 1e6,
                medium: 15e5,
                high: 23e5,
                ultra: 37e5,
              }[context.quality.name] || 23e5,
            ue = ie * X * F * X * re * re;
          ue > $ && (re *= Math.sqrt($ / ue));
          let me = Math.max(16, Math.round(ie * X * re)),
            ee = Math.max(16, Math.round(F * X * re));
          (m.setSize(me, ee),
            (b.image.width !== me || b.image.height !== ee) &&
              ((b.image.width = me),
              (b.image.height = ee),
              (b.needsUpdate = !0)),
            A && A.resize(me, ee),
            N.resolution.set(me, ee));
        } else
          (n.setPixelRatio(X * ne),
            n.setSize(ie, F, !1),
            N.resolution.set(Math.round(ie * X * ne), Math.round(F * X * ne)));
        ((a.aspect = l.aspect = ie / F),
          a.updateProjectionMatrix(),
          l.updateProjectionMatrix());
      },
      frame(ie) {
        let F = performance.now();
        (D && z(F - D), (D = F), T++, n.info.reset(), x.update(ie));
        let X = context.time ? context.time.t : T / 60;
        ((u.material.uniforms.uTime.value = X),
          (w.t += ie),
          (w.value =
            w.t < 0.9
              ? w.power *
                Math.exp(-w.t * 5) *
                (0.55 + 0.45 * Math.sin(w.t * 47) * Math.sin(w.t * 13 + 1)) *
                0.35
              : 0),
          (u.material.uniforms.uFlash.value = Math.max(0, w.value)),
          C());
        for (let ne of H)
          try {
            ne(n, r, a);
          } catch (re) {
            q("pre", "[render] pre-pass threw: " + ((re && re.stack) || re));
          }
        if (_)
          try {
            j(ie);
          } catch (ne) {
            _ = !1;
            try {
              (s.depthRange(0, 1), n.setRenderTarget(null));
            } catch {}
            (console.error(
              "[render] advanced pipeline disabled, falling back to forward rendering: " +
                ((ne && ne.stack) || ne),
            ),
              N.resize());
          }
        (_ || G(),
          (U = {
            calls: n.info.render.calls,
            tris: n.info.render.triangles,
          }));
      },
      stats() {
        let ie = n.info;
        return {
          calls: U.calls,
          tris: U.tris,
          geos: ie.memory.geometries,
          tex: ie.memory.textures,
          programs: ie.programs ? ie.programs.length : 0,
          res: [N.resolution.x, N.resolution.y],
          scale: S.scale,
          advanced: _,
          softShadows: d,
          adapt: A && e.shot ? A.readAdapt() : void 0,
        };
      },
    },
    Q = null;
  function K() {
    let ie = context.level && context.level.interiorBoxes;
    if (!ie || !ie.length) return;
    let F = ie[0],
      X = (F.min.x + F.max.x) / 2,
      ne = (F.min.z + F.max.z) / 2,
      re = F.min.y + Math.min(2.4, (F.max.y - F.min.y) * 0.4);
    if (!Q) {
      let ee = new WebGLCubeRenderTarget(128, {
        type: HalfFloatType,
        generateMipmaps: !1,
      });
      ((Q = {
        cubeRT: ee,
        cam: new CubeCamera(0.15, 300, ee),
        pmrem: new PMREMGenerator(n),
        out: null,
      }),
        Q.cam.layers.set(vf));
    }
    (Q.cam.position.set(X, re, ne), Q.cam.updateMatrixWorld(!0));
    let $ = n.toneMapping;
    ((n.toneMapping = NoToneMapping),
      (u.material.uniforms.uEnv.value = 1),
      (n.shadowMap.needsUpdate = !0));
    try {
      Q.cam.update(n, r);
    } finally {
      ((u.material.uniforms.uEnv.value = 0),
        (n.toneMapping = $),
        n.setRenderTarget(null));
    }
    (Q.out && Q.out.dispose(),
      (Q.out = Q.pmrem.fromCubemap(Q.cubeRT.texture)),
      (N.interiorEnv = Q.out.texture));
    let ue = 0,
      me = new Set();
    (r.traverse((ee) => {
      let B = ee.material
        ? Array.isArray(ee.material)
          ? ee.material
          : [ee.material]
        : null;
      if (B)
        for (let P of B)
          !P ||
            me.has(P) ||
            !P.userData ||
            P.userData.interior !== !0 ||
            !("envMap" in P) ||
            (me.add(P),
            (P.envMap = N.interiorEnv),
            P.userData.keepEnvIntensity || (P.envMapIntensity = Ky),
            (P.needsUpdate = !0),
            ue++);
    }),
      ue &&
        console.log(`[render] interior probe assigned to ${ue} material(s)`));
  }
  ((N.captureInteriorProbe = K),
    N.resize(),
    window.addEventListener("resize", () => N.resize()));
  try {
    let ie = new MeshStandardMaterial({
        color: 8421504,
      }),
      F = new Mesh(new BoxGeometry(1, 1, 1), ie);
    ((F.castShadow = F.receiveShadow = !0),
      F.position.set(0, 0.5, -3),
      r.add(F));
    let X = () => {
      (C(), _ ? j(0.016) : G());
    };
    try {
      X();
    } catch (ne) {
      _ &&
        ((_ = !1),
        console.error(
          "[render] advanced pipeline failed its self test, using forward fallback: " +
            ((ne && ne.message) || ne),
        ));
    }
    if (o.shadow && d) {
      (Xy(),
        (d = !1),
        (o.shadow = !1),
        (n.shadowMap.type = PCFSoftShadowMap),
        (h.shadow.radius = 2),
        ie.dispose(),
        (F.material = new MeshStandardMaterial({
          color: 8421505,
        })),
        console.warn(
          "[render] soft shadow chunk rejected by the driver, using stock PCF",
        ));
      try {
        X();
      } catch {
        _ = !1;
      }
    }
    if (
      (o.sky && console.error("[render] sky shader failed to compile"),
      r.remove(F),
      F.geometry.dispose(),
      ie.dispose(),
      F.material.dispose(),
      !_)
    ) {
      try {
        (s.depthRange(0, 1), n.setRenderTarget(null));
      } catch {}
      N.resize();
    }
    T = 0;
  } catch (ie) {
    console.error("[render] self test threw: " + ((ie && ie.stack) || ie));
  }
  return N;
}

function showcaseRenderer(context) {
  let e = new Group();
  e.name = "render-showcase";
  let t = (h) => (e.add(h), h),
    n = new SphereGeometry(0.42, 48, 24);
  for (let h = 0; h < 2; h++)
    for (let f = 0; f < 7; f++) {
      let p = new MeshStandardMaterial({
          color: h ? 12170408 : 8006172,
          roughness: 0.06 + f * 0.15,
          metalness: h ? 1 : 0,
        }),
        d = new Mesh(n, p);
      (d.position.set(-3.6 + f * 1.2, 0.42 + h * 1.05, h * -1.1),
        (d.castShadow = d.receiveShadow = !0),
        t(d));
    }
  let s = [
    ["paint_orange", -5.2, 1.4, 1.3, 1.2, 2.2],
    ["steel_worn", 4.6, 1, 0.9, 1, 1.6],
    ["paint_teal", 5.6, 0.6, 2.4, 0.9, 3.6],
    ["concrete", -2.2, 0.5, 0.5, 2.6, 3.2],
  ];
  for (let [h, f, p, d, v, g] of s) {
    let x = createMesh(
      beveledBoxGeometry(p, d, v, 0.03, "bottom"),
      context.mats.get(h),
    );
    (x.position.set(f, 0, g), (x.rotation.y = f * 0.2), t(x));
  }
  for (let h = 0; h < 5; h++) {
    let f = createMesh(
      beveledBoxGeometry(0.5, 0.5, 0.5, 0.02, "bottom"),
      context.mats.get("wood_pallet"),
    );
    (f.position.set(0.5 + h * 0.52, 0, 3.4 + (h % 2) * 0.04), t(f));
  }
  {
    let h = createMesh(
      beveledBoxGeometry(0.5, 0.5, 0.5, 0.02, "bottom"),
      context.mats.get("wood_pallet"),
    );
    (h.position.set(1.3, 0.5, 3.42), (h.rotation.y = 0.3), t(h));
  }
  let o = context.mats.get("concrete_dirty"),
    r = 9,
    a = 7.5,
    l = [
      [-14, -5.2],
      [-4.7, -1.6],
      [-1.1, 1.9],
      [2.4, 5.6],
      [6.3, 14],
    ];
  for (let [h, f] of l) {
    let p = createMesh(boxGeometry(0.4, a, f - h, "bottom"), o);
    (p.position.set(r, 0, (h + f) / 2), t(p));
  }
  {
    let h = createMesh(boxGeometry(0.4, 1.2, 28, "bottom"), o);
    (h.position.set(r, a, 0), t(h));
  }
  let c = [
    [-12, 0, -9, 6, 4, 0.3],
    [-12, 0, -3, 6, 4, 0.3],
    [-15, 0, -6, 0.3, 4, 6.3],
    [-12, 4, -6, 6.6, 0.3, 6.6],
  ];
  for (let [h, f, p, d, v, g] of c) {
    let x = createMesh(
      boxGeometry(d, v, g, "bottom"),
      context.mats.get("steel_dark"),
    );
    (x.position.set(h, f, p), t(x));
  }
  {
    let h = new Mesh(
      boxGeometry(2.4, 0.06, 0.06),
      context.mats.emissive(16756832, 14),
    );
    (h.position.set(-12, 3.6, -6), t(h));
  }
  {
    let h = new Mesh(
      new SphereGeometry(0.06, 12, 8),
      context.mats.emissive(16726560, 30),
    );
    (h.position.set(4.6, 1.02, 1.6), t(h));
  }
  return (
    context.scene.add(e),
    {
      cam: [-8.5, 1.7, 4.2],
      target: [3, 1.5, 0.4],
      update: () => {
        let h = context.render.post,
          f = Math.round(context.camera.position.y * 1e3) % 10;
        ((h.damage = f === 1 ? 0.8 : 0),
          (h.lowHealth = f === 2 ? 0.85 : 0),
          (h.ads = f === 3 ? 1 : 0),
          (h.flash = f === 4 ? 0.35 : 0),
          (h.fade = f === 5 ? 0.5 : 0));
      },
    }
  );
}

export { createRenderer, rendererShowcaseModule, showcaseRenderer };
