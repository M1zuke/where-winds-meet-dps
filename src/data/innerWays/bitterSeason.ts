import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { defineInnerWay, innerWayHasNode } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE, type InnerWayNode } from "./ids"
import type { BitterSeasonTuning } from "../../engine/buffs/bitterSeason"
import { bitterSeasonMechanic } from "./bitterSeasonMechanic"

export const bitterSeason = defineInnerWay({
  id: INNER_WAY_ID.bitterSeason,
  name: "Bitter Season",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  tiers: {
    1: { nodes: [INNER_WAY_NODE.bitterSeasonStrongerDefenseReduction] },
    2: { panelStats: { precision: 0.069 } },
    4: { nodes: [INNER_WAY_NODE.bitterSeasonImprovedProcChance] },
    5: { panelStats: { physBoost: 0.025 } },
    6: { nodes: [INNER_WAY_NODE.bitterSeasonMaxStackPenetration] },
  },
  mechanics: [declareMechanic(bitterSeasonMechanic(), MECHANIC_ORDER.bitterSeason)],
})

export function bitterSeasonTuningAtTier(tier: number): BitterSeasonTuning {
  const has = (node: InnerWayNode) => innerWayHasNode(bitterSeason, tier, node)
  return {
    procChance: has(INNER_WAY_NODE.bitterSeasonImprovedProcChance) ? 0.15 : 0.1,
    defenseReductionPerStack: has(INNER_WAY_NODE.bitterSeasonStrongerDefenseReduction)
      ? 0.012
      : 0.006,
    // −10 target physical resistance, modelled as +10 player physical
    // penetration points (0.1 in the panel's fraction-of-100 unit) — target
    // pen resistance is zero for every target, so the two are numerically
    // equivalent (CLAUDE.md § "Calculation rules").
    physPenetrationAtMaxStacks: has(INNER_WAY_NODE.bitterSeasonMaxStackPenetration) ? 0.1 : 0,
  }
}
