import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { burningHeartIPConsume } from "./steadfastDevotionBuffs/burningHeartIPConsume"
import { chargeEnhancement } from "./steadfastDevotionBuffs/chargeEnhancement"
import { mountainSplitter } from "./steadfastDevotionBuffs/mountainSplitter"

export const steadfastDevotion = defineInnerWay({
  id: INNER_WAY_ID.steadfastDevotion,
  name: "Steadfast Devotion",
  legacyNames: ["Lone Loyalty"],
  selectableTiers: [6, 5],
  buffParam: PARAM.steadfastDevotion,
  panelStats: {
    critRate: 0.077,
    critDamageBoost: 0.04,
  },
  buffDefs: [mountainSplitter, chargeEnhancement, burningHeartIPConsume],
})
