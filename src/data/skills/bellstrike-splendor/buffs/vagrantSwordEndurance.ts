import type { MeterDrain, MeterFreeze } from "../../../../engine/skill"
import { meterDelta } from "../../../../definitions/skills/triggers"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-25: a 20 / s charge drain from 0.21 s,
// stopped after 1.2 s by Sword Morph (assumed slotted, the validated build's
// own inner way), with no regeneration from 0.2 s to the cast's own end.
export const VAGRANT_SWORD_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
]
export const VAGRANT_SWORD_FREEZE: MeterFreeze[] = [{ meterId: enduranceMeter.id, fromFrame: 12 }]

// A permanent counter recording what a Sword Morph conversion actually spent —
// `swordMorphEnduranceBoost` reads this instead of the live meter, which a
// same-frame read would race against this very trigger's own deduction.
export const SWORD_MORPH_CONVERTED_AMOUNT_STATUS = "swordMorphConvertedAmount"

// The Sword Morph conversion at a multi-wave release: spends up to 20 of the
// current Endurance.
export const SWORD_MORPH_ENDURANCE_SPEND = meterDelta({
  target: enduranceMeter.id,
  stacks: -20,
  meterSpendCapToCurrent: 20,
  recordSpendAsStatus: SWORD_MORPH_CONVERTED_AMOUNT_STATUS,
})
