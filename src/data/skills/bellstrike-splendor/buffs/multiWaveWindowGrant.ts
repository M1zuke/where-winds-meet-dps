import type { TriggerCondition } from "../../../../engine/skill"
import { IN_COMBAT_STATUS } from "../../../../engine/combatState"
import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"
import { MULTI_WAVE_WINDOW_DURATION_FRAMES } from "../../../classes/bellstrike-splendor/gates"

// In-game values as of 2026-10-06: the window opens at the cast's own start; the
// grant sits on a later hit, so its duration is the window less that hit's frame.
export const multiWaveWindowGrantFromCastStart = (hitFrame: number) =>
  applyBuff({
    target: BUFF.swordMorphMultiWaveWindow,
    durationFrames: MULTI_WAVE_WINDOW_DURATION_FRAMES - hitFrame,
    requiresParam: PARAM.swordMorph,
  })

// In-game values as of 2026-10-06: every three-wave release, whichever path
// made it three waves, re-opens the window at Sword Morph tier 4+.
export const multiWaveWindowReleaseGrantTrigger = applyBuff({
  target: BUFF.swordMorphMultiWaveWindow,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 4,
})

export const multiWaveWindowReleaseGrantLate = (lateFrames: number) =>
  applyBuff({
    target: BUFF.swordMorphMultiWaveWindow,
    durationFrames: MULTI_WAVE_WINDOW_DURATION_FRAMES - lateFrames,
    requiresParam: PARAM.swordMorph,
    requiresMinTier: 4,
  })

export const SWORD_MORPH_EQUIPPED: TriggerCondition = { param: PARAM.swordMorph }

// In-game values as of 2026-10-06: read once at the press — the window or the
// Qi Shield held, or the player not yet in combat.
export const THREE_WAVE_RELEASE_CONDITIONS: TriggerCondition[] = [
  SWORD_MORPH_EQUIPPED,
  {
    anyOf: [
      { buffId: BUFF.swordMorphMultiWaveWindow, op: "gte", stacks: 1 },
      { buffId: BUFF.qiShield, op: "gte", stacks: 1 },
      { buffId: IN_COMBAT_STATUS, op: "lt", stacks: 1 },
    ],
  },
]
