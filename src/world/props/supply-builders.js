// Supply crate prop (M6.0).
// 复用 crate_wood 的程序化木箱（PROP_BUILDERS.crate_wood），在其上叠加：
//   1. 地面环状光晕（透明 RingGeometry，夜里更亮，用能见度反推）
//   2. 顶部状态灯（MeshBasicMaterial，按补给点类型上色，用尽后变灰）
// 视觉差异化走"附件层"，不新增一套程序化模型（M7 才做四把枪的专属箱体）。
// 碰撞盒仍由 crate_wood finish() 的 userData.colliders 决定，不因叠加子网格而变化。

import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
} from "../../vendor/three-r180.js";
import { PROP_BUILDERS } from "./registry.js";

var KIND_TINT = {
  mixed: 0xd8c07a,
  light: 0xd8a15c,
  heavy: 0x7fb3d5,
  shell: 0xd06a4a,
  dmr: 0x9fc6da,
};

var DARK = 0x4a4a4a;

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function buildSupplyCrate(context, opts = {}) {
  let kind = opts.kind || "mixed",
    tint = KIND_TINT[kind] || KIND_TINT.mixed,
    group = PROP_BUILDERS["crate_wood"](context, {
      seed: opts.seed || 0,
      label: opts.label || "AMMO",
      code: opts.code || "SLT-" + String(opts.id || "S").toUpperCase(),
    }),
    haloMaterial = new MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
    halo = new Mesh(new RingGeometry(0.72, 1.12, 40), haloMaterial),
    lampMaterial = new MeshBasicMaterial({ color: tint }),
    lamp = new Mesh(new BoxGeometry(0.16, 0.05, 0.16), lampMaterial),
    bar = new Mesh(new BoxGeometry(0.62, 0.05, 0.09), lampMaterial),
    state = opts.used ? "used" : "live",
    t = 0;

  (halo.name = "supply_halo"),
    (lamp.name = "supply_lamp"),
    (bar.name = "supply_bar"),
    (halo.rotation.x = -Math.PI / 2),
    (halo.position.y = 0.018),
    (lamp.position.y = 1.02),
    (bar.position.y = 1.02),
    halo.raycast = () => {},
    (lamp.raycast = () => {}),
    (bar.raycast = () => {}),
    group.add(halo),
    group.add(lamp),
    group.add(bar);

  function setState(next) {
    state = next === "used" ? "used" : "live";
    (halo.visible = state !== "used"),
      lampMaterial.color.setHex(state === "used" ? DARK : tint);
  }

  function update(dt) {
    if (state === "used") return;
    t += dt;
    let perception = context.environment && context.environment.perception,
      vis = (perception && +perception.visibility) || 45,
      glow = clamp01(1 - vis / 45),
      base = 0.35 + 0.4 * glow,
      pulse = 0.55 + 0.45 * Math.sin(t * 2.4);
    haloMaterial.opacity = base * pulse;
  }

  return (
    (group.userData.supply = { id: opts.id || "", kind }),
    (group.userData.setState = setState),
    (group.userData.update = update),
    (group.userData.supplyState = () => state),
    setState(state),
    group
  );
}

export { buildSupplyCrate, KIND_TINT };
