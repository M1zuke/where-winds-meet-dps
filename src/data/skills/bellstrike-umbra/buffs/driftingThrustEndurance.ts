import type { MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import { SKILL } from "../ids"

// In-game values as of 2026-09-24: Drifting Thrust's own hold, −20 / s from
// the 0.3 s tap/hold detect, no regeneration for the whole hold. Each
// stage's own drain stops at that stage's own earliest release — level 0 at
// 30 f, stage 1 at 90 f — and steps down to the stage actually reached if it
// cannot sustain that long.
export const DRIFTING_THRUST_LEVEL_0_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 18 },
]
export const DRIFTING_THRUST_STAGE_1_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 20,
    fromFrame: 18,
    stopAfterSec: 0.2,
    chargeRelease: { fallbackSkillId: SKILL.spearheavy1Hit },
  },
]
export const DRIFTING_THRUST_STAGE_2_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 20,
    fromFrame: 18,
    stopAfterSec: 1.2,
    chargeRelease: { fallbackSkillId: SKILL.spearheavyStage1 },
  },
]
export const DRIFTING_THRUST_FREEZE: MeterFreeze[] = [{ meterId: enduranceMeter.id, fromFrame: 0 }]
