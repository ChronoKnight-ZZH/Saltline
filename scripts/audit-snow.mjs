// 风雪数值审计：把 combine(时段, blizzard / lightSnow) 的关键量打印成表。
// 用法：node scripts/audit-snow.mjs
// 只做数值复算，不渲染；口径见 docs/weather/TIDEGATE暴风雪数值平移.md。
import {
  TIME_PRESETS,
  WEATHER_PRESETS,
  combine,
} from "../src/core/environment-presets.js";

const TIMES = ["dawn", "noon", "dusk", "midnight"];
const ENEMY_SIGHT = 120;

function lum(c) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function fogTransmission(density, distance) {
  const od = density * distance;
  return Math.exp(-od * od);
}

console.log("== 能见度 / 雾密度（TIDEGATE：只有 blizzard）==");
console.log("时段       能见度   雾密度   半程透过率  能见度处透过率");
for (const t of TIMES) {
  const e = combine(t, "blizzard");
  console.log(
    [
      t.padEnd(9),
      (e.visibility.toFixed(1) + "m").padStart(7),
      e.fogDensity.toFixed(4).padStart(7),
      (fogTransmission(e.fogDensity, e.visibility * 0.5) * 100).toFixed(1).padStart(9) + "%",
      (fogTransmission(e.fogDensity, e.visibility) * 100).toFixed(1).padStart(11) + "%",
    ].join("  "),
  );
}
console.log("（能见度处透过率应≈10%：fogOptical 0.90 = 该处九成被雪幕吃掉）");

console.log("\n== 视觉量（blizzard vs 同图原默认 clear@dawn）==");
for (const t of TIMES) {
  const e = combine(t, "blizzard");
  console.log(
    [
      t.padEnd(9),
      "fogLum " + lum(e.fogColor).toFixed(3),
      "skyTop " + lum(e.skyTop).toFixed(3),
      "sun " + e.sunIntensity.toFixed(2),
      "shadow " + e.shadowIntensity.toFixed(2),
      "disk " + e.sunDisk.toFixed(2),
      "expo " + e.exposure.toFixed(2),
      "lamp " + e.lampOn.toFixed(2),
      "wind " + e.windLevel,
      "snow " + e.snowLevel,
      "heli " + e.helicopterEnabled,
    ].join("  "),
  );
}

console.log("\n== 玩法量（blizzard）==");
for (const t of TIMES) {
  const e = combine(t, "blizzard");
  console.log(
    [
      t.padEnd(9),
      "spread " + e.spreadScale.toFixed(2) + "\u00d7",
      "audioMask " + e.audioMask.toFixed(2),
      "footstep " + Math.min(e.audioMask, 0.85).toFixed(2),
      "sightFrac " + (e.visibility / ENEMY_SIGHT * 100).toFixed(0) + "%",
    ].join("  "),
  );
}

console.log("\n== 与雨档的排序校验（现码基线，防倒挂）==");
const order = ["clear", "overcast", "lightRain", "lightSnow", "heavyRain", "blizzard"];
for (const w of order) {
  const e = combine("noon", w);
  console.log(
    w.padEnd(10),
    "vis " + e.visibility.toFixed(0).padStart(4) + "m",
    "spread " + e.spreadScale.toFixed(2),
    "audio " + e.audioMask.toFixed(2),
  );
}

console.log("\n== 雷雪 ==");
const b = combine("midnight", "blizzard");
console.log({
  mode: b.lightningMode,
  enabled: b.lightningEnabled,
  peakVisibility: Math.min(b.visibility * 3.5, 120).toFixed(1),
});
console.log("\nweather presets:", Object.keys(WEATHER_PRESETS).join(", "));
console.log("time baselines:", TIMES.map((t) => t + "=" + TIME_PRESETS[t].visibility).join(", "));
