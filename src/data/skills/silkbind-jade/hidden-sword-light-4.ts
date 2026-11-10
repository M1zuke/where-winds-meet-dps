import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-09-24.
export const hiddenSwordLight4 = defineSkill({
  id: SKILL.hiddenSwordLight4,
  classId: "silkbindJade",
  name: "Hidden Sword - Light Attack (Stage 4)",
  breakdownName: "Hidden Sword - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordLight4,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 33,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 13,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight4Hit0),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
