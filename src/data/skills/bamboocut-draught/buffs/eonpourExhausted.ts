import { applyBuff, applyDebuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../../engine/skill"
import { BUFF } from "../../buffs/ids"
import { DEBUFF, STATUS } from "../ids"
import { DEEPDAZE_MAX_EXTENDED_DURATION_FRAMES } from "../../../classes/bamboocut-draught/gates"
import { deepdazeEntryTriggers } from "./deepdazeEntry"

export const EONPOUR_EXHAUSTED = {
  conditions: [
    { buffId: BUFF.eonpourExhaustedPeakfall, op: "gte" as const, stacks: 1 },
    { buffId: STATUS.eonpourExhaustedCooldown, op: "eq" as const, stacks: 0 },
  ],
  phase: "exhausted" as const,
}

// With Eonpour at tier 6, hitting an Exhausted target with Peakfall or
// Castlink — read as the Qi-break window — inflicts Wildstride, Strayhunt
// and Drunkslay and extends a running Deepdaze by 6 s, or fills Binge Points
// to 200 and enters it through the threshold, once per 60 s shared by both
// skills. The extension may not leave Deepdaze running longer than 16 s. It
// runs before the fill so the threshold entry only fires outside Deepdaze, and
// the cooldown status is granted last so the same hit's other triggers still
// see it clear.
export const eonpourExhaustedTriggers: HitTrigger[] = [
  applyDebuff({ target: DEBUFF.wildstride, stacks: 1, ...EONPOUR_EXHAUSTED }),
  applyDebuff({ target: DEBUFF.strayhunt, stacks: 1, ...EONPOUR_EXHAUSTED }),
  applyDebuff({ target: DEBUFF.drunkslay, stacks: 1, ...EONPOUR_EXHAUSTED }),
  applyBuff({
    target: STATUS.inebriateDeepdaze,
    stacks: 1,
    extendFrames: 360,
    extendOnly: true,
    maxExtendedDurationFrames: DEEPDAZE_MAX_EXTENDED_DURATION_FRAMES,
    ...EONPOUR_EXHAUSTED,
  }),
  applyBuff({ target: STATUS.bingePoints, stacks: 200, ...EONPOUR_EXHAUSTED }),
  ...deepdazeEntryTriggers(EONPOUR_EXHAUSTED),
  applyBuff({ target: STATUS.eonpourExhaustedCooldown, stacks: 1, ...EONPOUR_EXHAUSTED }),
]
