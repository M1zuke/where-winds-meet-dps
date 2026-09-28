import type { MeterCost, MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { SKILL } from "../ids"

// In-game values as of 2026-09-26: Second Track Slash's own hold, −14 / s
// from 0.2 s and −6 immediate, no regeneration for the whole hold. The
// immediate spend is authored at the cast's own start rather than its true
// 0.3 s mark — no hit lands exactly there to carry it. The drain stops at
// the 30 f minimum hold (0.3 s past its own start): every stage-1 hit count
// is chosen after that release, never by holding longer.
export const SECOND_TRACK_SLASH_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 14,
    fromFrame: 12,
    stopAfterSec: 0.3,
    chargeRelease: { fallbackSkillId: SKILL.swordChargeStage1Level0 },
  },
]
export const SECOND_TRACK_SLASH_FREEZE: MeterFreeze[] = [
  { meterId: enduranceMeter.id, fromFrame: 0 },
]
export const SECOND_TRACK_SLASH_COST: MeterCost = { meterId: enduranceMeter.id, amount: 6 }
