import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"

// In-game values as of 2026-11-10: the damage-taken reduction while evading,
// the Max HP heal and the extended Invincibility duration have no player HP or
// incoming-damage resource in this app to apply to, so only the Endurance
// refund on `perfect-dodge*.ts` is modelled. No rank changes a dodge's own
// Endurance cost.
export const evasiveCharge = defineInnerWay({
  id: INNER_WAY_ID.evasiveCharge,
  name: "Evasive Charge",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 21,
  buffParam: PARAM.evasiveCharge,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.precisionFourStar },
  },
})
