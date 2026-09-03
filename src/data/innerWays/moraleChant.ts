import { declareMechanic } from "../../engine/mechanics"
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { moraleChantMechanic } from "./moraleChantMechanic"

export const moraleChant = defineInnerWay({
  id: INNER_WAY_ID.moraleChant,
  name: "Morale Chant",
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.moraleChant,
  panelStats: {
    "phys.max": 51.9,
    "phys.min": 25.9,
    directCritRate: 0.046,
  },
  tiers: {
    6: { nodes: [INNER_WAY_NODE.yiRiver] },
  },
  mechanics: [declareMechanic(moraleChantMechanic())],
})
