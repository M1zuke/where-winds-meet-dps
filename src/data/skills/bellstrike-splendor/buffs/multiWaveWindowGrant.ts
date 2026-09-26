import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF, PARAM } from "../../buffs/ids"

// In-game values as of 2026-09-26: cast out of combat, the window opens
// unconditionally at any Sword Morph rank.
export const multiWaveWindowBootstrapTrigger = applyBuff({
  target: BUFF.swordMorphMultiWaveWindow,
  requiresParam: PARAM.swordMorph,
})

// In-game values as of 2026-09-26: the multi-wave event fires on every
// three-wave release, and Sword Morph tier 4+ re-opens the window on that
// event alone — Energy Surge and the pre-pull form always release three
// waves, so this grant never checks the window's own state.
export const multiWaveWindowReleaseGrantTrigger = applyBuff({
  target: BUFF.swordMorphMultiWaveWindow,
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 4,
})

// In-game values as of 2026-09-26: the charged release itself only fires
// three waves while the window already holds, so its own re-grant has to
// recheck that same condition to tell a genuine three-wave release apart
// from the single-bolt one sharing this hit.
export const multiWaveWindowSustainTrigger = applyBuff({
  target: BUFF.swordMorphMultiWaveWindow,
  condition: { buffId: BUFF.swordMorphMultiWaveWindow, op: "gte", stacks: 1 },
  requiresParam: PARAM.swordMorph,
  requiresMinTier: 4,
})
