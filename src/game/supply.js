// Ammo resupply points (M6.0).
// 关卡提供 5 个补给点对象（level.supplySpots），本模块只做三件事：
//   1. nearest()：按 2m / 朝向 0.45 选最近的一个（与继电器交互口径一致）
//   2. usable()：判断能不能用（已用尽 / EMP 锁定）
//   3. use()：按口径给备弹，一次性用完变灰
// 补给量口径：当前武器 = 满备弹 × mul，同口径其余武器 = 满备弹 × 0.3；
// 上限取 definitions.js 的 reserveMax（weapon.addAmmo 本身无上限，钳制放在这里）。

import { DEFAULT_LOADOUT, WEAPONS } from "../weapons/definitions.js";

var SUPPLY_KINDS = {
  // mixed：四类口径各 50%（设计稿 S1）
  mixed: { types: ["pistol", "smg", "dmr", "shell"], mul: 0.5, label: "mixed" },
  // light：手枪 / 冲锋枪（S2）
  light: { types: ["pistol", "smg"], mul: 1, label: "light" },
  // heavy：精确射手 / 霰弹（S3）
  heavy: { types: ["dmr", "shell"], mul: 1, label: "heavy" },
  // shell：霰弹专属（S4）
  shell: { types: ["shell"], mul: 1, label: "shell" },
  // dmr：狙击弹专属（S5）
  dmr: { types: ["dmr"], mul: 1, label: "dmr" },
};

var RADIUS = 2,
  FACING = 0.45,
  VERTICAL = 2.5,
  OTHER_MUL = 0.3;

function createSupply(context) {
  let spots = ((context.level && context.level.supplySpots) || []).map((e) => ({
      id: e.id,
      kind: e.kind,
      label: e.label || e.id || "resupply",
      pos: e.pos,
      object: e.object || null,
      used: !!e.used,
    })),
    debug = { radius: RADIUS, facing: FACING };

  function weapons() {
    let e = context.weaponSystem;
    if (e && Array.isArray(e.list)) return e.list.filter(Boolean);
    return context.weapon ? [context.weapon] : [];
  }

  function active() {
    return (context.weaponSystem && context.weaponSystem.active) || context.weapon;
  }

  // 当前武器实例还没有 def 字段（M6.1 才有），此时按 pac9 的定义算上限。
  function defOf(e) {
    return (e && e.def) || WEAPONS[(e && e.id) || ""] || WEAPONS[DEFAULT_LOADOUT];
  }

  // 单武器阶段（M6.0）只有 PAC-9，若按口径放行则 S3/S4/S5 全空，
  // 所以此时一律按 mixed 处理；M6.1 起武器数 ≥2 后恢复按口径分计。
  function kindOf(e) {
    if (weapons().length < 2) return SUPPLY_KINDS.mixed;
    return SUPPLY_KINDS[e.kind] || SUPPLY_KINDS.mixed;
  }

  function nearest(pos, forward) {
    if (!pos) return null;
    let best = null,
      bestD = RADIUS;
    for (let e of spots) {
      if (e.used || !e.pos) continue;
      let t = e.pos.x - pos.x,
        n = e.pos.z - pos.z,
        s = Math.sqrt(t * t + n * n);
      if (s > bestD) continue;
      if (Math.abs((e.pos.y || 0) - (pos.y || 0)) > VERTICAL) continue;
      if (forward && s > 0.9) {
        let o = Math.sqrt(forward.x * forward.x + forward.z * forward.z) || 1,
          r = (t * forward.x + n * forward.z) / (s * o);
        if (r < FACING) continue;
      }
      ((best = e), (bestD = s));
    }
    return best;
  }

  function usable(e) {
    if (!e || e.used) return "used";
    if (context.solarflare && +context.solarflare.effect > 0) return "emp";
    return null;
  }

  // 返回 null 表示补给成功；否则返回失败原因。
  function use(e) {
    let why = usable(e);
    if (why) return why;
    let kind = kindOf(e),
      act = active(),
      list = weapons(),
      matched = 0,
      filled = 0;
    for (let t of list) {
      let n = defOf(t);
      if (!n || kind.types.indexOf(n.ammoType) < 0) continue;
      matched++;
      let s = t === act ? kind.mul : OTHER_MUL,
        o = Math.ceil(n.reserveMax * s),
        r = +t.reserve || 0,
        i = Math.min(n.reserveMax, r + o);
      i > r &&
        (typeof t.addAmmo == "function"
          ? t.addAmmo(i - r)
          : (t.reserve = i),
        (filled += i - r));
    }
    if (!matched) return "channel";
    if (!filled) return "full";
    e.used = true;
    try {
      e.object && e.object.userData.setState && e.object.userData.setState("used");
    } catch (t) {
      console.error("[supply] setState threw", t);
    }
    try {
      context.events.emit("supply:used", {
        id: e.id,
        kind: e.kind,
        amount: filled,
      });
    } catch {}
    return null;
  }

  function reset() {
    for (let e of spots) {
      e.used = false;
      try {
        e.object && e.object.userData.setState && e.object.userData.setState("live");
      } catch {}
    }
  }

  function remaining() {
    let e = 0;
    for (let t of spots) t.used || e++;
    return e;
  }

  return {
    spots,
    kinds: SUPPLY_KINDS,
    nearest,
    usable,
    use,
    reset,
    remaining,
    debug,
  };
}

export { createSupply, SUPPLY_KINDS };
