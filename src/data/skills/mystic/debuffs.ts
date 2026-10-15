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
  tags: [ROLE.toadVenom],
  dot: {
    tickIntervalFrames: 300,
    physMultiplier: 1.622006,
    physFixed: 254.7984,
    // In-game values as of 2026-10-15.
    attributeMultiplier: 2.433009,
    attributeFixed: 0,
    attributeAttack: "",
    // In-game hit type as of 2026-09-24: a direct hit, not a DoT tick.
    skillType: "mystic",
    directHit: true,
    mysticCategory: "area-debuff",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
  receives: [],
})

export const toadPoisonFury = defineDebuff({
  id: DEBUFF.toadPoisonFury,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Toad Poison (Fury)",
  activation: "triggered",
  durationFrames: 601,
  effects: [],
  tags: [ROLE.toadVenom],
  dot: {
    tickIntervalFrames: 300,
    // In-game values as of 2026-10-15 (level 176).
    physMultiplier: 1.530217,
    physFixed: 242.4702,
    attributeMultiplier: 2.295326,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "mystic",
    directHit: true,
    mysticCategory: "area-debuff",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
  receives: [],
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
    // In-game cadence as of 2026-09-10: ticks on application.
    firstTickOffsetFrames: 0,
    reschedulesPerTick: true,
    physMultiplier: 0.295506,
    physFixed: 46.75,
    // In-game values as of 2026-10-15.
    attributeMultiplier: 0.443259,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "burst",
    // In-game values as of 2026-09-25.
    qiRate: 0.6,
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
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
    // In-game cadence as of 2026-09-10: ticks on application, then every half
    // second.
    firstTickOffsetFrames: 0,
    reschedulesPerTick: true,
    physMultiplier: 0.235818,
    physFixed: 37.6455,
    // In-game values as of 2026-10-15.
    attributeMultiplier: 0.353727,
    attributeFixed: 0,
    attributeAttack: "",
    skillType: "sustain",
    mysticCategory: "burst",
    // In-game values as of 2026-09-25.
    qiRate: 0.6,
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
  receives: [BUFF.bellstrikeUmbraBleedingDamage, BUFF.soulShaken],
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
    // Pulses on its own schedule rather than re-arming a tick timer — in-game
    // tick counts as of 2026-09-10.
    reschedulesPerTick: false,
    physMultiplier: 1.483296,
    physFixed: 330.4793,
    attributeMultiplier: 2.224944,
    attributeFixed: 0,
    attributeAttack: "",
    // In-game hit type as of 2026-09-24: a direct hit, not a DoT tick.
    skillType: "mystic",
    directHit: true,
    mysticCategory: "area-damage",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
  receives: [],
})

export const MYSTIC_DEBUFFS: readonly Debuff[] = [
  toadPoison,
  combustion,
  smolder,
  fluteRipple,
  toadPoisonFury,
]
