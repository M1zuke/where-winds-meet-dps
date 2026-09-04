import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { drunkslayEcho } from "./skyspeakBuffs"
import { SKYSPEAK_GATES } from "./skyspeakGates"

// Client locale text (2026-09-04): tier 1 unlocks Hero's Blood - Inebriate,
// tier 3 lengthens Deepdaze to the same 10 s the always-on talent already
// gives the gate, tier 4 adds Drunkslay, tier 6 counts Drunkslay as repeated
// damage for the Wildstride + Strayhunt bonus, which has no built producer
// of Wildstride. Panel lines read in game at breakthrough 17 (2026-09-03).
export const skyspeak = defineInnerWay({
  id: INNER_WAY_ID.skyspeak,
  name: "Skyspeak",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.skyspeak,
  tiers: {
    1: { nodes: [INNER_WAY_NODE.heroSBloodInebriateUnlock] },
    2: { ladder: INNER_WAY_LADDER.critRateFourStar },
    3: { nodes: [INNER_WAY_NODE.deepdazeDuration] },
    5: { panelStats: { critDamageBoost: 0.04 } },
    6: { nodes: [INNER_WAY_NODE.drunkslayRepeatedDamage] },
  },
  buffDefs: [drunkslayEcho],
  gateBuffs: SKYSPEAK_GATES,
})
