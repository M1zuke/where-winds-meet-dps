import type { MeterCost, MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { SKILL } from "../ids"

// In-game values as of 2026-10-07: Second Track Slash's own hold, −14 / s
// from 12.6 f (rounded to 13) and −6 spent 30 f after the press, no
// regeneration for the whole hold. The drain stops at the 31 f minimum hold
// (0.3 s past its own start): every stage-1 hit count is chosen after that
// release, never by holding longer.
export const SECOND_TRACK_SLASH_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 14,
    fromFrame: 13,
    stopAfterSec: 0.3,
    chargeRelease: { fallbackSkillId: SKILL.swordChargeStage1Level0 },
  },
]
export const SECOND_TRACK_SLASH_STAGE_2_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 14,
    fromFrame: 13,
    stopAfterSec: 71 / 60,
    chargeRelease: { fallbackSkillId: SKILL.swordChargeStage15Hit },
  },
]
export const SECOND_TRACK_SLASH_FREEZE: MeterFreeze[] = [
  { meterId: enduranceMeter.id, fromFrame: 13 },
]
export const SECOND_TRACK_SLASH_COST: MeterCost = {
  meterId: enduranceMeter.id,
  amount: 6,
  atFrame: 30,
}
