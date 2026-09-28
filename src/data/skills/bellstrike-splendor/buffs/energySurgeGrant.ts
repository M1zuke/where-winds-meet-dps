import { applyBuff, meterDelta } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"
import { ENERGY_SURGE_GRANT_DURATION_FRAMES } from "../../../classes/bellstrike-splendor/gates"
import { enduranceMeter } from "../../../resources/enduranceMeter"

// In-game values as of 2026-09-24: 20 s after a grant, shrinking 1 s per
// release attempted since, floor 12 s. Sword Morph tier 6 only.
export const energySurgeReleaseTrigger = applyBuff({
  target: BUFF.energySurgeGrant,
  durationFrames: ENERGY_SURGE_GRANT_DURATION_FRAMES,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: BUFF.energySurgeGrant,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 6,
})

export const energySurgeConsumeTrigger = applyBuff({
  target: BUFF.energySurgeGrant,
  stacks: -1,
})

// In-game values as of 2026-09-26: +20 Endurance the same moment Energy
// Surge itself is granted — the same cooldown clock as the grant above, so
// the two always fire together.
export const energySurgeEnduranceGain = meterDelta({
  target: enduranceMeter.id,
  stacks: 20,
  cooldownFrames: 1200,
  cooldownDecayFramesPerAttempt: 60,
  cooldownFloorFrames: 720,
  cooldownGroup: BUFF.energySurgeGrant,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 6,
})
