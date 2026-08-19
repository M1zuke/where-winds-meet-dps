// Breaking Point — Inner Way (Silkbind - Jade). Wiki spec:
//   Base:  Dealing Critical Damage to an enemy under Spirit Depletion grants
//          1 stack of Collapse. Each stack grants +5 Phys Pen and +5% Crit
//          Damage. Stacks up to 3, lasting 3 seconds.
//   Tier 1: Disintegration duration 3s → 5s.
//   Tier 2: Precision Rate based on Solo Mode Level.
//   Tier 3: Hitting an Exhausted enemy grants 1 stack of Disintegration.
//   Tier 4: Max Disintegration stacks 3 → 5.
//   Tier 5: Direct Crit Rate +4.1%.
//   Tier 6: Perfect Dodge grants 5 stacks of Disintegration. ICD 15s.
//
// Placeholder (validated: false). The Collapse / Disintegration / Spirit
// Depletion debuffs and the Perfect-Dodge trigger all live in the silkbindJade
// class's debuffs and inner-way mechanic. This file holds the tier table.
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"

export const BREAKING_POINT_COLLAPSE_STACKS_BASE = 3
export const BREAKING_POINT_COLLAPSE_STACKS_T4 = 5
export const BREAKING_POINT_DISINTEGRATION_DURATION_BASE_SEC = 3
export const BREAKING_POINT_DISINTEGRATION_DURATION_T1_SEC = 5
export const BREAKING_POINT_PHYS_PEN_PER_STACK = 0.05
export const BREAKING_POINT_CRIT_DAMAGE_PER_STACK = 0.05
export const BREAKING_POINT_DIRECT_CRIT_T5 = 0.041
export const BREAKING_POINT_PRECISION_T2_PER_LEVEL = 0.014
export const BREAKING_POINT_PERFECT_DODGE_GRANT_T6 = 5
export const BREAKING_POINT_PERFECT_DODGE_ICD_SEC = 15

export const breakingPoint = defineInnerWay({
  id: INNER_WAY_ID.breakingPoint,
  name: "Breaking Point",
  legacyNames: [],
  selectableTiers: [6, 5, 4, 3, 2, 1],
  // Tier 1: Disintegration duration 3s → 5s.
  // Tier 2: Precision Rate scales with Solo Mode Level (1.4% per level).
  // Tier 3: stack on Exhausted (brokered by the mechanic; no panel stat).
  // Tier 4: stack cap 3 → 5.
  // Tier 5: direct crit rate +4.1%.
  // Tier 6: Perfect-Dodge grant 5 stacks, ICD 15s.
  tiers: {
    1: { nodes: [INNER_WAY_NODE.breakingPointExtendedDuration] },
    2: {
      panelStats: { precision: BREAKING_POINT_PRECISION_T2_PER_LEVEL },
      // The 0.014 precision value is a PER-LEVEL coefficient, scaled by
      // `Inputs.soloModeLevel` at resolution time. A player at Solo Mode
      // Level 6 picks up 8.4% precision rate from this tier (see
      // `InnerWayTier.scaleBySoloModeLevel`).
      scaleBySoloModeLevel: true,
    },
    3: { nodes: [INNER_WAY_NODE.breakingPointExtendedDuration] },
    4: { nodes: [INNER_WAY_NODE.breakingPointHigherStackCap] },
    5: { panelStats: { directCritRate: BREAKING_POINT_DIRECT_CRIT_T5 } },
    6: { nodes: [INNER_WAY_NODE.breakingPointPerfectDodgeTrigger] },
  },
})
