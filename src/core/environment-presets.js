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
    // 天空太阳盘可见度（0..1）。午夜没有太阳，避免在夜空画出暖白圆盘。
    sunDisk: 1.0,
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
    sunDisk: 1.0,
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
    sunDisk: 1.0,
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
    // 午夜的太阳方向实际是月光；天空不应出现太阳盘。
    sunDisk: 0.0,
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
    // 直射太阳强度与阴影浓度（0..1）
    sunMul: 1.0,
    // 天空太阳盘可见度倍率（0..1）
    sunDiskMul: 1.0,
  },
  overcast: {
    visibilityMul: 0.78,
    audioMask: 0.1,
    spreadScale: 1.0,
    rainLevel: 0.0,
    wetness: 0.2,
    lightning: false,
    fogMul: 1.25,
    sunMul: 0.65,
    sunDiskMul: 0.2,
  },
  lightRain: {
    visibilityMul: 0.5,
    audioMask: 0.5,
    // §4：1.05 → 1.15，让"雨天弹道散"可感知
    spreadScale: 1.15,
    rainLevel: 0.45,
    wetness: 0.6,
    lightning: true,
    fogMul: 1.6,
    sunMul: 0.45,
    sunDiskMul: 0.08,
  },
  heavyRain: {
    visibilityMul: 0.28,
    audioMask: 0.72,
    // §4：1.15 → 1.35，把玩家推向 <15m 的 CQC 距离
    spreadScale: 1.35,
    rainLevel: 1.0,
    wetness: 1.0,
    lightning: true,
    fogMul: 2.2,
    sunMul: 0.25,
    sunDiskMul: 0.02,
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
  // §6：分雨档间隔（替换 lightning.js 里的硬编码表）
  lightRainInterval: { min: 14, max: 26 },
  heavyRainInterval: { min: 6, max: 12 },
  // §6：雷声比闪光晚到（拟合现实）。闪光给情报，雷声给转移窗口。
  thunderDelay: { min: 1.8, max: 2.8 },
  // §6：雷声响度窗口内的追加听觉遮蔽与持续时间
  thunderMaskBoost: 0.3,
  thunderMaskCap: 0.85,
  thunderMaskTime: 3,
};

// §6：闪光能见度峰值封顶 120m = 敌兵视距上限，
// 避免"闪电照亮全场但敌人仍看不见你"的语义断裂。
var LIGHTNING_PEAK_CAP = 120;

// §7：夜晴直升机（E 项占位符填实）
var HELICOPTER_TUNING = {
  radius: 45,
  height: 28,
  speed: 6,
  // 14° 锥角：贴集装箱阴影能躲
  beamHalfAngle: (14 * Math.PI) / 180,
  beamRange: 40,
  exposeInterval: 0.25,
  maskRadius: 30,
};

// §5：白天晴天的太阳耀斑 / EMP 事件
var SOLAR_FLARE_TUNING = {
  enabled: true,
  // 触发条件：白天（dawn/noon/dusk）且 clear
  interval: { min: 25, max: 45 },
  // 时序（秒）：起升 0.5 → 峰值 2.0 → 回落 1.5，总窗口约 4s
  rise: 0.5,
  peak: 2,
  fall: 1.5,
  // 敌方机械 debuff
  enemySpeedMul: 0.5,
  enemyFireIntervalMul: 1.6,
  // 玩家 debuff
  playerSwayMul: 1.8,
  // HUD 暴露标记不可信（不显示新标记）
  suppressHudMarks: true,
};

// 直升机战斗状态机参数（与探照灯光柱参数分离）。
// 设计见 docs/直升机单位设计.md。数值为 v1 初值，待 M6 实机校准。
var HELI_COMBAT = {
  enabled: true,        // 是否开启战斗行为（探照灯之外）
  lockOnTime: 1.2,      // 光柱持续照住玩家满此时长才锁定
  telegraphTime: 0.9,   // 锁定→发射预警（地面红标 + 蜂鸣）
  missileCount: 2,      // 一轮齐射数量
  missileInterval: 0.35,// 两弹间隔
  missileSpeed: 26,     // 对地飞行速度 m/s
  spreadOffset: 1.5,    // 第二枚弹着点散布 ±m
  reEngageCooldown: 6,  // 齐射后再次锁敌冷却
  blastRadius: 5,       // 爆炸半径
  blastDamage: 30,      // 爆心基础伤害（玩家 50% 衰减在 combat.explode 内）
  alertSpeedMul: 0.6,   // 警觉/锁定时轨道速度倍率
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
    // 天气削弱直射光；阴影浓度与太阳盘可见度同步跟随，避免"阴雨仍有硬阴影/亮太阳"。
    sunIntensity: time.sunIntensity * w.sunMul,
    shadowIntensity: w.sunMul,
    sunDisk: time.sunDisk * w.sunDiskMul,
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
  LIGHTNING_PEAK_CAP,
  HELICOPTER_TUNING,
  HELI_COMBAT,
  SOLAR_FLARE_TUNING,
  combine,
};