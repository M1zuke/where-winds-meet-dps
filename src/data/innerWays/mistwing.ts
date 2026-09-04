import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"

// Client locale text (2026-09-03): only each rung's flat penetration is
// authored; the missing-HP, enhancement and Inebriate scaling has no
// target-HP state to read and is deliberately absent. Panel lines read in
// game at breakthrough 17 (2026-09-03).
export const mistwing = defineInnerWay({
  id: INNER_WAY_ID.mistwing,
  name: "Mistwing",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  tiers: {
    1: { panelStats: { "phys.penetration": 0.03 } },
    2: { ladder: INNER_WAY_LADDER.weaponAttackFourStar },
    4: { panelStats: { "phys.penetration": 0.03, "primaryAttr.penetration": 0.06 } },
    5: { panelStats: { physBoost: 0.025 } },
  },
})
