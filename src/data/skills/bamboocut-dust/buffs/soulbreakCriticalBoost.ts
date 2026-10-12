import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { stat } from "../../../../engine/effects/effect"
import { BUFF } from "../../buffs/ids"
import { DEBUFF } from "../ids"

const CRIT_RATE_STEP = 0.04
const CRIT_DAMAGE_PER_STEP = 0.018
const CRIT_DAMAGE_CAP = 0.27

export function soulbreakCriticalBoostAt(whiteCritRate: number): number {
  return Math.min(
    CRIT_DAMAGE_CAP,
    Math.floor(whiteCritRate / CRIT_RATE_STEP) * CRIT_DAMAGE_PER_STEP,
  )
}

// Talent "Soulbreak Critical Boost", top rank (in-game values as of
// 2026-10-12): direct hits only, damage-over-time ticks excluded.
export const soulbreakCriticalBoost = defineClassBuff({
  id: BUFF.soulbreakCriticalBoost,
  name: "Soulbreak Critical Boost",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  reachesDotTicks: false,
  summary: "critDamageBoost +1.8% per full 4% white Critical Rate, cap 27%, against Soulbreak",
  effects: (ctx) =>
    ctx.status.isActive(DEBUFF.soulbreak)
      ? [stat("critDamageBoost", soulbreakCriticalBoostAt(ctx.build.whiteCritRate))]
      : [],
})
