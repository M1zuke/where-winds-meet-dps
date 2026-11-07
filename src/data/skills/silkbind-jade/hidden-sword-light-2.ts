import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

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
  receives: [BUFF.swallowcallLightAttackBoost, ...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 36,
  triggerable: true,
  reachMeters: 2.5,
  hits: [
    hit(0, {
      frame: 12,
      physMultiplier: 0.19041,
      attributeMultiplier: 0.285615,
      physFixed: 52.75,
      attributeFixed: 28.75,
    }),
    hit(1, {
      frame: 32,
      physMultiplier: 0.228492,
      attributeMultiplier: 0.342738,
      physFixed: 63.3,
      attributeFixed: 34.5,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
