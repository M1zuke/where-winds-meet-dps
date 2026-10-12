import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"

// In-game values as of 2026-10-12: Candlelight needs one hit to strike several
// targets, which a single target never satisfies, so only the panel lines act.
export const lightAnew = defineInnerWay({
  id: INNER_WAY_ID.lightAnew,
  name: "Light Anew",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.bamboocutAttackMinFourStar },
    5: { panelStats: { "bamboocut.penetration": 0.06 } },
  },
})
