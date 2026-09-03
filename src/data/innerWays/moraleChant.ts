import { declareMechanic } from "../../engine/mechanics"
import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER, INNER_WAY_NODE } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import { moraleChantMechanic } from "./moraleChantMechanic"

export const moraleChant = defineInnerWay({
  id: INNER_WAY_ID.moraleChant,
  name: "Morale Chant",
  selectableTiers: [6, 5],
  confirmedBreakthrough: 17,
  buffParam: PARAM.moraleChant,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackFiveStar },
    5: { panelStats: { directCritRate: 0.046 } },
    6: { nodes: [INNER_WAY_NODE.yiRiver] },
  },
  mechanics: [declareMechanic(moraleChantMechanic())],
})
