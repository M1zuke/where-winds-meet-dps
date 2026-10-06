import { applyBuff, cooldownCut, meterDelta } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"
import { ENERGY_SURGE_GRANT_DURATION_FRAMES } from "../../../classes/bellstrike-splendor/gates"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-10-06: 20 s after a grant, shortened 1 s per
// sword-energy bullet that hits while it cools, floor 12 s. Sword Morph tier 6
// only.
export const energySurgeReleaseGrantLate = (lateFrames: number) =>
  applyBuff({
    target: BUFF.energySurgeGrant,
    durationFrames: ENERGY_SURGE_GRANT_DURATION_FRAMES - lateFrames,
    cooldownFrames: 1200,
    cooldownFloorFrames: 720,
    cooldownGroup: BUFF.energySurgeGrant,
    requiresParam: PARAM.swordMorph,
    requiresMinTier: 6,
  })

export const energySurgeReleaseTrigger = energySurgeReleaseGrantLate(0)

export const energySurgeCooldownCut = cooldownCut({
  target: BUFF.energySurgeGrant,
  stacks: 60,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 6,
})

export const energySurgeConsumeTrigger = applyBuff({
  target: BUFF.energySurgeGrant,
  stacks: -1,
})

// In-game values as of 2026-10-06: +20 Endurance the moment Energy Surge is
// granted; it joins the grant's cooldown group and so fires only with it.
export const energySurgeEnduranceGain = meterDelta({
  target: enduranceMeter.id,
  stacks: 20,
  cooldownFrames: 1200,
  cooldownFloorFrames: 720,
  cooldownGroup: BUFF.energySurgeGrant,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 6,
})
