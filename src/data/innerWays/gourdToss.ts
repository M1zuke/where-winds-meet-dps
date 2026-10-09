import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { gourdTossThunderBuffDef } from "./gourdTossBuffs"

// Inkwell Fan's own inner way, built around Peak's Springless Silence's
// charges and cooldown refunds — none of the cooldown/charge mechanics have
// an equivalent in this engine's rotation-authored casts, so only the
// damage-visible Thunder bonus is modelled. In-game values as of 2026-09-24.
export const gourdToss = defineInnerWay({
  id: INNER_WAY_ID.gourdToss,
  name: "Gourd Toss",
  selectableTiers: [6],
  confirmedBreakthrough: 17,
  buffParam: PARAM.gourdToss,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.precisionFourStar },
    5: { panelStats: { "primaryAttr.penetration": 0.06 } },
  },
  buffDefs: [gourdTossThunderBuffDef],
})
