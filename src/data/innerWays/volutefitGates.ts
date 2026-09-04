import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

export const SUBTLEFIT_DURATION_FRAMES = 300

// 5 s (client locale text, 2026-09-03); the Deepdaze-long form is not modelled.
export const VOLUTEFIT_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.subtlefit,
    name: "Subtlefit",
    scope: "player",
    activation: "triggered",
    durationFrames: SUBTLEFIT_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.volutefit,
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
  }),
]
