import { applyBuff } from "../../../../definitions/skills/triggers"
import { BUFF } from "../../buffs/ids"

// In-game values as of 2026-10-15: the window closes 167 f after the cast
// starts, so a grant at `grantFrame` lasts the 167 f less that frame.
export const shadowStepDashWindowGrantFromFrame = (grantFrame: number) =>
  applyBuff({ target: BUFF.shadowStepDashWindow, durationFrames: 167 - grantFrame })

export const shadowStepDashWindowConsume = applyBuff({
  target: BUFF.shadowStepDashWindow,
  stacks: -1,
})
