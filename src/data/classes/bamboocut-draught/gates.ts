import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF } from "../../skills/buffs/ids"
import { STATUS } from "../../skills/bamboocut-draught/ids"

const CLASS_ID = "bamboocutDraught"

export const BINGE_MARKS_DURATION_FRAMES = 600
export const INEBRIATE_DEEPDAZE_DURATION_FRAMES = 300
export const SKYSPEAK_DEEPDAZE_EXTENSION_FRAMES = 300
export const CAROUSE_DURATION_FRAMES = 1200
export const CLASH_TOAST_DURATION_FRAMES = 900
export const EONPOUR_EXHAUSTED_COOLDOWN_FRAMES = 3600

// In-game state text, 2026-09-06: Binge Points start at 60 and cap at 200;
// Tipsy from 100, Deepdaze at 200 for 5 s, 10 s with Skyspeak tier 3. When
// Deepdaze lapses the counter is cleared, to 60 with Skyspeak slotted at all
// (rank 1). Binge Marks hold 50 for 10 s. Carouse lasts 20 s at the talent's
// top rank. Clash-toast lasts 15 s at ultimate rank 5. Cloudvault holds 2
// stacks until Hero's Blood - Inebriate consumes them.
export const BAMBOOCUT_DRAUGHT_GATES: readonly Buff[] = [
  defineGateBuff({
    id: STATUS.bingePoints,
    classId: CLASS_ID,
    name: "Binge Points",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 200,
    stackScaling: "flat",
    defaultOpeningStacks: 60,
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.bingeMarks,
    classId: CLASS_ID,
    name: "Binge Marks",
    description: "The next drink converts every mark into one Binge Point.",
    scope: "player",
    activation: "triggered",
    durationFrames: BINGE_MARKS_DURATION_FRAMES,
    effects: [],
    maxStacks: 50,
    stackScaling: "flat",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.inebriateDeepdaze,
    classId: CLASS_ID,
    name: "Inebriate - Deepdaze",
    scope: "player",
    activation: "triggered",
    durationFrames: INEBRIATE_DEEPDAZE_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    onExpire: {
      targetId: STATUS.bingePoints,
      stacks: 60,
      requiresBuffId: BUFF.skyspeakDeepdazeRefund,
    },
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.eonpourExhaustedCooldown,
    classId: CLASS_ID,
    name: "Eonpour - Exhausted Cooldown",
    description: "While running, the Eonpour Exhausted-target payout cannot fire again.",
    scope: "player",
    activation: "triggered",
    durationFrames: EONPOUR_EXHAUSTED_COOLDOWN_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-06T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.carouse,
    classId: CLASS_ID,
    name: "Carouse",
    description:
      "Whaledraft grants 50 Binge Points instead of 25, a light attack 5 Binge Marks instead of 2, and a Perfect Dodge restores 5 Binge Points once per second.",
    scope: "player",
    activation: "triggered",
    durationFrames: CAROUSE_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.clashToast,
    classId: CLASS_ID,
    name: "Inebriate - Clash-toast",
    scope: "player",
    activation: "triggered",
    durationFrames: CLASH_TOAST_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.cloudvault,
    classId: CLASS_ID,
    name: "Cloudvault",
    description:
      "At 2 stacks, Hero's Blood - Inebriate deals 10% more damage against non-player targets and consumes both stacks.",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: 2,
    stackScaling: "flat",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
]
