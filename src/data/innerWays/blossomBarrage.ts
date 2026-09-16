import { defineInnerWay, type InnerWayDef } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { comboBuffDef, comboUmbLightBonusBuffDef } from "./blossomBarrageBuffs"

// The imported 20% / 15s Combo ladder is not fully verified for lower tiers.
// Global 2.0 T4/T5: https://www.wherewindsmeetgame.com/news/official/723update.html
export const blossomBarrage: InnerWayDef = defineInnerWay({
  id: INNER_WAY_ID.blossomBarrage,
  name: "Blossom Barrage",
  selectableTiers: [6, 5, 4, 2],
  confirmedBreakthrough: 17,
  buffParam: PARAM.blossomBarrage,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.critRateFiveStar },
    4: { nodes: [INNER_WAY_NODE.blossomBarrageSpringAwayBonus] },
    5: { panelStats: { directCritRate: 0.046 } },
  },
  buffDefs: [comboBuffDef(), comboUmbLightBonusBuffDef()],
})
