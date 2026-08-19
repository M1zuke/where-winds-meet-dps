import { defineDebuff } from "../../../definitions/skills/skillDef"
import { DEBUFF } from "./ids"
import type { Debuff } from "../../../engine/debuff"

const CLASS_ID = "silkbindJade"

export const umbDrone26Hit = defineDebuff({
  id: DEBUFF.umbDrone26Hit,
  classId: CLASS_ID,
  name: "Umb Drone 26-hit marker",
  activation: "triggered",
  durationFrames: 300,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
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
    attributeAttack: "Silkbind",
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

// Blossom Barrage: "Hitting a target with Umbrella Martial applies the
// Combo effect: Target takes 20% Projectile Damage for 15s." Per Mun's
// Ultimate Umbrella Guide (Patch 2.0): the base values are 20% damage
// and 15s duration — both unconditional when Blossom Barrage is slotted,
// no tier raise. An earlier revision encoded 10% / 10s (a wiki misread).
// Note: `BLOSSOM_BARRAGE_COMBO_DURATION_SEC` is exported from
// `blossomBarrage.ts` but currently has no consumer; if a future patch
// introduces a real tier raise this debuff's durationFrames will need
// to be wired through `innerWayTier` rather than relying on the constant.
export const combo = defineDebuff({
  id: DEBUFF.combo,
  classId: CLASS_ID,
  name: "Combo",
  activation: "triggered",
  durationFrames: 900,
  effects: [{ statKey: "target.generalDamageTaken", amount: 0.2 }],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})

// Breaking Point: stack-based buff. Each stack of Collapse grants +5
// Physical Penetration and +5% Critical Damage. Up to 3 stacks (5 at TB4),
// 3s duration (5s at TB1). Placeholder amounts reflect the base per-stack
// values; tier stack-cap and duration live on the inner-way.
export const collapse = defineDebuff({
  id: DEBUFF.collapse,
  classId: CLASS_ID,
  name: "Collapse",
  activation: "triggered",
  durationFrames: 180,
  effects: [
    { statKey: "phys.penetration", amount: 0.0005 },
    { statKey: "critDamageBoost", amount: 0.05 },
  ],
  dot: null,
  maxStacks: 3,
  stackScaling: "flat",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})

// Breaking Point: auxiliary stack-based buff that tier effects (TB1 "extend
// duration to 5s", TB3 "1 stack on hitting Exhausted", TB4 "max 5 stacks",
// TB6 "5 stacks on Perfect Dodge") drive. Multiplexed with Collapse: the
// Disintegration stack count is what actually grants the effects.
export const disintegration = defineDebuff({
  id: DEBUFF.disintegration,
  classId: CLASS_ID,
  name: "Disintegration",
  activation: "triggered",
  durationFrames: 180,
  effects: [],
  dot: null,
  maxStacks: 3,
  stackScaling: "flat",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})

// Breaking Point's trigger target state: "Dealing Critical Damage to an enemy
// under the Spirit Depletion state grants you 1 stack of Collapse." Modeled
// as a target-side debuff that the inner-way's mechanic seeds on the target
// so it can read `hasSpiritDepletion()` on hits.
export const spiritDepletion = defineDebuff({
  id: DEBUFF.spiritDepletion,
  classId: CLASS_ID,
  name: "Spirit Depletion",
  activation: "triggered",
  durationFrames: 600,
  effects: [],
  dot: null,
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})

// Thunderous Bloom: "When you move more than 15 meters within 3 seconds,
// gain Spring Thunder: The next 3 Heavy Attacks or Airborne Heavy Attacks
// within 12 seconds gain 15% DMG Bonus. This effect may trigger once every
// 15 seconds." Placeholder stacks = 3 (TB4 raises to 5), amount = 0.15
// (TB5 adds 0.025), duration = 12s, maxStacks = 3 reflects the "next 3"
// charge. The buff engine handles the 15-second ICD.
export const springThunder = defineDebuff({
  id: DEBUFF.springThunder,
  classId: CLASS_ID,
  name: "Spring Thunder",
  activation: "triggered",
  durationFrames: 720,
  effects: [{ statKey: "physBoost", amount: 0.15 }],
  dot: null,
  maxStacks: 3,
  stackScaling: "flat",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})

export const DEBUFFS: readonly Debuff[] = [
  umbDrone26Hit,
  bitterSeasonTick,
  combo,
  collapse,
  disintegration,
  spiritDepletion,
  springThunder,
]
