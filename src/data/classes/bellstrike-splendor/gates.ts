import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF } from "../../skills/buffs/ids"

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

export const BELLSTRIKE_SPLENDOR_GATES: readonly Buff[] = [ENERGY_SURGE_GRANT_GATE]
