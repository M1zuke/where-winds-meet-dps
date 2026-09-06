import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { volutefitWineboundDamage } from "./volutefitBuffs"
import { VOLUTEFIT_GATES } from "./volutefitGates"

// Every rung but the tier-1 and tier-6 Winebound-skill bonuses is damage taken
// and deliberately absent. Its two panel lines read as Formless attack and
// Formless penetration, which are the active-attribute stats and so land on
// whichever attribute the wearer's path uses.
export const volutefit = defineInnerWay({
  id: INNER_WAY_ID.volutefit,
  name: "Volutefit",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.volutefit,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.attributeAttackFiveStar },
    5: { panelStats: { "primaryAttr.penetration": 0.06 } },
  },
  buffDefs: [volutefitWineboundDamage],
  gateBuffs: VOLUTEFIT_GATES,
})
