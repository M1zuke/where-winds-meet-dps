import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

// "Hero's Blood - Inebriate requires Inner Way Skyspeak to activate" (client
// locale text, 2026-09-04): a marker the fight opens with whenever Skyspeak is
// slotted, absent otherwise, so the skill's hits can be gated on it.
export const SKYSPEAK_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.skyspeakUnlock,
    name: "Hero's Blood - Inebriate Unlock",
    scope: "player",
    activation: "triggered",
    durationFrames: 36000,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.skyspeak,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
]
