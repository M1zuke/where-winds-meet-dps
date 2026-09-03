import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { battleAnthemChargedDamage, battleAnthemEnduranceBoost } from "./battleAnthemBuffs"

// The tiers this engine does not carry are Endurance economy (in-game tier
// panel, 2026-08-15): tier 3 restores Endurance on a Critical or Affinity
// charged hit, and tier 4 also raises charged skills' Endurance cost.
export const battleAnthem = defineInnerWay({
  id: INNER_WAY_ID.battleAnthem,
  name: "Battle Anthem",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.battleAnthem,
  tiers: {
    3: { ladder: INNER_WAY_LADDER.affinityRateFourStar },
    5: { panelStats: { affinityDamageBoost: 0.052 } },
    6: { nodes: [INNER_WAY_NODE.battleAnthemEnduranceBonus] },
  },
  buffDefs: [battleAnthemChargedDamage, battleAnthemEnduranceBoost],
})
