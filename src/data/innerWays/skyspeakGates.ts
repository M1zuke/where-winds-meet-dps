import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../skills/buffs/ids"

// "Hero's Blood - Inebriate requires Inner Way Skyspeak to activate" (in-game
// skill text, 2026-09-04): a marker the fight opens with whenever Skyspeak is
// slotted, absent otherwise, so the skill's hits can be gated on it. Three
// markers: the unlock, the tier-3 Deepdaze duration extension, and the
// tier-1 Deepdaze-end Binge Points refund (in-game inner-way text,
// 2026-09-06).
export const SKYSPEAK_GATES: readonly InnerWayGateBuff[] = [
  defineInnerWayGateBuff({
    id: BUFF.skyspeakUnlock,
    name: "Hero's Blood - Inebriate Unlock",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.skyspeak,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.skyspeakDeepdazeDuration,
    name: "Skyspeak - Deepdaze Duration",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.skyspeak,
    requiresMinTier: 3,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  }),
  defineInnerWayGateBuff({
    id: BUFF.skyspeakDeepdazeRefund,
    name: "Skyspeak - Deepdaze Refund",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    requiresParam: PARAM.skyspeak,
    defaultOpeningStacks: 1,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  }),
]
