import type { InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { bitterSeason } from "./bitterSeason"
import { insightfulStrike } from "./insightfulStrike"
import { moraleChant } from "./moraleChant"
import { swordHorizon } from "./swordHorizon"
import { wolfchasersArt } from "./wolfchasersArt"

// Order is load-bearing: the context-scalar sum and
// `innerWayTargetDefenseMultiplier`'s first-match both iterate this array,
// and float addition is not associative.
export const INNER_WAYS: readonly InnerWayDef[] = [
  bitterSeason,
  insightfulStrike,
  moraleChant,
  swordHorizon,
  wolfchasersArt,
]
