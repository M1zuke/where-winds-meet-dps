import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { battleAnthemChargedDamage, battleAnthemEnduranceBoost } from "./battleAnthemBuffs"

export const battleAnthem = defineInnerWay({
  id: INNER_WAY_ID.battleAnthem,
  name: "Battle Anthem",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.battleAnthem,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.affinityRateFourStar },
    5: { panelStats: { affinityDamageBoost: 0.052 } },
    6: { nodes: [INNER_WAY_NODE.battleAnthemEnduranceBonus] },
  },
  buffDefs: [battleAnthemChargedDamage, battleAnthemEnduranceBoost],
})
