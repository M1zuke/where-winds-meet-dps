import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

// "Dragonquench - Inebriate requires Inner Way Eonpour to activate" (client
// locale text, 2026-09-04): a marker the fight opens with whenever Eonpour is
// slotted, absent otherwise, so the skill's hits can be gated on it.
export const EONPOUR_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.eonpourUnlock,
    name: "Dragonquench - Inebriate Unlock",
    scope: "player",
    activation: "triggered",
    durationFrames: 36000,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.eonpour,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.eonpourExhaustedPeakfall,
    name: "Eonpour - Exhausted Peakfall",
    scope: "player",
    activation: "triggered",
    durationFrames: 36000,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.eonpour,
    requiresMinTier: 6,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
]
