import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { mountainsMightBuff, mountainsMightPathQiImbalance } from "./mountainsMightBuffs"

// Tier 1 wording from the client localization (2026-08-15): hitting a boss unit
// with any Bellstrike - Splendor Martial Art Skill inflicts Qi Imbalance.
export const mountainsMight = defineInnerWay({
  id: INNER_WAY_ID.mountainsMight,
  name: "Mountain's Might",
  selectableTiers: [6, 5, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.mountainsMight,
  tiers: {
    1: { nodes: [INNER_WAY_NODE.qiImbalanceOnMartialArt] },
    3: { ladder: INNER_WAY_LADDER.attributeAttackFourStar },
    5: { panelStats: { "primaryAttr.penetration": 0.06 } },
  },
  buffDefs: [mountainsMightBuff, mountainsMightPathQiImbalance],
})
