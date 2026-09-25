import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const CRIT_RATE_STEP = 0.04
const CRIT_DAMAGE_PER_STEP = 0.014
const CRIT_DAMAGE_CAP = 0.21

function criticalDamageBoost(whiteCritRate: number): number {
  return Math.min(
    CRIT_DAMAGE_CAP,
    Math.floor(whiteCritRate / CRIT_RATE_STEP) * CRIT_DAMAGE_PER_STEP,
  )
}

export const stonesplitStrengthSkillCritDamage = defineClassBuff({
  id: BUFF.stonesplitStrengthSkillCritDamage,
  name: "Stonesplit Strength Skill Critical Damage",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDamageBoost +1.4% per full 4% white Critical Rate, cap 21%",
  effects: (ctx) => [stat("critDamageBoost", criticalDamageBoost(ctx.build.whiteCritRate))],
})
