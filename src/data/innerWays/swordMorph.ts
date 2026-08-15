import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// Tier 3 and Tier 6 wording from the client localization (2026-08-15): the
// multiple sword energy attacks never Abrade an Exhausted unit and the third
// is a guaranteed Affinity hit against one; Tier 6 grants Energy Surge, which
// releases them again without charging.
//
// The in-game panel reads 63.9 max physical at solo mode level 14 (2026-05).
// Every shipped inner way sits a level above that — Morale Chant's panel 42.5
// is stored as 49.6 — and this pair matches Sword Horizon's exactly, which is
// where the stored figure comes from. Percentages do not move with the level.
export const swordMorph = defineInnerWay({
  id: INNER_WAY_ID.swordMorph,
  name: "Sword Morph",
  selectableTiers: [6, 5, 3],
  buffParam: PARAM.swordMorph,
  panelStats: {
    "phys.max": 74.4,
    directAffinityRate: 0.023,
  },
  tiers: {
    3: { nodes: [INNER_WAY_NODE.exhaustedSwordEnergyOutcome] },
    6: { nodes: [INNER_WAY_NODE.energySurge] },
  },
})
