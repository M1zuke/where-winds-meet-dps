import { defineDebuff } from "../../../definitions/skills/skillDef"
import { PARAM } from "../buffs/ids"
import { ROLE } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import type { Debuff } from "../../../engine/debuff"
import { requireInnerWayNodeTier } from "../../../definitions/innerWays/innerWayDef"
import { INNER_WAY_NODE } from "../../innerWays/ids"
import { swordHorizon } from "../../innerWays/swordHorizon"

const CLASS_ID = "bellstrikeUmbra"

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
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    mysticCategory: "area-debuff",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
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
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    mysticCategory: "burst",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  tags: [ROLE.combustion],
})

export const darkFire = defineDebuff({
  id: DEBUFF.darkFire,
  classId: CLASS_ID,
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
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    mysticCategory: "burst",
    count: 1,
    perStackShapes: null,
    perStackMultipliers: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})

export const fluteRipple = defineDebuff({
  id: DEBUFF.fluteRipple,
  classId: CLASS_ID,
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
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    mysticCategory: "area-damage",
    count: 1,
    perStackShapes: null,
  },
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})

export const bleedTick = defineDebuff({
  id: DEBUFF.bleedTick,
  classId: CLASS_ID,
  name: "Bleeding",
  activation: "triggered",
  durationFrames: 601,
  effects: [],
  dot: {
    tickIntervalFrames: 60,
    physMultiplier: 0.06864,
    physFixed: 0,
    attributeMultiplier: 0.10296,
    attributeFixed: 0,
    attributeAttack: "Bellstrike",
    skillType: "sustain",
    weaponOrAttribute: "Sword",
    count: 1,
    perStackShapes: null,
    perStackMultipliers: [2, 2.5, 3, 4, 5],
  },
  maxStacks: 5,
  stackScaling: "perStack",
  detonation: {
    skillId: SKILL.bleedDetonation,
    retainStacks: 0,
    retainParam: PARAM.swordHorizon,
    retainMinTier: requireInnerWayNodeTier(swordHorizon, INNER_WAY_NODE.dotDetonationRetention),
    retainParamStacks: 2,
  },
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  tags: [ROLE.bleedTick],
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
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})

// 5 %: the spear special's in-game hint, "Reduces Physical Defense by 5 %
// (25 % for players)" — the non-player figure, game client locale as of
// 2026-08-13. 10 s: the workbook states no duration, so it is read off its own
// defense-reduction buff slot (umbraWorkbook.wb1.5-lvl110, rotation sheet),
// flagged across five full runs of ten consecutive one-second bleed ticks.
export const defenseDown = defineDebuff({
  id: DEBUFF.defenseDown,
  classId: CLASS_ID,
  name: "Defense Down",
  activation: "triggered",
  durationFrames: 600,
  effects: [{ statKey: "target.defensePct", amount: -0.05 }],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
})

export const DEBUFFS: readonly Debuff[] = [
  toadPoison,
  combustion,
  darkFire,
  fluteRipple,
  bleedTick,
  bitterSeasonTick,
  defenseDown,
]
