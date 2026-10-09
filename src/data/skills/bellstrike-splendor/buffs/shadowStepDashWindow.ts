import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF } from "../../buffs/ids"

// In-game values as of 2026-10-06: the window opens at the bolt launch (17 f)
// and closes 167 f after the cast starts; the grant sits on the hit, so its
// duration is the 167 f less the hit's own frame.
export const shadowStepDashWindowGrantFromFrame = (hitFrame: number) =>
  applyBuff({ target: BUFF.shadowStepDashWindow, durationFrames: 167 - hitFrame })

export const shadowStepDashWindowConsume = applyBuff({
  target: BUFF.shadowStepDashWindow,
  stacks: -1,
})
