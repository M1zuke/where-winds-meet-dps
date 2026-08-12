import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { insightfulStrikeMechanic } from "./insightfulStrikeMechanic"

// Deliberately maps no `buffParam` and declares no `buffDefs`: Concentration is
// a probability schedule, so `insightfulStrikeMechanic.ts` is this inner way's
// whole runtime model, and it carries its own Skill Editor row.
export const insightfulStrike = defineInnerWay({
  id: INNER_WAY_ID.insightfulStrike,
  name: "Insightful Strike",
  selectableTiers: [6, 5],
  panelStats: {
    "phys.min": 22.3,
    "phys.max": 44.7,
    "phys.penetration": 0.051,
  },
  scalars: {
    dotDamageBoost: 0.1,
    allDamageBonus: 0.015,
  },
  tiers: {
    6: {
      nodes: [INNER_WAY_NODE.concentrationDotMultiplier, INNER_WAY_NODE.concentrationSustainPair],
    },
  },
  mechanics: [declareMechanic(insightfulStrikeMechanic(), MECHANIC_ORDER.concentration)],
})
