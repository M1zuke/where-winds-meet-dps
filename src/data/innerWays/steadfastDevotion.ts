import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { burningHeartIPConsume } from "./steadfastDevotionBuffs/burningHeartIPConsume"
import { chargeEnhancement } from "./steadfastDevotionBuffs/chargeEnhancement"
import { mountainSplitter } from "./steadfastDevotionBuffs/mountainSplitter"

export const steadfastDevotion = defineInnerWay({
  id: INNER_WAY_ID.steadfastDevotion,
  name: "Steadfast Devotion",
  legacyNames: ["Lone Loyalty"],
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.steadfastDevotion,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.critRateFourStar },
    5: { panelStats: { critDamageBoost: 0.04 } },
  },
  buffDefs: [mountainSplitter, chargeEnhancement, burningHeartIPConsume],
})
