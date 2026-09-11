import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { drunkslayEcho } from "./skyspeakBuffs"
import { SKYSPEAK_GATES } from "./skyspeakGates"

// In-game inner-way text (2026-09-06): tier 1 unlocks Hero's Blood -
// Inebriate and refunds 60 Binge Points when Deepdaze ends, tier 3 lengthens
// Deepdaze from its 5 s base to 10 s, tier 6 feeds Drunkslay's echo and
// counts it as repeated damage for the Wildstride + Strayhunt bonus, which
// has no built producer of Wildstride. Panel lines read in game at
// breakthrough 17 (2026-09-03).
export const skyspeak = defineInnerWay({
  id: INNER_WAY_ID.skyspeak,
  name: "Skyspeak",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.skyspeak,
  tiers: {
    1: { nodes: [INNER_WAY_NODE.heroSBloodInebriateUnlock, INNER_WAY_NODE.deepdazeRefund] },
    2: { ladder: INNER_WAY_LADDER.critRateFourStar },
    3: { nodes: [INNER_WAY_NODE.deepdazeDuration] },
    5: { panelStats: { critDamageBoost: 0.04 } },
    6: { nodes: [INNER_WAY_NODE.drunkslay] },
  },
  buffDefs: [drunkslayEcho],
  gateBuffs: SKYSPEAK_GATES,
})
