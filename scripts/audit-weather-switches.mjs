// 天气/风雪开关审计：验证 URL 参数解析（?wx=off 等）与 ?snow=0 的静音行为。
// 不依赖 DOM；粒子层只跑 update，不做渲染。
import { Group, PerspectiveCamera } from "../src/vendor/three-r180.js";
import { interpretWeatherParams } from "../src/core/environment-presets.js";
import { createSnow } from "../src/effects/snow.js";

let bad = 0;
function check(label, ok, detail) {
  if (!ok) bad += 1;
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? " — " + detail : ""}`);
}

// ---- 1) interpretWeatherParams ----
const cases = [
  ["tidegate 无参数", "tidegate", {}, { explicit: false, locked: "blizzard", weather: null }],
  ["tidegate 显式 blizzard", "tidegate", { weather: "blizzard" }, { explicit: true, locked: "blizzard", weather: "blizzard" }],
  ["tidegate 请求 clear（被锁）", "tidegate", { weather: "clear" }, { explicit: true, locked: "blizzard", weather: null, ignored: "clear" }],
  ["tidegate wx=off", "tidegate", { wx: "off" }, { explicit: true, locked: null, weather: null, wxOff: true }],
  ["tidegate wx=off + clear", "tidegate", { wx: "off", weather: "clear" }, { explicit: true, locked: null, weather: "clear" }],
  ["tidegate weather=off（简写）", "tidegate", { weather: "off" }, { explicit: true, locked: null, weather: null, wxOff: true }],
  ["tidegate wx=0 + midnight", "tidegate", { wx: "0", time: "midnight" }, { explicit: true, locked: null, time: "midnight" }],
  ["level 无参数", "level", {}, { explicit: false, locked: null, weather: null }],
  ["level 显式组合", "level", { time: "midnight", weather: "heavyRain" }, { explicit: true, time: "midnight", weather: "heavyRain" }],
  ["level 非法天气", "level", { weather: "nope" }, { explicit: true, weather: null }],
  ["tidegate shot 无参数", "tidegate", { shot: "1" }, { explicit: false, locked: "blizzard" }],
];
for (const [label, mapId, params, expect] of cases) {
  const got = interpretWeatherParams(mapId, params);
  const diffs = [];
  if ("explicit" in expect && got.explicit !== expect.explicit) diffs.push(`explicit ${got.explicit}≠${expect.explicit}`);
  if ("locked" in expect && (got.lockedWeather || null) !== expect.locked) diffs.push(`locked ${got.lockedWeather}≠${expect.locked}`);
  if ("weather" in expect && (got.weather || null) !== expect.weather) diffs.push(`weather ${got.weather}≠${expect.weather}`);
  if ("time" in expect && (got.timeOfDay || null) !== expect.time) diffs.push(`time ${got.timeOfDay}≠${expect.time}`);
  if ("wxOff" in expect && got.wxOff !== expect.wxOff) diffs.push(`wxOff ${got.wxOff}≠${expect.wxOff}`);
  if ("ignored" in expect && (got.ignored || null) !== expect.ignored) diffs.push(`ignored ${got.ignored}≠${expect.ignored}`);
  check(`weather-params: ${label}`, diffs.length === 0, diffs.join("; "));
}

// ---- 2) createSnow 的 ?snow=0 ----
function snowRun(params, snowLevel) {
  const scene = new Group();
  const context = {
    scene,
    params,
    rng: Math.random,
    camera: new PerspectiveCamera(60, 1, 0.1, 200),
    environment: { snowLevel, wind: { x: 1, z: 0, speed: 3 } },
    render: { resolution: { x: 1280, y: 720 } },
  };
  const snow = createSnow(context);
  for (let i = 0; i < 120; i += 1) snow.update(1 / 60);
  return snow;
}
const loud = snowRun({}, 1.0);
check("snow 默认档：暴风雪可见", loud.points.visible && loud.points.geometry.drawRange.count > 1000, `draw=${loud.points.geometry.drawRange.count}`);
const calm = snowRun({}, 0.0);
check("snow 默认档：晴天不可见", !calm.points.visible && calm.points.geometry.drawRange.count === 0);
for (const flag of ["0", "off"]) {
  const muted = snowRun({ snow: flag }, 1.0);
  check(`snow=${flag}：粒子被静音`, !muted.points.visible && muted.points.geometry.drawRange.count === 0 && muted.level === 0);
}

console.log(bad === 0 ? "WEATHER-SWITCHES OK" : `WEATHER-SWITCHES FAILED (${bad})`);
process.exit(bad === 0 ? 0 : 1);
