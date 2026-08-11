import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"

export const wolfchasersArt = defineInnerWay({
  id: INNER_WAY_ID.wolfchasersArt,
  name: "Wolfchaser's Art",
  selectableTiers: [6, 5],
  buffParam: PARAM.wolfchasersArt,
  panelStats: {
    affinityRate: 0.039,
    affinityDamageBoost: 0.052,
  },
  tiers: {
    6: { nodes: [INNER_WAY_NODE.soulShaken] },
  },
})
