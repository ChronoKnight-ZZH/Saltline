// Time-of-day and weather presets, and the pure combine() function.
import { Color, Vector3 } from "../vendor/three-r180.js";
import { SKY_COLORS, SUN_LIGHT } from "./config.js";

// 把太阳方向、颜色、强度、天空色、雾色、曝光、能见度、灯光、音乐氛围
// 收进时间预设；天气只负责乘法因子与雨/湿度/雷电/音频遮蔽。
var TIME_PRESETS = {
  dawn: {
    sunDir: SUN_LIGHT.dir.clone(),
    sunColor: SUN_LIGHT.color.clone(),
    sunIntensity: SUN_LIGHT.intensity,
    skyTop: SKY_COLORS.zenith.clone(),
    skyHorizon: SKY_COLORS.horizon.clone(),
    fogColor: SKY_COLORS.fog.clone(),
    exposure: 1.0,
    ambient: 1.0,
    visibility: 180,
    lampOn: 0.4,
    musicMood: "calm",
  },
  noon: {
    sunDir: new Vector3(0.35, 0.9, 0.25).normalize(),
    sunColor: new Color(1.0, 0.95, 0.88),
    sunIntensity: 11,
    skyTop: new Color(0.12, 0.22, 0.38),
    skyHorizon: new Color(0.62, 0.72, 0.86),
    fogColor: new Color(0.55, 0.62, 0.72),
    exposure: 1.05,
    ambient: 1.15,
    visibility: 220,
    lampOn: 0.0,
    musicMood: "bright",
  },
  dusk: {
    sunDir: new Vector3(-0.82, 0.18, 0.45).normalize(),
    sunColor: new Color(1.0, 0.55, 0.35),
    sunIntensity: 7,
    skyTop: new Color(0.10, 0.08, 0.16),
    skyHorizon: new Color(0.88, 0.42, 0.22),
    fogColor: new Color(0.42, 0.30, 0.28),
    exposure: 0.95,
    ambient: 0.9,
    visibility: 160,
    lampOn: 0.7,
    musicMood: "warm",
  },
  midnight: {
    sunDir: new Vector3(0.2, 0.3, -0.9).normalize(),
    sunColor: new Color(0.55, 0.65, 0.9),
    sunIntensity: 1.5,
    skyTop: new Color(0.015, 0.025, 0.05),
    skyHorizon: new Color(0.05, 0.08, 0.14),
    fogColor: new Color(0.03, 0.05, 0.08),
    exposure: 0.7,
    ambient: 0.35,
    visibility: 90,
    lampOn: 1.0,
    musicMood: "dark",
  },
};

var WEATHER_PRESETS = {
  clear: {
    visibilityMul: 1.0,
    audioMask: 0.0,
    spreadScale: 1.0,
    rainLevel: 0.0,
    wetness: 0.0,
    lightning: false,
    fogMul: 1.0,
  },
  overcast: {
    visibilityMul: 0.78,
    audioMask: 0.1,
    spreadScale: 1.0,
    rainLevel: 0.0,
    wetness: 0.2,
    lightning: false,
    fogMul: 1.25,
  },
  lightRain: {
    visibilityMul: 0.5,
    audioMask: 0.5,
    spreadScale: 1.05,
    rainLevel: 0.45,
    wetness: 0.6,
    lightning: true,
    fogMul: 1.6,
  },
  heavyRain: {
    visibilityMul: 0.28,
    audioMask: 0.72,
    spreadScale: 1.15,
    rainLevel: 1.0,
    wetness: 1.0,
    lightning: true,
    fogMul: 2.2,
  },
};

var DEFAULT_ENV = { timeOfDay: "dawn", weather: "clear" };

// M1 只建通路，M6 按“能见度 220m 时远处目标可辨”标定。
// noon/clear 的 fogDensity ≈ 0.02 / 220 ≈ 9.1e-5，接近原版无雾视觉。
var FOG_K = 0.02;

var LIGHTNING_TIMING = {
  high: 0.8,
  dampLambda: 5,
  minInterval: 8,
  maxInterval: 20,
};

var HELICOPTER_TUNING = {
  radius: 18,
  height: 22,
  speed: 0.35,
  beamHalfAngle: 0.18,
  beamRange: 45,
  exposeInterval: 0.25,
  maskRadius: 30,
};

function combine(timeOfDay, weather) {
  let time = TIME_PRESETS[timeOfDay] || TIME_PRESETS[DEFAULT_ENV.timeOfDay],
    w = WEATHER_PRESETS[weather] || WEATHER_PRESETS[DEFAULT_ENV.weather],
    visibility = time.visibility * w.visibilityMul;
  return {
    visibility,
    fogColor: time.fogColor.clone(),
    fogDensity: (FOG_K / visibility) * w.fogMul,
    exposure: time.exposure,
    sunDir: time.sunDir.clone(),
    sunColor: time.sunColor.clone(),
    sunIntensity: time.sunIntensity,
    skyTop: time.skyTop.clone(),
    skyHorizon: time.skyHorizon.clone(),
    ambient: time.ambient,
    rainLevel: w.rainLevel,
    wetness: w.wetness,
    audioMask: w.audioMask,
    spreadScale: w.spreadScale,
    lampOn: time.lampOn,
    musicMood: time.musicMood,
    lightningEnabled: w.lightning,
    helicopterEnabled: timeOfDay === "midnight" && !w.lightning,
  };
}

export {
  TIME_PRESETS,
  WEATHER_PRESETS,
  DEFAULT_ENV,
  FOG_K,
  LIGHTNING_TIMING,
  HELICOPTER_TUNING,
  combine,
};