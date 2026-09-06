import { defineInnerWay } from "../../definitions/innerWays/innerWayDef"
import { INNER_WAY_ID, INNER_WAY_LADDER } from "./ids"
import { PARAM } from "../skills/buffs/ids"
import {
  mistwingAllTypePenetration,
  mistwingInebriatePenetration,
  mistwingPhysicalPenetration,
} from "./mistwingBuffs"

// In-game inner-way text (2026-09-06): the missing-HP and enhancement
// scaling has no target-HP state to read and is deliberately absent. The
// tier-5 panel line was read in game at breakthrough 17 (2026-09-03).
export const mistwing = defineInnerWay({
  id: INNER_WAY_ID.mistwing,
  name: "Mistwing",
  selectableTiers: [6, 5, 4, 3, 2, 1],
  confirmedBreakthrough: 17,
  buffParam: PARAM.mistwing,
  tiers: {
    2: { ladder: INNER_WAY_LADDER.weaponAttackFourStar },
    5: { panelStats: { physBoost: 0.025 } },
  },
  buffDefs: [mistwingPhysicalPenetration, mistwingAllTypePenetration, mistwingInebriatePenetration],
})
