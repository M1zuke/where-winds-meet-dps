import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

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
  receives: [BUFF.thunderousBloom, BUFF.springThunder, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 72,
  triggerable: true,
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 14,
      ...levelScaled(LEVEL_ROWS.umblightchargeLiftHit0),
    }),
    hit(1, {
      frame: 48,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight4Hit0),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
