import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { battleAnthemChargedDamage, battleAnthemEnduranceBoost } from "./battleAnthemBuffs"

// Ladder read off the in-game tier panel (2026-08-15). The tiers this engine
// does not carry are Endurance economy: tier 3 restores Endurance on a Critical
// or Affinity charged hit, and tier 4 also raises charged skills' Endurance
// cost. Tier 2's Affinity Rate is a solo-mode-level value, scaled to the level
// the shipped inner ways store the same way Morale Chant's is.
export const battleAnthem = defineInnerWay({
  id: INNER_WAY_ID.battleAnthem,
  name: "Battle Anthem",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  buffParam: PARAM.battleAnthem,
  tiers: {
    2: { panelStats: { affinityRate: 0.0385 } },
    5: { panelStats: { affinityDamageBoost: 0.052 } },
    6: { nodes: [INNER_WAY_NODE.battleAnthemEnduranceBonus] },
  },
  buffDefs: [battleAnthemChargedDamage, battleAnthemEnduranceBoost],
})
