import { Group, defineModuleExports } from "../../vendor/three-r180.js";
import { batchStaticMeshes } from "../../core/geometry.js";
import { ab, no, ob, rb } from "./buildings.js";
import { Lr, cb, fR, hR, lv, mt, ts } from "./placement.js";

var levelShowcaseModule = {};

defineModuleExports(levelShowcaseModule, {
  create: () => createLevel,
  showcase: () => showcaseLevel,
});

async function createLevel(context) {
  let e = new Group();
  ((e.name = "level"), context.scene.add(e));
  let t = ob(context);
  (hR(t), fR(t));
  let n = ab(t),
    s = cb(t),
    o = t.place(
      "relay_node",
      1.5,
      7.5,
      0.35,
      {
        seed: 1,
      },
      0,
    ),
    r = t.place(
      "relay_node",
      n.relayPos.x,
      n.relayPos.z,
      ts * 0.9,
      {
        seed: 2,
      },
      no.FLOOR,
    ),
    a = t.place(
      "relay_node",
      s.relayPos.x,
      s.relayPos.z,
      -0.2,
      {
        seed: 3,
      },
      0,
    );
  (Lr(
    t,
    [
      [-2, -27.5, 1.2],
      [-2, -27.55, 0.08],
      [-1.4, -25.6],
      [-2.4, -23],
      [-1.9, -20.3],
    ],
    0.03,
    t.MI("rubber"),
    no.FLOOR + 0.028,
  ),
    lv(t, 20.4, -7.3, 0.2),
    Lr(
      t,
      [
        [20.5, -7],
        [21.4, -4.9],
        [22.4, -2.6],
        [22.9, -0.7],
      ],
      0.03,
    ),
    t.staticRoot.updateMatrixWorld(!0));
  let l = [];
  t.staticRoot.traverse((z) => {
    z.userData &&
      z.userData.noMerge &&
      !(z.parent && dR(z.parent, t.staticRoot)) &&
      l.push(z);
  });
  for (let z of l) t.dynRoot.attach(z);
  let c = new Set();
  t.staticRoot.traverse((z) => {
    z.isMesh && !Array.isArray(z.material) && c.add(z.material);
  });
  let u = new Map();
  for (let z of c)
    if (!(
      !z.isMeshStandardMaterial ||
      z.vertexColors ||
      z.transparent ||
      !z.name ||
      !(context.mats.names || []).includes(z.name)
    ))
      try {
        let H =
          z.userData && z.userData.interior
            ? {
                interior: !0,
              }
            : {};
        if (context.mats.get(z.name, H) !== z) continue;
        let O = context.mats.get(z.name, {
          ...H,
          vertexColors: !0,
        });
        O !== z && c.has(O) && u.set(z, O);
      } catch {}
  t.staticRoot.traverse((z) => {
    if (!z.isMesh || Array.isArray(z.material)) return;
    let H = u.get(z.material);
    H && (z.material = H);
    let O = !z.material.transparent && !z.material.isMeshBasicMaterial;
    ((z.castShadow = O), (z.receiveShadow = !z.material.isMeshBasicMaterial));
  });
  let h = {
    count: 0,
    update() {},
  };
  try {
    h = rb(t.staticRoot);
  } catch (z) {
    console.error("[level] label atlas failed", z);
  }
  let f = batchStaticMeshes(t.staticRoot);
  ((f.name = "level-merged"), e.add(f), e.add(t.dynRoot));
  for (let z of [o, r, a]) {
    for (let H = z.children.length - 1; H >= 0; H--) z.remove(z.children[H]);
    t.dynRoot.add(z);
  }
  let p = 0;
  f.traverse((z) => {
    if (z.isMesh) {
      let H = z.geometry;
      p += (H.index ? H.index.count : H.attributes.position.count) / 3;
    }
  });
  let d = {
      pos: mt(-32, 0, 6),
      yaw: -ts,
    },
    v = [
      {
        id: "relay_a",
        label: "Relay A \u2014 Yard",
        zone: "yard",
        pos: mt(1.5, 0, 7.5),
        object: o,
      },
      {
        id: "relay_b",
        label: "Relay B \u2014 Shed",
        zone: "shed",
        pos: mt(n.relayPos.x, no.FLOOR, n.relayPos.z),
        object: r,
      },
      {
        id: "relay_c",
        label: "Relay C \u2014 Quay",
        zone: "quay",
        pos: mt(s.relayPos.x, 0, s.relayPos.z),
        object: a,
      },
    ],
    g = (z, H, O) => ({
      pos: mt(z, 0, H),
      zone: O,
      type: "ground",
    }),
    x = (z, H, O, q) => ({
      pos: mt(z, H, O),
      zone: q,
      type: "air",
    }),
    y = [
      g(-19, -1.4, "yard"),
      g(3.5, -1.6, "yard"),
      g(14.2, 16.4, "yard"),
      g(-3.2, 16.6, "yard"),
      g(-16, 26, "yard"),
      g(6, 26, "yard"),
      g(4.2, -5.12, "yard"),
      g(-7.8, 21.4, "yard"),
      g(-11.3, 12.5, "yard"),
      g(17.5, 22.2, "yard"),
      x(10, 11, 23.5, "yard"),
      x(2, 11, 21.5, "yard"),
      x(13, 9, 11, "yard"),
      x(-4, 12.5, -4.5, "yard"),
      x(9, 10, 1.5, "yard"),
      x(-10, 12, 24.5, "yard"),
      g(-12.4, -24.8, "shed"),
      g(9.6, -25.3, "shed"),
      g(-13.4, -19.6, "shed"),
      g(4.6, -13.8, "shed"),
      g(-21, -27.2, "shed"),
      g(-18.6, -22, "shed"),
      g(13.6, -24, "shed"),
      g(-26.6, -15, "shed"),
      x(-8, 5.4, -20.5, "shed"),
      x(5, 5.2, -18, "shed"),
      x(-20, 10.5, -20, "shed"),
      x(14.5, 10, -22, "shed"),
      x(-2, 12.5, -8.5, "shed"),
      g(27.7, -24.2, "quay"),
      g(18.3, -25.4, "quay"),
      g(27.2, -12.6, "quay"),
      g(20.2, 14, "quay"),
      g(23.4, 23.2, "quay"),
      g(18, 24.4, "quay"),
      g(27.4, 11.6, "quay"),
      x(36, 9, 4, "quay"),
      x(38, 11, -6, "quay"),
      x(35, 8.5, 16, "quay"),
      x(24, 12.5, 10.5, "quay"),
      x(33.5, 10, 24.5, "quay"),
      x(22, 13, -14, "quay"),
    ],
    b = [
      {
        name: "gate",
        min: [-40, -30],
        max: [-24, 30],
      },
      {
        name: "yard",
        min: [-24, -10],
        max: [16, 30],
      },
      {
        name: "shed",
        min: [-24, -30],
        max: [16, -10],
      },
      {
        name: "quay",
        min: [16, -30],
        max: [40, 30],
      },
    ],
    m = [
      {
        min: mt(no.X0, 0, no.Z0),
        max: mt(no.X1, no.RIDGE, no.Z1),
      },
    ],
    A = [
      {
        pos: [-34, 1.6, 6.2],
        look: [-12, 2.6, 6.6],
      },
      {
        pos: [-20, 1.3, 5.6],
        look: [0, 2.2, 7],
      },
      {
        pos: [-6.2, 2.1, 7.9],
        look: [2, 1.6, 7.6],
      },
      {
        pos: [-6.6, 2.5, 0.4],
        look: [-4, 2.6, -12],
      },
      {
        pos: [-4.4, 1.9, -8.6],
        look: [-2.4, 2.8, -19.5],
      },
      {
        pos: [-3.2, 2.2, -15],
        look: [-2, 2.2, -20.5],
      },
      {
        pos: [4.2, 2.6, -19.6],
        look: [12, 3.2, -19.5],
      },
      {
        pos: [15, 2, -19.5],
        look: [24, 3.5, -6],
      },
      {
        pos: [20.2, 1.7, -9],
        look: [23, 1.6, 0],
      },
      {
        pos: [25.9, 1.8, 1.5],
        look: [27.5, 1.2, 12],
      },
      {
        pos: [27.3, 1.8, 12],
        look: [29.6, 0.4, 20],
      },
      {
        pos: [28.4, 1.9, 17.2],
        look: [31.5, -0.8, 21],
      },
    ],
    _ = [
      mt(-33.9, 0, 3.8),
      mt(-27.3, 0, 2.3),
      mt(-19.2, 0, 4.7),
      mt(-17.4, 0, 4.9),
      mt(-12.5, 0, 7.2),
      mt(-9.3, 0, 6.4),
      mt(-6.3, 0, 7.3),
      mt(-2.9, 0, 6.1),
      mt(-2.9, 0, 4.5),
      mt(5.6, 0, 5.8),
      mt(5.6, 0, 4.2),
      mt(-2.2, 0, 10.4),
      mt(5, 0, 8.9),
      mt(-4.8, 0, 10.6),
      mt(7.5, 0, 7.7),
      mt(9.2, 0, 4.4),
      mt(-1, 0, 13.6),
      mt(-13.5, 0, -1.5),
      mt(-9.6, 0, -0.7),
      mt(7.8, 0, -1.5),
      mt(-4.2, 0, -2.2),
      mt(-0.9, 0, -6.7),
      mt(-6.7, 0, -7),
      mt(1.2, 0, -8.9),
      mt(-8.1, 0, 15.4),
      mt(0.6, 0, 16.9),
      mt(4.2, 0, 15.7),
      mt(-16, 0, 15.6),
      mt(12, 0, 17.2),
      mt(2.9, 0, -17),
      mt(4.2, 0, -15.3),
      mt(6.9, 0, -20.6),
      mt(-7.6, 0, -17.4),
      mt(-8.3, 0, -14.3),
      mt(9.6, 0, -21.9),
      mt(-13.2, 0, -14.4),
      mt(-11.6, 0, -18.6),
      mt(0, 0, -25.8),
      mt(-12.4, 0, -25.8),
      mt(21.4, 0, -4.7),
      mt(25.3, 0, 3.9),
      mt(25.7, 0, -4.4),
      mt(20.2, 0, -15.4),
      mt(26.4, 0, -15.4),
      mt(20.6, 0, 14.4),
      mt(26.8, 0, 14.4),
      mt(20.6, 0, 21.2),
      mt(27.4, 0, 22.4),
      mt(19.6, 0, -21.4),
      mt(27, 0, -16.2),
      mt(25.6, 0, 6),
      mt(13.5, 2.59, 12.4),
      mt(4.4, 2.59, 12.4),
      mt(12.9, 0, 8.8),
      mt(11.6, 0, 4.9),
    ],
    M = context.physics.nav,
    E = (z) => {
      if (!(!M || !M.isWalkable || z.y > 0.2 || M.isWalkable(z.x, z.z)))
        for (let H of [0.5, 1, 1.5, 2])
          for (let O = 0; O < 8; O++) {
            let q = z.x + Math.cos(O * 0.7854) * H,
              U = z.z + Math.sin(O * 0.7854) * H;
            if (M.isWalkable(q, U)) {
              ((z.x = q), (z.z = U));
              return;
            }
          }
    };
  (_.forEach(E),
    y.forEach((z) => {
      z.type === "ground" && E(z.pos);
    }));
  let w = !1;
  return {
    root: e,
    playerStart: d,
    objectives: v,
    extraction: {
      pos: s.extraction.clone(),
      radius: 2.5,
    },
    enemySpawns: y,
    zones: b,
    interiorBoxes: m,
    cinematicPath: A,
    coverPoints: _,
    skylights: n.skylights,
    shedLights: n.lights,
    vantage: {
      stairsFoot: mt(-2.2, 0, 12.4),
      roof: mt(13.5, 2.59, 12.4),
    },
    stats: {
      labelsAtlased: h.count,
      containers: t.placed.filter((z) => z.name.startsWith("container")).length,
      props: t.placed.length,
      tris: Math.round(p),
      meshes: f.children.length + pR(t.dynRoot),
    },
    placed: t.placed,
    groundSurfaceAt(z, H) {
      return t.isMetal(z, H) ? "metal" : "concrete";
    },
    update(z) {
      (n.update(z), h.update(z));
      for (let H = 0; H < t.updaters.length; H++)
        try {
          t.updaters[H](z);
        } catch (O) {
          w || ((w = !0), console.error("[level] prop update threw", O));
        }
    },
  };
}

function dR(i, e) {
  for (; i && i !== e;) {
    if (i.userData && i.userData.noMerge) return !0;
    i = i.parent;
  }
  return !1;
}

function pR(i) {
  let e = 0;
  return (
    i.traverse((t) => {
      t.isMesh && e++;
    }),
    e
  );
}

async function showcaseLevel(context) {
  let e = await createLevel(context);
  return {
    cam: [-32, 1.7, 6],
    target: [0, 2.4, 6.4],
    update: (t) => e.update(t),
  };
}

export { createLevel, levelShowcaseModule, showcaseLevel };
