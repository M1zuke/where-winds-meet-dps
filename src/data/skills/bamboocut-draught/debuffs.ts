import { defineDebuff } from "../../../definitions/skills/skillDef"
import type { Debuff } from "../../../engine/debuff"
import { BUFF } from "../buffs/ids"
import { DEBUFF } from "./ids"

const CLASS_ID = "bamboocutDraught"

export const drunkslay = defineDebuff({
  id: DEBUFF.drunkslay,
  classId: CLASS_ID,
  name: "Drunkslay",
  activation: "triggered",
  durationFrames: 1200,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
})

// +2% damage taken of every type (client locale text, 2026-09-04). The client
// states no duration; 20 s is provisional.
export const strayhunt = defineDebuff({
  id: DEBUFF.strayhunt,
  classId: CLASS_ID,
  name: "Strayhunt",
  activation: "triggered",
  durationFrames: 1200,
  effects: [{ statKey: "target.generalDamageTaken", amount: 0.02 }],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})

// Inflicted by Primepick's guard-breaking jab; together with Strayhunt the
// target takes +20% repeated damage, which Skyspeak tier 6 makes Drunkslay
// count as (client locale text, 2026-09-04). The client states no duration;
// 20 s is provisional.
export const wildstride = defineDebuff({
  id: DEBUFF.wildstride,
  classId: CLASS_ID,
  name: "Wildstride",
  activation: "triggered",
  durationFrames: 1200,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})

// "+10% damage taken for 10 s" when Tri-strike or Grounddrift lands during
// the target's stagger, which this model reads as the Qi-break window (client
// locale text, 2026-09-04).
export const nightwickExposure = defineDebuff({
  id: DEBUFF.nightwickExposure,
  classId: CLASS_ID,
  name: "Nightwick Exposure",
  activation: "triggered",
  durationFrames: 600,
  effects: [{ statKey: "target.generalDamageTaken", amount: 0.1 }],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
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
    attributeAttack: "Bamboocut",
    skillType: "sustain",
    weaponOrAttribute: null,
    mysticCategory: null,
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
  receives: [BUFF.soulShaken],
})

export const DEBUFFS: readonly Debuff[] = [
  drunkslay,
  strayhunt,
  wildstride,
  nightwickExposure,
  bitterSeasonTick,
]
