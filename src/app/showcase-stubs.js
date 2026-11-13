import { Vector3 } from "../vendor/three-r180.js";
import { PLAYER_DIMENSIONS } from "../core/config.js";

function createShowcaseInput() {
  let i = () => {};
  return {
    move: {
      x: 0,
      y: 0,
    },
    look: {
      dx: 0,
      dy: 0,
    },
    fire: !1,
    ads: !1,
    sprint: !1,
    crouch: !1,
    locked: !1,
    touch: !1,
    sensitivity: 1,
    down: () => !1,
    pressed: () => !1,
    update: i,
    endFrame: i,
    requestLock: i,
    exitLock: i,
  };
}

function createShowcasePlayer(context) {
  return {
    pos: new Vector3(0, 0, 4),
    vel: new Vector3(),
    yaw: 0,
    pitch: 0,
    health: 100,
    maxHealth: 100,
    alive: !0,
    onGround: !0,
    sprinting: !1,
    crouching: !1,
    ads: 0,
    speed: 0,
    eye: new Vector3(0, PLAYER_DIMENSIONS.eye, 4),
    forward: new Vector3(0, 0, -1),
    enabled: !1,
    reset() {},
    damage() {},
    heal() {},
    addRecoil() {},
    addShake() {},
    update() {},
  };
}

export { createShowcaseInput, createShowcasePlayer };
