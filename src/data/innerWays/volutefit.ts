import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { volutefitWineboundDamage } from "./volutefitBuffs"
import { VOLUTEFIT_GATES } from "./volutefitGates"

// In-game inner-way text (2026-09-06): every rung but the tier-1 and tier-6
// Winebound-skill bonuses is damage taken and deliberately absent. Panel
// lines not read.
export const volutefit = defineInnerWay({
  id: INNER_WAY_ID.volutefit,
  name: "Volutefit",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.volutefit,
  buffDefs: [volutefitWineboundDamage],
  gateBuffs: VOLUTEFIT_GATES,
})
