import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// The un-combo-linked heavy form (skill 20601207). In-game values as of
// 2026-09-24.
export const hiddenSwordHeavyAlt = defineSkill({
  id: SKILL.hiddenSwordHeavyAlt,
  classId: "silkbindJade",
  name: "Hidden Sword - Heavy Attack (Alt)",
  breakdownName: "Hidden Sword - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordHeavyAlt,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 35,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      // Hit frames with only a window (this class's own evidence): no
      // collider table row for this clip, only a bound window from clip
      // start to the clip's earliest next input — authored at that floor.
      frame: 0,
      physMultiplier: 0.913968,
      attributeMultiplier: 1.370952,
      physFixed: 253.2,
      attributeFixed: 138.0,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
