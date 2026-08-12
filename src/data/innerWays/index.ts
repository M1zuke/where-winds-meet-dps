import type { InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { bitterSeason } from "./bitterSeason"
import { frostCladNight } from "./frostCladNight"
import { insightfulStrike } from "./insightfulStrike"
import { moraleChant } from "./moraleChant"
import { steadfastDevotion } from "./steadfastDevotion"
import { swordHorizon } from "./swordHorizon"
import { throatPierce } from "./throatPierce"
import { wolfchasersArt } from "./wolfchasersArt"

// Order is load-bearing: the context-scalar sum and
// `innerWayTargetDefenseMultiplier`'s first-match both iterate this array,
// and float addition is not associative.
export const INNER_WAYS: readonly InnerWayDef[] = [
  bitterSeason,
  frostCladNight,
  insightfulStrike,
  moraleChant,
  steadfastDevotion,
  swordHorizon,
  throatPierce,
  wolfchasersArt,
]
