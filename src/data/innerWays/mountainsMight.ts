import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// Tier 1 wording from the client localization (2026-08-15): hitting a boss unit
// with any Bellstrike - Splendor Martial Art Skill inflicts Qi Imbalance.
//
// The in-game panel reads 10.9 to 21.7 attribute attack at solo mode level 14
// (2026-05); scaled to the level the shipped inner ways store, that is Throat
// Pierce's stored pair exactly.
export const mountainsMight = defineInnerWay({
  id: INNER_WAY_ID.mountainsMight,
  name: "Mountain's Might",
  selectableTiers: [6, 5, 1],
  buffParam: PARAM.mountainsMight,
  panelStats: {
    "primaryAttr.min": 12.7,
    "primaryAttr.max": 25.3,
  },
  tiers: {
    1: { nodes: [INNER_WAY_NODE.qiImbalanceOnMartialArt] },
  },
})
