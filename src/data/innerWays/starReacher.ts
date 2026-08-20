import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { starReacherBuffDef } from "./starReacherBuffs"

// Tier 2's 5.1 physical penetration, confirmed against the in-game tier panel
// (2026-08-17). `phys.penetration` is the panel's fraction-of-100 unit, the
// same convention `bitterSeason.ts` and `insightfulStrike.ts` use for a flat
// penetration points figure.
export const starReacher = defineInnerWay({
  id: INNER_WAY_ID.starReacher,
  name: "Star Reacher",
  selectableTiers: [6, 5, 2],
  buffParam: PARAM.starReacher,
  tiers: {
    2: { panelStats: { "phys.min": 22.3, "phys.max": 44.7 } },
    5: { panelStats: { "phys.penetration": 0.051 } },
  },
  buffDefs: [starReacherBuffDef],
})
