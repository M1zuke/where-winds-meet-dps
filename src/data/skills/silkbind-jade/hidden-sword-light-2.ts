import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-09-24.
export const hiddenSwordLight2 = defineSkill({
  id: SKILL.hiddenSwordLight2,
  classId: "silkbindJade",
  name: "Hidden Sword - Light Attack (Stage 2)",
  breakdownName: "Hidden Sword - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordLight2,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 36,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 12,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight1Hit0),
    }),
    hit(1, {
      frame: 32,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight2Hit1),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
