import type { HitTrigger } from "../../../../engine/skill"
import { meterDelta } from "../../../../definitions/skills/triggers"
import { DEBUFF } from "../ids"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-26: +10 Endurance on an Inner Balance Strike
// III / Crisscross follow-up hit against a target holding at least 4 stacks
// of Bleeding, once per cast — approximated by scoping the cooldown to one
// named group per real skill (shared only across that skill's own cancel
// forms), so a repeated hit within the same cast cannot double-grant it while
// an unrelated skill's own cast is never blocked by it. Named explicitly
// rather than left to the trigger object's own identity, so a stored copy
// (one JSON object per hit, identity lost on serialization) still shares one
// clock the same way the live built-in's single shared object does.
function bleedMechanismEnhancementGain(cooldownGroup: string): HitTrigger {
  return meterDelta({
    target: enduranceMeter.id,
    stacks: 10,
    condition: { buffId: DEBUFF.bleedTick, op: "gte", stacks: 4 },
    cooldownFrames: 120,
    cooldownGroup,
  })
}

export const INNER_BALANCE_STRIKE_III_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-innerBalanceStrikeIII",
)
export const SWORD_MARTIAL_QQQ_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-swordMartialQqq",
)
export const SWORD_R_CHARGE_FOLLOW_UP_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-swordRChargeFollowUp",
)
export const CROSSWIND_BLADE_BLEED_REFUND = bleedMechanismEnhancementGain(
  "bleedMechanismEnhancement-crosswindBlade",
)
