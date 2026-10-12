import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// In-game values as of 2026-10-12.
export const phantomRally = defineInnerWay({
  id: INNER_WAY_ID.phantomRally,
  name: "Phantom Rally",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.phantomRally,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.critRateFiveStar },
    5: { panelStats: { physBoost: 0.028 } },
  },
})
