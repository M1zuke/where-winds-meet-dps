import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

// "Dragonquench - Inebriate requires Inner Way Eonpour to activate" (in-game
// skill text, 2026-09-04): a marker the fight opens with whenever Eonpour is
// slotted, absent otherwise, so the skill's hits can be gated on it.
export const EONPOUR_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.eonpourUnlock,
    name: "Dragonquench - Inebriate Unlock",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
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
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.eonpour,
    requiresMinTier: 6,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.eonpourLightAttackPoints,
    name: "Eonpour - Light Attack Binge Points",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.eonpour,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.eonpourCarousePoints,
    name: "Eonpour - Carouse Light Attack Points",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.eonpour,
    requiresMinTier: 4,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  }),
]
