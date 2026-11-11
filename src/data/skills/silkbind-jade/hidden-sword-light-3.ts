import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const hiddenSwordLight3 = defineSkill({
  id: SKILL.hiddenSwordLight3,
  classId: "silkbindJade",
  name: "Hidden Sword - Light Attack (Stage 3)",
  breakdownName: "Hidden Sword - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.hiddenSwordLight3,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 41,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 8,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight2Hit1),
    }),
    hit(1, {
      frame: 20,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight3Hit1),
    }),
    hit(2, {
      frame: 34,
      ...levelScaled(LEVEL_ROWS.hiddenSwordLight3Hit1),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
