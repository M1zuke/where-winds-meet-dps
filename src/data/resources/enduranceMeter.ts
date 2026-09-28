import {
  defineMeter,
  meterStatusId,
  type MeterMaxContext,
} from "../../definitions/resources/meterDef"
import type { MeterCost, TriggerCondition, TriggerOp } from "../../engine/skill"

// The build param an Oddity board's "Max Endurance +5" nodes expose their
// learned total under (in-game values as of 2026-09-28: 8 nodes, +5 each,
// flat and additive, no cap).
export const ODDITY_MAX_ENDURANCE_PARAM = "oddityMaxEnduranceBonus"

// In-game values as of 2026-09-25: 80 base, 10 / s regeneration in combat,
// paused 1.2 s after every instant spend.
export const enduranceMeter = defineMeter({
  id: "endurance",
  name: "Endurance",
  capacity: (ctx: MeterMaxContext) => 80 + ctx.paramValue(ODDITY_MAX_ENDURANCE_PARAM),
  start: "full",
  regenPerSecond: 10,
  regenPauseAfterSpendSec: 1.2,
})

// Nameless Spear's own talent raises the cap by +10 x (1 + 0.1 x steps of 2%
// white Affinity Rate above 10%), capped at +20 from 30% on — 90 total below
// 12% (in-game values as of 2026-09-25).
function namelessSpearMaxBonus(whiteAffinityRate: number): number {
  const clamped = Math.min(Math.max(whiteAffinityRate, 0.1), 0.3)
  const steps = Math.floor((clamped - 0.1) / 0.02 + 1e-9)
  return 10 * (1 + 0.1 * steps)
}

export const enduranceMeterWithNamelessSpear = defineMeter({
  ...enduranceMeter,
  capacity: (ctx: MeterMaxContext) =>
    80 + namelessSpearMaxBonus(ctx.whiteAffinityRate) + ctx.paramValue(ODDITY_MAX_ENDURANCE_PARAM),
})

export function enduranceRequires(op: TriggerOp, stacks: number): TriggerCondition {
  return { buffId: meterStatusId(enduranceMeter.id), op, stacks }
}

export function enduranceCost(amount: number): MeterCost {
  return { meterId: enduranceMeter.id, amount }
}
