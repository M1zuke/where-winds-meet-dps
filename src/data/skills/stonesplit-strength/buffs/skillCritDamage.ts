import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

export const stonesplitStrengthSkillCritDamage = defineClassBuff({
  id: BUFF.stonesplitStrengthSkillCritDamage,
  name: "Stonesplit Strength Skill Critical Damage",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  effects: [stat("critDamageBoost", 0.21)],
})
