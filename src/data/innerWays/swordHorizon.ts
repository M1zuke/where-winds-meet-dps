import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { SWORD_HORIZON_GATES } from "./swordHorizonZenith"

export const swordHorizon = defineInnerWay({
  id: INNER_WAY_ID.swordHorizon,
  name: "Sword Horizon",
  selectableTiers: [6, 5],
  buffParam: PARAM.swordHorizon,
  panelStats: {
    "phys.max": 74.4,
    directAffinityRate: 0.023,
  },
  tiers: {
    6: {
      nodes: [INNER_WAY_NODE.crosswindChargeRetention, INNER_WAY_NODE.dotDetonationRetention],
    },
  },
  gateBuffs: SWORD_HORIZON_GATES,
})
