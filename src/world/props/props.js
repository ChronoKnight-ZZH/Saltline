// Prop factory and showcase. Builders are installed by register.js.
import { Group, defineModuleExports } from "../../vendor/three-r180.js";
import { boxGeometry, createMesh } from "../../core/geometry.js";
import { PROP_BUILDERS, PROP_SIZES, registerProp } from "./registry.js";

var propsShowcaseModule = {};

defineModuleExports(propsShowcaseModule, {
  PROP_SIZES: () => PROP_SIZES,
  create: () => createProps,
  register: () => registerProp,
  showcase: () => showcaseProps,
});

function createProps(context) {
  return {
    names: () => Object.keys(PROP_SIZES),
    has: (e) => !!PROP_SIZES[e],
    build(e, t = {}) {
      if (PROP_BUILDERS[e])
        try {
          let o = PROP_BUILDERS[e](context, t);
          if (o) return ((o.userData.prop = e), o);
        } catch (o) {
          console.error(`[props] builder "${e}" threw`, o);
        }
      let n = PROP_SIZES[e] || [1, 1, 1, "concrete", "concrete"];
      PROP_SIZES[e] || console.warn(`[props] unknown prop "${e}"`);
      let s = new Group();
      return (
        s.add(
          createMesh(
            boxGeometry(n[0], n[1], n[2], "bottom"),
            context.mats.get(n[3]),
          ),
        ),
        (s.userData.colliders = [
          {
            min: [-n[0] / 2, 0, -n[2] / 2],
            max: [n[0] / 2, n[1], n[2] / 2],
            surface: n[4],
          },
        ]),
        (s.userData.size = [n[0], n[1], n[2]]),
        (s.userData.prop = e),
        s
      );
    },
  };
}

function showcaseProps(context) {
  let e = context.params.names
      ? context.params.names.split(",")
      : Object.keys(PROP_SIZES),
    t = 0,
    n = 0,
    s = 0,
    o = 0;
  for (let a of e) {
    let l = context.props.build(a, {
        seed: 7,
        doors: a.startsWith("container") ? 0.6 : 0,
      }),
      c = l.userData.size || PROP_SIZES[a] || [1, 1, 1];
    (t + c[0] > 26 && ((t = 0), (n += s + 1.5), (s = 0)),
      l.position.set(t + c[0] / 2, 0, n),
      context.scene.add(l),
      (t += c[0] + 1),
      (s = Math.max(s, c[2])),
      (o = Math.max(o, t)));
  }
  let r = Math.min(o, 26) / 2;
  return {
    cam: [r - 4, 2.2, n + s + 6],
    target: [r, 1, n / 2],
  };
}

export { createProps, propsShowcaseModule, showcaseProps };
