import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// The light attack available while Unfading Flower's umbrella floats (the
// basic attacks become the hidden sword's); the ground branch of stage 1,
// combo-linked into stage 2. The airborne-falling branch is not modelled —
// this engine has no airborne state to gate it on. In-game values as of
// 2026-09-24.
export const hiddenSwordLight1 = defineSkill({
  id: SKILL.hiddenSwordLight1,
  classId: "silkbindJade",
  name: "Hidden Sword - Light Attack (Stage 1)",
  breakdownName: "Hidden Sword - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordLight1,
  receives: [BUFF.swallowcallLightAttackBoost, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 31,
  triggerable: true,
  // In-game values as of 2026-09-28: 2.5 m approach reach.
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 21,
      physMultiplier: 0.19041,
      attributeMultiplier: 0.285615,
      physFixed: 52.75,
      attributeFixed: 28.75,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
