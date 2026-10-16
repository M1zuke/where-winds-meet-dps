import { applyBuff, meterDelta } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { BUFF, PARAM } from "../buffs/ids"
import {
  UNITS_PER_SECOND_OF_RECHARGE,
  peaksSpringlessSilenceChargesMeter,
} from "../../classes/silkbind-jade/chargeMeters"

const onEngine = (buffId: string, op: "gte" | "lte"): TriggerCondition => ({
  buffId,
  op,
  stacks: op === "gte" ? 1 : 0,
  source: "buffEngine",
})

// In-game values as of 2026-10-15: castable on a target that carries your
// Lingering Bone (or is airborne, which a training stake never is) once its
// cooldown has run out.
export const MOON_SHATTER_SPRING_CONDITIONS: TriggerCondition[] = [
  onEngine(BUFF.lingeringBone, "gte"),
  onEngine(BUFF.moonShatterSpringLockout, "lte"),
]

export const FIVE_HIT_MOON_SHATTER_SPRING_CONDITIONS: TriggerCondition[] = [
  ...MOON_SHATTER_SPRING_CONDITIONS,
  onEngine(BUFF.windrider, "gte"),
]

export const STARTLING_SPRING_STACK = applyBuff({ target: BUFF.pursuitChargedBoost })

// In-game values as of 2026-10-15: Gourd Toss rank 6 — inside the window a
// Peak's Springless Silence hit opens, each strike cuts 1 s off the Special's
// recharge.
export const PURSUIT_RECHARGE_CUT = meterDelta({
  target: peaksSpringlessSilenceChargesMeter.id,
  stacks: UNITS_PER_SECOND_OF_RECHARGE,
  conditions: [{ buffId: BUFF.gourdTossPursuitCutWindow, op: "gte", stacks: 1 }],
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 6,
})
