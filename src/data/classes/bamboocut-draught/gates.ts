import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { STATUS } from "../../skills/bamboocut-draught/ids"

const CLASS_ID = "bamboocutDraught"

export const BINGE_POINTS_DURATION_FRAMES = 36000
export const BINGE_MARKS_DURATION_FRAMES = 600
export const INEBRIATE_DEEPDAZE_DURATION_FRAMES = 600
export const CAROUSE_DURATION_FRAMES = 1200
export const CLASH_TOAST_DURATION_FRAMES = 900
export const CLOUDVAULT_DURATION_FRAMES = 36000
export const DRAUGHT_DURATION_FRAMES = 36000
export const DRAUGHT_STACK_COOLDOWN_FRAMES = 180
export const THUNDER_ENLIGHTENMENT_DURATION_FRAMES = 900
export const THUNDER_ENLIGHTENMENT_DEEPDAZE_EXTENSION_FRAMES = 300

// Client locale text (2026-09-04): Binge Points start at 60, cap 200, Tipsy
// from 100, Deepdaze from 200 for 5 s (10 s with the always-on talent) and
// clear the counter when it lapses, the Three Stars path passive refunding
// 60. Binge Marks (client buff 200264) hold 50 for 10 s. Carouse lasts 20 s
// at the talent's top rank. Clash-toast lasts 15 s at
// ultimate rank 5. Cloudvault holds 2 stacks until Hero's Blood - Inebriate
// ends. Draught stacks once per 3 s of direct damage to 12, which grants
// Thunder Enlightenment - Draught for 15 s, refills Binge Points and extends
// an active Deepdaze by 5 s (client buff rows 1730115, 1730116, 1730123);
// Build Momentum opens the fight with up to 9 stacks.
export const BAMBOOCUT_DRAUGHT_GATES: readonly Buff[] = [
  defineGateBuff({
    id: STATUS.bingePoints,
    classId: CLASS_ID,
    name: "Binge Points",
    scope: "player",
    activation: "triggered",
    durationFrames: BINGE_POINTS_DURATION_FRAMES,
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
    onExpire: { targetId: STATUS.bingePoints, stacks: 60 },
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.carouse,
    classId: CLASS_ID,
    name: "Carouse",
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
    scope: "player",
    activation: "triggered",
    durationFrames: CLOUDVAULT_DURATION_FRAMES,
    effects: [],
    maxStacks: 2,
    stackScaling: "flat",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.draught,
    classId: CLASS_ID,
    name: "Draught",
    scope: "player",
    activation: "triggered",
    durationFrames: DRAUGHT_DURATION_FRAMES,
    effects: [],
    maxStacks: 12,
    stackScaling: "flat",
    defaultOpeningStacks: 9,
    stacksPerDamagingHit: { cooldownFrames: DRAUGHT_STACK_COOLDOWN_FRAMES },
    onMaxStacks: [
      applyBuff({ target: STATUS.thunderEnlightenment, stacks: 1 }),
      applyBuff({ target: STATUS.bingePoints, stacks: 200 }),
      applyBuff({
        target: STATUS.inebriateDeepdaze,
        stacks: 1,
        extendFrames: THUNDER_ENLIGHTENMENT_DEEPDAZE_EXTENSION_FRAMES,
        extendOnly: true,
      }),
      applyBuff({ target: STATUS.draught, stacks: -12 }),
    ],
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
  defineGateBuff({
    id: STATUS.thunderEnlightenment,
    classId: CLASS_ID,
    name: "Thunder Enlightenment - Draught",
    scope: "player",
    activation: "triggered",
    durationFrames: THUNDER_ENLIGHTENMENT_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  }),
]
