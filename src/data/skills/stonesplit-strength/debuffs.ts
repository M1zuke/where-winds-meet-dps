import { defineDebuff } from "../../../definitions/skills/skillDef"
import { BUFF } from "../buffs/ids"
import { DEBUFF } from "./ids"
import type { Debuff } from "../../../engine/debuff"

const CLASS_ID = "stonesplitStrength"

export const toadPoison = defineDebuff({
  id: DEBUFF.toadPoison,
  classId: CLASS_ID,
  name: "Toad Poison",
  activation: "triggered",
  durationFrames: 601,
  effects: [],
  dot: {
    tickIntervalFrames: 300,
    physMultiplier: 1.6216,
    physFixed: 219,
    attributeMultiplier: 1.6216,
    attributeFixed: 0,
    attributeAttack: "Stonesplit",
    skillType: "sustain",
    mysticCategory: "area-debuff",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const combustion = defineDebuff({
  id: DEBUFF.combustion,
  classId: CLASS_ID,
  name: "Combustion",
  activation: "triggered",
  durationFrames: 481,
  effects: [],
  dot: {
    tickIntervalFrames: 30,
    physMultiplier: 0.2953,
    physFixed: 39,
    attributeMultiplier: 0.2953,
    attributeFixed: 0,
    attributeAttack: "Stonesplit",
    skillType: "sustain",
    mysticCategory: "burst",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const fluteRipple = defineDebuff({
  id: DEBUFF.fluteRipple,
  classId: CLASS_ID,
  name: "Flute Ripple",
  activation: "triggered",
  durationFrames: 751,
  effects: [],
  dot: {
    tickIntervalFrames: 150,
    physMultiplier: 1.4696,
    physFixed: 310,
    attributeMultiplier: 2.2044,
    attributeFixed: 0,
    attributeAttack: "Stonesplit",
    skillType: "sustain",
    mysticCategory: "area-damage",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  receives: [BUFF.soulShaken],
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
    attributeAttack: "Stonesplit",
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
  receives: [BUFF.soulShaken],
})

export const DEBUFFS: readonly Debuff[] = [toadPoison, combustion, fluteRipple, bitterSeasonTick]
