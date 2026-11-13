import {
  Group,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
} from "../../vendor/three-r180.js";

var _A = new Set([
  "gunmetal",
  "anodized_black",
  "polymer_black",
  "polymer_tan",
  "rubber",
  "carbon",
  "glove_fabric",
  "armor_white",
  "armor_orange",
]);

function MA(i) {
  let e = new SphereGeometry(i, 48, 32),
    t = e.attributes.uv;
  for (let n = 0; n < t.count; n++)
    t.setXY(n, t.getX(n) * 2 * Math.PI * i, t.getY(n) * Math.PI * i);
  return e;
}

function c1(i, e) {
  let t = new PlaneGeometry(i, e),
    n = t.attributes.uv;
  for (let s = 0; s < n.count; s++) n.setXY(s, n.getX(s) * i, n.getY(s) * e);
  return t;
}

function showcaseMaterials(context) {
  let e = context.mats,
    t = new Group();
  context.scene.add(t);
  let n = context.params.only
      ? String(context.params.only).split(",").filter(Boolean)
      : null,
    s = !n || n.includes("decals"),
    o = n ? n.filter((g) => g !== "decals") : e.names,
    r = n ? Math.max(1, o.length) : 10,
    a = 1.9,
    l = 3.6,
    c = MA(0.42),
    u = c1(1.5, 1.5),
    h = c1(1.5, 1.5).rotateX(-Math.PI / 2),
    f = (g, x, y, b, m) => {
      let A = new Mesh(g, x);
      return (
        A.position.set(y, b, m),
        (A.castShadow = A.receiveShadow = !0),
        t.add(A),
        A
      );
    };
  o.forEach((g, x) => {
    let y = ((x % r) - (r - 1) / 2) * a,
      b = -Math.floor(x / r) * l,
      m = e.get(
        g,
        g.startsWith("glass") || g === "chainlink"
          ? {
              doubleSide: !0,
            }
          : {},
      );
    (f(u, m, y, 0.76, b),
      f(h, m, y, 0.012, b + 1.1),
      f(
        c,
        _A.has(g)
          ? e.get(g, {
              triplanar: !0,
            })
          : m,
        y,
        0.46,
        b + 1.25,
      ));
  });
  let p,
    d,
    v = r * a;
  if (
    (n && o.length
      ? ((p = [0.25 * v, 1.5, 2.6 + v * 0.42]), (d = [0, 0.62, 0.5]))
      : ((p = [0, 9.5, 12]), (d = [0, 0, -7])),
    s)
  ) {
    let g = n && !o.length ? 0 : v / 2 + 5.5,
      x = 8.4,
      y = 3.3,
      b = f(c1(x, y), e.get("paint_blue"), g, y / 2, -1),
      m = f(c1(x, y), e.get("concrete"), g, y / 2, -1.01);
    m.position.x += x;
    let A = e.decalNames,
      _ = -x / 2 + 0.25,
      M = y - 0.75,
      E = 0.62,
      w = (z, H, O) => {
        let q = H * z.aspect;
        if (_ + q > x * 1.5 - 0.2) return;
        _ < x / 2 && _ + q > x / 2 - 0.15 && (_ = x / 2 + 0.25);
        let U = new Mesh(new PlaneGeometry(q, H), z.material);
        (U.position.set(g + _ + q / 2, M + H / 2, -0.996),
          (U.renderOrder = 2),
          t.add(U),
          (_ += q + 0.14));
      };
    ([A.slice(0, 9), A.slice(9, 17), A.slice(17)].forEach((z, H) => {
      ((_ = -x / 2 + 0.25),
        (M = y - 0.75 - H * 0.78),
        z.forEach((O) => w(e.decal(O), E)));
    }),
      (_ = -x / 2 + 0.25),
      (M = y - 0.75 - 3 * 0.78 - 0.05),
      w(
        e.label("SALTLINE TERMINAL  B4-0271", {
          color: "white",
        }),
        0.3,
      ),
      w(
        e.label("MAX GROSS 30480 KG", {
          color: "yellow",
          distress: 0.6,
        }),
        0.22,
      ),
      w(
        e.label("DANGER", {
          color: "red",
          distress: 0.2,
        }),
        0.3,
      ),
      w(
        e.label("KEEP CLEAR", {
          color: "black",
          font: "sans",
        }),
        0.25,
      ),
      w(e.number(4), 0.3),
      w(e.number(7), 0.3),
      n && !o.length && ((p = [x / 2, 1.7, 7.2]), (d = [x / 2, 1.6, -1])));
  }
  return (
    context.params.wet !== void 0 &&
      (e.uniforms.wet.value = +context.params.wet),
    console.log("[mats] " + JSON.stringify(e.stats())),
    {
      cam: p,
      target: d,
      update() {},
    }
  );
}

export { showcaseMaterials };
