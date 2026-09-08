import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { throatPierced } from "./throatPierceBuffs/throatPierced"

export const throatPierce = defineInnerWay({
  id: INNER_WAY_ID.throatPierce,
  name: "Throat-Pierce",
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.throatPierced,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.attributeAttackFourStar },
    5: { panelStats: { "primaryAttr.penetration": 0.06 } },
  },
  buffDefs: [throatPierced],
})
