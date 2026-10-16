import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { gourdTossMoonShatterResetBuffDef, gourdTossThunderBuffDef } from "./gourdTossBuffs"

// Inkwell Fan's own inner way, built around Peak's Springless Silence's
// charges and cooldown refunds. In-game values as of 2026-10-15.
export const gourdToss = defineInnerWay({
  id: INNER_WAY_ID.gourdToss,
  name: "Gourd Toss",
  selectableTiers: [6],
  confirmedBreakthrough: 21,
  buffParam: PARAM.gourdToss,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.precisionFourStar },
    5: { panelStats: { "primaryAttr.penetration": 0.06 } },
  },
  buffDefs: [gourdTossThunderBuffDef, gourdTossMoonShatterResetBuffDef],
})
