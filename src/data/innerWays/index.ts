import type { InnerWayDef } from "./define"
import { bitterSeason } from "./bitterSeason"
import { insightfulStrike } from "./insightfulStrike"
import { moraleChant } from "./moraleChant"
import { swordHorizon } from "./swordHorizon"
import { wolfchasersArt } from "./wolfchasersArt"
import { registerMechanic } from "../../engine/mechanics"
import { setInnerWayDefs } from "./innerWayDefStore"

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

for (const def of INNER_WAYS) {
  for (const { mechanic, order } of def.mechanics ?? []) registerMechanic(mechanic, order)
}

setInnerWayDefs(INNER_WAYS)
