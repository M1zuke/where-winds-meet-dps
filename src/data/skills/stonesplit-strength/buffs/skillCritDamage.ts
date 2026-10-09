import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { meterStatusId } from "../../../../definitions/resources/meterDef"
import { bladeMomentumMeter } from "../../../classes/stonesplit-strength/bladeMomentumMeter"

const CRIT_RATE_STEP = 0.04
const CRIT_DAMAGE_PER_STEP = 0.014
const CRIT_DAMAGE_CAP = 0.21
const BLADE_MOMENTUM_GATE = 25

function criticalDamageBoost(whiteCritRate: number): number {
  return Math.min(
    CRIT_DAMAGE_CAP,
    Math.floor(whiteCritRate / CRIT_RATE_STEP) * CRIT_DAMAGE_PER_STEP,
  )
}

// In-game values as of 2026-09-25: only while Blade Momentum holds at least
// one bar (25).
export const stonesplitStrengthSkillCritDamage = defineClassBuff({
  id: BUFF.stonesplitStrengthSkillCritDamage,
  name: "Stonesplit Strength Skill Critical Damage",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDamageBoost +1.4% per full 4% white Critical Rate, cap 21%, Blade Momentum >= 25",
  effects: (ctx) =>
    ctx.status.stacks(meterStatusId(bladeMomentumMeter.id)) >= BLADE_MOMENTUM_GATE
      ? [stat("critDamageBoost", criticalDamageBoost(ctx.build.whiteCritRate))]
      : [],
})
