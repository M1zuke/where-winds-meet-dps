import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { throatPierced } from "./throatPierceBuffs/throatPierced"

export const throatPierce = defineInnerWay({
  id: INNER_WAY_ID.throatPierce,
  name: "Throat-Pierce",
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.throatPierced,
  panelStats: {
    "primaryAttr.max": 26.5,
    "primaryAttr.min": 13.3,
    "primaryAttr.penetration": 0.06,
  },
  buffDefs: [throatPierced],
})
