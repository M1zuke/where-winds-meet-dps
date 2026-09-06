import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { eonpourInebriateDamage } from "./eonpourBuffs"
import { EONPOUR_GATES } from "./eonpourGates"

// In-game inner-way text (2026-09-06): tier 1 also has light attacks,
// Bloombreak included, grant 2 Binge Points, tier 4 raises that to 3 in
// Carouse (5 on the sixth). Panel lines read in game at breakthrough 17
// (2026-09-03).
export const eonpour = defineInnerWay({
  id: INNER_WAY_ID.eonpour,
  name: "Eonpour",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.eonpour,
  tiers: {
    1: { nodes: [INNER_WAY_NODE.dragonquenchUnlock, INNER_WAY_NODE.lightAttackBingeBonus] },
    2: { ladder: INNER_WAY_LADDER.weaponAttackMinFiveStar },
    4: { nodes: [INNER_WAY_NODE.carouseLightAttackPoints] },
    5: { panelStats: { directCritRate: 0.046 } },
  },
  buffDefs: [eonpourInebriateDamage],
  gateBuffs: EONPOUR_GATES,
})
