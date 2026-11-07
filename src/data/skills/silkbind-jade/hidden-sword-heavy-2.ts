import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-09-24.
export const hiddenSwordHeavy2 = defineSkill({
  id: SKILL.hiddenSwordHeavy2,
  classId: "silkbindJade",
  name: "Hidden Sword - Heavy Attack (Stage 2)",
  breakdownName: "Hidden Sword - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordHeavy2,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 63,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 10,
      physMultiplier: 0.228492,
      attributeMultiplier: 0.342738,
      physFixed: 63.3,
      attributeFixed: 34.5,
    }),
    hit(1, {
      frame: 44,
      physMultiplier: 0.228492,
      attributeMultiplier: 0.342738,
      physFixed: 63.3,
      attributeFixed: 34.5,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
