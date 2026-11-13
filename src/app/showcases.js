import { rendererShowcaseModule } from "../render/renderer.js";
import { materialsShowcaseModule } from "../render/materials/materials.js";
import { propsShowcaseModule } from "../world/props/props.js";
import { levelShowcaseModule } from "../world/level/level.js";
import { backdropShowcaseModule } from "../world/backdrop/backdrop.js";
import { groundShowcaseModule } from "../world/ground/ground.js";
import { effectsShowcaseModule } from "../effects/effects.js";
import { weaponShowcaseModule } from "../weapons/weapon.js";
import { enemiesShowcaseModule } from "../enemies/enemies.js";
import { environmentShowcaseModule } from "../core/environment.js";

var SHOWCASE_MODULES = {
  mats: materialsShowcaseModule,
  level: levelShowcaseModule,
  backdrop: backdropShowcaseModule,
  ground: groundShowcaseModule,
  fx: effectsShowcaseModule,
  weapon: weaponShowcaseModule,
  enemies: enemiesShowcaseModule,
  props: propsShowcaseModule,
  render: rendererShowcaseModule,
  // M5：时间/天气/直升机/闪电切换展示
  environment: environmentShowcaseModule,
};

export { SHOWCASE_MODULES };
