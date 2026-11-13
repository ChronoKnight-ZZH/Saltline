import { Mesh, PlaneGeometry, Vector3 } from "../vendor/three-r180.js";
import { DRONE_MODEL, pm } from "./models.js";

var WALKER_TUNING = {
  hp: 45,
  boltDamage: 7,
  boltSpeed: 70,
  burst: 3,
  burstGap: 0.12,
  telegraph: 0.55,
  cooldown: [1.9, 3.3],
  rangeMin: 12,
  rangeMax: 25,
  altMin: 4,
  altMax: 8,
  maxSpeed: 8,
  patrolSpeed: 3,
  accel: 11,
  spreadFar: 0.065,
  spreadNear: 0.018,
  fireRange: 42,
  explodeRadius: 3,
  explodeDamage: 30,
};

var Pn = WALKER_TUNING;

var $o = new Vector3();

var iz = new Vector3();

var Bs = new Vector3();

var Co = new Vector3();

var sz = new Vector3();

var ou = new Vector3();

var Hf = new Vector3(0, 1, 0);

var J_ = new Vector3(0, -1, 0);

var ym = [8, 4, 0.7];

var UC = [14, 1, 0.35];

var K_ = (i, e) => {
  let t = (i - e) % (Math.PI * 2);
  return (
    t > Math.PI ? (t -= Math.PI * 2) : t < -Math.PI && (t += Math.PI * 2),
    t
  );
};

var bl = (i, e, t) => (i < e ? e : i > t ? t : i);

function createWalker(i, e, t, n) {
  let s = i.G,
    o = i.rng,
    r = t.lensBase.clone(),
    a = pm(
      e,
      {
        shell: t.shell,
        metal: t.metal,
        glow: t.glow,
        lens: r,
        disc: t.disc,
        cone: t.cone,
      },
      {
        radius: 0.9,
        center: [0, 0, 0],
        extra: {
          def: e.extra,
          radius: 10,
        },
      },
    ),
    l = a.bones;
  ((a.group.rotation.order = "YXZ"), (a.group.visible = !1));
  let c = s.mats.label("G-" + String(n + 11), {
      color: "black",
      font: "stencil",
      distress: 0.35,
    }),
    u = 0.105,
    h = Math.min(0.045, u / (c.aspect || 3)),
    f = new PlaneGeometry(u, h);
  (f.rotateX(-Math.PI / 2), f.rotateY(Math.PI));
  let p = new Mesh(f, c.material);
  (p.position.set(0, 0.0985, -0.085),
    (p.castShadow = !1),
    (p.receiveShadow = !0),
    l.body.add(p));
  let d = {
    id: 0,
    type: "gull",
    pos: a.group.position,
    alive: !1,
    hp: Pn.hp,
    active: !1,
    rig: a,
    lens: r,
    vel: new Vector3(),
    yaw: 0,
    pitch: 0,
    roll: 0,
    home: new Vector3(),
    lastKnown: new Vector3(),
    sensor: new Vector3(),
    fwd: new Vector3(0, 0, 1),
    muzzle: new Vector3(),
    mode: "patrol",
    los: !1,
    seeT: 0,
    noSeeT: 0,
    senseT: 0,
    exposure: 0,
    modeT: 0,
    passive: !1,
    hasToken: !1,
    orbitA: 0,
    orbitDir: 1,
    orbitR: 16,
    alt: 6,
    hoverY: 0,
    phase: 0,
    ceil: 1e9,
    ceilT: 0,
    flipT: 0,
    avoid: new Vector3(),
    atk: "idle",
    atkT: 0,
    cool: 1,
    shots: 0,
    smokeT: 0,
    feeler: 0,
    strobeT: 0,
    flare: 0,
    lensC: [ym[0], ym[1], ym[2]],
    dieT: 0,
    spin: 0,
    lostRotor: 0,
    gy: 0,
    gp: 0,
    loop: null,
    sweep: 0,
    thr: 1,
    damage(y, b, m, A) {
      return d.alive
        ? ((d.hp -= y),
          s.events.emit("enemy:hit", {
            enemy: d,
            point: b,
            part: A || "body",
          }),
          m &&
            (d.vel.addScaledVector(m, Math.min(3, y * 0.09)),
            (d.roll += (o() - 0.5) * 0.5),
            (d.pitch += (o() - 0.5) * 0.4)),
          i.provoke(d),
          d.hp <= 0 ? (v(m), !0) : !1)
        : !1;
    },
    _activate(y, b = {}) {
      ((d.active = !0),
        (d.alive = !0),
        (d.hp = Pn.hp),
        (d.passive = !!b.passive),
        d.pos.copy(y),
        d.home.copy(y),
        d.vel.set(0, 0, 0),
        (d.yaw = b.yaw ?? o() * 6.283),
        (d.pitch = d.roll = 0),
        (d.mode = b.state === "alert" ? "investigate" : "patrol"),
        (d.modeT = 8),
        d.lastKnown.copy(b.target || (s.player ? s.player.pos : y)),
        (d.los = !1),
        (d.seeT = d.noSeeT = 0),
        (d.exposure = 0),
        (d.senseT = o() * 0.2),
        (d.hasToken = !1),
        (d.orbitDir = o() < 0.5 ? 1 : -1),
        (d.orbitR = Pn.rangeMin + 2 + o() * (Pn.rangeMax - Pn.rangeMin - 5)),
        (d.alt =
          b.hover ?? Pn.altMin + 0.8 + o() * (Pn.altMax - Pn.altMin - 1.6)),
        (d.hoverFixed = b.hover != null),
        (d.patrolR = b.patrolRadius ?? 4 + o() * 5),
        (d.phase = o() * 6.283),
        (d.orbitA = o() * 6.283),
        (d.ceil = 1e9),
        (d.flipT = 3 + o() * 4),
        (d.atk = "idle"),
        (d.cool = 1 + o() * 1.5),
        (d.dieT = 0),
        (d.spin = 0),
        (d.lostRotor = -1),
        (d.flare = 0),
        (d.thr = 1));
      for (let m = 0; m < 4; m++) l["rotor" + m].scale.setScalar(1);
      if (
        (l.lamp.scale.setScalar(1),
        l.body.rotation.set(0, 0, 0),
        (a.group.visible = !0),
        a.group.rotation.set(0, d.yaw, 0),
        s.audio && s.audio.loop && !d.loop)
      )
        try {
          d.loop = s.audio.loop("gull_rotor", {
            pos: d.pos,
            gain: 0.5,
          });
        } catch {
          d.loop = null;
        }
    },
    _deactivate() {
      if (
        ((d.active = !1),
        (d.alive = !1),
        (a.group.visible = !1),
        i.releaseToken(d),
        d.loop)
      ) {
        try {
          d.loop.stop();
        } catch {}
        d.loop = null;
      }
    },
    _raycast(y, b, m, A) {
      let E = y.x - d.pos.x,
        w = (y.y - d.pos.y + 0.03) * 2.3,
        S = y.z - d.pos.z,
        z = b.x,
        H = b.y * 2.3,
        O = b.z,
        q = z * z + H * H + O * O,
        U = E * z + w * H + S * O,
        T = E * E + w * w + S * S - 0.5 * 0.5,
        D = U * U - q * T;
      if (D < 0) return !1;
      let C = (-U - Math.sqrt(D)) / q;
      return C < 0 || C > m || C >= A.dist
        ? !1
        : ((A.dist = C),
          (A.part = "body"),
          (A.enemy = d),
          A.point.copy(y).addScaledVector(b, C),
          A.normal.copy(A.point).sub(d.pos),
          (A.normal.y *= 2.3),
          A.normal.normalize(),
          !0);
    },
    _update(y) {
      d.alive ? x(y) : g(y);
    },
  };
  function v(y) {
    ((d.alive = !1),
      i.releaseToken(d),
      (d.dieT = 0),
      (d.lostRotor = Math.floor(o() * 4)),
      l["rotor" + d.lostRotor].scale.setScalar(1e-4),
      $o
        .set(
          DRONE_MODEL.rotors[d.lostRotor][0],
          0.05,
          DRONE_MODEL.rotors[d.lostRotor][2],
        )
        .applyAxisAngle(Hf, d.yaw)
        .add(d.pos),
      s.fx.sparks($o, Hf, 14),
      s.fx.debris($o, {
        count: 3,
      }),
      s.fx.smoke($o, {
        size: 0.5,
        life: 1,
      }),
      (d.spin = (o() < 0.5 ? -1 : 1) * (5 + o() * 3)),
      (d.vel.y += 1.5),
      y && d.vel.addScaledVector(y, 2.5),
      l.lamp.scale.setScalar(1e-4),
      l.strobeG.scale.setScalar(1e-4),
      l.strobeR.scale.setScalar(1e-4),
      l.strobeW.scale.setScalar(1e-4),
      r.color.setRGB(0.3, 0.05, 0.02),
      s.events.emit("enemy:killed", {
        enemy: d,
        pos: d.pos,
        type: "gull",
      }));
  }
  function g(y) {
    ((d.dieT += y),
      (d.vel.y -= 9.5 * y),
      (d.vel.x *= 1 - 0.4 * y),
      (d.vel.z *= 1 - 0.4 * y),
      (d.spin += Math.sign(d.spin) * 7 * y),
      (d.yaw += d.spin * y),
      (d.roll += d.spin * 0.35 * y),
      (d.pitch += 0.9 * y));
    let b = d.vel.length(),
      m = b * y,
      A = d.dieT > 5 || d.pos.y < -3;
    if (!A && b > 0.01) {
      Bs.copy(d.vel).multiplyScalar(1 / b);
      let _ = s.physics.raycast(d.pos, Bs, m + 0.3);
      _ && (d.pos.copy(_.point).addScaledVector(_.normal, 0.2), (A = !0));
    }
    (A || d.pos.addScaledVector(d.vel, y),
      a.group.rotation.set(d.pitch, d.yaw, d.roll));
    for (let _ = 0; _ < 4; _++)
      _ !== d.lostRotor &&
        (l["rotor" + _].rotation.y +=
          (_ % 3 === 0 ? 1 : -1) * 30 * Math.max(0.2, 1 - d.dieT * 0.5) * y);
    ((d.smokeT -= y),
      d.smokeT <= 0 &&
        ((d.smokeT = 0.045),
        s.fx.smoke(d.pos, {
          size: 0.45,
          life: 1.3,
          color: 1381914,
          rise: 0.6,
        }),
        o() < 0.5 &&
          ($o.set(o() - 0.5, o(), o() - 0.5).normalize(),
          s.fx.sparks(d.pos, $o, 3))),
      d.loop &&
        (d.loop.setPos(d.pos),
        d.loop.setPitch(Math.max(0.4, 1.25 - d.dieT * 0.4)),
        d.loop.setGain(0.5)),
      A &&
        (s.fx.explosion(d.pos, 1.2),
        s.combat &&
          s.combat.explode &&
          s.combat.explode(d.pos, Pn.explodeRadius, Pn.explodeDamage, "enemy"),
        i.retire(d)));
  }
  function x(y) {
    let b = s.player,
      m = i.t;
    (d.fwd.set(Math.sin(d.yaw), 0, Math.cos(d.yaw)),
      d.sensor.set(0, -0.17, 0.27).applyAxisAngle(Hf, d.yaw).add(d.pos),
      i.think(d, y, 0.4));
    let A = d.mode === "engage",
      _ = d.hp < Pn.hp * 0.5,
      // §5：太阳耀斑期间机械造物移速被 EMP 拖慢
      flareSpeed = (s.environment && s.environment.perception && s.environment.perception.enemySpeedMul) || 1,
      M = Pn.patrolSpeed * flareSpeed,
      E,
      w,
      S;
    if (A && b) {
      M = Pn.maxSpeed * flareSpeed;
      let P = d.atk !== "idle";
      ((d.flipT -= y),
        d.flipT <= 0 &&
          ((d.flipT = 3 + o() * 5),
          o() < 0.6 && (d.orbitDir = -d.orbitDir),
          (d.orbitR = bl(
            d.orbitR + (o() - 0.5) * 6,
            Pn.rangeMin + 1,
            Pn.rangeMax - 2,
          ))),
        d.noSeeT > 1.5
          ? ((E = d.lastKnown.x),
            (S = d.lastKnown.z),
            (w = d.lastKnown.y + d.alt + 1),
            (d.orbitA = Math.atan2(
              d.pos.z - d.lastKnown.z,
              d.pos.x - d.lastKnown.x,
            )))
          : ((d.orbitA += ((d.orbitDir * (P ? 0.9 : 3.6)) / d.orbitR) * y),
            (E = b.pos.x + Math.cos(d.orbitA) * d.orbitR),
            (S = b.pos.z + Math.sin(d.orbitA) * d.orbitR),
            (w = b.pos.y + d.alt)));
    } else
      d.mode === "investigate" || d.mode === "search"
        ? ((M = 5.5 * flareSpeed),
          (d.orbitA += 0.5 * y),
          (E = d.lastKnown.x + Math.cos(d.orbitA) * 4.5),
          (S = d.lastKnown.z + Math.sin(d.orbitA) * 4.5),
          (w = d.lastKnown.y + Math.min(d.alt, 5.5)))
        : ((d.orbitA += 0.28 * y * d.orbitDir),
          (E = d.home.x + Math.cos(d.orbitA) * d.patrolR),
          (S = d.home.z + Math.sin(d.orbitA) * d.patrolR),
          (w = d.hoverFixed ? d.alt : d.home.y));
    (w > d.ceil && (w = d.ceil),
      !d.hoverFixed && w < 2.2 && (w = 2.2),
      Co.set(
        (E - d.pos.x) * 2.2 - d.vel.x * 2.4,
        (w - d.pos.y) * 5 - d.vel.y * 3.6,
        (S - d.pos.z) * 2.2 - d.vel.z * 2.4,
      ),
      (d.feeler = (d.feeler + 1) % 3));
    let z = Math.hypot(d.vel.x, d.vel.z);
    if (d.feeler === 0 && z > 0.6) {
      Bs.set(d.vel.x / z, 0, d.vel.z / z);
      let P = 2.2 + z * 0.5,
        V = s.physics.raycast(d.pos, Bs, P);
      if (V) {
        let Y = 1 - V.dist / P;
        (d.avoid.copy(V.normal).multiplyScalar(26 * Y),
          (d.avoid.y += 9 * Y),
          Y > 0.5 && ((d.orbitDir = -d.orbitDir), (d.flipT = 2.5)));
      }
    } else if (d.feeler === 1) {
      let P = s.physics.raycast(d.pos, J_, 2.4);
      P && !d.hoverFixed && (d.avoid.y += (2.4 - P.dist) * 10);
    } else if (d.feeler === 2 && ((d.ceilT -= y * 3), d.ceilT <= 0)) {
      d.ceilT = 0.35;
      let P = s.physics.raycast(d.pos, Hf, 4);
      d.ceil = P ? d.pos.y + P.dist - 1.3 : 1e9;
    }
    (Co.add(d.avoid),
      d.avoid.multiplyScalar(Math.exp(-6 * y)),
      _ &&
        ((Co.x += Math.sin(m * 7.3 + d.phase) * 5),
        (Co.z += Math.cos(m * 6.1 + d.phase) * 5),
        (Co.y += Math.sin(m * 9.7) * 3)));
    let H = Co.length();
    (H > Pn.accel && Co.multiplyScalar(Pn.accel / H),
      d.vel.addScaledVector(Co, y));
    let O = d.vel.length();
    O > M && (d.vel.multiplyScalar(M / O), (O = M));
    for (let P = 0; P < 3; P++) {
      let V = P === 0 ? d.vel.x : P === 1 ? d.vel.y : d.vel.z;
      if (Math.abs(V) < 0.02) continue;
      let Y = V > 0 ? 1 : -1,
        L = P === 1 ? 0.35 : 0.62;
      Bs.set(P === 0 ? Y : 0, P === 1 ? Y : 0, P === 2 ? Y : 0);
      let Z = s.physics.raycast(d.pos, Bs, Math.abs(V) * y + L);
      Z &&
        (d.vel.setComponent(P, -V * 0.25),
        d.avoid.setComponent(P, d.avoid.getComponent(P) - Y * 8),
        Z.dist < L &&
          d.pos.setComponent(P, d.pos.getComponent(P) - Y * (L - Z.dist)));
    }
    if ((d.pos.addScaledVector(d.vel, y), !d.hoverFixed)) {
      let P = s.physics.groundHeight(d.pos.x, d.pos.z, d.pos.y + 0.5) + 1.1;
      d.pos.y < P && ((d.pos.y = P), d.vel.y < 0 && (d.vel.y = 0));
    }
    let q = d.yaw;
    if ((A || d.mode === "search" || d.mode === "investigate") && b) {
      let P = A && d.noSeeT < 1.5 ? b.pos : d.lastKnown;
      q = Math.atan2(P.x - d.pos.x, P.z - d.pos.z);
    } else z > 0.4 && (q = Math.atan2(d.vel.x, d.vel.z));
    let U = K_(q, d.yaw);
    d.yaw += bl(U, -3.2 * y, 3.2 * y);
    let T = Math.cos(d.yaw),
      D = Math.sin(d.yaw),
      C = Co.x * D + Co.z * T,
      G = Co.x * T - Co.z * D,
      j = bl(C * 0.04, -0.42, 0.42),
      N = bl(-G * 0.04, -0.42, 0.42);
    _ &&
      ((j += Math.sin(m * 11 + d.phase) * 0.1),
      (N += Math.cos(m * 8.7 + d.phase * 2) * 0.13));
    let Q = 1 - Math.exp(-7 * y);
    ((d.pitch += (j - d.pitch) * Q),
      (d.roll += (N - d.roll) * Q),
      a.group.rotation.set(d.pitch, d.yaw, d.roll),
      (l.body.position.y =
        Math.sin(m * 2.1 + d.phase) * 0.045 +
        Math.sin(m * 3.7 + d.phase * 1.7) * 0.018),
      (d.thr += (1 + bl(Co.y * 0.03, -0.25, 0.4) + z * 0.02 - d.thr) * Q));
    let K = 41 * d.thr * y;
    ((l.rotor0.rotation.y += K),
      (l.rotor1.rotation.y -= K * 1.03),
      (l.rotor2.rotation.y -= K * 0.98),
      (l.rotor3.rotation.y += K * 1.01));
    let ie = (m * 0.9 + d.phase * 0.1) % 1,
      F = ie < 0.05 || (ie > 0.13 && ie < 0.18) ? 1 : 1e-4;
    if (
      (l.strobeR.scale.setScalar(F),
      l.strobeG.scale.setScalar(F),
      l.strobeW.scale.setScalar(ie > 0.5 && ie < 0.56 ? 1 : 1e-4),
      A && b)
    )
      ou.set(b.pos.x, b.pos.y + 1.1, b.pos.z);
    else if (d.mode !== "patrol")
      ((d.sweep += y),
        ou.set(
          d.lastKnown.x + Math.sin(d.sweep * 0.9) * 3,
          d.lastKnown.y,
          d.lastKnown.z + Math.cos(d.sweep * 0.7) * 3,
        ));
    else {
      d.sweep += y;
      let P = d.yaw + Math.sin(d.sweep * 0.5 + d.phase) * 0.9;
      ou.set(
        d.pos.x + Math.sin(P) * 5,
        d.pos.y - (d.hoverFixed ? 1.6 : 5),
        d.pos.z + Math.cos(P) * 5,
      );
    }
    $o.copy(ou).sub(d.sensor);
    let X = $o.x * T - $o.z * D,
      ne = $o.x * D + $o.z * T,
      re = $o.y,
      $ = Math.atan2(X, ne),
      ue = bl(Math.atan2(-re, Math.hypot(X, ne)), -0.5, 1.5),
      me = 1 - Math.exp(-9 * y);
    ((d.gy += K_($, d.gy) * me),
      (d.gp += (ue - d.gp) * me),
      (l.gimbalYaw.rotation.y = d.gy),
      (l.ball.rotation.x = d.gp - d.pitch),
      (l.gun.rotation.x = bl(d.gp, -0.2, 1.3) - d.pitch));
    let ee = A ? UC : ym,
      B = 1 + d.flare * 3.2 + (A ? 0 : Math.sin(m * 3 + d.phase) * 0.15);
    for (let P = 0; P < 3; P++)
      d.lensC[P] += (ee[P] - d.lensC[P]) * (1 - Math.exp(-8 * y));
    if (
      (r.color.setRGB(d.lensC[0] * B, d.lensC[1] * B, d.lensC[2] * B),
      (d.flare = Math.max(0, d.flare - y * 1.5)),
      d.muzzle.set(0, -0.12, 0.17).applyAxisAngle(Hf, d.yaw).add(d.pos),
      (d.cool -= y),
      d.atk === "idle")
    )
      A &&
        d.los &&
        d.cool <= 0 &&
        b &&
        b.alive &&
        Math.abs(U) < 0.35 &&
        d.pos.distanceTo(b.pos) < Pn.fireRange &&
        i.requestToken(d) &&
        ((d.atk = "tele"),
        (d.atkT = Pn.telegraph),
        s.events.emit("enemy:telegraph", {
          enemy: d,
          type: "gull",
          time: Pn.telegraph,
          pos: d.pos,
        }));
    else if (d.atk === "tele")
      ((d.atkT -= y),
        (d.flare = Math.min(1, d.flare + y * 4.5)),
        A
          ? d.atkT <= 0 &&
            ((d.atk = "burst"),
            (d.shots = Pn.burst),
            (d.atkT = 0),
            (d.lead = 0.2 + o() * 0.65))
          : ((d.atk = "idle"), i.releaseToken(d)));
    else if (d.atk === "burst" && ((d.atkT -= y), (d.flare = 1), d.atkT <= 0)) {
      if (((d.atkT = Pn.burstGap), d.shots--, b)) {
        let P = d.muzzle.distanceTo(b.pos),
          V = P / Pn.boltSpeed;
        (ou.set(
          b.pos.x + b.vel.x * V * d.lead,
          b.pos.y + 1.05,
          b.pos.z + b.vel.z * V * d.lead,
        ),
          Bs.copy(ou).sub(d.muzzle).normalize());
        let Y =
          (Pn.spreadFar + (Pn.spreadNear - Pn.spreadFar) * d.exposure) *
          (1 + i.playerSpeed * 0.45) *
          (_ ? 1.5 : 1);
        ((Bs.x += (o() - 0.5) * 2 * Y),
          (Bs.y += (o() - 0.5) * 2 * Y),
          (Bs.z += (o() - 0.5) * 2 * Y),
          Bs.normalize(),
          i.fireBolt(d.muzzle, Bs, d),
          s.fx.muzzleFlash(d.muzzle, Bs, {
            scale: 0.55,
          }),
          s.events.emit("enemy:fire", {
            enemy: d,
            pos: d.muzzle,
            dir: Bs,
            type: "gull",
          }),
          d.vel.addScaledVector(Bs, -0.35));
      }
      d.shots <= 0 &&
        ((d.atk = "idle"),
        // §5：耀斑期间开火间隔 ×1.6（攻击慢 60%）
        (d.cool =
          (Pn.cooldown[0] + o() * (Pn.cooldown[1] - Pn.cooldown[0])) *
          ((s.environment &&
            s.environment.perception &&
            s.environment.perception.enemyFireMul) ||
            1)),
        i.releaseToken(d));
    }
    (_ &&
      ((d.smokeT -= y),
      d.smokeT <= 0 &&
        ((d.smokeT = 0.16),
        s.fx.smoke(d.pos, {
          size: 0.3,
          life: 1.1,
          color: 2500652,
          rise: 0.8,
        }),
        o() < 0.15 && s.fx.sparks(d.pos, J_, 2))),
      d.loop &&
        (d.loop.setPos(d.pos),
        d.loop.setPitch(
          0.85 + d.thr * 0.2 + (_ ? Math.sin(m * 13) * 0.05 : 0),
        )));
  }
  return d;
}

export { WALKER_TUNING, createWalker };
