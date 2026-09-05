import { defineDebuff } from "../../../definitions/skills/skillDef"
import type { Debuff } from "../../../engine/debuff"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { BUFF } from "../buffs/ids"
import { ROLE } from "../ids"
import { DEBUFF } from "./ids"

export const toadPoison = defineDebuff({
  id: DEBUFF.toadPoison,
  classId: MYSTIC_ARTS_CLASS_ID,
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
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "area-debuff",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const combustion = defineDebuff({
  id: DEBUFF.combustion,
  classId: MYSTIC_ARTS_CLASS_ID,
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
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "burst",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
  tags: [ROLE.combustion],
  receives: [BUFF.bellstrikeUmbraBleedingDamage, BUFF.soulShaken],
})

export const smolder = defineDebuff({
  id: DEBUFF.smolder,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Smolder",
  breakdownName: "Smolder",
  activation: "triggered",
  durationFrames: 240,
  effects: [],
  dot: {
    tickIntervalFrames: 30,
    physMultiplier: 0.236,
    physFixed: 44,
    attributeMultiplier: 0.354,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "burst",
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const fluteRipple = defineDebuff({
  id: DEBUFF.fluteRipple,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Flute Ripple",
  breakdownName: "Flute Chanting a Thousand Waves",
  activation: "triggered",
  durationFrames: 751,
  effects: [],
  dot: {
    tickIntervalFrames: 150,
    physMultiplier: 1.4614,
    physFixed: 300,
    attributeMultiplier: 2.1921,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "area-damage",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const MYSTIC_DEBUFFS: readonly Debuff[] = [toadPoison, combustion, smolder, fluteRipple]
