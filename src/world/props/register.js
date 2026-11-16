// Registers original prop builders in their original override order. Imported once by the entry point.
import { registerProp } from "./registry.js";
import {
  buildBasicContainer,
  buildBollardPost,
  buildCatwalk,
  buildFencePanel,
  buildFloodlightStand,
  buildGateArm,
  buildGuardBooth,
  buildJerseyBarrier,
  buildLightMast,
  buildMetalStairs,
  buildMooringBollard,
  buildReeferUnit,
  buildRelayNode,
  buildShelfRack,
  buildSignPost,
} from "./basic-builders.js";
import { registerDetailedProps } from "./detailed-builders.js";
import { registerCharacterProps } from "./character-builders.js";
import { registerCargoProps } from "./cargo-builders.js";
import { buildSupplyCrate } from "./supply-builders.js";

for (let i of ["container20", "container40", "container40hc"])
  registerProp(i, (e, t) => buildBasicContainer(e, i, t));

registerProp("jersey_barrier", buildJerseyBarrier);

registerProp("light_mast", buildLightMast);

registerProp("fence_panel", buildFencePanel);

registerProp("guard_booth", buildGuardBooth);

registerProp("gate_arm", buildGateArm);

registerProp("bollard_mooring", buildMooringBollard);

registerProp("bollard_post", buildBollardPost);

registerProp("sign_post", buildSignPost);

registerProp("floodlight_stand", buildFloodlightStand);

registerProp("stairs_metal", buildMetalStairs);

registerProp("catwalk", buildCatwalk);

registerProp("shelf_rack", buildShelfRack);

registerProp("reefer_unit", buildReeferUnit);

registerProp("relay_node", buildRelayNode);

registerDetailedProps(registerProp);

registerCharacterProps(registerProp);

registerCargoProps(registerProp);

// M6.0：补给箱必须在 registerDetailedProps 之后注册，因为它内部调用 crate_wood。
registerProp("supply_crate", buildSupplyCrate);
