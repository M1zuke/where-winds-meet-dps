import type { MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-26: Drifting Thrust's own hold, −20 / s from
// 0.2 s to 1.2 s, no regeneration for the whole hold.
export const DRIFTING_THRUST_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 12, stopAfterSec: 1 },
]
export const DRIFTING_THRUST_FREEZE: MeterFreeze[] = [{ meterId: enduranceMeter.id, fromFrame: 0 }]
