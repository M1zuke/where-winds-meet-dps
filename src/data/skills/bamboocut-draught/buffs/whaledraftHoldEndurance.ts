import type { MeterDrain } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { SKILL } from "../ids"

// In-game values as of 2026-09-29: a continuous 20/s drain, capped at 10 s
// (200 Endurance) by the hold's own timer, ending early if Endurance itself
// reaches 0 first (`res_empty_interrupt`) — no separate start cost. A build
// that cannot sustain the full 10 s falls back to the 4 s hold: the longest
// duration a full 80-Endurance bar can sustain from this same drain rate.
export const WHALEDRAFT_HOLD_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 20,
    fromFrame: 0,
    stopAfterSec: 10,
    chargeRelease: { fallbackSkillId: SKILL.whaledraftHoldShort },
  },
]

export const WHALEDRAFT_HOLD_SHORT_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 0, stopAfterSec: 4 },
]
