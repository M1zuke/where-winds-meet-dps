import { defineDebuff } from "../../../definitions/skills/skillDef"
import { BUFF } from "../buffs/ids"
import { DEBUFF } from "./ids"
import type { Debuff } from "../../../engine/debuff"

const CLASS_ID = "bellstrikeSplendor"

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
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    weaponOrAttribute: null,
    mysticCategory: null,
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const DEBUFFS: readonly Debuff[] = [bitterSeasonTick]
