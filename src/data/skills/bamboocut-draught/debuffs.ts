import { defineDebuff } from "../../../definitions/skills/skillDef"
import type { Debuff } from "../../../engine/debuff"
import { BUFF } from "../buffs/ids"
import { DEBUFF } from "./ids"

const CLASS_ID = "bamboocutDraught"

// 20% of the damage the marked target takes from Inebriate-enhanced skills is
// banked and dealt again as one strike when Hero's Blood hits it again or the
// mark lapses (in-game skill text, 2026-09-05).
export const drunkslay = defineDebuff({
  id: DEBUFF.drunkslay,
  classId: CLASS_ID,
  name: "Drunkslay",
  activation: "triggered",
  durationFrames: 1200,
  effects: [],
  dot: null,
  echo: { share: 0.2, breakdownName: "Drunkslay State", skillType: "mindMethod" },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})

// While the mark holds, the attacker's physical and attribute damage scales
// rise by 2%. It is an attacker-side bonus, not a vulnerability on the target,
// so it multiplies the attack term rather than joining the target channel.
export const strayhunt = defineDebuff({
  id: DEBUFF.strayhunt,
  classId: CLASS_ID,
  name: "Strayhunt",
  activation: "triggered",
  durationFrames: 1200,
  effects: [
    { statKey: "physBoost", amount: 0.02 },
    { statKey: "attributeDamageBoost", amount: 0.02 },
  ],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})

// Inflicted by Primepick's guard-breaking jab for 20 s; together with
// Strayhunt the target takes +20% repeated damage, which Skyspeak tier 6
// makes Drunkslay count as (in-game state text, 2026-09-05).
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

export const DEBUFFS: readonly Debuff[] = [drunkslay, strayhunt, wildstride, bitterSeasonTick]
