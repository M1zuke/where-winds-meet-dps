import { cooldownCut, meterDelta } from "../../../../definitions/skills/triggers"
import { DEBUFF } from "../ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

const LOCKOUT_GROUP = "bleedMechanismEnhancement"
const LOCKOUT_FRAMES = 180

// In-game values as of 2026-10-07: a direct hit of Inner Balance Strike III,
// Sword Martial QQQ, either Sword R Charge follow-up or Crosswind Blade gains
// +10 Endurance when the target already held 4 Bleeding stacks before that
// hit's own stack. One lockout is shared by all four skills; only the end of
// an Inner Balance Strike III releases it early.
export const BLEED_MECHANISM_ENHANCEMENT_GAIN = meterDelta({
  target: enduranceMeter.id,
  stacks: 10,
  condition: { buffId: DEBUFF.bleedTick, op: "gte", stacks: 4 },
  conditionsBeforeHit: true,
  cooldownFrames: LOCKOUT_FRAMES,
  cooldownGroup: LOCKOUT_GROUP,
})

export const BLEED_MECHANISM_ENHANCEMENT_RELEASE = cooldownCut({
  target: LOCKOUT_GROUP,
  stacks: LOCKOUT_FRAMES,
  appliesOnCastEnd: true,
})
