import type { MeterCost, MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-26: Second Track Slash's own hold, −14 / s
// from 0.2 s and −6 immediate, no regeneration for the whole hold. The
// immediate spend is authored at the cast's own start rather than its true
// 0.3 s mark — no hit lands exactly there to carry it.
export const SECOND_TRACK_SLASH_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 14, fromFrame: 12 },
]
export const SECOND_TRACK_SLASH_FREEZE: MeterFreeze[] = [
  { meterId: enduranceMeter.id, fromFrame: 0 },
]
export const SECOND_TRACK_SLASH_COST: MeterCost = { meterId: enduranceMeter.id, amount: 6 }
