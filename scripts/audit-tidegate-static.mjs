// TIDEGATE 静态审计：只看 tidegate.js 里几类"写法合法、跑起来静默走偏"的坑。
// 与 audit-tidegate-smoke.mjs（真跑一遍）、audit-tidegate-routes.mjs（爬动线）配合使用。
import fs from "node:fs";

const src = fs.readFileSync("src/world/level/tidegate.js", "utf8");
let bad = 0;

// 1) t.place 的 prop 名必须在注册表内（否则回落 1 m 灰盒）
const used = [...new Set([...src.matchAll(/t\.place\("(\w+)"/g)].map((m) => m[1]))];
const known = new Set([
  "jersey_barrier", "light_mast", "fence_panel", "guard_booth", "gate_arm",
  "bollard_mooring", "bollard_post", "sign_post", "floodlight_stand",
  "stairs_metal", "catwalk", "shelf_rack", "reefer_unit", "relay_node",
  "container20", "container40", "container40hc",
  "barrel", "pallet", "pallet_stack", "crate_wood", "crate_stack", "ibc_tote",
  "cable_reel", "tire_stack", "jerry_can", "traffic_cone", "gas_cylinders",
  "pipe_stack", "forklift", "generator", "dumpster", "toolbox_cart",
]);
const unknownProp = used.filter((n) => !known.has(n));
console.log("placed props:", used.join(", "));
console.log("UNKNOWN PROP:", unknownProp.join(", ") || "(none)");
bad += unknownProp.length;

// 2) t.place 的 opts 里不能有 hex 颜色（container/barrel 只认色名）和 tilt（place 不支持）
const placeCalls = [...src.matchAll(/t\.place\(([^)\n]*)/g)].map((m) => m[1]);
const hexInPlace = placeCalls.filter((c) => /color: ?0x/.test(c));
const tiltInPlace = placeCalls.filter((c) => /tilt:/.test(c));
console.log("hex color in t.place:", hexInPlace.length ? hexInPlace.join(" | ") : "(none)");
console.log("tilt in t.place:", tiltInPlace.length ? tiltInPlace.join(" | ") : "(none)");
bad += hexInPlace.length + tiltInPlace.length;

// 3) 已经踩过的形状错误：fov / p.hp / t.mats（ob() 上没有 mats 键）
for (const probe of [/fov:/g, /p\.hp/g, /\bt\.mats\b/g]) {
  const hits = src.split("\n").filter((l) => probe.test(l));
  console.log(`[${probe.source}] ${hits.length} line(s)`);
  for (const h of hits) console.log("   " + h.trim());
  bad += hits.length;
}

console.log(bad === 0 ? "STATIC OK" : `STATIC FAILED (${bad})`);
process.exit(bad === 0 ? 0 : 1);
