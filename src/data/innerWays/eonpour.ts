import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { eonpourInebriateDamage } from "./eonpourBuffs"
import { EONPOUR_GATES } from "./eonpourGates"

// Client locale text (2026-09-03); the tier-6 light-attack Binge Points
// bonus has no sourced figure, so its node is a bare marker. Panel lines
// read in game at breakthrough 17 (2026-09-03).
export const eonpour = defineInnerWay({
  id: INNER_WAY_ID.eonpour,
  name: "Eonpour",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.eonpour,
  tiers: {
    1: { nodes: [INNER_WAY_NODE.dragonquenchUnlock] },
    2: { ladder: INNER_WAY_LADDER.weaponAttackMinFiveStar },
    5: { panelStats: { directCritRate: 0.046 } },
    6: { nodes: [INNER_WAY_NODE.lightAttackBingeBonus] },
  },
  buffDefs: [eonpourInebriateDamage],
  gateBuffs: EONPOUR_GATES,
})
