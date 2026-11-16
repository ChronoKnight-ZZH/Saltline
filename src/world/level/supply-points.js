// Ammo resupply point coordinates (M6.0).
// 坐标来自 docs/武器与弹药补给系统设计.docx 的 5 个补给点，
// 其中 S3/S4 与实测地图冲突（原 S3 在 quay 边界 x=30 的登船梯上、S4 落在 20ft reefer 箱内），
// 这里已按实测道具位置改为可走地带的落点；level.js 仍会再做一次吸附兜底。
// x/z 为世界米，yaw 为弧度，kind 见 src/game/supply.js 的 SUPPLY_KINDS。

var SUPPLY_POINTS = [
  // S1 · yard：两条箱排之间（集装箱占 z∈[0.86,3.3] 与 [-6.34,-3.9]），z=0 为空地。
  { id: "S1", x: 0, z: 0, yaw: 0.42, kind: "mixed", seed: 11, label: "Ammo S1" },
  // S2 · gate：原 (-30,-20) 与 20ft 箱（z 约 [-19.7,-17.1]）贴边，向南让开 1.6m。
  { id: "S2", x: -30.5, z: -21.6, yaw: -1.1, kind: "light", seed: 22, label: "Ammo S2" },
  // S3 · quay：原 (30,20) 在 x=quayX 的海边界上、正压登船梯（LADDER_Z=20），移到码头内侧。
  { id: "S3", x: 27.2, z: 19.6, yaw: 2.35, kind: "heavy", seed: 33, label: "Ammo S3" },
  // S4 · quay 南段：原 (20,-25) 落在 20ft reefer 箱内（x∈[19.97,26.03], z∈[-27.17,-24.73]），北移。
  { id: "S4", x: 18.6, z: -20, yaw: 1.05, kind: "shell", seed: 44, label: "Ammo S4" },
  // S5 · yard 北侧：原 (-25,25) 与 40ft 箱（x∈[-37.3,-25.1]）贴边，向东让开。
  { id: "S5", x: -23.5, z: 27, yaw: -2.05, kind: "dmr", seed: 55, label: "Ammo S5" },
];

export { SUPPLY_POINTS };
