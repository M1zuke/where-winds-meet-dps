import type { MeterCost, MeterDrain, ReleaseGate } from "../../../../engine/skill"
import { enduranceMeter } from "../../../resources/enduranceMeter"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../../classes/stonesplit-strength/bladeMomentumMeter"
import { PARAM } from "../../buffs/ids"
import { SKILL } from "../ids"

const FPS = 60
const ENDURANCE_DRAIN_PER_SECOND = 5
const IP_CHARGE_SPEED = 1.5

// In-game values as of 2026-10-15: the charge starts 19.32 f after the press
// (18 f hold detect, 0.6 f delay, 0.72 f into the charge timeline); its
// Endurance drain begins and Blade Momentum is read there. The stage
// thresholds are 57 f and 93 f of charge, divided by the charge speed.
const CHARGE_START_FRAME = 19.32
const STAGE_2_CHARGE_FRAMES = 57
const STAGE_3_CHARGE_FRAMES = 93

function releaseFrame(chargeFrames: number, speed: number): number {
  return CHARGE_START_FRAME + chargeFrames / speed
}

function enduranceDrain(
  chargeFrames: number,
  speed: number,
  fallbackSkillId: string,
): MeterDrain[] {
  return [
    {
      meterId: enduranceMeter.id,
      perSecond: ENDURANCE_DRAIN_PER_SECOND,
      fromFrame: CHARGE_START_FRAME,
      stopAfterSec: chargeFrames / speed / FPS,
      chargeRelease: { fallbackSkillId },
    },
  ]
}

function bladeMomentumSpend(chargeFrames: number, speed: number, amount: number): MeterCost {
  return {
    meterId: bladeMomentumMeter.id,
    amount,
    atFrame: releaseFrame(chargeFrames, speed),
  }
}

export const BURNING_HEART_STAGE_2_DRAIN = enduranceDrain(
  STAGE_2_CHARGE_FRAMES,
  1,
  SKILL.phalanxchargedS1,
)
export const BURNING_HEART_STAGE_3_DRAIN = enduranceDrain(
  STAGE_3_CHARGE_FRAMES,
  1,
  SKILL.phalanxchargedS2,
)
export const BURNING_HEART_INNER_PASSION_STAGE_2_DRAIN = enduranceDrain(
  STAGE_2_CHARGE_FRAMES,
  IP_CHARGE_SPEED,
  SKILL.phalanxchargedS1,
)
export const BURNING_HEART_INNER_PASSION_STAGE_3_DRAIN = enduranceDrain(
  STAGE_3_CHARGE_FRAMES,
  IP_CHARGE_SPEED,
  SKILL.phalanxchargedS2Innerpassion,
)

export const BURNING_HEART_STAGE_2_COST = bladeMomentumSpend(STAGE_2_CHARGE_FRAMES, 1, 50)
export const BURNING_HEART_STAGE_3_COST = bladeMomentumSpend(STAGE_3_CHARGE_FRAMES, 1, 50)
export const BURNING_HEART_INNER_PASSION_STAGE_2_COST: MeterCost = {
  ...bladeMomentumSpend(STAGE_2_CHARGE_FRAMES, IP_CHARGE_SPEED, 25),
  requiresParam: PARAM.steadfastDevotion,
  requiresMaxTier: 3,
}
export const BURNING_HEART_INNER_PASSION_STAGE_3_COST: MeterCost = {
  ...bladeMomentumSpend(STAGE_3_CHARGE_FRAMES, IP_CHARGE_SPEED, 25),
  requiresParam: PARAM.steadfastDevotion,
  requiresMaxTier: 3,
}

export const BURNING_HEART_BLADE_MOMENTUM_GATE: ReleaseGate[] = [
  {
    atFrame: CHARGE_START_FRAME,
    requires: [bladeMomentumRequires("gt", 50)],
    fallbackSkillId: SKILL.phalanxchargedS1,
  },
]
export const BURNING_HEART_INNER_PASSION_BLADE_MOMENTUM_GATE: ReleaseGate[] = [
  {
    atFrame: CHARGE_START_FRAME,
    requires: [
      { anyOf: [{ param: PARAM.steadfastDevotion, minTier: 4 }, bladeMomentumRequires("gt", 25)] },
    ],
    fallbackSkillId: SKILL.phalanxchargedS1,
  },
]
