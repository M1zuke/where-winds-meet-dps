import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { starReacherBuffDef } from "./starReacherBuffs"

// `phys.penetration` is the panel's fraction-of-100 unit: 5.1 penetration
// points in game.
export const starReacher = defineInnerWay({
  id: INNER_WAY_ID.starReacher,
  name: "Star Reacher",
  selectableTiers: [6, 5, 2],
  confirmedBreakthrough: 17,
  buffParam: PARAM.starReacher,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackFourStar },
    5: { panelStats: { "phys.penetration": 0.051 } },
  },
  buffDefs: [starReacherBuffDef],
})
