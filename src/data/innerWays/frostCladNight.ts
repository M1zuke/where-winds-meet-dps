import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID } from "./ids"
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
  buffParam: PARAM.frostCladNight,
  panelStats: {
    "phys.min": 74.4,
    directCritRate: 0.046,
  },
  buffDefs: [
    innerPassion,
    frostCladSnowbreak,
    frostCladSnowbreakT6,
    frostCladSnowbreakIPConsume,
    forgetfulness,
  ],
})
