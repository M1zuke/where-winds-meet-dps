// Spring Sorrow (verbatim, 2026-08-19 in-game capture):
//
//   "Spring Sorrow
//    Cooldown: 15.0s
//    Charge briefly to fire a Petalwhirl forward, Immobilizing non-boss
//    enemies for 3s on hit and dealing bonus HP damage to boss enemies.
//    Repeatedly Immobilizing the same enemy reduces the Immobilized
//    duration with each application (3/2.4/1.9/1.5s).
//    Inner Way: Blossom Barrage Ninefold Umbrella's move, Spring Sorrow can
//    store up to 3 charges and can be cast 30% faster. Hitting an enemy with
//    this skill increases your Projectile Skill damage against them.
//    Hitting a target that satisfies the condition with Light Attack
//    Charged Skill deals increased damage and increases the max number of
//    targets hit. Hitting enemies consecutively reduces the skill's
//    cooldown and grants Blossoms."
//
//   Martial Art Skill
//   Projectile Damage (Hitting Non-Boss)
//     Physical Coefficient     149.03% (Max Level)
//     Physical Bonus             413 (Max Level)
//     Attribute Attack         223.54% (Max Level)
//     Coefficient Attr Atk Bonus 225 (Max Level)
//   Projectile Damage (Hitting Boss)
//     Physical Coefficient     233.97% (Max Level)
//     Physical Bonus             648 (Max Level)
//     Attribute Attack         350.95% (Max Level)
//     Coefficient Attr Atk Bonus 353 (Max Level)
//
// Non-boss multipliers used as the default (the calculator's training-dummy
// simulator treats the target as non-boss; the boss path needs a
// `target.isBoss` engine field to gate a HitVariant — see TODO below).
// Lingering Bone application kept (matches Forsaken Fame and the engine's
// `LINGERING_BONE_BUFF` behavior in `engine/behavior.ts`).
//
// TODO(immobilize-status): the "Immobilizing non-boss enemies for 3s on hit"
// clause has no engine surface today — no Immobilize status exists. The
// DR curve (3/2.4/1.9/1.5s on repeated applications) is captured verbatim
// for the next time the engine grows target-status support.
//
// TODO(boss-multiplier): the Projectile Damage (Hitting Boss) block
// (233.97% / 350.95% / 648 / 353) needs a HitVariant gated on
// `target.isBoss`. The engine has no `target.isBoss` field today; the
// existing training-dummy proxy (`!isTrainingDummy`) is too loose here
// because the simulator IS non-boss (so it correctly takes the non-boss
// path). A real `target.isBoss` primitive is needed for the boss branch.
//
// TODO(inner-way): the Blossom Barrage T1 inner-way buffs (3 charges max,
// 30% faster cast, +Projectile damage on hit, +charged-skill damage on
// condition, CD reduction + Blossom gain on consecutive hits) are NOT
// encoded at skill level — they live in the inner-way ladder in
// `src/data/innerWays/blossomBarrage.ts`. Confirm the inner-way tier
// mapping captures them all before relying on the rotation DPS.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { BUFF } from "../../skills/buffs/ids"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const springSorrow = defineSkill({
  id: SKILL.springSorrow,
  classId: "silkbindJade",
  name: "Spring Sorrow",
  abilityTag: "Spring Sorrow",
  tags: [PROP.isBallistic, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.springSorrow,
  castFrames: 60,
  triggerable: true,
  triggersBuffs: [BUFF.lingeringBone],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.4903,
      attributeMultiplier: 2.2354,
      physFixed: 413,
      attributeFixed: 225,
      triggers: [],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
