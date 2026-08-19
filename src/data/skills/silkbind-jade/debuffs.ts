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
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})

export const bitterSeasonTick = defineDebuff({
  id: DEBUFF.bitterSeasonTick,
  classId: CLASS_ID,
  name: "Bitter Season Tick",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  dot: {
    tickIntervalFrames: 60,
    physMultiplier: 0.15,
    physFixed: 0,
    attributeMultiplier: 0.225,
    attributeFixed: 0,
    attributeAttack: "Silkbind",
    skillType: "sustain",
    weaponOrAttribute: null,
    mysticCategory: null,
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})

export const DEBUFFS: readonly Debuff[] = [umbDrone26Hit, bitterSeasonTick]
