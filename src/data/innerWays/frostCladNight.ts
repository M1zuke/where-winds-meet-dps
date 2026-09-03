import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { forgetfulness } from "./frostCladNightBuffs/forgetfulness"
import { frostCladSnowbreak } from "./frostCladNightBuffs/frostCladSnowbreak"
import { frostCladSnowbreakIPConsume } from "./frostCladNightBuffs/frostCladSnowbreakIPConsume"
import { frostCladSnowbreakT6 } from "./frostCladNightBuffs/frostCladSnowbreakT6"
import { innerPassion } from "./frostCladNightBuffs/innerPassion"

export const frostCladNight = defineInnerWay({
  id: INNER_WAY_ID.frostCladNight,
  name: "Frost-Clad Night",
  legacyNames: ["Frostwhite Night"],
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.frostCladNight,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackMinFiveStar },
    5: { panelStats: { directCritRate: 0.046 } },
  },
  buffDefs: [
    innerPassion,
    frostCladSnowbreak,
    frostCladSnowbreakT6,
    frostCladSnowbreakIPConsume,
    forgetfulness,
  ],
})
