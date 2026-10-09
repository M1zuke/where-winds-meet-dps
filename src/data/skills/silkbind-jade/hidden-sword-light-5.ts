import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// The un-combo-linked light form (skill 20601205): its own 0.7 s cooldown
// replaces the combo chain's own re-entry. In-game values as of 2026-09-24.
export const hiddenSwordLight5 = defineSkill({
  id: SKILL.hiddenSwordLight5,
  classId: "silkbindJade",
  name: "Hidden Sword - Light Attack (Alt)",
  breakdownName: "Hidden Sword - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordLight5,
  receives: [BUFF.swallowcallLightAttackBoost, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 52,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 23,
      physMultiplier: 0.685476,
      attributeMultiplier: 1.028214,
      physFixed: 189.9,
      attributeFixed: 103.5,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
