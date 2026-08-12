import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { STATUS } from "../../skills/stonesplit-strength/ids"

export const DREAD_DURATION_FRAMES = 420
export const FEARFUL_BLADE_DURATION_FRAMES = 900

export const DREAD_BUFF_ID = STATUS.dread
export const FEARFUL_BLADE_BUFF_ID = STATUS.fearfulBlade

export const STONESPLIT_STRENGTH_GATES: Buff[] = [
  defineGateBuff({
    id: DREAD_BUFF_ID,
    classId: "stonesplitStrength",
    name: "Dread",
    scope: "player",
    activation: "triggered",
    durationFrames: DREAD_DURATION_FRAMES,
    effects: [{ statKey: "allDamageBoost", amount: 0.12 }],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-08-09T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
  }),
  defineGateBuff({
    id: FEARFUL_BLADE_BUFF_ID,
    classId: "stonesplitStrength",
    name: "Fearful Blade",
    scope: "team",
    activation: "triggered",
    durationFrames: FEARFUL_BLADE_DURATION_FRAMES,
    effects: [
      { statKey: "allDamageBoost", amount: 0.08 },
      { statKey: "bellstrike.penetration", amount: 0.16 },
      { statKey: "stonesplit.penetration", amount: 0.16 },
      { statKey: "silkbind.penetration", amount: 0.16 },
      { statKey: "bamboocut.penetration", amount: 0.16 },
    ],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-08-09T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
  }),
]
