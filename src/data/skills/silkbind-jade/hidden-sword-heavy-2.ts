import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

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
  receives: [BUFF.thunderousBloom, BUFF.springThunder, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 63,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 10,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight2Hit1),
    }),
    hit(1, {
      frame: 44,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight2Hit1),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
