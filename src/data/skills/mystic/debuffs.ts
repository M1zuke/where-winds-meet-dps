import { defineDebuff, levelScaled } from "../../../definitions/skills/skillDef"
import type { Debuff } from "../../../engine/debuff"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { BUFF } from "../buffs/ids"
import { ROLE } from "../ids"
import { DEBUFF } from "./ids"
import { LEVEL_ROWS } from "./levelRows"
import { WINEBOUND_MYSTIC_RECEIVES } from "../wineboundReceives"

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
    ...levelScaled(LEVEL_ROWS.toadPoisonDot),
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
    ...levelScaled(LEVEL_ROWS.toadPoisonFuryDot),
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
    ...levelScaled(LEVEL_ROWS.combustionDot),
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
  receives: [BUFF.bellstrikeUmbraBleedingDamage, BUFF.soulShaken, ...WINEBOUND_MYSTIC_RECEIVES],
})

export const smolder = defineDebuff({
  id: DEBUFF.smolder,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Smolder",
  breakdownName: "Smolder",
  activation: "triggered",
  durationFrames: 234,
  effects: [],
  dot: {
    tickIntervalFrames: 30,
    // In-game cadence as of 2026-09-10: ticks on application, then every half
    // second.
    firstTickOffsetFrames: 0,
    reschedulesPerTick: true,
    ...levelScaled(LEVEL_ROWS.smolderDot),
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
  receives: [BUFF.bellstrikeUmbraBleedingDamage, BUFF.soulShaken, ...WINEBOUND_MYSTIC_RECEIVES],
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
    ...levelScaled(LEVEL_ROWS.fluteStrike),
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

// In-game values as of 2026-11-10: a 30 s state marker on the caster, kept as
// a status because Dragon's Breath's hit variants read it. The Drunken Poet cast
// and a slow-form Dragon's Breath open it.
export const intoxicated = defineDebuff({
  id: DEBUFF.intoxicated,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Intoxicated",
  activation: "triggered",
  durationFrames: 1800,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-11-10T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})

export const MYSTIC_DEBUFFS: readonly Debuff[] = [
  toadPoison,
  combustion,
  smolder,
  fluteRipple,
  toadPoisonFury,
  intoxicated,
]
