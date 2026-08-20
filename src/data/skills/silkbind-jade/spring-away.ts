// Spring Away (verbatim, 2026-08-19 in-game capture):
//
//   "Spring Away
//    After charging, soar straight up. Spin the umbrella to stay airborne
//    and continuously fire projectiles, dealing moderate damage. Hitting
//    targets quickly accumulates Blossoms. Hitting non-player units deals
//    an extra 25% damage.
//    In non-Arena modes, after every two projectiles, the next projectile
//    that hits a target will deal splash damage to other units within a
//    certain area (can splash to up to 3 targets per attack).
//    Inner Way: Blossom Barrage Ninefold Umbrella's move, Spring Sorrow can
//    store up to 3 charges and can be cast 30% faster. Hitting an enemy
//    with this skill increases your Projectile Skill damage against them.
//    Hitting a target that satisfies the condition with Light Attack
//    Charged Skill deals increased damage and increases the max number of
//    targets hit. Hitting enemies consecutively reduces the skill's
//    cooldown and grants Blossoms."
//
//   Charged Skill
//   Ballistic Damage Per Second
//     Physical Coefficient     171.75% (Max Level)
//     Physical Bonus             474 (Max Level)
//     Attribute Attack         257.62% (Max Level)
//     Coefficient Attr Atk Bonus 258 (Max Level)
//
// Per-second multipliers used as the default hit (the projectile stream is
// modeled as a single high-magnitude hit for the calculator — the
// "per-second" framing means the player gets ~one hit of this magnitude
// per second of channeling, not a frame-by-frame stream).
//
// TODO(per-projectile-hit-pattern): the "continuously fire projectiles"
// mechanic actually fires multiple projectiles per second — the
// per-second block represents the SUM of all projectiles in a second, not
// each individual projectile. Encoding each projectile individually would
// require N hits per second with the per-projectile values (171.75% / N,
// etc.). The engine has no `hitsPerSecond` skill field; flag for engine
// extension to model this precisely. The current single-hit encoding
// captures the total DPS contribution within rounding error.
//
// TODO(blossom-generation): "Hitting targets quickly accumulates Blossoms"
// needs a per-hit Blossom gain mechanic — no Blossom resource today
// (see engine-extension sweep in pending-tooltips.md).
//
// TODO(splash-damage): "after every two projectiles, the next projectile
// that hits a target will deal splash damage to other units within a
// certain area (can splash to up to 3 targets per attack)" needs a
// multi-target hit + area-effect model. Not encoded; the calculator is
// single-target (training-dummy) focused.
//
// TODO(non-player-bonus): the +25% non-player bonus has no engine surface
// (same gap as Forsaken Fame +45%). Captured for the next time the engine
// grows non-player-bonus effects.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const springAway = defineSkill({
  id: SKILL.springAway,
  classId: "silkbindJade",
  name: "Spring Away",
  abilityTag: "Spring Away",
  tags: [PROP.isBallistic, PROP.isCharged, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.springAway,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.7175,
      attributeMultiplier: 2.5762,
      physFixed: 474,
      attributeFixed: 258,
      triggers: [],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
