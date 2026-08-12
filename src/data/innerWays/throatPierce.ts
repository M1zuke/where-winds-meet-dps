import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { throatPierced } from "./throatPierceBuffs/throatPierced"

export const throatPierce = defineInnerWay({
  id: INNER_WAY_ID.throatPierce,
  name: "Throat-Pierce",
  selectableTiers: [6, 5],
  buffParam: PARAM.throatPierced,
  panelStats: {
    "primaryAttr.max": 25.3,
    "primaryAttr.min": 12.7,
    "primaryAttr.penetration": 0.06,
  },
  buffDefs: [throatPierced],
})
