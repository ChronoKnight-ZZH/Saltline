// World dimensions, lighting, player dimensions and quality presets.
import { Color, Vector3 } from "../vendor/three-r180.js";

var WORLD_BOUNDS = {
  min: new Vector3(-40, 0, -30),
  max: new Vector3(40, 30, 30),
  groundY: 0,
  seaY: -1.6,
  quayX: 30,
};

var SUN_LIGHT = {
  dir: new Vector3(0.916, 0.225, 0.331).normalize(),
  color: new Color(1, 0.72, 0.42),
  intensity: 9,
};

// `zenith` 必须与 sky.js shader 中 `clearC` 使用的颜色一致，
// 否则把硬编码 zenith 换成 `uZen` 时会产生视觉差异。
var SKY_COLORS = {
  zenith: new Color(0.085, 0.145, 0.24),
  horizon: new Color(0.95, 0.55, 0.28),
  horizonAway: new Color(0.16, 0.22, 0.3),
  fog: new Color(0.42, 0.47, 0.52),
};

var PLAYER_DIMENSIONS = {
  eye: 1.68,
  crouchEye: 1.05,
  radius: 0.32,
  height: 1.8,
  fov: 74,
  viewFov: 54,
};

var vf = 0;

var zc = 1;

// envBake              PMREM 重烘焙是否允许（low 跳过）
// envVolumetricBeam    光柱体积渲染是否允许（M3 使用；ultra/high 才开）
// envRainParticles     雨幕粒子预算（M5 使用；low 为全量的一半）
// envFlash             闪电全屏 flash 是否允许（M4 使用；low 关闭）
var QUALITY_PRESETS = {
  test: {
    name: "test",
    scale: 1,
    msaa: 0,
    shadow: 1024,
    tex: 256,
    volSteps: 10,
    ao: !0,
    planar: 0.5,
    bloom: !0,
    motionBlur: !1,
    rain: 0.4,
    envBake: !0,
    envVolumetricBeam: !1,
    envRainParticles: 1600,
    envFlash: !0,
  },
  low: {
    name: "low",
    scale: 0.7,
    msaa: 0,
    shadow: 2048,
    tex: 512,
    volSteps: 12,
    ao: !1,
    planar: 0,
    bloom: !0,
    motionBlur: !1,
    rain: 0.5,
    envBake: !1,
    envVolumetricBeam: !1,
    envRainParticles: 2000,
    envFlash: !1,
  },
  medium: {
    name: "medium",
    scale: 0.85,
    msaa: 2,
    shadow: 2048,
    tex: 1024,
    volSteps: 16,
    ao: !0,
    planar: 0.5,
    bloom: !0,
    motionBlur: !1,
    rain: 0.8,
    envBake: !0,
    envVolumetricBeam: !1,
    envRainParticles: 3000,
    envFlash: !0,
  },
  high: {
    name: "high",
    scale: 1,
    msaa: 4,
    shadow: 4096,
    tex: 1024,
    volSteps: 24,
    ao: !0,
    planar: 0.5,
    bloom: !0,
    motionBlur: !0,
    rain: 1,
    envBake: !0,
    envVolumetricBeam: !0,
    envRainParticles: 4000,
    envFlash: !0,
  },
  ultra: {
    name: "ultra",
    scale: 1,
    msaa: 4,
    shadow: 4096,
    tex: 2048,
    volSteps: 40,
    ao: !0,
    planar: 1,
    bloom: !0,
    motionBlur: !0,
    rain: 1,
    envBake: !0,
    envVolumetricBeam: !0,
    envRainParticles: 5000,
    envFlash: !0,
  },
};

export {
  SUN_LIGHT,
  PLAYER_DIMENSIONS,
  vf,
  zc,
  QUALITY_PRESETS,
  WORLD_BOUNDS,
  SKY_COLORS,
};