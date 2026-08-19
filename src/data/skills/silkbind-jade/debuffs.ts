import { defineDebuff } from "../../../definitions/skills/skillDef"
import { DEBUFF } from "./ids"
import type { Debuff } from "../../../engine/debuff"

const CLASS_ID = "silkbindJade"

export const umbDrone26Hit = defineDebuff({
  id: DEBUFF.umbDrone26Hit,
  classId: CLASS_ID,
  name: "Umb Drone 26-hit marker",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const DEBUFFS: readonly Debuff[] = [umbDrone26Hit]