import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"

const CLASS_ID = "bellstrikeSplendor"

// In-game values as of 2026-09-24: a multi-wave sword-energy release (a
// three-wave Vagrant Sword, its two-wave variant, the pre-pull form or
// Energy Surge itself) grants one Energy Surge, usable for this long.
export const ENERGY_SURGE_GRANT_DURATION_FRAMES = 300

export const ENERGY_SURGE_GRANT_GATE: Buff = defineGateBuff({
  id: BUFF.energySurgeGrant,
  classId: CLASS_ID,
  name: "Energy Surge Available",
  description: "Granted by a multi-wave sword-energy release; spent by casting Energy Surge.",
  scope: "player",
  activation: "triggered",
  durationFrames: ENERGY_SURGE_GRANT_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

// In-game values as of 2026-09-24: Sword Morph's multi-wave window. Held out
// of combat or on a Qi Shield too — neither has a build-side equivalent this
// engine can read, so only the window path is modelled.
export const MULTI_WAVE_WINDOW_DURATION_FRAMES = 300

export const MULTI_WAVE_WINDOW_GATE: Buff = defineGateBuff({
  id: BUFF.swordMorphMultiWaveWindow,
  classId: CLASS_ID,
  name: "Sword Morph Multi-Wave Window",
  description: "Vagrant Sword's level-2 release fires three waves while this holds.",
  scope: "player",
  activation: "triggered",
  durationFrames: MULTI_WAVE_WINDOW_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.swordMorph,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

export const BELLSTRIKE_SPLENDOR_GATES: readonly Buff[] = [
  ENERGY_SURGE_GRANT_GATE,
  MULTI_WAVE_WINDOW_GATE,
]
