import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { BUFF } from "../skills/buffs/ids"
import { concentrationAvailable, insightfulStrikeMechanic } from "./insightfulStrikeMechanic"
import { concentrationBuffDef } from "./insightfulStrikeConcentration"

// Deliberately maps no `buffParam`: every channel the `concentration` def
// names (`affinityDamageBoost`, `directAffinityRate`, `sustainDamageBoost`) is
// already carried by `insightfulStrikeMechanic.ts`, which is this inner way's
// only runtime model — see `insightfulStrikeConcentration.ts`.
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
  displayGates: [{ defId: BUFF.concentration, predicate: concentrationAvailable }],
  buffDefs: [concentrationBuffDef],
})
