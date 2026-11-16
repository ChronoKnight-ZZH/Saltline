// Weapon and ammunition definitions (M6).
// Pure data: no three.js, no context, no side effects.
// weapon.js 目前仍是模块级常量；M6.1 才会改成从本表读取。
// M6.0 只用其中的 pac9 一条（弹种 + 备弹上限），供补给系统计算补给量。
// 依据：docs/武器与弹药补给系统设计.docx 的武器表，落位 docs/weapon/M6.md §3.1。

var AMMO_CHANNELS = {
  pistol: { label: "9x19", color: "#c9b273" },
  smg: { label: ".45 ACP", color: "#b98a5c" },
  dmr: { label: "7.62x51", color: "#8fb3c8" },
  shell: { label: "12 Gauge", color: "#c96a4a" },
};

// reserveMax = 1.4 × reserveStart，取整到十位；补给点按这个上限封顶。
var WEAPONS = {
  pac9: {
    id: "pac9",
    name: "PAC-9",
    ammoType: "pistol",
    magSize: 30,
    reserveStart: 150,
    reserveMax: 210,
    damage: 26,
    rpm: 720,
    range: 300,
    falloff: { start: 100, min: 0.6 },
    reload: { tactical: 2.1, empty: 2.72 },
    fovAds: 52,
    spread: { hip: 0.0125, ads: 0.0012 },
    wetMul: 1,
  },
  ash12: {
    id: "ash12",
    name: "ASH-12",
    ammoType: "smg",
    magSize: 40,
    reserveStart: 160,
    reserveMax: 240,
    damage: 18,
    rpm: 950,
    range: 60,
    falloff: { start: 30, min: 0.5 },
    reload: { tactical: 1.8, empty: 2.3 },
    fovAds: 67,
    spread: { hip: 0.0148, ads: 0.0035 },
    wetMul: 1.5,
  },
  k14: {
    id: "k14",
    name: "K14",
    ammoType: "dmr",
    magSize: 10,
    reserveStart: 50,
    reserveMax: 70,
    damage: 85,
    rpm: 45,
    range: 400,
    falloff: { start: 150, min: 0.85 },
    reload: { tactical: 2.8, empty: 3.4 },
    fovAds: 30,
    spread: { hip: 0.03, ads: 0.0004 },
    adsSeconds: 0.4,
    wetMul: 0.5,
  },
  sbs8: {
    id: "sbs8",
    name: "SBS-8",
    ammoType: "shell",
    magSize: 6,
    reserveStart: 30,
    reserveMax: 42,
    damage: 12,
    pellets: 8,
    pelletCone: 0.055,
    rpm: 60,
    range: 25,
    falloff: { start: 8, min: 0.35 },
    reload: { tactical: 2.4, empty: 2.4 },
    fovAds: 58,
    spread: { hip: 0.035, ads: 0.012 },
    pumpSeconds: 0.5,
    wetMul: 0.7,
  },
};

var WEAPON_ORDER = ["pac9", "ash12", "k14", "sbs8"];

var DEFAULT_LOADOUT = "pac9";

export {
  AMMO_CHANNELS,
  WEAPONS,
  WEAPON_ORDER,
  DEFAULT_LOADOUT,
};
