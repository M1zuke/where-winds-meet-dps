import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-09-24.
export const hiddenSwordHeavy3 = defineSkill({
  id: SKILL.hiddenSwordHeavy3,
  classId: "silkbindJade",
  name: "Hidden Sword - Heavy Attack (Stage 3)",
  breakdownName: "Hidden Sword - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordHeavy3,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 72,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.304656,
      attributeMultiplier: 0.456984,
      physFixed: 84.4,
      attributeFixed: 46.0,
    }),
    hit(1, {
      frame: 48,
      physMultiplier: 0.456984,
      attributeMultiplier: 0.685476,
      physFixed: 126.6,
      attributeFixed: 69.0,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
