import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// In-game values as of 2026-10-12.
export const songOfTang = defineInnerWay({
  id: INNER_WAY_ID.songOfTang,
  name: "Song of Tang",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.songOfTang,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.precisionFourStar },
    5: { panelStats: { critDamageBoost: 0.04 } },
  },
})
